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
	registerCommand(
		"ls",
		"List files (only ~ supported)",
		"ls [path]",
		true,
		(ctx, args) => {
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
	);

	registerCatCommand(registerCommand);

	registerCommand(
		"open",
		"Open link",
		"open <alias>",
		true,
		(ctx, args) => {
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
		(ctx, req) => {
			const alias = buildOpenAliasMap(ctx.profile);
			return completeFirstArg(req, alias.keys());
		},
	);
}
