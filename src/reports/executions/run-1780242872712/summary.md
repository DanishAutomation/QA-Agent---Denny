# DennyQA vNext Test Report

## Executive Summary
- Run ID: run-1780242872712
- URL: https://uat2.purelifedental.com/
- Test type: Full Regression
- Browser: Chrome
- Device(s): Desktop
- Environment: development
- Total cases: 17
- Passed: 12
- Failed: 5
- Skipped: 0
- Bugs found: 5
- Confidence score: 96%

## Root Cause Analysis
- Authentication: Scenario timed out after 90 seconds: Login flow works as expected: Scenario timed out after 90 seconds: Login flow works as expected Network: [404] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js Network: [FAILED] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js :: net::ERR_ABORTED Iframe detected; target action may be inside nested browsing context. Modal/dialog present; interactions may be blocked.
- Catalog: Step failed after 3 attempts: Step timed out after 20 seconds: Go to ...: Step failed after 3 attempts: Step timed out after 20 seconds: Go to page 2 of product listing if pagination exists Network: [404] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js Network: [FAILED] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js :: net::ERR_ABORTED Iframe detected; target action may be inside nested browsing context. Modal/dialog present; interactions may be blocked.
- PDP: Add to cart scenario completed but cart state was not established.: Add to cart scenario completed but cart state was not established. Network: [404] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js Network: [FAILED] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js :: net::ERR_ABORTED Iframe detected; target action may be inside nested browsing context. Modal/dialog present; interactions may be blocked.
- Cart: Step failed after 3 attempts: Step timed out after 20 seconds: Update...: Step failed after 3 attempts: Step timed out after 20 seconds: Update quantity in cart to 2 Network: [404] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js Network: [FAILED] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js :: net::ERR_ABORTED
- Checkout: locator.click: Timeout 10000ms exceeded.
Call log:
  - waiting for lo...: locator.click: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('#shipping-method-buttons-container .action.continue').first()
    - locator resolved to <button type="submit" data-role="opc-continue" class="button action continue primary">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <iframe width="100%" frameborder="0" class="checkout-autoship-iframe" src="https://uat2.purelifedental.com/autoshipconsolidation/autoship/edit/addressid/1658654"></iframe> from <div class="modals-wrapper">…</div> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <iframe width="100%" frameborder="0" class="checkout-autoship-iframe" src="https://uat2.purelifedental.com/autoshipconsolidation/autoship/edit/addressid/1658654"></iframe> from <div class="modals-wrapper">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 100ms
    19 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <iframe width="100%" frameborder="0" class="checkout-autoship-iframe" src="https://uat2.purelifedental.com/autoshipconsolidation/autoship/edit/addressid/1658654"></iframe> from <div class="modals-wrapper">…</div> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
 Network: [FAILED] https://uat2.purelifedental.com/checkout/cart :: net::ERR_ABORTED Network: [404] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js Iframe detected; target action may be inside nested browsing context. Modal/dialog present; interactions may be blocked.

