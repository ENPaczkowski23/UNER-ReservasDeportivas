import React from 'react';
import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';


export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index" 
        options={{ 
          title: 'Canchas',
          headerTitle: 'Espacios Disponibles',
          tabBarIcon: ({ color }) => (<Text style={{ fontSize: 20 }}>🏟️</Text>),
         }}/>
      <Tabs.Screen
         name="turnos"
         options={{
          title: 'Mis Turnos',
          headerTitle: 'Mis Reservas',
          tabBarIcon: ({ color }) => (<Text style={{ fontSize: 20 }}>📅</Text>),
         }}/>
    </Tabs>
  )

}
