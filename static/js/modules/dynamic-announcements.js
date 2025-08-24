/**
 * Prayer Times Application - Dynamic Announcements Module
 * Handles loading and managing announcements from external sources
 */

var DynamicAnnouncementsManager = {
  // Storage for dynamic announcements
  announcements: [],

  // Initialize the manager
  init: function () {
    this.loadDynamicAnnouncements();
    // Set up periodic refresh (every hour)
    setInterval(this.loadDynamicAnnouncements.bind(this), 60 * 60 * 1000);
  },

  // Load dynamic announcements from external file
  loadDynamicAnnouncements: function () {
    var self = this;
    
    fetch("/static/data/announcements.json")
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Network response was not ok: " + response.status);
        }
        return response.json();
      })
      .then(function (data) {
        if (Array.isArray(data)) {
          self.announcements = data;
          console.log("Loaded dynamic announcements:", self.announcements.length);
        } else {
          console.error("Invalid announcements data format:", data);
          self.announcements = [];
        }
        // Trigger announcement update after loading
        if (typeof announcementModule !== "undefined" && announcementModule.updateAnnouncement) {
          announcementModule.updateAnnouncement();
        }
      })
      .catch(function (error) {
        console.error("Error loading dynamic announcements:", error);
        self.announcements = [];
        // Still attempt to update announcements with default values
        if (typeof announcementModule !== "undefined" && announcementModule.updateAnnouncement) {
          announcementModule.updateAnnouncement();
        }
      });
  },

  // Get all active announcements for the current time
  getActiveAnnouncements: function (now) {
    if (!this.announcements || this.announcements.length === 0) {
      return null;
    }

    var currentTime = now.getTime();
    var activeAnnouncements = {
      textAnnouncement: null,
      imageAnnouncements: [],
    };

    // Check all announcements
    for (var i = 0; i < this.announcements.length; i++) {
      var announcement = this.announcements[i];

      // Skip invalid announcements
      if (!announcement || !announcement.id) {
        continue;
      }

      var isActive = false;

      // Handle recurring weekly announcements
      if (announcement.type === "recurring_weekly") {
        isActive = this.isRecurringWeeklyActive(announcement, now);
      }
      // Handle regular date-based announcements
      else if (announcement.startDate && announcement.endDate) {
        var startTime = new Date(announcement.startDate).getTime();
        var endTime = new Date(announcement.endDate).getTime();
        isActive = currentTime >= startTime && currentTime <= endTime;
      }

      if (isActive) {
        // Handle both text messages and image announcements
        if (
          announcement.type === "image" ||
          (announcement.type === "recurring_weekly" && announcement.images)
        ) {
          activeAnnouncements.imageAnnouncements.push({
            id: announcement.id,
            isImage: true,
            images: announcement.images || [],
            displayCondition: announcement.displayCondition || {},
            isSpecial: announcement.isSpecial || false,
          });
        } else if (announcement.message) {
          activeAnnouncements.textAnnouncement = {
            message: announcement.message || "",
            isSpecial: announcement.isSpecial || false,
          };
        }
      }
    }

    // Combine image announcements if multiple are active
    if (activeAnnouncements.imageAnnouncements.length > 0) {
      var combinedImages = this.combineImageAnnouncements(
        activeAnnouncements.imageAnnouncements
      );
      return {
        textAnnouncement: activeAnnouncements.textAnnouncement,
        imageAnnouncement: combinedImages,
      };
    }

    return activeAnnouncements.textAnnouncement
      ? { textAnnouncement: activeAnnouncements.textAnnouncement }
      : null;
  },

  // Check if a recurring weekly announcement is currently active
  isRecurringWeeklyActive: function (announcement, now) {
    // Check if announcement is hidden
    if (announcement.hide === true) {
      return false;
    }

    // Check day of week
    var currentDay = testMode.enabled ? testMode.dayOfWeek : now.getUTCDay();
    if (!testMode.enabled) {
      var isIrishSummerTime = dateUtils.isIrelandDST(now);
      var irishOffset = isIrishSummerTime ? 1 : 0;
      var irishHours = now.getUTCHours() + irishOffset;
      if (irishHours < now.getUTCHours()) {
        currentDay = (currentDay + 1) % 7;
      }
    }

    if (currentDay !== announcement.dayOfWeek) {
      return false;
    }

    // Get current time in minutes
    var currentTime;
    if (testMode.enabled) {
      currentTime = testMode.getCurrentTimeMinutes();
    } else {
      var isIrishSummerTime = dateUtils.isIrelandDST(now);
      var irishOffset = isIrishSummerTime ? 1 : 0;
      var irishHours = now.getUTCHours() + irishOffset;
      irishHours = irishHours >= 24 ? irishHours - 24 : irishHours;
      currentTime = irishHours * 60 + now.getUTCMinutes();
    }

    // Determine season and get timing
    var isIrishSummerTime = dateUtils.isIrelandDST(now);
    var seasonKey = isIrishSummerTime ? "summer" : "winter";
    var timing = announcement.seasonalTiming[seasonKey];

    if (!timing) {
      return false;
    }

    // Get prayer time references
    var startTime = this.getPrayerTimeMinutes(timing.startReference);
    var endTime =
      this.getPrayerTimeMinutes(timing.endReference) + (timing.endOffset || 0);

    return currentTime >= startTime && currentTime <= endTime;
  },

  // Get prayer time in minutes from prayer time reference
  getPrayerTimeMinutes: function (reference) {
    var selectorMap = {
      fajrBeginning: selectors.prayerTimes.fajrBeginning,
      zohrBeginning: selectors.prayerTimes.zohrBeginning,
      asrBeginning: selectors.prayerTimes.asrBeginning,
      magribBeginning: selectors.prayerTimes.magribBeginning,
      ishaBeginning: selectors.prayerTimes.ishaBeginning,
      fajrJamaah: selectors.prayerTimes.fajrJamaah,
      zohrJamaah: selectors.prayerTimes.zohrJamaah,
      asrJamaah: selectors.prayerTimes.asrJamaah,
      magribJamaah: selectors.prayerTimes.magribJamaah,
      ishaJamaah: selectors.prayerTimes.ishaJamaah,
    };

    var selector = selectorMap[reference];
    if (!selector) {
      return 0;
    }

    var element = document.querySelector(selector);
    if (!element) {
      return 0;
    }

    var timeStr = element.getAttribute("data-time");
    return timeUtils.timeToMinutes(timeStr);
  },

  // Combine multiple image announcements into one with adjusted frequency
  combineImageAnnouncements: function (imageAnnouncements) {
    var allImages = [];
    var isSpecial = false;
    var baseDisplayCondition = {
      frequency: 2,
      duration: 30,
      avoidJamaahTime: true,
      rotateImages: true,
    };

    // Collect all images from all announcements
    for (var i = 0; i < imageAnnouncements.length; i++) {
      var announcement = imageAnnouncements[i];
      if (announcement.images && announcement.images.length > 0) {
        allImages = allImages.concat(announcement.images);
      }
      if (announcement.isSpecial) {
        isSpecial = true;
      }
    }

    // Calculate dynamic frequency based on total images
    var totalImages = allImages.length;
    var dynamicFrequency = Math.max(2, totalImages);

    return {
      isImage: true,
      images: allImages,
      displayCondition: {
        frequency: dynamicFrequency,
        duration: baseDisplayCondition.duration,
        avoidJamaahTime: baseDisplayCondition.avoidJamaahTime,
        rotateImages: baseDisplayCondition.rotateImages,
      },
      isSpecial: isSpecial,
    };
  },
};

// Backwards compatibility - keep the original variable name
var dynamicAnnouncements = DynamicAnnouncementsManager.announcements;
