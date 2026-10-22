/* Chapter 09: Pre-Exam Synthesis & Capstone Decision Guide
   Consolidates Chapters 00 to 08 into a cohesive, exam-ready framework.
   Strict rules: 0 raw LaTeX dollars, 0 reading time strings, 4 choices & 4 reasons per question. */
(() => {
  'use strict';

  const docIntro = { title: 'Topic 1 · Introduction', path: 'source/Recommending System/เอกสาร_Lecture/Topic1_Introduction.pdf', pages: 84 };
  const docEval = { title: 'Topic 2 · Evaluation', path: 'source/Recommending System/เอกสาร_Lecture/Topic2_Evaluation.pdf', pages: 102 };
  const docCB = { title: 'Topic 3 · Content-Based', path: 'source/Recommending System/เอกสาร_Lecture/Topic3_Content_Based.pdf', pages: 76 };
  const docCF = { title: 'Topic 4 · Collaborative', path: 'source/Recommending System/เอกสาร_Lecture/Topic4_Collaborative_Filtering.pdf', pages: 98 };
  const docHybrid = { title: 'Topic 5 · Hybrid & Advanced', path: 'source/Recommending System/เอกสาร_Lecture/Topic5_Hybrid_RecSys.pdf', pages: 90 };

  const source = (doc, page, topic) => ({ ...doc, page, topic });
  const question = (id, q, choices, answer, explanation, reasons) => ({ id, q, choices, answer, explanation, reasons, version: 1 });

  window.RECSYS_DEMOS = {
    ...(window.RECSYS_DEMOS || {}),
    'capstone-pipeline': [
      {
        title: '1 · Catalog ขนาดใหญ่',
        value: '1,000,000 รายการในคลังสินค้าทั้งหมด',
        detail: 'ในระบบระดับอุตสาหกรรม สินค้ามีจำนวนมหาศาลเกินกว่าจะส่งให้โมเดลที่ซับซ้อนคำนวณทั้งหมดพร้อมกันได้ มีเวลาตอบสนองรวมที่ต้องคุมไม่เกิน 50–60 ms',
        tokens: ['1,000,000 รายการ', 'Latency SLA < 60 ms'],
        active: [0, 1]
      },
      {
        title: '2 · ด่าน Candidate Retrieval',
        value: '1,000,000 → 1,000 รายการ (ใช้เวลา ~12 ms)',
        detail: 'ใช้ Two-Tower User/Item Embeddings ค้นหาในดัชนี ANN (เช่น ScaNN หรือ HNSW) ร่วมกับตาราง i2i เพื่อดึงของที่มีแววเกี่ยวข้องอย่างรวดเร็ว เน้นค่า Recall@K',
        tokens: ['Two-Tower', 'ANN Indexing', '1,000 ผู้สมัคร', '12 ms'],
        active: [0, 1, 2, 3]
      },
      {
        title: '3 · ด่าน Scoring & Ranking',
        value: '1,000 → 100 รายการ (ใช้เวลา ~23 ms)',
        detail: 'ส่ง 1,000 รายการเข้าสู่ Deep Ranking Network ร่วมกับสัญญาณบริบทสด (เวลา, อุปกรณ์, การกระทำล่าสุด) เพื่อพยากรณ์คะแนนและจัดอันดับอย่างละเอียด เน้น nDCG@K',
        tokens: ['Deep Ranking', 'Context Signals', '100 คัดเลือก', '23 ms'],
        active: [0, 1, 2, 3]
      },
      {
        title: '4 · ด่าน Re-ranking & Fairness',
        value: '100 → 10 รายการสุดท้ายบนหน้าจอ (ใช้เวลา ~8 ms)',
        detail: 'ใช้ MMR เพิ่มความหลากหลาย (Diversity), จัดสรรโควตาให้ผู้ผลิตรายย่อย (Provider Fairness), ตัดสินค้าที่เพิ่งซื้อไป และแนบคำอธิบาย เวลารวมทั้งระบบ 43 ms ผ่าน SLA ฉลุย',
        tokens: ['MMR Diversity', 'Provider Quota', 'Top-10 แสดงผล', 'เวลารวม 43 ms ✓'],
        active: [0, 1, 2, 3]
      }
    ],
    'capstone-decision': [
      {
        title: '1 · ตรวจสอบข้อมูลนำเข้า (Data Input)',
        value: 'มีข้อมูลประเภทใดในมือบ้าง?',
        detail: 'ถ้ามีเพียงคลิก/ดูที่ไม่มีคะแนนดาว → ใช้ Implicit CF (BPR/WRMF/EASE); ถ้ามีรูปภาพ/ข้อความของสินค้า → ใช้ Content/Multimodal; ถ้ามีข้อมูลผสมผสาน → ใช้ Hybrid Two-Tower',
        tokens: ['Explicit Stars', 'Implicit Clicks', 'Item Metadata', 'Multimodal Assets'],
        active: [0, 1, 2, 3]
      },
      {
        title: '2 · ตรวจสอบปัญหา Cold-Start',
        value: 'มีสินค้าหรือผู้ใช้ใหม่เข้าสู่ระบบบ่อยแค่ไหน?',
        detail: 'ถ้าสินค้าใหม่เข้าทุกนาที ห้ามพึ่งพา Pure CF เด็ดขาด เพราะสินค้าใหม่ไม่มีใครเคยกด ต้องใช้ Content-based หรือ Multimodal Embeddings ป้อนเข้า Item Tower เพื่อให้มีเวกเตอร์พร้อมเสิร์ฟทันที',
        tokens: ['New Items?', 'New Users?', 'Cold-start Handling'],
        active: [0, 1, 2]
      },
      {
        title: '3 · ตรวจสอบขีดจำกัดความหน่วง (Latency Budget)',
        value: 'ระบบต้องส่งผลลัพธ์กลับในกี่มิลลิวินาที?',
        detail: 'ถ้าต้องการ < 25 ms บนสินค้าล้านชิ้น ต้องใช้ Two-Tower + ANN Indexing เท่านั้น; หากต้องการคำอธิบายภาษาธรรมชาติจาก LLM ต้องจัดวางแบบ Cascade ในด่านสุดท้ายบนรายการเพียง 10 ชิ้น',
        tokens: ['< 25 ms (ANN)', '< 60 ms (Deep Rank)', '> 200 ms (LLM Cascade)'],
        active: [0, 1, 2]
      },
      {
        title: '4 · วางกรอบการวัดผลและ Guardrails',
        value: 'ชี้ขาดความสำเร็จด้วยหลายมิติ',
        detail: 'ความแม่นยำ (nDCG/Recall) ต้องเดินคู่กับ Beyond-accuracy เสมอ: P95 Latency ต้องผ่านเกณฑ์, ความหลากหลาย (ILD) ต้องเพียงพอ และ Provider Fairness ไม่ถูกทอดทิ้ง',
        tokens: ['nDCG & Recall', 'P95 Latency', 'ILD Diversity', 'Provider Fairness'],
        active: [0, 1, 2, 3]
      }
    ]
  };

  const lessons = [
    {
      id: 'recsys-capstone-matrix',
      number: '09.01',
      title: 'ผังเชื่อมโยงการเลือกโมเดลตามประเภทข้อมูลและข้อจำกัดระบบ (Decision Matrix)',
      goal: 'เลือกใช้กระบวนทัศน์ระบบแนะนำ (Content-based, CF, Multimodal, Hybrid, LLM) ได้ถูกต้องตรงตามลักษณะข้อมูล ข้อจำกัดความหน่วง และขนาดคลังสินค้า',
      lead: 'ในห้องสอบและงานวิศวกรรมจริง ไม่มีโมเดลใดดีที่สุดในทุกมิติ การเลือกวิธีต้องเริ่มจาก "มีข้อมูลอะไรในมือ" "ต้องตอบสนองเร็วแค่ไหน" และ "มีปัญหา Cold-start หรือไม่"',
      body: `
        <div class="easy-explain">
          <h3>ตารางแม่บทเปรียบเทียบกระบวนทัศน์ระบบแนะนำ (Master RecSys Paradigm Matrix)</h3>
          <p>สรุปจุดเด่น ข้อจำกัด ข้อมูลที่ต้องใช้ และพฤติกรรมเมื่อเจอความท้าทายในระบบจริง:</p>
        </div>
        <div class="rs-table-wrap">
          <table class="rs-matrix">
            <thead>
              <tr>
                <th>กระบวนทัศน์ (Paradigm)</th>
                <th>ข้อมูลนำเข้าที่ต้องการ (Inputs)</th>
                <th>รับมือ Cold-start</th>
                <th>ความเร็วตอบสนอง (Online Latency)</th>
                <th>ขนาดคลังสินค้า (Catalog Scale)</th>
                <th>จุดเด่นและข้อแลกเปลี่ยนสำคัญ (Key Trade-offs)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><b>Content-based Filtering</b><br><small>TF-IDF, BM25, Item Profile, Cosine</small></td>
                <td>Metadata สินค้า (ข้อความ, หมวดหมู่, สเปก) + ประวัติความชอบรายบุคคล</td>
                <td><span style="color:#55e6a5">ยอดเยี่ยมสำหรับ New Item</span><br>(New User ยังยาก)</td>
                <td>เร็วมาก (< 10 ms ด้วย Vector Index)</td>
                <td>หลายล้านรายการ (ขึ้นกับดัชนีคำค้นหา/เวกเตอร์)</td>
                <td>อธิบายง่าย ตรงไปตรงมา ไม่ต้องพึ่งพาพฤติกรรมคนอื่น แต่ติดใน Filter Bubble และขาดความหลากหลาย (Serendipity ต่ำ)</td>
              </tr>
              <tr>
                <td><b>Multimodal RecSys</b><br><small>CLIP, Late Fusion, Cross-Attention</small></td>
                <td>รูปภาพ + เสียง + วิดีโอ + ข้อความบรรยาย</td>
                <td><span style="color:#55e6a5">ยอดเยี่ยม</span> ทนต่อข้อความสั้นหรือกำกวม</td>
                <td>ปานกลาง (ใช้ Precomputed Embeddings ค้นหาใน ANN)</td>
                <td>หลายล้านรายการ (สกัดฟีเจอร์แบบ Offline)</td>
                <td>เข้าใจเนื้อหาลึกซึ้งข้ามสื่อ แต่ค่าประมวลผลสกัดฟีเจอร์สูง และต้องมีกลยุทธ์รับมือสื่อขาดหาย (Missing Modality Fallback)</td>
              </tr>
              <tr>
                <td><b>Memory-based CF</b><br><small>User-kNN, Item-kNN, Pearson</small></td>
                <td>ตารางคะแนนดาวหรือการมีปฏิสัมพันธ์ (User-Item Matrix)</td>
                <td><span style="color:#ff6b7a">ล้มเหลวทันที</span> ทั้ง New User และ New Item</td>
                <td>Item-kNN เร็ว (Lookup ตาราง i2i)<br>User-kNN ช้ามาก</td>
                <td>ขนาดเล็กถึงปานกลาง (ติดปัญหา Sparsity และขยายสเกลยาก)</td>
                <td>ไม่ต้องพึ่งพา Metadata สินค้า ค้นพบความชอบข้ามสายได้ แต่เก็บตารางขนาดใหญ่มากและคำนวณเพื่อนบ้านออนไลน์หนักหน่วง</td>
              </tr>
              <tr>
                <td><b>Model-based CF</b><br><small>MF, BPR, WRMF, ALS, EASE</small></td>
                <td>Interaction Matrix ทั้งแบบมีดาวและ Implicit Signals (คลิก/ดู)</td>
                <td><span style="color:#ff6b7a">ล้มเหลวทันที</span> ถ้าไม่มีประวัติปฏิสัมพันธ์</td>
                <td>เร็วมาก (< 15 ms ด้วย Dot Product ใน Latent Space)</td>
                <td>ปานกลางถึงใหญ่ (นับแสนถึงนับล้าน)</td>
                <td>จับปัจจัยแฝง (Latent Factors) ได้ยอดเยี่ยม BPR/WRMF เหมาะกับ Implicit data แต่เป็น Black-box และอธิบายเหตุผลยาก</td>
              </tr>
              <tr>
                <td><b>Hybrid Two-Tower</b><br><small>User Tower + Item Tower + ANN Index</small></td>
                <td>ID + ข้อมูลผู้ใช้ + ข้อมูลสินค้า + บริบท + พฤติกรรม</td>
                <td><span style="color:#55e6a5">ยอดเยี่ยม</span> หลอมรวม ID เข้ากับ Content Features ได้</td>
                <td>เร็วระดับเสี้ยววินาที (< 20 ms ด้วย MIPS / ScaNN)</td>
                <td>หลายสิบล้านรายการ (หัวใจของ YouTube, TikTok)</td>
                <td>รวมจุดแข็งของ CF และ Content-based ปรับใช้เป็นด่านแรกในระบบระดับโลก แต่ต้องระวัง Popularity Bias และ In-batch Negative Sampling Bias</td>
              </tr>
              <tr>
                <td><b>LLM & Generative RecSys</b><br><small>LLM Reranker, Semantic IDs, RAG</small></td>
                <td>ข้อความภาษาธรรมชาติ, แคตาล็อกสินค้า, ประวัติการสนทนา</td>
                <td><span style="color:#55e6a5">ยอดเยี่ยม</span> ด้วยความสามารถ Zero-shot Reasoning</td>
                <td>ช้าที่สุด (100–500 ms ต่อ Request)</td>
                <td>ไม่กี่สิบรายการ (จำกัดในด่าน Cascade Top-K)</td>
                <td>เข้าใจบริบทที่ซับซ้อน อธิบายลื่นไหลและมีปฏิสัมพันธ์ได้ แต่กิน GPU มหาศาล มีความหน่วงสูง และเสี่ยงเกิดอาการมโน (Hallucination)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="rs-flow">
          <span><b>โจทย์: มีสินค้าใหม่เข้าคลังตลอดเวลา?</b><br><small>ห้ามใช้ Pure CF! ใช้ Content-based หรือ Two-Tower ที่มี Item Content</small></span>
          <span class="rs-flow-event"><b>โจทย์: มีแต่บันทึกคลิก ไม่มีคะแนนดาว?</b><br><small>ใช้ Implicit CF เช่น BPR หรือ WRMF ห้ามแทนช่องว่างด้วย 0 ดาว</small></span>
          <span><b>โจทย์: ต้องเสิร์ฟ 10 ล้านชิ้นใน 20 ms?</b><br><small>ใช้ Two-Tower + ScaNN/HNSW ANN Indexing ในด่านแรก</small></span>
        </div>

        <div data-rs-demo="capstone-decision"></div>

        <div class="callout">
          <b>กฎเหล็กจำก่อนเข้าห้องสอบ:</b>
          <ul>
            <li><b>New Item Cold-start:</b> ต้องมี "เนื้อหา (Content)" เสมอ จึงจะสร้างตัวแทน (Embedding) ได้โดยไม่ต้องรอคนมากด</li>
            <li><b>Real-time Serving:</b> เวกเตอร์สินค้าต้องถูกคำนวณและสร้างดัชนีไว้ล่วงหน้าแบบ Offline ห้ามรันโมเดลลึกบนสินค้าทุกชิ้นในขณะตอบคำขอของผู้ใช้</li>
            <li><b>Implicit vs Explicit:</b> ข้อมูลที่ไม่มีดาว (คลิก/ดู) มีแต่สัญญาณบวกและสัญญาณที่ไม่ถูกสังเกต ห้ามคิดคำนวณเสมือนว่าการไม่คลิกคือความเกลียด</li>
          </ul>
        </div>
      `,
      sources: [
        source(docIntro, 20, 'ประเภทของระบบแนะนำและการเลือกใช้งาน'),
        source(docCB, 15, 'Content-Based และการแก้ปัญหา Cold-Start'),
        source(docCF, 30, 'Collaborative Filtering และข้อจำกัดด้าน Sparsity'),
        source(docHybrid, 45, 'Hybrid Architecture และ Two-Tower Models')
      ],
      questions: [
        question(
          'rs-cap-matrix-1',
          'แพลตฟอร์มอีคอมเมิร์ซมีสินค้าใหม่ลงขาย 50,000 ชิ้นต่อวัน ซึ่งยังไม่มีประวัติการคลิกหรือดาวเลย โมเดลใดเหมาะสมที่สุดในการแนะนำสินค้าใหม่เหล่านี้ให้แก่ผู้ใช้ได้อย่างมีประสิทธิภาพ?',
          [
            'User-based Collaborative Filtering ด้วย Pearson Correlation',
            'Content-based Filtering ร่วมกับ Multimodal Feature Extraction',
            'Matrix Factorization แบบดั้งเดิมที่ใช้เพียง User ID และ Item ID',
            'Item-based kNN ที่อาศัย Co-occurrence Matrix จากประวัติการซื้อในอดีต'
          ],
          1,
          'สินค้าใหม่ที่ไม่มีประวัติการซื้อเลย (New Item Cold-start) ไม่สามารถคำนวณความคล้ายจากพฤติกรรมในอดีตได้ ต้องใช้คุณลักษณะเนื้อหาและสื่อ (Content/Multimodal) มาสร้างเวกเตอร์แทน',
          [
            'User-kNN ต้องอาศัยประวัติที่ผู้ใช้มีร่วมกัน สินค้าใหม่ที่ยังไม่มีใครซื้อเลยจึงไม่มีข้อมูลในเมทริกซ์',
            'ถูกต้อง สินค้าใหม่มี Metadata และรูปภาพที่ Content-based และ Multimodal สามารถสกัดฟีเจอร์เพื่อนำไปจับคู่กับผู้ใช้ได้ทันที',
            'MF แบบ ID ล้วนไม่มีเวกเตอร์สำหรับไอเท็มใหม่ และจะทำนายได้เพียงค่าเฉลี่ย Bias ทั่วไปเท่านั้น',
            'Item-kNN ต้องอาศัยประวัติการถูกซื้อคู่กัน สินค้าใหม่ยังไม่เคยถูกซื้อคู่กับสิ่งใดจึงหาเพื่อนบ้านไม่ได้'
          ]
        ),
        question(
          'rs-cap-matrix-2',
          'แพลตฟอร์มมีผู้ใช้ 50 ล้านคนและสินค้า 10 ล้านชิ้น ต้องการระบบค้นหาและดึงรายการแนะนำเบื้องต้น (Candidate Retrieval) ให้เสร็จสิ้นภายใน 25 ms สถาปัตยกรรมใดตอบโจทย์เชิงวิศวกรรมนี้ได้จริง?',
          [
            'ใช้ Large Language Model รัน Listwise Prompting คัดเลือกจากสินค้า 10 ล้านชิ้นโดยตรง',
            'ใช้ User-based kNN คำนวณ Cosine Similarity สดข้ามผู้ใช้ 50 ล้านคนทุกครั้งที่มี Request',
            'Two-Tower Neural Network ร่วมกับ Approximate Nearest Neighbor (ANN) Indexing',
            'Exact Graph Convolutional Network (GCN) ที่ขยาย 5-hop บนกราฟเต็มขนาดแบบ Real-time'
          ],
          2,
          'Two-Tower แยกคำนวณเวกเตอร์สินค้าไว้ล่วงหน้าแบบ Offline และสร้าง Query Vector ผู้ใช้แบบ Real-time ไปค้นหาในดัชนี ANN (เช่น ScaNN หรือ HNSW) ซึ่งใช้เวลาเพียงระดับมิลลิวินาทีบนคลังสินค้าระดับล้านชิ้น',
          [
            'Context Window และ Latency ของ LLM ไม่สามารถประมวลผลสินค้า 10 ล้านชิ้นได้ และจะใช้เวลาหลักวินาทีถึงหลักนาที',
            'User-kNN บน 50 ล้านคนมีความซับซ้อนสูงมาก ไม่สามารถคำนวณสดใน 25 ms ได้เลย',
            'ถูกต้อง Two-Tower ร่วมกับ ANN Indexing คือมาตรฐานอุตสาหกรรมในการค้นหารายการนับล้านภายในเวลาไม่เกิน 25 ms',
            'การขยาย 5-hop บนกราฟ 60 ล้านโหนดแบบ Real-time จะเกิด Neighbor Explosion และใช้เวลาหลายวินาที'
          ]
        ),
        question(
          'rs-cap-matrix-3',
          'ข้อมูลในระบบมีเพียงบันทึกการคลิกและการเปิดดูวิดีโอ (ไม่มีคะแนนดาว 1–5 ดาว และไม่มีปุ่มกดไม่ชอบ) ควรเลือกใช้อัลกอริทึมกลุ่มใดที่ออกแบบมาสำหรับลักษณะข้อมูลนี้โดยเฉพาะ?',
          [
            'Ordinary Matrix Factorization ที่ใช้ Mean Squared Error (MSE) โดยแปลงช่องว่างให้เป็น 0 ดาว',
            'Memory-based kNN ที่กรอกคะแนนช่องว่างด้วยค่าเฉลี่ยแถวทั้งหมด',
            'Content-based TF-IDF โดยไม่สนใจประวัติการคลิกของผู้ใช้',
            'Implicit Collaborative Filtering เช่น BPR (Bayesian Personalized Ranking) หรือ WRMF'
          ],
          3,
          'Implicit Feedback มีเฉพาะสัญญาณเชิงบวก (คลิก/ดู) และสัญญาณที่ไม่ถูกสังเกต BPR และ WRMF ถูกออกแบบมาเพื่อเรียนรู้แบบ Pairwise หรือกำหนด Confidence Weight บนข้อมูลรูปแบบนี้โดยเฉพาะ',
          [
            'การมองช่องว่างเป็น 0 ดาวคือการทึกทักเอาเองว่าผู้ใช้เกลียดสิ่งที่ไม่เคยกด ทั้งที่ความจริงอาจแค่ยังไม่เคยเห็น',
            'การกรอกค่าเฉลี่ยทำลายความกระจัดกระจายของข้อมูลและสร้างอคติอย่างรุนแรงต่อการทำนาย',
            'การตัดประวัติการคลิกทิ้งทำให้สูญเสียสัญญาณพฤติกรรมความสนใจของผู้ใช้ไปทั้งหมด',
            'ถูกต้อง BPR และ WRMF คืออัลกอริทึมที่ออกแบบมาสำหรับ Implicit Feedback โดยไม่ต้องพึ่งพาคะแนนลบที่ชัดเจน'
          ]
        ),
        question(
          'rs-cap-matrix-4',
          'หากต้องการใช้ Large Language Model (LLM) ในระบบแนะนำสินค้าที่มีผู้ใช้หลักล้านคน วิธีการบูรณาการใดที่สมเหตุสมผลและสอดคล้องกับงบประมาณทรัพยากร (GPU/Latency) มากที่สุด?',
          [
            'ใช้ LLM เป็น Cascade Reranker ในขั้นตอนสุดท้ายสำหรับผู้สมัครเพียง Top-10 หรือ Top-20 ชิ้น',
            'ให้ LLM ทำนายคะแนนความชอบของสินค้าทุกชิ้นในคลังสินค้า 1 ล้านชิ้นทุกครั้งที่ผู้ใช้รีเฟรชหน้าเว็บ',
            'นำ LLM มาแทนที่ Two-Tower และ ANN ทั้งหมดตั้งแต่ด่านแรก (Candidate Generation)',
            'บังคับให้ LLM เรียนรู้ Item ID ตัวเลข 8 หลักโดยตรงและสร้างคำตอบออกมาเป็นเลขรหัสสินค้า'
          ],
          0,
          'LLM มีความหน่วงสูงและกินทรัพยากรมหาศาล การใช้งานที่คุ้มค่าในโปรดักชันคือการจัดวางในด่านสุดท้าย (Cascade Reranker) บนรายการจำนวนน้อย (Top-10/20) เพื่อใช้ความสามารถด้านภาษาในการจัดอันดับและสร้างคำอธิบาย',
          [
            'ถูกต้อง การใช้ LLM บนรายการจำนวนน้อยในด่านสุดท้ายช่วยคุม Latency ให้อยู่ในเกณฑ์ และใช้พลังด้านภาษาได้อย่างคุ้มค่า',
            'การรัน LLM 1 ล้านครั้งต่อคำขอจะทำให้ระบบล่มจาก Latency และค่าใช้จ่าย GPU มหาศาล',
            'Candidate Generation ต้องการความเร็วระดับ sub-20 ms ซึ่ง Two-Tower + ANN ทำได้ดีกว่า LLM หลายร้อยเท่า',
            'LLM จดจำรหัสตัวเลขดิบได้แย่มากและเกิดปัญหา Token Fragmentation ควรสื่อสารด้วยข้อความภาษาธรรมชาติหรือ Semantic ID'
          ]
        )
      ]
    },
    {
      id: 'recsys-capstone-pipeline',
      number: '09.02',
      title: 'สถาปัตยกรรมโปรดักชัน 3 ด่านและการควบคุมคุณภาพ (3-Stage Pipeline)',
      goal: 'ลำดับขั้นตอนการทำงานจากคลังสินค้านับล้านสู่หน้าจอผู้ใช้ (Retrieval → Ranking → Re-ranking) พร้อมจัดวางตัวชี้วัดและ Guardrails ที่ถูกต้อง',
      lead: 'ระบบแนะนำจริงไม่สามารถรันโมเดลที่ซับซ้อนบนสินค้าทุกชิ้นในคลังได้ ต้องแบ่งหน้าที่เป็น 3 ด่านอย่างเข้มงวดเพื่อรักษาเวลาตอบสนองรวมไม่เกิน 50–100ms',
      body: `
        <div class="rs-cb-pipeline">
          <div>
            <b>1 · Retrieval (Candidate Generation)</b>
            <span><b>ขอบเขต:</b> 1,000,000 → 1,000 ชิ้น<br><b>เวลา:</b> < 15 ms<br><b>โมเดล:</b> Two-Tower, ScaNN ANN, i2i Tables<br><b>Metric:</b> Recall@K, Hit Rate@K, Candidate Coverage</span>
          </div>
          <div>
            <b>2 · Scoring (Heavy Ranking)</b>
            <span><b>ขอบเขต:</b> 1,000 → 100 ชิ้น<br><b>เวลา:</b> < 25 ms<br><b>โมเดล:</b> Deep Ranking Networks, Cross Features, Real-time Context<br><b>Metric:</b> nDCG@K, MRR, Log-loss, Calibration</span>
          </div>
          <div>
            <b>3 · Re-ranking (Diversity & Ethics)</b>
            <span><b>ขอบเขต:</b> 100 → 10 ชิ้น<br><b>เวลา:</b> < 10 ms<br><b>กลไก:</b> MMR (Diversity), Deduplication, Provider Fairness, Business Boost<br><b>Metric:</b> ILD, Gini Index, Provider Parity, P95 SLA</span>
          </div>
          <div>
            <b>ผลลัพธ์บนหน้าจอผู้ใช้ (Final Feed)</b>
            <span><b>เวลารวม:</b> ~50 ms (ผ่านเกณฑ์ SLA)<br><b>ประสบการณ์:</b> ตรงใจผู้ใช้ มีความสดใหม่ หลากหลาย และยุติธรรมต่อผู้ผลิตทุกฝ่าย</span>
          </div>
        </div>

        <div data-rs-demo="capstone-pipeline"></div>

        <div class="easy-explain">
          <h3>ทำไมต้องแยกเป็น 3 ด่าน และเหตุใดจึงห้ามวัด nDCG ในด่านแรก?</h3>
          <p><b>1. Trade-off ระหว่างความเร็วและความละเอียด:</b> หากใช้โมเดล Deep Ranking ที่ซับซ้อนมาคำนวณบนสินค้า 1 ล้านชิ้น ระบบจะต้องใช้เวลาหลายวินาทีต่อคำขอ ซึ่งผู้ใช้จะปิดแอปหนีก่อนที่ผลลัพธ์จะปรากฏ การใช้สถาปัตยกรรมแบบกรวย (Funnel Architecture) ช่วยให้เราคัดกรองอย่างหยาบแต่รวดเร็วในด่านแรก แล้วจึงนำรายการที่ผ่านเข้ารอบมาวิเคราะห์อย่างละเอียดในด่านถัดไป</p>
          <p><b>2. บทบาทของตัวชี้วัดแต่ละด่าน:</b></p>
          <ul>
            <li><b>ด่านที่ 1 สนใจ Recall:</b> เป้าหมายของด่านแรกไม่ใช่การจัดอันดับว่าใครอยู่ที่ 1 หรือ 2 แต่คือ "การไม่ทำของที่ผู้ใช้ชอบหลุดรอดไป" หากของดีไม่ติดเข้ามาใน 1,000 ชิ้นแรก ด่านถัดไปจะไม่มีวันได้เห็นของชิ้นนั้นเลย การวัด nDCG หรือ Precision ในด่านนี้จึงไม่ตรงกับหน้าที่ของมัน</li>
            <li><b>ด่านที่ 2 สนใจ Ranking Quality:</b> มุ่งเน้นการพยากรณ์ความน่าจะเป็นที่จะเกิดการคลิกหรือการซื้ออย่างแม่นยำที่สุด จึงใช้ตัวชี้วัดอันดับอย่าง nDCG และ MRR</li>
            <li><b>ด่านที่ 3 สนใจ Beyond-Accuracy & Guardrails:</b> ป้องกันปัญหาความซ้ำซาก (Filter Bubble), คุ้มครองสิทธิ์ของผู้ผลิตรายย่อย (Provider Fairness) และคุมเวลาตอบสนองไม่ให้เกิน P95 Latency SLA</li>
          </ul>
        </div>
      `,
      sources: [
        source(docIntro, 35, 'สถาปัตยกรรมระบบแนะนำระดับโปรดักชัน'),
        source(docEval, 72, 'ตัวชี้วัดหลักและการกำหนด Guardrails'),
        source(docHybrid, 50, 'Multi-Stage Cascade Recommendation Pipeline')
      ],
      questions: [
        question(
          'rs-cap-pipe-1',
          'ในด่าน Candidate Generation (ด่านที่ 1) ของระบบแนะนำระดับโปรดักชัน ตัวชี้วัด (Metric) ใดมีความสำคัญสูงสุดในการประเมินประสิทธิภาพของด่านนี้?',
          [
            'Intra-List Diversity (ILD) ของ 10 รายการสุดท้าย',
            'ค่า Mean Absolute Error (MAE) ของคะแนนดาว',
            'Recall@K หรือ Candidate Coverage จากคลังทั้งหมด',
            'p-value ของการทดสอบสมมติฐานแบบ Bootstrap'
          ],
          2,
          'เป้าหมายของด่าน Candidate Generation คือการคัดกรองไม่ให้ไอเท็มที่เกี่ยวข้องหลุดรอดไป จึงต้องวัดด้วย Recall@K เพื่อยืนยันว่าสิ่งที่ผู้ใช้สนใจติดเข้ามาในกลุ่มผู้สมัครมากที่สุด',
          [
            'ILD บน Top-10 เป็นตัวชี้วัดในด่าน Re-ranking ไม่ใช่หน้าที่ของด่านดึงผู้สมัคร 1,000 รายการ',
            'ด่านแรกไม่ได้ทำนายคะแนนดาว และ MAE ไม่ได้สะท้อนว่าของที่ผู้ใช้สนใจหลุดรอดเข้ามาหรือไม่',
            'ถูกต้อง ด่าน Candidate Generation ต้องประเมินด้วย Recall@K เพื่อให้แน่ใจว่าไม่ทำของที่ผู้ใช้สนใจหลุดมือไป',
            'การทดสอบนัยสำคัญทางสถิติเป็นขั้นตอนการวิเคราะห์ผล ไม่ใช่ตัวชี้วัดประสิทธิภาพเชิงระบบของด่าน Retrieval'
          ]
        ),
        question(
          'rs-cap-pipe-2',
          'เหตุใดในระบบแนะนำระดับโปรดักชันจึงไม่ใช้โมเดล Deep Ranking ที่ซับซ้อนมาจัดอันดับสินค้าทั้งหมด 10 ล้านชิ้นโดยตรงตั้งแต่แรก?',
          [
            'เพราะ Deep Ranking โมเดลให้ค่าความแม่นยำต่ำกว่า Two-Tower เสมอ',
            'เพราะสินค้า 10 ล้านชิ้นไม่มี Metadata เพียงพอสำหรับ Deep Learning',
            'เพราะผู้ใช้ทุกคนมีความสนใจตรงกัน จึงไม่จำเป็นต้องใช้โมเดลซับซ้อน',
            'เพราะข้อจำกัดด้านเวลาตอบสนอง (Latency SLA) และต้นทุนการคำนวณบนเซิร์ฟเวอร์'
          ],
          3,
          'การส่งสินค้า 10 ล้านชิ้นเข้าสู่ Deep Neural Network พร้อมกันต่อหนึ่งคำขอจะใช้เวลาในการประมวลผลหลายวินาทีและผลาญพลังงาน GPU มหาศาล ขัดต่อ Latency SLA ที่ระบบต้องตอบสนองภายใน 50–100 ms',
          [
            'โมเดล Deep Ranking ที่มี Cross Features มีความแม่นยำและ Expressive Power สูงกว่า Two-Tower เสียอีก',
            'สินค้าในระบบใหญ่มี Metadata และ Interaction Logs มหาศาลเพียงพอสำหรับการเรียนรู้แน่นอน',
            'ผู้ใช้มีความชอบแตกต่างกันอย่างมาก การทำ Personalization ยังเป็นหัวใจสำคัญ',
            'ถูกต้อง ข้อจำกัดด้าน Latency SLA และต้นทุน GPU บังคับให้ต้องใช้สถาปัตยกรรมแบบกรวย คัดกรองด้วยโมเดลเบาก่อน'
          ]
        ),
        question(
          'rs-cap-pipe-3',
          'ขั้นตอนใดควรเกิดขึ้นในด่าน Re-ranking (ด่านที่ 3) ก่อนส่งมอบรายการแนะนำให้แก่ผู้ใช้งาน?',
          [
            'การตัดรายการซ้ำ (Deduplication), การเพิ่มความหลากหลายด้วย MMR และการคุมโควตาความเป็นธรรม',
            'การคำนวณ TF-IDF ของคลังสินค้าทั้งหมด 10 ล้านชิ้นใหม่จากศูนย์',
            'การแยกตัวประกอบเมทริกซ์ (Matrix Factorization) ด้วยอัลกอริทึม ALS แบบเต็มรูปแบบ',
            'การฝึกโมเดลโครงข่ายประสาทเทียม Two-Tower ใหม่ด้วย In-batch Negatives'
          ],
          0,
          'ด่าน Re-ranking มีหน้าที่นำรายการที่ผ่านการให้คะแนนแล้วมาจัดความหลากหลาย (MMR), กำจัดสินค้าที่เพิ่งซื้อไป (Deduplication) และปรับสมดุลสัดส่วนตามเกณฑ์ธุรกิจและความเป็นธรรม (Fairness Guardrails)',
          [
            'ถูกต้อง ด่าน Re-ranking รับผิดชอบด้าน Deduplication, ความหลากหลาย (Diversity) และการจัดสรรโควตาความเป็นธรรม',
            'การคำนวณ TF-IDF บน 10 ล้านชิ้นคืองาน Offline Preprocessing ไม่สามารถรันใน Re-ranking ได้',
            'การรัน ALS บนตารางขนาดใหญ่คืองาน Batch Training แบบ Offline',
            'การฝึก Two-Tower ทำในรอบ Training ไม่ใช่ขั้นตอนการปรับแต่งผลลัพธ์สุดท้ายก่อนแสดงผล'
          ]
        ),
        question(
          'rs-cap-pipe-4',
          'ในระบบแนะนำวิดีโอแบบเรียลไทม์ หากทีมงานวัดผลพบว่าโมเดลใหม่มีค่า nDCG@10 เพิ่มขึ้น 5% แต่ค่า P95 Latency เพิ่มขึ้นจาก 45ms เป็น 180ms ส่งผลให้ระบบไม่ผ่าน Guardrail ข้อสรุปทางวิศวกรรมที่ถูกต้องคือข้อใด?',
          [
            'ควรปล่อยโมเดลใหม่ขึ้น Production ทันทีเพราะความแม่นยำสำคัญกว่าเวลาตอบสนองเสมอ',
            'ยังไม่ควรปล่อยโมเดลนี้สู่ Production เพราะความหน่วงที่สูงเกินเกณฑ์จะทำลายประสบการณ์ใช้งานจริงของผู้ใช้',
            'ให้ยกเลิกการวัดค่า P95 Latency ทิ้งแล้วหันไปดูเฉพาะค่าเฉลี่ย Mean Latency เพื่อให้ผ่านเกณฑ์',
            'ปรับแก้เกณฑ์ Guardrail ให้ยอมรับ 200ms หลังเห็นผลการทดลองเพื่อให้โมเดลผ่านการประเมิน'
          ],
          1,
          'Guardrails ถูกตั้งไว้เพื่อปกป้องระบบ หากเวลาตอบสนองช้าเกินเกณฑ์ (180 ms) ผู้ใช้จะออกจากแอปก่อนที่ผลลัพธ์จะปรากฏ ความแม่นยำที่เพิ่มขึ้นจึงไม่มีความหมายในโลกจริง',
          [
            'ในระบบจริง ถ้าหน้าเว็บหรือแอปโหลดช้าเกิน 100 ms ผู้ใช้จะเลิกใช้งานทันที ความแม่นยำที่เพิ่มขึ้นจึงไร้ประโยชน์',
            'ถูกต้อง Guardrails ต้องมาก่อนเสมอ ความล่าช้า 180 ms จะทำลายประสบการณ์จริง จึงต้องปรับจูนโมเดลให้เร็วขึ้นก่อนปล่อยใช้งาน',
            'การดู Mean Latency จะซ่อนผู้ใช้ 5% สุดท้ายที่เจอปัญหาค้างและหน้าจอขาว (Long Tail Latency)',
            'การแก้ Guardrails หลังเห็นผลทดลองคือข้อผิดพลาดร้ายแรงทางวิทยาศาสตร์ข้อมูลเพื่อเข้าข้างโมเดลที่ต้องการ'
          ]
        )
      ]
    },
    {
      id: 'recsys-capstone-pitfalls',
      number: '09.03',
      title: 'กับดักข้อสอบและข้อผิดพลาดยอดฮิตในการวัดผล (Pre-Exam Pitfalls)',
      goal: 'จับจุดลวงข้อสอบ ทั้ง Data Leakage, Position Bias, Offline vs Online Mismatch, การสุ่ม Negative หลอก และ Leveling Down Fairness',
      lead: 'ข้อสอบระบบแนะนำมักไม่ได้ถามแค่สูตรคำนวณ แต่ถามว่า "วิธีที่นักวิจัยทำผิดตรงไหน" และ "ทำไมคะแนนในห้องทดลองสูงลิ่วแต่นำไปใช้จริงกลับล้มเหลว"',
      body: `
        <div class="easy-explain">
          <h3>6 หลุมพรางและข้อผิดพลาดยอดฮิตที่มักออกในข้อสอบ</h3>
          <p>สรุปประเด็นอันตรายที่ทำให้นักเรียนและวิศวกรหลงทาง พร้อมแนวทางแก้ไขที่ถูกต้อง:</p>
        </div>

        <div class="rs-resp-route">
          <div class="rs-resp-node rs-resp-bad">
            <b>หลุมพรางที่ 1: Random Split</b>
            <span>สุ่มแถว 80/20 โดยไม่สนเวลา ส่งผลให้ข้อมูลวันหลังรั่วไปอยู่ใน Train แล้วนำไปทายเหตุการณ์วันก่อนหน้า (Data Leakage)</span>
          </div>
          <div class="rs-resp-arrow">→</div>
          <div class="rs-resp-node rs-resp-good">
            <b>แนวทางที่ถูกต้อง</b>
            <span>ใช้ <b>Temporal Split</b> แบ่งเส้นเวลาอย่างเข้มงวด: Train อดีต → Validation ปัจจุบัน → Test อนาคตที่ตรึงไว้</span>
          </div>
        </div>

        <div class="rs-resp-route">
          <div class="rs-resp-node rs-resp-bad">
            <b>หลุมพรางที่ 2: Preprocessing Leakage</b>
            <span>นำข้อมูลทั้งตารางมารวมกันแล้ว fit TF-IDF, Standard Scaler หรือนับความนิยมก่อนแบ่ง Train/Test</span>
          </div>
          <div class="rs-resp-arrow">→</div>
          <div class="rs-resp-node rs-resp-good">
            <b>แนวทางที่ถูกต้อง</b>
            <span>ต้อง <b>fit สถิติบนชุด Train เท่านั้น</b> แล้วนำตัวแปลง (Transformer) ชุดเดิมไปประยุกต์ใช้กับ Validation/Test</span>
          </div>
        </div>

        <div class="rs-resp-route">
          <div class="rs-resp-node rs-resp-bad">
            <b>หลุมพรางที่ 3: Sampled Negatives Trap</b>
            <span>สุ่มไอเท็มลบ 99 ชิ้นมาวัด nDCG แล้วเคลมว่าโมเดลเก่งกว่าระบบอื่นที่ประเมินบน Full Catalog</span>
          </div>
          <div class="rs-resp-arrow">→</div>
          <div class="rs-resp-node rs-resp-good">
            <b>แนวทางที่ถูกต้อง</b>
            <span>ระบุชื่อ <b>sampled-nDCG@K (m=99)</b> อย่างโปร่งใส และระวังปรากฏการณ์ <b>Winner Flip</b> ที่ผู้ชนะในชุดสุ่มอาจแพ้ในคลังเต็ม</span>
          </div>
        </div>

        <div class="rs-resp-route">
          <div class="rs-resp-node rs-resp-bad">
            <b>หลุมพรางที่ 4: Position Bias & Unobserved</b>
            <span>ทึกทักเอาเองว่าไอเท็มที่ผู้ใช้ไม่คลิกแปลว่าเป็นของที่ผู้ใช้เกลียด ทั้งที่ผู้ใช้อาจมองไม่เห็นเพราะอยู่อันดับล่าง</span>
          </div>
          <div class="rs-resp-arrow">→</div>
          <div class="rs-resp-node rs-resp-good">
            <b>แนวทางที่ถูกต้อง</b>
            <span>ชดเชยโอกาสการถูกมองเห็นด้วย <b>Inverse Propensity Scoring (IPS)</b> และจัดสรรพื้นที่สุ่มสำรวจ (Exploration)</span>
          </div>
        </div>

        <div class="rs-resp-route">
          <div class="rs-resp-node rs-resp-bad">
            <b>หลุมพรางที่ 5: The Leveling Down Trap</b>
            <span>บังคับให้ช่องว่าง Parity Gap กลายเป็น 0 โดยการทำให้กลุ่มผู้ใช้เดิมได้คุณภาพแย่ลงเพื่อแลกกับตัวเลขเท่ากัน</span>
          </div>
          <div class="rs-resp-arrow">→</div>
          <div class="rs-resp-node rs-resp-good">
            <b>แนวทางที่ถูกต้อง</b>
            <span>ต้องรายงานคุณภาพรายกลุ่ม (Per-group Metric) ควบคู่กับ Gap เสมอ เพื่อให้มั่นใจว่าเกิดการ <b>ยกระดับกลุ่มที่ด้อยกว่า</b></span>
          </div>
        </div>

        <div class="rs-resp-route">
          <div class="rs-resp-node rs-resp-bad">
            <b>หลุมพรางที่ 6: The Peeking Trap ใน A/B Test</b>
            <span>แอบตรวจค่า p-value ทุกวัน และสั่งหยุดการทดลองทันทีที่เห็นค่า p < 0.05 โดยไม่มีกติกา Sequential Test</span>
          </div>
          <div class="rs-resp-arrow">→</div>
          <div class="rs-resp-node rs-resp-good">
            <b>แนวทางที่ถูกต้อง</b>
            <span>คำนวณ Sample Size และระยะเวลาทดลองล่วงหน้าตามหลัก Power Analysis และตรวจผลตามจุดที่กำหนดอย่างเป็นทางการ</span>
          </div>
        </div>
      `,
      sources: [
        source(docEval, 80, 'รูปแบบของ Data Leakage และวิธีป้องกัน'),
        source(docEval, 85, 'Sampled Negatives และปรากฏการณ์ Winner Flip'),
        source(docEval, 92, 'Peeking, Novelty Effect และข้อควรระวังใน A/B Testing')
      ],
      questions: [
        question(
          'rs-cap-pitfalls-1',
          'นักวิจัยสร้างระบบแนะนำข่าว โดยนำข้อมูลข่าวตลอดทั้งเดือนมาคำนวณค่าเฉลี่ยความนิยมและสถิติ IDF จากนั้นจึงสุ่มแยกแถวเป็น 80% Train และ 20% Test การทดลองนี้มีข้อผิดพลาดร้ายแรงในเรื่องใด?',
          [
            'ใช้ภาษาโปรแกรมที่ไม่รองรับ Deep Learning',
            'จำนวนข่าวใน Test Set มีน้อยเกินไปจนคำนวณค่าเฉลี่ยไม่ได้',
            'ใช้สัดส่วน 80/20 แทนที่จะเป็น 70/30',
            'เกิด Data Leakage ทั้งจากการใช้ข้อมูลอนาคตใน Train และการ fit สถิติบนชุด Test'
          ],
          3,
          'การสุ่มแถวโดยไม่สนเวลาทำให้โมเดลเห็นข่าวในอนาคต และการคำนวณ IDF ก่อนแบ่งชุดข้อมูลทำให้สถิติของ Test รั่วไหลเข้าไปในกระบวนการ Preprocessing ทำให้คะแนนในแล็บสูงเกินจริง',
          [
            'ภาษาโปรแกรมไม่เกี่ยวข้องกับความถูกต้องของระเบียบวิธีการทดลอง',
            '20% ของข้อมูลทั้งเดือนเป็นจำนวนที่เพียงพอต่อการคำนวณทางสถิติ',
            'สัดส่วน 80/20 เป็นสัดส่วนทั่วไป ปัญหาไม่ได้อยู่ที่สัดส่วนการแบ่ง',
            'ถูกต้อง การสุ่มแถวไม่สนเวลาและการ fit สถิติก่อนแบ่งชุดข้อมูลคือตัวอย่างคลาสสิกของ Data Leakage'
          ]
        ),
        question(
          'rs-cap-pitfalls-2',
          'หากเปรียบเทียบระบบ P และ Q บนคลังสินค้าเต็ม (Full Catalog) พบว่า Q ชนะ P แต่เมื่อนำมาทดสอบแบบสุ่มไอเท็มลบ 99 ชิ้น (Sampled Negatives) กลับพบว่า P มีคะแนน sampled-HR@1 สูงกว่า Q ปรากฏการณ์นี้เรียกว่าอะไร และควรสรุปผลอย่างไร?',
          [
            'Winner Flip; ไม่สามารถสรุปว่า P ดีกว่า Q ในงานจริงได้ เพราะการลดคู่แข่งเปลี่ยนลักษณะความยากของโจทย์',
            'Catastrophic Forgetting; แปลว่าโมเดล Q สูญเสียความทรงจำในอดีตไปหมดแล้ว',
            'Simpson\'s Paradox; แปลว่าต้องสุ่มกลุ่มตัวอย่างผู้ใช้เพิ่มขึ้นอีก 10 เท่า',
            'Overfitting; แปลว่าโมเดล P มีจำนวนพารามิเตอร์มากเกินไปจนจำโจทย์'
          ],
          0,
          'ปรากฏการณ์นี้เรียกว่า Winner Flip เกิดจากการที่การสุ่มตัวอย่างไอเท็มลบทำให้ความยากของโจทย์เปลี่ยนไป โมเดลที่ชนะในคู่แข่งน้อยชิ้นอาจแพ้ในคลังเต็ม จึงห้ามนำผล Sampled ไปอ้างชัยชนะบน Full Catalog',
          [
            'ถูกต้อง นี่คือปรากฏการณ์ Winner Flip ซึ่งเตือนว่าการสุ่มลบเปลี่ยนความยากของงาน และไม่สามารถแทน Full Catalog ได้',
            'Catastrophic Forgetting เกิดเมื่อโมเดลเรียนรู้งานใหม่แล้วลืมงานเก่า ไม่ใช่การเปลี่ยนผลจากขนาดผู้สมัคร',
            'Simpson\'s Paradox คือแนวโน้มที่กลับทิศเมื่อรวมกลุ่มข้อมูล ไม่ใช่เรื่องการสุ่มคู่แข่งในการวัดผล',
            'โมเดลไม่ได้ถูกเทรนใหม่ แต่ถูกประเมินบนชุดข้อสอบที่มีจำนวนคู่แข่งแตกต่างกัน'
          ]
        ),
        question(
          'rs-cap-pitfalls-3',
          'ในการทำ A/B Testing วิศวกรคอยเปิดดู Dashboard ทุกเช้า พอถึงวันที่ 4 พบว่าค่า p-value ลดลงแตะ 0.04 (< 0.05) จึงสั่งหยุดการทดลองทันทีและประกาศว่าระบบใหม่ชนะ พฤติกรรมนี้มีปัญหาอย่างไร?',
          [
            'ค่า p-value ต่ำเกินไป ควรหยุดเมื่อ p-value มีค่ามากกว่า 0.5 เท่านั้น',
            'เป็นปัญหา Peeking ซึ่งเพิ่มโอกาสเกิด False Positive (ผลบวกปลอม) อย่างมีนัยสำคัญ',
            'ระบบลืมนำคะแนน MAE มาคิดคำนวณร่วมกับ p-value',
            'การทำ A/B Test ห้ามใช้กลุ่มควบคุม (Control Group) ร่วมกับการวัดผล'
          ],
          1,
          'พฤติกรรมนี้เรียกว่า Peeking หรือ Optional Stopping การตรวจผลและหยุดเมื่อได้ค่าที่พอใจโดยไม่มีระเบียบวิธี Sequential Testing ที่ถูกต้อง จะทำให้ค่าความเสี่ยง Type I Error (False Positive) พุ่งสูงขึ้นอย่างมาก',
          [
            'ในการทดสอบสมมติฐาน เราต้องการ p-value ต่ำ ไม่ใช่สูงกว่า 0.5',
            'ถูกต้อง การแอบดูผลซ้ำๆ แล้วหยุดเมื่อ p < 0.05 เรียกว่า Peeking ซึ่งเพิ่มความเสี่ยงเกิดผลบวกปลอมอย่างรุนแรง',
            'MAE เป็น Offline Rating Metric ไม่ใช่ตัวชี้วัดหลักของการทดลอง Online A/B',
            'Control Group เป็นหัวใจสำคัญที่สุดของการทดสอบ A/B เพื่อควบคุมปัจจัยภายนอก'
          ]
        ),
        question(
          'rs-cap-pitfalls-4',
          'ทีมงานต้องการแก้ปัญหาความเหลื่อมล้ำระหว่างกลุ่มผู้ใช้ (Consumer Fairness) จึงปรับอัลกอริทึมจนได้ Parity Gap ระหว่างกลุ่มนักศึกษาและกลุ่มคนทำงานเท่ากับ 0.00 แต่เมื่อตรวจสอบพบว่า nDCG ของนักศึกษาลดจาก 0.82 เหลือ 0.51 เท่ากับคนทำงาน เหตุการณ์นี้ตรงกับข้อใด?',
          [
            'Perfect Fairness Optimization ที่ควรนำไปใช้งานจริงทุกระบบ',
            'Inverse Propensity Scoring สำเร็จตามทฤษฎี',
            'Leveling Down Trap ที่สร้างความเท่าเทียมโดยการทำให้กลุ่มที่เคยได้รับบริการดีมีคุณภาพแย่ลง',
            'Data Sparsity ที่เกิดจากการมีผู้ใช้น้อยเกินไปในระบบ'
          ],
          2,
          'นี่คือกับดัก Leveling Down ที่ตัวเลขความเหลื่อมล้ำหายไปไม่ใช่เพราะยกระดับกลุ่มที่ด้อยกว่า แต่เกิดจากการดึงกลุ่มที่ดีให้ต่ำลงมาเท่ากัน ซึ่งทำลายคุณค่าและประสบการณ์จริงของผู้ใช้',
          [
            'การทำให้ผู้ใช้กลุ่มหนึ่งได้รับประสบการณ์แย่ลงอย่างฮวบฮาบเพื่อแลกกับตัวเลข Gap ไม่ใช่สิ่งที่ดีในเชิงธุรกิจและคุณค่าจริง',
            'IPS เป็นเทคนิคแก้ Selection Bias ใน Log ไม่ใช่การลดคะแนนกลุ่มผู้ใช้',
            'ถูกต้อง นี่คือ Leveling Down Trap ที่ทำให้ความเหลื่อมล้ำเป็นศูนย์ด้วยการทำลายคุณภาพของกลุ่มที่ดีลงมา',
            'ผลลัพธ์นี้เกิดจากนโยบายการปรับแต่งหรือข้อจำกัดที่ใส่เข้าไปในโมเดล ไม่ใช่ความเบาบางของข้อมูล'
          ]
        )
      ]
    },
    {
      id: 'recsys-capstone-scenarios',
      number: '09.04',
      title: 'ข้อสอบประมวลสถานการณ์จำลองข้ามบท (Capstone Scenarios)',
      goal: 'วิเคราะห์โจทย์สถานการณ์จริงที่ต้องตัดสินใจผสมผสานองค์ความรู้จากหลายบทพร้อมกันอย่างแม่นยำ',
      lead: 'ข้อสอบวัดความรู้ระดับสูงมักตั้งเป็นโจทย์สถานการณ์วิศวกรรมจริง ที่บังคับให้ผู้สอบชั่งน้ำหนักระหว่างข้อมูล ประสิทธิภาพ ความเร็ว จริยธรรม และการวัดผล',
      body: `
        <div class="easy-explain">
          <h3>คู่มือคิดก่อนตอบ: วิเคราะห์โจทย์ระบบแนะนำ 4 ขั้นตอน</h3>
          <p>เมื่อเผชิญกับโจทย์สถานการณ์ข้ามบท ให้ใช้กรอบการคิดตามลำดับนี้:</p>
          <ol>
            <li><b>1. จำแนกวัตถุดิบข้อมูล:</b> มีข้อมูลคะแนนดาว (Explicit) หรือมีเพียงคลิก/ดู (Implicit)? มีรูปภาพ/ข้อความหรือไม่? ข้อมูลมีความเบาบาง (Sparsity) แค่ไหน?</li>
            <li><b>2. ตรวจสอบข้อจำกัดทางวิศวกรรม (Constraints):</b> Latency SLA คือกี่มิลลิวินาที? คลังสินค้ามีขนาดกี่ล้านชิ้น? ต้องรองรับสินค้าเข้าใหม่ (Cold-start) หรือไม่?</li>
            <li><b>3. จัดวางบทบาทใน Pipeline:</b> อัลกอริทึมใดควรอยู่ด่าน Retrieval (เน้นเร็วและ Recall), อัลกอริทึมใดควรอยู่ด่าน Ranking (เน้น nDCG), และอะไรต้องคุมในด่าน Re-ranking?</li>
            <li><b>4. ประเมินความรับผิดชอบและจริยธรรม:</b> เกิด Popularity Bias หรือไม่? มีความเสี่ยงต่อผู้ผลิตรายย่อย (Provider Fairness) หรือไม่? และโปรโตคอลการทดลองป้องกัน Data Leakage แล้วหรือยัง?</li>
          </ol>
        </div>

        <div class="callout exam">
          <b>ตัวอย่างกรณีศึกษาจริง:</b>
          <ul>
            <li><b>กรณีแอปวิดีโอสั้น (TikTok/Reels Style):</b> วิดีโอใหม่เข้าทุกวินาที + ไม่มีคะแนนดาว + Latency ต้องต่ำกว่า 30 ms → ต้องใช้ Multimodal Embeddings + Two-Tower Retrieval + In-batch Negative Loss + MMR Re-ranking เพื่อกันฟีดซ้ำซาก</li>
            <li><b>กรณีตลาดงานศิลปะ (Etsy Style):</b> สินค้า Handmade ชิ้นเดียวในโลก + ผู้ผลิตรายย่อยสู้แบรนด์ดังยาก → ต้องใช้ BPR/WRMF Implicit Modeling + Provider Floor Quota ใน Re-ranking เพื่อรักษาศิลปินหน้าใหม่</li>
            <li><b>กรณีระบบแนะนำคอร์สการแพทย์ (High-stakes RecSys):</b> ห้ามผิดพลาดและห้ามมโน → ต้องใช้ RAG-based Grounded LLM พร้อม Rationale ตรวจสอบได้ + Paired Bootstrap Testing เพื่อยืนยันความปลอดภัย</li>
          </ul>
        </div>
      `,
      sources: [
        source(docIntro, 50, 'กรณีศึกษาและการประยุกต์ใช้ในอุตสาหกรรม'),
        source(docEval, 95, 'Evaluation Protocol Card สำหรับระบบโปรดักชัน'),
        source(docHybrid, 70, 'ระบบแนะนำสมัยใหม่และการบูรณาการข้ามสาขา')
      ],
      questions: [
        question(
          'rs-cap-exam-1',
          'บริษัทสตาร์ตอัปกำลังพัฒนาแอปพลิเคชันวิดีโอสั้นที่มีวิดีโอใหม่ถูกอัปโหลด 100,000 คลิปต่อชั่วโมง และต้องตอบสนองหน้าฟีดให้ผู้ใช้ภายใน 30 ms ทีมงานควรเลือกสถาปัตยกรรมแบบบูรณาการใดเพื่อให้ระบบทำงานได้จริงและไม่เกิด New Item Cold-start?',
          [
            'สกัด Multimodal Embeddings จากวิดีโอแบบ Offline → ใช้ Two-Tower Network ทำ Candidate Retrieval ด้วย ANN → จัดอันดับด้วย Light Ranking Model → ใส่ MMR เพิ่มความหลากหลาย',
            'เก็บวิดีโอทั้งหมดไว้ในฐานข้อมูล SQL แล้วใช้ User-kNN จับคู่ความคล้ายคลึงของผู้ใช้ออนไลน์ทุก Request',
            'ใช้ Matrix Factorization (MF) แบบ SGD ทำนายคะแนนความชอบของคลิปใหม่ทั้งหมดแบบ Real-time',
            'ส่งวิดีโอใหม่ทั้งหมดเข้า Large Language Model (LLM) ให้เขียนสรุปและเรียงลำดับแบบ Listwise'
          ],
          0,
          'Multimodal Embeddings ช่วยแก้ปัญหาคลิปใหม่ที่ยังไม่มีคนดู (New Item Cold-start), Two-Tower + ANN ตอบโจทย์เวลา <30ms บนวิดีโอมหาศาล, และ MMR ช่วยป้องกันไม่ให้ฟีดเต็มไปด้วยคลิปซ้ำซาก',
          [
            'ถูกต้อง นี่คือสถาปัตยกรรมระดับโปรดักชันที่แก้ได้ทั้ง Cold-start, Latency SLA และความหลากหลายของเนื้อหา',
            'User-kNN ไม่สามารถแนะนำคลิปใหม่ที่ยังไม่มีใครดูได้ และช้าเกินกว่าจะตอบสนองใน 30 ms บนฐานข้อมูล SQL',
            'MF แบบพื้นฐานมี New Item Cold-start อย่างรุนแรงและ SGD ในช่วง Serving ไม่ทันเวลา 30 ms แน่นอน',
            'การรัน LLM บนคลิป 100,000 คลิปกินเวลาหลักนาทีและค่าใช้จ่าย GPU มหาศาล เป็นไปไม่ได้ในทางปฏิบัติ'
          ]
        ),
        question(
          'rs-cap-exam-2',
          'ตลาดซื้อขายงานศิลปะออนไลน์พบปัญหา "ผู้ผลิตรายใหญ่เพียง 5% กวาด Impression ไปถึง 80%" ส่งผลให้ศิลปินหน้าใหม่ถอนตัวออกจากแพลตฟอร์ม (Creator Churn) แม้ว่าระบบจะมีค่า nDCG รวมอยู่ในระดับสูง ทีมงานควรปรับปรุงระบบอย่างไรในเชิงภาพรวม?',
          [
            'เพิ่มค่า K ในการวัด nDCG@K ให้ยาวขึ้นเป็น 100 เพื่อซ่อนปัญหา',
            'กำหนด Provider Fairness Guardrails ในด่าน Re-ranking ร่วมกับการใช้ Exploration Policy (เช่น Epsilon-greedy หรือ Fair Reranking)',
            'บังคับให้ผู้ผลิตรายใหญ่หยุดลงขายสินค้าเป็นเวลา 30 วันเพื่อรีเซ็ตอัลกอริทึม',
            'เปลี่ยนอัลกอริทึมทั้งหมดไปเป็น Most Popularity เพื่อให้ผู้ใช้ได้รับสินค้าที่การันตียอดขายสูงสุด'
          ],
          1,
          'ปัญหานี้คือ Provider-side Unfairness และ Popularity Feedback Loop การแก้ที่ถูกต้องคือการตั้งเกณฑ์การกระจาย Exposure ให้ศิลปินรายย่อย (Provider Floor Quota) ในด่าน Re-ranking และจัดสรรการสุ่มสำรวจ (Exploration) อย่างเป็นระบบ',
          [
            'การเปลี่ยนตัวชี้วัดเพื่อซ่อนตัวเลขไม่ได้แก้ปัญหาจริงของผู้ผลิตที่กำลังออกจากแพลตฟอร์ม',
            'ถูกต้อง ต้องใช้ Provider Fairness Guardrails และ Exploration Policy เพื่อเปิดโอกาสให้ศิลปินรายย่อยมีพื้นที่แสดงผล',
            'การห้ามผู้ผลิตรายใหญ่ขายสินค้าทำลายเศรษฐกิจของแพลตฟอร์มโดยไม่จำเป็น',
            'Most Popularity จะยิ่งทำให้ผู้ผลิตรายใหญ่กินรวบตลาดหนักขึ้นไปอีก (ทวีความรุนแรงของ Feedback Loop)'
          ]
        ),
        question(
          'rs-cap-exam-3',
          'ในการพัฒนาผู้ช่วยแนะนำคอร์สเรียนแพทย์อัจฉริยะที่ใช้ Large Language Model (LLM) ผู้บริหารต้องการให้ระบบอธิบายเหตุผลของการแนะนำได้อย่างน่าเชื่อถือ และ "ห้ามสร้างข้อมูลเท็จทางการแพทย์โดยเด็ดขาด" (Hallucination Prevention) สถาปัตยกรรมใดตอบโจทย์นี้ได้สมบูรณ์ที่สุด?',
          [
            'ให้ LLM ทำนายคอร์สจากความทรงจำภายใน (Internal Parameters) โดยไม่ต้องป้อนข้อมูลอ้างอิงใดๆ',
            'ทำการ Fine-tune โมเดลด้วยรีวิวจากผู้ใช้ทั่วไปบนโซเชียลมีเดีย',
            'ใช้แนวทาง RAG (Retrieval-Augmented Generation) โดยดึงหลักสูตรและผลลัพธ์การเรียนรู้ที่ผ่านการรับรองมาเป็น Grounding Evidence ใน Prompt',
            'สั่ง System Prompt ซ้ำๆ ว่า "ห้ามตอบผิด ห้ามตอบเท็จเด็ดขาด" โดยไม่ต้องแนบเอกสารอ้างอิง'
          ],
          2,
          'การใช้ RAG ช่วยให้ระบบดึงข้อมูลที่เป็นความจริงและผ่านการตรวจรับรองมาแนบเป็นบริบท (Grounding Evidence) ทำให้ LLM สามารถอ้างอิงข้อเท็จจริงและตรวจสอบย้อนกลับได้ ป้องกันอาการมโน (Hallucination) ได้อย่างมีประสิทธิภาพ',
          [
            'LLM มีโอกาส Hallucination สูงมากเมื่อตอบจากพารามิเตอร์เพียงอย่างเดียวโดยไม่มีข้อมูลหลักฐานค้ำจุน',
            'รีวิวทั่วไปบนโซเชียลมีเดียอาจมีข้อมูลความเชื่อที่ผิดหรือไม่ได้รับการรับรองทางการแพทย์',
            'ถูกต้อง สถาปัตยกรรม RAG ร่วมกับ Grounding Evidence เป็นวิธีที่ดีที่สุดในการป้องกัน Hallucination และสร้างความโปร่งใส',
            'Prompt เพียงอย่างเดียวไม่สามารถรับประกันความจริงได้ในเชิงเทคนิค หากโมเดลไม่มีแหล่งข้อมูลอ้างอิง'
          ]
        ),
        question(
          'rs-cap-exam-4',
          'หากต้องสรุป "หัวใจสำคัญในการตัดสินใจเชิงวิศวกรรมของวิชาระบบแนะนำ (RecSys)" ก่อนเข้าห้องสอบ ข้อใดเรียงลำดับการให้ความสำคัญได้อย่างถูกต้องและรอบด้านที่สุด?',
          [
            'เลือกโมเดลที่ชื่อทันสมัยที่สุด → คำนวณเฉพาะ Accuracy → นำขึ้น Production ทันที',
            'เน้นเฉพาะความเร็ว Latency ให้ต่ำกว่า 5ms โดยไม่ต้องสนใจว่าผลแนะนำตรงใจผู้ใช้หรือไม่',
            'ปรับแต่งให้ตัวเลขความเท่าเทียม Gap เป็น 0 เสมอ แม้จะต้องทำลายคุณภาพของผู้ใช้ทุกคนในระบบ',
            'เข้าใจลักษณะข้อมูลและปัญหา → ออกแบบ Pipeline ให้ตรงเวลาและ Latency SLA → วัดผลอย่างรัดกุมรอบด้าน (Accuracy + Beyond-accuracy) → ควบคุมจริยธรรมและความเป็นธรรม'
          ],
          3,
          'นี่คือกระบวนการคิดทางวิศวกรรมที่ถูกต้องและสมบูรณ์ที่สุด: เริ่มจากทำความเข้าใจธรรมชาติของข้อมูลและข้อจำกัดของระบบ, จัดสถาปัตยกรรม Pipeline ให้ตอบสนองได้ตามเวลา, ประเมินผลทั้งความแม่นยำและความหลากหลาย, และกำกับดูแลจริยธรรมเพื่อความยั่งยืนของทุกฝ่าย',
          [
            'ชื่อโมเดลที่ทันสมัยไม่ได้การันตีความเหมาะสมกับโจทย์ และ Accuracy ตัวเดียวไม่เพียงพอในการวัดผล',
            'ความเร็วที่ไร้ความแม่นยำจะทำให้ผู้ใช้ได้รับข้อมูลขยะที่ไร้ประโยชน์',
            'การทำลายคุณภาพผู้ใช้ทุกคนเข้าข่าย Leveling Down Trap',
            'ถูกต้อง นี่คือกระบวนทัศน์ทางวิศวกรรมที่สมบูรณ์แบบในการสร้างและประเมินระบบแนะนำอย่างยั่งยืน'
          ]
        )
      ]
    }
  ];

  window.RECSYS_CHAPTERS = window.RECSYS_CHAPTERS || [];
  window.RECSYS_CHAPTERS.push({
    id: 'recsys-capstone',
    number: '09',
    kicker: 'PRE-EXAM SYNTHESIS · CAPSTONE DECISION MATRIX',
    title: 'บท 09: สรุปภาพรวมและผังเชื่อมโยงวิธีเลือกใช้วิธีแนะนำก่อนสอบ (Pre-Exam Synthesis & Capstone)',
    description: 'ผังสรุปวิธีคิดข้ามบท: ตารางเปรียบเทียบกระบวนทัศน์ การเลือกโมเดลตามประเภทข้อมูลและข้อจำกัดระบบ สถาปัตยกรรม 3 ด่านระดับโปรดักชัน และชุดข้อสอบจำลองสถานการณ์จริงที่รวมหลายบทในข้อเดียว',
    lessons
  });
})();
