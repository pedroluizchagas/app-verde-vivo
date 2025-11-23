import { useEffect, useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, StatusBar, SafeAreaView, Image } from "react-native"
import * as ImagePicker from "expo-image-picker"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../contexts/ThemeContext"
import type { ThemeColors } from "../theme"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { supabase } from "../supabase"
import { useNavigation } from "@react-navigation/native"

interface Profile {
  id: string
  full_name: string
  email: string
  phone?: string
  company_name?: string
  business_type?: string
  created_at: string
  avatar_url?: string
}

interface SettingsSection {
  title: string
  items: SettingsItem[]
}

interface SettingsItem {
  id: string
  title: string
  subtitle?: string
  icon: string
  type: 'navigation' | 'switch' | 'action' | 'input'
  value?: boolean | string
  onPress?: () => void
  onValueChange?: (value: boolean) => void
}

export function ProfileScreen() {
  const { colors } = useTheme()
  const styles = createStyles(colors)
  const navigation = useNavigation<any>()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [authEmail, setAuthEmail] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [newAvatarUri, setNewAvatarUri] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const insets = useSafeAreaInsets()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }
      setAuthEmail(user.email ?? null)

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        const av = profileData.avatar_url
        if (av) {
          if (String(av).startsWith("data:") || String(av).startsWith("http")) {
            setAvatarUrl(String(av))
          } else {
            try {
              const { data } = await supabase.storage.from("avatars").getPublicUrl(String(av))
              if (data?.publicUrl) setAvatarUrl(data.publicUrl)
            } catch {}
          }
        }
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    Alert.alert(
      "Confirmar saída",
      "Tem certeza que deseja sair do aplicativo?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            await supabase.auth.signOut()
            setProfile(null)
          }
        }
      ]
    )
  }

  const handleEditField = (field: string, currentValue: string) => {
    setIsEditing(true)
    setEditingField(field)
    setEditValue(currentValue)
  }

  const saveEditField = async () => {
    if (!profile) return

    try {
      const updates: Record<string, any> = {}
      if (editingField === "full_name" && editValue && editValue !== profile.full_name) {
        updates.full_name = editValue
      }

      if (newAvatarUri) {
        setUploadingAvatar(true)
        try {
          const res = await fetch(newAvatarUri)
          const blob = await res.blob()
          const path = `${profile.id}/${Date.now()}.jpg`
          const { error: uploadError } = await supabase.storage.from("avatars").upload(path, blob, { contentType: "image/jpeg", upsert: true })
          if (uploadError) throw uploadError
          updates.avatar_url = path
          const { data } = await supabase.storage.from("avatars").getPublicUrl(path)
          if (data?.publicUrl) setAvatarUrl(data.publicUrl)
        } finally {
          setUploadingAvatar(false)
        }
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase.from("profiles").update(updates).eq("id", profile.id)
        if (error) throw error
        setProfile({ ...profile, ...updates })
      }

      setIsEditing(false)
      setEditingField(null)
      setEditValue("")
      setNewAvatarUri(null)
    } catch (error) {
      Alert.alert("Erro", "Não foi possível salvar as alterações")
    }
  }

  const pickNewAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== "granted") {
      Alert.alert("Permissão necessária", "Conceda acesso à galeria para alterar a foto.")
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 })
    if (!result.canceled && result.assets?.[0]?.uri) {
      setNewAvatarUri(result.assets[0].uri)
    }
  }

  const handleExportData = () => {
    Alert.alert(
      "Exportar Dados",
      "Deseja exportar todos os seus dados do aplicativo?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Exportar",
          style: "default",
          onPress: () => {
            Alert.alert("Sucesso", "Dados exportados com sucesso! O arquivo foi salvo em seu dispositivo.")
          }
        }
      ]
    )
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      "Excluir Conta",
      "Esta ação é irreversível. Todos os seus dados serão permanentemente excluídos.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            Alert.alert("Confirmação", "Para confirmar, digite 'EXCLUIR' no campo abaixo:", [
              { text: "Cancelar", style: "cancel" },
              {
                text: "Confirmar",
                style: "destructive",
                onPress: () => {
                  Alert.alert("Conta excluída", "Sua conta foi excluída com sucesso.")
                }
              }
            ])
          }
        }
      ]
    )
  }

  const openNotifications = () => {
    Alert.alert("Notificações", "Gerencie suas notificações")
  }
  const openAppearance = () => {
    Alert.alert("Aparência", "Escolha o tema e preferências visuais")
  }
  const openLanguage = () => {
    Alert.alert("Idioma", "Selecione o idioma do app")
  }
  const openChangePassword = () => {
    navigation.navigate('ChangePassword')
  }
  const openPrivacyCenter = () => {
    Alert.alert("Central de privacidade", "Gerencie suas preferências de privacidade")
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0F1115" />
        <Text style={styles.loadingText}>Carregando perfil...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F1115" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.topBar, { paddingTop: insets.top + 12 }] }>
          <Text style={styles.topBarTitle}>Perfil</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarLarge}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={28} color="#C5C8CC" />
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile?.full_name || "Usuário"}</Text>
            <Text style={styles.profileEmail}>{authEmail || profile?.email}</Text>
          </View>
        </View>
          <TouchableOpacity style={styles.editButton} onPress={() => handleEditField("full_name", profile?.full_name || "")}
            accessibilityRole="button" accessibilityLabel="Editar informações">
            <Ionicons name="pencil" size={16} color="#22c55e" />
            <Text style={styles.editButtonText}>Editar informações</Text>
          </TouchableOpacity>
          {isEditing && (
            <View style={styles.editContainer}>
              <View style={styles.editAvatarRow}>
                <View style={styles.avatarLarge}>
                  {newAvatarUri ? (
                    <Image source={{ uri: newAvatarUri }} style={styles.avatarImage} />
                  ) : avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                  ) : (
                    <Ionicons name="person" size={28} color="#C5C8CC" />
                  )}
                </View>
                <TouchableOpacity style={styles.avatarEditButton} onPress={pickNewAvatar} accessibilityRole="button" accessibilityLabel="Alterar foto">
                  <Ionicons name="create-outline" size={16} color="#22c55e" />
                  <Text style={styles.editButtonText}>Alterar foto</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.editInput}
                value={editValue}
                onChangeText={setEditValue}
                placeholder="Digite o novo nome"
                placeholderTextColor="#9ca3af"
                autoFocus
              />
              <View style={styles.editButtons}>
                <TouchableOpacity style={styles.editButtonCancel} onPress={() => { setIsEditing(false); setEditingField(null); setNewAvatarUri(null) }}>
                  <Text style={styles.editButtonTextCancel}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.editButtonSave} onPress={saveEditField}>
                  <Text style={styles.editButtonTextSave}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.blockTitle}>GERENCIAR ASSINATURA</Text>
          <View style={styles.blockCard}>
            <TouchableOpacity style={[styles.item, styles.itemLast]} onPress={() => Alert.alert("Plano e Pagamento", "Em breve") }>
              <View style={styles.itemLeft}>
                <Ionicons name="card-outline" size={20} color="#C5C8CC" />
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle}>Plano e Pagamento</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward-outline" size={20} color="#C5C8CC" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.blockTitle}>PRIVACIDADE E SEGURANÇA</Text>
          <View style={styles.blockCard}>
            <TouchableOpacity style={styles.item} onPress={openChangePassword}>
              <View style={styles.itemLeft}>
                <Ionicons name="lock-closed-outline" size={20} color="#C5C8CC" />
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle}>Alterar senha</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward-outline" size={20} color="#C5C8CC" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.item, styles.itemLast]} onPress={openPrivacyCenter}>
              <View style={styles.itemLeft}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#C5C8CC" />
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle}>Central de privacidade</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward-outline" size={20} color="#C5C8CC" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.signOut} onPress={handleSignOut} accessibilityRole="button" accessibilityLabel="Sair da conta">
          <Ionicons name="log-out-outline" size={18} color="#ef4444" />
          <Text style={styles.signOutText}>Sair da conta</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: c.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: c.divider,
    marginBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: c.bg,
  },
  loadingText: {
    fontSize: 16,
    color: c.textSecondary,
  },
  profileCard: {
    backgroundColor: c.surface,
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: c.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: c.textPrimary,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    color: c.textSecondary,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: c.link,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignSelf: 'center',
    width: '100%',
  },
  editButtonText: {
    color: c.link,
    fontSize: 15,
    fontWeight: '600',
  },
  sectionBlock: {
    marginTop: 16,
    marginHorizontal: 20,
  },
  blockTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: c.textSecondary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  blockCard: {
    backgroundColor: c.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  itemLast: {
    borderBottomWidth: 0,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemContent: {
    marginLeft: 12,
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: c.textPrimary,
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 14,
    color: c.textSecondary,
  },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    alignSelf: 'center',
    paddingHorizontal: 0,
    paddingVertical: 16,
  },
  signOutText: {
    color: c.danger,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
  editContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  editAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatarEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: c.link,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  editInput: {
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: c.textPrimary,
    borderWidth: 1,
    borderColor: c.border,
    marginBottom: 8,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  editButtonCancel: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonSave: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonTextCancel: {
    fontSize: 14,
    color: c.textSecondary,
    fontWeight: '500',
  },
  editButtonTextSave: {
    fontSize: 14,
    color: c.textPrimary,
    fontWeight: '500',
  },
})
