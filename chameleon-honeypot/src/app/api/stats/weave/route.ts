import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    const points = 20;
    const history = [];
    const now = Date.now();

    // Simulate 20 historical data points
    for (let i = 0; i < points; i++) {
        const time = new Date(now - ((points - 1 - i) * 60000)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        // Evolution Index climbs from 0.4 -> 0.99 (Learning)
        // Add some random noise for realism
        const baseEvolution = 0.4 + (0.5 * (i / points));
        const noise = (Math.random() * 0.05) - 0.025;
        const evolutionIndex = Math.min(0.99, Math.max(0, baseEvolution + noise));

        // Immunization climbs from 0% -> 100% (Coverage)
        const immunization = Math.floor((i / points) * 100);

        history.push({ time, evolutionIndex, immunization });
    }

    return NextResponse.json({ success: true, metrics: history });
}
