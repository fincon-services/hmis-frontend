import { createSimpleNameResource } from '@/lib/crud/createSimpleNameResource';

export const { api: destinationHospitalsApi, hooks: destinationHospitalsHooks, Page: DestinationHospitalsPage } = createSimpleNameResource(
  '/ambulance/destination-hospitals',
  'ambulance.fleet',
  'Destination Hospitals',
  'Destination Hospital',
  [{ label: 'Ambulance' }, { label: 'Destination Hospitals' }],
);
export const useDestinationHospitals = destinationHospitalsHooks.useList;
