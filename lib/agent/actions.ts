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
  const { client_id, client_name, appointment_id, title = "Serviço de manutenção", description, total_amount, due_date } = params || {}
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

  // 2) Lança receita pendente (receitas a receber)
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
        status: "pending",
        due_date: finalDueDate,
        paid_at: null,
      },
    ])
    .select("id")
    .single()
  if (tErr) throw tErr

  return { ok: true, budget_id: budgetRow?.id, transaction_id: trxRow?.id }
}

export async function recordServiceIncome(userId: string, params: any) {
  const supabase = await createSupabaseServer()
  const { client_id, client_name, service_name, title = service_name || "Serviço", description, total_amount, due_date } = params || {}
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

  // Lança receita a receber
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
        status: "pending",
        due_date: due_date ?? today,
        paid_at: null,
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