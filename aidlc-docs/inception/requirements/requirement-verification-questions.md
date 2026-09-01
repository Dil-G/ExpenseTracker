# Requirements Clarification Questions — Rollover

Your brief is already very detailed. A handful of product decisions and 3 standard AI-DLC extension opt-ins remain. Please answer each by filling the letter after `[Answer]:`.

## Question 1: Daily allowance model ("rollover" behavior)
The app is named Rollover. Should an underspend/overspend on one day change the following days' allowance within the month, or should the daily allowance stay fixed?

A) True rollover — daily allowance = remaining discretionary budget for the category ÷ remaining days in month (recalculated daily; underspending today increases tomorrow's allowance, overspending decreases it)

B) Fixed daily allowance — daily allowance = monthly allowance ÷ days in month, constant all month; over/under-spend is only visible via month-to-date vs. cumulative allowance, not by changing tomorrow's number

C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 2: Monthly cycle boundary
When does the tracking month reset (allowances, month-to-date spend, progress)?

A) Calendar month (1st to last day of the month, using the device's local date)

B) Rolling 30-day window from setup date

C) Other (please describe after [Answer]: tag below)

[Answer]: C). User should be able to customize it. 

## Question 3: AI advice refresh trigger
When should the app call Claude for updated coaching advice?

A) Manual only — a button the user taps (e.g. "Get Advice"); avoids unnecessary API calls and cost

B) Automatic — refetch whenever the plan or today's spend changes (e.g. after logging an expense), possibly debounced

C) Other (please describe after [Answer]: tag below)

[Answer]: C). Manual + Weekly overview. 

## Question 4: Currency
How should amounts be entered and displayed?

A) Plain numbers only, no currency symbol or formatting (user knows their own currency; keeps engine currency-agnostic ahead of the Sri Lanka offers backlog item)

B) Fixed currency symbol/format baked in now (please specify which currency after [Answer])

C) Other (please describe after [Answer]: tag below)

[Answer]: C). currency should be customizable based on customer preference

## Question: Security Extensions
Should security extension rules be enforced for this project?

A) Yes — enforce all SECURITY rules as blocking constraints (recommended for production-grade applications)

B) No — skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects)

X) Other (please describe after [Answer]: tag below)

[Answer]: X. Yes, we can skip for now. But, keep a backlog item for this. 

## Question: Resiliency Extensions
Should the resiliency baseline be applied to this project?

A) Yes — apply the resiliency baseline as directional best practices and design-time guidance

B) No — skip the resiliency baseline (suitable for PoCs, prototypes, and experimental projects where rapid iteration matters more than reliability)

X) Other (please describe after [Answer]: tag below)

[Answer]: X. Yes, we can skip for now. But, keep a backlog item for this. 

## Question: Property-Based Testing Extension
Should property-based testing (PBT) rules be enforced for this project?

A) Yes — enforce all PBT rules as blocking constraints

B) Partial — enforce PBT rules only for pure functions and serialization round-trips

C) No — skip all PBT rules (standard unit tests cover the deterministic engine instead)

X) Other (please describe after [Answer]: tag below)

[Answer]: B).
