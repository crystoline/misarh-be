import fs from 'fs';
import path from 'path';
import pool from '../config/database';

async function migrate() {
    const client = await pool.connect();

    try {
        console.log('🔄 Starting database migrations...');

        // Create migrations table
        await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // Get executed migrations
        const { rows: executed } = await client.query('SELECT name FROM migrations');
        const executedNames = new Set(executed.map(row => row.name));

        // Get migration files
        const migrationsDir = path.join(__dirname, '../database/migrations');
        if (!fs.existsSync(migrationsDir)) {
            console.log('No migrations directory found.');
            return;
        }

        const files = fs.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort();

        for (const file of files) {
            if (!executedNames.has(file)) {
                console.log(`Running migration: ${file}`);
                const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

                await client.query('BEGIN');
                try {
                    await client.query(sql);
                    await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
                    await client.query('COMMIT');
                    console.log(`✅ Completed: ${file}`);
                } catch (err) {
                    await client.query('ROLLBACK');
                    console.error(`❌ Failed: ${file}`, err);
                    throw err;
                }
            } else {
                console.log(`Skipping: ${file} (already executed)`);
            }
        }

        console.log('✨ All migrations completed successfully!');
    } catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
