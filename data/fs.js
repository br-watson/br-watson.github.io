export function buildFs(profile) {
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
                    type: "file",
                    content: profile.bio.join("\n"),
                },
                "projects.txt": {
                    type: "file",
                    content: profile.projects
                        .map((p) => `- ${p.name}\n  ${p.desc}\n  ${p.link}\n  tags: ${p.tags.join(", ")}`)
                        .join("\n\n"),
                },
                "socials.txt": {
                    type: "links",
                    items: profile.links,
                },
                "skills.txt": {
                    type: "file",
                    content: profile.skills.join(", "),
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
            },
        },
    };
}
export function getHomeDir(fs) {
    const home = fs["~"];
    if (!home || home.type !== "dir") {
        throw new Error("Invalid filesystem: missing home dir");
    }
    return home;
}
export function listHome(fs) {
    const children = Object.keys(getHomeDir(fs).children);
    return children.sort();
}
export function resolveHomeItem(fs, name) {
    return getHomeDir(fs).children[name];
}
