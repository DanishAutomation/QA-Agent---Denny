# DennyQA vNext Test Report

## Executive Summary
- Run ID: run-1780250918334
- URL: https://uat2.purelifedental.com/
- Test type: Full Regression
- Browser: Chrome
- Device(s): Tablet
- Environment: development
- Total cases: 23
- Passed: 7
- Failed: 16
- Skipped: 0
- Bugs found: 5
- Confidence score: 82%

## Root Cause Analysis
- PDP: locator.count: Target page, context or browser has been closed: locator.count: Target page, context or browser has been closed Network: [404] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js Network: [FAILED] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js :: net::ERR_ABORTED Iframe detected; target action may be inside nested browsing context. Modal/dialog present; interactions may be blocked.
- PDP: page.waitForSelector: Target page, context or browser has been closed: page.waitForSelector: Target page, context or browser has been closed
- Cart: page.waitForSelector: Target page, context or browser has been closed: page.waitForSelector: Target page, context or browser has been closed
- Checkout: page.waitForSelector: Target page, context or browser has been closed: page.waitForSelector: Target page, context or browser has been closed
- Account: page.waitForSelector: Target page, context or browser has been closed: page.waitForSelector: Target page, context or browser has been closed

## Recovery Attempts
- Applied 5 memory-backed regression step(s) for "Add to cart behavior on product detail page".
- Skipped redundant login — authenticated session reused.
- Detected action: search
- Search submitted with query "powder".
- Resolved action using search-input: input[type='search']
- Detected action: openProduct
- Resolved action using product-listing-same-origin: .product-item-link
- Detected action: buyOnce
- Buy once option not available on this product; skipped.
- Quantity set to 1 via input-fill.
- Attempt 1: Root error: locator.count: Target page, context or browser has been closed
- Attempt 1: Strategy 1: synchronized to domcontentloaded state.
- Attempt 1: Strategy 2: no blocking overlays detected.
- Attempt 1: Strategy 3 failed: page reload did not stabilize.
- Attempt 1: Strategy 4 skipped: base URL recovery disabled for session continuity.
- Attempt 1: retry failed (page.waitForSelector: Target page, context or browser has been closed)
- Attempt 2: Root error: locator.count: Target page, context or browser has been closed
- Attempt 2: Strategy 1: synchronized to domcontentloaded state.
- Attempt 2: Strategy 2: no blocking overlays detected.
- Attempt 2: Strategy 3 failed: page reload did not stabilize.
- Attempt 2: Strategy 4 skipped: base URL recovery disabled for session continuity.
- Attempt 2: retry failed (page.waitForSelector: Target page, context or browser has been closed)
- Attempt 1: Root error: page.waitForSelector: Target page, context or browser has been closed
- Attempt 2: Root error: page.waitForSelector: Target page, context or browser has been closed

## AI Assumptions
- Execution assertions rely on generated BDD scenario intent and detected capabilities.
- Fallback test data may be used for missing non-sensitive fields where configured.
- Sensitive/destructive operations are skipped unless safe test mode is explicitly enabled.
- Browser/device matrix reflects configured run values: Chrome / Tablet.

## Screenshots
- scenario-3: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780250918334\screenshots\scenario-3-step-1-product-listing-behavior-is-corr-product-ventyv-flamingo-nitrile-powder-f-Tablet-landing.png
- scenario-4: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780250918334\screenshots\scenario-4-step-1-search-behavior-is-correct-catalogsearch-result-Tablet-landing.png
- scenario-5: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780250918334\screenshots\scenario-5-step-1-categories-behavior-is-correct-gloves-html-Tablet-landing.png
- scenario-6: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780250918334\screenshots\scenario-6-step-1-filters-behavior-is-correct-gloves-html-Tablet-landing.png
- scenario-7: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780250918334\screenshots\scenario-7-step-1-pagination-behavior-is-correct-gloves-html-Tablet-landing.png

## Technical Logs
- scenario-1 (passed) :: error=none, console=1, network=22
- scenario-2 (passed) :: error=none, console=1, network=5
- scenario-3 (passed) :: error=none, console=2, network=10
- scenario-4 (passed) :: error=none, console=1, network=6
- scenario-5 (passed) :: error=none, console=1, network=5
- scenario-6 (passed) :: error=none, console=1, network=10
- scenario-7 (passed) :: error=none, console=1, network=10
- scenario-8 (failed) :: error=locator.count: Target page, context or browser has been closed, console=2, network=14
- scenario-9 (failed) :: error=page.waitForSelector: Target page, context or browser has been closed, console=0, network=0
- scenario-10 (failed) :: error=page.waitForSelector: Target page, context or browser has been closed, console=0, network=0
- scenario-11 (failed) :: error=page.waitForSelector: Target page, context or browser has been closed, console=0, network=0
- scenario-12 (failed) :: error=page.waitForSelector: Target page, context or browser has been closed, console=0, network=0
- scenario-13 (failed) :: error=page.waitForSelector: Target page, context or browser has been closed, console=0, network=0
- scenario-14 (failed) :: error=page.waitForSelector: Target page, context or browser has been closed, console=0, network=0
- scenario-15 (failed) :: error=page.waitForSelector: Target page, context or browser has been closed, console=0, network=0
- scenario-16 (failed) :: error=page.waitForSelector: Target page, context or browser has been closed, console=0, network=0
- scenario-17 (failed) :: error=page.waitForSelector: Target page, context or browser has been closed, console=0, network=0
- scenario-18 (failed) :: error=page.waitForSelector: Target page, context or browser has been closed, console=0, network=0
- scenario-19 (failed) :: error=page.waitForSelector: Target page, context or browser has been closed, console=0, network=0
- scenario-20 (failed) :: error=page.waitForSelector: Target page, context or browser has been closed, console=0, network=0
- scenario-21 (failed) :: error=page.waitForSelector: Target page, context or browser has been closed, console=0, network=0
- scenario-22 (failed) :: error=page.waitForSelector: Target page, context or browser has been closed, console=0, network=0
- scenario-23 (failed) :: error=page.waitForSelector: Target page, context or browser has been closed, console=0, network=0
