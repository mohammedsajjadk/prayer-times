// Utility functions
const timeUtils = {
    timeToMinutes: (timeStr) => {
      const [hours, minutes] = timeStr.split(":").map(Number);
      return hours * 60 + minutes;
    },
  
    addMinutes: (timeStr, minutesToAdd) => {
      const [hours, minutes] = timeStr.split(":").map(Number);
      const totalMinutes = hours * 60 + minutes + minutesToAdd;
      const newHours = Math.floor(totalMinutes / 60) % 24;
      const newMinutes = totalMinutes % 60;
      return `${String(newHours).padStart(2, "0")}:${String(newMinutes).padStart(2, "0")}`;
    }
  };
  
  // DOM Selectors
  const selectors = {
    timeDisplay: ".time-display",
    prayerTimes: {
      fajrJamaah: ".jamaah .prayer-time-value:nth-child(2)",
      zohrJamaah: ".jamaah .prayer-time-value:nth-child(3)",
      asrJamaah: ".jamaah .prayer-time-value:nth-child(4)",
      magribJamaah: ".jamaah .prayer-time-value:nth-child(5)",
      ishaJamaah: ".jamaah .prayer-time-value:nth-child(6)",
      fajrBeginning: ".beginning .prayer-time-value:nth-child(2)",
      asrBeginning: ".beginning .prayer-time-value:nth-child(4)",
      magribBeginning: ".beginning .prayer-time-value:nth-child(5)",
      ishaBeginning: ".beginning .prayer-time-value:nth-child(6)"
    },
    importantTimes: {
      sunrise: ".time-box:nth-child(2) .time-value",
      zawal: ".time-box:nth-child(3) .time-value"
    },
    announcement: "#announcement-text"
  };
  
  // Time Display Functions
  function updateTime() {
    const now = new Date();
    let hours = now.getUTCHours();
    hours = hours % 12 || 12;
    const minutes = now.getUTCMinutes().toString().padStart(2, "0");
    const seconds = now.getUTCSeconds().toString().padStart(2, "0");
  
    document.querySelector(selectors.timeDisplay).innerHTML = `
      <span class="time-main">${hours}:${minutes}:${seconds}</span>`;
  }
  
  function convertTo12Hour() {
    document.querySelectorAll(".prayer-time-value.beginning, .prayer-time-value.jamaah")
      .forEach(el => {
        const time = el.getAttribute("data-time");
        if (time?.includes(":")) {
          const [hours, minutes] = time.split(":").map(Number);
          if (!isNaN(hours) && !isNaN(minutes)) {
            const hours12 = hours % 12 || 12;
            el.textContent = `${hours12}:${minutes.toString().padStart(2, "0")}`;
          }
        }
      });
  }
  
  // Prayer Times Functions
  function updateNextPrayer() {
    const now = new Date();
    const currentTime = now.getUTCHours() * 60 + now.getUTCMinutes();
    const isJumuah = now.getDay() === 5;
  
    // Clear existing highlights
    document.querySelectorAll(".next-prayer")
      .forEach(el => el.classList.remove("next-prayer"));
  
    // Get prayer times
    const times = {
      fajrBeginning: timeUtils.timeToMinutes(document.querySelector(selectors.prayerTimes.fajrBeginning).textContent),
      sunrise: timeUtils.timeToMinutes(document.querySelector(selectors.importantTimes.sunrise).textContent),
      asrBeginning: timeUtils.timeToMinutes(document.querySelector(selectors.prayerTimes.asrBeginning).textContent),
      magribBeginning: timeUtils.timeToMinutes(document.querySelector(selectors.prayerTimes.magribBeginning).textContent),
      ishaBeginning: timeUtils.timeToMinutes(document.querySelector(selectors.prayerTimes.ishaBeginning).textContent)
    };
  
    // Determine next prayer
    if (times.fajrBeginning <= currentTime && currentTime < times.sunrise) {
      highlightNextPrayer("fajr");
    } else if (times.sunrise <= currentTime && currentTime < times.asrBeginning) {
      highlightNextPrayer("zohr", isJumuah);
    } else if (times.asrBeginning <= currentTime && currentTime < times.magribBeginning - 10) {
      highlightNextPrayer("asr");
    } else if (times.magribBeginning - 10 <= currentTime && currentTime < times.ishaBeginning) {
      highlightNextPrayer("magrib");
    } else if (times.ishaBeginning <= currentTime || currentTime < times.fajrBeginning) {
      highlightNextPrayer("isha");
    }
  }
  
  function highlightNextPrayer(prayer, isJumuah = false) {
    const prayerIndex = { fajr: 2, zohr: 3, asr: 4, magrib: 5, isha: 6 };
    const element = document.querySelector(`.jamaah .prayer-time-value:nth-child(${prayerIndex[prayer]})`);
    
    if (prayer === "zohr" && isJumuah) {
      element.textContent = "13:20";
    }
    element.classList.add("next-prayer");
  }
  
  // Announcement Functions
  function updateAnnouncement() {
    const now = new Date();
    const currentTime = now.getUTCHours() * 60 + now.getUTCMinutes();
    
    const times = {
      sunrise: document.querySelector(selectors.importantTimes.sunrise).textContent,
      zawal: document.querySelector(selectors.importantTimes.zawal).textContent,
      zohrBeginning: document.querySelector(selectors.prayerTimes.fajrBeginning).textContent,
      magribBeginning: document.querySelector(selectors.prayerTimes.magribBeginning).textContent
    };
  
    const announcementElement = document.querySelector(selectors.announcement);
    let message = "SILENCE, PLEASE. WE ARE IN THE HOUSE OF ALLAH. KINDLY TURN OFF YOUR MOBILE.";
    let isWarning = false;
  
    const sunriseTime = timeUtils.timeToMinutes(times.sunrise);
    const zawalTime = timeUtils.timeToMinutes(times.zawal);
    const zohrTime = timeUtils.timeToMinutes(times.zohrBeginning);
    const magribTime = timeUtils.timeToMinutes(times.magribBeginning);
  
    if (currentTime >= sunriseTime && currentTime <= sunriseTime + 15) {
      const permitTime = timeUtils.addMinutes(times.sunrise, 15);
      message = `🌅 ATTENTION: PRAYER NOT PERMITTED until ${permitTime}. This time after sunrise (${times.sunrise}) is reserved for dhikr and du'a. 🌅`;
      isWarning = true;
    } else if (currentTime >= zawalTime && currentTime < zohrTime) {
      message = `☀️ ATTENTION: PRAYER NOT PERMITTED at Zawal time (${times.zawal}). Please wait for Zohr time to begin at ${times.zohrBeginning}. ☀️`;
      isWarning = true;
    } else if (currentTime >= magribTime - 10 && currentTime < magribTime) {
      message = `🌇 ATTENTION: PRAYER NOT PERMITTED during sunset. Please wait for Magrib Adhan at ${times.magribBeginning}. 🌇`;
      isWarning = true;
    }
  
    announcementElement.textContent = message;
    announcementElement.classList.toggle("announcement-warning", isWarning);
  }
  
  // Page Refresh Functions
  function forceMidnightRefresh() {
    const now = new Date();
    if (now.getUTCHours() === 0 && now.getUTCMinutes() === 0 && now.getUTCSeconds() === 0) {
      console.log("Starting midnight refresh process...");
      persistentRefresh();
    }
  }
  
  function persistentRefresh() {
    const retryInterval = 30000;
    const url = `${window.location.pathname}?t=${new Date().getTime()}`;
  
    function tryRefresh() {
      fetch(url)
        .then(response => {
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          console.log("Server accessible, refreshing page...");
          window.location.reload(true);
        })
        .catch(error => {
          console.log("Refresh failed:", error.message);
          console.log("Retrying in 30 seconds...");
          setTimeout(tryRefresh, retryInterval);
        });
    }
  
    tryRefresh();
  }
  
  // Initialize and set up intervals
  function initialize() {
    updateTime();
    updateNextPrayer();
    updateAnnouncement();
    convertTo12Hour();
  
    // Set up intervals
    setInterval(() => {
      updateTime();
      updateNextPrayer();
      updateAnnouncement();
      convertTo12Hour();
    }, 1000);
  
    setInterval(forceMidnightRefresh, 1000);
  }
  
  // Start the application
  document.addEventListener('DOMContentLoaded', initialize);