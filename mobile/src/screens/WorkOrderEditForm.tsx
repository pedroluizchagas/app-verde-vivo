import { useEffect, useMemo, useState } from "react"
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator, Modal, useWindowDimensions } from "react-native"
import { Input, TextArea } from "../components/Form"
import { Button } from "../components/Button"
import { Card, CardHeader, CardTitle, CardContent } from "../components/Card"
import { supabase } from "../supabase"
import { useTheme } from "../contexts/ThemeContext"
import type { ThemeColors } from "../theme"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"

type WorkOrderStatus = "draft" | "issued" | "completed" | "cancelled"

interface Client {
  id: string
  name: string
}

interface Appointment {
  id: string
  title: string | null
  scheduled_date: string
}

interface Product {
  id: string
  name: string
  unit: string
  cost: number
}

interface WorkOrderItemForm {
  product_id: string
  quantity: string
  unit_cost: number
  unit_price: number
  unit: string
}

export function WorkOrderEditForm({ route, navigation }: any) {
  const { colors } = useTheme()
  const styles = createStyles(colors)
  const insets = useSafeAreaInsets()
  const orderId = (route?.params?.id || route?.params?.orderId) as string | undefined

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  const [clients, setClients] = useState<Client[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [marginPct, setMarginPct] = useState<number>(0)

  const [formData, setFormData] = useState({
    title: "",
    client_id: "",
    appointment_id: "",
    status: "issued" as WorkOrderStatus,
    labor_cost: "0",
    extra_charges: "0",
    discount: "0",
    description: "",
  })
  const [items, setItems] = useState<WorkOrderItemForm[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [newProductId, setNewProductId] = useState("")
  const [newUnit, setNewUnit] = useState("un")
  const [newQuantity, setNewQuantity] = useState("1")

  const toNumber = (s: string) => {
    const raw = String(s || "").replace(/\s/g, "").replace(/\./g, "").replace(",", ".")
    const v = Number(raw)
    return Number.isFinite(v) ? v : 0
  }

  const sanitizeQty = (s: string) => s.replace(/[^0-9.,]/g, "")
  const sanitizeCurrency = (s: string) => s.replace(/[^0-9.,]/g, "")

  useEffect(() => {
    ;(async () => {
      try {
        if (!orderId) return
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const gardenerId = user.id
        const [{ data: clientsData }, { data: appointmentsData }, { data: productsData }, { data: order }, { data: orderItems }, { data: prefs }] = await Promise.all([
          supabase.from("clients").select("id, name").eq("gardener_id", gardenerId).order("name"),
          supabase.from("appointments").select("id, title, scheduled_date").eq("gardener_id", gardenerId).order("scheduled_date", { ascending: false }).limit(50),
          supabase.from("products").select("id, name, unit, cost").eq("gardener_id", gardenerId).order("name"),
          supabase.from("service_orders").select("id, title, description, status, labor_cost, materials_markup_pct, extra_charges, discount, client_id, appointment_id").eq("gardener_id", gardenerId).eq("id", orderId).maybeSingle(),
          supabase.from("service_order_items").select("product_id, quantity, unit_cost, unit_price, unit").eq("order_id", orderId),
          supabase.from("user_preferences").select("default_product_margin_pct").eq("gardener_id", gardenerId).maybeSingle(),
        ])

        setClients((clientsData || []).map((c: any) => ({ id: String(c.id), name: String(c.name) })))
        setAppointments((appointmentsData || []).map((a: any) => ({ id: String(a.id), title: a.title ? String(a.title) : null, scheduled_date: String(a.scheduled_date) })))
        setProducts((productsData || []).map((p: any) => ({ id: String(p.id), name: String(p.name), unit: String(p.unit || "un"), cost: Number(p.cost || 0) })))

        const prefMargin = Number((prefs as any)?.default_product_margin_pct ?? 0)
        const orderMargin = Number((order as any)?.materials_markup_pct ?? prefMargin ?? 0)
        setMarginPct(orderMargin)

        if (!order) {
          Alert.alert("Erro", "OS não encontrada", [{ text: "OK", onPress: () => navigation.goBack() }])
          return
        }

        setFormData({
          title: String((order as any)?.title || ""),
          client_id: String((order as any)?.client_id || ""),
          appointment_id: (order as any)?.appointment_id ? String((order as any)?.appointment_id) : "",
          status: (String((order as any)?.status || "issued") as any) as WorkOrderStatus,
          labor_cost: String(Number((order as any)?.labor_cost || 0).toFixed(2)).replace(".", ","),
          extra_charges: String(Number((order as any)?.extra_charges || 0).toFixed(2)).replace(".", ","),
          discount: String(Number((order as any)?.discount || 0).toFixed(2)).replace(".", ","),
          description: String((order as any)?.description || ""),
        })

        const normalizedItems = (orderItems || []).map((it: any) => ({
          product_id: String(it.product_id),
          quantity: String(Number(it.quantity || 0)),
          unit_cost: Number(it.unit_cost || 0),
          unit_price: Number(it.unit_price || 0),
          unit: String(it.unit || "un"),
        })) as WorkOrderItemForm[]
        setItems(normalizedItems)
      } catch (e: any) {
        Alert.alert("Erro", e?.message || "Erro ao carregar OS")
      } finally {
        setLoadingData(false)
      }
    })()
  }, [orderId])

  const unitOptions = useMemo(() => {
    const set = new Set<string>()
    products.forEach((p) => set.add(String(p.unit || "un")))
    ;["m2", "m", "un", "kg", "L"].forEach((u) => set.add(u))
    return Array.from(set)
  }, [products])

  const materialsBaseTotal = useMemo(() => {
    return items.reduce((sum, it) => sum + Number(it.unit_cost || 0) * toNumber(it.quantity), 0)
  }, [items])

  const materialsPriceTotal = useMemo(() => {
    return items.reduce((sum, it) => sum + Number(it.unit_price || 0) * toNumber(it.quantity), 0)
  }, [items])

  const total = useMemo(() => {
    return toNumber(formData.labor_cost) + materialsPriceTotal + toNumber(formData.extra_charges) - toNumber(formData.discount)
  }, [formData.labor_cost, formData.extra_charges, formData.discount, materialsPriceTotal])

  const formatCurrency = (v: number) => {
    const value = Number(v || 0)
    return `R$ ${value.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`
  }

  const statusOptions = [
    { label: "Rascunho", value: "draft" },
    { label: "Emitida", value: "issued" },
    { label: "Concluída", value: "completed" },
    { label: "Cancelada", value: "cancelled" },
  ]

  const clientOptions = [{ label: "Selecione um cliente", value: "" }, ...clients.map((c) => ({ label: c.name, value: c.id }))]

  const appointmentOptions = useMemo(() => {
    const base = [{ label: "Sem vínculo", value: "" }]
    const mapped = appointments.map((a) => {
      const d = new Date(String(a.scheduled_date))
      const label = `${a.title || "Agendamento"} • ${d.toLocaleDateString("pt-BR")}`
      return { label, value: a.id }
    })
    return [...base, ...mapped]
  }, [appointments])

  const productOptions = [{ label: "Selecione um produto", value: "" }, ...products.map((p) => ({ label: `${p.name} (${p.unit})`, value: p.id }))]
  const unitDropdownOptions = [{ label: "un", value: "un" }, ...unitOptions.filter((u) => u !== "un").map((u) => ({ label: u, value: u }))]

  const validateForm = () => {
    const next: Record<string, string> = {}
    if (!formData.title.trim()) next.title = "Título é obrigatório"
    if (!formData.client_id) next.client_id = "Cliente é obrigatório"
    if (toNumber(formData.labor_cost) < 0) next.labor_cost = "Informe um valor válido"
    if (toNumber(formData.extra_charges) < 0) next.extra_charges = "Informe um valor válido"
    if (toNumber(formData.discount) < 0) next.discount = "Informe um valor válido"
    const invalidItems = items.some((it) => !it.product_id || toNumber(it.quantity) <= 0)
    if (invalidItems) next.items = "Materiais devem ter produto e quantidade válida"
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const addItem = () => {
    if (!newProductId) return
    const product = products.find((p) => p.id === newProductId)
    if (!product) return
    const base = Number(product.cost || 0)
    const price = base * (1 + (marginPct > 0 ? marginPct / 100 : 0))
    const qty = toNumber(newQuantity) > 0 ? String(toNumber(newQuantity)) : "1"
    setItems((prev) => [...prev, { product_id: product.id, quantity: qty, unit_cost: base, unit_price: price, unit: newUnit || product.unit || "un" }])
    setNewProductId("")
    setNewUnit("un")
    setNewQuantity("1")
  }

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, patch: Partial<WorkOrderItemForm>) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)))
  }

  const handleSave = async () => {
    if (!orderId) return
    if (!validateForm()) return
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Não autenticado")
      if (!formData.client_id) throw new Error("Selecione um cliente")

      const payload: any = {
        client_id: formData.client_id,
        appointment_id: formData.appointment_id || null,
        title: formData.title.trim() || "Serviço",
        description: formData.description.trim() || null,
        status: formData.status,
        labor_cost: toNumber(formData.labor_cost),
        materials_total: Number(materialsBaseTotal || 0),
        materials_markup_pct: Number(marginPct || 0),
        extra_charges: toNumber(formData.extra_charges),
        discount: toNumber(formData.discount),
        total_amount: Number(total || 0),
      }

      const { error: updateError } = await supabase.from("service_orders").update(payload).eq("id", orderId)
      if (updateError) throw updateError

      await supabase.from("service_order_items").delete().eq("order_id", orderId)
      if (items.length > 0) {
        const rows = items.map((it) => ({
          order_id: orderId,
          product_id: it.product_id,
          quantity: toNumber(it.quantity),
          unit_cost: Number(it.unit_cost || 0),
          unit_price: Number(it.unit_price || 0),
          total_price: Number(it.unit_price || 0) * toNumber(it.quantity),
          unit: it.unit || null,
        }))
        const { error: itemsErr } = await supabase.from("service_order_items").insert(rows)
        if (itemsErr) throw itemsErr
      }

      Alert.alert("Sucesso", "Ordem de serviço atualizada", [{ text: "OK", onPress: () => navigation.navigate("WorkOrderDetail", { id: orderId }) }])
    } catch (e: any) {
      Alert.alert("Erro", e?.message || "Erro ao atualizar OS")
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon} accessibilityRole="button" accessibilityLabel="Voltar">
            <Ionicons name="chevron-back" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.title}>Editar OS</Text>
          <View style={styles.headerIcon} />
        </View>
        <View style={styles.divider} />
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.link} />
          <Text style={styles.loadingText}>Carregando OS...</Text>
        </View>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + 16 }} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon} accessibilityRole="button" accessibilityLabel="Voltar">
          <Ionicons name="chevron-back" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Editar OS</Text>
        <View style={styles.headerIcon} />
      </View>
      <View style={styles.divider} />

      <View style={styles.section}>
        <Card>
          <CardHeader>
            <CardTitle>Dados da OS</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              label="Título"
              value={formData.title}
              onChangeText={(text) => setFormData((fd) => ({ ...fd, title: text }))}
              error={errors.title}
              required
            />

            <Dropdown
              label="Cliente"
              value={formData.client_id}
              onValueChange={(value) => setFormData((fd) => ({ ...fd, client_id: value }))}
              options={clientOptions}
              required
              error={errors.client_id}
            />

            <Dropdown
              label="Agendamento (opcional)"
              value={formData.appointment_id}
              onValueChange={(value) => setFormData((fd) => ({ ...fd, appointment_id: value }))}
              options={appointmentOptions}
            />

            <Dropdown
              label="Status"
              value={formData.status}
              onValueChange={(value) => setFormData((fd) => ({ ...fd, status: value as WorkOrderStatus }))}
              options={statusOptions}
            />
          </CardContent>
        </Card>
      </View>

      <View style={styles.section}>
        <Card>
          <CardHeader>
            <CardTitle>Valores</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              label="Mão de obra (R$)"
              value={formData.labor_cost}
              onChangeText={(text) => setFormData((fd) => ({ ...fd, labor_cost: sanitizeCurrency(text) }))}
              placeholder="0,00"
              keyboardType="numeric"
              error={errors.labor_cost}
              required
            />
            <Input
              label="Adicionais (R$)"
              value={formData.extra_charges}
              onChangeText={(text) => setFormData((fd) => ({ ...fd, extra_charges: sanitizeCurrency(text) }))}
              placeholder="0,00"
              keyboardType="numeric"
              error={errors.extra_charges}
            />
            <Input
              label="Desconto (R$)"
              value={formData.discount}
              onChangeText={(text) => setFormData((fd) => ({ ...fd, discount: sanitizeCurrency(text) }))}
              placeholder="0,00"
              keyboardType="numeric"
              error={errors.discount}
            />
            <View style={styles.pillRow}>
              <View style={styles.pill}>
                <Text style={styles.pillLabel}>Margem materiais</Text>
                <Text style={styles.pillValue}>{Number(marginPct || 0).toFixed(2).replace(".", ",")}%</Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      <View style={styles.section}>
        <Card>
          <CardHeader>
            <CardTitle>Materiais</CardTitle>
          </CardHeader>
          <CardContent>
            <Dropdown
              label="Produto"
              value={newProductId}
              onValueChange={(value) => {
                setNewProductId(value)
                const p = products.find((x) => x.id === value)
                setNewUnit(String(p?.unit || "un"))
              }}
              options={productOptions}
            />

            <View style={styles.row}>
              <View style={styles.col}>
                <Dropdown label="Unidade" value={newUnit} onValueChange={setNewUnit} options={unitDropdownOptions} />
              </View>
              <View style={styles.col}>
                <Input label="Quantidade" value={newQuantity} onChangeText={(text) => setNewQuantity(sanitizeQty(text))} keyboardType="numeric" />
              </View>
            </View>

            <Button onPress={addItem} disabled={!newProductId} style={styles.addMaterialButton}>
              Adicionar material
            </Button>

            {errors.items ? <Text style={styles.inlineError}>{errors.items}</Text> : null}

            {items.length > 0 ? (
              <View style={styles.itemsList}>
                {items.map((it, idx) => {
                  const p = products.find((x) => x.id === it.product_id)
                  const lineTotal = Number(it.unit_price || 0) * toNumber(it.quantity)
                  return (
                    <View key={`${it.product_id}-${idx}`} style={styles.itemBlock}>
                      <View style={styles.itemHeaderRow}>
                        <Text style={styles.itemTitle} numberOfLines={2}>{p?.name || "Produto"}</Text>
                        <TouchableOpacity onPress={() => removeItem(idx)} style={styles.removeItemButton} accessibilityRole="button" accessibilityLabel="Remover material">
                          <Text style={styles.removeItemText}>Remover</Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.row}>
                        <View style={styles.col}>
                          <Input label="Qtd" value={it.quantity} onChangeText={(text) => updateItem(idx, { quantity: sanitizeQty(text) })} keyboardType="numeric" />
                        </View>
                        <View style={styles.col}>
                          <Dropdown label="Unidade" value={it.unit} onValueChange={(value) => updateItem(idx, { unit: value })} options={unitDropdownOptions} />
                        </View>
                      </View>

                      <View style={styles.itemTotalsRow}>
                        <View style={styles.itemTotalBox}>
                          <Text style={styles.itemTotalLabel}>Preço unitário</Text>
                          <Text style={styles.itemTotalValue}>{formatCurrency(Number(it.unit_price || 0))}</Text>
                        </View>
                        <View style={styles.itemTotalBox}>
                          <Text style={styles.itemTotalLabel}>Subtotal</Text>
                          <Text style={styles.itemTotalValue}>{formatCurrency(lineTotal)}</Text>
                        </View>
                      </View>
                    </View>
                  )
                })}

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Materiais</Text>
                  <Text style={styles.totalValue}>{formatCurrency(materialsPriceTotal)}</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.emptyMaterials}>Nenhum material adicionado</Text>
            )}
          </CardContent>
        </Card>
      </View>

      <View style={styles.section}>
        <Card>
          <CardHeader>
            <CardTitle>Descrição</CardTitle>
          </CardHeader>
          <CardContent>
            <TextArea
              label="Descrição (opcional)"
              value={formData.description}
              onChangeText={(text) => setFormData((fd) => ({ ...fd, description: text }))}
              placeholder="Detalhes da ordem de serviço"
            />
          </CardContent>
        </Card>
      </View>

      <View style={styles.section}>
        <Card>
          <CardContent>
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(total)}</Text>
            </View>
          </CardContent>
        </Card>
      </View>

      <View style={styles.actions}>
        <Button variant="outline" onPress={() => navigation.goBack()} style={[styles.button, styles.buttonOutline]}>
          Cancelar
        </Button>
        <Button onPress={handleSave} loading={loading} gradient size="large" style={[styles.button, styles.buttonPrimary]}>
          Atualizar OS
        </Button>
      </View>
    </ScrollView>
  )
}

