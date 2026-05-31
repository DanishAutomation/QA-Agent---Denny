# DennyQA vNext Test Report

## Executive Summary
- Run ID: run-1780239927789
- URL: https://uat2.purelifedental.com/
- Test type: Full Regression
- Browser: Chrome
- Device(s): Desktop
- Environment: development
- Total cases: 19
- Passed: 11
- Failed: 7
- Skipped: 1
- Bugs found: 5
- Confidence score: 98%

## Root Cause Analysis
- Catalog: Filter scenario completed without applying a catalog filter.: Filter scenario completed without applying a catalog filter. Network: [404] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js Network: [FAILED] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js :: net::ERR_ABORTED Iframe detected; target action may be inside nested browsing context. Modal/dialog present; interactions may be blocked.
- Catalog: Step failed after 3 attempts: Step timed out after 20 seconds: Go to ...: Step failed after 3 attempts: Step timed out after 20 seconds: Go to page 2 of product listing if pagination exists Network: [404] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js Network: [FAILED] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js :: net::ERR_ABORTED
- PDP: Step failed after 3 attempts: No executable UI action matched intent:...: Step failed after 3 attempts: No executable UI action matched intent: "Select Quantity from Qty dropdown". Network: [404] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js Network: [FAILED] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js :: net::ERR_ABORTED Iframe detected; target action may be inside nested browsing context. Modal/dialog present; interactions may be blocked.
- Cart: Step failed after 3 attempts: No executable UI action matched intent:...: Step failed after 3 attempts: No executable UI action matched intent: "Remove item from cart". Network: [404] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js Network: [FAILED] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js :: net::ERR_ABORTED Iframe detected; target action may be inside nested browsing context. Modal/dialog present; interactions may be blocked.
- Checkout: Step failed after 3 attempts: No executable UI action matched intent:...: Step failed after 3 attempts: No executable UI action matched intent: "Ensure cart has items for checkout". Network: [404] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js Network: [FAILED] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js :: net::ERR_ABORTED Modal/dialog present; interactions may be blocked. Overlay detected; click targets may be obscured.

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
- Applied 2 memory-backed regression step(s) for "Pagination behavior is correct".
- Scenario timed out: Step failed after 3 attempts: Step timed out after 20 seconds: Go to page 2 of product listing if pagination exists
- Applied 6 memory-backed regression step(s) for "Add to cart behavior on product detail page".
- Skipped redundant login — authenticated session reused.
- Detected action: search
- Search submitted with query "powder".
- Resolved action using search-input: input[type='search']
- Detected action: openProduct
- Resolved action using product-listing-same-origin: .product-item-link
- Detected action: buyOnce
- Buy once option not available on this product; skipped.
- Detected action: selectQuantity
- No PDP quantity field found.
- Attempt 1: Root error: Step failed after 3 attempts: No executable UI action matched intent: "Select Quantity from Qty dropdown".
- Attempt 1: retry failed (Step failed after 3 attempts: Loop protection triggered: maximum step action threshold exceeded.)
- Attempt 2: Root error: Step failed after 3 attempts: No executable UI action matched intent: "Select Quantity from Qty dropdown".
- Attempt 2: Strategy 3 failed: page reload did not stabilize.
- Attempt 2: retry failed (Step failed after 3 attempts: Loop protection triggered: maximum step action threshold exceeded.)
- Applied 3 memory-backed regression step(s) for "Remove item works from cart workflow".
- Detected action: moveToCart
- Detected action: ensureSecondCartLine
- Cart line items after second-item attempt: 2 (cart-already-has-multiple-lines).
- Detected action: removeCartItem
- Cart removal: before=2 after=0 secondItemAdded=no modal=no.
- Removal emptied the entire cart instead of deleting one line item.
- Cart removal: before=0 after=0 secondItemAdded=no modal=no.
- Cart line items after second-item attempt: unknown (cart-empty-cannot-add-second).
- Attempt 1: Root error: Step failed after 3 attempts: No executable UI action matched intent: "Remove item from cart".
- Attempt 1: Strategy 3 skipped: reload avoided on checkout flow to preserve session.
- Attempt 2: Root error: Step failed after 3 attempts: No executable UI action matched intent: "Remove item from cart".
- Attempt 2: Strategy 3 skipped: reload avoided on checkout flow to preserve session.
- Applied 4 memory-backed regression step(s) for "Address step validates correctly".
- Detected action: restoreCart
- Checkout blocked because cart is empty and product could not be restored.
- Quantity set to 1 via input-fill.
- Attempt 1: Root error: Step failed after 3 attempts: No executable UI action matched intent: "Ensure cart has items for checkout".
- Attempt 2: Root error: Step failed after 3 attempts: No executable UI action matched intent: "Ensure cart has items for checkout".

