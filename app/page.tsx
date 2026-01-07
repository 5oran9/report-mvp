'use client';

import { useState } from 'react';
import { Search, Sparkles, ArrowRight, Loader2, Target, Eye, AlertCircle } from 'lucide-react';

export default function ReachCheckPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [report, setReport] = useState<any>(null);

  // 사장님의 '입력 귀찮음'을 최소화한 데이터 구조
  const [formData, setFormData] = useState({
    title: '',
    address: '',
    desiredImage: '', // 사장님이 바라는 단 하나의 비전
  });

  // 1단계: 네이버 검색 (가게 찾기)
  const handleSearch = async () => {
    if (!searchQuery) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/search?query=${searchQuery}`);
      const data = await res.json();
      setSearchResults(data.items || []);
    } finally {
      setLoading(false);
    }
  };

  // 가게 선택 (자동 완성)
  const selectStore = (item: any) => {
    setFormData({ ...formData, title: item.title, address: item.address });
    setStep(2);
  };

  // 2단계: GPT 리포트 생성 (GAP 분석)
  const generateReport = async () => {
    if (!formData.desiredImage) return alert("어떻게 보이고 싶은지 적어주세요!");
    setLoading(true);
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      setReport(data);
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FDFDFD] py-16 px-6 text-slate-900 font-sans">
      <div className="max-w-lg mx-auto">

        {/* Step 1: 빠른 검색 섹션 */}
        {step === 1 && (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="text-center space-y-2">
              <h1 className="text-5xl font-black tracking-tighter text-blue-600">ReachCheck</h1>
              <p className="text-slate-400 font-bold">내 가게, 온라인에서 어떻게 보일까요?</p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="우리 가게 상호명만 알려주세요"
                  className="w-full px-6 py-5 bg-white border-2 border-slate-100 rounded-3xl shadow-xl shadow-slate-100/50 outline-none focus:border-blue-500 transition-all text-lg font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button onClick={handleSearch} className="absolute right-4 top-4 p-2 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition">
                  <Search size={24} />
                </button>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto px-1">
                {loading ? <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-200" size={40} /></div> :
                  searchResults.map((item: any, idx) => (
                    <button key={idx} onClick={() => selectStore(item)} className="w-full p-6 text-left bg-white border border-slate-50 rounded-3xl hover:border-blue-200 hover:bg-blue-50/30 transition-all flex justify-between items-center group">
                      <div>
                        <h3 className="font-bold text-xl text-slate-800">{item.title}</h3>
                        <p className="text-sm text-slate-400 mt-1">{item.address}</p>
                      </div>
                      <ArrowRight className="text-slate-200 group-hover:text-blue-500 transition-colors" />
                    </button>
                  ))
                }
              </div>
            </div>
          </div>
        )}

        {/* Step 2: 오직 '비전'만 묻는 섹션 */}
        {step === 2 && (
          <div className="space-y-10 animate-in slide-in-from-right-8 duration-500">
            <div className="space-y-2">
              <span className="inline-block px-4 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest">Store Selected</span>
              <h2 className="text-3xl font-black text-slate-900 leading-tight">
                {formData.title} 사장님,<br />딱 하나만 알려주세요.
              </h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-lg font-bold text-slate-700 flex items-center">
                  <Sparkles size={18} className="mr-2 text-blue-500" />
                  우리 가게가 어떤 느낌으로 보였으면 좋겠나요?
                </label>
                <textarea
                  placeholder="예: 강남에서 가장 전문적인 필라테스 샵, 엄마들이 믿고 가는 가성비 김밥집 등..."
                  className="w-full p-8 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] focus:border-blue-500 outline-none h-56 resize-none text-xl font-medium leading-relaxed"
                  onChange={(e) => setFormData({ ...formData, desiredImage: e.target.value })}
                ></textarea>
              </div>

              <button
                onClick={generateReport}
                disabled={loading}
                className="w-full py-6 bg-slate-900 text-white font-black text-xl rounded-3xl flex justify-center items-center hover:bg-blue-600 transition-all shadow-2xl shadow-slate-200 disabled:bg-slate-200"
              >
                {loading ? (
                  <><Loader2 className="mr-3 animate-spin" /> GPT가 온라인 정보를 대조 중...</>
                ) : (
                  "무료 진단 리포트 생성"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: 충격적인 GAP 리포트 결과 */}
        {step === 3 && report && (
          <div className="space-y-8 animate-in zoom-in-95 duration-500">
            <div className="p-10 bg-white border-2 border-slate-900 rounded-[3rem] shadow-2xl relative overflow-hidden">

              <div className="relative space-y-10">
                <div className="flex items-center justify-between">
                  <span className="font-black text-blue-600 uppercase tracking-tighter italic">ReachCheck Result</span>
                  <span className="text-slate-300 font-bold">2026.01</span>
                </div>

                <div className="relative space-y-10">
                  {/* 1. 사장님의 꿈 */}
                  <section className="space-y-3">
                    {/* <p> 대신 <div>를 사용하고, 안쪽 점은 <span>으로 변경합니다 */}
                    <div className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] flex items-center">
                      <span className="w-1 h-1 bg-blue-600 rounded-full mr-2" /> Owner's Vision
                    </div>
                    <p className="text-2xl font-black text-blue-600 italic leading-tight">
                      "{formData.desiredImage}"
                    </p>
                  </section>

                  {/* 2. 인정 섹션 (Reality - Strength) - 이 부분이 신뢰를 결정합니다! */}
                  <section className="space-y-3 p-8 bg-blue-50/50 rounded-[2.5rem] border border-blue-100 relative overflow-hidden">
                    <Sparkles className="absolute -right-2 -top-2 text-blue-200/50" size={80} />
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Our Strength</p>
                    <h3 className="text-xl font-black text-slate-800 mb-2">이미 잘하고 계신 점</h3>
                    <p className="text-slate-600 font-bold leading-relaxed">
                      {report.strength}
                    </p>
                  </section>

                  {/* 3. 냉정한 현실 (Reality - Gap) */}
                  <section className="space-y-3">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center">
                      <span className="w-1 h-1 bg-slate-900 rounded-full mr-2" /> Customer's View
                    </div>
                    <p className="text-3xl font-black text-slate-900 leading-tight">
                      "{report.aiDescription}"
                    </p>
                  </section>

                  {/* 4. 결정적 격차 */}
                  <div className="p-8 bg-red-50 rounded-[2.5rem] border-2 border-dashed border-red-200">
                    <h4 className="font-black text-red-600 text-lg mb-2 flex items-center">
                      💡 사장님, 목표 달성을 위해 '이것'만 채워보세요!
                    </h4>
                    <p className="font-bold text-red-800 text-xl leading-snug">
                      {report.summary.mainRisk}
                    </p>
                  </div>
                </div>

                {/* 버튼 구성 변경 */}
                <div className="pt-10 border-t border-slate-100 flex flex-col gap-3">
                  <button
                    className="w-full py-5 bg-blue-600 text-white font-black text-xl rounded-3xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all"
                    onClick={() => alert("준비 중인 서비스입니다. 19,900원 리포트로 전환 예정!")}
                  >
                    상세 분석 리포트 받아보기
                  </button>
                  <button
                    onClick={() => setStep(1)}
                    className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition"
                  >
                    뒤로 돌아가기
                  </button>
                </div>
              </div>
            </div>
            <p className="text-center text-slate-300 text-xs font-bold uppercase tracking-widest italic">진단 완료 - ReachCheck AI Engine</p>
          </div>
        )}
      </div>
    </main>
  );
}