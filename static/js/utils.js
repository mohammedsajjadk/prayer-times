/**
 * Prayer Times Application - Utilities Module
 * Contains helper functions for time manipulation and DOM operations
 */

// Time utility functions
var timeUtils = {
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

// DOM helper functions
var domUtils = {
  hasClass: function(el, className) {
    if (el.classList) {
      return el.classList.contains(className);
    } else {
      return new RegExp('\\b' + className + '\\b').test(el.className);
    }
  },

  addClass: function(el, className) {
    if (el.classList) {
      el.classList.add(className);
    } else if (!this.hasClass(el, className)) {
      el.className += ' ' + className;
    }
  },

  removeClass: function(el, className) {
    if (el.classList) {
      el.classList.remove(className);
    } else {
      el.className = el.className.replace(new RegExp('\\b' + className + '\\b', 'g'), '');
    }
  }
};

// Date utility functions
var dateUtils = {
  // Detect if Ireland is currently in DST (summer time)
  isIrelandDST: function(date) {
    // Ireland's DST starts at 1am UTC on the last Sunday in March
    // and ends at 1am UTC on the last Sunday in October
    var year = date.getUTCFullYear();

    // Calculate last Sunday of March
    var lastDayMarch = new Date(Date.UTC(year, 2, 31)); // Start with March 31
    while (lastDayMarch.getUTCMonth() > 2) {
      // Adjust if we went to April (this happens because some months don't have 31 days)
      lastDayMarch = new Date(Date.UTC(year, 2, lastDayMarch.getUTCDate() - 1));
    }
    // Go back to the last Sunday
    while (lastDayMarch.getUTCDay() !== 0) {
      lastDayMarch = new Date(Date.UTC(year, 2, lastDayMarch.getUTCDate() - 1));
    }

    // Calculate last Sunday of October
    var lastDayOctober = new Date(Date.UTC(year, 9, 31)); // Start with October 31
    while (lastDayOctober.getUTCMonth() > 9) {
      // Adjust if we went to November
      lastDayOctober = new Date(Date.UTC(year, 9, lastDayOctober.getUTCDate() - 1));
    }
    // Go back to the last Sunday
    while (lastDayOctober.getUTCDay() !== 0) {
      lastDayOctober = new Date(Date.UTC(year, 9, lastDayOctober.getUTCDate() - 1));
    }

    // Set transition times (1am UTC)
    var dstStart = new Date(Date.UTC(year, lastDayMarch.getUTCMonth(),
      lastDayMarch.getUTCDate(), 1, 0, 0, 0));
    var dstEnd = new Date(Date.UTC(year, lastDayOctober.getUTCMonth(),
      lastDayOctober.getUTCDate(), 1, 0, 0, 0));

    // Get timestamp of the input date
    var timestamp = date.getTime();

    return timestamp >= dstStart.getTime() && timestamp < dstEnd.getTime();
  },
  
  // Get last Sunday of a given month
  getLastSundayOfMonth: function(year, month) {
    var date = new Date(year, month, 0); // Last day of the month

    // Move back until we reach a Sunday (day 0)
    while (date.getDay() !== 0) {
      date.setDate(date.getDate() - 1);
    }

    return date.getDate();
  },
  
  // Check if a date is the day before a clock change
  isDateBeforeClockChange: function(date, month, year) {
    // Last Sunday in March (day before Spring clock change)
    var lastSundayMarch = this.getLastSundayOfMonth(year, 3); // March is month 3
    var dayBeforeSpringChange = new Date(lastSundayMarch);
    dayBeforeSpringChange.setDate(dayBeforeSpringChange.getDate() - 1);

    // Last Sunday in October (day before Fall clock change)
    var lastSundayOctober = this.getLastSundayOfMonth(year, 10); // October is month 10
    var dayBeforeFallChange = new Date(lastSundayOctober);
    dayBeforeFallChange.setDate(dayBeforeFallChange.getDate() - 1);

    // Check if today is the day before a clock change
    var today = new Date(year, month - 1, date); // Adjust month back to 0-based
    return (
      (today.getDate() === dayBeforeSpringChange.getDate() && today.getMonth() === dayBeforeSpringChange.getMonth()) ||
      (today.getDate() === dayBeforeFallChange.getDate() && today.getMonth() === dayBeforeFallChange.getMonth())
    );
  },
  
  // Create a Date for a specific time on a specific day
  createDateWithTime: function(year, month, day, timeStr) {
    var date = new Date(Date.UTC(year, month, day));
    if (timeStr) {
      var parts = timeStr.split(':');
      if (parts.length === 2) {
        date.setUTCHours(parseInt(parts[0]), parseInt(parts[1]), 0, 0);
      }
    }
    return date;
  }
};
