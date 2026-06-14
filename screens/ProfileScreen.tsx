import React from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export default function ProfileScreen({ route }: Props) {
  const { username } = route.params;

  return (
    <WebView
      style={styles.webview}
      source={{ uri: `https://github.com/${username}` }}
    />
  );
}

const styles = StyleSheet.create({
  webview: {
    flex: 1,
  },
});
