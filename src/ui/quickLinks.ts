import { buildOpenAliasMap } from "../core/commands.js";
import type { Profile } from "../data/profile.js";

interface QuickLinksOptions {
	container: HTMLElement | null;
	list: HTMLElement | null;
	profile: Profile;
	onRunCommand: (command: string) => Promise<void> | void;
	aliases: readonly string[];
}

export function setupQuickLinks({
	container,
	list,
	profile,
	onRunCommand,
	aliases,
}: QuickLinksOptions): void {
	if (!(container instanceof HTMLElement)) return;
	if (!(list instanceof HTMLElement)) return;

	const aliasMap = buildOpenAliasMap(profile);
	const commands = aliases
		.filter((alias) => aliasMap.has(alias))
		.map((alias) => `open ${alias}`);

	list.replaceChildren();

	if (commands.length === 0) {
		container.hidden = true;
		return;
	}

	for (const commandText of commands) {
		const button = document.createElement("button");
		button.type = "button";
		button.className = "quick-link";
		button.dataset.command = commandText;
		button.setAttribute("aria-label", `Run ${commandText}`);
		button.title = commandText;

		const sigil = document.createElement("span");
		sigil.className = "quick-link-sigil";
		sigil.textContent = "$";

		const command = document.createElement("span");
		command.textContent = commandText;

		button.append(sigil, command);
		list.appendChild(button);
	}

	list.addEventListener("click", async (event) => {
		const target = event.target;
		if (!(target instanceof Element)) return;

		const button = target.closest("button[data-command]");
		if (!(button instanceof HTMLButtonElement)) return;

		const command = button.dataset.command?.trim();
		if (!command) return;

		if (event.detail > 0) {
			button.blur();
		}

		await onRunCommand(command);
	});

	container.hidden = false;
}
