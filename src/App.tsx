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
  Info,
  LayoutDashboard,
  Layers
} from 'lucide-react';
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
      name: `시설물 ${appData.facilities.length + 1}`,
      implQtys: {}
    };
    setAppData(prev => ({
      facilities: [...prev.facilities, newFacility],
      currentId: newId
    }));
  };

  const deleteFacility = (id: string) => {
    if (appData.facilities.length <= 1) return;
    if (!confirm('이 시설물 데이터를 삭제하시겠습니까?')) return;
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

  // Helper for conditional colors
  const getThemeColor = (type: StructureType) => {
    if (type === 'BRIDGE') return 'bg-blue-600';
    if (type === 'TUNNEL') return 'bg-emerald-600';
    return 'bg-orange-600';
  };

  const getThemeLightColor = (type: StructureType) => {
    if (type === 'BRIDGE') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (type === 'TUNNEL') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    return 'bg-orange-50 text-orange-700 border-orange-200';
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8FAFC] text-slate-900 antialiased font-sans">
      {/* Left Selection Banner (Sidebar) */}
      <aside className="w-full md:w-[360px] bg-white border-r border-slate-200 flex flex-col shrink-0 shadow-2xl overflow-y-auto no-scrollbar h-screen sticky top-0 z-20 print:hidden">
        {/* Banner Header */}
        <div className={`p-6 text-white ${getThemeColor(activeFacility.selectedType)} transition-colors duration-500`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider">NDT Safety Calc</h2>
              <p className="text-[10px] font-bold opacity-80">비파괴 검사 수량 산출 프로</p>
            </div>
          </div>
          
          <button 
            onClick={addFacility}
            className="w-full py-3.5 bg-white text-slate-900 rounded-2xl text-xs font-black shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 active:scale-[0.97]"
          >
            <Plus className="w-4 h-4" /> 새 시설물 추가하기
          </button>
        </div>

        {/* Facility Selection Banner List */}
        <div className="p-5 space-y-5">
          <section>
            <div className="flex items-center gap-2 px-2 mb-4">
              <Layers className="w-4 h-4 text-slate-400" />
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">시설물 목록 배너</label>
            </div>
            
            <div className="space-y-3">
              {appData.facilities.map(f => {
                const isActive = appData.currentId === f.id;
                const typeColor = f.selectedType === 'BRIDGE' ? 'bg-blue-600' : f.selectedType === 'TUNNEL' ? 'bg-emerald-600' : 'bg-orange-600';
                const typeLight = f.selectedType === 'BRIDGE' ? 'bg-blue-50' : f.selectedType === 'TUNNEL' ? 'bg-emerald-50' : 'bg-orange-50';
                
                return (
                  <div 
                    key={f.id}
                    onClick={() => setAppData(prev => ({ ...prev, currentId: f.id }))}
                    className={`group relative flex flex-col p-5 rounded-[24px] border-2 transition-all cursor-pointer overflow-hidden ${
                      isActive 
                      ? `${typeColor} text-white shadow-xl scale-[1.02]` 
                      : `border-slate-100 bg-white hover:border-slate-200`
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
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
                        className={`bg-transparent border-none text-[15px] font-black focus:ring-0 p-0 w-full outline-none ${isActive ? 'text-white' : 'text-slate-800'}`}
                      />
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteFacility(f.id); }}
                        className={`opacity-0 group-hover:opacity-100 transition-all ml-2 ${isActive ? 'text-white/60 hover:text-white' : 'text-slate-300 hover:text-red-500'}`}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
                        isActive ? 'bg-white/20 text-white' : `${typeLight} ${f.selectedType === 'BRIDGE' ? 'text-blue-700' : f.selectedType === 'TUNNEL' ? 'text-emerald-700' : 'text-orange-700'}`
                      }`}>
                        {STRUCTURE_INFO[f.selectedType].name}
                      </span>
                      <span className={`text-[10px] font-bold ${isActive ? 'text-white/70' : 'text-slate-400'}`}>
                        {INSPECTION_INFO[f.inspectionType].name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="h-px bg-slate-100 mx-2" />

          {/* Structure Type Banner */}
          <section>
            <label className="block text-[11px] font-black text-slate-400 uppercase mb-4 px-2 tracking-widest">구조물 형식 변경</label>
            <div className="grid grid-cols-3 gap-2.5">
              {(Object.entries(STRUCTURE_INFO) as [StructureType, any][]).map(([key, info]) => {
                const Icon = { Construction, Map, BrickWall }[info.icon] || Construction;
                const isActive = activeFacility.selectedType === key;
                const activeColor = key === 'BRIDGE' ? 'bg-blue-600' : key === 'TUNNEL' ? 'bg-emerald-600' : 'bg-orange-600';
                
                return (
                  <button 
                    key={key}
                    onClick={() => updateFacility({ selectedType: key })}
                    className={`flex flex-col items-center justify-center p-4 rounded-[20px] border-2 transition-all active:scale-95 ${
                      isActive 
                      ? `${activeColor} text-white shadow-lg border-transparent` 
                      : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mb-2 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="text-[11px] font-black">{info.name}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Settings Banner */}
          <section className="space-y-4 bg-slate-50 p-5 rounded-[24px] border border-slate-100">
            <label className="block text-[11px] font-black text-slate-500 uppercase mb-2 tracking-widest flex items-center gap-2">
              <Settings2 className="w-4 h-4" /> 상세 설정
            </label>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-0.5">점검 종류</label>
              <select 
                value={activeFacility.inspectionType}
                onChange={(e) => updateFacility({ inspectionType: e.target.value as InspectionType })}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              >
                {Object.entries(INSPECTION_INFO).map(([k, v]) => (
                  <option key={k} value={k}>{v.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-0.5">시설물 종별</label>
              <select 
                value={activeFacility.facilityClass}
                onChange={(e) => updateFacility({ facilityClass: e.target.value as FacilityClass })}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              >
                {Object.entries(FACILITY_CLASS_INFO).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </section>

          {/* Specs Input Banner */}
          <section className="pt-2">
            <label className="block text-[11px] font-black text-slate-400 uppercase mb-4 px-2 tracking-widest">세부 제원 입력</label>
            <div className="space-y-4">
              {activeFacility.selectedType === 'BRIDGE' && (
                <div className="space-y-3">
                  {activeFacility.bridgeSpans.map((span, i) => (
                    <div key={span.id} className="p-5 bg-white border border-slate-200 rounded-[24px] space-y-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg uppercase">Span Group #{i+1}</span>
                        <button onClick={() => removeSection('bridgeSpans', span.id)} className="text-slate-300 hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <select 
                        value={span.type}
                        onChange={(e) => updateSection('bridgeSpans', span.id, 'type', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-[12px] font-bold outline-none"
                      >
                        {BRIDGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                          <input 
                            type="number" 
                            value={span.spanLength} 
                            onChange={(e) => updateSection('bridgeSpans', span.id, 'spanLength', parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-[12px] font-bold outline-none"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-bold">m</span>
                        </div>
                        <div className="relative">
                          <input 
                            type="number" 
                            value={span.spanCount} 
                            onChange={(e) => updateSection('bridgeSpans', span.id, 'spanCount', parseInt(e.target.value) || 0)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-[12px] font-bold outline-none"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-bold">경간</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => addSection('bridgeSpans')} className="w-full py-3 bg-blue-50 text-blue-600 rounded-2xl text-[11px] font-black border border-blue-100 hover:bg-blue-100 transition-all">+ 경간 그룹 추가</button>
                </div>
              )}

              {activeFacility.selectedType === 'TUNNEL' && (
                <div className="space-y-3">
                  {activeFacility.tunnelSections.map((sec, i) => (
                    <div key={sec.id} className="p-5 bg-white border border-slate-200 rounded-[24px] space-y-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg uppercase">Section #{i+1}</span>
                        <button onClick={() => removeSection('tunnelSections', sec.id)} className="text-slate-300 hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => updateSection('tunnelSections', sec.id, 'concreteType', 'REINFORCED')}
                          className={`flex-1 py-2 rounded-xl border text-[10px] font-black transition-all ${sec.concreteType === 'REINFORCED' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
                        >
                          철근
                        </button>
                        <button 
                          onClick={() => updateSection('tunnelSections', sec.id, 'concreteType', 'PLAIN')}
                          className={`flex-1 py-2 rounded-xl border text-[10px] font-black transition-all ${sec.concreteType === 'PLAIN' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
                        >
                          무근
                        </button>
                      </div>
                      <div className="relative">
                        <input 
                          type="number" 
                          value={sec.length} 
                          onChange={(e) => updateSection('tunnelSections', sec.id, 'length', parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-[12px] font-bold outline-none"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-bold">m</span>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => addSection('tunnelSections')} className="w-full py-3 bg-emerald-50 text-emerald-600 rounded-2xl text-[11px] font-black border border-emerald-100 hover:bg-emerald-100 transition-all">+ 섹션 추가</button>
                </div>
              )}

              {activeFacility.selectedType === 'RETAINING_WALL' && (
                <div className="space-y-3">
                  {activeFacility.retainingWallSections.map((sec, i) => (
                    <div key={sec.id} className="p-5 bg-white border border-slate-200 rounded-[24px] space-y-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg uppercase">Section #{i+1}</span>
                        <button onClick={() => removeSection('retainingWallSections', sec.id)} className="text-slate-300 hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(['CONCRETE', 'REINFORCED_SOIL', 'STONE'] as const).map(type => (
                          <button 
                            key={type}
                            onClick={() => updateSection('retainingWallSections', sec.id, 'type', type)}
                            className={`py-2 rounded-xl border text-[9px] font-black transition-all ${sec.type === type ? 'bg-orange-600 text-white border-orange-600' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
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
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-[12px] font-bold outline-none"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-bold">m</span>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => addSection('retainingWallSections')} className="w-full py-3 bg-orange-50 text-orange-600 rounded-2xl text-[11px] font-black border border-orange-100 hover:bg-orange-100 transition-all">+ 섹션 추가</button>
                </div>
              )}
            </div>
          </section>
        </div>
        
        <div className="mt-auto p-6 border-t border-slate-100 bg-slate-50/50">
          <button onClick={resetData} className="w-full py-2.5 text-[11px] font-black text-slate-400 hover:text-red-500 transition-all flex items-center justify-center gap-2">
            <RotateCcw className="w-4 h-4" /> 모든 데이터 초기화
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-12 print:p-0">
        <div className="max-w-5xl mx-auto space-y-10">
          {/* Header Card */}
          <div className="bg-white rounded-[40px] border border-slate-200 p-8 md:p-12 shadow-2xl shadow-slate-200/60 flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden print:border-none print:shadow-none">
            <div className={`absolute top-0 right-0 w-96 h-96 ${getThemeColor(activeFacility.selectedType)} rounded-full -mr-48 -mt-48 opacity-5 print:hidden`}></div>
            <div className="flex items-center gap-8 relative z-10 w-full">
              <div className={`w-20 h-20 ${getThemeColor(activeFacility.selectedType)} rounded-[28px] flex items-center justify-center shadow-2xl text-white shrink-0 transition-colors duration-500`}>
                <Calculator className="w-10 h-10" />
              </div>
              <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">{activeFacility.name}</h1>
                  <p className="text-base text-slate-500 font-bold mt-2 flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
                    국토안전관리원 세부지침 최신 기준 적용 중
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {/* Structure Type Badge - Enlarged & Colored */}
                  <div className={`px-6 py-3 ${getThemeColor(activeFacility.selectedType)} text-white rounded-[20px] text-xl font-black shadow-lg transition-colors duration-500`}>
                    {STRUCTURE_INFO[activeFacility.selectedType].name}
                  </div>
                  {/* Inspection Type Badge - Enlarged */}
                  <div className="px-6 py-3 bg-slate-100 text-slate-700 rounded-[20px] text-xl font-black border border-slate-200 shadow-sm">
                    {INSPECTION_INFO[activeFacility.inspectionType].name}
                  </div>
                </div>
              </div>
            </div>
            <button 
              onClick={() => window.print()} 
              className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-[24px] text-base font-black hover:bg-black transition-all shadow-2xl hover:shadow-indigo-200/50 active:scale-95 relative z-10 shrink-0 print:hidden"
            >
              <Printer className="w-5 h-5" /> 리포트 출력 / PDF
            </button>
          </div>

          {/* Quick Stats Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-5">
              <div className={`w-12 h-12 ${getThemeLightColor(activeFacility.selectedType)} rounded-2xl flex items-center justify-center`}><Construction className="w-6 h-6" /></div>
              <div><p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">총 연장</p><p className="text-xl font-black">{totalLength.toLocaleString()}m</p></div>
            </div>
            {isBridge && (
              <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-5">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center"><Layers className="w-6 h-6" /></div>
                <div><p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">총 경간수</p><p className="text-xl font-black">{totalSpans}경간</p></div>
              </div>
            )}
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-5">
              <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center"><Info className="w-6 h-6" /></div>
              <div><p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">시설물 종별</p><p className="text-xl font-black">{FACILITY_CLASS_INFO[activeFacility.facilityClass]}</p></div>
            </div>
          </div>

          {/* Results Table Card */}
          <div className="bg-white rounded-[40px] border border-slate-200 shadow-2xl overflow-hidden print:border-slate-300 print:shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left min-w-[900px] table-fixed">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200">
                    <th rowSpan={2} className="p-5 border-r border-slate-200 font-black text-slate-700 text-[12px] w-[180px] text-center uppercase tracking-wider">시험 항목</th>
                    <th colSpan={2} className="p-5 border-r border-slate-200 font-black text-slate-700 text-[12px] text-center uppercase tracking-wider">세부지침 기준</th>
                    <th colSpan={2} className="p-5 border-r border-slate-200 font-black text-indigo-600 text-[12px] text-center uppercase tracking-wider">수량 산출 (기준 / 금회)</th>
                    <th rowSpan={2} className="p-5 font-black text-slate-700 text-[12px] w-[150px] text-center uppercase tracking-wider">비 고</th>
                  </tr>
                  <tr className="bg-slate-50/30 border-b border-slate-200">
                    {isBridge ? (
                      <>
                        <th className="p-4 border-r border-slate-200 font-bold text-slate-500 text-[11px] text-center">상부구조</th>
                        <th className="p-4 border-r border-slate-200 font-bold text-slate-500 text-[11px] text-center">하부구조</th>
                        <th className="p-4 border-r border-slate-200 font-bold text-indigo-600 text-[11px] text-center bg-indigo-50/30">상부 (기준/금회)</th>
                        <th className="p-4 border-r border-slate-200 font-bold text-indigo-600 text-[11px] text-center bg-indigo-50/30">하부 (기준/금회)</th>
                      </>
                    ) : (
                      <>
                        <th colSpan={2} className="p-4 border-r border-slate-200 font-bold text-slate-500 text-[11px] text-center">산정 기준</th>
                        <th colSpan={2} className="p-4 border-r border-slate-200 font-bold text-indigo-600 text-[11px] text-center bg-indigo-50/30">수량 산출 (기준 / 금회)</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Basic Tasks */}
                  <tr className="bg-slate-50/80">
                    <td colSpan={isBridge ? 6 : 4} className="p-4 px-8 text-[12px] font-black text-slate-600 flex items-center gap-3">
                      <div className={`w-2 h-2 ${getThemeColor(activeFacility.selectedType)} rounded-full`}></div> 필수 과업 항목
                    </td>
                  </tr>
                  {TEST_RULES[activeFacility.selectedType].filter(r => getCategory(r.id, activeFacility) === 'BASIC').map(rule => {
                    const res = rule.calculate(activeFacility);
                    const valU = activeFacility.implQtys[rule.id]?.upper ?? res.upperQty;
                    const valL = activeFacility.implQtys[rule.id]?.lower ?? res.lowerQty;
                    return (
                      <tr key={rule.id} className="hover:bg-indigo-50/20 transition-colors group">
                        <td className="p-5 border-r border-slate-200 font-bold text-slate-900 text-[12px] text-center group-hover:text-indigo-600 transition-colors">{rule.name}</td>
                        {isBridge ? (
                          <>
                            <td className="p-4 border-r border-slate-200 text-[11px] text-slate-500 text-center whitespace-pre-line leading-relaxed">{res.upperCriteria || '-'}</td>
                            <td className="p-4 border-r border-slate-200 text-[11px] text-slate-500 text-center whitespace-pre-line leading-relaxed">{res.lowerCriteria || '-'}</td>
                            <td className="p-4 border-r border-slate-200 text-center bg-indigo-50/10">
                              <div className="flex items-center justify-center gap-3">
                                <span className="text-slate-400 font-medium text-[12px]">{res.upperQty}</span>
                                <span className="text-slate-200 text-[11px]">|</span>
                                <input 
                                  type="text" 
                                  value={valU} 
                                  onChange={(e) => updateImplQty(rule.id, 'upper', e.target.value)}
                                  className="w-16 bg-white border border-indigo-100 rounded-xl text-center text-[12px] font-black text-indigo-600 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none print:bg-transparent print:border-none print:shadow-none"
                                />
                              </div>
                            </td>
                            <td className="p-4 border-r border-slate-200 text-center bg-indigo-50/10">
                              <div className="flex items-center justify-center gap-3">
                                <span className="text-slate-400 font-medium text-[12px]">{res.lowerQty}</span>
                                <span className="text-slate-200 text-[11px]">|</span>
                                <input 
                                  type="text" 
                                  value={valL} 
                                  onChange={(e) => updateImplQty(rule.id, 'lower', e.target.value)}
                                  className="w-16 bg-white border border-indigo-100 rounded-xl text-center text-[12px] font-black text-indigo-600 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none print:bg-transparent print:border-none print:shadow-none"
                                />
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td colSpan={2} className="p-4 border-r border-slate-200 text-[11px] text-slate-500 text-center whitespace-pre-line leading-relaxed">{res.upperCriteria || '-'}</td>
                            <td colSpan={2} className="p-4 border-r border-slate-200 text-center bg-indigo-50/10">
                              <div className="flex items-center justify-center gap-3">
                                <span className="text-slate-400 font-medium text-[12px]">{res.upperQty}</span>
                                <span className="text-slate-200 text-[11px]">|</span>
                                <input 
                                  type="text" 
                                  value={valU} 
                                  onChange={(e) => updateImplQty(rule.id, 'upper', e.target.value)}
                                  className="w-16 bg-white border border-indigo-100 rounded-xl text-center text-[12px] font-black text-indigo-600 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none print:bg-transparent print:border-none print:shadow-none"
                                />
                              </div>
                            </td>
                          </>
                        )}
                        <td className="p-4 text-[11px] text-slate-400 text-center italic font-medium">지침 기준 준수</td>
                      </tr>
                    );
                  })}

                  {/* Optional Tasks */}
                  <tr className="bg-slate-50/80">
                    <td colSpan={isBridge ? 6 : 4} className="p-4 px-8 text-[12px] font-black text-slate-600 flex items-center gap-3">
                      <div className="w-2 h-2 bg-slate-400 rounded-full"></div> 선택 과업 (판단 필요)
                    </td>
                  </tr>
                  {TEST_RULES[activeFacility.selectedType].filter(r => getCategory(r.id, activeFacility) === 'OPTIONAL').map(rule => {
                    const res = rule.calculate(activeFacility);
                    const valU = activeFacility.implQtys[rule.id]?.upper ?? res.upperQty;
                    const valL = activeFacility.implQtys[rule.id]?.lower ?? res.lowerQty;
                    return (
                      <tr key={rule.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-5 border-r border-slate-200 font-bold text-slate-600 text-[12px] text-center group-hover:text-slate-900 transition-colors">{rule.name}</td>
                        {isBridge ? (
                          <>
                            <td className="p-4 border-r border-slate-200 text-[11px] text-slate-400 text-center whitespace-pre-line leading-relaxed">{res.upperCriteria || '-'}</td>
                            <td className="p-4 border-r border-slate-200 text-[11px] text-slate-400 text-center whitespace-pre-line leading-relaxed">{res.lowerCriteria || '-'}</td>
                            <td className="p-3 border-r border-slate-200 text-center">
                              <div className="flex items-center justify-center gap-3">
                                <span className="text-slate-300 font-medium text-[12px]">{res.upperQty}</span>
                                <span className="text-slate-200 text-[11px]">|</span>
                                <input 
                                  type="text" 
                                  value={valU} 
                                  onChange={(e) => updateImplQty(rule.id, 'upper', e.target.value)}
                                  className="w-16 bg-slate-50 border border-slate-100 rounded-xl text-center text-[12px] font-bold text-slate-500 outline-none print:bg-transparent print:border-none"
                                />
                              </div>
                            </td>
                            <td className="p-3 border-r border-slate-200 text-center">
                              <div className="flex items-center justify-center gap-3">
                                <span className="text-slate-300 font-medium text-[12px]">{res.lowerQty}</span>
                                <span className="text-slate-200 text-[11px]">|</span>
                                <input 
                                  type="text" 
                                  value={valL} 
                                  onChange={(e) => updateImplQty(rule.id, 'lower', e.target.value)}
                                  className="w-16 bg-slate-50 border border-slate-100 rounded-xl text-center text-[12px] font-bold text-slate-500 outline-none print:bg-transparent print:border-none"
                                />
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td colSpan={2} className="p-4 border-r border-slate-200 text-[11px] text-slate-400 text-center whitespace-pre-line leading-relaxed">{res.upperCriteria || '-'}</td>
                            <td colSpan={2} className="p-3 border-r border-slate-200 text-center">
                              <div className="flex items-center justify-center gap-3">
                                <span className="text-slate-300 font-medium text-[12px]">{res.upperQty}</span>
                                <span className="text-slate-200 text-[11px]">|</span>
                                <input 
                                  type="text" 
                                  value={valU} 
                                  onChange={(e) => updateImplQty(rule.id, 'upper', e.target.value)}
                                  className="w-16 bg-slate-50 border border-slate-100 rounded-xl text-center text-[12px] font-bold text-slate-500 outline-none print:bg-transparent print:border-none"
                                />
                              </div>
                            </td>
                          </>
                        )}
                        <td className="p-4 text-[11px] text-slate-400 text-center italic font-medium">현장 여건 고려</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Info Banner */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden print:hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-40 -mt-40"></div>
            <div className="flex items-start gap-8 relative z-10">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center shrink-0"><Info className="w-7 h-7 text-indigo-300" /></div>
              <div className="space-y-5">
                <h3 className="text-xl font-black tracking-tight text-indigo-300 underline underline-offset-8 decoration-indigo-300/30">산출 근거 및 유의사항</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-4 text-[13px] font-medium text-slate-300 leading-relaxed">
                  <div className="flex items-start gap-3"><span className="text-indigo-400 font-black text-lg">•</span> 교량 연장(L)에 따른 보정계수(r)가 자동으로 적용되었습니다.</div>
                  <div className="flex items-start gap-3"><span className="text-indigo-400 font-black text-lg">•</span> 터널의 경우 철근/무근 콘크리트 형식에 따라 시험 항목이 필터링됩니다.</div>
                  <div className="flex items-start gap-3"><span className="text-indigo-400 font-black text-lg">•</span> 옹벽은 평가단위(기본 20m)를 기준으로 산정되며, 석축의 경우 암반풍화도 등이 포함됩니다.</div>
                  <div className="flex items-start gap-3"><span className="text-indigo-400 font-black text-lg">•</span> 금회 수량은 기준 수량을 바탕으로 자동 입력되며, 현장 여건에 맞춰 수정 가능합니다.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
