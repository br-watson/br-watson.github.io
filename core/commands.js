export function buildOpenAliasMap(profile) {
    const aliases = new Map();
    if (profile.links.github)
        aliases.set("github", profile.links.github);
    if (profile.links.linkedin)
        aliases.set("linkedin", profile.links.linkedin);
    if (profile.filePaths.cv)
        aliases.set("cv", profile.filePaths.cv);
    if (profile.filePaths.dissertation)
        aliases.set("dissertation", profile.filePaths.dissertation);
    if (profile.email)
        aliases.set("email", `mailto:${profile.email}`);
    return aliases;
}
export function createCommandRegistry({ profile }) {
    const commands = new Map();
    const cmd = (name, summary, usage, execute, complete) => {
        commands.set(name, { name, summary, usage, execute, complete });
    };
    cmd("help", "Show this help", "help", (ctx) => {
        const { s } = ctx.seg;
        ctx.printLine([s("accent", "Available commands")], "ok");
        const rows = Array.from(commands.values())
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((c) => `${c.name.padEnd(12, " ")} ${c.summary.padEnd(32, " ")} ${c.usage}`);
        const lines = [
            `${"COMMAND".padEnd(12, " ")} ${"SUMMARY".padEnd(32, " ")} USAGE`,
            "",
            ...rows,
            "",
            "Tips: use ↑/↓ for history, Tab for autocomplete (Shift+Tab to move focus).",
        ];
        ctx.printPre(lines.join("\n"), "ok");
    });
    cmd("clear", "Clear the screen", "clear", (ctx) => ctx.clear());
    cmd("whoami", "About me", "whoami", (ctx) => {
        ctx.printLine(`${String(profile.name)} — ${String(profile.role)} (${String(profile.location)})`);
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
            ctx.printLine('ls: only "~" is supported in this tiny filesystem', "error");
            return;
        }
        ctx.printPre(ctx.listHome().join("\n"), "ok");
    });
    cmd("cat", "Print file contents", "cat <file>", (ctx, args) => {
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
        if (item.type === "file") {
            ctx.printPre(String(item.content), "ok");
            return;
        }
        if (item.type === "link") {
            ctx.printLine([
                t(`${name} -> `),
                l(item.href),
                t(" (click me! or run "),
                s("accent", `open ${name}`),
                t(")"),
            ], "muted");
            return;
        }
        if (item.type === "links") {
            const padOnly = (str, targetLen) => " ".repeat(Math.max(0, targetLen - str.length));
            const entries = Object.entries(item.items).flatMap(([key, href]) => [
                t(`${key}: `.padEnd(10, " ")),
                l(href, key),
                t(padOnly(key, 10)),
                t(" (or run "),
                s("accent", `open ${key}`),
                t(")\n"),
            ]);
            ctx.printLine(entries, "muted");
            return;
        }
        ctx.printLine(`cat: ${name}: Not a file`, "error");
    }, (ctx, req) => {
        if (req.argIndex !== 0)
            return [];
        const candidates = ctx
            .listHome()
            .filter((entry) => ctx.resolveHomeItem(entry)?.type === "file" ||
            ctx.resolveHomeItem(entry)?.type === "link" ||
            ctx.resolveHomeItem(entry)?.type === "links");
        const p = (req.prefix ?? "").toLowerCase();
        return candidates
            .filter((c) => String(c).toLowerCase().startsWith(p))
            .sort();
    });
    cmd("open", "Open link", "open <alias>", (ctx, args) => {
        const { t, l } = ctx.seg;
        const targetRaw = args[0];
        const target = (targetRaw ?? "").toLowerCase();
        if (!target) {
            ctx.printLine("open: missing target (press Tab to see valid options)", "error");
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
    }, (ctx, req) => {
        if (req.argIndex !== 0)
            return [];
        const alias = buildOpenAliasMap(ctx.profile);
        const candidates = [...alias.keys()];
        const p = (req.prefix ?? "").toLowerCase();
        return Array.from(new Set(candidates))
            .filter((c) => String(c).toLowerCase().startsWith(p))
            .sort();
    });
    cmd("bio", "Alias: cat bio.txt", "bio", (ctx) => commands.get("cat")?.execute(ctx, ["bio.txt"]));
    cmd("projects", "Alias: cat projects.txt", "projects", (ctx) => commands.get("cat")?.execute(ctx, ["projects.txt"]));
    cmd("socials", "Alias: cat socials.txt", "socials", (ctx) => commands.get("cat")?.execute(ctx, ["socials.txt"]));
    cmd("cv", "Alias: open cv", "cv", (ctx) => commands.get("open")?.execute(ctx, ["cv"]));
    cmd("skills", "List my skills", "skills", (ctx) => commands.get("cat")?.execute(ctx, ["skills.txt"]));
    cmd("roles", "List my roles and experience", "roles", (ctx) => commands.get("cat")?.execute(ctx, ["roles.txt"]));
    cmd("theme", "Switch theme", "theme [dark|light|toggle]", (ctx, args) => {
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
    }, (_, req) => {
        if (req.argIndex !== 0)
            return [];
        const candidates = ["dark", "light", "toggle"];
        const p = (req.prefix ?? "").toLowerCase();
        return Array.from(new Set(candidates))
            .filter((c) => String(c).toLowerCase().startsWith(p))
            .sort();
    });
    return { commands };
}
