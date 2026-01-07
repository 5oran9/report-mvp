'use client';

import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

export default function ReachCheckForm() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [report, setReport] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    title: '', address: '', telephone: '', actualHours: '', parking: '가능', strengths: ''
  });

  const handleSearch = async (query: string) => {
    const res = await fetch(`/api/search?query=${query}`);
    const data = await res.json();
    setSearchResults(data.items);
  };

  const generateReport = async () => {
    setLoading(true);
    const res = await fetch('/api/report', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    setReport(data);
    setLoading(false);
  };

  if (report) return (
    <div className="p-10 max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold underline">ReachCheck 진단 결과</h1>
      <div className="p-6 bg-red-50 border-2 border-red-200 rounded-xl">
        <h2 className="font-bold text-red-700">핵심 리스크: {report.summary.mainRisk}</h2>
        <p className="text-sm">종합 점수: {report.summary.score}점</p>
      </div>
      <pre className="bg-gray-100 p-4 rounded text-xs">{JSON.stringify(report, null, 2)}</pre>
      <button onClick={() => setReport(null)} className="text-blue-600 underline">다시 확인하기</button>
    </div>
  );

  return (
    <div className="p-10 max-w-xl mx-auto space-y-8">
      {step === 1 ? (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold italic">ReachCheck: 가게 찾기</h1>
          <div className="flex gap-2">
            <input 
              type="text" placeholder="우리 가게 상호명 입력" 
              className="flex-1 border-2 p-3 rounded-lg"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(e.currentTarget.value)}
            />
          </div>
          <div className="divide-y border rounded-lg">
            {searchResults.map((item: any, i) => (
              <div key={i} className="p-4 cursor-pointer hover:bg-blue-50" 
                onClick={() => {
                  setFormData({...formData, title: item.title, address: item.address, telephone: item.telephone});
                  setStep(2);
                }}>
                <div className="font-bold">{item.title}</div>
                <div className="text-sm text-gray-500">{item.address}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold italic">ReachCheck: 진실 입력</h1>
          <div className="space-y-4">
            <div><label className="text-sm font-bold">상호명 (자동입력)</label>
            <input type="text" value={formData.title} readOnly className="w-full p-3 bg-gray-100 rounded border" /></div>
            
            <input type="text" placeholder="실제 운영시간 (예: 평일 10:00~20:00)" 
              className="w-full p-3 border-2 rounded-lg"
              onChange={(e) => setFormData({...formData, actualHours: e.target.value})} />
            
            <textarea placeholder="우리 가게만의 강점 (예: 1:1 개인레슨 전문)" 
              className="w-full p-3 border-2 rounded-lg h-32"
              onChange={(e) => setFormData({...formData, strengths: e.target.value})} />
            
            <button 
              onClick={generateReport}
              disabled={loading}
              className="w-full py-4 bg-black text-white font-bold rounded-xl flex justify-center items-center"
            >
              {loading ? <><Loader2 className="mr-2 animate-spin" /> 리포트 생성 중...</> : "무료 진단 리포트 받기"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}