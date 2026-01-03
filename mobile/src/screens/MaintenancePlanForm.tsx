import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Modal, useWindowDimensions } from "react-native"
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { supabase } from "../supabase"
import { useAuth } from "../contexts/AuthContext"
import { Input, Select, TextArea } from "../components/Form"
import { Button } from "../components/Button"
import { Card, CardHeader, CardTitle, CardContent } from "../components/Card"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTheme } from "../contexts/ThemeContext"
import type { ThemeColors } from "../theme"
import { Ionicons } from "@expo/vector-icons"
import React from "react"

type RootStackParamList = { Maintenance: undefined; MaintenancePlanForm: { plan?: MaintenancePlan } | undefined }

type MaintenancePlanFormNavigationProp = NativeStackNavigationProp<RootStackParamList, "MaintenancePlanForm">
type MaintenancePlanFormRouteProp = RouteProp<RootStackParamList, "MaintenancePlanForm">

interface Client { id: string; name: string; phone?: string }

interface MaintenancePlan {
  id: string
  title: string
  client_id: string
  service_id: string | null
  default_description: string | null
  default_labor_cost: number
  materials_markup_pct: number
  preferred_weekday: number | null
  preferred_week_of_month: number | null
  window_days: number
  billing_day: number | null
  status: "active" | "paused"
  created_at: string
  updated_at: string
}

interface FormData { title: string; client_id: string; default_labor_cost: string; billing_day: string; default_description: string }

interface FormErrors { title?: string; client_id?: string; default_labor_cost?: string; billing_day?: string }

