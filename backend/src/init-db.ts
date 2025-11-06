import fs from 'fs';
import path from 'path';
import pool from './db';
import { seedDatabase } from './db/seed';

async function initDatabase() {
  console.log('Initializing database...');

  try {
    // Читаем основную SQL схему
    const schemaPath = path.join(__dirname, 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Выполняем основную SQL схему
    console.log('Creating tables...');
    await pool.query(schema);
    console.log('Tables created successfully!');

    // Читаем и применяем обновления схемы
    const updatePath = path.join(__dirname, 'db', 'schema-update.sql');
    if (fs.existsSync(updatePath)) {
      console.log('Applying schema updates...');
      const updateSchema = fs.readFileSync(updatePath, 'utf8');
      await pool.query(updateSchema);
      console.log('Schema updates applied!');
    }

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
