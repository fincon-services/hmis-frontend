# HMIS Frontend — API Discovery & Module Map

Source of truth: `D:\laragon\www\hmis\storage\api-docs\api-docs.json` (OpenAPI 3, 275 paths / 408 operations, 24 tags), cross-checked against the Laravel source (`app/Http/Controllers/Api/V1/**`, `routes/api/v1/**`) because the Swagger doc does not fully specify response schemas.

## Auth model

- `POST /auth/login` — `{username, password}` → `{user_id, username, role_id, token, token_type: "Bearer"}`. Send `Authorization: Bearer {token}` on every subsequent request.
- `GET /auth/me` — `{id, username, email, is_active, active_role_id, roles: [{id, name}]}`.
- `POST /auth/logout`, `POST /auth/change-password`, `POST /auth/switch-role` (`{role_id}` — a user holding multiple roles can switch the active role for the current token without re-authenticating).
- Sanctum is configured for both stateful SPA and bearer-token use (`EnsureFrontendRequestsAreStateful`), but the login response is explicitly a bearer token — the frontend uses token auth, not cookie sessions.
- A stale/expired/evicted token returns `401` with `{message: "Your session has expired or you logged in from another device."}` (login elsewhere revokes prior tokens).

## Permission model — screen grants (fail-closed)

- Every protected route is tagged `->middleware('screen:<route_key>')`, e.g. `admin.pay-grades`, `acl.roles`, `admin.users`. `<route_key>` is `<module>.<resource>`.
- A role must have an explicit `role_screens` grant row for that `route_key`, or the API returns `403 {message: "You are not authorized to access this screen."}`. There is **no implicit-allow fallback** — this is enforced server-side and is the real security boundary.
- Finer-grained action permissions (`view`/`create`/`update`/`delete`/...) are opt-in per screen via a second `action:<route_key>,<permission>` middleware; violating it returns `403 {message: "You do not have the '<permission>' permission on this screen."}`.
- **API gap**: there is no self-service endpoint that returns the current user's granted screens/permissions for their active role. `/auth/me` returns only `roles` (id/name), not grants. `GET /acl/roles/{role}/screens` exists but itself requires the `acl.role-screens` screen grant, which ordinary clinical/HR users won't hold — so the frontend cannot proactively fetch "what can I see" to build the sidebar. **Recommended backend addition**: extend `/auth/me` (or add `/auth/me/screens`) to include the active role's granted `route_key`s (+ permissions), sourced from the existing `AclService`. Documented workaround implemented in the frontend: render the full nav tree, and let 403 responses from route-level guards mark that screen as denied in the client permission store, which then hides it from the sidebar for the rest of the session (self-healing, backend remains authoritative).

## API gaps found during Phase 8 (PIM/Attendance/Leave/Payroll)

- **No `departments` CRUD/lookup endpoint exists anywhere in the API**, despite `department_id` being a required or filterable field on numerous endpoints: `PUT /pim/employees/{employee}/job-details`, `POST /pim/employees/{employee}/postings`, `POST /pim/employees/{employee}/transfers` (`to_department_id`), `POST /attendance/pull` and `/attendance/roster-locks` (`department_id`), `GET /leave/employee-leaves/report` (`department_id`), and `GET /pim/employees` (`department_id` filter). A `Department` Eloquent model exists server-side (confirmed at `app/Models/Department.php`) but nothing exposes it over HTTP. **Recommended backend addition**: a `GET /admin/departments` (and ideally full CRUD) lookup endpoint, mirroring the other Admin - HR Setup resources. Frontend workaround: every department field in this build is a raw numeric ID input with an inline note, not a name-lookup `<Select>`.
- **No `company_bank_accounts` lookup endpoint** either, despite `PUT /pim/employees/{employee}/bank-details` accepting `company_bank_account_id` and `EmployeeResource` echoing back a nested `company_bank_account.bank_name`. Same workaround: raw numeric ID input on the Bank Details tab.

## Backend bug found during Phase 10 (Clinical Reports)

