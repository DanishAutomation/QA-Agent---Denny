# DennyQA vNext Test Report

## Executive Summary
- Run ID: run-1780193258771
- URL: https://uat2.purelifedental.com/
- Test type: Full Regression
- Browser: Chrome
- Device(s): Desktop
- Environment: development
- Total cases: 28
- Passed: 17
- Failed: 11
- Skipped: 0
- Bugs found: 8
- Confidence score: 95%

## Root Cause Analysis
- Authentication: Step failed after 3 attempts: Loop protection triggered: URL revisite...: Step failed after 3 attempts: Loop protection triggered: URL revisited too often (https://uat2.purelifedental.com/product/prophyflex-cleaning-powder.html). Network: [404] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js Network: [FAILED] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js :: net::ERR_ABORTED Iframe detected; target action may be inside nested browsing context. Modal/dialog present; interactions may be blocked.
- PDP: Step failed after 3 attempts: Loop protection triggered: URL revisite...: Step failed after 3 attempts: Loop protection triggered: URL revisited too often (https://uat2.purelifedental.com/product/prophyflex-cleaning-powder.html?sku=powder). Network: [404] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js Network: [FAILED] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js :: net::ERR_ABORTED Iframe detected; target action may be inside nested browsing context. Modal/dialog present; interactions may be blocked.
- Cart: Step failed after 3 attempts: Loop protection triggered: URL revisite...: Step failed after 3 attempts: Loop protection triggered: URL revisited too often (https://uat2.purelifedental.com/product/prophyflex-cleaning-powder.html?sku=powder). Network: [404] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js Network: [FAILED] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js :: net::ERR_ABORTED Iframe detected; target action may be inside nested browsing context. Modal/dialog present; interactions may be blocked.
- Checkout: Step failed after 3 attempts: Loop protection triggered: URL revisite...: Step failed after 3 attempts: Loop protection triggered: URL revisited too often (https://uat2.purelifedental.com/product/prophyflex-cleaning-powder.html?sku=powder). Network: [404] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js Network: [FAILED] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js :: net::ERR_ABORTED Iframe detected; target action may be inside nested browsing context. Modal/dialog present; interactions may be blocked.
- Checkout: Step failed after 3 attempts: No executable UI action matched intent:...: Step failed after 3 attempts: No executable UI action matched intent: "Search for 'powder"". Network: [FAILED] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/Magento_Checkout/template/sidebar.html :: net::ERR_ABORTED Network: [FAILED] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/Magento_Checkout/template/authentication.html :: net::ERR_ABORTED Modal/dialog present; interactions may be blocked. Overlay detected; click targets may be obscured.
- Accessibility risk: missing-alt-text: 22 image(s) appear to be missing alt text.
- Accessibility risk: missing-form-labels: 34 form control(s) appear unlabeled.
- Accessibility risk: focus-visibility: Focus outline visibility may be insufficient on interactive elements.

## Recovery Attempts
- Applied 9 memory-backed regression step(s) for "Guest Checkout flow works as expected".
- Skipped redundant login — authenticated session reused.
- Detected action: search
- Search submitted with query "powder".
- Resolved action using search-input: input[type='search']
- Detected action: openProduct
- Resolved action using product-listing: a[href*='/product/']
- Detected action: buyOnce
- Buy once option not available on this product; skipped.
- Detected action: selectQuantity
- Quantity set to 1 via input-fill.
- Quantity set to 1 on product page.
- Resolved action using input-fill: pdp input[type='number']
- Detected action: addToCart
- Added product to cart from PDP.
- Resolved action using pdp-add-to-cart: #product-addtocart-button
- Attempt 1: Root error: Step failed after 3 attempts: Loop protection triggered: URL revisited too often (https://uat2.purelifedental.com/product/prophyflex-cleaning-powder.html).
- Attempt 1: Strategy 1: synchronized to domcontentloaded state.
- Attempt 1: Strategy 2: no blocking overlays detected.
- Attempt 1: Strategy 3: reloaded page successfully.
- Attempt 1: Strategy 4: navigated back to base URL and stabilized network.
- Attempt 1: retry failed (Step failed after 3 attempts: Loop protection triggered: maximum step action threshold exceeded.)
- Attempt 2: Root error: Step failed after 3 attempts: Loop protection triggered: URL revisited too often (https://uat2.purelifedental.com/product/prophyflex-cleaning-powder.html).
- Attempt 2: Strategy 1: synchronized to domcontentloaded state.
- Attempt 2: Strategy 2: no blocking overlays detected.
- Attempt 2: Strategy 3: reloaded page successfully.
- Attempt 2: Strategy 4: navigated back to base URL and stabilized network.
- Attempt 2: retry failed (Step failed after 3 attempts: Loop protection triggered: maximum step action threshold exceeded.)
- Applied 6 memory-backed regression step(s) for "Add to cart behavior on product detail page".
- Resolved action using product-listing: .product-item-link
- Attempt 1: Root error: Step failed after 3 attempts: Loop protection triggered: URL revisited too often (https://uat2.purelifedental.com/product/prophyflex-cleaning-powder.html?sku=powder).
- Attempt 2: Root error: Step failed after 3 attempts: Loop protection triggered: URL revisited too often (https://uat2.purelifedental.com/product/prophyflex-cleaning-powder.html?sku=powder).
- Applied 6 memory-backed regression step(s) for "Add item works from cart workflow".
- Applied 9 memory-backed regression step(s) for "Address step validates correctly".
- Attempt 2: Strategy 4 failed: base URL recovery navigation failed.
- Applied 9 memory-backed regression step(s) for "Shipping step validates correctly".
- Attempt 1: Root error: Step failed after 3 attempts: No executable UI action matched intent: "Search for 'powder"".
- Attempt 1: Strategy 3 skipped: reload avoided on checkout flow to preserve session.
- Attempt 2: Root error: Step failed after 3 attempts: No executable UI action matched intent: "Search for 'powder"".
- Post-run analysis completed after scenario execution.

## AI Assumptions
- Execution assertions rely on generated BDD scenario intent and detected capabilities.
- Fallback test data may be used for missing non-sensitive fields where configured.
- Sensitive/destructive operations are skipped unless safe test mode is explicitly enabled.
- Browser/device matrix reflects configured run values: Chrome / Desktop.

## Screenshots
- scenario-5: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780193258771\screenshots\scenario-5-step-1-product-listing-behavior-is-corr-product-prophyflex-cleaning-powder-html-Desktop-landing.png
- scenario-6: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780193258771\screenshots\scenario-6-step-1-search-behavior-is-correct-catalogsearch-result-Desktop-landing.png
- scenario-7: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780193258771\screenshots\scenario-7-step-1-categories-behavior-is-correct-catalogsearch-result-Desktop-landing.png
- scenario-8: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780193258771\screenshots\scenario-8-step-1-filters-behavior-is-correct-catalogsearch-result-Desktop-landing.png
- scenario-9: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780193258771\screenshots\scenario-9-step-1-sorting-behavior-is-correct-catalogsearch-result-Desktop-landing.png
- scenario-10: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780193258771\screenshots\scenario-10-step-1-pagination-behavior-is-correct-catalogsearch-result-Desktop-landing.png
- scenario-11: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780193258771\screenshots\scenario-11-step-1-add-to-cart-behavior-on-product--product-encore-af-core-buildup-composite-Desktop-failure.png
- scenario-12: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780193258771\screenshots\scenario-12-step-1-color-behavior-on-product-detail-product-encore-af-core-buildup-composite-Desktop-landing.png
- scenario-13: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780193258771\screenshots\scenario-13-step-1-inventory-behavior-on-product-de-product-encore-af-core-buildup-composite-Desktop-landing.png
- scenario-14: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780193258771\screenshots\scenario-14-step-1-product-image-behavior-on-produc-product-encore-af-core-buildup-composite-Desktop-landing.png
- scenario-15: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780193258771\screenshots\scenario-15-step-1-quantity-behavior-on-product-det-product-encore-af-core-buildup-composite-Desktop-landing.png
- scenario-16: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780193258771\screenshots\scenario-16-step-1-size-behavior-on-product-detail--product-encore-af-core-buildup-composite-Desktop-landing.png
- scenario-17: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780193258771\screenshots\scenario-17-step-1-variants-behavior-on-product-det-product-encore-af-core-buildup-composite-Desktop-landing.png
- scenario-18: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780193258771\screenshots\scenario-18-step-1-add-item-works-from-cart-workflo-checkout-cart-Desktop-failure.png
- scenario-19: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780193258771\screenshots\scenario-19-step-1-coupon-if-available-works-from-c-checkout-cart-Desktop-failure.png
- scenario-20: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780193258771\screenshots\scenario-20-step-1-remove-item-works-from-cart-work-checkout-cart-Desktop-failure.png
- scenario-21: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780193258771\screenshots\scenario-21-step-1-update-quantity-works-from-cart--checkout-cart-Desktop-failure.png
- scenario-22: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780193258771\screenshots\scenario-22-step-1-address-step-validates-correctly-checkout-Desktop-failure.png
- scenario-23: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780193258771\screenshots\scenario-23-step-1-shipping-step-validates-correctl-checkout-Desktop-failure.png
- scenario-24: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780193258771\screenshots\scenario-24-step-1-billing-step-validates-correctly-checkout-Desktop-failure.png
- scenario-25: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780193258771\screenshots\scenario-25-step-1-payment-step-validates-correctly-checkout-Desktop-failure.png
- scenario-26: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780193258771\screenshots\scenario-26-step-1-review-step-validates-correctly-checkout-Desktop-failure.png
- scenario-27: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780193258771\screenshots\scenario-27-step-1-orders-section-behaves-as-expect-customer-account-order-history-Desktop-landing.png
- scenario-28: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780193258771\screenshots\scenario-28-step-1-profile-section-behaves-as-expec-customer-account-Desktop-landing.png

## Technical Logs
- scenario-1 (passed) :: error=none, console=1, network=15
- scenario-2 (passed) :: error=none, console=1, network=5
- scenario-3 (passed) :: error=none, console=1, network=5
- scenario-4 (failed) :: error=Step failed after 3 attempts: Loop protection triggered: URL revisited too often (https://uat2.purelifedental.com/product/prophyflex-cleaning-powder.html)., console=2, network=42
- scenario-5 (passed) :: error=none, console=2, network=11
- scenario-6 (passed) :: error=none, console=1, network=6
- scenario-7 (passed) :: error=none, console=1, network=6
- scenario-8 (passed) :: error=none, console=1, network=7
- scenario-9 (passed) :: error=none, console=1, network=6
- scenario-10 (passed) :: error=none, console=1, network=6
- scenario-11 (failed) :: error=Step failed after 3 attempts: Loop protection triggered: URL revisited too often (https://uat2.purelifedental.com/product/prophyflex-cleaning-powder.html?sku=powder)., console=2, network=44
- scenario-12 (passed) :: error=none, console=2, network=11
- scenario-13 (passed) :: error=none, console=2, network=5
- scenario-14 (passed) :: error=none, console=2, network=5
- scenario-15 (passed) :: error=none, console=2, network=5
- scenario-16 (passed) :: error=none, console=2, network=5
- scenario-17 (passed) :: error=none, console=2, network=5
- scenario-18 (failed) :: error=Step failed after 3 attempts: Loop protection triggered: URL revisited too often (https://uat2.purelifedental.com/product/prophyflex-cleaning-powder.html?sku=powder)., console=2, network=44
- scenario-19 (failed) :: error=Step failed after 3 attempts: Loop protection triggered: URL revisited too often (https://uat2.purelifedental.com/product/prophyflex-cleaning-powder.html?sku=powder)., console=2, network=44
- scenario-20 (failed) :: error=Step failed after 3 attempts: Loop protection triggered: URL revisited too often (https://uat2.purelifedental.com/product/prophyflex-cleaning-powder.html?sku=powder)., console=2, network=46
- scenario-21 (failed) :: error=Step failed after 3 attempts: Loop protection triggered: URL revisited too often (https://uat2.purelifedental.com/product/prophyflex-cleaning-powder.html?sku=powder)., console=2, network=44
- scenario-22 (failed) :: error=Step failed after 3 attempts: Loop protection triggered: URL revisited too often (https://uat2.purelifedental.com/product/prophyflex-cleaning-powder.html?sku=powder)., console=2, network=44
- scenario-23 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "Search for 'powder""., console=1, network=37
- scenario-24 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "Search for 'powder""., console=1, network=32
- scenario-25 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "Search for 'powder""., console=1, network=33
- scenario-26 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "Search for 'powder""., console=1, network=33
- scenario-27 (passed) :: error=none, console=1, network=6
- scenario-28 (passed) :: error=none, console=1, network=5
