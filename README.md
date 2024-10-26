# MTA Subway Alert Influence

Project for the [MTA Data Challenge](https://new.mta.info/article/mta-open-data-challenge).

This project provides an interactive visualization platform ([placeholder.com](https://placeholder.com)) that maps the relationship between MTA subway service disruptions and ridership patterns. By correlating service alerts with station entry data, we visualize the number of riders potentially affected by service disruptions through an interactive heatmap and station-level grid cells.

The analysis spans 31 months (February 2022 through August 2024), allowing users to select any date and explore:

- A dynamic heatmap showing potentially affected ridership across the subway system
- A station-level grid cell map for detailed analysis
- Interactive timeline views for each station showing relevant service alerts throughout the day
- Hover functionality revealing detailed station and alert information

> **Important Disclaimer**: My estimation provides an upper bound of affected riders. The actual number of riders influenced is likely significantly lower because:
>
> - Not all stops along a disrupted line are necessarily affected by the reported incident
> - Some riders may have alternative routes available
> - The alert may affect only a specific segment of the line
> - Some riders may have been informed of the disruption before entering the station

## Datasets

This repository contains code to process New York MTA (Metropolitan Transportation Authority) data from three main datasets:

1. [MTA Subway Stations](https://data.ny.gov/Transportation/MTA-Subway-Stations/39hk-dx4f/about_data) - Station locations and route information
2. [MTA Service Alerts](https://data.ny.gov/Transportation/MTA-Service-Alerts-Beginning-April-2020/7kct-peq7/about_data) - Real-time service alerts and disruptions (2020-04-28 to 2024-08-30 when accessed)
3. [MTA Subway Hourly Ridership](https://data.ny.gov/Transportation/MTA-Subway-Hourly-Ridership-Beginning-July-2020/wujg-7c2s/about_data) - Hourly ridership data by station (2022-02-01 to 2024-10-01 when accessed)

Note: This project analyzes the overlapping period between the alerts and ridership datasets (2022-02-01 to 2024-08-30).

## Data Preparation

### Pre-processed Data

For convenience, a pre-processed version of the data is available in on [Google Drive](https://drive.google.com/file/d/1SjwkXG433pYX8iXkEFWZv20RE-rFmVy5/view?usp=sharing). You can use these files directly if you don't need to process the raw data yourself.

### Processing Raw Data

Due to size limitations, the original datasets are not included in this repository. Please download them from the official sources linked above.

1. Install required dependencies:

```bash
pip install -r requirements.txt
```

2. Download the CSV files from the links above and place them in a `datasets` folder with the following names:

   - `MTA_Subway_Stations_20241024.csv`
   - `MTA_Service_Alerts__Beginning_April_2020_20241014.csv`
   - `MTA_Subway_Hourly_Ridership__Beginning_February_2022_20241014.csv`

3. Run the data preparation script.

```bash
python data-preparation.py
```

### What does the script do

The script `data-preparation.py` processes these CSV files and generates TSV files. The processed files will be created in the `/data` folder:

- `mta_stations.tsv`
- `mta_subway_alerts.tsv`
- `mta_subway_hourly_ridership.tsv`

The script performs several key transformations:

- Filters for subway lines of interest
- Converts timestamps to standardized format
- Structures station information for geospatial analysis
- Prepares data in TSV format optimized for PostgreSQL import

## Populating Database

### Create Database Schema

First, create the database tables and indices by running the SQL schema:

```bash
psql -d your_database_name -f db-schema.sql
```

This creates:

- Custom enum type for subway lines
- Three main tables with appropriate constraints and indices
- GIN indices for efficient array operations
- B-tree indices for timestamp-based queries

### Database Structure

The schema defines three main tables:

1. **subway_stops**: Stores station information

   - Primary key: `complex_id`
   - Contains: station coordinates and served subway lines
   - Includes spatial validation constraints for coordinates
   - GIN index on `lines` array for efficient line-based queries

2. **mta_alerts**: Stores service disruption alerts

   - Primary key: `alert_id`
   - Contains: alert details, timestamp, and affected subway lines
   - Includes unique constraint on alert and event IDs
   - Indexed on `timestamp` and `affected_lines` for efficient temporal and line-based queries

3. **hourly_ridership**: Stores station entry data
   - Composite primary key: (`timestamp`, `complex_id`)
   - Contains: hourly ridership counts for each station
   - Foreign key relationship with `subway_stops`
   - Indexed for efficient temporal and station-based queries

### Loading Data

After creating the schema, populate the tables with the TSV files generated from the data preparation step:

```sql
-- Load subway stations data
\copy subway_stops FROM 'data/mta_stations.tsv' WITH DELIMITER E'\t' CSV HEADER;

-- Load service alerts
\copy mta_alerts FROM 'data/mta_subway_alerts.tsv' WITH DELIMITER E'\t' CSV HEADER;

-- Load hourly ridership data
\copy hourly_ridership FROM 'data/mta_subway_hourly_ridership.tsv' WITH DELIMITER E'\t' CSV HEADER;
```

The schema includes appropriate indices and constraints to ensure data integrity and query performance. The GIN indices on array columns (`lines` and `affected_lines`) are particularly important for efficiently finding stations affected by specific service disruptions.

## Deploy the Website

The visualization platform is built with NextJS, which provides both the frontend interface and backend API endpoints to query the database.

> **Note**: The core data aggregation logic for calculating potentially affected ridership is implemented in the backend API router at `website/src/server/api/routers/mta-alert.ts`. This TypeScript file contains the queries and algorithms for:
>
> - Correlating alerts with station ridership
> - Calculating temporal overlaps
> - Aggregating affected passenger counts

### Setup Development Environment

1. Navigate to the website directory:

```bash
cd website
```

2. Install dependencies:

```bash
npm install --force
```

3. Configure database connection:
   - Create a `.env` file in the `website` directory
   - Add your database connection URL to the `.env` file:

```env
DATABASE_URL="postgresql://username:password@host:port/database"
```

### Development

Run the development server:

```bash
npm run dev
```

The site will be available at `http://localhost:3000`. The development server includes:

- Hot reloading for real-time code changes
- API route testing
- Development error messages

### Production Deployment

Build the production version:

```bash
npm run build
```

After building, you can start the production server:

```bash
npm run start
```

The website ([placeholder.com](https://placeholder.com)) provides:

- Interactive heatmap of potentially affected ridership
- Station-level grid cell visualization
- Timeline views of service alerts
- Date selection for historical analysis

Note: Ensure your database is accessible from your deployment environment and the `DATABASE_URL` is properly configured in your production environment.
