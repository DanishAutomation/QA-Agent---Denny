# DennyQA vNext Test Report

## Executive Summary
- Run ID: run-1780152993955
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
- Custom Command issue: Execute command 9: Click "buy once" checkbox for the first sku: Investigation found: Iframe detected; target action may be inside nested browsing context.; Modal/dialog present; interactions may be blocked.; Overlay detected; click targets may be obscured.; Disabled controls present; prerequisite steps may be missing.; Validation/error messages detected on page.. This likely contributed to the failure.
- Custom Command issue: Execute command 10: Select Quantity from Qty dropdown: Investigation found: Iframe detected; target action may be inside nested browsing context.; Modal/dialog present; interactions may be blocked.; Overlay detected; click targets may be obscured.; Disabled controls present; prerequisite steps may be missing.; Validation/error messages detected on page.. This likely contributed to the failure.
- Custom Command issue: Execute command 13: On shipping address screen click "next button" to reach payment and billing info page: Primary likely cause is backend/API instability reflected by network failures.
- Custom Command issue: Execute command 14: On payment page choose customer's default address as billing address: Primary likely cause is backend/API instability reflected by network failures.
- Custom Command issue: Execute command 15: Enter Card Details:: Primary likely cause is backend/API instability reflected by network failures.
- Custom Command issue: Execute command 16: Place Order: Primary likely cause is backend/API instability reflected by network failures.

## Recovery Attempts
- Detected action: buyOnce
- Filled required text field with safe test value.
- Attempt 1: Root error: Step failed after 3 attempts: No executable UI action matched intent: "Click "buy once" checkbox for the first sku".
- Attempt 1: Strategy 1: synchronized to domcontentloaded state.
- Attempt 1: Strategy 2: no blocking overlays detected.
- Attempt 1: Strategy 3: reloaded page successfully.
- Attempt 1: Strategy 4 skipped: base URL recovery disabled for session continuity.
- Attempt 1: retry failed (Step failed after 3 attempts: No executable UI action matched intent: "Click "buy once" checkbox for the first sku".)
- Attempt 2: Root error: Step failed after 3 attempts: No executable UI action matched intent: "Click "buy once" checkbox for the first sku".
- Attempt 2: Strategy 1: synchronized to domcontentloaded state.
- Attempt 2: Strategy 2: no blocking overlays detected.
- Attempt 2: Strategy 3: reloaded page successfully.
- Attempt 2: Strategy 4 skipped: base URL recovery disabled for session continuity.
- Attempt 2: retry failed (Step failed after 3 attempts: Loop protection triggered: maximum step action threshold exceeded.)
- Detected action: selectQuantity
- Attempt 1: Root error: Step failed after 3 attempts: No executable UI action matched intent: "Select Quantity from Qty dropdown".
- Attempt 1: retry failed (Step failed after 3 attempts: No executable UI action matched intent: "Select Quantity from Qty dropdown".)
- Attempt 2: Root error: Step failed after 3 attempts: No executable UI action matched intent: "Select Quantity from Qty dropdown".
- Attempt 1: Root error: locator.fill: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('input[name*="name" i], input[id*="name" i], input[placeholder*="name" i]').first()
    - locator resolved to <input type="email" name="username" id="login-email" class="input-text" autocomplete="off" data-bind="attr: {autocomplete: autocomplete}" data-validate="{required:true, 'validate-email':true}"/>
    - fill("Denny QA User")
  - attempting fill action
    2 × waiting for element to be visible, enabled and editable
      - element is not visible
    - retrying fill action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and editable
      - element is not visible
    - retrying fill action
      - waiting 100ms
    59 × waiting for element to be visible, enabled and editable
       - element is not visible
     - retrying fill action
       - waiting 500ms

- Attempt 1: retry failed (locator.fill: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('input[name*="name" i], input[id*="name" i], input[placeholder*="name" i]').first()
    - locator resolved to <input type="email" name="username" id="login-email" class="input-text" autocomplete="off" data-bind="attr: {autocomplete: autocomplete}" data-validate="{required:true, 'validate-email':true}"/>
    - fill("Denny QA User")
  - attempting fill action
    2 × waiting for element to be visible, enabled and editable
      - element is not visible
    - retrying fill action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and editable
      - element is not visible
    - retrying fill action
      - waiting 100ms
    59 × waiting for element to be visible, enabled and editable
       - element is not visible
     - retrying fill action
       - waiting 500ms
)
- Attempt 2: Root error: locator.fill: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('input[name*="name" i], input[id*="name" i], input[placeholder*="name" i]').first()
    - locator resolved to <input type="email" name="username" id="login-email" class="input-text" autocomplete="off" data-bind="attr: {autocomplete: autocomplete}" data-validate="{required:true, 'validate-email':true}"/>
    - fill("Denny QA User")
  - attempting fill action
    2 × waiting for element to be visible, enabled and editable
      - element is not visible
    - retrying fill action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and editable
      - element is not visible
    - retrying fill action
      - waiting 100ms
    59 × waiting for element to be visible, enabled and editable
       - element is not visible
     - retrying fill action
       - waiting 500ms

