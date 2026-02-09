interface TerminalLike {
	historyUp: () => string | null;
	historyDown: () => string | null;
	autocomplete: (value: string) => string;
}

interface PromptOptions {
	form: HTMLFormElement;
	input: HTMLInputElement;
	terminal: TerminalLike;
	onRunCommand: (command: string) => Promise<void> | void;
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

export function createPromptController({
	form,
	input,
	terminal,
	onRunCommand,
}: PromptOptions) {
	let hasSubmittedFirstCommand = false;

	function markFirstCommandSubmitted(): void {
		if (hasSubmittedFirstCommand) return;
		hasSubmittedFirstCommand = true;
		input.removeAttribute("placeholder");
	}

	function focus(): void {
		input.focus({ preventScroll: true });
	}

	async function submitLine(): Promise<void> {
		const line = input.value.trim();
		input.value = "";

		if (line.length === 0) {
			focus();
			return;
		}

		await onRunCommand(line);
		focus();
	}

	function bindFormSubmit(): void {
		form.addEventListener("submit", (e) => {
			e.preventDefault();
			void submitLine();
		});
	}

	function bindInputHandlers(): void {
		input.addEventListener("keydown", (e) => {
			if (e.altKey || e.ctrlKey || e.metaKey) return;

			if (e.key === "ArrowUp") {
				e.preventDefault();
				const next = terminal.historyUp();
				if (next === null) return;
				setInputValue(input, next);
			}

			if (e.key === "ArrowDown") {
				e.preventDefault();
				const next = terminal.historyDown();
				if (next === null) return;
				setInputValue(input, next);
			}

			if (e.key === "Tab") {
				if (e.shiftKey) return;
				e.preventDefault();
				setInputValue(input, terminal.autocomplete(input.value));
			}
		});
	}

	bindFormSubmit();
	bindInputHandlers();

	return { focus, markFirstCommandSubmitted };
}
