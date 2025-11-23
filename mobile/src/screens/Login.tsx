import React, { useState } from 'react'
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, Image } from 'react-native'
import { Button } from '../components/Button'
import { useAuth } from '../contexts/AuthContext'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '../supabase'

export function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const insets = useSafeAreaInsets()

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Por favor, preencha email e senha')
      return
    }

    try {
      setLoading(true)
      await signIn(email, password)
    } catch (error: any) {
      Alert.alert('Erro de login', error.message)
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
        <Text style={styles.welcome}>Bem-vindo de volta! Faça login na sua conta.</Text>

        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <Ionicons name="at" size={18} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              style={styles.inputDark}
              placeholder="Email ou nome de usuário"
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

        <TouchableOpacity onPress={async () => {
          if (!email) {
            Alert.alert('Informe seu email', 'Digite seu email para recuperar a senha.')
            return
          }
          try {
            const redirect = (process.env.EXPO_PUBLIC_SUPABASE_REDIRECT_URL || process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || 'https://verdevivo.app/auth/reset-complete') as string
            const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirect })
            if (error) throw error
            Alert.alert('Redefinição de senha', 'Verifique seu email para instruções de recuperação.')
          } catch (e: any) {
            Alert.alert('Erro', e?.message || 'Erro ao solicitar redefinição de senha')
          }
        }}>
          <Text style={styles.forgot}>Esqueceu a senha?</Text>
        </TouchableOpacity>

          <Button 
            onPress={handleLogin} 
            loading={loading}
            size="large"
            gradient
            fullWidth
            style={{ marginTop: 8 }}
          >
            Login
          </Button>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Não tem uma conta?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.footerLink}> Cadastre-se</Text>
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
  forgot: {
    alignSelf: 'flex-end',
    color: '#22c55e',
    fontSize: 13,
    fontWeight: '600',
  },
  footerText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#9ca3af',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  footerLink: {
    color: '#22c55e',
    fontWeight: '700',
  },
})