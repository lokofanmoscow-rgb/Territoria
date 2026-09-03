import { UNIT_TYPE_IDS, UNIT_TYPES, type UnitType } from '../constants/unitTypes';
import type {
  ArmyComposition,
  AttackMove,
  PlayerInfo,
  PlayerPendingMove,
  ProvinceState,
} from '../types/game';
import type { RegionStatic } from '../types/map';

// Чистые функции без UI/Firestore-зависимостей (см. territorygamestructure.md
// §3) — весь резолв раунда: доход, содержание армии (с дезертирством при
// нехватке золота), рекрутинг, бой по типам юнитов, проверка победы.

export const STARTING_GOLD = 50;
export const BASE_INCOME_PER_PROVINCE = 2;

// ---------------------------------------------------------------------------
// Состав армии — арифметика по ArmyComposition

export function totalUnits(composition: ArmyComposition): number {
  return UNIT_TYPE_IDS.reduce((sum, type) => sum + (composition[type] ?? 0), 0);
}

export function compositionPower(composition: ArmyComposition, stat: 'attack' | 'defense'): number {
  return UNIT_TYPE_IDS.reduce((sum, type) => sum + (composition[type] ?? 0) * UNIT_TYPES[type][stat], 0);
}

function compositionUpkeep(composition: ArmyComposition): number {
  return UNIT_TYPE_IDS.reduce((sum, type) => sum + (composition[type] ?? 0) * UNIT_TYPES[type].upkeep, 0);
}

function addComposition(a: ArmyComposition, b: ArmyComposition): ArmyComposition {
  const result: ArmyComposition = { ...a };
  for (const type of UNIT_TYPE_IDS) {
    const sum = (a[type] ?? 0) + (b[type] ?? 0);
    if (sum > 0) result[type] = sum;
  }
  return result;
}

function subtractComposition(a: ArmyComposition, b: ArmyComposition): ArmyComposition {
  const result: ArmyComposition = {};
  for (const type of UNIT_TYPE_IDS) {
    const diff = Math.max(0, (a[type] ?? 0) - (b[type] ?? 0));
    if (diff > 0) result[type] = diff;
  }
  return result;
}

// Пропорционально уменьшает состав армии до заданного итогового числа юнитов
// (используется и для потерь в бою, и для дезертирства при нехватке золота).
function scaleComposition(composition: ArmyComposition, targetTotal: number): ArmyComposition {
  const current = totalUnits(composition);
  if (targetTotal <= 0 || current <= 0) return {};
  if (targetTotal >= current) return composition;

  const ratio = targetTotal / current;
  const scaled: ArmyComposition = {};
  let assigned = 0;
  const activeTypes = UNIT_TYPE_IDS.filter((type) => (composition[type] ?? 0) > 0);
  activeTypes.forEach((type, index) => {
    const isLast = index === activeTypes.length - 1;
    const value = isLast ? targetTotal - assigned : Math.round((composition[type] ?? 0) * ratio);
    const clamped = Math.max(0, Math.min(value, composition[type] ?? 0));
    if (clamped > 0) scaled[type] = clamped;
    assigned += clamped;
  });
  return scaled;
}

// ---------------------------------------------------------------------------
// Доход: база за каждую провинцию + бонус региона при полном контроле всех
// его провинций одним игроком.

export function computeIncome(
  playerId: string,
  provinces: Record<number, ProvinceState>,
  regions: RegionStatic[],
): number {
  const ownedCount = Object.values(provinces).filter((state) => state.ownerId === playerId).length;
  const base = ownedCount * BASE_INCOME_PER_PROVINCE;

  const controlBonus = regions.reduce((sum, region) => {
    const fullyControlled =
      region.provinceIds.length > 0 &&
      region.provinceIds.every((id) => provinces[id]?.ownerId === playerId);
    return fullyControlled ? sum + region.controlBonus : sum;
  }, 0);

  return base + controlBonus;
}

// ---------------------------------------------------------------------------
// Содержание армии. Если золота не хватает — самые дешёвые по upkeep юниты
// дезертируют, провинция за провинцией в порядке id, пока расходы не впишутся
// в доступное золото. Без этого правила армию можно растить бесконечно, не
// считаясь с экономикой.

export interface UpkeepResult {
  provinces: Record<number, ProvinceState>;
  gold: number;
}

