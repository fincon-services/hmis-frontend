import { z } from 'zod';
import type { ColumnsType } from 'antd/es/table';
import { createCrudApi } from '@/lib/crud/createCrudApi';
import { createCrudHooks } from '@/lib/crud/createCrudHooks';
import { CrudResourcePage } from '@/lib/crud/CrudResourcePage';
import { useItemCategories } from './ItemCategoriesPage';
import { useItemSubCategories } from './ItemSubCategoriesPage';
import { useItemBrands } from './ItemBrandsPage';
import { useItemUnits } from './ItemUnitsPage';
import type { FieldConfig } from '@/components/forms/FieldConfig';

export interface WarehouseItem {
  id: number;
  name: string;
  code: string | null;
  barcode: string | null;
  type: string;
  warehouse_item_category_id: number;
  category_name: string | null;
  warehouse_item_sub_category_id: number | null;
  warehouse_item_brand_id: number | null;
  warehouse_item_unit_id: number;
  unit_symbol: string | null;
  par_level: number | null;
  panic_level: number | null;
  reorder_qty: number | null;
  weightage: number | null;
  weightage_unit: string | null;
  description: string | null;
  current_stock: number;
}

const schema = z.object({
  name: z.string().min(1, 'Required').max(150),
  barcode: z.string().optional().or(z.literal('')),
  type: z.string().min(1, 'Required'),
  warehouse_item_category_id: z.number({ required_error: 'Required' }),
  warehouse_item_sub_category_id: z.number().optional(),
  warehouse_item_brand_id: z.number().optional(),
  warehouse_item_unit_id: z.number({ required_error: 'Required' }),
  par_level: z.number().optional(),
  panic_level: z.number().optional(),
  reorder_qty: z.number().optional(),
  description: z.string().optional().or(z.literal('')),
});
type FormValues = z.infer<typeof schema>;

export const warehouseItemsApi = createCrudApi<WarehouseItem, FormValues>('/warehouse/items', 'warehouse.catalog');
const hooks = createCrudHooks('warehouse.items', warehouseItemsApi);
export const useWarehouseItems = hooks.useList;

const columns: ColumnsType<WarehouseItem> = [
  { title: 'Name', dataIndex: 'name' },
  { title: 'Category', dataIndex: 'category_name', render: (v: string | null) => v ?? '—' },
  { title: 'Type', dataIndex: 'type', width: 110 },
  { title: 'Current Stock', dataIndex: 'current_stock', width: 120 },
  { title: 'Par Level', dataIndex: 'par_level', width: 100, render: (v: number | null) => v ?? '—' },
  { title: 'Panic Level', dataIndex: 'panic_level', width: 110, render: (v: number | null) => v ?? '—' },
];

export function ItemsPage() {
  const categoriesQuery = useItemCategories({ per_page: 0 });
  const subCategoriesQuery = useItemSubCategories({ per_page: 0 });
  const brandsQuery = useItemBrands({ per_page: 0 });
  const unitsQuery = useItemUnits({ per_page: 0 });

  const fields: FieldConfig<FormValues>[] = [
    { type: 'section', label: 'Identity' },
    { type: 'text', name: 'name', label: 'Name', required: true },
    { type: 'text', name: 'barcode', label: 'Barcode' },
    {
      type: 'select',
      name: 'type',
      label: 'Type',
      required: true,
      options: [
        { label: 'Consumable', value: 'consumable' },
        { label: 'Asset', value: 'asset' },
        { label: 'Medicine', value: 'medicine' },
      ],
    },

    { type: 'section', label: 'Classification' },
    { type: 'select', name: 'warehouse_item_category_id', label: 'Category', required: true, options: (categoriesQuery.data?.data ?? []).map((c) => ({ label: c.name, value: c.id })) },
    { type: 'select', name: 'warehouse_item_sub_category_id', label: 'Sub-Category', options: (subCategoriesQuery.data?.data ?? []).map((s) => ({ label: s.name, value: s.id })) },
    { type: 'select', name: 'warehouse_item_brand_id', label: 'Brand', options: (brandsQuery.data?.data ?? []).map((b) => ({ label: b.name, value: b.id })) },
    { type: 'select', name: 'warehouse_item_unit_id', label: 'Unit', required: true, options: (unitsQuery.data?.data ?? []).map((u) => ({ label: u.name, value: u.id })) },

    { type: 'section', label: 'Stock Thresholds', description: 'Used to trigger indent/reorder alerts.' },
    { type: 'number', name: 'par_level', label: 'Par Level', min: 0 },
    { type: 'number', name: 'panic_level', label: 'Panic Level', min: 0 },
    { type: 'number', name: 'reorder_qty', label: 'Reorder Quantity', min: 0 },
    { type: 'textarea', name: 'description', label: 'Description' },
  ];

  return (
    <CrudResourcePage<WarehouseItem, FormValues>
      title="Warehouse Items"
      singularTitle="Item"
      screenKey="warehouse.catalog"
      breadcrumbs={[{ label: 'Warehouse' }, { label: 'Items' }]}
      columns={columns}
      fields={fields}
      schema={schema}
      defaultValues={{ name: '', barcode: '', type: 'consumable', warehouse_item_category_id: undefined as unknown as number, warehouse_item_unit_id: undefined as unknown as number, description: '' }}
      toFormValues={(r) => ({
        name: r.name,
        barcode: r.barcode ?? '',
        type: r.type,
        warehouse_item_category_id: r.warehouse_item_category_id,
        warehouse_item_sub_category_id: r.warehouse_item_sub_category_id ?? undefined,
        warehouse_item_brand_id: r.warehouse_item_brand_id ?? undefined,
        warehouse_item_unit_id: r.warehouse_item_unit_id,
        par_level: r.par_level ?? undefined,
        panic_level: r.panic_level ?? undefined,
        reorder_qty: r.reorder_qty ?? undefined,
        description: r.description ?? '',
      })}
      recordLabel={(r) => r.name}
      hooks={hooks}
      enableBulkDelete={false}
    />
  );
}
