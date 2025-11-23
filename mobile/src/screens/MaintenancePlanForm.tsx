import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native"
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { supabase } from "../supabase"
import { useAuth } from "../contexts/AuthContext"
import { Input, Select, TextArea } from "../components/Form"
import { Button } from "../components/Button"
import { Card } from "../components/Card"

type RootStackParamList = {
  Maintenance: undefined
  MaintenancePlanForm: { plan?: MaintenancePlan } | undefined
}

type MaintenancePlanFormNavigationProp = NativeStackNavigationProp<RootStackParamList, "MaintenancePlanForm">
type MaintenancePlanFormRouteProp = RouteProp<RootStackParamList, "MaintenancePlanForm">

interface Client {
  id: string
  name: string
}

interface Service {
  id: string
  name: string
}

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

interface FormData {
  title: string
  client_id: string
  service_id: string
  default_labor_cost: string
  materials_markup_pct: string
  preferred_weekday: string
  preferred_week_of_month: string
  window_days: string
  billing_day: string
  status: "active" | "paused"
  default_description: string
}

interface FormErrors {
  title?: string
  client_id?: string
  default_labor_cost?: string
  materials_markup_pct?: string
  window_days?: string
  billing_day?: string
}

export function MaintenancePlanForm() {
  const navigation = useNavigation<MaintenancePlanFormNavigationProp>()
  const route = useRoute<MaintenancePlanFormRouteProp>()
  const { user } = useAuth()
  
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [formData, setFormData] = useState<FormData>({
    title: "",
    client_id: "",
    service_id: "",
    default_labor_cost: "0",
    materials_markup_pct: "0",
    preferred_weekday: "",
    preferred_week_of_month: "",
    window_days: "7",
    billing_day: "",
    status: "active",
    default_description: ""
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const weekdayOptions = [
    { label: "Nenhum", value: "" },
    { label: "Domingo", value: "0" },
    { label: "Segunda", value: "1" },
    { label: "Terça", value: "2" },
    { label: "Quarta", value: "3" },
    { label: "Quinta", value: "4" },
    { label: "Sexta", value: "5" },
    { label: "Sábado", value: "6" }
  ]

  const weekOfMonthOptions = [
    { label: "Nenhuma", value: "" },
    { label: "1ª", value: "1" },
    { label: "2ª", value: "2" },
    { label: "3ª", value: "3" },
    { label: "4ª", value: "4" }
  ]

  const statusOptions = [
    { label: "Ativo", value: "active" },
    { label: "Pausado", value: "paused" }
  ]

  useEffect(() => {
    loadClientsAndServices()
    
    if (route.params?.plan) {
      const plan = route.params.plan
      setFormData({
        title: plan.title,
        client_id: plan.client_id,
        service_id: plan.service_id || "",
        default_labor_cost: plan.default_labor_cost.toString(),
        materials_markup_pct: plan.materials_markup_pct.toString(),
        preferred_weekday: plan.preferred_weekday?.toString() || "",
        preferred_week_of_month: plan.preferred_week_of_month?.toString() || "",
        window_days: plan.window_days.toString(),
        billing_day: plan.billing_day?.toString() || "",
        status: plan.status,
        default_description: plan.default_description || ""
      })
      setIsEditing(true)
      navigation.setOptions({ title: "Editar Plano" })
    } else {
      navigation.setOptions({ title: "Novo Plano" })
    }
  }, [route.params?.plan])

  const loadClientsAndServices = async () => {
    try {
      const [{ data: clientsData }, { data: servicesData }] = await Promise.all([
        supabase.from("clients").select("id, name").eq("gardener_id", user?.id).order("name"),
        supabase.from("services").select("id, name").eq("gardener_id", user?.id).order("name")
      ])
      
      setClients(clientsData || [])
      setServices(servicesData || [])
    } catch (error) {
      console.error("Erro ao carregar clientes e serviços:", error)
    } finally {
      setIsLoading(false)
    }
  }

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
    
    if (isNaN(Number(formData.materials_markup_pct)) || Number(formData.materials_markup_pct) < 0) {
      newErrors.materials_markup_pct = "Markup deve ser um número positivo"
    }
    
    if (isNaN(Number(formData.window_days)) || Number(formData.window_days) < 1) {
      newErrors.window_days = "Janela deve ser pelo menos 1 dia"
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
      const payload = {
        gardener_id: user?.id,
        title: formData.title.trim(),
        client_id: formData.client_id,
        service_id: formData.service_id || null,
        default_description: formData.default_description.trim() || null,
        default_labor_cost: Number(formData.default_labor_cost),
        materials_markup_pct: Number(formData.materials_markup_pct),
        preferred_weekday: formData.preferred_weekday ? Number(formData.preferred_weekday) : null,
        preferred_week_of_month: formData.preferred_week_of_month ? Number(formData.preferred_week_of_month) : null,
        window_days: Number(formData.window_days),
        billing_day: formData.billing_day ? Number(formData.billing_day) : null,
        status: formData.status
      }
      
      if (isEditing && route.params?.plan) {
        const { error } = await supabase
          .from("maintenance_plans")
          .update(payload)
          .eq("id", route.params.plan.id)
        
        if (error) throw error
        
        Alert.alert("Sucesso", "Plano atualizado com sucesso!")
      } else {
        const { error } = await supabase
          .from("maintenance_plans")
          .insert(payload)
        
        if (error) throw error
        
        Alert.alert("Sucesso", "Plano criado com sucesso!")
      }
      
      navigation.goBack()
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao salvar plano")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Carregando...</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Card style={styles.formCard}>
        <Input
          label="Título *"
          value={formData.title}
          onChangeText={(text) => setFormData({ ...formData, title: text })}
          placeholder="Ex.: Manutenção mensal jardim da Ana"
          error={errors.title}
          required
        />
        
        <Select
          label="Cliente *"
          value={formData.client_id}
          onValueChange={(value) => setFormData({ ...formData, client_id: value })}
          options={clients.map(client => ({ label: client.name, value: client.id }))}
          error={errors.client_id}
          required
        />
        
        <Select
          label="Serviço (opcional)"
          value={formData.service_id}
          onValueChange={(value) => setFormData({ ...formData, service_id: value })}
          options={[{ label: "Nenhum", value: "" }, ...services.map(service => ({ label: service.name, value: service.id }))]}
        />
        
        <View style={styles.row}>
          <View style={styles.column}>
            <Input
              label="Mão de obra padrão (R$)"
              value={formData.default_labor_cost}
              onChangeText={(text) => setFormData({ ...formData, default_labor_cost: text })}
              placeholder="0.00"
              keyboardType="numeric"
              error={errors.default_labor_cost}
            />
          </View>
          <View style={styles.column}>
            <Input
              label="Markup materiais (%)"
              value={formData.materials_markup_pct}
              onChangeText={(text) => setFormData({ ...formData, materials_markup_pct: text })}
              placeholder="0"
              keyboardType="numeric"
              error={errors.materials_markup_pct}
            />
          </View>
        </View>
        
        <View style={styles.row}>
          <View style={styles.column}>
            <Select
              label="Dia preferido da semana"
              value={formData.preferred_weekday}
              onValueChange={(value) => setFormData({ ...formData, preferred_weekday: value })}
              options={weekdayOptions}
            />
          </View>
          <View style={styles.column}>
            <Select
              label="Semana do mês"
              value={formData.preferred_week_of_month}
              onValueChange={(value) => setFormData({ ...formData, preferred_week_of_month: value })}
              options={weekOfMonthOptions}
            />
          </View>
        </View>
        
        <View style={styles.row}>
          <View style={styles.column}>
            <Input
              label="Janela (dias)"
              value={formData.window_days}
              onChangeText={(text) => setFormData({ ...formData, window_days: text })}
              placeholder="7"
              keyboardType="numeric"
              error={errors.window_days}
            />
          </View>
          <View style={styles.column}>
            <Input
              label="Dia de cobrança"
              value={formData.billing_day}
              onChangeText={(text) => setFormData({ ...formData, billing_day: text })}
              placeholder="1-31"
              keyboardType="numeric"
              error={errors.billing_day}
            />
          </View>
        </View>
        
        <Select
          label="Status"
          value={formData.status}
          onValueChange={(value) => setFormData({ ...formData, status: value as "active" | "paused" })}
          options={statusOptions}
        />
        
        <TextArea
          label="Descrição padrão"
          value={formData.default_description}
          onChangeText={(text) => setFormData({ ...formData, default_description: text })}
          placeholder="Descrição padrão do serviço"
          numberOfLines={5}
        />
      </Card>
      
      <View style={styles.buttonContainer}>
        <Button
          variant="outline"
          onPress={() => navigation.goBack()}
          disabled={isSubmitting}
          style={styles.button}
        >
          Cancelar
        </Button>
        <Button
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={styles.button}
        >
          {isSubmitting ? "Salvando..." : (isEditing ? "Atualizar" : "Criar")}
        </Button>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 16
  },
  formCard: {
    marginBottom: 16,
    padding: 16
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8
  },
  column: {
    flex: 1
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8
  },
  button: {
    flex: 1
  }
})