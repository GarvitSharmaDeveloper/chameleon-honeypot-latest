'use client'

import { useState } from 'react'
import { Toaster, toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Shield, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
    const [loading, setLoading] = useState(false)
    const [username, setUsername] = useState('; cat /etc/passwd')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)

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
                style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #f87171' }
            })
        } catch (error) {
            console.error(error)
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900">
            <Toaster position="top-center" theme="light" />

            <div className="absolute top-0 left-0 right-0 p-4 border-b border-slate-100 bg-white flex items-center gap-3">
                <Shield className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-semibold text-slate-800">Administrative Portal (Legacy)</span>
            </div>

            <Card className="w-full max-w-sm bg-white border border-slate-200 shadow-sm rounded-md overflow-hidden">
                <CardContent className="p-8">
                    <h3 className="text-center text-slate-700 text-xl font-medium mb-8">Login Required</h3>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Username</label>
                            <Input
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus-visible:ring-blue-500 h-10 rounded-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Password</label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="************"
                                    className="bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus-visible:ring-blue-500 h-10 rounded-sm pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-11 transition-all rounded-md shadow-sm"
                        >
                            {loading ? "Signing In..." : "Sign In"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

