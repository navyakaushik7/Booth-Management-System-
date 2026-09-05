import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireAdmin);

/** GET /api/staff — list all accounts with login access (admin only) */
router.get('/', async (req, res) => {
  const { rows } = await query(
    `SELECT u.id, u.name, u.phone, u.role, u.is_active, w.name AS ward_name
     FROM users u LEFT JOIN wards w ON w.id = u.ward_id
     ORDER BY u.role, u.name`
  );
  res.json(rows);
});

/** POST /api/staff — register a new MLA/admin phone number */
router.post('/', async (req, res) => {
  const { name, phone, role, ward_id } = req.body;
  if (!name || !phone || !role) {
    return res.status(400).json({ error: 'name, phone and role are required' });
  }
  try {
    const { rows } = await query(
      `INSERT INTO users (name, phone, role, ward_id) VALUES ($1,$2,$3,$4) RETURNING *`,
      [name, phone, role, ward_id || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'This phone number is already registered.' });
    res.status(500).json({ error: 'Failed to create account' });
  }
});

/** PATCH /api/staff/:id/deactivate */
router.patch('/:id/deactivate', async (req, res) => {
  const { rows } = await query(
    `UPDATE users SET is_active = false WHERE id = $1 RETURNING id`,
    [req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
  res.json({ success: true });
});

export default router;
