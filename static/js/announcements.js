/**
 * Prayer Times Application - Announcement Module
 * Manages announcements and special event messages
 */

// Core announcement texts and configurations
var announcements = {
  // Permanent announcements
  default: "SILENCE, PLEASE. WE ARE IN THE HOUSE OF ALLAH. KINDLY TURN OFF YOUR MOBILE.",
  
  // Regular recurring announcements
  thursday_darood: function() {
    return "DUROOD/SALAT-ALA-NABI صلى الله عليه وسلم GATHERING • THURSDAY AFTER MAGRIB";
  },
  
  friday_tafseer: function() {
    return "SILENCE, PLEASE. WE ARE IN THE HOUSE OF ALLAH. KINDLY TURN OFF YOUR MOBILE.";
    // return "TAFSEER OF THE QUR'AN • SURAH QAAF • FRIDAY AFTER MAGRIB";
  },
  
  clock_go_forward: function() {
    return "REMEMBER CLOCKS GO FORWARD 1 HOUR THIS SUNDAY";
  },
  
  clock_go_backward: function() {
    return "REMEMBER CLOCKS GO BACKWARD 1 HOUR THIS SUNDAY";
  },
  
  // Warnings - these are permanent and take priority
  warnings: {
    sunrise: function(sunriseTime, endTime) {
      return "NO SALAH AFTER SUNRISE (" + timeUtils.formatTimeWithAmPm(sunriseTime) + ") • Please Wait Until " + timeUtils.formatTimeWithAmPm(endTime);
    },
    zawal: function(zawalTime, zohrTime) {
      return "NO SALAH AT ZAWAL TIME (" + timeUtils.formatTimeWithAmPm(zawalTime) + ") • Please Wait for Zohr to Begin (" + timeUtils.formatTimeWithAmPm(zohrTime) + ")";
    },
    sunset: function(magribTime) {
      return "NO SALAH DURING SUNSET • Please Wait for Magrib Adhan (" + timeUtils.formatTimeWithAmPm(magribTime) + ")";
    }
  }
};

// Dynamic announcements loaded from external source
var dynamicAnnouncements = []; // Initialize as empty array to avoid undefined errors

// Track adhkar and announcement display states
var displayState = {
  adhkarActive: false,
  pausedAnnouncement: null,
  resumeTimeout: null
};

