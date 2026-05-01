-- Optimize RLS policies that call auth.uid() so Postgres can cache the value
-- as an initPlan instead of re-evaluating it for each row.
-- Supabase recommendation:
-- https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- public.profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using ((select auth.uid()) = id);

-- public.clients
drop policy if exists "clients_select_own" on public.clients;
create policy "clients_select_own"
  on public.clients for select
  using ((select auth.uid()) = gardener_id);

drop policy if exists "clients_insert_own" on public.clients;
create policy "clients_insert_own"
  on public.clients for insert
  with check ((select auth.uid()) = gardener_id);

drop policy if exists "clients_update_own" on public.clients;
create policy "clients_update_own"
  on public.clients for update
  using ((select auth.uid()) = gardener_id);

drop policy if exists "clients_delete_own" on public.clients;
create policy "clients_delete_own"
  on public.clients for delete
  using ((select auth.uid()) = gardener_id);

-- public.services
drop policy if exists "services_select_own" on public.services;
create policy "services_select_own"
  on public.services for select
  using ((select auth.uid()) = gardener_id);

drop policy if exists "services_insert_own" on public.services;
create policy "services_insert_own"
  on public.services for insert
  with check ((select auth.uid()) = gardener_id);

drop policy if exists "services_update_own" on public.services;
create policy "services_update_own"
  on public.services for update
  using ((select auth.uid()) = gardener_id);

drop policy if exists "services_delete_own" on public.services;
create policy "services_delete_own"
  on public.services for delete
  using ((select auth.uid()) = gardener_id);

-- public.appointments
drop policy if exists "appointments_select_own" on public.appointments;
create policy "appointments_select_own"
  on public.appointments for select
  using ((select auth.uid()) = gardener_id);

drop policy if exists "appointments_insert_own" on public.appointments;
create policy "appointments_insert_own"
  on public.appointments for insert
  with check ((select auth.uid()) = gardener_id);

drop policy if exists "appointments_update_own" on public.appointments;
create policy "appointments_update_own"
  on public.appointments for update
  using ((select auth.uid()) = gardener_id);

drop policy if exists "appointments_delete_own" on public.appointments;
create policy "appointments_delete_own"
  on public.appointments for delete
  using ((select auth.uid()) = gardener_id);

-- public.budgets
drop policy if exists "budgets_select_own" on public.budgets;
create policy "budgets_select_own"
  on public.budgets for select
  using ((select auth.uid()) = gardener_id);

drop policy if exists "budgets_insert_own" on public.budgets;
create policy "budgets_insert_own"
  on public.budgets for insert
  with check ((select auth.uid()) = gardener_id);

drop policy if exists "budgets_update_own" on public.budgets;
create policy "budgets_update_own"
  on public.budgets for update
  using ((select auth.uid()) = gardener_id);

drop policy if exists "budgets_delete_own" on public.budgets;
create policy "budgets_delete_own"
  on public.budgets for delete
  using ((select auth.uid()) = gardener_id);

-- public.photos
drop policy if exists "photos_select_own" on public.photos;
create policy "photos_select_own"
  on public.photos for select
  using ((select auth.uid()) = gardener_id);

drop policy if exists "photos_insert_own" on public.photos;
create policy "photos_insert_own"
  on public.photos for insert
  with check ((select auth.uid()) = gardener_id);

drop policy if exists "photos_delete_own" on public.photos;
create policy "photos_delete_own"
  on public.photos for delete
  using ((select auth.uid()) = gardener_id);

-- public.financial_categories
drop policy if exists "financial_categories_select_own" on public.financial_categories;
create policy "financial_categories_select_own"
  on public.financial_categories for select
  using ((select auth.uid()) = gardener_id);

drop policy if exists "financial_categories_insert_own" on public.financial_categories;
create policy "financial_categories_insert_own"
  on public.financial_categories for insert
  with check ((select auth.uid()) = gardener_id);

drop policy if exists "financial_categories_update_own" on public.financial_categories;
create policy "financial_categories_update_own"
  on public.financial_categories for update
  using ((select auth.uid()) = gardener_id);

drop policy if exists "financial_categories_delete_own" on public.financial_categories;
create policy "financial_categories_delete_own"
  on public.financial_categories for delete
  using ((select auth.uid()) = gardener_id);

-- public.financial_transactions
drop policy if exists "financial_transactions_select_own" on public.financial_transactions;
create policy "financial_transactions_select_own"
  on public.financial_transactions for select
  using ((select auth.uid()) = gardener_id);

drop policy if exists "financial_transactions_insert_own" on public.financial_transactions;
create policy "financial_transactions_insert_own"
  on public.financial_transactions for insert
  with check ((select auth.uid()) = gardener_id);

