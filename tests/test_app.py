"""
Unit tests for the Flask web application (app.py)
Tests all functions and routes in the main application module.
"""

import pytest
from datetime import datetime, date, timezone, timedelta
from unittest.mock import patch, mock_open, MagicMock
import sys
import os

# Add parent directory to Python path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import (
    app,
    load_prayer_times,
    get_islamic_date,
    calculate_important_times,
    is_ireland_dst,
    index
)


class TestLoadPrayerTimes:
    """Test the load_prayer_times function"""
    
    def test_load_prayer_times_success(self):
        """Test successful loading of prayer times from CSV"""
        mock_csv_data = "MONTH,DATE,FAJR BEGINNING,SUNRISE BEGINNING,ZOHR BEGINNING,ASAR BEGINNING,MAGRIB BEGINNING,ISHA BEGINNING,FAJR JAMAAH,ZOHR JAMAAH,ASAR JAMAAH,MAGRIB JAMAAH,ISHA JAMAAH\n3,1,05:31,07:24,12:52,16:26,18:21,19:41,05:40,13:15,17:15,18:31,20:15\n3,2,05:28,07:22,12:51,16:28,18:23,19:43,05:40,13:15,17:15,18:33,20:15"
        
        with patch("builtins.open", mock_open(read_data=mock_csv_data)):
            result = load_prayer_times()
            
        assert len(result) == 2
        assert result[0] == ['3', '1', '05:31', '07:24', '12:52', '16:26', '18:21', '19:41', '05:40', '13:15', '17:15', '18:31', '20:15']
        assert result[1] == ['3', '2', '05:28', '07:22', '12:51', '16:28', '18:23', '19:43', '05:40', '13:15', '17:15', '18:33', '20:15']
    
    def test_load_prayer_times_file_not_found(self):
        """Test handling of missing CSV file"""
        with patch("builtins.open", side_effect=FileNotFoundError):
            with pytest.raises(FileNotFoundError):
                load_prayer_times()
    
    def test_load_prayer_times_empty_file(self):
        """Test handling of empty CSV file"""
        with patch("builtins.open", mock_open(read_data="HEADER\n")):
            result = load_prayer_times()
            assert result == []


class TestGetIslamicDate:
    """Test the get_islamic_date function"""
    
    def test_get_islamic_date_with_date(self):
        """Test conversion of specific Gregorian date to Islamic date"""
        test_date = date(2024, 3, 15)
        
        with patch('hijri_converter.convert.Gregorian') as mock_gregorian:
            # Mock the hijri conversion
            mock_hijri = MagicMock()
            mock_hijri.day = 5
            mock_hijri.month = 9  # Ramadan (index 8 + 1)
            mock_hijri.year = 1445
            mock_gregorian.return_value.to_hijri.return_value = mock_hijri
            
            result = get_islamic_date(test_date)
            
            assert result == "5 Ramadan 1445"
            mock_gregorian.assert_called_once_with(2024, 3, 15)
    
    def test_get_islamic_date_today(self):
        """Test conversion of today's date to Islamic date"""
        with patch('hijri_converter.convert.Gregorian') as mock_gregorian:
            mock_hijri = MagicMock()
            mock_hijri.day = 14
            mock_hijri.month = 5  # J-Ul-Awwal (index 4 + 1)
            mock_hijri.year = 1446
            mock_gregorian.return_value.to_hijri.return_value = mock_hijri
            
            with patch('datetime.datetime') as mock_datetime:
                mock_datetime.today.return_value.date.return_value = date(2024, 10, 15)
                
                result = get_islamic_date()
                
                assert result == "14 J-Ul-Awwal 1446"
    
    def test_get_islamic_date_all_months(self):
        """Test Islamic month names are correct"""
        expected_months = [
            "Muharram", "Safar", "Rabi-Ul-Awwal", "Rabi-Ul-Thani",
            "J-Ul-Awwal", "J-Ul-Thani", "Rajab", "Sha'ban",
            "Ramadan", "Shawwal", "Dhul-Qadah", "Dhul-Hijjah"
        ]
        
        test_date = date(2024, 1, 1)
        
        for i, month_name in enumerate(expected_months, 1):
            with patch('hijri_converter.convert.Gregorian') as mock_gregorian:
                mock_hijri = MagicMock()
                mock_hijri.day = 1
                mock_hijri.month = i
                mock_hijri.year = 1445
                mock_gregorian.return_value.to_hijri.return_value = mock_hijri
                
                result = get_islamic_date(test_date)
                assert month_name in result


