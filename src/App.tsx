/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Settings2, 
  Calculator, 
  Printer, 
  RotateCcw, 
  Plus, 
  X, 
  Trash2, 
  Construction, 
  Map, 
  BrickWall,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Facility, 
  AppData, 
  StructureType, 
  InspectionType, 
  FacilityClass,
  BridgeSpan,
  TunnelSection,
  RetainingWallSection
} from './types';
import { 
  STRUCTURE_INFO, 
  INSPECTION_INFO, 
  FACILITY_CLASS_INFO, 
  BRIDGE_TYPES 
} from './constants';
import { TEST_RULES, getCategory } from './rules';

const DEFAULT_FACILITY: Facility = {
  id: '1',
  name: '기본 시설물 1',
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
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved data', e);
      }
    }
    return {
      facilities: [DEFAULT_FACILITY],
      currentId: '1'
    };
  });

  useEffect(() => {
    localStorage.setItem('safety_diag_data_v2', JSON.stringify(appData));
  }, [appData]);

  const activeFacility = useMemo(() => {
    return appData.facilities.find(f => f.id === appData.currentId) || appData.facilities[0];
  }, [appData]);

  const updateFacility = (updates: Partial<Facility>) => {
    setAppData(prev => ({
      ...prev,
      facilities: prev.facilities.map(f => 
        f.id === prev.currentId ? { ...f, ...updates } : f
      )
    }));
  };

  const addFacility = () => {
    const newId = Date.now().toString();
    const newFacility: Facility = {
      ...DEFAULT_FACILITY,
      id: newId,
      name: `신규 시설물 ${appData.facilities.length + 1}`,
      implQtys: {}
    };
    setAppData(prev => ({
      facilities: [...prev.facilities, newFacility],
      currentId: newId
    }));
  };

  const deleteFacility = (id: string) => {
    if (appData.facilities.length <= 1) return;
    setAppData(prev => {
      const newFacilities = prev.facilities.filter(f => f.id !== id);
      return {
        facilities: newFacilities,
        currentId: prev.currentId === id ? newFacilities[0].id : prev.currentId
      };
    });
  };

  const resetData = () => {
    if (confirm('모든 데이터가 초기화됩니다. 계속하시겠습니까?')) {
      setAppData({
        facilities: [DEFAULT_FACILITY],
        currentId: '1'
      });
    }
  };

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

  const totalLength = useMemo(() => {
    if (activeFacility.selectedType === 'BRIDGE') {
      return activeFacility.bridgeSpans.reduce((acc, sp) => acc + (Number(sp.spanLength) || 0) * (Number(sp.spanCount) || 0), 0);
    }
    if (activeFacility.selectedType === 'TUNNEL') {
      return activeFacility.tunnelSections.reduce((acc, sec) => acc + (Number(sec.length) || 0), 0);
    }
    return activeFacility.retainingWallSections.reduce((acc, sec) => acc + (Number(sec.length) || 0), 0);
  }, [activeFacility]);

  const totalSpans = useMemo(() => {
    if (activeFacility.selectedType === 'BRIDGE') {
      return activeFacility.bridgeSpans.reduce((acc, sp) => acc + (Number(sp.spanCount) || 0), 0);
    }
    return 0;
  }, [activeFacility]);

  const isBridge = activeFacility.selectedType === 'BRIDGE';

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-900 antialiased font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 shadow-sm overflow-y-auto no-scrollbar h-screen sticky top-0 z-20 print:hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-indigo-600 p-1.5 rounded-lg shadow-md shadow-indigo-100">
              <Settings2 className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">시설물 설정</h2>
          </div>
          <p className="text-[9px] text-slate-500 font-bold">제원 및 점검 종류를 선택하세요</p>
        </div>

        {/* Facility List Section */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">시설물 목록</label>
            <button 
              onClick={addFacility}
              className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> 추가
            </button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
            {appData.facilities.map(f => (
              <div 
                key={f.id}
                onClick={() => setAppData(prev => ({ ...prev, currentId: f.id }))}
                className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${appData.currentId === f.id ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100 hover:border-slate-200'}`}
              >
                <input 
                  type="text" 
                  value={f.name} 
                  onChange={(e) => {
                    const newName = e.target.value;
                    setAppData(prev => ({
                      ...prev,
                      facilities: prev.facilities.map(fac => fac.id === f.id ? { ...fac, name: newName } : fac)
                    }));
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-transparent border-none text-[11px] font-bold text-slate-700 focus:ring-0 p-0 w-full outline-none"
                />
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteFacility(f.id); }}
                  className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all ml-2"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 space-y-6">
          <section>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">01. 시설물 종류</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(STRUCTURE_INFO) as [StructureType, any][]).map(([key, info]) => {
                const Icon = { Construction, Map, BrickWall }[info.icon] || Construction;
                return (
                  <button 
                    key={key}
                    onClick={() => updateFacility({ selectedType: key })}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all active:scale-95 ${activeFacility.selectedType === key ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-lg shadow-indigo-100' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'}`}
                  >
                    <Icon className="w-5 h-5 mb-1.5" />
                    <span className="text-[10px] font-black">{info.name}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">02. 기본 설정</label>
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase mb-1 ml-0.5">점검 종류</label>
              <select 
                value={activeFacility.inspectionType}
                onChange={(e) => updateFacility({ inspectionType: e.target.value as InspectionType })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              >
                {Object.entries(INSPECTION_INFO).map(([k, v]) => (
                  <option key={k} value={k}>{v.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase mb-1 ml-0.5">시설물 종별</label>
              <select 
                value={activeFacility.facilityClass}
                onChange={(e) => updateFacility({ facilityClass: e.target.value as FacilityClass })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              >
                {Object.entries(FACILITY_CLASS_INFO).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </section>

          <section className="pt-4 border-t border-slate-100">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">03. 세부 제원 입력</label>
            <div className="space-y-4">
              {activeFacility.selectedType === 'BRIDGE' && (
                <>
                  <div className="p-3 bg-indigo-600 rounded-2xl text-white mb-4 shadow-lg shadow-indigo-100">
                    <div className="flex justify-between items-center px-1">
                      <div><p className="text-[8px] font-black opacity-70 uppercase">Total Length</p><p className="text-lg font-black">{totalLength.toLocaleString()}m</p></div>
                      <div className="text-right"><p className="text-[8px] font-black opacity-70 uppercase">Total Spans</p><p className="text-lg font-black">{totalSpans}경간</p></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {activeFacility.bridgeSpans.map((span, i) => (
                      <div key={span.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 relative">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded uppercase">Span Group #{i+1}</span>
                          <button onClick={() => removeSection('bridgeSpans', span.id)} className="text-slate-300 hover:text-red-500">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <select 
                          value={span.type}
                          onChange={(e) => updateSection('bridgeSpans', span.id, 'type', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-[11px] font-bold outline-none"
                        >
                          {BRIDGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="relative">
                            <input 
                              type="number" 
                              value={span.spanLength} 
                              onChange={(e) => updateSection('bridgeSpans', span.id, 'spanLength', parseFloat(e.target.value) || 0)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-[11px] font-bold outline-none"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] text-slate-400 font-bold">m</span>
                          </div>
                          <div className="relative">
                            <input 
                              type="number" 
                              value={span.spanCount} 
                              onChange={(e) => updateSection('bridgeSpans', span.id, 'spanCount', parseInt(e.target.value) || 0)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-[11px] font-bold outline-none"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] text-slate-400 font-bold">경간</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => addSection('bridgeSpans')} className="w-full py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black border border-indigo-100 hover:bg-indigo-100 transition-all">+ 경간 그룹 추가</button>
                  </div>
                </>
              )}

              {activeFacility.selectedType === 'TUNNEL' && (
                <>
                  <div className="p-3 bg-emerald-600 rounded-2xl text-white mb-4 shadow-lg shadow-emerald-100">
                    <div className="flex justify-between items-center px-1">
                      <div><p className="text-[8px] font-black opacity-70 uppercase">Total Length</p><p className="text-lg font-black">{totalLength.toLocaleString()}m</p></div>
                      <div className="text-right"><p className="text-[8px] font-black opacity-70 uppercase">Sections</p><p className="text-lg font-black">{activeFacility.tunnelSections.length}개</p></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {activeFacility.tunnelSections.map((sec, i) => (
                      <div key={sec.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 relative">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded uppercase">Section #{i+1}</span>
                          <button onClick={() => removeSection('tunnelSections', sec.id)} className="text-slate-300 hover:text-red-500">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => updateSection('tunnelSections', sec.id, 'concreteType', 'REINFORCED')}
                            className={`flex-1 py-1.5 rounded-lg border text-[9px] font-black transition-all ${sec.concreteType === 'REINFORCED' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-400 border-slate-100'}`}
                          >
                            철근
                          </button>
                          <button 
                            onClick={() => updateSection('tunnelSections', sec.id, 'concreteType', 'PLAIN')}
                            className={`flex-1 py-1.5 rounded-lg border text-[9px] font-black transition-all ${sec.concreteType === 'PLAIN' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-400 border-slate-100'}`}
                          >
                            무근
                          </button>
                        </div>
                        <div className="relative">
                          <input 
                            type="number" 
                            value={sec.length} 
                            onChange={(e) => updateSection('tunnelSections', sec.id, 'length', parseFloat(e.target.value) || 0)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-[11px] font-bold outline-none"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] text-slate-400 font-bold">m</span>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => addSection('tunnelSections')} className="w-full py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black border border-emerald-100 hover:bg-emerald-100 transition-all">+ 섹션 추가</button>
                  </div>
                </>
              )}

              {activeFacility.selectedType === 'RETAINING_WALL' && (
                <>
                  <div className="p-3 bg-orange-600 rounded-2xl text-white mb-4 shadow-lg shadow-orange-100">
                    <div className="flex justify-between items-center px-1">
                      <div><p className="text-[8px] font-black opacity-70 uppercase">Total Length</p><p className="text-lg font-black">{totalLength.toLocaleString()}m</p></div>
                      <div className="text-right"><p className="text-[8px] font-black opacity-70 uppercase">Sections</p><p className="text-lg font-black">{activeFacility.retainingWallSections.length}개</p></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {activeFacility.retainingWallSections.map((sec, i) => (
                      <div key={sec.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 relative">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black text-orange-600 bg-orange-100 px-2 py-0.5 rounded uppercase">Section #{i+1}</span>
                          <button onClick={() => removeSection('retainingWallSections', sec.id)} className="text-slate-300 hover:text-red-500">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          {(['CONCRETE', 'REINFORCED_SOIL', 'STONE'] as const).map(type => (
                            <button 
                              key={type}
                              onClick={() => updateSection('retainingWallSections', sec.id, 'type', type)}
                              className={`py-1.5 rounded-lg border text-[8px] font-black transition-all ${sec.type === type ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-slate-400 border-slate-100'}`}
                            >
                              {type === 'CONCRETE' ? '콘크리트' : type === 'REINFORCED_SOIL' ? '보강토' : '석축'}
                            </button>
                          ))}
                        </div>
                        <div className="relative">
                          <input 
                            type="number" 
                            value={sec.length} 
                            onChange={(e) => updateSection('retainingWallSections', sec.id, 'length', parseFloat(e.target.value) || 0)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-[11px] font-bold outline-none"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] text-slate-400 font-bold">m</span>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => addSection('retainingWallSections')} className="w-full py-2 bg-orange-50 text-orange-600 rounded-xl text-[10px] font-black border border-orange-100 hover:bg-orange-100 transition-all">+ 섹션 추가</button>
                    <div className="pt-2 border-t border-slate-100">
                      <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">평가단위 (m)</label>
                      <input 
                        type="number" 
                        value={activeFacility.evalUnit} 
                        onChange={(e) => updateFacility({ evalUnit: parseFloat(e.target.value) || 20 })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold outline-none"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
        
        <div className="mt-auto p-5 border-t border-slate-100">
          <button onClick={resetData} className="w-full py-2 text-[10px] font-black text-slate-400 hover:text-red-500 transition-all flex items-center justify-center gap-1.5">
            <RotateCcw className="w-3 h-3" /> 데이터 초기화
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 print:p-0">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden print:border-none print:shadow-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-32 -mt-32 opacity-40 print:hidden"></div>
            <div className="flex items-center gap-5 relative z-10 w-full">
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100 text-white shrink-0">
                <Calculator className="w-7 h-7" />
              </div>
              <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">{activeFacility.name}</h1>
                  <p className="text-xs text-slate-500 font-bold mt-1">국토안전관리원 세부지침 최신 기준 적용</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md text-[10px] font-black">
                    {STRUCTURE_INFO[activeFacility.selectedType].name}
                  </span>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-black">
                    {INSPECTION_INFO[activeFacility.inspectionType].name}
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => window.print()} 
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-black transition-all shadow-lg relative z-10 shrink-0 print:hidden"
            >
              <Printer className="w-3.5 h-3.5" /> 인쇄 / PDF
            </button>
          </div>

          {/* Results Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden print:border-slate-300 print:shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left min-w-[900px] table-fixed">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th rowSpan={2} className="p-3 border-r border-slate-200 font-black text-slate-700 text-[10px] w-[140px] text-center">시험 항목</th>
                    <th colSpan={2} className="p-3 border-r border-slate-200 font-black text-slate-700 text-[10px] text-center">세부지침 기준</th>
                    <th colSpan={2} className="p-3 border-r border-slate-200 font-black text-indigo-600 text-[10px] text-center">수량 산출 (기준 / 금회)</th>
                    <th rowSpan={2} className="p-3 font-black text-slate-700 text-[10px] w-[120px] text-center">비 고</th>
                  </tr>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {isBridge ? (
                      <>
                        <th className="p-2 border-r border-slate-200 font-bold text-slate-500 text-[10px] text-center">상부구조</th>
                        <th className="p-2 border-r border-slate-200 font-bold text-slate-500 text-[10px] text-center">하부구조</th>
                        <th className="p-2 border-r border-slate-200 font-bold text-indigo-600 text-[10px] text-center">상부 (기준/금회)</th>
                        <th className="p-2 border-r border-slate-200 font-bold text-indigo-600 text-[10px] text-center">하부 (기준/금회)</th>
                      </>
                    ) : (
                      <>
                        <th colSpan={2} className="p-2 border-r border-slate-200 font-bold text-slate-500 text-[10px] text-center">산정 기준</th>
                        <th colSpan={2} className="p-2 border-r border-slate-200 font-bold text-indigo-600 text-[10px] text-center">수량 산출 (기준 / 금회)</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Basic Tasks */}
                  <tr className="bg-slate-50/80">
                    <td colSpan={isBridge ? 6 : 4} className="p-2.5 px-4 text-[10px] font-black text-slate-500 flex items-center gap-2">
                      <ChevronRight className="w-3 h-3" /> 필수 과업
                    </td>
                  </tr>
                  {TEST_RULES[activeFacility.selectedType].filter(r => getCategory(r.id, activeFacility) === 'BASIC').map(rule => {
                    const res = rule.calculate(activeFacility);
                    const valU = activeFacility.implQtys[rule.id]?.upper ?? res.upperQty;
                    const valL = activeFacility.implQtys[rule.id]?.lower ?? res.lowerQty;
                    return (
                      <tr key={rule.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 border-r border-slate-200 font-bold text-slate-900 text-[10px] text-center">{rule.name}</td>
                        {isBridge ? (
                          <>
                            <td className="p-2 border-r border-slate-200 text-[9px] text-slate-500 text-center whitespace-pre-line">{res.upperCriteria || '-'}</td>
                            <td className="p-2 border-r border-slate-200 text-[9px] text-slate-500 text-center whitespace-pre-line">{res.lowerCriteria || '-'}</td>
                            <td className="p-2 border-r border-slate-200 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <span className="text-slate-900 font-normal text-[11px]">{res.upperQty}</span>
                                <span className="text-slate-300 text-[10px]">/</span>
                                <input 
                                  type="text" 
                                  value={valU} 
                                  onChange={(e) => updateImplQty(rule.id, 'upper', e.target.value)}
                                  className="w-12 bg-blue-50 border border-blue-100 rounded text-center text-[10px] font-bold text-blue-600 outline-none print:bg-transparent print:border-none"
                                />
                              </div>
                            </td>
                            <td className="p-2 border-r border-slate-200 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <span className="text-slate-900 font-normal text-[11px]">{res.lowerQty}</span>
                                <span className="text-slate-300 text-[10px]">/</span>
                                <input 
                                  type="text" 
                                  value={valL} 
                                  onChange={(e) => updateImplQty(rule.id, 'lower', e.target.value)}
                                  className="w-12 bg-blue-50 border border-blue-100 rounded text-center text-[10px] font-bold text-blue-600 outline-none print:bg-transparent print:border-none"
                                />
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td colSpan={2} className="p-2 border-r border-slate-200 text-[9px] text-slate-500 text-center whitespace-pre-line">{res.upperCriteria || '-'}</td>
                            <td colSpan={2} className="p-2 border-r border-slate-200 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <span className="text-slate-900 font-normal text-[11px]">{res.upperQty}</span>
                                <span className="text-slate-300 text-[10px]">/</span>
                                <input 
                                  type="text" 
                                  value={valU} 
                                  onChange={(e) => updateImplQty(rule.id, 'upper', e.target.value)}
                                  className="w-12 bg-blue-50 border border-blue-100 rounded text-center text-[10px] font-bold text-blue-600 outline-none print:bg-transparent print:border-none"
                                />
                              </div>
                            </td>
                          </>
                        )}
                        <td className="p-2 text-[9px] text-slate-400 text-center italic">지침 기준 준수</td>
                      </tr>
                    );
                  })}

                  {/* Optional Tasks */}
                  <tr className="bg-slate-50/80">
                    <td colSpan={isBridge ? 6 : 4} className="p-2.5 px-4 text-[10px] font-black text-slate-500 flex items-center gap-2">
                      <Info className="w-3 h-3" /> 선택 과업 (판단 필요)
                    </td>
                  </tr>
                  {TEST_RULES[activeFacility.selectedType].filter(r => getCategory(r.id, activeFacility) === 'OPTIONAL').map(rule => {
                    const res = rule.calculate(activeFacility);
                    const valU = activeFacility.implQtys[rule.id]?.upper ?? res.upperQty;
                    const valL = activeFacility.implQtys[rule.id]?.lower ?? res.lowerQty;
                    return (
                      <tr key={rule.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 border-r border-slate-200 font-bold text-slate-900 text-[10px] text-center">{rule.name}</td>
                        {isBridge ? (
                          <>
                            <td className="p-2 border-r border-slate-200 text-[9px] text-slate-500 text-center whitespace-pre-line">{res.upperCriteria || '-'}</td>
                            <td className="p-2 border-r border-slate-200 text-[9px] text-slate-500 text-center whitespace-pre-line">{res.lowerCriteria || '-'}</td>
                            <td className="p-2 border-r border-slate-200 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <span className="text-slate-900 font-normal text-[11px]">{res.upperQty}</span>
                                <span className="text-slate-300 text-[10px]">/</span>
                                <input 
                                  type="text" 
                                  value={valU} 
                                  onChange={(e) => updateImplQty(rule.id, 'upper', e.target.value)}
                                  className="w-12 bg-slate-50 border border-slate-100 rounded text-center text-[10px] font-bold text-slate-400 outline-none print:bg-transparent print:border-none"
                                />
                              </div>
                            </td>
                            <td className="p-2 border-r border-slate-200 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <span className="text-slate-900 font-normal text-[11px]">{res.lowerQty}</span>
                                <span className="text-slate-300 text-[10px]">/</span>
                                <input 
                                  type="text" 
                                  value={valL} 
                                  onChange={(e) => updateImplQty(rule.id, 'lower', e.target.value)}
                                  className="w-12 bg-slate-50 border border-slate-100 rounded text-center text-[10px] font-bold text-slate-400 outline-none print:bg-transparent print:border-none"
                                />
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td colSpan={2} className="p-2 border-r border-slate-200 text-[9px] text-slate-500 text-center whitespace-pre-line">{res.upperCriteria || '-'}</td>
                            <td colSpan={2} className="p-2 border-r border-slate-200 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <span className="text-slate-900 font-normal text-[11px]">{res.upperQty}</span>
                                <span className="text-slate-300 text-[10px]">/</span>
                                <input 
                                  type="text" 
                                  value={valU} 
                                  onChange={(e) => updateImplQty(rule.id, 'upper', e.target.value)}
                                  className="w-12 bg-slate-50 border border-slate-100 rounded text-center text-[10px] font-bold text-slate-400 outline-none print:bg-transparent print:border-none"
                                />
                              </div>
                            </td>
                          </>
                        )}
                        <td className="p-2 text-[9px] text-slate-400 text-center italic">현장 여건 고려</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Info */}
          <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100 flex items-start gap-3 print:hidden">
            <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-indigo-700 leading-relaxed font-medium">
              <p className="font-bold mb-1 underline">산출 근거 및 유의사항</p>
              <ul className="list-disc ml-4 space-y-1">
                <li>교량 연장(L)에 따른 보정계수(r)가 자동으로 적용되었습니다.</li>
                <li>터널의 경우 철근/무근 콘크리트 형식에 따라 시험 항목이 필터링됩니다.</li>
                <li>옹벽은 평가단위(기본 20m)를 기준으로 산정되며, 석축의 경우 암반풍화도 등이 포함됩니다.</li>
                <li>금회 수량은 기준 수량을 바탕으로 자동 입력되며, 현장 여건에 맞춰 수정 가능합니다.</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
