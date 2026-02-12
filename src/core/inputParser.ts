export interface ParsedInput {
	tokens: string[];
	endsWithWhitespace: boolean;
}

export function parseInputLine(line: string): ParsedInput {
	const tokens: string[] = [];
	let current = "";
	let quote: "'" | '"' | null = null;
	let escaping = false;

	for (let i = 0; i < line.length; i++) {
		const ch = line[i];

		if (escaping) {
			current += ch;
			escaping = false;
			continue;
		}

		if (ch === "\\") {
			escaping = true;
			continue;
		}

		if (quote) {
			if (ch === quote) {
				quote = null;
				continue;
			}
			current += ch;
			continue;
		}

		if (ch === '"' || ch === "'") {
			quote = ch;
			continue;
		}

		if (/\s/.test(ch)) {
			if (current) {
				tokens.push(current);
				current = "";
			}
			continue;
		}

		current += ch;
	}

	if (escaping) current += "\\";
	if (current) tokens.push(current);

	return {
		tokens,
		endsWithWhitespace: /\s$/.test(line),
	};
}
