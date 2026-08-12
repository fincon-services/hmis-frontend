import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import { Result, Button } from "antd";
import { AuthGuard, GuestGuard } from "./guards/AuthGuard";
import { AppShell } from "@/components/layout/AppShell";
import { LoadingState } from "@/components/feedback/LoadingState";

const LoginPage = lazy(() =>
  import("@/features/auth/pages/LoginPage").then((m) => ({
    default: m.LoginPage,
  })),
);
const ChangePasswordPage = lazy(() =>
  import("@/features/settings/pages/ChangePasswordPage").then((m) => ({
    default: m.ChangePasswordPage,
  })),
);
const DashboardPage = lazy(() =>
  import("@/features/dashboard/pages/DashboardPage").then((m) => ({
    default: m.DashboardPage,
  })),
);

const PatientsListPage = lazy(() =>
  import("@/features/patients/pages/PatientsListPage").then((m) => ({
    default: m.PatientsListPage,
  })),
);
const PatientRegisterPage = lazy(() =>
  import("@/features/patients/pages/PatientRegisterPage").then((m) => ({
    default: m.PatientRegisterPage,
  })),
);
const PatientDetailPage = lazy(() =>
  import("@/features/patients/pages/PatientDetailPage").then((m) => ({
    default: m.PatientDetailPage,
  })),
);

const CurrenciesPage = lazy(() =>
  import("@/features/administration/hr-setup/currencies/CurrenciesPage").then(
    (m) => ({ default: m.CurrenciesPage }),
  ),
);
const EducationLevelsPage = lazy(() =>
  import("@/features/administration/hr-setup/education-levels/EducationLevelsPage").then(
    (m) => ({ default: m.EducationLevelsPage }),
  ),
);
const EmploymentStatusesPage = lazy(() =>
  import("@/features/administration/hr-setup/employment-statuses/EmploymentStatusesPage").then(
    (m) => ({ default: m.EmploymentStatusesPage }),
  ),
);
const JobCategoriesPage = lazy(() =>
  import("@/features/administration/hr-setup/job-categories/JobCategoriesPage").then(
    (m) => ({ default: m.JobCategoriesPage }),
  ),
);
const JobTitlesPage = lazy(() =>
  import("@/features/administration/hr-setup/job-titles/JobTitlesPage").then(
    (m) => ({ default: m.JobTitlesPage }),
  ),
);
const LanguagesPage = lazy(() =>
  import("@/features/administration/hr-setup/languages/LanguagesPage").then(
    (m) => ({ default: m.LanguagesPage }),
  ),
);
const PayGradesPage = lazy(() =>
  import("@/features/administration/hr-setup/pay-grades/PayGradesPage").then(
    (m) => ({ default: m.PayGradesPage }),
  ),
);
const SkillsPage = lazy(() =>
  import("@/features/administration/hr-setup/skills/SkillsPage").then((m) => ({
    default: m.SkillsPage,
  })),
);
const WorkShiftsPage = lazy(() =>
  import("@/features/administration/hr-setup/work-shifts/WorkShiftsPage").then(
    (m) => ({ default: m.WorkShiftsPage }),
  ),
);

const VitalTypesPage = lazy(() =>
  import("@/features/clinical/vitals/pages/VitalTypesPage").then((m) => ({
    default: m.VitalTypesPage,
  })),
);
const VitalsQueuePage = lazy(() =>
  import("@/features/clinical/vitals/pages/VitalsQueuePage").then((m) => ({
    default: m.VitalsQueuePage,
  })),
);
const VitalsRecordPage = lazy(() =>
  import("@/features/clinical/vitals/pages/VitalsRecordPage").then((m) => ({
    default: m.VitalsRecordPage,
  })),
);

const DiagnosisTypesPage = lazy(() =>
  import("@/features/clinical/consultation/pages/DiagnosisTypesPage").then(
    (m) => ({ default: m.DiagnosisTypesPage }),
  ),
);
const ConsultationQueuePage = lazy(() =>
  import("@/features/clinical/consultation/pages/ConsultationQueuePage").then(
    (m) => ({ default: m.ConsultationQueuePage }),
  ),
);
const ConsultationVisitPage = lazy(() =>
  import("@/features/clinical/consultation/pages/ConsultationVisitPage").then(
    (m) => ({ default: m.ConsultationVisitPage }),
  ),
);

