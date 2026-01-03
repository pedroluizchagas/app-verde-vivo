import { useState, useEffect, useCallback } from "react"
import { View, Text, StyleSheet, ScrollView, Alert, RefreshControl, TouchableOpacity } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { supabase } from "../supabase"
import { useAuth } from "../contexts/AuthContext"
import { Card } from "../components/Card"
import { Button } from "../components/Button"
import { SearchBar } from "../components/SearchBar"
import Ionicons from "@expo/vector-icons/Ionicons"
import { useTheme } from "../contexts/ThemeContext"
import type { ThemeColors } from "../theme"
import { format } from "date-fns"
import { useSafeAreaInsets } from "react-native-safe-area-context"

type RootStackParamList = {
  Maintenance: undefined
  MaintenancePlanForm: { plan?: MaintenancePlan } | undefined
  MaintenanceDetail: { planId: string } | undefined
}

type MaintenanceNavigationProp = NativeStackNavigationProp<RootStackParamList, "Maintenance">

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
  status: "active" | "paused"
  default_labor_cost: number
  materials_markup_pct: number
  client_id: string
  service_id: string | null
  created_at: string
  updated_at: string
  default_description?: string | null
  preferred_weekday?: number | null
  preferred_week_of_month?: number | null
  client: Client
  service: Service | null
}

interface MaintenancePlanComputed extends MaintenancePlan {
  last_done_date?: string | null
  next_date?: string | null
  overdue?: boolean
  sun_label?: string
  water_label?: string
}

