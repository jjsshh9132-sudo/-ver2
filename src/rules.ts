import { Facility, ImplQty } from './types';
import { calcByLength, getAdjustmentRatio, isSteel } from './constants';

export interface TestResult {
  id: string;
  name: string;
  upperQty: string | number;
  lowerQty: string | number;
  upperCriteria: string;
  lowerCriteria: string;
}

export const getCategory = (ruleId: string, s: Facility): 'BASIC' | 'OPTIONAL' => {
  const isDetailed = s.inspectionType === 'DETAILED_DIAGNOSIS' || s.inspectionType === 'PERFORMANCE_EVAL_1';
  
  if (s.selectedType === 'BRIDGE') {
    if (s.inspectionType === 'DETAILED_INSPECTION') {
      const basic = ['rebound', 'carbonation'];
      return basic.includes(ruleId) ? 'BASIC' : 'OPTIONAL';
    } else if (s.inspectionType === 'PERFORMANCE_EVAL_2') {
      const basic = ['rebound', 'rebar_scan', 'carbonation', 'chloride', 'coating_thickness'];
      return basic.includes(ruleId) ? 'BASIC' : 'OPTIONAL';
    } else if (isDetailed) {
      const basic = ['rebound', 'ultrasonic', 'rebar_scan', 'carbonation', 'chloride', 'crack_depth', 'steel_ut', 'coating_thickness'];
      return basic.includes(ruleId) ? 'BASIC' : 'OPTIONAL';
    }
  } else if (s.selectedType === 'TUNNEL') {
    if (s.inspectionType === 'DETAILED_INSPECTION') {
      const basic = ['survey_section', 'rebound', 'carbonation'];
      return basic.includes(ruleId) ? 'BASIC' : 'OPTIONAL';
    } else if (s.inspectionType === 'PERFORMANCE_EVAL_1') {
      const basic = ['survey_section', 'cross_section', 'rebound', 'ultrasonic', 'rebar_scan', 'rebar_corrosion', 'crack_depth', 'carbonation', 'chloride', 'luminance', 'illuminance'];
      return basic.includes(ruleId) ? 'BASIC' : 'OPTIONAL';
    } else if (s.inspectionType === 'PERFORMANCE_EVAL_2') {
      const basic = ['survey_section', 'rebound', 'carbonation', 'chloride', 'luminance', 'illuminance'];
      return basic.includes(ruleId) ? 'BASIC' : 'OPTIONAL';
    } else if (s.inspectionType === 'DETAILED_DIAGNOSIS') {
      const basic = ['survey_section', 'cross_section', 'rebound', 'ultrasonic', 'rebar_scan', 'chloride', 'carbonation'];
      return basic.includes(ruleId) ? 'BASIC' : 'OPTIONAL';
    }
  } else if (s.selectedType === 'RETAINING_WALL') {
    if (s.inspectionType === 'DETAILED_INSPECTION') {
      const basic = ['survey_section', 'survey', 'rebound', 'carbonation', 'rock_weathering', 'filling_concrete'];
      return basic.includes(ruleId) ? 'BASIC' : 'OPTIONAL';
    } else if (isDetailed) {
      const optional = ['crack_depth', 'deformation_survey', 'core_sampling', 'groundwater', 'inclinometer', 'earth_pressure', 'coating_thickness'];
      return optional.includes(ruleId) ? 'OPTIONAL' : 'BASIC';
    } else if (s.inspectionType === 'PERFORMANCE_EVAL_2') {
      const basic = ['survey_section', 'survey', 'rebound', 'carbonation', 'chloride', 'filling_concrete'];
      return basic.includes(ruleId) ? 'BASIC' : 'OPTIONAL';
    }
  }
  return 'BASIC';
};

