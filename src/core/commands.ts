import type { Profile } from "../data/profile.js";
import type { Context } from "./terminal";

export interface CompletionRequest {
	line: string;
	tokens: string[];
	args: string[];
	endsWithWhitespace: boolean;
	argIndex: number;
	prefix: string;
}

interface Command {
	name: string;
	summary: string;
	usage: string;
	execute: (ctx: Context, args: string[]) => void | Promise<void>;
	complete?: (ctx: Context, req: CompletionRequest) => string[];
}

export type Commands = Map<string, Command>;
const COMPLETABLE_CAT_TYPES = new Set([
	"file",
	"link",
	"links",
	"projects",
	"education",
]);

function filterByPrefix(
	candidates: Iterable<string>,
	prefix: string,
): string[] {
	const lowerPrefix = prefix.toLowerCase();
	return Array.from(new Set(candidates))
		.filter((candidate) => candidate.toLowerCase().startsWith(lowerPrefix))
		.sort();
}

function completeFirstArg(
	req: CompletionRequest,
	candidates: Iterable<string>,
): string[] {
	if (req.argIndex !== 0) return [];
	return filterByPrefix(candidates, req.prefix ?? "");
}

export function buildOpenAliasMap(profile: Profile) {
	const aliases = new Map<string, string>();

	if (profile.links.github) aliases.set("github", profile.links.github);
	if (profile.links.linkedin) aliases.set("linkedin", profile.links.linkedin);

	if (profile.filePaths.cv) aliases.set("cv", profile.filePaths.cv);
	if (profile.filePaths.dissertation)
		aliases.set("dissertation", profile.filePaths.dissertation);
	if (profile.email) aliases.set("email", `mailto:${profile.email}`);

	return aliases;
}

