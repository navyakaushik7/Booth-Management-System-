# Booth Management System

Hi! This is my project for managing voter/booth data for MLAs, with a real
OTP-based login system instead of the old fake demo login. Below is
everything you need to run it, plus some notes on how it works and what I
still need to double check.

**Note on SMS:** this currently runs in "dev mode" — I don't have a live
Twilio subscription yet, so instead of texting the OTP to your phone, the
app shows the code directly on the login screen. Everything else (the
actual login logic, sessions, ward isolation, etc.) works exactly the same
either way. See "About the OTP login" below for how to turn on real SMS
once a Twilio account is available.

## What this project actually is

Basically: MLAs log in with their phone number (no passwords to remember),
get a one-time code, and then can see/manage voter data just for their own
ward. Right now that code shows up on-screen (no Twilio account set up
yet), but the app is built so real SMS delivery is a config change away,
not a code change. Nobody can see another ward's data — that's enforced
on the server, not just hidden in the UI.

## What changed from the old demo version

The old version was basically a prototype — hardcoded login, and all the
data lived in the browser (`localStorage`), so it disappeared if you
cleared your browser data and nothing was actually shared between users.

This version is a "real" app with an actual backend and database:

| | Old demo version | This version |
|---|---|---|
| Login | Fixed username/password, made up | Phone number → real OTP flow → verify (SMS delivery is a config step — see below) |
| Where data lives | Browser `localStorage` | Real PostgreSQL database |
| Login sessions | Didn't really exist | JWT tokens, expire after 12 hours |
| Ward data privacy | Only enforced in the UI (not safe) | Enforced on the server on every single query |
| Duplicate voters | Not checked | Database blocks duplicate `(ward_id, voter_card_id)` |
| Live updates | None | If two people are logged into the same ward, they see each other's changes instantly (Socket.IO) |

