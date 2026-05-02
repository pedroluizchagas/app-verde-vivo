import { useEffect, useState, useCallback, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  BackHandler,
  Platform,
  AppState,
  type AppStateStatus,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useFocusEffect, useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { supabase } from "../supabase"
import { useAuth } from "../contexts/AuthContext"
import { useTheme } from "../contexts/ThemeContext"
import { useSubscriptionAccess } from "../contexts/SubscriptionAccessContext"
import { getBackendApiBase } from "../utils/apiBase"
import type { ThemeColors } from "../theme"

type Plan = "basic" | "plus"

interface SubscriptionStatus {
  plan: string | null
  trial_ends_at?: string | null
  trial_days_left?: number
  subscription: {
    id: string
    plan: string
    status: string
    current_period_end: string | null
  } | null
}

const PLAN_CONFIG = [
  {
    id: "basic" as Plan,
    name: "Basico",
    price: "R$ 47,90",
    period: "/mes",
    description: "Todas as ferramentas essenciais para gerenciar seu negocio de jardinagem.",
    features: [
      "Clientes ilimitados",
      "Agenda e agendamentos",
      "Financeiro e fluxo de caixa",
      "Estoque e produtos",
      "Orcamentos e ordens de servico",
      "Planos de manutencao",
      "Notas e tarefas",
    ],
    notIncluded: ["Assistente Iris com IA"],
    accent: false,
  },
  {
    id: "plus" as Plan,
    name: "Plus",
    price: "R$ 77,90",
    period: "/mes",
    description: "Tudo do Basico mais o assistente Iris para agilizar seu dia a dia.",
    features: [
      "Tudo do plano Basico",
      "Assistente Iris com IA",
      "Comandos por texto e por voz",
      "Agendamento por comando de voz",
      "Lancamento financeiro por voz",
      "Gestao de estoque por voz",
    ],
    notIncluded: [],
    accent: true,
  },
] as const

const STATUS_DISPLAY: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  active: { label: "Ativo", icon: "checkmark-circle", color: "#22c55e" },
  pending: { label: "Aguardando pagamento", icon: "time-outline", color: "#f59e0b" },
  overdue: { label: "Pagamento em atraso", icon: "alert-circle-outline", color: "#ef4444" },
  cancelled: { label: "Cancelado", icon: "close-circle-outline", color: "#6b7280" },
  inactive: { label: "Inativo", icon: "close-circle-outline", color: "#6b7280" },
}

async function getFreshAccessToken(): Promise<string | null> {
  const { data: sessionData } = await supabase.auth.getSession()
  const session = sessionData?.session

  if (session) {
    // Verifica se o access_token esta expirado ou vai expirar nos proximos 30s
    const expiresAt = session.expires_at ?? 0
    const isExpiredOrExpiringSoon = Date.now() / 1000 >= expiresAt - 30

    if (!isExpiredOrExpiringSoon) return session.access_token
  }

  // Token ausente ou expirado: tenta renovar via refresh token
  const { data: refreshData } = await supabase.auth.refreshSession()
  return refreshData?.session?.access_token ?? null
}

