export type StructureType = 'BRIDGE' | 'TUNNEL' | 'RETAINING_WALL';
export type InspectionType = 'DETAILED_INSPECTION' | 'DETAILED_DIAGNOSIS' | 'PERFORMANCE_EVAL_1' | 'PERFORMANCE_EVAL_2';
export type FacilityClass = 'CLASS_1' | 'CLASS_2' | 'CLASS_3' | 'OTHER';

export interface BridgeSpan {
  id: string;
  type: string;
  spanLength: number;
  spanCount: number;
  girderCount: number;
}

export interface TunnelSection {
  id: string;
  type: string;
  length: number;
  concreteType: 'REINFORCED' | 'PLAIN';
}

export interface RetainingWallSection {
  id: string;
  type: 'CONCRETE' | 'REINFORCED_SOIL' | 'STONE';
  length: number;
}

export interface ImplQty {
  upper?: string | number;
  lower?: string | number;
}

export interface Facility {
  id: string;
  name: string;
  selectedType: StructureType;
  inspectionType: InspectionType;
  facilityClass: FacilityClass;
  bridgeSpans: BridgeSpan[];
  tunnelSections: TunnelSection[];
  retainingWallSections: RetainingWallSection[];
  evalUnit: number;
  implQtys: Record<string, ImplQty>;
}

export interface AppData {
  facilities: Facility[];
  currentId: string;
}
