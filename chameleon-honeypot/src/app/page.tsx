'use client'

import { useState, useEffect } from 'react'
import { Toaster, toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Shield, ShieldAlert, Terminal, Lock, Flame, RefreshCw, Zap, Skull, Code2, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Home() {
  const [target, setTarget] = useState<'honeypot' | 'prod'>('honeypot')
  const [command, setCommand] = useState("ADMIN' OR '1'='1' --")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    "Initialising Uplink...",
    "Target Acquired: 192.168.0.X",
    "Select Vector: HONEYPOT (Test) or PRODUCTION (Live)"
  ])
  const [rules, setRules] = useState<any[]>([])
  const [isAttacking, setIsAttacking] = useState(false)
  const [isEvolving, setIsEvolving] = useState(false)
  const [patchStatus, setPatchStatus] = useState<{ isPatched: boolean, criticalLine: string } | null>(null)
  const [showPatchCode, setShowPatchCode] = useState(false)

  // Poll for new rules every 5 seconds
  useEffect(() => {
    const fetchRules = async () => {
      try {
        const res = await fetch('/api/rules')
        const data = await res.json()

        // Combine Rules and Patches
        const combined: any[] = []

        // Process Firewall Rules
        if (data.rules) {
          data.rules.forEach((r: string) => combined.push({ type: 'rule', content: r }))
        }

        // Process Code Patches
        if (data.patches) {
          data.patches.forEach((p: any) => combined.push({ type: 'patch', content: p.trigger || 'Unknown Attack' }))
        }

        if (data.patchStatus) {
          setPatchStatus(data.patchStatus)
        }

        setRules(combined)

      } catch (e) { console.error('Polling error', e) }
    }

    fetchRules()
    const interval = setInterval(fetchRules, 2000)
    return () => clearInterval(interval)
  }, [])

  const handleAttack = async () => {
    setIsAttacking(true)
    setTerminalOutput(prev => [...prev, `> INJECTING PAYLOAD TO ${target.toUpperCase()}...`])

    try {
      const endpoint = target === 'honeypot' ? '/api/honeypot' : '/api/prod'

      let res
      if (target === 'prod') {
        const queryParams = new URLSearchParams()
        if (command) queryParams.set('q', command)
        if (password) queryParams.set('p', password)

        res = await fetch(`${endpoint}?${queryParams.toString()}`, {
          method: 'POST',
          body: JSON.stringify({ command, password })
        })
      } else {
        res = await fetch(endpoint, {
          method: 'POST',
          body: JSON.stringify({ command })
        })
      }

      if (res.status === 403) {
        setTerminalOutput(prev => [...prev, `! CONNECTION REFUSED [403]: FIREWALL BLOCKED PACKET.`])
        toast.error("Packet Dropped", {
          description: "Target firewall intercepted the payload.",
          style: { background: '#450a0a', color: '#fca5a5', border: '1px solid #ef4444' }
        })
      } else {
        const data = await res.json()
        setTerminalOutput(prev => [...prev, `+ ACK [${res.status}]: ${data.output || 'Shell Access Granted'}`])
        if (target === 'honeypot') {
          toast.warning("ROOT ACCESS SIMULATED", {
            description: "Logging session trace...",
            style: { background: '#422006', color: '#fdba74', border: '1px solid #f97316' }
          })
        }
      }
    } catch (e) {
      setTerminalOutput(prev => [...prev, `! FATAL: Network Unreachable`])
    }
    setIsAttacking(false)
  }

  const handleEvolve = async () => {
    setIsEvolving(true)
    try {
      const res = await fetch('/api/evolve', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        toast.info("SIEGE MODE ACTIVE", {
          description: "Generated new regex defense pattern.",
          style: { background: '#020617', color: '#94a3b8', border: '1px solid #475569' }
        })
      } else {
        toast.message("No logs to process.")
      }
    } catch (e) {
      toast.error("Command Failed")
    }
    setIsEvolving(false)
  }

  return (
    <div className="min-h-screen bg-black text-green-500 p-8 font-mono relative">
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      <Toaster position="top-center" richColors theme="dark" />

      {/* 
      <header className="mb-8 flex justify-between items-center border-b border-green-900 pb-4 relative z-10">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 text-green-500 tracking-tighter">
            <Terminal className="text-green-500 w-8 h-8" />
            0xHACK_CONSOLE
          </h1>
          <p className="text-green-700 mt-1 text-sm tracking-widest uppercase">Connected // UID: 0x92F1</p>
        </div>
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={handleEvolve}
            disabled={isEvolving}
            className="border-green-800 bg-green-950/20 text-green-500 hover:bg-green-900 hover:text-green-300 hover:border-green-500 transition-all font-mono"
          >
            {isEvolving ? <RefreshCw className="animate-spin mr-2 h-4 w-4" /> : <Zap className="mr-2 h-4 w-4" />}
            TRIGGER_EVOLUTION()
          </Button>
        </div>
      </header>
       */}

      <header className="mb-8 flex justify-between items-center border-b border-green-900 pb-4 relative z-10">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 text-green-500 tracking-tighter">
            <Terminal className="text-green-500 w-8 h-8" />
            0xHACK_CONSOLE
          </h1>
          <p className="text-green-700 mt-1 text-sm tracking-widest uppercase">Connected // UID: 0x92F1</p>
        </div>
        <div className="flex gap-4">
          <div className="text-xs font-mono text-green-800 border-green-900 border px-2 py-1">
            AUTO_DEFENSE: ACTIVE
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[75vh] relative z-10">

        {/* LEFT PANE: ATTACKER */}
        <Card className="lg:col-span-4 bg-black border-2 border-green-800 shadow-[0_0_20px_rgba(22,163,74,0.1)] flex flex-col">
          <CardHeader className="border-b border-green-900 bg-green-950/30">
            <CardTitle className="text-green-500 flex items-center gap-2 tracking-widest text-sm">
              <Code2 className="w-4 h-4" /> PAYLOAD_INJECTOR
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-4 gap-4">
            <div className="flex gap-2 bg-green-950/20 p-1 rounded border border-green-900">
              <Button
                variant={target === 'honeypot' ? 'destructive' : 'ghost'}
                onClick={() => setTarget('honeypot')}
                className={`w-1/2 rounded-none font-mono ${target === 'honeypot' ? 'bg-red-900 text-red-200 border border-red-500' : 'text-green-700 hover:text-green-400'}`}
              >
                TARGET: TRAP
              </Button>
              <Button
                variant={target === 'prod' ? 'default' : 'ghost'}
                onClick={() => setTarget('prod')}
                className={`w-1/2 rounded-none font-mono ${target === 'prod' ? 'bg-green-900 text-green-200 border border-green-500' : 'text-green-700 hover:text-green-400'}`}
              >
                TARGET: PROD
              </Button>
            </div>

            <ScrollArea className="flex-1 bg-black rounded border border-green-800 p-4 font-mono text-xs text-green-400">
              {terminalOutput.map((line, i) => (
                <div key={i} className="mb-1 break-all flex gap-2">
                  <span className="text-green-800">$</span>
                  <span>{line}</span>
                </div>
              ))}
            </ScrollArea>

            <div className="flex gap-2">
              <Input
                value={command}
                onChange={e => setCommand(e.target.value)}
                className="bg-black border-green-700 text-green-400 font-mono placeholder:text-green-900 rounded-none focus:ring-green-500"
                placeholder="sqlmap -u target..."
              />
              <Button onClick={handleAttack} disabled={isAttacking} className="bg-green-700 hover:bg-green-600 text-black font-bold border border-green-500 rounded-none">
                {isAttacking ? "..." : "SEND"}
              </Button>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-green-900 text-green-600 border-green-800 transition-colors font-mono rounded-none"
                onClick={() => setCommand("ADMIN' OR '1'='1' --")}
              >
                Auth_Bypass_v1
              </Badge>
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-green-900 text-green-600 border-green-800 transition-colors font-mono rounded-none"
                onClick={() => setCommand("<script>alert('pwned')</script>")}
              >
                XSS_Payload
              </Badge>
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-green-900 text-green-600 border-green-800 transition-colors font-mono rounded-none"
                onClick={() => {
                  setCommand("admin")
                  setPassword("7c4a8d09ca3762af61e59520943dc26494f8941b")
                  setTarget('prod') // Automatically switch to PROD target for the login attempt
                }}
              >
                Use_Stolen_Creds
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* CENTER PANE: HONEYPOT VIEW */}
        <Card className="lg:col-span-4 bg-slate-100 border-slate-300 shadow-xl flex flex-col relative overflow-hidden">
          {/* Make this look like a clean "Legacy" portal to contrast with the hacker terminal */}
          <div className="absolute inset-0 bg-white z-0"></div>
          <CardHeader className="border-b border-slate-200 bg-slate-50 relative z-10">
            <CardTitle className="text-slate-800 flex items-center gap-2 text-sm font-sans">
              <Shield className="w-4 h-4 text-blue-600" /> Administrative Portal (Legacy)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-8 flex items-center justify-center relative z-10">
            <div className="w-full max-w-sm space-y-4 border border-slate-200 p-6 rounded bg-white shadow-sm">
              <h3 className="text-center text-slate-700 font-sans text-lg border-b border-slate-100 pb-2">Login Required</h3>
              <div className="space-y-1">
                <label className="text-xs text-slate-500 uppercase font-bold">Username</label>
                <div className="h-10 w-full bg-slate-50 border border-slate-300 rounded px-3 flex items-center text-slate-800 text-sm overflow-hidden">
                  <span className="truncate w-full">{command}</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500 uppercase font-bold">Password</label>
                <div className="h-10 w-full bg-slate-50 border border-slate-300 rounded px-3 flex items-center justify-between text-slate-800 text-sm">
                  <span className="truncate">{showPassword ? (password || "************") : (password ? "•".repeat(password.length) : "************")}</span>
                  <button onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-slate-600 focus:outline-none">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-sans">Sign In</Button>
            </div>
          </CardContent>
        </Card>

        {/* RIGHT PANE: DEFENSE LOG */}
        <Card className="lg:col-span-4 bg-black border-2 border-green-800 shadow-[0_0_20px_rgba(22,163,74,0.1)] flex flex-col">
          <CardHeader className="border-b border-green-900 bg-green-950/30">
            <CardTitle className="text-green-500 flex items-center gap-2 tracking-widest text-sm">
              <ShieldAlert className="w-4 h-4" /> ACTIVE_DEFENSE_RULES
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-4 bg-black/50">
            <ScrollArea className="h-full pr-4">
              <AnimatePresence>
                {rules.length === 0 && !patchStatus?.isPatched && (
                  <div className="text-center text-green-900 mt-10 font-mono text-xs">
                    // NO_THREATS_DETECTED
                    <br />// SYSTEM_IDLE
                  </div>
                )}
                {patchStatus?.isPatched && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-3"
                  >
                    <div className="border border-purple-500 bg-purple-950/20 shadow-[0_0_15px_rgba(168,85,247,0.15)] overflow-hidden rounded-md">
                      <div
                        className="p-3 flex flex-col gap-2 cursor-pointer hover:bg-purple-900/10 transition-colors"
                        onClick={() => setShowPatchCode(!showPatchCode)}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] uppercase text-purple-400 font-bold tracking-wider flex items-center gap-1">
                            <Zap className="w-3 h-3 text-purple-500 fill-purple-500 animate-pulse" />
                            AUTO_PATCH_ACTIVE
                          </span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[9px] h-4 border-purple-500/50 text-purple-300 px-1 py-0 rounded-[2px]">
                              MITIGATED
                            </Badge>
                            {showPatchCode ? <ChevronUp className="w-3 h-3 text-purple-400" /> : <ChevronDown className="w-3 h-3 text-purple-400" />}
                          </div>
                        </div>
                        <div className="text-[10px] text-purple-300 opacity-80 pl-1 border-l-2 border-purple-800">
                          Vulnerability Fixed: SQL Injection
                        </div>
                      </div>

                      <AnimatePresence>
                        {showPatchCode && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-3 pt-0 border-t border-purple-500/30 bg-black/40">
                              <div className="mt-2 relative group">
                                <div className="absolute -inset-0.5 bg-purple-500/10 blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                                <ScrollArea className="h-[200px] w-full rounded border border-purple-500/30 bg-black/90 p-2 shadow-inner">
                                  <pre className="text-[10px] font-mono text-purple-200 whitespace-pre-wrap break-words">
                                    {patchStatus.criticalLine}
                                  </pre>
                                </ScrollArea>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
                {rules.map((rule, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-3"
                  >
                    <div className={`p-2 border ${rule.type === 'patch' ? 'border-purple-500 bg-purple-950/20' : 'border-green-900 bg-green-950/10'} hover:bg-opacity-30 transition-colors`}>
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-[10px] uppercase ${rule.type === 'patch' ? 'text-purple-400' : 'text-green-700'}`}>
                          {rule.type === 'patch' ? 'AUTO_PATCH_APPLIED' : `Rule_ID_0${i + 1}`}
                        </span>
                        {rule.type === 'patch' ? <Zap className="w-3 h-3 text-purple-500" /> : <Lock className="w-3 h-3 text-green-600" />}
                      </div>
                      <code className={`text-xs break-all font-mono block ${rule.type === 'patch' ? 'text-purple-300' : 'text-green-400'}`}>
                        {rule.type === 'patch' ? `Fix applied for: ${rule.content}` : rule.content}
                      </code>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </ScrollArea>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}

