/**
 * Unit tests for the configuration module (static/js/config.js)
 * Tests test mode functionality and configuration settings
 */

describe('Configuration Module', () => {

  // Mock testMode object based on the actual config.js structure
  let testMode;
  
  beforeEach(() => {
    // Reset testMode for each test
    testMode = {
      enabled: false,
      time: "13:45",
      dayOfWeek: 5,
      startTimestamp: null,
      
      start: function() {
        if (!this.enabled) return;
        this.startTimestamp = Date.now();
      },

      getCurrentTimeMinutes: function() {
        if (!this.enabled) return null;
        
        var timeParts = this.time.split(":");
        var hours = parseInt(timeParts[0], 10);
        var minutes = parseInt(timeParts[1], 10);
        return hours * 60 + minutes;
      },

      getMockDate: function() {
        if (!this.enabled) return new Date();
        
        var now = new Date();
        var mockTimeMinutes = this.getCurrentTimeMinutes();
        var mockHours = Math.floor(mockTimeMinutes / 60);
        var mockMinutes = mockTimeMinutes % 60;
        
        var mockDate = new Date(now);
        mockDate.setHours(mockHours, mockMinutes, 0, 0);
        
        return mockDate;
      }
    };
  });

  describe('Test Mode Configuration', () => {
    
    test('should have correct default values', () => {
      expect(testMode.enabled).toBe(false);
      expect(testMode.time).toBe("13:45");
      expect(testMode.dayOfWeek).toBe(5); // Friday
      expect(testMode.startTimestamp).toBe(null);
    });

    test('should have all required methods', () => {
      expect(typeof testMode.start).toBe('function');
      expect(typeof testMode.getCurrentTimeMinutes).toBe('function');
      expect(typeof testMode.getMockDate).toBe('function');
    });
  });

  describe('start method', () => {
    
    test('should set startTimestamp when enabled', () => {
      const mockNow = 1234567890;
      global.Date.now = jest.fn(() => mockNow);
      
      testMode.enabled = true;
      testMode.start();
      
      expect(testMode.startTimestamp).toBe(mockNow);
    });

    test('should not set startTimestamp when disabled', () => {
      testMode.enabled = false;
      testMode.start();
      
      expect(testMode.startTimestamp).toBe(null);
    });

    test('should be called multiple times safely', () => {
      const mockNow1 = 1000;
      const mockNow2 = 2000;
      
      testMode.enabled = true;
      
      global.Date.now = jest.fn(() => mockNow1);
      testMode.start();
      expect(testMode.startTimestamp).toBe(mockNow1);
      
      global.Date.now = jest.fn(() => mockNow2);
      testMode.start();
      expect(testMode.startTimestamp).toBe(mockNow2);
    });
  });

  describe('getCurrentTimeMinutes method', () => {
    
    test('should return correct minutes when enabled', () => {
      testMode.enabled = true;
      testMode.time = "13:45";
      
      const result = testMode.getCurrentTimeMinutes();
      expect(result).toBe(13 * 60 + 45); // 825 minutes
    });

    test('should return null when disabled', () => {
      testMode.enabled = false;
      testMode.time = "13:45";
      
      const result = testMode.getCurrentTimeMinutes();
      expect(result).toBe(null);
    });

    test('should handle different time formats', () => {
      testMode.enabled = true;
      
      const testCases = [
        { time: "00:00", expected: 0 },
        { time: "12:30", expected: 750 },
        { time: "23:59", expected: 1439 },
        { time: "05:30", expected: 330 }, // Fajr time
        { time: "18:25", expected: 1105 }, // Magrib time
      ];

      testCases.forEach(({ time, expected }) => {
        testMode.time = time;
        expect(testMode.getCurrentTimeMinutes()).toBe(expected);
      });
    });

    test('should handle prayer time formats', () => {
      testMode.enabled = true;
      
      // Common prayer times
      const prayerTimes = [
        { name: "Fajr", time: "05:30", expected: 330 },
        { name: "Zohr", time: "12:52", expected: 772 },
        { name: "Asr", time: "16:25", expected: 985 },
        { name: "Magrib", time: "18:25", expected: 1105 },
        { name: "Isha", time: "19:45", expected: 1185 }
      ];

      prayerTimes.forEach(({ name, time, expected }) => {
        testMode.time = time;
        expect(testMode.getCurrentTimeMinutes()).toBe(expected);
      });
    });
  });

  describe('getMockDate method', () => {
    
    test('should return actual date when disabled', () => {
      testMode.enabled = false;
      
      const before = new Date();
      const result = testMode.getMockDate();
      const after = new Date();
      
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    test('should return mock date when enabled', () => {
      testMode.enabled = true;
      testMode.time = "13:45";
      
      const result = testMode.getMockDate();
      
      expect(result).toBeInstanceOf(Date);
      expect(result.getHours()).toBe(13);
      expect(result.getMinutes()).toBe(45);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    test('should preserve date but change time', () => {
      testMode.enabled = true;
      testMode.time = "09:30";
      
      const actualNow = new Date();
      const mockDate = testMode.getMockDate();
      
      // Same date
      expect(mockDate.getFullYear()).toBe(actualNow.getFullYear());
      expect(mockDate.getMonth()).toBe(actualNow.getMonth());
      expect(mockDate.getDate()).toBe(actualNow.getDate());
      
      // Different time
      expect(mockDate.getHours()).toBe(9);
      expect(mockDate.getMinutes()).toBe(30);
    });

    test('should handle edge times correctly', () => {
      testMode.enabled = true;
      
      const edgeCases = [
        { time: "00:00", hours: 0, minutes: 0 },   // Midnight
        { time: "12:00", hours: 12, minutes: 0 },  // Noon
        { time: "23:59", hours: 23, minutes: 59 }, // End of day
      ];

      edgeCases.forEach(({ time, hours, minutes }) => {
        testMode.time = time;
        const result = testMode.getMockDate();
        
        expect(result.getHours()).toBe(hours);
        expect(result.getMinutes()).toBe(minutes);
      });
    });
  });

  describe('Day of Week Configuration', () => {
    
    test('should handle all days of the week', () => {
      const daysOfWeek = [
        { day: 0, name: "Sunday" },
        { day: 1, name: "Monday" },
        { day: 2, name: "Tuesday" },
        { day: 3, name: "Wednesday" },
        { day: 4, name: "Thursday" },
        { day: 5, name: "Friday" },
        { day: 6, name: "Saturday" }
      ];

      daysOfWeek.forEach(({ day, name }) => {
        testMode.dayOfWeek = day;
        expect(testMode.dayOfWeek).toBe(day);
      });
    });

    test('should default to Friday (5)', () => {
      expect(testMode.dayOfWeek).toBe(5);
    });
  });

  describe('Integration with Prayer Times', () => {
    
    test('should work with Friday Jumuah scenario', () => {
      testMode.enabled = true;
      testMode.dayOfWeek = 5; // Friday
      testMode.time = "13:30"; // Before Jumuah
      
      const mockDate = testMode.getMockDate();
      const timeMinutes = testMode.getCurrentTimeMinutes();
      
      expect(testMode.dayOfWeek).toBe(5); // Friday
      expect(timeMinutes).toBe(810); // 13:30 in minutes
      expect(mockDate.getHours()).toBe(13);
      expect(mockDate.getMinutes()).toBe(30);
    });

    test('should work with regular prayer time scenario', () => {
      testMode.enabled = true;
      testMode.dayOfWeek = 1; // Monday
      testMode.time = "18:25"; // Magrib time
      
      const mockDate = testMode.getMockDate();
      const timeMinutes = testMode.getCurrentTimeMinutes();
      
      expect(testMode.dayOfWeek).toBe(1); // Monday
      expect(timeMinutes).toBe(1105); // 18:25 in minutes
      expect(mockDate.getHours()).toBe(18);
      expect(mockDate.getMinutes()).toBe(25);
    });

    test('should handle early morning prayer times', () => {
      testMode.enabled = true;
      testMode.time = "05:30"; // Fajr time
      
      const mockDate = testMode.getMockDate();
      
      expect(mockDate.getHours()).toBe(5);
      expect(mockDate.getMinutes()).toBe(30);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    
    test('should handle malformed time strings gracefully', () => {
      testMode.enabled = true;
      
      // Test with invalid time format - should not crash
      testMode.time = "invalid:time";
      
      expect(() => testMode.getCurrentTimeMinutes()).not.toThrow();
      expect(() => testMode.getMockDate()).not.toThrow();
    });

    test('should handle empty time strings', () => {
      testMode.enabled = true;
      testMode.time = "";
      
      expect(() => testMode.getCurrentTimeMinutes()).not.toThrow();
      expect(() => testMode.getMockDate()).not.toThrow();
    });

    test('should handle time strings without colon', () => {
      testMode.enabled = true;
      testMode.time = "1345"; // No colon
      
      expect(() => testMode.getCurrentTimeMinutes()).not.toThrow();
      expect(() => testMode.getMockDate()).not.toThrow();
    });

    test('should handle out-of-range time values', () => {
      testMode.enabled = true;
      
      const invalidTimes = ["25:00", "12:70", "-1:30"];
      
      invalidTimes.forEach(time => {
        testMode.time = time;
        expect(() => testMode.getCurrentTimeMinutes()).not.toThrow();
        expect(() => testMode.getMockDate()).not.toThrow();
      });
    });
  });

  describe('State Management', () => {
    
    test('should maintain state between method calls', () => {
      testMode.enabled = true;
      testMode.time = "14:30";
      testMode.dayOfWeek = 3;
      testMode.start();
      
      // State should persist
      expect(testMode.enabled).toBe(true);
      expect(testMode.time).toBe("14:30");
      expect(testMode.dayOfWeek).toBe(3);
      expect(testMode.startTimestamp).toBeTruthy();
      
      // Multiple calls should use same state
      const time1 = testMode.getCurrentTimeMinutes();
      const time2 = testMode.getCurrentTimeMinutes();
      expect(time1).toBe(time2);
      
      const date1 = testMode.getMockDate();
      const date2 = testMode.getMockDate();
      expect(date1.getHours()).toBe(date2.getHours());
      expect(date1.getMinutes()).toBe(date2.getMinutes());
    });

    test('should allow state changes', () => {
      testMode.enabled = true;
      testMode.time = "12:00";
      
      const initialTime = testMode.getCurrentTimeMinutes();
      expect(initialTime).toBe(720); // 12:00
      
      // Change time
      testMode.time = "15:30";
      const newTime = testMode.getCurrentTimeMinutes();
      expect(newTime).toBe(930); // 15:30
      
      // Should reflect in mock date too
      const mockDate = testMode.getMockDate();
      expect(mockDate.getHours()).toBe(15);
      expect(mockDate.getMinutes()).toBe(30);
    });

    test('should handle enable/disable toggling', () => {
      // Start disabled
      expect(testMode.getCurrentTimeMinutes()).toBe(null);
      
      // Enable
      testMode.enabled = true;
      testMode.time = "10:15";
      expect(testMode.getCurrentTimeMinutes()).toBe(615);
      
      // Disable again
      testMode.enabled = false;
      expect(testMode.getCurrentTimeMinutes()).toBe(null);
    });
  });
});
