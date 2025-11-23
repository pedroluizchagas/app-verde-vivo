import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native"
import { Input, TextArea, Select, DateInput } from "../components/Form"
import { Button } from "../components/Button"
import { Card, CardContent } from "../components/Card"
import { useAuth } from "../contexts/AuthContext"
import { supabase } from "../supabase"
import { Ionicons } from "@expo/vector-icons"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { NotificationService } from "../services/notificationService"
import { useTheme } from "../contexts/ThemeContext"
import type { ThemeColors } from "../theme"
import { useSafeAreaInsets } from "react-native-safe-area-context"

interface AppointmentFormProps {
  navigation: any
  appointment?: {
    id: string
    client_id: string
    service_date?: string
    scheduled_date?: string
    start_time?: string
    end_time?: string
    status: "scheduled" | "confirmed" | "completed" | "cancelled"
    description?: string
    address?: string
    price?: number
  }
  onSave?: () => void
}

interface Client {
  id: string
  name: string
}

export function AppointmentForm({ navigation, appointment, onSave }: AppointmentFormProps) {
  const { user } = useAuth()
  const { colors } = useTheme()
  const styles = createStyles(colors)
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [formData, setFormData] = useState({
    title: appointment?.id ? (appointment as any).title || "" : "",
    client_id: appointment?.client_id || "",
    service_date: appointment?.service_date
      ? new Date(appointment.service_date)
      : appointment?.scheduled_date
      ? new Date(appointment.scheduled_date)
      : new Date(),
    start_time: appointment?.start_time
      ? appointment.start_time
      : appointment?.scheduled_date
      ? new Date(appointment.scheduled_date).toISOString().slice(11, 16)
      : "09:00",
    end_time: appointment?.end_time
      ? appointment.end_time
      : appointment?.scheduled_date
      ? (() => {
          const d = new Date(appointment.scheduled_date as string)
          const e = new Date(d.getTime() + 60 * 60 * 1000)
          return e.toISOString().slice(11, 16)
        })()
      : "10:00",
    status: appointment?.status || "scheduled",
    description: appointment?.description || "",
    address: appointment?.address || "",
    price: appointment?.price ? String(appointment.price) : "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadClients()
  }, [])

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

    if (!formData.title.trim()) {
      newErrors.title = "Título é obrigatório"
    }

    if (!formData.client_id) {
      newErrors.client_id = "Cliente é obrigatório"
    }

    if (!formData.start_time) {
      newErrors.start_time = "Horário de início é obrigatório"
    }

    if (!formData.end_time) {
      newErrors.end_time = "Horário de término é obrigatório"
    }

    if (formData.price && isNaN(Number(formData.price))) {
      newErrors.price = "Preço deve ser um número válido"
    }

    // Validate time order
    if (formData.start_time && formData.end_time) {
      const start = new Date(`2000-01-01T${formData.start_time}`)
      const end = new Date(`2000-01-01T${formData.end_time}`)
      if (end <= start) {
        newErrors.end_time = "Horário de término deve ser após o início"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm() || !user) return

    try {
      setLoading(true)

      const scheduledDate = new Date(
        `${format(formData.service_date, "yyyy-MM-dd")}T${formData.start_time}:00`
      )

      const start = new Date(`2000-01-01T${formData.start_time}`)
      const end = new Date(`2000-01-01T${formData.end_time}`)
      const duration = Math.max(Math.round((end.getTime() - start.getTime()) / 60000), 0) || 60

      const appointmentData = {
        gardener_id: user.id,
        title: formData.title.trim(),
        client_id: formData.client_id,
        scheduled_date: scheduledDate.toISOString(),
        status: formData.status,
        description: formData.description.trim() || null,
        duration_minutes: duration,
      }

      let created: { id: string } | null = null
      if (appointment) {
        // Update existing appointment
        const { error } = await supabase
          .from("appointments")
          .update(appointmentData)
          .eq("id", appointment.id)

        if (error) throw error

        Alert.alert("Sucesso", "Agendamento atualizado com sucesso!")
      } else {
        const { data: inserted, error } = await supabase
          .from("appointments")
          .insert(appointmentData)
          .select('id')
          .single()

        if (error) throw error
        created = inserted ? { id: String(inserted.id) } : null
        Alert.alert("Sucesso", "Agendamento criado com sucesso!")
      }

      const clientName = clients.find(c => c.id === formData.client_id)?.name || "Cliente"
      
      // Schedule notification for appointment reminder (30 minutes before)
      if (formData.status === "scheduled" || formData.status === "confirmed") {
        const insertedId = (appointment && appointment.id) || created?.id
        if (insertedId) {
          const remAppt = {
            id: insertedId,
            title: formData.title,
            scheduled_date: scheduledDate.toISOString(),
            client: { name: clientName }
          }
          await NotificationService.scheduleAppointmentReminder(remAppt, 30)
        }
      }

      if (onSave) {
        onSave()
      } else {
        navigation.goBack()
      }
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao salvar agendamento")
    } finally {
      setLoading(false)
    }
  }

  const statusOptions = [
    { label: "Agendado", value: "scheduled" },
    { label: "Confirmado", value: "confirmed" },
    { label: "Concluído", value: "completed" },
    { label: "Cancelado", value: "cancelled" },
  ]

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }] }>
        <Text style={styles.title}>
          {appointment ? "Editar Agendamento" : "Novo Agendamento"}
        </Text>
      </View>
      <View style={styles.thinDivider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Detalhes do agendamento</Text>
        <Card style={styles.cardDark}>
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
              options={clients.map(client => ({ label: client.name, value: client.id }))}
              error={errors.client_id}
              required
            />
          </CardContent>
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data e horário</Text>
        <Card style={styles.cardDark}>
          <CardContent>
            <DateInput
              label="Data do serviço"
              value={formData.service_date}
              onValueChange={(date) => setFormData({ ...formData, service_date: date })}
              error={errors.service_date}
              required
            />
            <View style={styles.timeRow}>
              <View style={styles.timeInput}>
                <Input
                  label="Horário início"
                  value={formData.start_time}
                  onChangeText={(text) => setFormData({ ...formData, start_time: text })}
                  placeholder="09:00"
                  error={errors.start_time}
                  required
                />
              </View>
              <View style={styles.timeInput}>
                <Input
                  label="Horário término"
                  value={formData.end_time}
                  onChangeText={(text) => setFormData({ ...formData, end_time: text })}
                  placeholder="10:00"
                  error={errors.end_time}
                  required
                />
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status e valor</Text>
        <Card style={styles.cardDark}>
          <CardContent>
            <Select
              label="Status"
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value as "scheduled" | "confirmed" | "completed" | "cancelled" })}
              options={statusOptions}
              columns={2}
              error={errors.status}
            />
            <Input
              label="Preço (R$)"
              value={formData.price}
              onChangeText={(text) => setFormData({ ...formData, price: text })}
              placeholder="0,00"
              keyboardType="numeric"
              error={errors.price}
            />
          </CardContent>
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Local e observações</Text>
        <Card style={styles.cardDark}>
          <CardContent>
            <Input
              label="Endereço"
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              placeholder="Endereço do serviço (se diferente do cliente)"
            />
            <TextArea
              label="Observações"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Observações sobre o serviço"
            />
          </CardContent>
        </Card>
      </View>

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
          {appointment ? "Atualizar" : "Criar"}
        </Button>
      </View>
    </ScrollView>
  )
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  header: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: c.headerBg },
  thinDivider: { height: 1, backgroundColor: c.divider },
  title: { fontSize: 20, fontWeight: "700", color: c.textPrimary },
  section: { paddingHorizontal: 20, marginBottom: 24, marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: c.textPrimary, marginBottom: 12 },
  cardDark: { backgroundColor: c.surface, borderColor: c.surface, borderWidth: 0 },
  timeRow: { flexDirection: "row", columnGap: 12 },
  timeInput: { flex: 1 },
  actions: { flexDirection: "row", columnGap: 12, paddingHorizontal: 20, paddingVertical: 16 },
  button: { flex: 1 },
})