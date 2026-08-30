import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

export default function TabLayout() {
  const colors = useColors();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarLabelStyle: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 0.4 },
        tabBarStyle: {
          height: Platform.OS === 'web' ? 84 : 72,
          paddingTop: 7,
          paddingBottom: Platform.OS === 'web' ? 28 : 10,
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        tabBarBackground: () => Platform.OS === 'ios' ? <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Manifest', tabBarIcon: ({ color }) => <Feather name="clipboard" size={21} color={color} /> }} />
      <Tabs.Screen name="scan" options={{ title: 'Scan', tabBarIcon: ({ color }) => <Feather name="maximize" size={22} color={color} /> }} />
      <Tabs.Screen name="monitor" options={{ title: 'Monitor', tabBarIcon: ({ color }) => <Feather name="thermometer" size={21} color={color} /> }} />
      <Tabs.Screen name="handoff" options={{ title: 'Handoff', tabBarIcon: ({ color }) => <Feather name="check-circle" size={21} color={color} /> }} />
    </Tabs>
  );
}