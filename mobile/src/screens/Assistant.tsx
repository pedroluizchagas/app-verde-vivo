import { useEffect, useState, useRef } from "react"
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Animated } from "react-native"
import { Audio } from "expo-av"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { supabase } from "../supabase"
import { useAuth } from "../contexts/AuthContext"
import { useTheme } from "../contexts/ThemeContext"
import type { ThemeColors } from "../theme"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface QuickAction {
  id: string
  title: string
  icon: string
  color: string
  prompt: string
}

export function AssistantScreen() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollViewRef = useRef<ScrollView>(null)
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<any>()
  const [isRecording, setIsRecording] = useState(false)
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const [pendingAudioUri, setPendingAudioUri] = useState<string | null>(null)
  const [pendingAudioSeconds, setPendingAudioSeconds] = useState<number>(0)
  const { user } = useAuth()
  const { colors } = useTheme()
  const styles = createStyles(colors)
  const [flow, setFlow] = useState<{ mode: "idle" | "create_client"; step: number; data: { name?: string; phone?: string; email?: string; address?: string } }>({ mode: "idle", step: 0, data: {} })
  const defaultBase = Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000"
  const apiBase = (process.env.EXPO_PUBLIC_API_URL || process.env.NEXT_PUBLIC_SITE_URL || defaultBase) as string

  const quickActions: QuickAction[] = [
    { id: "1", title: "Receitas", icon: "trending-up-outline", color: "#10b981", prompt: "Analise minhas receitas deste mês" },
    { id: "2", title: "Clientes", icon: "people-outline", color: "#3b82f6", prompt: "Quais são meus clientes mais ativos?" },
    { id: "3", title: "Agenda", icon: "calendar-outline", color: "#8b5cf6", prompt: "Qual é a minha agenda para hoje?" },
    { id: "4", title: "Tarefas", icon: "checkmark-circle-outline", color: "#f59e0b", prompt: "Quais tarefas estão pendentes?" },
    { id: "5", title: "Orçamentos", icon: "document-text-outline", color: "#ef4444", prompt: "Mostre meus orçamentos pendentes" },
    { id: "6", title: "Dicas", icon: "bulb-outline", color: "#06b6d4", prompt: "Dê-me dicas para aumentar minhas receitas" },
    { id: "7", title: "Adicionar Cliente", icon: "person-add-outline", color: "#22c55e", prompt: "Quero adicionar um novo cliente" }
  ]

  useEffect(() => {
    const welcomeMessage: Message = {
      id: "welcome",
      role: "assistant",
      content: "Olá! Sou seu assistente de negócios para jardinagem. Posso ajudar com análises financeiras, gestão de clientes, agendamentos e muito mais. Como posso ajudar você hoje?",
      timestamp: new Date()
    }
    setMessages([welcomeMessage])
  }, [])


  const sendMessage = async (text: string) => {
    if (!text.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputText("")
    setLoading(true)

    try {
      if (flow.mode !== "idle") {
        await handleFlowInput(text)
        return
      }
      const lower = text.toLowerCase()
      if ((lower.includes("adicionar") || lower.includes("cadastrar") || lower.includes("criar") || lower.includes("novo")) && lower.includes("cliente")) {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Vamos adicionar um cliente. Qual é o nome?",
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, aiResponse])
        setFlow({ mode: "create_client", step: 1, data: {} })
        setLoading(false)
        setTimeout(() => { scrollViewRef.current?.scrollToEnd({ animated: true }) }, 100)
        return
      }
      // Real call to backend agent
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        const aiResponse: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "Faça login para usar o assistente.", timestamp: new Date() }
        setMessages(prev => [...prev, aiResponse])
      } else {
        try {
          const res = await fetch(`${apiBase}/api/assistant`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({ text, mode: "execute" }),
          })
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const data = await res.json()
          const msg: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: String(data.reply || "Ok"),
            timestamp: new Date(),
          }
          setMessages(prev => [...prev, msg])
        } catch (err: any) {
          const aiResponse: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: `Erro: ${err?.message ?? "Falha ao conectar"}`.trim(), timestamp: new Date() }
          setMessages(prev => [...prev, aiResponse])
        }
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível processar sua mensagem. Tente novamente.")
    } finally {
      setLoading(false)
    }

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true })
    }, 100)
  }

  const handleFlowInput = async (text: string) => {
    const t = text.trim()
    if (flow.mode === "create_client") {
      if (flow.step === 1) {
        const name = t
        if (!name) {
          const aiResponse: Message = { id: (Date.now() + 2).toString(), role: "assistant", content: "Preciso do nome do cliente.", timestamp: new Date() }
          setMessages(prev => [...prev, aiResponse])
          setLoading(false)
          return
        }
        setFlow({ mode: "create_client", step: 2, data: { ...flow.data, name } })
        const aiResponse: Message = { id: (Date.now() + 3).toString(), role: "assistant", content: "Telefone (opcional). Envie o número ou digite 'pular'.", timestamp: new Date() }
        setMessages(prev => [...prev, aiResponse])
        setLoading(false)
        return
      }
      if (flow.step === 2) {
        const v = t.toLowerCase() === "pular" ? "" : t
        setFlow({ mode: "create_client", step: 3, data: { ...flow.data, phone: v } })
        const aiResponse: Message = { id: (Date.now() + 4).toString(), role: "assistant", content: "Email (opcional). Digite o email ou 'pular'.", timestamp: new Date() }
        setMessages(prev => [...prev, aiResponse])
        setLoading(false)
        return
      }
      if (flow.step === 3) {
        const v = t.toLowerCase() === "pular" ? "" : t
        setFlow({ mode: "create_client", step: 4, data: { ...flow.data, email: v } })
        const aiResponse: Message = { id: (Date.now() + 5).toString(), role: "assistant", content: "Endereço (opcional). Digite o endereço ou 'pular'.", timestamp: new Date() }
        setMessages(prev => [...prev, aiResponse])
        setLoading(false)
        return
      }
      if (flow.step === 4) {
        const v = t.toLowerCase() === "pular" ? "" : t
        const data = { ...flow.data, address: v }
        if (!user) {
          const aiResponse: Message = { id: (Date.now() + 6).toString(), role: "assistant", content: "Faça login para cadastrar clientes.", timestamp: new Date() }
          setMessages(prev => [...prev, aiResponse])
          setFlow({ mode: "idle", step: 0, data: {} })
          setLoading(false)
          return
        }
        try {
          const payload = {
            gardener_id: user.id,
            name: String(data.name),
            email: data.email ? String(data.email) : null,
            phone: data.phone ? String(data.phone) : null,
            address: data.address ? String(data.address) : null,
            notes: null as string | null,
          }
          const { error } = await supabase.from("clients").insert(payload)
          if (error) throw error
          const aiResponse: Message = { id: (Date.now() + 7).toString(), role: "assistant", content: "Cliente criado com sucesso.", timestamp: new Date() }
          setMessages(prev => [...prev, aiResponse])
        } catch (e: any) {
          const aiResponse: Message = { id: (Date.now() + 8).toString(), role: "assistant", content: `Erro ao criar cliente: ${e?.message || ""}`.trim(), timestamp: new Date() }
          setMessages(prev => [...prev, aiResponse])
        } finally {
          setFlow({ mode: "idle", step: 0, data: {} })
          setLoading(false)
        }
        return
      }
    }
  }

  const handleQuickAction = (action: QuickAction) => {
    sendMessage(action.prompt)
  }

  const handleSend = async () => {
    if (pendingAudioUri) {
      const userAudio: Message = {
        id: Date.now().toString(),
        role: "user",
        content: `🎤 Áudio (${pendingAudioSeconds}s)`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, userAudio])
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) {
          const aiResponse: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "Faça login para usar o assistente.", timestamp: new Date() }
          setMessages(prev => [...prev, aiResponse])
        } else {
          const form = new FormData()
          form.append("audio", {
            uri: pendingAudioUri,
            name: "audio.m4a",
            type: "audio/m4a",
          } as any)
          form.append("mode", "execute")
          const res = await fetch(`${apiBase}/api/assistant`, {
            method: "POST",
            headers: { Authorization: `Bearer ${session.access_token}` },
            body: form,
          })
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const data = await res.json()
          const msg: Message = { id: (Date.now() + 2).toString(), role: "assistant", content: String(data.reply || "Ok"), timestamp: new Date() }
          setMessages(prev => [...prev, msg])
        }
      } catch (err: any) {
        const aiResponse: Message = { id: (Date.now() + 3).toString(), role: "assistant", content: `Erro: ${err?.message ?? "Falha ao conectar"}`.trim(), timestamp: new Date() }
        setMessages(prev => [...prev, aiResponse])
      } finally {
        setPendingAudioUri(null)
        setPendingAudioSeconds(0)
      }
    } else if (inputText.trim()) {
      sendMessage(inputText)
    }
  }

  const startRecording = async () => {
    try {
      const perm = await Audio.requestPermissionsAsync()
      if (!perm.granted) {
        Alert.alert("Permissão", "Habilite o acesso ao microfone para enviar áudio.")
        return
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true })
      const rec = new Audio.Recording()
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY)
      await rec.startAsync()
      setRecording(rec)
      setIsRecording(true)
    } catch (e) {
      Alert.alert("Erro", "Não foi possível iniciar a gravação.")
    }
  }

  const stopRecording = async () => {
    try {
      if (!recording) return
      await recording.stopAndUnloadAsync()
      const status = await recording.getStatusAsync()
      const uri = recording.getURI()
      setIsRecording(false)
      setRecording(null)

      const seconds = Math.max(1, Math.round((status.durationMillis || 0) / 1000))
      setPendingAudioUri(uri || null)
      setPendingAudioSeconds(seconds)
    } catch (e) {
      Alert.alert("Erro", "Não foi possível finalizar a gravação.")
      setIsRecording(false)
      setRecording(null)
    }
  }

  const discardRecording = () => {
    setPendingAudioUri(null)
    setPendingAudioSeconds(0)
  }

  function Spectrum() {
    const bars = [useRef(new Animated.Value(6)).current, useRef(new Animated.Value(10)).current, useRef(new Animated.Value(8)).current, useRef(new Animated.Value(12)).current]
    useEffect(() => {
      const animations = bars.map((bar, i) => Animated.loop(Animated.sequence([
        Animated.timing(bar, { toValue: 18, duration: 300, useNativeDriver: false }),
        Animated.timing(bar, { toValue: 6 + (i * 2), duration: 300, useNativeDriver: false }),
      ])))
      animations.forEach(a => a.start())
      return () => animations.forEach(a => a.stop())
    }, [])
    return (
      <View style={styles.spectrumContainer}>
        {bars.map((height, idx) => (
          <Animated.View key={idx} style={[styles.spectrumBar, { height }]} />
        ))}
        <Text style={styles.spectrumText}>Gravando...</Text>
      </View>
    )
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <KeyboardAvoidingView style={styles.keyboardAvoid} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: 16 + insets.top }]}>
      <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Assistente IA</Text>
            <Text style={styles.headerSubtitle}>Pronto para ajudar!</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.headerIcon}
          onPress={() => {
            Alert.alert(
              "Assistente",
              "Abrir um assistente externo",
              [
                { text: "Cancelar", style: "cancel" },
                { text: "ChatGPT", style: "default", onPress: () => navigation.navigate("ChatGPT") },
                { text: "Gemini", style: "default", onPress: () => navigation.navigate("Gemini") },
              ]
            )
          }}
        >
          <Ionicons name="ellipsis-vertical" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
      <View style={styles.thinDivider} />

      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((message) => (
          <View 
            key={message.id} 
            style={[
              styles.messageContainer,
              message.role === "user" ? styles.userMessage : styles.assistantMessage
            ]}
          >
            <View style={[
              styles.messageBubble,
              message.role === "user" ? styles.userBubble : styles.assistantBubble
            ]}>
              <Text style={[
                styles.messageText,
                message.role === "user" ? styles.userText : styles.assistantText
              ]}>
                {message.content}
              </Text>
            </View>
            <Text style={styles.messageTime}>
              {formatTime(message.timestamp)}
            </Text>
          </View>
        ))}

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#8b5cf6" />
            <Text style={styles.loadingText}>Pensando...</Text>
          </View>
        )}
      </ScrollView>

      

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          {isRecording ? (
            <Spectrum />
          ) : (
            <TextInput
              style={styles.input}
              placeholder="Digite sua mensagem..."
              placeholderTextColor="#9ca3af"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
          )}
          <TouchableOpacity
            onPress={isRecording ? stopRecording : (pendingAudioUri ? discardRecording : startRecording)}
            disabled={loading}
            style={styles.micButton}
          >
            <Ionicons
              name={isRecording ? "stop-circle" : (pendingAudioUri ? "trash-outline" : "mic-outline")}
              size={22}
              color={isRecording ? "#ef4444" : (pendingAudioUri ? "#ef4444" : "#9ca3af")}
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={[styles.sendButtonCircle, (!pendingAudioUri && !inputText.trim()) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={(!pendingAudioUri && !inputText.trim()) || loading}
        >
          <Ionicons name="send" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
    </KeyboardAvoidingView>
  )
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
    backgroundColor: c.bg,
  },
  container: {
    flex: 1,
    backgroundColor: c.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: c.headerBg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    padding: 8,
  },
  headerTextContainer: {
    marginLeft: 0,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: c.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: c.textSecondary,
  },
  thinDivider: {
    height: 1,
    backgroundColor: c.divider,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  assistantMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userBubble: {
    backgroundColor: c.success,
    borderTopRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: c.surface,
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: c.textPrimary,
  },
  assistantText: {
    color: c.textPrimary,
  },
  messageTime: {
    fontSize: 12,
    color: c.textSecondary,
    marginTop: 4,
    marginHorizontal: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  loadingText: {
    fontSize: 14,
    color: c.textSecondary,
    marginLeft: 8,
  },
  inputContainer: {
    backgroundColor: c.bg,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: c.divider,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.bg,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: c.border,
    flex: 1,
    columnGap: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: c.textPrimary,
    maxHeight: 80,
    paddingVertical: 8,
  },
  sendButtonCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: c.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButton: {
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  spectrumContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4,
    flex: 1,
    height: 40,
  },
  spectrumBar: {
    width: 4,
    backgroundColor: c.success,
    borderRadius: 2,
  },
  spectrumText: {
    fontSize: 12,
    color: c.textSecondary,
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: c.border,
  },
})