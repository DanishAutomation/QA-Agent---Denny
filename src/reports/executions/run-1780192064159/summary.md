# DennyQA vNext Test Report

## Executive Summary
- Run ID: run-1780192064159
- URL: https://uat2.purelifedental.com/
- Test type: Full Regression
- Browser: Chrome
- Device(s): Desktop
- Environment: development
- Total cases: 28
- Passed: 26
- Failed: 2
- Skipped: 0
- Bugs found: 5
- Confidence score: 92%

## Root Cause Analysis
- Authentication: Step failed after 3 attempts: No executable UI action matched intent:...: Step failed after 3 attempts: No executable UI action matched intent: "user attempts guest checkout flow". Network: [404] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js Network: [FAILED] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js :: net::ERR_ABORTED Iframe detected; target action may be inside nested browsing context. Modal/dialog present; interactions may be blocked.
- PDP: Step failed after 3 attempts: No executable UI action matched intent:...: Step failed after 3 attempts: No executable UI action matched intent: "user validates add to cart interactions". Network: [404] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js Network: [FAILED] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js :: net::ERR_ABORTED Iframe detected; target action may be inside nested browsing context. Modal/dialog present; interactions may be blocked.
- Accessibility risk: missing-alt-text: 22 image(s) appear to be missing alt text.
- Accessibility risk: missing-form-labels: 32 form control(s) appear unlabeled.
- Accessibility risk: focus-visibility: Focus outline visibility may be insufficient on interactive elements.

## Recovery Attempts
- Detected action: checkout
- Attempt 1: Root error: Step failed after 3 attempts: No executable UI action matched intent: "user attempts guest checkout flow".
- Attempt 1: Strategy 1: synchronized to domcontentloaded state.
- Attempt 1: Strategy 2: no blocking overlays detected.
- Attempt 1: Strategy 3: reloaded page successfully.
- Attempt 1: Strategy 4: navigated back to base URL and stabilized network.
- Attempt 1: retry failed (Step failed after 3 attempts: No executable UI action matched intent: "user attempts guest checkout flow".)
- Attempt 2: Root error: Step failed after 3 attempts: No executable UI action matched intent: "user attempts guest checkout flow".
- Attempt 2: Strategy 1: synchronized to domcontentloaded state.
- Attempt 2: Strategy 2: no blocking overlays detected.
- Attempt 2: Strategy 3: reloaded page successfully.
- Attempt 2: Strategy 4: navigated back to base URL and stabilized network.
- Attempt 2: retry failed (Step failed after 3 attempts: Loop protection triggered: maximum step action threshold exceeded.)
- Detected action: addToCart
- Not on product detail page; skipped PDP preparation.
- Scoped PDP add-to-cart click failed; trying semantic fallback.
- Attempt 1: Root error: Step failed after 3 attempts: No executable UI action matched intent: "user validates add to cart interactions".
- Attempt 1: retry failed (Step failed after 3 attempts: No executable UI action matched intent: "user validates add to cart interactions".)
- Attempt 2: Root error: Step failed after 3 attempts: No executable UI action matched intent: "user validates add to cart interactions".
- Post-run analysis completed after scenario execution.

## AI Assumptions
- Execution assertions rely on generated BDD scenario intent and detected capabilities.
- Fallback test data may be used for missing non-sensitive fields where configured.
- Sensitive/destructive operations are skipped unless safe test mode is explicitly enabled.
- Browser/device matrix reflects configured run values: Chrome / Desktop.

