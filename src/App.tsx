/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Settings2, 
  Calculator, 
  FileSpreadsheet, 
  RotateCcw, 
  Plus, 
  X, 
  Trash2, 
  Construction, 
  Map, 
  BrickWall,
  Info,
  LayoutDashboard,
  Layers
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  Facility, 
  AppData, 
  StructureType, 
  InspectionType, 
  FacilityClass
} from './types';
import { 
  STRUCTURE_INFO, 
  INSPECTION_INFO, 
  FACILITY_CLASS_INFO, 
  BRIDGE_TYPES 
} from './constants';
import { TEST_RULES, getCategory } from './rules';

const REMARKS_MAP: Record<string, string> = {
  'CONC_STR': '반발경도법 등',
  'CARBON': '페놀프탈레인 용액법 등',
  'REBAR': '전자파법, 전자기유도법 등',
  'CHLORIDE': '전위차적정법 등',
  'STEEL_THICK': '초음파두께측정 등',
  'PAINT_THICK': '도막두께측정 등',
  'UT': '초음파탐상시험 등',
  'MT': '자분탐상시험 등',
  'PT': '침투탐상시험 등',
  'SCOUR': '육안조사 및 장비측정 등',
  'TUNNEL_THICK': '충격반향기법, GPR 등',
  'TUNNEL_BACK': 'GPR 등',
  'RW_STR': '반발경도법 등',
  'RW_CARBON': '페놀프탈레인 용액법 등',
  'RW_REBAR': '전자파법, 전자기유도법 등'
};

const DEFAULT_FACILITY: Facility = {
  id: '1',
  name: '신규 시설물 1',
  selectedType: 'BRIDGE',
  inspectionType: 'DETAILED_DIAGNOSIS',
  facilityClass: 'CLASS_1',
  bridgeSpans: [{ id: '1', type: 'STB (강박스)', spanLength: 30, spanCount: 3, girderCount: 5 }],
  tunnelSections: [{ id: '1', type: '표준단면', length: 500, concreteType: 'REINFORCED' }],
  retainingWallSections: [{ id: '1', type: 'CONCRETE', length: 100 }],
  evalUnit: 20,
  implQtys: {}
};

