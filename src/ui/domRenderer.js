export function createDomRenderer({ screen }) {
	function isSafeHref(href) {
		const allowedProtocols = new Set(["http:", "https:", "mailto:"]);
		try {
			const url = new URL(href, window.location.href);
			if (allowedProtocols.has(url.protocol)) return true;
			return url.origin === window.location.origin;
		} catch {
			return false;
		}
	}
	function renderSegment(seg) {
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
	function buildInlineContent(segments) {
		const frag = document.createDocumentFragment();
		for (const seg of segments) frag.appendChild(renderSegment(seg));
		return frag;
	}
	function printLine(segments, cls = "ok") {
		const block = document.createElement("div");
		block.className = "block";
		const line = document.createElement("div");
		line.className = `line ${cls}`;
		line.appendChild(buildInlineContent(segments));
		block.appendChild(line);
		screen.appendChild(block);
	}
	function printPre(text, cls = "ok") {
		const block = document.createElement("div");
		block.className = "block";
		const line = document.createElement("div");
		line.className = `line ${cls}`;
		const pre = document.createElement("pre");
		pre.className = "pre";
		pre.textContent = text;
		line.appendChild(pre);
		block.appendChild(line);
		screen.appendChild(block);
	}
	function clear() {
		while (screen.firstChild) screen.removeChild(screen.firstChild);
	}
	function scrollToBottom() {
		screen.scrollTop = screen.scrollHeight;
	}
	return {
		printLine,
		printPre,
		clear,
		scrollToBottom,
	};
}
