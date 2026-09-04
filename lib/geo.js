/**
 * Calculate the great circle distance between two points on Earth (in km) using Haversine formula
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
    if (lat1 === null || lat1 === undefined || lon1 === null || lon1 === undefined ||
        lat2 === null || lat2 === undefined || lon2 === null || lon2 === undefined) {
        return 2.5; // Default distance fallback
    }

    const nLat1 = Number(lat1);
    const nLon1 = Number(lon1);
    const nLat2 = Number(lat2);
    const nLon2 = Number(lon2);

    if (isNaN(nLat1) || isNaN(nLon1) || isNaN(nLat2) || isNaN(nLon2)) {
        return 2.5;
    }

    const R = 6371; // Radius of Earth in kilometers
    const dLat = ((nLat2 - nLat1) * Math.PI) / 180;
    const dLon = ((nLon2 - nLon1) * Math.PI) / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((nLat1 * Math.PI) / 180) *
        Math.cos((nLat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;

    return Math.round(d * 10) / 10;
}

/**
 * Parse a string radius like "in 15km", "15km", "15" to number in km
 */
export function parseRadiusKm(radiusStr) {
    if (!radiusStr) return 25;
    const match = String(radiusStr).match(/\d+/);
    return match ? parseInt(match[0], 10) : 25;
}