export function applyUpkeep(
  playerId: string,
  provinces: Record<number, ProvinceState>,
  goldBeforeUpkeep: number,
): UpkeepResult {
  const ownedIds = Object.keys(provinces)
    .map(Number)
    .filter((id) => provinces[id].ownerId === playerId)
    .sort((a, b) => a - b);

  const nextProvinces = { ...provinces };
  let totalUpkeep = ownedIds.reduce((sum, id) => sum + compositionUpkeep(nextProvinces[id].units), 0);

  let cursor = 0;
  while (totalUpkeep > goldBeforeUpkeep && cursor < ownedIds.length) {
    const provinceId = ownedIds[cursor];
    const state = nextProvinces[provinceId];
    const cheapestType = UNIT_TYPE_IDS.filter((type) => (state.units[type] ?? 0) > 0).sort(
      (a, b) => UNIT_TYPES[a].upkeep - UNIT_TYPES[b].upkeep,
    )[0];

    if (!cheapestType) {
      cursor += 1;
      continue;
    }

    nextProvinces[provinceId] = {
      ...state,
      units: subtractComposition(state.units, { [cheapestType]: 1 }),
    };
    totalUpkeep -= UNIT_TYPES[cheapestType].upkeep;
  }

  return { provinces: nextProvinces, gold: goldBeforeUpkeep - totalUpkeep };
}

// ---------------------------------------------------------------------------
// Рекрутинг: тратим золото, оставшееся после содержания армии. Нанимать
// можно только в своих провинциях; если денег не хватает на весь заказ,
// нанимается столько, сколько получится оплатить.

export interface ReinforceResult {
  provinces: Record<number, ProvinceState>;
  gold: number;
}

export function resolveReinforcements(
  playerId: string,
  provinces: Record<number, ProvinceState>,
  gold: number,
  reinforcements: Record<number, ArmyComposition>,
): ReinforceResult {
  let remainingGold = gold;
  const nextProvinces = { ...provinces };

  for (const provinceId of Object.keys(reinforcements).map(Number)) {
    const state = nextProvinces[provinceId];
    if (!state || state.ownerId !== playerId) continue;

    const requested = reinforcements[provinceId];
    let recruited: ArmyComposition = {};

    for (const type of UNIT_TYPE_IDS) {
      const count = requested[type] ?? 0;
      if (count <= 0) continue;
      const affordable = Math.min(count, Math.floor(remainingGold / UNIT_TYPES[type].cost));
      if (affordable <= 0) continue;
      remainingGold -= affordable * UNIT_TYPES[type].cost;
      recruited = addComposition(recruited, { [type]: affordable });
    }

    if (totalUnits(recruited) > 0) {
      nextProvinces[provinceId] = { ...state, units: addComposition(state.units, recruited) };
    }
  }

  return { provinces: nextProvinces, gold: remainingGold };
}

// ---------------------------------------------------------------------------
// Горные границы (map.mountainBorders) блокируют прямую атаку между
// конкретной парой провинций в обе стороны — не зависит от направления.
// UI (GameScreen) не должен вообще предлагать такие цели, но это финальная
// проверка на сервере/в логике игры: даже если атака как-то попала в
// pendingMoves (рассинхрон клиента, будущий читер), она молча игнорируется.

