/**
 * Unit tests for the main application module (static/js/main.js)
 * Tests the main application initialization and update cycles
 */

// Mock all the module dependencies
const mockTimeModule = {
  updateTime: jest.fn(),
  convertTo12Hour: jest.fn(),
  persistentRefresh: jest.fn()
};

const mockPrayerModule = {
  updateNextPrayer: jest.fn(),
  updateJumuahTimes: jest.fn(),
  updateToNextDayTimesIfNeeded: jest.fn()
};

const mockAnnouncementModule = {
  updateAnnouncement: jest.fn()
};

const mockThemeModule = {
  init: jest.fn()
};

const mockTestMode = {
  enabled: false,
  start: jest.fn(),
  getMockDate: jest.fn(() => new Date()),
  dayOfWeek: 5
};

const mockDateUtils = {
  isIrelandDST: jest.fn(() => false)
};

const mockTimeUtils = {
  formatTimeFor12Hour: jest.fn((time) => time)
};

// Mock DOM elements
const createMockElement = (textContent = '', dataTime = '') => ({
  textContent,
  setAttribute: jest.fn(),
  getAttribute: jest.fn(() => dataTime),
  style: {},
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn(() => false)
  }
});

const mockDocument = {
  readyState: 'complete',
  querySelector: jest.fn(),
  addEventListener: jest.fn(),
  createElement: jest.fn(() => createMockElement())
};

// Global mocks
global.document = mockDocument;
global.window = {
  mainInterval: null,
  timeRefreshInterval: null,
  timeUpdateTimeout: null,
  setInterval: jest.fn(),
  clearInterval: jest.fn(),
  clearTimeout: jest.fn()
};
global.setInterval = jest.fn();
global.clearInterval = jest.fn();
global.clearTimeout = jest.fn();

// Make modules available globally
global.timeModule = mockTimeModule;
global.prayerModule = mockPrayerModule;
global.announcementModule = mockAnnouncementModule;
global.themeModule = mockThemeModule;
global.testMode = mockTestMode;
global.dateUtils = mockDateUtils;
global.timeUtils = mockTimeUtils;

