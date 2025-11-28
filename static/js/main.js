/**
 * Prayer Times Application - Main Module
 * Coordinates the initialization and updates of all other modules
 */

// Main application object
var app = {  // Initialize the application
  initialize: function() {
    // Initialize test mode if enabled
    if (testMode.enabled) {
      testMode.start();
    }
    
    // Initial updates
    timeModule.updateTime();
    prayerModule.updateNextPrayer();
    announcementModule.updateAnnouncement();
    timeModule.convertTo12Hour();

    // Set initial Jumuah time based on Summer/Winter time on page load
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

    // Initialize theme system
    themeModule.init();

    // Store interval reference for cleanup
    window.mainInterval = setInterval(function() {
      // Handle regular UI updates
      prayerModule.updateNextPrayer();
      announcementModule.updateAnnouncement();
      timeModule.convertTo12Hour();
      prayerModule.updateJumuahTimes();
      prayerModule.updateToNextDayTimesIfNeeded();

      // Check for midnight refresh and 4:30 PM refresh
      var now = testMode.enabled ? testMode.getMockDate() : new Date();
      var isIrishSummerTime = dateUtils.isIrelandDST(now);
      var irishOffset = isIrishSummerTime ? 1 : 0;
      var irishHours = now.getUTCHours() + irishOffset;
      irishHours = irishHours >= 24 ? irishHours - 24 : irishHours;
      var irishMins = now.getUTCMinutes();
      var irishSecs = now.getUTCSeconds();

      // Check for fixed scheduled refreshes
      var shouldRefresh = (irishHours === 0 && irishMins === 0 && irishSecs <= 2) ||
                         (irishHours === 3 && irishMins === 30 && irishSecs <= 2) ||
                         (irishHours === 12 && irishMins === 30 && irishSecs <= 2) ||
                         (irishHours === 14 && irishMins === 12 && irishSecs <= 2) ||
                         (irishHours === 16 && irishMins === 30 && irishSecs <= 2) ||
                         (irishHours === 17 && irishMins === 30 && irishSecs <= 2) ||
                         (irishHours === 19 && irishMins === 45 && irishSecs <= 2) ||
                         (irishHours === 21 && irishMins === 15 && irishSecs <= 2);

      // Check for Friday 5-minute refresh between 13:48 and 15:45
      var currentDay = testMode.enabled ? testMode.dayOfWeek : now.getUTCDay();
      if (!testMode.enabled && irishHours < now.getUTCHours()) {
        currentDay = (currentDay + 1) % 7;
      }
      
      if (currentDay === 5 && irishSecs <= 2) { // Friday
        var currentTimeMinutes = irishHours * 60 + irishMins;
        var startTime = 13 * 60 + 48; // 13:48
        var endTime = 15 * 60 + 45;   // 15:45
        
        if (currentTimeMinutes >= startTime && currentTimeMinutes <= endTime) {
          // Check if current minute is a multiple of 5 from start time
          var minutesFromStart = currentTimeMinutes - startTime;
          if (minutesFromStart % 5 === 0) {
            shouldRefresh = true;
          }
        }
      }

      // Check for dynamic refreshes 30 minutes before each Jamaah time
      if (!shouldRefresh && irishSecs <= 2) {
        // Get current Jamaah times
        var jamaahTimes = [
          document.querySelector(".jamaah .prayer-time-value:nth-child(2)"), // Fajr
          document.querySelector(".jamaah .prayer-time-value:nth-child(3)"), // Zohr
          document.querySelector(".jamaah .prayer-time-value:nth-child(4)"), // Asr
          document.querySelector(".jamaah .prayer-time-value:nth-child(5)"), // Maghrib
          document.querySelector(".jamaah .prayer-time-value:nth-child(6)"), // Isha
          document.querySelector(".jamaah .prayer-time-value:nth-child(7)")  // Jumuah
        ];

        for (var i = 0; i < jamaahTimes.length; i++) {
          if (jamaahTimes[i]) {
            var jamaahTimeStr = jamaahTimes[i].getAttribute('data-time');
            if (jamaahTimeStr) {
              var jamaahParts = jamaahTimeStr.split(':');
              if (jamaahParts.length === 2) {
                var jamaahHour = parseInt(jamaahParts[0]);
                var jamaahMin = parseInt(jamaahParts[1]);
                
                // Calculate 30 minutes before
                var refreshMin = jamaahMin - 30;
                var refreshHour = jamaahHour;
                if (refreshMin < 0) {
                  refreshMin += 60;
                  refreshHour -= 1;
                  if (refreshHour < 0) {
                    refreshHour += 24;
                  }
                }
                
                // Check if current time matches refresh time (30 min before Jamaah)
                if (irishHours === refreshHour && irishMins === refreshMin) {
                  shouldRefresh = true;
                  break;
                }
              }
            }
          }
        }
      }

      if (shouldRefresh) {
        timeModule.persistentRefresh();
      }

      // Lighter drift checking - only once every 10 seconds
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

    // Force time sync every 30 seconds as a backup measure
    window.timeRefreshInterval = setInterval(function() {
      if (window.timeUpdateTimeout) {
        clearTimeout(window.timeUpdateTimeout);
      }
      timeModule.updateTime();
    }, 30000);
  }
};

// Start the application when the DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", app.initialize);
} else {
  app.initialize();
}
