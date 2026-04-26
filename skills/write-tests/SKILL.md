---
name: write-tests
description: 'Generate tests for a file or function. Use when: adding tests to untested code, improving test coverage, writing unit tests, writing integration tests, testing a new feature.'
argument-hint: 'file path or function name to test (e.g. src/utils/format.ts or parseDate)'
---

# Write Tests

Generate well-structured tests for a given file, function, or module by first understanding the codebase's existing testing conventions, then producing tests that fit naturally alongside them.

## Step 1: Identify the target

If the user provided a file path or function name, use that as the target. Otherwise, ask:
- What file or function should be tested?
- Should this be a unit test, integration test, or both?

## Step 2: Discover testing conventions

Before writing a single line, explore how tests are already written in this project:

- Find existing test files (look for `*.test.*`, `*.spec.*`, `__tests__/` directories)
- Identify the test framework (Jest, Vitest, Mocha, pytest, etc.) from config files (`jest.config.*`, `vitest.config.*`, `pyproject.toml`, etc.) or `package.json`
- Note the test file naming convention and location pattern (co-located vs. `__tests__/` folder vs. separate `tests/` directory)
- Note how imports, mocks, and assertions are structured in existing tests
- Check for shared test utilities, fixtures, factories, or custom matchers in use
- Identify how async code, errors, and side effects are tested

Stick strictly to these conventions. Do not introduce new libraries, patterns, or assertion styles not already in the project.

## Step 3: Read the target code

Read the file or function to be tested in full. Identify:

- All exported functions, classes, or components
- Input types and shapes — including edge cases like `null`, `undefined`, empty arrays, boundary values
- Return types and shapes
- Side effects (I/O, state mutations, API calls, timers)
- Error conditions and thrown exceptions
- Any dependencies that will need to be mocked

## Step 4: Plan the test cases

Before writing code, list the test cases you intend to cover:

```
- happy path: valid input returns expected output
- empty input: returns [] instead of throwing
- null input: throws TypeError with message "..."
- async: resolves with correct shape when API returns 200
- async error: rejects when API returns 500
- side effect: calls logger.warn when input is deprecated
```

If the target is a React/Vue/etc. component, include:
- renders without crashing
- renders correct output given props
- user interactions (clicks, inputs) trigger the right behavior
- loading/error/empty states

## Step 5: Write the tests

Write the test file following the project's conventions exactly. Include:

- Descriptive `describe` / `it` / `test` blocks that read like documentation
- One assertion per test where practical (avoid testing multiple behaviors in a single test)
- Proper setup and teardown (`beforeEach`, `afterEach`) to avoid test pollution
- Mocks scoped as narrowly as possible — mock at the boundary, not deep inside

Place the file in the correct location per the project's convention (co-located, `__tests__/`, or `tests/`).

## Step 6: Verify the tests run

Run the test suite (or just the new file) to confirm:
- All new tests pass
- No existing tests were broken

Use the project's test command from `package.json` scripts or the detected config. If tests fail, fix them before finishing.

## Step 7: Summarize what was written

Output a short summary:

```
## Tests written: src/utils/format.test.ts

**Cases covered (8):**
- formats a valid date string correctly
- returns empty string for null input
- returns empty string for undefined input
- handles leap year dates
- handles timezone offset
- throws RangeError for invalid date strings
- formats using custom locale when provided
- falls back to en-US locale when locale is unavailable

Run with: pnpm test src/utils/format.test.ts
```

If any cases were intentionally skipped or are out of scope, note them so the user can follow up.
