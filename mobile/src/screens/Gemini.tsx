import { useState, useRef } from "react"
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Modal, Image } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../contexts/ThemeContext"
import type { ThemeColors } from "../theme"
import * as ImagePicker from "expo-image-picker"
import * as FileSystem from "expo-file-system"
import { Audio } from "expo-av"

type ChatMsg = { id: string; role: "user" | "assistant"; content?: string; imageB64?: string }

export function GeminiScreen({ navigation }: any) {
  const { colors } = useTheme()
  const styles = createStyles(colors)
  const insets = useSafeAreaInsets()
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<ScrollView>(null)
  const [moreOpen, setMoreOpen] = useState(false)
  const [images, setImages] = useState<{ uri: string; base64: string; mime: string }[]>([])
  const [files, setFiles] = useState<{ name: string; content: string }[]>([])
  const [thinkingMode, setThinkingMode] = useState(false)
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const [pendingAudioSeconds, setPendingAudioSeconds] = useState<number>(0)
  const [promptOpen, setPromptOpen] = useState(false)
  const [promptTitle, setPromptTitle] = useState("")
  const [promptValue, setPromptValue] = useState("")
  const promptSubmitRef = useRef<(v: string) => void>(() => {})

  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY as string | undefined
  const openaiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY as string | undefined

  const send = async () => {
    const t = text.trim()
    if (!t) return
    setMessages((prev) => [...prev, { id: String(Date.now()), role: "user", content: t }])
    setText("")
    setLoading(true)

    if (!apiKey) {
      setLoading(false)
      Alert.alert("API Key", "Defina EXPO_PUBLIC_GEMINI_API_KEY para usar o Gemini.")
      return
    }

    try {
      const parts: any[] = [{ text: t }]
      images.forEach((img) => {
        parts.push({ inline_data: { mime_type: img.mime, data: img.base64 } })
      })
      if (files.length > 0) {
        parts.push({ text: files.map((f) => `Arquivo: ${f.name}\n${f.content.slice(0, 8000)}`).join("\n\n") })
      }

      const systemText = thinkingMode ? "Pense passo a passo e elabore uma resposta detalhada." : "Você é um assistente útil."
      const model = thinkingMode ? "gemini-1.5-pro" : "gemini-1.5-flash"
      const generationConfig = { temperature: thinkingMode ? 0.2 : 0.7 }
      const body = {
        contents: [{ role: "user", parts }],
        systemInstruction: { role: "system", parts: [{ text: systemText }] },
        generationConfig,
      }

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const partsOut: any[] = data?.candidates?.[0]?.content?.parts || []
      const textOut = partsOut.map((p) => p.text).filter(Boolean).join("\n\n")
      setMessages((prev) => [...prev, { id: String(Date.now() + 1), role: "assistant", content: textOut || "" }])
    } catch (e: any) {
      setMessages((prev) => [...prev, { id: String(Date.now() + 2), role: "assistant", content: `Erro: ${e?.message ?? "Falha"}` }])
    } finally {
      setLoading(false)
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
      setImages([])
      setFiles([])
    }
  }

  const sendAudioBase64 = async (b64: string, mime: string) => {
    if (!apiKey) {
      Alert.alert("API Key", "Defina EXPO_PUBLIC_GEMINI_API_KEY.")
      return
    }
    setLoading(true)
    try {
      const parts: any[] = [{ inline_data: { mime_type: mime, data: b64 } }]
      const systemText = thinkingMode ? "Pense passo a passo e elabore uma resposta detalhada." : "Você é um assistente útil."
      const model = thinkingMode ? "gemini-1.5-pro" : "gemini-1.5-flash"
      const generationConfig = { temperature: thinkingMode ? 0.2 : 0.7 }
      const body = {
        contents: [{ role: "user", parts }],
        systemInstruction: { role: "system", parts: [{ text: systemText }] },
        generationConfig,
      }
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const partsOut: any[] = data?.candidates?.[0]?.content?.parts || []
      const textOut = partsOut.map((p) => p.text).filter(Boolean).join("\n\n")
      setMessages((prev) => [...prev, { id: String(Date.now() + 1), role: "assistant", content: textOut || "" }])
    } catch (e: any) {
      Alert.alert("Erro", e?.message ?? "Falha ao enviar áudio")
    } finally {
      setLoading(false)
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert("Permissão", "Habilite o acesso à galeria.")
      return
    }
    const r = await ImagePicker.launchImageLibraryAsync({ base64: true, mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 })
    if (r.canceled) return
    const a = r.assets?.[0]
    if (!a?.base64 || !a.uri) return
    const mime = a.type === "image" ? (a.mimeType || "image/jpeg") : "image/jpeg"
    setImages((prev) => [...prev, { uri: a.uri, base64: a.base64!, mime }])
    setMoreOpen(false)
  }

  const pickCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) {
      Alert.alert("Permissão", "Habilite o acesso à câmera.")
      return
    }
    const r = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.8 })
    if (r.canceled) return
    const a = r.assets?.[0]
    if (!a?.base64 || !a.uri) return
    const mime = a.type === "image" ? (a.mimeType || "image/jpeg") : "image/jpeg"
    setImages((prev) => [...prev, { uri: a.uri, base64: a.base64!, mime }])
    setMoreOpen(false)
  }

  const openPrompt = (title: string, onSubmit: (v: string) => void) => {
    setPromptTitle(title)
    setPromptValue("")
    promptSubmitRef.current = onSubmit
    setPromptOpen(true)
  }

  const startRecording = async () => {
    try {
      const perm = await Audio.requestPermissionsAsync()
      if (!perm.granted) {
        Alert.alert("Permissão", "Habilite o acesso ao microfone.")
        return
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true })
      const rec = new Audio.Recording()
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY)
      await rec.startAsync()
      setRecording(rec)
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
      setRecording(null)
      const seconds = Math.max(1, Math.round((status.durationMillis || 0) / 1000))
      setPendingAudioSeconds(seconds)
      if (uri) {
        const b64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' })
        setMessages((prev) => [...prev, { id: String(Date.now()), role: "user", content: `🎤 ${seconds}s` }])
        await sendAudioBase64(b64, "audio/m4a")
      }
    } catch (e) {
      Alert.alert("Erro", "Não foi possível finalizar a gravação.")
      setRecording(null)
    }
  }

  const webSearch = async (query: string) => {
    const braveKey = process.env.EXPO_PUBLIC_BRAVE_API_KEY as string | undefined
    if (!braveKey) {
      Alert.alert("Buscar na Web", "Defina EXPO_PUBLIC_BRAVE_API_KEY.")
      return
    }
    try {
      const res = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}`, { headers: { "X-Subscription-Token": braveKey } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const items = (data?.web?.results || []).slice(0, 5)
      const ctx = items.map((it: any, i: number) => `${i + 1}. ${it.title}\n${it.description}\n${it.url}`).join("\n\n")
      setFiles((prev) => [...prev, { name: "Resultados da Web", content: ctx }])
      setMoreOpen(false)
      Alert.alert("Buscar na Web", "Resultados adicionados ao contexto.")
    } catch (e: any) {
      Alert.alert("Erro", e?.message ?? "Falha ao buscar")
    }
  }

  const addTextFile = async (v: string) => {
    const txt = String(v || "").trim()
    if (!txt) return
    setFiles((prev) => [...prev, { name: `Arquivo ${Date.now()}.txt`, content: txt }])
    setMoreOpen(false)
  }

  const generateImageFromPrompt = async (p: string) => {
    const desc = String(p || "").trim()
    if (!desc) return
    if (!openaiKey) {
      Alert.alert("Criar imagem", "Defina EXPO_PUBLIC_OPENAI_API_KEY para gerar imagens.")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({ model: "gpt-image-1", prompt: desc, size: "1024x1024", response_format: "b64_json" })
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const b64 = String(data?.data?.[0]?.b64_json || "")
      if (b64) {
        setMessages((prev) => [...prev, { id: String(Date.now()), role: "assistant", imageB64: b64 }])
      }
    } catch (e: any) {
      Alert.alert("Erro", e?.message ?? "Falha ao gerar imagem")
    } finally {
      setLoading(false)
      setMoreOpen(false)
    }
  }

  const deepResearch = async (topic: string) => {
    const q = String(topic || "").trim()
    if (!q) return
    await webSearch(q)
    setThinkingMode(true)
    setText(`Realize uma pesquisa aprofundada sobre "${q}" com referências e links. Estruture um relatório detalhado.`)
    await send()
  }

  const canvasAction = async (topic: string) => {
    const q = String(topic || "").trim()
    if (!q) return
    setText(`Crie um canvas para "${q}" com seções: Objetivos, Ideias, Recursos, Tarefas, Riscos. Use markdown para organizar.`)
    await send()
  }

  const guidedLearning = async (topic: string) => {
    const q = String(topic || "").trim()
    if (!q) return
    setThinkingMode(true)
    setText(`Crie um plano de estudo guiado sobre "${q}" com objetivos semanais, exercícios práticos e avaliação.`)
    await send()
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
      <View style={[styles.header, { paddingTop: 16 + insets.top }]}> 
        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Gemini</Text>
          <Text style={styles.headerSubtitle}>Conectado</Text>
        </View>
        <View style={styles.headerIcon} />
      </View>
      <View style={styles.thinDivider} />

      <ScrollView ref={scrollRef} style={styles.messagesContainer} contentContainerStyle={styles.messagesContent}>
        {messages.map((m) => (
          <View key={m.id} style={[styles.messageContainer, m.role === "user" ? styles.userMessage : styles.assistantMessage]}>
            <View style={[styles.messageBubble, m.role === "user" ? styles.userBubble : styles.assistantBubble]}>
              {!!m.content && (
                <Text style={[styles.messageText, m.role === "user" ? styles.userText : styles.assistantText]}>{m.content}</Text>
              )}
              {!!m.imageB64 && (
                <Image source={{ uri: `data:image/png;base64,${m.imageB64}` }} style={{ width: 220, height: 220, borderRadius: 12, marginTop: 8 }} />
              )}
            </View>
          </View>
        ))}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#8b5cf6" />
            <Text style={styles.loadingText}>Pensando...</Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.inputContainer, { paddingBottom: 16 + insets.bottom + 8 }]}>
        <TouchableOpacity style={styles.plusButton} onPress={() => setMoreOpen(true)}>
          <Ionicons name="add" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Digite sua mensagem..."
            placeholderTextColor="#9ca3af"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={send}
          />
          <TouchableOpacity onPress={recording ? stopRecording : startRecording} style={styles.inlineIconButton} disabled={loading}>
            <Ionicons name={recording ? "stop-circle" : "mic-outline"} size={20} color={recording ? "#ef4444" : colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={[styles.sendButtonCircle, !text.trim() && styles.sendButtonDisabled]} onPress={send} disabled={!text.trim() || loading}>
          <Ionicons name="send" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <Modal visible={moreOpen} transparent animationType="fade" onRequestClose={() => setMoreOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.actionsSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Mais</Text>
              <TouchableOpacity style={styles.sheetClose} onPress={() => setMoreOpen(false)}>
                <Ionicons name="close" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.sheetDivider} />

            <View style={styles.sheetSection}>
              <View style={styles.sheetCard}>
                <TouchableOpacity style={styles.sheetItem} onPress={() => openPrompt("Arquivos", (v) => addTextFile(v))}>
                  <View style={styles.sheetItemLeft}>
                    <Ionicons name="attach-outline" size={20} color="#9ca3af" />
                    <Text style={styles.sheetItemTitle}>Arquivos</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sheetItem} onPress={pickImage}>
                  <View style={styles.sheetItemLeft}>
                    <Ionicons name="image" size={20} color="#9ca3af" />
                    <Text style={styles.sheetItemTitle}>Galeria</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.sheetItem, styles.sheetLink]} onPress={pickCamera}>
                  <View style={styles.sheetItemLeft}>
                    <Ionicons name="camera-outline" size={20} color="#9ca3af" />
                    <Text style={styles.sheetItemTitle}>Câmera</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.sheetSection}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Ferramentas</Text>
                <View style={styles.sheetClose} />
              </View>
              <View style={styles.sheetDivider} />
              <View style={styles.sheetCard}>
                <TouchableOpacity style={styles.sheetItem} onPress={() => openPrompt("Crie Imagens", (v) => generateImageFromPrompt(v))}>
                  <View style={styles.sheetItemLeft}>
                    <Ionicons name="color-wand-outline" size={20} color="#9ca3af" />
                    <Text style={styles.sheetItemTitle}>Crie Imagens</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sheetItem} onPress={() => openPrompt("Deep Research", (v) => deepResearch(v))}>
                  <View style={styles.sheetItemLeft}>
                    <Ionicons name="search-outline" size={20} color="#9ca3af" />
                    <Text style={styles.sheetItemTitle}>Deep Research</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sheetItem} onPress={() => openPrompt("Canvas", (v) => canvasAction(v))}>
                  <View style={styles.sheetItemLeft}>
                    <Ionicons name="grid-outline" size={20} color="#9ca3af" />
                    <Text style={styles.sheetItemTitle}>Canvas</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.sheetItem, styles.sheetLink]} onPress={() => openPrompt("Aprendizado Guiado", (v) => guidedLearning(v))}>
                  <View style={styles.sheetItemLeft}>
                    <Ionicons name="school-outline" size={20} color="#9ca3af" />
                    <Text style={styles.sheetItemTitle}>Aprendizado Guiado</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={promptOpen} transparent animationType="fade" onRequestClose={() => setPromptOpen(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: colors.overlay }} onPress={() => setPromptOpen(false)} />
        <View style={{ position: 'absolute', left: 16, right: 16, bottom: 120, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ padding: 14 }}>
            <Text style={{ fontSize: 16, color: colors.textPrimary, fontWeight: '600', marginBottom: 8 }}>{promptTitle}</Text>
            <TextInput value={promptValue} onChangeText={setPromptValue} placeholder="Digite aqui" placeholderTextColor="#9ca3af" style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, color: colors.textPrimary }} />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, columnGap: 12 }}>
              <TouchableOpacity onPress={() => setPromptOpen(false)} style={{ paddingHorizontal: 14, paddingVertical: 8 }}><Text style={{ color: colors.textSecondary }}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => { const v = promptValue; setPromptOpen(false); promptSubmitRef.current(v) }} style={{ paddingHorizontal: 14, paddingVertical: 8, backgroundColor: colors.link, borderRadius: 8 }}><Text style={{ color: '#fff' }}>Confirmar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  )
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  screen: {
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
  headerIcon: {
    padding: 8,
    width: 32,
  },
  headerTextContainer: {
    alignItems: 'center',
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
  inlineIconButton: {
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: c.textPrimary,
    maxHeight: 80,
    paddingVertical: 8,
  },
  plusButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: c.bg,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: c.bg,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: c.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: c.overlay,
    justifyContent: 'flex-end',
  },
  actionsSheet: {
    backgroundColor: c.surfaceAlt,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: c.textPrimary,
  },
  sheetClose: {
    padding: 4,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: c.divider,
  },
  sheetSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sheetCard: {
    backgroundColor: c.surface,
    borderRadius: 12,
    paddingVertical: 8,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  sheetLink: {
    borderBottomWidth: 0,
  },
  sheetItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sheetItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: c.textPrimary,
  },
})
