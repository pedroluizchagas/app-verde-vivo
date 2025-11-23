import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native"
import { supabase } from "../supabase"
import { useAuth } from "../contexts/AuthContext"
import { Input, Select } from "../components/Form"
import { Button } from "../components/Button"
import { Card, CardContent } from "../components/Card"
import { Ionicons } from "@expo/vector-icons"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Product {
  id: string
  name: string
  unit: string
  cost: number
  min_stock: number
}

interface FormData {
  product_id: string
  type: "in" | "out"
  quantity: string
  unit_cost: string
  movement_date: string
  description: string
}

export function MovementForm({ navigation }: any) {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    product_id: "",
    type: "in",
    quantity: "",
    unit_cost: "",
    movement_date: format(new Date(), "yyyy-MM-dd"),
    description: ""
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, unit, cost, min_stock")
        .eq("gardener_id", user?.id)
        .order("name")

      if (error) throw error
      setProducts(data || [])
    } catch (error: any) {
      Alert.alert("Erro", "Erro ao carregar produtos: " + error.message)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.product_id) {
      newErrors.product_id = "Produto é obrigatório"
    }

    if (!formData.quantity.trim()) {
      newErrors.quantity = "Quantidade é obrigatória"
    } else if (isNaN(Number(formData.quantity)) || Number(formData.quantity) <= 0) {
      newErrors.quantity = "Quantidade deve ser um número positivo"
    }

    if (!formData.unit_cost.trim()) {
      newErrors.unit_cost = "Custo unitário é obrigatório"
    } else if (isNaN(Number(formData.unit_cost)) || Number(formData.unit_cost) < 0) {
      newErrors.unit_cost = "Custo unitário deve ser um número positivo"
    }

    if (!formData.movement_date) {
      newErrors.movement_date = "Data da movimentação é obrigatória"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const movementData = {
        gardener_id: user?.id,
        product_id: formData.product_id,
        type: formData.type,
        quantity: Number(formData.quantity),
        unit_cost: Number(formData.unit_cost),
        movement_date: formData.movement_date,
        description: formData.description.trim() || null
      }

      const { error } = await supabase
        .from("product_movements")
        .insert([movementData])

      if (error) throw error

      Alert.alert("Sucesso", "Movimentação registrada com sucesso!", [
        { text: "OK", onPress: () => navigation.goBack() }
      ])
    } catch (error: any) {
      Alert.alert("Erro", "Erro ao registrar movimentação: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const productOptions = products.map(product => ({
    label: `${product.name} (${product.unit})`,
    value: product.id
  }))

  const typeOptions = [
    { label: "Entrada", value: "in" },
    { label: "Saída", value: "out" }
  ]

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Nova Movimentação</Text>
      </View>

      <Card style={styles.formCard}>
        <CardContent>
          <Select
            label="Produto"
            value={formData.product_id}
            onValueChange={(value) => setFormData({ ...formData, product_id: value })}
            options={[{ label: "Selecione um produto...", value: "" }, ...productOptions]}
            error={errors.product_id}
            required
          />

          <Select
            label="Tipo de Movimentação"
            value={formData.type}
            onValueChange={(value) => setFormData({ ...formData, type: value as "in" | "out" })}
            options={typeOptions}
            error={errors.type}
            required
          />

          <Input
            label="Quantidade"
            placeholder="Digite a quantidade"
            value={formData.quantity}
            onChangeText={(text) => setFormData({ ...formData, quantity: text })}
            keyboardType="numeric"
            error={errors.quantity}
            required
          />

          <Input
            label="Custo Unitário"
            placeholder="Digite o custo unitário"
            value={formData.unit_cost}
            onChangeText={(text) => setFormData({ ...formData, unit_cost: text })}
            keyboardType="numeric"
            error={errors.unit_cost}
            required
          />

          <Input
            label="Data da Movimentação"
            placeholder=""
            value={formData.movement_date}
            onChangeText={(text) => setFormData({ ...formData, movement_date: text })}
            error={errors.movement_date}
            required
          />

          <Input
            label="Descrição (opcional)"
            placeholder="Digite uma descrição da movimentação"
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            multiline
            numberOfLines={3}
            error={errors.description}
          />

          <View style={styles.buttonContainer}>
            <Button
              variant="outline"
              onPress={() => navigation.goBack()}
              style={styles.cancelButton}
            >
              Cancelar
            </Button>
            <Button
              onPress={handleSubmit}
              loading={loading}
              style={styles.submitButton}
            >
              Registrar Movimentação
            </Button>
          </View>
        </CardContent>
      </Card>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
})