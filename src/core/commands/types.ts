import type { Context } from "../terminal.js";

export interface CompletionRequest {
	line: string;
	tokens: string[];
	args: string[];
	endsWithWhitespace: boolean;
	argIndex: number;
	prefix: string;
}

export type ArgMode = "none" | "optional" | "required";

export interface Command {
	name: string;
	summary: string;
	usage: string;
	showInHelp: boolean;
	showInMobileTray: boolean;
	argMode: ArgMode;
	execute: (ctx: Context, args: string[]) => void | Promise<void>;
	complete?: (ctx: Context, req: CompletionRequest) => string[];
}

export type Commands = Map<string, Command>;
export type RegisterCommand = (command: Command) => void;
