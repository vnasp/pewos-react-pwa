// ============================================================
// Shared types — migrated from dogs-calendar-react-native
// ============================================================

export type AppointmentType =
  | "control"
  | "examenes"
  | "operacion"
  | "fisioterapia"
  | "vacuna"
  | "desparasitacion"
  | "otro";

export type RecurrencePattern =
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "none";

export type ExerciseType =
  | "caminata"
  | "cavaletti"
  | "balanceo"
  | "slalom"
  | "entrenamiento"
  | "otro";

export type CareType =
  | "limpieza_herida"
  | "frio"
  | "calor"
  | "infrarrojo"
  | "laser"
  | "otro";

export type ScheduleType = "hours" | "meals";

export type NotificationTime =
  | "none"
  | "15min"
  | "30min"
  | "1h"
  | "2h"
  | "1day";

export interface Dog {
  id: string;
  name: string;
  photo?: string;
  breed: string;
  birthDate: Date;
  gender: "male" | "female";
  isNeutered: boolean;
}

export interface Appointment {
  id: string;
  dogId: string;
  dogName: string;
  date: Date;
  time: string;
  type: AppointmentType;
  customTypeDescription?: string;
  notes?: string;
  notificationTime: NotificationTime;
  notificationId?: string;
  recurrencePattern?: RecurrencePattern;
  recurrenceEndDate?: Date;
  recurrenceParentId?: string;
}

export interface Medication {
  id: string;
  dogId: string;
  dogName: string;
  name: string;
  dosage: string;
  scheduleType: ScheduleType;
  frequencyHours?: number;
  startTime?: string;
  mealIds?: string[];
  durationDays: number;
  startDate: Date;
  scheduledTimes: string[];
  endDate: Date;
  notes?: string;
  isActive: boolean;
  notificationTime: NotificationTime;
  notificationIds: string[];
}

export interface Exercise {
  id: string;
  dogId: string;
  dogName: string;
  type: ExerciseType;
  customTypeDescription?: string;
  durationMinutes: number;
  timesPerDay: number;
  startTime: string;
  endTime: string;
  scheduledTimes: string[];
  startDate: Date;
  isPermanent: boolean;
  durationWeeks?: number;
  endDate?: Date;
  notes?: string;
  isActive: boolean;
  notificationTime: NotificationTime;
  notificationIds: string[];
}

export interface Care {
  id: string;
  dogId: string;
  dogName: string;
  type: CareType;
  customTypeDescription?: string;
  durationMinutes: number;
  timesPerDay: number;
  startTime: string;
  endTime: string;
  scheduledTimes: string[];
  startDate: Date;
  isPermanent: boolean;
  durationDays?: number;
  endDate?: Date;
  notes?: string;
  isActive: boolean;
  notificationTime: NotificationTime;
}

export interface MealTime {
  id: string;
  userId: string;
  name: string;
  time: string; // HH:mm
  order: number;
}

export interface Completion {
  id: string;
  userId: string;
  itemType: "medication" | "exercise" | "appointment" | "care";
  itemId: string;
  scheduledTime?: string;
  completedDate: string;
  completedAt: Date;
}

export interface SharedAccess {
  id: string;
  ownerId: string;
  ownerEmail: string;
  sharedWithEmail: string;
  sharedWithId?: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
}
