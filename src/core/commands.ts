import type { Profile } from "../data/profile.js";
import { registerContentCommands } from "./commands/content.js";
import { registerNavigationCommands } from "./commands/navigation.js";
import { buildOpenAliasMap } from "./commands/openAliases.js";
import { registerSystemCommands } from "./commands/system.js";
import type {
	Command,
	Commands,
	CompletionRequest,
	RegisterCommand,
} from "./commands/types.js";

export type { Command, Commands, CompletionRequest };
export { buildOpenAliasMap };

export function createCommandRegistry({
	profile,
	isMobile = false,
}: {
	profile: Profile;
	isMobile?: boolean;
}) {
	const commands: Commands = new Map();

	const registerCommand: RegisterCommand = (
		name,
		summary,
		usage,
		showInHelp,
		execute,
		complete,
	) => {
		commands.set(name, { name, summary, usage, showInHelp, execute, complete });
	};

	registerSystemCommands({ commands, registerCommand, isMobile });
	registerNavigationCommands({ registerCommand, isMobile });
	registerContentCommands({ profile, commands, registerCommand });

	return { commands };
}
