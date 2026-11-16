import { espaciosService } from '@/src/services/espaciosService';
import { Espacio } from '@/src/tipos';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, TouchableOpacity, Text, View, ActivityIndicator, RefreshControl, Image } from 'react-native';

export default function CanchasScreen() {
  const router = useRouter();

  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const cargarEspacios = useCallback(async () => {
    try {
      setError(null);
      const data = await espaciosService.getEspacios();
      setEspacios(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los espacios');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    cargarEspacios();
  }, [cargarEspacios]);

  const onRefresh = () => {
    setRefreshing(true);
    cargarEspacios();
  }

  const handleCanchaPress = (espacio: Espacio) => {
    
    router.push( {
      pathname: `/cancha/[id]`,
      params: { 
        id: espacio.id,
        nombre: espacio.nombre,
       },
    });
    };

    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.infoText}>Cargando espacios deportivos...</Text>
        </View>
      );
    }
  
    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={cargarEspacios}>
            <Text style={styles.textBoton}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }


  return (
    <View style={styles.container}>
      {/* <Text style={styles.title}>Canchas Disponibles</Text> */}
      <FlatList
        data={espacios}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981"/>
        }
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Text style={styles.infoText}>No hay espacios deportivos disponibles en este momento.</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => handleCanchaPress(item)} activeOpacity={0.8}>
            {item.imagenes && item.imagenes.length > 0 && (
              <Image source={{ uri: item.imagenes[0] }} style={styles.cardImagen} />
            )}
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{item.nombre}</Text>
              <Text style={styles.cardSubTitle}>{item.complejo}</Text>

              <View style={styles.tagContainer}>
                <Text style={styles.tag}>🌱 {item.superficie}</Text>
                {item.iluminacion && <Text style={styles.tag}>💡 Con luz</Text>}
                {item.techado && <Text style={styles.tag}>🏠 Techado</Text>}
              </View>

              <Text style={styles.precio}>{item.precioPorHora.toLocaleString()} / hora</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  listContent: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  infoText: {
    color: '#94A3B8',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#10B981',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  textBoton: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
  },
  cardImagen: {
    width: '100%',
    height: 150,
    backgroundColor: '#334155',
  },
  cardBody: {
    padding: 14,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardSubTitle: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 2,
  },
   tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 10,
  },
  tag: {
    backgroundColor: '#334155',
    color: '#CBD5E1',
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  precio: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
    marginTop: 4,
  },
});
