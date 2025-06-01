/**
 * Prayer Times Application - Announcement Module
 * Manages announcements and special event messages
 */

// Announcement texts and configurations
var announcements = {
  default: "SILENCE, PLEASE. WE ARE IN THE HOUSE OF ALLAH. KINDLY TURN OFF YOUR MOBILE.",
  spiritual_weekend: "SPIRITUAL WEEKEND WITH ULAMA FROM UK • Check notice board for further details",
  
  // Special spiritual weekend announcements
  spiritual_weekend_thu_full: "DUROOD/SALAT-ALA-NABI صلى الله عليه وسلم GATHERING-THURSDAY AFTER MAGRIB • Special Jumuah Talk—1.15pm (Guest speaker Shaykh Saeed Ahmed from UK) • Special Tafseer of Qur'an—Fri after Magrib (Guest speaker Shaykh Dr Mahmood Chandia from UK) • SPIRITUAL WEEKEND WITH ULAMA FROM UK—Check notice board for further details",
  spiritual_weekend_jumuah: "Special Jumuah Talk—1.15pm (Guest speaker Shaykh Saeed Ahmed from UK) • Special Tafseer of Qur'an—Fri after Magrib (Guest speaker Shaykh Dr Mahmood Chandia from UK) • SPIRITUAL WEEKEND WITH ULAMA FROM UK—Check notice board for further details",
  spiritual_weekend_jumuah_part2: "Special Tafseer of Qur'an—Fri after Magrib (Guest speaker Shaykh Dr Mahmood Chandia from UK) ■ SPIRITUAL WEEKEND WITH ULAMA FROM UK on Sunday • Women's Bayan After Zohr (2:30PM) • Men's Bayan After Asr (7:15PM) • Food Served After the Programmes",
  spiritual_weekend_basic: "SPIRITUAL WEEKEND WITH ULAMA FROM UK on Sunday • Women's Bayan After Zohr (2:30PM) • Men's Bayan After Asr (7:15PM) • Food Served After the Programmes",

  // Eid ul Adha announcements
  eid_announcements: {
    may29_durood: "DUROOD/SALAT-ALA-NABI صلى الله عليه وسلم GATHERING • THURSDAY AFTER MAGRIB ■ Day of Arafah (9th Dhul Hijjah) - Thurs 5th June • Eid ul Adha - Fri 6th June • Eid Talk - 7:30am • Eid Salaah 8am",
    may30_tafseer: "TAFSEER OF THE QUR'AN • SURAH QAAF • FRIDAY AFTER MAGRIB ■ Day of Arafah (9th Dhul Hijjah) - Thurs 5th June • Eid ul Adha - Fri 6th June • Eid Talk - 7:30am • Eid Salaah 8am", 
    june4_arafah: "Day of Arafah (9th Dhul Hijjah) - Thurs 5th June • Eid ul Adha - Fri 6th June • Eid Talk - 7:30am • Eid Salaah 8am",
    june4_durood: "DUROOD/SALAT-ALA-NABI صلى الله عليه وسلم GATHERING • THURSDAY AFTER MAGRIB ■ Day of Arafah (9th Dhul Hijjah) - Thurs 5th June • Eid ul Adha - Fri 6th June • Eid Talk - 7:30am • Eid Salaah 8am",
    june5_eid: "Eid ul Adha - Fri 6th June • Eid Talk - 7:30am • Eid Salaah 8am"
  },

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
  
  special_sessions: {
    umrah: "UPCOMING PROGRAM • HOW TO PERFORM UMRAH • WEDNESDAY AFTER MAGRIB",
    hajj: "UPCOMING PROGRAM • HOW TO PERFORM HAJJ • THURSDAY AFTER MAGRIB",
    madeenah: "UPCOMING PROGRAM • SESSION 3: VISIT TO MADEENAH MUNAWWARAH • FRIDAY AFTER MAGRIB",
    all_sessions: "UPCOMING PROGRAMS • SESSION 1: HOW TO PERFORM UMRAH (WED AFTER MAGRIB) • SESSION 2: HOW TO PERFORM HAJJ (THURS AFTER MAGRIB) • SESSION 3: VISIT TO MADEENAH MUNAWWARAH (FRI AFTER MAGRIB)",
    hajj_madeenah: "UPCOMING PROGRAMS • SESSION 2: HOW TO PERFORM HAJJ (THURS AFTER MAGRIB) • SESSION 3: VISIT TO MADEENAH MUNAWWARAH (FRI AFTER MAGRIB)"
  },
  
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

var announcementModule = {
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

    // Continue with regular announcement code
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
    
    // Check for Eid ul Adha announcements first (highest priority)
    var eidAnnouncement = this.checkEidAnnouncements(now, times.magribJamaah);
    if (eidAnnouncement) {
      message = announcements.eid_announcements[eidAnnouncement];
      isSpecialAnnouncement = true;
    }
    // If not Eid announcement, check if we're in the spiritual weekend period
    else if (this.isWithinSpiritualWeekend(now)) {
      isSpecialAnnouncement = true;
      
      // Get the specific phase of the spiritual weekend
      var weekendPhase = this.getSpiritualWeekendPhase(now, dayOfWeek, currentTime, 
        magribJamaahTime, isIrishSummerTime);
      
      if (weekendPhase === "thursday_full") {
        message = announcements.spiritual_weekend_thu_full;
      } else if (weekendPhase === "jumuah_phase") {
        message = announcements.spiritual_weekend_jumuah;
      } else if (weekendPhase === "jumuah_phase_part2") {
        message = announcements.spiritual_weekend_jumuah_part2;
      } else {
        message = announcements.spiritual_weekend_basic;
      }
    }
    // If not in spiritual weekend, check for special session periods
    else {
      var specialSessionPeriod = this.checkSpecialSessionPeriod(now);
      if (specialSessionPeriod) {
        message = announcements.special_sessions[specialSessionPeriod];
        isSpecialAnnouncement = true;
      } else {
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
  
  // Check if date is within the spiritual weekend period
  isWithinSpiritualWeekend: function(now) {
    if (testMode.enabled) {
      now = testMode.getMockDate();
    }
    
    // Spiritual Weekend dates (May 18-25, 2025)
    var weekendStart = new Date(Date.UTC(2025, 4, 18, 0, 0, 0)); // May 18, 2025 00:00 UTC
    var weekendEnd = new Date(Date.UTC(2025, 4, 25, 19, 20, 0)); // May 25, 2025 19:20 UTC
    
    // Current time
    var currentTime = now.getTime();
    
    // Check if we're in the period
    return currentTime >= weekendStart.getTime() && currentTime <= weekendEnd.getTime();
  },
  
  // Function to determine which phase of the spiritual weekend we're in
  getSpiritualWeekendPhase: function(now, dayOfWeek, currentTime, magribJamaahTime, isIrishSummerTime) {
    if (testMode.enabled) {
      now = testMode.getMockDate();
    }
    
    // Get Friday's Jumuah time (1:15pm = 13*60 + 15 = 795 minutes)
    var jumuahTimeInMinutes = 13 * 60 + 15;
    
    // Spiritual Weekend dates (May 18-25, 2025)
    var weekendStart = new Date(Date.UTC(2025, 4, 18, 0, 0, 0)); // May 18, 2025 00:00 UTC
    var fridayJumuahTime = new Date(Date.UTC(2025, 4, 23, 13, 15, 0)); // May 23, 2025 13:15 UTC
    var sundayMagribTime = new Date(Date.UTC(2025, 4, 25, 19, 20, 0)); // May 25, 2025 19:20 UTC
    
    // Current time
    var currentDateMs = now.getTime();
    
    // Thursday full announcement period (Thursday 00:00 to Magrib Jamaah + 4 mins)
    if (dayOfWeek === 4 && currentTime <= (magribJamaahTime + 4)) {
      return "thursday_full";
    }
    
    // Period between Thursday after Magrib to Friday Jumuah at 13:15
    if ((dayOfWeek === 4 && currentTime > (magribJamaahTime + 5)) || 
        (dayOfWeek === 5 && currentTime < jumuahTimeInMinutes)) {
      return "jumuah_phase";
    }

    // Period between Friday Jumuah at 13:15 to Friday after Magrib
    if (dayOfWeek === 5 && currentTime >= jumuahTimeInMinutes && currentTime < (magribJamaahTime + 5)) {
      return "jumuah_phase_part2";
    }
    
    // Basic announcement for all other times during the spiritual weekend
    return "basic";
  },
  
  // Check if we're in a special session period
  checkSpecialSessionPeriod: function(now) {
    if (testMode.enabled) {
      now = testMode.getMockDate();
    }
    
    // Special session dates (May 2025)
    var specialStart = new Date(Date.UTC(2025, 4, 10, 0, 0, 0)); // May 11, 2025 00:00 UTC
    var session1End = new Date(Date.UTC(2025, 4, 14)); // May 13, 2025
    var session2End = new Date(Date.UTC(2025, 4, 15)); // May 14, 2025
    var session3End = new Date(Date.UTC(2025, 4, 16)); // May 15, 2025
    
    // Get magrib jamaah times for the session end days
    var magribJamaahEl = document.querySelector(selectors.prayerTimes.magribJamaah);
    var magribJamaahTime = magribJamaahEl ? magribJamaahEl.getAttribute('data-time') : "19:00"; // Default fallback
    
    if (magribJamaahTime && magribJamaahTime.indexOf(':') !== -1) {
      var timeParts = magribJamaahTime.split(':');
      var magribHours = parseInt(timeParts[0]);
      var magribMins = parseInt(timeParts[1]);
      
      // Set end times to Magrib Jamaah + 5 mins
      session1End.setUTCHours(magribHours, magribMins + 5, 0, 0);
      session2End.setUTCHours(magribHours, magribMins + 5, 0, 0);
      session3End.setUTCHours(magribHours, magribMins + 5, 0, 0);
      
      // Set start times for sessions 2 and 3 to Magrib Jamaah + 6 mins of the previous day
      var session1EndPlus1 = new Date(session1End);
      session1EndPlus1.setUTCMinutes(session1End.getUTCMinutes() + 1);
      
      var session2EndPlus1 = new Date(session2End);
      session2EndPlus1.setUTCMinutes(session2End.getUTCMinutes() + 1);
    }
    
    // Current time
    var currentTime = now.getTime();
    
    // Check which period we're in
    if (currentTime >= specialStart && currentTime <= session1End) {
      return "all_sessions";
    } else if (currentTime > session1End && currentTime <= session2End) {
      return "hajj_madeenah";
    } else if (currentTime > session2End && currentTime <= session3End) {
      return "madeenah";
    }
    
    return null;
  },
  
  // Check for Eid announcements
  checkEidAnnouncements: function(now, magribJamaahTime) {
    if (testMode.enabled) {
      now = testMode.getMockDate();
      
      // For test mode, use the specifically configured date
      const currentDay = testMode.dayOfWeek;
      
      // Special handling for test mode to respect day of week
      if (testMode.time === "13:45" && currentDay === 5) {
        // If it's Friday at 13:45 in test mode
        return "may30_tafseer"; // Show Friday's message
      } else if (testMode.time === "18:16" && currentDay === 5) {
        // If it's Friday at 18:16 in test mode
        return "may30_tafseer"; // Show Friday's message
      } else if (testMode.time === "18:16" && currentDay === 4) {
        // If it's Thursday at 18:16 in test mode
        return "may29_durood"; // Show Thursday's message
      } else if (testMode.time === "15:00" && currentDay === 3) {
        // If it's Wed at 15:00 in test mode
        return "may29_durood"; // Show Thursday's message
      }
    }
    
    // Helper function to create a Date for a specific time on a specific day
    function createDateWithTime(year, month, day, timeStr) {
      var date = new Date(Date.UTC(year, month, day));
      if (timeStr) {
        var parts = timeStr.split(':');
        if (parts.length === 2) {
          date.setUTCHours(parseInt(parts[0]), parseInt(parts[1]), 0, 0);
        }
      }
      return date;
    }
    
    // Get current time in minutes
    var currentTime = now.getTime();
    
    // Get magribJamaah time in minutes since midnight
    var magribJamaahMin = 0;
    if (typeof magribJamaahTime === 'string' && magribJamaahTime.indexOf(':') !== -1) {
      var parts = magribJamaahTime.split(':');
      magribJamaahMin = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    
    // Eid dates and times
    var may29_start = createDateWithTime(2025, 4, 29, "00:00");
    var may29_end = createDateWithTime(2025, 4, 29);
    may29_end.setUTCHours(Math.floor(magribJamaahMin/60), magribJamaahMin%60 + 15, 0, 0);
    
    var may29_evening_start = createDateWithTime(2025, 4, 29);
    may29_evening_start.setUTCHours(Math.floor(magribJamaahMin/60), magribJamaahMin%60 + 16, 0, 0);
    
    var may30_end = createDateWithTime(2025, 4, 30);
    may30_end.setUTCHours(Math.floor(magribJamaahMin/60), magribJamaahMin%60 + 15, 0, 0);
    
    var june4_start = createDateWithTime(2025, 5, 4, "00:00");
    var june4_end = createDateWithTime(2025, 5, 4);
    june4_end.setUTCHours(Math.floor(magribJamaahMin/60), magribJamaahMin%60 + 15, 0, 0);
    
    var june4_evening_start = createDateWithTime(2025, 5, 4);
    june4_evening_start.setUTCHours(Math.floor(magribJamaahMin/60), magribJamaahMin%60 + 16, 0, 0);
    
    var june5_end = createDateWithTime(2025, 5, 5);
    june5_end.setUTCHours(Math.floor(magribJamaahMin/60), magribJamaahMin%60 + 15, 0, 0);
    
    var june5_evening_start = createDateWithTime(2025, 5, 5);
    june5_evening_start.setUTCHours(Math.floor(magribJamaahMin/60), magribJamaahMin%60 + 16, 0, 0);
    
    var june6_morning = createDateWithTime(2025, 5, 6, "07:30");
    
    // Check which announcement period we're in
    if (currentTime >= may29_start.getTime() && currentTime <= may29_end.getTime()) {
      return "may29_durood";
    } else if (currentTime > may29_evening_start.getTime() && currentTime <= may30_end.getTime()) {
      return "may30_tafseer";
    } else if (currentTime >= june4_start.getTime() && currentTime <= june4_end.getTime()) {
      return "june4_arafah";
    } else if (currentTime > june4_evening_start.getTime() && currentTime <= june5_end.getTime()) {
      return "june4_durood";
    } else if (currentTime > june5_evening_start.getTime() && currentTime < june6_morning.getTime()) {
      return "june5_eid";
    }
    
    return null;
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