const LabTestCategoriesPage = lazy(() =>
  import("@/features/clinical/laboratory/pages/LabTestCategoriesPage").then(
    (m) => ({ default: m.LabTestCategoriesPage }),
  ),
);
const LabTestsPage = lazy(() =>
  import("@/features/clinical/laboratory/pages/LabTestsPage").then((m) => ({
    default: m.LabTestsPage,
  })),
);
const LabTestParametersPage = lazy(() =>
  import("@/features/clinical/laboratory/pages/LabTestParametersPage").then(
    (m) => ({ default: m.LabTestParametersPage }),
  ),
);
const LabQueuePage = lazy(() =>
  import("@/features/clinical/laboratory/pages/LabQueuePage").then((m) => ({
    default: m.LabQueuePage,
  })),
);
const LabVisitPage = lazy(() =>
  import("@/features/clinical/laboratory/pages/LabVisitPage").then((m) => ({
    default: m.LabVisitPage,
  })),
);

const RadiologyTestsPage = lazy(() =>
  import("@/features/clinical/radiology/pages/RadiologyTestsPage").then(
    (m) => ({ default: m.RadiologyTestsPage }),
  ),
);
const RadiologyQueuePage = lazy(() =>
  import("@/features/clinical/radiology/pages/RadiologyQueuePage").then(
    (m) => ({ default: m.RadiologyQueuePage }),
  ),
);
const RadiologyVisitPage = lazy(() =>
  import("@/features/clinical/radiology/pages/RadiologyVisitPage").then(
    (m) => ({ default: m.RadiologyVisitPage }),
  ),
);

const MedicinesPage = lazy(() =>
  import("@/features/clinical/pharmacy/pages/MedicinesPage").then((m) => ({
    default: m.MedicinesPage,
  })),
);
const SideEffectTypesPage = lazy(() =>
  import("@/features/clinical/pharmacy/pages/SideEffectTypesPage").then(
    (m) => ({ default: m.SideEffectTypesPage }),
  ),
);
const PendingDispensePage = lazy(() =>
  import("@/features/clinical/pharmacy/pages/PendingDispensePage").then(
    (m) => ({ default: m.PendingDispensePage }),
  ),
);
const PrescribeMedicinePage = lazy(() =>
  import("@/features/clinical/pharmacy/pages/PrescribeMedicinePage").then(
    (m) => ({ default: m.PrescribeMedicinePage }),
  ),
);

const WardsPage = lazy(() =>
  import("@/features/clinical/ipd/pages/WardsPage").then((m) => ({
    default: m.WardsPage,
  })),
);
const WardDetailPage = lazy(() =>
  import("@/features/clinical/ipd/pages/WardDetailPage").then((m) => ({
    default: m.WardDetailPage,
  })),
);
const AdmitPatientPage = lazy(() =>
  import("@/features/clinical/ipd/pages/AdmitPatientPage").then((m) => ({
    default: m.AdmitPatientPage,
  })),
);

const OtProceduresPage = lazy(() =>
  import("@/features/clinical/ot/pages/OtProceduresPage").then((m) => ({
    default: m.OtProceduresPage,
  })),
);
const SurgicalStatisticsPage = lazy(() =>
  import("@/features/clinical/ot/pages/SurgicalStatisticsPage").then((m) => ({
    default: m.SurgicalStatisticsPage,
  })),
);
const OtVisitPage = lazy(() =>
  import("@/features/clinical/ot/pages/OtVisitPage").then((m) => ({
    default: m.OtVisitPage,
  })),
);

const BloodBagsPage = lazy(() =>
  import("@/features/clinical/blood-bank/pages/BloodBagsPage").then((m) => ({
    default: m.BloodBagsPage,
  })),
);
const BloodBagDetailPage = lazy(() =>
  import("@/features/clinical/blood-bank/pages/BloodBagDetailPage").then(
    (m) => ({ default: m.BloodBagDetailPage }),
  ),
);
const BloodGroupReportPage = lazy(() =>
  import("@/features/clinical/blood-bank/pages/BloodGroupReportPage").then(
    (m) => ({ default: m.BloodGroupReportPage }),
  ),
);

