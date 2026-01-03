import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Modal, Switch, useWindowDimensions } from "react-native"
import { Input, TextArea, DateInput } from "../components/Form"
import { Button } from "../components/Button"
import { Card, CardHeader, CardTitle, CardContent } from "../components/Card"
import { useAuth } from "../contexts/AuthContext"
import { supabase } from "../supabase"
import { Ionicons } from "@expo/vector-icons"
import { format } from "date-fns"
import { NotificationService } from "../services/notificationService"
import { useTheme } from "../contexts/ThemeContext"
import type { ThemeColors } from "../theme"
import { useSafeAreaInsets } from "react-native-safe-area-context"

interface AppointmentFormProps {
  navigation: any
  route?: any
  appointment?: {
    id?: string
    client_id?: string
    service_date?: string
    scheduled_date?: string
    start_time?: string
    end_time?: string
    status?: "scheduled" | "confirmed" | "completed" | "cancelled"
    description?: string
    address?: string
    price?: number
    title?: string
  }
  onSave?: () => void
}

interface Client {
  id: string
  name: string
}

export function AppointmentForm({ navigation, appointment, onSave, route }: AppointmentFormProps) {
  const { user } = useAuth()
  const { colors } = useTheme()
  const styles = createStyles(colors)
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [orders, setOrders] = useState<{ id: string; title: string }[]>([])
  const [selectedOrder, setSelectedOrder] = useState<string>("")
  const prefill = route?.params?.appointment as any | undefined
  const a = prefill || appointment
  const [formData, setFormData] = useState({
    title: a?.title ? String(a.title) : "",
    client_id: a?.client_id || "",
    service_date: a?.service_date
      ? new Date(a.service_date)
      : a?.scheduled_date
      ? new Date(a.scheduled_date)
      : new Date(),
    start_time: a?.start_time
      ? a.start_time
      : a?.scheduled_date
      ? new Date(a.scheduled_date).toISOString().slice(11, 16)
      : "09:00",
    end_time: a?.end_time
      ? a.end_time
      : a?.scheduled_date
      ? (() => {
          const d = new Date(a.scheduled_date as string)
          const e = new Date(d.getTime() + 60 * 60 * 1000)
          return e.toISOString().slice(11, 16)
        })()
      : "10:00",
    status: a?.status || "scheduled",
    description: a?.description || "",
    type: (a as any)?.type ? String((a as any)?.type) : "service",
    location: (a as any)?.location ? String((a as any)?.location) : "",
    all_day: Boolean((a as any)?.all_day) || false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadClients()
    loadOrders()
  }, [])

  useEffect(() => {
    const id = a?.id as string | undefined
    const hasType = typeof (a as any)?.type !== 'undefined'
    const hasLocation = typeof (a as any)?.location !== 'undefined'
    const hasAllDay = typeof (a as any)?.all_day !== 'undefined'
    if (user && id && (!hasType || !hasLocation || !hasAllDay)) {
      ;(async () => {
        try {
          const { data } = await supabase
            .from("appointments")
            .select("type, location, all_day")
            .eq("id", id)
            .maybeSingle()
          if (data) {
            setFormData((fd) => ({
              ...fd,
              type: typeof (data as any)?.type !== 'undefined' ? String((data as any)?.type || 'service') : fd.type,
              location: typeof (data as any)?.location !== 'undefined' ? String((data as any)?.location || '') : fd.location,
              all_day: typeof (data as any)?.all_day !== 'undefined' ? Boolean((data as any)?.all_day) : fd.all_day,
            }))
          }
          const { data: order } = await supabase
            .from("service_orders")
            .select("id")
            .eq("appointment_id", id)
            .maybeSingle()
          if (order?.id) setSelectedOrder(String(order.id))
        } catch {}
      })()
    }
  }, [a?.id, user])

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

  const loadOrders = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from("service_orders")
        .select("id, title")
        .eq("gardener_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100)
      if (error) throw error
      const rows = (data || []).map((o: any) => ({ id: String(o.id), title: String(o.title || "OS") }))
      setOrders(rows)
    } catch (err) {
      console.error("Error loading orders:", err)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = "Título é obrigatório"
    }

    if (!formData.all_day) {
      if (!formData.start_time) {
        newErrors.start_time = "Horário de início é obrigatório"
      }
      if (!formData.end_time) {
        newErrors.end_time = "Horário de término é obrigatório"
      }
    }

    // Validate time order
    if (!formData.all_day && formData.start_time && formData.end_time) {
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

      const parseHM = (s: string) => {
        const m = String(s).match(/(\d{1,2}):(\d{2})/)
        if (!m) return null
        const h = Math.max(0, Math.min(23, Number(m[1])))
        const min = Math.max(0, Math.min(59, Number(m[2])))
        return { h, min }
      }

      const y = Number(format(formData.service_date, "yyyy"))
      const mo = Number(format(formData.service_date, "MM")) - 1
      const d = Number(format(formData.service_date, "dd"))
      const st = parseHM(formData.start_time)
      const et = parseHM(formData.end_time)
      const scheduledDate = formData.all_day
        ? new Date(Date.UTC(y, mo, d, 0, 0))
        : st
        ? new Date(Date.UTC(y, mo, d, st.h, st.min))
        : new Date(Date.UTC(y, mo, d, 9, 0))
      const endDate = formData.all_day
        ? new Date(Date.UTC(y, mo, d, 23, 59))
        : et
        ? new Date(Date.UTC(y, mo, d, et.h, et.min))
        : new Date(Date.UTC(y, mo, d, (st ? st.h : 9) + 1, st ? st.min : 0))
      const duration = formData.all_day ? 0 : Math.max(Math.round((endDate.getTime() - scheduledDate.getTime()) / 60000), 0) || 60

      const appointmentData = {
        gardener_id: user.id,
        title: formData.title.trim(),
        client_id: formData.client_id || null,
        scheduled_date: scheduledDate.toISOString(),
        end_date: endDate.toISOString(),
        status: formData.status,
        description: formData.description.trim() || null,
        duration_minutes: duration,
        type: formData.type,
        location: formData.location || null,
        all_day: formData.all_day,
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

      const insertedId = (appointment && appointment.id) || created?.id
      if (selectedOrder && insertedId) {
        try {
          await supabase.from("service_orders").update({ appointment_id: insertedId }).eq("id", selectedOrder)
        } catch (e) {
          console.error("Error linking service order:", e)
        }
      }

      const clientName = clients.find(c => c.id === formData.client_id)?.name || "Cliente"
      
      // Schedule notification for appointment reminder (30 minutes before)
      if (formData.status === "scheduled" || formData.status === "confirmed") {
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
    { label: "Em andamento", value: "in_progress" },
    { label: "Concluído", value: "completed" },
    { label: "Cancelado", value: "cancelled" },
  ]

  const typeOptions = [
    { label: "Serviço", value: "service" },
    { label: "Visita técnica", value: "technical_visit" },
    { label: "Treinamento", value: "training" },
    { label: "Reunião", value: "meeting" },
    { label: "Outro", value: "other" },
  ]

  useEffect(() => {
    const planId = route?.params?.planId as string | undefined
    const titleFromQuery = route?.params?.title as string | undefined
    const dateFromQuery = route?.params?.date as string | undefined
    const startFromQuery = route?.params?.start as string | undefined
    const endFromQuery = route?.params?.end as string | undefined
    const allDayFromQuery = route?.params?.allDay as boolean | undefined
    if (titleFromQuery) {
      setFormData((fd) => ({ ...fd, title: titleFromQuery }))
    }
    if (dateFromQuery) {
      const d = new Date(dateFromQuery)
      if (!isNaN(d.getTime())) {
        setFormData((fd) => ({ ...fd, service_date: d }))
      }
    }
    if (typeof allDayFromQuery !== 'undefined') {
      setFormData((fd) => ({ ...fd, all_day: Boolean(allDayFromQuery) }))
    }
    if (startFromQuery) {
      setFormData((fd) => ({ ...fd, start_time: startFromQuery }))
    }
    if (endFromQuery) {
      setFormData((fd) => ({ ...fd, end_time: endFromQuery }))
    }
    if (planId && user) {
      ;(async () => {
        try {
          const { data: plan } = await supabase
            .from("maintenance_plans")
            .select("client_id, client:clients(id, address)")
            .eq("id", planId)
            .maybeSingle()
          const cid = Array.isArray((plan as any)?.client)
            ? ((plan as any)?.client[0]?.id ?? (plan as any)?.client_id ?? "")
            : ((plan as any)?.client_id ?? (plan as any)?.client?.id ?? "")
          const addr = Array.isArray((plan as any)?.client)
            ? ((plan as any)?.client[0]?.address ?? "")
            : ((plan as any)?.client?.address ?? "")
          setFormData((fd) => ({ ...fd, client_id: cid ? String(cid) : fd.client_id, location: addr ? String(addr) : fd.location }))
        } catch {}
      })()
    }
  }, [route?.params, user])

  

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }] }>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon} accessibilityRole="button" accessibilityLabel="Voltar">
          <Ionicons name="chevron-back" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {appointment ? "Editar agendamento" : "Novo agendamento"}
        </Text>
        <View style={styles.headerIcon} />
      </View>
      <View style={styles.divider} />

      

      <View style={styles.section}>
        <Card>
          <CardHeader>
            <CardTitle>Detalhes do agendamento</CardTitle>
          </CardHeader>
          <CardContent>
            <Dropdown
              label="Tipo"
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
              options={typeOptions}
              required
            />
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
              options={clients.map(client => ({ label: client.name, value: client.id }))}
            />
            <Dropdown
              label="Ordem de serviço"
              value={selectedOrder}
              onValueChange={(value) => setSelectedOrder(value)}
              options={[{ label: "Sem OS", value: "" }, ...orders.map(o => ({ label: o.title, value: o.id }))]}
            />
          </CardContent>
        </Card>
      </View>

      <View style={styles.section}>
        <Card>
          <CardHeader>
            <CardTitle>Data e horário</CardTitle>
          </CardHeader>
          <CardContent>
            <DateInput
              label="Data do serviço"
              value={formData.service_date}
              onValueChange={(date) => setFormData({ ...formData, service_date: date })}
              error={errors.service_date}
              required
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>Dia inteiro</Text>
              <Switch value={formData.all_day} onValueChange={(v) => setFormData({ ...formData, all_day: v })} />
            </View>
            <View style={styles.timeRow}>
              <View style={styles.timeInput}>
                <Input
                  label="Horário início"
                  value={formData.start_time}
                  onChangeText={(text) => setFormData({ ...formData, start_time: text })}
                  placeholder="09:00"
                  error={errors.start_time}
                  required={!formData.all_day}
                  editable={!formData.all_day}
                />
              </View>
              <View style={styles.timeInput}>
                <Input
                  label="Horário término"
                  value={formData.end_time}
                  onChangeText={(text) => setFormData({ ...formData, end_time: text })}
                  placeholder="10:00"
                  error={errors.end_time}
                  required={!formData.all_day}
                  editable={!formData.all_day}
                />
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      <View style={styles.section}>
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Dropdown
              label="Status"
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value as "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled" })}
              options={statusOptions}
            />
          </CardContent>
        </Card>
      </View>

      <View style={styles.section}>
        <Card>
          <CardHeader>
            <CardTitle>Local e observações</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              label="Local"
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
              placeholder={formData.client_id ? "Endereço do cliente (padrão)" : "Local do compromisso"}
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
          {appointment ? "Atualizar agendamento" : "Salvar agendamento"}
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
  title: { fontSize: 20, fontWeight: "700", color: c.textPrimary },
  section: { paddingHorizontal: 16, marginBottom: 24, marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: c.textPrimary, marginBottom: 12 },
  timeRow: { flexDirection: "row", columnGap: 12 },
  timeInput: { flex: 1 },
  nextRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nextDateBig: { fontSize: 16, fontWeight: '700', color: c.textPrimary },
  nextChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: c.surfaceAlt, borderColor: c.border, borderWidth: 1 },
  nextChipText: { fontSize: 12, color: c.textSecondary },
  actions: { flexDirection: "row", columnGap: 12, paddingHorizontal: 16, paddingVertical: 16 },
  button: { flex: 1 },
  buttonPrimary: { borderRadius: 24 },
  buttonOutline: { borderRadius: 24 },
})

function Dropdown({ label, value, onValueChange, options, required }: { label: string; value: string; onValueChange: (v: string) => void; options: { label: string; value: string }[]; required?: boolean }) {
  const { mode, colors } = useTheme()
  const insets = useSafeAreaInsets()
  const { height: windowHeight } = useWindowDimensions()
  const isDark = mode === "dark"
  const [open, setOpen] = useState(false)
  const currentLabel = options.find((o) => o.value === value)?.label || "Selecione"
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={[{ fontSize: 14, fontWeight: "600", color: isDark ? "#f9fafb" : "#374151", marginBottom: 8 }] }>
        {label}
        {required && <Text style={{ color: "#EF4444" }}> *</Text>}
      </Text>
      <TouchableOpacity onPress={() => setOpen(true)} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: isDark ? "#374151" : "#D1D5DB", borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: isDark ? "#2a2f36" : "#FFFFFF" }}>
        <Text style={{ fontSize: 16, color: isDark ? "#f9fafb" : "#111827" }}>{currentLabel}</Text>
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.surfaceAlt, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: insets.bottom + 16, maxHeight: windowHeight * 0.9 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary }}>{label}</Text>
              <TouchableOpacity onPress={() => setOpen(false)} style={{ padding: 4 }}>
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
