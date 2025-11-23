import { useState } from "react"
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from "react-native"
import { Input, TextArea } from "../components/Form"
import { Button } from "../components/Button"
import { Card, CardContent } from "../components/Card"
import { useAuth } from "../contexts/AuthContext"
import { supabase } from "../supabase"
import { Ionicons } from "@expo/vector-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"

interface ProductFormProps {
  navigation: any
  product?: {
    id: string
    name: string
    unit: string
    cost: number
    min_stock: number
    supplier?: string
  }
  onSave?: () => void
}

export function ProductForm({ navigation, product, onSave }: ProductFormProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const insets = useSafeAreaInsets()
  const [formData, setFormData] = useState({
    name: product?.name || "",
    unit: product?.unit || "un",
    cost: product ? String(product.cost) : "",
    min_stock: product ? String(product.min_stock) : "0",
    supplier: product?.supplier || "",
  })
  const [description, setDescription] = useState("")
  const [quantity, setQuantity] = useState("0")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const unitOptions = [
    { label: "Unidade", value: "un" },
    { label: "Quilograma", value: "kg" },
    { label: "Grama", value: "g" },
    { label: "Litro", value: "l" },
    { label: "Mililitro", value: "ml" },
    { label: "Metro", value: "m" },
    { label: "Centímetro", value: "cm" },
    { label: "Caixa", value: "cx" },
    { label: "Saco", value: "sc" },
    { label: "Pacote", value: "pc" },
  ]

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Nome do produto é obrigatório"
    }

    if (!formData.unit.trim()) {
      newErrors.unit = "Unidade é obrigatória"
    }

    if (!formData.cost.trim()) {
      newErrors.cost = "Custo é obrigatório"
    } else if (isNaN(Number(formData.cost)) || Number(formData.cost) < 0) {
      newErrors.cost = "Custo deve ser um número positivo"
    }

    if (!formData.min_stock.trim()) {
      newErrors.min_stock = "Estoque mínimo é obrigatório"
    } else if (isNaN(Number(formData.min_stock)) || Number(formData.min_stock) < 0) {
      newErrors.min_stock = "Estoque mínimo deve ser um número positivo"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm() || !user) return

    try {
      setLoading(true)

      const productData = {
        gardener_id: user.id,
        name: formData.name.trim(),
        unit: formData.unit.trim(),
        cost: Number(formData.cost),
        min_stock: Number(formData.min_stock),
        supplier: formData.supplier.trim() || null,
      }

      if (product) {
        // Update existing product
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", product.id)

        if (error) throw error

        Alert.alert("Sucesso", "Produto atualizado com sucesso!")
      } else {
        // Create new product
        const { error } = await supabase
          .from("products")
          .insert(productData)

        if (error) throw error

        Alert.alert("Sucesso", "Produto criado com sucesso!")
      }

      if (onSave) {
        onSave()
      } else {
        navigation.goBack()
      }
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao salvar produto")
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }] }>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#f9fafb" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {product ? "Editar Produto" : "Adicionar Produto"}
        </Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Imagem do Produto</Text>
        <TouchableOpacity style={styles.uploadBox} onPress={() => Alert.alert('Upload', 'Selecione uma imagem do produto')}>
          <Ionicons name="image-outline" size={32} color="#9ca3af" />
          <Text style={styles.uploadHintPrimary}>Carregar um arquivo</Text>
          <Text style={styles.uploadHintSecondary}>PNG, JPG, GIF até 10MB</Text>
        </TouchableOpacity>
      </View>

      <Card style={styles.formCard}>
        <CardContent>
          <Input
            label="Nome do Produto"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Ex: Terra Adubada 20kg"
            error={errors.name}
            required
            variant="dark"
          />

          <TextArea
            label="Descrição"
            value={description}
            onChangeText={setDescription}
            placeholder="Insira uma breve descrição do produto..."
            variant="dark"
          />

          <View style={styles.rowInputs}>
            <View style={styles.halfInput}>
              <Input
                label="Quantidade"
                value={quantity}
                onChangeText={setQuantity}
                placeholder="0"
                keyboardType="numeric"
                variant="dark"
              />
            </View>
            <View style={styles.halfInput}>
              <Input
                label="Unidade de Medida"
                value={formData.unit}
                onChangeText={(text) => setFormData({ ...formData, unit: text })}
                placeholder="Ex: kg, L, un"
                error={errors.unit}
                required
                variant="dark"
              />
            </View>
          </View>

          <View style={styles.rowInputs}>
            <View style={styles.halfInput}>
              <Input
                label="Custo do Produto"
                value={formData.cost}
                onChangeText={(text) => setFormData({ ...formData, cost: text })}
                placeholder="R$0,00"
                keyboardType="numeric"
                error={errors.cost}
                required
                variant="dark"
              />
            </View>
            <View style={styles.halfInput}>
              <Input
                label="Estoque Mínimo"
                value={formData.min_stock}
                onChangeText={(text) => setFormData({ ...formData, min_stock: text })}
                placeholder="0"
                keyboardType="numeric"
                error={errors.min_stock}
                required
                variant="dark"
              />
            </View>
          </View>

          <Input
            label="Fornecedor (Opcional)"
            value={formData.supplier}
            onChangeText={(text) => setFormData({ ...formData, supplier: text })}
            placeholder="Nome do fornecedor"
            variant="dark"
          />
        </CardContent>
      </Card>

      <View style={styles.actionsSingle}>
        <Button
          onPress={handleSave}
          loading={loading}
          size="large"
          style={{ backgroundColor: '#22c55e', borderColor: '#22c55e' }}
        >
          Salvar Produto
        </Button>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f13',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#0b0f13',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f9fafb',
  },
  divider: {
    height: 1,
    backgroundColor: '#12171c',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f9fafb',
    marginBottom: 8,
  },
  uploadBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#374151',
    borderRadius: 12,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#12171c',
  },
  uploadHintPrimary: {
    marginTop: 8,
    color: '#22c55e',
    fontWeight: '700',
  },
  uploadHintSecondary: {
    marginTop: 4,
    color: '#9ca3af',
    fontSize: 12,
  },
  formCard: {
    marginHorizontal: 20,
    marginVertical: 12,
    backgroundColor: '#1a1f24',
    borderColor: '#1a1f24',
    borderWidth: 0,
  },
  rowInputs: {
    flexDirection: 'row',
    columnGap: 12,
  },
  halfInput: {
    flex: 1,
  },
  actionsSingle: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
})