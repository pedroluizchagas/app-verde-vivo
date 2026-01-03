import React, { useState, useEffect, useCallback } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Alert } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { supabase } from "../supabase"
import { useOfflineSync } from "../hooks/useOfflineSync"
import { useFocusEffect, useNavigation } from "@react-navigation/native"
import { useTheme } from "../contexts/ThemeContext"
import type { ThemeColors } from "../theme"
import { SearchBar } from "../components/SearchBar"
import { Card } from "../components/Card"

interface Note {
  id: string
  title: string | null
  content: string
  organized_content?: string | null
  importance?: "low" | "medium" | "high"
  tags?: string[] | null
  client_id?: string | null
  client_name?: string | null
  created_at: string
  updated_at?: string
}

export function NotesScreen() {
  const navigation = useNavigation<any>()
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([])
  const { colors, isDark } = useTheme()
  const styles = createStyles(colors)

  const fetchNotes = useCallback(async () => {
    const { data: { user: current } } = await supabase.auth.getUser()
    if (!current) return []
    const [{ data: notesData, error: notesError }, { data: clientsData, error: clientsError }] = await Promise.all([
      supabase
        .from("notes")
        .select("id, title, content, organized_content, importance, tags, client_id, created_at, updated_at")
        .eq("gardener_id", current.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("clients")
        .select("id, name")
        .eq("gardener_id", current.id),
    ])
    if (notesError) throw notesError
    if (clientsError) throw clientsError

    const clientNameById = new Map<string, string>()
    for (const c of clientsData || []) {
      if (c?.id && c?.name) clientNameById.set(String(c.id), String(c.name))
    }

    return (notesData || []).map((n: any) => ({
      id: String(n.id),
      title: n.title ? String(n.title) : null,
      content: String(n.content || ""),
      organized_content: n.organized_content ? String(n.organized_content) : null,
      importance: (n.importance as any) || "medium",
      tags: Array.isArray(n.tags) ? (n.tags as any) : null,
      client_id: n.client_id ? String(n.client_id) : null,
      client_name: n.client_id ? (clientNameById.get(String(n.client_id)) ?? null) : null,
      created_at: String(n.created_at),
      updated_at: n.updated_at ? String(n.updated_at) : undefined,
    }))
  }, [])

  const {
    data: notes,
    loading,
    error,
    refresh,
    isSyncing,
  } = useOfflineSync<Note[]>("notes", fetchNotes)

  useEffect(() => {
    const list = (notes || [])
    const q = searchQuery.trim().toLowerCase()
    if (!q) {
      setFilteredNotes(list)
      return
    }
    const filtered = list.filter(note =>
      (note.title || "").toLowerCase().includes(q) ||
      note.content.toLowerCase().includes(q) ||
      (note.organized_content || "").toLowerCase().includes(q) ||
      (note.client_name || "").toLowerCase().includes(q) ||
      (note.tags || []).some((t) => String(t).toLowerCase().includes(q))
    )
    setFilteredNotes(filtered)
  }, [searchQuery, notes])

  useFocusEffect(
    useCallback(() => {
      refresh()
    }, [refresh])
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  const importanceLabel = (importance?: "low" | "medium" | "high") => {
    if (importance === "high") return "Alta"
    if (importance === "low") return "Baixa"
    return "Média"
  }

  const importanceColor = (importance?: "low" | "medium" | "high") => {
    if (importance === "high") return colors.danger
    if (importance === "low") return colors.muted
    return colors.warning
  }

  const openNoteActions = (note: Note) => {
    Alert.alert(
      note.title || "Nota",
      "O que você deseja fazer?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Editar",
          onPress: () => navigation.navigate("NoteForm" as never, { note } as never),
        },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => confirmDelete(note),
        },
      ]
    )
  }

  const confirmDelete = (note: Note) => {
    Alert.alert(
      "Excluir nota",
      "Tem certeza que deseja excluir esta nota? Essa ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", style: "destructive", onPress: () => deleteNote(note.id) },
      ]
    )
  }

  const deleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase.from("notes").delete().eq("id", noteId)
      if (error) throw error
      refresh()
    } catch (e: any) {
      Alert.alert("Erro", e?.message || "Não foi possível excluir a nota.")
    }
  }

  const renderNoteCard = ({ item }: { item: Note }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => navigation.navigate("NoteForm" as never, { note: item } as never)}
    >
      <Card style={styles.noteCard}>
        <View style={styles.noteContent}>
          <View style={styles.noteTopRow}>
            <Text style={styles.noteTitle} numberOfLines={2}>
              {item.title || "Sem título"}
            </Text>
            <View style={[styles.importancePill, { backgroundColor: importanceColor(item.importance) }]}>
              <Text style={styles.importanceText}>{importanceLabel(item.importance)}</Text>
            </View>
          </View>
          {Boolean(item.client_name) && <Text style={styles.noteMeta} numberOfLines={1}>{item.client_name}</Text>}
          {item.content && (
            <Text style={styles.notePreview} numberOfLines={2}>
              {truncateText(item.organized_content || item.content, 110)}
            </Text>
          )}
          <Text style={styles.noteDate}>
            {formatDate(item.created_at)}
          </Text>
        </View>
        <TouchableOpacity style={styles.optionsButton} onPress={() => openNoteActions(item)}>
          <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </Card>
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.headerBg} />
        <View style={[styles.header, { paddingTop: 12 }]}> 
          <Text style={styles.headerTitle}>Notas</Text>
          <View style={styles.headerIcon}><Ionicons name="add" size={22} color={colors.textPrimary} /></View>
        </View>
        <View style={styles.thinDivider} />
        <View style={styles.emptyContainer}><Text style={styles.emptyText}>Carregando...</Text></View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.headerBg} />
      <View style={[styles.header, { paddingTop: 12 }]}>
        <Text style={styles.headerTitle}>Notas</Text>
        <TouchableOpacity 
          style={styles.headerIcon}
          onPress={() => navigation.navigate("NoteForm" as never)}
        >
          <Ionicons name="add" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
      <View style={styles.thinDivider} />
      <View style={styles.searchRow}>
        <SearchBar
          placeholder="Pesquisar notas"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchBar}
        />
      </View>
      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        renderItem={renderNoteCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={Boolean(isSyncing)}
        onRefresh={refresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>{error ? "Erro ao carregar notas" : "Nenhuma nota encontrada"}</Text>
            {Boolean(error) && (
              <TouchableOpacity style={styles.retryButton} onPress={refresh}>
                <Text style={styles.retryButtonText}>Tentar novamente</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </SafeAreaView>
  )
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: c.headerBg,
  },
  thinDivider: {
    height: 1,
    backgroundColor: c.divider,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: c.textPrimary,
    letterSpacing: -0.5,
  },
  headerIcon: { padding: 6 },
  searchRow: { paddingHorizontal: 20, paddingBottom: 12 },
  searchBar: { },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  noteCard: {
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  noteContent: {
    flex: 1,
    marginRight: 12,
  },
  noteTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 6,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: c.textPrimary,
    lineHeight: 20,
    flex: 1,
  },
  importancePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  importanceText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  noteMeta: {
    fontSize: 12,
    color: c.textSecondary,
    marginBottom: 6,
  },
  notePreview: {
    fontSize: 14,
    color: c.textSecondary,
    marginBottom: 8,
    lineHeight: 18,
  },
  noteDate: {
    fontSize: 12,
    color: c.textSecondary,
    fontWeight: '400',
  },
  optionsButton: {
    padding: 4,
    marginTop: -4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: c.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: c.surface,
  },
  retryButtonText: {
    color: c.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
})

export default NotesScreen
