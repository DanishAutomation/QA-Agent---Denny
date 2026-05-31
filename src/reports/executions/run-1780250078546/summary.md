# DennyQA vNext Test Report

## Executive Summary
- Run ID: run-1780250078546
- URL: https://uat2.purelifedental.com/
- Test type: Full Regression
- Browser: Chrome
- Device(s): Desktop
- Environment: development
- Total cases: 23
- Passed: 23
- Failed: 0
- Skipped: 0
- Bugs found: 4
- Confidence score: 88%

## Root Cause Analysis
- Accessibility risk: missing-alt-text: 21 image(s) appear to be missing alt text.
- Accessibility risk: missing-form-labels: 34 form control(s) appear unlabeled.
- Accessibility risk: focus-visibility: Focus outline visibility may be insufficient on interactive elements.
- Responsive layout issues across multiple viewports: Potential layout breakage detected. One or more CTAs appear hidden. Potential layout breakage detected.

## Recovery Attempts
- Post-run analysis completed after scenario execution.

## AI Assumptions
- Execution assertions rely on generated BDD scenario intent and detected capabilities.
- Fallback test data may be used for missing non-sensitive fields where configured.
- Sensitive/destructive operations are skipped unless safe test mode is explicitly enabled.
- Browser/device matrix reflects configured run values: Chrome / Desktop.

## Screenshots
- scenario-3: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780250078546\screenshots\scenario-3-step-1-product-listing-behavior-is-corr-product-ventyv-flamingo-nitrile-powder-f-Desktop-landing.png
- scenario-4: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780250078546\screenshots\scenario-4-step-1-search-behavior-is-correct-catalogsearch-result-Desktop-landing.png
- scenario-5: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780250078546\screenshots\scenario-5-step-1-categories-behavior-is-correct-gloves-html-Desktop-landing.png
- scenario-6: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780250078546\screenshots\scenario-6-step-1-filters-behavior-is-correct-gloves-html-Desktop-landing.png
- scenario-7: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780250078546\screenshots\scenario-7-step-1-pagination-behavior-is-correct-gloves-html-Desktop-landing.png
- scenario-8: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780250078546\screenshots\scenario-8-step-1-add-to-cart-behavior-on-product--product-prophyflex-cleaning-powder-html-Desktop-landing.png
- scenario-9: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780250078546\screenshots\scenario-9-step-1-child-sku-selection-behavior-on--product-prophyflex-cleaning-powder-html-Desktop-landing.png
- scenario-10: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780250078546\screenshots\scenario-10-step-1-inventory-behavior-on-product-de-product-encore-af-core-buildup-composite-Desktop-landing.png
- scenario-11: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780250078546\screenshots\scenario-11-step-1-product-image-behavior-on-produc-product-encore-af-core-buildup-composite-Desktop-landing.png
- scenario-12: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780250078546\screenshots\scenario-12-step-1-quantity-behavior-on-product-det-product-encore-af-core-buildup-composite-Desktop-landing.png
- scenario-13: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780250078546\screenshots\scenario-13-step-1-add-item-works-from-cart-workflo-checkout-cart-Desktop-landing.png
- scenario-14: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780250078546\screenshots\scenario-14-step-1-coupon-if-available-works-from-c-checkout-cart-Desktop-landing.png
- scenario-15: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780250078546\screenshots\scenario-15-step-1-remove-item-works-from-cart-work-checkout-cart-Desktop-landing.png
- scenario-16: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780250078546\screenshots\scenario-16-step-1-update-quantity-works-from-cart--checkout-cart-Desktop-landing.png
- scenario-17: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780250078546\screenshots\scenario-17-step-1-address-step-validates-correctly-checkout-Desktop-landing.png
- scenario-18: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780250078546\screenshots\scenario-18-step-1-shipping-step-validates-correctl-checkout-Desktop-landing.png
- scenario-19: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780250078546\screenshots\scenario-19-step-1-billing-step-validates-correctly-checkout-Desktop-landing.png
- scenario-20: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780250078546\screenshots\scenario-20-step-1-payment-step-validates-correctly-checkout-Desktop-landing.png
- scenario-22: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780250078546\screenshots\scenario-22-step-1-orders-section-behaves-as-expect-customer-account-order-history-Desktop-landing.png
- scenario-23: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780250078546\screenshots\scenario-23-step-1-profile-section-behaves-as-expec-customer-account-Desktop-landing.png

## Technical Logs
- scenario-1 (passed) :: error=none, console=1, network=20
- scenario-2 (passed) :: error=none, console=1, network=4
- scenario-3 (passed) :: error=none, console=2, network=10
- scenario-4 (passed) :: error=none, console=1, network=7
- scenario-5 (passed) :: error=none, console=1, network=5
- scenario-6 (passed) :: error=none, console=1, network=11
- scenario-7 (passed) :: error=none, console=1, network=9
- scenario-8 (passed) :: error=none, console=2, network=12
- scenario-9 (passed) :: error=none, console=2, network=12
- scenario-10 (passed) :: error=none, console=2, network=4
- scenario-11 (passed) :: error=none, console=2, network=5
- scenario-12 (passed) :: error=none, console=2, network=5
- scenario-13 (passed) :: error=none, console=1, network=5
- scenario-14 (passed) :: error=none, console=0, network=0
- scenario-15 (passed) :: error=none, console=2, network=65
- scenario-16 (passed) :: error=none, console=0, network=0
- scenario-17 (passed) :: error=none, console=1, network=8
- scenario-18 (passed) :: error=none, console=0, network=0
- scenario-19 (passed) :: error=none, console=0, network=0
- scenario-20 (passed) :: error=none, console=1, network=2
- scenario-21 (passed) :: error=none, console=1, network=11
- scenario-22 (passed) :: error=none, console=1, network=7
- scenario-23 (passed) :: error=none, console=1, network=5
