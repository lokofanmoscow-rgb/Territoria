import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from '../screens/SplashScreen';
import AuthScreen from '../screens/AuthScreen';
import LobbyScreen from '../screens/LobbyScreen';
import RoomWaitingScreen from '../screens/RoomWaitingScreen';
import GameScreen from '../screens/GameScreen';
import GameResultScreen from '../screens/GameResultScreen';
import ProfileScreen from '../screens/ProfileScreen';

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Lobby: undefined;
  RoomWaiting: { roomId: string };
  Game: { roomId: string };
  GameResult: { roomId: string };
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash">
        <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Auth" component={AuthScreen} options={{ title: 'Вход' }} />
        <Stack.Screen name="Lobby" component={LobbyScreen} options={{ title: 'Лобби' }} />
        <Stack.Screen
          name="RoomWaiting"
          component={RoomWaitingScreen}
          options={{ title: 'Комната' }}
        />
        <Stack.Screen name="Game" component={GameScreen} options={{ title: 'Игра', headerShown: false }} />
        <Stack.Screen
          name="GameResult"
          component={GameResultScreen}
          options={{ title: 'Результат' }}
        />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Профиль' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
