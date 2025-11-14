import { createClient as createSupabaseServer } from "@/lib/supabase/server"
import { createGroqClient } from "@/lib/groq/client"

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

  const categoryId = await findOrCreateCategoryId(supabase, userId, category_name, parent_category_name, "expense")

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

async function findOrCreateCategoryId(supabase: any, userId: string, name?: string, parentName?: string, kind?: "expense" | "income") {
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
    .select("id, kind")
    .eq("gardener_id", userId)
    .eq("name", categoryName)
    .eq("parent_id", parentId)
    .limit(1)
    .maybeSingle()
  if (c?.id) {
    // opcional: se existir mas sem kind, e fornecemos kind, podemos atualizar
    if (!c.kind && kind) {
      await supabase.from("financial_categories").update({ kind }).eq("id", c.id)
    }
    return c.id
  }

  const { data: created, error } = await supabase
    .from("financial_categories")
    .insert([{ gardener_id: userId, name: categoryName, parent_id: parentId, kind: kind ?? null }])
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
    const catId = await findOrCreateCategoryId(supabase, userId, "Insumos", "Estoque", "expense")
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

export async function createNote(userId: string, params: any) {
  const supabase = await createSupabaseServer()
  const { title, content, importance = "medium", tags, client_name, appointment_id } = params || {}
  if (!content || String(content).trim().length === 0) throw new Error("content é obrigatório")

  let clientId: string | null = null
  if (client_name) {
    clientId = await findClientIdByName(supabase, userId, client_name)
  }

  let organized: string = String(content)
  let finalTitle: string = title ?? "Nota"

  try {
    const groq = createGroqClient()
    const model = process.env.GROQ_MODEL || process.env.NEXT_PUBLIC_ASSISTANT_MODEL || "llama-3.1-8b-instant"
    const completion = await groq.chat.completions.create({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: "Organize ideias curtas e soltas em uma nota clara e acionável. Responda em JSON com { title: string, organized_content: string }. Use português." },
        { role: "user", content: String(content) },
      ],
    })
    const txt = completion.choices[0]?.message?.content ?? ""
    try {
      const parsed = JSON.parse(txt)
      if (parsed?.organized_content) organized = String(parsed.organized_content)
      if (parsed?.title && !title) finalTitle = String(parsed.title)
    } catch {
      organized = txt || organized
    }
  } catch {}

  if (!finalTitle || finalTitle.trim().length === 0) {
    const s = String(content).trim()
    finalTitle = s.slice(0, 80)
  }

  const { data, error } = await supabase
    .from("notes")
    .insert([
      {
        gardener_id: userId,
        title: finalTitle,
        content: String(content),
        organized_content: organized,
        importance,
        tags: Array.isArray(tags) ? tags : null,
        client_id: clientId,
        appointment_id: appointment_id ?? null,
      },
    ])
    .select("id")
    .single()
  if (error) throw error
  return { ok: true, id: data?.id }
}

export async function createTask(userId: string, params: any) {
  const supabase = await createSupabaseServer()
  const { title, description, importance = "medium", tags, client_name, due_date, status = "open" } = params || {}
  let clientId: string | null = null
  if (client_name) {
    clientId = await findClientIdByName(supabase, userId, client_name)
  }
  let organized: string = String(description || "")
  let finalTitle: string = title ?? "Tarefa"
  try {
    if (!title || !description) {
      const groq = createGroqClient()
      const model = process.env.GROQ_MODEL || process.env.NEXT_PUBLIC_ASSISTANT_MODEL || "llama-3.1-8b-instant"
      const completion = await groq.chat.completions.create({
        model,
        temperature: 0.2,
        messages: [
          { role: "system", content: "Estruture uma tarefa clara e objetiva. Responda em JSON com { title: string, organized_description: string }. Use português." },
          { role: "user", content: String(description || title || "") },
        ],
      })
      const txt = completion.choices[0]?.message?.content ?? ""
      try {
        const parsed = JSON.parse(txt)
        if (parsed?.organized_description) organized = String(parsed.organized_description)
        if (parsed?.title && !title) finalTitle = String(parsed.title)
      } catch {
        organized = txt || organized
      }
    }
  } catch {}
  if (!finalTitle || finalTitle.trim().length === 0) {
    const s = String(description || title || "").trim()
    finalTitle = s.slice(0, 80) || "Tarefa"
  }
  const { data, error } = await supabase
    .from("tasks")
    .insert([
      {
        gardener_id: userId,
        title: finalTitle,
        description: description || null,
        organized_description: organized || null,
        importance,
        tags: Array.isArray(tags) ? tags : null,
        due_date: due_date ? String(due_date).slice(0, 10) : null,
        client_id: clientId,
        status,
      },
    ])
    .select("id")
    .single()
  if (error) throw error
  return { ok: true, id: data?.id }
}

