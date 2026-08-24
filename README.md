# Admin console

The administrator console for the teleconsultation platform: reviews doctor
registrations, accepts or rejects each uploaded document, and records every
decision in an append-only trail.

Next.js 16 (App Router) + TypeScript + Tailwind CSS v4. No UI kit — the
components are built against the same palette and type scale as the Flutter app,
ported in `src/app/globals.css` from
`../consultation_app/lib/core/theme/app_colors.dart`.

## Sibling projects

This repository is the console only. It holds no database credential and no
business data — it talks to the API over HTTP and nothing else.

| Project | What | Port |
| --- | --- | --- |
| `consultation_admin/` | This — the administrator console | 3100 |
| `consultation_api/api/` | NestJS API, MongoDB Atlas behind it | 4100 |
| `consultation_api/server/` | Express API, phone-OTP flow. Being retired. | 4000 |
| `consultation_app/` | The Flutter app, patients and doctors | — |

## Running it

```bash
npm install
cp .env.example .env.local     # then set ADMIN_SESSION_SECRET
npm run dev                    # http://localhost:3100
```

It runs with **no API and no database**. `NEXT_PUBLIC_BACKEND=fake` (the
default) serves a seeded queue of seven applications from
`FakeReviewDataSource`, mirroring the way the Flutter app defaults to
`AppBackend.fake`. Sign in with the credentials printed on the login screen:

| | |
| --- | --- |
| Email | `admin@teleconsult.local` |
| Password | `review-me-1234` |

Set `NEXT_PUBLIC_BACKEND=live` to talk to the consultation API in `../consultation_api/api`
instead. The endpoints it expects are listed in
`src/features/doctor-review/data/datasources/api-review-data-source.ts` — that
file is the API contract, deliberately written down in one place so the NestJS
side can be built against something concrete.

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Dev server on :3100 |
| `npm run build` | Production build |
| `npm start` | Serve the build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

## What the console enforces

The rule the whole tool turns on: **an application can only be approved once
every required document has been accepted on its own.** Required means the
medical degree certificate, the council registration and a government photo ID;
a profile photograph is optional. `approvalBlockers()` in
`src/features/doctor-review/domain/entities/doctor-review.ts` is the single
implementation, it drives both the disabled approve button and the list of
reasons shown beside it, and the API is expected to run the same check — a
disabled button is a courtesy to the reviewer, not a guarantee.

Rejections and returns need a reason of at least 10 characters, matching
`DecideDoctorApplication.minReasonLength` in the Flutter app. A doctor who
cannot tell what to fix comes back with the same mistake.

"Return for changes" exists alongside reject because one bad scan should not
throw away three good ones.

## Security posture

This is an internal tool and the code assumes it:

- **Not indexable.** `X-Robots-Tag: noindex` on every response
  (`next.config.ts`), a `robots.txt` that disallows everything, and
  `robots: { index: false }` in the root metadata. A crawler reaching a page
  that lists registration numbers is a data-exposure incident.
- **Admin auth is separate from app auth.** The Flutter app signs in with a
  phone OTP. This signs in with email + password against a separate
  administrator roster, because anyone who can receive an SMS should not be one
  credential away from the approval queue. Add TOTP before production.
- **The API token never reaches the browser.** It lives inside an `httpOnly`,
  `SameSite=Lax`, HMAC-signed session cookie. Screens call this app's own server
  actions and route handlers; only the server calls the API. `AdminIdentity` is
  the token-free shape components are allowed to see.
- **The session cookie is signed and compared in constant time.** A tampered
  cookie is treated as no session at all. `ADMIN_SESSION_SECRET` is mandatory in
  production and the code throws rather than falling back to a constant.
- **No database credential exists in this app.** It talks to the API, the API
  talks to MongoDB. Same rule as the Flutter app.
- **Document links are short-lived and fetched on demand.** Never embedded in
  rendered markup, because a cached page would outlive the link.

## Layout

The same three-layer vertical slices as the Flutter app, so a feature looks the
same in both codebases — `presentation → domain ← data`, and `domain` imports
nothing from the other two.

```
src/
  app/                        # routes only; every page is thin
    login/
    (console)/                # auth guard lives in this group's layout
      overview/  queue/  queue/[doctorId]/  decided/  audit/
    api/documents/…/preview/  # fake-backend document stand-in
  core/
    config/  di/  error/  format/  network/  session/  widgets/
  features/
    admin-auth/{domain,data,presentation}
    doctor-review/{domain,data,presentation}
```

Two deliberate differences from the Flutter structure:

**Entities are interfaces with free functions, not classes with getters.** An
entity crossing from a server component to a client component is serialised as
JSON, and a class instance does not survive that trip — its methods are gone on
the other side. Plain objects make the boundary safe by construction.

**There is no long-lived DI container.** `core/di/injector.ts` builds the graph
per request, because the graph depends on who is asking: the review repository
is constructed around the caller's own API token, so one request can never be
served with another admin's authority.

## Reviewer workflow

Things the screens do deliberately, because an approval console is used all day
by the same few people:

- **Navigation at every width.** A sidebar rail from 1024px up, a compact header
  with a tab row below it. The first pass had only the rail, which left narrower
  windows with no navigation at all.
- **Search and sort on the queue**, held in the URL so a narrowed queue is a
  link you can paste to a colleague. Matches name, council registration number,
  speciality, city and phone.
- **Ready-to-decide rows stand out** — a green left edge and a filled `Decide`
  button on applications where every required document is already accepted.
  Those are the rows that need a decision rather than a review.
- **Approving is two steps.** Everything else here is recoverable: a returned
  application comes back, a rejected one can be re-applied for. An approval puts
  a doctor in front of patients, so it asks first.
- **Accepting a document you have not opened says so.** Not a block — someone
  may have read it yesterday — but accepting a certificate sight-unseen is the
  exact failure this screen exists to prevent.
- **Every decision confirms in place.** The action's message renders next to the
  button that caused it and stays until the next action. Not a toast: a
  confirmation that erases itself after four seconds is a poor fit for a tool
  whose point is a durable record.
- **Skip and next.** A reviewer can move to the next waiting application without
  going back to the list, and is offered it again once a decision lands.
- **Skeleton loading states** on the queue and the detail page, shaped like the
  real layout so nothing jumps when the data arrives.

Rows are deliberately **not** clickable as a whole. The overlay that makes a
table row one big link swallows text selection, and reviewers need to copy
registration numbers out of the table. The name and the action button are the
click targets.

## Not done yet

- Roles are modelled (`reviewer` / `auditor` / `owner`) and the API returns 403
  on mutations for an auditor, but the UI does not yet hide those controls — an
  auditor sees buttons that will refuse.
- No TOTP on sign-in.
- Reopening a decided application is described in the UI but has no action
  behind it.
- **No pagination, and search filters client-side.** The queue is fetched whole
  and narrowed in the page. Fine for hundreds; at tens of thousands both the
  fetch and the filter move into the API.
- No keyboard shortcuts. `j`/`k` through the queue and a shortcut to accept the
  focused document would save a reviewer real time.
- The "document opened" check is per-session and in memory only. It resets on
  reload, and it is not recorded — the audit trail says a document was accepted,
  not that it was read.
