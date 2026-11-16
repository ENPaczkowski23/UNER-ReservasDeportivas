import { Platform } from 'react-native';
import { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
import { scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync';
import { getPermissionsAsync, requestPermissionsAsync } from 'expo-notifications/build/NotificationPermissions';
import { setNotificationChannelAsync } from 'expo-notifications/build/setNotificationChannelAsync';

try {
    setNotificationHandler({
        handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
        }),
    });    
} catch (error) {
    console.warn('No se pudo inicializar notification handler:', error);
}

export const notificationService = {

    async solicitarPermisos(): Promise<boolean> {
        try {
            
            const { status: existingStatus } = await getPermissionsAsync();
            let finalStatus = existingStatus;
            
            if (existingStatus !== 'granted') {
                const { status } = await requestPermissionsAsync();
                finalStatus = status;
            }
            
            if (Platform.OS === 'android') {
                try {
                    await setNotificationChannelAsync('recordatorios-turnos', {
                        name: 'Recordatorios de Turnos',
                        importance: 4,
                        vibrationPattern: [0, 250, 250, 250],
                        lightColor: '#10B981',
                    })                    
                } catch {
                    
                }
            }

            return finalStatus === 'granted';
        } catch (error) {
            console.warn('Permisos de notificación omitidos o no disponibles en este dispositivo:', error);
            return false;
        }
    },

    async programarRecordatorioTurno(nombreEspacio: string, fecha: string, horaInicio: string): Promise<string | null> {
        try {
            const tienePermiso = await this.solicitarPermisos();

            if (!tienePermiso) {
                console.log('Notificaciones: Permiso no concedido. Se continúa sin recordatorio.');
                return null;
            }

            const [horas, minutos] = horaInicio.split(':').map(Number);
            const [anio, mes, dia] = fecha.split('-').map(Number);
            const fechaTurno = new Date(anio, mes - 1, dia, horas, minutos);

            // Programamos 2 horas antes
            const fechaDisparo = new Date(fechaTurno.getTime() - 2 * 60 * 60 * 1000);
            const ahora = new Date();

            let segundosHastaDisparo = Math.floor((fechaDisparo.getTime() - ahora.getTime()) / 1000);
            if (segundosHastaDisparo <= 0) {
                segundosHastaDisparo = 5;
            }

            const idNotificacion = await scheduleNotificationAsync({
                content: {
                    title: '⏰ Recordatorio de Turno Deportivo',
                    body: `Tenés turno en ${nombreEspacio} a las ${horaInicio} hs. ¡No te olvides de llevar tu código QR!`,
                    sound: true,
                    data: { fecha, horaInicio, nombreEspacio},
                },
                trigger: {
                    type: 'timeInterval' as any,
                    seconds: segundosHastaDisparo,
                },
            });

            console.log(`✅ Notificación programada con éxito (ID: ${idNotificacion}, en ${segundosHastaDisparo}s)`);
            return idNotificacion;
        } catch (error) {
            console.warn('Error al programar la notificación local:', error);
            return null;
        }
    },
};