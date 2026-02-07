export function createPromptController({ form, input, terminal, renderer, }) {
    function focus() {
        input.focus({ preventScroll: true });
    }
    function moveCaretToEnd() {
        requestAnimationFrame(() => {
            input.selectionStart = input.selectionEnd = input.value.length;
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
        focus();
    });
    input.addEventListener("keydown", (e) => {
        if (e.altKey || e.ctrlKey || e.metaKey)
            return;
        if (e.key === "ArrowUp") {
            e.preventDefault();
            const next = terminal.historyUp();
            if (next === null)
                return;
            input.value = next;
            moveCaretToEnd();
        }
        if (e.key === "ArrowDown") {
            e.preventDefault();
            const next = terminal.historyDown();
            if (next === null)
                return;
            input.value = next;
            moveCaretToEnd();
        }
        if (e.key === "Tab") {
            if (e.shiftKey)
                return;
            e.preventDefault();
            input.value = terminal.autocomplete(input.value);
            moveCaretToEnd();
        }
    });
    return { focus };
}
