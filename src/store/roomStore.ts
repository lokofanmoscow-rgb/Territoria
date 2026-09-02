import { create } from 'zustand';

import type { RoomDoc } from '../types/game';

interface RoomStore {
  roomId: string | null;
  room: RoomDoc | null;
  setRoom: (roomId: string, room: RoomDoc) => void;
  clearRoom: () => void;
}

export const useRoomStore = create<RoomStore>((set) => ({
  roomId: null,
  room: null,
  setRoom: (roomId, room) => set({ roomId, room }),
  clearRoom: () => set({ roomId: null, room: null }),
}));
