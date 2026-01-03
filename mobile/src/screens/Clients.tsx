import { useCallback, useEffect, useState } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Image } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { supabase } from "../supabase"
import { Card, CardContent } from "../components/Card"
import { Button } from "../components/Button"
import { SearchBar } from "../components/SearchBar"
import { Ionicons } from "@expo/vector-icons"
import { useOfflineSync } from "../hooks/useOfflineSync"
import { useTheme } from "../contexts/ThemeContext"
import type { ThemeColors } from "../theme"

interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  avatar_url?: string | null
  created_at: string
}

export function ClientsScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState("")
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()
  const styles = createStyles(colors)
  
  const fetchClients = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []
    const { data, error } = await supabase
      .from("clients")
      .select("id, name, email, phone, address, avatar_url, created_at")
      .eq("gardener_id", user.id)
      .order("name")
    if (error) throw error
    return data || []
  }, [])

  const {
    data: clients,
    loading,
    error,
    isOnline,
    isSyncing,
    refresh,
  } = useOfflineSync<Client[]>("clients", fetchClients)

  const [filteredClients, setFilteredClients] = useState<Client[]>([])

  useEffect(() => {
    filterClients()
  }, [searchQuery, clients])

  const filterClients = () => {
    if (!clients) {
      setFilteredClients([])
      return
    }

    if (!searchQuery.trim()) {
      setFilteredClients(clients)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = clients.filter(client =>
      client.name.toLowerCase().includes(query) ||
      (client.email && client.email.toLowerCase().includes(query)) ||
      (client.phone && client.phone.includes(query)) ||
      (client.address && client.address.toLowerCase().includes(query))
    )
    setFilteredClients(filtered)
  }

  const renderClient = ({ item }: { item: Client }) => (
    <TouchableOpacity 
      style={styles.clientItem}
      onPress={() => navigation.navigate("ClientForm", { client: item })}
    >
      <Card style={styles.clientCard}>
        <CardContent>
          <View style={styles.clientRow}>
            <View style={styles.avatar}>
              {item.avatar_url ? (
                <Image source={{ uri: String(item.avatar_url) }} style={{ width: 40, height: 40, borderRadius: 20 }} />
              ) : (
                <Ionicons name="person" size={20} color="#9ca3af" />
              )}
            </View>
            <View style={styles.clientCol}>
              <Text style={styles.clientName}>{item.name}</Text>
              {item.phone && (
                <View style={styles.clientInfo}>
                  <Text style={styles.clientText}>{item.phone}</Text>
                </View>
              )}
              {item.address && (
                <View style={styles.clientInfo}>
                  <Text style={styles.clientText}>{item.address}</Text>
                </View>
              )}
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </View>
        </CardContent>
      </Card>
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Clientes</Text>
          <Button 
            onPress={() => navigation.navigate("ClientForm")} 
            size="small"
            variant="primary"
          >
            <Ionicons name="add" size={16} color="white" />
            Novo Cliente
          </Button>
        </View>
        <View style={styles.loadingContainer}>
          <Text>Carregando clientes...</Text>
        </View>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Clientes</Text>
          <Button 
            onPress={() => navigation.navigate("ClientForm")} 
            size="small"
            variant="primary"
          >
            <Ionicons name="add" size={16} color="white" />
            Novo Cliente
          </Button>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={32} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <Button onPress={refresh} style={{ marginTop: 16 }}>
            Tentar Novamente
          </Button>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: 16 + insets.top }]}>
        <Text style={styles.title}>Clientes</Text>
        <TouchableOpacity onPress={() => navigation.navigate("ClientForm")}>
          <Ionicons name="add" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <SearchBar
        placeholder="Buscar clientes..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchBar}
        variant="dark"
      />
      
      {filteredClients.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people" size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>
            {searchQuery ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
          </Text>
          <Text style={styles.emptyText}>
            {searchQuery 
              ? "Tente ajustar sua busca" 
              : "Comece adicionando seu primeiro cliente"
            }
          </Text>
          {!searchQuery && (
            <Button 
              onPress={() => navigation.navigate("ClientForm")} 
              style={{ marginTop: 16 }}
            >
              Adicionar Cliente
            </Button>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredClients}
          renderItem={renderClient}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: c.textPrimary,
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  offlineText: {
    fontSize: 12,
    color: c.danger,
    fontWeight: '600',
  },
  syncingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  syncingText: {
    fontSize: 12,
    color: c.success,
    fontWeight: '600',
  },
  searchBar: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  clientItem: {
    marginBottom: 8,
  },
  clientCard: {
    marginVertical: 0,
    backgroundColor: c.surface,
    borderColor: c.surface,
    borderWidth: 0,
  },
  clientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: c.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clientCol: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '700',
    color: c.textPrimary,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  clientText: {
    fontSize: 14,
    color: c.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: c.danger,
    textAlign: 'center',
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: c.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: c.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
})
