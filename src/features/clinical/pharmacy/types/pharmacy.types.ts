export interface Medicine {
  id: number;
  name: string;
  is_active: boolean;
  warehouse_item_id: number | null;
}

export interface SideEffectType {
  id: number;
  name: string;
  is_active: boolean;
}

export interface DispenseBatchLine {
  warehouse_stock_batch_id: number;
  quantity: number;
}

export interface PatientMedicinePrescription {
  id: number;
  patient_id: number;
  opd_visit_id: number;
  medicine_id: number;
  medicine_name: string | null;
  prescribed_by: string;
  quantity: number;
  dose_level: number;
  prescribed_for: number | null;
  weightage_level: string | null;
  weightage_unit: string | null;
  table_spoons: string | null;
  times_a_day: number;
  no_of_days: string;
  is_dispensed: boolean;
  dispense_batches: DispenseBatchLine[] | null;
  created_at: string;
}

export interface PrescribeMedicineItem {
  medicine_id: number;
  quantity: number;
  dose_level: number;
  prescribed_for?: number;
  weightage_level?: string;
  weightage_unit?: string;
  table_spoons?: string;
  times_a_day: number;
  no_of_days: string;
}

export interface PrescribeMedicinesRequest {
  prescribed_by: string;
  items: PrescribeMedicineItem[];
}

export interface PatientMedicineSideEffect {
  id: number;
  patient_id: number;
  medicine_id: number;
  medicine_name: string | null;
  side_effect_type_id: number;
  side_effect_type_name: string | null;
  comments: string | null;
  created_at: string;
}

export interface LogSideEffectRequest {
  patient_id: number;
  medicine_id: number;
  side_effect_type_id: number;
  comments?: string;
}
