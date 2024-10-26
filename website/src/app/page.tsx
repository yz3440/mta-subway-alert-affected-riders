"use client";
import { api } from "@/trpc/react";
import Link from "next/link";
import { cn, clamp, differenceInDays, addDays, formatDate } from "@/lib/utils";
import { useCallback, useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useMapViewStateParams } from "@/hooks/params-parsers/use-map-view-state-params";
// DECK.GL
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import {
  type LayersList,
  type MapViewState,
  type PickingInfo,
} from "@deck.gl/core";
import { GridCellLayer } from "@deck.gl/layers";

import DeckGL from "@deck.gl/react";

// MAPLIBRE
import "maplibre-gl/dist/maplibre-gl.css";
import { Map } from "react-map-gl/maplibre";

import { cartoStyles, NYC_BOUNDS, DEFAULT_INITIAL_VIEW_STATE } from "@/lib/map";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";

interface TransformedData {
  position: [number, number];
  ridership: number;
  lines: string[];
  complexId: number;
  alert: {
    alertId: number;
  }[];
}

const OVERALL_MIN_DATE = new Date("2022-02-01T00:00:00Z");
const OVERALL_MAX_DATE = new Date("2024-08-30T00:00:00Z");

const CALCULATED_DAY_COUNT = differenceInDays(
  OVERALL_MAX_DATE,
  OVERALL_MIN_DATE,
);

const RECORD_MODE = false;
const RECORD_INTERVAL_MS = 3000;

