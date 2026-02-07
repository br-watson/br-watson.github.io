export interface Profile {
	name: string;
	nameAsciiArt?: string[];
	role: string;
	location: string;
	email: string;
	links: Record<string, string>;
	filePaths: {
		cv: string;
		dissertation: string;
	};
	bio: string[];
	projects: {
		name: string;
		desc: string;
		link: string;
		tags: string[];
	}[];
	skills: string[];
	roles: {
		title: string;
		company: string;
		location: string;
		startDate: string;
		endDate?: string;
		description?: string;
	}[];
	todo: string[];
}

export const PROFILE: Profile = {
	name: "Bradley Watson",
	nameAsciiArt: [
		"____________  ___ ______   _    _  ___ _____ _____  _____ _   _",
		"| ___ \\ ___ \\/ _ \\|  _  \\ | |  | |/ _ \\_   _/  ___||  _  | \\ | |",
		"| |_/ / |_/ / /_\\ \\ | | | | |  | / /_\\ \\| | \\ `--. | | | |  \\| |",
		"| ___ \\    /|  _  | | | | | |/\\| |  _  || |  `--. \\| | | | . ` |",
		"| |_/ / |\\ \\| | | | |/ /  \\  /\\  / | | || | /\\__/ /\\ \\_/ / |\\  |",
		"\\____/\\_| \\_\\_| |_/___/    \\/  \\/\\_| |_/\\_/ \\____/  \\___/\\_| \\_/",
	],
	role: "Software Engineer",
	location: "Leeds, UK",
	email: "you@example.com", // TODO: make this my real email address
	links: {
		github: "https://github.com/br-watson",
		linkedin: "https://www.linkedin.com/in/bradleyrwatson",
	},
	filePaths: {
		cv: "./assets/cv.pdf",
		dissertation: "./assets/diss.pdf",
	},
	bio: [
		"I build backend systems, pipelines, and cloud infrastructure.",
		"Current interests: TODO...",
		"This site is a small fake shell because normal portfolios are kinda boring.",
	],
	projects: [
		{
			name: "Terminal Portfolio",
			desc: "This project! A terminal-based portfolio website, built with TypeScript and HTML.",
			link: "https://github.com/br-watson/br-watson.github.io",
			tags: ["TypeScript", "HTML", "CSS"],
		},
		{
			name: "TODO...",
			desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
			link: "",
			tags: ["TODO..."],
		},
	],
	skills: ["TypeScript", "AWS", "TODO..."],
	roles: [
		{
			title: "Software Engineer",
			company: "Sky UK",
			location: "Leeds, UK",
			startDate: "Sep 2024",
			description: "TODO...",
		},
		{
			title: "Associate Software Engineer",
			company: "Sky UK",
			location: "Leeds, UK",
			startDate: "Sep 2023",
			endDate: "Sep 2024",
			description: "TODO...",
		},
	],
	todo: [
		"Finish writing profile (bio, experience, projects, skills etc.)",
		"Make projects links clickable",
		"Allow projects to have multiple links (or a git link and a deployment link)",
		"Add more commands",
		"Improve txt files output formatting",
		"Make actual CV",
		"Add education section",
		"Add way for mobile to access command history and autocomplete",
		"Make banner nicer on mobile",
		"Write README",
	],
};
