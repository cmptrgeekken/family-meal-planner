# Frontend

This directory will contain the React single-page application for the Family Meal Planner.

Planned responsibilities:

- Parent planning workflows
- Child meal-selection workflows
- Weekly planner views
- Grocery list views
- Responsive tablet and mobile interaction

Suggested near-term setup:

- React + Vite
- TypeScript
- Testing Library for UI tests
- Playwright for end-to-end coverage

Keep presentation concerns separate from domain rules. Weekly-plan rules and grocery-list logic should be easy to test independently from the UI.

## Playwright UI Review

Playwright is wired for desktop UI review screenshots with mocked API data:

```bash
npm run test:e2e -w frontend
```

On a fresh WSL/Linux environment, install the browser and native dependencies once:

```bash
npx playwright install chromium
sudo npx playwright install-deps chromium
```

The test artifacts are written under `/tmp/family-meal-planner-playwright` so screenshots and reports do not dirty the repo.
