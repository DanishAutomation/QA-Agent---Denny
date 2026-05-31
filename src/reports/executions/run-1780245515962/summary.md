# DennyQA vNext Test Report

## Executive Summary
- Run ID: run-1780245515962
- URL: https://ecommerce.folio3.com/
- Test type: Broken Links
- Browser: Chrome
- Device(s): Desktop
- Environment: development
- Total cases: 7
- Passed: 5
- Failed: 2
- Skipped: 0
- Bugs found: 4
- Confidence score: 88%

## Root Cause Analysis
- Contact Form: Site console error detected: intlTelInput is not loaded.: Site console error detected: intlTelInput is not loaded. Console: intlTelInput is not loaded.
- Forms: Site console error detected: intlTelInput is not loaded.: Site console error detected: intlTelInput is not loaded. Console: intlTelInput is not loaded.
- other form submission not confirmed: Submission was attempted but success could not be confirmed.
- Console defect: intlTelInput is not loaded.: intlTelInput is not loaded.

## Recovery Attempts
- Static suite validation for "Contact Form" using discovered pages.
- Static suite validation for "Forms" using discovered pages.
- Post-run analysis completed after scenario execution.

## AI Assumptions
- Execution assertions rely on generated BDD scenario intent and detected capabilities.
- Fallback test data may be used for missing non-sensitive fields where configured.
- Sensitive/destructive operations are skipped unless safe test mode is explicitly enabled.
- Browser/device matrix reflects configured run values: Chrome / Desktop.

## Screenshots
- scenario-1: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780245515962\screenshots\scenario-1-step-1-contact-form-can-be-submitted-wi--Desktop-landing.png
- scenario-2: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780245515962\screenshots\scenario-2-step-1-discovered-forms-validate-requir--Desktop-landing.png
- scenario-3: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780245515962\screenshots\scenario-3-step-1-site-links-return-healthy-http-r--Desktop-landing.png
- scenario-4: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780245515962\screenshots\scenario-4-step-1-responsive-layout-remains-stable--Desktop-landing.png
- scenario-5: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780245515962\screenshots\scenario-5-step-1-accessibility-risk-checks-run-on--Desktop-landing.png
- scenario-6: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780245515962\screenshots\scenario-6-step-1-primary-navigation-routes-resolv--Desktop-landing.png
- scenario-7: C:\Users\mdanish\Desktop\qa-agent-playwright\src\reports\executions\run-1780245515962\screenshots\scenario-7-step-1-static-informational-pages-load---Desktop-landing.png

## Technical Logs
- scenario-1 (failed) :: error=Site console error detected: intlTelInput is not loaded., console=1, network=0
- scenario-2 (failed) :: error=Site console error detected: intlTelInput is not loaded., console=1, network=0
- scenario-3 (passed) :: error=none, console=1, network=0
- scenario-4 (passed) :: error=none, console=1, network=0
- scenario-5 (passed) :: error=none, console=1, network=0
- scenario-6 (passed) :: error=none, console=1, network=0
- scenario-7 (passed) :: error=none, console=1, network=0
