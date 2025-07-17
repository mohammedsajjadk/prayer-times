import csv
from datetime import datetime, timedelta
from typing import List, Dict, Tuple

class PrayerTimeValidator:
    def __init__(self, csv_file_path: str):
        self.csv_file_path = csv_file_path
        self.data = self._load_csv_data()
    
    def _load_csv_data(self) -> List[Dict]:
        data = []
        with open(self.csv_file_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                data.append(row)
        return data
    
    def validate_month(self, month: int) -> Dict:
        """Validate prayer times for a specific month"""
        month_data = [row for row in self.data if int(row['MONTH']) == month]
        
        if not month_data:
            return {"error": f"No data found for month {month}"}
        
        validation_results = {
            "month": month,
            "total_rows": len(month_data),
            "date_validation": self._validate_dates(month_data),
            "fajr_beginning_validation": self._validate_time_pattern(month_data, 'FAJR BEGINNING', month, 'fajr'),
            "sunrise_beginning_validation": self._validate_time_pattern(month_data, 'SUNRISE BEGINNING', month, 'sunrise'),
            "zohr_beginning_validation": self._validate_time_pattern(month_data, 'ZOHR BEGINNING', month, 'zohr'),
            "asar_beginning_validation": self._validate_time_pattern(month_data, 'ASAR BEGINNING', month, 'asar'),
            "magrib_beginning_validation": self._validate_time_pattern(month_data, 'MAGRIB BEGINNING', month, 'magrib'),
            "isha_beginning_validation": self._validate_time_pattern(month_data, 'ISHA BEGINNING', month, 'isha'),
            "zohr_jamaah_validation": self._validate_zohr_jamaah(month_data, month),
            "magrib_jamaah_validation": self._validate_magrib_jamaah(month_data)
        }
        
        return validation_results
    
    def _validate_dates(self, month_data: List[Dict]) -> Dict:
        """Validate that dates are consecutive from 1 to the end of month"""
        dates = [int(row['DATE']) for row in month_data]
        expected_dates = list(range(1, len(month_data) + 1))
        
        missing_dates = set(expected_dates) - set(dates)
        extra_dates = set(dates) - set(expected_dates)
        
        return {
            "is_valid": dates == expected_dates,
            "expected_range": f"1-{len(month_data)}",
            "actual_dates": sorted(dates),
            "missing_dates": sorted(list(missing_dates)),
            "extra_dates": sorted(list(extra_dates))
        }
    
    def _validate_time_pattern(self, month_data: List[Dict], time_column: str, month: int, prayer_type: str) -> Dict:
        """Validate time increment/decrement pattern based on prayer type and month"""
        times = []
        for row in month_data:
            time_str = row[time_column]
            times.append(self._time_to_minutes(time_str))
        
        expected_pattern = self._get_expected_pattern(month, prayer_type)
        violations = []
        
        for i in range(1, len(times)):
            prev_time = times[i-1]
            curr_time = times[i]
            diff = curr_time - prev_time
            
            if expected_pattern == "increment":
                if diff < 0 or diff > 5:
                    violations.append({
                        "date": i + 1,
                        "previous_time": self._minutes_to_time(prev_time),
                        "current_time": self._minutes_to_time(curr_time),
                        "difference_minutes": diff,
                        "expected": "increment (0-5 minutes)",
                        "actual": f"{'increment' if diff > 0 else 'decrement'} ({abs(diff)} minutes)"
                    })
            elif expected_pattern == "decrement":
                if diff > 0 or diff < -5:
                    violations.append({
                        "date": i + 1,
                        "previous_time": self._minutes_to_time(prev_time),
                        "current_time": self._minutes_to_time(curr_time),
                        "difference_minutes": diff,
                        "expected": "decrement (0-5 minutes)",
                        "actual": f"{'increment' if diff > 0 else 'decrement'} ({abs(diff)} minutes)"
                    })
        
        return {
            "is_valid": len(violations) == 0,
            "expected_pattern": expected_pattern,
            "violations": violations,
            "total_violations": len(violations)
        }
    
    def _get_expected_pattern(self, month: int, prayer_type: str) -> str:
        """Determine expected increment/decrement pattern based on month and prayer type"""
        if prayer_type in ['fajr', 'sunrise']:
            # July-December: increment, January-June: decrement
            return "increment" if month >= 7 else "decrement"
        elif prayer_type in ['zohr', 'asar']:
            # August-November: decrement, rest: increment
            return "decrement" if 8 <= month <= 11 else "increment"
        elif prayer_type in ['magrib', 'isha']:
            # July-November: decrement, rest: increment
            return "decrement" if 7 <= month <= 11 else "increment"
        
        return "increment"  # default
    
    def _time_to_minutes(self, time_str: str) -> int:
        """Convert time string (HH:MM) to minutes since midnight"""
        try:
            hours, minutes = map(int, time_str.split(':'))
            return hours * 60 + minutes
        except:
            return 0
    
    def _minutes_to_time(self, minutes: int) -> str:
        """Convert minutes since midnight to time string (HH:MM)"""
        hours = minutes // 60
        mins = minutes % 60
        return f"{hours:02d}:{mins:02d}"
    
    def _validate_zohr_jamaah(self, month_data: List[Dict], month: int) -> Dict:
        """Validate Zohr Jamaah times based on Irish clock changes"""
        violations = []
        
        # Irish clock changes:
        # Forward: Last Sunday in March (around March 25-31)
        # Backward: Last Sunday in October (around October 25-31)
        
        for row in month_data:
            date = int(row['DATE'])
            zohr_jamaah = row['ZOHR JAMAAH']
            zohr_jamaah_minutes = self._time_to_minutes(zohr_jamaah)
            
            # Determine expected time based on month and Irish clock rules
            if self._is_after_clock_forward(month, date):
                expected_time = "14:00"
                expected_minutes = 14 * 60  # 840 minutes
            else:
                expected_time = "13:15"
                expected_minutes = 13 * 60 + 15  # 795 minutes
            
            if zohr_jamaah_minutes != expected_minutes:
                violations.append({
                    "date": date,
                    "expected_time": expected_time,
                    "actual_time": zohr_jamaah,
                    "reason": "After Irish clock forward" if expected_time == "14:00" else "Before Irish clock forward"
                })
        
        return {
            "is_valid": len(violations) == 0,
            "violations": violations,
            "total_violations": len(violations)
        }
    
    def _validate_magrib_jamaah(self, month_data: List[Dict]) -> Dict:
        """Validate Magrib Jamaah times (should be Beginning + 5 minutes)"""
        violations = []
        
        for row in month_data:
            date = int(row['DATE'])
            magrib_beginning = row['MAGRIB BEGINNING']
            magrib_jamaah = row['MAGRIB JAMAAH']
            
            beginning_minutes = self._time_to_minutes(magrib_beginning)
            jamaah_minutes = self._time_to_minutes(magrib_jamaah)
            expected_jamaah_minutes = beginning_minutes + 5
            
            if jamaah_minutes != expected_jamaah_minutes:
                violations.append({
                    "date": date,
                    "magrib_beginning": magrib_beginning,
                    "expected_jamaah": self._minutes_to_time(expected_jamaah_minutes),
                    "actual_jamaah": magrib_jamaah,
                    "difference_minutes": jamaah_minutes - expected_jamaah_minutes
                })
        
        return {
            "is_valid": len(violations) == 0,
            "violations": violations,
            "total_violations": len(violations)
        }
    
    def _is_after_clock_forward(self, month: int, date: int) -> bool:
        """Determine if date is after Irish clock forward (last Sunday in March) and before backward (last Sunday in October)"""
        # Simplified logic: 
        # After March = April to October
        # Before March = November to March
        if month >= 4 and month <= 10:
            return True
        elif month <= 3 or month >= 11:
            return False
        else:
            # For March and October, we'd need more complex logic to find last Sunday
            # For now, assume March 25+ is after forward, October 25+ is after backward
            if month == 3:
                return date >= 25
            elif month == 10:
                return date < 25
        return False
    
    def print_validation_report(self, validation_results: Dict):
        """Print a formatted validation report"""
        month = validation_results["month"]
        month_names = ["", "January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"]
        
        print(f"\n=== VALIDATION REPORT FOR {month_names[month].upper()} ({month}) ===")
        print(f"Total rows found: {validation_results['total_rows']}")
        
        # Date validation
        date_val = validation_results["date_validation"]
        print(f"\n📅 DATE VALIDATION: {'✅ PASS' if date_val['is_valid'] else '❌ FAIL'}")
        if not date_val['is_valid']:
            if date_val['missing_dates']:
                print(f"   Missing dates: {date_val['missing_dates']}")
            if date_val['extra_dates']:
                print(f"   Extra dates: {date_val['extra_dates']}")
        
        # Time validations
        time_fields = [
            ("FAJR BEGINNING", "fajr_beginning_validation"),
            ("SUNRISE BEGINNING", "sunrise_beginning_validation"),
            ("ZOHR BEGINNING", "zohr_beginning_validation"),
            ("ASAR BEGINNING", "asar_beginning_validation"),
            ("MAGRIB BEGINNING", "magrib_beginning_validation"),
            ("ISHA BEGINNING", "isha_beginning_validation")
        ]
        
        for field_name, field_key in time_fields:
            field_val = validation_results[field_key]
            print(f"\n⏰ {field_name}: {'✅ PASS' if field_val['is_valid'] else '❌ FAIL'}")
            print(f"   Expected pattern: {field_val['expected_pattern']}")
            print(f"   Violations: {field_val['total_violations']}")
            
            if field_val['violations']:
                print("   Details:")
                for violation in field_val['violations'][:5]:  # Show first 5 violations
                    print(f"     Date {violation['date']}: {violation['previous_time']} → {violation['current_time']} "
                          f"({violation['difference_minutes']:+d} min, expected: {violation['expected']})")
                
                if len(field_val['violations']) > 5:
                    print(f"     ... and {len(field_val['violations']) - 5} more violations")
        
        # Jamaah validations
        jamaah_fields = [
            ("ZOHR JAMAAH", "zohr_jamaah_validation"),
            ("MAGRIB JAMAAH", "magrib_jamaah_validation")
        ]
        
        for field_name, field_key in jamaah_fields:
            if field_key in validation_results:
                field_val = validation_results[field_key]
                print(f"\n🕌 {field_name}: {'✅ PASS' if field_val['is_valid'] else '❌ FAIL'}")
                print(f"   Violations: {field_val['total_violations']}")
                
                if field_val['violations']:
                    print("   Details:")
                    for violation in field_val['violations'][:5]:
                        if field_key == "zohr_jamaah_validation":
                            print(f"     Date {violation['date']}: Expected {violation['expected_time']}, "
                                  f"Got {violation['actual_time']} ({violation['reason']})")
                        elif field_key == "magrib_jamaah_validation":
                            print(f"     Date {violation['date']}: Beginning {violation['magrib_beginning']} + 5min = "
                                  f"{violation['expected_jamaah']}, Got {violation['actual_jamaah']} "
                                  f"({violation['difference_minutes']:+d} min difference)")
                    
                    if len(field_val['violations']) > 5:
                        print(f"     ... and {len(field_val['violations']) - 5} more violations")

def main():
    csv_file = input("Enter path to prayer_times.csv (or press Enter for default): ").strip()
    if not csv_file:
        csv_file = "c:\\Sajjad\\prayer_times_project_2\\data\\prayer_times.csv"
    
    try:
        validator = PrayerTimeValidator(csv_file)
        
        month = int(input("Enter month number (1-12): "))
        if month < 1 or month > 12:
            print("Invalid month number. Please enter 1-12.")
            return
        
        results = validator.validate_month(month)
        
        if "error" in results:
            print(f"Error: {results['error']}")
            return
        
        validator.print_validation_report(results)
        
    except FileNotFoundError:
        print(f"Error: CSV file not found at {csv_file}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
