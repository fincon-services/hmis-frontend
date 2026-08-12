import { useMemo } from 'react';
import { z } from 'zod';
import type { ColumnsType } from 'antd/es/table';
import { createCrudApi } from '@/lib/crud/createCrudApi';
import { createCrudHooks } from '@/lib/crud/createCrudHooks';
import { CrudResourcePage } from '@/lib/crud/CrudResourcePage';
import { useSupplierCategories } from './SupplierCategoriesPage';
import type { FieldConfig } from '@/components/forms/FieldConfig';

export interface Supplier {
  id: number;
  procurement_supplier_category_id: number;
  category_name: string | null;
  company_name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  address: string | null;
  registration_no: string | null;
}

const schema = z.object({
  procurement_supplier_category_id: z.number({ required_error: 'Required' }),
  company_name: z.string().min(1, 'Required').max(150),
  contact_person: z.string().optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  mobile: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  registration_no: z.string().optional().or(z.literal('')),
});
type FormValues = z.infer<typeof schema>;

export const suppliersApi = createCrudApi<Supplier, FormValues>('/procurement/suppliers', 'procurement.suppliers');
const hooks = createCrudHooks('procurement.suppliers', suppliersApi);
export const useSuppliers = hooks.useList;

const columns: ColumnsType<Supplier> = [
  { title: 'Company', dataIndex: 'company_name' },
  { title: 'Category', dataIndex: 'category_name', render: (v: string | null) => v ?? '—' },
  { title: 'Contact', dataIndex: 'contact_person', render: (v: string | null) => v ?? '—' },
  { title: 'Phone', dataIndex: 'phone', render: (v: string | null) => v ?? '—' },
];

export function SuppliersPage() {
  const categoriesQuery = useSupplierCategories({ per_page: 0 });
  const categoryOptions = useMemo(() => (categoriesQuery.data?.data ?? []).map((c) => ({ label: c.name, value: c.id })), [categoriesQuery.data]);

  const fields: FieldConfig<FormValues>[] = [
    { type: 'section', label: 'Company Details' },
    { type: 'select', name: 'procurement_supplier_category_id', label: 'Category', required: true, options: categoryOptions },
    { type: 'text', name: 'company_name', label: 'Company Name', required: true },
    { type: 'text', name: 'registration_no', label: 'Registration Number' },

    { type: 'section', label: 'Contact Details' },
    { type: 'text', name: 'contact_person', label: 'Contact Person' },
    { type: 'text', name: 'email', label: 'Email' },
    { type: 'text', name: 'phone', label: 'Phone' },
    { type: 'text', name: 'mobile', label: 'Mobile' },
    { type: 'textarea', name: 'address', label: 'Address' },
  ];

  return (
    <CrudResourcePage<Supplier, FormValues>
      title="Suppliers"
      singularTitle="Supplier"
      screenKey="procurement.suppliers"
      breadcrumbs={[{ label: 'Procurement' }, { label: 'Suppliers' }]}
      columns={columns}
      fields={fields}
      schema={schema}
      defaultValues={{ procurement_supplier_category_id: undefined as unknown as number, company_name: '', contact_person: '', email: '', phone: '', mobile: '', address: '', registration_no: '' }}
      toFormValues={(r) => ({
        procurement_supplier_category_id: r.procurement_supplier_category_id,
        company_name: r.company_name,
        contact_person: r.contact_person ?? '',
        email: r.email ?? '',
        phone: r.phone ?? '',
        mobile: r.mobile ?? '',
        address: r.address ?? '',
        registration_no: r.registration_no ?? '',
      })}
      recordLabel={(r) => r.company_name}
      hooks={hooks}
      enableBulkDelete={false}
    />
  );
}
