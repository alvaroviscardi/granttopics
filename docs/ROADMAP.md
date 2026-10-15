# Roadmap

## v0.1: data pipeline (blocked on network access)
- Fetch open and forecasted opportunities from the Grants.gov API (search2 and fetchOpportunity; no key needed per Grants.gov).
- Fetch open SBIR/STTR solicitations from SBIR.gov and agency portals.
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
- Third-party SBIR trackers already publishing open solicitations.

## Owner to-dos
- Check that the GrantSignal name and domain are free; buy the domain.
- Allow api.grants.gov, www.grants.gov, www.sbir.gov and api.www.sbir.gov in the environment's network settings.
- Later: Stripe account (needed for paid alerts).
