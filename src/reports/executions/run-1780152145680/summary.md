# DennyQA vNext Test Report

## Executive Summary
- Run ID: run-1780152145680
- URL: https://uat2.purelifedental.com
- Test type: Custom Command Automation
- Browser: Chrome
- Device(s): Desktop
- Environment: development
- Total cases: 12
- Passed: 9
- Failed: 3
- Skipped: 0
- Bugs found: 3
- Confidence score: 99%

## Root Cause Analysis
- Custom Command issue: Execute command 8: Select Quantity from Qty dropdown: Primary likely cause is backend/API instability reflected by network failures.
- Custom Command issue: Execute command 10: Move to cart and click "proceed to checkout" to reach shipping address screen: Primary likely cause is backend/API instability reflected by network failures.
- Custom Command issue: Execute command 11: On shipping address screen click "next button" to reach payment and billing info page: Primary likely cause is backend/API instability reflected by network failures.

## Recovery Attempts
- Detected action: selectQuantity
- Attempt 1: Root error: locator.fill: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('input[name*=\'qty\' i], input[name*=\'quantity\' i], input[id*=\'qty\' i], input[id*=\'quantity\' i]').first()
    - locator resolved to <input value="" type="hidden" id="cart_quantity_discount_enabled"/>
    - fill("1")
  - attempting fill action
    2 × waiting for element to be visible, enabled and editable
      - element is not visible
    - retrying fill action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and editable
      - element is not visible
    - retrying fill action
      - waiting 100ms
    58 × waiting for element to be visible, enabled and editable
       - element is not visible
     - retrying fill action
       - waiting 500ms

- Attempt 1: Strategy 1: synchronized to domcontentloaded state.
- Attempt 1: Strategy 2: no blocking overlays detected.
- Attempt 1: Strategy 3: reloaded page successfully.
- Attempt 1: Strategy 4 skipped: base URL recovery disabled for session continuity.
- Attempt 1: retry failed (locator.fill: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('input[name*=\'qty\' i], input[name*=\'quantity\' i], input[id*=\'qty\' i], input[id*=\'quantity\' i]').first()
    - locator resolved to <input value="" type="hidden" id="cart_quantity_discount_enabled"/>
    - fill("1")
  - attempting fill action
    2 × waiting for element to be visible, enabled and editable
      - element is not visible
    - retrying fill action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and editable
      - element is not visible
    - retrying fill action
      - waiting 100ms
    58 × waiting for element to be visible, enabled and editable
       - element is not visible
     - retrying fill action
       - waiting 500ms
)
- Attempt 2: Root error: locator.fill: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('input[name*=\'qty\' i], input[name*=\'quantity\' i], input[id*=\'qty\' i], input[id*=\'quantity\' i]').first()
    - locator resolved to <input value="" type="hidden" id="cart_quantity_discount_enabled"/>
    - fill("1")
  - attempting fill action
    2 × waiting for element to be visible, enabled and editable
      - element is not visible
    - retrying fill action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and editable
      - element is not visible
    - retrying fill action
      - waiting 100ms
    58 × waiting for element to be visible, enabled and editable
       - element is not visible
     - retrying fill action
       - waiting 500ms

- Attempt 2: Strategy 1: synchronized to domcontentloaded state.
- Attempt 2: Strategy 2: no blocking overlays detected.
- Attempt 2: Strategy 3: reloaded page successfully.
- Attempt 2: Strategy 4 skipped: base URL recovery disabled for session continuity.
- Attempt 2: retry failed (locator.fill: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('input[name*=\'qty\' i], input[name*=\'quantity\' i], input[id*=\'qty\' i], input[id*=\'quantity\' i]').first()
    - locator resolved to <input value="" type="hidden" id="cart_quantity_discount_enabled"/>
    - fill("1")
  - attempting fill action
    2 × waiting for element to be visible, enabled and editable
      - element is not visible
    - retrying fill action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and editable
      - element is not visible
    - retrying fill action
      - waiting 100ms
    58 × waiting for element to be visible, enabled and editable
       - element is not visible
     - retrying fill action
       - waiting 500ms
)
- Detected action: moveToCart
- Detected action: checkout

