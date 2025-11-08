import { createClient as createSupabaseServer } from "@/lib/supabase/server"

export async function scheduleVisit(userId: string, params: any) {
  const supabase = await createSupabaseServer()
  const {
    title = "Visita para orçamento",
    description,
    scheduled_date,
    duration_minutes = 60,
    client_id,
    client_name,
    service_name,
  } = params || {}

  if (!scheduled_date) throw new Error("scheduled_date é obrigatório")

  const clientId = client_id || (await findClientIdByName(supabase, userId, client_name))
  if (!clientId) throw new Error("Cliente não encontrado. Informe client_id ou client_name")

  const serviceId = await findServiceIdByName(supabase, userId, service_name)

  const { error } = await supabase.from("appointments").insert([
    {
      gardener_id: userId,
      client_id: clientId,
      service_id: serviceId,
      title,
      description: description ?? null,
      scheduled_date,
      duration_minutes,
      status: "scheduled",
    },
  ])
  if (error) throw error
  return { ok: true }
}

export async function createClient(userId: string, params: any) {
  const supabase = await createSupabaseServer()
  const { name, phone, address, email, notes } = params || {}
  if (!name || !phone || !address) throw new Error("name, phone e address são obrigatórios")

  // Checagem de duplicidade por nome + endereço com normalização básica
  const norm = (s: string) => s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^a-zA-Z0-9]/g, "") // remove pontuação/espços
    .toLowerCase()

  const targetName = norm(name)
  const targetAddress = norm(address)

  const { data: candidates } = await supabase
    .from("clients")
    .select("id, name, address")
    .eq("gardener_id", userId)
    .ilike("name", `%${name}%`)
    .limit(10)

  const dup = (candidates || []).find((c: any) => norm(c.name) === targetName && norm(c.address) === targetAddress)
  if (dup?.id) {
    return { ok: true, existed: true, id: dup.id }
  }

  const { data, error } = await supabase
    .from("clients")
    .insert([
      {
        gardener_id: userId,
        name,
        phone,
        address,
        email: email ?? null,
        notes: notes ?? null,
      },
    ])
    .select("id")
    .single()
  if (error) throw error
  const newId = data?.id

  // Verificação pós-inserção para garantir visibilidade imediata
  const { data: verify } = await supabase
    .from("clients")
    .select("id")
    .eq("id", newId)
    .eq("gardener_id", userId)
    .single()

  if (!verify?.id) {
    throw new Error("Cliente não encontrado após inserção. Tente novamente.")
  }

  return { ok: true, id: newId }
}

export async function createBudget(userId: string, params: any) {
  const supabase = await createSupabaseServer()
  const { title, description, total_amount, client_id, client_name, valid_until } = params || {}
  if (!title || total_amount == null) throw new Error("title e total_amount são obrigatórios")

  const clientId = client_id || (await findClientIdByName(supabase, userId, client_name))
  if (!clientId) throw new Error("Cliente não encontrado. Informe client_id ou client_name")

  const { error } = await supabase.from("budgets").insert([
    {
      gardener_id: userId,
      client_id: clientId,
      title,
      description: description ?? null,
      total_amount,
      status: "pending",
      valid_until: valid_until ?? null,
    },
  ])
  if (error) throw error
  return { ok: true }
}

export async function updateBudgetStatus(userId: string, params: any) {
  const supabase = await createSupabaseServer()
  const { budget_id, title, client_name, status } = params || {}
  if (!status) throw new Error("status é obrigatório")

  let id = budget_id as string | undefined
  if (!id && title) {
    const { data } = await supabase.from("budgets").select("id").eq("gardener_id", userId).eq("title", title).limit(1).single()
    id = data?.id
  }
  if (!id && client_name) {
    const clientId = await findClientIdByName(supabase, userId, client_name)
    if (clientId) {
      const { data } = await supabase
        .from("budgets")
        .select("id")
        .eq("gardener_id", userId)
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()
      id = data?.id
    }
  }
  if (!id) throw new Error("Não foi possível localizar o orçamento")

  const { error } = await supabase.from("budgets").update({ status }).eq("id", id)
  if (error) throw error
  return { ok: true }
}

