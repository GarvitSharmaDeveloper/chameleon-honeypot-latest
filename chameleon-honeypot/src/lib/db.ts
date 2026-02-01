import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

// Initialize DB
const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production'
const dbPath = isVercel ? path.join('/tmp', 'honeypot.db') : path.join(process.cwd(), 'honeypot.db')

// On Vercel, copy the initial DB to /tmp if it doesn't exist
if (isVercel && !fs.existsSync(dbPath)) {
    try {
        const seedPath = path.join(process.cwd(), 'honeypot.db')
        if (fs.existsSync(seedPath)) {
            fs.copyFileSync(seedPath, dbPath)
            console.log('✅ Seeded SQLite DB to /tmp')
        }
    } catch (e) {
        console.error('Failed to seed DB:', e)
    }
}

const db = new Database(dbPath)

// Initialize Tables
const initDb = () => {
    db.exec(`
        CREATE TABLE IF NOT EXISTS hacker_activity (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date_of_attack TEXT,
            type_of_attack TEXT,
            attacker_severity TEXT,
            hackers_input TEXT,
            ai_response TEXT,
            engagement_time REAL,
            evidence_docs_path TEXT
        )
    `)
    console.log('📦 SQLite DB Initialized')
}

initDb()

export default db
