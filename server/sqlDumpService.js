const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

/**
 * Export entire database to SQL dump format
 * @param {string} dbPath - Path to the database file
 * @returns {string} SQL dump as text
 */
function exportDatabaseToSQL(dbPath) {
    const db = new Database(dbPath, { readonly: true });
    let sqlDump = '-- SQLite Database Dump\n';
    sqlDump += `-- Generated: ${new Date().toISOString()}\n\n`;

    // Get all tables
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();

    for (const table of tables) {
        const tableName = table.name;

        // Get CREATE TABLE statement
        const createStmt = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name = ?").get(tableName);
        sqlDump += `-- Table: ${tableName}\n`;
        sqlDump += `DROP TABLE IF EXISTS ${tableName};\n`;
        sqlDump += `${createStmt.sql};\n\n`;

        // Get all data
        const rows = db.prepare(`SELECT * FROM ${tableName}`).all();

        if (rows.length > 0) {
            // Get column names
            const columns = Object.keys(rows[0]);
            const columnList = columns.join(', ');

            sqlDump += `-- Data for ${tableName}\n`;
            for (const row of rows) {
                const values = columns.map(col => {
                    const val = row[col];
                    if (val === null) return 'NULL';
                    if (typeof val === 'number') return val;
                    // Escape single quotes in strings
                    return `'${String(val).replace(/'/g, "''")}'`;
                }).join(', ');

                sqlDump += `INSERT INTO ${tableName} (${columnList}) VALUES (${values});\n`;
            }
            sqlDump += '\n';
        }
    }

    db.close();
    return sqlDump;
}

/**
 * Import SQL dump into database
 * @param {string} dbPath - Path to the database file
 * @param {string} sqlDump - SQL dump text
 */
function importDatabaseFromSQL(dbPath, sqlDump) {
    // Delete existing database if it exists
    if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
    }

    const db = new Database(dbPath);

    // Split into individual statements and execute
    const statements = sqlDump
        .split('\n')
        .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
        .join('\n')
        .split(';')
        .filter(stmt => stmt.trim().length > 0);

    db.exec('BEGIN TRANSACTION');

    try {
        for (const statement of statements) {
            const trimmed = statement.trim();
            if (trimmed) {
                db.exec(trimmed + ';');
            }
        }
        db.exec('COMMIT');
    } catch (err) {
        db.exec('ROLLBACK');
        db.close();
        throw err;
    }

    db.close();
}

module.exports = {
    exportDatabaseToSQL,
    importDatabaseFromSQL
};
