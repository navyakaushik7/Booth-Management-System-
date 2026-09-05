import { Router } from 'express';
import { query, pool } from '../db.js';
import { requireAuth, resolveWardScope } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

/** GET /api/voters?search=&ageGroup=&booth_id=&scheme_id=&has_voted= */
router.get('/', async (req, res) => {
  const wardId = resolveWardScope(req);
  const { search, ageGroup, booth_id, scheme_id, has_voted } = req.query;

  const clauses = [];
  const params = [];

  if (wardId) {
    params.push(wardId);
    clauses.push(`v.ward_id = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    clauses.push(`(v.name ILIKE $${params.length} OR v.voter_card_id ILIKE $${params.length})`);
  }
  if (booth_id) {
    params.push(parseInt(booth_id, 10));
    clauses.push(`v.booth_id = $${params.length}`);
  }
  if (scheme_id) {
    params.push(parseInt(scheme_id, 10));
    clauses.push(`v.scheme_id = $${params.length}`);
  }
  if (has_voted === 'true' || has_voted === 'false') {
    params.push(has_voted === 'true');
    clauses.push(`v.has_voted = $${params.length}`);
  }
  if (ageGroup) {
    const ranges = { '18-25': [18, 25], '26-35': [26, 35], '36-45': [36, 45], '46-60': [46, 60], '60+': [61, 150] };
    const range = ranges[ageGroup];
    if (range) {
      params.push(range[0], range[1]);
      clauses.push(`v.age BETWEEN $${params.length - 1} AND $${params.length}`);
    }
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const { rows } = await query(
    `SELECT v.*, b.name AS booth_name, s.name AS scheme_name
     FROM voters v
     LEFT JOIN booths b ON b.id = v.booth_id
     LEFT JOIN schemes s ON s.id = v.scheme_id
     ${where}
     ORDER BY v.created_at DESC`,
    params
  );
  res.json(rows);
});

/** POST /api/voters — create, with duplicate detection on (ward_id, voter_card_id) */
router.post('/', async (req, res) => {
  const wardId = req.user.role === 'admin' ? req.body.ward_id : req.user.wardId;
  if (!wardId) return res.status(400).json({ error: 'ward_id is required' });

  const { voter_card_id, name, age, gender, phone, address, has_voted, booth_id, scheme_id } = req.body;
  if (!voter_card_id || !name || !age) {
    return res.status(400).json({ error: 'voter_card_id, name and age are required' });
  }

  try {
    const { rows } = await query(
      `INSERT INTO voters (voter_card_id, name, age, gender, phone, address, has_voted, ward_id, booth_id, scheme_id, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [voter_card_id, name, age, gender || 'Male', phone || null, address || null,
       has_voted || false, wardId, booth_id || null, scheme_id || null, req.user.id]
    );
    await query(
      `INSERT INTO activity_log (user_id, action, entity, entity_id, ward_id, details) VALUES ($1,'create','voter',$2,$3,$4)`,
      [req.user.id, rows[0].id, wardId, JSON.stringify({ voter_card_id })]
    );
    req.app.get('io')?.to(`ward-${wardId}`).emit('voter:created', rows[0]);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      // unique_violation — duplicate detection triggered
      return res.status(409).json({ error: `Voter card ID "${voter_card_id}" already exists in this ward.` });
    }
    res.status(500).json({ error: 'Failed to create voter' });
  }
});

