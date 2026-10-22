(function() {
  'use strict';

  const RECSYS_FIGURES = {
    // === Chapter 00: Foundations ===
    'recsys-entities': [
      {
        file: 'infographic-ch0-foundations.webp',
        w: 1200, h: 1696,
        title: 'สามเหลี่ยมทองคำของ RecSys: User · Item · Interaction',
        alt: 'แผนภาพสามเหลี่ยมทองคำแสดงความสัมพันธ์ระหว่าง User, Item และ Interaction Matrix R',
        note: 'พื้นฐานสำคัญของระบบแนะนำทุกประเภท: การเชื่อมโยงความชอบของผู้ใช้ (User) เข้ากับคุณลักษณะของสินค้า (Item) ผ่านประวัติการโต้ตอบ (Interaction Matrix R) ที่มีความเบาบางสูงถึง 99%',
        doc: { title: 'Recommender Systems Infographics', path: 'source/Recommending System/เอกสาร_Lecture/Recommender_Systems_Infographics_Chapter_Order.pdf', page: 1 }
      }
    ],
    'recsys-dot': [
      {
        file: 'vector-cosine-similarity.svg',
        w: 920, h: 480,
        darkStage: true,
        title: 'Cosine Similarity: วัดทิศทางของรสนิยมโดยตัดอคติของสเกลคะแนน',
        alt: 'แผนภาพเวกเตอร์ 2 มิติแสดงมุมทีต้าระหว่างเวกเตอร์ผู้ใช้สองคนและผลลัพธ์ของค่าโคไซน์',
        note: 'Cosine พิจารณาเฉพาะมุม θ ระหว่างเวกเตอร์ u และ v โดยไม่สนใจความยาว (L2 Norm) จึงช่วยแก้ปัญหาผู้ใช้ที่ชอบให้ดาวเฟ้อ (4-5 ดาว) กับผู้ใช้ที่เข้มงวด (1-2 ดาว)',
        badge: 'SVG Interactive Architecture'
      }
    ],

    // === Chapter 01: Introduction & Pipeline ===
    'recsys-pipeline': [
      {
        file: 'recsys-funnel-pipeline.svg',
        w: 940, h: 520,
        darkStage: true,
        title: 'The RecSys Multi-Stage Funnel: สถาปัตยกรรมระบบแนะนำระดับ Production',
        alt: 'แผนภาพ Multi-stage Funnel แสดง 3 ขั้นตอน Retrieval, Ranking และ Reranking',
        note: 'การกรองแบบกรวย 3 ขั้น: Retrieval (คัดหยาบ 1M เหลือ 1,000 ชิ้น ใน <10ms) → Scoring/Ranking (คัดละเอียดเหลือ 100 ชิ้น ใน 40ms) → Reranking (คัด Top-10 พร้อมคุม Diversity และ Fairness ใน <15ms)',
        badge: 'SVG Production Architecture'
      }
    ],
    'recsys-long-tail': [
      {
        file: 'recsys-long-tail-distribution.svg',
        w: 920, h: 460,
        darkStage: true,
        title: 'The Long Tail Phenomenon: ขุมทรัพย์ที่ซ่อนอยู่ในสินค้าหางยาว',
        alt: 'กราฟการแจกแจงหางยาวแสดงส่วน Head 20% และส่วน Tail 80%',
        note: 'ระบบแนะนำสร้างมูลค่าทางธุรกิจสูงสุดจากการเปิดโอกาสให้สินค้า 80% ในส่วน Tail ได้รับการค้นพบ ซึ่งร้านค้าทั่วไปไม่มีพื้นที่ชั้นวางจัดแสดงเพียงพอ',
        badge: 'SVG Economic Distribution'
      }
    ],
    'recsys-feedback-loop': [
      {
        file: 'feedback-loop-bubble.svg',
        w: 920, h: 480,
        darkStage: true,
        title: 'Feedback Loop & Filter Bubble: กับดักที่ระบบแนะนำขุดขึ้นมาหลอกตัวเอง',
        alt: 'แผนผังวงกลมแสดงวงจรป้อนกลับระหว่างระบบแนะนำ การคลิกของผู้ใช้ และการเกิดฟองสบู่ปิดกั้น',
        note: 'การแนะนำเฉพาะสิ่งที่ผู้ใช้เคยคลิก ทำให้โมเดลเรียนรู้แต่รสนิยมเดิมจนกลายเป็นฟองสบู่ปิดกั้น จึงต้องแทรก Exploration (เช่น ε-Greedy หรือ IPS Reweighting) เพื่อรักษาความหลากหลาย',
        badge: 'SVG System Dynamics'
      }
    ],

    // === Chapter 02: Evaluation ===
    'recsys-metric-map': [
      {
        file: 'infographic-ch2-evaluation.webp',
        w: 1200, h: 1696,
        title: 'Evaluation Framework: แผนที่ตัวชี้วัดและการแบ่งข้อมูลทดสอบ',
        alt: 'แผนผังตัวชี้วัดระบบแนะนำครบวงจร แยกตามเป้าหมายธุรกิจและการแบ่งชุดข้อมูล',
        note: 'กรอบการประเมินผลครบวงจร: แยกวัดความแม่นยำของคะแนน (MAE/RMSE), การจัดอันดับ Top-K (Precision, Recall, nDCG), และมิติความรับผิดชอบ (Coverage, Diversity, Gini)',
        doc: { title: 'Recommender Systems Infographics', path: 'source/Recommending System/เอกสาร_Lecture/Recommender_Systems_Infographics_Chapter_Order.pdf', page: 2 }
      }
    ],
    'recsys-discounted-gain': [
      {
        file: 'ndcg-position-discount.svg',
        w: 920, h: 460,
        darkStage: true,
        title: 'Discounted Cumulative Gain: เส้นโค้งการลดทอนคุณค่าตามอันดับ',
        alt: 'กราฟแท่งและเส้นโค้งแสดงตัวลดทอน 1/log2(i+1) จากอันดับ 1 ถึง 10',
        note: 'ตัวลดทอน 1/log2(rank+1) ทำให้สินค้าตรงใจที่อันดับ 1 มีคุณค่าสูงกว่าอันดับ 10 ถึง 3.4 เท่า สะท้อนพฤติกรรมมนุษย์ที่ไม่ค่อยเลื่อนดูของล่างๆ',
        badge: 'SVG Metric Breakdown'
      }
    ],
    'recsys-coverage-gini': [
      {
        file: 'lorenz-gini-curve.svg',
        w: 920, h: 460,
        darkStage: true,
        title: 'Lorenz Curve & Gini Index: วัดความเหลื่อมล้ำในการแนะนำสินค้า',
        alt: 'เส้นโค้งลอเรนซ์และพื้นที่ A และ B แสดงการคำนวณสัมประสิทธิ์จีนี',
        note: 'เส้นโค้งลอเรนซ์เทียบสัดส่วนสินค้าสะสมกับการได้รับการมองเห็น ค่า Gini ที่สูงสะท้อนว่าระบบกำลังผูกขาดการแนะนำให้แก่สินค้าฮิตเพียงไม่กี่ชิ้น',
        badge: 'SVG Metric Breakdown'
      }
    ],

    // === Chapter 03: Content-Based ===
    'recsys-content-map': [
      {
        file: 'infographic-ch3-content.webp',
        w: 1200, h: 1696,
        title: 'Content-Based Filtering: จากเนื้อหาคุณลักษณะสู่คำแนะนำ',
        alt: 'แผนผังกระบวนการสกัดฟีเจอร์เนื้อหาด้วย Multi-hot, TF-IDF และ BM25',
        note: 'การสกัดคุณลักษณะไอเทมด้วย Multi-hot, TF-IDF และ BM25 เพื่อแปลงข้อมูลเชิงคุณภาพให้เป็นเวกเตอร์เปรียบเทียบความคล้ายคลึง',
        doc: { title: 'Recommender Systems Infographics', path: 'source/Recommending System/เอกสาร_Lecture/Recommender_Systems_Infographics_Chapter_Order.pdf', page: 3 }
      }
    ],
    'recsys-content-profile': [
      {
        file: 'cb-user-profile-flow.svg',
        w: 920, h: 480,
        darkStage: true,
        title: 'Content-Based Profiling: การหลอมรวมเวกเตอร์สินค้าสู่โปรไฟล์ผู้ใช้',
        alt: 'ผังการไหลของข้อมูลจากคะแนนสินค้าสู่เวกเตอร์โปรไฟล์ผู้ใช้และการคำนวณโคไซน์',
        note: 'นำเวกเตอร์สินค้าที่เคยชอบคูณถ่วงน้ำหนักด้วยคะแนนความพอใจ หักลบค่าเฉลี่ยเพื่อกำจัดอคติ แล้วทำ Unit Normalization เพื่อนำไปค้นหาสินค้าใหม่ด้วย Cosine',
        badge: 'SVG Algorithmic Pipeline'
      }
    ],

    // === Chapter 04: Multimodal ===
    'recsys-mm-encoders': [
      {
        file: 'multimodal-encoders-architecture.svg',
        w: 940, h: 480,
        darkStage: true,
        title: 'Multimodal Encoders: สกัดฟีเจอร์จาก 3 สื่อสู่พื้นที่เวกเตอร์ร่วม',
        alt: 'สถาปัตยกรรมเอนโค้ดเดอร์แปลงข้อความ ภาพ และเสียง สู่เวกเตอร์มิติเท่ากัน',
        note: 'แปลงข้อความ (BERT), รูปภาพโปสเตอร์ (ViT Patches) และเสียงตัวอย่าง (AST/CNN) ให้อยู่ในมิติร่วม d=256 เพื่อให้โมเดลแนะนำเข้าใจสินค้าแม้ไม่มีประวัติคนคลิก',
        badge: 'SVG Deep Architecture'
      }
    ],
    'recsys-mm-attention': [
      {
        file: 'attention-qkv-spotlight.svg',
        w: 920, h: 480,
        darkStage: true,
        title: 'Attention Mechanism: ระบบสปอตไลต์ Query ถาม Key แล้วรวม Value',
        alt: 'แผนภาพ Scaled Dot-Product Attention แสดงการทำงานของ Query, Key และ Value',
        note: 'Query (ความต้องการสดของผู้ใช้) ส่องไฟเทียบกับ Key ของแต่ละสื่อ Softmax คำนวณน้ำหนักความสนใจ α เพื่อดึงเฉพาะเนื้อหา Value ที่เกี่ยวข้องมากที่สุด',
        badge: 'SVG Neural Spotlight'
      }
    ],
    'recsys-mm-early': [
      {
        file: 'multimodal-fusion-comparative.svg',
        w: 940, h: 500,
        darkStage: true,
        title: 'Early vs Late vs Intermediate Fusion: เปรียบเทียบ 3 สถาปัตยกรรมรวมสื่อ',
        alt: 'แผนภาพเปรียบเทียบ 3 รูปแบบการรวมสื่อ Early, Late และ Intermediate Fusion',
        note: 'Early Fusion รวมเวกเตอร์ตั้งแต่ต้น, Late Fusion ตัดสินใจแยกห้องแล้วเฉลี่ยคะแนน, ส่วน Intermediate Fusion ใช้ Cross-Attention หลอมรวมภายในเลเยอร์ซ่อน',
        badge: 'SVG Comparative Paradigm'
      }
    ],
    'recsys-mm-late': [
      {
        file: 'multimodal-fusion-comparative.svg',
        w: 940, h: 500,
        darkStage: true,
        title: 'Late Fusion: ให้คะแนนแยกห้องแล้วรวมพลัง (Decision-Level Fusion)',
        alt: 'แผนภาพ Late Fusion แสดงโมเดลแยกแต่ละสื่อส่งคะแนนเข้า Score Blender',
        note: 'ความยืดหยุ่นสูง: แต่ละสื่อมีโมเดลอิสระ หากข้อมูลภาพเสีย โมเดลข้อความยังคงให้คะแนนได้ตามปกติ',
        badge: 'SVG Comparative Paradigm'
      }
    ],
    'recsys-mm-intermediate': [
      {
        file: 'multimodal-fusion-comparative.svg',
        w: 940, h: 500,
        darkStage: true,
        title: 'Intermediate Fusion: การจัดแนวและการสื่อสารข้ามสื่อ (Cross-Attention)',
        alt: 'แผนภาพ Intermediate Fusion แสดงการแลกเปลี่ยนบริบทข้ามเลเยอร์',
        note: 'สถาปัตยกรรม SOTA ที่ให้ข้อความและรูปภาพสื่อสารแลกเปลี่ยนบริบทซึ่งกันและกันผ่าน Cross-Attention บล็อก',
        badge: 'SVG Comparative Paradigm'
      }
    ],

    // === Chapter 05: Collaborative Filtering ===
    'recsys-cf-map': [
      {
        file: 'infographic-ch5-overview.webp',
        w: 1200, h: 1696,
        title: 'Collaborative Filtering Landscape: แผนผังภาพรวมและโมเดลหลัก',
        alt: 'แผนผังเปรียบเทียบ Memory-Based kNN กับ Model-Based Collaborative Filtering',
        note: 'เปรียบเทียบ Memory-Based (User-kNN / Item-kNN) ที่เข้าใจง่ายโปร่งใส กับ Model-Based (MF, SVD++, EASE, NCF) ที่แม่นยำและรองรับสเกลใหญ่',
        doc: { title: 'Recommender Systems Infographics', path: 'source/Recommending System/เอกสาร_Lecture/Recommender_Systems_Infographics_Chapter_Order.pdf', page: 4 }
      }
    ],
    'recsys-cf-user-knn': [
      {
        file: 'cf-01-user-knn.webp',
        w: 1200, h: 1695,
        title: 'User-kNN Recommendation Model: Pearson Correlation และสูตรคำนวณ',
        alt: 'โปสเตอร์สรุปโมเดล User-kNN สูตร Pearson และขั้นตอนคำนวณ',
        note: 'การหาเพื่อนบ้านที่มีรสนิยมใกล้เคียงด้วย Pearson Correlation, การหักลบค่าเฉลี่ยรายบุคคล และการถ่วงน้ำหนักความคล้ายคลึง',
        doc: { title: 'Infographics Chapter 5 CF Techniques', path: 'source/Recommending System/เอกสาร_Lecture/Infographics_Chapter5_CF_Techniques.pdf', page: 1 }
      }
    ],
    'recsys-cf-item-knn': [
      {
        file: 'cf-02-item-knn.webp',
        w: 1200, h: 1695,
        title: 'Item-kNN Recommendation Model: Adjusted Cosine และการจับคู่สินค้า',
        alt: 'โปสเตอร์สรุปโมเดล Item-kNN สูตร Adjusted Cosine และการคำนวณความคล้ายสินค้า',
        note: 'สินค้าเปลี่ยนรสนิยมน้อยกว่าคน: ใช้ Adjusted Cosine หักลบค่าเฉลี่ยผู้ใช้ร่วมกัน ทำให้ผลการคำนวณมีความเสถียรและแคชเก็บไว้ใช้ได้ยาวนาน',
        doc: { title: 'Infographics Chapter 5 CF Techniques', path: 'source/Recommending System/เอกสาร_Lecture/Infographics_Chapter5_CF_Techniques.pdf', page: 2 }
      }
    ],
    'recsys-cf-bias': [
      {
        file: 'cf-03-bias-baseline.webp',
        w: 1200, h: 1695,
        title: 'Baseline Predictor (Bias Model): หักลบอคติผู้ใช้และสินค้า',
        alt: 'โปสเตอร์สรุปสูตร Baseline Predictor mu + bu + bi',
        note: 'สูตรพื้นฐานที่ต้องมี: r̂_ui = μ + b_u + b_i ช่วยแยกความใจดี/ใจร้ายของผู้ใช้ และความฮิตทั่วไปของสินค้าออกจากความชอบที่แท้จริง',
        doc: { title: 'Infographics Chapter 5 CF Techniques', path: 'source/Recommending System/เอกสาร_Lecture/Infographics_Chapter5_CF_Techniques.pdf', page: 3 }
      }
    ],
    'recsys-model-mf': [
      {
        file: 'matrix-factorization-uv.svg',
        w: 920, h: 460,
        darkStage: true,
        title: 'Matrix Factorization: แยกเมทริกซ์คะแนนสู่ปริภูมิเวกเตอร์แฝง',
        alt: 'แผนภาพการแยกเมทริกซ์ R ออกเป็น User Matrix P คูณ Item Matrix Q^T',
        note: 'แยกเมทริกซ์ R (เบาบาง 99%) ออกเป็นผลคูณของ User Matrix P และ Item Matrix Q^T ผ่านมิติแฝง k มิติ (Latent Factors เช่น Action, Indie, Humor)',
        badge: 'SVG Mathematical Decomposition'
      },
      {
        file: 'cf-04-matrix-factorization.webp',
        w: 1200, h: 1695,
        title: 'Matrix Factorization Model: โปสเตอร์สรุปโมเดลการแยกตัวประกอบ',
        alt: 'โปสเตอร์เจาะลึกโมเดล Matrix Factorization จากเอกสารบรรยาย',
        note: 'การบีบอัดเมทริกซ์คะแนน R ให้เป็นเวกเตอร์ผู้ใช้ P และเวกเตอร์สินค้า Q เผยมิติตัวตนที่ซ่อนอยู่ (Latent Space)',
        doc: { title: 'Infographics Chapter 5 CF Techniques', path: 'source/Recommending System/เอกสาร_Lecture/Infographics_Chapter5_CF_Techniques.pdf', page: 4 }
      }
    ],
    'recsys-model-sgd': [
      {
        file: 'cf-05-sgd-optimization.webp',
        w: 1200, h: 1695,
        title: 'SGD Optimization in MF: การปรับน้ำหนักเวกเตอร์ทีละเรตติ้ง',
        alt: 'โปสเตอร์สรุปกระบวนการ Stochastic Gradient Descent สำหรับ Matrix Factorization',
        note: 'คำนวณค่าคลาดเคลื่อน e_ui = r_ui - p_u · q_i แล้วปรับเวกเตอร์ p_u และ q_i ตามทิศทางเกรเดียนต์พร้อม Regularization λ',
        doc: { title: 'Infographics Chapter 5 CF Techniques', path: 'source/Recommending System/เอกสาร_Lecture/Infographics_Chapter5_CF_Techniques.pdf', page: 5 }
      }
    ],
    'recsys-model-als': [
      {
        file: 'cf-06-als-optimization.webp',
        w: 1200, h: 1695,
        title: 'Alternating Least Squares (ALS): สลับตรึงตัวแปรแก้สมการตรง',
        alt: 'โปสเตอร์สรุปอัลกอริทึม Alternating Least Squares ใน Matrix Factorization',
        note: 'สลับตรึง Q แก้ P แล้วตรึง P แก้ Q ในรูป Ridge Regression แบบปิด คำนวณคู่ขนานบนคลัสเตอร์ขนาดใหญ่ได้อย่างมีเสถียรภาพ',
        doc: { title: 'Infographics Chapter 5 CF Techniques', path: 'source/Recommending System/เอกสาร_Lecture/Infographics_Chapter5_CF_Techniques.pdf', page: 6 }
      }
    ],
    'recsys-model-svdpp': [
      {
        file: 'cf-07-svdpp-model.webp',
        w: 1200, h: 1695,
        title: 'SVD++ Model: รวมหลักฐานพฤติกรรมทางอ้อม (Implicit Feedback)',
        alt: 'โปสเตอร์สรุปโมเดล SVD++ เสริมเวกเตอร์ y_j จากประวัติสินค้าที่เคยเปิดดู',
        note: 'เสริมเวกเตอร์ y_j จากสินค้าที่ผู้ใช้เคยคลิกหรือดูเข้าสู่โปรไฟล์ผู้ใช้ แม้ผู้ใช้จะไม่เคยกดให้ดาวเลยก็ตาม',
        doc: { title: 'Infographics Chapter 5 CF Techniques', path: 'source/Recommending System/เอกสาร_Lecture/Infographics_Chapter5_CF_Techniques.pdf', page: 7 }
      }
    ],
    'recsys-model-wrmf': [
      {
        file: 'cf-08-wrmf-implicit.webp',
        w: 1200, h: 1695,
        title: 'WRMF: เมทริกซ์แฟกทอไรเซชันแบบถ่วงน้ำหนักความมั่นใจ',
        alt: 'โปสเตอร์สรุปโมเดล Weighted Regularized Matrix Factorization สำหรับ Implicit Data',
        note: 'เปลี่ยนเรตติ้ง implicit เป็นความมั่นใจ c_ui = 1 + α · r_ui และ preference p_ui ∈ {0, 1} เพื่อจัดการข้อมูลที่ไม่มีคะแนนดาวลบ',
        doc: { title: 'Infographics Chapter 5 CF Techniques', path: 'source/Recommending System/เอกสาร_Lecture/Infographics_Chapter5_CF_Techniques.pdf', page: 8 }
      }
    ],
    'recsys-model-bpr': [
      {
        file: 'cf-09-bpr-ranking.webp',
        w: 1200, h: 1695,
        title: 'Bayesian Personalized Ranking (BPR): การเรียนรู้แบบประชันคู่ Triplet',
        alt: 'โปสเตอร์สรุปโมเดล BPR และการใช้ Triplet Loss',
        note: 'ปรับปรุงอันดับโดยตรงด้วย Triplet (u, i, j): ผลักคะแนนสินค้าชอบ (i) ให้สูงกว่าสินค้าที่ไม่เคยโต้ตอบ (j) ผ่าน Sigmoid Loss',
        doc: { title: 'Infographics Chapter 5 CF Techniques', path: 'source/Recommending System/เอกสาร_Lecture/Infographics_Chapter5_CF_Techniques.pdf', page: 9 }
      }
    ],
    'recsys-model-ease': [
      {
        file: 'cf-10-ease-autoencoder.webp',
        w: 1200, h: 1695,
        title: 'EASE: ออโตเอนโค้ดเดอร์แบบตื้น ไร้ชั้นซ่อน',
        alt: 'โปสเตอร์สรุปโมเดล EASE Autoencoder และเงื่อนไข Diagonal Zero',
        note: 'เมทริกซ์น้ำหนัก B ระหว่างสินค้าที่บังคับเส้นทแยงมุม diag(B)=0 แก้สมการตรงด้วยเมทริกซ์ผกผัน Gram Matrix ในรอบเดียว',
        doc: { title: 'Infographics Chapter 5 CF Techniques', path: 'source/Recommending System/เอกสาร_Lecture/Infographics_Chapter5_CF_Techniques.pdf', page: 10 }
      }
    ],
    'recsys-model-review': [
      {
        file: 'cf-11-ncf-deep-learning.webp',
        w: 1200, h: 1695,
        title: 'Neural Collaborative Filtering (NCF): ผสาน GMF และ MLP',
        alt: 'โปสเตอร์สรุปสถาปัตยกรรม Neural Collaborative Filtering',
        note: 'โครงสร้าง 2 สายขนาน: GMF จับ Linear Interaction ผ่าน Element-wise Product และ MLP เรียนรู้ Non-linear Interaction ระดับลึก',
        doc: { title: 'Infographics Chapter 5 CF Techniques', path: 'source/Recommending System/เอกสาร_Lecture/Infographics_Chapter5_CF_Techniques.pdf', page: 11 }
      }
    ],

    // === Chapter 06: Hybrid Systems ===
    'recsys-hy-map': [
      {
        file: 'infographic-ch6-hybrid.webp',
        w: 1200, h: 1696,
        title: 'Hybrid Recommendation Systems: แผนผังจำแนกสถาปัตยกรรมลูกผสม',
        alt: 'แผนผังจำแนกสถาปัตยกรรมลูกผสม 7 แบบของ Burke และโมเดลยุคใหม่',
        note: 'ภาพรวม 7 สถาปัตยกรรมคลาสสิกของ Robin Burke ควบคู่กับ Hybrid ยุคใหม่ระดับโมเดล (LightFM, Two-Tower)',
        doc: { title: 'Recommender Systems Infographics', path: 'source/Recommending System/เอกสาร_Lecture/Recommender_Systems_Infographics_Chapter_Order.pdf', page: 5 }
      }
    ],
    'recsys-hy-weighted': [
      {
        file: 'hy-01-burke-weighted.webp',
        w: 1200, h: 1697,
        title: 'Weighted Hybrid: การรวมคะแนนเชิงเส้นถ่วงน้ำหนัก',
        alt: 'โปสเตอร์สรุปสถาปัตยกรรม Weighted Hybrid ของ Burke',
        note: 'ปรับสเกลคะแนนจากแต่ละโมเดลให้อยู่ในช่วงมาตรฐานเดียวกัน แล้วรวมคะแนนด้วยสูตร S(u, i) = w_cf · S_cf + w_cb · S_cb',
        doc: { title: 'Infographics Chapter 6 Hybrid', path: 'source/Recommending System/เอกสาร_Lecture/Infographics_Chapter6_Hybrid Recommendation Techniques_v2.pdf', page: 1 }
      }
    ],
    'recsys-hy-switch': [
      {
        file: 'hy-02-burke-switching.webp',
        w: 1200, h: 1697,
        title: 'Switching Hybrid: สลับเครื่องยนต์ตามเงื่อนไขและบริบท',
        alt: 'โปสเตอร์สรุปสถาปัตยกรรม Switching Hybrid ของ Burke',
        note: 'ใช้ตรรกะเงื่อนไข: หากผู้ใช้ใหม่ประวัติ < 5 ครั้ง ให้สลับใช้ Content-Based หากข้อมูลพอแล้วให้สลับใช้ Collaborative Filtering',
        doc: { title: 'Infographics Chapter 6 Hybrid', path: 'source/Recommending System/เอกสาร_Lecture/Infographics_Chapter6_Hybrid Recommendation Techniques_v2.pdf', page: 2 }
      }
    ],
    'recsys-hy-mixed': [
      {
        file: 'hy-03-burke-mixed.webp',
        w: 1200, h: 1697,
        title: 'Mixed Hybrid: นำผลลัพธ์จากหลายโมเดลมาแสดงผลเคียงข้างกัน',
        alt: 'โปสเตอร์สรุปสถาปัตยกรรม Mixed Hybrid ของ Burke',
        note: 'นำเสนอคำแนะนำคนละหมวดบนหน้าจอพร้อมกัน เช่น แถวที่ 1 "เพราะคุณเคยดู..." (CB) และแถวที่ 2 "ผู้ใช้ที่คล้ายคุณชอบ..." (CF)',
        doc: { title: 'Infographics Chapter 6 Hybrid', path: 'source/Recommending System/เอกสาร_Lecture/Infographics_Chapter6_Hybrid Recommendation Techniques_v2.pdf', page: 3 }
      }
    ],
    'recsys-hy-combination': [
      {
        file: 'hy-04-burke-combination.webp',
        w: 1200, h: 1697,
        title: 'Feature Combination: รวมฟีเจอร์หลายประเภทเป็นเวกเตอร์เดี่ยว',
        alt: 'โปสเตอร์สรุปสถาปัตยกรรม Feature Combination ของ Burke',
        note: 'นำฟีเจอร์ความร่วมมือ (CF tokens) และฟีเจอร์เนื้อหา (CB metadata) มาต่อกันเป็นเวกเตอร์ฟีเจอร์ขนาดใหญ่ป้อนเข้าโมเดลเดียว',
        doc: { title: 'Infographics Chapter 6 Hybrid', path: 'source/Recommending System/เอกสาร_Lecture/Infographics_Chapter6_Hybrid Recommendation Techniques_v2.pdf', page: 4 }
      }
    ],
    'recsys-hy-augmentation': [
      {
        file: 'hy-05-burke-augmentation.webp',
        w: 1200, h: 1697,
        title: 'Feature Augmentation: โมเดลต้นทางสร้างฟีเจอร์ส่งต่อโมเดลถัดไป',
        alt: 'โปสเตอร์สรุปสถาปัตยกรรม Feature Augmentation ของ Burke',
        note: 'ใช้โมเดลแรกทำนายคะแนนหรือสร้าง Embedding แล้วส่งค่าตัวเลขนั้นเป็นอินพุตฟีเจอร์เพิ่มเติมให้โมเดลที่สองนำไปตัดสินใจ',
        doc: { title: 'Infographics Chapter 6 Hybrid', path: 'source/Recommending System/เอกสาร_Lecture/Infographics_Chapter6_Hybrid Recommendation Techniques_v2.pdf', page: 5 }
      }
    ],
    'recsys-hy-cascade': [
      {
        file: 'hy-06-burke-cascade.webp',
        w: 1200, h: 1697,
        title: 'Cascade Hybrid: กรองหยาบสู่การจัดอันดับละเอียด',
        alt: 'โปสเตอร์สรุปสถาปัตยกรรม Cascade Hybrid ของ Burke',
        note: 'โมเดลแรกคัดกรองผู้สมัครจำนวนมากอย่างรวดเร็ว แล้วส่งรายการที่เหลือให้โมเดลที่สองจัดอันดับอย่างละเอียด ป้องกันการคำนวณซ้ำซ้อน',
        doc: { title: 'Infographics Chapter 6 Hybrid', path: 'source/Recommending System/เอกสาร_Lecture/Infographics_Chapter6_Hybrid Recommendation Techniques_v2.pdf', page: 6 }
      }
    ],
    'recsys-hy-meta': [
      {
        file: 'hy-07-burke-meta.webp',
        w: 1200, h: 1697,
        title: 'Meta-Level Hybrid: โมเดลหนึ่งเทรนเพื่อสร้างโมเดลให้อีกตัว',
        alt: 'โปสเตอร์สรุปสถาปัตยกรรม Meta-Level Hybrid ของ Burke',
        note: 'โมเดลแรกประมวลผลข้อมูลดิบเพื่อสร้างโมเดลตัวแทน (Learned Model/Profile) แล้วโมเดลที่สองนำโมเดลตัวแทนนั้นไปใช้ทำนายผล',
        doc: { title: 'Infographics Chapter 6 Hybrid', path: 'source/Recommending System/เอกสาร_Lecture/Infographics_Chapter6_Hybrid Recommendation Techniques_v2.pdf', page: 7 }
      }
    ],
    'recsys-hy-graph': [
      {
        file: 'lightgcn-message-passing.svg',
        w: 920, h: 460,
        darkStage: true,
        title: 'LightGCN: กราฟคอนโวลูชันแบบตัดน้ำหนักส่วนเกิน',
        alt: 'แผนภาพ User-Item Bipartite Graph แสดงการส่งต่อ Message Passing ข้ามเพื่อนบ้าน',
        note: 'โครงข่ายกราฟที่ส่งต่อเวกเตอร์แฝงระหว่างผู้ใช้และสินค้าผ่านเส้นเชื่อม ช่วยแก้ปัญหาข้อมูลเบาบางด้วยการดึงข้อมูลจากเพื่อนบ้านหลายขั้น (Multi-hop)',
        badge: 'SVG Graph Neural Architecture'
      }
    ],
    'recsys-hy-tower': [
      {
        file: 'two-tower-retrieval-architecture.svg',
        w: 940, h: 500,
        darkStage: true,
        title: 'Two-Tower Dual Encoder: สถาปัตยกรรมสองหอคอยเพื่อการค้นคืนความเร็วสูง',
        alt: 'สถาปัตยกรรม Two-Tower แยก User Tower และ Item Tower พร้อมระบบ MIPS Vector Search',
        note: 'แยก User Tower และ Item Tower อย่างอิสระ เวกเตอร์สินค้าคำนวณออฟไลน์และแคชใน FAISS/HNSW ส่วน User Tower คำนวณสดและค้นหาแบบ MIPS ใน <5ms',
        badge: 'SVG Production Architecture'
      }
    ],

    // === Chapter 07: LLM & Generative RecSys ===
    'recsys-llm-iceberg': [
      {
        file: 'infographic-ch7-llm.webp',
        w: 1200, h: 1696,
        title: 'LLM & Generative RecSys: เติมเต็ม 4 ช่องว่างที่โมเดลยุคเดิมทำไม่ได้',
        alt: 'แผนผังภูเขาน้ำแข็งแสดงส่วนที่ LLM เติมเต็มในระบบแนะนำ',
        note: 'โมเดลภาษาขนาดใหญ่ช่วยแก้ปัญหา Cold Start ด้วยการทำความเข้าใจความหมายเชิงลึก (Semantics), ให้เหตุผลประกอบคำแนะนำ (Explainability) และรองรับการสนทนาโต้ตอบ',
        doc: { title: 'Recommender Systems Infographics', path: 'source/Recommending System/เอกสาร_Lecture/Recommender_Systems_Infographics_Chapter_Order.pdf', page: 6 }
      }
    ],
    'recsys-llm-pipeline': [
      {
        file: 'infographic-ch7-llm.webp',
        w: 1200, h: 1696,
        title: 'The 7-Step LLM Architecture & Code vs Prompt Separation',
        alt: 'สถาปัตยกรรม 7 ขั้นของ LLM RecSys และการแยกโค้ดออกจากพรอมต์',
        note: 'กฎเหล็กวิศวกรรม: LLM ถูกเรียกใช้เฉพาะในขั้นตอนที่ 4 (Reranking/Reasoning) ไม่นำไปใช้ค้นคืนจากคลัง 1,000,000 ชิ้นโดยตรงเพื่อคุม Latency และต้นทุน Token',
        doc: { title: 'Recommender Systems Infographics', path: 'source/Recommending System/เอกสาร_Lecture/Recommender_Systems_Infographics_Chapter_Order.pdf', page: 6 }
      }
    ],
    'recsys-llm-prompting': [
      {
        file: 'llm-prompting-strategies.svg',
        w: 940, h: 480,
        darkStage: true,
        title: 'LLM Prompting Strategies: Pointwise vs Pairwise vs Listwise',
        alt: 'แผนภาพเปรียบเทียบ 3 รูปแบบการจัดวาง Prompt สำหรับ LLM RecSys',
        note: 'Pointwise ให้คะแนนทีละชิ้น (ขนานง่าย), Pairwise ประชันทีละคู่ (แม่นแต่แพง O(N^2)), และ Listwise เรียงทั้งแผง Top-10 (เห็นบริบทครบในคอลเดียว)',
        badge: 'SVG Prompting Paradigms'
      }
    ],
    'recsys-llm-generative': [
      {
        file: 'generative-recsys-trie-decoding.svg',
        w: 920, h: 460,
        darkStage: true,
        title: 'Generative RecSys: การสร้าง Semantic IDs และ Trie Constrained Decoding',
        alt: 'แผนภาพ Trie Prefix Tree สำหรับ Constrained Decoding ใน Generative RecSys',
        note: 'ป้องกันปัญหาภาพหลอน (Hallucination) ด้วยการบังคับให้ LLM เจเนอเรตโทเค็นผ่านโครงสร้างต้นไม้พรีฟิกซ์ (Trie) ที่รับประกันว่ารหัสสินค้ามีอยู่จริงในคลัง 100%',
        badge: 'SVG Generative Decoding'
      }
    ],

    // === Chapter 08: Responsible RecSys ===
    'recsys-resp-overview': [
      {
        file: 'infographic-ch8-responsible.webp',
        w: 1200, h: 1696,
        title: 'Responsible Recommender Systems: วงจร 4 ขั้นและความเป็นธรรม 2 ฝั่ง',
        alt: 'แผนผัง Responsible RecSys แสดง C-Fairness, P-Fairness และวงจรการกำกับดูแล',
        note: 'กรอบการกำกับดูแล: C-Fairness (ผู้บริโภคไม่ถูกครอบงำด้วยอคติ) และ P-Fairness (ผู้ผลิต/ร้านค้ารายย่อยได้รับโอกาสแสดงผลอย่างเป็นธรรม)',
        doc: { title: 'Recommender Systems Infographics', path: 'source/Recommending System/เอกสาร_Lecture/Recommender_Systems_Infographics_Chapter_Order.pdf', page: 7 }
      }
    ],
    'recsys-resp-mitigation': [
      {
        file: 'responsible-mitigation-stages.svg',
        w: 920, h: 460,
        darkStage: true,
        title: 'จุดแทรกแซงความเป็นธรรม 3 ช่วงในสายพานข้อมูล (Pre, In, Post-processing)',
        alt: 'แผนภาพ 3 จุดแทรกแซง Pre-processing, In-processing และ Post-processing',
        note: 'Pre-processing ปรับสมดุลข้อมูลด้วย IPS, In-processing เพิ่มโทษอคติใน Loss ฟังก์ชัน, และ Post-processing ปรับอันดับ Top-K ด้วย MMR หรือ FA*IR',
        badge: 'SVG Fairness Interventions'
      }
    ],

    // === Chapter 09: Capstone Synthesis ===
    'recsys-capstone-matrix': [
      {
        file: 'infographic-ch9-capstone-synthesis.webp',
        w: 1200, h: 1696,
        title: 'Pre-Exam Synthesis & Model Decision Matrix: ผังเชื่อมโยงก่อนสอบ',
        alt: 'โปสเตอร์ใหญ่สังเคราะห์วิธีเลือกโมเดลระบบแนะนำตามโจทย์และข้อจำกัด',
        note: 'ตารางตัดสินใจเลือกระบบแนะนำตามประเภทข้อมูล (Explicit/Implicit/Text/Image/Graph), ระดับ Latency ที่ยอมรับได้ และความพร้อมของข้อมูลผู้ใช้ใหม่',
        doc: { title: 'Recommender Systems Infographics', path: 'source/Recommending System/เอกสาร_Lecture/Recommender_Systems_Infographics_Chapter_Order.pdf', page: 8 }
      }
    ],
    'recsys-capstone-pipeline': [
      {
        file: 'production-recsys-end-to-end.svg',
        w: 940, h: 500,
        darkStage: true,
        title: 'End-to-End Production Recommender System: สถาปัตยกรรมสังเคราะห์ใหญ่',
        alt: 'แผนภาพสถาปัตยกรรมระบบแนะนำระดับ Production ครบวงจร 10 บทเรียน',
        note: 'ภาพรวมระบบแนะนำระดับ Production ครบวงจร: ถ่ายทอดความรู้ทั้ง 10 บทเรียน ตั้งแต่ Feature Store, Two-Tower Retrieval, Deep Ranking, Reranking สู่ A/B Testing',
        badge: 'SVG End-to-End Synthesis'
      }
    ],
  
    // --- Additional figures integrated from Summary & curriculum ---
    'recsys-vectors': [
      {
        file: 'vector-cosine-similarity.svg',
        w: 920, h: 500,
        darkStage: true,
        title: 'Vector Space Representation: การแปลงรสนิยมเป็นเวกเตอร์และมิติพิกัด',
        alt: 'แผนภาพเวกเตอร์แสดงพิกัดและการวัดทิศทางใน Vector Space',
        note: 'การแทนข้อมูลผู้ใช้และสินค้าในรูปเวกเตอร์หลายมิติ (Embeddings) ทำให้เราสามารถคำนวณระยะทางและความคล้ายคลึงของรสนิยมได้ด้วยคณิตศาสตร์เชิงเส้น',
        badge: 'Vector Geometry'
      }
    ],
    'recsys-purpose': [
      {
        file: 'recsys-funnel-pipeline.svg',
        w: 940, h: 520,
        darkStage: true,
        title: 'Search vs Recommendation: การทำงานแบบดึงข้อมูล (Pull) ปะทะ ผลักข้อมูล (Push)',
        alt: 'แผนผังเปรียบเทียบสถาปัตยกรรมสายพานและการประมวลผลคำขอ',
        note: 'ระบบค้นหาเริ่มจากผู้ใช้ส่ง Explicit Query เข้ามา ส่วนระบบแนะนำขับเคลื่อนด้วยบริบทและประวัติในอดีต (User History) เพื่อผลักดันไอเทมที่ตรงใจที่สุด',
        badge: 'System Architecture'
      }
    ],
    'recsys-cold-start': [
      {
        file: 'cb-user-profile-flow.svg',
        w: 920, h: 480,
        darkStage: true,
        title: 'Cold-Start Solutions: การแก้ปัญหาผู้ใช้ใหม่และไอเทมใหม่ด้วย Content Profiles',
        alt: 'แผนภาพการสร้าง User Profile จากคุณลักษณะของสินค้าโดยไม่ต้องพึ่งประวัติปฏิสัมพันธ์เดิม',
        note: 'สำหรับ New Item และ New User ที่ไม่มีข้อมูลประวัติเดิม การสกัด Feature เวกเตอร์เนื้อหา (Content-Based) และ Onboarding Survey เป็นด่านแรกในการแก้ปัญหา Cold-Start',
        badge: 'Cold-Start Strategy'
      }
    ],
    'recsys-diversity-novelty': [
      {
        file: 'recsys-long-tail-distribution.svg',
        w: 920, h: 460,
        darkStage: true,
        title: 'Measuring Diversity & Novelty: การขยายขอบเขตการแนะนำสู่สินค้าหางยาว',
        alt: 'กราฟหางยาวแสดงการดันสินค้าในส่วน Torso และ Long-Tail เพื่อเพิ่มความแปลกใหม่',
        note: 'การวัดผลระบบที่ดีต้องไม่จำกัดแค่ความแม่นยำ (Accuracy) แต่ต้องวัดความหลากหลาย (Diversity) และความแปลกใหม่ (Novelty) เพื่อป้องกันความจำเจของผู้ใช้',
        badge: 'Evaluation Metrics'
      }
    ],
    'recsys-content-cosine': [
      {
        file: 'vector-cosine-similarity.svg',
        w: 920, h: 500,
        darkStage: true,
        title: 'Cosine Similarity in Content Matching: การเปรียบเทียบเวกเตอร์เนื้อหาไอเทม',
        alt: 'แผนภาพเวกเตอร์แสดงการคำนวณมุมโคไซน์ระหว่างเอกสารหรือไอเทมในพื้นที่เวกเตอร์',
        note: 'สูตร Cosine Similarity ใช้ตัดอิทธิพลความยาวของเนื้อหา (Document Length) เพื่อเทียบเฉพาะความสอดคล้องของหัวข้อระหว่าง User Profile และ Item Profile',
        badge: 'Content Matching'
      }
    ],
    'recsys-content-retrieval': [
      {
        file: 'two-tower-retrieval-architecture.svg',
        w: 960, h: 540,
        darkStage: true,
        title: 'Dense Retrieval via Two-Tower: สายพานคัดกรองเนื้อหาความเร็วสูงระดับมิลลิวินาที',
        alt: 'แผนผังสถาปัตยกรรม Two-Tower DSSM แยกหอคอย User และ Item สำหรับค้นหาไอเทมด้วยเวกเตอร์',
        note: 'การใช้ Two-Tower Neural Encoders สกัดเวกเตอร์ฝั่ง User และ Item ล่วงหน้า ทำให้สามารถค้นคืน Candidate นับล้านชิ้นด้วย ANN Vector Search ภายในไม่กี่มิลลิวินาที',
        badge: 'Neural Retrieval'
      }
    ],
    'recsys-mm-map': [
      {
        file: 'multimodal-encoders-architecture.svg',
        w: 940, h: 520,
        darkStage: true,
        title: 'Multimodal Representation Map: การสกัดและหลอมรวมข้อมูลหลายสื่อในระบบแนะนำ',
        alt: 'แผนผังแสดงการแปลงภาพ ข้อความ และเสียง เป็น Embedding Vector เพื่อนำมารวมกัน',
        note: 'ระบบแนะนำยุคใหม่ใช้โมเดล Deep Learning หลายสาขา (Vision Transformer, Text Transformer) ในการทำความเข้าใจบริบทของสินค้าแบบรอบด้าน',
        badge: 'Multimodal Architecture'
      }
    ],
    'recsys-model-map': [
      {
        file: 'matrix-factorization-uv.svg',
        w: 920, h: 480,
        darkStage: true,
        title: 'Model-Based Collaborative Filtering: การลดรูปเมทริกซ์สู่ Latent Factor Space',
        alt: 'แผนภาพแยกตัวประกอบ Rating Matrix ออกเป็น User Matrix U และ Item Matrix V',
        note: 'โมเดลจำพวก Matrix Factorization (Funk SVD, ALS) ทำหน้าที่บีบอัดเมทริกซ์คะแนนขนาดใหญ่ที่มีความเบาบาง ให้กลายเป็นเวกเตอร์ตัวแทนมิติแฝงที่เรียนรู้พฤติกรรมอัตโนมัติ',
        badge: 'Matrix Decomposition'
      }
    ],
    'recsys-hy-review': [
      {
        file: 'hy-08-model-summary.webp',
        w: 1200, h: 1696,
        title: 'Burke Hybrid Taxonomy Summary: ตารางสรุป 7 รูปแบบการผสมผสานระบบแนะนำ',
        alt: 'ตารางสรุปเปรียบเทียบข้อดีและข้อจำกัดของระบบผสม 7 รูปแบบตามทฤษฎีของ Robin Burke',
        note: 'คู่มือเลือกใช้ Hybrid RecSys: Weighted, Switching, Mixed, Feature-Combining, Cascade, Feature-Augmenting, และ Meta-Level',
        badge: 'Taxonomy Synthesis'
      }
    ],
    'recsys-resp-popularity': [
      {
        file: 'feedback-loop-bubble.svg',
        w: 920, h: 480,
        darkStage: true,
        title: 'Popularity Bias Dynamics: วงจรสะท้อนกลับที่ส่งผลให้สินค้ากลุ่มน้อยถูกลืม',
        alt: 'ไดอะแกรมวงจรความนิยมและผลกระทบต่อ Exposure Inequality',
        note: 'เมื่อระบบแนะนำแต่ของดัง ข้อมูลคลิกของดังก็ยิ่งเพิ่มขึ้นจนกลืนสินค้าคุณภาพดีในกลุ่มหางยาว การเข้าใจวงจรนี้คือกุญแจสำคัญสู่ระบบแนะนำที่เป็นธรรม',
        badge: 'Popularity Bias'
      }
    ],
    'recsys-resp-metrics': [
      {
        file: 'lorenz-gini-curve.svg',
        w: 920, h: 460,
        darkStage: true,
        title: 'Equity Metrics: เส้นโค้ง Lorenz และค่า Gini สำหรับวัดความเหลื่อมล้ำในการแสดงสินค้า',
        alt: 'กราฟ Lorenz Curve แสดงสัดส่วนการมองเห็นของสินค้าและพื้นที่คำนวณสัมประสิทธิ์ Gini',
        note: 'Gini Coefficient และ Lorenz Curve เป็นเครื่องมือมาตรฐานในการตรวจสอบว่าพื้นที่หน้าจอ (Screen Exposure) ถูกกระจายอย่างเป็นธรรม หรือผูกขาดโดยผู้ขายรายใหญ่เพียงไม่กี่ราย',
        badge: 'Fairness Metrics'
      }
    ],
    'recsys-capstone-pitfalls': [
      {
        file: 'ndcg-position-discount.svg',
        w: 920, h: 460,
        darkStage: true,
        title: 'Evaluation Pitfalls: จุดพลาดในการประเมินผลและการให้น้ำหนักอันดับ Top-K',
        alt: 'กราฟลดทอนอันดับของ nDCG แสดงให้เห็นว่าความผิดพลาดในอันดับ 1-3 มีผลกระทบต่อประสบการณ์ผู้ใช้รุนแรงกว่าอันดับท้ายๆ',
        note: 'ข้อสอบและงานจริงมักดักเรื่อง Position Bias และการเลือก Metric ผิดประเภท เช่น การใช้ RMSE วัดระบบจัดอันดับ Top-K ซึ่งเป็นการวัดผิดมิติ',
        badge: 'Exam Pitfalls'
      }
    ],
};

  window.RECSYS_FIGURES = RECSYS_FIGURES;

  // --- Lightbox Modal Controller ---
  let figModal = null;
  let figModalTitle = null;
  let figModalImg = null;
  let figModalCaption = null;
  let figModalExternal = null;
  let figModalClose = null;
  let figReturnFocus = null;

  function initFigureModal() {
    if (document.getElementById('recsysFigModal')) return;

    figModal = document.createElement('div');
    figModal.id = 'recsysFigModal';
    figModal.className = 'pdf-modal recsys-img-modal';
    figModal.setAttribute('role', 'dialog');
    figModal.setAttribute('aria-modal', 'true');
    figModal.setAttribute('aria-hidden', 'true');
    figModal.setAttribute('aria-labelledby', 'figModalTitle');

    figModal.innerHTML = `
      <article class="pdf-dialog recsys-img-dialog">
        <header class="pdf-head">
          <div class="pdf-title-wrap">
            <span class="pdf-eyebrow">RecSys Figure Zoom</span>
            <strong class="pdf-title" id="figModalTitle">แผนภาพประกอบบทเรียน</strong>
          </div>
          <div class="pdf-actions">
            <a class="pdf-external" id="figModalExternal" rel="noreferrer" target="_blank">เปิดภาพเต็ม ↗</a>
            <button aria-label="ปิดภาพขยาย" class="pdf-close" id="figModalClose" type="button">×</button>
          </div>
        </header>
        <div class="recsys-img-stage-wrap">
          <img id="figModalImg" src="" alt="" loading="lazy">
          <p class="recsys-img-caption" id="figModalCaption"></p>
        </div>
      </article>
    `;

    document.body.appendChild(figModal);

    figModalTitle = document.getElementById('figModalTitle');
    figModalImg = document.getElementById('figModalImg');
    figModalCaption = document.getElementById('figModalCaption');
    figModalExternal = document.getElementById('figModalExternal');
    figModalClose = document.getElementById('figModalClose');

    function closeModal() {
      if (!figModal.classList.contains('open')) return;
      figModal.classList.remove('open');
      figModal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('pdf-open');
      figModalImg.removeAttribute('src');
      figReturnFocus?.focus?.();
    }

    figModalClose.onclick = closeModal;
    figModal.onclick = function(e) {
      if (e.target === figModal) closeModal();
    };
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && figModal.classList.contains('open')) {
        closeModal();
      }
    });
  }

  function openFigureModal(spec, triggerEl) {
    initFigureModal();
    figReturnFocus = triggerEl || document.activeElement;
    figModalTitle.textContent = spec.title || 'แผนภาพประกอบบทเรียน';
    const srcPath = 'public/images/recsys/' + spec.file;
    figModalImg.src = srcPath;
    figModalImg.alt = spec.alt || spec.title;
    figModalCaption.textContent = spec.note || '';
    figModalExternal.href = srcPath;

    figModal.classList.add('open');
    figModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('pdf-open');
    setTimeout(() => figModalClose.focus(), 30);
  }

  window.openRecsysFigureModal = openFigureModal;

  // --- Figure Renderer for Lessons ---
  function createFigureElement(spec) {
    const figure = document.createElement('figure');
    figure.className = 'edu-figure recsys-figure' + (spec.darkStage ? ' dark-stage' : '');
    figure.setAttribute('tabindex', '0');
    figure.setAttribute('role', 'button');
    figure.setAttribute('aria-label', `คลิกเพื่อขยายดูภาพละเอียด: ${spec.title}`);

    let creditHtml = '';
    if (spec.doc) {
      creditHtml = `<span class="figure-credit">ภาพจากเอกสารเรียน: <a href="${spec.doc.path}#page=${spec.doc.page}" target="_blank" rel="noreferrer">${spec.doc.title} · หน้า ${spec.doc.page} ↗</a></span>`;
    } else if (spec.badge) {
      creditHtml = `<span class="figure-credit"><span class="recsys-badge-tag">${spec.badge}</span></span>`;
    }

    figure.innerHTML = `
      <div class="image-stage">
        <span class="zoom-hint">🔍 คลิกเพื่อดูภาพขยาย</span>
        <img src="public/images/recsys/${spec.file}" 
             alt="${spec.alt || spec.title}" 
             width="${spec.w || 900}" 
             height="${spec.h || 520}" 
             loading="lazy">
      </div>
      <figcaption>
        <span>
          <strong>${spec.title}</strong>
          ${spec.note || ''}
        </span>
        ${creditHtml}
      </figcaption>
    `;

    figure.addEventListener('click', function(e) {
      if (e.target.closest('a')) return; // allow clicking doc link without triggering modal
      openFigureModal(spec, figure);
    });

    figure.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openFigureModal(spec, figure);
      }
    });

    return figure;
  }

  function installRecsysFigures(container) {
    initFigureModal();
    const root = container || document.getElementById('subject-recsys') || document;
    const lessons = root.querySelectorAll('.rs-lesson');
    
    lessons.forEach(lessonNode => {
      const lessonId = lessonNode.id;
      const figureSpecs = RECSYS_FIGURES[lessonId];
      if (!figureSpecs || !figureSpecs.length) return;
      if (lessonNode.querySelector('.recsys-figure-grid')) return; // already installed

      const prose = lessonNode.querySelector('.rs-lesson-content');
      if (!prose) return;

      const grid = document.createElement('div');
      grid.className = 'recsys-figure-grid';

      figureSpecs.forEach(spec => {
        grid.appendChild(createFigureElement(spec));
      });

      // Insert strategically:
      // Prefer inserting after .easy-explain (so learner reads the intuitive story first, then views figure)
      // Otherwise insert before the first table or pipeline, or prepend to prose.
      const easyExplain = prose.querySelector(':scope>.easy-explain');
      const firstTable = prose.querySelector(':scope>table, :scope>.table-wrap');
      const firstPipeline = prose.querySelector(':scope>.pipeline-diagram, :scope>.diagram');

      if (easyExplain) {
        easyExplain.after(grid);
      } else if (firstTable) {
        firstTable.before(grid);
      } else if (firstPipeline) {
        firstPipeline.before(grid);
      } else {
        prose.prepend(grid);
      }
    });
  }

  window.installRecsysFigures = installRecsysFigures;

  // Auto-run when DOM is ready or observe subject-recsys
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => installRecsysFigures());
    } else {
      setTimeout(() => installRecsysFigures(), 50);
    }

    if (typeof MutationObserver !== 'undefined') {
      const obs = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (m.addedNodes.length) {
            const recsysRoot = document.getElementById('subject-recsys');
            if (recsysRoot) {
              installRecsysFigures(recsysRoot);
              break;
            }
          }
        }
      });
      obs.observe(document.documentElement, { childList: true, subtree: true });
    }
  }

})();
