import {
  ISLAND_GROUPS,
  PROVINCE_DATA,
  type IslandGroup,
} from "@/data/provinceData";

export interface IndonesiaProvince {
  name: string;
  islandGroup: IslandGroup;
}

export interface ProvinceGroup {
  id: IslandGroup;
  name: string;
  provinces: IndonesiaProvince[];
}

export const INDONESIA_PROVINCES: IndonesiaProvince[] = PROVINCE_DATA.map(
  (province) => ({
    name: province.name,
    islandGroup: province.islandGroup,
  }),
);

export const PROVINCE_NAMES: string[] = INDONESIA_PROVINCES.map(
  (province) => province.name,
);

export const PROVINCE_GROUPS: ProvinceGroup[] = (
  Object.keys(ISLAND_GROUPS) as IslandGroup[]
).map((id) => ({
  id,
  name: ISLAND_GROUPS[id].name,
  provinces: INDONESIA_PROVINCES.filter(
    (province) => province.islandGroup === id,
  ),
}));
