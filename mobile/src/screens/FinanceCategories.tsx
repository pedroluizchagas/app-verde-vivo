import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, useWindowDimensions } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card"
import { Input } from "../components/Form"
import { Button } from "../components/Button"
import { useAuth } from "../contexts/AuthContext"
import { supabase } from "../supabase"
import { useTheme } from "../contexts/ThemeContext"
import type { ThemeColors } from "../theme"
import { useFocusEffect } from "@react-navigation/native"

type CategoryKind = "expense" | "income" | null

interface FinancialCategory {
  id: string
  name: string
  parent_id: string | null
  kind: CategoryKind
}

const suggested: Record<string, string[]> = {
  Operacional: ["EPIs", "Ferramentas", "Lubrificantes", "Combustível Máquinas"],
  Veículos: ["Combustível Veículos", "Manutenção Veículos", "Seguro"],
  Estoque: ["Insumos", "Herbicidas", "Fertilizantes", "Adubos", "Substratos", "Sementes", "Produtos para Revenda"],
  "Manutenção de Equipamentos": ["Peças", "Serviço de manutenção"],
  Administração: ["Internet", "Telefone", "Aluguel", "Energia", "Contabilidade"],
  Impostos: ["ISS", "INSS", "IR", "Taxas"],
  Marketing: ["Anúncios", "Materiais Promocionais"],
  Receitas: ["Serviços", "Produtos/Revenda", "Comissões", "Outros Recebimentos"],
}

const kindByParent: Record<string, Exclude<CategoryKind, null>> = {
  Receitas: "income",
  Operacional: "expense",
  Veículos: "expense",
  Estoque: "expense",
  "Manutenção de Equipamentos": "expense",
  Administração: "expense",
  Impostos: "expense",
  Marketing: "expense",
}

