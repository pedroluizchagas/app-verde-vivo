import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { FlatList, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../supabase'
import { useOfflineSync } from '../hooks/useOfflineSync'
import { useTheme } from '../contexts/ThemeContext'
import type { ThemeColors } from '../theme'
import { SearchBar } from '../components/SearchBar'
import { Card } from '../components/Card'

interface Task {
  id: string
  title: string
  status: "open" | "in_progress" | "done"
  importance: "low" | "medium" | "high"
  tags: string[] | null
  due_date: string | null
  client_id: string | null
  client_name?: string | null
  description: string | null
  organized_description: string | null
  created_at?: string
  updated_at?: string
}

export function TasksScreen() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<any>()
  const { colors, isDark } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  const [selectedFilter, setSelectedFilter] = useState<'Todas' | 'Pendentes' | 'Concluídas'>('Todas')
  const [searchQuery, setSearchQuery] = useState('')
  const [tasks, setTasks] = useState<Task[]>([])

  const filters = useMemo(() => (['Todas', 'Pendentes', 'Concluídas'] as const), [])

  const fetchTasks = useCallback(async () => {
    const { data: { user: current } } = await supabase.auth.getUser()
    if (!current) return []
    const [{ data: tasksData, error: tasksError }, { data: clientsData, error: clientsError }] = await Promise.all([
      supabase
        .from('tasks')
        .select('id, title, status, importance, tags, due_date, client_id, description, organized_description, created_at, updated_at')
        .eq('gardener_id', current.id)
        .order('due_date', { ascending: true }),
      supabase
        .from('clients')
        .select('id, name')
        .eq('gardener_id', current.id),
    ])
    if (tasksError) throw tasksError
    if (clientsError) throw clientsError

    const clientNameById = new Map<string, string>()
    for (const c of clientsData || []) {
      if (c?.id && c?.name) clientNameById.set(String(c.id), String(c.name))
    }

    return (tasksData || []).map((t: any) => ({
      id: String(t.id),
      title: String(t.title || 'Tarefa'),
      status: (t.status as any) || 'open',
      importance: (t.importance as any) || 'medium',
      tags: Array.isArray(t.tags) ? (t.tags as any) : null,
      due_date: t.due_date ? String(t.due_date) : null,
      client_id: t.client_id ? String(t.client_id) : null,
      client_name: t.client_id ? (clientNameById.get(String(t.client_id)) ?? null) : null,
      description: t.description ? String(t.description) : null,
      organized_description: t.organized_description ? String(t.organized_description) : null,
      created_at: t.created_at ? String(t.created_at) : undefined,
      updated_at: t.updated_at ? String(t.updated_at) : undefined,
    })) as Task[]
  }, [])

  const { data: dataTasks, loading, error, refresh } = useOfflineSync<Task[]>('tasks', fetchTasks)

  useEffect(() => {
    setTasks(dataTasks || [])
  }, [dataTasks])

  useFocusEffect(
    useCallback(() => {
      refresh()
      return () => {}
    }, [refresh])
  )

  const stats = useMemo(() => {
    const total = tasks.length
    const done = tasks.filter((t) => t.status === 'done').length
    const pending = total - done
    return { total, pending, done }
  }, [tasks])

  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return tasks
      .filter((task) => {
        if (selectedFilter === 'Pendentes') return task.status !== 'done'
        if (selectedFilter === 'Concluídas') return task.status === 'done'
        return true
      })
      .filter((task) => {
        if (!q) return true
        const hay = [
          task.title,
          task.client_name || '',
          task.description || '',
          task.organized_description || '',
          ...(task.tags || []),
        ].join(' ').toLowerCase()
        return hay.includes(q)
      })
  }, [tasks, selectedFilter, searchQuery])

  const formatDue = (iso: string | null) => {
    if (!iso) return ''
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleDateString('pt-BR')
  }

  const statusLabel = (s: Task['status']) => (s === 'done' ? 'Concluída' : s === 'in_progress' ? 'Em progresso' : 'Pendente')
  const statusBg = (s: Task['status']) => (s === 'done' ? colors.success : s === 'in_progress' ? colors.link : colors.warning)
  const statusText = (s: Task['status']) => (s === 'open' ? '#111827' : '#ffffff')

  const toggleTask = async (taskId: string) => {
    const t = tasks.find((x) => x.id === taskId)
    if (!t) return
    const newStatus: Task['status'] = t.status === 'done' ? 'open' : 'done'
    try {
      setTasks(tasks.map((task) => task.id === taskId ? { ...task, status: newStatus } : task))
      await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId)
    } catch {}
  }

  const renderTask = ({ item }: { item: Task }) => {
    const due = formatDue(item.due_date)
    const pillBg = statusBg(item.status)
    const pillColor = statusText(item.status)
    return (
      <TouchableOpacity
        style={styles.taskCard}
        onPress={() => navigation.navigate('TaskForm', { task: item })}
        accessibilityRole="button"
        accessibilityLabel={`Abrir tarefa ${item.title}`}
      >
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => toggleTask(item.id)}
          accessibilityRole="button"
          accessibilityLabel={item.status === 'done' ? 'Marcar como pendente' : 'Marcar como concluída'}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {item.status === 'done' ? (
            <View style={styles.checkedBox}>
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            </View>
          ) : (
            <View style={styles.uncheckedBox} />
          )}
        </TouchableOpacity>

        <View style={styles.taskContent}>
          <View style={styles.taskTopRow}>
            <Text style={[styles.taskTitle, item.status === 'done' ? styles.completedTaskTitle : null]} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={[styles.statusPill, { backgroundColor: pillBg }]}>
              <Text style={[styles.statusText, { color: pillColor }]}>{statusLabel(item.status)}</Text>
            </View>
          </View>

          <View style={styles.taskMetaRow}>
            {Boolean(item.client_name) && (
              <View style={styles.metaItem}>
                <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.metaText} numberOfLines={1}>{String(item.client_name)}</Text>
              </View>
            )}
            {Boolean(due) && (
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.metaText}>{due}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  const Header = (
    <View>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />
      <View style={[styles.header, { paddingTop: 16 + insets.top }]}>
        <View>
          <Text style={styles.title}>Tarefas</Text>
          <Text style={styles.subtitle}>Organize e acompanhe suas atividades</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => navigation.navigate('TaskForm')} style={styles.headerIcon} accessibilityRole="button" accessibilityLabel="Nova tarefa">
            <Ionicons name="add" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.thinDivider} />

      <View style={styles.section}>
        <Card style={styles.summaryCard} padding={14}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total</Text>
              <Text style={styles.summaryValue}>{stats.total}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Pendentes</Text>
              <Text style={[styles.summaryValue, { color: colors.warning }]}>{stats.pending}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Concluídas</Text>
              <Text style={[styles.summaryValue, { color: colors.success }]}>{stats.done}</Text>
            </View>
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <SearchBar
          placeholder="Buscar por título, cliente ou tags..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchBar}
        />
        <View style={styles.filterRow}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, selectedFilter === filter ? styles.filterChipActive : null]}
              onPress={() => setSelectedFilter(filter)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              accessibilityRole="button"
              accessibilityLabel={`Filtrar: ${filter}`}
            >
              <Text style={[styles.filterText, selectedFilter === filter ? styles.filterTextActive : null]}>{filter}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  )

  if (loading) {
    return <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>{Header}</SafeAreaView>
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <FlatList
        data={filteredTasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={Header}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkbox-outline" size={46} color={colors.textSecondary} />
            <Text style={styles.emptyText}>
              {error ? 'Erro ao carregar tarefas' : (searchQuery.trim() ? 'Nenhuma tarefa encontrada para a busca' : 'Nenhuma tarefa encontrada')}
            </Text>
            {Boolean(error) && (
              <TouchableOpacity style={styles.retryButton} onPress={refresh} accessibilityRole="button" accessibilityLabel="Tentar novamente">
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
  container: { flex: 1, backgroundColor: c.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: c.headerBg },
  title: { fontSize: 20, fontWeight: '700', color: c.textPrimary },
  subtitle: { marginTop: 2, fontSize: 13, color: c.textSecondary },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  headerIcon: { marginLeft: 12, padding: 8 },
  thinDivider: { height: 1, backgroundColor: c.divider },
  section: { paddingHorizontal: 20 },
  searchBar: { marginTop: 6 },
  summaryCard: { backgroundColor: c.surface, borderColor: c.border },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 12, fontWeight: '700', color: c.textSecondary },
  summaryValue: { marginTop: 6, fontSize: 22, fontWeight: '900', color: c.textPrimary },
  summaryDivider: { width: 1, height: 34, backgroundColor: c.divider, opacity: 0.8 },
  filterRow: { flexDirection: 'row', paddingVertical: 10, columnGap: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 18, backgroundColor: c.border, height: 30, justifyContent: 'center' },
  filterChipActive: { backgroundColor: c.link },
  filterText: { fontSize: 13, fontWeight: '600', color: c.textSecondary },
  filterTextActive: { color: '#ffffff' },
  listContent: { paddingTop: 0 },
  taskCard: { flexDirection: 'row', backgroundColor: c.surface, borderRadius: 12, padding: 16, marginBottom: 12, marginHorizontal: 20, borderWidth: 1, borderColor: c.border, alignItems: 'center' },
  checkbox: { marginRight: 12 },
  uncheckedBox: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: c.textSecondary },
  checkedBox: { width: 20, height: 20, borderRadius: 10, backgroundColor: c.success, justifyContent: 'center', alignItems: 'center' },
  taskContent: { flex: 1 },
  taskTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', columnGap: 10 },
  taskTitle: { fontSize: 16, fontWeight: '700', color: c.textPrimary, flex: 1 },
  completedTaskTitle: { textDecorationLine: 'line-through', color: c.textSecondary },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  statusText: { fontSize: 12, fontWeight: '800' },
  taskMetaRow: { flexDirection: 'row', alignItems: 'center', columnGap: 14, marginTop: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', columnGap: 6, flexShrink: 1 },
  metaText: { fontSize: 13, fontWeight: '600', color: c.textSecondary, flexShrink: 1 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 36, paddingHorizontal: 20 },
  emptyText: { marginTop: 10, fontSize: 15, fontWeight: '600', color: c.textSecondary, textAlign: 'center' },
  retryButton: { marginTop: 14, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface },
  retryButtonText: { fontSize: 14, fontWeight: '700', color: c.textPrimary },
})

export default TasksScreen
