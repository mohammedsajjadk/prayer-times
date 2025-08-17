// Jest setup file for DOM testing
// Mock browser globals and functions that aren't available in Node.js environment

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock document methods
Object.defineProperty(document, 'readyState', {
  writable: true,
  value: 'complete'
});

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock Date.now for consistent testing
const originalDateNow = Date.now;
global.mockDateNow = (timestamp) => {
  Date.now = jest.fn(() => timestamp);
};
global.restoreDateNow = () => {
  Date.now = originalDateNow;
};

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  localStorage.getItem.mockClear();
  localStorage.setItem.mockClear();
  localStorage.removeItem.mockClear();
  localStorage.clear.mockClear();
});