export async function createMaintenancePlan(userId: string, params: any) {
  const supabase = await createSupabaseServer()
  const { client_id, client_name, service_name, title, default_labor_cost = 0, materials_markup_pct = 0, preferred_weekday, preferred_week_of_month, window_days = 7, billing_day, status = "active" } = params || {}
  if (!title) throw new Error("title é obrigatório")
  const cid = client_id || (await findClientIdByName(supabase, userId, client_name))
  if (!cid) throw new Error("Cliente não encontrado")
  const sid = await findServiceIdByName(supabase, userId, service_name)
  const { data, error } = await supabase
    .from("maintenance_plans")
    .insert([
      {
        gardener_id: userId,
        client_id: cid,
        service_id: sid ?? null,
        title,
        default_description: null,
        default_labor_cost,
        materials_markup_pct,
        preferred_weekday: typeof preferred_weekday === "number" ? preferred_weekday : null,
        preferred_week_of_month: typeof preferred_week_of_month === "number" ? preferred_week_of_month : null,
        window_days,
        billing_day: typeof billing_day === "number" ? billing_day : null,
        status,
      },
    ])
    .select("id")
    .single()
  if (error) throw error
  return { ok: true, id: data?.id }
}

export async function generateMonthlyTask(userId: string, params: any) {
  const supabase = await createSupabaseServer()
  const { plan_id, client_name, cycle } = params || {}
  let pid = plan_id as string | undefined
  if (!pid && client_name) {
    const { data: plan } = await supabase
      .from("maintenance_plans")
      .select("id")
      .eq("gardener_id", userId)
      .eq("status", "active")
      .eq("client_id", await findClientIdByName(supabase, userId, client_name))
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    pid = plan?.id
  }
  if (!pid) throw new Error("Plano não encontrado")
  const now = new Date()
  const cyc = cycle || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const { data: exists } = await supabase
    .from("plan_executions")
    .select("id, task_id")
    .eq("plan_id", pid)
    .eq("cycle", cyc)
    .maybeSingle()
  if (exists?.task_id) return { ok: true, existed: true, task_id: exists.task_id }
  const { data: plan } = await supabase
    .from("maintenance_plans")
    .select("title, client_id, default_labor_cost")
    .eq("id", pid)
    .maybeSingle()
  if (!plan) throw new Error("Plano inválido")
  const { data: task, error: tErr } = await supabase
    .from("tasks")
    .insert([
      {
        gardener_id: userId,
        title: `Manutenção mensal: ${plan.title}`,
        description: null,
        organized_description: null,
        importance: "medium",
        tags: ["manutenção", cyc],
        status: "open",
        due_date: null,
      },
    ])
    .select("id")
    .single()
  if (tErr) throw tErr
  const { error: eErr } = await supabase
    .from("plan_executions")
    .insert([{ plan_id: pid, cycle: cyc, task_id: task?.id, status: "open" }])
  if (eErr) throw eErr
  return { ok: true, task_id: task?.id }
}

export async function closeMonthlyExecution(userId: string, params: any) {
  const supabase = await createSupabaseServer()
  const { plan_id, execution_id, client_name, title, description, labor_cost, materials_total, status = "paid", due_date } = params || {}
  let execId = execution_id as string | undefined
  let pid = plan_id as string | undefined
  if (!pid && client_name) {
    const { data: plan } = await supabase
      .from("maintenance_plans")
      .select("id, client_id")
      .eq("gardener_id", userId)
      .eq("client_id", await findClientIdByName(supabase, userId, client_name))
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    pid = plan?.id
  }
  if (!execId && pid) {
    const now = new Date()
    const cyc = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    const { data: ex } = await supabase
      .from("plan_executions")
      .select("id")
      .eq("plan_id", pid)
      .eq("cycle", cyc)
      .maybeSingle()
    execId = ex?.id
  }
  if (!execId) throw new Error("Execução não encontrada")
  const { data: plan } = await supabase
    .from("maintenance_plans")
    .select("client_id, title, default_labor_cost, materials_markup_pct")
    .eq("id", pid!)
    .maybeSingle()
  if (!plan) throw new Error("Plano inválido")
  const baseLabor = typeof labor_cost === "number" ? labor_cost : Number(plan.default_labor_cost || 0)
  const mats = typeof materials_total === "number" ? materials_total : 0
  const markup = Number(plan.materials_markup_pct || 0) / 100
  const total = Number((baseLabor + mats * (1 + markup)).toFixed(2))
  const today = new Date().toISOString().slice(0, 10)
  const { data: trx, error: tErr } = await supabase
    .from("financial_transactions")
    .insert([
      {
        gardener_id: userId,
        type: "income",
        amount: total,
        transaction_date: today,
        description: title || `Mensalidade: ${plan.title}`,
        category_id: null,
        client_id: plan.client_id,
        status,
        due_date: status === "pending" ? (due_date || today) : null,
        paid_at: status === "paid" ? new Date().toISOString() : null,
      },
    ])
    .select("id")
    .single()
  if (tErr) throw tErr
  const { error: uErr } = await supabase
    .from("plan_executions")
    .update({ status: "done", final_amount: total, transaction_id: trx?.id, notes: description || null })
    .eq("id", execId)
  if (uErr) throw uErr
  return { ok: true, transaction_id: trx?.id }
}