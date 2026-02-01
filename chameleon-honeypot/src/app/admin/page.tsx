'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Activity, ShieldAlert, Swords, Skull, Send, Video, MessageSquare, Terminal, PieChart as PieChartIcon, Info, FileText, Download } from 'lucide-react'
import { Toaster, toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {

    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    BarChart,
    Bar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar
} from 'recharts'

export default function AdminPage() {
    const [inCall, setInCall] = useState(false)
    const [chatMode, setChatMode] = useState(false)

    // Chat State
    const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([
        { role: 'bot', text: "Shadow Commander Igris online. Awaiting directives." }
    ])
    const [input, setInput] = useState('')
    const scrollRef = useRef<HTMLDivElement>(null)

    // Real Data State
    const [realStats, setRealStats] = useState({ hits: 0, rules: 0, blocked: 0 })
    const [logs, setLogs] = useState<{ trapped: any[], blocked: any[] }>({ trapped: [], blocked: [] })
    const [dbLogs, setDbLogs] = useState<any[]>([])

    // Poll for real data
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Stats
                const statsRes = await fetch('/api/stats', { cache: 'no-store' })
                const statsData = await statsRes.json()
                setRealStats(statsData)

                // Fetch Logs
                const logsRes = await fetch('/api/logs', { cache: 'no-store' })
                const logsData = await logsRes.json()
                setLogs(logsData)

                // Fetch DB Logs
                const dbLogsRes = await fetch('/api/logs/db', { cache: 'no-store' })
                const dbLogsData = await dbLogsRes.json()
                if (Array.isArray(dbLogsData)) setDbLogs(dbLogsData)
            } catch (e) {
                console.error("Dashboard Poll Error", e)
            }
        }

        fetchData() // Initial fetch
        const interval = setInterval(fetchData, 2000) // Fast poll for "Real-time" feel
        return () => clearInterval(interval)
    }, [])

    // Scroll chat to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, chatMode])

    const handleSendMessage = () => {
        if (!input.trim()) return

        setMessages(prev => [...prev, { role: 'user', text: input }])
        const userCmd = input
        setInput('')

        // Simulation of Igris AI
        setTimeout(() => {
            let response = "I do not understand that command, My Liege."
            if (userCmd.toLowerCase().includes('status')) response = "Systems operational. Gates are holding."
            if (userCmd.toLowerCase().includes('attack')) response = "Shadow Army is ready to deploy on your signal."
            if (userCmd.toLowerCase().includes('hello')) response = "Greetings, Monarch."

            setMessages(prev => [...prev, { role: 'bot', text: response }])
        }, 600)
    }

    const joinWarRoom = () => {
        setInCall(true)
        setChatMode(false)
        toast.success("IGRIS ACTIVATED", {
            description: "Shadow Commander joining the channel.",
            style: { background: '#450a0a', color: '#f87171', border: '1px solid #b91c1c' }
        })
    }

    // Determine Rank based on blocked attacks (Success) vs Trapped (Potential Threat)
    const dominationRate = realStats.hits > 0 ? ((realStats.blocked / realStats.hits) * 100).toFixed(1) : "100"
    const dungeonRank = realStats.rules > 5 ? 'S-RANK' : (realStats.rules > 2 ? 'A-RANK' : 'B-RANK')

    // --- CHART DATA PREPARATION ---

    // 1. Attack Velocity (Area Chart)
    const getVelocityData = () => {
        const now = Date.now()
        const bucketSize = 10000; // 10 seconds
        const totalBuckets = 30; // 5 minutes history

        // Initialize with real data buckets
        const buckets = Array.from({ length: totalBuckets }, (_, i) => ({
            time: new Date(now - (totalBuckets - 1 - i) * bucketSize).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            trapped: 0,
            blocked: 0,
            isSimulated: false
        }))

        // Populate with Real Logs
        logs.trapped.forEach(log => {
            const age = now - log.timestamp
            const idx = (totalBuckets - 1) - Math.floor(age / bucketSize)
            if (idx >= 0 && idx < totalBuckets) buckets[idx].trapped++
        })

        logs.blocked.forEach(log => {
            const age = now - log.timestamp
            const idx = (totalBuckets - 1) - Math.floor(age / bucketSize)
            if (idx >= 0 && idx < totalBuckets) buckets[idx].blocked++
        })

        return buckets;
    }
    const velocityData = getVelocityData()

    // 2. Threat Distribution (Pie Chart for IPs)
    // 2. Threat Distribution (Pie Chart for Risk)
    const getDistributionData = () => {
        const trappedCount = logs.trapped.length;
        const blockedCount = logs.blocked.length;

        if (trappedCount === 0 && blockedCount === 0) {
            return [{ name: 'No Threats', value: 1 }];
        }

        return [
            { name: 'Trapped', value: trappedCount },
            { name: 'Blocked', value: blockedCount }
        ].filter(d => d.value > 0);
    }
    const distributionData = getDistributionData()
    // Blue for Trapped, Red for Blocked
    const PIE_COLORS = ['#3b82f6', '#ef4444'];


    // ... inside AdminPage ...


    return (
        <div className="min-h-screen bg-slate-950 text-blue-100 font-mono p-6 relative overflow-hidden">
            {/* ... Header ... */}



            {/* HEADER */}
            <header className="flex justify-between items-center mb-10 border-b border-blue-900/50 pb-6 relative z-10 max-w-[1600px] mx-auto">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                        <Swords className="w-8 h-8 text-blue-500" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-blue-400 tracking-tighter flex items-center gap-2">
                            SYSTEM ADMIN: S-CLASS
                        </h1>
                        <p className="text-blue-600/60 text-sm tracking-[0.2em] uppercase font-bold mt-1">Shadow Monarch Access // UNRESTRICTED</p>
                    </div>
                </div>
                <div className="flex gap-6 items-center">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-blue-800 uppercase font-black tracking-widest mb-1">Current Authorization</span>
                        <Badge variant="outline" className={`
                            px-4 py-1.5 text-xs font-black tracking-widest rounded-none border-2
                            ${dungeonRank === 'S-RANK' ? 'bg-red-950/50 text-red-500 border-red-500 animate-pulse' :
                                dungeonRank === 'A-RANK' ? 'bg-purple-900/20 text-purple-500 border-purple-500' :
                                    'bg-blue-900/20 text-blue-400 border-blue-800'}
                        `}>
                            DUNGEON RANK: {dungeonRank}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/5 border border-blue-500/20 rounded-full">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_15px_#3b82f6] animate-pulse" />
                        <span className="text-[10px] text-blue-400 font-bold uppercase tracking-tighter">Live Connection</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10 max-w-[1600px] mx-auto">



                {/* ... Existing Logs ... */}


                {/* STATS ROW */}
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-slate-900/50 border-blue-900/30 backdrop-blur">
                        <CardHeader className="pb-2"><CardTitle className="text-sm text-blue-400 tracking-wider">DUNGEON INTRUDERS</CardTitle></CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold text-blue-200">{realStats.hits}</div>
                            <div className="text-xs text-blue-500 mt-1">Souls Harvested (Total Requests)</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900/50 border-blue-900/30 backdrop-blur">
                        <CardHeader className="pb-2"><CardTitle className="text-sm text-blue-400 tracking-wider">SHADOW ARMY (RULES)</CardTitle></CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold text-indigo-300">{realStats.rules}</div>
                            <div className="text-xs text-blue-500 mt-1">Soldiers Arisen</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900/50 border-blue-900/30 backdrop-blur">
                        <CardHeader className="pb-2"><CardTitle className="text-sm text-blue-400 tracking-wider">DOMINATION RATE</CardTitle></CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold text-purple-400">{dominationRate}%</div>
                            <div className="text-xs text-blue-500 mt-1">Attacks Nullified: {realStats.blocked}</div>
                        </CardContent>
                    </Card>
                </div>


                {/* MAIN DASHBOARD */}
                <div className="lg:col-span-2 space-y-6">

                    {/* ROW 1: COMMAND FREQUENCY + DUNGEON VITALS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[820px]">

                        {/* COMMAND FREQUENCY (STACKED BAR CHART) */}
                        <Card className="bg-slate-900/80 border-blue-900/30 flex flex-col backdrop-blur-sm shadow-xl">
                            <CardHeader className="border-b border-blue-900/20 py-3 bg-blue-950/10">
                                <CardTitle className="flex items-center gap-2 text-sm text-blue-400 tracking-widest">
                                    <Terminal className="w-4 h-4" /> ARSENAL: TOP COMMANDS
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 p-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={
                                        // Calc top commands with split (Trapped vs Blocked)
                                        (() => {
                                            const counts: Record<string, { trapped: number, blocked: number }> = {};

                                            // Process Trapped
                                            logs.trapped.forEach(l => {
                                                const cmd = l.command.length > 15 ? l.command.substring(0, 12) + '...' : l.command;
                                                if (!counts[cmd]) counts[cmd] = { trapped: 0, blocked: 0 };
                                                counts[cmd].trapped++;
                                            });

                                            // Process Blocked
                                            logs.blocked.forEach(l => {
                                                const cmd = l.command.length > 15 ? l.command.substring(0, 12) + '...' : l.command;
                                                if (!counts[cmd]) counts[cmd] = { trapped: 0, blocked: 0 };
                                                counts[cmd].blocked++;
                                            });

                                            return Object.entries(counts)
                                                .map(([name, val]) => ({
                                                    name,
                                                    trapped: val.trapped,
                                                    blocked: val.blocked,
                                                    total: val.trapped + val.blocked
                                                }))
                                                .sort((a, b) => b.total - a.total)
                                                .slice(0, 7); // Top 7
                                        })()
                                    } layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                                        <XAxis type="number" stroke="#475569" fontSize={10} />
                                        <YAxis dataKey="name" type="category" stroke="#475569" fontSize={10} width={80} />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#e2e8f0' }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                                        <Bar dataKey="trapped" stackId="a" fill="#3b82f6" name="Trapped" radius={[0, 0, 0, 0]} barSize={20} />
                                        <Bar dataKey="blocked" stackId="a" fill="#ef4444" name="Blocked (Rule Hit)" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* DUNGEON VITALS (RADAR CHART) */}
                        <Card className="bg-slate-900/80 border-blue-900/30 flex flex-col backdrop-blur-sm shadow-xl">
                            <CardHeader className="border-b border-blue-900/20 py-3 bg-blue-950/10">
                                <CardTitle className="flex items-center gap-2 text-sm text-indigo-400 tracking-widest">
                                    <Activity className="w-4 h-4" /> DUNGEON VITALS
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 p-0 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                                        { subject: 'Mana (CPU)', A: 80, fullMark: 100 },
                                        { subject: 'Stamina (RAM)', A: 45, fullMark: 100 },
                                        { subject: 'Defense', A: 90, fullMark: 100 },
                                        { subject: 'Agility (Net)', A: 65, fullMark: 100 },
                                        { subject: 'Intel', A: 95, fullMark: 100 },
                                    ]}>
                                        <PolarGrid stroke="#1e293b" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                        <Radar
                                            name="System"
                                            dataKey="A"
                                            stroke="#8b5cf6"
                                            fill="#8b5cf6"
                                            fillOpacity={0.4}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#e2e8f0' }}
                                            itemStyle={{ color: '#a78bfa' }}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>



                </div>

                {/* RIGHT SIDEBAR: THREAT DISTRIBUTION (Pie Chart) */}
                <Card className="bg-slate-900/80 border-blue-900/30 h-[820px] flex flex-col backdrop-blur-sm">
                    <CardHeader className="border-b border-blue-900/20 py-3 bg-blue-950/10 mb-4">
                        <CardTitle className="flex items-center gap-2 text-sm text-blue-400 tracking-widest">
                            <PieChartIcon className="w-4 h-4" /> THREAT DISTRIBUTION
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="flex-1 p-4 flex flex-col items-center justify-center relative">
                        {/* CHART TITLE & DESCRIPTION */}
                        <div className="text-center mb-6 max-w-[80%]">
                            <h3 className="text-blue-300 font-bold text-sm flex items-center justify-center gap-2">
                                <Info className="w-3 h-3 text-blue-500" />
                                THREAT DISPOSITION
                            </h3>
                            <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                                This chart displays the ratio of successfully **Trapped** attackers vs **Blocked** attempts (Rule Hits).
                            </p>
                        </div>

                        {/* PIE CHART */}
                        <div className="w-full h-[300px] relative z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={distributionData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                        nameKey="name"
                                    >
                                        {distributionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="rgba(0,0,0,0.5)" strokeWidth={2} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#e2e8f0', borderRadius: '8px' }}
                                        itemStyle={{ fontSize: '12px', color: '#94a3b8' }}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="circle"
                                        wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* STATS SUMMARY */}
                        <div className="mt-8 grid grid-cols-2 gap-4 w-full px-4 border-t border-blue-900/20 pt-6">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-400">{realStats.hits}</div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Total Threats</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-400">{realStats.blocked}</div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Blocked</div>
                            </div>
                        </div>

                    </CardContent>
                </Card>

            </div>

            {/* FORENSIC LOGS SECTION */}
            <Card className="mt-6 bg-slate-900/80 border-blue-900/30 backdrop-blur-sm relative z-10">
                <CardHeader className="border-b border-blue-900/20 py-3 bg-blue-950/10">
                    <CardTitle className="flex items-center gap-2 text-sm text-blue-400 tracking-widest">
                        <FileText className="w-4 h-4" /> FORENSIC EVIDENCE LOGS (SQLITE)
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="relative overflow-x-auto">
                        <table className="w-full text-xs text-left text-slate-400">
                            <thead className="text-[10px] text-blue-500 uppercase bg-blue-950/20">
                                <tr>
                                    <th className="px-4 py-3">Timestamp</th>
                                    <th className="px-4 py-3">Attack Type</th>
                                    <th className="px-4 py-3">Input Command</th>
                                    <th className="px-4 py-3">Severity</th>
                                    <th className="px-4 py-3">Engagement</th>
                                    <th className="px-4 py-3 text-right">Evidence</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dbLogs.length === 0 ? (
                                    <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-600">No forensic records found yet.</td></tr>
                                ) : (
                                    dbLogs.map((log: any) => (
                                        <tr key={log.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                                            <td className="px-4 py-3 font-mono text-slate-300">{log.date_of_attack}</td>
                                            <td className="px-4 py-3">{log.type_of_attack}</td>
                                            <td className="px-4 py-3 font-mono text-emerald-400 max-w-[200px] truncate" title={log.hackers_input}>
                                                {log.hackers_input}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="outline" className={`
                                                    ${log.attacker_severity === 'Critical' ? 'border-red-500 text-red-500 bg-red-950/20' :
                                                        log.attacker_severity === 'High' ? 'border-orange-500 text-orange-500 bg-orange-950/20' :
                                                            'border-blue-500 text-blue-500 bg-blue-950/20'}
                                                `}>
                                                    {log.attacker_severity}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">{log.engagement_time?.toFixed(2)}s</td>
                                            <td className="px-4 py-3 text-right">
                                                {log.evidence_docs_path ? (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-6 gap-1 text-blue-400 hover:text-blue-200 hover:bg-blue-900/30"
                                                        onClick={() => window.open(log.evidence_docs_path, '_blank')}
                                                    >
                                                        <Download className="w-3 h-3" /> DOC
                                                    </Button>
                                                ) : <span className="text-slate-600">-</span>}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* FLOATING IGRIS WIDGET */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
                <AnimatePresence>
                    {chatMode && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 20 }}
                            className="w-[350px] h-[500px] bg-slate-950 border border-red-900/50 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden relative"
                        >
                            {/* Header */}
                            <div className="bg-red-950/20 border-b border-red-900/30 p-3 flex justify-between items-center relative z-10">
                                <div className="flex items-center gap-2 text-red-500 font-bold text-sm tracking-widest">
                                    <Skull className="w-4 h-4" /> IGRIS COMMAND
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Video Toggle */}
                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400 hover:text-red-200 hover:bg-red-900/20" onClick={() => setInCall(!inCall)}>
                                        {inCall ? <MessageSquare className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400 hover:text-red-200 hover:bg-red-900/20" onClick={() => setChatMode(false)}>
                                        <span className="sr-only">Close</span>
                                        ✕
                                    </Button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 bg-black/80 relative overflow-hidden">
                                {inCall ? (
                                    <iframe
                                        title="Daily War Room"
                                        src="https://chameleon-demo.daily.co/demo-room"
                                        allow="camera; microphone; fullscreen; display-capture"
                                        className="w-full h-full border-0 grayscale contrast-125 sepia-[.3] hue-rotate-[-50deg]"
                                        style={{ pointerEvents: 'auto' }}
                                    />
                                ) : (
                                    <div className="flex flex-col h-full">
                                        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                                            <div className="space-y-4">
                                                {messages.map((msg, idx) => (
                                                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`max-w-[85%] p-2 rounded text-xs leading-relaxed ${msg.role === 'user'
                                                            ? 'bg-red-900/30 text-red-100 border border-red-900/50 rounded-tr-none'
                                                            : 'bg-slate-900/80 text-slate-300 border border-slate-700/50 rounded-tl-none'
                                                            }`}>
                                                            {msg.role === 'bot' && <span className="block text-[9px] text-red-500 font-bold mb-1 uppercase tracking-wider">Shadow Commander</span>}
                                                            {msg.text}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                        <div className="p-3 bg-red-950/10 border-t border-red-900/20 flex gap-2">
                                            <Input
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                                placeholder="Directives..."
                                                className="bg-black/40 border-red-900/30 text-red-100 text-xs h-8 focus-visible:ring-red-500"
                                            />
                                            <Button size="icon" onClick={handleSendMessage} className="h-8 w-8 bg-red-900/40 hover:bg-red-800 text-red-200">
                                                <Send className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* The Floating Head (Trigger) */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setChatMode(!chatMode)}
                    className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.5)] border-2 border-red-500 transition-all ${chatMode ? 'bg-black text-red-500 rotate-180' : 'bg-red-950 text-red-500 hover:bg-red-900'
                        }`}
                >
                    {chatMode ? (
                        <span className="text-xl font-bold">✕</span>
                    ) : (
                        <Skull className="w-8 h-8 animate-pulse" />
                    )}
                </motion.button>
            </div>
        </div >
    )
}
