# Phases 1–8 recovery audit

Recovery scope: existing routes, shared demo stores, real-data adapters, authentication, database migrations, matching, forms, dashboards, deployment configuration, and tests. No Phase 9 work or redesign was introduced.

## Integration repairs

- Creation CTAs now start new demands instead of accidentally editing an existing demand. Both demo restoration and the real workspace preserve an explicit new-demand selection.
- Real form/matching navigation context survives refresh through user/business-scoped session storage. Database entities still load exclusively from Supabase. Workspace identity changes remount private state, and stale route fetches cannot replace newer results.
- Catalog refresh loads authenticated saved-provider IDs. Repeated save mutations are guarded, failures roll back only the affected ID, and anonymous catalog retries do not require a business membership.
- Identity and membership lookup failures produce errors instead of apparently empty workspaces. Sign-out and confirmation network failures are handled without silently reporting success.
- Real demand match summaries now persist to the database and reload into dashboard history. Dashboard recommendations retain compatibility context when opening provider details.
- Landing, results, provider details, and requests carry the 94% CNC scenario consistently. The proposal is 5,000 × Rp21.500 = Rp107.500.000 with a 15-day lead time. The SQL dev seed uses the same terms.
- Request validation blocks paused, fully booked, and zero-available listings. SQL safeguards prevent bypassing a proposal revision and require rejection/revision notes even when callers send null.
- Stored demo proposals with impossible dates, negative prices, or incorrect totals are rejected. Shared formatters now cover form reviews, request cards, dashboards, and currency inputs.
- Competition entry/reset, first-use guidance, loading/error states, duplicate form-submit guards, metadata, favicon, and deployment instructions were completed without changing the visual system.

## Local verification

The test suite includes discovery filters/sorting/URL state, wizard validation, deterministic weighted matching, request lifecycle rules, persistence recovery, shared dashboard data, real-adapter regressions with a mocked Supabase client, and a component-level competition rehearsal through an in-progress collaboration.

Release checks: `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`. A separate formatting check also runs under `America/Los_Angeles` to verify business dates and Jakarta timestamps.

Final local results: all 99 tests passed; lint, TypeScript, and production build passed. The production server returned HTTP 200 for 20 core routes (including dynamic details and the favicon), and HTTP 404 for an unknown route. Landing HTML contained the intended title, Explore Demo entry, and 94% scenario score.

Component tests use jsdom. They do **not** establish native-browser layout, focus trapping, hydration, or console correctness. Production HTTP route checks likewise establish server responses, not browser interaction.

## Required deployment actions and unverified gates

Apply all three migrations in filename order. `202609280003_recovery_match_history.sql` is additive and also tightens the request policy/lifecycle RPC. Existing populated databases must be checked for rows violating the Phase 8 constraints before applying them. Migrations were not executed against a live database in this workspace.

No valid Supabase environment or live deployment is available here. Real registration, session restoration, two-business requests, email callbacks, database constraints, and RLS isolation still require the live checklist in [DEPLOYMENT.md](DEPLOYMENT.md). Mocked adapter tests are not a substitute for those checks.

The provided browser tool fails before connecting because of a host-side module startup error. Native-browser console/hydration, keyboard interaction, modal focus, and responsive visual checks remain unverified. Do not call the application fully production-verified until these gates pass.