/** PUT /api/voters/:id */
router.put('/:id', async (req, res) => {
  const wardId = resolveWardScope(req);
  const { name, age, gender, phone, address, has_voted, booth_id, scheme_id } = req.body;

  const clauses = [`ward_id = ward_id`]; // placeholder, replaced below
  const params = [];
  const setParts = [];
  const push = (col, val) => { params.push(val); setParts.push(`${col} = $${params.length}`); };

  if (name !== undefined) push('name', name);
  if (age !== undefined) push('age', age);
  if (gender !== undefined) push('gender', gender);
  if (phone !== undefined) push('phone', phone);
  if (address !== undefined) push('address', address);
  if (has_voted !== undefined) push('has_voted', has_voted);
  if (booth_id !== undefined) push('booth_id', booth_id);
  if (scheme_id !== undefined) push('scheme_id', scheme_id);

  if (setParts.length === 0) return res.status(400).json({ error: 'No fields to update' });

  params.push(req.params.id);
  let sql = `UPDATE voters SET ${setParts.join(', ')} WHERE id = $${params.length}`;
  if (wardId) {
    params.push(wardId);
    sql += ` AND ward_id = $${params.length}`;
  }
  sql += ' RETURNING *';

  const { rows } = await query(sql, params);
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Voter not found in your ward' });
  }
  await query(
    `INSERT INTO activity_log (user_id, action, entity, entity_id, ward_id) VALUES ($1,'update','voter',$2,$3)`,
    [req.user.id, rows[0].id, rows[0].ward_id]
  );
  req.app.get('io')?.to(`ward-${rows[0].ward_id}`).emit('voter:updated', rows[0]);
  res.json(rows[0]);
});

/** DELETE /api/voters/:id */
router.delete('/:id', async (req, res) => {
  const wardId = resolveWardScope(req);
  const params = [req.params.id];
  let sql = 'DELETE FROM voters WHERE id = $1';
  if (wardId) {
    params.push(wardId);
    sql += ' AND ward_id = $2';
  }
  sql += ' RETURNING id, ward_id';

  const { rows } = await query(sql, params);
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Voter not found in your ward' });
  }
  await query(
    `INSERT INTO activity_log (user_id, action, entity, entity_id, ward_id) VALUES ($1,'delete','voter',$2,$3)`,
    [req.user.id, rows[0].id, rows[0].ward_id]
  );
  req.app.get('io')?.to(`ward-${rows[0].ward_id}`).emit('voter:deleted', { id: rows[0].id });
  res.json({ success: true });
});

/**
 * POST /api/voters/bulk-import
 * body: { rows: [{voter_card_id, name, age, gender, phone, address, has_voted, ward_name, booth_name, scheme_name}, ...], ward_id? }
 * Used by the Excel import feature.
 *
 * Two modes:
 *  - ward_id provided: every row is imported into that one ward (booth_name/
 *    scheme_name resolved within it). Used by MLA users, or an admin who
 *    picked a specific ward.
 *  - ward_id omitted (admin only): each row's own `ward_name` decides which
 *    ward it belongs to. Unknown ward names are created automatically, so a
 *    single spreadsheet covering the whole constituency can be imported in
 *    one go. Booths/schemes are resolved (and created if missing) per-ward.
 */
