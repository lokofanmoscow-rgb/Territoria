// Firestore document shapes — see rooms/{roomId} in territorygamestructure.md

import type { UnitType } from '../constants/unitTypes';

export type RoomStatus = 'waiting' | 'in_progress' | 'finished';

export interface PlayerInfo {
  uid: string;
  name: string;
  color: string;
  isReady: boolean;
  /** золото — заполняется при старте партии (см. gameLogic startingGold), в лобби не используется */
  gold?: number;
}

/** Состав армии в провинции или в одном перемещении/атаке — количество по типу юнита. */
export type ArmyComposition = Partial<Record<UnitType, number>>;

export interface ProvinceState {
  ownerId: string | null;
  units: ArmyComposition;
}

export interface AttackMove {
  from: number;
  to: number;
  units: ArmyComposition;
}

export interface PlayerPendingMove {
  /** provinceId -> сколько каких юнитов нанять в этой (своей) провинции в этом раунде */
  reinforcements: Record<number, ArmyComposition>;
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