export function createCommandRegistry({
	profile,
	isMobile = false,
}: {
	profile: Profile;
	isMobile?: boolean;
}) {
	const commands: Commands = new Map();

	const cmd = (
		name: string,
		summary: string,
		usage: string,
		execute: (ctx: Context, args: string[]) => void | Promise<void>,
		complete?: (ctx: Context, req: CompletionRequest) => string[],
	) => {
		commands.set(name, { name, summary, usage, execute, complete });
	};

	cmd("help", "Show this help", "help", (ctx) => {
		const { s } = ctx.seg;
		ctx.printLine([s("accent", "Available commands")], "ok");

		const rows = Array.from(commands.values())
			.sort((a, b) => a.name.localeCompare(b.name))
			.map(
				(c) =>
					`${c.name.padEnd(12, " ")} ${c.summary.padEnd(32, " ")} ${c.usage}`,
			);

		const lines = [
			`${"COMMAND".padEnd(12, " ")} ${"SUMMARY".padEnd(32, " ")} USAGE`,
			"",
			...rows,
			"",
			isMobile
				? "Tips: tap a suggestion to autocomplete, then tap Enter to run."
				: "Tips: use ↑/↓ for history and Tab for autocomplete (Shift+Tab to move focus).",
		];

		ctx.printPre(lines.join("\n"), "ok");
	});

	cmd("clear", "Clear the screen", "clear", (ctx) => ctx.clear());

	cmd("whoami", "About me", "whoami", (ctx) => {
		ctx.printLine(
			`${String(profile.name)} — ${String(profile.role)} (${String(profile.location)})`,
		);
	});

	cmd("date", "Print local date/time", "date", (ctx) => {
		ctx.printLine(new Date().toString(), "muted");
	});

	cmd("echo", "Print args", "echo <text>", (ctx, args) => {
		ctx.printLine(args.join(" "));
	});

	cmd("ls", "List files (only ~ supported)", "ls [path]", (ctx, args) => {
		const path = args[0] ?? "~";
		if (path !== "~") {
			ctx.printLine(
				'ls: only "~" is supported in this tiny filesystem',
				"error",
			);
			return;
		}
		ctx.printPre(ctx.listHome().join("\n"), "ok");
	});

	cmd(
		"cat",
		"Print file contents",
		"cat <file>",
		(ctx, args) => {
			const { t, l, s } = ctx.seg;

			const name = args[0];
			if (!name) {
				ctx.printLine("cat: missing file operand", "error");
				return;
			}

			const item = ctx.resolveHomeItem(name);
			if (!item) {
				ctx.printLine(`cat: ${name}: No such file`, "error");
				return;
			}

			switch (item.type) {
				case "file": {
					ctx.printPre(String(item.content), "ok");
					break;
				}
				case "link": {
					ctx.printLine(
						[
							t(`${name} -> `),
							l(item.href),
							t(" (click me! or run "),
							s("accent", `open ${name}`),
							t(")"),
						],
						"muted",
					);
					break;
				}
				case "links": {
					const padOnly = (str: string, targetLen: number) =>
						" ".repeat(Math.max(0, targetLen - str.length));

					const entries = Object.entries(item.items).flatMap(([key, href]) => [
						t(`${key}: `.padEnd(10, " ")),
						l(href, key),
						t(padOnly(key, 8)),
						t(" (or run "),
						s("accent", `open ${key}`),
						t(")\n"),
					]);
					ctx.printLine(entries, "muted wrap-desktop");
					break;
				}
				case "projects": {
					const entries = item.projects.flatMap((p) => [
						s("accent", `${p.name}\n`),
						t(`${p.desc}\n`),
						...(p.repoLink ? [l(p.repoLink), t("\n")] : [t("")]),
						...(p.deployedLink ? [l(p.deployedLink), t("\n")] : [t("")]),
						p.tags && p.tags.length > 0
							? t(`Tech stack: ${p.tags.join(", ")}\n`)
							: t(""),
						t("\n"),
					]);
					ctx.printLine(entries, "muted wrap-desktop");
					break;
				}
				case "education": {
					const entries = item.education.flatMap((e) => [
						s("accent", `${e.qualification} - ${e.institution}\n`),
						t(`${e.location} | ${e.startDate} - ${e.endDate} | ${e.grade}\n`),
						e.description ? t(`${e.description}\n`) : t(""),
						...(e.dissertation
							? [
									t("Dissertation: "),
									l(e.dissertation.link, e.dissertation.title),
									t("\n"),
								]
							: [t("")]),
						e.tags && e.tags.length > 0
							? t(`Tags: ${e.tags.join(", ")}\n`)
							: t(""),
						t("\n"),
					]);
					ctx.printLine(entries, "muted wrap-desktop");
					break;
				}
				default: {
					ctx.printLine(`cat: ${name}: Not a file`, "error");
					break;
				}
			}
		},
		(ctx, req) => {
			const candidates = ctx.listHome().filter((entry: string) => {
				const item = ctx.resolveHomeItem(entry);
				return item ? COMPLETABLE_CAT_TYPES.has(item.type) : false;
			});
			return completeFirstArg(req, candidates);
		},
	);

	cmd(
		"open",
		"Open link",
		"open <alias>",
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

	cmd("bio", "Alias: cat bio.txt", "bio", (ctx) =>
		commands.get("cat")?.execute(ctx, ["bio.txt"]),
	);
	cmd("projects", "Alias: cat projects.txt", "projects", (ctx) =>
		commands.get("cat")?.execute(ctx, ["projects.txt"]),
	);
	cmd("socials", "Alias: cat socials.txt", "socials", (ctx) =>
		commands.get("cat")?.execute(ctx, ["socials.txt"]),
	);
	cmd("cv", "Alias: open cv", "cv", (ctx) =>
		commands.get("open")?.execute(ctx, ["cv"]),
	);
	cmd("skills", "List my skills", "skills", (ctx) =>
		commands.get("cat")?.execute(ctx, ["skills.txt"]),
	);
	cmd("education", "List my education", "education", (ctx) =>
		commands.get("cat")?.execute(ctx, ["education.txt"]),
	);
	cmd("roles", "List my roles and experience", "roles", (ctx) =>
		commands.get("cat")?.execute(ctx, ["roles.txt"]),
	);

	cmd(
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
			return completeFirstArg(req, ["dark", "light", "toggle"]);
		},
	);

	return { commands };
}
