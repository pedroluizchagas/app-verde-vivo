import { useEffect, useMemo, useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Share, Modal } from "react-native"
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native"
import Ionicons from "@expo/vector-icons/Ionicons"
import { Card, CardContent } from "../components/Card"
import { Button } from "../components/Button"
import { supabase } from "../supabase"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTheme } from "../contexts/ThemeContext"
import type { ThemeColors } from "../theme"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

type RootStackParamList = {
  MaintenanceDetail: { planId: string }
}

type MaintenanceDetailRouteProp = RouteProp<RootStackParamList, "MaintenanceDetail">

export function MaintenanceDetailScreen() {
  const route = useRoute<MaintenanceDetailRouteProp>()
  const navigation = useNavigation<any>()
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()
  const styles = createStyles(colors)
  const planId = route.params?.planId
  const [plan, setPlan] = useState<any | null>(null)
  const [executions, setExecutions] = useState<any[]>([])
  const [templateDetails, setTemplateDetails] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        let p: any | null = null
        {
          const res = await supabase
            .from("maintenance_plans")
            .select("*, client:clients(id, name, address, phone, avatar_url), service:services(name)")
            .eq("gardener_id", user.id)
            .eq("id", planId)
            .maybeSingle()
          if ((res as any).error) {
            const fb = await supabase
              .from("maintenance_plans")
              .select("*, client:clients(id, name, address, phone), service:services(name)")
              .eq("gardener_id", user.id)
              .eq("id", planId)
              .maybeSingle()
            p = (fb as any).data || null
          } else {
            p = (res as any).data || null
          }
        }
        setPlan(p ? ({
          ...p,
          client: Array.isArray((p as any).client) ? ((p as any).client[0] ?? null) : (p as any).client,
          service: Array.isArray((p as any).service) ? ((p as any).service[0] ?? null) : (p as any).service,
        }) : null)
        const { data: execs } = await supabase
          .from("plan_executions")
          .select("id, cycle, status, final_amount, notes, details, created_at")
          .eq("plan_id", planId)
          .order("created_at", { ascending: false })
        setExecutions(execs || [])
        const { data: tmpl } = await supabase
          .from("plan_executions")
          .select("details, cycle")
          .eq("plan_id", planId)
          .eq("cycle", "template")
          .maybeSingle()
        setTemplateDetails((tmpl as any)?.details || null)
      } catch (e) {
      } finally {
        setLoading(false)
      }
    })()
  }, [planId])

  const computePreferredDate = (p: any) => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const weekday = typeof p?.preferred_weekday === "number" ? p.preferred_weekday : 1
    const weekOfMonth = typeof p?.preferred_week_of_month === "number" ? p.preferred_week_of_month : 1
    const firstOfMonth = new Date(year, month, 1)
    const firstDow = firstOfMonth.getDay()
    const offsetToWeekday = (weekday - firstDow + 7) % 7
    const day = 1 + offsetToWeekday + (weekOfMonth - 1) * 7
    return new Date(year, month, day)
  }

  const lastDone = useMemo(() => (executions || []).filter((e: any) => String(e.status) === "done")[0] || null, [executions])
  const lastDoneDate = lastDone ? new Date(String(lastDone.created_at)) : null
  const daysSince = lastDoneDate ? Math.floor((Date.now() - lastDoneDate.getTime()) / (1000 * 60 * 60 * 24)) : null
  const showAlert = typeof daysSince === "number" ? daysSince > 25 : true

  const nextMaintenanceDate = useMemo(() => {
    if (!plan) return null
    const schedule = (templateDetails || {}).schedule || null
    const months: number[] = Array.isArray(schedule?.fertilization_months) ? schedule.fertilization_months : []
    const base = computePreferredDate(plan)
    const now = new Date()
    const cur = now.getMonth() + 1
    const nextMonth = months.length > 0 ? (months.find((m: number) => m >= cur) ?? months[0]) : null
    if (!nextMonth) return base
    const year = nextMonth < cur ? now.getFullYear() + 1 : now.getFullYear()
    return new Date(year, nextMonth - 1, base.getDate())
  }, [plan, templateDetails])

  const daysUntil = useMemo(() => {
    if (!nextMaintenanceDate) return null
    const diff = Math.floor((nextMaintenanceDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return diff
  }, [nextMaintenanceDate])

  const parseDesc = (desc: string | null | undefined) => {
    const s = String(desc || "")
    const sun = /sol\s*pleno/i.test(s) ? "Sol Pleno" : /meia\s*sombra/i.test(s) ? "Meia Sombra" : null
    const m = s.match(/rega\s*(\d+)x/i)
    const water = m ? `Rega ${m[1]}x` : null
    return { sun, water }
  }

  const planNextAppointment = () => {
    if (!plan) return
    const d = nextMaintenanceDate || computePreferredDate(plan)
    const iso = d.toISOString()
    navigation.navigate("AppointmentForm", {
      appointment: {
        title: `Manutenção: ${String(plan.title)}`,
        client_id: String((plan as any)?.client?.id || plan.client_id),
        scheduled_date: iso,
        start_time: "09:00",
        end_time: "10:00",
        status: "scheduled",
        description: plan?.default_description || "",
        address: (plan as any)?.client?.address || "",
        price: Number(plan?.default_labor_cost || 0),
      }
    })
  }


  const editPlan = () => {
    if (!plan) return
    navigation.navigate("MaintenancePlanForm", { plan })
    setMenuOpen(false)
  }

  const deletePlan = async () => {
    Alert.alert("Excluir plano", "Deseja realmente excluir este plano?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: async () => {
        try {
          const { error } = await supabase.from("maintenance_plans").delete().eq("id", planId)
          if (error) throw error
          navigation.goBack()
        } catch (e: any) {
          Alert.alert("Erro", e?.message || "Falha ao excluir plano")
        } finally {
          setMenuOpen(false)
        }
      } },
    ])
  }

  const markSimpleControlDone = async (type: "fertilization" | "pests") => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Não autenticado")
      const now = new Date()
      const cyc = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
      const { data: exec } = await supabase
        .from("plan_executions")
        .select("id, details")
        .eq("plan_id", planId)
        .eq("cycle", cyc)
        .maybeSingle()
      const details = (exec as any)?.details || {}
      const list = Array.isArray(details?.[type]) ? details[type] : []
      const entry: any = type === "fertilization"
        ? { product: "Adubo", dose: "", area: "", date: now.toISOString().slice(0, 10) }
        : { type: "Praga", severity: "", treatment: "", date: now.toISOString().slice(0, 10) }
      const patch = { ...details, [type]: [...list, entry] }
      if (exec?.id) {
        const { error: uerr } = await supabase
          .from("plan_executions")
          .update({ details: patch })
          .eq("id", exec.id)
        if (uerr) throw uerr
      } else {
        const { error: ierr } = await supabase
          .from("plan_executions")
          .insert([{ plan_id: planId, cycle: cyc, status: "open", details: patch }])
        if (ierr) throw ierr
      }
      Alert.alert("Sucesso", "Marcado como feito")
    } catch (err: any) {
      Alert.alert("Erro", err?.message || "Falha ao marcar como feito")
    }
  }

  const shareCertificate = async () => {
    try {
      if (!lastDone || !plan) throw new Error("Sem execução para gerar comprovante")
      const title = `Comprovante de manutenção — ${String(plan.title)}`
      const summary = `Cliente: ${(plan as any)?.client?.name || ""}\nData: ${new Date(String(lastDone.created_at)).toLocaleDateString("pt-BR")}\nValor: R$ ${Number(lastDone.final_amount || 0).toFixed(2)}\nNotas: ${String(lastDone.notes || "")}`
      await Share.share({ message: `${title}\n\n${summary}` })
    } catch (e: any) {
      Alert.alert("Erro", e?.message || "Falha ao gerar comprovante")
    }
  }

  if (loading || !plan) {
    return (
      <View style={styles.container}><Text style={styles.loading}>Carregando...</Text></View>
    )
  }

  const { sun, water } = parseDesc(plan.default_description)

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + 16 }} showsVerticalScrollIndicator={false}>
      <View style={[styles.headerBar, { paddingTop: insets.top + 8 }] }>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}><Ionicons name="chevron-back" size={22} color={colors.textSecondary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes Manutenção Mensal</Text>
        <TouchableOpacity style={styles.headerIcon} onPress={() => setMenuOpen(true)}><Ionicons name="ellipsis-vertical" size={18} color={colors.textSecondary} /></TouchableOpacity>
      </View>
      <View style={styles.divider} />

      <Card style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>{String((plan as any)?.client?.name || "Cliente")}</Text>
            {((plan as any)?.client?.address) && <Text style={styles.infoSub}>{String((plan as any)?.client?.address)}</Text>}
            <View style={styles.badgesRow}>
              {sun && (<View style={styles.badgeChip}><Ionicons name="sunny-outline" size={14} color={colors.textSecondary} /><Text style={styles.badgeText}>{sun}</Text></View>)}
              {water && (<View style={styles.badgeChip}><Ionicons name="water-outline" size={14} color={colors.textSecondary} /><Text style={styles.badgeText}>{water}</Text></View>)}
            </View>
          </View>
        </View>
      </Card>

      {showAlert && (
        <Card style={styles.alertCard}>
          <CardContent>
            <View style={styles.alertRow}>
              <Ionicons name="warning" size={18} color={colors.warning} />
              <View>
                <Text style={styles.alertTitle}>Alerta de Manutenção</Text>
                <Text style={styles.alertText}>{daysSince ? `Mais de ${daysSince} dias sem manutenção.` : "Nunca executado."}</Text>
              </View>
            </View>
          </CardContent>
        </Card>
      )}

      <Card style={styles.sectionCard}>
        <CardContent>
          <Text style={styles.sectionTitle}>Próxima Manutenção</Text>
          <View style={styles.nextRow}>
            <Text style={styles.nextDateBig}>{nextMaintenanceDate ? format(nextMaintenanceDate, "dd 'de' LLLL 'de' yyyy", { locale: ptBR }) : "—"}</Text>
            {typeof daysUntil === "number" && (
              <View style={styles.nextChip}><Text style={styles.nextChipText}>{daysUntil >= 0 ? `Em ${daysUntil} dia${daysUntil === 1 ? "" : "s"}` : `Há ${Math.abs(daysUntil)} dia${Math.abs(daysUntil) === 1 ? "" : "s"}`}</Text></View>
            )}
          </View>
          <Button onPress={planNextAppointment} gradient style={styles.planButton}>
            <Ionicons name="calendar-outline" size={18} color="#ffffff" />
            <Text style={styles.planButtonText}>Planejar a Próxima Manutenção</Text>
          </Button>
        </CardContent>
      </Card>

      <Card style={styles.sectionCard}>
        <CardContent>
          <Text style={styles.sectionTitle}>Acompanhamento (6 meses)</Text>
          <View style={styles.monthsHeaderRow}>
            {Array.from({ length: 6 }).map((_, i) => {
              const d = new Date()
              d.setMonth(d.getMonth() - (5 - i))
              const label = format(d, "LLL", { locale: ptBR })
              return <Text key={i} style={styles.monthLabel}>{label.charAt(0).toUpperCase() + label.slice(1)}</Text>
            })}
          </View>
          <View style={styles.barsRow}>
            {Array.from({ length: 6 }).map((_, i) => {
              const d = new Date()
              d.setMonth(d.getMonth() - (5 - i))
              const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
              const exec = (executions || []).find((e: any) => String(e.cycle) === key)
              const status = exec ? String(exec.status) : "pending"
              const bg = status === "done" ? colors.success : status === "skipped" ? colors.warning : "#3b82f6"
              return <View key={i} style={[styles.statusBar, { backgroundColor: bg }]} />
            })}
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}><View style={[styles.legendSwatch, { backgroundColor: colors.success }]} /><Text style={styles.legendText}>Realizada</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendSwatch, { backgroundColor: colors.warning }]} /><Text style={styles.legendText}>Atrasada</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendSwatch, { backgroundColor: "#3b82f6" }]} /><Text style={styles.legendText}>Pendente</Text></View>
          </View>
        </CardContent>
      </Card>

      <Card style={styles.sectionCard}>
        <CardContent>
          <Text style={styles.sectionTitle}>Controle de Adubação</Text>
          <View style={styles.controlHeader}>
            <Text style={styles.controlLabel}>Próxima:</Text>
            <Text style={styles.controlValue}>{nextMaintenanceDate ? format(nextMaintenanceDate, "dd/MM/yyyy") : "—"}</Text>
            <Button size="small" onPress={() => markSimpleControlDone("fertilization")}>Marcar como feito</Button>
          </View>
        </CardContent>
      </Card>

      <Card style={styles.sectionCard}>
        <CardContent>
          <Text style={styles.sectionTitle}>Controle de Pragas</Text>
          <View style={styles.controlHeader}>
            <Text style={styles.controlLabel}>Próxima:</Text>
            <Text style={styles.controlValue}>{nextMaintenanceDate ? format(nextMaintenanceDate, "dd/MM/yyyy") : "—"}</Text>
            <Button size="small" onPress={() => markSimpleControlDone("pests")}>Marcar como feito</Button>
          </View>
        </CardContent>
      </Card>

      <Card style={styles.sectionCard}>
        <CardContent>
          <Text style={styles.sectionTitle}>Manutenções Passadas</Text>
          {(executions || []).filter((e: any) => String(e.status) === "done").slice(0, 4).map((e: any) => (
            <View key={e.id} style={styles.pastRow}>
              <View>
                <Text style={styles.pastTitle}>{format(new Date(e.created_at), "LLLL/yyyy", { locale: ptBR })}</Text>
                <Text style={styles.pastSub}>Realizada em {format(new Date(e.created_at), "dd/MM/yyyy")}</Text>
              </View>
              <TouchableOpacity onPress={() => Alert.alert("Comprovante", e.details ? JSON.stringify(e.details, null, 2) : (e.notes ? String(e.notes) : "Sem detalhes"))}><Text style={styles.link}>Ver comprovante</Text></TouchableOpacity>
            </View>
          ))}
        </CardContent>
      </Card>

      <View style={[styles.footerRow, { marginBottom: insets.bottom + 8 }]}>
        <Button onPress={shareCertificate} gradient size="large" fullWidth style={{ borderRadius: 24 }}>
          <Ionicons name="share-social" size={18} color="#ffffff" />
          <Text style={{ color: "#ffffff", marginLeft: 8 }}>Gerar Comprovante</Text>
        </Button>
      </View>
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: colors.overlay }} />
        <View style={{ position: 'absolute', right: 12, top: insets.top + 52, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ padding: 10, minWidth: 220 }}>
            <TouchableOpacity onPress={editPlan} style={{ paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 8 }}>
                <Ionicons name="create-outline" size={18} color={colors.textSecondary} />
                <Text style={{ color: colors.textPrimary }}>Editar cliente plano mensal</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={deletePlan} style={{ paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 8 }}>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
                <Text style={{ color: colors.danger }}>Apagar</Text>
              </View>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 6 }}>
              <TouchableOpacity onPress={() => setMenuOpen(false)} style={{ paddingHorizontal: 10, paddingVertical: 8 }}>
                <Text style={{ color: colors.textSecondary }}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg, padding: 16 },
  loading: { color: c.textSecondary },
  headerBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: c.textPrimary },
  divider: { height: 1, backgroundColor: c.divider, marginTop: 8, marginBottom: 12 },
  infoCard: { padding: 12, backgroundColor: c.surface, borderColor: c.border, borderWidth: 1 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  thumbnail: { width: 64, height: 64, borderRadius: 12, overflow: "hidden", backgroundColor: c.bg },
  thumbnailImg: { width: 64, height: 64, resizeMode: "cover" },
  infoTitle: { fontSize: 16, fontWeight: "700", color: c.textPrimary },
  infoSub: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
  badgesRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 6 },
  badgeChip: { flexDirection: "row", alignItems: "center", gap: 6 },
  badgeText: { fontSize: 12, color: c.textSecondary },
  alertCard: { borderColor: c.warning, backgroundColor: c.surface, borderWidth: 1 },
  alertRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  alertTitle: { fontSize: 14, fontWeight: "700", color: c.textPrimary },
  alertText: { fontSize: 13, color: c.warning },
  sectionCard: { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: c.textPrimary },
  nextRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  nextDateBig: { fontSize: 16, fontWeight: "700", color: c.textPrimary },
  nextChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: c.surfaceAlt, borderColor: c.border, borderWidth: 1 },
  nextChipText: { fontSize: 12, color: c.textSecondary },
  planButton: { marginTop: 8, borderRadius: 16 },
  planButtonText: { color: "#ffffff", marginLeft: 8 },
  monthsHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 },
  monthLabel: { fontSize: 12, color: c.textSecondary },
  barsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 },
  statusBar: { height: 8, borderRadius: 6, flex: 1, marginHorizontal: 3 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendSwatch: { width: 24, height: 6, borderRadius: 4 },
  legendText: { fontSize: 12, color: c.textSecondary },
  controlHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 },
  controlLabel: { fontSize: 13, color: c.textSecondary },
  controlValue: { fontSize: 13, color: c.textPrimary, fontWeight: "600" },
  pastRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10 },
  pastTitle: { fontSize: 14, fontWeight: "600", color: c.textPrimary },
  pastSub: { fontSize: 12, color: c.textSecondary },
  link: { color: c.link, fontSize: 12, fontWeight: "600" },
  footerRow: { marginTop: 12 },
})
