import type { Context } from "../terminal.js";

export interface CompletionRequest {
	line: string;
	tokens: string[];
	args: string[];
	endsWithWhitespace: boolean;
	argIndex: number;
	prefix: string;
}

export interface Command {
	name: string;
	summary: string;
	usage: string;
	execute: (ctx: Context, args: string[]) => void | Promise<void>;
	complete?: (ctx: Context, req: CompletionRequest) => string[];
}

export type Commands = Map<string, Command>;

export type RegisterCommand = (
	name: string,
	summary: string,
	usage: string,
	execute: (ctx: Context, args: string[]) => void | Promise<void>,
	complete?: (ctx: Context, req: CompletionRequest) => string[],
) => void;
