// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql } from "drizzle-orm";

import {
  pgTable,
  check,
  integer,
  varchar,
  numeric,
  unique,
  timestamp,
  text,
  foreignKey,
  primaryKey,
  pgView,
  pgEnum,
  index,
  pgTableCreator,
} from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm/relations";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `${name}`);

export const subwayLine = pgEnum("subway_line", [
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
  "SIR",
]);

export const subwayStops = createTable(
  "subway_stops",
  {
    complexId: integer("complex_id").primaryKey().notNull(),
    lines: subwayLine().array().notNull(),
    latitude: numeric({ precision: 9, scale: 6 }).notNull(),
    longitude: numeric({ precision: 9, scale: 6 }).notNull(),
  },
  (table) => {
    return {
      linesIdx: index("idx_subway_stops_lines").using("gin", table.lines),
      validLatitude: check(
        "valid_latitude",
        sql`(latitude >= ('-90'::integer)::numeric) AND (latitude <= (90)::numeric)`,
      ),
      validLongitude: check(
        "valid_longitude",
        sql`(longitude >= ('-180'::integer)::numeric) AND (longitude <= (180)::numeric)`,
      ),
    };
  },
);

export const mtaAlerts = createTable(
  "mta_alerts",
  {
    alertId: integer("alert_id").primaryKey().notNull(),
    eventId: integer("event_id").notNull(),
    updateNumber: integer("update_number"),
    timestamp: timestamp({ mode: "string" }).notNull(),
    affectedLines: subwayLine("affected_lines").array().notNull(),
    statusLabel: text("status_label").notNull(),
    header: text(),
    description: text(),
  },
  (table) => {
    return {
      idxMtaAlertsTimestamp: index("idx_mta_alerts_timestamp").using(
        "btree",
        table.timestamp.asc().nullsLast(),
      ),
      affectedLinesIdx: index("idx_mta_alerts_affected_lines").using(
        "gin",
        table.affectedLines,
      ),
      uniqueEventAlert: unique("unique_event_alert").on(
        table.alertId,
        table.eventId,
      ),
    };
  },
);

export const hourlyRidership = createTable(
  "hourly_ridership",
  {
    timestamp: timestamp({ mode: "string" }).notNull(),
    complexId: integer("complex_id").notNull(),
    ridership: integer().notNull(),
  },
  (table) => {
    return {
      idxHourlyRidershipComplexId: index(
        "idx_hourly_ridership_complex_id",
      ).using("btree", table.complexId.asc().nullsLast()),
      idxHourlyRidershipTimestamp: index(
        "idx_hourly_ridership_timestamp",
      ).using("btree", table.timestamp.asc().nullsLast()),

      hourlyRidershipComplexIdFkey: foreignKey({
        columns: [table.complexId],
        foreignColumns: [subwayStops.complexId],
        name: "hourly_ridership_complex_id_fkey",
      }),
      hourlyRidershipPkey: primaryKey({
        columns: [table.timestamp, table.complexId],
        name: "hourly_ridership_pkey",
      }),
      hourlyRidershipRidershipCheck: check(
        "hourly_ridership_ridership_check",
        sql`ridership >= 0`,
      ),
    };
  },
);

export const hourlyRidershipRelations = relations(
  hourlyRidership,
  ({ one }) => ({
    subwayStop: one(subwayStops, {
      fields: [hourlyRidership.complexId],
      references: [subwayStops.complexId],
    }),
  }),
);

export const subwayStopsRelations = relations(subwayStops, ({ many }) => ({
  hourlyRiderships: many(hourlyRidership),
  alerts: many(mtaAlerts, {
    relationName: "alert_stops",
  }),
}));

export const mtaAlertsRelations = relations(mtaAlerts, ({ many }) => ({
  affectedStops: many(subwayStops, {
    relationName: "alert_stops",
    // This is a custom relation where we'll match arrays
    // An alert affects a stop if they share any subway lines
  }),
}));
