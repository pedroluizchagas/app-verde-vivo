import { useState, useEffect, useCallback } from "react"
import { View, Text, StyleSheet, ScrollView, Alert, RefreshControl } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { supabase } from "../supabase"
import { useAuth } from "../contexts/AuthContext"
import { Card } from "../components/Card"
import { Button } from "../components/Button"
import { SearchBar } from "../components/SearchBar"
import Ionicons from "@expo/vector-icons/Ionicons"

type RootStackParamList = {
  Maintenance: undefined
  MaintenancePlanForm: { plan?: MaintenancePlan } | undefined
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
  client: Client
  service: Service | null
}

export function MaintenanceScreen() {
  const navigation = useNavigation<MaintenanceNavigationProp>()
  const { user } = useAuth()
  
  const [plans, setPlans] = useState<MaintenancePlan[]>([])
  const [filteredPlans, setFilteredPlans] = useState<MaintenancePlan[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("maintenance_plans")
        .select(`
          *,
          client:clients(id, name),
          service:services(id, name)
        `)
        .eq("gardener_id", user?.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      const rows = (data || []).map((p: any) => ({
        ...p,
        client: Array.isArray(p.client) ? p.client[0] : p.client,
        service: Array.isArray(p.service) ? p.service[0] : p.service,
      }))
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
    loadPlans()
  }, [])

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

  const handleEditPlan = (plan: MaintenancePlan) => {
    navigation.navigate("MaintenancePlanForm", { plan })
  }

  const handleDeletePlan = async (plan: MaintenancePlan) => {
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

  const handleToggleStatus = async (plan: MaintenancePlan) => {
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
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Manutenções</Text>
          <Text style={styles.subtitle}>
            {filteredPlans.length} plano{filteredPlans.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <Button
          onPress={() => navigation.navigate("MaintenancePlanForm")}
          style={styles.addButton}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </Button>
      </View>

      <SearchBar
        placeholder="Pesquisar planos..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchBar}
      />

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
              <Card key={plan.id} style={styles.planCard}>
                <View style={styles.planHeader}>
                  <View style={styles.planInfo}>
                    <Text style={styles.planTitle}>{plan.title}</Text>
                    <View style={styles.planDetails}>
                      <Text style={styles.clientName}>{plan.client.name}</Text>
                      {plan.service && (
                        <Text style={styles.serviceName}>{plan.service.name}</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.planActions}>
                    <Button
                      variant="ghost"
                      size="small"
                      onPress={() => handleToggleStatus(plan)}
                      style={[styles.statusButton, { backgroundColor: getStatusColor(plan.status) + "20" }]}
                    >
                      <Text style={[styles.statusText, { color: getStatusColor(plan.status) }]}>
                        {getStatusLabel(plan.status)}
                      </Text>
                    </Button>
                    <Button
                      variant="ghost"
                      size="small"
                      onPress={() => handleEditPlan(plan)}
                      style={styles.actionButton}
                    >
                      <Ionicons name="pencil" size={16} color="#3b82f6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="small"
                      onPress={() => handleDeletePlan(plan)}
                      style={styles.actionButton}
                    >
                      <Ionicons name="trash" size={16} color="#ef4444" />
                    </Button>
                  </View>
                </View>
                
                <View style={styles.planCosts}>
                  <View style={styles.costItem}>
                    <Text style={styles.costLabel}>Mão de obra:</Text>
                    <Text style={styles.costValue}>{formatCurrency(plan.default_labor_cost)}</Text>
                  </View>
                  <View style={styles.costItem}>
                    <Text style={styles.costLabel}>Markup:</Text>
                    <Text style={styles.costValue}>{Number(plan.materials_markup_pct)}%</Text>
                  </View>
                </View>
              </Card>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
    paddingBottom: 8
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280"
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    padding: 0
  },
  searchBar: {
    marginHorizontal: 16,
    marginBottom: 8
  },
  scrollView: {
    flex: 1
  },
  plansList: {
    padding: 16,
    paddingTop: 8
  },
  planCard: {
    marginBottom: 12,
    padding: 16
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12
  },
  planInfo: {
    flex: 1,
    marginRight: 12
  },
  planTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4
  },
  planDetails: {
    marginTop: 4
  },
  clientName: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 2
  },
  serviceName: {
    fontSize: 14,
    color: "#6b7280"
  },
  planActions: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center"
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500"
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    padding: 0
  },
  planCosts: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8
  },
  costItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  costLabel: {
    fontSize: 14,
    color: "#6b7280"
  },
  costValue: {
    fontSize: 14,
    color: "#1f2937",
    fontWeight: "500"
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 48,
    marginTop: 32
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center"
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 20
  }
})