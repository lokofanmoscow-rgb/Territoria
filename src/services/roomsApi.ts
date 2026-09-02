import type { RoomDoc } from '../types/game';

// TODO: implement against Firestore `rooms/{roomId}` (see territorygamestructure.md §2).
// Kept as stub signatures for now so screens can be wired up ahead of the Firebase pass.

export async function createRoom(_hostId: string, _mapName: string): Promise<string> {
  throw new Error('roomsApi.createRoom: not implemented');
}

export async function joinRoom(_roomId: string, _uid: string): Promise<void> {
  throw new Error('roomsApi.joinRoom: not implemented');
}

export function subscribeRoom(
  _roomId: string,
  _onChange: (room: RoomDoc) => void,
): () => void {
  throw new Error('roomsApi.subscribeRoom: not implemented');
}

export async function setReady(_roomId: string, _uid: string, _isReady: boolean): Promise<void> {
  throw new Error('roomsApi.setReady: not implemented');
}

export async function startGame(_roomId: string): Promise<void> {
  throw new Error('roomsApi.startGame: not implemented');
}

export async function submitPendingMove(
  _roomId: string,
  _uid: string,
  _move: RoomDoc['pendingMoves'][string],
): Promise<void> {
  throw new Error('roomsApi.submitPendingMove: not implemented');
}
