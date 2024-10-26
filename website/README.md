## Deploy the Website

The visualization platform is built with NextJS, which provides both the frontend interface and backend API endpoints to query the database.

> **Note**: The core data aggregation logic for calculating potentially affected ridership is implemented in the backend API router at `website/src/server/api/routers/mta-alert.ts`. This TypeScript file contains the queries and algorithms for:
>
> - Correlating alerts with station ridership
> - Calculating temporal overlaps
> - Aggregating affected passenger counts

### Setup Development Environment

1. Install dependencies:

```bash
npm install --force
```

2. Configure database connection:
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

The website ([mta-subway-alerts-influence.vercel.app](https://mta-subway-alerts-influence.vercel.app)) provides:

- Interactive heatmap of potentially affected ridership
- Station-level grid cell visualization
- Timeline views of service alerts
- Date selection for historical analysis

Note: Ensure your database is accessible from your deployment environment and the `DATABASE_URL` is properly configured in your production environment.
