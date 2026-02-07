export function createSafeOpener(toast) {
    return function openUrlSafely(href) {
        const allowedProtocols = new Set(["https:", "mailto:"]);
        try {
            const url = new URL(href, window.location.href);
            if (!allowedProtocols.has(url.protocol) &&
                url.origin !== window.location.origin) {
                toast.show("Blocked unsafe URL");
                return;
            }
        }
        catch {
            toast.show("Invalid URL");
            return;
        }
        window.open(String(href), "_blank", "noopener,noreferrer");
    };
}