export async function updateStock(userId: string, params: any) {
  const supabase = await createSupabaseServer()
  const { product_id, product_name, type, quantity, unit_cost, movement_date, description, appointment_id } = params || {}
  if (!type || !quantity) throw new Error("type e quantity são obrigatórios")
  const pid = product_id || (await findProductIdByName(supabase, userId, product_name))
  if (!pid) throw new Error("Produto não encontrado. Informe product_id ou product_name")

  const { error } = await supabase.from("product_movements").insert([
    {
      gardener_id: userId,
      product_id: pid,
      type,
      quantity,
      unit_cost: unit_cost ?? null,
      movement_date: movement_date ?? new Date().toISOString().slice(0, 10),
      description: description ?? null,
      appointment_id: appointment_id ?? null,
    },
  ])
  if (error) throw error
  return { ok: true }
}

export async function approveBudgetAndRecordIncome(userId: string, params: any) {
  const supabase = await createSupabaseServer()
  const { client_id, client_name, appointment_id, title = "Serviço de manutenção", description, total_amount, due_date, status = "paid" } = params || {}
  const cid = client_id || (await findClientIdByName(supabase, userId, client_name))
  if (!cid) throw new Error("Cliente não encontrado. Informe client_id ou client_name")

  // Se houver appointment_id, tenta pegar data agendada para due_date e compor descrição
  let finalDueDate = due_date || null
  let apptDesc = ""
  if (appointment_id) {
    const { data: appt } = await supabase
      .from("appointments")
      .select("id, title, scheduled_date")
      .eq("gardener_id", userId)
      .eq("id", appointment_id)
      .maybeSingle()
    if (appt) {
      finalDueDate = finalDueDate || (appt.scheduled_date ? new Date(appt.scheduled_date).toISOString().slice(0, 10) : null)
      apptDesc = ` (Agendamento: ${appt.title ?? appt.id})`
    }
  }

  // 1) Cria orçamento aprovado
  const { data: budgetRow, error: bErr } = await supabase
    .from("budgets")
    .insert([
      {
        gardener_id: userId,
        client_id: cid,
        title,
        description: description ? `${description}${apptDesc}` : apptDesc || null,
        total_amount,
        status: "approved",
        valid_until: null,
      },
    ])
    .select("id")
    .single()
  if (bErr) throw bErr

  // 2) Lança receita (paga ou pendente)
  const today = new Date().toISOString().slice(0, 10)
  const { data: trxRow, error: tErr } = await supabase
    .from("financial_transactions")
    .insert([
      {
        gardener_id: userId,
        type: "income",
        amount: total_amount,
        transaction_date: today,
        description: `${title}${apptDesc}`,
        category_id: null,
        client_id: cid,
        status,
        due_date: status === "pending" ? finalDueDate : null,
        paid_at: status === "paid" ? new Date().toISOString() : null,
      },
    ])
    .select("id")
    .single()
  if (tErr) throw tErr

  return { ok: true, budget_id: budgetRow?.id, transaction_id: trxRow?.id }
}

export async function recordExpense(userId: string, params: any) {
  const supabase = await createSupabaseServer()
  let { amount, category_name, parent_category_name, description, transaction_date, status = "paid", due_date } = params || {}

  const parsedAmount = typeof amount === "number" ? amount : parseAmount(String(amount))
  if (!parsedAmount || parsedAmount <= 0) throw new Error("amount inválido")

  const categoryId = await findOrCreateCategoryId(supabase, userId, category_name, parent_category_name)

  const today = new Date().toISOString().slice(0, 10)
  const trxDate = transaction_date ?? today

  const { data, error } = await supabase
    .from("financial_transactions")
    .insert([
      {
        gardener_id: userId,
        type: "expense",
        amount: parsedAmount,
        transaction_date: trxDate,
        description: description ?? null,
        category_id: categoryId,
        client_id: null,
        status: status ?? "paid",
        due_date: status === "pending" ? (due_date ?? today) : null,
        paid_at: status === "paid" ? new Date().toISOString() : null,
      },
    ])
    .select("id")
    .single()
  if (error) throw error
  return { ok: true, id: data?.id }
}

function parseAmount(raw: string): number {
  // Remove R$, espaços, pontos de milhar e converte vírgula em ponto
  const s = raw.replace(/[^0-9,\.]/g, "").replace(/\./g, "").replace(/,/g, ".")
  const n = Number.parseFloat(s)
  return Number.isFinite(n) ? n : 0
}

