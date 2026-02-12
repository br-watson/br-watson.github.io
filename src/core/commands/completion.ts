import type { CompletionRequest } from "./types.js";

function filterByPrefix(
	candidates: Iterable<string>,
	prefix: string,
): string[] {
	const lowerPrefix = prefix.toLowerCase();
	return Array.from(new Set(candidates))
		.filter((candidate) => candidate.toLowerCase().startsWith(lowerPrefix))
		.sort();
}

export function completeFirstArg(
	req: CompletionRequest,
	candidates: Iterable<string>,
): string[] {
	if (req.argIndex !== 0) return [];
	return filterByPrefix(candidates, req.prefix ?? "");
}
