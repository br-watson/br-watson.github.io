import type { Profile } from "../../data/profile.js";

export function buildOpenAliasMap(profile: Profile) {
	const aliases = new Map<string, string>();

	if (profile.links.github) aliases.set("github", profile.links.github);
	if (profile.links.linkedin) aliases.set("linkedin", profile.links.linkedin);

	if (profile.filePaths.cv) aliases.set("cv", profile.filePaths.cv);
	if (profile.filePaths.dissertation)
		aliases.set("dissertation", profile.filePaths.dissertation);
	if (profile.email) aliases.set("email", `mailto:${profile.email}`);

	return aliases;
}
