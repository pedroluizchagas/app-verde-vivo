import { useState } from "react"
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Image } from "react-native"
import * as ImagePicker from "expo-image-picker"
import { Input, TextArea } from "../components/Form"
import { Button } from "../components/Button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card"
import { useAuth } from "../contexts/AuthContext"
import { supabase } from "../supabase"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../contexts/ThemeContext"
import type { ThemeColors } from "../theme"
import { useSafeAreaInsets } from "react-native-safe-area-context"

interface ClientFormProps {
  navigation: any
  route?: any
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

export function ClientForm({ navigation, route, client: clientProp, onSave }: ClientFormProps) {
  const { user } = useAuth()
  const { colors } = useTheme()
  const styles = createStyles(colors)
  const insets = useSafeAreaInsets()
  const client = (route?.params?.client as any) || clientProp
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: client?.name || "",
    email: client?.email || "",
    phone: client?.phone || "",
    address: client?.address || "",
    notes: client?.notes || "",
    avatar_url: (client as any)?.avatar_url || "",
  })
  const [avatarLocalUri, setAvatarLocalUri] = useState<string>("")
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
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
        avatar_url: formData.avatar_url || null,
      }

      if (client) {
        // Update existing client
        // Upload avatar if selected
        let newUrl: string | null = null
        try {
          newUrl = await uploadAvatarIfNeeded(client.id)
        } catch (e: any) {
          // Ignora falha de upload, mantém fluxo
        }
        const patch = newUrl ? { ...clientData, avatar_url: newUrl } : clientData
        const { error } = await supabase.from("clients").update(patch).eq("id", client.id)
        if (error) throw error

        Alert.alert("Sucesso", "Cliente atualizado com sucesso!")
      } else {
        // Create new client
        const { data: created, error } = await supabase
          .from("clients")
          .insert(clientData)
          .select("id")
          .single()
        if (error) throw error
        const newId = String((created as any)?.id)
        // Upload avatar if selected and update
        let newUrl: string | null = null
        try {
          newUrl = await uploadAvatarIfNeeded(newId)
        } catch {}
        if (newUrl) {
          await supabase.from("clients").update({ avatar_url: newUrl }).eq("id", newId)
        }

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

  const pickAvatar = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (perm.status !== "granted") {
        Alert.alert("Permissão", "Conceda acesso às fotos para selecionar a imagem do cliente")
        return
      }
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 })
      if (!res.canceled && res.assets && res.assets.length > 0) {
        setAvatarLocalUri(res.assets[0].uri)
      }
    } catch (e: any) {
      Alert.alert("Erro", e?.message || "Falha ao selecionar imagem")
    }
  }

  const uploadAvatarIfNeeded = async (targetClientId: string): Promise<string | null> => {
    if (!avatarLocalUri) return null
    try {
      setUploadingAvatar(true)
      const fileName = `client-${targetClientId}-${Date.now()}.jpg`
      const resp = await fetch(avatarLocalUri)
      const blob = await resp.blob()
      const { error: uerr } = await supabase.storage.from("client-avatars").upload(fileName, blob, { upsert: true, contentType: blob.type || "image/jpeg" })
      if (uerr) throw uerr
      const { data: pub } = await supabase.storage.from("client-avatars").getPublicUrl(fileName)
      return pub?.publicUrl || null
    } finally {
      setUploadingAvatar(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + 16 }} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon} accessibilityRole="button" accessibilityLabel="Voltar">
          <Ionicons name="chevron-back" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>{client ? "Editar cliente" : "Novo cliente"}</Text>
        <View style={styles.headerIcon} />
      </View>
      <View style={styles.divider} />

      <View style={styles.section}>
        <Card>
          <CardHeader>
            <CardTitle>Foto do cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.avatarRow}>
              <View style={styles.avatar}>
                {avatarLocalUri ? (
                  <Image source={{ uri: avatarLocalUri }} style={{ width: 64, height: 64 }} />
                ) : formData.avatar_url ? (
                  <Image source={{ uri: formData.avatar_url }} style={{ width: 64, height: 64 }} />
                ) : (
                  <Ionicons name="person" size={28} color={colors.textSecondary} />
                )}
              </View>
              <Button size="small" onPress={pickAvatar} loading={uploadingAvatar}>
                Alterar foto
              </Button>
            </View>
          </CardContent>
        </Card>
      </View>

      <View style={styles.section}>
        <Card>
          <CardHeader>
            <CardTitle>Dados do cliente</CardTitle>
          </CardHeader>
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
      </View>

      <View style={styles.actions}>
        <Button
          variant="outline"
          onPress={() => navigation.goBack()}
          style={[styles.button, styles.buttonOutline]}
        >
          Cancelar
        </Button>
        <Button
          onPress={handleSave}
          loading={loading}
          gradient
          size="large"
          style={[styles.button, styles.buttonPrimary]}
        >
          {client ? "Atualizar cliente" : "Salvar cliente"}
        </Button>
      </View>
    </ScrollView>
  )
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12 },
  headerIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  divider: { height: 1, backgroundColor: c.divider },
  title: { fontSize: 20, fontWeight: "700", color: c.textPrimary },
  section: { paddingHorizontal: 16, marginBottom: 24, marginTop: 8 },
  avatarRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", columnGap: 12 },
  avatar: { width: 64, height: 64, borderRadius: 32, overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border },
  actions: { flexDirection: "row", columnGap: 12, paddingHorizontal: 16, paddingVertical: 16 },
  button: { flex: 1 },
  buttonPrimary: { borderRadius: 24 },
  buttonOutline: { borderRadius: 24 },
})
