import { Button, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/RootNavigator';
import Screen from '../components/Screen';

type Props = NativeStackScreenProps<RootStackParamList, 'RoomWaiting'>;

// TODO: realtime player list (roomsApi.subscribeRoom), ready toggle, host-only "start" button.
export default function RoomWaitingScreen({ route, navigation }: Props) {
  const { roomId } = route.params;

  return (
    <Screen title="Ожидание игроков">
      <Text style={{ color: '#fff' }}>Комната: {roomId}</Text>
      <Button title="Старт (хост)" onPress={() => navigation.navigate('Game', { roomId })} />
    </Screen>
  );
}
