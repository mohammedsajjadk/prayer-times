from flask import Flask, render_template
import csv
from datetime import datetime

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

# Get the current time and date from the prayer times
@app.route('/')
def index():
    prayer_times = load_prayer_times()

    # Get the current time and date
    current_time = datetime.now().strftime('%H:%M:%S')
    current_date = datetime.now().strftime('%a, %b %d')

    # Get today's prayer times
    today = datetime.now().day
    today_prayer_times = next((row for row in prayer_times if int(row[0]) == today), None)

    return render_template('index.html', current_time=current_time, current_date=current_date, today_prayer_times=today_prayer_times)

if __name__ == '__main__':
    app.run(debug=True)
