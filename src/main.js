import { createTerminal } from "./core/terminal.js";
import { createCommandRegistry } from "./core/commands.js";
import { createDomRenderer } from "./ui/domRenderer.js";
const screen = document.getElementById("screen");
const form = document.getElementById("prompt");
const input = document.getElementById("input");
const themeToggle = document.getElementById("themeToggle");
const toast = document.getElementById("toast");
const title = document.querySelector(".title");
const ps1 = document.querySelector(".ps1");
const SHELL_ID = "brad@portfolio";
if (title) title.textContent = `${SHELL_ID}: ~`;
if (ps1) ps1.textContent = SHELL_ID;
const PROFILE = {
	name: "Bradley Watson",
	role: "Software Engineer",
	location: "UK",
	email: "you@example.com",
	links: {
		github: "https://github.com/your-handle",
		linkedin: "https://www.linkedin.com/in/your-handle",
	},
	cvPath: "./assets/cv.pdf",
	bio: [
		"I build backend systems, pipelines, and cloud infrastructure.",
		"Current interests: AWS, TypeScript, CI/CD, and making tooling less painful.",
		"This site is a tiny fake shell because normal portfolios are boring.",
	],
	projects: [
		{
			name: "Project Alpha",
			desc: "Short punchy description. What problem, what stack, what impact.",
			link: "https://github.com/your-handle/project-alpha",
			tags: ["TypeScript", "AWS", "CDK"],
		},
		{
			name: "Project Beta",
			desc: "Another one. Keep it outcome-focused.",
			link: "https://example.com",
			tags: ["NestJS", "Postgres"],
		},
	],
};
const FS = {
	"~": {
		type: "dir",
		children: {
			"README.txt": {
				type: "file",
				content: [
					"Welcome.",
					"",
					"Try: help, ls, cat README.txt, bio, projects, socials, open cv, open github",
				].join("\n"),
			},
			"bio.txt": {
				type: "file",
				content: PROFILE.bio.join("\n"),
			},
			"projects.txt": {
				type: "file",
				content: PROFILE.projects
					.map(
						(p) =>
							`- ${p.name}\n  ${p.desc}\n  ${p.link}\n  tags: ${p.tags.join(", ")}`,
					)
					.join("\n\n"),
			},
			"socials.txt": {
				type: "file",
				content: Object.entries(PROFILE.links)
					.map(([k, v]) => `${k}: ${v}`)
					.join("\n"),
			},
			"cv.pdf": {
				type: "link",
				href: PROFILE.cvPath,
			},
		},
	},
};
const THEME_KEY = "terminal-theme";
function isTheme(value) {
	return value === "light" || value === "dark";
}
function normalizeTheme(value) {
	return value.toLowerCase() === "light" ? "light" : "dark";
}
function getStoredTheme() {
	const value = localStorage.getItem(THEME_KEY);
	return isTheme(value) ? value : null;
}
function getPreferredTheme() {
	const prefersLight = window.matchMedia?.(
		"(prefers-color-scheme: light)",
	)?.matches;
	return prefersLight ? "light" : "dark";
}
const initialTheme = getStoredTheme() ?? getPreferredTheme();
let activeTheme = normalizeTheme(initialTheme);
let toastTimer;
function showToast(message) {
	if (!toast) return;
	toast.textContent = message;
	toast.classList.add("show");
	toast.setAttribute("aria-hidden", "false");
	if (toastTimer) window.clearTimeout(toastTimer);
	toastTimer = window.setTimeout(() => {
		toast.classList.remove("show");
		toast.setAttribute("aria-hidden", "true");
	}, 1500);
}
function applyTheme(
	next,
	{ persist = true, announce = true, force = false } = {},
) {
	const theme = normalizeTheme(next);
	const changed = theme !== activeTheme;
	activeTheme = theme;
	if (changed || force) {
		document.documentElement.dataset.theme = theme;
		if (themeToggle) {
			const nextLabel = theme === "light" ? "Dark" : "Light";
			themeToggle.setAttribute("aria-pressed", String(theme === "light"));
			themeToggle.setAttribute(
				"aria-label",
				`Switch to ${nextLabel.toLowerCase()} theme`,
			);
			themeToggle.textContent = nextLabel;
		}
	}
	if (persist) localStorage.setItem(THEME_KEY, theme);
	if (announce && changed) showToast(`theme: ${theme}`);
}
const themeController = {
	get: () => activeTheme,
	set: (next) => applyTheme(next, { persist: true, announce: true }),
	toggle: () =>
		applyTheme(activeTheme === "light" ? "dark" : "light", {
			persist: true,
			announce: true,
		}),
};
function openUrlSafely(href) {
	const allowedProtocols = new Set(["http:", "https:", "mailto:"]);
	try {
		const url = new URL(href, window.location.href);
		if (
			!allowedProtocols.has(url.protocol) &&
			url.origin !== window.location.origin
		) {
			showToast("Blocked unsafe URL");
			return;
		}
	} catch {
		showToast("Invalid URL");
		return;
	}
	window.open(href, "_blank", "noopener,noreferrer");
}
const renderer = createDomRenderer({ screen });
const { commands } = createCommandRegistry({ profile: PROFILE });
const terminal = createTerminal({
	renderer,
	profile: PROFILE,
	fs: FS,
	commands,
	theme: themeController,
	openUrl: openUrlSafely,
});
applyTheme(initialTheme, { persist: false, announce: false, force: true });
function focusInput() {
	input.focus({ preventScroll: true });
}
function moveCaretToEnd(el) {
	requestAnimationFrame(() => {
		el.selectionStart = el.selectionEnd = el.value.length;
	});
}
form.addEventListener("submit", async (e) => {
	e.preventDefault();
	const line = input.value;
	input.value = "";
	if (line.trim()) {
		terminal.addHistory(line);
		await terminal.run(line);
	}
	renderer.scrollToBottom();
	focusInput();
});
if (themeToggle) {
	themeToggle.addEventListener("click", () => {
		themeController.toggle();
	});
}
input.addEventListener("keydown", (e) => {
	if (e.altKey || e.ctrlKey || e.metaKey) return;
	if (e.key === "ArrowUp") {
		e.preventDefault();
		const next = terminal.historyUp();
		if (next === null) return;
		input.value = next;
		moveCaretToEnd(input);
	}
	if (e.key === "ArrowDown") {
		e.preventDefault();
		const next = terminal.historyDown();
		if (next === null) return;
		input.value = next;
		moveCaretToEnd(input);
	}
	if (e.key === "Tab") {
		if (e.shiftKey) return;
		e.preventDefault();
		input.value = terminal.autocomplete(input.value);
		moveCaretToEnd(input);
	}
});
terminal.boot();
focusInput();
