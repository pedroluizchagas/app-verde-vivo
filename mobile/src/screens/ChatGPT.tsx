import { useState, useRef } from "react"
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Modal, Image } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../contexts/ThemeContext"
import type { ThemeColors } from "../theme"
import * as ImagePicker from "expo-image-picker"
import { Audio } from "expo-av"

type ChatMsg = { id: string; role: "user" | "assistant"; content?: string; imageB64?: string }

export function ChatGPTScreen({ navigation }: any) {
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
  const braveKey = process.env.EXPO_PUBLIC_BRAVE_API_KEY as string | undefined
  const [promptOpen, setPromptOpen] = useState(false)
  const [promptTitle, setPromptTitle] = useState("")
  const [promptValue, setPromptValue] = useState("")
  const promptSubmitRef = useRef<(v: string) => void>(() => {})

  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY as string | undefined

  const send = async () => {
    const t = text.trim()
    if (!t) return
    setMessages((prev) => [...prev, { id: String(Date.now()), role: "user", content: t }])
    setText("")
    setLoading(true)

    if (!apiKey) {
      setLoading(false)
      Alert.alert("API Key", "Defina EXPO_PUBLIC_OPENAI_API_KEY para usar o ChatGPT.")
      return
    }

    try {
      const userContent: any[] = [{ type: "text", text: t }]
      images.forEach((img) => {
        userContent.push({ type: "image_url", image_url: { url: `data:${img.mime};base64,${img.base64}` } })
      })

      const sysMsg = thinkingMode ? "Pense passo a passo e elabore uma resposta detalhada." : "Você é um assistente útil."
      const fileContext = files.length > 0 ? files.map((f) => `Arquivo: ${f.name}\n${f.content.slice(0, 8000)}`).join("\n\n") : null
      const messagesPayload: any[] = [{ role: "system", content: sysMsg }]
      if (fileContext) messagesPayload.push({ role: "system", content: fileContext })
      messagesPayload.push({ role: "user", content: userContent as any })

      const payload = {
        model: thinkingMode ? "gpt-4o" : "gpt-4o-mini",
        temperature: thinkingMode ? 0.2 : 0.7,
        messages: messagesPayload,
      }
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const content = String(data?.choices?.[0]?.message?.content || "")
      setMessages((prev) => [...prev, { id: String(Date.now() + 1), role: "assistant", content }])
    } catch (e: any) {
      setMessages((prev) => [...prev, { id: String(Date.now() + 2), role: "assistant", content: `Erro: ${e?.message ?? "Falha"}` }])
    } finally {
      setLoading(false)
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
      setImages([])
      setFiles([])
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
    setImages((prev) => [...prev, { uri: a.uri, base64: a.base64, mime }])
    setMoreOpen(false)
  }

  const openPrompt = (title: string, onSubmit: (v: string) => void) => {
    setPromptTitle(title)
    setPromptValue("")
    promptSubmitRef.current = onSubmit
    setPromptOpen(true)
  }

  const generateImage = async (p: string) => {
    if (!apiKey) {
      Alert.alert("API Key", "Defina EXPO_PUBLIC_OPENAI_API_KEY.")
      return
    }
      const desc = String(p || "").trim()
      if (!desc) return
      setLoading(true)
      try {
        const res = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
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
      await transcribeAndSend(uri || null)
    } catch (e) {
      Alert.alert("Erro", "Não foi possível finalizar a gravação.")
      setRecording(null)
    }
  }

  const transcribeAndSend = async (uri: string | null) => {
    if (!uri || !apiKey) return
    try {
      setLoading(true)
      const form = new FormData()
      form.append("file", { uri, name: "audio.m4a", type: "audio/m4a" } as any)
      form.append("model", "whisper-1")
      const res = await fetch("https://api.openai.com/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${apiKey}` }, body: form })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const transcript = String(data?.text || "")
      setMessages((prev) => [...prev, { id: String(Date.now()), role: "user", content: `🎤 ${pendingAudioSeconds}s` }])
      setText(transcript)
      await send()
    } catch (e: any) {
      Alert.alert("Erro", e?.message ?? "Falha ao transcrever áudio")
    } finally {
      setLoading(false)
    }
  }

  const webSearch = async (query: string) => {
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

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
      <View style={[styles.header, { paddingTop: 16 + insets.top }]}> 
        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>ChatGPT Plus</Text>
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
        {images.length > 0 || files.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.attachmentsRow} contentContainerStyle={{ alignItems: 'center' }}>
            {images.map((img, idx) => (
              <View key={`img_${idx}`} style={styles.attachmentChip}>
                <Image source={{ uri: img.uri }} style={{ width: 40, height: 40, borderRadius: 8 }} />
                <TouchableOpacity onPress={() => setImages((prev) => prev.filter((_, i) => i !== idx))} style={styles.removeChip}><Ionicons name="close" size={16} color="#fff" /></TouchableOpacity>
              </View>
            ))}
            {files.map((f, idx) => (
              <View key={`file_${idx}`} style={styles.textChip}><Text numberOfLines={1} style={styles.textChipLabel}>{f.name}</Text><TouchableOpacity onPress={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}><Ionicons name="close" size={14} color="#9ca3af" /></TouchableOpacity></View>
            ))}
          </ScrollView>
        ) : null}
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
              <Text style={styles.sheetTitle}>Ações</Text>
              <TouchableOpacity style={styles.sheetClose} onPress={() => setMoreOpen(false)}>
                <Ionicons name="close" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.sheetDivider} />

            <View style={styles.sheetSection}>
              <View style={styles.sheetCard}>
                <TouchableOpacity style={styles.sheetItem} onPress={pickImage}>
                  <View style={styles.sheetItemLeft}>
                    <Ionicons name="image" size={20} color="#9ca3af" />
                    <Text style={styles.sheetItemTitle}>Imagem da galeria</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sheetItem} onPress={() => openPrompt("Criar imagem", (v) => generateImage(v))}>
                  <View style={styles.sheetItemLeft}>
                    <Ionicons name="color-wand-outline" size={20} color="#9ca3af" />
                    <Text style={styles.sheetItemTitle}>Criar imagem</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sheetItem} onPress={() => { setThinkingMode((v) => !v); setMoreOpen(false) }}>
                  <View style={styles.sheetItemLeft}>
                    <Ionicons name="sparkles-outline" size={20} color="#9ca3af" />
                    <Text style={styles.sheetItemTitle}>{thinkingMode ? "Pensando: ON" : "Pensando"}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sheetItem} onPress={() => openPrompt("Investigar", async (v) => { const t = String(v || "").trim(); if (!t) return; setText(`Investigue: ${t}`); await send(); setMoreOpen(false) })}>
                  <View style={styles.sheetItemLeft}>
                    <Ionicons name="search-outline" size={20} color="#9ca3af" />
                    <Text style={styles.sheetItemTitle}>Investigar</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sheetItem} onPress={() => openPrompt("Buscar na Web", async (v) => { const t = String(v || "").trim(); if (!t) return; await webSearch(t) })}>
                  <View style={styles.sheetItemLeft}>
                    <Ionicons name="globe-outline" size={20} color="#9ca3af" />
                    <Text style={styles.sheetItemTitle}>Buscar na Web</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sheetItem} onPress={() => openPrompt("Estudar", async (v) => { const t = String(v || "").trim(); if (!t) return; setThinkingMode(true); setText(`Explique e ensine: ${t}`); await send(); setMoreOpen(false) })}>
                  <View style={styles.sheetItemLeft}>
                    <Ionicons name="book-outline" size={20} color="#9ca3af" />
                    <Text style={styles.sheetItemTitle}>Estudar e aprender</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.sheetItem, styles.sheetLink]} onPress={() => openPrompt("Adicionar arquivo", (v) => addTextFile(v))}>
                  <View style={styles.sheetItemLeft}>
                    <Ionicons name="attach-outline" size={20} color="#9ca3af" />
                    <Text style={styles.sheetItemTitle}>Adicionar arquivos</Text>
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
  attachmentsRow: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 80,
    height: 50,
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
  sheetItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sheetItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: c.textPrimary,
  },
  attachmentChip: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: c.border,
    overflow: 'hidden',
    position: 'relative',
  },
  removeChip: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: c.surface,
  },
  textChipLabel: {
    maxWidth: 120,
    color: c.textPrimary,
    marginRight: 6,
  },
  inlineIconButton: {
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
})

function ActionItem({ label, icon, onPress, colors }: { label: string; icon: string; onPress: () => void; colors: ThemeColors }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ width: 120, alignItems: 'center', paddingVertical: 8, marginHorizontal: 6 }}>
      <View style={{ width: 64, height: 64, borderRadius: 12, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon as any} size={28} color={colors.textPrimary} />
      </View>
      <Text style={{ fontSize: 12, color: colors.textPrimary, marginTop: 6 }}>{label}</Text>
    </TouchableOpacity>
  )
}