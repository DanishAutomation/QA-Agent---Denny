# DennyQA vNext Test Report

## Executive Summary
- Run ID: run-1780189222639
- URL: https://uat2.purelifedental.com/
- Test type: Full Regression
- Browser: Chrome
- Device(s): Desktop
- Environment: development
- Total cases: 12
- Passed: 10
- Failed: 2
- Skipped: 0
- Bugs found: 5
- Confidence score: 92%

## Root Cause Analysis
- Authentication: Step failed after 3 attempts: Loop protection triggered: repeated log...: Step failed after 3 attempts: Loop protection triggered: repeated login attempts exceeded threshold. Network: [404] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js Network: [FAILED] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js :: net::ERR_ABORTED Iframe detected; target action may be inside nested browsing context. Modal/dialog present; interactions may be blocked.
- Authentication: Step failed after 3 attempts: No executable UI action matched intent:...: Step failed after 3 attempts: No executable UI action matched intent: "user attempts guest checkout flow". Network: [404] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js Network: [FAILED] https://uat2.purelifedental.com/static/version1778588221/frontend/Folio3/asnan/en_US/mage/ie-class-fixer.min.js :: net::ERR_ABORTED Iframe detected; target action may be inside nested browsing context. Modal/dialog present; interactions may be blocked.
- Accessibility risk: missing-alt-text: 22 image(s) appear to be missing alt text.
- Accessibility risk: missing-form-labels: 34 form control(s) appear unlabeled.
- Accessibility risk: focus-visibility: Focus outline visibility may be insufficient on interactive elements.

## Recovery Attempts
- Detected action: login
- Opened login form via role
- Login field fill: email=false password=false
- Re-opened login form via role
- Attempt 1: Root error: Step failed after 3 attempts: Loop protection triggered: repeated login attempts exceeded threshold.
- Attempt 1: Strategy 1: synchronized to domcontentloaded state.
- Attempt 1: Strategy 2: no blocking overlays detected.
- Attempt 1: Strategy 3: reloaded page successfully.
- Attempt 1: Strategy 4: navigated back to base URL and stabilized network.
- Attempt 1: retry failed (Step failed after 3 attempts: Loop protection triggered: repeated identical action "login" exceeded threshold.)
- Attempt 2: Root error: Step failed after 3 attempts: Loop protection triggered: repeated login attempts exceeded threshold.
- Attempt 2: Strategy 1: synchronized to domcontentloaded state.
- Attempt 2: Strategy 2: no blocking overlays detected.
- Attempt 2: Strategy 3: reloaded page successfully.
- Attempt 2: Strategy 4: navigated back to base URL and stabilized network.
- Attempt 2: retry failed (Step failed after 3 attempts: Loop protection triggered: maximum step action threshold exceeded.)
- Detected action: checkout
- Attempt 1: Root error: Step failed after 3 attempts: No executable UI action matched intent: "user attempts guest checkout flow".
- Attempt 1: retry failed (Step failed after 3 attempts: No executable UI action matched intent: "user attempts guest checkout flow".)
- Attempt 2: Root error: Step failed after 3 attempts: No executable UI action matched intent: "user attempts guest checkout flow".
- Post-run analysis completed after scenario execution.

## AI Assumptions
- Execution assertions rely on generated BDD scenario intent and detected capabilities.
- Fallback test data may be used for missing non-sensitive fields where configured.
- Sensitive/destructive operations are skipped unless safe test mode is explicitly enabled.
- Browser/device matrix reflects configured run values: Chrome / Desktop.

## Screenshots
- scenario-1: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780189222639\screenshots\scenario-1-Desktop-landing.png
- scenario-2: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780189222639\screenshots\scenario-2-Desktop-landing.png
- scenario-3: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780189222639\screenshots\scenario-3-Desktop-landing.png
- scenario-4: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780189222639\screenshots\scenario-4-Desktop-landing.png
- scenario-5: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780189222639\screenshots\scenario-5-Desktop-landing.png
- scenario-6: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780189222639\screenshots\scenario-6-Desktop-landing.png
- scenario-7: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780189222639\screenshots\scenario-7-Desktop-landing.png
- scenario-8: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780189222639\screenshots\scenario-8-Desktop-failure.png
- scenario-9: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780189222639\screenshots\scenario-9-Desktop-landing.png
- scenario-10: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780189222639\screenshots\scenario-10-Desktop-landing.png
- scenario-11: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780189222639\screenshots\scenario-11-Desktop-failure.png
- scenario-12: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780189222639\screenshots\scenario-12-Desktop-landing.png

## Technical Logs
- scenario-1 (passed) :: error=none, console=1, network=4
- scenario-2 (passed) :: error=none, console=1, network=4
- scenario-3 (passed) :: error=none, console=1, network=5
- scenario-4 (passed) :: error=none, console=2, network=10
- scenario-5 (passed) :: error=none, console=1, network=5
- scenario-6 (passed) :: error=none, console=1, network=11
- scenario-7 (passed) :: error=none, console=2, network=9
- scenario-8 (failed) :: error=Step failed after 3 attempts: Loop protection triggered: repeated login attempts exceeded threshold., console=1, network=71
- scenario-9 (passed) :: error=none, console=1, network=5
- scenario-10 (passed) :: error=none, console=1, network=5
- scenario-11 (failed) :: error=Step failed after 3 attempts: No executable UI action matched intent: "user attempts guest checkout flow"., console=1, network=29
- scenario-12 (passed) :: error=none, console=2, network=10
