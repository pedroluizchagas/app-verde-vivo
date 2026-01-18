import React, { useEffect } from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { Modal, Pressable, Text, View, Platform, ScrollView, Image, ActivityIndicator } from "react-native"
import * as Notifications from "expo-notifications"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { AuthProvider, useAuth } from "./src/contexts/AuthContext"
import { ThemeProvider, useTheme } from "./src/contexts/ThemeContext"
import { NotificationService } from "./src/services/notificationService"
import { HomeScreen } from "./src/screens/Home"
import { ClientsScreen } from "./src/screens/Clients"
import { ClientForm } from "./src/screens/ClientForm"
import { LoginScreen } from "./src/screens/Login"
import { SignUpScreen } from "./src/screens/SignUp"
import { ScheduleScreen } from "./src/screens/Schedule"
import { AppointmentForm } from "./src/screens/AppointmentForm"
import TasksScreen from "./src/screens/Tasks"
import NotesScreen from "./src/screens/Notes"
import { NoteForm } from "./src/screens/NoteForm"
import BudgetsScreen from "./src/screens/Budgets"
import { BudgetForm } from "./src/screens/BudgetForm"
import { FinanceScreen } from "./src/screens/Finance"
import { TransactionForm } from "./src/screens/TransactionForm"
import { FinanceCategoriesScreen } from "./src/screens/FinanceCategories"
import { StockScreen } from "./src/screens/Stock"
import { ProductForm } from "./src/screens/ProductForm"
import { MovementForm } from "./src/screens/MovementForm"
import { WorkOrdersScreen } from "./src/screens/WorkOrders"
import { WorkOrderForm } from "./src/screens/WorkOrderForm"
import { WorkOrderDetailScreen } from "./src/screens/WorkOrderDetail"
import { WorkOrderEditForm } from "./src/screens/WorkOrderEditForm"
import { MaintenanceScreen } from "./src/screens/Maintenance"
import { MaintenancePlanForm } from "./src/screens/MaintenancePlanForm"
import { MaintenanceDetailScreen } from "./src/screens/MaintenanceDetail"
import { TaskForm } from "./src/screens/TaskForm"
import { AssistantScreen } from "./src/screens/Assistant"
import { ChatGPTScreen } from "./src/screens/ChatGPT"
import { GeminiScreen } from "./src/screens/Gemini"
import { ProfileScreen } from "./src/screens/Profile"
import { ChangePasswordScreen } from "./src/screens/ChangePassword"
import { Ionicons } from "@expo/vector-icons"

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

// Setup notification handler
NotificationService.setupNotificationHandler()

function MainTabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <MyTabBar {...props} />}>
      {/* Visíveis via barra custom: apenas Home */}
      <Tab.Screen name="Início" component={HomeScreen} />
      {/* Registrados para navegação via popup */}
      <Tab.Screen name="Clientes" component={ClientsScreen} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="Agenda" component={ScheduleScreen} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="Orçamentos" component={BudgetsScreen} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="Notas" component={NotesScreen} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="Tarefas" component={TasksScreen} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="Financeiro" component={FinanceScreen} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="Estoque" component={StockScreen} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="Ordens de serviço" component={WorkOrdersScreen} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="Manutenções" component={MaintenanceScreen} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="Assistente" component={AssistantScreen} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="Perfil" component={ProfileScreen} options={{ tabBarButton: () => null }} />
    </Tab.Navigator>
  )
}

function AppNavigator() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0b0f13' }}>
        <Image source={require('./assets/iris.png')} style={{ width: 180, aspectRatio: 662/288, resizeMode: 'contain' }} />
        <ActivityIndicator size="small" color="#22c55e" style={{ marginTop: 12 }} />
      </View>
    )
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen name="ClientForm" component={ClientForm} />
            <Stack.Screen name="AppointmentForm" component={AppointmentForm} />
            <Stack.Screen name="TransactionForm" component={TransactionForm} />
            <Stack.Screen name="FinanceCategories" component={FinanceCategoriesScreen} />
            <Stack.Screen name="ProductForm" component={ProductForm} />
            <Stack.Screen name="MovementForm" component={MovementForm} />
            <Stack.Screen name="BudgetForm" component={BudgetForm} />
            <Stack.Screen name="WorkOrderForm" component={WorkOrderForm} />
            <Stack.Screen name="WorkOrderDetail" component={WorkOrderDetailScreen} />
            <Stack.Screen name="WorkOrderEditForm" component={WorkOrderEditForm} />
            <Stack.Screen name="MaintenancePlanForm" component={MaintenancePlanForm} />
            <Stack.Screen name="MaintenanceDetail" component={MaintenanceDetailScreen} />
            <Stack.Screen name="TaskForm" component={TaskForm} />
            <Stack.Screen name="NoteForm" component={NoteForm} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            <Stack.Screen name="ChatGPT" component={ChatGPTScreen} />
            <Stack.Screen name="Gemini" component={GeminiScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default function App() {
  useEffect(() => {
    const setup = async () => {
      // Request notification permissions
      const hasPermission = await NotificationService.requestPermissions()
      
      if (!hasPermission) {
        console.warn("Notification permission not granted")
      }
      
      // Setup Android notification channel
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Default",
          importance: Notifications.AndroidImportance.MAX,
        })
      }
    }
    setup()
  }, [])

  return (
    <ThemeProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </ThemeProvider>
  )
}

