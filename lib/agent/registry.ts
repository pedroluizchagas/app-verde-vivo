import {
  scheduleVisit,
  createBudget,
  updateBudgetStatus,
  updateStock,
  createClient,
  approveBudgetAndRecordIncome,
  recordServiceIncome,
  recordIncome,
  recordExpense,
  recordInventoryPurchase,
  recordPartnerCommission,
  createNote,
  createTask,
  createMaintenancePlan,
  generateMonthlyTask,
  closeMonthlyExecution,
} from "./actions";
import type { AgentParams } from "./schema";
import { schemas, type IntentKey } from "./intent-schemas";

export { schemas };

type IntentAction = (userId: string, params: AgentParams, token?: string) => Promise<unknown>;

export const registry: Record<
  IntentKey,
  {
    schema: (typeof schemas)[IntentKey];
    action: IntentAction;
    critical?: boolean;
  }
> = {
  create_client: { schema: schemas.create_client, action: createClient as IntentAction },
  schedule_visit: { schema: schemas.schedule_visit, action: scheduleVisit as IntentAction },
  create_budget: { schema: schemas.create_budget, action: createBudget as IntentAction },
  update_budget_status: {
    schema: schemas.update_budget_status,
    action: updateBudgetStatus as IntentAction,
    critical: true,
  },
  update_stock: {
    schema: schemas.update_stock,
    action: updateStock as IntentAction,
    critical: true,
  },
  approve_budget_and_record_income: {
    schema: schemas.approve_budget_and_record_income,
    action: approveBudgetAndRecordIncome as IntentAction,
    critical: true,
  },
  record_service_income: {
    schema: schemas.record_service_income,
    action: recordServiceIncome as IntentAction,
    critical: true,
  },
  record_income: {
    schema: schemas.record_income,
    action: recordIncome as IntentAction,
    critical: true,
  },
  record_expense: {
    schema: schemas.record_expense,
    action: recordExpense as IntentAction,
    critical: true,
  },
  record_inventory_purchase: {
    schema: schemas.record_inventory_purchase,
    action: recordInventoryPurchase as IntentAction,
    critical: true,
  },
  record_partner_commission: {
    schema: schemas.record_partner_commission,
    action: recordPartnerCommission as IntentAction,
    critical: true,
  },
  create_note: { schema: schemas.create_note, action: createNote as IntentAction },
  create_task: { schema: schemas.create_task, action: createTask as IntentAction },
  create_maintenance_plan: {
    schema: schemas.create_maintenance_plan,
    action: createMaintenancePlan as IntentAction,
  },
  generate_monthly_task: {
    schema: schemas.generate_monthly_task,
    action: generateMonthlyTask as IntentAction,
  },
  close_monthly_execution: {
    schema: schemas.close_monthly_execution,
    action: closeMonthlyExecution as IntentAction,
    critical: true,
  },
};

export function validateIntent(intent: string, params: unknown) {
  const entry = registry[intent as IntentKey];
  if (!entry) return { ok: false as const, need: [], error: "Intent desconhecida" };
  const parsed = entry.schema.safeParse(params);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => i.path.join("."));
    return { ok: false as const, need: issues };
  }
  return { ok: true as const, value: parsed.data as AgentParams, critical: !!entry.critical };
}

export async function executeIntent(
  userId: string,
  intent: string,
  params: AgentParams,
  token?: string,
) {
  const entry = registry[intent as IntentKey];
  if (!entry) throw new Error("Intent desconhecida");
  return await entry.action(userId, params, token);
}
