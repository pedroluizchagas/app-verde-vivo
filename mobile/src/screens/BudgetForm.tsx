import { useEffect, useMemo, useState } from "react"
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from "react-native"
import { Input, TextArea, Select, DateInput } from "../components/Form"
import { Button } from "../components/Button"
import { Card, CardContent } from "../components/Card"
import { useAuth } from "../contexts/AuthContext"
import { supabase } from "../supabase"
import { format } from "date-fns"

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
  const [loading, setLoading] = useState(false)
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

  const totalAmount = useMemo(() => {
    return items.reduce((sum, it) => {
      const q = Number(it.quantity)
      const p = Number(it.unit_price)
      if (isNaN(q) || isNaN(p)) return sum
      return sum + q * p
    }, 0)
  }, [items])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.title.trim()) newErrors.title = "Título é obrigatório"
    if (!formData.client_id) newErrors.client_id = "Cliente é obrigatório"
    if (!formData.valid_until) newErrors.valid_until = "Validade é obrigatória"
    const hasInvalid = items.some(it => !it.description.trim() || isNaN(Number(it.quantity)) || Number(it.quantity) <= 0 || isNaN(Number(it.unit_price)) || Number(it.unit_price) < 0)
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

      if (budget?.id) {
        const { error } = await supabase
          .from("budgets")
          .update(data)
          .eq("id", budget.id)
        if (error) throw error
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
            quantity: Number(it.quantity),
            unit_price: Number(it.unit_price),
            total_price: Number(it.quantity) * Number(it.unit_price),
            gardener_id: user.id,
          }))
          try {
            await supabase.from("budget_items").insert(itemsPayload)
          } catch {}
        }
      }

      Alert.alert("Sucesso", budget?.id ? "Orçamento atualizado" : "Orçamento criado", [
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>{budget?.id ? "Editar Orçamento" : "Novo Orçamento"}</Text>
      </View>

      <Card style={styles.formCard}>
        <CardContent>
          <Input
            label="Título"
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
            placeholder="Ex: Manutenção de jardim"
            error={errors.title}
            required
          />

          <Select
            label="Cliente"
            value={formData.client_id}
            onValueChange={(value) => setFormData({ ...formData, client_id: value })}
            options={clientOptions}
            error={errors.client_id}
            required
          />

          <Select
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

          <TextArea
            label="Descrição"
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder="Detalhes do orçamento"
          />

          <View style={styles.itemsHeader}>
            <Text style={styles.itemsTitle}>Itens</Text>
            <TouchableOpacity onPress={addItem} style={styles.addItemButton}>
              <Text style={styles.addItemText}>Adicionar</Text>
            </TouchableOpacity>
          </View>

          {errors.items && <Text style={styles.errorText}>{errors.items}</Text>}

          {items.map((it, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemColDesc}>
                <Input
                  label="Descrição"
                  value={it.description}
                  onChangeText={(text) => updateItem(index, { description: text })}
                  placeholder="Ex: Poda de árvores"
                />
              </View>
              <View style={styles.itemColQty}>
                <Input
                  label="Qtd"
                  value={it.quantity}
                  onChangeText={(text) => updateItem(index, { quantity: text })}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.itemColPrice}>
                <Input
                  label="Valor"
                  value={it.unit_price}
                  onChangeText={(text) => updateItem(index, { unit_price: text })}
                  keyboardType="numeric"
                />
              </View>
              <TouchableOpacity onPress={() => removeItem(index)} style={styles.removeItemButton}>
                <Text style={styles.removeItemText}>Remover</Text>
              </TouchableOpacity>
            </View>
          ))}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
          </View>
        </CardContent>
      </Card>

      <View style={styles.actions}>
        <Button variant="outline" onPress={() => navigation.goBack()} style={styles.button}>Cancelar</Button>
        <Button onPress={handleSave} loading={loading} style={styles.button}>{budget?.id ? "Atualizar" : "Criar"}</Button>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: { padding: 16, paddingTop: 48, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  title: { fontSize: 24, fontWeight: "700", color: "#111827" },
  formCard: { margin: 16 },
  actions: { flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingBottom: 24 },
  button: { flex: 1 },
  itemsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8, marginBottom: 4 },
  itemsTitle: { fontSize: 16, fontWeight: "600", color: "#111827" },
  addItemButton: { backgroundColor: "#10B981", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addItemText: { color: "#FFFFFF", fontSize: 12, fontWeight: "600" },
  itemRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 8 },
  itemColDesc: { flex: 2 },
  itemColQty: { flex: 1 },
  itemColPrice: { flex: 1 },
  removeItemButton: { paddingHorizontal: 10, paddingVertical: 8, backgroundColor: "#FEE2E2", borderRadius: 8 },
  removeItemText: { color: "#991B1B", fontSize: 12, fontWeight: "600" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  totalLabel: { fontSize: 16, fontWeight: "600", color: "#111827" },
  totalValue: { fontSize: 18, fontWeight: "700", color: "#111827" },
  errorText: { fontSize: 12, color: "#EF4444", marginBottom: 8 },
})