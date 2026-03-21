export type AsaasBillingType = "BOLETO" | "CREDIT_CARD" | "PIX" | "UNDEFINED"

export type AsaasSubscriptionCycle =
  | "WEEKLY"
  | "BIWEEKLY"
  | "MONTHLY"
  | "QUARTERLY"
  | "SEMIANNUALLY"
  | "YEARLY"

export type AsaasSubscriptionStatus = "ACTIVE" | "INACTIVE" | "EXPIRED"

export interface AsaasCustomer {
  id: string
  name: string
  email: string
  cpfCnpj?: string
  externalReference?: string
}

export interface AsaasCreateCustomerInput {
  name: string
  email: string
  cpfCnpj?: string
  externalReference?: string
  notificationDisabled?: boolean
}

/** Subscription response from Asaas. `paymentLink` is the payments link ID, not the public URL. */
export interface AsaasSubscription {
  id: string
  customer: string
  paymentLink?: string | null
  value: number
  nextDueDate: string
  cycle: AsaasSubscriptionCycle
  description: string
  billingType: AsaasBillingType
  status: AsaasSubscriptionStatus
  externalReference?: string
  dateCreated?: string
  checkoutSession?: string | null
}

/** GET /paymentLinks/{id} */
export interface AsaasPaymentLinkDetails {
  id: string
  url: string
  name?: string
  active?: boolean
}

/** Payment row from GET /subscriptions/{id}/payments */
export interface AsaasSubscriptionPayment {
  id: string
  invoiceUrl?: string | null
}

export interface AsaasCreateSubscriptionInput {
  customer: string
  billingType: AsaasBillingType
  value: number
  nextDueDate: string
  cycle: AsaasSubscriptionCycle
  description: string
  externalReference?: string
  maxPayments?: number
}

export interface AsaasPaymentWebhookData {
  id: string
  customer: string
  subscription?: string
  value: number
  status: string
  externalReference?: string
  dateCreated: string
  dueDate: string
  paymentDate?: string
}

export interface AsaasWebhookPayload {
  event: string
  payment?: AsaasPaymentWebhookData
  subscription?: {
    id: string
    customer: string
    status: string
    externalReference?: string
  }
}
