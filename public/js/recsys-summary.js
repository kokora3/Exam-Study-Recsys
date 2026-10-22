/* Course content for Fast-Track Executive Summary (Exam Cheat Sheet & Core Takeaways) */
(() => {
  'use strict';

  const question = (id, q, choices, answer, explanation, reasons) => ({ id, q, choices, answer, explanation, reasons, version: 1 });

  const summaryChapter = {
    id: 'recsys-summary',
    number: '0',
    badge: '⚡ สรุป',
    title: 'บทสรุปด่วนเตรียมสอบ 9 บทเรียน (Fast-Track Cheat Sheet)',
    kicker: 'CORE CONCEPTS & FORMULA CHEAT SHEET',
    description: 'รวบรวมแก่นสาระสำคัญ สูตรจำเข้าห้องสอบ ตารางเปรียบเทียบข้อดี-ข้อเสีย และกับดักข้อสอบยอดฮิตจากทั้ง 9 บทเรียนหลัก (ไม่รวมพื้นฐานคณิตศาสตร์) พร้อมแนบลิงก์สำหรับกระโดดไปอ่านบทเต็มในแท็บใหม่ได้ทันที',
    lessons: [
      /* ==========================================================================
         Task 0.1: สรุปภาพรวมและสายพาน 3 ด่าน (Ch 01)
         ========================================================================== */
      {
        id: 'recsys-sum-pipeline',
        number: '0.1',
        title: 'สรุปบทที่ 1: รากฐาน สายพาน 3 ด่าน และวงจรสะท้อนกลับ',
        goal: 'แม่นยำความแตกต่างระหว่าง Search vs RecSys, สถาปัตยกรรมสายพาน 3 ขั้น, ปัญหา Cold-Start และ Feedback Loop',
        lead: 'ระบบแนะนำไม่ใช่ระบบค้นหา! สรุปสถาปัตยกรรมโปรดักชันยุคใหม่ (Candidate Generation → Scoring → Re-ranking) และความท้าทายหลักที่ข้อสอบต้องถาม',
        body: `<div class="easy-explain">
            <h3>⚡ หัวใจสำคัญบทที่ 1 ใน 1 นาที</h3>
            <ul>
              <li><b>Search vs Recommendation:</b> Search มี <i>Explicit Query</i> (ผู้ใช้พิมพ์คำค้นหาชัดเจน) ส่วน RecSys ขับเคลื่อนด้วย <i>User Context & History</i> (ผู้ใช้ไม่จำเป็นต้องพิมพ์ค้นหา ระบบคาดเดาความต้องการเชิงรุก)</li>
              <li><b>Rating Prediction vs Ranking:</b> การทายคะแนนดาวแม่น (เช่น ได้ RMSE ต่ำ) <u>ไม่ได้การันตี</u> ว่าลำดับสินค้าแนะนำด้านบน (Top-K) จะถูกใจผู้ใช้ เพราะผู้ใช้สนใจเฉพาะของดีอันดับต้นๆ เท่านั้น</li>
              <li><b>Explicit vs Implicit Feedback:</b> Explicit (ดาว, รีวิว) มีความบริสุทธิ์สูงแต่ข้อมูลเบาบางมาก (Sparsity &gt; 99%) ส่วน Implicit (คลิก, เวลาดู, การเลื่อนผ่าน) มีปริมาณมหาศาลแต่มีสัญญาณรบกวนและอคติจากตำแหน่ง (Position Bias)</li>
            </ul>

            <div class="callout">
              <h4>🏗️ สถาปัตยกรรมสายพาน 3 ด่าน (Multi-Stage Production Pipeline)</h4>
              <table style="width:100%;border-collapse:collapse;margin-top:8px;">
                <thead>
                  <tr style="border-bottom:2px solid var(--line2);text-align:left;">
                    <th style="padding:6px 8px;">ด่านที่</th>
                    <th style="padding:6px 8px;">ชื่อด่าน</th>
                    <th style="padding:6px 8px;">จำนวนไอเทม</th>
                    <th style="padding:6px 8px;">โมเดลและเทคนิคที่ใช้</th>
                    <th style="padding:6px 8px;">เป้าหมายหลัก</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="border-bottom:1px solid var(--line);">
                    <td style="padding:6px 8px;"><b>1</b></td>
                    <td style="padding:6px 8px;"><b>Candidate Generation (Retrieval)</b></td>
                    <td style="padding:6px 8px;">ล้านชิ้น &rarr; เหลือ ~100-500 ชิ้น</td>
                    <td style="padding:6px 8px;">Two-Tower, Vector Search (ANN), Item-kNN, Heuristics</td>
                    <td style="padding:6px 8px;">เน้น <b>High Recall</b> และ <b>Low Latency (&lt; 10-20ms)</b> ไม่ตกหล่นของดี</td>
                  </tr>
                  <tr style="border-bottom:1px solid var(--line);">
                    <td style="padding:6px 8px;"><b>2</b></td>
                    <td style="padding:6px 8px;"><b>Scoring &amp; Ranking</b></td>
                    <td style="padding:6px 8px;">~100-500 ชิ้น &rarr; จัดอันดับเรียงคะแนน</td>
                    <td style="padding:6px 8px;">DeepFM, DLRM, Cross-Encoder, Gradient Boosted Trees</td>
                    <td style="padding:6px 8px;">เน้น <b>High Precision</b> คำนวณความน่าจะเป็นของคลิก/ซื้อ (pCTR, pCVR)</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 8px;"><b>3</b></td>
                    <td style="padding:6px 8px;"><b>Re-ranking &amp; Business Rules</b></td>
                    <td style="padding:6px 8px;">~50 ชิ้น &rarr; เหลือ Top-K หน้าจอ (~10-20)</td>
                    <td style="padding:6px 8px;">MMR (Diversity), Deduplication, Business Constraints, LLM Reranker</td>
                    <td style="padding:6px 8px;">คุมความหลากหลาย แก้ความซ้ำซาก และบังคับใช้กฎธุรกิจ</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="callout" style="background:rgba(255,180,87,0.08);border-color:rgba(255,180,87,0.3);">
              <h4 style="color:var(--warn,#ffb457);">⚠️ กับดักข้อสอบยอดฮิต (Exam Traps)</h4>
              <p><b>1. Feedback Loop:</b> ระบบแนะนำของดัง &rarr; ผู้ใช้เห็นแต่ของดัง &rarr; ระบบเก็บข้อมูลคลิกของดังเพิ่ม &rarr; ยิ่งแนะนำแต่ของดัง! วิธีแก้คือต้องบันทึก <i>Exposure Log</i> (บันทึกว่าของชิ้นไหนถูกนำไปแสดงบ้าง) และเจียดพื้นที่ทำ <b>Exploration</b> ให้กับสินค้าหางยาว (Long-Tail)</p>
              <p><b>2. Cold-Start Problem:</b> มี 2 ฝั่งคือ <i>New User</i> (แก้ด้วยแบบสอบถามความชอบตอน Onboarding, แนะนำตามความนิยมยอดฮิต หรือ Demographic) และ <i>New Item</i> (แก้ด้วย Content-Based Filtering หรือ Multimodal Encoders เพราะไม่ต้องพึ่งประวัติรอยเท้าเดิม)</p>
            </div>

            <div class="callout" style="background:rgba(94,224,194,0.08);border-color:rgba(94,224,194,0.3);margin-top:14px;">
              <h4 style="color:var(--accent);">🔗 ลิงก์อ่านเจาะลึกบทเต็ม (Deep Links)</h4>
              <p style="margin-bottom:8px;">คลิกเพื่อดูเนื้อหาแบบละเอียดพร้อมการ์ดอนิเมชันจำลองและแบบฝึกหัดเต็ม:</p>
              <div style="display:flex;gap:10px;flex-wrap:wrap;">
                <a class="btn primary" href="index.html#recsys-introduction" target="_blank" rel="noopener noreferrer">↗ เปิดอ่านบทที่ 1 เต็มในแท็บใหม่</a>
                <a class="btn" href="index.html#recsys-pipeline" target="_blank" rel="noopener noreferrer">↗ เจาะลึก 3-Stage Pipeline</a>
                <a class="btn" href="index.html#recsys-feedback-signals" target="_blank" rel="noopener noreferrer">↗ เจาะลึก Explicit vs Implicit</a>
                <button class="btn" type="button" onclick="window.switchRecsysChapter('recsys-introduction')">📖 สลับไปอ่านบทที่ 1 ในหน้านี้</button>
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
         Task 0.2: สรุปเข็มทิศการวัดผลและตัวชี้วัด (Ch 02)
         ========================================================================== */
      {
        id: 'recsys-sum-metrics',
        number: '0.2',
        title: 'สรุปบทที่ 2: เข็มทิศการวัดผล (Metrics, NDCG, MRR, Offline vs Online A/B)',
        goal: 'แม่นยำสูตรคำนวณความแม่นยำ ความแตกต่างระหว่างตัวชี้วัดอันดับ และการออกแบบการทดลอง A/B Testing',
        lead: 'วัดผิด = ล้มเหลวทั้งระบบ! สรุปครบทั้งตัวชี้วัด Error, Top-K Ranking, Beyond-Accuracy และหัวใจของการทดสอบ A/B Test',
        body: `<div class="easy-explain">
            <h3>⚡ สรุปสูตรและการเลือกตัวชี้วัดในห้องสอบ</h3>
            
            <div class="callout">
              <h4>📊 สรุปสูตรคำนวณสำคัญที่ออกสอบบ่อยที่สุด</h4>
              <ul>
                <li><b>MAE (Mean Absolute Error):</b> $\text{MAE} = \frac{1}{|T|} \sum |r_{ui} - \hat{r}_{ui}|$ &rarr; เฉลี่ยผลต่างสัมบูรณ์ ความผิดพลาดทุกลูกมีน้ำหนักเชิงเส้นเท่ากัน</li>
                <li><b>RMSE (Root Mean Squared Error):</b> $\text{RMSE} = \sqrt{\frac{1}{|T|} \sum (r_{ui} - \hat{r}_{ui})^2}$ &rarr; ยกกำลังสองก่อนเฉลี่ย จึง <u>ลงโทษความผิดพลาดก้อนใหญ่ (Outliers) อย่างรุนแรง</u></li>
                <li><b>Precision@K vs Recall@K:</b>
                  <ul>
                    <li>$\text{Precision@K} = \frac{\text{จำนวนของที่ตรงใจใน Top-K}}{K}$ &rarr; แนะนำไป K ชิ้น มีของตรงใจกี่ชิ้น? (เน้นความคุ้มค่าของพื้นที่หน้าจอ)</li>
                    <li>$\text{Recall@K} = \frac{\text{จำนวนของที่ตรงใจใน Top-K}}{\text{จำนวนของที่ผู้ใช้ชอบทั้งหมดใน Test Set}}$ &rarr; ในบรรดาของที่ผู้ใช้ชอบทั้งหมด เรากวาดติดมาได้กี่เปอร์เซ็นต์?</li>
                  </ul>
                </li>
                <li><b>MRR (Mean Reciprocal Rank):</b> ดูเฉพาะ <u>ของที่ตรงใจชิ้นแรก</u> ว่าอยู่อันดับที่เท่าไร ($1/\text{rank}_1$) &rarr; เหมาะกับระบบค้นหาหรือที่ต้องการคำตอบเดียว เช่น ตู้ Kiosk, คำถามถาม-ตอบ</li>
                <li><b>DCG &amp; NDCG@K (Normalized Discounted Cumulative Gain):</b>
                  $$\text{DCG@K} = \sum_{i=1}^K \frac{2^{rel_i} - 1}{\log_2(i + 1)}, \quad \text{NDCG@K} = \frac{\text{DCG@K}}{\text{IDCG@K}}$$
                  ให้คะแนนตามระดับความเกี่ยวข้อง ($rel_i$) และลงโทษตามตำแหน่งด้วยตัวหาร $\log_2(i+1)$ โดย $\text{IDCG}$ คือค่า DCG ของการเรียงลำดับในอุดมคติ (Ideal Ranking) ทำให้ค่า NDCG อยู่ในช่วง $[0, 1]$ เสมอ!
                </li>
              </ul>
            </div>

            <div class="callout">
              <h4>🎯 Beyond-Accuracy Metrics (เมื่อความแม่นยำอย่างเดียวไม่พอ)</h4>
              <table style="width:100%;border-collapse:collapse;margin-top:8px;">
                <thead>
                  <tr style="border-bottom:2px solid var(--line2);text-align:left;">
                    <th style="padding:6px 8px;">ตัวชี้วัด</th>
                    <th style="padding:6px 8px;">คำอธิบายเชิงแนวคิด</th>
                    <th style="padding:6px 8px;">ผลทางธุรกิจ</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="border-bottom:1px solid var(--line);">
                    <td style="padding:6px 8px;"><b>Catalog Coverage</b></td>
                    <td style="padding:6px 8px;">สัดส่วนสินค้าในคลังทั้งหมดที่เคยถูกหยิบมาแนะนำ ($|\bigcup R_u| / |I|$)</td>
                    <td style="padding:6px 8px;">ป้องกันการแนะนำกระจุกตัวอยู่แค่ 1% ของสินค้าดัง</td>
                  </tr>
                  <tr style="border-bottom:1px solid var(--line);">
                    <td style="padding:6px 8px;"><b>Diversity (Intra-List)</b></td>
                    <td style="padding:6px 8px;">ระยะห่างเฉลี่ยระหว่างสินค้าในลิสต์แนะนำเดียวกัน ($1 - \text{Sim}$)</td>
                    <td style="padding:6px 8px;">ป้องกันหน้าจอเต็มไปด้วยของประเภทเดียวกัน เช่น แนะนำเคสมือถือ 10 ชิ้นรวด</td>
                  </tr>
                  <tr style="border-bottom:1px solid var(--line);">
                    <td style="padding:6px 8px;"><b>Novelty</b></td>
                    <td style="padding:6px 8px;">ความแปลกใหม่/ความไม่เกร่อ วัดด้วย $-\log_2 P(i)$ ตามความหายาก</td>
                    <td style="padding:6px 8px;">ช่วยค้นพบของดีนอกสายตา (Serendipity)</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 8px;"><b>A/B Testing (Online)</b></td>
                    <td style="padding:6px 8px;">สุ่มแบ่งผู้ใช้จริงเป็นกลุ่มควบคุม (A) และกลุ่มทดสอบ (B) วัด Conversion Rate/CTR</td>
                    <td style="padding:6px 8px;">เป็น Gold Standard ตัดสินใจขึ้นระบบจริง (Offline ชนะ ไม่ได้รับประกันว่า Online จะชนะเสมอไป)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="callout" style="background:rgba(94,224,194,0.08);border-color:rgba(94,224,194,0.3);margin-top:14px;">
              <h4 style="color:var(--accent);">🔗 ลิงก์อ่านเจาะลึกบทเต็ม (Deep Links)</h4>
              <div style="display:flex;gap:10px;flex-wrap:wrap;">
                <a class="btn primary" href="index.html#recsys-evaluation" target="_blank" rel="noopener noreferrer">↗ เปิดอ่านบทที่ 2 เต็มในแท็บใหม่</a>
                <a class="btn" href="index.html#recsys-ndcg" target="_blank" rel="noopener noreferrer">↗ ตัวอย่างคำนวณสูตร NDCG ละเอียด</a>
                <a class="btn" href="index.html#recsys-online-ab" target="_blank" rel="noopener noreferrer">↗ หลักการทำ A/B Testing</a>
                <button class="btn" type="button" onclick="window.switchRecsysChapter('recsys-evaluation')">📖 สลับไปอ่านบทที่ 2 ในหน้านี้</button>
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
         Task 0.3: สรุป Content-Based RecSys (Ch 03)
         ========================================================================== */
      {
        id: 'recsys-sum-content',
        number: '0.3',
        title: 'สรุปบทที่ 3: ระบบแนะนำจากเนื้อหา (TF-IDF, Embeddings, Bi-Encoder, MMR)',
        goal: 'เข้าใจกระบวนการสกัดฟีเจอร์เนื้อหา การเปรียบเทียบ Cosine Similarity การสร้าง User Centroid Profile และการกระจายความหลากหลายด้วย MMR',
        lead: 'แนะนำสิ่งของจาก "คุณสมบัติเนื้อหา" ไม่แคร์รอยเท้าคนอื่น! เหมาะอย่างยิ่งสำหรับแก้ Item Cold-Start และคลังสินค้าที่มีคำบรรยายอุดมสมบูรณ์',
        body: `<div class="easy-explain">
            <h3>⚡ สรุปกระบวนการสร้าง Content-Based Recommender</h3>
            <ul>
              <li><b>1. Feature Representation:</b> เปลี่ยนคำอธิบาย/สเปกสินค้าเป็นเวกเตอร์
                <ul>
                  <li><i>TF-IDF:</i> $\text{TF}(t, d) \times \log(\frac{N}{\text{DF}(t)})$ &rarr; ให้ค่าน้ำหนักสูงกับคำที่เด่นในเอกสารนี้ แต่ไม่เกร่อในคลังเอกสาร</li>
                  <li><i>Dense Embeddings (Sentence Transformers):</i> จับความหมายเชิงลึก (Semantics) แก้ปัญหาคำพ้องความหมาย (Synonyms) เช่น "มือถือ" กับ "สมาร์ตโฟน" ได้เวกเตอร์ความหมายใกล้กัน</li>
                </ul>
              </li>
              <li><b>2. User Profile Construction:</b> สร้างเวกเตอร์ตัวแทนของผู้ใช้ ($u$)
                <ul>
                  <li><i>Centroid Vector:</i> หาเวกเตอร์เฉลี่ยถ่วงน้ำหนักจากสินค้าที่ผู้ใช้คนนั้นเคยชอบในอดีต: $\vec{p}_u = \frac{1}{|I_u|} \sum_{i \in I_u} \vec{v}_i$</li>
                  <li><i>Decay Profile:</i> ถ่วงน้ำหนักความชอบใหม่ให้สำคัญกว่าความชอบเก่า (Time Decay)</li>
                </ul>
              </li>
              <li><b>3. Similarity Matching:</b> คำนวณความเข้ากันได้ด้วย <b>Cosine Similarity</b>:
                $$\cos(\theta) = \frac{\vec{p}_u \cdot \vec{v}_i}{\|\vec{p}_u\| \|\vec{v}_i\|}$$
                วัดที่ <u>มุมของเวกเตอร์</u> ไม่หลงกลความยาวเอกสาร (ค่าอยู่ระหว่าง -1 ถึง 1 หรือ 0 ถึง 1 เมื่อเวกเตอร์เป็นบวก)
              </li>
              <li><b>4. Bi-Encoder vs Cross-Encoder:</b>
                <ul>
                  <li><i>Bi-Encoder (Two-Tower):</i> เข้ารหัส User กับ Item แยกกันล่วงหน้า แล้วจับคู่ด้วย Cosine / Dot Product รวดเร็วมาก เหมาะสำหรับ <b>Retrieval ด่านแรก</b></li>
                  <li><i>Cross-Encoder:</i> ป้อน (User, Item) เข้า Attention พร้อมกันเพื่อวิเคราะห์ปฏิสัมพันธ์ทุกมิติ แม่นยำสูงสุดแต่คำนวณช้า เหมาะสำหรับ <b>Reranking ด่านหลัง</b></li>
                </ul>
              </li>
              <li><b>5. MMR (Maximal Marginal Relevance) เพื่อความหลากหลาย:</b>
                $$\text{MMR} = \arg\max_{i \in R \setminus S} \left[ \lambda \text{Sim}_1(i, u) - (1 - \lambda) \max_{j \in S} \text{Sim}_2(i, j) \right]$$
                เลือกชิ้นที่ทั้ง <b>ตรงใจผู้ใช้ ($\text{Sim}_1$)</b> และ <b>ไม่ซ้ำซากกับของที่เลือกไปแล้วในลิสต์ ($\text{Sim}_2$)</b> โดยมี $\lambda$ ควบคุมสมดุล
              </li>
            </ul>

            <div class="callout" style="background:rgba(94,224,194,0.08);border-color:rgba(94,224,194,0.3);margin-top:14px;">
              <h4 style="color:var(--accent);">🔗 ลิงก์อ่านเจาะลึกบทเต็ม (Deep Links)</h4>
              <div style="display:flex;gap:10px;flex-wrap:wrap;">
                <a class="btn primary" href="index.html#recsys-content" target="_blank" rel="noopener noreferrer">↗ เปิดอ่านบทที่ 3 เต็มในแท็บใหม่</a>
                <a class="btn" href="index.html#recsys-content-tfidf" target="_blank" rel="noopener noreferrer">↗ เจาะลึกสูตรคำนวณ TF-IDF</a>
                <a class="btn" href="index.html#recsys-content-mmr" target="_blank" rel="noopener noreferrer">↗ เจาะลึกหลักการกระจายความหลากหลายด้วย MMR</a>
                <button class="btn" type="button" onclick="window.switchRecsysChapter('recsys-content')">📖 สลับไปอ่านบทที่ 3 ในหน้านี้</button>
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
         Task 0.4: สรุป Multimodal Recommendations (Ch 04)
         ========================================================================== */
      {
        id: 'recsys-sum-multimodal',
        number: '0.4',
        title: 'สรุปบทที่ 4: การแนะนำจากข้อมูลหลายสื่อ (Multimodal Fusion, CNN, ViT, Encoders)',
        goal: 'เข้าใจการผสานฟีเจอร์ข้อความ ภาพ เสียง และวิดีโอ การเปรียบเทียบกลยุทธ์ Fusion 3 ระดับ และการจัดการสื่อขาดหาย',
        lead: 'สินค้าหนึ่งชิ้นไม่ได้มีแค่ตัวหนังสือ แต่มีภาพปก คลิปตัวอย่าง และเสียงบรรยาย! สรุปกลยุทธ์การผสานหลายสื่อเข้าสู่เวกเตอร์ร่วม',
        body: `<div class="easy-explain">
            <h3>⚡ สรุปกลยุทธ์การผสานสื่อ (Multimodal Fusion Strategies)</h3>
            <table style="width:100%;border-collapse:collapse;margin:10px 0;">
              <thead>
                <tr style="border-bottom:2px solid var(--line2);text-align:left;">
                  <th style="padding:6px 8px;">ระดับ Fusion</th>
                  <th style="padding:6px 8px;">วิธีการทำงาน</th>
                  <th style="padding:6px 8px;">ข้อดี</th>
                  <th style="padding:6px 8px;">ข้อจำกัด</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom:1px solid var(--line);">
                  <td style="padding:6px 8px;"><b>Early Fusion (Feature-level)</b></td>
                  <td style="padding:6px 8px;">นำเวกเตอร์ของแต่ละสื่อ (Text, Image, Audio) มาต่อกัน (Concatenation) ตั้งแต่ชั้นอินพุต แล้วส่งเข้าโมเดลร่วมก้อนเดียว</td>
                  <td style="padding:6px 8px;">ให้โมเดลจับปฏิสัมพันธ์ข้ามสื่อได้ตั้งแต่ต้น โครงสร้างเข้าใจง่าย</td>
                  <td style="padding:6px 8px;">มิติตัวเลขใหญ่มาก (Curse of Dimensionality) และหากสื่อใดสื่อหนึ่งหายไป (Missing Modality) จะรวนทั้งระบบ</td>
                </tr>
                <tr style="border-bottom:1px solid var(--line);">
                  <td style="padding:6px 8px;"><b>Late Fusion (Decision-level)</b></td>
                  <td style="padding:6px 8px;">สร้างโมเดลทำนายคะแนนแยกตามสื่อ (เช่น Text Model ทำนายคะแนน, Image Model ทำนายคะแนน) แล้วนำคะแนนมารวมกันด้วยค่าเฉลี่ยถ่วงน้ำหนัก</td>
                  <td style="padding:6px 8px;">ยืดหยุ่นสูง สื่อใดขาดหายก็ตัดเฉพาะโมเดลนั้นออกได้ ออกแบบและเทรนแยกทีมได้อิสระ</td>
                  <td style="padding:6px 8px;">พลาดความสัมพันธ์เชิงลึกข้ามสื่อ (Cross-modal correlation) เช่น ภาพสวยขัดแย้งกับคำบรรยายหลอกลวง</td>
                </tr>
                <tr>
                  <td style="padding:6px 8px;"><b>Intermediate / Hybrid Fusion</b></td>
                  <td style="padding:6px 8px;">ใช้ Cross-Attention หรือ Gating Mechanism เชื่อมโยงเวกเตอร์ในชั้นกลาง (เช่น Vision-Language Transformers / CLIP)</td>
                  <td style="padding:6px 8px;">แม่นยำสูงสุด เรียนรู้การจัดแนวของคำกับรูปภาพได้อย่างลึกซึ้ง</td>
                  <td style="padding:6px 8px;">สถาปัตยกรรมซับซ้อน คำนวณช้า และใช้ทรัพยากรเทรนสูง</td>
                </tr>
              </tbody>
            </table>

            <div class="callout">
              <h4>📸 Encoders สำหรับแต่ละสื่อ</h4>
              <ul>
                <li><b>Text:</b> Transformer Encoders (BERT, RoBERTa, Sentence-Transformers)</li>
                <li><b>Image:</b> CNN (ResNet, EfficientNet) และ Vision Transformer (ViT แบ่งรูปเป็น Patches เสมือน Token)</li>
                <li><b>Audio:</b> Mel-Spectrogram &rarr; 2D CNN หรือ Audio Spectrogram Transformer (AST)</li>
                <li><b>Cross-Modal Alignment:</b> คอนเซ็ปต์ของ CLIP (Contrastive Language-Image Pretraining) ที่ดึงคู่ (รูป, คำบรรยาย) ของสิ่งเดียวกันให้ใกล้กัน และผลักคู่อื่นให้ไกลกันในเวกเตอร์สเปซร่วม</li>
              </ul>
            </div>

            <div class="callout" style="background:rgba(94,224,194,0.08);border-color:rgba(94,224,194,0.3);margin-top:14px;">
              <h4 style="color:var(--accent);">🔗 ลิงก์อ่านเจาะลึกบทเต็ม (Deep Links)</h4>
              <div style="display:flex;gap:10px;flex-wrap:wrap;">
                <a class="btn primary" href="index.html#recsys-multimodal" target="_blank" rel="noopener noreferrer">↗ เปิดอ่านบทที่ 4 เต็มในแท็บใหม่</a>
                <a class="btn" href="index.html#recsys-mm-late" target="_blank" rel="noopener noreferrer">↗ เจาะลึกเปรียบเทียบ Late vs Early Fusion</a>
                <a class="btn" href="index.html#recsys-mm-intermediate" target="_blank" rel="noopener noreferrer">↗ เทคนิค Cross-Attention ข้ามสื่อ</a>
                <button class="btn" type="button" onclick="window.switchRecsysChapter('recsys-multimodal')">📖 สลับไปอ่านบทที่ 4 ในหน้านี้</button>
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
         Task 0.5: สรุป Collaborative Filtering (Ch 05)
         ========================================================================== */
      {
        id: 'recsys-sum-cf',
        number: '0.5',
        title: 'สรุปบทที่ 5: การกรองแบบร่วมมือ (User-kNN, Item-kNN, Pearson, Baseline Predictor)',
        goal: 'แม่นยำความแตกต่างระหว่าง User-based vs Item-based CF, การปรับแก้ Bias ของแต่ละบุคคล และการคำนวณทำนายคะแนน',
        lead: 'รอยเท้าของฝูงชนคือเข็มทิศชั้นยอด! สรุปการเปรียบเทียบความคล้ายระหว่างบุคคลและสินค้า พร้อมสูตรทำนายคะแนนที่ข้อสอบเน้นคำนวณ',
        body: `<div class="easy-explain">
            <h3>⚡ สรุปข้อแตกต่าง User-kNN vs Item-kNN</h3>
            <table style="width:100%;border-collapse:collapse;margin:10px 0;">
              <thead>
                <tr style="border-bottom:2px solid var(--line2);text-align:left;">
                  <th style="padding:6px 8px;">มิติการเปรียบเทียบ</th>
                  <th style="padding:6px 8px;">User-based kNN</th>
                  <th style="padding:6px 8px;">Item-based kNN (Amazon's Classic)</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom:1px solid var(--line);">
                  <td style="padding:6px 8px;"><b>แกนหลักในการวัด</b></td>
                  <td style="padding:6px 8px;">เทียบ "คนคล้ายคน" (หารายชื่อผู้ใช้ที่มีรสนิยมคล้ายกัน)</td>
                  <td style="padding:6px 8px;">เทียบ "สินค้าคล้ายสินค้า" (หาสินค้าที่มีคนกลุ่มเดียวกันชอบ)</td>
                </tr>
                <tr style="border-bottom:1px solid var(--line);">
                  <td style="padding:6px 8px;"><b>ความเสถียร (Stability)</b></td>
                  <td style="padding:6px 8px;">ความชอบของคนเปลี่ยนแปลงเร็ว รสนิยมเปลี่ยนตามอารมณ์/เวลา</td>
                  <td style="padding:6px 8px;">คุณลักษณะและความคล้ายของสินค้า <u>เสถียรกว่ามาก</u> สินค้าเปลี่ยนช้ากว่าคน</td>
                </tr>
                <tr style="border-bottom:1px solid var(--line);">
                  <td style="padding:6px 8px;"><b>การคำนวณออฟไลน์</b></td>
                  <td style="padding:6px 8px;">คำนวณล่วงหน้ายากเมื่อผู้ใช้มีหลักร้อยล้านคน ($O(|U|^2)$)</td>
                  <td style="padding:6px 8px;">คำนวณความคล้ายระหว่างสินค้าเก็บไว้ล่วงหน้าได้ (Precompute Item-Item Sim Matrix)</td>
                </tr>
                <tr>
                  <td style="padding:6px 8px;"><b>ความสามารถในการอธิบาย</b></td>
                  <td style="padding:6px 8px;">อธิบายยาก ("แนะนำเพราะคุณเหมือน user #9482")</td>
                  <td style="padding:6px 8px;">อธิบายเข้าใจง่าย ("แนะนำภาพยนตร์นี้เพราะคุณเคยดูเรื่อง...")</td>
                </tr>
              </tbody>
            </table>

            <div class="callout">
              <h4>📐 สูตรคำนวณสำคัญที่ต้องจำ</h4>
              <ul>
                <li><b>Pearson Correlation Coefficient (PCC):</b>
                  $$w_{u,v} = \frac{\sum_{i \in I_{uv}} (r_{ui} - \bar{r}_u)(r_{vi} - \bar{r}_v)}{\sqrt{\sum (r_{ui} - \bar{r}_u)^2} \sqrt{\sum (r_{vi} - \bar{r}_v)^2}}$$
                  <i>หัวใจสำคัญ:</i> มีการ <b>ลบค่าเฉลี่ยส่วนบุคคล ($\bar{r}_u$)</b> ออกก่อน ทำให้แก้ปัญหา "คนให้คะแนนยาก (ให้ 3 แปลว่าชอบมาก)" กับ "คนใจดี (ให้ 4 เป็นขั้นต่ำ)" ได้อย่างยอดเยี่ยม!
                </li>
                <li><b>Baseline Predictor (แยกอคติพื้นฐาน):</b>
                  $$b_{ui} = \mu + b_u + b_i$$
                  โดย $\mu$ คือค่าเฉลี่ยทั้งระบบ, $b_u$ คือความใจดี/ใจร้ายของผู้ใช้ $u$, $b_i$ คือความดัง/คุณภาพของสินค้า $i$
                </li>
                <li><b>Item-kNN Prediction Formula:</b>
                  $$\hat{r}_{ui} = b_{ui} + \frac{\sum_{j \in N_k(i; u)} s_{ij} (r_{uj} - b_{uj})}{\sum_{j \in N_k(i; u)} |s_{ij}|}$$
                </li>
              </ul>
            </div>

            <div class="callout" style="background:rgba(94,224,194,0.08);border-color:rgba(94,224,194,0.3);margin-top:14px;">
              <h4 style="color:var(--accent);">🔗 ลิงก์อ่านเจาะลึกบทเต็ม (Deep Links)</h4>
              <div style="display:flex;gap:10px;flex-wrap:wrap;">
                <a class="btn primary" href="index.html#recsys-neighbors" target="_blank" rel="noopener noreferrer">↗ เปิดอ่านบทที่ 5 เต็มในแท็บใหม่</a>
                <a class="btn" href="index.html#recsys-cf-pearson" target="_blank" rel="noopener noreferrer">↗ ตัวอย่างคำนวณ Pearson Correlation</a>
                <a class="btn" href="index.html#recsys-cf-item-knn" target="_blank" rel="noopener noreferrer">↗ กลไก Item-kNN สไตล์ Amazon</a>
                <button class="btn" type="button" onclick="window.switchRecsysChapter('recsys-neighbors')">📖 สลับไปอ่านบทที่ 5 ในหน้านี้</button>
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
         Task 0.6: สรุป Matrix Factorization & Deep Models (Ch 06)
         ========================================================================== */
      {
        id: 'recsys-sum-mf-deep',
        number: '0.6',
        title: 'สรุปบทที่ 6: การแยกตัวประกอบเมทริกซ์และโมเดลการเรียนรู้เชิงลึก (SVD, BPR, NCF, Two-Tower)',
        goal: 'แม่นยำกลไก Latent Factor Models, การแก้ปัญหา Implicit Feedback ด้วย BPR, สถาปัตยกรรม Two-Tower และ NCF',
        lead: 'ย่อเมทริกซ์มหึมาลงสู่มิติแฝง (Latent Space)! สรุปวิวัฒนาการจาก Funk SVD ผู้ชนะรางวัล Netflix Prize สู่โมเดล Two-Tower ระดับมิลลิวินาทีของ YouTube',
        body: `<div class="easy-explain">
            <h3>⚡ สรุปวิวัฒนาการโมเดลจาก SVD สู่ Two-Tower</h3>
            <ul>
              <li><b>Matrix Factorization (Funk SVD):</b>
                $$\hat{r}_{ui} = \mu + b_u + b_i + \vec{p}_u \cdot \vec{q}_i$$
                แยกเมทริกซ์เรตติ้ง $R_{|U| \times |I|}$ ออกเป็นผลคูณของ 2 เมทริกซ์ขนาดเล็ก:
                User Matrix $P_{|U| \times k}$ และ Item Matrix $Q_{|I| \times k}$ โดยที่ $k \ll \min(|U|, |I|)$ (มิติแฝง เช่น $k=64, 128$)
                <ul>
                  <li><i>Loss Function:</i> $\min_{P, Q} \sum_{(u,i) \in R} (r_{ui} - \hat{r}_{ui})^2 + \lambda (\|\vec{p}_u\|^2 + \|\vec{q}_i\|^2 + b_u^2 + b_i^2)$ (มี Regularization ป้องกัน Overfitting)</li>
                  <li><i>Optimization:</i> ใช้ Stochastic Gradient Descent (SGD) หรือ Alternating Least Squares (ALS)</li>
                </ul>
              </li>
              <li><b>BPR (Bayesian Personalized Ranking):</b>
                ออกแบบมาเพื่อ <b>Implicit Feedback (คลิก/ไม่คลิก)</b> โดยเฉพาะ! เปลี่ยนจากการทำนายค่าตัวเลขเดี่ยวๆ เป็นการเปรียบเทียบเป็นคู่ (Pairwise Loss):
                $$\text{Loss}_{\text{BPR}} = -\sum_{(u, i, j) \in D} \ln \sigma(\hat{x}_{ui} - \hat{x}_{uj}) + \lambda \|\Theta\|^2$$
                สินค้า $i$ ที่ผู้ใช้เคยคลิก (Positive) จะต้องได้คะแนนสูงกว่าสินค้า $j$ ที่ไม่เคยคลิก (Negative)!
              </li>
              <li><b>Neural Collaborative Filtering (NCF):</b>
                ผสมผสาน 2 เส้นทาง: <b>GMF (Generalized Matrix Factorization)</b> ที่คูณเวกเตอร์แบบ Element-wise รวมกับ <b>MLP (Multi-Layer Perceptron)</b> ที่จับปฏิสัมพันธ์ไม่เชิงเส้น (Non-linear interactions)
              </li>
              <li><b>Two-Tower DSSM Architecture (หัวใจสำคัญของ YouTube &amp; TikTok):</b>
                <ul>
                  <li><i>User Tower:</i> รับฟีเจอร์ผู้ใช้ (ประวัติการดู, อุปกรณ์, บริบท) &rarr; ขับออกมาเป็นเวกเตอร์ $\vec{u} \in \mathbb{R}^d$</li>
                  <li><i>Item Tower:</i> รับฟีเจอร์สินค้า (ชื่อ, รูป, หมวดหมู่) &rarr; ขับออกมาเป็นเวกเตอร์ $\vec{v} \in \mathbb{R}^d$</li>
                  <li><i>Matching:</i> คำนวณคะแนนด้วย $\text{Score} = \vec{u} \cdot \vec{v}$ และค้นหาด้วย Approximate Nearest Neighbors (ANN / Faiss) ในเวลาไม่เกิน 5-15 ms!</li>
                </ul>
              </li>
            </ul>

            <div class="callout" style="background:rgba(94,224,194,0.08);border-color:rgba(94,224,194,0.3);margin-top:14px;">
              <h4 style="color:var(--accent);">🔗 ลิงก์อ่านเจาะลึกบทเต็ม (Deep Links)</h4>
              <div style="display:flex;gap:10px;flex-wrap:wrap;">
                <a class="btn primary" href="index.html#recsys-models" target="_blank" rel="noopener noreferrer">↗ เปิดอ่านบทที่ 6 เต็มในแท็บใหม่</a>
                <a class="btn" href="index.html#recsys-mf-latent" target="_blank" rel="noopener noreferrer">↗ เจาะลึกคณิตศาสตร์ Matrix Factorization</a>
                <a class="btn" href="index.html#recsys-twotower-dssm" target="_blank" rel="noopener noreferrer">↗ สถาปัตยกรรม Two-Tower DSSM ละเอียด</a>
                <button class="btn" type="button" onclick="window.switchRecsysChapter('recsys-models')">📖 สลับไปอ่านบทที่ 6 ในหน้านี้</button>
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
         Task 0.7: สรุป LLM ในระบบแนะนำ (Ch 07)
         ========================================================================== */
      {
        id: 'recsys-sum-llm',
        number: '0.7',
        title: 'สรุปบทที่ 7: พลังของ Large Language Models ในระบบแนะนำ (LLM-Powered RecSys)',
        goal: 'เข้าใจบทบาท 3 มิติของ LLM ในระบบแนะนำ, รูปแบบการ Prompt (Pointwise, Pairwise, Listwise) และข้อจำกัดทางวิศวกรรมจริง',
        lead: 'เมื่อปัญญาประดิษฐ์เชิงภาษาพบกับระบบแนะนำ! สรุปการประยุกต์ใช้ LLM ในโลกการทำงานจริง พร้อมวิธีรับมือ Latency และ Cost',
        body: `<div class="easy-explain">
            <h3>⚡ 3 บทบาทหลักของ LLM ใน Recommender Systems</h3>
            <ol>
              <li><b>1. LLM as Feature Extractor / Semantic Encoder:</b>
                ใช้ LLM สกัดความหมายลึกซึ้งจากข้อความสินค้า (เช่น วิเคราะห์อารมณ์ สไตล์ บุคลิก) หรือสร้าง <i>Dense Text Embeddings</i> ส่งต่อให้โมเดล RecSys ดั้งเดิม (เช่น Two-Tower) ใช้ต่อ &rarr; <u>นิยมมากในโปรดักชันเพราะไม่กระทบ Latency ตอนเสิร์ฟ</u>
              </li>
              <li><b>2. LLM as Reranker (ด่านสุดท้าย):</b>
                ป้อนสินค้า Top-10 หรือ Top-20 พร้อมประวัติผู้ใช้ให้ LLM ช่วยคิดและจัดอันดับใหม่ (Re-ranking) ผ่าน Prompting
                <ul>
                  <li><i>Pointwise:</i> ประเมินสินค้าทีละชิ้น (ถามว่าผู้ใช้จะชอบชิ้นนี้ไหม? ตอบ ใช่/ไม่ใช่ หรือ 1-5)</li>
                  <li><i>Pairwise:</i> ส่งสินค้าทีละคู่ แล้วถามว่าชิ้นใดเหมาะกับผู้ใช้มากกว่ากัน (แม่นยำขึ้นแต่จำนวนรอบสูง $O(K^2)$)</li>
                  <li><i>Listwise:</i> ส่งรายการสินค้าทั้ง 10 ชิ้นพร้อมกัน ให้โมเดลเรียงลำดับผลลัพธ์ทันที (รวดเร็วที่สุดแต่เสี่ยงต่ออาการหลอน Hallucination และ Position Bias ภายใน Prompt)</li>
                </ul>
              </li>
              <li><b>3. Conversational Recommender &amp; Explanation Agent:</b>
                เป็นแชตบอตพูดคุยตอบโต้ ซักถามความต้องการเพิ่มเติม (Clarifying Questions) และให้คำอธิบายที่อ้างอิงหลักฐานจริง (Grounded Explanations) ผ่าน RAG
              </li>
            </ol>

            <div class="callout" style="background:rgba(255,180,87,0.08);border-color:rgba(255,180,87,0.3);">
              <h4 style="color:var(--warn,#ffb457);">⚠️ ข้อจำกัดทางวิศวกรรมจริงของ LLM (The Production Trilemma)</h4>
              <ul>
                <li><b>Latency (ความหน่วง):</b> LLM ใช้เวลาถอดรหัส Token เฉลี่ย 200 - 1500 ms ซึ่งเกินงบ Latency มาตรฐานของหน้าแรกแอปพลิเคชัน (&lt; 50-100 ms) มหาศาล จึงห้ามนำไปใช้ในด่าน Candidate Generation เด็ดขาด!</li>
                <li><b>Cost (ค่าใช้จ่าย):</b> หากมีผู้ใช้เปิดหน้าแอปวันละ 100 ล้านครั้ง การเรียก API LLM ทุกครั้งจะทำให้ค่าใช้จ่ายสูงจนธุรกิจขาดทุน</li>
                <li><b>Hallucination (อาการหลอน):</b> LLM อาจแต่งชื่อสินค้าที่ไม่มีอยู่จริงในคลังสินค้าขึ้นมาเอง จึงต้องมี Guardrail บังคับให้แนะนำเฉพาะ Item ID ที่มีอยู่ในสต็อกจริงเท่านั้น</li>
              </ul>
            </div>

            <div class="callout" style="background:rgba(94,224,194,0.08);border-color:rgba(94,224,194,0.3);margin-top:14px;">
              <h4 style="color:var(--accent);">🔗 ลิงก์อ่านเจาะลึกบทเต็ม (Deep Links)</h4>
              <div style="display:flex;gap:10px;flex-wrap:wrap;">
                <a class="btn primary" href="index.html#recsys-llm" target="_blank" rel="noopener noreferrer">↗ เปิดอ่านบทที่ 7 เต็มในแท็บใหม่</a>
                <a class="btn" href="index.html#recsys-llm-prompting" target="_blank" rel="noopener noreferrer">↗ เจาะลึก Pointwise vs Pairwise vs Listwise</a>
                <a class="btn" href="index.html#recsys-llm-engineering" target="_blank" rel="noopener noreferrer">↗ กรณีศึกษาแก้ปัญหา Latency & Cost</a>
                <button class="btn" type="button" onclick="window.switchRecsysChapter('recsys-llm')">📖 สลับไปอ่านบทที่ 7 ในหน้านี้</button>
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
         Task 0.8: สรุป Responsible RecSys (Ch 08)
         ========================================================================== */
      {
        id: 'recsys-sum-responsible',
        number: '0.8',
        title: 'สรุปบทที่ 8: ระบบผู้แนะนำที่มีความรับผิดชอบและจริยธรรม (Responsible & Trustworthy RecSys)',
        goal: 'แม่นยำปัญหา Popularity Bias, ความเป็นธรรมสองฝั่ง (C-Fairness vs P-Fairness), ความเป็นส่วนตัว (DP & Federated Learning) และการป้องกัน Shilling Attacks',
        lead: 'ระบบที่ดีต้องไม่หลอกผู้ใช้และไม่ทำลายสังคม! สรุปมิติความรับผิดชอบ การตรวจวัดอคติ และเทคนิคการปกป้องความเป็นส่วนตัว',
        body: `<div class="easy-explain">
            <h3>⚡ สรุป 4 เสาหลักของ Responsible AI ในระบบแนะนำ</h3>
            
            <div class="callout">
              <h4>1. Popularity Bias &amp; Filter Bubble</h4>
              <ul>
                <li><b>Popularity Bias:</b> อคติที่ระบบเอนเอียงไปแนะนำเฉพาะสินค้ายอดนิยมกลุ่มเล็กๆ (Short Head) จนสินค้าส่วนใหญ่ (Long Tail) ถูกปิดกั้นโอกาส</li>
                <li><b>Gini Coefficient:</b> วัดความไม่เท่าเทียมของการแสดงผล (0 = ทุกสินค้าถูกแนะนำเท่ากันหมด, 1 = สินค้าชิ้นเดียวผูกขาดทั้งระบบ)</li>
                <li><b>Filter Bubble / Echo Chamber:</b> ผู้ใช้เห็นเฉพาะเนื้อหาที่ตรงกับความเชื่อเดิมของตนเอง นำไปสู่การแบ่งขั้วทางความคิด (Polarization)</li>
              </ul>
            </div>

            <div class="callout">
              <h4>2. Two-Sided Fairness (ความเป็นธรรมสองฝั่งในตลาด)</h4>
              <ul>
                <li><b>C-Fairness (Consumer Fairness):</b> ความเป็นธรรมฝั่งผู้บริโภค &rarr; ผู้ใช้ทุกกลุ่ม (ไม่ว่าจะเชื้อชาติ เพศ วัย หรือกลุ่มชนกลุ่มน้อย) ต้องได้รับการแนะนำที่มีคุณภาพและความแม่นยำเท่าเทียมกัน ไม่ถูกเลือกปฏิบัติ</li>
                <li><b>P-Fairness (Producer Fairness):</b> ความเป็นธรรมฝั่งผู้ผลิต/ร้านค้า &rarr; ร้านค้ารายย่อย ผู้ผลิตหน้าใหม่ ต้องได้รับโอกาสในการแสดงผล (Exposure) อย่างเป็นธรรม ไม่ถูกแบรนด์ยักษ์ใหญ่ผูกขาด</li>
              </ul>
            </div>

            <div class="callout">
              <h4>3. Privacy &amp; Trust (ความเป็นส่วนตัวและความปลอดภัย)</h4>
              <ul>
                <li><b>Differential Privacy (DP):</b> เติมสัญญาณรบกวนทางคณิตศาสตร์ (Calibrated Noise เช่น Laplace/Gaussian Mechanism) ลงในข้อมูลหรือเกรเดียนต์ เพื่อรับประกันว่าไม่มีใครสามารถระบุตัวตนย้อนกลับได้ว่าข้อมูลนี้เป็นของใคร</li>
                <li><b>Federated Learning:</b> อุปกรณ์ของผู้ใช้เทรนโมเดลภายในเครื่องตนเอง แล้วส่งเฉพาะ <i>Model Weights/Gradients</i> กลับไปรวบรวมที่ Server &rarr; ข้อมูลดิบของผู้ใช้ไม่เคยหลุดออกจากเครื่อง!</li>
                <li><b>Shilling Attack / Manipulation:</b> ขบวนการสร้างบัญชีปลอมเข้ามารีวิวหรือปั๊มคะแนนดาวเพื่อดันสินค้าตนเอง (Push Attack) หรือทำลายคู่แข่ง (Nuke Attack)</li>
              </ul>
            </div>

            <div class="callout" style="background:rgba(94,224,194,0.08);border-color:rgba(94,224,194,0.3);margin-top:14px;">
              <h4 style="color:var(--accent);">🔗 ลิงก์อ่านเจาะลึกบทเต็ม (Deep Links)</h4>
              <div style="display:flex;gap:10px;flex-wrap:wrap;">
                <a class="btn primary" href="index.html#recsys-responsible" target="_blank" rel="noopener noreferrer">↗ เปิดอ่านบทที่ 8 เต็มในแท็บใหม่</a>
                <a class="btn" href="index.html#recsys-resp-fairness" target="_blank" rel="noopener noreferrer">↗ เจาะลึก C-Fairness vs P-Fairness</a>
                <a class="btn" href="index.html#recsys-resp-trust" target="_blank" rel="noopener noreferrer">↗ ความปลอดภัย Differential Privacy & Federated Learning</a>
                <button class="btn" type="button" onclick="window.switchRecsysChapter('recsys-responsible')">📖 สลับไปอ่านบทที่ 8 ในหน้านี้</button>
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
         Task 0.9: สรุปผังเชื่อมโยงการตัดสินใจและกับดักข้อสอบ (Ch 09)
         ========================================================================== */
      {
        id: 'recsys-sum-capstone',
        number: '0.9',
        title: 'สรุปบทที่ 9: แผนผังการตัดสินใจเลือกโมเดล และ 10 กับดักข้อสอบยอดฮิต (Capstone Synthesis)',
        goal: 'มองเห็นภาพรวมการเลือกสถาปัตยกรรมโมเดลตามโจทย์ธุรกิจ และเช็กลิสต์จุดผิดพลาดยอดฮิตก่อนก้าวเข้าสู่ห้องสอบ',
        lead: 'สังเคราะห์ทุกบทเข้าด้วยกัน! สรุป Master Decision Matrix สำหรับเลือกวิธีแก้ปัญหา พร้อม 10 กับดักข้อสอบที่ห้ามตอบผิด',
        body: `<div class="easy-explain">
            <h3>⚡ Master Decision Matrix: เจอโจทย์แบบนี้ เลือกโมเดลใด?</h3>
            <table style="width:100%;border-collapse:collapse;margin:10px 0;">
              <thead>
                <tr style="border-bottom:2px solid var(--line2);text-align:left;">
                  <th style="padding:6px 8px;">สถานการณ์ / เงื่อนไขของโจทย์</th>
                  <th style="padding:6px 8px;">โมเดลและสถาปัตยกรรมที่ควรเลือก</th>
                  <th style="padding:6px 8px;">เหตุผลหลักทางวิศวกรรม</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom:1px solid var(--line);">
                  <td style="padding:6px 8px;">ระบบเพิ่งเปิดตัวใหม่ ไม่มีข้อมูลประวัติการคลิกหรือซื้อเลย (Extreme Cold-Start)</td>
                  <td style="padding:6px 8px;"><b>Popularity Baseline + Onboarding Questionnaire</b></td>
                  <td style="padding:6px 8px;">เมื่อไม่มีรอยเท้าใดๆ การแนะนำของยอดนิยมหรือถามความชอบเบื้องต้นคือทางเลือกที่ปลอดภัยที่สุด</td>
                </tr>
                <tr style="border-bottom:1px solid var(--line);">
                  <td style="padding:6px 8px;">สินค้ามีข้อความสเปกและคุณสมบัติชัดเจน แต่เป็นสินค้าใหม่เพิ่งลงคลังตลอดเวลา (News, Articles)</td>
                  <td style="padding:6px 8px;"><b>Content-Based Filtering (Bi-Encoder / TF-IDF / BM25)</b></td>
                  <td style="padding:6px 8px;">พึ่งพาเฉพาะฟีเจอร์ของสินค้า ไม่ต้องการประวัติการคลิกเดิม</td>
                </tr>
                <tr style="border-bottom:1px solid var(--line);">
                  <td style="padding:6px 8px;">มีสินค้าหลายสื่อ (มีทั้งภาพปก คลิปตัวอย่าง และคำบรรยาย)</td>
                  <td style="padding:6px 8px;"><b>Multimodal Fusion (Intermediate / Late Fusion)</b></td>
                  <td style="padding:6px 8px;">ดึงคุณลักษณะเด่นของแต่ละสื่อมารวมพลังกันในเวกเตอร์สเปซ</td>
                </tr>
                <tr style="border-bottom:1px solid var(--line);">
                  <td style="padding:6px 8px;">มีข้อมูลประวัติการซื้อจำนวนมาก ต้องการระบบที่อธิบายเหตุผลได้ง่าย และเสถียร</td>
                  <td style="padding:6px 8px;"><b>Item-based Collaborative Filtering (Amazon's Item-kNN)</b></td>
                  <td style="padding:6px 8px;">Precompute ความคล้ายระหว่างสินค้าได้ล่วงหน้า และอธิบายง่าย ("เพราะคุณซื้อ X เราจึงแนะนำ Y")</td>
                </tr>
                <tr style="border-bottom:1px solid var(--line);">
                  <td style="padding:6px 8px;">คลังสินค้าขนาดใหญ่มาก (10 ล้านชิ้น) ต้องการค้นหา Top-100 ในเวลา &lt; 15 ms</td>
                  <td style="padding:6px 8px;"><b>Two-Tower Neural Network + Vector ANN Search (Faiss / HNSW)</b></td>
                  <td style="padding:6px 8px;">คำนวณเวกเตอร์สินค้าออฟไลน์ล่วงหน้า ตอนออนไลน์คำนวณเฉพาะ User Tower แล้วค้นหาทันที</td>
                </tr>
                <tr>
                  <td style="padding:6px 8px;">ต้องการปรับปรุงความหลากหลาย (Diversity) ไม่ให้หน้าจอซ้ำซากจำเจ</td>
                  <td style="padding:6px 8px;"><b>Maximal Marginal Relevance (MMR) ในด่าน Re-ranking</b></td>
                  <td style="padding:6px 8px;">จัดสมดุลระหว่างความชอบส่วนบุคคลกับความหลากหลายของลิสต์แนะนำ</td>
                </tr>
              </tbody>
            </table>

            <div class="callout" style="background:rgba(255,180,87,0.08);border-color:rgba(255,180,87,0.3);">
              <h4 style="color:var(--warn,#ffb457);">🚨 สรุป 5 กับดักข้อสอบยอดฮิตที่ห้ามตกหลุมพรางเด็ดขาด</h4>
              <ol>
                <li><b>Data Leakage ในการแบ่งชุดข้อมูล:</b> ห้ามสุ่มแบ่ง Train/Test แบบ Random เด็ดขาดใน RecSys! <u>ต้องแบ่งตามเส้นเวลา (Temporal Split) เสมอ</u> (ใช้ข้อมูลอดีตเทรน แล้วทดสอบกับข้อมูลอนาคต) มิฉะนั้นโมเดลจะแอบเห็นอนาคตแล้วได้คะแนนสูงเกินจริง</li>
                <li><b>Rating Prediction vs Top-K Ranking:</b> โมเดลที่ทายคะแนนดาวแม่นที่สุด (RMSE ต่ำสุด) <u>ไม่ได้แปลว่า</u> จะแนะนำสินค้า Top-5 ได้ดีที่สุด เพราะ RMSE ให้ความสำคัญกับความแม่นยำของดาวทุกดวงเท่ากัน แต่ผู้ใช้แคร์เฉพาะของที่ดีที่สุดที่อยู่บนหัวตาราง</li>
                <li><b>MRR สนใจเฉพาะชิ้นแรก:</b> อย่าหลงกลนำอันดับของสินค้าชิ้นที่ 2 หรือ 3 มาเฉลี่ยใน MRR! สูตร $1/\text{rank}_1$ สนใจเฉพาะตำแหน่งของของที่ตรงใจชิ้นแรกเท่านั้น</li>
                <li><b>Cosine vs Pearson:</b> Cosine ไม่ได้ลบค่าเฉลี่ยของคนออก ส่วน Pearson Correlation มีการ Mean-centering ลบค่าเฉลี่ยส่วนบุคคล ทำให้ Pearson รับมือกับคนที่ให้คะแนนยาก/ง่ายได้ดีกว่า</li>
                <li><b>Two-Tower ข้อจำกัด:</b> Two-Tower รวดเร็วมากเพราะคำนวณ User กับ Item แยกกันเด็ดขาด แต่ข้อเสียคือ <u>ไม่สามารถจับปฏิสัมพันธ์เชิงลึก (Cross-features) ระหว่างฟีเจอร์ของผู้ใช้กับสินค้าในระดับชั้นล่างได้</u> เหมือน Cross-Encoder หรือ DLRM</li>
              </ol>
            </div>

            <div class="callout" style="background:rgba(94,224,194,0.08);border-color:rgba(94,224,194,0.3);margin-top:14px;">
              <h4 style="color:var(--accent);">🔗 ลิงก์อ่านเจาะลึกบทเต็ม (Deep Links)</h4>
              <div style="display:flex;gap:10px;flex-wrap:wrap;">
                <a class="btn primary" href="index.html#recsys-capstone" target="_blank" rel="noopener noreferrer">↗ เปิดอ่านบทที่ 9 เต็มในแท็บใหม่</a>
                <a class="btn" href="index.html#recsys-capstone-matrix" target="_blank" rel="noopener noreferrer">↗ ตาราง Decision Matrix ฉบับสมบูรณ์</a>
                <a class="btn" href="index.html#recsys-capstone-pitfalls" target="_blank" rel="noopener noreferrer">↗ เจาะลึก 10 ข้อผิดพลาดยอดฮิตก่อนสอบ</a>
                <button class="btn" type="button" onclick="window.switchRecsysChapter('recsys-capstone')">📖 สลับไปอ่านบทที่ 9 ในหน้านี้</button>
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
