import React from 'react'
import { View, ViewStyle, StyleSheet, StyleProp } from 'react-native'
import { useTheme } from '../contexts/ThemeContext'

interface CardProps {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
  padding?: number
}

export function Card({ children, style, padding = 16 }: CardProps) {
  const { colors } = useTheme()
  const styles = getStyles(colors)
  return (
    <View style={[styles.card, { padding }, style]}>
      {children}
    </View>
  )
}

interface CardHeaderProps {
  children: React.ReactNode
}

export function CardHeader({ children }: CardHeaderProps) {
  const { colors } = useTheme()
  const styles = getStyles(colors)
  return <View style={styles.header}>{children}</View>
}

interface CardTitleProps {
  children: string
  size?: 'small' | 'medium' | 'large'
  color?: string
}

export function CardTitle({ children, size = 'medium', color }: CardTitleProps) {
  const { colors } = useTheme()
  const styles = getStyles(colors)
  const fontSize = size === 'small' ? 16 : size === 'large' ? 24 : 18
  return <Text style={[styles.title, { fontSize, color: color ?? colors.textPrimary }]}>{children}</Text>
}

interface CardContentProps {
  children: React.ReactNode
}

export function CardContent({ children }: CardContentProps) {
  const { colors } = useTheme()
  const styles = getStyles(colors)
  return <View style={styles.content}>{children}</View>
}

function getStyles(colors: { surface: string; border: string; textPrimary: string }) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
      marginVertical: 8,
    },
    header: {
      marginBottom: 12,
    },
    title: {
      fontWeight: '700',
      color: colors.textPrimary,
    },
    content: {
      gap: 12,
    },
  })
}

// Import Text from react-native
import { Text } from 'react-native'