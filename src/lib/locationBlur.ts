/**
 * Location Privacy Module
 *
 * Applies a ±500m random blur to donor coordinates before displaying on the map.
 * This prevents anyone from pinpointing a donor's exact home address while keeping
 * distance calculations approximately accurate.
 */

const BLUR_RADIUS_METERS = 500;
const EARTH_RADIUS_METERS = 6_371_000;

/**
 * Apply a random ±500m offset to a lat/lng pair.
 * Uses a uniform distribution within a circle of radius BLUR_RADIUS_METERS.
 */
export function blurLocation(lat: number, lng: number): { lat: number; lng: number } {
  // Random distance (0, 500m) and random angle (0, 2π)
  const r = BLUR_RADIUS_METERS * Math.sqrt(Math.random());
  const theta = Math.random() * 2 * Math.PI;

  // Convert offset to degrees
  const dLat = (r * Math.cos(theta)) / EARTH_RADIUS_METERS * (180 / Math.PI);
  const dLng = (r * Math.sin(theta)) / (EARTH_RADIUS_METERS * Math.cos(lat * Math.PI / 180)) * (180 / Math.PI);

  return {
    lat: lat + dLat,
    lng: lng + dLng,
  };
}

/**
 * Haversine distance between two points in kilometres
 */
export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Check if GPS coordinates are consistent with a named hospital location.
 * Returns true if the user is within 2km of the hospital coordinates.
 */
export function verifyGpsNearHospital(
  userLat: number, userLng: number,
  hospitalLat: number, hospitalLng: number,
  thresholdKm: number = 2
): boolean {
  return haversineDistance(userLat, userLng, hospitalLat, hospitalLng) <= thresholdKm;
}
