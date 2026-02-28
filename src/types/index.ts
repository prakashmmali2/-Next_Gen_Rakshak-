export type UserRole = 'patient' | 'caregiver' | 'doctor';

export interface User {
  id: number;
  name: string;
  age?: number;
  username?: string;
  role: UserRole;
  uniqueCode: string;
  relation?: string;
  specialization?: string;
  createdAt: string;
}

export interface Medicine {
  id: number;
  patientId: number;
  name: string;
  dosage: string;
  frequency: string;
  times: string; // JSON string array of times
  stock: number;
  instructions?: string;
  createdAt: string;
}

export interface MedicineLog {
  id: number;
  medicineId: number;
  patientId: number;
  scheduledTime: string;
  takenAt?: string;
  status: 'pending' | 'taken' | 'missed' | 'skipped';
  notes?: string;
  createdAt: string;
}

export interface AdherenceStat {
  id: number;
  patientId: number;
  date: string;
  totalDoses: number;
  takenDoses: number;
  adherenceRate: number;
}

export interface Relationship {
  id: number;
  patientId: number;
  caregiverId?: number;
  doctorId?: number;
  relationshipType: string;
  linkedAt: string;
}

export interface FaceScanReport {
  id: number;
  patientId: number;
  scanResult: string;
  confidence: number;
  scannedAt: string;
}

// Navigation Types
export type PatientStackParamList = {
  PatientHome: undefined;
  PatientMedicines: undefined;
  AddMedicine: undefined;
  MedicineDetail: { medicineId: number };
  PatientAdherence: undefined;
  PatientProfile: undefined;
  FaceScan: undefined;
};

export type CaregiverStackParamList = {
  CaregiverDashboard: undefined;
  PatientMedicines: { patientId: number };
  CaregiverAdherence: { patientId: number };
  Notifications: undefined;
  Alerts: undefined;
  CaregiverProfile: undefined;
};

export type DoctorStackParamList = {
  DoctorDashboard: undefined;
  PatientList: undefined;
  PatientAdherenceReport: { patientId: number };
  Consultations: undefined;
  DoctorProfile: undefined;
};

export type AuthStackParamList = {
  RoleSelection: undefined;
  PatientRegister: undefined;
  CaregiverRegister: undefined;
  DoctorRegister: undefined;
  Login: undefined;
};

export type RootTabParamList = {
  HomeTab: undefined;
  MedicinesTab: undefined;
  AdherenceTab: undefined;
  ProfileTab: undefined;
};
