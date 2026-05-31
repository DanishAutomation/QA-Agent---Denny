# DennyQA vNext Test Report

## Executive Summary
- Run ID: run-1780235591276
- URL: https://uat2.purelifedental.com/
- Test type: Full Regression
- Browser: Chrome
- Device(s): Desktop
- Environment: development
- Total cases: 23
- Passed: 15
- Failed: 8
- Skipped: 0
- Bugs found: 7
- Confidence score: 93%

## Root Cause Analysis
- Catalog: Filter scenario completed without applying a catalog filter.: Filter scenario completed without applying a catalog filter. Network: [404] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js Network: [FAILED] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js :: net::ERR_ABORTED Iframe detected; target action may be inside nested browsing context. Modal/dialog present; interactions may be blocked.
- Cart: Cart scenario passed on an empty cart page.: Cart scenario passed on an empty cart page. Network: [404] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js Network: [FAILED] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js :: net::ERR_ABORTED Iframe detected; target action may be inside nested browsing context. Modal/dialog present; interactions may be blocked.
- Cart: Step failed after 3 attempts: No executable UI action matched intent:...: Step failed after 3 attempts: No executable UI action matched intent: "Update quantity in cart to 2". Iframe detected; target action may be inside nested browsing context. Modal/dialog present; interactions may be blocked.
- Checkout: Step failed after 3 attempts: No executable UI action matched intent:...: Step failed after 3 attempts: No executable UI action matched intent: "Move to cart and click "proceed to checkout" to reach shipping address screen". Network: [404] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js Network: [FAILED] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js :: net::ERR_ABORTED Iframe detected; target action may be inside nested browsing context. Modal/dialog present; interactions may be blocked.
- Accessibility risk: missing-alt-text: 21 image(s) appear to be missing alt text.
- Accessibility risk: missing-form-labels: 34 form control(s) appear unlabeled.
- Accessibility risk: focus-visibility: Focus outline visibility may be insufficient on interactive elements.

## Recovery Attempts
- Applied 2 memory-backed regression step(s) for "Filters behavior is correct".
- Detected action: navigateUrl
- Navigated to https://uat2.purelifedental.com/gloves.html.
- Resolved action using memory-url: https://uat2.purelifedental.com/gloves.html
- Detected action: applyCatalogFilter
- Applied first available catalog filter.
- Resolved action using catalog-filter-click: catalog filter link
- Attempt 1: Root error: Filter scenario completed without applying a catalog filter.
- Attempt 1: Strategy 1: synchronized to domcontentloaded state.
- Attempt 1: Strategy 2: no blocking overlays detected.
- Attempt 1: Strategy 3: reloaded page successfully.
- Attempt 1: Strategy 4 skipped: base URL recovery disabled for session continuity.
- Attempt 1: retry failed (Filter scenario completed without applying a catalog filter.)
- Attempt 2: Root error: Filter scenario completed without applying a catalog filter.
- Attempt 2: Strategy 1: synchronized to domcontentloaded state.
- Attempt 2: Strategy 2: no blocking overlays detected.
- Attempt 2: Strategy 3: reloaded page successfully.
- Attempt 2: Strategy 4 skipped: base URL recovery disabled for session continuity.
- Attempt 2: retry failed (Filter scenario completed without applying a catalog filter.)
- Applied 2 memory-backed regression step(s) for "Remove item works from cart workflow".
- Detected action: moveToCart
- Detected action: removeCartItem
- Remove action completed on cart.
- Resolved action using no-confirm-modal: .cart.item .action.action-delete
- Attempt 1: Root error: Cart scenario passed on an empty cart page.
- Attempt 1: Strategy 3 skipped: reload avoided on checkout flow to preserve session.
- Attempt 1: retry failed (Step failed after 3 attempts: No executable UI action matched intent: "Remove item from cart".)
- Attempt 2: Root error: Cart scenario passed on an empty cart page.
- Attempt 2: Strategy 3 skipped: reload avoided on checkout flow to preserve session.
- Attempt 2: retry failed (Step failed after 3 attempts: Loop protection triggered: maximum step action threshold exceeded.)
- Applied 2 memory-backed regression step(s) for "Update quantity works from cart workflow".
- Detected action: updateCartQuantity
- Not on product detail page; skipped PDP preparation.
- Attempt 1: Root error: Step failed after 3 attempts: No executable UI action matched intent: "Update quantity in cart to 2".
- Attempt 1: retry failed (Step failed after 3 attempts: Loop protection triggered: maximum step action threshold exceeded.)
- Attempt 2: Root error: Step failed after 3 attempts: No executable UI action matched intent: "Update quantity in cart to 2".
- Applied 3 memory-backed regression step(s) for "Address step validates correctly".
- Detected action: proceedToCheckout
- Attempt 1: Root error: Step failed after 3 attempts: No executable UI action matched intent: "Move to cart and click "proceed to checkout" to reach shipping address screen".
- Attempt 2: Root error: Step failed after 3 attempts: No executable UI action matched intent: "Move to cart and click "proceed to checkout" to reach shipping address screen".
- Post-run analysis completed after scenario execution.

