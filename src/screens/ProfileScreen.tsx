import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/RootNavigator';
import Screen from '../components/Screen';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

// TODO: users/{uid} stats — wins, gamesPlayed, avatarUrl.
export default function ProfileScreen(_props: Props) {
  return <Screen title="Профиль" />;
}
