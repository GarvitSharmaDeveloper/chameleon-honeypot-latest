'use client'

import { useState } from 'react'
import { Toaster, toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ShieldCheck, User, Lock, Terminal } from 'lucide-react'

export default function LoginPage() {
    const [loading, setLoading] = useState(false)
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Send credentials to Honeypot API
            const command = `AUTH_ATTEMPT user='${username}' pass='${password}'`
            await fetch('/api/honeypot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command })
            })

            // Simulate real login delay
            await new Promise(r => setTimeout(r, 1500))

            toast.error("ACCESS DENIED", {
                description: "Invalid credentials. Incident reported.",
                style: { background: '#450a0a', color: '#f87171', border: '1px solid #b91c1c' }
            })
        } catch (error) {
            console.error(error)
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative font-mono text-green-500">
            {/* Matrix Background */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

            <Toaster position="top-center" theme="dark" />

            <Card className="w-full max-w-md bg-black border-2 border-green-800 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                <CardHeader className="text-center space-y-2 border-b border-green-900 pb-6 bg-green-950/20">
                    <div className="mx-auto w-12 h-12 bg-green-900/20 rounded border border-green-700 flex items-center justify-center mb-2">
                        <Terminal className="w-6 h-6 text-green-500" />
                    </div>
                    <CardTitle className="text-xl font-bold tracking-widest text-green-400 uppercase">
            // OPS_COMMAND_LOGIN
                    </CardTitle>
                    <p className="text-xs text-green-700 uppercase">Restricted Area // Class 4 Clearance</p>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs uppercase font-bold text-green-700 ml-1">UID</label>
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 h-4 w-4 text-green-800" />
                                <Input
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="USER_ID"
                                    className="pl-9 bg-black border-green-800 text-green-400 placeholder:text-green-900 focus:border-green-500 focus:ring-green-900 h-10 font-mono"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs uppercase font-bold text-green-700 ml-1">ACCESS KEY</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-green-800" />
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="************"
                                    className="pl-9 bg-black border-green-800 text-green-400 placeholder:text-green-900 focus:border-green-500 focus:ring-green-900 h-10 font-mono"
                                />
                            </div>
                        </div>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-green-900/30 hover:bg-green-800/50 text-green-400 font-bold border border-green-600 h-11 hover:text-green-200 transition-all rounded"
                        >
                            {loading ? "VERIFYING..." : "INITIATE_SESSION"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center border-t border-green-900 pt-4 bg-green-950/10">
                    <p className="text-[10px] text-green-800 font-mono">SECURE RELAY NODE: 192.168.0.X</p>
                </CardFooter>
            </Card>
        </div>
    )
}
