import type { Profile } from "../../data/profile.js";
import type { Commands, RegisterCommand } from "./types.js";

interface ContentOptions {
	profile: Profile;
	commands: Commands;
	registerCommand: RegisterCommand;
}

interface AliasDefinition {
	name: string;
	summary: string;
	usage: string;
	targetCommand: string;
	args: string[];
}

function registerAliases(
	registerCommand: RegisterCommand,
	commands: Commands,
	aliases: AliasDefinition[],
) {
	for (const alias of aliases) {
		registerCommand(alias.name, alias.summary, alias.usage, (ctx) =>
			commands.get(alias.targetCommand)?.execute(ctx, alias.args),
		);
	}
}

export function registerContentCommands({
	profile,
	commands,
	registerCommand,
}: ContentOptions) {
	registerCommand("whoami", "About me", "whoami", (ctx) => {
		ctx.printLine(
			`${String(profile.name)} — ${String(profile.role)} (${String(profile.location)})`,
		);
	});

	registerAliases(registerCommand, commands, [
		{
			name: "bio",
			summary: "Alias: cat bio.txt",
			usage: "bio",
			targetCommand: "cat",
			args: ["bio.txt"],
		},
		{
			name: "projects",
			summary: "Alias: cat projects.txt",
			usage: "projects",
			targetCommand: "cat",
			args: ["projects.txt"],
		},
		{
			name: "socials",
			summary: "Alias: cat socials.txt",
			usage: "socials",
			targetCommand: "cat",
			args: ["socials.txt"],
		},
		{
			name: "cv",
			summary: "Alias: open cv",
			usage: "cv",
			targetCommand: "open",
			args: ["cv"],
		},
		{
			name: "skills",
			summary: "List my skills",
			usage: "skills",
			targetCommand: "cat",
			args: ["skills.txt"],
		},
		{
			name: "education",
			summary: "List my education",
			usage: "education",
			targetCommand: "cat",
			args: ["education.txt"],
		},
		{
			name: "roles",
			summary: "List my roles and experience",
			usage: "roles",
			targetCommand: "cat",
			args: ["roles.txt"],
		},
	]);
}