drop policy if exists "financial_transactions_update_own" on public.financial_transactions;
create policy "financial_transactions_update_own"
  on public.financial_transactions for update
  using ((select auth.uid()) = gardener_id);

drop policy if exists "financial_transactions_delete_own" on public.financial_transactions;
create policy "financial_transactions_delete_own"
  on public.financial_transactions for delete
  using ((select auth.uid()) = gardener_id);

-- public.products
drop policy if exists "products_select_own" on public.products;
create policy "products_select_own"
  on public.products for select
  using ((select auth.uid()) = gardener_id);

drop policy if exists "products_insert_own" on public.products;
create policy "products_insert_own"
  on public.products for insert
  with check ((select auth.uid()) = gardener_id);

drop policy if exists "products_update_own" on public.products;
create policy "products_update_own"
  on public.products for update
  using ((select auth.uid()) = gardener_id);

drop policy if exists "products_delete_own" on public.products;
create policy "products_delete_own"
  on public.products for delete
  using ((select auth.uid()) = gardener_id);

-- public.product_movements
drop policy if exists "product_movements_select_own" on public.product_movements;
create policy "product_movements_select_own"
  on public.product_movements for select
  using ((select auth.uid()) = gardener_id);

drop policy if exists "product_movements_insert_own" on public.product_movements;
create policy "product_movements_insert_own"
  on public.product_movements for insert
  with check ((select auth.uid()) = gardener_id);

drop policy if exists "product_movements_update_own" on public.product_movements;
create policy "product_movements_update_own"
  on public.product_movements for update
  using ((select auth.uid()) = gardener_id);

drop policy if exists "product_movements_delete_own" on public.product_movements;
create policy "product_movements_delete_own"
  on public.product_movements for delete
  using ((select auth.uid()) = gardener_id);

-- public.equipment
drop policy if exists "equipment_select_own" on public.equipment;
create policy "equipment_select_own"
  on public.equipment for select
  using ((select auth.uid()) = gardener_id);

drop policy if exists "equipment_insert_own" on public.equipment;
create policy "equipment_insert_own"
  on public.equipment for insert
  with check ((select auth.uid()) = gardener_id);

drop policy if exists "equipment_update_own" on public.equipment;
create policy "equipment_update_own"
  on public.equipment for update
  using ((select auth.uid()) = gardener_id);

drop policy if exists "equipment_delete_own" on public.equipment;
create policy "equipment_delete_own"
  on public.equipment for delete
  using ((select auth.uid()) = gardener_id);

-- public.notes
drop policy if exists "notes_select_own" on public.notes;
create policy "notes_select_own"
  on public.notes for select
  using ((select auth.uid()) = gardener_id);

drop policy if exists "notes_insert_own" on public.notes;
create policy "notes_insert_own"
  on public.notes for insert
  with check ((select auth.uid()) = gardener_id);

drop policy if exists "notes_update_own" on public.notes;
create policy "notes_update_own"
  on public.notes for update
  using ((select auth.uid()) = gardener_id);

drop policy if exists "notes_delete_own" on public.notes;
create policy "notes_delete_own"
  on public.notes for delete
  using ((select auth.uid()) = gardener_id);

-- public.tasks
drop policy if exists "tasks_select_own" on public.tasks;
create policy "tasks_select_own"
  on public.tasks for select
  using ((select auth.uid()) = gardener_id);

drop policy if exists "tasks_insert_own" on public.tasks;
create policy "tasks_insert_own"
  on public.tasks for insert
  with check ((select auth.uid()) = gardener_id);

drop policy if exists "tasks_update_own" on public.tasks;
create policy "tasks_update_own"
  on public.tasks for update
  using ((select auth.uid()) = gardener_id);

drop policy if exists "tasks_delete_own" on public.tasks;
create policy "tasks_delete_own"
  on public.tasks for delete
  using ((select auth.uid()) = gardener_id);

-- public.maintenance_plans
drop policy if exists "maintenance_plans_select_own" on public.maintenance_plans;
create policy "maintenance_plans_select_own"
  on public.maintenance_plans for select
  using ((select auth.uid()) = gardener_id);

drop policy if exists "maintenance_plans_insert_own" on public.maintenance_plans;
create policy "maintenance_plans_insert_own"
  on public.maintenance_plans for insert
  with check ((select auth.uid()) = gardener_id);

drop policy if exists "maintenance_plans_update_own" on public.maintenance_plans;
create policy "maintenance_plans_update_own"
  on public.maintenance_plans for update
  using ((select auth.uid()) = gardener_id);