export function MaintenancePlanForm() {
  const navigation = useNavigation<MaintenancePlanFormNavigationProp>()
  const route = useRoute<MaintenancePlanFormRouteProp>()
  const { user } = useAuth()
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()
  const styles = createStyles(colors)

  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [formData, setFormData] = useState<FormData>({ title: "", client_id: "", default_labor_cost: "0", billing_day: "", default_description: "" })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Extras do template
  const [clientPhone, setClientPhone] = useState("")
  const [gardenSize, setGardenSize] = useState<string>("")
  const [gardenType, setGardenType] = useState<string>("")
  const [fertilizerType, setFertilizerType] = useState<string>("")
  const [fertilizationMonths, setFertilizationMonths] = useState<number[]>([])
  const [pestControlType, setPestControlType] = useState<string>("none")
  const [pestNotes, setPestNotes] = useState<string>("")
  const [plants, setPlants] = useState<{ name: string; notes?: string }[]>([])
  const [newPlantName, setNewPlantName] = useState("")
  const [newPlantNotes, setNewPlantNotes] = useState("")
  const [plantsModalOpen, setPlantsModalOpen] = useState(false)
  const monthLabels = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]

  useEffect(() => {
    loadClients()
    
      if (route.params?.plan) {
      const plan = route.params.plan
      setFormData({
        title: plan.title,
        client_id: plan.client_id,
        default_labor_cost: plan.default_labor_cost.toString(),
        billing_day: plan.billing_day?.toString() || "",
        default_description: plan.default_description || ""
      })
      setIsEditing(true)
      navigation.setOptions({ title: "Editar cliente plano mensal" })
    } else {
      navigation.setOptions({ title: "Novo cliente plano mensal" })
    }
  }, [route.params?.plan])

  const loadClients = async () => {
    try {
      const { data: clientsData } = await supabase
        .from("clients")
        .select("id, name, phone")
        .eq("gardener_id", user?.id)
        .order("name")
      
      setClients(clientsData || [])
    } catch (error) {
      console.error("Erro ao carregar clientes:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const c = clients.find((x) => x.id === formData.client_id) as any
    setClientPhone(c?.phone ? String(c.phone) : "")
  }, [formData.client_id, clients])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    
    if (!formData.title.trim()) {
      newErrors.title = "Título é obrigatório"
    }
    
    if (!formData.client_id) {
      newErrors.client_id = "Cliente é obrigatório"
    }
    
    if (isNaN(Number(formData.default_labor_cost)) || Number(formData.default_labor_cost) < 0) {
      newErrors.default_labor_cost = "Valor deve ser um número positivo"
    }
    
    if (formData.billing_day && (isNaN(Number(formData.billing_day)) || Number(formData.billing_day) < 1 || Number(formData.billing_day) > 31)) {
      newErrors.billing_day = "Dia deve estar entre 1 e 31"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    
    setIsSubmitting(true)
    
    try {
      const serviceId = isEditing && route.params?.plan ? route.params.plan.service_id : null
      const payload = {
        gardener_id: user?.id,
        title: formData.title.trim(),
        client_id: formData.client_id,
        service_id: serviceId,
        default_description: formData.default_description.trim() || null,
        default_labor_cost: Number(formData.default_labor_cost),
        materials_markup_pct: 0,
        preferred_weekday: null,
        preferred_week_of_month: null,
        window_days: 7,
        billing_day: formData.billing_day ? Number(formData.billing_day) : null,
        status: "active"
      }
      
      let planId: string | undefined
      if (isEditing && route.params?.plan) {
        const { error } = await supabase
          .from("maintenance_plans")
          .update(payload)
          .eq("id", route.params.plan.id)
        
        if (error) throw error
        
        planId = route.params.plan.id
        Alert.alert("Sucesso", "Plano atualizado com sucesso!")
      } else {
        const { data, error } = await supabase
          .from("maintenance_plans")
          .insert(payload)
          .select("id")
          .single()
        
        if (error) throw error
        planId = String((data as any)?.id)
        
        Alert.alert("Sucesso", "Plano criado com sucesso!")
      }
      
      // Upsert template details
      if (planId) {
        const details: any = {
          schedule: { fertilization_months: fertilizationMonths },
          garden: { size: gardenSize || null, type: gardenType || null },
          fertilization_defaults: { type: fertilizerType || null },
          pests_defaults: { control_type: pestControlType || null, notes: pestNotes || null },
          plants: plants,
        }
        const { data: tmpl } = await supabase
          .from("plan_executions")
          .select("id")
          .eq("plan_id", planId)
          .eq("cycle", "template")
          .maybeSingle()
        if (tmpl?.id) {
          const { error: uerr } = await supabase
            .from("plan_executions")
            .update({ details })
            .eq("id", tmpl.id)
          if (uerr) throw uerr
        } else {
          const { error: ierr } = await supabase
            .from("plan_executions")
            .insert([{ plan_id: planId, cycle: "template", status: "open", details }])
          if (ierr) throw ierr
        }
      }

      navigation.goBack()
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao salvar plano")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) { return (<View style={styles.loadingContainer}><Text style={styles.loadingText}>Carregando...</Text></View>) }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + 16 }} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }] }>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon} accessibilityRole="button" accessibilityLabel="Voltar">
          <Ionicons name="chevron-back" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>{isEditing ? "Editar cliente plano mensal" : "Novo cliente plano mensal"}</Text>
        <View style={styles.headerIcon} />
      </View>
      <View style={styles.divider} />

      <Card style={styles.card}>
        <CardHeader><CardTitle>Dados do Cliente</CardTitle></CardHeader>
        <CardContent>
          <Input label="Título do plano" value={formData.title} onChangeText={(t) => setFormData({ ...formData, title: t })} placeholder="Ex.: Manutenção jardim da Ana" error={errors.title} />
          <Dropdown label="Selecionar cliente" value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })} options={clients.map(client => ({ label: client.name, value: client.id }))} required />
          <Input label="Contato (Whatsapp)" value={clientPhone} onChangeText={(t) => setClientPhone(t)} editable={false} />
        </CardContent>
      </Card>

      <Card style={styles.card}>
        <CardHeader><CardTitle>Dados do Contrato</CardTitle></CardHeader>
        <CardContent>
          <View style={styles.row}>
            <View style={styles.col}><Input label="Valor mensal" value={formData.default_labor_cost} onChangeText={(text) => setFormData({ ...formData, default_labor_cost: text })} placeholder="R$ 0,00" keyboardType="numeric" error={errors.default_labor_cost} /></View>
            <View style={styles.col}><Input label="Dia de vencimento" value={formData.billing_day} onChangeText={(text) => setFormData({ ...formData, billing_day: text })} placeholder="10" keyboardType="numeric" error={errors.billing_day} /></View>
          </View>
        </CardContent>
      </Card>

      <Card style={styles.card}>
        <CardHeader><CardTitle>Dados do Jardim</CardTitle></CardHeader>
        <CardContent>
          <View style={styles.row}>
            <View style={styles.col}><Dropdown label="Tamanho" value={gardenSize} onValueChange={setGardenSize} options={[{ label: "Pequeno", value: "small" }, { label: "Médio", value: "medium" }, { label: "Grande", value: "large" }]} /></View>
            <View style={styles.col}><Dropdown label="Tipo" value={gardenType} onValueChange={setGardenType} options={[{ label: "Horizontal", value: "horizontal" }, { label: "Vertical", value: "vertical" }]} /></View>
          </View>
        </CardContent>
      </Card>

      <Card style={styles.card}>
        <CardHeader><CardTitle>Controle de Adubação</CardTitle></CardHeader>
        <CardContent>
          <Dropdown label="Tipo de adubo" value={fertilizerType} onValueChange={setFertilizerType} options={[{ label: "Orgânico (Esterco / Húmus)", value: "organic" }, { label: "NPK 10-10-10", value: "npk_10_10_10" }, { label: "Composto", value: "compost" }]} />
          <View style={styles.monthsRow}>
            {monthLabels.map((m, i) => {
              const val = i + 1
              const active = fertilizationMonths.includes(val)
              return (
                <TouchableOpacity key={m} style={[styles.monthChip, active && styles.monthChipActive]} onPress={() => setFertilizationMonths((prev) => (prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]))}>
                  <Text style={[styles.monthText, active && styles.monthTextActive]}>{m}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </CardContent>
      </Card>

      <Card style={styles.card}>
        <CardHeader><CardTitle>Controle de Pragas</CardTitle></CardHeader>
        <CardContent>
          <Dropdown label="Tipo de controle" value={pestControlType} onValueChange={setPestControlType} options={[{ label: "Nenhum", value: "none" }, { label: "Preventivo", value: "preventive" }, { label: "Curativo", value: "corrective" }]} />
          <TextArea label="Observações" value={pestNotes} onChangeText={setPestNotes} placeholder="Ex: Presença de pulgões nas roseiras" numberOfLines={4} />
        </CardContent>
      </Card>

      <Card style={styles.card}>
        <CardHeader>
          <View style={styles.plantsHeaderRow}>
            <CardTitle>Plantas</CardTitle>
            <Button size="small" onPress={() => setPlantsModalOpen(true)} style={styles.addPlantButton}>+ Adicionar</Button>
          </View>
        </CardHeader>
        <CardContent>
          {plants.map((pl, idx) => (
            <View key={`${pl.name}-${idx}`} style={styles.plantItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.plantName}>{pl.name}</Text>
                {pl.notes && <Text style={styles.plantNotes}>{pl.notes}</Text>}
              </View>
              <TouchableOpacity onPress={() => setPlants((prev) => prev.filter((_, i) => i !== idx))} accessibilityRole="button" accessibilityLabel="Remover planta">
                <Ionicons name="trash" size={18} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ))}
        </CardContent>
      </Card>

      <Modal visible={plantsModalOpen} transparent animationType="fade" onRequestClose={() => setPlantsModalOpen(false)}>
        <View style={styles.modalOverlay} />
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>Adicionar planta</Text>
          <Input label="Nome da planta" value={newPlantName} onChangeText={setNewPlantName} placeholder="Ex.: Samambaia" />
          <TextArea label="Observações" value={newPlantNotes} onChangeText={setNewPlantNotes} placeholder="Cuidados, rega, iluminação" numberOfLines={3} />
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalButton} onPress={() => { setNewPlantName(""); setNewPlantNotes(""); setPlantsModalOpen(false) }}>
              <Text style={styles.modalButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButtonPrimary} onPress={() => { if (newPlantName.trim()) { setPlants((p) => [...p, { name: newPlantName.trim(), notes: newPlantNotes.trim() || undefined }]); setNewPlantName(""); setNewPlantNotes(""); setPlantsModalOpen(false) } }}>
              <Text style={styles.modalButtonTextPrimary}>Adicionar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Card style={styles.card}>
        <CardHeader><CardTitle>Notas do plano (opcional)</CardTitle></CardHeader>
        <CardContent>
          <TextArea label="Descrição padrão" value={formData.default_description} onChangeText={(text) => setFormData({ ...formData, default_description: text })} placeholder="Detalhes gerais do plano" numberOfLines={5} />
        </CardContent>
      </Card>

      <View style={[styles.buttonRow, { marginBottom: insets.bottom + 8 }]}>
        <Button onPress={() => navigation.goBack()} size="large" variant="outline" style={[styles.button, { borderRadius: 24 }]}>Cancelar</Button>
        <Button onPress={handleSubmit} disabled={isSubmitting} size="large" gradient style={[styles.button, { borderRadius: 24 }]}> 
          {isSubmitting ? "Salvando..." : (isEditing ? "Atualizar plano" : "Salvar plano")}
        </Button>
      </View>
    </ScrollView>
  )
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg, padding: 16 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: c.bg },
  loadingText: { color: c.textSecondary },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "700", color: c.textPrimary },
  divider: { height: 1, backgroundColor: c.divider, marginTop: 8, marginBottom: 12 },
  card: { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1 },
  row: { flexDirection: "row", gap: 12 },
  col: { flex: 1 },
  monthsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  monthChip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface },
  monthChipActive: { backgroundColor: c.link },
  monthText: { fontSize: 12, color: c.textSecondary },
  monthTextActive: { color: "#ffffff", fontWeight: "600" },
  plantsHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  addPlantButton: { backgroundColor: c.link, borderColor: c.link },
  plantItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: c.surfaceAlt, borderColor: c.border, borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 8 },
  plantName: { fontSize: 14, fontWeight: "600", color: c.textPrimary },
  plantNotes: { fontSize: 12, color: c.textSecondary },
  buttonRow: { flexDirection: "row", gap: 12, marginTop: 12 },
  button: { flex: 1 },
  modalOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: c.overlay },
  modalSheet: { position: 'absolute', left: 16, right: 16, top: '20%', borderRadius: 12, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, padding: 16 },
  modalTitle: { fontSize: 16, fontWeight: '600', color: c.textPrimary, marginBottom: 8 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', columnGap: 8, marginTop: 12 },
  modalButton: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: c.border },
  modalButtonText: { fontSize: 14, fontWeight: '500', color: c.textSecondary },
  modalButtonPrimary: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, backgroundColor: c.link },
  modalButtonTextPrimary: { fontSize: 14, fontWeight: '600', color: '#ffffff' },
})

