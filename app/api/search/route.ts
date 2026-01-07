import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) return NextResponse.json({ items: [] });

  const res = await fetch(
    `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=5`,
    {
      headers: {
        'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID || '',
        'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET || '',
      },
    }
  );

  const data = await res.json();
  const items = data.items?.map((item: any) => ({
    title: item.title.replace(/<[^>]*>?/gm, ''), // HTML 태그 제거
    address: item.address,
    telephone: item.telephone,
    link: item.link
  })) || [];

  return NextResponse.json({ items });
}