class TestCalculateImportantTimes:
    """Test the calculate_important_times function"""
    
    def test_calculate_important_times_success(self):
        """Test successful calculation of important times"""
        # Sample prayer times: [MONTH, DATE, FAJR, SUNRISE, ZOHR, ASAR, MAGRIB, ISHA, ...]
        prayer_times = ['3', '15', '05:30', '07:25', '12:50', '16:30', '18:25', '19:45']
        
        result = calculate_important_times(prayer_times)
        
        assert 'sehri_ends' in result
        assert 'sunrise' in result
        assert 'noon' in result
        assert result['sehri_ends'] == '05:20'  # 05:30 - 10 minutes
        assert result['sunrise'] == '07:25'
        assert result['noon'] == '12:40'  # 12:50 - 10 minutes
    
    def test_calculate_important_times_edge_cases(self):
        """Test edge cases like midnight and noon transitions"""
        # Test with times that cross midnight
        prayer_times = ['1', '1', '00:10', '06:00', '12:10', '15:00', '17:00', '18:30']
        
        result = calculate_important_times(prayer_times)
        
        assert result['sehri_ends'] == '00:00'  # 00:10 - 10 minutes
        assert result['noon'] == '12:00'  # 12:10 - 10 minutes
    
    def test_calculate_important_times_invalid_format(self):
        """Test handling of invalid time formats"""
        prayer_times = ['3', '15', 'invalid', '07:25', 'bad_time', '16:30', '18:25', '19:45']
        
        with pytest.raises(ValueError):
            calculate_important_times(prayer_times)


class TestIsIrelandDst:
    """Test the is_ireland_dst function"""
    
    def test_is_ireland_dst_summer_time(self):
        """Test DST detection during summer months"""
        # Test date in July (definitely summer time)
        summer_date = datetime(2024, 7, 15, 12, 0, tzinfo=timezone.utc)
        assert is_ireland_dst(summer_date) is True
    
    def test_is_ireland_dst_winter_time(self):
        """Test DST detection during winter months"""
        # Test date in January (definitely winter time)
        winter_date = datetime(2024, 1, 15, 12, 0, tzinfo=timezone.utc)
        assert is_ireland_dst(winter_date) is False
        
        # Test date in November (definitely winter time)
        november_date = datetime(2024, 11, 15, 12, 0, tzinfo=timezone.utc)
        assert is_ireland_dst(november_date) is False
    
    def test_is_ireland_dst_transition_periods(self):
        """Test DST detection around transition periods"""
        # Test last Sunday in March (start of DST) - manually calculated for 2024: March 31
        dst_start = datetime(2024, 3, 31, 1, 0, tzinfo=timezone.utc)
        assert is_ireland_dst(dst_start) is True
        
        # Test day before DST starts
        before_dst = datetime(2024, 3, 30, 23, 0, tzinfo=timezone.utc)
        assert is_ireland_dst(before_dst) is False
        
        # Test last Sunday in October (end of DST) - manually calculated for 2024: October 27
        dst_end = datetime(2024, 10, 27, 1, 0, tzinfo=timezone.utc)
        assert is_ireland_dst(dst_end) is False
        
        # Test day before DST ends
        before_dst_end = datetime(2024, 10, 26, 23, 0, tzinfo=timezone.utc)
        assert is_ireland_dst(before_dst_end) is True
    
    def test_is_ireland_dst_different_years(self):
        """Test DST calculation for different years"""
        # Test 2023
        summer_2023 = datetime(2023, 6, 15, 12, 0, tzinfo=timezone.utc)
        winter_2023 = datetime(2023, 12, 15, 12, 0, tzinfo=timezone.utc)
        
        assert is_ireland_dst(summer_2023) is True
        assert is_ireland_dst(winter_2023) is False
        
        # Test 2025
        summer_2025 = datetime(2025, 8, 15, 12, 0, tzinfo=timezone.utc)
        winter_2025 = datetime(2025, 2, 15, 12, 0, tzinfo=timezone.utc)
        
        assert is_ireland_dst(summer_2025) is True
        assert is_ireland_dst(winter_2025) is False


