import polars as pl
import os

########################################################
# MARK: CONSTANTS
########################################################

# https://data.ny.gov/Transportation/MTA-Subway-Stations/39hk-dx4f/about_data
MTA_STATION_CSV = "./datasets/MTA_Subway_Stations_20241024.csv"
# https://data.ny.gov/Transportation/MTA-Service-Alerts-Beginning-April-2020/7kct-peq7/about_data
MTA_ALERT_CSV = "./datasets/MTA_Service_Alerts__Beginning_April_2020_20241014.csv"
# https://data.ny.gov/Transportation/MTA-Subway-Hourly-Ridership-Beginning-July-2020/wujg-7c2s/about_data
MTA_HOURLY_RIDERSHIP_CSV = (
    "./datasets/MTA_Subway_Hourly_Ridership__Beginning_February_2022_20241014.csv"
)

os.makedirs("./data", exist_ok=True)

LINES_OF_INTEREST = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "J",
    "L",
    "M",
    "N",
    "Q",
    "R",
    "W",
    "Z",
    "S",
]

########################################################
# MARK: HELPER FUNCTIONS
########################################################


def list_to_postgres_literal(list):
    return "{" + ",".join(list) + "}"


########################################################
# MARK: MTA STATION DATA
########################################################


print("Reading MTA Station Data")
df = pl.read_csv(MTA_STATION_CSV)

print("Parsing MTA Station Data")
df_list = df.rows()

output_tsv_file_path = "./data/mta_stations.tsv"
output_tsv_string_list = []
output_tsv_string_list.append("complex_id\tlines\tlatitude\tlongitude")


def parse_station_from_tuple(tuple):
    station_id = tuple[1]
    complex_id = tuple[2]
    subway_lines = tuple[8].split(" ")
    subway_lines = [line for line in subway_lines if line in LINES_OF_INTEREST]
    latitude = tuple[10]
    longitude = tuple[11]
    return {
        "station_id": station_id,
        "complex_id": complex_id,
        "lines": subway_lines,
        "latitude": latitude,
        "longitude": longitude,
    }


for tuple in df_list:
    parsed_station = parse_station_from_tuple(tuple)
    if len(parsed_station["lines"]) > 0:
        output_tsv_string_list.append(
            f"{parsed_station['complex_id']}\t{list_to_postgres_literal(parsed_station['lines'])}\t{parsed_station['latitude']}\t{parsed_station['longitude']}"
        )

print("Writing MTA Station Data")
with open(output_tsv_file_path, "w") as f:
    for line in output_tsv_string_list:
        f.write(line + "\n")


########################################################
# MARK: MTA ALERT DATA
########################################################

print("Reading MTA Alert Data")
df = pl.read_csv(MTA_ALERT_CSV)

print("Filtering MTA Alert Data")
df = df.filter(pl.col("Agency") == "NYCT Subway")

df = df.with_columns(
    pl.col("Date").str.strptime(pl.Datetime, "%m/%d/%Y %I:%M:%S %p").alias("DateTime")
)


def map_affected_lines(lines_str):
    lines = lines_str.split("|")
    lines = [line.strip() for line in lines]
    lines = [line for line in lines if line in LINES_OF_INTEREST]
    return list_to_postgres_literal(lines)


df = df.with_columns(
    pl.col("Affected")
    .map_elements(map_affected_lines, return_dtype=pl.Utf8)
    .alias("Affected")
)

# remove rows with empty `Affected`, since we filtered for only lines of interest
df = df.filter(pl.col("Affected") != "{}")

df = df.select(
    "Alert ID",
    "Event ID",
    "Update Number",
    "Status Label",
    "Affected",
    "Description",
    "DateTime",
)

df = df.rename(
    {
        "Alert ID": "alert_id",
        "Event ID": "event_id",
        "Update Number": "update_number",
        "Status Label": "status_label",
        "Description": "description",
        "DateTime": "timestamp",
        "Affected": "affected_lines",
    }
)

print("Writing MTA Alert Data")
df.write_csv("./data/mta_subway_alerts.tsv", separator="\t")


########################################################
# MARK: MTA HOURLY RIDERSHIP DATA
########################################################

print("Reading MTA Hourly Ridership Data")
df = pl.read_csv(MTA_HOURLY_RIDERSHIP_CSV, ignore_errors=True)

print("Parsing MTA Hourly Ridership Data")
df = df.with_columns(
    pl.col("transit_timestamp")
    .str.strptime(pl.Datetime, "%m/%d/%Y %I:%M:%S %p")
    .alias("DateTime")
)

df = df.filter(pl.col("transit_mode") == "subway")
df = df.select(
    "station_complex_id",
    "ridership",
    "DateTime",
)

df = df.rename(
    {
        "station_complex_id": "complex_id",
        "ridership": "ridership",
        "DateTime": "timestamp",
    }
)

print("Writing MTA Hourly Ridership Data")
df.write_csv("./data/mta_subway_hourly_ridership.tsv", separator="\t")


########################################################
# MARK: ZIP DATA (for upload)
########################################################

# print("Zipping all the files in the data directory")
# os.system("zip -r data.zip data")

# print("Removing the data directory")
# os.system("rm -rf data")
