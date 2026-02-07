const THEME_KEY = "terminal-theme";
function isTheme(value) {
    return value === "light" || value === "dark";
}
function normalizeTheme(value) {
    return value.toLowerCase() === "light" ? "light" : "dark";
}
function getOppositeTheme(theme) {
    return theme.toLowerCase() === "light" ? "dark" : "light";
}
export function createThemeController({ themeToggle, toast, storage = window.localStorage, doc = document, matchMedia = window.matchMedia?.bind(window), }) {
    function getStoredTheme() {
        const value = storage.getItem(THEME_KEY);
        return isTheme(value) ? value : null;
    }
    function getPreferredTheme() {
        const prefersLight = matchMedia?.("(prefers-color-scheme: light)")?.matches;
        return prefersLight ? "light" : "dark";
    }
    const initialTheme = getStoredTheme() ?? getPreferredTheme();
    let activeTheme = normalizeTheme(initialTheme);
    function applyTheme(next, options = {}) {
        const { persist = true, announce = true, force = false } = options;
        const theme = normalizeTheme(next);
        const changed = theme !== activeTheme;
        activeTheme = theme;
        if (changed || force) {
            doc.documentElement.dataset.theme = theme;
            if (themeToggle) {
                const nextLabel = getOppositeTheme(theme);
                themeToggle.setAttribute("aria-pressed", String(theme === "light"));
                themeToggle.setAttribute("aria-label", `Switch to ${nextLabel.toLowerCase()} theme`);
                themeToggle.textContent = nextLabel;
            }
        }
        if (persist)
            storage.setItem(THEME_KEY, theme);
        if (announce && changed)
            toast.show(`theme: ${theme}`);
    }
    const controller = {
        get: () => activeTheme,
        set: (next) => applyTheme(next, { persist: true, announce: true }),
        toggle: () => applyTheme(getOppositeTheme(activeTheme), {
            persist: true,
            announce: true,
        }),
    };
    if (themeToggle) {
        themeToggle.addEventListener("click", () => controller.toggle());
    }
    function applyInitialTheme() {
        applyTheme(initialTheme, { persist: false, announce: false, force: true });
    }
    return { controller, applyInitialTheme };
}
