import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Users,
  Settings,
  ShieldCheck,
  Banknote,
  GraduationCap,
  Briefcase,
  Tags,
  Languages,
  Sparkles,
  Clock,
  Activity,
  ListChecks,
  Stethoscope,
  ClipboardList,
  FlaskConical,
  TestTube,
  Radiation,
  Pill,
  PackageCheck,
  AlertTriangle,
  BedDouble,
  Scissors,
  BarChart3,
  Droplets,
  Truck,
  Car,
  UserRound,
  Hospital as HospitalIcon,
  Route as RouteIcon,
  Users2,
  CalendarDays,
  Fingerprint,
  Settings2,
  CalendarClock,
  Wallet,
  Landmark,
  Warehouse,
  Boxes,
  MapPin,
  ClipboardList as IndentIcon,
  Layers,
  ShoppingCart,
  Building2,
  FileSignature,
  ShoppingBag,
  ScrollText,
  Calculator,
  BookOpenCheck,
  Receipt,
  FileStack,
  CheckSquare,
  GitBranch,
  History,
  LineChart,
  Key,
  LayoutGrid,
  SquareStack,
  UserCog,
} from 'lucide-react';

export interface NavLeaf {
  key: string;
  label: string;
  path: string;
  /** screens.route_key this leaf maps to — used to hide it once the API denies it. Omit for client-only pages with no backend screen gate (e.g. Dashboard). */
  screen?: string;
  icon?: LucideIcon;
}

export interface NavGroup {
  key: string;
  label: string;
  icon: LucideIcon;
  children: NavLeaf[];
}

export type NavItem = NavLeaf | NavGroup;

export function isNavGroup(item: NavItem): item is NavGroup {
  return 'children' in item;
}

export interface NavSection {
  key: string;
  /** Rendered as a static section label above its items — not itself selectable/collapsible. */
  label: string;
  items: NavItem[];
}

/**
 * Data-driven sidebar, grouped into labeled sections so the ~19 top-level
 * modules read as a hospital org chart rather than one long undifferentiated
 * list. Only modules with implemented routes are listed here — extended
 * phase by phase as features land (see MODULE_MAP.md).
 */
