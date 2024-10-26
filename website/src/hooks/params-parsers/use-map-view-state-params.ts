"use client";

import { DEFAULT_INITIAL_VIEW_STATE } from "@/lib/map";
import {
  parseAsInteger,
  parseAsString,
  useQueryStates,
  parseAsStringEnum,
  createSerializer,
  parseAsIsoDateTime,
  parseAsArrayOf,
  parseAsFloat,
  createParser,
} from "nuqs";

const THROTTLING_MS = 1000;

const parseFloatFixedPrecision = (precision: number) =>
  createParser({
    parse(queryValue) {
      return parseFloat(queryValue);
    },
    serialize(value) {
      return value.toFixed(precision);
    },
  });

const MAP_VIEW_STATE = {
  longitude: parseFloatFixedPrecision(4)
    .withDefault(DEFAULT_INITIAL_VIEW_STATE.longitude)
    .withOptions({
      clearOnDefault: true,
      throttleMs: THROTTLING_MS,
      shallow: true,
    }),
  latitude: parseFloatFixedPrecision(4)
    .withDefault(DEFAULT_INITIAL_VIEW_STATE.latitude)
    .withOptions({
      clearOnDefault: true,
      throttleMs: THROTTLING_MS,
      shallow: true,
    }),
  zoom: parseFloatFixedPrecision(0)
    .withDefault(DEFAULT_INITIAL_VIEW_STATE.zoom)
    .withOptions({
      clearOnDefault: true,
      throttleMs: THROTTLING_MS,
      shallow: true,
    }),
  pitch: parseFloatFixedPrecision(0)
    .withDefault(DEFAULT_INITIAL_VIEW_STATE.pitch)
    .withOptions({
      clearOnDefault: true,
      throttleMs: THROTTLING_MS,
      shallow: true,
    }),
  bearing: parseFloatFixedPrecision(0)
    .withDefault(DEFAULT_INITIAL_VIEW_STATE.bearing)
    .withOptions({
      clearOnDefault: true,
      throttleMs: THROTTLING_MS,
      shallow: true,
    }),
  minZoom: parseAsInteger
    .withDefault(DEFAULT_INITIAL_VIEW_STATE.minZoom)
    .withOptions({
      clearOnDefault: true,
      shallow: true,
    }),
};

export const URL_KEYS = {
  longitude: "m_lng",
  latitude: "m_lat",
  zoom: "m_zm",
  pitch: "m_pt",
  bearing: "m_bn",
  minZoom: "m_mz",
};

export function useMapViewStateParams() {
  return useQueryStates(MAP_VIEW_STATE, {
    urlKeys: URL_KEYS,
  });
}

const defaultSerializer = createSerializer(MAP_VIEW_STATE); // this serializer will use the original keys

// serialize the parsed search params to a query string
// this serializer will use the shorter URL_KEYS
export const serializeParsedParams = (
  mapViewStateParams: ReturnType<typeof useMapViewStateParams>[0],
) => {
  const queryString = defaultSerializer(mapViewStateParams);

  // parse the query string back to the object
  const parsed = new URLSearchParams(queryString);

  // replace the keys with the URL_KEYS
  const replaced = new URLSearchParams();
  for (const [key, value] of parsed.entries()) {
    const newKey = URL_KEYS[key as keyof typeof URL_KEYS];
    replaced.set(newKey, value);
  }

  return "?" + replaced.toString();
};
