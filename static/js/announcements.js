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
    return "TAFSEER OF THE QUR'AN • SURAH QAAF • FRIDAY AFTER MAGRIB";
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
var dynamicAnnouncements = [];

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
      .then(response => response.json())
      .then(data => {
        dynamicAnnouncements = data;
        console.log("Loaded dynamic announcements:", dynamicAnnouncements.length);
        // Update announcements immediately after loading
        this.updateAnnouncement();
      })
      .catch(error => {
        console.error("Error loading dynamic announcements:", error);
        // Fallback to empty array if loading fails
        dynamicAnnouncements = [];
      });
  },
  
  // Find active announcement from the dynamic list based on current date/time
  getActiveDynamicAnnouncement: function(now) {
    if (!dynamicAnnouncements || dynamicAnnouncements.length === 0) {
      return null;
    }
    
    var currentTime = now.getTime();
    
    // Find the first announcement that is currently active
    for (var i = 0; i < dynamicAnnouncements.length; i++) {
      var announcement = dynamicAnnouncements[i];
      var startTime = new Date(announcement.startDate).getTime();
      var endTime = new Date(announcement.endDate).getTime();
      
      if (currentTime >= startTime && currentTime <= endTime) {
        return {
          message: announcement.message,
          isSpecial: announcement.isSpecial || false
        };
      }
    }
    
    return null;
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
    var asrJamaahTime = timeUtils.timeToMinutes(times.asrJamaah);
    var magribJamaahTime = timeUtils.timeToMinutes(times.magribJamaah);
    var ishaJamaahTime = timeUtils.timeToMinutes(times.ishaJamaah);

    var announcementElement = document.querySelector(selectors.announcement);
    var message = announcements.default;
    var isWarning = false;
    var isSpecialAnnouncement = false;
    
    // First check for any dynamic announcements
    var activeDynamicAnnouncement = this.getActiveDynamicAnnouncement(now);
    if (activeDynamicAnnouncement) {
      message = activeDynamicAnnouncement.message;
      isSpecialAnnouncement = activeDynamicAnnouncement.isSpecial;
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
      // Set the message text
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
    }
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
