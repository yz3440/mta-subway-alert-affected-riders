import seaborn as sns
import matplotlib.pyplot as plt
import pandas as pd
import matplotlib.dates as mdates

########################################################
# Daily ridership with alerts
########################################################
# Read the TSV file
df = pd.read_csv("./results/mta_ridership_with_alerts_daily.tsv", sep="\t", parse_dates=['date'])
plt.figure(figsize=(15, 6))

# Convert 'influenced_riders' and 'total_ridership' columns to numeric
df['influenced_riders'] = pd.to_numeric(df['influenced_riders'], errors='coerce')
df['total_ridership'] = pd.to_numeric(df['total_ridership'], errors='coerce')

# Calculate percentage of influenced riders
df['impact_percentage'] = (df['influenced_riders'] / df['total_ridership']) * 100



########################################################
# PERCENTAGE IMPACT OF ALERTS
########################################################
sns.scatterplot(data=df, x='date', y='impact_percentage', size='alert_count', 
                sizes=(20, 200), alpha=0.6)

plt.title('Percentage of Riders Potentially Affected by Alerts')
plt.xlabel('Date')
plt.ylabel('Percentage of Riders Influenced (%)')
plt.xticks(rotation=45)

# save to file
plot_name = "percentage_impact_of_alerts"
plt.savefig(f'./results/{plot_name}.png')

########################################################
# WEEKLY DISTRIBUTION OF INFLUENCED RIDERS
########################################################
df['day_of_week'] = df['date'].dt.day_name()

plt.figure(figsize=(12, 6))
sns.boxplot(data=df, x='day_of_week', y='influenced_riders', 
            order=['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])

plt.title('Distribution of Influenced Riders by Day of Week')
plt.xticks(rotation=45)
plt.ylabel('Number of Influenced Riders')

# save to file
plot_name = "influenced_riders_by_day_of_week"
plt.savefig(f'./results/{plot_name}.png')

########################################################
# MONTHLY DISTRIBUTION OF INFLUENCED RIDERS
########################################################
df['month'] = df['date'].dt.to_period('M')

monthly_avg = df.groupby('month').agg({
    'total_ridership': 'mean',
    'influenced_riders': 'mean',
    'alert_count': 'mean'
}).reset_index()

monthly_avg['month'] = monthly_avg['month'].dt.to_timestamp()
monthly_avg['percentage_influenced'] = (monthly_avg['influenced_riders'] / monthly_avg['total_ridership']) * 100

plt.figure(figsize=(15, 6))
sns.lineplot(data=monthly_avg, x='month', y='percentage_influenced', marker='o')
plt.title('Monthly Average Percentage of Influenced Riders')
plt.xticks(rotation=45)
plt.ylabel('Percentage of Influenced Riders (%)')

plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m'))
plt.gca().xaxis.set_major_locator(mdates.MonthLocator())

plot_name = "monthly_average_percentage_influenced_riders"
plt.savefig(f'./results/{plot_name}.png')


########################################################
# ALERT IMPACT
########################################################
plt.figure(figsize=(10, 6))
sns.scatterplot(data=df, x='alert_count', y='influenced_riders', 
                alpha=0.5, size='total_ridership', sizes=(20, 200))

plt.title('Correlation between Alerts and Influenced Riders')
plt.xlabel('Number of Alerts')
plt.ylabel('Number of Influenced Riders')

# save to file
plot_name = "alert_impact"
plt.savefig(f'./results/{plot_name}.png')
