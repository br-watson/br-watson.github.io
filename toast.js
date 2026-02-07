export function createToast(toast, durationMs = 1500) {
    let timer;
    function show(message) {
        if (!toast)
            return;
        toast.textContent = message;
        toast.classList.add("show");
        toast.setAttribute("aria-hidden", "false");
        if (timer)
            window.clearTimeout(timer);
        timer = window.setTimeout(() => {
            toast.classList.remove("show");
            toast.setAttribute("aria-hidden", "true");
        }, durationMs);
    }
    return { show };
}
