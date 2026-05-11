-- Migracao: Asaas -> Stripe
-- Adiciona colunas do Stripe mantendo as do Asaas por seguranca.
-- Apos verificar que a migracao esta estavel, as colunas Asaas podem ser removidas.

-- Stripe customer ID no perfil do usuario (substitui asaas_customer_id)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- Stripe subscription ID na tabela de assinaturas (substitui asaas_subscription_id)
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text UNIQUE;

-- Comentario: para remover as colunas Asaas apos estabilizar, execute:
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS asaas_customer_id;
-- ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS asaas_subscription_id;
-- ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS asaas_customer_id;
-- ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS payment_link;
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS cpf_cnpj;