var announcementModule = {
  init: function() {
    // Load dynamic announcements when the page loads
    this.loadDynamicAnnouncements();
    
    // Set up periodic refresh of dynamic announcements (e.g., every hour)
    setInterval(this.loadDynamicAnnouncements.bind(this), 60 * 60 * 1000); 
  },
  
  // Load dynamic announcements from external file
  loadDynamicAnnouncements: function() {
    fetch('/static/data/announcements.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok: ' + response.status);
        }
        return response.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          dynamicAnnouncements = data;
          console.log("Loaded dynamic announcements:", dynamicAnnouncements.length);
        } else {
          console.error("Invalid announcements data format:", data);
          dynamicAnnouncements = [];
        }
        // Update announcements immediately after loading
        this.updateAnnouncement();
      })
      .catch(error => {
        console.error("Error loading dynamic announcements:", error);
        // Fallback to empty array if loading fails
        dynamicAnnouncements = [];
        // Still attempt to update announcements with default values
        this.updateAnnouncement();
      });
  },
  
  // Find active announcement from the dynamic list based on current date/time
  getActiveDynamicAnnouncement: function(now) {
    // Ensure dynamicAnnouncements exists and has items
    if (!dynamicAnnouncements || !Array.isArray(dynamicAnnouncements) || dynamicAnnouncements.length === 0) {
      return null;
    }
    
    var currentTime = now.getTime();
    var activeAnnouncements = {
      textAnnouncement: null,
      imageAnnouncement: null
    };
    
    // Check all announcements
    for (var i = 0; i < dynamicAnnouncements.length; i++) {
      var announcement = dynamicAnnouncements[i];
      
      // Skip invalid announcements
      if (!announcement || !announcement.startDate || !announcement.endDate) {
        continue;
      }
      
      var startTime = new Date(announcement.startDate).getTime();
      var endTime = new Date(announcement.endDate).getTime();
      
      if (currentTime >= startTime && currentTime <= endTime) {
        // Handle both text messages and image announcements
        if (announcement.type === "image") {
          activeAnnouncements.imageAnnouncement = {
            isImage: true,
            images: announcement.images || [],
            displayCondition: announcement.displayCondition || {},
            isSpecial: announcement.isSpecial || false
          };
        } else if (announcement.message) {
          activeAnnouncements.textAnnouncement = {
            message: announcement.message || "",
            isSpecial: announcement.isSpecial || false
          };
        }
      }
    }
    
    return (activeAnnouncements.textAnnouncement || activeAnnouncements.imageAnnouncement) ? 
      activeAnnouncements : null;
  },
  
  // Update the announcement message based on current time and special events
  updateAnnouncement: function() {
    var now = testMode.enabled ? testMode.getMockDate() : new Date();

    // Get current time in minutes from midnight
    var currentTime;
    if (testMode.enabled) {
      // In test mode, use exactly what was set
      const parts = testMode.time.split(":");
      currentTime = parseInt(parts[0]) * 60 + parseInt(parts[1]);
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
      sunrise: document.querySelector(selectors.importantTimes.sunrise).getAttribute('data-time'),
      zawal: document.querySelector(selectors.importantTimes.zawal).getAttribute('data-time'),
      fajrBeginning: document.querySelector(selectors.prayerTimes.fajrBeginning).getAttribute('data-time'),
      zohrBeginning: document.querySelector(selectors.prayerTimes.zohrBeginning).getAttribute('data-time'),
      magribBeginning: document.querySelector(selectors.prayerTimes.magribBeginning).getAttribute('data-time'),
      fajrJamaah: document.querySelector(selectors.prayerTimes.fajrJamaah).getAttribute('data-time'),
      zohrJamaah: document.querySelector(selectors.prayerTimes.zohrJamaah).getAttribute('data-time'),
      asrJamaah: document.querySelector(selectors.prayerTimes.asrJamaah).getAttribute('data-time'),
      magribJamaah: document.querySelector(selectors.prayerTimes.magribJamaah).getAttribute('data-time'),
      ishaJamaah: document.querySelector(selectors.prayerTimes.ishaJamaah).getAttribute('data-time')
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
    
    // First check if Adhkar should be displayed - this takes precedence over dynamic announcements
    var adhkarDisplay = this.handleAdhkarDisplay(
      currentTime, 
      dayOfWeek, 
      isIrishSummerTime,
      {
        fajrJamaah: fajrJamaahTime,
        zohrJamaah: zohrJamaahTime,
        asrJamaah: asrJamaahTime,
        magribJamaah: magribJamaahTime,
        ishaJamaah: ishaJamaahTime
      }
    );
    
    if (adhkarDisplay.shouldDisplay) {
      // If Adhkar should be displayed, it takes priority
      // Don't process other announcements now
      return;
    }
    
    // Check for any dynamic announcements
    var activeDynamicAnnouncement = this.getActiveDynamicAnnouncement(now);
    if (activeDynamicAnnouncement) {
      // Handle text announcement
      if (activeDynamicAnnouncement.textAnnouncement) {
        message = activeDynamicAnnouncement.textAnnouncement.message || announcements.default;
        isSpecialAnnouncement = activeDynamicAnnouncement.textAnnouncement.isSpecial;
      }
      
      // Handle image announcement separately (can exist alongside text)
      if (activeDynamicAnnouncement.imageAnnouncement) {
        imageData = {
          images: activeDynamicAnnouncement.imageAnnouncement.images,
          displayCondition: activeDynamicAnnouncement.imageAnnouncement.displayCondition,
          isSpecial: activeDynamicAnnouncement.imageAnnouncement.isSpecial
        };
      }
    }
    // If no dynamic announcement, use standard recurring announcements
    else {
      // Regular announcements logic
      if (isIrishSummerTime) {
        if (dayOfWeek === 4 && currentTime >= fajrTime && currentTime < magribJamaahTime + 5) {
          // Thursday
          message = announcements.thursday_darood();
        }
        else if (dayOfWeek === 4 && currentTime >= magribJamaahTime + 6 && currentTime < (23 * 60 + 59)) {
          // Thursday After Magrib
          message = announcements.friday_tafseer();
        }
        else if (dayOfWeek === 5 && currentTime > (0 * 60 + 1) && currentTime < magribJamaahTime + 10) {
          // Friday
          message = announcements.friday_tafseer();
        }
      } else {
        // Winter time rules
        if (dayOfWeek === 4 && currentTime >= fajrTime && currentTime < ishaJamaahTime + 5) {
          // Thursday
          message = announcements.thursday_darood();
        }
        else if (dayOfWeek === 4 && currentTime >= ishaJamaahTime + 6 && currentTime < (23 * 60 + 59)) {
          // Thursday After Isha
          message = announcements.friday_tafseer();
        }
        else if (dayOfWeek === 5 && currentTime > (0 * 60 + 1) && currentTime < ishaJamaahTime + 10) {
          // Friday
          message = announcements.friday_tafseer();
        }
      }
    }

    // Then check for warnings (which take precedence over any other messages)
    if (currentTime >= sunriseTime && currentTime < sunriseTime + 15) {
      message = announcements.warnings.sunrise(times.sunrise, timeUtils.addMinutes(times.sunrise, 15));
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
      announcementElement.classList.remove("announcement-text-normal", "announcement-text-long", "announcement-text-very-long");
      announcementElement.classList.remove("announcement-warning", "special-announcement");
      document.querySelector(".announcement").classList.remove("warning-active", "special-active");

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
      if (imageData && !isWarning) {
        this.handleImageAnnouncement(
          imageData, 
          currentTime, 
          [fajrJamaahTime, zohrJamaahTime, asrJamaahTime, magribJamaahTime, ishaJamaahTime]
        );
      }
    }
  },
  
  // Handle Adhkar image display after jamaah times and during Friday Zohr
  handleAdhkarDisplay: function(currentTime, dayOfWeek, isIrishSummerTime, jamaahTimes) {
    var result = {
      shouldDisplay: false
    };
    
    // If Adhkar is already active, don't check again
    if (displayState.adhkarActive) {
      return result;
    }
    
    // Special case: Friday Zohr continuous display
    if (dayOfWeek === 5) { // Friday
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
    var jamaahTypes = ['fajrJamaah', 'zohrJamaah', 'asrJamaah', 'magribJamaah', 'ishaJamaah'];
    
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
        this.pauseOngoingAnnouncements();
        
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
  
  // Pause ongoing announcements to show Adhkar
  pauseOngoingAnnouncements: function() {
    // Set the adhkar active flag
    displayState.adhkarActive = true;
    
    // Find and store any existing slideshow
    var existingSlideshow = document.querySelector('.image-slideshow-container');
    if (existingSlideshow) {
      // Save the current state of the slideshow
      displayState.pausedAnnouncement = {
        element: existingSlideshow,
        parent: existingSlideshow.parentNode
      };
      
      // Remove it temporarily
      if (existingSlideshow.parentNode) {
        existingSlideshow.parentNode.removeChild(existingSlideshow);
      }
    }
    
    // Clear any existing resume timeout
    if (displayState.resumeTimeout) {
      clearTimeout(displayState.resumeTimeout);
    }
  },
  
  // Resume paused announcements after Adhkar display
  resumeAnnouncements: function() {
    // Reset the adhkar active flag
    displayState.adhkarActive = false;
    
    // If there was a paused announcement, restore it
    if (displayState.pausedAnnouncement) {
      var paused = displayState.pausedAnnouncement;
      
      if (paused.element && paused.parent) {
        paused.parent.appendChild(paused.element);
      }
      
      // Clear the paused state
      displayState.pausedAnnouncement = null;
    }
  },
  
  // Display the Adhkar image for a specified duration
  displayAdhkarImage: function(durationSeconds) {
    // Get both the prayer-times and important-times elements that we'll hide
    var prayerTimesElement = document.querySelector('.prayer-times');
    var importantTimesElement = document.querySelector('.important-times');
    
    // Save original state of prayer-times
    var originalPrayerTimesState = null;
    if (prayerTimesElement) {
      originalPrayerTimesState = {
        display: prayerTimesElement.style.display,
        html: prayerTimesElement.innerHTML,
        className: prayerTimesElement.className
      };
      
      // Hide the prayer-times element
      prayerTimesElement.style.display = 'none';
    }
    
    // Save original state of important-times
    var originalImportantTimesState = null;
    if (importantTimesElement) {
      originalImportantTimesState = {
        display: importantTimesElement.style.display,
        html: importantTimesElement.innerHTML,
        className: importantTimesElement.className
      };
      
      // Hide the important-times element
      importantTimesElement.style.display = 'none';
    }
    
    // Create adhkar container
    var adhkarContainer = document.createElement('div');
    adhkarContainer.className = 'adhkar-container image-slideshow-container';
    adhkarContainer.style.width = '100%';
    adhkarContainer.style.height = '132vh'; // Set container height to 60% of viewport height
    adhkarContainer.style.display = 'flex';
    adhkarContainer.style.justifyContent = 'center';
    adhkarContainer.style.alignItems = 'center';
    adhkarContainer.style.marginTop = '1.0vw'; // Reduced margin to give more space for image
    adhkarContainer.style.padding = '0'; // Remove padding to maximize space
    
    // Insert the adhkar container where prayer-times would normally be
    if (prayerTimesElement && prayerTimesElement.parentNode) {
      prayerTimesElement.parentNode.insertBefore(adhkarContainer, prayerTimesElement);
    } else {
      // Fallback: add after date-container's divider
      var dateContainer = document.querySelector('.date-container');
      var insertAfterElement = dateContainer ? dateContainer.nextElementSibling : document.body;
      if (insertAfterElement) {
        insertAfterElement.parentNode.insertBefore(adhkarContainer, insertAfterElement.nextSibling);
      } else {
        document.body.appendChild(adhkarContainer);
      }
    }
    
    // Create the image element
    var imgElement = document.createElement('img');
    imgElement.src = '/static/images/english-adhkar.jpg';
    imgElement.style.maxWidth = '100%'; // Increased from 90%
    imgElement.style.maxHeight = '100%'; // Added maxHeight to fill container height
    imgElement.style.height = 'auto';
    imgElement.style.width = 'auto';
    imgElement.style.objectFit = 'contain'; // Ensure image maintains aspect ratio while filling space
    imgElement.style.transition = 'opacity 0.5s ease-in-out';
    imgElement.style.opacity = '0';
    imgElement.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)'; // Add subtle shadow for better visibility
    
    // Add the image to container
    adhkarContainer.appendChild(imgElement);
    
    // Fade in the image
    setTimeout(function() {
      imgElement.style.opacity = '1';
    }, 100);
    
    // Set up cleanup and resumption of original content
    displayState.resumeTimeout = setTimeout(function() {
      // Remove adhkar container
      if (adhkarContainer.parentNode) {
        adhkarContainer.parentNode.removeChild(adhkarContainer);
      }
      
      // Restore prayer-times element
      if (prayerTimesElement && originalPrayerTimesState) {
        prayerTimesElement.style.display = originalPrayerTimesState.display || '';
        prayerTimesElement.className = originalPrayerTimesState.className || '';
      }
      
      // Restore important-times element
      if (importantTimesElement && originalImportantTimesState) {
        importantTimesElement.style.display = originalImportantTimesState.display || '';
        importantTimesElement.className = originalImportantTimesState.className || '';
      }
      
      // Resume any paused announcements
      announcementModule.resumeAnnouncements();
    }, durationSeconds * 1000);
  },
  
  // Handle image announcements with display conditions
  handleImageAnnouncement: function(imageData, currentTime, jamaahTimes) {
    // Don't process if Adhkar is active
    if (displayState.adhkarActive) {
      return;
    }
    
    var displayCondition = imageData.displayCondition;
    var frequency = displayCondition.frequency || 5; // Default: every 5 minutes
    var duration = displayCondition.duration || 10;  // Default: 10 seconds
    var avoidJamaahTime = displayCondition.avoidJamaahTime !== false; // Default: true
    
    // Check if we're within 2 minutes of any jamaah time
    if (avoidJamaahTime && jamaahTimes) {
      for (var i = 0; i < jamaahTimes.length; i++) {
        var jamaahTime = jamaahTimes[i];
        // Check if jamaahTime is valid before comparing
        if (jamaahTime && !isNaN(jamaahTime) && Math.abs(currentTime - jamaahTime) <= 2) {
          // We're within 2 minutes of jamaah time, don't show images
          return;
        }
      }
    }
    
    // Check if we should show images now based on frequency
    var currentMinute = Math.floor(currentTime % (24 * 60));
    var currentSecond = new Date().getSeconds();
    
    if (currentMinute % frequency === 0 && currentSecond < duration) {
      // Time to display an image!
      this.displayRotatingImages(imageData.images, duration);
    }
  },
  
  // Display rotating images with proper timing
  displayRotatingImages: function(images, duration) {
    // Removed the announcementElement parameter since we're not modifying it
    if (!images || images.length === 0) return;
    
    // Create ID for this slideshow session to avoid conflicts
    var slideshowId = 'slideshow-' + new Date().getTime();
    
    // Check if there's already a slideshow running
    var existingSlideshow = document.querySelector('.image-slideshow-container');
    if (existingSlideshow) {
      // Already displaying images, don't start another slideshow
      return;
    }
    
    // Get the prayer-times and important-times elements that we'll hide
    var prayerTimesElement = document.querySelector('.prayer-times');
    var importantTimesElement = document.querySelector('.important-times');
    
    // Save original state of prayer-times
    var originalPrayerTimesState = null;
    if (prayerTimesElement) {
      originalPrayerTimesState = {
        display: prayerTimesElement.style.display,
        html: prayerTimesElement.innerHTML,
        className: prayerTimesElement.className
      };
      
      // Hide the prayer-times element
      prayerTimesElement.style.display = 'none';
    }
    
    // Save original state of important-times
    var originalImportantTimesState = null;
    if (importantTimesElement) {
      originalImportantTimesState = {
        display: importantTimesElement.style.display,
        html: importantTimesElement.innerHTML,
        className: importantTimesElement.className
      };
      
      // Hide the important-times element
      importantTimesElement.style.display = 'none';
    }
    
    // Store the original states in window for later retrieval
    window[slideshowId] = {
      prayerTimesState: originalPrayerTimesState,
      prayerTimesElement: prayerTimesElement,
      importantTimesState: originalImportantTimesState,
      importantTimesElement: importantTimesElement
    };
    
    // Create image container that will be placed in the same location as prayer-times
    var imageContainer = document.createElement('div');
    imageContainer.id = slideshowId;
    imageContainer.className = 'image-slideshow-container';
    imageContainer.style.width = '100%';
    imageContainer.style.textAlign = 'center';
    imageContainer.style.marginTop = '2.0vw';
    imageContainer.style.padding = '0.5vw';
    
    // Insert the image container where prayer-times would normally be
    if (prayerTimesElement && prayerTimesElement.parentNode) {
      prayerTimesElement.parentNode.insertBefore(imageContainer, prayerTimesElement);
    } else {
      // Fallback: add after date-container's divider
      var dateContainer = document.querySelector('.date-container');
      var insertAfterElement = dateContainer ? dateContainer.nextElementSibling : document.body;
      if (insertAfterElement) {
        insertAfterElement.parentNode.insertBefore(imageContainer, insertAfterElement.nextSibling);
      } else {
        document.body.appendChild(imageContainer);
      }
    }
    
    // Create the image element with simple fade transition
    var imgElement = document.createElement('img');
    imgElement.style.maxWidth = '90%';
    imgElement.style.height = 'auto';
    imgElement.style.transition = 'opacity 0.5s ease-in-out';
    imgElement.style.opacity = '1';
    
    // Add the image to container
    imageContainer.appendChild(imgElement);
    
    var currentIndex = 0;
    
    // Function to show the next image with simple fade transition
    var showNextImage = function() {
      if (currentIndex >= images.length) {
        // We've shown all images, clean up and restore original content
        cleanupSlideshow(slideshowId);
        return;
      }
      
      // Load the next image
      imgElement.style.opacity = '0';
      
      setTimeout(function() {
        // Set new image source
        imgElement.src = images[currentIndex];
        
        // When image loads, fade it in
        imgElement.onload = function() {
          imgElement.style.opacity = '1';
        };
        
        // Handle image load error
        imgElement.onerror = function() {
          console.error("Failed to load image:", images[currentIndex]);
          currentIndex++;
          setTimeout(showNextImage, 100); // Try next image quickly
        };
        
        // Increment index for next round
        currentIndex++;
        
        // Set timer for next image
        setTimeout(showNextImage, duration * 1000);
      }, 500); // Brief fade-out transition
    };
    
    // Function to clean up slideshow and restore original elements
    var cleanupSlideshow = function(id) {
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
          
          el.style.display = state.display || '';
          el.className = state.className || '';
        }
        
        // Restore important-times
        if (savedState.importantTimesElement && savedState.importantTimesState) {
          var el = savedState.importantTimesElement;
          var state = savedState.importantTimesState;
          
          el.style.display = state.display || '';
          el.className = state.className || '';
        }
      }
      
      // Clean up saved state
      delete window[id];
    };
    
    // Start the slideshow
    imgElement.onload = function() {
      imgElement.style.opacity = '1';
      currentIndex++;
      setTimeout(showNextImage, duration * 1000);
    };
    
    // Set the first image
    imgElement.src = images[0];
  },
  
  // Show next message in the queue with scrolling effect
  showNextMessage: function(message) {
    var announcementElement = document.querySelector(selectors.announcement);
    if (!announcementElement) return;

    // Set the message
    announcementElement.textContent = message;

    // Add class for older browsers
    if (announcementElement.classList) {
      announcementElement.classList.add('scroll-announcement');
    } else {
      // Fallback for older browsers without classList
      announcementElement.className += ' scroll-announcement';
    }
    isScrolling = true;

    // Wait for animation to complete
    setTimeout(function () {
      // Remove class for older browsers
      if (announcementElement.classList) {
        announcementElement.classList.remove('scroll-announcement');
      } else {
        // Fallback for older browsers
        announcementElement.className = announcementElement.className
          .replace(/\bscroll-announcement\b/, '');
      }
      isScrolling = false;

      // Small delay before next message
      setTimeout(function () {
        if (messageQueue && messageQueue.length > 0) {
          showNextMessage(messageQueue.shift());
        }
      }, 3000);
    }, 25000);
  }
};

// Initialize announcements when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  announcementModule.init();
});
