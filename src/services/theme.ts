export type Theme = "light" | "dark";

type Toast = { show: (message: string | null) => void };

export interface ThemeController {
	get: () => Theme;
	set: (next: Theme) => void;
	toggle: () => void;
}

interface ThemeOptions {
	themeToggle: HTMLElement | null;
	toast: Toast;
	storage?: Storage;
	doc?: Document;
	matchMedia?: Window["matchMedia"];
}

interface ApplyOptions {
	persist?: boolean;
	announce?: boolean;
	force?: boolean;
}

const THEME_KEY = "terminal-theme";

function isTheme(value: string | null): value is Theme {
	return value === "light" || value === "dark";
}

function normalizeTheme(value: string): Theme {
	return value.toLowerCase() === "light" ? "light" : "dark";
}

function getOppositeTheme(theme: Theme): Theme {
	return theme.toLowerCase() === "light" ? "dark" : "light";
}

export function createThemeController({
	themeToggle,
	toast,
	storage = window.localStorage,
	doc = document,
	matchMedia = window.matchMedia?.bind(window),
}: ThemeOptions) {
	function getStoredTheme(): Theme | null {
		const value: string | null = storage.getItem(THEME_KEY);
		return isTheme(value) ? value : null;
	}

	function getPreferredTheme(): Theme {
		const prefersLight = matchMedia?.("(prefers-color-scheme: light)")?.matches;
		return prefersLight ? "light" : "dark";
	}

	const initialTheme: Theme = getStoredTheme() ?? getPreferredTheme();
	let activeTheme: Theme = normalizeTheme(initialTheme);

	function applyTheme(next: Theme, options: ApplyOptions = {}): void {
		const { persist = true, announce = true, force = false } = options;
		const theme = normalizeTheme(next);
		const changed = theme !== activeTheme;
		activeTheme = theme;

		if (changed || force) {
			doc.documentElement.dataset.theme = theme;
			if (themeToggle) {
				const nextLabel = getOppositeTheme(theme);
				themeToggle.setAttribute("aria-pressed", String(theme === "light"));
				themeToggle.setAttribute(
					"aria-label",
					`Switch to ${nextLabel.toLowerCase()} theme`,
				);
				themeToggle.textContent = nextLabel;
			}
		}

		if (persist) storage.setItem(THEME_KEY, theme);
		if (announce && changed) toast.show(`theme: ${theme}`);
	}

	const controller: ThemeController = {
		get: () => activeTheme,
		set: (next: Theme) => applyTheme(next, { persist: true, announce: true }),
		toggle: () =>
			applyTheme(getOppositeTheme(activeTheme), {
				persist: true,
				announce: true,
			}),
	};

	if (themeToggle) {
		themeToggle.addEventListener("click", () => controller.toggle());
	}

	function applyInitialTheme(): void {
		applyTheme(initialTheme, { persist: false, announce: false, force: true });
	}

	return { controller, applyInitialTheme };
}
