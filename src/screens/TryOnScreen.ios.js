/**
 * Try on uses ML Kit + Android camera pipeline; iOS placeholder.
 * @format
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';

export default function TryOnScreen({ navigation }) {
  const theme = useTheme();
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Try on</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.msg, { color: theme.text }]}>
          Virtual try-on with automatic pose detection is available on Android. On iOS this feature is coming soon.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 8, width: 40 },
  title: { flex: 1, fontSize: 18, fontWeight: '600', textAlign: 'center' },
  body: { flex: 1, padding: 24, justifyContent: 'center' },
  msg: { fontSize: 16, lineHeight: 24, textAlign: 'center' },
});
