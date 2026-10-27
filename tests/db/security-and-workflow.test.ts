import { beforeEach, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { asUser, createDb, makeAdmin, signUp } from './harness'

// ---- helpers ---------------------------------------------------------------
const iso = (d: Date) => d.toISOString().slice(0, 10)
/** A Monday at least `weeksAhead` weeks in the future (so dates are never "in the past"). */
function monday(weeksAhead: number): Date {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + weeksAhead * 7)
  d.setUTCDate(d.getUTCDate() + ((8 - d.getUTCDay()) % 7 || 7))
  return d
}
const plus = (d: Date, n: number) => new Date(d.getTime() + n * 86400000)

async function failsWith(p: Promise<unknown>, code: string) {
  await expect(p).rejects.toMatchObject({ code })
}
async function failsPermission(p: Promise<unknown>) {
  await expect(p).rejects.toThrow(/permission denied|row-level security/i)
}

describe('security and leave workflow (real migrations on PostgreSQL)', () => {
  let db: PGlite
  let alice: string, bob: string, admin: string

  const submit = (uid: string, type: string, s: Date, e: Date, reason = 'Family event') =>
    asUser(db, uid, () =>
      db.query<{ id: string; total_days: string; status: string }>(
        `select * from public.submit_leave_request($1::public.leave_type, $2::date, $3::date, $4)`,
        [type, iso(s), iso(e), reason]))
  const balance = async (uid: string, type: string) =>
    (await db.query<{ used_days: string; available_days: string; total_days: string }>(
      `select total_days, used_days, available_days from public.leave_balances where employee_id=$1 and leave_type=$2`,
      [uid, type])).rows[0]
  const review = (uid: string, id: string, decision: string, comment: string | null = null) =>
    asUser(db, uid, () =>
      db.query(`select * from public.review_leave_request($1::uuid, $2, $3)`, [id, decision, comment]))

  beforeEach(async () => {
    db = await createDb()
    alice = await signUp(db, 'alice@example.com', 'Alice')
    bob = await signUp(db, 'bob@example.com', 'Bob')
    admin = await signUp(db, 'admin@example.com', 'Admin')
    await makeAdmin(db, admin)
  })

  describe('data isolation and privilege escalation', () => {
    it('employees only see their own profile, balances and requests', async () => {
      await submit(bob, 'casual', monday(3), monday(3))
      const profiles = await asUser(db, alice, () => db.query('select id from public.profiles'))
      expect(profiles.rows).toEqual([{ id: alice }])
      const balances = await asUser(db, alice, () => db.query('select employee_id from public.leave_balances'))
      expect(new Set(balances.rows.map((r: any) => r.employee_id))).toEqual(new Set([alice]))
      const reqs = await asUser(db, alice, () => db.query('select id from public.leave_requests'))
      expect(reqs.rows).toHaveLength(0)
    })

    it('admins can read everyone', async () => {
      const r = await asUser(db, admin, () => db.query('select id from public.profiles'))
      expect(r.rows).toHaveLength(3)
    })

    it('anonymous users can read nothing and call nothing', async () => {
      await failsPermission(asUser(db, null, () => db.query('select * from public.profiles')))
      await failsPermission(asUser(db, null, () => db.query(`select public.admin_dashboard_stats()`)))
    })

    it('an employee cannot promote themselves to admin', async () => {
      await failsPermission(asUser(db, alice, () => db.query(`update public.profiles set role='admin' where id=$1`, [alice])))
      await failsPermission(asUser(db, alice, () => db.query(`update public.user_roles set role='admin' where user_id=$1`, [alice])))
      await failsPermission(asUser(db, alice, () => db.query(`insert into public.user_roles(user_id, role) values ($1,'admin')`, [alice])))
      const role = await db.query(`select public.is_admin() as a`)
      expect(role.rows[0]).toBeTruthy()
      const r = await asUser(db, alice, () => db.query(`select public.is_admin() as a`))
      expect((r.rows[0] as any).a).toBe(false)
    })

    it('an employee cannot write requests or balances directly', async () => {
      await failsPermission(asUser(db, alice, () => db.query(
        `insert into public.leave_requests(employee_id,leave_type,start_date,end_date,total_days,reason,status)
         values ($1,'casual','2030-01-07','2030-01-07',1,'sneaky','approved')`, [alice])))
      await failsPermission(asUser(db, alice, () => db.query(
        `update public.leave_balances set total_days=999 where employee_id=$1`, [alice])))
    })

    it('an employee cannot call admin functions', async () => {
      const r = await submit(alice, 'casual', monday(3), monday(3))
      await failsWith(review(alice, r.rows[0].id, 'approved'), 'LM004')
      await failsWith(asUser(db, alice, () => db.query(`select * from public.adjust_leave_balance($1::uuid,'casual',50,'because')`, [alice])), 'LM004')
      await failsWith(asUser(db, alice, () => db.query(`select public.admin_dashboard_stats()`)), 'LM004')
    })

    it('audit tables are admin-only', async () => {
      await failsPermission(asUser(db, null, () => db.query('select * from public.audit_log')))
      const r = await asUser(db, alice, () => db.query('select * from public.audit_log'))
      expect(r.rows).toHaveLength(0)
    })
  })

  describe('submitting leave', () => {
    it('creates a PENDING request and does not touch the balance', async () => {
      const r = await submit(alice, 'casual', monday(3), plus(monday(3), 4)) // Mon-Fri
      expect(r.rows[0].status).toBe('pending')
      expect(Number(r.rows[0].total_days)).toBe(5)
      expect(Number((await balance(alice, 'casual')).used_days)).toBe(0)
    })

    it('excludes weekends by default (Mon-Sun = 5 working days)', async () => {
      const r = await submit(alice, 'casual', monday(3), plus(monday(3), 6))
      expect(Number(r.rows[0].total_days)).toBe(5)
    })

    it('excludes configured public holidays', async () => {
      const m = monday(4)
      await db.query(`insert into public.holidays values ($1,'Test holiday')`, [iso(plus(m, 2))])
      const r = await submit(alice, 'casual', m, plus(m, 4))
      expect(Number(r.rows[0].total_days)).toBe(4)
    })

    it('counts weekends when the policy says so', async () => {
      await db.query(`update public.leave_settings set exclude_weekends=false`)
      const r = await submit(alice, 'casual', monday(3), plus(monday(3), 6))
      expect(Number(r.rows[0].total_days)).toBe(7)
    })

    it('rejects end < start, past dates, weekend-only ranges and short reasons', async () => {
      await failsWith(submit(alice, 'casual', plus(monday(3), 2), monday(3)), 'LM001')
      await failsWith(submit(alice, 'casual', plus(new Date(), -10), plus(new Date(), -9)), 'LM001')
      await failsWith(submit(alice, 'casual', plus(monday(3), 5), plus(monday(3), 6)), 'LM001')
      await failsWith(submit(alice, 'casual', monday(3), monday(3), 'x'), 'LM001')
    })

    it('allows sick leave to be back-dated within the configured window only', async () => {
      const d = new Date()
      await db.query(`update public.leave_settings set exclude_weekends=false`)
      await submit(alice, 'sick', plus(d, -3), plus(d, -3))
      await failsWith(submit(alice, 'sick', plus(d, -30), plus(d, -30)), 'LM001')
    })

    it('blocks overlapping pending/approved requests but allows them once cancelled', async () => {
      const m = monday(3)
      const first = await submit(alice, 'casual', m, plus(m, 2))
      await failsWith(submit(alice, 'earned', plus(m, 2), plus(m, 3)), 'LM003')
      await asUser(db, alice, () => db.query(`select * from public.cancel_leave_request($1::uuid)`, [first.rows[0].id]))
      await submit(alice, 'earned', plus(m, 2), plus(m, 3)) // now fine
    })

    it('the database itself refuses overlaps even if the function check were bypassed', async () => {
      const m = monday(3)
      await submit(alice, 'casual', m, plus(m, 2))
      await expect(db.query(
        `insert into public.leave_requests(employee_id,leave_type,start_date,end_date,total_days,reason)
         values ($1,'casual',$2,$3,1,'direct insert')`, [alice, iso(plus(m, 1)), iso(plus(m, 1))],
      )).rejects.toMatchObject({ code: '23P01' })
    })

    it('rejects requests that exceed the available balance', async () => {
      // casual = 12 days; Mon of week 3 .. Fri of week 5 = 15 working days
      await failsWith(submit(alice, 'casual', monday(3), plus(monday(3), 18)), 'LM002')
    })
  })

  describe('approval, rejection and balances', () => {
    it('approve deducts exactly once and records the reviewer', async () => {
      const r = await submit(alice, 'casual', monday(3), plus(monday(3), 2)) // 3 days
      const id = r.rows[0].id
      await review(admin, id, 'approved', 'Enjoy')
      const b = await balance(alice, 'casual')
      expect(Number(b.used_days)).toBe(3)
      expect(Number(b.available_days)).toBe(9)
      const row = (await db.query<any>(`select status, reviewed_by, admin_comment, balance_deducted from public.leave_requests where id=$1`, [id])).rows[0]
      expect(row).toEqual({ status: 'approved', reviewed_by: admin, admin_comment: 'Enjoy', balance_deducted: true })
    })

    it('a second approval (or a reject after approve) cannot deduct twice', async () => {
      const r = await submit(alice, 'casual', monday(3), plus(monday(3), 2))
      await review(admin, r.rows[0].id, 'approved')
      await failsWith(review(admin, r.rows[0].id, 'approved'), 'LM005')
      await failsWith(review(admin, r.rows[0].id, 'rejected'), 'LM005')
      expect(Number((await balance(alice, 'casual')).used_days)).toBe(3)
    })

    it('reject leaves the balance untouched', async () => {
      const r = await submit(alice, 'casual', monday(3), plus(monday(3), 2))
      await review(admin, r.rows[0].id, 'rejected', 'Busy period')
      expect(Number((await balance(alice, 'casual')).used_days)).toBe(0)
    })

    it('refuses approval that would break balance rules', async () => {
      const a = await submit(alice, 'casual', monday(3), plus(monday(3), 4)) // 5 days
      const b = await submit(alice, 'casual', monday(4), plus(monday(4), 4)) // 5 days (both ok when pending)
      const c = await submit(alice, 'casual', monday(5), plus(monday(5), 4)) // 5 days
      await review(admin, a.rows[0].id, 'approved')
      await review(admin, b.rows[0].id, 'approved')
      await failsWith(review(admin, c.rows[0].id, 'approved'), 'LM002') // only 2 left
      expect(Number((await balance(alice, 'casual')).used_days)).toBe(10)
    })

    it('an admin cannot review their own request', async () => {
      const r = await submit(admin, 'casual', monday(3), monday(3))
      await failsWith(review(admin, r.rows[0].id, 'approved'), 'LM004')
    })

    it('rejects invalid decisions', async () => {
      const r = await submit(alice, 'casual', monday(3), monday(3))
      await failsWith(review(admin, r.rows[0].id, 'maybe'), 'LM001')
    })
  })

  describe('cancellation', () => {
    it('cancelling a pending request never touches the balance', async () => {
      const r = await submit(alice, 'casual', monday(3), plus(monday(3), 1))
      await asUser(db, alice, () => db.query(`select * from public.cancel_leave_request($1::uuid)`, [r.rows[0].id]))
      expect(Number((await balance(alice, 'casual')).used_days)).toBe(0)
    })

    it('cancelling a future approved request reverses the deduction exactly once', async () => {
      const r = await submit(alice, 'casual', monday(3), plus(monday(3), 2))
      await review(admin, r.rows[0].id, 'approved')
      await asUser(db, alice, () => db.query(`select * from public.cancel_leave_request($1::uuid)`, [r.rows[0].id]))
      expect(Number((await balance(alice, 'casual')).used_days)).toBe(0)
      await failsWith(asUser(db, alice, () => db.query(`select * from public.cancel_leave_request($1::uuid)`, [r.rows[0].id])), 'LM005')
      expect(Number((await balance(alice, 'casual')).used_days)).toBe(0)
    })

    it('approved leave that has started cannot be cancelled', async () => {
      const today = new Date()
      await db.query(`update public.leave_settings set exclude_weekends=false`)
      const r = await submit(alice, 'sick', today, today)
      await review(admin, r.rows[0].id, 'approved')
      await failsWith(asUser(db, alice, () => db.query(`select * from public.cancel_leave_request($1::uuid)`, [r.rows[0].id])), 'LM005')
    })

    it("an employee cannot cancel someone else's request", async () => {
      const r = await submit(alice, 'casual', monday(3), monday(3))
      await failsWith(asUser(db, bob, () => db.query(`select * from public.cancel_leave_request($1::uuid)`, [r.rows[0].id])), 'LM006')
    })
  })

  describe('balance adjustment and statistics', () => {
    it('admin adjusts a total, and the change is audited', async () => {
      await asUser(db, admin, () => db.query(`select * from public.adjust_leave_balance($1::uuid,'casual',20,'Carry-over granted')`, [alice]))
      expect(Number((await balance(alice, 'casual')).total_days)).toBe(20)
      const a = await asUser(db, admin, () => db.query(`select old_total, new_total, adjusted_by from public.balance_adjustments`))
      expect(a.rows).toEqual([{ old_total: '12.0', new_total: '20.0', adjusted_by: admin }])
    })

    it('cannot reduce the total below days already used', async () => {
      const r = await submit(alice, 'casual', monday(3), plus(monday(3), 2))
      await review(admin, r.rows[0].id, 'approved')
      await failsWith(asUser(db, admin, () => db.query(`select * from public.adjust_leave_balance($1::uuid,'casual',2,'too low')`, [alice])), 'LM002')
    })

    it('admin stats reflect real data', async () => {
      const r = await submit(alice, 'casual', monday(3), monday(3))
      await submit(bob, 'sick', monday(3), monday(3))
      await review(admin, r.rows[0].id, 'approved')
      const s = await asUser(db, admin, () => db.query<{ s: any }>(`select public.admin_dashboard_stats() as s`))
      const stats = s.rows[0].s
      expect(stats.total_employees).toBe(2)
      expect(stats.requests).toMatchObject({ total: 2, pending: 1, approved: 1 })
      expect(stats.by_type).toHaveLength(3)
      expect(stats.monthly).toHaveLength(6)
    })
  })
})
