"""
Unit tests for the PrayerTimeParser class (prayer_time_parser.py)
Tests all methods and functionality of the parser module.
"""

import pytest
from unittest.mock import patch, MagicMock
import sys
import os

# Add parent directory to Python path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from prayer_time_parser import PrayerTimeParser, convert_prayer_times


class TestPrayerTimeParser:
    """Test the PrayerTimeParser class"""
    
    @pytest.fixture
    def parser(self):
        """Create a PrayerTimeParser instance for testing"""
        return PrayerTimeParser()
    
    def test_init(self, parser):
        """Test parser initialization"""
        assert parser.month_mapping['JANUARY'] == 1
        assert parser.month_mapping['DECEMBER'] == 12
        assert len(parser.month_mapping) == 12
    
    def test_extract_month_success(self, parser):
        """Test successful month extraction from header line"""
        # Test various month formats
        test_cases = [
            ("AUGUST		ISLAMIC 	BEGINNING TIMES", 8),
            ("JANUARY 2024 Prayer Times", 1),
            ("DECEMBER Schedule", 12),
            ("march data", 3),  # Test case insensitive
            ("SEPTEMBER", 9)
        ]
        
        for input_line, expected_month in test_cases:
            result = parser._extract_month(input_line)
            assert result == expected_month
    
    def test_extract_month_not_found(self, parser):
        """Test month extraction when no month is found"""
        result = parser._extract_month("Random header line")
        assert result == 1  # Default to January
    
    def test_format_time_24_hour_format(self, parser):
        """Test time formatting for already 24-hour format times"""
        test_cases = [
            ("05:30", "05:30"),
            ("12:45", "12:45"),
            ("23:59", "23:59"),
            ("00:00", "00:00")
        ]
        
        for input_time, expected in test_cases:
            result = parser._format_time(input_time)
            assert result == expected
    
    def test_format_time_decimal_format_morning(self, parser):
        """Test time formatting for decimal format morning times"""
        test_cases = [
            ("5.15", "05:15"),
            ("6.30", "06:30"),
            ("11.45", "11:45"),
            ("0.30", "00:30")
        ]
        
        for input_time, expected in test_cases:
            result = parser._format_time(input_time, is_morning=True)
            assert result == expected
    
    def test_format_time_decimal_format_afternoon(self, parser):
        """Test time formatting for decimal format afternoon times"""
        test_cases = [
            ("2.00", "14:00"),  # 2 PM
            ("8.30", "20:30"),  # 8:30 PM
            ("11.15", "23:15"), # 11:15 PM
            ("1.45", "13:45")   # 1:45 PM
        ]
        
        for input_time, expected in test_cases:
            result = parser._format_time(input_time, is_afternoon=True)
            assert result == expected
    
    def test_format_time_morning_edge_cases(self, parser):
        """Test edge cases for morning time formatting"""
        # Test 12 AM (midnight)
        result = parser._format_time("12.00", is_morning=True)
        assert result == "00:00"
        
        # Test 12:xx AM
        result = parser._format_time("12.30", is_morning=True)
        assert result == "00:30"
    
    def test_format_time_invalid_formats(self, parser):
        """Test handling of invalid time formats"""
        test_cases = [
            ("", ""),
            ("\"", ""),
            ("invalid", "invalid"),
            ("25.00", "25:00"),  # Invalid hour but should still process
        ]
        
        for input_time, expected in test_cases:
            result = parser._format_time(input_time)
            assert result == expected
    
    def test_format_time_decimal_conversion_error(self, parser):
        """Test handling of decimal conversion errors"""
        # Test with invalid decimal format
        result = parser._format_time("5.invalid", is_morning=True)
        assert result == "5.invalid"
        
        result = parser._format_time("invalid.30", is_afternoon=True)
        assert result == "invalid.30"
    
    def test_parse_jamaat_time_with_quotes(self, parser):
        """Test parsing jamaah times with quote marks (repeat previous time)"""
        previous_jamaat = {
            'fajr': '05:15',
            'zohr': '14:00',
            'asar': '17:30',
            'magrib': '18:45',
            'isha': '20:30'
        }
        
        # Test quote mark behavior
        result = parser._parse_jamaat_time('"', previous_jamaat, 'fajr')
        assert result == '05:15'
        
        result = parser._parse_jamaat_time('"', previous_jamaat, 'zohr')
        assert result == '14:00'
        
        # Test with no previous jamaat
        result = parser._parse_jamaat_time('"', None, 'fajr')
        assert result == ""
    
    def test_parse_jamaat_time_new_time(self, parser):
        """Test parsing new jamaah times"""
        previous_jamaat = {'fajr': '05:15'}
        
        # Test new time
        result = parser._parse_jamaat_time('5.30', previous_jamaat, 'fajr', is_morning=True)
        assert result == '05:30'
        
        result = parser._parse_jamaat_time('2.15', previous_jamaat, 'zohr', is_afternoon=True)
        assert result == '14:15'
    
    def test_parse_row_success(self, parser):
        """Test successful parsing of a complete row"""
        # Sample row from Excel copy-paste
        row = "1	Fri	7 Safar	03:23	05:59	13:46	19:03	21:32	22:52		5.15	2.00	8.00	9.37	11.00"
        month = 8
        previous_jamaat = None
        
        result = parser._parse_row(row, month, previous_jamaat)
        
        expected = [
            8, 1,  # month, date
            '03:23', '05:59', '13:46', '19:03', '21:32', '22:52',  # beginning times
            '05:15', '14:00', '20:00', '21:37', '23:00'  # jamaat times
        ]
        assert result == expected
    
    def test_parse_row_with_quotes(self, parser):
        """Test parsing row with quote marks for repeated times"""
        row1 = "1	Fri	7 Safar	03:23	05:59	13:46	19:03	21:32	22:52		5.15	2.00	8.00	9.37	11.00"
        row2 = "2	Sat	8	03:23	06:01	13:46	19:02	21:30	22:50		\"	\"	\"	9.35	\""
        
        month = 8
        
        # Parse first row
        result1 = parser._parse_row(row1, month, None)
        previous_jamaat = {
            'fajr': result1[8],
            'zohr': result1[9],
            'asar': result1[10],
            'magrib': result1[11],
            'isha': result1[12]
        }
        
        # Parse second row with quotes
        result2 = parser._parse_row(row2, month, previous_jamaat)
        
        # Check that quoted times match previous times
        assert result2[8] == result1[8]  # fajr jamaat
        assert result2[9] == result1[9]  # zohr jamaat
        assert result2[10] == result1[10]  # asr jamaat
        assert result2[12] == result1[12]  # isha jamaat
        
        # Magrib should be different (9.35)
        assert result2[11] == '21:35'
    
    def test_parse_row_insufficient_columns(self, parser):
        """Test parsing row with insufficient columns"""
        short_row = "1	Fri	7 Safar	03:23"
        
        result = parser._parse_row(short_row, 8, None)
        assert result is None
    
    def test_parse_input_complete_workflow(self, parser):
        """Test complete parsing workflow with sample input"""
        sample_input = """AUGUST		ISLAMIC 	BEGINNING TIMES							JAMAAT TIMES				
DATE	DAY	HIJRI	FAJR	SUNRISE	ZOHR	ASAR	MAGRIB	ISHA		FAJR	ZOHR	ASAR	MAGRIB	ISHA
1	Fri	7 Safar	03:23	05:59	13:46	19:03	21:32	22:52		5.15	2.00	8.00	9.37	11.00
2	Sat	8	03:23	06:01	13:46	19:02	21:30	22:50		\"	\"	\"	9.35	\""""
        
        result = parser.parse_input(sample_input)
        
        # Check header
        assert "MONTH,DATE,FAJR BEGINNING" in result
        
        # Check first row
        lines = result.strip().split('\n')
        assert "8,1,03:23,05:59,13:46,19:03,21:32,22:52,05:15,14:00,20:00,21:37,23:00" in lines[1]
        
        # Check second row with quotes
        assert "8,2,03:23,06:01,13:46,19:02,21:30,22:50,05:15,14:00,20:00,21:35,23:00" in lines[2]
    
    def test_parse_input_no_data_rows(self, parser):
        """Test parsing input with no data rows"""
        sample_input = """AUGUST		ISLAMIC 	BEGINNING TIMES
DATE	DAY	HIJRI	FAJR	SUNRISE	ZOHR"""
        
        result = parser.parse_input(sample_input)
        
        # Should have header only
        lines = result.strip().split('\n')
        assert len(lines) == 1
        assert "MONTH,DATE,FAJR BEGINNING" in lines[0]
    
    def test_parse_input_different_months(self, parser):
        """Test parsing inputs for different months"""
        test_cases = [
            ("JANUARY Prayer Times", 1),
            ("FEBRUARY Schedule", 2),
            ("MARCH Times", 3),
            ("APRIL Data", 4),
            ("MAY Information", 5),
            ("JUNE Times", 6),
            ("JULY Schedule", 7),
            ("SEPTEMBER Data", 9),
            ("OCTOBER Times", 10),
            ("NOVEMBER Schedule", 11),
            ("DECEMBER Information", 12)
        ]
        
        for month_header, expected_month in test_cases:
            sample_input = f"""{month_header}
DATE	DAY	HIJRI	FAJR	SUNRISE	ZOHR	ASAR	MAGRIB	ISHA		FAJR	ZOHR	ASAR	MAGRIB	ISHA
1	Mon	1 Muharram	05:30	07:00	12:30	16:00	18:00	19:30		5.45	1.00	4.30	6.05	8.00"""
            
            result = parser.parse_input(sample_input)
            lines = result.strip().split('\n')
            
            # Check that correct month is used
            assert lines[1].startswith(str(expected_month))


