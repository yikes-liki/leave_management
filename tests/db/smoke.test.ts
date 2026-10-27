import { describe, it, expect } from 'vitest'
import { createDb, signUp } from './harness'

describe('migrations', () => {
  it('apply cleanly on an empty database and provision a new user', async () => {
    const db = await createDb()
    const id = await signUp(db, 'a@example.com', 'Alice')
    const p = await db.query(`select full_name, role from public.profiles where id = $1`, [id])
    expect(p.rows[0]).toEqual({ full_name: 'Alice', role: 'employee' })
    const b = await db.query(`select leave_type, total_days, used_days, available_days from public.leave_balances where employee_id = $1 order by leave_type`, [id])
    expect(b.rows).toHaveLength(3)
  })
})
