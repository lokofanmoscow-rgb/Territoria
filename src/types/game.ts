// Firestore document shapes — see rooms/{roomId} in territorygamestructure.md

export type RoomStatus = 'waiting' | 'in_progress' | 'finished';

export interface PlayerInfo {
  uid: string;
  name: string;
  color: string;
  isReady: boolean;
}

export interface ProvinceState {
  ownerId: string | null;
  troops: number;
}

export interface AttackMove {
  from: number;
  to: number;
  troops: number;
}

export interface PlayerPendingMove {
  reinforcements: Record<number, number>;
  attacks: AttackMove[];
  submitted: boolean;
}

export interface RoomDoc {
  status: RoomStatus;
  hostId: string;
  maxPlayers: number;
  mapName: string;
  players: PlayerInfo[];
  currentRound: number;
  map: {
    provinces: Record<number, ProvinceState>;
  };
  pendingMoves: Record<string, PlayerPendingMove>;
  winnerId: string | null;
}

export interface UserDoc {
  name: string;
  avatarUrl?: string;
  stats: {
    wins: number;
    gamesPlayed: number;
  };
}
