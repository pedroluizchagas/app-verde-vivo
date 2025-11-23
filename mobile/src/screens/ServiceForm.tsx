import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native"
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { supabase } from "../supabase"
import { useAuth } from "../contexts/AuthContext"
import { Input, TextArea } from "../components/Form"
import { Button } from "../components/Button"
import { Card } from "../components/Card"

type RootStackParamList = {
  Services: undefined
  ServiceForm: { service?: Service } | undefined
}

type ServiceFormNavigationProp = NativeStackNavigationProp<RootStackParamList, "ServiceForm">
type ServiceFormRouteProp = RouteProp<RootStackParamList, "ServiceForm">

interface Service {
  id: string
  name: string
  description: string | null
  default_price: number | null
  created_at: string
}

interface FormData {
  name: string
  description: string
  default_price: string
}

interface FormErrors {
  name?: string
  default_price?: string
}

export function ServiceForm() {
  const navigation = useNavigation<ServiceFormNavigationProp>()
  const route = useRoute<ServiceFormRouteProp>()
  const { user } = useAuth()
  
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    default_price: ""
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (route.params?.service) {
      const service = route.params.service
      setFormData({
        name: service.name,
        description: service.description || "",
        default_price: service.default_price?.toString() || ""
      })
      setIsEditing(true)
      navigation.setOptions({ title: "Editar Serviço" })
    } else {
      navigation.setOptions({ title: "Novo Serviço" })
    }
  }, [route.params?.service])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório"
    }
    
    if (formData.default_price && isNaN(Number(formData.default_price))) {
      newErrors.default_price = "Preço deve ser um número válido"
    } else if (formData.default_price && Number(formData.default_price) < 0) {
      newErrors.default_price = "Preço não pode ser negativo"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    
    setIsLoading(true)
    
    try {
      const payload = {
        gardener_id: user?.id,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        default_price: formData.default_price ? Number(formData.default_price) : null
      }
      
      if (isEditing && route.params?.service) {
        const { error } = await supabase
          .from("services")
          .update(payload)
          .eq("id", route.params.service.id)
        
        if (error) throw error
        
        Alert.alert("Sucesso", "Serviço atualizado com sucesso!")
      } else {
        const { error } = await supabase
          .from("services")
          .insert(payload)
        
        if (error) throw error
        
        Alert.alert("Sucesso", "Serviço criado com sucesso!")
      }
      
      navigation.goBack()
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao salvar serviço")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Card style={styles.formCard}>
        <Input
          label="Nome *"
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          placeholder="Ex.: Manutenção mensal"
          error={errors.name}
          required
        />
        
        <Input
          label="Preço padrão (R$)"
          value={formData.default_price}
          onChangeText={(text) => setFormData({ ...formData, default_price: text })}
          placeholder="0.00"
          keyboardType="numeric"
          error={errors.default_price}
        />
        
        <TextArea
          label="Descrição"
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          placeholder="Detalhes do serviço"
          numberOfLines={5}
        />
      </Card>
      
      <View style={styles.buttonContainer}>
        <Button
          variant="outline"
          onPress={() => navigation.goBack()}
          disabled={isLoading}
          style={styles.button}
        >
          Cancelar
        </Button>
        <Button
          onPress={handleSubmit}
          disabled={isLoading}
          style={styles.button}
        >
          {isLoading ? "Salvando..." : (isEditing ? "Atualizar" : "Criar")}
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
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8
  },
  button: {
    flex: 1
  }
})