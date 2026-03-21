import type {
  AsaasCreateCustomerInput,
  AsaasCreateSubscriptionInput,
  AsaasCustomer,
  AsaasSubscription,
} from "./types"

function getApiUrl(): string {
  return (process.env.ASAAS_API_URL ?? "https://www.asaas.com/api/v3").replace(/\/$/, "")
}

function getApiKey(): string {
  const key = process.env.ASAAS_API_KEY ?? ""
  if (!key) throw new Error("ASAAS_API_KEY nao configurado")
  return key
}

async function asaasFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${getApiUrl()}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      access_token: getApiKey(),
      ...((options?.headers as Record<string, string>) ?? {}),
    },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Asaas ${res.status}: ${body}`)
  }
  return res.json() as Promise<T>
}

export async function createAsaasCustomer(
  input: AsaasCreateCustomerInput
): Promise<AsaasCustomer> {
  return asaasFetch<AsaasCustomer>("/customers", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export async function findAsaasCustomerByExternalReference(
  ref: string
): Promise<AsaasCustomer | null> {
  const data = await asaasFetch<{ data: AsaasCustomer[] }>(
    `/customers?externalReference=${encodeURIComponent(ref)}&limit=1`
  )
  return data.data?.[0] ?? null
}

export async function updateAsaasCustomer(
  customerId: string,
  input: Partial<AsaasCreateCustomerInput>
): Promise<AsaasCustomer> {
  return asaasFetch<AsaasCustomer>(`/customers/${customerId}`, {
    method: "PUT",
    body: JSON.stringify(input),
  })
}


  input: AsaasCreateSubscriptionInput
): Promise<AsaasSubscription> {
  return asaasFetch<AsaasSubscription>("/subscriptions", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export async function cancelAsaasSubscription(subscriptionId: string): Promise<void> {
  await asaasFetch(`/subscriptions/${subscriptionId}`, { method: "DELETE" })
}

export async function getAsaasSubscription(subscriptionId: string): Promise<AsaasSubscription> {
  return asaasFetch<AsaasSubscription>(`/subscriptions/${subscriptionId}`)
}
