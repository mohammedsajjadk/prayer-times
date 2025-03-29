import csv
from datetime import datetime, timezone

from flask import Flask, render_template
from hijri_converter import convert
from datetime import datetime, timedelta

app = Flask(__name__)


# Load the prayer times from the CSV file
def load_prayer_times():
    prayer_times = []
    with open('data/prayer_times.csv', newline='') as csvfile:
        csvreader = csv.reader(csvfile)
        next(csvreader)  # Skip header
        for row in csvreader:
            prayer_times.append(row)
    return prayer_times


def get_islamic_date(date=None):
    if date is None:
        today = datetime.today().date()  # Get today's date
    else:
        today = date
        
    hijri_date = convert.Gregorian(today.year, today.month, today.day).to_hijri()

    # Format Islamic date like "14 J-Ul-Awwal 1436"
    islamic_months = [
        "Muharram", "Safar", "Rabi-Ul-Awwal", "Rabi-Ul-Thani",
        "J-Ul-Awwal", "J-Ul-Thani", "Rajab", "Sha'ban",
        "Ramadan", "Shawwal", "Dhul-Qadah", "Dhul-Hijjah"
    ]

    formatted_hijri_date = f"{hijri_date.day} {islamic_months[hijri_date.month - 1]} {hijri_date.year}"
    return formatted_hijri_date


def calculate_important_times(prayer_times):
    # Convert string times to datetime objects for calculations
    # Correct indices based on your current CSV structure:
    # [0]=MONTH, [1]=DATE, [2]=FAJR BEGINNING, [3]=SUNRISE BEGINNING, [4]=ZOHR BEGINNING, etc.
    sehri_time = datetime.strptime(prayer_times[2], '%H:%M')
    sunrise_time = prayer_times[3]
    zohr_time = datetime.strptime(prayer_times[4], '%H:%M')

    # Calculate Sehri ends (10 minutes before Fajr)
    sehri_ends = (sehri_time - timedelta(minutes=10)).strftime('%H:%M')
    # Calculate Noon (10 minutes before Zohr)
    noon_time = (zohr_time - timedelta(minutes=10)).strftime('%H:%M')

    return {
        'sehri_ends': sehri_ends,
        'sunrise': sunrise_time,
        'noon': noon_time
    }


# To determine if a given date is in Irish Summer Time
def is_ireland_dst(dt):
    # Ireland's DST rules: starts last Sunday in March, ends last Sunday in October
    year = dt.year
    # Last Sunday in March
    march_last_day = 31 - (datetime(year, 3, 31).weekday() + 1) % 7
    dst_start = datetime(year, 3, march_last_day, 1, 0, tzinfo=timezone.utc)
    
    # Last Sunday in October
    oct_last_day = 31 - (datetime(year, 10, 31).weekday() + 1) % 7
    dst_end = datetime(year, 10, oct_last_day, 1, 0, tzinfo=timezone.utc)
    
    return dst_start <= dt < dst_end

# Get the current time and date from the prayer times
@app.route('/')
def index():
    prayer_times = load_prayer_times()
    
    # Determine if Ireland is currently in DST (summer time)
    now = datetime.now(timezone.utc)
    is_summer_time = is_ireland_dst(now)
    
    # Apply the Irish time offset
    irish_time = now + timedelta(hours=(1 if is_summer_time else 0))
    
    # Use Irish time for day and month
    current_month = irish_time.month
    current_day = irish_time.day
    
    # Get today's prayer times using both month and day
    today_prayer_times = next((row for row in prayer_times if int(row[0]) == current_month and int(row[1]) == current_day), None)
    
    # Get tomorrow's date (also in Irish time)
    tomorrow = irish_time + timedelta(days=1)
    tomorrow_month = tomorrow.month
    tomorrow_day = tomorrow.day

    # Get tomorrow's prayer times using both month and day
    tomorrow_prayer_times = next((row for row in prayer_times if int(row[0]) == tomorrow_month and int(row[1]) == tomorrow_day), None)

    # Calculate important times
    important_times = calculate_important_times(today_prayer_times)
    tomorrow_important_times = calculate_important_times(tomorrow_prayer_times)

    return render_template('index.html',
                         current_time=irish_time.strftime('%H:%M:%S'),
                         current_date=irish_time.strftime('%a %d %b %Y'),
                         islamic_date=get_islamic_date(irish_time.date()),
                         today_prayer_times=today_prayer_times,
                         tomorrow_prayer_times=tomorrow_prayer_times,
                         important_times=important_times,
                         tomorrow_important_times=tomorrow_important_times)

if __name__ == '__main__':
    app.run(debug=True)
