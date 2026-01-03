import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Modal, useWindowDimensions } from "react-native"
import { Input, TextArea, DateInput } from "../components/Form"
import { Button } from "../components/Button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card"
import { useAuth } from "../contexts/AuthContext"
import { supabase } from "../supabase"
import { Ionicons } from "@expo/vector-icons"
import { format } from "date-fns"
import { NotificationService } from "../services/notificationService"
import { useTheme } from "../contexts/ThemeContext"
import type { ThemeColors } from "../theme"
import { useSafeAreaInsets } from "react-native-safe-area-context"

interface TransactionFormProps {
  navigation: any
  route?: any
  transaction?: {
    id: string
    type: "income" | "expense"
    amount: number
    transaction_date: string
    description?: string
    category_id?: string
    client_id?: string
    status: "paid" | "pending"
    due_date?: string
  }
  onSave?: () => void
}

interface Category {
  id: string
  name: string
}

interface Client {
  id: string
  name: string
}

export function TransactionForm({ navigation, route, transaction: transactionProp, onSave }: TransactionFormProps) {
  const { user } = useAuth()
  const { colors } = useTheme()
  const styles = createStyles(colors)
  const insets = useSafeAreaInsets()
  const transaction = (route?.params?.transaction as any) || transactionProp
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [formData, setFormData] = useState({
    type: transaction?.type || "income",
    amount: transaction ? String(transaction.amount) : "",
    transaction_date: transaction ? new Date(transaction.transaction_date) : new Date(),
    description: transaction?.description || "",
    category_id: transaction?.category_id || "",
    client_id: transaction?.client_id || "",
    status: transaction?.status || "paid",
    due_date: transaction?.due_date ? new Date(transaction.due_date) : null,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadCategories()
    loadClients()
  }, [])

  const toNumber = (s: string) => Number(String(s || "").replace(/\./g, "").replace(",", ".").replace(/[^0-9.-]/g, ""))

  const loadCategories = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("financial_categories")
        .select("id, name")
        .eq("gardener_id", user.id)
        .order("name")

      if (error) throw error
      setCategories(data || [])
    } catch (error: any) {
      console.error("Error loading categories:", error)
    }
  }

  const loadClients = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name")
        .eq("gardener_id", user.id)
        .order("name")

      if (error) throw error
      setClients(data || [])
    } catch (error: any) {
      console.error("Error loading clients:", error)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.amount.trim()) {
      newErrors.amount = "Valor é obrigatório"
    } else if (isNaN(toNumber(formData.amount)) || toNumber(formData.amount) <= 0) {
      newErrors.amount = "Valor deve ser maior que zero"
    }

    if (!formData.category_id) {
      newErrors.category_id = "Categoria é obrigatória"
    }

    if (formData.status === "pending" && !formData.due_date) {
      newErrors.due_date = "Data de vencimento é obrigatória para transações pendentes"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm() || !user) return

    try {
      setLoading(true)

      const transactionData = {
        gardener_id: user.id,
        type: formData.type,
        amount: toNumber(formData.amount),
        transaction_date: format(formData.transaction_date, "yyyy-MM-dd"),
        description: formData.description.trim() || null,
        category_id: formData.category_id || null,
        client_id: formData.client_id || null,
        status: formData.status,
        due_date: formData.due_date ? format(formData.due_date, "yyyy-MM-dd") : null,
      }

      let newInsertedId: string | undefined
      if (transaction) {
        const { error } = await supabase
          .from("financial_transactions")
          .update(transactionData)
          .eq("id", transaction.id)

        if (error) throw error

        Alert.alert("Sucesso", "Transação atualizada com sucesso!")
      } else {
        const { data: inserted, error } = await supabase
          .from("financial_transactions")
          .insert(transactionData)
          .select('id')
          .single()

        if (error) throw error
        if (inserted?.id != null) newInsertedId = String(inserted.id)

        Alert.alert("Sucesso", "Transação criada com sucesso!")
      }

      if (formData.status === "pending" && formData.due_date) {
        const newId = (transaction && transaction.id) || newInsertedId
        if (newId) {
          const trxData = {
            id: newId,
            description: formData.description,
            amount: toNumber(formData.amount),
            type: formData.type,
            status: formData.status,
            due_date: formData.due_date,
          }
          await NotificationService.schedulePendingPaymentReminder(trxData, 3)
        }
      }

      if (onSave) {
        onSave()
      } else {
        navigation.goBack()
      }
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao salvar transação")
    } finally {
      setLoading(false)
    }
  }

  const typeOptions = [
    { label: "Receita", value: "income" },
    { label: "Despesa", value: "expense" },
  ]

  const statusOptions = [
    { label: "Pago", value: "paid" },
    { label: "Pendente", value: "pending" },
  ]

  const categoryOptions = [
    { label: "Selecione uma categoria", value: "" },
    ...categories.map((cat) => ({ label: cat.name, value: cat.id })),
  ]

  const clientOptions = [
    { label: "Sem cliente", value: "" },
    ...clients.map((client) => ({ label: client.name, value: client.id })),
  ]

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + 16 }} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon} accessibilityRole="button" accessibilityLabel="Voltar">
          <Ionicons name="chevron-back" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>{transaction ? "Editar transação" : "Nova transação"}</Text>
        <View style={styles.headerIcon} />
      </View>
      <View style={styles.divider} />

      <View style={styles.section}>
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da transação</CardTitle>
          </CardHeader>
          <CardContent>
            <Dropdown
              label="Tipo"
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as "income" | "expense" })}
              options={typeOptions}
              required
            />

            <Input
              label="Valor (R$)"
              value={formData.amount}
              onChangeText={(text) => setFormData({ ...formData, amount: text })}
              placeholder="0,00"
              keyboardType="numeric"
              error={errors.amount}
              required
            />

            <Dropdown
              label="Categoria"
              value={formData.category_id}
              onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              options={categoryOptions}
              error={errors.category_id}
              required
            />

            <Dropdown
              label="Cliente (opcional)"
              value={formData.client_id}
              onValueChange={(value) => setFormData({ ...formData, client_id: value })}
              options={clientOptions}
            />

            <Dropdown
              label="Status"
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value as "paid" | "pending" })}
              options={statusOptions}
              required
            />

            <DateInput
              label="Data da transação"
              value={formData.transaction_date}
              onValueChange={(date) => setFormData({ ...formData, transaction_date: date })}
              required
            />

            {formData.status === "pending" && (
              <DateInput
                label="Data de vencimento"
                value={formData.due_date}
                onValueChange={(date) => setFormData({ ...formData, due_date: date })}
                error={errors.due_date}
                required
              />
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
              label="Descrição"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Descrição da transação"
            />
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
          {transaction ? "Atualizar transação" : "Salvar transação"}
        </Button>
      </View>
    </ScrollView>
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
})

function Dropdown({ label, value, onValueChange, options, required, error }: { label: string; value: string; onValueChange: (v: string) => void; options: { label: string; value: string }[]; required?: boolean; error?: string }) {
  const { mode, colors } = useTheme()
  const insets = useSafeAreaInsets()
  const { height: windowHeight } = useWindowDimensions()
  const isDark = mode === "dark"
  const [open, setOpen] = useState(false)
  const currentLabel = options.find((o) => o.value === value)?.label || "Selecione"
  return (
    <View style={{ marginBottom: 12 }}>
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
        <Text style={{ fontSize: 16, color: isDark ? "#f9fafb" : "#111827" }}>{currentLabel}</Text>
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
      {error && <Text style={{ fontSize: 12, color: "#EF4444", marginTop: 4 }}>{error}</Text>}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: colors.surfaceAlt, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: insets.bottom + 16, maxHeight: windowHeight * 0.9 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.textPrimary }}>{label}</Text>
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
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        borderBottomWidth: idx === options.length - 1 ? 0 : 1,
                        borderBottomColor: colors.border,
                      }}
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
