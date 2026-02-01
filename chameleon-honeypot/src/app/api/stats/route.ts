import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { redis } from '@/lib/redis'

export async function GET() {
    try {
        const hits = await redis.llen('attack:logs')
        const rules = await redis.llen('firewall:rules')
        const blocked = await redis.llen('firewall:logs')

        return NextResponse.json({ hits, rules, blocked })
    } catch (error) {
        return NextResponse.json({ hits: 0, rules: 0, blocked: 0 })
    }
}
