import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

interface VideoCanchaProps {
    videoUrl: string | null;
    nombreCancha: string;
}

const VIDEO_DEMO_URL = 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

export default function VideoCancha({ videoUrl, nombreCancha }: VideoCanchaProps) {
    const fuenteVideo = videoUrl || VIDEO_DEMO_URL;

    const player = useVideoPlayer(fuenteVideo, (p) => {
        p.loop = true;
        p.muted = false;
    });

    return (
        <View style={styles.container}>
            <Text style={styles.titulo}>📹 Recorrido del estado del campo</Text>
            <Text style={styles.subtitulo}>
                {videoUrl ?  `Video oficial de ${nombreCancha}`
                  : 'Video demostrativo del estado del piso (API videoUrl: null)'}
            </Text>

            <View style={styles.videoWrapper}>
                <VideoView style={styles.video} player={player} nativeControls={true} contentFit='cover'/>
            </View>
        </View>
    )
}
const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  titulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  subtitulo: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 10,
  },
  videoWrapper: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
});