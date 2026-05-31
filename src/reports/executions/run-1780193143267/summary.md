# DennyQA vNext Test Report

## Executive Summary
- Run ID: run-1780193143267
- URL: https://uat2.purlifedental.com/
- Test type: Full Regression
- Browser: Chrome
- Device(s): Desktop
- Environment: development
- Total cases: 3
- Passed: 0
- Failed: 3
- Skipped: 0
- Bugs found: 3
- Confidence score: 94%

## Root Cause Analysis
- Responsive: page.goto: net::ERR_NAME_NOT_RESOLVED at https://uat2.purlifedental.c...: page.goto: net::ERR_NAME_NOT_RESOLVED at https://uat2.purlifedental.com/
Call log:
  - navigating to "https://uat2.purlifedental.com/", waiting until "domcontentloaded"
 Network: [FAILED] https://uat2.purlifedental.com/ :: net::ERR_NAME_NOT_RESOLVED Network: [FAILED] https://uat2.purlifedental.com/ :: net::ERR_NAME_NOT_RESOLVED
- Accessibility: page.goto: net::ERR_NAME_NOT_RESOLVED at https://uat2.purlifedental.c...: page.goto: net::ERR_NAME_NOT_RESOLVED at https://uat2.purlifedental.com/
Call log:
  - navigating to "https://uat2.purlifedental.com/", waiting until "domcontentloaded"
 Network: [FAILED] https://uat2.purlifedental.com/ :: net::ERR_NAME_NOT_RESOLVED Network: [FAILED] https://uat2.purlifedental.com/ :: net::ERR_NAME_NOT_RESOLVED
- Navigation: page.goto: net::ERR_NAME_NOT_RESOLVED at https://uat2.purlifedental.c...: page.goto: net::ERR_NAME_NOT_RESOLVED at https://uat2.purlifedental.com/
Call log:
  - navigating to "https://uat2.purlifedental.com/", waiting until "domcontentloaded"
 Network: [FAILED] https://uat2.purlifedental.com/ :: net::ERR_NAME_NOT_RESOLVED Network: [FAILED] https://uat2.purlifedental.com/ :: net::ERR_NAME_NOT_RESOLVED

## Recovery Attempts
- Attempt 1: Root error: page.goto: net::ERR_NAME_NOT_RESOLVED at https://uat2.purlifedental.com/
Call log:
  - navigating to "https://uat2.purlifedental.com/", waiting until "domcontentloaded"

- Attempt 1: Strategy 1: synchronized to domcontentloaded state.
- Attempt 1: Strategy 2: no blocking overlays detected.
- Attempt 1: Strategy 3 failed: page reload did not stabilize.
- Attempt 1: Strategy 4 failed: base URL recovery navigation failed.
- Attempt 2: Root error: page.goto: net::ERR_NAME_NOT_RESOLVED at https://uat2.purlifedental.com/
Call log:
  - navigating to "https://uat2.purlifedental.com/", waiting until "domcontentloaded"

- Attempt 2: Strategy 1: synchronized to domcontentloaded state.
- Attempt 2: Strategy 2: no blocking overlays detected.
- Attempt 2: Strategy 3 failed: page reload did not stabilize.
- Attempt 2: Strategy 4 failed: base URL recovery navigation failed.

## AI Assumptions
- Execution assertions rely on generated BDD scenario intent and detected capabilities.
- Fallback test data may be used for missing non-sensitive fields where configured.
- Sensitive/destructive operations are skipped unless safe test mode is explicitly enabled.
- Browser/device matrix reflects configured run values: Chrome / Desktop.

## Screenshots
- scenario-1: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780193143267\screenshots\scenario-1-step-1-responsive-layout-remains-stable--Desktop-failure.png
- scenario-2: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780193143267\screenshots\scenario-2-step-1-accessibility-risk-checks-run-on--Desktop-failure.png
- scenario-3: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780193143267\screenshots\scenario-3-step-1-primary-navigation-routes-resolv--Desktop-failure.png

## Technical Logs
- scenario-1 (failed) :: error=page.goto: net::ERR_NAME_NOT_RESOLVED at https://uat2.purlifedental.com/
Call log:
  - navigating to "https://uat2.purlifedental.com/", waiting until "domcontentloaded"
, console=0, network=5
- scenario-2 (failed) :: error=page.goto: net::ERR_NAME_NOT_RESOLVED at https://uat2.purlifedental.com/
Call log:
  - navigating to "https://uat2.purlifedental.com/", waiting until "domcontentloaded"
, console=0, network=5
- scenario-3 (failed) :: error=page.goto: net::ERR_NAME_NOT_RESOLVED at https://uat2.purlifedental.com/
Call log:
  - navigating to "https://uat2.purlifedental.com/", waiting until "domcontentloaded"
, console=0, network=5
