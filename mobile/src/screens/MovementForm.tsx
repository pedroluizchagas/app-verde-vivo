import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Modal, useWindowDimensions } from "react-native"
import { supabase } from "../supabase"
import { useAuth } from "../contexts/AuthContext"
import { Input, TextArea, DateInput } from "../components/Form"
import { Button } from "../components/Button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card"
import { Ionicons } from "@expo/vector-icons"
import { format } from "date-fns"
import { useTheme } from "../contexts/ThemeContext"
import type { ThemeColors } from "../theme"
import { useSafeAreaInsets } from "react-native-safe-area-context"

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
  movement_date: Date | null
  description: string
}

export function MovementForm({ navigation, route }: any) {
  const { user } = useAuth()
  const { colors } = useTheme()
  const styles = createStyles(colors)
  const insets = useSafeAreaInsets()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>(() => {
    const p = route?.params?.product as any | undefined
    const preType = (route?.params?.type as any | undefined) === "out" ? "out" : "in"
    return {
      product_id: p?.id ? String(p.id) : "",
      type: preType,
      quantity: "",
      unit_cost: p?.cost != null ? String(p.cost) : "",
      movement_date: new Date(),
      description: "",
    }
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    const p = route?.params?.product as any | undefined
    const t = route?.params?.type as any | undefined
    if (p?.id) {
      setFormData((fd) => ({
        ...fd,
        product_id: String(p.id),
        type: t === "out" ? "out" : t === "in" ? "in" : fd.type,
        unit_cost: fd.unit_cost.trim() ? fd.unit_cost : p?.cost != null ? String(p.cost) : fd.unit_cost,
      }))
    } else if (t === "out" || t === "in") {
      setFormData((fd) => ({ ...fd, type: t }))
    }
  }, [route?.params])

  const loadProducts = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, unit, cost, min_stock")
        .eq("gardener_id", user.id)
        .order("name")

      if (error) throw error
      setProducts(data || [])
    } catch (error: any) {
      Alert.alert("Erro", "Erro ao carregar produtos: " + error.message)
    }
  }

  const toNumber = (s: string) => Number(String(s || "").replace(/\./g, "").replace(",", ".").replace(/[^0-9.-]/g, ""))

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.product_id) {
      newErrors.product_id = "Produto é obrigatório"
    }

    if (!formData.quantity.trim()) {
      newErrors.quantity = "Quantidade é obrigatória"
    } else if (isNaN(toNumber(formData.quantity)) || toNumber(formData.quantity) <= 0) {
      newErrors.quantity = "Quantidade deve ser um número positivo"
    }

    if (!formData.unit_cost.trim()) {
      newErrors.unit_cost = "Custo unitário é obrigatório"
    } else if (isNaN(toNumber(formData.unit_cost)) || toNumber(formData.unit_cost) < 0) {
      newErrors.unit_cost = "Custo unitário deve ser um número positivo"
    }

    if (!formData.movement_date) {
      newErrors.movement_date = "Data da movimentação é obrigatória"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm() || !user || !formData.movement_date) return

    setLoading(true)
    try {
      const movementDate = format(formData.movement_date, "yyyy-MM-dd")
      const movementData = {
        gardener_id: user.id,
        product_id: formData.product_id,
        type: formData.type,
        quantity: toNumber(formData.quantity),
        unit_cost: toNumber(formData.unit_cost),
        movement_date: movementDate,
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
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + 16 }} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon} accessibilityRole="button" accessibilityLabel="Voltar">
          <Ionicons name="chevron-back" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Nova movimentação</Text>
        <View style={styles.headerIcon} />
      </View>
      <View style={styles.divider} />

      <View style={styles.section}>
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da movimentação</CardTitle>
          </CardHeader>
          <CardContent>
            <Dropdown
              label="Produto"
              value={formData.product_id}
              onValueChange={(value) => {
                const p = products.find((x) => x.id === value)
                setFormData((fd) => ({
                  ...fd,
                  product_id: value,
                  unit_cost: fd.unit_cost.trim() ? fd.unit_cost : p?.cost != null ? String(p.cost) : fd.unit_cost,
                }))
              }}
              options={[{ label: "Selecione um produto", value: "" }, ...productOptions]}
              error={errors.product_id}
              required
            />

            <Dropdown
              label="Tipo"
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as "in" | "out" })}
              options={typeOptions}
              required
            />

            <Input
              label="Quantidade"
              placeholder="0"
              value={formData.quantity}
              onChangeText={(text) => setFormData({ ...formData, quantity: text })}
              keyboardType="numeric"
              error={errors.quantity}
              required
            />

            <Input
              label="Custo unitário"
              placeholder="0,00"
              value={formData.unit_cost}
              onChangeText={(text) => setFormData({ ...formData, unit_cost: text })}
              keyboardType="numeric"
              error={errors.unit_cost}
              required
            />

            <DateInput
              label="Data da movimentação"
              value={formData.movement_date}
              onValueChange={(date) => setFormData({ ...formData, movement_date: date })}
              error={errors.movement_date}
              required
            />
          </CardContent>
        </Card>
      </View>

      <View style={styles.section}>
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <TextArea
              label="Descrição (opcional)"
              placeholder="Digite uma descrição da movimentação"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              error={errors.description}
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
          onPress={handleSubmit}
          loading={loading}
          gradient
          size="large"
          style={[styles.button, styles.buttonPrimary]}
        >
          Registrar movimentação
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
