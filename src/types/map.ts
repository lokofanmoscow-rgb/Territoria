// Static map data shape, matching maps_output/data/<name>.json

export type SizeClass = 'small' | 'medium' | 'large';

export interface ProvinceStatic {
  id: number;
  regionId: number;
  points: [number, number][];
  svgPath: string;
  centroid: [number, number];
  neighbors: number[];
}

export interface RegionStatic {
  id: number;
  provinceIds: number[];
  controlBonus: number;
}

export interface MapData {
  name: string;
  sizeClass: SizeClass;
  /** только у процедурных карт (map_generator.py) — у реальных географических его нет */
  seed?: number;
  /** для карт на реальной географии — откуда взяты границы, см. maps-source/geo-source/README.md */
  source?: string;
  viewBox: string;
  provinceCount: number;
  /** массив колец, а не одно — архипелаги (Япония, Австралия+Тасмания) состоят из нескольких островов */
  boundary: [number, number][][];
  provinces: ProvinceStatic[];
  regions: RegionStatic[];
}

export interface MapSummary {
  name: string;
  sizeClass: SizeClass;
  provinceCount: number;
  regions: number;
}