async function findOrCreateCategoryId(supabase: any, userId: string, name?: string, parentName?: string) {
  const categoryName = name?.trim() || "Operacional"
  let parentId: string | null = null
  if (parentName) {
    const { data: p } = await supabase
      .from("financial_categories")
      .select("id")
      .eq("gardener_id", userId)
      .eq("name", parentName)
      .limit(1)
      .maybeSingle()
    if (p?.id) parentId = p.id
    else {
      const { data: newParent, error: pe } = await supabase
        .from("financial_categories")
        .insert([{ gardener_id: userId, name: parentName, parent_id: null }])
        .select("id")
        .single()
      if (pe) throw pe
      parentId = newParent?.id ?? null
    }
  }

  const { data: c } = await supabase
    .from("financial_categories")
    .select("id")
    .eq("gardener_id", userId)
    .eq("name", categoryName)
    .eq("parent_id", parentId)
    .limit(1)
    .maybeSingle()
  if (c?.id) return c.id

  const { data: created, error } = await supabase
    .from("financial_categories")
    .insert([{ gardener_id: userId, name: categoryName, parent_id: parentId }])
    .select("id")
    .single()
  if (error) throw error
  return created?.id ?? null
}

export async function recordServiceIncome(userId: string, params: any) {
  const supabase = await createSupabaseServer()
  const { client_id, client_name, service_name, title = service_name || "Serviço", description, total_amount, due_date, status = "paid" } = params || {}
  const cid = client_id || (await findClientIdByName(supabase, userId, client_name))
  if (!cid) throw new Error("Cliente não encontrado. Informe client_id ou client_name")

  const sid = await findServiceIdByName(supabase, userId, service_name)

  // Cria um registro de serviço (appointment) concluído agora
  const now = new Date()
  const scheduled_date = now.toISOString()
  const { data: apptRow, error: aErr } = await supabase
    .from("appointments")
    .insert([
      {
        gardener_id: userId,
        client_id: cid,
        service_id: sid,
        title,
        description: description ?? null,
        scheduled_date,
        duration_minutes: 60,
        status: "completed",
      },
    ])
    .select("id")
    .single()
  if (aErr) throw aErr

  // Se não houver valor, retorna necessidade de valor
  if (total_amount == null) {
    return { ok: false, need: ["total_amount"], appointment_id: apptRow?.id }
  }

  // Lança receita (paga ou pendente)
  const today = now.toISOString().slice(0, 10)
  const { data: trxRow, error: tErr } = await supabase
    .from("financial_transactions")
    .insert([
      {
        gardener_id: userId,
        type: "income",
        amount: total_amount,
        transaction_date: today,
        description: `${title}`,
        category_id: null,
        client_id: cid,
        status,
        due_date: status === "pending" ? (due_date ?? today) : null,
        paid_at: status === "paid" ? new Date().toISOString() : null,
      },
    ])
    .select("id")
    .single()
  if (tErr) throw tErr

  return { ok: true, appointment_id: apptRow?.id, transaction_id: trxRow?.id }
}

async function findClientIdByName(supabase: any, userId: string, name?: string) {
  if (!name) return null
  const { data } = await supabase.from("clients").select("id").eq("gardener_id", userId).ilike("name", name).limit(1).single()
  return data?.id ?? null
}

async function findServiceIdByName(supabase: any, userId: string, name?: string) {
  if (!name) return null
  const { data } = await supabase.from("services").select("id").eq("gardener_id", userId).ilike("name", name).limit(1).single()
  return data?.id ?? null
}

async function findProductIdByName(supabase: any, userId: string, name?: string) {
  if (!name) return null
  const { data } = await supabase.from("products").select("id").eq("gardener_id", userId).ilike("name", name).limit(1).single()
  return data?.id ?? null
}

async function findOrCreateProductId(supabase: any, userId: string, name: string) {
  const existing = await findProductIdByName(supabase, userId, name)
  if (existing) return existing
  const { data, error } = await supabase
    .from("products")
    .insert([{ gardener_id: userId, name, unit: "un", cost: 0 }])
    .select("id")
    .single()
  if (error) throw error
  return data?.id ?? null
}

