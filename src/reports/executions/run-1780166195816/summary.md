# DennyQA vNext Test Report

## Executive Summary
- Run ID: run-1780166195816
- URL: https://ecommerce@folio3.com
- Test type: Full Regression
- Browser: Chrome
- Device(s): Desktop
- Environment: development
- Total cases: 7
- Passed: 5
- Failed: 2
- Skipped: 0
- Bugs found: 6
- Confidence score: 91%

## Root Cause Analysis
- Responsive issue: Responsive layout remains stable across breakpoints: Primary likely cause is backend/API instability reflected by network failures.
- Accessibility issue: Accessibility risk checks run on key templates: Primary likely cause is backend/API instability reflected by network failures.
- Accessibility risk: missing-alt-text: 173 image(s) appear to be missing alt text.
- Accessibility risk: missing-form-labels: 9 form control(s) appear unlabeled.
- Accessibility risk: focus-visibility: Focus outline visibility may be insufficient on interactive elements.
- Responsive layout issues across multiple viewports: Potential layout breakage detected. Potential layout breakage detected. Potential layout breakage detected.

## Recovery Attempts
- Static suite validation for "Responsive" using discovered pages.
- Static suite validation for "Accessibility" using discovered pages.
- Post-run analysis completed after scenario execution.

## AI Assumptions
- Execution assertions rely on generated BDD scenario intent and detected capabilities.
- Fallback test data may be used for missing non-sensitive fields where configured.
- Sensitive/destructive operations are skipped unless safe test mode is explicitly enabled.
- Browser/device matrix reflects configured run values: Chrome / Desktop.

## Screenshots
- scenario-1: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780166195816\screenshots\scenario-1-Desktop-landing.png
- scenario-2: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780166195816\screenshots\scenario-2-Desktop-landing.png
- scenario-3: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780166195816\screenshots\scenario-3-Desktop-landing.png
- scenario-4: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780166195816\screenshots\scenario-4-Desktop-landing.png
- scenario-5: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780166195816\screenshots\scenario-5-Desktop-landing.png
- scenario-6: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780166195816\screenshots\scenario-6-Desktop-landing.png
- scenario-7: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780166195816\screenshots\scenario-7-Desktop-landing.png

## Technical Logs
- scenario-1 (passed) :: error=none, console=1, network=5
- scenario-2 (passed) :: error=none, console=1, network=5
- scenario-3 (passed) :: error=none, console=1, network=9
- scenario-4 (failed) :: error=Responsive issues detected on 3/6 viewports., console=1, network=10
- scenario-5 (failed) :: error=6 high-severity accessibility risk finding(s) detected across sampled templates., console=1, network=8
- scenario-6 (passed) :: error=none, console=1, network=11
- scenario-7 (passed) :: error=none, console=1, network=5
