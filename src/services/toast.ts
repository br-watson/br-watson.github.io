interface ToastController {
	show: (message: string | null) => void;
}

export function createToast(
	toast: HTMLElement | null,
	durationMs: number = 1500,
): ToastController {
	let timer: number | undefined;

	function show(message: string | null): void {
		if (!toast) return;
		toast.textContent = message;
		toast.classList.add("show");
		toast.setAttribute("aria-hidden", "false");
		if (timer) window.clearTimeout(timer);
		timer = window.setTimeout(() => {
			toast.classList.remove("show");
			toast.setAttribute("aria-hidden", "true");
		}, durationMs);
	}

	return { show };
}
