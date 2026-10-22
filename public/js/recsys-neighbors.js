/* Chapter 05 (Part 1): Collaborative Filtering - Memory-based & Baselines
 * Pedagogical Revamp (TryHackMe Style):
 * 1. Story & Real-World Purpose -> 2. Key Terms Decoded -> 3. Pipeline & Mechanism -> 4. Decision Guide
 * 100% compliant with clean HTML/Unicode math (0 raw $) and 0 reading time strings.
 */
(() => {
  'use strict';
  const doc = { title: 'Topic 5 · Collaborative Filtering', path: 'source/Recommending System/เอกสาร_Lecture/Topic5_CollaborativeFiltering.pdf', pages: 99 };
  const source = (page, topic) => ({ ...doc, page, topic });
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

  const sum = a => a.reduce((s, x) => s + x, 0);
  const dot = (a, b) => sum(a.map((x, i) => x * b[i]));
  const cos = (a, b) => { const d = Math.hypot(...a) * Math.hypot(...b); return d ? dot(a, b) / d : null; };
  const f = x => x === null ? 'ไม่กำหนด' : x.toFixed(4);

  // ข้อมูลตัวอย่างชุดฝึกจำลอง 5 ผู้ใช้ × 6 คอร์ส
  const data = {
    users: ['u1 ฟ้า', 'u2 พลอย', 'u3 นนท์', 'u4 กานต์', 'u5 เมย์'],
    items: ['A Python', 'B SQL', 'C วาดภาพ', 'D UX', 'E Data story', 'F คอร์สใหม่'],
    ratings: [
      [5, 4, 1, 2, null, null],
      [5, 4, 1, 4, 5, null],
      [1, 2, 5, 4, 1, null],
      [5, null, 2, 1, 4, null],
      [null, 5, null, null, 5, null]
    ],
    targetUser: 0, targetItem: 4, k: 2, beta: 4, lambda: 2, positiveThreshold: 4
  };

  data.means = data.ratings.map(row => { const known = row.filter(x => x !== null); return sum(known) / known.length; });
  const allKnown = data.ratings.flat().filter(x => x !== null);
  data.observed = allKnown.length;
  data.mu = sum(allKnown) / allKnown.length;
  data.positive = data.ratings.map(row => row.map(x => x !== null && x >= data.positiveThreshold ? 1 : 0));
  data.popularity = data.items.map((_, i) => sum(data.positive.map(row => row[i])));
  data.itemCounts = data.items.map((_, i) => data.ratings.filter(row => row[i] !== null).length);
  data.itemMeans = data.items.map((_, i) => { const known = data.ratings.map(row => row[i]).filter(x => x !== null); return known.length ? sum(known) / known.length : null; });

  data.userSimilarities = data.users.slice(1).map((_, n) => {
    const u = n + 1, co = data.items.map((_, i) => i).filter(i => data.ratings[0][i] !== null && data.ratings[u][i] !== null);
    const a = co.map(i => data.ratings[0][i]), b = co.map(i => data.ratings[u][i]);
    const centered = cos(a.map(x => x - data.means[0]), b.map(x => x - data.means[u]));
    const union = data.items.filter((_, i) => data.ratings[0][i] !== null || data.ratings[u][i] !== null).length;
    return { u, co, raw: cos(a, b), jaccard: co.length / union, centered, weighted: centered === null ? null : centered * Math.min(co.length, data.beta) / data.beta };
  });

  data.userNeighbors = data.userSimilarities.filter(x => data.ratings[x.u][4] !== null && x.weighted > 0).sort((a, b) => b.weighted - a.weighted || a.u - b.u).slice(0, data.k);
  const userDen = sum(data.userNeighbors.map(x => Math.abs(x.weighted)));
  data.userPrediction = data.means[0] + sum(data.userNeighbors.map(x => x.weighted * (data.ratings[x.u][4] - data.means[x.u]))) / userDen;
  data.rawUserPrediction = sum(data.userNeighbors.map(x => x.weighted * data.ratings[x.u][4])) / userDen;

  data.itemSimilarities = [0, 1, 2, 3].map(j => {
    const co = data.users.map((_, u) => u).filter(u => data.ratings[u][4] !== null && data.ratings[u][j] !== null);
    const adjusted = cos(co.map(u => data.ratings[u][4] - data.means[u]), co.map(u => data.ratings[u][j] - data.means[u]));
    return { j, co, adjusted, weighted: adjusted === null ? null : adjusted * Math.min(co.length, data.beta) / data.beta };
  });

  data.itemNeighbors = data.itemSimilarities.filter(x => x.weighted > 0 && data.ratings[0][x.j] !== null).sort((a, b) => b.weighted - a.weighted || a.j - b.j).slice(0, data.k);
  const itemDen = sum(data.itemNeighbors.map(x => Math.abs(x.weighted)));
  data.itemPrediction = data.means[0] + sum(data.itemNeighbors.map(x => x.weighted * (data.ratings[0][x.j] - data.means[0]))) / itemDen;

  data.implicitSimilarities = data.items.map((_, i) => data.items.map((_, j) => i === j ? 0 : (cos(data.positive.map(row => row[i]), data.positive.map(row => row[j])) ?? 0)));
  data.implicitScores = data.items.map((_, i) => sum(data.positive[0].map((x, j) => x * data.implicitSimilarities[j][i])));

  data.itemBias = data.items.map((_, i) => sum(data.ratings.map(row => row[i]).filter(x => x !== null).map(x => x - data.mu)) / (data.lambda + data.itemCounts[i]));
  data.userBias = data.ratings.map(row => sum(row.map((x, i) => x === null ? 0 : x - data.mu - data.itemBias[i])) / (data.lambda + row.filter(x => x !== null).length));
  data.baselines = data.items.map((_, i) => data.mu + data.userBias[0] + data.itemBias[i]);
  data.baselinePrediction = data.baselines[4];
  data.knnBaselinePrediction = data.baselinePrediction + sum(data.itemNeighbors.map(x => x.weighted * (data.ratings[0][x.j] - data.baselines[x.j]))) / itemDen;

  window.RECSYS_NEIGHBOR_DATA = data;

  const reminder = '<div class="rs-example-label">ชุดฝึกจำลอง 5 ผู้ใช้ × 6 คอร์ส · ตัวเลข 1–5 คือคะแนนดาวที่รู้ใน Train · ? คือช่องว่างที่ยังไม่เคยดู · ช่องเป้าหมายคือ (u1, E)</div>';
  const matrix = (highlight = []) => ({ headers: ['User', 'A', 'B', 'C', 'D', 'E', 'F'], rows: data.ratings.map((values, r) => ({ label: data.users[r], values: values.map(x => x === null ? '?' : String(x)) })), highlight, target: [0, 4], label: 'ตารางคะแนน Train แถวผู้ใช้ คอลัมน์คอร์ส ช่อง u1 กับ E ที่ต้องทำนายยังไม่ทราบคะแนน' });
  const pairs = (rows, cols) => rows.flatMap(r => cols.map(c => [r, c]));
  const matrixHTML = '<div class="rs-table-wrap rs-cf-table-wrap" tabindex="0" role="region" aria-label="ตารางคะแนน Train เลื่อนแนวนอนได้"><table class="rs-neighbor-matrix"><caption>ตารางคะแนนพฤติกรรม (User-Item Interaction Matrix)</caption><thead><tr>' + ['User', 'A (Python)', 'B (SQL)', 'C (Art)', 'D (UX)', 'E (DataStory)', 'F (NewCourse)'].map(t => '<th scope="col">' + t + '</th>').join('') + '</tr></thead><tbody>' + data.ratings.map((row, u) => '<tr><th scope="row">' + data.users[u] + '</th>' + row.map((x, i) => '<td class="' + (u === 0 && i === 4 ? 'rs-cf-target' : '') + '">' + (x === null ? '?' : x) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';

  window.RECSYS_DEMOS = {
    ...(window.RECSYS_DEMOS || {}),
    'cf-matrix': [
      { title: '1 · ตรวจสอบเป้าหมาย', value: 'เป้าหมาย: u1 (ฟ้า) × E (Data Story) → ?', detail: 'ช่องสีเหลืองคือคะแนนที่เราต้องการทำนาย โดยอาศัยรอยเท้าพฤติกรรมของเพื่อนในตาราง', tokens: ['Target u1,E', 'พิจารณาเฉพาะช่องที่รู้คะแนน'], active: [0], matrix: matrix() },
      { title: '2 · มองแถว (User-based)', value: 'เทียบแถว u1 กับแถว u2, u3, u4, u5', detail: 'มองหารูปแบบว่าผู้ใช้คนไหนให้คะแนนคอร์สต่างๆ คล้ายกับ u1 มากที่สุด', tokens: ['Row-wise analysis', 'User Taste Space'], active: [0, 1], matrix: matrix(pairs([0, 1, 2, 3, 4], [0, 1, 2, 3])) },
      { title: '3 · มองคอลัมน์ (Item-based)', value: 'เทียบคอลัมน์ E กับคอลัมน์ A, B, C, D', detail: 'มองหาว่าคอร์สไหนในอดีตที่มีผู้คนให้คะแนนไปในทิศทางเดียวกับคอร์ส E', tokens: ['Column-wise analysis', 'Item Similarity'], active: [0, 2], matrix: matrix(pairs([1, 2, 3], [0, 1, 2, 3, 4])) }
    ],
    'cf-popularity': [
      { title: '1 · นิยามความนิยม', value: 'นับจำนวนคนที่ให้คะแนนความชอบ (ดาว ≥ 4)', detail: 'ความนิยม (Popularity) ต่างจากคะแนนเฉลี่ย เพราะไม่หลงกลสินค้าที่มีคนรีวิวแค่คนเดียวแต่ได้ 5 ดาว', tokens: ['เกณฑ์ชอบ: ดาว ≥ 4', 'นับจากข้อมูล Train'], active: [0, 1] },
      { title: '2 · นับคะแนนจากตาราง', value: 'A: 3 คน, B: 3 คน, C: 1 คน, D: 2 คน, E: 3 คน, F: 0 คน', detail: 'สังเกตว่าคอร์ส F เป็นคอร์สใหม่แกะกล่อง จึงได้ 0 คน (เผชิญ Item Cold-Start)', tokens: data.popularity.map((n, i) => 'คอร์ส ' + 'ABCDEF'[i] + ': ' + n + ' คน'), active: [0, 1, 4] },
      { title: '3 · จัดอันดับ Baseline', value: 'ลำดับคอร์สยอดนิยมรวม: A = B = E → D → C → F', detail: 'นี่คือลิสต์แนะนำเริ่มต้นสำหรับผู้ใช้ใหม่ทุกคน ก่อนที่ระบบจะเริ่มรู้จักความชอบเฉพาะบุคคล', tokens: ['Popularity Baseline', 'Fallback สำหรับคนใหม่'], active: [0, 1, 2] }
    ],
    'cf-similarity': [
      { title: '1 · ตรวจสอบสินค้าที่ประเมินร่วมกัน', value: 'u1 ให้คะแนน A, B, C, D · u2 ให้คะแนน A, B, C, D, E', detail: 'การคำนวณความคล้ายต้องทำบนชุดสินค้าที่ประเมินร่วมกัน (Co-rated Items) คือ A, B, C, D (4 ชิ้น)', tokens: ['ประเมินร่วม 4 ชิ้น', 'รวมทั้งหมด 5 ชิ้น'], active: [0, 1], matrix: matrix(pairs([0, 1], [0, 1, 2, 3])) },
      { title: '2 · คำนวณ Jaccard Similarity', value: 'Jaccard = 4 / 5 = 0.8000', detail: 'Jaccard วัดแค่ว่า "เคยแตะต้องของร่วมกันกี่ชิ้น" โดยไม่สนใจเลยว่าให้กี่ดาว (เหมาะกับ Implicit Data)', tokens: ['ทับซ้อน 4', 'ยูเนียน 5', 'Jaccard = 0.8'], active: [2] },
      { title: '3 · คำนวณ Cosine Similarity ดิบ', value: 'u1 = (5, 4, 1, 2), u2 = (5, 4, 1, 4) → Cosine = 0.9680', detail: 'Cosine วัดทิศทางของเวกเตอร์คะแนน แต่ยังมีจุดอ่อนเรื่องคนใจดีกับคนเคี่ยว', tokens: ['Dot Product = 50', 'ความยาวเวกเตอร์ √46, √58'], active: [0, 1, 2] }
    ],
    'cf-centering': [
      { title: '1 · หาค่าเฉลี่ยส่วนตัว (User Mean)', value: 'u1: 3.0, u2: 3.8, u3: 2.6, u4: 3.0, u5: 5.0', detail: 'ค่าเฉลี่ยสะท้อนความใจดีหรือความเคี่ยวของแต่ละคน (u5 ใจดีมากเฉลี่ย 5.0, u3 เคี่ยวเฉลี่ย 2.6)', tokens: data.means.map((m, u) => 'u' + (u + 1) + ': ' + m), active: [] },
      { title: '2 · ปรับไม้บรรทัด (Mean-Centering)', value: 'u1 ให้ A, B, C, D ลบเฉลี่ย 3.0 → (+2, +1, -2, -1)', detail: 'ค่าบวกหมายถึงชอบกว่าปกติของตนเอง, ค่าลบหมายถึงชอบน้อยกว่าปกติของตนเอง', tokens: ['A: +2', 'B: +1', 'C: -2', 'D: -1'], active: [0, 1], matrix: matrix(pairs([0], [0, 1, 2, 3])) },
      { title: '3 · คำนวณ Pearson Correlation', value: 'ความคล้าย Pearson ระหว่าง u1 กับ u2 = 0.8269', detail: 'สะท้อนรสนิยมสัมพันธ์ที่แท้จริง ไม่ถูกบิดเบือนด้วยสเกลการให้ดาวของแต่ละคน', tokens: ['หักลบค่าเฉลี่ยแถว', 'Pearson = 0.8269'], active: [2] }
    ],
    'cf-support': [
      { title: '1 · ปัญหาความคล้ายหลอกตา', value: 'ก่อนถ่วงน้ำหนัก: u4 คล้าย 0.8889 แต่ร่วมแค่ 3 ชิ้น, u2 คล้าย 0.8269 แต่ร่วม 4 ชิ้น', detail: 'ถ้าดูแค่ค่าความคล้าย u4 จะชนะ ทั้งที่ u2 มีหลักฐานความชอบตรงกันแน่นหนากว่า', tokens: ['u4 ร่วม 3 ชิ้น', 'u2 ร่วม 4 ชิ้น'], active: [] },
      { title: '2 · กำหนดขีดจำกัดหลักฐาน (β = 4)', value: 'ตัวคูณลดทอน = min(|ร่วม|, 4) / 4', detail: 'คู่ที่ประเมินร่วมกันไม่ถึง 4 ชิ้น จะถูกลดทอนความน่าเชื่อถือลงตามสัดส่วน', tokens: ['ร่วม 1 → 0.25', 'ร่วม 3 → 0.75', 'ร่วม ≥ 4 → 1.00'], active: [1, 2] },
      { title: '3 · หลังถ่วงน้ำหนัก (Significance Weighting)', value: 'u2: 0.8269 × 1.0 = 0.8269 · u4: 0.8889 × 0.75 = 0.6667', detail: 'ลำดับเพื่อนบ้านสลับกลับมาถูกต้อง u2 ขึ้นนำเพราะมีหลักฐานยืนยันน่าเชื่อถือกว่า', tokens: ['u2 นำเป็นอันดับ 1', 'u4 ถูกลดทอนเพราะหลักฐานน้อย'], active: [0] }
    ],
    'cf-user': [
      { title: '1 · คัดเลือกเฉพาะเพื่อนที่มีคะแนนคอร์ส E', value: 'คอร์ส E มีคะแนนจาก u2 (5 ดาว), u3 (1 ดาว), u4 (4 ดาว), u5 (5 ดาว)', detail: 'เพื่อนที่คล้ายแค่ไหน แต่ถ้าไม่เคยดูคอร์ส E ย่อมไม่สามารถมาช่วยแนะนำคอร์ส E ได้', tokens: ['u2: 5', 'u3: 1', 'u4: 4', 'u5: 5'], active: [], matrix: matrix(pairs([1, 2, 3, 4], [4])) },
      { title: '2 · เลือกเพื่อนบ้าน Top-2 ที่คล้ายที่สุด', value: 'เพื่อนบ้านที่ดีที่สุด 2 คน: u2 (น้ำหนัก 0.8269) และ u4 (น้ำหนัก 0.6667)', detail: 'ตัด u3 ออกเพราะรสนิยมตรงข้าม และตัด u5 ออกเพราะข้อมูลไม่เพียงพอ', tokens: ['u2 น้ำหนัก 0.8269', 'u4 น้ำหนัก 0.6667'], active: [0, 1], matrix: matrix(pairs([0, 1, 3], [0, 1, 2, 3])) },
      { title: '3 · คำนวณความชอบเหนือคาดของเพื่อน', value: 'u2 ให้ E = 5 (เกินเฉลี่ย +1.2) · u4 ให้ E = 4 (เกินเฉลี่ย +1.0)', detail: 'เราไม่ได้เอาดาว 5 กับ 4 มาเฉลี่ยตรงๆ แต่ดูว่าเพื่อนคิดว่าคอร์สนี้ "ดีกว่าปกติของเขา" เท่าไหร่', tokens: ['u2 เกินปกติ +1.2', 'u4 เกินปกติ +1.0'], active: [0, 1], matrix: matrix(pairs([1, 3], [4])) },
      { title: '4 · รวมเข้ากับฐานของ u1', value: 'คำทำนาย u1 กับคอร์ส E = 3.0 + 1.1107 = 4.1107 ดาว', detail: 'เอาค่าเฉลี่ยปกติของ u1 (3.0) บวกด้วยความเห็นของเพื่อนบ้านที่ถ่วงน้ำหนักแล้ว (+1.11)', tokens: ['ฐาน u1 = 3.0', 'เพื่อนเชียร์ +1.11', 'ทำนาย = 4.11 ดาว'], active: [0], matrix: matrix() }
    ],
    'cf-item': [
      { title: '1 · เปลี่ยนมุมมองสู่ Item-to-Item', value: 'เป้าหมายคือคอร์ส E → หาว่าคอร์สใดในอดีตคล้ายกับคอร์ส E ที่สุด', detail: 'Item-kNN จะดูพฤติกรรมในคอลัมน์ แทนที่จะมองหาเพื่อนคนแบบ User-kNN', tokens: ['คอร์สเป้าหมาย: E', 'ประวัติ u1: A, B, C, D'], active: [0], matrix: matrix(pairs([1, 2, 3, 4], [4])) },
      { title: '2 · คำนวณ Adjusted Cosine ระหว่างคอร์ส', value: 'คอร์ส E คล้ายกับคอร์ส A (0.7115) และคอร์ส B (0.7115)', detail: 'สังเกตว่า Adjusted Cosine หักลบค่าเฉลี่ยของ "คนในแถว" เพื่อตัดอคติคนใจดี/คนเคี่ยว', tokens: ['E คล้าย A (0.71)', 'E คล้าย B (0.71)'], active: [0, 1], matrix: matrix(pairs([1, 2, 3, 4], [0, 1, 4])) },
      { title: '3 · ตรวจสอบคะแนนที่ u1 เคยให้คอร์ส A และ B', value: 'u1 เคยให้คอร์ส A = 5 ดาว (+2 จากปกติ) และคอร์ส B = 4 ดาว (+1 จากปกติ)', detail: 'ใช้ความทรงจำและความชอบส่วนตัวของ u1 เองมาเป็นตัวทำนาย', tokens: ['u1 ชอบ A มาก (5)', 'u1 ชอบ B ปานกลาง (4)'], active: [0, 1], matrix: matrix(pairs([0], [0, 1])) },
      { title: '4 · ทำนายผลลัพธ์ด้วย Item-kNN', value: 'คำทำนาย u1 กับคอร์ส E ด้วย Item-kNN = 4.5000 ดาว', detail: 'Amazon นิยมวิธีนี้อย่างยิ่งเพราะผลลัพธ์เสถียรและสามารถอธิบายได้ชัดเจน ("แนะนำเพราะคุณชอบ A และ B")', tokens: ['ทำนาย Item-kNN = 4.5 ดาว', 'เสถียรและแคชง่าย'], active: [0], matrix: matrix() }
    ],
    'cf-implicit': [
      { title: '1 · แปลงข้อมูลเป็นรอยเท้าพฤติกรรม (Binary)', value: 'กำหนด: คะแนนดาว ≥ 4 แปลงเป็น 1 (ชอบ/มีส่วนร่วม); ช่องว่าง = 0', detail: 'ในระบบจริงส่วนใหญ่ไม่มีดาว มีแต่คลิก/ดู/ซื้อ ซึ่งช่องว่าง (0) ไม่ได้แปลว่าเกลียด แต่แปลว่ายังไม่เห็น', tokens: ['u1 ชอบคอร์ส {A, B}', '0 หมายถึงยังไม่เคยดู'], active: [0] },
      { title: '2 · คำนวณ Co-occurrence Cosine', value: 'ความคล้ายแบบ Binary ระหว่าง E กับ A = 2 / 3, E กับ B = 2 / 3', detail: 'วัดว่าเมื่อมีคนดูคอร์ส A มักจะมีคนดูคอร์ส E ต่อด้วยบ่อยแค่ไหน (ซื้อคู่กันบ่อย)', tokens: ['ซื้อคู่กัน 2 คน', 'Cosine Binary = 2/3'], active: [0, 1, 2] },
      { title: '3 · คำนวณคะแนนจัดอันดับ (Ranking Score)', value: 'คะแนนคอร์ส E = sim(A, E) + sim(B, E) = 2/3 + 2/3 = 1.3333', detail: 'ตัวเลขนี้ไม่ใช่คะแนนดาว แต่เป็นคะแนนความมั่นใจสำหรับจัดอันดับ Top-K', tokens: ['Sum Score = 1.33', 'ใช้จัดอันดับ Top-K'], active: [2] }
    ],
    'cf-bias': [
      { title: '1 · ค่าเฉลี่ยกลางทั้งระบบ (Global Mean)', value: 'ผลรวมดาวทั้งหมด 66 ดาว จาก 20 ช่องที่รู้ → μ = 66 / 20 = 3.3000', detail: 'นี่คือจุดกึ่งกลางของจักรวาลในระบบเรา ถ้าไม่รู้อะไรเลยเกี่ยวกับใคร ทาย 3.3 ดาวไว้ก่อน', tokens: ['ผลรวม 66', 'สังเกต 20 ช่อง', 'μ = 3.3'], active: [2] },
      { title: '2 · คำนวณอคติของสินค้า (Item Bias: bi)', value: 'คอร์ส E เป็นคอร์สยอดนิยม → มีอคติเชิงบวก bi = +0.3000', detail: 'สะท้อนว่าคอร์สนี้สร้างมาดี คนทั่วไปมักให้คะแนนสูงกว่าเกณฑ์เฉลี่ยกลางระบบเสมอ', tokens: ['E ยอดนิยม', 'Item Bias = +0.30'], active: [2] },
      { title: '3 · คำนวณอคติของผู้ใช้ (User Bias: bu)', value: 'u1 เป็นคนค่อนข้างเคี่ยว → มีอคติเชิงลบ bu = -0.1500', detail: 'สะท้อนนิสัยส่วนบุคคลว่ามักจะกดคะแนนต่ำกว่าค่าเฉลี่ยกลางของระบบเล็กน้อย', tokens: ['u1 ค่อนข้างเคี่ยว', 'User Bias = -0.15'], active: [2] },
      { title: '4 · รวมเป็นค่าคะแนนฐาน (Baseline Estimate)', value: 'b(u1, E) = μ + bu + bi = 3.3 - 0.15 + 0.30 = 3.4500 ดาว', detail: 'เพียงแค่รู้ว่า "ระบบเฉลี่ย 3.3 + คนนี้เคี่ยว -0.15 + ของชิ้นนี้ดี +0.30" เราก็ทายได้ถึง 3.45 แล้ว!', tokens: ['μ (3.3) + bu (-0.15) + bi (+0.3)', 'Baseline = 3.45'], active: [3] }
    ],
    'cf-baseline': [
      { title: '1 · เริ่มต้นจากค่าฐาน (Baseline)', value: 'ค่าฐานของคู่ u1 กับ E คือ bui = 3.4500 ดาว', detail: 'ค่าฐานทำหน้าที่รองรับโครงสร้างใหญ่ 80% ของคะแนน', tokens: ['Baseline 3.45 ดาว'], active: [0] },
      { title: '2 · สกัดเฉพาะส่วนเหนือความคาดหมาย (Residuals)', value: 'ดูว่า u1 เคยชอบคอร์ส A และ B มากกว่าค่าฐานของคอร์สนั้นๆ เท่าไร', detail: 'หักล้างอคติของทั้งระบบออก เพื่อให้เหลือเฉพาะ "ความประทับใจเป็นพิเศษ"', tokens: ['Residual A = +1.38', 'Residual B = +0.55'], active: [0, 1] },
      { title: '3 · ผสานพลังเพื่อนบ้านกับค่าฐาน (kNN-Baseline)', value: 'r̂(u1, E) = 3.45 + Residual เพื่อนบ้าน (+0.97) = 4.4167 ดาว', detail: 'โมเดล kNN-Baseline คือหนึ่งในโมเดลคลาสสิกที่แม่นยำที่สุดในการแข่งขัน Netflix Prize', tokens: ['Baseline 3.45', 'Neighborhood +0.97', 'ทำนาย 4.42 ดาว'], active: [1] }
    ]
  };

  const lessons = [
    {
      id: 'recsys-cf-map',
      number: '05.1',
      title: 'CF คืออะไร: เปลี่ยนจากเนื้อหามาอ่านรอยเท้าฝูงชน',
      goal: 'เข้าใจแนวคิดหลักของ Collaborative Filtering และความแตกต่างระหว่าง User-based กับ Item-based',
      lead: 'Content-based สนใจว่าสิ่งของ "มีหน้าตาหรือเนื้อหาอย่างไร" แต่ Collaborative Filtering อาศัยภูมิปัญญาของฝูงชน (Wisdom of the Crowd) โดยดูว่า "ผู้คนมีพฤติกรรมตอบสนองต่อสิ่งของต่างๆ อย่างไร"',
      body: `
        <div data-rs-demo="cf-matrix"></div>

        <div class="rs-callout rs-callout-info">
          <h4>💡 ที่มาและปัญหาโลกจริง (The Intuition & Why)</h4>
          <p>ลองจินตนาการว่าคุณเปิดร้านขายน้ำหอม หรือร้านกาแฟพิเศษ... ข้อความบรรยายว่า "กาแฟคั่วกลาง มีกลิ่นฟรุตตี้" แทบไม่สามารถบอกได้เลยว่าใครจะชอบแก้วไหนจริงหรือไม่ เพราะลิ้นและรสนิยมของมนุษย์มีความซับซ้อนเกินกว่าตัวอักษรจะอธิบายได้! <b>Collaborative Filtering (CF)</b> เกิดขึ้นมาเพื่อแก้ปัญหานี้โดยสิ้นเชิง: เราไม่จำเป็นต้องรู้เลยว่ากาแฟทำมาจากเมล็ดอะไร หรือหนังมีเนื้อเรื่องเกี่ยวกับอะไร แต่เราดูว่า <i>"คนที่ชอบกาแฟแก้วที่ 1 มักจะชอบกาแฟแก้วที่ 3 เหมือนกัน"</i> นั่นคือการพึ่งพา <b>รอยเท้าพฤติกรรมของฝูงชน (Wisdom of the Crowd)</b></p>
        </div>

        <h4>ถอดรหัสคำสำคัญและตัวย่อ (Key Terms Decoded)</h4>
        <table>
          <thead>
            <tr><th>คำศัพท์ / ตัวย่อ</th><th>คำแปลที่เข้าใจง่าย</th><th>บทบาทในระบบแนะนำ</th></tr>
          </thead>
          <tbody>
            <tr><td><b>CF</b><br>(Collaborative Filtering)</td><td>การกรองแบบพึ่งพาฝูงชน</td><td>แนวคิดการแนะนำของโดยอาศัยพฤติกรรมในอดีตของผู้ใช้คนอื่นๆ ในระบบ โดยไม่ต้องอาศัยคำบรรยายสินค้า (Metadata) เลยแม้แต่คำเดียว</td></tr>
            <tr><td><b>Rating Matrix (<i>R</i>)</b></td><td>ตารางปฏิสัมพันธ์ 2 มิติ</td><td>ตารางความสัมพันธ์ขนาดใหญ่ แถวคือผู้ใช้ (User) คอลัมน์คือสินค้า (Item) จุดตัดคือคะแนนหรือการกระทำ</td></tr>
            <tr><td><b>Sparsity</b></td><td>ความเบาบางของตาราง</td><td>สัดส่วนช่องว่างที่ผู้ใช้ยังไม่เคยดู ในระบบจริงตารางจะว่างเปล่ากว่า 99% (ในตารางตัวอย่างด้านบน มีข้อมูล 20 จาก 30 ช่อง คิดเป็น Sparsity = 33.33%)</td></tr>
            <tr><td><b>Missing Value ( ? )</b></td><td>ช่องว่างที่ยังไม่สังเกต</td><td><b>หลุมพรางสำคัญ:</b> ช่องว่างหมายถึงผู้ใช้ <i>"ยังไม่เคยเห็นหรือยังไม่เคยลอง"</i> <u>ห้ามแทนด้วย 0 เด็ดขาด</u> เพราะ 0 หมายถึงลองแล้วเกลียดมาก!</td></tr>
          </tbody>
        </table>

        <h4>2 ตระกูลหลักของ Collaborative Filtering เชิงเพื่อนบ้าน (Neighborhood-based CF)</h4>
        <table>
          <thead>
            <tr><th>มิติมุมมอง</th><th>User-based CF (มองตามแถว)</th><th>Item-based CF (มองตามคอลัมน์)</th></tr>
          </thead>
          <tbody>
            <tr><td><b>คำถามหลัก</b></td><td>"ใครมีรสนิยมคล้ายกับผู้ใช้คนนี้บ้าง?"</td><td>"สินค้าชิ้นไหนมีคนชอบคล้ายกับสินค้านี้บ้าง?"</td></tr>
            <tr><td><b>วิธีการหา</b></td><td>เปรียบเทียบแถวของผู้ใช้เป้าหมาย กับแถวของผู้ใช้คนอื่นๆ ในตาราง</td><td>เปรียบเทียบคอลัมน์ของสินค้าเป้าหมาย กับคอลัมน์ของสินค้าอื่นๆ</td></tr>
            <tr><td><b>ตัวอย่างประโยค</b></td><td><i>"ผู้ใช้ กานต์ และ พลอย ชอบดูหนังแนวเดียวกับคุณ และพวกเขาชอบเรื่องนี้ คุณก็น่าจะชอบด้วย"</i></td><td><i>"คุณเคยให้ 5 ดาวกับ Python สำหรับ Data Science คอร์ส Data Storytelling นี้มีรูปแบบคนชอบเหมือนกันมาก คุณจึงน่าจะชอบ"</i></td></tr>
            <tr><td><b>ความนิยมในอุตสาหกรรม</b></td><td>เหมาะกับระบบที่คนน้อยกว่าของ (เช่น สังคมเฉพาะกลุ่ม)</td><td><b>ได้รับความนิยมสูงสุด (มาตรฐาน Amazon)</b> เพราะสินค้ามีเสถียรกว่าและคำนวณล่วงหน้าได้ง่ายกว่า</td></tr>
          </tbody>
        </table>

        <h4>คู่มือการตัดสินใจทางวิศวกรรม (Engineering Decision Guide)</h4>
        <div class="rs-callout rs-callout-warning">
          <ul>
            <li><b>เมื่อไหร่ควรใช้ CF เหนือ Content-based:</b> เมื่อสินค้ามีเนื้อหายากต่อการสกัดฟีเจอร์ (เช่น เพลง, งานศิลปะ, กลิ่นน้ำหอม) หรือเมื่อต้องการแนะนำข้ามหมวดหมู่แบบสร้างความประหลาดใจ (Serendipity) ที่อาศัยพฤติกรรมคนจริง</li>
            <li><b>จุดอ่อนที่ต้องระวัง:</b> ไม่สามารถแนะนำสินค้าใหม่แกะกล่องที่ยังไม่มีใครแตะต้องเลยได้ (Item Cold-Start) และไม่สามารถแนะนำอะไรให้คนเพิ่งสมัครใหม่ได้ (User Cold-Start)</li>
          </ul>
        </div>
      `,
      sources: [source(3, 'CF ต่างจาก Content-based'), source(4, 'สองตระกูลของ CF'), source(7, 'Rating matrix'), source(8, 'Density และสถิติพื้นฐาน')],
      questions: [
        question('rs-cf-map-1', 'หลักการพื้นฐานที่สุดที่ทำให้ Collaborative Filtering แตกต่างจาก Content-based Filtering คือข้อใด?',
          ['CF ต้องอาศัยการอ่านแท็กและคำอธิบายสินค้าอย่างละเอียด', 'CF อาศัยรอยเท้าพฤติกรรมร่วมกันของผู้ใช้ในระบบ (Wisdom of the Crowd) โดยไม่จำเป็นต้องรู้เนื้อหาหรือคำบรรยายของสินค้าเลย', 'CF ใช้งานได้เฉพาะกับไฟล์รูปภาพเท่านั้น', 'CF บังคับให้ผู้ใช้ทุกคนต้องรู้จักกันในชีวิตจริง'],
          1,
          'Collaborative Filtering ทำงานโดยการเรียนรู้รูปแบบความชอบร่วมกันของผู้คน (คนชอบเหมือนกัน มักจะชอบสิ่งใหม่เหมือนกัน) จึงไม่ต้องพึ่งพา Metadata ของสินค้า',
          ['นั่นคือแนวคิดของ Content-based', 'ถูกต้อง CF อาศัยพฤติกรรมร่วมของผู้คนโดยไม่พึ่งพา Metadata', 'CF ใช้ได้กับข้อมูลทุกประเภทที่มี Interaction', 'ผู้ใช้ในระบบไม่ต้องรู้จักกันจริง']),
        question('rs-cf-map-2', 'ในตาราง Rating Matrix ช่องว่างที่ยังไม่มีคะแนน (?) ควรได้รับการจัดการอย่างไรในเชิงคณิตศาสตร์และตรรกะระบบแนะนำ?',
          ['ต้องเติมเลข 0 ทันทีเพื่อความสะดวกในการคูณเมทริกซ์', 'ต้องเติมคะแนนเฉลี่ย 3 ดาวลงไปในทุกช่องว่าง', 'ต้องมองเป็นสถานะ "ยังไม่เคยพบเห็นหรือยังไม่เคยลอง" (Unobserved) และห้ามคิดคะแนนเป็น 0 เด็ดขาด', 'ต้องลบแถวของผู้ใช้คนนั้นทิ้งทันที'],
          2,
          'ช่องว่างใน RecSys หมายถึงผู้ใช้ยังไม่เคยมีปฏิสัมพันธ์ (Missing at random / Unobserved) การเติม 0 จะกลายเป็นการใส่ร้ายว่าผู้ใช้เกลียดสินค้านั้น',
          ['การเติม 0 จะบิดเบือนข้อมูลอย่างรุนแรงเพราะ 0 คือคะแนนเกลียด', 'การเติม 3 ดาวจะทำให้ระบบสูญเสียความแม่นยำ', 'ถูกต้อง ช่องว่างคือ Unobserved ห้ามใส่ 0 หรือคิดเป็นความเกลียด', 'การลบแถวทิ้งจะทำให้เสียข้อมูลประวัติส่วนบุคคล']),
        question('rs-cf-map-3', 'เหตุใดแพลตฟอร์ม E-Commerce ยักษ์ใหญ่อย่าง Amazon จึงนิยมใช้ Item-based CF มากกว่า User-based CF?',
          ['เพราะบนโลกนี้มีจำนวนผู้ใช้น้อยกว่าจำนวนสินค้าเสมอ', 'เพราะความคล้ายคลึงระหว่างสินค้า (Item-Item) มักมีความเสถียรมากกว่า ไม่เปลี่ยนไปเปลี่ยนมาตามอารมณ์มนุษย์ และสามารถคำนวณเก็บไว้ในแคชล่วงหน้าได้ง่ายกว่า', 'เพราะ Item-based ไม่ต้องใช้คอมพิวเตอร์ในการคำนวณ', 'เพราะกฎหมายห้ามเปรียบเทียบข้อมูลระหว่างผู้ใช้'],
          1,
          'ความสัมพันธ์ระหว่างสินค้า เช่น "เมาส์กับแผ่นรองเมาส์" มักคงที่นานหลายเดือนและแคชไว้ล่วงหน้าได้ ต่างจากรสนิยมคนและจำนวนผู้ใช้ที่ขยายตัวอย่างรวดเร็วและผันผวนตลอดเวลา',
          ['ใน E-Commerce ผู้ใช้มักมีจำนวนมากกว่าสินค้ามหาศาล', 'ถูกต้อง ความสัมพันธ์ระหว่างสินค้าเสถียรกว่าและคำนวณล่วงหน้าเก็บในแคชได้', 'ต้องใช้คอมพิวเตอร์คำนวณเช่นกัน', 'ไม่มีกฎหมายห้าม']),
        question('rs-cf-map-4', 'หากระบบมีผู้ใช้ 10,000 คน สินค้า 5,000 ชิ้น และมีบันทึกการซื้อจริงเกิดขึ้นทั้งหมด 50,000 ครั้ง ตารางนี้มีค่าความเบาบาง (Sparsity) ประมาณเท่าใด?',
          ['ประมาณ 0.1% (หนาแน่นมาก)', 'ประมาณ 50%', 'ประมาณ 99.9% (ว่างเปล่าเกือบทั้งหมด)', 'ประมาณ 10%'],
          2,
          'จำนวนช่องทั้งหมด = 10,000 × 5,000 = 50,000,000 ช่อง แต่มีข้อมูลเพียง 50,000 ช่อง (คิดเป็น Density = 0.1%) ดังนั้นช่องว่างหรือ Sparsity จึงสูงถึง 99.9%',
          ['0.1% คือ Density (ความหนาแน่น) ไม่ใช่ Sparsity', 'ไม่ใช่ 50%', 'ถูกต้อง ช่องทั้งหมด 50 ล้านช่อง มีข้อมูล 5 หมื่นช่อง Sparsity จึงสูงถึง 99.9%', 'ไม่ใช่ 10%'])
      ]
    },
    {
      id: 'recsys-cf-popularity',
      number: '05.2',
      title: 'Popularity Baseline: รากฐานแรกก่อนเริ่มแนะนำเฉพาะบุคคล',
      goal: 'เข้าใจความสำคัญของการสร้าง Popularity Baseline, วิธีนับความนิยมที่ถูกต้อง และการใช้เป็นจุดตั้งต้นเปรียบเทียบ',
      lead: 'ก่อนที่จะสร้างโมเดล Machine Learning ที่ซับซ้อน เราจำเป็นต้องมีไม้บรรทัดวัดมาตรฐาน (Baseline) เสมอ และ Baseline ที่ทรงพลังที่สุดในโลกจริงคือ "ของยอดนิยมประจำแพลตฟอร์ม"',
      body: `
        <div data-rs-demo="cf-popularity"></div>

        <div class="rs-callout rs-callout-info">
          <h4>💡 ที่มาและปัญหาโลกจริง (The Intuition & Why)</h4>
          <p>ในโลกของ Data Science กฎเหล็กข้อแรกคือ: <i>"อย่าเพิ่งสร้างโมเดล Deep Learning ถ้ายังไม่ได้วัดผลเทียบกับ Baseline ที่เรียบง่าย!"</i> ในระบบแนะนำ <b>ความนิยมโดยรวม (Global Popularity)</b> เช่น รายการหนัง Top-10 ประจำวัน หรือสินค้าขายดีประจำสัปดาห์ มักให้ผลลัพธ์ที่ดีอย่างน่าประหลาดใจ เพราะคนส่วนใหญ่บนโลกมีแนวโน้มจะสนใจสิ่งที่คนอื่นกำลังฮิตกันอยู่แล้ว</p>
        </div>

        <h4>ถอดรหัสคำสำคัญและตัวย่อ (Key Terms Decoded)</h4>
        <table>
          <thead>
            <tr><th>คำสำคัญ</th><th>ความหมายเชิงเทคนิค</th><th>จุดที่มักเข้าใจผิด</th></tr>
          </thead>
          <tbody>
            <tr><td><b>Popularity by Interaction Count</b></td><td>นับจำนวนครั้งที่มีการคลิก ซื้อ หรือกดชอบ (ดาว ≥ 4)</td><td><b>ไม่ใช่ดาวเฉลี่ย!</b> สินค้าที่มีคนให้ 5 ดาวแค่คนเดียว ไม่ถือเป็นของยอดนิยม เพราะหลักฐานยังน้อยเกินไป</td></tr>
            <tr><td><b>Average Rating Baseline</b></td><td>ค่าเฉลี่ยของคะแนนดาวทั้งหมดในสินค้านั้น</td><td>มีจุดบอดเรื่องความเบี่ยงเบนจากกลุ่มตัวอย่างเล็ก (Small Sample Bias) เช่น สินค้าคะแนน 5.0 เต็ม แต่มีคนรีวิวคนเดียว</td></tr>
            <tr><td><b>Cold-Start Fallback</b></td><td>นโยบายสำรองเมื่อไม่รู้จักผู้ใช้</td><td>เมื่อผู้ใช้เพิ่งเปิดแอปครั้งแรกและระบบไม่มีข้อมูลอะไรเลย การแสดงลิสต์ Popularity คือทางออกที่ดีที่สุดในเชิงธุรกิจ</td></tr>
          </tbody>
        </table>

        <h4>ตารางเปรียบเทียบคอร์สในชุดฝึกตัวอย่าง</h4>
        <table>
          <thead>
            <tr><th>คอร์ส</th><th>จำนวนคนที่ให้คะแนน</th><th>จำนวนคนที่ชอบจริง (ดาว ≥ 4)</th><th>คะแนนเฉลี่ยดาว</th><th>สถานะในระบบ</th></tr>
          </thead>
          <tbody>
            <tr><td><b>A (Python)</b></td><td>4 คน</td><td>3 คน</td><td>4.00 ดาว</td><td>ยอดนิยมระดับสูง</td></tr>
            <tr><td><b>B (SQL)</b></td><td>4 คน</td><td>3 คน</td><td>3.75 ดาว</td><td>ยอดนิยมระดับสูง</td></tr>
            <tr><td><b>C (Art)</b></td><td>4 คน</td><td>1 คน</td><td>2.25 ดาว</td><td>เฉพาะกลุ่ม / คะแนนต่ำ</td></tr>
            <tr><td><b>D (UX)</b></td><td>4 คน</td><td>2 คน</td><td>2.75 ดาว</td><td>ปานกลาง</td></tr>
            <tr><td><b>E (Data Story)</b></td><td>4 คน</td><td>3 คน</td><td>3.75 ดาว</td><td>ยอดนิยมระดับสูง</td></tr>
            <tr><td><b>F (คอร์สใหม่)</b></td><td>0 คน</td><td>0 คน</td><td>ไม่มีข้อมูล</td><td><b>Item Cold-Start สมบูรณ์แบบ</b></td></tr>
          </tbody>
        </table>

        <h4>คู่มือการตัดสินใจทางวิศวกรรม (Engineering Decision Guide)</h4>
        <div class="rs-callout rs-callout-warning">
          <ul>
            <li><b>เกณฑ์การนับความนิยม (Thresholding):</b> การนับยอดนิยมควรตั้งเกณฑ์คุณภาพ เช่น นับเฉพาะรีวิวที่ให้ดาว ≥ 4 หรือผู้ใช้ที่ดูคลิปจบเกิน 80% ไม่ใช่นับการคลิกผ่านแบบไม่ได้ตั้งใจ</li>
            <li><b>การกรองของเดิมออก (Candidate Filtering):</b> แม้จะเป็น Popularity Baseline แต่ต้องตัดสินค้าที่ผู้ใช้คนนั้นเคยซื้อหรือดูไปแล้วออกจากลิสต์เสมอ มิฉะนั้นจะสร้างความน่ารำคาญ</li>
            <li><b>บทบาทของ Baseline:</b> โมเดล CF ขั้นสูงใดๆ ก็ตาม จะถือว่า "สอบผ่าน" ก็ต่อเมื่อสามารถทำคะแนน Metric (เช่น Hit Rate, Precision@K) ชนะ Popularity Baseline นี้ได้อย่างมีนัยสำคัญทางสถิติเท่านั้น!</li>
          </ul>
        </div>
      `,
      sources: [source(9, 'Popularity baseline'), source(10, 'การนับและจัดอันดับ'), source(12, 'Fallback นโยบาย')],
      questions: [
        question('rs-cf-pop-1', 'เหตุใดในการสร้าง Popularity Baseline วิศวกรจึงไม่ควรจัดอันดับสินค้าด้วย "คะแนนดาวเฉลี่ยดิบ" เพียงอย่างเดียว?',
          ['เพราะการคำนวณค่าเฉลี่ยกินพลังประมวลผลของคอมพิวเตอร์มากเกินไป', 'เพราะจะเกิดปัญหา Small Sample Bias โดยสินค้าที่มีคนรีวิว 5 ดาวเพียงแค่ 1 คน จะแซงหน้าสินค้าคุณภาพยอดเยี่ยมที่มีคนรีวิว 4.8 ดาวจำนวน 100,000 คน', 'เพราะคะแนนเฉลี่ยเป็นความลับทางการค้า', 'เพราะคะแนนดาวเฉลี่ยไม่สามารถคำนวณเป็นทศนิยมได้'],
          1,
          'สินค้าที่มีผู้รีวิวเพียง 1 คนแล้วได้ 5 ดาว ไม่ได้สะท้อนความนิยมจริงของมวลชน หากใช้ดาวเฉลี่ยดิบ สินค้าเหล่านี้จะลอยขึ้นมาอยู่อันดับหนึ่งอย่างไม่ถูกต้อง',
          ['การหาค่าเฉลี่ยใช้พลังประมวลผลต่ำมาก', 'ถูกต้อง ป้องกันสินค้าที่รีวิวแค่ 1 คนลอยขึ้นมาอยู่อันดับหนึ่ง', 'คะแนนเฉลี่ยไม่ได้เป็นความลับ', 'คะแนนดาวเฉลี่ยคำนวณเป็นทศนิยมได้ตามปกติ']),
        question('rs-cf-pop-2', 'ในทางสถาปัตยกรรมระบบแนะนำ ประโยชน์หลักที่สำคัญที่สุดของ Popularity Baseline คือข้อใด?',
          ['ใช้แทนที่ระบบ Machine Learning ทั้งหมดเพื่อประหยัดเงิน', 'ใช้เป็นเส้นชัยสุดท้ายในการปิดโปรเจกต์', 'ทำหน้าที่เป็นจุดอ้างอิงเปรียบเทียบมาตรฐาน (Benchmark) และเป็นระบบสำรอง (Fallback) ให้กับผู้ใช้ใหม่ที่ยังไม่มีประวัติ', 'ใช้สำหรับคำนวณภาษีของบริษัท'],
          2,
          'Popularity เป็น Benchmark สำหรับพิสูจน์ว่าโมเดลใหม่ฉลาดกว่าวิธีพื้นฐานหรือไม่ และเป็น Fallback ช่วยชีวิตเมื่อเจอผู้ใช้ใหม่เอี่ยม (User Cold-Start)',
          ['ไม่ควรใช้แทนที่ทั้งหมดเพราะขาด Personalization', 'ไม่ใช่เส้นชัยสุดท้าย แต่เป็นจุดเริ่มต้น', 'ถูกต้อง เป็น Benchmark เปรียบเทียบและเป็น Fallback รับมือคนใหม่', 'ไม่เกี่ยวกับภาษี']),
        question('rs-cf-pop-3', 'หากผู้ใช้ล็อกอินเข้ามาในระบบ และระบบกำลังจะแสดงผลสินค้าจาก Popularity Baseline ขั้นตอนใดที่จำเป็นต้องทำก่อนแสดงผลบนหน้าจอ?',
          ['ต้องกรองสินค้าที่ผู้ใช้คนนั้นเคยซื้อหรือดูไปแล้วออกก่อน (Candidate Filtering)', 'ต้องบังคับให้ผู้ใช้จ่ายเงินก่อนดู', 'ต้องสุ่มสลับชื่อสินค้าทั้งหมด', 'ต้องรีเซ็ตคะแนนของระบบเป็นศูนย์'],
          0,
          'แม้จะเป็นลิสต์ของยอดนิยมทั่วไป แต่ในมุมมองผู้ใช้ หากระบบยังคงแนะนำของที่เขาเพิ่งซื้อไปเมื่อวานซ้ำๆ จะถือเป็นประสบการณ์ใช้งานที่แย่มาก',
          ['ถูกต้อง ต้องตัดสินค้าที่เคยมี Interaction ออกก่อนเสมอ', 'ไม่เกี่ยวกับการบังคับจ่ายเงิน', 'การสุ่มชื่อทำให้ข้อมูลผิดพลาด', 'ไม่ควรรีเซ็ตคะแนน']),
        question('rs-cf-pop-4', 'จากตารางตัวอย่างด้านบน คอร์ส F มีจำนวนคะแนนเป็น 0 คน สิ่งนี้สะท้อนปัญหาคลาสสิกข้อใดของระบบแนะนำ?',
          ['Data Leakage', 'Item Cold-Start Problem (สินค้าใหม่ที่ยังไม่มีใครมีปฏิสัมพันธ์ด้วย)', 'Overfitting', 'Filter Bubble'],
          1,
          'เมื่อสินค้าเข้าสู่ระบบใหม่เอี่ยมและยังไม่เคยมีใครซื้อหรือรีวิว (Count = 0) ระบบที่อาศัยพฤติกรรมคนอย่าง CF จะมองไม่เห็นสินค้าชิ้นนี้เลย เรียกว่า Item Cold-Start',
          ['Data Leakage คือข้อมูลรั่วไหล', 'ถูกต้อง สินค้าใหม่เอี่ยมที่ไร้ประวัติเรียกว่า Item Cold-Start', 'Overfitting คือโมเดลจำข้อสอบ', 'Filter Bubble คือกักขังในรสนิยมเดิม'])
      ]
    },
    {
      id: 'recsys-cf-jaccard-cosine',
      number: '05.3',
      title: 'วัดความคล้ายด้วยเซตหรือมุม: Jaccard vs Cosine Similarity',
      goal: 'เปรียบเทียบความแตกต่างระหว่าง Jaccard Similarity (เชิงเซต) และ Cosine Similarity (เชิงเวกเตอร์) ในการวัดความคล้ายของผู้ใช้',
      lead: 'หัวใจของ Collaborative Filtering คือการหาว่า "ใครคล้ายกับเรา" แต่คำว่าคล้ายกัน เราจะวัดจากรายการสิ่งของที่เคยจับต้องร่วมกัน หรือวัดจากทิศทางของคะแนนความชอบ?',
      body: `
        <div data-rs-demo="cf-similarity"></div>

        <div class="rs-callout rs-callout-info">
          <h4>💡 ที่มาและปัญหาโลกจริง (The Intuition & Why)</h4>
          <p>สมมุติว่าคุณกับเพื่อนเปิดดูหนัง 4 เรื่องเหมือนกันเป๊ะเลย... ในมุมมองของ <b>Jaccard</b> คุณทั้งคู่คล้ายกัน 100% เพราะประวัติการรับชมทับซ้อนกันสมบูรณ์แบบ! แต่พอเปิดดูคะแนนดาวจริง: คุณให้ 5 ดาวทุกเรื่อง (ชอบมาก) ขณะที่เพื่อนให้ 1 ดาวทุกเรื่อง (เกลียดมาก) กลายเป็นว่ารสนิยมของคุณทั้งคู่ตรงข้ามกันคนละขั้ว! นี่คือเหตุผลว่าทำไมเราจึงต้องเข้าใจความแตกต่างระหว่างการวัดความคล้ายเชิงเซตกับการวัดความคล้ายเชิงเวกเตอร์</p>
        </div>

        <h4>ถอดรหัสสูตรและความหมาย (Formulas & Concepts Decoded)</h4>
        <table>
          <thead>
            <tr><th>วิธีการวัด</th><th>สูตรคณิตศาสตร์</th><th>ความหมายเชิงสัญชาตญาณ</th><th>ความเหมาะสม</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><b>Jaccard Similarity</b></td>
              <td><i>J(A, B) = |A ∩ B| / |A ∪ B|</i></td>
              <td>นับจำนวนของที่เคยดูร่วมกัน หารด้วยจำนวนของทั้งหมดที่คนใดคนหนึ่งเคยดู (สนใจแค่ <b>มี / ไม่มี</b> ไม่สนใจคะแนนดาว)</td>
              <td>เหมาะอย่างยิ่งกับ <b>Implicit Feedback</b> เช่น ประวัติการคลิก การฟังเพลง หรือการซื้อสินค้า</td>
            </tr>
            <tr>
              <td><b>Cosine Similarity (ดิบ)</b></td>
              <td><i>cos(u, v) = (u · v) / (‖u‖ · ‖v‖)</i></td>
              <td>วัด <b>มุมองศา</b> ระหว่างเวกเตอร์คะแนนดาวในพื้นที่มิติ ถ้าให้คะแนนไปในทิศทางสอดคล้องกัน มุมจะแคบ (Cosine เข้าใกล้ 1.0)</td>
              <td>เหมาะกับ <b>Explicit Ratings</b> ที่มีคะแนนดาวหลายระดับ (1–5 ดาว)</td>
            </tr>
          </tbody>
        </table>

        <h4>การคำนวณจริงบนชุดข้อมูลตัวอย่าง (u1 vs u2 บนคอร์สร่วม A, B, C, D)</h4>
        <div class="rs-table-wrap">
          <table>
            <thead>
              <tr><th>คู่เปรียบเทียบ</th><th>คอร์สที่ประเมินร่วมกัน</th><th>Jaccard Similarity</th><th>Cosine Similarity ดิบ</th><th>การตีความ</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><b>u1 กับ u2</b></td>
                <td>A, B, C, D (4 คอร์ส)</td>
                <td>4 / 5 = <b>0.8000</b></td>
                <td>(50) / (√46 × √58) = <b>0.9680</b></td>
                <td>มีประวัติร่วมกันหนาแน่น และให้คะแนนไปในทิศทางเดียวกันอย่างยิ่ง</td>
              </tr>
              <tr>
                <td><b>u1 กับ u5</b></td>
                <td>B (ร่วมแค่คอร์สเดียว!)</td>
                <td>1 / 5 = <b>0.2000</b></td>
                <td>(4 × 5) / (4 × 5) = <b>1.0000</b></td>
                <td><b>กับดักอันตราย!</b> Cosine = 1.0 หลอกตาเพราะมีข้อมูลร่วมแค่ชิ้นเดียว ทำให้ทิศทางตรงกันโดยบังเอิญ</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h4>คู่มือการตัดสินใจทางวิศวกรรม (Engineering Decision Guide)</h4>
        <div class="rs-callout rs-callout-warning">
          <ul>
            <li><b>หลุมพราง Co-rated Item เดียว:</b> สังเกตกรณี u1 กับ u5 ที่ประเมินร่วมกันแค่คอร์ส B คอร์สเดียว... เวกเตอร์ 1 มิติที่เป็นบวกทั้งคู่ จะทำมุม 0 องศาเสมอ ส่งผลให้ Cosine ออกมาเป็น 1.0000 เต็ม! ทั้งที่ไม่สามารถสรุปได้เลยว่าสองคนนี้รสนิยมเหมือนกัน</li>
            <li><b>กฎความปลอดภัย:</b> ห้ามใช้ Cosine Similarity ดิบโดยไม่มีการคัดกรองจำนวนสินค้าที่ประเมินร่วมกันขั้นต่ำ (Co-rating Threshold) หรือต้องใช้เทคนิค Significance Weighting เข้ามาช่วยเสมอ</li>
          </ul>
        </div>
      `,
      sources: [source(14, 'Jaccard similarity'), source(15, 'Cosine similarity'), source(16, 'ปัญหาข้อมูลน้อย')],
      questions: [
        question('rs-cf-sim-1', 'Jaccard Similarity มีข้อจำกัดสำคัญประการใดเมื่อนำมาใช้กับข้อมูลคะแนนดาว (Explicit Ratings)?',
          ['Jaccard คำนวณได้เฉพาะข้อมูลข้อความเท่านั้น', 'Jaccard สนใจเพียงแค่ว่ามีประวัติร่วมกันหรือไม่ แต่ตาบอดต่อระดับคะแนนดาว (เช่น คนหนึ่งให้ 5 ดาว อีกคนให้ 1 ดาว Jaccard ก็ยังมองว่าคล้ายกัน)', 'Jaccard ให้ค่าเป็นลบเสมอ', 'Jaccard ต้องใช้การ์ดจอ GPU ขั้นสูงในการคำนวณ'],
          1,
          'Jaccard เป็นการวัดเชิงเซต (Set-based) สนใจแค่มีหรือไม่มีในเซต จึงแยกแยะระหว่างคนที่รักหนังเรื่องนั้นกับคนที่เกลียดหนังเรื่องนั้นไม่ได้',
          ['Jaccard ใช้กับเซตอะไรก็ได้', 'ถูกต้อง Jaccard ไม่สนใจระดับคะแนนดาว มองแค่ว่ามีหรือไม่มีในประวัติ', 'Jaccard มีค่าอยู่ในช่วง 0 ถึง 1 เสมอ ไม่มีค่าลบ', 'Jaccard เป็นสูตรเศษส่วนธรรมดา']),
        question('rs-cf-sim-2', 'เหตุใดคู่ของผู้ใช้ u1 กับ u5 ที่เคยให้คะแนนคอร์สร่วมกันเพียงแค่คอร์สเดียว (u1 ให้ 4 ดาว, u5 ให้ 5 ดาว) จึงได้ค่า Cosine Similarity สูงถึง 1.0000?',
          ['เพราะทั้งคู่เป็นพี่น้องกัน', 'เพราะระบบคำนวณผิดพลาด', 'เพราะเวกเตอร์ 1 มิติที่มีค่าเป็นบวกทั้งคู่ จะชี้ไปในแนวเส้นตรงเดียวกันเสมอ ทำให้มุมระหว่างเวกเตอร์เป็น 0 องศา (cos(0) = 1)', 'เพราะเลข 4 กับ 5 มีค่าเท่ากันในทางคอมพิวเตอร์'],
          2,
          'ในมิติเดียว ตัวเลขบวกใดๆ เช่น 4 และ 5 คือเวกเตอร์ที่ทับอยู่บนแกนเดียวกัน มุมระหว่างกันจึงเป็น 0 องศา ส่งผลให้ Cosine = 1.0 ซึ่งเป็นความคล้ายหลอกตาจากข้อมูลที่น้อยเกินไป',
          ['ไม่เกี่ยวกับความสัมพันธ์ส่วนตัว', 'ระบบคำนวณถูกต้องตามสูตรคณิตศาสตร์', 'ถูกต้อง เวกเตอร์ 1 มิติที่เป็นบวกชี้ทิศเดียวกัน มุมเป็น 0 องศา จึงได้ Cosine = 1', '4 กับ 5 มีค่าต่างกัน']),
        question('rs-cf-sim-3', 'หากผู้ใช้ A เคยดูหนัง 10 เรื่อง และผู้ใช้ B เคยดูหนัง 15 เรื่อง โดยมีหนังที่ทั้งสองคนเคยดูเหมือนกัน 5 เรื่อง ค่า Jaccard Similarity ของคู่นี้คือเท่าใด?',
          ['5 / 25 = 0.20', '5 / 20 = 0.25 (เพราะ Union = 10 + 15 - 5 = 20)', '5 / 10 = 0.50', '15 / 10 = 1.50'],
          1,
          'สูตร Jaccard คือ Intersection / Union โดยที่ Union = |A| + |B| - |A ∩ B| = 10 + 15 - 5 = 20 ดังนั้น Jaccard = 5 / 20 = 0.25',
          ['ลืมลบส่วนที่ซ้ำออกจากตัวหาร', 'ถูกต้อง จุดตัดคือ 5 และยูเนียนคือ 20 จึงได้ 5/20 = 0.25', 'ตัวหารไม่ใช่ขนาดของเซต A', 'Jaccard ไม่มีทางเกิน 1.0']),
        question('rs-cf-sim-4', 'ในทางวิศวกรรม หากต้องการป้องกันไม่ให้คู่ที่มีประวัติร่วมกันแค่ 1 รายการได้คะแนนความคล้าย 1.0 จนกลายเป็นเพื่อนบ้านอันดับหนึ่ง วิธีการแก้ปัญหาที่ถูกต้องคืออะไร?',
          ['กำหนดจำนวนประเมินร่วมขั้นต่ำ (Support Threshold) หรือลดทอนน้ำหนักตามจำนวนหลักฐาน', 'ลบผู้ใช้ทั้งสองคนออกจากฐานข้อมูลทันที', 'เปลี่ยนคะแนน 5 ดาวให้เป็น 1 ดาวทั้งหมด', 'หยุดการทำงานของระบบแนะนำ'],
          0,
          'วิธีแก้มาตรฐานคือการกำหนดให้ต้องมี Co-rated Items อย่างน้อยตามเกณฑ์ (เช่น ≥ 3-5 ชิ้น) หรือใช้ Significance Weighting ลดทอนน้ำหนักลงตามปริมาณหลักฐาน',
          ['ถูกต้อง กำหนดเกณฑ์จำนวนร่วมขั้นต่ำหรือลดทอนน้ำหนัก', 'ไม่ควรลบผู้ใช้', 'การแก้คะแนนดาวทำให้ข้อมูลบิดเบือน', 'ไม่ควรหยุดระบบ'])
      ]
    },
    {
      id: 'recsys-cf-pearson',
      number: '05.4',
      title: 'ปรับไม้บรรทัดของแต่ละคน: Mean-Centering & Pearson Correlation',
      goal: 'เข้าใจปัญหา User Bias ในระดับคะแนนดาว, เทคนิค Mean-Centering และสูตร Pearson Correlation Coefficient',
      lead: 'มนุษย์แต่ละคนมี "ไม้บรรทัดในใจ" ไม่เท่ากัน คนใจดีให้ 4 ดาวเวลาเฉยๆ ขณะที่คนเคี่ยวให้ 3 ดาวเวลาประทับใจสุดขีด... ถ้าเราไม่ปรับไม้บรรทัด ระบบแนะนำจะพังทลายทันที!',
      body: `
        <div data-rs-demo="cf-centering"></div>

        <div class="rs-callout rs-callout-info">
          <h4>💡 ที่มาและปัญหาโลกจริง (The Intuition & Why)</h4>
          <p>ลองนึกถึงอาจารย์สองท่าน: อาจารย์ใจดี ตัดเกรดเฉลี่ยห้องที่ 85 คะแนน (ใครได้ 80 คือทำได้แย่กว่ามาตรฐาน) กับอาจารย์สุดโหด ตัดเกรดเฉลี่ยห้องที่ 45 คะแนน (ใครได้ 50 คือเก่งระดับหัวกะทิ)... ถ้าเราเอาคะแนน 80 กับ 50 มาเทียบกันตรงๆ เราจะเข้าใจผิดคิดว่าเด็กของอาจารย์ท่านแรกเก่งกว่า ทั้งที่จริงแล้วเด็กคนที่สองทำผลงานได้ <b>"โดดเด่นกว่าค่าเฉลี่ยของกลุ่มตนเอง"</b> อย่างมหาศาล!</p>
          <p>ในระบบแนะนำก็เช่นกัน ผู้ใช้แต่ละคนมีเกณฑ์การให้ดาวต่างกันอย่างสิ้นเชิง การใช้คะแนนดาวดิบจึงเป็นการเปรียบเทียบที่ไร้ความยุติธรรม ทางออกคือการทำ <b>Mean-Centering (การปรับจุดศูนย์กลาง)</b> เพื่อดูว่าสิ่งของชิ้นนั้น <i>"อยู่สูงหรือต่ำกว่ามาตรฐานปกติของคนคนนั้น"</i></p>
        </div>

        <h4>ถอดรหัสสูตรและความหมาย (Formulas & Concepts Decoded)</h4>
        <table>
          <thead>
            <tr><th>ขั้นตอน</th><th>สูตรคณิตศาสตร์</th><th>ความหมายเชิงสัญชาตญาณ</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><b>1. User Mean (<i>r̄ᵤ</i>)</b></td>
              <td><i>r̄ᵤ = (1 / |Iᵤ|) Σ_{i ∈ Iᵤ} rᵤᵢ</i></td>
              <td>ค่าเฉลี่ยคะแนนดาวทั้งหมดที่ผู้ใช้ <i>u</i> เคยประเมินจริงในอดีต (สะท้อนระดับความใจดี/ความเคี่ยวส่วนตัว)</td>
            </tr>
            <tr>
              <td><b>2. Mean-Centering</b></td>
              <td><i>r̃ᵤᵢ = rᵤᵢ - r̄ᵤ</i></td>
              <td>แปลงคะแนนดาวดิบให้กลายเป็น <b>"ส่วนเบี่ยงเบน"</b>:<br>• ค่าบวก (+) = ชอบมากกว่าปกติของตัวเอง<br>• ค่าลบ (-) = ผิดหวังกว่าปกติของตัวเอง</td>
            </tr>
            <tr>
              <td><b>3. Pearson Correlation (PCC)</b></td>
              <td><i>sim(u, v) = Σ (rᵤᵢ - r̄ᵤ)(rᵥᵢ - r̄ᵥ) / (√Σ(rᵤᵢ - r̄ᵤ)² √Σ(rᵥᵢ - r̄ᵥ)²)</i></td>
              <td>Cosine Similarity บนเวกเตอร์ที่ผ่านการ Mean-Centering แล้ว ทำให้ค่าความคล้ายมีขอบเขตตั้งแต่ <b>-1.0 (รสนิยมตรงข้ามกันสิ้นเชิง) ถึง +1.0 (รสนิยมตรงกันสมบูรณ์)</b></td>
            </tr>
          </tbody>
        </table>

        <h4>ตัวอย่างการแปลงคะแนนจริงในชุดฝึก</h4>
        <div class="rs-table-wrap">
          <table>
            <thead>
              <tr><th>ผู้ใช้</th><th>ดาวดิบ (A, B, C, D)</th><th>ค่าเฉลี่ยส่วนตัว (<i>r̄ᵤ</i>)</th><th>คะแนนหลัง Mean-Centering (<i>rᵤᵢ - r̄ᵤ</i>)</th><th>การอ่านความหมาย</th></tr>
            </thead>
            <tbody>
              <tr><td><b>u1 (ฟ้า)</b></td><td>5, 4, 1, 2</td><td>3.0 ดาว</td><td><b>+2, +1, -2, -1</b></td><td>ชอบ A มาก, ชอบ B ปานกลาง, เกลียด C, ไม่ชอบ D</td></tr>
              <tr><td><b>u2 (พลอย)</b></td><td>5, 4, 1, 4</td><td>3.8 ดาว</td><td><b>+1.2, +0.2, -2.8, +0.2</b></td><td>ชอบ A มาก, เฉยๆ กับ B, เกลียด C มาก, เฉยๆ กับ D</td></tr>
              <tr><td><b>u3 (นนท์)</b></td><td>1, 2, 5, 4</td><td>2.6 ดาว</td><td><b>-1.6, -0.6, +2.4, +1.4</b></td><td><b>ขั้วตรงข้าม!</b> เกลียด A และ B แต่รัก C และ D สุดหัวใจ</td></tr>
            </tbody>
          </table>
        </div>

        <h4>ผลลัพธ์ความคล้าย Pearson สัมพันธ์</h4>
        <ul>
          <li><b>sim(u1, u2) = +0.8269:</b> เป็นบวกสูงมาก แปลว่า u2 คือเพื่อนแท้ที่มีรสนิยมชอบและเกลียดตรงกับ u1</li>
          <li><b>sim(u1, u3) = -0.9695:</b> ติดลบเกือบ -1.0 เต็ม แปลว่า u3 คือ "คู่ตรงข้าม" (ของที่ u1 ชอบ u3 จะเกลียดเสมอ)</li>
        </ul>

        <h4>คู่มือการตัดสินใจทางวิศวกรรม (Engineering Decision Guide)</h4>
        <div class="rs-callout rs-callout-warning">
          <ul>
            <li><b>ทำไม Pearson ชนะ Raw Cosine ขาดลอย:</b> เพราะ Raw Cosine จะให้คะแนนเป็นบวกเสมอระหว่างคนสองคน (เพราะดาว 1-5 ไม่มีค่าลบ) ทำให้แยกไม่ออกระหว่าง "ชอบเหมือนกัน" กับ "เกลียดเหมือนกัน" แต่ Pearson มีจุดตัดที่ 0 ทำให้เห็นขั้วตรงข้ามได้อย่างชัดเจน</li>
            <li><b>การจัดการค่าติดลบ:</b> ในสูตร User-kNN ส่วนใหญ่ เราจะ <b>คัดเฉพาะเพื่อนบ้านที่มีค่าความคล้ายเป็นบวก (sim > 0)</b> เท่านั้น เพราะในทางปฏิบัติ การพยายามกลับด้านความชอบของคนที่มีรสนิยมตรงข้าม (Negative Neighbors) มักให้ผลลัพธ์ที่ไม่เสถียรและตีความยาก</li>
          </ul>
        </div>
      `,
      sources: [source(18, 'User mean centering'), source(20, 'Pearson correlation coefficient'), source(22, 'Negative correlations')],
      questions: [
        question('rs-cf-pcc-1', 'ประโยชน์ที่สำคัญที่สุดของการทำ Mean-Centering (การนำคะแนนดาวลบด้วยค่าเฉลี่ยของผู้ใช้แต่ละคน) คือข้อใด?',
          ['ช่วยประหยัดเนื้อที่ในการบันทึกข้อมูลลงฐานข้อมูล', 'ช่วยขจัดอคติส่วนบุคคล (User Bias) เช่น ผู้ใช้ที่ใจดีให้ 4-5 ดาวตลอด กับผู้ใช้ที่เคี่ยวให้ 1-2 ดาวตลอด ให้มีจุดศูนย์กลางเปรียบเทียบที่ยุติธรรม', 'ช่วยเปลี่ยนไฟล์เสียงให้กลายเป็นข้อความ', 'ช่วยให้โมเดลรันเร็วขึ้น 1,000 เท่า'],
          1,
          'Mean-Centering ปรับระดับมาตรฐานส่วนบุคคล เพื่อดูว่าสินค้านั้นอยู่สูงหรือต่ำกว่าเกณฑ์เฉลี่ยปกติของคนคนนั้น ทำให้เปรียบเทียบข้ามคนได้อย่างเป็นธรรม',
          ['ขนาดข้อมูลเท่าเดิม', 'ถูกต้อง ขจัดอคติเรื่องคนใจดีหรือคนเคี่ยวให้มีจุดอ้างอิงเดียวกัน', 'ไม่เกี่ยวกับไฟล์เสียง', 'ไม่ได้ทำให้เร็วขึ้นพันเท่า เป็นการคำนวณสถิติพื้นฐาน']),
        question('rs-cf-pcc-2', 'หากคำนวณค่าความคล้าย Pearson Correlation ระหว่างผู้ใช้ A และ B ได้เท่ากับ -0.95 สิ่งนี้มีความหมายในเชิงระบบแนะนำอย่างไร?',
          ['ทั้งสองคนมีรสนิยมตรงกันอย่างสมบูรณ์แบบ', 'ทั้งสองคนมีรสนิยมตรงข้ามกันอย่างสิ้นเชิง (ของที่ A ชอบ B มักจะเกลียด และของที่ A เกลียด B มักจะชอบ)', 'ข้อมูลของทั้งสองคนเกิดข้อผิดพลาดและต้องถูกลบทิ้ง', 'ทั้งสองคนไม่เคยดูหนังเรื่องเดียวกันเลย'],
          1,
          'Pearson Correlation มีค่าอยู่ในช่วง -1 ถึง +1 ค่า -0.95 แสดงถึงความสัมพันธ์แบบผกผันอย่างรุนแรง (รสนิยมตรงข้ามกันคนละขั้ว)',
          ['ค่า +1 ต่างหากที่ตรงกันสมบูรณ์', 'ถูกต้อง ค่าลบสูงมากสะท้อนรสนิยมตรงข้ามกันคนละขั้ว', 'ไม่ใช่ข้อผิดพลาด เป็นข้อมูลความสัมพันธ์จริง', 'หากไม่เคยดูเรื่องเดียวกันเลยจะคำนวณค่าไม่ได้']),
        question('rs-cf-pcc-3', 'ผู้ใช้คนหนึ่งให้คะแนนดาวในประวัติ 3 เรื่อง คือ 2 ดาว, 4 ดาว และ 3 ดาว หากทำการ Mean-Centering คะแนนที่ถูกแปลงแล้วของหนังเรื่องแรก (2 ดาว) จะมีค่าเท่าใด?',
          ['2.0', '+1.0', '-1.0 (เพราะค่าเฉลี่ยคือ (2+4+3)/3 = 3.0 ดังนั้น 2 - 3.0 = -1.0)', '0.0'],
          2,
          'ค่าเฉลี่ยของผู้ใช้ = (2 + 4 + 3) / 3 = 3.0 ดาว เมื่อนำคะแนนเรื่องแรก (2 ดาว) ลบด้วยค่าเฉลี่ย 3.0 จะได้ค่าส่วนเบี่ยงเบนเท่ากับ 2.0 - 3.0 = -1.0',
          ['2.0 คือคะแนนดิบเดิม', '+1.0 คือคะแนนของเรื่องที่สอง', 'ถูกต้อง ค่าเฉลี่ยคือ 3.0 คะแนนเบี่ยงเบนจึงเป็น 2 - 3 = -1.0', '0.0 คือคะแนนของเรื่องที่สาม']),
        question('rs-cf-pcc-4', 'ในขั้นตอนการคัดเลือกเพื่อนบ้านสำหรับ User-kNN ข้อใดคือนโยบายทางวิศวกรรมที่นิยมปฏิบัติมากที่สุดต่อค่าความคล้ายที่ติดลบ (Negative Similarities)?',
          ['นำเพื่อนบ้านที่ติดลบมาคูณสองเพื่อเพิ่มพลัง', 'กรองเพื่อนบ้านที่มีค่าความคล้ายติดลบทิ้งไป และเลือกเฉพาะเพื่อนบ้านที่มีค่าความคล้ายเป็นบวก (sim > 0) เท่านั้น', 'เปลี่ยนค่าลบให้เป็นค่าบวกทั้งหมดโดยใส่เครื่องหมายสัมบูรณ์', 'ปิดระบบแนะนำทันที'],
          1,
          'ในทางปฏิบัติ การนำ Negative Neighbors มาช่วยทำนายมักก่อให้เกิด Noise สูงและตีความพฤติกรรมมนุษย์ผิดพลาด จึงนิยมกรองทิ้งและใช้เฉพาะ Positive Neighbors (sim > 0)',
          ['ไม่ควรเพิ่มพลังให้ค่าลบ', 'ถูกต้อง กรองทิ้งและเลือกเฉพาะเพื่อนบ้านที่มีความคล้ายเป็นบวก', 'การใส่ Absolute จะทำให้คนรสนิยมตรงข้ามกลายเป็นเพื่อนแท้ ซึ่งผิดพลาด', 'ไม่จำเป็นต้องปิดระบบ'])
      ]
    },
    {
      id: 'recsys-cf-support',
      number: '05.5',
      title: 'ถ่วงน้ำหนักความน่าเชื่อถือของหลักฐาน: Significance Weighting',
      goal: 'เข้าใจปัญหา Overfitting จากจำนวนคู่ร่วมที่น้อย และวิธีการปรับลดทอนความคล้ายด้วย Significance Weighting (Support)',
      lead: 'ถ้ามีคนแปลกหน้าคนหนึ่งบังเอิญชอบหนังเรื่องเดียวกับคุณ คุณจะกล้าเชื่อคำแนะนำของเขาทันทีเลยหรือไม่? ระบบแนะนำที่ดีต้องแยกแยะ "ความบังเอิญ" ออกจาก "หลักฐานที่แน่นหนา"',
      body: `
        <div data-rs-demo="cf-support"></div>

        <div class="rs-callout rs-callout-info">
          <h4>💡 ที่มาและปัญหาโลกจริง (The Intuition & Why)</h4>
          <p>ในบทเรียนก่อนหน้า เราเห็นว่าผู้ใช้ u4 มีค่า Pearson กับ u1 เท่ากับ <b>0.8889</b> (ร่วมกัน 3 คอร์ส) ขณะที่ u2 มีค่า Pearson เท่ากับ <b>0.8269</b> (ร่วมกัน 4 คอร์ส)... หากคอมพิวเตอร์เปรียบเทียบตัวเลขทศนิยมตรงๆ u4 จะถูกเลือกเป็นเพื่อนบ้านอันดับ 1 เหนือ u2 ทันที!</p>
          <p>แต่นี่คือหลุมพรางทางสถิติ! ยิ่งมีสินค้าที่ประเมินร่วมกันน้อยชิ้น โอกาสที่จะบังเอิญได้ค่าความคล้ายสูงๆ ก็ยิ่งมีมาก ในทางวิศวกรรม เราจึงต้องมีกลไก <b>Significance Weighting (การถ่วงน้ำหนักตามปริมาณหลักฐาน)</b> เพื่อลงโทษคู่ที่มีจำนวนสินค้าประเมินร่วมกันต่ำกว่าเกณฑ์ความน่าเชื่อถือ</p>
        </div>

        <h4>ถอดรหัสสูตรและความหมาย (Formulas & Concepts Decoded)</h4>
        <table>
          <thead>
            <tr><th>ตัวแปร / สูตร</th><th>ชื่อเรียก</th><th>บทบาทและการทำงาน</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><b>|Iᵤ ∩ Iᵥ|</b> หรือ <b><i>n</i></b></td>
              <td>Co-rated Support</td>
              <td>จำนวนสินค้าทั้งหมดที่ผู้ใช้ทั้งสองคนเคยประเมินร่วมกันจริงในชุดข้อมูลฝึก</td>
            </tr>
            <tr>
              <td><b><i>β</i> (Beta)</b></td>
              <td>Support Threshold</td>
              <td>ขีดจำกัดความน่าเชื่อถือ (Hyperparameter) เช่น ตั้งไว้ที่ <i>β</i> = 4 หมายถึง "ต้องมีหลักฐานร่วมกันอย่างน้อย 4 ชิ้น จึงจะเชื่อมั่นความคล้ายได้ 100%"</td>
            </tr>
            <tr>
              <td><b><i>sim′(u, v)</i></b></td>
              <td>Shrunk Similarity</td>
              <td>สูตรการลดทอนน้ำหนักความคล้าย:<br>
                <i>sim′(u, v) = sim(u, v) × (min(|Iᵤ ∩ Iᵥ|, β) / β)</i><br>
                ถ้ามีของร่วมกันถึง <i>β</i> ตัวคูณจะเป็น 1.0 (ไม่ลดทอน); ถ้ามีของร่วมกันน้อยกว่า <i>β</i> ค่าความคล้ายจะถูกหดสั้นลงเข้าใกล้ 0
              </td>
            </tr>
          </tbody>
        </table>

        <h4>การคำนวณจริงเมื่อกำหนดค่าขีดจำกัด <i>β</i> = 4</h4>
        <div class="rs-table-wrap">
          <table>
            <thead>
              <tr><th>คู่เปรียบเทียบ</th><th>ความคล้ายดิบ (PCC)</th><th>จำนวนที่ประเมินร่วม (<i>n</i>)</th><th>ตัวคูณลดทอน (min(<i>n</i>, 4) / 4)</th><th>ความคล้ายหลังลดทอน (<i>sim′</i>)</th><th>อันดับเพื่อนบ้าน</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><b>u1 กับ u2</b></td>
                <td>0.8269</td>
                <td><b>4 คอร์ส</b></td>
                <td>4 / 4 = <b>1.0000</b> (เต็ม)</td>
                <td>0.8269 × 1.0 = <b>0.8269</b></td>
                <td><b>อันดับ 1 (ขึ้นนำ!)</b></td>
              </tr>
              <tr>
                <td><b>u1 กับ u4</b></td>
                <td><b>0.8889</b></td>
                <td><b>3 คอร์ส</b></td>
                <td>3 / 4 = <b>0.7500</b></td>
                <td>0.8889 × 0.75 = <b>0.6667</b></td>
                <td><b>อันดับ 2 (ถูกปรับลด)</b></td>
              </tr>
            </tbody>
          </table>
        </div>

        <p><b>ผลลัพธ์ที่เปลี่ยนไป:</b> ก่อนลดทอน u4 นำ u2... แต่หลังใช้ Significance Weighting ลำดับสลับกลับมาถูกต้องตามสามัญสำนึก โดย u2 ขึ้นนำเป็นเพื่อนบ้านอันดับหนึ่ง เพราะมีหลักฐานที่หนักแน่นและเสถียรกว่าอย่างแท้จริง</p>

        <h4>คู่มือการตัดสินใจทางวิศวกรรม (Engineering Decision Guide)</h4>
        <div class="rs-callout rs-callout-warning">
          <ul>
            <li><b>การเลือกค่า <i>β</i> ในโลกจริง:</b> ในระบบโปรดักชันจริง ค่า <i>β</i> มักถูกจูนผ่านชุด Validation Set โดยทั่วไปจะอยู่ระหว่าง 10 ถึง 50 สำหรับระบบที่มีข้อมูลหนาแน่น และ 3 ถึง 5 สำหรับระบบที่เพิ่งเริ่มต้น</li>
            <li><b>ผลกระทบของ <i>β</i>:</b> ถ้าตั้ง <i>β</i> สูงเกินไป คู่เกือบทั้งหมดจะถูกลดทอนจนค่าความคล้ายเหลือน้อยมาก; ถ้าตั้ง <i>β</i> ต่ำเกินไป (เช่น 1) ก็จะไม่มีผลในการคัดกรองความบังเอิญเลย</li>
          </ul>
        </div>
      `,
      sources: [source(24, 'Significance weighting'), source(25, 'สูตรและตัวอย่าง'), source(26, 'การเลือก Beta')],
      questions: [
        question('rs-cf-sup-1', 'เป้าหมายหลักของการนำเทคนิค Significance Weighting (Support Weighting) มาใช้ในระบบแนะนำคืออะไร?',
          ['เพื่อลดทอนค่าความคล้ายของคู่ที่มีจำนวนประเมินร่วมกันน้อย ป้องกันไม่ให้ความบังเอิญจากข้อมูลขนาดเล็กมาครอบงำการเลือกเพื่อนบ้าน', 'เพื่อเพิ่มความเร็วในการดาวน์โหลดหน้าเว็บ', 'เพื่อแปลงรูปภาพให้กลายเป็นเวกเตอร์', 'เพื่อลบคะแนนดาวของผู้ใช้ทิ้ง'],
          0,
          'Significance Weighting ทำหน้าที่ลดทอนความคล้ายของคู่ที่มีหลักฐานร่วมกันน้อย เพื่อป้องกันปัญหาความคล้ายสูงหลอกตาจากความบังเอิญ',
          ['ถูกต้อง ลดทอนความคล้ายของคู่ที่มีหลักฐานน้อย ป้องกันความบังเอิญ', 'ไม่เกี่ยวกับการดาวน์โหลดเว็บ', 'ไม่เกี่ยวกับรูปภาพ', 'ไม่ได้ลบคะแนนดาว']),
        question('rs-cf-sup-2', 'หากตั้งค่าขีดจำกัดความน่าเชื่อถือ β = 5 และมีผู้ใช้สองคนที่มีค่า Pearson Correlation ดิบ = 0.90 แต่มีประวัติประเมินร่วมกันเพียง 2 ชิ้น ค่าความคล้ายหลังลดทอน (sim′) จะมีค่าเท่าใด?',
          ['0.90 (เท่าเดิม)', '0.90 × (2 / 5) = 0.36', '0.90 × 2 = 1.80', '0.00'],
          1,
          'ตัวคูณลดทอนคือ min(n, β) / β = 2 / 5 = 0.40 ดังนั้นค่าความคล้ายหลังลดทอน = 0.90 × 0.40 = 0.36',
          ['ไม่ได้ลดทอน', 'ถูกต้อง 0.90 คูณด้วยอัตราส่วน 2/5 จะได้ 0.36', 'ตัวคูณไม่มีทางเกิน 1.0', 'ยังมีค่า ไม่ได้กลายเป็นศูนย์']),
        question('rs-cf-sup-3', 'หากผู้ใช้สองคนมีประวัติการประเมินสินค้าทับซ้อนร่วมกันถึง 10 ชิ้น ในขณะที่ระบบกำหนดค่า β = 4 ตัวคูณลดทอนของคู่นี้จะมีค่าเท่ากับเท่าใด?',
          ['10 / 4 = 2.5', '1.0 (เพราะ min(10, 4) / 4 = 4 / 4 = 1.0 ค่าความคล้ายจะไม่ถูกลดทอนเลย)', '0.4', '0.0'],
          1,
          'สูตรมีฟังก์ชัน min(|ร่วม|, β) ดังนั้น min(10, 4) = 4 ส่งผลให้ตัวคูณคือ 4 / 4 = 1.0 หมายถึงมีหลักฐานเกินเกณฑ์แล้ว จึงได้รับความน่าเชื่อถือเต็ม 100%',
          ['ตัวคูณถูกจำกัดสูงสุดไว้ที่ 1.0 ด้วยฟังก์ชัน min', 'ถูกต้อง มีหลักฐานเกินเกณฑ์ β แล้ว จึงได้ตัวคูณเต็ม 1.0 ไม่ถูกลดทอน', '0.4 คือส่วนกลับ', 'ไม่ใช่ 0.0']),
        question('rs-cf-sup-4', 'ในมุมมองวิศวกร หากระบบของเรามีข้อมูลเบาบางมาก (Extreme Sparsity) การตั้งค่า β สูงจนเกินไป (เช่น β = 100) จะส่งผลเสียอย่างไร?',
          ['ทำให้เซิร์ฟเวอร์ระเบิด', 'ทำให้ค่าความคล้ายของคู่เกือบทั้งหมดถูกกดลงจนเกือบเป็นศูนย์ ส่งผลให้ระบบหาเพื่อนบ้านที่มีน้ำหนักเพียงพอไม่เจอเลย', 'ทำให้คะแนนดาวกลายเป็นลบทั้งหมด', 'ไม่มีผลเสียใดๆ ยิ่งสูงยิ่งดีเสมอ'],
          1,
          'หากตั้ง β สูงเกินไปในระบบที่ข้อมูลเบาบาง ค่าความคล้ายแทบทุกคู่จะถูกหดจนเหลือใกล้ศูนย์ ทำให้ระบบเกิดอาการล้มเหลวในการหาเพื่อนบ้าน (No Neighbors Found)',
          ['เซิร์ฟเวอร์ไม่ระเบิด', 'ถูกต้อง ความคล้ายถูกกดจนเกือบศูนย์จนระบบหาเพื่อนบ้านที่มีนัยสำคัญไม่เจอ', 'ความคล้ายที่ลดทอนไม่ได้ทำให้ดาวกลายเป็นลบ', 'การตั้งพารามิเตอร์สูงเกินไปมีข้อเสียเสมอ'])
      ]
    },
    {
      id: 'recsys-cf-user-knn',
      number: '05.6',
      title: 'หาเพื่อนรสนิยมตรงกัน: User-kNN Prediction Formula',
      goal: 'เข้าใจขั้นตอนการคำนวณทำนายคะแนนด้วย User-kNN แบบถ่วงน้ำหนักส่วนเบี่ยงเบน (Deviation from Mean)',
      lead: 'เมื่อเราคัดเลือกเพื่อนบ้านที่มีรสนิยมคล้ายเราที่สุดมาได้ k คนแล้ว คำถามคือ เราจะนำความคิดเห็นของเพื่อนๆ เหล่านี้มารวมกันเป็นตัวเลขทำนายดาวได้อย่างไร?',
      body: `
        <div data-rs-demo="cf-user"></div>

        <div class="rs-callout rs-callout-info">
          <h4>💡 ที่มาและปัญหาโลกจริง (The Intuition & Why)</h4>
          <p>สมมุติว่าเพื่อนสนิทของคุณบอกว่า: <i>"หนังเรื่องนี้ให้ 4 ดาว!"</i>... คำถามคือคุณควรคาดหวังว่าหนังเรื่องนี้จะได้ 4 ดาวตามเพื่อนไหม?</p>
          <p>คำตอบคือ <b>ไม่จำเป็น!</b> ถ้าเพื่อนของคุณเป็นคนใจดีมากที่ปกติให้หนังทุกเรื่อง 4.5 ดาวขึ้นไป การที่เขาให้เรื่องนี้แค่ 4 ดาว แสดงว่าเขา <b>"ผิดหวังกว่าปกติ (-0.5)"</b> ดังนั้น หากคุณเป็นคนเคี่ยวที่ให้คะแนนเฉลี่ยแค่ 3.0 ดาว หนังเรื่องนี้สำหรับคุณอาจมีค่าแค่ 2.5 ดาวเท่านั้น!</p>
          <p>นี่คือหัวใจของสูตร <b>User-kNN แบบ Normalized Deviation</b>: เราไม่ยืมตัวเลขดาวดิบของเพื่อนมา แต่เรายืม <b>"ความรู้สึกเหนือหรือต่ำกว่าปกติของเพื่อน"</b> มาบวกเข้ากับฐานปกติของเราเอง</p>
        </div>

        <h4>ถอดรหัสสูตรคณิตศาสตร์ User-kNN</h4>
        <div class="rs-callout rs-callout-info">
          <p style="font-size: 1.15rem; text-align: center;">
            <b><i>r̂ᵤᵢ = r̄ᵤ + ( Σ_{v ∈ N_k(u; i)} sim′(u, v) × (rᵥᵢ - r̄ᵥ) ) / ( Σ_{v ∈ N_k(u; i)} |sim′(u, v)| )</i></b>
          </p>
        </div>

        <table>
          <thead>
            <tr><th>ชิ้นส่วนของสูตร</th><th>ชื่อเรียก</th><th>หน้าที่การทำงาน</th></tr>
          </thead>
          <tbody>
            <tr><td><b><i>r̄ᵤ</i></b></td><td>ฐานคะแนนของผู้ใช้เป้าหมาย</td><td>จุดตั้งต้นความใจดี/ความเคี่ยวของตัวเราเอง (ในตัวอย่าง u1 มีค่าเฉลี่ย = 3.0 ดาว)</td></tr>
            <tr><td><b><i>N_k(u; i)</i></b></td><td>เซตเพื่อนบ้าน <i>k</i> คน</td><td>คัดเลือกเพื่อนที่คล้ายที่สุด <i>k</i> คน <b>ที่มีประเมินสินค้า <i>i</i> แล้ว</b> และมี <i>sim′ > 0</i></td></tr>
            <tr><td><b><i>rᵥᵢ - r̄ᵥ</i></b></td><td>ส่วนเบี่ยงเบนของเพื่อน</td><td>เพื่อน <i>v</i> รู้สึกว่าสินค้า <i>i</i> ดีหรือแย่กว่าปกติของเขาเท่าไร (หักล้างนิสัยเพื่อนออก)</td></tr>
            <tr><td><b><i>sim′(u, v)</i></b></td><td>น้ำหนักความคล้าย</td><td>เพื่อนคนที่คล้ายเรามากกว่า เสียงของเขาจะดังกว่าเพื่อนคนที่คล้ายน้อยกว่า</td></tr>
            <tr><td><b>ตัวหาร <i>Σ |sim′|</i></b></td><td>ผลรวมน้ำหนัก</td><td>ปรับสเกลเฉลี่ยถ่วงน้ำหนัก เพื่อไม่ให้คะแนนล้นเกินจริง</td></tr>
          </tbody>
        </table>

        <h4>เจาะลึกการคำนวณจริง: ทำนายคะแนนคอร์ส E ให้กับ u1 (เลือก <i>k</i> = 2)</h4>
        <ol>
          <li><b>คัดกรองเพื่อนที่มีคะแนนคอร์ส E:</b> u2 (ให้ 5 ดาว), u3 (ให้ 1 ดาว), u4 (ให้ 4 ดาว), u5 (ให้ 5 ดาว)</li>
          <li><b>เลือกเพื่อนที่ดีที่สุด <i>k</i> = 2 คน (sim′ บวกสูงสุด):</b>
            <ul>
              <li>อันดับ 1: <b>u2</b> (ความคล้าย <i>sim′</i> = 0.8269)</li>
              <li>อันดับ 2: <b>u4</b> (ความคล้าย <i>sim′</i> = 0.6667)</li>
            </ul>
          </li>
          <li><b>คำนวณส่วนเบี่ยงเบนของเพื่อน:</b>
            <ul>
              <li>u2 ให้คะแนน E = 5 ดาว (ค่าเฉลี่ย u2 คือ 3.8) → เบี่ยงเบน = 5 - 3.8 = <b>+1.2 ดาว</b></li>
              <li>u4 ให้คะแนน E = 4 ดาว (ค่าเฉลี่ย u4 คือ 3.0) → เบี่ยงเบน = 4 - 3.0 = <b>+1.0 ดาว</b></li>
            </ul>
          </li>
          <li><b>คำนวณเฉลี่ยถ่วงน้ำหนักส่วนเบี่ยงเบน:</b><br>
            ตัวเศษ = (0.8269 × 1.2) + (0.6667 × 1.0) = 0.9923 + 0.6667 = 1.6590<br>
            ตัวส่วน = 0.8269 + 0.6667 = 1.4936<br>
            ส่วนเบี่ยงเบนเฉลี่ย = 1.6590 / 1.4936 = <b>+1.1107 ดาว</b>
          </li>
          <li><b>บวกกลับเข้าสู่ฐานของ u1:</b><br>
            <i>r̂(u1, E)</i> = 3.0 + 1.1107 = <b>4.1107 ดาว</b>
          </li>
        </ol>

        <h4>คู่มือการตัดสินใจทางวิศวกรรม (Engineering Decision Guide)</h4>
        <div class="rs-callout rs-callout-warning">
          <ul>
            <li><b>การเลือกค่า <i>k</i>:</b> ถ้า <i>k</i> เล็กเกินไป (เช่น <i>k</i> = 1) คำทำนายจะแกว่งตามอารมณ์ของเพื่อนคนเดียว; ถ้า <i>k</i> ใหญ่เกินไป (เช่น <i>k</i> = 100) คำทำนายจะกลายเป็นแค่ค่าเฉลี่ยทั่วๆ ไป ในทางปฏิบัตินิยมตั้ง <i>k</i> ระหว่าง 20 ถึง 50</li>
            <li><b>นโยบายสำรอง (Fallback Policy):</b> หากผู้ใช้ไม่มีเพื่อนบ้านคนไหนเคยดูคอร์ส E เลยแม้แต่คนเดียว ระบบจะต้องถอยกลับไปใช้ค่าเฉลี่ยส่วนตัว <i>r̄ᵤ</i> หรือค่าเฉลี่ยของสินค้าทันทีโดยไม่เออเร่อ</li>
          </ul>
        </div>
      `,
      sources: [source(28, 'สูตร User-kNN'), source(30, 'การถ่วงน้ำหนักเบี่ยงเบน'), source(32, 'ตัวอย่างคำนวณละเอียด')],
      questions: [
        question('rs-cf-uknn-1', 'ในสูตร User-kNN เหตุใดเราจึงนำค่าความคล้ายไปคูณกับส่วนต่าง (rᵥᵢ - r̄ᵥ) แทนที่จะคูณกับคะแนนดาวดิบ rᵥᵢ ของเพื่อนตรงๆ?',
          ['เพื่อประหยัดหน่วยความจำ', 'เพราะเราต้องการดึงเฉพาะ "ความรู้สึกชอบเหนือหรือต่ำกว่าปกติของเพื่อน" มาใช้ โดยหักล้างนิสัยความใจดี/ความเคี่ยวของเพื่อนออกไปก่อน', 'เพราะสูตรคณิตศาสตร์บังคับให้ต้องลบเสมอ', 'เพื่อทำให้ตัวเลขติดลบ'],
          1,
          'การใช้ (rᵥᵢ - r̄ᵥ) คือการดึงสัญญาณความพึงพอใจสัมพัทธ์ของเพื่อนออกมา โดยไม่นำอคติความใจดีหรือเคี่ยวของเพื่อนมาปนเปื้อน',
          ['ไม่เกี่ยวกับหน่วยความจำ', 'ถูกต้อง ดึงเฉพาะส่วนที่เพื่อนชอบเหนือหรือต่ำกว่าปกติของเขา โดยตัดอคติส่วนตัวเพื่อนออก', 'ไม่ใช่การบังคับไร้เหตุผล', 'ไม่ได้ต้องการให้ติดลบ']),
        question('rs-cf-uknn-2', 'จากตัวอย่างการคำนวณด้านบน หากค่าเฉลี่ยปกติของ u1 คือ 3.0 ดาว และเพื่อนบ้านลงความเห็นถ่วงน้ำหนักว่าคอร์ส E ดีกว่าปกติ +1.1107 ดาว คะแนนทำนายสุดท้าย r̂(u1, E) คือเท่าใด?',
          ['1.1107 ดาว', '4.1107 ดาว (เกิดจาก 3.0 + 1.1107)', '3.0 ดาว', '5.0 ดาวเสมอ'],
          1,
          'คะแนนทำนายสุดท้ายเกิดจาก ค่าเฉลี่ยส่วนตัวของเป้าหมาย บวกด้วย ส่วนเบี่ยงเบนถ่วงน้ำหนักจากเพื่อนบ้าน = 3.0 + 1.1107 = 4.1107 ดาว',
          ['1.1107 คือเฉพาะส่วนเบี่ยงเบน ยังไม่ได้บวกฐาน', 'ถูกต้อง นำฐานของ u1 (3.0) รวมกับแรงเชียร์ของเพื่อน (+1.1107) ได้ 4.1107 ดาว', '3.0 คือแค่ค่าฐานเดิม', 'ไม่ได้ถูกปัดเป็น 5.0 ทันที']),
        question('rs-cf-uknn-3', 'หากระบบกำหนดค่า k = 2 แต่มีเพื่อนบ้านที่รสนิยมคล้ายกับ u1 มากคนหนึ่ง ซึ่งไม่เคยดูคอร์ส E มาก่อนเลย เพื่อนคนนี้จะสามารถถูกนำมาคำนวณในสูตรทำนายคอร์ส E ได้หรือไม่?',
          ['ได้ เพราะเขาสนิทกับ u1 ที่สุด', 'ไม่ได้ เพราะเพื่อนคนนี้ไม่มีคะแนนของคอร์ส E ในประวัติ จึงไม่สามารถส่งสัญญาณความชอบของคอร์ส E ได้', 'ได้ โดยระบบจะเดาคะแนนให้เพื่อนคนนั้นแทน', 'ได้ แต่ต้องเสียค่าธรรมเนียม'],
          1,
          'เพื่อนบ้านที่จะถูกนำมาคิดใน N_k(u; i) ต้องเป็นเพื่อนที่มีคะแนนของสินค้าเป้าหมาย i แล้วเท่านั้น คนที่ไม่เคยดูย่อมบอกไม่ได้ว่าสินค้านั้นดีหรือไม่',
          ['ความสนิทไม่สามารถสร้างคะแนนที่ไม่มีอยู่จริงได้', 'ถูกต้อง เพื่อนที่นำมาคิดต้องมีคะแนนของสินค้าเป้าหมายแล้วเท่านั้น', 'ระบบจะไม่เดาคะแนนสุ่มสี่สุ่มห้า', 'ไม่มีค่าธรรมเนียม']),
        question('rs-cf-uknn-4', 'ข้อใดอธิบายผลกระทบของการเลือกค่า k (จำนวนเพื่อนบ้าน) ในอัลกอริทึม k-NN ได้ถูกต้องที่สุด?',
          ['ถ้า k เล็กเกินไป ผลทำนายจะอ่อนไหวตามอารมณ์เพื่อนคนเดียว แต่ถ้า k ใหญ่เกินไป ผลทำนายจะถูกกลืนกลายเป็นแค่ค่าเฉลี่ยทั่วไปของมวลชน', 'ค่า k ยิ่งมากเท่าไร ยิ่งแม่นยำ 100% เสมอโดยไม่มีข้อเสีย', 'ค่า k ต้องเป็นเลขคี่เสมอ มิฉะนั้นระบบจะล่ม', 'ค่า k ต้องเท่ากับจำนวนผู้ใช้ทั้งหมดในระบบ'],
          0,
          'การเลือก k คือการหาจุดสมดุล (Bias-Variance Trade-off): k น้อยไปจะแกว่งตามเสียงรบกวน (High Variance), k มากไปจะสูญเสียความเป็นส่วนบุคคล (High Bias)',
          ['ถูกต้อง k น้อยไปจะแกว่งตามรายคน k มากไปจะสูญเสีย Personalization กลายเป็นค่าเฉลี่ยทั่วไป', 'k มากเกินไปจะทำให้สูญเสียความเฉพาะตัว', 'k เป็นเลขคู่หรือคี่ก็ได้ใน Regression', 'ไม่จำเป็นต้องเท่ากับผู้ใช้ทั้งหมด'])
      ]
    },
    {
      id: 'recsys-cf-adjusted',
      number: '05.7',
      title: 'เทียบคอลัมน์สินค้าแต่ลบเฉลี่ยแถวคน: Adjusted Cosine Similarity',
      goal: 'เข้าใจเหตุผลและสูตรคณิตศาสตร์ของ Adjusted Cosine Similarity ในการวัดความคล้ายระหว่างสินค้าของ Item-based CF',
      lead: 'ถ้าเราจะวัดว่า "หนังเรื่อง A คล้ายกับหนังเรื่อง B หรือไม่" ทำไมเราถึงห้ามนำคะแนนคอลัมน์ A กับ B มาหา Cosine ตรงๆ? ทำไมสูตรจึงบังคับให้ต้องหักลบค่าเฉลี่ยของ "แถวผู้ใช้"?',
      body: `
        <div data-rs-demo="cf-item"></div>

        <div class="rs-callout rs-callout-info">
          <h4>💡 ที่มาและปัญหาโลกจริง (The Intuition & Why)</h4>
          <p>ใน Item-based CF เราต้องการวัดความคล้ายระหว่างคอลัมน์ของสินค้าสองชิ้น เช่น คอร์ส Python (A) กับคอร์ส Data Story (E)...</p>
          <p>ถ้าเราใช้สูตร Cosine ดิบระหว่างสองคอลัมน์ เราจะเจอปัญหาเดิมทันที: ผู้ใช้คนที่ให้คะแนนคอร์ส A และ E อาจเป็นคนใจดีที่กด 5 ดาวให้ทุกอย่างบนโลก หรืออาจเป็นคนเคี่ยวที่กด 2 ดาวให้ทุกอย่าง! คะแนนในคอลัมน์จึงไม่ได้สะท้อนความเชื่อมโยงของเนื้อหาสินค้า แต่ถูกปนเปื้อนด้วยอุปนิสัยของผู้ประเมินแต่ละแถว</p>
          <p>นักวิจัยระบบแนะนำจึงคิดค้น <b>Adjusted Cosine Similarity</b>: เป็นการวัดความคล้ายระหว่างคอลัมน์สินค้าสองคอลัมน์ แต่ทำการหักลบด้วย <b>"ค่าเฉลี่ยของผู้ใช้ในแต่ละแถว (<i>r̄ᵤ</i>)"</b> ก่อนคำนวณเสมอ!</p>
        </div>

        <h4>ถอดรหัสสูตร Adjusted Cosine Similarity</h4>
        <div class="rs-callout rs-callout-info">
          <p style="font-size: 1.15rem; text-align: center;">
            <b><i>sim(i, j) = Σ_{u ∈ U} (rᵤᵢ - r̄ᵤ)(rᵤⱼ - r̄ᵤ) / ( √Σ_{u ∈ U}(rᵤᵢ - r̄ᵤ)² √Σ_{u ∈ U}(rᵤⱼ - r̄ᵤ)² )</i></b>
          </p>
        </div>

        <table>
          <thead>
            <tr><th>จุดสังเกตสำคัญในสูตร</th><th>สิ่งที่สูตรทำ</th><th>เหตุผลทางวิศวกรรม</th></tr>
          </thead>
          <tbody>
            <tr><td><b>ตัวแปรที่นำมาลบคือ <i>r̄ᵤ</i></b></td><td>หักลบค่าเฉลี่ยของผู้ใช้ <i>u</i> (ลบตามแถว)</td><td><b>ไม่ใช่ <i>r̄ᵢ</i> (ค่าเฉลี่ยของสินค้า)!</b> เพราะความใจดีหรือเคี่ยวเป็นคุณลักษณะของ "คน" ไม่ใช่ของ "ของ"</td></tr>
            <tr><td><b>เซตผู้ใช้ร่วม <i>U</i></b></td><td>พิจารณาเฉพาะผู้ใช้ที่เคยประเมินทั้งสินค้า <i>i</i> และ <i>j</i></td><td>ตัดช่องว่างที่คนใดคนหนึ่งไม่เคยดูออกจากการคำนวณมุมเวกเตอร์</td></tr>
            <tr><td><b>ขอบเขตผลลัพธ์</b></td><td>อยู่ในช่วง -1.0 ถึง +1.0</td><td>+1.0 คือสินค้าสองชิ้นมีทิศทางคนชอบ/เกลียดคู่กันเสมอ, 0 คือไม่เกี่ยวข้องกัน, -1.0 คือสินค้าทดแทนที่คนชอบอันหนึ่งจะเกลียดอีกอันหนึ่ง</td></tr>
          </tbody>
        </table>

        <h4>ตัวอย่างการคำนวณ Adjusted Cosine: เทียบคอร์ส E กับคอร์ส A</h4>
        <p>มีผู้ใช้ที่เคยประเมินทั้งคอร์ส E และ A ร่วมกัน 3 คน คือ u2, u3, u4:</p>
        <ul>
          <li><b>u2 (เฉลี่ย 3.8):</b> ให้ E = 5 (+1.2), ให้ A = 5 (+1.2) → ทิศทางเดียวกัน (+)</li>
          <li><b>u3 (เฉลี่ย 2.6):</b> ให้ E = 1 (-1.6), ให้ A = 1 (-1.6) → ทิศทางเดียวกัน (+) (เกลียดทั้งคู่!)</li>
          <li><b>u4 (เฉลี่ย 3.0):</b> ให้ E = 4 (+1.0), ให้ A = 5 (+2.0) → ทิศทางเดียวกัน (+)</li>
        </ul>
        <p>จะเห็นว่าผู้ใช้ทั้ง 3 คนให้คะแนนคอร์ส E และ A ไปในทิศทางเดียวกันอย่างสมบูรณ์แบบ ส่งผลให้ค่า <b>Adjusted Cosine ระหว่าง E กับ A สูงถึง 0.9487</b> (และเมื่อถ่วงน้ำหนักด้วย Support 3/4 จะได้ <i>sim′</i> = 0.7115)</p>

        <h4>คู่มือการตัดสินใจทางวิศวกรรม (Engineering Decision Guide)</h4>
        <div class="rs-callout rs-callout-warning">
          <ul>
            <li><b>ความต่างระหว่าง Item-CF กับ Content-Based:</b> แม้จะเรียกว่า "Item Similarity" เหมือนกัน แต่ Adjusted Cosine ใน CF คำนวณจาก <i>"พฤติกรรมมนุษย์ในตาราง"</i> ไม่ได้อ่านชื่อวิชาหรือเนื้อหาเลย ขณะที่ Content-Based คำนวณจาก <i>"คุณลักษณะของสินค้า (TF-IDF/Embedding)"</i></li>
            <li><b>ข้อได้เปรียบ:</b> Adjusted Cosine สามารถจับคู่สินค้าที่อยู่คนละหมวดหมู่แต่มีคนชอบคู่กันได้ เช่น "เบียร์กับผ้าอ้อมเด็ก" ซึ่ง Content-Based ไม่มีทางค้นพบได้เลย</li>
          </ul>
        </div>
      `,
      sources: [source(34, 'Adjusted cosine formula'), source(35, 'การลบค่าเฉลี่ยแถว'), source(36, 'เปรียบเทียบกับ Pearson')],
      questions: [
        question('rs-cf-adj-1', 'ในการคำนวณ Adjusted Cosine Similarity ระหว่างสินค้าสองชิ้น ค่าเฉลี่ยที่ถูกนำมาหักลบในแต่ละพจน์คือค่าเฉลี่ยของสิ่งใด?',
          ['ค่าเฉลี่ยของสินค้าชิ้นนั้น (Item Mean: r̄ᵢ)', 'ค่าเฉลี่ยของผู้ใช้แต่ละคนที่ให้คะแนน (User Mean: r̄ᵤ)', 'ค่าเฉลี่ยของทั้งจักรวาล (Global Mean: μ)', 'เลขศูนย์เสมอ'],
          1,
          'Adjusted Cosine คำนวณความคล้ายระหว่างคอลัมน์สินค้า แต่หักลบด้วยค่าเฉลี่ยของผู้ใช้ในแต่ละแถว (r̄ᵤ) เพื่อขจัดอุปนิสัยคนใจดี/คนเคี่ยวออกไป',
          ['การลบ Item Mean จะกลายเป็น Pearson บนไอเท็ม ซึ่งไม่ขจัดอคติของคน', 'ถูกต้อง ลบด้วยค่าเฉลี่ยของผู้ใช้แต่ละคน (User Mean) ในแถวนั้น', 'ไม่ใช่ค่าเฉลี่ยรวมทั้งระบบ', 'ไม่ใช่เลขศูนย์']),
        question('rs-cf-adj-2', 'เหตุใดการคำนวณ Adjusted Cosine จึงช่วยให้ระบบค้นพบว่าสินค้าสองชิ้น "คล้ายกัน" ได้ แม้ว่าผู้ใช้คนหนึ่งจะให้ 1 ดาวกับทั้งสองชิ้นก็ตาม?',
          ['เพราะ 1 ดาวเป็นคะแนนที่ดี', 'เพราะระบบคำนวณผิดพลาด', 'เพราะเมื่อหักลบค่าเฉลี่ยแล้ว คะแนน 1 ดาวของทั้งสองชิ้นจะกลายเป็นค่าลบ (-) เหมือนกันทั้งคู่ ลบคูณลบจึงได้ผลคูณเป็นบวก (+) สะท้อนว่าผู้ใช้มีทัศนคติต่อสินค้าสองชิ้นไปในทิศทางเดียวกัน', 'เพราะระบบไม่สนใจคะแนน 1 ดาว'],
          2,
          'หากผู้ใช้เกลียดสินค้าทั้งสองชิ้นเหมือนกัน (ได้ค่าลบทั้งคู่) ผลคูณ (- × -) จะกลายเป็นบวก ซึ่งแสดงว่าสินค้าสองชิ้นนี้มีแนวโน้มถูกประเมินไปในทิศทางเดียวกัน',
          ['1 ดาวไม่ใช่คะแนนที่ดี', 'ระบบทำงานถูกต้องตามหลักคณิตศาสตร์เวกเตอร์', 'ถูกต้อง ลบคูณลบได้บวก สะท้อนว่ามีทิศทางความรู้สึกสอดคล้องกัน', 'ระบบสนใจทุกคะแนน']),
        question('rs-cf-adj-3', 'ความแตกต่างเชิงหลักการระหว่าง "Item Similarity ใน Collaborative Filtering" กับ "Item Similarity ใน Content-Based Filtering" คือข้อใด?',
          ['CF ดูจากรอยเท้าการให้คะแนนของผู้คนในตาราง ส่วน Content-Based ดูจากเนื้อหา คุณลักษณะ หรือคำบรรยายของสินค้า', 'CF ใช้ได้เฉพาะกับหนังสือ ส่วน Content-Based ใช้ได้เฉพาะกับภาพยนตร์', 'ทั้งสองวิธีเหมือนกันทุกประการ ไม่มีอะไรต่างกันเลย', 'CF ต้องใช้คนมานั่งจัดอันดับด้วยมือ'],
          0,
          'CF อาศัยรอยเท้าพฤติกรรมมนุษย์ (Interaction Data) ขณะที่ Content-Based อาศัยข้อมูลเนื้อหาสินค้า (Item Metadata)',
          ['ถูกต้อง CF ดูจากพฤติกรรมผู้คน ส่วน Content-Based ดูจากเนื้อหาและคำบรรยาย', 'ใช้ได้กับสินค้าทุกประเภททั้งสองระบบ', 'มีความแตกต่างกันในแหล่งข้อมูลตั้งต้น', 'CF คำนวณด้วยอัลกอริทึมอัตโนมัติ']),
        question('rs-cf-adj-4', 'หากสินค้าชิ้นที่ 1 และสินค้าชิ้นที่ 2 มีค่า Adjusted Cosine ติดลบใกล้เคียง -1.0 ในทางธุรกิจระบบแนะนำสิ่งนี้บอกอะไรเรา?',
          ['สินค้าสองชิ้นนี้เหมือนกันทุกประการ แนะนำแทนกันได้เลย', 'สินค้าสองชิ้นนี้มีลักษณะเป็นสินค้าทดแทนหรืออยู่ขั้วตรงข้าม คนที่ชอบชิ้นหนึ่งมักจะเกลียดอีกชิ้นหนึ่ง จึงไม่ควรนำมาแนะนำคู่กัน', 'ระบบแนะนำกำลังจะพัง', 'สินค้าทั้งสองชิ้นไม่มีใครเคยซื้อเลย'],
          1,
          'ค่าความคล้ายติดลบสะท้อนว่าสินค้ามีความสัมพันธ์แบบผกผัน (คนที่ชอบชิ้นหนึ่งมักเกลียดอีกชิ้นหนึ่ง) เช่น สินค้าขั้วตรงข้ามทางการเมือง จึงไม่ควรแนะนำร่วมกัน',
          ['ค่า +1.0 ต่างหากที่แนะนำคู่กันได้', 'ถูกต้อง สินค้าอยู่ขั้วตรงข้าม คนชอบอันหนึ่งมักเกลียดอีกอันหนึ่ง', 'ไม่ใช่สัญญาณว่าระบบจะพัง', 'มีคนซื้อทั้งคู่จึงคำนวณค่าได้'])
      ]
    },
    {
      id: 'recsys-cf-item-knn',
      number: '05.8',
      title: 'ระบบแนะนำระดับตำนานของ Amazon: Item-kNN Recommendation',
      goal: 'เข้าใจกลไกและขั้นตอนการทำนายคะแนนด้วย Item-kNN และความได้เปรียบทางวิศวกรรมที่ทำให้กลายเป็นมาตรฐานอุตสาหกรรม',
      lead: 'ในปี 2003 ทีมนักวิจัยของ Amazon ได้ตีพิมพ์เปเปอร์ระดับตำนาน "Amazon.com Recommendations: Item-to-Item Collaborative Filtering" ซึ่งเปลี่ยนโฉมหน้าวงการ E-Commerce ไปตลอดกาล...',
      body: `
        <div data-rs-demo="cf-item-predict"></div>

        <div class="rs-callout rs-callout-info">
          <h4>💡 ที่มาและปัญหาโลกจริง (The Intuition & Why)</h4>
          <p>ในยุคแรกเริ่ม ทุกคนพยายามทำ User-kNN (หาเพื่อนคน) แต่ Amazon พบปัญหาคอขวดมหาศาล: เว็บไซต์มีลูกค้าหลายสิบล้านคน และลูกค้าแต่ละคนเปลี่ยนรสนิยมได้ตลอดเวลา การค้นหาเพื่อนบ้านระหว่างคนนับล้านคนแบบ Real-time บนหน้าเว็บทำให้เซิร์ฟเวอร์ช้าจนแทบล่ม!</p>
          <p>Amazon จึงพลิกมุมมอง 180 องศา: <b>"แทนที่จะหาว่าใครเหมือนลูกค้า... ทำไมเราไม่หาว่าสินค้าชิ้นไหนคล้ายกับสินค้าที่ลูกค้าเคยซื้อล่ะ?"</b></p>
          <ul>
            <li>สินค้ามีจำนวนคงที่กว่า และรสนิยมความสัมพันธ์ระหว่างของ (เช่น หนัง Matrix ภาค 1 กับ ภาค 2) ไม่เปลี่ยนไปตามอารมณ์</li>
            <li>เราสามารถคำนวณตารางความคล้ายระหว่างสินค้า (Item-Item Similarity Matrix) ทิ้งไว้ล่วงหน้าตอนกลางคืน (Offline Pre-computation) ได้อย่างสบายๆ</li>
            <li>เมื่อลูกค้าเปิดหน้าเว็บ ระบบเพียงแค่อ่านแคชและบวกเลขในเสี้ยววินาที (Online Serving < 10 ms)</li>
          </ul>
        </div>

        <h4>สูตรการทำนายคะแนนด้วย Item-kNN</h4>
        <div class="rs-callout rs-callout-info">
          <p style="font-size: 1.15rem; text-align: center;">
            <b><i>r̂ᵤᵢ = r̄ᵤ + ( Σ_{j ∈ N_k(i; u)} sim′(i, j) × (rᵤⱼ - r̄ᵤ) ) / ( Σ_{j ∈ N_k(i; u)} |sim′(i, j)| )</i></b>
          </p>
        </div>

        <table>
          <thead>
            <tr><th>ส่วนประกอบสูตร</th><th>ความหมายใน Item-kNN</th><th>ข้อแตกต่างจาก User-kNN</th></tr>
          </thead>
          <tbody>
            <tr><td><b><i>N_k(i; u)</i></b></td><td>คัดเลือกสินค้า <i>k</i> ชิ้นที่คล้ายกับสินค้าเป้าหมาย <i>i</i> ที่สุด <b>ที่ผู้ใช้ <i>u</i> คนนี้เคยให้คะแนนแล้ว</b></td><td>ใน User-kNN เราหาเพื่อน <i>คน</i> แต่ใน Item-kNN เราหาเพื่อน <i>ของ</i> จากประวัติตัวเราเอง</td></tr>
            <tr><td><b><i>rᵤⱼ - r̄ᵤ</i></b></td><td>ผู้ใช้ <i>u</i> เคยชอบสินค้าเพื่อนบ้าน <i>j</i> มากกว่าปกติของตัวเองเท่าไร</td><td><b>สังเกตให้ดี:</b> ข้อมูลที่นำมาคิดมาจาก <b>ประวัติของตัวเราเองคนเดียวล้วนๆ!</b> ไม่ได้ยืมคะแนนของคนอื่นมาคำนวณเลย</td></tr>
            <tr><td><b><i>sim′(i, j)</i></b></td><td>ความคล้ายคลึงระหว่างสินค้า <i>i</i> และ <i>j</i> (จาก Adjusted Cosine)</td><td>คำนวณล่วงหน้าเก็บในแคชได้ (Offline)</td></tr>
          </tbody>
        </table>

        <h4>ตัวอย่างการทำนาย u1 กับคอร์ส E ด้วย Item-kNN (เลือก <i>k</i> = 2)</h4>
        <ol>
          <li><b>หาสินค้าที่คล้ายกับคอร์ส E ที่สุด (จาก Adjusted Cosine หลังถ่วงน้ำหนัก):</b>
            <ul>
              <li>คอร์ส A (Python): <i>sim′</i> = 0.7115</li>
              <li>คอร์ส B (SQL): <i>sim′</i> = 0.7115</li>
            </ul>
          </li>
          <li><b>ตรวจสอบประวัติของ u1 ต่อนายแบบ A และ B:</b>
            <ul>
              <li>u1 เคยให้คอร์ส A = 5 ดาว (สูงกว่าปกติของ u1 อยู่ +2.0 ดาว)</li>
              <li>u1 เคยให้คอร์ส B = 4 ดาว (สูงกว่าปกติของ u1 อยู่ +1.0 ดาว)</li>
            </ul>
          </li>
          <li><b>รวมพลังความชอบ:</b><br>
            ส่วนเบี่ยงเบนเฉลี่ย = (0.7115 × 2.0 + 0.7115 × 1.0) / (0.7115 + 0.7115) = 3.0 / 2 = <b>+1.5 ดาว</b>
          </li>
          <li><b>บวกเข้ากับฐาน u1 (3.0 ดาว):</b><br>
            <i>r̂(u1, E)</i> = 3.0 + 1.5 = <b>4.5000 ดาว</b>
          </li>
        </ol>

        <h4>คู่มือการตัดสินใจทางวิศวกรรม (Engineering Decision Guide)</h4>
        <div class="rs-callout rs-callout-warning">
          <ul>
            <li><b>Explainability (ความสามารถในการอธิบายผล):</b> Item-kNN ชนะ User-kNN ขาดลอยในจุดนี้ เพราะระบบสามารถสร้างกล่องข้อความอธิบายให้ผู้ใช้เข้าใจได้ทันทีว่า: <i>"แนะนำคอร์ส Data Storytelling ให้คุณ เพราะคุณเคยเรียน Python และ SQL ได้คะแนนยอดเยี่ยม"</i> ซึ่งช่วยเพิ่มความไว้วางใจและยอดคลิกได้อย่างมหาศาล</li>
            <li><b>Scalability:</b> การแยกระหว่าง Offline Pre-computation (คำนวณความคล้ายสินค้า) กับ Online Inference (ดึงประวัติผู้ใช้มาคูณ) ทำให้รองรับผู้ใช้พร้อมกันนับสิบล้านคนได้โดยเซิร์ฟเวอร์ไม่ล่ม</li>
          </ul>
        </div>
      `,
      sources: [source(38, 'Item-kNN formula'), source(39, 'Offline pre-computation'), source(40, 'Amazon case study')],
      questions: [
        question('rs-cf-iknn-1', 'เหตุผลทางวิศวกรรมซอฟต์แวร์ที่สำคัญที่สุดที่ทำให้ Item-kNN ได้รับความนิยมในระบบ E-Commerce ขนาดใหญ่มากกว่า User-kNN คือข้อใด?',
          ['Item-kNN ไม่จำเป็นต้องเขียนโค้ด', 'ความคล้ายระหว่างสินค้า (Item Similarity) มีความเสถียรมากกว่า สามารถคำนวณล่วงหน้าแบบ Offline ทิ้งไว้ได้ ทำให้การตอบสนองผู้ใช้หน้าเว็บเร็วระดับมิลลิวินาที', 'Item-kNN ไม่ต้องใช้ฐานข้อมูล', 'Item-kNN แนะนำสินค้าได้ถูกต้อง 100% เสมอ'],
          1,
          'Item Similarity มีความเสถียรและเปลี่ยนแปลงช้า จึงสามารถคำนวณเก็บในแคชล่วงหน้าแบบ Offline ได้ ตอนให้บริการจริง (Serving) จึงทำได้เร็วระดับเสี้ยววินาที',
          ['ต้องเขียนโค้ดตามปกติ', 'ถูกต้อง ความคล้ายสินค้าคงที่กว่า สามารถคำนวณออฟไลน์และแคชไว้ล่วงหน้าเพื่อความเร็วระดับมิลลิวินาที', 'ต้องใช้ฐานข้อมูล', 'ไม่มีโมเดลใดทำนายถูกร้อยเปอร์เซ็นต์เสมอ']),
        question('rs-cf-iknn-2', 'จุดเด่นด้าน "ความสามารถในการอธิบายเหตุผล (Explainability)" ของ Item-kNN เหนือกว่า User-kNN อย่างไร?',
          ['Item-kNN สามารถบอกชื่อ-นามสกุล และที่อยู่ของเพื่อนบ้านให้ผู้ใช้ทราบได้', 'Item-kNN สามารถอธิบายอย่างโปร่งใสได้ว่า "แนะนำสินค้านี้ เพราะคุณเคยชอบสินค้า A และ B ในอดีต" โดยไม่ต้องเปิดเผยข้อมูลส่วนบุคคลของผู้อื่น', 'Item-kNN ส่งอีเมลอธิบายทุกครั้งที่แนะนำ', 'Item-kNN ไม่มีจุดเด่นด้านนี้เลย'],
          1,
          'Item-kNN อ้างอิงจากประวัติของตัวผู้ใช้เอง จึงสร้างข้อความอธิบายที่น่าเชื่อถือได้ง่าย ("Because you watched X...") โดยไม่ละเมิดความเป็นส่วนตัวของผู้อื่น',
          ['การเปิดเผยข้อมูลส่วนบุคคลผู้อื่นเป็นการละเมิดความปลอดภัยและความเป็นส่วนตัว', 'ถูกต้อง อธิบายได้ชัดเจนว่าแนะนำเพราะผู้ใช้เคยชอบสินค้าชิ้นใดในอดีต', 'ไม่ได้ส่งอีเมลพร่ำเพรื่อ', 'Item-kNN มีชื่อเสียงโดดเด่นมากเรื่อง Explainability']),
        question('rs-cf-iknn-3', 'ในการคำนวณทำนายคะแนนของ Item-kNN ข้อมูลคะแนนดาวที่นำมาคำนวณในขั้นตอนสุดท้าย มาจากประวัติของใคร?',
          ['มาจากผู้ใช้ทุกคนในระบบเฉลี่ยรวมกัน', 'มาจากเพื่อนบ้านคนสนิทที่อยู่แถวบ้าน', 'มาจากประวัติคะแนนของผู้ใช้เป้าหมายคนนั้นเพียงคนเดียว (บนสินค้าเพื่อนบ้านที่คล้ายกัน)', 'มาจากผู้ดูแลระบบ (Admin)'],
          2,
          'หลังจากได้ค่าความคล้ายระหว่างสินค้ามาแล้ว ตัวเลขคะแนนดาวที่นำมาถ่วงน้ำหนักทำนายจะดึงมาจากประวัติของตัวผู้ใช้เป้าหมายเองล้วนๆ',
          ['ไม่ใช่การเฉลี่ยทุกคนในขั้นนี้', 'ไม่ใช่เพื่อนแถวบ้าน', 'ถูกต้อง ดึงมาจากประวัติความชอบของผู้ใช้เป้าหมายคนนั้นคนเดียว', 'ไม่ใช่ Admin']),
        question('rs-cf-iknn-4', 'จากตัวอย่างการคำนวณ คอร์ส A และ B มีความคล้ายกับคอร์ส E เท่ากันที่ 0.7115 และ u1 เคยชอบ A เกินเฉลี่ย +2.0 ชอบ B เกินเฉลี่ย +1.0 ค่าเฉลี่ยส่วนเบี่ยงเบนถ่วงน้ำหนักจะได้เท่าใด?',
          ['+3.0 ดาว', '+1.5 ดาว (เกิดจาก (2.0 + 1.0) / 2)', '+0.5 ดาว', '+4.5 ดาว'],
          1,
          'เมื่อน้ำหนักความคล้ายของทั้งสองคอร์สเท่ากัน การถ่วงน้ำหนักจะเทียบเท่ากับการหาค่าเฉลี่ยเลขคณิตธรรมดา: (2.0 + 1.0) / 2 = +1.5 ดาว',
          ['+3.0 คือผลรวม ยังไม่ได้หาร', 'ถูกต้อง น้ำหนักเท่ากัน ค่าเฉลี่ยส่วนต่างจึงเป็น (2.0 + 1.0)/2 = +1.5 ดาว', '+0.5 น้อยเกินไป', '+4.5 คือคะแนนสุดท้ายหลังบวกฐาน 3.0 แล้ว'])
      ]
    },
    {
      id: 'recsys-cf-implicit',
      number: '05.9',
      title: 'เมื่อไม่มีคะแนนดาว: Implicit Item-kNN จากคลิกและการซื้อ',
      goal: 'เข้าใจการประยุกต์ใช้ Item-kNN บนข้อมูล Implicit Feedback (คลิก, สตรีม, ซื้อ) และการสร้างคะแนนจัดอันดับ Ranking Score',
      lead: 'บน YouTube คุณเคยกดให้ 1–5 ดาวกับคลิปวิดีโอไหม? บน TikTok คุณเคยกดให้คะแนนดาวไหม? เกือบ 99% ของแอปพลิเคชันยุคใหม่ไม่มีระบบดาว มีเพียงแค่ "ดูซ้ำ" หรือ "เลื่อนผ่าน"...',
      body: `
        <div data-rs-demo="cf-implicit"></div>

        <div class="rs-callout rs-callout-info">
          <h4>💡 ที่มาและปัญหาโลกจริง (The Intuition & Why)</h4>
          <p>ในบทเรียนก่อนๆ เราเรียนเรื่องการทำนายตัวเลขดาว (Rating Prediction) แต่นั่นคือโลกในอุดมคติ! ในความเป็นจริง ผู้ใช้น้อยกว่า 1% จะสละเวลามากดดาวให้เรา ข้อมูลจริงที่ระบบเก็บได้ทุกวินาทีคือ <b>รอยเท้าพฤติกรรมทางอ้อม (Implicit Feedback)</b> เช่น การคลิกชม, เวลาที่ดู (Watch Time), หรือการกดเพิ่มลงตะกร้า</p>
          <p>เมื่อไม่มีดาวให้ลบค่าเฉลี่ย เราจะปรับ Item-kNN อย่างไร? คำตอบคือการเปลี่ยนจากการ "ทายดาว" มาเป็น <b>"การสะสมแต้มความคล้ายเพื่อจัดอันดับ Top-K (Ranking Score)"</b></p>
        </div>

        <h4>ถอดรหัสขั้นตอน Implicit Item-kNN</h4>
        <ol>
          <li><b>แปลงข้อมูลเป็นตารางการกระทำ (Binary Matrix):</b><br>
            กำหนดเงื่อนไข เช่น ถ้ามีปฏิสัมพันธ์ (ซื้อ/ดูจบ/ดาว ≥ 4) กำหนดให้ <i>xᵤᵢ = 1</i>; หากยังไม่มีปฏิสัมพันธ์ กำหนดให้ <i>xᵤᵢ = 0</i> (ย้ำอีกครั้ง: 0 หมายถึงยังไม่เคยดู ไม่ได้แปลว่าเกลียด!)
          </li>
          <li><b>คำนวณความคล้ายระหว่างสินค้าแบบ Binary Cosine (Co-occurrence Cosine):</b><br>
            วัดว่าสินค้าสองชิ้นมักถูกซื้อหรือถูกดูคู่กันบ่อยแค่ไหน:<br>
            <div style="text-align: center; margin: 8px 0;">
              <i>sim(i, j) = |Uᵢ ∩ Uⱼ| / ( √|Uᵢ| × √|Uⱼ| )</i>
            </div>
            โดย <i>|Uᵢ|</i> คือจำนวนคนที่เคยมีปฏิสัมพันธ์กับสินค้า <i>i</i> และ <i>|Uᵢ ∩ Uⱼ|</i> คือจำนวนคนที่เคยมีปฏิสัมพันธ์กับทั้งสองชิ้นร่วมกัน
          </li>
          <li><b>คำนวณคะแนนสะสม (Sum Similarity Score):</b><br>
            สำหรับผู้ใช้ <i>u</i> คะแนนของสินค้าเป้าหมาย <i>i</i> จะเกิดจากผลรวมความคล้ายของสินค้า <i>i</i> กับสินค้าทุกชิ้นที่ผู้ใช้คนนั้นเคยชอบ:<br>
            <div style="text-align: center; margin: 8px 0;">
              <i>score(u, i) = Σ_{j ∈ History(u)} sim(j, i)</i>
            </div>
          </li>
        </ol>

        <h4>ตัวอย่างการคำนวณคะแนนคอร์ส E ให้กับ u1</h4>
        <ul>
          <li>ประวัติความชอบของ u1 มีคอร์ส <b>A</b> และ <b>B</b></li>
          <li>ความคล้ายแบบ Binary ระหว่าง E กับ A = 2 / 3 (มีคนชอบร่วม 2 คน จากยอดคนชอบทั้งหมด 3 คน)</li>
          <li>ความคล้ายแบบ Binary ระหว่าง E กับ B = 2 / 3</li>
          <li>คะแนนจัดอันดับของคอร์ส E = sim(A, E) + sim(B, E) = 2/3 + 2/3 = <b>1.3333 แต้ม</b></li>
        </ul>

        <h4>คู่มือการตัดสินใจทางวิศวกรรม (Engineering Decision Guide)</h4>
        <div class="rs-callout rs-callout-warning">
          <ul>
            <li><b>ตัวเลข Score ไม่ใช่คะแนนดาว:</b> สังเกตว่าคะแนน 1.3333 นี้ไม่ได้อยู่ในสเกล 1-5 ดาว และอาจมีค่าเกิน 1.0 ได้ หน้าที่เดียวของมันคือการนำไป <b>เรียงลำดับจากมากไปน้อย (Sorting)</b> เพื่อคัดเลือก Top-K มาแสดงผลบนหน้าจอ</li>
            <li><b>การวัดผลที่ถูกต้อง:</b> ห้ามนำ MAE หรือ RMSE มาวัดผลลัพธ์ของ Implicit Model เด็ดขาด! เพราะไม่มีคะแนนดาวจริงให้เทียบ ต้องประเมินด้วย Ranking Metrics เช่น <b>Hit Rate@K, Precision@K, Recall@K, หรือ nDCG@K</b> เท่านั้น</li>
          </ul>
        </div>
      `,
      sources: [source(42, 'Implicit item-kNN'), source(43, 'Binary cosine'), source(45, 'Ranking score vs stars')],
      questions: [
        question('rs-cf-imp-1', 'ในการทำ Implicit Item-kNN ตัวเลขคะแนนผลลัพธ์ (Score) เช่น 1.3333 มีหน้าที่และความหมายอย่างไรในระบบ?',
          ['เป็นคะแนนดาวจริงที่ทำนายว่าจะได้ 1.33 ดาว', 'ไม่ใช่คะแนนดาว แต่เป็นคะแนนความมั่นใจสัมพัทธ์ (Relative Ranking Score) ที่มีไว้เพื่อนำไปจัดเรียงลำดับสินค้าจากมากไปน้อยสำหรับแสดงผล Top-K', 'เป็นราคาของสินค้า', 'เป็นเปอร์เซ็นต์ส่วนลด'],
          1,
          'คะแนนของ Implicit Item-kNN เกิดจากการบวกสะสมค่าความคล้าย ไม่มีหน่วยเป็นดาว มีไว้เพื่อเปรียบเทียบอันดับ (Ranking) ระหว่างสินค้าด้วยกันเท่านั้น',
          ['ไม่ใช่คะแนนดาว', 'ถูกต้อง เป็น Ranking Score สำหรับจัดอันดับ Top-K ไม่ใช่คะแนนดาว', 'ไม่ใช่ราคา', 'ไม่ใช่ส่วนลด']),
        question('rs-cf-imp-2', 'เหตุใดเราจึงห้ามนำมาตรวัด MAE หรือ RMSE มาใช้ประเมินความสามารถของ Implicit Recommender System?',
          ['เพราะโปรแกรมคอมพิวเตอร์จะแฮงก์ทันที', 'เพราะข้อมูล Implicit ไม่มีคะแนนดาวจริง (Ground Truth Ratings) ให้วัดผลต่างทางตัวเลข มีแต่พฤติกรรมการคลิกหรือดู จึงต้องใช้ Ranking Metrics เช่น Recall หรือ nDCG แทน', 'เพราะ MAE และ RMSE คิดค้นขึ้นมาสำหรับวิชาเคมีเท่านั้น', 'เพราะกฎหมายห้ามใช้'],
          1,
          'MAE และ RMSE ต้องใช้ผลต่างระหว่างดาวจริงกับดาวทำนาย แต่ Implicit มีแค่พฤติกรรม (0 หรือ 1) จึงต้องประเมินด้วย Ranking Metrics เช่น Hit Rate, Precision, Recall หรือ nDCG',
          ['โปรแกรมไม่แฮงก์แต่ผลจะไร้ความหมาย', 'ถูกต้อง Implicit ไม่มีคะแนนดาวจริงให้ลบผลต่าง ต้องวัดด้วย Ranking Metrics', 'MAE/RMSE เป็นสถิติทั่วไป', 'ไม่มีกฎหมายห้าม']),
        question('rs-cf-imp-3', 'หากผู้ใช้คนหนึ่งเคยกดดูสินค้ามาแล้ว 3 ชิ้น คือ A, B และ C โดยสินค้าเป้าหมาย X มีความคล้ายกับ A=0.4, B=0.5 และ C=0.2 คะแนนรวมของสินค้า X สำหรับผู้ใช้คนนี้คือเท่าใด?',
          ['0.4 + 0.5 + 0.2 = 1.1 แต้ม', '0.4 × 0.5 × 0.2 = 0.04 แต้ม', 'เฉลี่ยเท่ากับ 0.36 แต้ม', '0.0 แต้ม'],
          0,
          'สูตรคะแนนสะสมของ Implicit Item-kNN คือการรวมผลรวมความคล้ายของสินค้าเป้าหมายกับสินค้าทั้งหมดในประวัติ: 0.4 + 0.5 + 0.2 = 1.1 แต้ม',
          ['ถูกต้อง ผลรวมคะแนนความคล้าย 0.4 + 0.5 + 0.2 = 1.1 แต้ม', 'ไม่ใช่การคูณ', 'ไม่ใช่การเฉลี่ย', 'ไม่ใช่ 0.0']),
        question('rs-cf-imp-4', 'ในข้อมูลแบบ Implicit Feedback ค่าตัวเลข 0 ในตาราง (เช่น ผู้ใช้ไม่เคยกดดูสินค้านี้) สะท้อนข้อเท็จจริงใดที่ถูกต้องที่สุด?',
          ['ผู้ใช้คนนั้นเกลียดสินค้านั้นเข้าไส้', 'ผู้ใช้เห็นสินค้านั้นแล้วแต่จงใจไม่ซื้อ', 'ผู้ใช้อาจจะยังไม่เคยมีโอกาสพบเห็นสินค้านั้นมาก่อน หรืออาจจะยังไม่รู้จัก (Unobserved)', 'สินค้านั้นเป็นของปลอม'],
          2,
          'ใน Implicit Data ค่า 0 มีความคลุมเครือสูง (Ambiguity) ส่วนใหญ่เกิดจากการที่สินค้าไม่เคยถูกแสดงให้ผู้ใช้เห็น (Exposure Bias) ไม่สามารถด่วนสรุปว่าผู้ใช้เกลียดได้',
          ['ด่วนสรุปเกินไป', 'ไม่สามารถยืนยันได้ว่าเคยเห็นแล้วหรือไม่', 'ถูกต้อง 0 คือ Unobserved ส่วนใหญ่เกิดจากยังไม่เคยเห็นหรือยังไม่รู้จัก', 'ไม่เกี่ยวกับของปลอม'])
      ]
    },
    {
      id: 'recsys-cf-bias',
      number: '05.10',
      title: 'แยกองค์ประกอบคะแนนพื้นฐาน: Baseline Predictor (μ + bu + bi)',
      goal: 'เข้าใจแนวคิด Baseline Estimate, การแยกอคติของระบบ (Global Mean), ผู้ใช้ (User Bias) และสินค้า (Item Bias)',
      lead: 'คุณรู้หรือไม่ว่ากว่า 80% ของคะแนนในระบบแนะนำ สามารถทำนายได้อย่างแม่นยำโดยไม่ต้องรู้ด้วยซ้ำว่าใครเป็นเพื่อนกับใคร! เพียงแค่เข้าใจโครงสร้างคะแนนพื้นฐาน 3 ก้อนนี้...',
      body: `
        <div data-rs-demo="cf-bias"></div>

        <div class="rs-callout rs-callout-info">
          <h4>💡 ที่มาและปัญหาโลกจริง (The Intuition & Why)</h4>
          <p>ลองพิจารณาคำถามนี้: <i>"ทำไมคุณถึงให้คะแนนหนังเรื่อง The Shawshank Redemption สูงถึง 4.5 ดาว?"</i></p>
          <p>ถ้าเราแยกองค์ประกอบอย่างเป็นวิทยาศาสตร์ เราจะพบความจริง 3 ข้อ:</p>
          <ol>
            <li><b>ค่าเฉลี่ยของจักรวาล (<i>μ</i>):</b> หนังบน Netflix โดยเฉลี่ยมีคะแนนประมาณ 3.3 ดาวอยู่แล้ว (จุดตั้งต้น)</li>
            <li><b>นิสัยของตัวคุณ (<i>bᵤ</i>):</b> คุณเป็นคนใจดีกว่าค่าเฉลี่ย มักจะให้คะแนนสูงกว่าคนอื่นอยู่เสมอ (+0.4 ดาว)</li>
            <li><b>คุณภาพของตัวหนัง (<i>bᵢ</i>):</b> หนังเรื่องนี้เป็นผลงานชิ้นเอกที่ใครๆ ดูก็ชื่นชม ย่อมมีคะแนนสูงกว่าหนังทั่วไป (+0.8 ดาว)</li>
          </ol>
          <p>เพียงแค่นำ 3 ตัวเลขนี้มารวมกัน: <b>3.3 + 0.4 + 0.8 = 4.5 ดาวพอดี!</b> โดยที่เรายังไม่ได้คำนวณความชอบส่วนบุคคลระหว่างคุณกับหนังเรื่องนี้เลยแม้แต่น้อย! โครงสร้างนี้เรียกว่า <b>Baseline Predictor (<i>bᵤᵢ</i>)</b></p>
        </div>

        <h4>ถอดรหัสสูตรคณิตศาสตร์ Baseline Predictor</h4>
        <div class="rs-callout rs-callout-info">
          <p style="font-size: 1.25rem; text-align: center;">
            <b><i>bᵤᵢ = μ + bᵤ + bᵢ</i></b>
          </p>
        </div>

        <table>
          <thead>
            <tr><th>องค์ประกอบ</th><th>ชื่อเรียก</th><th>สูตรการคำนวณและบทบาท</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><b><i>μ</i> (มิว)</b></td>
              <td>Global Mean</td>
              <td>ค่าเฉลี่ยคะแนนดาวทั้งหมดที่สังเกตได้ในระบบ (คำนวณจากผลรวมดาวทั้งหมด หารด้วยจำนวนช่องที่รู้คะแนน)</td>
            </tr>
            <tr>
              <td><b><i>bᵢ</i></b></td>
              <td>Item Bias</td>
              <td>อคติของสินค้า: สินค้านี้ได้รับคะแนนสูงกว่าหรือต่ำกว่าค่าเฉลี่ยระบบเท่าไร (คำนวณพร้อมตัวปรับลดทอน <i>λ</i> เพื่อป้องกันสินค้าที่มีคนรีวิวน้อย)</td>
            </tr>
            <tr>
              <td><b><i>bᵤ</i></b></td>
              <td>User Bias</td>
              <td>อคติของผู้ใช้: ผู้ใช้คนนี้มีนิสัยให้คะแนนสูงกว่าหรือต่ำกว่ามาตรฐานระบบเท่าไร</td>
            </tr>
          </tbody>
        </table>

        <h4>การคำนวณจริงในชุดข้อมูลตัวอย่าง</h4>
        <ul>
          <li><b>Global Mean (<i>μ</i>):</b> ผลรวม 66 ดาว จาก 20 ช่องที่สังเกตได้ → <i>μ</i> = 66 / 20 = <b>3.3000 ดาว</b></li>
          <li><b>Item Bias ของคอร์ส E (<i>b_E</i>):</b> คอร์สยอดนิยม ได้คะแนนสูงกว่าค่าเฉลี่ยระบบ → <i>b_E</i> = <b>+0.3000 ดาว</b></li>
          <li><b>User Bias ของ u1 (<i>b_u1</i>):</b> u1 เป็นคนค่อนข้างเคี่ยว ให้คะแนนต่ำกว่าค่าเฉลี่ยระบบ → <i>b_u1</i> = <b>-0.1500 ดาว</b></li>
        </ul>
        <p><b>คะแนนทำนายพื้นฐานของคู่ (u1, E):</b><br>
        <i>b(u1, E)</i> = 3.3000 + (-0.1500) + (+0.3000) = <b>3.4500 ดาว</b></p>

        <h4>คู่มือการตัดสินใจทางวิศวกรรม (Engineering Decision Guide)</h4>
        <div class="rs-callout rs-callout-warning">
          <ul>
            <li><b>พลังของ Baseline:</b> ในการแข่งขันระดับโลกอย่าง Netflix Prize พบว่าโมเดล Baseline Predictor เดี่ยวๆ สามารถอธิบายความผันแปรของคะแนนได้มากกว่า 80% และลดค่า RMSE ลงได้อย่างมหาศาลโดยใช้เวลาเทรนเพียงเสี้ยววินาที</li>
            <li><b>การป้องกัน Overfitting ด้วย Regularization (<i>λ</i>):</b> ในการคำนวณ <i>bᵢ</i> เราจะใส่ตัวหาร <i>(λ + nᵢ)</i> เสมอ เพื่อหดค่า Bias ของสินค้าที่มีคนรีวิวเพียง 1-2 คนให้กลับเข้าหา 0 เพื่อไม่ให้โมเดลเชื่อข้อมูลกลุ่มตัวอย่างเล็กมากเกินไป</li>
          </ul>
        </div>
      `,
      sources: [source(47, 'Baseline predictor concept'), source(48, 'Regularized bias estimation'), source(50, 'Netflix Prize finding')],
      questions: [
        question('rs-cf-bias-1', 'ในสูตร Baseline Predictor: bᵤᵢ = μ + bᵤ + bᵢ สัญลักษณ์แต่ละตัวแทนค่าอะไรตามลำดับ?',
          ['μ = ค่าเฉลี่ยกลางทั้งระบบ, bᵤ = อคติของผู้ใช้, bᵢ = อคติของสินค้า', 'μ = วันที่, bᵤ = ราคาสินค้า, bᵢ = ส่วนลด', 'μ = จำนวนผู้ใช้, bᵤ = จำนวนสินค้า, bᵢ = ความเร็วเซิร์ฟเวอร์', 'μ = ค่าสูงสุด, bᵤ = ค่าต่ำสุด, bᵢ = ผลต่าง'],
          0,
          'Baseline Predictor ประกอบด้วย 3 องค์ประกอบหลัก: ค่าเฉลี่ยกลางระบบ (μ), อคติประจำตัวผู้ใช้ (bu) และอคติประจำตัวสินค้า (bi)',
          ['ถูกต้อง μ คือค่าเฉลี่ยกลางระบบ, bu คืออคติผู้ใช้, bi คืออคติสินค้า', 'ไม่ใช่เรื่องวันและราคา', 'ไม่ใช่จำนวนนับ', 'ไม่ใช่ค่าสูงสุดต่ำสุด']),
        question('rs-cf-bias-2', 'หากระบบมีค่าเฉลี่ยกลาง μ = 3.5 ดาว, ผู้ใช้ A เป็นคนใจดีมี bu = +0.4 ดาว และภาพยนตร์เรื่องหนึ่งเป็นหนังห่วยมี bi = -0.8 ดาว คะแนนฐาน bᵤᵢ ของคู่นี้คือเท่าใด?',
          ['3.5 + 0.4 - 0.8 = 3.1 ดาว', '3.5 + 0.4 + 0.8 = 4.7 ดาว', '3.5 - 0.4 - 0.8 = 2.3 ดาว', '5.0 ดาว'],
          0,
          'แทนค่าในสูตร bᵤᵢ = μ + bᵤ + bᵢ = 3.5 + (+0.4) + (-0.8) = 3.1 ดาว',
          ['ถูกต้อง 3.5 + 0.4 - 0.8 = 3.1 ดาว', 'บวกเครื่องหมาย bi ผิดพลาด', 'ลบ bu ผิดพลาด', 'ไม่ใช่ 5.0']),
        question('rs-cf-bias-3', 'เหตุใดในการคำนวณ Item Bias (bi) จึงต้องใส่ค่าคงที่ Regularization (λ) ไว้ในตัวหาร เช่น bi = Σ(rᵤᵢ - μ) / (nᵢ + λ)?',
          ['เพื่อบังคับให้ตัวเลขกลายเป็นจำนวนเต็ม', 'เพื่อลดทอน (Shrink) ค่าอคติของสินค้าที่มีคนรีวิวน้อย (nᵢ น้อย) ให้กลับเข้าหาศูนย์ ป้องกันการสรุปผิดพลาดจากกลุ่มตัวอย่างเล็ก', 'เพื่อทำให้โปรแกรมทำงานช้าลง', 'เพื่อเพิ่มคะแนนให้สินค้าทุกชิ้น'],
          1,
          'การใส่ λ ในตัวหารเป็นการทำ Shrinkage / Regularization หากสินค้ามีคนรีวิวแค่คนเดียว ค่า Bias จะถูกหารด้วยตัวเลขใหญ่ ทำให้ถูกดึงกลับเข้าหา 0 เพื่อความปลอดภัย',
          ['ไม่ใช่การปัดเศษ', 'ถูกต้อง ป้องกันสินค้าที่มีคนรีวิว 1-2 คนไม่ให้มีค่า Bias พุ่งสูงเกินความจริง', 'ไม่ได้ต้องการให้ช้าลง', 'ไม่ได้เพิ่มคะแนน']),
        question('rs-cf-bias-4', 'Item Bias (bi) กับ Popularity Count (ยอดคนซื้อ) เป็นสิ่งเดียวกันหรือไม่?',
          ['เป็นสิ่งเดียวกันทุกประการ', 'ไม่ใช่สิ่งเดียวกัน เพราะ bi สะท้อนแนวโน้มคะแนนดาวว่าสูงหรือต่ำกว่าเกณฑ์เฉลี่ย ส่วน Count เป็นเพียงจำนวนนับครั้งของเหตุการณ์ (สินค้าคนซื้อเยอะอาจมีดาวเฉลี่ยต่ำก็ได้)', 'เหมือนกันถ้าตั้งชื่อเหมือนกัน', 'เป็นหน่วยของไฟล์ในคอมพิวเตอร์'],
          1,
          'ความนิยม (Count) นับจำนวนคน แต่ Item Bias (bi) วัดคุณภาพสัมพัทธ์ของคะแนน สินค้าที่มียอดขายถล่มทลายอาจเป็นสินค้าที่คนบ่นและให้ดาวต่ำก็ได้',
          ['เป็นคนละเรื่องกัน', 'ถูกต้อง bi วัดทิศทางคะแนนดาวเทียบค่าเฉลี่ย ส่วน Count นับจำนวนคน', 'ชื่อไม่เปลี่ยนความหมายทางคณิตศาสตร์', 'ไม่เกี่ยวกับไฟล์'])
      ]
    },
    {
      id: 'recsys-cf-knn-baseline',
      number: '05.11',
      title: 'ผสานพลังค่าฐานและเพื่อนบ้าน: kNN-Baseline Predictor',
      goal: 'เข้าใจโมเดลไฮบริด kNN-Baseline ที่รวมโครงสร้างค่าฐาน (Baseline) เข้ากับส่วนเบี่ยงเบนจากเพื่อนบ้าน (Neighborhood Residuals)',
      lead: 'แทนที่จะให้เพื่อนบ้านต้องแบกภาระอธิบายทุกสิ่งทุกอย่าง เราให้ค่าฐานจัดการโครงสร้างใหญ่ 80% ก่อน แล้วให้เพื่อนบ้านอธิบายเฉพาะ "ส่วนที่เหนือความคาดหมาย (Residual)"',
      body: `
        <div data-rs-demo="cf-baseline"></div>

        <div class="rs-callout rs-callout-info">
          <h4>💡 ที่มาและปัญหาโลกจริง (The Intuition & Why)</h4>
          <p>ในโมเดล k-NN แบบดั้งเดิม เพื่อนบ้านต้องรับภาระทำนายคะแนนทั้งหมด ซึ่งบ่อยครั้งเพื่อนบ้านอาจประเมินพลาดเพราะอคติของตนเอง...</p>
          <p>โมเดล <b>kNN-Baseline</b> ถือกำเนิดขึ้นมาเพื่อผสานโลกสองใบที่ดีที่สุดเข้าด้วยกัน:</p>
          <ul>
            <li><b>ค่าฐาน (<i>bᵤᵢ</i>):</b> ตอบคำถามว่า <i>"โดยปกติแล้ว คู่นี้ควรจะได้คะแนนประมาณเท่าไรจากสถิติภาพรวม?"</i> (รองรับโครงสร้างใหญ่)</li>
            <li><b>เพื่อนบ้าน (Neighborhood):</b> ตอบคำถามว่า <i>"จากรสนิยมเฉพาะตัว สิ่งนี้มีอะไรที่ถูกใจหรือขัดใจเป็นพิเศษเหนือกว่าที่ค่าฐานคาดไว้หรือไม่?"</i> (อธิบายส่วนต่าง Residuals)</li>
          </ul>
        </div>

        <h4>สูตรคณิตศาสตร์ kNN-Baseline Predictor</h4>
        <div class="rs-callout rs-callout-info">
          <p style="font-size: 1.15rem; text-align: center;">
            <b><i>r̂ᵤᵢ = bᵤᵢ + ( Σ_{j ∈ N_k(i; u)} sim′(i, j) × (rᵤⱼ - bᵤⱼ) ) / ( Σ_{j ∈ N_k(i; u)} |sim′(i, j)| )</i></b>
          </p>
        </div>

        <table>
          <thead>
            <tr><th>ส่วนประกอบสูตร</th><th>ความหมายเชิงลึก</th><th>เปรียบเทียบกับ Item-kNN เดิม</th></tr>
          </thead>
          <tbody>
            <tr><td><b>จุดตั้งต้น <i>bᵤᵢ</i></b></td><td>ค่าฐานของสินค้าและผู้ใช้คู่นั้น (<i>μ + bᵤ + bᵢ</i>)</td><td>Item-kNN เดิมใช้เพียงแค่ <i>r̄ᵤ</i> (ค่าเฉลี่ยผู้ใช้) แต่ kNN-Baseline ดึงคุณภาพของสินค้า <i>bᵢ</i> มาร่วมเป็นฐานด้วย</td></tr>
            <tr><td><b><i>rᵤⱼ - bᵤⱼ</i></b></td><td><b>Residual จากค่าฐาน:</b> ผู้ใช้ชอบสินค้า <i>j</i> เหนือกว่าหรือต่ำกว่าค่าฐานที่คาดไว้เท่าไร</td><td>หักลบทั้งค่าเฉลี่ยระบบ อคติคน และอคติของสินค้า <i>j</i> ออกไปจนหมด เหลือเฉพาะความประทับใจส่วนตัวจริงๆ</td></tr>
            <tr><td><b>กรณีไม่มีเพื่อนบ้าน</b></td><td><b>ถอยกลับสู่ <i>bᵤᵢ</i> ทันที (Graceful Fallback)</b></td><td>ปลอดภัยอย่างยิ่ง เพราะค่าฐาน <i>bᵤᵢ</i> มีความแม่นยำสูงมากอยู่แล้วแม้ไม่มีเพื่อนบ้าน</td></tr>
          </tbody>
        </table>

        <h4>เปรียบเทียบผลทำนายของวิธีต่างๆ บนคู่ (u1, คอร์ส E)</h4>
        <div class="rs-table-wrap">
          <table>
            <thead>
              <tr><th>วิธีการทำนาย</th><th>คะแนนทำนาย</th><th>พฤติกรรมเมื่อไม่มีเพื่อนบ้านเลย (Cold Item)</th></tr>
            </thead>
            <tbody>
              <tr><td><b>User-kNN Centered</b></td><td>4.1107 ดาว</td><td>ถอยไปใช้ค่าเฉลี่ยผู้ใช้ <i>r̄ᵤ</i> = 3.00 ดาว</td></tr>
              <tr><td><b>Item-kNN Centered</b></td><td>4.5000 ดาว</td><td>ถอยไปใช้ค่าเฉลี่ยผู้ใช้ <i>r̄ᵤ</i> = 3.00 ดาว</td></tr>
              <tr><td><b>Baseline Predictor อย่างเดียว</b></td><td>3.4500 ดาว</td><td>ใช้ค่าฐาน <i>bᵤᵢ</i> = 3.45 ดาว</td></tr>
              <tr><td><b>kNN-Baseline (ผสานพลัง)</b></td><td><b>4.4167 ดาว</b></td><td><b>ถอยไปใช้ค่าฐาน <i>bᵤᵢ</i> = 3.45 ดาว (ฉลาดและแม่นยำที่สุด)</b></td></tr>
            </tbody>
          </table>
        </div>

        <h4>คู่มือการตัดสินใจทางวิศวกรรม (Engineering Decision Guide)</h4>
        <div class="rs-callout rs-callout-warning">
          <ul>
            <li><b>มาตรฐานทองคำของ Memory-based:</b> ในบรรดาวิธีการแบบ Memory-based / Neighborhood ทั้งหมด โมเดล kNN-Baseline ได้รับการพิสูจน์ในการทดลองระดับโลกว่ามีความแม่นยำ (RMSE ต่ำสุด) และมีความทนทานต่อข้อมูลเบาบางดีที่สุด</li>
            <li><b>การป้องกันคะแนนล้นขอบ:</b> ผลทำนายสุดท้ายอาจมีโอกาสหลุดออกจากช่วง 1-5 ดาว (เช่น ได้ 5.2 ดาว) ในโปรดักชันจริงจะต้องมีฟังก์ชัน <b>Clipping: min(max(r̂, 1.0), 5.0)</b> เสมอเพื่อตัดขอบให้อยู่ในช่วงคะแนนที่ถูกต้อง</li>
          </ul>
        </div>
      `,
      sources: [source(52, 'kNN-Baseline formula'), source(53, 'Residual explanation'), source(55, 'เปรียบเทียบ 4 วิธีทำนาย')],
      questions: [
        question('rs-cf-kbase-1', 'ในสูตร kNN-Baseline ส่วนต่างที่นำมาให้เพื่อนบ้านช่วยอธิบายคือพจน์ใด?',
          ['rᵤⱼ - μ', 'rᵤⱼ - r̄ᵤ', 'rᵤⱼ - bᵤⱼ (คะแนนจริงลบด้วยค่าฐานของคู่นั้น)', 'Label จริงลบด้วยคำตอบ Test'],
          2,
          'kNN-Baseline ใช้ Residual ที่หักล้างค่าฐานทั้งก้อนออกไปแล้ว: (rᵤⱼ - bᵤⱼ) เพื่อดูว่าผู้ใช้ชอบสิ่งนั้นเหนือกว่าที่ค่าฐานคาดไว้เท่าไร',
          ['ยังขาดการหัก User bias และ Item bias', 'นั่นคือพจน์ของ kNN ดั้งเดิม', 'ถูกต้อง เป็นการหักค่าฐานเฉพาะคู่นั้น (rᵤⱼ - bᵤⱼ)', 'ห้ามนำชุด Test มาคำนวณ']),
        question('rs-cf-kbase-2', 'หากค่าฐาน bᵤᵢ ของเป้าหมายคือ 3.45 ดาว และเพื่อนบ้านส่งผลรวมเบี่ยงเบนมาช่วยเสริม +0.9667 ดาว คะแนนทำนายของ kNN-Baseline จะมีค่าประมาณเท่าใด?',
          ['4.4167 ดาว (เกิดจาก 3.45 + 0.9667)', '3.4500 ดาว', '0.9667 ดาว', '5.0000 ดาว'],
          0,
          'คะแนนทำนายเกิดจาก ค่าฐานตั้งต้น บวกด้วย ผลรวมเบี่ยงเบนจากเพื่อนบ้าน = 3.45 + 0.9667 = 4.4167 ดาว',
          ['ถูกต้อง 3.45 + 0.9667 = 4.4167 ดาว', '3.45 คือเฉพาะค่าฐาน', '0.9667 คือเฉพาะส่วนเติมเต็ม', 'ไม่ใช่ 5.0']),
        question('rs-cf-kbase-3', 'หากสินค้าเป้าหมายเป็นสินค้าใหม่เอี่ยมที่ไม่มีใครเคยให้คะแนนมาก่อนเลย (ไม่มีเพื่อนบ้านให้ใช้งาน) kNN-Baseline จะถอยกลับไปใช้ค่าใดเป็นค่าทำนาย?',
          ['ถอยไปตอบ 0 ดาว', 'ถอยไปใช้ค่าฐาน bᵤᵢ ตามพารามิเตอร์ที่มีอยู่', 'ถอยไปใช้คะแนนของคู่แข่ง', 'ไม่ตอบอะไรเลยและขึ้น Error'],
          1,
          'เมื่อไม่มีข้อมูลเพื่อนบ้าน พจน์ผลรวมจะกลายเป็น 0 ทำให้คำทำนายถอยกลับสู่ค่าฐาน bᵤᵢ (μ + bu + bi) อย่างสง่างามโดยไม่เออเร่อ',
          ['ไม่ควรตอบ 0 ดาว', 'ถูกต้อง ถอยกลับไปใช้ค่าฐาน bᵤᵢ ตามโครงสร้างที่มี', 'ไม่ใช่คู่แข่ง', 'ระบบจะไม่ Error']),
        question('rs-cf-kbase-4', 'จุดเด่นที่ทำให้ kNN-Baseline เหนือกว่า Item-kNN ดั้งเดิมคือข้อใด?',
          ['kNN-Baseline ไม่ต้องใช้คอมพิวเตอร์', 'kNN-Baseline แยกแยะอิทธิพลของค่าเฉลี่ยระบบและคุณภาพสินค้า (Item Bias) ออกจากความชอบส่วนตัว ทำให้เพื่อนบ้านโฟกัสเฉพาะส่วนที่เกินความคาดหมายได้อย่างแม่นยำกว่า', 'kNN-Baseline ทำงานได้เฉพาะกับรูปภาพ', 'kNN-Baseline ไม่มีข้อดีอะไรเลย'],
          1,
          'การตัด Bias ทั้งของคนและของสินค้าออกไปก่อน ทำให้เพื่อนบ้านเรียนรู้เฉพาะสัญญาณรสนิยมแท้จริง (Residuals) โดยไม่ถูกบิดเบือนจากความดังของสินค้า',
          ['ต้องใช้คอมพิวเตอร์ตามปกติ', 'ถูกต้อง แยกอิทธิพลของ Bias ระบบและสินค้าออก ทำให้เพื่อนบ้านทำงานได้แม่นยำขึ้นมาก', 'ใช้กับข้อมูลพฤติกรรมไม่ใช่รูปภาพ', 'เป็นโมเดลที่ชนะรางวัลระดับโลก'])
      ]
    },
    {
      id: 'recsys-cf-cold-start',
      number: '05.12',
      title: 'วินิจฉัยจุดบอด: Cold Start, Sparsity, และ Gray Sheep',
      goal: 'สรุปปัญหาและข้อจำกัดสำคัญของ Collaborative Filtering ทั้งหมด พร้อมตารางวินิจฉัยและแนวทางแก้ไขทางวิศวกรรม',
      lead: 'ไม่มีโมเดลใดในโลกที่สมบูรณ์แบบ... Collaborative Filtering ทรงพลังมาก แต่ก็มี "จุดตาย" คลาสสิกที่วิศวกรระบบแนะนำทุกคนต้องรู้จักและเตรียมแผนรับมือ',
      body: `
        <div class="rs-callout rs-callout-info">
          <h4>💡 ที่มาและปัญหาโลกจริง (The Intuition & Why)</h4>
          <p>Collaborative Filtering พึ่งพา <b>"รอยเท้าของมนุษย์"</b>... แต่จะเกิดอะไรขึ้นเมื่อไม่มีรอยเท้าให้เดินตาม? หรือจะเกิดอะไรขึ้นเมื่อมีผู้ใช้บางคนที่มีรสนิยมแปลกประหลาดจนไม่มีใครบนโลกเหมือนเขาเลย? บทเรียนนี้คือคู่มือวินิจฉัยโรคของระบบแนะนำ เพื่อให้คุณเตรียมพร้อมรับมือกับปัญหาจริงในการทำงาน</p>
        </div>

        <div data-rs-demo="cf-diagnosis"></div>

        <h4>กฎเหล็กการประเมินผลเพื่อป้องกันข้อมูลรั่วไหล (Data Leakage Prevention)</h4>
        <div class="rs-callout rs-callout-warning">
          <p><b>1. การแบ่งชุดข้อมูลต้องใช้ Temporal Split เสมอ:</b> ในระบบที่มีมิติเวลา ห้ามสุ่มแบ่ง Train/Test แบบ Random เด็ดขาด! เพราะจะทำให้ระบบแอบเห็นพฤติกรรมในอนาคตเพื่อมาทำนายอดีต ต้องใช้ข้อมูลสัปดาห์ที่ 1–3 เทรน เพื่อทำนายสัปดาห์ที่ 4 เท่านั้น</p>
          <p><b>2. การคำนวณสถิติต้องทำบน Train เท่านั้น:</b> ค่าเฉลี่ย <i>μ</i>, <i>r̄ᵤ</i>, ค่า Bias <i>bᵢ</i> และความคล้ายทั้งหมด ต้องคำนวณจากชุด Train ล้วนๆ ห้ามให้ข้อมูลจาก Test หลุดรอดเข้ามามีอิทธิพลต่อสถิติเหล่านี้เด็ดขาด</p>
        </div>
      `,
      sources: [source(84, 'Cold start และ Sparsity'), source(85, 'Popularity bias'), source(86, 'Gray sheep problem'), source(88, 'Data leakage และ Temporal split')],
      questions: [
        question('rs-cf-cold-1', 'เมื่อมีสินค้าใหม่เอี่ยมเข้ามาในระบบ (Item Cold-Start) ซึ่งยังไม่เคยมีผู้ใช้คนใดมีปฏิสัมพันธ์ด้วยเลย วิธีการแก้ไขที่เหมาะสมและมีประสิทธิภาพที่สุดคืออะไร?',
          ['แอบเติมคะแนน 5 ดาวให้สินค้านั้นเพื่อช่วยโปรโมต', 'สลับไปใช้ Content-Based Filtering โดยนำเนื้อหา รูปภาพ หรือคำบรรยายของสินค้ามาหาความคล้ายแทนชั่วคราว', 'ลบสินค้านั้นออกจากระบบทันที', 'บังคับให้ผู้ใช้ทุกคนต้องซื้อสินค้านั้น'],
          1,
          'เมื่อขาดรอยเท้าพฤติกรรม (ไม่มี Interaction) Content-Based Filtering คือฮีโร่ที่เข้ามาช่วยชีวิต เพราะสามารถอ่านข้อมูลจาก Metadata ของตัวสินค้าได้ทันที',
          ['การเติมคะแนนปลอมเป็นการบิดเบือนข้อมูล', 'ถูกต้อง สลับไปใช้ Content-Based หรือ Hybrid เพื่อใช้ประโยชน์จาก Metadata สินค้า', 'ไม่ควรลบสินค้าใหม่', 'ไม่สามารถบังคับผู้ใช้ได้']),
        question('rs-cf-cold-2', 'ปัญหา "Gray Sheep Problem" ในระบบแนะนำแบบ Collaborative Filtering หมายถึงสถานการณ์ใด?',
          ['เซิร์ฟเวอร์ระบบแนะนำเกิดไฟดับ', 'สถานการณ์ที่ผู้ใช้มีรสนิยมเฉพาะตัวที่แปลกประหลาด จนระบบไม่สามารถหาเพื่อนบ้าน (Neighbors) ที่มีรสนิยมคล้ายกันมาช่วยแนะนำได้', 'สถานการณ์ที่สินค้าทุกชิ้นถูกย้อมเป็นสีเทา', 'สถานการณ์ที่ระบบมีข้อมูลมากเกินไปจนฮาร์ดดิสก์เต็ม'],
          1,
          'Gray Sheep คือผู้ใช้ที่มีรสนิยมเฉพาะตัวไม่เหมือนใคร ทำให้หาเพื่อนบ้านที่มีความชอบตรงกันได้ยาก ส่งผลให้ Collaborative Filtering ทำนายได้ไม่แม่นยำ',
          ['ไม่เกี่ยวกับไฟดับ', 'ถูกต้อง ผู้ใช้ที่มีรสนิยมเฉพาะตัวจนหาเพื่อนร่วมอุดมการณ์ในระบบไม่เจอ', 'ไม่เกี่ยวกับสีสินค้า', 'ไม่เกี่ยวกับฮาร์ดดิสก์เต็ม']),
        question('rs-cf-cold-3', 'เหตุใดในการประเมินประสิทธิภาพของระบบแนะนำ เราจึงต้องใช้การแบ่งข้อมูลตามเส้นเวลา (Temporal Split) แทนการสุ่มแบ่งแบบ Random ทั่วไป?',
          ['เพื่อป้องกันปัญหา Data Leakage ไม่ให้โมเดลแอบเห็นข้อมูลพฤติกรรมในอนาคตมาช่วยทำนายอดีต', 'เพราะการสุ่มใช้เวลาประมวลผลนานกว่า', 'เพราะปฏิทินบังคับให้ต้องแบ่งตามเวลา', 'เพราะ Temporal Split ทำให้คะแนนความแม่นยำสูงกว่าเสมอ'],
          0,
          'ระบบแนะนำในชีวิตจริงต้องใช้ข้อมูลในอดีตเพื่อทำนายอนาคต การสุ่ม Random Split จะทำให้ข้อมูลพฤติกรรมในอนาคตรั่วไหล (Data Leakage) เข้าไปในชุดฝึก ซึ่งทำให้ผลทดสอบแม่นหลอกตาแต่ใช้จริงไม่ได้',
          ['ถูกต้อง ป้องกัน Data Leakage จากอนาคตรั่วไหลเข้าสู่ชุดฝึก', 'เวลาในการสุ่มไม่ต่างกัน', 'ไม่มีกฎหมายปฏิทินบังคับ', 'Temporal Split มักได้คะแนนยากกว่าแต่สะท้อนโลกจริง']),
        question('rs-cf-cold-4', 'ข้อใดสรุปจุดเด่นและจุดด้อยของ Memory-based Collaborative Filtering (User-kNN / Item-kNN) ได้ครอบคลุมและถูกต้องที่สุด?',
          ['จุดเด่น: ใช้งานง่าย ตีความได้ชัดเจน (Explainable) / จุดด้อย: ไม่รองรับระบบขนาดใหญ่มาก (Scalability ต่ำ) และมีปัญหาเมื่อเจอข้อมูลเบาบาง (Sparsity) หรือสินค้าใหม่ (Cold-Start)', 'จุดเด่น: ทำนายอนาคตได้แม่นยำ 100% / จุดด้อย: ไม่มีจุดด้อยเลย', 'จุดเด่น: ทำงานได้เฉพาะเมื่อไม่มีอินเทอร์เน็ต / จุดด้อย: ใช้ได้เฉพาะกับตัวเลข 0 เท่านั้น', 'จุดเด่น: ไม่ต้องใช้ข้อมูลอะไรเลย / จุดด้อย: ต้องใช้ซูเปอร์คอมพิวเตอร์'],
          0,
          'Memory-based CF มีจุดเด่นด้านความเรียบง่าย โปร่งใส และอธิบายผลได้ แต่มีจุดอ่อนเรื่องการขยายขนาด (Scalability) เมื่อผู้ใช้และสินค้ามีหลักสิบล้านชิ้น และติดปัญหา Cold-Start',
          ['ถูกต้อง สรุปจุดเด่นด้านความเรียบง่าย/Explainability และจุดด้อยด้าน Scalability/Cold-Start ได้ครบถ้วน', 'ไม่มีโมเดลใดแม่นร้อยเปอร์เซ็นต์', 'ต้องใช้อินเทอร์เน็ตและข้อมูลตามปกติ', 'ต้องมีข้อมูล Interaction'])
      ]
    }
  ];

  const chapter = {
    id: 'recsys-collaborative',
    number: '05',
    kicker: 'COLLABORATIVE FILTERING · NEIGHBORS & BASELINES',
    title: 'Collaborative Filtering: เพื่อนบ้านและค่าฐาน',
    description: 'อ่านพฤติกรรมจากฝูงชน เปรียบเทียบความคล้ายคนและสินค้า ปรับไม้บรรทัดด้วย Mean-Centering และผสานพลังด้วย kNN-Baseline ส่วนนี้ครอบคลุมวิธีแบบ Memory-based ทั้งหมดของบท 05',
    lessons
  };

  window.RECSYS_CHAPTERS = [...(window.RECSYS_CHAPTERS || []).filter(c => c.id !== 'recsys-collaborative'), chapter];
})();