router.post('/bulk-import', async (req, res) => {
  const rows = Array.isArray(req.body.rows) ? req.body.rows : [];
  if (rows.length === 0) return res.status(400).json({ error: 'No rows to import' });

  const fixedWardId = req.user.role === 'admin' ? (req.body.ward_id || null) : req.user.wardId;
  if (!fixedWardId && req.user.role !== 'admin') {
    return res.status(400).json({ error: 'ward_id is required' });
  }
  // Non-admin, single-ward mode still needs it explicitly.
  if (!fixedWardId && req.user.role === 'admin') {
    const missingWardName = rows.some((r) => !String(r.ward_name || '').trim());
    if (missingWardName) {
      return res.status(400).json({
        error: 'No ward selected, and some rows are missing a "Ward / Locality" value to auto-assign one.'
      });
    }
  }

  const wardCache = new Map();   // ward name (lowercase) -> ward id
  const boothCache = new Map();  // `${wardId}:boothName` -> booth id
  const schemeCache = new Map(); // `${wardId}:schemeName` -> scheme id

  async function resolveWardId(client, wardName) {
    const key = String(wardName).trim().toLowerCase();
    if (wardCache.has(key)) return wardCache.get(key);
    const existing = await client.query('SELECT id FROM wards WHERE LOWER(name) = $1', [key]);
    let id;
    if (existing.rows.length > 0) {
      id = existing.rows[0].id;
    } else {
      const inserted = await client.query(
        'INSERT INTO wards (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
        [String(wardName).trim()]
      );
      id = inserted.rows[0].id;
    }
    wardCache.set(key, id);
    return id;
  }

  async function resolveBoothId(client, wardId, boothName) {
    if (!boothName) return null;
    const key = `${wardId}:${String(boothName).trim().toLowerCase()}`;
    if (boothCache.has(key)) return boothCache.get(key);
    const existing = await client.query(
      'SELECT id FROM booths WHERE ward_id = $1 AND LOWER(name) = $2',
      [wardId, String(boothName).trim().toLowerCase()]
    );
    let id;
    if (existing.rows.length > 0) {
      id = existing.rows[0].id;
    } else {
      const inserted = await client.query(
        'INSERT INTO booths (name, ward_id) VALUES ($1, $2) RETURNING id',
        [String(boothName).trim(), wardId]
      );
      id = inserted.rows[0].id;
    }
    boothCache.set(key, id);
    return id;
  }

  async function resolveSchemeId(client, wardId, schemeName) {
    if (!schemeName) return null;
    // Multiple schemes can be comma-separated in the sheet; store just the first for now.
    const first = String(schemeName).split(',')[0].trim();
    if (!first) return null;
    const key = `${wardId}:${first.toLowerCase()}`;
    if (schemeCache.has(key)) return schemeCache.get(key);
    const existing = await client.query(
      'SELECT id FROM schemes WHERE ward_id = $1 AND LOWER(name) = $2',
      [wardId, first.toLowerCase()]
    );
    let id;
    if (existing.rows.length > 0) {
      id = existing.rows[0].id;
    } else {
      const inserted = await client.query(
        'INSERT INTO schemes (name, category, ward_id) VALUES ($1, $2, $3) RETURNING id',
        [first, 'Default', wardId]
      );
      id = inserted.rows[0].id;
    }
    schemeCache.set(key, id);
    return id;
  }

  const client = await pool.connect();
  const imported = [];
  const skipped = [];
  const touchedWardIds = new Set();

  try {
    await client.query('BEGIN');
    for (const r of rows) {
      if (!r.voter_card_id || !r.name || !r.age) {
        skipped.push({ row: r, reason: 'Missing required field(s)' });
        continue;
      }
      try {
        const wardId = fixedWardId || (await resolveWardId(client, r.ward_name));
        const boothId = await resolveBoothId(client, wardId, r.booth_name);
        const schemeId = await resolveSchemeId(client, wardId, r.scheme_name);
        touchedWardIds.add(wardId);

        const { rows: inserted } = await client.query(
          `INSERT INTO voters (voter_card_id, name, age, gender, phone, address, has_voted, ward_id, booth_id, scheme_id, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
          [
            r.voter_card_id, r.name, parseInt(r.age, 10), r.gender || 'Male', r.phone || null, r.address || null,
            Boolean(r.has_voted), wardId, boothId, schemeId, req.user.id
          ]
        );
        imported.push(inserted[0]);
      } catch (err) {
        if (err.code === '23505') {
          skipped.push({ row: r, reason: `Duplicate voter_card_id "${r.voter_card_id}"` });
        } else {
          skipped.push({ row: r, reason: err.message || 'Insert failed' });
        }
      }
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    return res.status(500).json({ error: 'Bulk import failed' });
  } finally {
    client.release();
  }

  for (const wardId of touchedWardIds) {
    req.app.get('io')?.to(`ward-${wardId}`).emit('voters:bulk-imported', { count: imported.length });
  }
  res.json({ importedCount: imported.length, skippedCount: skipped.length, skipped });
});

export default router;
