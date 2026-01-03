import { useEffect, useMemo, useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Share } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../contexts/ThemeContext"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import type { ThemeColors } from "../theme"
import { supabase } from "../supabase"
import { Card, CardContent } from "../components/Card"

type WorkOrderStatus = "draft" | "issued" | "completed" | "cancelled"

export function WorkOrderDetailScreen({ route, navigation }: any) {
  const { colors } = useTheme()
  const styles = createStyles(colors)
  const insets = useSafeAreaInsets()
  const id = route?.params?.id as string | undefined

  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<any | null>(null)
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    ;(async () => {
      try {
        if (!id) return
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: o } = await supabase
          .from("service_orders")
          .select("*, client:clients(id, name, phone, address), appointment:appointments(id, title, scheduled_date)")
          .eq("gardener_id", user.id)
          .eq("id", id)
          .maybeSingle()

        if (!o) {
          Alert.alert("Erro", "Ordem de serviço não encontrada")
          navigation.goBack()
          return
        }

        const normalized = {
          ...o,
          client: Array.isArray((o as any).client) ? ((o as any).client[0] ?? null) : (o as any).client,
          appointment: Array.isArray((o as any).appointment) ? ((o as any).appointment[0] ?? null) : (o as any).appointment,
        }
        setOrder(normalized)

        const { data: its } = await supabase
          .from("service_order_items")
          .select("id, quantity, unit_cost, unit_price, unit, product:products(name, unit)")
          .eq("order_id", id)
        setItems(its || [])
      } catch (e: any) {
        Alert.alert("Erro", e?.message || "Erro ao carregar OS")
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  const currency = (v: number) => {
    const value = Number(v || 0)
    return `R$ ${value.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`
  }

  const statusLabel = (s: WorkOrderStatus) => {
    switch (s) {
      case "draft": return "Rascunho"
      case "issued": return "Emitida"
      case "completed": return "Concluída"
      case "cancelled": return "Cancelada"
      default: return String(s)
    }
  }

  const statusColor = (s: WorkOrderStatus) => {
    switch (s) {
      case "draft": return colors.warning
      case "issued": return colors.accent
      case "completed": return colors.success
      case "cancelled": return colors.danger
      default: return colors.border
    }
  }

  const materialsTotal = useMemo(() => {
    return (items || []).reduce((sum: number, it: any) => sum + Number(it.unit_price || 0) * Number(it.quantity || 0), 0)
  }, [items])

  const shareOrder = async () => {
    try {
      if (!order) return
      const lines: string[] = []
      lines.push(`Ordem de serviço: ${String(order.title || "")}`)
      lines.push(`Status: ${statusLabel(String(order.status) as any)}`)
      if (order.client?.name) lines.push(`Cliente: ${String(order.client.name)}`)
      if (order.appointment) {
        const d = new Date(String(order.appointment.scheduled_date))
        lines.push(`Agendamento: ${String(order.appointment.title || order.appointment.id)} (${d.toLocaleDateString("pt-BR")} ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })})`)
      }
      if (order.description) {
        lines.push("")
        lines.push("Descrição:")
        lines.push(String(order.description))
      }
      lines.push("")
      lines.push("Itens:")
      if (items.length > 0) {
        items.forEach((it: any) => {
          const name = it.product?.name || it.product_id || "Item"
          const unit = String(it.unit || it.product?.unit || "un")
          const qty = Number(it.quantity || 0)
          const subtotal = Number(it.unit_price || 0) * qty
          lines.push(`- ${name} — ${qty} ${unit} — ${currency(subtotal)}`)
        })
      } else {
        lines.push("- Nenhum material")
      }
      lines.push("")
      lines.push(`Mão de obra: ${currency(Number(order.labor_cost || 0))}`)
      lines.push(`Materiais: ${currency(materialsTotal)}`)
      lines.push(`Adicionais: ${currency(Number(order.extra_charges || 0))}`)
      lines.push(`Desconto: ${currency(Number(order.discount || 0))}`)
      lines.push(`Total: ${currency(Number(order.total_amount || 0))}`)
      await Share.share({ message: lines.join("\n") })
    } catch {}
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={[styles.headerBar, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon} accessibilityRole="button" accessibilityLabel="Voltar">
            <Ionicons name="chevron-back" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ordem de serviço</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.divider} />
        <View style={styles.loading}>
          <ActivityIndicator color={colors.link} />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </View>
    )
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <View style={[styles.headerBar, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon} accessibilityRole="button" accessibilityLabel="Voltar">
            <Ionicons name="chevron-back" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ordem de serviço</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.divider} />
        <View style={styles.loading}>
          <Text style={styles.loadingText}>OS não encontrada</Text>
        </View>
      </View>
    )
  }

  const pillBg = statusColor(String(order.status) as any)
  const pillText = String(order.status) === "draft" ? "#111827" : "#ffffff"

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + 16 }} showsVerticalScrollIndicator={false}>
      <View style={[styles.headerBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon} accessibilityRole="button" accessibilityLabel="Voltar">
          <Ionicons name="chevron-back" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ordem de serviço</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={shareOrder} style={styles.headerIcon} accessibilityRole="button" accessibilityLabel="Compartilhar">
            <Ionicons name="share-social-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("WorkOrderEditForm", { id: String(order.id) })} style={styles.headerIcon} accessibilityRole="button" accessibilityLabel="Editar">
            <Ionicons name="create-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.divider} />

      <Card style={styles.card}>
        <CardContent>
          <View style={styles.titleRow}>
            <Text style={styles.titleText} numberOfLines={2}>{String(order.title || "")}</Text>
            <View style={[styles.statusPill, { backgroundColor: pillBg }]}>
              <Text style={[styles.statusText, { color: pillText }]}>{statusLabel(String(order.status) as any)}</Text>
            </View>
          </View>

          {order.description ? (
            <View style={styles.block}>
              <Text style={styles.blockLabel}>Descrição</Text>
              <Text style={styles.blockValue}>{String(order.description)}</Text>
            </View>
          ) : null}

          {order.appointment ? (
            <View style={styles.block}>
              <Text style={styles.blockLabel}>Agendamento</Text>
              <Text style={styles.blockValue}>{String(order.appointment?.title || order.appointment?.id)}</Text>
              <Text style={styles.blockSub}>{new Date(String(order.appointment?.scheduled_date)).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</Text>
            </View>
          ) : null}
        </CardContent>
      </Card>

      <View style={styles.gridRow}>
        <Card style={styles.gridCard}>
          <CardContent>
            <Text style={styles.kpiLabel}>Mão de obra</Text>
            <Text style={styles.kpiValue}>{currency(Number(order.labor_cost || 0))}</Text>
          </CardContent>
        </Card>
        <Card style={styles.gridCard}>
          <CardContent>
            <Text style={styles.kpiLabel}>Materiais</Text>
            <Text style={styles.kpiValue}>{currency(materialsTotal)}</Text>
          </CardContent>
        </Card>
      </View>

      {items.length > 0 ? (
        <Card style={styles.card}>
          <CardContent>
            <Text style={styles.sectionTitle}>Itens</Text>
            <View style={styles.itemsWrap}>
              {items.map((it: any) => {
                const name = it.product?.name || it.product_id || "Item"
                const unit = String(it.unit || it.product?.unit || "un")
                const qty = Number(it.quantity || 0)
                const subtotal = Number(it.unit_price || 0) * qty
                return (
                  <View key={String(it.id)} style={styles.itemLine}>
                    <Text style={styles.itemLineLeft} numberOfLines={2}>{name} — {qty} {unit}</Text>
                    <Text style={styles.itemLineRight}>{currency(subtotal)}</Text>
                  </View>
                )
              })}
            </View>
          </CardContent>
        </Card>
      ) : null}

      <Card style={styles.card}>
        <CardContent>
          <View style={styles.itemLine}>
            <Text style={styles.itemLineLeft}>Margem materiais</Text>
            <Text style={styles.itemLineRight}>{Number(order.materials_markup_pct || 0).toFixed(2).replace(".", ",")}%</Text>
          </View>
          <View style={styles.itemLine}>
            <Text style={styles.itemLineLeft}>Adicionais</Text>
            <Text style={styles.itemLineRight}>{currency(Number(order.extra_charges || 0))}</Text>
          </View>
          <View style={styles.itemLine}>
            <Text style={styles.itemLineLeft}>Desconto</Text>
            <Text style={styles.itemLineRight}>{currency(Number(order.discount || 0))}</Text>
          </View>
          <View style={styles.totalLine}>
            <Text style={styles.totalLeft}>Total</Text>
            <Text style={styles.totalRight}>{currency(Number(order.total_amount || 0))}</Text>
          </View>
        </CardContent>
      </Card>

      {order.client ? (
        <Card style={styles.card}>
          <CardContent>
            <Text style={styles.sectionTitle}>Cliente</Text>
            <Text style={styles.clientName}>{String(order.client?.name || "")}</Text>
            {order.client?.phone ? <Text style={styles.clientSub}>{String(order.client.phone)}</Text> : null}
            {order.client?.address ? <Text style={styles.clientSub}>{String(order.client.address)}</Text> : null}
          </CardContent>
        </Card>
      ) : null}
    </ScrollView>
  )
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  headerBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12 },
  headerIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: c.textPrimary },
  headerRight: { flexDirection: "row", alignItems: "center" },
  divider: { height: 1, backgroundColor: c.divider },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 24 },
  loadingText: { marginTop: 10, color: c.textSecondary, fontWeight: "600" },
  card: { marginTop: 12, marginHorizontal: 16 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  titleText: { flex: 1, fontSize: 18, fontWeight: "800", color: c.textPrimary, marginRight: 10 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: "flex-start" },
  statusText: { fontSize: 11, fontWeight: "700" },
  block: { marginTop: 12 },
  blockLabel: { fontSize: 13, fontWeight: "700", color: c.textSecondary, marginBottom: 4 },
  blockValue: { fontSize: 14, color: c.textPrimary, lineHeight: 20 },
  blockSub: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
  gridRow: { flexDirection: "row", columnGap: 12, paddingHorizontal: 16, marginTop: 12 },
  gridCard: { flex: 1 },
  kpiLabel: { fontSize: 12, fontWeight: "700", color: c.textSecondary, marginBottom: 6 },
  kpiValue: { fontSize: 16, fontWeight: "800", color: c.textPrimary },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: c.textPrimary, marginBottom: 10 },
  itemsWrap: { rowGap: 10 },
  itemLine: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  itemLineLeft: { flex: 1, color: c.textPrimary, marginRight: 10, lineHeight: 20 },
  itemLineRight: { color: c.textSecondary, fontWeight: "800" },
  totalLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: c.border, paddingTop: 12, marginTop: 12 },
  totalLeft: { color: c.textSecondary, fontWeight: "800" },
  totalRight: { color: c.success, fontWeight: "900", fontSize: 18 },
  clientName: { fontSize: 15, fontWeight: "800", color: c.textPrimary, marginBottom: 6 },
  clientSub: { fontSize: 13, color: c.textSecondary, marginTop: 2 },
})

export default WorkOrderDetailScreen
