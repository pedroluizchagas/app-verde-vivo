import { useEffect, useState, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  NativeModules,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { supabase } from "../supabase"
import { useTheme } from "../contexts/ThemeContext"
import type { ThemeColors } from "../theme"

type Plan = "basic" | "plus"

interface SubscriptionStatus {
  plan: string | null
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

function getApiBase(): string {
  const normalizeEnvValue = (value: unknown): string | undefined => {
    const raw = String(value ?? "")
    if (!raw) return undefined
    const unwrapped = raw.replace(/^[\s"'`]+/, "").replace(/[\s"'`]+$/, "")
    return unwrapped || undefined
  }
  const canonical = normalizeEnvValue(process.env.EXPO_PUBLIC_CANONICAL_APP_URL as string | undefined) ?? "https://verdevivo.vercel.app"
  const env = normalizeEnvValue(process.env.EXPO_PUBLIC_APP_URL as string | undefined)
  const isDev = typeof __DEV__ !== "undefined" && __DEV__
  if (isDev) {
    try {
      const scriptUrl = String((NativeModules as any)?.SourceCode?.scriptURL || "")
      const m = scriptUrl.match(/^https?:\/\/([^:/]+)(?::\d+)?\//)
      const host = m ? m[1] : null
      if (host && !/^(localhost|127\.0\.0\.1)$/.test(host)) {
        return `http://${host}:3000`
      }
    } catch {}
    return Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000"
  }
  return env ?? canonical
}

export function PlanScreen() {
  const navigation = useNavigation<any>()
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()
  const styles = createStyles(colors)

  const [status, setStatus] = useState<SubscriptionStatus | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [subscribing, setSubscribing] = useState<Plan | null>(null)

  const fetchStatus = useCallback(async () => {
    setLoadingStatus(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      if (!token) return

      const base = getApiBase()
      const res = await fetch(`${base}/api/subscription/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-supabase-access-token": `Bearer ${token}`,
        },
      })
      if (res.ok) {
        const data: SubscriptionStatus = await res.json()
        setStatus(data)
      }
    } catch {
      // Status fetch failed silently — user can still see plan cards
    } finally {
      setLoadingStatus(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const handleSubscribe = async (plan: Plan) => {
    setSubscribing(plan)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      if (!token) {
        Alert.alert("Erro", "Sessao expirada. Faca login novamente.")
        return
      }

      const base = getApiBase()
      const res = await fetch(`${base}/api/subscription/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-supabase-access-token": `Bearer ${token}`,
        },
        body: JSON.stringify({ plan }),
      })

      const data = await res.json()

      if (!res.ok) {
        Alert.alert("Erro", data?.message ?? data?.error ?? "Nao foi possivel iniciar a assinatura.")
        return
      }

      if (data.paymentUrl) {
        const canOpen = await Linking.canOpenURL(data.paymentUrl)
        if (canOpen) {
          await Linking.openURL(data.paymentUrl)
        } else {
          Alert.alert("Erro", "Nao foi possivel abrir a pagina de pagamento.")
        }
      }
    } catch (err: any) {
      Alert.alert("Erro", err?.message ?? "Erro inesperado.")
    } finally {
      setSubscribing(null)
    }
  }

  const handleReopenPayment = async () => {
    if (!status?.subscription?.plan) return
    await handleSubscribe(status.subscription.plan as Plan)
  }

  const currentPlan = status?.plan ?? null
  const sub = status?.subscription ?? null
  const statusInfo = sub ? STATUS_DISPLAY[sub.status] : null
  const periodEnd = sub?.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString("pt-BR")
    : null

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Plano e Pagamento</Text>
        <TouchableOpacity onPress={fetchStatus} style={styles.refreshButton} disabled={loadingStatus}>
          {loadingStatus ? (
            <ActivityIndicator size="small" color={colors.textSecondary} />
          ) : (
            <Ionicons name="refresh-outline" size={20} color={colors.textSecondary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
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
          Pague via PIX, boleto ou cartao. Cancele quando quiser.
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
          Pagamento seguro via Asaas. Apos o pagamento seu plano e ativado em instantes.
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
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 20,
      gap: 16,
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
