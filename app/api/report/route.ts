import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  try {
    const { title, address, desiredImage } = await request.json();
    const cleanTitle = title.replace(/<[^>]*>?/gm, '');

    // 1. [기초 정보] 네이버 지역 검색
    const localRes = await fetch(
      `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(cleanTitle + " " + address)}&display=1`,
      { headers: { 'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID || '', 'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET || '' } }
    );
    const localData = await localRes.json();
    const store = localData.items?.[0];

    // 2. [진짜 인기도] 네이버 블로그 검색 결과 수 (total) 가져오기
    const blogRes = await fetch(
      `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(cleanTitle)}&display=1`,
      { headers: { 'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID || '', 'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET || '' } }
    );
    const blogData = await blogRes.json();
    const totalReviews = blogData.total || 0; // 블로그에 언급된 횟수

    // 3. [GPT 분석] 인기도 수치를 바탕으로 분석 지시
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "너는 로컬 상권 데이터 분석가야. 사장님에게 절대 거짓말을 하거나 지레짐작하지 마. 제공된 리뷰 수치(total)를 바탕으로 객관적으로 말해."
        },
        {
          role: "user",
          content: `
          [실제 데이터]
          - 가게 이름: ${cleanTitle}
          - 업종: ${store?.category}
          - 온라인 언급량(네이버 블로그 총합): ${totalReviews}건
          
          [사장님의 꿈]
          "${desiredImage}"

          [분석 지침]
          1. 언급량(${totalReviews}건)이 많다면 이미 검증된 인기 맛집임을 강력하게 인정할 것.
          2. 언급량이 적다면 아직 온라인상에 소문이 덜 났다고 분석할 것.
          3. 사장님이 바라는 모습과 현재 온라인에서의 '현실(인기도)' 사이의 차이를 분석할 것.

          JSON 형식으로 답변:
          {
            "strength": "온라인상에서 확인된 이 가게의 실질적 위상 (언급량 기반)",
            "aiDescription": "검색 결과로 본 현재 이 가게의 진짜 분위기",
            "summary": { "mainRisk": "목표 달성을 위해 보완이 필요한 한 끗", "score": 0~100 }
          }
          `
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    return NextResponse.json(result);

  } catch (error) {
    return NextResponse.json({ error: '분석 중 오류 발생' }, { status: 500 });
  }
}