## AI Assumptions
- Execution assertions rely on generated BDD scenario intent and detected capabilities.
- Fallback test data may be used for missing non-sensitive fields where configured.
- Sensitive/destructive operations are skipped unless safe test mode is explicitly enabled.
- Browser/device matrix reflects configured run values: Chrome / Desktop.

## Screenshots
- scenario-3: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780235591276\screenshots\scenario-3-step-1-product-listing-behavior-is-corr-product-ventyv-flamingo-nitrile-powder-f-Desktop-landing.png
- scenario-4: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780235591276\screenshots\scenario-4-step-1-search-behavior-is-correct-catalogsearch-result-Desktop-landing.png
- scenario-5: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780235591276\screenshots\scenario-5-step-1-categories-behavior-is-correct-gloves-html-Desktop-landing.png
- scenario-6: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780235591276\screenshots\scenario-6-step-1-filters-behavior-is-correct-gloves-html-Desktop-failure.png
- scenario-7: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780235591276\screenshots\scenario-7-step-1-pagination-behavior-is-correct-gloves-html-Desktop-landing.png
- scenario-8: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780235591276\screenshots\scenario-8-step-1-add-to-cart-behavior-on-product--product-prophyflex-cleaning-powder-html-Desktop-landing.png
- scenario-9: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780235591276\screenshots\scenario-9-step-1-child-sku-selection-behavior-on--product-prophyflex-cleaning-powder-html-Desktop-landing.png
- scenario-10: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780235591276\screenshots\scenario-10-step-1-inventory-behavior-on-product-de-product-encore-af-core-buildup-composite-Desktop-landing.png
- scenario-11: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780235591276\screenshots\scenario-11-step-1-product-image-behavior-on-produc-product-encore-af-core-buildup-composite-Desktop-landing.png
- scenario-12: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780235591276\screenshots\scenario-12-step-1-quantity-behavior-on-product-det-product-encore-af-core-buildup-composite-Desktop-landing.png
- scenario-13: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780235591276\screenshots\scenario-13-step-1-add-item-works-from-cart-workflo-checkout-cart-Desktop-landing.png
- scenario-14: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780235591276\screenshots\scenario-14-step-1-coupon-if-available-works-from-c-checkout-cart-Desktop-landing.png
- scenario-15: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780235591276\screenshots\scenario-15-step-1-remove-item-works-from-cart-work-checkout-cart-Desktop-failure.png
- scenario-16: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780235591276\screenshots\scenario-16-step-1-update-quantity-works-from-cart--checkout-cart-Desktop-failure.png
- scenario-22: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780235591276\screenshots\scenario-22-step-1-orders-section-behaves-as-expect-customer-account-order-history-Desktop-landing.png
- scenario-23: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780235591276\screenshots\scenario-23-step-1-profile-section-behaves-as-expec-customer-account-Desktop-landing.png

## Technical Logs
- scenario-1 (passed) :: error=none, console=1, network=44
- scenario-2 (passed) :: error=none, console=1, network=4
- scenario-3 (passed) :: error=none, console=2, network=10
- scenario-4 (passed) :: error=none, console=1, network=6
- scenario-5 (passed) :: error=none, console=1, network=6
- scenario-6 (failed) :: error=Filter scenario completed without applying a catalog filter., console=1, network=33
- scenario-7 (passed) :: error=none, console=1, network=9
- scenario-8 (passed) :: error=none, console=2, network=13
- scenario-9 (passed) :: error=none, console=2, network=11
- scenario-10 (passed) :: error=none, console=2, network=4
- scenario-11 (passed) :: error=none, console=2, network=5
- scenario-12 (passed) :: error=none, console=2, network=6
- scenario-13 (passed) :: error=none, console=1, network=4
- scenario-14 (passed) :: error=none, console=0, network=1
- scenario-15 (failed) :: error=Cart scenario passed on an empty cart page., console=1, network=6
- scenario-16 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "Update quantity in cart to 2"., console=0, network=0
- scenario-17 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "Move to cart and click "proceed to checkout" to reach shipping address screen"., console=1, network=4
- scenario-18 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "Move to cart and click "proceed to checkout" to reach shipping address screen"., console=1, network=4
- scenario-19 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "Move to cart and click "proceed to checkout" to reach shipping address screen"., console=1, network=6
- scenario-20 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "Move to cart and click "proceed to checkout" to reach shipping address screen"., console=1, network=5
- scenario-21 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "Move to cart and click "proceed to checkout" to reach shipping address screen"., console=1, network=6
- scenario-22 (passed) :: error=none, console=1, network=7
- scenario-23 (passed) :: error=none, console=1, network=5
