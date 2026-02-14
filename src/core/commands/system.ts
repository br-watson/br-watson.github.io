import type { Commands, RegisterCommand } from "./types.js";

interface SystemOptions {
	commands: Commands;
	registerCommand: RegisterCommand;
	isMobile: boolean;
}

export function registerSystemCommands({
	commands,
	registerCommand,
	isMobile,
}: SystemOptions) {
	registerCommand({
		name: "help",
		summary: "Show this help",
		usage: "help",
		showInHelp: true,
		showInMobileTray: true,
		argMode: "none",
		execute: (ctx) => {
			const { s } = ctx.seg;
			ctx.printLine([s("accent", "Available commands")], "ok");

			const rows = Array.from(commands.values())
				.filter((cmd) => cmd.showInHelp)
				.sort((a, b) => a.name.localeCompare(b.name))
				.map(
					(command) =>
						`${command.name.padEnd(12, " ")} ${command.summary.padEnd(32, " ")} ${command.usage}`,
				);

			const lines = [
				`${"COMMAND".padEnd(12, " ")} ${"SUMMARY".padEnd(32, " ")} USAGE`,
				"",
				...rows,
				"",
				isMobile
					? 'Tip: use the command buttons below, or tap "Custom" to type commands with autocomplete and history.'
					: "Tips: use ↑/↓ for history and Tab for autocomplete (Shift+Tab to move focus).",
			];

			ctx.printPre(lines.join("\n"), "ok");
		},
	});

	registerCommand({
		name: "clear",
		summary: "Clear the screen",
		usage: "clear",
		showInHelp: true,
		showInMobileTray: true,
		argMode: "none",
		execute: (ctx) => ctx.clear(),
	});

	registerCommand({
		name: "date",
		summary: "Print local date/time",
		usage: "date",
		showInHelp: true,
		showInMobileTray: true,
		argMode: "none",
		execute: (ctx) => {
			ctx.printLine(new Date().toString(), "muted");
		},
	});

	registerCommand({
		name: "echo",
		summary: "Print args",
		usage: "echo <text>",
		showInHelp: true,
		showInMobileTray: false,
		argMode: "optional",
		execute: (ctx, args) => {
			ctx.printLine(args.join(" "));
		},
	});

	registerCommand({
		name: "theme",
		summary: "Switch theme",
		usage: "theme [dark|light|toggle]",
		showInHelp: true,
		showInMobileTray: true,
		argMode: "optional",
		execute: (ctx, args) => {
			const next = (args[0] ?? "").toLowerCase();
			const current = ctx.theme.get();

			if (!next) {
				ctx.printLine(`theme: current is "${current}"`, "muted");
				ctx.printLine("Try: theme dark | theme light | theme toggle", "muted");
				return;
			}

			if (next === "toggle") {
				ctx.theme.toggle();
				ctx.printLine(`theme: set to "${ctx.theme.get()}"`, "muted");
				return;
			}

			if (next !== "dark" && next !== "light") {
				ctx.printLine('theme: expected "dark" or "light"', "error");
				return;
			}

			ctx.theme.set(next);
			ctx.printLine(`theme: set to "${next}"`, "muted");
		},
		complete: (_, req) => {
			if (req.argIndex !== 0) return [];
			const prefix = req.prefix.toLowerCase();
			return ["dark", "light", "toggle"].filter((item) =>
				item.startsWith(prefix),
			);
		},
	});
}
