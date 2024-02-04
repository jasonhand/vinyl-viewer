import csv
import json
import re

# Function to remove numbers in parentheses from the Artist field
def clean_artist_name(artist):
    return re.sub(r'\s*\(\d+\)\s*', '', artist)

# Function to convert CSV to JSON while ignoring specific columns
def csv_to_json(csv_file, json_file):
    data = []

    # List of columns to ignore
    columns_to_ignore = ["Collection Media Condition", "Collection Sleeve Condition", "Collection Notes"]

    # Read CSV file
    with open(csv_file, 'r') as csv_file:
        csv_reader = csv.DictReader(csv_file)

        # Convert each row to a dictionary, cleaning the artist name and ignoring specified columns
        for row in csv_reader:
            cleaned_row = {
                key: value for key, value in row.items() if key not in columns_to_ignore
            }
            cleaned_row['Artist'] = clean_artist_name(cleaned_row['Artist'])
            data.append(cleaned_row)

    # Write JSON data to the JSON file
    with open(json_file, 'w') as json_file:
        json.dump(data, json_file, indent=4)

# Example usage
if __name__ == "__main__":
    input_csv_file = 'input.csv'  # Replace with your CSV file name
    output_json_file = 'output.json'  # Replace with your desired JSON file name

    csv_to_json(input_csv_file, output_json_file)
