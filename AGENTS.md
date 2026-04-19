# AGENTS.md

## Purpose

This document gives human and AI contributors a shared operating manual for the Family Meal Planner project.
It is intended to help us make steady product progress, protect quality early, and keep collaboration consistent as the codebase grows.

This project is a self-hosted, family-oriented meal planning application described in [docs/prd-v1.md](/d:/Projects/family-meal-planner/docs/prd-v1.md).

## Product Intent

The app should help families answer "what's for dinner?" with less friction, less stress, and better outcomes.

Primary goals:

- Reduce parent decision fatigue.
- Give kids an engaging, age-appropriate way to participate.
- Turn meal planning into a fast weekly routine.
- Generate grocery output that is immediately useful.
- Stay practical, local-first, and self-hostable.

Core product values:

- Simplicity over feature sprawl.
- Speed and clarity over cleverness.
- Family realism over idealized workflow design.
- Safe defaults over heavy configuration.
- Progressively enhanced UX over premature complexity.

## Collaboration Rules

When working in this repository, contributors should:

- Read the PRD and relevant code before proposing changes.
- Prefer small, reviewable changes over large speculative rewrites.
- Keep product decisions aligned with the MVP before expanding scope.
- Call out assumptions explicitly when requirements are ambiguous.
- Preserve existing user work and avoid destructive changes unless explicitly requested.
- Leave the codebase easier to understand than you found it.

## Standard Working Loop

For any meaningful task, follow this sequence:

1. Understand the user story, current behavior, and affected files.
2. Identify constraints from product, UX, data model, and deployment.
3. Make the smallest change that solves the real problem.
4. Add or update tests close to the changed behavior.
5. Run relevant validation before considering the task done.
6. Summarize what changed, what was verified, and any remaining risks.

## Reviewer Personas

Every substantial feature, bug fix, or UX change should be reviewed through multiple personas.
These personas can be used by humans, AI assistants, or both.

### 1. Parent Perspective

Ask:

- Can I plan a week quickly when I am tired or distracted?
- Is the next action obvious without reading lots of text?
- Does this save me time compared with paper, memory, or texting family members?
- Can I recover easily if I make a mistake?
- Does the app help me balance cost, effort, nutrition, and kid preferences?
- Is grocery output actually usable in a real shopping trip?
- Does the experience work well on a phone in a store and on a tablet in the kitchen?

Success signals:

- A parent can complete the primary weekly planning flow in a few minutes.
- Important information is visible without hunting through screens.
- Editing, replacing, or skipping a meal is low-friction.

### 2. Child Perspective

Ask:

- Is the interface understandable with minimal reading?
- Are targets large enough for touch interaction?
- Does the UI feel playful without becoming confusing?
- Can I make choices without accidentally breaking the plan?
- Does the app encourage participation without shaming or overcomplicating decisions?

Success signals:

- A child can recognize categories and choose meals visually.
- Interactions are resilient to tapping, dragging mistakes, and short attention spans.
- The system supports agency while keeping parent controls intact.

### 3. Product Owner Perspective

Ask:

- Does this change clearly support the MVP or approved roadmap?
- Does it reduce decision fatigue, improve planning speed, or improve grocery usefulness?
- Are acceptance criteria clear and testable?
- Is the complexity justified by real user value?
- Are we introducing scope that should be deferred?

Success signals:

- The feature has a clear user outcome.
- Requirements and edge cases are concrete enough to implement and test.
- Tradeoffs are documented when we intentionally defer work.

### 4. Senior Engineer Perspective

Ask:

- Is the solution maintainable and easy to extend?
- Is the architecture proportionate to the current stage of the product?
- Are boundaries between UI, business logic, persistence, and integration clean?
- Are names, data shapes, and interfaces clear?
- Are we avoiding accidental complexity and duplicate logic?

Success signals:

- Core logic is testable outside the UI.
- The code is readable without needing extra explanation.
- The design leaves room for future planner, grocery, and household features.

