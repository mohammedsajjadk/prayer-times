# Prayer Times Project - Comprehensive Testing Documentation

## 🧪 Running the Tests

### Prerequisites
```bash
# Ensure virtual environment is activated
cd C:\Sajjad\prayer_times_project_2
.\venv\Scripts\activate

# Install test dependencies (already installed)
pip install pytest pytest-flask pytest-mock pytest-cov
```

### Python Tests

#### Run All Tests
```bash
# Run all Python tests
python -m pytest tests/ -v

# Run with coverage report
python -m pytest tests/ --cov=. --cov-report=html --cov-report=term-missing
```

#### Run Specific Test Modules
```bash
# App tests only
python -m pytest tests/test_app.py -v

# Parser tests only  
python -m pytest tests/test_prayer_time_parser.py -v

# Validator tests only
python -m pytest tests/test_prayer_time_validator.py -v
```

#### Run Specific Test Classes
```bash
# Run specific test class
python -m pytest tests/test_app.py::TestLoadPrayerTimes -v

# Run specific test method
python -m pytest tests/test_app.py::TestLoadPrayerTimes::test_load_prayer_times_success -v
```

### JavaScript Tests (Requires Node.js)

#### Setup JavaScript Testing
```bash
# Install Node.js (if not already installed)
# Download from: https://nodejs.org/

# Install Jest
npm install --save-dev jest jsdom

# Run JavaScript tests
npm test
```

#### Manual JavaScript Test Files
The JavaScript test files are ready to run:
- `tests/javascript_tests/main.test.js`
- `tests/javascript_tests/utils.test.js`
- `tests/javascript_tests/config.test.js`

### Coverage Reports

#### View HTML Coverage Report
```bash
# Generate and view coverage report
python -m pytest tests/ --cov=. --cov-report=html
# Open htmlcov/index.html in browser
start htmlcov/index.html
```

## 📊 Test Results Summary

### Current Status (Latest Run)
- **Total Tests**: 77 Python tests
- **Passing**: 74 tests (96%)
- **Failing**: 3 tests (Flask route integration)
- **Coverage**: 95%

### Module Breakdown
| Module | Tests | Status | Coverage |
|--------|-------|--------|----------|
| App | 20 | 17/20 ✅ | 98% |
| Parser | 24 | 24/24 ✅ | 83% |
| Validator | 33 | 33/33 ✅ | 82% |

### Test Categories

#### ✅ Fully Tested Components
- Prayer time loading and CSV processing
- Islamic date conversion and Hijri calendar
- Time calculations (Sehri, noon, important times)
- Irish Summer Time detection and handling
- Excel to CSV parsing with format conversion
- Prayer time validation and business rules
- Error handling and edge cases

#### ⚠️ Partially Tested Components
- Flask route integration (datetime mocking complexity)
- Tomorrow's prayer time lookup
- Complex datetime operations in routes

### 1. Python Test Environment Setup

The Python environment is already configured. The required packages are:
- pytest
- pytest-flask
- pytest-mock
- pytest-cov

### 2. JavaScript Test Environment Setup

To set up the JavaScript testing environment:

```bash
# Install Node.js dependencies
npm install

# Or if you prefer yarn
yarn install
```

## Running Tests

### Python Tests

Run all Python tests:
```bash
# Using the configured Python environment
C:/Sajjad/prayer_times_project_2/venv/Scripts/python.exe -m pytest tests/test_*.py

# With coverage report
C:/Sajjad/prayer_times_project_2/venv/Scripts/python.exe -m pytest tests/test_*.py --cov=. --cov-report=html

# Run specific test file
C:/Sajjad/prayer_times_project_2/venv/Scripts/python.exe -m pytest tests/test_app.py

# Run specific test class or method
C:/Sajjad/prayer_times_project_2/venv/Scripts/python.exe -m pytest tests/test_app.py::TestLoadPrayerTimes
C:/Sajjad/prayer_times_project_2/venv/Scripts/python.exe -m pytest tests/test_app.py::TestLoadPrayerTimes::test_load_prayer_times_success
```

### JavaScript Tests (when Node.js is available)

```bash
# Run all JavaScript tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npx jest tests/main.test.js

# Run tests matching a pattern
npx jest --testNamePattern="Time Utilities"
```

### Running Individual Test Modules

#### Test the Flask Application (app.py)
```bash
C:/Sajjad/prayer_times_project_2/venv/Scripts/python.exe -m pytest tests/test_app.py -v
```

#### Test the Prayer Time Parser (prayer_time_parser.py)
```bash
C:/Sajjad/prayer_times_project_2/venv/Scripts/python.exe -m pytest tests/test_prayer_time_parser.py -v
```

#### Test the Prayer Time Validator (prayer_time_validator.py)
```bash
C:/Sajjad/prayer_times_project_2/venv/Scripts/python.exe -m pytest tests/test_prayer_time_validator.py -v
```

## Test Coverage

### Python Test Coverage

The Python tests cover:

