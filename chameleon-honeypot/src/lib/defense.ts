import { GoogleGenerativeAI } from '@google/generative-ai'
import { redis } from '@/lib/redis'
import fs from 'fs'
import path from 'path'

const USE_MOCK = false // Real API Enabled

// Initialize Gemini
const getGeminiModel = () => {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '')
    return genAI.getGenerativeModel({ model: 'gemini-flash-latest' })
}

const EVOLVE_SYSTEM_PROMPT = `
You are an expert Security Engineer.
You have detected an attack on a Python application.

Your Goal:
1. Analyze the attack and create a Regex to block it (Firewall Rule).
2. Generate a Python code patch to fix the underlying vulnerability in the application code.

Response Format:
You must respond with a SINGLE JSON object. No markdown formatting.
{
    "firewall_rule": "The regex string (e.g. /union\\s+select/i)",
    "code_patch": "The FULL python code of the fixed file.",
    "explanation": "A short explanation of the fix."
}

Context for Code Patch:
The vulnerable code uses raw f-strings for SQL queries:
query = f"SELECT * FROM users WHERE username = '{username}'"

Fix this by using parameterized queries (sqlite3 '?' placeholder) or input sanitization.
Return the COMPLETE file content with the fix applied.
ENSURE THE CODE IS PRODUCTION-READY.
- Add comments explaining specifically HOW the fix prevents the attack.
- Use best practices.
- Do NOT include markdown code blocks in the JSON string value.

`

export async function evolveFirewallRule(specificLogStr?: string): Promise<{ success: boolean, analyzed_command?: string, generated_rule?: string, code_patch_applied?: boolean, message?: string }> {
    try {
        // 1. Fetch the latest attack log
        // Use provided string if automated, or pop from Redis if polling
        let logStr: string | null | undefined = specificLogStr

        if (!logStr) {
            // lpop: Remove and return the FIRST element (HEAD) of the list. 
            // Since honeypot uses lpush (adds to head), lpop gets the NEWEST log (LIFO).
            logStr = await redis.lpop('attack:logs')
        }

        // DEMO HACK: If no real logs, but we are in Mock mode, pretend we saw one.
        if (!logStr && USE_MOCK) {
            logStr = JSON.stringify({ command: "ADMIN' OR '1'='1' --" })
        }

        if (!logStr) {
            return { success: false, message: 'No new attacks to analyze.' }
        }

        const log = typeof logStr === 'string' ? JSON.parse(logStr) : logStr
        const attackCommand = log.command


        // 2. Ask Gemini (or Mock) to generate a rule AND patch
        const model = getGeminiModel()
        let regexStr = ''
        let codePatch = ''

        if (USE_MOCK) {
            // Mock Rules for Demo
            if (attackCommand.includes("ADMIN") || attackCommand.includes("' OR '1'='1'")) {
                regexStr = "/(' OR '1'='1')|(\\s+OR\\s+)/i"
                codePatch = `# FIXED CODE\nquery = "SELECT * FROM users WHERE username = ?"\ncursor.execute(query, (username,))`
            } else if (attackCommand.includes("<script>")) {
                regexStr = "/<script\\b[^>]*>([\\s\\S]*?)<\\/script>/i"
            } else {
                regexStr = "/(union\\s+select|benchmark|sleep)/i" // Default Catch-all
            }
        } else {
            console.log("✨ Gemini Evolving Defense Rule & Code Patch...")
            const result = await model.generateContent([
                EVOLVE_SYSTEM_PROMPT,
                `Malicious Input: "${attackCommand}"`,
                `Current Vulnerable Code:\n${fs.readFileSync(path.join(process.cwd(), 'dummy/vulnerable_app.py'), 'utf-8')}`
            ])
            const responseText = result.response.text().replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim()

            try {
                const json = JSON.parse(responseText)
                regexStr = json.firewall_rule
                codePatch = json.code_patch
            } catch (e) {
                console.error("Failed to parse Gemini JSON:", responseText)
                regexStr = "/.*/" // Fallback
            }
        }

        // 3. Store the new rule
        // DISABLING LIVE FIREWALL UPDATE for Self-Healing Demo to prevent blocking Admin/User traffic.
        // We only want to demonstrate the Code Patching on the dummy file.
        // if (regexStr) await redis.lpush('firewall:rules', regexStr)
        if (regexStr) console.log(`Example Rule Generated (Not Applied): ${regexStr}`)

        // 4. Apply Code Patch (Self-Healing)
        let patchApplied = false
        if (codePatch) {
            try {
                const dummyPath = path.join(process.cwd(), 'dummy/vulnerable_app.py')
                fs.writeFileSync(dummyPath, codePatch)
                console.log("🩹 Self-Healing Patch Applied to dummy/vulnerable_app.py")
                patchApplied = true

                // Log patch event?
                await redis.lpush('patch:history', JSON.stringify({
                    timestamp: Date.now(),
                    trigger: attackCommand,
                    patch: codePatch
                }))

            } catch (err) {
                console.error("Failed to apply patch:", err)
            }
        }

        return {
            success: true,
            analyzed_command: attackCommand,
            generated_rule: regexStr,
            code_patch_applied: patchApplied
        }

    } catch (error) {
        console.error('Evolution Error:', error)
        return { success: false, message: 'Failed to evolve' }
    }
}
