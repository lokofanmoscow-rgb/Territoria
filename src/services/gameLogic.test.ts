import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { UNIT_TYPES } from '../constants/unitTypes';
import type { PlayerInfo, PlayerPendingMove, ProvinceState } from '../types/game';
import type { RegionStatic } from '../types/map';
import {
  applyUpkeep,
  checkWinner,
  computeIncome,
  resolveAttacks,
  resolveReinforcements,
  resolveRound,
  totalUnits,
} from './gameLogic';

function province(ownerId: string | null, units: ProvinceState['units'] = {}): ProvinceState {
  return { ownerId, units };
}

function player(uid: string, gold: number): PlayerInfo {
  return { uid, name: uid, color: '#fff', isReady: true, gold };
}

describe('computeIncome', () => {
  test('база — по 2 золота за провинцию', () => {
    const provinces = { 0: province('a'), 1: province('a'), 2: province('b') };
    assert.equal(computeIncome('a', provinces, []), 4);
  });

  test('бонус региона начисляется только при полном контроле всех его провинций', () => {
    const regions: RegionStatic[] = [{ id: 1, provinceIds: [0, 1], controlBonus: 5 }];
    const partial = { 0: province('a'), 1: province('b') };
    const full = { 0: province('a'), 1: province('a') };

    assert.equal(computeIncome('a', partial, regions), 2);
    assert.equal(computeIncome('a', full, regions), 2 * 2 + 5);
  });
});

describe('applyUpkeep', () => {
  test('хватает золота — состав армии не меняется', () => {
    const provinces = { 0: province('a', { infantry: 3 }) };
    const result = applyUpkeep('a', provinces, 100);
    assert.equal(result.provinces[0].units.infantry, 3);
    assert.equal(result.gold, 100 - 3 * UNIT_TYPES.infantry.upkeep);
  });

  test('не хватает золота — дезертируют самые дешёвые юниты, пока не станет по карману', () => {
    // upkeep: 2 пехоты (1+1) + 1 кавалерия (2) = 4, золота только 1
    const provinces = { 0: province('a', { infantry: 2, cavalry: 1 }) };
    const result = applyUpkeep('a', provinces, 1);

    const remainingUpkeep =
      (result.provinces[0].units.infantry ?? 0) * UNIT_TYPES.infantry.upkeep +
      (result.provinces[0].units.cavalry ?? 0) * UNIT_TYPES.cavalry.upkeep;
    assert.ok(remainingUpkeep <= 1, `upkeep должен вписаться в золото: ${remainingUpkeep}`);
    // дешёвая пехота уходит первой — кавалерия должна была бы уйти позже
    assert.equal(result.provinces[0].units.infantry ?? 0, 0);
  });
});

describe('resolveReinforcements', () => {
  test('нанимает столько, на сколько хватает золота, не больше запрошенного', () => {
    const provinces = { 0: province('a', {}) };
    // золота хватает ровно на 3 пехотинца (cost 10 каждый)
    const result = resolveReinforcements('a', provinces, 35, { 0: { infantry: 5 } });

    assert.equal(result.provinces[0].units.infantry, 3);
    assert.equal(result.gold, 5);
  });

  test('нельзя нанимать в чужой провинции', () => {
    const provinces = { 0: province('b', {}) };
    const result = resolveReinforcements('a', provinces, 100, { 0: { infantry: 5 } });

    assert.equal(result.provinces[0].units.infantry ?? 0, 0);
    assert.equal(result.gold, 100);
  });
});