- **`GET /clinical-reports/registrations` returns HTTP 500 on this deployment's database driver.** `ClinicalReportService::registrationStatistics()` builds its query with `selectRaw('date(registration_date) as day, ...')->groupBy('day', 'origin', 'gender')`. `date(...)` is MySQL syntax; this environment runs on SQL Server (`sqlsrv` driver against `192.168.1.4:1433`), which rejects it outright: `SQLSTATE[42000]: [Microsoft][ODBC Driver 17 for SQL Server][SQL Server]'date' is not a recognized built-in function name.` Reproduced directly against the API (bypassing the frontend) with `GET /clinical-reports/registrations?date_from=2026-07-12&date_to=2026-08-11` → 500. No other report in this codebase uses a raw `date(...)` expression (grep-verified across `app/Services/*.php`), so this is isolated to this one endpoint. **Recommended backend fix**: replace the raw `date(registration_date)` with `DB::raw($this->getDateFormatSql(...))`-style driver-aware SQL, or (simpler) drop the SQL-level day grouping and bucket by day in PHP via `Collection::groupBy`, matching the pattern every other report in `ClinicalReportService` already uses (e.g. `mortalityStatistics()`). Frontend behavior: the Registrations tab's "Run" action calls this endpoint as documented; on this backend it will error. Not fixable from the frontend since the bug is in the raw SQL itself.

## Response conventions (inferred from controllers, not fully spec'd in Swagger)

- List endpoints: `AnonymousResourceCollection` — paginated (`per_page` default 25, capped 100, `per_page=0` → full unpaginated array) via Laravel's paginator: `{data: T[], links: {...}, meta: {current_page, from, last_page, path, per_page, to, total}}`. When unpaginated (`per_page=0`), just `{data: T[]}` (no `links`/`meta`).
- Common list query params: `search`, `is_active` (boolean, only on models that have the column), `sort`, `direction` (`asc`/`desc`), `per_page`.
- Single-record write endpoints: `{...resource fields}` directly (create → 201, update → 200), via a `JsonResource`.
- Delete: `200 {message: "... deleted."}`; FK-restricted deletes → `409 {message: "..."}`.
- Bulk delete: `POST .../delete-bulk` with `{ids: number[]}` → `200 {message}`.
- Validation errors: standard Laravel `422 {message, errors: {field: [msg, ...]}}`.
- Auth/permission errors: `401` (auth), `403` (screen/action grant) — both `{message}` only, no `errors` object.

## Module map → frontend features