1. **Flask Application (app.py)**
   - Prayer time loading and CSV parsing
   - Islamic date conversion
   - Important time calculations (Sehri, Noon)
   - Irish Summer Time detection
   - Flask route handling and template rendering
   - Error handling and edge cases

2. **Prayer Time Parser (prayer_time_parser.py)**
   - Excel data parsing and month extraction
   - Time format conversion (12-hour to 24-hour)
   - Quote mark handling for repeated times
   - CSV output generation
   - All prayer time formats and edge cases

3. **Prayer Time Validator (prayer_time_validator.py)**
   - Date sequence validation
   - Prayer time pattern validation (increment/decrement)
   - Irish clock change handling for Zohr Jamaah
   - Magrib Jamaah offset validation (Beginning + 5 minutes)
   - Comprehensive reporting and error detection

### JavaScript Test Coverage

The JavaScript tests cover:

1. **Main Application Module (main.js)**
   - Application initialization sequence
   - Module coordination and updates
   - Time synchronization and drift detection
   - Jumuah time handling for Summer/Winter
   - DOM ready state handling

2. **Utilities Module (utils.js)**
   - Time conversion and manipulation functions
   - 12-hour and 24-hour format conversion
   - Prayer time calculations and formatting
   - Edge case handling and error resilience

3. **Configuration Module (config.js)**
   - Test mode functionality
   - Mock date and time generation
   - Day of week handling
   - State management and validation

## Test Structure

### Python Tests
```
tests/
├── __init__.py                      # Test package initialization
├── test_app.py                      # Flask application tests
├── test_prayer_time_parser.py       # Parser module tests
└── test_prayer_time_validator.py    # Validator module tests
```

### JavaScript Tests
```
tests/
├── setup.js                        # Jest setup and mocks
├── main.test.js                     # Main application tests
├── utils.test.js                    # Utilities module tests
└── config.test.js                   # Configuration module tests
```

## Key Testing Features

### Comprehensive Scenario Coverage
- **Happy Path Testing**: Normal operations with valid data
- **Edge Case Testing**: Boundary conditions, empty data, invalid formats
- **Error Handling**: File not found, malformed data, permission errors
- **Integration Testing**: Full workflow from data loading to display

### Mock and Fixture Usage
- **CSV Data Mocking**: Simulated prayer time data for consistent testing
- **Date/Time Mocking**: Controlled time scenarios for DST and prayer timing
- **DOM Mocking**: Browser environment simulation for JavaScript tests
- **Flask Test Client**: HTTP request/response testing

### Validation Testing
- **Pattern Validation**: Prayer time increment/decrement patterns by month
- **Clock Change Validation**: Irish Summer Time transitions
- **Data Integrity**: Date sequences, time formats, calculation accuracy
- **Business Logic**: Sehri timing, Jamaah offsets, Jumuah special handling

## Performance and Quality Metrics

### Test Execution
- **Fast Execution**: Most tests complete in seconds
- **Isolated Testing**: Each test is independent and can run alone
- **Deterministic Results**: Consistent test outcomes across environments
- **Clear Assertions**: Descriptive test names and meaningful error messages

### Code Coverage Goals
- **Python Modules**: >90% code coverage
- **JavaScript Modules**: >85% code coverage
- **Critical Paths**: 100% coverage for prayer time calculations
- **Error Paths**: Complete coverage of exception handling

## Debugging Tests

### Running Tests with Debug Output
```bash
# Verbose output
C:/Sajjad/prayer_times_project_2/venv/Scripts/python.exe -m pytest -v -s

# Show print statements
C:/Sajjad/prayer_times_project_2/venv/Scripts/python.exe -m pytest -s

# Stop on first failure
C:/Sajjad/prayer_times_project_2/venv/Scripts/python.exe -m pytest -x

# Run last failed tests only
C:/Sajjad/prayer_times_project_2/venv/Scripts/python.exe -m pytest --lf
```

### Common Issues and Solutions

1. **Import Errors**: Ensure virtual environment is activated
2. **File Path Issues**: Use absolute paths in test data
3. **Mock Issues**: Verify mock setup in setUp/beforeEach methods
4. **Timezone Issues**: Use UTC in tests for consistency

## Continuous Integration

The test suite is designed to be easily integrated with CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: '3.9'
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest pytest-flask pytest-mock pytest-cov
      - name: Run Python tests
        run: pytest tests/ --cov=. --cov-report=xml
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Install JS dependencies
        run: npm install
      - name: Run JavaScript tests
        run: npm test
```

## Contributing

When adding new features:

1. **Write Tests First**: Follow TDD practices
2. **Test All Scenarios**: Happy path, edge cases, and error conditions
3. **Maintain Coverage**: Ensure new code is fully tested
4. **Update Documentation**: Keep this guide current with changes

## Support

For issues with testing:
1. Check the test output for specific error messages
2. Verify all dependencies are correctly installed
3. Ensure file paths and permissions are correct
4. Review mock setups for any changes in implementation
