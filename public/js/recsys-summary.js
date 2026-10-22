/* Course content for Fast-Track Executive Summary & Exam Cheat Sheet (High-Yield Professional Edition) */
(() => {
  'use strict';

  const question = (id, q, choices, answer, explanation, reasons) => ({ id, q, choices, answer, explanation, reasons, version: 1 });

  function escapeAttr(str) {
    return String(str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function makeFigureHtml(file, title, badge, note) {
    const safeTitle = escapeAttr(title);
    const safeNote = escapeAttr(note);
    const safeFile = escapeAttr(file);
    const safeBadge = escapeAttr(badge);

    return `<figure class="edu-figure recsys-figure dark-stage cs-figure" tabindex="0" role="button" aria-label="คลิกเพื่อขยายดูภาพละเอียด: ${safeTitle}" onclick="window.openRecsysFigureModal &amp;&amp; window.openRecsysFigureModal({ title: '${safeTitle}', file: '${safeFile}', note: '${safeNote}' }, this)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault(); window.openRecsysFigureModal &amp;&amp; window.openRecsysFigureModal({ title: '${safeTitle}', file: '${safeFile}', note: '${safeNote}' }, this);}">
      <div class="image-stage">
        <span class="zoom-hint">🔍 คลิกเพื่อดูภาพขยาย</span>
        <img src="public/images/recsys/${safeFile}" alt="${safeTitle}" loading="eager">
      </div>
      <figcaption>
        <span>
          <strong>${title}</strong>
          ${note ? ` · ${note}` : ''}
        </span>
        ${badge ? `<span class="figure-credit"><span class="recsys-badge-tag">${badge}</span></span>` : ''}
      </figcaption>
    </figure>`;
  }

  const summaryChapter = {
    id: 'recsys-summary',
    number: '0',
    badge: '⚡ สรุป',
    title: 'บทสรุปด่วนเตรียมสอบ 9 บทเรียน (Fast-Track Cheat Sheet)',
    kicker: 'CORE CONCEPTS, FORMULA CHEAT SHEET & EXAM TRAPS',
    description: 'รวบรวมแก่นสาระสำคัญ สูตรจำเข้าห้องสอบ ตารางตัดสินใจเลือกโมเดล ไดอะแกรมสายพาน และกับดักข้อสอบยอดฮิตจากทั้ง 9 บทเรียนหลัก (ไม่รวมพื้นฐานคณิตศาสตร์) พร้อมแนบลิงก์สำหรับกระโดดไปอ่านบทเต็มในแท็บใหม่ได้ทันที',
    lessons: [
      /* ==========================================================================
         Task 0.1: บทที่ 1 - ภาพรวมและสายพาน 3 ด่าน (Introduction & Pipeline)
         ========================================================================== */
      {
        id: 'recsys-sum-pipeline',
        number: '0.1',
        title: 'สรุปบทที่ 1: รากฐานระบบแนะนำ สายพาน 3 ด่าน และวงจรสะท้อนกลับ',
        goal: 'แม่นยำความแตกต่าง Search vs RecSys, สถาปัตยกรรมสายพาน 3 ขั้นตอน, ประเภท Feedback, และการรับมือ Feedback Loop',
        lead: 'ระบบแนะนำขับเคลื่อนด้วยบริบทของผู้ใช้! สรุปสถาปัตยกรรมโปรดักชันยุคใหม่ (Candidate Generation → Scoring → Re-ranking) และความท้าทายหลักที่ข้อสอบต้องถาม',
        body: `<div class="cs-card">
            <div class="cs-header">
              <h3>⚡ หัวใจสำคัญบทที่ 1</h3>
              <span class="cs-badge-pill">Ch 01</span>
            </div>

            <ul>
              <li>
                <b>Search vs Recommendation:</b>
                <ul>
                  <li><i>Search (Information Retrieval):</i> ผู้ใช้เป็นฝ่ายรุก (Pull) มี <b>Explicit Query</b> (พิมพ์คำค้นหาชัดเจน) ผลลัพธ์ขึ้นกับคำค้นหาเป็นหลัก</li>
                  <li><i>Recommendation (RecSys):</i> ระบบเป็นฝ่ายรุก (Push) ผู้ใช้ <b>ไม่มีคำค้นหา</b> ขับเคลื่อนด้วย User Context, ประวัติในอดีต (Watch/Click History) และข้อมูลรสนิยม</li>
                </ul>
              </li>

              <li>
                <b>Rating Prediction vs Ranking (Top-K):</b>
                การทายคะแนนดาวแม่นยำ (เช่น ได้ค่า RMSE ต่ำมาก) <u>ไม่ได้การันตี</u> ว่าลำดับสินค้าด้านบน (Top-K) จะถูกใจผู้ใช้ เพราะผู้ใช้สนใจเฉพาะของดีอันดับ 1-5 แรกของหน้าจอเท่านั้น ไม่ได้สนใจว่าของอันดับ 1,000 จะทายได้แม่นกี่ดาว
              </li>

              <li>
                <b>Explicit vs Implicit Feedback:</b>
                <ul>
                  <li><i>Explicit Feedback:</i> การให้คะแนนดาว 1-5, การกดรีวิว &rarr; สัญญาณตรงไปตรงมา ชัดเจน แต่ <b>ปริมาณน้อยมากและเบาบางมาก (Sparsity &gt; 99%)</b></li>
                  <li><i>Implicit Feedback:</i> การคลิก, เวลาที่ใช้ดู (Dwell Time), การเลื่อนผ่าน (Scroll) &rarr; <b>ปริมาณมหาศาล เก็บได้ฟรี</b> แต่มีสัญญาณรบกวน (Noise) และแฝงด้วย Position Bias (ของอยู่บนมักถูกคลิกมากกว่า)</li>
                </ul>
              </li>
            </ul>

            <div class="cs-table-wrap">
              <table class="cs-table">
                <thead>
                  <tr>
                    <th>ด่านที่</th>
                    <th>ชื่อด่าน (Stage)</th>
                    <th>ปริมาณไอเทม</th>
                    <th>เวลาประมวลผล (Latency)</th>
                    <th>โมเดลและเทคนิคที่ใช้</th>
                    <th>เป้าหมายหลัก</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><b>1</b></td>
                    <td><b>Candidate Generation (Retrieval)</b></td>
                    <td>ล้านชิ้น &rarr; เหลือ ~100 - 500 ชิ้น</td>
                    <td><b>&lt; 10 - 20 ms</b></td>
                    <td>Two-Tower DSSM, Vector Search (ANN / Faiss), Item-kNN, Graph Embeddings</td>
                    <td>เน้น <b>High Recall</b> กวาดของที่มีแววให้ติดเข้ามามากที่สุด ไม่ตกหล่นของดี</td>
                  </tr>
                  <tr>
                    <td><b>2</b></td>
                    <td><b>Scoring &amp; Ranking</b></td>
                    <td>~100 - 500 ชิ้น &rarr; เรียงคะแนน</td>
                    <td><b>&lt; 20 - 40 ms</b></td>
                    <td>DeepFM, DLRM, Wide &amp; Deep, Gradient Boosted Decision Trees (GBDT)</td>
                    <td>เน้น <b>High Precision</b> คำนวณความน่าจะเป็นของการคลิก/ซื้อ (pCTR, pCVR) ละเอียดระดับจุดทศนิยม</td>
                  </tr>
                  <tr>
                    <td><b>3</b></td>
                    <td><b>Re-ranking &amp; Business Rules</b></td>
                    <td>~50 ชิ้น &rarr; เหลือแสดงผล Top-K (~10-20)</td>
                    <td><b>&lt; 5 - 10 ms</b></td>
                    <td>MMR (Diversity), Deduplication, Freshness Boost, Category Balancing, LLM Reranker</td>
                    <td>กระจายความหลากหลาย (Diversity), กำจัดความซ้ำซาก, และบังคับใช้กฎธุรกิจขององค์กร</td>
                  </tr>
                </tbody>
              </table>
            </div>
            ${makeFigureHtml(
              'recsys-funnel-pipeline.svg',
              'The RecSys Multi-Stage Funnel: สถาปัตยกรรม 3 สายพานระดับ Production',
              '3-Stage Funnel',
              'การกรองไอเทมแบบกรวยหลายชั้นเพื่อสร้างสมดุลระหว่างความเร็วระดับมิลลิวินาที (Latency) และความแม่นยำสูงสุด (Accuracy)'
            )}

            <div class="cs-formula-card">
              <div class="cs-formula-title">📐 สูตรวัดความเบาบางของข้อมูล (Matrix Sparsity)</div>
              <div class="cs-formula-math">Sparsity = 1 - (|R| / (|U| × |I|))</div>
              <div class="cs-formula-legend">
                โดย |R| คือจำนวนปฏิสัมพันธ์ที่มีอยู่จริง, |U| คือจำนวนผู้ใช้ทั้งหมด, และ |I| คือจำนวนสินค้าทั้งหมด (ในระบบจริงค่า Sparsity มักเกิน <b>99.0% - 99.9%</b>)
              </div>
            </div>

            <div class="cs-trap-box">
              <div class="cs-trap-title">🚨 กับดักข้อสอบยอดฮิต (Exam Watch-Outs)</div>
              <ul>
                <li><b>Feedback Loop (วงจรสะท้อนกลับ):</b> ระบบแนะนำเฉพาะของดัง &rarr; ผู้ใช้เห็นแต่ของดัง &rarr; ข้อมูลคลิกของดังเพิ่มขึ้น &rarr; โมเดลคิดว่าของดังดีที่สุด &rarr; ยิ่งแนะนำแต่ของดัง! <u>วิธีแก้:</u> ต้องบันทึก <b>Exposure Log</b> (ของที่ถูกแสดงแต่ไม่ถูกคลิก) และเจียดพื้นที่ทำ <b>Exploration (สุ่มของหางยาว Long-Tail)</b></li>
                <li><b>Cold-Start Problem:</b> มี 2 ฝั่ง: <i>New User</i> (แก้ด้วย Onboarding Survey หรือแนะนำตามความนิยม) และ <i>New Item</i> (แก้ด้วย Content-Based Filtering หรือ Multimodal Encoders เพราะไม่ง้อประวัติเดิม)</li>
              </ul>
            </div>
            ${makeFigureHtml(
              'feedback-loop-bubble.svg',
              'วงจรสะท้อนกลับ (Feedback Loop & Filter Bubble Dynamics)',
              'Feedback Loop',
              'ภาพแสดงวงจรจำกัดความหลากหลาย เมื่อระบบแนะนำแต่ของที่ผู้ใช้เคยคลิก นำไปสู่อาการเสียงสะท้อนในกะลา (Echo Chamber)'
            )}

            <div class="cs-link-box">
              <div class="cs-link-title">🔗 ทางลัดเชื่อมโยงเนื้อหาบทที่ 1</div>
              <div class="cs-btn-row">
                <a class="cs-btn-link primary" href="index.html#recsys-introduction" target="_blank" rel="noopener noreferrer">↗ เปิดอ่านบทที่ 1 เต็มในแท็บใหม่</a>
                <a class="cs-btn-link" href="index.html#recsys-pipeline" target="_blank" rel="noopener noreferrer">↗ เจาะลึก 3-Stage Pipeline</a>
                <a class="cs-btn-link" href="index.html#recsys-cold-start" target="_blank" rel="noopener noreferrer">↗ เจาะลึก Cold-Start Problem</a>
                <button class="cs-btn-link" type="button" onclick="window.switchRecsysChapter('recsys-introduction')">📖 สลับไปอ่านบทที่ 1 ในหน้านี้</button>
              </div>
            </div>
          </div>`,
        sources: [],
        questions: [
          question('sum-ch1-q1', 'ในสถาปัตยกรรมระบบแนะนำระดับ Production เหตุใดจึงไม่ใช้โมเดล Deep Learning ที่ซับซ้อนที่สุดมาคำนวณคะแนนสินค้าทั้งหมดในระบบตั้งแต่ต้น?',
            ['เพราะโมเดล Deep Learning มีความแม่นยำต่ำกว่า Heuristics', 'เพราะคลังสินค้ามีขนาดมหาศาล (ล้านชิ้น) หากใช้โมเดลหนักคำนวณทั้งหมดจะเกิด Latency สูงเกินข้อกำหนด (<50ms)', 'เพราะโมเดล Deep Learning ไม่สามารถจัดอันดับสินค้าได้', 'เพราะโมเดล Deep Learning รองรับเฉพาะข้อมูลข้อความเท่านั้น'],
            1,
            'ด่านแรก (Candidate Generation) จำเป็นต้องคัดกรองจากสินค้าหลักล้านให้เหลือหลักร้อยด้วยวิธีที่เร็วมาก (Low Latency) แล้วจึงส่งต่อให้ด่าน Scoring ใช้โมเดลซับซ้อนคำนวณ',
            ['ผิด โมเดล Deep Learning ให้ความแม่นยำสูงกว่า', 'ถูกต้อง! ข้อจำกัดทางวิศวกรรมเรื่องเวลาตอบสนอง (Latency Budget) ทำให้ต้องแบ่งสถาปัตยกรรมเป็นขั้น', 'ผิด โมเดลจัดอันดับได้แต่กินพลังการคำนวณสูง', 'ผิด Deep Learning ประมวลผลได้ทั้งตัวเลขและหลายสื่อ']),
          question('sum-ch1-q2', 'หากระบบมีสินค้าใหม่เพิ่งลงคลัง (New Item) โดยที่ยังไม่เคยมีผู้ใช้คนใดคลิกหรือซื้อเลย โมเดลใดต่อไปนี้จะ "ล้มเหลว" ในการแนะนำสินค้านี้?',
            ['Content-Based Filtering ที่ใช้คำอธิบายสินค้า', 'Multimodal Recommender ที่ใช้ภาพและข้อความของสินค้า', 'Pure Collaborative Filtering (User-kNN / Item-kNN ดั้งเดิม)', 'Popularity Baseline ที่จัดอันดับตามความนิยม'],
            2,
            'Pure Collaborative Filtering พึ่งพาเฉพาะประวัติปฏิสัมพันธ์ (Interaction Matrix) หากสินค้าไม่มีรอยเท้าการคลิก/ซื้อเลย จะไม่สามารถหาเพื่อนบ้านหรือสร้างเวกเตอร์ได้ เรียกว่าปัญหา Item Cold-Start',
            ['ผิด Content-Based สามารถแนะนำได้จากเนื้อหาคำบรรยาย', 'ผิด Multimodal แนะนำได้จากรูปถ่ายและข้อความ', 'ถูกต้อง! Pure CF ไม่สามารถแนะนำสินค้าใหม่ที่ไม่มีปฏิสัมพันธ์เดิมได้', 'ผิด แม้จะไม่ใช่คำตอบที่ดีแต่ระบบยอดนิยมยังทำงานได้ ส่วน CF ล้มเหลวโดยสมบูรณ์'])
        ]
      },

      /* ==========================================================================
         Task 0.2: บทที่ 2 - เข็มทิศการวัดผลและตัวชี้วัด (Evaluation & Metrics)
         ========================================================================== */
      {
        id: 'recsys-sum-metrics',
        number: '0.2',
        title: 'สรุปบทที่ 2: เข็มทิศการวัดผล (Metrics, NDCG, MRR, Offline vs Online A/B)',
        goal: 'แม่นยำสูตรคำนวณความแม่นยำ ความแตกต่างระหว่างตัวชี้วัดอันดับ และการออกแบบการทดลอง A/B Testing',
        lead: 'วัดผิด = ล้มเหลวทั้งระบบ! สรุปครบทั้งตัวชี้วัด Error, Top-K Ranking, Beyond-Accuracy และหัวใจของการทดสอบ A/B Test',
        body: `<div class="cs-card">
            <div class="cs-header">
              <h3>⚡ สรุปสูตรและการเลือกตัวชี้วัดในห้องสอบ</h3>
              <span class="cs-badge-pill">Ch 02</span>
            </div>

            <div class="cs-table-wrap">
              <table class="cs-table">
                <thead>
                  <tr>
                    <th>กลุ่มตัวชี้วัด</th>
                    <th>ตัวชี้วัด</th>
                    <th>สูตร / นิยาม</th>
                    <th>จุดเด่น &amp; จุดที่ข้อสอบชอบถาม</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td rowspan="2"><b>Rating Error (คะแนนดาว)</b></td>
                    <td><b>MAE</b></td>
                    <td>(1/|T|) ∑ |r_ui - r̂_ui|</td>
                    <td>ให้ความสำคัญกับ Error ทุกระดับเท่ากัน (Linear Penalty) มีหน่วยเดียวกับเรตติ้ง</td>
                  </tr>
                  <tr>
                    <td><b>RMSE</b></td>
                    <td>√ [ (1/|T|) ∑ (r_ui - r̂_ui)^2 ]</td>
                    <td><b>ลงโทษความผิดพลาดก้อนใหญ่หนักมาก (Quadratic Penalty)</b> ข้อสอบชอบถามความต่างกับ MAE</td>
                  </tr>
                  <tr>
                    <td rowspan="4"><b>Top-K Ranking (การจัดอันดับ)</b></td>
                    <td><b>Precision@K</b></td>
                    <td>|Recommended ∩ Relevant| / K</td>
                    <td>ในบรรดา K ชิ้นที่ระบบแนะนำ มีของที่ผู้ใช้ชอบจริงกี่เปอร์เซ็นต์ (ความแม่นยำของระบบ)</td>
                  </tr>
                  <tr>
                    <td><b>Recall@K</b></td>
                    <td>|Recommended ∩ Relevant| / |All Relevant|</td>
                    <td>ในบรรดาของทั้งหมดที่ผู้ใช้ชอบ ระบบตามเก็บมาแนะนำได้กี่เปอร์เซ็นต์ (ความครอบคลุม)</td>
                  </tr>
                  <tr>
                    <td><b>MRR</b></td>
                    <td>(1/|U|) ∑ (1 / rank_u)</td>
                    <td>ดูเฉพาะ <b>อันดับแรกสุด</b> ที่ผู้ใช้คลิก เหมาะกับ Search หรือกรณีที่ผู้ใช้ต้องการของชิ้นเดียว</td>
                  </tr>
                  <tr>
                    <td><b>NDCG@K</b></td>
                    <td>DCG@K / IDCG@K</td>
                    <td><b>มาตรฐานทองคำ (Gold Standard)!</b> ให้คะแนนตามระดับความชอบ (Graded Relevance) และหารลดน้ำหนักตามตำแหน่ง 1/log_2(i+1)</td>
                  </tr>
                  <tr>
                    <td rowspan="2"><b>Beyond Accuracy (มิติอื่น)</b></td>
                    <td><b>Catalog Coverage</b></td>
                    <td>|Items Recommended at least once| / |All Items|</td>
                    <td>วัดว่าระบบแนะนำสินค้าได้ทั่วถึงทั้งคลังหรือไม่ หรือกระจุกตัวแค่ของดัง</td>
                  </tr>
                  <tr>
                    <td><b>Novelty &amp; Diversity</b></td>
                    <td>-log_2(P(item)) และ Pairwise Dissimilarity</td>
                    <td>วัดความแปลกใหม่และความหลากหลาย ไม่ยัดเยียดสินค้าหมวดเดียวกันซ้ำๆ</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="cs-formula-card">
              <div class="cs-formula-title">📐 สูตรคำนวณ Discounted Cumulative Gain (DCG@K)</div>
              <div class="cs-formula-math">DCG@K = ∑_{i=1}^{K} [ (2^{rel_i} - 1) / log_2(i + 1) ]</div>
              <div class="cs-formula-legend">
                โดย rel_i คือระดับคะแนนความชอบของไอเทม ณ อันดับที่ i, ตัวหาร <b>log_2(i+1)</b> คือ Position Discount Factor (ยิ่งอยู่อันดับล่าง ตัวหารยิ่งโต คะแนนยิ่งถูกทอนลง)
              </div>
            </div>
            ${makeFigureHtml(
              'ndcg-position-discount.svg',
              'เส้นโค้งการลดน้ำหนักตามตำแหน่งอันดับของ NDCG (Discounted Cumulative Gain)',
              'Position Discount',
              'ตัวหารส่วนลดตำแหน่ง 1/log2(i+1) ให้ความสำคัญกับอันดับแรกๆ (Top 1-5) สูงที่สุด สอดคล้องกับพฤติกรรมการกวาดสายตาจริงของผู้ใช้'
            )}

            <div class="cs-trap-box">
              <div class="cs-trap-title">🚨 ข้อสอบ A/B Testing &amp; Data Splitting Watch-Outs</div>
              <ul>
                <li><b>Temporal Split vs Random Split:</b> ใน RecSys <u>ห้ามทำ Random Train/Test Split เด็ดขาด!</u> เพราะจะเกิด Data Leakage (เอาข้อมูลอนาคตมาทายอดีต) <b>ต้องตัดข้อมูลด้วยแกนเวลา (Temporal Split)</b> เสมอ</li>
                <li><b>Offline Metrics vs Online Business KPIs:</b> โมเดลที่ชนะเลิศ Offline NDCG <u>ไม่ได้แปลว่าจะชนะใน A/B Test จริง</u> เพราะ Offline ไม่สามารถวัดพฤติกรรมตอบสนองต่อสิ่งใหม่ (Novelty), ความเหนื่อยหน่าย (User Fatigue), หรือ Position Bias ในโลกจริงได้</li>
              </ul>
            </div>

            <div class="cs-link-box">
              <div class="cs-link-title">🔗 ทางลัดเชื่อมโยงเนื้อหาบทที่ 2</div>
              <div class="cs-btn-row">
                <a class="cs-btn-link primary" href="index.html#recsys-evaluation" target="_blank" rel="noopener noreferrer">↗ เปิดอ่านบทที่ 2 เต็มในแท็บใหม่</a>
                <a class="cs-btn-link" href="index.html#recsys-ndcg" target="_blank" rel="noopener noreferrer">↗ เจาะลึกสูตร NDCG และตัวอย่างคำนวณ</a>
                <a class="cs-btn-link" href="index.html#recsys-ab-test" target="_blank" rel="noopener noreferrer">↗ เจาะลึกระเบียบวิธี A/B Testing</a>
                <button class="cs-btn-link" type="button" onclick="window.switchRecsysChapter('recsys-evaluation')">📖 สลับไปอ่านบทที่ 2 ในหน้านี้</button>
              </div>
            </div>
          </div>`,
        sources: [],
        questions: [
          question('sum-ch2-q1', 'หากต้องการประเมินโมเดลแนะนำหนัง โดยต้องการลงโทษโมเดลอย่างหนักเป็นพิเศษเมื่อทายคะแนนดาวผิดพลาดรุนแรง (เช่น ทายว่า 5 ดาว แต่ผู้ใช้ให้ 1 ดาว) ควรเลือกตัวชี้วัดใด?',
            ['Mean Absolute Error (MAE)', 'Root Mean Squared Error (RMSE)', 'Precision@10', 'Catalog Coverage'],
            1,
            'RMSE มีการยกกำลังสองของผลต่าง Error ทำให้ค่าความผิดพลาดขนาดใหญ่ส่งผลกระทบต่อคะแนนรวมอย่างมหาศาล (Quadratic Penalty)',
            ['ผิด MAE ลงโทษเชิงเส้นเท่ากันทุกขนาดความผิดพลาด', 'ถูกต้อง! RMSE ยกกำลังสองทำให้ความผิดพลาดใหญ่ถูกลงโทษหนักมาก', 'ผิด Precision@10 วัดการจัดอันดับ Top-10 ไม่ได้วัดขนาด Error คะแนนดาว', 'ผิด Catalog Coverage วัดสัดส่วนสินค้าในคลังที่ถูกแนะนำ']),
          question('sum-ch2-q2', 'เหตุใดการทดสอบโมเดลระบบแนะนำด้วยวิธีแบ่งข้อมูลแบบ Random 80/20 Train-Test Split จึงถือเป็นข้อผิดพลาดร้ายแรง (Fatal Flaw) ในทางปฏิบัติ?',
            ['เพราะทำให้ได้ปริมาณชุดข้อมูลทดสอบน้อยเกินไป', 'เพราะทำให้เกิดการรั่วไหลของข้อมูลเวลา (Temporal Data Leakage) โดยโมเดลได้เรียนรู้ข้อมูลจากอนาคตมาทำนายอดีต', 'เพราะไม่สามารถคำนวณค่า NDCG ได้', 'เพราะคอมพิวเตอร์ประมวลผลช้าเกินไป'],
            1,
            'พฤติกรรมผู้ใช้ดำเนินไปตามลำดับเวลา หากสุ่ม Random ปฏิสัมพันธ์ในอนาคตจะหลุดเข้าไปในชุด Train ทำให้ผลการประเมินออฟไลน์ดีเกินจริงอย่างหลอกลวง',
            ['ผิด ปริมาณข้อมูล 80/20 เพียงพอในทางสถิติ', 'ถูกต้อง! ในระบบแนะนำต้องใช้ Temporal Train-Test Split ตามเส้นเวลาเสมอ', 'ผิด NDCG คำนวณได้ไม่ว่าจะแบ่งแบบใด', 'ผิด การสุ่ม Random ไม่ได้ส่งผลต่อความเร็วประมวลผล'])
        ]
      },

      /* ==========================================================================
         Task 0.3: บทที่ 3 - ระบบแนะนำจากเนื้อหา (Content-Based Filtering)
         ========================================================================== */
      {
        id: 'recsys-sum-content',
        number: '0.3',
        title: 'สรุปบทที่ 3: ระบบแนะนำจากเนื้อหา (TF-IDF, Embeddings, Bi-Encoder, MMR)',
        goal: 'เข้าใจกระบวนการสร้าง Item Profile, User Profile Centroid, การวัด Cosine Similarity และการกระจายความหลากหลายด้วย MMR',
        lead: 'ไม่ง้อข้อมูลผู้ใช้คนอื่น! สรุปการแปลงข้อความและฟีเจอร์สินค้าเป็นเวกเตอร์ การเปรียบเทียบ Bi-Encoder vs Cross-Encoder และสูตร MMR',
        body: `<div class="cs-card">
            <div class="cs-header">
              <h3>⚡ สรุปกระบวนการสร้าง Content-Based Recommender</h3>
              <span class="cs-badge-pill">Ch 03</span>
            </div>

            <ul>
              <li>
                <b>หัวใจของ Content-Based:</b> แนะนำสินค้าที่มี <i>ลักษณะเนื้อหา (Attributes / Metadata / Features)</i> คล้ายคลึงกับสินค้าที่ผู้ใช้คนนั้นเคยชอบในอดีต (User เฉพาะบุคคล ไม่พึ่งพากลุ่มผู้ใช้คนอื่น)
              </li>

              <li>
                <b>ขั้นตอนการทำงาน 3 สเต็ป:</b>
                <ol>
                  <li><b>Item Representation:</b> แปลงข้อมูลสินค้า (เรื่องย่อ, หมวดหมู่, สเปก) ให้อยู่ในรูปเวกเตอร์ เช่น <i>Sparse Vector (TF-IDF)</i> หรือ <i>Dense Embedding (BERT / Sentence-Transformers)</i></li>
                  <li><b>User Profile Construction:</b> สร้างเวกเตอร์ตัวแทนของผู้ใช้ โดยการคำนวณ <b>Centroid (เวกเตอร์เฉลี่ย)</b> ของสินค้าทั้งหมดที่ผู้ใช้เคยคลิก/ซื้อ:
                    <br><code>User_Vector = (1 / |Liked_Items|) × ∑ Item_Vector_i</code></li>
                  <li><b>Ranking by Similarity:</b> คำนวณความคล้ายคลึงระหว่าง User Vector กับ Item Vector ในคลังทั้งหมดด้วย <b>Cosine Similarity</b> แล้วเรียงลำดับจากมากไปน้อย</li>
                </ol>
              </li>
            </ul>
            ${makeFigureHtml(
              'cb-user-profile-flow.svg',
              'กระบวนการสกัดฟีเจอร์และสร้าง User Profile ใน Content-Based Filtering',
              'User Centroid Flow',
              'นำเวกเตอร์ TF-IDF หรือ Dense Embeddings ของไอเทมที่ผู้ใช้เคยชอบมารวมกันเป็น Centroid Vector เพื่อนำไปวัดความคล้ายคลึงกับสินค้าใหม่ในคลัง'
            )}

            <div class="cs-formula-card">
              <div class="cs-formula-title">📐 สูตร Cosine Similarity ระหว่าง User Profile (u) และ Item (v)</div>
              <div class="cs-formula-math">Cosine(u, v) = (u · v) / (||u|| × ||v||) = [ ∑ (u_k × v_k) ] / [ √(∑ u_k^2) × √(∑ v_k^2) ]</div>
              <div class="cs-formula-legend">
                มีค่าระหว่าง -1 ถึง 1 (หรือ 0 ถึง 1 หากเวกเตอร์เป็นบวกล้วน เช่น TF-IDF) วัดเฉพาะ <b>มุมองศา (Angle / Orientation)</b> ระหว่างเวกเตอร์ โดยไม่ขึ้นกับขนาดความยาว
              </div>
            </div>
            ${makeFigureHtml(
              'vector-cosine-similarity.svg',
              'การคำนวณความคล้ายคลึงเชิงมุมด้วย Cosine Similarity ใน Vector Space',
              'Cosine Similarity',
              'วัดเฉพาะมุมองศา (Orientation) ระหว่าง User Vector u และ Item Vector v โดยตัดผลกระทบจากขนาดความยาวของเวกเตอร์'
            )}

            <div class="cs-table-wrap">
              <table class="cs-table">
                <thead>
                  <tr>
                    <th>มิติเปรียบเทียบ</th>
                    <th>Bi-Encoder (Two-Tower Architecture)</th>
                    <th>Cross-Encoder (Full Self-Attention)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><b>โครงสร้าง</b></td>
                    <td>แยกแปลง User/Query และ Item เป็นเวกเตอร์อิสระล่วงหน้า</td>
                    <td>นำ User + Item มาต่อกัน (Concat) แล้วป้อนเข้า Transformer พร้อมกัน</td>
                  </tr>
                  <tr>
                    <td><b>ความเร็ว (Speed)</b></td>
                    <td><b>เร็วมาก (&lt;10ms)</b> ไอเทมทำ Offline Index ไว้ก่อนได้ นำมา Dot Product ทันที</td>
                    <td><b>ช้ามาก (&gt;100ms)</b> ต้องรัน Neural Net ใหม่ทุกคู่ไอเทมที่มีการจับคู่</td>
                  </tr>
                  <tr>
                    <td><b>ความแม่นยำ</b></td>
                    <td>ดีในระดับคัดกรอง (เหมาะมากกับด่าน <i>Candidate Generation</i>)</td>
                    <td><b>แม่นยำสูงสุด</b> จับความสัมพันธ์ข้ามคำได้ลึกซึ้ง (เหมาะกับด่าน <i>Re-ranking</i>)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="cs-formula-card">
              <div class="cs-formula-title">📐 Maximal Marginal Relevance (MMR) เพื่อสร้าง Diversity</div>
              <div class="cs-formula-math">MMR = argmax_{d_i ∈ R  S} [ λ × Sim_1(d_i, Q) - (1 - λ) × max_{d_j ∈ S} Sim_2(d_i, d_j) ]</div>
              <div class="cs-formula-legend">
                ถ้า <b>λ = 1</b> จะเน้นเฉพาะ Relevance ล้วน (ไม่มีความหลากหลาย อาจได้ของซ้ำๆ); ถ้า <b>λ = 0</b> จะเน้นเฉพาะความหลากหลายล้วน; ค่ามาตรฐานแนะนำ <b>λ ≈ 0.5 - 0.7</b>
              </div>
            </div>

            <div class="cs-trap-box">
              <div class="cs-trap-title">🚨 จุดแข็ง vs จุดตายของ Content-Based ที่มักออกสอบ</div>
              <ul>
                <li><b>จุดแข็ง:</b> แก้ปัญหา <i>New Item Cold-Start</i> ได้ 100% (ขอแค่มีข้อความ/สเปก ก็แนะนำได้ทันที) และสามารถ <i>อธิบายเหตุผลได้ชัดเจน (Transparent / Explainable)</i> เช่น "แนะนำเพราะคุณเคยชอบหนังแอ็กชันกำกับโดย Christopher Nolan"</li>
                <li><b>จุดตาย:</b> เกิดปัญหา <b>Over-specialization (หลงวนในกะลาเดิม)</b> และ <b>ขาด Serendipity (ไม่สามารถแนะนำของแปลกใหม่ข้ามหมวดที่ผู้ใช้อาจจะชอบได้)</b> รวมทั้งไม่สามารถแก้ปัญหา <i>New User Cold-Start</i> ได้</li>
              </ul>
            </div>

            <div class="cs-link-box">
              <div class="cs-link-title">🔗 ทางลัดเชื่อมโยงเนื้อหาบทที่ 3</div>
              <div class="cs-btn-row">
                <a class="cs-btn-link primary" href="index.html#recsys-content" target="_blank" rel="noopener noreferrer">↗ เปิดอ่านบทที่ 3 เต็มในแท็บใหม่</a>
                <a class="cs-btn-link" href="index.html#recsys-bi-encoder" target="_blank" rel="noopener noreferrer">↗ เจาะลึก Bi-Encoder vs Cross-Encoder</a>
                <a class="cs-btn-link" href="index.html#recsys-mmr" target="_blank" rel="noopener noreferrer">↗ เจาะลึกอัลกอริทึม MMR</a>
                <button class="cs-btn-link" type="button" onclick="window.switchRecsysChapter('recsys-content')">📖 สลับไปอ่านบทที่ 3 ในหน้านี้</button>
              </div>
            </div>
          </div>`,
        sources: [],
        questions: [
          question('sum-ch3-q1', 'เมื่อคำนวณอัลกอริทึม Maximal Marginal Relevance (MMR) หากผู้พัฒนาระบบกำหนดให้พารามิเตอร์ λ = 1.0 จะส่งผลต่อผลลัพธ์การแนะนำสินค้าอย่างไร?',
            ['ผลลัพธ์จะมีความหลากหลาย (Diversity) สูงสุด โดยไม่สนใจความชอบของผู้ใช้', 'ผลลัพธ์จะสนใจเฉพาะความเกี่ยวข้องกับความชอบของผู้ใช้ (Relevance) ล้วนๆ เหมือนการจัดอันดับมาตรฐานโดยไม่มีการกระจายความหลากหลาย', 'ผลลัพธ์จะสุ่มสินค้าในคลังมาแสดง', 'ระบบจะหยุดการทำงานเนื่องจากเกิดการหารด้วยศูนย์'],
            1,
            'ตามสูตร MMR: λ × Sim(Item, Query) - (1-λ) × MaxSim(Item, Selected). เมื่อ λ=1 พจน์หลังที่เป็นตัวหักคะแนนความซ้ำซ้อนจะกลายเป็น 0 เหลือเฉพาะคะแนนความชอบล้วนๆ',
            ['ผิด การได้ Diversity สูงสุดต้องตั้ง λ = 0', 'ถูกต้อง! λ=1 ทำให้เทอม Diversity หายไป กลายเป็น Pure Relevance Ranking', 'ผิด MMR ไม่ใช่โมเดลสุ่ม', 'ผิด ไม่มีตัวหารในฟังก์ชันคะแนน MMR']),
          question('sum-ch3-q2', 'ในระบบสตรีมมิ่งเพลง หากมีศิลปินหน้าใหม่เพิ่งอัปโหลดบทเพลงแรกขึ้นสู่แพลตฟอร์ม โดยยังไม่มียอดสตรีมหรือผู้ฟังคนใดกด Like เลย โมเดลในข้อใดสามารถนำเพลงนี้ไปแนะนำให้ผู้ฟังได้อย่างมีประสิทธิภาพทันที?',
            ['User-based Collaborative Filtering', 'Item-based Collaborative Filtering', 'Matrix Factorization (Funk SVD)', 'Content-based Filtering ที่สกัดฟีเจอร์เสียง (Audio Spectrum / Genres)'],
            3,
            'เพลงใหม่ไม่มีประวัติปฏิสัมพันธ์ (Interaction Matrix) โมเดลตระกูล Collaborative Filtering ทั้งหมดจะติดปัญหา Item Cold-Start ในขณะที่ Content-Based พึ่งพาเฉพาะคุณลักษณะของไฟล์เพลงจึงแนะนำได้ทันที',
            ['ผิด User-CF ต้องการประวัติการฟังเพื่อหาเพื่อนบ้าน', 'ผิด Item-CF ต้องการประวัติการฟังร่วมกันของเพลง', 'ผิด Matrix Factorization ต้องการเรตติ้งเพื่อสลายเมทริกซ์', 'ถูกต้อง! Content-Based แนะนำจากคุณลักษณะของเพลงได้ทันทีโดยไม่ต้องมีประวัติคนฟังเดิม'])
        ]
      },

      /* ==========================================================================
         Task 0.4: บทที่ 4 - การแนะนำจากข้อมูลหลายสื่อ (Multimodal Recommendations)
         ========================================================================== */
      {
        id: 'recsys-sum-multimodal',
        number: '0.4',
        title: 'สรุปบทที่ 4: การแนะนำจากข้อมูลหลายสื่อ (Multimodal Fusion, CNN, ViT, Encoders)',
        goal: 'แม่นยำความแตกต่างระหว่าง Early, Late และ Intermediate Fusion และการเลือก Encoders สำหรับรูปภาพ ข้อความ และเสียง',
        lead: 'สินค้าในโลกจริงไม่ได้มีแค่ตัวหนังสือ! สรุปการผสานสื่อรูปภาพ (Vision Transformer), ข้อความ, และเสียงเข้าสู่ระบบแนะนำยุคใหม่',
        body: `<div class="cs-card">
            <div class="cs-header">
              <h3>⚡ สรุปกลยุทธ์การผสานสื่อ (Multimodal Fusion Strategies)</h3>
              <span class="cs-badge-pill">Ch 04</span>
            </div>

            <div class="cs-table-wrap">
              <table class="cs-table">
                <thead>
                  <tr>
                    <th>กลยุทธ์การผสาน (Fusion)</th>
                    <th>วิธีการทำงาน</th>
                    <th>ข้อดีเด่น</th>
                    <th>ข้อจำกัด / ความเสี่ยง</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><b>Early Fusion (Feature-level)</b></td>
                    <td>นำเวกเตอร์ของแต่ละสื่อมาเชื่อมต่อกัน (Concatenate / Pool) ตั้งแต่ชั้นแรกสุด แล้วป้อนเข้าโมเดลร่วมกัน</td>
                    <td>จับความสัมพันธ์ข้ามสื่อได้ตั้งแต่ระดับล่างสุด โมเดลมีทัศนียภาพกว้าง</td>
                    <td>มิติเวกเตอร์บวม (High Dimensionality), ปัญหาความเร็วช้าเมื่อสื่อใดสื่อหนึ่งขาดหาย (Missing Modality)</td>
                  </tr>
                  <tr>
                    <td><b>Late Fusion (Decision-level)</b></td>
                    <td>แยกเทรนโมเดลเฉพาะสื่อจนได้ผลลัพธ์คะแนน (Scores/Predictions) แล้วนำคะแนนมารวมกันด้วย Weighted Average หรือ Voting</td>
                    <td>ยืดหยุ่นสูงมาก สื่อใดสื่อหนึ่งเสีย ระบบยังทำงานต่อได้ง่ายต่อการปรับแก้ใน Production</td>
                    <td><b>ไม่สามารถเรียนรู้ปฏิสัมพันธ์ข้ามสื่อ (Cross-Modal Correlation)</b> เช่น รูปภาพรองเท้ากับข้อความรีวิวอาจมีความหมายเสริมกันแต่ถูกแยกวิเคราะห์</td>
                  </tr>
                  <tr>
                    <td><b>Intermediate / Hybrid Fusion</b></td>
                    <td>ให้แต่ละสื่อผ่าน Encoder ลึกในระดับหนึ่ง แล้วผสานกันผ่าน <b>Cross-Attention</b> หรือ Gating Mechanism กลางโครงข่าย</td>
                    <td><b>ประสิทธิภาพสูงสุด!</b> ควบคุมน้ำหนักของสื่อตามบริบทได้อย่างยืดหยุ่น (เช่น สินค้าแฟชั่นให้น้ำหนักภาพ &gt; ข้อความ)</td>
                    <td>โครงสร้างซับซ้อน ใช้เวลาและพลังงานในการเทรนสูงขึ้น</td>
                  </tr>
                </tbody>
              </table>
            </div>
            ${makeFigureHtml(
              'multimodal-fusion-comparative.svg',
              'เปรียบเทียบสถาปัตยกรรมผสานสื่อ: Early vs Late vs Intermediate Fusion',
              'Multimodal Fusion',
              'ไดอะแกรมแสดงจุดตัดของการผสานข้อมูล: Early เชื่อมต่อเวกเตอร์ต้นน้ำ, Late ผสานคะแนนปลายน้ำ, และ Intermediate แลกเปลี่ยนความสนใจผ่าน Cross-Attention'
            )}

            <ul>
              <li>
                <b>Encoders มาตรฐานในยุคปัจจุบัน:</b>
                <ul>
                  <li><i>Image Encoders:</i> ยุคเดิมใช้ <b>CNN (ResNet, EfficientNet)</b> มองภาพผ่าน Convolution Kernel / ยุคใหม่นิยม <b>Vision Transformer (ViT)</b> หั่นภาพเป็นชิ้นย่อย (Patches 16x16) แล้วประมวลผลด้วย Self-Attention เพื่อจับโครงสร้างภาพระดับ Global</li>
                  <li><i>Text Encoders:</i> <b>BERT, RoBERTa, Sentence-Transformers</b> และ Text Embeddings จาก LLM</li>
                  <li><i>Audio Encoders:</i> แปลงสัญญาณเสียงเป็น Mel-Spectrogram แล้วประมวลผลด้วย 2D-CNN หรือใช้ <b>Wav2Vec 2.0 / Whisper</b></li>
                </ul>
              </li>
            </ul>

            <div class="cs-trap-box">
              <div class="cs-trap-title">🚨 กับดักข้อสอบเรื่อง Multimodal RecSys</div>
              <ul>
                <li><b>Modality Imbalance (การครอบงำของสื่อ):</b> หากรูปภาพมีขนาดฟีเจอร์ใหญ่กว่าข้อความ โมเดลอาจเรียนรู้เฉพาะรูปแล้วเพิกเฉยต่อข้อความ <u>วิธีแก้:</u> ใช้ <b>Modality Dropout</b> (สุ่มปิดบางสื่อตอนเทรน) เพื่อบังคับให้โมเดลพึ่งพาสื่อทุกชนิด</li>
                <li><b>Semantic Gap:</b> ฟีเจอร์ดิบระดับพิกเซลของภาพ (Low-level pixels) มีระยะห่างจากความรู้สึกเชิงนามธรรมของผู้ใช้ (High-level intent) ต้องใช้ Pre-trained Foundation Models (เช่น CLIP) เพื่อทำ Alignment ในพื้นที่เวกเตอร์ร่วมกัน</li>
              </ul>
            </div>

            <div class="cs-link-box">
              <div class="cs-link-title">🔗 ทางลัดเชื่อมโยงเนื้อหาบทที่ 4</div>
              <div class="cs-btn-row">
                <a class="cs-btn-link primary" href="index.html#recsys-multimodal" target="_blank" rel="noopener noreferrer">↗ เปิดอ่านบทที่ 4 เต็มในแท็บใหม่</a>
                <a class="cs-btn-link" href="index.html#recsys-fusion" target="_blank" rel="noopener noreferrer">↗ เจาะลึก Fusion Architectures</a>
                <a class="cs-btn-link" href="index.html#recsys-vit" target="_blank" rel="noopener noreferrer">↗ เจาะลึก Vision Transformer (ViT)</a>
                <button class="cs-btn-link" type="button" onclick="window.switchRecsysChapter('recsys-multimodal')">📖 สลับไปอ่านบทที่ 4 ในหน้านี้</button>
              </div>
            </div>
          </div>`,
        sources: [],
        questions: [
          question('sum-ch4-q1', 'หากระบบแนะนำสินค้าประเภทแฟชั่นและเสื้อผ้าต้องการผสานข้อมูลภาพถ่ายสินค้าและคำบรรยายข้อความ โดยต้องการให้สื่อภาพและข้อความสามารถ "ปรับเปลี่ยนน้ำหนักซึ่งกันและกันได้ตามบริบท" ควรเลือกกลยุทธ์การผสานสื่อ (Fusion) แบบใด?',
            ['Early Fusion (Feature Concat)', 'Late Fusion (Decision Averaging)', 'Intermediate Fusion with Cross-Attention Mechanism', 'Heuristic Majority Voting'],
            2,
            'Cross-Attention ใน Intermediate Fusion อนุญาตให้โมเดลใช้เนื้อหาข้อความไปค้นหาจุดสนใจในรูปภาพ (Text-to-Image Attention) และในทางกลับกัน ทำให้เกิดปฏิสัมพันธ์ข้ามสื่อที่มีมิติยืดหยุ่นสูงสุด',
            ['ผิด Early Fusion แค่ต่อเวกเตอร์เข้าด้วยกันโดยตรง ไม่ได้ปรับน้ำหนักตามความสนใจข้ามสื่อ', 'ผิด Late Fusion คำนวณแยกอิสระจนจบจึงจับปฏิสัมพันธ์ข้ามสื่อไม่ได้', 'ถูกต้อง! Cross-Attention คือหัวใจของการผสานสื่อแบบ Dynamic Context', 'ผิด Heuristic Voting ไม่ใช่การเรียนรู้เชิงลึก']),
          question('sum-ch4-q2', 'ในสถาปัตยกรรม Vision Transformer (ViT) ที่นำมาประยุกต์ใช้กับระบบแนะนำ ภาพสินค้าจะถูกประมวลผลเข้าสู่โครงข่าย Self-Attention อย่างไร?',
            ['ผ่านการหมุนภาพและปรับคอนทราสต์ 100 รอบ', 'แบ่งภาพออกเป็นตารางแผ่นสี่เหลี่ยมย่อยขนาดคงที่ (เช่น 16x16 Patches) แล้ว Flatten เป็นลำดับของเวกเตอร์เสมือนเป็นคำ (Tokens)', 'แปลงภาพเป็นไฟล์ข้อความ ASCII', 'ใช้เฉพาะขอบของรูปภาพโดยตัดสีทิ้งทั้งหมด'],
            1,
            'ViT ปฏิวัติงาน Computer Vision โดยมองรูปภาพเป็นเสมือนประโยคข้อความ โดยตัดภาพออกเป็น Patches ขนาดเท่าๆ กัน (เช่น 16x16) แล้วแปลงเป็น Patch Embeddings ป้อนเข้า Transformer Encoder',
            ['ผิด การหมุนภาพเป็นเทคนิค Data Augmentation ทั่วไป', 'ถูกต้อง! ViT ตัดภาพเป็น Sequence of Patches แล้วป้อนเข้า Transformer', 'ผิด ไม่มีการแปลงเป็น ASCII', 'ผิด ข้อมูลสีและพิกเซลทั้งหมดถูกนำมาสร้างเป็น Patch Vector'])
        ]
      },

      /* ==========================================================================
         Task 0.5: บทที่ 5 - การกรองแบบร่วมมือ (Collaborative Filtering & kNN)
         ========================================================================== */
      {
        id: 'recsys-sum-cf',
        number: '0.5',
        title: 'สรุปบทที่ 5: การกรองแบบร่วมมือ (User-kNN, Item-kNN, Pearson, Baseline Predictor)',
        goal: 'แม่นยำสูตร Pearson Correlation พร้อมการลบค่าเฉลี่ยส่วนบุคคล, สูตร Baseline Predictor, และความแตกต่าง User-kNN vs Item-kNN',
        lead: 'พลังแห่งปัญญาชนหมู่มาก! สรุปการหาเพื่อนบ้านที่มีรสนิยมคล้ายกัน การคำนวณทำนายคะแนน และข้อสอบคำนวณยอดฮิตเรื่อง Bias',
        body: `<div class="cs-card">
            <div class="cs-header">
              <h3>⚡ สรุปข้อแตกต่าง User-kNN vs Item-kNN</h3>
              <span class="cs-badge-pill">Ch 05</span>
            </div>

            <div class="cs-table-wrap">
              <table class="cs-table">
                <thead>
                  <tr>
                    <th>มิติเปรียบเทียบ</th>
                    <th>User-based Collaborative Filtering (User-kNN)</th>
                    <th>Item-based Collaborative Filtering (Item-kNN)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><b>แนวคิดหลัก</b></td>
                    <td>หาผู้ใช้คนอื่นที่มีประวัติการให้คะแนนคล้ายกับเรา แล้วเอาของที่พวกเขาชอบมาแนะนำเรา</td>
                    <td>หาสินค้าชิ้นอื่นที่มักได้รับคะแนนคล้ายคลึงกับสินค้าชิ้นที่เราชอบ</td>
                  </tr>
                  <tr>
                    <td><b>ขนาดมิติคำนวณ</b></td>
                    <td>ตารางผู้ใช้ |U| × |U| (ในระบบพาณิชย์ |U| มักมีจำนวนหลายล้าน เติบโตตลอดเวลา)</td>
                    <td>ตารางสินค้า |I| × |I| (จำนวนสินค้ามักคงที่และน้อยกว่าจำนวนผู้ใช้อย่างมหาศาล)</td>
                  </tr>
                  <tr>
                    <td><b>ความเสถียร (Stability)</b></td>
                    <td>ต่ำกว่า รสนิยมผู้ใช้เปลี่ยนไปตามอารมณ์และกาลเวลา</td>
                    <td><b>เสถียรกว่ามาก!</b> ความสัมพันธ์ระหว่างสินค้า (เช่น หนังแนวเดียวกัน) แทบไม่เปลี่ยนตามเวลา</td>
                  </tr>
                  <tr>
                    <td><b>การคำนวณล่วงหน้า (Precomputation)</b></td>
                    <td>ทำล่วงหน้าได้ยาก ต้องคำนวณเพื่อนบ้านแบบ Real-Time (กินพลัง CPU สูง)</td>
                    <td><b>คำนวณเมทริกซ์ความคล้ายคลึงระหว่างสินค้าออฟไลน์ล่วงหน้าได้ (Offline Batch)</b></td>
                  </tr>
                </tbody>
              </table>
            </div>
            ${makeFigureHtml(
              'cf-01-user-knn.webp',
              'User-kNN Collaborative Filtering: หาเพื่อนบ้านรสนิยมคล้ายกันเพื่อโหวตคะแนน',
              'User-kNN Voting',
              'คำนวณความคล้ายคลึงตามแถว (Rows) ลบค่าเฉลี่ยส่วนบุคคลเพื่อขจัด User Rating Bias แล้วถ่วงน้ำหนักคะแนนตามค่าความเหมือน'
            )}

            <div class="cs-formula-card">
              <div class="cs-formula-title">📐 สูตร Pearson Correlation Coefficient (Centered Cosine)</div>
              <div class="cs-formula-math">sim(u, v) = [ ∑_{i ∈ I_{uv}} (r_ui - r̄_u) × (r_vi - r̄_v) ] / [ √(∑ (r_ui - r̄_u)^2) × √(∑ (r_vi - r̄_v)^2) ]</div>
              <div class="cs-formula-legend">
                <b>จุดสำคัญที่ข้อสอบออกเสมอ:</b> ต้องนำเรตติ้งไป <b>ลบด้วยค่าเฉลี่ยของผู้ใช้คนนั้น (r̄_u และ r̄_v)</b> ก่อนเสมอ เพื่อขจัด User Bias (บางคนใจดีให้ 5 ดาวเป็นประจำ บางคนใจร้ายให้คะแนนยากสูงสุดแค่ 3 ดาว)
              </div>
            </div>

            <div class="cs-formula-card">
              <div class="cs-formula-title">📐 สูตร Baseline Predictor (หักล้าง Global, User, และ Item Bias)</div>
              <div class="cs-formula-math">b_ui = μ + b_u + b_i</div>
              <div class="cs-formula-legend">
                โดย <b>μ</b> คือค่าเฉลี่ยเรตติ้งทั้งหมดในระบบ, <b>b_u = r̄_u - μ</b> คือค่าเบี่ยงเบนของผู้ใช้, และ <b>b_i = r̄_i - μ</b> คือค่าเบี่ยงเบนของตัวสินค้า (เช่น หนังมาสเตอร์พีซ b_i จะเป็นบวกสูงมาก)
              </div>
            </div>

            <div class="cs-formula-card">
              <div class="cs-formula-title">📐 สูตรทำนายคะแนน Item-kNN โดยใช้ Baseline Predictor</div>
              <div class="cs-formula-math">r̂_ui = b_ui + [ ∑_{j ∈ S^k(i; u)} sim(i, j) × (r_uj - b_uj) ] / [ ∑_{j ∈ S^k(i; u)} |sim(i, j)| ]</div>
              <div class="cs-formula-legend">
                ทำนายคะแนนไอเทม i สำหรับผู้ใช้ u โดยเริ่มตั้งต้นจากฐาน baseline b_ui แล้วบวก/ลบด้วยคะแนนส่วนต่าง (Residuals) ของไอเทมเพื่อนบ้าน j ที่ผู้ใช้เคยให้คะแนนไว้
              </div>
            </div>
            ${makeFigureHtml(
              'cf-02-item-knn.webp',
              'Item-kNN Collaborative Filtering: หาความสัมพันธ์ระหว่างสินค้าจากประวัติการให้คะแนน',
              'Item-kNN Matrix',
              'คำนวณตามคอลัมน์ (Columns) ออฟไลน์ล่วงหน้า เหมาะสำหรับระบบที่มีจำนวนผู้ใช้ (Users) เติบโตมากกว่าสินค้า (Items)'
            )}

            <div class="cs-trap-box">
              <div class="cs-trap-title">🚨 กับดักข้อสอบ Collaborative Filtering</div>
              <ul>
                <li><b>Gray Sheep Problem:</b> ผู้ใช้ที่มีรสนิยมเฉพาะตัวสูงมากจนระบบ <i>ไม่สามารถหาเพื่อนบ้าน (k-Neighbors) ที่มีความชอบเหมือนกันได้เลย</i> โมเดล CF จะทำนายได้แย่มากสำหรับคนกลุ่มนี้</li>
                <li><b>Shilling Attack:</b> การสร้างบอตปลอมจำนวนมากเข้ามาโหวตปั่นเรตติ้ง (Push Attack หรือ Nuke Attack) ซึ่ง User-kNN จะอ่อนแอต่อการโจมตีนี้มากกว่า Item-kNN</li>
              </ul>
            </div>

            <div class="cs-link-box">
              <div class="cs-link-title">🔗 ทางลัดเชื่อมโยงเนื้อหาบทที่ 5</div>
              <div class="cs-btn-row">
                <a class="cs-btn-link primary" href="index.html#recsys-neighbors" target="_blank" rel="noopener noreferrer">↗ เปิดอ่านบทที่ 5 เต็มในแท็บใหม่</a>
                <a class="cs-btn-link" href="index.html#recsys-pearson" target="_blank" rel="noopener noreferrer">↗ เจาะลึกสูตรคำนวณ Pearson</a>
                <a class="cs-btn-link" href="index.html#recsys-baseline" target="_blank" rel="noopener noreferrer">↗ เจาะลึกสูตร Baseline Predictor</a>
                <button class="cs-btn-link" type="button" onclick="window.switchRecsysChapter('recsys-neighbors')">📖 สลับไปอ่านบทที่ 5 ในหน้านี้</button>
              </div>
            </div>
          </div>`,
        sources: [],
        questions: [
          question('sum-ch5-q1', 'สมมุติว่าในระบบ ค่าเฉลี่ยเรตติ้งรวม μ = 3.6 ดาว, ผู้ใช้ A ให้คะแนนเฉลี่ย r̄_A = 4.2 ดาว, และหนัง X ได้คะแนนเฉลี่ยรวม r̄_X = 4.0 ดาว จงคำนวณค่า Baseline Predictor (b_AX) ของผู้ใช้นี้กับหนังเรื่องนี้?',
            ['3.8 ดาว', '4.2 ดาว', '4.6 ดาว', '5.0 ดาว'],
            2,
            'b_u = 4.2 - 3.6 = +0.6; b_i = 4.0 - 3.6 = +0.4; ดังนั้น b_AX = μ + b_u + b_i = 3.6 + 0.6 + 0.4 = 4.6 ดาว',
            ['ผิด การคำนวณตกหล่นค่า Bias ของผู้ใช้', 'ผิด ลืมนำค่า Bias ของไอเทมมารวม', 'ถูกต้อง! b_AX = 3.6 + (4.2 - 3.6) + (4.0 - 3.6) = 4.6 ดาว', 'ผิด ค่าคะแนนเกินสูตร']),
          question('sum-ch5-q2', 'เหตุใดในระบบ E-commerce ขนาดใหญ่ เช่น Amazon ซึ่งมีผู้ใช้หลักร้อยล้านคนแต่มียอดสินค้าหลักสิบล้านชิ้น วิศวกรจึงเลือกใช้ Item-based CF มากกว่า User-based CF?',
            ['เพราะ Item-based CF คำนวณง่ายกว่าเนื่องจากเมทริกซ์สินค้ามีความเสถียร ไม่เปลี่ยนรวดเร็วตามอารมณ์ และคำนวณ Similarity Matrix เก็บไว้ล่วงหน้าแบบ Offline ได้', 'เพราะ Item-based CF ไม่จำเป็นต้องใช้ข้อมูลการซื้อสินค้าของผู้ใช้เลย', 'เพราะ User-based CF ไม่สามารถใช้ Pearson Correlation ได้', 'เพราะ Item-based CF ใช้ความจำน้อยกว่าเสมอในทุกกรณี'],
            0,
            'ตาราง Item-Item Similarity Matrix มีขนาดคงที่ตามจำนวนสินค้าและแทบไม่เปลี่ยนตามเวลา ทำให้สามารถ Precompute ออฟไลน์ไว้ได้ แล้วตอนรันจริงเพียงแค่อ่านตารางเทียบกับของที่ผู้ใช้เพิ่งคลิก ซึ่งเร็วกว่าการสแกนหาเพื่อนบ้านจากผู้ใช้ร้อยล้านคนแบบ Real-Time อย่างมหาศาล',
            ['ถูกต้อง! ความเสถียรและการคำนวณล่วงหน้าแบบ Offline คือเหตุผลสำคัญในเชิงวิศวกรรม', 'ผิด Item-based CF ยังคงต้องพึ่งพาประวัติการซื้อของผู้ใช้ในการสร้างเมทริกซ์', 'ผิด User-based CF ใช้งาน Pearson ได้ตามปกติ', 'ผิด มิติความจำขึ้นกับสัดส่วนผู้ใช้และสินค้า'])
        ]
      },

      /* ==========================================================================
         Task 0.6: บทที่ 6 - เมทริกซ์แฟกทอไรเซชันและโมเดลเชิงลึก (MF & Deep Learning)
         ========================================================================== */
      {
        id: 'recsys-sum-models',
        number: '0.6',
        title: 'สรุปบทที่ 6: การแยกตัวประกอบเมทริกซ์และโมเดลการเรียนรู้เชิงลึก (SVD, BPR, NCF, Two-Tower)',
        goal: 'แม่นยำฟังก์ชัน Loss ของ Funk SVD, อัลกอริทึม BPR สำหรับ Implicit Ranking, โครงสร้าง Neural CF, และ Two-Tower DSSM Architecture',
        lead: 'ก้าวข้ามขีดจำกัดของความเบาบาง (Sparsity)! สรุปคณิตศาสตร์เบื้องหลังรางวัล Netflix Prize สู่โครงข่ายประสาท Two-Tower ระดับพันล้านไอเทม',
        body: `<div class="cs-card">
            <div class="cs-header">
              <h3>⚡ สรุปวิวัฒนาการโมเดลจาก SVD สู่ Two-Tower</h3>
              <span class="cs-badge-pill">Ch 06</span>
            </div>

            <ul>
              <li>
                <b>Matrix Factorization (MF) Core Idea:</b>
                สลายเมทริกซ์เรตติ้งขนาดใหญ่ที่แหว่งเบาบาง $R (|U| 	imes |I|)$ ให้อยู่ในรูปผลคูณของเมทริกซ์เวกเตอร์แฝง 2 ชิ้น: <b>User Matrix P (|U| × k)</b> และ <b>Item Matrix Q (|I| × k)</b> โดย $k ll min(|U|, |I|)$
              </li>
            </ul>

            <div class="cs-formula-card">
              <div class="cs-formula-title">📐 ฟังก์ชันเป้าหมาย Funk SVD พร้อม L2 Regularization</div>
              <div class="cs-formula-math">Loss = ∑_{(u,i) ∈ R} (r_ui - (μ + b_u + b_i + p_u · q_i))^2 + λ (b_u^2 + b_i^2 + ||p_u||^2 + ||q_i||^2)</div>
              <div class="cs-formula-legend">
                เทอมแรกคือ Squared Error บนเรตติ้งที่มีอยู่จริง เทอมหลัง <b>λ (L2 Norm) ป้องกันปัญหา Overfitting</b> บนคู่ที่มีข้อมูลน้อย อัปเดตพารามิเตอร์ด้วย Stochastic Gradient Descent (SGD)
              </div>
            </div>
            ${makeFigureHtml(
              'matrix-factorization-uv.svg',
              'Matrix Factorization: การแยกตัวประกอบเมทริกซ์เรตติ้ง R ≈ U · V^T',
              'Latent Factors',
              'บีบอัดเมทริกซ์ที่เบาบาง (Sparse) ให้อยู่ในรูปเวกเตอร์แฝงมิติต่ำ (k-dimensional latent factors) โดย Funk SVD และ Alternating Least Squares (ALS)'
            )}

            <ul>
              <li>
                <b>BPR (Bayesian Personalized Ranking):</b>
                ออกแบบมาเพื่อ <b>Implicit Feedback (คลิก/ไม่คลิก)</b> โดยเฉพาะ เปลี่ยนมุมมองจากการทายค่าคะแนนเดี่ยวๆ (Pointwise) มาเป็นการ <b>เปรียบเทียบเป็นคู่ (Pairwise Loss)</b>:
                <br><code>Loss_BPR = - ∑ ln σ(x̂_ui - x̂_uj) + λ ||Θ||^2</code> (โดยไอเทม i คือของที่เคยคลิก, ไอเทม j คือของที่ยังไม่เคยคลิก &rarr; บังคับให้คะแนนของ i ชนะ j เสมอ)
              </li>

              <li>
                <b>Neural Collaborative Filtering (NCF):</b>
                ชี้ให้เห็นว่าผลคูณ Dot Product ($p_u cdot q_i$) ใน MF แบบดั้งเดิมมีข้อจำกัดด้านความสัมพันธ์เชิงเส้น (Linear Limitation) จึงผสานเส้นทาง <b>GMF (Generalized Matrix Factorization)</b> เข้ากับ <b>MLP (Multi-Layer Perceptron)</b> เพื่อเรียนรู้ Non-linear Interaction
              </li>

              <li>
                <b>Two-Tower DSSM Architecture (หัวใจของ Candidate Generation ยุคใหม่):</b>
                <ul>
                  <li><b>User Tower:</b> รับข้อมูล User ID, ประวัติการคลิก, อุปกรณ์, บริบทเวลา &rarr; ย่อยออกมาเป็น User Embedding เวกเตอร์เดี่ยว $u in mathbb{R}^d$</li>
                  <li><b>Item Tower:</b> รับข้อมูล Item ID, หมวดหมู่, ภาพ, คำบรรยาย &rarr; ย่อยออกมาเป็น Item Embedding เวกเตอร์เดี่ยว $v in mathbb{R}^d$</li>
                  <li><b>จุดเด่นระดับโลก:</b> ทั้งสอง Tower แยกขาดจากกัน ทำให้สามารถแปลงสินค้าหลายล้านชิ้นเป็นเวกเตอร์ล่วงหน้า แล้วนำมาค้นหาแบบ <b>Maximum Inner Product Search (MIPS / Faiss) ในเวลา &lt; 10 ms!</b></li>
                </ul>
              </li>
            </ul>
            ${makeFigureHtml(
              'two-tower-retrieval-architecture.svg',
              'Two-Tower Neural Retrieval Architecture (DSSM / Dual-Encoder)',
              'Two-Tower DSSM',
              'แยกหอคอย User Tower และ Item Tower คำนวณเวกเตอร์คู่ขนาน ดึงไอเทมหลักล้านชิ้นด้วย ANN Vector Search (MIPS / Faiss / ScaNN) ในระดับมิลลิวินาที'
            )}

            <div class="cs-trap-box">
              <div class="cs-trap-title">🚨 จุดที่ข้อสอบชอบเปรียบเทียบระหว่าง SGD และ ALS</div>
              <ul>
                <li><b>SGD (Stochastic Gradient Descent):</b> อัปเดตทีละตัวอย่าง เร็วกว่า ใช้หน่วยความจำน้อยกว่า เหมาะกับข้อมูลขนาดใหญ่และ Explicit Feedback</li>
                <li><b>ALS (Alternating Least Squares):</b> สลับกันตรึงเวกเตอร์ P แล้วแก้สมการหา Q จากนั้นตรึง Q หา P <u>สามารถทำ Parallelization กระจายงานขนานบนคลัสเตอร์ได้ดีเยี่ยม</u> และเหมาะกับข้อมูล Implicit Feedback ที่แปลงเป็น Confidence Matrix (WRMF)</li>
              </ul>
            </div>

            <div class="cs-link-box">
              <div class="cs-link-title">🔗 ทางลัดเชื่อมโยงเนื้อหาบทที่ 6</div>
              <div class="cs-btn-row">
                <a class="cs-btn-link primary" href="index.html#recsys-models" target="_blank" rel="noopener noreferrer">↗ เปิดอ่านบทที่ 6 เต็มในแท็บใหม่</a>
                <a class="cs-btn-link" href="index.html#recsys-svd" target="_blank" rel="noopener noreferrer">↗ เจาะลึก Funk SVD และคณิตศาสตร์</a>
                <a class="cs-btn-link" href="index.html#recsys-bpr" target="_blank" rel="noopener noreferrer">↗ เจาะลึก Bayesian Personalized Ranking</a>
                <button class="cs-btn-link" type="button" onclick="window.switchRecsysChapter('recsys-models')">📖 สลับไปอ่านบทที่ 6 ในหน้านี้</button>
              </div>
            </div>
          </div>`,
        sources: [],
        questions: [
          question('sum-ch6-q1', 'ในการเทรนโมเดล Matrix Factorization ด้วยฟังก์ชันสูตรของ Funk SVD เทอมที่มีค่าสัมประสิทธิ์ λ (L2 Regularization) มีบทบาทสำคัญที่สุดในข้อใด?',
            ['ช่วยเร่งความเร็วในการคำนวณ Gradient ให้ลู่เข้าสู่จุดต่ำสุดเร็วขึ้น 10 เท่า', 'ป้องกันไม่ให้ค่าน้ำหนักในเวกเตอร์แฝง p_u และ q_i มีขนาดใหญ่เกินไปจนเกิดปัญหา Overfitting บนไอเทมที่มีผู้ใช้รีวิวน้อย', 'ทำหน้าที่แปลงข้อมูล Explicit เรตติ้งให้เป็น Implicit ทันที', 'ช่วยสุ่มเลือกค่าไอเทมที่ไม่เคยถูกคลิกมาเป็น Negative Sample'],
            1,
            'หากไม่มี Regularization ไอเทมที่มีผู้ใช้ให้คะแนนเพียงแค่คนเดียวอาจทำให้โมเดลปรับเวกเตอร์จนฟิตกับคนนั้น 100% แต่ไม่สามารถนำไปทำนายผู้ใช้คนอื่นได้ (Overfitting) L2 Norm จะคอยดึงน้ำหนักไม่ให้ป่องเกินไป',
            ['ผิด Regularization ไม่ได้เร่งความเร็ว แต่มักทำให้การเทรนต้องระวังเรื่อง Step Size', 'ถูกต้อง! L2 Regularization ควบคุมขนาดเวกเตอร์เพื่อขจัดปัญหา Overfitting', 'ผิด ไม่ได้เปลี่ยนชนิดข้อมูล Explicit/Implicit', 'ผิด การสุ่ม Negative Sample เป็นขั้นตอนของ BPR']),
          question('sum-ch6-q2', 'ในระบบ Candidate Generation เหตุใดสถาปัตยกรรม Two-Tower Neural Network จึงสามารถค้นหาไอเทมที่เกี่ยวข้องจากคลังสินค้า 10 ล้านชิ้นได้ภายในเวลาไม่เกิน 15 มิลลิวินาที?',
            ['เพราะโมเดลใช้ Cross-Attention คำนวณความสัมพันธ์ระหว่าง User และ Item แบบสดๆ ทุกคู่', 'เพราะฝั่ง Item Tower สามารถประมวลผลแปลงสินค้าทั้ง 10 ล้านชิ้นเป็นเวกเตอร์เก็บไว้ใน Vector Database (ANN Index) ล่วงหน้าได้ ทำให้ตอน Query จริงเหลือเพียงการคำนวณ Inner Product กับ User Vector เดี่ยว', 'เพราะโมเดลลดขนาดสินค้าเหลือเพียง 100 ชิ้นก่อนคำนวณเสมอ', 'เพราะโมเดล Two-Tower ไม่ใช้คณิตศาสตร์เมทริกซ์'],
            1,
            'เนื่องจากหอคอยทั้งสองไม่ขึ้นต่อกัน (Decoupled) เวกเตอร์สินค้า 10 ล้านชิ้นจึงคำนวณแบบ Offline ไว้ล่วงหน้าและสร้างดัชนี ANN (เช่น HNSW / ScaNN / Faiss) เมื่อมีคำขอเข้ามา ระบบรันเฉพาะ User Tower แล้วนำเวกเตอร์ที่ได้ไปเสิร์ชความคล้ายคลึงในเสี้ยววินาที',
            ['ผิด Cross-Attention ต้องคำนวณสดทุกคู่ทำให้ช้าเกินไปสำหรับด่าน Retrieval', 'ถูกต้อง! การแยกหอคอยทำให้ Pre-index ไอเทมฝั่งขวาไว้ใน Vector DB ล่วงหน้าได้', 'ผิด การตัดเหลือ 100 ชิ้นคือหน้าที่ของด่านถัดไป ไม่ใช่การสุ่มตัดตั้งแต่ต้น', 'ผิด Two-Tower ใช้งานเวกเตอร์และเมทริกซ์เต็มรูปแบบ'])
        ]
      },

      /* ==========================================================================
         Task 0.7: บทที่ 7 - พลังของ Large Language Models (LLM-Powered RecSys)
         ========================================================================== */
      {
        id: 'recsys-sum-llm',
        number: '0.7',
        title: 'สรุปบทที่ 7: พลังของ Large Language Models ในระบบแนะนำ (LLM-Powered RecSys)',
        goal: 'เข้าใจบทบาทของ LLM ทั้ง 3 มิติ (Feature Extractor, Scoring Reranker, Agent) และกระบวนการพร้อมต์ Pointwise, Pairwise, Listwise',
        lead: 'ยุคปฏิวัติ Generative AI! สรุปการประยุกต์ใช้โมเดลภาษาขนาดใหญ่ ปัญหาภาพหลอน (Hallucination) และข้อจำกัดด้าน Latency ในงานระบบแนะนำ',
        body: `<div class="cs-card">
            <div class="cs-header">
              <h3>⚡ 3 บทบาทหลักของ LLM ใน Recommender Systems</h3>
              <span class="cs-badge-pill">Ch 07</span>
            </div>

            <ol>
              <li>
                <b>LLM as Feature Encoder (ต้นน้ำ):</b>
                ใช้ LLM สกัดความหมายเชิงลึก (World Knowledge & Common Sense) จากข้อความรีวิวและชื่อสินค้า แล้วส่งออกเป็น Dense Embedding ให้กับโมเดล RecSys ดั้งเดิม (เช่น Two-Tower) ช่วยแก้ปัญหา <i>Cold-Start</i> และ <i>Cross-Domain</i> ได้อย่างยอดเยี่ยม
              </li>
              <li>
                <b>LLM as Scoring &amp; Reranker (ปลายน้ำ):</b>
                นำรายการสินค้า Top-20 จากด่าน Scoring มาป้อนให้ LLM พร้อมข้อมูลประวัติผู้ใช้ เพื่อให้ LLM ช่วยตัดสินใจจัดอันดับใหม่ (Rerank) ตามความต้องการที่ซับซ้อนของผู้ใช้
              </li>
              <li>
                <b>LLM as Conversational Agent (โต้ตอบรอบด้าน):</b>
                ทำหน้าที่เป็นผู้ช่วยชอปปิงอัจฉริยะ (เช่น ChatGPT Shopping Plugin) ซักถามความต้องการของผู้ใช้ในรูปแบบบทสนทนาโต้ตอบหลายรอบ (Multi-turn Conversation)
              </li>
            </ol>

            <div class="cs-table-wrap">
              <table class="cs-table">
                <thead>
                  <tr>
                    <th>กลยุทธ์การพร้อมต์ (Prompting Paradigm)</th>
                    <th>รูปแบบการส่งข้อมูลเข้า LLM</th>
                    <th>ข้อดีเด่น</th>
                    <th>ข้อเสีย / ข้อควรระวัง</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><b>Pointwise Prompting</b></td>
                    <td>ส่งไอเทมทีละชิ้นพร้อมประวัติผู้ใช้ ให้ LLM ให้คะแนน 1-5 หรือตอบ Yes/No</td>
                    <td>เข้าใจง่าย เป็นอิสระต่อกัน ไม่ติดปัญหาข้อจำกัดความยาว Context Window</td>
                    <td>ค่าใช้จ่าย Token สูง (ต้องยิง API เท่ากับจำนวนไอเทม) และ <i>ไม่เห็นภาพรวมของการเปรียบเทียบในรายการ</i></td>
                  </tr>
                  <tr>
                    <td><b>Pairwise Prompting</b></td>
                    <td>ส่งสินค้าเป็นคู่ (Item A vs Item B) ให้ LLM เลือกว่าผู้ใช้น่าจะชอบชิ้นไหนมากกว่า</td>
                    <td>ความแม่นยำสูง ลดปัญหาความลำเอียงเรื่องสเกลคะแนน</td>
                    <td>จำนวนคู่ระเบิดเป็น O(N^2) ทำให้เวลาประมวลผล (Latency) สูงมากหากมีหลายไอเทม</td>
                  </tr>
                  <tr>
                    <td><b>Listwise Prompting</b></td>
                    <td>ส่งรายการสินค้าทั้งหมด (เช่น 10-20 ชิ้น) เข้าไปพร้อมกัน ให้ LLM จัดอันดับใหม่ทั้งหมด</td>
                    <td><b>ประหยัด Token ที่สุด</b> และ LLM สามารถสร้าง <i>Diversity และพิจารณาความสัมพันธ์ร่วมกันในลิสต์ได้</i></td>
                    <td>เกิดปัญหา <b>Position Bias ใน Prompt</b> (LLM มักชอบหยิบไอเทมที่อยู่หัวลิสต์หรือท้ายลิสต์มาแนะนำ) และเสี่ยงอาการหลอน (Hallucination)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            ${makeFigureHtml(
              'llm-prompting-strategies.svg',
              'สถาปัตยกรรมพร้อมต์ของ LLM ในระบบแนะนำ: Pointwise vs Pairwise vs Listwise',
              'LLM Prompting',
              'เปรียบเทียบกลยุทธ์การป้อนบริบทสินค้าเข้าสู่ LLM: Pointwise คำนวณเดี่ยว, Pairwise เปรียบเทียบเป็นคู่, และ Listwise จัดเรียงทั้งรายการ'
            )}

            <div class="cs-trap-box">
              <div class="cs-trap-title">🚨 Production Trilemma ของ LLM ใน RecSys ที่ข้อสอบชอบถาม</div>
              <ul>
                <li><b>Latency Budget:</b> LLM ยุคปัจจุบันใช้เวลาประมวลผล 200ms - 2,000ms ต่อคำขอ ซึ่ง <u>เกิน SLA ปกติของระบบแนะนำ (<50ms)</u> ดังนั้นจึง **เป็นไปไม่ได้ที่จะใช้ LLM ในด่าน Candidate Generation** ในระบบระดับล้านไอเทม</li>
                <li><b>Cost &amp; Token Economy:</b> การส่งประวัติการคลิกหลักร้อยรายการเข้าไปใน Prompt ทุกๆ วินาทีทำให้ค่าใช้จ่าย API ระเบิดมหาศาล</li>
                <li><b>Hallucination:</b> LLM อาจ "แต่งชื่อสินค้าขึ้นมาเอง" ที่ไม่มีอยู่จริงในคลังสินค้า ต้องใช้เทคนิค <i>Constrained Decoding (Trie Search)</i> หรือ RAG ล็อค ID สินค้าจริงเท่านั้น</li>
              </ul>
            </div>

            <div class="cs-link-box">
              <div class="cs-link-title">🔗 ทางลัดเชื่อมโยงเนื้อหาบทที่ 7</div>
              <div class="cs-btn-row">
                <a class="cs-btn-link primary" href="index.html#recsys-llm" target="_blank" rel="noopener noreferrer">↗ เปิดอ่านบทที่ 7 เต็มในแท็บใหม่</a>
                <a class="cs-btn-link" href="index.html#recsys-llm-rerank" target="_blank" rel="noopener noreferrer">↗ เจาะลึกเทคนิค LLM Reranker</a>
                <a class="cs-btn-link" href="index.html#recsys-constrained" target="_blank" rel="noopener noreferrer">↗ เจาะลึก Constrained Decoding ป้องกันภาพหลอน</a>
                <button class="cs-btn-link" type="button" onclick="window.switchRecsysChapter('recsys-llm')">📖 สลับไปอ่านบทที่ 7 ในหน้านี้</button>
              </div>
            </div>
          </div>`,
        sources: [],
        questions: [
          question('sum-ch7-q1', 'หากทีมวิศวกรนำ LLM (เช่น GPT-4 หรือ Gemini) มาทำหน้าที่เป็น Listwise Reranker สำหรับจัดอันดับสินค้า 20 ชิ้นสุดท้ายก่อนแสดงผล ปรากฏการณ์ความลำเอียง (Bias) ใดที่มักพบได้บ่อยในตัวโมเดล LLM เอง?',
            ['Popularity Bias ที่แนะนำเฉพาะของราคาแพง', 'Position Bias ใน Prompt โดยโมเดลมีแนวโน้มจะให้คะแนนหรือเลือกไอเทมที่ถูกจัดวางไว้ตำแหน่งแรกสุดหรือท้ายสุดของ Prompt สูงกว่าความเป็นจริง', 'Negative Sampling Failure', 'Cold-Start User Bias'],
            1,
            'ปรากฏการณ์ "Lost in the Middle" ของ LLM ทำให้โมเดลจดจำและให้น้ำหนักกับข้อความส่วนต้นและส่วนท้ายของ Prompt มากกว่าข้อความตรงกลาง ส่งผลให้เกิด Position Bias ในการจัดอันดับสินค้า',
            ['ผิด ไม่ได้เกี่ยวกับราคาสินค้า', 'ถูกต้อง! LLM มี Position Bias ชอบสินค้าหัวแถวและท้ายแถวใน Prompt', 'ผิด ไม่ใช่ปัญหาเรื่อง Negative Sampling', 'ผิด Cold-Start เป็นคุณสมบัติของระบบไม่ใช่ตัว LLM']),
          question('sum-ch7-q2', 'ในทางสถาปัตยกรรมระบบ เหตุใดในปัจจุบันเราจึงไม่สามารถนำ LLM แบบ Autoregressive ขนาด 70B มาทำหน้าที่เป็นโมเดลสำหรับด่าน Candidate Generation (คัดกรองสินค้าหลักล้านชิ้น) ได้โดยตรง?',
            ['เพราะ LLM ไม่สามารถเข้าใจภาษาไทยได้', 'เพราะเวลาในการประมวลผล (Inference Latency) ของ LLM อยู่ในระดับร้อยมิลลิวินาทีถึงวินาที ซึ่งขัดแย้งกับข้อกำหนดด้านความเร็วของด่าน Retrieval ที่ต้องต่ำกว่า 15-20 มิลลิวินาที', 'เพราะ LLM ไม่มีหน่วยความจำ', 'เพราะสินค้าในคลังไม่สามารถแปลงเป็นข้อความได้'],
            1,
            'ด่านแรกของ RecSys ต้องรองรับการค้นหาสินค้าจากคลังหลักล้านชิ้นด้วยความเร็วระดับ 10-20ms ซึ่ง LLM มีค่า Latency และต้นทุน Token สูงเกินกว่าจะนำมาประมวลผลล้านไอเทมสดๆ ได้',
            ['ผิด LLM ปัจจุบันเข้าใจภาษาไทยได้ดีมาก', 'ถูกต้อง! ข้อจำกัดเรื่อง Latency และพลังการคำนวณทำให้ LLM ทำหน้าที่ได้แค่ออฟไลน์ หรืออยู่ด่านปลายน้ำ (Re-ranking)', 'ผิด LLM บันทึกน้ำหนักความจำในพารามิเตอร์', 'ผิด สินค้าแปลงเป็นข้อความได้ตามปกติ'])
        ]
      },

      /* ==========================================================================
         Task 0.8: บทที่ 8 - จริยธรรมและความน่าเชื่อถือ (Responsible RecSys)
         ========================================================================== */
      {
        id: 'recsys-sum-responsible',
        number: '0.8',
        title: 'สรุปบทที่ 8: จริยธรรม ความเป็นธรรม และความปลอดภัย (Fairness, Privacy, Attacks)',
        goal: 'แม่นยำนิยามความยุติธรรมทั้งสองฝั่ง (C-Fairness vs P-Fairness), การคำนวณ Gini Index, กลไก Differential Privacy, และประเภทการโจมตี Shilling Attack',
        lead: 'ระบบที่ดีต้องไม่ทำลายสังคม! สรุปครบทั้งเรื่องความยุติธรรมของผู้ผลิตและผู้บริโภค การปกป้องข้อมูลส่วนบุคคล (Federated Learning) และการป้องกันบอตปั่นคะแนน',
        body: `<div class="cs-card">
            <div class="cs-header">
              <h3>⚡ สรุป 4 เสาหลักของ Responsible AI ในระบบแนะนำ</h3>
              <span class="cs-badge-pill">Ch 08</span>
            </div>

            <div class="cs-table-wrap">
              <table class="cs-table">
                <thead>
                  <tr>
                    <th>เสาหลัก</th>
                    <th>ปัญหาที่เกิดขึ้นในระบบจริง</th>
                    <th>นิยาม &amp; กลไกทางเทคนิค</th>
                    <th>แนวทางแก้ไข (Mitigation)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><b>Fairness (ความเป็นธรรม)</b></td>
                    <td>ระบบลำเอียงแนะนำเฉพาะผู้ผลิตรายใหญ่ หรือเลือกปฏิบัติกับผู้ใช้บางเพศ/เชื้อชาติ</td>
                    <td><b>C-Fairness (Consumer):</b> ประสิทธิภาพระบบต้องเท่าเทียมกันในทุกกลุ่มผู้ใช้<br><b>P-Fairness (Producer):</b> ผู้ผลิตสินค้าทุกรายต้องได้รับโอกาสการแสดงผลอย่างเป็นธรรม</td>
                    <td>ทำ <i>Fair Re-ranking</i>, เพิ่มโควตาการแสดงผลขั้นต่ำให้ผู้ผลิตรายย่อย</td>
                  </tr>
                  <tr>
                    <td><b>Bias Mitigation</b></td>
                    <td><b>Popularity Bias:</b> สินค้า 20% หัวแถว กวาดพื้นที่แสดงผลไป 80% เบียดบังสินค้าหางยาว</td>
                    <td>วัดด้วย <b>Gini Index</b> และเส้นโค้ง <b>Lorenz Curve</b> (ยิ่ง Gini ใกล้ 1 แปลว่ากระจุกตัวสูงมาก)</td>
                    <td>ทำ <i>Inverse Propensity Scoring (IPS)</i> ถ่วงน้ำหนักชดเชยให้ของหายาก</td>
                  </tr>
                  <tr>
                    <td><b>Privacy (ความเป็นส่วนตัว)</b></td>
                    <td>ประวัติการคลิกสามารถเปิดเผยข้อมูลอ่อนไหว (เช่น โรคประจำตัว รสนิยมทางเพศ)</td>
                    <td><b>Differential Privacy (DP):</b> เติมสัญญาณรบกวน (Laplace / Gaussian Noise) เพื่อไม่ให้ใครสืบย้อนได้ว่ามีผู้ใช้คนใดคนหนึ่งอยู่ใน Dataset หรือไม่</td>
                    <td><b>Federated Learning:</b> ส่งเฉพาะค่าน้ำหนักโมเดลมารวมกันที่ Server โดยข้อมูลดิบของผู้ใช้ไม่เคยหลุดออกจากโทรศัพท์มือถือ</td>
                  </tr>
                  <tr>
                    <td><b>Robustness &amp; Security</b></td>
                    <td>คู่แข่งหรือผู้ขายสร้างบัญชีปลอมเข้ามารีวิวปั่นยอด (Fake Reviews)</td>
                    <td><b>Push Attack:</b> ปั่นสินค้าตนเองให้ติด Top-K<br><b>Nuke Attack:</b> กดลดเรตติ้งคู่แข่งให้หลุดจากระบบ</td>
                    <td>ตรวจจับ <i>Rating Velocity</i> (อัตราเร่งการให้คะแนนที่ผิดธรรมชาติ) และตัด Co-visitation ผิดปกติ</td>
                  </tr>
                </tbody>
              </table>
            </div>
            ${makeFigureHtml(
              'lorenz-gini-curve.svg',
              'เส้นโค้งลอเรนซ์และสัมประสิทธิ์จีนี (Lorenz Curve & Gini Index) วัด Popularity Bias',
              'Gini Curve',
              'วัดความไม่เท่าเทียมของการแสดงผล (Exposure Inequality) ยิ่งเส้นโค้งเบี่ยงออกจากเส้นเสมอภาค 45 องศามากเท่าไร แสดงว่าระบบแนะนำกระจุกตัวอยู่เฉพาะสินค้าหัวแถวมากเท่านั้น'
            )}

            <div class="cs-formula-card">
              <div class="cs-formula-title">📐 การวัดการกระจุกตัวด้วยสัมประสิทธิ์จีนี (Gini Index)</div>
              <div class="cs-formula-math">G = [ ∑_{i=1}^{n} (2i - n - 1) × x_i ] / [ n × ∑_{i=1}^{n} x_i ]</div>
              <div class="cs-formula-legend">
                มีค่าระหว่าง <b>0 ถึง 1</b>; ถ้า <b>G = 0</b> หมายถึงสินค้าทุกชิ้นในคลังได้รับการแนะนำเท่าเทียมกันสมบูรณ์; ถ้า <b>G = 1</b> หมายถึงสินค้าเพียงชิ้นเดียวกวาดพื้นที่แนะนำทั้งหมดในระบบ
              </div>
            </div>

            <div class="cs-trap-box">
              <div class="cs-trap-title">🚨 ข้อสอบจำแนกประเภท Shilling Attack ยอดฮิต</div>
              <ul>
                <li><b>Random Attack:</b> บอตให้คะแนนสินค้าเป้าหมาย 5 ดาว ส่วนสินค้าอื่นสุ่มให้คะแนนกระจายๆ (ป้องกันง่าย)</li>
                <li><b>Average Attack:</b> บอตให้คะแนนสินค้าเป้าหมาย 5 ดาว ส่วนสินค้าอื่นให้คะแนนเท่ากับค่าเฉลี่ยของสินค้านั้นๆ (ตรวจจับยากขึ้นมาก)</li>
                <li><b>Bandwagon Attack:</b> บอตให้คะแนนสินค้าเป้าหมาย 5 ดาว และแอบให้ 5 ดาวกับ <i>สินค้าดังระดับบล็อกบัสเตอร์</i> เพื่อเนียนผูกมิตรภาพร่วมกับผู้ใช้ส่วนใหญ่ในระบบ</li>
              </ul>
            </div>

            <div class="cs-link-box">
              <div class="cs-link-title">🔗 ทางลัดเชื่อมโยงเนื้อหาบทที่ 8</div>
              <div class="cs-btn-row">
                <a class="cs-btn-link primary" href="index.html#recsys-responsible" target="_blank" rel="noopener noreferrer">↗ เปิดอ่านบทที่ 8 เต็มในแท็บใหม่</a>
                <a class="cs-btn-link" href="index.html#recsys-fairness" target="_blank" rel="noopener noreferrer">↗ เจาะลึก C-Fairness vs P-Fairness</a>
                <a class="cs-btn-link" href="index.html#recsys-attacks" target="_blank" rel="noopener noreferrer">↗ เจาะลึกรูปแบบ Shilling Attacks</a>
                <button class="cs-btn-link" type="button" onclick="window.switchRecsysChapter('recsys-responsible')">📖 สลับไปอ่านบทที่ 8 ในหน้านี้</button>
              </div>
            </div>
          </div>`,
        sources: [],
        questions: [
          question('sum-ch8-q1', 'ในแพลตฟอร์มส่งอาหาร (Food Delivery) หากร้านอาหารชื่อดังระดับตำนานเพียง 5% กวาดพื้นที่หน้าแรกของแอปพลิเคชันไปเกือบทั้งหมด ทำให้ร้านอาหารขนาดเล็กริมทางไม่มีโอกาสถูกมองเห็นเลย ปัญหานี้จัดเป็นความไม่เป็นธรรม (Unfairness) ในมิติใด?',
            ['Consumer Fairness (C-Fairness)', 'Producer Fairness (P-Fairness)', 'Differential Privacy Breach', 'Data Leakage'],
            1,
            'Producer Fairness (P-Fairness) มุ่งเน้นความยุติธรรมฝั่งผู้ผลิตหรือร้านค้า ว่าต้องได้รับโอกาสการแสดงผล (Exposure) อย่างสมเหตุสมผล ไม่ถูกเบียดบังจากอิทธิพลความนิยมของร้านยักษ์ใหญ่จนหมด',
            ['ผิด C-Fairness เน้นฝั่งผู้บริโภค เช่น คุณภาพการแนะนำอาหารไม่ลำเอียงตามกลุ่มลูกค้า', 'ถูกต้อง! P-Fairness ดูแลความยุติธรรมในการเข้าถึงผู้ซื้อของฝั่งร้านค้า/ผู้ผลิต', 'ผิด ไม่ใช่เรื่องความเป็นส่วนตัว', 'ผิด ไม่ใช่เรื่องการรั่วไหลของข้อมูลเทรน']),
          question('sum-ch8-q2', 'เทคนิค Federated Learning ช่วยยกระดับด้าน Privacy ให้กับแอปพลิเคชันระบบแนะนำบนสมาร์ตโฟนได้อย่างไร?',
            ['แปลงรูปภาพทั้งหมดให้เป็นภาพขาวดำก่อนส่งขึ้น Cloud', 'ประมวลผลและเทรนโมเดลบนอุปกรณ์มือถือของผู้ใช้โดยตรง และส่งเฉพาะค่า Gradient / Weights อัปเดตขึ้นไปรวมกันที่ Server โดยข้อมูลประวัติการใช้งานจริงไม่เคยออกจากตัวเครื่อง', 'ลบรหัสผ่านของผู้ใช้ออกจากฐานข้อมูล', 'บล็อกบอตปั่นเรตติ้งได้ 100%'],
            1,
            'Federated Learning ทำงานภายใต้สโลแกน "Bring the code to the data, not the data to the code" ผู้ใช้เทรนโมเดลส่วนตัวในมือถือ แล้วส่งเฉพาะตัวเลขการปรับน้ำหนัก (Model Updates) มารวมกันแบบนิรนาม',
            ['ผิด การแปลงภาพขาวดำไม่ได้ช่วยด้าน Privacy', 'ถูกต้อง! ข้อมูลการใช้งานส่วนตัวคงอยู่ในอุปกรณ์ของผู้ใช้ ไม่ต้องอัปโหลดขึ้นเซิร์ฟเวอร์ส่วนกลาง', 'ผิด ไม่ได้เกี่ยวข้องกับการจัดการรหัสผ่าน', 'ผิด Federated Learning มุ่งเน้น Privacy ไม่ใช่การป้องกัน Shilling Attack'])
        ]
      },

      /* ==========================================================================
         Task 0.9: บทที่ 9 - สังเคราะห์สู่ห้องสอบ (Capstone Synthesis & Decision Matrix)
         ========================================================================== */
      {
        id: 'recsys-sum-capstone',
        number: '0.9',
        title: 'สรุปบทที่ 9: ตารางตัดสินใจเลือกสถาปัตยกรรม (Master Decision Matrix & Top 10 Traps)',
        goal: 'สามารถสังเคราะห์โจทย์ธุรกิจ เลือกสถาปัตยกรรมระบบแนะนำได้ตรงจุด และจำ 10 กับดักข้อสอบที่มักทำให้คะแนนหลุดมือ',
        lead: 'สรุปโค้งสุดท้ายก่อนเข้าห้องสอบ! แผนผังเปรียบเทียบสถาปัตยกรรมทุกประเภทตามข้อจำกัดธุรกิจ และ Checklist 10 ข้อที่ห้ามพลาด',
        body: `<div class="cs-card">
            <div class="cs-header">
              <h3>⚡ Master Decision Matrix: เจอโจทย์แบบนี้ เลือกโมเดลใด?</h3>
              <span class="cs-badge-pill">Ch 09</span>
            </div>

            <div class="cs-table-wrap">
              <table class="cs-table">
                <thead>
                  <tr>
                    <th>สถานการณ์ / ข้อจำกัดทางธุรกิจ</th>
                    <th>สถาปัตยกรรมที่ควรเลือก</th>
                    <th>เหตุผลเชิงเทคนิคและข้อสอบ</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><b>มีสินค้าใหม่ตลอดเวลา (New Item Cold-Start)</b></td>
                    <td><b>Content-Based Filtering / Multimodal Encoders</b></td>
                    <td>พึ่งพาเฉพาะ Attributes / Text / Image ของตัวสินค้า ไม่ง้อ Interaction Matrix เดิม</td>
                  </tr>
                  <tr>
                    <td><b>ระบบมีสินค้าหลักล้านชิ้น ต้องเสิร์ชใน &lt;15 ms</b></td>
                    <td><b>Two-Tower DSSM + Vector ANN Search (Faiss / MIPS)</b></td>
                    <td>Precompute เวกเตอร์สินค้าเก็บใน Vector DB ล่วงหน้า ตอนรันรันเฉพาะ User Tower เดี่ยว</td>
                  </tr>
                  <tr>
                    <td><b>ข้อมูลเป็น Implicit (มีแต่คลิก ไม่เคยมีคะแนนดาว)</b></td>
                    <td><b>BPR (Bayesian Personalized Ranking) / ALS (WRMF)</b></td>
                    <td>ปรับ Loss ให้มองเป็นคู่ (Pairwise) บังคับให้ของที่คลิกชนะของที่ไม่คลิก ไม่เดาคะแนนลอยๆ</td>
                  </tr>
                  <tr>
                    <td><b>จำนวนผู้ใช้น้อยกว่าสินค้ามาก ข้อมูลเสถียร</b></td>
                    <td><b>Item-based Collaborative Filtering (Item-kNN)</b></td>
                    <td>คำนวณ Item-Item Similarity Matrix ขนาดเล็กออฟไลน์เก็บไว้ล่วงหน้าได้ ประหยัดพลังงาน</td>
                  </tr>
                  <tr>
                    <td><b>ผู้ใช้มักคลิกเฉพาะของเดิมๆ ขาดความหลากหลาย</b></td>
                    <td><b>MMR (Maximal Marginal Relevance) ในด่าน Re-ranking</b></td>
                    <td>คัดเลือกไอเทมโดยหักลบด้วยคะแนนความเหมือนของชิ้นที่เลือกไปแล้ว กระจายหมวดหมู่สินค้า</td>
                  </tr>
                  <tr>
                    <td><b>ต้องการสร้างบทสนทนาแนะนำเชิงลึก ซักถามได้</b></td>
                    <td><b>LLM-based Conversational Agent / Multi-turn Prompting</b></td>
                    <td>ดึงพลัง Common Sense และความสามารถในการเข้าใจบริบทสนทนาหลายรอบของ LLM</td>
                  </tr>
                  <tr>
                    <td><b>สินค้า 20% ดังเกินไปจนของหางยาวไม่เกิด</b></td>
                    <td><b>Inverse Propensity Scoring (IPS) / Long-Tail Re-ranking</b></td>
                    <td>คูณถ่วงน้ำหนักส่วนกลับความน่าจะเป็นในการแสดงผล เพื่อดันของเฉพาะกลุ่มขึ้นมาสร้างความประทับใจ</td>
                  </tr>
                </tbody>
              </table>
            </div>
            ${makeFigureHtml(
              'recsys-long-tail-distribution.svg',
              'การกระจายตัวแบบหางยาว (Long-Tail Distribution) ในระบบแนะนำสินค้า',
              'Long-Tail Pareto',
              'แบ่งเป็น Head (ของดังยอดฮิต), Torso (ของปานกลาง), และ Long-Tail (สินค้าเฉพาะกลุ่มหางยาว) ระบบแนะนำที่ดีต้องสร้าง Serendipity และช่วยดันของใน Long-Tail ให้ผู้ใช้ที่ตรงความชอบ'
            )}

            <div class="cs-trap-box">
              <div class="cs-trap-title">🏆 Top 5 จุดจำห้ามพลาดก่อนก้าวเข้าห้องสอบ</div>
              <ol>
                <li><b>Latency Budget:</b> ด่านที่ 1 (Retrieval) ต้องเร็วที่สุด &lt;10-20ms, ด่านที่ 2 (Scoring) ~20-40ms, ด่านที่ 3 (Rerank) ~5-10ms รวมกันทั้งระบบต้องไม่เกิน SLA ปกติที่มักตั้งไว้ ~50-100ms</li>
                <li><b>NDCG Formula:</b> อย่าลืมตัวหาร $log_2(i+1)$ และค่าผลลัพธ์สุดท้ายต้องถูก Normalize ด้วย <b>IDCG (คะแนนอุดมคติที่เรียงสมบูรณ์แบบ)</b> เพื่อให้ค่าอยู่ในช่วง [0, 1] เสมอ</li>
                <li><b>Pearson ลบค่าเฉลี่ย:</b> คำนวณความคล้ายคลึงระหว่างบุคคล ต้องลบค่าเฉลี่ยส่วนบุคคล $r̄_u$ ออกเสมอ เพื่อกำจัดความลำเอียงส่วนตัว (User Rating Bias)</li>
                <li><b>Cold-Start มี 2 ฝั่ง:</b> New User ต้องใช้ Onboarding Survey หรือแนะนำตามสถิติยอดนิยม; New Item ต้องใช้ Content-Based / Multimodal Encoders</li>
                <li><b>Offline Metric ชนะ ไม่ได้แปลว่าชนะจริงในโลกความจริง:</b> ต้องทำ A/B Test วัด Conversion Rate, Dwell Time, และ Churn Rate เสมอเพราะโลกจริงมีปัจจัยเรื่องเวลาและสิ่งกระตุ้นภายนอก</li>
              </ol>
            </div>

            <div class="cs-link-box">
              <div class="cs-link-title">🔗 ทางลัดเชื่อมโยงเนื้อหาภาพรวมและเอกสารต้นฉบับ</div>
              <div class="cs-btn-row">
                <a class="cs-btn-link primary" href="index.html#recsys-capstone" target="_blank" rel="noopener noreferrer">↗ เปิดอ่านบทที่ 9 (Capstone) เต็มในแท็บใหม่</a>
                <button class="cs-btn-link" type="button" onclick="window.switchRecsysChapter('recsys-capstone')">📖 สลับไปอ่านบทที่ 9 ในหน้านี้</button>
                <button class="cs-btn-link" type="button" onclick="window.switchRecsysChapter('recsys-introduction')">⏮️ กลับไปเริ่มต้นที่บทที่ 1</button>
              </div>
            </div>
          </div>`,
        sources: [],
        questions: [
          question('sum-ch9-q1', 'หากบริษัทสตรีมมิ่งวิดีโอพบว่า "ผู้ใช้หน้าใหม่ที่เพิ่งสมัครใช้งานมักจะกดยกเลิกสมาชิกภายในสัปดาห์แรก เนื่องจากระบบแนะนำแต่เนื้อหาที่ไม่ตรงกับรสนิยม" ข้อใดคือแนวทางแก้ไขทางสถาปัตยกรรมที่ถูกต้องและตรงจุดที่สุด?',
            ['เปลี่ยนจากระบบค้นหา (Search) เป็นระบบ Collaborative Filtering ทั้งหมด', 'เพิ่มแบบสอบถามความสนใจในหน้าแรกตอนสมัคร (Onboarding Genre Survey) เพื่อสร้าง User Profile เบื้องต้นทันทีแก้ปัญหา New User Cold-Start', 'ปิดระบบแนะนำทิ้งและให้ผู้ใช้กดดูตามตัวอักษร A-Z', 'เทรนโมเดล Funk SVD ซ้ำทุก 5 นาที'],
            1,
            'ผู้ใช้หน้าใหม่ยังไม่มีข้อมูลประวัติการรับชม (New User Cold-Start) การทำ Onboarding Survey หรือดึงข้อมูลบริบทแรกเข้า (เช่น ประเทศ ภาษา) จะช่วยให้ระบบตั้งต้นเวกเตอร์ผู้ใช้ได้อย่างรวดเร็วแทนการปล่อยให้โมเดลว่างเปล่า',
            ['ผิด CF ต้องการประวัติเดิม ผู้ใช้ใหม่จึงไม่มีข้อมูลสำหรับ CF', 'ถูกต้อง! Onboarding Survey ช่วยสร้าง Cold-Start User Profile ตั้งแต่วินาทีแรก', 'ผิด การดูตาม A-Z ไม่ใช่การแก้ปัญหาทางระบบแนะนำ', 'ผิด SVD ก็ยังไม่มีประวัติของผู้ใช้ใหม่อยู่ดี']),
          question('sum-ch9-q2', 'ในการประชุมออกแบบระบบแนะนำระดับองค์กร หากวิศวกรคนหนึ่งเสนอว่า "เราควรยกเลิกสายพาน 3 ด่าน (Candidate Gen -> Scoring -> Rerank) แล้วใช้โมเดล Deep Cross-Network เพียงตัวเดียวคำนวณคะแนนสินค้าทั้งหมด 5 ล้านชิ้นแบบ Real-Time เพื่อความแม่นยำสูงสุด" ท่านจะแย้งข้อเสนอนี้ด้วยเหตุผลใด?',
            ['โมเดล Deep Cross-Network ไม่แม่นยำเท่า Two-Tower', 'การรันโมเดล Deep Learning ที่ซับซ้อนบนสินค้า 5 ล้านชิ้นในทุกคำขอจะละเมิด SLA ด้านเวลา (Latency) และใช้ต้นทุนฮาร์ดแวร์มหาศาลเกินความเป็นจริงใน Production', 'เพราะสินค้า 5 ล้านชิ้นมีขนาดน้อยเกินไปสำหรับ Deep Learning', 'เพราะไม่สามารถเก็บประวัติการคลิกของผู้ใช้ได้'],
            1,
            'นี่คือหัวใจของวิศวกรรมระบบแนะนำ (Engineering Trade-off): โมเดลที่ซับซ้อนและแม่นยำสูงมีค่า Latency สูง จึงต้องจำกัดให้รันเฉพาะสินค้าหลักร้อยชิ้นที่ผ่านการคัดกรองเบื้องต้นมาแล้วเท่านั้น ไม่สามารถรันบนสินค้าหลักล้านชิ้นแบบสดๆ ได้',
            ['ผิด Deep Cross-Network มีความแม่นยำในการจัดอันดับสูงกว่า', 'ถูกต้อง! ข้อจำกัดทางวิศวกรรมเรื่อง Latency Budget และ Computation Cost คือเหตุผลที่ระบบจริงต้องแบ่ง 3 สายพาน', 'ผิด 5 ล้านชิ้นเป็นขนาดคลังสินค้าที่ใหญ่มาก', 'ผิด ประวัติการคลิกสามารถเก็บได้ตามปกติ'])
        ]
      }
    ]
  };

  // Register the Summary Chapter at the very beginning of the course
  if (typeof window !== 'undefined') {
    window.recsysSummaryChapter = summaryChapter;

    window.RECSYS_CHAPTERS = window.RECSYS_CHAPTERS || [];
    if (!window.RECSYS_CHAPTERS.some(ch => ch.id === 'recsys-summary')) {
      window.RECSYS_CHAPTERS.unshift(summaryChapter);
    }

    if (window.RECSYS_COURSE && window.RECSYS_COURSE.chapters) {
      if (!window.RECSYS_COURSE.chapters.some(ch => ch.id === 'recsys-summary')) {
        window.RECSYS_COURSE.chapters.unshift(summaryChapter);
      }
    }

    if (window.COURSE_DATA && window.COURSE_DATA.chapters) {
      if (!window.COURSE_DATA.chapters.some(ch => ch.id === 'recsys-summary')) {
        window.COURSE_DATA.chapters.unshift(summaryChapter);
      }
    }
  }
})();
