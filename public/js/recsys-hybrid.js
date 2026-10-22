/* Chapter 06: Hybrid Recommender Systems (Pedagogical Revamp - TryHackMe style)
 * Fully rewritten for intuitive mastery: Story & Real-World Purpose -> Decoded Terms -> Pipeline & Mechanism -> Decision Guide.
 * 100% compliant with clean HTML/Unicode math (0 raw dollar signs) and 0 reading time strings.
 */
(() => {
  'use strict';
  const doc = { title: 'Chapter 6 · Hybrid Recommender Systems', path: 'source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf', pages: 170 };
  const source = (page, topic) => ({ ...doc, page, topic });
  const testbed = { title: 'Chapter 6 · Test Beds A/B', path: 'source/Recommending System/เอกสาร_Lecture/Data_Chapter6_TestBeds_AB_Data.pdf', pages: 14, page: 1, topic: 'กติกาสองสนามทดสอบ' };
  const f = x => x === null ? '— ไม่มีหลักฐาน' : x.toFixed(4);
  const dot = (a, b) => a.reduce((s, x, k) => s + x * b[k], 0);
  const mean = a => a.reduce((s, x) => s + x, 0) / a.length;

  const targetPattern = [1, 2, 3, 0];
  let qCount = 0;
  const question = (id, q, choices, answer, explanation, reasons) => {
    const target = targetPattern[qCount % 4];
    qCount++;
    const c = [...choices], r = [...reasons];
    if (target !== answer) {
      const tc = c[answer]; c[answer] = c[target]; c[target] = tc;
      const tr = r[answer]; r[answer] = r[target]; r[target] = tr;
    }
    return { id, q, choices: c, answer: target, explanation, reasons: r, version: 2 };
  };

  const normalize = values => {
    const valid = values.filter(x => x !== null);
    if (!valid.length) return values.map(() => null);
    const lo = Math.min(...valid), hi = Math.max(...valid);
    return values.map(x => x === null ? null : hi === lo ? .5 : (x - lo) / (hi - lo));
  };
  const fuse = (a, b, w) => {
    const denominator = (a === null ? 0 : w) + (b === null ? 0 : 1 - w);
    return denominator > 0 ? ((a ?? 0) * w + (b ?? 0) * (1 - w)) / denominator : null;
  };
  const rank = (items, values) => items.map((id, i) => ({ id, score: values[i] })).filter(x => x.score !== null).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).map(x => x.id);
  const interleave = (a, b) => {
    const lists = [a, b], pointers = [0, 0], result = [], seen = new Set();
    while (pointers.some((p, i) => p < lists[i].length)) {
      for (let k = 0; k < 2; k++) {
        while (pointers[k] < lists[k].length && seen.has(lists[k][pointers[k]])) pointers[k]++;
        if (pointers[k] < lists[k].length) { const id = lists[k][pointers[k]++]; seen.add(id); result.push(id); }
      }
    }
    return result;
  };

  const d = {
    items: ['C1', 'C2', 'C3', 'C4', 'C5'],
    names: ['Python เริ่มต้น', 'SQL เริ่มต้น', 'UX เริ่มต้น', 'Python คอร์สใหม่', 'ข้อมูลยังไม่พร้อม'],
    a: [.8, .6, .4, .2, null], b: [4, 5, 1, null, null], fallbackB: 4,
    support: [4, 3, 1, 0, 0], w: .6, theta: 2,
    xA: [[1, 0], [1, 0], [0, 1], [1, 0], [0, 0]],
    xB: [[1, 0], [1, 1], [0, 1], [0, 0], [0, 0]],
    oracle: { ranksA: [1, 4, 2], ranksB: [3, 1, 2] },
    lightfm: { userId: [.2, .1], userTag: [.3, .1], itemId: [.1, .1], itemTag: [.4, .2] },
    tower: { user: [.6, .8], items: [[.8, .6], [0, 1], [1, 0], [.5, .5]] },
    logq: { logits: [2, 1, 0], Q: [.5, .25, .25], positive: 0, temperature: 1 },
    graph: { edges: [['g1', 'C1'], ['g2', 'C1'], ['g2', 'C3']], degrees: { g1: 1, g2: 2, C1: 2, C3: 1 } }
  };

  d.normA = normalize(d.a); d.normB = normalize(d.b);
  d.weighted = d.a.map((a, i) => a === null || d.b[i] === null ? null : d.w * d.normA[i] + (1 - d.w) * d.normB[i]);
  d.aware = d.a.map((_, i) => fuse(d.normA[i], d.normB[i], d.w));
  d.naive = d.normA.map((a, i) => a === null ? null : d.w * a + (1 - d.w) * (d.normB[i] ?? .75));
  d.orderA = rank(d.items, d.a); d.orderB = rank(d.items, d.b);
  d.mixed = interleave(d.orderA, d.orderB);
  d.switched = d.a.map((a, i) => d.support[i] >= d.theta && d.normB[i] !== null ? d.normB[i] : a !== null ? d.normA[i] : null);
  d.cascadePool = d.orderB.slice(0, 2);
  d.cascade = rank(d.cascadePool, d.cascadePool.map(id => d.a[d.items.indexOf(id)]));
  d.featureWeights = [.6, .2, .1, .3];
  d.featureScores = d.xA.map((a, i) => i === 4 ? null : dot([...a, ...d.xB[i]], d.featureWeights));
  d.oracle.mrrA = mean(d.oracle.ranksA.map(r => 1 / r));
  d.oracle.mrrB = mean(d.oracle.ranksB.map(r => 1 / r));
  d.oracle.bound = mean(d.oracle.ranksA.map((r, i) => Math.max(1 / r, 1 / d.oracle.ranksB[i])));
  d.lightfm.user = d.lightfm.userId.map((v, i) => v + d.lightfm.userTag[i]);
  d.lightfm.warmItem = d.lightfm.itemId.map((v, i) => v + d.lightfm.itemTag[i]);
  d.lightfm.warmScore = dot(d.lightfm.user, d.lightfm.warmItem);
  d.lightfm.coldScore = dot(d.lightfm.user, d.lightfm.itemTag);
  d.tower.scores = d.tower.items.map(v => dot(d.tower.user, v));
  const softmax = logits => { const max = Math.max(...logits), e = logits.map(x => Math.exp(x - max)), total = e.reduce((s, v) => s + v, 0); return e.map(x => x / total); };
  d.logq.corrected = d.logq.logits.map((l, i) => l - Math.log(d.logq.Q[i]));
  d.logq.before = softmax(d.logq.logits); d.logq.after = softmax(d.logq.corrected);
  d.graph.pathWeight = 1 / Math.sqrt(2) * .5 * 1 / Math.sqrt(2);
  window.RECSYS_HYBRID_DATA = d;

  const note = (title, html) => '<details class="rs-reading-note"><summary>อ่านลึก: ' + title + '</summary>' + html + '</details>';
  const formula = html => '<div class="formula">' + html + '</div>';
  const demo = name => '<div data-rs-demo="hy-' + name + '"></div>';
  const memory = text => '<div class="callout"><b>จำด้วยเส้นทาง:</b> ' + text + '</div>';
  const route = (label, nodes) => '<div class="rs-hybrid-route" role="group" aria-label="' + label + '">' + nodes.map(([title, payload, kind]) => '<div class="rs-hy-node rs-hy-' + (kind || 'out') + '"><b>' + title + '</b><span>' + payload + '</span></div>').join('<span class="rs-hy-arrow" aria-hidden="true">→</span>') + '</div>';
  const parallel = (label, nodes, output) => '<div class="rs-hy-parallel" role="group" aria-label="' + label + '"><p class="rs-hy-parallel-label">สองฝั่งทำงานแยกกัน</p><div class="rs-hy-inputs">' + nodes.map(([title, payload, kind]) => '<div class="rs-hy-node rs-hy-' + kind + '"><b>' + title + '</b><span>' + payload + '</span></div>').join('') + '</div><div class="rs-hy-join" aria-hidden="true">↘ &nbsp; จุดเชื่อม &nbsp; ↙</div><div class="rs-hy-node"><b>' + output[0] + '</b><span>' + output[1] + '</span></div></div>';
  const legend = '<p class="rs-hybrid-legend"><span class="rs-hy-a">A · เนื้อหา Content-based</span><span class="rs-hy-b">B · พฤติกรรม Collaborative</span></p>';
  const grid = (cells, highlight = [], columns = 2, label = 'ข้อมูลในขั้นนี้') => ({ cells, highlight, columns, label });
  const step = (title, value, detail, tokens, active, cells) => ({ title, value, detail, tokens, active, ...(cells ? { grid: cells } : {}) });
  const table = '<div class="rs-table-wrap" tabindex="0" role="region" aria-label="ข้อมูลส่วนประกอบ A และ B เลื่อนแนวนอนได้"><table class="rs-hybrid-data"><caption>ตัวอย่างจำลองมาตรฐาน (Candidate C1–C5) สำหรับเปรียบเทียบทั้ง 7 ระบบ</caption><thead><tr><th>รายการสินค้า</th><th>A: ความคล้ายเนื้อหา (0-1)</th><th>B: ดาวทำนายพฤติกรรม (1-5)</th><th>ผู้ชอบในชุดฝึก nᵢ</th></tr></thead><tbody>' + d.items.map((id, i) => '<tr><th scope="row">' + id + ' ' + d.names[i] + '</th><td>' + f(d.a[i]) + '</td><td>' + f(d.b[i]) + '</td><td>' + d.support[i] + '</td></tr>').join('') + '</tbody></table></div>';

  window.RECSYS_DEMOS = { ...(window.RECSYS_DEMOS || {}),
    'hy-oracle': [
      step('1 · วัด A และ B ในสามกรณีเดียวกัน', 'อันดับ A=[1, 4, 2] · B=[3, 1, 2]', 'ทดสอบทั้งสองโมเดลบนเคสเดียวกัน เคส 1 A ชนะ, เคส 2 B ชนะ, เคส 3 เสมอกัน', ['Case 1', 'Case 2', 'Case 3', 'Oracle'], [0, 1, 2], grid(['A: 1, 4, 2', 'B: 3, 1, 2'], [0, 1])),
      step('2 · แปลงอันดับเป็น Reciprocal Rank (RR)', 'A: [1, 1/4, 1/2] · B: [1/3, 1, 1/2]', 'RR = 1/อันดับ ยิ่งอันดับดีค่ายิ่งเข้าใกล้ 1.0', ['Case 1', 'Case 2', 'Case 3', 'Oracle'], [0, 1, 2]),
      step('3 · สมมุติว่าหยิบผลที่ดีที่สุดเสมอ (Oracle)', 'เลือก A, B, เสมอ → [1.0, 1.0, 0.5]', 'Oracle เป็นเพดานทฤษฎีสมมุติที่แอบดูเฉลยล่วงหน้า เพื่อดูว่าสองโมเดลเกื้อหนุนกันแค่ไหน', ['Case 1', 'Case 2', 'Case 3', 'Oracle'], [3]),
      step('4 · เฉลี่ยและหาเพดานขอบบน (Upper Bound)', 'MRR A=0.5833 · MRR B=0.6111 · Oracle=0.8333', 'เพดาน Oracle สูงกว่าโมเดลเดี่ยว แสดงว่าโมเดลทั้งสองมีข้อผิดพลาดที่เกื้อหนุนกัน (Complementary Errors)', ['Case 1', 'Case 2', 'Case 3', 'Oracle'], [3])
    ],
    'hy-scale': [
      step('1 · ปัญหาการบวกคะแนนดิบตรงๆ', 'C1: A(0.8) + B(4.0) = 4.8 · C2: A(0.6) + B(5.0) = 5.6', 'คะแนนดาว (1-5) มีสเกลใหญ่กว่าคะแนนเนื้อหา (0-1) ทำให้ฝั่งดาวครอบงำผลลัพธ์ทั้งหมด', ['A ดิบ (0-1)', 'B ดิบ (1-5)', 'Normalize', 'Combine'], [0, 1], grid(['C1 A=0.8, B=4', 'C2 A=0.6, B=5'], [0, 1, 2, 3])),
      step('2 · กำหนดขอบเขต Min-Max ของแต่ละแหล่ง', 'A: min=0.2, max=0.8 · B: min=1, max=5', 'หาจุดต่ำสุดและสูงสุดของแต่ละโมเดลภายในชุด Candidate', ['A ดิบ', 'B ดิบ', 'Normalize', 'Combine'], [2]),
      step('3 · แปลงเข้าสู่ช่วงเดียวกัน [0, 1]', 'C1: A=1.00, B=0.75 · C2: A=0.67, B=1.00', 'ปรับคะแนนให้อยู่ในสเกล 0 ถึง 1 เท่าเทียมกันทั้งสองฝั่ง', ['A ดิบ', 'B ดิบ', 'Normalize', 'Combine'], [2], grid(['C1 A=1.00, B=0.75', 'C2 A=0.67, B=1.00'], [0, 1, 2, 3])),
      step('4 · รวมคะแนนหลังปรับสเกล (wA=0.6)', 'C1 = 0.6(1.0) + 0.4(0.75) = 0.90 > C2 = 0.80', 'อันดับเปลี่ยนกลับมาถูกต้องตามน้ำหนัก C1 ขึ้นนำเพราะเด่นในด้าน A ที่ให้น้ำหนัก 60%', ['A ดิบ', 'B ดิบ', 'Normalize', 'Combine'], [3])
    ],
    'hy-weighted': [
      step('1 · รัน A และ B ขนานกันอย่างอิสระ', 'C1: A → 1.00 · B → 0.75', 'ทั้งสองโมเดลคำนวณคะแนนของตนเองโดยไม่ต้องรอหรือแชร์ข้อมูลระหว่างกัน', ['A Score', 'B Score', 'ถ่วงน้ำหนัก', 'จัดอันดับ'], [0, 1], grid(['A = 1.00', 'B = 0.75'], [0, 1])),
      step('2 · ใส่น้ำหนัก wA = 0.6 และ wB = 0.4', '0.6 × 1.00 และ 0.4 × 0.75', 'น้ำหนักรวมต้องเท่ากับ 1.0 (wA + wB = 1)', ['A Score', 'B Score', 'ถ่วงน้ำหนัก', 'จัดอันดับ'], [2]),
      step('3 · รวมเป็นคะแนนเดี่ยว (Weighted Sum)', 'C1: 0.6 + 0.3 = 0.9000', 'รวมตัวเลขสองฝั่งเป็นคะแนนไฮบริดก้อนเดียว', ['A Score', 'B Score', 'ถ่วงน้ำหนัก', 'จัดอันดับ'], [2], grid(['C1: 0.90', 'C2: 0.80', 'C3: 0.20'], [0])),
      step('4 · จัดอันดับผู้สมัครทั้งหมด', 'C1 (0.90) → C2 (0.80) → C3 (0.20)', 'เรียงลำดับจากมากไปน้อยเพื่อนำเสนอผลลัพธ์สุดท้าย', ['A Score', 'B Score', 'ถ่วงน้ำหนัก', 'จัดอันดับ'], [3])
    ],
    'hy-evidence': [
      step('1 · สินค้า C4 เป็นคอร์สใหม่แกะกล่อง', 'A มีหลักฐานเนื้อหา (C4=0) แต่ B ไร้หลักฐาน (mB=0)', 'ฝั่งพฤติกรรม B ไม่มีประวัติเลยสำหรับ C4 มีเพียงค่า Fallback หลอกตา', ['Score', 'Evidence mask', 'Renormalize', 'Fallback'], [0, 1], grid(['A C4: มีหลักฐาน (0)', 'B C4: ไร้หลักฐาน'], [1])),
      step('2 · กับดักของการรวมแบบไม่เช็กหลักฐาน (Naive)', 'C4 Naive = 0.6(0) + 0.4(0.75) = 0.30 > C3(0.20)', 'การหยิบค่า Fallback มารวมจะดันคอร์สที่ไม่มีประวัติขึ้นเหนือคอร์สที่มีข้อมูลจริง!', ['Score', 'Evidence mask', 'Renormalize', 'Fallback'], [0]),
      step('3 · การคำนวณแบบตรวจจับหลักฐาน (Evidence-Aware)', 'C4 = (0.6 × 0) / 0.6 = 0.0000', 'ตัดน้ำหนักฝั่งที่ไร้หลักฐานออก แล้วหารเฉลี่ยเฉพาะแหล่งที่มีข้อมูลจริง', ['Score', 'Evidence mask', 'Renormalize', 'Fallback'], [1, 2]),
      step('4 · กรณีสินค้า C5 ไร้หลักฐานทั้งสองฝั่ง', 'ผลรวมน้ำหนักตัวหาร = 0 → สลับไปใช้ Fallback Policy', 'ไม่หารด้วยศูนย์ และไม่โมเมว่าได้คะแนน 0 แต่ส่งไปให้ระบบสำรองจัดการ', ['Score', 'Evidence mask', 'Renormalize', 'Fallback'], [3])
    ],
    'hy-switch': [
      step('1 · ตรวจสอบเงื่อนไขการสลับ (Gating Criterion)', 'ตั้งเกณฑ์จำนวนผู้ชอบ θ = 2 คน (Train Interactions)', 'ตรวจว่าสินค้ามีประวัติหนาแน่นพอที่จะใช้โมเดลพฤติกรรม B หรือไม่', ['Gate', 'A หรือ B', 'หนึ่ง Score'], [0]),
      step('2 · สินค้า C1 ผ่านเกณฑ์ (มี 4 คน ≥ 2)', 'สลับไปใช้โมเดล B → ได้คะแนน 0.75', 'เลือกผลลัพธ์จาก B โดยตรง ไม่ต้องเสียเวลาไปคำนวณหรือเฉลี่ย A', ['Gate', 'A หรือ B', 'หนึ่ง Score'], [1], grid(['A ถูกข้าม', 'B ถูกเลือก'], [1])),
      step('3 · สินค้า C4 มีพฤติกรรมไม่พอ (0 คน < 2)', 'สลับไปใช้โมเดล A (Content) → ได้คะแนน 0.00', 'ใช้โมเดลเนื้อหา A ช่วยกอบกู้สถานการณ์เมื่อเจอสินค้าใหม่', ['Gate', 'A หรือ B', 'หนึ่ง Score'], [1], grid(['A ถูกเลือก', 'B ขาดหลักฐาน'], [0])),
      step('4 · สินค้า C5 ไม่พร้อมทั้งสองฝั่ง', 'ไม่มีโมเดลใดรองรับ → ส่งต่อ Fallback Baseline', 'ระบบสลับโหมดอย่างราบรื่นโดยไม่สะดุด', ['Gate', 'A หรือ B', 'หนึ่ง Score'], [2])
    ],
    'hy-mixed': [
      step('1 · สองระบบผลิตผลลัพธ์แยกกัน', 'A: [C1, C2, C3, C4] · B: [C2, C1, C3]', 'แต่ละโมเดลสร้างลิสต์อันดับของตนเองโดยไม่ต้องแปลงคะแนนให้เท่ากัน', ['A List', 'B List', 'Interleaving'], [0, 1]),
      step('2 · สลับดึงทีละอันดับ (Interleaving)', 'รอบที่ 1: ดึง A อันดับแรก (C1) แล้วดึง B อันดับแรก (C2)', 'แสดงผลสลับฟันปลาบนหน้าจอ UI', ['A List', 'B List', 'Interleaving'], [2], grid(['อันดับ 1: C1 (จาก A)', 'อันดับ 2: C2 (จาก B)'], [0, 1])),
      step('3 · ตัดรายการที่ซ้ำซ้อนกัน', 'รอบที่ 2: A ส่ง C2 (ซ้ำ! ข้ามไปเอา C3), B ส่ง C1 (ซ้ำ! ข้าม)', 'คัดกรองไม่ให้สินค้าเดิมโผล่ซ้ำบนหน้าจอ', ['A List', 'B List', 'Interleaving'], [2]),
      step('4 · ได้ลิสต์รวมที่หลากหลายบน UI', 'ผลลัพธ์สุดท้าย: C1 → C2 → C3 → C4', 'ผู้ใช้ได้เห็นทั้งของที่เนื้อหาตรงใจและของที่คนอื่นกำลังฮิตพร้อมกัน', ['A List', 'B List', 'Interleaving'], [3])
    ],
    'hy-combination': [
      step('1 · ดึงฟีเจอร์จากทั้งสองแหล่ง', 'ฝั่งเนื้อหา xA: [1, 0] · ฝั่งพฤติกรรม xB: [1, 0]', 'xA คือเวกเตอร์หมวดหมู่, xB คือเวกเตอร์กลุ่มพฤติกรรม', ['xA Content', 'xB Collab', 'Concatenate', 'Single Model'], [0, 1]),
      step('2 · เชื่อมต่อเป็นเวกเตอร์เดี่ยวขนาดยาว', 'x_combined = [1, 0, 1, 0]', 'นำฟีเจอร์ทั้งสองโลกมามัดรวมกันเป็นหนึ่งเดียว (Concatenation)', ['xA Content', 'xB Collab', 'Concatenate', 'Single Model'], [2], grid(['xA: 1, 0', 'xB: 1, 0', 'Combined: 1, 0, 1, 0'], [2])),
      step('3 · ป้อนเข้าโมเดลตัวเดียว (Monolithic Classifier)', 'Score = w · x_combined = (0.6×1 + 0.2×0 + 0.1×1 + 0.3×0) = 0.70', 'โมเดลเดียว (เช่น XGBoost หรือ DNN) เป็นผู้เรียนรู้น้ำหนักของทุกฟีเจอร์พร้อมกัน', ['xA Content', 'xB Collab', 'Concatenate', 'Single Model'], [3]),
      step('4 · เรียนรู้ปฏิสัมพันธ์ข้ามมิติ', 'โมเดลสามารถจับคู่ฟีเจอร์เนื้อหาและพฤติกรรมได้โดยตรง', 'เปิดโอกาสให้ระบบเรียนรู้ Cross-features ที่ซับซ้อน', ['xA Content', 'xB Collab', 'Concatenate', 'Single Model'], [3])
    ],
    'hy-augmentation': [
      step('1 · โมเดล A (Content) ทำนายล่วงหน้า', 'สำหรับช่องว่างที่ไม่มีดาว → A ทำนายได้ 3.6 ดาว', 'โมเดลเนื้อหาช่วยเติมเต็มคะแนนสำหรับสินค้าใหม่ที่ยังไม่มีใครรีวิว', ['A Prediction', 'Pseudo Rating', 'B Retrain'], [0]),
      step('2 · ติดป้ายเป็นคะแนนเทียม (Pseudo Rating)', 'Rating = 3.6 ดาว, Flag = Pseudo, Confidence = 0.2', 'แยกแยะระหว่างคะแนนจริงของผู้ใช้กับคะแนนเทียมที่โมเดลคาดเดา', ['A Prediction', 'Pseudo Rating', 'B Retrain'], [1], grid(['ดาวจริง: 5.0', 'ดาวเทียม: 3.6 (A)'], [1])),
      step('3 · ส่งตารางที่แน่นขึ้นให้โมเดล B (CF) เรียนรู้', 'ตารางเดิม + ผลทำนายของ A → เทรน CF รอบใหม่', 'Collaborative Filtering มีข้อมูลหนาแน่นขึ้น ทำให้หาเพื่อนบ้านได้แม่นยำขึ้น', ['A Prediction', 'Pseudo Rating', 'B Retrain'], [2]),
      step('4 · บรรเทาปัญหาความเบาบางอย่างได้ผล', 'Content-Boosted CF ช่วยให้ CF ก้าวข้ามจุดบอด Sparsity', 'โมเดล B ทำงานได้ดีขึ้นเพราะได้รับแรงหนุนจากโมเดล A', ['A Prediction', 'Pseudo Rating', 'B Retrain'], [3])
    ],
    'hy-cascade': [
      step('1 · ด่านแรก: กรองหยาบด้วยโมเดล B (Fast Retrieval)', 'จากคลังสินค้ามหาศาล → B คัดกรองเหลือ Pool = {C2, C1} (M=2)', 'ใช้โมเดลความเร็วสูงคัดเลือกผู้สมัครที่น่าสนใจอย่างรวดเร็ว', ['B Retrieval', 'Candidate Pool', 'A Reranker', 'Top-K'], [0]),
      step('2 · ขอบเขตของผู้สมัครถูกจำกัดลงแล้ว', 'Pool={C2, C1} ส่วน C3, C4 ถูกตัดทิ้งในด่านแรก', 'โมเดลที่สองจะพิจารณาเฉพาะของที่ผ่านด่านแรกมาเท่านั้น', ['B Retrieval', 'Candidate Pool', 'A Reranker', 'Top-K'], [1], grid(['C2 ผ่าน', 'C1 ผ่าน', 'C3 ตก', 'C4 ตก'], [0, 1])),
      step('3 · ด่านสอง: จัดอันดับละเอียดด้วยโมเดล A (Fine Reranker)', 'ใน Pool: A(C1) = 0.8 > A(C2) = 0.6 → สลับอันดับ C1 ขึ้นนำ', 'ใช้โมเดลที่ฉลาดและซับซ้อนกว่ามาเรียงลำดับซ้ำเฉพาะใน Pool', ['B Retrieval', 'Candidate Pool', 'A Reranker', 'Top-K'], [2]),
      step('4 · ผลลัพธ์สุดท้ายที่แม่นยำและรวดเร็ว', 'ลำดับแสดงผล: C1 นำ C2', 'หัวใจของระบบแนะนำขนาดใหญ่ระดับ YouTube และ TikTok', ['B Retrieval', 'Candidate Pool', 'A Reranker', 'Top-K'], [3])
    ],
    'hy-meta': [
      step('1 · โมเดล A สกัดเวกเตอร์ตัวแทนรสนิยม', 'สร้างโปรไฟล์ผู้ใช้ profile(u) = [1.0, 0.0], profile(v) = [0.8, 0.6]', 'โมเดลเนื้อหาทำหน้าที่เป็น Feature Extractor สร้างตัวแทนความสนใจ', ['A Profile', 'Representation Sharing', 'B Collaborative'], [0], grid(['u: [1.0, 0.0]', 'v: [0.8, 0.6]'], [0, 1])),
      step('2 · ส่งโมเดลตัวแทนให้โมเดล B ใช้งาน', 'B คำนวณความคล้ายเพื่อนบ้าน: Cosine(u, v) = 0.80', 'โมเดล B ไม่ได้หาเพื่อนจากคะแนนดาว แต่หาเพื่อนจากเวกเตอร์ที่โมเดล A ส่งมาให้', ['A Profile', 'Representation Sharing', 'B Collaborative'], [1]),
      step('3 · โมเดล B ใช้พฤติกรรมของเพื่อนที่ค้นพบ', 'v ชอบคอร์ส C2 (ให้ 5 ดาว) → นำมาทำนายให้ u', 'เชื่อมโยงข้ามระบบ: ใช้ตัวแทนจากเนื้อหา แต่ใช้รอยเท้าจากพฤติกรรม', ['A Profile', 'Representation Sharing', 'B Collaborative'], [2]),
      step('4 · คำทำนายที่ทรงพลังข้ามขอบเขต', 'r̂(u, C2) = 5.0 ดาว', 'แก้ปัญหาคนที่ไม่เคยดูของร่วมกัน แต่มีความสนใจในเนื้อหาเหมือนกันได้', ['A Profile', 'Representation Sharing', 'B Collaborative'], [3])
    ],
    'hy-lightfm': [
      step('1 · ฝั่งผู้ใช้: รวมเวกเตอร์ ID กับคุณลักษณะ', 'p_user = ID[0.2, 0.1] + Tag_Data[0.3, 0.1] = [0.5, 0.2]', 'หลอมรวมเวกเตอร์ตัวตนและเวกเตอร์ความสนใจเข้าเป็นเนื้อเดียวกัน', ['User Features', 'Item Features', 'Sum Vector', 'Dot Product'], [0]),
      step('2 · ฝั่งสินค้าเก่า (Warm Item): รวม ID กับหมวดหมู่', 'q_C1 = ID[0.1, 0.1] + Tag_Data[0.4, 0.2] = [0.5, 0.3]', 'สินค้าที่มีประวัติ จะได้แรงเสริมจากทั้งรหัสสินค้าและหมวดหมู่', ['User Features', 'Item Features', 'Sum Vector', 'Dot Product'], [1, 2], grid(['User p: [0.5, 0.2]', 'Warm q: [0.5, 0.3]'], [0, 1])),
      step('3 · คำนวณคะแนนด้วย Dot Product', 'Score(u, C1) = p_user · q_C1 = (0.5×0.5 + 0.2×0.3) = 0.3100', 'ทำนายคะแนนเหมือน Matrix Factorization ตามปกติ', ['User Features', 'Item Features', 'Sum Vector', 'Dot Product'], [3]),
      step('4 · สินค้าใหม่แกะกล่อง (Cold Item C4): ใช้เฉพาะเวกเตอร์หมวดหมู่', 'q_C4 = ID[0, 0] + Tag_Data[0.4, 0.2] = [0.4, 0.2] → Score = 0.24', 'เมื่อสินค้าไม่มี ID เวกเตอร์จะถอยกลับไปใช้ผลรวมของแท็ก แก้ Cold-Start ได้ทันที!', ['User Features', 'Item Features', 'Sum Vector', 'Dot Product'], [1, 3])
    ],
    'hy-graph': [
      step('1 · กราฟพฤติกรรมสองส่วน (Bipartite Graph)', 'เส้นเชื่อม: ผู้ใช้ g1 — สินค้า C1 — ผู้ใช้ g2 — สินค้า C3', 'มองความสัมพันธ์เป็นโครงข่ายใยแมงมุมระหว่างคนกับของ', ['Graph Motif', 'Degree Normalization', 'Message Passing', '3-Hop Path'], [0], grid(['deg(g1)=1', 'deg(C1)=2', 'deg(g2)=2', 'deg(C3)=1'], [0, 1, 2, 3])),
      step('2 · การแพร่กระจายผ่านเส้นเชื่อมแรก (g1 → C1)', 'น้ำหนักเส้น = 1 / √(deg(g1) × deg(C1)) = 1 / √2 ≈ 0.7071', 'ถ่วงน้ำหนักด้วย Degree ของทั้งสองฝั่งเพื่อป้องกันโหนดยอดฮิตครอบงำ', ['Graph Motif', 'Degree Normalization', 'Message Passing', '3-Hop Path'], [1]),
      step('3 · แพร่กระจายสู่ผู้ใช้คนที่สอง (C1 → g2)', 'น้ำหนักเส้น = 1 / √(2 × 2) = 0.5000', 'ส่งผ่านสัญญาณความชอบข้ามคนผ่านสินค้าที่ใช้ร่วมกัน', ['Graph Motif', 'Degree Normalization', 'Message Passing', '3-Hop Path'], [2]),
      step('4 · แพร่กระจายถึงสินค้าที่เกี่ยวข้อง (g2 → C3)', 'น้ำหนักเส้นทางสะสม 3 ช่วง = 0.7071 × 0.5 × 0.7071 = 0.2500', 'LightGCN ค้นพบว่า g1 น่าจะชอบ C3 ผ่านโครงข่ายการเชื่อมโยง 3 ลำดับขั้น', ['Graph Motif', 'Degree Normalization', 'Message Passing', '3-Hop Path'], [3])
    ],
    'hy-tower': [
      step('1 · เข้ารหัสแยกสองหอคอยอิสระ (Two-Tower Architecture)', 'User Tower → เวกเตอร์ p · Item Tower → เวกเตอร์ q', 'หอคอยผู้ใช้รับบริวัติ/โปรไฟล์, หอคอยสินค้ารับไอดี/คำบรรยาย', ['User Tower', 'Item Tower', 'ANN Retrieval', 'Rerank'], [0, 1]),
      step('2 · Precompute และเก็บเวกเตอร์สินค้าลงใน Vector DB', 'q(C1)=[0.8, 0.6], q(C2)=[0, 1], q(C3)=[1, 0]', 'คำนวณเวกเตอร์สินค้าล่วงหน้าเก็บในดัชนี ANN (เช่น HNSW / ScaNN)', ['User Tower', 'Item Tower', 'ANN Retrieval', 'Rerank'], [1], grid(['C1: [0.8, 0.6]', 'C2: [0.0, 1.0]', 'C3: [1.0, 0.0]', 'C4: [0.5, 0.5]'], [0, 1, 2, 3])),
      step('3 · เมื่อผู้ใช้เปิดแอป: รัน User Tower สดๆ', 'User Tower ผลิต p = [0.6, 0.8] ในเสี้ยววินาที', 'ดึงเวกเตอร์ผู้ใช้ไปยิงค้นหาใน Vector DB ด้วย Inner Product', ['User Tower', 'Item Tower', 'ANN Retrieval', 'Rerank'], [0, 2]),
      step('4 · ค้นคืนสินค้าที่เข้ากันได้สูงสุดในเวลา < 5 ms', 'Dot Product: C1 = 0.96 (อันดับ 1) → ส่งต่อให้ Reranker', 'คัดกรองจากของนับล้านชิ้นเหลือ 100 ชิ้นได้อย่างรวดเร็วทันใจ', ['User Tower', 'Item Tower', 'ANN Retrieval', 'Rerank'], [2, 3])
    ],
    'hy-logq': [
      step('1 · เทรนด้วย In-Batch Negatives', 'ในมินิแบตช์: มีคู่บวก 1 คู่ และยืมคู่ของคนอื่นมาเป็นลบ Logits = [2, 1, 0]', 'ประหยัด GPU มหาศาลด้วยการยืมสินค้าในแบตช์เดียวกันมาเป็นคู่ซ้อม', ['In-batch Negatives', 'Sampling Frequency Q', 'LogQ Correction', 'Serving'], [0]),
      step('2 · คำนวณความถี่การสุ่มเจอ (Q)', 'สินค้า C1 เป็นของฮิต มีโอกาสสุ่มเจอ Q = 0.50, ชิ้นอื่น Q = 0.25', 'สินค้าฮิตจะมีโอกาสหลุดเข้ามาเป็น In-Batch Negatives บ่อยกว่าปกติ', ['In-batch Negatives', 'Sampling Frequency Q', 'LogQ Correction', 'Serving'], [1]),
      step('3 · ชดเชยอคติด้วย LogQ Correction', 'Logit ปรับปรุง = Logit - ln(Q) → l′ = [2 - ln(0.5), 1 - ln(0.25), ...]', 'หักค่าลอการิทึมของความถี่ออกเพื่อคืนความยุติธรรมให้สินค้าเฉพาะกลุ่ม', ['In-batch Negatives', 'Sampling Frequency Q', 'LogQ Correction', 'Serving'], [2], grid(d.logq.corrected.map((x, i) => 'ชิ้น ' + (i + 1) + ': ' + f(x)), [0, 1, 2], 3)),
      step('4 · ตอนให้บริการจริง (Serving): ใช้ Dot Product ดิบ', 'ตอน Serving ห้ามหัก ln(Q) ซ้ำ! ให้ใช้ p · q ตรงๆ', 'การแก้ LogQ มีไว้เฉพาะตอนฝึกสอนเพื่อชดเชยการสุ่มเท่านั้น', ['In-batch Negatives', 'Sampling Frequency Q', 'LogQ Correction', 'Serving'], [2, 3])
    ]
  };

  const graphSVG = '<div class="rs-hy-graph"><svg viewBox="0 0 600 250" role="img" aria-label="กราฟสองฝั่ง ผู้ใช้ g1 เชื่อม C1 และ g2 เชื่อม C1 กับ C3"><g stroke="#7087a2" stroke-width="3"><path d="M110 60 L490 60 M110 190 L490 60 M110 190 L490 190"/></g><g fill="#102b40" stroke="#58dfcb" stroke-width="2"><circle cx="110" cy="60" r="35"/><circle cx="110" cy="190" r="35"/></g><g fill="#29253d" stroke="#c9aeff" stroke-width="2"><circle cx="490" cy="60" r="35"/><circle cx="490" cy="190" r="35"/></g><g fill="#f1f8ff" text-anchor="middle" font-family="sans-serif" font-size="22"><text x="110" y="68">g1</text><text x="110" y="198">g2</text><text x="490" y="68">C1</text><text x="490" y="198">C3</text><text x="300" y="47">1/√2</text><text x="300" y="116">1/2</text><text x="300" y="222">1/√2</text></g></svg></div>';

  const lessons = [
  {
    "id": "recsys-hy-map",
    "title": "ภาพรวมระบบแนะนำแบบผสมและแผนที่อนุกรมวิธานของเบิร์ก",
    "subtitle": "ทำไมระบบเดี่ยวจึงตัน? หลอมรวมเนื้อหากับพฤติกรรมอย่างไรให้เกิดพลังเสริม (Synergy)",
    "desc": "เข้าใจข้อจำกัดของ Content-based และ Collaborative Filtering พร้อมเปิดแผนผัง Burke Taxonomy ทั้ง 7 รูปแบบคลาสสิก",
    "content": "<div class=\"rs-story-box\">\n      <h4>เรื่องเล่าและที่มาในชีวิตจริง (Story & Real-World Purpose)</h4>\n      <p>จินตนาการถึงระบบแนะนำเพลงอย่าง <b>Spotify</b>:</p>\n      <ul>\n        <li>ถ้าใช้ <b>Content-based Filtering</b> อย่างเดียว: ระบบจะฟังคลื่นเสียง วิเคราะห์บีท จังหวะ และแนวเพลง ผลคือคุณจะติดอยู่ใน <i>Filter Bubble</i> ได้ยินแต่เพลงเสียงเดิมๆ ที่แทบไม่ต่างจากเดิม ไม่มีวันได้ค้นพบเพลงนอกกระแสที่แหวกแนวแต่โดนใจ (ขาด <b>Serendipity</b>)!</li>\n        <li>ถ้าใช้ <b>Collaborative Filtering</b> อย่างเดียว: ระบบพึ่งพาแต่รอยเท้าคนฟัง เพลงใหม่ที่ศิลปินอินดี้เพิ่งอัปโหลดเมื่อครู่นี้จะไม่มีใครได้ยินเลย เพราะติดหล่ม <b>Cold-Start</b> และความเบาบางของข้อมูล (<b>Sparsity</b>) ที่ไม่มีใครกดฟังก่อหน้า!</li>\n      </ul>\n      <p>การสร้าง <b>Hybrid Recommender System</b> จึงไม่ใช่แค่การเอาโมเดลสองตัวมาวางคู่กันเล่นๆ แต่เป็น <b>ความจำเป็นทางวิศวกรรม</b> เพื่อเอาข้อดีของระบบหนึ่งมาอุดรอยรั่วของอีกระบบหนึ่ง ทำให้ระบบฉลาดขึ้น ครอบคลุมผู้ใช้ทุกกลุ่ม และทนทานต่อจุดบอดของข้อมูลจริง</p>\n    </div>\n\n    <div class=\"rs-terms-box\">\n      <h4>ถอดรหัสคำศัพท์และตัวย่อสำคัญ (Key Terms Decoded)</h4>\n      <table class=\"rs-term-table\">\n        <thead><tr><th>คำศัพท์ / ตัวย่อ</th><th>คำอ่าน & ความหมายเชิงระบบ</th><th>บทบาทในสถาปัตยกรรม Hybrid</th></tr></thead>\n        <tbody>\n          <tr><td><b>Burke Taxonomy</b></td><td>อนุกรมวิธานของเบิร์ก (2002)</td><td>มาตรฐานการจำแนกระบบ Hybrid 7 แบบคลาสสิก โดยดูจาก <i>จุดเชื่อมต่อข้อมูล (Interface Boundary)</i></td></tr>\n          <tr><td><b>Monolithic Hybrid</b></td><td>ระบบหลอมรวมเป็นเนื้อเดียว</td><td>รวมฟีเจอร์เนื้อหาและพฤติกรรมเข้าด้วยกัน แล้วฝึก <b>โมเดลเดียว (Single Model)</b> ตั้งแต่ต้น</td></tr>\n          <tr><td><b>Parallel Hybrid</b></td><td>ระบบรันขนานกัน</td><td>รันโมเดลหลายตัวแยกกันอย่างอิสระ แล้วนำ <b>คะแนน (Scores)</b> หรือ <b>ลิสต์อันดับ (Ranked Lists)</b> มาผสานกันทีหลัง</td></tr>\n          <tr><td><b>Pipelined Hybrid</b></td><td>ระบบรันเป็นลำดับขั้น</td><td>โมเดลแรกทำงานเสร็จ ส่งผลลัพธ์ (เช่น ผู้สมัครที่ผ่านการคัด หรือเวกเตอร์ตัวแทน) ไปให้โมเดลถัดไปประมวลผลต่อ</td></tr>\n          <tr><td><b>Early Fusion vs Late Fusion</b></td><td>การหลอมรวมเร็ว vs หลอมรวมช้า</td><td>Early Fusion รวมที่ระดับฟีเจอร์ก่อนฝึก ส่วน Late Fusion รวมที่ระดับคะแนนผลลัพธ์ของโมเดล</td></tr>\n        </tbody>\n      </table>\n    </div>\n\n    <div class=\"rs-pipeline-box\">\n      <h4>แผนภาพสถาปัตยกรรม Hybrid ทั้ง 7 รูปแบบของ Robin Burke</h4>\n      <div class=\"rs-table-wrap\" tabindex=\"0\" role=\"region\" aria-label=\"ข้อมูลส่วนประกอบ A และ B เลื่อนแนวนอนได้\"><table class=\"rs-hybrid-data\"><caption>ตัวอย่างจำลองมาตรฐาน (Candidate C1–C5) สำหรับเปรียบเทียบทั้ง 7 ระบบ</caption><thead><tr><th>รายการสินค้า</th><th>A: ความคล้ายเนื้อหา (0-1)</th><th>B: ดาวทำนายพฤติกรรม (1-5)</th><th>ผู้ชอบในชุดฝึก nᵢ</th></tr></thead><tbody><tr><th scope=\"row\">C1 Python เริ่มต้น</th><td>0.8000</td><td>4.0000</td><td>4</td></tr><tr><th scope=\"row\">C2 SQL เริ่มต้น</th><td>0.6000</td><td>5.0000</td><td>3</td></tr><tr><th scope=\"row\">C3 UX เริ่มต้น</th><td>0.4000</td><td>1.0000</td><td>1</td></tr><tr><th scope=\"row\">C4 Python คอร์สใหม่</th><td>0.2000</td><td>— ไม่มีหลักฐาน</td><td>0</td></tr><tr><th scope=\"row\">C5 ข้อมูลยังไม่พร้อม</th><td>— ไม่มีหลักฐาน</td><td>— ไม่มีหลักฐาน</td><td>0</td></tr></tbody></table></div>\n      <div class=\"rs-table-wrap\">\n        <table class=\"rs-hybrid-data\">\n          <thead><tr><th>สไตล์ (Style)</th><th>รูปแบบ (Burke Design)</th><th>สิ่งที่ส่งข้ามพรมแดน</th><th>ตัวอย่างจริงในอุตสาหกรรม</th></tr></thead>\n          <tbody>\n            <tr><td rowspan=\"3\"><b>Parallel</b> (รันขนาน)</td><td><b>Weighted</b></td><td>คะแนนทำนายตัวเลข (Scores)</td><td>ถ่วงน้ำหนักคะแนนความคล้ายเนื้อหา + คะแนนดาว CF</td></tr>\n            <tr><td><b>Switching</b></td><td>การสลับเส้นทาง (Model Route)</td><td>ถ้าเป็นของใหม่ใช้ Content ถ้าเป็นของเก่าใช้ CF</td></tr>\n            <tr><td><b>Mixed</b></td><td>ลิสต์สินค้าที่จัดอันดับแล้ว (Ranked Lists)</td><td>แสดงแถว \"เพราะคุณชอบ...\" เคียงข้างกับแถว \"กำลังเป็นที่นิยม\"</td></tr>\n            <tr><td rowspan=\"2\"><b>Monolithic</b> (หลอมเดียว)</td><td><b>Feature Combination</b></td><td>เวกเตอร์คุณลักษณะดิบ (Raw Features)</td><td>ต่อเวกเตอร์แท็กเข้ากับเวกเตอร์พฤติกรรม แล้วป้อน XGBoost ตัวเดียว</td></tr>\n            <tr><td><b>Feature Augmentation</b></td><td>ผลทำนายเป็นฟีเจอร์เพิ่ม (Pseudo-scores)</td><td>Content-Boosted CF: ใช้เนื้อหาเดาดาวลงช่องว่าง แล้วฝึก CF ต่อ</td></tr>\n            <tr><td rowspan=\"2\"><b>Pipelined</b> (ขั้นบันได)</td><td><b>Cascade</b></td><td>ชุดผู้สมัครที่ผ่านเกณฑ์ (Candidate Pool)</td><td>โมเดลแรกคัดจาก 1,000,000 เหลือ 500 ชิ้น แล้วโมเดลสองจัดอันดับละเอียด</td></tr>\n            <tr><td><b>Meta-Level</b></td><td>โมเดลตัวแทนทั้งก้อน (User Profile / Weights)</td><td>โมเดลเนื้อหาสร้างเวกเตอร์รสนิยม แล้วส่งให้ CF หาเพื่อนบ้าน</td></tr>\n          </tbody>\n        </table>\n      </div>\n    </div>\n\n    <div class=\"rs-decision-box\">\n      <h4>คู่มือการตัดสินใจทางวิศวกรรม (Engineering Decision Guide)</h4>\n      <ul>\n        <li><b>เมื่อไหร่ควรใช้ Hybrid?</b> เมื่อระบบเดี่ยวเริ่มเจอปัญหา Cold-Start สูง, เมทริกซ์มีค่าว่างเกิน 99%, หรือผู้ใช้บ่นว่าคำแนะนำซ้ำซาก ขาดความแปลกใหม่</li>\n        <li><b>ข้อผิดพลาดคลาสสิก (Gotcha):</b> อย่าคิดว่า \"ยิ่งยัดโมเดลเยอะ ยิ่งดีเสมอไป\" การผสมโมเดลที่คิดเหมือนกัน ไม่ได้ช่วยเพิ่มความแม่นยำ แต่เพิ่มทั้ง Latency, ปัญหา Maintenance, และจุดเสี่ยงพังในระบบ Production</li>\n      </ul>\n    </div>\n    <div class=\"callout\"><b>จำด้วยเส้นทาง:</b> เจ็ดประตูของเบิร์ก: คะแนนรวม (Weighted) · สลับคนตอบ (Switching) · วางคู่กัน (Mixed) · ต่อฟีเจอร์ (Combination) · เสริมคะแนนเทียม (Augmentation) · คัดแล้วเรียง (Cascade) · ส่งตัวแทน (Meta-Level)</div>",
    "sources": [
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 1,
        "topic": "บทนำ Hybrid Recommender Systems"
      },
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 25,
        "topic": "Burke 2002 Taxonomy"
      },
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 30,
        "topic": "ข้อจำกัดระบบเดี่ยว"
      }
    ],
    "questions": [
      {
        "id": "map-1",
        "q": "จุดประสงค์หลักที่วิศวกรเลือกลงทุนสร้างระบบแนะนำแบบผสม (Hybrid RecSys) คืออะไร?",
        "choices": [
          "เพื่อรับประกันว่าโมเดลจะมีความแม่นยำ 100% เสมอบนทุกชุดข้อมูล",
          "เพื่อแก้จุดบอดของระบบเดี่ยว (เช่น Cold-Start, Sparsity, Filter Bubble) โดยดึงจุดเด่นของแต่ละระบบมาเสริมกัน",
          "เพื่อหลีกเลี่ยงการทำ Feature Engineering และลดขนาดข้อมูลในฐานข้อมูล",
          "เพื่อบังคับให้ระบบประมวลผลเฉพาะข้อมูลแบบตารางเท่านั้น"
        ],
        "answer": 1,
        "explanation": "ระบบ Hybrid ถูกออกแบบมาเพื่อก้าวข้ามข้อจำกัดสำคัญของระบบเดี่ยว เช่น Content-based ที่ขาด Serendipity และ Collaborative Filtering ที่มีปัญหา Cold-Start",
        "reasons": [
          "ผิด: ในทาง Machine Learning ไม่มีระบบใดการันตีความแม่นยำ 100% ได้",
          "ถูกต้อง: Hybrid สร้างขึ้นมาเพื่อผนึกจุดเด่นและกลบจุดด้อยของแต่ละโมเดล",
          "ผิด: ระบบ Hybrid ส่วนใหญ่ต้องทำ Feature Engineering และดูแลข้อมูลเพิ่มขึ้น",
          "ผิด: ระบบ Hybrid รองรับข้อมูลได้หลากชนิด ทั้งข้อความ ภาพ กราฟ และพฤติกรรม"
        ],
        "version": 2
      },
      {
        "id": "map-2",
        "q": "อนุกรมวิธานของ Robin Burke (2002) จำแนกระบบแนะนำแบบผสมออกเป็น 7 รูปแบบโดยใช้เกณฑ์ใดเป็นหลัก?",
        "choices": [
          "ภาษาโปรแกรมที่ใช้เขียน เช่น Python หรือ C++",
          "ความเร็วในการตอบสนอง (Latency) ในหน่วยมิลลิวินาที",
          "ชนิดของข้อมูลและสิ่งส่งข้ามพรมแดนระหว่างส่วนประกอบ (Interface Boundary Payload)",
          "จำนวน GPU ที่ต้องใช้ในการฝึกสอนโมเดล"
        ],
        "answer": 2,
        "explanation": "Burke จำแนก Hybrid จากสิ่งที่ส่งข้ามระหว่างโมเดล เช่น ส่งคะแนน (Weighted), ส่งการสลับ (Switching), ส่งลิสต์ (Mixed), ส่งฟีเจอร์ (Combination), ส่งคะแนนเทียม (Augmentation), ส่งเซตผู้สมัคร (Cascade), หรือส่งตัวแทนโมเดล (Meta-level)",
        "reasons": [
          "ผิด: ภาษาโปรแกรมเป็นเรื่องการพัฒนาซอฟต์แวร์ ไม่เกี่ยวกับทฤษฎีสถาปัตยกรรม",
          "ผิด: Burke ไม่ได้จำแนกตามเกณฑ์ Latency",
          "ถูกต้อง: ดูจาก Interface Boundary และชนิดของสิ่งที่ส่งต่อระหว่างโมเดล",
          "ผิด: ฮาร์ดแวร์ GPU ไม่ใช่เกณฑ์ในอนุกรมวิธานทางทฤษฎีนี้"
        ],
        "version": 2
      },
      {
        "id": "map-3",
        "q": "ระบบที่นำเวกเตอร์หมวดหมู่เนื้อหาและเวกเตอร์ประวัติพฤติกรรมมารวมกันเป็นเวกเตอร์เดี่ยว แล้วส่งให้โมเดลตัวเดียว (เช่น XGBoost หรือ DNN) เรียนรู้ จัดอยู่ในรูปแบบใดของ Burke?",
        "choices": [
          "Switching Hybrid (Gating Route)",
          "Cascade Hybrid (Multi-Stage Pipeline)",
          "Mixed Hybrid (Presentation-Level Blending)",
          "Feature Combination (Early Fusion)"
        ],
        "answer": 3,
        "explanation": "Feature Combination คือการนำฟีเจอร์จากหลายแหล่งมารวมกันก่อนส่งให้โมเดลตัวเดียวเรียนรู้ตั้งแต่ต้น (Early Fusion)",
        "reasons": [
          "ผิด: Switching เป็นการเลือกใช้เพียงหนึ่งโมเดลตามเงื่อนไข",
          "ผิด: Cascade เป็นการส่ง Candidate Pool จากโมเดลหนึ่งไปให้อีกโมเดลจัดอันดับ",
          "ผิด: Mixed เป็นการนำผลลัพธ์สุดท้ายมาวางร่วมกันบนหน้าจอ UI",
          "ถูกต้อง: รวมฟีเจอร์เข้าด้วยกันเป็นอินพุตเดียวของโมเดลเดี่ยว"
        ],
        "version": 2
      },
      {
        "id": "map-4",
        "q": "เหตุใดระบบ Collaborative Filtering (CF) เดี่ยวๆ จึงต้องการระบบ Content-based เข้ามาช่วยเสริมเป็นระบบ Hybrid?",
        "choices": [
          "เพราะเมื่อมีไอเท็มใหม่แกะกล่องเข้ามา CF จะไม่มีประวัติการคลิกหรือดาวเลย (Cold-Start) จึงต้องอาศัยเนื้อหาของไอเท็มมาช่วยทำนาย",
          "เพราะ CF ไม่สามารถทำงานกับข้อมูลตัวเลขเรตติ้ง 1-5 ดาวได้",
          "เพราะ Content-based คำนวณได้เร็วกว่า CF เสมอในทุกกรณี",
          "เพราะ CF ไม่สามารถแนะนำสินค้าข้ามหมวดหมู่ได้"
        ],
        "answer": 0,
        "explanation": "Collaborative Filtering มีจุดอ่อนร้ายแรงเรื่อง Item Cold-Start เพราะไอเท็มใหม่ไม่มี Interaction ในประวัติเลย Content-based จึงเข้ามาช่วยอุดรอยรั่วนี้ด้วยการวิเคราะห์เนื้อหาของสินค้า",
        "reasons": [
          "ถูกต้อง: Content-based ช่วยกอบกู้สถานการณ์เมื่อสินค้าใหม่ไร้ประวัติพฤติกรรม (Cold-Start)",
          "ผิด: CF ถูกสร้างขึ้นมาเพื่อรับมือกับคะแนนเรตติ้ง 1-5 ดาวโดยตรง",
          "ผิด: ความเร็วขึ้นอยู่กับขนาดข้อมูลและอัลกอริทึม ไม่ได้แปลว่า Content เร็วกว่าเสมอไป",
          "ผิด: CF เด่นเรื่องการแนะนำข้ามหมวดหมู่อยู่แล้ว จุดอ่อนของมันคือไม่มีประวัติ"
        ],
        "version": 2
      }
    ]
  },
  {
    "id": "recsys-hy-oracle",
    "title": "Complementary Errors และขอบเขตทฤษฎีออราเคิล",
    "subtitle": "โมเดลที่ฉลาดคนละเรื่องกันดีกว่าโมเดลเก่งแต่คิดเหมือนกันอย่างไร",
    "desc": "ทำความเข้าใจว่าทำไมการรวมโมเดลจึงต้องมีข้อผิดพลาดเกื้อหนุนกัน พร้อมคำนวณ Oracle Upper Bound",
    "content": "<div class=\"rs-story-box\">\n      <h4>เรื่องเล่าและที่มาในชีวิตจริง (Story & Real-World Purpose)</h4>\n      <p>ลองนึกภาพคุณเป็นหัวหน้าทีม และกำลังคัดเลือกลูกน้อง 2 คนเข้ามาช่วยแก้ปัญหา:</p>\n      <ul>\n        <li><b>ลูกน้อง A:</b> เชี่ยวชาญด้านคณิตศาสตร์และตรรกะเนื้อหาอย่างลึกซึ้ง แต่ไม่เข้าใจจิตวิทยาพฤติกรรมมนุษย์เลย</li>\n        <li><b>ลูกน้อง B:</b> เชี่ยวชาญด้านแนวโน้มแฟชั่นและพฤติกรรมฝูงชน แต่ไม่เข้าใจเนื้อหาทางเทคนิค</li>\n      </ul>\n      <p>ถ้าคุณเจองานที่ยาก การมีลูกน้อง 2 คนนี้ทำงานร่วมกันจะช่วยให้ทีมผ่านไปได้ เพราะ <i>\"งานที่คนหนึ่งทำไม่ได้ อีกคนหนึ่งทำได้สบายๆ\"</i> ในทาง Machine Learning เราเรียกสิ่งนี้ว่า <b>Complementary Errors (ข้อผิดพลาดที่เกื้อหนุนกัน)</b></p>\n      <p>ในทางกลับกัน ถ้าคุณมีลูกน้องที่เก่งมาก 2 คนแต่ทั้งคู่ถนัดและโง่เรื่องเดียวกันเป๊ะๆ เวลาเจองานที่พวกเขางง ทั้งคู่ก็จะตอบผิดเหมือนกันเป๊ะ การรวมพลังจึงไม่ได้ประโยชน์อะไรเพิ่มขึ้นเลย!</p>\n    </div>\n\n    <div class=\"rs-terms-box\">\n      <h4>ถอดรหัสคำศัพท์และตัวย่อสำคัญ (Key Terms Decoded)</h4>\n      <table class=\"rs-term-table\">\n        <thead><tr><th>คำศัพท์ / ตัวย่อ</th><th>คำอ่าน & ความหมายเชิงระบบ</th><th>บทบาทในการวิเคราะห์ระบบ</th></tr></thead>\n        <tbody>\n          <tr><td><b>Complementary Errors</b></td><td>ความผิดพลาดที่เกื้อหนุนกัน</td><td>สภาวะที่โมเดล A ผิดในเคสที่โมเดล B ตอบถูก และโมเดล B ผิดในเคสที่ A ตอบถูก ทำให้การรวมกันได้ประสิทธิภาพสูงกว่าเดี่ยวๆ</td></tr>\n          <tr><td><b>Oracle</b></td><td>ออราเคิล / ผู้หยั่งรู้ในทฤษฎี</td><td>แบบจำลองในอุดมคติที่ <i>\"แอบดูคำตอบจริงล่วงหน้า\"</i> แล้วเลือกโมเดลที่ทำนายได้ดีที่สุดเสมอในแต่ละเคส</td></tr>\n          <tr><td><b>Oracle Upper Bound</b></td><td>เพดานขอบบนของออราเคิล</td><td>คะแนนสูงสุดในทางทฤษฎีที่ระบบ Hybrid แบบเลือกหนึ่งในสอง (Selection-based) จะสามารถทำได้บนชุดข้อมูลนั้น</td></tr>\n          <tr><td><b>MRR</b></td><td>Mean Reciprocal Rank</td><td>ค่าเฉลี่ยของส่วนกลับของอันดับ (1/อันดับ) ที่ไอเท็มถูกต้องปรากฏ ยิ่งอันดับดีค่ายิ่งใกล้ 1.0</td></tr>\n        </tbody>\n      </table>\n    </div>\n\n    <div class=\"rs-pipeline-box\">\n      <h4>การคำนวณ Oracle บนชุดข้อมูล 3 กรณีตัวอย่าง</h4>\n      <p>สมมุติเราทดสอบโมเดล A และ B บนเคสทดสอบ 3 เคส ได้อันดับของคำตอบที่ถูกต้องดังนี้:</p>\n      <div data-rs-demo=\"hy-oracle\"></div>\n      <p>สังเกตเห็นอะไรไหม? โมเดล A เดี่ยวๆ ได้ 0.5833 โมเดล B เดี่ยวๆ ได้ 0.6111 แต่ถ้าเรามีระบบที่ฉลาดพอจะเลือกหยิบคำตอบจากคนที่ถูกในแต่ละเคส เพดานผลลัพธ์จะกระโดดขึ้นไปถึง <b>0.8333</b> (+36% ดีขึ้นอย่างก้าวกระโดด)!</p>\n    </div>\n\n    <div class=\"rs-decision-box\">\n      <h4>คู่มือการตัดสินใจทางวิศวกรรม (Engineering Decision Guide)</h4>\n      <ul>\n        <li><b>Oracle คือเครื่องมือวิเคราะห์ ไม่ใช่โมเดลใช้งานจริง:</b> ห้ามเข้าใจผิดว่าเราสามารถเอา Oracle ไปใช้เสิร์ฟใน Production ได้ เพราะ Oracle ต้องรู้เฉลยจริงก่อนถึงจะเลือกได้ มันมีไว้เป็น <i>ไม้บรรทัดวัดความเป็นไปได้สูงสุด (Upper Bound Benchmark)</i></li>\n        <li><b>เมื่อ Oracle Upper Bound แทบไม่ต่างจากโมเดลเดี่ยว:</b> แสดงว่าโมเดล A และ B มีพฤติกรรมเหมือนกันเป๊ะ (Redundant Errors) การทำ Hybrid จะเสียเวลาเปล่า ให้มองหาโมเดลที่มีแนวคิดต่างกันอย่างสิ้นเชิงเข้ามาแทน</li>\n      </ul>\n    </div>\n    <div class=\"callout\"><b>จำด้วยเส้นทาง:</b> A เก่งบางเคส · B เก่งอีกเคส → ความผิดพลาดสลับกันคือขุมทรัพย์ของ Hybrid · Oracle บอกเพดานสูงสุดที่ฝันถึงได้</div>",
    "sources": [
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 42,
        "topic": "Complementary Errors"
      },
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 45,
        "topic": "Oracle Simulation"
      },
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 48,
        "topic": "Upper Bound Analysis"
      }
    ],
    "questions": [
      {
        "id": "oracle-1",
        "q": "ในการประเมินระบบแนะนำ โมเดลจำลอง \"Oracle\" ถูกสร้างขึ้นมาเพื่อจุดประสงค์ใด?",
        "choices": [
          "เพื่อนำไปติดตั้งเป็นโมเดลหลักที่ให้บริการจริงบนเซิร์ฟเวอร์ Production",
          "เพื่อหาเพดานคะแนนสูงสุดในทางทฤษฎี (Theoretical Upper Bound) หากระบบเลือกผลลัพธ์จากโมเดลที่ดีที่สุดในแต่ละเคสได้เสมอ",
          "เพื่อใช้เติมค่าว่างในเมทริกซ์โดยไม่ต้องพึ่งพาข้อมูลจากผู้ใช้",
          "เพื่อคำนวณหาค่าความน่าจะเป็นที่แม่นยำ 100% สำหรับการทำนายดาว"
        ],
        "answer": 1,
        "explanation": "Oracle เป็นเครื่องมือวิเคราะห์สมมุติที่แอบดูเฉลยจริง เพื่อบอกนักพัฒนาว่าการรวมสองโมเดลนี้มีศักยภาพสูงสุด (Upper Bound) ไปได้ถึงระดับใด",
        "reasons": [
          "ผิด: Oracle เสิร์ฟจริงไม่ได้เพราะมันต้องแอบดูเฉลยล่วงหน้า",
          "ถูกต้อง: ใช้หาเพดานขอบบนทางทฤษฎีเพื่อดูความคุ้มค่าในการทำ Hybrid",
          "ผิด: Oracle ไม่ใช่เครื่องมือเติมค่าว่างในตาราง",
          "ผิด: Oracle ไม่ได้ใช้คำนวณค่าความน่าจะเป็นของดาว"
        ],
        "version": 2
      },
      {
        "id": "oracle-2",
        "q": "สภาวะใดที่ชี้ชัดว่าการนำสองโมเดลมาผสานกันเป็น Hybrid จะคุ้มค่าและให้ผลลัพธ์ที่ดีขึ้นอย่างชัดเจน?",
        "choices": [
          "โมเดลทั้งสองถูกสร้างขึ้นมาจากไลบรารีและภาษาโปรแกรมเดียวกัน",
          "โมเดลทั้งสองมีความแม่นยำสูงมากและตอบอันดับสินค้าเหมือนกันทุกประการ",
          "โมเดลทั้งสองมีข้อผิดพลาดที่เกื้อหนุนกัน (Complementary Errors) คือเคสที่โมเดลหนึ่งผิด อีกโมเดลหนึ่งมักจะตอบถูก",
          "โมเดลทั้งสองมีจำนวนพารามิเตอร์เท่ากันและใช้เวลาฝึกเท่ากัน"
        ],
        "answer": 2,
        "explanation": "หัวใจของการ Ensemble หรือ Hybrid คือความหลากหลาย (Diversity) ของข้อผิดพลาด ถ้าโมเดลหนึ่งผิดในจุดที่อีกโมเดลถูก การรวมกันจะดึงส่วนที่ดีที่สุดออกมาได้",
        "reasons": [
          "ผิด: ภาษาหรือไลบรารีไม่เกี่ยวกับความหลากหลายของหลักการทำนาย",
          "ผิด: ถ้าตอบเหมือนกันทุกเคส การรวมกันจะไม่ช่วยให้อะไรดีขึ้นเลย",
          "ถูกต้อง: Complementary Errors คือเงื่อนไขสำคัญที่ทำให้เกิดพลังเสริม (Synergy)",
          "ผิด: จำนวนพารามิเตอร์และเวลาฝึกไม่ได้บ่งบอกถึงข้อผิดพลาดที่เกื้อหนุนกัน"
        ],
        "version": 2
      },
      {
        "id": "oracle-3",
        "q": "หากโมเดล A ได้ MRR = 0.5833, โมเดล B ได้ MRR = 0.6111 และ Oracle ได้เพดาน MRR = 0.8333 ข้อมูลนี้บอกอะไรแก่ทีมวิศวกร?",
        "choices": [
          "ต้องปรับลดจำนวนเคสทดสอบลงเพื่อให้คะแนนของโมเดลเดี่ยวเท่ากับ Oracle",
          "โมเดล B เก่งกว่าโมเดล A เสมอในทุกเคสทดสอบ จึงควรตัดโมเดล A ทิ้งทันที",
          "ระบบที่พัฒนามาล้มเหลว เพราะผลลัพธ์ของโมเดลเดี่ยวต่ำกว่า Oracle",
          "โมเดลทั้งสองมีความรู้และจุดแข็งที่ต่างกันมาก การลงทุนพัฒนาระบบ Hybrid ที่ดีมีโอกาสดันประสิทธิภาพขึ้นไปได้สูงถึง 0.8333"
        ],
        "answer": 3,
        "explanation": "Oracle ที่สูงกว่าโมเดลเดี่ยวอย่างมาก ยืนยันว่าโมเดล A และ B มีจุดแข็งคนละด้าน การทำ Hybrid จะช่วยดึงประสิทธิภาพรวมให้สูงขึ้นอย่างมีนัยสำคัญ",
        "reasons": [
          "ผิด: ห้ามลดเคสทดสอบเพื่อหลอกตัวเลขผลการทดลอง",
          "ผิด: Case 1 โมเดล A ชนะ B ขาดลอย ดังนั้น B ไม่ได้เก่งกว่าทุกเคส",
          "ผิด: เป็นเรื่องปกติที่โมเดลเดี่ยวจะต่ำกว่า Oracle เพราะ Oracle รู้เฉลยล่วงหน้า",
          "ถูกต้อง: ช่องว่างระหว่างโมเดลเดี่ยวกับ Oracle บ่งชี้ว่ามี Synergy ให้เก็บเกี่ยวอย่างมาก"
        ],
        "version": 2
      },
      {
        "id": "oracle-4",
        "q": "เหตุใดเราจึงไม่สามารถนำแบบจำลอง Oracle ไปติดตั้งใช้งานจริง (Production Deployment) เพื่อแนะนำสินค้าให้ผู้ใช้ได้?",
        "choices": [
          "เพราะ Oracle ต้องล่วงรู้คำตอบจริง (Ground Truth Label) ล่วงหน้าในการเลือกโมเดล ซึ่งในสถานการณ์จริงเราไม่มีข้อมูลอนาคตนี้",
          "เพราะ Oracle ใช้หน่วยความจำ (RAM) มากเกินกว่าที่เซิร์ฟเวอร์จะรับไหว",
          "เพราะ Oracle สามารถทำงานได้เฉพาะกับข้อมูลที่มีขนาดไม่เกิน 3 แถวเท่านั้น",
          "เพราะ Oracle คำนวณอันดับได้เฉพาะตัวเลขจำนวนเต็มเท่านั้น"
        ],
        "answer": 0,
        "explanation": "Oracle เป็นการทดลองทางทฤษฎีที่ต้องใช้เฉลยจริงในการตัดสินใจ ในระบบจริงตอนที่ผู้ใช้เปิดแอป เรายังไม่รู้ว่าผู้ใช้จะกดคลิกอะไร จึงเป็นไปไม่ได้ที่จะรัน Oracle",
        "reasons": [
          "ถูกต้อง: Oracle อาศัยการล่วงรู้ Ground Truth จึงใช้ในสถานการณ์จริงที่ยังไม่รู้คำตอบไม่ได้",
          "ผิด: ไม่เกี่ยวกับเรื่องขนาดหน่วยความจำของเซิร์ฟเวอร์",
          "ผิด: Oracle สามารถวิเคราะห์ข้อมูลขนาดใหญ่เท่าใดก็ได้ในการประเมินผล",
          "ผิด: ไม่ได้จำกัดเฉพาะตัวเลขจำนวนเต็ม"
        ],
        "version": 2
      }
    ]
  },
  {
    "id": "recsys-hy-scale",
    "title": "การปรับสเกลคะแนนก่อนผสาน",
    "subtitle": "เทียบแอปเปิ้ลกับส้ม: ป้องกันโมเดลสเกลใหญ่ครอบงำโมเดลสเกลเล็ก",
    "desc": "เรียนรู้วิธีการทำ Min-Max, Z-score, Rank Normalization และทำความเข้าใจว่าทำไมการสเกลคะแนนจึงไม่ใช่ความน่าจะเป็น",
    "content": "<div class=\"rs-story-box\">\n      <h4>เรื่องเล่าและที่มาในชีวิตจริง (Story & Real-World Purpose)</h4>\n      <p>ลองจินตนาการว่าคุณกำลังรวมเงินสองสกุลในกระเป๋า:</p>\n      <ul>\n        <li>คุณมีเหรียญ <b>100 เยน</b> จากญี่ปุ่น</li>\n        <li>และมีธนบัตร <b>10 ดอลลาร์</b> จากสหรัฐอเมริกา</li>\n      </ul>\n      <p>ถ้าคุณเอาตัวเลขมาบวกกันตรงๆ: <code>100 + 10 = 110</code> แล้วบอกว่าเงินเยนมีอิทธิพลต่อความร่ำรวยของคุณมากกว่าเงินดอลลาร์ถึง 10 เท่า! ทุกคนคงมองว่าคุณเข้าใจผิดอย่างแรง เพราะคุณลืม <b>อัตราแลกเปลี่ยน (Currency Scale)</b>!</p>\n      <p>ในระบบแนะนำก็เช่นกัน:</p>\n      <ul>\n        <li>โมเดล Content-based คำนวณ Cosine Similarity ได้คะแนนช่วง <code>[0.0, 1.0]</code></li>\n        <li>แต่โมเดล Collaborative Filtering ทำนายคะแนนดาวได้ช่วง <code>[1.0, 5.0]</code></li>\n      </ul>\n      <p>ถ้าคุณนำคะแนนดิบมาบวกกันตรงๆ คะแนนดาวของ CF จะ <b>ครอบงำ (Dominate)</b> ผลลัพธ์ทั้งหมด ต่อให้คุณตั้งใจให้น้ำหนักฝั่งเนื้อหา 60% ก็ตาม!</p>\n    </div>\n\n    <div class=\"rs-terms-box\">\n      <h4>ถอดรหัสคำศัพท์และตัวย่อสำคัญ (Key Terms Decoded)</h4>\n      <table class=\"rs-term-table\">\n        <thead><tr><th>คำศัพท์ / วิธีการ</th><th>สูตรคณิตศาสตร์สะอาด</th><th>คุณสมบัติ & ข้อควรระวัง</th></tr></thead>\n        <tbody>\n          <tr><td><b>Min-Max Normalization</b></td><td><i>s̃</i> = (<i>s</i> - min) / (max - min)</td><td>ปรับคะแนนเข้าสู่ช่วง [0, 1] เสมอ โดยรักษาระยะห่างสัมพัทธ์เดิมไว้ แต่ไวต่อค่า Outlier</td></tr>\n          <tr><td><b>Z-Score Standardization</b></td><td><i>s̃</i> = (<i>s</i> - <i>μ</i>) / <i>σ</i></td><td>ปรับให้ค่าเฉลี่ยเป็น 0 และส่วนเบี่ยงเบนเป็น 1 เหมาะเมื่อคะแนนกระจายแบบระฆังคว่ำ</td></tr>\n          <tr><td><b>Rank Normalization</b></td><td><i>s̃</i> = 1 - (อันดับ - 1) / (<i>N</i> - 1)</td><td>ใช้เฉพาะลำดับที่ 1, 2, 3 มาแปลงสเกล แก้ปัญหาระบบที่กระจายตัวต่างกันสุดขั้วได้ดีมาก</td></tr>\n          <tr><td><b>Scale Dominance</b></td><td>สภาวะถูกครอบงำด้วยสเกล</td><td>ข้อผิดพลาดที่โมเดลช่วงกว้าง (เช่น 1-5 ดาว) กลืนผลลัพธ์ของโมเดลช่วงแคบ (เช่น 0-1) จนหมด</td></tr>\n          <tr><td><b>Probability Calibration</b></td><td>การสอบเทียบความน่าจะเป็น</td><td>การแปลงคะแนนให้เป็นเปอร์เซ็นต์โอกาสจริง (เช่น โอกาสคลิก 80%) ซึ่ง <b>Min-Max ทำไม่ได้!</b></td></tr>\n        </tbody>\n      </table>\n    </div>\n\n    <div class=\"rs-pipeline-box\">\n      <h4>ภาพตัวอย่าง: ก่อนและหลังปรับสเกลบนผู้สมัคร C1 และ C2</h4>\n      <p>กำหนดให้โมเดล A มีช่วง [0.2, 0.8] และโมเดล B มีช่วง [1.0, 5.0] พร้อมน้ำหนัก <i>w<sub>A</sub></i> = 0.6 และ <i>w<sub>B</sub></i> = 0.4:</p>\n      <div data-rs-demo=\"hy-scale\"></div>\n      <p>เห็นความแตกต่างอย่างชัดเจน: ตอนบวกคะแนนดิบ C2 ชนะเพราะได้แรงหนุนจาก 5 ดาวของฝั่ง B แต่เมื่อปรับสเกลให้เท่าเทียมกัน C1 พลิกกลับมาชนะตามเจตนารมณ์ของน้ำหนัก 60% ที่ให้กับฝั่ง A!</p>\n    </div>\n\n    <div class=\"rs-decision-box\">\n      <h4>คู่มือการตัดสินใจทางวิศวกรรม (Engineering Decision Guide)</h4>\n      <ul>\n        <li><b>กับดักความเข้าใจผิด:</b> ปรับ Min-Max แล้วได้คะแนน 0.85 <i>ไม่ได้แปลว่า</i> ผู้ใช้มีโอกาสคลิก 85%! การ Normalization เปลี่ยนเพียงสเกลตัวเลข แต่ไม่ได้แปลงคะแนนเป็นความน่าจะเป็นจริง (ไม่ใช่ Calibrated Probability)</li>\n        <li><b>กรณีคะแนนเท่ากันทุกชิ้น (min == max):</b> ถ้าทุกชิ้นในลิสต์ได้คะแนน 3 ดาวเท่ากันหมด ตัวหารจะเป็นศูนย์ (5-5=0) ทางแก้เชิงวิศวกรรมคือกำหนดค่ากลาง (เช่น 0.5) พร้อมแนบ Evidence Mask บอกว่าไม่สามารถแยกความต่างได้</li>\n      </ul>\n    </div>\n    <div class=\"callout\"><b>จำด้วยเส้นทาง:</b> รวมคะแนนข้ามแหล่ง ต้องแปลงสเกลให้เท่าเทียม · Min-Max รักษาลำดับ แต่ไม่ได้เสกให้กลายเป็นความน่าจะเป็น</div>",
    "sources": [
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 54,
        "topic": "Score Normalization"
      },
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 55,
        "topic": "Min-Max และ Z-score"
      },
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 58,
        "topic": "Scale Dominance"
      }
    ],
    "questions": [
      {
        "id": "scale-1",
        "q": "หากโมเดล Collaborative Filtering (B) ทำนายคะแนนดาวในช่วง 1 ถึง 5 ดาว และสินค้า C1 ได้รับการทำนาย 4 ดาว ค่าคะแนนหลังทำ Min-Max Normalization เข้าสู่ช่วง [0, 1] คือเท่าใด?",
        "choices": [
          "0.8000",
          "0.7500",
          "4.0000",
          "0.2500"
        ],
        "answer": 1,
        "explanation": "สูตร Min-Max คือ (s - min) / (max - min) แทนค่า: (4 - 1) / (5 - 1) = 3 / 4 = 0.7500",
        "reasons": [
          "ผิด: 0.8 เกิดจากการนำ 4/5 โดยลืมลบ min (1)",
          "ถูกต้อง: (4 - 1) / (5 - 1) = 3/4 = 0.75",
          "ผิด: 4.00 คือคะแนนดิบเดิมที่ยังไม่ได้ปรับสเกล",
          "ผิด: 0.25 เป็นระยะห่างจากค่าสูงสุด (1 - 0.75)"
        ],
        "version": 2
      },
      {
        "id": "scale-2",
        "q": "เหตุใดการนำคะแนนดิบของโมเดลเนื้อหา (ช่วง 0-1) มาบวกกับคะแนนดาวดิบของโมเดลพฤติกรรม (ช่วง 1-5) โดยตรง จึงถือเป็นข้อผิดพลาดร้ายแรงทางวิศวกรรม?",
        "choices": [
          "เพราะคะแนนดาวจะทำให้เวกเตอร์คุณลักษณะกลายเป็นเมทริกซ์ศูนย์",
          "เพราะโปรแกรมจะเกิดข้อผิดพลาดประเภท Type Error และไม่สามารถประมวลผลต่อได้",
          "เพราะโมเดลที่มีช่วงคะแนนกว้างกว่า (1-5) จะครอบงำผลลัพธ์การจัดอันดับเกือบทั้งหมด ทำให้น้ำหนักที่ตั้งไว้ผิดเพี้ยน",
          "เพราะระบบจะถูกบังคับให้เปลี่ยนไปใช้อัลกอริทึม Matrix Factorization ทันที"
        ],
        "answer": 2,
        "explanation": "คะแนนดาว 1-5 มีขนาดใหญ่กว่าคะแนน 0-1 หลายเท่า ทำให้คะแนนรวมแทบจะขึ้นอยู่กับฝั่งดาวเพียงอย่างเดียว ฝั่งเนื้อหาจะไม่มีผลชี้นำอันดับ",
        "reasons": [
          "ผิด: ไม่ได้ทำให้เวกเตอร์กลายเป็นศูนย์",
          "ผิด: ในทางคอมพิวเตอร์ ตัวเลขทศนิยมบวกกันได้ปกติ ไม่เกิด Type Error แต่ผลลัพธ์ทางธุรกิจผิดพลาด",
          "ถูกต้อง: เกิด Scale Dominance ฝั่งคะแนนใหญ่จะกลืนฝั่งคะแนนเล็กจนหมด",
          "ผิด: อัลกอริทึมไม่เปลี่ยนไปเองเพราะการบวกเลข"
        ],
        "version": 2
      },
      {
        "id": "scale-3",
        "q": "หากคะแนนของสินค้าหลังทำ Min-Max Normalization มีค่าเท่ากับ 0.90 ข้อสรุปใดถูกต้องตามหลักการทางสถิติของ RecSys?",
        "choices": [
          "สินค้านี้จะต้องได้รับเรตติ้ง 4.5 ดาวขึ้นไปในชีวิตจริงเสมอ",
          "ผู้ใช้มีโอกาสคลิกสินค้านี้ 90% อย่างแน่นอน เพราะคะแนนถูกปรับเข้าสู่ช่วง [0, 1] แล้ว",
          "โมเดลนี้ผ่านการทำ Probability Calibration สมบูรณ์แบบแล้ว",
          "สินค้านี้ได้คะแนนค่อนข้างสูงเมื่อเทียบกับจุดต่ำสุดและสูงสุดของชุดผู้สมัครนี้ แต่ไม่ได้แปลว่าผู้ใช้มีโอกาสชอบ 90%"
        ],
        "answer": 3,
        "explanation": "การทำ Score Normalization เปลี่ยนเฉพาะช่วงตัวเลขเพื่อการเปรียบเทียบ แต่ไม่ใช่การทำ Calibration ให้กลายเป็นความน่าจะเป็นจริง",
        "reasons": [
          "ผิด: ไม่ได้รับประกันเรตติ้งจริงในอนาคต",
          "ผิด: การอยู่ในช่วง [0, 1] ไม่ได้แปลว่าเป็น Calibrated Probability",
          "ผิด: การทำ Min-Max ไม่ใช่กระบวนการ Calibration ทางสถิติ",
          "ถูกต้อง: Normalization รักษาระยะสัมพัทธ์ในชุดผู้สมัคร แต่ไม่ใช่เปอร์เซ็นต์โอกาสจริง"
        ],
        "version": 2
      },
      {
        "id": "scale-4",
        "q": "ในการคำนวณ Min-Max Normalization บนชุด Candidate หากสินค้าทุกชิ้นในคำขอนั้นได้คะแนนดิบ 3.0 เท่ากันหมดทั้งชุด วิศวกรควรจัดการอย่างไร?",
        "choices": [
          "ใช้นโยบายสเกลกรณีช่วงศูนย์ เช่น กำหนดให้ได้ค่ากลาง 0.5 พร้อมแนบ Evidence Flag กำกับไว้",
          "ให้คำนวณหารด้วยศูนย์ต่อไป เพราะระบบจะแปลงเป็น Infinity โดยอัตโนมัติ",
          "ลบสินค้าทั้งหมดออกจากฐานข้อมูลเพราะไม่สามารถจัดอันดับได้",
          "แอบเติมข้อมูลคะแนนทดสอบจากอนาคตลงไปเพื่อให้ช่วงกว้างขึ้น"
        ],
        "answer": 0,
        "explanation": "เมื่อ max == min ตัวหารจะเป็นศูนย์ (3 - 3 = 0) ในทางวิศวกรรมต้องมี Guard Condition คืนค่าคงที่ (เช่น 0.5) เพื่อบอกว่าแหล่งนี้ให้คะแนนเสมอกันหมด",
        "reasons": [
          "ถูกต้อง: มีนโยบายรับมือ Division by Zero ด้วยการคืนค่ากลางและแจ้งระบบ",
          "ผิด: การปล่อยให้หารศูนย์จะทำให้ระบบพังหรือได้ NaN / Infinity",
          "ผิด: ห้ามลบสินค้าออกจากระบบเพราะเป็นแค่เรื่องคะแนนเสมอกันในรอบนี้",
          "ผิด: การแอบเติมข้อมูลเป็นการทำ Data Leakage ที่ผิดจรรยาบรรณวิศวกรรม"
        ],
        "version": 2
      }
    ]
  },
  {
    "id": "recsys-hy-weighted",
    "title": "Weighted Hybrid: การผสานคะแนนแบบถ่วงน้ำหนัก",
    "subtitle": "Burke แบบที่ 1: รันขนานกันอย่างอิสระ แล้วเฉลี่ยคะแนนตามสัดส่วนความสำคัญ",
    "desc": "เจาะลึกสมการ Linear Combination, การจูนค่าน้ำหนักบน Validation Set และการรวมอันดับด้วย Reciprocal Rank Fusion (RRF)",
    "content": "<div class=\"rs-story-box\">\n      <h4>เรื่องเล่าและที่มาในชีวิตจริง (Story & Real-World Purpose)</h4>\n      <p>เปรียบเหมือนการตัดสินในการประกวดผลงานทางวิศวกรรม:</p>\n      <ul>\n        <li><b>กรรมการ A (ผู้เชี่ยวชาญด้านโค้ด):</b> ให้คะแนนความประณีตของสถาปัตยกรรมซอฟต์แวร์</li>\n        <li><b>กรรมการ B (ผู้เชี่ยวชาญด้านธุรกิจ):</b> ให้คะแนนศักยภาพในการทำกำไรและการเติบโต</li>\n      </ul>\n      <p>ประธานคณะกรรมการกำหนดกติกาว่า <i>\"ปีนี้เราเน้นคุณภาพโค้ด ให้คะแนนกรรมการ A คิดเป็น 60% (wA = 0.6) และคะแนนกรรมการ B คิดเป็น 40% (wB = 0.4)\"</i> ทั้งสองท่านให้คะแนนในใบประเมินของตนเองอย่างเป็นอิสระ จากนั้นเลขานุการนำคะแนนมาคูณน้ำหนักแล้วรวมกัน (Weighted Sum) เพื่อประกาศผู้ชนะ!</p>\n      <p>นี่คือหัวใจของ <b>Weighted Hybrid (การผสานแบบถ่วงน้ำหนัก)</b> — รูปแบบที่เรียบง่าย ยอดนิยม และถูกนำไปใช้งานจริงมากที่สุดในโลก</p>\n    </div>\n\n    <div class=\"rs-terms-box\">\n      <h4>ถอดรหัสคำศัพท์และตัวย่อสำคัญ (Key Terms Decoded)</h4>\n      <table class=\"rs-term-table\">\n        <thead><tr><th>คำศัพท์ / สัญลักษณ์</th><th>คำอ่าน & ความหมายเชิงระบบ</th><th>หน้าที่ในโมเดล Weighted</th></tr></thead>\n        <tbody>\n          <tr><td><b>Weighted Hybrid</b></td><td>การผสานแบบถ่วงน้ำหนัก (Late Fusion)</td><td>ให้แต่ละโมเดลทำนายคะแนนอย่างอิสระ แล้วนำผลลัพธ์สุดท้ายมาเฉลี่ยรวมกัน</td></tr>\n          <tr><td><b><i>w<sub>A</sub></i>, <i>w<sub>B</sub></i></b></td><td>ค่าน้ำหนักความสำคัญ (Weights)</td><td>สัมประสิทธิ์ถ่วงน้ำหนัก โดยมีเงื่อนไขมาตรฐานว่า <i>w<sub>A</sub></i> + <i>w<sub>B</sub></i> = 1.0 และ <i>w</i> ≥ 0</td></tr>\n          <tr><td><b>RRF</b></td><td>Reciprocal Rank Fusion</td><td>การรวมผลโดยใช้ <b>อันดับ (Rank)</b> แทนการใช้คะแนน: RRF(<i>i</i>) = Σ 1 / (<i>κ</i> + <i>r</i>(<i>i</i>))</td></tr>\n          <tr><td><b><i>κ</i> (Kappa)</b></td><td>พารามิเตอร์คงที่ความเรียบ (Smoothing Constant)</td><td>ค่าคงที่ใน RRF (ปกติใช้ค่า 60) เพื่อป้องกันไม่ให้อันดับ 1 ได้คะแนนสูงจนครอบงำอันดับอื่นเกินไป</td></tr>\n        </tbody>\n      </table>\n    </div>\n\n    <div class=\"rs-pipeline-box\">\n      <h4>โครงสร้างการทำงานและสมการคณิตศาสตร์</h4>\n      <p class=\"rs-hybrid-legend\"><span class=\"rs-hy-a\">A · เนื้อหา Content-based</span><span class=\"rs-hy-b\">B · พฤติกรรม Collaborative</span></p>\n      <div class=\"rs-hy-parallel\" role=\"group\" aria-label=\"Weighted Hybrid Workflow\"><p class=\"rs-hy-parallel-label\">สองฝั่งทำงานแยกกัน</p><div class=\"rs-hy-inputs\"><div class=\"rs-hy-node rs-hy-a\"><b>โมเดล A (Content-based)</b><span>ทำนายคะแนนเนื้อหา → ปรับสเกลเป็น s̃A</span></div><div class=\"rs-hy-node rs-hy-b\"><b>โมเดล B (Collaborative)</b><span>ทำนายคะแนนพฤติกรรม → ปรับสเกลเป็น s̃B</span></div></div><div class=\"rs-hy-join\" aria-hidden=\"true\">↘ &nbsp; จุดเชื่อม &nbsp; ↙</div><div class=\"rs-hy-node\"><b>รวมคะแนนถ่วงน้ำหนัก</b><span>Score = wA·s̃A + (1-wA)·s̃B → จัดอันดับ Top-K</span></div></div>\n      \n      <p>เมื่อทั้งสองแหล่งมีหลักฐานพร้อม สมการคำนวณคือ:</p>\n      <div class=\"formula\">Score(u, i) = w_A · s̃_A(u, i) + (1 - w_A) · s̃_B(u, i)</div>\n      <div data-rs-demo=\"hy-weighted\"></div>\n\n      <details class=\"rs-reading-note\"><summary>อ่านลึก: การรวมอันดับด้วย RRF (Reciprocal Rank Fusion) เมื่อคะแนนไม่น่าเชื่อถือ</summary>\n        <p>ในหลายระบบ คะแนนดิบของแต่ละโมเดลมีรูปร่างการกระจายตัวต่างกันมาก หรือไม่สามารถ Normalize ให้อยู่ในสเกลเดียวกันได้ง่ายๆ วิศวกรจึงนิยมใช้ <b>RRF (Reciprocal Rank Fusion)</b> ซึ่งพิจารณาเฉพาะ <i>อันดับที่ (Rank)</i> ของไอเท็มในแต่ละโมเดล:</p>\n        <div class=\"formula\">RRF(i) = \\sum_{c \\in \\{A, B\\}} \\frac{1}{\\kappa + r_c(i)}</div>\n        <p>โดยที่ <i>r<sub>c</sub>(i)</i> คืออันดับของไอเท็ม <i>i</i> ในลิสต์ของโมเดล <i>c</i> (อันดับ 1, 2, 3...) และ <i>κ</i> คือ Smoothing factor (ค่ามาตรฐานคือ 60)</p>\n        <ul>\n          <li><b>ข้อดีของ RRF:</b> ไม่ต้องสนใจว่าโมเดลจะคายคะแนนออกมาเป็นช่วงไหน ไม่ต้องกังวลเรื่อง Outlier และจูนง่ายมาก</li>\n          <li><b>กรณีอันดับเสมอ (Ties):</b> ให้ใช้ Average Rank เช่น ถ้าเสมอกันที่อันดับ 2 และ 3 ให้ใช้อันดับ 2.5 ทั้งคู่</li>\n        </ul>\n      </details>\n    </div>\n\n    <div class=\"rs-decision-box\">\n      <h4>คู่มือการตัดสินใจทางวิศวกรรม (Engineering Decision Guide)</h4>\n      <ul>\n        <li><b>การจูนค่าน้ำหนัก w:</b> ต้องแบ่งชุดข้อมูลเป็น Train, Validation, และ Test เสมอ โดยหาค่า <i>w</i> ที่ดีที่สุดบน <b>Validation Set</b> ห้ามแอบใช้ Test Set มาลองหาค่าน้ำหนักเด็ดขาด เพราะจะเกิดปัญหา Data Leakage และทำให้ระบบล้มเหลวเมื่อนำไปขึ้น Production</li>\n        <li><b>จุดเด่น:</b> ทำงานแบบขนาน (Parallel Architecture) ได้ดีเยี่ยม โมเดล A และ B สามารถรันบนเซิร์ฟเวอร์คนละเครื่อง แล้วส่งคะแนนมารวมกันที่ API Gateway ในเวลาไม่กี่มิลลิวินาที</li>\n      </ul>\n    </div>\n    <div class=\"callout\"><b>จำด้วยเส้นทาง:</b> สองโมเดลคำนวณขนาน → คูณน้ำหนัก w แล้วจับบวกกัน → Weighted Hybrid คือราชาแห่ง Late Fusion</div>",
    "sources": [
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 65,
        "topic": "Weighted Hybrid Architecture"
      },
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 66,
        "topic": "ตัวอย่างการรวมคะแนน"
      },
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 75,
        "topic": "การจูนน้ำหนักบน Validation"
      },
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 83,
        "topic": "Reciprocal Rank Fusion RRF"
      }
    ],
    "questions": [
      {
        "id": "weighted-1",
        "q": "กำหนดให้สินค้า C1 มีคะแนนปรับสเกลแล้ว s̃A = 1.00, s̃B = 0.75 และกำหนดน้ำหนัก wA = 0.6 (wB = 0.4) คะแนนรวม Weighted Hybrid ของ C1 คือเท่าใด?",
        "choices": [
          "1.7500",
          "0.9000",
          "0.8000",
          "0.7500"
        ],
        "answer": 1,
        "explanation": "สูตรคือ Score = wA * s̃A + wB * s̃B = (0.6 * 1.00) + (0.4 * 0.75) = 0.60 + 0.30 = 0.9000",
        "reasons": [
          "ผิด: 1.75 คือการบวกคะแนนดิบ 1.00 + 0.75 โดยไม่ได้คูณน้ำหนัก",
          "ถูกต้อง: (0.6 * 1.0) + (0.4 * 0.75) = 0.6 + 0.3 = 0.90",
          "ผิด: 0.80 เป็นคะแนนของสินค้า C2 ในตัวอย่าง",
          "ผิด: 0.75 เป็นคะแนนของฝั่ง B เพียงอย่างเดียว"
        ],
        "version": 2
      },
      {
        "id": "weighted-2",
        "q": "สถาปัตยกรรมแบบ Weighted Hybrid มีลักษณะการทำงานของโมเดลส่วนประกอบอย่างไร?",
        "choices": [
          "นำฟีเจอร์ของทุกโมเดลมารวมกันเป็นเวกเตอร์เดี่ยวก่อนเริ่มฝึกสอนโมเดลเพียงตัวเดียว",
          "โมเดลแรกคัดกรองสินค้าให้เหลือจำนวนน้อยลง แล้วส่งต่อให้โมเดลที่สองจัดอันดับต่อ",
          "โมเดลแต่ละตัวทำงานทำนายคะแนนอย่างอิสระต่อกัน (Parallel) แล้วนำคะแนนผลลัพธ์มาถ่วงน้ำหนักรวมกันในขั้นตอนสุดท้าย",
          "ระบบจะสลับใช้เพียงโมเดลใดโมเดลหนึ่งเท่านั้นตามเงื่อนไขที่กำหนดไว้"
        ],
        "answer": 2,
        "explanation": "Weighted Hybrid จัดเป็น Parallel / Late Fusion ที่แต่ละโมเดลคำนวณคะแนนของตัวเองขนานกัน แล้วนำคะแนนมารวมกันตอนท้าย",
        "reasons": [
          "ผิด: การรวมฟีเจอร์ก่อนฝึกโมเดลเดียวคือ Feature Combination",
          "ผิด: การคัดกรองแล้วส่งต่อคือ Cascade Hybrid",
          "ถูกต้อง: รันขนานกันอย่างอิสระ แล้วนำ Output Score มาถ่วงน้ำหนักรวมกัน",
          "ผิด: การสลับเลือกเพียงหนึ่งโมเดลคือ Switching Hybrid"
        ],
        "version": 2
      },
      {
        "id": "weighted-3",
        "q": "ในการพัฒนาระบบจริง วิศวกรควรปรับจูนค่าน้ำหนัก (Weight Tuning) ของแต่ละโมเดลจากชุดข้อมูลใดเพื่อป้องกัน Data Leakage?",
        "choices": [
          "เลือกตัวเลขที่ชอบตามความรู้สึกโดยไม่ต้องทดสอบกับข้อมูลใดๆ",
          "ชุดข้อมูลทดสอบ (Test Set) ที่ใช้ในการประเมินผลสรุปขั้นสุดท้าย",
          "ชุดข้อมูลที่ได้ผลคะแนนดิบสูงที่สุดเสมอโดยไม่ต้องแบ่งชุดข้อมูล",
          "ชุดข้อมูลตรวจสอบ (Validation Set) ที่แยกต่างหากจากชุดทดสอบ (Test Set)"
        ],
        "answer": 3,
        "explanation": "ค่าน้ำหนัก w เป็น Hyperparameter ที่ต้องปรับจูนบน Validation Set เสมอ ห้ามแตะต้อง Test Set จนกว่าจะถึงการวัดผลสรุป",
        "reasons": [
          "ผิด: การตั้งค่าน้ำหนักโดยไม่อิงข้อมูลจะทำให้ระบบทำงานได้แย่",
          "ผิด: การจูนบน Test Set ทำให้ผลการประเมินลำเอียงและเกิด Overfitting (Data Leakage)",
          "ผิด: ต้องมีการแบ่งชุดข้อมูลอย่างเป็นระบบเพื่อวัดผลทางสถิติ",
          "ถูกต้อง: ปรับจูนบน Validation Set เพื่อให้ได้ค่าที่ Generalize ได้จริง"
        ],
        "version": 2
      },
      {
        "id": "weighted-4",
        "q": "เทคนิค Reciprocal Rank Fusion (RRF) มีความแตกต่างจากการรวมคะแนนแบบ Weighted Sum ทั่วไปอย่างไร?",
        "choices": [
          "RRF ใช้อันดับที่ (Rank) ของไอเท็มในแต่ละโมเดลมาคำนวณส่วนกลับ แทนที่จะใช้ขนาดคะแนนดิบ (Scores)",
          "RRF ต้องใช้ข้อมูลเรตติ้งดาวจริงของผู้ใช้ในขณะให้บริการแบบเรียลไทม์เสมอ",
          "RRF ไม่มีพารามิเตอร์ใดๆ ให้ต้องปรับจูนเลยแม้แต่ตัวเดียว",
          "RRF บังคับว่าโมเดลส่วนประกอบทุกตัวจะต้องมีความแม่นยำเท่ากัน 100%"
        ],
        "answer": 0,
        "explanation": "RRF รวมผลโดยคำนวณจากส่วนกลับของอันดับ 1 / (κ + r) ทำให้ไม่ต้องพึ่งพาสเกลคะแนนดิบของแต่ละโมเดล",
        "reasons": [
          "ถูกต้อง: ใช้ตำแหน่งอันดับ (Rank) แทนขนาดคะแนนดิบ ทำให้ไม่ต้องกังวลเรื่องสเกลที่ไม่เท่ากัน",
          "ผิด: RRF ใช้อันดับที่แต่ละโมเดลทำนายออกมา ไม่จำเป็นต้องรู้ดาวจริงตอนเสิร์ฟ",
          "ผิด: RRF ยังมีพารามิเตอร์ κ (Kappa) และนโยบายตัดความยาวลิสต์",
          "ผิด: RRF ไม่ได้บังคับว่าโมเดลต้องแม่นยำเท่ากัน"
        ],
        "version": 2
      }
    ]
  },
  {
    "id": "recsys-hy-evidence",
    "title": "Evidence-Aware Normalization: ศูนย์ไม่เหมือนกับไม่มีข้อมูล",
    "subtitle": "แก้กับดัก Missing Evidence เมื่อระบบใดระบบหนึ่งไม่มีประวัติของผู้ใช้หรือไอเท็ม",
    "desc": "ทำความเข้าใจ Evidence Mask m_c, การปรับน้ำหนักใหม่เมื่อข้อมูลหาย และการป้องกัน Imputation Bias",
    "content": "<div class=\"rs-story-box\">\n      <h4>เรื่องเล่าและที่มาในชีวิตจริง (Story & Real-World Purpose)</h4>\n      <p>จินตนาการว่าคุณเป็นกรรมการคัดเลือกทุนการศึกษา มีผู้สมัคร 2 คน:</p>\n      <ul>\n        <li><b>นาย C3:</b> สอบวิชาภาษาอังกฤษได้เกรด C (ได้คะแนนจริงจากการสอบ)</li>\n        <li><b>นาย C4:</b> เพิ่งย้ายโรงเรียนมา ยังไม่ได้สอบวิชาภาษาอังกฤษเลย (Missing — ไม่มีข้อมูล)</li>\n      </ul>\n      <p>ถ้าระบบคิดแบบมักง่าย (Naive) โดยบอกว่า <i>\"เมื่อไม่มีคะแนน ให้เอาคะแนนเฉลี่ยของคนทั้งประเทศ (เกรด B+) ใส่แทนไปก่อน\"</i> ผลลัพธ์วิปริตจะเกิดขึ้นทันที: นาย C4 ที่ไม่เคยเข้าสอบ จะได้เกรด B+ และเบียดนาย C3 ตกรอบ ทั้งๆ ที่นาย C4 ยังไม่เคยพิสูจน์ความสามารถใดๆ เลย!</p>\n      <p>ในระบบแนะนำก็เจอปัญหานี้เช่นกัน: เมื่อคอร์ส C4 เป็นคอร์สใหม่แกะกล่อง ฝั่งเนื้อหา A มีข้อมูล (หลัง Normalize ได้ 0.0) แต่ฝั่งพฤติกรรม B ไม่มีประวัติเลย หากใช้ Weighted Hybrid แบบไม่ตรวจหลักฐาน แล้วแอบเอาค่าเฉลี่ยระบบ (Fallback = 4 ดาว → ปรับแล้วได้ 0.75) มาคำนวณ:</p>\n      <div class=\"formula\">Score_{\\text{Naive}}(C4) = 0.6(0.0) + 0.4(0.75) = 0.3000 > Score(C3) = 0.2000</div>\n      <p>คอร์สใหม่ที่ไม่มีใครรีวิว กลับได้คะแนนสูงกว่าคอร์ส C3 ที่มีประวัติจริง! นี่คือหลุมพรางที่เรียกว่า <b>Imputation Bias</b></p>\n    </div>\n\n    <div class=\"rs-terms-box\">\n      <h4>ถอดรหัสคำศัพท์และตัวย่อสำคัญ (Key Terms Decoded)</h4>\n      <table class=\"rs-term-table\">\n        <thead><tr><th>คำศัพท์ / สัญลักษณ์</th><th>คำอ่าน & ความหมายเชิงระบบ</th><th>บทบาทในการกู้ชีพข้อมูล</th></tr></thead>\n        <tbody>\n          <tr><td><b>Evidence Mask (<i>m<sub>c</sub></i>)</b></td><td>ธงระบุความพร้อมของหลักฐาน</td><td>ตัวแปรบอกสถานะ: มีค่าเป็น <b>1</b> เมื่อมีข้อมูลจริง และเป็น <b>0</b> เมื่อไม่มีหลักฐาน (Missing)</td></tr>\n          <tr><td><b>Missing vs Zero</b></td><td>ข้อมูลหาย vs คะแนนเป็นศูนย์</td><td>\"0\" คือมีหลักฐานว่าอยู่ต่ำสุดในสเกล แต่ \"Missing\" คือไม่มีเสียง/ไม่มีข้อมูล ห้ามตีความปนกัน!</td></tr>\n          <tr><td><b>Renormalization (<i>D</i>)</b></td><td>การปรับฐานน้ำหนักใหม่</td><td>ผลรวมน้ำหนักของแหล่งที่มีหลักฐานจริง: <i>D</i> = Σ <i>w<sub>c</sub></i> · <i>m<sub>c</sub></i></td></tr>\n          <tr><td><b>Fallback Policy</b></td><td>แผนสำรองฉุกเฉินเมื่อไร้หลักฐาน</td><td>นโยบายจัดการเมื่อทุกโมเดลไม่มีข้อมูลเลย (<i>D</i> = 0) เช่น แสดงสินค้าติดชาร์ตยอดนิยม หรือไม่แสดง</td></tr>\n        </tbody>\n      </table>\n    </div>\n\n    <div class=\"rs-pipeline-box\">\n      <h4>กลไกการคำนวณ Evidence-Aware Fusion</h4>\n      <p>เมื่อมีโมเดลหลายแหล่ง เราต้องตรวจสอบ <i>Evidence Mask</i> ก่อนเสมอ:</p>\n      <div class=\"formula\">เมื่อ \\ D = \\sum_c w_c m_c > 0: \\quad Score(u, i) = \\frac{\\sum_c w_c m_c \\tilde{s}_c}{D}<br>เมื่อ \\ D = 0: \\quad \\text{เรียกใช้ Fallback Policy แยกต่างหาก (ห้ามหารศูนย์)}</div>\n      <div data-rs-demo=\"hy-evidence\"></div>\n      <p>เมื่อนำมาใช้กับสินค้า <b>C4</b> (ฝั่ง A มีหลักฐาน <i>m<sub>A</sub></i>=1 แต่ฝั่ง B ไร้หลักฐาน <i>m<sub>B</sub></i>=0):</p>\n      <ul>\n        <li>น้ำหนักรวมที่เหลืออยู่: <i>D</i> = (0.6 × 1) + (0.4 × 0) = 0.6</li>\n        <li>คะแนนรวมที่ถูกต้อง: <code>(0.6 × 1 × 0.0 + 0) / 0.6 = 0.0000</code> (ไม่ถูกค่า Fallback ของ B ดันขึ้นมาหลอกตา!)</li>\n      </ul>\n      <p>และสำหรับสินค้า <b>C5</b> ที่ไม่มีหลักฐานทั้งฝั่ง A และ B (<i>m<sub>A</sub></i>=0, <i>m<sub>B</sub></i>=0): ตัวหาร <i>D</i> = 0 ระบบจะไม่หารด้วยศูนย์และไม่โมเมว่าได้คะแนน 0 แต่จะส่งต่อให้ Fallback Policy จัดการอย่างเป็นระบบ</p>\n    </div>\n\n    <div class=\"rs-decision-box\">\n      <h4>คู่มือการตัดสินใจทางวิศวกรรม (Engineering Decision Guide)</h4>\n      <ul>\n        <li><b>กับดักโปรแกรมเมอร์:</b> ห้ามตรวจสอบหลักฐานด้วยคำสั่ง <code>if (score)</code> หรือ <code>if (score > 0)</code> เด็ดขาด! เพราะถ้าคะแนนที่แท้จริงมีค่าเป็น <code>0.0</code> (เช่น Min-Max ได้ 0 หรือ Cosine ได้ 0) คำสั่งนี้จะเข้าใจผิดว่าไม่มีข้อมูล! ต้องส่งธง <code>mask === true</code> หรือเก็บ <code>null</code> แยกต่างหาก</li>\n        <li><b>การรับรองความปลอดภัย:</b> เมื่อระบบเจอกรณี <i>D</i> = 0 ต้องมีระบบ Fallback รองรับ เช่น สลับไปดึงสินค้ายอดนิยมประจำสัปดาห์ (Popularity Baseline) หรือแนะนำตามหมวดหมู่ใหญ่</li>\n      </ul>\n    </div>\n    <div class=\"callout\"><b>จำด้วยเส้นทาง:</b> ถามว่า \"รู้ไหม\" ก่อนถามว่า \"รู้สึกเท่าไร\" · Missing ไม่มีเสียง · ศูนย์มีเสียงว่าต่ำสุดในสเกล</div>",
    "sources": [
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 60,
        "topic": "Score ที่ไม่มีหลักฐาน"
      },
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 61,
        "topic": "Normalization ไม่แก้ Missing"
      },
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 71,
        "topic": "Evidence-Aware Normalization"
      },
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 72,
        "topic": "Mask และการปรับน้ำหนักใหม่"
      }
    ],
    "questions": [
      {
        "id": "evidence-1",
        "q": "สินค้า C4 มีคะแนนเนื้อหาปรับสเกลแล้ว s̃A = 0.00 พร้อมหลักฐานจริง แต่ฝั่งพฤติกรรม B ไม่มีหลักฐาน (Missing) ระบบ Evidence-Aware ควรคำนวณคะแนนอย่างไร?",
        "choices": [
          "ทิ้งคะแนนฝั่ง A ไปด้วย เพราะค่า 0.00 แปลว่าไม่มีข้อมูล",
          "ตัดน้ำหนักฝั่ง B ออก แล้วปรับสเกลให้น้ำหนักฝั่ง A เป็น 100% (ทำให้ได้คะแนน 0.00 ตามหลักฐานที่มี)",
          "หยิบค่าเฉลี่ยระบบของ B (Fallback 4 ดาว) มารวมเพื่อไม่ให้คะแนนเป็นศูนย์",
          "ลบคอร์ส C4 ออกจากสารบบเพื่อป้องกันข้อผิดพลาด"
        ],
        "answer": 1,
        "explanation": "Evidence-Aware จะตัดแหล่งที่ไม่มีหลักฐานออก แล้วปรับให้น้ำหนักของแหล่งที่มีข้อมูลกลายเป็น 100% ของตัวหาร",
        "reasons": [
          "ผิด: ค่า 0.00 ที่มีหลักฐานเป็นข้อมูลจริงที่มีความหมาย ไม่ใช่ข้อมูลหาย",
          "ถูกต้อง: ให้น้ำหนักเต็มแก่ฝั่งที่มีหลักฐานจริง และไม่นำค่าสมมุติของ B มารวม",
          "ผิด: การหยิบ Fallback มาปนจะทำให้เกิด Imputation Bias ดันคะแนนเกินจริง",
          "ผิด: สินค้าใหม่ที่มีเนื้อหายังสามารถแนะนำได้ ไม่ควรลบทิ้ง"
        ],
        "version": 2
      },
      {
        "id": "evidence-2",
        "q": "ในกรณีที่สินค้า C5 ไม่มีหลักฐานทั้งจากฝั่งเนื้อหา (A) และฝั่งพฤติกรรม (B) ส่งผลให้ตัวหารรวม D = 0 สถาปัตยกรรมระบบแนะนำควรจัดการอย่างไร?",
        "choices": [
          "สรุปทันทีว่าผู้ใช้เกลียดสินค้านี้ 100% จึงให้คะแนนต่ำสุด",
          "บังคับให้คำนวณหารด้วยศูนย์ต่อไป แล้วแปลงค่าเป็น 0 ดาว",
          "ส่งคำขอนี้ไปยัง Fallback Policy ที่กำหนดไว้ล่วงหน้า (เช่น แนะนำสินค้าฮิต) และไม่ทำการหารด้วยศูนย์",
          "แอบดึงข้อมูลจากชุดทดสอบ (Test Set) มาใส่เป็นคำตอบล่วงหน้า"
        ],
        "answer": 2,
        "explanation": "เมื่อ D = 0 แสดงว่าทุกโมเดลไม่มีความรู้เกี่ยวกับคู่นี้เลย ระบบต้องมี Fallback Policy จัดการอย่างชัดเจนโดยไม่หารศูนย์",
        "reasons": [
          "ผิด: การไม่มีข้อมูลไม่ได้แปลว่าผู้ใช้เกลียด",
          "ผิด: การหารศูนย์ผิดหลักคณิตศาสตร์และทำให้ซอฟต์แวร์พัง",
          "ถูกต้อง: สลับไปใช้ Fallback Policy เมื่อไม่มีโมเดลใดมีความรู้",
          "ผิด: การดึงข้อมูล Test เป็น Data Leakage"
        ],
        "version": 2
      },
      {
        "id": "evidence-3",
        "q": "เหตุใดการคำนวณแบบไม่ตรวจสอบหลักฐาน (Naive Weighted) ที่ทำให้สินค้า C4 ได้คะแนน 0.30 จึงถือเป็นข้อบกพร่องร้ายแรง?",
        "choices": [
          "เพราะสินค้า C4 ต้องได้คะแนนเต็ม 1.0 เสมอในฐานะสินค้าใหม่",
          "เพราะตัวเลข 0.30 ไม่อยู่ในช่วงที่กำหนด [0, 1]",
          "เพราะระบบไม่ได้รับอนุญาตให้ใช้ตัวเลขทศนิยมในการคำนวณ",
          "เพราะคะแนน 0.30 ส่วนใหญ่มาจากค่า Fallback หลอกตาของ B ทำให้ดันสินค้าไร้ประวัติขึ้นแซงสินค้า C3 ที่มีประวัติจริง"
        ],
        "answer": 3,
        "explanation": "คะแนน 0.30 เกิดจากการเอา Fallback ที่ไม่มีหลักฐานมารวม ทำให้สินค้าไร้ประวัติแซงสินค้าที่มีข้อมูลจริงอย่างไม่เป็นธรรม",
        "reasons": [
          "ผิด: สินค้าใหม่ไม่จำเป็นต้องได้คะแนนเต็ม",
          "ผิด: 0.30 อยู่ในช่วง [0, 1] ได้ แต่ปัญหาอยู่ที่ความชอบธรรมของที่มาข้อมูล",
          "ผิด: ระบบสามารถคำนวณทศนิยมได้ตามปกติ",
          "ถูกต้อง: เกิด Imputation Bias ดันสินค้าที่ไม่มีหลักฐานให้ได้เปรียบ"
        ],
        "version": 2
      },
      {
        "id": "evidence-4",
        "q": "เหตุใดโปรแกรมเมอร์จึงไม่ควรเขียนโค้ดตรวจสอบหลักฐานด้วยคำสั่งเงื่อนไข เช่น `if (score)` ใน JavaScript/Python?",
        "choices": [
          "เพราะหากคะแนนที่ถูกต้องจริงมีค่าเป็น 0.00 คำสั่ง `if (score)` จะประเมินเป็น False และทำให้ทิ้งข้อมูลจริงไปอย่างผิดพลาด",
          "เพราะคำสั่ง if-else ทำงานได้ช้าเกินไปในระบบขนาดใหญ่",
          "เพราะภาษาโปรแกรมไม่อนุญาตให้ใช้คำสั่ง if กับตัวเลขทศนิยม",
          "เพราะระบบแนะนำจะสลับไปเป็น Content-based ทันทีที่เจอคำสั่ง if"
        ],
        "answer": 0,
        "explanation": "ในภาษาอย่าง JS และ Python ค่า 0.0 ถือเป็น Falsy value การเช็ก if(score) จะทำให้คะแนน 0.0 ที่มีหลักฐานถูกเข้าใจผิดว่าเป็นค่าว่าง (Missing)",
        "reasons": [
          "ถูกต้อง: ค่า 0.0 เป็นตัวเลขจริงแต่เป็น Falsy จึงต้องเช็กสถานะ Mask หรือ null แยกต่างหาก",
          "ผิด: if-else พื้นฐานทำงานเร็วมาก ไม่ใช่ปัญหาความเร็ว",
          "ผิด: ภาษาโปรแกรมรองรับ if กับตัวเลขทศนิยมได้สมบูรณ์",
          "ผิด: อัลกอริทึมไม่เปลี่ยนไปเองเพราะคำสั่ง if"
        ],
        "version": 2
      }
    ]
  },
  {
    "id": "recsys-hy-switch",
    "title": "Switching Hybrid: สลับโมเดลตามความพร้อมของสถานการณ์",
    "subtitle": "Burke แบบที่ 2: ตั้งประตูกล (Gating Condition) เลือกว่าจังหวะนี้ใครควรเป็นคนตอบ",
    "desc": "เจาะลึกกฎเกณฑ์การสลับโมเดลด้วย Support Threshold θ, การเลือกใช้โมเดลเดียว และข้อจำกัดระดับคู่ผู้ใช้-ไอเท็ม",
    "content": "<div class=\"rs-story-box\">\n      <h4>เรื่องเล่าและที่มาในชีวิตจริง (Story & Real-World Purpose)</h4>\n      <p>เปรียบเหมือนการจัดแผนกในโรงพยาบาล:</p>\n      <ul>\n        <li><b>แพทย์เฉพาะทางด้านโรคหัวใจ (โมเดล B - Collaborative):</b> เชี่ยวชาญมาก ละเอียดมาก แต่ต้องอาศัยผลตรวจเลือด คลื่นหัวใจ และประวัติคนไข้ที่ละเอียดมากเท่านั้นถึงจะวินิจฉัยได้</li>\n        <li><b>แพทย์เวชปฏิบัติทั่วไป (โมเดล A - Content-based):</b> อาศัยการตรวจดูอาการภายนอก ซักประวัติเบื้องต้น สามารถให้การดูแลเบื้องต้นได้ทันทีแม้ไม่เคยมีประวัติคนไข้มาก่อน</li>\n      </ul>\n      <p>เมื่อคนไข้เดินเข้ามา พยาบาลคัดกรอง (Triage / Gate) จะตรวจก่อนว่า <i>\"มีผลแล็บตรวจหัวใจมาด้วยไหม?\"</i> ถ้ามี (ผ่านเกณฑ์ความพร้อม) ก็ส่งไปพบแพทย์เฉพาะทางทันที แต่ถ้าไม่มีผลแล็บ ก็ให้พบแพทย์ทั่วไป</p>\n      <p>นี่คือหัวใจของ <b>Switching Hybrid (การผสานแบบสลับ)</b> — เราไม่เอาความเห็นของแพทย์ทั้งสองท่านมาเฉลี่ยกันคนละครึ่ง แต่เราเลือกว่า <b>ใครคือคนที่เหมาะสมที่สุดในการตอบคำถามนี้</b> เพียงคนเดียว!</p>\n    </div>\n\n    <div class=\"rs-terms-box\">\n      <h4>ถอดรหัสคำศัพท์และตัวย่อสำคัญ (Key Terms Decoded)</h4>\n      <table class=\"rs-term-table\">\n        <thead><tr><th>คำศัพท์ / สัญลักษณ์</th><th>คำอ่าน & ความหมายเชิงระบบ</th><th>หน้าที่ในระบบ Switching</th></tr></thead>\n        <tbody>\n          <tr><td><b>Switching Hybrid</b></td><td>การผสานแบบสลับโมเดล</td><td>สถาปัตยกรรมที่เลือกระบบแนะนำ <b>เพียง 1 ระบบ</b> มาทำหน้าที่ในแต่ละสถานการณ์ตามเงื่อนไขที่กำหนด</td></tr>\n          <tr><td><b>Gating Criterion / Router</b></td><td>ประตูกล / ตัวคัดแยกเส้นทาง</td><td>ฟังก์ชันเงื่อนไข (เช่น if/else หรือโมเดลจำแนก) ที่ตัดสินใจว่าจะส่งคำขอนี้ไปให้โมเดลใดประมวลผล</td></tr>\n          <tr><td><b>Support Threshold (<i>θ</i>)</b></td><td>เกณฑ์ขีดเริ่มเปลี่ยนจำนวนหลักฐาน</td><td>จำนวนปฏิสัมพันธ์ขั้นต่ำในชุดฝึก (เช่น <i>n<sub>i</sub></i> ≥ 2 คน) ที่ยอมรับให้โมเดล Collaborative เริ่มทำงานได้</td></tr>\n          <tr><td><b>Pair-Level Evidence</b></td><td>หลักฐานระดับคู่ (ผู้ใช้, ไอเท็ม)</td><td>การตรวจสอบว่าผู้ใช้เป้าหมาย <i>u</i> มีเพื่อนบ้านที่เคยใช้ไอเท็ม <i>i</i> จริงหรือไม่ ไม่ใช่ดูแค่จำนวนคนชอบไอเท็มรวม</td></tr>\n        </tbody>\n      </table>\n    </div>\n\n    <div class=\"rs-pipeline-box\">\n      <h4>แผนภาพเส้นทางการตัดสินใจของ Switching Hybrid</h4>\n      <p class=\"rs-hybrid-legend\"><span class=\"rs-hy-a\">A · เนื้อหา Content-based</span><span class=\"rs-hy-b\">B · พฤติกรรม Collaborative</span></p>\n      <div class=\"rs-hybrid-route\" role=\"group\" aria-label=\"Switching Hybrid Pipeline\"><div class=\"rs-hy-node rs-hy-out\"><b>1 · ประตูกล (Gate)</b><span>ตรวจจำนวนหลักฐาน nᵢ ≥ θ และความพร้อม</span></div><span class=\"rs-hy-arrow\" aria-hidden=\"true\">→</span><div class=\"rs-hy-node rs-hy-b\"><b>2 · เลือกระบบเดียว</b><span>ถ้าผ่านใช้ B (CF) · ถ้าไม่ผ่านใช้ A (Content)</span></div><span class=\"rs-hy-arrow\" aria-hidden=\"true\">→</span><div class=\"rs-hy-node rs-hy-out\"><b>3 · ส่งคะแนนเดียว</b><span>ใช้ผลจากโมเดลที่เลือกไปจัดอันดับ</span></div></div>\n      \n      <p>กติกาการสลับที่ประกาศในระบบสาธิต (กำหนดเกณฑ์ <i>θ</i> = 2):</p>\n      <div class=\"formula\">\\text{Route}(u, i) = \\begin{cases} \\text{Model B (CF)} & \\text{เมื่อ } n_i \\ge \\theta \\text{ และ B พร้อมใช้งาน} \\\\ \\text{Model A (Content)} & \\text{เมื่อ A พร้อมใช้งาน} \\\\ \\text{Fallback Baseline} & \\text{เมื่อไม่มีโมเดลใดพร้อมเลย} \\end{cases}</div>\n      <div data-rs-demo=\"hy-switch\"></div>\n    </div>\n\n    <div class=\"rs-decision-box\">\n      <h4>คู่มือการตัดสินใจทางวิศวกรรม (Engineering Decision Guide)</h4>\n      <ul>\n        <li><b>ประหยัดทรัพยากร:</b> ข้อดีใหญ่ของ Switching คือ <i>ไม่ต้องรันทุกโมเดลพร้อมกัน</i> ถ้าคำขอเข้าเกณฑ์โมเดล B ระบบก็เรียกเฉพาะโมเดล B เซิร์ฟเวอร์ไม่ต้องแบกภาระคำนวณโมเดล A ให้เปลือง CPU/GPU</li>\n        <li><b>กับดัก Item-level vs Pair-level:</b> การที่สินค้า C1 มีคนชอบ 4 คน (<i>n<sub>i</sub></i> ≥ 2) ไม่ได้รับประกันว่าผู้ใช้ใหม่ที่เพิ่งสมัครเข้ามาจะมีประวัติเชื่อมโยงกับ 4 คนนั้น! ดังนั้นในระบบขั้นสูง ตัว Gating ต้องเช็กทั้งความพร้อมของไอเท็มและความพร้อมของตัวผู้ใช้เองด้วย</li>\n      </ul>\n    </div>\n    <div class=\"callout\"><b>จำด้วยเส้นทาง:</b> มี if/else เลือกผู้เชี่ยวชาญหนึ่งคน → Switching · ถ้าทุกคนได้ออกเสียงเป็นสัดส่วน → Weighted</div>",
    "sources": [
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 90,
        "topic": "Switching Hybrid และเกณฑ์ θ"
      },
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 91,
        "topic": "ตัวอย่างการสลับเส้นทาง"
      },
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 94,
        "topic": "ข้อสังเกตและข้อจำกัด"
      }
    ],
    "questions": [
      {
        "id": "switch-1",
        "q": "ในการประมวลผลสินค้า C1 ซึ่งมีประวัติคนชอบในชุดฝึก n_C1 = 4 คน โดยระบบตั้งเกณฑ์ θ = 2 และโมเดล B มีความพร้อม ระบบ Switching Hybrid จะทำงานอย่างไร?",
        "choices": [
          "คำนวณคะแนนจากทั้งโมเดล A และ B แล้วนำมาเฉลี่ยครึ่งต่อครึ่ง",
          "เลือกส่งคำขอให้โมเดล B (Collaborative) ประมวลผลเพียงโมเดลเดียวสำหรับสินค้านี้",
          "ปฏิเสธการประมวลผลเพราะสินค้ามีประวัติหนาแน่นเกินไป",
          "สลับไปใช้ชุดข้อมูลทดสอบ (Test Set) ในการตัดสิน"
        ],
        "answer": 1,
        "explanation": "เมื่อจำนวนคนชอบ n_C1 = 4 ผ่านเกณฑ์ θ = 2 และ B พร้อม ระบบ Switching จะเลือกโมเดล B เป็นผู้ตอบเพียงคนเดียว",
        "reasons": [
          "ผิด: การเฉลี่ยคะแนนเป็นพฤติกรรมของ Weighted Hybrid ไม่ใช่ Switching",
          "ถูกต้อง: เลือกโมเดล B ทำงานเพียงตัวเดียวตามกฎการสลับ",
          "ผิด: ยิ่งมีประวัติหนาแน่นยิ่งเหมาะกับ Collaborative ไม่มีการปฏิเสธคำขอ",
          "ผิด: ห้ามใช้ข้อมูล Test ในการตัดสินใจ"
        ],
        "version": 2
      },
      {
        "id": "switch-2",
        "q": "เมื่อมีคอร์สใหม่เข้ามาในระบบ ซึ่งยังไม่มีใครเคยลงเรียนเลย (n_i = 0) แต่มีข้อมูลคำบรรยายและหมวดหมู่วิชาพร้อม ระบบ Switching จะเลือกเส้นทางใด?",
        "choices": [
          "บังคับให้หารน้ำหนักด้วยศูนย์เพื่อหยุดการทำงาน",
          "เลือกโมเดล B เพราะโมเดล B สามารถสุ่มคะแนนขึ้นมาเองได้",
          "เลือกโมเดล A (Content-based) เพราะข้อมูลเนื้อหาพร้อมใช้งาน แม้ฝั่งพฤติกรรมจะขาดแคลน",
          "ลบคอร์สใหม่ออกชั่วคราวเป็นเวลา 30 วัน"
        ],
        "answer": 2,
        "explanation": "เมื่อสินค้าไม่มีประวัติพฤติกรรม (Cold-Start) ระบบ Switching จะเปลี่ยนไปใช้โมเดลเนื้อหา (Content-based) ที่มีความพร้อมแทน",
        "reasons": [
          "ผิด: ไม่มีการหารด้วยศูนย์ใน Switching",
          "ผิด: โมเดล B ไม่ควรสุ่มคะแนนเดาขึ้นมาเองโดยไร้หลักฐาน",
          "ถูกต้อง: สลับไปใช้โมเดลเนื้อหาเพื่อแก้ปัญหา Cold-Start",
          "ผิด: คอร์สใหม่ควรได้รับการแนะนำผ่านเนื้อหา ไม่ใช่ลบทิ้ง"
        ],
        "version": 2
      },
      {
        "id": "switch-3",
        "q": "แม้สินค้าจะมีจำนวนผู้ชอบมาก (n_i สูง) แต่เหตุใดการตรวจสอบเกณฑ์ n_i เพียงอย่างเดียวอาจยังไม่เพียงพอในระบบ Production?",
        "choices": [
          "เพราะเกณฑ์ตัวเลขจำนวนเต็มไม่สามารถนำมาใช้ในคอมพิวเตอร์ได้",
          "เพราะจำนวนผู้ชอบสินค้าจะทำให้โมเดลเกิดอาการหน่วยความจำเต็มเสมอ",
          "เพราะสินค้าที่มีคนชอบมากมักจะเป็นสินค้าปลอมในระบบ",
          "เพราะผู้ใช้เป้าหมายอาจเป็นผู้ใช้ใหม่ที่ยังไม่มีเพื่อนบ้านที่มีความชอบตรงกัน จึงต้องตรวจความพร้อมระดับคู่ (u, i) ด้วย"
        ],
        "answer": 3,
        "explanation": "การที่สินค้ามีคนชอบเยอะ ไม่ได้รับประกันว่าผู้ใช้ปัจจุบันจะมีประวัติเชื่อมโยงกับคนเหล่านั้น จึงต้องเช็กหลักฐานระดับคู่ (Pair-level Evidence)",
        "reasons": [
          "ผิด: ตัวเลขจำนวนเต็มใช้งานได้เป็นปกติในคอมพิวเตอร์",
          "ผิด: จำนวน Interaction ไม่ได้ทำให้ RAM เต็มในระดับตรรกะนี้",
          "ผิด: สินค้ายอดนิยมไม่ใช่สินค้าปลอม",
          "ถูกต้อง: ต้องเช็กว่าผู้ใช้เป้าหมายมีสัญญาณร่วมกับเพื่อนบ้านเหล่านั้นด้วยหรือไม่"
        ],
        "version": 2
      },
      {
        "id": "switch-4",
        "q": "หากผู้ใช้ใหม่ (New User) เพิ่งสมัครเข้ามาในแอปเป็นวินาทีแรก โดยไม่มีทั้งประวัติการคลิกและไม่ได้กรอกความสนใจใดๆ เลย ระบบ Switching จะแก้ปัญหานี้ได้อย่างไร?",
        "choices": [
          "ไม่สามารถแก้ได้ด้วยตัวเอง ต้องส่งต่อไปยังขั้นตอน Onboarding หรือ Fallback Policy ที่เหมาะสม",
          "ระบบจะสลับไปดึงข้อมูลแชตส่วนตัวของผู้ใช้มาวิเคราะห์โดยอัตโนมัติ",
          "เพิ่มค่าเกณฑ์ θ ให้สูงขึ้นเป็นอนันต์เพื่อให้ระบบเดาใจได้เอง",
          "เปิดดูประวัติในอนาคตของผู้ใช้เพื่อเลือกโมเดลที่ถูกต้อง"
        ],
        "answer": 0,
        "explanation": "เมื่อไร้ข้อมูลทั้งสองฝั่ง (User Cold-Start แบบสมบูรณ์) ไม่มีโมเดลใดในระบบทำงานได้ ระบบต้องมี Fallback เช่น Onboarding สอบถามความสนใจ หรือแนะนำของฮิต",
        "reasons": [
          "ถูกต้อง: ต้องมี Fallback หรือกระบวนการ Onboarding ช่วยเหลือ",
          "ผิด: การแอบดึงแชตส่วนตัวผิดกฎหมายความเป็นส่วนตัวร้ายแรง",
          "ผิด: การเพิ่มเกณฑ์ไม่ได้ช่วยสร้างข้อมูลใหม่ขึ้นมา",
          "ผิด: ข้อมูลอนาคตไม่มีอยู่จริง ณ เวลาปัจจุบัน (Data Leakage)"
        ],
        "version": 2
      }
    ]
  },
  {
    "id": "recsys-hy-mixed",
    "title": "Mixed Hybrid: จัดวางร่วมกันบนหน้าจอโดยไม่ต้องรวมคะแนน",
    "subtitle": "Burke แบบที่ 3: จัดวางเคียงข้างกัน หรือสลับแทรกฟันปลา (Interleaving)",
    "desc": "เข้าใจการผสมผลลัพธ์ที่ระดับหน้าจอแสดงผล (Presentation Layer), เทคนิค Round-Robin Interleaving และกับดัก Position Bias",
    "content": "<div class=\"rs-story-box\">\n      <h4>เรื่องเล่าและที่มาในชีวิตจริง (Story & Real-World Purpose)</h4>\n      <p>ลองเปิดแอปพลิเคชันอย่าง <b>Netflix</b> หรือ <b>Spotify</b> ขึ้นมาดูที่หน้าจอแรก:</p>\n      <ul>\n        <li>แถวบนสุด: <i>\"เพราะคุณชอบดู Stranger Things\"</i> (แนะนำจากโมเดล Content-based)</li>\n        <li>แถวถัดมา: <i>\"รายการยอดนิยมในกลุ่มคนที่คล้ายคุณ\"</i> (แนะนำจากโมเดล Collaborative Filtering)</li>\n        <li>แถวที่สาม: <i>\"มาแรงประจำวันนี้\"</i> (แนะนำจากโมเดลความนิยม Popularity)</li>\n      </ul>\n      <p>สังเกตไหมว่าระบบ <b>ไม่ได้พยายามเอาคะแนนดาวมาบวกกันให้ปวดหัว</b> แต่เลือกที่จะให้แต่ละโมเดลสร้างลิสต์อันดับของตัวเองออกมา แล้วนำมา <b>จัดวางเคียงข้างกันบนหน้าจอ (Multi-rail UI)</b> เพื่อให้ผู้ใช้เลือกดูตามอารมณ์!</p>\n      <p>นี่คือหัวใจของ <b>Mixed Hybrid (การผสมที่ระดับการแสดงผล)</b> — ตอบโจทย์ประสบการณ์ผู้ใช้ (UX) อย่างเป็นธรรมชาติ และหลีกเลี่ยงปัญหาเรื่องสเกลคะแนนที่ไม่เท่ากันได้อย่างสิ้นเชิง</p>\n    </div>\n\n    <div class=\"rs-terms-box\">\n      <h4>ถอดรหัสคำศัพท์และตัวย่อสำคัญ (Key Terms Decoded)</h4>\n      <table class=\"rs-term-table\">\n        <thead><tr><th>คำศัพท์ / แนวคิด</th><th>คำอ่าน & ความหมายเชิงระบบ</th><th>บทบาทในการจัดหน้าจอ</th></tr></thead>\n        <tbody>\n          <tr><td><b>Mixed Hybrid</b></td><td>การผสานระดับการแสดงผล</td><td>การนำลิสต์ผลลัพธ์ของหลายระบบมารวมกันบนหน้าจอ UI โดยไม่มีการนำคะแนนมารวมกัน</td></tr>\n          <tr><td><b>Multi-shelf / Multi-rail</b></td><td>หลายแถวแยกตามธีม</td><td>การแสดงผลแบบ Netflix ที่แยกเป็นแถวแนวนอน แต่ละแถวมาจากโมเดลคนละชนิดพร้อมคำอธิบาย</td></tr>\n          <tr><td><b>Interleaving</b></td><td>การสลับแทรกฟันปลา (Round-Robin)</td><td>การรวมเป็นลิสต์แนวตั้งแถวเดียว โดยผลัดกันหยิบอันดับ 1 ของ A, แล้วหยิบอันดับ 1 ของ B สลับกันไป</td></tr>\n          <tr><td><b>Deduplication (Dedup)</b></td><td>การตัดรายการที่ซ้ำซ้อน</td><td>เมื่อโมเดล B ส่งสินค้าที่โมเดล A เคยแสดงไปแล้วในอันดับก่อนหน้า ระบบต้องข้ามเพื่อไม่ให้ผู้ใช้เห็นของซ้ำ</td></tr>\n          <tr><td><b>Position Bias</b></td><td>อคติจากตำแหน่งการแสดงผล</td><td>แนวโน้มตามธรรมชาติที่มนุษย์มักคลิกดูแถวบนสุดมากกว่าแถวล่าง ไม่ว่าจะแนะนำอะไรก็ตาม</td></tr>\n        </tbody>\n      </table>\n    </div>\n\n    <div class=\"rs-pipeline-box\">\n      <h4>สองสไตล์ของ Mixed Hybrid: แยกแถว vs สลับแทรก (Interleaving)</h4>\n      <p class=\"rs-hybrid-legend\"><span class=\"rs-hy-a\">A · เนื้อหา Content-based</span><span class=\"rs-hy-b\">B · พฤติกรรม Collaborative</span></p>\n      <p><b>แบบที่ 1: แยกแถวตามธีม (Multi-rail Layout)</b></p>\n      <div class=\"rs-hy-rails\">\n        <div class=\"rs-hy-a\"><b>แถว A · เนื้อหาใกล้เคียงคอร์สเดิม</b><span>C1 → C2 → C3 → C4</span></div>\n        <div class=\"rs-hy-b\"><b>แถว B · เพื่อนร่วมรุ่นกำลังเรียน</b><span>C2 → C1 → C3</span></div>\n      </div>\n      \n      <p><b>แบบที่ 2: รวมเป็นแถวเดียวด้วย Round-Robin Interleaving + Deduplication</b></p>\n      <div data-rs-demo=\"hy-mixed\"></div>\n      <ul>\n        <li>รอบที่ 1: หยิบตัวแรกจาก A → ได้ <b>C1</b></li>\n        <li>รอบที่ 2: หยิบตัวแรกจาก B → ได้ <b>C2</b></li>\n        <li>รอบที่ 3: จะหยิบตัวที่สองจาก A (คือ C2) แต่ <i>C2 โผล่ไปแล้วในรอบก่อน!</i> → ตัดทิ้ง แล้วข้ามไปหยิบ <b>C3</b> แทน</li>\n        <li>รอบที่ 4: จะหยิบตัวที่สองจาก B (คือ C1) แต่ <i>C1 โผล่ไปแล้ว!</i> → ข้ามไปเอาตัวถัดไปคือ C3 (ซ้ำอีก!) → ฝั่ง B หมดตัวเลือก</li>\n        <li>รอบที่ 5: หยิบตัวที่เหลือของ A → ได้ <b>C4</b></li>\n        <li><b>ผลลัพธ์สุดท้ายบนลิสต์เดี่ยว:</b> <code>[C1, C2, C3, C4]</code> ครบถ้วน หลากหลาย และไม่มีสินค้าซ้ำซ้อน!</li>\n      </ul>\n    </div>\n\n    <div class=\"rs-decision-box\">\n      <h4>คู่มือการตัดสินใจทางวิศวกรรม (Engineering Decision Guide)</h4>\n      <ul>\n        <li><b>ข้อควรระวังเรื่อง Position Bias:</b> ถ้าแถวบนสุด (โมเดล A) มียอดคลิกสูงกว่าแถวล่างสุด (โมเดล B) ถึง 3 เท่า <b>ห้ามสรุปทันทีว่าโมเดล A เก่งกว่า B!</b> เพราะผู้ใช้มีแนวโน้มคลิกแถวบนสุดตามธรรมชาติของสายตามนุษย์ หากต้องการวัดความเก่งจริง ต้องทำสลับตำแหน่งแถว (A/B Testing with Rail Shuffling) เพื่อควบคุมตัวแปรนี้</li>\n        <li><b>เมื่อแหล่งใดแหล่งหนึ่งว่าง:</b> ถ้าโมเดล B ไม่มีของจะแนะนำ (เช่น ผู้ใช้ใหม่) นโยบาย Mixed ต้องระบุว่าจะดึงสินค้าจากโมเดล A มาเติมจนเต็มโควตา หรือปล่อยแถวนั้นซ่อนไป</li>\n      </ul>\n    </div>\n    <div class=\"callout\"><b>จำด้วยเส้นทาง:</b> สองตะกร้าบนหน้าจอ หรือผลัดกันหยิบคนละชิ้นใส่ตะกร้าเดียว → Mixed Hybrid · ไม่ต้องแปลงคะแนน</div>",
    "sources": [
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 95,
        "topic": "Mixed Hybrid และ Position Bias"
      },
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 96,
        "topic": "การแสดงผลหลายแถว Multi-rail"
      },
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 97,
        "topic": "Interleaving และ Deduplication"
      },
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 98,
        "topic": "การประเมินผล"
      }
    ],
    "questions": [
      {
        "id": "mixed-1",
        "q": "แอปพลิเคชันวิดีโอสตรีมมิงแสดงแถว \"ภาพยนตร์แอ็กชันที่คุณอาจชอบ\" ควบคู่กับแถว \"กำลังเป็นที่นิยมในกลุ่มเพื่อน\" โดยไม่มีการคำนวณคะแนนรวม จัดเป็น Hybrid รูปแบบใด?",
        "choices": [
          "Weighted Hybrid",
          "Mixed Hybrid",
          "Feature Augmentation",
          "Meta-Level Hybrid"
        ],
        "answer": 1,
        "explanation": "Mixed Hybrid คือการนำผลลัพธ์ของแต่ละโมเดลมาแสดงร่วมกันบนหน้าจอ UI โดยไม่ต้องนำคะแนนของแต่ละโมเดลมาเฉลี่ยรวมกัน",
        "reasons": [
          "ผิด: Weighted ต้องมีการรวมคะแนนตัวเลข",
          "ถูกต้อง: แสดงผลร่วมกันที่ระดับ UI โดยแยกแถวหรือสลับแทรก",
          "ผิด: Feature Augmentation ส่งผลทำนายไปให้โมเดลอื่นฝึก",
          "ผิด: Meta-Level ส่งตัวแทนโมเดลข้ามระบบ"
        ],
        "version": 2
      },
      {
        "id": "mixed-2",
        "q": "กำหนดลิสต์จากโมเดล A = [C1, C2, C3, C4] และโมเดล B = [C2, C1, C3] หากทำการรวมด้วย Round-Robin Interleaving โดยเริ่มจาก A และตัดสินค้าที่ซ้ำซ้อนออก ผลลัพธ์สุดท้ายจะเป็นอย่างไร?",
        "choices": [
          "[C2, C1]",
          "[C1, C2, C2, C1]",
          "[C1, C2, C3, C4]",
          "[C1, C3, C4]"
        ],
        "answer": 2,
        "explanation": "เริ่มจาก A ได้ C1 -> สลับไป B ได้ C2 -> กลับมา A ได้ C2 (ซ้ำ ตัดทิ้ง หยิบ C3) -> สลับไป B ได้ C1 (ซ้ำ) และ C3 (ซ้ำ) -> กลับมา A ได้ C4 สรุปผลลัพธ์คือ C1, C2, C3, C4",
        "reasons": [
          "ผิด: มีการตัดสินค้า C3 และ C4 ของฝั่ง A ทิ้งโดยไม่ถูกต้อง",
          "ผิด: C1, C2, C2, C1 มีสินค้าซ้ำซ้อน ไม่ได้ทำ Deduplication",
          "ถูกต้อง: สลับดึงทีละแหล่งและข้ามชิ้นที่เคยแสดงไปแล้ว",
          "ผิด: ขาดสินค้า C2 ที่ดึงมาจากฝั่ง B ในรอบแรก"
        ],
        "version": 2
      },
      {
        "id": "mixed-3",
        "q": "หากแถวแนะนำบนสุดของแอปได้รับจำนวนคลิกมากกว่าแถวที่สองถึง 4 เท่า เหตุใดทีม Data Science จึงยังไม่สามารถสรุปว่าโมเดลในแถวบนเก่งกว่าโมเดลแถวล่างได้ทันที?",
        "choices": [
          "เพราะแถวล่างสุดมักจะเป็นของที่ระบบสุ่มมาแสดงเสมอ",
          "เพราะคะแนนคลิกไม่สามารถนำมาบันทึกในฐานข้อมูลได้",
          "เพราะระบบยังไม่ได้แปลงจำนวนคลิกให้เป็นหน่วยเรตติ้งดาว 1-5",
          "เพราะมีอิทธิพลของ Position Bias ซึ่งผู้ใช้มีพฤติกรรมธรรมชาติที่จะมองและคลิกแถวบนก่อนเสมอ"
        ],
        "answer": 3,
        "explanation": "Position Bias คืออคติที่ตำแหน่งบนสุดได้รับความสนใจและการมองเห็น (Exposure) มากกว่าตำแหน่งล่างอย่างมหาศาล จึงสรุปว่าโมเดลเก่งกว่าไม่ได้ถ้ายังไม่ได้สลับตำแหน่งทดสอบ",
        "reasons": [
          "ผิด: แถวล่างไม่ได้เกิดจากการสุ่ม",
          "ผิด: จำนวนคลิกสามารถเก็บลงฐานข้อมูลได้ตามปกติ",
          "ผิด: คลิกเป็น Implicit feedback ไม่จำเป็นต้องแปลงเป็นดาวเพื่อวัด CTR",
          "ถูกต้อง: ต้องควบคุม Position Bias และปริมาณการมองเห็นก่อนเปรียบเทียบคุณภาพโมเดล"
        ],
        "version": 2
      },
      {
        "id": "mixed-4",
        "q": "ในการทำ Interleaving หากลิสต์ของโมเดล B หมดลงก่อนในขณะที่ยังมีช่องแสดงผลว่างอยู่ กติกาทางวิศวกรรมที่ดีควรทำอย่างไร?",
        "choices": [
          "ดึงสินค้าที่ยังไม่เคยแสดงจากลิสต์ของโมเดล A มาเติมในช่องที่เหลือจนเต็มโควตา",
          "หยุดการแสดงผลทันทีและปล่อยให้หน้าจอเป็นช่องว่างสีดำ",
          "ก็อปปี้สินค้าจากอันดับ 1 ของโมเดล B มาแสดงซ้ำๆ จนเต็มช่อง",
          "รีสตาร์ตเซิร์ฟเวอร์ใหม่เพื่อบังคับให้โมเดล B คำนวณใหม่"
        ],
        "answer": 0,
        "explanation": "Mixed Hybrid ต้องมี Presentation Policy รองรับเมื่อแหล่งใดหมด โดยนำสินค้าที่เหลือจากแหล่งที่ยังมีอยู่มาแสดงต่อเพื่อรักษาประสบการณ์ผู้ใช้",
        "reasons": [
          "ถูกต้อง: ใช้รายการที่เหลือของแหล่งอื่นมาเติมเต็มโควตาโดยไม่แสดงซ้ำ",
          "ผิด: การปล่อยให้หน้าจอว่างทำลายประสบการณ์ผู้ใช้",
          "ผิด: การนำของเดิมมาแสดงซ้ำทำลายความหลากหลายและน่ารำคาญ",
          "ผิด: ไม่ต้องรีสตาร์ตเซิร์ฟเวอร์"
        ],
        "version": 2
      }
    ]
  },
  {
    "id": "recsys-hy-combination",
    "title": "Feature Combination: รวมหลักฐานก่อนเข้าโมเดลเดียว",
    "subtitle": "Burke แบบที่ 4: หลอมรวมคุณลักษณะเนื้อหาและพฤติกรรมเป็นเวกเตอร์เดี่ยวก่อนเริ่มฝึก",
    "desc": "เข้าใจ Early Fusion, การต่อเวกเตอร์คุณลักษณะ (Concatenation) และความแตกต่างระหว่างฟีเจอร์ดิบกับผลทำนายของอีกโมเดล",
    "content": "<div class=\"rs-story-box\">\n      <h4>เรื่องเล่าและที่มาในชีวิตจริง (Story & Real-World Purpose)</h4>\n      <p>เปรียบเหมือนการพิจารณาคดีในศาล:</p>\n      <ul>\n        <li><b>แทนที่จะทำแบบเดิม:</b> ให้ศาลวิเคราะห์หลักฐานทางนิติวิทยาศาสตร์ (Content) พิพากษามา 1 คดี และให้ศาลวิเคราะห์พฤติกรรมพยานแวดล้อม (Collaborative) พิพากษามาอีก 1 คดี แล้วเอาคำตัดสินมาหารเฉลี่ยกัน</li>\n        <li><b>เราเปลี่ยนวิธีใหม่:</b> เราตั้ง <b>\"ผู้พิพากษาเพียงคนเดียว (Single Powerful Model)\"</b> ที่มีความสามารถสูงมาก (เช่น XGBoost หรือ Deep Neural Network) แล้วนำแฟ้มหลักฐานทั้งสองด้านมารวมกันเป็นแฟ้มเดียว ให้ผู้พิพากษาคนนี้อ่านและชั่งน้ำหนักข้อมูลทั้งหมดพร้อมกัน!</li>\n      </ul>\n      <p>นี่คือหัวใจของ <b>Feature Combination (การรวมคุณลักษณะ / Early Fusion)</b> — จุดเชื่อมต่อไม่ได้อยู่ที่ปลายทาง (ไม่ใช่ Output Score) แต่อยู่ที่ <b>ต้นทางของข้อมูล (Input Vector)</b> ก่อนเริ่มฝึกโมเดล!</p>\n    </div>\n\n    <div class=\"rs-terms-box\">\n      <h4>ถอดรหัสคำศัพท์และตัวย่อสำคัญ (Key Terms Decoded)</h4>\n      <table class=\"rs-term-table\">\n        <thead><tr><th>คำศัพท์ / สัญลักษณ์</th><th>คำอ่าน & ความหมายเชิงระบบ</th><th>หน้าที่ในสถาปัตยกรรม Early Fusion</th></tr></thead>\n        <tbody>\n          <tr><td><b>Feature Combination</b></td><td>การรวมคุณลักษณะ (Early Fusion)</td><td>การนำฟีเจอร์จากหลายมิติมาเชื่อมต่อกันเป็นเวกเตอร์เดี่ยว แล้วฝึก <b>โมเดลตัวเดียว</b></td></tr>\n          <tr><td><b>Concatenation (<i>[x<sub>A</sub> ; x<sub>B</sub>]</i>)</b></td><td>การต่อเวกเตอร์</td><td>การนำเวกเตอร์เนื้อหา <i>x<sub>A</sub></i> และเวกเตอร์พฤติกรรม <i>x<sub>B</sub></i> มาต่อท้ายกันให้เป็นเวกเตอร์ขนาดยาวขึ้น</td></tr>\n          <tr><td><b>Cross-Feature Interaction</b></td><td>ปฏิสัมพันธ์ข้ามมิติ</td><td>ความสามารถของโมเดลในการจับคู่ความสัมพันธ์ เช่น \"คนอายุ 20-25 (พฤติกรรม) ชอบอ่านหนังสือไซไฟ (เนื้อหา)\"</td></tr>\n          <tr><td><b>Monolithic Model</b></td><td>แบบจำลองเดี่ยวเบ็ดเสร็จ</td><td>โมเดลเดียวที่รับผิดชอบการทำนายคะแนนทั้งหมดโดยตรงจากเวกเตอร์รวม</td></tr>\n        </tbody>\n      </table>\n    </div>\n\n    <div class=\"rs-pipeline-box\">\n      <h4>โครงสร้างการทำงานและตัวอย่างการคำนวณเชิงเส้น</h4>\n      <p class=\"rs-hybrid-legend\"><span class=\"rs-hy-a\">A · เนื้อหา Content-based</span><span class=\"rs-hy-b\">B · พฤติกรรม Collaborative</span></p>\n      <div class=\"rs-hy-parallel\" role=\"group\" aria-label=\"Feature Combination Pipeline\"><p class=\"rs-hy-parallel-label\">สองฝั่งทำงานแยกกัน</p><div class=\"rs-hy-inputs\"><div class=\"rs-hy-node rs-hy-a\"><b>ฟีเจอร์เนื้อหา xA</b><span>หมวดหมู่วิชา [Data, Design] → [1, 0]</span></div><div class=\"rs-hy-node rs-hy-b\"><b>ฟีเจอร์พฤติกรรม xB</b><span>พฤติกรรมเพื่อนในชุดฝึก [v1 เคยเลือก, v2 เคยเลือก] → [1, 0]</span></div></div><div class=\"rs-hy-join\" aria-hidden=\"true\">↘ &nbsp; จุดเชื่อม &nbsp; ↙</div><div class=\"rs-hy-node\"><b>โมเดลเดียว (Single Learner)</b><span>x = [xA ; xB] = [1, 0, 1, 0] → ทำนาย Score</span></div></div>\n      \n      <p>ตัวอย่างการเชื่อมต่อเวกเตอร์และคำนวณคะแนนด้วยน้ำหนักโมเดลเชิงเส้น <i>β</i> = [0.6, 0.2, 0.1, 0.3]:</p>\n      <div class=\"formula\">x_{C1} = [1, 0, 1, 0] \\quad \\rightarrow \\quad Score(C1) = \\beta^T x_{C1} = (0.6 \\times 1) + (0.2 \\times 0) + (0.1 \\times 1) + (0.3 \\times 0) = 0.7000</div>\n      <div data-rs-demo=\"hy-combination\"></div>\n    </div>\n\n    <div class=\"rs-decision-box\">\n      <h4>คู่มือการตัดสินใจทางวิศวกรรม (Engineering Decision Guide)</h4>\n      <ul>\n        <li><b>จุดได้เปรียบเหนือ Weighted Hybrid:</b> Feature Combination เปิดโอกาสให้โมเดลชั้นนำอย่าง Gradient Boosting (XGBoost/LightGBM) หรือ Deep Neural Networks เรียนรู้ <i>Non-linear Interactions</i> ข้ามระหว่างเนื้อหากับพฤติกรรมได้ ซึ่ง Weighted Hybrid ทำไม่ได้เพราะรวมกันที่ปลายทางแบบเส้นตรง</li>\n        <li><b>การรับมือสินค้าใหม่ (Cold Items):</b> เมื่อสินค้า C4 ไม่มีประวัติพฤติกรรม บล็อก <i>x<sub>B</sub></i> จะเป็น <code>[0, 0]</code> โมเดลยังคงทำงานต่อได้ด้วยฟีเจอร์เนื้อหา <i>x<sub>A</sub></i> แต่ต้องแนบ Missing Indicator Flag ไว้ด้วย เพื่อไม่ให้โมเดลเข้าใจผิดว่าเลข 0 คือผู้ใช้ปฏิเสธสินค้านั้น</li>\n      </ul>\n    </div>\n    <div class=\"callout\"><b>จำด้วยเส้นทาง:</b> ข้อมูลสองด้านถูกมัดรวม → ส่งให้ผู้ตัดสินคนเดียวอ่านตั้งแต่เริ่มฝึก → Feature Combination (Early Fusion)</div>",
    "sources": [
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 25,
        "topic": "Feature Combination ใน Burke"
      },
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 111,
        "topic": "การผสานระดับคุณลักษณะ"
      },
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 123,
        "topic": "การต่อเวกเตอร์เนื้อหากับพฤติกรรม"
      }
    ],
    "questions": [
      {
        "id": "comb-1",
        "q": "ระบบที่นำข้อมูลแท็กหมวดหมู่วิชาและรหัสประวัติการคลิกของผู้ใช้มาต่อเวกเตอร์รวมกัน แล้วป้อนเข้าฝึกโมเดล Machine Learning เพียงโมเดลเดียวตั้งแต่ต้น จัดเป็นรูปแบบใด?",
        "choices": [
          "Weighted Hybrid (Late Fusion)",
          "Feature Combination (Early Fusion)",
          "Mixed Hybrid",
          "Switching Hybrid"
        ],
        "answer": 1,
        "explanation": "Feature Combination คือการรวมฟีเจอร์จากหลายแหล่งเข้าด้วยกันเป็นอินพุตเดียว แล้วฝึกโมเดลตัวเดียวตั้งแต่แรก (Early Fusion)",
        "reasons": [
          "ผิด: Weighted รวมที่ระดับคะแนนผลลัพธ์ของสองโมเดล",
          "ถูกต้อง: รวมฟีเจอร์เข้าเป็นอินพุตเดียวของโมเดลเดี่ยว",
          "ผิด: Mixed รวมที่ระดับหน้าจอแสดงผล",
          "ผิด: Switching เลือกระบบใดระบบหนึ่งทำงาน"
        ],
        "version": 2
      },
      {
        "id": "comb-2",
        "q": "กำหนดเวกเตอร์คุณลักษณะรวม x_C1 = [1, 0, 1, 0] และเวกเตอร์น้ำหนักของโมเดล β = [0.6, 0.2, 0.1, 0.3] คะแนนทำนาย Score(C1) จะมีค่าเท่าใด?",
        "choices": [
          "0.9000",
          "1.2000",
          "0.7000",
          "0.6000"
        ],
        "answer": 2,
        "explanation": "คำนวณ Dot Product: (0.6 * 1) + (0.2 * 0) + (0.1 * 1) + (0.3 * 0) = 0.6 + 0 + 0.1 + 0 = 0.7000",
        "reasons": [
          "ผิด: 0.90 เป็นคะแนนของตัวอย่าง Weighted ในบทก่อน",
          "ผิด: 1.20 คือการนำน้ำหนักทั้งหมดมารวมกันโดยไม่ดูเวกเตอร์ฟีเจอร์",
          "ถูกต้อง: 0.6(1) + 0.2(0) + 0.1(1) + 0.3(0) = 0.70",
          "ผิด: 0.60 ลืมบวกฟีเจอร์พฤติกรรมมิติที่สาม (0.1 * 1)"
        ],
        "version": 2
      },
      {
        "id": "comb-3",
        "q": "ข้อใดคือความแตกต่างสำคัญระหว่าง Feature Combination กับ Feature Augmentation?",
        "choices": [
          "ไม่มีความแตกต่างใดๆ ทั้งสองเป็นชื่อเรียกของวิธีเดียวกัน",
          "Feature Combination ต้องใช้โครงข่ายประสาทเทียมเสมอ ส่วน Augmentation ใช้ไม่ได้",
          "Feature Combination สามารถใช้งานได้เฉพาะกับข้อมูลตัวเลขเรตติ้ง 1-5 เท่านั้น",
          "Feature Combination นำฟีเจอร์ต้นทางดิบมารวมกัน แต่ Feature Augmentation นำ \"ผลทำนายของโมเดลแรก\" มาเป็นฟีเจอร์เสริมให้โมเดลที่สอง"
        ],
        "answer": 3,
        "explanation": "Combination รวมข้อมูลฟีเจอร์ดิบเข้าด้วยกันตั้งแต่ต้น ส่วน Augmentation ต้องมีโมเดลตัวแรกทำงานก่อน แล้วส่งผลทำนาย (Prediction/Pseudo-score) ไปเป็นฟีเจอร์เพิ่มให้โมเดลถัดไป",
        "reasons": [
          "ผิด: สองวิธีนี้อยู่ในหมวดที่ต่างกันในอนุกรมวิธานของ Burke",
          "ผิด: ทั้งสองวิธีสามารถใช้ Neural Network หรือโมเดลใดก็ได้",
          "ผิด: Combination ใช้งานได้กับฟีเจอร์หลากหลายชนิด ทั้งข้อความ ภาพ และพฤติกรรม",
          "ถูกต้อง: Combination รวม Raw Features ส่วน Augmentation ส่ง Model Predictions"
        ],
        "version": 2
      },
      {
        "id": "comb-4",
        "q": "เมื่อมีสินค้าใหม่แกะกล่องเข้ามาในระบบ ทำให้บล็อกฟีเจอร์พฤติกรรม (xB) ว่างเปล่าและต้องเติมศูนย์ [0, 0] วิศวกรควรระวังสิ่งใดเป็นพิเศษ?",
        "choices": [
          "ต้องเก็บ Missing Indicator Flag แยกต่างหาก เพื่อป้องกันไม่ให้โมเดลเข้าใจผิดว่าเลข 0 หมายถึงผู้ใช้เกลียดสินค้านั้น",
          "ต้องลบฟีเจอร์เนื้อหาทิ้งทั้งหมดเพื่อให้เวกเตอร์มีขนาดเท่ากัน",
          "แอบนำข้อมูลเรตติ้งจริงจากชุดทดสอบ (Test Set) มาเติมลงในช่องว่าง",
          "ต้องยกเลิกการใช้โมเดลเดี่ยวแล้วเปลี่ยนไปใช้ระบบสุ่มแบบ Random ทันที"
        ],
        "answer": 0,
        "explanation": "เลข 0 ในฟีเจอร์พฤติกรรมของของใหม่แปลว่า \"ยังไม่เคยมีประวัติ\" ไม่ได้แปลว่า \"ทุกคนเกลียด\" จึงต้องมี Missing Indicator ควบคุมไว้",
        "reasons": [
          "ถูกต้อง: แยกแยะระหว่าง Missing Zero กับ Observed Negative Zero",
          "ผิด: ห้ามลบฟีเจอร์เนื้อหาทิ้ง เพราะเนื้อหาคือสิ่งเดียวที่ช่วยของใหม่ได้",
          "ผิด: การเติมข้อมูล Test คือ Data Leakage ร้ายแรง",
          "ผิด: โมเดลยังคงทำนายต่อได้จากฟีเจอร์เนื้อหา ไม่ต้องสุ่ม"
        ],
        "version": 2
      }
    ]
  },
  {
    "id": "recsys-hy-augmentation",
    "title": "Feature Augmentation: ใช้ผลทำนายเสริมโมเดลถัดไป",
    "subtitle": "Burke แบบที่ 5: Content-Boosted CF, คะแนนเทียม (Pseudo-ratings) และการป้องกัน Leakage",
    "desc": "เรียนรู้กระบวนการสร้างและป้อนผลทำนายของโมเดลแรกเป็นฟีเจอร์เพิ่ม, ปัญหา Error Propagation และเทคนิค Out-Of-Fold (OOF)",
    "content": "<div class=\"rs-story-box\">\n      <h4>เรื่องเล่าและที่มาในชีวิตจริง (Story & Real-World Purpose)</h4>\n      <p>จินตนาการว่าคุณกำลังต่อจิ๊กซอว์ภาพขนาดยักษ์ แต่ชิ้นส่วนหายไปถึง 99% (เปรียบเหมือนตาราง User-Item Rating Matrix ที่กลวงโบ๋จนหาเพื่อนบ้านไม่เจอ):</p>\n      <ul>\n        <li><b>ขั้นที่ 1:</b> คุณส่ง <b>\"นักวาดภาพสเก็ตช์ (โมเดลเนื้อหา A)\"</b> เข้าไปดูโครงสร้างรอบข้าง แล้วช่วยร่างภาพล่วงหน้าว่าช่องว่างเหล่านี้น่าจะมีสีอะไร (สร้างคะแนนเทียม <b>Pseudo-ratings</b> เช่น คาดว่าน่าจะได้ 3.6 ดาว)</li>\n        <li><b>ขั้นที่ 2:</b> เมื่อตารางเริ่มหนาแน่นขึ้น คุณจึงส่ง <b>\"นักต่อจิ๊กซอว์มืออาชีพ (โมเดลพฤติกรรม B - CF)\"</b> เข้ามาประมวลผลต่อ ทำให้สามารถหาเพื่อนบ้านที่มีรสนิยมใกล้เคียงกันได้แม่นยำขึ้นมาก!</li>\n      </ul>\n      <p>นี่คือหัวใจของ <b>Feature Augmentation (การเสริมคุณลักษณะ)</b> และกรณีศึกษาที่โด่งดังที่สุดในโลกคือ <b>Content-Boosted Collaborative Filtering</b> (Melville et al., 2002) ซึ่งนำเอาผลทำนายของโมเดลแรกมาแปลงเป็นข้อมูลป้อนเข้า (Input) ให้โมเดลตัวที่สองฝึกสอนต่อ!</p>\n    </div>\n\n    <div class=\"rs-terms-box\">\n      <h4>ถอดรหัสคำศัพท์และตัวย่อสำคัญ (Key Terms Decoded)</h4>\n      <table class=\"rs-term-table\">\n        <thead><tr><th>คำศัพท์ / แนวคิด</th><th>คำอ่าน & ความหมายเชิงระบบ</th><th>บทบาทในการฝึกโมเดล</th></tr></thead>\n        <tbody>\n          <tr><td><b>Feature Augmentation</b></td><td>การเสริมคุณลักษณะด้วยโมเดล</td><td>สถาปัตยกรรมที่โมเดลแรกทำนายผล แล้วส่งผลทำนายนั้นไปเป็นฟีเจอร์เพิ่มเติมให้โมเดลถัดไป</td></tr>\n          <tr><td><b>Pseudo-rating</b></td><td>คะแนนเทียม / เรตติ้งสังเคราะห์</td><td>คะแนนที่โมเดลแรก (Content-based) คาดเดาใส่ลงในช่องว่างของตาราง เพื่อลดปัญหาความเบาบาง (Sparsity)</td></tr>\n          <tr><td><b>Error Propagation</b></td><td>การย้อนขยายความผิดพลาด</td><td>ความเสี่ยงที่หากโมเดลแรกเดาผิด โมเดลตัวที่สองจะจดจำความผิดนั้นไปเรียนรู้ต่อจนเพี้ยนหนักกว่าเดิม</td></tr>\n          <tr><td><b>Confidence Discounting</b></td><td>การลดทอนค่าน้ำหนักความเชื่อมั่น</td><td>การตั้งค่าน้ำหนักความน่าเชื่อถือของคะแนนเทียมให้ต่ำกว่าคะแนนจริง (เช่น ดาวจริงให้น้ำหนัก 1.0, ดาวเทียมให้ 0.2)</td></tr>\n          <tr><td><b>Out-Of-Fold (OOF)</b></td><td>การทำนายแบบนอกส่วนแบ่งฝึก</td><td>การแบ่ง K-Fold เฉพาะใน Train เพื่อให้โมเดลแรกทำนายส่วนที่ตนเองไม่เคยเห็นคำตอบ ป้องกัน Data Leakage</td></tr>\n        </tbody>\n      </table>\n    </div>\n\n    <div class=\"rs-pipeline-box\">\n      <h4>แผนภาพกระบวนการทำงานและเทคนิค Out-Of-Fold (OOF)</h4>\n      <p class=\"rs-hybrid-legend\"><span class=\"rs-hy-a\">A · เนื้อหา Content-based</span><span class=\"rs-hy-b\">B · พฤติกรรม Collaborative</span></p>\n      <div class=\"rs-hybrid-route\" role=\"group\" aria-label=\"Feature Augmentation Pipeline\"><div class=\"rs-hy-node rs-hy-a\"><b>1 · โมเดล A ทำนายก่อน</b><span>ทำนายคะแนนลงในช่องว่างของชุดฝึก</span></div><span class=\"rs-hy-arrow\" aria-hidden=\"true\">→</span><div class=\"rs-hy-node rs-hy-out\"><b>2 · สร้างข้อมูลเสริม</b><span>ได้ฟีเจอร์ใหม่หรือ Pseudo-rating + ความเชื่อมั่น</span></div><span class=\"rs-hy-arrow\" aria-hidden=\"true\">→</span><div class=\"rs-hy-node rs-hy-b\"><b>3 · โมเดล B ฝึกรอบใหม่</b><span>นำตารางที่แน่นขึ้นไปเทรน Collaborative Filtering</span></div></div>\n      \n      <div data-rs-demo=\"hy-augmentation\"></div>\n\n      <details class=\"rs-reading-note\"><summary>อ่านลึก: ทำไมต้องใช้ Out-Of-Fold (OOF) Predictions ในการฝึกโมเดลตัวที่สอง?</summary>\n        <p>หากคุณนำโมเดล A ที่ฝึกด้วยข้อมูลชุดฝึกทั้งหมด ไปทำนายคะแนนชุดฝึกของตัวเอง โมเดล A จะเกิดอาการ <b>Overfitting (ท่องจำข้อสอบ)</b> และคืนค่าคะแนนที่มั่นใจเกินจริง (Overconfident) เมื่อส่งไปให้โมเดล B เรียนต่อ โมเดล B จะล้มเหลวอย่างสิ้นเชิงเมื่อเจอข้อมูลทดสอบใหม่!</p>\n        <p><b>ทางแก้มาตรฐานระดับอุตสาหกรรม:</b></p>\n        <ol>\n          <li>แบ่งเฉพาะชุดฝึก (Train Set) ออกเป็น <i>K</i> ส่วน (Folds) เช่น 5 Folds</li>\n          <li>ฝึกโมเดล A บน 4 ส่วน แล้วนำไปทำนายส่วนที่ 5 (ส่วนที่โมเดลไม่ได้เห็นคำตอบ)</li>\n          <li>ทำวนจนครบทุกส่วน จะได้คะแนนทำนายแบบ <b>Out-Of-Fold (OOF)</b> ที่สะท้อนความสามารถที่แท้จริง</li>\n          <li>นำคะแนน OOF นี้ไปใช้เป็นฟีเจอร์ฝึกโมเดล B และวัดผลบน Test Set ที่กันแยกไว้ต่างหากเสมอ</li>\n        </ol>\n      </details>\n    </div>\n\n    <div class=\"rs-decision-box\">\n      <h4>คู่มือการตัดสินใจทางวิศวกรรม (Engineering Decision Guide)</h4>\n      <ul>\n        <li><b>ต้องบันทึก Metadata ที่มาเสมอ:</b> ในฐานข้อมูล ห้ามแปลงค่า Pseudo-rating ให้กลายเป็นดาวจริงโดยลบธงที่มาทิ้งเด็ดขาด! ต้องเก็บฟิลด์ <code>is_pseudo = true</code> และ <code>confidence = 0.2</code> เพื่อให้โมเดล B สามารถถ่วงน้ำหนักความสำคัญได้ถูกต้อง</li>\n        <li><b>การเติมข้อมูลเทียมไม่ได้สร้างหลักฐานจริง:</b> แม้เมทริกซ์จะหนาแน่นขึ้น แต่ถ้าโมเดลเนื้อหาไม่มีคุณภาพ การเติมคะแนนเทียมจะยิ่งสร้าง Noise มหาศาล ต้องทำ A/B Test หรือ Offline Evaluation เทียบกับเวอร์ชันที่ไม่เติมเสมอ</li>\n      </ul>\n    </div>\n    <div class=\"callout\"><b>จำด้วยเส้นทาง:</b> A ตอบก่อน → คำตอบของ A กลายเป็นข้อมูลป้อนให้ B → Feature Augmentation (ส่ง Prediction ไม่ใช่ทั้ง Profile)</div>",
    "sources": [
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 129,
        "topic": "Feature Augmentation และ Content-boosted CF"
      },
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 130,
        "topic": "การสร้างคะแนนเทียม Pseudo-rating"
      },
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 136,
        "topic": "Out-Of-Fold OOF Predictions"
      }
    ],
    "questions": [
      {
        "id": "aug-1",
        "q": "ระบบแนะนำที่ใช้โมเดล Content-based ทำนายเรตติ้งลงในช่องว่างของตารางที่ผู้ใช้ไม่เคยให้คะแนน แล้วส่งตารางที่หนาแน่นขึ้นนี้ไปให้โมเดล User-kNN ฝึกสอนต่อ จัดเป็น Hybrid รูปแบบใด?",
        "choices": [
          "Weighted Hybrid",
          "Feature Augmentation",
          "Mixed Hybrid",
          "Switching Hybrid"
        ],
        "answer": 1,
        "explanation": "Feature Augmentation คือการนำผลลัพธ์ทำนายของโมเดลแรกไปเป็นฟีเจอร์หรือข้อมูลเสริมให้กับโมเดลถัดไปในการฝึกสอน",
        "reasons": [
          "ผิด: Weighted รวมคะแนนผลลัพธ์สุดท้าย ไม่ได้ส่งไปเทรนโมเดลอื่นต่อ",
          "ถูกต้อง: ผลทำนายของโมเดลแรกถูกนำไปขยายข้อมูลป้อนเข้าของโมเดลที่สอง",
          "ผิด: Mixed แสดงผลสองโมเดลพร้อมกันบนหน้าจอ UI",
          "ผิด: Switching เลือกระบบใดระบบหนึ่งทำงานตามเงื่อนไข"
        ],
        "version": 2
      },
      {
        "id": "aug-2",
        "q": "เมื่อโมเดลเนื้อหาทำนายคะแนนเทียม (Pseudo-rating = 3.6 ดาว) ลงในตารางชุดฝึก สถาปัตยกรรมข้อมูลที่ดีควรบันทึกข้อมูลนี้อย่างไร?",
        "choices": [
          "แทนที่คะแนนจริงทุกช่องในตารางด้วยตัวเลข 3.6 ดาว",
          "บันทึกเป็นคะแนนเรตติ้งดาวจริงทันทีโดยลบประวัติที่มาออกเพื่อความกระชับ",
          "บันทึกว่าเป็นค่าจากการทำนาย (Pseudo) พร้อมแนบแหล่งที่มาและค่าน้ำหนักความเชื่อมั่นตามที่กำหนดไว้",
          "บันทึกว่าสินค้านี้ได้รับคะแนนเป็น 0 ดาวเพื่อความปลอดภัย"
        ],
        "answer": 2,
        "explanation": "คะแนนเทียมต้องได้รับการระบุอย่างโปร่งใสว่าเป็น Pseudo พร้อม Confidence Weight เพื่อไม่ให้โมเดลถัดไปสับสนกับข้อมูลพฤติกรรมจริงของผู้ใช้",
        "reasons": [
          "ผิด: ห้ามแทนที่ข้อมูลจริงที่ผู้ใช้เคยกดไว้",
          "ผิด: การซ่อนที่มาทำให้เกิดการหลอกลวงข้อมูลและนำไปสู่ Error Propagation",
          "ถูกต้อง: ระบุสถานะ Pseudo และความเชื่อมั่นอย่างชัดเจน",
          "ผิด: การบันทึกเป็น 0 จะทำให้ความหมายของข้อมูลผิดเพี้ยน"
        ],
        "version": 2
      },
      {
        "id": "aug-3",
        "q": "เทคนิคการสร้างคำทำนายแบบ Out-Of-Fold (OOF) ช่วยแก้ปัญหาความเสี่ยงใดในการทำ Feature Augmentation?",
        "choices": [
          "ช่วยให้ไม่ต้องแบ่งชุดข้อมูลตามลำดับเวลาอีกต่อไป",
          "ช่วยให้สามารถนำชุดข้อมูลทดสอบ (Test Set) มาใช้ในการฝึกโมเดลตัวแรกได้โดยไม่ผิดกติกา",
          "รับประกันว่าคะแนนเทียมทุกค่าจะถูกต้องตรงกับความจริง 100%",
          "ป้องกันไม่ให้โมเดลตัวที่สองเรียนรู้จากคำทำนายที่โมเดลตัวแรกท่องจำข้อมูลชุดฝึกของตัวเองมา (ลด Data Leakage)"
        ],
        "answer": 3,
        "explanation": "OOF ทำนายบนส่วนที่โมเดลแรกไม่ได้เห็นคำตอบ ทำให้โมเดลตัวที่สองเห็นสัญญาณการทำนายที่สมจริง ไม่ Overfit กับข้อมูลฝึกเดิม",
        "reasons": [
          "ผิด: หากข้อมูลมีมิติเวลา ยังต้องเคารพ Temporal Split เสมอ",
          "ผิด: ชุด Test ยังคงต้องกันไว้เด็ดขาด ห้ามนำมาฝึก",
          "ผิด: OOF ลด Leakage แต่ไม่ได้การันตีความถูกต้อง 100%",
          "ถูกต้อง: OOF จำลองสถานการณ์การทำนายข้อมูลที่ไม่เคยเห็น ลดการจำข้อสอบและ Leakage"
        ],
        "version": 2
      },
      {
        "id": "aug-4",
        "q": "การเติมคะแนนเทียม (Pseudo-ratings) ลงในเมทริกซ์ให้หนาแน่นขึ้น มีผลลัพธ์เทียบเท่ากับการได้ข้อมูลพฤติกรรมจากผู้ใช้จริงเพิ่มขึ้นเสมอหรือไม่?",
        "choices": [
          "ไม่ เพราะคะแนนเทียมเป็นเพียงข้อมูลอนุมานที่อาจแฝงความผิดพลาดของโมเดลแรก และอาจขยายข้อผิดพลาดให้แย่ลงได้",
          "ใช่ เพราะจำนวนตัวเลขในเมทริกซ์ที่เพิ่มขึ้นสะท้อนถึงการมีส่วนร่วมจริงของผู้ใช้",
          "ใช่ ตราบใดที่คะแนนเทียมมีค่าอยู่ระหว่าง 1 ถึง 5 ดาว",
          "ใช่ เพราะอัลกอริทึม Collaborative Filtering ต้องการเพียงตัวเลขโดยไม่สนใจที่มา"
        ],
        "answer": 0,
        "explanation": "คะแนนเทียมคือการคาดเดา หากโมเดลแรกมีอคติ ข้อผิดพลาดนั้นจะถูกส่งต่อไปยังโมเดลที่สอง (Error Propagation) จึงไม่เท่ากับการได้ข้อมูลจริง",
        "reasons": [
          "ถูกต้อง: ข้อมูลเทียมอาจนำพา Noise และขยายความผิดพลาดได้",
          "ผิด: เมทริกซ์ที่แน่นขึ้นด้วยข้อมูลเทียมไม่ได้แปลว่าผู้ใช้มีส่วนร่วมจริง",
          "ผิด: ช่วงตัวเลข 1-5 ไม่ได้พิสูจน์ความถูกต้องของพฤติกรรมมนุษย์",
          "ผิด: ที่มาของข้อมูลมีผลต่อคุณภาพและการตัดสินใจทางสถิติอย่างยิ่ง"
        ],
        "version": 2
      }
    ]
  },
  {
    "id": "recsys-hy-cascade",
    "title": "Cascade Hybrid: กรองหยาบก่อนจัดอันดับละเอียด",
    "subtitle": "Burke แบบที่ 6: หัวใจของระบบแนะนำระดับล้านผู้ใช้ (Retrieval M -> Reranker K)",
    "desc": "เข้าใจ Funnel Architecture, Candidate Recall Ceiling และการแบ่งบทบาทระหว่างโมเดลความเร็วสูงกับโมเดลวิเคราะห์ละเอียด",
    "content": "<div class=\"rs-story-box\">\n      <h4>เรื่องเล่าและที่มาในชีวิตจริง (Story & Real-World Purpose)</h4>\n      <p>ลองจินตนาการถึงการแข่งขันร้องเพลงระดับประเทศอย่าง <b>The Voice</b> ที่มีผู้สมัครถึง <b>100,000 คน</b>:</p>\n      <ul>\n        <li>กรรมการระดับอาจารย์เพลงมือฉมัง 4 ท่าน <b>ไม่สามารถมานั่งฟังผู้สมัครทุกคนร้องเพลงคนละหลายเพลงได้</b> เพราะต้องใช้เวลานานนับแสนชั่วโมง (เกือบ 1 ปีเต็มโดยไม่ได้นอน!)</li>\n        <li><b>แนวทางแก้ไข:</b> ผู้จัดงานตั้ง <i>\"คณะกรรมการคัดกรองรอบแรก (Fast Retrieval)\"</i> ให้ผู้สมัครร้องสั้นๆ 30 วินาที เพื่อคัดกรองจาก 100,000 คน ให้เหลือผู้ผ่านเข้ารอบ <b>500 คน (Candidate Pool M = 500)</b></li>\n        <li>จากนั้น กรรมการตัวจริงระดับอาจารย์จึงเข้ามานั่งฟังอย่างละเอียด (Fine Reranker) เพื่อคัดเลือกและจัดอันดับผู้ชนะเลิศ <b>10 คนสุดท้าย (Top-K = 10)</b> ขึ้นเวทีใหญ่!</li>\n      </ul>\n      <p>นี่คือหัวใจของ <b>Cascade Hybrid (การผสานแบบลำดับขั้น / Multi-Stage Pipeline)</b> — สถาปัตยกรรมกระดูกสันหลังที่ขับเคลื่อนแพลตฟอร์มระดับโลกอย่าง YouTube, TikTok, Netflix และ Amazon!</p>\n    </div>\n\n    <div class=\"rs-terms-box\">\n      <h4>ถอดรหัสคำศัพท์และตัวย่อสำคัญ (Key Terms Decoded)</h4>\n      <table class=\"rs-term-table\">\n        <thead><tr><th>คำศัพท์ / สัญลักษณ์</th><th>คำอ่าน & ความหมายเชิงระบบ</th><th>บทบาทในกระบวนการ Funnel</th></tr></thead>\n        <tbody>\n          <tr><td><b>Cascade Hybrid</b></td><td>การผสานแบบลำดับขั้น</td><td>ระบบที่โมเดลแรกทำหน้าที่คัดกรองเหลือชุดผู้สมัคร แล้วส่งให้โมเดลที่สองจัดอันดับละเอียดเฉพาะในชุดนั้น</td></tr>\n          <tr><td><b>Candidate Retrieval (Stage 1)</b></td><td>ด่านค้นคืนผู้สมัครความเร็วสูง</td><td>คัดกรองจากคลังสินค้าหลักล้านชิ้น ให้เหลือผู้สมัครขนาด <i>M</i> ชิ้น (เช่น 100-500 ชิ้น) ในเวลา &lt; 10 ms</td></tr>\n          <tr><td><b>Reranking (Stage 2)</b></td><td>ด่านจัดอันดับละเอียด</td><td>ใช้โมเดล Machine Learning ที่ซับซ้อนและแม่นยำสูง มาเรียงลำดับเฉพาะใน Pool <i>M</i> ชิ้นเพื่อหา Top-<i>K</i></td></tr>\n          <tr><td><b>Candidate Recall Ceiling</b></td><td>เพดานการค้นคืนผู้สมัคร</td><td>สัดส่วนไอเท็มที่เกี่ยวข้องจริงที่หลุดรอดผ่านเข้าสู่ Pool: <i>Recall</i> = |Pool ∩ Relevant| / |Relevant|</td></tr>\n          <tr><td><b><i>M</i> vs <i>K</i></b></td><td>ขนาด Pool vs จำนวนที่แสดง</td><td><i>M</i> คือจำนวนที่ผ่านด่านแรก ส่วน <i>K</i> คือจำนวนที่แสดงบนหน้าจอ โดยมีกฎเหล็กว่า <b><i>M</i> ≥ <i>K</i> เสมอ</b></td></tr>\n        </tbody>\n      </table>\n    </div>\n\n    <div class=\"rs-pipeline-box\">\n      <h4>แผนภาพ Funnel Architecture และกฎเหล็ก Candidate Recall</h4>\n      <p class=\"rs-hybrid-legend\"><span class=\"rs-hy-a\">A · เนื้อหา Content-based</span><span class=\"rs-hy-b\">B · พฤติกรรม Collaborative</span></p>\n      <div class=\"rs-hybrid-route\" role=\"group\" aria-label=\"Cascade Funnel Pipeline\"><div class=\"rs-hy-node rs-hy-b\"><b>1 · ด่านแรก (โมเดล B - CF)</b><span>คัดกรองจากคลังสินค้ามหาศาลเหลือ Top-M</span></div><span class=\"rs-hy-arrow\" aria-hidden=\"true\">→</span><div class=\"rs-hy-node rs-hy-out\"><b>2 · Candidate Pool (M=2)</b><span>เฉพาะ {C2, C1} ที่ผ่านด่าน ส่วน C3, C4 ถูกตัดทิ้ง</span></div><span class=\"rs-hy-arrow\" aria-hidden=\"true\">→</span><div class=\"rs-hy-node rs-hy-a\"><b>3 · ด่านสอง (โมเดล A - Rerank)</b><span>จัดอันดับละเอียดเฉพาะใน Pool → C1 ชนะ C2</span></div></div>\n      \n      <div data-rs-demo=\"hy-cascade\"></div>\n\n      <details class=\"rs-reading-note\"><summary>อ่านลึก: กฎเหล็ก: \"หลุดด่านแรก ด่านสองไม่มีวันกู้คืนได้\" (Recall Ceiling)</summary>\n        <p>สมมุติว่าไอเท็มที่ผู้ใช้ชอบจริงๆ ในใจคือ <b>C3</b> (Relevant Set <i>G</i> = {C3}):</p>\n        <ul>\n          <li>ในด่านแรก โมเดล B คัดกรองเหลือ Pool <i>C</i> = {C1, C2} ทำให้ <b>C3 ตกรอบตั้งแต่ด่านแรก</b></li>\n          <li>Candidate Recall = |{C1, C2} ∩ {C3}| / |{C3}| = 0 / 1 = <b>0.0000</b></li>\n          <li><b>ผลลัพธ์:</b> โมเดลในด่านสอง (Reranker) ต่อให้ฉลาดล้ำเลิศระดับ Deep Transformer หรือมีโมเดลขนาดใหญ่แค่ไหน <b>ก็ไม่มีทางแนะนำ C3 ให้ผู้ใช้ได้เลย!</b> เพราะ C3 ไม่ได้อยู่ใน Pool ที่ส่งมาให้พิจารณาตั้งแต่แรก</li>\n        </ul>\n        <p><b>หลักการออกแบบด่านแรก:</b> ด่าน Retrieval ต้องเน้น <b>Maximize Recall</b> (ครอบคลุมของที่น่าจะชอบให้ได้มากที่สุด) โดยยอมให้มีของไม่ชอบหลุดเข้ามาบ้าง (ยอมรับ Low Precision) เพื่อให้ด่าน Reranker ทำหน้าที่คัดทิ้งในภายหลัง</p>\n      </details>\n    </div>\n\n    <div class=\"rs-decision-box\">\n      <h4>คู่มือการตัดสินใจทางวิศวกรรม (Engineering Decision Guide)</h4>\n      <ul>\n        <li><b>การจัดการกรณีคะแนนในด่านสองเสมอกัน (Tie-breaking):</b> เมื่อโมเดลในด่านสองให้คะแนนเท่ากัน ทางปฏิบัติที่ดีคือการใช้คะแนนจากด่านแรก (Score B) หรือรหัสไอเท็ม (Item ID) เป็นตัวตัดสิน เพื่อไม่ให้ลำดับสุ่มเปลี่ยนไปมา</li>\n        <li><b>ขนาดของ M:</b> การเพิ่มขนาด <i>M</i> (เช่น จาก 100 เป็น 1,000) ช่วยดัน Candidate Recall ให้สูงขึ้น แต่จะเพิ่มภาระ Latency และต้นทุนเซิร์ฟเวอร์ในด่าน Reranking จึงต้องทำ Benchmark เพื่อหาจุดคุ้มค่าทางธุรกิจ</li>\n      </ul>\n    </div>\n    <div class=\"callout\"><b>จำด้วยเส้นทาง:</b> คัดเลือกหยาบตัดของล้านชิ้นเหลือร้อยชิ้น → เรียงละเอียดหาผู้ชนะ Top-K → Cascade Pipeline</div>",
    "sources": [
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 99,
        "topic": "Cascade Hybrid"
      },
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 100,
        "topic": "Candidate Pool และ Tie-break"
      },
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 101,
        "topic": "คัดก่อนเรียง"
      },
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 106,
        "topic": "ขนาด Candidate M และ K"
      }
    ],
    "questions": [
      {
        "id": "cascade-1",
        "q": "ระบบแนะนำที่ใช้โมเดลความเร็วสูงคัดเลือกสินค้าจาก 1,000,000 ชิ้นให้เหลือ 200 ชิ้น แล้วส่งต่อให้ Deep Neural Network จัดอันดับละเอียดเพื่อแสดงผล 10 ชิ้นสุดท้าย จัดเป็น Hybrid รูปแบบใด?",
        "choices": [
          "Weighted Hybrid",
          "Cascade Hybrid (Multi-Stage Pipeline)",
          "Feature Combination",
          "Mixed Hybrid"
        ],
        "answer": 1,
        "explanation": "Cascade Hybrid คือการทำงานเป็นขั้นบันได โดยโมเดลแรกจำกัดขอบเขตชุดผู้สมัคร (Candidate Retrieval) แล้วส่งให้โมเดลถัดไปจัดอันดับภายในชุดนั้น (Reranking)",
        "reasons": [
          "ผิด: Weighted รวมคะแนนของทุกสินค้าพร้อมกัน ไม่ได้กรองเป็นด่าน",
          "ถูกต้อง: คัดกรองผู้สมัครก่อนแล้วจัดอันดับละเอียดในรอบถัดไป",
          "ผิด: Feature Combination ฝึกโมเดลตัวเดียวจากฟีเจอร์รวม",
          "ผิด: Mixed แสดงผลสองโมเดลพร้อมกันบนหน้าจอ"
        ],
        "version": 2
      },
      {
        "id": "cascade-2",
        "q": "หากสินค้า C3 เป็นสินค้าที่ผู้ใช้ต้องการมากที่สุด แต่สินค้า C3 ไม่ผ่านการคัดเลือกในด่านแรก (ไม่ได้อยู่ใน Candidate Pool) โมเดล Reranker ในด่านที่สองจะสามารถแนะนำ C3 ได้หรือไม่?",
        "choices": [
          "ได้ โดยการแอบเพิ่มคะแนนพิเศษให้กับ C3 ในขั้นตอนประเมินผล",
          "ได้เสมอ หากโมเดลในด่านที่สองมีความแม่นยำสูงมากพอ",
          "ไม่ได้ เพราะด่านที่สองจะพิจารณาและให้คะแนนเฉพาะสินค้าที่ผ่านการคัดเลือกเข้ามาใน Pool เท่านั้น",
          "ได้ เพราะการทำ Min-Max Normalization จะดึงสินค้าที่หายไปกลับมาเอง"
        ],
        "answer": 2,
        "explanation": "Cascade มีข้อจำกัดเด็ดขาดคือ Candidate Recall Ceiling หากไอเท็มหลุดตั้งแต่ด่านแรก ด่านที่สองจะไม่มีวันมองเห็นหรือแนะนำไอเท็มนั้นได้เลย",
        "reasons": [
          "ผิด: การแอบเพิ่มคะแนนเป็นการทุจริตผลการทดลอง",
          "ผิด: Reranker ไม่ได้เห็นสินค้าที่อยู่นอก Pool",
          "ถูกต้อง: หลุดด่านแรกแล้วด่านสองไม่มีวันกู้คืนได้ (Recall Ceiling)",
          "ผิด: Normalization ไม่สามารถสร้างสินค้าใหม่ที่อยู่นอกชุดได้"
        ],
        "version": 2
      },
      {
        "id": "cascade-3",
        "q": "ในสถาปัตยกรรม Cascade Hybrid ตัวแปร M (จำนวนใน Candidate Pool) และ K (จำนวนสินค้าที่แสดงผลสุดท้าย) มีความสัมพันธ์กันอย่างไรตามหลักวิศวกรรม?",
        "choices": [
          "M คือค่า Loss Function ส่วน K คือค่า Learning Rate ของโมเดล",
          "M จะต้องมีค่าน้อยกว่า K เสมอ (M < K)",
          "M และ K จะต้องมีค่าเท่ากันและเท่ากับจำนวนผู้ใช้ทั้งหมดในระบบ",
          "M จะต้องมีค่ามากกว่าหรือเท่ากับ K เสมอ (M ≥ K) โดยมักคัดกรองผู้สมัครมาเผื่อมากกว่าจำนวนที่จะแสดงจริง"
        ],
        "answer": 3,
        "explanation": "M คือขนาดของชุดผู้สมัครที่คัดมารอบแรก ส่วน K คือจำนวนสินค้าสุดท้ายที่จะนำไปแสดงบนหน้าจอ ดังนั้น M ต้องมากกว่าหรือเท่ากับ K เสมอ",
        "reasons": [
          "ผิด: M และ K ในบริบทนี้คือขนาดของชุด Candidate และผลลัพธ์ Top-K",
          "ผิด: ถ้า M < K สินค้าจะไม่พอเติมช่องแสดงผล K ช่อง",
          "ผิด: M และ K เป็นขนาดรายการสินค้า ไม่ใช่จำนวนผู้ใช้",
          "ถูกต้อง: M ≥ K เสมอเพื่อเปิดทางเลือกให้ด่านสองจัดอันดับ"
        ],
        "version": 2
      },
      {
        "id": "cascade-4",
        "q": "กำหนดให้เซตสินค้าที่เกี่ยวข้องจริงของผู้ใช้คือ G = {C3} แต่ด่าน Retrieval ส่งชุดผู้สมัครผ่านเข้ามาได้เพียง Pool = {C1, C2} ค่า Candidate Recall ของด่านนี้มีค่าเท่าใด?",
        "choices": [
          "0.0000",
          "1.0000",
          "0.5000",
          "ไม่สามารถคำนวณได้เพราะจำนวนสินค้าใน Pool ไม่เท่ากับหนึ่ง"
        ],
        "answer": 0,
        "explanation": "สูตร Candidate Recall คือ |Pool ∩ G| / |G| เนื่องจาก {C1, C2} ∩ {C3} เป็นเซตว่าง (ขนาด = 0) ดังนั้น Recall = 0 / 1 = 0.0000",
        "reasons": [
          "ถูกต้อง: ไม่สามารถเก็บสินค้าเป้าหมายเข้ามาใน Pool ได้เลย ค่า Recall จึงเป็น 0",
          "ผิด: 1.0000 คือเก็บสินค้าเป้าหมายได้ครบสมบูรณ์",
          "ผิด: 0.5000 เกิดจากการเข้าใจผิดเรื่องขนาดของ Pool",
          "ผิด: สามารถคำนวณได้ตามหลักทฤษฎีเซตปกติ"
        ],
        "version": 2
      }
    ]
  },
  {
    "id": "recsys-hy-meta",
    "title": "Meta-Level Hybrid: ส่งต่อโมเดลและตัวแทนรสนิยม",
    "subtitle": "Burke แบบที่ 7: โมเดลแรกสร้างเวกเตอร์โปรไฟล์ แล้วส่งทั้งก้อนให้โมเดลที่สองใช้งาน",
    "desc": "เจาะลึก Representation Sharing, การใช้เวกเตอร์เนื้อหาวัดความคล้ายใน Collaborative Filtering และความต่างจาก Augmentation",
    "content": "<div class=\"rs-story-box\">\n      <h4>เรื่องเล่าและที่มาในชีวิตจริง (Story & Real-World Purpose)</h4>\n      <p>สมมุติว่าคุณและเพื่อนร่วมงานคนหนึ่ง ต่างก็ชื่นชอบหนังสือแนว <b>\"ควอนตัมฟิสิกส์และการเขียนโปรแกรมเชิงฟังก์ชัน\"</b> เหมือนกันเป๊ะ:</p>\n      <ul>\n        <li>แต่ในชีวิตจริง คุณซื้อหนังสือจากสำนักพิมพ์ในยุโรป ส่วนเพื่อนซื้อหนังสือจากสำนักพิมพ์ในอเมริกา ทั้งสองคน <b>ไม่เคยซื้อหนังสือเล่มเดียวกันเลยแม้แต่เล่มเดียว!</b></li>\n        <li>ถ้าระบบแนะนำใช้ Collaborative Filtering แบบเดิมๆ ที่ดูเฉพาะ <i>\"ประวัติการซื้อของชิ้นเดียวกัน\"</i> ระบบจะสรุปว่าคุณสองคนไม่มีความเกี่ยวข้องกันเลย (Cosine = 0) เพราะไม่มีไอเท็มที่เคยซื้อร่วมกัน!</li>\n        <li><b>แนวทางแก้ไขแบบ Meta-Level:</b> เราให้โมเดลเนื้อหา (A) วิเคราะห์หนังสือทั้งหมดที่คุณเคยอ่าน แล้วสังเคราะห์เป็น <b>\"เวกเตอร์โปรไฟล์รสนิยม (User Profile Vector)\"</b> จากนั้นส่งเวกเตอร์โปรไฟล์นี้ให้โมเดล Collaborative (B) ใช้งาน</li>\n      </ul>\n      <p>เมื่อโมเดล B นำเวกเตอร์โปรไฟล์ของคุณและเพื่อนมาคำนวณความคล้าย จะพบว่าตรงกันถึง 80%! โมเดล B จึงสามารถแนะนำหนังสือที่เพื่อนชอบให้คุณได้ทันที แม้ในอดีตจะไม่เคยมีไอเท็มร่วมกันเลยก็ตาม!</p>\n    </div>\n\n    <div class=\"rs-terms-box\">\n      <h4>ถอดรหัสคำศัพท์และตัวย่อสำคัญ (Key Terms Decoded)</h4>\n      <table class=\"rs-term-table\">\n        <thead><tr><th>คำศัพท์ / สัญลักษณ์</th><th>คำอ่าน & ความหมายเชิงระบบ</th><th>บทบาทในระบบ Meta-Level</th></tr></thead>\n        <tbody>\n          <tr><td><b>Meta-Level Hybrid</b></td><td>การผสานระดับตัวแทนโมเดล</td><td>สถาปัตยกรรมที่โมเดลแรกสร้าง <b>โมเดลตัวแทน (Representation/Profile)</b> ทั้งก้อนเพื่อให้อีกโมเดลนำไปใช้</td></tr>\n          <tr><td><b>User Profile Vector (<i>p<sub>u</sub></i>)</b></td><td>เวกเตอร์โปรไฟล์รสนิยมของผู้ใช้</td><td>เวกเตอร์ตัวแทนความชอบที่โมเดลเนื้อหาสกัดออกมาจากข้อความและหมวดหมู่ของสินค้าที่เคยดู</td></tr>\n          <tr><td><b>Profile Cosine Similarity</b></td><td>ความคล้ายของโปรไฟล์</td><td>การคำนวณความใกล้เคียงระหว่างผู้ใช้โดยใช้เวกเตอร์โปรไฟล์เนื้อหา แทนการใช้ประวัติการให้ดาว</td></tr>\n          <tr><td><b>Meta vs Augmentation</b></td><td>จุดตัดระหว่างสองรูปแบบ</td><td>Augmentation ส่ง <b>ตัวเลขคำทำนาย 1 ค่า (Prediction)</b> แต่ Meta-Level ส่ง <b>เวกเตอร์ตัวแทนทั้งก้อน (Model/Profile)</b></td></tr>\n        </tbody>\n      </table>\n    </div>\n\n    <div class=\"rs-pipeline-box\">\n      <h4>โครงสร้างการทำงานและการคำนวณความคล้ายจากโปรไฟล์</h4>\n      <p class=\"rs-hybrid-legend\"><span class=\"rs-hy-a\">A · เนื้อหา Content-based</span><span class=\"rs-hy-b\">B · พฤติกรรม Collaborative</span></p>\n      <div class=\"rs-hybrid-route\" role=\"group\" aria-label=\"Meta-Level Hybrid Pipeline\"><div class=\"rs-hy-node rs-hy-a\"><b>1 · โมเดล A สกัดโปรไฟล์</b><span>สร้างเวกเตอร์รสนิยม pu = [1.0, 0.0] และ pv = [0.8, 0.6]</span></div><span class=\"rs-hy-arrow\" aria-hidden=\"true\">→</span><div class=\"rs-hy-node rs-hy-out\"><b>2 · ส่งต่อ Representation</b><span>ส่งเวกเตอร์โปรไฟล์ทั้งก้อนข้ามระบบ</span></div><span class=\"rs-hy-arrow\" aria-hidden=\"true\">→</span><div class=\"rs-hy-node rs-hy-b\"><b>3 · โมเดล B หาเพื่อนบ้าน</b><span>ใช้ Profile Cosine หาเพื่อน → ทำนายคะแนนดาว</span></div></div>\n      \n      <p>ตัวอย่างการคำนวณความคล้ายระหว่างผู้ใช้ <i>u</i> และ <i>v</i> โดยใช้เวกเตอร์ที่โมเดล A สกัดมา:</p>\n      <div class=\"formula\">\\text{Cosine}(p_u, p_v) = \\frac{[1, 0] \\cdot [0.8, 0.6]}{\\|[1, 0]\\|_2 \\cdot \\|[0.8, 0.6]\\|_2} = \\frac{0.8}{1.0 \\times 1.0} = 0.8000</div>\n      <div data-rs-demo=\"hy-meta\"></div>\n      \n      <p>จากนั้นโมเดล B (CF) จะใช้เพื่อนบ้าน <i>v</i> ที่ค้นพบจากโปรไฟล์เนื้อหา มาช่วยทำนายคะแนนสำหรับสินค้า <b>C2</b> ที่ <i>v</i> เคยให้คะแนนไว้ 5 ดาว:</p>\n      <div class=\"formula\">\\hat{r}(u, C2) = \\bar{r}_u + \\text{Cosine}(p_u, p_v) \\cdot (r(v, C2) - \\bar{r}_v) = 3.0 + 0.8 \\cdot (5.0 - 3.0) / 0.8 = 5.0 \\text{ ดาว}</div>\n    </div>\n\n    <div class=\"rs-decision-box\">\n      <h4>คู่มือการตัดสินใจทางวิศวกรรม (Engineering Decision Guide)</h4>\n      <ul>\n        <li><b>ก้าวข้ามจุดบอด Co-rated Items:</b> Collaborative Filtering ทั่วไปต้องการให้มีสินค้าที่ผู้ใช้สองคนเคยให้คะแนนร่วมกัน (Co-rated Items) แต่ Meta-Level ปลดล็อกข้อจำกัดนี้โดยใช้ความคล้ายของเนื้อหาประวัติแทน</li>\n        <li><b>การป้องกัน Leakage:</b> เวกเตอร์โปรไฟล์ของผู้ใช้ <i>p<sub>u</sub></i> จะต้องสร้างขึ้นจากเฉพาะประวัติในชุดฝึก (Train Set) เท่านั้น ห้ามแอบนำข้อมูลการคลิกหรือดาวในชุดทดสอบมารวมสร้างโปรไฟล์เด็ดขาด</li>\n      </ul>\n    </div>\n    <div class=\"callout\"><b>จำด้วยเส้นทาง:</b> A สร้างเวกเตอร์รสนิยมทั้งก้อน → B เอาเวกเตอร์ไปใช้หาเพื่อนบ้าน → Meta-Level Hybrid</div>",
    "sources": [
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 129,
        "topic": "การเปรียบเทียบ Augmentation กับ Meta-Level"
      },
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 137,
        "topic": "Meta-Level Architecture"
      },
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 138,
        "topic": "การใช้โปรไฟล์หาเพื่อนบ้าน"
      },
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 142,
        "topic": "การตีความความคล้าย"
      }
    ],
    "questions": [
      {
        "id": "meta-1",
        "q": "ระบบแนะนำที่ให้โมเดลเนื้อหา (Content-based) สกัดเวกเตอร์โปรไฟล์ความสนใจของผู้ใช้ออกมา แล้วส่งเวกเตอร์โปรไฟล์นี้ไปให้โมเดล Collaborative Filtering ใช้คำนวณ Cosine เพื่อหาเพื่อนบ้าน จัดเป็น Hybrid รูปแบบใด?",
        "choices": [
          "Weighted Hybrid",
          "Meta-Level Hybrid",
          "Mixed Hybrid",
          "Cascade Hybrid"
        ],
        "answer": 1,
        "explanation": "Meta-Level Hybrid คือการที่โมเดลหนึ่งสร้างโมเดลตัวแทน (Representation/User Profile) แล้วส่งทั้งก้อนให้อีกโมเดลนำไปใช้ในการคำนวณ",
        "reasons": [
          "ผิด: Weighted รวมคะแนนผลลัพธ์สุดท้าย",
          "ถูกต้อง: ส่งเวกเตอร์ตัวแทนโมเดล (Representation) ข้ามระบบให้อีกโมเดลใช้งาน",
          "ผิด: Mixed นำผลลัพธ์มารวมบนหน้าจอ UI",
          "ผิด: Cascade ส่งเฉพาะเซตผู้สมัคร Candidate Pool"
        ],
        "version": 2
      },
      {
        "id": "meta-2",
        "q": "จุดตัดสำคัญที่สุดในการแยกแยะระหว่าง Meta-Level Hybrid กับ Feature Augmentation ตามอนุกรมวิธานของ Burke คืออะไร?",
        "choices": [
          "Feature Augmentation ไม่สามารถทำงานกับข้อมูลข้อความได้เลย",
          "Meta-Level ใช้ได้เฉพาะกับระบบที่มีผู้ใช้มากกว่า 1,000,000 คนเท่านั้น",
          "Meta-Level ส่งตัวแทนโมเดลหรือเวกเตอร์โปรไฟล์ทั้งก้อน ส่วน Feature Augmentation ส่งผลลัพธ์การทำนาย (Prediction/Pseudo-score) เพียงค่าตัวเลข",
          "ไม่มีความแตกต่างใดๆ ทั้งสองวิธีส่งข้อมูลชนิดเดียวกัน"
        ],
        "answer": 2,
        "explanation": "ความต่างอยู่ที่ Payload ของลูกศรที่เชื่อมระหว่างโมเดล: Augmentation ส่งตัวเลขผลทำนาย (Single prediction) แต่ Meta-Level ส่งโมเดลตัวแทนหรือเวกเตอร์รสนิยมทั้งก้อน (Full representation)",
        "reasons": [
          "ผิด: Feature Augmentation ทำงานกับข้อมูลข้อความได้",
          "ผิด: จำนวนผู้ใช้ไม่ใช่เกณฑ์การจำแนกสถาปัตยกรรม",
          "ถูกต้อง: ตรวจสอบที่ Payload: ส่งตัวแทนทั้งก้อน (Meta) vs ส่งผลทำนายตัวเลข (Augmentation)",
          "ผิด: Payload และสถาปัตยกรรมภายในแตกต่างกันชัดเจน"
        ],
        "version": 2
      },
      {
        "id": "meta-3",
        "q": "กำหนดให้เวกเตอร์โปรไฟล์ของผู้ใช้ u คือ pu = [1.0, 0.0] และผู้ใช้ v คือ pv = [0.8, 0.6] ค่าความคล้าย Cosine Similarity ระหว่างสองโปรไฟล์นี้คือเท่าใด?",
        "choices": [
          "ไม่สามารถคำนวณได้เนื่องจากไม่มีประวัติการซื้อสินค้าร่วมกัน",
          "1.4000",
          "0.6000",
          "0.8000"
        ],
        "answer": 3,
        "explanation": "สูตร Cosine คือ (pu · pv) / (||pu|| * ||pv||) = (1.0*0.8 + 0.0*0.6) / (1.0 * √(0.64 + 0.36)) = 0.8 / (1.0 * 1.0) = 0.8000",
        "reasons": [
          "ผิด: คำนวณได้โดยตรงจากเวกเตอร์โปรไฟล์เนื้อหา ไม่จำเป็นต้องมีสินค้าร่วมกัน",
          "ผิด: 1.4000 คือการนำตัวเลขมารวมกันโดยไม่ใช้สูตร Cosine",
          "ผิด: 0.6000 คือตัวเลขในมิติที่สองของ pv",
          "ถูกต้อง: (1.0 × 0.8) / (1.0 × 1.0) = 0.8000"
        ],
        "version": 2
      },
      {
        "id": "meta-4",
        "q": "แม้ผู้ใช้สองคนจะไม่เคยให้คะแนนสินค้าชิ้นเดียวกันเลยในอดีต แต่โมเดล Meta-Level สามารถสรุปว่าทั้งสองคนมีความชอบคล้ายกันได้จากสิ่งใด?",
        "choices": [
          "จากความใกล้เคียงกันของเวกเตอร์โปรไฟล์เนื้อหาที่ผู้ใช้ทั้งสองเคยมีปฏิสัมพันธ์ในอดีต",
          "จากการเดาสุ่มด้วยฟังก์ชัน Random ในภาษาโปรแกรม",
          "จากการเปิดดูข้อมูลชุดทดสอบ (Test Set) ในอนาคตของผู้ใช้ทั้งสอง",
          "จากการบังคับให้คะแนนของผู้ใช้ทุกคนมีค่าเท่ากับค่าเฉลี่ยของระบบ"
        ],
        "answer": 0,
        "explanation": "Meta-Level ใช้ความคล้ายจากโปรไฟล์เนื้อหา (Profile Similarity) เป็นสะพานเชื่อม ทำให้ก้าวข้ามจุดบอดเรื่อง Co-rated Items ของ Collaborative Filtering ได้",
        "reasons": [
          "ถูกต้อง: ใช้เวกเตอร์โปรไฟล์เนื้อหาเป็นหลักฐานความคล้ายข้ามบุคคล",
          "ผิด: ไม่ได้มาจากการเดาสุ่ม",
          "ผิด: การเปิดดู Test เป็น Data Leakage ร้ายแรง",
          "ผิด: ไม่ได้บังคับให้คะแนนเท่ากับค่าเฉลี่ย"
        ],
        "version": 2
      }
    ]
  },
  {
    "id": "recsys-hy-lightfm",
    "title": "LightFM: หลอมรวม ID และคุณลักษณะในปริภูมิเวกเตอร์เดียวกัน",
    "subtitle": "การรวมเวกเตอร์แบบ Additive เพื่อก้าวข้ามจุดบอด Cold-Start ของ Matrix Factorization",
    "desc": "เข้าใจโครงสร้างเวกเตอร์รวม pu และ qi, การคำนวณ Dot Product และการรับมือสินค้าใหม่ (Cold Item) อย่างสง่างาม",
    "content": "<div class=\"rs-story-box\">\n      <h4>เรื่องเล่าและที่มาในชีวิตจริง (Story & Real-World Purpose)</h4>\n      <p>ในยุคของ <b>Matrix Factorization</b> แบบคลาสสิก (เช่น SVD):</p>\n      <ul>\n        <li>ระบบจะเรียนรู้เวกเตอร์ความชอบของผู้ใช้จาก <b>User ID</b> และเวกเตอร์ของสินค้าจาก <b>Item ID</b> ล้วนๆ</li>\n        <li><b>จุดบอดร้ายแรง:</b> เมื่อผู้ขายอัปโหลดสินค้าใหม่แกะกล่องเข้ามาในระบบ สินค้านั้น <b>ยังไม่มี Item ID อยู่ในตาราง Matrix Factorization เลย!</b> ผลคือระบบไม่สามารถสร้างเวกเตอร์ให้สินค้านั้นได้ เกิดอาการ <i>Cold-Start ล้มเหลวโดยสมบูรณ์</i></li>\n      </ul>\n      <p><b>LightFM</b> (Kula, 2015) จึงถูกคิดค้นขึ้นมาเพื่อปฏิวัติวงการ: โดยเสนอแนวคิดว่า <i>\"ตัวตนของสินค้า ไม่ได้มีแค่รหัสประจำตัว (Item ID) แต่ยังประกอบด้วยสิ่งที่มันเป็น (คุณลักษณะ / Tags / หมวดหมู่) ด้วย!\"</i></p>\n      <p>LightFM หลอมรวมเวกเตอร์ ID เข้ากับเวกเตอร์ Tags ใน <b>ปริภูมิเวกเตอร์เดียวกัน (Shared Latent Space)</b> ทำให้สินค้าใหม่ที่ยังไม่มี ID สามารถถอยกลับไปใช้ผลรวมของ Tags เพื่อแนะนำตัวเองได้ทันที!</p>\n    </div>\n\n    <div class=\"rs-terms-box\">\n      <h4>ถอดรหัสคำศัพท์และตัวย่อสำคัญ (Key Terms Decoded)</h4>\n      <table class=\"rs-term-table\">\n        <thead><tr><th>คำศัพท์ / สัญลักษณ์</th><th>คำอ่าน & ความหมายเชิงระบบ</th><th>บทบาทในโมเดล LightFM</th></tr></thead>\n        <tbody>\n          <tr><td><b>LightFM</b></td><td>สถาปัตยกรรม Factorization Machine แบบเบา</td><td>โมเดล Hybrid ยอดนิยมที่นำเวกเตอร์ ID มารวมกับเวกเตอร์คุณลักษณะด้วยการบวก (Additive)</td></tr>\n          <tr><td><b>Shared Latent Space</b></td><td>ปริภูมิแฝงร่วม</td><td>มิติเวกเตอร์เดียวกันที่ทั้ง ID และ Tags ถูกฝึกร่วมกันผ่าน Interaction Loss</td></tr>\n          <tr><td><b>Warm Item</b></td><td>สินค้าเก่าที่มีประวัติ</td><td>สินค้าที่ระบบมีทั้งเวกเตอร์ ID และเวกเตอร์ Tags จึงได้ความแม่นยำสูงสุด</td></tr>\n          <tr><td><b>Cold Item</b></td><td>สินค้าใหม่แกะกล่อง</td><td>สินค้าที่ยังไม่มีเวกเตอร์ ID แต่ LightFM ใช้ <b>ผลรวมของเวกเตอร์ Tags</b> มาคำนวณคะแนนได้ทันที!</td></tr>\n          <tr><td><b>Graceful Degradation</b></td><td>การลดทอนประสิทธิภาพอย่างนุ่มนวล</td><td>ระบบไม่พังเมื่อเจอของใหม่ แต่ถอยกลับไปทำงานในโหมดเนื้อหาอย่างราบรื่น</td></tr>\n        </tbody>\n      </table>\n    </div>\n\n    <div class=\"rs-pipeline-box\">\n      <h4>โครงสร้างสมการและการคำนวณเวกเตอร์ใน LightFM</h4>\n      <p>ใน LightFM เวกเตอร์ของสินค้าและผู้ใช้ เกิดจากการ <b>รวมแบบผลบวก (Summation)</b> ของเวกเตอร์ ID และเวกเตอร์คุณลักษณะ:</p>\n      <div class=\"formula\">q_i = e_{\\text{id}}(i) + \\sum_{g \\in \\text{tags}(i)} e_{\\text{tag}}(g) \\qquad p_u = e_{\\text{id}}(u) + \\sum_{f \\in \\text{features}(u)} e_{\\text{feat}}(f)<br>Score(u, i) = p_u^T q_i</div>\n      \n      <p>ตัวอย่างการคำนวณคะแนนระหว่างผู้ใช้ <i>u</i> กับสินค้าเก่า <b>C1 (Warm)</b> และสินค้าใหม่ <b>C4 (Cold)</b>:</p>\n      <ul>\n        <li><b>ผู้ใช้ u:</b> มี <i>e<sub>id</sub></i> = [0.2, 0.1] และมีแท็ก Data = [0.3, 0.1] → เวกเตอร์รวม <code>p = [0.2+0.3, 0.1+0.1] = [0.5, 0.2]</code></li>\n        <li><b>สินค้าเก่า C1 (Warm):</b> มี <i>e<sub>id</sub></i> = [0.1, 0.1] และแท็ก Data = [0.4, 0.2] → เวกเตอร์รวม <code>q_C1 = [0.5, 0.3]</code>\n          <div class=\"formula\">Score(u, C1) = p \\cdot q_{C1} = (0.5 \\times 0.5) + (0.2 \\times 0.3) = 0.25 + 0.06 = 0.3100</div>\n        </li>\n        <li><b>สินค้าใหม่ C4 (Cold):</b> ไม่มีรหัสในประวัติ (<i>e<sub>id</sub></i> = [0, 0]) แต่มีแท็ก Data = [0.4, 0.2] → เวกเตอร์รวม <code>q_C4 = [0.4, 0.2]</code>\n          <div class=\"formula\">Score(u, C4) = p \\cdot q_{C4} = (0.5 \\times 0.4) + (0.2 \\times 0.2) = 0.20 + 0.04 = 0.2400</div>\n        </li>\n      </ul>\n      <div data-rs-demo=\"hy-lightfm\"></div>\n      <p>จะเห็นได้ชัดเจนว่าสินค้าใหม่ <b>C4 สามารถคำนวณคะแนนและจัดอันดับได้ทันที (0.2400)</b> โดยไม่ต้องรอให้มีคนมากดไลก์ก่อน และไม่ต้องเทรนโมเดลใหม่ทั้งระบบ!</p>\n    </div>\n\n    <div class=\"rs-decision-box\">\n      <h4>คู่มือการตัดสินใจทางวิศวกรรม (Engineering Decision Guide)</h4>\n      <ul>\n        <li><b>ความมหัศจรรย์ของ Shared Space:</b> เวกเตอร์ ID และ Tags ไม่ได้นำมาจากคนละโมเดลแล้วนำมาบวกกันแบบมั่วๆ แต่ถูก <b>เรียนรู้พร้อมกันตั้งแต่ต้น (Jointly Trained)</b> ภายใต้ Loss เดียวกัน ทำให้พวกมันรู้ความหมายของกันและกันในปริภูมิเวกเตอร์</li>\n        <li><b>ข้อจำกัด:</b> หากมีสินค้าใหม่ที่ใช้แท็กที่ไม่เคยปรากฏใน Vocabulary มาก่อนเลย (เช่น หมวดหมู่ใหม่ที่เพิ่งสร้าง) เวกเตอร์ทั้งหมดจะเป็นศูนย์และต้องอาศัย Fallback Policy เช่นเดิม</li>\n      </ul>\n    </div>\n    <div class=\"callout\"><b>จำด้วยเส้นทาง:</b> ตัวตน (ID) + สิ่งที่มันเป็น (Tags) ในเวกเตอร์เดียวกัน · ไม่มี ID ก็อาศัย Tags ช่วยกู้ชีพ → LightFM</div>",
    "sources": [
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 112,
        "topic": "LightFM Architecture"
      },
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 113,
        "topic": "เวกเตอร์รวม Additive Embeddings"
      },
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 114,
        "topic": "Cold-Start Handling ใน LightFM"
      },
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 115,
        "topic": "ตัวอย่างการคำนวณ Dot Product"
      }
    ],
    "questions": [
      {
        "id": "lightfm-1",
        "q": "โมเดล LightFM สร้างเวกเตอร์ตัวแทนของสินค้า (qi) และผู้ใช้ (pu) ด้วยวิธีการใดในปริภูมิเวกเตอร์เดียวกัน?",
        "choices": [
          "ต่อเวกเตอร์เข้าด้วยกันให้ยาวขึ้นเรื่อยๆ ตามจำนวนสินค้าทั้งหมดในโลก",
          "รวมเวกเตอร์รหัสประจำตัว (ID Embedding) เข้ากับผลรวมของเวกเตอร์คุณลักษณะ (Tag Embeddings) ด้วยการบวก (Summation)",
          "สุ่มเลือกแท็กเพียงอันเดียวแล้วลบรหัสประจำตัว (ID) ทิ้งเสมอ",
          "ใช้อันดับที่จาก Reciprocal Rank Fusion (RRF) มาแทนค่าเวกเตอร์"
        ],
        "answer": 1,
        "explanation": "LightFM ใช้การบวกเวกเตอร์แบบ Additive: q_i = e_id(i) + Σ e_tag(g) ในปริภูมิเวกเตอร์เดียวกันที่ถูกเรียนรู้ร่วมกัน",
        "reasons": [
          "ผิด: LightFM ใช้การบวกเวกเตอร์ในมิติคงที่ ไม่ใช่ Concatenate ขยายความยาว",
          "ถูกต้อง: รวมเวกเตอร์ ID และ Feature Embeddings เข้าด้วยกันด้วยการบวก",
          "ผิด: ไม่ได้สุ่มเลือกแท็กเดียวและไม่ลบ ID ทิ้ง",
          "ผิด: RRF เป็นเทคนิคการรวมอันดับ ไม่ใช่โครงสร้างของ LightFM"
        ],
        "version": 2
      },
      {
        "id": "lightfm-2",
        "q": "กำหนดเวกเตอร์ผู้ใช้ p = [0.5, 0.2] และสินค้าใหม่ C4 ซึ่งไม่มีเวกเตอร์ ID แต่มีเวกเตอร์แท็กหมวดหมู่ q_C4 = [0.4, 0.2] คะแนนทำนาย Score(u, C4) ด้วย Dot Product จะมีค่าเท่าใด?",
        "choices": [
          "1.3000",
          "0.3100",
          "0.2400",
          "0.2000"
        ],
        "answer": 2,
        "explanation": "คำนวณ Dot Product: (0.5 * 0.4) + (0.2 * 0.2) = 0.20 + 0.04 = 0.2400",
        "reasons": [
          "ผิด: 1.3000 คือการนำตัวเลขในเวกเตอร์มารวมกันตรงๆ",
          "ผิด: 0.3100 เป็นคะแนนของสินค้าเก่า C1 ที่มีเวกเตอร์ ID ร่วมด้วย",
          "ถูกต้อง: (0.5 × 0.4) + (0.2 × 0.2) = 0.20 + 0.04 = 0.2400",
          "ผิด: 0.2000 ลืมบวกมิติที่สอง (0.2 * 0.2)"
        ],
        "version": 2
      },
      {
        "id": "lightfm-3",
        "q": "เหตุใด LightFM จึงสามารถแนะนำสินค้าใหม่แกะกล่องที่เพิ่งเพิ่มเข้ามาในระบบและยังไม่เคยมีใครคลิกดูมาก่อน (Cold Item) ได้อย่างมีประสิทธิภาพ?",
        "choices": [
          "เพราะ LightFM บังคับให้สินค้าใหม่ทุกคนได้รับคะแนนเต็ม 100% เสมอ",
          "เพราะ LightFM สามารถเชื่อมต่อระบบพลังจิตเพื่อเดาความชอบของผู้ใช้ได้",
          "เพราะระบบจะแอบเปิดดูข้อมูลการซื้อในอนาคตของสินค้าใหม่นี้มาสร้าง ID",
          "เพราะสินค้านั้นยังคงมีคุณลักษณะหรือแท็ก (Shared Features) ที่ระบบเคยเรียนรู้เวกเตอร์ไว้แล้วจากสินค้าชิ้นอื่นๆ"
        ],
        "answer": 3,
        "explanation": "สินค้าใหม่แม้จะไม่มี ID ในอดีต แต่มี Tags (เช่น ประเภทคอร์ส, ผู้สอน) ที่โมเดลเคยเรียนรู้เวกเตอร์มาจากสินค้าอื่นแล้ว ทำให้สร้างเวกเตอร์แนะนำได้ทันที",
        "reasons": [
          "ผิด: ไม่ได้บังคับให้สินค้าใหม่ได้คะแนนเต็ม",
          "ผิด: คอมพิวเตอร์ไม่มีพลังจิต",
          "ผิด: การเปิดดูอนาคตคือ Data Leakage",
          "ถูกต้อง: ใช้ประโยชน์จาก Feature Embeddings ที่เคยเรียนรู้ร่วมกันมาจากสินค้าอื่น"
        ],
        "version": 2
      },
      {
        "id": "lightfm-4",
        "q": "หากสินค้าใหม่มีแท็กหมวดหมู่ที่ไม่เคยปรากฏอยู่ในฐานข้อมูลมาก่อนเลย (Out-Of-Vocabulary Tag) และไม่มีข้อมูลใดๆ ที่ระบบรู้จัก โมเดล LightFM จะรับมืออย่างไร?",
        "choices": [
          "เวกเตอร์ของสินค้าจะกลายเป็นเวกเตอร์ศูนย์ทั้งหมด และระบบต้องส่งต่อไปยัง Fallback Policy เพื่อจัดการ",
          "ระบบจะทำการปิดเซิร์ฟเวอร์ลงโดยอัตโนมัติเพื่อป้องกันข้อผิดพลาด",
          "ระบบจะเสกเวกเตอร์ของสินค้าชิ้นที่ขายดีที่สุดมาใส่แทนโดยอัตโนมัติ",
          "คะแนนจะถูกปรับให้กลายเป็นความน่าจะเป็น 100% ทันที"
        ],
        "answer": 0,
        "explanation": "ถ้าไม่มีทั้ง ID และไม่มีทั้ง Feature ที่รู้จัก เวกเตอร์จะเป็นศูนย์ ระบบไม่สามารถสร้างคำทำนายเฉพาะตัวได้ จึงต้องมี Fallback Policy มารองรับ",
        "reasons": [
          "ถูกต้อง: เมื่อไร้คุณลักษณะที่รู้จัก ต้องส่งต่อ Fallback Policy",
          "ผิด: เซิร์ฟเวอร์ไม่ควรปิดตัวลงเมื่อเจอข้อมูลใหม่",
          "ผิด: ไม่ควรเอาเวกเตอร์สินค้าอื่นมาสวมรอยโดยไม่แจ้งระบบ",
          "ผิด: คะแนนศูนย์ไม่ได้กลายเป็นความน่าจะเป็น 100%"
        ],
        "version": 2
      }
    ]
  },
  {
    "id": "recsys-hy-graph",
    "title": "LightGCN: พฤติกรรมเป็นกราฟสองฝั่งและการแพร่หลายช่วง",
    "subtitle": "การส่งผ่านความชอบผ่านเส้นทางเครือข่าย พร้อมการตัดทอนน้ำหนักตาม Degree",
    "desc": "เข้าใจโครงสร้าง Bipartite Graph, Symmetric Degree Normalization, กลไก Multi-hop Propagation และการป้องกัน Over-smoothing",
    "content": "<div class=\"rs-story-box\">\n      <h4>เรื่องเล่าและที่มาในชีวิตจริง (Story & Real-World Purpose)</h4>\n      <p>ลองจินตนาการถึงเครือข่ายใยแมงมุมขนาดใหญ่ที่เชื่อมโยงระหว่างผู้ใช้กับสินค้า:</p>\n      <ul>\n        <li>คุณ (ผู้ใช้ <b>g1</b>) เคยลงเรียนคอร์ส <b>C1 (Python)</b></li>\n        <li>มีผู้ใช้อีกคนหนึ่ง (ผู้ใช้ <b>g2</b>) ก็ลงเรียนคอร์ส <b>C1</b> เช่นกัน แต่ g2 ยังได้ลงเรียนคอร์ส <b>C3 (UX)</b> เพิ่มอีกด้วย!</li>\n      </ul>\n      <p>แม้ว่าในชีวิตจริงคุณกับ g2 จะไม่เคยรู้จักกัน และคุณไม่เคยได้ยินชื่อคอร์ส C3 มาก่อนเลย แต่ถ้าเรามองผ่านโครงข่ายใยแมงมุม คุณสามารถ <i>\"เดินทางไปถึงคอร์ส C3 ได้ใน 3 ก้าว\"</i> (<code>g1 → C1 → g2 → C3</code>)!</p>\n      <p>นี่คือหัวใจของ <b>Graph-based Collaborative Filtering</b> และโมเดลที่ทรงพลังที่สุดในปัจจุบันคือ <b>LightGCN (He et al., SIGIR 2020)</b> ซึ่งจำลองการแพร่กระจายสัญญาณความชอบไปตามเส้นเชื่อมของกราฟได้อย่างรวดเร็วและแม่นยำ</p>\n    </div>\n\n    <div class=\"rs-terms-box\">\n      <h4>ถอดรหัสคำศัพท์และตัวย่อสำคัญ (Key Terms Decoded)</h4>\n      <table class=\"rs-term-table\">\n        <thead><tr><th>คำศัพท์ / สัญลักษณ์</th><th>คำอ่าน & ความหมายเชิงระบบ</th><th>บทบาทในโมเดล LightGCN</th></tr></thead>\n        <tbody>\n          <tr><td><b>Bipartite Graph</b></td><td>กราฟสองส่วนสองกลุ่มโหนด</td><td>กราฟที่มีโหนด 2 กลุ่ม: ผู้ใช้ (Users) และสินค้า (Items) โดยเส้นเชื่อมจะเกิดขึ้นข้ามกลุ่มเท่านั้น</td></tr>\n          <tr><td><b>LightGCN</b></td><td>แบบจำลองกราฟคอนโวลูชันแบบเบา</td><td>ตัด Weight Matrix และ Activation Function ซับซ้อนออก เหลือเพียง Linear Message Passing</td></tr>\n          <tr><td><b>Degree (<i>d<sub>u</sub>, d<sub>i</sub></i>)</b></td><td>ระดับขั้น / จำนวนเส้นเชื่อมของโหนด</td><td>จำนวนเพื่อนบ้านที่โหนดนั้นเชื่อมต่อ (เช่น สินค้า C1 มีคนเรียน 2 คน แสดงว่า <i>d<sub>C1</sub></i> = 2)</td></tr>\n          <tr><td><b>Symmetric Degree Normalization</b></td><td>การปรับน้ำหนักเส้นเชื่อมแบบสมมาตร</td><td>ตัวถ่วงน้ำหนัก <code>1 / √(d_u · d_i)</code> เพื่อป้องกันไม่ให้สินค้ายอดฮิต (High-degree) ส่งเสียงดังกลบสินค้าอื่น</td></tr>\n          <tr><td><b>Multi-Hop Path</b></td><td>เส้นทางเดินหลายช่วงทอด</td><td>การส่งต่อความชอบผ่านตัวกลางหลายทอด เช่น 3-Hop จากผู้ใช้ ไปหาสินค้า ไปหาเพื่อน ไปหาสินค้าใหม่</td></tr>\n          <tr><td><b>Over-smoothing</b></td><td>การกลมกลืนจนไร้เอกลักษณ์</td><td>อาการที่ส่งข้อความผ่านหลายชั้นเกินไป จนเวกเตอร์ของทุกคนไหลมารวมกันจนแยกไม่ออก</td></tr>\n        </tbody>\n      </table>\n    </div>\n\n    <div class=\"rs-pipeline-box\">\n      <h4>โครงสร้างกราฟจำลองและการคำนวณการแพร่กระจาย 3 ช่วง</h4>\n      <div class=\"rs-hy-graph\"><svg viewBox=\"0 0 600 250\" role=\"img\" aria-label=\"กราฟสองฝั่ง ผู้ใช้ g1 เชื่อม C1 และ g2 เชื่อม C1 กับ C3\"><g stroke=\"#7087a2\" stroke-width=\"3\"><path d=\"M110 60 L490 60 M110 190 L490 60 M110 190 L490 190\"/></g><g fill=\"#102b40\" stroke=\"#58dfcb\" stroke-width=\"2\"><circle cx=\"110\" cy=\"60\" r=\"35\"/><circle cx=\"110\" cy=\"190\" r=\"35\"/></g><g fill=\"#29253d\" stroke=\"#c9aeff\" stroke-width=\"2\"><circle cx=\"490\" cy=\"60\" r=\"35\"/><circle cx=\"490\" cy=\"190\" r=\"35\"/></g><g fill=\"#f1f8ff\" text-anchor=\"middle\" font-family=\"sans-serif\" font-size=\"22\"><text x=\"110\" y=\"68\">g1</text><text x=\"110\" y=\"198\">g2</text><text x=\"490\" y=\"68\">C1</text><text x=\"490\" y=\"198\">C3</text><text x=\"300\" y=\"47\">1/√2</text><text x=\"300\" y=\"116\">1/2</text><text x=\"300\" y=\"222\">1/√2</text></g></svg></div>\n      <p>ในตัวอย่างจำลอง มีโหนด 4 โหนดที่มีจำนวนเส้นเชื่อมดังนี้: <code>deg(g1)=1, deg(C1)=2, deg(g2)=2, deg(C3)=1</code></p>\n      <p>น้ำหนักของแต่ละเส้นเชื่อมคำนวณจากสูตร <code>1 / √(d_u · d_i)</code>:</p>\n      <ul>\n        <li>ช่วงที่ 1 (g1 → C1): น้ำหนัก = <code>1 / √(1 × 2) = 1 / √2 ≈ 0.7071</code></li>\n        <li>ช่วงที่ 2 (C1 → g2): น้ำหนัก = <code>1 / √(2 × 2) = 1 / 2 = 0.5000</code></li>\n        <li>ช่วงที่ 3 (g2 → C3): น้ำหนัก = <code>1 / √(2 × 1) = 1 / √2 ≈ 0.7071</code></li>\n      </ul>\n      <p>สัมประสิทธิ์การแพร่กระจายสะสมตามเส้นทาง 3 ช่วง (3-Hop Path):</p>\n      <div class=\"formula\">\\text{Path Weight} = \\frac{1}{\\sqrt{2}} \\times \\frac{1}{2} \\times \\frac{1}{\\sqrt{2}} = \\frac{1}{4} = 0.2500</div>\n      <div data-rs-demo=\"hy-graph\"></div>\n\n      <details class=\"rs-reading-note\"><summary>อ่านลึก: สูตรการแพร่กระจาย (Propagation) และการเฉลี่ยรวมทุกชั้นใน LightGCN</summary>\n        <p>LightGCN ส่งผ่านข้อความระหว่างผู้ใช้และสินค้าในแต่ละชั้น <i>l</i> ด้วยสมการง่ายๆ:</p>\n        <div class=\"formula\">e_u^{(l+1)} = \\sum_{i \\in N(u)} \\frac{e_i^{(l)}}{\\sqrt{d_u d_i}} \\qquad e_i^{(l+1)} = \\sum_{u \\in N(i)} \\frac{e_u^{(l)}}{\\sqrt{d_u d_i}}</div>\n        <p>และทำการรวมเวกเตอร์ของทุกชั้น ตั้งแต่ชั้นที่ 0 (Embedding ดั้งเดิม) ถึงชั้น <i>L</i>:</p>\n        <div class=\"formula\">e_u = \\frac{1}{L + 1} \\sum_{l=0}^L e_u^{(l)} \\qquad Score(u, i) = e_u^T e_i</div>\n        <p>การรวมชั้นที่ 0 เข้ามาด้วยมีความสำคัญอย่างยิ่ง เพราะช่วยรักษาตัวตนดั้งเดิมของผู้ใช้ และป้องกันปัญหา Over-smoothing ได้อย่างมีประสิทธิภาพ</p>\n      </details>\n    </div>\n\n    <div class=\"rs-decision-box\">\n      <h4>คู่มือการตัดสินใจทางวิศวกรรม (Engineering Decision Guide)</h4>\n      <ul>\n        <li><b>LightGCN ดั้งเดิมไม่ใช่ Content Hybrid:</b> พึงระลึกว่า LightGCN มาตรฐานอาศัยเฉพาะ <i>Interaction Graph (พฤติกรรม)</i> เพียงอย่างเดียว ไม่ได้มีข้อมูลเนื้อหาในตัวมันเอง มันจึงเป็น Collaborative Filtering บนกราฟ แต่ในระบบ Hybrid ยุคใหม่ เรามักนำเวกเตอร์ของ LightGCN ไปเป็นฟีเจอร์พฤติกรรมหลักเพื่อผสมกับฟีเจอร์เนื้อหา</li>\n        <li><b>กราฟที่ไม่เชื่อมกัน (Disconnected Components):</b> หากมีกลุ่มผู้ใช้หรือสินค้าที่ไม่มีเส้นเชื่อมโยงถึงกลุ่มใหญ่เลย ข้อความจะไม่สามารถแพร่ข้ามไปได้ จึงยังต้องมีระบบเนื้อหาและ Fallback Policy มารองรับ</li>\n      </ul>\n    </div>\n    <div class=\"callout\"><b>จำด้วยเส้นทาง:</b> เพื่อนของสินค้าที่เพื่อนเลือกบนกราฟ · ดีกรีช่วยลดน้ำหนักเส้น · รวมทุกชั้นรวมถึงชั้นศูนย์ → LightGCN</div>",
    "sources": [
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 147,
        "topic": "Bipartite Interaction Graph"
      },
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 148,
        "topic": "Multi-Hop Paths"
      },
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 149,
        "topic": "LightGCN Architecture"
      },
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 150,
        "topic": "Symmetric Degree Normalization"
      },
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 151,
        "topic": "Layer Aggregation"
      },
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 157,
        "topic": "Over-smoothing Problem"
      }
    ],
    "questions": [
      {
        "id": "graph-1",
        "q": "โมเดล LightGCN มาตรฐานที่ใช้เฉพาะข้อมูลกราฟการมีปฏิสัมพันธ์ (Interaction Graph) ระหว่างผู้ใช้กับสินค้า จัดเป็น Content+CF Hybrid โดยอัตโนมัติหรือไม่?",
        "choices": [
          "ใช่ เพราะมีคำว่า GCN อยู่ในชื่อจึงถือว่าเป็นระบบผสมเนื้อหาทันที",
          "ไม่ เพราะ LightGCN ดั้งเดิมเป็นโมเดล Collaborative Filtering บนกราฟพฤติกรรมเพียงอย่างเดียว แต่สามารถนำไปเป็นส่วนประกอบในระบบ Hybrid ได้",
          "ใช่ เพราะกราฟประกอบด้วยโหนดผู้ใช้และโหนดสินค้าสองฝั่ง",
          "ใช่ เพราะโมเดลมีการประมวลผลหลายชั้น (Multi-layer)"
        ],
        "answer": 1,
        "explanation": "LightGCN ใช้เฉพาะรอยเท้าพฤติกรรม (Graph CF) ไม่ได้มีคุณลักษณะเนื้อหาในตัวมันเอง จึงไม่ใช่ Content Hybrid โดยอัตโนมัติ แต่เป็นโมเดลพฤติกรรมชั้นยอดที่นำมาทำ Hybrid ได้",
        "reasons": [
          "ผิด: ชื่อ GCN ไม่ได้แปลว่ามีเนื้อหาเป็นอินพุต",
          "ถูกต้อง: ดูจากชนิดของข้อมูลที่ใช้ ไม่ใช่ดูจากชื่อหรือจำนวนชนิดของโหนด",
          "ผิด: โหนด User และ Item เป็นโครงสร้างพื้นฐานของ CF ทั่วไป",
          "ผิด: จำนวนชั้นของ Neural Network ไม่ได้บ่งบอกถึงแหล่งข้อมูลเนื้อหา"
        ],
        "version": 2
      },
      {
        "id": "graph-2",
        "q": "ในกราฟ LightGCN หากเส้นเชื่อมระหว่างผู้ใช้ u และสินค้า i มีค่า Degree ของแต่ละฝั่งคือ d_u = 1 และ d_i = 2 ค่าน้ำหนักถ่วงของเส้นเชื่อมนี้ตามสูตร Symmetric Normalization คือเท่าใด?",
        "choices": [
          "2.0000",
          "1 / 2 = 0.5000",
          "1 / √2 ≈ 0.7071",
          "0.0000"
        ],
        "answer": 2,
        "explanation": "สูตรคือ 1 / √(d_u * d_i) = 1 / √(1 * 2) = 1 / √2 ≈ 0.7071",
        "reasons": [
          "ผิด: 2.0 คือการนำ Degree มาคูณกันโดยตรง",
          "ผิด: 1/2 คือการลืมใส่เครื่องหมายสแควร์รูท",
          "ถูกต้อง: 1 / √(1 × 2) = 1 / √2 ≈ 0.7071",
          "ผิด: มีเส้นเชื่อมและ Degree ไม่เป็นศูนย์"
        ],
        "version": 2
      },
      {
        "id": "graph-3",
        "q": "หากเส้นทางการแพร่กระจายข้อความ 3 ช่วง มีค่าน้ำหนักแต่ละช่วงเท่ากับ 1/√2, 1/2 และ 1/√2 สัมประสิทธิ์การแพร่กระจายสะสมตามเส้นทางนี้มีค่าเท่าใด?",
        "choices": [
          "0.7071",
          "1.0000",
          "0.5000",
          "0.2500 (หรือ 1/4)"
        ],
        "answer": 3,
        "explanation": "คำนวณผลคูณตามเส้นทาง: (1/√2) * (1/2) * (1/√2) = (1/2) * (1/2) = 1/4 = 0.2500",
        "reasons": [
          "ผิด: 0.7071 เป็นน้ำหนักของเส้นเชื่อมช่วงแรกเพียงช่วงเดียว",
          "ผิด: 1.0000 คือไม่มีการลดทอนน้ำหนัก",
          "ผิด: 0.5000 ขาดตัวคูณของเส้นเชื่อมช่วงสุดท้าย",
          "ถูกต้อง: (1/√2) × (1/2) × (1/√2) = 1/4 = 0.2500"
        ],
        "version": 2
      },
      {
        "id": "graph-4",
        "q": "หากกราฟระหว่างผู้ใช้กับสินค้ามีลักษณะขาดออกจากกันเป็นสองเกาะ (Disconnected Components) การเพิ่มจำนวนชั้นการแพร่กระจาย (Propagation Layers) จะทำให้ข้อความข้ามไปอีกเกาะได้หรือไม่?",
        "choices": [
          "ไม่ได้ เพราะเมื่อไม่มีเส้นเชื่อมต่อกันในโครงสร้างกราฟ ข้อความจะไม่สามารถเดินทางข้ามไปได้ไม่ว่าจะเพิ่มกี่ชั้นก็ตาม",
          "ได้เสมอ หากเพิ่มจำนวนชั้นให้มากกว่า 10 ชั้นขึ้นไป",
          "ได้ โดยการหารค่าน้ำหนักด้วยศูนย์เพื่อสร้างเส้นทางลัด",
          "ได้ เพราะฟังก์ชัน Dot Product จะเชื่อมทุกโหนดเข้าด้วยกันเองโดยอัตโนมัติ"
        ],
        "answer": 0,
        "explanation": "Message Passing เดินทางได้เฉพาะตามเส้นเชื่อมที่มีอยู่จริงในกราฟ ถ้าไม่มีเส้นเชื่อมข้ามเกาะ การเพิ่มชั้นก็ไม่สามารถส่งผ่านข้อมูลได้",
        "reasons": [
          "ถูกต้อง: โครงสร้างกราฟจำกัดเส้นทางการแพร่กระจายอย่างสิ้นเชิง",
          "ผิด: เพิ่มกี่ชั้นก็ข้ามเกาะไม่ได้หากไม่มีสะพานเชื่อม",
          "ผิด: การหารด้วยศูนย์ไม่สามารถทำได้ในทางคณิตศาสตร์",
          "ผิด: Dot Product คำนวณความเข้ากันได้ของเวกเตอร์ ไม่ได้สร้างเส้นเชื่อมในกราฟ"
        ],
        "version": 2
      }
    ]
  },
  {
    "id": "recsys-hy-tower",
    "title": "Two-Tower: สถาปัตยกรรมสองหอคอยเพื่อการค้นคืนความเร็วสูง",
    "subtitle": "แยกฝั่ง User Tower และ Item Tower เพื่อเปิดทางให้ระบบทำ Precompute และ ANN Search",
    "desc": "เข้าใจ Dual-Encoder, การแคชเวกเตอร์สินค้าล่วงหน้า, การค้นคืนด้วย Vector Database (ANN) และข้อจำกัดเทียบกับ Cross-Encoder",
    "content": "<div class=\"rs-story-box\">\n      <h4>เรื่องเล่าและที่มาในชีวิตจริง (Story & Real-World Purpose)</h4>\n      <p>ลองจินตนาการว่าคุณต้องค้นหาหนังสือ 1 เล่มที่ตรงใจผู้ใช้ที่สุด จากคลังหนังสือ <b>50,000,000 เล่ม</b> ภายในเวลาไม่เกิน <b>5 มิลลิวินาที</b>:</p>\n      <ul>\n        <li><b>วิธีแบบเก่า (Cross-Encoder):</b> คุณต้องเอาข้อมูลผู้ใช้และข้อมูลหนังสือ มาประกบคู่กันทีละเล่ม แล้วส่งเข้า Deep Neural Network ก้อนใหญ่ ทำซ้ำแบบนี้ 50,000,000 ครั้ง! ผลคือระบบจะต้องใช้เวลาประมวลผลนานมากต่อ 1 หน้าเว็บ เซิร์ฟเวอร์ล่ม และผู้ใช้กดปิดแอปหนีไปแน่นอน!</li>\n        <li><b>วิธีแก้ปัญหาแบบ Two-Tower:</b> เราแยกโมเดลออกเป็น <b>\"สองหอคอยอิสระ (Two Independent Towers)\"</b>\n          <ul>\n            <li><b>Item Tower:</b> ทำหน้าที่อ่านข้อมูลหนังสือ แปลงเป็นเวกเตอร์ <i>q</i> แล้วคำนวณล่วงหน้าแบบ Offline ทิ้งไว้ใน <b>Vector Database</b> รอไว้เลย!</li>\n            <li><b>User Tower:</b> เมื่อผู้ใช้เปิดแอปขึ้นมา หอคอยนี้จะคำนวณสดๆ ได้เวกเตอร์ <i>p</i> ภายใน 1 มิลลิวินาที แล้วนำเวกเตอร์ <i>p</i> ไปยิงค้นหาใน Vector DB ด้วยคณิตศาสตร์ Dot Product!</li>\n          </ul>\n        </li>\n      </ul>\n      <p>นี่คือเหตุผลที่ <b>Two-Tower Neural Networks</b> กลายเป็นมาตรฐานทองคำสำหรับด่าน Candidate Retrieval ของ YouTube, Google Play, Pinterest, และ Taobao!</p>\n    </div>\n\n    <div class=\"rs-terms-box\">\n      <h4>ถอดรหัสคำศัพท์และตัวย่อสำคัญ (Key Terms Decoded)</h4>\n      <table class=\"rs-term-table\">\n        <thead><tr><th>คำศัพท์ / สัญลักษณ์</th><th>คำอ่าน & ความหมายเชิงระบบ</th><th>บทบาทในการค้นคืนความเร็วสูง</th></tr></thead>\n        <tbody>\n          <tr><td><b>Two-Tower Model</b></td><td>แบบจำลองสองหอคอย (Dual-Encoder)</td><td>สถาปัตยกรรมที่แยกตัวเข้ารหัสฝั่งผู้ใช้ (User Tower) และฝั่งสินค้า (Item Tower) ออกจากกันอย่างเด็ดขาด</td></tr>\n          <tr><td><b>Offline Precomputing</b></td><td>การคำนวณเวกเตอร์ล่วงหน้าแบบออฟไลน์</td><td>Item Tower ไม่ขึ้นกับผู้ใช้ จึงสามารถรันคำนวณเวกเตอร์สินค้าทุกชิ้นล่วงหน้าในคลังและบันทึกลงฐานข้อมูล</td></tr>\n          <tr><td><b>Vector Database / ANN</b></td><td>ฐานข้อมูลเวกเตอร์และการค้นประมาณ</td><td>ดัชนีพิเศษ (เช่น ScaNN, HNSW, FAISS) ที่ค้นหาเวกเตอร์ที่ใกล้เคียงที่สุดจากหลักสิบล้านชิ้นในเวลา &lt; 3 ms</td></tr>\n          <tr><td><b>Cross-Encoder</b></td><td>ตัวเข้ารหัสแบบประกบคู่ร่วม</td><td>โมเดลที่เห็นฟีเจอร์ผู้ใช้และสินค้าพร้อมกันตั้งแต่ชั้นแรก แม่นยำกว่าแต่ช้ามาก ไม่สามารถ Precompute ได้</td></tr>\n        </tbody>\n      </table>\n    </div>\n\n    <div class=\"rs-pipeline-box\">\n      <h4>โครงสร้าง Two-Tower: การแยกคำนวณและการค้นหาผ่าน ANN</h4>\n      <div class=\"rs-hy-parallel\" role=\"group\" aria-label=\"Two-Tower Architecture\"><p class=\"rs-hy-parallel-label\">สองฝั่งทำงานแยกกัน</p><div class=\"rs-hy-inputs\"><div class=\"rs-hy-node rs-hy-b\"><b>User Tower (ออนไลน์)</b><span>ประวัติการดู/บริบท → เวกเตอร์ p = [0.6, 0.8]</span></div><div class=\"rs-hy-node rs-hy-a\"><b>Item Tower (ออฟไลน์)</b><span>รหัสสินค้า/คำบรรยาย → เวกเตอร์ q = [0.8, 0.6]</span></div></div><div class=\"rs-hy-join\" aria-hidden=\"true\">↘ &nbsp; จุดเชื่อม &nbsp; ↙</div><div class=\"rs-hy-node\"><b>จับคู่ที่ปลายทางด้วย Inner Product</b><span>Score = p · q = 0.9600 → ดึง Top-M ผ่าน ANN Index</span></div></div>\n      \n      <p>กระบวนการทำงานในระบบ Production จริง:</p>\n      <ol>\n        <li><b>ขั้นตอนออฟไลน์:</b> รัน Item Tower กับสินค้าทุกชิ้นในคลัง ได้เวกเตอร์ <code>q(C1)=[0.8, 0.6], q(C2)=[0, 1], q(C3)=[1, 0]</code> แล้วสร้างดัชนี ANN (เช่น HNSW / ScaNN) เก็บไว้ใน Vector DB</li>\n        <li><b>ขั้นตอนออนไลน์:</b> เมื่อผู้ใช้ส่งคำขอมา รัน User Tower ทันที ได้เวกเตอร์ <code>p = [0.6, 0.8]</code></li>\n        <li><b>ขั้นตอนจับคู่:</b> ยิงค้นหาเวกเตอร์สินค้าที่ทำ Dot Product กับ <i>p</i> ได้ค่าสูงสุด:\n          <div class=\"formula\">Score(u, C1) = p \\cdot q_{C1} = (0.6 \\times 0.8) + (0.8 \\times 0.6) = 0.48 + 0.48 = 0.9600</div>\n        </li>\n      </ol>\n      <div data-rs-demo=\"hy-tower\"></div>\n    </div>\n\n    <div class=\"rs-decision-box\">\n      <h4>คู่มือการตัดสินใจทางวิศวกรรม (Engineering Decision Guide)</h4>\n      <ul>\n        <li><b>การจัดการเวอร์ชันของ Vector Index (Index Freshness):</b> เมื่อทีม Data Science ทำการ Retrain หรืออัปเดตโมเดล Item Tower <b>จะต้องทำการ Re-index เวกเตอร์สินค้าทั้งหมดใน Vector DB ใหม่เสมอ!</b> หากนำเวกเตอร์ผู้ใช้จากโมเดลเวอร์ชันใหม่ ไปยิงค้นหากับดัชนีสินค้าที่สร้างจากโมเดลเวอร์ชันเก่า ปริภูมิเวกเตอร์จะไม่ตรงกันและได้ผลลัพธ์ที่เละเทะโดยสิ้นเชิง</li>\n        <li><b>ข้อแลกเปลี่ยน (Trade-off):</b> Two-Tower ทำงานได้เร็วระดับมิลลิวินาที แลกกับการสูญเสียความสามารถในการจับคู่ปฏิสัมพันธ์ที่ซับซ้อนระหว่างฟีเจอร์ของผู้ใช้กับสินค้า (Feature Interactions) จึงเหมาะอย่างยิ่งสำหรับด่าน <b>Retrieval (คัดของล้านเหลือร้อย)</b> เพื่อส่งต่อให้ Cross-Encoder ทำหน้าที่จัดอันดับในด่าน Reranking</li>\n      </ul>\n    </div>\n    <div class=\"callout\"><b>จำด้วยเส้นทาง:</b> User Tower รันสดตอนคลิก · Item Tower คำนวณล่วงหน้ารอใน Vector DB · พบกันที่ Dot Product → Two-Tower</div>",
    "sources": [
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 158,
        "topic": "Two-Tower Architecture"
      },
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 159,
        "topic": "Precomputing และดัชนี ANN"
      },
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 160,
        "topic": "การฝึกฝนแบบ Dual-Encoder"
      }
    ],
    "questions": [
      {
        "id": "tower-1",
        "q": "เหตุใดสถาปัตยกรรม Two-Tower จึงสามารถรองรับการค้นคืนสินค้าจากคลังขนาด 10,000,000 ชิ้นได้ในเวลาไม่กี่มิลลิวินาที?",
        "choices": [
          "เพราะโมเดล Two-Tower ไม่ต้องใช้คณิตศาสตร์ใดๆ ในการคำนวณ",
          "เพราะเวกเตอร์ของสินค้าสามารถคำนวณล่วงหน้า (Precompute) และจัดเก็บในดัชนี Vector DB ได้ โดยไม่ต้องรอคำขอของผู้ใช้",
          "เพราะ Two-Tower ลบสินค้าที่ไม่มีคนคลิกทิ้งไป 99% ของคลังสินค้า",
          "เพราะโมเดลใช้เฉพาะข้อมูลเรตติ้งในอนาคตมาจัดอันดับล่วงหน้า"
        ],
        "answer": 1,
        "explanation": "Item Tower ไม่ขึ้นกับคำขอของผู้ใช้ จึงสามารถคำนวณเวกเตอร์สินค้าทิ้งไว้ล่วงหน้าแบบ Offline และใช้ ANN ค้นหาได้อย่างรวดเร็ว",
        "reasons": [
          "ผิด: Two-Tower ใช้คณิตศาสตร์ทั้ง Deep Learning และ Dot Product",
          "ถูกต้อง: แยกการเข้ารหัสสินค้าเป็นงาน Offline ทำให้ขั้นตอน Online รันเฉพาะ User Tower ตัวเดียว",
          "ผิด: สินค้าทั้งหมดยังคงอยู่ในดัชนี ไม่ได้ถูกลบทิ้ง",
          "ผิด: ไม่มีการใช้ข้อมูลอนาคต"
        ],
        "version": 2
      },
      {
        "id": "tower-2",
        "q": "กำหนดเวกเตอร์ผู้ใช้ p = [0.6, 0.8] และเวกเตอร์สินค้า q_C1 = [0.8, 0.6] คะแนนความเข้ากันได้ Score(u, C1) ด้วย Inner Product มีค่าเท่าใด?",
        "choices": [
          "0.4800",
          "1.4000",
          "0.9600",
          "0.2400"
        ],
        "answer": 2,
        "explanation": "คำนวณ Dot Product: (0.6 * 0.8) + (0.8 * 0.6) = 0.48 + 0.48 = 0.9600",
        "reasons": [
          "ผิด: 0.4800 คำนวณผลคูณเพียงมิติเดียว",
          "ผิด: 1.4000 คือการนำตัวเลขในเวกเตอร์มารวมกันตรงๆ",
          "ถูกต้อง: (0.6 × 0.8) + (0.8 × 0.6) = 0.48 + 0.48 = 0.9600",
          "ผิด: 0.2400 เป็นตัวเลขจากตัวอย่าง LightFM"
        ],
        "version": 2
      },
      {
        "id": "tower-3",
        "q": "หากโมเดล Two-Tower ใช้เฉพาะรหัสประจำตัว (User ID และ Item ID) เป็นอินพุตของทั้งสองหอคอย โมเดลนี้จะถือว่าเป็น Content+CF Hybrid โดยอัตโนมัติหรือไม่?",
        "choices": [
          "ใช่ เพราะผลลัพธ์ผ่านการค้นคืนด้วยดัชนี ANN",
          "ใช่ เพราะมีคำว่า Two-Tower ซึ่งแปลว่าเป็นระบบผสมเสมอ",
          "ใช่ เพราะโครงสร้างมีสองหอคอยแยกจากกัน",
          "ไม่ เพราะหากใช้เฉพาะรหัสประจำตัว (ID) โมเดลนี้จะทำหน้าที่เป็นเพียง Matrix Factorization รูปแบบหนึ่ง (CF ล้วน)"
        ],
        "answer": 3,
        "explanation": "Two-Tower เป็นรูปแบบสถาปัตยกรรม (Architecture) ไม่ใช่ชนิดของข้อมูล หากใส่อินพุตเฉพาะ ID มันก็คือ Collaborative Filtering ทั่วไป จะเป็น Hybrid ก็ต่อเมื่อมีการใส่ฟีเจอร์เนื้อหาลงในหอคอยด้วย",
        "reasons": [
          "ผิด: ANN เป็นเทคนิคการค้นหา ไม่เกี่ยวกับชนิดข้อมูล",
          "ผิด: Two-Tower ไม่ได้แปลว่าเป็น Hybrid เสมอไป",
          "ผิด: สองหอคอยเป็นเพียงโครงสร้าง Encoder",
          "ถูกต้อง: สถาปัตยกรรมกับชนิดของข้อมูลเป็นคนละเรื่องกัน ต้องดูฟีเจอร์ที่ป้อนจริง"
        ],
        "version": 2
      },
      {
        "id": "tower-4",
        "q": "หากทีมงานได้อัปเดตโมเดล Item Tower เวอร์ชันใหม่ แต่ยังคงใช้ Vector Database Index ที่สร้างจากโมเดลเวอร์ชันเก่าในการให้บริการ จะเกิดผลกระทบอย่างไร?",
        "choices": [
          "ปริภูมิเวกเตอร์จะไม่ตรงกัน (Mismatched Embedding Space) ทำให้ผลการค้นคืน Candidate ผิดเพี้ยนอย่างรุนแรง",
          "ไม่มีผลกระทบใดๆ เพราะเวกเตอร์ทุกเวอร์ชันมีความหมายเหมือนกันเสมอ",
          "ทำให้ระบบค้นหาได้เร็วขึ้นเป็นสองเท่าโดยอัตโนมัติ",
          "ดัชนี ANN จะเปลี่ยนไปใช้การค้นหาแบบ Exact Search ทันที"
        ],
        "answer": 0,
        "explanation": "Embedding Space ขึ้นอยู่กับ Weights ของโมเดลที่เทรน หากโมเดลเปลี่ยน เวกเตอร์จะเปลี่ยนทิศทางและความหมาย จึงต้อง Refresh ดัชนีใน Vector DB ให้ตรงเวอร์ชันกันเสมอ",
        "reasons": [
          "ถูกต้อง: เวกเตอร์คนละเวอร์ชันอยู่ในปริภูมิคนละมิติ ต้อง Refresh ดัชนีใหม่เสมอ",
          "ผิด: เวกเตอร์จะเปลี่ยนตำแหน่งและความหมายเมื่อโมเดลเปลี่ยน",
          "ผิด: ความเร็วในการค้นหาไม่เปลี่ยนไปในทางที่ดีขึ้น",
          "ผิด: ANN ยังคงเป็นการค้นหาแบบประมาณเหมือนเดิม"
        ],
        "version": 2
      }
    ]
  },
  {
    "id": "recsys-hy-logq",
    "title": "In-Batch Negatives และ logQ Correction: แก้อคติการสุ่ม",
    "subtitle": "เทรนโมเดลด้วย Softmax ประหยัด GPU แต่ต้องคืนความยุติธรรมให้สินค้าเฉพาะกลุ่ม",
    "desc": "เข้าใจกลไก In-batch Negative Sampling, ที่มาของ Sampling Bias, สูตร logQ Correction ตอนฝึกสอน และกฎเหล็กห้ามหักตอนเสิร์ฟ",
    "content": "<div class=\"rs-story-box\">\n      <h4>เรื่องเล่าและที่มาในชีวิตจริง (Story & Real-World Purpose)</h4>\n      <p>ในการฝึกสอนโมเดล Two-Tower ด้วยฟังก์ชัน <b>Softmax Loss</b>:</p>\n      <ul>\n        <li>เราต้องมีทั้ง <i>\"ตัวอย่างเชิงบวก (Positive Item)\"</i> ที่ผู้ใช้คนนั้นคลิกดูจริง และ <i>\"ตัวอย่างเชิงลบ (Negative Items)\"</i> ที่ผู้ใช้ไม่ได้เลือก เพื่อให้โมเดลเรียนรู้การแยกแยะ</li>\n        <li>แต่ถ้าเราต้องไปวิ่งสุ่มของลบจากคลัง 10,000,000 ชิ้นมาคำนวณทุกรอบ GPU จะทำงานหนักมหาศาล!</li>\n        <li><b>เทคนิค In-Batch Negatives:</b> ในมินิแบตช์ขนาด <i>B</i> ผู้ใช้แถวที่ 1 คลิกดูสินค้า 1 เราจะ <b>\"ยืมสินค้าที่ผู้ใช้แถวอื่นๆ ในแบตช์เดียวกันคลิก มาเป็นตัวอย่างเชิงลบให้ผู้ใช้คนนี้ทันที!\"</b> ประหยัดการคำนวณเวกเตอร์สินค้าได้อย่างน่าอัศจรรย์!</li>\n      </ul>\n      <p><b>แต่แล้วกับดักร้ายแรงก็เกิดขึ้น:</b> สินค้ายอดนิยม (เช่น iPhone) มักมีคนคลิกบ่อยมาก มันจึงหลุดเข้ามาอยู่ในมินิแบตช์เกือบทุกรอบ! ผลคือ iPhone จะถูกยืมมาเป็น <i>\"ตัวอย่างเชิงลบ (Negative)\"</i> บ่อยกว่าสินค้าเฉพาะกลุ่ม (Niche Items) ถึง 100 เท่า! โมเดลจะถูกลงโทษเรื่องของฮิตมากเกินไป จนกลายเป็นอคติที่ผิดเพี้ยน</p>\n      <p>ทีมวิจัยของ <b>Google (Yi et al., 2019)</b> จึงคิดค้นสูตร <b>logQ Correction</b> ขึ้นมาเพื่อหักล้างอคติของการสุ่มนี้ คืนความยุติธรรมให้แก่การเรียนรู้ของโมเดล!</p>\n    </div>\n\n    <div class=\"rs-terms-box\">\n      <h4>ถอดรหัสคำศัพท์และตัวย่อสำคัญ (Key Terms Decoded)</h4>\n      <table class=\"rs-term-table\">\n        <thead><tr><th>คำศัพท์ / สัญลักษณ์</th><th>คำอ่าน & ความหมายเชิงระบบ</th><th>หน้าที่ในการชดเชยอคติ</th></tr></thead>\n        <tbody>\n          <tr><td><b>In-Batch Negatives</b></td><td>ตัวอย่างเชิงลบร่วมในมินิแบตช์</td><td>การนำสินค้าบวกของคู่ผู้ใช้คนอื่นในแบตช์เดียวกัน มาใช้เป็นตัวอย่างลบของแถวเรา ประหยัด GPU มหาศาล</td></tr>\n          <tr><td><b>Sampling Frequency (<i>Q<sub>j</sub></i>)</b></td><td>ความถี่หรือโอกาสการถูกสุ่มเจอ</td><td>ความน่าจะเป็นที่สินค้า <i>j</i> จะถูกหยิบเข้ามาในแบตช์ สินค้าฮิตจะมีค่า <i>Q</i> สูง ส่วนสินค้าเฉพาะกลุ่มจะมี <i>Q</i> ต่ำ</td></tr>\n          <tr><td><b>logQ Correction</b></td><td>การชดเชยค่าลอการิทึมของความถี่</td><td>การปรับแต่ง Logit ก่อนเข้า Softmax: <code>l′ = l - ln(Q)</code> เพื่อหักล้างอคติที่ของฮิตถูกสุ่มมาเป็นตัวลบบ่อยเกินไป</td></tr>\n          <tr><td><b>Serving Consistency</b></td><td>ความสอดคล้องในขั้นตอนให้บริการ</td><td><b>กฎเหล็ก:</b> การหัก ln(Q) ทำเฉพาะตอนฝึกสอนเท่านั้น ตอนให้บริการจริงต้องใช้ Dot Product ดิบๆ เสมอ!</td></tr>\n        </tbody>\n      </table>\n    </div>\n\n    <div class=\"rs-pipeline-box\">\n      <h4>สมการคณิตศาสตร์และตัวอย่างการคำนวณ logQ Correction</h4>\n      <p>ในมินิแบตช์ ให้ <i>l<sub>bj</sub></i> คือคะแนน Logit ดิบ (Dot Product) ระหว่างผู้ใช้ <i>b</i> กับสินค้า <i>j</i> และ <i>Q<sub>j</sub></i> คือความถี่การสุ่มเจอ:</p>\n      <div class=\"formula\">l'_{bj} = l_{bj} - \\ln(Q_j) \\qquad P(j \\mid b) = \\frac{\\exp(l'_{bj})}{\\sum_{k} \\exp(l'_{bk})}</div>\n      \n      <p>ตัวอย่างการคำนวณในแถวผู้ใช้คนหนึ่ง มี Logits ดิบ = <code>[2.0, 1.0, 0.0]</code> โดยสินค้าชิ้นแรกเป็นของฮิต (<i>Q</i> = 0.50) ส่วนอีกสองชิ้นเป็นของเฉพาะกลุ่ม (<i>Q</i> = 0.25):</p>\n      <ul>\n        <li>ก่อนแก้ logQ: ความน่าจะเป็นจาก Softmax ดั้งเดิมคือ <code>[0.6652, 0.2447, 0.0900]</code> (ของฮิตได้เปรียบเกินจริง)</li>\n        <li>หักลบด้วย ln(Q):\n          <ul>\n            <li>ชิ้นที่ 1: <code>2.0 - ln(0.50) = 2.0 - (-0.6931) = 2.6931</code></li>\n            <li>ชิ้นที่ 2: <code>1.0 - ln(0.25) = 1.0 - (-1.3863) = 2.3863</code> (ได้รับการชดเชยคืนมาเยอะกว่า!)</li>\n            <li>ชิ้นที่ 3: <code>0.0 - ln(0.25) = 0.0 - (-1.3863) = 1.3863</code></li>\n          </ul>\n        </li>\n        <li>หลังแก้ logQ: ความน่าจะเป็นที่สะท้อนความชอบที่แท้จริงคือ <code>[0.4996, 0.3690, 0.1314]</code></li>\n      </ul>\n      <div data-rs-demo=\"hy-logq\"></div>\n    </div>\n\n    <div class=\"rs-decision-box\">\n      <h4>คู่มือการตัดสินใจทางวิศวกรรม (Engineering Decision Guide)</h4>\n      <ul>\n        <li><b>กฎเหล็กห้ามหัก ln(Q) ตอนเสิร์ฟ (Production Serving):</b> วิศวกรมือใหม่มักเข้าใจผิดว่า \"เมื่อฝึกด้วย logQ แล้ว ตอนเสิร์ฟก็ต้องหัก ln(Q) ด้วย\" <b>นี่คือข้อผิดพลาดร้ายแรง!</b> เพราะ logQ ถูกสร้างมาเพื่อชดเชย <i>Sampling Bias ของการจัดมินิแบตช์ตอนเทรนเท่านั้น</i> ตอนที่ระบบเสิร์ฟจริง เราต้องการคะแนนความเข้ากันได้แท้จริง (True Relevance) จึงต้องใช้ <code>p · q</code> ดิบๆ เสมอ</li>\n        <li><b>กรณี Q = 0:</b> หากมีสินค้าเฉพาะกลุ่มที่ไม่เคยปรากฏในข้อมูลฝึกเลย <i>Q</i> จะเป็น 0 ทำให้คำนวณ <code>ln(0)</code> ไม่ได้ (เป็นลบอนันต์) ทางแก้คือต้องมี <i>Laplace Smoothing</i> หรือกำหนดค่าขั้นต่ำ <i>Q<sub>min</sub></i> เสมอ</li>\n      </ul>\n    </div>\n    <div class=\"callout\"><b>จำด้วยเส้นทาง:</b> Q คือโอกาสถูกสุ่ม ไม่ใช่โอกาสถูกใจ · หัก ln(Q) เพื่อฝึกโมเดล · ตอนเสิร์ฟใช้ Dot Product ดิบๆ เสมอ</div>",
    "sources": [
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 160,
        "topic": "In-batch Softmax Loss"
      },
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 161,
        "topic": "Sampling Bias ใน In-batch Negatives"
      },
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 162,
        "topic": "สูตร logQ Correction"
      },
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 163,
        "topic": "ตัวอย่างการคำนวณ"
      },
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 164,
        "topic": "กฎการให้บริการตอน Serving"
      }
    ],
    "questions": [
      {
        "id": "logq-1",
        "q": "ในการฝึกสอนโมเดล Two-Tower ตัวอย่างเชิงลบ (Negative Samples) ในเทคนิค In-Batch Negatives นำมาจากแหล่งใด?",
        "choices": [
          "การเปิดดูเฉลยในชุดทดสอบ (Test Set) ทั้งหมด",
          "สินค้าที่เป็นตัวอย่างเชิงบวกของผู้ใช้คนอื่นๆ ที่บังเอิญอยู่ร่วมในมินิแบตช์เดียวกัน",
          "สินค้าที่ผู้ใช้คนปัจจุบันเคยกดปุ่มรีพอร์ตว่าเกลียดมากที่สุด",
          "การสุ่มตัวเลขคะแนน Bias ขึ้นมาใหม่โดยไม่ใช้สินค้าในระบบ"
        ],
        "answer": 1,
        "explanation": "In-Batch Negatives รีไซเคิลสินค้าของคู่ผู้ใช้อื่นในแบตช์เดียวกันมาเป็นตัวอย่างลบของแถวเรา ทำให้ประหยัดการคำนวณได้มหาศาล",
        "reasons": [
          "ผิด: ห้ามใช้ข้อมูลชุดทดสอบในการฝึกโมเดล",
          "ถูกต้อง: ใช้สินค้าบวกของคนอื่นในมินิแบตช์เดียวกันมาเป็นคู่ซ้อมเชิงลบ",
          "ผิด: สินค้าของคนอื่นอาจไม่ใช่ของที่ผู้ใช้เกลียดเสมอไป (มีความเสี่ยง False Negatives)",
          "ผิด: เป็นสินค้าจริงในแบตช์ ไม่ใช่การสุ่ม Bias"
        ],
        "version": 2
      },
      {
        "id": "logq-2",
        "q": "หากสินค้าสองชิ้นได้คะแนน Logit ดิบเท่ากัน แต่สินค้าชิ้นแรกมีโอกาสถูกสุ่มเจอ Q = 0.50 (ของฮิต) และชิ้นที่สองมี Q = 0.25 (ของเฉพาะกลุ่ม) หลังปรับด้วย logQ สินค้าใดจะได้คะแนน Logit เพิ่มขึ้นมากกว่ากัน?",
        "choices": [
          "ทั้งสองชิ้นจะได้คะแนนเพิ่มขึ้นเท่ากันพอดีเสมอ",
          "สินค้าที่มี Q = 0.50 จะได้รับการเพิ่มคะแนน Logit มากกว่า",
          "สินค้าที่มี Q = 0.25 จะได้รับการเพิ่มคะแนน Logit มากกว่าสินค้า Q = 0.50 อยู่เท่ากับ ln(2) ≈ 0.6931",
          "สินค้าที่มี Q = 0.25 จะถูกหักคะแนนจนกลายเป็นศูนย์"
        ],
        "answer": 2,
        "explanation": "สูตรคือ l - ln(Q) เนื่องจาก -ln(0.25) = +1.3863 และ -ln(0.50) = +0.6931 ดังนั้นสินค้าเฉพาะกลุ่ม (Q=0.25) จะได้คะแนนบวกเพิ่มมากกว่าอยู่ 0.6931",
        "reasons": [
          "ผิด: Q ไม่เท่ากัน การปรับย่อมไม่เท่ากัน",
          "ผิด: สินค้าฮิต (Q สูง) จะถูกลบมากกว่า ทำให้ได้คะแนนเพิ่มน้อยกว่า",
          "ถูกต้อง: -ln(0.25) - (-ln(0.50)) = ln(0.50/0.25) = ln(2) ≈ 0.6931",
          "ผิด: ไม่ได้ถูกหักจนเป็นศูนย์ แต่ได้รับแต้มต่อชดเชยความเป็นของหายาก"
        ],
        "version": 2
      },
      {
        "id": "logq-3",
        "q": "ในขั้นตอนการให้บริการจริงบนเซิร์ฟเวอร์ (Online Serving Time) วิศวกรควรคำนวณคะแนนของสินค้าในระบบ Two-Tower อย่างไร?",
        "choices": [
          "สุ่มหยิบคะแนน Softmax ของผู้ใช้คนอื่นในแบตช์มาแสดงแทน",
          "ต้องหักลบด้วย ln(Q) ต่อไปในทุกคำขอเพื่อดันสินค้าหายากขึ้นมานำหน้า",
          "ใช้ค่าความถี่ Q มาเป็นคะแนนจัดอันดับแทน Dot Product โดยตรง",
          "ใช้ผลคูณ Dot Product (p · q) ดิบๆ ของเวกเตอร์ที่ผ่านการฝึกแล้ว โดยห้ามหักลบด้วย ln(Q) ซ้ำอีก"
        ],
        "answer": 3,
        "explanation": "logQ Correction มีไว้เพื่อชดเชยการสุ่มตอนเทรนเท่านั้น ตอนให้บริการจริงเราต้องการคะแนนความเข้ากันได้แท้จริง จึงต้องใช้ p · q ตรงๆ",
        "reasons": [
          "ผิด: ต้องใช้เวกเตอร์ของผู้ใช้ปัจจุบันในการคำนวณ",
          "ผิด: การหัก ln(Q) ตอนเสิร์ฟเป็นการบิดเบือนคะแนนความเกี่ยวข้องที่แท้จริง",
          "ผิด: ความถี่การสุ่ม Q ไม่ใช่ระดับความชอบของผู้ใช้",
          "ถูกต้อง: ตอนเสิร์ฟใช้ Dot Product ดิบๆ ไม่หัก ln(Q)"
        ],
        "version": 2
      },
      {
        "id": "logq-4",
        "q": "หากมีสินค้าใหม่หรือสินค้าหายากมากที่มีค่าความถี่การสุ่มเจอ Q = 0 สูตรคณิตศาสตร์ l - ln(Q) จะประสบปัญหาใดและควรแก้ไขอย่างไร?",
        "choices": [
          "ln(0) ไม่นิยามในระบบจำนวนจริง (ลบอนันต์) จึงต้องใส่ Smoothing หรือกำหนดค่าขอบเขตต่ำสุด (Q_min)",
          "ระบบจะทำงานได้เร็วขึ้นเป็นอนันต์โดยไม่ต้องแก้ไขอะไร",
          "ให้แก้โดยการแอบดึงจำนวนคลิกจากชุดทดสอบ (Test Set) มาบวกเพิ่ม",
          "สรุปว่าสินค้านั้นเป็นตัวอย่างเชิงลบที่แท้จริงและลบออกจากระบบ"
        ],
        "answer": 0,
        "explanation": "ในทางคณิตศาสตร์ ln(0) หาค่าไม่ได้ จึงต้องมีนโยบาย Smoothing หรือ Clip ค่าขั้นต่ำไว้เสมอเพื่อความเสถียรของระบบคำนวณ",
        "reasons": [
          "ถูกต้อง: ต้องมี Laplace Smoothing หรือ Minimum Threshold ป้องกัน Division by Zero / Log Zero",
          "ผิด: โปรแกรมจะ Error และหยุดทำงานทันทีหากคำนวณ ln(0)",
          "ผิด: การดึงข้อมูล Test คือ Data Leakage ร้ายแรง",
          "ผิด: ค่า Q=0 บอกแค่ความถี่การสุ่ม ไม่ได้บอกว่าผู้ใช้ไม่ชอบ"
        ],
        "version": 2
      }
    ]
  },
  {
    "id": "recsys-hy-review",
    "title": "คู่มือตัดสินใจสถาปัตยกรรม Hybrid และการทดสอบระบบอย่างยุติธรรม",
    "subtitle": "ตารางเปรียบเทียบกลยุทธ์, การทดสอบสนาม A/B ในเอกสาร และ Checklist ป้องกัน Data Leakage",
    "desc": "ประมวลสรุปการเลือกใช้สถาปัตยกรรมทั้ง 7 แบบของ Burke, ความแตกต่างของสนามทดสอบ Protocol A vs B และแนวปฏิบัติการประเมินผล",
    "content": "<div class=\"rs-story-box\">\n      <h4>เรื่องเล่าและที่มาในชีวิตจริง (Story & Real-World Purpose)</h4>\n      <p>ในการทำงานจริงในฐานะ Lead Machine Learning Engineer:</p>\n      <p>คุณไม่ได้ถูกจ้างมาเพื่อสร้าง <i>\"โมเดลที่ซับซ้อนที่สุดในโลก\"</i> แต่คุณถูกจ้างมาเพื่อสร้าง <b>\"ระบบที่แก้ปัญหาของธุรกิจได้ดีที่สุด ภายใต้ทรัพยากรและข้อจำกัดที่มีอยู่จริง\"</b></p>\n      <p>การเข้าใจแผนที่สถาปัตยกรรม Hybrid ทั้งหมด จะช่วยให้คุณตอบคำถามของผู้บริหารและทีมงานได้อย่างเฉียบขาดว่า: <i>\"ทำไมจังหวะนี้เราถึงควรใช้ Cascade แทนที่จะเป็น Weighted?\"</i> หรือ <i>\"ทำไม Two-Tower ถึงเป็นคำตอบสำหรับระบบที่มีสินค้าหลักสิบล้านชิ้น?\"</i></p>\n    </div>\n\n    <div class=\"rs-terms-box\">\n      <h4>แผนผังการตัดสินใจเลือกสถาปัตยกรรม Hybrid (Grand Decision Matrix)</h4>\n      <div class=\"rs-table-wrap\">\n        <table class=\"rs-hybrid-data\">\n          <thead><tr><th>สถานการณ์จริงของระบบ</th><th>สถาปัตยกรรมที่ควรเลือก</th><th>จุดตรวจความปลอดภัยทางวิศวกรรม</th></tr></thead>\n          <tbody>\n            <tr><td>มี 2 โมเดลที่คายคะแนนพร้อมกัน และอยากปรับสัดส่วนความสำคัญ</td><td><b>Weighted Hybrid</b> + Min-Max</td><td>จูนน้ำหนัก <i>w</i> บน Validation Set และตรวจ Evidence Mask</td></tr>\n            <tr><td>ข้อมูลคนละฝั่งพร้อมในสถานการณ์ต่างกัน (เช่น ของใหม่ vs ของเก่า)</td><td><b>Switching Hybrid</b></td><td>เกณฑ์ Gating (<i>θ</i>) ต้องใช้เฉพาะข้อมูลที่รู้ก่อนทำนาย</td></tr>\n            <tr><td>ต้องการแสดงหลายมุมมองบนหน้าจอ UX โดยไม่นำคะแนนมาปนกัน</td><td><b>Mixed Hybrid</b> (Multi-rail)</td><td>ควบคุมโควตาการแสดงผล (Slot Budget), ตัดของซ้ำ, และระวัง Position Bias</td></tr>\n            <tr><td>ต้องการฝึกโมเดลเดียวจากฟีเจอร์หลายมิติ (ข้อความ + พฤติกรรม)</td><td><b>Feature Combination / LightFM</b></td><td>ทำ Feature Mapping, ใส่ Missing Indicator Flag เมื่อไร้ประวัติ</td></tr>\n            <tr><td>ต้องการให้โมเดลเนื้อหาช่วยอุดช่องโหว่เมทริกซ์เบาบางก่อนเทรน CF</td><td><b>Feature Augmentation</b></td><td>ใช้ Out-Of-Fold (OOF) และบันทึก Flag ว่าเป็น Pseudo-rating</td></tr>\n            <tr><td>คลังสินค้ามีขนาดหลักล้านชิ้น ต้องตอบสนองเร็วและแม่นยำ</td><td><b>Cascade Hybrid</b> (Two-Tower)</td><td>วัด Candidate Recall ในด่านแรก และตรวจสอบ Latency Budget</td></tr>\n            <tr><td>ต้องการแชร์ความเข้าใจรสนิยมข้ามระบบโดยไม่ต้องมีสินค้าร่วม</td><td><b>Meta-Level Hybrid</b></td><td>ตรวจสอบว่าเวกเตอร์โปรไฟล์ไม่ได้แอบเอาข้อมูลอนาคตมาสร้าง</td></tr>\n          </tbody>\n        </table>\n      </div>\n    </div>\n\n    <div class=\"rs-pipeline-box\">\n      <h4>ข้อควรระวัง: อย่าสับสนชื่อส่วนประกอบ A/B กับสนามทดสอบ A/B ในเอกสาร!</h4>\n      <p>ในเอกสารคำสอนของวิชานี้ มีจุดที่นักศึกษาสับสนกันมากที่สุด:</p>\n      <div class=\"rs-table-wrap\">\n        <table class=\"rs-hybrid-data\">\n          <thead><tr><th>คำว่า \"A / B\" ในบริบทของบทเรียน</th><th>ความหมายที่แท้จริง</th><th>สิ่งที่ต้องระวัง</th></tr></thead>\n          <tbody>\n            <tr><td><b>โมเดลส่วนประกอบ A และ B</b></td><td>A = ฝั่งเนื้อหา (Content-based)<br>B = ฝั่งพฤติกรรม (Collaborative)</td><td>เป็นชื่อของ <i>โมเดล</i> สองตัวที่เรานำมาผสานกัน</td></tr>\n            <tr><td><b>สนามทดสอบ Protocol A และ B</b></td><td>สนาม A = ซ่อนคู่ Interaction แบบสุ่ม 20 กรณี (ไม่มีมิติเวลา)<br>สนาม B = ซ่อน Interaction ล่าสุด 8 กรณี (Temporal Split อดีต-อนาคต)</td><td>เป็นชื่อของ <i>กติกาการวัดผล (Protocols)</i> <b>ห้ามนำคะแนน MRR ข้ามสนามมาเปรียบเทียบกันตรงๆ เด็ดขาด!</b></td></tr>\n          </tbody>\n        </table>\n      </div>\n\n      <details class=\"rs-reading-note\"><summary>อ่านลึก: Checklist การทดสอบระบบแนะนำให้ยุติธรรมและไร้ Data Leakage</summary>\n        <ul>\n          <li><b>1. การแบ่งชุดข้อมูล (Split Protocol):</b> ต้องแบ่งตามมิติเวลา (Temporal Split) เสมอหากระบบจริงต้องทำนายอนาคต</li>\n          <li><b>2. การปรับจูน Hyperparameters:</b> ค่าน้ำหนัก <i>w</i>, เกณฑ์ <i>θ</i>, พารามิเตอร์ <i>κ</i>, และขนาด Pool <i>M</i> ต้องหาค่าที่ดีที่สุดบน <b>Validation Set</b> เท่านั้น ห้ามแอบใช้ Test Set เด็ดขาด!</li>\n          <li><b>3. การทำ Ablation Study:</b> ต้องทดสอบเปรียบเทียบระบบ Hybrid กับโมเดลเดี่ยว (Single Model A และ B) ภายใต้ชุด Candidate และ Metric เดียวกันเสมอ เพื่อพิสูจน์ว่าการทำ Hybrid ให้ผลลัพธ์ที่ดีขึ้นจริง ไม่ใช่ดีขึ้นเพราะความบังเอิญ</li>\n        </ul>\n      </details>\n    </div>\n\n    <div class=\"rs-decision-box\">\n      <h4>บทสรุปส่งท้าย: 7 ประตูสู่ความเป็นเลิศใน Recommender Systems</h4>\n      <p>ระบบแนะนำไม่ใช่แค่เรื่องของสูตรคณิตศาสตร์ แต่เป็นเรื่องของ <b>การทำความเข้าใจความต้องการของมนุษย์ และการจัดการทรัพยากรระบบอย่างชาญฉลาด</b> การที่คุณเชี่ยวชาญสถาปัตยกรรม Hybrid ทั้ง 7 รูปแบบ จะทำให้คุณพร้อมก้าวไปสู่การเป็นวิศวกรระบบแนะนำระดับมืออาชีพ!</p>\n    </div>\n    <div class=\"callout\"><b>จำด้วยเส้นทาง:</b> คะแนนรวม (Weighted) · สลับคน (Switching) · รวมรายชื่อ (Mixed) · รวมฟีเจอร์ (Combination) · เพิ่มผลทาย (Augmentation) · คัดแล้วเรียง (Cascade) · ส่งตัวแทน (Meta-Level) = 7 ประตูของ Hybrid</div>",
    "sources": [
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 49,
        "topic": "โปรโตคอลสนามทดสอบ A/B"
      },
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 75,
        "topic": "การป้องกันการจูนบน Test"
      },
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 77,
        "topic": "User-level Cross Validation"
      },
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 144,
        "topic": "การทดสอบทั้ง 7 แบบ"
      },
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 165,
        "topic": "ข้อจำกัดการเปรียบเทียบ"
      },
      {
        "title": "Chapter 6 · Hybrid Recommender Systems",
        "path": "source/Recommending System/เอกสาร_Lecture/Slides_Chapter6_HybridSystem.pdf",
        "pages": 170,
        "page": 168,
        "topic": "บทสรุป Hybrid RecSys"
      },
      {
        "title": "Chapter 6 · Test Beds A/B",
        "path": "source/Recommending System/เอกสาร_Lecture/Data_Chapter6_TestBeds_AB_Data.pdf",
        "pages": 14,
        "page": 1,
        "topic": "กติกาสองสนามทดสอบ"
      }
    ],
    "questions": [
      {
        "id": "review-1",
        "q": "หากระบบแนะนำของบริษัทคุณต้องค้นหาไอเท็มจากคลังขนาด 10,000,000 ชิ้น เพื่อแสดงผลบนแอปพลิเคชันมือถือภายในเวลา 50 มิลลิวินาที สถาปัตยกรรมใดควรเป็นตัวเลือกแรกในการทดลอง?",
        "choices": [
          "Mixed Hybrid ที่นำสินค้าทั้ง 10,000,000 ชิ้นมาแสดงผลพร้อมกันบนหน้าจอ UI",
          "Cascade Hybrid ที่ใช้ Two-Tower เป็นด่าน Candidate Retrieval ก่อนส่งต่อให้ Deep Reranker",
          "Weighted Hybrid ที่คำนวณคะแนนของสินค้าทั้ง 10,000,000 ชิ้นด้วย Deep Model ทุกชิ้น",
          "เปิดดูชุดข้อมูลทดสอบ (Test Set) เพื่อดึงสินค้าที่ถูกต้องออกมาโดยตรง"
        ],
        "answer": 1,
        "explanation": "เมื่อคลังสินค้ามีขนาดใหญ่มาก Cascade Hybrid คือทางออกเดียวที่ตอบโจทย์ Latency โดยคัดกรองของล้านชิ้นเหลือร้อยชิ้นในด่านแรก แล้วจึงจัดอันดับละเอียดในด่านสอง",
        "reasons": [
          "ผิด: หน้าจอ UI ไม่สามารถแสดงของสิบล้านชิ้นพร้อมกันได้",
          "ถูกต้อง: Funnel Architecture (Retrieval + Rerank) คือหัวใจของระบบขนาดใหญ่",
          "ผิด: การรัน Deep Model กับของสิบล้านชิ้นจะทำให้เกินงบเวลา (Latency Exceeded)",
          "ผิด: การเปิดดู Test คือ Data Leakage ไม่ใช่ระบบใช้งานจริง"
        ],
        "version": 2
      },
      {
        "id": "review-2",
        "q": "หากวิศวกรทำการทดลองปรับค่าน้ำหนัก w หลายๆ ค่าบนชุดข้อมูลทดสอบ (Test Set) โดยตรง แล้วเลือกรายงานค่า w ที่ให้คะแนนสูงสุดเป็นผลสรุป มีข้อบกพร่องร้ายแรงอย่างไร?",
        "choices": [
          "ทำให้คะแนนความแม่นยำเปลี่ยนหน่วยจากดาวเป็นเปอร์เซ็นต์",
          "ไม่มีข้อบกพร่องใดๆ เพราะระบบ Hybrid อนุญาตให้ทดสอบบนชุดใดก็ได้",
          "เกิดปัญหา Data Leakage และ Overfitting ต่อชุดทดสอบ ทำให้ผลการประเมินมองโลกในแง่ดีเกินจริงและใช้งานจริงไม่ได้",
          "ทำให้ระบบถูกบังคับให้เปลี่ยนไปใช้ Reciprocal Rank Fusion ทันที"
        ],
        "answer": 2,
        "explanation": "ชุดทดสอบ (Test Set) มีไว้สำหรับประเมินผลสรุปขั้นสุดท้ายเท่านั้น ห้ามนำมาใช้ในการลองผิดลองถูกเพื่อเลือกค่า Hyperparameter w เพราะจะทำให้ผลลำเอียง",
        "reasons": [
          "ผิด: หน่วยของ Metric ไม่ได้เปลี่ยนเพราะการจูนข้อมูล",
          "ผิด: เป็นข้อผิดพลาดร้ายแรงทางระเบียบวิธีวิจัย",
          "ถูกต้อง: ห้ามใช้ Test Set ในการจูนพารามิเตอร์เด็ดขาด ต้องใช้ Validation Set",
          "ผิด: อัลกอริทึมไม่เปลี่ยนไปเอง"
        ],
        "version": 2
      },
      {
        "id": "review-3",
        "q": "เหตุใดเราจึงไม่สามารถนำค่าตัวเลข MRR จาก \"สนามทดสอบ Protocol A\" มาเปรียบเทียบกับ \"สนามทดสอบ Protocol B\" ในเอกสารประกอบการสอนได้โดยตรง?",
        "choices": [
          "เพราะทั้งสองสนามใช้ระบบตัวเลขฐานสิบหกที่ไม่สามารถแปลงค่าได้",
          "เพราะสนาม A ใช้ภาษา Python ส่วนสนาม B ใช้ภาษา C++",
          "เพราะสนาม A วัดผลเฉพาะผู้ใช้ผู้หญิง ส่วนสนาม B วัดผลเฉพาะผู้ใช้ผู้ชาย",
          "เพราะทั้งสองสนามมีกติกาการซ่อนคำตอบ ข้อมูลที่อนุญาตให้มองเห็น และจำนวนกรณีทดสอบที่แตกต่างกันโดยสิ้นเชิง"
        ],
        "answer": 3,
        "explanation": "สนามทดสอบ A และ B มีโปรโตคอลที่ต่างกัน (สนาม A ซ่อนแบบสุ่ม 20 กรณี ไม่บังคับเวลา, สนาม B ซ่อนตามลำดับเวลา 8 กรณี) จึงเปรียบเทียบข้ามสนามไม่ได้",
        "reasons": [
          "ผิด: ทั้งสองสนามใช้ระบบคณิตศาสตร์สากลปกติ",
          "ผิด: ภาษาโปรแกรมไม่เกี่ยวกับโปรโตคอลการประเมินทางทฤษฎี",
          "ผิด: ไม่ได้จำกัดเพศของผู้ใช้",
          "ถูกต้อง: โปรโตคอลการทดสอบคนละโจทย์ ไม่สามารถเทียบตัวเลขกันตรงๆ ได้"
        ],
        "version": 2
      },
      {
        "id": "review-4",
        "q": "ในการทำวิจัยเพื่อพิสูจน์ว่า \"ระบบ Hybrid ที่พัฒนาขึ้นมา มีประสิทธิภาพดีกว่าระบบเดี่ยวเดิมจริงหรือไม่\" ขั้นตอนใดจำเป็นที่สุดตามหลักวิทยาศาสตร์?",
        "choices": [
          "ทำการทดสอบเปรียบเทียบแบบ Ablation Study โดยวัดผล Hybrid เทียบกับโมเดลเดี่ยว A และ B ภายใต้ชุดข้อมูลและ Metric เดียวกัน",
          "ดูเฉพาะคะแนนดิบที่คำนวณได้ หากคะแนนมากกว่า 0 ถือว่าระบบดีขึ้นทันที",
          "เลือกผลการสุ่มที่ได้คะแนนดีที่สุดเพียงครั้งเดียวมานำเสนอโดยไม่ต้องทำซ้ำ",
          "ปรับเปลี่ยนชุดผู้สมัคร (Candidate Pool) ของระบบ Hybrid ให้ง่ายกว่าของโมเดลเดี่ยว"
        ],
        "answer": 0,
        "explanation": "Ablation Study คือการเปรียบเทียบโดยควบคุมตัวแปรให้เท่ากันทุกอย่าง เพื่อพิสูจน์ว่าพลังที่เพิ่มขึ้นมาจากผลของการผสานโมเดลจริง",
        "reasons": [
          "ถูกต้อง: ต้องควบคุมเงื่อนไขการทดสอบให้เหมือนกันทุกประการ และทำ Ablation Study",
          "ผิด: คะแนนดิบไม่สามารถบอกคุณภาพสัมพัทธ์ได้",
          "ผิด: ต้องทำซ้ำหลายๆ รอบเพื่อยืนยันความมีนัยสำคัญทางสถิติ",
          "ผิด: การเปลี่ยนโจทย์ให้ง่ายขึ้นคือการบิดเบือนผลการทดลอง"
        ],
        "version": 2
      }
    ]
  }
];

  window.RECSYS_CHAPTERS = [...(window.RECSYS_CHAPTERS || []), {
    id: 'recsys-hybrid',
    number: '06',
    kicker: 'HYBRID · SEVEN ROUTES, SAME A/B',
    title: 'Hybrid: ผสานเนื้อหากับพฤติกรรมให้ตรงจุด',
    description: 'เจาะลึก 7 สถาปัตยกรรมคลาสสิกของ Burke, การปรับสเกลและตรวจจับหลักฐาน, LightFM, LightGCN, Two-Tower และ In-Batch Negatives พร้อม 64 คำถามจำลองสถานการณ์จริง',
    lessons: lessons.map((l, idx) => ({
      ...l,
      number: l.number || `06.${idx + 1}`,
      goal: l.goal || l.desc || '',
      lead: l.lead || l.subtitle || '',
      body: l.body || l.content || ''
    }))
  }];
})();