export const TEST_RULES: Record<string, Array<{ id: string; name: string; calculate: (s: Facility) => Omit<TestResult, 'id' | 'name'> }>> = {
  BRIDGE: [
    { id: 'rebound', name: '반발경도시험', calculate: (s) => {
      const isD = s.inspectionType === 'DETAILED_DIAGNOSIS' || s.inspectionType === 'PERFORMANCE_EVAL_1';
      const spans = s.bridgeSpans || [];
      const totalL = spans.reduce((acc, sp) => acc + (sp.spanLength || 0) * (sp.spanCount || 0), 0);
      const r = getAdjustmentRatio(totalL);
      const uQty = Math.ceil(calcByLength(totalL, 50) * (isD ? 2 : 1) * r);
      const lQty = Math.ceil(calcByLength(totalL, 50) * r);
      return { upperQty: uQty, lowerQty: lQty, upperCriteria: isD ? 'RC: 2개소/50m, 강재: 1개소/50m' : '1개소/50m', lowerCriteria: '1개소/연장 50m' };
    }},
    { id: 'ultrasonic', name: '초음파법(비파괴)', calculate: (s) => {
      const isD = s.inspectionType === 'DETAILED_DIAGNOSIS' || s.inspectionType === 'PERFORMANCE_EVAL_1';
      const spans = s.bridgeSpans || [];
      const totalL = spans.reduce((acc, sp) => acc + (sp.spanLength || 0) * (sp.spanCount || 0), 0);
      const r = getAdjustmentRatio(totalL);
      const qty = Math.ceil(calcByLength(totalL, 50) * (isD ? 2 : 1) * r);
      const lQty = Math.ceil(calcByLength(totalL, 50) * r);
      return { upperQty: qty, lowerQty: lQty, upperCriteria: isD ? 'RC: 2개소/50m, 강재: 1개소/50m' : '1개소/50m', lowerCriteria: '1개소/연장 50m' };
    }},
    { id: 'rebar_scan', name: '철근탐사', calculate: (s) => {
      const isD = s.inspectionType === 'DETAILED_DIAGNOSIS' || s.inspectionType === 'PERFORMANCE_EVAL_1';
      const spans = s.bridgeSpans || [];
      const totalL = spans.reduce((acc, sp) => acc + (sp.spanLength || 0) * (sp.spanCount || 0), 0);
      const r = getAdjustmentRatio(totalL);
      const qty = Math.ceil(calcByLength(totalL, 50) * (isD ? 2 : 1) * r);
      const lQty = Math.ceil(calcByLength(totalL, 50) * r);
      return { upperQty: qty, lowerQty: lQty, upperCriteria: isD ? 'RC: 2개소/50m, 강재: 1개소/50m' : '1개소/50m', lowerCriteria: '1개소/연장 50m' };
    }},
    { id: 'carbonation', name: '탄산화깊이 측정', calculate: (s) => {
      const isDI = s.inspectionType === 'DETAILED_INSPECTION' || s.inspectionType === 'PERFORMANCE_EVAL_2';
      const isDD = s.inspectionType === 'DETAILED_DIAGNOSIS' || s.inspectionType === 'PERFORMANCE_EVAL_1';
      const spans = s.bridgeSpans || [];
      const totalSpans = spans.reduce((acc, sp) => acc + (sp.spanCount || 0), 0);
      const isSmall = totalSpans < 5;
      if (isDI) {
        const uQty = isSmall ? 1 : 2;
        const lQty = isSmall ? 2 : 4;
        return { upperQty: uQty, lowerQty: lQty, upperCriteria: '5경간 이내: 2~3개소\n5경간 이상: 3~6개소', lowerCriteria: '상부구조 수량 준용' };
      } else if (isDD) {
        const uQty = isSmall ? 2 : 3;
        const lQty = isSmall ? 4 : 6;
        return { upperQty: uQty, lowerQty: lQty, upperCriteria: '5경간 이내: 4~6개소\n5경간 이상: 6~12개소', lowerCriteria: '상부구조 수량 준용' };
      }
      return { upperQty: '-', lowerQty: '-', upperCriteria: '-', lowerCriteria: '-' };
    }},
    { id: 'chloride', name: '염화물 함유량', calculate: () => ({ upperQty: 1, lowerQty: 2, upperCriteria: '상부구조 1개소 이상', lowerCriteria: '하부구조 2개소 이상' })},
    { id: 'crack_depth', name: '균열깊이 조사', calculate: () => ({ upperQty: '판단', lowerQty: '판단', upperCriteria: '부재의 중요도를 고려하여 결정', lowerCriteria: '책임기술자의 판단에 따라 수량 결정' })},
    { id: 'steel_ut', name: '강재용접부 초음파', calculate: (s) => {
      const hasSteel = s.bridgeSpans.some(sp => isSteel(sp.type));
      if (!hasSteel) return { upperQty: '-', lowerQty: '-', upperCriteria: '해당없음', lowerCriteria: '-' };
      return { upperQty: '전체', lowerQty: '-', upperCriteria: '플레이트거더: 1개소/경간별 거더\n박스거더: 2개소/경간별 거더', lowerCriteria: '-' };
    }},
    { id: 'coating_thickness', name: '도막두께 측정', calculate: (s) => {
      const hasSteel = s.bridgeSpans.some(sp => isSteel(sp.type));
      if (!hasSteel) return { upperQty: '-', lowerQty: '-', upperCriteria: '해당없음', lowerCriteria: '-' };
      const criteria = s.inspectionType === 'PERFORMANCE_EVAL_1' ? '강 부재: 5개소/대상경간' : '강 부재: 2~3개소/대상경간';
      return { upperQty: '전체', lowerQty: '-', upperCriteria: criteria, lowerCriteria: '-' };
    }},
    { id: 'core_sampling', name: '코어채취(강도)', calculate: () => ({ upperQty: '판단', lowerQty: '판단', upperCriteria: '과업 내용에 의해 조사 및 수량 결정', lowerCriteria: '과업 내용에 의해 조사 및 수량 결정' })},
    { id: 'underwater_survey', name: '수중조사', calculate: () => ({ upperQty: '-', lowerQty: '판단', upperCriteria: '-', lowerCriteria: '과업 내용에 의해 조사 및 수량 결정' })},
    { id: 'load_test', name: '재하시험', calculate: () => ({ upperQty: '판단', lowerQty: '-', upperCriteria: '과업 내용에 의해 조사 및 수량 결정', lowerCriteria: '-' })},
    { id: 'rebar_corrosion', name: '철근부식도', calculate: () => ({ upperQty: '판단', lowerQty: '판단', upperCriteria: '과업 내용에 의해 조사 및 수량 결정', lowerCriteria: '과업 내용에 의해 조사 및 수량 결정' })},
    { id: 'magnetic_particle', name: '자분탐상(MT)', calculate: () => ({ upperQty: '판단', lowerQty: '-', upperCriteria: '과업 내용에 의해 조사 및 수량 결정', lowerCriteria: '-' })},
    { id: 'radiographic', name: '방사선투과(RT)', calculate: () => ({ upperQty: '판단', lowerQty: '-', upperCriteria: '과업 내용에 의해 조사 및 수량 결정', lowerCriteria: '-' })},
    { id: 'clearance_survey', name: '여유고 측량', calculate: () => ({ upperQty: '판단', lowerQty: '-', upperCriteria: '과업 내용에 의해 조사 및 수량 결정', lowerCriteria: '-' })}
  ],
  TUNNEL: [
    { id: 'survey_section', name: '측정분할', calculate: (s) => {
      const isD = s.inspectionType === 'DETAILED_DIAGNOSIS' || s.inspectionType === 'PERFORMANCE_EVAL_1' || s.inspectionType === 'PERFORMANCE_EVAL_2';
      const isDI = s.inspectionType === 'DETAILED_INSPECTION';
      const criteria = isD ? '5~50m 간격' : (isDI ? '5~20m 간격' : '100m 간격');
      return { upperQty: '실시', lowerQty: '-', upperCriteria: criteria, lowerCriteria: '-' };
    }},
    { id: 'cross_section', name: '단면측량', calculate: (s) => {
      const sections = s.tunnelSections || [];
      const totalL = sections.reduce((acc, sec) => acc + (sec.length || 0), 0);
      const qty = Math.ceil(totalL / 200) + 1;
      return { upperQty: qty, lowerQty: '-', upperCriteria: '(총연장÷200m)+1개소', lowerCriteria: '-' };
    }},
    { id: 'rebound', name: '반발경도시험', calculate: (s) => {
      const sections = s.tunnelSections || [];
      const totalL = sections.reduce((acc, sec) => acc + (sec.length || 0), 0);
      const isDI = s.inspectionType === 'DETAILED_INSPECTION';
      const isPE2 = s.inspectionType === 'PERFORMANCE_EVAL_2';
      const isPE1 = s.inspectionType === 'PERFORMANCE_EVAL_1';
      if (isDI || isPE2) {
        const qty = Math.ceil(totalL / 300);
        return { upperQty: qty, lowerQty: '-', upperCriteria: '(총연장 ÷ 300m)개소', lowerCriteria: '-' };
      }
      const qty = Math.ceil(totalL / 100) * 2;
      return { upperQty: qty, lowerQty: '-', upperCriteria: isPE1 ? '(총연장 ÷ 100m) × 2개소' : '(형식별 연장÷100m)×2개소', lowerCriteria: '-' };
    }},
    { id: 'ultrasonic', name: '초음파전달속도', calculate: (s) => {
      const sections = s.tunnelSections || [];
      const totalL = sections.reduce((acc, sec) => acc + (sec.length || 0), 0);
      const qty = Math.ceil(totalL / 100) * 2;
      return { upperQty: qty, lowerQty: '-', upperCriteria: '(총연장 ÷ 100m) × 2개소', lowerCriteria: '-' };
    }},
    { id: 'rebar_scan', name: '철근탐사', calculate: (s) => {
      const sections = s.tunnelSections || [];
      const reinforcedL = sections.filter(sec => sec.concreteType === 'REINFORCED').reduce((acc, sec) => acc + (sec.length || 0), 0);
      if (reinforcedL === 0) return { upperQty: '-', lowerQty: '-', upperCriteria: '해당없음', lowerCriteria: '-' };
      const isDI = s.inspectionType === 'DETAILED_INSPECTION';
      const isPE2 = s.inspectionType === 'PERFORMANCE_EVAL_2';
      if (isDI || isPE2) return { upperQty: '준용', lowerQty: '-', upperCriteria: '탄산화 깊이 측정 수량 준용', lowerCriteria: '-' };
      const qty = reinforcedL < 1000 ? 4 : 4 + Math.ceil((reinforcedL - 1000) / 500);
      return { upperQty: qty, lowerQty: '-', upperCriteria: '1,000m 미만: 4개소\n1,000m 이상: 최소 4개소 + 500m당 1개소 추가', lowerCriteria: '-' };
    }},
    { id: 'chloride', name: '염화물 함유량', calculate: (s) => {
      const sections = s.tunnelSections || [];
      const reinforcedL = sections.filter(sec => sec.concreteType === 'REINFORCED').reduce((acc, sec) => acc + (sec.length || 0), 0);
      if (reinforcedL === 0) return { upperQty: '-', lowerQty: '-', upperCriteria: '해당없음', lowerCriteria: '-' };
      const isPE1 = s.inspectionType === 'PERFORMANCE_EVAL_1';
      const qty = reinforcedL < 1000 ? (isPE1 ? 4 : 2) : (isPE1 ? 4 + Math.ceil((reinforcedL - 1000) / 500) : 2 + Math.floor(reinforcedL / 1000));
      return { upperQty: qty, lowerQty: '-', upperCriteria: '연장 및 점검종류별 기준 상이', lowerCriteria: '-' };
    }},
    { id: 'carbonation', name: '탄산화 깊이', calculate: (s) => {
      const sections = s.tunnelSections || [];
      const reinforcedL = sections.filter(sec => sec.concreteType === 'REINFORCED').reduce((acc, sec) => acc + (sec.length || 0), 0);
      if (reinforcedL === 0) return { upperQty: '-', lowerQty: '-', upperCriteria: '해당없음', lowerCriteria: '-' };
      const isD = s.inspectionType === 'DETAILED_DIAGNOSIS' || s.inspectionType === 'PERFORMANCE_EVAL_1';
      const divisor = isD ? 500 : 1000;
      const base = isD ? 4 : 2;
      const qty = reinforcedL < 1000 ? base : base + Math.ceil((reinforcedL - 1000) / divisor);
      return { upperQty: qty, lowerQty: '-', upperCriteria: `최소 ${base}개소 + ${divisor}m당 1개소 추가`, lowerCriteria: '-' };
    }},
    { id: 'rebar_corrosion', name: '철근부식도', calculate: () => ({ upperQty: '판단', lowerQty: '-', upperCriteria: '책임기술자 판단', lowerCriteria: '-' })},
    { id: 'crack_depth', name: '균열깊이 조사', calculate: () => ({ upperQty: '판단', lowerQty: '-', upperCriteria: '책임기술자 판단', lowerCriteria: '-' })},
    { id: 'luminance', name: '휘도 측정', calculate: () => ({ upperQty: 10, lowerQty: '-', upperCriteria: '총 10개소', lowerCriteria: '-' })},
    { id: 'illuminance', name: '조도 측정', calculate: () => ({ upperQty: 10, lowerQty: '-', upperCriteria: '총 10개소', lowerCriteria: '-' })}
  ],
  RETAINING_WALL: [
    { id: 'survey_section', name: '측정분할', calculate: () => ({ upperQty: '실시', lowerQty: '-', upperCriteria: '20m 간격, 신축이음부', lowerCriteria: '-' })},
    { id: 'survey', name: '측량', calculate: () => ({ upperQty: '실시', lowerQty: '-', upperCriteria: '옹벽의 선형측량 및 수준측량', lowerCriteria: '-' })},
    { id: 'rebound', name: '반발경도시험', calculate: (s) => {
      const sections = s.retainingWallSections || [];
      if (sections.every(sec => sec.type === 'STONE')) return { upperQty: '-', lowerQty: '-', upperCriteria: '해당없음', lowerCriteria: '-' };
      const totalL = sections.reduce((acc, sec) => acc + (sec.length || 0), 0);
      const isD = s.inspectionType === 'DETAILED_DIAGNOSIS' || s.inspectionType === 'PERFORMANCE_EVAL_1';
      const qty = isD ? Math.ceil(totalL / (s.evalUnit || 20)) : Math.ceil(totalL / 50);
      return { upperQty: qty, lowerQty: '-', upperCriteria: isD ? `평가단위(${(s.evalUnit || 20)}m)당 1개소` : '(총 연장 ÷ 50m)개소', lowerCriteria: '-' };
    }},
    { id: 'carbonation', name: '탄산화 깊이', calculate: (s) => {
      const sections = s.retainingWallSections || [];
      if (sections.every(sec => sec.type === 'STONE')) return { upperQty: '-', lowerQty: '-', upperCriteria: '해당없음', lowerCriteria: '-' };
      const totalL = sections.reduce((acc, sec) => acc + (sec.length || 0), 0);
      const isD = s.inspectionType === 'DETAILED_DIAGNOSIS' || s.inspectionType === 'PERFORMANCE_EVAL_1';
      const divisor = isD ? 50 : 100;
      const qty = totalL < 100 ? 2 : 2 + Math.ceil((totalL - 100) / divisor);
      return { upperQty: qty, lowerQty: '-', upperCriteria: `100m 미만: 2개소 + ${divisor}m당 1개소 추가`, lowerCriteria: '-' };
    }},
    { id: 'chloride', name: '염화물 함유량', calculate: (s) => {
      const sections = s.retainingWallSections || [];
      if (sections.every(sec => sec.type === 'STONE')) return { upperQty: '-', lowerQty: '-', upperCriteria: '해당없음', lowerCriteria: '-' };
      const totalL = sections.reduce((acc, sec) => acc + (sec.length || 0), 0);
      const isD = s.inspectionType === 'DETAILED_DIAGNOSIS' || s.inspectionType === 'PERFORMANCE_EVAL_1';
      const divisor = isD ? 50 : 100;
      const qty = totalL < 100 ? 2 : 2 + Math.ceil((totalL - 100) / divisor);
      return { upperQty: qty, lowerQty: '-', upperCriteria: `100m 미만: 2개소 + ${divisor}m당 1개소 추가`, lowerCriteria: '-' };
    }},
    { id: 'filling_concrete', name: '충전콘크리트(석축)', calculate: (s) => {
      const sections = s.retainingWallSections || [];
      const stoneL = sections.filter(sec => sec.type === 'STONE').reduce((acc, sec) => acc + (sec.length || 0), 0);
      if (stoneL === 0) return { upperQty: '-', lowerQty: '-', upperCriteria: '해당없음', lowerCriteria: '-' };
      const qty = Math.ceil(stoneL / (s.evalUnit || 20));
      return { upperQty: qty, lowerQty: '-', upperCriteria: `평가단위(${(s.evalUnit || 20)}m)당 1개소`, lowerCriteria: '-' };
    }},
    { id: 'rock_weathering', name: '암반풍화도', calculate: (s) => {
      const sections = s.retainingWallSections || [];
      const stoneL = sections.filter(sec => sec.type === 'STONE').reduce((acc, sec) => acc + (sec.length || 0), 0);
      if (stoneL === 0) return { upperQty: '-', lowerQty: '-', upperCriteria: '해당없음', lowerCriteria: '-' };
      const qty = Math.ceil(stoneL / (s.evalUnit || 20));
      return { upperQty: qty, lowerQty: '-', upperCriteria: `평가단위(${(s.evalUnit || 20)}m)당 1개소`, lowerCriteria: '-' };
    }},
    { id: 'rebar_scan', name: '철근탐사', calculate: (s) => {
      const sections = s.retainingWallSections || [];
      const reinforcedL = sections.filter(sec => sec.type === 'CONCRETE').reduce((acc, sec) => acc + (sec.length || 0), 0);
      if (reinforcedL === 0) return { upperQty: '-', lowerQty: '-', upperCriteria: '해당없음', lowerCriteria: '-' };
      const isD = s.inspectionType === 'DETAILED_DIAGNOSIS' || s.inspectionType === 'PERFORMANCE_EVAL_1';
      const qty = isD ? Math.ceil(reinforcedL / (s.evalUnit || 20)) : Math.ceil(reinforcedL / 50);
      return { upperQty: qty, lowerQty: '-', upperCriteria: isD ? `평가단위(${(s.evalUnit || 20)}m)당 1개소` : '(총 연장 ÷ 50m)개소', lowerCriteria: '-' };
    }},
    { id: 'crack_depth', name: '균열깊이 조사', calculate: (s) => {
      const isDI = s.inspectionType === 'DETAILED_INSPECTION';
      const criteria = isDI ? '부재 중요도 고려' : '평가단위에서 조사된 최대균열폭에 실시';
      return { upperQty: '판단', lowerQty: '-', upperCriteria: criteria, lowerCriteria: '-' };
    }},
    { id: 'deformation_survey', name: '변형 및 변위조사', calculate: (s) => {
      const isDI = s.inspectionType === 'DETAILED_INSPECTION';
      const criteria = isDI ? '과업내용에 의함' : '최소 1개소 이상 설치 및 최소 3개월 이상 측정';
      return { upperQty: '판단', lowerQty: '-', upperCriteria: criteria, lowerCriteria: '-' };
    }},
    { id: 'core_sampling', name: '코어채취', calculate: (s) => {
      const sections = s.retainingWallSections || [];
      const totalL = sections.reduce((acc, sec) => acc + (sec.length || 0), 0);
      const isD = s.inspectionType === 'DETAILED_DIAGNOSIS' || s.inspectionType === 'PERFORMANCE_EVAL_1';
      if (isD) {
        const qty = totalL < 100 ? 2 : 2 + Math.ceil((totalL - 100) / 50);
        return { upperQty: qty, lowerQty: '-', upperCriteria: '100m 미만: 2개소\n100m 이상: 최소 2개소 + 50m당 1개소 추가', lowerCriteria: '-' };
      }
      return { upperQty: '판단', lowerQty: '-', upperCriteria: '책임기술자 판단에 따라 결정', lowerCriteria: '-' };
    }},
    { id: 'ground_survey', name: '지반조사', calculate: () => ({ upperQty: 1, lowerQty: '-', upperCriteria: '대표지반 설정 1단면 이상', lowerCriteria: '-' })},
    { id: 'groundwater', name: '지하수위측정', calculate: () => ({ upperQty: '판단', lowerQty: '-', upperCriteria: '대표지반 설정 1회 이상', lowerCriteria: '-' })},
    { id: 'inclinometer', name: '지중경사계측', calculate: () => ({ upperQty: '판단', lowerQty: '-', upperCriteria: '과업 내용에 의해 조사 및 수량 결정', lowerCriteria: '-' })},
    { id: 'earth_pressure', name: '토압계측', calculate: () => ({ upperQty: '판단', lowerQty: '-', upperCriteria: '과업 내용에 의해 조사 및 수량 결정', lowerCriteria: '-' })},
    { id: 'coating_thickness', name: '도막두께', calculate: (s) => {
      const sections = s.retainingWallSections || [];
      const totalL = sections.reduce((acc, sec) => acc + (sec.length || 0), 0);
      const qty = totalL < 100 ? 1 : 1 + Math.ceil((totalL - 100) / 100);
      return { upperQty: qty, lowerQty: '-', upperCriteria: '100m 미만: 1개소\n100m 이상: 최소 1개소 + 100m당 1개소 추가', lowerCriteria: '-' };
    }}
  ]
};
