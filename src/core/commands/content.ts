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
	showInHelp: boolean;
	showInMobileTray: boolean;
}

function registerAliases(
	registerCommand: RegisterCommand,
	commands: Commands,
	aliases: AliasDefinition[],
) {
	for (const alias of aliases) {
		registerCommand({
			name: alias.name,
			summary: alias.summary,
			usage: alias.usage,
			showInHelp: alias.showInHelp,
			showInMobileTray: alias.showInMobileTray,
			argMode: "none",
			execute: (ctx) =>
				commands.get(alias.targetCommand)?.execute(ctx, alias.args),
		});
	}
}

export function registerContentCommands({
	profile,
	commands,
	registerCommand,
}: ContentOptions) {
	registerCommand({
		name: "whoami",
		summary: "About me",
		usage: "whoami",
		showInHelp: true,
		showInMobileTray: true,
		argMode: "none",
		execute: (ctx) => {
			ctx.printLine(
				`${String(profile.name)} — ${String(profile.role)} (${String(profile.location)})`,
			);
		},
	});

	registerAliases(registerCommand, commands, [
		{
			name: "bio",
			summary: "Alias: cat bio.txt",
			usage: "bio",
			targetCommand: "cat",
			args: ["bio.txt"],
			showInHelp: true,
			showInMobileTray: true,
		},
		{
			name: "projects",
			summary: "Alias: cat projects.txt",
			usage: "projects",
			targetCommand: "cat",
			args: ["projects.txt"],
			showInHelp: true,
			showInMobileTray: true,
		},
		{
			name: "contact",
			summary: "Alias: cat contact.txt",
			usage: "contact",
			targetCommand: "cat",
			args: ["contact.txt"],
			showInHelp: true,
			showInMobileTray: true,
		},
		{
			name: "cv",
			summary: "Alias: open cv",
			usage: "cv",
			targetCommand: "open",
			args: ["cv"],
			showInHelp: true,
			showInMobileTray: true,
		},
		{
			name: "skills",
			summary: "List my skills",
			usage: "skills",
			targetCommand: "cat",
			args: ["skills.txt"],
			showInHelp: true,
			showInMobileTray: true,
		},
		{
			name: "education",
			summary: "List my education",
			usage: "education",
			targetCommand: "cat",
			args: ["education.txt"],
			showInHelp: true,
			showInMobileTray: true,
		},
		{
			name: "roles",
			summary: "List my roles and experience",
			usage: "roles",
			targetCommand: "cat",
			args: ["roles.txt"],
			showInHelp: true,
			showInMobileTray: true,
		},
	]);
}