- Attempt 2: retry failed (locator.fill: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('input[name*="name" i], input[id*="name" i], input[placeholder*="name" i]').first()
    - locator resolved to <input type="email" name="username" id="login-email" class="input-text" autocomplete="off" data-bind="attr: {autocomplete: autocomplete}" data-validate="{required:true, 'validate-email':true}"/>
    - fill("Denny QA User")
  - attempting fill action
    2 × waiting for element to be visible, enabled and editable
      - element is not visible
    - retrying fill action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and editable
      - element is not visible
    - retrying fill action
      - waiting 100ms
    59 × waiting for element to be visible, enabled and editable
       - element is not visible
     - retrying fill action
       - waiting 500ms
)
- Detected action: selectBillingAddress
- Detected action: fillPayment
- Attempt 1: Root error: locator.fill: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('input[name*="card" i], input[id*="card" i], input[placeholder*="card" i]').first()
    - locator resolved to <input type="text" class="input-text" id="giftcard-code" name="giftcard_code" placeholder="Enter the gift card code" data-validate="{'required-entry':true}" data-bind="value: giftCartCode, attr:{placeholder: $t('Enter the gift card code')}"/>
    - fill("4111111111111111")
  - attempting fill action
    2 × waiting for element to be visible, enabled and editable
      - element is not visible
    - retrying fill action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and editable
      - element is not visible
    - retrying fill action
      - waiting 100ms
    59 × waiting for element to be visible, enabled and editable
       - element is not visible
     - retrying fill action
       - waiting 500ms

- Attempt 1: retry failed (locator.fill: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('input[name*="card" i], input[id*="card" i], input[placeholder*="card" i]').first()
    - locator resolved to <input type="text" class="input-text" id="giftcard-code" name="giftcard_code" placeholder="Enter the gift card code" data-validate="{'required-entry':true}" data-bind="value: giftCartCode, attr:{placeholder: $t('Enter the gift card code')}"/>
    - fill("4111111111111111")
  - attempting fill action
    2 × waiting for element to be visible, enabled and editable
      - element is not visible
    - retrying fill action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and editable
      - element is not visible
    - retrying fill action
      - waiting 100ms
    59 × waiting for element to be visible, enabled and editable
       - element is not visible
     - retrying fill action
       - waiting 500ms
)
- Attempt 2: Root error: locator.fill: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('input[name*="card" i], input[id*="card" i], input[placeholder*="card" i]').first()
    - locator resolved to <input type="text" class="input-text" id="giftcard-code" name="giftcard_code" placeholder="Enter the gift card code" data-validate="{'required-entry':true}" data-bind="value: giftCartCode, attr:{placeholder: $t('Enter the gift card code')}"/>
    - fill("4111111111111111")
  - attempting fill action
    2 × waiting for element to be visible, enabled and editable
      - element is not visible
    - retrying fill action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and editable
      - element is not visible
    - retrying fill action
      - waiting 100ms
    59 × waiting for element to be visible, enabled and editable
       - element is not visible
     - retrying fill action
       - waiting 500ms

- Attempt 2: retry failed (locator.fill: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('input[name*="card" i], input[id*="card" i], input[placeholder*="card" i]').first()
    - locator resolved to <input type="text" class="input-text" id="giftcard-code" name="giftcard_code" placeholder="Enter the gift card code" data-validate="{'required-entry':true}" data-bind="value: giftCartCode, attr:{placeholder: $t('Enter the gift card code')}"/>
    - fill("4111111111111111")
  - attempting fill action
    2 × waiting for element to be visible, enabled and editable
      - element is not visible
    - retrying fill action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and editable
      - element is not visible
    - retrying fill action
      - waiting 100ms
    59 × waiting for element to be visible, enabled and editable
       - element is not visible
     - retrying fill action
       - waiting 500ms
)
- Attempt 1: Root error: No actionable intent extracted for custom command scenario "Execute command 16: Place Order".
- Attempt 1: retry failed (No actionable intent extracted for custom command scenario "Execute command 16: Place Order".)
- Attempt 2: Root error: No actionable intent extracted for custom command scenario "Execute command 16: Place Order".
- Attempt 2: retry failed (No actionable intent extracted for custom command scenario "Execute command 16: Place Order".)

