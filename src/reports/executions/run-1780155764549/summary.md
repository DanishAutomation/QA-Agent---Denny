# DennyQA vNext Test Report

## Executive Summary
- Run ID: run-1780155764549
- URL: https://uat2.purelifedental.com
- Test type: Custom Command Automation
- Browser: Chrome
- Device(s): Desktop
- Environment: development
- Total cases: 16
- Passed: 10
- Failed: 6
- Skipped: 0
- Bugs found: 6
- Confidence score: 99%

## Root Cause Analysis
- Custom Command issue: Execute command 5: Wait for Login and then click Search bar: Investigation found: Iframe detected; target action may be inside nested browsing context.; Modal/dialog present; interactions may be blocked.; Overlay detected; click targets may be obscured.; Disabled controls present; prerequisite steps may be missing.; Validation/error messages detected on page.. This likely contributed to the failure.
- Custom Command issue: Execute command 12: Move to cart and click "proceed to checkout" to reach shipping address screen: Investigation found: Iframe detected; target action may be inside nested browsing context.; Modal/dialog present; interactions may be blocked.; Overlay detected; click targets may be obscured.; Disabled controls present; prerequisite steps may be missing.; Validation/error messages detected on page.. This likely contributed to the failure.
- Custom Command issue: Execute command 13: On shipping address screen click "next button" to reach payment and billing info page: Investigation found: Iframe detected; target action may be inside nested browsing context.; Modal/dialog present; interactions may be blocked.; Overlay detected; click targets may be obscured.; Disabled controls present; prerequisite steps may be missing.; Validation/error messages detected on page.. This likely contributed to the failure.
- Custom Command issue: Execute command 14: On payment page choose customer's default address as billing address: Investigation found: Iframe detected; target action may be inside nested browsing context.; Modal/dialog present; interactions may be blocked.; Overlay detected; click targets may be obscured.; Disabled controls present; prerequisite steps may be missing.; Validation/error messages detected on page.. This likely contributed to the failure.
- Custom Command issue: Execute command 15: Enter Card Details:: Investigation found: Modal/dialog present; interactions may be blocked.; Overlay detected; click targets may be obscured.; Disabled controls present; prerequisite steps may be missing.. This likely contributed to the failure.
- Custom Command issue: Execute command 16: Place Order: Investigation found: Modal/dialog present; interactions may be blocked.; Overlay detected; click targets may be obscured.; Disabled controls present; prerequisite steps may be missing.; Iframe detected; target action may be inside nested browsing context.. This likely contributed to the failure.

