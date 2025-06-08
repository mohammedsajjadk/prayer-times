// Function to show adhkar and hide prayer times and important times
function showAdhkar() {
  // Hide prayer-times element
  const prayerTimesElement = document.querySelector('.prayer-times');
  if (prayerTimesElement) {
    prayerTimesElement.style.display = 'none';
  }
  
  // Hide important-times element
  const importantTimesElement = document.querySelector('.important-times');
  if (importantTimesElement) {
    importantTimesElement.style.display = 'none';
  }
  
  // Show adhkar image
  const adhkarElement = document.querySelector('.adhkar-image');
  if (adhkarElement) {
    adhkarElement.style.display = 'block';
  }
}

// Function to hide adhkar and show prayer times and important times
function hideAdhkar() {
  // Show prayer-times element
  const prayerTimesElement = document.querySelector('.prayer-times');
  if (prayerTimesElement) {
    prayerTimesElement.style.display = 'block';
  }
  
  // Show important-times element
  const importantTimesElement = document.querySelector('.important-times');
  if (importantTimesElement) {
    importantTimesElement.style.display = 'block';
  }
  
  // Hide adhkar image
  const adhkarElement = document.querySelector('.adhkar-image');
  if (adhkarElement) {
    adhkarElement.style.display = 'none';
  }
}

// Function to toggle adhkar display
function toggleAdhkar() {
  const adhkarElement = document.querySelector('.adhkar-image');
  if (adhkarElement && adhkarElement.style.display === 'none') {
    showAdhkar();
  } else {
    hideAdhkar();
  }
}

// Initialize display states
document.addEventListener('DOMContentLoaded', function() {
  // Initial setup - hide adhkar image
  const adhkarElement = document.querySelector('.adhkar-image');
  if (adhkarElement) {
    adhkarElement.style.display = 'none';
  }
});
