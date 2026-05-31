# DennyQA vNext Test Report

## Executive Summary
- Run ID: run-1780150862607
- URL: https://uat2.purelifedental.com
- Test type: Custom Command Automation
- Browser: Chrome
- Device(s): Desktop
- Environment: development
- Total cases: 12
- Passed: 4
- Failed: 8
- Skipped: 0
- Bugs found: 8
- Confidence score: 99%

## Root Cause Analysis
- Custom Command issue: Execute command 5: Open first product from the results: Investigation found: Iframe detected; target action may be inside nested browsing context.; Modal/dialog present; interactions may be blocked.; Overlay detected; click targets may be obscured.; Disabled controls present; prerequisite steps may be missing.; Validation/error messages detected on page.. This likely contributed to the failure.
- Custom Command issue: Execute command 6: Wait for all the items to be visible on the page: Primary likely cause is backend/API instability reflected by network failures.
- Custom Command issue: Execute command 7: Click "buy once" checkbox for the first sku: Investigation found: Iframe detected; target action may be inside nested browsing context.; Modal/dialog present; interactions may be blocked.; Overlay detected; click targets may be obscured.; Disabled controls present; prerequisite steps may be missing.; Validation/error messages detected on page.. This likely contributed to the failure.
- Custom Command issue: Execute command 8: Select Quantity from Qty dropdown: Investigation found: Iframe detected; target action may be inside nested browsing context.; Modal/dialog present; interactions may be blocked.; Overlay detected; click targets may be obscured.; Disabled controls present; prerequisite steps may be missing.; Validation/error messages detected on page.. This likely contributed to the failure.
- Custom Command issue: Execute command 9: Click Add to Cart: Investigation found: Iframe detected; target action may be inside nested browsing context.; Modal/dialog present; interactions may be blocked.; Overlay detected; click targets may be obscured.; Disabled controls present; prerequisite steps may be missing.; Validation/error messages detected on page.. This likely contributed to the failure.
- Custom Command issue: Execute command 10: Move to cart and click "proceed to checkout" to reach shipping address screen: Investigation found: Iframe detected; target action may be inside nested browsing context.; Modal/dialog present; interactions may be blocked.; Overlay detected; click targets may be obscured.; Disabled controls present; prerequisite steps may be missing.; Validation/error messages detected on page.. This likely contributed to the failure.
- Custom Command issue: Execute command 11: On shipping address screen click "next button" to reach payment and billing info page: Investigation found: Iframe detected; target action may be inside nested browsing context.; Modal/dialog present; interactions may be blocked.; Overlay detected; click targets may be obscured.; Disabled controls present; prerequisite steps may be missing.; Validation/error messages detected on page.. This likely contributed to the failure.
- Custom Command issue: Execute command 12: On payment page choose customer's default address as billing address: Investigation found: Iframe detected; target action may be inside nested browsing context.; Modal/dialog present; interactions may be blocked.; Overlay detected; click targets may be obscured.; Disabled controls present; prerequisite steps may be missing.; Validation/error messages detected on page.. This likely contributed to the failure.

