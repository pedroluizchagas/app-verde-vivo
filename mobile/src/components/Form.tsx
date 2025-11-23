import { View, Text, TextInput, StyleSheet, TextInputProps, TouchableOpacity, Modal } from "react-native"
import React from 'react'
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../contexts/ThemeContext"
import { Calendar } from "./Calendar"

interface InputProps extends TextInputProps {
  label: string
  error?: string
  required?: boolean
  variant?: 'light' | 'dark'
}

interface SelectProps {
  label: string
  value: string
  onValueChange: (value: string) => void
  options: { label: string; value: string }[]
  error?: string
  required?: boolean
  variant?: 'light' | 'dark'
  columns?: number
}

interface DateInputProps {
  label: string
  value: Date | null
  onValueChange: (date: Date) => void
  error?: string
  required?: boolean
  variant?: 'light' | 'dark'
}

export function Input({ label, error, required, variant, ...props }: InputProps) {
  const { mode } = useTheme()
  const isDark = (variant ?? mode) === 'dark'
  return (
    <View style={styles.inputContainer}>
      <Text style={[styles.label, isDark && styles.labelDark]}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        style={[styles.input, isDark && styles.inputDark, error && styles.inputError]}
        placeholderTextColor={isDark ? '#9ca3af' : '#9CA3AF'}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  )
}

export function Select({ label, value, onValueChange, options, error, required, variant, columns }: SelectProps) {
  const { mode } = useTheme()
  const isDark = (variant ?? mode) === 'dark'
  return (
    <View style={styles.inputContainer}>
      <Text style={[styles.label, isDark && styles.labelDark]}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <View style={[styles.selectContainer, columns ? styles.selectContainerWrap : null, isDark && styles.selectContainerDark, error && styles.inputError]}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.selectOption,
              columns ? styles.selectOptionWrap : null,
              value === option.value && styles.selectOptionActive
            ]}
            onPress={() => onValueChange(option.value)}
          >
            <Text style={[
              styles.selectOptionText,
              value === option.value && styles.selectOptionTextActive
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  )
}

export function DateInput({ label, value, onValueChange, error, required, variant }: DateInputProps) {
  const { mode, colors } = useTheme()
  const isDark = (variant ?? mode) === 'dark'
  const [open, setOpen] = React.useState(false)
  const [temp, setTemp] = React.useState<Date>(value || new Date())
  const formatDate = (date: Date) => date.toLocaleDateString('pt-BR')

  return (
    <View style={styles.inputContainer}>
      <Text style={[styles.label, isDark && styles.labelDark]}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TouchableOpacity
        style={[styles.dateInput, isDark && styles.dateInputDark, error && styles.inputError]}
        onPress={() => { setTemp(value || new Date()); setOpen(true) }}
      >
        <Text style={value ? (isDark ? styles.dateTextDark : styles.dateText) : styles.datePlaceholder}>
          {value ? formatDate(value) : 'Selecione uma data'}
        </Text>
        <Ionicons name="calendar-outline" size={20} color="#6B7280" />
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalOverlay} />
        <View style={[styles.modalSheet, { backgroundColor: colors.surface, borderColor: colors.border }] }>
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Selecionar data</Text>
          <View style={{ marginTop: 8 }}>
            <Calendar selectedDate={temp} onDateSelect={setTemp} showHeader />
          </View>
          <View style={styles.modalActions}>
            <TouchableOpacity style={[styles.modalButton, { borderColor: colors.border }]} onPress={() => setOpen(false)}>
              <Text style={[styles.modalButtonText, { color: colors.textSecondary }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButtonPrimary, { backgroundColor: colors.link }]} onPress={() => { onValueChange(temp); setOpen(false) }}>
              <Text style={[styles.modalButtonTextPrimary, { color: '#ffffff' }]}>Selecionar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

export function TextArea({ label, error, required, variant, ...props }: InputProps) {
  const { mode } = useTheme()
  const isDark = (variant ?? mode) === 'dark'
  return (
    <View style={styles.inputContainer}>
      <Text style={[styles.label, isDark && styles.labelDark]}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        style={[styles.textArea, isDark && styles.textAreaDark, error && styles.inputError]}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        placeholderTextColor={isDark ? '#9ca3af' : '#9CA3AF'}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  labelDark: {
    color: '#f9fafb',
  },
  required: {
    color: "#EF4444",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#FFFFFF",
  },
  inputDark: {
    borderColor: '#374151',
    backgroundColor: '#2a2f36',
    color: '#f9fafb',
  },
  inputError: {
    borderColor: "#EF4444",
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 4,
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#FFFFFF",
    minHeight: 100,
  },
  textAreaDark: {
    borderColor: '#374151',
    backgroundColor: '#2a2f36',
    color: '#f9fafb',
  },
  selectContainer: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  selectContainerWrap: {
    flexWrap: 'wrap',
    flexDirection: 'row',
  },
  selectContainerDark: {
    borderColor: '#374151',
    backgroundColor: '#2a2f36',
  },
  selectOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  selectOptionWrap: {
    flexBasis: '50%',
    maxWidth: '50%',
    flexGrow: 0,
    flexShrink: 0,
  },
  selectOptionActive: {
    backgroundColor: "#10B981",
  },
  selectOptionText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  selectOptionTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  dateInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },
  dateInputDark: {
    borderColor: '#374151',
    backgroundColor: '#2a2f36',
  },
  dateText: {
    fontSize: 16,
    color: "#111827",
  },
  dateTextDark: {
    fontSize: 16,
    color: '#f9fafb',
  },
  datePlaceholder: {
    fontSize: 16,
    color: "#9CA3AF",
  },
  modalOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)'
  },
  modalSheet: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: '20%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    columnGap: 8,
    marginTop: 12,
  },
  modalButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalButtonPrimary: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalButtonTextPrimary: {
    fontSize: 14,
    fontWeight: '600',
  },
})