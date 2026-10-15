# Roadmap

## v0.1: data pipeline
Status 2026-10-15: Grants.gov part done (`npm run fetch`, `npm test`). First run: 29 opportunities (21 open, 8 forecasted), 0 held.

Learned on the first run:
- Keyword "SBIR" also matches broad agency announcements that only mention SBIR (some close in 2040+). Need a relevance filter before publishing.
- Award ceiling is often blank, "none" or "0" in Grants.gov. Show these as "Not listed", never "$0".
- Grants.gov is mostly NIH, NSF, USDA and some DoD. Most DoD SBIR topics are on DoD's own SBIR/STTR portal.
- 2026-10-15: DoD portal added (`scripts/fetch-dod.mjs`): 71 topics (44 open, 27 pre-release) across USAF, OSD, DARPA, Army, Navy, SOCOM. Includes objective, keywords, technology areas and ITAR flag. No award amounts in the feed; show "see solicitation". Source link is the portal's topics page plus the topic code (no per-topic public URL found yet).
- SBIR.gov API returns 403; its site says the API is under maintenance (2026-10-15).

- Fetch open and forecasted opportunities from the Grants.gov API (search2 and fetchOpportunity; no key needed per Grants.gov).
- Fetch open SBIR/STTR solicitations from SBIR.gov and agency portals. SBIR.gov listings are copies and may lag; the agency's own page is the source of truth for every listing.
- Store each record in `data/` with its source URL, fetch date, and fields copied exactly.
- Validation: every record has a source link, a deadline in a valid date format, and an agency.

## v0.2: site
- Reuse ShipStack's build and check scripts: one page per opportunity, pages per agency and topic, sitemap, llms.txt.
- Every page: "confirm on the official page before applying."

## v0.3: free weekly digest
- New opportunities + deadlines in the next 30 days.

## v0.4: paid alerts
- Stripe subscription ($19–29/mo): alerts by agency and topic, deadline reminders at 30/14/3 days.
- Consultant tier ($79–149/mo) later.

## Competition to study before v0.2
- Existing paid grant alert services, some reportedly priced at hundreds of dollars a month and built on the same free government API.
- FedScout (iPhone app with SBIR alerts), GrantedAI (free weekly SBIR email alerts), a Grants.gov alert service with 14/7/1-day reminders.
- Basic alerts are already free elsewhere. Planned edge: track each agency's official page (SBIR.gov copies can lag), cover more agencies, and make it easy to see how each topic matches a startup's technology.

## Owner to-dos
- Check that the GrantTopics domain and trademark are free (tmsearch.uspto.gov); buy the domain.
- Allow api.grants.gov, www.grants.gov, www.sbir.gov and api.www.sbir.gov in the environment's network settings.
- Later: Stripe account (needed for paid alerts).