## Recovery Attempts
- Detected action: navigate
- Filled required text field with safe test value.
- Attempt 1: Root error: Step failed after 3 attempts: No executable UI action matched intent: "Open first product from the results".
- Attempt 1: Strategy 1: synchronized to domcontentloaded state.
- Attempt 1: Strategy 2: no blocking overlays detected.
- Attempt 1: Strategy 3: reloaded page successfully.
- Attempt 1: Strategy 4: navigated back to base URL and stabilized network.
- Attempt 1: retry failed (Step failed after 3 attempts: No executable UI action matched intent: "Open first product from the results".)
- Attempt 2: Root error: Step failed after 3 attempts: No executable UI action matched intent: "Open first product from the results".
- Attempt 2: Strategy 1: synchronized to domcontentloaded state.
- Attempt 2: Strategy 2: no blocking overlays detected.
- Attempt 2: Strategy 3: reloaded page successfully.
- Attempt 2: Strategy 4: navigated back to base URL and stabilized network.
- Attempt 2: retry failed (Step failed after 3 attempts: Loop protection triggered: maximum step action threshold exceeded.)
- Attempt 1: Root error: No actionable intent extracted for custom command scenario "Execute command 6: Wait for all the items to be visible on the page".
- Attempt 1: retry failed (No actionable intent extracted for custom command scenario "Execute command 6: Wait for all the items to be visible on the page".)
- Attempt 2: Root error: No actionable intent extracted for custom command scenario "Execute command 6: Wait for all the items to be visible on the page".
- Attempt 2: retry failed (No actionable intent extracted for custom command scenario "Execute command 6: Wait for all the items to be visible on the page".)
- Detected action: generic
- Attempt 1: Root error: Step failed after 3 attempts: No executable UI action matched intent: "Click "buy once" checkbox for the first sku".
- Attempt 1: retry failed (Step failed after 3 attempts: No executable UI action matched intent: "Click "buy once" checkbox for the first sku".)
- Attempt 2: Root error: Step failed after 3 attempts: No executable UI action matched intent: "Click "buy once" checkbox for the first sku".
- Attempt 1: Root error: Step failed after 3 attempts: No executable UI action matched intent: "Select Quantity from Qty dropdown".
- Attempt 1: retry failed (Step failed after 3 attempts: No executable UI action matched intent: "Select Quantity from Qty dropdown".)
- Attempt 2: Root error: Step failed after 3 attempts: No executable UI action matched intent: "Select Quantity from Qty dropdown".
- Detected action: addToCart
- Attempt 1: Root error: Step failed after 3 attempts: No executable UI action matched intent: "Click Add to Cart".
- Attempt 1: retry failed (Step failed after 3 attempts: No executable UI action matched intent: "Click Add to Cart".)
- Attempt 2: Root error: Step failed after 3 attempts: No executable UI action matched intent: "Click Add to Cart".
- Detected action: checkout
- Filled checkout field (name) from parsed/fallback data.
- Attempt 1: Root error: Step failed after 3 attempts: No executable UI action matched intent: "Move to cart and click "proceed to checkout" to reach shipping address screen".
- Attempt 1: retry failed (Step failed after 3 attempts: No executable UI action matched intent: "Move to cart and click "proceed to checkout" to reach shipping address screen".)
- Attempt 2: Root error: Step failed after 3 attempts: No executable UI action matched intent: "Move to cart and click "proceed to checkout" to reach shipping address screen".
- Attempt 1: Root error: Step failed after 3 attempts: No executable UI action matched intent: "On shipping address screen click "next button" to reach payment and billing info page".
- Attempt 1: retry failed (Step failed after 3 attempts: No executable UI action matched intent: "On shipping address screen click "next button" to reach payment and billing info page".)
- Attempt 2: Root error: Step failed after 3 attempts: No executable UI action matched intent: "On shipping address screen click "next button" to reach payment and billing info page".
- Attempt 1: Root error: Step failed after 3 attempts: No executable UI action matched intent: "On payment page choose customer's default address as billing address".
- Attempt 1: Strategy 4 failed: base URL recovery navigation failed.
- Attempt 2: Root error: Step failed after 3 attempts: No executable UI action matched intent: "On payment page choose customer's default address as billing address".
- Attempt 2: retry failed (Step failed after 3 attempts: No executable UI action matched intent: "On payment page choose customer's default address as billing address".)

## AI Assumptions
- Execution assertions rely on generated BDD scenario intent and detected capabilities.
- Fallback test data may be used for missing non-sensitive fields where configured.
- Sensitive/destructive operations are skipped unless safe test mode is explicitly enabled.
- Browser/device matrix reflects configured run values: Chrome / Desktop.

## Screenshots
- scenario-1: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780150862607\screenshots\scenario-1-Desktop-landing.png
- scenario-2: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780150862607\screenshots\scenario-2-Desktop-landing.png
- scenario-3: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780150862607\screenshots\scenario-3-Desktop-landing.png
- scenario-4: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780150862607\screenshots\scenario-4-Desktop-landing.png
- scenario-5: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780150862607\screenshots\scenario-5-Desktop-failure.png
- scenario-6: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780150862607\screenshots\scenario-6-Desktop-failure.png
- scenario-7: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780150862607\screenshots\scenario-7-Desktop-failure.png
- scenario-8: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780150862607\screenshots\scenario-8-Desktop-failure.png
- scenario-9: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780150862607\screenshots\scenario-9-Desktop-failure.png
- scenario-10: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780150862607\screenshots\scenario-10-Desktop-failure.png
- scenario-11: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780150862607\screenshots\scenario-11-Desktop-failure.png
- scenario-12: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780150862607\screenshots\scenario-12-Desktop-failure.png

## Technical Logs
- scenario-1 (passed) :: error=none, console=6, network=14
- scenario-2 (passed) :: error=none, console=6, network=13
- scenario-3 (passed) :: error=none, console=6, network=14
- scenario-4 (passed) :: error=none, console=4, network=6
- scenario-5 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "Open first product from the results"., console=15, network=37
- scenario-6 (failed) :: error=No actionable intent extracted for custom command scenario "Execute command 6: Wait for all the items to be visible on the page"., console=15, network=39
- scenario-7 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "Click "buy once" checkbox for the first sku"., console=15, network=38
- scenario-8 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "Select Quantity from Qty dropdown"., console=16, network=39
- scenario-9 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "Click Add to Cart"., console=15, network=39
- scenario-10 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "Move to cart and click "proceed to checkout" to reach shipping address screen"., console=16, network=39
- scenario-11 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "On shipping address screen click "next button" to reach payment and billing info page"., console=16, network=39
- scenario-12 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "On payment page choose customer's default address as billing address"., console=15, network=41
