/**
 * Prayer Times Application - Prayer Module
 * Manages prayer time displays, highlights and updates
 */

var prayerModule = {
  // Check if current time matches a jamaah time and trigger effect
  checkForJamaahTimeMatch: function(hours, minutes, seconds) {
    // Only check when seconds is 0 to trigger exactly at the minute change
    if (seconds !== 0) return;

    var now = testMode.enabled ? testMode.getMockDate() : new Date();

    // For day-of-week, use test mode day if enabled, otherwise calculate Irish day
    var currentDay = testMode.enabled ? testMode.dayOfWeek : now.getUTCDay();

    // If not in test mode, handle Irish time day rollover
    if (!testMode.enabled) {
      var isIrishSummerTime = dateUtils.isIrelandDST(now);
      var irishOffset = isIrishSummerTime ? 1 : 0;
      var irishHours = now.getUTCHours() + irishOffset;

      if (irishHours < now.getUTCHours()) {
        currentDay = (currentDay + 1) % 7;
      }
    }

    var isFriday = testMode.enabled ? testMode.dayOfWeek === 5 : currentDay === 5;

    // Current time in HH:MM format (24-hour)
    var currentTime = timeUtils.padNumber(hours, 2) + ":" + timeUtils.padNumber(minutes, 2);

    // Get Zohr jamaah time
    var zohrJamaahTime = document.querySelector(selectors.prayerTimes.zohrJamaah).getAttribute('data-time');

    // Check all jamaah prayer times
    var jamaahTimes = [
      document.querySelector(selectors.prayerTimes.fajrJamaah).getAttribute('data-time'),
      document.querySelector(selectors.prayerTimes.asrJamaah).getAttribute('data-time'),
      document.querySelector(selectors.prayerTimes.magribJamaah).getAttribute('data-time'),
      document.querySelector(selectors.prayerTimes.ishaJamaah).getAttribute('data-time'),
    ];

    if (!isFriday) {
      jamaahTimes.push(zohrJamaahTime);
    }

    // If current time matches any prayer time, trigger the effect
    if (jamaahTimes.includes(currentTime)) {
      this.triggerPrayerTimeEffect();
    }
  },

  // Create visual effect when a prayer time is reached
  triggerPrayerTimeEffect: function() {
    // Add the effect class to time display
    var timeDisplay = document.querySelector('.time-display');
    if (timeDisplay) {
      timeDisplay.classList.add('prayer-time-simple');

      // Remove the effect after 2 seconds
      setTimeout(function () {
        timeDisplay.classList.remove('prayer-time-simple');
      }, 2000);
    }
  },

  // Highlight the next prayer time
  updateNextPrayer: function() {
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

    // For day-of-week, we need to account for day rollover when Irish time is ahead
    var currentDay = testMode.enabled ? testMode.dayOfWeek : now.getUTCDay();
    if (!testMode.enabled && irishHours < now.getUTCHours()) {
      currentDay = (currentDay + 1) % 7;
    }

    var isJumuah = currentDay === 5; // 0 is Sunday, 5 is Friday

    var currentDate = now.getUTCDate();
    var currentMonth = now.getUTCMonth() + 1; // JavaScript months are 0-based
    var currentYear = now.getUTCFullYear();

    // Check if today is the day before a clock change
    var isDayBeforeClockChange = dateUtils.isDateBeforeClockChange(currentDate, currentMonth, currentYear);

    // Clear existing highlights
    var highlighted = document.querySelectorAll(".next-prayer");
    for (var i = 0; i < highlighted.length; i++) {
      highlighted[i].classList.remove("next-prayer");
    }

    // Don't highlight next prayer on day before clock change
    if (isDayBeforeClockChange) {
      return;
    }

    // Get all required times
    var times = {
      fajrBeginning: timeUtils.timeToMinutes(document.querySelector(".beginning .prayer-time-value:nth-child(2)").getAttribute('data-time')),
      zohrBeginning: timeUtils.timeToMinutes(document.querySelector(".beginning .prayer-time-value:nth-child(3)").getAttribute('data-time')),
      asrBeginning: timeUtils.timeToMinutes(document.querySelector(".beginning .prayer-time-value:nth-child(4)").getAttribute('data-time')),
      magribBeginning: timeUtils.timeToMinutes(document.querySelector(".beginning .prayer-time-value:nth-child(5)").getAttribute('data-time')),
      ishaBeginning: timeUtils.timeToMinutes(document.querySelector(".beginning .prayer-time-value:nth-child(6)").getAttribute('data-time')),
      sunrise: timeUtils.timeToMinutes(document.querySelector(selectors.importantTimes.sunrise).getAttribute('data-time')),
      zawal: timeUtils.timeToMinutes(document.querySelector(selectors.importantTimes.zawal).getAttribute('data-time'))
    };

    // Check for prohibited times
    var isProhibitedTime = (
      (currentTime >= times.sunrise && currentTime < times.sunrise + 15) ||
      (currentTime >= times.zawal && currentTime < times.zawal + 10) ||
      (currentTime >= times.magribBeginning - 10 && currentTime < times.magribBeginning)
    );

    if (isProhibitedTime) {
      return;
    }

    var nextPrayer = null;

    if (currentTime >= 0 && currentTime < times.fajrBeginning) {
      nextPrayer = 'isha';
    } else if (currentTime >= times.fajrBeginning && currentTime < times.sunrise) {
      nextPrayer = 'fajr';
    } else if (isJumuah && currentTime >= times.zohrBeginning && currentTime < times.asrBeginning) {
      nextPrayer = 'jumuah';
    } else if (currentTime >= times.zohrBeginning && currentTime < times.asrBeginning) {
      nextPrayer = 'zohr';
    } else if (currentTime >= times.asrBeginning && currentTime < times.magribBeginning - 10) {
      nextPrayer = 'asr';
    } else if (currentTime >= times.magribBeginning && currentTime < times.ishaBeginning) {
      nextPrayer = 'magrib';
    } else if (currentTime >= times.ishaBeginning) {
      nextPrayer = 'isha';
    }

    if (nextPrayer) {
      this.highlightNextPrayer(nextPrayer, isJumuah);
    }
  },

  // Apply highlighting to the next prayer
  highlightNextPrayer: function(prayer, isJumuah) {
    var prayerIndex = {
      fajr: 2,
      zohr: 3,
      asr: 4,
      magrib: 5,
      isha: 6,
      jumuah: 7
    };
    var element = document.querySelector(".jamaah .prayer-time-value:nth-child(" + prayerIndex[prayer] + ")");
    if (element) {
      // Apply special highlight for Jumu'ah
      if (prayer === 'jumuah') {
        element.classList.add("jumuah-highlight");
      } else {
        element.classList.add("next-prayer");
      }
    }
  },
  
  // Update Jumuah times based on summer/winter time
  updateJumuahTimes: function() {
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

    var isFriday = currentDay === 5;

    // Determine if it's Summer Time or Winter Time
    var isIrishSummerTime = dateUtils.isIrelandDST(now);

    // Set Jumuah time based on whether it's Summer Time or Winter Time
    var jumuahTime;
    if (isIrishSummerTime) {
      // Summer Time
      jumuahTime = "13:45";
    } else {
      // Winter Time
      jumuahTime = "13:20";
    }

    // Get the Jumuah time element
    var jumuahElement = document.querySelector(".jamaah .prayer-time-value:nth-child(7)");

    // Get the Jumuah label element
    var jumuahLabelElement = document.querySelector(".prayer .prayer-time-value:nth-child(7) .english");

    // Get Zohr beginning time and Asr beginning time to determine when to highlight Jumuah
    var zohrBeginningEl = document.querySelector(".beginning .prayer-time-value:nth-child(3)");
    var asrBeginningEl = document.querySelector(".beginning .prayer-time-value:nth-child(4)");

    var zohrBeginningTime = 0;
    var asrBeginningTime = 15 * 60; // Default to 3 PM if format is invalid

    if (zohrBeginningEl && zohrBeginningEl.getAttribute('data-time')) {
      var zohrTimeStr = zohrBeginningEl.getAttribute('data-time');
      var zohrParts = zohrTimeStr.split(":");
      if (zohrParts.length === 2) {
        zohrBeginningTime = parseInt(zohrParts[0]) * 60 + parseInt(zohrParts[1]);
      }
    }

    if (asrBeginningEl && asrBeginningEl.getAttribute('data-time')) {
      var asrTimeStr = asrBeginningEl.getAttribute('data-time');
      var asrParts = asrTimeStr.split(":");
      if (asrParts.length === 2) {
        asrBeginningTime = parseInt(asrParts[0]) * 60 + parseInt(asrParts[1]);
      }
    }

    // Update to the correct Jumuah time
    jumuahElement.textContent = timeUtils.formatTimeFor12Hour(jumuahTime);
    jumuahElement.setAttribute("data-time", jumuahTime);

    // Make sure the label is correct
    if (jumuahLabelElement && jumuahLabelElement.textContent.includes("2nd")) {
      jumuahLabelElement.textContent = "JUMU'AH";
    }

    // Remove any existing highlight first
    jumuahElement.classList.remove("jumuah-highlight");
    jumuahElement.classList.remove("next-prayer");

    // Only highlight Jumuah on Friday between Zohr beginning and Asr beginning
    if (isFriday && currentTime >= zohrBeginningTime && currentTime < asrBeginningTime) {
      jumuahElement.classList.add("jumuah-highlight");
    }

    // If it's Friday after Asr begins, make sure Asr gets highlighted if it's before Maghrib
    if (isFriday && currentTime >= asrBeginningTime) {
      var asrJamaahEl = document.querySelector(".jamaah .prayer-time-value:nth-child(4)");
      var magribBeginningEl = document.querySelector(".beginning .prayer-time-value:nth-child(5)");

      if (asrJamaahEl && magribBeginningEl) {
        var magribTimeStr = magribBeginningEl.getAttribute('data-time');
        var magribParts = magribTimeStr.split(":");
        if (magribParts.length === 2) {
          var magribBeginningTime = parseInt(magribParts[0]) * 60 + parseInt(magribParts[1]);
          if (currentTime < magribBeginningTime - 10) {
            asrJamaahEl.classList.add("next-prayer");
          }
        }
      }
    }
  },
  
  // Update prayer times to next day when appropriate
  updateToNextDayTimesIfNeeded: function() {
    var now = testMode.enabled ? testMode.getMockDate() : new Date();

    // Get Irish time
    var isIrishSummerTime = dateUtils.isIrelandDST(now);
    var irishOffset = isIrishSummerTime ? 1 : 0;
    var irishHours = now.getUTCHours() + irishOffset;
    irishHours = irishHours >= 24 ? irishHours - 24 : irishHours;

    var currentTime = irishHours * 60 + now.getUTCMinutes();

    // For day-of-week, use test mode day if enabled, otherwise calculate Irish day
    var currentDay = testMode.enabled ? testMode.dayOfWeek : now.getUTCDay();
    if (!testMode.enabled && irishHours < now.getUTCHours()) {
      currentDay = (currentDay + 1) % 7;
    }

    var isFriday = currentDay === 5;

    // Update sunrise if it's past sunrise + 120 mins
    var sunriseEl = document.querySelector(".time-box:nth-child(2) .time-value");
    if (sunriseEl) {
      var sunriseTime = sunriseEl.getAttribute("data-time");
      if (sunriseTime) {
        var sunriseMinutes = timeUtils.timeToMinutes(sunriseTime);
        var sunriseThreshold = sunriseMinutes + 120;

        if (currentTime >= sunriseThreshold) {
          var tomorrowSunrise = sunriseEl.getAttribute("data-tomorrow");
          if (tomorrowSunrise) {
            sunriseEl.setAttribute("data-time", tomorrowSunrise);
            sunriseEl.textContent = timeUtils.formatTimeFor12Hour(tomorrowSunrise);
          }
        }
      }
    }

    // Update zawal separately - only when 120 minutes past zawal time
    var zawalEl = document.querySelector(".time-box:nth-child(3) .time-value");
    if (zawalEl) {
      var zawalTime = zawalEl.getAttribute("data-time");
      if (zawalTime) {
        var zawalMinutes = timeUtils.timeToMinutes(zawalTime);
        var zawalThreshold = zawalMinutes + 120;

        if (currentTime >= zawalThreshold) {
          var tomorrowZawal = zawalEl.getAttribute("data-tomorrow");
          if (tomorrowZawal) {
            zawalEl.setAttribute("data-time", tomorrowZawal);
            zawalEl.textContent = timeUtils.formatTimeFor12Hour(tomorrowZawal);
          }
        }
      }
    }

    // Define prayer types to update (excluding Jumu'ah)
    var prayers = ['fajr', 'zohr', 'asr', 'magrib', 'isha'];

    // For each prayer time
    prayers.forEach(function (prayer) {
      // Get indices based on prayer name
      var index = prayer === 'fajr' ? 2 :
        prayer === 'zohr' ? 3 :
          prayer === 'asr' ? 4 :
            prayer === 'magrib' ? 5 :
              prayer === 'isha' ? 6 : null;

      if (index) {
        // Get current beginning and jamaah elements
        var beginningEl = document.querySelector(".beginning .prayer-time-value:nth-child(" + index + ")");
        var jamaahEl = document.querySelector(".jamaah .prayer-time-value:nth-child(" + index + ")");

        // Skip Jumu'ah processing on Fridays for Zohr
        if (isFriday && prayer === 'zohr') {
          return;
        }

        // Get current jamaah time
        var jamaahTime = jamaahEl.getAttribute('data-time');

        // Safety check for elements and attributes
        if (!beginningEl || !jamaahEl || !jamaahTime) {
          return;
        }

        // Calculate current jamaah minutes + 5 minutes
        var jamaahMinutes = timeUtils.timeToMinutes(jamaahTime);
        var thresholdTime = jamaahMinutes + 5;

        // If current time is past jamaah + 5 minutes, update to tomorrow's times
        if (currentTime >= thresholdTime) {
          // Get next day's times from data attributes we'll store
          var tomorrowBeginning = beginningEl.getAttribute("data-tomorrow");
          var tomorrowJamaah = jamaahEl.getAttribute("data-tomorrow");

          // Only update if we have tomorrow's data
          if (tomorrowBeginning && tomorrowJamaah) {
            // Update actual elements with tomorrow's times
            beginningEl.setAttribute('data-time', tomorrowBeginning);
            jamaahEl.setAttribute('data-time', tomorrowJamaah);

            beginningEl.textContent = timeUtils.formatTimeFor12Hour(tomorrowBeginning);
            jamaahEl.textContent = timeUtils.formatTimeFor12Hour(tomorrowJamaah);

            // Update Sehri time when Fajr time is updated
            if (prayer === 'fajr') {
              var sehriEl = document.querySelector(".time-box:nth-child(1) .time-value");
              if (sehriEl) {
                var tomorrowSehri = sehriEl.getAttribute("data-tomorrow");
                if (tomorrowSehri) {
                  sehriEl.setAttribute("data-time", tomorrowSehri);
                  sehriEl.textContent = timeUtils.formatTimeFor12Hour(tomorrowSehri);
                }
              }
            }
          }
        }
      }
    });
  }
};