export const navSections: NavSection[] = [
  {
    key: 'main',
    label: 'Main',
    items: [
      { key: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { key: 'patients', label: 'Patients', path: '/patients', screen: 'patients.registration', icon: Users },
    ],
  },
  {
    key: 'clinical',
    label: 'Clinical',
    items: [
      {
        key: 'vitals',
        label: 'Vitals',
        icon: Activity,
        children: [
          { key: 'vitals.queue', label: 'Queue', path: '/vitals/queue', screen: 'vitals.queue', icon: ListChecks },
          { key: 'vitals.types', label: 'Vital Types', path: '/vitals/types', screen: 'vitals.types', icon: Settings },
        ],
      } satisfies NavGroup,
      {
        key: 'consultation',
        label: 'Consultation',
        icon: Stethoscope,
        children: [
          { key: 'consultations.queue', label: 'Queue', path: '/consultation/queue', screen: 'patients.queue', icon: ListChecks },
          { key: 'consultations.diagnosis-types', label: 'Diagnosis Types', path: '/consultation/diagnosis-types', screen: 'consultations.diagnosis-types', icon: ClipboardList },
        ],
      } satisfies NavGroup,
      {
        key: 'ipd',
        label: 'IPD',
        icon: BedDouble,
        children: [{ key: 'ipd.wards', label: 'Wards', path: '/ipd/wards', screen: 'ipd.wards', icon: BedDouble }],
      } satisfies NavGroup,
      {
        key: 'ot',
        label: 'OT',
        icon: Scissors,
        children: [
          { key: 'ot.procedures', label: 'Procedures', path: '/ot/procedures', screen: 'ot.catalog', icon: Scissors },
          { key: 'ot.statistics', label: 'Surgical Statistics', path: '/ot/surgical-statistics', screen: 'ot.statistics', icon: BarChart3 },
        ],
      } satisfies NavGroup,
      {
        key: 'blood-bank',
        label: 'Blood Bank',
        icon: Droplets,
        children: [
          { key: 'blood-bank.bags', label: 'Inventory', path: '/blood-bank/bags', screen: 'blood-bank.inventory', icon: Droplets },
          { key: 'blood-bank.report', label: 'Report', path: '/blood-bank/report', screen: 'blood-bank.inventory', icon: BarChart3 },
        ],
      } satisfies NavGroup,
    ],
  },
  {
    key: 'diagnostics',
    label: 'Diagnostics',
    items: [
      {
        key: 'laboratory',
        label: 'Laboratory',
        icon: FlaskConical,
        children: [
          { key: 'laboratory.queue', label: 'Queue', path: '/laboratory/queue', screen: 'patients.queue', icon: ListChecks },
          { key: 'laboratory.tests', label: 'Tests', path: '/laboratory/tests', screen: 'laboratory.catalog', icon: TestTube },
          { key: 'laboratory.test-categories', label: 'Test Categories', path: '/laboratory/test-categories', screen: 'laboratory.catalog', icon: ClipboardList },
        ],
      } satisfies NavGroup,
      {
        key: 'radiology',
        label: 'Radiology',
        icon: Radiation,
        children: [
          { key: 'radiology.queue', label: 'Queue', path: '/radiology/queue', screen: 'patients.queue', icon: ListChecks },
          { key: 'radiology.tests', label: 'Tests', path: '/radiology/tests', screen: 'radiology.catalog', icon: TestTube },
        ],
      } satisfies NavGroup,
    ],
  },
  {
    key: 'support-services',
    label: 'Support Services',
    items: [
      {
        key: 'pharmacy',
        label: 'Pharmacy',
        icon: Pill,
        children: [
          { key: 'pharmacy.pending-dispense', label: 'Pending Dispense', path: '/pharmacy/pending-dispense', screen: 'pharmacy.workflow', icon: PackageCheck },
          { key: 'pharmacy.medicines', label: 'Medicines', path: '/pharmacy/medicines', screen: 'pharmacy.catalog', icon: Pill },
          { key: 'pharmacy.side-effect-types', label: 'Side Effect Types', path: '/pharmacy/side-effect-types', screen: 'pharmacy.catalog', icon: AlertTriangle },
        ],
      } satisfies NavGroup,
      {
        key: 'ambulance',
        label: 'Ambulance',
        icon: Truck,
        children: [
          { key: 'ambulance.trips', label: 'Trips', path: '/ambulance/trips', screen: 'ambulance.trips', icon: RouteIcon },
          { key: 'ambulance.vehicles', label: 'Vehicles', path: '/ambulance/vehicles', screen: 'ambulance.fleet', icon: Car },
          { key: 'ambulance.drivers', label: 'Drivers', path: '/ambulance/drivers', screen: 'ambulance.fleet', icon: UserRound },
          { key: 'ambulance.destination-hospitals', label: 'Destination Hospitals', path: '/ambulance/destination-hospitals', screen: 'ambulance.fleet', icon: HospitalIcon },
          { key: 'ambulance.report', label: 'Trip Report', path: '/ambulance/report', screen: 'ambulance.reports', icon: BarChart3 },
        ],
      } satisfies NavGroup,
    ],
  },
  {
    key: 'operations',
    label: 'Operations',
    items: [
      {
        key: 'warehouse',
        label: 'Warehouse',
        icon: Warehouse,
        children: [
          { key: 'warehouse.items', label: 'Items', path: '/warehouse/items', screen: 'warehouse.catalog', icon: Boxes },
          { key: 'warehouse.item-categories', label: 'Item Categories', path: '/warehouse/item-categories', screen: 'warehouse.catalog', icon: Tags },
          { key: 'warehouse.item-sub-categories', label: 'Item Sub-Categories', path: '/warehouse/item-sub-categories', screen: 'warehouse.catalog', icon: Layers },
          { key: 'warehouse.item-brands', label: 'Item Brands', path: '/warehouse/item-brands', screen: 'warehouse.catalog', icon: Tags },
          { key: 'warehouse.item-attributes', label: 'Item Attributes', path: '/warehouse/item-attributes', screen: 'warehouse.catalog', icon: Sparkles },
          { key: 'warehouse.item-units', label: 'Item Units', path: '/warehouse/item-units', screen: 'warehouse.catalog', icon: Boxes },
          { key: 'warehouse.locations', label: 'Locations', path: '/warehouse/locations', screen: 'warehouse.catalog', icon: MapPin },
          { key: 'warehouse.indent-requests', label: 'Indent Requests', path: '/warehouse/indent-requests', screen: 'warehouse.indents', icon: IndentIcon },
          { key: 'warehouse.stock', label: 'Stock', path: '/warehouse/stock', screen: 'warehouse.stock', icon: PackageCheck },
          { key: 'warehouse.reports', label: 'Reports', path: '/warehouse/reports', screen: 'warehouse.reports', icon: BarChart3 },
        ],
      } satisfies NavGroup,
      {
        key: 'procurement',
        label: 'Procurement',
        icon: ShoppingCart,
        children: [
          { key: 'procurement.suppliers', label: 'Suppliers', path: '/procurement/suppliers', screen: 'procurement.suppliers', icon: Building2 },
          { key: 'procurement.supplier-categories', label: 'Supplier Categories', path: '/procurement/supplier-categories', screen: 'procurement.suppliers', icon: Tags },
          { key: 'procurement.brand-preferences', label: 'Brand Preferences', path: '/procurement/brand-preferences', screen: 'procurement.suppliers', icon: Sparkles },
          { key: 'procurement.purchase-requests', label: 'Purchase Requests', path: '/procurement/purchase-requests', screen: 'procurement.purchase-requests', icon: FileSignature },
          { key: 'procurement.purchase-orders', label: 'Purchase Orders', path: '/procurement/purchase-orders', screen: 'procurement.purchase-orders', icon: ShoppingBag },
          { key: 'procurement.instruction-set', label: 'Instruction Set', path: '/procurement/instruction-set', screen: 'procurement.purchase-orders', icon: ScrollText },
        ],
      } satisfies NavGroup,
      {
        key: 'finance',
        label: 'Finance',
        icon: Calculator,
        children: [
          { key: 'finance.chart-accounts', label: 'Chart of Accounts', path: '/finance/chart-accounts', screen: 'finance.setup', icon: BookOpenCheck },
          { key: 'finance.fiscal-years', label: 'Fiscal Years', path: '/finance/fiscal-years', screen: 'finance.setup', icon: CalendarDays },
          { key: 'finance.gl-configs', label: 'GL Configs', path: '/finance/gl-configs', screen: 'finance.setup', icon: Settings2 },
          { key: 'finance.vouchers', label: 'Vouchers', path: '/finance/vouchers', screen: 'finance.vouchers', icon: Receipt },
          { key: 'finance.invoices', label: 'Invoices', path: '/finance/invoices', screen: 'finance.invoices', icon: FileStack },
          { key: 'finance.reports', label: 'Reports', path: '/finance/reports', screen: 'finance.reports', icon: BarChart3 },
        ],
      } satisfies NavGroup,
      {
        key: 'approval',
        label: 'Approval',
        icon: CheckSquare,
        children: [
          { key: 'approval.requests', label: 'Pending Queue', path: '/approval/requests', screen: 'approval.requests', icon: CheckSquare },
          { key: 'approval.processes', label: 'Processes', path: '/approval/processes', screen: 'approval.processes', icon: GitBranch },
        ],
      } satisfies NavGroup,
    ],
  },
  {
    key: 'administration',
    label: 'Administration',
    items: [
      {
        key: 'hr',
        label: 'Human Resources',
        icon: Users2,
        children: [
          { key: 'pim.employees', label: 'Employees', path: '/hr/employees', screen: 'pim.employees', icon: Users2 },
          { key: 'attendance.records', label: 'Attendance Records', path: '/attendance/records', screen: 'attendance.records', icon: Fingerprint },
          { key: 'attendance.pull', label: 'Attendance Operations', path: '/attendance/operations', screen: 'attendance.pull', icon: Settings2 },
          { key: 'attendance.devices', label: 'Attendance Devices', path: '/attendance/devices', screen: 'attendance.devices', icon: Fingerprint },
          { key: 'attendance.holidays', label: 'Holidays', path: '/attendance/holidays', screen: 'attendance.holidays', icon: CalendarDays },
          { key: 'leave.apply', label: 'Apply for Leave', path: '/leave/apply', screen: 'leave.applications', icon: CalendarClock },
          { key: 'leave.employee-leaves', label: 'Employee Leaves', path: '/leave/employee-leaves', screen: 'leave.employee-leaves', icon: CalendarClock },
          { key: 'leave.types', label: 'Leave Types', path: '/leave/types', screen: 'leave.types', icon: CalendarClock },
          { key: 'leave.entitlements', label: 'Leave Entitlements', path: '/leave/entitlements', screen: 'leave.entitlements', icon: CalendarClock },
          { key: 'payroll.run', label: 'Payroll Run', path: '/payroll/run', screen: 'payroll.generate', icon: Wallet },
          { key: 'payroll.allowances', label: 'Payroll Allowances', path: '/payroll/allowances', screen: 'payroll.allowances', icon: Wallet },
          { key: 'payroll.deductions', label: 'Payroll Deductions', path: '/payroll/deductions', screen: 'payroll.deductions', icon: Wallet },
          { key: 'payroll.tax-slabs', label: 'Tax Slabs', path: '/payroll/tax-slabs', screen: 'payroll.tax-slabs', icon: Landmark },
          { key: 'payroll.attendance-exemptions', label: 'Attendance Exemptions', path: '/payroll/attendance-exemptions', screen: 'payroll.attendance-exemptions', icon: Settings2 },
          { key: 'payroll.bonuses', label: 'Bonuses', path: '/payroll/bonuses', screen: 'payroll.bonuses', icon: Wallet },
          { key: 'payroll.overtime', label: 'Overtime', path: '/payroll/overtime', screen: 'payroll.overtime', icon: Wallet },
          { key: 'payroll.arrears', label: 'Arrears', path: '/payroll/arrears', screen: 'payroll.arrears', icon: Wallet },
        ],
      } satisfies NavGroup,
      {
        key: 'administration',
        label: 'HR Setup',
        icon: Settings,
        children: [
          { key: 'admin.currencies', label: 'Currencies', path: '/administration/hr-setup/currencies', screen: 'admin.currencies', icon: Banknote },
          { key: 'admin.education-levels', label: 'Education Levels', path: '/administration/hr-setup/education-levels', screen: 'admin.education-levels', icon: GraduationCap },
          { key: 'admin.employment-statuses', label: 'Employment Statuses', path: '/administration/hr-setup/employment-statuses', screen: 'admin.employment-statuses', icon: Briefcase },
          { key: 'admin.job-categories', label: 'Job Categories', path: '/administration/hr-setup/job-categories', screen: 'admin.job-categories', icon: Tags },
          { key: 'admin.job-titles', label: 'Job Titles', path: '/administration/hr-setup/job-titles', screen: 'admin.job-titles', icon: Tags },
          { key: 'admin.languages', label: 'Languages', path: '/administration/hr-setup/languages', screen: 'admin.languages', icon: Languages },
          { key: 'admin.pay-grades', label: 'Pay Grades', path: '/administration/hr-setup/pay-grades', screen: 'admin.pay-grades', icon: Banknote },
          { key: 'admin.skills', label: 'Skills', path: '/administration/hr-setup/skills', screen: 'admin.skills', icon: Sparkles },
          { key: 'admin.work-shifts', label: 'Work Shifts', path: '/administration/hr-setup/work-shifts', screen: 'admin.work-shifts', icon: Clock },
        ],
      } satisfies NavGroup,
      {
        key: 'access-control',
        label: 'Access Control',
        icon: ShieldCheck,
        children: [
          { key: 'acl.roles', label: 'Roles', path: '/administration/roles', screen: 'acl.roles', icon: ShieldCheck },
          { key: 'admin.users', label: 'Users', path: '/administration/users', screen: 'admin.users', icon: UserCog },
          { key: 'acl.modules', label: 'Modules', path: '/administration/modules', screen: 'acl.modules', icon: LayoutGrid },
          { key: 'acl.screens', label: 'Screens', path: '/administration/screens', screen: 'acl.screens', icon: SquareStack },
          { key: 'acl.permissions', label: 'Permissions', path: '/administration/permissions', screen: 'acl.permissions', icon: Key },
        ],
      } satisfies NavGroup,
      {
        key: 'clinical-reports',
        label: 'Clinical Reports',
        path: '/clinical-reports',
        screen: 'clinical-reports.view',
        icon: LineChart,
      },
      {
        key: 'system',
        label: 'System',
        icon: Settings2,
        children: [{ key: 'system.activity-logs', label: 'Activity Logs', path: '/system/activity-logs', screen: 'system.activity-logs', icon: History }],
      } satisfies NavGroup,
    ],
  },
];

/** Flattened view of every top-level item, ignoring section labels — used for path/active-key lookups. */
export const navItems: NavItem[] = navSections.flatMap((section) => section.items);

/** All nav leaves (recursively), each carrying its route `path` and, where gated, its `screen` route_key. */
function flattenLeaves(items: NavItem[]): NavLeaf[] {
  return items.flatMap((item) => (isNavGroup(item) ? flattenLeaves(item.children) : [item]));
}
const allLeaves = flattenLeaves(navItems);

/**
 * The screen route_key that gates a given pathname, if any — longest-`path`-match first so a
 * more specific nav entry (e.g. `/warehouse/items`) wins over a shorter unrelated prefix.
 * Returns undefined for routes with no `screen` (e.g. Dashboard) or no nav entry at all (e.g.
 * a detail page reached only by row-click, not itself in the sidebar) — callers should treat
 * that as "no screen-level gate known", not "denied".
 */
export function findScreenForPath(pathname: string): string | undefined {
  const match = [...allLeaves]
    .filter((leaf) => pathname === leaf.path || pathname.startsWith(`${leaf.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0];
  return match?.screen;
}

export const ACL_ICON = ShieldCheck;
