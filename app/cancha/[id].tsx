import { espaciosService } from "@/src/services/espaciosService";
import { reservasService } from "@/src/services/reservasService";
import { Espacio, Turno } from "@/src/tipos";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { Activity, useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, {Marker, UrlTile, } from "react-native-maps";
// import MapView from "react-native-maps";
import { WebView } from "react-native-webview";
import { hapticFeedback } from "@/src/utils/haptics";
import { notificationService } from "@/src/services/notificationService";
import VideoCancha from '@/src/components/VideoCancha';

export default function CanchaDetalleScreen() {
    const router = useRouter();

    const { id } = useLocalSearchParams<{ id: string }>();

    const [espacio, setEspacio] = useState<Espacio | null>(null);
    const [turnos, setTurnos] = useState<Turno[]>([]);
    const [cargando, setCargando] = useState<boolean>(true);
    const [cargandoTurnos, setCargandoTurnos] = useState<boolean>(false);
    const [guardandoReserva, setGuardandoReserva] = useState<boolean>(false);
    const [scrollHabilitado, setScrollHabilitado] = useState<boolean>(true);

    const proximosDias = useMemo(() => {
        const dias = [];
        const hoy = new Date();
        for (let i = 0; i < 7; i++) {
            const fecha = new Date(hoy);
            fecha.setDate(hoy.getDate() + i);
            const iso = fecha.toISOString().split('T')[0];
            const etiqueta = i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : fecha.toLocaleDateString('es-AR', {
                weekday: 'short', day: 'numeric' });
            dias.push({ fecha: iso, etiqueta });
        }
        return dias;
    }, []);

    const [diaSeleccionado, setDiaSeleccionado] = useState<string>(proximosDias[0]?.fecha || '');
    const [turnoSeleccionado, setTurnoSeleccionado] = useState<Turno | null>(null);

    useEffect(() => {
        if (!id) return;
        async function cargarDetalle() {    
            try {
                setCargando(true);
                const data = await espaciosService.getEspacioPorId(id);
                setEspacio(data);
            } catch (error: any) {
                Alert.alert('Error', error.message || 'No se pudo cargar la información del espacio');
            } finally {
                setCargando(false);
            }
        }
        cargarDetalle();
    }, [id]);

    const cargarTurnos = useCallback(async () => {
        if (!id || !diaSeleccionado) return;
        try {
            setCargandoTurnos(true);
            setTurnoSeleccionado(null);
            const data = await reservasService.getTurnos(id, diaSeleccionado);
            setTurnos(data);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'No se pudieron cargar los turnos disponibles');
        } finally {
            setCargandoTurnos(false);
        }
    }, [id, diaSeleccionado]);

    useEffect(() => {
        cargarTurnos();
    }, [cargarTurnos]);

    const handleConfirmarReserva = async () => {
        if (!turnoSeleccionado) {
            Alert.alert('Atención', 'Por favor, seleccione un horario disponible.');
            return;
        }

        Alert.alert('Confirmar Reserva',
            `¿Desea reservar el turno de ${turnoSeleccionado.inicio} a ${turnoSeleccionado.fin} hs para el ${diaSeleccionado}?`,
            [
                {
                    text: 'Cancelar',
                    style: 'cancel'
                },
                {
                    text: 'Confirmar',
                    onPress: async () => ejecutarReserva(),
                }
            ]
        );
    };

    const ejecutarReserva = async () => {
        if (!turnoSeleccionado) return;
        try {
            setGuardandoReserva(true);
            await reservasService.crearReserva(turnoSeleccionado.id);

            hapticFeedback.exito();

            await notificationService.programarRecordatorioTurno(
                espacio?.nombre || 'Cancha',
                diaSeleccionado,
                turnoSeleccionado.inicio
            );

            Alert.alert('¡Reserva Confirmada!',
                `Turno reservado para el ${diaSeleccionado} de ${turnoSeleccionado.inicio} a ${turnoSeleccionado.fin} hs.`,
            [{
                text: 'Ir a Mis Turnos',
                onPress: () => router.push('/(tabs)/turnos'),
            }]
            );
        }   catch (error: any) {
            hapticFeedback.error();
            Alert.alert('Error', error.message || 'No se pudo confirmar la reserva');
        } finally {
            setGuardandoReserva(false);
        }
    };

    const handleAbrirEnGoogleMaps = () => {
        if (!espacio?.coordenadas) return;
        const { latitud, longitud } = espacio.coordenadas;
        const url = `https://www.google.com/maps/search/?api=1&query=${latitud},${longitud}`;
        Linking.openURL(url);
    };

    if (cargando || !espacio) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#10B981" />
                <Text style={styles.infoText}>Cargando espacio...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content} scrollEnabled={scrollHabilitado}>
            <Stack.Screen options={{ 
                title: espacio.nombre,
                headerStyle: { backgroundColor: '#1E293B' },
                headerTintColor: '#F8FAFC',
             }} />

            <View style={styles.cardHeader}>
                <Text style={styles.headerTitle}>{espacio.nombre}</Text>
                <Text style={styles.headerSubTitle}>{espacio.complejo} • {espacio.superficie}</Text>
                <Text style={styles.precio}>${espacio.precioPorHora.toLocaleString()} / hora</Text>
                {espacio.reglas ? <Text style={styles.reglas}>Reglas: {espacio.reglas}</Text> : null}
            </View>

            <VideoCancha videoUrl={espacio.videoUrl} nombreCancha={espacio.nombre}/>

             <View style={styles.seccion}>
                <Text style={styles.seccionTitulo}>Elegí el día</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.diasContainer}>
                    {proximosDias.map((d) => {
                        const activo = d.fecha === diaSeleccionado;
                        return (
                        <TouchableOpacity key={d.fecha} 
                        style={[styles.diaBoton, activo && styles.diaBotonActivo]} 
                        onPress={() => { hapticFeedback.seleccion(); setDiaSeleccionado(d.fecha)}}>
                            <Text style={[styles.diaTexto, activo && styles.diaTextoActivo]}>{d.etiqueta}</Text>
                        </TouchableOpacity>
                    );
                    })}
                </ScrollView>
            </View>

            <View style={styles.seccion}>
                <Text style={styles.seccionTitulo}>Horarios Disponibles</Text>
                {cargandoTurnos ? (
                    <ActivityIndicator color="#10B981" style={{ marginVertical: 20 }} />
                ) : turnos.length === 0 ? (
                    <Text style={styles.infoText}>No hay turnos registrados para este día.</Text>
                ) : (
                <View style={styles.turnosGrid}>
                    {turnos.map((t) => {
                        const esLibre = t.estado === 'libre';
                        const esSeleccionado = turnoSeleccionado?.id === t.id;

                        return (
                            <TouchableOpacity 
                                key={t.id} 
                                disabled={!esLibre} 
                                onPress={() => { hapticFeedback.seleccion(); setTurnoSeleccionado(t)}} 
                                style={[styles.turnoItem,
                                    esLibre && styles.turnoLibre,
                                    t.estado === 'reservado' && styles.turnoReservado,
                                    t.estado === 'fijo' && styles.turnoFijo,
                                    t.estado === 'mantenimiento' && styles.turnoMantenimiento,
                                    esSeleccionado && styles.turnoSeleccionado
                                ]}
                                >

                                <Text style={[
                                    styles.turnoHora,
                                    esSeleccionado && styles.turnoHoraSeleccionada
                                ]}>
                                    {t.inicio}
                                </Text>
                                <Text style={styles.turnoEstado}>
                                    {t.estado === 'libre'
                                     ? 'Libre'
                                     : t.estado === 'mantenimiento'
                                     ? t.motivoBloqueo || 'Mantenimiento'
                                     : t.estado === 'fijo'
                                     ? 'Fijo'
                                     : 'Ocupado'}
                                </Text>
                                
                            </TouchableOpacity>
                        );
                    })}                
                </View>
                )}
            </View>

            <TouchableOpacity
                style={[
                styles.botonConfirmar,
                (!turnoSeleccionado || guardandoReserva) && { opacity: 0.5 },
                ]}
                disabled={!turnoSeleccionado || guardandoReserva}
                onPress={handleConfirmarReserva}
            >
                {guardandoReserva ? (
                <ActivityIndicator color="#fff" />
                ) : (
                <Text style={styles.botonConfirmarTexto}>
                    {turnoSeleccionado
                    ? `Reservar ${turnoSeleccionado.inicio} a ${turnoSeleccionado.fin} hs`
                    : 'Seleccioná un turno libre'}
                </Text>
                )}
        </TouchableOpacity>



            <View style={styles.seccion}>
                <View style={styles.mapHeader}>
                    <Text style={styles.seccionTitulo}>Ubicación</Text>
                    <TouchableOpacity onPress={handleAbrirEnGoogleMaps}>
                        <Text style={styles.linkMap}>Abrir en Google Maps ↗</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.mapContainer}
                    onTouchStart={() => setScrollHabilitado(false)}
                    onTouchEnd={() => setScrollHabilitado(true)}
                    onTouchCancel={() => setScrollHabilitado(true)}
                >
                    <WebView
                        style={styles.map}
                        originWhitelist={['*']}
                        scrollEnabled={false}
                        source={{
                        html: `
                            <!DOCTYPE html>
                            <html>
                            <head>
                            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                            <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                            <style>
                                body, html, #map { margin: 0; padding: 0; height: 100%; width: 100%; background: #0F172A; }
                            </style>
                            </head>
                            <body>
                            <div id="map"></div>
                            <script>
                                var lat = ${espacio.coordenadas.latitud};
                                var lng = ${espacio.coordenadas.longitud};
                                var map = L.map('map', { zoomControl: true }).setView([lat, lng], 15);
                                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                                attribution: '© OpenStreetMap'
                                }).addTo(map);
                                L.marker([lat, lng])
                                .addTo(map)
                                .bindPopup("<b>${espacio.nombre}</b><br>${espacio.complejo}")
                                .openPopup();
                            </script>
                            </body>
                            </html>
                        `,
                        }}
                    />
                        
                </View>
                
            </View>
        </ScrollView>

    )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    color: '#94A3B8',
    fontSize: 14,
    marginVertical: 10,
    textAlign: 'center',
  },
  cardHeader: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  headerSubTitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  precio: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
    marginTop: 8,
  },
  reglas: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 6,
  },
  seccion: {
    marginBottom: 20,
  },
  seccionTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 10,
  },
  diasContainer: {
    flexDirection: 'row',
  },
  diaBoton: {
    backgroundColor: '#1E293B',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  diaBotonActivo: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  diaTexto: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  diaTextoActivo: {
    color: '#FFFFFF',
  },
  turnosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  turnoItem: {
    width: '31%',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  turnoLibre: {
    backgroundColor: '#1E293B',
    borderColor: '#10B981',
  },
  turnoReservado: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    opacity: 0.4,
  },
  turnoFijo: {
    backgroundColor: '#1E293B',
    borderColor: '#F59E0B',
    opacity: 0.6,
  },
  turnoMantenimiento: {
    backgroundColor: '#450A0A',
    borderColor: '#EF4444',
  },
  turnoSeleccionado: {
    backgroundColor: '#10B981',
    borderColor: '#FFFFFF',
  },
  turnoHora: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: 'bold',
  },
  turnoHoraSeleccionada: {
    color: '#FFFFFF',
  },
  turnoEstado: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
    textAlign: 'center',
  },
  botonConfirmar: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 10,
  },
  botonConfirmarTexto: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  linkMap: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '600',
  },
  mapContainer: {
    height: 320,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});