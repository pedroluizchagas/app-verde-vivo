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
  Tasks: undefined
  TaskForm: { task?: Task } | undefined
}

type TaskFormNavigationProp = NativeStackNavigationProp<RootStackParamList, "TaskForm">
type TaskFormRouteProp = RouteProp<RootStackParamList, "TaskForm">

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
  due_date: string
  client_id: string
}

interface FormErrors {
  title?: string
}

export function TaskForm() {
  const navigation = useNavigation<TaskFormNavigationProp>()
  const route = useRoute<TaskFormRouteProp>()
  const { user } = useAuth()
  
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    organized_description: "",
    status: "open",
    importance: "medium",
    tags: "",
    due_date: "",
    client_id: ""
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const statusOptions = [
    { label: "Aberta", value: "open" },
    { label: "Em progresso", value: "in_progress" },
    { label: "Concluída", value: "done" }
  ]

  const importanceOptions = [
    { label: "Baixa", value: "low" },
    { label: "Média", value: "medium" },
    { label: "Alta", value: "high" }
  ]

  useEffect(() => {
    loadClients()
    
    if (route.params?.task) {
      const task = route.params.task
      setFormData({
        title: task.title,
        description: task.description || "",
        organized_description: task.organized_description || "",
        status: task.status,
        importance: task.importance,
        tags: task.tags?.join(", ") || "",
        due_date: task.due_date || "",
        client_id: task.client_id || ""
      })
      setIsEditing(true)
      navigation.setOptions({ title: "Editar Tarefa" })
    } else {
      navigation.setOptions({ title: "Nova Tarefa" })
    }
  }, [route.params?.task])

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
    
    if (!formData.title.trim()) {
      newErrors.title = "Título é obrigatório"
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
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        organized_description: formData.organized_description.trim() || null,
        status: formData.status,
        importance: formData.importance,
        tags: tags.length ? tags : null,
        due_date: formData.due_date || null,
        client_id: formData.client_id || null
      }
      
      if (isEditing && route.params?.task) {
        const { error } = await supabase
          .from("tasks")
          .update(payload)
          .eq("id", route.params.task.id)
        
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
              label="Título *"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="Título da tarefa"
              error={errors.title}
              required
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
        
        <View style={styles.row}>
          <View style={styles.column}>
            <Select
              label="Status"
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value as "open" | "in_progress" | "done" })}
              options={statusOptions}
            />
          </View>
          <View style={styles.column}>
            <Input
              label="Vencimento (opcional)"
              value={formData.due_date}
              onChangeText={(text) => setFormData({ ...formData, due_date: text })}
              placeholder="YYYY-MM-DD"
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
          placeholder="Separadas por vírgula"
        />
        
        <TextArea
          label="Descrição"
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          placeholder="O que precisa ser feito"
          numberOfLines={6}
        />
        
        <TextArea
          label="Descrição organizada"
          value={formData.organized_description}
          onChangeText={(text) => setFormData({ ...formData, organized_description: text })}
          placeholder="Passos ou checklist"
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