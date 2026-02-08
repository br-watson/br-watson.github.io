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
	const mobileAssistEl =
		enableMobileAssist && mobileAssist instanceof HTMLElement
			? mobileAssist
			: null;
	const mobileSuggestionsEl =
		enableMobileAssist && mobileSuggestions instanceof HTMLElement
			? mobileSuggestions
			: null;
	const mobileEnterEl =
		enableMobileAssist && mobileEnter instanceof HTMLButtonElement
			? mobileEnter
			: null;
	const hasMobileAssist =
		mobileAssistEl !== null &&
		mobileSuggestionsEl !== null &&
		mobileEnterEl !== null;

	function focus(): void {
		input.focus({ preventScroll: true });
	}

	function moveCaretToEnd(): void {
		requestAnimationFrame(() => {
			input.selectionStart = input.selectionEnd = input.value.length;
		});
	}

	function setInputValue(value: string): void {
		input.value = value;
		moveCaretToEnd();
	}

	function buildMobileSuggestion(
		value: string,
		suggestionType: MobileSuggestionType,
	): HTMLButtonElement {
		const suggestion = document.createElement("button");
		suggestion.type = "button";
		suggestion.className = "mobile-suggestion";
		suggestion.dataset.kind = suggestionType;
		suggestion.dataset.value = value;
		suggestion.setAttribute("aria-label", `Insert ${value}`);
		suggestion.title = value;
		suggestion.textContent = value;
		return suggestion;
	}

	function refreshMobileAssist(): void {
		if (!hasMobileAssist || !mobileSuggestionsEl) return;

		const isHistoryMode = input.value.trim().length === 0;
		const sourceValues = isHistoryMode
			? terminal.listRecentHistory(MAX_MOBILE_SUGGESTIONS)
			: terminal.listCompletions(input.value);
		const chipKind: MobileSuggestionType = isHistoryMode
			? "history"
			: "completion";

		const values = sourceValues.slice(0, MAX_MOBILE_SUGGESTIONS);
		mobileSuggestionsEl.replaceChildren(
			...values.map((value) => buildMobileSuggestion(value, chipKind)),
		);
		mobileSuggestionsEl.hidden = values.length === 0;
	}

	async function submitLine({
		blurAfterRun = false,
	}: {
		blurAfterRun?: boolean;
	} = {}): Promise<void> {
		const line = input.value;
		input.value = "";

		if (line.trim().length > 0) {
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

	form.addEventListener("submit", (e) => {
		e.preventDefault();
		void submitLine();
	});

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
			setInputValue(next);
			changed = true;
		}

		if (e.key === "ArrowDown") {
			e.preventDefault();
			const next = terminal.historyDown();
			if (next === null) return;
			setInputValue(next);
			changed = true;
		}

		if (e.key === "Tab") {
			if (e.shiftKey) return;
			e.preventDefault();
			setInputValue(terminal.autocomplete(input.value));
			changed = true;
		}

		if (changed) refreshMobileAssist();
	});

	if (
		hasMobileAssist &&
		mobileAssistEl &&
		mobileSuggestionsEl &&
		mobileEnterEl
	) {
		mobileAssistEl.hidden = false;

		mobileSuggestionsEl.addEventListener("click", (event) => {
			const target = event.target;
			if (!(target instanceof Element)) return;

			const button = target.closest("button[data-value]");
			if (!(button instanceof HTMLButtonElement)) return;

			const value = button.dataset.value;
			if (!value) return;

			const chipKind = button.dataset.kind as MobileSuggestionType | undefined;
			if (chipKind === "completion") {
				const nextValue = /\s$/.test(value) ? value : `${value} `;
				setInputValue(nextValue);
			} else {
				setInputValue(value);
			}
			refreshMobileAssist();
		});

		mobileEnterEl.addEventListener("click", () => {
			void submitLine({ blurAfterRun: true });
		});
	} else if (mobileAssist instanceof HTMLElement) {
		mobileAssist.hidden = true;
	}

	refreshMobileAssist();

	return { focus, refreshMobileAssist };
}