export default function Home() {
  const initialView: MapViewState = DEFAULT_INITIAL_VIEW_STATE;

  const [selectedDay, setSelectedDay] = useState<number>(0);

  const timeMin = useMemo(() => {
    return addDays(OVERALL_MIN_DATE, selectedDay);
  }, [selectedDay]);

  const timeMax = useMemo(() => {
    return addDays(timeMin, 1);
  }, [timeMin]);

  const [mapViewStateParams, setMapViewStateParams] = useMapViewStateParams();

  const [viewState, setViewState] = useState<MapViewState>(initialView);

  const { data, isLoading } = api.mtaAlert.getInRangeAlerts.useQuery({
    timeMin,
    timeMax,
  });

  const { alerts, totalRidershipOfTheTimePeriod, riderShipInfluenced } =
    data ?? {};

  const transformedData = useMemo<TransformedData[]>(() => {
    if (!riderShipInfluenced) return [];

    return riderShipInfluenced.map((r) => ({
      position: [r.longitude, r.latitude],
      ridership: r.ridership,
      complexId: r.complexId,
      lines: r.lines,
      alert: r.alertsIds.map((alertId) => ({ alertId })),
    }));
  }, [riderShipInfluenced]);

  // Apply view state constraints
  const applyViewStateConstraints = useCallback(
    (viewState: MapViewState) => ({
      ...viewState,
      longitude: clamp(
        viewState.longitude,
        NYC_BOUNDS.minLongitude,
        NYC_BOUNDS.maxLongitude,
      ),
      latitude: clamp(
        viewState.latitude,
        NYC_BOUNDS.minLatitude,
        NYC_BOUNDS.maxLatitude,
      ),
    }),
    [],
  );

  const gridLayer = new GridCellLayer<TransformedData>({
    id: "grid",
    data: transformedData,
    getPosition: (d) => new Float32Array(d.position),
    cellSize: 20,
    getElevation: (d) => d.ridership,
    getFillColor: (d) => [255, 255, 255, 255],
    extruded: true,
    elevationScale: 1,
  });

  const heatmapLayer = new HeatmapLayer<TransformedData>({
    id: "heatmap",
    radiusPixels: 40,
    data: transformedData,
    getPosition: (d) => new Float32Array(d.position),
    getWeight: (d) => d.ridership,
    colorRange: [
      [255, 255, 255, 240],
      [150, 150, 150, 200],
      [120, 120, 120, 160],
      [100, 100, 100, 150],
      [80, 80, 80, 100],
      [0, 0, 0, 0],
    ],
    debounceTimeout: 250,
    intensity: 0.05,
    threshold: 0.01,
  });

  const generalInfo = useMemo(() => {
    if (!alerts)
      return {
        selectedDay: timeMin,
        totalAlertCount: null,
        influencedRidership: null,
      };

    const totalAlertCount = alerts?.length;

    const influencedRidership = riderShipInfluenced!.reduce(
      (acc, r) => acc + r.ridership,
      0,
    );

    return {
      selectedDay: timeMin,
      totalAlertCount,
      influencedRidership,
    };
  }, [alerts, timeMin]);

  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (!isLoading && isPlaying) {
      const updateDay = () => {
        setSelectedDay((prevDay) => {
          if (prevDay < CALCULATED_DAY_COUNT) {
            return prevDay + 1;
          } else {
            if (intervalId) {
              clearInterval(intervalId);
            }
            setIsPlaying(false);
            return prevDay;
          }
        });
      };

      intervalId = setInterval(updateDay, RECORD_INTERVAL_MS);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isLoading, isPlaying]);

  const handlePlayButtonClick = () => {
    setIsPlaying(true);
  };

  const layers: LayersList | undefined = [gridLayer, heatmapLayer];
  return (
    <main
      className={cn(
        "flex min-h-screen flex-col items-center justify-center text-white",
        !RECORD_MODE &&
          "bg-gradient-to-b from-[#000000] via-[#222222] to-[#000000]",
        RECORD_MODE && "bg-green-500",
      )}
    >
      <div className="convex-sm fixed bottom-0 left-0 right-0 z-10 mx-2 my-2 flex flex-col rounded-lg bg-background px-4 py-2 pt-3">
        <Slider
          showTooltip
          className="my-2"
          interval={1}
          min={0}
          max={CALCULATED_DAY_COUNT}
          value={[selectedDay]}
          onValueCommit={(value) => {
            setSelectedDay(value[0]!);
          }}
          tooltipFormatter={(value) =>
            formatDate(addDays(OVERALL_MIN_DATE, value))
          }
        ></Slider>
        <div className="flex w-full justify-between text-sm text-foreground">
          <span>{formatDate(OVERALL_MIN_DATE)}</span>
          <span>
            {formatDate(
              addDays(OVERALL_MIN_DATE, Math.floor(CALCULATED_DAY_COUNT / 2)),
            )}
          </span>
          <span>{formatDate(OVERALL_MAX_DATE)}</span>
        </div>
      </div>
      <div className="convex fixed left-0 top-0 z-10 m-4 w-72 rounded-lg bg-background bg-opacity-50 p-4 text-white">
        <h1
          className="font-serif text-2xl"
          style={{
            fontStretch: "condensed",
          }}
        >
          MTA Subway Alert Influence
        </h1>
        <Separator className="my-2" />
        <section className="flex flex-col gap-y-0">
          <h2 className="flex items-center justify-between gap-x-1">
            <div>Date</div>
            <span className="font-semibold">
              {formatDate(generalInfo.selectedDay)}
            </span>
          </h2>
          <h2 className="flex items-center justify-between gap-x-1">
            <div>Weekday</div>
            <span className="font-semibold">
              {generalInfo.selectedDay.toLocaleDateString("en-US", {
                weekday: "long",
              })}
            </span>
          </h2>
          <h3 className="flex items-center justify-between gap-x-1">
            <div>Total Riders</div>
            <span className="font-semibold">
              {totalRidershipOfTheTimePeriod}
            </span>
          </h3>
          <Separator className="my-2" />

          <h3 className="flex items-center justify-between gap-x-1">
            <div>Alerts</div>
            <span className="font-semibold">{generalInfo.totalAlertCount}</span>
          </h3>

          <h3 className="flex items-center justify-between gap-x-1">
            <div>Influenced Riders</div>
            <span className="font-semibold">
              {generalInfo.influencedRidership}
            </span>
          </h3>
          <h3 className="flex items-center justify-between gap-x-1">
            <div>Influence Ratio</div>
            <span className="font-semibold">
              {generalInfo?.influencedRidership && totalRidershipOfTheTimePeriod
                ? (
                    (generalInfo.influencedRidership /
                      totalRidershipOfTheTimePeriod) *
                    100
                  ).toFixed(2) + "%"
                : ""}
            </span>
          </h3>
        </section>
        <Separator className={cn("my-2", RECORD_MODE && "hidden")} />
        <section className={cn(RECORD_MODE && "hidden")}>
          <p className="text-xs text-muted-foreground">
            Riders Influenced is estimated by counting riders at stations with
            disrupted lines within 30 minutes of any relevant alert.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            The actual number of riders influenced is lower because not all
            stops along a disrupted line are necessarily affected.
          </p>
        </section>
      </div>

      <div
        className={cn(
          "fixed right-0 top-0 z-10 mx-2 my-2 flex flex-col rounded-lg px-4 py-2 pt-3",
          !RECORD_MODE && "hidden",
          isPlaying && "hidden",
        )}
      >
        <Button onClick={handlePlayButtonClick}>
          {isPlaying ? "Pause" : "Play"}
        </Button>
      </div>
      <div
        className={cn(
          cn(
            !RECORD_MODE &&
              isLoading &&
              "pointer-event-none animate-pulse !cursor-wait",
          ),
          RECORD_MODE && isLoading && "pointer-event-none hidden",
        )}
      >
        <DeckGL
          initialViewState={initialView}
          controller={{
            doubleClickZoom: true,
            dragMode: "rotate",
          }}
          layers={layers}
          onViewStateChange={({ viewState }) => {
            const constrainedViewState = applyViewStateConstraints(
              viewState as unknown as MapViewState,
            );
            setViewState(constrainedViewState);
            void setMapViewStateParams({
              latitude: constrainedViewState.latitude,
              longitude: constrainedViewState.longitude,
              zoom: constrainedViewState.zoom,
              pitch: constrainedViewState.pitch,
              bearing: constrainedViewState.bearing,
            });
            return constrainedViewState as typeof viewState;
          }}
          getCursor={({ isDragging }) => "grab"}
          pickingRadius={10}
        >
          <Map mapStyle={cartoStyles.darkMatterNoLabels}></Map>
        </DeckGL>
      </div>
    </main>
  );
}
