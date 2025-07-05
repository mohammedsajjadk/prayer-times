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

      if ((irishHours === 0 && irishMins === 0 && irishSecs <= 2) ||
          (irishHours === 3 && irishMins === 30 && irishSecs <= 2) ||
          (irishHours === 12 && irishMins === 30 && irishSecs <= 2) ||
          (irishHours === 16 && irishMins === 30 && irishSecs <= 2) ||
          (irishHours === 19 && irishMins === 45 && irishSecs <= 2) ||
          (irishHours === 21 && irishMins === 15 && irishSecs <= 2)) {
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
