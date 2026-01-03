import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { Card, CardHeader, CardTitle, CardContent } from "../components/Card"
import { Button } from "../components/Button"
import { useAuth } from "../contexts/AuthContext"
import { supabase } from "../supabase"
import { format, startOfMonth, endOfMonth, addDays, isAfter, isBefore } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useTheme } from "../contexts/ThemeContext"
import type { ThemeColors } from "../theme"

interface Transaction {
  id: string
  type: "income" | "expense"
  amount: number
  transaction_date: string
  description: string | null
  status: "paid" | "pending"
  due_date?: string
  category?: { name: string | null } | null
  client?: { name: string | null } | null
}

interface PartnerCredit {
  id: string
  partner_name: string
  credit_amount: number
  credit_type: string
  status: string
  created_at: string
}

interface ExpenseCategoryTotal {
  name: string
  total: number
}

function toISODate(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const currency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)

export function FinanceScreen({ navigation }: any) {
  const { user } = useAuth()
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()
  const styles = createStyles(colors)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [monthTransactions, setMonthTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [partnerCredits, setPartnerCredits] = useState<PartnerCredit[]>([])
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending">("all")
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"all" | "income" | "expense">("all")
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategoryTotal[]>([])

  const today = new Date()
  const startMonth = startOfMonth(today)
  const endMonth = endOfMonth(today)
  const in7Days = addDays(today, 7)
  const in30Days = addDays(today, 30)

  useEffect(() => {
    loadFinancialData()
  }, [])

  useEffect(() => {
    filterTransactions()
  }, [statusFilter, monthTransactions, activeTab])

  const loadFinancialData = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Fetch month transactions
      const { data: monthData } = await supabase
        .from("financial_transactions")
        .select(`*, category:financial_categories(name, parent_id), client:clients(name)`)
        .eq("gardener_id", user.id)
        .gte("transaction_date", toISODate(startMonth))
        .lte("transaction_date", toISODate(endMonth))
        .order("transaction_date", { ascending: false })

      // Fetch all paid transactions for current balance
      const { data: paidData } = await supabase
        .from("financial_transactions")
        .select("amount, type, status")
        .eq("gardener_id", user.id)
        .eq("status", "paid")

      // Fetch pending transactions due in next 30 days
      const { data: pending30Data } = await supabase
        .from("financial_transactions")
        .select("amount, type, due_date, description")
        .eq("gardener_id", user.id)
        .eq("status", "pending")
        .gte("due_date", toISODate(today))
        .lte("due_date", toISODate(in30Days))
        .order("due_date", { ascending: true })

      // Fetch alerts: pending due next 7 days
      const { data: alertsData } = await supabase
        .from("financial_transactions")
        .select("id, description, amount, type, due_date")
        .eq("gardener_id", user.id)
        .eq("status", "pending")
        .gte("due_date", toISODate(today))
        .lte("due_date", toISODate(in7Days))
        .order("due_date", { ascending: true })

      // Fetch partner credits
      const { data: creditsData } = await supabase
        .from("partner_credits")
        .select("id, partner_name, credit_amount, credit_type, status, created_at")
        .eq("gardener_id", user.id)
        .eq("status", "available")
        .order("created_at", { ascending: false })
        .limit(5)

      setMonthTransactions(monthData || [])
      setTransactions(monthData || [])
      setFilteredTransactions(monthData || [])
      setAlerts(alertsData || [])
      setPartnerCredits(creditsData || [])

      const expenseTotals: Record<string, number> = {};
      (monthData || []).filter(t => t.type === "expense").forEach(t => {
        const name = t.category?.name || "Outros"
        const amt = Number(t.amount)
        expenseTotals[name] = (expenseTotals[name] || 0) + (isNaN(amt) ? 0 : amt)
      })
      const expenseList = Object.keys(expenseTotals)
        .map<ExpenseCategoryTotal>(name => ({ name, total: expenseTotals[name] }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 3)
      setExpenseCategories(expenseList)
    } catch (error) {
      console.error("Error loading financial data:", error)
    } finally {
      setLoading(false)
    }
  }

  const currentBalance = transactions
    .filter(t => t.status === "paid")
    .reduce((sum, t) => sum + (t.type === "income" ? Number(t.amount) : -Number(t.amount)), 0)

  const monthIncome = monthTransactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const monthExpense = monthTransactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const forecastNext30 = transactions
    .filter(t => t.status === "pending" && t.due_date && isAfter(new Date(t.due_date), today) && isBefore(new Date(t.due_date), in30Days))
    .reduce((sum, t) => sum + (t.type === "income" ? Number(t.amount) : -Number(t.amount)), 0)

  const totalPartnerCredits = partnerCredits.reduce((sum, c) => sum + Number(c.credit_amount), 0)

  const filterTransactions = () => {
    let filtered = monthTransactions
    if (statusFilter !== "all") {
      filtered = filtered.filter(transaction => transaction.status === statusFilter)
    }
    if (activeTab !== "all") {
      filtered = filtered.filter(transaction => transaction.type === activeTab)
    }
    setFilteredTransactions(filtered)
  }

  const TransactionCard = ({ transaction }: { transaction: Transaction }) => {
    const isIncome = transaction.type === "income"
    const typeLabel = isIncome ? "Receita" : "Despesa"
    const statusLabel = transaction.status === "paid" ? "Pago" : "Pendente"

    return (
      <Card style={styles.transactionCard} padding={12}>
        <CardContent>
          <View style={styles.transactionRow}>
            <View style={styles.transactionInfo}>
              <View style={styles.transactionHeader}>
                <View style={[styles.typeBadge, isIncome ? styles.incomeBadge : styles.expenseBadge]}>
                  <Text style={[styles.typeText, isIncome ? styles.incomeText : styles.expenseText]}>
                    {typeLabel}
                  </Text>
                </View>
                <Text style={styles.categoryText}>
                  {transaction.category?.name || "Sem categoria"}
                </Text>
                <Text style={styles.separator}>•</Text>
                <Text style={styles.clientText}>
                  {transaction.client?.name || "Sem cliente"}
                </Text>
              </View>
              {transaction.description && (
                <Text style={styles.descriptionText}>{transaction.description}</Text>
              )}
              <View style={styles.transactionFooter}>
                <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
                <Text style={styles.dateText}>
                  {format(new Date(transaction.transaction_date), "dd 'de' MMM", { locale: ptBR })}
                </Text>
                <View style={[styles.statusBadge, transaction.status === "paid" ? styles.paidBadge : styles.pendingBadge]}>
                  <Text style={[styles.statusText, transaction.status === "paid" ? styles.paidText : styles.pendingText]}>
                    {statusLabel}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.transactionAmount}>
              <Text style={[styles.amountText, isIncome ? styles.incomeAmount : styles.expenseAmount]}>
                {currency(Number(transaction.amount))}
              </Text>
            </View>
          </View>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Carregando...</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { paddingTop: 16 + insets.top }]}>
        <View>
          <Text style={styles.title}>Financeiro</Text>
          <Text style={styles.subtitle}>Visão geral das suas finanças</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => navigation.navigate("TransactionForm")} style={styles.headerIcon}>
            <Ionicons name="add" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("FinanceCategories")} style={styles.headerIcon} accessibilityRole="button" accessibilityLabel="Gerenciar categorias">
            <Ionicons name="settings-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Card style={styles.cardDark}>
          <View style={styles.financialContainer}>
            <Text style={styles.financialTitle}>Financeiro mensal (receitas vs despesas)</Text>
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Receitas</Text>
              <Text style={styles.financialAmount}>{currency(monthIncome)}</Text>
            </View>
            <View style={styles.barBackground}>
              <View style={[styles.barFillGreen, { width: `${Math.max(0, Math.min(100, monthIncome > 0 ? Math.round((monthIncome / Math.max(monthIncome, monthExpense)) * 100) : 0))}%` }]} />
            </View>
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Despesas</Text>
              <Text style={styles.financialAmount}>{currency(monthExpense)}</Text>
            </View>
            <View style={styles.barBackground}>
              <View style={[styles.barFillRed, { width: `${Math.max(0, Math.min(100, monthExpense > 0 ? Math.round((monthExpense / Math.max(monthIncome, monthExpense)) * 100) : 0))}%` }]} />
            </View>
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <Card style={styles.cardDark}>
          <CardHeader>
            <CardTitle>Créditos de Parceiros</CardTitle>
          </CardHeader>
          <CardContent>
            {partnerCredits.length === 0 ? (
              <Text style={styles.listItemSubtitle}>Nenhum crédito disponível</Text>
            ) : (
              partnerCredits.slice(0, 4).map((credit) => (
                <View key={credit.id} style={styles.listItem}>
                  <View style={styles.listItemContent}>
                    <Ionicons name="card-outline" size={20} color="#9ca3af" />
                    <View style={styles.listItemInfo}>
                      <Text style={styles.listItemTitle}>{credit.partner_name}</Text>
                      <Text style={styles.listItemSubtitle}>{credit.credit_type}</Text>
                    </View>
                  </View>
                  <Text style={styles.budgetValue}>{`+ ${currency(Number(credit.credit_amount))}`}</Text>
                </View>
              ))
            )}
          </CardContent>
        </Card>
      </View>

      <View style={styles.section}>
        <Card style={styles.cardDark}>
          <CardHeader>
            <CardTitle>Categorias de Gastos (Mês)</CardTitle>
          </CardHeader>
          <CardContent>
            {expenseCategories.length === 0 ? (
              <Text style={styles.listItemSubtitle}>Sem despesas no mês</Text>
            ) : (
              expenseCategories.map((cat) => (
                <View key={cat.name} style={{ marginBottom: 8 }}>
                  <View style={styles.financialRow}>
                    <Text style={styles.financialLabel}>{cat.name}</Text>
                    <Text style={[styles.financialAmount, styles.expenseAmount]}>{currency(cat.total)}</Text>
                  </View>
                  <View style={styles.barBackground}>
                    <View style={[styles.barFillRed, { width: `${Math.max(5, Math.round((cat.total / Math.max(expenseCategories[0]?.total || 1, 1)) * 100))}%` }]} />
                  </View>
                </View>
              ))
            )}
          </CardContent>
        </Card>
      </View>

      <View style={styles.section}>
        <Card style={styles.cardDark}>
          <CardHeader>
            <CardTitle>Previsão de Fluxo (30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Saldo</Text>
              <Text style={[styles.financialAmount, forecastNext30 >= 0 ? styles.incomeAmount : styles.expenseAmount]}>
                {forecastNext30 >= 0 ? "Positivo" : "Negativo"}
              </Text>
            </View>
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Valor previsto</Text>
              <Text style={styles.financialAmount}>{currency(forecastNext30)}</Text>
            </View>
            <View style={styles.miniBars}>
              {Array.from({ length: 4 }).map((_, idx) => (
                <View key={idx} style={styles.miniBarGroup}>
                  <View style={[styles.miniBar, { height: 10 + ((idx + 1) * 6) }]} />
                  <Text style={styles.miniBarLabel}>{`S${idx + 1}`}</Text>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>
      </View>

      {alerts.length > 0 && (
        <View style={styles.section}>
          <Card style={styles.cardDark}>
            <CardHeader>
              <CardTitle>Alertas de Vencimento</CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.map((alert) => {
                const dueDate = alert.due_date ? new Date(alert.due_date) : null
                const daysDiff = dueDate ? Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0
                const isOverdue = dueDate ? dueDate < today : false
                const label =
                  daysDiff === 0
                    ? 'Vence hoje'
                    : daysDiff === 1
                      ? 'Vence em 1 dia'
                      : daysDiff > 1
                        ? `Vence em ${daysDiff} dias`
                        : daysDiff === -1
                          ? 'Vencido ontem'
                          : `Vencido há ${Math.abs(daysDiff)} dias`
                return (
                  <View key={alert.id} style={[styles.alertRow, isOverdue ? styles.alertRed : styles.alertYellow]}>
                    <View style={styles.listItemContent}>
                      <Ionicons name={isOverdue ? 'close-circle' : 'warning'} size={20} color={isOverdue ? '#ef4444' : '#f59e0b'} />
                      <View style={styles.listItemInfo}>
                        <Text style={styles.listItemTitle}>{alert.description || '(sem descrição)'} </Text>
                        <Text style={styles.listItemSubtitle}>{label}</Text>
                      </View>
                    </View>
                    <Text style={[styles.financialAmount, isOverdue ? styles.expenseAmount : styles.incomeAmount]}>{currency(Number(alert.amount))}</Text>
                  </View>
                )
              })}
            </CardContent>
          </Card>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionRowWithLink}>
          <Text style={styles.sectionTitle}>Transações recentes</Text>
          <TouchableOpacity onPress={() => { setActiveTab("all"); setStatusFilter("all") }}>
            <Text style={styles.linkText}>Ver todas</Text>
          </TouchableOpacity>
        </View>
        <Card style={styles.cardDark}>
          <CardContent>
            {(monthTransactions.slice(0, 3)).map((t) => (
              <View key={t.id} style={styles.listItem}>
                <View style={styles.listItemContent}>
                  <Ionicons name={t.type === "income" ? "arrow-up-circle" : "arrow-down-circle"} size={20} color={t.type === "income" ? "#10B981" : "#EF4444"} />
                  <View style={styles.listItemInfo}>
                    <Text style={styles.listItemTitle}>{t.description || (t.type === "income" ? "Receita" : "Despesa")}</Text>
                    <Text style={styles.listItemSubtitle}>{format(new Date(t.transaction_date), "dd/MM/yyyy", { locale: ptBR })} — {t.type === "income" ? "Receita" : "Despesa"}</Text>
                  </View>
                </View>
                <Text style={[styles.financialAmount, t.type === "income" ? styles.incomeAmount : styles.expenseAmount]}>{`${t.type === 'income' ? '+ ' : '- '}${currency(Number(t.amount))}`}</Text>
              </View>
            ))}
          </CardContent>
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lançamentos do mês</Text>
        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, activeTab === "all" && styles.activeTab]} onPress={() => setActiveTab("all")}>
            <Text style={[styles.tabText, activeTab === "all" && styles.activeTabText]}>Todos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === "income" && styles.activeTab]} onPress={() => setActiveTab("income")}>
            <Text style={[styles.tabText, activeTab === "income" && styles.activeTabText]}>Receitas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === "expense" && styles.activeTab]} onPress={() => setActiveTab("expense")}>
            <Text style={[styles.tabText, activeTab === "expense" && styles.activeTabText]}>Despesas</Text>
          </TouchableOpacity>
        </View>
        {filteredTransactions.length > 0 ? (
          <View style={styles.transactionsList}>
            {filteredTransactions.map((transaction) => (
              <TouchableOpacity key={transaction.id} onPress={() => navigation.navigate("TransactionForm", { transaction })}>
                <TransactionCard transaction={transaction} />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>
              {statusFilter !== "all" 
                ? "Nenhuma transação encontrada com os filtros aplicados." 
                : activeTab === "all" ? "Nenhum lançamento no mês." :
                  activeTab === "income" ? "Nenhuma receita no mês." :
                  "Nenhuma despesa no mês."}
            </Text>
          </View>
        )}
      </View>
      <View style={{ height: 80 }} />
    </ScrollView>
  )
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: c.headerBg,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: c.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: c.textSecondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginLeft: 12,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: c.textPrimary,
    marginBottom: 12,
  },
  sectionRowWithLink: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  linkText: {
    color: c.link,
    fontSize: 13,
    fontWeight: '600',
  },
  cardDark: {
    backgroundColor: c.surface,
    borderColor: c.surface,
    borderWidth: 0,
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
  miniBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 12,
  },
  miniBarGroup: {
    alignItems: 'center',
    width: 28,
  },
  miniBar: {
    width: 18,
    backgroundColor: c.border,
    borderRadius: 4,
    marginBottom: 4,
  },
  miniBarLabel: {
    fontSize: 10,
    color: c.textSecondary,
  },
  alertsCard: {
    backgroundColor: c.surface,
    borderColor: c.surface,
    borderWidth: 0,
  },
  alertRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  alertYellow: {
    backgroundColor: c.warning,
  },
  alertRed: {
    backgroundColor: c.danger,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
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
    color: c.textSecondary,
    marginTop: 2,
  },
  transactionsSection: {
    paddingHorizontal: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: c.border,
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: c.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    color: c.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: c.textPrimary,
  },
  transactionsList: {
    marginBottom: 24,
  },
  transactionCard: {
    backgroundColor: c.surface,
    borderColor: c.surface,
    borderWidth: 0,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  transactionInfo: {
    flex: 1,
    marginRight: 12,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  incomeBadge: {
    backgroundColor: '#064e3b',
  },
  expenseBadge: {
    backgroundColor: '#7f1d1d',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: c.textPrimary,
  },
  incomeText: {
    color: c.success,
  },
  expenseText: {
    color: c.danger,
  },
  incomeAmount: {
    color: c.success,
  },
  expenseAmount: {
    color: c.danger,
  },
  paidBadge: {
    backgroundColor: c.border,
  },
  pendingBadge: {
    backgroundColor: c.warning,
  },
  paidText: {
    color: c.textSecondary,
  },
  pendingText: {
    color: c.warning,
  },
  categoryText: {
    fontSize: 12,
    color: c.textSecondary,
    marginRight: 4,
  },
  separator: {
    fontSize: 12,
    color: c.textSecondary,
    marginHorizontal: 4,
  },
  clientText: {
    fontSize: 12,
    color: c.textSecondary,
  },
  descriptionText: {
    fontSize: 14,
    color: c.textPrimary,
    marginBottom: 8,
  },
  transactionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: c.textSecondary,
    marginLeft: 4,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: c.border,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
    color: c.textPrimary,
  },
  transactionAmount: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amountText: {
    fontSize: 14,
    fontWeight: '700',
    color: c.textPrimary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: c.textSecondary,
    marginTop: 8,
  },
  budgetValue: {
    fontSize: 14,
    fontWeight: '700',
    color: c.textPrimary,
  },
})
