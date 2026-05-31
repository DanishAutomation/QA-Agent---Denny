# DennyQA vNext Test Report

## Executive Summary
- Run ID: run-1780151467280
- URL: https://uat2.purelifedental.com
- Test type: Custom Command Automation
- Browser: Chrome
- Device(s): Desktop
- Environment: development
- Total cases: 12
- Passed: 6
- Failed: 6
- Skipped: 0
- Bugs found: 6
- Confidence score: 99%

## Root Cause Analysis
- Custom Command issue: Execute command 2: Hit Login button: Investigation found: Iframe detected; target action may be inside nested browsing context.; Modal/dialog present; interactions may be blocked.; Overlay detected; click targets may be obscured.; Validation/error messages detected on page.; Disabled controls present; prerequisite steps may be missing.. This likely contributed to the failure.
- Custom Command issue: Execute command 3: Wait for Login and then click Search bar: Investigation found: Iframe detected; target action may be inside nested browsing context.; Modal/dialog present; interactions may be blocked.; Overlay detected; click targets may be obscured.; Validation/error messages detected on page.. This likely contributed to the failure.
- Custom Command issue: Execute command 6: Wait for all the items to be visible on the page: Primary likely cause is backend/API instability reflected by network failures.
- Custom Command issue: Execute command 7: Click "buy once" checkbox for the first sku: Investigation found: Iframe detected; target action may be inside nested browsing context.; Modal/dialog present; interactions may be blocked.; Overlay detected; click targets may be obscured.; Disabled controls present; prerequisite steps may be missing.; Validation/error messages detected on page.. This likely contributed to the failure.
- Custom Command issue: Execute command 8: Select Quantity from Qty dropdown: Investigation found: Iframe detected; target action may be inside nested browsing context.; Modal/dialog present; interactions may be blocked.; Overlay detected; click targets may be obscured.; Disabled controls present; prerequisite steps may be missing.; Validation/error messages detected on page.. This likely contributed to the failure.
- Custom Command issue: Execute command 10: Move to cart and click "proceed to checkout" to reach shipping address screen: Investigation found: Iframe detected; target action may be inside nested browsing context.; Modal/dialog present; interactions may be blocked.; Overlay detected; click targets may be obscured.; Disabled controls present; prerequisite steps may be missing.; Validation/error messages detected on page.. This likely contributed to the failure.

## Recovery Attempts
- Detected action: login
- Opened login form via role
- Login field fill: email=false password=false
- Re-opened login form via role
- Filled required text field with safe test value.
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
- Attempt 1: Strategy 4 failed: base URL recovery navigation failed.
- Attempt 2: Strategy 4 failed: base URL recovery navigation failed.
- Attempt 1: Root error: No actionable intent extracted for custom command scenario "Execute command 6: Wait for all the items to be visible on the page".
- Attempt 1: retry failed (No actionable intent extracted for custom command scenario "Execute command 6: Wait for all the items to be visible on the page".)
- Attempt 2: Root error: No actionable intent extracted for custom command scenario "Execute command 6: Wait for all the items to be visible on the page".
- Detected action: buyOnce
- Attempt 1: Root error: Step failed after 3 attempts: No executable UI action matched intent: "Click "buy once" checkbox for the first sku".
- Attempt 2: Root error: Step failed after 3 attempts: No executable UI action matched intent: "Click "buy once" checkbox for the first sku".
- Detected action: selectQuantity
- Attempt 1: Root error: Step failed after 3 attempts: No executable UI action matched intent: "Select Quantity from Qty dropdown".
- Attempt 1: retry failed (Step failed after 3 attempts: No executable UI action matched intent: "Select Quantity from Qty dropdown".)
- Attempt 2: Root error: Step failed after 3 attempts: No executable UI action matched intent: "Select Quantity from Qty dropdown".
- Detected action: moveToCart
- Filled checkout field (name) from parsed/fallback data.
- Attempt 1: Root error: Step failed after 3 attempts: No executable UI action matched intent: "Move to cart and click "proceed to checkout" to reach shipping address screen".
- Attempt 1: retry failed (Step failed after 3 attempts: No executable UI action matched intent: "Move to cart and click "proceed to checkout" to reach shipping address screen".)
- Attempt 2: Root error: Step failed after 3 attempts: No executable UI action matched intent: "Move to cart and click "proceed to checkout" to reach shipping address screen".

## AI Assumptions
- Execution assertions rely on generated BDD scenario intent and detected capabilities.
- Fallback test data may be used for missing non-sensitive fields where configured.
- Sensitive/destructive operations are skipped unless safe test mode is explicitly enabled.
- Browser/device matrix reflects configured run values: Chrome / Desktop.

## Screenshots
- scenario-1: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780151467280\screenshots\scenario-1-Desktop-landing.png
- scenario-2: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780151467280\screenshots\scenario-2-Desktop-failure.png
- scenario-3: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780151467280\screenshots\scenario-3-Desktop-failure.png
- scenario-4: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780151467280\screenshots\scenario-4-Desktop-landing.png
- scenario-5: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780151467280\screenshots\scenario-5-Desktop-landing.png
- scenario-6: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780151467280\screenshots\scenario-6-Desktop-failure.png
- scenario-7: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780151467280\screenshots\scenario-7-Desktop-failure.png
- scenario-8: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780151467280\screenshots\scenario-8-Desktop-failure.png
- scenario-9: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780151467280\screenshots\scenario-9-Desktop-landing.png
- scenario-10: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780151467280\screenshots\scenario-10-Desktop-failure.png
- scenario-11: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780151467280\screenshots\scenario-11-Desktop-landing.png
- scenario-12: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780151467280\screenshots\scenario-12-Desktop-landing.png

## Technical Logs
- scenario-1 (passed) :: error=none, console=6, network=13
- scenario-2 (failed) :: error=Step failed after 3 attempts: Loop protection triggered: repeated login attempts exceeded threshold., console=33, network=97
- scenario-3 (failed) :: error=Step failed after 3 attempts: Loop protection triggered: repeated login attempts exceeded threshold., console=29, network=93
- scenario-4 (passed) :: error=none, console=4, network=6
- scenario-5 (passed) :: error=none, console=6, network=12
- scenario-6 (failed) :: error=No actionable intent extracted for custom command scenario "Execute command 6: Wait for all the items to be visible on the page"., console=12, network=39
- scenario-7 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "Click "buy once" checkbox for the first sku"., console=13, network=41
- scenario-8 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "Select Quantity from Qty dropdown"., console=15, network=40
- scenario-9 (passed) :: error=none, console=7, network=11
- scenario-10 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "Move to cart and click "proceed to checkout" to reach shipping address screen"., console=16, network=41
- scenario-11 (passed) :: error=none, console=7, network=11
- scenario-12 (passed) :: error=none, console=7, network=11