## Recovery Attempts
- Applied 1 memory-backed regression step(s) for "Login flow works as expected".
- Scenario timed out: Scenario timed out after 90 seconds: Login flow works as expected
- Quantity set to 1 via qty-default-one.
- Applied 2 memory-backed regression step(s) for "Pagination behavior is correct".
- Detected action: navigateUrl
- Navigated to https://uat2.purelifedental.com/gloves.html.
- Resolved action using memory-url: https://uat2.purelifedental.com/gloves.html
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
- Quantity set to 1 via input-fill.
- Quantity set to 1 on product page.
- Resolved action using input-fill: pdp input[type='number']
- Detected action: addToCart
- Added product to cart from PDP.
- Resolved action using pdp-add-to-cart: #product-addtocart-button
- Attempt 1: Root error: Add to cart scenario completed but cart state was not established.
- Attempt 1: Strategy 1: synchronized to domcontentloaded state.
- Attempt 1: Strategy 2: no blocking overlays detected.
- Attempt 1: Strategy 3: reloaded page successfully.
- Attempt 1: Strategy 4 skipped: base URL recovery disabled for session continuity.
- Attempt 1: retry failed (Add to cart scenario completed but cart state was not established.)
- Attempt 2: Root error: Add to cart scenario completed but cart state was not established.
- Attempt 2: Strategy 1: synchronized to domcontentloaded state.
- Attempt 2: Strategy 2: no blocking overlays detected.
- Attempt 2: Strategy 3: reloaded page successfully.
- Attempt 2: Strategy 4 skipped: base URL recovery disabled for session continuity.
- Attempt 2: retry failed (Step failed after 3 attempts: Loop protection triggered: maximum step action threshold exceeded.)
- Applied 2 memory-backed regression step(s) for "Update quantity works from cart workflow".
- Detected action: moveToCart
- Scenario timed out: Step failed after 3 attempts: Step timed out after 20 seconds: Update quantity in cart to 2
- Applied 4 memory-backed regression step(s) for "Address step validates correctly".
- Detected action: restoreCart
- Cart restored with at least one line item for downstream checkout.
- Detected action: proceedToCheckout
- Reached checkout shipping step after Proceed to Checkout.
- Shipping address already selected; attempting Next click only.
- Clicked checkout Next/Continue during recovery.
- Attempt 1: Root error: locator.click: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('#shipping-method-buttons-container .action.continue').first()
    - locator resolved to <button type="submit" data-role="opc-continue" class="button action continue primary">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <iframe width="100%" frameborder="0" class="checkout-autoship-iframe" src="https://uat2.purelifedental.com/autoshipconsolidation/autoship/edit/addressid/1658654"></iframe> from <div class="modals-wrapper">…</div> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <iframe width="100%" frameborder="0" class="checkout-autoship-iframe" src="https://uat2.purelifedental.com/autoshipconsolidation/autoship/edit/addressid/1658654"></iframe> from <div class="modals-wrapper">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 100ms
    19 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <iframe width="100%" frameborder="0" class="checkout-autoship-iframe" src="https://uat2.purelifedental.com/autoshipconsolidation/autoship/edit/addressid/1658654"></iframe> from <div class="modals-wrapper">…</div> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms

- Attempt 1: Strategy 3 skipped: reload avoided on checkout flow to preserve session.
- Attempt 1: retry failed (locator.click: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('#shipping-method-buttons-container .action.continue').first()
    - locator resolved to <button type="submit" data-role="opc-continue" class="button action continue primary">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <iframe width="100%" frameborder="0" class="checkout-autoship-iframe" src="https://uat2.purelifedental.com/autoshipconsolidation/autoship/edit/addressid/1658654"></iframe> from <div class="modals-wrapper">…</div> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <iframe width="100%" frameborder="0" class="checkout-autoship-iframe" src="https://uat2.purelifedental.com/autoshipconsolidation/autoship/edit/addressid/1658654"></iframe> from <div class="modals-wrapper">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 100ms
    18 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <iframe width="100%" frameborder="0" class="checkout-autoship-iframe" src="https://uat2.purelifedental.com/autoshipconsolidation/autoship/edit/addressid/1658654"></iframe> from <div class="modals-wrapper">…</div> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <img alt="Loading..." src="https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/images/loader-2.gif"/> from <div data-role="loader" class="loading-mask">…</div> subtree intercepts pointer events
  - retrying click action
    - waiting 500ms
)
- Attempt 2: Root error: locator.click: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('#shipping-method-buttons-container .action.continue').first()
    - locator resolved to <button type="submit" data-role="opc-continue" class="button action continue primary">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <iframe width="100%" frameborder="0" class="checkout-autoship-iframe" src="https://uat2.purelifedental.com/autoshipconsolidation/autoship/edit/addressid/1658654"></iframe> from <div class="modals-wrapper">…</div> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <iframe width="100%" frameborder="0" class="checkout-autoship-iframe" src="https://uat2.purelifedental.com/autoshipconsolidation/autoship/edit/addressid/1658654"></iframe> from <div class="modals-wrapper">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 100ms
    19 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <iframe width="100%" frameborder="0" class="checkout-autoship-iframe" src="https://uat2.purelifedental.com/autoshipconsolidation/autoship/edit/addressid/1658654"></iframe> from <div class="modals-wrapper">…</div> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms

- Attempt 2: Strategy 3 skipped: reload avoided on checkout flow to preserve session.

## AI Assumptions
- Execution assertions rely on generated BDD scenario intent and detected capabilities.
- Fallback test data may be used for missing non-sensitive fields where configured.
- Sensitive/destructive operations are skipped unless safe test mode is explicitly enabled.
- Browser/device matrix reflects configured run values: Chrome / Desktop.

