import { 
  type User, type InsertUser,
  type Patient, type InsertPatient,
  type Doctor, type InsertDoctor,
  type MedicalRecord, type InsertMedicalRecord,
  type Vital, type InsertVital,
  type ConsentSession, type InsertConsentSession,
  type Encounter, type InsertEncounter,
  type AuditLog, type InsertAuditLog
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Patient management
  getPatient(id: string): Promise<Patient | undefined>;
  getPatientByUserId(userId: string): Promise<Patient | undefined>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: string, updates: Partial<Patient>): Promise<Patient | undefined>;

  // Doctor management
  getDoctor(id: string): Promise<Doctor | undefined>;
  getDoctorByUserId(userId: string): Promise<Doctor | undefined>;
  getDoctorByRegistrationNumber(regNo: string): Promise<Doctor | undefined>;
  createDoctor(doctor: InsertDoctor): Promise<Doctor>;
  updateDoctor(id: string, updates: Partial<Doctor>): Promise<Doctor | undefined>;

  // Medical records
  getMedicalRecord(id: string): Promise<MedicalRecord | undefined>;
  getMedicalRecordsByPatient(patientId: string): Promise<MedicalRecord[]>;
  createMedicalRecord(record: InsertMedicalRecord): Promise<MedicalRecord>;
  deleteMedicalRecord(id: string): Promise<boolean>;

  // Vitals
  getVitalsByPatient(patientId: string, limit?: number): Promise<Vital[]>;
  getLatestVitalsByType(patientId: string, type: string): Promise<Vital | undefined>;
  createVital(vital: InsertVital): Promise<Vital>;

  // Consent sessions
  getConsentSession(shareCode: string): Promise<ConsentSession | undefined>;
  getActiveConsentSessions(patientId: string): Promise<ConsentSession[]>;
  createConsentSession(session: InsertConsentSession): Promise<ConsentSession>;
  updateConsentSession(id: string, updates: Partial<ConsentSession>): Promise<ConsentSession | undefined>;
  expireConsentSession(id: string): Promise<boolean>;

  // Encounters
  getEncountersByPatient(patientId: string): Promise<Encounter[]>;
  createEncounter(encounter: InsertEncounter): Promise<Encounter>;

  // Audit logs
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(patientId: string, limit?: number): Promise<AuditLog[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private patients: Map<string, Patient> = new Map();
  private doctors: Map<string, Doctor> = new Map();
  private medicalRecords: Map<string, MedicalRecord> = new Map();
  private vitals: Map<string, Vital> = new Map();
  private consentSessions: Map<string, ConsentSession> = new Map();
  private encounters: Map<string, Encounter> = new Map();
  private auditLogs: Map<string, AuditLog> = new Map();

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.phone === phone);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      isVerified: false,
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  // Patient methods
  async getPatient(id: string): Promise<Patient | undefined> {
    return this.patients.get(id);
  }

  async getPatientByUserId(userId: string): Promise<Patient | undefined> {
    return Array.from(this.patients.values()).find(patient => patient.userId === userId);
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const id = randomUUID();
    const patient: Patient = { ...insertPatient, id };
    this.patients.set(id, patient);
    return patient;
  }

  async updatePatient(id: string, updates: Partial<Patient>): Promise<Patient | undefined> {
    const patient = this.patients.get(id);
    if (!patient) return undefined;
    const updated = { ...patient, ...updates };
    this.patients.set(id, updated);
    return updated;
  }

  // Doctor methods
  async getDoctor(id: string): Promise<Doctor | undefined> {
    return this.doctors.get(id);
  }

  async getDoctorByUserId(userId: string): Promise<Doctor | undefined> {
    return Array.from(this.doctors.values()).find(doctor => doctor.userId === userId);
  }

  async getDoctorByRegistrationNumber(regNo: string): Promise<Doctor | undefined> {
    return Array.from(this.doctors.values()).find(doctor => doctor.registrationNumber === regNo);
  }

  async createDoctor(insertDoctor: InsertDoctor): Promise<Doctor> {
    const id = randomUUID();
    const doctor: Doctor = { 
      ...insertDoctor, 
      id, 
      isVerified: false,
      verificationDocuments: null 
    };
    this.doctors.set(id, doctor);
    return doctor;
  }

  async updateDoctor(id: string, updates: Partial<Doctor>): Promise<Doctor | undefined> {
    const doctor = this.doctors.get(id);
    if (!doctor) return undefined;
    const updated = { ...doctor, ...updates };
    this.doctors.set(id, updated);
    return updated;
  }

  // Medical records methods
  async getMedicalRecord(id: string): Promise<MedicalRecord | undefined> {
    return this.medicalRecords.get(id);
  }

  async getMedicalRecordsByPatient(patientId: string): Promise<MedicalRecord[]> {
    return Array.from(this.medicalRecords.values())
      .filter(record => record.patientId === patientId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createMedicalRecord(insertRecord: InsertMedicalRecord): Promise<MedicalRecord> {
    const id = randomUUID();
    const record: MedicalRecord = { 
      ...insertRecord, 
      id, 
      createdAt: new Date(),
      recordDate: insertRecord.recordDate || new Date()
    };
    this.medicalRecords.set(id, record);
    return record;
  }

  async deleteMedicalRecord(id: string): Promise<boolean> {
    return this.medicalRecords.delete(id);
  }

  // Vitals methods
  async getVitalsByPatient(patientId: string, limit = 50): Promise<Vital[]> {
    return Array.from(this.vitals.values())
      .filter(vital => vital.patientId === patientId)
      .sort((a, b) => (b.recordedAt?.getTime() || 0) - (a.recordedAt?.getTime() || 0))
      .slice(0, limit);
  }

  async getLatestVitalsByType(patientId: string, type: string): Promise<Vital | undefined> {
    return Array.from(this.vitals.values())
      .filter(vital => vital.patientId === patientId && vital.type === type)
      .sort((a, b) => (b.recordedAt?.getTime() || 0) - (a.recordedAt?.getTime() || 0))[0];
  }

  async createVital(insertVital: InsertVital): Promise<Vital> {
    const id = randomUUID();
    const vital: Vital = { 
      ...insertVital, 
      id, 
      recordedAt: new Date(),
      source: insertVital.source || 'patient'
    };
    this.vitals.set(id, vital);
    return vital;
  }

  // Consent session methods
  async getConsentSession(shareCode: string): Promise<ConsentSession | undefined> {
    return Array.from(this.consentSessions.values())
      .find(session => session.shareCode === shareCode);
  }

  async getActiveConsentSessions(patientId: string): Promise<ConsentSession[]> {
    const now = new Date();
    return Array.from(this.consentSessions.values())
      .filter(session => 
        session.patientId === patientId && 
        session.status === 'active' && 
        session.expiresAt > now
      );
  }

  async createConsentSession(insertSession: InsertConsentSession): Promise<ConsentSession> {
    const id = randomUUID();
    const session: ConsentSession = { 
      ...insertSession, 
      id, 
      createdAt: new Date() 
    };
    this.consentSessions.set(id, session);
    return session;
  }

  async updateConsentSession(id: string, updates: Partial<ConsentSession>): Promise<ConsentSession | undefined> {
    const session = this.consentSessions.get(id);
    if (!session) return undefined;
    const updated = { ...session, ...updates };
    this.consentSessions.set(id, updated);
    return updated;
  }

  async expireConsentSession(id: string): Promise<boolean> {
    const session = this.consentSessions.get(id);
    if (!session) return false;
    session.status = 'expired';
    this.consentSessions.set(id, session);
    return true;
  }

  // Encounter methods
  async getEncountersByPatient(patientId: string): Promise<Encounter[]> {
    return Array.from(this.encounters.values())
      .filter(encounter => encounter.patientId === patientId)
      .sort((a, b) => (b.encounterDate?.getTime() || 0) - (a.encounterDate?.getTime() || 0));
  }

  async createEncounter(insertEncounter: InsertEncounter): Promise<Encounter> {
    const id = randomUUID();
    const encounter: Encounter = { 
      ...insertEncounter, 
      id, 
      encounterDate: new Date() 
    };
    this.encounters.set(id, encounter);
    return encounter;
  }

  // Audit log methods
  async createAuditLog(insertLog: InsertAuditLog): Promise<AuditLog> {
    const id = randomUUID();
    const log: AuditLog = { 
      ...insertLog, 
      id, 
      timestamp: new Date() 
    };
    this.auditLogs.set(id, log);
    return log;
  }

  async getAuditLogs(patientId: string, limit = 100): Promise<AuditLog[]> {
    return Array.from(this.auditLogs.values())
      .filter(log => log.patientId === patientId)
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
