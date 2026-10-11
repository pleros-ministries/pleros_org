/** Explicit, dry-run-first import of the user's confirmed church branch mapping. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
import { Pool } from '@neondatabase/serverless';
const index = process.argv.indexOf('--env-file');
if (index < 0 || !process.argv[index + 1]) throw new Error('Choose an explicit environment file.');
const env = dotenv.parse(fs.readFileSync(process.argv[index + 1]));
const url = env.DATABASE_URL_UNPOOLED ?? env.DATABASE_URL;
const endpoint = new URL(url);
const fingerprint = crypto.createHash('sha256').update(endpoint.hostname.replace('-pooler', '') + endpoint.pathname).digest('hex');
const apply = process.argv.includes('--apply');
if (apply && (process.env.PLEROS_APPROVED_CHURCH_APPOINTMENTS !== 'confirmed-eight-branches' || process.env.PLEROS_ROLLOUT_ENDPOINT_SHA256 !== fingerprint)) throw new Error('Applying requires explicit approval and the dry-run endpoint fingerprint.');
const mapping = [
  { name: 'Daniel Adeyemo', branches: ['Ibadan'] },
  { name: 'Onashile Oluseyi', branches: ['Lagos'] },
  { name: 'Finidi Lawson', branches: ['Ife', 'Osogbo'] },
  { name: 'Oladayo Olagunju', branches: ['Sagamu', 'Calabar'] },
  { name: 'Emmanuel Thomas', branches: ['Abuja'] },
  { name: 'Tola', branches: ['Kwara'] },
];
const pool = new Pool({ connectionString: url });
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query("SET LOCAL lock_timeout='10s'");
  await client.query("SET LOCAL statement_timeout='60s'");
  await client.query("select pg_advisory_xact_lock(hashtextextended('pleros:church-assignments',0))");
  const roots = await client.query("select a.user_id from church_assignments a join users u on u.id=a.user_id where a.role='pastor' and lower(u.email)='akintyr@gmail.com'");
  if (roots.rows.length !== 1) throw new Error('The explicitly appointed Pastor is missing.');
  const pastorId = roots.rows[0].user_id;
  const accounts = await client.query('select id, btrim(name) as name from users where is_pastor=true or role=\'pastor\'');
  const resolved = mapping.map(item => {
    const rows = accounts.rows.filter(row => row.name === item.name);
    if (rows.length !== 1) throw new Error('A confirmed Branch Pastor cannot be matched uniquely.');
    return { ...item, userId: rows[0].id };
  });
  const existing = await client.query("select user_id,role from church_assignments where role<>'pastor'");
  if (existing.rows.some(row => row.role !== 'branch_pastor' || !resolved.some(item => item.userId === row.user_id))) throw new Error('Unexpected existing assignments require review.');
  const geoBefore = await client.query('select md5(coalesce(jsonb_agg(to_jsonb(r) order by to_jsonb(r)::text)::text,\'[]\')) as fingerprint from pastor_regions r');
  const usersBefore = await client.query('select md5(coalesce(jsonb_agg(to_jsonb(u) order by id)::text,\'[]\')) as fingerprint from users u');
  console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', endpointFingerprint: fingerprint, mapping, unitLeaders: 0, workers: 0, testNotifications: 0 }));
  if (!apply) { await client.query('ROLLBACK'); } else {
    for (const item of resolved) {
      const branchIds = [];
      for (const name of item.branches) {
        const rows = await client.query('select id from church_branches where name=$1', [name]);
        if (rows.rows.length > 1) throw new Error('Duplicate branch names require review.');
        const id = rows.rows[0]?.id ?? (await client.query('insert into church_branches(name) values($1) returning id', [name])).rows[0].id;
        branchIds.push(id);
      }
      await client.query("insert into church_assignments(user_id,role,branch_id,unit_id,supervisor_id,assigned_by) values($1,'branch_pastor',$2,null,$3,$3) on conflict(user_id) do update set role='branch_pastor',branch_id=excluded.branch_id,unit_id=null,supervisor_id=excluded.supervisor_id,assigned_by=excluded.assigned_by,updated_at=now()", [item.userId, branchIds[0], pastorId]);
      await client.query('delete from church_branch_pastors where user_id=$1', [item.userId]);
      for (const branchId of branchIds) await client.query('insert into church_branch_pastors(user_id,branch_id) values($1,$2)', [item.userId, branchId]);
    }
    const geoAfter = await client.query('select md5(coalesce(jsonb_agg(to_jsonb(r) order by to_jsonb(r)::text)::text,\'[]\')) as fingerprint from pastor_regions r');
    const usersAfter = await client.query('select md5(coalesce(jsonb_agg(to_jsonb(u) order by id)::text,\'[]\')) as fingerprint from users u');
    if (geoBefore.rows[0].fingerprint !== geoAfter.rows[0].fingerprint || usersBefore.rows[0].fingerprint !== usersAfter.rows[0].fingerprint) throw new Error('Geographic assignments or accounts changed unexpectedly.');
    const engineering = await client.query("select a.user_id from church_assignments a join users u on u.id=a.user_id where btrim(u.name)='Olamide Olutekunbi'");
    if (engineering.rows.length) throw new Error('The engineer must have no church appointment.');
    await client.query('COMMIT');
    console.log(JSON.stringify({ appointedBranchPastors: resolved.length, branchMemberships: resolved.reduce((sum, item) => sum + item.branches.length, 0), accountsAndGeographicRegionsUnchanged: true, testNotificationsSent: 0 }));
  }
} catch (error) { await client.query('ROLLBACK').catch(() => undefined); console.error('Appointment import aborted:', error.code ?? error.message); process.exitCode = 1; }
finally { client.release(); await pool.end(); }
