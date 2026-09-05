import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth, resolveWardScope } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const wardId = resolveWardScope(req);
  const params = [];
  let sql = `SELECT s.*, COUNT(v.id)::int AS enrolled_count
             FROM schemes s LEFT JOIN voters v ON v.scheme_id = s.id`;
  if (wardId) {
    params.push(wardId);
    sql += ` WHERE s.ward_id = $1`;
  }
  sql += ` GROUP BY s.id ORDER BY s.category, s.name`;
  const { rows } = await query(sql, params);
  res.json(rows);
});

router.post('/', async (req, res) => {
  const wardId = req.user.role === 'admin' ? req.body.ward_id : req.user.wardId;
  const { name, category } = req.body;
  if (!name || !category || !wardId) {
    return res.status(400).json({ error: 'name, category and ward_id are required' });
  }
  const { rows } = await query(
    `INSERT INTO schemes (name, category, ward_id) VALUES ($1,$2,$3) RETURNING *`,
    [name, category, wardId]
  );
  res.status(201).json(rows[0]);
});

router.delete('/:id', async (req, res) => {
  const wardId = resolveWardScope(req);
  const params = [req.params.id];
  let sql = 'DELETE FROM schemes WHERE id = $1';
  if (wardId) { params.push(wardId); sql += ' AND ward_id = $2'; }
  const { rowCount } = await query(sql, params);
  if (rowCount === 0) return res.status(404).json({ error: 'Scheme not found in your ward' });
  res.json({ success: true });
});

export default router;
