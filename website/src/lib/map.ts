import { type MapViewState } from "@deck.gl/core";
import { degToRad } from "./utils";

export const mapboxStyles = {
  latest: "mapbox://styles/yfz/cls6xlo9z02b201qs6j79bkyq",
};

export const cartoStyles = {
  darkMatter:
    "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  lightMatter: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  positron: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  darkMatterNoLabels:
    "https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json",
};

export const DEFAULT_INITIAL_VIEW_STATE = {
  longitude: -73.9422,
  latitude: 40.7294,
  zoom: 11,
  pitch: 59,
  bearing: -21,
  minZoom: 9,
};

// m_pt=59&m_bn=-21&m_lat=40.7294&m_lng=-73.9422&m_zm=11

export const NYC_BOUNDS = {
  maxLatitude: 40.917577,
  minLatitude: 40.477399,
  maxLongitude: -73.700009,
  minLongitude: -74.25909,
};

type Coordinate = {
  latitude: number;
  longitude: number;
};

export function distanceBetweenCoords(
  coord1: Coordinate,
  coord2: Coordinate,
): number {
  const R = 6371; // Earth's radius in kilometers

  const dLat = degToRad(coord2.latitude - coord1.latitude);
  const dLon = degToRad(coord2.longitude - coord1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degToRad(coord1.latitude)) *
      Math.cos(degToRad(coord2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;

  return distance;
}

export function getCoordsBounds(coords: Coordinate[]): {
  minLongitude: number;
  minLatitude: number;
  maxLongitude: number;
  maxLatitude: number;
  center: Coordinate;
} {
  const bounds = coords.reduce(
    (acc, c) => {
      acc[0][0] = Math.min(acc[0][0], c.longitude);
      acc[0][1] = Math.min(acc[0][1], c.latitude);
      acc[1][0] = Math.max(acc[1][0], c.longitude);
      acc[1][1] = Math.max(acc[1][1], c.latitude);
      return acc;
    },
    [
      [Number.MAX_VALUE, Number.MAX_VALUE],
      [-Number.MAX_VALUE, -Number.MAX_VALUE],
    ] as [[number, number], [number, number]],
  );

  return {
    minLongitude: bounds[0][0],
    minLatitude: bounds[0][1],
    maxLongitude: bounds[1][0],
    maxLatitude: bounds[1][1],
    center: {
      longitude: (bounds[0][0] + bounds[1][0]) / 2,
      latitude: (bounds[0][1] + bounds[1][1]) / 2,
    },
  };
}
