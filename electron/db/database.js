import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

const isDev = !app.isPackaged;
const dbPath = isDev
    ? path.join(process.cwd(), 'database.sqlite')
    : path.join(app.getPath('userData'), 'database.sqlite');

const db = new Database(dbPath);

export default db;
