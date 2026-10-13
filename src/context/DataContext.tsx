import { createContext, useCallback, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from '@/context/AuthContext'
import { samplePersonaFor } from '@/services/authService'
import { demoAppointments, demoMedications } from '@/data/demoAppointments'
import { demoAppointmentRequests } from '@/data/demoAppointmentRequests'
import { demoNotifications } from '@/data/demoNotifications'
import { DEMO_PROFILE } from '@/data/demoUser'
import { demoRecords } from '@/data/demoRecords'
import { demoWellnessGoals, seededHabits } from '@/data/demoWellness'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import {
  activeMedicationCount,
  createAppointment,
  createMedication,
  markMedicationTaken,
} from '@/services/appointmentsService'
import type { NewAppointmentInput, NewMedicationInput } from '@/services/appointmentsService'
import {
  createAppointmentRequests,
  decideRequest,
} from '@/services/appointmentRequestsService'
import type { NewAppointmentRequestInput } from '@/services/appointmentRequestsService'
import { deliverDecisionToPatient } from '@/services/requestDeliveryService'
import {
  buildPrescription,
  deliverPrescriptionToPatient,
  deliverRecordSeenToPatient,
} from '@/services/careDeliveryService'
import type { PrescribeInput } from '@/services/careDeliveryService'
import { patientScopeId } from '@/services/patientScope'
import { createFeedback } from '@/services/feedbackService'
import type { NewFeedbackInput } from '@/services/feedbackService'
import { createRecord } from '@/services/recordsService'
import type { NewRecordInput } from '@/services/recordsService'
import { STORAGE_KEYS, storageService } from '@/services/storageService'
import type {
  AppNotification,
  Appointment,
  ChatMessage,
  ChatThread,
  Habit,
  MedicalRecord,
  Medication,
  WellnessGoal,
} from '@/types/health'
import type { UserProfile } from '@/types/user'
import type { AppointmentRequest, PatientRecordShare, Prescription } from '@/types/practice'
import type { Feedback } from '@/types/feedback'
import { currentDoctorFor } from '@/data/doctorsData'
import { doctorDisplayName, uid } from '@/utils/formatters'

interface DataContextValue {
  /* Profile */
  profile: UserProfile
  updateProfile: (patch: Partial<UserProfile>) => void

  /* Health */
  /** User-edited current weight (kg), or null to use the generated sample. */
  weightKg: number | null
  updateWeight: (kg: number) => void
  /** Restores the generated sample reading. */
  clearWeight: () => void

  /* Records */
  records: MedicalRecord[]
  addRecord: (input: NewRecordInput) => MedicalRecord
  updateRecord: (id: string, patch: Partial<MedicalRecord>) => void
  removeRecord: (id: string) => void

  /* Medications */
  medications: Medication[]
  activeMedicationCount: number
  addMedication: (input: NewMedicationInput) => Medication
  updateMedication: (id: string, patch: Partial<Medication>) => void
  removeMedication: (id: string) => void
  toggleMedicationTaken: (id: string) => void

  /* Appointments */
  appointments: Appointment[]
  addAppointment: (input: NewAppointmentInput) => Appointment
  updateAppointment: (id: string, patch: Partial<Appointment>) => void
  removeAppointment: (id: string) => void
  cancelAppointment: (id: string) => void

  /**
   * Appointment requests are a shared collection so the doctor and patient
   * sides on this device can cooperate. A patient applies to one or more
   * doctors, each doctor accepts or cancels, and the patient is notified.
   */
  appointmentRequests: AppointmentRequest[]
  requestAppointment: (input: NewAppointmentRequestInput) => AppointmentRequest[]
  decideAppointmentRequest: (
    id: string,
    decision: 'accepted' | 'cancelled',
    note?: string,
  ) => AppointmentRequest | undefined

  /**
   * Patient-uploaded records published to the care team. A patient's own
   * records stay scoped; this is the labelled copy clinicians review.
   */
  patientRecordShares: PatientRecordShare[]
  /** Marks a shared record as reviewed and notifies the patient. */
  markPatientRecordReviewed: (id: string) => PatientRecordShare | undefined

  /** Prescriptions written by clinicians (shared, doctor-authored). */
  prescriptions: Prescription[]
  /** Issues a prescription and delivers it into the patient's medicine list. */
  prescribeMedication: (input: PrescribeInput) => Prescription

  /* Wellness */
  goals: WellnessGoal[]
  addGoal: (goal: Omit<WellnessGoal, 'id' | 'createdAt'>) => WellnessGoal
  updateGoal: (id: string, patch: Partial<WellnessGoal>) => void
  removeGoal: (id: string) => void
  habits: Habit[]
  toggleHabit: (id: string, date: string) => void

  /* Notifications */
  notifications: AppNotification[]
  unreadCount: number
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  clearNotifications: () => void

  /* Feedback */
  /**
   * Shared board — every patient and doctor on this device sees the same
   * entries. Anyone can post as many as they like.
   */
  feedback: Feedback[]
  addFeedback: (input: NewFeedbackInput) => Feedback

  /* Assistant chat */
  chatThreads: ChatThread[]
  activeThreadId: string | null
  setActiveThreadId: (id: string | null) => void
  createThread: (title: string) => ChatThread
  appendMessage: (threadId: string, message: ChatMessage) => void
  updateMessage: (threadId: string, messageId: string, patch: Partial<ChatMessage>) => void
  renameThread: (id: string, title: string) => void
  deleteThread: (id: string) => void
  clearChatHistory: () => void

  /* Demo */
  resetDemoData: () => void
}

const DataContext = createContext<DataContextValue | null>(null)

const isArray = <T,>(value: unknown): value is T[] => Array.isArray(value)

function welcomeThread(): ChatThread[] {
  const now = new Date().toISOString()
  return [
    {
      id: 'thread_welcome',
      title: 'Getting started',
      createdAt: now,
      updatedAt: now,
      messages: [
        {
          id: 'msg_welcome',
          role: 'assistant',
          isDemo: true,
          createdAt: now,
          content: `Hello! I'm the Health Copilot assistant. My answers come from a built-in library of general health education and clearly-labelled sample data.

I can help you:
- Understand the layout of a health report and what common terms mean.
- Prepare questions for an upcoming appointment.
- Think through routines for sleep, movement, hydration and stress.
- Find your way around the records, medicines and appointments you store here.

I do not diagnose, prescribe, or read your uploaded files — and you should always confirm anything personal with your own clinician.`,
        },
      ],
    },
  ]
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()

  const persona = samplePersonaFor(session?.email)
  const isPatientPersona = persona === 'patient'

  // Only the built-in patient persona is pre-seeded with sample data. Doctors
  // and newly issued accounts start clean and build their own records.
  const seedProfile: UserProfile = isPatientPersona
    ? DEMO_PROFILE
    : {
        ...DEMO_PROFILE,
        id: session?.userId ?? 'anonymous',
        fullName: session?.fullName ?? 'Account holder',
        email: session?.email ?? '',
        phone: undefined,
        dateOfBirth: undefined,
        emergencyContactName: undefined,
        emergencyContactPhone: undefined,
        createdAt: new Date().toISOString(),
      }

  // Every user's data is stored under their own key so accounts never share
  // records, medicines, schedules or conversations on the same device. The key
  // comes from the profile's stable id: the built-in patient persona keeps its
  // seeded id (`user_sample_patient`) in every mode, so the sample data — and
  // any decision delivered by the sample doctor — always lines up, whether the
  // account signed in locally or through Firebase.
  const scopeId = seedProfile.id
  const scoped = (key: string) => `${key}:${scopeId}`
  const profileKey = `${STORAGE_KEYS.profile}:${scopeId}`
  const seedRecords = useMemo(() => (isPatientPersona ? demoRecords : []), [isPatientPersona])
  const seedMedications = useMemo(
    () => (isPatientPersona ? demoMedications : []),
    [isPatientPersona],
  )
  const seedAppointments = useMemo(
    () => (isPatientPersona ? demoAppointments : []),
    [isPatientPersona],
  )
  // Appointment requests are a shared pool: the sample requests are seeded
  // regardless of role so the doctor portal has something to review.
  const seedAppointmentRequests = useMemo(() => demoAppointmentRequests, [])
  const seedGoals = useMemo(() => (isPatientPersona ? demoWellnessGoals : []), [isPatientPersona])
  const seedHabits = useMemo(() => (isPatientPersona ? seededHabits() : []), [isPatientPersona])
  const seedNotifications = useMemo(
    () => (isPatientPersona ? demoNotifications : []),
    [isPatientPersona],
  )

  const [profile, setProfile] = useLocalStorage<UserProfile>(profileKey, seedProfile)
  const [records, setRecords] = useLocalStorage<MedicalRecord[]>(
    scoped(STORAGE_KEYS.records),
    seedRecords,
    isArray<MedicalRecord>,
  )
  const [medications, setMedications] = useLocalStorage<Medication[]>(
    scoped(STORAGE_KEYS.medications),
    seedMedications,
    isArray<Medication>,
  )
  const [appointments, setAppointments] = useLocalStorage<Appointment[]>(
    scoped(STORAGE_KEYS.appointments),
    seedAppointments,
    isArray<Appointment>,
  )
  const [appointmentRequests, setAppointmentRequests] = useLocalStorage<AppointmentRequest[]>(
    STORAGE_KEYS.appointmentRequests,
    seedAppointmentRequests,
    isArray<AppointmentRequest>,
  )
  const [goals, setGoals] = useLocalStorage<WellnessGoal[]>(
    scoped(STORAGE_KEYS.goals),
    seedGoals,
    isArray<WellnessGoal>,
  )
  const [habits, setHabits] = useLocalStorage<Habit[]>(
    scoped(STORAGE_KEYS.habits),
    seedHabits,
    isArray<Habit>,
  )
  const [notifications, setNotifications] = useLocalStorage<AppNotification[]>(
    scoped(STORAGE_KEYS.notifications),
    seedNotifications,
    isArray<AppNotification>,
  )
  const [chatThreads, setChatThreads] = useLocalStorage<ChatThread[]>(
    scoped(STORAGE_KEYS.chatThreads),
    welcomeThread(),
    isArray<ChatThread>,
  )
  const [activeThreadId, setActiveThreadId] = useLocalStorage<string | null>(
    `${scoped(STORAGE_KEYS.chatThreads)}:active`,
    null,
    (value): value is string | null => value === null || typeof value === 'string',
  )
  const [weightKg, setWeightKg] = useLocalStorage<number | null>(
    scoped(STORAGE_KEYS.weightKg),
    null,
    (value): value is number | null => value === null || typeof value === 'number',
  )
  // Feedback is shared across roles, like appointment requests: one board for
  // every patient and doctor on this device.
  const [feedback, setFeedback] = useLocalStorage<Feedback[]>(
    STORAGE_KEYS.feedback,
    [],
    isArray<Feedback>,
  )
  // Care-team collections are shared so the two sides can cooperate: a
  // patient's uploads show up for clinicians, and clinician prescriptions are
  // listed on the doctor side (each is delivered into the patient's own list).
  const [patientRecordShares, setPatientRecordShares] = useLocalStorage<PatientRecordShare[]>(
    STORAGE_KEYS.patientRecords,
    [],
    isArray<PatientRecordShare>,
  )
  const [prescriptions, setPrescriptions] = useLocalStorage<Prescription[]>(
    STORAGE_KEYS.prescriptions,
    [],
    isArray<Prescription>,
  )

  /* ----------------------------- profile ----------------------------- */
  const updateProfile = useCallback(
    (patch: Partial<UserProfile>) => setProfile((previous) => ({ ...previous, ...patch })),
    [setProfile],
  )

  /* ------------------------------ health ----------------------------- */
  const updateWeight = useCallback((kg: number) => setWeightKg(kg), [setWeightKg])

  const clearWeight = useCallback(() => setWeightKg(null), [setWeightKg])

  /* ----------------------------- records ----------------------------- */
  const addRecord = useCallback(
    (input: NewRecordInput) => {
      const record = createRecord(input)
      setRecords((previous) => [record, ...previous])

      // A patient's upload is also published to the care-team inbox so a
      // clinician can review it. Doctor-side accounts have no upload UI.
      if (session?.role === 'patient') {
        const share: PatientRecordShare = {
          id: uid('share'),
          record,
          patientId: patientScopeId(session.email, session.userId),
          patientName: session.fullName,
          patientEmail: session.email,
          sharedAt: new Date().toISOString(),
        }
        setPatientRecordShares((previous) => [share, ...previous])
      }

      return record
    },
    [setRecords, setPatientRecordShares, session],
  )

  const updateRecord = useCallback(
    (id: string, patch: Partial<MedicalRecord>) =>
      setRecords((previous) => previous.map((r) => (r.id === id ? { ...r, ...patch } : r))),
    [setRecords],
  )

  const removeRecord = useCallback(
    (id: string) => setRecords((previous) => previous.filter((r) => r.id !== id)),
    [setRecords],
  )

  /* --------------------------- medications --------------------------- */
  const addMedication = useCallback(
    (input: NewMedicationInput) => {
      const medication = createMedication(input)
      setMedications((previous) => [medication, ...previous])
      return medication
    },
    [setMedications],
  )

  const updateMedication = useCallback(
    (id: string, patch: Partial<Medication>) =>
      setMedications((previous) => previous.map((m) => (m.id === id ? { ...m, ...patch } : m))),
    [setMedications],
  )

  const removeMedication = useCallback(
    (id: string) => setMedications((previous) => previous.filter((m) => m.id !== id)),
    [setMedications],
  )

  const toggleMedicationTaken = useCallback(
    (id: string) =>
      setMedications((previous) =>
        previous.map((m) => (m.id === id ? markMedicationTaken(m) : m)),
      ),
    [setMedications],
  )

  /* --------------------------- appointments -------------------------- */
  const addAppointment = useCallback(
    (input: NewAppointmentInput) => {
      const appointment = createAppointment(input)
      setAppointments((previous) => [appointment, ...previous])
      return appointment
    },
    [setAppointments],
  )

  const updateAppointment = useCallback(
    (id: string, patch: Partial<Appointment>) =>
      setAppointments((previous) => previous.map((a) => (a.id === id ? { ...a, ...patch } : a))),
    [setAppointments],
  )

  const removeAppointment = useCallback(
    (id: string) => setAppointments((previous) => previous.filter((a) => a.id !== id)),
    [setAppointments],
  )

  const cancelAppointment = useCallback(
    (id: string) =>
      setAppointments((previous) =>
        previous.map((a) => (a.id === id ? { ...a, status: 'cancelled' } : a)),
      ),
    [setAppointments],
  )

  /* ----------------------- appointment requests ---------------------- */
  const requestAppointment = useCallback(
    (input: NewAppointmentRequestInput) => {
      const requests = createAppointmentRequests(input)
      if (requests.length === 0) return requests

      setAppointmentRequests((previous) => [...requests, ...previous])

      // Confirm to the patient that their application has gone out.
      const notification: AppNotification = {
        id: uid('notif'),
        kind: 'appointment',
        title:
          requests.length === 1
            ? `Request sent to ${requests[0].doctorName}`
            : `Request sent to ${requests.length} doctors`,
        message: `${input.title.trim()} — you will be notified when a doctor responds.`,
        createdAt: new Date().toISOString(),
        read: false,
        link: '/appointments',
      }
      setNotifications((previous) => [notification, ...previous])

      return requests
    },
    [setAppointmentRequests, setNotifications],
  )

  const decideAppointmentRequest = useCallback(
    (id: string, decision: 'accepted' | 'cancelled', note?: string) => {
      const request = appointmentRequests.find((candidate) => candidate.id === id)
      if (!request || request.status !== 'pending') return request

      const decided = decideRequest(request, decision, note)
      const { appointment } = deliverDecisionToPatient(decided, decision)
      const finalRequest = appointment ? { ...decided, appointmentId: appointment.id } : decided

      setAppointmentRequests((previous) =>
        previous.map((candidate) => (candidate.id === id ? finalRequest : candidate)),
      )
      return finalRequest
    },
    [appointmentRequests, setAppointmentRequests],
  )

  /* --------------------------- care team ----------------------------- */
  // The clinician's display name, resolved from the directory when possible so
  // the sample doctor reads as "Dr. Priya Raman" everywhere.
  const clinicianName = currentDoctorFor(session?.email)?.name ?? doctorDisplayName(session?.fullName)

  const markPatientRecordReviewed = useCallback(
    (id: string) => {
      const share = patientRecordShares.find((candidate) => candidate.id === id)
      if (!share || share.reviewedAt) return share

      const reviewed: PatientRecordShare = {
        ...share,
        reviewedAt: new Date().toISOString(),
        reviewedBy: clinicianName,
      }
      setPatientRecordShares((previous) =>
        previous.map((candidate) => (candidate.id === id ? reviewed : candidate)),
      )
      // Tell the patient a clinician has seen their report.
      deliverRecordSeenToPatient(reviewed, clinicianName)
      return reviewed
    },
    [patientRecordShares, setPatientRecordShares, clinicianName],
  )

  const prescribeMedication = useCallback(
    (input: PrescribeInput) => {
      const prescription = buildPrescription(input)
      // Lands in the patient's own medicine list and notifies them.
      deliverPrescriptionToPatient(prescription)
      setPrescriptions((previous) => [prescription, ...previous])
      return prescription
    },
    [setPrescriptions],
  )

  /* ----------------------------- wellness ---------------------------- */
  const addGoal = useCallback(
    (goal: Omit<WellnessGoal, 'id' | 'createdAt'>) => {
      const created: WellnessGoal = { ...goal, id: uid('goal'), createdAt: new Date().toISOString() }
      setGoals((previous) => [...previous, created])
      return created
    },
    [setGoals],
  )

  const updateGoal = useCallback(
    (id: string, patch: Partial<WellnessGoal>) =>
      setGoals((previous) => previous.map((g) => (g.id === id ? { ...g, ...patch } : g))),
    [setGoals],
  )

  const removeGoal = useCallback(
    (id: string) => setGoals((previous) => previous.filter((g) => g.id !== id)),
    [setGoals],
  )

  const toggleHabit = useCallback(
    (id: string, date: string) =>
      setHabits((previous) =>
        previous.map((habit) => {
          if (habit.id !== id) return habit
          const done = habit.completedDates.includes(date)
          return {
            ...habit,
            completedDates: done
              ? habit.completedDates.filter((d) => d !== date)
              : [...habit.completedDates, date],
          }
        }),
      ),
    [setHabits],
  )

  /* -------------------------- notifications -------------------------- */
  const markNotificationRead = useCallback(
    (id: string) =>
      setNotifications((previous) =>
        previous.map((n) => (n.id === id ? { ...n, read: true } : n)),
      ),
    [setNotifications],
  )

  const markAllNotificationsRead = useCallback(
    () => setNotifications((previous) => previous.map((n) => ({ ...n, read: true }))),
    [setNotifications],
  )

  const clearNotifications = useCallback(() => setNotifications([]), [setNotifications])

  /* ----------------------------- feedback ---------------------------- */
  const addFeedback = useCallback(
    (input: NewFeedbackInput) => {
      const created = createFeedback(input)
      setFeedback((previous) => [created, ...previous])
      return created
    },
    [setFeedback],
  )

  /* ------------------------------- chat ------------------------------ */
  const createThread = useCallback(
    (title: string) => {
      const now = new Date().toISOString()
      const thread: ChatThread = { id: uid('thread'), title, createdAt: now, updatedAt: now, messages: [] }
      setChatThreads((previous) => [thread, ...previous])
      setActiveThreadId(thread.id)
      return thread
    },
    [setChatThreads, setActiveThreadId],
  )

  const appendMessage = useCallback(
    (threadId: string, message: ChatMessage) =>
      setChatThreads((previous) =>
        previous.map((thread) =>
          thread.id === threadId
            ? { ...thread, messages: [...thread.messages, message], updatedAt: new Date().toISOString() }
            : thread,
        ),
      ),
    [setChatThreads],
  )

  const updateMessage = useCallback(
    (threadId: string, messageId: string, patch: Partial<ChatMessage>) =>
      setChatThreads((previous) =>
        previous.map((thread) =>
          thread.id === threadId
            ? {
                ...thread,
                messages: thread.messages.map((m) => (m.id === messageId ? { ...m, ...patch } : m)),
              }
            : thread,
        ),
      ),
    [setChatThreads],
  )

  const deleteThread = useCallback(
    (id: string) => {
      setChatThreads((previous) => previous.filter((thread) => thread.id !== id))
      setActiveThreadId((current) => (current === id ? null : current))
    },
    [setChatThreads, setActiveThreadId],
  )

  const renameThread = useCallback(
    (id: string, title: string) =>
      setChatThreads((previous) =>
        previous.map((thread) =>
          thread.id === id ? { ...thread, title, updatedAt: new Date().toISOString() } : thread,
        ),
      ),
    [setChatThreads],
  )

  const clearChatHistory = useCallback(() => {
    setChatThreads([])
    setActiveThreadId(null)
  }, [setChatThreads, setActiveThreadId])

  /* ------------------------------- reset ------------------------------ */
  const resetDemoData = useCallback(() => {
    storageService.clearDemoData()
    setRecords(seedRecords)
    setMedications(seedMedications)
    setAppointments(seedAppointments)
    setAppointmentRequests(seedAppointmentRequests)
    setGoals(seedGoals)
    setHabits(seedHabits)
    setNotifications(seedNotifications)
    setWeightKg(null)
    setFeedback([])
    setPatientRecordShares([])
    setPrescriptions([])
    setChatThreads(welcomeThread())
    setActiveThreadId(null)
  }, [
    setRecords,
    setMedications,
    setAppointments,
    setAppointmentRequests,
    setGoals,
    setHabits,
    setNotifications,
    setWeightKg,
    setFeedback,
    setPatientRecordShares,
    setPrescriptions,
    setChatThreads,
    setActiveThreadId,
    seedRecords,
    seedMedications,
    seedAppointments,
    seedAppointmentRequests,
    seedGoals,
    seedHabits,
    seedNotifications,
  ])

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  )

  const activeMedCount = useMemo(() => activeMedicationCount(medications), [medications])

  const value = useMemo<DataContextValue>(
    () => ({
      profile,
      updateProfile,
      weightKg,
      updateWeight,
      clearWeight,
      records,
      addRecord,
      updateRecord,
      removeRecord,
      medications,
      activeMedicationCount: activeMedCount,
      addMedication,
      updateMedication,
      removeMedication,
      toggleMedicationTaken,
      appointments,
      addAppointment,
      updateAppointment,
      removeAppointment,
      cancelAppointment,
      appointmentRequests,
      requestAppointment,
      decideAppointmentRequest,
      patientRecordShares,
      markPatientRecordReviewed,
      prescriptions,
      prescribeMedication,
      goals,
      addGoal,
      updateGoal,
      removeGoal,
      habits,
      toggleHabit,
      notifications,
      unreadCount,
      markNotificationRead,
      markAllNotificationsRead,
      clearNotifications,
      feedback,
      addFeedback,
      chatThreads,
      activeThreadId,
      setActiveThreadId,
      createThread,
      appendMessage,
      updateMessage,
      renameThread,
      deleteThread,
      clearChatHistory,
      resetDemoData,
    }),
    [
      profile,
      updateProfile,
      weightKg,
      updateWeight,
      clearWeight,
      records,
      addRecord,
      updateRecord,
      removeRecord,
      medications,
      activeMedCount,
      addMedication,
      updateMedication,
      removeMedication,
      toggleMedicationTaken,
      appointments,
      addAppointment,
      updateAppointment,
      removeAppointment,
      cancelAppointment,
      appointmentRequests,
      requestAppointment,
      decideAppointmentRequest,
      patientRecordShares,
      markPatientRecordReviewed,
      prescriptions,
      prescribeMedication,
      goals,
      addGoal,
      updateGoal,
      removeGoal,
      habits,
      toggleHabit,
      notifications,
      unreadCount,
      markNotificationRead,
      markAllNotificationsRead,
      clearNotifications,
      feedback,
      addFeedback,
      chatThreads,
      activeThreadId,
      setActiveThreadId,
      createThread,
      appendMessage,
      updateMessage,
      renameThread,
      deleteThread,
      clearChatHistory,
      resetDemoData,
    ],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useAppData(): DataContextValue {
  const context = useContext(DataContext)
  if (!context) throw new Error('useAppData must be used inside a DataProvider')
  return context
}