## Screenshots
- scenario-3: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780242872712\screenshots\scenario-3-step-1-product-listing-behavior-is-corr-product-ventyv-flamingo-nitrile-powder-f-Desktop-recovered.png
- scenario-4: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780242872712\screenshots\scenario-4-step-1-search-behavior-is-correct-catalogsearch-result-Desktop-landing.png
- scenario-5: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780242872712\screenshots\scenario-5-step-1-categories-behavior-is-correct-gloves-html-Desktop-landing.png
- scenario-6: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780242872712\screenshots\scenario-6-step-1-filters-behavior-is-correct-gloves-html-Desktop-landing.png
- scenario-7: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780242872712\screenshots\scenario-7-step-1-pagination-behavior-is-correct-gloves-html-Desktop-failure.png
- scenario-8: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780242872712\screenshots\scenario-8-step-1-add-to-cart-behavior-on-product--product-prophyflex-cleaning-powder-html-Desktop-failure.png
- scenario-9: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780242872712\screenshots\scenario-9-step-1-child-sku-selection-behavior-on--product-prophyflex-cleaning-powder-html-Desktop-landing.png
- scenario-10: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780242872712\screenshots\scenario-10-step-1-inventory-behavior-on-product-de-product-encore-af-core-buildup-composite-Desktop-landing.png
- scenario-11: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780242872712\screenshots\scenario-11-step-1-product-image-behavior-on-produc-product-encore-af-core-buildup-composite-Desktop-landing.png
- scenario-12: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780242872712\screenshots\scenario-12-step-1-quantity-behavior-on-product-det-product-encore-af-core-buildup-composite-Desktop-landing.png
- scenario-13: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780242872712\screenshots\scenario-13-step-1-add-item-works-from-cart-workflo-checkout-cart-Desktop-landing.png
- scenario-14: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780242872712\screenshots\scenario-14-step-1-coupon-if-available-works-from-c-checkout-cart-Desktop-landing.png
- scenario-15: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780242872712\screenshots\scenario-15-step-1-remove-item-works-from-cart-work-checkout-cart-Desktop-landing.png
- scenario-17: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780242872712\screenshots\scenario-17-step-1-address-step-validates-correctly-checkout-Desktop-failure.png

## Technical Logs
- scenario-1 (failed) :: error=Scenario timed out after 90 seconds: Login flow works as expected, console=1, network=42
- scenario-2 (passed) :: error=none, console=1, network=11
- scenario-3 (passed) :: error=none, console=2, network=29
- scenario-4 (passed) :: error=none, console=1, network=7
- scenario-5 (passed) :: error=none, console=1, network=5
- scenario-6 (passed) :: error=none, console=1, network=10
- scenario-7 (failed) :: error=Step failed after 3 attempts: Step timed out after 20 seconds: Go to page 2 of product listing if pagination exists, console=1, network=11
- scenario-8 (failed) :: error=Add to cart scenario completed but cart state was not established., console=2, network=34
- scenario-9 (passed) :: error=none, console=2, network=12
- scenario-10 (passed) :: error=none, console=2, network=5
- scenario-11 (passed) :: error=none, console=2, network=5
- scenario-12 (passed) :: error=none, console=2, network=5
- scenario-13 (passed) :: error=none, console=2, network=35
- scenario-14 (passed) :: error=none, console=0, network=0
- scenario-15 (passed) :: error=none, console=1, network=5
- scenario-16 (failed) :: error=Step failed after 3 attempts: Step timed out after 20 seconds: Update quantity in cart to 2, console=2, network=18
- scenario-17 (failed) :: error=locator.click: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('#shipping-method-buttons-container .action.continue').first()
    - locator resolved to <button type="submit" data-role="opc-continue" class="button action continue primary">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <iframe width="100%" frameborder="0" class="checkout-autoship-iframe" src="https://uat2.purelifedental.com/autoshipconsolidation/autoship/edit/addressid/1658654"></iframe> from <div class="modals-wrapper">…</div> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <iframe width="100%" frameborder="0" class="checkout-autoship-iframe" src="https://uat2.purelifedental.com/autoshipconsolidation/autoship/edit/addressid/1658654"></iframe> from <div class="modals-wrapper">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 100ms
    19 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <iframe width="100%" frameborder="0" class="checkout-autoship-iframe" src="https://uat2.purelifedental.com/autoshipconsolidation/autoship/edit/addressid/1658654"></iframe> from <div class="modals-wrapper">…</div> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
, console=1, network=58
