const { pool } = require('../services_config/db');

const { ApiError, asyncHandler } = require('../middleware/errorHandler');
const { v4: uuidv4 } = require('uuid');

exports.getAllEvents = asyncHandler(async (req, res) => {
  const [events] = await pool.query(`
    SELECT e.*, u.name as created_by_name,
      (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.id) as attendee_count
    FROM events e JOIN users u ON e.created_by = u.id ORDER BY e.event_date ASC
  `);
  res.json({ success: true, data: events });
});

exports.createEvent = asyncHandler(async (req, res) => {
  const { title, description, event_date, location, image_url, max_attendees } = req.body;
  const [result] = await pool.query(
    'INSERT INTO events (title, description, event_date, location, image_url, max_attendees, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [title, description, event_date, location, image_url, max_attendees, req.user.id]
  );
  // Notify all users
  const [users] = await pool.query("SELECT id FROM users WHERE status = 'active' AND id != ?", [req.user.id]);
  if (users.length > 0) {
    const vals = users.map(u => [u.id, 'event', `New Event: ${title}`, `Check out "${title}"!`, '/events']);
    await pool.query('INSERT INTO notifications (user_id, type, title, message, link) VALUES ?', [vals]);
  }
  res.status(201).json({ success: true, id: result.insertId, message: 'Event created' });
});

exports.registerForEvent = asyncHandler(async (req, res) => {
  const eventId = req.params.id;
  const [event] = await pool.query('SELECT * FROM events WHERE id = ?', [eventId]);
  if (event.length === 0) throw new ApiError(404, 'Event not found');
  if (event[0].max_attendees) {
    const [count] = await pool.query('SELECT COUNT(*) as total FROM event_registrations WHERE event_id = ?', [eventId]);
    if (count[0].total >= event[0].max_attendees) throw new ApiError(400, 'Event is full');
  }
  const [existing] = await pool.query('SELECT id FROM event_registrations WHERE event_id = ? AND user_id = ?', [eventId, req.user.id]);
  if (existing.length > 0) throw new ApiError(409, 'Already registered');
  const qrData = `gec-event-${eventId}-${req.user.id}-${uuidv4().slice(0, 8)}`;
  await pool.query('INSERT INTO event_registrations (event_id, user_id, qr_code) VALUES (?, ?, ?)', [eventId, req.user.id, qrData]);
  res.status(201).json({ success: true, message: 'Registered', qr_code: qrData });
});

exports.unregisterFromEvent = asyncHandler(async (req, res) => {
  const [result] = await pool.query('DELETE FROM event_registrations WHERE event_id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (result.affectedRows === 0) throw new ApiError(404, 'Registration not found');
  res.json({ success: true, message: 'Unregistered' });
});

exports.getAttendees = asyncHandler(async (req, res) => {
  const [attendees] = await pool.query(`
    SELECT er.*, u.name, u.email FROM event_registrations er
    JOIN users u ON er.user_id = u.id WHERE er.event_id = ? ORDER BY er.registered_at DESC
  `, [req.params.id]);
  res.json({ success: true, data: attendees });
});

exports.deleteEvent = asyncHandler(async (req, res) => {
  const [event] = await pool.query('SELECT * FROM events WHERE id = ?', [req.params.id]);
  if (event.length === 0) throw new ApiError(404, 'Event not found');
  if (event[0].created_by !== req.user.id && req.user.role !== 'admin') throw new ApiError(403, 'Not authorized');
  await pool.query('DELETE FROM events WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Event deleted' });
});
