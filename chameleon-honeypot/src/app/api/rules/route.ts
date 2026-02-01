import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export async function GET() {
    try {
        const rules = await redis.lrange('firewall:rules', 0, -1)
        const patches = await redis.lrange('patch:history', 0, -1)

        // Parse patches if they are JSON strings
        const formattedPatches = patches.map(p => {
            try { return JSON.parse(p) } catch { return { trigger: 'Unknown', patch: p } }
        })

        // Check Dummy App Status
        let isPatched = false
        let criticalLine = ''
        try {
            const fs = require('fs')
            const path = require('path')
            const dummyPath = path.join(process.cwd(), 'dummy/vulnerable_app.py')
            if (fs.existsSync(dummyPath)) {
                const content = fs.readFileSync(dummyPath, 'utf-8')
                // Check if it uses parameterized query logic (basic check)
                if (content.includes('WHERE username = ?') || content.includes('cursor.execute(query, (username,))')) {
                    isPatched = true
                    criticalLine = content // Return full content instead of single line
                }
            }
        } catch (e) {
            console.error("Failed to check dummy app status", e)
        }

        return NextResponse.json({
            rules,
            patches: formattedPatches,
            patchStatus: { isPatched, criticalLine }
        })
    } catch (error) {
        return NextResponse.json({ rules: [], patches: [], patchStatus: { isPatched: false, criticalLine: '' } })
    }
}
