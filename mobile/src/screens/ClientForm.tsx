import { useState } from "react"
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native"
import { Input, TextArea } from "../components/Form"
import { Button } from "../components/Button"
import { Card, CardContent } from "../components/Card"
import { useAuth } from "../contexts/AuthContext"
import { supabase } from "../supabase"
import { Ionicons } from "@expo/vector-icons"

interface ClientFormProps {
  navigation: any
  client?: {
    id: string
    name: string
    email?: string
    phone?: string
    address?: string
    notes?: string
  }
  onSave?: () => void
}

export function ClientForm({ navigation, client, onSave }: ClientFormProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: client?.name || "",
    email: client?.email || "",
    phone: client?.phone || "",
    address: client?.address || "",
    notes: client?.notes || "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório"
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido"
    }

    if (formData.phone && !/^\(\d{2}\) \d{4,5}-\d{4}$/.test(formData.phone)) {
      newErrors.phone = "Telefone inválido. Use: (00) 00000-0000"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm() || !user) return

    try {
      setLoading(true)

      const clientData = {
        gardener_id: user.id,
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
        notes: formData.notes.trim() || null,
      }

      if (client) {
        // Update existing client
        const { error } = await supabase
          .from("clients")
          .update(clientData)
          .eq("id", client.id)

        if (error) throw error

        Alert.alert("Sucesso", "Cliente atualizado com sucesso!")
      } else {
        // Create new client
        const { error } = await supabase
          .from("clients")
          .insert(clientData)

        if (error) throw error

        Alert.alert("Sucesso", "Cliente criado com sucesso!")
      }

      if (onSave) {
        onSave()
      } else {
        navigation.goBack()
      }
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao salvar cliente")
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {client ? "Editar Cliente" : "Novo Cliente"}
        </Text>
      </View>

      <Card style={styles.formCard}>
        <CardContent>
          <Input
            label="Nome completo"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Digite o nome do cliente"
            error={errors.name}
            required
          />

          <Input
            label="Email"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            placeholder="cliente@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          <Input
            label="Telefone"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            placeholder="(00) 00000-0000"
            keyboardType="phone-pad"
            error={errors.phone}
          />

          <TextArea
            label="Endereço"
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
            placeholder="Digite o endereço completo"
          />

          <TextArea
            label="Observações"
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            placeholder="Observações adicionais sobre o cliente"
          />
        </CardContent>
      </Card>

      <View style={styles.actions}>
        <Button
          variant="outline"
          onPress={() => navigation.goBack()}
          style={styles.button}
        >
          Cancelar
        </Button>
        <Button
          onPress={handleSave}
          loading={loading}
          style={styles.button}
        >
          {client ? "Atualizar" : "Criar"}
        </Button>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1115',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  formCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#1E2126',
    borderColor: '#2a2f36',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  button: {
    flex: 1,
  },
})