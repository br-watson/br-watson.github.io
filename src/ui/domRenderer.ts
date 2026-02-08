import type { Segment } from "../core/terminal";

export interface Renderer {
	printLine: (segments: Segment[], className: string) => void;
	printPre: (text: string, className: string) => void;
	clear: () => void;
	scrollToBottom: () => void;
	getColumns: () => number;
}

export function createDomRenderer({
	screen,
}: {
	screen: HTMLElement;
}): Renderer {
	function measureCharacterWidth(): number {
		const probe = document.createElement("span");
		probe.className = "line ok";
		probe.style.position = "absolute";
		probe.style.visibility = "hidden";
		probe.style.whiteSpace = "pre";
		probe.textContent = "M";
		screen.appendChild(probe);
		const width = probe.getBoundingClientRect().width;
		screen.removeChild(probe);
		return width || 8;
	}

	function getColumns(): number {
		const charWidth = measureCharacterWidth();
		return Math.max(1, Math.floor(screen.clientWidth / charWidth));
	}

	function isSafeHref(href: string): boolean {
		const allowedProtocols = new Set(["https:", "mailto:"]);
		try {
			const url = new URL(href, window.location.href);
			if (allowedProtocols.has(url.protocol)) return true;
			return url.origin === window.location.origin;
		} catch {
			return false;
		}
	}

	function renderSegment(seg: Segment) {
		if (seg.type === "text") {
			return document.createTextNode(seg.text);
		}

		if (seg.type === "span") {
			const el = document.createElement("span");
			el.className = seg.className;
			el.textContent = seg.text;
			return el;
		}

		if (seg.type === "link") {
			if (!isSafeHref(seg.href)) {
				return document.createTextNode(seg.text ?? seg.href);
			}
			const a = document.createElement("a");
			a.href = seg.href;
			a.target = "_blank";
			a.rel = "noopener noreferrer";
			a.textContent = seg.text ?? seg.href;
			return a;
		}

		return document.createTextNode("");
	}

	function buildInlineContent(segments: Segment[]): DocumentFragment {
		const frag = document.createDocumentFragment();
		for (const seg of segments) frag.appendChild(renderSegment(seg));
		return frag;
	}

	function printLine(segments: Segment[], className = "ok"): void {
		const block = document.createElement("div");
		block.className = "block";

		block.classList.add("wrap-text");

		const line = document.createElement("div");
		line.className = `line ${className} wrap-text`;
		line.appendChild(buildInlineContent(segments));

		block.appendChild(line);
		screen.appendChild(block);
	}

	function printPreformatted(text: string, className: string = "ok"): void {
		const block = document.createElement("div");
		block.className = "block";

		const line = document.createElement("div");
		line.className = `line ${className}`;

		const pre = document.createElement("pre");
		pre.className = "pre";
		pre.textContent = text;

		line.appendChild(pre);
		block.appendChild(line);
		screen.appendChild(block);
	}

	function clear(): void {
		while (screen.firstChild) screen.removeChild(screen.firstChild);
	}

	function scrollToBottom(): void {
		screen.scrollTop = screen.scrollHeight;
	}

	return {
		printLine,
		printPre: printPreformatted,
		clear,
		scrollToBottom,
		getColumns,
	};
}