const VehiclesPage = lazy(() =>
  import("@/features/ambulance/pages/VehiclesPage").then((m) => ({
    default: m.VehiclesPage,
  })),
);
const DriversPage = lazy(() =>
  import("@/features/ambulance/pages/DriversPage").then((m) => ({
    default: m.DriversPage,
  })),
);
const DestinationHospitalsPage = lazy(() =>
  import("@/features/ambulance/pages/DestinationHospitalsPage").then((m) => ({
    default: m.DestinationHospitalsPage,
  })),
);
const TripsPage = lazy(() =>
  import("@/features/ambulance/pages/TripsPage").then((m) => ({
    default: m.TripsPage,
  })),
);
const DispatchTripPage = lazy(() =>
  import("@/features/ambulance/pages/DispatchTripPage").then((m) => ({
    default: m.DispatchTripPage,
  })),
);
const TripDetailPage = lazy(() =>
  import("@/features/ambulance/pages/TripDetailPage").then((m) => ({
    default: m.TripDetailPage,
  })),
);
const TripReportPage = lazy(() =>
  import("@/features/ambulance/pages/TripReportPage").then((m) => ({
    default: m.TripReportPage,
  })),
);

const EmployeesPage = lazy(() =>
  import("@/features/hr/employees/pages/EmployeesPage").then((m) => ({
    default: m.EmployeesPage,
  })),
);
const EmployeeProfilePage = lazy(() =>
  import("@/features/hr/employees/pages/EmployeeProfilePage").then((m) => ({
    default: m.EmployeeProfilePage,
  })),
);

const HolidaysPage = lazy(() =>
  import("@/features/hr/attendance/pages/HolidaysPage").then((m) => ({
    default: m.HolidaysPage,
  })),
);
const DevicesPage = lazy(() =>
  import("@/features/hr/attendance/pages/DevicesPage").then((m) => ({
    default: m.DevicesPage,
  })),
);
const AttendanceRecordsPage = lazy(() =>
  import("@/features/hr/attendance/pages/AttendanceRecordsPage").then((m) => ({
    default: m.AttendanceRecordsPage,
  })),
);
const AttendanceOperationsPage = lazy(() =>
  import("@/features/hr/attendance/pages/AttendanceOperationsPage").then(
    (m) => ({ default: m.AttendanceOperationsPage }),
  ),
);

const LeaveTypesPage = lazy(() =>
  import("@/features/hr/leave/pages/LeaveTypesPage").then((m) => ({
    default: m.LeaveTypesPage,
  })),
);
const LeaveEntitlementsPage = lazy(() =>
  import("@/features/hr/leave/pages/LeaveEntitlementsPage").then((m) => ({
    default: m.LeaveEntitlementsPage,
  })),
);
const EmployeeLeavesPage = lazy(() =>
  import("@/features/hr/leave/pages/EmployeeLeavesPage").then((m) => ({
    default: m.EmployeeLeavesPage,
  })),
);
const LeaveApplicationPage = lazy(() =>
  import("@/features/hr/leave/pages/LeaveApplicationPage").then((m) => ({
    default: m.LeaveApplicationPage,
  })),
);

const TaxSlabsPage = lazy(() =>
  import("@/features/hr/payroll/pages/TaxSlabsPage").then((m) => ({
    default: m.TaxSlabsPage,
  })),
);
const PayrollAllowancesPage = lazy(() =>
  import("@/features/hr/payroll/pages/PayrollAllowancesPage").then((m) => ({
    default: m.PayrollAllowancesPage,
  })),
);
const PayrollDeductionsPage = lazy(() =>
  import("@/features/hr/payroll/pages/PayrollDeductionsPage").then((m) => ({
    default: m.PayrollDeductionsPage,
  })),
);
const AttendanceExemptionsPage = lazy(() =>
  import("@/features/hr/payroll/pages/AttendanceExemptionsPage").then((m) => ({
    default: m.AttendanceExemptionsPage,
  })),
);
const BonusesPage = lazy(() =>
  import("@/features/hr/payroll/pages/BonusesPage").then((m) => ({
    default: m.BonusesPage,
  })),
);
const OvertimePage = lazy(() =>
  import("@/features/hr/payroll/pages/OvertimePage").then((m) => ({
    default: m.OvertimePage,
  })),
);
const ArrearsPage = lazy(() =>
  import("@/features/hr/payroll/pages/ArrearsPage").then((m) => ({
    default: m.ArrearsPage,
  })),
);
const PayrollRunPage = lazy(() =>
  import("@/features/hr/payroll/pages/PayrollRunPage").then((m) => ({
    default: m.PayrollRunPage,
  })),
);

