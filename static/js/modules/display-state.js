/**
 * Prayer Times Application - Display State Manager
 * Manages the state of various displays and announcements
 */

var DisplayStateManager = {
  // Internal state tracking
  state: {
    adhkarActive: false,
    pausedAnnouncement: null,
    resumeTimeout: null,
  },

  // Check if adhkar is currently active
  isAdhkarActive: function () {
    return this.state.adhkarActive;
  },

  // Set adhkar active state
  setAdhkarActive: function (active) {
    this.state.adhkarActive = active;
  },

  // Pause ongoing announcements to show Adhkar
  pauseOngoingAnnouncements: function () {
    // Set the adhkar active flag
    this.state.adhkarActive = true;

    // Find and store any existing slideshow
    var existingSlideshow = document.querySelector(".image-slideshow-container");
    if (existingSlideshow) {
      // Save the current state of the slideshow
      this.state.pausedAnnouncement = {
        element: existingSlideshow,
        parent: existingSlideshow.parentNode,
      };

      // Remove it temporarily
      if (existingSlideshow.parentNode) {
        existingSlideshow.parentNode.removeChild(existingSlideshow);
      }
    }

    // Clear any existing resume timeout
    if (this.state.resumeTimeout) {
      clearTimeout(this.state.resumeTimeout);
    }
  },

  // Resume paused announcements after Adhkar display
  resumeAnnouncements: function () {
    // Reset the adhkar active flag
    this.state.adhkarActive = false;

    // If there was a paused announcement, restore it
    if (this.state.pausedAnnouncement) {
      var paused = this.state.pausedAnnouncement;

      if (paused.element && paused.parent) {
        paused.parent.appendChild(paused.element);
      }

      // Clear the paused state
      this.state.pausedAnnouncement = null;
    }
  },

  // Set a resume timeout
  setResumeTimeout: function (callback, delay) {
    // Clear any existing timeout
    if (this.state.resumeTimeout) {
      clearTimeout(this.state.resumeTimeout);
    }

    // Set new timeout
    this.state.resumeTimeout = setTimeout(callback, delay);
  },

  // Clear the resume timeout
  clearResumeTimeout: function () {
    if (this.state.resumeTimeout) {
      clearTimeout(this.state.resumeTimeout);
      this.state.resumeTimeout = null;
    }
  },

  // Reset all state
  reset: function () {
    this.state = {
      adhkarActive: false,
      pausedAnnouncement: null,
      resumeTimeout: null,
    };
  },
};

// Backwards compatibility - keep the original variable name
var displayState = DisplayStateManager.state;
