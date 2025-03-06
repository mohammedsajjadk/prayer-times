function updateTime() {
  // Force UTC time by using explicit UTC methods
  const now = new Date();

  // Get UTC hours and ensure 24-hour format
  let hours = now.getUTCHours();
  const ampm = hours >= 12 ? "PM" : "AM";

  // Convert to 12-hour format
  hours = hours % 12 || 12;

  // Get UTC minutes and seconds
  const minutes = now.getUTCMinutes().toString().padStart(2, "0");
  const seconds = now.getUTCSeconds().toString().padStart(2, "0");

  // Update the display with UTC time - no padding for hours
  document.querySelector(".time-display").innerHTML = `
    <span class="time-main">${hours}:${minutes}:${seconds}</span>
`;
}

// Update time every second
setInterval(updateTime, 1000);

// Initial update
updateTime();

function forceMidnightRefresh() {
  let now = new Date();
  let hours = now.getUTCHours();
  let minutes = now.getUTCMinutes();
  let seconds = now.getUTCSeconds();

  // Check if it's midnight
  if (hours === 0 && minutes === 0 && seconds === 0) {
    console.log("Starting midnight refresh process...");
    persistentRefresh();
  }
}

function persistentRefresh() {
  const retryInterval = 30000; // 30 seconds between retries
  const url = window.location.pathname + "?t=" + new Date().getTime();

  function tryRefresh() {
    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log("Server accessible, refreshing page...");
        window.location.reload(true);
      })
      .catch((error) => {
        console.log("Refresh failed:", error.message);
        console.log("Retrying in 30 seconds...");
        setTimeout(tryRefresh, retryInterval);
      });
  }

  tryRefresh();
}

// Only check for midnight refresh
setInterval(forceMidnightRefresh, 1000);

// Add this function after the existing updateTime function
function updateNextPrayer() {
  const now = new Date();
  const currentHour = now.getUTCHours();
  const currentMinute = now.getUTCMinutes();
  const currentTime = currentHour * 60 + currentMinute; // Convert to minutes

  // Get all prayer times from the page
  const fajrJamaah = document.querySelector(
    ".jamaah .prayer-time-value:nth-child(2)"
  ).textContent;
  const zohrJamaah = document.querySelector(
    ".jamaah .prayer-time-value:nth-child(3)"
  ).textContent;
  const asrJamaah = document.querySelector(
    ".jamaah .prayer-time-value:nth-child(4)"
  ).textContent;
  const magribJamaah = document.querySelector(
    ".jamaah .prayer-time-value:nth-child(5)"
  ).textContent;
  const ishaJamaah = document.querySelector(
    ".jamaah .prayer-time-value:nth-child(6)"
  ).textContent;

  const sunrise = document.querySelector(
    ".time-box:nth-child(2) .time-value"
  ).textContent;
  const asrBeginning = document.querySelector(
    ".beginning .prayer-time-value:nth-child(4)"
  ).textContent;
  const magribBeginning = document.querySelector(
    ".beginning .prayer-time-value:nth-child(5)"
  ).textContent;
  const ishaBeginning = document.querySelector(
    ".beginning .prayer-time-value:nth-child(6)"
  ).textContent;
  const fajrBeginning = document.querySelector(
    ".beginning .prayer-time-value:nth-child(2)"
  ).textContent;

  // Remove existing highlights
  document
    .querySelectorAll(".next-prayer")
    .forEach((el) => el.classList.remove("next-prayer"));

  // Convert time strings to minutes for comparison
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const currentDay = new Date().getDay(); // 5 is Friday
  const isJumuah = currentDay === 5;

  if (
    timeToMinutes(fajrBeginning) <= currentTime &&
    currentTime < timeToMinutes(sunrise)
  ) {
    document
      .querySelector(".jamaah .prayer-time-value:nth-child(2)")
      .classList.add("next-prayer"); // Fajr
  } else if (
    timeToMinutes(sunrise) <= currentTime &&
    currentTime < timeToMinutes(asrBeginning)
  ) {
    const zohrElement = document.querySelector(
      ".jamaah .prayer-time-value:nth-child(3)"
    );
    if (isJumuah) {
      zohrElement.textContent = "13:20";
    }
    zohrElement.classList.add("next-prayer"); // Zohr
  } else if (
    timeToMinutes(asrBeginning) <= currentTime &&
    currentTime < timeToMinutes(magribBeginning) - 10
  ) {
    document
      .querySelector(".jamaah .prayer-time-value:nth-child(4)")
      .classList.add("next-prayer"); // Asr
  } else if (
    timeToMinutes(magribBeginning) - 10 <= currentTime &&
    currentTime < timeToMinutes(ishaBeginning)
  ) {
    document
      .querySelector(".jamaah .prayer-time-value:nth-child(5)")
      .classList.add("next-prayer"); // Magrib
  } else if (
    timeToMinutes(ishaBeginning) <= currentTime ||
    currentTime < timeToMinutes(fajrBeginning)
  ) {
    document
      .querySelector(".jamaah .prayer-time-value:nth-child(6)")
      .classList.add("next-prayer"); // Isha
  }
}

