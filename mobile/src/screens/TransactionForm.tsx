import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native"
import { Input, TextArea, Select } from "../components/Form"
import { Button } from "../components/Button"
import { Card, CardContent } from "../components/Card"
import { useAuth } from "../contexts/AuthContext"
import { supabase } from "../supabase"
import { Ionicons } from "@expo/vector-icons"
import { format } from "date-fns"
import { NotificationService } from "../services/notificationService"
import { ptBR } from "date-fns/locale"

interface TransactionFormProps {
  navigation: any
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

export function TransactionForm({ navigation, transaction, onSave }: TransactionFormProps) {
  const { user } = useAuth()
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
    } else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
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
        amount: Number(formData.amount),
        transaction_date: format(formData.transaction_date, "yyyy-MM-dd"),
        description: formData.description.trim() || null,
        category_id: formData.category_id || null,
        client_id: formData.client_id || null,
        status: formData.status,
        due_date: formData.due_date ? format(formData.due_date, "yyyy-MM-dd") : null,
      }

      let newInsertedId: string | undefined
      if (transaction) {
        // Update existing transaction
        const { error } = await supabase
          .from("financial_transactions")
          .update(transactionData)
          .eq("id", transaction.id)

        if (error) throw error

        Alert.alert("Sucesso", "Transação atualizada com sucesso!")
      } else {
        let newInsertedId: string | undefined
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
            amount: Number(formData.amount),
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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {transaction ? "Editar Transação" : "Nova Transação"}
        </Text>
      </View>

      <Card style={styles.formCard}>
        <CardContent>
          <Select
            label="Tipo"
            value={formData.type}
            onValueChange={(value) => setFormData({ ...formData, type: value as "income" | "expense" })}
            options={typeOptions}
            error={errors.type}
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

          <Select
            label="Categoria"
            value={formData.category_id}
            onValueChange={(value) => setFormData({ ...formData, category_id: value })}
            options={[
              { label: "Selecione uma categoria", value: "" },
              ...categories.map(cat => ({ label: cat.name, value: cat.id }))
            ]}
            error={errors.category_id}
            required
          />

          <Select
            label="Cliente (opcional)"
            value={formData.client_id}
            onValueChange={(value) => setFormData({ ...formData, client_id: value })}
            options={[
              { label: "Sem cliente", value: "" },
              ...clients.map(client => ({ label: client.name, value: client.id }))
            ]}
          />

          <Select
            label="Status"
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value as "paid" | "pending" })}
            options={statusOptions}
            error={errors.status}
            required
          />

          <Input
            label="Data da transação"
            value={format(formData.transaction_date, "dd/MM/yyyy")}
            editable={false}
          />

          {formData.status === "pending" && (
            <Input
              label="Data de vencimento"
              value={formData.due_date ? format(formData.due_date, "dd/MM/yyyy") : ""}
              placeholder="DD/MM/AAAA"
              onChangeText={(text) => {
                // Simple date parsing
                const parts = text.split('/')
                if (parts.length === 3) {
                  const date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
                  if (!isNaN(date.getTime())) {
                    setFormData({ ...formData, due_date: date })
                  }
                }
              }}
              error={errors.due_date}
            />
          )}

          <TextArea
            label="Descrição"
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder="Descrição da transação"
          />
        </CardContent>
      </Card>

      <View style={styles.actions}>
        <Button
          variant="outline"
          onPress={() => navigation.goBack()}
          style={styles.button}
        >
          Cancelar
        </Button>
        <Button
          onPress={handleSave}
          loading={loading}
          style={styles.button}
        >
          {transaction ? "Atualizar" : "Criar"}
        </Button>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    padding: 16,
    paddingTop: 48,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  formCard: {
    margin: 16,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  button: {
    flex: 1,
  },
})