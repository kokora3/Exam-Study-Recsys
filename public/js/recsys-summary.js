/* Course content for Fast-Track Executive Summary & Exam Cheat Sheet (High-Yield Professional Edition) */
(() => {
  'use strict';

  const question = (id, q, choices, answer, explanation, reasons) => ({ id, q, choices, answer, explanation, reasons, version: 1 });

  const summaryChapter = {
    id: 'recsys-summary',
    number: '0',
    badge: '⚡ สรุป',
    title: 'บทสรุปด่วนเตรียมสอบ 9 บทเรียน (Fast-Track Cheat Sheet)',
    kicker: 'CORE CONCEPTS, FORMULA CHEAT SHEET & EXAM TRAPS',
    description: 'รวบรวมแก่นสาระสำคัญ สูตรจำเข้าห้องสอบ ตารางตัดสินใจเลือกโมเดล และกับดักข้อสอบยอดฮิตจากทั้ง 9 บทเรียนหลัก (ไม่รวมพื้นฐานคณิตศาสตร์) พร้อมแนบลิงก์สำหรับกระโดดไปอ่านบทเต็มในแท็บใหม่ได้ทันที',
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
              <li><b>Search vs Recommendation:</b>
                <ul>
                  <li><i>Search (Information Retrieval):</i> ผู้ใช้เป็นฝ่ายรุก (Pull) มี <b>Explicit Query</b> (พิมพ์คำค้นหาชัดเจน) ผลลัพธ์ขึ้นกับคำค้นหาเป็นหลัก</li>
                  <li><i>Recommendation (RecSys):</i> ระบบเป็นฝ่ายรุก (Push) ผู้ใช้ <b>ไม่มีคำค้นหา</b> ขับเคลื่อนด้วย User Context, ประวัติในอดีต (Watch/Click History) และข้อมูลรสนิยม</li>
                </ul>
              </li>
              <li><b>Rating Prediction vs Ranking (Top-K):</b>
                การทายคะแนนดาวแม่นยำ (เช่น ได้ค่า RMSE ต่ำมาก) <u>ไม่ได้การันตี</u> ว่าลำดับสินค้าด้านบน (Top-K) จะถูกใจผู้ใช้ เพราะผู้ใช้สนใจเฉพาะของดีอันดับ 1-5 แรกของหน้าจอเท่านั้น ไม่ได้สนใจว่าของอันดับ 1,000 จะทายได้แม่นกี่ดาว
              </li>
              <li><b>Explicit vs Implicit Feedback:</b>
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
                    <th>ความหมายเชิงธุรกิจ / หน้าที่</th>
                    <th>จุดเด่น / พฤติกรรมของสูตร</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td rowspan="2"><b>Rating Error (คะแนนดาว)</b></td>
                    <td><b>MAE</b></td>
                    <td>ความคลาดเคลื่อนเฉลี่ยสัมบูรณ์</td>
                    <td>ลงโทษเชิงเส้นเท่ากันทุกจุด (Linear penalty)</td>
                  </tr>
                  <tr>
                    <td><b>RMSE</b></td>
                    <td>ความคลาดเคลื่อนเฉลี่ยยกกำลังสอง</td>
                    <td><b>ลงโทษความผิดพลาดก้อนใหญ่ (Outliers) อย่างรุนแรง</b> &rarr; ถ้าทาย 5 ดาวเป็น 1 ดาว ค่า RMSE จะพุ่งสูงมาก</td>
                  </tr>
                  <tr>
                    <td rowspan="2"><b>Classification (Top-K)</b></td>
                    <td><b>Precision@K</b></td>
                    <td>แนะนำไป K ชิ้น มีของที่ตรงใจกี่ชิ้น?</td>
                    <td>วัดความคุ้มค่าของพื้นที่หน้าจอ: <code>|Relevant ∩ Recommended| / K</code></td>
                  </tr>
                  <tr>
                    <td><b>Recall@K</b></td>
                    <td>ในบรรดาของที่ผู้ใช้ชอบทั้งหมด กวาดติดมาได้กี่เปอร์เซ็นต์?</td>
                    <td>วัดความครอบคลุม: <code>|Relevant ∩ Recommended| / |Total Relevant|</code></td>
                  </tr>
                  <tr>
                    <td rowspan="3"><b>Ranking (การเรียงลำดับ)</b></td>
                    <td><b>Hit Rate@K</b></td>
                    <td>ใน Top-K มีของตรงใจอย่างน้อย 1 ชิ้นหรือไม่?</td>
                    <td>ตอบ 0 หรือ 1 ต่อคน เหมาะกับบริการสตรีมมิง (ขอแค่มีหนัง 1 เรื่องที่เปิดดูก็พอ)</td>
                  </tr>
                  <tr>
                    <td><b>MRR (Mean Reciprocal Rank)</b></td>
                    <td>ของตรงใจ <u>ชิ้นแรก</u> อยู่ที่อันดับไหน?</td>
                    <td><code>1 / rank_1</code> &rarr; <b>สนใจเฉพาะชิ้นแรกเท่านั้น!</b> เหมาะกับระบบค้นหาหรือตู้ Kiosk</td>
                  </tr>
                  <tr>
                    <td><b>NDCG@K</b></td>
                    <td>วัดคุณภาพการเรียงลำดับทั้งหน้าจอเทียบกับลิสต์ในอุดมคติ</td>
                    <td>รองรับ Graded Relevance (ชอบมาก/ชอบน้อย) และลงโทษตำแหน่งล่างด้วย <code>log_2(i + 1)</code> ค่าอยู่ในช่วง [0, 1] เสมอ</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="cs-formula-card">
              <div class="cs-formula-title">📐 สูตรจำเข้าห้องสอบ: DCG@K และ NDCG@K</div>
              <div class="cs-formula-math">DCG@K = ∑ [ (2^(rel_i) - 1) / log_2(i + 1) ]   (i = 1 ถึง K)</div>
              <div class="cs-formula-math">NDCG@K = DCG@K / IDCG@K</div>
              <div class="cs-formula-legend">
                โดย <b>rel_i</b> คือคะแนนความเกี่ยวข้องที่ตำแหน่ง i (เช่น 0, 1, 2, 3), <b>IDCG@K</b> คือค่า DCG ของการเรียงลำดับที่ดีที่สุดในอุดมคติ (เรียง rel จากมากไปน้อย) เพื่อปรับสเกลผลลัพธ์ให้อยู่ในช่วง 0.0 ถึง 1.0 เสมอ
              </div>
            </div>

            <div class="cs-trap-box">
              <div class="cs-trap-title">🚨 กับดักข้อสอบยอดฮิต (Exam Watch-Outs)</div>
              <ul>
                <li><b>Data Leakage จากการสุ่มแบ่งข้อมูล:</b> ใน RecSys <u>ห้ามสุ่มแบ่ง Train/Test แบบ Random เด็ดขาด!</u> เพราะจะทำให้โมเดลเห็นข้อมูลการคลิกในอนาคตหลุดเข้าไปในชุดเทรน <b>ต้องแบ่งตามเส้นเวลา (Temporal Split) เสมอ</b> (อดีตเทรน &rarr; อนาคตทดสอบ)</li>
                <li><b>MRR สนใจเฉพาะชิ้นแรก:</b> หากผู้ใช้ชอบไอเทมที่อันดับ 2, 3, 5 ค่า Reciprocal Rank คือ <code>1/2 = 0.5</code> เท่านั้น! <u>อย่า</u> นำ 1/3 หรือ 1/5 มาบวกเฉลี่ย</li>
                <li><b>Offline vs Online Disconnect:</b> โมเดลที่ได้ค่า NDCG ออฟไลน์สูงสุด อาจแพ้ในการทดสอบจริงแบบ <b>Online A/B Testing</b> เนื่องจากข้อมูลออฟไลน์ไม่สะท้อนความแปลกใหม่ (Novelty), ความหน่วงเวลา (Latency), และอคติของตำแหน่งบน UI จริง</li>
              </ul>
            </div>

            <div class="cs-link-box">
              <div class="cs-link-title">🔗 ทางลัดเชื่อมโยงเนื้อหาบทที่ 2</div>
              <div class="cs-btn-row">
                <a class="cs-btn-link primary" href="index.html#recsys-evaluation" target="_blank" rel="noopener noreferrer">↗ เปิดอ่านบทที่ 2 เต็มในแท็บใหม่</a>
                <a class="cs-btn-link" href="index.html#recsys-ndcg" target="_blank" rel="noopener noreferrer">↗ ตัวอย่างคำนวณสูตร NDCG ละเอียด</a>
                <a class="cs-btn-link" href="index.html#recsys-online-ab" target="_blank" rel="noopener noreferrer">↗ หลักการทำ Online A/B Testing</a>
                <button class="cs-btn-link" type="button" onclick="window.switchRecsysChapter('recsys-evaluation')">📖 สลับไปอ่านบทที่ 2 ในหน้านี้</button>
              </div>
            </div>
          </div>`,
        sources: [],
        questions: [
          question('sum-ch2-q1', 'หากระบบ A แนะนำรายการที่ผู้ใช้ชื่นชอบปรากฏที่อันดับ 1, 4, 5 ขณะที่ระบบ B แนะนำรายการที่ผู้ใช้ชื่นชอบปรากฏที่อันดับ 2, 3, 4 ตัวชี้วัด MRR (Mean Reciprocal Rank) จะให้ผลอย่างไร?',
            ['ระบบ A ชนะ เพราะชิ้นแรกเจอที่อันดับ 1 (MRR = 1.0) ดีกว่าระบบ B (MRR = 0.5)', 'ระบบ B ชนะ เพราะมีของตรงใจเฉลี่ยในตำแหน่งที่เกาะกลุ่มกันดีกว่า', 'ทั้งสองระบบได้คะแนนเท่ากัน เพราะผู้ใช้ชอบ 3 ชิ้นเท่ากัน', 'ไม่สามารถสรุปได้ ต้องคำนวณ Precision@K ร่วมด้วยเสมอ'],
            0,
            'MRR พิจารณาเฉพาะอันดับของชิ้นแรกที่ตรงใจ (First Relevant Item): ระบบ A เจอที่อันดับ 1 ได้ 1/1 = 1.0 ส่วนระบบ B เจอที่อันดับ 2 ได้ 1/2 = 0.5 ดังนั้นระบบ A ได้คะแนนสูงกว่า',
            ['ถูกต้อง! MRR สนใจเฉพาะชิ้นแรกที่ถูกต้อง 1/1 > 1/2', 'ผิด MRR ไม่สนใจชิ้นที่ 2 หรือ 3', 'ผิด จำนวนชิ้นที่ชอบไม่ถูกนำมาบวกใน MRR พื้นฐาน', 'ผิด สามารถสรุปค่า MRR ได้โดยตรง']),
          question('sum-ch2-q2', 'เหตุใดการทดสอบออฟไลน์ (Offline Evaluation) ที่ได้ค่า NDCG@10 สูงมาก จึงอาจล้มเหลวในการทดสอบจริงแบบ Online A/B Testing?',
            ['เพราะตัวชี้วัด NDCG มีสูตรคำนวณที่ผิดพลาดทางคณิตศาสตร์', 'เพราะข้อมูลออฟไลน์เกิด Data Leakage, ไม่สะท้อนพฤติกรรมตอบสนองตามเวลาจริง หรือเกิด Feedback Loop & Position Bias', 'เพราะการทดสอบ A/B Testing ใช้วัดเฉพาะระบบ Search เท่านั้น', 'เพราะระบบออฟไลน์วัดผลกับผู้ใช้กลุ่มใหญ่กว่าระบบออนไลน์เสมอ'],
            1,
            'Offline Evaluation ใช้ข้อมูลอดีตที่หยุดนิ่ง มักมีอคติ (Bias) จากสิ่งที่ระบบเก่าเคยแสดง (Exposure Bias) ในขณะที่ออนไลน์ผู้ใช้ตอบสนองต่อสิ่งใหม่ มีผลกระทบของ UI ความหน่วงเวลา และความแปลกใหม่',
            ['ผิด NDCG เป็นมาตรฐานที่ถูกต้องทางคณิตศาสตร์', 'ถูกต้อง! ความเหลื่อมล้ำระหว่าง Offline กับ Online เกิดจาก Exposure Bias, ความล่าช้า และปฏิสัมพันธ์ตามเวลาจริง', 'ผิด A/B Testing ใช้วัดระบบแนะนำเป็นหลัก', 'ผิด A/B Testing วัดกับทราฟฟิกจริงของผู้ใช้'])
        ]
      },

      /* ==========================================================================
         Task 0.3: บทที่ 3 - Content-Based Recommendations (Ch 03)
         ========================================================================== */
      {
        id: 'recsys-sum-content',
        number: '0.3',
        title: 'สรุปบทที่ 3: ระบบแนะนำจากเนื้อหา (TF-IDF, Embeddings, Bi-Encoder, MMR)',
        goal: 'เข้าใจกระบวนการสกัดฟีเจอร์เนื้อหา การเปรียบเทียบ Cosine Similarity การสร้าง User Centroid Profile และการกระจายความหลากหลายด้วย MMR',
        lead: 'แนะนำสิ่งของจาก "คุณสมบัติเนื้อหา" ไม่แคร์รอยเท้าคนอื่น! เหมาะอย่างยิ่งสำหรับแก้ Item Cold-Start และคลังสินค้าที่มีคำบรรยายอุดมสมบูรณ์',
        body: `<div class="cs-card">
            <div class="cs-header">
              <h3>⚡ สรุปกระบวนการสร้าง Content-Based Recommender</h3>
              <span class="cs-badge-pill">Ch 03</span>
            </div>

            <ul>
              <li><b>1. Feature Representation (แปลงไอเทมเป็นเวกเตอร์):</b>
                <ul>
                  <li><i>TF-IDF (Term Frequency - Inverse Document Frequency):</i> คำนวณความสำคัญของคำ โดยให้คะแนนสูงกับคำที่ปรากฏบ่อยในเอกสารนั้น แต่ไม่เกร่อในคลังเอกสาร</li>
                  <li><i>Dense Semantic Embeddings:</i> ใช้ Sentence-BERT แปลงข้อความเป็นเวกเตอร์หนาแน่น (Dense Vector) 384 หรือ 768 มิติ จับความหมายที่ลึกซึ้ง เช่น "มือถือ" กับ "สมาร์ตโฟน" จะได้เวกเตอร์ใกล้เคียงกัน</li>
                </ul>
              </li>
              <li><b>2. User Profile Construction (สร้างตัวแทนรสนิยมผู้ใช้):</b>
                <ul>
                  <li><i>Centroid Profile:</i> นำเวกเตอร์ของสินค้าทั้งหมดที่ผู้ใช้คนนั้นเคยคลิกหรือซื้อมา <b>เฉลี่ยรวมกัน</b>: <code>p_u = (1 / |I_u|) × ∑ v_i</code></li>
                  <li><i>Time-Decay Weighting:</i> คูณค่าน้ำหนักลดทอนตามกาลเวลา เช่น สินค้าที่ดูเมื่อวานมีน้ำหนักมากกว่าสินค้าที่ดูเมื่อ 6 เดือนก่อน</li>
                </ul>
              </li>
              <li><b>3. Bi-Encoder vs Cross-Encoder Architecture:</b>
                <ul>
                  <li><i>Bi-Encoder (Two-Tower):</i> แยกถอดรหัส User และ Item ออกจากกันล่วงหน้า สามารถ Precompute เวกเตอร์สินค้าเก็บไว้ใน Vector DB ได้ ค้นหาเร็วผ่าน ANN Search &rarr; <b>ใช้ในด่าน Retrieval</b></li>
                  <li><i>Cross-Encoder:</i> ป้อน (User, Item) เข้า Attention พร้อมกันเพื่อดูความสัมพันธ์ทุกคู่คำ แม่นยำสูงสุดแต่คำนวณช้ามาก Precompute ไม่ได้ &rarr; <b>ใช้ในด่าน Reranking</b></li>
                </ul>
              </li>
            </ul>

            <div class="cs-formula-card">
              <div class="cs-formula-title">📐 สูตร Cosine Similarity และ MMR Diversification</div>
              <div class="cs-formula-math">Cosine(u, v) = (u · v) / ( ||u|| × ||v|| ) = ∑(u_k × v_k) / [ √(∑ u_k²) × √(∑ v_k²) ]</div>
              <div class="cs-formula-math">MMR = argmax [ λ × Sim_1(i, u) - (1 - λ) × max Sim_2(i, j) ]   (j ∈ Selected)</div>
              <div class="cs-formula-legend">
                ใน MMR: <b>Sim_1</b> คือความเกี่ยวข้องกับผู้ใช้, <b>Sim_2</b> คือความคล้ายกับของที่เลือกติดหน้าจอไปแล้ว, พารามิเตอร์ <b>λ (แลมบ์ดา)</b> ควบคุมสมดุล: ถ้า <code>λ = 1</code> จะเน้นเฉพาะความตรงใจสูงสุด (Pure Relevance), ถ้า <code>λ = 0</code> จะเน้นเฉพาะความหลากหลายแปลกใหม่สูงสุด (Pure Diversity)
              </div>
            </div>

            <div class="cs-trap-box">
              <div class="cs-trap-title">🚨 ข้อดี vs ข้อจำกัดหลัก (Exam Trap)</div>
              <ul>
                <li><b>จุดแข็ง:</b> แก้ปัญหา <b>Item Cold-Start</b> ได้สมบูรณ์แบบ (สินค้าใหม่ลงคลังแนะนำได้ทันที ขอแค่มีคำบรรยาย), อธิบายเหตุผลได้ง่าย (Explainability) และไม่ง้อข้อมูลผู้ใช้คนอื่น</li>
                <li><b>จุดอ่อน (Over-specialization):</b> แนะนำเฉพาะของแนวเดิมๆ ที่คล้ายประวัติเก่า ผู้ใช้ติดอยู่ในฟองสบู่ (Filter Bubble) ไม่สามารถสร้างความประหลาดใจเชิงบวก (ขาด Serendipity) ข้ามหมวดหมู่ได้เหมือน Collaborative Filtering</li>
              </ul>
            </div>

            <div class="cs-link-box">
              <div class="cs-link-title">🔗 ทางลัดเชื่อมโยงเนื้อหาบทที่ 3</div>
              <div class="cs-btn-row">
                <a class="cs-btn-link primary" href="index.html#recsys-content" target="_blank" rel="noopener noreferrer">↗ เปิดอ่านบทที่ 3 เต็มในแท็บใหม่</a>
                <a class="cs-btn-link" href="index.html#recsys-content-tfidf" target="_blank" rel="noopener noreferrer">↗ เจาะลึกสูตรคำนวณ TF-IDF</a>
                <a class="cs-btn-link" href="index.html#recsys-content-mmr" target="_blank" rel="noopener noreferrer">↗ เจาะลึกการกระจายความหลากหลายด้วย MMR</a>
                <button class="cs-btn-link" type="button" onclick="window.switchRecsysChapter('recsys-content')">📖 สลับไปอ่านบทที่ 3 ในหน้านี้</button>
              </div>
            </div>
          </div>`,
        sources: [],
        questions: [
          question('sum-ch3-q1', 'ข้อจำกัดที่เด่นชัดที่สุดของระบบแนะนำแบบ Content-Based Filtering ดั้งเดิมคือข้อใด?',
            ['ไม่สามารถแนะนำสินค้าใหม่ที่เพิ่งลงระบบได้', 'ตกอยู่ในกับดักความซ้ำซากเดิมๆ (Over-specialization) แนะนำเฉพาะของที่คล้ายกับประวัติเดิม และไม่สามารถข้ามข้ามรสนิยมได้', 'ต้องพึ่งพาประวัติการซื้อของผู้ใช้คนอื่นๆ ในระบบจำนวนมหาศาล', 'ไม่สามารถใช้ฟังก์ชัน Cosine Similarity ในการคำนวณได้'],
            1,
            'Content-Based แนะนำเฉพาะสินค้าที่มีเนื้อหาคล้ายกับสิ่งที่ผู้ใช้เคยชอบ ทำให้เกิดปัญหา Over-specialization (ขาด Serendipity) ไม่สามารถแนะนำของหมวดอื่นที่ผู้ใช้อาจจะชอบได้หากไม่มีฟีเจอร์เหมือนเดิม',
            ['ผิด Content-Based แก้ปัญหา New Item ได้ดีมาก', 'ถูกต้อง! จุดอ่อนคือ Over-specialization แนะนำแต่ของแนวเดิมๆ', 'ผิด Content-Based ไม่ง้อข้อมูลผู้ใช้คนอื่น', 'ผิด Cosine Similarity คือฟังก์ชันหลักที่ใช้']),
          question('sum-ch3-q2', 'ในสูตร MMR (Maximal Marginal Relevance) หากเราปรับค่าพารามิเตอร์ λ (แลมบ์ดา) ให้มีค่าเข้าใกล้ 1.0 จะเกิดผลลัพธ์อย่างไรกับรายการแนะนำ?',
            ['รายการแนะนำจะมีความหลากหลาย (Diversity) สูงสุดโดยไม่สนใจความชอบของผู้ใช้', 'รายการแนะนำจะเน้นเฉพาะความเกี่ยวข้องสูงสุด (Pure Relevance) โดยไม่สนใจการลดความซ้ำซาก', 'ระบบจะหยุดทำงานเนื่องจากเกิดค่าหารด้วยศูนย์', 'ระบบจะสลับไปเป็น Collaborative Filtering อัตโนมัติ'],
            1,
            'เมื่อ λ = 1 เทอมหลัง (1 - λ) จะกลายเป็น 0 ทำให้สูตรสนใจเฉพาะ Sim(i, u) ซึ่งคือความเกี่ยวข้องสูงสุดเพียวๆ ปราศจากการลงโทษความซ้ำซาก',
            ['ผิด นั่นคือกรณีที่ λ เข้าใกล้ 0', 'ถูกต้อง! λ=1 คือ Pure Relevance ไม่คัดกรองความซ้ำซาก', 'ผิด ไม่มีตัวหารเป็นศูนย์ในสูตร', 'ผิด ไม่เกี่ยวกับ CF'])
        ]
      },

      /* ==========================================================================
         Task 0.4: บทที่ 4 - Multimodal Recommendations (Ch 04)
         ========================================================================== */
      {
        id: 'recsys-sum-multimodal',
        number: '0.4',
        title: 'สรุปบทที่ 4: การแนะนำจากข้อมูลหลายสื่อ (Multimodal Fusion, CNN, ViT, Encoders)',
        goal: 'เข้าใจการผสานฟีเจอร์ข้อความ ภาพ เสียง และวิดีโอ การเปรียบเทียบกลยุทธ์ Fusion 3 ระดับ และการจัดการสื่อขาดหาย',
        lead: 'สินค้าหนึ่งชิ้นไม่ได้มีแค่ตัวหนังสือ แต่มีภาพปก คลิปตัวอย่าง และเสียงบรรยาย! สรุปกลยุทธ์การผสานหลายสื่อเข้าสู่เวกเตอร์ร่วม',
        body: `<div class="cs-card">
            <div class="cs-header">
              <h3>⚡ สรุปกลยุทธ์การผสานสื่อ (Multimodal Fusion Strategies)</h3>
              <span class="cs-badge-pill">Ch 04</span>
            </div>

            <div class="cs-table-wrap">
              <table class="cs-table">
                <thead>
                  <tr>
                    <th>กลยุทธ์ Fusion</th>
                    <th>ตำแหน่งที่ผสานข้อมูล</th>
                    <th>จุดเด่น / ข้อดี</th>
                    <th>ข้อพิจารณา / จุดอ่อน</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><b>Early Fusion (Feature-level)</b></td>
                    <td><b>ชั้นอินพุต (Input Stage):</b> นำเวกเตอร์ของแต่ละสื่อมาต่อกัน (Concatenation) เป็นเวกเตอร์ยาวก้อนเดียวก่อนส่งเข้าโมเดล</td>
                    <td>โครงสร้างโมเดลเข้าใจง่าย ประมวลผลร่วมกันได้ตั้งแต่จุดเริ่มต้น</td>
                    <td>มิติเวกเตอร์บานปลาย (Curse of Dimensionality) และหากสื่อใดสื่อหนึ่งขาดหายไป (Missing Modality) ระบบจะคำนวณต่อไม่ได้</td>
                  </tr>
                  <tr>
                    <td><b>Late Fusion (Decision-level)</b></td>
                    <td><b>ชั้นเอาต์พุต (Output Stage):</b> สร้างโมเดลทำนายคะแนนแยกตามสื่ออิสระ แล้วนำผลคะแนนมารวมกันด้วยค่าเฉลี่ยถ่วงน้ำหนัก</td>
                    <td><b>ยืดหยุ่นสูงสุด:</b> สื่อใดขาดหายก็ตัดเฉพาะโมเดลนั้นออกได้ ออกแบบและเทรนแยกทีมได้อิสระ</td>
                    <td>พลาดความสัมพันธ์เชิงลึกข้ามสื่อ (Cross-modal correlation) เช่น ภาพสวยแต่ข้อความบรรยายหลอกลวง โมเดลจะจับไม่ได้</td>
                  </tr>
                  <tr>
                    <td><b>Intermediate / Cross-Attention</b></td>
                    <td><b>ชั้นกลาง (Hidden Layers):</b> ใช้ Cross-Attention หรือ Gated Units ให้สื่อหนึ่งถามหาบริบทจากอีกสื่อหนึ่ง (เช่น CLIP, Flamingo)</td>
                    <td><b>แม่นยำสูงสุด:</b> เรียนรู้การจัดแนว (Alignment) ระหว่างคำบรรยายกับตำแหน่งบนรูปภาพได้อย่างลึกซึ้ง</td>
                    <td>โครงสร้างซับซ้อน คำนวณช้า และใช้ทรัพยากรเทรนสูงมาก</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="cs-formula-card">
              <div class="cs-formula-title">📸 Encoders ยอดฮิตสำหรับแต่ละสื่อในข้อสอบ</div>
              <ul>
                <li><b>Text:</b> Transformer Encoders (BERT, RoBERTa, Sentence-Transformers)</li>
                <li><b>Image:</b> CNN (ResNet, EfficientNet) และ <b>Vision Transformer (ViT)</b> ที่ตัดรูปเป็นตารางสี่เหลี่ยม (Patches) เสมือน Token ข้อความ</li>
                <li><b>Audio:</b> แปลงคลื่นเสียงเป็น <b>Mel-Spectrogram</b> (ภาพความถี่เสียงตามเวลา) &rarr; ส่งต่อให้ 2D-CNN หรือ Audio Spectrogram Transformer (AST)</li>
                <li><b>Video:</b> 3D-CNN (ประมวลผล กว้าง x ยาว x เวลา) หรือ TimeSformer</li>
              </ul>
            </div>

            <div class="cs-trap-box">
              <div class="cs-trap-title">🚨 การรับมือสื่อที่ขาดหาย (Handling Missing Modalities)</div>
              <p>ในชีวิตจริง สินค้าบางชิ้นอาจมีเฉพาะรูปแต่ไม่มีคำบรรยาย หรือมีเฉพาะข้อความแต่ไม่มีคลิปวิดีโอ <u>กลยุทธ์ที่ทนทานที่สุด</u> คือ <b>Late Fusion</b> หรือการเทรนโมเดลด้วยเทคนิค <b>Modality Dropout</b> (สุ่มปิดสื่อบางประเภทตอนเทรน เพื่อบังคับให้โมเดลทำงานได้แม้ข้อมูลสื่อไม่ครบ)</p>
            </div>

            <div class="cs-link-box">
              <div class="cs-link-title">🔗 ทางลัดเชื่อมโยงเนื้อหาบทที่ 4</div>
              <div class="cs-btn-row">
                <a class="cs-btn-link primary" href="index.html#recsys-multimodal" target="_blank" rel="noopener noreferrer">↗ เปิดอ่านบทที่ 4 เต็มในแท็บใหม่</a>
                <a class="cs-btn-link" href="index.html#recsys-mm-late" target="_blank" rel="noopener noreferrer">↗ เจาะลึกเปรียบเทียบ Late vs Early Fusion</a>
                <a class="cs-btn-link" href="index.html#recsys-mm-intermediate" target="_blank" rel="noopener noreferrer">↗ เทคนิค Cross-Attention ข้ามสื่อ</a>
                <button class="cs-btn-link" type="button" onclick="window.switchRecsysChapter('recsys-multimodal')">📖 สลับไปอ่านบทที่ 4 ในหน้านี้</button>
              </div>
            </div>
          </div>`,
        sources: [],
        questions: [
          question('sum-ch4-q1', 'หากระบบ E-Commerce มีสินค้าบางรายการที่มีเฉพาะ "รูปภาพ" แต่ไม่มี "ข้อความคำอธิบาย" กลยุทธ์ Fusion ใดต่อไปนี้สามารถรับมือกับข้อมูลสื่อที่ขาดหาย (Missing Modalities) ได้ยืดหยุ่นที่สุด?',
            ['Early Fusion แบบนำเวกเตอร์ดิบมาต่อกันทันที', 'Late Fusion (Decision-level) ที่คำนวณคะแนนแยกรายโมเดลแล้วถ่วงน้ำหนัก', 'ห้ามใช้โมเดล Multimodal ต้องลบสินค้านั้นออกจากคลังทันที', 'Pure Lexical Matching'],
            1,
            'Late Fusion แยกคำนวณคะแนนของแต่ละสื่อเป็นอิสระต่อกัน หากไม่มีข้อความ โมเดลฝั่งรูปภาพยังคงสามารถทำนายคะแนนและส่งต่อได้โดยไม่ทำให้สถาปัตยกรรมล้มเหลว',
            ['ผิด Early Fusion มิติจะแหว่งและต้องหาค่าเติม (Imputation) ที่เสี่ยงต่อการบิดเบือน', 'ถูกต้อง! Late Fusion รองรับ Missing Modality ได้ยืดหยุ่นที่สุด', 'ผิด ไม่จำเป็นต้องลบสินค้า', 'ผิด ไม่ใช่แนวทาง Multimodal']),
          question('sum-ch4-q2', 'Vision Transformer (ViT) นำภาพถ่ายมาประมวลผลในรูปแบบที่คล้ายกับข้อความได้อย่างไร?',
            ['แปลงภาพถ่ายเป็นไฟล์เสียงก่อนป้อนเข้าโมเดล', 'ตัดภาพออกเป็นตารางสี่เหลี่ยมชิ้นเล็กๆ (Patches) แล้วมองแต่ละชิ้นเป็นเสมือน 1 Token คำศัพท์', 'ใช้เฉพาะข้อมูลขนาดไฟล์ภาพ (Megabytes) ในการทำนาย', 'ใช้โมเดล Decision Tree ทำนายสีทีละพิกเซล'],
            1,
            'ViT ตัดรูปภาพขนาด HxW ออกเป็นชิ้นย่อยขนาด PxP (เช่น 16x16 pixels) แล้วผ่าน Linear Projection กลายเป็น Sequence of Patch Embeddings เสมือน Token ข้อความใน NLP',
            ['ผิด ไม่เกี่ยวกับการแปลงเป็นเสียง', 'ถูกต้อง! ViT ตัดภาพเป็น Patches เสมือน Token', 'ผิด ขนาดไฟล์ไม่สะท้อนเนื้อหาภาพ', 'ผิด Transformer ใช้ Attention ไม่ใช่ Decision Tree'])
        ]
      },

      /* ==========================================================================
         Task 0.5: บทที่ 5 - Collaborative Filtering (Ch 05)
         ========================================================================== */
      {
        id: 'recsys-sum-cf',
        number: '0.5',
        title: 'สรุปบทที่ 5: การกรองแบบร่วมมือ (User-kNN, Item-kNN, Pearson, Baseline Predictor)',
        goal: 'แม่นยำความแตกต่างระหว่าง User-based vs Item-based CF, การปรับแก้ Bias ของแต่ละบุคคล และการคำนวณทำนายคะแนน',
        lead: 'รอยเท้าของฝูงชนคือเข็มทิศชั้นยอด! สรุปการเปรียบเทียบความคล้ายระหว่างบุคคลและสินค้า พร้อมสูตรทำนายคะแนนที่ข้อสอบเน้นคำนวณ',
        body: `<div class="cs-card">
            <div class="cs-header">
              <h3>⚡ สรุปข้อแตกต่าง User-kNN vs Item-kNN</h3>
              <span class="cs-badge-pill">Ch 05</span>
            </div>

            <div class="cs-table-wrap">
              <table class="cs-table">
                <thead>
                  <tr>
                    <th>มิติการเปรียบเทียบ</th>
                    <th>User-based kNN</th>
                    <th>Item-based kNN (Amazon's Architecture)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><b>แกนการคำนวณ</b></td>
                    <td>เทียบ <b>"คนคล้ายคน"</b> (หาเพื่อนบ้านที่มีรสนิยมการให้คะแนนคล้ายกัน)</td>
                    <td>เทียบ <b>"สินค้าคล้ายสินค้า"</b> (หาสินค้าที่มีประวัติคนกลุ่มเดียวกันชอบ)</td>
                  </tr>
                  <tr>
                    <td><b>ความเสถียร (Stability)</b></td>
                    <td>ความชอบของคนเปลี่ยนแปลงรวดเร็ว อารมณ์เปลี่ยนตามกาลเวลา</td>
                    <td><b>เสถียรกว่ามาก:</b> คุณลักษณะของสินค้าเปลี่ยนช้ามาก หนังแนว Sci-Fi วันนี้ อีก 5 ปีก็ยังเป็นแนวเดิม</td>
                  </tr>
                  <tr>
                    <td><b>ความพร้อมใช้งานออฟไลน์</b></td>
                    <td>คำนวณล่วงหน้ายากมากเมื่อผู้ใช้มีหลักร้อยล้านคน (ความซับซ้อนระดับ <code>O(|U|²)</code>)</td>
                    <td><b>Precompute ได้สมบูรณ์:</b> คำนวณตาราง Item-Item Similarity Matrix ขนาด <code>|I| × |I|</code> ออฟไลน์ทิ้งไว้ล่วงหน้าได้</td>
                  </tr>
                  <tr>
                    <td><b>การอธิบายเหตุผล (Explainability)</b></td>
                    <td>อธิบายยากและไม่น่าเชื่อถือ ("เราแนะนำหนังเรื่องนี้เพราะคุณรสนิยมเหมือน User #8492")</td>
                    <td><b>อธิบายเข้าใจง่ายและตรงจุด:</b> ("เราแนะนำสินค้าชิ้นนี้เพราะคุณเคยซื้อสินค้า X และ Y")</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="cs-formula-card">
              <div class="cs-formula-title">📐 สูตรคำนวณสำคัญที่ต้องจำเข้าห้องสอบ</div>
              <div class="cs-formula-math">Pearson(u, v) = ∑(r_ui - r̄_u)(r_vi - r̄_v) / [ √(∑(r_ui - r̄_u)²) × √(∑(r_vi - r̄_v)²) ]</div>
              <div class="cs-formula-math">Baseline Predictor: b_ui = μ + b_u + b_i</div>
              <div class="cs-formula-math">Item-kNN Formula: r̂_ui = b_ui + [ ∑ s_ij × (r_uj - b_uj) ] / ∑ |s_ij|</div>
              <div class="cs-formula-legend">
                ใน Pearson: มีการ <b>ลบค่าเฉลี่ยส่วนบุคคล (Mean-Centering)</b> ออกก่อนเสมอ ทำให้แก้ปัญหาคนให้คะแนนง่าย (User ใจดี) vs คนให้คะแนนยาก (User ใจร้าย)<br>
                ใน Baseline Predictor: <b>μ</b> คือค่าเฉลี่ยทั้งระบบ, <b>b_u</b> คืออคติของผู้ใช้ u, และ <b>b_i</b> คืออคติความนิยมของสินค้า i
              </div>
            </div>

            <div class="cs-trap-box">
              <div class="cs-trap-title">🚨 3 จุดบอดคลาสสิกของ Collaborative Filtering</div>
              <ul>
                <li><b>Cold-Start:</b> ทั้ง New User (ไม่มีประวัติการให้คะแนน) และ New Item (ไม่มีใครเคยซื้อ) CF จะคำนวณไม่ได้ทั้งคู่!</li>
                <li><b>Sparsity:</b> ผู้ใช้สองคนอาจมีรสนิยมตรงกัน แต่บังเอิญให้คะแนนสินค้าไม่ตรงกันเลยแม้แต่ชิ้นเดียว (Co-rated items = 0) ทำให้คำนวณความคล้ายไม่ได้</li>
                <li><b>Gray Sheep:</b> ผู้ใช้ที่มีรสนิยมแปลกประหลาด ไม่เข้าพวกกับใครเลย ระบบจะหาเพื่อนบ้านที่ตรงกันไม่ได้</li>
              </ul>
            </div>

            <div class="cs-link-box">
              <div class="cs-link-title">🔗 ทางลัดเชื่อมโยงเนื้อหาบทที่ 5</div>
              <div class="cs-btn-row">
                <a class="cs-btn-link primary" href="index.html#recsys-neighbors" target="_blank" rel="noopener noreferrer">↗ เปิดอ่านบทที่ 5 เต็มในแท็บใหม่</a>
                <a class="cs-btn-link" href="index.html#recsys-cf-pearson" target="_blank" rel="noopener noreferrer">↗ ตัวอย่างคำนวณ Pearson Correlation</a>
                <a class="cs-btn-link" href="index.html#recsys-cf-item-knn" target="_blank" rel="noopener noreferrer">↗ กลไก Item-kNN สไตล์ Amazon</a>
                <button class="cs-btn-link" type="button" onclick="window.switchRecsysChapter('recsys-neighbors')">📖 สลับไปอ่านบทที่ 5 ในหน้านี้</button>
              </div>
            </div>
          </div>`,
        sources: [],
        questions: [
          question('sum-ch5-q1', 'เหตุใดในการคำนวณความคล้ายระหว่าง User จึงนิยมใช้ Pearson Correlation มากกว่า Cosine Similarity ดั้งเดิม?',
            ['เพราะ Pearson Correlation ไม่ต้องใช้การคูณตัวเลข', 'เพราะ Pearson Correlation มีการลบค่าเฉลี่ยคะแนนของแต่ละบุคคล (Mean-Centering) ช่วยแก้ปัญหาอคติของคนให้คะแนนง่าย vs คนให้คะแนนยาก', 'เพราะ Cosine Similarity ใช้ได้เฉพาะข้อมูลข้อความเท่านั้น', 'เพราะ Pearson Correlation สามารถแนะนำสินค้าใหม่ได้โดยไม่ต้องมีประวัติเดิม'],
            1,
            'ผู้ใช้แต่ละคนมีไม้บรรทัดในใจต่างกัน (บางคนให้ 4 เป็นเกณฑ์ต่ำ บางคนให้ 3 เป็นคะแนนสูงสุด) การลบค่าเฉลี่ยของแต่ละคนออก (Mean-centering) ในสูตร Pearson ทำให้ปรับสเกลคะแนนมาอยู่บนมาตรฐานเดียวกัน',
            ['ผิด Pearson มีการคูณเหมือนกัน', 'ถูกต้อง! Pearson ช่วยปรับแก้ User Rating Bias ผ่านการลบค่าเฉลี่ย', 'ผิด Cosine ใช้กับตัวเลขคะแนนดาวได้', 'ผิด ทั้งคู่ยังเป็น CF เจอปัญหา Cold-Start เหมือนกัน']),
          question('sum-ch5-q2', 'ในระบบ E-Commerce ขนาดใหญ่ที่มีจำนวน User 500 ล้านคน และสินค้า 20 ล้านชิ้น เหตุใดทีมวิศวกรจึงนิยมเลือกใช้ Item-based CF มากกว่า User-based CF ในระดับ Production?',
            ['เพราะความคล้ายระหว่างสินค้ามีความเสถียรมากกว่า และสามารถ Precompute ตารางความคล้ายเก็บไว้ล่วงหน้าได้', 'เพราะ Item-based CF มีความแม่นยำ 100% เสมอ', 'เพราะ User-based CF ไม่รองรับการวัดผลด้วย NDCG', 'เพราะ Item-based CF ไม่ต้องใช้ฐานข้อมูล'],
            0,
            'จำนวนสินค้ามักน้อยกว่าและคงที่กว่าจำนวนผู้ใช้มาก อีกทั้งความสัมพันธ์ระหว่างสินค้าเปลี่ยนช้ากว่าอารมณ์คน ทำให้สามารถคำนวณ Item-Item Similarity Matrix ออฟไลน์ทิ้งไว้ล่วงหน้าได้ ส่งผลให้ตอบสนองตอนเสิร์ฟได้เร็วมาก',
            ['ถูกต้อง! ความคล้ายของสินค้าเสถียรกว่าและคำนวณออฟไลน์ล่วงหน้าได้', 'ผิด ไม่มีโมเดลใดแม่นยำ 100%', 'ผิด ตัวชี้วัดใช้ได้เหมือนกัน', 'ผิด ต้องใช้ฐานข้อมูลเช่นกัน'])
        ]
      },

      /* ==========================================================================
         Task 0.6: บทที่ 6 - Matrix Factorization & Deep Models (Ch 06)
         ========================================================================== */
      {
        id: 'recsys-sum-mf-deep',
        number: '0.6',
        title: 'สรุปบทที่ 6: การแยกตัวประกอบเมทริกซ์และโมเดลการเรียนรู้เชิงลึก (SVD, BPR, NCF, Two-Tower)',
        goal: 'แม่นยำกลไก Latent Factor Models, การแก้ปัญหา Implicit Feedback ด้วย BPR, สถาปัตยกรรม Two-Tower และ NCF',
        lead: 'ย่อเมทริกซ์มหึมาลงสู่มิติแฝง (Latent Space)! สรุปวิวัฒนาการจาก Funk SVD ผู้ชนะรางวัล Netflix Prize สู่โมเดล Two-Tower ระดับมิลลิวินาทีของ YouTube',
        body: `<div class="cs-card">
            <div class="cs-header">
              <h3>⚡ สรุปวิวัฒนาการโมเดลจาก SVD สู่ Two-Tower</h3>
              <span class="cs-badge-pill">Ch 06</span>
            </div>

            <ul>
              <li><b>Matrix Factorization (Funk SVD):</b>
                แยกเมทริกซ์เรตติ้ง <code>R (|U| × |I|)</code> ออกเป็นผลคูณของ 2 เมทริกซ์มิติแฝงขนาดเล็ก:
                User Matrix <code>P (|U| × k)</code> และ Item Matrix <code>Q (|I| × k)</code> โดยที่ <code>k &lt;&lt; min(|U|, |I|)</code> (เช่น k = 64 หรือ 128 มิติ)
                <ul>
                  <li>คำนวณเฉพาะจุดที่มีข้อมูลคะแนนเรตติ้งจริง (Observed Ratings) เท่านั้น ป้องกันปัญหาเมทริกซ์ว่าง</li>
                  <li>มีพารามิเตอร์ <b>Regularization (λ)</b> เพื่อป้องกัน Overfitting</li>
                </ul>
              </li>
              <li><b>BPR (Bayesian Personalized Ranking):</b>
                ออกแบบมาเพื่อ <b>Implicit Feedback (คลิก/ดู)</b> โดยเฉพาะ! เปลี่ยนจากการทำนายคะแนนตัวเลขเดี่ยวๆ เป็นการเปรียบเทียบเป็นคู่ (Pairwise Ranking Loss):
                บังคับให้สินค้า <code>i</code> ที่ผู้ใช้เคยคลิก (Positive) ต้องมีคะแนนสูงกว่าสินค้า <code>j</code> ที่ไม่เคยคลิก (Negative Item ที่สุ่มขึ้นมา)
              </li>
              <li><b>Neural Collaborative Filtering (NCF):</b>
                ผสาน 2 เส้นทางคู่ขนาน: ฝั่ง <b>GMF (Generalized Matrix Factorization)</b> จับปฏิสัมพันธ์เชิงเส้นแบบ Element-wise รวมกับฝั่ง <b>MLP (Multi-Layer Perceptron)</b> จับปฏิสัมพันธ์ไม่เชิงเส้น (Non-linear)
              </li>
              <li><b>Two-Tower DSSM Architecture (หัวใจสำคัญของ YouTube &amp; TikTok):</b>
                <ul>
                  <li><i>User Tower:</i> รับฟีเจอร์ผู้ใช้ &rarr; ขับออกมาเป็นเวกเตอร์ <code>u ∈ R^d</code></li>
                  <li><i>Item Tower:</i> รับฟีเจอร์สินค้า &rarr; ขับออกมาเป็นเวกเตอร์ <code>v ∈ R^d</code></li>
                  <li><i>Serving:</i> เวกเตอร์สินค้าทั้งหมดสามารถคำนวณออฟไลน์และทำดัชนี (HNSW / Faiss) ล่วงหน้า เมื่อมี Request เข้ามา เพียงรัน User Tower แล้วทำ Dot Product ค้นหาด้วย ANN ในเวลา &lt; 15 ms!</li>
                </ul>
              </li>
            </ul>

            <div class="cs-formula-card">
              <div class="cs-formula-title">📐 สูตรคำนวณ Funk SVD และ Loss Function</div>
              <div class="cs-formula-math">r̂_ui = μ + b_u + b_i + (p_u · q_i) = μ + b_u + b_i + ∑(p_uk × q_ik)</div>
              <div class="cs-formula-math">Loss = ∑ (r_ui - r̂_ui)² + λ × ( ||p_u||² + ||q_i||² + b_u² + b_i² )</div>
              <div class="cs-formula-legend">
                อัปเดตพารามิเตอร์ด้วย Stochastic Gradient Descent (SGD): คำนวณ error <code>e_ui = r_ui - r̂_ui</code> แล้วปรับเวกเตอร์ p_u และ q_i ตามทิศทางเกรเดียนต์
              </div>
            </div>

            <div class="cs-trap-box">
              <div class="cs-trap-title">🚨 ข้อจำกัดทางสถาปัตยกรรมของ Two-Tower (Exam Watch-Out)</div>
              <p>Two-Tower Model เร็วมากเพราะแยก User Tower กับ Item Tower ออกจากกันเด็ดขาด แต่มี <b>ข้อจำกัดสำคัญ</b> คือ <u>ไม่สามารถจับปฏิสัมพันธ์ข้ามฟีเจอร์ในระดับลึก (Cross-features Interactions)</u> ได้เหมือนโมเดล DeepFM หรือ DLRM เพราะฟีเจอร์ทั้งสองฝั่งเพิ่งมาเจอกันที่ขั้นตอน Dot Product สุดท้ายเท่านั้น!</p>
            </div>

            <div class="cs-link-box">
              <div class="cs-link-title">🔗 ทางลัดเชื่อมโยงเนื้อหาบทที่ 6</div>
              <div class="cs-btn-row">
                <a class="cs-btn-link primary" href="index.html#recsys-models" target="_blank" rel="noopener noreferrer">↗ เปิดอ่านบทที่ 6 เต็มในแท็บใหม่</a>
                <a class="cs-btn-link" href="index.html#recsys-mf-latent" target="_blank" rel="noopener noreferrer">↗ เจาะลึกคณิตศาสตร์ Matrix Factorization</a>
                <a class="cs-btn-link" href="index.html#recsys-twotower-dssm" target="_blank" rel="noopener noreferrer">↗ สถาปัตยกรรม Two-Tower DSSM ละเอียด</a>
                <button class="cs-btn-link" type="button" onclick="window.switchRecsysChapter('recsys-models')">📖 สลับไปอ่านบทที่ 6 ในหน้านี้</button>
              </div>
            </div>
          </div>`,
        sources: [],
        questions: [
          question('sum-ch6-q1', 'BPR (Bayesian Personalized Ranking) ถูกออกแบบขึ้นมาเพื่อแก้ไขจุดอ่อนใดของ Matrix Factorization ดั้งเดิม?',
            ['แก้ไขปัญหาการคำนวณลอการิทึมผิดพลาด', 'แก้ปัญหาข้อมูล Implicit Feedback ที่ไม่มีคะแนนลบชัดเจน โดยปรับ Objective Function เป็นแบบ Pairwise Ranking ให้ของที่คลิกชนะของที่ไม่คลิก', 'แก้ไขปัญหาไม่สามารถแนะนำสินค้าใหม่ได้', 'ทำให้ไม่ต้องใช้การสุ่มตัวอย่างข้อมูล (Negative Sampling)'],
            1,
            'ข้อมูลแบบ Implicit (คลิก/ดู) มีเฉพาะสิ่งที่ผู้ใช้กระทำ แต่สิ่งที่ไม่คลิกไม่ได้แปลว่าเกลียด BPR จึงใช้แนวคิด Pairwise Ranking บังคับให้ไอเทมที่คลิก (i) ได้คะแนนสูงกว่าไอเทมที่ไม่คลิก (j) เสมอ',
            ['ผิด ไม่เกี่ยวกับการคำนวณล็อก', 'ถูกต้อง! BPR ออกแบบสำหรับ Implicit Feedback โดยเน้น Pairwise Optimization', 'ผิด BPR ยังคงเป็น CF มี Cold-Start เหมือนเดิม', 'ผิด BPR จำเป็นต้องสุ่ม Negative item j เสมอ']),
          question('sum-ch6-q2', 'ในสถาปัตยกรรม Two-Tower Model เพราะเหตุใดจึงสามารถค้นหาผู้สมัครสินค้า Top-100 จากสินค้า 10 ล้านชิ้นได้ภายในเวลาเพียงไม่กี่มิลลิวินาที?',
            ['เพราะ User Tower และ Item Tower ไม่มีการเชื่อมโยงกันเลยตลอดเวลา', 'เพราะเวกเตอร์ของสินค้า 10 ล้านชิ้นสามารถคำนวณและทำดัชนี (Index) ไว้ล่วงหน้าในเวกเตอร์ดาต้าเบสได้ ทำให้ตอนค้นหาเหลือเพียงการยิงเวกเตอร์ User ไปทำ MIPS / ANN Search', 'เพราะโมเดล Two-Tower ไม่ใช้ฟังก์ชันทางคณิตศาสตร์ใดๆ', 'เพราะระบบจะสุ่มตัดสินค้าทิ้งไป 99.9% ก่อนคำนวณเสมอ'],
            1,
            'Item Tower สามารถรันออฟไลน์เพื่อสร้างเวกเตอร์สินค้า 10 ล้านชิ้นเก็บในดัชนีเวกเตอร์ (เช่น HNSW / Faiss) ล่วงหน้า เมื่อมีผู้ใช้ส่งคำขอมา ระบบเพียงรัน User Tower ครั้งเดียว ได้เวกเตอร์ผู้ใช้ แล้วทำ Dot Product ค้นหาอย่างรวดเร็วผ่าน ANN',
            ['ผิด ทั้งสองเชื่อมกันตอนเทรนผ่าน Loss', 'ถูกต้อง! สามารถทำ Pre-indexing เวกเตอร์สินค้าล่วงหน้าแล้วใช้ ANN Search ได้รวดเร็ว', 'ผิด ใช้ Dot product / Cosine ปกติ', 'ผิด ค้นหาครอบคลุมผ่านโครงสร้างดัชนี ไม่ใช่สุ่มทิ้งมั่ว'])
        ]
      },

      /* ==========================================================================
         Task 0.7: บทที่ 7 - LLM-Powered Recommender Systems (Ch 07)
         ========================================================================== */
      {
        id: 'recsys-sum-llm',
        number: '0.7',
        title: 'สรุปบทที่ 7: พลังของ Large Language Models ในระบบแนะนำ (LLM-Powered RecSys)',
        goal: 'เข้าใจบทบาท 3 มิติของ LLM ในระบบแนะนำ, รูปแบบการ Prompt (Pointwise, Pairwise, Listwise) และข้อจำกัดทางวิศวกรรมจริง',
        lead: 'เมื่อปัญญาประดิษฐ์เชิงภาษาพบกับระบบแนะนำ! สรุปการประยุกต์ใช้ LLM ในโลกการทำงานจริง พร้อมวิธีรับมือ Latency และ Cost',
        body: `<div class="cs-card">
            <div class="cs-header">
              <h3>⚡ 3 บทบาทหลักของ LLM ใน Recommender Systems</h3>
              <span class="cs-badge-pill">Ch 07</span>
            </div>

            <ol>
              <li><b>1. LLM as Feature Extractor / Semantic Encoder (ด่านออฟไลน์):</b>
                ใช้ LLM สกัดความหมายลึกซึ้งจากเนื้อหาสินค้า เช่น สรุปธีม อารมณ์ บุคลิก หรือสร้าง <b>Dense Text Embeddings</b> ส่งต่อให้โมเดล Two-Tower &rarr; <u>ปลอดภัยต่อ Latency มากที่สุด</u> เพราะทำออฟไลน์ล่วงหน้าได้
              </li>
              <li><b>2. LLM as Reranker (ด่านสุดท้าย):</b>
                รับรายการสินค้าผู้สมัคร Top-10 หรือ Top-20 ที่ผ่านการคัดกรองมาแล้ว พร้อมประวัติย่อของผู้ใช้ ให้ LLM คิดวิเคราะห์และจัดเรียงใหม่ผ่าน Prompting
              </li>
              <li><b>3. Conversational Recommender &amp; Explanation Agent:</b>
                แชตบอตแนะนำสินค้าแบบโต้ตอบ ซักถามความต้องการเพิ่มเติม (Clarifying Questions) และให้คำอธิบายที่มีหลักฐานอ้างอิงชัดเจน (Grounded Explanations) ผ่าน RAG
              </li>
            </ol>

            <div class="cs-table-wrap">
              <table class="cs-table">
                <thead>
                  <tr>
                    <th>รูปแบบ Prompting</th>
                    <th>วิธีการทำงาน</th>
                    <th>ข้อดี</th>
                    <th>ข้อจำกัด / ความเสี่ยง</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><b>Pointwise</b></td>
                    <td>ส่งสินค้าให้ LLM ประเมิน <b>ทีละ 1 ชิ้น</b> (ถามว่าผู้ใช้คนนี้จะชอบชิ้นนี้ไหม? ตอบ 1-5 ดาว หรือ ใช่/ไม่ใช่)</td>
                    <td>เข้าใจง่าย Prompt สั้น</td>
                    <td>ไม่ได้เปรียบเทียบระหว่างตัวเลือก (No relative comparison) และต้องเรียก API K ครั้ง</td>
                  </tr>
                  <tr>
                    <td><b>Pairwise</b></td>
                    <td>ส่งสินค้าให้ LLM เปรียบเทียบ <b>ทีละคู่</b> (ชิ้น A กับ ชิ้น B ชิ้นไหนตรงใจผู้ใช้มากกว่ากัน?)</td>
                    <td>แม่นยำสูง เปรียบเทียบทางเลือกตรงๆ</td>
                    <td>จำนวนรอบบานปลายระดับ <code>O(K²)</code> &rarr; คำนวณช้ามากเกินไปในระบบจริง</td>
                  </tr>
                  <tr>
                    <td><b>Listwise</b></td>
                    <td>ส่งรายการสินค้าทั้ง 10 ชิ้นพร้อมกันใน Prompt เดียว ให้ LLM เรียงลำดับผลลัพธ์ทันที</td>
                    <td><b>เร็วที่สุดและประหยัดต้นทุนที่สุด</b> (เรียก API เพียงรอบเดียว)</td>
                    <td>เสี่ยงต่อ <b>Position Bias ใน Prompt</b> (LLM มักสนใจหัวและท้ายลิสต์มากกว่าตรงกลาง) และเสี่ยงต่อ Hallucination</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="cs-trap-box">
              <div class="cs-trap-title">🚨 The Production Trilemma (ข้อจำกัดวิศวกรรมจริง 3 ประการ)</div>
              <ul>
                <li><b>Latency (ความหน่วง):</b> LLM ใช้เวลาสร้าง Token ประมาณ 200 - 1500 ms ในขณะที่งบ Latency หน้าแรกของแอปคือ <b>&lt; 50 ms</b> &rarr; <u>ห้ามนำ LLM ไปใช้ในด่าน Candidate Generation เด็ดขาด!</u></li>
                <li><b>Cost (ค่าใช้จ่าย API):</b> การยิง API LLM ทุกครั้งที่มีคนเปิดแอปจะทำให้ต้นทุนเซิร์ฟเวอร์ระเบิด</li>
                <li><b>Hallucination (อาการหลอน):</b> LLM อาจแต่งชื่อสินค้าที่ไม่มีอยู่จริงขึ้นมา &rarr; ต้องมี <b>Guardrail / ID Filtering</b> กรองเอาต์พุตให้ตรงกับคลังสินค้าเสมอ</li>
              </ul>
            </div>

            <div class="cs-link-box">
              <div class="cs-link-title">🔗 ทางลัดเชื่อมโยงเนื้อหาบทที่ 7</div>
              <div class="cs-btn-row">
                <a class="cs-btn-link primary" href="index.html#recsys-llm" target="_blank" rel="noopener noreferrer">↗ เปิดอ่านบทที่ 7 เต็มในแท็บใหม่</a>
                <a class="cs-btn-link" href="index.html#recsys-llm-prompting" target="_blank" rel="noopener noreferrer">↗ เจาะลึก Pointwise vs Pairwise vs Listwise</a>
                <a class="cs-btn-link" href="index.html#recsys-llm-engineering" target="_blank" rel="noopener noreferrer">↗ กรณีศึกษาแก้ปัญหา Latency & Cost</a>
                <button class="cs-btn-link" type="button" onclick="window.switchRecsysChapter('recsys-llm')">📖 สลับไปอ่านบทที่ 7 ในหน้านี้</button>
              </div>
            </div>
          </div>`,
        sources: [],
        questions: [
          question('sum-ch7-q1', 'ในสถาปัตยกรรมระบบแนะนำแบบ Multi-Stage ตำแหน่งใดมีความเหมาะสมที่สุดในการนำ LLM มาทำหน้าที่ช่วยจัดอันดับ?',
            ['ด่านแรก (Candidate Generation) เพื่อคัดกรองสินค้า 10 ล้านชิ้น', 'ด่าน Re-ranking สุดท้าย โดยป้อนสินค้าที่ผ่านการคัดกรองเหลือเพียง 10-20 ชิ้น', 'ใช้แทนฐานข้อมูล SQL สำหรับจัดเก็บข้อมูลสำรอง', 'ใช้ในระบบสลับเครือข่าย Load Balancer'],
            1,
            'เนื่องจาก LLM มีความเร็วในการประมวลผลช้า (High Latency) และกินต้นทุนสูง การนำมาใช้ในด่านสุดท้ายกับสินค้าจำนวนน้อย (~10-20 ชิ้น) จึงเป็นแนวทางเดียวที่สอดคล้องกับข้อจำกัดทางวิศวกรรมจริง',
            ['ผิด นำไปใช้ด่านแรกจะเกิดความล่าช้ามหาศาลจนระบบล่ม', 'ถูกต้อง! เหมาะกับ Re-ranking ด่านสุดท้ายที่มีจำนวนชิ้นน้อย', 'ผิด LLM ไม่ใช่ฐานข้อมูล', 'ผิด ไม่ใช่หน้าที่ของ LLM']),
          question('sum-ch7-q2', 'รูปแบบการทำ Prompting แบบ "Listwise" มีข้อดีและข้อพึงระวังอย่างไรเมื่อเทียบกับ Pairwise?',
            ['Listwise รันเร็วกว่าเพราะส่งทั้งลิสต์ในคำสั่งเดียว แต่มีความเสี่ยงที่จะเกิด Position Bias ภายในหน้าต่าง Prompt และจัดอันดับของกลางลิสต์ตกหล่น', 'Listwise ทำงานช้ากว่า Pairwise เสมอ', 'Listwise สามารถกำจัดอาการ Hallucination ได้ 100% โดยไม่ต้องมี Guardrail', 'Listwise ใช้ได้เฉพาะกับข้อมูลตัวเลขเท่านั้น ไม่รองรับข้อความภาษาไทย'],
            0,
            'Listwise ส่งสินค้าทั้งลิสต์เข้าไปใน Prompt รอบเดียว ทำให้ใช้เวลาคำนวณและค่าใช้จ่ายน้อยกว่า Pairwise แต่มีข้อเสียคือ LLM มักให้ความสนใจเป็นพิเศษกับข้อความส่วนหัวและส่วนท้ายของ Prompt (Lost in the middle) และอาจแต่งข้อมูลหลอนได้',
            ['ถูกต้อง! รวดเร็วกว่าแต่ต้องระวัง Position Bias ใน Context Window', 'ผิด Listwise เร็วกว่า Pairwise ที่ต้องวนคู่แบบ O(K^2)', 'ผิด ยังคงมีอาการหลอนได้ ต้องมี Guardrail เสมอ', 'ผิด รองรับภาษาไทยได้เป็นปกติ'])
        ]
      },

      /* ==========================================================================
         Task 0.8: บทที่ 8 - Responsible & Trustworthy RecSys (Ch 08)
         ========================================================================== */
      {
        id: 'recsys-sum-responsible',
        number: '0.8',
        title: 'สรุปบทที่ 8: ระบบผู้แนะนำที่มีความรับผิดชอบและจริยธรรม (Responsible & Trustworthy RecSys)',
        goal: 'แม่นยำปัญหา Popularity Bias, ความเป็นธรรมสองฝั่ง (C-Fairness vs P-Fairness), ความเป็นส่วนตัว (DP & Federated Learning) และการป้องกัน Shilling Attacks',
        lead: 'ระบบที่ดีต้องไม่หลอกผู้ใช้และไม่ทำลายสังคม! สรุปมิติความรับผิดชอบ การตรวจวัดอคติ และเทคนิคการปกป้องความเป็นส่วนตัว',
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
                    <th>ปัญหา / สิ่งที่ต้องเผชิญ</th>
                    <th>เครื่องมือวัดผล / ตัวชี้วัด</th>
                    <th>กลยุทธ์การแก้ไข (Mitigation)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><b>1. Popularity Bias &amp; Bubbles</b></td>
                    <td>ระบบแนะนำกระจุกตัวอยู่เฉพาะสินค้าดัง สินค้าหางยาว (Long Tail) ถูกละเลย ผู้ใช้ติดใน Filter Bubble</td>
                    <td><b>Gini Index</b> (0 = กระจายเท่าเทียม, 1 = ผูกขาดชิ้นเดียว) และ Catalog Coverage</td>
                    <td>Exploration Budget, Inverse Propensity Scoring (IPS), MMR Diversification</td>
                  </tr>
                  <tr>
                    <td><b>2. Two-Sided Fairness</b></td>
                    <td>
                      <b>C-Fairness:</b> ผู้บริโภคต่างกลุ่มได้รับความแม่นยำไม่เท่ากัน<br>
                      <b>P-Fairness:</b> ร้านค้ารายย่อยไม่ได้รับโอกาสในการแสดงผล (Exposure)
                    </td>
                    <td>Demographic Parity, Equal Opportunity, Exposure Parity</td>
                    <td>Fair Re-ranking ในด่านสุดท้าย, Constrained Optimization จัดสรรโควตาการแสดงผลให้ผู้ผลิตรายย่อย</td>
                  </tr>
                  <tr>
                    <td><b>3. Privacy Protection</b></td>
                    <td>ข้อมูลประวัติการซื้อหลุดรั่ว หรือถูกระบุตัวตนย้อนกลับ (Re-identification)</td>
                    <td>Privacy Budget (ε - เอปซีลอน ใน Differential Privacy)</td>
                    <td><b>Differential Privacy (DP)</b> เติมสัญญาณรบกวน Noise และ <b>Federated Learning</b> เทรนบนเครื่องผู้ใช้ ส่งเฉพาะ Gradients</td>
                  </tr>
                  <tr>
                    <td><b>4. Shilling Attacks</b></td>
                    <td>บัญชีปลอมปั๊มรีวิวเพื่อดันสินค้าตนเอง (Push Attack) หรือทำลายคู่แข่ง (Nuke Attack)</td>
                    <td>Rating Distribution Anomaly, Suspicious Account Clustering</td>
                    <td>ตรวจจับความผิดปกติของเวลาการให้คะแนน (Burst detection), ตรวจสอบรอยเท้า IP/Device Fingerprinting</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="cs-trap-box">
              <div class="cs-trap-title">🚨 The Accuracy-Fairness Trade-off (กับดักข้อสอบ)</div>
              <p>การบังคับใช้มาตรการทางจริยธรรม (เช่น บังคับให้หน้าจอแสดงผลสินค้าของร้านค้ารายย่อยเพื่อ P-Fairness หรือเติม Noise เพื่อ Differential Privacy) มักทำให้ <b>ตัวชี้วัดความแม่นยำระยะสั้น (เช่น NDCG, CTR) ลดลงเล็กน้อย</b> เสมอ แต่นี่คือสิ่งที่ธุรกิจยอมแลกเพื่อความยั่งยืนของระบบนิเวศน์ทางธุรกิจในระยะยาว</p>
            </div>

            <div class="cs-link-box">
              <div class="cs-link-title">🔗 ทางลัดเชื่อมโยงเนื้อหาบทที่ 8</div>
              <div class="cs-btn-row">
                <a class="cs-btn-link primary" href="index.html#recsys-responsible" target="_blank" rel="noopener noreferrer">↗ เปิดอ่านบทที่ 8 เต็มในแท็บใหม่</a>
                <a class="cs-btn-link" href="index.html#recsys-resp-fairness" target="_blank" rel="noopener noreferrer">↗ เจาะลึก C-Fairness vs P-Fairness</a>
                <a class="cs-btn-link" href="index.html#recsys-resp-trust" target="_blank" rel="noopener noreferrer">↗ เจาะลึก Differential Privacy & Federated Learning</a>
                <button class="cs-btn-link" type="button" onclick="window.switchRecsysChapter('recsys-responsible')">📖 สลับไปอ่านบทที่ 8 ในหน้านี้</button>
              </div>
            </div>
          </div>`,
        sources: [],
        questions: [
          question('sum-ch8-q1', 'ในแพลตฟอร์มตลาดแบบสองด้าน (Two-Sided Marketplace เช่น ตลาดส่งอาหาร หรือ แพลตฟอร์มเพลงสตรีมมิง) การรักษาสมดุลแบบ P-Fairness (Producer Fairness) มีเป้าหมายเพื่ออะไร?',
            ['เพื่อรับประกันว่าผู้ใช้งานที่เป็นผู้บริโภคจะได้รับอาหารในราคาถูกที่สุดเสมอ', 'เพื่อกระจายโอกาสในการมองเห็น (Exposure) ให้แก่ศิลปินหรือร้านค้ารายย่อย ไม่ให้ศิลปินดังหรือร้านยักษ์ใหญ่ผูกขาดทราฟฟิกทั้งระบบ', 'เพื่อบังคับให้ผู้ผลิตทุกคนจ่ายค่าโฆษณาเท่ากัน', 'เพื่อปิดกั้นไม่ให้ผู้ใช้พิมพ์ค้นหาชื่อร้านค้าได้เอง'],
            1,
            'P-Fairness มุ่งเน้นการให้ความเป็นธรรมแก่ผู้ผลิต (Producers) โดยเปิดพื้นที่จัดสรร Exposure ให้แก่สินค้าหางยาวและผู้ผลิตรายย่อย เพื่อความยั่งยืนของระบบนิเวศน์ทางธุรกิจในระยะยาว',
            ['ผิด นั่นคือมุมมอง C-Fairness', 'ถูกต้อง! P-Fairness ปกป้องผู้ผลิตรายย่อยให้มีโอกาสแข่งขันอย่างเป็นธรรม', 'ผิด ไม่ใช่การเก็บค่าโฆษณา', 'ผิด ไม่เกี่ยวกับการปิดกั้นการค้นหา']),
          question('sum-ch8-q2', 'เทคโนโลยี Federated Learning ช่วยปกป้องความเป็นส่วนตัวของผู้ใช้งานในระบบแนะนำได้อย่างไร?',
            ['โดยการลบประวัติการใช้งานทิ้งทุกๆ 1 ชั่วโมง', 'โดยการเทรนโมเดลบนอุปกรณ์ของผู้ใช้โดยตรง และส่งเฉพาะค่าการอัปเดตโมเดล (Gradients) กลับไปยังเซิร์ฟเวอร์ โดยที่ข้อมูลส่วนตัวดิบไม่เคยถูกส่งออกนอกเครื่อง', 'โดยการเปลี่ยนชื่อผู้ใช้เป็นตัวเลขรหัสผ่าน', 'โดยการบังคับให้ผู้ใช้ทุกคนตอบแบบสอบถามแบบไม่ระบุชื่อ'],
            1,
            'Federated Learning เป็นการกระจายการเรียนรู้ไปที่ Edge Devices (เช่น สมาร์ตโฟน) ข้อมูลดิบของผู้ใช้จะอยู่บนเครื่องเสมอ เซิร์ฟเวอร์ทำหน้าที่เพียงรวมศูนย์ค่าน้ำหนักโมเดล (Federated Averaging)',
            ['ผิด ไม่ใช่การลบข้อมูลทิ้ง', 'ถูกต้อง! เทรนบนเครื่องและส่งเฉพาะ Weight updates ข้อมูลดิบไม่หลุดออกจากเครื่อง', 'ผิด นั่นเป็นเพียง Anonymization ธรรมดา', 'ผิด ไม่ใช่การทำแบบสอบถาม'])
        ]
      },

      /* ==========================================================================
         Task 0.9: บทที่ 9 - แผนผังการตัดสินใจเลือกโมเดลและ 10 กับดักข้อสอบ (Capstone)
         ========================================================================== */
      {
        id: 'recsys-sum-capstone',
        number: '0.9',
        title: 'สรุปบทที่ 9: แผนผังการตัดสินใจเลือกโมเดล และ 10 กับดักข้อสอบยอดฮิต (Capstone Synthesis)',
        goal: 'มองเห็นภาพรวมการเลือกสถาปัตยกรรมโมเดลตามโจทย์ธุรกิจ และเช็กลิสต์จุดผิดพลาดยอดฮิตก่อนก้าวเข้าสู่ห้องสอบ',
        lead: 'สังเคราะห์ทุกบทเข้าด้วยกัน! สรุป Master Decision Matrix สำหรับเลือกวิธีแก้ปัญหา พร้อม 10 กับดักข้อสอบที่ห้ามตอบผิด',
        body: `<div class="cs-card">
            <div class="cs-header">
              <h3>⚡ Master Decision Matrix: เจอโจทย์แบบนี้ เลือกโมเดลใด?</h3>
              <span class="cs-badge-pill">Ch 09</span>
            </div>

            <div class="cs-table-wrap">
              <table class="cs-table">
                <thead>
                  <tr>
                    <th>สถานการณ์ / ข้อกำหนดของโจทย์</th>
                    <th>โมเดล / สถาปัตยกรรมที่ควรเลือก</th>
                    <th>เหตุผลหลักทางวิศวกรรม</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>ระบบเปิดใหม่ ไม่มีประวัติคลิกหรือซื้อเลย (Extreme Cold-Start)</td>
                    <td><b>Popularity Baseline + Onboarding Survey</b></td>
                    <td>เมื่อไม่มีรอยเท้าใดๆ การแนะนำของดังและการสอบถามเบื้องต้นคือแนวทางเดียวที่เสถียร</td>
                  </tr>
                  <tr>
                    <td>สินค้ามีเนื้อหาคำบรรยายเยอะ แต่เป็นสินค้าใหม่เพิ่งลงคลังตลอดเวลา (News, Articles)</td>
                    <td><b>Content-Based Filtering (Bi-Encoder / TF-IDF)</b></td>
                    <td>พึ่งพาเฉพาะฟีเจอร์เนื้อหาของสินค้า ไม่ง้อประวัติการคลิกเดิม แก้ Item Cold-Start สมบูรณ์</td>
                  </tr>
                  <tr>
                    <td>สินค้ามีหลายสื่อประกอบกัน (รูปปก คลิปสั้น ตัวอย่างเสียง)</td>
                    <td><b>Multimodal Fusion (Intermediate / Late Fusion)</b></td>
                    <td>ดึงคุณลักษณะข้ามสื่อมารวมพลังกันในเวกเตอร์สเปซ</td>
                  </tr>
                  <tr>
                    <td>มีประวัติการซื้อเยอะ ต้องการระบบที่เสถียรและอธิบายเหตุผลได้ชัดเจน</td>
                    <td><b>Item-based Collaborative Filtering (Amazon Item-kNN)</b></td>
                    <td>Precompute ตารางความคล้ายระหว่างสินค้าได้ล่วงหน้า และอธิบายง่าย ("เพราะซื้อ X จึงแนะนำ Y")</td>
                  </tr>
                  <tr>
                    <td>ข้อมูลเป็น Implicit Feedback (คลิก/ดู) ไม่มีคะแนนดาว</td>
                    <td><b>Matrix Factorization + BPR (Bayesian Personalized Ranking)</b></td>
                    <td>ออกแบบเพื่อ Pairwise Ranking บังคับให้ของที่คลิกชนะของที่ไม่คลิก</td>
                  </tr>
                  <tr>
                    <td>คลังสินค้ามหึมา (10 ล้านชิ้น) ต้องการผลลัพธ์ด่านแรกในเวลา &lt; 15 ms</td>
                    <td><b>Two-Tower DSSM + Vector ANN Search (Faiss / ScaNN)</b></td>
                    <td>Precompute เวกเตอร์สินค้าล่วงหน้า รันเฉพาะ User Tower แล้วค้นหาทันที</td>
                  </tr>
                  <tr>
                    <td>ต้องการลดความซ้ำซากจำเจบนหน้าจอ เพิ่มความหลากหลาย</td>
                    <td><b>Maximal Marginal Relevance (MMR) ในด่าน Re-ranking</b></td>
                    <td>ควบคุมสมดุลระหว่างความชอบส่วนบุคคลกับความหลากหลายด้วยพารามิเตอร์ λ</td>
                  </tr>
                  <tr>
                    <td>ต้องการจัดอันดับละเอียดในด่านสุดท้ายด้วยความเข้าใจเชิงภาษาขั้นสูง</td>
                    <td><b>LLM Reranker (Listwise Prompting กับ Top-10 ผู้สมัคร)</b></td>
                    <td>ใช้ความฉลาดของ LLM วิเคราะห์บริบทที่ซับซ้อนในงบ Latency ที่ควบคุมได้</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="cs-trap-box">
              <div class="cs-trap-title">🚨 สรุป 10 กับดักข้อสอบยอดฮิต (The Top 10 Exam Traps)</div>
              <ol>
                <li><b>Data Leakage จาก Random Split:</b> ใน RecSys ห้ามสุ่มแบ่ง Train/Test แบบสุ่มเด็ดขาด! <u>ต้องแบ่งตามเส้นเวลา (Temporal Split) เสมอ</u></li>
                <li><b>ทายดาวแม่นไม่ได้แปลว่าเรียงดี:</b> โมเดลที่ได้ค่า RMSE ต่ำสุด ไม่ได้รับประกันว่าจะได้ค่า NDCG@10 หรือ Conversion สูงสุด</li>
                <li><b>MRR สนใจเฉพาะชิ้นแรก:</b> สูตรคือ <code>1 / rank_1</code> อย่าหลงกลเอาอันดับของชิ้นที่ 2 หรือ 3 มาบวกเฉลี่ย</li>
                <li><b>Cosine vs Pearson:</b> Cosine ไม่ได้ลบค่าเฉลี่ยส่วนบุคคล ส่วน Pearson Correlation มีการ Mean-Centering แก้ปัญหาคนให้คะแนนง่าย/ยาก</li>
                <li><b>User-kNN vs Item-kNN:</b> Item-kNN เสถียรกว่ามากและ Precompute ออฟไลน์ล่วงหน้าได้ ส่วน User-kNN ต้องคำนวณสดเมื่อคนมีจำนวนมหาศาล</li>
                <li><b>Two-Tower ข้อจำกัด:</b> ไม่สามารถจับปฏิสัมพันธ์ข้ามฟีเจอร์ในระดับลึก (Cross-features) ได้เพราะเวกเตอร์เพิ่งมาเจอกันที่ขั้นตอน Dot Product</li>
                <li><b>ห้ามใช้ LLM ในด่านแรก:</b> Latency ระดับ 200-1500 ms เกินงบ 50 ms ของหน้าแรกแอปพลิเคชันอย่างมหาศาล</li>
                <li><b>Offline ชนะ ไม่ได้รับประกันว่า Online จะชนะ:</b> ผลออฟไลน์ไม่สะท้อน Exposure Bias, Position Bias, และความหน่วงเวลาจริง</li>
                <li><b>P-Fairness vs C-Fairness:</b> P-Fairness คือความเป็นธรรมฝั่งผู้ผลิต/ร้านค้ารายย่อย, C-Fairness คือฝั่งผู้บริโภค</li>
                <li><b>Differential Privacy:</b> ต้องเติมสัญญาณรบกวนทางคณิตศาสตร์ (Calibrated Noise) การลบชื่อหรือ ID ผู้ใช้ออกธรรมดาไม่สามารถป้องกัน Re-identification ได้</li>
              </ol>
            </div>

            <div class="cs-link-box">
              <div class="cs-link-title">🔗 ทางลัดเชื่อมโยงเนื้อหาบทที่ 9</div>
              <div class="cs-btn-row">
                <a class="cs-btn-link primary" href="index.html#recsys-capstone" target="_blank" rel="noopener noreferrer">↗ เปิดอ่านบทที่ 9 เต็มในแท็บใหม่</a>
                <a class="cs-btn-link" href="index.html#recsys-capstone-matrix" target="_blank" rel="noopener noreferrer">↗ ตาราง Decision Matrix ฉบับเต็ม</a>
                <a class="cs-btn-link" href="index.html#recsys-capstone-pitfalls" target="_blank" rel="noopener noreferrer">↗ เช็กลิสต์ 10 ข้อผิดพลาดยอดฮิตก่อนสอบ</a>
                <button class="cs-btn-link" type="button" onclick="window.switchRecsysChapter('recsys-capstone')">📖 สลับไปอ่านบทที่ 9 ในหน้านี้</button>
              </div>
            </div>
          </div>`,
        sources: [],
        questions: [
          question('sum-ch9-q1', 'ในการจัดเตรียมชุดข้อมูลเพื่อประเมินผลระบบแนะนำแบบออฟไลน์ ข้อใดคือแนวทางปฏิบัติที่ถูกต้องเพื่อป้องกันปัญหา Data Leakage?',
            ['สุ่มแถวข้อมูลในเมทริกซ์ 80% เป็น Train และ 20% เป็น Test โดยไม่สนใจเวลาที่เกิดปฏิสัมพันธ์', 'แบ่งข้อมูลตามเส้นเวลา (Temporal Split) โดยใช้ประวัติการกระทำในอดีตเป็น Train และใช้เหตุการณ์ที่เกิดขึ้นหลังจากจุดตัดเวลาเป็น Test', 'คัดเลือกเฉพาะสินค้าที่มียอดขายสูงสุดมาเป็น Test Set', 'ใช้ข้อมูลชุดเดียวกันทั้งในการเทรนและทดสอบเพื่อประหยัดเวลา'],
            1,
            'ระบบแนะนำทำงานในโลกจริงที่อดีตทำนายอนาคต การแบ่งข้อมูลแบบสุ่ม (Random Split) จะทำให้ข้อมูลการคลิกในอนาคตหลุดเข้าไปในชุดฝึกสอน (Data Leakage) ส่งผลให้ผลทดสอบสวยหรูเกินจริงแต่เจ๊งในโปรดักชัน จึงต้องใช้ Temporal Split เสมอ',
            ['ผิด Random Split ทำให้เกิด Data Leakage', 'ถูกต้อง! Temporal Split แบ่งตามเวลาคือมาตรฐานที่ถูกต้อง', 'ผิด นั่นทำให้เกิด Popularity Bias รุนแรง', 'ผิด ห้ามทดสอบบนข้อมูลที่ใช้เทรนเด็ดขาด']),
          question('sum-ch9-q2', 'หากบริษัทมีสินค้า 5 ล้านชิ้น และต้องการสร้างระบบแนะนำหน้าแรกของแอปพลิเคชัน สถาปัตยกรรมในอุดมคติที่ผสมผสานความเร็วและความแม่นยำสูงที่สุดคือข้อใด?',
            ['ใช้ Cross-Encoder คำนวณคะแนนสินค้าทั้ง 5 ล้านชิ้นตรงๆ', 'สายพาน 2-3 ขั้นตอน: ใช้ Two-Tower (ANN Search) ดึงผู้สมัคร ~200 ชิ้น &rarr; ใช้ Ranking Model (เช่น DLRM/DeepFM) จัดอันดับ &rarr; ใช้ MMR/Business Rules คุมความหลากหลายก่อนแสดงผล', 'ใช้เฉพาะ Popularity Baseline แสดงสินค้า 10 ชิ้นเดิมตลอดกาล', 'ใช้ Pure User-based kNN คำนวณความคล้ายของผู้ใช้แบบสดๆ ทุกครั้งที่เปิดแอป'],
            1,
            'สถาปัตยกรรม Multi-Stage Cascade (Candidate Gen &rarr; Ranking &rarr; Reranking) เป็นมาตรฐานอุตสาหกรรมที่แก้ปัญหา Trilemma ระหว่าง Latency, Accuracy, และ Diversity ได้อย่างสมบูรณ์แบบ',
            ['ผิด Cross-Encoder ช้าเกินไปสำหรับ 5 ล้านชิ้น', 'ถูกต้อง! Multi-Stage Pipeline ผสาน Two-Tower กับ Ranking Model ได้ลงตัวที่สุด', 'ผิด ขาดการแนะนำเฉพาะบุคคล', 'ผิด User-kNN แบบสดจะหน่วงเวลาเกินรับได้'])
        ]
      }
    ]
  };

  /* Inject summary chapter at the very beginning of the chapters array */
  window.RECSYS_CHAPTERS = [summaryChapter, ...(window.RECSYS_CHAPTERS || [])];
})();
