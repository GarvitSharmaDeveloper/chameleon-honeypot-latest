import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import db from '@/lib/db'

export async function GET() {
    try {
        const stmt = db.prepare('SELECT * FROM hacker_activity ORDER BY id DESC')
        const logs = stmt.all()
        return NextResponse.json(logs)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch DB logs' }, { status: 500 })
    }
}