const ItemAttributesPage = lazy(() =>
  import("@/features/warehouse/pages/ItemAttributesPage").then((m) => ({
    default: m.ItemAttributesPage,
  })),
);
const ItemBrandsPage = lazy(() =>
  import("@/features/warehouse/pages/ItemBrandsPage").then((m) => ({
    default: m.ItemBrandsPage,
  })),
);
const ItemCategoriesPage = lazy(() =>
  import("@/features/warehouse/pages/ItemCategoriesPage").then((m) => ({
    default: m.ItemCategoriesPage,
  })),
);
const ItemSubCategoriesPage = lazy(() =>
  import("@/features/warehouse/pages/ItemSubCategoriesPage").then((m) => ({
    default: m.ItemSubCategoriesPage,
  })),
);
const ItemUnitsPage = lazy(() =>
  import("@/features/warehouse/pages/ItemUnitsPage").then((m) => ({
    default: m.ItemUnitsPage,
  })),
);
const LocationsPage = lazy(() =>
  import("@/features/warehouse/pages/LocationsPage").then((m) => ({
    default: m.LocationsPage,
  })),
);
const ItemsPage = lazy(() =>
  import("@/features/warehouse/pages/ItemsPage").then((m) => ({
    default: m.ItemsPage,
  })),
);
const IndentRequestsPage = lazy(() =>
  import("@/features/warehouse/pages/IndentRequestsPage").then((m) => ({
    default: m.IndentRequestsPage,
  })),
);
const IndentRequestDetailPage = lazy(() =>
  import("@/features/warehouse/pages/IndentRequestDetailPage").then((m) => ({
    default: m.IndentRequestDetailPage,
  })),
);
const StockPage = lazy(() =>
  import("@/features/warehouse/pages/StockPage").then((m) => ({
    default: m.StockPage,
  })),
);
const WarehouseReportsPage = lazy(() =>
  import("@/features/warehouse/pages/WarehouseReportsPage").then((m) => ({
    default: m.WarehouseReportsPage,
  })),
);

const SupplierCategoriesPage = lazy(() =>
  import("@/features/procurement/pages/SupplierCategoriesPage").then((m) => ({
    default: m.SupplierCategoriesPage,
  })),
);
const SuppliersPage = lazy(() =>
  import("@/features/procurement/pages/SuppliersPage").then((m) => ({
    default: m.SuppliersPage,
  })),
);
const ItemBrandPreferencesPage = lazy(() =>
  import("@/features/procurement/pages/ItemBrandPreferencesPage").then((m) => ({
    default: m.ItemBrandPreferencesPage,
  })),
);
const PurchaseRequestsPage = lazy(() =>
  import("@/features/procurement/pages/PurchaseRequestsPage").then((m) => ({
    default: m.PurchaseRequestsPage,
  })),
);
const PurchaseRequestDetailPage = lazy(() =>
  import("@/features/procurement/pages/PurchaseRequestDetailPage").then(
    (m) => ({ default: m.PurchaseRequestDetailPage }),
  ),
);
const PurchaseOrdersPage = lazy(() =>
  import("@/features/procurement/pages/PurchaseOrdersPage").then((m) => ({
    default: m.PurchaseOrdersPage,
  })),
);
const PurchaseOrderDetailPage = lazy(() =>
  import("@/features/procurement/pages/PurchaseOrderDetailPage").then((m) => ({
    default: m.PurchaseOrderDetailPage,
  })),
);
const InstructionSetPage = lazy(() =>
  import("@/features/procurement/pages/InstructionSetPage").then((m) => ({
    default: m.InstructionSetPage,
  })),
);

