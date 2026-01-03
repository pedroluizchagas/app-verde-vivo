import React, { useState, useCallback } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, StatusBar } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { supabase } from "../supabase"
import { useOfflineSync } from "../hooks/useOfflineSync"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTheme } from "../contexts/ThemeContext"
import type { ThemeColors } from "../theme"
import { SearchBar } from "../components/SearchBar"

interface Budget {
  id: string
  clientName: string
  serviceDescription: string
  value: number
  date: string
  status: 'Pendente' | 'Aprovado' | 'Rejeitado' | 'Expirado'
}

export function BudgetsScreen({ navigation }: any) {
  const [filter, setFilter] = useState<'Todos' | 'Pendentes' | 'Aprovados' | 'Rejeitados' | 'Expirados'>('Todos')
  const [searchText, setSearchText] = useState('')
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()
  const styles = createStyles(colors)

  const fetchBudgets = useCallback(async () => {
    const { data: { user: current } } = await supabase.auth.getUser()
    if (!current) return []
    const { data } = await supabase
      .from("budgets")
      .select("id, title, description, total_amount, status, created_at, client:clients(name)")
      .eq("gardener_id", current.id)
      .order("created_at", { ascending: false })
    return (data || []).map((b: any) => ({
      id: String(b.id),
      clientName: Array.isArray(b.client) ? (b.client[0]?.name ?? "") : (b.client?.name ?? ""),
      serviceDescription: String(b.description || b.title || ""),
      value: Number(b.total_amount || 0),
      date: new Date(String(b.created_at)).toLocaleDateString('pt-BR'),
      status: (String(b.status) === 'approved' ? 'Aprovado' : String(b.status) === 'rejected' ? 'Rejeitado' : String(b.status) === 'expired' ? 'Expirado' : 'Pendente') as any,
    }))
  }, [])

  const {
    data: budgets,
    loading,
    error,
    refresh,
  } = useOfflineSync<Budget[]>("budgets", fetchBudgets)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pendente': return colors.warning
      case 'Aprovado': return colors.success
      case 'Rejeitado': return colors.danger
      case 'Expirado': return colors.muted
      default: return colors.muted
    }
  }

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'Pendente': return '#111827'
      default: return '#FFFFFF'
    }
  }

  const filteredBudgets = (budgets || []).filter(budget => {
    if (filter !== 'Todos') {
      if (filter === 'Pendentes' && budget.status !== 'Pendente') return false
      if (filter === 'Aprovados' && budget.status !== 'Aprovado') return false
      if (filter === 'Rejeitados' && budget.status !== 'Rejeitado') return false
      if (filter === 'Expirados' && budget.status !== 'Expirado') return false
    }
    
    if (searchText) {
      const searchLower = searchText.toLowerCase()
      return budget.clientName.toLowerCase().includes(searchLower) || 
             budget.serviceDescription.toLowerCase().includes(searchLower)
    }
    
    return true
  })

  const totalValue = (budgets || []).reduce((sum, budget) => sum + budget.value, 0)
  const pendingCount = (budgets || []).filter(b => b.status === 'Pendente').length
  const approvedCount = (budgets || []).filter(b => b.status === 'Aprovado').length

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
  }

  const renderBudgetCard = ({ item }: { item: Budget }) => {
    const statusColor = getStatusColor(item.status)
    const statusTextColor = getStatusTextColor(item.status)

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('BudgetForm', { budgetId: item.id })}
        style={[
        styles.budgetCard,
        item.status === 'Pendente'
          ? { borderWidth: 1, borderColor: colors.border, borderTopWidth: 2, borderTopColor: statusColor }
          : item.status === 'Expirado'
            ? { borderWidth: 1, borderColor: colors.border }
            : { borderWidth: 1, borderColor: statusColor }
      ]}
        accessibilityRole="button"
        accessibilityLabel={`Abrir orçamento de ${item.clientName}`}
      >
        <View style={styles.budgetCardHeader}>
          <Text style={styles.clientName}>{item.clientName}</Text>
          <View style={[styles.statusPill, { backgroundColor: statusColor }]}>
            <Text style={[styles.statusPillText, { color: statusTextColor }]}>
              {item.status}
            </Text>
          </View>
        </View>
        
        <Text style={styles.serviceDescription} numberOfLines={2}>
          {item.serviceDescription}
        </Text>
        
        <View style={styles.budgetCardFooter}>
          <Text style={styles.priceText}>{formatCurrency(item.value)}</Text>
          <View style={styles.dateRight}>
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
        <StatusBar barStyle={colors.bg === '#F9FAFB' ? 'dark-content' : 'light-content'} backgroundColor={colors.headerBg} />
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.headerTitle}>Orçamentos</Text>
          <TouchableOpacity style={styles.headerIconButton} onPress={() => navigation.navigate('BudgetForm')} accessibilityRole="button" accessibilityLabel="Novo orçamento">
            <Ionicons name="add" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={colors.bg === '#F9FAFB' ? 'dark-content' : 'light-content'} backgroundColor={colors.headerBg} />
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}> 
        <Text style={styles.headerTitle}>Orçamentos</Text>
        <TouchableOpacity style={styles.headerIconButton} onPress={() => navigation.navigate('BudgetForm')} accessibilityRole="button" accessibilityLabel="Novo orçamento">
          <Ionicons name="add" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
      <View style={styles.thinDivider} />

      <FlatList 
        data={filteredBudgets}
        keyExtractor={(item) => item.id}
        renderItem={renderBudgetCard}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={refresh}
        ListHeaderComponent={(
          <View style={styles.listHeader}>
            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>Erro ao sincronizar orçamentos</Text>
                <TouchableOpacity onPress={() => refresh()} style={styles.errorRetry} accessibilityRole="button" accessibilityLabel="Tentar novamente">
                  <Ionicons name="refresh" size={16} color="#ffffff" />
                  <Text style={styles.errorRetryText}>Tentar novamente</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.summaryCardsContainer}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryCardLabel}>Total</Text>
                <Text style={styles.summaryCardValue}>{(budgets || []).length}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryCardLabel}>Pendentes</Text>
                <Text style={[styles.summaryCardValue, { color: colors.warning }]}>{pendingCount}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryCardLabel}>Aprovados</Text>
                <Text style={[styles.summaryCardValue, { color: colors.success }]}>{approvedCount}</Text>
              </View>
            </View>

            <View style={styles.totalValuePanel}>
              <Text style={styles.totalValueLabel}>Valor Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(totalValue)}</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterContainer}
              contentContainerStyle={styles.filterContent}
            >
              {['Todos', 'Pendentes', 'Aprovados', 'Rejeitados', 'Expirados'].map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.filterChip,
                    filter === item && styles.filterChipActive
                  ]}
                  onPress={() => setFilter(item as any)}
                  accessibilityRole="button"
                  accessibilityLabel={`Filtrar: ${item}`}
                >
                  <Text style={[
                    styles.filterChipText,
                    filter === item && styles.filterChipTextActive
                  ]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.searchRow}>
              <SearchBar
                placeholder="Buscar por cliente ou serviço..."
                value={searchText}
                onChangeText={setSearchText}
                style={styles.searchBar}
              />
            </View>
          </View>
        )}
        ListEmptyComponent={(
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Nenhum orçamento encontrado</Text>
            <Text style={styles.emptySub}>Crie um novo orçamento para começar</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => navigation.navigate('BudgetForm')}>
              <Ionicons name="add" size={18} color="#ffffff" />
              <Text style={styles.emptyButtonText}>Novo orçamento</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  )
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: c.headerBg,
  },
  thinDivider: {
    height: 1,
    backgroundColor: c.divider,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: c.textPrimary,
    flex: 1,
    textAlign: 'left',
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listHeader: {
    paddingTop: 10,
  },
  summaryCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: c.surface,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: c.border,
  },
  summaryCardLabel: {
    fontSize: 12,
    color: c.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  summaryCardValue: {
    fontSize: 24,
    color: c.textPrimary,
    fontWeight: '700',
  },
  totalValuePanel: {
    backgroundColor: c.surface,
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: c.border,
  },
  totalValueLabel: {
    fontSize: 14,
    color: c.textSecondary,
    fontWeight: '400',
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 32,
    color: c.success,
    fontWeight: '700',
  },
  filterContainer: {
    paddingVertical: 8,
    marginBottom: 10,
  },
  filterContent: {
    paddingHorizontal: 20,
    paddingRight: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: c.surfaceAlt,
    borderWidth: 1,
    borderColor: c.border,
    marginRight: 8,
    height: 36,
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: c.link,
    borderColor: c.link,
  },
  filterChipText: {
    fontSize: 14,
    color: c.textSecondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  searchRow: {
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  searchBar: {
    backgroundColor: c.surfaceAlt,
    borderColor: c.border,
    height: 46,
  },
  listContent: {
    paddingBottom: 24,
  },
  budgetCard: {
    backgroundColor: c.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  budgetCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  clientName: {
    fontSize: 16,
    color: c.textPrimary,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  serviceDescription: {
    fontSize: 14,
    color: c.textSecondary,
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: 12,
  },
  budgetCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 16,
    color: c.textPrimary,
    fontWeight: '700',
  },
  dateRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: c.textSecondary,
    fontWeight: '400',
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: c.textPrimary,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: c.textSecondary,
    marginBottom: 12,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: c.link,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: c.danger,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  errorRetry: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  errorRetryText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },

})

export default BudgetsScreen
