# Terminal Portfolio

Interactive terminal-style portfolio built with TypeScript, HTML, and CSS.

Live site: [bwatson.uk](https://bwatson.uk) (deployed on GitHub Pages)

## Status

This project is still very much a work in progress.

See the current plan in the [`todo` array in `src/data/profile.ts`](./src/data/profile.ts#L154). Or, to see the todo list, run `cat todo.md` in the portfolio terminal/profile.

## Highlights

- Terminal-first UI with command parsing, history, and autocomplete.
- Responsive intro banner:
  - ASCII art banner when viewport width allows.
  - Fallback boxed banner on narrow screens.
- Dark/light theme with persisted preference.
- Keyboard-friendly desktop UX and touch-optimised mobile command tray.
- Profile-driven content from a single source of truth.
- Static build and GitHub Pages deployment flow.

## Tech Stack

- TypeScript
- HTML + CSS
- esbuild

## Command Surface

### Core commands

- `help`
- `clear`
- `date`
- `echo <text>`
- `theme [dark|light|toggle]`
- `ls [path]`
- `cat <file>`
- `open <alias>`
- `whoami`

### `open` arguments

- `github`
- `linkedin`
- `cv`
- `email`
- `dissertation`

### Other commands

Start the app and run `help` to see the full list of available commands and aliases.

## Getting Started

### Prerequisites

- Node.js (`nvm use`)
- pnpm (`corepack use` to use the version specified in `package.json`, else `npm install -g pnpm`)

### Install

```bash
pnpm install
```

### Run locally

```bash
pnpm run dev
```

This serves the app from `dist/` with esbuild watch mode.

## Scripts

- `pnpm run dev`: clean `dist`, copy dev assets, start esbuild watch/serve.
- `pnpm run typecheck`: run TypeScript checks with no emit.
- `pnpm run check`: run Biome checks.
- `pnpm run build`: clean, typecheck, lint/check, copy static files, and build minified bundle.
- `pnpm run deploy`: build, then publish `dist/` with `gh-pages`.

## Deployment

Deployment to GitHub Pages uses the `dist/` build output, which is published to the `gh-pages` branch.

Build artifacts include:

- `src/index.html`
- `src/styles.css`
- `src/assets/*`
- bundled `dist/main.js`
- `CNAME`

Deploy command:

```bash
pnpm run deploy
```