## Screenshots
- scenario-5: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780192064159\screenshots\scenario-5-step-1-product-listing-behavior-is-corr-product-encore-af-core-buildup-composite-Desktop-landing.png
- scenario-6: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780192064159\screenshots\scenario-6-step-1-search-behavior-is-correct-catalogsearch-result-Desktop-landing.png
- scenario-7: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780192064159\screenshots\scenario-7-step-1-categories-behavior-is-correct-catalogsearch-result-Desktop-landing.png
- scenario-8: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780192064159\screenshots\scenario-8-step-1-filters-behavior-is-correct-catalogsearch-result-Desktop-landing.png
- scenario-9: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780192064159\screenshots\scenario-9-step-1-sorting-behavior-is-correct-catalogsearch-result-Desktop-landing.png
- scenario-10: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780192064159\screenshots\scenario-10-step-1-pagination-behavior-is-correct-catalogsearch-result-Desktop-landing.png
- scenario-11: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780192064159\screenshots\scenario-11-step-1-add-to-cart-behavior-on-product--product-encore-af-core-buildup-composite-Desktop-failure.png
- scenario-12: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780192064159\screenshots\scenario-12-step-1-color-behavior-on-product-detail-product-encore-af-core-buildup-composite-Desktop-landing.png
- scenario-13: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780192064159\screenshots\scenario-13-step-1-inventory-behavior-on-product-de-product-encore-af-core-buildup-composite-Desktop-landing.png
- scenario-14: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780192064159\screenshots\scenario-14-step-1-product-image-behavior-on-produc-product-encore-af-core-buildup-composite-Desktop-landing.png
- scenario-15: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780192064159\screenshots\scenario-15-step-1-quantity-behavior-on-product-det-product-encore-af-core-buildup-composite-Desktop-landing.png
- scenario-16: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780192064159\screenshots\scenario-16-step-1-size-behavior-on-product-detail--product-encore-af-core-buildup-composite-Desktop-landing.png
- scenario-17: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780192064159\screenshots\scenario-17-step-1-variants-behavior-on-product-det-product-encore-af-core-buildup-composite-Desktop-landing.png
- scenario-18: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780192064159\screenshots\scenario-18-step-1-add-item-works-from-cart-workflo-checkout-cart-Desktop-landing.png
- scenario-19: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780192064159\screenshots\scenario-19-step-1-coupon-if-available-works-from-c-checkout-cart-Desktop-landing.png
- scenario-20: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780192064159\screenshots\scenario-20-step-1-remove-item-works-from-cart-work-checkout-cart-Desktop-landing.png
- scenario-21: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780192064159\screenshots\scenario-21-step-1-update-quantity-works-from-cart--checkout-cart-Desktop-landing.png
- scenario-22: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780192064159\screenshots\scenario-22-step-1-address-step-validates-correctly-checkout-cart-Desktop-landing.png
- scenario-23: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780192064159\screenshots\scenario-23-step-1-shipping-step-validates-correctl-checkout-cart-Desktop-landing.png
- scenario-24: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780192064159\screenshots\scenario-24-step-1-billing-step-validates-correctly-checkout-cart-Desktop-landing.png
- scenario-25: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780192064159\screenshots\scenario-25-step-1-payment-step-validates-correctly-checkout-cart-Desktop-landing.png
- scenario-26: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780192064159\screenshots\scenario-26-step-1-review-step-validates-correctly-checkout-cart-Desktop-landing.png
- scenario-27: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780192064159\screenshots\scenario-27-step-1-orders-section-behaves-as-expect-customer-account-index-Desktop-landing.png
- scenario-28: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780192064159\screenshots\scenario-28-step-1-profile-section-behaves-as-expec-customer-account-index-Desktop-landing.png

## Technical Logs
- scenario-1 (passed) :: error=none, console=1, network=14
- scenario-2 (passed) :: error=none, console=0, network=0
- scenario-3 (passed) :: error=none, console=0, network=0
- scenario-4 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "user attempts guest checkout flow"., console=1, network=22
- scenario-5 (passed) :: error=none, console=1, network=5
- scenario-6 (passed) :: error=none, console=2, network=6
- scenario-7 (passed) :: error=none, console=0, network=0
- scenario-8 (passed) :: error=none, console=0, network=0
- scenario-9 (passed) :: error=none, console=0, network=0
- scenario-10 (passed) :: error=none, console=0, network=0
- scenario-11 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "user validates add to cart interactions"., console=1, network=32
- scenario-12 (passed) :: error=none, console=1, network=0
- scenario-13 (passed) :: error=none, console=0, network=0
- scenario-14 (passed) :: error=none, console=0, network=0
- scenario-15 (passed) :: error=none, console=0, network=0
- scenario-16 (passed) :: error=none, console=0, network=0
- scenario-17 (passed) :: error=none, console=0, network=0
- scenario-18 (passed) :: error=none, console=1, network=5
- scenario-19 (passed) :: error=none, console=2, network=9
- scenario-20 (passed) :: error=none, console=0, network=0
- scenario-21 (passed) :: error=none, console=0, network=0
- scenario-22 (passed) :: error=none, console=0, network=0
- scenario-23 (passed) :: error=none, console=0, network=0
- scenario-24 (passed) :: error=none, console=0, network=0
- scenario-25 (passed) :: error=none, console=2, network=9
- scenario-26 (passed) :: error=none, console=0, network=0
- scenario-27 (passed) :: error=none, console=2, network=10
- scenario-28 (passed) :: error=none, console=0, network=1
