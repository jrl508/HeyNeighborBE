const zipcodes = require("zipcodes");

/**
 * Lookup zip code and return normalized object { zip, lat, lng }
 * Returns null if not found.
 */
function lookupZip(zip) {
  if (!zip) return null;
  // Accept 5-digit zips or strings with whitespace
  const normalized = String(zip).trim();
  const info = zipcodes.lookup(normalized);

  if (!info) return null;

  return {
    zip: info.zip,
    lat: Number(info.latitude),
    lng: Number(info.longitude),
    city: info.city,
    state: info.state,
  };
}

/**
 * Safe helper to try lookup and throw an Error when invalid.
 */
function requireZipOrThrow(zip) {
  const info = lookupZip(zip);
  if (!info) throw new Error("Invalid ZIP code");
  return info;
}

/**
 * Lookup coordinates and return normalized object { zip, lat, lng, city, state }
 * Returns null if not found.
 */
function lookupCoords(lat, lng) {
  if (lat === undefined || lng === undefined || lat === null || lng === null) return null;
  
  const info = zipcodes.lookupByCoords(Number(lat), Number(lng));
  if (!info) return null;

  return {
    zip: info.zip,
    lat: Number(info.latitude),
    lng: Number(info.longitude),
    city: info.city,
    state: info.state,
  };
}

module.exports = {
  lookupZip,
  requireZipOrThrow,
  lookupCoords,
};


