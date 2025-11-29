/**
 * Prayer Times Application - Announcement Module
 * Manages announcements and special event messages
 */

// Core announcement texts and configurations
var announcements = {
  // Permanent announcements
  default:
    "SILENCE, PLEASE. WE ARE IN THE HOUSE OF ALLAH. KINDLY TURN OFF YOUR MOBILE.",

  // Regular recurring announcements
  thursday_darood: function () {
    return "DUROOD/SALAT-ALA-NABI صلى الله عليه وسلم GATHERING • THURSDAY AFTER ISHA";
  },

  friday_tafseer: function () {
    return "TAFSEER OF THE QUR'AN • SURAH DHARIYAAT • FRIDAY AFTER ISHA";
  },

  clock_go_forward: function () {
    return "REMEMBER CLOCKS GO FORWARD 1 HOUR THIS SUNDAY";
  },

  clock_go_backward: function () {
    return "REMEMBER CLOCKS GO BACKWARD 1 HOUR THIS SUNDAY";
  },

  // Warnings - these are permanent and take priority
  warnings: {
    sunrise: function (sunriseTime, endTime) {
      return (
        "NO SALAH AFTER SUNRISE (" +
        timeUtils.formatTimeWithAmPm(sunriseTime) +
        ") • Please Wait Until " +
        timeUtils.formatTimeWithAmPm(endTime)
      );
    },
    zawal: function (zawalTime, zohrTime) {
      return (
        "NO SALAH AT ZAWAL TIME (" +
        timeUtils.formatTimeWithAmPm(zawalTime) +
        ") • Please Wait for Zohr to Begin (" +
        timeUtils.formatTimeWithAmPm(zohrTime) +
        ")"
      );
    },
    sunset: function (magribTime) {
      return (
        "NO SALAH DURING SUNSET • Please Wait for Magrib Adhan (" +
        timeUtils.formatTimeWithAmPm(magribTime) +
        ")"
      );
    },
  },
};

// Dynamic announcements loaded from external source
var dynamicAnnouncements = []; // Initialize as empty array to avoid undefined errors

// Track announcement display states
var displayState = {
  pausedAnnouncement: null,
  resumeTimeout: null,
  adhkarActive: false,
  adhkarText: null,
  adhkarConfig: null,
  adhkarCurrentPage: 0,
  adhkarCurrentCycle: 0,
  adhkarPageTimeout: null,
  adhkarTotalPages: 0,
  adhkarTotalCycles: 0,
};