class TestConvertPrayerTimes:
    """Test the convert_prayer_times function"""
    
    def test_convert_prayer_times(self):
        """Test the standalone convert_prayer_times function"""
        sample_input = """AUGUST		ISLAMIC 	BEGINNING TIMES
DATE	DAY	HIJRI	FAJR	SUNRISE	ZOHR	ASAR	MAGRIB	ISHA		FAJR	ZOHR	ASAR	MAGRIB	ISHA
1	Fri	7 Safar	03:23	05:59	13:46	19:03	21:32	22:52		5.15	2.00	8.00	9.37	11.00"""
        
        result = convert_prayer_times(sample_input)
        
        assert "MONTH,DATE,FAJR BEGINNING" in result
        assert "8,1,03:23,05:59,13:46,19:03,21:32,22:52,05:15,14:00,20:00,21:37,23:00" in result


class TestEdgeCases:
    """Test edge cases and error conditions"""
    
    @pytest.fixture
    def parser(self):
        return PrayerTimeParser()
    
    def test_parse_input_empty_string(self, parser):
        """Test parsing empty input string"""
        result = parser.parse_input("")
        
        # Should return header only
        lines = result.strip().split('\n')
        assert len(lines) == 1
        assert "MONTH,DATE,FAJR BEGINNING" in lines[0]
    
    def test_parse_input_whitespace_only(self, parser):
        """Test parsing input with only whitespace"""
        result = parser.parse_input("   \n\n\t  ")
        
        lines = result.strip().split('\n')
        assert len(lines) == 1
        assert "MONTH,DATE,FAJR BEGINNING" in lines[0]
    
    def test_format_time_boundary_values(self, parser):
        """Test time formatting with boundary values"""
        # Test maximum valid values
        result = parser._format_time("23.59", is_afternoon=True)
        assert result == "23:59"
        
        # Test minimum valid values
        result = parser._format_time("0.00", is_morning=True)
        assert result == "00:00"
        
        # Test 12-hour boundary
        result = parser._format_time("12.00", is_afternoon=True)
        assert result == "12:00"
    
    def test_parse_row_malformed_data(self, parser):
        """Test parsing row with malformed data"""
        # Test with mixed tabs and spaces
        malformed_row = "1\t\tFri  7 Safar\t03:23\t\t05:59    13:46\t19:03\t21:32\t22:52\t\t5.15\t2.00\t8.00\t9.37\t11.00"
        
        result = parser._parse_row(malformed_row, 8, None)
        
        # Should still parse correctly due to regex splitting
        assert result is not None
        assert result[0] == 8  # month
        assert result[1] == 1  # date


