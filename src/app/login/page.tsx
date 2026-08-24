import { redirect } from 'next/navigation';

import { AppConfig, isFake } from '@/core/config/app-config';
import { readSession } from '@/core/session/admin-session';
import { FakeAdminAuthDataSource } from '@/features/admin-auth/data/datasources/admin-auth-data-source';
import { SignInPanel } from '@/features/admin-auth/presentation/sign-in-panel';
import { SplashIntro } from '@/core/widgets/splash-intro';

/// The sign-in screen.
///
/// One card, centred on the console's own canvas. An earlier pass put a dark
/// panel of marketing copy down the left-hand side — three bullet points about
/// what the console does, read once by each administrator on their first day
/// and never again, occupying half the screen forever after.
///
/// So the copy is gone and the card is the whole screen. What is left is what a
/// sign-in screen is actually for: say where you are, take two fields, get out
/// of the way.
///
/// Every colour here is a theme token. The pass before this one dressed the
/// screen in a blue sky with white clouds, which was pleasant and belonged to
/// no other screen in the app: an administrator signed in through a horizon and
/// arrived at a near-white workspace, and the two did not look like one
/// product. A sign-in screen is the first frame of the console, not a poster
/// for it.
///
/// The background is still CSS rather than an image — a flat canvas and two
/// blurred washes on a long drift. No asset to download and nothing to go
/// stale.
export default async function LoginPage() {
  // A signed-in admin has no business on the sign-in form.
  if (await readSession()) redirect('/overview');

  return (
    <SplashIntro>
      <main className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-10">
        {/* The console's own canvas, not a sky.
            The sky gradient looked well enough on its own and belonged to no
            other screen in the app — a reviewer signed in through a blue horizon
            and landed on a near-white workspace, and the two did not read as the
            same product. This is `--color-canvas`, the same surface every other
            screen sits on, so signing in is the first frame of the console rather
            than a different one. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-canvas" />

        {/* One drifting wash, in the brand hue, at a weight you would have to
            look for. Enough that the canvas is not a flat field of a single
            colour; not enough to be a colour scheme of its own.
            The console shell pairs this with a second wash in `success`, which
            works there because it sits behind a screenful of content. On an empty
            page it had nothing to hide under and put a faint green cast across
            the bottom third — a hue that means "approved" everywhere else in this
            app, spread across a screen where nothing has been approved yet. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="animate-drift absolute -top-40 left-1/4 size-[40rem] rounded-full bg-primary-soft/8 blur-3xl" />
        </div>

        <div className="w-full max-w-[25rem]">
          {/* --- The card -------------------------------------------------- */}
          {/* A solid surface now, not frosted glass. Translucency only shows when
              there is something behind it worth seeing through to — over a plain
              canvas it just made the card muddier than the page. `--shadow-panel`
              is the console's own lift, and it is neutral grey rather than the
              blue-tinted glow the sky version needed. */}
          <div className="animate-rise rounded-[1.75rem] border border-border bg-surface p-7 shadow-[var(--shadow-panel)] sm:p-8">
            <div className="mb-6 flex justify-center">
              <span className="animate-scale-in grid size-12 place-items-center rounded-2xl bg-primary-surface text-primary-vivid ring-1 ring-primary-soft/20">
                <svg viewBox="0 0 24 24" className="size-6" fill="none" aria-hidden="true">
                  {/* A cross in a rounded shield: clinical without being a literal
                      stethoscope, and legible at this size. */}
                  <path
                    d="M12 3 4.5 5.8v5.4c0 4.3 3 8.2 7.5 9.6 4.5-1.4 7.5-5.3 7.5-9.6V5.8L12 3Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 8.6v6.2M8.9 11.7h6.2"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="sr-only">Doctor Approvals</span>
              </span>
            </div>

            <SignInPanel />
          </div>

          {isFake ? (
            <div
              className="animate-rise mt-4 rounded-2xl border border-border bg-surface-muted p-4"
              style={{ animationDelay: '120ms' }}
            >
              <p className="flex items-center gap-2 text-[0.6875rem] font-bold tracking-wide text-text-secondary uppercase">
                <span className="size-1.5 animate-pulse rounded-full bg-primary-vivid" />
                Demo backend — no API connected
              </p>
              <dl className="mt-2.5 space-y-1 text-[0.8125rem] text-text-label">
                <div className="flex gap-2">
                  <dt className="w-16 shrink-0 font-semibold">Email</dt>
                  <dd className="font-mono">{FakeAdminAuthDataSource.demoEmail}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-16 shrink-0 font-semibold">Password</dt>
                  <dd className="font-mono">{FakeAdminAuthDataSource.demoPassword}</dd>
                </div>
                {/* The phone tab needs its own pair, and a demo OTP that is
                    actually texted to a handset nobody has is no demo at all —
                    so the fake backend accepts one fixed code. */}
                <div className="flex gap-2 border-t border-border pt-1.5">
                  <dt className="w-16 shrink-0 font-semibold">Mobile</dt>
                  <dd className="font-mono">{FakeAdminAuthDataSource.demoPhone}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-16 shrink-0 font-semibold">OTP</dt>
                  <dd className="font-mono">{FakeAdminAuthDataSource.demoCode}</dd>
                </div>
              </dl>
              <p className="mt-2.5 text-[0.6875rem] text-text-tertiary">
                Set <code>NEXT_PUBLIC_BACKEND=live</code> to talk to the API at{' '}
                {AppConfig.apiBaseUrl} instead.
              </p>
            </div>
          ) : null}

          {/* Short enough to hold one line at this width. The longer version
              wrapped to two, and a footnote that wraps stops reading as a
              footnote. The point it was making — that decisions carry your name —
              is in the card's own subtitle, where it is read first. */}
          <p
            className="animate-fade mt-6 text-center text-xs text-text-tertiary"
            style={{ animationDelay: '200ms' }}
          >
            Internal tool · not indexed · access is logged
          </p>
        </div>
      </main>
    </SplashIntro>
  );
}