## Recovery Attempts
- Wait completed; executing follow-up action(s).
- Detected action: login
- Already authenticated; login command treated as no-op.
- Detected action: openSearch
- Filled required visible text field with safe test value.
- Attempt 1: Root error: Step failed after 3 attempts: No executable UI action matched intent: "click Search bar".
- Attempt 1: Strategy 1: synchronized to domcontentloaded state.
- Attempt 1: Strategy 2: no blocking overlays detected.
- Attempt 1: Strategy 3: reloaded page successfully.
- Attempt 1: Strategy 4 skipped: base URL recovery disabled for session continuity.
- Attempt 1: retry failed (Step failed after 3 attempts: Loop protection triggered: repeated identical action "login" exceeded threshold.)
- Attempt 2: Root error: Step failed after 3 attempts: No executable UI action matched intent: "click Search bar".
- Attempt 2: Strategy 1: synchronized to domcontentloaded state.
- Attempt 2: Strategy 2: no blocking overlays detected.
- Attempt 2: Strategy 3: reloaded page successfully.
- Attempt 2: Strategy 4 skipped: base URL recovery disabled for session continuity.
- Attempt 2: retry failed (Loop protection triggered: repeated navigation pattern on https://uat2.purelifedental.com/customer/account/index/?is_logged_in=1.)
- Detected action: moveToCart
- Resolved action using css: a[href*='/checkout/cart']
- Detected action: clickCheckoutNext
- Clicked checkout Next/Continue button.
- Context validation failed: expected checkout/cart flow page, got "https://uat2.purelifedental.com/product/prophyflex-cleaning-powder.html?sku=powder".
- Filled checkout field (name) from parsed/fallback data.
- Quantity prepared via label-qty.
- Resolved action using css: a[href*='checkout/cart']
- Set quantity to safe default 1.
- Attempt 1: Root error: Step failed after 3 attempts: No executable UI action matched intent: ""proceed to checkout" to reach shipping address screen".
- Attempt 1: retry failed (Step failed after 3 attempts: Loop protection triggered: maximum step action threshold exceeded.)
- Attempt 2: Root error: Step failed after 3 attempts: No executable UI action matched intent: ""proceed to checkout" to reach shipping address screen".
- Attempt 2: retry failed (Step failed after 3 attempts: Loop protection triggered: maximum step action threshold exceeded.)
- Filled payment field (card) from custom instruction data.
- Attempt 1: Root error: Step failed after 3 attempts: No executable UI action matched intent: "On shipping address screen click "next button" to reach payment and billing info page".
- Attempt 1: retry failed (Step failed after 3 attempts: No executable UI action matched intent: "On shipping address screen click "next button" to reach payment and billing info page".)
- Attempt 2: Root error: Step failed after 3 attempts: No executable UI action matched intent: "On shipping address screen click "next button" to reach payment and billing info page".
- Detected action: selectBillingAddress
- Attempt 1: Root error: Step failed after 3 attempts: No executable UI action matched intent: "On payment page choose customer's default address as billing address".
- Attempt 1: retry failed (Step failed after 3 attempts: No executable UI action matched intent: "On payment page choose customer's default address as billing address".)
- Attempt 2: Root error: Step failed after 3 attempts: No executable UI action matched intent: "On payment page choose customer's default address as billing address".
- Detected action: fillPayment
- Attempt 1: Root error: Step failed after 3 attempts: No executable UI action matched intent: "Enter Card Details:".
- Attempt 1: retry failed (Step failed after 3 attempts: No executable UI action matched intent: "Enter Card Details:".)
- Attempt 2: Root error: Step failed after 3 attempts: No executable UI action matched intent: "Enter Card Details:".
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
- scenario-1: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780155764549\screenshots\scenario-1-Desktop-landing.png
- scenario-2: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780155764549\screenshots\scenario-2-Desktop-landing.png
- scenario-3: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780155764549\screenshots\scenario-3-Desktop-landing.png
- scenario-4: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780155764549\screenshots\scenario-4-Desktop-landing.png
- scenario-5: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780155764549\screenshots\scenario-5-Desktop-failure.png
- scenario-6: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780155764549\screenshots\scenario-6-Desktop-landing.png
- scenario-7: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780155764549\screenshots\scenario-7-Desktop-landing.png
- scenario-8: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780155764549\screenshots\scenario-8-Desktop-landing.png
- scenario-9: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780155764549\screenshots\scenario-9-Desktop-landing.png
- scenario-10: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780155764549\screenshots\scenario-10-Desktop-landing.png
- scenario-11: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780155764549\screenshots\scenario-11-Desktop-landing.png
- scenario-12: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780155764549\screenshots\scenario-12-Desktop-failure.png
- scenario-13: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780155764549\screenshots\scenario-13-Desktop-failure.png
- scenario-14: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780155764549\screenshots\scenario-14-Desktop-failure.png
- scenario-15: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780155764549\screenshots\scenario-15-Desktop-failure.png
- scenario-16: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780155764549\screenshots\scenario-16-Desktop-failure.png

## Technical Logs
- scenario-1 (passed) :: error=none, console=118, network=180
- scenario-2 (passed) :: error=none, console=109, network=132
- scenario-3 (passed) :: error=none, console=106, network=125
- scenario-4 (passed) :: error=none, console=103, network=118
- scenario-5 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "click Search bar"., console=100, network=108
- scenario-6 (passed) :: error=none, console=94, network=93
- scenario-7 (passed) :: error=none, console=91, network=85
- scenario-8 (passed) :: error=none, console=87, network=78
- scenario-9 (passed) :: error=none, console=87, network=78
- scenario-10 (passed) :: error=none, console=87, network=78
- scenario-11 (passed) :: error=none, console=87, network=78
- scenario-12 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: ""proceed to checkout" to reach shipping address screen"., console=87, network=76
- scenario-13 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "On shipping address screen click "next button" to reach payment and billing info page"., console=66, network=48
- scenario-14 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "On payment page choose customer's default address as billing address"., console=60, network=33
- scenario-15 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "Enter Card Details:"., console=35, network=23
- scenario-16 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "Place Order"., console=19, network=16
