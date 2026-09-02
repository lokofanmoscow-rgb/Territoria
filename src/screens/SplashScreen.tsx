import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

// TODO: replace with real Firebase Auth state check once services/firebase.ts is wired up.
export default function SplashScreen({ navigation }: Props) {
  useEffect(() => {
    const isAuthenticated = false;
    const timer = setTimeout(() => {
      navigation.replace(isAuthenticated ? 'Lobby' : 'Auth');
    }, 500);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#fff" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101820',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
