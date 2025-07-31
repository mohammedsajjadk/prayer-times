/**
 * Prayer Times Application - Time Module
 * Handles clock display and time synchronization
 */

var timeModule = {
  // Updates the digital clock display
  updateTime: function() {
    var now = testMode.enabled ? testMode.getMockDate() : new Date();    // Get time components, applying Irish offset only when NOT in test mode
    var hours, minutes, seconds;

    if (testMode.enabled) {
      // In test mode: use progressing test time
      const testTime = testMode.getCurrentTestTime();
      hours = testTime.hours;
      minutes = testTime.minutes;
      seconds = testTime.seconds;
    } else {
      // Normal mode: apply Irish time offset
      var isIrishSummerTime = dateUtils.isIrelandDST(now);
      var irishOffset = isIrishSummerTime ? 1 : 0;
      hours = now.getUTCHours() + irishOffset;
      hours = hours >= 24 ? hours - 24 : hours; // Handle day wraparound
      minutes = now.getUTCMinutes();
      seconds = now.getUTCSeconds();
    }

    // Check if current time matches any jamaah time
    if (seconds === 0) {
      prayerModule.checkForJamaahTimeMatch(hours, minutes, seconds);
    }

    // Format for display (12-hour format)
    hours = hours % 12 || 12;
    var formattedMinutes = timeUtils.padNumber(minutes, 2);
    var formattedSeconds = timeUtils.padNumber(seconds, 2);

    // Update the elements
    var timeMain = document.querySelector('.time-main');
    var secondsEl = document.querySelector('.seconds');

    if (timeMain) {
      timeMain.textContent = hours + ':' + formattedMinutes;
    }

    if (secondsEl) {
      secondsEl.textContent = formattedSeconds;
    }

    // Schedule next update
    if (window.timeUpdateTimeout) {
      clearTimeout(window.timeUpdateTimeout);
    }

    // Calculate time to next second
    var millisToNextSecond = 1000 - now.getUTCMilliseconds();
    millisToNextSecond = Math.max(millisToNextSecond, 10);

    // Schedule next update
    window.timeUpdateTimeout = setTimeout(timeModule.updateTime, millisToNextSecond);
  },
  
  // Convert 24-hour format prayer times to 12-hour format for display
  convertTo12Hour: function() {
    var elements = document.querySelectorAll(".prayer-time-value.beginning, .prayer-time-value.jamaah");
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      var time = el.getAttribute("data-time");
      if (time && time.indexOf(":") !== -1) {
        var parts = time.split(":");
        var hours = parseInt(parts[0]);
        var minutes = parseInt(parts[1]);
        if (!isNaN(hours) && !isNaN(minutes)) {
          var hours12 = hours % 12 || 12;
          el.textContent = hours12 + ":" + timeUtils.padNumber(minutes, 2);
        }
      }
    }
    
    // Explicitly convert important times (including Zawal)
    var importantTimes = document.querySelectorAll(".time-box .time-value");
    for (var i = 0; i < importantTimes.length; i++) {
      var el = importantTimes[i];
      var time = el.getAttribute("data-time");
      if (time && time.indexOf(":") !== -1) {
        var parts = time.split(":");
        var hours = parseInt(parts[0]);
        var minutes = parseInt(parts[1]);
        if (!isNaN(hours) && !isNaN(minutes)) {
          var hours12 = hours % 12 || 12;
          el.textContent = hours12 + ":" + timeUtils.padNumber(minutes, 2);
        }
      }
    }
  },
  
  // Handle page refresh at specific times (midnight and 4:30 PM)
  forceMidnightRefresh: function() {
    var now = testMode.enabled ? testMode.getMockDate() : new Date();

    // Get Irish time
    var isIrishSummerTime = dateUtils.isIrelandDST(now);
    var irishOffset = isIrishSummerTime ? 1 : 0;
    var irishHours = now.getUTCHours() + irishOffset;
    irishHours = irishHours >= 24 ? irishHours - 24 : irishHours;
    var irishMins = now.getUTCMinutes();
    var irishSecs = now.getUTCSeconds();

    if ((irishHours === 0 && irishMins === 0 && irishSecs <= 2) ||
        (irishHours === 3 && irishMins === 30 && irishSecs <= 2)||
        (irishHours === 12 && irishMins === 30 && irishSecs <= 2)||
        (irishHours === 14 && irishMins === 12 && irishSecs <= 2)||
        (irishHours === 16 && irishMins === 30 && irishSecs <= 2) ||
        (irishHours === 19 && irishMins === 45 && irishSecs <= 2) ||
        (irishHours === 21 && irishMins === 15 && irishSecs <= 2)) {
      this.persistentRefresh();
    }
  },
  
  // Keep trying to refresh the page until successful
  persistentRefresh: function() {
    var retryInterval = 30000;
    var url = window.location.pathname + "?t=" + new Date().getTime();

    function tryRefresh() {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            window.location.reload(true);
          } else {
            setTimeout(tryRefresh, retryInterval);
          }
        }
      };
      xhr.send();
    }

    tryRefresh();
  }
};
