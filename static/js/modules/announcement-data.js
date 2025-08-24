/**
 * Prayer Times Application - Announcement Data Module
 * Contains static announcement texts and warning messages
 */

var AnnouncementData = {
  // Permanent announcements
  default: "SILENCE, PLEASE. WE ARE IN THE HOUSE OF ALLAH. KINDLY TURN OFF YOUR MOBILE.",

  // Regular recurring announcements
  thursdayDarood: function () {
    return "DUROOD/SALAT-ALA-NABI صلى الله عليه وسلم GATHERING • THURSDAY AFTER MAGRIB";
  },

  fridayTafseer: function () {
    return "TAFSEER OF THE QUR'AN • SURAH QAAF • FRIDAY AFTER MAGRIB";
  },

  clockGoForward: function () {
    return "REMEMBER CLOCKS GO FORWARD 1 HOUR THIS SUNDAY";
  },

  clockGoBackward: function () {
    return "REMEMBER CLOCKS GO BACKWARD 1 HOUR THIS SUNDAY";
  },

  // Warning messages - these take priority over other announcements
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

// Backwards compatibility - keep the original variable name
var announcements = AnnouncementData;
