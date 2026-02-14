import { type Command, createCommandRegistry } from "./core/commands.js";
import { createTerminal } from "./core/terminal.js";
import { buildFs } from "./data/fs.js";
import { PROFILE } from "./data/profile.js";
import { createSafeOpener } from "./services/openUrl.js";
import { createPromptController } from "./services/prompt.js";
import { createThemeController } from "./services/theme.js";
import { createToast } from "./services/toast.js";
import { createDomRenderer } from "./ui/domRenderer.js";
import {
	type MobileTrayCommand,
	setupMobileCommandTray,
} from "./ui/mobileCommandTray.js";
import { setupQuickLinks } from "./ui/quickLinks.js";

function requireElement<T extends Element>(
	value: Element | null,
	isExpected: (element: Element) => element is T,
	errorMessage: string,
): T {
	if (!value || !isExpected(value)) {
		throw new Error(errorMessage);
	}

	return value;
}

const screen = requireElement(
	document.getElementById("screen"),
	(element): element is HTMLElement => element instanceof HTMLElement,
	"Screen element not found.",
);
const form = requireElement(
	document.getElementById("prompt"),
	(element): element is HTMLFormElement => element instanceof HTMLFormElement,
	"Prompt form element not found.",
);
const input = requireElement(
	document.getElementById("input"),
	(element): element is HTMLInputElement => element instanceof HTMLInputElement,
	"Prompt input element not found.",
);
const themeToggle = document.getElementById("themeToggle");
const toastEl = document.getElementById("toast");
const title = document.querySelector(".title");
const ps1 = document.querySelector(".ps1");
const quickLinks = document.getElementById("quickLinks");
const quickLinksList = document.getElementById("quickLinksList");
const mobileCommandTray = document.getElementById("mobileCommandTray");
const mobileCommandList = document.getElementById("mobileCommandList");
const mobileTrayBack = document.getElementById("mobileTrayBack");
const mobileCustomTrigger = document.getElementById("mobileCustomTrigger");
const mobileCommandDialog = document.getElementById("mobileCommandDialog");
const mobileCustomForm = document.getElementById("mobileCustomForm");
const mobileCustomInput = document.getElementById("mobileCustomInput");
const mobileCustomSuggestions = document.getElementById(
	"mobileCustomSuggestions",
);
const mobileCustomSuggestionsHint = document.getElementById(
	"mobileCustomSuggestionsHint",
);
const mobileCustomCancel = document.getElementById("mobileCustomCancel");
const prefersCoarsePointer = window.matchMedia("(pointer: coarse)").matches;

const SHELL_ID = "brad@portfolio";

const MOBILE_TRAY_PRIORITY = [
	"help",
	"contact",
	"bio",
	"projects",
	"roles",
	"education",
	"cv",
] as const;

function buildMobileTrayCommands(
	registry: ReadonlyMap<string, Command>,
): MobileTrayCommand[] {
	const all = Array.from(registry.values()).filter(
		(command) => command.showInMobileTray,
	);
	const prioritySet = new Set<string>(MOBILE_TRAY_PRIORITY);

	const prioritised: Command[] = [];
	for (const name of MOBILE_TRAY_PRIORITY) {
		const cmd = registry.get(name);
		if (cmd) prioritised.push(cmd);
	}

	const ordered = [
		...prioritised,
		...all.filter((command) => !prioritySet.has(command.name)),
	];

	return ordered.map((command) => ({
		command: command.name,
		kind: typeof command.complete === "function" ? "withArgs" : "simple",
	}));
}

if (title) title.textContent = `${SHELL_ID}: ~`;
if (ps1) ps1.textContent = SHELL_ID;

const toast = createToast(toastEl);
const { controller: themeController, applyInitialTheme } =
	createThemeController({
		themeToggle,
		toast,
	});
const openUrl = createSafeOpener(toast);

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
	isMobile: prefersCoarsePointer,
});
const mobileTrayCommands = buildMobileTrayCommands(commands);

let promptController: ReturnType<typeof createPromptController> | null = null;
let isRunningCommand = false;

async function runCommand(command: string): Promise<void> {
	const value = command.trim();
	if (value.length === 0 || isRunningCommand) return;

	isRunningCommand = true;
	try {
		promptController?.markFirstCommandSubmitted();
		terminal.addHistory(value);
		await terminal.run(value);
		renderer.scrollToBottom();
	} finally {
		isRunningCommand = false;
	}

	if (!prefersCoarsePointer) {
		promptController?.focus();
	}
}

promptController = createPromptController({
	form,
	input,
	terminal,
	onRunCommand: runCommand,
});

setupQuickLinks({
	container: quickLinks,
	list: quickLinksList,
	profile: PROFILE,
	aliases: ["cv", "github", "linkedin", "email"],
	onRunCommand: runCommand,
});

setupMobileCommandTray({
	enabled: prefersCoarsePointer,
	container: mobileCommandTray,
	list: mobileCommandList,
	back: mobileTrayBack instanceof HTMLButtonElement ? mobileTrayBack : null,
	customTrigger:
		mobileCustomTrigger instanceof HTMLButtonElement
			? mobileCustomTrigger
			: null,
	dialog: mobileCommandDialog,
	form: mobileCustomForm instanceof HTMLFormElement ? mobileCustomForm : null,
	input:
		mobileCustomInput instanceof HTMLInputElement ? mobileCustomInput : null,
	suggestions: mobileCustomSuggestions,
	suggestionsHint: mobileCustomSuggestionsHint,
	cancel:
		mobileCustomCancel instanceof HTMLButtonElement ? mobileCustomCancel : null,
	terminal,
	commands: mobileTrayCommands,
	onRunCommand: runCommand,
});

applyInitialTheme();
terminal.boot();
if (!prefersCoarsePointer) promptController?.focus();

let introResizeRaf = 0;
window.addEventListener("resize", () => {
	if (introResizeRaf) cancelAnimationFrame(introResizeRaf);
	introResizeRaf = requestAnimationFrame(() => {
		terminal.refreshIntroIfPristine();
		introResizeRaf = 0;
	});
});

if (prefersCoarsePointer) {
	let lastTouchEnd = 0;
	document.addEventListener(
		"touchend",
		(event) => {
			if (!event.cancelable) return;
			if (event.touches.length > 0) return;
			const now = performance.now();
			if (now - lastTouchEnd <= 300) {
				event.preventDefault();
			}
			lastTouchEnd = now;
		},
		{ passive: false },
	);
}