function Dropdown({ label, value, onValueChange, options, required }: { label: string; value: string; onValueChange: (v: string) => void; options: { label: string; value: string }[]; required?: boolean }) {
  const { mode, colors } = useTheme()
  const { height: windowHeight } = useWindowDimensions()
  const isDark = mode === "dark"
  const [open, setOpen] = React.useState(false)
  const currentLabel = options.find((o) => o.value === value)?.label || "Selecione"
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={[{ fontSize: 14, fontWeight: "600", color: isDark ? "#f9fafb" : "#374151", marginBottom: 8 }]}>
        {label}
        {required && <Text style={{ color: "#EF4444" }}> *</Text>}
      </Text>
      <TouchableOpacity onPress={() => setOpen(true)} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: isDark ? "#374151" : "#D1D5DB", borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: isDark ? "#2a2f36" : "#FFFFFF" }}>
        <Text style={{ fontSize: 16, color: isDark ? "#f9fafb" : "#111827" }}>{currentLabel}</Text>
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: colors.overlay }} />
        <View style={{ position: 'absolute', left: 16, right: 16, top: '20%', borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 12, maxHeight: windowHeight * 0.7 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 }}>{label}</Text>
          <ScrollView style={{ maxHeight: Math.round(windowHeight * 0.45) }} showsVerticalScrollIndicator={false}>
            {options.map((o) => (
              <TouchableOpacity key={o.value} onPress={() => { onValueChange(o.value); setOpen(false) }} style={{ paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.textPrimary, fontSize: 14 }}>{o.label}</Text>
                {o.value === value && <Ionicons name="checkmark" size={18} color={colors.link} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', columnGap: 8, marginTop: 12 }}>
            <TouchableOpacity onPress={() => setOpen(false)} style={{ paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: '500' }}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}