describe('бой (через resolveAttacks)', () => {
  test('атакующий побеждает при перевесе силы — провинция переходит, часть войск теряется', () => {
    const provinces = {
      0: province('a', { infantry: 10 }),
      1: province('b', { infantry: 2 }),
    };
    const pendingMoves: Record<string, PlayerPendingMove> = {
      a: { reinforcements: {}, attacks: [{ from: 0, to: 1, units: { infantry: 10 } }], submitted: true },
    };

    const { provinces: next } = resolveAttacks(provinces, pendingMoves);

    assert.equal(next[1].ownerId, 'a');
    assert.ok(totalUnits(next[1].units) > 0, 'победитель должен потерять часть войск, но не все');
    assert.ok(totalUnits(next[1].units) < 10, 'победитель не может сохранить 100% при сопротивлении');
    assert.equal(totalUnits(next[0].units), 0, 'источник атаки отправил всю армию');
  });

  test('атакующий проигрывает при недостатке силы — теряет все посланные войска', () => {
    const provinces = {
      0: province('a', { infantry: 3 }),
      1: province('b', { artillery: 5 }),
    };
    const pendingMoves: Record<string, PlayerPendingMove> = {
      a: { reinforcements: {}, attacks: [{ from: 0, to: 1, units: { infantry: 3 } }], submitted: true },
    };

    const { provinces: next } = resolveAttacks(provinces, pendingMoves);

    assert.equal(next[1].ownerId, 'b', 'провинция остаётся у защитника');
    assert.equal(totalUnits(next[0].units), 0, 'атакующая армия полностью погибла в атаке');
    assert.ok(totalUnits(next[1].units) > 0 && totalUnits(next[1].units) <= 5, 'защитник несёт потери, но выживает');
  });

  test('несколько атак на одну провинцию в раунде резолвятся по порядку', () => {
    const provinces = {
      0: province('a', { infantry: 10 }),
      1: province('c', { infantry: 10 }),
      2: province('neutral', { infantry: 1 }),
    };
    // обе атаки нацелены на провинцию 2; по сортировке (to, from, uid) первым
    // придёт атакующий из провинции 0 (from меньше)
    const pendingMoves: Record<string, PlayerPendingMove> = {
      a: { reinforcements: {}, attacks: [{ from: 0, to: 2, units: { infantry: 10 } }], submitted: true },
      c: { reinforcements: {}, attacks: [{ from: 1, to: 2, units: { infantry: 10 } }], submitted: true },
    };

    const { provinces: next, outcomes } = resolveAttacks(provinces, pendingMoves);

    assert.equal(outcomes.length, 2);
    assert.equal(outcomes[0].attackerId, 'a', 'атака из провинции с меньшим from идёт первой');
    // после первой атаки провинция 2 уже принадлежит "a" — вторая атака бьётся с новым хозяином
    assert.equal(outcomes[1].attackerId, 'c');
    assert.notEqual(next[2].ownerId, 'neutral');
  });
});

describe('checkWinner', () => {
  test('нет победителя, пока несколько игроков владеют провинциями', () => {
    const provinces = { 0: province('a'), 1: province('b') };
    assert.equal(checkWinner(provinces, [player('a', 0), player('b', 0)]), null);
  });

  test('победа при контроле всей карты', () => {
    const provinces = { 0: province('a'), 1: province('a') };
    assert.equal(checkWinner(provinces, [player('a', 0), player('b', 0)]), 'a');
  });

  test('победа, если остался только один игрок с провинциями', () => {
    const provinces = { 0: province('a'), 1: province(null) };
    assert.equal(checkWinner(provinces, [player('a', 0), player('b', 0)]), 'a');
  });
});

describe('resolveRound — интеграционный сценарий', () => {
  test('доход начисляется, рекрутинг тратит золото, атака переносит владение', () => {
    const provinces = {
      0: province('a', { infantry: 5 }),
      1: province('b', { infantry: 1 }),
    };
    const regions: RegionStatic[] = [];
    const players = [player('a', 20), player('b', 20)];
    const pendingMoves: Record<string, PlayerPendingMove> = {
      a: {
        reinforcements: { 0: { infantry: 1 } },
        attacks: [{ from: 0, to: 1, units: { infantry: 5 } }],
        submitted: true,
      },
      b: { reinforcements: {}, attacks: [], submitted: true },
    };

    const result = resolveRound({ provinces, regions, players, pendingMoves });

    assert.equal(result.provinces[1].ownerId, 'a', 'a должен отбить провинцию 1');
    const playerA = result.players.find((p) => p.uid === 'a')!;
    // 20 стартового золота + 2 доход за 1 провинцию - 5 upkeep пехоты - 10 за найм 1 пехотинца
    assert.equal(playerA.gold, 20 + 2 - 5 - 10);
  });

  test('игра заканчивается, когда остаётся один игрок с провинциями', () => {
    const provinces = { 0: province('a', { infantry: 20 }), 1: province('b', { infantry: 1 }) };
    const players = [player('a', 0), player('b', 0)];
    const pendingMoves: Record<string, PlayerPendingMove> = {
      a: {
        reinforcements: {},
        attacks: [{ from: 0, to: 1, units: { infantry: 20 } }],
        submitted: true,
      },
      b: { reinforcements: {}, attacks: [], submitted: true },
    };

    const result = resolveRound({ provinces, regions: [], players, pendingMoves });
    assert.equal(result.winnerId, 'a');
  });
});
