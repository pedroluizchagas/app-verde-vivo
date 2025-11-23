import React from 'react'
import { View, Text, StyleSheet, ViewStyle } from 'react-native'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  color?: 'green' | 'red' | 'blue' | 'gray'
  style?: ViewStyle
}

export function StatCard({ title, value, subtitle, trend, color = 'green', style }: StatCardProps) {
  const colorStyles = {
    green: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
    red: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
    blue: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
    gray: { backgroundColor: '#f9fafb', borderColor: '#e5e7eb' },
  }

  const textColors = {
    green: '#16a34a',
    red: '#dc2626',
    blue: '#2563eb',
    gray: '#6b7280',
  }

  return (
    <View style={[styles.container, colorStyles[color], style]}>
      <Text style={[styles.title, { color: textColors[color] }]}>{title}</Text>
      <Text style={[styles.value, { color: textColors[color] }]}>{value}</Text>
      {subtitle && <Text style={[styles.subtitle, { color: textColors[color] }]}>{subtitle}</Text>}
      {trend && (
        <Text style={[styles.trend, { color: trend === 'up' ? '#16a34a' : trend === 'down' ? '#dc2626' : '#6b7280' }]}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    minWidth: 120,
  },
  title: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '400',
  },
  trend: {
    fontSize: 16,
    fontWeight: '700',
    position: 'absolute',
    top: 12,
    right: 12,
  },
})