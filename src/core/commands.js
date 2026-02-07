export function createCommandRegistry({ profile }) {
	const commands = new Map();
	const cmd = (name, summary, execute, usage, complete) => {
		commands.set(name, { name, summary, usage, execute, complete });
	};
	cmd(
		"help",
		"Show this help",
		(ctx) => {
			const { s } = ctx.seg;
			ctx.printLine([s("accent", "Available commands")], "ok");
			const rows = Array.from(commands.values())
				.sort((a, b) => a.name.localeCompare(b.name))
				.map((c) => `${c.name.padEnd(12, " ")} ${c.summary}`);
			const lines = [
				"",
				...rows,
				"",
				"Tips: use ↑/↓ for history, Tab for autocomplete (Shift+Tab to move focus).",
				"",
				"Examples:",
				"  ls",
				"  cat README.txt",
				"  bio",
				"  projects",
				"  socials",
				"  open github",
				"  open cv",
				"  theme light",
				"  theme toggle",
			];
			ctx.printPre(lines.join("\n"), "ok");
		},
		"help",
	);
	cmd("clear", "Clear the screen", (ctx) => ctx.clear(), "clear");
	cmd(
		"whoami",
		"About me",
		(ctx) => {
			ctx.printLine(
				`${String(profile.name)} — ${String(profile.role)} (${String(profile.location)})`,
			);
		},
		"whoami",
	);
	cmd(
		"date",
		"Print local date/time",
		(ctx) => {
			ctx.printLine(new Date().toString(), "muted");
		},
		"date",
	);
	cmd(
		"echo",
		"Print args",
		(ctx, args) => {
			ctx.printLine(args.join(" "));
		},
		"echo <text>",
	);
	cmd(
		"ls",
		"List files (only ~ supported)",
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
		"ls <path>",
	);
	cmd(
		"cat",
		"Print file contents",
		(ctx, args) => {
			const { t, l } = ctx.seg;
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
			if (item.type === "file") {
				ctx.printPre(String(item.content), "ok");
				return;
			}
			if (item.type === "link") {
				ctx.printLine([t(`${name} -> `), l(item.href)], "muted");
				return;
			}
			ctx.printLine(`cat: ${name}: Not a file`, "error");
		},
		"cat <file>",
	);
	function getOpenAliasMap(profile) {
		const m = new Map();
		const links = profile?.links ?? {};
		if (links.github) m.set("github", links.github);
		if (links.linkedin) m.set("linkedin", links.linkedin);
		if (profile?.cvPath) m.set("cv", profile.cvPath);
		if (profile?.email) m.set("email", `mailto:${profile.email}`);
		return m;
	}
	cmd(
		"open",
		"Open link or file (e.g. open github | open cv)",
		(ctx, args) => {
			const { t, l } = ctx.seg;
			const targetRaw = args[0];
			const target = (targetRaw ?? "").toLowerCase();
			if (!target) {
				ctx.printLine(
					"open: missing target (try: open github | open cv | open linkedin)",
					"error",
				);
				return;
			}
			const alias = getOpenAliasMap(ctx.profile);
			if (alias.has(target)) {
				const url = alias.get(target);
				ctx.printLine([t("Opening: "), l(url)], "muted");
				ctx.openUrl(url);
				return;
			}
			const item = ctx.resolveHomeItem(targetRaw);
			if (item?.type === "link") {
				ctx.printLine([t("Opening: "), l(item.href)], "muted");
				ctx.openUrl(item.href);
				return;
			}
			ctx.printLine(`open: unknown target "${targetRaw}"`, "error");
		},
		"open <target>",
		(ctx, req) => {
			if (req.argIndex !== 0) return [];
			const alias = getOpenAliasMap(ctx.profile);
			const candidates = [...alias.keys(), ...ctx.listHome()];
			const p = (req.prefix ?? "").toLowerCase();
			return Array.from(new Set(candidates))
				.filter((c) => String(c).toLowerCase().startsWith(p))
				.sort();
		},
	);
	cmd("bio", "Shortcut: cat bio.txt", (ctx) =>
		commands.get("cat")?.execute(ctx, ["bio.txt"]),
	);
	cmd("projects", "Shortcut: cat projects.txt", (ctx) =>
		commands.get("cat")?.execute(ctx, ["projects.txt"]),
	);
	cmd("socials", "Shortcut: cat socials.txt", (ctx) =>
		commands.get("cat")?.execute(ctx, ["socials.txt"]),
	);
	cmd(
		"theme",
		"Switch theme",
		(ctx, args) => {
			const next = (args[0] ?? "").toLowerCase();
			const current = ctx.theme.get();
			if (!next) {
				ctx.printLine(`theme: current is "${current}"`, "muted");
				ctx.printLine("Try: theme dark | theme light | theme toggle", "muted");
				return;
			}
			if (next === "toggle") {
				const target = current === "light" ? "dark" : "light";
				ctx.theme.set(target);
				ctx.printLine(`theme: set to "${target}"`, "muted");
				return;
			}
			if (next !== "dark" && next !== "light") {
				ctx.printLine('theme: expected "dark" or "light"', "error");
				return;
			}
			ctx.theme.set(next);
			ctx.printLine(`theme: set to "${next}"`, "muted");
		},
		"theme [dark|light|toggle]",
	);
	return { commands };
}
