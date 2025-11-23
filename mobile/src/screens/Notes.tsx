import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  ScrollView
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { supabase } from "../supabase"
import { useAuth } from "../contexts/AuthContext"
import { useOfflineSync } from "../hooks/useOfflineSync"
import { useNavigation } from "@react-navigation/native"
import { useTheme } from "../contexts/ThemeContext"
import type { ThemeColors } from "../theme"

interface Note {
  id: string
  title: string | null
  content: string
  created_at: string
}

export function NotesScreen() {
  const navigation = useNavigation()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([])
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()
  const styles = createStyles(colors)

  const {
    data: notes,
    loading,
    error,
    refresh,
  } = useOfflineSync<Note[]>("notes", async () => {
    const { data: { user: current } } = await supabase.auth.getUser()
    if (!current) return []
    const { data } = await supabase
      .from("notes")
      .select("id, title, content, created_at")
      .eq("gardener_id", current.id)
      .order("created_at", { ascending: false })
    return (data || []).map(n => ({ id: String(n.id), title: n.title as any, content: String(n.content), created_at: String(n.created_at) }))
  })

  

  useEffect(() => {
    const list = (notes || [])
    const filtered = list.filter(note =>
      (note.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredNotes(filtered)
  }, [searchQuery, notes])

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

  const renderNoteCard = ({ item }: { item: Note }) => (
    <View style={styles.noteCard}>
      <View style={styles.noteContent}>
        <Text style={styles.noteTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.content && (
          <Text style={styles.notePreview} numberOfLines={2}>
            {truncateText(item.content, 80)}
          </Text>
        )}
        <Text style={styles.noteDate}>
          {formatDate(item.created_at)}
        </Text>
      </View>
      <TouchableOpacity style={styles.optionsButton}>
        <Ionicons name="ellipsis-vertical" size={20} color="#C5C8CC" />
      </TouchableOpacity>
    </View>
  )

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0F1115" />
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}> 
          <Text style={styles.headerTitle}>Notas</Text>
          <View style={styles.addButton}><Ionicons name="add" size={24} color="#FFFFFF" /></View>
        </View>
        <View style={styles.emptyContainer}><Text style={styles.emptyText}>Carregando...</Text></View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F1115" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>Notas</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate("NoteForm" as never)}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={18} color="#C5C8CC" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar notas"
            placeholderTextColor="#C5C8CC"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>
      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        renderItem={renderNoteCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color="#6b7280" />
            <Text style={styles.emptyText}>Nenhuma nota encontrada</Text>
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
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: c.textPrimary,
    letterSpacing: -0.5,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: c.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: c.textPrimary,
    fontWeight: '400',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  noteCard: {
    backgroundColor: c.surface,
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  noteContent: {
    flex: 1,
    marginRight: 12,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: c.textPrimary,
    marginBottom: 4,
    lineHeight: 20,
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
})

export default NotesScreen
