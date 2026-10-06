# Lighthouse audit (2026-10-06)

## Results

Measured with Lighthouse 13.5.0 and Chrome for Testing 155 against the local production build and API.

| Form factor | Performance | Accessibility | Best practices | SEO | Agentic browsing* |
| --- | ---: | ---: | ---: | ---: | ---: |
| Desktop | 100 | 100 | 100 | 100 | 1.00 |
| Mobile | 94–95 | 100 | 100 | 100 | 1.00 |

*Agentic Browsing is an experimental Lighthouse category reported as a pass ratio, not a weighted 0–100 score. See [Chrome's scoring notes](https://developer.chrome.com/docs/lighthouse/agentic-browsing/scoring).

## Mobile performance exception

The local mobile runs apply Lighthouse's CPU and network throttling. The app's first content depends on its client startup and an uncached, no-store workspace bootstrap. The local API returns about 120 KB of JSON; a gzip transport check reduced that response to about 24 KB, and the production Nginx config now enables gzip for application assets and JSON.

The Lighthouse mobile performance result still varied from 94 to 95 across runs. FCP and LCP remain the limiting metrics. The app is not deployed, and Nginx is not installed in this development environment, so the production proxy configuration and a representative-device score have not been measured. Keep this exception until Lighthouse can run against the production-like Nginx stack; do not treat the local mobile score as a deployed score.

## Changes

- The workspace loads task, work log, inventory, CAD, subsystem, roster, and help sections when first visited. Loaded sections remain mounted so their view state survives navigation. This reduced Lighthouse's unused-JavaScript estimate from 116 KiB to 23 KiB in the measured local run.
- Overview subsection headings now use H2 semantics while keeping the prior compact H3 appearance. This fixes the mobile heading-order audit without exposing the hidden Home view title.
- `/.well-known/ai-catalog.json` is a valid empty catalog because this app does not publish agent tools; authenticated workspace actions remain outside that public catalog.
- The production Nginx server enables gzip for static web assets and proxied JSON responses.
