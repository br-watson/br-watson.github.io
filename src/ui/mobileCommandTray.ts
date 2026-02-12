const MAX_CUSTOM_SUGGESTIONS = 6;

type TrayCommandKind = "simple" | "withArgs";
type SuggestionType = "history" | "completion";

export interface MobileTrayCommand {
	command: string;
	kind?: TrayCommandKind;
	label?: string;
}

interface CompletionTerminalLike {
	listCompletions: (value: string) => string[];
	listRecentHistory: (limit?: number) => string[];
}

interface MobileCommandTrayOptions {
	enabled: boolean;
	container: HTMLElement | null;
	list: HTMLElement | null;
	back: HTMLButtonElement | null;
	customTrigger: HTMLButtonElement | null;
	dialog: HTMLElement | null;
	form: HTMLFormElement | null;
	input: HTMLInputElement | null;
	suggestions: HTMLElement | null;
	suggestionsHint: HTMLElement | null;
	cancel: HTMLButtonElement | null;
	terminal: CompletionTerminalLike;
	commands: readonly MobileTrayCommand[];
	onRunCommand: (command: string) => Promise<void> | void;
}

interface NormalizedTrayCommand {
	command: string;
	kind: TrayCommandKind;
	label: string;
}

function moveCaretToEnd(input: HTMLInputElement): void {
	requestAnimationFrame(() => {
		input.selectionStart = input.selectionEnd = input.value.length;
	});
}

function setInputValue(input: HTMLInputElement, value: string): void {
	input.value = value;
	moveCaretToEnd(input);
}

function resetHorizontalScroll(container: HTMLElement): void {
	container.scrollLeft = 0;
	container.scrollTo({ left: 0, top: 0, behavior: "auto" });
	requestAnimationFrame(() => {
		container.scrollLeft = 0;
	});
}

function normalizeCommands(
	commands: readonly MobileTrayCommand[],
): NormalizedTrayCommand[] {
	const result: NormalizedTrayCommand[] = [];
	const seen = new Set<string>();

	for (const item of commands) {
		const command = item.command.trim();
		if (!command) continue;
		const kind = item.kind ?? "simple";
		const key = `${kind}:${command}`;
		if (seen.has(key)) continue;
		seen.add(key);
		result.push({
			command,
			kind,
			label: item.label?.trim() || command,
		});
	}

	return result;
}

function buildCommandButton(
	command: NormalizedTrayCommand,
	mode: "root" | "arg",
	runCommand?: string,
): HTMLButtonElement {
	const button = document.createElement("button");
	button.type = "button";
	button.className =
		mode === "arg" ? "mobile-command mobile-command-arg" : "mobile-command";
	button.textContent = command.label;
	button.setAttribute(
		"aria-label",
		mode === "arg"
			? `Run ${runCommand ?? command.command}`
			: command.kind === "withArgs"
				? `Choose ${command.command} argument`
				: `Run ${command.command}`,
	);

	if (mode === "arg" && runCommand) {
		button.dataset.run = runCommand;
		return button;
	}

	button.dataset.command = command.command;
	button.dataset.kind = command.kind;
	return button;
}

