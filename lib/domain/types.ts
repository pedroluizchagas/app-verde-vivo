/**
 * Tipos de domínio alinhados ao schema Supabase do Gestão Garden.
 *
 * Definidos manualmente nesta fase (Fase 02). Geração automática a partir
 * do schema fica para Fase 03. Cada tipo aqui reflete os campos efetivamente
 * lidos pelas páginas/componentes web — não é exaustivo.
 */

export interface ClienteResumo {
  id: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  email?: string | null;
  notes?: string | null;
}

export type AppointmentStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

export interface Appointment {
  id: string;
  gardener_id: string;
  client_id: string | null;
  service_id?: string | null;
  title: string;
  description?: string | null;
  scheduled_date: string;
  duration_minutes?: number | null;
  end_date?: string | null;
  all_day?: boolean | null;
  status: AppointmentStatus | string;
  type?: string | null;
  location?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  client?: ClienteResumo | ClienteResumo[] | null;
}

export type BudgetStatus = "pending" | "approved" | "rejected" | string;

export interface Budget {
  id: string;
  gardener_id: string;
  client_id: string | null;
  title: string;
  description?: string | null;
  total_amount: number;
  status: BudgetStatus;
  valid_until?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  client?: ClienteResumo | ClienteResumo[] | null;
}

export type FinancialType = "income" | "expense";
export type FinancialStatus = "paid" | "pending" | string;

export interface FinancialTransaction {
  id: string;
  gardener_id: string;
  type: FinancialType;
  amount: number;
  transaction_date: string;
  description?: string | null;
  category_id?: string | null;
  client_id?: string | null;
  status: FinancialStatus;
  due_date?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  category?: { id: string; name: string; kind?: FinancialType | null } | null;
  client?: ClienteResumo | null;
}

export interface FinancialCategory {
  id: string;
  gardener_id: string;
  name: string;
  parent_id?: string | null;
  kind?: FinancialType | null;
}

export interface MaintenancePlan {
  id: string;
  gardener_id: string;
  client_id: string | null;
  service_id?: string | null;
  title: string;
  default_description?: string | null;
  default_labor_cost?: number | null;
  materials_markup_pct?: number | null;
  preferred_weekday?: number | null;
  preferred_week_of_month?: number | null;
  window_days?: number | null;
  billing_day?: number | null;
  status: "active" | "paused" | string;
  created_at?: string | null;
  updated_at?: string | null;
  client?: ClienteResumo | ClienteResumo[] | null;
}

export interface PlanExecution {
  id: string;
  plan_id: string;
  cycle: string;
  status: "open" | "done" | string;
  task_id?: string | null;
  appointment_id?: string | null;
  transaction_id?: string | null;
  final_amount?: number | null;
  notes?: string | null;
  details?: { schedule?: { date?: string; startTime?: string; endTime?: string } | null } | null;
  created_at?: string | null;
}

export interface MaintenanceTemplate {
  plan_id: string;
  details?: { schedule?: { date?: string; startTime?: string; endTime?: string } | null } | null;
}

export interface Task {
  id: string;
  gardener_id: string;
  title: string;
  description?: string | null;
  organized_description?: string | null;
  importance?: "low" | "medium" | "high" | null;
  tags?: string[] | null;
  status: "open" | "in_progress" | "done" | string;
  due_date?: string | null;
  client_id?: string | null;
  created_at?: string | null;
}

export interface Note {
  id: string;
  gardener_id: string;
  title?: string | null;
  content: string;
  organized_content?: string | null;
  importance?: "low" | "medium" | "high" | null;
  tags?: string[] | null;
  client_id?: string | null;
  appointment_id?: string | null;
  created_at?: string | null;
}

export interface Product {
  id: string;
  gardener_id: string;
  name: string;
  unit?: string | null;
  cost?: number | null;
  current_stock?: number | null;
  min_stock?: number | null;
  created_at?: string | null;
}

export interface ProductMovement {
  id: string;
  gardener_id: string;
  product_id: string;
  type: "in" | "out";
  quantity: number;
  unit_cost?: number | null;
  movement_date?: string | null;
  description?: string | null;
  appointment_id?: string | null;
  created_at?: string | null;
}

export interface WorkOrder {
  id: string;
  gardener_id: string;
  client_id: string | null;
  appointment_id?: string | null;
  title: string;
  description?: string | null;
  status: string;
  total_amount?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  client?: ClienteResumo | ClienteResumo[] | null;
}

export interface ProfileRow {
  id: string;
  email?: string | null;
  full_name?: string | null;
  plan?: string | null;
  trial_ends_at?: string | null;
  company_name?: string | null;
  company_subtitle?: string | null;
  watermark_base64?: string | null;
  watermark_fit?: "contain" | "cover" | string | null;
  stripe_customer_id?: string | null;
}
