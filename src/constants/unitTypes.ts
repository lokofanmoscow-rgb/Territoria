// Три типа войск с классическим для стратегий "треугольником": пехота —
// дешёвый и сбалансированный костяк армии, кавалерия — дорогой сильный
// удар в атаке ценой слабой обороны, артиллерия — самый разрушительный и
// самый хрупкий тип. cost — разовая цена найма, upkeep — золото за
// содержание одной единицы каждый раунд.
export type UnitType = 'infantry' | 'cavalry' | 'artillery';

export interface UnitTypeStats {
  id: UnitType;
  label: string;
  cost: number;
  upkeep: number;
  attack: number;
  defense: number;
}

export const UNIT_TYPES: Record<UnitType, UnitTypeStats> = {
  infantry: { id: 'infantry', label: 'Пехота', cost: 10, upkeep: 1, attack: 1, defense: 1 },
  cavalry: { id: 'cavalry', label: 'Кавалерия', cost: 18, upkeep: 2, attack: 1.6, defense: 0.8 },
  artillery: { id: 'artillery', label: 'Артиллерия', cost: 25, upkeep: 3, attack: 2.2, defense: 0.6 },
};

export const UNIT_TYPE_LIST: UnitTypeStats[] = Object.values(UNIT_TYPES);

// Фиксированный порядок обхода типов — используется в резолве раунда, чтобы
// расчёты не зависели от порядка ключей в объектах ArmyComposition,
// присланных клиентом.
export const UNIT_TYPE_IDS: UnitType[] = UNIT_TYPE_LIST.map((u) => u.id);