const ChartAccountsPage = lazy(() =>
  import("@/features/finance/pages/ChartAccountsPage").then((m) => ({
    default: m.ChartAccountsPage,
  })),
);
const FiscalYearsPage = lazy(() =>
  import("@/features/finance/pages/FiscalYearsPage").then((m) => ({
    default: m.FiscalYearsPage,
  })),
);
const GlConfigsPage = lazy(() =>
  import("@/features/finance/pages/GlConfigsPage").then((m) => ({
    default: m.GlConfigsPage,
  })),
);
const VouchersPage = lazy(() =>
  import("@/features/finance/pages/VouchersPage").then((m) => ({
    default: m.VouchersPage,
  })),
);
const VoucherDetailPage = lazy(() =>
  import("@/features/finance/pages/VoucherDetailPage").then((m) => ({
    default: m.VoucherDetailPage,
  })),
);
const InvoicesPage = lazy(() =>
  import("@/features/finance/pages/InvoicesPage").then((m) => ({
    default: m.InvoicesPage,
  })),
);
const InvoiceDetailPage = lazy(() =>
  import("@/features/finance/pages/InvoiceDetailPage").then((m) => ({
    default: m.InvoiceDetailPage,
  })),
);
const FinanceReportsPage = lazy(() =>
  import("@/features/finance/pages/FinanceReportsPage").then((m) => ({
    default: m.FinanceReportsPage,
  })),
);

const ApprovalProcessesPage = lazy(() =>
  import("@/features/approvals/pages/ApprovalProcessesPage").then((m) => ({
    default: m.ApprovalProcessesPage,
  })),
);
const ApprovalRequestsQueuePage = lazy(() =>
  import("@/features/approvals/pages/ApprovalRequestsQueuePage").then((m) => ({
    default: m.ApprovalRequestsQueuePage,
  })),
);
const ApprovalRequestDetailPage = lazy(() =>
  import("@/features/approvals/pages/ApprovalRequestDetailPage").then((m) => ({
    default: m.ApprovalRequestDetailPage,
  })),
);

const ClinicalReportsPage = lazy(() =>
  import("@/features/reports/clinical/pages/ClinicalReportsPage").then((m) => ({
    default: m.ClinicalReportsPage,
  })),
);

const ActivityLogsPage = lazy(() =>
  import("@/features/system/pages/ActivityLogsPage").then((m) => ({
    default: m.ActivityLogsPage,
  })),
);

const RolesPage = lazy(() =>
  import("@/features/acl/pages/RolesPage").then((m) => ({
    default: m.RolesPage,
  })),
);
const RoleDetailPage = lazy(() =>
  import("@/features/acl/pages/RoleDetailPage").then((m) => ({
    default: m.RoleDetailPage,
  })),
);
const ModulesPage = lazy(() =>
  import("@/features/acl/pages/ModulesPage").then((m) => ({
    default: m.ModulesPage,
  })),
);
const ScreensPage = lazy(() =>
  import("@/features/acl/pages/ScreensPage").then((m) => ({
    default: m.ScreensPage,
  })),
);
const PermissionsPage = lazy(() =>
  import("@/features/acl/pages/PermissionsPage").then((m) => ({
    default: m.PermissionsPage,
  })),
);
const UsersPage = lazy(() =>
  import("@/features/acl/pages/UsersPage").then((m) => ({
    default: m.UsersPage,
  })),
);

function SuspenseFallback() {
  return <LoadingState rows={8} />;
}

