# CAPACITY deployment and live QA

CAPACITY builds as a standard Next.js application on Vercel; no `vercel.json` override is required. The repository does not contain a live Supabase project or a Vercel deployment, so the steps below must be completed against the production accounts before calling the real workspace production-verified.

## Configure Supabase

1. Create a hosted Supabase project. Apply all files in `supabase/migrations/` in filename order (Phase 7 schema, Phase 8 reliability, then recovery match history). The reliability migration enforces positive minimum orders and proposal prices, chronological dates, and one pending proposal per request. The recovery migration persists demand match summaries under the existing ownership policies. If upgrading a populated database, inspect and correct rows that violate the stricter checks first.
2. Enable email/password authentication. In Auth → URL Configuration, set **Site URL** to the exact production HTTPS origin and add its exact `https://<production-domain>/auth/confirm` redirect URL. Add each preview callback URL intentionally if previews need email confirmation; keep localhost only for local development. CAPACITY builds the email redirect from the current browser origin rather than a hardcoded domain.
3. If using a custom email confirmation template, ensure it sends `token_hash` and `type` to `/auth/confirm`, or uses Supabase's code exchange callback. Verify a fresh registration and confirmation link on the deployed domain.
4. Do not put a service-role/secret key in this Next.js project. Only the public project URL and publishable/anon key are used by the browser. Keep RLS enabled.

## Configure Vercel

1. Import the project with the Next.js preset. Keep the install/build defaults (`npm install`, `npm run build`).
2. In Vercel Project Settings → Environment Variables, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for Production, and separately for Preview if preview real accounts are needed. Redeploy after changing these values. The example values are in `.env.example`; never commit `.env.local`.
3. Deploy and check `/`, `/how-it-works`, `/discover`, `/login`, `/register`, `/capacity/precision-works`, `/dashboard`, `/match/results`, `/requests`, and the dynamic detail pages. **Start Competition Demo** and the header’s **Explore Demo** must work without Supabase credentials or authentication.
4. If real mode is not ready, omit both Supabase variables to expose only the independent demo. Do not set a partially configured project and present empty/error data as live traction.

## Local release gate

Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`. On Windows PowerShell, use `npm.cmd`. Smoke-test the production build using `npm run start`, not only the development server.

## Live real-mode verification (requires two or three test accounts)

- Register buyer A and provider B as separate businesses. Verify each profile, business, and owner membership row was created. Confirm wrong-password and unknown-email login fail gracefully; valid login survives refresh; sign-out removes access to real dashboard routes.
- As B, publish a capacity listing. As A and as an anonymous visitor, confirm only active/limited public listings appear. Pause B's listing and confirm it leaves public Discover and matching. A must not update B's listing.
- As A, create and refresh a private demand, run matching, and submit a request to B. B must see the request and be able to review, negotiate, and send a proposal. A must accept; either participant can start collaboration. Refresh each page after transitions. Neither party should be able to repeat a completed transition.
- Register unrelated business C. C must not read A's demand, A/B's request, messages, proposals, timeline, or notifications. A must not send a provider proposal; B must not accept its own proposal or modify A's demand. Anonymous reads must reveal only intended public business/listing fields. Run these checks with actual client sessions or API calls; UI visibility alone does not prove RLS.
- Disconnect or misconfigure Supabase temporarily in a non-production environment. Real mode must show a retryable error and must not substitute sample data. Demo mode must remain usable.

## Judge rehearsal

At `/`, choose **Start Competition Demo**. Use **CAPACITY Demo** to navigate the eight-stop guide. In the buyer dashboard open the CNC Components demand, view matches, expand Precision Works' 94% match analysis, and request 5,000 units. Choose **Provider Proposal** in the guide (or switch perspective on the request), review and negotiate the new request, then send a 5,000 × Rp21.500 proposal (Rp107.500.000) with a 15-day lead time. Choose **Collaboration** to switch to Buyer, accept, start collaboration, and inspect both dashboards. The guide follows the new request rather than redirecting to the seeded proposal. Finish at **Impact** and **How it works & architecture**, all through visible links.

Use **Reset Demo** to return to the seeded state and repeat. The seeded proposal already represents a completed negotiation and can be used for a shorter walkthrough. Demo metrics and verification badges are illustrative, not live platform activity or legal verification. Verify that callouts are dismissible and disappear after **Hide guide and explanations** or **Exit Demo**, and never appear in Real Mode. Review mobile/desktop layout, keyboard access, native modal focus trapping, and reduced-motion behavior in a browser; automated DOM tests do not prove those visual/native behaviors.

## References

- [Vercel Next.js deployment](https://vercel.com/docs/frameworks/full-stack/nextjs)
- [Vercel environment variables](https://vercel.com/docs/environment-variables)
- [Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
