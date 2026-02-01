import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import fs from 'fs'
import path from 'path'

export async function GET() {
    try {
        const dummyPath = path.join(process.cwd(), 'dummy/vulnerable_app.py')
        if (!fs.existsSync(dummyPath)) {
            return NextResponse.json({ code: "# File not found" })
        }

        const code = fs.readFileSync(dummyPath, 'utf-8')
        return NextResponse.json({ code })
    } catch (e) {
        return NextResponse.json({ code: "# Error reading file" })
    }
}
