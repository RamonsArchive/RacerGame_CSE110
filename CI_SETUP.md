# Continuous Integration (CI) Setup Guide

## What is CI/CD?

**Continuous Integration (CI)** automatically builds and tests your code on every push/PR to catch bugs early and ensure code quality.

## What We Set Up

### 1. **Vitest** - Testing Framework

- Fast, modern test runner for TypeScript/JavaScript
- Works seamlessly with Next.js
- Documentation: https://vitest.dev/

### 2. **GitHub Actions** - CI/CD Pipeline

- Automatically runs tests on every push/PR
- Free for public repositories
- Documentation: https://docs.github.com/en/actions

## Files Created

### Test Files

- `src/lib/utils_typequest.test.ts` - Unit tests for TypeQuest utilities
- `src/test/setup.ts` - Test configuration and setup

### Configuration Files

- `vitest.config.ts` - Vitest configuration
- `.github/workflows/ci.yml` - GitHub Actions workflow

## How to Use

### Run Tests Locally

```bash
# Run tests in watch mode (re-runs on file changes)
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### What GitHub Actions Does

When you push code or create a PR, GitHub Actions automatically:

1. ✅ **Checks out your code**
2. ✅ **Installs dependencies** (`npm ci`)
3. ✅ **Runs linter** (`npm run lint`)
4. ✅ **Type checks** (`npx tsc --noEmit`)
5. ✅ **Runs tests** (`npm run test:run`)
6. ✅ **Builds project** (`npm run build`)

If any step fails, the CI shows ❌ and prevents merging (if configured).

## Test Coverage

Current tests cover:

- ✅ `calculateQuestionPoints` - Point calculation with speed bonus and mistakes
- ✅ `calculateGameScore` - Game score with perfect bonus and speed bonus
- ✅ `calculateAccuracy` - Accuracy percentage calculations
- ✅ `calculateAverageTime` - Average time per question
- ✅ `calculateCharactersPerSecond` - Typing speed calculations

## Adding More Tests

Create new test files following the pattern:

- File: `src/lib/[filename].test.ts`
- Import functions to test
- Use `describe()` and `it()` blocks
- Use `expect()` for assertions

Example:

```typescript
import { describe, it, expect } from "vitest";
import { myFunction } from "./myFile";

describe("myFunction", () => {
  it("should do something", () => {
    const result = myFunction(input);
    expect(result).toBe(expected);
  });
});
```

## GitHub Actions Workflow

The workflow file (`.github/workflows/ci.yml`) runs on:

- Push to `main`, `master`, or `develop` branches
- Pull requests to those branches

You can see CI status:

- On your GitHub repository → "Actions" tab
- As a check mark (✅) or X (❌) on PRs

## Documentation Links

1. **GitHub Actions Basics**
   - https://docs.github.com/en/actions/get-started/continuous-integration
   - https://docs.github.com/en/actions/learn-github-actions/understanding-github-actions

2. **Vitest Documentation**
   - https://vitest.dev/
   - https://vitest.dev/guide/

3. **Next.js Testing**
   - https://nextjs.org/docs/app/building-your-application/testing

4. **React Testing Library**
   - https://testing-library.com/react

## Next Steps

1. ✅ Tests are set up and passing
2. ✅ CI workflow is configured
3. 🔄 Push to GitHub to see CI in action
4. 🔄 Add more tests as you develop features
5. 🔄 Consider adding E2E tests with Playwright (optional)

## Troubleshooting

### Tests fail locally?

- Check that all dependencies are installed: `npm install`
- Run `npm run test:run` to see detailed error messages

### CI fails on GitHub?

- Check the "Actions" tab in your GitHub repo
- Look at the error logs to see what failed
- Make sure environment variables are set in GitHub Secrets (if needed)