function Dropdown({ label, value, onValueChange, options, required, error }: { label: string; value: string; onValueChange: (v: string) => void; options: { label: string; value: string }[]; required?: boolean; error?: string }) {
  const { mode, colors } = useTheme()
  const insets = useSafeAreaInsets()
  const { height: windowHeight } = useWindowDimensions()
  const isDark = mode === "dark"
  const [open, setOpen] = useState(false)
  const currentLabel = options.find((o) => o.value === value)?.label || "Selecione"
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={[{ fontSize: 14, fontWeight: "600", color: isDark ? "#f9fafb" : "#374151", marginBottom: 8 }]}>
        {label}
        {required && <Text style={{ color: "#EF4444" }}> *</Text>}
      </Text>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderWidth: 1,
          borderColor: error ? "#EF4444" : isDark ? "#374151" : "#D1D5DB",
          borderRadius: 8,
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: isDark ? "#2a2f36" : "#FFFFFF",
        }}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Text style={{ fontSize: 16, color: isDark ? "#f9fafb" : "#111827" }} numberOfLines={1}>{currentLabel}</Text>
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
      {error && <Text style={{ fontSize: 12, color: "#EF4444", marginTop: 4 }}>{error}</Text>}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1 }}>
          <TouchableOpacity style={{ flex: 1, backgroundColor: colors.overlay }} onPress={() => setOpen(false)} />
          <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingBottom: insets.bottom + 12, paddingHorizontal: 16 }}>
            <View style={{ maxHeight: Math.min(windowHeight * 0.6, 520), backgroundColor: colors.surface, borderRadius: 12, paddingVertical: 8, overflow: "hidden", borderWidth: 1, borderColor: colors.border }}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {options.map((o, idx) => (
                  <TouchableOpacity
                    key={o.value}
                    onPress={() => { onValueChange(o.value); setOpen(false) }}
                    style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: idx === options.length - 1 ? 0 : 1, borderBottomColor: colors.border }}
                    accessibilityRole="button"
                    accessibilityLabel={o.label}
                  >
                    <Text style={{ color: colors.textPrimary, fontSize: 16 }} numberOfLines={2}>{o.label}</Text>
                    {o.value === value && <Ionicons name="checkmark" size={18} color={colors.link} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12 },
  headerIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  divider: { height: 1, backgroundColor: c.divider },
  title: { fontSize: 20, fontWeight: "700", color: c.textPrimary },
  section: { paddingHorizontal: 16, marginBottom: 24, marginTop: 8 },
  actions: { flexDirection: "row", columnGap: 12, paddingHorizontal: 16, paddingVertical: 16 },
  button: { flex: 1 },
  buttonPrimary: { borderRadius: 24 },
  buttonOutline: { borderRadius: 24 },
  loadingRow: { flexDirection: "row", alignItems: "center", columnGap: 8, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  loadingText: { fontSize: 13, color: c.textSecondary },
  row: { flexDirection: "row", columnGap: 12 },
  col: { flex: 1 },
  addMaterialButton: { marginTop: 4, borderRadius: 14 },
  itemsList: { marginTop: 12 },
  itemBlock: { borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 12, marginBottom: 12, backgroundColor: c.surface },
  itemHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  itemTitle: { flex: 1, fontSize: 15, fontWeight: "700", color: c.textPrimary, marginRight: 10 },
  removeItemButton: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: c.border },
  removeItemText: { fontSize: 12, fontWeight: "700", color: c.textSecondary },
  itemTotalsRow: { flexDirection: "row", columnGap: 12, marginTop: 4 },
  itemTotalBox: { flex: 1, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 10 },
  itemTotalLabel: { fontSize: 12, color: c.textSecondary, marginBottom: 4 },
  itemTotalValue: { fontSize: 14, fontWeight: "700", color: c.textPrimary },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: c.border, paddingTop: 10, marginTop: 6 },
  totalLabel: { fontSize: 14, fontWeight: "700", color: c.textSecondary },
  totalValue: { fontSize: 16, fontWeight: "800", color: c.textPrimary },
  grandTotalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  grandTotalLabel: { fontSize: 14, fontWeight: "700", color: c.textSecondary },
  grandTotalValue: { fontSize: 20, fontWeight: "800", color: c.success },
  emptyMaterials: { marginTop: 12, color: c.textSecondary },
  inlineError: { marginTop: 10, color: c.danger, fontSize: 12, fontWeight: "600" },
  pillRow: { flexDirection: "row", marginTop: 2 },
  pill: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, flex: 1 },
  pillLabel: { fontSize: 13, color: c.textSecondary, fontWeight: "600" },
  pillValue: { fontSize: 13, color: c.textPrimary, fontWeight: "800" },
})

export default WorkOrderEditForm
