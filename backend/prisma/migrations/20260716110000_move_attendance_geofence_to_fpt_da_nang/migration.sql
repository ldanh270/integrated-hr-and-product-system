-- Move only legacy seeded shifts from the Viet-Korea ICT University point
-- to FPT University Da Nang. User-configured geofences remain untouched.
UPDATE "WorkingShift"
SET
  "gpsLat" = 15.967510,
  "gpsLng" = 108.260520
WHERE
  "gpsLat" = 15.975011
  AND "gpsLng" = 108.253215;
