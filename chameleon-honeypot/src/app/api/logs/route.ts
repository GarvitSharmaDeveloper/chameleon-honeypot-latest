import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import db from '@/lib/db'

export async function GET() {
    try {
        // Fetch from SQLite (Single Source of Truth)
        const stmt = db.prepare('SELECT * FROM hacker_activity ORDER BY id DESC LIMIT 500')
        const allLogs = stmt.all() as any[]

        // Map to Frontend Model (Redis-like structure)
        const formatLog = (row: any) => {
            // Parse "YYYY-MM-DD HH:MM:SS" to timestamp
            // Assume UTC or local logic consistency
            const timestamp = new Date(row.date_of_attack).getTime() || Date.now()

            return {
                command: row.hackers_input,
                timestamp: timestamp,
                ip: '127.0.0.1', // Placeholder as DB might not allow IP column yet or generic
                rule: row.ai_response // Using response as rule/reason context
            }
        }

        const trapped = allLogs.filter((l: any) => l.type_of_attack !== 'Blocked / Rule Hit').map(formatLog)
        const blocked = allLogs.filter((l: any) => l.type_of_attack === 'Blocked / Rule Hit').map(formatLog)

        return NextResponse.json({
            trapped,
            blocked
        })
    } catch (error) {
        console.error("Logs API Error:", error)
        return NextResponse.json({ trapped: [], blocked: [] })
    }
}
