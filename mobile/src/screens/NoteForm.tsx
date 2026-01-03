import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, StatusBar, Modal, useWindowDimensions } from "react-native"
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { supabase } from "../supabase"
import { useAuth } from "../contexts/AuthContext"
import { Input, TextArea } from "../components/Form"
import { Button } from "../components/Button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../contexts/ThemeContext"
import type { ThemeColors } from "../theme"

type RootStackParamList = {
  Notes: undefined
  NoteForm: { note?: Note } | undefined
}

type NoteFormNavigationProp = NativeStackNavigationProp<RootStackParamList, "NoteForm">
type NoteFormRouteProp = RouteProp<RootStackParamList, "NoteForm">

interface Client {
  id: string
  name: string
}

interface Note {
  id: string
  title: string | null
  content: string
  organized_content: string | null
  importance: "low" | "medium" | "high"
  tags: string[] | null
  client_id: string | null
  created_at: string
  updated_at: string
}

interface FormData {
  title: string
  content: string
  organized_content: string
  importance: "low" | "medium" | "high"
  tags: string
  client_id: string
}

interface FormErrors {
  content?: string
}

export function NoteForm() {
  const navigation = useNavigation<NoteFormNavigationProp>()
  const route = useRoute<NoteFormRouteProp>()
  const { user } = useAuth()
  const insets = useSafeAreaInsets()
  const { colors, isDark } = useTheme()
  const styles = createStyles(colors)
  
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [formData, setFormData] = useState<FormData>({
    title: "",
    content: "",
    organized_content: "",
    importance: "medium",
    tags: "",
    client_id: ""
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const importanceOptions = [
    { label: "Baixa", value: "low" },
    { label: "Média", value: "medium" },
    { label: "Alta", value: "high" }
  ]

  useEffect(() => {
    loadClients()
    
    if (route.params?.note) {
      const note = route.params.note
      setFormData({
        title: note.title || "",
        content: note.content,
        organized_content: note.organized_content || "",
        importance: note.importance,
        tags: note.tags?.join(", ") || "",
        client_id: note.client_id || ""
      })
      setIsEditing(true)
    } else {
      setIsEditing(false)
    }
  }, [route.params?.note])

  const loadClients = async () => {
    try {
      if (!user?.id) return
      const { data, error } = await supabase
        .from("clients")
        .select("id, name")
        .eq("gardener_id", user.id)
        .order("name")

      if (error) throw error
      
      setClients(data || [])
    } catch (error) {
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    
    if (!formData.content.trim()) {
      newErrors.content = "Conteúdo é obrigatório"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    
    setIsSubmitting(true)
    
    try {
      if (!user?.id) {
        Alert.alert("Erro", "Usuário não autenticado.")
        return
      }
      const tags = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0)

      const payload = {
        gardener_id: user.id,
        title: formData.title.trim() || null,
        content: formData.content.trim(),
        organized_content: formData.organized_content.trim() || null,
        importance: formData.importance,
        tags: tags.length ? tags : null,
        client_id: formData.client_id || null
      }
      
      if (isEditing && route.params?.note) {
        const { error } = await supabase
          .from("notes")
          .update(payload)
          .eq("id", route.params.note.id)
        
        if (error) throw error
        
        Alert.alert("Sucesso", "Nota atualizada com sucesso!")
      } else {
        const { error } = await supabase
          .from("notes")
          .insert(payload)
        
        if (error) throw error
        
        Alert.alert("Sucesso", "Nota criada com sucesso!")
      }
      
      navigation.goBack()
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao salvar nota")
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmDelete = () => {
    if (!route.params?.note?.id) return
    Alert.alert(
      "Excluir nota",
      "Tem certeza que deseja excluir esta nota? Essa ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", style: "destructive", onPress: handleDelete },
      ]
    )
  }

  const handleDelete = async () => {
    if (!route.params?.note?.id) return
    setIsSubmitting(true)
    try {
      const { error } = await supabase.from("notes").delete().eq("id", route.params.note.id)
      if (error) throw error
      Alert.alert("Sucesso", "Nota excluída com sucesso!")
      navigation.goBack()
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao excluir nota")
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.bg} />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon} disabled={isSubmitting} accessibilityRole="button" accessibilityLabel="Voltar">
          <Ionicons name="chevron-back" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>{isEditing ? "Editar nota" : "Nova nota"}</Text>
        {isEditing ? (
          <TouchableOpacity
            onPress={confirmDelete}
            style={styles.headerIcon}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Excluir nota"
          >
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
            <CardTitle>Detalhes da nota</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              label="Título"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="Ex: Observações do cliente"
            />
            <Dropdown
              label="Prioridade"
              value={formData.importance}
              onValueChange={(value) => setFormData({ ...formData, importance: value as "low" | "medium" | "high" })}
              options={importanceOptions}
            />
            <Dropdown
              label="Cliente"
              value={formData.client_id}
              onValueChange={(value) => setFormData({ ...formData, client_id: value })}
              options={[{ label: "Nenhum", value: "" }, ...clients.map((client) => ({ label: client.name, value: client.id }))]}
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
            <CardTitle>Conteúdo</CardTitle>
          </CardHeader>
          <CardContent>
            <TextArea
              label="Texto original"
              value={formData.content}
              onChangeText={(text) => setFormData({ ...formData, content: text })}
              placeholder="Descreva a nota"
              numberOfLines={6}
              error={errors.content}
              required
            />
            <TextArea
              label="Texto organizado"
              value={formData.organized_content}
              onChangeText={(text) => setFormData({ ...formData, organized_content: text })}
              placeholder="Versão organizada (opcional)"
              numberOfLines={6}
            />
          </CardContent>
        </Card>
      </View>

      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 16) }]}>
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
          {isEditing ? "Atualizar nota" : "Salvar nota"}
        </Button>
      </View>
    </ScrollView>
  )
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.bg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: c.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: c.textSecondary,
    fontSize: 16,
    fontWeight: "600",
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  headerIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
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
}: {
  label: string
  value: string
  onValueChange: (v: string) => void
  options: { label: string; value: string }[]
  required?: boolean
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
          borderColor: isDark ? "#374151" : "#D1D5DB",
          borderRadius: 8,
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: isDark ? "#2a2f36" : "#FFFFFF",
        }}
      >
        <Text style={{ fontSize: 16, color: isDark ? "#f9fafb" : "#111827" }}>{currentLabel}</Text>
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: colors.surfaceAlt, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: insets.bottom + 16, maxHeight: windowHeight * 0.9 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.textPrimary }}>{label}</Text>
              <TouchableOpacity onPress={() => setOpen(false)} style={{ padding: 4 }}>
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
