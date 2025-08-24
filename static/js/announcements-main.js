/**
 * Prayer Times Application - Main Announcement Module (Refactored)
 * Orchestrates announcements using modular components
 */

var announcementModule = {
  init: function () {
    // Initialize all sub-modules
    DynamicAnnouncementsManager.init();
    DisplayStateManager.reset();
    MessageDisplayManager.reset();
  },

  // Update the announcement message based on current time and special events
  updateAnnouncement: function () {
    var now = testMode.enabled ? testMode.getMockDate() : new Date();
    var currentTime = this.getCurrentTimeMinutes(now);
    var currentDay = this.getCurrentDay(now);
    var dayOfWeek = currentDay;

    // Determine if it's summer or winter time
    var isIrishSummerTime = dateUtils.isIrelandDST(now);

    // Get prayer times
    var times = this.getPrayerTimes();
    var jamaahTimes = this.getJamaahTimes(times);

    var message = AnnouncementData.default;
    var isWarning = false;
    var isSpecialAnnouncement = false;
    var imageData = null;

    // First check if Adhkar should be displayed - this takes precedence over dynamic announcements
    var adhkarDisplay = AdhkarDisplayManager.handleAdhkarDisplay(
      currentTime,
      dayOfWeek,
      isIrishSummerTime,
      jamaahTimes
    );

    if (adhkarDisplay.shouldDisplay) {
      // If Adhkar should be displayed, it takes priority
      // Don't process other announcements now
      return;
    }

    // Check for any dynamic announcements
    var activeDynamicAnnouncement = DynamicAnnouncementsManager.getActiveAnnouncements(now);
    if (activeDynamicAnnouncement) {
      // Handle text announcement
      if (activeDynamicAnnouncement.textAnnouncement) {
        message =
          activeDynamicAnnouncement.textAnnouncement.message ||
          AnnouncementData.default;
        isSpecialAnnouncement =
          activeDynamicAnnouncement.textAnnouncement.isSpecial;
      }

      // Handle image announcement separately (can exist alongside text)
      if (activeDynamicAnnouncement.imageAnnouncement) {
        imageData = {
          images: activeDynamicAnnouncement.imageAnnouncement.images,
          displayCondition:
            activeDynamicAnnouncement.imageAnnouncement.displayCondition,
          isSpecial: activeDynamicAnnouncement.imageAnnouncement.isSpecial,
        };
      }
    }
    // If no dynamic announcement, use standard recurring announcements
    else {
      message = this.getRecurringAnnouncement(
        dayOfWeek,
        currentTime,
        isIrishSummerTime,
        jamaahTimes
      );
    }

    // Check for warnings (which take precedence over any other messages)
    var warningResult = this.checkForWarnings(currentTime, times);
    if (warningResult.isWarning) {
      message = warningResult.message;
      isWarning = true;
      isSpecialAnnouncement = false;
    }

    // Update the announcement display
    MessageDisplayManager.updateAnnouncementText(message, isWarning, isSpecialAnnouncement);

    // Process image announcement separately - even if there's a text announcement
    if (imageData && !isWarning) {
      ImageDisplayManager.handleImageAnnouncement(imageData, currentTime, [
        jamaahTimes.fajrJamaah,
        jamaahTimes.zohrJamaah,
        jamaahTimes.asrJamaah,
        jamaahTimes.magribJamaah,
        jamaahTimes.ishaJamaah,
      ]);
    }
  },

  // Get current time in minutes from midnight
  getCurrentTimeMinutes: function (now) {
    var currentTime;
    if (testMode.enabled) {
      // In test mode, use progressing test time
      currentTime = testMode.getCurrentTimeMinutes();
    } else {
      // Normal mode: apply Irish time offset
      var isIrishSummerTime = dateUtils.isIrelandDST(now);
      var irishOffset = isIrishSummerTime ? 1 : 0;
      var irishHours = now.getUTCHours() + irishOffset;
      irishHours = irishHours >= 24 ? irishHours - 24 : irishHours;
      currentTime = irishHours * 60 + now.getUTCMinutes();
    }
    return currentTime;
  },

  // Get current day with potential rollover handling
  getCurrentDay: function (now) {
    var currentDay = testMode.enabled ? testMode.dayOfWeek : now.getUTCDay();
    if (!testMode.enabled) {
      var isIrishSummerTime = dateUtils.isIrelandDST(now);
      var irishOffset = isIrishSummerTime ? 1 : 0;
      var irishHours = now.getUTCHours() + irishOffset;
      if (irishHours < now.getUTCHours()) {
        currentDay = (currentDay + 1) % 7;
      }
    }
    return currentDay;
  },

  // Get prayer times from DOM
  getPrayerTimes: function () {
    return {
      sunrise: document
        .querySelector(selectors.importantTimes.sunrise)
        .getAttribute("data-time"),
      zawal: document
        .querySelector(selectors.importantTimes.zawal)
        .getAttribute("data-time"),
      fajrBeginning: document
        .querySelector(selectors.prayerTimes.fajrBeginning)
        .getAttribute("data-time"),
      zohrBeginning: document
        .querySelector(selectors.prayerTimes.zohrBeginning)
        .getAttribute("data-time"),
      magribBeginning: document
        .querySelector(selectors.prayerTimes.magribBeginning)
        .getAttribute("data-time"),
      fajrJamaah: document
        .querySelector(selectors.prayerTimes.fajrJamaah)
        .getAttribute("data-time"),
      zohrJamaah: document
        .querySelector(selectors.prayerTimes.zohrJamaah)
        .getAttribute("data-time"),
      asrJamaah: document
        .querySelector(selectors.prayerTimes.asrJamaah)
        .getAttribute("data-time"),
      magribJamaah: document
        .querySelector(selectors.prayerTimes.magribJamaah)
        .getAttribute("data-time"),
      ishaJamaah: document
        .querySelector(selectors.prayerTimes.ishaJamaah)
        .getAttribute("data-time"),
    };
  },

  // Convert prayer times to minutes and organize jamaah times
  getJamaahTimes: function (times) {
    return {
      fajrJamaah: timeUtils.timeToMinutes(times.fajrJamaah),
      zohrJamaah: timeUtils.timeToMinutes(times.zohrJamaah),
      asrJamaah: timeUtils.timeToMinutes(times.asrJamaah),
      magribJamaah: timeUtils.timeToMinutes(times.magribJamaah),
      ishaJamaah: timeUtils.timeToMinutes(times.ishaJamaah),
    };
  },

  // Get recurring announcements based on day and time
  getRecurringAnnouncement: function (dayOfWeek, currentTime, isIrishSummerTime, jamaahTimes) {
    // Regular announcements logic
    if (isIrishSummerTime) {
      var fajrTime = timeUtils.timeToMinutes(
        document.querySelector(selectors.prayerTimes.fajrBeginning).getAttribute("data-time")
      );
      
      if (
        dayOfWeek === 4 &&
        currentTime >= fajrTime &&
        currentTime < jamaahTimes.magribJamaah + 5
      ) {
        // Thursday
        return AnnouncementData.thursdayDarood();
      }
      else if (dayOfWeek === 4 && currentTime >= jamaahTimes.magribJamaah + 6 && currentTime < (23 * 60 + 59)) {
        // Thursday After Magrib
        return AnnouncementData.fridayTafseer();
      }
      else if (dayOfWeek === 5 && currentTime > (0 * 60 + 1) && currentTime < jamaahTimes.magribJamaah + 10) {
        // Friday
        return AnnouncementData.fridayTafseer();
      }
    } else {
      // Winter time rules
      var fajrTime = timeUtils.timeToMinutes(
        document.querySelector(selectors.prayerTimes.fajrBeginning).getAttribute("data-time")
      );
      
      if (
        dayOfWeek === 4 &&
        currentTime >= fajrTime &&
        currentTime < jamaahTimes.ishaJamaah + 5
      ) {
        // Thursday
        return AnnouncementData.thursdayDarood();
      } else if (
        dayOfWeek === 4 &&
        currentTime >= jamaahTimes.ishaJamaah + 6 &&
        currentTime < 23 * 60 + 59
      ) {
        // Thursday After Isha
        return AnnouncementData.fridayTafseer();
      } else if (
        dayOfWeek === 5 &&
        currentTime > 0 * 60 + 1 &&
        currentTime < jamaahTimes.ishaJamaah + 10
      ) {
        // Friday
        return AnnouncementData.fridayTafseer();
      }
    }

    return AnnouncementData.default;
  },

  // Check for prayer time warnings
  checkForWarnings: function (currentTime, times) {
    var sunriseTime = timeUtils.timeToMinutes(times.sunrise);
    var zawalTime = timeUtils.timeToMinutes(times.zawal);
    var magribTime = timeUtils.timeToMinutes(times.magribBeginning);

    // Check for sunrise warning
    if (currentTime >= sunriseTime && currentTime < sunriseTime + 15) {
      return {
        isWarning: true,
        message: AnnouncementData.warnings.sunrise(
          times.sunrise,
          timeUtils.addMinutes(times.sunrise, 15)
        ),
      };
    }
    
    // Check for zawal warning
    if (currentTime >= zawalTime && currentTime < zawalTime + 10) {
      return {
        isWarning: true,
        message: AnnouncementData.warnings.zawal(times.zawal, times.zohrBeginning),
      };
    }
    
    // Check for sunset warning
    if (currentTime >= magribTime - 10 && currentTime < magribTime) {
      return {
        isWarning: true,
        message: AnnouncementData.warnings.sunset(times.magribBeginning),
      };
    }

    return { isWarning: false };
  },

  // Backward compatibility methods
  pauseOngoingAnnouncements: function () {
    DisplayStateManager.pauseOngoingAnnouncements();
  },

  resumeAnnouncements: function () {
    DisplayStateManager.resumeAnnouncements();
  },

  showNextMessage: function (message) {
    MessageDisplayManager.showNextMessage(message);
  },

  displayRotatingImages: function (images, duration) {
    ImageDisplayManager.displayRotatingImages(images, duration);
  },

  handleImageAnnouncement: function (imageData, currentTime, jamaahTimes) {
    ImageDisplayManager.handleImageAnnouncement(imageData, currentTime, jamaahTimes);
  },
};

// Initialize announcements when the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  announcementModule.init();
});
