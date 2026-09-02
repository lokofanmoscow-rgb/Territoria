import { Button } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/RootNavigator';
import Screen from '../components/Screen';

type Props = NativeStackScreenProps<RootStackParamList, 'Lobby'>;

// TODO: list open rooms (roomsApi.subscribeOpenRooms), "create room", "join by code".
export default function LobbyScreen({ navigation }: Props) {
  return (
    <Screen title="Лобби">
      <Button
        title="Создать комнату"
        onPress={() => navigation.navigate('RoomWaiting', { roomId: 'stub-room' })}
      />
      <Button title="Профиль" onPress={() => navigation.navigate('Profile')} />
    </Screen>
  );
}
