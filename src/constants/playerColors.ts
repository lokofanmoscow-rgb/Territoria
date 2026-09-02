// Цвета фракций — насыщенные, чтобы читаться поверх приглушённых цветов
// биомов (см. src/utils/biome.ts). До 4 игроков за партию.
export const PLAYER_COLORS = ['#d64545', '#3d7fd6', '#3fae5c', '#e0a92c'] as const;

export type PlayerColor = (typeof PLAYER_COLORS)[number];
