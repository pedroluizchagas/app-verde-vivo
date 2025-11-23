import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import { useOfflineSync } from '../hooks/useOfflineSync'

interface Task {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

export function TasksScreen() {
  const { user } = useAuth()
  const [selectedFilter, setSelectedFilter] = useState('Todas');
  const [tasks, setTasks] = useState<Task[]>([]);

  const filters = ['Todas', 'Pendentes', 'Concluídas'];

  const {
    data: dataTasks,
    loading,
    error,
    refresh,
  } = useOfflineSync<Task[]>('tasks', async () => {
    const { data: { user: current } } = await supabase.auth.getUser()
    if (!current) return []
    const { data } = await supabase
      .from('tasks')
      .select('id, title, status, due_date')
      .eq('gardener_id', current.id)
      .order('due_date', { ascending: true })
    return (data || []).map((t: any) => ({
      id: String(t.id),
      title: String(t.title || 'Tarefa'),
      dueDate: t.due_date ? new Date(String(t.due_date)).toLocaleDateString('pt-BR') : '',
      completed: String(t.status) === 'done',
    }))
  })

  useEffect(() => {
    setTasks(dataTasks || [])
  }, [dataTasks])

  const filteredTasks = tasks.filter(task => {
    if (selectedFilter === 'Pendentes') return !task.completed;
    if (selectedFilter === 'Concluídas') return task.completed;
    return true;
  });

  const toggleTask = async (taskId: string) => {
    const t = tasks.find(x => x.id === taskId)
    if (!t) return
    const newCompleted = !t.completed
    try {
      setTasks(tasks.map(task => task.id === taskId ? { ...task, completed: newCompleted } : task))
      const newStatus = newCompleted ? 'done' : 'open'
      await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId)
    } catch (e) {
    }
  };

  const renderTask = ({ item }: { item: Task }) => (
    <View style={styles.taskCard}>
      <TouchableOpacity 
        style={styles.checkbox}
        onPress={() => toggleTask(item.id)}
      >
        {item.completed ? (
          <View style={styles.checkedBox}>
            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
          </View>
        ) : (
          <View style={styles.uncheckedBox} />
        )}
      </TouchableOpacity>
      
      <View style={styles.taskContent}>
        <Text style={[styles.taskTitle, item.completed && styles.completedTaskTitle]}>
          {item.title}
        </Text>
        {Boolean(item.dueDate) && <Text style={styles.taskDate}>{item.dueDate}</Text>}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0F1115" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tarefas</Text>
          <View style={styles.addButton}><Ionicons name="add" size={24} color="#FFFFFF" /></View>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F1115" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tarefas</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              selectedFilter === filter && styles.filterChipActive
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text style={[
              styles.filterText,
              selectedFilter === filter && styles.filterTextActive
            ]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredTasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.tasksList}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1115',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E2126',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1E2126',
  },
  filterChipActive: {
    backgroundColor: '#2ECC71',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#888888',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  tasksList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: '#1E2126',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  checkbox: {
    marginRight: 12,
  },
  uncheckedBox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#888888',
  },
  checkedBox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2ECC71',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  completedTaskTitle: {
    textDecorationLine: 'line-through',
    color: '#888888',
  },
  taskClient: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 2,
  },
  taskDate: {
    fontSize: 14,
    color: '#888888',
  },
});

export default TasksScreen;