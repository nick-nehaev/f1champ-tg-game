import fs from 'fs';
import path from 'path';
import pool from './db';
import { seedDatabase } from './db/seed';

async function initDatabase() {
  console.log('Initializing database...');

  try {
    // Читаем SQL схему
    const schemaPath = path.join(__dirname, 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Выполняем SQL
    console.log('Creating tables...');
    await pool.query(schema);
    console.log('Tables created successfully!');

    // Заполняем начальными данными
    console.log('Seeding database...');
    await seedDatabase();

    console.log('Database initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initDatabase();