## AI Assumptions
- Execution assertions rely on generated BDD scenario intent and detected capabilities.
- Fallback test data may be used for missing non-sensitive fields where configured.
- Sensitive/destructive operations are skipped unless safe test mode is explicitly enabled.
- Browser/device matrix reflects configured run values: Chrome / Desktop.

## Screenshots
- scenario-1: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780152145680\screenshots\scenario-1-Desktop-landing.png
- scenario-2: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780152145680\screenshots\scenario-2-Desktop-landing.png
- scenario-3: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780152145680\screenshots\scenario-3-Desktop-landing.png
- scenario-4: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780152145680\screenshots\scenario-4-Desktop-landing.png
- scenario-5: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780152145680\screenshots\scenario-5-Desktop-landing.png
- scenario-6: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780152145680\screenshots\scenario-6-Desktop-landing.png
- scenario-7: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780152145680\screenshots\scenario-7-Desktop-landing.png
- scenario-8: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780152145680\screenshots\scenario-8-Desktop-failure.png
- scenario-9: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780152145680\screenshots\scenario-9-Desktop-landing.png
- scenario-10: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780152145680\screenshots\scenario-10-Desktop-failure.png
- scenario-11: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780152145680\screenshots\scenario-11-Desktop-failure.png
- scenario-12: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780152145680\screenshots\scenario-12-Desktop-landing.png

## Technical Logs
- scenario-1 (passed) :: error=none, console=35, network=62
- scenario-2 (passed) :: error=none, console=32, network=56
- scenario-3 (passed) :: error=none, console=32, network=56
- scenario-4 (passed) :: error=none, console=32, network=56
- scenario-5 (passed) :: error=none, console=32, network=56
- scenario-6 (passed) :: error=none, console=28, network=49
- scenario-7 (passed) :: error=none, console=28, network=49
- scenario-8 (failed) :: error=locator.fill: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('input[name*=\'qty\' i], input[name*=\'quantity\' i], input[id*=\'qty\' i], input[id*=\'quantity\' i]').first()
    - locator resolved to <input value="" type="hidden" id="cart_quantity_discount_enabled"/>
    - fill("1")
  - attempting fill action
    2 × waiting for element to be visible, enabled and editable
      - element is not visible
    - retrying fill action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and editable
      - element is not visible
    - retrying fill action
      - waiting 100ms
    58 × waiting for element to be visible, enabled and editable
       - element is not visible
     - retrying fill action
       - waiting 500ms
, console=28, network=49
- scenario-9 (passed) :: error=none, console=19, network=32
- scenario-10 (failed) :: error=locator.fill: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('input[name*=\'qty\' i], input[name*=\'quantity\' i], input[id*=\'qty\' i], input[id*=\'quantity\' i]').first()
    - locator resolved to <input value="" type="hidden" id="cart_quantity_discount_enabled"/>
    - fill("1")
  - attempting fill action
    2 × waiting for element to be visible, enabled and editable
      - element is not visible
    - retrying fill action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and editable
      - element is not visible
    - retrying fill action
      - waiting 100ms
    58 × waiting for element to be visible, enabled and editable
       - element is not visible
     - retrying fill action
       - waiting 500ms
, console=19, network=30
- scenario-11 (failed) :: error=locator.fill: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('input[name*=\'qty\' i], input[name*=\'quantity\' i], input[id*=\'qty\' i], input[id*=\'quantity\' i]').first()
    - locator resolved to <input value="" type="hidden" id="cart_quantity_discount_enabled"/>
    - fill("1")
  - attempting fill action
    2 × waiting for element to be visible, enabled and editable
      - element is not visible
    - retrying fill action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and editable
      - element is not visible
    - retrying fill action
      - waiting 100ms
    58 × waiting for element to be visible, enabled and editable
       - element is not visible
     - retrying fill action
       - waiting 500ms
, console=10, network=15
- scenario-12 (passed) :: error=none, console=1, network=0
