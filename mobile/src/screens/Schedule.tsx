import { useEffect, useState, useCallback } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { supabase } from "../supabase"
import { Calendar } from "../components/Calendar"
import { Card, CardContent } from "../components/Card"
import { Button } from "../components/Button"
import { SearchBar } from "../components/SearchBar"
import { Ionicons } from "@expo/vector-icons"
import { format, parseISO, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useTheme } from "../contexts/ThemeContext"
import type { ThemeColors } from "../theme"
import { useFocusEffect } from "@react-navigation/native"

interface Appointment {
  id: string
  title: string
  scheduled_date: string
  end_date?: string
  status: string
  client: {
    id: string
    name: string
    phone?: string
  }
  service?: {
    id: string
    name: string
  }
  description?: string
  duration_minutes?: number
}

export function ScheduleScreen({ navigation }: any) {
  const insets = useSafeAreaInsets()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [monthDate, setMonthDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const { colors } = useTheme()
  const styles = createStyles(colors)
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)

  

  useFocusEffect(
    useCallback(() => {
      loadAppointments()
      return () => {}
    }, [])
  )

  useEffect(() => {
    filterAppointments()
  }, [searchQuery, statusFilter, appointments])

  const loadAppointments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id, 
          title, 
          scheduled_date, 
          end_date,
          status, 
          description,
          duration_minutes,
          client:clients(id, name, phone),
          service:services(id, name)
        `)
        .eq("gardener_id", user.id)
        .order("scheduled_date", { ascending: true })

      if (error) throw error
      const rows = (data || []).map((a: any) => ({
        id: String(a.id),
        title: String(a.title || ''),
        scheduled_date: String(a.scheduled_date),
        end_date: a.end_date ? String(a.end_date) : undefined,
        status: String(a.status),
        description: a.description ? String(a.description) : undefined,
        duration_minutes: typeof a.duration_minutes === 'number' ? a.duration_minutes : undefined,
        client: Array.isArray(a.client) ? a.client[0] : a.client,
        service: Array.isArray(a.service) ? a.service[0] : a.service,
      }))
      setAppointments(rows)
      setFilteredAppointments(rows)
    } catch (error: any) {
      Alert.alert('Erro', 'Erro ao carregar agendamentos: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const filterAppointments = () => {
    let filtered = appointments

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(appointment =>
        appointment.title.toLowerCase().includes(query) ||
        appointment.client?.name.toLowerCase().includes(query) ||
        appointment.service?.name.toLowerCase().includes(query) ||
        (appointment.description && appointment.description.toLowerCase().includes(query))
      )
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(appointment => appointment.status === statusFilter)
    }

    setFilteredAppointments(filtered)
  }

  const getAppointmentsForDate = (date: Date) => {
    return filteredAppointments.filter(appointment => 
      isSameDay(parseISO(appointment.scheduled_date), date)
    )
  }

  const getAppointmentsByDate = () => {
    const appointmentsByDate: { [key: string]: Appointment[] } = {}
    filteredAppointments.forEach(appointment => {
      const dateKey = format(parseISO(appointment.scheduled_date), 'yyyy-MM-dd')
      if (!appointmentsByDate[dateKey]) {
        appointmentsByDate[dateKey] = []
      }
      appointmentsByDate[dateKey].push(appointment)
    })
    return appointmentsByDate
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return '#3b82f6'
      case 'confirmed': return '#16a34a'
      case 'completed': return '#6b7280'
      case 'cancelled': return '#dc2626'
      default: return '#6b7280'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Agendado'
      case 'confirmed': return 'Confirmado'
      case 'completed': return 'Concluído'
      case 'cancelled': return 'Cancelado'
      default: return status
    }
  }

  const openOptions = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setMenuOpen(true)
  }

  const editSelectedAppointment = () => {
    if (!selectedAppointment) return
    const a = selectedAppointment
    const startTime = a.scheduled_date?.slice(11, 16)
    const duration = (a as any).duration_minutes ?? 60
    const start = a.scheduled_date ? new Date(a.scheduled_date) : new Date()
    const endIso = a.end_date
      ? a.end_date
      : new Date(start.getTime() + duration * 60 * 1000).toISOString()
    const payload: any = {
      id: a.id,
      title: a.title,
      client_id: String((a as any)?.client?.id || ''),
      scheduled_date: a.scheduled_date,
      start_time: startTime || '09:00',
      end_time: endIso.slice(11, 16),
      status: a.status,
      description: a.description || '',
    }
    setMenuOpen(false)
    setSelectedAppointment(null)
    ;(navigation as any).navigate('AppointmentForm', { appointment: payload })
  }

  const deleteSelectedAppointment = async () => {
    if (!selectedAppointment) return
    const toDelete = selectedAppointment
    Alert.alert('Excluir agendamento', 'Deseja realmente excluir este agendamento?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('appointments').delete().eq('id', toDelete.id)
            if (error) throw error
            await loadAppointments()
            Alert.alert('Sucesso', 'Agendamento excluído')
          } catch (err: any) {
            Alert.alert('Erro', err?.message || 'Falha ao excluir agendamento')
          } finally {
            setMenuOpen(false)
            setSelectedAppointment(null)
          }
        },
      },
    ])
  }

  const dailyAppointments = getAppointmentsForDate(selectedDate)
  const appointmentsByDate = getAppointmentsByDate()

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.title}>Agenda</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AppointmentForm')} style={styles.headerIcon}>
            <Ionicons name="add" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.thinDivider} />
        <View style={styles.loadingContainer}>
          <Text>Carregando agenda...</Text>
        </View>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Agenda</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AppointmentForm')} style={styles.headerIcon}>
          <Ionicons name="add" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
      <View style={styles.thinDivider} />

      {/* Calendar Card */}
      <View style={styles.calendarCard}>
        <View style={styles.calendarHeaderRow}>
          <TouchableOpacity onPress={() => { const d = new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1); setMonthDate(d); setSelectedDate(d) }}>
            <Ionicons name="chevron-back" size={18} color="#9ca3af" />
          </TouchableOpacity>
          <Text style={styles.calendarHeaderTitle}>
            {(() => { const s = format(monthDate, "LLLL yyyy", { locale: ptBR }); return s.charAt(0).toUpperCase() + s.slice(1) })()}
          </Text>
          <TouchableOpacity onPress={() => { const d = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1); setMonthDate(d); setSelectedDate(d) }}>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>
        <View style={{ marginTop: 0 }}>
          <Calendar month={monthDate} showHeader={false} selectedDate={selectedDate} onDateSelect={(d: Date) => { setSelectedDate(d); setMonthDate(d) }} events={appointmentsByDate} />
        </View>
      </View>

      {/* Próximos agendamentos */}
      <View style={styles.upcomingSection}>
        <Text style={styles.sectionTitle}>Próximos agendamentos</Text>
        <View style={styles.appointmentsList}>
          {filteredAppointments
            .filter(a => parseISO(a.scheduled_date) > new Date())
            .slice(0, 10)
            .map((appointment) => {
              const dt = parseISO(appointment.scheduled_date)
              const monthShort = format(dt, 'LLL', { locale: ptBR }).toUpperCase()
              const dayNum = format(dt, 'dd')
              const start = format(dt, 'HH:mm')
              const duration = (appointment as any).duration_minutes ?? 120
              const endDt = appointment.end_date ? parseISO(appointment.end_date) : new Date(dt.getTime() + duration * 60 * 1000)
              const end = format(endDt, 'HH:mm')
              return (
                <View key={appointment.id} style={styles.upcomingCard}>
                  <View style={styles.upcomingLeft}>
                    <Text style={styles.upcomingMonth}>{monthShort}</Text>
                    <Text style={styles.upcomingDay}>{dayNum}</Text>
                  </View>
                  <View style={styles.upcomingSeparator} />
                  <View style={styles.upcomingContent}>
                    <View style={styles.upcomingHeaderRow}>
                      <Text style={styles.upcomingTitle}>{appointment.title}</Text>
                    </View>
                    <Text style={styles.upcomingClient}>Cliente: {appointment.client?.name || '---'}</Text>
                    <Text style={styles.upcomingTime}>{start} - {end}</Text>
                  </View>
                  <TouchableOpacity style={styles.optionsButtonFloating} onPress={() => openOptions(appointment)}>
                    <Ionicons name="ellipsis-vertical" size={20} color="#9ca3af" />
                  </TouchableOpacity>
                  </View>
              )
            })}
        </View>
      </View>

      <View style={{ height: 40 }} />
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.surfaceAlt, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary }}>Ações do agendamento</Text>
              <TouchableOpacity onPress={() => setMenuOpen(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={{ height: 1, backgroundColor: colors.divider }} />
            <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
              <View style={{ backgroundColor: colors.surface, borderRadius: 12, paddingVertical: 8 }}>
                <TouchableOpacity onPress={editSelectedAppointment} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 8 }}>
                    <Ionicons name="create-outline" size={18} color={colors.textSecondary} />
                    <Text style={{ color: colors.textPrimary, fontSize: 16 }}>Editar</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={deleteSelectedAppointment} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 8 }}>
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                    <Text style={{ color: colors.danger, fontSize: 16 }}>Apagar</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 0, paddingBottom: 12, backgroundColor: c.headerBg },
  headerIcon: { padding: 6 },
  thinDivider: { height: 1, backgroundColor: c.divider },
  title: { fontSize: 24, fontWeight: '700', color: c.textPrimary },
  calendarCard: { marginTop: 24, marginHorizontal: 20, backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, paddingTop: 18, paddingBottom: 8, paddingHorizontal: 16, alignItems: 'center' },
  calendarHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, alignSelf: 'stretch' },
  calendarHeaderTitle: { fontSize: 16, fontWeight: '600', color: c.textPrimary, flex: 1, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: c.textPrimary, marginTop: 24, marginBottom: 12, paddingHorizontal: 20 },
  appointmentsList: { paddingHorizontal: 20, gap: 14, paddingTop: 8 },
  upcomingSection: { marginTop: 24 },
  upcomingCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 14, position: 'relative' },
  upcomingLeft: { width: 64, alignItems: 'center', justifyContent: 'center' },
  upcomingMonth: { fontSize: 12, fontWeight: '700', color: c.link },
  upcomingDay: { fontSize: 20, fontWeight: '700', color: c.textPrimary },
  upcomingSeparator: { width: 2, height: '72%', backgroundColor: c.link, borderRadius: 1, marginHorizontal: 14 },
  upcomingContent: { flex: 1, paddingRight: 44 },
  upcomingHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optionsButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  optionsButtonFloating: { position: 'absolute', right: 12, top: '50%', marginTop: -16, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  upcomingTitle: { fontSize: 16, fontWeight: '600', color: c.textPrimary, lineHeight: 20 },
  upcomingClient: { fontSize: 14, color: c.textSecondary, marginTop: 6 },
  upcomingTime: { fontSize: 12, color: c.textSecondary, marginTop: 6 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 32 },
})
