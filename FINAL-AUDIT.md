# CAPACITY final global polish audit

Audit date: 2026-09-28. Scope: repair and validate the existing application. No new product features, major routes, scoring changes, database migrations, or visual redesign were introduced.

## Repairs

- Mobile navigation now exposes the existing sign-in/workspace action. Navigation spacing, menu scrolling, long text wrapping, input sizing, and confirmation-panel scrolling were tightened within the existing design system.
- Authentication, provider saving, capacity status changes, and demand duplication/closing now guard repeated submissions. Asynchronous demand duplication waits before navigation, including the real adapter's intentional draft-only operation.
- Save feedback is shown once: demo feedback remains in the existing store, while successful asynchronous real saves receive confirmation. Failed operations keep useful, sanitized feedback.
- Proposal validation associates errors with inputs, marks invalid fields, focuses the first invalid input, and clears corrected errors. Capacity editor validation no longer retains an obsolete submission error.
- Confirmation dialogs restore body scrolling on close. Reject/cancel confirmation buttons use the existing destructive hierarchy. Native focus containment still requires browser verification.
- Discover and provider credentials distinguish sample demo profiles from self-reported real listings. Unknown routes use a general recovery heading, and the agreement timeline uses consistent wording.
- Malformed backend URLs no longer count as configured services. Missing or partial configuration preserves the independent demo. Sign-in return paths reject external, backslash, and control-character destinations.
- Landing section entrance motion respects reduced-motion preferences.

## Verification and boundaries

| Area | Result | Evidence / boundary |
| --- | --- | --- |
| Release checks | Passed | Production build, TypeScript, ESLint; 118 tests passed, no failures or skips. |
| Competition scenario | Passed at component/store level | Visible reset confirmation, competition entry, buyer demand, six-factor 94% analysis, provider detail, request, provider review/negotiation, proposal, buyer acceptance, collaboration, dashboard totals, and impact/architecture links. Components are mounted in jsdom; this is not native cross-page browser navigation. |
| Production routes | Passed | 74 core/seeded URLs, 24 internal server-rendered link destinations, public section anchors, callback fallback, and unknown-route 404. See the command below. Client-only interactions are covered separately by component tests, not this HTTP script. |
| Scenario consistency | Passed | NusaTech / Precision Works CNC scenario retains 5,000 Aluminum units, Jakarta preference, Bekasi provider, 6,500 units/month, provider lead time 14 days, requirement 21 days, 94% compatibility; proposal is 5,000 x Rp21.500 = Rp107.500.000, 15 days. |
| Matching / lifecycle | Passed | Existing deterministic 30/20/15/15/10/10 weights unchanged; score bounds, paused/full exclusion, role permissions, valid transitions, and terminal states covered by regression tests. |
| Forms / feedback / recovery | Passed in automated component tests | Required values, quantities, ranges, dates, pricing, duplicate actions, unknown IDs, empty/error recovery, persistence and reset. Native HTML validation, keyboard behavior and focus containment need the browser pass below. |
| Real workspace | Mocked adapter checks passed | Identity-scoped persistence, demand draft duplication, saves, retry/error handling, and no substitution of demo data. No configured live Supabase environment was available. |
| Security / cleanup | Static review completed | No matching exposed private keys or service-role credentials found in the scanned project files. Browser client uses public Supabase configuration only. No application TODO/FIXME/debug logging found. This is not a penetration test or live RLS certification. |
| Responsive / visual / console | Not verified in a native browser | CSS and DOM review completed, but the provided browser tool fails before connecting due to its host-side ES-module bootstrap error. |

The public 94% explanation retains the existing caveat: the 93.5 weighted score rounds to 94%, while the 21-day capacity estimate is only 4,550 units and the indicative order estimate is Rp90M-Rp125M. Compatibility is not a promise of quantity coverage, credentials, or a final quote. Impact metrics remain illustrative.

## Repeatable checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run start -- --hostname 127.0.0.1 --port 3010
```

In a second terminal:

```sh
node tests/helpers/production-smoke.cjs http://127.0.0.1:3010
```

The HTTP script uses fresh connections to avoid idle keep-alive resets during DOM parsing. It does not run client JavaScript or inspect browser console messages.

## Remaining release gates

1. In a working native browser, reset the demo and perform the complete presentation using visible controls, without manually typing internal URLs, refresh tricks, developer tools, or database edits. Check the browser console and hydration output.
2. Inspect homepage, explanation/architecture, discovery, matching, provider detail, request form/detail/timeline/messages/proposal, dashboards, listing forms, filters and dialogs at 375px, tablet width, 1366px and 1920px. Confirm no page overflow, readable content, correct spacing, visible focus, keyboard navigation, and dialog focus trapping/restoration. These viewport checks were not run here.
3. With an explicitly configured Supabase project, apply the existing migrations in order and follow [DEPLOYMENT.md](DEPLOYMENT.md): registration/confirmation, login/logout, restoration, two-business listing/demand/request/messages/proposal/collaboration, refresh persistence, and anonymous/third-business RLS isolation. No migration or seed was executed during this audit.

Product-code edits have stopped. The available local checks passed; the application must not be described as fully visually or live-backend verified until these remaining gates pass.