function parseJsonObject(raw: string): Record<string, unknown> {
  const t = raw.trim()
  if (!t) return {}
  try {
    const v = JSON.parse(t) as unknown
    return v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

function describeCheckoutFailure(
  res: Response,
  data: Record<string, unknown>,
  raw: string,
  context: "checkout" | "reopen" = "checkout"
): string {
  const msg = typeof data.message === "string" ? data.message : ""
  if (msg) return msg
  const err = typeof data.error === "string" ? data.error : ""
  if (err === "not_authenticated" || res.status === 401) {
    return "Sessao expirada ou token invalido. Faca login novamente."
  }
  if (err === "invalid_plan") {
    return "Plano invalido. Escolha Basico ou Plus."
  }
  if (err === "profile_not_found") {
    return "Perfil nao encontrado. Tente sair e entrar de novo."
  }
  if (err === "email_required") {
    return "E-mail obrigatorio para cobranca. Associe um e-mail a conta ou use login com e-mail."
  }
  if (err === "payment_link_unavailable") {
    return "Nao foi possivel obter o link de pagamento. Tente novamente ou acesse pelo site."
  }
  if (err.length > 0) {
    return err.length > 400 ? err.slice(0, 397) + "..." : err
  }
  const plain = raw.trim()
  if (plain && !plain.startsWith("<") && plain.length < 600) {
    return plain.length > 350 ? plain.slice(0, 347) + "..." : plain
  }
  if (res.status >= 500) {
    return `Erro no servidor (${res.status}). Tente de novo em instantes.`
  }
  return context === "reopen"
    ? `Nao foi possivel recuperar o link de pagamento (HTTP ${res.status}).`
    : `Nao foi possivel iniciar a assinatura (HTTP ${res.status}).`
}

export function PlanScreen() {
  const navigation = useNavigation<any>()
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()
  const styles = createStyles(colors)
  const { refreshAccess } = useSubscriptionAccess()
  const { signOut, user: authUser } = useAuth()

  const navigateToProfile = () => {
    const names = navigation.getState()?.routeNames ?? []
    if (names.includes("Profile")) {
      navigation.navigate("Profile")
    } else {
      navigation.navigate("Main" as never, { screen: "Perfil" } as never)
    }
  }

  const handleSignOutPress = () => {
    Alert.alert(
      "Sair da conta",
      "Voce podera entrar novamente com o mesmo e-mail e senha. Use se a sessao estiver invalida ou quiser trocar de usuario.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut()
            } catch (e: unknown) {
              const m = e instanceof Error ? e.message : String(e ?? "")
              Alert.alert("Erro", m || "Nao foi possivel sair. Tente de novo.")
            }
          },
        },
      ]
    )
  }

  const [status, setStatus] = useState<SubscriptionStatus | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [subscribing, setSubscribing] = useState<Plan | null>(null)
  const subscribingRef = useRef(false)

  const fetchStatus = useCallback(async () => {
    setLoadingStatus(true)
    try {
      const token = await getFreshAccessToken()
      if (!token) {
        setStatus(null)
        return
      }

      const base = getBackendApiBase()
      const res = await fetch(`${base}/api/subscription/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-supabase-access-token": `Bearer ${token}`,
        },
      })
      const raw = await res.text()
      console.log("[Plan] status response:", res.status, raw.substring(0, 200))
      if (!res.ok) {
        setStatus(null)
        return
      }
      let parsed: unknown
      try {
        parsed = JSON.parse(raw) as unknown
      } catch {
        setStatus(null)
        return
      }
      if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
        setStatus(null)
        return
      }
      const data = parsed as SubscriptionStatus
      setStatus({
        plan: data.plan ?? null,
        trial_ends_at: data.trial_ends_at ?? null,
        trial_days_left: data.trial_days_left ?? 0,
        subscription: data.subscription ?? null,
      })
    } catch {
      setStatus(null)
    } finally {
      setLoadingStatus(false)
    }
  }, [authUser?.id])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
      if (next === "active") {
        void fetchStatus()
        void refreshAccess()
      }
    })
    return () => sub.remove()
  }, [fetchStatus, refreshAccess])

  useFocusEffect(
    useCallback(() => {
      void refreshAccess()
      navigation.setOptions({
        gestureEnabled: navigation.canGoBack(),
      })
    }, [navigation, refreshAccess])
  )

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        if (navigation.canGoBack()) {
          navigation.goBack()
          return true
        }
        return true
      })
      return () => sub.remove()
    }, [navigation])
  )

  const handleHeaderBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    }
  }, [navigation])

  const handleSubscribe = async (plan: Plan) => {
    if (subscribingRef.current) return
    subscribingRef.current = true
    setSubscribing(plan)
    try {
      const token = await getFreshAccessToken()
      if (!token) {
        Alert.alert("Erro", "Sessao expirada. Faca login novamente.")
        return
      }

      const base = getBackendApiBase()
      console.log("[Plan] checkout request ->", base, "token length:", token.length, "plan:", plan)

      const res = await fetch(`${base}/api/subscription/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-supabase-access-token": `Bearer ${token}`,
        },
        body: JSON.stringify({ plan }),
      })

      const raw = await res.text()
      const data = parseJsonObject(raw)

      console.log("[Plan] checkout response <-", res.status, JSON.stringify(data).substring(0, 300))

      if (!res.ok) {
        if (data.error === "email_required") {
          Alert.alert(
            "E-mail necessario",
            (data.message as string) ??
              "O pagamento exige um e-mail na conta. Use login com e-mail ou atualize seus dados."
          )
          return
        }
        Alert.alert("Erro", describeCheckoutFailure(res, data, raw))
        return
      }

      const paymentUrlCheckout = typeof data.paymentUrl === "string" ? data.paymentUrl : ""
      if (!paymentUrlCheckout) {
        Alert.alert(
          "Erro",
          "Resposta sem link de pagamento. Tente novamente ou acesse pelo site."
        )
        return
      }
      const canOpen = await Linking.canOpenURL(paymentUrlCheckout)
      if (canOpen) {
        await Linking.openURL(paymentUrlCheckout)
      } else {
        Alert.alert("Erro", "Nao foi possivel abrir a pagina de pagamento.")
      }
    } catch (err: any) {
      const msg = String(err?.message ?? err ?? "")
      const base = getBackendApiBase()
      const isNet = /network request failed|failed to fetch|networkerror/i.test(msg)
      if (typeof __DEV__ !== "undefined" && __DEV__ && isNet) {
        Alert.alert(
          "Sem conexao com a API",
          `Nao foi possivel acessar ${base}. No celular, localhost nao aponta para o PC. Inicie o Next com host na rede (ex.: npx next dev -H 0.0.0.0 -p 3000) e defina EXPO_PUBLIC_APP_URL=http://SEU_IP:3000 no .env do mobile.`
        )
      } else {
        Alert.alert("Erro", msg || "Erro inesperado.")
      }
    } finally {
      subscribingRef.current = false
      setSubscribing(null)
    }
  }

  const handleReopenPayment = async () => {
    if (!status?.subscription || subscribingRef.current) return
    subscribingRef.current = true
    setSubscribing(status.subscription.plan as Plan)
    try {
      const token = await getFreshAccessToken()
      if (!token) {
        Alert.alert("Erro", "Sessao expirada. Faca login novamente.")
        return
      }

      const base = getBackendApiBase()
      const res = await fetch(`${base}/api/subscription/reopen-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-supabase-access-token": `Bearer ${token}`,
        },
      })
      const rawReopen = await res.text()
      const dataReopen = parseJsonObject(rawReopen)
      if (!res.ok) {
        Alert.alert("Erro", describeCheckoutFailure(res, dataReopen, rawReopen, "reopen"))
        return
      }
      const paymentUrlReopen = typeof dataReopen.paymentUrl === "string" ? dataReopen.paymentUrl : ""
      if (paymentUrlReopen) {
        const canOpen = await Linking.canOpenURL(paymentUrlReopen)
        if (canOpen) {
          await Linking.openURL(paymentUrlReopen)
        } else {
          Alert.alert("Erro", "Nao foi possivel abrir a pagina de pagamento.")
        }
      }
    } catch (err: any) {
      const msg = String(err?.message ?? err ?? "")
      const base = getBackendApiBase()
      const isNet = /network request failed|failed to fetch|networkerror/i.test(msg)
      if (typeof __DEV__ !== "undefined" && __DEV__ && isNet) {
        Alert.alert(
          "Sem conexao com a API",
          `Nao foi possivel acessar ${base}. Confirme o Next na porta 3000 acessivel na rede Wi-Fi e EXPO_PUBLIC_APP_URL no .env do mobile.`
        )
      } else {
        Alert.alert("Erro", msg || "Erro inesperado.")
      }
    } finally {
      subscribingRef.current = false
      setSubscribing(null)
    }
  }

  const currentPlan = status?.plan ?? null
  const sub = status?.subscription ?? null
  const statusInfo = sub ? STATUS_DISPLAY[sub.status] : null
  const periodEnd = sub?.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString("pt-BR")
    : null

  const trialDaysLeft = status?.trial_days_left ?? 0
  const trialEndsAt = status?.trial_ends_at ?? null
  const trialActive = !currentPlan && trialDaysLeft > 0
  const trialEndDate = trialEndsAt ? new Date(trialEndsAt).toLocaleDateString("pt-BR") : null

  const showBack = navigation.canGoBack()

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        {showBack ? (
          <TouchableOpacity onPress={handleHeaderBack} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Voltar">
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backButton} />
        )}
        <Text style={styles.headerTitle}>Plano e Pagamento</Text>
        <TouchableOpacity onPress={fetchStatus} style={styles.refreshButton} disabled={loadingStatus}>
          {loadingStatus ? (
            <ActivityIndicator size="small" color={colors.textSecondary} />
          ) : (
            <Ionicons name="refresh-outline" size={20} color={colors.textSecondary} />
          )}
        </TouchableOpacity>
      </View>

      <View style={[styles.accountBar, { borderBottomColor: colors.divider, backgroundColor: colors.headerBg }]}>
        <TouchableOpacity
          style={styles.accountBarBtn}
          onPress={navigateToProfile}
          accessibilityRole="button"
          accessibilityLabel="CPF e perfil"
        >
          <Ionicons name="id-card-outline" size={18} color={colors.link} />
          <Text style={[styles.accountBarLabel, { color: colors.link }]}>CPF e perfil</Text>
        </TouchableOpacity>
        <View style={[styles.accountBarDivider, { backgroundColor: colors.divider }]} />
        <TouchableOpacity
          style={styles.accountBarBtn}
          onPress={handleSignOutPress}
          accessibilityRole="button"
          accessibilityLabel="Sair da conta"
        >
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text style={[styles.accountBarLabel, { color: colors.danger }]}>Sair</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {trialActive && (
          <View style={[styles.trialBanner, { borderColor: colors.warning + "50", backgroundColor: colors.warning + "12" }]}>
            <Ionicons name="time-outline" size={18} color={colors.warning} />
            <View style={styles.trialBannerTextWrap}>
              <Text style={[styles.trialBannerTitle, { color: colors.warning }]}>
                Periodo de teste: {trialDaysLeft} {trialDaysLeft === 1 ? "dia restante" : "dias restantes"}
                {trialEndDate ? ` · Expira em ${trialEndDate}` : ""}
              </Text>
              <Text style={[styles.trialBannerSub, { color: colors.textSecondary }]}>
                Assine um plano para continuar apos o periodo de teste.
              </Text>
            </View>
          </View>
        )}

        {/* Status da assinatura atual */}
        {sub && statusInfo && (
          <View style={[styles.statusCard, { borderColor: statusInfo.color + "40", backgroundColor: statusInfo.color + "10" }]}>
            <Ionicons name={statusInfo.icon} size={18} color={statusInfo.color} />
            <View style={styles.statusCardContent}>
              <Text style={[styles.statusLabel, { color: statusInfo.color }]}>
                {statusInfo.label}
                {sub.plan === "basic" ? " — Plano Basico" : sub.plan === "plus" ? " — Plano Plus" : ""}
              </Text>
              {periodEnd && sub.status === "active" && (
                <Text style={[styles.statusSub, { color: statusInfo.color + "99" }]}>
                  Proximo vencimento: {periodEnd}
                </Text>
              )}
              {sub.status === "pending" && (
                <Text style={[styles.statusSub, { color: statusInfo.color + "99" }]}>
                  Complete o pagamento para ativar seu plano
                </Text>
              )}
              {sub.status === "overdue" && (
                <Text style={[styles.statusSub, { color: statusInfo.color + "99" }]}>
                  Regularize o pagamento para manter o acesso
                </Text>
              )}
            </View>
            {(sub.status === "pending" || sub.status === "overdue") && (
              <TouchableOpacity
                onPress={handleReopenPayment}
                disabled={subscribing !== null}
                style={styles.statusAction}
              >
                {subscribing === sub.plan ? (
                  <ActivityIndicator size="small" color={statusInfo.color} />
                ) : (
                  <Text style={[styles.statusActionText, { color: statusInfo.color }]}>Pagar</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Titulo */}
        <Text style={styles.sectionTitle}>Escolha seu plano</Text>
        <Text style={styles.sectionSubtitle}>
          Pague com cartao de credito ou debito. Cancele quando quiser.
        </Text>

        {/* Cards de plano */}
        {PLAN_CONFIG.map((plan) => {
          const isCurrent = currentPlan === plan.id
          const isLoading = subscribing === plan.id
          const anyLoading = subscribing !== null

          return (
            <View
              key={plan.id}
              style={[
                styles.planCard,
                plan.accent && !isCurrent && styles.planCardAccent,
                isCurrent && styles.planCardCurrent,
              ]}
            >
              {plan.accent && !isCurrent && (
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>RECOMENDADO</Text>
                </View>
              )}
              {isCurrent && (
                <View style={[styles.recommendedBadge, styles.currentBadge]}>
                  <Text style={[styles.recommendedText, { color: colors.success }]}>PLANO ATUAL</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <View style={styles.planTitleRow}>
                  {plan.accent && (
                    <Ionicons name="sparkles" size={16} color={colors.link} style={{ marginRight: 6 }} />
                  )}
                  <Text style={styles.planName}>{plan.name}</Text>
                </View>
                <View style={styles.planPriceRow}>
                  <Text style={styles.planPrice}>{plan.price}</Text>
                  <Text style={styles.planPeriod}>{plan.period}</Text>
                </View>
                <Text style={styles.planDescription}>{plan.description}</Text>
              </View>

              <View style={styles.featureList}>
                {plan.features.map((f) => (
                  <View key={f} style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} style={styles.featureIcon} />
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
                {plan.notIncluded.map((f) => (
                  <View key={f} style={[styles.featureRow, styles.featureRowDisabled]}>
                    <Ionicons name="close-circle-outline" size={16} color={colors.muted} style={styles.featureIcon} />
                    <Text style={[styles.featureText, styles.featureTextDisabled]}>{f}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.subscribeButton,
                  plan.accent ? styles.subscribeButtonPrimary : styles.subscribeButtonOutline,
                  (isCurrent || anyLoading) && styles.subscribeButtonDisabled,
                ]}
                onPress={() => handleSubscribe(plan.id)}
                disabled={isCurrent || anyLoading}
                activeOpacity={0.75}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={plan.accent ? "#fff" : colors.link} />
                ) : (
                  <Text
                    style={[
                      styles.subscribeButtonText,
                      plan.accent ? styles.subscribeButtonTextPrimary : styles.subscribeButtonTextOutline,
                      (isCurrent || anyLoading) && styles.subscribeButtonTextDisabled,
                    ]}
                  >
                    {isCurrent
                      ? "Plano atual"
                      : currentPlan
                        ? `Mudar para ${plan.name}`
                        : `Assinar ${plan.name}`}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )
        })}

        <Text style={styles.footerNote}>
          Pagamento seguro via Stripe. Apos o pagamento seu plano e ativado em instantes.
        </Text>
      </ScrollView>
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
      backgroundColor: colors.headerBg,
    },
    backButton: {
      padding: 4,
      marginRight: 8,
    },
    headerTitle: {
      flex: 1,
      fontSize: 17,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    refreshButton: {
      padding: 4,
      width: 32,
      alignItems: "center",
    },
    accountBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      gap: 8,
    },
    accountBarBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 8,
      paddingHorizontal: 8,
    },
    accountBarLabel: {
      fontSize: 14,
      fontWeight: "600",
    },
    accountBarDivider: {
      width: 1,
      height: 22,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 20,
      gap: 16,
    },
    trialBanner: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
    },
    trialBannerTextWrap: {
      flex: 1,
      gap: 4,
    },
    trialBannerTitle: {
      fontSize: 13,
      fontWeight: "600",
      lineHeight: 18,
    },
    trialBannerSub: {
      fontSize: 12,
      lineHeight: 16,
    },
    statusCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
    },
    statusCardContent: {
      flex: 1,
    },
    statusLabel: {
      fontSize: 13,
      fontWeight: "600",
    },
    statusSub: {
      fontSize: 12,
      marginTop: 2,
    },
    statusAction: {
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    statusActionText: {
      fontSize: 13,
      fontWeight: "600",
      textDecorationLine: "underline",
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: 2,
    },
    sectionSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    planCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 20,
      gap: 16,
    },
    planCardAccent: {
      borderColor: colors.link + "60",
      shadowColor: colors.link,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 4,
    },
    planCardCurrent: {
      borderColor: colors.success + "60",
    },
    recommendedBadge: {
      position: "absolute",
      top: -11,
      alignSelf: "center",
      backgroundColor: colors.link,
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 20,
    },
    currentBadge: {
      backgroundColor: colors.success + "20",
      borderWidth: 1,
      borderColor: colors.success + "40",
    },
    recommendedText: {
      fontSize: 9,
      fontWeight: "700",
      color: "#fff",
      letterSpacing: 0.5,
    },
    planHeader: {
      gap: 4,
      marginTop: 8,
    },
    planTitleRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    planName: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    planPriceRow: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: 4,
      marginTop: 4,
    },
    planPrice: {
      fontSize: 28,
      fontWeight: "800",
      color: colors.textPrimary,
    },
    planPeriod: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    planDescription: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
      marginTop: 4,
    },
    featureList: {
      gap: 8,
    },
    featureRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
    },
    featureRowDisabled: {
      opacity: 0.4,
    },
    featureIcon: {
      marginTop: 1,
    },
    featureText: {
      fontSize: 13,
      color: colors.textPrimary,
      flex: 1,
      lineHeight: 18,
    },
    featureTextDisabled: {
      textDecorationLine: "line-through",
      color: colors.textSecondary,
    },
    subscribeButton: {
      height: 46,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    subscribeButtonPrimary: {
      backgroundColor: colors.link,
    },
    subscribeButtonOutline: {
      borderWidth: 1,
      borderColor: colors.border,
    },
    subscribeButtonDisabled: {
      opacity: 0.45,
    },
    subscribeButtonText: {
      fontSize: 15,
      fontWeight: "600",
    },
    subscribeButtonTextPrimary: {
      color: "#fff",
    },
    subscribeButtonTextOutline: {
      color: colors.textPrimary,
    },
    subscribeButtonTextDisabled: {
      color: colors.textSecondary,
    },
    footerNote: {
      fontSize: 12,
      color: colors.muted,
      textAlign: "center",
      lineHeight: 17,
      marginTop: 4,
    },
  })
}
