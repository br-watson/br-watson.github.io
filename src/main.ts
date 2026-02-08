import { createCommandRegistry } from "./core/commands.js";
import { createTerminal } from "./core/terminal.js";
import { buildFs } from "./data/fs.js";
import { PROFILE } from "./data/profile.js";
import { createSafeOpener } from "./services/openUrl.js";
import { createPromptController } from "./services/prompt.js";
import { createThemeController } from "./services/theme.js";
import { createToast } from "./services/toast.js";
import { createDomRenderer } from "./ui/domRenderer.js";
import { setupQuickLinks } from "./ui/quickLinks.js";

const screen = document.getElementById("screen");
const form = document.getElementById("prompt") as HTMLFormElement;
const input = document.getElementById("input") as HTMLInputElement;
const themeToggle = document.getElementById("themeToggle");
const toastEl = document.getElementById("toast");
const title = document.querySelector(".title");
const ps1 = document.querySelector(".ps1");
const quickLinks = document.getElementById("quickLinks");
const quickLinksList = document.getElementById("quickLinksList");
const mobileAssist = document.getElementById("mobileAssist");
const mobileSuggestions = document.getElementById("mobileSuggestions");
const mobileEnter = document.getElementById("mobileEnter");
const prefersCoarsePointer = window.matchMedia("(pointer: coarse)").matches;

const SHELL_ID = "brad@portfolio";

if (title) title.textContent = `${SHELL_ID}: ~`;
if (ps1) ps1.textContent = SHELL_ID;

const toast = createToast(toastEl);
const { controller: themeController, applyInitialTheme } =
	createThemeController({
		themeToggle,
		toast,
	});
const openUrl = createSafeOpener(toast);

if (!screen) {
	throw new Error("Screen element not found.");
}

const renderer = createDomRenderer({ screen });
const { commands } = createCommandRegistry({
	profile: PROFILE,
	isMobile: prefersCoarsePointer,
});
const terminal = createTerminal({
	renderer,
	profile: PROFILE,
	fs: buildFs(PROFILE),
	commands,
	theme: themeController,
	openUrl,
});

const prompt = createPromptController({
	form,
	input,
	terminal,
	renderer,
	mobileAssist,
	mobileSuggestions,
	mobileEnter: mobileEnter instanceof HTMLButtonElement ? mobileEnter : null,
	enableMobileAssist: prefersCoarsePointer,
});

setupQuickLinks({
	container: quickLinks,
	list: quickLinksList,
	profile: PROFILE,
	aliases: ["cv", "github", "linkedin"],
	onRunCommand: async (command) => {
		if (prefersCoarsePointer && document.activeElement === input) {
			input.blur();
		}
		terminal.addHistory(command);
		await terminal.run(command);
		renderer.scrollToBottom();
		prompt.refreshMobileAssist();
		// Avoid iOS Safari auto-zoom/keyboard pop on quick-link taps.
		if (!prefersCoarsePointer) prompt.focus();
	},
});

applyInitialTheme();
terminal.boot();
if (!prefersCoarsePointer) prompt.focus();

let introResizeRaf = 0;
window.addEventListener("resize", () => {
	if (introResizeRaf) cancelAnimationFrame(introResizeRaf);
	introResizeRaf = requestAnimationFrame(() => {
		terminal.refreshIntroIfPristine();
		introResizeRaf = 0;
	});
});

let lastTouchEnd = 0;
document.addEventListener(
	"touchend",
	(event) => {
		const now = performance.now();
		if (event.touches.length > 0) return;
		if (now - lastTouchEnd <= 300) {
			event.preventDefault();
		}
		lastTouchEnd = now;
	},
	{ passive: false },
);