drop policy if exists "maintenance_plans_delete_own" on public.maintenance_plans;
create policy "maintenance_plans_delete_own"
  on public.maintenance_plans for delete
  using ((select auth.uid()) = gardener_id);

-- public.plan_executions
drop policy if exists "plan_executions_select_own" on public.plan_executions;
create policy "plan_executions_select_own"
  on public.plan_executions for select
  using (
    (select auth.uid()) = (
      select gardener_id
      from public.maintenance_plans
      where id = plan_id
    )
  );

drop policy if exists "plan_executions_insert_own" on public.plan_executions;
create policy "plan_executions_insert_own"
  on public.plan_executions for insert
  with check (
    (select auth.uid()) = (
      select gardener_id
      from public.maintenance_plans
      where id = plan_id
    )
  );

drop policy if exists "plan_executions_update_own" on public.plan_executions;
create policy "plan_executions_update_own"
  on public.plan_executions for update
  using (
    (select auth.uid()) = (
      select gardener_id
      from public.maintenance_plans
      where id = plan_id
    )
  );

drop policy if exists "plan_executions_delete_own" on public.plan_executions;
create policy "plan_executions_delete_own"
  on public.plan_executions for delete
  using (
    (select auth.uid()) = (
      select gardener_id
      from public.maintenance_plans
      where id = plan_id
    )
  );

-- public.service_orders
drop policy if exists "service_orders_select_own" on public.service_orders;
create policy "service_orders_select_own"
  on public.service_orders for select
  using ((select auth.uid()) = gardener_id);

drop policy if exists "service_orders_insert_own" on public.service_orders;
create policy "service_orders_insert_own"
  on public.service_orders for insert
  with check ((select auth.uid()) = gardener_id);

drop policy if exists "service_orders_update_own" on public.service_orders;
create policy "service_orders_update_own"
  on public.service_orders for update
  using ((select auth.uid()) = gardener_id);

drop policy if exists "service_orders_delete_own" on public.service_orders;
create policy "service_orders_delete_own"
  on public.service_orders for delete
  using ((select auth.uid()) = gardener_id);

-- public.service_order_items
drop policy if exists "service_order_items_select_owner" on public.service_order_items;
create policy "service_order_items_select_owner"
  on public.service_order_items for select
  using (
    (select auth.uid()) = (
      select gardener_id
      from public.service_orders
      where id = order_id
    )
  );

drop policy if exists "service_order_items_insert_owner" on public.service_order_items;
create policy "service_order_items_insert_owner"
  on public.service_order_items for insert
  with check (
    (select auth.uid()) = (
      select gardener_id
      from public.service_orders
      where id = order_id
    )
  );

drop policy if exists "service_order_items_update_owner" on public.service_order_items;
create policy "service_order_items_update_owner"
  on public.service_order_items for update
  using (
    (select auth.uid()) = (
      select gardener_id
      from public.service_orders
      where id = order_id
    )
  );

drop policy if exists "service_order_items_delete_owner" on public.service_order_items;
create policy "service_order_items_delete_owner"
  on public.service_order_items for delete
  using (
    (select auth.uid()) = (
      select gardener_id
      from public.service_orders
      where id = order_id
    )
  );

-- public.user_preferences
drop policy if exists user_preferences_owner_all on public.user_preferences;
create policy user_preferences_owner_all
  on public.user_preferences
  for all
  using ((select auth.uid()) = gardener_id)
  with check ((select auth.uid()) = gardener_id);

-- public.partner_credits
drop policy if exists partner_credits_owner_all on public.partner_credits;
create policy partner_credits_owner_all
  on public.partner_credits
  for all
  using ((select auth.uid()) = gardener_id)
  with check ((select auth.uid()) = gardener_id);

-- public.device_tokens
drop policy if exists device_tokens_select_owner on public.device_tokens;
create policy device_tokens_select_owner
  on public.device_tokens
  for select
  to authenticated
  using (gardener_id = (select auth.uid()));

drop policy if exists device_tokens_insert_owner on public.device_tokens;
create policy device_tokens_insert_owner
  on public.device_tokens
  for insert
  to authenticated
  with check (gardener_id = (select auth.uid()));

drop policy if exists device_tokens_update_owner on public.device_tokens;
create policy device_tokens_update_owner
  on public.device_tokens
  for update
  to authenticated
  using (gardener_id = (select auth.uid()))
  with check (gardener_id = (select auth.uid()));

drop policy if exists device_tokens_delete_owner on public.device_tokens;
create policy device_tokens_delete_owner
  on public.device_tokens
  for delete
  to authenticated
  using (gardener_id = (select auth.uid()));

-- public.subscriptions
drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own"
  on public.subscriptions for select
  using ((select auth.uid()) = user_id);
