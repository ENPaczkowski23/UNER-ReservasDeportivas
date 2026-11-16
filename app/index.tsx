import {View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, Platform, KeyboardAvoidingView, ActivityIndicator} from 'react-native';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { authService } from '@/src/services/authService';

export default function LoginScreen() {

  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async() => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Atención', 'Por favor, complete todos los campos.');
      return;
    }

    setLoading(true);
    try {
      const data = await authService.login(email, password);
      console.log('Login exitoso! Usuario:', data.usuario.nombre);

    router.replace('/(tabs)');
  } catch (error: any) {
      console.error('Error al iniciar sesión:', error);
      Alert.alert('Error de autenticación', error.message || 'Ocurrió un error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccesoRapido = () => {
    router.replace('/(tabs)');
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoIcon}>⚽</Text>
          </View>
          <Text style={styles.title}>Reservas Deportivas</Text>
          <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
        </View>

        <View style={styles.form}>
          {/* <Text style={styles.label}>Iniciar sesión</Text> */}
          <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          {/* <Text style={styles.label}>Contraseña</Text> */}
          <TextInput
            style={styles.input}
            placeholder="contraseña"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity style={[styles.botonPrincipal, loading && {opacity: 0.6}]} 
          onPress={handleLogin}
          disabled={loading}>
            {loading ? (<ActivityIndicator color="#fff" />) : (<Text style={styles.textoBoton}>Ingresar</Text>)}
          </TouchableOpacity>
          <TouchableOpacity style={styles.botonPrincipal} onPress={handleAccesoRapido}>
            <Text>Acceso rapido</Text>
          </TouchableOpacity>

        </View>

      </View>
    </KeyboardAvoidingView>
  );
  
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  header: {
    alignItems: 'center',
    marginBottom: 24,
  },

  logoBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },

  logoIcon: {
    fontSize: 32,
  },

  card: {
    backgroundColor: '#1E293B',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },

  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 4,
  }, 

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
    marginTop: 8,
  },

  form: {
    marginTop: 24,
  },

  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },

  botonPrincipal: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },

  textoBoton: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});