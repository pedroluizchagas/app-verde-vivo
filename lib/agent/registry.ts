import { z } from "zod"
import { scheduleVisit, createBudget, updateBudgetStatus, updateStock, createClient, approveBudgetAndRecordIncome, recordServiceIncome, recordIncome, recordExpense, recordInventoryPurchase, recordPartnerCommission } from "./actions"

export const schemas = {
  create_client: z.object({
    name: z.string().min(2),
    phone: z.string().min(6),
    address: z.string().min(5),
    email: z.string().email().optional(),
    notes: z.string().optional(),
  }),
  schedule_visit: z.object({
    client_id: z.string().uuid().optional(),
    client_name: z.string().min(2).optional(),
    service_name: z.string().min(2).optional(),
    title: z.string().min(2).optional(),
    description: z.string().optional(),
    scheduled_date: z.string().min(10),
    duration_minutes: z.number().int().positive().optional(),
  }),
  create_budget: z.object({
    client_id: z.string().uuid().optional(),
    client_name: z.string().min(2).optional(),
    title: z.string().min(2),
    description: z.string().optional(),
    total_amount: z.number().positive(),
    valid_until: z.string().optional(),
  }),
  update_budget_status: z.object({
    budget_id: z.string().uuid().optional(),
    title: z.string().optional(),
    client_name: z.string().optional(),
    status: z.enum(["pending", "approved", "rejected"]),
  }),
  update_stock: z.object({
    product_id: z.string().uuid().optional(),
    product_name: z.string().min(2).optional(),
    type: z.enum(["in", "out"]),
    quantity: z.number().positive(),
    unit_cost: z.number().positive().optional(),
    movement_date: z.string().optional(),
    description: z.string().optional(),
    appointment_id: z.string().uuid().optional(),
  }),
  approve_budget_and_record_income: z.object({
    client_id: z.string().uuid().optional(),
    client_name: z.string().min(2).optional(),
    appointment_id: z.string().uuid().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    total_amount: z.number().positive(),
    due_date: z.string().optional(),
  }),
  record_service_income: z.object({
    client_id: z.string().uuid().optional(),
    client_name: z.string().min(2).optional(),
    service_name: z.string().min(2).optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    total_amount: z.number().positive().optional(),
    due_date: z.string().optional(),
  }),
  record_income: z.object({
    amount: z.number().positive(),
    title: z.string().optional(),
    description: z.string().optional(),
    transaction_date: z.string().optional(),
    client_id: z.string().uuid().optional(),
    category_id: z.string().uuid().optional(),
  }),
  record_expense: z.object({
    amount: z.number().positive(),
    category_name: z.string().min(2).optional(),
    parent_category_name: z.string().min(2).optional(),
    description: z.string().optional(),
    transaction_date: z.string().optional(),
    status: z.enum(["paid", "pending"]).optional(),
    due_date: z.string().optional(),
  }),
  record_inventory_purchase: z.object({
    product_id: z.string().uuid().optional(),
    product_name: z.string().min(2).optional(),
    quantity: z.number().positive().optional(),
    unit_cost: z.number().positive().optional(),
    movement_date: z.string().optional(),
    description: z.string().optional(),
    also_record_expense: z.boolean().optional(),
  }),
  record_partner_commission: z.object({
    partner_name: z.string().min(2),
    percent: z.number().positive().max(1).optional(),
    amount: z.number().positive().optional(),
    movement_id: z.string().uuid().optional(),
    credit_type: z.enum(["cash", "insumos"]).optional(),
    description: z.string().optional(),
  }),
} as const

type Intent = keyof typeof schemas

export const registry: Record<Intent, { schema: (typeof schemas)[Intent]; action: (userId: string, params: any) => Promise<any>; critical?: boolean }> = {
  create_client: { schema: schemas.create_client, action: createClient },
  schedule_visit: { schema: schemas.schedule_visit, action: scheduleVisit },
  create_budget: { schema: schemas.create_budget, action: createBudget },
  update_budget_status: { schema: schemas.update_budget_status, action: updateBudgetStatus, critical: true },
  update_stock: { schema: schemas.update_stock, action: updateStock, critical: true },
  approve_budget_and_record_income: { schema: schemas.approve_budget_and_record_income, action: approveBudgetAndRecordIncome, critical: true },
  record_service_income: { schema: schemas.record_service_income, action: recordServiceIncome, critical: true },
  record_income: { schema: schemas.record_income, action: recordIncome, critical: true },
  record_expense: { schema: schemas.record_expense, action: recordExpense, critical: true },
  record_inventory_purchase: { schema: schemas.record_inventory_purchase, action: recordInventoryPurchase, critical: true },
  record_partner_commission: { schema: schemas.record_partner_commission, action: recordPartnerCommission, critical: true },
}

export function validateIntent(intent: string, params: any) {
  const entry = registry[intent as Intent]
  if (!entry) return { ok: false, need: [], error: "Intent desconhecida" }
  const parsed = entry.schema.safeParse(params)
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => i.path.join("."))
    return { ok: false, need: issues }
  }
  return { ok: true, value: parsed.data, critical: !!entry.critical }
}

export async function executeIntent(userId: string, intent: string, params: any) {
  const entry = registry[intent as Intent]
  if (!entry) throw new Error("Intent desconhecida")
  return await entry.action(userId, params)
}