| API tag | Endpoints | Frontend feature | Nature |
|---|---|---|---|
| Auth | 5 | `features/auth` | Auth flow |
| Admin - HR Setup | 45 | `features/administration/hr-setup` (9 resources: currencies, education-levels, employment-statuses, job-categories, job-titles, languages, pay-grades, skills, work-shifts) | Master data, generic CRUD |
| ACL (in Swagger under implicit admin routes, not a tag but present in routes) | — | **Not built** — no admin UI for roles/modules/screens/role-screen-assignment/users; only a minimal `GET /acl/roles` read-only lookup is consumed (by Approval Processes, to populate the approver-role selector). See README "Status". | Master data / admin |
| PIM - Employees | 39 | `features/hr/employees` (profile tabs: personal/contact/job/bank, documents, emergency contacts, experience, languages, qualifications, salary, skills, work-shift history) | Master data + patient-centric-style employee hub |
| PIM - Career Events | 9 | `features/hr/career-events` (postings, promotions, transfers, service-history timeline) | Transactional, employee-scoped |
| Attendance | 23 | `features/hr/attendance` (devices, pull/import, adjustments+audit log, records, absentees, roster, roster locks, holidays) | Operational + master data |
| Leave | 18 | `features/hr/leave` (types, entitlements, employee-leaves, applications, summary/report) | Transactional + master data |
| Payroll | 34 | `features/hr/payroll` (attendance exemptions, bonuses, overtime+approval, arrears, allowances, deductions, tax slabs, preview/generate, monthly, payslip, totals+approval, bank export) | Complex workflow (preview → generate → approve → export) |
| Patients | 8 | `features/patients` | Patient-centric hub — search/register/profile/visits/referral/queue |
| Vitals | 9 | `features/clinical/vitals` | Clinical workflow, queue-based |
| Consultation | 10 | `features/clinical/consultation` | Clinical workflow (diagnosis types, notes, diagnoses) |
| Laboratory | 17 | `features/clinical/laboratory` | Clinical workflow (categories/tests/parameters master data + prescription→specimen→results workflow) |
| Radiology | 9 | `features/clinical/radiology` | Clinical workflow + file upload (result upload/download) |
| Pharmacy | 16 | `features/clinical/pharmacy` | Clinical workflow (medicines master data, prescribe→pending-dispense→dispense, side effects) |
| IPD | 10 | `features/clinical/ipd` | Workflow (wards/beds master data, admit→transfer→discharge) |
| OT | 15 | `features/clinical/ot` | Workflow (procedures, schedule→refer→surgery→shift-to-ward, statistics) |
| Blood Bank | 12 | `features/clinical/blood-bank` | Workflow (bag intake→donor-screening→lab-screening→issue/discard, reports) |
| Ambulance | 17 | `features/ambulance` | Workflow (vehicles/drivers/destination-hospitals master data, dispatch→return, reports) |
| Warehouse | 43 | `features/warehouse` | Master data (categories/sub-categories/brands/units/attributes/locations/items) + workflow (indent request→issue FEFO, stock receipt/donation/return-to-vendor, reports) |
| Procurement | 23 | `features/procurement` | Workflow (purchase request→quotation→approve→purchase order) + master data (suppliers, supplier-categories, brand preferences, instruction set) |
| Finance | 21 | `features/finance` | Master data (chart of accounts, fiscal years, GL configs) + workflow (vouchers, invoice-from-GRN) + reports (trial balance, balance sheet, P&L, general journal, ledger) |
| Approval | 10 | `features/approvals` | Generic cross-module approval-chain engine (processes+role chain, requests, pending queue, decision) |
| Clinical Reports | 14 | `features/reports/clinical` | Reports (diseases, disease-burden, mortality, readmissions, registrations, wait-times, OPD funnel) |
| System | 1 | `features/system` | Admin (audit trail search) |

## Key relationships

- `Patient` is central: visits (OPD/ER), and per-visit prescriptions/records across Vitals, Consultation, Laboratory, Radiology, Pharmacy, IPD, OT, Blood Bank all key off `opdVisit` and expose both a **visit-scoped** endpoint and a **patient-wide history** endpoint (`/{module}/patients/{patient}/...`) — this is exactly the patient-centric hub the app should present.
- `Employee` (PIM) is the second hub: profile tabs + career events + attendance + leave + payroll all key off `employee`.
- Warehouse `items` feed Pharmacy (medicine↔warehouse item link for FEFO dispensing per the pharmacy prompt spec) and Procurement (purchase→GRN receipt→Warehouse stock) and Finance (GRN receipt→invoice).
- Approval is a generic engine other modules plug into (e.g., purchase requests, overtime, payroll totals reference approval-style decisions, though only Procurement/Payroll show explicit `/decision`-style or `/approve` actions in their own routes — the generic Approval engine is likely used for `purchase-requests` given its `/decision` endpoint shape mirrors `/approval/requests/{id}/decision`).

## No dashboard-statistics endpoints found

No `/dashboard` or `/stats` tag exists. The built dashboard (`features/dashboard/pages/DashboardPage.tsx`) therefore surfaces only a real count from an existing list endpoint (registered patients, via `per_page=1` + `meta.total`) plus navigational quick links into every module — no fabricated hospital-wide metrics. Endpoints like `/patients/queue`, `/pharmacy/pending-dispense`, `/approval/requests/pending`, etc. exist and are surfaced within their own module's pages, but were not further aggregated onto the dashboard itself.
