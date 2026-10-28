# AeroAid — AIM student scholarship directory

Public URL: https://sueaim.github.io/scholarships/

Independent student resource, not an official or endorsed AIM service. This folder is additive; the existing study homepage, Block1 and Block6 are preserved.

## First version

- 63 researched award/program/lead entries, plus seven separate source directories, initially reviewed October 28, 2026.
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

WAI and RACCA named awards share portal rules. PAMA now refers applicants to AMC/TechForce. Soroptimist and South Texas PAMA prohibit AI-written application responses; flags are included. No detector-evasion assurances are offered.

## Daily source checks

`.github/workflows/scholarship-updates.yml` runs at 12:15 UTC daily, on its initial code push, and by manual dispatch. Scheduled GitHub runs may be delayed or disabled by GitHub policy. It requests a Pages rebuild after data updates.

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

This is a substantial starting catalog, not a claim to have found every possible scholarship or 63 currently open applications.
