import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextInput, TextStyle, View, ViewStyle } from 'react-native';
import { useColors } from '@/hooks/useColors';

export function Screen({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const colors = useColors();
  return <View style={[styles.screen, { backgroundColor: colors.background }, style]}>{children}</View>;
}

export function Header({
  eyebrow,
  title,
  right,
}: {
  eyebrow: string;
  title: string;
  right?: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={styles.header}>
      <View>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>{eyebrow}</Text>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  return <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{children}</Text>;
}

export function IconButton({
  icon,
  onPress,
  label,
  active = false,
}: {
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
  label: string;
  active?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityLabel={label}
      testID={`button-${label.toLowerCase().replaceAll(' ', '-')}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: active ? colors.primary : colors.secondary },
        pressed && styles.pressed,
      ]}
    >
      <Feather name={icon} size={20} color={active ? colors.primaryForeground : colors.foreground} />
    </Pressable>
  );
}

export function ActionButton({
  title,
  onPress,
  icon,
  kind = 'primary',
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  icon?: keyof typeof Feather.glyphMap;
  kind?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}) {
  const colors = useColors();
  const background = kind === 'primary' ? colors.primary : kind === 'danger' ? colors.destructive : colors.secondary;
  const foreground = kind === 'primary' ? colors.primaryForeground : colors.foreground;
  return (
    <Pressable
      accessibilityRole="button"
      testID={`action-${title.toLowerCase().replaceAll(' ', '-')}`}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        { backgroundColor: background, opacity: disabled ? 0.4 : 1 },
        pressed && styles.pressed,
      ]}
    >
      {icon ? <Feather name={icon} size={18} color={foreground} /> : null}
      <Text style={[styles.actionText, { color: foreground }]}>{title}</Text>
    </Pressable>
  );
}

export function StatusPill({ status }: { status: string }) {
  const colors = useColors();
  const active = status === 'In Transit' || status === 'Delivered';
  return (
    <View style={[styles.statusPill, { backgroundColor: active ? `${colors.accent}20` : `${colors.warning}20` }]}>
      <View style={[styles.statusDot, { backgroundColor: active ? colors.accent : colors.warning }]} />
      <Text style={[styles.statusText, { color: active ? colors.accent : colors.warning }]}>{status.toUpperCase()}</Text>
    </View>
  );
}

export function TextField({
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = 'default',
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric';
}) {
  const colors = useColors();
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.mutedForeground}
      keyboardType={keyboardType}
      multiline={multiline}
      style={[
        styles.textField,
        { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground },
        multiline && styles.multiline,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 18 },
  header: { minHeight: 100, paddingTop: 12, paddingBottom: 16, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.4, marginBottom: 6 },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 30, letterSpacing: -0.6 },
  sectionLabel: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.2, marginBottom: 10 },
  iconButton: { width: 46, height: 46, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  actionButton: { minHeight: 54, borderRadius: 8, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  actionText: { fontFamily: 'Inter_700Bold', fontSize: 14, letterSpacing: 0.3 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  statusPill: { alignSelf: 'flex-start', borderRadius: 5, paddingHorizontal: 9, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 0.8 },
  textField: { minHeight: 54, borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, fontFamily: 'Inter_500Medium', fontSize: 16 },
  multiline: { minHeight: 110, paddingTop: 14, textAlignVertical: 'top' },
});

export const sharedStyles = styles;