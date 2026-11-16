import { reservasService } from '@/src/services/reservasService';
import { Reserva } from '@/src/tipos';
import { hapticFeedback } from '@/src/utils/haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, ActivityIndicator, RefreshControl} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Network from 'expo-network';
import { localDB } from '@/src/database/db';

export default function MisTurnosScreen() {
  const [tabActual, setTabActual] = useState<'proximas' | 'pasadas'>('proximas');
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [refrescando, setRefrescando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [qrVisibleId, setQrVisibleId] = useState<string | null>(null);
  const [estaOnline, setEstaOnline] = useState<boolean>(true);

  const cargarReservas = useCallback(async () => {
    try {
      setError(null);

      const red = await Network.getNetworkStateAsync();
      const hayInternet = !!(red.isConnected && red.isInternetReachable !== false);
      setEstaOnline(hayInternet);

      if (hayInternet) {
        const data = await reservasService.getMisReservas(tabActual);
        setReservas(data);

        await localDB.guardarReservas(data, tabActual);
      } else {
        const dataLocal = await localDB.obtenerReservas(tabActual);
        setReservas(dataLocal);
      }
    } catch ( err: any ) {
      console.warn('Fallo en la red, consultando base local SQLite...');
      setEstaOnline(false);
      const dataLocal = await localDB.obtenerReservas(tabActual);

      if (dataLocal.length > 0) {
        setReservas(dataLocal);
      } else {
        setError(err.message || 'No se pudieron cargar tus reservas.');        
      }

    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [tabActual]);

  useEffect(() => {
    setCargando(true);
    cargarReservas();
  }, [cargarReservas]);

  const onRefresh = () => {
    setRefrescando(true);
    cargarReservas();
  };
  
  const handleCancelarTurno = (reserva: Reserva) => {
    Alert.alert(
      'Cancelar Reserva',
      `¿Estás seguro de que deseas cancelar la reserva #${reserva.id}?\n\nRecordá que solo se puede cancelar hasta 4 horas antes del turno.`,
      [
        { text: 'No, conservar', style: 'cancel'},
        { text: 'Sí, cancelar', style: 'destructive',
          onPress: async () => {
            try {
              await reservasService.cancelarReserva(reserva.id);
              hapticFeedback.impactoMedio();
              Alert.alert('Reserva cancelada', `La reserva #${reserva.id} ha sido cancelada exitosamente.`);
              cargarReservas();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'No se pudo cancelar la reserva.');
            }
          }
        }
      ]
    )
  }

  const formatearFechaHora = (iso: string) => {
    try {
      const fecha = new Date(iso);
      return fecha.toLocaleString('es-AR', {
        dateStyle: 'short',
        timeStyle: 'short',
      });
    } catch {
      return iso;
    }
  };

  return (
    <View style={styles.container}>

        {!estaOnline && (
          <View style={styles.bannerOffline}>
            <Text style={styles.bannerOfflineTexto}>
              📡 Sin conexión — Mostrando reservas guardadas en el teléfono
            </Text>
           </View>
        )}
        
      <View style={styles.tabContainer}>

        <TouchableOpacity
          style={[styles.tabBoton, tabActual === 'proximas' && styles.tabBotonActivo]}
          onPress={() => {hapticFeedback.seleccion(); setTabActual('proximas')}}
        >
          <Text style={[styles.tabTexto, tabActual === 'proximas' && styles.tabTextoActivo]}>Próximas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBoton, tabActual === 'pasadas' && styles.tabBotonActivo]}
          onPress={() => {hapticFeedback.seleccion(); setTabActual('pasadas')}}
        >
          <Text style={[styles.tabTexto, tabActual === 'pasadas' && styles.tabTextoActivo]}>Pasadas</Text>
        </TouchableOpacity>
      </View>

      {cargando ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.infoText}>Cargando tus reservas...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.botonReintentar} onPress={cargarReservas}>
            <Text style={styles.textoBoton}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={reservas}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refrescando} onRefresh={onRefresh} tintColor="#10B981" />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.infoText}>
              {tabActual === 'proximas' 
                ? 'No tenés reservas activas por el momento.' 
                : 'No hay reservas anteriores registradas.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.canchaNombre}>Espacio: {item.espacioId}</Text>
                  <Text style={styles.fechaTexto}>Turno: {item.turnoId}</Text>
                </View>
                
                <View style={[styles.badgeEstado,
                  item.estado === 'confirmada' && styles.badgeConfirmada,
                  item.estado === 'cancelada' && styles.badgeCancelada,
                  item.estado === 'cumplida' && styles.badgeCumplida,
                  item.estado === 'ausente' && styles.badgeAusente,
                ]}>
                  <Text style={styles.badgeEstadoTexto}>{item.estado.toUpperCase()}</Text>
                </View>
              </View>

              

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Jugadores:</Text>
                <Text style={styles.infoValor}>{item.cantidadPersonas} personas</Text>
              </View>
              <View style={styles.qrSection}>
                <TouchableOpacity style={styles.botonVerQr} onPress={() => setQrVisibleId(qrVisibleId === item.id ? null : item.id)}>
                  <Text style={styles.botonVerQrTexto}>
                    {qrVisibleId === item.id ? 'Ocultar Código QR ▲' : 'Ver Código QR de Ingreso ▼'}
                  </Text>
                </TouchableOpacity>

                {qrVisibleId === item.id && (
                  <View style={styles.qrContainer}>
                    <View style={styles.qrWhiteBox}>
                      <QRCode value={item.codigoQr} size={160} color='#0F172A' backgroundColor='#FFFFFF'/>
                    </View>
                    <Text style={styles.qrTexto}>{item.codigoQr}</Text>
                    <Text style={styles.qrAyuda}>Mostrale este código al encargado en la puerta</Text>
                  </View>
                )}
              </View>

              {item.cancelableHasta && (
                <Text style={styles.avisoCancelacion}>
                  Cancelable sin cargo hasta: {formatearFechaHora(item.cancelableHasta)}
                </Text>
              )}

              {tabActual === 'proximas' && item.estado === 'confirmada' && (
                <TouchableOpacity
                  style={styles.botonCancelar}
                  onPress={() => handleCancelarTurno(item)}
                >
                  <Text style={styles.botonCancelarTexto}>Cancelar Reserva</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#1E293B',
    gap: 8,
  },
  tabBoton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#0F172A',
  },
  tabBotonActivo: {
    backgroundColor: '#10B981',
  },
  tabTexto: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 14,
  },
  tabTextoActivo: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  infoText: {
    color: '#94A3B8',
    fontSize: 15,
    textAlign: 'center',
  },
  errorIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
  },
  botonReintentar: {
    backgroundColor: '#10B981',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  textoBoton: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  canchaNombre: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fechaTexto: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  badgeEstado: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#334155',
  },
  badgeConfirmada: {
    backgroundColor: '#065F46',
  },
  badgeCancelada: {
    backgroundColor: '#7F1D1D',
  },
  badgeCumplida: {
    backgroundColor: '#1E3A8A',
  },
  badgeAusente: {
    backgroundColor: '#78350F',
  },
  badgeEstadoTexto: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoLabel: {
    color: '#94A3B8',
    fontSize: 13,
  },
  infoValor: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '500',
  },
  qrCodeText: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  avisoCancelacion: {
    color: '#F59E0B',
    fontSize: 11,
    marginTop: 8,
  },
  botonCancelar: {
    marginTop: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EF4444',
    alignItems: 'center',
  },
  botonCancelarTexto: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
  qrSection: {
  marginTop: 10,
  alignItems: 'center',
},
botonVerQr: {
  backgroundColor: '#334155',
  paddingVertical: 8,
  paddingHorizontal: 14,
  borderRadius: 8,
  alignSelf: 'stretch',
  alignItems: 'center',
},
botonVerQrTexto: {
  color: '#38BDF8',
  fontWeight: 'bold',
  fontSize: 13,
},
qrContainer: {
  marginTop: 14,
  alignItems: 'center',
  padding: 12,
  backgroundColor: '#0F172A',
  borderRadius: 12,
  alignSelf: 'stretch',
},
qrWhiteBox: {
  padding: 12,
  backgroundColor: '#FFFFFF',
  borderRadius: 10,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
  elevation: 3,
},
qrTexto: {
  color: '#F8FAFC',
  fontSize: 15,
  fontWeight: 'bold',
  fontFamily: 'monospace',
  marginTop: 10,
},
qrAyuda: {
  color: '#94A3B8',
  fontSize: 12,
  marginTop: 4,
  textAlign: 'center',
},
bannerOffline: {
  backgroundColor: '#B45309',
  paddingVertical: 8,
  paddingHorizontal: 16,
  alignItems: 'center',
},
bannerOfflineTexto: {
  color: '#FEF3C7',
  fontSize: 12,
  fontWeight: 'bold',
  textAlign: 'center',
},
});
