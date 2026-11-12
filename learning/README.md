# Daybook frontend
React 19 + Vite, Redux Toolkit, React Router, Tailwind 4, shadcn/ui, and Kibo UI.

## Run
`npm install`
`npm run dev`

Start the existing Express backend on port 3100. Open http://localhost:5173.
The Vite proxy preserves browser origins; the existing backend handles authentication and MongoDB storage.

## Routes
- / — public feature homepage
- /login and /signup — authentication
- /journal — authenticated diary workspace
- /User — redirect to the diary for older links

## UI structure
- src/Pages: Home, Auth, Journal
- src/components/kibo-ui: official Kibo UI choicebox and dropzone, installed with the Kibo CLI
- src/components/ui: shadcn buttons, inputs, tabs, field primitives
- src/components: diary editor, cards, mood chart, sidebar, statistics and brand
- src/lib/utils.js: clsx and tailwind-merge utilities
- src/index.css: Tailwind, theme tokens and responsive layouts

Kibo UI setup: https://www.kibo-ui.com/docs/setup
The registry's workspace-specific imports were adapted to this app's @ alias.
Generated variant helpers stay internal to support React Fast Refresh.

## Theme
Primary #D4AF37; secondary #BDB76B; background #FDFBD4; accent #CE8946.
Dark mode preserves these interaction colors with a dark warm background.

## Checks
`npm run build`
`npm run lint`

Existing entry CRUD, JWT sessions, private photos, filters, favorites, mood history, streaks, local text drafts and JSON text export are retained.
