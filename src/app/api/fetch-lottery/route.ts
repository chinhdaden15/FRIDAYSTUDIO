import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sourceUrl, region, province, days, stationCode } = body;

    await new Promise(resolve => setTimeout(resolve, 800));

    if (!sourceUrl || !sourceUrl.startsWith('http')) {
      return NextResponse.json({ error: 'Link không hợp lệ' }, { status: 400 });
    }

    const actualDays = Math.min(days, 90); 
    const results = [];

    // Deterministic random logic based on string hashing (NO Math.random)
    const pseudoRandom = (seed: number) => {
      let x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    const getPrizes = (dateStr: string, provinceStr: string, index: number) => {
      const seed = Array.from(dateStr + provinceStr).reduce((acc, char) => acc + char.charCodeAt(0), 0) + index;
      
      const genNum = (len: number, localSeed: number) => {
        let str = "";
        for (let i = 0; i < len; i++) {
          str += Math.floor(pseudoRandom(seed + localSeed + i) * 10).toString();
        }
        return str;
      };

      const special = genNum(6, 100);
      
      const prizes = [
        { name: "Đặc biệt", numbers: [special] },
        { name: "Giải nhất", numbers: [genNum(5, 200)] },
        { name: "Giải nhì", numbers: [genNum(5, 300), genNum(5, 301)] },
        { name: "Giải ba", numbers: [genNum(5, 400), genNum(5, 401), genNum(5, 402), genNum(5, 403), genNum(5, 404), genNum(5, 405)] },
        { name: "Giải tư", numbers: [genNum(5, 500), genNum(5, 501), genNum(5, 502), genNum(5, 503)] },
        { name: "Giải năm", numbers: [genNum(4, 600), genNum(4, 601), genNum(4, 602), genNum(4, 603), genNum(4, 604), genNum(4, 605)] },
        { name: "Giải sáu", numbers: [genNum(4, 700), genNum(4, 701), genNum(4, 702)] },
        { name: "Giải bảy", numbers: [genNum(3, 800), genNum(3, 801), genNum(3, 802), genNum(3, 803)] },
        { name: "Giải tám", numbers: [genNum(2, 900)] }
      ];

      return { specialPrize: special, prizes };
    };

    const today = new Date();
    
    for (let i = 0; i < actualDays; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const { specialPrize, prizes } = getPrizes(dateStr, province, i);

      results.push({
        date: dateStr,
        specialPrize,
        prizes
      });
    }

    return NextResponse.json({
      sourceUrl,
      region: region || 'Chưa xác định',
      province: province || 'Chưa xác định',
      requestedDays: days,
      actualDays,
      dataType: "mock",
      results
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Không đọc được dữ liệu' },
      { status: 500 }
    );
  }
}
