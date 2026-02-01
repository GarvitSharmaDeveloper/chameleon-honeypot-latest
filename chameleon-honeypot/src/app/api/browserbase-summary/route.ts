import { NextResponse } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'

export async function GET() {
    try {
        const dbPath = path.join(process.cwd(), 'honeypot.db')
        const db = new Database(dbPath)

        // Get the most recent attack log with evidence
        const query = `
            SELECT * FROM hacker_activity 
            WHERE evidence_docs_path IS NOT NULL 
            ORDER BY id DESC 
            LIMIT 1
        `

        const latestAttack = db.prepare(query).get() as any

        db.close()

        if (!latestAttack) {
            return NextResponse.json({
                success: false,
                message: "No attack logs with evidence found in the database."
            })
        }

        // Format the summary
        const summary = {
            success: true,
            attack: {
                timestamp: latestAttack.date_of_attack,
                type: latestAttack.type_of_attack,
                severity: latestAttack.attacker_severity,
                command: latestAttack.hackers_input,
                engagementTime: latestAttack.engagement_time?.toFixed(2) || 'N/A',
                evidencePath: latestAttack.evidence_docs_path
            },
            formattedMessage: `**LATEST THREAT DETECTED**\n\n` +
                `🕐 **Time**: ${latestAttack.date_of_attack}\n` +
                `⚠️ **Severity**: ${latestAttack.attacker_severity}\n` +
                `🎯 **Attack Type**: ${latestAttack.type_of_attack}\n` +
                `💀 **Command**: \`${latestAttack.hackers_input}\`\n` +
                `⏱️ **Engagement**: ${latestAttack.engagement_time?.toFixed(2) || 'N/A'}s\n\n` +
                `Evidence has been captured and logged to Browserbase.`
        }

        return NextResponse.json(summary)

    } catch (error) {
        console.error('Browserbase Summary Error:', error)
        return NextResponse.json({
            success: false,
            message: "Failed to retrieve attack summary."
        }, { status: 500 })
    }
}
