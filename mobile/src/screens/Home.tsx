import { useEffect, useState } from "react"
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Image, Modal, Switch } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import Svg, { Circle } from "react-native-svg"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { supabase } from "../supabase"
import { Card } from "../components/Card"
import { Button } from "../components/Button"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { NotificationService } from "../services/notificationService"
import { useTheme } from "../contexts/ThemeContext"
import type { ThemeColors } from "../theme"

interface DashboardStats {
  clients: number
  appointments: number
  budgets: number
  todayServices: number
  totalRevenue: number
  currentBalance: number
  monthIncome: number
  monthExpense: number
  yearIncome: number
  yearExpense: number
  completedThisMonth: number
  productivityPercentage: number
  activeClients: Array<{
    id: string
    name: string
    phone: string | null
    lastService: string
  }>
  todayAppointments: Array<{
    id: string
    scheduled_date: string
    status: string
    client_name: string
  }>
  upcomingAppointments: Array<{
    id: string
    scheduled_date: string
    status: string
    client_name: string
  }>
  pendingBudgets: Array<{
    id: string
    title: string
    total_amount: number
    status: string
    client_name: string
  }>
  profile: { full_name: string; avatar_url?: string | null } | null
  approvedMonthBudgets: number
  totalMonthBudgets: number
}

interface KPICardProps {
  title: string
  value: string | number
  onPress?: () => void
}

function KPICard({ title, value, onPress }: KPICardProps) {
  const { colors } = useTheme()
  const s = StyleSheet.create({
    kpiCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      borderWidth: 0,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 3,
    },
    kpiTitle: { fontSize: 14, color: colors.textSecondary, fontWeight: '500', marginBottom: 8 },
    kpiValue: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  })
  return (
    <TouchableOpacity onPress={onPress} style={s.kpiCard}>
      <Text style={s.kpiTitle}>{title}</Text>
      <Text style={s.kpiValue}>{value}</Text>
    </TouchableOpacity>
  )
}

interface FinanceCompareCardProps {
  title: string
  incomeLabel: string
  incomeAmount: number
  expenseLabel: string
  expenseAmount: number
}

