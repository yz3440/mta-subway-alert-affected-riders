import seaborn as sns
import matplotlib.pyplot as plt
import pandas as pd
import matplotlib.dates as mdates

########################################################
# Daily ridership with alerts
########################################################
# Read the TSV file
df = pd.read_csv("./analysis/mta_ridership_with_alerts_daily.tsv", sep="\t", parse_dates=['date'])
plt.figure(figsize=(15, 6))

# Convert 'affected_riders' and 'total_ridership' columns to numeric
df['affected_riders'] = pd.to_numeric(df['affected_riders'], errors='coerce')
df['total_ridership'] = pd.to_numeric(df['total_ridership'], errors='coerce')

# Calculate percentage of affected riders
df['impact_percentage'] = (df['affected_riders'] / df['total_ridership']) * 100



########################################################
# PERCENTAGE IMPACT OF ALERTS
########################################################
sns.scatterplot(data=df, x='date', y='impact_percentage', size='alert_count', 
                sizes=(20, 200), alpha=0.6)

plt.title('Percentage of Riders Potentially Affected by Alerts')
plt.xlabel('Date')
plt.ylabel('Percentage of Riders Affected (%)')
plt.xticks(rotation=45)

# save to file
plot_name = "percentage_impact_of_alerts"
plt.savefig(f'./analysis/{plot_name}.png')

########################################################
# WEEKLY DISTRIBUTION OF INFLUENCED RIDERS
########################################################
df['day_of_week'] = df['date'].dt.day_name()

plt.figure(figsize=(12, 6))
sns.boxplot(data=df, x='day_of_week', y='affected_riders', 
            order=['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])

plt.title('Distribution of Affected Riders by Day of Week')
plt.xticks(rotation=45)
plt.ylabel('Number of Affected Riders')

# save to file
plot_name = "affected_riders_by_day_of_week"
plt.savefig(f'./analysis/{plot_name}.png')

########################################################
# MONTHLY DISTRIBUTION OF INFLUENCED RIDERS
########################################################
df['month'] = df['date'].dt.to_period('M')

monthly_avg = df.groupby('month').agg({
    'total_ridership': 'mean',
    'affected_riders': 'mean',
    'alert_count': 'mean'
}).reset_index()

monthly_avg['month'] = monthly_avg['month'].dt.to_timestamp()
monthly_avg['percentage_affected'] = (monthly_avg['affected_riders'] / monthly_avg['total_ridership']) * 100

plt.figure(figsize=(15, 6))
sns.lineplot(data=monthly_avg, x='month', y='percentage_affected', marker='o')
plt.title('Monthly Average Percentage of Affected Riders')
plt.xticks(rotation=45)
plt.ylabel('Percentage of Affected Riders (%)')

plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m'))
plt.gca().xaxis.set_major_locator(mdates.MonthLocator())

plot_name = "monthly_average_percentage_affected_riders"
plt.savefig(f'./analysis/{plot_name}.png')


########################################################
# ALERT IMPACT
########################################################
plt.figure(figsize=(10, 6))
sns.scatterplot(data=df, x='alert_count', y='affected_riders', 
                alpha=0.5, size='total_ridership', sizes=(20, 200))

plt.title('Correlation between Alerts and Affected Riders')
plt.xlabel('Number of Alerts')
plt.ylabel('Number of Affected Riders')

# save to file
plot_name = "alert_impact"
plt.savefig(f'./analysis/{plot_name}.png')


########################################################
# JUST TOTAL RIDERS MONTHLY TREND
########################################################
monthly_ridership = df.groupby(df['date'].dt.to_period('M'))['total_ridership'].mean().reset_index()
monthly_ridership['date'] = monthly_ridership['date'].dt.to_timestamp()

plt.figure(figsize=(12, 6))
sns.lineplot(data=monthly_ridership, x='date', y='total_ridership', marker='o')
plt.title('Monthly Average Total Ridership Trend')
plt.xlabel('Month')
plt.ylabel('Average Total Ridership')
plt.xticks(rotation=45)
plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m'))
plt.gca().xaxis.set_major_locator(mdates.MonthLocator())
plt.tight_layout()

plot_name = "monthly_total_riders_trend"
plt.savefig(f'./analysis/{plot_name}.png')
