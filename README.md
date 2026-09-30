# CAPACITY

Digital Platform for Connecting Business Capacity and Demand. CAPACITY supports a browser-local competition demo and an opt-in Supabase-backed business workspace.

## Run

```sh
npm install
npm run dev
```

Open `http://localhost:3000`. On Windows PowerShell with scripts disabled, use `npm.cmd` instead of `npm`.

## Real workspace setup (Phase 7)

1. Create a Supabase project and copy `.env.example` to `.env.local`. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to your project URL and publishable/anon key. Never place a service-role key in this app.
2. Apply the SQL migrations in filename order: [`Phase 7 schema`](supabase/migrations/202609280001_phase7_mvp.sql), [`Phase 8 reliability`](supabase/migrations/202609280002_phase8_reliability.sql), then [`recovery match history`](supabase/migrations/202609280003_recovery_match_history.sql). These create the tables, indexes, registration trigger, RLS policies, request/proposal functions, production constraints, and persisted demand match summaries.
3. In Supabase Auth, enable email/password sign-in and set the site URL and allowed redirect URL to include `http://localhost:3000/auth/confirm` for local development. With email confirmation on, registration waits for the confirmation link; with it off, a new account enters the dashboard immediately.
4. Run `npm.cmd run dev`, open `/register`, and create a business account. Registration creates a profile, business, and owner membership atomically in the database. Use `/login` for later sessions. **Start Competition Demo** continues to work without a Supabase project.

The optional [`supabase/seed.dev.sql`](supabase/seed.dev.sql) adds fictional businesses, four public listings, one demand, one request, and one proposal. Run it manually only for development or judging. It does not create auth users or memberships; an administrator must explicitly attach a test user to a seeded business to inspect its private demand/request. It is never run automatically for new accounts.

The browser uses only the public project key. Row Level Security separates public active listings from private demands and request participants. Privileged status/proposal transactions validate business membership and transitions inside database functions. There is no service-role client, realtime chat, file upload, payment, or production notification delivery.

Without valid configuration, CAPACITY stays in Demo Mode. A configured but unavailable database shows a retryable error in real workspaces; it does not silently substitute fictional data. Live auth, SQL, and RLS behavior must be tested against your own Supabase project after applying the migration.

For a live smoke test, register two accounts with distinct businesses. Publish a listing as the provider and confirm it appears in the buyer's Discover and match results. Create a demand and request as the buyer; the provider should see the request, send a proposal, and the buyer should accept it. Refresh each page to verify persistence. Also confirm that an anonymous visitor cannot read demands/requests, a third account cannot read the private request or messages, the buyer cannot edit the provider listing or send a proposal, and the provider cannot accept its own proposal. Pause the listing and verify that it disappears from public Discover and matching. These checks require the deployed RLS policies, not only local UI tests.

## Competition walkthrough

1. Start at `/` to see the two-sided problem, solution, and illustrative impact example. `/how-it-works` explains all seven workflow stages, the actual scoring calculation, system architecture, and current MVP versus future concepts.
2. Choose **Start Competition Demo** (or the header’s **Explore Demo**) to enter NusaTech’s buyer dashboard without login. Open **CAPACITY Demo** for an eight-stop guide to actual product screens. The CNC demand is already saved under `/dashboard/demands`.
3. Select **View Matches**. `/match/results` ranks providers with six weighted, explained factors. The seeded CNC demand ranks Precision Works at 94% compatibility, with its full score breakdown available on the match card.
4. Open `/capacity/precision-works`, then request capacity at `/request/precision-works`. The demand and original match context carry into the form.
5. Use `/requests` or the new request detail to track the response. The seeded `REQ-2026-00124` already has a Precision Works proposal for 5,000 units at Rp21.500 per unit, total Rp107.500.000.
6. Switch to Provider in the demo perspective control. Review requests, send or revise a proposal, and manage capacity at `/dashboard/capacity`.
7. Switch back to Buyer to accept the proposal and start production. `/dashboard/collaborations` and both overview pages update from the same request data.
8. Open **CAPACITY Demo → Impact**, then follow **How it works & architecture**. Use **Reset Demo** in the dashboard demo bar to restore all demonstration data and the buyer perspective after a presentation.

The guide selects the seeded demand and follows the latest NusaTech / Precision Works request, but never submits, accepts, or starts production automatically. Entering the demo preserves existing browser edits. Presentation callouts are small, dismissible, and visible only after explicit competition entry; **Hide guide and explanations** or **Exit Demo** turns them off. The presentation preference is session-only and separate from business data.

The demo starts with 24 sample providers, two saved providers, production demands, requests in multiple states, proposals, active and completed collaborations, notifications, and activity.

## Product logic

`lib/matching.ts` contains deterministic matching rules. Weights are capability 30%, capacity 20%, location 15%, availability 15%, lead time 10%, and estimated cost 10%. The interface shows each criterion, reasons, and caveats. Short deadlines conservatively prorate monthly production capacity. Location uses a regional relationship table rather than a measured road distance. Match scores do not promise acceptance or delivery.

The public Precision Works example uses the unchanged scorer: factor scores 100, 90, 80, 100, 100, 85 contribute 30 + 18 + 12 + 15 + 10 + 8.5 = 93.5, rounded to 94%. The explanation explicitly discloses the estimated 4,550 units within 21 days and the Rp90M–Rp125M estimated price range; a high score does not confirm quantity coverage or a final quote. `lib/product-explanation.ts` derives the table and proposal totals from existing demo fixtures rather than inventing scoring results.

Demo capacity listings are managed in the browser through `lib/capacity-store.ts`. Paused and fully booked listings remain in the provider workspace but are excluded from available discovery and matching. `lib/demand-store.ts`, `lib/request-store.ts`, `lib/saved-providers.ts`, and `lib/notification-store.ts` keep the rest of the demo in shared browser state. The `lib/data/` adapters switch the same UI to Supabase for authenticated real sessions. Provider utilization uses declared total and available capacity in real mode.

Demo businesses, badges, prices, availability, and impact figures are fictional or illustrative. Real workspace data is user-created and persisted in Supabase. Document references in requests are names only; actual files are not transferred.

## Verify

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

The tests cover matching rules, formatting, form validation, browser-state persistence, key interactions, and the cross-page demo scenario. jsdom cannot verify visual layout or native dialog focus trapping; those require a browser review. See [`DEPLOYMENT.md`](DEPLOYMENT.md) for the Vercel/Supabase production checklist and live RLS verification.

For repeatable production HTTP/content checks, build and start the app on port 3008, then run `node tests/helpers/production-smoke.cjs`. An alternate origin can be passed as its first argument. This checks core routes, every seeded provider/request detail, internal server-rendered links, public section anchors, callback fallback, and explanatory content; it is not browser or live-backend validation. See [`FINAL-AUDIT.md`](FINAL-AUDIT.md) for final polish results and remaining release gates, and [`PHASE9.md`](PHASE9.md) for the presentation-layer scope.