var announcementModule = {
  // Helper function to check if a control entry is hidden
  isControlHidden: function(controlId) {
    if (!dynamicAnnouncements || !Array.isArray(dynamicAnnouncements)) {
      return false; // Default to showing if JSON not loaded
    }
    
    var controlEntry = dynamicAnnouncements.find(function(announcement) {
      return announcement.id === controlId && announcement.type === "control";
    });
    
    return controlEntry ? (controlEntry.hide === true) : false;
  },

  init: function () {
    // Load dynamic announcements when the page loads
    this.loadDynamicAnnouncements();

    // Set up periodic refresh of dynamic announcements (e.g., every hour)
    setInterval(this.loadDynamicAnnouncements.bind(this), 60 * 60 * 1000);
  },

  // Load dynamic announcements from external file
  loadDynamicAnnouncements: function () {
    fetch("/static/data/announcements.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok: " + response.status);
        }
        return response.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          dynamicAnnouncements = data;
          console.log(
            "Loaded dynamic announcements:",
            dynamicAnnouncements.length
          );
        } else {
          console.error("Invalid announcements data format:", data);
          dynamicAnnouncements = [];
        }
        // Update announcements immediately after loading
        this.updateAnnouncement();
      })
      .catch((error) => {
        console.error("Error loading dynamic announcements:", error);
        // Fallback to empty array if loading fails
        dynamicAnnouncements = [];
        // Still attempt to update announcements with default values
        this.updateAnnouncement();
      });
  },

  // Find active announcement from the dynamic list based on current date/time
  getActiveDynamicAnnouncement: function (now) {
    // Ensure dynamicAnnouncements exists and has items
    if (
      !dynamicAnnouncements ||
      !Array.isArray(dynamicAnnouncements) ||
      dynamicAnnouncements.length === 0
    ) {
      return null;
    }

    var currentTime = now.getTime();
    var activeAnnouncements = {
      textAnnouncement: null,
      imageAnnouncements: [],
    };

    // Check all announcements
    for (var i = 0; i < dynamicAnnouncements.length; i++) {
      var announcement = dynamicAnnouncements[i];

      // Skip invalid announcements
      if (!announcement || !announcement.id) {
        continue;
      }

      var isActive = false;

      // Handle recurring weekly announcements
      if (announcement.type === "recurring_weekly") {
        isActive = this.isRecurringWeeklyActive(announcement, now);
        console.log("DEBUG: Recurring weekly check for", announcement.id, "- Active:", isActive, "Day:", now.getDay(), "Required:", announcement.dayOfWeek);
      }
      // Handle regular date-based announcements
      else if (announcement.startDate && announcement.endDate) {
        var startTime = new Date(announcement.startDate).getTime();
        var endTime = new Date(announcement.endDate).getTime();
        isActive = currentTime >= startTime && currentTime <= endTime;
      }

      if (isActive) {
        console.log("DEBUG: Found active announcement:", announcement.id, "Type:", announcement.type);
        // Handle both text messages and image announcements
        if (
          announcement.type === "image" ||
          (announcement.type === "recurring_weekly" && announcement.images)
        ) {
          console.log("DEBUG: Adding image announcement:", announcement.id, "Images:", announcement.images);
          activeAnnouncements.imageAnnouncements.push({
            id: announcement.id,
            isImage: true,
            images: announcement.images || [],
            displayCondition: announcement.displayCondition || {},
            isSpecial: announcement.isSpecial || false,
          });
        } else if (announcement.message) {
          console.log("DEBUG: Adding text announcement:", announcement.id);
          activeAnnouncements.textAnnouncement = {
            message: announcement.message || "",
            isSpecial: announcement.isSpecial || false,
          };
        }
      }
    }

    // Create rotation schedule if multiple are active
    if (activeAnnouncements.imageAnnouncements.length > 0) {
      var imageSchedule = this.createImageRotationSchedule(
        activeAnnouncements.imageAnnouncements
      );
      return {
        textAnnouncement: activeAnnouncements.textAnnouncement,
        imageAnnouncement: imageSchedule,
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

  // Create sequential display schedule for multiple image announcements
  createImageRotationSchedule: function (imageAnnouncements) {
    var schedule = [];
    var isSpecial = false;
    var maxFrequency = 0;

    // Build sequential schedule from all active announcements
    for (var i = 0; i < imageAnnouncements.length; i++) {
      var announcement = imageAnnouncements[i];
      if (announcement.images && announcement.images.length > 0) {
        var frequency = announcement.displayCondition.frequency || 1;
        var duration = announcement.displayCondition.duration || 10;
        
        // Track maximum frequency to determine cycle wait time
        if (frequency > maxFrequency) {
          maxFrequency = frequency;
        }
        
        // Add each image from this announcement to the sequential schedule
        for (var j = 0; j < announcement.images.length; j++) {
          schedule.push({
            imagePath: announcement.images[j],
            frequency: frequency,
            duration: duration,
            avoidJamaahTime: announcement.displayCondition.avoidJamaahTime !== false,
            announcementId: announcement.id
          });
        }
      }
      if (announcement.isSpecial) {
        isSpecial = true;
      }
    }

    // Calculate total cycle time: sum of all durations + gaps + max frequency wait
    var gapDuration = 20; // 20 seconds gap between images
    var totalActiveDuration = 0;
    for (var k = 0; k < schedule.length; k++) {
      totalActiveDuration += schedule[k].duration;
    }
    var totalGapTime = (schedule.length - 1) * gapDuration; // gaps between images
    var totalActiveTime = totalActiveDuration + totalGapTime;
    var cycleWaitTime = maxFrequency * 60; // Convert max frequency (minutes) to seconds
    var totalCycleTime = totalActiveTime + cycleWaitTime;
    
    return {
      isImage: true,
      images: schedule.map(function(item) { return item.imagePath; }), // For compatibility
      displayCondition: { // For compatibility
        frequency: maxFrequency,
        duration: schedule.length > 0 ? schedule[0].duration : 10,
        avoidJamaahTime: schedule.length > 0 ? schedule[0].avoidJamaahTime : true
      },
      schedule: schedule,
      isSpecial: isSpecial,
      maxFrequency: maxFrequency,
      gapDuration: gapDuration,
      totalActiveTime: totalActiveTime,
      totalCycleTime: totalCycleTime
    };
  },

  // Update the announcement message based on current time and special events
  updateAnnouncement: function () {
    console.log("DEBUG: updateAnnouncement called");
    var now = testMode.enabled ? testMode.getMockDate() : new Date(); // Get current time in minutes from midnight
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

    // For day-of-week, handle potential day rollover
    var currentDay = testMode.enabled ? testMode.dayOfWeek : now.getUTCDay();
    if (!testMode.enabled && irishHours < now.getUTCHours()) {
      currentDay = (currentDay + 1) % 7;
    }

    var dayOfWeek = currentDay; // 0 is Sunday, 5 is Friday, 6 is Saturday

    // Determine if it's summer or winter time
    var isIrishSummerTime = dateUtils.isIrelandDST(now);

    // Get prayer times
    var times = {
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

    // Convert times
    var sunriseTime = timeUtils.timeToMinutes(times.sunrise);
    var zawalTime = timeUtils.timeToMinutes(times.zawal);
    var fajrTime = timeUtils.timeToMinutes(times.fajrBeginning);
    var zohrTime = timeUtils.timeToMinutes(times.zohrBeginning);
    var magribTime = timeUtils.timeToMinutes(times.magribBeginning);
    var fajrJamaahTime = timeUtils.timeToMinutes(times.fajrJamaah);
    var zohrJamaahTime = timeUtils.timeToMinutes(times.zohrJamaah);
    var asrJamaahTime = timeUtils.timeToMinutes(times.asrJamaah);
    var magribJamaahTime = timeUtils.timeToMinutes(times.magribJamaah);
    var ishaJamaahTime = timeUtils.timeToMinutes(times.ishaJamaah);

    var announcementElement = document.querySelector(selectors.announcement);
    var message = announcements.default;
    var isWarning = false;
    var isSpecialAnnouncement = false;
    var imageData = null;

    // First check if Adhkar should be displayed - this takes priority
    var adhkarDisplay = this.handleAdhkarDisplay(
      currentTime,
      dayOfWeek,
      isIrishSummerTime,
      {
        fajrJamaah: fajrJamaahTime,
        zohrJamaah: zohrJamaahTime,
        asrJamaah: asrJamaahTime,
        magribJamaah: magribJamaahTime,
        ishaJamaah: ishaJamaahTime,
      }
    );

    if (adhkarDisplay.shouldDisplay) {
      // If Adhkar should be displayed, it takes priority
      return;
    }

    // Check for any dynamic announcements
    var activeDynamicAnnouncement = this.getActiveDynamicAnnouncement(now);
    console.log("DEBUG: Active dynamic announcement:", activeDynamicAnnouncement);
    if (activeDynamicAnnouncement) {
      // Handle text announcement
      if (activeDynamicAnnouncement.textAnnouncement) {
        message =
          activeDynamicAnnouncement.textAnnouncement.message ||
          announcements.default;
        isSpecialAnnouncement =
          activeDynamicAnnouncement.textAnnouncement.isSpecial;
      }

      // Handle image announcement separately (can exist alongside text)
      if (activeDynamicAnnouncement.imageAnnouncement) {
        console.log("DEBUG: Found imageAnnouncement:", activeDynamicAnnouncement.imageAnnouncement);
        imageData = {
          images: activeDynamicAnnouncement.imageAnnouncement.images,
          displayCondition:
            activeDynamicAnnouncement.imageAnnouncement.displayCondition,
          isSpecial: activeDynamicAnnouncement.imageAnnouncement.isSpecial,
          schedule: activeDynamicAnnouncement.imageAnnouncement.schedule,
          gapDuration: activeDynamicAnnouncement.imageAnnouncement.gapDuration,
          totalActiveTime: activeDynamicAnnouncement.imageAnnouncement.totalActiveTime,
          totalCycleTime: activeDynamicAnnouncement.imageAnnouncement.totalCycleTime,
        };
        console.log("DEBUG: Created imageData with schedule:", imageData.schedule ? imageData.schedule.length : 'undefined', "items");
      }
    }
    // If no dynamic announcement, use standard recurring announcements
    else {
      // Regular announcements logic
      if (isIrishSummerTime) {
        if (!this.isControlHidden("thursday_darood_control") &&
          dayOfWeek === 4 &&
          currentTime >= fajrTime &&
          currentTime < magribJamaahTime + 5
        ) {
          // Thursday
          message = announcements.thursday_darood();
        }
        else if (!this.isControlHidden("friday_tafseer_control") && dayOfWeek === 4 && currentTime >= magribJamaahTime + 6 && currentTime < (23 * 60 + 59)) {
          // Thursday After Magrib
          message = announcements.friday_tafseer();
        }
        else if (!this.isControlHidden("friday_tafseer_control") && dayOfWeek === 5 && currentTime > (0 * 60 + 1) && currentTime < magribJamaahTime + 10) {
          // Friday
          message = announcements.friday_tafseer();
        }
      } else {
        // Winter time rules
        if (!this.isControlHidden("thursday_darood_control") &&
          dayOfWeek === 4 &&
          currentTime >= fajrTime &&
          currentTime < ishaJamaahTime + 5
        ) {
          // Thursday
          message = announcements.thursday_darood();
        } 
        else if (!this.isControlHidden("friday_tafseer_control") &&
          dayOfWeek === 4 &&
          currentTime >= ishaJamaahTime + 6 &&
          currentTime < 23 * 60 + 59
        ) {
          // Thursday After Isha
          message = announcements.friday_tafseer();
        } else if (!this.isControlHidden("friday_tafseer_control") &&
          dayOfWeek === 5 &&
          currentTime > 0 * 60 + 1 &&
          currentTime < ishaJamaahTime + 10
        ) {
          // Friday
          message = announcements.friday_tafseer();
        }
      }
    }

    // Then check for warnings (which take precedence over any other messages)
    if (currentTime >= sunriseTime && currentTime < sunriseTime + 15) {
      message = announcements.warnings.sunrise(
        times.sunrise,
        timeUtils.addMinutes(times.sunrise, 15)
      );
      isWarning = true;
      isSpecialAnnouncement = false;
    } else if (currentTime >= zawalTime && currentTime < zawalTime + 10) {
      message = announcements.warnings.zawal(times.zawal, times.zohrBeginning);
      isWarning = true;
      isSpecialAnnouncement = false;
    } else if (currentTime >= magribTime - 10 && currentTime < magribTime) {
      message = announcements.warnings.sunset(times.magribBeginning);
      isWarning = true;
      isSpecialAnnouncement = false;
    }

    if (announcementElement) {
      // First update the text announcement
      announcementElement.textContent = message;

      // Remove all classes first
      announcementElement.classList.remove(
        "announcement-text-normal",
        "announcement-text-long",
        "announcement-text-very-long"
      );
      announcementElement.classList.remove(
        "announcement-warning",
        "special-announcement"
      );
      document
        .querySelector(".announcement")
        .classList.remove("warning-active", "special-active");

      // Add appropriate animation class based on message length
      if (message.length < 60) {
        announcementElement.classList.add("announcement-text-normal");
      } else if (message.length < 100) {
        announcementElement.classList.add("announcement-text-long");
      } else {
        announcementElement.classList.add("announcement-text-very-long");
      }

      // Add styling classes (warning takes priority)
      if (isWarning) {
        announcementElement.classList.add("announcement-warning");
        document.querySelector(".announcement").classList.add("warning-active");
      } else if (isSpecialAnnouncement) {
        announcementElement.classList.add("special-announcement");
        document.querySelector(".announcement").classList.add("special-active");
      }

      // Process image announcement separately - even if there's a text announcement
      console.log("DEBUG: Image processing decision - imageData exists:", !!imageData, "isWarning:", isWarning);
      if (imageData && !isWarning) {
        console.log("DEBUG: Calling handleImageAnnouncement with schedule:", imageData.schedule ? imageData.schedule.length : 'undefined');
        this.handleImageAnnouncement(imageData, currentTime, [
          fajrJamaahTime,
          zohrJamaahTime,
          asrJamaahTime,
          magribJamaahTime,
          ishaJamaahTime,
        ]);
      } else if (imageData && isWarning) {
        console.log("DEBUG: Image announcement blocked by warning");
      } else if (!imageData) {
        console.log("DEBUG: No image data found");
      }
    }

    // Safety check: Ensure prayer-times and important-times are visible when nothing is active
    this.ensureElementsVisible();
  },

  // Ensure prayer-times and important-times are visible when no overlays are active
  ensureElementsVisible: function () {
    console.log("DEBUG: ensureElementsVisible called - checking for active overlays");
    
    // Check if Adhkar is active
    if (displayState.adhkarActive) {
      console.log("DEBUG: Adhkar is active, elements should be hidden");
      return; // Adhkar should be showing, elements should be hidden
    }

    // Check if any image slideshow is active
    var activeSlideshow = document.querySelector(".image-slideshow-container");
    if (activeSlideshow) {
      console.log("DEBUG: Image slideshow is active, elements should be hidden");
      return; // Image is showing, elements should be hidden
    }

    // Check if any adhkar interleave image is active
    var activeAdhkarImage = document.querySelector(".adhkar-interleave-image-container");
    if (activeAdhkarImage) {
      console.log("DEBUG: Adhkar interleave image is active, elements should be hidden");
      return; // Adhkar image is showing, elements should be hidden
    }

    // Check if any adhkar text display is active
    var activeAdhkarText = document.getElementById("adhkar-display-container");
    if (activeAdhkarText) {
      console.log("DEBUG: Adhkar text display is active, elements should be hidden");
      return; // Adhkar text is showing, elements should be hidden
    }

    // No overlays active - ensure clean state and both elements visible
    console.log("DEBUG: No active overlays found, ensuring elements are visible");
    
    // Double-check that prayer elements are actually visible
    var prayerTimesElement = document.querySelector(".prayer-times");
    var importantTimesElement = document.querySelector(".important-times");
    
    var prayerVisible = prayerTimesElement && window.getComputedStyle(prayerTimesElement).display !== 'none';
    var importantVisible = importantTimesElement && window.getComputedStyle(importantTimesElement).display !== 'none';
    
    if (!prayerVisible || !importantVisible) {
      console.log("DEBUG: Prayer elements not visible, forcing cleanup", "prayer:", prayerVisible, "important:", importantVisible);
      this.cleanupAllPosterElements();
    }
  },

  // Helper function to hide both prayer-times and important-times together
  hidePrayerElements: function() {
    var prayerTimesElement = document.querySelector(".prayer-times");
    var importantTimesElement = document.querySelector(".important-times");
    
    if (prayerTimesElement) {
      prayerTimesElement.style.display = "none";
      prayerTimesElement.style.zIndex = "1";
    }
    if (importantTimesElement) {
      importantTimesElement.style.display = "none";
      importantTimesElement.style.zIndex = "1";
    }
  },

  // Helper function to show both prayer-times and important-times together
  showPrayerElements: function() {
    var prayerTimesElement = document.querySelector(".prayer-times");
    var importantTimesElement = document.querySelector(".important-times");
    
    if (prayerTimesElement && prayerTimesElement.style.display === "none") {
      prayerTimesElement.style.removeProperty('display');
      prayerTimesElement.style.zIndex = "1";
    }
    
    if (importantTimesElement && importantTimesElement.style.display === "none") {
      importantTimesElement.style.removeProperty('display');
      importantTimesElement.style.zIndex = "1";
    }
  },

  // Comprehensive cleanup function to remove ALL poster elements
  cleanupAllPosterElements: function() {
    // Remove all possible poster container types
    var containerSelectors = [
      '.image-slideshow-container',
      '.adhkar-interleave-image-container', 
      '.tafseer-display-container',
      '#adhkar-display-container',
      '[id^="single-image-"]',
      '[class*="image-container"]',
      '[class*="poster"]'
    ];

    containerSelectors.forEach(function(selector) {
      var elements = document.querySelectorAll(selector);
      elements.forEach(function(element) {
        if (element && element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });
    });

    // Also clean up any stray image elements that might have high z-index
    var allImages = document.querySelectorAll('img[style*="z-index"]');
    allImages.forEach(function(img) {
      var zIndex = parseInt(window.getComputedStyle(img).zIndex);
      if (zIndex > 100) { // Remove images with high z-index that might be poster remnants
        if (img.parentNode) {
          img.parentNode.removeChild(img);
        }
      }
    });

    // Show prayer elements after cleanup
    this.showPrayerElements();
  },


  // Display the Tafseer image for Friday
  displayTafseerImage: function (durationSeconds) {
    // Get both the prayer-times and important-times elements that we'll hide
    var prayerTimesElement = document.querySelector(".prayer-times");
    var importantTimesElement = document.querySelector(".important-times");

    // Save original state of prayer-times
    var originalPrayerTimesState = null;
    if (prayerTimesElement) {
      originalPrayerTimesState = {
        display: prayerTimesElement.style.display,
        html: prayerTimesElement.innerHTML,
        className: prayerTimesElement.className,
      };
    }

    // Save original state of important-times
    var originalImportantTimesState = null;
    if (importantTimesElement) {
      originalImportantTimesState = {
        display: importantTimesElement.style.display,
        html: importantTimesElement.innerHTML,
        className: importantTimesElement.className,
      };
    }

    // Hide both elements together using helper function
    this.hidePrayerElements();

    // Create tafseer container
    var tafseerContainer = document.createElement("div");
    tafseerContainer.className = "tafseer-container image-slideshow-container";
    tafseerContainer.style.width = "100%";
    tafseerContainer.style.height = "132vh"; // Set container height to 60% of viewport height
    tafseerContainer.style.display = "flex";
    tafseerContainer.style.justifyContent = "center";
    tafseerContainer.style.alignItems = "center";
    tafseerContainer.style.marginTop = "0"; // Reduced margin to give more space for image
    tafseerContainer.style.padding = "0"; // Remove padding to maximize space

    // Insert the tafseer container where prayer-times would normally be
    if (prayerTimesElement && prayerTimesElement.parentNode) {
      prayerTimesElement.parentNode.insertBefore(
        tafseerContainer,
        prayerTimesElement
      );
    } else {
      // Fallback: add after date-container's divider
      var dateContainer = document.querySelector(".date-container");
      var insertAfterElement = dateContainer
        ? dateContainer.nextElementSibling
        : document.body;
      if (insertAfterElement) {
        insertAfterElement.parentNode.insertBefore(
          tafseerContainer,
          insertAfterElement.nextSibling
        );
      } else {
        document.body.appendChild(tafseerContainer);
      }
    }

    // Create the image element
    var imgElement = document.createElement("img");
    imgElement.src = "/static/images/Tafseer of the Quran.jpg";
    imgElement.style.maxWidth = "100%"; // Increased from 90%
    imgElement.style.maxHeight = "100%"; // Added maxHeight to fill container height
    imgElement.style.height = "auto";
    imgElement.style.width = "auto";
    imgElement.style.objectFit = "contain"; // Ensure image maintains aspect ratio while filling space
    imgElement.style.transition = "opacity 0.5s ease-in-out";
    imgElement.style.opacity = "0";
    imgElement.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)"; // Add subtle shadow for better visibility

    // Add the image to container
    tafseerContainer.appendChild(imgElement);

    // Fade in the image
    setTimeout(function () {
      imgElement.style.opacity = "1";
    }, 100);

    // Set up cleanup and resumption of original content
    displayState.resumeTimeout = setTimeout(function () {
      // Remove tafseer container
      if (tafseerContainer.parentNode) {
        tafseerContainer.parentNode.removeChild(tafseerContainer);
      }

      // Restore prayer-times element
      if (prayerTimesElement && originalPrayerTimesState) {
        prayerTimesElement.className = originalPrayerTimesState.className || "";
      }

      // Restore important-times element
      if (importantTimesElement && originalImportantTimesState) {
        importantTimesElement.className =
          originalImportantTimesState.className || "";
      }

      // Comprehensive cleanup to ensure no poster remnants
      announcementModule.cleanupAllPosterElements();
    }, durationSeconds * 1000);


  },

  // Handle sequential image announcements with gaps and cycle timing
  handleImageAnnouncement: function (imageData, currentTime, jamaahTimes) {
    console.log("DEBUG: handleImageAnnouncement started - displayState.adhkarActive:", displayState.adhkarActive);
    // Don't process if Adhkar is active
    if (displayState.adhkarActive) {
      console.log("DEBUG: Exiting handleImageAnnouncement because Adhkar is active");
      return;
    }

    // Check if we have a rotation schedule
    console.log("DEBUG: Checking schedule - exists:", !!imageData.schedule, "isArray:", Array.isArray(imageData.schedule), "length:", imageData.schedule ? imageData.schedule.length : 'N/A');
    if (!imageData.schedule || !Array.isArray(imageData.schedule) || imageData.schedule.length === 0) {
      console.log("DEBUG: Exiting - invalid schedule");
      return;
    }

    // Check if any images should avoid jamaah time
    var shouldAvoidJamaah = false;
    for (var i = 0; i < imageData.schedule.length; i++) {
      if (imageData.schedule[i].avoidJamaahTime) {
        shouldAvoidJamaah = true;
        break;
      }
    }
    console.log("DEBUG: shouldAvoidJamaah:", shouldAvoidJamaah, "currentTime:", currentTime);

    // Check if we're within 2 minutes of any jamaah time
    if (shouldAvoidJamaah && jamaahTimes) {
      console.log("DEBUG: Checking jamaah times proximity - jamaahTimes:", jamaahTimes);
      for (var j = 0; j < jamaahTimes.length; j++) {
        var jamaahTime = jamaahTimes[j];
        var timeDiff = Math.abs(currentTime - jamaahTime);
        console.log("DEBUG: Jamaah", j, "time:", jamaahTime, "diff:", timeDiff);
        if (jamaahTime && !isNaN(jamaahTime) && timeDiff <= 2) {
          console.log("DEBUG: Exiting - too close to jamaah time", jamaahTime);
          return; // Too close to jamaah time, don't show any images
        }
      }
    }

    var now = new Date();
    var totalSeconds = (now.getHours() * 3600) + (now.getMinutes() * 60) + now.getSeconds();
    var cyclePosition = totalSeconds % imageData.totalCycleTime;

    console.log("DEBUG: Cycle calculation - totalSeconds:", totalSeconds, "totalCycleTime:", imageData.totalCycleTime, "cyclePosition:", cyclePosition, "totalActiveTime:", imageData.totalActiveTime);

    // Check if we're in the active display period or the wait period
    if (cyclePosition >= imageData.totalActiveTime) {
      // We're in the wait period (no posters should be displayed)
      console.log("DEBUG: In wait period - no posters displayed");
      return;
    }

    // We're in the active period - determine which image to show
    console.log("DEBUG: In active period - determining which image to show");
    var currentPosition = 0;
    var gapDuration = imageData.gapDuration;

    for (var k = 0; k < imageData.schedule.length; k++) {
      var scheduleItem = imageData.schedule[k];
      var itemDuration = scheduleItem.duration;

      console.log("DEBUG: Checking schedule item", k, "- imagePath:", scheduleItem.imagePath, "duration:", itemDuration, "currentPosition:", currentPosition, "cyclePosition:", cyclePosition);

      // Check if we're in this item's display window
      if (cyclePosition >= currentPosition && cyclePosition < (currentPosition + itemDuration)) {
        var remainingTime = (currentPosition + itemDuration) - cyclePosition;
        console.log("DEBUG: Showing image:", scheduleItem.imagePath, "for", remainingTime, "seconds (position", cyclePosition, "of", imageData.totalCycleTime, ")");
        this.displaySingleImage(scheduleItem.imagePath, remainingTime);
        return;
      }

      // Move to next position (item duration + gap)
      currentPosition += itemDuration;
      console.log("DEBUG: After item", k, "currentPosition now:", currentPosition);
      
      // Add gap time if not the last item
      if (k < imageData.schedule.length - 1) {
        // Check if we're in the gap period after this item
        console.log("DEBUG: Checking gap after item", k, "- gap start:", currentPosition, "gap end:", currentPosition + gapDuration);
        if (cyclePosition >= currentPosition && cyclePosition < (currentPosition + gapDuration)) {
          console.log("DEBUG: In gap period after", scheduleItem.imagePath);
          return; // In gap, don't show anything
        }
        currentPosition += gapDuration;
        console.log("DEBUG: After gap", k, "currentPosition now:", currentPosition);
      }
    }
  },

  // Display a single image for a specified duration
  displaySingleImage: function (imagePath, duration) {
    // Check if there's already a slideshow running
    var existingSlideshow = document.querySelector(
      ".image-slideshow-container"
    );
    if (existingSlideshow) {
      // Already displaying images, don't start another slideshow
      console.log("DEBUG: Slideshow already running, skipping new image display");
      return;
    }

    // Clean up any existing poster elements first to ensure clean state
    this.cleanupAllPosterElements();

    // Create ID for this slideshow session to avoid conflicts
    var slideshowId = "slideshow-" + new Date().getTime();

    // Get the prayer-times and important-times elements that we'll hide
    var prayerTimesElement = document.querySelector(".prayer-times");
    var importantTimesElement = document.querySelector(".important-times");

    // Save original state of prayer-times
    var originalPrayerTimesState = null;
    if (prayerTimesElement) {
      originalPrayerTimesState = {
        display: prayerTimesElement.style.display,
        html: prayerTimesElement.innerHTML,
        className: prayerTimesElement.className,
      };
    }

    // Save original state of important-times
    var originalImportantTimesState = null;
    if (importantTimesElement) {
      originalImportantTimesState = {
        display: importantTimesElement.style.display,
        html: importantTimesElement.innerHTML,
        className: importantTimesElement.className,
      };
    }

    // Hide both elements together using helper function
    this.hidePrayerElements();

    // Create image container that will be placed in the same location as prayer-times
    var imageContainer = document.createElement("div");
    imageContainer.id = slideshowId;
    imageContainer.className = "image-slideshow-container";
    imageContainer.style.width = "100%";
    imageContainer.style.height = "132vh";
    imageContainer.style.display = "flex";
    imageContainer.style.justifyContent = "center";
    imageContainer.style.alignItems = "center";
    imageContainer.style.marginTop = "1.0vw";
    imageContainer.style.padding = "0";
    // Keep poster at normal z-index to prevent layering issues
    imageContainer.style.position = "relative";
    imageContainer.style.zIndex = "1";
    imageContainer.style.backgroundColor = "transparent";

    // Insert the image container where prayer-times would normally be
    if (prayerTimesElement && prayerTimesElement.parentNode) {
      prayerTimesElement.parentNode.insertBefore(
        imageContainer,
        prayerTimesElement
      );
    } else {
      // Fallback: add after date-container's divider
      var dateContainer = document.querySelector(".date-container");
      var insertAfterElement = dateContainer
        ? dateContainer.nextElementSibling
        : document.body;
      if (insertAfterElement) {
        insertAfterElement.parentNode.insertBefore(
          imageContainer,
          insertAfterElement.nextSibling
        );
      } else {
        document.body.appendChild(imageContainer);
      }
    }

    // Create the image element
    var imgElement = document.createElement("img");
    imgElement.src = imagePath;
    imgElement.style.maxWidth = "100%";
    imgElement.style.maxHeight = "100%";
    imgElement.style.height = "auto";
    imgElement.style.width = "auto";
    imgElement.style.objectFit = "contain";
    imgElement.style.transition = "opacity 0.5s ease-in-out";
    imgElement.style.opacity = "0";
    imgElement.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";

    // Add the image to container
    imageContainer.appendChild(imgElement);

    // Fade in the image
    setTimeout(function () {
      imgElement.style.opacity = "1";
    }, 100);

    // Function to clean up slideshow and restore original elements
    var cleanupSlideshow = function () {
      console.log("DEBUG: Cleaning up slideshow for image:", imagePath);
      
      // Remove the slideshow container
      if (imageContainer && imageContainer.parentNode) {
        imageContainer.parentNode.removeChild(imageContainer);
      }

      // Restore the prayer-times element
      if (prayerTimesElement && originalPrayerTimesState) {
        prayerTimesElement.innerHTML = originalPrayerTimesState.html;
        prayerTimesElement.className = originalPrayerTimesState.className;
      }

      // Restore the important-times element
      if (importantTimesElement && originalImportantTimesState) {
        importantTimesElement.innerHTML = originalImportantTimesState.html;
        importantTimesElement.className = originalImportantTimesState.className;
      }

      // Comprehensive cleanup to ensure no poster remnants
      announcementModule.cleanupAllPosterElements();
      
      console.log("DEBUG: Slideshow cleanup completed");
    };

    // Set up cleanup after the specified duration
    setTimeout(cleanupSlideshow, duration * 1000);
  },

  // Display rotating images with proper timing
  displayRotatingImages: function (images, duration) {
    // Removed the announcementElement parameter since we're not modifying it
    if (!images || images.length === 0) return;

    // Create ID for this slideshow session to avoid conflicts
    var slideshowId = "slideshow-" + new Date().getTime();

    // Check if there's already a slideshow running
    var existingSlideshow = document.querySelector(
      ".image-slideshow-container"
    );
    if (existingSlideshow) {
      // Already displaying images, don't start another slideshow
      return;
    }

    // Get the prayer-times and important-times elements that we'll hide
    var prayerTimesElement = document.querySelector(".prayer-times");
    var importantTimesElement = document.querySelector(".important-times");

    // Save original state of prayer-times
    var originalPrayerTimesState = null;
    if (prayerTimesElement) {
      originalPrayerTimesState = {
        display: prayerTimesElement.style.display,
        html: prayerTimesElement.innerHTML,
        className: prayerTimesElement.className,
      };

      // Hide the prayer-times element
      prayerTimesElement.style.display = "none";
    }

    // Save original state of important-times
    var originalImportantTimesState = null;
    if (importantTimesElement) {
      originalImportantTimesState = {
        display: importantTimesElement.style.display,
        html: importantTimesElement.innerHTML,
        className: importantTimesElement.className,
      };

      // Hide the important-times element
      importantTimesElement.style.display = "none";
    }

    // Store the original states in window for later retrieval
    window[slideshowId] = {
      prayerTimesState: originalPrayerTimesState,
      prayerTimesElement: prayerTimesElement,
      importantTimesState: originalImportantTimesState,
      importantTimesElement: importantTimesElement,
    };

    // Create image container that will be placed in the same location as prayer-times
    var imageContainer = document.createElement("div");
    imageContainer.id = slideshowId;
    imageContainer.className = "image-slideshow-container";
    imageContainer.style.width = "100%";
    imageContainer.style.textAlign = "center";
    imageContainer.style.marginTop = "2.0vw";
    imageContainer.style.padding = "0.5vw";

    // Insert the image container where prayer-times would normally be
    if (prayerTimesElement && prayerTimesElement.parentNode) {
      prayerTimesElement.parentNode.insertBefore(
        imageContainer,
        prayerTimesElement
      );
    } else {
      // Fallback: add after date-container's divider
      var dateContainer = document.querySelector(".date-container");
      var insertAfterElement = dateContainer
        ? dateContainer.nextElementSibling
        : document.body;
      if (insertAfterElement) {
        insertAfterElement.parentNode.insertBefore(
          imageContainer,
          insertAfterElement.nextSibling
        );
      } else {
        document.body.appendChild(imageContainer);
      }
    }

    // Create the image element with simple fade transition
    var imgElement = document.createElement("img");
    imgElement.style.maxWidth = "90%";
    imgElement.style.height = "auto";
    imgElement.style.transition = "opacity 0.5s ease-in-out";
    imgElement.style.opacity = "1";

    // Add the image to container
    imageContainer.appendChild(imgElement);

    var currentIndex = 0;
    // Function to show the next image with simple fade transition
    var showNextImage = function () {
      // Check if we've reached the end of the duration
      var currentTime = new Date().getTime();
      if (currentTime >= startTime + duration * 1000) {
        // Duration is over, clean up and restore original content
        cleanupSlideshow(slideshowId);
        return;
      }

      // Cycle through images
      if (currentIndex >= images.length) {
        currentIndex = 0; // Reset to start for continuous rotation
      }

      // Load the next image
      imgElement.style.opacity = "0";

      setTimeout(function () {
        // Set new image source
        imgElement.src = images[currentIndex];

        // When image loads, fade it in
        imgElement.onload = function () {
          imgElement.style.opacity = "1";
        };

        // Handle image load error
        imgElement.onerror = function () {
          console.error("Failed to load image:", images[currentIndex]);
          currentIndex++;
          setTimeout(showNextImage, 100); // Try next image quickly
        };

        // Increment index for next round
        currentIndex++;

        // Set timer for next image (show each image for a portion of the total duration)
        var imageDisplayTime = Math.max(
          2,
          (duration * 1000) / (images.length * 2)
        ); // At least 2 seconds per image
        setTimeout(showNextImage, imageDisplayTime);
      }, 500); // Brief fade-out transition
    };
    // Store the start time for duration checking
    var startTime = new Date().getTime();

    // Function to clean up slideshow and restore original elements
    var cleanupSlideshow = function (id) {
      // Remove the slideshow container
      var container = document.getElementById(id);
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }

      // Restore the prayer-times and important-times elements
      var savedState = window[id];
      if (savedState) {
        // Restore prayer-times
        if (savedState.prayerTimesElement && savedState.prayerTimesState) {
          var el = savedState.prayerTimesElement;
          var state = savedState.prayerTimesState;

          // Remove inline display style to let CSS rules take over
          el.style.removeProperty('display');
          el.className = state.className || "";
        }

        // Restore important-times
        if (
          savedState.importantTimesElement &&
          savedState.importantTimesState
        ) {
          var el = savedState.importantTimesElement;
          var state = savedState.importantTimesState;

          // Remove inline display style to let CSS rules take over
          el.style.removeProperty('display');
          el.className = state.className || "";
        }
      }

      // Clean up saved state
      delete window[id];
    };
    // Start the slideshow
    imgElement.onload = function () {
      imgElement.style.opacity = "1";
      currentIndex++;
      // Calculate time per image (show each image for a portion of the total duration)
      var imageDisplayTime = Math.max(
        2000,
        (duration * 1000) / (images.length * 2)
      ); // At least 2 seconds per image
      setTimeout(showNextImage, imageDisplayTime);
    };
    // Set the first image
    imgElement.src = images[0];

    // Safety timeout to ensure cleanup happens
    setTimeout(function () {
      cleanupSlideshow(slideshowId);
    }, duration * 1000 + 1000); // Add 1 second buffer
  },

  // Show next message in the queue with scrolling effect
  showNextMessage: function (message) {
    var announcementElement = document.querySelector(selectors.announcement);
    if (!announcementElement) return;

    // Set the message
    announcementElement.textContent = message;

    // Add class for older browsers
    if (announcementElement.classList) {
      announcementElement.classList.add("scroll-announcement");
    } else {
      // Fallback for older browsers without classList
      announcementElement.className += " scroll-announcement";
    }
    isScrolling = true;

    // Wait for animation to complete
    setTimeout(function () {
      // Remove class for older browsers
      if (announcementElement.classList) {
        announcementElement.classList.remove("scroll-announcement");
      } else {
        // Fallback for older browsers
        announcementElement.className = announcementElement.className.replace(
          /\bscroll-announcement\b/,
          ""
        );
      }
      isScrolling = false;

      // Small delay before next message
      setTimeout(function () {
        if (messageQueue && messageQueue.length > 0) {
          showNextMessage(messageQueue.shift());
        }
      }, 3000);
    }, 25000);
  },

  // ===== ADHKAR FUNCTIONALITY =====

  // Handle Adhkar display logic
  handleAdhkarDisplay: function (currentTime, dayOfWeek, isIrishSummerTime, jamaahTimes) {
    var result = { shouldDisplay: false };

    console.log("Adhkar Debug - Current time:", currentTime, "Day:", dayOfWeek, "Summer time:", isIrishSummerTime);
    console.log("Adhkar Debug - Jamaah times:", jamaahTimes);

    // If Adhkar is already active, don't check again
    if (displayState.adhkarActive) {
      console.log("Adhkar Debug - Already active, skipping");
      return result;
    }

    // Get Adhkar announcements sorted by rank
    var adhkarAnnouncements = this.getAdhkarAnnouncements();
    console.log("Adhkar Debug - Found announcements:", adhkarAnnouncements.length);
    if (!adhkarAnnouncements || adhkarAnnouncements.length === 0) {
      return result;
    }

    // Check each Adhkar configuration in order of rank
    for (var i = 0; i < adhkarAnnouncements.length; i++) {
      var adhkarConfig = adhkarAnnouncements[i];
      
      if (!adhkarConfig.enabled) continue;

      var shouldShow = false;

      // Check trigger conditions
      if (adhkarConfig.trigger.type === "post_jamaah") {
        shouldShow = this.checkPostJamaahTrigger(adhkarConfig, currentTime, jamaahTimes, dayOfWeek);
      } else if (adhkarConfig.trigger.type === "dst_schedule") {
        shouldShow = this.checkDSTScheduleTrigger(adhkarConfig, currentTime, dayOfWeek, isIrishSummerTime);
      }

      if (shouldShow) {
        this.displayAdhkarText(adhkarConfig);
        result.shouldDisplay = true;
        return result;
      }
    }

    return result;
  },

  // Get Adhkar announcements sorted by rank
  getAdhkarAnnouncements: function () {
    if (!dynamicAnnouncements || !Array.isArray(dynamicAnnouncements)) {
      return [];
    }

    return dynamicAnnouncements
      .filter(function(announcement) {
        return announcement.type === "adhkar_text";
      })
      .sort(function(a, b) {
        return (a.rank || 999) - (b.rank || 999);
      });
  },

  // Check if post-jamaah trigger conditions are met
  checkPostJamaahTrigger: function (config, currentTime, jamaahTimes, dayOfWeek) {
    if (!config.trigger.applyToAllJamaah) {
      return false;
    }

    var delayMinutes = config.trigger.delayMinutes !== undefined ? config.trigger.delayMinutes : 8;
    var jamaahTypes = config.trigger.jamaahTypes || [];
    var excludeFridayZohr = config.trigger.excludeFridayZohr || false;
    var excludeFriday = config.trigger.excludeFriday || false;

    // Check for complete Friday exclusion
    if (excludeFriday && dayOfWeek === 5) {
      return { shouldDisplay: false };
    }

    for (var i = 0; i < jamaahTypes.length; i++) {
      var jamaahType = jamaahTypes[i];
      var jamaahTime = jamaahTimes[jamaahType];

      // Check for Friday Zohr exclusion
      if (excludeFridayZohr && jamaahType === "zohrJamaah" && dayOfWeek === 5) {
        continue;
      }

      if (!jamaahTime || isNaN(jamaahTime)) {
        continue;
      }

      // Calculate duration - use pageTimings if available, otherwise fallback to totalDurationMinutes
      var totalDuration = 5; // default fallback
      if (config.display.pageTimings && Array.isArray(config.display.pageTimings)) {
        // Sum up all page timings
        totalDuration = 0;
        for (var j = 0; j < config.display.pageTimings.length; j++) {
          var timing = config.display.pageTimings[j];
          // Parse timing - could be "1:30" (minutes:seconds) or just "2" (minutes)
          if (typeof timing === 'string' && timing.includes(':')) {
            var parts = timing.split(':');
            totalDuration += parseInt(parts[0]) + (parseInt(parts[1]) / 60);
          } else {
            totalDuration += parseFloat(timing);
          }
        }
      } else if (config.display.totalDurationMinutes) {
        totalDuration = config.display.totalDurationMinutes;
      }

      var adhkarStartTime = jamaahTime + delayMinutes;
      var adhkarEndTime = adhkarStartTime + totalDuration;

      if (currentTime >= adhkarStartTime && currentTime < adhkarEndTime) {
        return true;
      }
    }

    return false;
  },

  // Check if DST schedule trigger conditions are met
  checkDSTScheduleTrigger: function (config, currentTime, dayOfWeek, isIrishSummerTime) {
    var trigger = config.trigger;
    
    console.log("DST Trigger Debug - Config:", config.id, "DST Type:", trigger.dstType, "Current Summer Time:", isIrishSummerTime);
    
    // Check if it's the right DST period
    if (trigger.dstType === "forward" && !isIrishSummerTime) {
      console.log("DST Trigger Debug - Wrong DST period (expected forward, got winter)");
      return false;
    }
    if (trigger.dstType === "backward" && isIrishSummerTime) {
      console.log("DST Trigger Debug - Wrong DST period (expected backward, got summer)");
      return false;
    }

    // Get the scheduled time
    var scheduledTime;
    if (isIrishSummerTime && config.seasonalTiming && config.seasonalTiming.summer) {
      scheduledTime = config.seasonalTiming.summer.startTime;
    } else if (!isIrishSummerTime && config.seasonalTiming && config.seasonalTiming.winter) {
      scheduledTime = config.seasonalTiming.winter.startTime;
    } else {
      scheduledTime = trigger.startTime;
    }

    var startTimeMinutes = timeUtils.timeToMinutes(scheduledTime);
    
    // Calculate total duration - use pageTimings if available, otherwise fallback to totalDurationMinutes or durationMinutes
    var totalDuration = 5; // default fallback
    if (config.display.pageTimings && Array.isArray(config.display.pageTimings)) {
      // Sum up all page timings
      totalDuration = 0;
      for (var j = 0; j < config.display.pageTimings.length; j++) {
        var timing = config.display.pageTimings[j];
        // Parse timing - could be "1:30" (minutes:seconds) or just "2" (minutes)
        if (typeof timing === 'string' && timing.includes(':')) {
          var parts = timing.split(':');
          totalDuration += parseInt(parts[0]) + (parseInt(parts[1]) / 60);
        } else {
          totalDuration += parseFloat(timing);
        }
      }
    } else if (trigger.durationMinutes) {
      totalDuration = trigger.durationMinutes;
    } else if (config.display.totalDurationMinutes) {
      totalDuration = config.display.totalDurationMinutes;
    }
    
    var endTimeMinutes = startTimeMinutes + totalDuration;

    console.log("DST Trigger Debug - Scheduled time:", scheduledTime, "Start minutes:", startTimeMinutes, "End minutes:", endTimeMinutes, "Current:", currentTime);

    var shouldTrigger = currentTime >= startTimeMinutes && currentTime < endTimeMinutes;
    console.log("DST Trigger Debug - Should trigger:", shouldTrigger);
    
    return shouldTrigger;
  },

  // Load and display Adhkar text
  displayAdhkarText: function (config) {
    var self = this;
    
    // Set adhkar as active
    displayState.adhkarActive = true;
    displayState.adhkarConfig = config;
    displayState.adhkarCurrentPage = 0;

    // Clear any existing timeout
    if (displayState.adhkarPageTimeout) {
      clearTimeout(displayState.adhkarPageTimeout);
    }

    // Pause any ongoing announcements/images if configured
    if (config.display.takesOverImages) {
      this.pauseOngoingAnnouncements();
    }

    // Initialize cycle tracking
    displayState.adhkarCurrentPage = 0;
    displayState.adhkarCurrentCycle = 0;
    displayState.adhkarTotalPages = config.display.pageCount || 1;
    displayState.adhkarTotalCycles = config.display.repeatCycles || 1;

    // Load the text file if not already loaded
    if (!displayState.adhkarText) {
      fetch(config.textFile)
        .then(function(response) {
          if (!response.ok) {
            throw new Error("Failed to load adhkar text: " + response.status);
          }
          return response.text();
        })
        .then(function(text) {
          displayState.adhkarText = text;
          self.showAdhkarPage(config);
        })
        .catch(function(error) {
          console.error("Error loading adhkar text:", error);
          self.cleanupAdhkarDisplay();
        });
    } else {
      this.showAdhkarPage(config);
    }
  },

  // Distribute verses across pages based on percentage, respecting verse boundaries
  distributeVersesAcrossPages: function(verses, pageDistribution) {
    var totalVerses = verses.length;
    var pages = [];
    var currentVerseIndex = 0;
    
    for (var i = 0; i < pageDistribution.length; i++) {
      var percentage = pageDistribution[i];
      var targetVerseCount = Math.round((percentage / 100) * totalVerses);
      
      // Ensure we at least get 1 verse if there are verses left
      if (targetVerseCount === 0 && currentVerseIndex < totalVerses) {
        targetVerseCount = 1;
      }
      
      // Calculate end index, but don't exceed total verses
      var endIndex = Math.min(currentVerseIndex + targetVerseCount, totalVerses);
      
      // For last page, include all remaining verses
      if (i === pageDistribution.length - 1) {
        endIndex = totalVerses;
      }
      
      // Extract verses for this page
      var pageVerses = verses.slice(currentVerseIndex, endIndex);
      pages.push(pageVerses);
      
      // Move to next starting point
      currentVerseIndex = endIndex;
    }
    
    return pages;
  },

  // Show a specific page of Adhkar text
  showAdhkarPage: function (config) {
    var display = config.display;
    var pageCount = display.pageCount || 1;
    var pageDistribution = display.pageDistribution || [100];
    var currentPage = displayState.adhkarCurrentPage;

    // Split text into verses using <br> as separator
    var fullText = displayState.adhkarText;
    var verses = fullText.split('<br>').filter(function(verse) {
      return verse.trim().length > 0;
    });

    // Distribute verses across pages based on percentage, respecting verse boundaries
    var pageVerses = this.distributeVersesAcrossPages(verses, pageDistribution);
    
    // Get verses for current page
    var currentPageVerses = pageVerses[currentPage] || [];
    var pageText = currentPageVerses.join('<br>');

    // Create and show the display
    var totalCycles = displayState.adhkarTotalCycles;
    var currentCycle = displayState.adhkarCurrentCycle;
    this.renderAdhkarDisplay(pageText, config, currentPage, pageCount, currentCycle, totalCycles);

    // Calculate timing with new pageTimings system
    var showImagesBetweenCycles = display.showImagesBetweenCycles !== false;
    
    // Calculate current page duration from pageTimings array
    var currentPageDuration;
    if (display.pageTimings && Array.isArray(display.pageTimings) && display.pageTimings[currentPage]) {
      var timing = display.pageTimings[currentPage];
      // Parse timing - could be "1:30" (minutes:seconds) or just "2" (minutes)
      if (typeof timing === 'string' && timing.includes(':')) {
        var parts = timing.split(':');
        currentPageDuration = (parseInt(parts[0]) * 60 + parseInt(parts[1])) * 1000; // Convert to milliseconds
      } else {
        currentPageDuration = parseFloat(timing) * 60 * 1000; // Convert minutes to milliseconds
      }
    } else {
      // Fallback to old system for backward compatibility
      var totalDuration = (display.totalDurationMinutes || 5) * 60 * 1000; // Convert to milliseconds
      var imageSlots = showImagesBetweenCycles ? (totalCycles - 1) : 0;
      var totalSlots = (pageCount * totalCycles) + imageSlots;
      currentPageDuration = totalDuration / totalSlots;
    }

    var self = this;
    
    // Determine what to show next
    displayState.adhkarPageTimeout = setTimeout(function() {
      displayState.adhkarCurrentPage++;
      
      // Check if we finished current cycle
      if (displayState.adhkarCurrentPage >= pageCount) {
        displayState.adhkarCurrentPage = 0;
        displayState.adhkarCurrentCycle++;
        
        // Check if we should show image between cycles
        if (displayState.adhkarCurrentCycle < totalCycles && showImagesBetweenCycles) {
          // For image duration, use a fixed 3 seconds or calculate from pageTimings average
          var imageDuration = 3000; // 3 seconds default
          if (display.pageTimings && Array.isArray(display.pageTimings)) {
            // Use average of page timings for image display
            var totalTime = 0;
            for (var k = 0; k < display.pageTimings.length; k++) {
              var timing = display.pageTimings[k];
              if (typeof timing === 'string' && timing.includes(':')) {
                var parts = timing.split(':');
                totalTime += (parseInt(parts[0]) * 60 + parseInt(parts[1]));
              } else {
                totalTime += parseFloat(timing) * 60;
              }
            }
            imageDuration = (totalTime / display.pageTimings.length) * 1000; // Convert average to milliseconds
          }
          // Show announcement image, then continue
          self.showAdhkarInterleaveImage(config, imageDuration);
          return;
        }
      }
      
      // Check if we finished all cycles
      if (displayState.adhkarCurrentCycle >= totalCycles) {
        announcementModule.cleanupAdhkarDisplay();
      } else {
        announcementModule.showAdhkarPage(config);
      }
    }, currentPageDuration);
  },

  // Show announcement image between Adhkar cycles
  showAdhkarInterleaveImage: function(config, duration) {
    var self = this;
    
    // Remove current adhkar display temporarily
    var adhkarContainer = document.getElementById("adhkar-display-container");
    if (adhkarContainer && adhkarContainer.parentNode) {
      adhkarContainer.parentNode.removeChild(adhkarContainer);
    }

    // Get active announcement images
    var activeDynamicAnnouncement = this.getActiveDynamicAnnouncement(new Date());
    if (activeDynamicAnnouncement && activeDynamicAnnouncement.imageAnnouncement) {
      var images = activeDynamicAnnouncement.imageAnnouncement.images;
      if (images && images.length > 0) {
        // Pick a random image
        var randomImage = images[Math.floor(Math.random() * images.length)];
        
        // Show the image briefly (convert milliseconds to seconds)
        this.displayAdhkarInterleaveImage(randomImage, duration / 1000, function() {
          // After image, continue with next Adhkar cycle
          self.showAdhkarPage(config);
        });
        return;
      }
    }
    
    // No image available, continue immediately
    this.showAdhkarPage(config);
  },

  // Display a single image for specified duration (used for Adhkar interleaving)
  displayAdhkarInterleaveImage: function(imagePath, durationSeconds, callback) {
    // Check if there's already an adhkar interleave image running
    var existingAdhkarImage = document.querySelector(".adhkar-interleave-image-container");
    if (existingAdhkarImage) {
      // Already displaying an adhkar interleave image, don't start another
      if (callback) callback();
      return;
    }

    var prayerTimesElement = document.querySelector(".prayer-times");
    var importantTimesElement = document.querySelector(".important-times");

    // Hide both prayer elements together
    this.hidePrayerElements();

    // Create image container
    var imageContainer = document.createElement("div");
    imageContainer.className = "adhkar-interleave-image-container";
    imageContainer.style.width = "100%";
    imageContainer.style.height = "132vh";
    imageContainer.style.display = "flex";
    imageContainer.style.justifyContent = "center";
    imageContainer.style.alignItems = "center";
    imageContainer.style.marginTop = "1.0vw";

    // Create image element
    var imgElement = document.createElement("img");
    imgElement.src = imagePath;
    imgElement.style.maxWidth = "90%";
    imgElement.style.height = "auto";
    imgElement.style.opacity = "0";
    imgElement.style.transition = "opacity 0.5s ease-in-out";

    imageContainer.appendChild(imgElement);

    // Insert container
    if (prayerTimesElement && prayerTimesElement.parentNode) {
      prayerTimesElement.parentNode.insertBefore(imageContainer, prayerTimesElement);
    } else {
      document.body.appendChild(imageContainer);
    }

    // Fade in
    setTimeout(function() {
      imgElement.style.opacity = "1";
    }, 100);

    // Cleanup after duration
    setTimeout(function() {
      if (imageContainer && imageContainer.parentNode) {
        imageContainer.parentNode.removeChild(imageContainer);
      }
      
      // Comprehensive cleanup to ensure no poster remnants
      announcementModule.cleanupAllPosterElements();
      
      if (callback) callback();
    }, durationSeconds * 1000);
  },

  // Render the Adhkar display on screen
  renderAdhkarDisplay: function (text, config, currentPage, totalPages, currentCycle, totalCycles) {
    currentCycle = currentCycle || 0;
    totalCycles = totalCycles || 1;
    
    // First, remove any existing adhkar container to prevent stacking
    var existingContainer = document.getElementById("adhkar-display-container");
    if (existingContainer && existingContainer.parentNode) {
      existingContainer.parentNode.removeChild(existingContainer);
    }

    // Get elements to hide
    var prayerTimesElement = document.querySelector(".prayer-times");
    var importantTimesElement = document.querySelector(".important-times");

    // Save original states - use computed style if inline style is empty
    var originalPrayerTimesState = null;
    if (prayerTimesElement) {
      var originalDisplay = prayerTimesElement.style.display;
      if (!originalDisplay || originalDisplay === "") {
        // Get computed style if no inline style is set
        originalDisplay = window.getComputedStyle(prayerTimesElement).display;
        if (originalDisplay === "none") {
          originalDisplay = ""; // Will default to CSS rules
        }
      }
      originalPrayerTimesState = {
        display: originalDisplay,
        className: prayerTimesElement.className,
      };
    }

    var originalImportantTimesState = null;
    if (importantTimesElement) {
      var originalDisplay = importantTimesElement.style.display;
      if (!originalDisplay || originalDisplay === "") {
        // Get computed style if no inline style is set
        originalDisplay = window.getComputedStyle(importantTimesElement).display;
        if (originalDisplay === "none") {
          originalDisplay = ""; // Will default to CSS rules
        }
      }
      originalImportantTimesState = {
        display: originalDisplay,
        className: importantTimesElement.className,
      };
    }

    // Hide both elements together using helper function
    this.hidePrayerElements();

    // Store original states for cleanup
    displayState.originalPrayerTimesState = originalPrayerTimesState;
    displayState.originalImportantTimesState = originalImportantTimesState;
    displayState.prayerTimesElement = prayerTimesElement;
    displayState.importantTimesElement = importantTimesElement;

    // Create adhkar container
    var adhkarContainer = document.createElement("div");
    adhkarContainer.className = "adhkar-text-container";
    adhkarContainer.id = "adhkar-display-container";

    // Create and format text element with proper styling
    var textElement = document.createElement("div");
    textElement.className = "adhkar-text";
    
    // Format the text with proper sections and dividers
    var formattedText = this.formatAdhkarText(text);
    textElement.innerHTML = formattedText;

    // Calculate dynamic font size based on content amount and page percentage
    var pagePercentage = config.display.pageDistribution[currentPage] || 50;
    var contentLength = text.length;
    var baseSize = this.calculateDynamicFontSize(contentLength, pagePercentage, config);
    
    // Apply dynamic font size to the text container
    textElement.style.fontSize = baseSize.main + "vw";
    textElement.style.lineHeight = baseSize.lineHeight;
    
    // Apply sizes to child elements using CSS custom properties
    textElement.style.setProperty('--dynamic-title-size', baseSize.title + 'vw');
    textElement.style.setProperty('--dynamic-arabic-size', baseSize.arabic + 'vw');
    textElement.style.setProperty('--dynamic-english-size', baseSize.english + 'vw');
    textElement.style.setProperty('--dynamic-repetition-size', baseSize.repetition + 'vw');

    adhkarContainer.appendChild(textElement);

    // Add countdown timer if configured
    if (config.display.showCountdown) {
      var countdownElement = document.createElement("div");
      countdownElement.className = "adhkar-countdown";
      
      // Calculate remaining time for this page using new pageTimings system
      var currentPageDuration;
      if (config.display.pageTimings && Array.isArray(config.display.pageTimings) && config.display.pageTimings[currentPage]) {
        var timing = config.display.pageTimings[currentPage];
        // Parse timing - could be "1:30" (minutes:seconds) or just "2" (minutes)
        if (typeof timing === 'string' && timing.includes(':')) {
          var parts = timing.split(':');
          currentPageDuration = (parseInt(parts[0]) * 60 + parseInt(parts[1])) * 1000; // Convert to milliseconds
        } else {
          currentPageDuration = parseFloat(timing) * 60 * 1000; // Convert minutes to milliseconds
        }
      } else {
        // Fallback to old system for backward compatibility
        var totalDuration = (config.display.totalDurationMinutes || 5) * 60 * 1000;
        var showImagesBetweenCycles = config.display.showImagesBetweenCycles !== false;
        var imageSlots = showImagesBetweenCycles ? (totalCycles - 1) : 0;
        var totalSlots = (totalPages * totalCycles) + imageSlots;
        currentPageDuration = totalDuration / totalSlots;
      }
      
      // Show cycle info if multiple cycles
      var displayText = totalCycles > 1 
        ? "Page " + (currentPage + 1) + "/" + totalPages + " • Cycle " + (currentCycle + 1) + "/" + totalCycles
        : "Page " + (currentPage + 1) + "/" + totalPages;
      
      this.startCountdown(countdownElement, currentPageDuration / 1000, displayText);
      
      // Add countdown to the adhkar container
      adhkarContainer.appendChild(countdownElement);
    }

    // Page indicator removed per user request

    // Insert the adhkar container where prayer-times would normally be (same as images)
    if (prayerTimesElement && prayerTimesElement.parentNode) {
      prayerTimesElement.parentNode.insertBefore(adhkarContainer, prayerTimesElement);
    } else {
      // Fallback: add after date-container
      var dateContainer = document.querySelector(".date-container");
      var insertAfterElement = dateContainer ? dateContainer.nextElementSibling : document.body;
      if (insertAfterElement) {
        insertAfterElement.parentNode.insertBefore(adhkarContainer, insertAfterElement.nextSibling);
      } else {
        document.body.appendChild(adhkarContainer);
      }
    }

    // Fade in effect
    adhkarContainer.style.opacity = "0";
    adhkarContainer.style.transition = "opacity 0.5s ease-in-out";
    setTimeout(function() {
      adhkarContainer.style.opacity = "1";
    }, 100);
  },

  // Start countdown timer
  startCountdown: function (element, seconds, displayText) {
    var remainingSeconds = Math.floor(seconds);
    
    var updateCountdown = function() {
      var minutes = Math.floor(remainingSeconds / 60);
      var secs = remainingSeconds % 60;
      var timeString = (minutes < 10 ? "0" : "") + minutes + ":" + (secs < 10 ? "0" : "") + secs;
      element.textContent = displayText + " • Next in: " + timeString;
      
      if (remainingSeconds > 0) {
        remainingSeconds--;
        setTimeout(updateCountdown, 1000);
      }
    };
    
    updateCountdown();
  },

  // Format Adhkar text with proper sections and dividers
  formatAdhkarText: function (text) {
    if (!text) return "";
    
    var lines = text.split('\n');
    var formattedHtml = "";
    var lastWasEmpty = false;
    
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      
      if (!line) {
        // Mark that we had an empty line, but don't add divider yet
        lastWasEmpty = true;
        continue;
      }
      
      // Check if line is just <br> - add border separator
      if (line === '<br>') {
        formattedHtml += '<div class="adhkar-border-separator"></div>';
        lastWasEmpty = false;
        continue;
      }
      
      // If we had an empty line before this content, add a divider
      if (lastWasEmpty && formattedHtml) {
        formattedHtml += '<div class="adhkar-divider"></div>';
      }
      lastWasEmpty = false;
      
      // Check if it's the main title (first line)
      if (i === 0 || (line.includes('الأذكار بعد الصلاة') || line.includes('Adhkār After Salāh'))) {
        formattedHtml += '<div class="repetition">' + this.escapeHtml(line) + '</div>';
      }
      // Check if it's a special section like "Special Adhkār"
      else if (line === "Special Adhkār" || line === "Special Adhkar") {
        formattedHtml += '<div class="special-section">' + this.escapeHtml(line) + '</div>';
      }
      // Check if it's a repetition count (contains ×)
      else if (line.includes('×')) {
        formattedHtml += '<div class="arabic-text">' + this.escapeHtml(line) + '</div>';
      }
      // Check if it's a section header (starts with English words like "After Fajr Prayer")
      else if (/^[A-Za-z]/.test(line) && !(/[\u0600-\u06FF\u0750-\u077F]/.test(line))) {
        formattedHtml += '<div class="english-text">' + this.escapeHtml(line) + '</div>';
      }
      // Arabic text
      else if (/[\u0600-\u06FF\u0750-\u077F]/.test(line)) {
        formattedHtml += '<div class="arabic-text">' + this.escapeHtml(line) + '</div>';
      }
      // Default text
      else {
        formattedHtml += '<div class="adhkar-section">' + this.escapeHtml(line) + '</div>';
      }
    }
    
    return formattedHtml;
  },

  // Calculate dynamic font size based on content length to fill the page
  calculateDynamicFontSize: function(contentLength, pagePercentage, config) {
    // Simple approach: calculate font size purely based on content length
    // The goal is to fill the entire page regardless of percentage allocation
    
    // Base calculation: less content = larger font, more content = smaller font
    // This ensures each page fills its available space optimally
    var contentFactor = Math.max(0.6, Math.min(1.5, 500 / contentLength));
    
    // Base font size calculation
    var baseFontSize = 2.8 * contentFactor;
    
    // Ensure reasonable size range to prevent overflow or undersized text
    baseFontSize = Math.max(1.8, Math.min(3.2, baseFontSize));
    
    return {
      main: baseFontSize,
      title: baseFontSize * 1.3,
      arabic: baseFontSize * 1.80,
      english: baseFontSize * 0.85,
      repetition: baseFontSize * 0.75,
      lineHeight: Math.max(0.9, 1.2 - (baseFontSize * 0.05))
    };
  },

  // Escape HTML characters
  escapeHtml: function (text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  // Pause ongoing announcements/images
  pauseOngoingAnnouncements: function () {
    // Find and store any existing slideshow
    var existingSlideshow = document.querySelector(".image-slideshow-container");
    if (existingSlideshow) {
      displayState.pausedAnnouncement = {
        element: existingSlideshow,
        parent: existingSlideshow.parentNode,
      };

      if (existingSlideshow.parentNode) {
        existingSlideshow.parentNode.removeChild(existingSlideshow);
      }
    }

    // Clear any existing resume timeout
    if (displayState.resumeTimeout) {
      clearTimeout(displayState.resumeTimeout);
    }
  },

  // Resume paused announcements/images
  resumePausedAnnouncements: function () {
    if (displayState.pausedAnnouncement) {
      var paused = displayState.pausedAnnouncement;
      if (paused.element && paused.parent) {
        paused.parent.appendChild(paused.element);
      }
      displayState.pausedAnnouncement = null;
    }
  },

  // Clean up Adhkar display and restore normal content
  cleanupAdhkarDisplay: function () {
    // Clear timeouts
    if (displayState.adhkarPageTimeout) {
      clearTimeout(displayState.adhkarPageTimeout);
      displayState.adhkarPageTimeout = null;
    }

    // Remove adhkar container
    var adhkarContainer = document.getElementById("adhkar-display-container");
    if (adhkarContainer && adhkarContainer.parentNode) {
      adhkarContainer.parentNode.removeChild(adhkarContainer);
    }

    // Countdown will be removed with the adhkar container
    // No separate cleanup needed since it's a child of adhkarContainer

    // Restore prayer-times element
    if (displayState.prayerTimesElement && displayState.originalPrayerTimesState) {
      displayState.prayerTimesElement.className = displayState.originalPrayerTimesState.className || "";
    }

    // Restore important-times element
    if (displayState.importantTimesElement && displayState.originalImportantTimesState) {
      displayState.importantTimesElement.className = displayState.originalImportantTimesState.className || "";
    }

    // Show both elements together using helper function
    this.showPrayerElements();

    // Resume any paused announcements/images
    this.resumePausedAnnouncements();

    // Reset adhkar state
    displayState.adhkarActive = false;
    displayState.adhkarConfig = null;
    displayState.adhkarCurrentPage = 0;
    displayState.adhkarCurrentCycle = 0;
    displayState.adhkarTotalPages = 0;
    displayState.adhkarTotalCycles = 0;
    displayState.originalPrayerTimesState = null;
    displayState.originalImportantTimesState = null;
    displayState.prayerTimesElement = null;
    displayState.importantTimesElement = null;
  },

  // ===== END ADHKAR FUNCTIONALITY =====
};

// Initialize announcements when the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  announcementModule.init();
  
  // Set up periodic cleanup to prevent ghost poster elements
  setInterval(function() {
    // Only run cleanup if no active announcements are supposed to be showing
    var activeSlideshow = document.querySelector(".image-slideshow-container");
    var activeAdhkarImage = document.querySelector(".adhkar-interleave-image-container");
    var activeTafseer = document.querySelector(".tafseer-display-container");
    var activeAdhkarText = document.getElementById("adhkar-display-container");
    
    if (!activeSlideshow && !activeAdhkarImage && !activeTafseer && !activeAdhkarText) {
      // Check if prayer elements are visible, if not, there might be ghost elements
      var prayerTimesElement = document.querySelector(".prayer-times");
      var importantTimesElement = document.querySelector(".important-times");
      
      if (prayerTimesElement && importantTimesElement) {
        var prayerVisible = window.getComputedStyle(prayerTimesElement).display !== 'none';
        var importantVisible = window.getComputedStyle(importantTimesElement).display !== 'none';
        
        // If both should be visible but aren't, run cleanup
        if (!prayerVisible || !importantVisible) {
          announcementModule.cleanupAllPosterElements();
        }
      }
    }
  }, 10000); // Check every 10 seconds
});
