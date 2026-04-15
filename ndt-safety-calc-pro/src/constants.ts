import { StructureType, InspectionType, FacilityClass } from './types';

export const STRUCTURE_INFO: Record<StructureType, { name: string; icon: string }> = {
  BRIDGE: { name: '교량', icon: 'Construction' },
  TUNNEL: { name: '터널', icon: 'Map' },
  RETAINING_WALL: { name: '옹벽', icon: 'BrickWall' }
};

export const INSPECTION_INFO: Record<InspectionType, { name: string }> = {
  DETAILED_INSPECTION: { name: '정밀안전점검' },
  DETAILED_DIAGNOSIS: { name: '정밀안전진단' },
  PERFORMANCE_EVAL_1: { name: '1종 성능평가' },
  PERFORMANCE_EVAL_2: { name: '2종 성능평가' }
};

export const FACILITY_CLASS_INFO: Record<FacilityClass, string> = {
  CLASS_1: '1종 시설물',
  CLASS_2: '2종 시설물',
  CLASS_3: '3종 시설물',
  OTHER: '기타'
};

export const BRIDGE_TYPES = [
  'STB (강박스)', 'SPG (강플레이트)', 'PSCI (PSC I형)', 
  'SLAB (RC슬래브)', 'RA (라멘)', '트러스교', 
  '아치교', '현수교', '사장교', '기타'
];

export const calcByLength = (l: number, d: number) => Math.max(1, Math.ceil(l / d));

export const getAdjustmentRatio = (l: number) => {
  if (l <= 300) return 1.0;
  if (l <= 500) return Number((1.0 - (0.2 * (l - 300) / 200)).toFixed(3));
  if (l <= 1000) return Number((0.8 - (0.2 * (l - 500) / 500)).toFixed(3));
  if (l <= 2000) return Number((0.6 - (0.2 * (l - 1000) / 1000)).toFixed(3));
  if (l <= 4000) return Number((0.4 - (0.15 * (l - 2000) / 2000)).toFixed(3));
  return 0.25;
};

export const isSteel = (t: string) => t.includes('강') || t.includes('STB') || t.includes('SPG') || t.includes('트러스');
