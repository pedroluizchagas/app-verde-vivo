import React, { useState } from 'react'
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button } from '../components/Button'
import { supabase } from '../supabase'

export function ChangePasswordScreen({ navigation }: any) {
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const insets = useSafeAreaInsets()

  const handleChange = async () => {
    if (!password || !repeatPassword) {
      Alert.alert('Erro', 'Preencha todos os campos')
      return
    }
    if (password !== repeatPassword) {
      Alert.alert('Erro', 'As senhas não coincidem')
      return
    }
    if (password.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres')
      return
    }
    try {
      setLoading(true)
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      Alert.alert('Sucesso', 'Senha alterada com sucesso', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ])
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Não foi possível alterar a senha')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>      
      <View style={styles.content}> 
        <View style={styles.brandRow}>
          <Ionicons name="lock-closed-outline" size={28} color="#8b5cf6" />
          <Text style={styles.brand}>Alterar Senha</Text>
        </View>
        <Text style={styles.welcome}>Defina sua nova senha</Text>

        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <Ionicons name="key-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              style={styles.inputDark}
              placeholder="Nova senha"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="key-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              style={styles.inputDark}
              placeholder="Confirmar nova senha"
              placeholderTextColor="#9ca3af"
              value={repeatPassword}
              onChangeText={setRepeatPassword}
              secureTextEntry
            />
          </View>

          <Button 
            onPress={handleChange} 
            loading={loading}
            size="large"
            style={{ backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' }}
          >
            Salvar nova senha
          </Button>

          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.footerLink}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: '#0b0f13',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
  },
  brand: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f9fafb',
    marginLeft: 8,
  },
  welcome: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
    color: '#9ca3af',
  },
  form: {
    marginTop: 28,
    gap: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2f36',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  inputDark: {
    flex: 1,
    fontSize: 16,
    color: '#f9fafb',
  },
  footerLink: {
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '600',
  },
})