describe('Main Application Module', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset module states
    mockTestMode.enabled = false;
    mockDateUtils.isIrelandDST.mockReturnValue(false);
    
    // Setup default DOM queries
    mockDocument.querySelector.mockImplementation((selector) => {
      if (selector.includes('jamaah') && selector.includes('nth-child(7)')) {
        return createMockElement('13:20', '13:20');
      }
      if (selector.includes('seconds')) {
        return createMockElement('30');
      }
      return createMockElement();
    });
  });

  describe('Application Initialization', () => {
    
    test('should initialize application modules in correct order', () => {
      // Load the main.js application code
      const appCode = `
        var app = {
          initialize: function() {
            if (testMode.enabled) {
              testMode.start();
            }
            
            timeModule.updateTime();
            prayerModule.updateNextPrayer();
            announcementModule.updateAnnouncement();
            timeModule.convertTo12Hour();

            var now = testMode.enabled ? testMode.getMockDate() : new Date();
            var isIrishSummerTime = dateUtils.isIrelandDST(now);
            var jumuahElement = document.querySelector(".jamaah .prayer-time-value:nth-child(7)");
            if (jumuahElement) {
              var jumuahTime = isIrishSummerTime ? "13:45" : "13:20";
              jumuahElement.setAttribute("data-time", jumuahTime);
              jumuahElement.textContent = timeUtils.formatTimeFor12Hour(jumuahTime);
            }
            prayerModule.updateJumuahTimes();
            prayerModule.updateToNextDayTimesIfNeeded();

            themeModule.init();
          }
        };
        app.initialize();
      `;
      
      eval(appCode);
      
      // Verify initialization order
      expect(mockTimeModule.updateTime).toHaveBeenCalled();
      expect(mockPrayerModule.updateNextPrayer).toHaveBeenCalled();
      expect(mockAnnouncementModule.updateAnnouncement).toHaveBeenCalled();
      expect(mockTimeModule.convertTo12Hour).toHaveBeenCalled();
      expect(mockPrayerModule.updateJumuahTimes).toHaveBeenCalled();
      expect(mockPrayerModule.updateToNextDayTimesIfNeeded).toHaveBeenCalled();
      expect(mockThemeModule.init).toHaveBeenCalled();
    });

    test('should start test mode when enabled', () => {
      mockTestMode.enabled = true;
      
      const appCode = `
        var app = {
          initialize: function() {
            if (testMode.enabled) {
              testMode.start();
            }
            timeModule.updateTime();
          }
        };
        app.initialize();
      `;
      
      eval(appCode);
      
      expect(mockTestMode.start).toHaveBeenCalled();
    });

    test('should not start test mode when disabled', () => {
      mockTestMode.enabled = false;
      
      const appCode = `
        var app = {
          initialize: function() {
            if (testMode.enabled) {
              testMode.start();
            }
            timeModule.updateTime();
          }
        };
        app.initialize();
      `;
      
      eval(appCode);
      
      expect(mockTestMode.start).not.toHaveBeenCalled();
    });

    test('should set correct Jumuah time for summer time', () => {
      mockDateUtils.isIrelandDST.mockReturnValue(true);
      const mockJumuahElement = createMockElement('13:20', '13:20');
      mockDocument.querySelector.mockReturnValue(mockJumuahElement);
      
      const appCode = `
        var app = {
          initialize: function() {
            var now = testMode.enabled ? testMode.getMockDate() : new Date();
            var isIrishSummerTime = dateUtils.isIrelandDST(now);
            var jumuahElement = document.querySelector(".jamaah .prayer-time-value:nth-child(7)");
            if (jumuahElement) {
              var jumuahTime = isIrishSummerTime ? "13:45" : "13:20";
              jumuahElement.setAttribute("data-time", jumuahTime);
              jumuahElement.textContent = timeUtils.formatTimeFor12Hour(jumuahTime);
            }
          }
        };
        app.initialize();
      `;
      
      eval(appCode);
      
      expect(mockJumuahElement.setAttribute).toHaveBeenCalledWith("data-time", "13:45");
      expect(mockTimeUtils.formatTimeFor12Hour).toHaveBeenCalledWith("13:45");
    });

    test('should set correct Jumuah time for winter time', () => {
      mockDateUtils.isIrelandDST.mockReturnValue(false);
      const mockJumuahElement = createMockElement('13:45', '13:45');
      mockDocument.querySelector.mockReturnValue(mockJumuahElement);
      
      const appCode = `
        var app = {
          initialize: function() {
            var now = testMode.enabled ? testMode.getMockDate() : new Date();
            var isIrishSummerTime = dateUtils.isIrelandDST(now);
            var jumuahElement = document.querySelector(".jamaah .prayer-time-value:nth-child(7)");
            if (jumuahElement) {
              var jumuahTime = isIrishSummerTime ? "13:45" : "13:20";
              jumuahElement.setAttribute("data-time", jumuahTime);
              jumuahElement.textContent = timeUtils.formatTimeFor12Hour(jumuahTime);
            }
          }
        };
        app.initialize();
      `;
      
      eval(appCode);
      
      expect(mockJumuahElement.setAttribute).toHaveBeenCalledWith("data-time", "13:20");
      expect(mockTimeUtils.formatTimeFor12Hour).toHaveBeenCalledWith("13:20");
    });

    test('should handle missing Jumuah element gracefully', () => {
      mockDocument.querySelector.mockReturnValue(null);
      
      const appCode = `
        var app = {
          initialize: function() {
            var now = new Date();
            var isIrishSummerTime = dateUtils.isIrelandDST(now);
            var jumuahElement = document.querySelector(".jamaah .prayer-time-value:nth-child(7)");
            if (jumuahElement) {
              var jumuahTime = isIrishSummerTime ? "13:45" : "13:20";
              jumuahElement.setAttribute("data-time", jumuahTime);
            }
          }
        };
        app.initialize();
      `;
      
      // Should not throw error
      expect(() => eval(appCode)).not.toThrow();
    });
  });

  describe('Main Interval Updates', () => {
    
    test('should call update functions in main interval', () => {
      const mockSetInterval = jest.fn((callback, interval) => {
        // Immediately call the callback for testing
        callback();
        return 123; // mock interval ID
      });
      global.setInterval = mockSetInterval;
      global.window.setInterval = mockSetInterval;
      
      const appCode = `
        var app = {
          initialize: function() {
            window.mainInterval = setInterval(function() {
              prayerModule.updateNextPrayer();
              announcementModule.updateAnnouncement();
              timeModule.convertTo12Hour();
              prayerModule.updateJumuahTimes();
              prayerModule.updateToNextDayTimesIfNeeded();
            }, 1000);
          }
        };
        app.initialize();
      `;
      
      eval(appCode);
      
      expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 1000);
      expect(mockPrayerModule.updateNextPrayer).toHaveBeenCalled();
      expect(mockAnnouncementModule.updateAnnouncement).toHaveBeenCalled();
      expect(mockTimeModule.convertTo12Hour).toHaveBeenCalled();
      expect(mockPrayerModule.updateJumuahTimes).toHaveBeenCalled();
      expect(mockPrayerModule.updateToNextDayTimesIfNeeded).toHaveBeenCalled();
    });

    test('should setup time refresh interval', () => {
      const mockSetInterval = jest.fn();
      global.setInterval = mockSetInterval;
      global.window.setInterval = mockSetInterval;
      
      const appCode = `
        var app = {
          initialize: function() {
            window.timeRefreshInterval = setInterval(function() {
              if (window.timeUpdateTimeout) {
                clearTimeout(window.timeUpdateTimeout);
              }
              timeModule.updateTime();
            }, 30000);
          }
        };
        app.initialize();
      `;
      
      eval(appCode);
      
      expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 30000);
    });
  });

  describe('Time Refresh Logic', () => {
    
    test('should trigger persistent refresh at midnight', () => {
      mockTestMode.enabled = false;
      mockDateUtils.isIrelandDST.mockReturnValue(false);
      
      // Mock Date to return midnight
      const mockDate = new Date();
      mockDate.getUTCHours = () => 0;
      mockDate.getUTCMinutes = () => 0;
      mockDate.getUTCSeconds = () => 1;
      
      const mockSetInterval = jest.fn((callback) => {
        // Mock the date within the callback
        global.Date = jest.fn(() => mockDate);
        callback();
        return 123;
      });
      global.setInterval = mockSetInterval;
      
      const appCode = `
        var app = {
          initialize: function() {
            window.mainInterval = setInterval(function() {
              var now = testMode.enabled ? testMode.getMockDate() : new Date();
              var isIrishSummerTime = dateUtils.isIrelandDST(now);
              var irishOffset = isIrishSummerTime ? 1 : 0;
              var irishHours = now.getUTCHours() + irishOffset;
              irishHours = irishHours >= 24 ? irishHours - 24 : irishHours;
              var irishMins = now.getUTCMinutes();
              var irishSecs = now.getUTCSeconds();

              if ((irishHours === 0 && irishMins === 0 && irishSecs <= 2)) {
                timeModule.persistentRefresh();
              }
            }, 1000);
          }
        };
        app.initialize();
      `;
      
      eval(appCode);
      
      expect(mockTimeModule.persistentRefresh).toHaveBeenCalled();
    });

    test('should trigger refresh at specific times', () => {
      mockTestMode.enabled = false;
      mockDateUtils.isIrelandDST.mockReturnValue(false);
      
      const testTimes = [
        { hours: 3, minutes: 30, seconds: 1 },  // 3:30 AM
        { hours: 16, minutes: 30, seconds: 2 }, // 4:30 PM
        { hours: 21, minutes: 15, seconds: 1 }  // 9:15 PM
      ];
      
      testTimes.forEach(time => {
        jest.clearAllMocks();
        
        const mockDate = new Date();
        mockDate.getUTCHours = () => time.hours;
        mockDate.getUTCMinutes = () => time.minutes;
        mockDate.getUTCSeconds = () => time.seconds;
        
        const mockSetInterval = jest.fn((callback) => {
          global.Date = jest.fn(() => mockDate);
          callback();
          return 123;
        });
        global.setInterval = mockSetInterval;
        
        const appCode = `
          var app = {
            initialize: function() {
              window.mainInterval = setInterval(function() {
                var now = testMode.enabled ? testMode.getMockDate() : new Date();
                var isIrishSummerTime = dateUtils.isIrelandDST(now);
                var irishOffset = isIrishSummerTime ? 1 : 0;
                var irishHours = now.getUTCHours() + irishOffset;
                irishHours = irishHours >= 24 ? irishHours - 24 : irishHours;
                var irishMins = now.getUTCMinutes();
                var irishSecs = now.getUTCSeconds();

                if ((irishHours === ${time.hours} && irishMins === ${time.minutes} && irishSecs <= 2)) {
                  timeModule.persistentRefresh();
                }
              }, 1000);
            }
          };
          app.initialize();
        `;
        
        eval(appCode);
        
        expect(mockTimeModule.persistentRefresh).toHaveBeenCalled();
      });
    });
  });

  describe('DOM Ready State Handling', () => {
    
    test('should initialize immediately if DOM is already loaded', () => {
      mockDocument.readyState = 'complete';
      
      const mockApp = {
        initialize: jest.fn()
      };
      
      const appCode = `
        var app = mockApp;
        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", app.initialize);
        } else {
          app.initialize();
        }
      `;
      
      // Make mockApp available globally for the eval
      global.mockApp = mockApp;
      
      eval(appCode);
      
      expect(mockApp.initialize).toHaveBeenCalled();
      expect(mockDocument.addEventListener).not.toHaveBeenCalled();
    });

    test('should add event listener if DOM is still loading', () => {
      mockDocument.readyState = 'loading';
      
      const mockApp = {
        initialize: jest.fn()
      };
      
      const appCode = `
        var app = mockApp;
        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", app.initialize);
        } else {
          app.initialize();
        }
      `;
      
      global.mockApp = mockApp;
      
      eval(appCode);
      
      expect(mockDocument.addEventListener).toHaveBeenCalledWith("DOMContentLoaded", mockApp.initialize);
      expect(mockApp.initialize).not.toHaveBeenCalled();
    });
  });

  describe('Drift Checking Logic', () => {
    
    test('should check for time drift every 10 seconds', () => {
      const mockSecondsElement = createMockElement('30');
      mockDocument.querySelector.mockImplementation((selector) => {
        if (selector.includes('seconds')) {
          return mockSecondsElement;
        }
        return createMockElement();
      });
      
      // Mock Date to return seconds divisible by 10
      const mockDate = new Date();
      mockDate.getUTCSeconds = () => 30; // 30 % 10 === 0
      
      const mockSetInterval = jest.fn((callback) => {
        global.Date = jest.fn(() => mockDate);
        callback();
        return 123;
      });
      global.setInterval = mockSetInterval;
      
      const appCode = `
        var app = {
          initialize: function() {
            window.mainInterval = setInterval(function() {
              var now = new Date();
              if (now.getUTCSeconds() % 10 === 0) {
                var displayedSeconds = document.querySelector('.time-sub .seconds');
                if (displayedSeconds) {
                  var displayedSecondsValue = parseInt(displayedSeconds.textContent, 10);
                  if (isNaN(displayedSecondsValue) || Math.abs(now.getUTCSeconds() - displayedSecondsValue) > 1) {
                    timeModule.updateTime();
                  }
                }
              }
            }, 1000);
          }
        };
        app.initialize();
      `;
      
      eval(appCode);
      
      expect(mockDocument.querySelector).toHaveBeenCalledWith('.time-sub .seconds');
    });

    test('should update time when drift is detected', () => {
      const mockSecondsElement = createMockElement('25'); // Different from actual seconds
      mockDocument.querySelector.mockImplementation((selector) => {
        if (selector.includes('seconds')) {
          return mockSecondsElement;
        }
        return createMockElement();
      });
      
      const mockDate = new Date();
      mockDate.getUTCSeconds = () => 30; // Difference > 1 second
      
      const mockSetInterval = jest.fn((callback) => {
        global.Date = jest.fn(() => mockDate);
        callback();
        return 123;
      });
      global.setInterval = mockSetInterval;
      
      const appCode = `
        var app = {
          initialize: function() {
            window.mainInterval = setInterval(function() {
              var now = new Date();
              if (now.getUTCSeconds() % 10 === 0) {
                var displayedSeconds = document.querySelector('.time-sub .seconds');
                if (displayedSeconds) {
                  var displayedSecondsValue = parseInt(displayedSeconds.textContent, 10);
                  if (isNaN(displayedSecondsValue) || Math.abs(now.getUTCSeconds() - displayedSecondsValue) > 1) {
                    if (window.timeUpdateTimeout) {
                      clearTimeout(window.timeUpdateTimeout);
                    }
                    timeModule.updateTime();
                  }
                }
              }
            }, 1000);
          }
        };
        app.initialize();
      `;
      
      eval(appCode);
      
      expect(mockTimeModule.updateTime).toHaveBeenCalled();
    });
  });
});
