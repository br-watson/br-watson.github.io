export interface Project {
	name: string;
	desc: string;
	repoLink?: string;
	deployedLink?: string;
	tags: string[];
}

export interface Education {
	qualification: string;
	institution: string;
	location: string;
	startDate: string;
	endDate: string;
	grade: string;
	description?: string;
	tags?: string[];
	dissertation?: {
		title: string;
		link: string;
	};
}

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
	projects: Project[];
	skills: string[];
	education: Education[];
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
	email: "br@dley.dev",
	links: {
		github: "https://github.com/br-watson",
		linkedin: "https://www.linkedin.com/in/bradleyrwatson",
	},
	filePaths: {
		cv: "./assets/cv.pdf",
		dissertation: "./assets/diss.pdf",
	},
	bio: [
		"Software engineer specializing in backend systems, cloud platforms, CI/CD automation, and end-to-end data pipelines, building reliable, scalable production systems.",
		"Current interests: distributed systems design, event-driven data pipelines, observability, CI/CD, and developer tooling for cloud-native backends.",
		"This site is a small terminal-style portfolio because standard portfolio sites are kinda boring.",
	],
	projects: [
		{
			name: "Terminal Portfolio",
			desc: "This project! An interactive terminal-style portfolio built with TypeScript, HTML, and CSS.",
			repoLink: "https://github.com/br-watson/br-watson.github.io",
			deployedLink: "https://bwatson.uk",
			tags: ["TypeScript", "HTML", "CSS"],
		},
		{
			name: "Darts Score Tracker",
			desc: "All the darts trackers my friends and I could find were either too basic or couldn't handle more than 4 players, so I built this simple one to track our games and stats.",
			repoLink: "https://github.com/br-watson/darts-games",
			deployedLink: "https://bwatson.uk/darts-games",
			tags: ["TypeScript", "React", "Next.js", "Tailwind CSS"],
		},
		{
			name: "Planning Poker App",
			desc: "Built a free, no-login planning poker app for my team's sprint refinements after existing tools were paid or lacked custom decks. It supports multiple rooms, custom card sets, and real-time updates.",
			deployedLink: "https://poker.bwatson.uk/",
			tags: ["TypeScript", "React", "Tailwind CSS", "Firebase"],
		}, // TODO
	],
	skills: ["TypeScript", "AWS", "TODO..."], // TODO
	education: [
		{
			qualification: "Master of Mathematics (MMath)",
			institution: "Durham University",
			location: "Durham, UK",
			startDate: "2018",
			endDate: "2022",
			grade: "First Class Honours (1st)",
			description:
				"Specialised in mathematical analysis, geometry, and algebra. Dissertation on isometries of Riemannian manifolds.",
			tags: [
				"Mathematical analysis",
				"Geometry",
				"Algebra",
				"Calculus",
				"Linear algebra",
				"Partial differential equations",
			],
			dissertation: {
				title: "Isometries of Riemannian Manifolds",
				link: "./assets/diss.pdf",
			},
		},
		{
			qualification: "A-Levels",
			institution: "Notre Dame Sixth Form College",
			location: "Leeds, UK",
			startDate: "2016",
			endDate: "2018",
			grade: "A*AAA",
			tags: [
				"Mathematics",
				"Further Mathematics",
				"Computer Science",
				"Chemistry",
			],
		},
	],
	roles: [
		{
			title: "Software Engineer",
			company: "Sky UK",
			location: "Leeds, UK",
			startDate: "Sep 2024",
			// description: "", // TODO
		},
		{
			title: "Associate Software Engineer",
			company: "Sky UK",
			location: "Leeds, UK",
			startDate: "Sep 2023",
			endDate: "Sep 2024",
			// description: "", // TODO
		},
	],
	todo: [
		"Finish writing profile (experience, projects, skills etc.)",
		"Change skills to have multiple sections and include levels and experience details",
		"Add more commands",
		"Improve txt files output formatting",
		"Make actual CV",
		"Make sure accessibility is good",
		"Make sure performance is good",
		"Write tests (TDD kinda went out the window for this project)",
		"Cap retained terminal output and command history",
		"Optimize autocomplete: cache command/completion data and avoid full mobile suggestion list rerenders on each input.",
	],
};
