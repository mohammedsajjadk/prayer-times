/**
 * Prayer Times Application - Adhkar Display Module
 * Handles post-prayer adhkar and special image displays
 */

var AdhkarDisplayManager = {
  // Handle Adhkar image display after jamaah times and during Friday Zohr
  handleAdhkarDisplay: function (currentTime, dayOfWeek, isIrishSummerTime, jamaahTimes) {
    var result = {
      shouldDisplay: false,
    };

    // If Adhkar is already active, don't check again
    if (DisplayStateManager.isAdhkarActive()) {
      return result;
    }

    // Special case: Friday Zohr continuous display
    if (dayOfWeek === 5) {
      // Friday
      // Define the time range based on Irish time (summer/winter)
      var startTime, endTime;
      if (isIrishSummerTime) {
        // Irish Summer Time: 2:00 PM to 2:30 PM
        startTime = 14 * 60; // 2:00 PM
        endTime = 14 * 60 + 30; // 2:30 PM
      } else {
        // Irish Winter Time: 1:30 PM to 2:00 PM
        startTime = 13 * 60 + 30; // 1:30 PM
        endTime = 14 * 60; // 2:00 PM
      }

      // Check if current time is within the Friday Zohr Adhkar display window
      if (currentTime >= startTime && currentTime < endTime) {
        // For Friday Zohr special case, display Adhkar only for the first 5 minutes
        // Then allow other announcements for remaining time
        if (currentTime < startTime + 5) {
          this.displayAdhkarImage(5 * 60); // Display for 5 minutes (300 seconds)
          result.shouldDisplay = true;
          return result;
        } else {
          // After the first 5 minutes, continue with regular announcements
          return result;
        }
      }
    }

    // Regular jamaah-based Adhkar display for all days
    var jamaahTypes = [
      "fajrJamaah",
      "zohrJamaah",
      "asrJamaah",
      "magribJamaah",
      "ishaJamaah",
    ];

    for (var i = 0; i < jamaahTypes.length; i++) {
      var jamaahType = jamaahTypes[i];
      var jamaahTime = jamaahTimes[jamaahType];

      // Skip if jamaah time is invalid or missing
      if (!jamaahTime || isNaN(jamaahTime)) continue;

      // Adhkar starts 7 minutes after jamaah and lasts for 5 minutes
      var adhkarStartTime = jamaahTime + 7;
      var adhkarEndTime = adhkarStartTime + 5;

      // Check if current time is within the adhkar display window
      if (currentTime >= adhkarStartTime && currentTime < adhkarEndTime) {
        // Pause any ongoing announcement display
        DisplayStateManager.pauseOngoingAnnouncements();

        // Calculate remaining display time in seconds
        var remainingSeconds = (adhkarEndTime - currentTime) * 60;

        // Display the Adhkar image
        this.displayAdhkarImage(remainingSeconds);

        result.shouldDisplay = true;
        return result;
      }
    }

    return result;
  },

  // Display the Adhkar image for a specified duration
  displayAdhkarImage: function (durationSeconds) {
    var self = this;
    
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

    // Create adhkar container
    var adhkarContainer = this.createImageContainer("adhkar-container");

    // Insert the adhkar container where prayer-times would normally be
    this.insertImageContainer(adhkarContainer, prayerTimesElement);

    // Create and configure the image element
    var imgElement = this.createImageElement("/static/images/english-adhkar.jpg");

    // Add the image to container
    adhkarContainer.appendChild(imgElement);

    // Fade in the image
    setTimeout(function () {
      imgElement.style.opacity = "1";
    }, 100);

    // Set up cleanup and resumption of original content
    DisplayStateManager.setResumeTimeout(function () {
      self.cleanupImageDisplay(
        adhkarContainer,
        prayerTimesElement,
        originalPrayerTimesState,
        importantTimesElement,
        originalImportantTimesState
      );

      // Resume any paused announcements
      DisplayStateManager.resumeAnnouncements();
    }, durationSeconds * 1000);
  },

  // Display the Tafseer image for Friday
  displayTafseerImage: function (durationSeconds) {
    var self = this;
    
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

    // Create tafseer container
    var tafseerContainer = this.createImageContainer("tafseer-container");

    // Insert the tafseer container where prayer-times would normally be
    this.insertImageContainer(tafseerContainer, prayerTimesElement);

    // Create and configure the image element
    var imgElement = this.createImageElement("/static/images/Tafseer of the Quran.jpg");

    // Add the image to container
    tafseerContainer.appendChild(imgElement);

    // Fade in the image
    setTimeout(function () {
      imgElement.style.opacity = "1";
    }, 100);

    // Set up cleanup and resumption of original content
    DisplayStateManager.setResumeTimeout(function () {
      self.cleanupImageDisplay(
        tafseerContainer,
        prayerTimesElement,
        originalPrayerTimesState,
        importantTimesElement,
        originalImportantTimesState
      );

      // Resume any paused announcements
      DisplayStateManager.resumeAnnouncements();
    }, durationSeconds * 1000);

    // Set the adhkar active flag to prevent other announcements during display
    DisplayStateManager.setAdhkarActive(true);
  },

  // Helper function to create image container
  createImageContainer: function (className) {
    var container = document.createElement("div");
    container.className = className + " image-slideshow-container";
    container.style.width = "100%";
    container.style.height = "132vh";
    container.style.display = "flex";
    container.style.justifyContent = "center";
    container.style.alignItems = "center";
    container.style.marginTop = "1.0vw";
    container.style.padding = "0";
    return container;
  },

  // Helper function to create image element
  createImageElement: function (src) {
    var imgElement = document.createElement("img");
    imgElement.src = src;
    imgElement.style.maxWidth = "100%";
    imgElement.style.maxHeight = "100%";
    imgElement.style.height = "auto";
    imgElement.style.width = "auto";
    imgElement.style.objectFit = "contain";
    imgElement.style.transition = "opacity 0.5s ease-in-out";
    imgElement.style.opacity = "0";
    imgElement.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
    return imgElement;
  },

  // Helper function to insert image container in the correct position
  insertImageContainer: function (container, prayerTimesElement) {
    if (prayerTimesElement && prayerTimesElement.parentNode) {
      prayerTimesElement.parentNode.insertBefore(container, prayerTimesElement);
    } else {
      // Fallback: add after date-container's divider
      var dateContainer = document.querySelector(".date-container");
      var insertAfterElement = dateContainer
        ? dateContainer.nextElementSibling
        : document.body;
      if (insertAfterElement) {
        insertAfterElement.parentNode.insertBefore(
          container,
          insertAfterElement.nextSibling
        );
      } else {
        document.body.appendChild(container);
      }
    }
  },

  // Helper function to cleanup image display and restore original elements
  cleanupImageDisplay: function (
    container,
    prayerTimesElement,
    originalPrayerTimesState,
    importantTimesElement,
    originalImportantTimesState
  ) {
    // Remove the container
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }

    // Restore prayer-times element
    if (prayerTimesElement && originalPrayerTimesState) {
      prayerTimesElement.style.display = originalPrayerTimesState.display || "";
      prayerTimesElement.className = originalPrayerTimesState.className || "";
    }

    // Restore important-times element
    if (importantTimesElement && originalImportantTimesState) {
      importantTimesElement.style.display = originalImportantTimesState.display || "";
      importantTimesElement.className = originalImportantTimesState.className || "";
    }
  },
};
