/**
 * Prayer Times Application - Configuration Module
 * This file contains all the configuration settings for the prayer times application
 */

// Test mode configuration for development and debugging
var testMode = {
  enabled: false,          // Set to true to enable test mode
  time: "13:45",           // Format: "HH:MM" (24-hour format)
  dayOfWeek: 5,            // 0=Sunday, 1=Monday, ..., 5=Friday, 6=Saturday
  startTimestamp: null,    // When test mode was started (real timestamp)
  
  // Initialize test mode with current real time as reference
  start: function() {
    if (!this.enabled) return;
    this.startTimestamp = Date.now();
  },

  // Returns current time in minutes since midnight (overrides actual time when enabled)
  getCurrentTimeMinutes: function () {
    if (this.enabled) {
      const currentTestTime = this.getCurrentTestTime();
      return currentTestTime.hours * 60 + currentTestTime.minutes;
    } else {
      const now = new Date();
      return now.getUTCHours() * 60 + now.getUTCMinutes();
    }
  },

  // Calculate current test time based on elapsed time since start
  getCurrentTestTime: function() {
    if (!this.enabled || !this.startTimestamp) {
      // If not properly initialized, start now
      this.start();
    }
    
    // Calculate elapsed time since test mode started
    const now = Date.now();
    const elapsedMs = now - this.startTimestamp;
    const elapsedMinutes = Math.floor(elapsedMs / (60 * 1000));
    const elapsedSeconds = Math.floor((elapsedMs % (60 * 1000)) / 1000);
    
    // Parse initial test time
    const parts = this.time.split(":");
    const initialHours = parseInt(parts[0]);
    const initialMinutes = parseInt(parts[1]);
    
    // Add elapsed time to initial time
    const totalMinutes = initialHours * 60 + initialMinutes + elapsedMinutes;
    const currentHours = Math.floor(totalMinutes / 60) % 24;
    const currentMinutes = totalMinutes % 60;
    const currentSeconds = elapsedSeconds;
    
    return {
      hours: currentHours,
      minutes: currentMinutes,
      seconds: currentSeconds
    };
  },

  // Returns current day of week (overrides actual day when enabled)
  getCurrentDayOfWeek: function () {
    return this.enabled ? this.dayOfWeek : new Date().getDay();
  },

  // Gets a mock Date object for testing (limited functionality)
  getMockDate: function () {
    if (!this.enabled) return new Date();

    // Initialize if not done yet
    if (!this.startTimestamp) {
      this.start();
    }

    // Get current progressing test time
    const testTime = this.getCurrentTestTime();
    const now = new Date();

    const mockDate = new Date();
    mockDate.setHours(testTime.hours);
    mockDate.setMinutes(testTime.minutes);
    mockDate.setSeconds(testTime.seconds);
    mockDate.setMilliseconds(now.getMilliseconds());

    // Override getDay method to return test day of week
    mockDate.getDay = () => this.dayOfWeek;

    // Also override getUTCDay to return the same test day
    mockDate.getUTCDay = () => this.dayOfWeek;

    // Override getUTCHours to return the progressing hours
    mockDate.getUTCHours = () => testTime.hours;

    // Override getUTCMinutes to return the progressing minutes
    mockDate.getUTCMinutes = () => testTime.minutes;

    // Override getUTCSeconds to return the progressing seconds
    mockDate.getUTCSeconds = () => testTime.seconds;
    mockDate.getUTCMilliseconds = () => now.getMilliseconds();

    // Override getTime - this value is still needed for comparison functions
    const timestamp = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      testTime.hours,
      testTime.minutes,
      testTime.seconds,
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