## AI Assumptions
- Execution assertions rely on generated BDD scenario intent and detected capabilities.
- Fallback test data may be used for missing non-sensitive fields where configured.
- Sensitive/destructive operations are skipped unless safe test mode is explicitly enabled.
- Browser/device matrix reflects configured run values: Chrome / Desktop.

## Screenshots
- scenario-1: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780239927789\screenshots\scenario-1-step-1-execute-command-1-login-customer-account-Desktop-landing.png
- scenario-4: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780239927789\screenshots\scenario-4-step-1-product-listing-behavior-is-corr-product-ventyv-flamingo-nitrile-powder-f-Desktop-landing.png
- scenario-5: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780239927789\screenshots\scenario-5-step-1-search-behavior-is-correct-catalogsearch-result-Desktop-landing.png
- scenario-6: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780239927789\screenshots\scenario-6-step-1-categories-behavior-is-correct-gloves-html-Desktop-landing.png
- scenario-7: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780239927789\screenshots\scenario-7-step-1-filters-behavior-is-correct-gloves-html-Desktop-failure.png
- scenario-8: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780239927789\screenshots\scenario-8-step-1-pagination-behavior-is-correct-gloves-html-Desktop-failure.png
- scenario-9: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780239927789\screenshots\scenario-9-step-1-add-to-cart-behavior-on-product--product-encore-af-core-buildup-composite-Desktop-failure.png
- scenario-10: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780239927789\screenshots\scenario-10-step-1-child-sku-selection-behavior-on--product-prophyflex-cleaning-powder-html-Desktop-landing.png
- scenario-11: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780239927789\screenshots\scenario-11-step-1-inventory-behavior-on-product-de-product-encore-af-core-buildup-composite-Desktop-landing.png
- scenario-12: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780239927789\screenshots\scenario-12-step-1-product-image-behavior-on-produc-product-encore-af-core-buildup-composite-Desktop-landing.png
- scenario-13: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780239927789\screenshots\scenario-13-step-1-quantity-behavior-on-product-det-product-encore-af-core-buildup-composite-Desktop-landing.png
- scenario-14: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780239927789\screenshots\scenario-14-step-1-add-item-works-from-cart-workflo-checkout-cart-Desktop-landing.png
- scenario-15: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780239927789\screenshots\scenario-15-step-1-coupon-if-available-works-from-c-checkout-cart-Desktop-landing.png
- scenario-16: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780239927789\screenshots\scenario-16-step-1-remove-item-works-from-cart-work-checkout-cart-Desktop-failure.png
- scenario-17: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780239927789\screenshots\scenario-17-step-1-update-quantity-works-from-cart--checkout-cart-Desktop-failure.png

## Technical Logs
- scenario-1 (passed) :: error=none, console=1, network=21
- scenario-2 (skipped) :: error=Skipped — authenticated session already established., console=0, network=0
- scenario-3 (passed) :: error=none, console=1, network=4
- scenario-4 (passed) :: error=none, console=2, network=10
- scenario-5 (passed) :: error=none, console=1, network=6
- scenario-6 (passed) :: error=none, console=1, network=5
- scenario-7 (failed) :: error=Filter scenario completed without applying a catalog filter., console=1, network=37
- scenario-8 (failed) :: error=Step failed after 3 attempts: Step timed out after 20 seconds: Go to page 2 of product listing if pagination exists, console=1, network=5
- scenario-9 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "Select Quantity from Qty dropdown"., console=2, network=39
- scenario-10 (passed) :: error=none, console=2, network=13
- scenario-11 (passed) :: error=none, console=2, network=4
- scenario-12 (passed) :: error=none, console=2, network=5
- scenario-13 (passed) :: error=none, console=2, network=5
- scenario-14 (passed) :: error=none, console=2, network=17
- scenario-15 (passed) :: error=none, console=0, network=1
- scenario-16 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "Remove item from cart"., console=1, network=5
- scenario-17 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "Update quantity in cart to 2"., console=0, network=0
- scenario-18 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "Ensure cart has items for checkout"., console=2, network=118
- scenario-19 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "Ensure cart has items for checkout"., console=2, network=103
