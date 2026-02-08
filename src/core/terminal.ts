import {
	type FileSystem,
	listHome as listHomeFs,
	resolveHomeItem as resolveHomeItemFs,
} from "../data/fs.js";
import type { Profile } from "../data/profile";
import type { ThemeController } from "../services/theme";
import type { Renderer } from "../ui/domRenderer";
import type { Commands } from "./commands";
import { createCompletionEngine } from "./completionEngine.js";
import { parseInputLine } from "./inputParser.js";

type TextSeg = { type: "text"; text: string };
type SpanSeg = { type: "span"; className: string; text: string };
type LinkSeg = { type: "link"; href: string; text?: string };
export type Segment = TextSeg | SpanSeg | LinkSeg;

export interface Context {
	profile: Profile;
	fs: FileSystem;
	theme: ThemeController;
	openUrl: (href: string | URL) => void;
	printLine: (content: string | Segment[], className?: string) => void;
	printPre: (text: string, className?: string) => void;
	seg: { t: typeof t; s: typeof s; l: typeof l };
	listHome: () => string[];
	resolveHomeItem: (
		name: string,
	) => ReturnType<typeof resolveHomeItemFs> | null;
	clear: () => void;
}

const t = (text: string): TextSeg => ({ type: "text", text });
const s = (className: string, text: string): SpanSeg => ({
	type: "span",
	className,
	text,
});
const l = (href: string, text?: string | undefined): LinkSeg => ({
	type: "link",
	href,
	text,
});

