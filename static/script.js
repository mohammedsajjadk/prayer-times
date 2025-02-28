// JavaScript to update time dynamically every second
function updateTime() {
    const timeElement = document.getElementById('time');
    const currentTime = new Date().toLocaleTimeString();
    timeElement.textContent = currentTime;
}

// Call updateTime every second to keep the time updated
setInterval(updateTime, 1000);
