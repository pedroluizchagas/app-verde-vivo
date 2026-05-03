import Stripe from "stripe"

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error("STRIPE_SECRET_KEY nao configurado")
  return new Stripe(key)
}

/**
 * Busca cliente Stripe pelo metadado user_id.
 * Se nao existir, cria um novo.
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name?: string | null
): Promise<string> {
  const stripe = getStripe()

  const existing = await stripe.customers.search({
    query: `metadata['user_id']:'${userId}'`,
    limit: 1,
  })

  if (existing.data.length > 0) {
    return existing.data[0].id
  }

  const customer = await stripe.customers.create({
    email,
    name: name ?? undefined,
    metadata: { user_id: userId },
  })

  return customer.id
}

/**
 * Cria uma Checkout Session do Stripe para assinar um plano.
 * O subscriptionDbId e passado nos metadados para o webhook conseguir
 * associar o pagamento ao registro correto no banco.
 */
export async function createStripeCheckoutSession(params: {
  stripeCustomerId: string
  priceId: string
  userId: string
  subscriptionDbId: string
  successUrl: string
  cancelUrl: string
}): Promise<{ url: string; sessionId: string }> {
  const stripe = getStripe()

  const session = await stripe.checkout.sessions.create({
    customer: params.stripeCustomerId,
    mode: "subscription",
    line_items: [{ price: params.priceId, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      user_id: params.userId,
      subscription_db_id: params.subscriptionDbId,
    },
    subscription_data: {
      metadata: {
        user_id: params.userId,
        subscription_db_id: params.subscriptionDbId,
      },
    },
  })

  if (!session.url) throw new Error("Stripe nao retornou URL de checkout")
  return { url: session.url, sessionId: session.id }
}

/**
 * Cancela uma assinatura imediatamente no Stripe.
 */
export async function cancelStripeSubscription(subscriptionId: string): Promise<void> {
  const stripe = getStripe()
  await stripe.subscriptions.cancel(subscriptionId)
}

/**
 * Cria uma sessao do Customer Portal para o usuario gerenciar
 * metodo de pagamento, ver faturas ou cancelar a assinatura.
 */
export async function createStripePortalSession(
  stripeCustomerId: string,
  returnUrl: string
): Promise<string> {
  const stripe = getStripe()
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  })
  return session.url
}

/**
 * Recupera uma assinatura Stripe pelo ID.
 */
export async function retrieveStripeSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  const stripe = getStripe()
  return stripe.subscriptions.retrieve(subscriptionId)
}

/**
 * Lista assinaturas ativas de um cliente Stripe.
 */
export async function listActiveStripeSubscriptions(customerId: string): Promise<Stripe.Subscription[]> {
  const stripe = getStripe()
  const result = await stripe.subscriptions.list({
    customer: customerId,
    status: "active",
    limit: 10,
  })
  return result.data
}

/**
 * Valida e desserializa o evento de webhook do Stripe.
 * Lanca erro se a assinatura for invalida.
 */
export function constructStripeWebhookEvent(
  body: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  const stripe = getStripe()
  return stripe.webhooks.constructEvent(body, signature, secret)
}
