# DennyQA vNext Test Report

## Executive Summary
- Run ID: run-1780142912906
- URL: https://practicetestautomation.com/practice-test-login/
- Test type: Custom Command Automation
- Browser: Chrome
- Device(s): Desktop
- Environment: development
- Total cases: 2
- Passed: 1
- Failed: 1
- Skipped: 0
- Bugs found: 1
- Confidence score: 94%

## Root Cause Analysis
- Custom Command issue: Execute command 1: login with qa.user@example.test and Password@123: Primary likely cause is backend/API instability reflected by network failures.

## Recovery Attempts
- Attempt 1: Root error: page.goto: net::ERR_NAME_NOT_RESOLVED at https://practicetestautomation.com/practice-test-login/
Call log:
  - navigating to "https://practicetestautomation.com/practice-test-login/", waiting until "domcontentloaded"

- Attempt 1: Strategy 1: synchronized to domcontentloaded state.
- Attempt 1: Strategy 2: no blocking overlays detected.
- Attempt 1: Strategy 3 failed: page reload did not stabilize.
- Attempt 1: Strategy 4 failed: base URL recovery navigation failed.
- Attempt 2: Root error: page.goto: net::ERR_NAME_NOT_RESOLVED at https://practicetestautomation.com/practice-test-login/
Call log:
  - navigating to "https://practicetestautomation.com/practice-test-login/", waiting until "domcontentloaded"

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
- scenario-1: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780142912906\screenshots\scenario-1-Desktop-failure.png
- scenario-2: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780142912906\screenshots\scenario-2-Desktop-recovered.png

## Technical Logs
- scenario-1 (failed) :: error=page.goto: net::ERR_NAME_NOT_RESOLVED at https://practicetestautomation.com/practice-test-login/
Call log:
  - navigating to "https://practicetestautomation.com/practice-test-login/", waiting until "domcontentloaded"
, console=0, network=5
- scenario-2 (passed) :: error=none, console=0, network=5
