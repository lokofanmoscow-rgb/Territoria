import type { ProvinceState, PlayerPendingMove } from '../types/game';
import type { RegionStatic } from '../types/map';

// Pure round-resolution function — no UI/Firestore dependency, so it can be
// unit-tested on its own (see territorygamestructure.md §3).
// TODO: implement reinforcement + attack resolution and win-condition checks.

export interface ResolveRoundInput {
  provinces: Record<number, ProvinceState>;
  regions: RegionStatic[];
  pendingMoves: Record<string, PlayerPendingMove>;
}

export interface ResolveRoundResult {
  provinces: Record<number, ProvinceState>;
}

export function resolveRound(_input: ResolveRoundInput): ResolveRoundResult {
  throw new Error('gameLogic.resolveRound: not implemented');
}
