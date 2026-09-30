# Phase 9 — Competition explanation layer

## Entry and presentation path

Start at `/` and choose **Start Competition Demo**. The buyer dashboard opens without login, preserving existing browser edits. The **CAPACITY Demo** guide links to eight actual destinations: Business Problem, Create Demand, Smart Matching, Provider Analysis, Request Capacity, Provider Proposal, Collaboration, and Impact. Its secondary links expose both dashboards, capacity management, collaborations, and `/how-it-works#architecture`.

The guide carries the seeded CNC requirement into provider analysis and requests. After a new NusaTech / Precision Works request is submitted, proposal and collaboration steps use that request. Business actions remain explicit: the judge reviews, negotiates, proposes, accepts, and starts collaboration through the existing controls. Guide navigation does not execute these actions.

Presentation preferences live separately in session storage. Dismissible matching, request, and collaboration explanations appear only after explicit competition entry and only in Demo Mode. **Hide guide and explanations** and **Exit Demo** disable the presentation layer. Existing demo reset remains an explicit confirmation action.

## Explanation and truthful claims

`/how-it-works` covers the seven-stage workflow, both business roles, four product pillars, before/with comparison, scoring, the illustrative CNC scenario, impact pathways, actual architecture, request states, current MVP, future concepts, potential monetization, and six short FAQs.

The score table calls the unchanged matching engine against the existing fixtures. Precision Works scores 100 / 90 / 80 / 100 / 100 / 85 using the established 30 / 20 / 15 / 15 / 10 / 10 weights. Weighted points total 93.5 and round to 94%. The page discloses the prorated 4,550-unit estimate and the Rp90M–Rp125M cost range. It does not claim confirmed quantity coverage, a guaranteed quote, measured proximity, or artificial intelligence.

The established proposal remains 5,000 × Rp21.500 = Rp107.500.000 with a 15-day lead time. Illustrative impact is not presented as traction. Future verification/integrations and monetization are explicitly unimplemented. Physical capacity is not described as automatically reserved or released.

## Scope and verification

No matching rules, weights, migrations, database schema, request transitions, payments, or new core business stages were added or changed. The only data-adapter adjustment treats the public explanation route like the existing public homepage, without loading private workspace records.

Automated coverage includes the existing demand → match → request → provider proposal → buyer acceptance → collaboration rehearsal, exact explanation arithmetic, opt-in/hidden/dismissed presentation behavior, retained browser edits, all eight guide destinations, role switching, latest-request routing, and anonymous public explanation access. Run the release checks from `README.md`.

Local results: all 105 tests pass; lint, standalone TypeScript validation, and the production build pass. The production HTTP smoke script passes for 21 route requests, homepage content, anonymous `/how-it-works` access, actual explanation arithmetic, and an unknown-route 404.

Production HTTP checks verify route responses and server-rendered content; they do not establish browser layout, console behavior, focus trapping, or real Supabase policy enforcement. The in-app browser connection currently fails during tool startup outside this repository. Native browser review and live configured-Supabase QA remain separate release checks, as documented in `DEPLOYMENT.md`.
