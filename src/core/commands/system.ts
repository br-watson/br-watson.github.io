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
	registerCommand("help", "Show this help", "help", (ctx) => {
		const { s } = ctx.seg;
		ctx.printLine([s("accent", "Available commands")], "ok");

		const rows = Array.from(commands.values())
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
	});

	registerCommand("clear", "Clear the screen", "clear", (ctx) => ctx.clear());

	registerCommand("date", "Print local date/time", "date", (ctx) => {
		ctx.printLine(new Date().toString(), "muted");
	});

	registerCommand("echo", "Print args", "echo <text>", (ctx, args) => {
		ctx.printLine(args.join(" "));
	});

	registerCommand(
		"theme",
		"Switch theme",
		"theme [dark|light|toggle]",
		(ctx, args) => {
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
		(_, req) => {
			if (req.argIndex !== 0) return [];
			const prefix = req.prefix.toLowerCase();
			return ["dark", "light", "toggle"].filter((item) =>
				item.startsWith(prefix),
			);
		},
	);
}
