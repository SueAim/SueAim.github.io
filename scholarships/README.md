# AeroAid — AIM student scholarship directory

Public URL: https://sueaim.github.io/scholarships/

Independent student resource, not an official or endorsed AIM service. This folder is additive; the existing study homepage, Block1 and Block6 are preserved.

## First version

- 96 researched award/program/lead entries, plus 24 separate source directories, initially reviewed October 28, 2026.
- Search; state/nationwide geography; application status; payment type; award value; women-specific, military and dependent-support options; age and training-stage filters.
- Shared application notices: named awards are not claimed to be independent application opportunities.
- Shortlist kept in page memory only; text download and browser Print / Save PDF.
- Responsive layouts, keyboard navigation, focus-managed details, reduced motion, larger text and user-initiated fullscreen with unsupported-browser fallback.
- No accounts, analytics, personal uploads, cookies or persistent student profiles.
- Official provider links, a public Atom feed, and a daily source-monitor workflow.

Not implemented: AI essay generation, cloud-browser control, external form autofill/submission, email delivery, Google/Apple sign-in, voice conversations or a personal-data backend. The directory and public feed require no ChatGPT account or paid plan. ChatGPT links do not confer cloud-browser access.

## Data accuracy

All source URLs are included per record. Editorial review is separate from daily source reachability. Closed cycles stay closed; dates are not silently rolled forward. Open/year-round designations older than 30 days become 'Confirm with provider'. A future opening date passing does not automatically prove an application is open.

Geographic compatibility is not guaranteed individual eligibility. Many providers have school, membership, financial-need or citizenship requirements. Community affiliation does not establish an ethnicity restriction. General awards remain visible for all backgrounds. Some categories currently have no verified records; the UI says so instead of inventing awards. Cash classification is used only when student cash support is supported; joint institution checks are classified as school payments. Known values may be maximums or in-kind values, never guaranteed spendable cash.

WAI and RACCA named awards share portal rules. PAMA now refers applicants to AMC/TechForce. South Texas PAMA prohibits AI-written responses. Soroptimist main-page limited-assistance guidance differs from application help wording; the current application certification governs. Flags are included. No detector-evasion assurances are offered.

## Daily source checks

`.github/workflows/scholarship-updates.yml` runs at 12:15 UTC daily, on catalog/monitor/workflow updates, and by manual dispatch. Scheduled GitHub runs may be delayed or disabled by GitHub policy. It requests a Pages rebuild after data updates.

The standard-library Python monitor checks the maintained source set, records failures and content changes, and narrowly detects new maintenance-related headings on AEA, LPA and Choose Aerospace catalog pages. Initial baselines are not treated as new awards. New detections are unverified leads with unknown geography/payment/eligibility until editorially reviewed. This is not an exhaustive automated daily search of every scholarship site. Data failures never rewrite editorial review dates or invent successful checks.

`data/updates.json` exposes freshness; `data/source-state.json` contains only public content digests/headings. No student data goes through GitHub Actions. Source changes do not automatically change deadlines, amounts or eligibility.

## Run checks

```
node --check app.js
node tests/filters.test.js
python3 tests/test_monitor.py
```

Serve this directory using an HTTP server for local testing; fetch-based catalog loading may not work from file://.

## Research scope

Initial research covered AIM funding, WTS NJ and neighboring chapters, AEA, AMC/PAMA/TechForce, NBAA, LPA, VAI, EAA, Choose Aerospace/ATEC, GOPA, Avfuel/Sheltair, RACCA, WAI, AWAM, OBAP, Northrop Rice, VFW, Soroptimist, P.E.O., mikeroweWORKS, Folds of Honor and additional demographic/trade directories. Excluded or separately labeled leads include construction-only NJ-GIVS, nonprofit-only Horatio Alger, pilot-only awards and programs requiring an already-earned A&P or another institution.

This is a substantial starting catalog, not a claim to have found every possible scholarship or 96 currently open applications.

## AIM NJ focus and employer expansion

Default filters show students without A&P and omit routes requiring a different school/training program or a university degree. Optional filters can show those alternatives. Remaining results are potential opportunities, not confirmed personal matches.

Career benefits distinguish conditional offers, guaranteed interviews, recruiting/referrals and employment commitments. Wages are not included in scholarship-dollar ranges. Multi-benefit programs appear under each supported type. A current program page does not prove a vacancy; unconfirmed intakes remain labeled.

The directory includes Sonic tools, Aero Engine Solutions, Duncan, AAR, HAECO, ATS, Citadel, FEAM, West Star, Textron, regional airlines, NGPA awards, Republic cadets and British Airways AIM pathways. See [research coverage](docs/research-coverage.md) for source qualifications and follow-up leads.

## Automatic maintenance and compact mobile home

- The home starts with a compact scholarship header, daily-update label, live application-window counts, search and six award cards. Dollar amounts and benefit type are prominent; the decorative hero and public 96-total badge are removed. Larger help/privacy/source sections are collapsed.
- At 12:15 and 20:15 UTC, the workflow checks every maintained official source, including hidden URLs and PDF flyers. This is morning maintenance plus an afternoon retry in New Jersey. GitHub schedules may be delayed.
- Closed/expired awards with no verified recurring/future-cycle marker are hidden from results, headlines, counts, resources and feed. Deadline dates are inclusive in America/New_York. Recurring awards stay closed; dates are never rolled forward automatically. Provider-cycle recurrence does not guarantee every named award repeats.
- Confirmed HTTP 404/410 sources are hidden immediately and rechecked on every run. A successful content check restores listings that are still relevant. HTTP 403/429/5xx, timeouts and short/access-screen responses are reported without classifying the page as permanently missing. Recovery from a missing link does not revive an already-expired one-time award.
- Records remain in the source catalog with public maintenance metadata so recovery and audit are possible; this is removal from the visitor directory, not irreversible deletion.
- New maintenance-related scholarship headings on maintained official sources become unverified leads automatically. First baselines and existing known titles are not announced as new. This is not an exhaustive daily search of the entire web and does not automatically rewrite eligibility or fabricate reopened cycles.
- Every run publishes last-check time, failures, hidden counts and a lifecycle log to data/updates.json, then requests a Pages deployment. An open page refreshes public data every 15 minutes and on returning to the tab; time-based visibility is recalculated each minute.

Validation covers deadline boundaries in NJ time, recurring exceptions, 404/410 suppression and recovery, transient errors, PDF checks, discovery deduplication and filter integrity. `docs/mobile-preview.html` exercises the actual website at a 390px phone width.
