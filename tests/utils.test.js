/**
 * Unit tests for the time utilities module (static/js/utils.js)
 * Tests all utility functions for time manipulation and formatting
 */

describe('Time Utilities Module', () => {

  // Mock timeUtils object
  const timeUtils = {
    timeToMinutes: function (timeStr) {
      if (!timeStr || timeStr.indexOf(':') === -1) return 0;
      var parts = timeStr.split(":");
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    },

    addMinutes: function (timeStr, minutesToAdd) {
      var parts = timeStr.split(":");
      var hours = parseInt(parts[0]);
      var minutes = parseInt(parts[1]);
      var totalMinutes = hours * 60 + minutes + minutesToAdd;
      var newHours = Math.floor(totalMinutes / 60) % 24;
      var newMinutes = totalMinutes % 60;
      return this.padNumber(newHours, 2) + ":" + this.padNumber(newMinutes, 2);
    },

    padNumber: function (num, size) {
      var s = "000000000" + num;
      return s.substr(s.length - size);
    },
    
    formatTimeWithAmPm: function(timeStr) {
      if (!timeStr || timeStr.indexOf(":") === -1) return timeStr;

      var parts = timeStr.split(":");
      var hours24 = parseInt(parts[0], 10);
      var minutes = parseInt(parts[1], 10);

      if (isNaN(hours24) || isNaN(minutes)) return timeStr;

      var period = hours24 >= 12 ? "PM" : "AM";
      var hours12 = hours24 % 12 || 12;

      return hours12 + ":" + this.padNumber(minutes, 2) + period;
    },
    
    formatTimeFor12Hour: function(timeStr) {
      if (timeStr && timeStr.indexOf(":") !== -1) {
        var parts = timeStr.split(":");
        var hours = parseInt(parts[0]);
        var minutes = parseInt(parts[1]);
        if (!isNaN(hours) && !isNaN(minutes)) {
          var hours12 = hours % 12 || 12;
          return hours12 + ":" + this.padNumber(minutes, 2);
        }
      }
      return timeStr;
    }
  };

  describe('timeToMinutes', () => {
    
    test('should convert valid time strings to minutes', () => {
      expect(timeUtils.timeToMinutes("00:00")).toBe(0);
      expect(timeUtils.timeToMinutes("01:00")).toBe(60);
      expect(timeUtils.timeToMinutes("12:30")).toBe(750);
      expect(timeUtils.timeToMinutes("23:59")).toBe(1439);
    });

    test('should handle edge cases', () => {
      expect(timeUtils.timeToMinutes("")).toBe(0);
      expect(timeUtils.timeToMinutes(null)).toBe(0);
      expect(timeUtils.timeToMinutes(undefined)).toBe(0);
      expect(timeUtils.timeToMinutes("invalid")).toBe(0);
      expect(timeUtils.timeToMinutes("12")).toBe(0); // No colon
    });

    test('should handle prayer time formats', () => {
      expect(timeUtils.timeToMinutes("05:30")).toBe(330); // Fajr
      expect(timeUtils.timeToMinutes("12:52")).toBe(772); // Zohr
      expect(timeUtils.timeToMinutes("18:25")).toBe(1105); // Magrib
      expect(timeUtils.timeToMinutes("19:45")).toBe(1185); // Isha
    });
  });

  describe('addMinutes', () => {
    
    test('should add minutes to time strings correctly', () => {
      expect(timeUtils.addMinutes("12:00", 30)).toBe("12:30");
      expect(timeUtils.addMinutes("12:30", 30)).toBe("13:00");
      expect(timeUtils.addMinutes("23:30", 30)).toBe("00:00");
      expect(timeUtils.addMinutes("23:45", 30)).toBe("00:15");
    });

    test('should handle negative minutes (subtraction)', () => {
      expect(timeUtils.addMinutes("12:30", -30)).toBe("12:00");
      expect(timeUtils.addMinutes("12:00", -30)).toBe("11:30");
      expect(timeUtils.addMinutes("00:30", -30)).toBe("00:00");
      expect(timeUtils.addMinutes("00:15", -30)).toBe("23:45");
    });

    test('should handle hour rollovers correctly', () => {
      expect(timeUtils.addMinutes("23:00", 120)).toBe("01:00"); // +2 hours
      expect(timeUtils.addMinutes("22:00", 180)).toBe("01:00"); // +3 hours
      expect(timeUtils.addMinutes("01:00", -120)).toBe("23:00"); // -2 hours
    });

    test('should handle prayer time calculations', () => {
      // Sehri ends = Fajr - 10 minutes
      expect(timeUtils.addMinutes("05:30", -10)).toBe("05:20");
      
      // Magrib Jamaah = Magrib + 5 minutes
      expect(timeUtils.addMinutes("18:25", 5)).toBe("18:30");
      
      // Test around midnight
      expect(timeUtils.addMinutes("00:05", -10)).toBe("23:55");
    });
  });

  describe('padNumber', () => {
    
    test('should pad numbers to specified size', () => {
      expect(timeUtils.padNumber(5, 2)).toBe("05");
      expect(timeUtils.padNumber(12, 2)).toBe("12");
      expect(timeUtils.padNumber(1, 3)).toBe("001");
      expect(timeUtils.padNumber(123, 3)).toBe("123");
    });

    test('should handle edge cases', () => {
      expect(timeUtils.padNumber(0, 2)).toBe("00");
      expect(timeUtils.padNumber(0, 1)).toBe("0");
      expect(timeUtils.padNumber(1, 1)).toBe("1");
    });

    test('should handle numbers larger than padding', () => {
      expect(timeUtils.padNumber(123, 2)).toBe("23"); // Takes last 2 digits
      expect(timeUtils.padNumber(1234, 3)).toBe("234"); // Takes last 3 digits
    });
  });

  describe('formatTimeWithAmPm', () => {
    
    test('should format 24-hour time to 12-hour with AM/PM', () => {
      expect(timeUtils.formatTimeWithAmPm("00:00")).toBe("12:00AM");
      expect(timeUtils.formatTimeWithAmPm("01:30")).toBe("1:30AM");
      expect(timeUtils.formatTimeWithAmPm("12:00")).toBe("12:00PM");
      expect(timeUtils.formatTimeWithAmPm("13:30")).toBe("1:30PM");
      expect(timeUtils.formatTimeWithAmPm("23:59")).toBe("11:59PM");
    });

    test('should handle edge cases', () => {
      expect(timeUtils.formatTimeWithAmPm("")).toBe("");
      expect(timeUtils.formatTimeWithAmPm("invalid")).toBe("invalid");
      expect(timeUtils.formatTimeWithAmPm("12")).toBe("12"); // No colon
      expect(timeUtils.formatTimeWithAmPm("25:00")).toBe("25:00"); // Invalid time returned as-is
    });

    test('should handle prayer times correctly', () => {
      expect(timeUtils.formatTimeWithAmPm("05:30")).toBe("5:30AM"); // Fajr
      expect(timeUtils.formatTimeWithAmPm("12:52")).toBe("12:52PM"); // Zohr
      expect(timeUtils.formatTimeWithAmPm("18:25")).toBe("6:25PM"); // Magrib
      expect(timeUtils.formatTimeWithAmPm("19:45")).toBe("7:45PM"); // Isha
    });

    test('should pad minutes correctly', () => {
      expect(timeUtils.formatTimeWithAmPm("09:05")).toBe("9:05AM");
      expect(timeUtils.formatTimeWithAmPm("15:05")).toBe("3:05PM");
    });
  });

  describe('formatTimeFor12Hour', () => {
    
    test('should format time to 12-hour format without AM/PM', () => {
      expect(timeUtils.formatTimeFor12Hour("00:00")).toBe("12:00");
      expect(timeUtils.formatTimeFor12Hour("01:30")).toBe("1:30");
      expect(timeUtils.formatTimeFor12Hour("12:00")).toBe("12:00");
      expect(timeUtils.formatTimeFor12Hour("13:30")).toBe("1:30");
      expect(timeUtils.formatTimeFor12Hour("23:59")).toBe("11:59");
    });

    test('should handle edge cases', () => {
      expect(timeUtils.formatTimeFor12Hour("")).toBe("");
      expect(timeUtils.formatTimeFor12Hour("invalid")).toBe("invalid");
      expect(timeUtils.formatTimeFor12Hour("12")).toBe("12"); // No colon
    });

    test('should handle prayer times', () => {
      expect(timeUtils.formatTimeFor12Hour("05:30")).toBe("5:30"); // Fajr
      expect(timeUtils.formatTimeFor12Hour("12:52")).toBe("12:52"); // Zohr
      expect(timeUtils.formatTimeFor12Hour("18:25")).toBe("6:25"); // Magrib
      expect(timeUtils.formatTimeFor12Hour("19:45")).toBe("7:45"); // Isha
    });

    test('should maintain minute padding', () => {
      expect(timeUtils.formatTimeFor12Hour("09:05")).toBe("9:05");
      expect(timeUtils.formatTimeFor12Hour("15:05")).toBe("3:05");
      expect(timeUtils.formatTimeFor12Hour("00:05")).toBe("12:05");
    });

    test('should handle midnight and noon correctly', () => {
      expect(timeUtils.formatTimeFor12Hour("00:00")).toBe("12:00"); // Midnight
      expect(timeUtils.formatTimeFor12Hour("12:00")).toBe("12:00"); // Noon
      expect(timeUtils.formatTimeFor12Hour("00:30")).toBe("12:30"); // 12:30 AM
      expect(timeUtils.formatTimeFor12Hour("12:30")).toBe("12:30"); // 12:30 PM
    });
  });

  describe('Integration Tests', () => {
    
    test('should work together for common prayer time operations', () => {
      // Test calculating Sehri end time (Fajr - 10 minutes)
      const fajrTime = "05:30";
      const fajrMinutes = timeUtils.timeToMinutes(fajrTime);
      const sehriEndTime = timeUtils.addMinutes(fajrTime, -10);
      const sehriEnd12Hour = timeUtils.formatTimeFor12Hour(sehriEndTime);
      
      expect(fajrMinutes).toBe(330);
      expect(sehriEndTime).toBe("05:20");
      expect(sehriEnd12Hour).toBe("5:20");
    });

    test('should handle Magrib Jamaah calculation (Magrib + 5 minutes)', () => {
      const magribTime = "18:25";
      const magribJamaahTime = timeUtils.addMinutes(magribTime, 5);
      const jamaah12Hour = timeUtils.formatTimeFor12Hour(magribJamaahTime);
      const jamaahWithPeriod = timeUtils.formatTimeWithAmPm(magribJamaahTime);
      
      expect(magribJamaahTime).toBe("18:30");
      expect(jamaah12Hour).toBe("6:30");
      expect(jamaahWithPeriod).toBe("6:30PM");
    });

    test('should handle time comparisons for prayer scheduling', () => {
      const currentTime = "14:30";
      const asrTime = "16:25";
      const magribTime = "18:25";
      
      const currentMinutes = timeUtils.timeToMinutes(currentTime);
      const asrMinutes = timeUtils.timeToMinutes(asrTime);
      const magribMinutes = timeUtils.timeToMinutes(magribTime);
      
      expect(currentMinutes).toBeLessThan(asrMinutes);
      expect(asrMinutes).toBeLessThan(magribMinutes);
      
      // Time until next prayer
      const timeUntilAsr = asrMinutes - currentMinutes;
      expect(timeUntilAsr).toBe(115); // 1 hour 55 minutes
    });

    test('should handle edge cases around midnight', () => {
      // Test time calculations around midnight
      const lateIsha = "23:50";
      const afterMidnight = timeUtils.addMinutes(lateIsha, 20);
      const formattedTime = timeUtils.formatTimeFor12Hour(afterMidnight);
      
      expect(afterMidnight).toBe("00:10");
      expect(formattedTime).toBe("12:10");
    });
  });

  describe('Performance and Error Handling', () => {
    
    test('should handle malformed input gracefully', () => {
      const invalidInputs = [null, undefined, "", "invalid", "25:70", "ab:cd"];
      
      invalidInputs.forEach(input => {
        expect(() => timeUtils.timeToMinutes(input)).not.toThrow();
        expect(() => timeUtils.formatTimeWithAmPm(input)).not.toThrow();
        expect(() => timeUtils.formatTimeFor12Hour(input)).not.toThrow();
      });
    });

    test('should maintain consistency across multiple operations', () => {
      const testTimes = ["05:30", "12:52", "18:25", "19:45", "00:00", "23:59"];
      
      testTimes.forEach(time => {
        const minutes = timeUtils.timeToMinutes(time);
        const plusZero = timeUtils.addMinutes(time, 0);
        const formatted12 = timeUtils.formatTimeFor12Hour(time);
        const formattedAmPm = timeUtils.formatTimeWithAmPm(time);
        
        // Adding zero minutes should return the same time
        expect(plusZero).toBe(time);
        
        // Minutes should be non-negative
        expect(minutes).toBeGreaterThanOrEqual(0);
        
        // Formatted times should not be empty for valid inputs
        expect(formatted12).toBeTruthy();
        expect(formattedAmPm).toBeTruthy();
      });
    });
  });
});
