import csv
from datetime import datetime

from flask import Flask, render_template
from hijri_converter import convert

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


def get_islamic_date():
    today = datetime.today().date()  # Get today's date
    hijri_date = convert.Gregorian(today.year, today.month, today.day).to_hijri()

    # Format Islamic date like "14 J-Ul-Awwal 1436"
    islamic_months = [
        "Muharram", "Safar", "Rabi-Ul-Awwal", "Rabi-Ul-Thani",
        "J-Ul-Awwal", "J-Ul-Thani", "Rajab", "Sha'ban",
        "Ramadan", "Shawwal", "Dhul-Qadah", "Dhul-Hijjah"
    ]

    formatted_hijri_date = f"{hijri_date.day} {islamic_months[hijri_date.month - 1]} {hijri_date.year}"
    return formatted_hijri_date


# Get the current time and date from the prayer times
@app.route('/')
def index():
    prayer_times = load_prayer_times()

    # Get the current time and date
    current_time = datetime.now().strftime('%H:%M:%S')
    current_date = datetime.now().strftime('%a, %b %d')
    islamic_date = get_islamic_date()  # Get Islamic date dynamically

    # Get today's prayer times
    today = datetime.now().day
    today_prayer_times = next((row for row in prayer_times if int(row[0]) == today), None)

    return render_template('index.html', current_time=current_time, current_date=current_date,
                           today_prayer_times=today_prayer_times, islamic_date=islamic_date)


if __name__ == '__main__':
    app.run(debug=True)
