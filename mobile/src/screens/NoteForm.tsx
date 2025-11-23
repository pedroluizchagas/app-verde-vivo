import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native"
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { supabase } from "../supabase"
import { useAuth } from "../contexts/AuthContext"
import { Input, Select, TextArea } from "../components/Form"
import { Button } from "../components/Button"
import { Card } from "../components/Card"

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
      navigation.setOptions({ title: "Editar Nota" })
    } else {
      navigation.setOptions({ title: "Nova Nota" })
    }
  }, [route.params?.note])

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
      console.error("Erro ao carregar clientes:", error)
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
      const tags = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0)

      const payload = {
        gardener_id: user?.id,
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

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Carregando...</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Card style={styles.formCard}>
        <View style={styles.row}>
          <View style={styles.column}>
            <Input
              label="Título"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="Título (opcional)"
            />
          </View>
          <View style={styles.column}>
            <Select
              label="Prioridade"
              value={formData.importance}
              onValueChange={(value) => setFormData({ ...formData, importance: value as "low" | "medium" | "high" })}
              options={importanceOptions}
            />
          </View>
        </View>
        
        <Select
          label="Cliente (opcional)"
          value={formData.client_id}
          onValueChange={(value) => setFormData({ ...formData, client_id: value })}
          options={[{ label: "Nenhum", value: "" }, ...clients.map(client => ({ label: client.name, value: client.id }))]}
        />
        
        <Input
          label="Tags"
          value={formData.tags}
          onChangeText={(text) => setFormData({ ...formData, tags: text })}
          placeholder="Separadas por vírgula (opcional)"
        />
        
        <TextArea
          label="Texto original *"
          value={formData.content}
          onChangeText={(text) => setFormData({ ...formData, content: text })}
          placeholder="Conteúdo (obrigatório)"
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
      </Card>
      
      <View style={styles.buttonContainer}>
        <Button
          variant="outline"
          onPress={() => navigation.goBack()}
          disabled={isSubmitting}
          style={styles.button}
        >
          Cancelar
        </Button>
        <Button
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={styles.button}
        >
          {isSubmitting ? "Salvando..." : (isEditing ? "Atualizar" : "Criar")}
        </Button>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 16
  },
  formCard: {
    marginBottom: 16,
    padding: 16
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8
  },
  column: {
    flex: 1
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8
  },
  button: {
    flex: 1
  }
})