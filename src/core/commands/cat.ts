import type { Context } from "../terminal.js";
import { completeFirstArg } from "./completion.js";
import type { RegisterCommand } from "./types.js";

const COMPLETABLE_CAT_TYPES = new Set([
	"file",
	"bio",
	"link",
	"links",
	"projects",
	"education",
]);

type HomeItem = NonNullable<ReturnType<Context["resolveHomeItem"]>>;

function renderBio(ctx: Context, item: Extract<HomeItem, { type: "bio" }>) {
	const { t, s } = ctx.seg;
	const entries = item.lines.flatMap((line, index) => [
		t(line),
		...(index < item.lines.length - 1 ? [t("\n\n")] : []),
	]);
	ctx.printLine([s("accent", "About\n"), ...entries], "muted");
}

function renderFile(ctx: Context, item: Extract<HomeItem, { type: "file" }>) {
	ctx.printPre(String(item.content), "ok");
}

function renderLink(
	ctx: Context,
	name: string,
	item: Extract<HomeItem, { type: "link" }>,
) {
	const { t, l, s } = ctx.seg;
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
}

function renderLinks(ctx: Context, item: Extract<HomeItem, { type: "links" }>) {
	const { t, l, s } = ctx.seg;
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
	ctx.printLine(entries, "muted");
}

function renderProjects(
	ctx: Context,
	item: Extract<HomeItem, { type: "projects" }>,
) {
	const { t, l, s } = ctx.seg;
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
	ctx.printLine(entries, "muted");
}

function renderEducation(
	ctx: Context,
	item: Extract<HomeItem, { type: "education" }>,
) {
	const { t, l, s } = ctx.seg;
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
		e.tags && e.tags.length > 0 ? t(`Tags: ${e.tags.join(", ")}\n`) : t(""),
		t("\n"),
	]);
	ctx.printLine(entries, "muted");
}

function renderHomeItem(ctx: Context, name: string, item: HomeItem) {
	switch (item.type) {
		case "bio":
			renderBio(ctx, item);
			break;
		case "file":
			renderFile(ctx, item);
			break;
		case "link":
			renderLink(ctx, name, item);
			break;
		case "links":
			renderLinks(ctx, item);
			break;
		case "projects":
			renderProjects(ctx, item);
			break;
		case "education":
			renderEducation(ctx, item);
			break;
		default:
			ctx.printLine(`cat: ${name}: Not a file`, "error");
			break;
	}
}

export function registerCatCommand(registerCommand: RegisterCommand) {
	registerCommand(
		"cat",
		"Print file contents",
		"cat <file>",
		(ctx, args) => {
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

			renderHomeItem(ctx, name, item);
		},
		(ctx, req) => {
			const candidates = ctx.listHome().filter((entry: string) => {
				const item = ctx.resolveHomeItem(entry);
				return item ? COMPLETABLE_CAT_TYPES.has(item.type) : false;
			});
			return completeFirstArg(req, candidates);
		},
	);
}
