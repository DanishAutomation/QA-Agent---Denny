# DennyQA vNext Test Report

## Executive Summary
- Run ID: run-1780157448076
- URL: https://uat2.purelifedental.com
- Test type: Custom Command Automation
- Browser: Chrome
- Device(s): Desktop
- Environment: development
- Total cases: 17
- Passed: 12
- Failed: 5
- Skipped: 0
- Bugs found: 5
- Confidence score: 99%

## Root Cause Analysis
- Custom Command issue: Execute command 13: On shipping address screen click "next button": Investigation found: Iframe detected; target action may be inside nested browsing context.; Modal/dialog present; interactions may be blocked.; Overlay detected; click targets may be obscured.; Disabled controls present; prerequisite steps may be missing.; Validation/error messages detected on page.. This likely contributed to the failure.
- Custom Command issue: Execute command 14: Close the popup window which is opened after clicking "Next" button to reach payment and billing info page: Investigation found: Modal/dialog present; interactions may be blocked.; Overlay detected; click targets may be obscured.; Disabled controls present; prerequisite steps may be missing.. This likely contributed to the failure.
- Custom Command issue: Execute command 15: On payment page choose customer's default address as billing address: Investigation found: Modal/dialog present; interactions may be blocked.; Overlay detected; click targets may be obscured.; Disabled controls present; prerequisite steps may be missing.. This likely contributed to the failure.
- Custom Command issue: Execute command 16: Enter Card Details:: Investigation found: Modal/dialog present; interactions may be blocked.; Overlay detected; click targets may be obscured.; Disabled controls present; prerequisite steps may be missing.. This likely contributed to the failure.
- Custom Command issue: Execute command 17: Place Order: Investigation found: Modal/dialog present; interactions may be blocked.; Overlay detected; click targets may be obscured.; Disabled controls present; prerequisite steps may be missing.. This likely contributed to the failure.

## Recovery Attempts
- Detected action: clickCheckoutNext
- Checkout Next is not available on cart page; use proceed to checkout instead.
- Shipping address already selected; attempting Next click only.
- Attempt 1: Root error: Step failed after 3 attempts: No executable UI action matched intent: "shipping address screen click next button".
- Attempt 1: Strategy 1: synchronized to domcontentloaded state.
- Attempt 1: Strategy 2: no blocking overlays detected.
- Attempt 1: Strategy 3: reloaded page successfully.
- Attempt 1: Strategy 4 skipped: base URL recovery disabled for session continuity.
- Attempt 1: retry failed (Step failed after 3 attempts: No executable UI action matched intent: "shipping address screen click next button".)
- Attempt 2: Root error: Step failed after 3 attempts: No executable UI action matched intent: "shipping address screen click next button".
- Attempt 2: Strategy 1: synchronized to domcontentloaded state.
- Attempt 2: Strategy 2: no blocking overlays detected.
- Attempt 2: Strategy 3: reloaded page successfully.
- Attempt 2: Strategy 4 skipped: base URL recovery disabled for session continuity.
- Attempt 2: retry failed (Step failed after 3 attempts: Loop protection triggered: maximum step action threshold exceeded.)
- Attempt 1: Root error: Step failed after 3 attempts: No executable UI action matched intent: "Close the popup window which is opened after clicking Next button to reach payment and billing info page".
- Attempt 1: retry failed (Step failed after 3 attempts: No executable UI action matched intent: "Close the popup window which is opened after clicking Next button to reach payment and billing info page".)
- Attempt 2: Root error: Step failed after 3 attempts: No executable UI action matched intent: "Close the popup window which is opened after clicking Next button to reach payment and billing info page".
- Detected action: selectBillingAddress
- Attempt 1: Root error: Step failed after 3 attempts: No executable UI action matched intent: "payment page choose customers default address as billing address".
- Attempt 1: retry failed (Step failed after 3 attempts: No executable UI action matched intent: "payment page choose customers default address as billing address".)
- Attempt 2: Root error: Step failed after 3 attempts: No executable UI action matched intent: "payment page choose customers default address as billing address".
- Detected action: fillPayment
- Payment fields can only be filled on the checkout payment step.
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
- scenario-1: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780157448076\screenshots\scenario-1-Desktop-landing.png
- scenario-2: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780157448076\screenshots\scenario-2-Desktop-landing.png
- scenario-3: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780157448076\screenshots\scenario-3-Desktop-landing.png
- scenario-4: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780157448076\screenshots\scenario-4-Desktop-landing.png
- scenario-5: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780157448076\screenshots\scenario-5-Desktop-landing.png
- scenario-6: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780157448076\screenshots\scenario-6-Desktop-landing.png
- scenario-7: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780157448076\screenshots\scenario-7-Desktop-landing.png
- scenario-8: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780157448076\screenshots\scenario-8-Desktop-landing.png
- scenario-9: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780157448076\screenshots\scenario-9-Desktop-landing.png
- scenario-10: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780157448076\screenshots\scenario-10-Desktop-landing.png
- scenario-11: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780157448076\screenshots\scenario-11-Desktop-landing.png
- scenario-12: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780157448076\screenshots\scenario-12-Desktop-landing.png
- scenario-13: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780157448076\screenshots\scenario-13-Desktop-failure.png
- scenario-14: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780157448076\screenshots\scenario-14-Desktop-failure.png
- scenario-15: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780157448076\screenshots\scenario-15-Desktop-failure.png
- scenario-16: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780157448076\screenshots\scenario-16-Desktop-failure.png
- scenario-17: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780157448076\screenshots\scenario-17-Desktop-failure.png

## Technical Logs
- scenario-1 (passed) :: error=none, console=109, network=127
- scenario-2 (passed) :: error=none, console=100, network=76
- scenario-3 (passed) :: error=none, console=97, network=69
- scenario-4 (passed) :: error=none, console=94, network=61
- scenario-5 (passed) :: error=none, console=91, network=51
- scenario-6 (passed) :: error=none, console=91, network=51
- scenario-7 (passed) :: error=none, console=88, network=44
- scenario-8 (passed) :: error=none, console=84, network=37
- scenario-9 (passed) :: error=none, console=84, network=37
- scenario-10 (passed) :: error=none, console=84, network=37
- scenario-11 (passed) :: error=none, console=84, network=37
- scenario-12 (passed) :: error=none, console=84, network=34
- scenario-13 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "shipping address screen click next button"., console=80, network=25
- scenario-14 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "Close the popup window which is opened after clicking Next button to reach payment and billing info page"., console=64, network=16
- scenario-15 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "payment page choose customers default address as billing address"., console=48, network=12
- scenario-16 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "Enter Card Details:"., console=32, network=8
- scenario-17 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "Place Order"., console=16, network=4
