export function clamp(n: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, n));
}

export function maxLineLength(lines: string[]): number {
	return lines.reduce((max, line) => Math.max(max, line.length), 0);
}