export function FinanceCategoriesScreen({ navigation }: any) {
  const { user } = useAuth()
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()
  const styles = createStyles(colors)
  const autoSeededRef = useRef(false)

  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [categories, setCategories] = useState<FinancialCategory[]>([])

  const [formName, setFormName] = useState("")
  const [formParentId, setFormParentId] = useState<string>("none")
  const [formKind, setFormKind] = useState<string>("none")

  const parents = useMemo(() => categories.filter((c) => c.parent_id == null).sort((a, b) => a.name.localeCompare(b.name)), [categories])
  const childrenByParent = useMemo(() => {
    const map = new Map<string, FinancialCategory[]>()
    categories.forEach((c) => {
      if (!c.parent_id) return
      const key = String(c.parent_id)
      const list = map.get(key) || []
      list.push(c)
      map.set(key, list)
    })
    for (const [k, list] of map.entries()) list.sort((a, b) => a.name.localeCompare(b.name))
    return map
  }, [categories])

  const seedSuggestedCategories = useCallback(async () => {
    if (!user) return
    setBusy(true)
    setMsg(null)
    setError(null)
    try {
      const { data: existing, error: e } = await supabase
        .from("financial_categories")
        .select("id, name, parent_id, kind")
        .eq("gardener_id", user.id)
      if (e) throw e

      const rootsByName = new Map<string, { id: string; kind: CategoryKind }>()
      const childrenByTuple = new Set<string>()

      ;(existing || []).forEach((c: any) => {
        const id = String(c.id)
        const name = String(c.name)
        const parentId = c.parent_id ? String(c.parent_id) : null
        const kind = (c.kind === "expense" || c.kind === "income") ? c.kind : null
        if (parentId == null) rootsByName.set(name, { id, kind })
        else childrenByTuple.add(`${parentId}::${name}`)
      })

      for (const rootName of Object.keys(suggested)) {
        const desiredKind = kindByParent[rootName]
        const rootInfo = rootsByName.get(rootName) || null
        let rootId = rootInfo?.id || null

        if (!rootId) {
          const { data: insertedRoot, error: ie } = await supabase
            .from("financial_categories")
            .insert([{ gardener_id: user.id, name: rootName, parent_id: null, kind: desiredKind }])
            .select("id")
            .single()
          if (ie) throw ie
          rootId = insertedRoot?.id ? String(insertedRoot.id) : null
          if (rootId) rootsByName.set(rootName, { id: rootId, kind: desiredKind })
        } else if (rootInfo?.kind !== desiredKind) {
          const { error: ue } = await supabase
            .from("financial_categories")
            .update({ kind: desiredKind })
            .eq("id", rootId)
          if (ue) throw ue
          rootsByName.set(rootName, { id: rootId, kind: desiredKind })
        }

        if (!rootId) continue

        for (const child of suggested[rootName]) {
          const key = `${rootId}::${child}`
          if (childrenByTuple.has(key)) continue
          const { error: ce } = await supabase
            .from("financial_categories")
            .insert([{ gardener_id: user.id, name: child, parent_id: rootId, kind: desiredKind }])
          if (ce) throw ce
          childrenByTuple.add(key)
        }
      }

      setMsg("Categorias sugeridas adicionadas.")
    } catch (e: any) {
      setError(e?.message || "Erro ao adicionar categorias")
    } finally {
      setBusy(false)
    }
  }, [user])

  const loadCategories = useCallback(async () => {
    if (!user) return
    setError(null)
    try {
      setLoading(true)

      const fetchList = async () => {
        const { data, error: e } = await supabase
          .from("financial_categories")
          .select("id, name, parent_id, kind")
          .eq("gardener_id", user.id)
          .order("name")
        if (e) throw e
        return (data || []).map((c: any) => ({
          id: String(c.id),
          name: String(c.name),
          parent_id: c.parent_id ? String(c.parent_id) : null,
          kind: (c.kind === "expense" || c.kind === "income") ? c.kind : null,
        })) as FinancialCategory[]
      }

      let list = await fetchList()
      if (!autoSeededRef.current && list.length === 0) {
        autoSeededRef.current = true
        await seedSuggestedCategories()
        list = await fetchList()
      }
      setCategories(list)
    } catch (e: any) {
      setError(e?.message || "Erro ao carregar categorias")
    } finally {
      setLoading(false)
    }
  }, [user, seedSuggestedCategories])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  useFocusEffect(
    useCallback(() => {
      loadCategories()
    }, [loadCategories])
  )

  const handleCreate = useCallback(async () => {
    if (!user) return
    const name = formName.trim()
    if (!name) {
      Alert.alert("Atenção", "Informe o nome da categoria.")
      return
    }
    setBusy(true)
    setMsg(null)
    setError(null)
    try {
      const parent_id = formParentId === "none" ? null : formParentId
      const kind: CategoryKind = (formKind === "expense" || formKind === "income") ? (formKind as any) : null
      const { error: ie } = await supabase
        .from("financial_categories")
        .insert([{ gardener_id: user.id, name, parent_id, kind }])
      if (ie) throw ie
      setFormName("")
      setFormParentId("none")
      setFormKind("none")
      setMsg("Categoria criada.")
      await loadCategories()
    } catch (e: any) {
      setError(e?.message || "Erro ao criar categoria")
    } finally {
      setBusy(false)
    }
  }, [user, formName, formParentId, formKind, loadCategories])

  const parentOptions = useMemo(() => {
    return [{ label: "Sem pai", value: "none" }, ...parents.map((p) => ({ label: p.name, value: p.id }))]
  }, [parents])

  const kindOptions = useMemo(() => {
    return [
      { label: "Sem tipo", value: "none" },
      { label: "Despesa", value: "expense" },
      { label: "Receita", value: "income" },
    ]
  }, [])

  const kindLabel = useCallback((k: CategoryKind) => (k === "expense" ? "Despesa" : k === "income" ? "Receita" : "Sem tipo"), [])

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + 16 }} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon} accessibilityRole="button" accessibilityLabel="Voltar">
          <Ionicons name="chevron-back" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Categorias financeiras</Text>
        <View style={styles.headerIcon} />
      </View>
      <View style={styles.divider} />

      <View style={styles.section}>
        <Card>
          <CardHeader>
            <CardTitle>Adicionar</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              label="Nome da categoria"
              value={formName}
              onChangeText={setFormName}
              placeholder="Ex.: Materiais, Combustível, Folha"
              autoCapitalize="words"
              returnKeyType="done"
            />
            <Dropdown label="Categoria pai (opcional)" value={formParentId} onValueChange={setFormParentId} options={parentOptions} />
            <Dropdown label="Tipo" value={formKind} onValueChange={setFormKind} options={kindOptions} />

            {Boolean(error) && (
              <View style={styles.alertError}>
                <Ionicons name="alert-circle-outline" size={18} color={styles.alertErrorText.color} />
                <Text style={styles.alertErrorText}>{error}</Text>
              </View>
            )}

            {Boolean(msg) && (
              <View style={styles.alertSuccess}>
                <Ionicons name="checkmark-circle-outline" size={18} color={styles.alertSuccessText.color} />
                <Text style={styles.alertSuccessText}>{msg}</Text>
              </View>
            )}

            <View style={styles.actionRow}>
              <Button variant="outline" onPress={seedSuggestedCategories} loading={busy} style={styles.actionButton}>
                Adicionar sugeridas
              </Button>
              <Button onPress={handleCreate} loading={busy} gradient style={styles.actionButton}>
                Criar categoria
              </Button>
            </View>
          </CardContent>
        </Card>
      </View>

      <View style={styles.section}>
        <Card>
          <CardHeader>
            <CardTitle>Existentes</CardTitle>
          </CardHeader>
          <CardContent>
            {parents.length === 0 ? (
              <Text style={styles.emptyText}>Nenhuma categoria criada.</Text>
            ) : (
              <View style={{ gap: 10 }}>
                {parents.map((p) => {
                  const kids = childrenByParent.get(p.id) || []
                  return (
                    <View key={p.id} style={styles.categoryBox}>
                      <View style={styles.categoryHeaderRow}>
                        <Text style={styles.categoryTitle}>{p.name}</Text>
                        <Text style={styles.kindBadge}>{kindLabel(p.kind)}</Text>
                      </View>
                      <View style={{ marginTop: 8, gap: 6 }}>
                        {kids.length > 0 ? (
                          kids.map((ch) => (
                            <View key={ch.id} style={styles.subcategoryRow}>
                              <Text style={styles.subcategoryText}>{`- ${ch.name}`}</Text>
                              <Text style={styles.subcategoryKind}>{kindLabel(ch.kind)}</Text>
                            </View>
                          ))
                        ) : (
                          <Text style={styles.emptySubText}>(sem subcategorias)</Text>
                        )}
                      </View>
                    </View>
                  )
                })}
              </View>
            )}
          </CardContent>
        </Card>
      </View>
    </ScrollView>
  )
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12 },
  headerIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  divider: { height: 1, backgroundColor: c.divider },
  title: { fontSize: 18, fontWeight: "700", color: c.textPrimary },
  section: { paddingHorizontal: 16, marginBottom: 12, marginTop: 12 },
  actionRow: { flexDirection: "row", columnGap: 12 },
  actionButton: { flex: 1, borderRadius: 24 },
  alertError: { flexDirection: "row", alignItems: "center", columnGap: 8, backgroundColor: "rgba(239,68,68,0.10)", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 },
  alertErrorText: { color: "#ef4444", flex: 1, fontSize: 13, fontWeight: "600" },
  alertSuccess: { flexDirection: "row", alignItems: "center", columnGap: 8, backgroundColor: "rgba(34,197,94,0.12)", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 },
  alertSuccessText: { color: "#22c55e", flex: 1, fontSize: 13, fontWeight: "600" },
  emptyText: { color: c.textSecondary, fontSize: 13 },
  emptySubText: { color: c.textSecondary, fontSize: 13 },
  categoryBox: { borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 12, backgroundColor: c.surfaceAlt },
  categoryHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", columnGap: 10 },
  categoryTitle: { color: c.textPrimary, fontSize: 15, fontWeight: "700", flex: 1 },
  kindBadge: { color: c.textSecondary, fontSize: 12, fontWeight: "700" },
  subcategoryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", columnGap: 10 },
  subcategoryText: { color: c.textSecondary, fontSize: 13, flex: 1 },
  subcategoryKind: { color: c.textSecondary, fontSize: 12, fontWeight: "600" },
  loadingText: { color: c.textSecondary, fontSize: 14, paddingHorizontal: 16 },
})

