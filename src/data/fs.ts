import type { Education, Profile, Project } from "./profile.js";

type FsNode =
	| { type: "dir"; children: Record<string, FsNode> }
	| { type: "file"; content: string }
	| { type: "link"; href: string }
	| { type: "links"; items: Record<string, string> }
	| { type: "projects"; projects: Project[] }
	| { type: "education"; education: Education[] }
	| { type: "bio"; lines: string[] };

export type FileSystem = Record<string, FsNode>;

export function buildFs(profile: Profile): FileSystem {
	return {
		"~": {
			type: "dir",
			children: {
				"README.txt": {
					type: "file",
					content: [
						"Welcome.",
						"",
						"Try: help, ls, cat README.txt, bio, projects, socials, open cv, open github",
					].join("\n"),
				},
				"bio.txt": {
					type: "bio",
					lines: profile.bio,
				},
				"projects.txt": {
					type: "projects",
					projects: profile.projects,
				},
				"socials.txt": {
					type: "links",
					items: profile.links,
				},
				"skills.txt": {
					type: "file",
					content: profile.skills.join(", "),
				},
				"education.txt": {
					type: "education",
					education: profile.education,
				},
				"roles.txt": {
					type: "file",
					content: profile.roles
						.map((r) => {
							const title = r.title ?? "Untitled Role";
							const company = r.company ? ` at ${r.company}` : "";
							const location = r.location ? ` in ${r.location}` : "";
							const dates = ` (${r.startDate} - ${r.endDate ?? "Present"})`;
							const desc = r.description ? `\n  ${r.description}` : "";
							return `- ${title}${company}${location}${dates}${desc}`;
						})
						.join("\n\n"),
				},
				"cv.pdf": {
					type: "link",
					href: profile.filePaths.cv,
				},
				"dissertation.pdf": {
					type: "link",
					href: profile.filePaths.dissertation,
				},
				"todo.md": {
					type: "file",
					content: profile.todo.map((t) => `- [ ] ${t}`).join("\n"),
				},
			},
		},
	};
}

export function getHomeDir(fs: FileSystem) {
	const home = fs["~"];
	if (!home || home.type !== "dir") {
		throw new Error("Invalid filesystem: missing home dir");
	}
	return home;
}

export function listHome(fs: FileSystem) {
	const children = Object.keys(getHomeDir(fs).children);
	return children.sort();
}

export function resolveHomeItem(fs: FileSystem, name: string) {
	return getHomeDir(fs).children[name];
}
