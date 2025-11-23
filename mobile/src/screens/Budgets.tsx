import React, { useState, useEffect } from "react"
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView,
  StatusBar,
  TextInput
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { supabase } from "../supabase"
import { useAuth } from "../contexts/AuthContext"
import { useOfflineSync } from "../hooks/useOfflineSync"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTheme } from "../contexts/ThemeContext"
import type { ThemeColors } from "../theme"

interface Budget {
  id: string
  clientName: string
  serviceDescription: string
  value: number
  date: string
  status: 'Pendente' | 'Aprovado' | 'Rejeitado' | 'Expirado'
}

export function BudgetsScreen({ navigation }: any) {
  const { user } = useAuth()
  const [filter, setFilter] = useState<'Todos' | 'Pendentes' | 'Aprovados' | 'Rejeitados' | 'Expirados'>('Todos')
  const [searchText, setSearchText] = useState('')
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()
  const styles = createStyles(colors)

  const {
    data: budgets,
    loading,
    error,
    refresh,
  } = useOfflineSync<Budget[]>("budgets", async () => {
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
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pendente': return '#FFC107'
      case 'Aprovado': return '#2ECC71'
      case 'Rejeitado': return '#D9534F'
      case 'Expirado': return '#6C7A89'
      default: return '#6b7280'
    }
  }

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'Pendente': return '#1A1A1A'
      case 'Aprovado': return '#FFFFFF'
      case 'Rejeitado': return '#FFFFFF'
      case 'Expirado': return '#FFFFFF'
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
      <View style={[
        styles.budgetCard,
        item.status === 'Pendente'
          ? { borderWidth: 0, borderTopWidth: 2, borderTopColor: statusColor }
          : item.status === 'Expirado'
            ? { borderWidth: 1, borderColor: '#2E3238' }
            : { borderWidth: 1, borderColor: statusColor }
      ]}>
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
          <Ionicons name="document-text-outline" size={16} color="#C5C8CC" />
          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" size={16} color="#C5C8CC" />
            <Text style={styles.dateText}>{item.date}</Text>
          </View>
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0F1115" />
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}> 
          <View style={{ width: 24 }} />
          <Text style={styles.headerTitle}>Gestão de Orçamentos</Text>
          <View style={styles.addButton}><Ionicons name="add" size={24} color="#FFFFFF" /></View>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={colors.bg === '#F9FAFB' ? 'dark-content' : 'light-content'} backgroundColor={colors.headerBg} />
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={{ width: 24 }} />
        <Text style={styles.headerTitle}>Gestão de Orçamentos</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('BudgetForm')}>
          <Ionicons name="add" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryCardsContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryCardLabel}>Total</Text>
          <Text style={styles.summaryCardValue}>{(budgets || []).length}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryCardLabel}>Pendentes</Text>
          <Text style={[styles.summaryCardValue, { color: '#FFC107' }]}>{pendingCount}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryCardLabel}>Aprovados</Text>
          <Text style={[styles.summaryCardValue, { color: '#2ECC71' }]}>{approvedCount}</Text>
        </View>
      </View>

      {/* Total Value Panel */}
      <View style={styles.totalValuePanel}>
        <Text style={styles.totalValueLabel}>Valor Total</Text>
        <Text style={styles.totalValue}>{formatCurrency(totalValue)}</Text>
      </View>

      {/* Filter Chips */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
      >
        {['Todos', 'Pendentes', 'Aprovados', 'Rejeitados', 'Expirados'].map((item) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.filterChip,
              filter === item && styles.filterChipActive
            ]}
            onPress={() => setFilter(item as any)}
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

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por cliente ou serviço..."
          placeholderTextColor={colors.textSecondary}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <FlatList 
        data={filteredBudgets}
        keyExtractor={(item) => item.id}
        renderItem={renderBudgetCard}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
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
    paddingBottom: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: c.textPrimary,
    flex: 1,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  addButton: {
    padding: 4,
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
  },
  totalValueLabel: {
    fontSize: 14,
    color: c.textSecondary,
    fontWeight: '400',
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 32,
    color: '#2ECC71',
    fontWeight: '700',
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: c.border,
    marginRight: 8,
    height: 36,
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: '#2ECC71',
  },
  filterChipText: {
    fontSize: 14,
    color: c.textSecondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: c.textPrimary,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surfaceAlt,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: c.border,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: c.textPrimary,
    fontSize: 16,
    fontWeight: '400',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  budgetCard: {
    backgroundColor: c.surface,
    borderRadius: 12,
    padding: 16,
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
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 16,
    color: c.textPrimary,
    fontWeight: '700',
    marginLeft: 6,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: c.textSecondary,
    fontWeight: '400',
    marginLeft: 6,
  },

})

export default BudgetsScreen