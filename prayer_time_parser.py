import re
from typing import List, Dict, Optional

class PrayerTimeParser:
    def __init__(self):
        self.month_mapping = {
            'JANUARY': 1, 'FEBRUARY': 2, 'MARCH': 3, 'APRIL': 4,
            'MAY': 5, 'JUNE': 6, 'JULY': 7, 'AUGUST': 8,
            'SEPTEMBER': 9, 'OCTOBER': 10, 'NOVEMBER': 11, 'DECEMBER': 12
        }
        
    def parse_input(self, input_text: str) -> str:
        lines = input_text.strip().split('\n')
        
        # Extract month from first line
        month_line = lines[0]
        month = self._extract_month(month_line)
        
        # Find data rows (skip header rows)
        data_rows = []
        for line in lines[2:]:  # Skip first two lines (month and header)
            if line.strip() and not line.startswith('DATE'):
                data_rows.append(line)
        
        # Parse each row
        csv_rows = []
        previous_jamaat = None
        
        for row in data_rows:
            parsed_row = self._parse_row(row, month, previous_jamaat)
            if parsed_row:
                csv_rows.append(parsed_row)
                # Update previous jamaat times for next iteration
                previous_jamaat = {
                    'fajr': parsed_row[8],
                    'zohr': parsed_row[9],
                    'asar': parsed_row[10],
                    'magrib': parsed_row[11],
                    'isha': parsed_row[12]
                }
        
        # Create CSV output
        header = "MONTH,DATE,FAJR BEGINNING,SUNRISE BEGINNING,ZOHR BEGINNING,ASAR BEGINNING,MAGRIB BEGINNING,ISHA BEGINNING,FAJR JAMAAH,ZOHR JAMAAH,ASAR JAMAAH,MAGRIB JAMAAH,ISHA JAMAAH"
        csv_output = header + "\n"
        
        for row in csv_rows:
            csv_output += ",".join(map(str, row)) + "\n"
        
        return csv_output
    
    def _extract_month(self, month_line: str) -> int:
        for month_name, month_num in self.month_mapping.items():
            if month_name in month_line.upper():
                return month_num
        return 1  # Default to January if not found
    
    def _parse_row(self, row: str, month: int, previous_jamaat: Optional[Dict]) -> Optional[List]:
        # Split by tabs or multiple spaces
        parts = re.split(r'\t+|\s{2,}', row.strip())
        
        if len(parts) < 13:
            return None
        
        date = int(parts[0])
        
        # Beginning times (columns 3-8)
        fajr_begin = self._format_time(parts[3], is_morning=True)
        sunrise_begin = self._format_time(parts[4], is_morning=True)
        zohr_begin = self._format_time(parts[5], is_afternoon=True)
        asar_begin = self._format_time(parts[6], is_afternoon=True)
        magrib_begin = self._format_time(parts[7], is_afternoon=True)
        isha_begin = self._format_time(parts[8], is_afternoon=True)
        
        # Jamaat times (columns 9-13)
        fajr_jamaat = self._parse_jamaat_time(parts[9], previous_jamaat, 'fajr', is_morning=True)
        zohr_jamaat = self._parse_jamaat_time(parts[10], previous_jamaat, 'zohr', is_afternoon=True)
        asar_jamaat = self._parse_jamaat_time(parts[11], previous_jamaat, 'asar', is_afternoon=True)
        magrib_jamaat = self._parse_jamaat_time(parts[12], previous_jamaat, 'magrib', is_afternoon=True)
        isha_jamaat = self._parse_jamaat_time(parts[13] if len(parts) > 13 else "", previous_jamaat, 'isha', is_afternoon=True)
        
        return [
            month, date, fajr_begin, sunrise_begin, zohr_begin, asar_begin, 
            magrib_begin, isha_begin, fajr_jamaat, zohr_jamaat, asar_jamaat, 
            magrib_jamaat, isha_jamaat
        ]
    
    def _parse_jamaat_time(self, time_str: str, previous_jamaat: Optional[Dict], prayer_name: str, is_morning: bool = False, is_afternoon: bool = False) -> str:
        if time_str.strip() == '"' and previous_jamaat:
            return previous_jamaat[prayer_name]
        
        return self._format_time(time_str, is_morning=is_morning, is_afternoon=is_afternoon)
    
    def _format_time(self, time_str: str, is_morning: bool = False, is_afternoon: bool = False) -> str:
        if not time_str or time_str.strip() == '"':
            return ""
        
        time_str = time_str.strip()
        
        # If already in 24-hour format (contains :)
        if ':' in time_str:
            return time_str
        
        # Handle decimal format (e.g., 5.15, 2.00)
        if '.' in time_str:
            try:
                hours, minutes = time_str.split('.')
                hours = int(hours)
                minutes = int(minutes)
                
                # Convert to 24-hour format
                if is_afternoon and hours < 12:
                    hours += 12
                elif is_morning and hours == 12:
                    hours = 0
                
                return f"{hours:02d}:{minutes:02d}"
            except ValueError:
                return time_str
        
        return time_str

# Usage function
def convert_prayer_times(input_text: str) -> str:
    parser = PrayerTimeParser()
    return parser.parse_input(input_text)

# Example usage
if __name__ == "__main__":
    # You can paste your input here and run the script
    sample_input = """Your prayer time data here"""
    
    print("Paste your prayer time data and press Enter twice:")
    lines = []
    while True:
        try:
            line = input()
            if line == "" and len(lines) > 0:
                break
            lines.append(line)
        except EOFError:
            break
    
    if lines:
        input_text = "\n".join(lines)
        result = convert_prayer_times(input_text)
        print("\nCSV Output:")
        print(result)
