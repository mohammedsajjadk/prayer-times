/**
 * Prayer Times Application - Message Display Manager
 * Handles text message display and animation effects
 */

var MessageDisplayManager = {
  // State tracking for message display
  isScrolling: false,
  messageQueue: [],

  // Show next message in the queue with scrolling effect
  showNextMessage: function (message) {
    var self = this;
    var announcementElement = document.querySelector(selectors.announcement);
    if (!announcementElement) return;

    // Set the message
    announcementElement.textContent = message;

    // Add class for older browsers
    if (announcementElement.classList) {
      announcementElement.classList.add("scroll-announcement");
    } else {
      // Fallback for older browsers without classList
      announcementElement.className += " scroll-announcement";
    }
    this.isScrolling = true;

    // Wait for animation to complete
    setTimeout(function () {
      // Remove class for older browsers
      if (announcementElement.classList) {
        announcementElement.classList.remove("scroll-announcement");
      } else {
        // Fallback for older browsers
        announcementElement.className = announcementElement.className.replace(
          /\bscroll-announcement\b/,
          ""
        );
      }
      self.isScrolling = false;

      // Small delay before next message
      setTimeout(function () {
        if (self.messageQueue && self.messageQueue.length > 0) {
          self.showNextMessage(self.messageQueue.shift());
        }
      }, 3000);
    }, 25000);
  },

  // Add message to queue
  queueMessage: function (message) {
    if (!this.isScrolling) {
      this.showNextMessage(message);
    } else {
      this.messageQueue.push(message);
    }
  },

  // Clear message queue
  clearQueue: function () {
    this.messageQueue = [];
  },

  // Update announcement text with proper styling
  updateAnnouncementText: function (message, isWarning, isSpecial) {
    var announcementElement = document.querySelector(selectors.announcement);
    if (!announcementElement) return;

    // Update the text content
    announcementElement.textContent = message;

    // Remove all classes first
    announcementElement.classList.remove(
      "announcement-text-normal",
      "announcement-text-long",
      "announcement-text-very-long",
      "announcement-warning",
      "special-announcement"
    );
    
    var announcementContainer = document.querySelector(".announcement");
    if (announcementContainer) {
      announcementContainer.classList.remove("warning-active", "special-active");
    }

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
      if (announcementContainer) {
        announcementContainer.classList.add("warning-active");
      }
    } else if (isSpecial) {
      announcementElement.classList.add("special-announcement");
      if (announcementContainer) {
        announcementContainer.classList.add("special-active");
      }
    }
  },

  // Check if currently displaying a message
  isDisplaying: function () {
    return this.isScrolling;
  },

  // Reset message display state
  reset: function () {
    this.isScrolling = false;
    this.messageQueue = [];
  },
};
