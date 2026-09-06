import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth, resolveWardScope } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);
router.get('/overview', async (req, res) => {
  const wardId = resolveWardScope(req);
  const wardFilter = wardId ? 'WHERE ward_id = $1' : '';
  const params = wardId ? [wardId] : [];

  const totals = await query(
    `SELECT
       COUNT(*)::int AS total_voters,
       COUNT(*) FILTER (WHERE has_voted)::int AS voted_count,
       COUNT(*) FILTER (WHERE NOT has_voted)::int AS pending_count
     FROM voters ${wardFilter}`,
    params
  );

  const boothCount = await query(
    `SELECT COUNT(*)::int AS total_booths FROM booths ${wardId ? 'WHERE ward_id = $1' : ''}`,
    params
  );

  const { total_voters, voted_count, pending_count } = totals.rows[0];
  const turnoutPercentage = total_voters > 0 ? Math.round((voted_count / total_voters) * 1000) / 10 : 0;
  const boothStats = await query(
    `SELECT b.name,
            COUNT(v.id) FILTER (WHERE v.has_voted)::int AS voted,
            COUNT(v.id) FILTER (WHERE NOT v.has_voted)::int AS pending
     FROM booths b
     LEFT JOIN voters v ON v.booth_id = b.id
     ${wardId ? 'WHERE b.ward_id = $1' : ''}
     GROUP BY b.ward_id, b.name
     ORDER BY b.name`,
    params
  );

  // Scheme enrolment distribution for the pie chart
  const schemeStats = await query(
    `SELECT s.name, COUNT(v.id)::int AS value
     FROM schemes s
     LEFT JOIN voters v ON v.scheme_id = s.id
     ${wardId ? 'WHERE s.ward_id = $1' : ''}
     GROUP BY s.id, s.name
     HAVING COUNT(v.id) > 0
     ORDER BY value DESC`,
    params
  );

  res.json({
    stats: {
      totalVoters: total_voters,
      votedCount: voted_count,
      pendingCount: pending_count,
      turnoutPercentage,
      totalBooths: boothCount.rows[0].total_booths
    },
    wardStats: boothStats.rows,
    schemeDistribution: schemeStats.rows
  });
});

export default router;