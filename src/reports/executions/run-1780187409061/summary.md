# DennyQA vNext Test Report

## Executive Summary
- Run ID: run-1780187409061
- URL: https://ecommerce.folio3.com/
- Test type: Full Regression
- Browser: Chrome
- Device(s): Desktop
- Environment: development
- Total cases: 7
- Passed: 3
- Failed: 4
- Skipped: 0
- Bugs found: 9
- Confidence score: 90%

## Root Cause Analysis
- Contact Form: Site console error detected: intlTelInput is not loaded.: Site console error detected: intlTelInput is not loaded. Console: intlTelInput is not loaded.
- Forms: Site console error detected: intlTelInput is not loaded.: Site console error detected: intlTelInput is not loaded. Console: intlTelInput is not loaded.
- Responsive: Responsive issues detected on 7/7 viewports.: Responsive issues detected on 7/7 viewports. Console: intlTelInput is not loaded. Network: [FAILED] https://ecommerce.folio3.com/cdn-cgi/rum? :: net::ERR_ABORTED
- Accessibility: 14 high-severity accessibility risk finding(s) detected across sample...: 14 high-severity accessibility risk finding(s) detected across sampled templates. Console: intlTelInput is not loaded. Network: [FAILED] https://ecommerce.folio3.com/cdn-cgi/rum? :: net::ERR_ABORTED Network: [FAILED] https://ecommerce.folio3.com/cdn-cgi/rum? :: net::ERR_ABORTED
- Accessibility risk: missing-alt-text: 1 image(s) appear to be missing alt text.
- Accessibility risk: missing-form-labels: 15 form control(s) appear unlabeled.
- Accessibility risk: focus-visibility: Focus outline visibility may be insufficient on interactive elements.
- Responsive layout issues across multiple viewports: Potential layout breakage detected. One or more CTAs appear hidden. Potential layout breakage detected.
- Console defect: intlTelInput is not loaded.: intlTelInput is not loaded.

## Recovery Attempts
- Static suite validation for "Contact Form" using discovered pages.
- Static suite validation for "Forms" using discovered pages.
- Static suite validation for "Responsive" using discovered pages.
- Static suite validation for "Accessibility" using discovered pages.
- Post-run analysis completed after scenario execution.

## AI Assumptions
- Execution assertions rely on generated BDD scenario intent and detected capabilities.
- Fallback test data may be used for missing non-sensitive fields where configured.
- Sensitive/destructive operations are skipped unless safe test mode is explicitly enabled.
- Browser/device matrix reflects configured run values: Chrome / Desktop.

## Screenshots
- scenario-1: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780187409061\screenshots\scenario-1-Desktop-landing.png
- scenario-2: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780187409061\screenshots\scenario-2-Desktop-landing.png
- scenario-3: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780187409061\screenshots\scenario-3-Desktop-landing.png
- scenario-4: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780187409061\screenshots\scenario-4-Desktop-landing.png
- scenario-5: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780187409061\screenshots\scenario-5-Desktop-landing.png
- scenario-6: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780187409061\screenshots\scenario-6-Desktop-landing.png
- scenario-7: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780187409061\screenshots\scenario-7-Desktop-landing.png

## Technical Logs
- scenario-1 (failed) :: error=Site console error detected: intlTelInput is not loaded., console=1, network=0
- scenario-2 (failed) :: error=Site console error detected: intlTelInput is not loaded., console=1, network=0
- scenario-3 (passed) :: error=none, console=1, network=0
- scenario-4 (failed) :: error=Responsive issues detected on 7/7 viewports., console=1, network=1
- scenario-5 (failed) :: error=14 high-severity accessibility risk finding(s) detected across sampled templates., console=2, network=12
- scenario-6 (passed) :: error=none, console=1, network=1
- scenario-7 (passed) :: error=none, console=1, network=7