function NotFoundPage() {
  return (
    <Result
      status="404"
      title="Page not found"
      subTitle="The page you're looking for doesn't exist."
      extra={
        <Link to="/dashboard">
          <Button type="primary">Back to Dashboard</Button>
        </Link>
      }
    />
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<SuspenseFallback />}>
      <Routes>
        <Route element={<GuestGuard />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route element={<AuthGuard />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />

            <Route path="/patients" element={<PatientsListPage />} />
            <Route path="/patients/new" element={<PatientRegisterPage />} />
            <Route path="/patients/:id" element={<PatientDetailPage />} />

            <Route
              path="/administration/hr-setup/currencies"
              element={<CurrenciesPage />}
            />
            <Route
              path="/administration/hr-setup/education-levels"
              element={<EducationLevelsPage />}
            />
            <Route
              path="/administration/hr-setup/employment-statuses"
              element={<EmploymentStatusesPage />}
            />
            <Route
              path="/administration/hr-setup/job-categories"
              element={<JobCategoriesPage />}
            />
            <Route
              path="/administration/hr-setup/job-titles"
              element={<JobTitlesPage />}
            />
            <Route
              path="/administration/hr-setup/languages"
              element={<LanguagesPage />}
            />
            <Route
              path="/administration/hr-setup/pay-grades"
              element={<PayGradesPage />}
            />
            <Route
              path="/administration/hr-setup/skills"
              element={<SkillsPage />}
            />
            <Route
              path="/administration/hr-setup/work-shifts"
              element={<WorkShiftsPage />}
            />

            <Route path="/vitals/types" element={<VitalTypesPage />} />
            <Route path="/vitals/queue" element={<VitalsQueuePage />} />
            <Route
              path="/vitals/record/:opdVisitId"
              element={<VitalsRecordPage />}
            />

            <Route
              path="/consultation/diagnosis-types"
              element={<DiagnosisTypesPage />}
            />
            <Route
              path="/consultation/queue"
              element={<ConsultationQueuePage />}
            />
            <Route
              path="/consultation/visit/:opdVisitId"
              element={<ConsultationVisitPage />}
            />

            <Route
              path="/laboratory/test-categories"
              element={<LabTestCategoriesPage />}
            />
            <Route path="/laboratory/tests" element={<LabTestsPage />} />
            <Route
              path="/laboratory/tests/:labTestId/parameters"
              element={<LabTestParametersPage />}
            />
            <Route path="/laboratory/queue" element={<LabQueuePage />} />
            <Route
              path="/laboratory/visit/:opdVisitId"
              element={<LabVisitPage />}
            />

            <Route path="/radiology/tests" element={<RadiologyTestsPage />} />
            <Route path="/radiology/queue" element={<RadiologyQueuePage />} />
            <Route
              path="/radiology/visit/:opdVisitId"
              element={<RadiologyVisitPage />}
            />

            <Route path="/pharmacy/medicines" element={<MedicinesPage />} />
            <Route
              path="/pharmacy/side-effect-types"
              element={<SideEffectTypesPage />}
            />
            <Route
              path="/pharmacy/pending-dispense"
              element={<PendingDispensePage />}
            />
            <Route
              path="/pharmacy/prescribe/:opdVisitId"
              element={<PrescribeMedicinePage />}
            />

            <Route path="/ipd/wards" element={<WardsPage />} />
            <Route path="/ipd/wards/:wardId" element={<WardDetailPage />} />
            <Route
              path="/ipd/admit/:opdVisitId"
              element={<AdmitPatientPage />}
            />

            <Route path="/ot/procedures" element={<OtProceduresPage />} />
            <Route
              path="/ot/surgical-statistics"
              element={<SurgicalStatisticsPage />}
            />
            <Route path="/ot/visit/:opdVisitId" element={<OtVisitPage />} />

            <Route path="/blood-bank/bags" element={<BloodBagsPage />} />
            <Route
              path="/blood-bank/bags/:bagId"
              element={<BloodBagDetailPage />}
            />
            <Route
              path="/blood-bank/report"
              element={<BloodGroupReportPage />}
            />

            <Route path="/ambulance/vehicles" element={<VehiclesPage />} />
            <Route path="/ambulance/drivers" element={<DriversPage />} />
            <Route
              path="/ambulance/destination-hospitals"
              element={<DestinationHospitalsPage />}
            />
            <Route path="/ambulance/trips" element={<TripsPage />} />
            <Route
              path="/ambulance/trips/dispatch"
              element={<DispatchTripPage />}
            />
            <Route
              path="/ambulance/trips/:tripId"
              element={<TripDetailPage />}
            />
            <Route path="/ambulance/report" element={<TripReportPage />} />

            <Route path="/hr/employees" element={<EmployeesPage />} />
            <Route
              path="/hr/employees/:employeeId"
              element={<EmployeeProfilePage />}
            />

            <Route path="/attendance/holidays" element={<HolidaysPage />} />
            <Route path="/attendance/devices" element={<DevicesPage />} />
            <Route
              path="/attendance/records"
              element={<AttendanceRecordsPage />}
            />
            <Route
              path="/attendance/operations"
              element={<AttendanceOperationsPage />}
            />

            <Route path="/leave/types" element={<LeaveTypesPage />} />
            <Route
              path="/leave/entitlements"
              element={<LeaveEntitlementsPage />}
            />
            <Route
              path="/leave/employee-leaves"
              element={<EmployeeLeavesPage />}
            />
            <Route path="/leave/apply" element={<LeaveApplicationPage />} />

            <Route path="/payroll/tax-slabs" element={<TaxSlabsPage />} />
            <Route
              path="/payroll/allowances"
              element={<PayrollAllowancesPage />}
            />
            <Route
              path="/payroll/deductions"
              element={<PayrollDeductionsPage />}
            />
            <Route
              path="/payroll/attendance-exemptions"
              element={<AttendanceExemptionsPage />}
            />
            <Route path="/payroll/bonuses" element={<BonusesPage />} />
            <Route path="/payroll/overtime" element={<OvertimePage />} />
            <Route path="/payroll/arrears" element={<ArrearsPage />} />
            <Route path="/payroll/run" element={<PayrollRunPage />} />

            <Route
              path="/warehouse/item-attributes"
              element={<ItemAttributesPage />}
            />
            <Route path="/warehouse/item-brands" element={<ItemBrandsPage />} />
            <Route
              path="/warehouse/item-categories"
              element={<ItemCategoriesPage />}
            />
            <Route
              path="/warehouse/item-sub-categories"
              element={<ItemSubCategoriesPage />}
            />
            <Route path="/warehouse/item-units" element={<ItemUnitsPage />} />
            <Route path="/warehouse/locations" element={<LocationsPage />} />
            <Route path="/warehouse/items" element={<ItemsPage />} />
            <Route
              path="/warehouse/indent-requests"
              element={<IndentRequestsPage />}
            />
            <Route
              path="/warehouse/indent-requests/:indentId"
              element={<IndentRequestDetailPage />}
            />
            <Route path="/warehouse/stock" element={<StockPage />} />
            <Route
              path="/warehouse/reports"
              element={<WarehouseReportsPage />}
            />

            <Route
              path="/procurement/supplier-categories"
              element={<SupplierCategoriesPage />}
            />
            <Route path="/procurement/suppliers" element={<SuppliersPage />} />
            <Route
              path="/procurement/brand-preferences"
              element={<ItemBrandPreferencesPage />}
            />
            <Route
              path="/procurement/purchase-requests"
              element={<PurchaseRequestsPage />}
            />
            <Route
              path="/procurement/purchase-requests/:requestId"
              element={<PurchaseRequestDetailPage />}
            />
            <Route
              path="/procurement/purchase-orders"
              element={<PurchaseOrdersPage />}
            />
            <Route
              path="/procurement/purchase-orders/:orderId"
              element={<PurchaseOrderDetailPage />}
            />
            <Route
              path="/procurement/instruction-set"
              element={<InstructionSetPage />}
            />

            <Route
              path="/finance/chart-accounts"
              element={<ChartAccountsPage />}
            />
            <Route path="/finance/fiscal-years" element={<FiscalYearsPage />} />
            <Route path="/finance/gl-configs" element={<GlConfigsPage />} />
            <Route path="/finance/vouchers" element={<VouchersPage />} />
            <Route
              path="/finance/vouchers/:voucherId"
              element={<VoucherDetailPage />}
            />
            <Route path="/finance/invoices" element={<InvoicesPage />} />
            <Route
              path="/finance/invoices/:invoiceId"
              element={<InvoiceDetailPage />}
            />
            <Route path="/finance/reports" element={<FinanceReportsPage />} />

            <Route
              path="/approval/processes"
              element={<ApprovalProcessesPage />}
            />
            <Route
              path="/approval/requests"
              element={<ApprovalRequestsQueuePage />}
            />
            <Route
              path="/approval/requests/:requestId"
              element={<ApprovalRequestDetailPage />}
            />

            <Route path="/clinical-reports" element={<ClinicalReportsPage />} />

            <Route
              path="/system/activity-logs"
              element={<ActivityLogsPage />}
            />

            <Route path="/administration/roles" element={<RolesPage />} />
            <Route
              path="/administration/roles/:roleId"
              element={<RoleDetailPage />}
            />
            <Route path="/administration/modules" element={<ModulesPage />} />
            <Route path="/administration/screens" element={<ScreensPage />} />
            <Route
              path="/administration/permissions"
              element={<PermissionsPage />}
            />
            <Route path="/administration/users" element={<UsersPage />} />

            <Route
              path="/settings/change-password"
              element={<ChangePasswordPage />}
            />

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