## AI Assumptions
- Execution assertions rely on generated BDD scenario intent and detected capabilities.
- Fallback test data may be used for missing non-sensitive fields where configured.
- Sensitive/destructive operations are skipped unless safe test mode is explicitly enabled.
- Browser/device matrix reflects configured run values: Chrome / Desktop.

## Screenshots
- scenario-1: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780152993955\screenshots\scenario-1-Desktop-landing.png
- scenario-2: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780152993955\screenshots\scenario-2-Desktop-landing.png
- scenario-3: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780152993955\screenshots\scenario-3-Desktop-landing.png
- scenario-4: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780152993955\screenshots\scenario-4-Desktop-landing.png
- scenario-5: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780152993955\screenshots\scenario-5-Desktop-landing.png
- scenario-6: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780152993955\screenshots\scenario-6-Desktop-landing.png
- scenario-7: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780152993955\screenshots\scenario-7-Desktop-landing.png
- scenario-8: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780152993955\screenshots\scenario-8-Desktop-landing.png
- scenario-9: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780152993955\screenshots\scenario-9-Desktop-failure.png
- scenario-10: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780152993955\screenshots\scenario-10-Desktop-failure.png
- scenario-11: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780152993955\screenshots\scenario-11-Desktop-landing.png
- scenario-12: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780152993955\screenshots\scenario-12-Desktop-landing.png
- scenario-13: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780152993955\screenshots\scenario-13-Desktop-failure.png
- scenario-14: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780152993955\screenshots\scenario-14-Desktop-failure.png
- scenario-15: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780152993955\screenshots\scenario-15-Desktop-failure.png
- scenario-16: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780152993955\screenshots\scenario-16-Desktop-failure.png

## Technical Logs
- scenario-1 (passed) :: error=none, console=110, network=123
- scenario-2 (passed) :: error=none, console=101, network=83
- scenario-3 (passed) :: error=none, console=98, network=76
- scenario-4 (passed) :: error=none, console=95, network=69
- scenario-5 (passed) :: error=none, console=92, network=59
- scenario-6 (passed) :: error=none, console=92, network=59
- scenario-7 (passed) :: error=none, console=92, network=59
- scenario-8 (passed) :: error=none, console=88, network=52
- scenario-9 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "Click "buy once" checkbox for the first sku"., console=88, network=52
- scenario-10 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "Select Quantity from Qty dropdown"., console=80, network=39
- scenario-11 (passed) :: error=none, console=72, network=25
- scenario-12 (passed) :: error=none, console=72, network=23
- scenario-13 (failed) :: error=locator.fill: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('input[name*="name" i], input[id*="name" i], input[placeholder*="name" i]').first()
    - locator resolved to <input type="email" name="username" id="login-email" class="input-text" autocomplete="off" data-bind="attr: {autocomplete: autocomplete}" data-validate="{required:true, 'validate-email':true}"/>
    - fill("Denny QA User")
  - attempting fill action
    2 × waiting for element to be visible, enabled and editable
      - element is not visible
    - retrying fill action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and editable
      - element is not visible
    - retrying fill action
      - waiting 100ms
    59 × waiting for element to be visible, enabled and editable
       - element is not visible
     - retrying fill action
       - waiting 500ms
, console=64, network=18
- scenario-14 (failed) :: error=locator.fill: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('input[name*="name" i], input[id*="name" i], input[placeholder*="name" i]').first()
    - locator resolved to <input type="email" name="username" id="login-email" class="input-text" autocomplete="off" data-bind="attr: {autocomplete: autocomplete}" data-validate="{required:true, 'validate-email':true}"/>
    - fill("Denny QA User")
  - attempting fill action
    2 × waiting for element to be visible, enabled and editable
      - element is not visible
    - retrying fill action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and editable
      - element is not visible
    - retrying fill action
      - waiting 100ms
    59 × waiting for element to be visible, enabled and editable
       - element is not visible
     - retrying fill action
       - waiting 500ms
, console=48, network=14
- scenario-15 (failed) :: error=locator.fill: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('input[name*="card" i], input[id*="card" i], input[placeholder*="card" i]').first()
    - locator resolved to <input type="text" class="input-text" id="giftcard-code" name="giftcard_code" placeholder="Enter the gift card code" data-validate="{'required-entry':true}" data-bind="value: giftCartCode, attr:{placeholder: $t('Enter the gift card code')}"/>
    - fill("4111111111111111")
  - attempting fill action
    2 × waiting for element to be visible, enabled and editable
      - element is not visible
    - retrying fill action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and editable
      - element is not visible
    - retrying fill action
      - waiting 100ms
    59 × waiting for element to be visible, enabled and editable
       - element is not visible
     - retrying fill action
       - waiting 500ms
, console=32, network=10
- scenario-16 (failed) :: error=No actionable intent extracted for custom command scenario "Execute command 16: Place Order"., console=16, network=6
