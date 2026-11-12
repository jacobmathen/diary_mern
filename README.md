# Daybook
A full-stack personal journal with React 19, Redux Toolkit, Express, MongoDB and JWT authentication.

## Start locally
1. In `backend`, run `npm install`.
2. Keep your existing `backend/.env` MongoDB connection. Add `JWT_SECRET` (32+ random characters), `CLIENT_ORIGIN=http://localhost:5173`, and `PORT=3100`. See `.env.example`.
3. Run `npm run dev` in `backend`.
4. In a second terminal, run `npm install`, then `npm run dev` in `learning`.
5. Open http://localhost:5173 and create an account.

The development frontend proxies /api to localhost:3100. If your existing PORT is different, change it to 3100 or update the proxy. Use localhost consistently for cookies.

## Included
- Signup, login by email or username, seven-day HttpOnly JWT cookie, bcrypt password hashing, logout and protected routes.
- Create, edit and permanently delete private journal entries.
- Up to four JPEG/PNG/WebP photos per entry, 5 MB each; Multer receives them and Sharp decodes, strips metadata, resizes and converts to WebP.
- Images are kept inside MongoDB and served only to the entry owner.
- Search by title, content or tags, mood filtering, sorting and favorites.
- Writing prompts, session text drafts, word counts, writing streak and 30-day mood reflections.
- Light/dark mode through Context; auth and entry state through Redux Toolkit.
- JSON text export (photos are not included).

## Existing accounts
The original application stored plaintext passwords. The new login accepts bcrypt hashes only. Back up your database, then run `node scripts/migrate-passwords.js` in backend once to hash old passwords. This script never prints passwords. Existing duplicate usernames/emails must be resolved before unique indexes can be built. The old /user endpoints are no longer mounted.

## Checks
Frontend: `npm run build`, `npm run lint`.
Backend: `npm test` (isolated temporary MongoDB, never your configured database). First run downloads a MongoDB test binary.

## Structure
- learning/src/components: reusable icons, cards, editor and insights
- learning/src/Pages: authentication and journal screens
- learning/src/store: Redux session and entry state
- learning/src/context: theme and toast UI state
- learning/src/lib: API client and date/mood helpers
- backend/routes, middleware, models: Express endpoints, JWT guard and Mongoose schemas

## Deployment
Serve the frontend build and /api behind the same HTTPS origin; set CLIENT_ORIGIN to that origin and NODE_ENV=production for secure cookies. Store JWT_SECRET in your hosting secret manager. The frontend dev proxy is not a production server. Entries and photos count toward MongoDB storage. Session drafts are stored only within the tab; sign out clears them. Exported journal files contain private text.
