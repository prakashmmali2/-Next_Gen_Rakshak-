import { getDatabase } from '../database/database';
import { User, UserRole } from '../types';

const generateUniqueCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'OM';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const createPatient = async (
  name: string,
  age: number,
  username: string
): Promise<{ user: User; uniqueCode: string }> => {
  const db = await getDatabase();
  const uniqueCode = generateUniqueCode();
  
  const result = await db.runAsync(
    'INSERT INTO Users (name, age, username, role, uniqueCode) VALUES (?, ?, ?, ?, ?)',
    [name, age, username, 'patient', uniqueCode]
  );
  
  const user: User = {
    id: result.lastInsertRowId,
    name,
    age,
    username,
    role: 'patient',
    uniqueCode,
    createdAt: new Date().toISOString(),
  };
  
  return { user, uniqueCode };
};

export const createCaregiver = async (
  name: string,
  relation: string,
  patientCode: string
): Promise<{ success: boolean; user?: User; error?: string }> => {
  const db = await getDatabase();
  
  // Validate patient code
  const patient = await db.getFirstAsync<User>(
    'SELECT * FROM Users WHERE uniqueCode = ? AND role = ?',
    [patientCode, 'patient']
  );
  
  if (!patient) {
    return { success: false, error: 'Invalid Patient Code.' };
  }
  
  // Create caregiver
  const result = await db.runAsync(
    'INSERT INTO Users (name, relation, role, uniqueCode) VALUES (?, ?, ?, ?)',
    [name, relation, 'caregiver', generateUniqueCode()]
  );
  
  const caregiver: User = {
    id: result.lastInsertRowId,
    name,
    relation,
    role: 'caregiver',
    uniqueCode: generateUniqueCode(),
    createdAt: new Date().toISOString(),
  };
  
  // Create relationship
  await db.runAsync(
    'INSERT INTO Relationships (patientId, caregiverId, relationshipType) VALUES (?, ?, ?)',
    [patient.id, caregiver.id, relation]
  );
  
  return { success: true, user: caregiver };
};

export const createDoctor = async (
  name: string,
  specialization: string,
  patientCode: string
): Promise<{ success: boolean; user?: User; error?: string }> => {
  const db = await getDatabase();
  
  // Validate patient code
  const patient = await db.getFirstAsync<User>(
    'SELECT * FROM Users WHERE uniqueCode = ? AND role = ?',
    [patientCode, 'patient']
  );
  
  if (!patient) {
    return { success: false, error: 'Invalid Patient Code.' };
  }
  
  // Create doctor
  const result = await db.runAsync(
    'INSERT INTO Users (name, specialization, role, uniqueCode) VALUES (?, ?, ?, ?)',
    [name, specialization, 'doctor', generateUniqueCode()]
  );
  
  const doctor: User = {
    id: result.lastInsertRowId,
    name,
    specialization,
    role: 'doctor',
    uniqueCode: generateUniqueCode(),
    createdAt: new Date().toISOString(),
  };
  
  // Create relationship
  await db.runAsync(
    'INSERT INTO Relationships (patientId, doctorId, relationshipType) VALUES (?, ?, ?)',
    [patient.id, doctor.id, specialization]
  );
  
  return { success: true, user: doctor };
};

export const loginUser = async (
  username: string,
  uniqueCode: string
): Promise<User | null> => {
  const db = await getDatabase();
  
  const user = await db.getFirstAsync<User>(
    'SELECT * FROM Users WHERE (username = ? OR uniqueCode = ?) AND uniqueCode = ?',
    [username, uniqueCode, uniqueCode]
  );
  
  return user || null;
};

export const getUserById = async (id: number): Promise<User | null> => {
  const db = await getDatabase();
  const user = await db.getFirstAsync<User>('SELECT * FROM Users WHERE id = ?', [id]);
  return user || null;
};

export const getPatientsByCaregiver = async (caregiverId: number): Promise<User[]> => {
  const db = await getDatabase();
  const patients = await db.getAllAsync<User>(
    `SELECT u.* FROM Users u
     INNER JOIN Relationships r ON u.id = r.patientId
     WHERE r.caregiverId = ?`,
    [caregiverId]
  );
  return patients;
};

export const getPatientsByDoctor = async (doctorId: number): Promise<User[]> => {
  const db = await getDatabase();
  const patients = await db.getAllAsync<User>(
    `SELECT u.* FROM Users u
     INNER JOIN Relationships r ON u.id = r.patientId
     WHERE r.doctorId = ?`,
    [doctorId]
  );
  return patients;
};

export const getLinkedPatient = async (
  caregiverOrDoctorId: number,
  role: UserRole
): Promise<User | null> => {
  const db = await getDatabase();
  
  let patient: User | null = null;
  
  if (role === 'caregiver') {
    patient = await db.getFirstAsync<User>(
      `SELECT u.* FROM Users u
       INNER JOIN Relationships r ON u.id = r.patientId
       WHERE r.caregiverId = ?
       LIMIT 1`,
      [caregiverOrDoctorId]
    );
  } else if (role === 'doctor') {
    patient = await db.getFirstAsync<User>(
      `SELECT u.* FROM Users u
       INNER JOIN Relationships r ON u.id = r.patientId
       WHERE r.doctorId = ?
       LIMIT 1`,
      [caregiverOrDoctorId]
    );
  }
  
  return patient || null;
};