class TestFlaskApp:
    """Test Flask application routes and functionality"""
    
    @pytest.fixture
    def client(self):
        """Create a test client for the Flask app"""
        app.config['TESTING'] = True
        with app.test_client() as client:
            yield client
    
    def test_index_route_success(self, client):
        """Test successful rendering of index page"""
        mock_prayer_times = [
            ['3', '15', '05:30', '07:25', '12:50', '16:30', '18:25', '19:45', '05:40', '13:15', '17:15', '18:35', '20:15'],
            ['3', '16', '05:28', '07:27', '12:50', '16:31', '18:27', '19:47', '05:40', '13:15', '17:15', '18:37', '20:15']
        ]
        
        with patch('app.load_prayer_times', return_value=mock_prayer_times):
            with patch('app.datetime') as mock_datetime:
                # Mock current time and timedelta operations
                mock_now = MagicMock()
                mock_now.month = 3
                mock_now.day = 15
                mock_now.strftime.side_effect = lambda fmt: {
                    '%H:%M:%S': '14:30:45',
                    '%a %d %b %Y': 'Fri 15 Mar 2024'
                }.get(fmt, fmt)
                mock_now.date.return_value = date(2024, 3, 15)
                
                # Mock tomorrow calculation
                mock_tomorrow = MagicMock()
                mock_tomorrow.month = 3
                mock_tomorrow.day = 16
                
                # Configure datetime.now and timedelta addition
                mock_datetime.now.return_value = mock_now
                mock_datetime.timedelta = timedelta  # Use real timedelta
                
                # Mock the addition operations
                def mock_add(self, other):
                    if isinstance(other, timedelta):
                        if other.days == 1:
                            return mock_tomorrow
                        elif other.hours == 1 or other.hours == 0:
                            return mock_now
                    return mock_now
                
                type(mock_now).__add__ = mock_add
                
                with patch('app.is_ireland_dst', return_value=False):
                    with patch('app.get_islamic_date', return_value='5 Ramadan 1445'):
                        response = client.get('/')
                        
                        assert response.status_code == 200
    
    def test_index_route_prayer_time_not_found(self, client):
        """Test index route when prayer times are not found for current date"""
        mock_prayer_times = [
            ['3', '20', '05:30', '07:25', '12:50', '16:30', '18:25', '19:45', '05:40', '13:15', '17:15', '18:35', '20:15']
        ]
        
        with patch('app.load_prayer_times', return_value=mock_prayer_times):
            with patch('app.datetime') as mock_datetime:
                mock_now = MagicMock()
                mock_now.month = 3
                mock_now.day = 15  # Different from available data (day 20)
                mock_datetime.now.return_value = mock_now
                mock_datetime.timedelta = timedelta
                
                # Mock tomorrow calculation
                mock_tomorrow = MagicMock()
                mock_tomorrow.month = 3
                mock_tomorrow.day = 16
                
                def mock_add(self, other):
                    if isinstance(other, timedelta) and other.days == 1:
                        return mock_tomorrow
                    return mock_now
                
                type(mock_now).__add__ = mock_add
                
                with patch('app.is_ireland_dst', return_value=False):
                    with patch('app.calculate_important_times') as mock_calc:
                        mock_calc.return_value = {'sehri_ends': '05:20', 'sunrise': '07:25', 'noon': '12:40'}
                        response = client.get('/')
                        
                        # Should still return 200 but with None for today's prayer times
                        assert response.status_code == 200
    
    def test_index_route_dst_handling(self, client):
        """Test proper handling of Irish Summer Time"""
        mock_prayer_times = [
            ['7', '15', '04:00', '06:00', '13:30', '18:00', '20:30', '22:00', '04:15', '14:00', '18:30', '20:35', '22:30']
        ]
        
        with patch('app.load_prayer_times', return_value=mock_prayer_times):
            with patch('app.datetime') as mock_datetime:
                mock_now = MagicMock()
                mock_now.month = 7
                mock_now.day = 15
                mock_datetime.now.return_value = mock_now
                mock_datetime.timedelta = timedelta
                
                # Mock tomorrow calculation
                mock_tomorrow = MagicMock()
                mock_tomorrow.month = 7
                mock_tomorrow.day = 16
                
                def mock_add(self, other):
                    if isinstance(other, timedelta) and other.days == 1:
                        return mock_tomorrow
                    return mock_now
                
                type(mock_now).__add__ = mock_add
                
                # Test with DST enabled
                with patch('app.is_ireland_dst', return_value=True):
                    response = client.get('/')
                    assert response.status_code == 200


