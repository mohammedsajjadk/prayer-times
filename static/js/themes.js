/**
 * Prayer Times Application - Theme Module
 * Handles the theme selection and application functionality
 */

// Theme configurations
var themes = {
  theme1: {
    '--bg-color': '#0099ff',                // Original blue
    '--text-color': '#FFFFFF',              // White text
    '--highlight-color': '#000000',         // Black highlight
    '--border-color': '#76B5C5',            // Light blue border
    '--announcement-bg-color': '#000C17',   // Dark blue announcement
    '--announcement-text-color': '#FFFFFF', // White announcement text
    '--announcement-warning': '#ff0000',    // Red warnings
    '--next-prayer-border-color': 'rgba(0, 0, 0, 0.8)' // Transparent black
  },
  theme2: {
    '--bg-color': '#001529',                // Dark blue
    '--text-color': '#FFFFFF',              // White text
    '--highlight-color': '#00F0FF',         // Cyan highlight
    '--border-color': '#0088FF',            // Medium blue border
    '--announcement-bg-color': '#000C17',   // Darker blue
    '--announcement-text-color': '#FFFFFF', // White text
    '--announcement-warning': '#ff0000',    // Red warnings
    '--next-prayer-border-color': 'rgba(0, 240, 255, 0.8)' // Transparent cyan
  },
  theme3: {
    '--bg-color': '#0A192F',                // Navy blue
    '--text-color': '#FFFFFF',              // White text
    '--highlight-color': '#64FFDA',         // Teal highlight
    '--border-color': '#226e69',            // Darker teal border
    '--announcement-bg-color': '#000C17',   // Dark blue
    '--announcement-text-color': '#FFFFFF', // White text
    '--announcement-warning': '#ff0000',    // Red warnings
    '--next-prayer-border-color': 'rgba(100, 255, 218, 0.8)' // Transparent teal
  },
  theme4: {
    '--bg-color': '#FFFFFF',                // White background
    '--text-color': '#00F0FF',              // Cyan text
    '--highlight-color': '#FF0000',         // Red highlight
    '--border-color': '#00B4D8',            // Ocean blue borders
    '--announcement-bg-color': '#F8F9FA',   // Light gray for announcement
    '--announcement-text-color': '#00F0FF', // Cyan text
    '--announcement-warning': '#FF4444',    // Lighter red for warnings
    '--next-prayer-border-color': 'rgba(255, 0, 0, 0.8)' // Transparent red
  },
  theme5: {
    '--bg-color': '#FFFFFF',                // White background
    '--text-color': '#13686e',              // Teal text
    '--highlight-color': '#FF0000',         // Red highlight
    '--border-color': '#00B4D8',            // Ocean blue borders
    '--announcement-bg-color': '#F8F9FA',   // Light gray for announcement
    '--announcement-text-color': '#13686e', // Teal text
    '--announcement-warning': '#FF4444',    // Lighter red for warnings
    '--next-prayer-border-color': 'rgba(255, 0, 0, 0.8)' // Transparent red
  }
};

var themeModule = {
  // Initialize theme functionality
  init: function() {
    // Get all theme options
    var themeOptions = document.getElementsByClassName('theme-option');

    // Add click event to each theme option
    for (var i = 0; i < themeOptions.length; i++) {
      themeOptions[i].onclick = function () {
        var themeName = this.getAttribute('data-theme');
        var selectedTheme = themes[themeName];

        // Apply the theme
        themeModule.applyTheme(selectedTheme);

        // Save theme preference (optional)
        try {
          localStorage.setItem('selectedTheme', themeName);
        } catch (e) {
          // Local storage not supported or disabled
          console.log('Local storage not available');
        }
      };
    }

    // Load saved theme on initialization
    this.loadSavedTheme();
  },

  // Apply a theme to the document
  applyTheme: function(theme) {
    var root = document.documentElement;
    for (var property in theme) {
      if (theme.hasOwnProperty(property)) {
        root.style.setProperty(property, theme[property]);
      }
    }
  },

  // Load saved theme from localStorage if available
  loadSavedTheme: function() {
    try {
      var savedTheme = localStorage.getItem('selectedTheme');
      if (savedTheme && themes[savedTheme]) {
        this.applyTheme(themes[savedTheme]);
      }
    } catch (e) {
      // Local storage not supported or disabled
      console.log('Local storage not available');
    }
  }
};
