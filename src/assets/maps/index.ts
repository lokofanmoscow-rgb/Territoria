import type { MapData, MapSummary } from '../../types/map';
import summary from './index.json';

// Metro needs static `require` calls — one per map — so this registry can't be
// generated from index.json at runtime. Keep it in sync with src/assets/maps/data/.
const registry: Record<string, MapData> = {
  small_01: require('./data/small_01.json'),
  small_02: require('./data/small_02.json'),
  small_03: require('./data/small_03.json'),
  small_04: require('./data/small_04.json'),
  small_05: require('./data/small_05.json'),
  medium_01: require('./data/medium_01.json'),
  medium_02: require('./data/medium_02.json'),
  medium_03: require('./data/medium_03.json'),
  medium_04: require('./data/medium_04.json'),
  medium_05: require('./data/medium_05.json'),
  large_01: require('./data/large_01.json'),
  large_02: require('./data/large_02.json'),
  large_03: require('./data/large_03.json'),
  large_04: require('./data/large_04.json'),
  large_05: require('./data/large_05.json'),
  // Карты на реальной географии: настоящие контуры стран (Natural Earth,
  // public domain, через apexmaps-geo), внутри каждой страны — процедурное
  // Voronoi-деление на несколько провинций (не настоящие admin1-границы) —
  // см. maps-source/geo-source/README.md.
  world_small: require('./data/world_small.json'),
  world_medium: require('./data/world_medium.json'),
  world_large: require('./data/world_large.json'),
};

export const mapSummaries = summary as MapSummary[];

export function getMapData(name: string): MapData {
  const map = registry[name];
  if (!map) {
    throw new Error(`Unknown map: ${name}`);
  }
  return map;
}

export function listMapNames(): string[] {
  return Object.keys(registry);
}