export default function App() {
  const [appData, setAppData] = useState<AppData>(() => {
    const saved = localStorage.getItem('safety_diag_data_v2');
    if (saved) { try { return JSON.parse(saved); } catch (e) { console.error(e); } }
    return { facilities: [DEFAULT_FACILITY], currentId: '1' };
  });

  useEffect(() => { localStorage.setItem('safety_diag_data_v2', JSON.stringify(appData)); }, [appData]);

  const activeFacility = useMemo(() => appData.facilities.find(f => f.id === appData.currentId) || appData.facilities[0], [appData]);

  const updateFacility = (updates: Partial<Facility>) => {
    setAppData(prev => ({ ...prev, facilities: prev.facilities.map(f => f.id === prev.currentId ? { ...f, ...updates } : f) }));
  };

  const addFacility = () => {
    const newId = Date.now().toString();
    const newFacility: Facility = { ...DEFAULT_FACILITY, id: newId, name: `시설물 ${appData.facilities.length + 1}`, implQtys: {} };
    setAppData(prev => ({ facilities: [...prev.facilities, newFacility], currentId: newId }));
  };

  const deleteFacility = (id: string) => {
    if (appData.facilities.length <= 1) return;
    if (!confirm('삭제하시겠습니까?')) return;
    setAppData(prev => {
      const newFacilities = prev.facilities.filter(f => f.id !== id);
      return { facilities: newFacilities, currentId: prev.currentId === id ? newFacilities[0].id : prev.currentId };
    });
  };

  const resetData = () => { if (confirm('모든 데이터 초기화?')) setAppData({ facilities: [DEFAULT_FACILITY], currentId: '1' }); };

  const updateSection = <T extends keyof Facility>(key: T, id: string, field: string, value: any) => {
    const list = activeFacility[key] as any[];
    const newList = list.map(item => item.id === id ? { ...item, [field]: value } : item);
    updateFacility({ [key]: newList });
  };

  const addSection = (key: keyof Facility) => {
    const id = Date.now().toString();
    let newItem: any;
    if (key === 'bridgeSpans') newItem = { id, type: 'STB (강박스)', spanLength: 30, spanCount: 1, girderCount: 5 };
    if (key === 'tunnelSections') newItem = { id, type: '표준단면', length: 500, concreteType: 'REINFORCED' };
    if (key === 'retainingWallSections') newItem = { id, type: 'CONCRETE', length: 100 };
    updateFacility({ [key]: [...(activeFacility[key] as any[]), newItem] });
  };

  const removeSection = (key: keyof Facility, id: string) => {
    const list = activeFacility[key] as any[];
    if (list.length <= 1) return;
    updateFacility({ [key]: list.filter(item => item.id !== id) });
  };

  const updateImplQty = (ruleId: string, type: 'upper' | 'lower', value: string) => {
    const newImplQtys = { ...activeFacility.implQtys };
    if (!newImplQtys[ruleId]) newImplQtys[ruleId] = {};
    newImplQtys[ruleId][type] = value;
    updateFacility({ implQtys: newImplQtys });
  };

  const downloadExcel = () => {
    const tableData = TEST_RULES[activeFacility.selectedType].map(rule => {
      const res = rule.calculate(activeFacility);
      const valU = activeFacility.implQtys[rule.id]?.upper ?? res.upperQty;
      const valL = activeFacility.implQtys[rule.id]?.lower ?? res.lowerQty;
      return { '시험 항목': rule.name, '비고': REMARKS_MAP[rule.id] || '지침 기준 준수', '수량(기준)': `${res.upperQty}/${res.lowerQty}`, '수량(금회)': `${valU}/${valL}` };
    });
    const worksheet = XLSX.utils.json_to_sheet(tableData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '수량산출');
    XLSX.writeFile(workbook, `${activeFacility.name}_수량산출.xlsx`);
  };

  const totalLength = useMemo(() => {
    if (activeFacility.selectedType === 'BRIDGE') return activeFacility.bridgeSpans.reduce((acc, sp) => acc + (Number(sp.spanLength) || 0) * (Number(sp.spanCount) || 0), 0);
    if (activeFacility.selectedType === 'TUNNEL') return activeFacility.tunnelSections.reduce((acc, sec) => acc + (Number(sec.length) || 0), 0);
    return activeFacility.retainingWallSections.reduce((acc, sec) => acc + (Number(sec.length) || 0), 0);
  }, [activeFacility]);

  const totalSpans = useMemo(() => activeFacility.selectedType === 'BRIDGE' ? activeFacility.bridgeSpans.reduce((acc, sp) => acc + (Number(sp.spanCount) || 0), 0) : 0, [activeFacility]);
  const isBridge = activeFacility.selectedType === 'BRIDGE';
  const getThemeColor = (type: StructureType) => type === 'BRIDGE' ? 'bg-blue-600' : type === 'TUNNEL' ? 'bg-emerald-600' : 'bg-orange-600';
  const getThemeLightColor = (type: StructureType) => type === 'BRIDGE' ? 'bg-blue-50 text-blue-700 border-blue-200' : type === 'TUNNEL' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-orange-50 text-orange-700 border-orange-200';

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8FAFC] text-slate-900 antialiased font-sans overflow-hidden">
      <aside className="w-full md:w-[300px] bg-white border-r border-slate-200 flex flex-col shrink-0 shadow-sm overflow-y-auto no-scrollbar h-screen sticky top-0 z-30 print:hidden">
        <div className={`p-5 text-white ${getThemeColor(activeFacility.selectedType)} transition-colors duration-500`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm"><LayoutDashboard className="w-5 h-5 text-white" /></div>
            <div><h2 className="text-xs font-black uppercase tracking-wider">NDT Safety Calc</h2><p className="text-[9px] font-bold opacity-80">비파괴 검사 수량 산출 프로</p></div>
          </div>
          <button onClick={addFacility} className="w-full py-2.5 bg-white text-slate-900 rounded-xl text-[11px] font-black shadow-lg hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 active:scale-[0.97]"><Plus className="w-3.5 h-3.5" /> 새 시설물 추가하기</button>
        </div>
        <div className="p-4 space-y-6">
          <section>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 px-1 tracking-widest">구조물 형식 변경</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(STRUCTURE_INFO) as [StructureType, any][]).map(([key, info]) => {
                const Icon = { Construction, Map, BrickWall }[info.icon] || Construction;
                const isActive = activeFacility.selectedType === key;
                return (
                  <button key={key} onClick={() => updateFacility({ selectedType: key })} className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all active:scale-95 ${isActive ? `${getThemeColor(key)} text-white shadow-md border-transparent` : 'border-slate-50 bg-white text-slate-400 hover:border-slate-100'}`}>
                    <Icon className={`w-5 h-5 mb-1 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="text-[9px] font-black">{info.name}</span>
                  </button>
                );
              })}
            </div>
          </section>
          <section className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest flex items-center gap-2"><Settings2 className="w-3.5 h-3.5" /> 상세 설정</label>
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase mb-1 ml-0.5">점검 종류</label>
              <select value={activeFacility.inspectionType} onChange={(e) => updateFacility({ inspectionType: e.target.value as InspectionType })} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-2 text-[11px] font-bold outline-none">
                {Object.entries(INSPECTION_INFO).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase mb-1 ml-0.5">시설물 종별</label>
              <select value={activeFacility.facilityClass} onChange={(e) => updateFacility({ facilityClass: e.target.value as FacilityClass })} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-2 text-[11px] font-bold outline-none">
                {Object.entries(FACILITY_CLASS_INFO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </section>
        </div>
      </aside>

      <div className="w-full md:w-[280px] bg-slate-50/50 border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto no-scrollbar h-screen sticky top-0 z-20 print:hidden">
        <div className="p-4 border-b border-slate-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">시설물 목록 배너</label></div>
        <div className="p-2 space-y-2">
          {appData.facilities.map(f => {
            const isActive = appData.currentId === f.id;
            const typeColor = f.selectedType === 'BRIDGE' ? 'bg-blue-600' : f.selectedType === 'TUNNEL' ? 'bg-emerald-600' : 'bg-orange-600';
            return (
              <div key={f.id} onClick={() => setAppData(prev => ({ ...prev, currentId: f.id }))} className={`group relative flex flex-col p-3 rounded-xl border-2 transition-all cursor-pointer ${isActive ? `${typeColor} text-white shadow-md scale-[1.01]` : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                <div className="flex items-center justify-between mb-1">
                  <input type="text" value={f.name} onChange={(e) => { const newName = e.target.value; setAppData(prev => ({ ...prev, facilities: prev.facilities.map(fac => fac.id === f.id ? { ...fac, name: newName } : fac) })); }} onClick={(e) => e.stopPropagation()} className={`bg-transparent border-none text-[12px] font-black outline-none ${isActive ? 'text-white' : 'text-slate-800'}`} />
                  <button onClick={(e) => { e.stopPropagation(); deleteFacility(f.id); }} className="opacity-0 group-hover:opacity-100"><X className="w-4 h-4" /></button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-4 md:p-10 print:p-0">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="bg-white rounded-[32px] border border-slate-200 p-8 md:p-10 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6 w-full">
              <div className={`w-16 h-16 ${getThemeColor(activeFacility.selectedType)} rounded-[22px] flex items-center justify-center text-white shrink-0`}><Calculator className="w-8 h-8" /></div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight truncate">{activeFacility.name}</h1>
                <p className="text-sm text-slate-500 font-bold mt-1">국토안전관리원 세부지침 최신 기준 적용 중</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className={`px-4 py-2 ${getThemeColor(activeFacility.selectedType)} text-white rounded-2xl text-lg font-black whitespace-nowrap`}>{STRUCTURE_INFO[activeFacility.selectedType].name}</div>
                <div className="px-4 py-2 bg-slate-100 text-slate-700 rounded-2xl text-lg font-black whitespace-nowrap">{INSPECTION_INFO[activeFacility.inspectionType].name}</div>
              </div>
            </div>
            <button onClick={downloadExcel} className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-[20px] text-sm font-black hover:bg-green-700 transition-all shadow-lg shrink-0"><FileSpreadsheet className="w-4 h-4" /> 엑셀 다운로드</button>
          </div>
          {/* ... (테이블 등 나머지 코드는 이전과 동일) ... */}
        </div>
      </main>
    </div>
  );
}
