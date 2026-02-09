import type { Renderer } from "../ui/domRenderer.js";

const MAX_MOBILE_SUGGESTIONS = 6;

type MobileSuggestionType = "history" | "completion";

interface TerminalLike {
	addHistory: (line: string) => void;
	run: (line: string) => Promise<void> | void;
	historyUp: () => string | null;
	historyDown: () => string | null;
	autocomplete: (value: string) => string;
	listCompletions: (value: string) => string[];
	listRecentHistory: (limit?: number) => string[];
}

interface PromptOptions {
	form: HTMLFormElement;
	input: HTMLInputElement;
	terminal: TerminalLike;
	renderer: Renderer;
	mobileAssist?: HTMLElement | null;
	mobileSuggestions?: HTMLElement | null;
	mobileEnter?: HTMLButtonElement | null;
	enableMobileAssist?: boolean;
}

interface MobileAssistElements {
	container: HTMLElement;
	suggestions: HTMLElement;
	enter: HTMLButtonElement;
}

interface MobileSuggestionSet {
	type: MobileSuggestionType;
	values: string[];
}

function resolveMobileAssistElements({
	enableMobileAssist,
	mobileAssist,
	mobileSuggestions,
	mobileEnter,
}: Pick<
	PromptOptions,
	"enableMobileAssist" | "mobileAssist" | "mobileSuggestions" | "mobileEnter"
>): MobileAssistElements | null {
	if (!enableMobileAssist) return null;
	if (!(mobileAssist instanceof HTMLElement)) return null;
	if (!(mobileSuggestions instanceof HTMLElement)) return null;
	if (!(mobileEnter instanceof HTMLButtonElement)) return null;
	return {
		container: mobileAssist,
		suggestions: mobileSuggestions,
		enter: mobileEnter,
	};
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

function buildMobileSuggestionButton(
	value: string,
	type: MobileSuggestionType,
): HTMLButtonElement {
	const suggestion = document.createElement("button");
	suggestion.type = "button";
	suggestion.className = "mobile-suggestion";
	suggestion.dataset.kind = type;
	suggestion.dataset.value = value;
	suggestion.setAttribute("aria-label", `Insert ${value}`);
	suggestion.title = value;
	suggestion.textContent = value;
	return suggestion;
}

function getMobileSuggestions(
	inputValue: string,
	terminal: TerminalLike,
): MobileSuggestionSet {
	const isHistoryMode = inputValue.trim().length === 0;
	const type: MobileSuggestionType = isHistoryMode ? "history" : "completion";
	const sourceValues = isHistoryMode
		? terminal.listRecentHistory(MAX_MOBILE_SUGGESTIONS)
		: terminal.listCompletions(inputValue);

	return {
		type,
		values: sourceValues.slice(0, MAX_MOBILE_SUGGESTIONS),
	};
}

function applyMobileSuggestion(
	input: HTMLInputElement,
	value: string,
	type: MobileSuggestionType | undefined,
): void {
	if (type === "completion") {
		const nextValue = /\s$/.test(value) ? value : `${value} `;
		setInputValue(input, nextValue);
		return;
	}

	setInputValue(input, value);
}

export function createPromptController({
	form,
	input,
	terminal,
	renderer,
	mobileAssist,
	mobileSuggestions,
	mobileEnter,
	enableMobileAssist = false,
}: PromptOptions) {
	const mobileAssistElements = resolveMobileAssistElements({
		enableMobileAssist,
		mobileAssist,
		mobileSuggestions,
		mobileEnter,
	});
	let hasSubmittedFirstCommand = false;

	function markFirstCommandSubmitted(): void {
		if (hasSubmittedFirstCommand) return;
		hasSubmittedFirstCommand = true;
		input.removeAttribute("placeholder");
	}

	function focus(): void {
		input.focus({ preventScroll: true });
	}

	function refreshMobileAssist(): void {
		if (!mobileAssistElements) return;

		const { type, values } = getMobileSuggestions(input.value, terminal);
		mobileAssistElements.suggestions.replaceChildren(
			...values.map((value) => buildMobileSuggestionButton(value, type)),
		);
		mobileAssistElements.suggestions.hidden = values.length === 0;
	}

	async function submitLine({
		blurAfterRun = false,
	}: {
		blurAfterRun?: boolean;
	} = {}): Promise<void> {
		const line = input.value;
		input.value = "";

		if (line.trim().length > 0) {
			markFirstCommandSubmitted();
			terminal.addHistory(line);
			await terminal.run(line);
		}

		renderer.scrollToBottom();
		refreshMobileAssist();

		if (blurAfterRun) {
			input.blur();
			return;
		}

		focus();
	}

	function bindFormSubmit(): void {
		form.addEventListener("submit", (e) => {
			e.preventDefault();
			void submitLine();
		});
	}

	function bindInputHandlers(): void {
		input.addEventListener("input", () => {
			refreshMobileAssist();
		});

		input.addEventListener("keydown", (e) => {
			if (e.altKey || e.ctrlKey || e.metaKey) return;
			let changed = false;

			if (e.key === "ArrowUp") {
				e.preventDefault();
				const next = terminal.historyUp();
				if (next === null) return;
				setInputValue(input, next);
				changed = true;
			}

			if (e.key === "ArrowDown") {
				e.preventDefault();
				const next = terminal.historyDown();
				if (next === null) return;
				setInputValue(input, next);
				changed = true;
			}

			if (e.key === "Tab") {
				if (e.shiftKey) return;
				e.preventDefault();
				setInputValue(input, terminal.autocomplete(input.value));
				changed = true;
			}

			if (changed) refreshMobileAssist();
		});
	}

	function bindMobileAssistHandlers(): void {
		if (!mobileAssistElements) return;

		mobileAssistElements.container.hidden = false;

		mobileAssistElements.suggestions.addEventListener("click", (e) => {
			const target = e.target;
			if (!(target instanceof Element)) return;

			const button = target.closest("button[data-value]");
			if (!(button instanceof HTMLButtonElement)) return;

			const value = button.dataset.value;
			if (!value) return;

			const type = button.dataset.kind as MobileSuggestionType | undefined;
			applyMobileSuggestion(input, value, type);
			refreshMobileAssist();
		});

		mobileAssistElements.enter.addEventListener("click", () => {
			void submitLine({ blurAfterRun: true });
		});
	}

	bindFormSubmit();
	bindInputHandlers();
	bindMobileAssistHandlers();

	if (!mobileAssistElements && mobileAssist instanceof HTMLElement) {
		mobileAssist.hidden = true;
	}

	refreshMobileAssist();

	return { focus, refreshMobileAssist, markFirstCommandSubmitted };
}
