import { clamp, maxLineLength } from "../sizing.js";
import type { RegisterCommand } from "./types.js";

type RenderMode = "big-penguin" | "lil-penguin" | "no-penguin";

interface FunOptions {
	registerCommand: RegisterCommand;
}

const DEFAULT_MESSAGE = "[penguin noises]";

const BIG_PENGUIN = [
	"      .--.",
	"     |o_o |",
	"     |:_/ |",
	"    //   \\\\",
	"   (|     |)",
	"  /'\\_   _/`\\",
	"  \\___)=(___/",
];

const LIL_PENGUIN = [
	"     _",
	"   ('v')",
	"  //-=-\\\\",
	"  (\\_=_/)",
	"   ^^ ^^",
];

function wrapMessage(message: string, maxWidth: number): string[] {
	const width = Math.max(1, maxWidth);
	const lines: string[] = [];
	const paragraphs = message.split(/\r?\n/);

	for (const paragraph of paragraphs) {
		const words = paragraph.trim().split(/\s+/).filter(Boolean);
		if (words.length === 0) {
			lines.push("");
			continue;
		}

		let current = "";
		for (const word of words) {
			if (word.length > width) {
				if (current) {
					lines.push(current);
					current = "";
				}
				for (let i = 0; i < word.length; i += width) {
					lines.push(word.slice(i, i + width));
				}
				continue;
			}

			if (!current) {
				current = word;
				continue;
			}

			if (current.length + 1 + word.length <= width) {
				current = `${current} ${word}`;
				continue;
			}

			lines.push(current);
			current = word;
		}

		if (current) lines.push(current);
	}

	return lines.length === 0 ? [""] : lines;
}

function buildBubble(message: string, maxWidth: number): string[] {
	const wrapped = wrapMessage(message, maxWidth);
	const innerWidth = wrapped.reduce(
		(max, line) => Math.max(max, line.length),
		1,
	);
	const border = "-".repeat(innerWidth + 2);

	return [
		`.${border}.`,
		...wrapped.map((line) => `| ${line.padEnd(innerWidth, " ")} |`),
		`'${border}'`,
	];
}

function buildPengsayLines(
	message: string,
	columns: number,
	mode: RenderMode,
): string[] {
	const bubbleLimit =
		mode === "big-penguin" ? 48 : mode === "lil-penguin" ? 34 : 24;
	const maxTextWidth = clamp(columns - 4, 1, bubbleLimit);
	const bubbleLines = buildBubble(message, maxTextWidth);

	if (mode === "no-penguin") return bubbleLines;

	const tail = ["   \\", "    \\"];
	const art = mode === "big-penguin" ? BIG_PENGUIN : LIL_PENGUIN;
	return [...bubbleLines, ...tail, ...art];
}

function getRenderableLines(message: string, columns: number): string[] | null {
	const modes: RenderMode[] = ["big-penguin", "lil-penguin", "no-penguin"];

	for (const mode of modes) {
		const lines = buildPengsayLines(message, columns, mode);
		if (maxLineLength(lines) <= columns) return lines;
	}

	return null;
}

export function registerFunCommands({ registerCommand }: FunOptions): void {
	registerCommand({
		name: "pengsay",
		summary: "Penguin says something",
		usage: "pengsay [text]",
		showInHelp: true,
		showInMobileTray: true,
		argMode: "optional",
		execute: (ctx, args) => {
			const message = args.join(" ").trim() || DEFAULT_MESSAGE;
			const columns = Math.max(1, ctx.getColumns());
			const lines = columns >= 5 ? getRenderableLines(message, columns) : null;

			if (!lines) {
				ctx.printLine(`penguin: "${message}"`);
				return;
			}

			ctx.printPre(lines.join("\n"), "ok");
		},
	});
}