class TestErrorHandling:
    """Test error handling across all functions"""
    
    def test_load_prayer_times_permission_error(self):
        """Test handling of permission errors when reading CSV"""
        with patch("builtins.open", side_effect=PermissionError):
            with pytest.raises(PermissionError):
                load_prayer_times()
    
    def test_calculate_important_times_empty_list(self):
        """Test handling of empty prayer times list"""
        with pytest.raises(IndexError):
            calculate_important_times([])
    
    def test_calculate_important_times_insufficient_data(self):
        """Test handling of insufficient prayer times data"""
        incomplete_data = ['3', '15']  # Missing time data
        
        with pytest.raises(IndexError):
            calculate_important_times(incomplete_data)


class TestIntegration:
    """Integration tests combining multiple functions"""
    
    @pytest.fixture
    def client(self):
        """Create a test client for integration tests"""
        app.config['TESTING'] = True
        with app.test_client() as client:
            yield client
    
    def test_full_workflow(self, client):
        """Test complete workflow from CSV loading to page rendering"""
        # Mock complete CSV data
        mock_csv_data = """MONTH,DATE,FAJR BEGINNING,SUNRISE BEGINNING,ZOHR BEGINNING,ASAR BEGINNING,MAGRIB BEGINNING,ISHA BEGINNING,FAJR JAMAAH,ZOHR JAMAAH,ASAR JAMAAH,MAGRIB JAMAAH,ISHA JAMAAH
3,15,05:30,07:25,12:50,16:30,18:25,19:45,05:40,13:15,17:15,18:35,20:15
3,16,05:28,07:27,12:50,16:31,18:27,19:47,05:40,13:15,17:15,18:37,20:15"""
        
        with patch("builtins.open", mock_open(read_data=mock_csv_data)):
            with patch('app.datetime') as mock_datetime:
                # Create proper mock for datetime operations
                mock_now = MagicMock()
                mock_now.month = 3
                mock_now.day = 15
                mock_now.strftime.side_effect = lambda fmt: {
                    '%H:%M:%S': '13:30:45',
                    '%a %d %b %Y': 'Fri 15 Mar 2024'
                }.get(fmt, fmt)
                mock_now.date.return_value = date(2024, 3, 15)
                
                # Mock tomorrow
                mock_tomorrow = MagicMock()
                mock_tomorrow.month = 3
                mock_tomorrow.day = 16
                
                # Configure datetime operations
                mock_datetime.now.return_value = mock_now
                mock_datetime.timedelta = timedelta
                
                def mock_add(self, other):
                    if isinstance(other, timedelta) and other.days == 1:
                        return mock_tomorrow
                    return mock_now
                
                type(mock_now).__add__ = mock_add
                
                with patch('app.is_ireland_dst', return_value=False):
                    with patch('app.get_islamic_date', return_value='5 Ramadan 1445'):
                        response = client.get('/')
                        
                        assert response.status_code == 200
                        # Check that prayer times are properly embedded
                        assert b'05:30' in response.data  # Fajr time
                        assert b'12:50' in response.data  # Zohr time
