import React, { useMemo, useState, useCallback } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, ScrollView } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../contexts/ThemeContext"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { supabase } from "../supabase"
import { useOfflineSync } from "../hooks/useOfflineSync"
import { SearchBar } from "../components/SearchBar"
import type { ThemeColors } from "../theme"
import { useFocusEffect } from "@react-navigation/native"

interface WorkOrderItem {
  id: string
  title: string
  clientName: string
  status: "draft" | "issued" | "completed" | "cancelled"
  date: string
  amount: number
}

export function WorkOrdersScreen({ navigation }: any) {
  const { colors } = useTheme()
  const styles = createStyles(colors)
  const insets = useSafeAreaInsets()
  const [filter, setFilter] = useState<"Todas" | "Rascunho" | "Emitidas" | "Concluídas" | "Canceladas">("Todas")
  const [searchText, setSearchText] = useState("")

  const fetchOrders = useCallback(async () => {
    const { data: { user: current } } = await supabase.auth.getUser()
    if (!current) return []
    const { data } = await supabase
      .from("service_orders")
      .select("id, title, status, total_amount, created_at, client:clients(name)")
      .eq("gardener_id", current.id)
      .order("created_at", { ascending: false })

    return (data || []).map((o: any) => ({
      id: String(o.id),
      title: String(o.title || "Ordem de serviço"),
      clientName: Array.isArray(o.client) ? (o.client[0]?.name ?? "") : (o.client?.name ?? ""),
      status: (String(o.status) as any) || "issued",
      date: new Date(String(o.created_at)).toLocaleDateString("pt-BR"),
      amount: Number(o.total_amount || 0),
    }))
  }, [])

  const { data: orders, loading, error, refresh } = useOfflineSync<WorkOrderItem[]>("work_orders", fetchOrders)

  useFocusEffect(
    useCallback(() => {
      refresh()
      return () => {}
    }, [refresh])
  )

  const statusLabel = (s: WorkOrderItem["status"]) => {
    switch (s) {
      case "draft": return "Rascunho"
      case "issued": return "Emitida"
      case "completed": return "Concluída"
      case "cancelled": return "Cancelada"
      default: return String(s)
    }
  }

  const statusColor = (s: WorkOrderItem["status"]) => {
    switch (s) {
      case "draft": return colors.warning
      case "issued": return colors.accent
      case "completed": return colors.success
      case "cancelled": return colors.danger
      default: return colors.textSecondary
    }
  }

  const filtered = useMemo(() => {
    const list = (orders || [])
    const f1 = list.filter((o) => {
      if (filter === "Todas") return true
      if (filter === "Rascunho") return o.status === "draft"
      if (filter === "Emitidas") return o.status === "issued"
      if (filter === "Concluídas") return o.status === "completed"
      if (filter === "Canceladas") return o.status === "cancelled"
      return true
    })
    if (!searchText) return f1
    const q = searchText.toLowerCase()
    return f1.filter((o) => o.title.toLowerCase().includes(q) || o.clientName.toLowerCase().includes(q))
  }, [orders, filter, searchText])

  const totalAmount = (orders || []).reduce((sum, o) => sum + o.amount, 0)
  const completedCount = (orders || []).filter((o) => o.status === "completed").length
  const issuedCount = (orders || []).filter((o) => o.status === "issued").length

  const formatCurrency = (v: number) => {
    const value = Number(v || 0)
    return `R$ ${value.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`
  }

  const renderItem = ({ item }: { item: WorkOrderItem }) => {
    const pillBg = statusColor(item.status)
    const pillText = item.status === "draft" ? "#111827" : "#ffffff"
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate("WorkOrderDetail", { id: item.id })}
        style={styles.card}
        accessibilityRole="button"
        accessibilityLabel={`Abrir OS ${item.title}`}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <View style={[styles.statusPill, { backgroundColor: pillBg }] }>
            <Text style={[styles.statusText, { color: pillText }]}>{statusLabel(item.status)}</Text>
          </View>
        </View>
        <Text style={styles.cardSub} numberOfLines={1}>{item.clientName}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.dateText}>{item.date}</Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle={colors.bg === "#F9FAFB" ? "dark-content" : "light-content"} backgroundColor={colors.headerBg} />
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.headerTitle}>Ordens de serviço</Text>
          <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate("WorkOrderForm")} accessibilityRole="button" accessibilityLabel="Nova OS">
            <Ionicons name="add" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={colors.bg === "#F9FAFB" ? "dark-content" : "light-content"} backgroundColor={colors.headerBg} />
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Ordens de serviço</Text>
        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate("WorkOrderForm")} accessibilityRole="button" accessibilityLabel="Nova OS">
          <Ionicons name="add" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.thinDivider} />

      <FlatList
        data={filtered}
        keyExtractor={(it) => it.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={refresh}
        ListHeaderComponent={(
          <View style={styles.listHeader}>
            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>Erro ao sincronizar ordens de serviço</Text>
                <TouchableOpacity onPress={() => refresh()} style={styles.errorRetry} accessibilityRole="button" accessibilityLabel="Tentar novamente">
                  <Ionicons name="refresh" size={16} color="#ffffff" />
                  <Text style={styles.errorRetryText}>Tentar novamente</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Total</Text>
                <Text style={styles.summaryValue}>{(orders || []).length}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Emitidas</Text>
                <Text style={[styles.summaryValue, { color: colors.accent }]}>{issuedCount}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Concluídas</Text>
                <Text style={[styles.summaryValue, { color: colors.success }]}>{completedCount}</Text>
              </View>
            </View>

            <View style={styles.totalPanel}>
              <Text style={styles.totalLabel}>Valor Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters} contentContainerStyle={styles.filtersContent}>
              {(() => {
                const filtersList: Array<"Todas" | "Rascunho" | "Emitidas" | "Concluídas" | "Canceladas"> = ["Todas", "Rascunho", "Emitidas", "Concluídas", "Canceladas"]
                return filtersList.map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.chip, filter === f ? styles.chipActive : null]}
                    onPress={() => setFilter(f as any)}
                    accessibilityRole="button"
                    accessibilityLabel={`Filtrar: ${f}`}
                  >
                    <Text style={[styles.chipText, filter === f ? styles.chipTextActive : null]}>{f}</Text>
                  </TouchableOpacity>
                ))
              })()}
            </ScrollView>

            <View style={styles.searchRow}>
              <SearchBar
                placeholder="Buscar por cliente ou título..."
                value={searchText}
                onChangeText={setSearchText}
                style={styles.searchBar}
              />
            </View>
          </View>
        )}
        ListEmptyComponent={(
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Nenhuma OS encontrada</Text>
            <Text style={styles.emptySub}>Crie uma nova ordem de serviço para começar</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => navigation.navigate("WorkOrderForm")} accessibilityRole="button" accessibilityLabel="Nova OS">
              <Ionicons name="add" size={18} color="#ffffff" />
              <Text style={styles.emptyButtonText}>Nova OS</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  )
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 10, backgroundColor: c.headerBg },
  headerTitle: { fontSize: 20, fontWeight: "700", color: c.textPrimary },
  headerIcon: { padding: 6 },
  thinDivider: { height: 1, backgroundColor: c.divider },
  listContent: { paddingHorizontal: 20, paddingTop: 12 },
  listHeader: { paddingBottom: 4 },
  errorBanner: { backgroundColor: c.danger, borderRadius: 12, padding: 12, marginBottom: 12 },
  errorText: { color: "#ffffff", fontSize: 13, fontWeight: "600", marginBottom: 10 },
  errorRetry: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.18)", paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10 },
  errorRetryText: { color: "#ffffff", fontSize: 12, fontWeight: "700", marginLeft: 8 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  summaryCard: { backgroundColor: c.surface, borderRadius: 12, paddingVertical: 16, paddingHorizontal: 12, flex: 1, marginHorizontal: 4, alignItems: "center" },
  summaryLabel: { fontSize: 12, color: c.textSecondary, fontWeight: "500", marginBottom: 4 },
  summaryValue: { fontSize: 24, color: c.textPrimary, fontWeight: "700" },
  totalPanel: { backgroundColor: c.surface, borderRadius: 12, paddingVertical: 20, paddingHorizontal: 20, marginBottom: 12, alignItems: "center" },
  totalLabel: { fontSize: 14, color: c.textSecondary, marginBottom: 4 },
  totalValue: { fontSize: 32, color: c.success, fontWeight: "700" },
  filters: { paddingVertical: 2, marginTop: 4, marginBottom: 4 },
  filtersContent: { flexDirection: "row" },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 18, backgroundColor: c.border, marginRight: 6, height: 30, justifyContent: "center" },
  chipActive: { backgroundColor: c.link },
  chipText: { fontSize: 13, color: c.textSecondary, fontWeight: "500" },
  chipTextActive: { color: "#ffffff", fontWeight: "600" },
  searchRow: { marginTop: 6, marginBottom: 8 },
  searchBar: { flex: 1 },
  card: { backgroundColor: c.surface, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: c.border },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  cardTitle: { fontSize: 16, color: c.textPrimary, fontWeight: "700", flex: 1, marginRight: 8 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: "flex-start" },
  statusText: { fontSize: 11, fontWeight: "600" },
  cardSub: { fontSize: 14, color: c.textSecondary, marginBottom: 12 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  amount: { fontSize: 16, color: c.textPrimary, fontWeight: "700" },
  dateRow: { flexDirection: "row", alignItems: "center" },
  dateText: { fontSize: 14, color: c.textSecondary, marginLeft: 6 },
  emptyState: { alignItems: "center", paddingVertical: 32 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: c.textPrimary, marginBottom: 6 },
  emptySub: { fontSize: 13, color: c.textSecondary, textAlign: "center", marginBottom: 14, paddingHorizontal: 24 },
  emptyButton: { flexDirection: "row", alignItems: "center", backgroundColor: c.link, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  emptyButtonText: { color: "#ffffff", fontSize: 13, fontWeight: "700", marginLeft: 8 },
})

export default WorkOrdersScreen

