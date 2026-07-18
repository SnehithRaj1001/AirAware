import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSqlFile(filePath) {
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    await db.query(sql);
    console.log('SQL script executed successfully');
  } catch (error) {
    console.error('Error executing SQL script:', error.message);
  } finally {
    await db.end();
  }
}

runSqlFile(path.join(__dirname, 'addFileNameColumn.sql'));