# Decision log

| Date | Decision | Why |
|---|---|---|
| 2026-10-15 | Launch as business #2 alongside ShipStack | Direct subscriptions earn more per user than ShipStack's traffic-driven model; reuses the same build system |
| 2026-10-15 | Niche: SBIR/STTR + Grants.gov for tech startups | Official, structured data; large awards make paid alerts worth it |
| 2026-10-15 | Confirmed program is active | SBIR/STTR reauthorized April 13, 2026 through Sept 30, 2031 (sba.gov, 2026-04-13) after a lapse from Oct 1, 2025 |
| 2026-10-15 | No application writing, no eligibility judgments | Highest liability risk |
| 2026-10-15 | Name: GrantSignal; repo alvaroviscardi/grantsignal, separate from ShipStack | Each business keeps its own site, data, reports and history |
| 2026-10-15 | Renamed GrantSignal → GrantTopics; repo → alvaroviscardi/granttopics | "GrantSignal" is already used by a grants product (Wakaga GrantSignal); no product found named GrantTopics |
| 2026-10-15 | Treat each agency's own page as the source of truth, not SBIR.gov | SBIR.gov says its topic listings are copies and may not be the latest |
| 2026-10-15 | Owner renamed the GitHub repo to granttopics | Matches the new name |
| 2026-10-15 | First data source: Grants.gov API; SBIR.gov API skipped while under maintenance | Grants.gov works without a key; SBIR.gov API returns 403 |
| 2026-10-15 | Second source: DoD SBIR/STTR portal public topics API | Largest SBIR funder; most DoD topics aren't on Grants.gov |
