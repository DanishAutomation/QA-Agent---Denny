# DennyQA vNext Test Report

## Executive Summary
- Run ID: run-1780158982611
- URL: https://uat2.purelifedental.com
- Test type: Custom Command Automation
- Browser: Chrome
- Device(s): Desktop
- Environment: development
- Total cases: 19
- Passed: 16
- Failed: 3
- Skipped: 0
- Bugs found: 3
- Confidence score: 99%

## Root Cause Analysis
- Custom Command issue: Execute command 17: add any US test address in both Biling and Shipping address fields: Primary likely cause is backend/API instability reflected by network failures.
- Custom Command issue: Execute command 18: Enter Card Details:: Investigation found: Iframe detected; target action may be inside nested browsing context.; Modal/dialog present; interactions may be blocked.; Overlay detected; click targets may be obscured.; Disabled controls present; prerequisite steps may be missing.; Validation/error messages detected on page.. This likely contributed to the failure.
- Custom Command issue: Execute command 19: Place Order: Investigation found: Iframe detected; target action may be inside nested browsing context.; Modal/dialog present; interactions may be blocked.; Overlay detected; click targets may be obscured.; Disabled controls present; prerequisite steps may be missing.; Validation/error messages detected on page.. This likely contributed to the failure.

## Recovery Attempts
- Attempt 1: Root error: No actionable intent extracted for custom command scenario "Execute command 17: add any US test address in both Biling and Shipping address fields".
- Attempt 1: Strategy 1: synchronized to domcontentloaded state.
- Attempt 1: Strategy 2: no blocking overlays detected.
- Attempt 1: Strategy 3 skipped: reload avoided on checkout flow to preserve session.
- Attempt 1: Strategy 4 skipped: base URL recovery disabled for session continuity.
- Attempt 1: retry failed (No actionable intent extracted for custom command scenario "Execute command 17: add any US test address in both Biling and Shipping address fields".)
- Attempt 2: Root error: No actionable intent extracted for custom command scenario "Execute command 17: add any US test address in both Biling and Shipping address fields".
- Attempt 2: Strategy 1: synchronized to domcontentloaded state.
- Attempt 2: Strategy 2: no blocking overlays detected.
- Attempt 2: Strategy 3 skipped: reload avoided on checkout flow to preserve session.
- Attempt 2: Strategy 4 skipped: base URL recovery disabled for session continuity.
- Attempt 2: retry failed (No actionable intent extracted for custom command scenario "Execute command 17: add any US test address in both Biling and Shipping address fields".)
- Detected action: fillPayment
- Attempt 1: Root error: Step failed after 3 attempts: No executable UI action matched intent: "Enter Card Details:".
- Attempt 1: retry failed (Step failed after 3 attempts: No executable UI action matched intent: "Enter Card Details:".)
- Attempt 2: Root error: Step failed after 3 attempts: No executable UI action matched intent: "Enter Card Details:".
- Attempt 2: retry failed (Step failed after 3 attempts: Loop protection triggered: maximum step action threshold exceeded.)
- Detected action: placeOrder
- Attempt 1: Root error: Step failed after 3 attempts: No executable UI action matched intent: "Place Order".
- Attempt 1: retry failed (Step failed after 3 attempts: No executable UI action matched intent: "Place Order".)
- Attempt 2: Root error: Step failed after 3 attempts: No executable UI action matched intent: "Place Order".

## AI Assumptions
- Execution assertions rely on generated BDD scenario intent and detected capabilities.
- Fallback test data may be used for missing non-sensitive fields where configured.
- Sensitive/destructive operations are skipped unless safe test mode is explicitly enabled.
- Browser/device matrix reflects configured run values: Chrome / Desktop.

## Screenshots
- scenario-1: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780158982611\screenshots\scenario-1-Desktop-landing.png
- scenario-2: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780158982611\screenshots\scenario-2-Desktop-landing.png
- scenario-3: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780158982611\screenshots\scenario-3-Desktop-landing.png
- scenario-4: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780158982611\screenshots\scenario-4-Desktop-landing.png
- scenario-5: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780158982611\screenshots\scenario-5-Desktop-landing.png
- scenario-6: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780158982611\screenshots\scenario-6-Desktop-landing.png
- scenario-7: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780158982611\screenshots\scenario-7-Desktop-landing.png
- scenario-8: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780158982611\screenshots\scenario-8-Desktop-landing.png
- scenario-9: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780158982611\screenshots\scenario-9-Desktop-landing.png
- scenario-10: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780158982611\screenshots\scenario-10-Desktop-landing.png
- scenario-11: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780158982611\screenshots\scenario-11-Desktop-landing.png
- scenario-12: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780158982611\screenshots\scenario-12-Desktop-landing.png
- scenario-13: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780158982611\screenshots\scenario-13-Desktop-landing.png
- scenario-14: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780158982611\screenshots\scenario-14-Desktop-landing.png
- scenario-15: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780158982611\screenshots\scenario-15-Desktop-landing.png
- scenario-16: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780158982611\screenshots\scenario-16-Desktop-landing.png
- scenario-17: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780158982611\screenshots\scenario-17-Desktop-failure.png
- scenario-18: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780158982611\screenshots\scenario-18-Desktop-failure.png
- scenario-19: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780158982611\screenshots\scenario-19-Desktop-failure.png

## Technical Logs
- scenario-1 (passed) :: error=none, console=51, network=116
- scenario-2 (passed) :: error=none, console=42, network=83
- scenario-3 (passed) :: error=none, console=39, network=77
- scenario-4 (passed) :: error=none, console=36, network=70
- scenario-5 (passed) :: error=none, console=33, network=60
- scenario-6 (passed) :: error=none, console=33, network=60
- scenario-7 (passed) :: error=none, console=30, network=53
- scenario-8 (passed) :: error=none, console=26, network=46
- scenario-9 (passed) :: error=none, console=26, network=46
- scenario-10 (passed) :: error=none, console=26, network=46
- scenario-11 (passed) :: error=none, console=26, network=46
- scenario-12 (passed) :: error=none, console=26, network=43
- scenario-13 (passed) :: error=none, console=14, network=30
- scenario-14 (passed) :: error=none, console=11, network=23
- scenario-15 (passed) :: error=none, console=8, network=16
- scenario-16 (passed) :: error=none, console=8, network=16
- scenario-17 (failed) :: error=No actionable intent extracted for custom command scenario "Execute command 17: add any US test address in both Biling and Shipping address fields"., console=8, network=16
- scenario-18 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "Enter Card Details:"., console=8, network=16
- scenario-19 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "Place Order"., console=0, network=1