export async function recordInventoryPurchase(userId: string, params: any) {
  const supabase = await createSupabaseServer()
  const { product_id, product_name, quantity, unit_cost, movement_date, description, also_record_expense } = params || {}
  if (!product_id && !product_name) throw new Error("Informe product_id ou product_name")
  const pid = product_id || (await findOrCreateProductId(supabase, userId, String(product_name)))
  if (!pid) throw new Error("Produto não encontrado/criado")

  const qty = quantity && Number(quantity) > 0 ? Number(quantity) : 1
  const ucost = unit_cost && Number(unit_cost) > 0 ? Number(unit_cost) : null

  const { error } = await supabase.from("product_movements").insert([
    {
      gardener_id: userId,
      product_id: pid,
      type: "in",
      quantity: qty,
      unit_cost: ucost,
      movement_date: movement_date ?? new Date().toISOString().slice(0, 10),
      description: description ?? null,
      appointment_id: null,
    },
  ])
  if (error) throw error
  let expenseId: string | undefined
  let expenseRecorded = false
  // Lançar saída financeira vinculada à categoria "Estoque > Insumos" quando solicitado (padrão: true)
  if (also_record_expense !== false && ucost) {
    const total = qty * (ucost ?? 0)
    const date = (movement_date ?? new Date().toISOString().slice(0, 10))
    const catId = await findOrCreateCategoryId(supabase, userId, "Insumos", "Estoque")
    const { data: trx, error: terr } = await supabase
      .from("financial_transactions")
      .insert([
        {
          gardener_id: userId,
          type: "expense",
          amount: total,
          transaction_date: date,
          description: description ?? `Compra de ${product_name ?? "produto"}`,
          category_id: catId,
          client_id: null,
          status: "paid",
          due_date: null,
          paid_at: new Date().toISOString(),
        },
      ])
      .select("id")
      .single()
    if (terr) throw terr
    expenseId = trx?.id
    expenseRecorded = true
  }
  return { ok: true, product_id: pid, expense_id: expenseId, expense_recorded: expenseRecorded }
}

export async function recordPartnerCommission(userId: string, params: any) {
  const supabase = await createSupabaseServer()
  const { partner_name, percent = 0.10, amount, movement_id, credit_type = "insumos", description } = params || {}
  if (!partner_name) throw new Error("partner_name é obrigatório")

  let creditAmount = amount as number | undefined
  if (!creditAmount) {
    if (!movement_id) throw new Error("Informe amount ou movement_id para calcular a comissão")
    const { data: mov } = await supabase
      .from("product_movements")
      .select("quantity, unit_cost")
      .eq("gardener_id", userId)
      .eq("id", movement_id)
      .maybeSingle()
    const total = mov ? Number(mov.quantity) * Number(mov.unit_cost ?? 0) : 0
    if (!total || total <= 0) throw new Error("Movimentação inválida para calcular comissão")
    creditAmount = Number((total * percent).toFixed(2))
  }

  const { data, error } = await supabase
    .from("partner_credits")
    .insert([
      {
        gardener_id: userId,
        partner_name,
        credit_amount: creditAmount,
        credit_type,
        percentage: percent,
        movement_id: movement_id ?? null,
        description: description ?? null,
        status: "available",
      },
    ])
    .select("id")
    .single()
  if (error) throw error
  return { ok: true, credit_id: data?.id }
}

export async function recordIncome(userId: string, params: any) {
  const supabase = await createSupabaseServer()
  const { amount, title = "Receita", description, transaction_date, client_id, category_id } = params || {}
  const parsedAmount = typeof amount === "number" ? amount : parseAmount(String(amount))
  if (!parsedAmount || parsedAmount <= 0) throw new Error("amount inválido")
  const today = new Date().toISOString().slice(0, 10)
  const trxDate = transaction_date ?? today

  const { data, error } = await supabase
    .from("financial_transactions")
    .insert([
      {
        gardener_id: userId,
        type: "income",
        amount: parsedAmount,
        transaction_date: trxDate,
        description: description ?? title,
        category_id: category_id ?? null,
        client_id: client_id ?? null,
        status: "paid",
        due_date: null,
        paid_at: new Date().toISOString(),
      },
    ])
    .select("id")
    .single()
  if (error) throw error
  return { ok: true, id: data?.id }
}