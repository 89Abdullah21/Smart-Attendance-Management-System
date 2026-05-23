const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const GEOFENCE_RADIUS_METERS = Number(process.env.GEOFENCE_RADIUS_METERS) || 50;

/**
 * Helper: Calculates geodesic distance between two GPS coordinates using the Haversine formula.
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} Distance in meters
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // In meters
}

// ── ATTENDANCE MARKING ENDPOINT ──────────────────────────────────────────────
/**
 * POST /api/attendance/mark
 * 
 * Body: { student_id, slot_id, latitude_marked, longitude_marked }
 * Evaluates geofence parameters server-side to prevent client-side coordinate spoofing.
 */
router.post('/mark', authenticateToken, authorizeRoles('student'), async (req, res) => {
  const { student_id, slot_id, latitude_marked, longitude_marked } = req.body;

  if (!student_id || !slot_id || latitude_marked === undefined || longitude_marked === undefined) {
    return res.status(400).json({ message: 'Missing required coordinates or schedule parameters.' });
  }

  try {
    // 1. Fetch scheduled slot coordinates from timetable
    const [slotRows] = await db.query(
      'SELECT slot_id, course_id, room_location, latitude, longitude FROM timetable WHERE slot_id = ?',
      [slot_id]
    );

    if (slotRows.length === 0) {
      return res.status(404).json({ message: 'Target scheduled slot not found.' });
    }

    const slot = slotRows[0];

    // 2. Perform Haversine distance calculations
    const distanceMeters = calculateHaversineDistance(
      Number(latitude_marked),
      Number(longitude_marked),
      Number(slot.latitude),
      Number(slot.longitude)
    );

    const isLocationValid = distanceMeters <= GEOFENCE_RADIUS_METERS;
    const finalStatus = isLocationValid ? 'Present' : 'Absent';

    // 3. Write final record into MySQL
    // ON DUPLICATE KEY UPDATE handles the unique constraint (student_id, slot_id, class_date)
    const insertQuery = `
      INSERT INTO attendance (
        student_id, slot_id, course_id, 
        latitude_marked, longitude_marked, 
        is_location_valid, status, class_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE())
      ON DUPLICATE KEY UPDATE 
        latitude_marked    = VALUES(latitude_marked),
        longitude_marked   = VALUES(longitude_marked),
        is_location_valid  = VALUES(is_location_valid),
        status             = VALUES(status),
        marked_at          = CURRENT_TIMESTAMP
    `;

    const insertValues = [
      student_id,
      slot_id,
      slot.course_id,
      latitude_marked,
      longitude_marked,
      isLocationValid ? 1 : 0,
      finalStatus
    ];

    await db.query(insertQuery, insertValues);

    // 4. Fetch the saved record to return in the response
    const [savedRows] = await db.query(
      'SELECT * FROM attendance WHERE student_id = ? AND slot_id = ? AND class_date = CURDATE()',
      [student_id, slot_id]
    );
    const savedRecord = savedRows[0];

    res.status(200).json({
      attendance: savedRecord,
      distance: Math.round(distanceMeters),
      radiusLimit: GEOFENCE_RADIUS_METERS,
      is_location_valid: isLocationValid,
      status: finalStatus,
      message: isLocationValid
        ? 'Attendance recorded as Present!'
        : `Flagged as Absent: Outside 50-meter Geofence (${Math.round(distanceMeters)}m away).`
    });

  } catch (err) {
    console.error('Attendance Marking Error:', err);
    res.status(500).json({ message: 'Failed to record class check-in. Try again.' });
  }
});

// ── GET VERIFIED ATTENDANCE HISTORY FOR STUDENTS ─────────────────────────────
router.get('/student/history', authenticateToken, authorizeRoles('student'), async (req, res) => {
  try {
    const query = `
      SELECT a.*, c.course_name, t.room_location 
      FROM attendance a
      JOIN courses c ON a.course_id = c.course_id
      JOIN timetable t ON a.slot_id = t.slot_id
      WHERE a.student_id = ?
      ORDER BY a.marked_at DESC
    `;
    const [rows] = await db.query(query, [req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error('History Query Error:', err);
    res.status(500).json({ message: 'Failed to load historical check-ins.' });
  }
});

module.exports = router;
