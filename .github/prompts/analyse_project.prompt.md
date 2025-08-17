## Goal
The agent must:
1. Read and analyze the entire project, including all source files, dependencies, and configuration files.
2. Determine the primary programming language(s) and frameworks used.
3. Identify all functions, classes, and modules across the project.
4. Generate comprehensive unit tests for all significant functions, classes, and modules.
5. Follow best practices for the detected language and framework (e.g., pytest for Python, JUnit for Java, Jest for JavaScript, NUnit/XUnit for C#, etc.).
6. Ensure generated tests are clear, maintainable, and runnable with the project's existing test runner.
7. If multiple test frameworks are possible, match the one already in use in the project (or create a new test setup if none exists).

## Requirements
- Place generated tests inside a dedicated `tests/` folder, mirroring the structure of the source code.
- Each test file should target only the corresponding module/class/file.
- Tests must cover:
  - Happy-path scenarios.
  - Edge cases and error handling.
  - Boundary conditions.
- Ensure all tests are runnable with the standard test runner for the project’s ecosystem.
- Add any necessary configuration (test runner setup, fixtures, mocks) if not already present.

## Process
1. Scan the repository to detect:
   - Primary languages and frameworks.
   - Existing test infrastructure.
   - Project build or package manager files (`package.json`, `requirements.txt`, `pom.xml`, `csproj`, etc.).
2. For each source file:
   - Document the functions and classes.
   - Write corresponding test cases.
   - Include meaningful test names.
3. Write a **summary report** listing:
   - Total files analyzed.
   - Tests created per file.
   - Gaps where testing may be limited due to external dependencies, complex I/O, or missing context.

## Output
- A complete test suite under `tests/`.
- A `TESTING.md` file with instructions on how to run the tests.
- A summary report in `tests/README.md`.