// Update the existing setInterval to include the new function
setInterval(() => {
  updateTime();
  updateNextPrayer();
}, 1000);

// Call both functions immediately
updateTime();
updateNextPrayer();

function updateAnnouncement() {
  const now = new Date();
  const currentHour = now.getUTCHours();
  const currentMinute = now.getUTCMinutes();
  const currentTime = currentHour * 60 + currentMinute;

  const sunrise = document.querySelector(
    ".time-box:nth-child(2) .time-value"
  ).textContent;
  const zawal = document.querySelector(
    ".time-box:nth-child(3) .time-value"
  ).textContent;
  const zohrBeginning = document.querySelector(
    ".beginning .prayer-time-value:nth-child(3)"
  ).textContent;
  const magribBeginning = document.querySelector(
    ".beginning .prayer-time-value:nth-child(5)"
  ).textContent;

  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  };

  // Function to add minutes to a time and format it
  const addMinutes = (timeStr, minutesToAdd) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes + minutesToAdd;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;
    return `${String(newHours).padStart(2, "0")}:${String(newMinutes).padStart(
      2,
      "0"
    )}`;
  };

  const sunriseTime = timeToMinutes(sunrise);
  const zawalTime = timeToMinutes(zawal);
  const zohrTime = timeToMinutes(zohrBeginning);
  const magribTime = timeToMinutes(magribBeginning);

  let announcementText =
    "SILENCE, PLEASE. WE ARE IN THE HOUSE OF ALLAH. KINDLY TURN OFF YOUR MOBILE.";

  // Check for prohibited prayer times with exact permitted times
  // In the updateAnnouncement function, modify the if-else block:
  if (currentTime >= sunriseTime && currentTime <= sunriseTime + 15) {
    const permitTime = addMinutes(sunrise, 15);
    announcementText = `🌅 ATTENTION: PRAYER NOT PERMITTED until ${permitTime}. This time after sunrise (${sunrise}) is reserved for dhikr and du'a. 🌅`;
    document
      .getElementById("announcement-text")
      .classList.add("announcement-warning");
  } else if (currentTime >= zawalTime && currentTime < zohrTime) {
    announcementText = `☀️ ATTENTION: PRAYER NOT PERMITTED at Zawal time (${zawal}). Please wait for Zohr time to begin at ${zohrBeginning}. ☀️`;
    document
      .getElementById("announcement-text")
      .classList.add("announcement-warning");
  } else if (currentTime >= magribTime - 10 && currentTime < magribTime) {
    announcementText = `🌇 ATTENTION: PRAYER NOT PERMITTED during sunset. Please wait for Magrib Adhan at ${magribBeginning}. 🌇`;
    document
      .getElementById("announcement-text")
      .classList.add("announcement-warning");
  } else {
    document
      .getElementById("announcement-text")
      .classList.remove("announcement-warning");
  }
  document.getElementById("announcement-text").textContent = announcementText;
}

function convertTo12Hour() {
  document
    .querySelectorAll(".prayer-time-value.beginning, .prayer-time-value.jamaah")
    .forEach((el) => {
      const time = el.getAttribute("data-time");
      if (time && time.includes(":")) {
        const [hours, minutes] = time.split(":").map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
          const hours12 = hours % 12 || 12;
          el.textContent = `${hours12}:${minutes.toString().padStart(2, "0")}`;
        }
      }
    });
}

// Call initially and after any updates
convertTo12Hour();

// Add to the existing setInterval
setInterval(() => {
  updateTime();
  updateNextPrayer();
  updateAnnouncement();
  convertTo12Hour();
}, 1000);