function unquote(value: string): string {
	if (value.length < 2) return value;
	if (value.startsWith('"') && value.endsWith('"')) {
		return value.slice(1, -1).replace(/\\"/g, '"');
	}
	return value;
}

function getArgumentLabel(command: string, fullCommand: string): string {
	const prefix = `${command} `;
	if (!fullCommand.startsWith(prefix)) return fullCommand;
	const value = fullCommand.slice(prefix.length).trim();
	return unquote(value) || fullCommand;
}

function getArgumentCommands(
	command: string,
	terminal: CompletionTerminalLike,
): string[] {
	const prefix = `${command} `;
	const completions = terminal.listCompletions(prefix);
	const values: string[] = [];
	const seen = new Set<string>();

	for (const value of completions) {
		const next = value.trim();
		if (!next || !next.startsWith(prefix) || seen.has(next)) continue;
		seen.add(next);
		values.push(next);
	}

	return values;
}

function buildSuggestionButton(
	value: string,
	type: SuggestionType,
): HTMLButtonElement {
	const button = document.createElement("button");
	button.type = "button";
	button.className = "mobile-custom-suggestion";
	button.dataset.kind = type;
	button.dataset.value = value;
	button.textContent = value;
	button.title = value;
	button.setAttribute("aria-label", `Insert ${value}`);
	return button;
}

function getSuggestionSet(
	inputValue: string,
	terminal: CompletionTerminalLike,
): { type: SuggestionType; values: string[] } {
	const isHistoryMode = inputValue.trim().length === 0;
	const type: SuggestionType = isHistoryMode ? "history" : "completion";
	const source = isHistoryMode
		? terminal.listRecentHistory(MAX_CUSTOM_SUGGESTIONS)
		: terminal.listCompletions(inputValue);

	return {
		type,
		values: source.slice(0, MAX_CUSTOM_SUGGESTIONS),
	};
}

function applySuggestion(
	input: HTMLInputElement,
	value: string,
	type: SuggestionType | undefined,
): void {
	if (type === "completion") {
		const next = /\s$/.test(value) ? value : `${value} `;
		setInputValue(input, next);
		return;
	}
	setInputValue(input, value);
}

export function setupMobileCommandTray({
	enabled,
	container,
	list,
	back,
	customTrigger,
	dialog,
	form,
	input,
	suggestions,
	suggestionsHint,
	cancel,
	terminal,
	commands,
	onRunCommand,
}: MobileCommandTrayOptions): void {
	if (!enabled) {
		if (container instanceof HTMLElement) container.hidden = true;
		if (dialog instanceof HTMLElement) dialog.hidden = true;
		return;
	}
	if (!(container instanceof HTMLElement)) return;
	if (!(list instanceof HTMLElement)) return;
	if (!(back instanceof HTMLButtonElement)) return;
	if (!(customTrigger instanceof HTMLButtonElement)) return;
	if (!(dialog instanceof HTMLElement)) return;
	if (!(form instanceof HTMLFormElement)) return;
	if (!(input instanceof HTMLInputElement)) return;
	if (!(suggestions instanceof HTMLElement)) return;
	if (!(suggestionsHint instanceof HTMLElement)) return;
	if (!(cancel instanceof HTMLButtonElement)) return;

	const normalizedCommands = normalizeCommands(commands);
	let isRunning = false;
	let inArgumentMode = false;

	const setDialogOpen = (open: boolean): void => {
		dialog.hidden = !open;
		dialog.setAttribute("aria-hidden", open ? "false" : "true");
		customTrigger.setAttribute("aria-expanded", open ? "true" : "false");
	};

	const runCommand = async (command: string): Promise<void> => {
		const normalized = command.trim();
		if (normalized.length === 0 || isRunning) return;
		isRunning = true;
		try {
			await onRunCommand(normalized);
		} finally {
			isRunning = false;
		}
	};

	const renderRootCommands = (): void => {
		inArgumentMode = false;
		list.replaceChildren(
			...normalizedCommands.map((command) =>
				buildCommandButton(command, "root"),
			),
		);
		list.setAttribute("aria-label", "Quick commands");
		resetHorizontalScroll(list);
		back.hidden = true;
		customTrigger.hidden = false;
	};

	const renderArgumentCommands = (command: string): void => {
		const argumentCommands = getArgumentCommands(command, terminal);
		if (argumentCommands.length === 0) {
			void (async () => {
				await runCommand(command);
				renderRootCommands();
			})();
			return;
		}

		inArgumentMode = true;
		list.setAttribute("aria-label", `Choose ${command} argument`);
		const argButtons = argumentCommands.map((fullCommand) =>
			buildCommandButton(
				{
					command,
					kind: "simple",
					label: getArgumentLabel(command, fullCommand),
				},
				"arg",
				fullCommand,
			),
		);
		list.replaceChildren(...argButtons);
		resetHorizontalScroll(list);
		back.hidden = false;
		customTrigger.hidden = true;
	};

	const refreshSuggestions = (): void => {
		const { type, values } = getSuggestionSet(input.value, terminal);
		suggestions.replaceChildren(
			...values.map((value) => buildSuggestionButton(value, type)),
		);
		suggestions.hidden = values.length === 0;
		suggestionsHint.hidden = values.length > 0;
	};

	const closeDialog = (): void => {
		setDialogOpen(false);
		input.value = "";
		refreshSuggestions();
		input.blur();
		if (!customTrigger.hidden) {
			customTrigger.focus({ preventScroll: true });
		}
	};

	const openDialog = (): void => {
		setDialogOpen(true);
		refreshSuggestions();
		requestAnimationFrame(() => {
			input.focus({ preventScroll: true });
		});
	};

	renderRootCommands();
	container.hidden = false;
	setDialogOpen(false);
	refreshSuggestions();

	list.addEventListener("click", (event) => {
		const target = event.target;
		if (!(target instanceof Element)) return;

		const runButton = target.closest("button[data-run]");
		if (runButton instanceof HTMLButtonElement) {
			const command = runButton.dataset.run?.trim();
			if (!command) return;
			void (async () => {
				await runCommand(command);
				renderRootCommands();
			})();
			return;
		}

		const commandButton = target.closest("button[data-command]");
		if (!(commandButton instanceof HTMLButtonElement)) return;
		const command = commandButton.dataset.command?.trim();
		if (!command) return;
		const kind = commandButton.dataset.kind as TrayCommandKind | undefined;

		if (kind === "withArgs") {
			renderArgumentCommands(command);
			return;
		}

		void (async () => {
			await runCommand(command);
			renderRootCommands();
		})();
	});

	back.addEventListener("click", () => {
		renderRootCommands();
	});

	customTrigger.addEventListener("click", openDialog);
	cancel.addEventListener("click", closeDialog);

	input.addEventListener("input", () => {
		refreshSuggestions();
	});

	suggestions.addEventListener("click", (event) => {
		const target = event.target;
		if (!(target instanceof Element)) return;
		const button = target.closest("button[data-value]");
		if (!(button instanceof HTMLButtonElement)) return;
		const value = button.dataset.value;
		if (!value) return;
		const type = button.dataset.kind as SuggestionType | undefined;
		applySuggestion(input, value, type);
		refreshSuggestions();
	});

	dialog.addEventListener("click", (event) => {
		const target = event.target;
		if (!(target instanceof Element)) return;
		if (!target.closest("[data-dialog-close]")) return;
		closeDialog();
	});

	document.addEventListener("keydown", (event) => {
		if (event.key !== "Escape") return;
		if (!dialog.hidden) {
			event.preventDefault();
			closeDialog();
			return;
		}
		if (!inArgumentMode) return;
		event.preventDefault();
		renderRootCommands();
	});

	form.addEventListener("submit", (event) => {
		event.preventDefault();
		const command = input.value.trim();
		if (!command) return;
		void (async () => {
			await runCommand(command);
			closeDialog();
			renderRootCommands();
		})();
	});
}
