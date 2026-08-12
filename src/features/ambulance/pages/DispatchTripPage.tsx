import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { GeneratedForm } from '@/components/forms/GeneratedForm';
import { useFeedback } from '@/hooks/useFeedback';
import { applyServerValidationErrors, getErrorMessage } from '@/utils/errors';
import { useDestinationHospitals } from './DestinationHospitalsPage';
import { useVehicles } from './VehiclesPage';
import { useDrivers } from './DriversPage';
import { useWards } from '@/features/clinical/ipd/pages/WardsPage';
import { useDispatchTrip } from '../hooks/useTrips';
import type { FieldConfig } from '@/components/forms/FieldConfig';

const baseSchema = {
  patient_id: z.number({ required_error: 'Patient ID is required' }),
  destination_hospital_id: z.number({ required_error: 'Destination hospital is required' }),
  referred_from_department: z.enum(['ipd', 'er'], { required_error: 'Required' }),
  ward_id: z.number().optional(),
  doctor_name: z.string().max(150).optional().or(z.literal('')),
  ambulance_type: z.enum(['in_house', 'external'], { required_error: 'Required' }),
};

const schema = z
  .object({
    ...baseSchema,
    vehicle_id: z.number().optional(),
    driver_id: z.number().optional(),
    opening_reading: z.number().optional(),
    external_vehicle_number: z.string().max(50).optional().or(z.literal('')),
    external_driver_name: z.string().max(150).optional().or(z.literal('')),
    external_driver_cnic: z.string().max(20).optional().or(z.literal('')),
    external_driver_contact: z.string().max(30).optional().or(z.literal('')),
  })
  .refine((d) => d.ambulance_type !== 'in_house' || (d.vehicle_id && d.driver_id), {
    message: 'Vehicle and driver are required for an in-house ambulance',
    path: ['vehicle_id'],
  })
  .refine((d) => d.ambulance_type !== 'external' || (d.external_vehicle_number && d.external_driver_name), {
    message: 'External vehicle number and driver name are required',
    path: ['external_vehicle_number'],
  });
type FormValues = z.infer<typeof schema>;

const commonFields: FieldConfig<FormValues>[] = [
  { type: 'number', name: 'patient_id', label: 'Patient ID', required: true, min: 1 },
];

export function DispatchTripPage() {
  const navigate = useNavigate();
  const { message } = useFeedback();
  const hospitalsQuery = useDestinationHospitals({ per_page: 0 });
  const vehiclesQuery = useVehicles({ per_page: 0 });
  const driversQuery = useDrivers({ per_page: 0 });
  const wardsQuery = useWards({ per_page: 0 });
  const dispatch = useDispatchTrip();

  const {
    control,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { ambulance_type: 'in_house', referred_from_department: 'ipd' } });

  const ambulanceType = watch('ambulance_type');

  const hospitalOptions = useMemo(() => (hospitalsQuery.data?.data ?? []).map((h) => ({ label: h.name, value: h.id })), [hospitalsQuery.data]);
  const vehicleOptions = useMemo(() => (vehiclesQuery.data?.data ?? []).map((v) => ({ label: v.registration_number, value: v.id })), [vehiclesQuery.data]);
  const driverOptions = useMemo(() => (driversQuery.data?.data ?? []).map((d) => ({ label: d.name, value: d.id })), [driversQuery.data]);
  const wardOptions = useMemo(() => (wardsQuery.data?.data ?? []).map((w) => ({ label: w.name, value: w.id })), [wardsQuery.data]);

  const contextFields: FieldConfig<FormValues>[] = [
    { type: 'select', name: 'destination_hospital_id', label: 'Destination Hospital', required: true, options: hospitalOptions },
    {
      type: 'select',
      name: 'referred_from_department',
      label: 'Referred From',
      required: true,
      options: [
        { label: 'IPD', value: 'ipd' },
        { label: 'ER', value: 'er' },
      ],
    },
    { type: 'select', name: 'ward_id', label: 'Ward', options: wardOptions },
    { type: 'text', name: 'doctor_name', label: 'Doctor Name' },
    {
      type: 'select',
      name: 'ambulance_type',
      label: 'Ambulance Type',
      required: true,
      options: [
        { label: 'In-house', value: 'in_house' },
        { label: 'External', value: 'external' },
      ],
    },
  ];

  const inHouseFields: FieldConfig<FormValues>[] = [
    { type: 'section', label: 'Vehicle Assignment' },
    { type: 'select', name: 'vehicle_id', label: 'Vehicle', required: true, options: vehicleOptions },
    { type: 'select', name: 'driver_id', label: 'Driver', required: true, options: driverOptions },
    { type: 'number', name: 'opening_reading', label: 'Opening Reading', min: 0, helpText: "Defaults to the vehicle's current reading if left blank" },
  ];

  const externalFields: FieldConfig<FormValues>[] = [
    { type: 'section', label: 'External Vehicle Details' },
    { type: 'text', name: 'external_vehicle_number', label: 'External Vehicle Number', required: true },
    { type: 'text', name: 'external_driver_name', label: 'External Driver Name', required: true },
    { type: 'text', name: 'external_driver_cnic', label: 'External Driver CNIC' },
    { type: 'text', name: 'external_driver_contact', label: 'External Driver Contact' },
  ];

  const onSubmit = (values: FormValues) => {
    dispatch.mutate(
      {
        patient_id: values.patient_id,
        destination_hospital_id: values.destination_hospital_id,
        referred_from_department: values.referred_from_department,
        ward_id: values.ward_id,
        doctor_name: values.doctor_name || undefined,
        ambulance_type: values.ambulance_type,
        vehicle_id: values.ambulance_type === 'in_house' ? values.vehicle_id : undefined,
        driver_id: values.ambulance_type === 'in_house' ? values.driver_id : undefined,
        opening_reading: values.ambulance_type === 'in_house' ? values.opening_reading : undefined,
        external_vehicle_number: values.ambulance_type === 'external' ? values.external_vehicle_number : undefined,
        external_driver_name: values.ambulance_type === 'external' ? values.external_driver_name : undefined,
        external_driver_cnic: values.ambulance_type === 'external' ? values.external_driver_cnic : undefined,
        external_driver_contact: values.ambulance_type === 'external' ? values.external_driver_contact : undefined,
      },
      {
        onSuccess: () => {
          message.success('Ambulance dispatched.');
          navigate('/ambulance/trips');
        },
        onError: (error) => {
          if (!applyServerValidationErrors(error, setError)) message.error(getErrorMessage(error, 'Unable to dispatch ambulance.'));
        },
      },
    );
  };

  return (
    <PageContainer>
      <PageHeader title="Dispatch Ambulance" breadcrumbs={[{ label: 'Ambulance' }, { label: 'Trips', path: '/ambulance/trips' }, { label: 'Dispatch' }]} extra={<Button onClick={() => navigate(-1)}>Back</Button>} />

      <SectionCard title="Trip Details">
        <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ maxWidth: 520 }}>
          <GeneratedForm fields={commonFields} control={control} errors={errors} />
          <GeneratedForm fields={contextFields} control={control} errors={errors} />
          <GeneratedForm fields={ambulanceType === 'in_house' ? inHouseFields : externalFields} control={control} errors={errors} />
          <Button type="primary" htmlType="submit" loading={dispatch.isPending}>
            Dispatch Ambulance
          </Button>
        </form>
      </SectionCard>
    </PageContainer>
  );
}
