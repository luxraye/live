export type BloodGroup = 'O-' | 'O+' | 'A-' | 'A+' | 'B-' | 'B+' | 'AB-' | 'AB+'

export type Component = 'Packed RBC' | 'Fresh Frozen Plasma' | 'Cryoprecipitate' | 'Platelets'

export type OrderPriority = 'STAT' | 'ELECTIVE'

export type OrderStatus =
  | 'DISPATCHED'
  | 'CROSSMATCHING'
  | 'READY'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'TRANSFUSED'

export interface BloodOrder {
  id: string
  priority: OrderPriority
  patientId: string
  bloodGroup: BloodGroup
  component: Component
  units: number
  indication: string
  destination: string
  status: OrderStatus
  createdAt: number
  etaSeconds: number | null
  ledgerRef?: string
}

export interface ScanResult {
  patientBarcode: string | null
  bagBarcode: string | null
  patientGroup: BloodGroup | null
  bagGroup: BloodGroup | null
  match: boolean | null
}

export type ReactionType = 'Fever' | 'Urticaria' | 'Tachycardia' | 'Hematuria'

export interface ReactionAlert {
  id: string
  types: ReactionType[]
  unitId: string
  patientId: string
  sentAt: number
  acknowledged: boolean
}

export interface SurveyPayload {
  platform: 'aegis-clinical'
  easeOfOrdering: number
  verificationSpeed: number
  nps: number
  feedback: string
  role: string
  submittedAt: string
}