### 5. QA Engineer Perspective

Ask:

- What should happen in the happy path, edge cases, and failure paths?
- What breaks if data is empty, duplicated, partial, or invalid?
- What happens on mobile, tablet, and desktop layouts?
- Are loading, error, and retry states visible and testable?
- Did this change create regression risk in nearby flows?

Success signals:

- Critical flows are covered by automated tests.
- Manual exploratory steps are documented for complex UX.
- Bugs are reproduced with concrete steps and verified with regression coverage.

### 6. Security Engineer Perspective

Ask:

- Are we validating and sanitizing user input on the server?
- Are authentication, authorization, and session boundaries clear if multi-user support is added?
- Are secrets kept out of source control and logs?
- Are dependencies, containers, and default configs reasonably safe?
- Are we exposing more data than needed through APIs or logs?

Success signals:

- Input validation exists at trust boundaries.
- Sensitive configuration is isolated and documented.
- The default local deployment is safe enough for a home-network self-hosted app.

### 7. Accessibility Perspective

Ask:

- Can the workflow be completed with keyboard-only navigation?
- Are semantics, labels, focus states, and announcements present?
- Is color contrast sufficient?
- Are drag-and-drop and touch workflows backed by accessible alternatives?
- Is the UI understandable for users with cognitive load, low vision, or motor constraints?

Success signals:

- Core flows remain usable without relying only on drag-and-drop.
- Forms and interactive elements have clear labels and feedback.
- Accessibility is designed into the feature, not patched in later.

## Additional Perspectives Worth Incorporating

These are especially valuable for this product:

### 8. Nutrition / Household Health Perspective

Ask:

- Does this feature help families make slightly better choices without becoming a calorie tracker?
- Can parents "upgrade" meals with protein, vegetables, or other healthier options?
- Are defaults nudging toward balanced planning rather than perfectionism?

Why it matters:

- The PRD explicitly mentions nutritional upgrades, so this is a meaningful product lens.

### 9. Operations / Self-Hosting Perspective

Ask:

- Can a non-expert self-hoster run and update this with low friction?
- Are Docker defaults clear, documented, and reliable?
- Are backups, migrations, and local persistence handled thoughtfully?
- Does the app fail clearly when a service is unavailable?

Why it matters:

- Self-hosting is a first-class product constraint, not a side concern.

### 10. Data / Information Architecture Perspective

Ask:

- Are meal, ingredient, category, and plan data models intuitive and stable?
- Will current schemas support future grocery, pantry, and insights features?
- Are we storing data once in the right place instead of duplicating it in UI-specific shapes?

Why it matters:

- This app will live or die on clean meal and ingredient modeling.

### 11. Performance / Responsiveness Perspective

Ask:

- Does the app feel instant for the core weekly planning flow?
- Are we keeping mobile and tablet interactions smooth?
- Are queries and renders efficient enough for a growing meal catalog?

Why it matters:

- "Fast enough to use every week" is a product requirement, not just a technical nice-to-have.

### 12. Observability / Debuggability Perspective

Ask:

- If a grocery list is wrong, can we explain why?
- If a weekly plan rule blocks a choice, is the reason visible?
- Do logs and errors help us diagnose issues without exposing sensitive data?

Why it matters:

- AI-assisted coding increases speed, but it also makes clear debugging pathways even more important.

## AI-Assisted Development Expectations

AI contributors should behave like careful teammates, not autocomplete.

Always:

- Ground changes in the PRD, current code, and explicit user requests.
- Prefer incremental implementation over broad speculative scaffolding.
- Explain assumptions when requirements are incomplete.
- Keep business rules centralized and testable.
- Add or update tests when behavior changes.
- Verify relevant commands locally when possible.
- Surface risks, gaps, and unknowns instead of hiding them.

Avoid:

- Inventing features not justified by the MVP or roadmap.
- Creating complex abstractions before repeated need exists.
- Mixing unrelated refactors with feature work.
- Duplicating logic between frontend and backend without a deliberate contract.
- Leaving placeholder code that looks production-ready but is not wired through.

