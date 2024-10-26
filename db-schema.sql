CREATE TYPE "public"."subway_line" AS ENUM('1', '2', '3', '4', '5', '6', '7', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'J', 'L', 'M', 'N', 'Q', 'R', 'W', 'Z', 'S', 'SIR');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hourly_ridership" (
	"timestamp" timestamp NOT NULL,
	"complex_id" integer NOT NULL,
	"ridership" integer NOT NULL,
	CONSTRAINT "hourly_ridership_pkey" PRIMARY KEY("timestamp","complex_id"),
	CONSTRAINT "hourly_ridership_ridership_check" CHECK (ridership >= 0)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mta_alerts" (
	"alert_id" integer PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"update_number" integer,
	"timestamp" timestamp NOT NULL,
	"affected_lines" subway_line[] NOT NULL,
	"status_label" text NOT NULL,
	"header" text,
	"description" text,
	CONSTRAINT "unique_event_alert" UNIQUE("alert_id","event_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subway_stops" (
	"complex_id" integer PRIMARY KEY NOT NULL,
	"lines" subway_line[] NOT NULL,
	"latitude" numeric(9, 6) NOT NULL,
	"longitude" numeric(9, 6) NOT NULL,
	CONSTRAINT "valid_latitude" CHECK ((latitude >= ('-90'::integer)::numeric) AND (latitude <= (90)::numeric)),
	CONSTRAINT "valid_longitude" CHECK ((longitude >= ('-180'::integer)::numeric) AND (longitude <= (180)::numeric))
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hourly_ridership" ADD CONSTRAINT "hourly_ridership_complex_id_fkey" FOREIGN KEY ("complex_id") REFERENCES "public"."subway_stops"("complex_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_hourly_ridership_complex_id" ON "hourly_ridership" USING btree ("complex_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_hourly_ridership_timestamp" ON "hourly_ridership" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_mta_alerts_timestamp" ON "mta_alerts" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_mta_alerts_affected_lines" ON "mta_alerts" USING gin ("affected_lines");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_subway_stops_lines" ON "subway_stops" USING gin ("lines");