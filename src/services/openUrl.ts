interface Toast {
	show: (message: string | null) => void;
}

export function createSafeOpener(toast: Toast) {
	return function openUrlSafely(href: string | URL): void {
		const allowedProtocols = new Set(["https:", "mailto:"]);
		let url: URL;
		try {
			url = new URL(href, window.location.href);
			if (
				!allowedProtocols.has(url.protocol) &&
				url.origin !== window.location.origin
			) {
				toast.show("Blocked unsafe URL");
				return;
			}
		} catch {
			toast.show("Invalid URL");
			return;
		}

		if (url.protocol === "mailto:") {
			window.location.assign(url.toString());
			return;
		}

		window.open(url.toString(), "_blank", "noopener,noreferrer");
	};
}
