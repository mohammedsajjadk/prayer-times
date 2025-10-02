# Adhkar Cycling and Image Interleaving - Complete Guide

## New Features Implemented

### 1. **Page Repetition (Cycling)**
Display Adhkar pages multiple times during the duration

### 2. **Smart Time Distribution**
Automatically divides total time across all repetitions

### 3. **Image Interleaving**
Show announcement posters between Adhkar cycles

### 4. **Cycle Information**
Countdown shows current page and cycle number

---

## Configuration Options

### New Fields in `announcements.json`:

```json
{
  "id": "post_jamaah_adhkar",
  "display": {
    "totalDurationMinutes": 5,
    "pageCount": 2,
    "pageDistribution": [30, 70],
    "repeatCycles": 2,                    // NEW: How many times to repeat
    "showImagesBetweenCycles": true,      // NEW: Show images between cycles
    "showCountdown": true,
    "takesOverImages": true,
    "takesOverAnnouncements": true
  }
}
```

### Configuration Fields:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `repeatCycles` | number | 1 | How many times to cycle through all pages |
| `showImagesBetweenCycles` | boolean | true | Show announcement image between cycles |

---

## How It Works

### Example 1: Basic Cycling (No Images)

**Configuration:**
```json
{
  "totalDurationMinutes": 5,
  "pageCount": 2,
  "pageDistribution": [30, 70],
  "repeatCycles": 2,
  "showImagesBetweenCycles": false
}
```

**What Happens:**
- Total duration: **5 minutes** (300 seconds)
- Total slots: 2 pages × 2 cycles = **4 slots**
- Time per slot: 300 ÷ 4 = **75 seconds** (1:15)

**Timeline:**
```
0:00 - 1:15  │ Page 1 (Cycle 1) │ 30% of verses
1:15 - 2:30  │ Page 2 (Cycle 1) │ 70% of verses
2:30 - 3:45  │ Page 1 (Cycle 2) │ 30% of verses
3:45 - 5:00  │ Page 2 (Cycle 2) │ 70% of verses ← Ends here
```

---

### Example 2: Cycling with Image Interleaving

**Configuration:**
```json
{
  "totalDurationMinutes": 5,
  "pageCount": 2,
  "pageDistribution": [30, 70],
  "repeatCycles": 2,
  "showImagesBetweenCycles": true
}
```

**What Happens:**
- Total duration: **5 minutes** (300 seconds)
- Adhkar slots: 2 pages × 2 cycles = 4
- Image slots: 2 cycles - 1 = **1 image**
- Total slots: 4 + 1 = **5 slots**
- Time per slot: 300 ÷ 5 = **60 seconds** (1:00)

**Timeline:**
```
0:00 - 1:00  │ Page 1 (Cycle 1) │ 30% of verses
1:00 - 2:00  │ Page 2 (Cycle 1) │ 70% of verses
2:00 - 3:00  │ 🖼️ IMAGE BREAK   │ Random announcement poster
3:00 - 4:00  │ Page 1 (Cycle 2) │ 30% of verses
4:00 - 5:00  │ Page 2 (Cycle 2) │ 70% of verses ← Ends here
```

---

### Example 3: Long Duration with Multiple Cycles

**Configuration:**
```json
{
  "totalDurationMinutes": 10,
  "pageCount": 2,
  "pageDistribution": [30, 70],
  "repeatCycles": 3,
  "showImagesBetweenCycles": true
}
```

**What Happens:**
- Total duration: **10 minutes** (600 seconds)
- Adhkar slots: 2 pages × 3 cycles = 6
- Image slots: 3 cycles - 1 = **2 images**
- Total slots: 6 + 2 = **8 slots**
- Time per slot: 600 ÷ 8 = **75 seconds** (1:15)

**Timeline:**
```
0:00 - 1:15  │ Page 1 (Cycle 1)
1:15 - 2:30  │ Page 2 (Cycle 1)
2:30 - 3:45  │ 🖼️ IMAGE 1
3:45 - 5:00  │ Page 1 (Cycle 2)
5:00 - 6:15  │ Page 2 (Cycle 2)
6:15 - 7:30  │ 🖼️ IMAGE 2
7:30 - 8:45  │ Page 1 (Cycle 3)
8:45 - 10:00 │ Page 2 (Cycle 3) ← Always ends on last page
```

---

## Smart Features

### 1. **Always Ends on Last Page**
The system ensures that the Adhkar display always ends with the last page of the last cycle, not on an image.

### 2. **Random Image Selection**
When showing images between cycles, a random image is selected from active announcements each time.

### 3. **Graceful Degradation**
If no announcement images are available when an image slot arrives, it smoothly continues to the next Adhkar page without delay.

### 4. **Dynamic Time Calculation**
```javascript
totalSlots = (pageCount × repeatCycles) + (repeatCycles - 1)
timePerSlot = totalDuration / totalSlots
```

This ensures perfect timing regardless of configuration.

---

## Countdown Display

### With Single Cycle:
```
Page 1/2 • Next in: 01:15
```

