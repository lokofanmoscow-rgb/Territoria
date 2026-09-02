import { Button } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/RootNavigator';
import Screen from '../components/Screen';

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

// TODO: Firebase Auth email/password sign-in and registration form.
export default function AuthScreen({ navigation }: Props) {
  return (
    <Screen title="Вход / регистрация">
      <Button title="Войти" onPress={() => navigation.replace('Lobby')} />
    </Screen>
  );
}
