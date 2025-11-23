import React, { useState } from 'react'
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button } from '../components/Button'
import { supabase } from '../supabase'

export function SignUpScreen({ navigation }: any) {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const insets = useSafeAreaInsets()

  const handleSignUp = async () => {
    if (!fullName || !phone || !email || !password || !repeatPassword) {
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
      const redirect = (process.env.EXPO_PUBLIC_SUPABASE_REDIRECT_URL || process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || 'https://verdevivo.app/dashboard') as string
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirect,
          data: {
            full_name: fullName,
            phone: phone,
            role: 'gardener',
          },
        },
      })
      if (error) throw error
      Alert.alert('Conta criada', 'Verifique seu email para confirmar a conta.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ])
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>      
      <View style={styles.content}> 
        <View style={styles.brandRow}>
          <Image source={require('../../assets/iris.png')} style={styles.logoWide} />
        </View>
        <Text style={styles.welcome}>Crie sua conta para começar</Text>

        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              style={styles.inputDark}
              placeholder="Nome completo"
              placeholderTextColor="#9ca3af"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="call-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              style={styles.inputDark}
              placeholder="Telefone"
              placeholderTextColor="#9ca3af"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="at" size={18} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              style={styles.inputDark}
              placeholder="Email"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              style={styles.inputDark}
              placeholder="Senha"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              style={styles.inputDark}
              placeholder="Confirmar senha"
              placeholderTextColor="#9ca3af"
              value={repeatPassword}
              onChangeText={setRepeatPassword}
              secureTextEntry
            />
          </View>

          <Button 
            onPress={handleSignUp} 
            loading={loading}
            size="large"
            gradient
            fullWidth
            style={{ marginTop: 8 }}
          >
            Criar conta
          </Button>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Já tem conta?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}> Entrar</Text>
            </TouchableOpacity>
          </View>
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
  logoWide: {
    width: 160,
    aspectRatio: 662/288,
    resizeMode: 'contain',
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
  footerText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#9ca3af',
  },
  footerLink: {
    color: '#22c55e',
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
})