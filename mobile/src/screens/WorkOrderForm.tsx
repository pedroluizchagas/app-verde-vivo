import { useEffect, useMemo, useState } from "react"
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator, Modal, useWindowDimensions } from "react-native"
import { Input, TextArea } from "../components/Form"
import { Button } from "../components/Button"
import { Card, CardHeader, CardTitle, CardContent } from "../components/Card"
import { useAuth } from "../contexts/AuthContext"
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
  client_id: string | null
  scheduled_date: string
  labor_cost?: number | null
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

export function WorkOrderForm({ navigation, route }: any) {
  const { user } = useAuth()
  const { colors } = useTheme()
  const styles = createStyles(colors)
  const insets = useSafeAreaInsets()

  const routeAppointmentId = route?.params?.appointmentId as string | undefined

  const [loading, setLoading] = useState(false)
  const [loadingLookups, setLoadingLookups] = useState(true)
  const [prefilled, setPrefilled] = useState(false)

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
  const [openCalc, setOpenCalc] = useState(false)
  const [lengthM, setLengthM] = useState("0")
  const [widthM, setWidthM] = useState("0")
  const [areasCount, setAreasCount] = useState("1")
  const [wastePct, setWastePct] = useState("0")

  const toNumber = (s: string) => {
    const raw = String(s || "").replace(/\s/g, "").replace(/\./g, "").replace(",", ".")
    const v = Number(raw)
    return Number.isFinite(v) ? v : 0
  }

  const sanitizeQty = (s: string) => s.replace(/[^0-9.,]/g, "")
  const sanitizeCurrency = (s: string) => s.replace(/[^0-9.,]/g, "")

  const unitOptions = useMemo(() => {
    const set = new Set<string>()
    products.forEach((p) => set.add(String(p.unit || "un")))
    ;["m2", "m", "un", "kg", "L"].forEach((u) => set.add(u))
    return Array.from(set)
  }, [products])

  const isAreaUnit = useMemo(() => {
    const raw = String(newUnit || "").toLowerCase().trim()
    const normalized = raw.replace(/\s+/g, "").replace(/²/g, "2")
    return normalized === "m2"
  }, [newUnit])

  const computedQty = useMemo(() => {
    const area = toNumber(lengthM) * toNumber(widthM) * Math.max(1, Math.floor(toNumber(areasCount) || 1))
    const factor = 1 + (toNumber(wastePct) > 0 ? toNumber(wastePct) / 100 : 0)
    const qty = area * factor
    return Number.isFinite(qty) && qty > 0 ? qty : 0
  }, [lengthM, widthM, areasCount, wastePct])

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

  useEffect(() => {
    ;(async () => {
      try {
        const { data: { user: current } } = await supabase.auth.getUser()
        if (!current) return
        const gardenerId = current.id

        const [{ data: clientsData }, { data: appointmentsData }, { data: productsData }, { data: prefs }] = await Promise.all([
          supabase.from("clients").select("id, name").eq("gardener_id", gardenerId).order("name"),
          supabase.from("appointments").select("id, title, client_id, scheduled_date, labor_cost").eq("gardener_id", gardenerId).order("scheduled_date", { ascending: false }).limit(50),
          supabase.from("products").select("id, name, unit, cost").eq("gardener_id", gardenerId).order("name"),
          supabase.from("user_preferences").select("default_product_margin_pct").eq("gardener_id", gardenerId).maybeSingle(),
        ])

        setClients((clientsData || []).map((c: any) => ({ id: String(c.id), name: String(c.name) })))
        setAppointments((appointmentsData || []).map((a: any) => ({
          id: String(a.id),
          title: a.title ? String(a.title) : null,
          client_id: a.client_id ? String(a.client_id) : null,
          scheduled_date: String(a.scheduled_date),
          labor_cost: typeof a.labor_cost === "number" ? a.labor_cost : a.labor_cost != null ? Number(a.labor_cost) : null,
        })))
        setProducts((productsData || []).map((p: any) => ({ id: String(p.id), name: String(p.name), unit: String(p.unit || "un"), cost: Number(p.cost || 0) })))
        const mp = Number((prefs as any)?.default_product_margin_pct ?? 0)
        setMarginPct(mp)

        if (routeAppointmentId && !prefilled) {
          const { data: ap } = await supabase
            .from("appointments")
            .select("id, title, client_id, labor_cost")
            .eq("id", routeAppointmentId)
            .eq("gardener_id", gardenerId)
            .maybeSingle()
          if (ap) {
            setFormData((fd) => ({
              ...fd,
              appointment_id: String((ap as any).id || ""),
              client_id: fd.client_id || String((ap as any).client_id || ""),
              title: fd.title || String((ap as any).title || ""),
              labor_cost: fd.labor_cost !== "0" ? fd.labor_cost : String(Number((ap as any).labor_cost || 0).toFixed(2).replace(".", ",")),
            }))
          }

          const { data: usedMaterials } = await supabase
            .from("product_movements")
            .select("product_id, quantity, unit_cost, product:products(cost, unit)")
            .eq("gardener_id", gardenerId)
            .eq("appointment_id", routeAppointmentId)
            .eq("type", "out")

          const defaults = (usedMaterials || []).map((m: any) => {
            const base = Number(m.unit_cost ?? m.product?.cost ?? 0)
            const price = base * (1 + (mp > 0 ? mp / 100 : 0))
            return {
              product_id: String(m.product_id),
              quantity: String(Number(m.quantity || 0)),
              unit_cost: base,
              unit_price: price,
              unit: String(m.product?.unit || "un"),
            } satisfies WorkOrderItemForm
          })
          if (defaults.length > 0) {
            setItems(defaults)
          }
          setPrefilled(true)
        }
      } catch (e: any) {
        Alert.alert("Erro", e?.message || "Erro ao carregar dados")
      } finally {
        setLoadingLookups(false)
      }
    })()
  }, [routeAppointmentId, prefilled])

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

    const labor = toNumber(formData.labor_cost)
    const extras = toNumber(formData.extra_charges)
    const discount = toNumber(formData.discount)
    if (labor < 0) next.labor_cost = "Informe um valor válido"
    if (extras < 0) next.extra_charges = "Informe um valor válido"
    if (discount < 0) next.discount = "Informe um valor válido"

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
    setLengthM("0")
    setWidthM("0")
    setAreasCount("1")
    setWastePct("0")
  }

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, patch: Partial<WorkOrderItemForm>) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)))
  }

  const handleSave = async () => {
    if (!validateForm()) return
    try {
      setLoading(true)
      const { data: { user: current } } = await supabase.auth.getUser()
      if (!current) throw new Error("Não autenticado")
      if (!formData.client_id) throw new Error("Selecione um cliente")

      const payload: any = {
        gardener_id: current.id,
        appointment_id: formData.appointment_id || null,
        client_id: formData.client_id,
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

      const { data: inserted, error: insertError } = await supabase.from("service_orders").insert(payload).select("id").single()
      if (insertError) throw insertError

      if (inserted?.id && items.length > 0) {
        const rows = items.map((it) => ({
          order_id: inserted.id,
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

      Alert.alert("Sucesso", "Ordem de serviço criada", [{ text: "OK", onPress: () => navigation.goBack() }])
    } catch (e: any) {
      Alert.alert("Erro", e?.message || "Erro ao salvar ordem de serviço")
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + 16 }} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon} accessibilityRole="button" accessibilityLabel="Voltar">
          <Ionicons name="chevron-back" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Nova OS</Text>
        <View style={styles.headerIcon} />
      </View>
      <View style={styles.divider} />

      {loadingLookups && (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.link} />
          <Text style={styles.loadingText}>Carregando dados...</Text>
        </View>
      )}

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
              placeholder="Ex: Poda e limpeza"
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
                <Dropdown
                  label="Unidade"
                  value={newUnit}
                  onValueChange={setNewUnit}
                  options={unitDropdownOptions}
                />
              </View>
              <View style={styles.col}>
                <Input
                  label="Quantidade"
                  value={newQuantity}
                  onChangeText={(text) => setNewQuantity(sanitizeQty(text))}
                  keyboardType="numeric"
                />
                {isAreaUnit && (
                  <TouchableOpacity onPress={() => setOpenCalc(true)} style={styles.calcButton} accessibilityRole="button" accessibilityLabel="Calcular área">
                    <Ionicons name="calculator-outline" size={16} color="#ffffff" />
                    <Text style={styles.calcButtonText}>Calcular área</Text>
                  </TouchableOpacity>
                )}
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
                          <Input
                            label="Qtd"
                            value={it.quantity}
                            onChangeText={(text) => updateItem(idx, { quantity: sanitizeQty(text) })}
                            keyboardType="numeric"
                          />
                        </View>
                        <View style={styles.col}>
                          <Dropdown
                            label="Unidade"
                            value={it.unit}
                            onValueChange={(value) => updateItem(idx, { unit: value })}
                            options={unitDropdownOptions}
                          />
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
        <Button onPress={handleSave} loading={loading} gradient size="large" style={[styles.button, styles.buttonPrimary]} disabled={!user}>
          Salvar OS
        </Button>
      </View>

      <AreaCalcModal
        open={openCalc}
        onClose={() => setOpenCalc(false)}
        onApply={() => {
          setNewQuantity(String(computedQty.toFixed(3)).replace(".", ","))
          setOpenCalc(false)
        }}
        lengthM={lengthM}
        setLengthM={setLengthM}
        widthM={widthM}
        setWidthM={setWidthM}
        areasCount={areasCount}
        setAreasCount={setAreasCount}
        wastePct={wastePct}
        setWastePct={setWastePct}
        computedQty={computedQty}
      />
    </ScrollView>
  )
}

function AreaCalcModal({
  open,
  onClose,
  onApply,
  lengthM,
  setLengthM,
  widthM,
  setWidthM,
  areasCount,
  setAreasCount,
  wastePct,
  setWastePct,
  computedQty,
}: {
  open: boolean
  onClose: () => void
  onApply: () => void
  lengthM: string
  setLengthM: (v: string) => void
  widthM: string
  setWidthM: (v: string) => void
  areasCount: string
  setAreasCount: (v: string) => void
  wastePct: string
  setWastePct: (v: string) => void
  computedQty: number
}) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay }} />
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, paddingBottom: insets.bottom + 16, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.textPrimary }}>Calcular área (m²)</Text>
              <TouchableOpacity onPress={onClose} style={{ padding: 8 }} accessibilityRole="button" accessibilityLabel="Fechar">
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 12 }}>
              <Input label="Comprimento (m)" value={lengthM} onChangeText={(t) => setLengthM(t.replace(/[^0-9.,]/g, ""))} keyboardType="numeric" />
              <Input label="Largura (m)" value={widthM} onChangeText={(t) => setWidthM(t.replace(/[^0-9.,]/g, ""))} keyboardType="numeric" />
              <Input label="Áreas" value={areasCount} onChangeText={(t) => setAreasCount(t.replace(/[^0-9]/g, ""))} keyboardType="numeric" />
              <Input label="Perda (%)" value={wastePct} onChangeText={(t) => setWastePct(t.replace(/[^0-9.,]/g, ""))} keyboardType="numeric" />
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Quantidade calculada</Text>
              <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: "700" }}>
                {new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(computedQty)}
              </Text>
            </View>

            <View style={{ flexDirection: "row", columnGap: 12, marginTop: 12 }}>
              <TouchableOpacity onPress={onClose} style={{ flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingVertical: 12, alignItems: "center" }} accessibilityRole="button" accessibilityLabel="Cancelar">
                <Text style={{ color: colors.textSecondary, fontWeight: "700" }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onApply} style={{ flex: 1, backgroundColor: colors.link, borderRadius: 14, paddingVertical: 12, alignItems: "center" }} accessibilityRole="button" accessibilityLabel="Aplicar quantidade">
                <Text style={{ color: "#ffffff", fontWeight: "700" }}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
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
  calcButton: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", backgroundColor: c.link, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, marginTop: 6 },
  calcButtonText: { color: "#ffffff", fontSize: 12, fontWeight: "700", marginLeft: 8 },
  pillRow: { flexDirection: "row", marginTop: 2 },
  pill: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, flex: 1 },
  pillLabel: { fontSize: 13, color: c.textSecondary, fontWeight: "600" },
  pillValue: { fontSize: 13, color: c.textPrimary, fontWeight: "800" },
})

export default WorkOrderForm
