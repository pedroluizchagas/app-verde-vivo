import { useState } from "react"
import { View, TextInput, StyleSheet, TouchableOpacity } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../contexts/ThemeContext"

interface SearchBarProps {
  placeholder?: string
  value: string
  onChangeText: (text: string) => void
  onClear?: () => void
  style?: any
  variant?: 'light' | 'dark'
}

export function SearchBar({ 
  placeholder = "Buscar...", 
  value, 
  onChangeText, 
  onClear,
  style,
  variant 
}: SearchBarProps) {
  const { mode } = useTheme()
  const isDark = (variant ?? mode) === 'dark'
  return (
    <View style={[styles.container, isDark ? styles.containerDark : null, style]}>
      <Ionicons name="search" size={20} color={isDark ? '#9ca3af' : '#6b7280'} style={styles.icon} />
      <TextInput
        style={[styles.input, isDark ? styles.inputDark : null]}
        placeholder={placeholder}
        placeholderTextColor={isDark ? '#9ca3af' : '#9ca3af'}
        value={value}
        onChangeText={onChangeText}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={onClear || (() => onChangeText(""))} style={styles.clearButton}>
          <Ionicons name="close-circle" size={18} color={isDark ? '#9ca3af' : '#6b7280'} />
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  containerDark: {
    backgroundColor: '#2a2f36',
    borderColor: '#374151',
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    paddingVertical: 0,
  },
  inputDark: {
    color: '#f9fafb',
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
})