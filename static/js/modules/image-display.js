/**
 * Prayer Times Application - Image Display Manager
 * Handles various image slideshow and announcement display functionalities
 */

var ImageDisplayManager = {
  // Handle image announcements with display conditions
  handleImageAnnouncement: function (imageData, currentTime, jamaahTimes) {
    // Don't process if Adhkar is active
    if (DisplayStateManager.isAdhkarActive()) {
      return;
    }

    var displayCondition = imageData.displayCondition;
    var frequency = displayCondition.frequency || 5; // Default: every 5 minutes
    var duration = displayCondition.duration || 10; // Default: 10 seconds
    var avoidJamaahTime = displayCondition.avoidJamaahTime !== false; // Default: true

    // Check if we're within 2 minutes of any jamaah time
    if (avoidJamaahTime && jamaahTimes) {
      for (var i = 0; i < jamaahTimes.length; i++) {
        var jamaahTime = jamaahTimes[i];
        // Check if jamaahTime is valid before comparing
        if (
          jamaahTime &&
          !isNaN(jamaahTime) &&
          Math.abs(currentTime - jamaahTime) <= 2
        ) {
          // We're within 2 minutes of jamaah time, don't show images
          return;
        }
      }
    }

    // Calculate which image cycle we're in and which image to show
    var gapDuration = 20; // 20-second gap between images
    var slotDuration = duration + gapDuration; // Each image slot includes the image time + gap
    var totalCycleDuration = imageData.images.length * slotDuration; // Total time for all images and gaps
    var currentMinute = Math.floor(currentTime % (24 * 60));
    var currentSecond = new Date().getSeconds();
    
    // Check if we're in a display window (every frequency minutes)
    if (currentMinute % frequency === 0) {
      // Only proceed if we're within the total cycle duration
      if (currentSecond < totalCycleDuration) {
        // Calculate which slot we're in (image + gap)
        var currentSlot = Math.floor(currentSecond / slotDuration);
        var secondsIntoSlot = currentSecond % slotDuration;

        // Only show image if we're in the image part of the slot (not the gap)
        // and we have a valid image for this slot
        if (
          secondsIntoSlot < duration &&
          currentSlot < imageData.images.length
        ) {
          // Show the specific image for the remaining time in its display period
          var remainingTime = duration - secondsIntoSlot;
          this.displaySingleImage(imageData.images[currentSlot], remainingTime);
        }
        // If secondsIntoSlot >= duration, we're in the gap period - show normal content
      }
    }
  },

  // Display a single image for a specified duration
  displaySingleImage: function (imagePath, duration) {
    // Check if there's already a slideshow running
    var existingSlideshow = document.querySelector(".image-slideshow-container");
    if (existingSlideshow) {
      // Already displaying images, don't start another slideshow
      return;
    }

    // Create ID for this slideshow session to avoid conflicts
    var slideshowId = "slideshow-" + new Date().getTime();

    // Get elements and their states
    var elements = this.getDisplayElements();
    var states = this.saveElementStates(elements);

    // Hide the elements
    this.hideElements(elements);

    // Create image container
    var imageContainer = this.createSlideshowContainer(slideshowId);

    // Insert the image container
    this.insertSlideshowContainer(imageContainer, elements.prayerTimes);

    // Create and configure the image element
    var imgElement = this.createSlideshowImage(imagePath);

    // Add the image to container
    imageContainer.appendChild(imgElement);

    // Fade in the image
    setTimeout(function () {
      imgElement.style.opacity = "1";
    }, 100);

    // Set up cleanup after the specified duration
    var self = this;
    setTimeout(function () {
      self.cleanupSlideshow(imageContainer, elements, states);
    }, duration * 1000);
  },

  // Display rotating images with proper timing
  displayRotatingImages: function (images, duration) {
    if (!images || images.length === 0) return;

    // Create ID for this slideshow session to avoid conflicts
    var slideshowId = "slideshow-" + new Date().getTime();

    // Check if there's already a slideshow running
    var existingSlideshow = document.querySelector(".image-slideshow-container");
    if (existingSlideshow) {
      // Already displaying images, don't start another slideshow
      return;
    }

    // Get elements and their states
    var elements = this.getDisplayElements();
    var states = this.saveElementStates(elements);

    // Hide the elements
    this.hideElements(elements);

    // Store the original states for later retrieval
    window[slideshowId] = {
      prayerTimesState: states.prayerTimes,
      prayerTimesElement: elements.prayerTimes,
      importantTimesState: states.importantTimes,
      importantTimesElement: elements.importantTimes,
    };

    // Create image container
    var imageContainer = this.createRotatingContainer(slideshowId);

    // Insert the image container
    this.insertSlideshowContainer(imageContainer, elements.prayerTimes);

    // Create the image element with simple fade transition
    var imgElement = this.createRotatingImage();

    // Add the image to container
    imageContainer.appendChild(imgElement);

    var currentIndex = 0;
    var startTime = new Date().getTime();

    // Function to show the next image with simple fade transition
    var showNextImage = function () {
      // Check if we've reached the end of the duration
      var currentTime = new Date().getTime();
      if (currentTime >= startTime + duration * 1000) {
        // Duration is over, clean up and restore original content
        ImageDisplayManager.cleanupRotatingSlideshow(slideshowId);
        return;
      }

      // Cycle through images
      if (currentIndex >= images.length) {
        currentIndex = 0; // Reset to start for continuous rotation
      }

      // Load the next image
      imgElement.style.opacity = "0";

      setTimeout(function () {
        // Set new image source
        imgElement.src = images[currentIndex];

        // When image loads, fade it in
        imgElement.onload = function () {
          imgElement.style.opacity = "1";
        };

        // Handle image load error
        imgElement.onerror = function () {
          console.error("Failed to load image:", images[currentIndex]);
          currentIndex++;
          setTimeout(showNextImage, 100); // Try next image quickly
        };

        // Increment index for next round
        currentIndex++;

        // Set timer for next image (show each image for a portion of the total duration)
        var imageDisplayTime = Math.max(
          2,
          (duration * 1000) / (images.length * 2)
        ); // At least 2 seconds per image
        setTimeout(showNextImage, imageDisplayTime);
      }, 500); // Brief fade-out transition
    };

    // Start the slideshow
    imgElement.onload = function () {
      imgElement.style.opacity = "1";
      currentIndex++;
      // Calculate time per image (show each image for a portion of the total duration)
      var imageDisplayTime = Math.max(
        2000,
        (duration * 1000) / (images.length * 2)
      ); // At least 2 seconds per image
      setTimeout(showNextImage, imageDisplayTime);
    };
    
    // Set the first image
    imgElement.src = images[0];

    // Safety timeout to ensure cleanup happens
    setTimeout(function () {
      ImageDisplayManager.cleanupRotatingSlideshow(slideshowId);
    }, duration * 1000 + 1000); // Add 1 second buffer
  },

  // Helper functions for managing elements and states
  getDisplayElements: function () {
    return {
      prayerTimes: document.querySelector(".prayer-times"),
      importantTimes: document.querySelector(".important-times"),
    };
  },

  saveElementStates: function (elements) {
    var states = {};
    
    if (elements.prayerTimes) {
      states.prayerTimes = {
        display: elements.prayerTimes.style.display,
        html: elements.prayerTimes.innerHTML,
        className: elements.prayerTimes.className,
      };
    }

    if (elements.importantTimes) {
      states.importantTimes = {
        display: elements.importantTimes.style.display,
        html: elements.importantTimes.innerHTML,
        className: elements.importantTimes.className,
      };
    }

    return states;
  },

  hideElements: function (elements) {
    if (elements.prayerTimes) {
      elements.prayerTimes.style.display = "none";
    }
    if (elements.importantTimes) {
      elements.importantTimes.style.display = "none";
    }
  },

  createSlideshowContainer: function (id) {
    var container = document.createElement("div");
    container.id = id;
    container.className = "image-slideshow-container";
    container.style.width = "100%";
    container.style.height = "132vh";
    container.style.display = "flex";
    container.style.justifyContent = "center";
    container.style.alignItems = "center";
    container.style.marginTop = "1.0vw";
    container.style.padding = "0";
    return container;
  },

  createRotatingContainer: function (id) {
    var container = document.createElement("div");
    container.id = id;
    container.className = "image-slideshow-container";
    container.style.width = "100%";
    container.style.textAlign = "center";
    container.style.marginTop = "2.0vw";
    container.style.padding = "0.5vw";
    return container;
  },

  createSlideshowImage: function (src) {
    var imgElement = document.createElement("img");
    imgElement.src = src;
    imgElement.style.maxWidth = "100%";
    imgElement.style.maxHeight = "100%";
    imgElement.style.height = "auto";
    imgElement.style.width = "auto";
    imgElement.style.objectFit = "contain";
    imgElement.style.transition = "opacity 0.5s ease-in-out";
    imgElement.style.opacity = "0";
    imgElement.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
    return imgElement;
  },

  createRotatingImage: function () {
    var imgElement = document.createElement("img");
    imgElement.style.maxWidth = "90%";
    imgElement.style.height = "auto";
    imgElement.style.transition = "opacity 0.5s ease-in-out";
    imgElement.style.opacity = "1";
    return imgElement;
  },

  insertSlideshowContainer: function (container, prayerTimesElement) {
    if (prayerTimesElement && prayerTimesElement.parentNode) {
      prayerTimesElement.parentNode.insertBefore(container, prayerTimesElement);
    } else {
      // Fallback: add after date-container's divider
      var dateContainer = document.querySelector(".date-container");
      var insertAfterElement = dateContainer
        ? dateContainer.nextElementSibling
        : document.body;
      if (insertAfterElement) {
        insertAfterElement.parentNode.insertBefore(
          container,
          insertAfterElement.nextSibling
        );
      } else {
        document.body.appendChild(container);
      }
    }
  },

  cleanupSlideshow: function (container, elements, states) {
    // Remove the slideshow container
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }

    // Restore the prayer-times element
    if (elements.prayerTimes && states.prayerTimes) {
      elements.prayerTimes.style.display = states.prayerTimes.display;
      elements.prayerTimes.innerHTML = states.prayerTimes.html;
      elements.prayerTimes.className = states.prayerTimes.className;
    }

    // Restore the important-times element
    if (elements.importantTimes && states.importantTimes) {
      elements.importantTimes.style.display = states.importantTimes.display;
      elements.importantTimes.innerHTML = states.importantTimes.html;
      elements.importantTimes.className = states.importantTimes.className;
    }
  },

  cleanupRotatingSlideshow: function (id) {
    // Remove the slideshow container
    var container = document.getElementById(id);
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }

    // Restore the prayer-times and important-times elements
    var savedState = window[id];
    if (savedState) {
      // Restore prayer-times
      if (savedState.prayerTimesElement && savedState.prayerTimesState) {
        var el = savedState.prayerTimesElement;
        var state = savedState.prayerTimesState;

        el.style.display = state.display || "";
        el.className = state.className || "";
      }

      // Restore important-times
      if (savedState.importantTimesElement && savedState.importantTimesState) {
        var el = savedState.importantTimesElement;
        var state = savedState.importantTimesState;

        el.style.display = state.display || "";
        el.className = state.className || "";
      }
    }

    // Clean up saved state
    delete window[id];
  },
};
