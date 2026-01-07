import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  const { title, address, telephone, actualHours, parking, strengths } = body;

  // 실제 구현 시 여기서 Gemini/GPT API를 호출합니다.
  // 지금은 리포트가 생성되는 '구조'만 시뮬레이션합니다.
  const mockReport = {
    summary: {
      score: 75,
      mainRisk: "네이버와 실제 운영시간 불일치(1시간 차이)",
      potentialLoss: "월 예상 이탈 고객 약 15명"
    },
    factCheck: [
      { item: "전화번호", status: "정상", info: telephone },
      { item: "운영시간", status: "주의", info: `실제: ${actualHours} / 온라인: 정보 확인 필요` },
      { item: "주차", status: "정상", info: parking }
    ],
    aiDescription: `${title}은(는) ${strengths}을(를) 강조하는 전문 업장으로 분석됩니다.`,
  };

  // 실제 운영 시 3~10초 정도 분석 시간이 걸림을 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 2000));

  return NextResponse.json(mockReport);
}