export function MaintenanceScreen() {
  const navigation = useNavigation<MaintenanceNavigationProp>()
  const { user, loading: authLoading } = useAuth()
  const { colors } = useTheme()
  const styles = createStyles(colors)
  const insets = useSafeAreaInsets()
  
  const [plans, setPlans] = useState<MaintenancePlanComputed[]>([])
  const [filteredPlans, setFilteredPlans] = useState<MaintenancePlanComputed[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  const loadPlans = async () => {
    try {
      if (!user) {
        setPlans([])
        setFilteredPlans([])
        setIsLoading(false)
        setRefreshing(false)
        return
      }
      let data: any[] | null = null
      {
        const res = await supabase
          .from("maintenance_plans")
          .select(`
            *,
            client:clients(id, name, address, avatar_url),
            service:services(id, name)
          `)
          .eq("gardener_id", user.id)
          .order("created_at", { ascending: false })
        if (res.error) {
          const fallback = await supabase
            .from("maintenance_plans")
            .select(`
              *,
              client:clients(id, name, address),
              service:services(id, name)
            `)
            .eq("gardener_id", user.id)
            .order("created_at", { ascending: false })
          data = fallback.data || []
        } else {
          data = res.data || []
        }
      }

      const baseRows: MaintenancePlan[] = (data || []).map((p: any) => ({
        ...p,
        client: Array.isArray(p.client) ? p.client[0] : p.client,
        service: Array.isArray(p.service) ? p.service[0] : p.service,
      }))

      const ids = baseRows.map((p) => p.id)
      let latestByPlan: Record<string, string> = {}
      let tmplByPlan: Record<string, any> = {}
      if (ids.length > 0) {
        const { data: execs } = await supabase
          .from("plan_executions")
          .select("plan_id, status, created_at")
          .in("plan_id", ids)
          .eq("status", "done")
          .order("created_at", { ascending: false })
        for (const e of execs || []) {
          const pid = String((e as any).plan_id)
          if (!latestByPlan[pid]) latestByPlan[pid] = String((e as any).created_at)
        }
        const { data: tmpls } = await supabase
          .from("plan_executions")
          .select("plan_id, details, cycle")
          .in("plan_id", ids)
          .eq("cycle", "template")
        for (const t of tmpls || []) {
          tmplByPlan[String((t as any).plan_id)] = (t as any).details || {}
        }
      }

      const computePreferredDate = (plan: MaintenancePlan) => {
        const now = new Date()
        const year = now.getFullYear()
        const month = now.getMonth()
        const weekday = typeof plan?.preferred_weekday === "number" ? (plan as any).preferred_weekday : 1
        const weekOfMonth = typeof plan?.preferred_week_of_month === "number" ? (plan as any).preferred_week_of_month : 1
        const firstOfMonth = new Date(year, month, 1)
        const firstDow = firstOfMonth.getDay()
        const offsetToWeekday = (weekday - firstDow + 7) % 7
        const day = 1 + offsetToWeekday + (weekOfMonth - 1) * 7
        return new Date(year, month, day)
      }

      const rows: MaintenancePlanComputed[] = baseRows.map((p) => {
        const desc = String(p.default_description || "")
        const sun = /sol\s*pleno/i.test(desc) ? "Sol Pleno" : /meia\s*sombra/i.test(desc) ? "Meia Sombra" : undefined
        const waterMatch = desc.match(/rega\s*(\d+)x/i)
        const water = waterMatch ? `Rega ${waterMatch[1]}x` : undefined
        const last = latestByPlan[p.id] ? new Date(latestByPlan[p.id]) : null
        const daysSince = last ? Math.floor((Date.now() - last.getTime()) / (1000 * 60 * 60 * 24)) : null
        const overdue = typeof daysSince === "number" ? daysSince > 25 : true
        const schedule = (tmplByPlan[p.id]?.schedule) || null
        const months: number[] = Array.isArray(schedule?.fertilization_months) ? schedule.fertilization_months : []
        const base = computePreferredDate(p)
        const now = new Date()
        const cur = now.getMonth() + 1
        const nextMonth = months.length > 0 ? (months.find((m: number) => m >= cur) ?? months[0]) : null
        const nextDate = nextMonth ? new Date(nextMonth < cur ? now.getFullYear() + 1 : now.getFullYear(), nextMonth - 1, base.getDate()) : base
        return {
          ...p,
          last_done_date: last ? last.toISOString() : null,
          next_date: nextDate ? nextDate.toISOString() : null,
          overdue,
          sun_label: sun,
          water_label: water,
        }
      })

      setPlans(rows)
      setFilteredPlans(rows)
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao carregar planos")
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (!authLoading) {
      loadPlans()
    }
  }, [user, authLoading])

  useEffect(() => {
    const filtered = plans.filter(plan =>
      plan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (plan.service && plan.service.name.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    setFilteredPlans(filtered)
  }, [searchQuery, plans])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadPlans()
  }, [])

  const handleEditPlan = (plan: MaintenancePlanComputed) => {
    navigation.navigate("MaintenancePlanForm", { plan })
  }

  const handleDeletePlan = async (plan: MaintenancePlanComputed) => {
    Alert.alert(
      "Confirmar exclusão",
      `Deseja realmente excluir o plano "${plan.title}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("maintenance_plans")
                .delete()
                .eq("id", plan.id)

              if (error) throw error

              setPlans(prev => prev.filter(p => p.id !== plan.id))
              Alert.alert("Sucesso", "Plano excluído com sucesso!")
            } catch (error: any) {
              Alert.alert("Erro", error.message || "Erro ao excluir plano")
            }
          }
        }
      ]
    )
  }

  const handleToggleStatus = async (plan: MaintenancePlanComputed) => {
    const newStatus = plan.status === "active" ? "paused" : "active"
    
    try {
      const { error } = await supabase
        .from("maintenance_plans")
        .update({ status: newStatus })
        .eq("id", plan.id)

      if (error) throw error

      setPlans(prev => prev.map(p => 
        p.id === plan.id ? { ...p, status: newStatus } : p
      ))
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao alterar status")
    }
  }

  const formatCurrency = (value: number) => {
    return `R$ ${Number(value).toFixed(2)}`
  }

  const getStatusColor = (status: string) => {
    return status === "active" ? "#059669" : "#6b7280"
  }

  const getStatusLabel = (status: string) => {
    return status === "active" ? "Ativo" : "Pausado"
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }] }>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon} accessibilityRole="button" accessibilityLabel="Voltar">
          <Ionicons name="chevron-back" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Clientes Plano Mensal</Text>
        <TouchableOpacity onPress={() => navigation.navigate("MaintenancePlanForm")} style={styles.headerIcon} accessibilityRole="button" accessibilityLabel="Adicionar cliente mensal">
          <Ionicons name="add" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <View style={styles.sectionDivider} />


      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredPlans.length > 0 ? (
          <View style={styles.plansList}>
            {filteredPlans.map((plan) => (
              <TouchableOpacity key={plan.id} onPress={() => navigation.navigate("MaintenanceDetail", { planId: plan.id })} activeOpacity={0.7}>
                <View style={styles.planCard}>
                  <View style={styles.cardRow}>
                    
                    <View style={styles.cardContent}>
                      <View style={styles.cardHeaderRow}>
                        <Text style={styles.planTitle}>{plan.title}</Text>
                        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                      </View>
                      <View style={styles.infoRow}>
                        {plan.sun_label && (
                          <View style={styles.infoChip}>
                            <Ionicons name="sunny-outline" size={14} color={colors.textSecondary} />
                            <Text style={styles.infoText}>{plan.sun_label}</Text>
                          </View>
                        )}
                        {plan.water_label && (
                          <View style={styles.infoChip}>
                            <Ionicons name="water-outline" size={14} color={colors.textSecondary} />
                            <Text style={styles.infoText}>{plan.water_label}</Text>
                          </View>
                        )}
                      </View>
                      {plan.overdue ? (
                        <View style={styles.alertRow}>
                          <Ionicons name="warning" size={14} color={colors.warning} />
                          <Text style={styles.alertText}>Manutenção Atrasada</Text>
                        </View>
                      ) : (
                        <View style={styles.nextRow}>
                          <Ionicons name="calendar" size={14} color={colors.success} />
                          <Text style={styles.nextText}>Próxima manutenção:</Text>
                          <Text style={styles.nextDate}>{plan.next_date ? format(new Date(plan.next_date), "dd/MM") : "—"}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>
              {searchQuery ? "Nenhum plano encontrado" : "Nenhum plano cadastrado"}
            </Text>
            {!searchQuery && (
              <Text style={styles.emptySubtext}>
                Crie planos de manutenção para automatizar seus serviços recorrentes
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  )
}
const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12 },
  headerIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "700", color: c.textPrimary },
  subtitle: { fontSize: 14, color: c.textSecondary },
  sectionDivider: { height: 1, backgroundColor: c.divider },
  searchBar: { marginHorizontal: 16, marginBottom: 8 },
  scrollView: { flex: 1 },
  plansList: { padding: 16, paddingTop: 8 },
  planCard: { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  thumbnail: { width: 64, height: 64, borderRadius: 12, overflow: "hidden", backgroundColor: c.bg },
  thumbnailImg: { width: 64, height: 64, resizeMode: "cover" },
  cardContent: { flex: 1 },
  cardHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  planTitle: { fontSize: 18, fontWeight: "700", color: c.textPrimary },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 6 },
  infoChip: { flexDirection: "row", alignItems: "center", gap: 6 },
  infoText: { fontSize: 13, color: c.textSecondary },
  alertRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  alertText: { fontSize: 13, color: c.warning, fontWeight: "600" },
  nextRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  nextText: { fontSize: 13, color: c.textSecondary },
  nextDate: { fontSize: 13, color: c.textPrimary, fontWeight: "600" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 48, marginTop: 32 },
  emptyText: { fontSize: 16, color: c.textSecondary, marginTop: 16, marginBottom: 8, textAlign: "center" },
  emptySubtext: { fontSize: 14, color: c.muted, textAlign: "center", lineHeight: 20 },
})