function Dropdown({ label, value, onValueChange, options, required, error }: { label: string; value: string; onValueChange: (v: string) => void; options: { label: string; value: string }[]; required?: boolean; error?: string }) {
  const { mode, colors } = useTheme()
  const insets = useSafeAreaInsets()
  const { height: windowHeight } = useWindowDimensions()
  const isDark = mode === "dark"
  const [open, setOpen] = useState(false)
  const currentLabel = options.find((o) => o.value === value)?.label || "Selecione"
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={[{ fontSize: 14, fontWeight: "600", color: isDark ? "#f9fafb" : "#374151", marginBottom: 8 }]}>
        {label}
        {required && <Text style={{ color: "#EF4444" }}> *</Text>}
      </Text>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderWidth: 1,
          borderColor: error ? "#EF4444" : isDark ? "#374151" : "#D1D5DB",
          borderRadius: 8,
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: isDark ? "#2a2f36" : "#FFFFFF",
        }}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Text style={{ fontSize: 16, color: isDark ? "#f9fafb" : "#111827" }}>{currentLabel}</Text>
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
      {error && <Text style={{ fontSize: 12, color: "#EF4444", marginTop: 4 }}>{error}</Text>}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: colors.surfaceAlt, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: insets.bottom + 16, maxHeight: windowHeight * 0.9 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.textPrimary }}>{label}</Text>
              <TouchableOpacity onPress={() => setOpen(false)} style={{ padding: 4 }} accessibilityRole="button" accessibilityLabel="Fechar">
                <Ionicons name="close" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={{ height: 1, backgroundColor: colors.divider }} />
            <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
              <ScrollView style={{ maxHeight: Math.round(windowHeight * 0.55) }} showsVerticalScrollIndicator={false}>
                <View style={{ backgroundColor: colors.surface, borderRadius: 12, paddingVertical: 8, overflow: "hidden" }}>
                  {options.map((o, idx) => (
                    <TouchableOpacity
                      key={o.value}
                      onPress={() => { onValueChange(o.value); setOpen(false) }}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        borderBottomWidth: idx === options.length - 1 ? 0 : 1,
                        borderBottomColor: colors.border,
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={o.label}
                    >
                      <Text style={{ color: colors.textPrimary, fontSize: 16 }}>{o.label}</Text>
                      {o.value === value && <Ionicons name="checkmark" size={18} color={colors.link} />}
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}