### With Multiple Cycles:
```
Page 1/2 • Cycle 1/2 • Next in: 01:00
Page 2/2 • Cycle 1/2 • Next in: 01:00
Page 1/2 • Cycle 2/2 • Next in: 01:00
Page 2/2 • Cycle 2/2 • Next in: 01:00
```

---

## Image Interleaving Logic

### How Images Are Selected:

1. **Check for Active Announcements:**
   - System looks for currently active image announcements
   - Based on time window (startDate/endDate)

2. **Random Selection:**
   - If multiple images available, picks one randomly
   - Different image may show each time

3. **Fallback:**
   - If no images available, skips image slot
   - Continues immediately to next Adhkar page

### Image Display:

- **Duration:** Calculated time per slot (e.g., 60 seconds)
- **Transition:** Smooth fade in/fade out
- **Position:** Same location as regular announcement images
- **Interruption:** Images can be interrupted if needed

---

## Use Cases

### Use Case 1: Quick Reminder (5 min, 2 cycles)
```json
{
  "totalDurationMinutes": 5,
  "repeatCycles": 2,
  "showImagesBetweenCycles": true
}
```
**Best for:** Short duas after each salah with variety

### Use Case 2: Extended Session (10 min, 3 cycles)
```json
{
  "totalDurationMinutes": 10,
  "repeatCycles": 3,
  "showImagesBetweenCycles": true
}
```
**Best for:** Jummah or special occasions with announcements

### Use Case 3: Focused Reading (5 min, 1 cycle)
```json
{
  "totalDurationMinutes": 5,
  "repeatCycles": 1,
  "showImagesBetweenCycles": false
}
```
**Best for:** Single pass through all duas without distraction

### Use Case 4: Continuous Display (15 min, 4 cycles)
```json
{
  "totalDurationMinutes": 15,
  "repeatCycles": 4,
  "showImagesBetweenCycles": true
}
```
**Best for:** Long post-prayer gatherings with regular reminders

---

## Technical Details

### State Tracking:

```javascript
displayState = {
  adhkarCurrentPage: 0,      // Current page index (0-based)
  adhkarCurrentCycle: 0,     // Current cycle number (0-based)
  adhkarTotalPages: 2,       // Total pages configured
  adhkarTotalCycles: 2,      // Total cycles configured
  adhkarActive: true,        // Adhkar is displaying
  adhkarPageTimeout: 12345,  // Timeout ID for next transition
}
```

### Flow Logic:

```
1. Load Adhkar text from file
2. Initialize: currentPage = 0, currentCycle = 0
3. Split text into verses by <br>
4. Distribute verses to pages by percentage
5. LOOP:
   a. Display current page with countdown
   b. Wait for timePerSlot
   c. Increment currentPage
   d. If currentPage >= totalPages:
      - Reset currentPage = 0
      - Increment currentCycle
      - If currentCycle < totalCycles AND showImages:
        → Show interleave image
        → Return to step 5
   e. If currentCycle >= totalCycles:
      → Cleanup and restore normal display
   f. Else: Go to step 5
```

---

## Example Configurations

### Configuration A: Simple Repeat
```json
{
  "id": "post_jamaah_adhkar",
  "display": {
    "totalDurationMinutes": 4,
    "pageCount": 2,
    "pageDistribution": [40, 60],
    "repeatCycles": 2,
    "showImagesBetweenCycles": false
  }
}
```
**Result:** Page1(2min) → Page2(2min) → Page1(2min) → Page2(2min) [4 min total]

### Configuration B: With Images
```json
{
  "id": "post_jamaah_adhkar",
  "display": {
    "totalDurationMinutes": 6,
    "pageCount": 3,
    "pageDistribution": [20, 30, 50],
    "repeatCycles": 2,
    "showImagesBetweenCycles": true
  }
}
```
**Result:** 
- 7 total slots (3 pages × 2 cycles + 1 image)
- Each slot ≈ 51 seconds
- Sequence: P1 → P2 → P3 → IMAGE → P1 → P2 → P3

---

## Troubleshooting

### Q: Images not showing between cycles?
**A:** Check that:
1. `showImagesBetweenCycles: true` is set
2. There are active announcement images configured
3. Current time is within image announcement time windows

### Q: Timing feels uneven?
**A:** This is normal! The system divides time equally across ALL slots (pages + images). Some variance is expected due to rounding.

### Q: Want longer first page?
**A:** Adjust `pageDistribution` percentages, not cycle timing. Example: `[60, 40]` gives more content to page 1.

### Q: Don't want images at all?
**A:** Set `"showImagesBetweenCycles": false` in configuration.

---

## Summary

✅ **Flexible repetition** - Configure any number of cycles
✅ **Smart timing** - Automatic time division
✅ **Image integration** - Show announcements between cycles
✅ **Informative display** - Countdown shows page and cycle
✅ **Verse integrity** - Never splits a verse across pages
✅ **Always ends properly** - Last display is always final page

This system provides maximum flexibility for displaying Adhkar with engagement through repetition and variety through image interleaving!
