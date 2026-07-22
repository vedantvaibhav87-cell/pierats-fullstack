# Pierats — full-stack scaffold

A Reddit-style pirate forum: **crews** (subreddits), **bounties** (posts), **chatter** (comments),
and **doubloons** (karma). This is the full-stack rebuild of the original single-file HTML prototype —
same theme and features, now with a real database and real auth.

- **Frontend:** React (Vite) + Bootstrap 5, ported 1:1 from the original pirate CSS theme
- **Backend:** Express + PostgreSQL
- **Auth:** bcrypt-hashed passwords, JWT sessions in httpOnly cookies (no more plaintext passwords in localStorage)

## Project layout

```
pierats/
├── backend/       Express API + Postgres access
│   └── src/
│       ├── db/           schema.sql, connection pool, migration runner
│       ├── middleware/    auth.js (attachUser / requireAuth)
│       ├── routes/        auth.js, crews.js, posts.js, comments.js
│       ├── utils/         jwt.js, hotScore.js
│       ├── app.js         Express app (middleware + routes)
│       └── server.js      entrypoint
├── frontend/      React app
│   └── src/
│       ├── api/           fetch client
│       ├── context/       AuthContext (current user)
│       ├── components/    Topbar, Sidebar, PostCard, VoteColumn
│       ├── pages/          Auth, Home, Crew, NewCrew, NewPost, Post
│       └── styles.css     the pirate theme, ported from the prototype
└── docker-compose.yml     local Postgres for development
```

## 1. Start Postgres

```bash
docker compose up -d
```

This runs Postgres 16 on `localhost:5432` with user/password/db all set to `pierats`
(matches the default `DATABASE_URL` in `.env.example`). If you'd rather use an existing
Postgres instance (local install, Supabase, Render, RDS, etc.), just point `DATABASE_URL`
at it instead and skip this step.

## 2. Backend setup

```bash
cd backend
cp .env.example .env
# edit .env — at minimum, set JWT_SECRET to a real random string:
#   openssl rand -hex 32

npm install
npm run migrate   # creates tables + seeds the default crews
npm run dev        # starts the API on http://localhost:4000
```

## 3. Frontend setup

```bash
cd frontend
npm install
npm run dev        # starts the app on http://localhost:5173
```

The Vite dev server proxies `/api/*` requests to `http://localhost:4000` (see `vite.config.js`),
so open **http://localhost:5173** and the frontend and backend will talk to each other automatically.

## How auth works

- Passwords are hashed with **bcrypt** (12 salt rounds) before they ever touch the database.
- On login/register, the server signs a **JWT** and sets it as an `httpOnly`, `sameSite=lax` cookie —
  it's never exposed to JavaScript, which protects it from XSS token theft.
- Every request that needs to know "who is logged in" reads that cookie server-side
  (`middleware/auth.js`), so there's no token to manage in the frontend at all —
  `fetch(..., { credentials: 'include' })` is all the client needs to do.
- `requireAuth` middleware blocks protected routes (creating crews/posts/comments, voting) with a 401
  if there's no valid session.

## Data model

| Table | Purpose |
|---|---|
| `users` | email, name, bcrypt password hash, doubloons (karma) |
| `crews` | name (unique, slugified), description, creator |
| `posts` | belongs to a crew and an author; votes cached as an integer |
| `post_votes` | one row per (post, user) — enforces one vote per user, lets votes be changed/removed |
| `comments` | belongs to a post and an author; votes cached as an integer |
| `comment_votes` | same pattern as `post_votes` |

Voting is done in a DB transaction: the vote row is upserted/deleted, the post/comment's cached
`votes` counter is adjusted, and the author's `doubloons` are adjusted — all atomically, with
`SELECT ... FOR UPDATE` to avoid races from concurrent votes.

"Hot" ranking uses the same formula as the prototype (`votes / (age_hours + 2)^1.4`), computed
in `backend/src/utils/hotScore.js`.

## Deploying

- **Backend:** any Node host (Render, Fly.io, Railway, a VPS). Set `DATABASE_URL`, `JWT_SECRET`,
  `CLIENT_ORIGIN` (your deployed frontend's origin), and `NODE_ENV=production` as env vars.
  Run `npm run migrate` once against the production database, then `npm start`.
- **Frontend:** `npm run build` produces a static `dist/` folder — deploy it to Vercel, Netlify,
  Cloudflare Pages, or serve it from the Express app itself. Update the API base URL / proxy target
  to point at your deployed backend if it's not on the same origin (and adjust CORS/cookie
  `sameSite`/`secure` settings accordingly for cross-origin cookies).

## What's intentionally left for you to extend

This is a scaffold, not a finished product. Things you'll likely want to add:
- Input validation library (e.g. `zod`) on the backend instead of ad-hoc checks
- Pagination for the feed and comments
- Rate limiting on voting/posting, not just auth
- Password reset / email verification
- Tests (the route structure is set up to be easy to unit test with `supertest`)