function MyTabBar({ state, navigation }: any) {
  const [moreOpen, setMoreOpen] = React.useState(false)
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const go = (name: string) => {
    setMoreOpen(false)
    navigation.navigate(name)
  }
  const isActive = (name: string) => state?.routeNames?.[state.index] === name
  const activeColor = colors.link
  const inactiveColor = colors.textSecondary
  const moreItems = [
    { label: "Clientes", icon: "people-outline", route: "Clientes" },
    { label: "Orçamentos", icon: "document-text-outline", route: "Orçamentos" },
    { label: "Tarefas", icon: "checkbox-outline", route: "Tarefas" },
    { label: "Notas", icon: "book-outline", route: "Notas" },
    { label: "Estoque", icon: "cube-outline", route: "Estoque" },
    { label: "Ordens de serviço", icon: "receipt-outline", route: "Ordens de serviço" },
    { label: "Manutenções", icon: "build-outline", route: "Manutenções" },
  ]
  const bottomInset = Platform.OS === "android" ? insets.bottom : 0
  return (
    <View style={{ borderTopWidth: 1, borderColor: colors.divider, backgroundColor: colors.bg, paddingBottom: bottomInset }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingVertical: 8 }}>
        <Pressable style={{ flex: 1, alignItems: "center", paddingVertical: 10 }} onPress={() => go("Início")}> 
          <Ionicons name="home" color={isActive("Início") ? activeColor : inactiveColor} size={22} />
          <Text style={{ fontSize: 12, color: isActive("Início") ? activeColor : inactiveColor }}>Início</Text>
        </Pressable>
        <Pressable style={{ flex: 1, alignItems: "center", paddingVertical: 10 }} onPress={() => go("Agenda")}> 
          <Ionicons name="calendar" color={isActive("Agenda") ? activeColor : inactiveColor} size={22} />
          <Text style={{ fontSize: 12, color: isActive("Agenda") ? activeColor : inactiveColor }}>Agenda</Text>
        </Pressable>
        <Pressable style={{ flex: 1, alignItems: "center", paddingVertical: 10 }} onPress={() => go("Assistente")}> 
          <Ionicons name="chatbubbles-outline" color={isActive("Assistente") ? activeColor : inactiveColor} size={22} />
          <Text style={{ fontSize: 12, color: isActive("Assistente") ? activeColor : inactiveColor }}>Assistente</Text>
        </Pressable>
        <Pressable style={{ flex: 1, alignItems: "center", paddingVertical: 10 }} onPress={() => go("Financeiro")}> 
          <Ionicons name="cash-outline" color={isActive("Financeiro") ? activeColor : inactiveColor} size={22} />
          <Text style={{ fontSize: 12, color: isActive("Financeiro") ? activeColor : inactiveColor }}>Financeiro</Text>
        </Pressable>
        <Pressable style={{ flex: 1, alignItems: "center", paddingVertical: 10 }} onPress={() => setMoreOpen(true)}> 
          <Ionicons name="ellipsis-horizontal" color={moreOpen ? activeColor : inactiveColor} size={22} />
          <Text style={{ fontSize: 12, color: moreOpen ? activeColor : inactiveColor }}>Mais</Text>
        </Pressable>
      </View>

      <Modal visible={moreOpen} transparent animationType="fade" onRequestClose={() => setMoreOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: colors.overlay }} onPress={() => setMoreOpen(false)} />
        <View style={{ position: "absolute", left: 0, right: 0, bottom: 72 + bottomInset }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            <View style={{ flexDirection: "row", backgroundColor: colors.surface, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 10 }}>
              {moreItems.map((item) => (
                <MoreItem key={item.route} label={item.label} icon={item.icon as any} onPress={() => go(item.route)} />
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  )
}

function MoreItem({ label, icon, onPress }: { label: string; icon: string; onPress: () => void }) {
  const { colors } = useTheme()
  return (
    <Pressable onPress={onPress} style={{ width: 92, alignItems: "center", paddingVertical: 8, marginHorizontal: 6 }}>
      <View style={{ width: 64, height: 64, borderRadius: 12, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name={icon as any} size={28} color={colors.textPrimary} />
      </View>
      <Text style={{ fontSize: 12, color: colors.textPrimary, marginTop: 6 }}>{label}</Text>
    </Pressable>
  )
}
