# Unit of Work Plan — Rollover

## Plan (checkboxes tracked during execution)

- [ ] Generate `aidlc-docs/inception/application-design/unit-of-work.md`
- [ ] Generate `aidlc-docs/inception/application-design/unit-of-work-dependency.md`
- [ ] Generate `aidlc-docs/inception/application-design/unit-of-work-story-map.md` (mapping requirements → units, since User Stories was skipped — no stories exist to map)
- [ ] Document code organization strategy (greenfield) in `unit-of-work.md`
- [ ] Validate unit boundaries and dependencies
- [ ] Ensure every FR/NFR from `requirements.md` is assigned to a unit

## Category Evaluation

Most of these were already effectively decided during Workflow Planning (2-unit split) and Application Design (layers map 1:1 to units) — evaluated below rather than re-asked where already settled, per instructions to justify rather than skip silently.

- **Story Grouping**: N/A — User Stories was skipped; requirements (FR-1..FR-5) are mapped directly to units in `unit-of-work-story-map.md` instead.
- **Dependencies**: Already settled — Unit 2 depends on Unit 1's public interface (`PlanEngine`, `StoragePort` types); Unit 1 has zero dependency on Unit 2 (see `component-dependency.md`). Build order: Unit 1 fully coded + tested, then Unit 2.
- **Team Alignment**: N/A — solo developer, no team boundaries to negotiate.
- **Technical Considerations**: N/A — both units run as local processes for this build (browser bundle + one local Node server); no differing scalability/deployment requirements to decompose around.
- **Business Domain**: Already settled — the split follows the one real bounded-context line in this app: deterministic financial domain logic (Unit 1) vs. delivery mechanism / external integration (Unit 2, UI + Gemini proxy).
- **Code Organization (greenfield, multi-unit)**: Already settled in Application Design (Q3/Q5) — single package, `src/core/` (Unit 1), `src/app/` + `server/` (Unit 2).

## Remaining Open Question

### Question 1: Confirm unit split
Given the above, the plan is to keep exactly the 2 units already outlined (Core Engine & Storage; Web App & Advice Proxy) rather than split further (e.g. separating the Express server into its own 3rd unit) or merge into 1.

A) Keep 2 units as planned — server proxy stays grouped with the client app under Unit 2 since it's a single thin pass-through with no independent lifecycle, not worth a 3rd unit for a 3.5h build

B) Split into 3 units — separate the server proxy out as its own unit from the client UI

C) Merge into 1 unit — treat the whole app as a single unit of work, no split

D) Other (please describe after [Answer]: tag below)

[Answer]: A
