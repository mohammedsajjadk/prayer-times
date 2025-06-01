/**
 * Prayer Times Application - Configuration Module
 * This file contains all the configuration settings for the prayer times application
 */

// Test mode configuration for development and debugging
var testMode = {
  enabled: false,          // Set to true to enable test mode
  time: "13:45",           // Format: "HH:MM" (24-hour format)
  dayOfWeek: 5,            // 0=Sunday, 1=Monday, ..., 5=Friday, 6=Saturday

  // Returns current time in minutes since midnight (overrides actual time when enabled)
  getCurrentTimeMinutes: function () {
    if (this.enabled) {
      const parts = this.time.split(":");
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    } else {
      const now = new Date();
      return now.getUTCHours() * 60 + now.getUTCMinutes();
    }
  },

  // Returns current day of week (overrides actual day when enabled)
  getCurrentDayOfWeek: function () {
    return this.enabled ? this.dayOfWeek : new Date().getDay();
  },

  // Gets a mock Date object for testing (limited functionality)
  getMockDate: function () {
    if (!this.enabled) return new Date();

    // Create a mock date based on the test time
    const now = new Date();
    const parts = this.time.split(":");
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);

    const mockDate = new Date();
    mockDate.setHours(hours);
    mockDate.setMinutes(minutes);
    mockDate.setSeconds(now.getSeconds());
    mockDate.setMilliseconds(now.getMilliseconds());

    // Override getDay method to return test day of week
    mockDate.getDay = () => this.dayOfWeek;

    // Also override getUTCDay to return the same test day
    mockDate.getUTCDay = () => this.dayOfWeek;

    // Override getUTCHours to return the same hours (no DST adjustment)
    mockDate.getUTCHours = () => hours;

    // Override getUTCMinutes
    mockDate.getUTCMinutes = () => minutes;

    // Override getUTCSeconds and getUTCMilliseconds
    mockDate.getUTCSeconds = () => now.getSeconds();
    mockDate.getUTCMilliseconds = () => now.getMilliseconds();

    // Override getTime - this value is still needed for comparison functions
    const timestamp = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      hours,
      minutes,
      now.getSeconds(),
      now.getMilliseconds()
    );
    mockDate.getTime = () => timestamp;

    return mockDate;
  }
};

// DOM selectors for the application
var selectors = {
  timeDisplay: ".time-display",
  prayerTimes: {
    fajrJamaah: ".jamaah .prayer-time-value:nth-child(2)",
    zohrJamaah: ".jamaah .prayer-time-value:nth-child(3)",
    asrJamaah: ".jamaah .prayer-time-value:nth-child(4)",
    magribJamaah: ".jamaah .prayer-time-value:nth-child(5)",
    ishaJamaah: ".jamaah .prayer-time-value:nth-child(6)",
    jumahJamaah: ".jamaah .prayer-time-value:nth-child(7)",
    fajrBeginning: ".beginning .prayer-time-value:nth-child(2)",
    zohrBeginning: ".beginning .prayer-time-value:nth-child(3)",
    asrBeginning: ".beginning .prayer-time-value:nth-child(4)",
    magribBeginning: ".beginning .prayer-time-value:nth-child(5)",
    ishaBeginning: ".beginning .prayer-time-value:nth-child(6)"
  },
  importantTimes: {
    sunrise: ".time-box:nth-child(2) .time-value",
    zawal: ".time-box:nth-child(3) .time-value"
  },
  announcement: "#announcement-text"
};

// Message toggle configuration
var messageToggle = {
  lastToggleTime: 0,
  showingAlternate: false,
  getToggleInterval: function(dayOfWeek) {
    // Return toggle interval in milliseconds
    // Thursday: 10 minutes, Friday: 5 minutes
    return (dayOfWeek === 4) ? 600000 : 300000; // 10min or 5min in milliseconds
  }
};