## Suggested Delivery Standards

### Definition of Done

A change is only considered done when:

- The user-facing behavior is implemented end-to-end for the intended scope.
- Relevant automated tests are added or updated.
- Relevant checks are run locally.
- Documentation is updated if behavior, setup, or architecture changed.
- Known limitations and follow-up work are called out explicitly.

### Test Strategy

Use layered testing instead of relying on one test type.

Expected layers:

- Unit tests for pure business logic, planners, rule engines, and utility functions.
- Component or UI tests for interaction behavior and visual states.
- API or integration tests for backend routes, validation, persistence, and service boundaries.
- End-to-end tests for critical user flows.
- Mutation testing for critical decision logic when the rule engine becomes non-trivial.

Critical flows that deserve strong coverage:

- Creating and editing meals.
- Assigning meals to a weekly plan.
- Enforcing weekly planning constraints.
- Generating a deduplicated grocery list.
- Replacing or removing meals from an existing plan.
- Handling empty-state and error-state behavior.

Recommended guidance:

- Write unit tests for every non-trivial business rule.
- Add regression tests for every bug that is fixed.
- Prefer stable selectors and user-visible assertions in UI and E2E tests.
- Keep E2E focused on highest-value journeys rather than duplicating all unit coverage.

### Validation Before Commit

Before committing meaningful code, run the relevant local validation for the scope of your change.

Typical expectation:

- Linting passes.
- Type checking passes.
- Unit and integration tests relevant to the changed area pass.
- E2E tests pass for affected critical flows when UI behavior changed substantially.

If something cannot be run:

- Say exactly what was not run.
- Explain why.
- Note the residual risk.

### Commit Hygiene

Commits should:

- Be intentionally scoped.
- Use clear messages that explain the change.
- Avoid bundling unrelated refactors with behavior changes.
- Leave the branch in a state that another contributor can understand quickly.

### Documentation Hygiene

Update docs when you change:

- Setup instructions.
- Environment variables.
- API contracts.
- Data models or migrations.
- Key workflows or user-visible behavior.
- Architectural decisions that affect future contributors.

## Product and Engineering Guardrails

### MVP Discipline

Prefer:

- Weekly planning speed.
- Simple meal CRUD.
- Useful grocery generation.
- Child-friendly participation.
- Parent-friendly editing and overrides.

Defer unless clearly justified:

- Social features.
- Deep gamification.
- Complex nutrition/calorie systems.
- External integrations.
- Heavy customization.

### Architecture Guidance

Prefer:

- Thin UI components.
- Clear server-side validation.
- Centralized business rules.
- Schema-driven data access.
- Explicit API contracts.

Avoid:

- Hiding business rules only in the UI.
- Mixing persistence concerns directly into presentation logic.
- Premature microservice or plugin-style decomposition.
- Over-engineering state management before complexity requires it.

### UX Guidance

The interface should be:

- Fast to scan.
- Friendly on touch devices.
- Forgiving of mistakes.
- Clear in loading, empty, and error states.
- Usable by both adults and children with different goals.

When drag-and-drop is used:

- Provide a non-drag alternative.
- Keep target sizes generous.
- Preserve accessibility and keyboard operation.

## Issue and PR Review Template

For meaningful features and changes, reviewers should answer:

1. What user problem does this change solve?
2. Which personas were considered?
3. What are the key acceptance criteria?
4. What tests were added or updated?
5. What risks or follow-ups remain?

## Suggested Task Template for AI or Human Contributors

When starting a task, it is helpful to state:

- Goal: what outcome we want.
- Scope: what is in and out.
- Constraints: product, technical, or timeline limits.
- Approach: the smallest viable implementation.
- Validation: which tests/checks will prove the change works.

## Living Document Rule

This file should evolve with the project.
When recurring pain shows up in reviews, bugs, or collaboration, update this document so the next task starts from a better baseline.
