import { useEffect, useMemo, useState } from "react"
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator, Share, Modal, useWindowDimensions } from "react-native"
import { Input, TextArea, DateInput } from "../components/Form"
import { Button } from "../components/Button"
import { Card, CardHeader, CardTitle, CardContent } from "../components/Card"
import { useAuth } from "../contexts/AuthContext"
import { supabase } from "../supabase"
import { format } from "date-fns"
import { useTheme } from "../contexts/ThemeContext"
import type { ThemeColors } from "../theme"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"

interface Client {
  id: string
  name: string
}

interface BudgetItemForm {
  description: string
  quantity: string
  unit_price: string
}

interface BudgetFormProps {
  navigation: any
  route?: any
}

export function BudgetForm({ navigation, route }: BudgetFormProps) {
  const { user } = useAuth()
  const budget = route?.params?.budget
  const budgetId: string | undefined = route?.params?.budgetId || budget?.id
  const { colors } = useTheme()
  const styles = createStyles(colors)
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(false)
  const [loadingBudget, setLoadingBudget] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [formData, setFormData] = useState({
    title: budget?.title || "",
    client_id: budget?.client?.id || "",
    status: budget?.status || "pending",
    valid_until: budget?.valid_until ? new Date(budget.valid_until) : null as Date | null,
    description: budget?.description || "",
  })
  const [items, setItems] = useState<BudgetItemForm[]>(
    budget?.items?.length
      ? budget.items.map((it: any) => ({
          description: it.description || "",
          quantity: String(it.quantity || ""),
          unit_price: String(it.unit_price || ""),
        }))
      : [{ description: "", quantity: "", unit_price: "" }]
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadClients()
  }, [])

  useEffect(() => {
    if (budgetId && !budget) {
      setLoadingBudget(true)
      ;(async () => {
        try {
          const { data: b } = await supabase
            .from("budgets")
            .select("id, title, status, valid_until, description, client_id")
            .eq("id", budgetId)
            .single()
          if (b) {
            setFormData({
              title: String(b.title || ""),
              client_id: String(b.client_id || ""),
              status: String(b.status || "pending"),
              valid_until: b.valid_until ? new Date(String(b.valid_until)) : null,
              description: String(b.description || ""),
            })
            const { data: its } = await supabase
              .from("budget_items")
              .select("description, quantity, unit_price")
              .eq("budget_id", budgetId)
            if (its && Array.isArray(its) && its.length) {
              setItems(its.map((it: any) => ({
                description: String(it.description || ""),
                quantity: String(it.quantity || ""),
                unit_price: String(it.unit_price || ""),
              })))
            }
          }
        } catch {}
        setLoadingBudget(false)
      })()
    }
  }, [budgetId])

  const loadClients = async () => {
    try {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) return
      const { data, error } = await supabase
        .from("clients")
        .select("id, name")
        .eq("gardener_id", u.id)
        .order("name")
      if (error) throw error
      setClients(data || [])
    } catch (error: any) {
      Alert.alert("Erro", "Erro ao carregar clientes: " + error.message)
    }
  }

  const toNumber = (s: string) => Number(String(s || "").replace(",", "."))
  const sanitizeInt = (s: string) => s.replace(/[^0-9]/g, "")
  const sanitizeCurrency = (s: string) => {
    const x = s.replace(/[^0-9.,]/g, "").replace(/,/g, ".")
    const parts = x.split(".")
    if (parts.length <= 2) return s.replace(/[^0-9.,]/g, "")
    return parts[0] + "," + parts.slice(1).join("")
  }

  const totalAmount = useMemo(() => {
    return items.reduce((sum, it) => {
      const q = toNumber(it.quantity)
      const p = toNumber(it.unit_price)
      if (isNaN(q) || isNaN(p)) return sum
      return sum + q * p
    }, 0)
  }, [items])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.title.trim()) newErrors.title = "Título é obrigatório"
    if (!formData.client_id) newErrors.client_id = "Cliente é obrigatório"
    if (!formData.valid_until) newErrors.valid_until = "Validade é obrigatória"
    const hasInvalid = items.some(it => !it.description.trim() || isNaN(toNumber(it.quantity)) || toNumber(it.quantity) <= 0 || isNaN(toNumber(it.unit_price)) || toNumber(it.unit_price) < 0)
    if (hasInvalid) newErrors.items = "Itens devem ter descrição, quantidade e valor válidos"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm() || !user) return
    try {
      setLoading(true)
      const data = {
        gardener_id: user.id,
        title: formData.title.trim(),
        client_id: formData.client_id,
        status: formData.status,
        valid_until: formData.valid_until ? format(formData.valid_until, "yyyy-MM-dd") : null,
        description: formData.description.trim() || null,
        total_amount: totalAmount,
      }

      const isEditing = Boolean(budgetId)
      if (isEditing) {
        const { error } = await supabase
          .from("budgets")
          .update(data)
          .eq("id", budgetId)
        if (error) throw error

        try {
          await supabase.from("budget_items").delete().eq("budget_id", budgetId)
          const itemsPayload = items.map(it => ({
            budget_id: budgetId,
            description: it.description.trim(),
            quantity: toNumber(it.quantity),
            unit_price: toNumber(it.unit_price),
            total_price: toNumber(it.quantity) * toNumber(it.unit_price),
            gardener_id: user.id,
          }))
          await supabase.from("budget_items").insert(itemsPayload)
        } catch {}
      } else {
        const { data: inserted, error } = await supabase
          .from("budgets")
          .insert(data)
          .select("id")
          .single()
        if (error) throw error
        const budgetId = inserted?.id
        if (budgetId) {
          const itemsPayload = items.map(it => ({
            budget_id: budgetId,
            description: it.description.trim(),
            quantity: toNumber(it.quantity),
            unit_price: toNumber(it.unit_price),
            total_price: toNumber(it.quantity) * toNumber(it.unit_price),
            gardener_id: user.id,
          }))
          try {
            await supabase.from("budget_items").insert(itemsPayload)
          } catch {}
        }
      }

      Alert.alert("Sucesso", budgetId ? "Orçamento atualizado" : "Orçamento criado", [
        { text: "OK", onPress: () => navigation.goBack() }
      ])
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao salvar orçamento")
    } finally {
      setLoading(false)
    }
  }

  const statusOptions = [
    { label: "Pendente", value: "pending" },
    { label: "Aprovado", value: "approved" },
    { label: "Rejeitado", value: "rejected" },
  ]

  const clientOptions = [{ label: "Selecione um cliente", value: "" }, ...clients.map(c => ({ label: c.name, value: c.id }))]

  const updateItem = (index: number, patch: Partial<BudgetItemForm>) => {
    const next = [...items]
    next[index] = { ...next[index], ...patch }
    setItems(next)
  }

  const addItem = () => {
    setItems([...items, { description: "", quantity: "", unit_price: "" }])
  }

  const removeItem = (index: number) => {
    const next = items.filter((_, i) => i !== index)
    setItems(next.length ? next : [{ description: "", quantity: "", unit_price: "" }])
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + 16 }} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon} accessibilityRole="button" accessibilityLabel="Voltar">
          <Ionicons name="chevron-back" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>{budgetId ? "Editar orçamento" : "Novo orçamento"}</Text>
        <TouchableOpacity onPress={() => {
          const clientName = clients.find(c => c.id === formData.client_id)?.name || "Cliente"
          const lines = [
            `Orçamento: ${formData.title || ""}`,
            `Cliente: ${clientName}`,
            `Status: ${formData.status}`,
            `Validade: ${formData.valid_until ? format(formData.valid_until, "dd/MM/yyyy") : "-"}`,
            `Descrição: ${formData.description || "-"}`,
            "Itens:",
            ...items.map((it) => `- ${it.description || "Item"} | Qtd: ${sanitizeInt(it.quantity)} | Valor: R$ ${toNumber(it.unit_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`),
            `Total: R$ ${totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          ]
          Share.share({ message: lines.join("\n") })
        }} style={styles.headerIcon} accessibilityRole="button" accessibilityLabel="Compartilhar orçamento">
          <Ionicons name="share-social-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />

      {loadingBudget && (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.link} />
          <Text style={styles.loadingText}>Carregando orçamento...</Text>
        </View>
      )}

      <View style={styles.section}>
        <Card>
          <CardHeader>
            <CardTitle>Dados do orçamento</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              label="Título"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="Ex: Manutenção de jardim"
              error={errors.title}
              required
            />

            <Dropdown
              label="Cliente"
              value={formData.client_id}
              onValueChange={(value) => setFormData({ ...formData, client_id: value })}
              options={clientOptions}
              error={errors.client_id}
              required
            />

            <Dropdown
              label="Status"
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
              options={statusOptions}
            />

            <DateInput
              label="Válido até"
              value={formData.valid_until}
              onValueChange={(date) => setFormData({ ...formData, valid_until: date })}
              error={errors.valid_until}
              required
            />
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
              label="Descrição"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Detalhes do orçamento"
            />
          </CardContent>
        </Card>
      </View>

      <View style={styles.section}>
        <Card>
          <CardHeader>
            <CardTitle>Itens</CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.itemsHeader}>
              <Text style={styles.itemsTitle}>Itens do orçamento</Text>
              <TouchableOpacity onPress={addItem} style={styles.addItemButton} accessibilityRole="button" accessibilityLabel="Adicionar item">
                <Text style={styles.addItemText}>Adicionar</Text>
              </TouchableOpacity>
            </View>

            {errors.items && <Text style={styles.errorText}>{errors.items}</Text>}

            {items.map((it, index) => (
              <View key={index} style={styles.itemBlock}>
                <View style={styles.itemHeaderRow}>
                  <Text style={styles.itemLabel}>Item {index + 1}</Text>
                  <TouchableOpacity onPress={() => removeItem(index)} style={styles.removeItemButton} accessibilityRole="button" accessibilityLabel={`Remover item ${index + 1}`}>
                    <Text style={styles.removeItemText}>Remover</Text>
                  </TouchableOpacity>
                </View>
                <Input
                  label="Descrição"
                  value={it.description}
                  onChangeText={(text) => updateItem(index, { description: text })}
                  placeholder="Ex: Poda de árvores"
                />
                <View style={styles.itemRow}>
                  <View style={styles.itemColQty}>
                    <Input
                      label="Qtd"
                      value={it.quantity}
                      onChangeText={(text) => updateItem(index, { quantity: sanitizeInt(text) })}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.itemColPrice}>
                    <Input
                      label="Valor"
                      value={it.unit_price}
                      onChangeText={(text) => updateItem(index, { unit_price: sanitizeCurrency(text) })}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>
            ))}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
            </View>
          </CardContent>
        </Card>
      </View>

      <View style={styles.actions}>
        <Button
          variant="outline"
          onPress={() => navigation.goBack()}
          style={[styles.button, styles.buttonOutline]}
        >
          Cancelar
        </Button>
        <Button
          onPress={handleSave}
          loading={loading}
          gradient
          size="large"
          style={[styles.button, styles.buttonPrimary]}
        >
          {budgetId ? "Atualizar orçamento" : "Salvar orçamento"}
        </Button>
      </View>
    </ScrollView>
  )
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  headerIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, backgroundColor: c.divider },
  title: { fontSize: 20, fontWeight: '700', color: c.textPrimary },
  section: { paddingHorizontal: 16, marginBottom: 24, marginTop: 8 },
  actions: { flexDirection: 'row', columnGap: 12, paddingHorizontal: 16, paddingVertical: 16 },
  button: { flex: 1 },
  buttonPrimary: { borderRadius: 24 },
  buttonOutline: { borderRadius: 24 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', columnGap: 8, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  loadingText: { fontSize: 13, color: c.textSecondary },
  itemsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 4 },
  itemsTitle: { fontSize: 16, fontWeight: '600', color: c.textPrimary },
  addItemButton: { backgroundColor: c.link, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  addItemText: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
  itemBlock: { borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 12, marginBottom: 12, backgroundColor: c.surface },
  itemHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  itemLabel: { fontSize: 14, fontWeight: '700', color: c.textPrimary },
  itemRow: { flexDirection: 'row', columnGap: 12 },
  itemColQty: { flex: 1 },
  itemColPrice: { flex: 1 },
  removeItemButton: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.danger },
  removeItemText: { color: c.danger, fontSize: 12, fontWeight: '600' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  totalLabel: { fontSize: 16, fontWeight: '600', color: c.textPrimary },
  totalValue: { fontSize: 18, fontWeight: '700', color: c.textPrimary },
  errorText: { fontSize: 12, color: c.danger, marginBottom: 8 },
})

function Dropdown({ label, value, onValueChange, options, required, error }: { label: string; value: string; onValueChange: (v: string) => void; options: { label: string; value: string }[]; required?: boolean; error?: string }) {
  const { mode, colors } = useTheme()
  const insets = useSafeAreaInsets()
  const { height: windowHeight } = useWindowDimensions()
  const isDark = mode === "dark"
  const [open, setOpen] = useState(false)
  const currentLabel = options.find((o) => o.value === value)?.label || "Selecione"
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={[{ fontSize: 14, fontWeight: "600", color: isDark ? "#f9fafb" : "#374151", marginBottom: 8 }] }>
        {label}
        {required && <Text style={{ color: "#EF4444" }}> *</Text>}
      </Text>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={[
          {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderWidth: 1,
            borderColor: error ? "#EF4444" : isDark ? "#374151" : "#D1D5DB",
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: isDark ? "#2a2f36" : "#FFFFFF",
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Text style={{ fontSize: 16, color: isDark ? "#f9fafb" : "#111827" }}>{currentLabel}</Text>
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
      {error && <Text style={{ fontSize: 12, color: "#EF4444", marginTop: 4 }}>{error}</Text>}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.surfaceAlt, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: insets.bottom + 16, maxHeight: windowHeight * 0.9 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary }}>{label}</Text>
              <TouchableOpacity onPress={() => setOpen(false)} style={{ padding: 4 }} accessibilityRole="button" accessibilityLabel="Fechar">
                <Ionicons name="close" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={{ height: 1, backgroundColor: colors.divider }} />
            <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
              <ScrollView style={{ maxHeight: Math.round(windowHeight * 0.55) }} showsVerticalScrollIndicator={false}>
                <View style={{ backgroundColor: colors.surface, borderRadius: 12, paddingVertical: 8, overflow: "hidden" }}>
                  {options.map((o, idx) => (
                    <TouchableOpacity
                      key={o.value}
                      onPress={() => { onValueChange(o.value); setOpen(false) }}
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: idx === options.length - 1 ? 0 : 1, borderBottomColor: colors.border }}
                      accessibilityRole="button"
                      accessibilityLabel={o.label}
                    >
                      <Text style={{ color: colors.textPrimary, fontSize: 16 }}>{o.label}</Text>
                      {o.value === value && <Ionicons name="checkmark" size={18} color={colors.link} />}
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}
