import { registerCatCommand } from "./cat.js";
import { completeFirstArg } from "./completion.js";
import { buildOpenAliasMap } from "./openAliases.js";
import type { RegisterCommand } from "./types.js";

interface NavigationOptions {
	registerCommand: RegisterCommand;
	isMobile: boolean;
}

export function registerNavigationCommands({
	registerCommand,
	isMobile,
}: NavigationOptions) {
	registerCommand({
		name: "ls",
		summary: "List files (only ~ supported)",
		usage: "ls [path]",
		showInHelp: true,
		showInMobileTray: true,
		argMode: "optional",
		execute: (ctx, args) => {
			const path = args[0] ?? "~";
			if (path !== "~") {
				ctx.printLine(
					'ls: only "~" is supported in this tiny filesystem',
					"error",
				);
				return;
			}
			ctx.printPre(ctx.listHome().join("\n"), "ok");
		},
	});

	registerCatCommand(registerCommand);

	registerCommand({
		name: "open",
		summary: "Open link",
		usage: "open <alias>",
		showInHelp: true,
		showInMobileTray: true,
		argMode: "required",
		execute: (ctx, args) => {
			const { t, l } = ctx.seg;
			const targetRaw = args[0];
			const target = (targetRaw ?? "").toLowerCase();

			if (!target) {
				ctx.printLine(
					isMobile
						? "open: missing target (see the suggestions for valid options)"
						: "open: missing target (press Tab to see valid options)",
					"error",
				);
				return;
			}

			const alias = buildOpenAliasMap(ctx.profile);
			if (alias.has(target)) {
				const url = alias.get(target);
				if (url) {
					ctx.printLine([t("Opening: "), l(url)], "muted");
					ctx.openUrl(url);
				}
				return;
			}

			ctx.printLine(`open: unknown target "${targetRaw}"`, "error");
		},
		complete: (ctx, req) => {
			const alias = buildOpenAliasMap(ctx.profile);
			return completeFirstArg(req, alias.keys());
		},
	});
}