## Folder structure (where to find things)
src/ React frontend (built with Vite)
lib/api.js the one place that talks to the backend (attaches your login token automatically)
context/AuthContext.jsx handles the whole phone -> OTP -> logged in flow
pages/Login.jsx the two-step login screen (enter phone, then enter code)
components/, pages/* the rest of the app pages — see the full list further down

backend/ Node.js + Express API
server.js starts the server, sets up Socket.IO
src/routes/ one file per feature: auth, voters, booths, schemes, analytics, staff
src/middleware/auth.js checks your login token is valid + figures out which ward you're allowed to see
src/utils/otp.js generates the OTP, hashes it, checks it
src/utils/sms.js sends the OTP via Twilio when it's configured; otherwise
falls back to printing the code (dev mode — currently the
default, since Twilio isn't set up)
sql/schema.sql the database tables
sql/seed.sql some fake sample data so you're not starting from an empty database

docker-compose.yml spins up the database + backend + frontend all at once


## How to run it

### Option A: Docker (recommended — least setup)

```bash
cp backend/.env.example backend/.env   # open this file and at least set JWT_SECRET to something random
docker compose up --build
```

Then open:
- Frontend: http://localhost:8080
- Backend health check: http://localhost:4000/api/health
- Postgres (if you want to poke at it directly): localhost:5432, user `bms_user`, password `bms_password`

The backend automatically creates the tables and loads the sample data the
first time it starts, so you don't have to run any extra commands.

### Option B: Running it manually (no Docker)

**Backend first:**
```bash
cd backend
cp .env.example .env        # fill in DATABASE_URL and JWT_SECRET
npm install
npm run migrate             # creates the database tables
npm run seed                # adds sample wards/users/booths/schemes
npm run dev                 # runs on http://localhost:4000
```

**Then the frontend, in a separate terminal:**
```bash
cp .env.example .env        # set VITE_API_URL=http://localhost:4000/api
npm install
npm run dev                 # runs on http://localhost:5173
```

## About the OTP login (currently running in dev mode, no Twilio yet)

**Right now, `backend/.env` has no Twilio credentials in it at all** — I
don't have a Twilio subscription yet. When there are no Twilio credentials
set, the OTP code just gets printed to the backend terminal, AND it's sent
back in the API response as `dev_otp` — the login page shows this code
directly on screen, so you can log in and test everything without needing
a real phone or an SMS bill.

This is a deliberate, working state, not a bug — the login flow, sessions,
and ward isolation all function identically whether the code arrives by
SMS or on-screen. The only thing missing is the actual text message going
out to a real phone.

**To turn on real SMS once a Twilio account is available:**
1. Sign up for Twilio, get a phone number, grab your Account SID and Auth Token.
2. Add these three lines to `backend/.env`:

TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+1xxxxxxxxxx

3. Restart the backend (`docker compose down && docker compose up --build`,
   or `npm run dev` if running without Docker). Once valid credentials are
   set, `dev_otp` stops showing up and real texts go out instead.

**Heads up:** if you add Twilio credentials, double-check the Account SID
format before restarting — an invalid or malformed SID will crash the
backend on startup rather than silently falling back to dev mode. If
you're not sure the credentials work yet, it's safer to leave these three
lines out of `.env` entirely.

## Sample login numbers (for testing)

These are already in the seed data so you can log in right away:

| Phone | Role | Ward |
|---|---|---|
| `+919999900001` | MLA | Amritsar North |
| `+919999900002` | MLA | Jalandhar Central |
| `+919999900000` | Admin | can see all wards |

**Important:** 
these are placeholder numbers for testing only. Before this
goes anywhere real, swap them out for actual MLA phone numbers — either by
editing `backend/sql/seed.sql`, or through the app itself (Staff & Access
page, or hitting `POST /api/staff`).

## How the "each MLA only sees their own ward" thing works

When someone logs in, their login token (JWT) has their `wardId` baked
into it. Every single query the backend makes for voters/booths/schemes
adds `WHERE ward_id = <that value>` — so even if someone messed with the
frontend and tried to ask for another ward's data, the backend would just
ignore that and only return their own ward anyway. Admin accounts don't
have a fixed `ward_id`, so they're allowed to pass `?ward_id=` in the URL
to look at a specific ward on purpose.

## Full list of pages (all built and connected)

src/
main.jsx loads App.jsx
App.jsx wraps everything in ThemeProvider -> AuthProvider,
then shows Login if you're not signed in, or the
main app if you are
context/
AuthContext.jsx the OTP login flow; keeps your token in localStorage
so you stay logged in on refresh
ThemeContext.jsx dark/light mode, remembers your choice
DataContext.jsx loads the current ward's booths/schemes, lets
admins switch wards, connects to the live-update socket
lib/
api.js the axios setup — automatically attaches your
login token to every request; logs you out if
it gets a 401 (expired/invalid token)
socket.js the shared connection for live updates
components/
Shell.jsx the sidebar + top bar (shows ward name, theme
switch, logout button, a "Live" indicator)
StatCards.jsx 5 little stat boxes (total voters, voted,
pending, turnout %, number of booths)
charts/AnalyticsCharts.jsx bar chart of turnout per booth + pie chart of
who's enrolled in which scheme
FilterPanel.jsx the search bar + filters (age, booth, scheme, status)
VoterTable.jsx the actual voter list — sortable, has a
voted/not-voted toggle, edit and delete buttons
VoterModal.jsx the popup form for adding/editing a voter
pages/
Login.jsx phone number -> OTP -> verify
Overview.jsx the main dashboard (stats + charts + recent
voters), updates live
VoterRegister.jsx filters + table + add/edit + import/export to
Excel, updates live
Booths.jsx list of booths, expand each one, add/delete booths
Schemes.jsx government schemes grouped by category, add/delete
Reports.jsx turnout and scheme coverage tables you can
export to Excel
Staff.jsx admin-only page to add/remove people who can log in
Settings.jsx your account info, theme toggle, and (for
admins) ward management
utils/excelUtils.js handles exporting voter lists/reports to
.xlsx, and reading an uploaded .xlsx file back
into rows for bulk-importing voters


**Roughly how data moves through the app, using Voter Register as an example:**
1. When you log in, your token has your `wardId` in it.
2. `DataContext` uses that to grab your ward's booths and schemes once, and
   joins that ward's "room" on the live-update socket.
3. The Voter Register page asks the backend for voters, filtered by your
   ward and whatever you've typed into the filters.
4. Whenever you add/edit/delete a voter, that request goes through
   `lib/api.js` → an Express route → the database (still ward-scoped) →
   and then the backend also broadcasts a small "something changed" event
   to everyone else in that ward.
5. Anyone else with that ward open just quietly refetches when they get
   that event — that's the "live sync" part, nothing fancy, no manual refresh needed.

## Honesty about testing (please actually try this before relying on it!)

I've run this through Docker locally and clicked through the full
phone → dev-mode OTP → verify → dashboard flow myself, and it works end to
end. What I haven't tested is real Twilio SMS delivery, since I don't have
an active subscription — if you add real credentials, please double-check
that path before relying on it.

## Security stuff I made sure to do (but please double-check)

- OTP codes are hashed with bcrypt before being stored — never saved as plain text in the database.
- There's rate-limiting on OTP requests (a cooldown + a max number of
  tries) so someone can't just spam guesses.
- **Please change `JWT_SECRET` in `.env` to a long random value** 
before this touches any real data - don't leave it as the example value.
- This should sit behind HTTPS in production. Tokens and OTP codes should never be sent over plain HTTP.