class TestIntegration:
    """Integration tests for the complete parsing workflow"""
    
    def test_full_month_parsing(self):
        """Test parsing a complete month of data"""
        full_month_input = """MARCH		ISLAMIC 	BEGINNING TIMES							JAMAAT TIMES				
DATE	DAY	HIJRI	FAJR	SUNRISE	ZOHR	ASAR	MAGRIB	ISHA		FAJR	ZOHR	ASAR	MAGRIB	ISHA
1	Fri	1 Ramadan	05:31	07:24	12:52	16:26	18:21	19:41		5.40	1.15	5.15	6.31	8.15
2	Sat	2	05:28	07:22	12:51	16:28	18:23	19:43		\"	\"	\"	6.33	\"
3	Sun	3	05:26	07:20	12:51	16:29	18:25	19:45		5.35	\"	\"	6.35	\"
4	Mon	4	05:24	07:17	12:51	16:31	18:27	19:47		\"	\"	\"	6.37	\"
5	Tue	5	05:22	07:15	12:51	16:32	18:28	19:48		\"	\"	5.30	6.38	\""""
        
        result = convert_prayer_times(full_month_input)
        lines = result.strip().split('\n')
        
        # Should have header + 5 data rows
        assert len(lines) == 6
        
        # Check header
        assert "MONTH,DATE,FAJR BEGINNING" in lines[0]
        
        # Check first row
        assert "3,1,05:31,07:24,12:52,16:26,18:21,19:41,05:40,13:15,17:15,18:31,20:15" in lines[1]
        
        # Check quote propagation in subsequent rows
        row2_parts = lines[2].split(',')
        row3_parts = lines[3].split(',')
        
        # Fajr jamaat should be the same in rows 1-2, different in row 3
        assert row2_parts[8] == "05:40"  # Same as row 1
        assert row3_parts[8] == "05:35"  # New value
        
        # Zohr jamaat should be the same in rows 1-3
        assert row2_parts[9] == "13:15"
        assert row3_parts[9] == "13:15"
    
    def test_real_world_copy_paste_format(self):
        """Test with real-world Excel copy-paste format"""
        excel_format = """DECEMBER		ISLAMIC 	BEGINNING TIMES							JAMAAT TIMES				
DATE	DAY	HIJRI	FAJR	SUNRISE	ZOHR	ASAR	MAGRIB	ISHA		FAJR	ZOHR	ASAR	MAGRIB	ISHA
25	Wed	12 J-Ul-Awwal	06:18	08:33	12:26	14:17	16:10	17:49		6.30	1.00	2.45	4.20	6.15
26	Thu	13	06:19	08:34	12:27	14:17	16:10	17:49		\"	\"	\"	4.20	\"
27	Fri	14	06:19	08:35	12:27	14:18	16:11	17:50		\"	\"	\"	4.21	\"
28	Sat	15	06:20	08:36	12:28	14:18	16:11	17:50		\"	\"	\"	4.21	\"
29	Sun	16	06:20	08:36	12:28	14:19	16:12	17:51		\"	\"	\"	4.22	\"
30	Mon	17	06:21	08:37	12:29	14:19	16:12	17:51		\"	\"	\"	4.22	\"
31	Tue	18	06:21	08:37	12:29	14:20	16:13	17:52		\"	\"	\"	4.23	\""""
        
        result = convert_prayer_times(excel_format)
        lines = result.strip().split('\n')
        
        # Should process all 7 days
        assert len(lines) == 8  # header + 7 data rows
        
        # Check December month (12)
        for i in range(1, 8):
            assert lines[i].startswith("12,")
        
        # Check specific conversions
        assert "12,25,06:18,08:33,12:26,14:17,16:10,17:49,06:30,13:00,14:45,16:20,18:15" in lines[1]
        
        # Check quote handling
        last_row_parts = lines[7].split(',')
        assert last_row_parts[8] == "06:30"  # Fajr jamaat (quoted, should match first)
        assert last_row_parts[11] == "16:23"  # Magrib jamaat (new value 4.23)
