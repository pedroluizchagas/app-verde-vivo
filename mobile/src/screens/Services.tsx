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

type RootStackParamList = {
  Services: undefined
  ServiceForm: { service?: Service } | undefined
}

type ServicesNavigationProp = NativeStackNavigationProp<RootStackParamList, "Services">

interface Service {
  id: string
  name: string
  description: string | null
  default_price: number | null
  created_at: string
}

export function ServicesScreen() {
  const navigation = useNavigation<ServicesNavigationProp>()
  const { user } = useAuth()
  const { colors } = useTheme()
  
  const [services, setServices] = useState<Service[]>([])
  const [filteredServices, setFilteredServices] = useState<Service[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("gardener_id", user?.id)
        .order("name")

      if (error) throw error

      setServices(data || [])
      setFilteredServices(data || [])
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao carregar serviços")
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadServices()
  }, [])

  useEffect(() => {
    const filtered = services.filter(service =>
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (service.description && service.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    setFilteredServices(filtered)
  }, [searchQuery, services])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadServices()
  }, [])

  const handleEditService = (service: Service) => {
    navigation.navigate("ServiceForm", { service })
  }

  const handleDeleteService = async (service: Service) => {
    Alert.alert(
      "Confirmar exclusão",
      `Deseja realmente excluir o serviço "${service.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("services")
                .delete()
                .eq("id", service.id)

              if (error) throw error

              setServices(prev => prev.filter(s => s.id !== service.id))
              Alert.alert("Sucesso", "Serviço excluído com sucesso!")
            } catch (error: any) {
              Alert.alert("Erro", error.message || "Erro ao excluir serviço")
            }
          }
        }
      ]
    )
  }

  const formatPrice = (price: number | null) => {
    if (price === null) return ""
    try {
      return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(price))
    } catch {
      return `R$ ${Number(price).toFixed(2)}`
    }
  }

  const openServiceOptions = (service: Service) => {
    Alert.alert(
      service.name,
      service.description || "",
      [
        { text: "Editar", onPress: () => handleEditService(service) },
        { text: "Excluir", style: "destructive", onPress: () => handleDeleteService(service) },
        { text: "Fechar", style: "cancel" },
      ]
    )
  }

  return (
    <View style={styles(colors).container}>
      <View style={styles(colors).header}>
        <Text style={styles(colors).title}>Serviços</Text>
        <TouchableOpacity onPress={() => setShowSearch((v) => !v)} accessibilityRole="button" accessibilityLabel="Buscar">
          <Ionicons name="search" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {showSearch && (
        <SearchBar
          placeholder="Pesquisar serviços..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles(colors).searchBar}
          variant="dark"
        />
      )}

      <ScrollView
        style={styles(colors).scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredServices.length > 0 ? (
          <View style={styles(colors).servicesList}>
            <Card style={styles(colors).myServicesCard}>
              <View style={styles(colors).myServicesRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles(colors).myServicesTitle}>Meus Serviços</Text>
                  <Text style={styles(colors).myServicesSubtitle}>Gerencie os serviços oferecidos</Text>
                </View>
                <TouchableOpacity
                  style={styles(colors).plusButton}
                  onPress={() => navigation.navigate("ServiceForm")}
                  accessibilityRole="button"
                  accessibilityLabel="Adicionar serviço"
                >
                  <Ionicons name="add" size={22} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </Card>

            {filteredServices.map((service) => (
              <Card key={service.id} style={styles(colors).serviceCard}>
                <View style={styles(colors).serviceHeader}>
                  <View style={styles(colors).serviceInfo}>
                    <Text style={styles(colors).serviceName}>{service.name}</Text>
                    {service.description && (
                      <Text style={styles(colors).serviceDescription} numberOfLines={2}>
                        {service.description}
                      </Text>
                    )}
                  </View>
                  <View style={styles(colors).serviceActions}>
                    <TouchableOpacity onPress={() => handleEditService(service)} style={styles(colors).iconButton} accessibilityRole="button" accessibilityLabel="Editar serviço">
                      <Ionicons name="pencil" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openServiceOptions(service)} style={styles(colors).iconButton} accessibilityRole="button" accessibilityLabel="Mais opções">
                      <Ionicons name="ellipsis-vertical" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>
                {service.default_price !== null && (
                  <Text style={styles(colors).servicePrice}>{formatPrice(service.default_price)}</Text>
                )}
              </Card>
            ))}
          </View>
        ) : (
          <View style={styles(colors).emptyContainer}>
            <Ionicons name="cube-outline" size={48} color={colors.textSecondary} />
            <Text style={styles(colors).emptyText}>
              {searchQuery ? "Nenhum serviço encontrado" : "Nenhum serviço cadastrado"}
            </Text>
            {!searchQuery && (
              <Text style={styles(colors).emptySubtext}>
                Cadastre seus serviços para agilizar a criação de orçamentos
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.bg
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: c.textPrimary,
  },
  searchBar: {
    marginHorizontal: 16,
    marginBottom: 12
  },
  scrollView: {
    flex: 1
  },
  servicesList: {
    padding: 16,
    paddingTop: 8
  },
  myServicesCard: {
    backgroundColor: c.surfaceAlt,
    borderColor: c.border,
    padding: 16,
    marginBottom: 12,
  },
  myServicesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  myServicesTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: c.textPrimary,
    marginBottom: 4,
  },
  myServicesSubtitle: {
    fontSize: 13,
    color: c.textSecondary,
  },
  plusButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: c.success,
    alignItems: "center",
    justifyContent: "center",
  },
  serviceCard: {
    marginBottom: 12,
    padding: 16,
    backgroundColor: c.surfaceAlt,
    borderColor: c.border,
  },
  serviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8
  },
  serviceInfo: {
    flex: 1,
    marginRight: 12
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "700",
    color: c.textPrimary,
    marginBottom: 2
  },
  servicePrice: {
    fontSize: 14,
    color: c.success,
    fontWeight: "700",
    marginTop: 4,
  },
  serviceActions: {
    flexDirection: "row",
    gap: 8
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  serviceDescription: {
    fontSize: 13,
    color: c.textSecondary,
    lineHeight: 20
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
    color: c.textSecondary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center"
  },
  emptySubtext: {
    fontSize: 14,
    color: c.textSecondary,
    textAlign: "center",
    lineHeight: 20
  }
})