import type { Commands } from "./commands";
import { parseInputLine } from "./inputParser.js";
import type { Context } from "./terminal.js";

interface CompletionState {
	kind: string;
	baseInput: string;
	phase: "armed" | "listed" | "menu";
	prefix: string;
	matchesKey: string;
	values: string[];
	index: number;
	lastValue: string | null;
}

interface CompletionMatches {
	kind: string;
	prefix: string;
	matches: string[];
	buildValue: (choice: string) => string;
	buildAutocompleteValue?: (choice: string) => string;
}

interface CompletionEngineOptions {
	commands: Commands;
	getContext: () => Context;
	onListMatches: (matches: string[]) => void;
}

interface CompletionEngine {
	autocomplete: (current: string) => string;
	listCompletions: (current: string) => string[];
}

export function createCompletionEngine({
	commands,
	getContext,
	onListMatches,
}: CompletionEngineOptions): CompletionEngine {
	const commandNames = Array.from(commands.entries())
		.map(([name, command]) => ({
			name,
			showInHelp: command.showInHelp,
		}))
		.sort((a, b) => a.name.localeCompare(b.name));

	let state: CompletionState | null = null;

	function buildCommandAutocompleteValue(choice: string): string {
		const command = commands.get(choice);
		if (!command || command.argMode === "none") return choice;
		return `${choice} `;
	}

	function getCompletionMatches(
		current: string,
		parsed = parseInputLine(current),
	): CompletionMatches | null {
		const { tokens, endsWithWhitespace } = parsed;

		if (tokens.length === 0) return null;

		if (tokens.length === 1 && !endsWithWhitespace) {
			const prefix = tokens[0];
			const matches = commandNames
				.filter(
					(command) => command.showInHelp && command.name.startsWith(prefix),
				)
				.map((command) => command.name);
			return {
				kind: "cmd",
				prefix,
				matches,
				buildValue: (choice) => choice,
				buildAutocompleteValue: buildCommandAutocompleteValue,
			};
		}

		const cmdName = tokens[0];
		const command = commands.get(cmdName);
		if (!command?.complete) return null;

		const args = tokens.slice(1);
		const prefix = endsWithWhitespace ? "" : (args[args.length - 1] ?? "");
		const argIndex = endsWithWhitespace
			? args.length
			: Math.max(0, args.length - 1);

		const req = {
			line: current,
			tokens,
			args,
			endsWithWhitespace,
			argIndex,
			prefix,
		};

		const matches = command.complete(getContext(), req) || [];

		return {
			kind: `arg:${cmdName}`,
			prefix,
			matches,
			buildValue: (choice) => {
				const baseTokens = endsWithWhitespace ? tokens : tokens.slice(0, -1);
				return [...baseTokens, quoteIfNeeded(choice)].join(" ");
			},
		};
	}

	function listCompletions(current: string): string[] {
		const completionMatches = getCompletionMatches(current);
		if (!completionMatches) return [];

		const seen = new Set<string>();
		const values: string[] = [];

		for (const match of completionMatches.matches) {
			const value = completionMatches.buildValue(match);
			if (seen.has(value)) continue;
			seen.add(value);
			values.push(value);
		}

		return values;
	}

	function autocomplete(current: string): string {
		if (state?.phase === "menu") {
			const index = state.values.indexOf(current);
			if (index !== -1) {
				const nextIndex = (index + 1) % state.values.length;
				state.index = nextIndex;
				state.lastValue = state.values[nextIndex];
				return state.lastValue;
			}
			state = null;
		}

		const parsed = parseInputLine(current);
		if (parsed.tokens.length === 0) return "";

		const completionMatches = getCompletionMatches(current, parsed);
		if (!completionMatches) return current;

		return (
			applyMatches(
				completionMatches.kind,
				current,
				completionMatches.prefix,
				completionMatches.matches,
				completionMatches.buildValue,
				completionMatches.buildAutocompleteValue ??
					completionMatches.buildValue,
			) ?? current
		);
	}

	function applyMatches(
		kind: string,
		current: string,
		prefix: string,
		matches: string[],
		buildValue: (choice: string) => string,
		buildSingleValue: (choice: string) => string,
	): string | null {
		if (matches.length === 0) {
			state = null;
			return null;
		}

		if (matches.length === 1) {
			state = null;
			return buildSingleValue(matches[0]);
		}

		const matchesKey = makeMatchesKey(matches);
		const common = longestCommonPrefix(matches);

		if (common.length > prefix.length) {
			const nextValue = buildValue(common);
			state = {
				phase: "armed",
				kind,
				baseInput: nextValue,
				prefix: common,
				matchesKey,
				values: matches.map(buildValue),
				index: -1,
				lastValue: null,
			};
			return nextValue;
		}

		const sameContext =
			state &&
			state.kind === kind &&
			state.baseInput === current &&
			state.prefix === prefix &&
			state.matchesKey === matchesKey;

		if (!sameContext) {
			state = {
				phase: "armed",
				kind,
				baseInput: current,
				prefix,
				matchesKey,
				values: matches.map(buildValue),
				index: -1,
				lastValue: null,
			};
			return null;
		}

		if (state?.phase === "armed") {
			onListMatches(matches);
			state.phase = "listed";
			return null;
		}

		if (state?.phase === "listed") {
			const first = state.values[0];
			state.phase = "menu";
			state.index = 0;
			state.lastValue = first;
			return first;
		}

		return null;
	}

	return { autocomplete, listCompletions };
}

function quoteIfNeeded(value: string): string {
	return /\s/.test(value) ? `"${value.replace(/"/g, '\\"')}"` : value;
}

function longestCommonPrefix(items: string[]): string {
	if (items.length === 0) return "";
	let prefix = items[0];
	for (let i = 1; i < items.length; i++) {
		const item = items[i];
		let j = 0;
		while (j < prefix.length && j < item.length && prefix[j] === item[j]) j++;
		prefix = prefix.slice(0, j);
		if (prefix === "") break;
	}
	return prefix;
}

function makeMatchesKey(matches: string[]): string {
	return matches.join("\0");
}
