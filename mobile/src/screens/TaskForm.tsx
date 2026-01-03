import { useEffect, useMemo, useState } from "react"
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, StatusBar, Modal, useWindowDimensions } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { supabase } from "../supabase"
import { useAuth } from "../contexts/AuthContext"
import { Input, TextArea, DateInput } from "../components/Form"
import { Button } from "../components/Button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card"
import { useTheme } from "../contexts/ThemeContext"
import type { ThemeColors } from "../theme"

interface Client {
  id: string
  name: string
}

interface Task {
  id: string
  title: string
  description: string | null
  organized_description: string | null
  status: "open" | "in_progress" | "done"
  importance: "low" | "medium" | "high"
  tags: string[] | null
  due_date: string | null
  client_id: string | null
  created_at: string
  updated_at: string
}

interface FormData {
  title: string
  description: string
  organized_description: string
  status: "open" | "in_progress" | "done"
  importance: "low" | "medium" | "high"
  tags: string
  due_date: Date | null
  client_id: string
}

interface FormErrors {
  title?: string
}

export function TaskForm({ navigation, route }: any) {
  const { user } = useAuth()
  const insets = useSafeAreaInsets()
  const { colors, isDark } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const task: Task | undefined = route?.params?.task

  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    organized_description: "",
    status: "open",
    importance: "medium",
    tags: "",
    due_date: null,
    client_id: ""
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const statusOptions = useMemo(() => ([
    { label: "Aberta", value: "open" },
    { label: "Em progresso", value: "in_progress" },
    { label: "Concluída", value: "done" }
  ]), [])

  const importanceOptions = useMemo(() => ([
    { label: "Baixa", value: "low" },
    { label: "Média", value: "medium" },
    { label: "Alta", value: "high" }
  ]), [])

  useEffect(() => {
    ;(async () => {
      await loadClients()
    })()

    if (task) {
      const parsedDue = task.due_date ? new Date(task.due_date) : null
      setFormData({
        title: task.title,
        description: task.description || "",
        organized_description: task.organized_description || "",
        status: task.status,
        importance: task.importance,
        tags: task.tags?.join(", ") || "",
        due_date: parsedDue && !isNaN(parsedDue.getTime()) ? parsedDue : null,
        client_id: task.client_id || ""
      })
      setIsEditing(true)
    } else {
      setIsEditing(false)
    }
  }, [task])

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name")
        .eq("gardener_id", user?.id)
        .order("name")

      if (error) throw error
      
      setClients(data || [])
    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar clientes")
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    
    if (!formData.title.trim()) {
      newErrors.title = "Título é obrigatório"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const confirmDelete = () => {
    if (!task?.id || isSubmitting) return
    Alert.alert("Excluir tarefa", "Deseja realmente excluir esta tarefa?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          setIsSubmitting(true)
          try {
            const { error } = await supabase.from("tasks").delete().eq("id", task.id)
            if (error) throw error
            Alert.alert("Sucesso", "Tarefa excluída com sucesso!")
            navigation.goBack()
          } catch (err: any) {
            Alert.alert("Erro", err?.message || "Erro ao excluir tarefa")
          } finally {
            setIsSubmitting(false)
          }
        },
      },
    ])
  }

  const toISODate = (d: Date) => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    
    setIsSubmitting(true)
    
    try {
      const tags = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0)

      const payload = {
        gardener_id: user?.id,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        organized_description: formData.organized_description.trim() || null,
        status: formData.status,
        importance: formData.importance,
        tags: tags.length ? tags : null,
        due_date: formData.due_date ? toISODate(formData.due_date) : null,
        client_id: formData.client_id || null
      }
      
      if (isEditing && task) {
        const { error } = await supabase
          .from("tasks")
          .update(payload)
          .eq("id", task.id)
        
        if (error) throw error
        
        Alert.alert("Sucesso", "Tarefa atualizada com sucesso!")
      } else {
        const { error } = await supabase
          .from("tasks")
          .insert(payload)
        
        if (error) throw error
        
        Alert.alert("Sucesso", "Tarefa criada com sucesso!")
      }
      
      navigation.goBack()
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao salvar tarefa")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.bg} />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) }} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.bg} />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon} disabled={isSubmitting} accessibilityRole="button" accessibilityLabel="Voltar">
          <Ionicons name="chevron-back" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>{isEditing ? "Editar tarefa" : "Nova tarefa"}</Text>
        {isEditing ? (
          <TouchableOpacity onPress={confirmDelete} style={styles.headerIcon} disabled={isSubmitting} accessibilityRole="button" accessibilityLabel="Excluir tarefa">
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerIcon} />
        )}
      </View>
      <View style={styles.divider} />

      <View style={styles.section}>
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da tarefa</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              label="Título"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="Ex: Comprar adubo"
              error={errors.title}
              required
            />
            <Dropdown
              label="Prioridade"
              value={formData.importance}
              onValueChange={(value) => setFormData({ ...formData, importance: value as any })}
              options={importanceOptions}
            />
            <Dropdown
              label="Status"
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value as any })}
              options={statusOptions}
            />
            <Dropdown
              label="Cliente"
              value={formData.client_id}
              onValueChange={(value) => setFormData({ ...formData, client_id: value })}
              options={[{ label: "Nenhum", value: "" }, ...clients.map((client) => ({ label: client.name, value: client.id }))]}
            />
            <DateInput
              label="Vencimento"
              value={formData.due_date}
              onValueChange={(date) => setFormData({ ...formData, due_date: date })}
            />
            <Input
              label="Tags"
              value={formData.tags}
              onChangeText={(text) => setFormData({ ...formData, tags: text })}
              placeholder="Separadas por vírgula (opcional)"
            />
          </CardContent>
        </Card>
      </View>

      <View style={styles.section}>
        <Card>
          <CardHeader>
            <CardTitle>Descrição</CardTitle>
          </CardHeader>
          <CardContent>
            <TextArea
              label="Texto original"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="O que precisa ser feito"
              numberOfLines={6}
            />
            <TextArea
              label="Texto organizado"
              value={formData.organized_description}
              onChangeText={(text) => setFormData({ ...formData, organized_description: text })}
              placeholder="Passos ou checklist (opcional)"
              numberOfLines={6}
            />
          </CardContent>
        </Card>
      </View>

      <View style={styles.actions}>
        <Button
          variant="outline"
          onPress={() => navigation.goBack()}
          disabled={isSubmitting}
          style={[styles.button, styles.buttonOutline]}
        >
          Cancelar
        </Button>
        <Button
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting}
          gradient
          size="large"
          style={[styles.button, styles.buttonPrimary]}
        >
          {isEditing ? "Atualizar tarefa" : "Salvar tarefa"}
        </Button>
      </View>
    </ScrollView>
  )
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  loadingContainer: { flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center" },
  loadingText: { color: c.textSecondary, fontSize: 16, fontWeight: "600" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12 },
  headerIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  divider: { height: 1, backgroundColor: c.divider },
  title: { fontSize: 20, fontWeight: "700", color: c.textPrimary },
  section: { paddingHorizontal: 16, marginBottom: 24, marginTop: 8 },
  actions: { flexDirection: "row", columnGap: 12, paddingHorizontal: 16, paddingVertical: 16 },
  button: { flex: 1 },
  buttonPrimary: { borderRadius: 24 },
  buttonOutline: { borderRadius: 24 },
})

function Dropdown({
  label,
  value,
  onValueChange,
  options,
  required,
  error,
}: {
  label: string
  value: string
  onValueChange: (v: string) => void
  options: { label: string; value: string }[]
  required?: boolean
  error?: string
}) {
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
                      onPress={() => {
                        onValueChange(o.value)
                        setOpen(false)
                      }}
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
