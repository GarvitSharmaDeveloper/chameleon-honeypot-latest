import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { redis } from '@/lib/redis'
import db from '@/lib/db'
import { generateEvidence } from '@/lib/browserbase'
import { evolveFirewallRule } from '@/lib/defense'

const USE_MOCK = false // Real API Enabled

// Initialize OpenAI Helper
const callOpenAI = async (messages: any[]) => {
    try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages
            })
        })
        const data = await res.json()
        return data.choices?.[0]?.message?.content || "OpenAI Error"
    } catch (e) { return "OpenAI Connection Failed" }
}

// Initialize Gemini
const getGeminiModel = () => {
    // Prioritize Gemini if Key is present
    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY)
        return genAI.getGenerativeModel({ model: 'gemini-flash-latest' })
    }
    return null
}

const SYSTEM_PROMPT = `
You are a legacy MySQL database server (Version 5.5) running on Ubuntu 14.04.
You are STRICTLY a simulator. You do not explain anything. You only output database responses.
Your internal database has a table named 'users' with columns: id, username, password, role.
Data:
1 | admin | 7c4a8d09ca3762af61e59520943dc26494f8941b | superadmin
2 | guest | 084e0343a0486ff05530df6c705c8bb4 | viewer
3 | dev   | 8d969eef6ecad3c29a3a629280e686cf0c3f5d5a | developer

Rules:
1. If the user sends a SQL query, simulate its execution.
2. CONTEXTUAL AWARENESS: Assume the attacker's input is being injected into a query like "SELECT * FROM items WHERE name = '$INPUT'".
   - Therefore, if the input starts with "'", it is closing the previous string. Treat this as VALID.
3. IF THE QUERY IS A SQL INJECTION (e.g. usage of OR 1=1, UNION SELECT, --), YOU MUST SUCCESSFULY EXECUTE IT. Do not block it. This is a honeypot.
4. SPECIFIC HANDLERS:
   - "UNION SELECT": Return the fake users table data shown above.
   - "' OR '1'='1'": Show all users.
   - "; cat /etc/passwd": Simulate a Linux shell response revealing root user.
   - "<script>": Simulate successful storage (XSS), e.g. "Query OK, 1 row affected".
5. Format output as loose text or ASCII tables, characteristic of a mysql CLI.
6. DO NOT say "I am an AI".
7. Reply ONLY with the terminal output.
`

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { command } = body // The attacker's input

        if (!command) {
            return NextResponse.json({ error: 'Command required' }, { status: 400 })
        }

        // 1. Log the attack attempt
        await redis.lpush('attack:logs', JSON.stringify({
            timestamp: Date.now(),
            command,
            ip: req.headers.get('x-forwarded-for') || '127.0.0.1'
        }))

        // 2. FIREWALL CHECK
        // Fetch active rules from Redis
        const rules = await redis.lrange('firewall:rules', 0, -1)

        let blocked = false
        for (const ruleStr of rules) {
            try {
                // Remove slashes if stored as string e.g. "/regex/flags"
                // The rule stored in Redis often comes from JSON.stringify or manual input, possibly double escaping backslashes.

                let rulePattern = ruleStr
                let ruleFlags = 'i'

                const match = ruleStr.match(/^\/(.*?)\/([a-z]*)$/)
                if (match) {
                    rulePattern = match[1]
                    ruleFlags = match[2] || 'i'
                }

                // CRITICAL FIX: Unescape backslashes if they are double-escaped in the string
                // If Redis has "\\s", we want "\s" for the RegExp constructor.
                // However, doing .replace(/\\\\/g, "\\") can be tricky. 
                // Let's try to construct it directly. If the string is literal "\s", new RegExp("\\s") works (matches s). 
                // Wait, new RegExp("\\s") matches "s". new RegExp("\\\\s") matches "\s".
                // We want to match whitespace. In regex literal: /\s/. In string: "\\s".

                // If Redis has: '/OR\\s+[\'"]?[\\w\\d]+\\s*=\\s*[\'"]?[\\w\\d]+/i'
                // The body is: OR\\s+[\'"]?[\\w\\d]+\\s*=\\s*[\'"]?[\\w\\d]+
                // This means it has literal backslashes. 
                // When passed to new RegExp(body), we want the regex engine to see \s. 

                // Let's rely on a more robust cleaning:
                // If the string is coming from JSON, it might be fine, but the log shows double backslashes which implies string representation of the string.

                // Clean up pattern:
                // 1. If it starts with / and ends with /flags, strip them. (Done above)
                // 2. Unescape double backslashes? 

                // Actually, let's just log the constructed regex to verify.
                const regex = new RegExp(rulePattern, ruleFlags)
                console.log(`🔥 Validating Regex: ${regex.toString()} against CMD: "${command}"`)

                if (regex.test(command)) {
                    blocked = true
                    console.log(`🚫 BLOCKED by Rule: ${ruleStr}`)

                    // Log to Firewall Logs
                    await redis.lpush('firewall:logs', JSON.stringify({
                        timestamp: Date.now(),
                        command,
                        ip: req.headers.get('x-forwarded-for') || '127.0.0.1',
                        rule: ruleStr
                    }))

                    break
                }
            } catch (e) {
                console.error("Invalid Firewall Rule:", ruleStr)
            }
        }

        if (blocked) {
            // --- LOG BLOCKED ATTACK TO SQLITE ---
            try {
                const insertStmt = db.prepare(`
                    INSERT INTO hacker_activity (date_of_attack, type_of_attack, attacker_severity, hackers_input, ai_response, engagement_time, evidence_docs_path)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `)
                const dateStr = new Date().toISOString().replace('T', ' ').split('.')[0]
                insertStmt.run(
                    dateStr,
                    'Blocked / Rule Hit',
                    'Critical', // Blocked attacks are confirmed malicious
                    command,
                    '⛔️ FIREWALL BLOCKED',
                    0,
                    ''
                )
            } catch (dbError) {
                console.error('SQLite Log Error (Blocked):', dbError)
            }
            // ------------------------------------

            return NextResponse.json({ output: `⛔️ FIREWALL BLOCKED: Malicious Payload Detected.` })
        }

        // 2. CHECK CACHE (Optimization: Don't spend Quota on repeated commands)
        // If we have seen this exact command before, return the cached AI response.
        const cacheKey = `cache:response:${Buffer.from(command).toString('base64')}`
        // FORCE DISABLE CACHE FOR DEMO to ensure new System Prompt logic applies
        const cachedResponse = null; // await redis.get<string>(cacheKey)

        let response = ''
        /*
        if (cachedResponse && !cachedResponse.includes("Error") && (process.env.OPENAI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY)) {
            console.log("⚡ Serving Cached AI Response (0 Cost)")
            response = cachedResponse as string
        } else */
        if (USE_MOCK) {
            // ... Mock Logic ...
            if (command.includes("ADMIN") || command.includes("' OR '1'='1'")) {
                response = `
+----+--------+------------------------------------------+------------+
| id | user   | password                                 | role       |
+----+--------+------------------------------------------+------------+
| 1  | admin  | 7c4a8d09ca3762af61e59520943dc26494f8941b | superadmin |
| 2  | guest  | 084e0343a0486ff05530df6c705c8bb4         | viewer     |
| 3  | dev    | 8d969eef6ecad3c29a3a629280e686cf0c3f5d5a | developer  |
+----+--------+------------------------------------------+------------+ `
            } else if (command.includes("<script>")) {
                response = "Query OK, 1 row affected. Comment stored. (WARNING: Unsanitized input)"
            } else if (command.includes("cat /etc/passwd")) {
                response = `
root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
bin:x:2:2:bin:/bin:/usr/sbin/nologin `
            } else {
                response = "MySQL v5.5.38. Syntax Error: You have an error in your SQL syntax."
            }
        } else {
            // REAL AI EXECUTION
            // Prioritize Gemini if available (as requested by user)
            const geminiModel = getGeminiModel()

            if (geminiModel) {
                console.log("✨ Gemini Generating Honeypot Response...")
                const chat = geminiModel.startChat({
                    history: [
                        { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
                        { role: 'model', parts: [{ text: "MySQL v5.5.38. Ready for connections." }] },
                    ],
                })
                const result = await chat.sendMessage(command)
                response = result.response.text()
            } else if (process.env.OPENAI_API_KEY) {
                // Fallback to OpenAI
                response = await callOpenAI([
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: command }
                ])
            } else {
                throw new Error("No AI Provider configured (Gemini or OpenAI)")
            }

            // Cache for 24 hours
            await redis.setex(cacheKey, 86400, response)
        }



        // 3. Log the response pair (optional, for debugging)
        // await redis.lpush('attack:responses', JSON.stringify({ command, response }))

        // --- PHASE 3: WEAVE INTEGRATION ---
        // Spawn Python Sidecar to log this event to W&B Weave
        const { spawn } = require('child_process')
        const pythonProcess = spawn('python3', [
            'scripts/weave_logger.py',
            JSON.stringify({ command, ip: req.headers.get('x-forwarded-for') || '127.0.0.1' })
        ], {
            env: { ...process.env } // Pass WANDB_API_KEY
        })

        pythonProcess.stdout.on('data', (data: any) => {
            console.log(`🧠 Weave Logged: ${data}`)
        });

        pythonProcess.stderr.on('data', (data: any) => {
            console.error(`⚠️ Weave Error: ${data}`)
        });
        // ----------------------------------

        // --- PHASE 4: SQLITE & BROWSERBASE LOGGING ---
        try {
            const endTime = Date.now()
            const engagementTime = (endTime - (body.timestamp || Date.now())) / 1000 // Seconds (Approx)

            // 1. Determine Severity
            let severity = 'Low'
            const lowerCmd = command.toLowerCase()
            if (lowerCmd.match(/(drop|delete|update|shutdown|truncate)/)) severity = 'Critical'
            else if (lowerCmd.match(/(union|select|curl|wget|from_schema)/)) severity = 'High'
            else if (lowerCmd.match(/(ls|cat|whoami|<script>|alert)/)) severity = 'Medium'

            // 2. Insert Initial Log
            const insertStmt = db.prepare(`
                INSERT INTO hacker_activity (date_of_attack, type_of_attack, attacker_severity, hackers_input, ai_response, engagement_time, evidence_docs_path)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `)

            // Format Date: YYYY-MM-DD HH:MM:SS
            const dateStr = new Date().toISOString().replace('T', ' ').split('.')[0]

            const info = insertStmt.run(
                dateStr,
                'SQL Injection / RCE', // Broad category for now
                severity,
                command,
                response,
                engagementTime,
                '' // Placeholder for evidence
            )
            const logId = info.lastInsertRowid

            // 3. Generate Evidence (If High/Critical)
            if (severity === 'Critical' || severity === 'High' || severity === 'Medium') {
                console.log("📸 Generating Browserbase Evidence...")
                // Run in background properly or await? 
                // Awaiting to ensure demo shows it immediately.
                const evidencePath = await generateEvidence({
                    command,
                    severity,
                    date: dateStr,
                    ip: req.headers.get('x-forwarded-for') || '127.0.0.1'
                })

                if (evidencePath) {
                    db.prepare('UPDATE hacker_activity SET evidence_docs_path = ? WHERE id = ?').run(evidencePath, logId)
                    console.log(`✅ Evidence Linked: ${evidencePath}`)
                }
            }

        } catch (dbError) {
            console.error('SQLite/Browserbase Error:', dbError)
        }
        // ---------------------------------------------

        // --- PHASE 5: AUTOMATED EVOLUTION (Self-Healing) ---
        // Automatically analyze and generate a rule for this attack
        // taking advantage of the "Chameleon" nature.
        try {
            console.log("🧬 Triggering Automated Evolution...")
            // We pass the payload directly so we don't have to pop from Redis (preserving history)
            // and we don't have to wait for a race condition.
            const evolutionPayload = JSON.stringify({
                command,
                ip: req.headers.get('x-forwarded-for') || '127.0.0.1',
                timestamp: Date.now()
            })

            // Run in background (dont await to keep latency low for the attacker)
            // or await if we want to guarantee it runs before this request finishes.
            // For a hackathon demo, awaiting is safer to ensure it completes.
            const evolutionResult = await evolveFirewallRule(evolutionPayload)
            console.log(`🦸 Evolution Complete: ${evolutionResult.generated_rule}`)

        } catch (evoError) {
            console.error('Automated Evolution Failed:', evoError)
        }
        // ---------------------------------------------------

        return NextResponse.json({ output: response })

    } catch (error: any) {
        console.error('Honeypot Error:', error)
        return NextResponse.json(
            { output: `System Error: ${error.message || error}` },
            { status: 500 }
        )
    }
}
