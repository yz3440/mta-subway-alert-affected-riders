import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { mtaAlerts, subwayStops, hourlyRidership } from "@/server/db/schema";
import { and, gte, lte, sql, eq } from "drizzle-orm";

export const mtaAlertRouter = createTRPCRouter({
  getInRangeAlerts: publicProcedure
    .input(
      z.object({
        timeMin: z.date(),
        timeMax: z.date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // First, get alerts with affected stops
      const alertsWithStops = await ctx.db
        .select({
          alertId: mtaAlerts.alertId,
          eventId: mtaAlerts.eventId,
          updateNumber: mtaAlerts.updateNumber,
          timestamp: mtaAlerts.timestamp,
          affectedLines: mtaAlerts.affectedLines,
          statusLabel: mtaAlerts.statusLabel,
          header: mtaAlerts.header,
          description: mtaAlerts.description,
          stopComplexId: subwayStops.complexId,
          stopLatitude: subwayStops.latitude,
          stopLongitude: subwayStops.longitude,
          stopLines: subwayStops.lines,
        })
        .from(mtaAlerts)
        .leftJoin(
          subwayStops,
          sql`${subwayStops.lines} && ${mtaAlerts.affectedLines}`,
        )
        .where(
          and(
            gte(mtaAlerts.timestamp, input.timeMin.toISOString()),
            lte(mtaAlerts.timestamp, input.timeMax.toISOString()),
          ),
        );

      // Then, get all ridership data for the time period
      const ridership = await ctx.db
        .select({
          complexId: hourlyRidership.complexId,
          timestamp: hourlyRidership.timestamp,
          ridership: hourlyRidership.ridership,
          lines: subwayStops.lines,
          latitude: subwayStops.latitude,
          longitude: subwayStops.longitude,
        })
        .from(hourlyRidership)
        .leftJoin(
          subwayStops,
          eq(hourlyRidership.complexId, subwayStops.complexId),
        )
        .where(
          and(
            gte(hourlyRidership.timestamp, input.timeMin.toISOString()),
            lte(hourlyRidership.timestamp, input.timeMax.toISOString()),
          ),
        );

      // put alerts in to a bucket of time
      // this makes the aggregation a lot faster
      // the buckets are in hours, like 11:00 - 12:00
      // if the alert happens between 11:30 and 12:30, it goes in the 11:00 - 12:00 bucket
      // if the alert happens between 12:00 and 13:00, it goes in the 12:00 - 13:00 bucket
      // etc.
      const alertBuckets: Record<string, AlertWithoutStops[]> = {};
      // populate the hour buckets
      const earliestHour = new Date(input.timeMin);
      earliestHour.setMinutes(0, 0, 0);

      let latestHour = new Date(input.timeMax);
      latestHour.setMinutes(0, 0, 0);
      latestHour = new Date(latestHour.getTime() + 3600000);

      // populate the hour buckets
      let currentHour = earliestHour;
      while (currentHour < latestHour) {
        alertBuckets[currentHour.toISOString()] = [];
        currentHour = new Date(currentHour.getTime() + 3600000);
      }
      // put alerts in to the buckets
      for (const alert of alertsWithStops) {
        const alertTime = new Date(alert.timestamp);
        const alertDuration = 3600000 / 2;
        const alertEndTime = new Date(alertTime.getTime() + alertDuration);
        const alertStartHour = new Date(alertTime.getTime());
        alertStartHour.setMinutes(0, 0, 0);

        let alertEndHour = new Date(alertEndTime.getTime());
        alertEndHour.setMinutes(0, 0, 0);
        // assume the alert lasts for 1 hour
        alertEndHour = new Date(alertEndHour.getTime() + 3600000);

        const occupiedBuckets = [];
        let currentWindow = alertStartHour;
        while (currentWindow < alertEndHour) {
          if (alertBuckets[currentWindow.toISOString()]) {
            occupiedBuckets.push(currentWindow.toISOString());
          }
          currentWindow = new Date(currentWindow.getTime() + 3600000);
        }

        for (const bucket of occupiedBuckets) {
          alertBuckets[bucket]!.push({
            alertId: alert.alertId,
            eventId: alert.eventId,
            updateNumber: alert.updateNumber ?? 0,
            statusLabel: alert.statusLabel,
            timestamp: alert.timestamp,
            header: alert.header ?? "",
            description: alert.description ?? "",
            affectedLines: alert.affectedLines ?? [],
          });
        }
      }

      // now we can aggregate the ridership data
      const ridershipInfluenced: RiderShipInfluenced[] = ridership
        .map((r) => {
          const parsedTimestamp = new Date(r.timestamp);
          parsedTimestamp.setMinutes(0, 0, 0);
          const key = parsedTimestamp.toISOString();
          // get the alerts that happened in this hour
          const alerts = alertBuckets[key] ?? [];

          // for the ridership data that starts in this hour,
          // assume everyone entered the station at the start of the hour
          const riderTime = new Date(r.timestamp);

          const validAlerts = alerts.filter((a) => {
            // if the alert starts within 30 minutes of the ridership data
            const timeOverlap =
              Math.abs(Date.parse(a.timestamp) - riderTime.getTime()) <=
              1800000;

            // if the alert affects any of the lines at this station
            const linesOverlap = a.affectedLines.some((line) =>
              ((r.lines ?? []) as string[]).includes(line),
            );
            return timeOverlap && linesOverlap;
          });

          return {
            ridership: r.ridership,
            timestamp: r.timestamp,
            latitude: parseFloat(r.latitude ?? "0"),
            longitude: parseFloat(r.longitude ?? "0"),
            complexId: r.complexId,
            lines: r.lines ?? [],
            alertsIds: validAlerts.map((a) => a.alertId),
            isInfluenced: validAlerts.length > 0,
          };
        })
        .filter((r) => r.isInfluenced);

      // Group the results by alert
      const alerts: Record<number, Alert> = {};
      alertsWithStops.forEach((row) => {
        const alertKey = row.alertId;
        if (!alerts[alertKey]) {
          alerts[alertKey] = {
            alertId: row.alertId,
            eventId: row.eventId,
            updateNumber: row.updateNumber ?? 0,
            timestamp: row.timestamp,
            affectedLines: row.affectedLines,
            statusLabel: row.statusLabel,
            header: row.header ?? "",
            description: row.description ?? "",
            affectedStops: [],
          };
        }

        if (row.stopComplexId) {
          // Calculate ridership for this stop around alert time
          const alertTime = Date.parse(row.timestamp);
          const stopRidership = ridership
            .filter(
              (r) =>
                r.complexId === row.stopComplexId &&
                Math.abs(Date.parse(r.timestamp) - alertTime) <= 3600000, // within 1 hour
            )
            .reduce((sum, r) => sum + r.ridership, 0);

          alerts[alertKey].affectedStops.push({
            complexId: row.stopComplexId,
            latitude: parseFloat(row.stopLatitude ?? "0"),
            longitude: parseFloat(row.stopLongitude ?? "0"),
            lines: row.stopLines ?? [],
            ridership: stopRidership,
          });
        }
      });

      const totalRidershipOfTheTimePeriod = ridership.reduce(
        (sum, r) => sum + r.ridership,
        0,
      );

      return {
        alerts: Object.values(alerts),
        riderShipInfluenced: ridershipInfluenced,
        totalRidershipOfTheTimePeriod,
      };
    }),
});

interface RiderShipInfluenced {
  ridership: number;
  timestamp: string;
  latitude: number;
  longitude: number;
  complexId: number;
  lines: string[];
  alertsIds: number[];
  isInfluenced: boolean;
}

interface AlertStop {
  complexId: number;
  latitude: number;
  longitude: number;
  lines: string[];
  ridership: number;
}

interface AlertWithoutStops {
  alertId: number;
  eventId: number;
  updateNumber: number;
  timestamp: string;
  statusLabel: string;
  header: string;
  description: string;
  affectedLines: string[];
}

interface Alert {
  alertId: number;
  eventId: number;
  updateNumber: number;
  timestamp: string;
  affectedLines: string[];
  statusLabel: string;
  header: string;
  description: string;
  affectedStops: AlertStop[];
}