function FinanceCompareCard({ title, incomeLabel, incomeAmount, expenseLabel, expenseAmount }: FinanceCompareCardProps) {
  const { colors } = useTheme()
  const s = StyleSheet.create({
    container: { padding: 2 },
    title: { fontSize: 14, color: colors.textPrimary, fontWeight: '600', marginBottom: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
    label: { fontSize: 13, color: colors.textSecondary },
    amount: { fontSize: 13, color: colors.textPrimary, fontWeight: '600' },
    barBg: { height: 8, backgroundColor: colors.border, borderRadius: 4, marginTop: 6 },
    barGreen: { height: '100%', backgroundColor: colors.success, borderRadius: 4 },
    barRed: { height: '100%', backgroundColor: colors.danger, borderRadius: 4 },
  })
  const total = Math.max(incomeAmount, expenseAmount)
  const incomePct = total > 0 ? Math.round((incomeAmount / total) * 100) : 0
  const expensePct = total > 0 ? Math.round((expenseAmount / total) * 100) : 0
  return (
    <View style={s.container}>
      <Text style={s.title}>{title}</Text>
      <View style={s.row}>
        <Text style={s.label}>{incomeLabel}</Text>
        <Text style={s.amount}>R$ {incomeAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
      </View>
      <View style={s.barBg}>
        <View style={[s.barGreen, { width: `${incomePct}%` }]} />
      </View>
      <View style={s.row}>
        <Text style={s.label}>{expenseLabel}</Text>
        <Text style={s.amount}>R$ {expenseAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
      </View>
      <View style={s.barBg}>
        <View style={[s.barRed, { width: `${expensePct}%` }]} />
      </View>
    </View>
  )
}

interface CircularProgressProps {
  percentage: number
  size: number
  strokeWidth: number
  color: string
}

function CircularProgress({ percentage, size, strokeWidth, color }: CircularProgressProps) {
  const { colors } = useTheme()
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = `${circumference} ${circumference}`
  const strokeDashoffset = circumference - (percentage / 100) * circumference
  const s = StyleSheet.create({
    textWrap: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
    pct: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
    label: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  })

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#374151"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[s.textWrap, { width: size, height: size }]}>
        <Text style={s.pct}>{percentage}%</Text>
        <Text style={s.label}>Produtividade</Text>
      </View>
    </View>
  )
}

export function HomeScreen() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<any>()
  const [settingsVisible, setSettingsVisible] = useState(false)
  const [notificationsVisible, setNotificationsVisible] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const { mode: themeMode, setMode, colors } = useTheme()
  const styles = createStyles(colors)
  const [language, setLanguage] = useState<'pt-BR' | 'en-US'>('pt-BR')
  const [notifications, setNotifications] = useState<Array<{ id: string; type: string; title: string; subtitle?: string; icon: string; color: string; date?: string }>>([])

  useEffect(() => {
    loadDashboardData()
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      const notif = await AsyncStorage.getItem('pref_notifications')
      const lang = await AsyncStorage.getItem('pref_language')
      if (notif !== null) setNotificationsEnabled(notif === 'true')
      if (lang === 'en-US' || lang === 'pt-BR') setLanguage(lang)
    } catch {}
  }

  const toggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value)
    try { await AsyncStorage.setItem('pref_notifications', String(value)) } catch {}
  }

  const changeTheme = async (mode: 'light' | 'dark') => {
    await setMode(mode)
  }

  const changeLanguage = async (lang: 'pt-BR' | 'en-US') => {
    setLanguage(lang)
    try { await AsyncStorage.setItem('pref_language', lang) } catch {}
  }

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Buscar estatísticas básicas
      const { count: clientsCount } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true })
        .eq("gardener_id", user.id)

      const { count: appointmentsCount } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("gardener_id", user.id)
        .eq("status", "scheduled")

      const { count: budgetsCount } = await supabase
        .from("budgets")
        .select("*", { count: "exact", head: true })
        .eq("gardener_id", user.id)
        .eq("status", "pending")

      // Serviços do dia
      const dayStart = new Date()
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date()
      dayEnd.setHours(23, 59, 59, 999)

      const { count: todayServices } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("gardener_id", user.id)
        .gte("scheduled_date", dayStart.toISOString())
        .lte("scheduled_date", dayEnd.toISOString())

      // Receita total
      const { data: allPaidIncome } = await supabase
        .from("financial_transactions")
        .select("amount, type, status")
        .eq("gardener_id", user.id)
        .eq("status", "paid")
        .eq("type", "income")

      const totalRevenue = (allPaidIncome || []).reduce((s, t) => s + Number(t.amount), 0)

      // Saldo atual
      const { data: paidTx } = await supabase
        .from("financial_transactions")
        .select("amount, type, status")
        .eq("gardener_id", user.id)
        .eq("status", "paid")

      const currentBalance = (paidTx || []).reduce((sum, t) => sum + (t.type === "income" ? Number(t.amount) : -Number(t.amount)), 0)

      // Financeiro mensal
      const now = new Date()
      const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      const iso = (d: Date) => d.toISOString().slice(0, 10)

      const { data: monthTx } = await supabase
        .from("financial_transactions")
        .select("amount, type, status, transaction_date")
        .eq("gardener_id", user.id)
        .gte("transaction_date", iso(startMonth))
        .lte("transaction_date", iso(endMonth))

      const monthIncome = (monthTx || []).filter((t) => t.type === "income" && t.status === "paid").reduce((s, t) => s + Number(t.amount), 0)
      const monthExpense = (monthTx || []).filter((t) => t.type === "expense" && t.status === "paid").reduce((s, t) => s + Number(t.amount), 0)

      // Financeiro anual
      const startYear = new Date(now.getFullYear(), 0, 1)
      const endYear = new Date(now.getFullYear(), 11, 31)
      const { data: yearTx } = await supabase
        .from("financial_transactions")
        .select("amount, type, status, transaction_date")
        .eq("gardener_id", user.id)
        .gte("transaction_date", iso(startYear))
        .lte("transaction_date", iso(endYear))
      const yearIncome = (yearTx || []).filter((t) => t.type === "income" && t.status === "paid").reduce((s, t) => s + Number(t.amount), 0)
      const yearExpense = (yearTx || []).filter((t) => t.type === "expense" && t.status === "paid").reduce((s, t) => s + Number(t.amount), 0)

      // Produtividade
      const { count: completedThisMonth } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("gardener_id", user.id)
        .eq("status", "completed")
        .gte("scheduled_date", startMonth.toISOString())
        .lte("scheduled_date", endMonth.toISOString())

      // Calcular porcentagem de produtividade (baseado em 20 serviços/mês como meta)
      const productivityPercentage = Math.min(Math.round((completedThisMonth || 0) / 20 * 100), 100)

      // Próximos agendamentos
      const { data: upcomingAppointmentsRaw } = await supabase
        .from("appointments")
        .select("id, scheduled_date, status, client:clients(name)")
        .eq("gardener_id", user.id)
        .gt("scheduled_date", dayEnd.toISOString())
        .order("scheduled_date", { ascending: true })
        .limit(5)
      const upcomingAppointments = (upcomingAppointmentsRaw || []).map((a: any) => ({
        id: String(a.id),
        scheduled_date: String(a.scheduled_date),
        status: String(a.status),
        client_name: Array.isArray(a.client) ? (a.client[0]?.name ?? '') : (a.client?.name ?? '')
      }))

      // Orçamentos pendentes
      const { data: pendingBudgetsRaw } = await supabase
        .from("budgets")
        .select("id, title, total_amount, status, client:clients(name)")
        .eq("gardener_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5)
      const pendingBudgets = (pendingBudgetsRaw || []).map((b: any) => ({
        id: String(b.id),
        title: String(b.title),
        total_amount: Number(b.total_amount ?? 0),
        status: String(b.status),
        client_name: Array.isArray(b.client) ? (b.client[0]?.name ?? '') : (b.client?.name ?? '')
      }))

      // Estimativas aprovadas
      const { data: monthBudgets } = await supabase
        .from("budgets")
        .select("id, status, created_at")
        .eq("gardener_id", user.id)
        .gte("created_at", startMonth.toISOString())
        .lte("created_at", endMonth.toISOString())
      const totalMonthBudgets = (monthBudgets || []).length
      const approvedMonthBudgets = (monthBudgets || []).filter((b) => b.status === "approved").length

      // Perfil
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      // Process avatar URL if stored as storage path (bucket/path or just path)
      const rawAvatar: any = profileRow ? (profileRow.avatar_url ?? profileRow.avatar ?? profileRow.photo_url ?? profileRow.image_url ?? null) : null
      let processedAvatar: string | null = rawAvatar ?? null
      if (processedAvatar) {
        if (processedAvatar.startsWith("http") || processedAvatar.startsWith("data:")) {
          // use as-is (public URL or base64)
        } else {
          let bucket = "avatars"
          let path = processedAvatar
          if (processedAvatar.includes("/object/public/")) {
            const afterPublic = processedAvatar.split("/object/public/")[1]
            if (afterPublic) {
              const segs = afterPublic.split("/")
              bucket = segs[0]
              path = segs.slice(1).join("/")
            }
          } else {
            const parts = processedAvatar.split("/")
            if (parts.length > 1) {
              bucket = parts[0]
              path = parts.slice(1).join("/")
            }
          }
          const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(path)
          processedAvatar = publicUrlData?.publicUrl || processedAvatar
        }
      }

      setStats({
        clients: clientsCount || 0,
        appointments: appointmentsCount || 0,
        budgets: budgetsCount || 0,
        todayServices: todayServices || 0,
        totalRevenue,
        currentBalance,
        monthIncome,
        monthExpense,
        yearIncome,
        yearExpense,
        completedThisMonth: completedThisMonth || 0,
        productivityPercentage,
        activeClients: [],
        todayAppointments: [],
        upcomingAppointments,
        pendingBudgets,
        profile: profileRow ? { full_name: profileRow.full_name, avatar_url: processedAvatar } : null,
        approvedMonthBudgets,
        totalMonthBudgets,
      })
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const openNotifications = async () => {
    setNotificationsVisible(true)
    await loadUserNotifications()
  }

  const loadUserNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const now = new Date()
      const todayStart = new Date(now)
      todayStart.setHours(0,0,0,0)
      const twoDaysAhead = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)

      const { data: appts } = await supabase
        .from("appointments")
        .select("id, title, scheduled_date, status, client:clients(name)")
        .eq("gardener_id", user.id)
        .eq("status", "scheduled")
        .gte("scheduled_date", todayStart.toISOString())
        .lte("scheduled_date", twoDaysAhead.toISOString())

      const apptNotifs = (appts || []).map((a: any) => ({
        id: String(a.id),
        type: "appointment",
        title: "Lembrete de agendamento",
        subtitle: `${a.title || "Serviço"} — ${Array.isArray(a.client) ? (a.client[0]?.name ?? "Cliente") : (a.client?.name ?? "Cliente")}`,
        icon: "calendar-outline",
        color: "#22c55e",
        date: new Date(String(a.scheduled_date)).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
      }))

      const { data: tasks } = await supabase
        .from("tasks")
        .select("id, title, status, due_date")
        .eq("gardener_id", user.id)
        .eq("status", "open")

      const taskNotifs = (tasks || [])
        .filter((t: any) => t.due_date)
        .filter((t: any) => {
          const d = new Date(String(t.due_date))
          return d <= new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
        })
        .map((t: any) => ({
          id: String(t.id),
          type: "task",
          title: "Lembrete de tarefa",
          subtitle: String(t.title || "Tarefa"),
          icon: "checkmark-circle-outline",
          color: "#f59e0b",
          date: t.due_date ? new Date(String(t.due_date)).toLocaleDateString('pt-BR') : undefined
        }))

      const { data: products } = await supabase
        .from("products")
        .select("id, name, min_stock")
        .eq("gardener_id", user.id)

      const productIds = (products || []).map((p: any) => p.id)
      let stockByProduct: Record<string, number> = {}
      if (productIds.length > 0) {
        const { data: allMovements } = await supabase
          .from("product_movements")
          .select("product_id, type, quantity")
          .eq("gardener_id", user.id)
          .in("product_id", productIds)
        ;(allMovements || []).forEach((m: any) => {
          stockByProduct[m.product_id] = stockByProduct[m.product_id] || 0
          stockByProduct[m.product_id] += String(m.type) === "in" ? Number(m.quantity) : -Number(m.quantity)
        })
      }

      const stockNotifs = (products || [])
        .map((p: any) => {
          const s = stockByProduct[p.id] || 0
          if (s <= 0) {
            return {
              id: `stock_${p.id}`,
              type: "stock",
              title: "Sem estoque",
              subtitle: String(p.name),
              icon: "cube",
              color: "#ef4444",
            }
          }
          if (s < Number(p.min_stock)) {
            return {
              id: `stock_${p.id}`,
              type: "stock",
              title: "Estoque baixo",
              subtitle: `${String(p.name)} — ${s}`,
              icon: "warning",
              color: "#f59e0b",
            }
          }
          return null
        })
        .filter(Boolean) as any[]

      const scheduled = await NotificationService.getScheduledNotifications()
      const deviceNotifs = (scheduled || []).map((n: any) => ({
        id: String(n.identifier || Date.now()),
        type: "device",
        title: String(n.content?.title || "Notificação"),
        subtitle: String(n.content?.body || ""),
        icon: "notifications-outline",
        color: "#22c55e",
      }))

      const all = [...apptNotifs, ...taskNotifs, ...stockNotifs, ...deviceNotifs]
      setNotifications(all)
    } catch (e) {
      setNotifications([])
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Carregando dashboard...</Text>
      </View>
    )
  }

  if (!stats) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Erro ao carregar dados</Text>
        <Button onPress={loadDashboardData}>Tentar novamente</Button>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: 16 + insets.top }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate("Perfil") }>
            {stats.profile?.avatar_url ? (
              <Image
                source={{ uri: stats.profile.avatar_url as string }}
                style={{ width: 40, height: 40, borderRadius: 20 }}
              />
            ) : (
              <Ionicons name="person" size={24} color="#9ca3af" />
            )}
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Olá, {stats.profile?.full_name || "Pedro"}</Text>
            <Text style={styles.headerSubtitle}>Bem-vindo à Íris</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon} onPress={openNotifications}>
            <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon} onPress={() => setSettingsVisible(true)}>
            <Ionicons name="settings-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.thinDivider} />
      {/* Resumo geral */}
      <View style={styles.sectionHeaderRow}>
        <Ionicons name="trending-up" size={16} color="#22c55e" />
        <Text style={styles.sectionHeaderTitle}>Resumo geral</Text>
      </View>
      <View style={styles.kpiGrid}>
        <View style={styles.kpiRow}>
          <KPICard title="Clientes" value={stats.clients} />
          <KPICard title="Agenda" value={stats.appointments} />
        </View>
        <View style={styles.kpiRow}>
          <KPICard title="Orçamentos" value={stats.budgets} />
          <KPICard title="Serviços do dia" value={stats.todayServices} />
        </View>
      </View>

      {/* Financeiro mensal */}
      <View style={styles.section}>
        <Card style={styles.cardDark}>
          <FinanceCompareCard
            title="Financeiro mensal (receitas vs despesas)"
            incomeLabel="Receitas"
            incomeAmount={stats.monthIncome}
            expenseLabel="Despesas"
            expenseAmount={stats.monthExpense}
          />
        </Card>
      </View>

      {/* Financeiro anual */}
      <View style={styles.section}>
        <Card style={styles.cardDark}>
          <FinanceCompareCard
            title="Financeiro anual (receitas vs despesas)"
            incomeLabel="Receitas"
            incomeAmount={stats.yearIncome}
            expenseLabel="Despesas"
            expenseAmount={stats.yearExpense}
          />
        </Card>
      </View>

      {/* Productivity */}
      <View style={styles.section}>
        <Card style={styles.cardDark}>
          <View style={styles.productivityContent}>
            <CircularProgress
              percentage={stats.productivityPercentage}
              size={120}
              strokeWidth={8}
              color="#10b981"
            />
            <View style={styles.productivityInfo}>
              <Text style={styles.productivityTitle}>Produtividade (mês)</Text>
              <Text style={styles.productivityValue}>{stats.completedThisMonth}</Text>
              <Text style={styles.productivitySubtitle}>Estimativas aprovadas</Text>
              <View style={styles.barBackgroundSmall}>
                <View style={[styles.barFillGreen, { width: `${Math.round(((stats.approvedMonthBudgets || 0) / Math.max(stats.totalMonthBudgets || 1, 1)) * 100)}%` }]} />
              </View>
              <Text style={styles.productivitySubtitle}>
                {stats.approvedMonthBudgets || 0} de {stats.totalMonthBudgets || 0}
              </Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Próximos agendamentos */}
      <View style={styles.section}>
        <View style={styles.sectionRowWithLink}>
          <Text style={styles.sectionTitle}>Próximos agendamentos</Text>
          <TouchableOpacity>
            <Text style={styles.linkText}>Ver todos</Text>
          </TouchableOpacity>
        </View>
        <Card style={styles.cardDark}>
          {stats.upcomingAppointments.length === 0 ? (
            <View style={{ paddingVertical: 12 }}>
              <Text style={styles.listItemSubtitle}>Nenhum agendamento</Text>
            </View>
          ) : (
            stats.upcomingAppointments.map((appointment) => (
              <View key={appointment.id} style={styles.listItem}>
                <View style={styles.listItemContent}>
                  <Ionicons name="calendar-outline" size={20} color="#9ca3af" />
                  <View style={styles.listItemInfo}>
                    <Text style={styles.listItemTitle}>{appointment.client_name || '(Sem cliente)'}</Text>
                    <Text style={styles.listItemSubtitle}>
                      {new Date(appointment.scheduled_date).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity>
                  <Text style={styles.linkText}>Detalhes</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </Card>
      </View>

      {/* Pending Budgets */}
      {stats.pendingBudgets.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionRowWithLink}>
            <Text style={styles.sectionTitle}>Orçamentos pendentes</Text>
            <TouchableOpacity>
              <Text style={styles.linkText}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          <Card style={styles.cardDark}>
            {stats.pendingBudgets.map((budget) => (
              <View key={budget.id} style={styles.listItem}>
                <View style={styles.listItemContent}>
                  <Ionicons name="document-text-outline" size={20} color="#9ca3af" />
                  <View style={styles.listItemInfo}>
                    <Text style={styles.listItemTitle}>{budget.title}</Text>
                    <Text style={styles.listItemSubtitle}>
                      {budget.client_name || '(Sem cliente)'}
                    </Text>
                  </View>
                </View>
                <View style={styles.listItemRight}>
                  <Text style={styles.budgetValue}>R$ {budget.total_amount.toLocaleString('pt-BR')}</Text>
                  <TouchableOpacity>
                    <Text style={styles.linkText}>Detalhes</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </Card>
        </View>
      )}

      <View style={{ height: 100 }} />

      {/* Settings Popup */}
      <Modal visible={settingsVisible} transparent animationType="fade" onRequestClose={() => setSettingsVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.settingsSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Configurações</Text>
              <TouchableOpacity style={styles.sheetClose} onPress={() => setSettingsVisible(false)}>
                <Ionicons name="close" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.sheetDivider} />

            <View style={styles.sheetSection}>
              <Text style={styles.sheetSectionTitle}>Configurações do app</Text>
              <View style={styles.sheetCard}>
                <View style={styles.sheetItem}>
                  <View style={styles.sheetItemLeft}>
                    <Ionicons name="notifications-outline" size={20} color="#9ca3af" />
                    <Text style={styles.sheetItemTitle}>Notificações</Text>
                  </View>
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={toggleNotifications}
                    trackColor={{ false: '#374151', true: '#16a34a' }}
                    thumbColor={notificationsEnabled ? '#ffffff' : '#9ca3af'}
                  />
                </View>

                <View style={styles.sheetItem}>
                  <View style={styles.sheetItemLeft}>
                    <Ionicons name="color-palette-outline" size={20} color="#9ca3af" />
                    <Text style={styles.sheetItemTitle}>Tema</Text>
                  </View>
                  <View style={styles.themeToggleContainer}>
                    <TouchableOpacity
                      style={[styles.themeToggleButton, themeMode === 'light' && styles.themeToggleSelected]}
                      onPress={() => changeTheme('light')}
                    >
                      <Ionicons name="sunny-outline" size={16} color={themeMode === 'light' ? colors.textPrimary : colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.themeToggleButton, themeMode === 'dark' && styles.themeToggleSelected]}
                      onPress={() => changeTheme('dark')}
                    >
                      <Ionicons name="moon-outline" size={16} color={themeMode === 'dark' ? colors.textPrimary : colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity style={[styles.sheetItem, styles.sheetLink]} onPress={() => changeLanguage(language === 'pt-BR' ? 'en-US' : 'pt-BR')}>
                  <View style={styles.sheetItemLeft}>
                    <Ionicons name="globe-outline" size={20} color="#9ca3af" />
                    <Text style={styles.sheetItemTitle}>Idioma</Text>
                  </View>
                  <View style={styles.sheetItemRight}>
                    <Text style={styles.sheetItemRightText}>{language === 'pt-BR' ? 'Português' : 'English'}</Text>
                    <Ionicons name="chevron-forward-outline" size={18} color="#9ca3af" />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Notifications Popup */}
      <Modal visible={notificationsVisible} transparent animationType="fade" onRequestClose={() => setNotificationsVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.settingsSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Notificações</Text>
              <TouchableOpacity style={styles.sheetClose} onPress={() => setNotificationsVisible(false)}>
                <Ionicons name="close" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.sheetDivider} />

            <View style={styles.sheetSection}>
              <View style={styles.sheetCard}>
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <View key={n.id} style={styles.sheetItem}>
                      <View style={styles.sheetItemLeft}>
                        <Ionicons name={n.icon as any} size={20} color={n.color} />
                        <View>
                          <Text style={styles.sheetItemTitle}>{n.title}</Text>
                          {Boolean(n.subtitle) && <Text style={styles.sheetItemRightText}>{n.subtitle}{n.date ? ` • ${n.date}` : ''}</Text>}
                        </View>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={{ paddingHorizontal: 16, paddingVertical: 20 }}>
                    <Text style={styles.sheetItemRightText}>Sem notificações</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: c.bg,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#9ca3af',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: c.headerBg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fcd5bd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: c.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
  },
  headerIcon: {
    marginLeft: 16,
  },
  kpiGrid: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    rowGap: 12,
  },
  kpiRow: {
    flexDirection: 'row',
    columnGap: 12,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: c.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  kpiTitle: {
    fontSize: 14,
    color: c.textSecondary,
    fontWeight: '500',
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '700',
    color: c.textPrimary,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 12,
  },
  thinDivider: {
    height: 1,
    backgroundColor: c.divider,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: c.textPrimary,
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: c.textPrimary,
    marginBottom: 12,
  },
  financialContainer: {
    padding: 2,
  },
  financialTitle: {
    fontSize: 14,
    color: c.textPrimary,
    fontWeight: '600',
    marginBottom: 12,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  financialLabel: {
    fontSize: 13,
    color: c.textSecondary,
  },
  financialAmount: {
    fontSize: 13,
    color: c.textPrimary,
    fontWeight: '600',
  },
  barBackground: {
    height: 8,
    backgroundColor: c.border,
    borderRadius: 4,
    marginTop: 6,
  },
  barBackgroundSmall: {
    height: 6,
    backgroundColor: c.border,
    borderRadius: 3,
    marginTop: 6,
  },
  barFillGreen: {
    height: '100%',
    backgroundColor: c.success,
    borderRadius: 4,
  },
  barFillRed: {
    height: '100%',
    backgroundColor: c.danger,
    borderRadius: 4,
  },
  productivityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  productivityInfo: {
    marginLeft: 24,
    flex: 1,
  },
  productivityTitle: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 4,
  },
  productivityValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#f9fafb',
    marginBottom: 4,
  },
  productivitySubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  circularProgressText: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularProgressPercentage: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f9fafb',
  },
  circularProgressLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  listItemInfo: {
    marginLeft: 12,
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: c.textPrimary,
  },
  listItemSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
  },
  listItemRight: {
    alignItems: 'flex-end',
  },
  budgetValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
    marginBottom: 4,
  },
  sectionRowWithLink: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  linkText: {
    color: c.link,
    fontSize: 13,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardDark: {
    backgroundColor: c.surface,
    borderColor: c.surface,
    borderWidth: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: c.overlay,
    justifyContent: 'flex-end',
  },
  settingsSheet: {
    backgroundColor: c.surfaceAlt,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: c.textPrimary,
  },
  sheetClose: {
    padding: 4,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: c.divider,
  },
  sheetSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sheetSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: c.textSecondary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  sheetCard: {
    backgroundColor: c.surface,
    borderRadius: 12,
    paddingVertical: 8,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  sheetLink: {
    borderBottomWidth: 0,
  },
  sheetItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sheetItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: c.textPrimary,
  },
  sheetItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sheetItemRightText: {
    fontSize: 14,
    color: c.textSecondary,
    marginRight: 4,
  },
  themeToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: c.bg,
    borderRadius: 20,
    padding: 4,
  },
  themeToggleButton: {
    width: 32,
    height: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  themeToggleSelected: {
    backgroundColor: c.success,
  },
})
