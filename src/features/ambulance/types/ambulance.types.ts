export interface Vehicle {
  id: number;
  registration_number: string;
  opening_reading: number;
  current_reading: number;
}

export interface Driver {
  id: number;
  name: string;
  contact: string;
  cnic: string;
  license_no: string;
  address: string;
}

export interface DestinationHospital {
  id: number;
  name: string;
}

export type AmbulanceType = 'in_house' | 'external';
export type ReferredFromDepartment = 'ipd' | 'er';
export type TripStatus = 'dispatched' | 'returned';

export interface Trip {
  id: number;
  patient_id: number;
  patient_name: string | null;
  patient_discharge_id: number | null;
  destination_hospital_id: number;
  destination_hospital_name: string | null;
  referred_from_department: ReferredFromDepartment;
  ward_id: number | null;
  ward_name: string | null;
  doctor_name: string | null;
  ambulance_type: AmbulanceType;
  vehicle_id: number | null;
  vehicle_registration_number: string | null;
  driver_id: number | null;
  driver_name: string | null;
  opening_reading: number | null;
  closing_reading: number | null;
  external_vehicle_number: string | null;
  external_driver_name: string | null;
  external_driver_cnic: string | null;
  external_driver_contact: string | null;
  status: TripStatus;
  requested_at: string;
}

export interface DispatchTripRequest {
  patient_id: number;
  patient_discharge_id?: number;
  destination_hospital_id: number;
  referred_from_department: ReferredFromDepartment;
  ward_id?: number;
  doctor_name?: string;
  ambulance_type: AmbulanceType;
  vehicle_id?: number;
  driver_id?: number;
  opening_reading?: number;
  external_vehicle_number?: string;
  external_driver_name?: string;
  external_driver_cnic?: string;
  external_driver_contact?: string;
}

export interface ReturnTripRequest {
  closing_reading: number;
}

export interface TripListParams {
  status?: TripStatus;
  patient_id?: number;
  per_page?: number;
  page?: number;
}

export interface TripReportParams {
  vehicle_id?: number;
  date_from?: string;
  date_to?: string;
}
