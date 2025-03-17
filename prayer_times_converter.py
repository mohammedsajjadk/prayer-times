def convert_to_24hr(time_str, is_am=False):
    """Convert time to 24-hour format"""
    if time_str == '"':
        return time_str  # Keep quotes for now, will be processed later
    
    # Replace dots with colons
    time_str = time_str.replace('.', ':')
    
    # Split into hours and minutes
    parts = time_str.split(':')
    hours = int(parts[0])
    minutes = int(parts[1]) if len(parts) > 1 else 0
    
    # Convert to 24-hour format if PM
    if not is_am and hours < 12:
        hours += 12
    
    # Format the time as HH:MM
    return f"{hours:02d}:{minutes:02d}"

def process_prayer_times(input_text):
    lines = input_text.strip().split('\n')
    headers = lines[0].split('\t')
    processed_lines = [headers]  # Start with headers
    
    # Store the last valid value for each column
    last_values = [''] * len(headers)
    
    for i in range(1, len(lines)):
        values = lines[i].split('\t')
        processed_values = []
        
        for j, val in enumerate(values):
            if val == '"':
                # Use the last valid value for this column
                processed_values.append(last_values[j])
            else:
                # Convert time based on prayer type
                is_am = (j == 0)  # Only FAJR is AM
                converted = convert_to_24hr(val, is_am)
                processed_values.append(converted)
                last_values[j] = converted
        
        processed_lines.append(processed_values)
    
    return processed_lines

# Get input from user
print("Please paste your prayer times data (Ctrl+Z or Ctrl+D when finished):")
input_data = ""
try:
    while True:
        line = input()
        input_data += line + "\n"
except EOFError:
    pass

# Process and display the result
result = process_prayer_times(input_data)

# Create a properly formatted output string for Excel
excel_output = ""
for row in result:
    excel_output += "\t".join(row) + "\n"

# Save to file for easier copy-paste
with open("prayer_times_output.txt", "w") as f:
    f.write(excel_output)

# Display instructions
print("\nProcessed prayer times have been saved to 'prayer_times_output.txt'")
print("Open this file and copy-paste its contents into NOTEPAD and then into Excel.")