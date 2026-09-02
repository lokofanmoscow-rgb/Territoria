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
  seed: number;
  viewBox: string;
  provinceCount: number;
  boundary: [number, number][];
  provinces: ProvinceStatic[];
  regions: RegionStatic[];
}

export interface MapSummary {
  name: string;
  sizeClass: SizeClass;
  provinceCount: number;
  regions: number;
}
