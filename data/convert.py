import pandas as pd
import json
import re
import math

# Function to remove numbers in parentheses from the Artist field
def clean_artist_name(artist):
    return re.sub(r'\s*\(\d+\)\s*', '', artist)

# Function to convert CSV to JSON while handling NaN values and ignoring specific columns
def csv_to_json(csv_file, json_file):
    data = []

    # List of columns to ignore
    columns_to_ignore = ["Collection Media Condition", "Collection Sleeve Condition", "Collection Notes"]

    # Read CSV file using pandas
    df = pd.read_csv(csv_file)

    # Iterate through DataFrame rows
    for index, row in df.iterrows():
        cleaned_row = {
            key: value if not pd.isna(value) else None for key, value in row.items() if key not in columns_to_ignore
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
