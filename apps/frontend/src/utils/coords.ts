type LngLat = [number, number];

const toRad = (deg: number) => deg * (Math.PI / 180);
const toDeg = (rad: number) => rad * (180 / Math.PI);

// Given a center [lng, lat], and offsets in kilometers (x east, y north),
// return destination [lng, lat]. Uses great-circle approximation.
export function offsetKmToLngLat(center: LngLat, xKm: number, yKm: number): LngLat {
  const R = 6378137; // Earth radius meters
  const distanceM = Math.sqrt(xKm * xKm + yKm * yKm) * 1000;
  if (distanceM === 0) return center;

  // Bearing: 0 = north, 90 = east. x is east, y is north.
  const bearingRad = Math.atan2(xKm, yKm);
  const θ = bearingRad;

  const φ1 = toRad(center[1]);
  const λ1 = toRad(center[0]);
  const δ = distanceM / R;

  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
  const λ2 = λ1 + Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));

  return [toDeg(λ2), toDeg(φ2)];
}

export function kmOffsetToBearingDistance(xKm: number, yKm: number) {
  const distanceKm = Math.sqrt(xKm * xKm + yKm * yKm);
  const bearingDeg = (Math.atan2(xKm, yKm) * 180) / Math.PI;
  return { distanceKm, bearingDeg };
}
