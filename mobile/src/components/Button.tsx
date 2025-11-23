import React from 'react'
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps, ActivityIndicator, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

interface ButtonProps extends TouchableOpacityProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'small' | 'medium' | 'large'
  loading?: boolean
  disabled?: boolean
  gradient?: boolean
  fullWidth?: boolean
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  loading = false,
  disabled = false,
  gradient = false,
  fullWidth = false,
  style,
  ...props 
}: ButtonProps) {
  const buttonStyle = [
    styles.base,
    gradient ? null : styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
    style,
  ]

  return (
    <TouchableOpacity 
      style={buttonStyle} 
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {gradient && (
        <LinearGradient
          colors={["#0F8A41", "#22C55E", "#00FF4E"]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.gradientOverlay}
        />
      )}
      {loading ? (
        <ActivityIndicator size="small" color="#ffffff" />
      ) : (
        <Text style={[styles.text, styles[`${variant}Text`], styles[`${size}Text`]]}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  fullWidth: {
    alignSelf: 'stretch',
    width: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  primary: {
    backgroundColor: '#16a34a',
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  secondary: {
    backgroundColor: '#6b7280',
    borderWidth: 1,
    borderColor: '#6b7280',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  small: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 32,
  },
  medium: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
  },
  large: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    minHeight: 52,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryText: {
    color: '#ffffff',
  },
  secondaryText: {
    color: '#ffffff',
  },
  outlineText: {
    color: '#374151',
  },
  ghostText: {
    color: '#374151',
  },
  smallText: {
    fontSize: 12,
  },
  mediumText: {
    fontSize: 14,
  },
  largeText: {
    fontSize: 16,
  },
}) as any