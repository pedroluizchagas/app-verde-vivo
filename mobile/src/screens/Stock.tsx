import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { Card, CardHeader, CardTitle, CardContent } from "../components/Card"
import { SearchBar } from "../components/SearchBar"
import { Button } from "../components/Button"
import { useAuth } from "../contexts/AuthContext"
import { supabase } from "../supabase"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useTheme } from "../contexts/ThemeContext"
import type { ThemeColors } from "../theme"

interface Product {
  id: string
  name: string
  unit: string
  cost: number
  min_stock: number
}

interface Movement {
  id: string
  product_id: string
  type: "in" | "out"
  quantity: number
  unit_cost?: number
  movement_date: string
  description?: string
  product?: {
    name: string
    unit: string
  }
}

const number = (v: number) => new Intl.NumberFormat("pt-BR").format(v)
const currency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)

export function StockScreen({ navigation }: any) {
  const { user } = useAuth()
  const { colors } = useTheme()
  const styles = createStyles(colors)
  const [products, setProducts] = useState<Product[]>([])
  const [movements, setMovements] = useState<Movement[]>([])
  const [stockByProduct, setStockByProduct] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"recent" | "outs" | "ins">("recent")
  const [searchQuery, setSearchQuery] = useState("")
  const insets = useSafeAreaInsets()

  useEffect(() => {
    loadStockData()
  }, [])

  const loadStockData = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Fetch products
      const { data: productsData } = await supabase
        .from("products")
        .select("id, name, unit, cost, min_stock")
        .eq("gardener_id", user.id)
        .order("name")

      // Fetch recent movements
      const { data: movementsData } = await supabase
        .from("product_movements")
        .select("id, product_id, type, quantity, movement_date, description, unit_cost, product:products(name, unit)")
        .eq("gardener_id", user.id)
        .order("movement_date", { ascending: false })
        .limit(10)

      // Calculate stock by product
      const productIds = (productsData || []).map((p) => p.id)
      const stockData: Record<string, number> = {}

      if (productIds.length > 0) {
        const { data: allMovements } = await supabase
          .from("product_movements")
          .select("product_id, type, quantity")
          .eq("gardener_id", user.id)
          .in("product_id", productIds)

        ;(allMovements || []).forEach((m) => {
          stockData[m.product_id] = stockData[m.product_id] || 0
          stockData[m.product_id] += m.type === "in" ? Number(m.quantity) : -Number(m.quantity)
        })
      }

      setProducts(productsData || [])
      const movementsMapped = (movementsData || []).map((m: any) => ({
        id: String(m.id),
        product_id: String(m.product_id),
        type: String(m.type) as "in" | "out",
        quantity: Number(m.quantity),
        movement_date: String(m.movement_date),
        description: m.description ? String(m.description) : undefined,
        unit_cost: m.unit_cost != null ? Number(m.unit_cost) : undefined,
        product: Array.isArray(m.product) ? m.product[0] : m.product,
      }))
      setMovements(movementsMapped)
      setStockByProduct(stockData)
    } catch (error) {
      console.error("Error loading stock data:", error)
    } finally {
      setLoading(false)
    }
  }

  const totalProducts = products.length
  const lowStockProducts = products.filter((p) => (stockByProduct[p.id] || 0) < Number(p.min_stock))
  const totalLowStock = lowStockProducts.length

  const ProductCard = ({ product }: { product: Product }) => {
    const stock = stockByProduct[product.id] || 0
    const isLow = stock < Number(product.min_stock)

    return (
      <Card style={styles.listCard}>
        <CardContent>
          <View style={styles.productRow}>
            <View style={styles.productThumb}>
              <Ionicons name="cube" size={20} color="#9ca3af" />
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productDetails}>Em estoque: <Text style={styles.stockInline}>{number(stock)}</Text></Text>
            </View>
            <View style={styles.productActions}>
              <TouchableOpacity style={styles.qtyButton} onPress={() => navigation.navigate("MovementForm", { product, type: "out" })}>
                <Text style={styles.qtyButtonText}>-</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.qtyButton} onPress={() => navigation.navigate("MovementForm", { product, type: "in" })}>
                <Text style={styles.qtyButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </CardContent>
      </Card>
    )
  }

  const MovementCard = ({ movement }: { movement: Movement }) => {
    const isIn = movement.type === "in"
    const typeLabel = isIn ? "Entrada" : "Saída"

    return (
      <Card style={styles.listCard}>
        <CardContent>
          <View style={styles.movementRow}>
            <View style={[styles.dot, isIn ? styles.dotIn : styles.dotOut]} />
            <View style={styles.movementInfo}>
              <Text style={styles.movementTitle}>{movement.product?.name}</Text>
              <Text style={styles.movementDate}>{format(new Date(movement.movement_date), "dd/MM/yyyy, HH:mm", { locale: ptBR })}</Text>
            </View>
            <Text style={[styles.qtyDelta, isIn ? styles.inType : styles.outType]}>{`${isIn ? "+" : "-"}${number(Number(movement.quantity))} ${movement.product?.unit}`}</Text>
          </View>
        </CardContent>
      </Card>
    )
  }

  const filteredMovements = movements.filter((movement) => {
    if (activeTab === "recent") return true
    const tabType = activeTab === "outs" ? "out" : "in"
    return movement.type === tabType
  })

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Carregando...</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }] }>
        <Text style={styles.title}>Gestão de Estoque</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => navigation.navigate("ProductForm")} style={styles.headerIcon}>
            <Ionicons name="add" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="ellipsis-vertical" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.divider} />

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <Card style={styles.summaryCardDark}>
          <CardHeader>
            <CardTitle color="#9ca3af">Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <Text style={[styles.summaryValue, styles.summaryValueLight]}>{totalProducts}</Text>
            <Text style={styles.summaryLabel}>Cadastrados</Text>
          </CardContent>
        </Card>

        <Card style={[styles.summaryCardDark, styles.summaryWarn] }>
          <CardHeader>
            <CardTitle>Estoque baixo</CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.lowStockRow}>
              <Text style={[styles.summaryValue, styles.warnValue]}>{totalLowStock}</Text>
              <Ionicons name="warning" size={18} color="#f59e0b" />
            </View>
            <Text style={styles.summaryLabel}>Abaixo do mínimo</Text>
          </CardContent>
        </Card>
      </View>


      {/* Recent Movements Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Últimas entradas/saídas</Text>
        
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "recent" && styles.activeTab]}
            onPress={() => setActiveTab("recent")}
          >
            <Text style={[styles.tabText, activeTab === "recent" && styles.activeTabText]}>Recentes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "outs" && styles.activeTab]}
            onPress={() => setActiveTab("outs")}
          >
            <Text style={[styles.tabText, activeTab === "outs" && styles.activeTabText]}>Saídas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "ins" && styles.activeTab]}
            onPress={() => setActiveTab("ins")}
          >
            <Text style={[styles.tabText, activeTab === "ins" && styles.activeTabText]}>Entradas</Text>
          </TouchableOpacity>
        </View>

        {/* Movements List */}
        {filteredMovements.length > 0 ? (
          <View style={styles.movementsList}>
            {filteredMovements.map((movement) => (
              <MovementCard key={movement.id} movement={movement} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="swap-horizontal-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>
              {activeTab === "recent" ? "Sem movimentações." :
               activeTab === "outs" ? "Sem saídas." :
               "Sem entradas."}
            </Text>
          </View>
        )}

        {/* Add Movement Button */}
        <Button
          variant="outline"
          onPress={() => navigation.navigate("MovementForm")}
          style={{ marginTop: 16 }}
        >
          Nova Movimentação
        </Button>
      </View>

      {/* Products Section */}
      <View style={styles.section}>
        <View style={styles.sectionRowWithLink}>
          <Text style={styles.sectionTitle}>Todos os Produtos</Text>
          <TouchableOpacity>
            <Text style={styles.linkText}>Ver todos</Text>
          </TouchableOpacity>
        </View>
        <SearchBar
          placeholder="Buscar no estoque..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchBar}
          variant="dark"
        />
        {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
          <View style={styles.productsList}>
            {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((product) => (
              <TouchableOpacity
                key={product.id}
                onPress={() => navigation.navigate("ProductForm", { product })}
              >
                <ProductCard product={product} />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>Nenhum produto cadastrado.</Text>
            <Button
              variant="outline"
              onPress={() => navigation.navigate("ProductForm")}
              style={{ marginTop: 16 }}
            >
              Cadastrar Produto
            </Button>
          </View>
        )}
      </View>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: c.divider,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    columnGap: 12,
  },
  summaryCardDark: {
    flex: 1,
    backgroundColor: c.surface,
    borderColor: c.surface,
    borderWidth: 0,
  },
  summaryWarn: {
    borderWidth: 1,
    borderColor: c.warning,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryValueLight: {
    color: c.textPrimary,
  },
  summaryLabel: {
    fontSize: 12,
    color: c.textSecondary,
  },
  lowStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  warnValue: {
    color: c.warning,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: c.textPrimary,
    marginBottom: 12,
  },
  sectionRowWithLink: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  linkText: {
    color: c.link,
    fontSize: 13,
    fontWeight: '600',
  },
  searchBar: {
    marginTop: 8,
    marginBottom: 12,
  },
  productsList: {
    marginBottom: 16,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listCard: {
    backgroundColor: c.surface,
    borderColor: c.surface,
    borderWidth: 0,
    marginBottom: 8,
  },
  productThumb: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: c.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: c.textPrimary,
    marginBottom: 4,
  },
  productDetails: {
    fontSize: 12,
    color: c.textSecondary,
  },
  stockInline: {
    color: c.link,
    fontWeight: '700',
  },
  productActions: {
    flexDirection: 'row',
    columnGap: 8,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: c.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyButtonText: {
    color: c.textPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
  productStats: {
    alignItems: "flex-end",
  },
  stockValue: {
    fontSize: 16,
    fontWeight: '700',
    color: c.textPrimary,
    marginBottom: 2,
  },
  costValue: {
    fontSize: 12,
    color: c.textSecondary,
    marginBottom: 4,
  },
  lowStockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.danger,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    columnGap: 2,
  },
  lowStockText: {
    fontSize: 10,
    color: c.textPrimary,
    fontWeight: '700',
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
  movementsList: {
    marginBottom: 16,
  },
  movementRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
  },
  dotIn: {
    backgroundColor: '#14532d',
    borderWidth: 1,
    borderColor: c.success,
  },
  dotOut: {
    backgroundColor: '#3f1d1d',
    borderWidth: 1,
    borderColor: c.danger,
  },
  movementInfo: {
    flex: 1,
    marginRight: 12,
  },
  movementTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: c.textPrimary,
    marginBottom: 2,
  },
  movementDescription: {
    fontSize: 12,
    color: c.textSecondary,
    marginBottom: 2,
  },
  movementDate: {
    fontSize: 12,
    color: c.textSecondary,
  },
  movementStats: {
    alignItems: "flex-end",
  },
  movementType: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  inType: {
    color: c.success,
  },
  outType: {
    color: c.danger,
  },
  qtyDelta: {
    fontSize: 14,
    fontWeight: '700',
  },
  unitCost: {
    fontSize: 11,
    color: c.textSecondary,
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
})