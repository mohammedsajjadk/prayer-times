# Announcements Management

This directory contains the data files for dynamic announcements in the Prayer Times application.

## How to Update Announcements

To add, modify or remove announcements, edit the `announcements.json` file. Each announcement should follow this format:

```json
{
  "id": "unique_identifier", 
  "startDate": "YYYY-MM-DDThh:mm:ssZ",
  "endDate": "YYYY-MM-DDThh:mm:ssZ",
  "message": "Your announcement message here",
  "isSpecial": true/false
}
```

### Fields Explained:

- **id**: A unique identifier for the announcement. Used for tracking and management.
- **startDate**: When the announcement should start displaying (ISO 8601 format with UTC timezone)
- **endDate**: When the announcement should stop displaying (ISO 8601 format with UTC timezone)
- **message**: The text content of the announcement
- **isSpecial**: If true, the announcement will be displayed with special formatting

### Example:

```json
{
  "id": "ramadan_2026", 
  "startDate": "2026-02-20T00:00:00Z",
  "endDate": "2026-03-22T23:59:59Z",
  "message": "Ramadan begins Feb 22nd • Tarawih prayers after Isha • Visit our website for the full schedule",
  "isSpecial": true
}
```

## Notes:

1. The system automatically refreshes announcements every hour
2. Prayer time warnings always take precedence over any announcement
3. Dates/times are in UTC format - add 'Z' at the end to ensure proper timezone handling
4. For multi-day announcements, create separate entries for different messages on different days
5. Messages should be kept concise for better display on screens
