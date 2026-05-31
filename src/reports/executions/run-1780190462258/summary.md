# DennyQA vNext Test Report

## Executive Summary
- Run ID: run-1780190462258
- URL: https://uat2.purelifedental.com/
- Test type: Full Regression
- Browser: Chrome
- Device(s): Desktop
- Environment: development
- Total cases: 13
- Passed: 10
- Failed: 3
- Skipped: 0
- Bugs found: 6
- Confidence score: 94%

## Root Cause Analysis
- Custom Command: No actionable intent extracted for custom command scenario "Execute c...: No actionable intent extracted for custom command scenario "Execute command 2: mdanish+1@folio3.com". Network: [404] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js Network: [FAILED] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js :: net::ERR_ABORTED
- Authentication: Step failed after 3 attempts: Loop protection triggered: repeated log...: Step failed after 3 attempts: Loop protection triggered: repeated login attempts exceeded threshold. Network: [404] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js Network: [FAILED] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js :: net::ERR_ABORTED Iframe detected; target action may be inside nested browsing context. Modal/dialog present; interactions may be blocked.
- Authentication: Step failed after 3 attempts: No executable UI action matched intent:...: Step failed after 3 attempts: No executable UI action matched intent: "user attempts guest checkout flow". Network: [404] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js Network: [FAILED] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js :: net::ERR_ABORTED Iframe detected; target action may be inside nested browsing context. Modal/dialog present; interactions may be blocked.
- Accessibility risk: missing-alt-text: 22 image(s) appear to be missing alt text.
- Accessibility risk: missing-form-labels: 32 form control(s) appear unlabeled.
- Accessibility risk: focus-visibility: Focus outline visibility may be insufficient on interactive elements.

## Recovery Attempts
- Attempt 1: Root error: No actionable intent extracted for custom command scenario "Execute command 2: mdanish+1@folio3.com".
- Attempt 1: Strategy 1: synchronized to domcontentloaded state.
- Attempt 1: Strategy 2: no blocking overlays detected.
- Attempt 1: Strategy 3: reloaded page successfully.
- Attempt 1: Strategy 4: navigated back to base URL and stabilized network.
- Attempt 1: retry failed (No actionable intent extracted for custom command scenario "Execute command 2: mdanish+1@folio3.com".)
- Attempt 2: Root error: No actionable intent extracted for custom command scenario "Execute command 2: mdanish+1@folio3.com".
- Attempt 2: Strategy 1: synchronized to domcontentloaded state.
- Attempt 2: Strategy 2: no blocking overlays detected.
- Attempt 2: Strategy 3: reloaded page successfully.
- Attempt 2: Strategy 4: navigated back to base URL and stabilized network.
- Attempt 2: retry failed (No actionable intent extracted for custom command scenario "Execute command 2: mdanish+1@folio3.com".)
- Detected action: login
- Opened login form via role
- Login field fill: email=false password=false
- Re-opened login form via role
- Attempt 1: Root error: Step failed after 3 attempts: Loop protection triggered: repeated login attempts exceeded threshold.
- Attempt 1: retry failed (Step failed after 3 attempts: Loop protection triggered: repeated identical action "login" exceeded threshold.)
- Attempt 2: Root error: Step failed after 3 attempts: Loop protection triggered: repeated login attempts exceeded threshold.
- Attempt 2: retry failed (Step failed after 3 attempts: Loop protection triggered: maximum step action threshold exceeded.)
- Detected action: checkout
- Attempt 1: Root error: Step failed after 3 attempts: No executable UI action matched intent: "user attempts guest checkout flow".
- Attempt 1: Strategy 4 failed: base URL recovery navigation failed.
- Attempt 2: Root error: Step failed after 3 attempts: No executable UI action matched intent: "user attempts guest checkout flow".
- Attempt 2: retry failed (Step failed after 3 attempts: No executable UI action matched intent: "user attempts guest checkout flow".)
- Post-run analysis completed after scenario execution.

## AI Assumptions
- Execution assertions rely on generated BDD scenario intent and detected capabilities.
- Fallback test data may be used for missing non-sensitive fields where configured.
- Sensitive/destructive operations are skipped unless safe test mode is explicitly enabled.
- Browser/device matrix reflects configured run values: Chrome / Desktop.

## Screenshots
- scenario-1: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780190462258\screenshots\scenario-1-Desktop-landing.png
- scenario-2: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780190462258\screenshots\scenario-2-Desktop-failure.png
- scenario-3: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780190462258\screenshots\scenario-3-Desktop-failure.png
- scenario-4: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780190462258\screenshots\scenario-4-Desktop-landing.png
- scenario-5: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780190462258\screenshots\scenario-5-Desktop-landing.png
- scenario-6: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780190462258\screenshots\scenario-6-Desktop-failure.png
- scenario-7: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780190462258\screenshots\scenario-7-Desktop-landing.png
- scenario-8: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780190462258\screenshots\scenario-8-Desktop-landing.png
- scenario-9: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780190462258\screenshots\scenario-9-Desktop-landing.png
- scenario-10: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780190462258\screenshots\scenario-10-Desktop-landing.png
- scenario-11: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780190462258\screenshots\scenario-11-Desktop-landing.png
- scenario-12: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780190462258\screenshots\scenario-12-Desktop-landing.png
- scenario-13: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780190462258\screenshots\scenario-13-Desktop-landing.png

## Technical Logs
- scenario-1 (passed) :: error=none, console=1, network=9
- scenario-2 (failed) :: error=No actionable intent extracted for custom command scenario "Execute command 2: mdanish+1@folio3.com"., console=1, network=30
- scenario-3 (failed) :: error=Step failed after 3 attempts: Loop protection triggered: repeated login attempts exceeded threshold., console=1, network=70
- scenario-4 (passed) :: error=none, console=1, network=5
- scenario-5 (passed) :: error=none, console=1, network=5
- scenario-6 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "user attempts guest checkout flow"., console=1, network=31
- scenario-7 (passed) :: error=none, console=1, network=6
- scenario-8 (passed) :: error=none, console=1, network=4
- scenario-9 (passed) :: error=none, console=1, network=5
- scenario-10 (passed) :: error=none, console=2, network=10
- scenario-11 (passed) :: error=none, console=1, network=7
- scenario-12 (passed) :: error=none, console=2, network=10
- scenario-13 (passed) :: error=none, console=2, network=9