export function pairKey(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

export function isBlockedPair(a: number, b: number, blockedPairs: ReadonlySet<string>): boolean {
  return blockedPairs.has(pairKey(a, b));
}

// ---------------------------------------------------------------------------
// Бой. Детерминированная формула без RNG: сравниваются attack-сила
// отправленных юнитов и defense-сила гарнизона. Победитель теряет часть
// участвовавших войск пропорционально тому, насколько close был бой (близкий
// бой — тяжёлые потери, разгром — почти без потерь).

export interface AttackOutcome {
  attackerId: string;
  from: number;
  to: number;
  attackerWon: boolean;
  attackPower: number;
  defensePower: number;
}

const LOSS_FACTOR = 0.5;

function resolveSingleAttack(
  provinces: Record<number, ProvinceState>,
  attackerId: string,
  attack: AttackMove,
): { provinces: Record<number, ProvinceState>; outcome: AttackOutcome } {
  const fromState = provinces[attack.from];
  const toState = provinces[attack.to];

  // Защита от рассинхрона состояния: нельзя отправить в атаку больше войск,
  // чем реально стоит в провинции-источнике у атакующего.
  const sentUnits: ArmyComposition = {};
  for (const type of UNIT_TYPE_IDS) {
    const requested = attack.units[type] ?? 0;
    const available = fromState?.ownerId === attackerId ? (fromState.units[type] ?? 0) : 0;
    const sent = Math.min(requested, available);
    if (sent > 0) sentUnits[type] = sent;
  }

  const attackPower = compositionPower(sentUnits, 'attack');
  const defensePower = compositionPower(toState?.units ?? {}, 'defense');
  const attackerWon = totalUnits(sentUnits) > 0 && attackPower > defensePower;

  const nextProvinces = { ...provinces };
  nextProvinces[attack.from] = { ...fromState, units: subtractComposition(fromState.units, sentUnits) };

  if (attackerWon) {
    const closeness = defensePower / Math.max(attackPower, 1e-6);
    const survivors = Math.round(totalUnits(sentUnits) * (1 - closeness * LOSS_FACTOR));
    nextProvinces[attack.to] = { ownerId: attackerId, units: scaleComposition(sentUnits, survivors) };
  } else {
    const closeness = totalUnits(sentUnits) > 0 ? attackPower / Math.max(defensePower, 1e-6) : 0;
    const defenderTotal = totalUnits(toState?.units ?? {});
    const survivors = Math.round(defenderTotal * (1 - closeness * LOSS_FACTOR));
    nextProvinces[attack.to] = {
      ownerId: toState?.ownerId ?? null,
      units: scaleComposition(toState?.units ?? {}, survivors),
    };
  }

  return {
    provinces: nextProvinces,
    outcome: { attackerId, from: attack.from, to: attack.to, attackerWon, attackPower, defensePower },
  };
}

interface FlatAttack extends AttackMove {
  attackerId: string;
}

// Все атаки всех игроков за раунд сортируются в единый детерминированный
// порядок (по цели, затем источнику, затем uid атакующего) и резолвятся
// одна за другой — атака на уже отбитую в этом же раунде провинцию сражается
// с её новым хозяином, без RNG и без гонки между клиентами.
function collectAttacks(pendingMoves: Record<string, PlayerPendingMove>): FlatAttack[] {
  const flat: FlatAttack[] = [];
  for (const [attackerId, move] of Object.entries(pendingMoves)) {
    if (!move.submitted) continue;
    for (const attack of move.attacks) {
      flat.push({ ...attack, attackerId });
    }
  }
  return flat.sort(
    (a, b) => a.to - b.to || a.from - b.from || a.attackerId.localeCompare(b.attackerId),
  );
}

export function resolveAttacks(
  provinces: Record<number, ProvinceState>,
  pendingMoves: Record<string, PlayerPendingMove>,
  blockedPairs: ReadonlySet<string> = new Set(),
): { provinces: Record<number, ProvinceState>; outcomes: AttackOutcome[] } {
  let current = provinces;
  const outcomes: AttackOutcome[] = [];
  for (const attack of collectAttacks(pendingMoves)) {
    if (isBlockedPair(attack.from, attack.to, blockedPairs)) continue;
    const result = resolveSingleAttack(current, attack.attackerId, attack);
    current = result.provinces;
    outcomes.push(result.outcome);
  }
  return { provinces: current, outcomes };
}

// ---------------------------------------------------------------------------
// Победа: контроль всей карты одним игроком, либо остался только один игрок
// с провинциями. Вариант "% территории за N раундов" из доки — расширение
// на будущее, тут не реализован (нужен доступ к currentRound/лимиту раундов).

export function checkWinner(provinces: Record<number, ProvinceState>, players: PlayerInfo[]): string | null {
  const totalProvinces = Object.keys(provinces).length;
  if (totalProvinces === 0) return null;

  const ownerCounts = new Map<string, number>();
  for (const state of Object.values(provinces)) {
    if (!state.ownerId) continue;
    ownerCounts.set(state.ownerId, (ownerCounts.get(state.ownerId) ?? 0) + 1);
  }

  for (const [ownerId, count] of ownerCounts) {
    if (count === totalProvinces) return ownerId;
  }

  const activePlayers = players.filter((player) => (ownerCounts.get(player.uid) ?? 0) > 0);
  if (activePlayers.length === 1) return activePlayers[0].uid;

  return null;
}

// ---------------------------------------------------------------------------
// resolveRound: доход → содержание → рекрутинг → атаки → проверка победы.
// Порядок соответствует §3 territorygamestructure.md.

export interface ResolveRoundInput {
  provinces: Record<number, ProvinceState>;
  regions: RegionStatic[];
  players: PlayerInfo[];
  pendingMoves: Record<string, PlayerPendingMove>;
  blockedPairs?: ReadonlySet<string>;
}

export interface ResolveRoundResult {
  provinces: Record<number, ProvinceState>;
  players: PlayerInfo[];
  winnerId: string | null;
}

export function resolveRound(input: ResolveRoundInput): ResolveRoundResult {
  let provinces = input.provinces;

  const playersAfterEconomy = input.players.map((player) => {
    const income = computeIncome(player.uid, provinces, input.regions);
    const goldAfterIncome = (player.gold ?? STARTING_GOLD) + income;
    const upkeep = applyUpkeep(player.uid, provinces, goldAfterIncome);
    provinces = upkeep.provinces;
    return { ...player, gold: upkeep.gold };
  });

  const playersAfterReinforcements = playersAfterEconomy.map((player) => {
    const move = input.pendingMoves[player.uid];
    if (!move?.submitted) return player;
    const result = resolveReinforcements(player.uid, provinces, player.gold ?? 0, move.reinforcements);
    provinces = result.provinces;
    return { ...player, gold: result.gold };
  });

  const attackResult = resolveAttacks(provinces, input.pendingMoves, input.blockedPairs);
  provinces = attackResult.provinces;

  const winnerId = checkWinner(provinces, playersAfterReinforcements);

  return { provinces, players: playersAfterReinforcements, winnerId };
}