export function createTerminal({
	renderer,
	profile,
	fs,
	commands,
	openUrl,
	theme,
}: {
	renderer: Renderer;
	profile: Profile;
	fs: FileSystem;
	commands: Commands;
	openUrl: (href: string | URL) => void;
	theme: ThemeController;
}) {
	const state: {
		history: string[];
		historyIndex: number;
		hasRunCommand: boolean;
		hasBooted: boolean;
	} = {
		history: [],
		historyIndex: -1,
		hasRunCommand: false,
		hasBooted: false,
	};

	function boot() {
		state.hasBooted = true;
		renderIntro();
	}

	function renderIntro() {
		renderer.clear();
		printBanner();
		printLine(
			[t("Type "), s("accent", "help"), t(" to see commands.")],
			"muted",
		);
		renderer.scrollToBottom();
	}

	function refreshIntroIfPristine() {
		if (!state.hasBooted || state.hasRunCommand) return;
		renderIntro();
	}

	function maxLineLength(lines: string[]) {
		return lines.reduce((max, line) => Math.max(max, line.length), 0);
	}

	function truncateText(value: string, maxLength: number) {
		if (value.length <= maxLength) return value;
		if (maxLength <= 1) return "…";
		return `${value.slice(0, maxLength - 1)}…`;
	}

	function centerTextParts(value: string, width: number) {
		const text = truncateText(value, width);
		const padding = Math.max(0, width - text.length);
		const left = Math.floor(padding / 2);
		const right = padding - left;
		return {
			leftPad: " ".repeat(left),
			text,
			rightPad: " ".repeat(right),
		};
	}

	function printBanner() {
		const artLines = profile.nameAsciiArt ?? [];
		const artWidth = maxLineLength(artLines);
		const availableColumns = renderer.getColumns();

		if (artLines.length > 0 && artWidth <= availableColumns) {
			printPre(artLines.join("\n"), "accent");
			printLine(profile.role, "muted");
			return;
		}

		printBoxBanner();
	}

	function printBoxBanner() {
		const name = String(profile.name).trim() || "Portfolio";
		const role = String(profile.role).trim() || "Software Engineer";
		const availableColumns = renderer.getColumns();

		const maxInnerWidth = clamp(availableColumns - 6, 10, 54);
		const minInnerWidth = Math.min(20, maxInnerWidth);
		const contentWidth = Math.max(name.length, role.length, minInnerWidth - 4);
		const innerWidth = clamp(contentWidth + 4, minInnerWidth, maxInnerWidth);

		const top = `╭${"─".repeat(innerWidth + 2)}╮`;
		const divider = `├${"─".repeat(innerWidth + 2)}┤`;
		const bottom = `╰${"─".repeat(innerWidth + 2)}╯`;

		const row = (text: string, withNewline = true): Segment[] => {
			const centered = centerTextParts(text, innerWidth);
			return [
				s("banner-border", "│ "),
				s("banner-border", centered.leftPad),
				s("banner-text", centered.text),
				s("banner-border", centered.rightPad),
				s("banner-border", withNewline ? " │\n" : " │"),
			];
		};

		const banner: Segment[] = [
			s("banner-border", `${top}\n`),
			...row(name),
			s("banner-border", `${divider}\n`),
			...row(role),
			s("banner-border", bottom),
		];

		printLine(banner, "banner", false);
	}

	function clamp(n: number, min: number, max: number) {
		return Math.max(min, Math.min(max, n));
	}

	function printLine(
		content: string | Segment[],
		className = "ok",
		wrapText: boolean = true,
	) {
		const segments = Array.isArray(content) ? content : [t(String(content))];
		renderer.printLine(segments, className, wrapText);
	}

	function printPre(text: string, className = "ok") {
		renderer.printPre(String(text), className);
	}

	function printCmd(cmd: string) {
		printLine([s("cmd", "$"), t(" "), s("cmd", cmd)], "cmd");
	}

	function listHome() {
		return listHomeFs(fs);
	}

	function resolveHomeItem(name: string) {
		return resolveHomeItemFs(fs, name);
	}

	function buildContext(): Context {
		return {
			profile,
			fs,
			theme,
			openUrl,
			printLine,
			printPre,
			seg: { t, s, l },
			listHome,
			resolveHomeItem,
			clear: renderer.clear,
		};
	}

	const completionEngine = createCompletionEngine({
		commands,
		getContext: buildContext,
		onListMatches: (matches) => {
			const segs: Segment[] = [];
			matches.forEach((value, index) => {
				if (index) segs.push(t("   "));
				segs.push(s("accent", value));
			});
			printLine(segs, "muted");
			renderer.scrollToBottom();
		},
	});

	async function run(inputLine: string) {
		const line = inputLine.trim();
		if (!line) return;
		state.hasRunCommand = true;

		printCmd(line);

		const parsed = parseInputLine(line);
		const [cmd, ...args] = parsed.tokens;
		const command = commands.get(cmd);

		if (!command) {
			printLine([t("Command not found: "), s("error", cmd)], "error");
			printLine([t("Try: "), s("accent", "help")], "muted");
			return;
		}

		try {
			await command.execute(buildContext(), args);
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			printLine([s("error", "Error:"), t(" "), t(message)], "error");
		}
	}

	function addHistory(line: string) {
		state.history.push(line);
		state.historyIndex = state.history.length;
	}

	function historyUp() {
		if (state.history.length === 0) return null;
		state.historyIndex = Math.max(0, state.historyIndex - 1);
		return state.history[state.historyIndex] ?? "";
	}

	function historyDown() {
		if (state.history.length === 0) return null;
		state.historyIndex = Math.min(state.history.length, state.historyIndex + 1);
		return state.history[state.historyIndex] ?? "";
	}

	function listRecentHistory(limit = 6) {
		const max = Math.max(0, Math.floor(limit));
		if (max === 0) return [];

		const recent: string[] = [];
		const seen = new Set<string>();

		for (let i = state.history.length - 1; i >= 0; i--) {
			const line = state.history[i] ?? "";
			if (line.length === 0 || seen.has(line)) continue;
			seen.add(line);
			recent.push(line);
			if (recent.length >= max) break;
		}

		return recent;
	}

	return {
		boot,
		run,
		addHistory,
		historyUp,
		historyDown,
		listRecentHistory,
		listCompletions: (current: string) =>
			completionEngine.listCompletions(current),
		autocomplete: (current: string) => completionEngine.autocomplete(current),
		refreshIntroIfPristine,
	};
}
