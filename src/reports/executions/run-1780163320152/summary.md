# DennyQA vNext Test Report

## Executive Summary
- Run ID: run-1780163320152
- URL: https://ecommerce.folio3.com
- Test type: Full Regression
- Browser: Chrome
- Device(s): Desktop
- Environment: development
- Total cases: 12
- Passed: 7
- Failed: 5
- Skipped: 0
- Bugs found: 5
- Confidence score: 99%

## Root Cause Analysis
- Authentication issue: Login flow works as expected: Investigation found: Iframe detected; target action may be inside nested browsing context.; Overlay detected; click targets may be obscured.; Disabled controls present; prerequisite steps may be missing.. This likely contributed to the failure.
- Cart issue: Coupon if available works from cart workflow: Investigation found: Overlay detected; click targets may be obscured.; Iframe detected; target action may be inside nested browsing context.. This likely contributed to the failure.
- Catalog issue: Search behavior is correct: Investigation found: Overlay detected; click targets may be obscured.; Iframe detected; target action may be inside nested browsing context.. This likely contributed to the failure.
- Account issue: Profile section behaves as expected: Investigation found: Iframe detected; target action may be inside nested browsing context.; Overlay detected; click targets may be obscured.; Disabled controls present; prerequisite steps may be missing.. This likely contributed to the failure.
- Account issue: Orders section behaves as expected: Investigation found: Overlay detected; click targets may be obscured.. This likely contributed to the failure.

## Recovery Attempts
- Attempt 1: Root error: Step failed after 3 attempts: Loop protection triggered: repeated login attempts exceeded threshold.
- Attempt 1: Strategy 1: synchronized to domcontentloaded state.
- Attempt 1: Strategy 2: no blocking overlays detected.
- Attempt 1: Strategy 3: reloaded page successfully.
- Attempt 1: Strategy 4: navigated back to base URL and stabilized network.
- Attempt 1: retry failed (Step failed after 3 attempts: Loop protection triggered: repeated identical action "login" exceeded threshold.)
- Attempt 2: Root error: Step failed after 3 attempts: Loop protection triggered: repeated login attempts exceeded threshold.
- Attempt 2: Strategy 1: synchronized to domcontentloaded state.
- Attempt 2: Strategy 2: no blocking overlays detected.
- Attempt 2: Strategy 3: reloaded page successfully.
- Attempt 2: Strategy 4: navigated back to base URL and stabilized network.
- Attempt 2: retry failed (Step failed after 3 attempts: Loop protection triggered: maximum step action threshold exceeded.)
- Detected action: generic
- Attempt 1: Root error: Step failed after 3 attempts: No executable UI action matched intent: "user validates coupon if available behavior".
- Attempt 1: retry failed (Step failed after 3 attempts: No executable UI action matched intent: "user validates coupon if available behavior".)
- Attempt 2: Root error: Step failed after 3 attempts: No executable UI action matched intent: "user validates coupon if available behavior".
- Attempt 1: Root error: Step failed after 3 attempts: No executable UI action matched intent: "user performs search interactions".
- Attempt 1: retry failed (Step failed after 3 attempts: Loop protection triggered: repeated identical action "search" exceeded threshold.)
- Attempt 2: Root error: Step failed after 3 attempts: No executable UI action matched intent: "user performs search interactions".
- Detected action: navigate
- Attempt 1: Root error: Step failed after 3 attempts: No executable UI action matched intent: "user opens profile area".
- Attempt 1: retry failed (Step failed after 3 attempts: No executable UI action matched intent: "user opens profile area".)
- Attempt 2: Root error: Step failed after 3 attempts: No executable UI action matched intent: "user opens profile area".
- Attempt 1: Root error: Step failed after 3 attempts: No executable UI action matched intent: "user opens orders area".
- Attempt 1: retry failed (Step failed after 3 attempts: No executable UI action matched intent: "user opens orders area".)
- Attempt 2: Root error: Step failed after 3 attempts: No executable UI action matched intent: "user opens orders area".

## AI Assumptions
- Execution assertions rely on generated BDD scenario intent and detected capabilities.
- Fallback test data may be used for missing non-sensitive fields where configured.
- Sensitive/destructive operations are skipped unless safe test mode is explicitly enabled.
- Browser/device matrix reflects configured run values: Chrome / Desktop.

## Screenshots
- scenario-1: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780163320152\screenshots\scenario-1-Desktop-failure.png
- scenario-2: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780163320152\screenshots\scenario-2-Desktop-landing.png
- scenario-3: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780163320152\screenshots\scenario-3-Desktop-landing.png
- scenario-4: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780163320152\screenshots\scenario-4-Desktop-landing.png
- scenario-5: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780163320152\screenshots\scenario-5-Desktop-failure.png
- scenario-6: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780163320152\screenshots\scenario-6-Desktop-failure.png
- scenario-7: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780163320152\screenshots\scenario-7-Desktop-landing.png
- scenario-8: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780163320152\screenshots\scenario-8-Desktop-landing.png
- scenario-9: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780163320152\screenshots\scenario-9-Desktop-landing.png
- scenario-10: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780163320152\screenshots\scenario-10-Desktop-landing.png
- scenario-11: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780163320152\screenshots\scenario-11-Desktop-failure.png
- scenario-12: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780163320152\screenshots\scenario-12-Desktop-failure.png

## Technical Logs
- scenario-1 (failed) :: error=Step failed after 3 attempts: Loop protection triggered: repeated login attempts exceeded threshold., console=316, network=445
- scenario-2 (passed) :: error=none, console=308, network=428
- scenario-3 (passed) :: error=none, console=307, network=428
- scenario-4 (passed) :: error=none, console=306, network=428
- scenario-5 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "user validates coupon if available behavior"., console=305, network=428
- scenario-6 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "user performs search interactions"., console=297, network=418
- scenario-7 (passed) :: error=none, console=19, network=24
- scenario-8 (passed) :: error=none, console=18, network=24
- scenario-9 (passed) :: error=none, console=17, network=24
- scenario-10 (passed) :: error=none, console=16, network=24
- scenario-11 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "user opens profile area"., console=15, network=24
- scenario-12 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "user opens orders area"., console=8, network=10
