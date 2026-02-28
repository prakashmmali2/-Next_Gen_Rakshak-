import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('ownmedicare.db');
  return db;
};

export const initDatabase = async (): Promise<void> => {
  const database = await getDatabase();
  
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    
    CREATE TABLE IF NOT EXISTS Users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      age INTEGER,
      username TEXT,
      role TEXT NOT NULL,
      uniqueCode TEXT UNIQUE NOT NULL,
      relation TEXT,
      specialization TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS Medicines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patientId INTEGER NOT NULL,
      name TEXT NOT NULL,
      dosage TEXT NOT NULL,
      frequency TEXT NOT NULL,
      times TEXT NOT NULL,
      stock INTEGER DEFAULT 0,
      instructions TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patientId) REFERENCES Users(id)
    );
    
    CREATE TABLE IF NOT EXISTS MedicineLogs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      medicineId INTEGER NOT NULL,
      patientId INTEGER NOT NULL,
      scheduledTime TEXT NOT NULL,
      takenAt TEXT,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (medicineId) REFERENCES Medicines(id),
      FOREIGN KEY (patientId) REFERENCES Users(id)
    );
    
    CREATE TABLE IF NOT EXISTS AdherenceStats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patientId INTEGER NOT NULL,
      date TEXT NOT NULL,
      totalDoses INTEGER DEFAULT 0,
      takenDoses INTEGER DEFAULT 0,
      adherenceRate REAL DEFAULT 0,
      FOREIGN KEY (patientId) REFERENCES Users(id)
    );
    
    CREATE TABLE IF NOT EXISTS Relationships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patientId INTEGER NOT NULL,
      caregiverId INTEGER,
      doctorId INTEGER,
      relationshipType TEXT NOT NULL,
      linkedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patientId) REFERENCES Users(id),
      FOREIGN KEY (caregiverId) REFERENCES Users(id),
      FOREIGN KEY (doctorId) REFERENCES Users(id)
    );
    
    CREATE TABLE IF NOT EXISTS FaceScanReports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patientId INTEGER NOT NULL,
      scanResult TEXT NOT NULL,
      confidence REAL DEFAULT 0,
      scannedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patientId) REFERENCES Users(id)
    );
  `);
};

export const closeDatabase = async (): Promise<void> => {
  if (db) {
    await db.closeAsync();
    db = null;
  }
};
