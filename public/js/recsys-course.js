/* Nested chapter/lesson renderer. Storage and reset are isolated from legacy subjects. */
(() => {
  'use strict';
  const ANSWERS_KEY = 'csExamRecsysChoicesV1';
  const OPEN_KEY = 'csExamRecsysOpenV1';
  const registry = new Map();
  const players = new Map();
  let root, answers = {}, openState = {}, activeChapterId = 'recsys-foundations';
  const CHAPTER_KEY = 'recsys_active_chapter';
  const read = key => { try { const value = JSON.parse(localStorage.getItem(key) || '{}'); return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; } catch { return {}; } };
  const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { if (root) root.querySelector('.rs-storage-note').textContent = 'Browser นี้บันทึกความคืบหน้าไม่ได้ คำตอบยังอยู่ในหน้านี้จนกว่าจะปิด'; return false; } };
  const make = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
  const validAnswer = q => { const a = answers[q.id]; return a && a.version === q.version && Number.isInteger(a.selected) && a.selected >= 0 && a.selected < q.choices.length ? a : null; };
  const allQuestions = () => [...registry.values()].flatMap(entry => entry.lesson.questions);
  function updateProgress() {
    let chaptersComplete = 0;
    for (const entry of registry.values()) {
      const done = entry.lesson.questions.filter(q => validAnswer(q)).length;
      const correct = entry.lesson.questions.filter(q => validAnswer(q)?.selected === q.answer).length;
      const complete = correct === entry.lesson.questions.length && correct > 0;
      entry.section.classList.toggle('complete', complete);
      entry.section.classList.toggle('rs-reviewed', done === entry.lesson.questions.length && !complete);
      entry.count.textContent = `${correct}/${entry.lesson.questions.length}`;
      entry.dot.textContent = complete ? '✓' : '';
      entry.toggle.setAttribute('aria-label', `${entry.lesson.number} ${entry.lesson.title}: ตอบแล้ว ${done} ถูก ${correct} จาก ${entry.lesson.questions.length} ข้อ`);
    }
    root.querySelectorAll('.rs-chapter').forEach(chapter => {
      const entries = [...registry.values()].filter(e => e.section.closest('.rs-chapter') === chapter);
      const complete = entries.filter(e => e.section.classList.contains('complete')).length;
      chapter.querySelector('.rs-chapter-progress').textContent = `ทำถูกครบ ${complete} / ${entries.length} บทย่อย`;
      if (complete === entries.length && complete) chaptersComplete++;
    });
    const questions = allQuestions(), done = questions.filter(validAnswer).length, correct = questions.filter(q => validAnswer(q)?.selected === q.answer).length;
    root.querySelector('.subject-task-summary').textContent = `ตอบแล้ว ${done} / ${questions.length} ข้อ · ถูก ${correct} · ผิด ${done - correct} · ${registry.size} บทย่อย`;
    const progress = root.querySelector('.rs-course-progress');
    progress.setAttribute('aria-valuemax', String(questions.length)); progress.setAttribute('aria-valuenow', String(done));
    progress.setAttribute('aria-label', `ตอบแล้ว ${done} จาก ${questions.length} ข้อ`);
    progress.firstElementChild.style.width = `${questions.length ? done / questions.length * 100 : 0}%`;
  }
  function renderQuestion(q, index) {
    const state = validAnswer(q), selected = state?.selected, answered = Boolean(state), correct = answered && selected === q.answer;
    const article = make('article', 'quiz-card rs-question'); article.dataset.questionId = q.id;
    const top = make('div', 'quiz-top'); top.append(make('div', 'quiz-num', `QUESTION ${String(index + 1).padStart(2, '0')}`), make('span', `status-badge ${answered ? correct ? 'correct' : 'wrong' : 'unanswered'}`, answered ? correct ? '✓ ถูกต้อง' : '✕ ยังไม่ถูก' : 'ยังไม่ตอบ'));
    const prompt = make('h4', 'quiz-q', q.q); prompt.id = `${q.id}-prompt`;
    const choices = make('div', 'choices'); choices.setAttribute('role', 'group'); choices.setAttribute('aria-labelledby', prompt.id);
    q.choices.forEach((text, choiceIndex) => {
      const button = make('button', 'choice'); button.type = 'button'; button.dataset.choice = String(choiceIndex); button.disabled = answered;
      button.setAttribute('aria-label', `ตัวเลือก ${'ABCD'[choiceIndex]} ${text}`);
      if (answered) button.classList.add(choiceIndex === q.answer ? 'correct' : choiceIndex === selected ? 'wrong' : 'dim');
      button.append(make('span', 'letter', 'ABCD'[choiceIndex]), make('span', '', text)); choices.append(button);
    });
    article.append(top, prompt, choices);
    if (answered) {
      article.classList.add('answered');
      const summary = make('div', 'answer-summary'); summary.append(make('span', correct ? 'good' : 'bad', `คำตอบของคุณ: ${'ABCD'[selected]} · ${q.choices[selected]}`), make('span', 'good', `คำตอบที่ถูก: ${'ABCD'[q.answer]} · ${q.choices[q.answer]}`));
      const explanation = make('div', 'explain show'); explanation.append(make('strong', '', 'เหตุผล: '), document.createTextNode(q.explanation));
      const details = make('details', 'rs-option-reasons'), list = make('ul'); details.append(make('summary', '', 'ทำไมแต่ละตัวเลือกจึงถูกหรือผิด?'));
      q.reasons.forEach((reason, i) => list.append(make('li', '', `${'ABCD'[i]} · ${reason}`))); details.append(list);
      article.append(summary, explanation, details);
    }
    return article;
  }
  function renderQuestions(entry) {
    const panel = entry.questionsPanel; panel.replaceChildren(make('h3', 'section-questions-title', 'ตรวจความเข้าใจ · 4 Choices'), make('p', 'rs-quiz-note', 'เลือกได้ครั้งเดียวต่อรอบ ตอบแล้วดูเฉลยและเหตุผลได้ทันที คะแนนถูก/ผิดจะบันทึกแยกกัน หากต้องการเริ่มรอบใหม่ใช้ Reset วิชานี้'));
    entry.lesson.questions.forEach((q, i) => panel.append(renderQuestion(q, i)));
  }
  function setOpen(id, open, remember = true) {
    const entry = registry.get(id); if (!entry) return;
    entry.body.hidden = !open; entry.section.classList.toggle('collapsed', !open); entry.toggle.setAttribute('aria-expanded', String(open));
    if (!open) entry.body.querySelectorAll('[data-rs-demo]').forEach(el => players.get(el)?.stop());
    if (remember) { openState[id] = open; write(OPEN_KEY, openState); }
  }
  function setActiveChapter(chapterId) {
    if (!chapterId || !root) return;
    const chapters = (window.RECSYS_CHAPTERS || []).filter(c => c.lessons?.length);
    if (!chapters.some(c => c.id === chapterId)) return;
    activeChapterId = chapterId;
    try { localStorage.setItem(CHAPTER_KEY, chapterId); } catch {}
    root.querySelectorAll('.rs-chapter').forEach(sec => {
      sec.classList.toggle('active', sec.id === chapterId);
    });
    if (!root.classList.contains('active')) {
      window.switchSubject?.('recsys');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.renderHero?.();
    window.buildSidebar?.();
    window.buildTabs?.();
  }
  function openLesson(id) {
    if (!id) return;
    const chapters = (window.RECSYS_CHAPTERS || []).filter(c => c.lessons?.length);
    if (chapters.some(c => c.id === id)) {
      setActiveChapter(id);
      return;
    }
    if (registry.has(id)) {
      const entry = registry.get(id);
      const parentChapter = entry.section.closest('.rs-chapter');
      if (parentChapter && parentChapter.id && parentChapter.id !== activeChapterId) {
        setActiveChapter(parentChapter.id);
      }
      setOpen(id, true);
      setTimeout(() => {
        entry.section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 70);
    }
  }
  function renderSources(lesson, panel) {
    const details = make('details', 'rs-sources'); details.append(make('summary', '', 'ที่มาและอ่านต่อจากเอกสารเรียน'));
    const note = make('p', '', 'เนื้อหาเรียบเรียงจากเอกสารเรียน ตัวอย่างที่ระบุว่าสมมุติสร้างขึ้นเพื่อสอน ไม่ใช่การคัดตารางหรือคำตอบ Take Home'); details.append(note);
    const list = make('ul');
    lesson.sources.forEach((doc, index) => {
      const li = make('li'), link = make('a', '', `${doc.title} · หน้า PDF ${doc.page} · ${doc.topic}`); link.href = `${doc.path}#page=${doc.page}`; link.target = '_blank'; link.rel = 'noreferrer'; li.append(link);
      const button = make('button', 'section-doc-btn', 'อ่านในหน้านี้'); button.type = 'button'; button.dataset.rsDocument = `${lesson.id}-doc-${index}`; button.setAttribute('aria-haspopup', 'dialog'); li.append(' ', button); list.append(li);
    }); details.append(list); panel.append(details);
  }
  const demoMeta = {
    matrix: {
      title: 'User-Item Matrix — ตารางคะแนนและช่องว่าง (?)',
      subtitle: 'แถวคือผู้ใช้ (User) · คอลัมน์คือคอร์ส (Item) · ช่อง ? คือยังไม่รู้ค่า (ไม่ใช่ 0 ดาว)'
    },
    average: {
      title: 'Mean Over Known Values — เฉลี่ยเฉพาะช่องที่รู้ค่า',
      subtitle: 'ข้ามช่อง ? เสมอ ไม่นำมานับเป็นตัวหาร n และมีค่าสำรอง (Fallback μ) เมื่อ n = 0'
    },
    dot: {
      title: 'Dot Product & Cosine — จับคู่ความชอบคน (p) กับสัดส่วนเนื้อหาคอร์ส (q)',
      subtitle: 'แต่ละแถวคือเวกเตอร์ 1 ตัว · คูณเลขในคอลัมน์ (แกนเนื้อหา) เดียวกันแล้วบวกรวมกัน'
    },
    log: {
      title: 'Logarithm Compression — บีบสเกลที่พุ่งเท่าตัว (2ᵖ → p)',
      subtitle: 'เมื่อจำนวนคลิกคูณสอง (×2) ค่า log₂(x) จะเพิ่มขึ้นเพียงทีละ +1 ขั้นคงที่'
    },
    'intro-pipeline': {
      title: 'The RecSys Funnel Pipeline — สายพานคัดกรอง 5 ด่านสู่หน้าจอ Top-2',
      subtitle: 'แต่ละแถวคือคอร์สในคลัง · ดูว่าคอร์สใดผ่านเข้ารอบ ได้คะแนน หรือถูกตัดออกตามกฎธุรกิจ'
    },
    'intro-ranking': {
      title: 'Rating Prediction vs Top-K Ranking — ทายดาวแม่น ≠ เรียงลำดับถูก',
      subtitle: 'เปรียบเทียบ โมเดล X (ทายเลขใกล้แต่สลับอันดับผิด) กับ โมเดล Y (ทายเลขเพี้ยนแต่เรียงหน้าจอ Top-2 ถูกเป๊ะ)'
    },
    'intro-cold-start': {
      title: 'Cold Start vs Sparsity — วิเคราะห์จุดที่ขาดข้อมูลและเลือกวิธีรับมือ',
      subtitle: 'ดูว่าข้อมูลหายไปที่แถวผู้ใช้ คอลัมน์สินค้า หรือทั้งตาราง เพื่อเลือกยุทธศาสตร์แก้ไขให้ตรงจุด'
    },
    'intro-feedback-loop': {
      title: 'Feedback Loop & Exposure Bias — เมื่อยอดคลิกดิบหลอกให้ระบบลำเอียง',
      subtitle: 'เทียบ 🐍 คอร์ส A กับ 🎨 คอร์ส B ที่คนชอบเท่ากัน (CTR 20%) แต่ระบบโชว์ไม่เท่ากัน'
    },
    'metrics-errors': {
      title: 'MAE vs RMSE — เทียบความผิดพลาดรายคอร์สและการลงโทษแผลใหญ่ด้วย e²',
      subtitle: 'แต่ละแถวคือคอร์สของ 👩 ฟ้า · เทียบโมเดล R1 (ผิดนิดหน่อย 4 วิชา) กับ R2 (ผิดก้อนใหญ่ที่ 📐 E วิชาเดียว)'
    },
    'metrics-set': {
      title: 'Precision@3 · Recall@3 · F1@3 · HitRate@3 — วัดความแม่นระดับชุด (ไม่สนลำดับ)',
      subtitle: 'เทียบหน้าจอ Top-3 (K = 3) กับของที่ชอบจริง Rᵤ ของ 👩 ฟ้า (3 ชิ้น) และ 🧑 พลอย (2 ชิ้น)'
    },
    'metrics-first': {
      title: 'Reciprocal Rank (RR@3) & MRR@3 — โฟกัสเฉพาะอันดับของชิ้นแรกที่ใช่',
      subtitle: 'ดูว่าของที่ชอบชิ้นแรกปรากฏที่ช่องอันดับ r₁ ใด แล้วคิดคะแนน 1/r₁ ก่อนเฉลี่ยข้ามผู้ใช้เป็น MRR@3'
    },
    'metrics-ap': {
      title: 'Average Precision (AP@3) & MAP@3 — เฉลี่ย Precision ทุกจุดที่เจอของที่ชอบ',
      subtitle: 'คำนวณ P@k เฉพาะช่องที่ใช่ (✓) แล้วหารด้วย m = min(K, |Rᵤ|) เพื่อให้รางวัลเมื่อของดีอยู่ต้นลิสต์หลายชิ้น'
    },
    'metrics-dcg': {
      title: 'DCG@3 · IDCG@3 · nDCG@3 — ถ่วงน้ำหนักส่วนลดตามตำแหน่ง 1 / log₂(k+1)',
      subtitle: 'เทียบคะแนนถ่วงตำแหน่งของ โมเดล S และ T กับเพดานสูงสุดที่เป็นไปได้ (IDCG@3) ของ 👩 ฟ้า'
    },
    'metrics-auc': {
      title: 'Pairwise Accuracy & AUC — ตารางจับคู่รายการที่ชอบ (i⁺) ชนะรายการที่ไม่ชอบ (j⁻)',
      subtitle: 'จับคู่บวก 3 ชิ้น {🐍A, 📊C, 📐E} กับลบ 3 ชิ้น {🎨B, 📈D, 🖼️F} รวม 9 คู่ บนลำดับของโมเดล T'
    },
    'eval-coverage': {
      title: 'Catalog Coverage & Gini Index — วัดความครอบคลุมและโอกาสการแสดงผล',
      subtitle: 'ตรวจว่าคอร์สทั้งคลัง 6 รายการได้ขึ้นจอ Top-3 กี่ครั้ง (ต้องรวมรายการที่ได้ 0 ครั้งในสูตร Gini เสมอ)'
    },
    'eval-time-split': {
      title: 'Temporal Split (Train / Validation / Test) — แบ่งข้อมูลตามเส้นเวลาจริง',
      subtitle: 'ใช้ประวัติอดีต (วัน 1–3) ฝึกโมเดล · วัน 4 จูนค่า · วัน 5–6 ทดสอบอนาคต โดยตรวจความพร้อมของคอร์สใหม่'
    },
    'eval-leakage': {
      title: 'Data Leakage vs Clean Pipeline — จับ 4 จุดที่ข้อมูลอนาคตรั่วเข้าสู่โมเดล',
      subtitle: 'เทียบกระบวนการที่เผลอดึงสถิติอนาคตมาใช้ (❌ Leaky) กับสายพานที่แบ่งข้อมูลก่อนเสมอ (✅ Clean)'
    },
    'eval-sampling': {
      title: 'Full Catalog vs Sampled Negatives — กลไกการบีบอันดับและ Winner Flip',
      subtitle: 'ดูว่าทำไม โมเดล Q ชนะเมื่อวัดเต็มคลัง 6 ชิ้น แต่ โมเดล P พลิกกลับมาชนะเมื่อสุ่มลบมาแข่งแค่ 1 ชิ้น'
    },
    'eval-bootstrap': {
      title: 'Paired Bootstrap & 95% CI — วัดความไม่แน่นอนของผลต่างรายผู้ใช้ (Δ = T − S)',
      subtitle: 'จับคู่คะแนน S และ T ของผู้ใช้คนเดิม u₁..u₄ แล้วสุ่มแบบคืน 256 ชุดเพื่อตรวจว่าช่วงความเชื่อมั่นคร่อมศูนย์หรือไม่'
    },
    'eval-counterfactual': {
      title: 'Off-Policy Evaluation (IPS & SNIPS) — ถ่วงน้ำหนัก Log ด้วย w = π / π₀',
      subtitle: 'ชดเชยอคติของระบบเก่า (π₀) เพื่อประเมินระบบใหม่ (π) พร้อมตรวจเงื่อนไข Overlap (π₀ > 0)'
    },
    'cb-text': {
      title: 'Text Preprocessing & Document–Term Matrix — แปลงข้อความดิบเป็นตารางความถี่คำ',
      subtitle: 'แต่ละแถวคือคอร์สเรียน · คอลัมน์คือพจนานุกรมที่สร้างจากชุดฝึกเท่านั้น (Fit on Train T1–T4)'
    },
    'cb-tfidf': {
      title: 'TF-IDF Term Weighting — ลดน้ำหนักคำโหล (High DF) และชูคำเฉพาะทาง',
      subtitle: 'คำนวณบนชุดฝึก N = 4 คอร์ส (T1–T4) · เทียบค่า DF, Smooth IDF และน้ำหนัก TF × IDF ของแต่ละคำ'
    },
    'cb-cosine': {
      title: 'L2 Normalization & Cosine Similarity — วัดทิศทางเนื้อหา ไม่หลงกลความยาว',
      subtitle: 'แต่ละแถวคือเวกเตอร์คอร์ส · จับคู่คูณตามแกนคำศัพท์ (Dot Product) แล้วหารด้วยความยาว L2 Norm'
    },
    'cb-bm25': {
      title: 'BM25 Lexical Scoring — เพดานอิ่มตัวคำซ้ำ (k₁) และชดเชยความยาวเอกสาร (b)',
      subtitle: 'คำค้นหา 🔍 q = "python data" (avgdl = 2.25 คำ, k₁ = 1.5, b = 0.75) · เทียบ T1 (ยาว 3 คำ) กับ T2 (กระชับ 2 คำ)'
    },
    'cb-embedding': {
      title: 'Sparse Lexical vs Dense Semantic Embeddings — ก้าวข้ามตัวสะกดสู่พิกัดความหมาย',
      subtitle: 'เปรียบเทียบการจับคู่คำพ้อง (Synonyms), คำกำกวม (Polysemy), รหัสเฉพาะทาง และการรวมคำด้วย Mean Pooling'
    },
    'cb-profile': {
      title: 'User Profile Centroid — สร้างเวกเตอร์รสนิยมของ 👩 ฟ้า จากคอร์สที่เคยชอบ',
      subtitle: 'แต่ละแถวคือเวกเตอร์ 2 มิติ (สายโค้ด vs สายภาพ) · เทียบค่าเฉลี่ยปกติ, ถ่วงน้ำหนักดาว และ L2 Normalization'
    },
    'cb-retrieval': {
      title: 'ANN Vector Search at Scale — เทียบ Flat Search, HNSW, IVF-PQ และ Index Recall@M',
      subtitle: 'ด่านแรกดึงผู้สมัคร M = 100 ชิ้นในเสี้ยววินาที เพื่อส่งต่อให้ด่านจัดอันดับคัดเหลือ K = 5 ชิ้นขึ้นจอ (M ≫ K)'
    },
    'cb-rerank': {
      title: 'Hybrid Score Fusion & RRF — แก้ปัญหาคนละสเกลระหว่าง BM25 กับ Semantic Cosine',
      subtitle: 'เทียบผู้สมัคร 3 คอร์ส (F1, F2, F3) · ดูว่าทำไมห้ามบวกคะแนนดิบตรงๆ และวิธีรวมด้วย Min–Max กับ RRF'
    },
    'cb-mmr': {
      title: 'Maximal Marginal Relevance (MMR) — จัดอันดับ Top-2 ให้ตรงใจและไม่ซ้ำซาก',
      subtitle: 'สูตร MMR = λ·Rel(d) − (1−λ)·max Sim(d, s∈S) เมื่อตั้ง λ = 0.7 · เทียบ X, Y (ซ้ำกับ X), และ Z (หัวข้อใหม่)'
    },
    'mm-modalities': {
      title: 'Multimodal Foundations — 4 สื่อหลัก (📝T, 🖼️I, 🎵A, 🎬V) เสริมพลังและคัดกรอง Noise',
      subtitle: 'เทียบบทบาทของแต่ละสื่อ · ความต่างระหว่าง Unimodal (20 ภาพ) กับ Multimodal · และการรับมือ Clickbait / เสียงซ่า'
    },
    'mm-features': {
      title: 'Feature Extraction & Linear Projection — แปลงสื่อดิบเป็นเวกเตอร์พร้อมใช้',
      subtitle: 'จากพิกเซล/คลื่นเสียง → Handcrafted vs Pretrained Encoder → Linear Projection ย่อมิติ (ระวัง: มิติเท่ากัน ≠ ความหมายตรงกัน!)'
    },
    'mm-neuron': {
      title: 'Artificial Neuron & ReLU — สมการ z = w·x + b, ฟังก์ชันไม่เชิงเส้น และการอัปเดตน้ำหนัก',
      subtitle: 'คำนวณ x = (2, 1), w = (0.5, −1.0), b = 0.5 → z = 0.5 → ReLU(0.5) = 0.5 · และการปรับ w_new ด้วย Gradient Descent'
    },
    'mm-cnn': {
      title: '1D Convolution & Weight Sharing — เลื่อนหน้าต่าง Kernel [1, 0, −1] สแกนหาลวดลาย',
      subtitle: 'อินพุต [1, 2, 0, 3, 1] · เลื่อนคูณทีละช่อง (Stride = 1, Padding = 0) ได้ Feature Map [1, −1, −1] และคุณสมบัติ Translation Invariance'
    },
    'mm-pooling': {
      title: 'Padding, Stride & Max Pooling — คุมขอบเขตภาพ ย่อขนาด และขยาย Receptive Field',
      subtitle: 'เทียบ Zero Padding · Stride = 2 · Max Pooling 2×2 บนบล็อก [1, 3; 2, 4] → Max = 4.0 · และการขยายขอบเขตการมองเห็น'
    },
    'mm-encoders': {
      title: 'CNN Encoders Across Modalities — 1D Text, 2D Image, 2D Spectrogram & 3D Video',
      subtitle: 'เปรียบเทียบโครงสร้างหน้าต่างสแกนของทั้ง 4 สื่อ และข้อจำกัดของ CNN เมื่อต้องเชื่อมโยงข้อมูลที่อยู่ห่างกันมากๆ'
    },
    'mm-tokens': {
      title: 'Patch Tokenization (ViT & AST) — หั่นภาพและสเปกโตรแกรมเป็นคำสำหรับ Transformer',
      subtitle: '4 ขั้นตอน: 1. หั่น Patch 16×16 → 2. Linear Projection → 3. บวก Positional Encoding → 4. เติมโทเค็นสรุป [CLS]'
    },
    'mm-attention': {
      title: 'Scaled Dot-Product Attention — กลไก Q, K, V และการหารด้วย √d_k ป้องกัน Softmax อิ่มตัว',
      subtitle: 'คำนวณจริง: Q=(1,0), K₁=(1,0), K₂=(0,1), V₁=(2,0), V₂=(0,2), d_k=2 → น้ำหนัก (0.67, 0.33) → เอาต์พุต (1.34, 0.66)'
    },
    'mm-transformer-block': {
      title: 'Inside a Transformer Block — MHA, Residual (x + Sublayer(x)), LayerNorm & FFN',
      subtitle: 'เจาะลึก 4 ชิ้นส่วนใน 1 บล็อกที่ช่วยให้เทรนโครงข่ายลึกได้โดยเกรเดียนต์ไม่เหือดหาย พร้อมการดึง Item Vector ([CLS] / Mean Pooling)'
    },
    'mm-profiles': {
      title: 'Modality-Specific User Profiles — สร้างรสนิยมรายสื่อ (p^T, p^I, p^A, p^V) ของ 👩 ฟ้า',
      subtitle: 'เฉลี่ยจากคลิปที่ชอบ H1, H2 แล้วทำ L2 Normalization แยกรายสื่อ · พร้อมกฎเหล็กห้ามคูณข้ามสื่อที่ยังไม่จัดแนว (Unaligned Trap)'
    },
    'mm-late': {
      title: 'Late Fusion (Decision-Level) — คณะลูกขุนให้คะแนนแยกสื่อแล้วถ่วงน้ำหนักรวม',
      subtitle: 'สูตร Score_Late = 0.4·S_T + 0.2·S_I + 0.2·S_A + 0.2·S_V · เทียบผู้สมัคร M3, M4, M5 และจุดแข็ง 3 ด้านในโปรดักชัน'
    },
    'mm-early': {
      title: 'Early Fusion (Feature-Level) — ต่อเวกเตอร์ [√w_T·v^T ; ... ; √w_V·v^V] เป็นเส้นเดียว',
      subtitle: 'ทำไมต้องคูณ √w_m ทั้งฝั่ง User และ Item (√w × √w = w) · จุดเด่น Cross-Modal และจุดอ่อนเมื่อสื่อแหว่งหรือมิติไม่สมดุล'
    },
    'mm-intermediate': {
      title: 'Intermediate Fusion — ประตูอัจฉริยะ (Dynamic Gating), Cross-Attention และ CLIP',
      subtitle: 'ปรับน้ำหนักสื่อตามบริบทของสินค้าแต่ละชิ้น · ใช้ข้อความค้นฉากวิดีโอ · และจัดแนวภาพกับข้อความให้อยู่พิกัดเดียวกัน'
    },
    'mm-missing': {
      title: 'Handling Missing Modalities — Availability Mask, Weight Re-normalization & Modality Dropout',
      subtitle: 'เมื่อคลิปไม่มีวิดีโอ [1, 1, 1, 0]: ทำไมห้ามเติม 0 สุ่มสี่สุ่มห้า · วิธีปรับฐานน้ำหนักหารด้วย 0.8 · และการสุ่มปิดสื่อตอนเทรน'
    },
    'mm-ablation': {
      title: 'Ablation Study — ถอดสื่อออกทีละชิ้นเพื่อวัดคุณค่าส่วนเพิ่ม (Marginal Contribution)',
      subtitle: 'เทียบโมเดลเต็ม (0.8125) vs ตัดเสียง (−A เหลือ 0.6540 💥) vs ตัดภาพ (−I ได้ 0.8120 เท่าเดิม) และการตัดสินใจด้านต้นทุน'
    },
    'mm-system': {
      title: 'End-to-End Production Multimodal System — Offline Cache, Version Lock & 50ms Budget',
      subtitle: 'สกัดเวกเตอร์ล่วงหน้าลง Vector DB · ล็อกรุ่น Encoder ตรงกันทั้ง Train/Serve · ค้นด้วย ANN ใน 2ms และรวมผลใน 50ms'
    },
    'cf-matrix': {
      title: 'User-Item Interaction Matrix — สำรวจรอยเท้าฝูงชนและช่องเป้าหมาย (u₁ ฟ้า, E)',
      subtitle: 'ตาราง 5 ผู้ใช้ × 6 คอร์ส · ตัวเลข 1–5★ คือ Train · ช่อง ? คือยังไม่เคยเรียน · ช่องเป้าหมายคือ (u₁ ฟ้า, E Data Story)'
    },
    'cf-popularity': {
      title: 'Popularity Baseline — จัดอันดับความนิยมดั้งเดิม (เกณฑ์ชอบดาว ≥ 4★)',
      subtitle: 'นับความถี่คนที่ให้ดาว ≥ 4★ เทียบแต่ละคอร์ส · A=3, B=3, E=3, D=2, C=1, F=0 (คอร์สใหม่เผชิญ Item Cold-Start)'
    },
    'cf-similarity': {
      title: 'Jaccard vs Raw Cosine — วัดความคล้ายบนสินค้าที่ประเมินร่วมกัน (Co-rated Items)',
      subtitle: 'เทียบ u₁ (ฟ้า) กับ u₂ (พลอย) บน 4 คอร์สร่วม {A, B, C, D} · Jaccard = 4/5 = 0.8000 vs Cosine = 50 / (√46·√58) = 0.9680'
    },
    'cf-centering': {
      title: 'Mean-Centering & Pearson Correlation — ปรับไม้บรรทัดตัดอคติคนใจดี vs คนเคี่ยว',
      subtitle: 'ลบค่าเฉลี่ยส่วนตัว (r_ui − r̄ᵤ) ก่อนคูณเวกเตอร์ · u₁ ฟ้า (r̄=3.0) ให้ A, B, C, D กลายเป็น (+2, +1, −2, −1) · Pearson = 0.8269'
    },
    'cf-support': {
      title: 'Significance Weighting — ถ่วงน้ำหนักความน่าเชื่อถือด้วยหลักฐานร่วม (β = 4)',
      subtitle: 'ตัวคูณลดทอน min(|ร่วม|, β) / β · u₂ ร่วม 4 ชิ้น (คูณ 1.0 = 0.8269 🏆) แซง u₄ ที่ร่วมแค่ 3 ชิ้น (คูณ 0.75 = 0.6667)'
    },
    'cf-user': {
      title: 'User-kNN Prediction Formula — รวมพลังเพื่อนบ้าน Top-2 ทำนายดาวให้ 👩 ฟ้า',
      subtitle: 'ดึง u₂ (น้ำหนัก 0.8269 เกินเฉลี่ย +1.2) และ u₄ (น้ำหนัก 0.6667 เกินเฉลี่ย +1.0) บวกเข้าฐาน u₁ (3.0) → ทำนาย E = 4.1107★'
    },
    'cf-item': {
      title: 'Adjusted Cosine Similarity — เทียบคอลัมน์สินค้าแต่หักลบค่าเฉลี่ยแนวนอนของคน',
      subtitle: 'หาความคล้ายระหว่างคอร์สเป้าหมาย E กับคอร์ส {A, B, C, D} โดยหักลบ r̄ᵤ ของแต่ละคนในแถว · sim(E, A) = 0.7115, sim(E, B) = 0.7115'
    },
    'cf-item-predict': {
      title: 'Item-kNN Recommendation — ระบบแนะนำระดับตำนานของ Amazon (เสถียรและแคชง่าย)',
      subtitle: 'ทำนาย E จากคอร์สที่ u₁ เคยเรียน (A ให้ 5★ เกินเฉลี่ย +2.0, B ให้ 4★ เกินเฉลี่ย +1.0) → ทำนาย Item-kNN บนคอร์ส E = 4.5000★'
    },
    'cf-implicit': {
      title: 'Implicit Item-kNN — เมื่อไม่มีคะแนนดาว มีเพียงรอยเท้าคลิกและการซื้อ (0 / 1)',
      subtitle: 'แปลงดาว ≥ 4 เป็น 1 · Cosine ความถี่ซื้อร่วม E กับ A = 2/3, E กับ B = 2/3 → รวมคะแนนจัดอันดับคอร์ส E = 2/3 + 2/3 = 1.3333'
    },
    'cf-bias': {
      title: 'Baseline Predictor — แยกองค์ประกอบคะแนนพื้นฐาน bᵤᵢ = μ + bᵤ + bᵢ',
      subtitle: 'ค่าเฉลี่ยทั้งระบบ μ = 3.3000 · นิสัย u₁ ฟ้าเคี่ยว bᵤ = −0.1500 · คอร์ส E คนชอบ bᵢ = +0.3000 → ค่าฐาน b(u₁, E) = 3.4500★'
    },
    'cf-baseline': {
      title: 'kNN-Baseline Predictor — ผสานพลังค่าฐานและเพื่อนบ้านอย่างลงตัว',
      subtitle: 'ใช้ค่าฐาน bᵤᵢ เป็นสมอเรือ แล้วให้เพื่อนบ้านช่วยดึงเฉพาะส่วนเบี่ยงเบนที่เกินคาด (Residuals) ป้องกันสินค้าหลุดโลก'
    },
    'cf-diagnosis': {
      title: 'CF Disease & Diagnostic Matrix — วินิจฉัยจุดตายและวิธีรักษาทางวิศวกรรม',
      subtitle: 'ตรวจอาการ User Cold-Start, Item Cold-Start (คอร์ส F), Sparsity 99%, Gray Sheep (แกะสีเทา) และ Popularity Bias'
    },
    'model-mf': {
      title: 'Matrix Factorization (MF) — จับคู่เวกเตอร์แฝง r̂ᵤᵢ = bᵤᵢ + pᵤ · qᵢ',
      subtitle: 'เวกเตอร์รสนิยมฟ้า pᵤ=(1.0, 0.5) · เวกเตอร์คอร์ส qᵢ=(0.8, 0.4) → Dot=1.0000 + ค่าฐาน Baseline 3.1000 = ทำนาย 4.1000★'
    },
    'model-loss': {
      title: 'Observed Squared Error Loss — สัญญาณเตือนภัย L = ½ Σ_{(u,i)∈R} (rᵤᵢ − r̂ᵤᵢ)²',
      subtitle: 'กฎเหล็ก Simon Funk: คิด Loss เฉพาะช่องที่มีดาวจริงใน Train เท่านั้น (ห้ามเติม 0 ในช่องว่าง) · r=4.0, r̂=3.08 → e=+0.92, Loss=0.4232'
    },
    'model-sgd': {
      title: 'Stochastic Gradient Descent (SGD) — ปรับเวกเตอร์หนึ่งก้าวอย่างเห็นภาพ',
      subtitle: 'ความผิดพลาด e = +0.92 · η = 0.1, λ = 0.1 → อัปเดต p: (0.2440, 0.0806), q: (0.5164, −0.1988) → Loss ลดจาก 0.4282 เหลือ 0.3541'
    },
    'model-reg': {
      title: 'L2 Regularization — ใส่โทษภาษีความซับซ้อน ½ λ (‖pᵤ‖² + ‖qᵢ‖²) ป้องกัน Overfitting',
      subtitle: 'ผลของ Weight Shrinkage · ถ้า λ=0 จำข้อสอบ (Overfit) · ถ้า λ สูงเกินหดเหลือ 0 (Underfit) · ต้องจูน λ บน Validation Set เสมอ'
    },
    'model-als': {
      title: 'Alternating Least Squares (ALS) — ตรึงฝั่งหนึ่งแล้วแก้คำตอบรูปปิดอีกฝั่ง',
      subtitle: 'ตรึง q=(1, 2) แก้หา p=(q·y)/(‖q‖²+λ) = 4/6 = 0.6667 รอบเดียวจบ ไม่ต้องสุ่มก้าวแบบ SGD และการันตี Loss ลดลงต่อเนื่อง'
    },
    'model-history': {
      title: 'SVD++ Enhanced Profile — เสริมพลังรสนิยมด้วยประวัติการคลิกในอดีต (1/√|N| Σ yⱼ)',
      subtitle: 'ฟ้า pᵤ=(0.2, 0.1) เคยคลิก 4 คอร์ส (y_sum=(0.6, 0.2)) → เวกเตอร์เสริม p_enhanced=(0.50, 0.20) → ทำนายคอร์ส q ได้แม่นยำ 3.3000★'
    },
    'model-wrmf': {
      title: 'WRMF: Preference (p) vs Confidence (c) — แยกความชอบออกจากความมั่นใจ',
      subtitle: 'คลิก 2 ครั้ง: p=1, ความมั่นใจสูง c=1+3(2)=7 · ช่องว่าง: p=0, ความมั่นใจต่ำ c=1 (ฝึกบนทุกช่องของตารางด้วยน้ำหนักความเชื่อมั่น)'
    },
    'model-ials': {
      title: 'Implicit ALS (iALS) Trick — มายากลลดเวลาคำนวณจากร้อยปีเหลือไม่กี่นาที',
      subtitle: 'แยก Qᵀ Cᵤ Q = Qᵀ Q + Qᵀ (Cᵤ − I) Q · คำนวณ QᵀQ ล่วงหน้าครั้งเดียวทั้งระบบ ส่วน (Cᵤ − I) เป็น 0 ในช่องว่างเกือบทั้งหมด!'
    },
    'model-bpr': {
      title: 'Bayesian Personalized Ranking (BPR) — เรียนรู้แบบจัดอันดับคู่ Triplet (u, i⁺, j⁻)',
      subtitle: 'เป้าหมายคือดัน x̂ᵤᵢⱼ = score(i⁺) − score(j⁻) ให้เป็นบวกมากที่สุด เพื่อเพิ่มค่า AUC โดยตรง (ไม่สนว่าคะแนนดาวจะเป็นเท่าไหร่)'
    },
    'model-bpr-step': {
      title: 'BPR Triplet SGD Update — ปรับเวกเตอร์ดันของชอบขึ้นและกดของไม่ชอบลง',
      subtitle: 'สถานะเดิมเรียงผิด (x̂ = −0.3) → Error g = 1−σ(−0.3) ≈ 0.5745 → ผลัก q_i ขึ้น, กด q_j ลง, หมุน pᵤ → Loss ลดจาก 0.8543 เหลือ 0.6974'
    },
    'model-ease': {
      title: 'EASE Linear Model — เมทริกซ์สินค้าคำตอบรูปปิด B = −P/diag(P) โดย diag(B) = 0',
      subtitle: 'คำนวณ Gram Inverse P = (XᵀX + λI)⁻¹ รอบเดียวจบ บังคับสินค้าห้ามแนะนำตัวเอง (diag=0) ไม่ต้องเทรนด้วย SGD และเสิร์ฟทันที xᵤ · B'
    },
    'model-sampling': {
      title: 'Negative Sampling Strategies — เปรียบเทียบ Uniform, Popularity และ Hard Negatives',
      subtitle: 'Uniform (สุ่มมั่วเท่ากัน 1/3) vs Popularity β=0.5 (เน้นของฮิต 1/6, 1/3, 1/2) vs Hard Negatives (ระวัง Hard False Negatives!)'
    },
    'hy-oracle': {
      title: 'Complementary Errors & Oracle Upper Bound — รวมสองโมเดลที่ฉลาดคนละเรื่อง',
      subtitle: 'จำลองสภาวะอุดมคติ Oracle (แอบดูเฉลยล่วงหน้า) เพื่อวัดเพดานทฤษฎีขอบบน MRR = 0.8333 (+36%)'
    },
    'hy-scale': {
      title: 'Score Normalization — ปรับสเกลก่อนรวม ไม่ให้คะแนนดาวครอบงำทศนิยม',
      subtitle: 'แก้ปัญหาโมเดล B (ดาว 1-5) กลบโมเดล A (เนื้อหา 0-1) ด้วย Min-Max จนอันดับ C1 พลิกชนะ C2 ตามน้ำหนักจริง'
    },
    'hy-weighted': {
      title: 'Weighted Hybrid — ผสานคะแนนแบบถ่วงน้ำหนัก w_A × s̃_A + w_B × s̃_B',
      subtitle: 'รันสองโมเดลขนานกันอย่างอิสระ แล้วรวมพลังด้วยน้ำหนัก w_A = 0.6 และ w_B = 0.4 ได้ C1 = 0.9000 นำโด่ง'
    },
    'hy-evidence': {
      title: 'Evidence-Aware Fusion — จัดการสินค้าใหม่และตัดกับดัก Fallback หลอกตา',
      subtitle: 'สินค้าใหม่ C4 ไร้หลักฐานพฤติกรรม (m_B = 0) → ปรับสัดส่วนน้ำหนักโอนไปเชื่อโมเดล A 100% ป้องกันดันของมั่ว'
    },
    'hy-switch': {
      title: 'Switching Hybrid — สลับโมเดลตามความพร้อมด้วยเกณฑ์ Support Threshold θ',
      subtitle: 'ประตูกล if/else: สินค้ามีรีวิว n ≥ 2 ส่งเข้าโมเดล B (CF) · สินค้าใหม่หรือรีวิวน้อย n < 2 สลับไปใช้โมเดล A (Content)'
    },
    'hy-mixed': {
      title: 'Mixed Hybrid — จัดสรรสล็อตหน้าจอ UI ผสานผลลัพธ์แบบสลับฟันปลา',
      subtitle: 'Interleaving สลับดึงจากโมเดล A และ B ทีละอันดับ พร้อมคัดกรองตัดรายการที่ซ้ำซ้อน (Deduplication)'
    },
    'hy-combination': {
      title: 'Feature Combination (Early Fusion) — มัดรวมฟีเจอร์ส่งให้โมเดลเดียวเรียนรู้',
      subtitle: 'รวมฟีเจอร์เนื้อหา x_A [1,0] และพฤติกรรม x_B [1,0] เป็นเวกเตอร์เดียว x = [1,0,1,0] คำนวณด้วยน้ำหนัก β'
    },
    'hy-augmentation': {
      title: 'Feature Augmentation — ส่งไม้ต่อแบบสองด่าน โมเดลแรกช่วยเสริมฟีเจอร์ให้โมเดลหลัง',
      subtitle: 'ด่าน 1 โมเดล A (Content) ช่วยทำนายเติมช่องว่าง ? ในตาราง → ด่าน 2 ส่งตารางหนาแน่นให้โมเดล B (CF) หาเพื่อนบ้าน'
    },
    'hy-cascade': {
      title: 'Cascade Hybrid — กรวยคัดกรองหยาบไปละเอียด (Coarse-to-Fine Pipeline)',
      subtitle: 'ด่าน 1 โมเดล B (CF หยาบเร็ว) คัดเหลือ Top-2 {C2, C1} → ด่าน 2 โมเดล A (Content ละเอียด) สลับ C1 ขึ้นอันดับ 1'
    },
    'hy-meta': {
      title: 'Meta-Level Hybrid — โมเดลแรกสร้างโปรไฟล์ แล้วส่งต่อให้โมเดลหลังคำนวณเพื่อนบ้าน',
      subtitle: 'โมเดล A สกัดประวัติการเรียนเป็นโมเดลโปรไฟล์ความชอบแฝง → โมเดล B ใช้โปรไฟล์นั้นจับคู่เพื่อนบ้านแทนดาวดิบ'
    },
    'hy-lightfm': {
      title: 'LightFM Hybrid Matrix Factorization — ผสาน ID และ Tags เวกเตอร์ในสมการเดียว',
      subtitle: 'ผู้ใช้ = (u_id + u_tags) · สินค้า = (i_id + i_tags) → รองรับสินค้าใหม่ Cold Start ด้วย Tags เวกเตอร์อย่างไร้รอยต่อ'
    },
    'hy-graph': {
      title: 'LightGCN Graph Propagation — การแพร่กระจายสัญญาณความชอบข้ามหลายช่วง (Multi-Hop)',
      subtitle: 'กราฟ Bipartite: ผู้ใช้ g1 เชื่อม C1 และ g2 เชื่อม C1 กับ C3 → ส่งสัญญาณผ่าน 2 ช่วง (2-Hop) แนะนำ C3 ให้ g1 สำเร็จ'
    },
    'hy-tower': {
      title: 'Two-Tower Architecture — แยกหอคอย User และ Item เพื่อเสิร์ฟในเสี้ยววินาที (< 50ms)',
      subtitle: 'Item Tower คำนวณแคชเวกเตอร์ล่วงหน้าแบบออฟไลน์ · User Tower คำนวณเวกเตอร์ฟ้าสดๆ แล้วค้นหาด้วย Dot Product ทันที'
    },
    'hy-logq': {
      title: 'In-Batch Negatives & logQ Correction — แก้ไขความลำเอียงจากการสุ่มของฮิตในแบทช์',
      subtitle: 'ของฮิตถูกสุ่มมาเป็นตัวหลอกบ่อยผิดปกติ → หักลบด้วย ln(Q) ใน Logit ตอนเทรน Softmax แต่ตอนเสิร์ฟใช้ Dot Product ดิบๆ เสมอ'
    },
    'llm-7step': {
      title: '7-Step Safe Funnel — สถาปัตยกรรม 7 ขั้นตอนป้องกันความเสี่ยงของ LLM ใน RecSys',
      subtitle: 'คัดกรองจาก 1,000,000 เรื่องด้วย CF/Two-Tower (<10ms) · LLM จัดอันดับเฉพาะขั้นที่ 4 (~200ms) · ตรวจ Catalog และมี Fallback เสมอ'
    },
    'llm-rerank': {
      title: 'Listwise LLM Reranking — จัดอันดับตามบริบทภาษาและแก้ Position Bias',
      subtitle: 'ฟ้าขอไซไฟปรัชญา/AI ไม่เอาดราม่า → ดัน i12 จากท้ายตารางขึ้น #1 พร้อมสลับ Permutation ป้องกันอคติตำแหน่ง'
    },
    'llm-semanticid': {
      title: 'Semantic ID & Prefix Tree (Trie) — การสร้างรหัสแบบมีโครงสร้างและการตัดกิ่ง',
      subtitle: 'แปลงสินค้าเป็น <SciFi><Space><AI> ด้วย RQ-VAE และใช้ Trie คุมการปล่อยโทเคนและตัดกิ่งหนังที่ฟ้าดูแล้วทิ้ง 100%'
    },
    'llm-grounded': {
      title: 'RecSys-RAG & Claim Verification — คำอธิบายที่ยึดหลักฐานจริงและสกัดภาพหลอน',
      subtitle: 'Plausibility ≠ Truth: โปรแกรมตรวจสอบทุกข้ออ้างเทียบฐานข้อมูลจริง ตัดข้อมูลที่แต่งเติมเองทิ้งก่อนส่งแสดงผลบนหน้าจอ'
    },
    'resp-lifecycle': {
      title: 'Responsible RecSys Lifecycle — วงจรความรับผิดชอบ 4 ขั้นตอนแบบวงจรปิด',
      subtitle: 'นิยามผลกระทบจริง → วัดด้วยตัวชี้วัดหลายด้าน (Coverage, Gini, MRR) → แทรกแซงด้วย Exploration/Fair Rerank → ตรวจสอบ Audit อย่างโปร่งใส'
    },
    'resp-feedback': {
      title: 'Filter Bubble & Exposure Feedback Loop — วงจรคนรวยยิ่งรวยและอคติความนิยม',
      subtitle: 'ของดังได้พื้นที่หน้าแรก 80% → คนคลิกแต่ของดัง → บันทึก Log เทเอียง → โมเดลผูกขาด 98% จนผู้ใช้เบื่อหน่ายหนีออกจากแอป'
    },
    'resp-rerank': {
      title: 'Fair Reranking & Exposure Allocation — กระดานจัดสมดุลพื้นที่สองฝั่งตลาด',
      subtitle: 'เดิมแบรนด์ใหญ่ผูกขาด 3 สล็อต → กำหนด Fair Quota สลับค่ายอิสระ 5 ดาว E เข้าแทนแบรนด์ C ที่ซ้ำซ้อน สองฝั่งได้ประโยชน์ร่วมกัน'
    },
    'resp-shilling': {
      title: 'Shilling Attack Defense — ตรวจจับกองทัพบอทปั่นดาวและขบวนการพรางตัว',
      subtitle: 'ตรวจจับแพทเทิร์นบอทนัดกด 5★ ให้เป้าหมายและถล่ม 1★ ใส่คู่แข่ง ด้วย Rating Velocity และ Profile Clustering ก่อนตัดสิทธิ์ทิ้ง 100%'
    },
    'capstone-decision': {
      title: 'RecSys Decision Compass — เข็มทิศเลือกอัลกอริทึมและตัวชี้วัดตามโจทย์ข้อสอบ',
      subtitle: '4 สถานการณ์หลัก: คะแนนดาว 1–5★ (RMSE) · บันทึกคลิก 0/1 (BPR/nDCG) · ของใหม่ Cold-start (Coverage) · ลำดับเวลา (SASRec)'
    },
    'capstone-pipeline': {
      title: '3-Stage Production RecSys Funnel — สถาปัตยกรรมระบบจริงระดับ 1,000,000 ชิ้น',
      subtitle: 'คลัง 1,000,000 ชิ้น → ด่าน 1 Retrieval (<10ms, Recall) → ด่าน 2 Ranking (<30ms, nDCG) → ด่าน 3 Rerank (<5ms, MMR/Fairness) เวลารวม 41 ms'
    }
  };
  const demoSpecs = {
    ...(window.RECSYS_DEMOS || {}),
    matrix: [
      {
        title: 'ขั้นที่ 1 · เลือกแถวผู้ใช้',
        value: 'แถว u₁ (👩 ฟ้า) → [5★, 4★, ?, ?]',
        detail: 'อ่านแนวนอนทั้งแถว u₁ จะเห็นประวัติของ 👩 ฟ้า ทั้งหมด: ให้คะแนนแล้ว 2 คอร์ส และยังไม่เคยเรียนอีก 2 คอร์ส (?)',
        board: {
          type: 'v1-matrix',
          activeRow: 0,
          focusCells: [[0, 0], [0, 1], [0, 2], [0, 3]],
          targetCells: [],
          scanCells: [],
          meterHighlight: false
        },
        ops: [
          { label: 'แถวที่เลือก', value: 'u₁ · 👩 ฟ้า', tone: 'minus' },
          { label: 'ช่องที่รู้ค่า', value: '5★, 4★ (2 คอร์ส)', tone: 'plus' },
          { label: 'ช่องที่ยังไม่รู้', value: '?, ? (2 คอร์ส)', tone: 'skip' },
          { label: 'ความหมาย', value: '1 แถว = 1 ผู้ใช้', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · อ่านจุดตัดที่รู้ค่า',
        value: 'r(👩 ฟ้า, 📊 SQL) = 4★',
        detail: 'จุดตัดของแถว 👩 ฟ้า (u₁) กับคอลัมน์ 📊 SQL (i₂) คือ r₁₂ = 4★ ซึ่งเป็นข้อมูลจริง (Observed Rating)',
        board: {
          type: 'v1-matrix',
          activeRow: 0,
          activeCol: 1,
          focusCells: [[0, 1]],
          targetCells: [],
          scanCells: [[0, 0]],
          meterHighlight: false
        },
        ops: [
          { label: 'แถวผู้ใช้', value: 'u₁ · 👩 ฟ้า', tone: 'minus' },
          { label: 'คอลัมน์คอร์ส', value: 'i₂ · 📊 SQL', tone: 'skip' },
          { label: 'สัญลักษณ์พิกัด', value: 'r(u₁, i₂)', tone: 'plus' },
          { label: 'ค่าที่บันทึก', value: '4★ (รู้ค่าจริง)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · ช่องว่าง ? ไม่ใช่ 0 ดาว',
        value: 'r(👩 ฟ้า, 🎨 UX) = ? (ยังไม่รู้ค่า)',
        detail: 'ช่อง ? แปลว่า 👩 ฟ้า ยังไม่เคยเรียน 🎨 UX ห้ามแทนด้วย 0 ดาว เพราะ 0 แปลว่าไม่ชอบ แต่ ? คือสิ่งที่ระบบต้องทำนาย r̂',
        board: {
          type: 'v1-matrix',
          activeRow: 0,
          activeCol: 2,
          focusCells: [],
          targetCells: [[0, 2]],
          scanCells: [[0, 0], [0, 1]],
          meterHighlight: false
        },
        ops: [
          { label: 'พิกัดที่ตรวจ', value: '👩 ฟ้า × 🎨 UX', tone: 'minus' },
          { label: 'ค่าในตาราง', value: '? (Missing)', tone: 'skip' },
          { label: 'ข้อห้ามสำคัญ', value: '? ≠ 0 ดาว', tone: 'plus' },
          { label: 'โจทย์ของระบบ', value: 'ทำนาย r̂(u₁, i₃)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · วัด Density & Sparsity',
        value: 'รู้ค่า 6/12 (50%) · ว่าง 6/12 (Sparsity 50%)',
        detail: 'ทั้งตารางมี 3 × 4 = 12 ช่อง: มีคะแนนจริง 6 ช่อง (สีเขียว) และว่าง ? อีก 6 ช่อง (สีเหลือง) จึงมี Sparsity = 50%',
        board: {
          type: 'v1-matrix',
          focusCells: [],
          targetCells: [[0, 2], [0, 3], [1, 1], [1, 3], [2, 0], [2, 2]],
          scanCells: [[0, 0], [0, 1], [1, 0], [1, 2], [2, 1], [2, 3]],
          meterHighlight: true
        },
        ops: [
          { label: 'ช่องทั้งหมด', value: '3 × 4 = 12 ช่อง', tone: 'minus' },
          { label: 'Density (รู้ค่า)', value: '6 / 12 = 50%', tone: 'plus' },
          { label: 'Sparsity (ว่าง ?)', value: '6 / 12 = 50%', tone: 'skip' },
          { label: 'สูตรความสัมพันธ์', value: 'Sparsity = 1 − Density', tone: 'result' }
        ]
      }
    ],
    average: [
      {
        title: 'ขั้นที่ 1 · คัดเฉพาะค่าที่รู้ในคอลัมน์',
        value: '🐍 Python: [5★, 4★, ?] → นับ n = 2',
        detail: 'สแกนแนวตั้งคอลัมน์ 🐍 Python: ใช้เฉพาะคะแนนของ 👩 ฟ้า (5★) และ 🧑 พลอย (4★) ส่วน 👨 นนท์ (?) ข้ามไป ไม่นับเป็นตัวหาร',
        board: {
          type: 'v1-average',
          activeCol: 0,
          takeCells: [[0, 0], [1, 0]],
          skipCells: [[2, 0]]
        },
        ops: [
          { label: 'คอลัมน์ที่ดู', value: '🐍 Python', tone: 'minus' },
          { label: 'ค่าที่นำมาคิด', value: '5★ และ 4★', tone: 'plus' },
          { label: 'ช่องที่ข้าม', value: '👨 นนท์ = ?', tone: 'skip' },
          { label: 'ตัวหารที่ถูก', value: 'n = 2 (ไม่ใช่ 3)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · ค่าเฉลี่ยรายคอร์ส (Item Mean r̄ᵢ)',
        value: 'r̄(Python) = (5 + 4) ÷ 2 = 4.5★',
        detail: 'บวกคะแนนที่รู้ 5 + 4 = 9 แล้วหารด้วย n = 2 ได้ 4.5★ (ถ้าเผลอหาร 3 คน จะเพี้ยนเหลือ 3.0★ ทันที)',
        board: {
          type: 'v1-average',
          activeCol: 0,
          takeCells: [[0, 0], [1, 0]],
          skipCells: [[2, 0]],
          summaryColFocus: 0
        },
        ops: [
          { label: 'ผลรวม Σx', value: '5 + 4 = 9', tone: 'plus' },
          { label: 'ตัวหาร n', value: 'n = 2 คนที่รีวิว', tone: 'minus' },
          { label: 'ระวังหารผิด', value: '9 ÷ 3 = 3.0★ (ผิด)', tone: 'skip' },
          { label: 'Item Mean r̄ᵢ', value: '9 ÷ 2 = 4.5★', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · ค่าเฉลี่ยรายคน (User Mean r̄ᵤ)',
        value: 'r̄(🧑 พลอย) = (4 + 2) ÷ 2 = 3.0★',
        detail: 'เปลี่ยนมาสแกนแนวนอนของ 🧑 พลอย: มีคะแนนจริง 2 คอร์สคือ 🐍 Python (4★) และ 🎨 UX (2★) เฉลี่ยได้ 3.0★',
        board: {
          type: 'v1-average',
          activeRow: 1,
          takeCells: [[1, 0], [1, 2]],
          skipCells: [[1, 1], [1, 3]],
          summaryRowFocus: 1
        },
        ops: [
          { label: 'แถวผู้ใช้', value: 'u₂ · 🧑 พลอย', tone: 'minus' },
          { label: 'ผลรวม Σx', value: '4 + 2 = 6', tone: 'plus' },
          { label: 'จำนวนที่รีวิว', value: 'n = 2 คอร์ส', tone: 'skip' },
          { label: 'User Mean r̄ᵤ', value: '6 ÷ 2 = 3.0★', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · กรณีคอร์สใหม่ (n = 0)',
        value: '🆕 AI ใหม่ (n = 0) → ใช้ค่าสำรอง μ = 3.8★',
        detail: 'คอร์ส 🆕 AI ใหม่ ยังไม่มีใครรีวิวเลย (n = 0) เพื่อไม่ให้เกิด 0 ÷ 0 จึงดึงค่าเฉลี่ยรวมทั้งตาราง (Global Mean μ = 3.8★) มาใช้แทน',
        board: {
          type: 'v1-average',
          activeCol: 3,
          takeCells: [],
          skipCells: [[0, 3], [1, 3], [2, 3]],
          summaryColFocus: 3,
          globalFallback: true
        },
        ops: [
          { label: 'คอร์สใหม่', value: '🆕 AI ใหม่ [?, ?, ?]', tone: 'minus' },
          { label: 'ปัญหาตัวหาร', value: 'n = 0 (หารศูนย์ไม่ได้)', tone: 'skip' },
          { label: 'ค่าเฉลี่ยทั้งตาราง', value: 'μ = 19 ÷ 5 = 3.8★', tone: 'plus' },
          { label: 'ค่าสำรองปลอดภัย', value: 'Fallback = 3.8★', tone: 'result' }
        ]
      }
    ],
    dot: [
      {
        title: 'ขั้นที่ 1 · แทนคนและคอร์สด้วยเวกเตอร์ 2 แกน (Data, Design)',
        value: '👩 ฟ้า p = (3, 1) · 🐍 คอร์ส A = (2, 0) · 🎨 คอร์ส B = (0, 2)',
        detail: 'แต่ละแถวคือเวกเตอร์ 1 ตัวที่มี 2 แกน: แกนที่ 1 คือสัดส่วนเนื้อหา 📊 Data และแกนที่ 2 คือสัดส่วนเนื้อหา 🎨 Design',
        board: {
          type: 'v3-dot',
          stepMode: 'align',
          activeDim: null,
          winnerHighlight: false,
          normHighlight: false
        },
        ops: [
          { label: '👩 ฟ้า p = (3, 1)', value: 'ชอบ Data 3, Design 1', tone: 'minus' },
          { label: '🐍 คอร์ส A = (2, 0)', value: 'มีแต่เนื้อหา Data (2)', tone: 'plus' },
          { label: '🎨 คอร์ส B = (0, 2)', value: 'มีแต่เนื้อหา Design (2)', tone: 'skip' },
          { label: 'วิธีจับคู่', value: 'คูณเลขในคอลัมน์เดียวกัน', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · คูณคอลัมน์ที่ 1 (📊 แกนเนื้อหา Data)',
        value: '🐍 คอร์ส A: 3 × 2 = 6 · 🎨 คอร์ส B: 3 × 0 = 0',
        detail: 'ดูคอลัมน์ 📊 Data แนวตั้ง: นำความชอบ Data ของ 👩 ฟ้า (3) ไปคูณกับเนื้อหา Data ของแต่ละคอร์ส',
        board: {
          type: 'v3-dot',
          stepMode: 'dim1',
          activeDim: 0,
          winnerHighlight: false,
          normHighlight: false
        },
        ops: [
          { label: 'ความชอบ Data ของฟ้า', value: 'p₁ = 3', tone: 'minus' },
          { label: '🐍 คอร์ส A (q₁ = 2)', value: '3 × 2 = +6 คะแนน', tone: 'plus' },
          { label: '🎨 คอร์ส B (q₁ = 0)', value: '3 × 0 = 0 คะแนน', tone: 'skip' },
          { label: 'สรุปแกน Data', value: '🐍 คอร์ส A นำอยู่ +6', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · คูณคอลัมน์ที่ 2 (🎨 แกนเนื้อหา Design) แล้วบวกรวมกัน',
        value: '🏆 🐍 คอร์ส A ได้ 6 + 0 = 6 ชนะ 🎨 คอร์ส B ที่ได้ 0 + 2 = 2',
        detail: 'ดูคอลัมน์ 🎨 Design แนวตั้ง (ฟ้า 1 × คอร์ส A 0 = 0, ฟ้า 1 × คอร์ส B 2 = 2) แล้วบวกทั้งสองแกนเข้าด้วยกัน',
        board: {
          type: 'v3-dot',
          stepMode: 'dim2-sum',
          activeDim: 1,
          winnerHighlight: true,
          normHighlight: false
        },
        ops: [
          { label: 'แกน 🎨 Design (p₂ = 1)', value: 'A: 1×0=0 · B: 1×2=2', tone: 'minus' },
          { label: 'รวม 🐍 คอร์ส A', value: '6 + 0 = 6 คะแนน', tone: 'plus' },
          { label: 'รวม 🎨 คอร์ส B', value: '0 + 2 = 2 คะแนน', tone: 'skip' },
          { label: 'ผลการจัดอันดับ', value: '🏆 แนะนำ 🐍 คอร์ส A', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · ทำไมต้องหารขนาดด้วย Cosine Similarity?',
        value: 'ถ้าปั๊มเลข 🐍 คอร์ส A เป็น (4, 0) → Dot พุ่ง 12 แต่ Cosine = 0.95 เท่าเดิม',
        detail: 'ถ้าคอร์ส A ปั๊มตัวเลขเป็น 2 เท่า (4, 0) ค่า Dot จะพุ่งจาก 6 เป็น 12 แต่ Cosine หารด้วยความยาวเวกเตอร์ จึงได้ 0.95 เท่าเดิม',
        board: {
          type: 'v3-dot',
          stepMode: 'cosine',
          activeDim: null,
          winnerHighlight: true,
          normHighlight: true
        },
        ops: [
          { label: 'ขนาดเวกเตอร์', value: '‖p‖ = √10 · ‖q_A‖ = 2', tone: 'minus' },
          { label: 'ถ้าปั๊มเป็น (4, 0)', value: 'Dot พุ่ง 6 → 12', tone: 'skip' },
          { label: 'หารด้วย ‖p‖·‖q‖', value: '12 ÷ (√10 × 4)', tone: 'plus' },
          { label: 'Cosine ไม่โดนหลอก', value: 'Cos = 0.95 เท่าเดิม', tone: 'result' }
        ]
      }
    ],
    log: [
      {
        title: 'ขั้นที่ 1 · เริ่มที่ 1 คลิก (2⁰ = 1)',
        value: 'x = 1 คลิก ↔ log₂(1) = 0',
        detail: 'เนื่องจาก 2⁰ = 1 ดังนั้น log₂(1) จึงเท่ากับ 0 (หากมี 0 คลิก จะใช้สูตร log₂(1 + x) เพื่อป้องกัน log(0))',
        board: { type: 'v3-log', activeIndex: 0, compareIndices: [] },
        ops: [
          { label: 'จำนวนคลิก (x)', value: '1 คลิก', tone: 'minus' },
          { label: 'รูปเลขยกกำลัง', value: '2⁰ = 1', tone: 'plus' },
          { label: 'ค่า log₂(x)', value: 'log₂(1) = 0', tone: 'result' },
          { label: 'กรณี x = 0', value: 'ใช้ log₂(1 + x)', tone: 'skip' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · เพิ่มเป็น 2 คลิก (2¹ = 2)',
        value: 'x = 2 คลิก (×2) ↔ log₂(2) = 1 (+1)',
        detail: 'เมื่อจำนวนคลิกเพิ่มเป็น 2 เท่า (1 → 2) ค่า log₂ ขยับขึ้นเพียง +1 ขั้น (0 → 1)',
        board: { type: 'v3-log', activeIndex: 1, compareIndices: [0] },
        ops: [
          { label: 'จำนวนคลิก (x)', value: '1 → 2 คลิก (×2)', tone: 'minus' },
          { label: 'รูปเลขยกกำลัง', value: '2¹ = 2', tone: 'skip' },
          { label: 'ค่า log₂(x)', value: 'log₂(2) = 1', tone: 'plus' },
          { label: 'การเปลี่ยนแปลง', value: 'คลิก ×2 → Log +1', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · เพิ่มเป็น 4 คลิก (2² = 4)',
        value: 'x = 4 คลิก (×2) ↔ log₂(4) = 2 (+1)',
        detail: 'คลิกเพิ่มเป็น 2 เท่าอีกครั้ง (2 → 4) แต่แท่งสีเขียวฟ้า log₂(4) ขยับจาก 1 เป็น 2 เท่านั้น',
        board: { type: 'v3-log', activeIndex: 2, compareIndices: [1] },
        ops: [
          { label: 'จำนวนคลิก (x)', value: '2 → 4 คลิก (×2)', tone: 'minus' },
          { label: 'รูปเลขยกกำลัง', value: '2² = 4', tone: 'skip' },
          { label: 'ค่า log₂(x)', value: 'log₂(4) = 2', tone: 'plus' },
          { label: 'การเปลี่ยนแปลง', value: 'คลิก ×2 → Log +1', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · พุ่งเป็น 8 คลิก (2³ = 8)',
        value: 'x = 8 คลิก (×2) ↔ log₂(8) = 3 (+1)',
        detail: 'แท่งคลิกดิบสีส้มพุ่งขึ้นเป็น 8 หน่วย แต่แท่ง log₂(8) = 3 ยังคงเรียงเป็นขั้นบันไดเรียบง่าย',
        board: { type: 'v3-log', activeIndex: 3, compareIndices: [2] },
        ops: [
          { label: 'จำนวนคลิก (x)', value: '4 → 8 คลิก (×2)', tone: 'minus' },
          { label: 'รูปเลขยกกำลัง', value: '2³ = 8', tone: 'skip' },
          { label: 'ค่า log₂(x)', value: 'log₂(8) = 3', tone: 'plus' },
          { label: 'การเปลี่ยนแปลง', value: 'คลิก ×2 → Log +1', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 5 · ยอดฮิต 16 คลิก (2⁴ = 16)',
        value: 'ดิบต่างกัน 8 เท่า (16 vs 2) → แปลง Log เหลือ 4 vs 1',
        detail: 'คอร์สฮิต 16 คลิกมีคลิกมากกว่า 2 คลิกถึง 8 เท่า แต่เมื่อแปลง log₂ เหลือ 4 ต่อ 1 ช่วยไม่ให้ของฮิตกลบคอร์สอื่นทั้งหมด',
        board: { type: 'v3-log', activeIndex: 4, compareIndices: [1, 4] },
        ops: [
          { label: 'จำนวนคลิก (x)', value: '16 คลิก (2⁴)', tone: 'minus' },
          { label: 'เทียบสเกลดิบ', value: '16 vs 2 (ห่าง 8 เท่า)', tone: 'skip' },
          { label: 'เทียบสเกล Log', value: '4 vs 1 (คุมสเกลอยู่หมัด)', tone: 'plus' },
          { label: 'ประยุกต์ใช้จริง', value: 'IDF & NDCG Discount', tone: 'result' }
        ]
      }
    ],
    'intro-pipeline': [
      {
        title: 'ด่านที่ 1 · ข้อมูลตั้งต้น (Inputs & Context)',
        value: '👩 ฟ้า ชอบสาย 📊 Data · คลังมี 4 คอร์สตัวแทน',
        detail: 'รับโปรไฟล์ของ 👩 ฟ้า (สนใจสาย Data) พร้อมคลังคอร์สทั้งหมด ทั้งวิชาที่เปิดสอนปกติและวิชาที่ปิดรับสมัครแล้ว',
        board: { type: 'v6-intro-pipeline', activeStage: 0 },
        ops: [
          { label: 'ผู้ใช้เป้าหมาย', value: '👩 ฟ้า (ชอบ 📊 Data)', tone: 'minus' },
          { label: 'คลังคอร์สตั้งต้น', value: '📊SQL · 🐍Py · 🔒AI · 🎨UX', tone: 'skip' },
          { label: 'บริบทขณะนั้น', value: 'เปิดหน้าแรก · ต้องการ Top-2', tone: 'plus' },
          { label: 'สถานะสายพาน', value: 'พร้อมเข้าด่านคัดกรอง', tone: 'result' }
        ]
      },
      {
        title: 'ด่านที่ 2 · คัดกรองผู้สมัคร (Candidate Generation)',
        value: 'คัดเร็วจากคลังใหญ่ → ตัด 🎨 UX ออก เหลือผู้สมัคร 3 คอร์ส',
        detail: 'ใช้โมเดลค้นหาความเร็วสูงดึงเฉพาะสาย Data: คัด 🎨 UX ตกไปตั้งแต่ด่านนี้ (คอร์สที่หลุดด่านแรกจะไม่มีสิทธิ์ถูกให้คะแนนอีก)',
        board: { type: 'v6-intro-pipeline', activeStage: 1 },
        ops: [
          { label: 'หน้าที่ด่านแรก', value: 'กรองเร็วเน้น High Recall', tone: 'minus' },
          { label: 'ผ่านเข้ารอบ (3)', value: '📊SQL · 🐍Python · 🔒AI', tone: 'plus' },
          { label: 'คัดตกด่านแรก (1)', value: '✕ 🎨 UX (หลุดถาวร)', tone: 'skip' },
          { label: 'กฎสำคัญ', value: 'หลุดด่านนี้ = จบสิทธิ์ทันที', tone: 'result' }
        ]
      },
      {
        title: 'ด่านที่ 3 · ให้คะแนนละเอียด (Scoring / Ranking)',
        value: '🔒 AI (0.96) > 📊 SQL (0.92) > 🐍 Python (0.88)',
        detail: 'นำผู้สมัครที่ผ่านด่านแรกมาคำนวณคะแนนความน่าจะชอบด้วยโมเดล ML/DL อย่างละเอียด (🎨 UX ไม่ถูกนำมาคิดคะแนนเพราะตกไปแล้ว)',
        board: { type: 'v6-intro-pipeline', activeStage: 2 },
        ops: [
          { label: 'คะแนนสูงสุด', value: '🔒 AI = 0.96', tone: 'minus' },
          { label: 'อันดับรองลงมา', value: '📊 SQL = 0.92 · 🐍 Py = 0.88', tone: 'plus' },
          { label: '🎨 คอร์ส UX', value: '— ไม่ได้เข้าคำนวณ', tone: 'skip' },
          { label: 'ส่งต่อด่านถัดไป', value: 'ตรวจความพร้อมใช้งานจริง', tone: 'result' }
        ]
      },
      {
        title: 'ด่านที่ 4 · ตรวจกฎธุรกิจ & Re-ranking',
        value: 'ตัด 🔒 AI (ปิดรับสมัคร) ออก → เลือก #1 📊 SQL และ #2 🐍 Python',
        detail: 'แม้ 🔒 AI จะได้คะแนนสูงสุด (0.96) แต่ปิดรับสมัครแล้ว กฎธุรกิจจึงต้องกรองออก แล้วดัน 📊 SQL กับ 🐍 Python ขึ้นเป็น Top-2',
        board: { type: 'v6-intro-pipeline', activeStage: 3 },
        ops: [
          { label: 'ตรวจกฎธุรกิจ', value: '🚫 ตัด 🔒 AI (ปิดรับแล้ว)', tone: 'minus' },
          { label: 'อันดับ #1 ใหม่', value: '🏆 📊 SQL (0.92)', tone: 'plus' },
          { label: 'อันดับ #2 ใหม่', value: '🥈 🐍 Python (0.88)', tone: 'skip' },
          { label: 'ผลลัพธ์ด่าน 4', value: 'ได้ Top-2 ที่สมัครเรียนได้จริง', tone: 'result' }
        ]
      },
      {
        title: 'ด่านที่ 5 · แสดงหน้าจอ Top-2 & เก็บ Feedback',
        value: 'แสดง #1 📊 SQL (ฟ้าคลิก ✓) และ #2 🐍 Python → บันทึก Exposure',
        detail: 'นำ Top-2 ขึ้นแสดงบนหน้าจอ พร้อมบันทึกว่าแสดงวิชาใด ที่อันดับใด และ 👩 ฟ้า คลิกวิชาไหน เพื่อนำไปฝึกโมเดลรอบถัดไป',
        board: { type: 'v6-intro-pipeline', activeStage: 4 },
        ops: [
          { label: 'แสดงบนจอ (K=2)', value: '#1 📊 SQL · #2 🐍 Python', tone: 'minus' },
          { label: 'พฤติกรรมของฟ้า', value: 'คลิกเรียน 📊 SQL ✓', tone: 'plus' },
          { label: 'สิ่งที่ต้องบันทึก', value: 'Exposure + Rank + Click', tone: 'skip' },
          { label: 'ครบรอบสายพาน', value: 'ส่ง Log ไปฝึกโมเดลรุ่นถัดไป', tone: 'result' }
        ]
      }
    ],
    'intro-ranking': [
      {
        title: 'ขั้นที่ 1 · ความชอบจริงของ 👩 ฟ้า และโควตาหน้าจอ Top-2',
        value: 'ความจริง: 🐍 A (5★) > 📊 B (4★) > 🎨 C (2★) · หน้าจอโชว์ได้ K = 2 ช่อง',
        detail: 'ในใจของ 👩 ฟ้า ชอบ 🐍 คอร์ส A ที่สุด (5★) รองลงมาคือ 📊 คอร์ส B (4★) ดังนั้นหน้าจอ Top-2 ที่ถูกต้องต้องเรียง #1 🐍 A แล้วตามด้วย #2 📊 B',
        board: { type: 'v2-intro-ranking', focusRow: 0, focusCol: null },
        ops: [
          { label: 'ความชอบจริงของฟ้า', value: '🐍 A=5★ · 📊 B=4★ · 🎨 C=2★', tone: 'minus' },
          { label: 'โควตาหน้าจอ (K)', value: 'Top-2 (แสดงแค่ 2 อันดับแรก)', tone: 'skip' },
          { label: 'ลำดับที่ถูกต้อง', value: '#1 🐍 คอร์ส A · #2 📊 คอร์ส B', tone: 'plus' },
          { label: '🎨 คอร์ส C (2★)', value: 'อยู่อันดับ 3 (ตกขอบจอ Top-2)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · ทดสอบ 🤖 โมเดล X (ทายตัวเลขดาวแม่น แต่เรียงอันดับผิด!)',
        value: 'ทาย 🐍 A = 4.4★, 📊 B = 4.5★ → MAE = 0.55★ (เลขแม่น) แต่เรียง #1 📊 B ผิด!',
        detail: 'โมเดล X ทายตัวเลขใกล้เคียงความจริงมาก (MAE ของ A, B = (0.6+0.5)÷2 = 0.55 ดาว) แต่ดันให้ 📊 B (4.5★) สูงกว่า 🐍 A (4.4★) ทำให้สลับเอาของที่ชอบน้อยกว่าขึ้นอันดับ #1',
        board: { type: 'v2-intro-ranking', focusRow: 1, focusCol: 5 },
        ops: [
          { label: 'คะแนนที่โมเดล X ทาย', value: '🐍 A=4.4★ · 📊 B=4.5★ · 🎨 C=2.0★', tone: 'minus' },
          { label: 'MAE (เทียบ A กับ B)', value: '(0.6 + 0.5) ÷ 2 = 0.55★', tone: 'plus' },
          { label: 'ลำดับที่ได้บนจอ', value: '❌ #1 📊 B · #2 🐍 A', tone: 'skip' },
          { label: 'ข้อสรุปโมเดล X', value: 'ทายเลขแม่น แต่จัดอันดับพัง!', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · ทดสอบ 🏆 โมเดล Y (ทายตัวเลขดาวเพี้ยน แต่เรียงอันดับถูกเป๊ะ!)',
        value: 'ทาย 🐍 A = 3.0★, 📊 B = 2.0★ → MAE = 2.00★ แต่เรียง #1 🐍 A > #2 📊 B ถูก!',
        detail: 'โมเดล Y ทายดาวต่ำกว่าจริงไปตัวละ 2 ดาว (MAE ของ A, B = 2.00) แต่รักษาลำดับ 🐍 A (3.0★) > 📊 B (2.0★) > 🎨 C (1.0★) ได้ถูกต้อง ทำให้หน้าจอ Top-2 ตรงใจฟ้า 100%',
        board: { type: 'v2-intro-ranking', focusRow: 2, focusCol: 5 },
        ops: [
          { label: 'คะแนนที่โมเดล Y ทาย', value: '🐍 A=3.0★ · 📊 B=2.0★ · 🎨 C=1.0★', tone: 'minus' },
          { label: 'MAE (เทียบ A กับ B)', value: '(2.0 + 2.0) ÷ 2 = 2.00★', tone: 'skip' },
          { label: 'ลำดับที่ได้บนจอ', value: '✅ #1 🐍 A · #2 📊 B (ถูกเป๊ะ)', tone: 'plus' },
          { label: 'ข้อสรุปโมเดล Y', value: 'ผู้ใช้แฮปปี้เพราะได้ลำดับที่ถูก!', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · สรุป: เลือก Metric ให้ตรงกับเป้าหมายหน้าจอ',
        value: 'ทายดาวใช้ MAE / RMSE · จัดหน้าจอ Top-K ต้องใช้ Precision@K / nDCG@K',
        detail: 'ผู้ใช้จริงไม่เห็นทศนิยมหลังบ้านแต่เห็นลำดับบนหน้าจอ Top-K ดังนั้นการวัดคุณภาพหน้าจอแนะนำจึงต้องใช้ Rank-aware Metrics เสมอ',
        board: { type: 'v2-intro-ranking', focusRow: null, focusCol: 5, summaryMode: true },
        ops: [
          { label: 'Rating Prediction', value: 'วัดด้วย MAE, RMSE (ยิ่งต่ำยิ่งดี)', tone: 'minus' },
          { label: 'Top-K Ranking', value: 'วัดด้วย P@K, nDCG@K (ยิ่งสูงยิ่งดี)', tone: 'plus' },
          { label: 'ความหมายของ K', value: 'จำนวนช่องแสดงผลบนหน้าจอ', tone: 'skip' },
          { label: 'ผู้ชนะบนหน้าจอจริง', value: '🏆 โมเดล Y ชนะในการจัดอันดับ', tone: 'result' }
        ]
      }
    ],
    'intro-cold-start': [
      {
        title: 'ขั้นที่ 1 · ผู้ใช้ใหม่ (User Cold Start)',
        value: 'แถวของผู้ใช้ใหม่ว่างทั้งแถว [ ? · ? · ? ] → แก้ด้วย Onboarding Survey',
        detail: 'เมื่อผู้ใช้เพิ่งสมัครใหม่ ยังไม่มีประวัติคลิกหรือให้ดาวเลย แถวในตารางจึงว่างเปล่า แก้โดยถามหมวดที่ชอบตอนสมัคร (Onboarding) หรือแนะนำของฮิตไปก่อน',
        board: { type: 'v1-cold-start', activeRow: 0 },
        ops: [
          { label: 'สิ่งที่ขาดหายไป', value: 'ประวัติของผู้ใช้ใหม่ (แถวว่าง)', tone: 'minus' },
          { label: 'ทำไม CF จึงพัง?', value: 'หาเพื่อนบ้านที่คล้ายกันไม่ได้', tone: 'skip' },
          { label: 'วิธีแก้ที่ได้ผลทันที', value: '📋 ถาม Onboarding Survey 3 ข้อ', tone: 'plus' },
          { label: 'แผนสำรองเมื่อไม่ถาม', value: 'ใช้บริบท + ของยอดนิยม (Popular)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · สินค้าใหม่ (Item Cold Start)',
        value: 'คอลัมน์คอร์สใหม่ 🥝 ว่างทั้งคอลัมน์ → แก้ด้วย Content-based Filtering',
        detail: 'คอร์สใหม่เพิ่งอัปโหลดขึ้นเว็บ ยังไม่มีใครเคยเรียนหรือให้ดาว แต่มีชื่อวิชาและแท็กครบถ้วน จึงใช้ Content-based อ่านแท็กไปจับคู่กับคนที่ชอบแนวนั้นได้ทันที',
        board: { type: 'v1-cold-start', activeRow: 1 },
        ops: [
          { label: 'สิ่งที่ขาดหายไป', value: 'ประวัติคนเรียนคอร์สนี้ (คอลัมน์ว่าง)', tone: 'minus' },
          { label: 'สิ่งที่คอร์สใหม่มีอยู่แล้ว', value: 'ชื่อวิชา · คำอธิบาย · แท็กหมวดหมู่', tone: 'plus' },
          { label: 'พระเอกที่มาช่วย', value: '🏷️ Content-based Filtering', tone: 'result' },
          { label: 'การเปิดโอกาสโชว์ตัว', value: 'กันพื้นที่สำรวจ (Exploration 5%)', tone: 'skip' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · ระบบเพิ่งเปิดวันแรก (System Cold Start)',
        value: 'ตารางว่างเปล่าทั้งผืน 100% → แก้ด้วย Knowledge-based & กฎผู้เชี่ยวชาญ',
        detail: 'แพลตฟอร์มเพิ่งเปิดตัววันแรก ไม่มีประวัติทั้งฝั่งผู้ใช้และฝั่งสินค้า ต้องเริ่มจากกฎความรู้โดเมน (Knowledge-based), แบบสอบถามสเปก, และเทรนด์ภายนอก',
        board: { type: 'v1-cold-start', activeRow: 2 },
        ops: [
          { label: 'สิ่งที่ขาดหายไป', value: 'ไม่มีประวัติทั้งคนและของ (ว่าง 100%)', tone: 'minus' },
          { label: 'สถานะโมเดล CF', value: '✕ ทำงานไม่ได้เลยในวันแรก', tone: 'skip' },
          { label: 'วิธีตั้งต้นระบบ', value: '🧭 กฎความรู้ (Knowledge-based)', tone: 'plus' },
          { label: 'ข้อมูลเสริมตั้งต้น', value: 'ดึงเทรนด์ภายนอก + คัดโดยผู้เชี่ยวชาญ', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · เทียบชัดๆ: Cold Start ต่างจาก Sparsity อย่างไร?',
        value: 'Cold Start = เพิ่งมาใหม่ไร้ประวัติ · Sparsity = อยู่มานานแต่ตารางแหว่ง 99%',
        detail: 'แม้ผู้ใช้และคอร์สจะอยู่ในระบบมานาน 2 ปีแล้ว แต่คนส่วนใหญ่เรียนแค่ไม่กี่วิชาจากหมื่นวิชา ตารางภาพรวมจึงยังเบาบาง (Sparsity) แก้ด้วย Matrix Factorization + Metadata',
        board: { type: 'v1-cold-start', activeRow: 3 },
        ops: [
          { label: 'Cold Start', value: 'ปัญหาของความใหม่ (0 ประวัติ)', tone: 'minus' },
          { label: 'Sparsity', value: 'อยู่มานานแต่ตารางว่าง 99%', tone: 'skip' },
          { label: 'ผลของ Sparsity', value: 'คนสองคนไม่เคยเรียนวิชาซ้ำกันเลย', tone: 'plus' },
          { label: 'วิธีแก้ Sparsity', value: '🧮 Matrix Factorization + Metadata', tone: 'result' }
        ]
      }
    ],
    'intro-feedback-loop': [
      {
        title: 'ขั้นที่ 1 · ระบบเก่าเลือกแสดงไม่เท่ากัน (Unequal Exposure)',
        value: 'โชว์ 🐍 คอร์ส A ถึง 80 ครั้ง · โชว์ 🎨 คอร์ส B แค่ 20 ครั้ง (ห่างกัน 4 เท่า)',
        detail: 'ระบบรุ่นก่อนหน้าลำเอียงนำ 🐍 คอร์ส A ไปแสดงบนหน้าจอมากกว่า 🎨 คอร์ส B ถึง 4 เท่า ทำให้จุดเริ่มต้นของข้อมูลไม่เท่าเทียมกัน',
        board: { type: 'v7-feedback-loop', activeCol: 1 },
        ops: [
          { label: 'โอกาสโชว์ 🐍 คอร์ส A', value: '80 ครั้ง (80% ของหน้าจอ)', tone: 'minus' },
          { label: 'โอกาสโชว์ 🎨 คอร์ส B', value: '20 ครั้ง (20% ของหน้าจอ)', tone: 'skip' },
          { label: 'สัดส่วนการมองเห็น', value: 'A ได้เปรียบ B ถึง 4 เท่า', tone: 'plus' },
          { label: 'ชื่ออคติที่เกิดขึ้น', value: 'Exposure Bias (อคติการแสดงผล)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · กับดักยอดคลิกดิบ (Raw Clicks Trap)',
        value: '🐍 คอร์ส A ได้ 16 คลิก vs 🎨 คอร์ส B ได้ 4 คลิก (ดูเหมือน A ชนะขาด 4 เท่า!)',
        detail: 'หากระบบบันทึกเฉพาะยอดคลิกดิบ (16 vs 4) โดยไม่บันทึกว่าแต่ละคอร์สถูกนำไปแสดงกี่ครั้ง โมเดลจะถูกหลอกว่าคอร์ส A ดีกว่าคอร์ส B ถึง 4 เท่า',
        board: { type: 'v7-feedback-loop', activeCol: 2 },
        ops: [
          { label: 'ยอดคลิกดิบ 🐍 คอร์ส A', value: '16 คลิก', tone: 'minus' },
          { label: 'ยอดคลิกดิบ 🎨 คอร์ส B', value: '4 คลิก', tone: 'skip' },
          { label: 'ถ้าดูแต่ยอดคลิกดิบ', value: '⚠️ เข้าใจผิดว่า A ดีกว่า B 4 เท่า', tone: 'plus' },
          { label: 'สิ่งที่ขาดหายไป', value: 'ขาดตัวหาร (จำนวนครั้งที่โชว์)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · ความจริงเมื่อหารด้วยโอกาสเห็น (True CTR = 20% เท่ากัน!)',
        value: '🐍 A: 16 ÷ 80 = 20% · 🎨 B: 4 ÷ 20 = 20% → คนชอบทั้งสองคอร์สเท่ากันเป๊ะ!',
        detail: 'เมื่อนำจำนวนคลิกหารด้วยจำนวนครั้งที่แสดง (CTR = Clicks ÷ Exposure) พบว่าทั้งสองคอร์สมีความน่าสนใจต่อสายตาผู้ใช้เท่ากันที่ 20%',
        board: { type: 'v7-feedback-loop', activeCol: 3 },
        ops: [
          { label: 'CTR จริงของ 🐍 คอร์ส A', value: '16 ÷ 80 = 20%', tone: 'plus' },
          { label: 'CTR จริงของ 🎨 คอร์ส B', value: '4 ÷ 20 = 20%', tone: 'plus' },
          { label: 'ข้อสรุปทางสถิติ', value: 'ความน่าสนใจ 20% เท่ากันเป๊ะ!', tone: 'result' },
          { label: 'บทเรียนสำคัญ', value: 'ห้ามตัดสินคุณภาพจากคลิกดิบ', tone: 'minus' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · วงจรสะท้อนกลับ (Feedback Loop) & ทางแก้',
        value: 'ถ้าเทรนด้วยคลิกดิบ 🎨 B จะจมหาย · ต้องบันทึก Exposure + แบ่งพื้นที่ Explore 10%',
        detail: 'เพื่อตัดวงจรอุบาทว์ (Filter Bubble) ระบบต้องบันทึก Exposure Log เสมอ และแบ่งพื้นที่ 5–10% บนหน้าจอเพื่อสุ่มสำรวจคอร์สที่ได้โชว์น้อย (Exploration)',
        board: { type: 'v7-feedback-loop', activeCol: 4 },
        ops: [
          { label: 'ถ้าเทรนจากคลิกดิบ', value: '🐍 A ผูกขาด 96% · 🎨 B จมหาย', tone: 'skip' },
          { label: 'ทางแก้ที่ 1 (Logging)', value: 'บันทึก Exposure + Position เสมอ', tone: 'minus' },
          { label: 'ทางแก้ที่ 2 (Policy)', value: 'แบ่งพื้นที่ Exploration 5–10%', tone: 'plus' },
          { label: 'ผลลัพธ์ที่ได้', value: '🛡️ ตัดวงจรอคติ & ค้นพบของดี', tone: 'result' }
        ]
      }
    ],
    'metrics-errors': [
      {
        title: 'ขั้นที่ 1 · ข้อมูลดาวจริงของ 👩 ฟ้า ทั้ง 6 คอร์ส (n = 6)',
        value: 'ดาวจริง r = [5★, 2★, 4★, 3★, 4★, 1★] · ตัวหาร n = 6 คอร์สที่มีคะแนนจริง',
        detail: 'เริ่มต้นจากคะแนนจริง r ของ 👩 ฟ้า ทั้ง 6 คอร์ส (🐍A=5, 🎨B=2, 📊C=4, 📈D=3, 📐E=4, 🖼️F=1) ซึ่งใช้เป็นตัวตั้งในการวัดความคลาดเคลื่อนของโมเดล R1 และ R2',
        board: { type: 'v4-metrics-errors', focusCol: 1, highlightOutlier: false, summaryFocus: false },
        ops: [
          { label: 'ผู้ใช้ที่ประเมิน', value: '👩 ฟ้า (รู้คะแนนครบ 6 คอร์ส)', tone: 'minus' },
          { label: 'คะแนนจริง (r)', value: '[5, 2, 4, 3, 4, 1]', tone: 'plus' },
          { label: 'นิยามความผิดพลาด', value: 'e = r − r̂ (จริง ลบ ทาย)', tone: 'skip' },
          { label: 'ตัวหาร (n)', value: 'n = 6 ช่องที่ประเมิน', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · โมเดล R1 (ผิดเล็กน้อย 4 คอร์ส คอร์สละ 1 ดาว)',
        value: '|e| = [1, 1, 0, 1, 1, 0] → Σ|e| = 4 · Σe² = 4 → MAE = 0.6667 · RMSE = 0.8165',
        detail: 'โมเดล R1 ทายพลาดไป 1 ดาวใน 4 คอร์ส (A, B, D, E) เมื่อยกกำลังสอง 1² = 1 เท่าเดิม ทำให้ผลรวม Σ|e| = 4 และ Σe² = 4',
        board: { type: 'v4-metrics-errors', focusCol: 2, highlightOutlier: false, summaryFocus: false },
        ops: [
          { label: 'ผลรวมค่าสัมบูรณ์ Σ|e|', value: '1 + 1 + 0 + 1 + 1 + 0 = 4', tone: 'minus' },
          { label: 'MAE ของ R1', value: '4 ÷ 6 ≈ 0.6667 ดาว', tone: 'skip' },
          { label: 'ผลรวมกำลังสอง Σe²', value: '1² + 1² + 0 + 1² + 1² + 0 = 4', tone: 'plus' },
          { label: 'RMSE ของ R1', value: '√(4 ÷ 6) ≈ 0.8165 ดาว 🏆', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · โมเดล R2 (ทายเป๊ะ 5 คอร์ส แต่หลุดก้อนใหญ่ที่ 📐 E!)',
        value: 'ที่ 📐 E: จริง 4★ ทาย 1★ → |e| = 3 แต่ e² = 9 💥 → MAE = 0.5000 · RMSE = 1.2247',
        detail: 'โมเดล R2 ทายถูกเป๊ะถึง 5 คอร์ส แต่พลาดที่ 📐 E คอร์สเดียวไปถึง 3 ดาว (|4 − 1| = 3) พอยกกำลังสองกลายเป็น 3² = 9 ดันให้ RMSE พุ่งสูงถึง 1.2247!',
        board: { type: 'v4-metrics-errors', focusCol: 3, highlightOutlier: true, summaryFocus: false },
        ops: [
          { label: 'แผลใหญ่ที่ 📐 คอร์ส E', value: '|4 − 1| = 3 → e² = 9 💥', tone: 'skip' },
          { label: 'MAE ของ R2', value: '3 ÷ 6 = 0.5000 ดาว 🏆', tone: 'plus' },
          { label: 'MSE ของ R2', value: '9 ÷ 6 = 1.5000 (ดาว²)', tone: 'minus' },
          { label: 'RMSE ของ R2', value: '√1.5 ≈ 1.2247 ดาว (แพ้ R1)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · สรุปเทียบ R1 vs R2: ทำไมผู้ชนะถึงสลับกัน?',
        value: 'MAE เลือก R2 (0.5000 < 0.6667) · แต่ RMSE เลือก R1 (0.8165 < 1.2247)',
        detail: 'MAE ถ่วงน้ำหนักความผิดทุกขนาดเท่ากันจึงให้ R2 ชนะ ส่วน RMSE ยกกำลังสองก่อนเฉลี่ยจึงลงโทษความผิดก้อนใหญ่ (Outlier) หนักกว่าและให้ R1 ชนะ',
        board: { type: 'v4-metrics-errors', focusCol: null, highlightOutlier: true, summaryFocus: true },
        ops: [
          { label: 'ถ้าใช้เกณฑ์ MAE', value: '🏆 R2 ชนะ (0.5000 < 0.6667)', tone: 'plus' },
          { label: 'ถ้าใช้เกณฑ์ RMSE', value: '🏆 R1 ชนะ (0.8165 < 1.2247)', tone: 'result' },
          { label: 'กลไกของ e² ใน RMSE', value: 'ขยายโทษแผลใหญ่ (3² = 9)', tone: 'skip' },
          { label: 'การเลือกใช้งาน', value: 'กลัวหลุดหนัก → ใช้ RMSE', tone: 'minus' }
        ]
      }
    ],
    'metrics-set': [
      {
        title: 'ขั้นที่ 1 · 👩 ฟ้า (ชอบจริง |Rᵤ| = 3 ชิ้น) กับหน้าจอ Top-3 (K = 3)',
        value: 'โมเดล S แนะนำ [🐍A✓, 📊C✓, 🎨B✕] → ถูก H = 2 ชิ้น → P@3 = 2/3 · R@3 = 2/3',
        detail: '👩 ฟ้า ชอบจริง 3 คอร์ส {🐍A, 📊C, 📐E} เมื่อโมเดล S แนะนำ Top-3 แล้วทายถูก H = 2 ชิ้น จึงได้ Precision@3 = 2/3 และ Recall@3 = 2/3 ≈ 0.6667',
        board: { type: 'v2-metrics-set', activeRow: 0 },
        ops: [
          { label: 'ของที่ฟ้าชอบจริง |Rᵤ|', value: '{🐍A, 📊C, 📐E} = 3 ชิ้น', tone: 'minus' },
          { label: 'ทายถูกใน Top-3 (H)', value: 'H = 2 ชิ้น (🐍A, 📊C)', tone: 'plus' },
          { label: 'Precision@3 (H ÷ K)', value: '2 ÷ 3 ≈ 0.6667', tone: 'result' },
          { label: 'Recall@3 (H ÷ |Rᵤ|)', value: '2 ÷ 3 ≈ 0.6667', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · 🧑 พลอย (ชอบจริง |Rᵤ| = 2 ชิ้น) · สังเกตตัวหารที่ต่างกัน!',
        value: 'โมเดล T แนะนำ [🎨B✓, 🐍A✕, 📈D✓] → H = 2 → P@3 = 2/3 แต่ Recall@3 = 2/2 = 1.0000!',
        detail: '🧑 พลอย มีคอร์สที่ชอบจริงทั้งหมดแค่ |Rᵤ| = 2 ชิ้น {🎨B, 📈D} เมื่อโมเดล T เก็บเข้า Top-3 ได้ครบทั้ง 2 ชิ้น จึงได้ Recall@3 = 2/2 = 1.0000 (เก็บของที่ชอบมาได้ครบ 100%)',
        board: { type: 'v2-metrics-set', activeRow: 3 },
        ops: [
          { label: 'ตัวหาร Precision@3', value: 'หารด้วย K = 3 → 2/3 ≈ 0.6667', tone: 'minus' },
          { label: 'ตัวหาร Recall@3', value: 'หารด้วย |Rᵤ| = 2 → 2/2 = 1.0000', tone: 'plus' },
          { label: 'F1@3 ของพลอย (T)', value: '2(2/3)(1) ÷ (5/3) = 0.8000', tone: 'result' },
          { label: 'HitRate@3 (มีถูก ≥1)', value: 'HR@3 = 1 (ผ่านเกณฑ์)', tone: 'skip' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · เมื่อทายไม่ถูกเลยแม้แต่ชิ้นเดียว (🧑 พลอย · โมเดล S)',
        value: 'โมเดล S แนะนำ [🐍A✕, 📊C✕, 📐E✕] → H = 0 → P@3 = 0 · R@3 = 0 · F1@3 = 0 · HR@3 = 0',
        detail: 'โมเดล S แนะนำคอร์สสาย Data ล้วนให้ 🧑 พลอย ที่ชอบสาย Design/Business ทำให้ใน Top-3 ไม่มีของที่พลอยชอบเลย (H = 0) ทุกค่าจึงเป็น 0 ทั้งหมด',
        board: { type: 'v2-metrics-set', activeRow: 2 },
        ops: [
          { label: 'หน้าจอ Top-3 โมเดล S', value: '[🐍A✕, 📊C✕, 📐E✕] → H = 0', tone: 'skip' },
          { label: 'Precision@3 & Recall@3', value: '0/3 = 0.0000 · 0/2 = 0.0000', tone: 'minus' },
          { label: 'กฎเมื่อ P + R = 0', value: 'กำหนด F1@3 = 0.0000 ทันที', tone: 'plus' },
          { label: 'HitRate@3', value: '0 (ไม่มีของที่ใช่ใน Top-3)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · จุดบอดของ Set Metrics: สลับอันดับใน Top-K แต่คะแนนเท่าเดิม!',
        value: '👩 ฟ้า: โมเดล S [✓, ✓, ✕] vs โมเดล T [✕, ✓, ✓] → ได้ P@3, R@3, F1@3 = 0.6667 เท่ากันเป๊ะ!',
        detail: 'แม้โมเดล T จะเอาของที่ไม่ชอบ (🎨B✕) ขึ้นอันดับ #1 แต่เพราะ Set Metrics นับแค่จำนวน H = 2 ในตะกร้า Top-3 โดยไม่ดูตำแหน่ง จึงแยกความต่างของ S กับ T บน 👩 ฟ้า ไม่ได้',
        board: { type: 'v2-metrics-set', activeRow: 1, compareRow: 0 },
        ops: [
          { label: 'โมเดล S (👩 ฟ้า)', value: '[#1 ✓, #2 ✓, #3 ✕] → H = 2', tone: 'plus' },
          { label: 'โมเดล T (👩 ฟ้า)', value: '[#1 ✕, #2 ✓, #3 ✓] → H = 2', tone: 'skip' },
          { label: 'คะแนน P@3, R@3, F1@3', value: '0.6667 เท่ากันทั้งสองโมเดล!', tone: 'minus' },
          { label: 'ทางออกเมื่อสนลำดับ', value: 'ต้องใช้ MRR, MAP หรือ nDCG', tone: 'result' }
        ]
      }
    ],
    'metrics-first': [
      {
        title: 'ขั้นที่ 1 · 👩 ฟ้า (โมเดล T): ของที่ใช่ชิ้นแรกอยู่ที่อันดับ r₁ = 2',
        value: 'Top-3: [#1 🎨B ✕, #2 🐍A ✓, #3 📊C ✓] → เจอชิ้นแรกที่อันดับ 2 → RR@3 = 1/2 = 0.5000',
        detail: 'ไล่สายตาจากอันดับ #1: ช่อง #1 คือ 🎨B (ไม่ชอบ ✕) พอถึงช่อง #2 เจอ 🐍A (ชอบ ✓) เป็นชิ้นแรก จึงหยุดทันทีที่ r₁ = 2 ได้คะแนน RR@3 = 1/2 = 0.5000',
        board: { type: 'v2-metrics-first', activeRow: 0 },
        ops: [
          { label: 'ช่อง #1 (🎨B 2★)', value: '✕ ไม่ใช่ของที่ชอบ (ข้ามไป)', tone: 'skip' },
          { label: 'ช่อง #2 (🐍A 5★)', value: '🎯 ชิ้นแรกที่ใช่! (r₁ = 2)', tone: 'plus' },
          { label: 'ช่อง #3 (📊C 4★)', value: '✓ ชอบแต่ไม่นับซ้ำใน RR', tone: 'minus' },
          { label: 'RR@3 (👩 ฟ้า · T)', value: '1 ÷ 2 = 0.5000', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · 🧑 พลอย (โมเดล T): ของที่ใช่ชิ้นแรกอยู่ที่อันดับ r₁ = 1',
        value: 'Top-3: [#1 🎨B ✓, #2 🐍A ✕, #3 📈D ✓] → เจอชิ้นแรกตั้งแต่ช่อง #1 → RR@3 = 1/1 = 1.0000',
        detail: 'สำหรับ 🧑 พลอย โมเดล T วาง 🎨B (5★ ✓) ไว้ที่อันดับ #1 พอดี จึงเจอของที่ใช่ตั้งแต่ช่องแรกสุด (r₁ = 1) ได้คะแนนเต็ม RR@3 = 1/1 = 1.0000',
        board: { type: 'v2-metrics-first', activeRow: 1 },
        ops: [
          { label: 'ช่อง #1 (🎨B 5★)', value: '🎯 ชิ้นแรกที่ใช่! (r₁ = 1)', tone: 'plus' },
          { label: 'ช่อง #2–#3', value: 'หยุดคิดทันทีหลังเจอชิ้นแรก', tone: 'skip' },
          { label: 'RR@3 (🧑 พลอย · T)', value: '1 ÷ 1 = 1.0000 (เต็ม)', tone: 'result' },
          { label: 'เทียบกับโมเดล S (พลอย)', value: 'ไม่เจอเลยใน Top-3 → RR = 0', tone: 'minus' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · เฉลี่ยข้ามผู้ใช้เป็น MRR@3 (Mean Reciprocal Rank)',
        value: 'MRR@3(T) = (0.5000 + 1.0000) ÷ 2 = 0.7500 🏆 · ชนะ MRR@3(S) = (1.0000 + 0) ÷ 2 = 0.5000',
        detail: 'เมื่อนำ RR@3 ของ 👩 ฟ้า และ 🧑 พลอย มาหาค่าเฉลี่ย: โมเดล T ได้ (0.50 + 1.00)/2 = 0.7500 ส่วนโมเดล S ได้ (1.00 + 0.00)/2 = 0.5000',
        board: { type: 'v2-metrics-first', activeRow: 3 },
        ops: [
          { label: 'RR@3 โมเดล S (ฟ้า, พลอย)', value: '1.0000 และ 0.0000', tone: 'minus' },
          { label: 'MRR@3 ของโมเดล S', value: '(1.00 + 0.00) ÷ 2 = 0.5000', tone: 'skip' },
          { label: 'RR@3 โมเดล T (ฟ้า, พลอย)', value: '0.5000 และ 1.0000', tone: 'plus' },
          { label: 'MRR@3 ของโมเดล T', value: '(0.50 + 1.00) ÷ 2 = 0.7500 🏆', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · ข้อควรระวัง: RR มองข้ามของดีชิ้นที่ 2, 3, ... ในลิสต์',
        value: 'ต่อให้ช่อง #3 เป็น 📊C ✓ หรือเป็นของที่ไม่ชอบ ✕ ค่า RR@3 ของฟ้าก็ยังเป็น 0.5000 เท่าเดิม',
        detail: 'RR และ MRR เหมาะกับงานที่ผู้ใช้ต้องการคลิกของที่ใช่เพียงชิ้นเดียวแล้วจบ (เช่น ค้นหาทางลัด) แต่ถ้าต้องการวัดคุณภาพหลายชิ้นในลิสต์ ต้องใช้ AP@K หรือ nDCG@K',
        board: { type: 'v2-metrics-first', activeRow: 0, highlightIgnore: true },
        ops: [
          { label: 'จุดแข็งของ RR / MRR', value: 'เข้าใจง่าย · เน้นชิ้นแรกที่เจอ', tone: 'plus' },
          { label: 'จุดบอดสำคัญ', value: 'ไม่ให้รางวัลของดีชิ้นที่ 2, 3', tone: 'skip' },
          { label: 'งานที่เหมาะกับ MRR', value: 'ค้นหาคำตอบเดียว / ดูคลิปแรก', tone: 'minus' },
          { label: 'ถ้าอยากวัดทั้งลิสต์', value: 'ขยับไปใช้ MAP@K หรือ nDCG@K', tone: 'result' }
        ]
      }
    ],
    'metrics-ap': [
      {
        title: 'ขั้นที่ 1 · 👩 ฟ้า (โมเดล T): คิด Precision เฉพาะจุดที่เจอของที่ชอบ (✓)',
        value: 'ลำดับ [🎨B✕, 🐍A✓, 📊C✓] → จุดที่ใช่คือ k=2 (P@2 = 1/2) และ k=3 (P@3 = 2/3)',
        detail: 'ไล่ทีละอันดับ: k=1 เป็น 🎨B✕ (ไม่บวกเข้าผลรวม), k=2 เจอ 🐍A✓ (ถูก 1 จาก 2 ช่อง → P@2 = 1/2), k=3 เจอ 📊C✓ (ถูก 2 จาก 3 ช่อง → P@3 = 2/3)',
        board: { type: 'v2-metrics-ap', activeRow: 0 },
        ops: [
          { label: 'ที่ k = 1 (🎨B ✕)', value: 'rel₁ = 0 → ข้าม (ไม่บวก)', tone: 'skip' },
          { label: 'ที่ k = 2 (🐍A ✓)', value: 'rel₂ = 1 → บวก P@2 = 1/2', tone: 'plus' },
          { label: 'ที่ k = 3 (📊C ✓)', value: 'rel₃ = 1 → บวก P@3 = 2/3', tone: 'plus' },
          { label: 'ผลรวมตัวเศษ Σ(P@k·relₖ)', value: '1/2 + 2/3 = 7/6 ≈ 1.1667', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · หารด้วย m = min(K, |Rᵤ|) และเทียบกับ โมเดล S ของ 👩 ฟ้า',
        value: 'ฟ้ามี m = min(3, 3) = 3 → AP@3(T) = (7/6)÷3 = 7/18 ≈ 0.3889 · ส่วน AP@3(S) = (1+1)÷3 = 2/3 ≈ 0.6667',
        detail: 'ตัวหารของฟ้าคือ m = min(3, 3) = 3 ทำให้โมเดล T ได้ AP@3 = 7/18 ≈ 0.3889 ในขณะที่โมเดล S เรียง [🐍A✓, 📊C✓, 🎨B✕] ได้ (1/1 + 2/2) ÷ 3 = 2/3 ≈ 0.6667 ชนะขาด!',
        board: { type: 'v2-metrics-ap', activeRow: 1 },
        ops: [
          { label: 'ตัวหาร m ของ 👩 ฟ้า', value: 'min(K=3, |Rᵤ|=3) = 3', tone: 'minus' },
          { label: 'AP@3 (👩 ฟ้า · โมเดล T)', value: '(1/2 + 2/3) ÷ 3 = 7/18 ≈ 0.3889', tone: 'skip' },
          { label: 'AP@3 (👩 ฟ้า · โมเดล S)', value: '(1/1 + 2/2) ÷ 3 = 2/3 ≈ 0.6667 🏆', tone: 'plus' },
          { label: 'ทำไม S ชนะ T บนฟ้า?', value: 'S ดันของใช่ขึ้น #1 และ #2', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · 🧑 พลอย (โมเดล T): เมื่อของที่ชอบจริงมีแค่ |Rᵤ| = 2 ชิ้น',
        value: 'ลำดับ [🎨B✓, 🐍A✕, 📈D✓] → P@1 = 1, P@3 = 2/3 · หารด้วย m = min(3, 2) = 2 → AP@3 = 5/6 ≈ 0.8333',
        detail: 'พลอยมีคอร์สที่ชอบจริงแค่ 2 วิชา ตัวหารจึงเป็น m = min(3, 2) = 2 (ไม่หารด้วย 3 เพื่อไม่ลงโทษเกินจำนวนของที่ชอบจริง) ได้ AP@3 = (1 + 2/3) ÷ 2 = 5/6 ≈ 0.8333',
        board: { type: 'v2-metrics-ap', activeRow: 2 },
        ops: [
          { label: 'จุดที่ใช่ของพลอย (T)', value: 'k=1 (P@1=1) และ k=3 (P@3=2/3)', tone: 'plus' },
          { label: 'ตัวหาร m ของ 🧑 พลอย', value: 'min(K=3, |Rᵤ|=2) = 2', tone: 'minus' },
          { label: 'AP@3 (🧑 พลอย · โมเดล T)', value: '(1 + 2/3) ÷ 2 = 5/6 ≈ 0.8333 🏆', tone: 'result' },
          { label: 'AP@3 (🧑 พลอย · โมเดล S)', value: 'ไม่มีของใช่เลย → 0.0000', tone: 'skip' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · เฉลี่ยข้ามผู้ใช้เป็น MAP@3 (Mean Average Precision)',
        value: 'MAP@3(T) = (7/18 + 15/18) ÷ 2 = 11/18 ≈ 0.6111 🏆 · ชนะ MAP@3(S) = (2/3 + 0) ÷ 2 = 0.3333',
        detail: 'เมื่อนำ AP@3 ของผู้ใช้ทุกคนมาหาค่าเฉลี่ย จะได้ MAP@3: โมเดล T ได้ (0.3889 + 0.8333)/2 = 0.6111 ชนะโมเดล S ที่ได้ (0.6667 + 0)/2 = 0.3333',
        board: { type: 'v2-metrics-ap', activeRow: 3 },
        ops: [
          { label: 'MAP@3 ของโมเดล S', value: '(0.6667 + 0.0000) ÷ 2 = 0.3333', tone: 'skip' },
          { label: 'MAP@3 ของโมเดล T', value: '(0.3889 + 0.8333) ÷ 2 = 0.6111 🏆', tone: 'plus' },
          { label: 'ความต่างของสูตรตัวหาร', value: 'ต้องระบุว่าหาร min(K,|Rᵤ|) หรือ |Rᵤ|', tone: 'minus' },
          { label: 'ข้อจำกัดของ AP / MAP', value: 'ใช้กับ Binary (0/1) เท่านั้น', tone: 'result' }
        ]
      }
    ],
    'metrics-dcg': [
      {
        title: 'ขั้นที่ 1 · น้ำหนักส่วนลดตามตำแหน่ง 1 / log₂(k + 1) และเพดาน IDCG@3',
        value: 'น้ำหนักช่อง #1 = 1.0000 · ช่อง #2 ≈ 0.6309 · ช่อง #3 = 0.5000 → IDCG@3 (ฟ้า) = 2.1309',
        detail: 'ยิ่งอยู่อันดับล่าง คนยิ่งเห็นน้อยลงตามส่วนลด log₂(k+1) สำหรับ 👩 ฟ้า ที่มีของชอบ 3 ชิ้น ลำดับในฝัน (Ideal) คือวางของที่ชอบครบทั้ง 3 ช่องแรก ได้ IDCG@3 = 1 + 0.6309 + 0.5 = 2.1309',
        board: { type: 'v2-metrics-dcg', activeRow: 0 },
        ops: [
          { label: 'น้ำหนักอันดับ #1 (k=1)', value: '1 ÷ log₂(2) = 1.0000', tone: 'plus' },
          { label: 'น้ำหนักอันดับ #2 (k=2)', value: '1 ÷ log₂(3) ≈ 0.6309', tone: 'plus' },
          { label: 'น้ำหนักอันดับ #3 (k=3)', value: '1 ÷ log₂(4) = 0.5000', tone: 'minus' },
          { label: 'เพดานสูงสุด IDCG@3 (ฟ้า)', value: '1 + 0.6309 + 0.5 = 2.1309', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · คำนวณ DCG@3 และ nDCG@3 ของ โมเดล S (👩 ฟ้า)',
        value: 'โมเดล S: [#1 🐍A✓, #2 📊C✓, #3 🎨B✕] → DCG@3 = 1.6309 → nDCG@3 = 1.6309 / 2.1309 ≈ 0.7654',
        detail: 'โมเดล S วางของที่ใช่ไว้ที่ช่อง #1 (+1.0000) และช่อง #2 (+0.6309) ส่วนช่อง #3 ไม่ใช่ (+0) รวม DCG@3 = 1.6309 พอหารด้วย IDCG@3 (2.1309) จึงได้ nDCG@3 ≈ 0.7654',
        board: { type: 'v2-metrics-dcg', activeRow: 1 },
        ops: [
          { label: 'คะแนนที่ได้ในแต่ละช่อง', value: '#1 (+1.0000) + #2 (+0.6309) + #3 (0)', tone: 'plus' },
          { label: 'DCG@3 (👩 ฟ้า · S)', value: '1.6309', tone: 'minus' },
          { label: 'ตัวหารปรับสเกล (IDCG@3)', value: '2.1309', tone: 'skip' },
          { label: 'nDCG@3 (👩 ฟ้า · S)', value: '1.6309 ÷ 2.1309 ≈ 0.7654 🏆', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · คำนวณ DCG@3 และ nDCG@3 ของ โมเดล T (👩 ฟ้า)',
        value: 'โมเดล T: [#1 🎨B✕, #2 🐍A✓, #3 📊C✓] → DCG@3 = 1.1309 → nDCG@3 = 1.1309 / 2.1309 ≈ 0.5307',
        detail: 'โมเดล T เสียช่อง #1 ที่มีค่ามากที่สุดไปให้ 🎨B✕ (0 คะแนน) แล้วเพิ่งได้คะแนนที่ช่อง #2 (+0.6309) และช่อง #3 (+0.5000) รวม DCG@3 = 1.1309 → nDCG@3 ≈ 0.5307',
        board: { type: 'v2-metrics-dcg', activeRow: 2 },
        ops: [
          { label: 'เสียโอกาสที่ช่อง #1', value: '#1 เป็น 🎨B✕ → ได้ 0.0000', tone: 'skip' },
          { label: 'คะแนนช่อง #2 + ช่อง #3', value: '0.6309 + 0.5000 = 1.1309', tone: 'minus' },
          { label: 'nDCG@3 (👩 ฟ้า · T)', value: '1.1309 ÷ 2.1309 ≈ 0.5307', tone: 'plus' },
          { label: 'เทียบ S vs T บน 👩 ฟ้า', value: 'S (0.7654) ชนะ T (0.5307) ชัดเจน', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · ทำไมต้องหารด้วย IDCG@K? (เทียบกับ 🧑 พลอย ที่มีของชอบ 2 ชิ้น)',
        value: '🧑 พลอย มีของชอบแค่ 2 ชิ้น → เพดาน IDCG@3 = 1 + 0.6309 + 0 = 1.6309 (ไม่ถึง 2.1309)',
        detail: 'เพราะแต่ละคนมีจำนวนของที่ชอบไม่เท่ากัน (ฟ้ามี 3 ชิ้น เพดาน 2.1309 · พลอยมี 2 ชิ้น เพดาน 1.6309) การหารด้วย IDCG@K ของใครของมันจึงช่วยปรับสเกลให้เต็ม 1.0000 เท่ากันก่อนนำมาเฉลี่ย',
        board: { type: 'v2-metrics-dcg', activeRow: 3 },
        ops: [
          { label: 'IDCG@3 ของ 👩 ฟ้า (ชอบ 3)', value: '1 + 0.6309 + 0.5 = 2.1309', tone: 'minus' },
          { label: 'IDCG@3 ของ 🧑 พลอย (ชอบ 2)', value: '1 + 0.6309 + 0 = 1.6309', tone: 'plus' },
          { label: 'nDCG@3 ของพลอย (โมเดล T)', value: '1.5000 ÷ 1.6309 ≈ 0.9197', tone: 'result' },
          { label: 'จุดเด่นอีกข้อของ nDCG', value: 'รองรับทั้ง Binary และระดับดาว', tone: 'skip' }
        ]
      }
    ],
    'metrics-auc': [
      {
        title: 'ขั้นที่ 1 · แยกกลุ่มบวก 3 ชิ้น และกลุ่มลบ 3 ชิ้น (รวม 3 × 3 = 9 คู่)',
        value: 'ลำดับโมเดล T (👩 ฟ้า): #1 🎨B✕ → #2 🐍A✓ → #3 📊C✓ → #4 📈D✕ → #5 🖼️F✕ → #6 📐E✓',
        detail: 'AUC วัดว่าเมื่อสุ่มหยิบของที่ชอบ 1 ชิ้น (i⁺ ∈ {A, C, E}) มาเทียบกับของที่ไม่ชอบ 1 ชิ้น (j⁻ ∈ {B, D, F}) โมเดลจัดให้ของที่ชอบอยู่อันดับดีกว่ากี่คู่จากทั้งหมด 3 × 3 = 9 คู่',
        board: { type: 'v2-metrics-auc', activeRow: null },
        ops: [
          { label: 'กลุ่มบวก i⁺ (3 ชิ้น)', value: '🐍A (#2) · 📊C (#3) · 📐E (#6)', tone: 'plus' },
          { label: 'กลุ่มลบ j⁻ (3 ชิ้น)', value: '🎨B (#1) · 📈D (#4) · 🖼️F (#5)', tone: 'skip' },
          { label: 'จำนวนคู่เปรียบเทียบทั้งหมด', value: '3 × 3 = 9 คู่', tone: 'minus' },
          { label: 'เกณฑ์ชนะในแต่ละคู่', value: 'อันดับ i⁺ ต้องสูงกว่า j⁻', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · ตรวจแถว 🐍 คอร์ส A (#2) และ 📊 คอร์ส C (#3)',
        value: '🐍 A (#2) ชนะ {📈D, 🖼️F} = 2 คู่ · 📊 C (#3) ชนะ {📈D, 🖼️F} = 2 คู่ (แพ้ 🎨B อันดับ #1 ทั้งคู่)',
        detail: 'ทั้ง 🐍 A (อันดับ 2) และ 📊 C (อันดับ 3) ต่างแพ้ให้ 🎨 B ที่แย่งอันดับ #1 ไป แต่ยังอยู่สูงกว่า 📈 D (#4) และ 🖼️ F (#5) จึงชนะฝั่งละ 2 คู่ รวมเป็น 4 คู่',
        board: { type: 'v2-metrics-auc', activeRow: 0, secondRow: 1 },
        ops: [
          { label: '🐍 คอร์ส A (อันดับ #2)', value: 'แพ้ B(#1) · ชนะ D(#4), F(#5) → 2/3', tone: 'plus' },
          { label: '📊 คอร์ส C (อันดับ #3)', value: 'แพ้ B(#1) · ชนะ D(#4), F(#5) → 2/3', tone: 'plus' },
          { label: 'คู่ที่สะสมได้ตอนนี้', value: '2 + 2 = 4 คู่ที่ชนะ', tone: 'minus' },
          { label: 'ตัวการที่ตัดแต้ม', value: '🎨 B ✕ ที่ขึ้นไปขวางอันดับ #1', tone: 'skip' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · ตรวจแถว 📐 คอร์ส E (#6) ที่ตกไปอยู่อันดับบ๊วยสุด',
        value: '📐 E อยู่อันดับ #6 (ต่ำกว่า 🎨B #1, 📈D #4, 🖼️F #5 ทั้งหมด) → ชนะ 0 / 3 คู่!',
        detail: 'เพราะโมเดล T ดันเอา 📐 E ที่ฟ้าชอบ (4★ ✓) ไปไว้ท้ายสุดที่อันดับ #6 จึงแพ้รายการลบทุกตัว (B, D, F) ได้ 0 คู่',
        board: { type: 'v2-metrics-auc', activeRow: 2 },
        ops: [
          { label: '📐 คอร์ส E (อันดับ #6)', value: 'อยู่ท้ายสุดของคลัง 6 รายการ', tone: 'skip' },
          { label: 'เทียบกับ B(#1), D(#4), F(#5)', value: '✕ แพ้รวดทั้ง 3 คู่ (0/3)', tone: 'minus' },
          { label: 'ผลรวมคู่ที่ชนะทั้งหมด', value: '2 + 2 + 0 = 4 คู่ จาก 9 คู่', tone: 'plus' },
          { label: 'AUC (👩 ฟ้า · โมเดล T)', value: '4 ÷ 9 ≈ 0.4444 (ต่ำกว่าสุ่ม 0.5)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · สรุปเทียบ AUC (ดูทั้งคลัง) vs nDCG@K (เน้นหัวแถว)',
        value: 'โมเดล T ได้ AUC = 4/9 ≈ 0.4444 · ส่วน โมเดล S เรียง [A✓, C✓, B✕, D✕, E✓, F✕] ได้ 8/9 ≈ 0.8889',
        detail: 'AUC ให้ความสำคัญกับทุกคู่ในคลังเท่ากัน (ไม่ว่าคู่ผิดจะเกิดที่หัวแถวหรือท้ายแถว) จึงมักใช้ตรวจภาพรวมการแยกแยะ คู่กับ nDCG@K ที่เน้นหน้าจอ Top-K',
        board: { type: 'v2-metrics-auc', activeRow: 3 },
        ops: [
          { label: 'AUC โมเดล T (👩 ฟ้า)', value: '4 ÷ 9 ≈ 0.4444', tone: 'skip' },
          { label: 'AUC โมเดล S (👩 ฟ้า)', value: '(3 + 3 + 2) ÷ 9 = 8/9 ≈ 0.8889 🏆', tone: 'plus' },
          { label: 'ถ้าเกิดอันดับเสมอกัน (Tie)', value: 'ให้นับคู่ที่เสมอเป็น 0.5 คะแนน', tone: 'minus' },
          { label: 'ข้อจำกัดของ AUC', value: 'ไม่ถ่วงน้ำหนักเน้นหัวแถวเหมือน nDCG', tone: 'result' }
        ]
      }
    ],
    'eval-coverage': [
      {
        title: 'ขั้นที่ 1 · รวมรายการที่ปรากฏบนหน้าจอ Top-3 ของทุกคน (โมเดล S)',
        value: '👩 ฟ้า ได้ [🐍A, 📊C, 🎨B] · 🧑 พลอย ได้ [🐍A, 📊C, 📐E] → รวมไม่ซ้ำได้ {A, B, C, E} = 4 คอร์ส',
        detail: 'นำรายการที่โมเดล S แนะนำใน Top-3 ของผู้ใช้ทุกคนมารวมกันแบบไม่ซ้ำ (Union): พบว่ามีคอร์สที่ได้ขึ้นจอ 4 รายการ คือ 🐍A, 🎨B, 📊C, 📐E',
        board: { type: 'v7-eval-coverage', activeMode: 'union' },
        ops: [
          { label: 'Top-3 ของ 👩 ฟ้า (S)', value: '{🐍A, 📊C, 🎨B}', tone: 'minus' },
          { label: 'Top-3 ของ 🧑 พลอย (S)', value: '{🐍A, 📊C, 📐E}', tone: 'minus' },
          { label: 'รวมไม่ซ้ำ (Union)', value: '{🐍A, 🎨B, 📊C, 📐E} = 4 วิชา', tone: 'plus' },
          { label: 'คอร์สที่ตกหล่น (0 ครั้ง)', value: '📈 D และ 🖼️ F ไม่เคยถูกแนะนำเลย', tone: 'skip' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · คำนวณความครอบคลุมคลัง (Catalog Coverage@3)',
        value: 'Catalog Coverage@3 = จำนวนคอร์สที่ถูกแนะนำอย่างน้อย 1 ครั้ง (4) ÷ คลังทั้งหมด (6) = 4/6 ≈ 0.6667',
        detail: 'จากคอร์สทั้งหมดในคลัง 6 รายการ โมเดล S นำมาแสดงให้ผู้ใช้เห็นได้ 4 รายการ คิดเป็น Catalog Coverage@3 = 4/6 ≈ 66.67% (อีก 33.33% เป็นมุมอับที่ไม่มีใครเห็น)',
        board: { type: 'v7-eval-coverage', activeMode: 'coverage' },
        ops: [
          { label: 'คอร์สที่ได้ขึ้นจอ', value: '4 รายการ (🐍A, 🎨B, 📊C, 📐E)', tone: 'plus' },
          { label: 'คอร์สทั้งหมดในคลัง (|I|)', value: '6 รายการ (A ถึง F)', tone: 'minus' },
          { label: 'Catalog Coverage@3', value: '4 ÷ 6 ≈ 0.6667 (66.7%)', tone: 'result' },
          { label: 'ข้อจำกัดของ Coverage', value: 'ไม่บอกว่าใน 4 ชิ้นนั้นผูกขาดแค่ไหน', tone: 'skip' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · เรียงความถี่การแสดงผลจากน้อยไปมาก (ต้องรวมรายการ 0 ครั้งด้วย!)',
        value: 'ความถี่การโชว์ c = (D:0, F:0, B:1, E:1, A:2, C:2) · รวมพื้นที่แสดงผล Σc = 6 ช่อง',
        detail: 'กฎเหล็กของการคำนวณ Gini บนคลังสินค้า: ต้องนำคอร์สที่ไม่เคยถูกแนะนำเลย (D=0, F=0) มาเรียงเข้าแถวด้วยเสมอ ได้ลำดับ c₁..c₆ = (0, 0, 1, 1, 2, 2)',
        board: { type: 'v7-eval-coverage', activeMode: 'sort' },
        ops: [
          { label: 'กลุ่ม 0 ครั้ง (i=1, 2)', value: '📈 D (0) · 🖼️ F (0) — ห้ามตัดทิ้ง!', tone: 'skip' },
          { label: 'กลุ่ม 1 ครั้ง (i=3, 4)', value: '🎨 B (1) · 📐 E (1)', tone: 'minus' },
          { label: 'กลุ่ม 2 ครั้ง (i=5, 6)', value: '🐍 A (2) · 📊 C (2) — ฮิตสุด', tone: 'plus' },
          { label: 'ผลรวมช่องแสดงผล (Σc)', value: '0 + 0 + 1 + 1 + 2 + 2 = 6 ช่อง', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · คำนวณดัชนีความกระจุกตัว Gini Index = 4/9 ≈ 0.4444',
        value: 'Σ (2i − n − 1)·cᵢ = 0 + 0 − 1 + 1 + 6 + 10 = 16 → Gini = 16 ÷ (6 × 6) = 4/9 ≈ 0.4444',
        detail: 'แทนค่าในสูตร Gini: ตัวเศษได้ 16 หารด้วย n × Σc = 6 × 6 = 36 ได้ Gini = 16/36 = 4/9 ≈ 0.4444 (ยิ่งใกล้ 0 ยิ่งกระจายเท่าเทียม, ยิ่งใกล้ 1 ยิ่งผูกขาด)',
        board: { type: 'v7-eval-coverage', activeMode: 'gini' },
        ops: [
          { label: 'ผลรวมตัวเศษ Σ(2i−7)cᵢ', value: '0 + 0 − 1 + 1 + 6 + 10 = 16', tone: 'plus' },
          { label: 'ตัวหาร (n × Σc)', value: '6 รายการ × 6 ช่อง = 36', tone: 'minus' },
          { label: 'ค่า Gini Index (โมเดล S)', value: '16 ÷ 36 = 4/9 ≈ 0.4444', tone: 'result' },
          { label: 'วิธีอ่านค่า Gini', value: '0 = เท่ากันเป๊ะ · เข้าใกล้ 1 = ผูกขาด', tone: 'skip' }
        ]
      }
    ],
    'eval-time-split': [
      {
        title: 'ขั้นที่ 1 · แยกบทบาท 3 ชุดข้อมูลตามเส้นเวลา (Train → Validation → Test)',
        value: '📅 วัน 1–3: Train (ฝึกโมเดล) → 📅 วัน 4: Validation (จูนค่า) → 📅 วัน 5–6: Test (วัดผลสุดท้าย)',
        detail: 'การพยากรณ์อนาคตต้องเลียนแบบเข็มนาฬิกาจริง: ให้โมเดลเรียนจากอดีต (วัน 1–3) เลือกค่า K หรือน้ำหนักบนวัน 4 แล้วตรวจคำตอบครั้งสุดท้ายบนวัน 5–6',
        board: { type: 'v8-eval-time-split', activeRow: 0 },
        ops: [
          { label: '🏋️ Train (วัน 1–3)', value: 'ใช้เรียนพารามิเตอร์และสถิติ', tone: 'plus' },
          { label: '🎛️ Validation (วัน 4)', value: 'ใช้เลือก Hyperparameter / โมเดล', tone: 'minus' },
          { label: '🔒 Test (วัน 5–6)', value: 'ใช้ประเมินขั้นสุดท้ายครั้งเดียว', tone: 'result' },
          { label: 'ข้อห้ามเด็ดขาด', value: 'ห้ามนำ Test มาใช้จูนเลือกค่า', tone: 'skip' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · Global Temporal Split (ตัดจุดเวลาเดียวทั้งระบบ)',
        value: 'ขีดเส้นตัด ณ สิ้นวัน 3 พร้อมกันทุกคน → ไม่มีการดึงเหตุการณ์หลังจุดตัดมาปนใน Train',
        detail: 'Global Temporal Split ใช้จุดตัดเวลาเดียวกันทั้งระบบ จึงจำลองสถานการณ์จริงที่ระบบต้องตัดสินใจ ณ วันนั้นได้ดีที่สุด แต่ต้องมีนโยบายรับมือผู้ใช้/คอร์สใหม่หลังจุดตัด',
        board: { type: 'v8-eval-time-split', activeRow: 1 },
        ops: [
          { label: 'จุดตัดเวลา (Cutoff)', value: 'ใช้เส้นเวลาเดียวกันทั้งระบบ', tone: 'plus' },
          { label: 'ข้อดีหลัก', value: 'ไม่มีข้อมูลอนาคตข้ามผู้ใช้รั่วไหล', tone: 'result' },
          { label: 'สิ่งที่ต้องเตรียมรับมือ', value: 'ผู้ใช้/คอร์สที่เพิ่งมาใหม่ในวัน 4–6', tone: 'minus' },
          { label: 'การ Refit ก่อนเปิด Test', value: 'รวมวัน 1–4 ฝึกซ้ำตามแผนได้', tone: 'skip' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · Per-user Temporal vs Random Split (จุดที่ต้องระวัง)',
        value: 'Random Split สุ่มเอาวัน 6 มาช่วยทายวัน 2 (รั่วเวลา!) · Per-user ต้องระวังเวลาข้ามคน',
        detail: 'Random Split สุ่มเหตุการณ์ปนกันทุกวัน จึงเผลอใช้ข้อมูลอนาคตมาทายอดีต ส่วน Per-user Temporal กันช่วงท้ายของแต่ละคนไว้ แต่ Train ของคนหนึ่งอาจเกิดหลัง Test ของอีกคนได้',
        board: { type: 'v8-eval-time-split', activeRow: 2 },
        ops: [
          { label: 'Random Split', value: '⚠️ ดึงอนาคตมาช่วยทายอดีต', tone: 'skip' },
          { label: 'Per-user Temporal', value: 'เรียงเวลาภายในคนเดียวกัน', tone: 'minus' },
          { label: 'ข้อควรระวัง Per-user', value: 'Train คนอื่นอาจเกิดหลัง Test อีกคน', tone: 'plus' },
          { label: 'Leave-One-Out (LOO)', value: 'ต้องระบุว่าหยิบชิ้นสุดท้ายตามเวลาไหม', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · ความพร้อมของคอร์สและข้อมูล ณ เวลาที่แนะนำ',
        value: '🆕 📐 คอร์ส E เปิดตัววัน 5 → ห้ามนำ 📐 E ไปเป็น Candidate ตอนจำลองคำแนะนำในวัน 3!',
        detail: 'แม้ในไฟล์ข้อมูลวันนี้จะมีคอร์ส E อยู่ แต่ถ้าคอร์ส E เพิ่งเปิดวัน 5 ตอนจำลองการตัดสินใจ ณ วัน 3 ระบบในอดีตย่อมยังไม่รู้จักคอร์ส E จึงต้องคัดออกจากตัวเลือกในวัน 3',
        board: { type: 'v8-eval-time-split', activeRow: 3 },
        ops: [
          { label: 'เวลาที่คอร์ส 📐 E เปิดตัว', value: 'เปิดตัวครั้งแรกในวัน 5', tone: 'skip' },
          { label: 'จำลองคำแนะนำ ณ วัน 3', value: '🚫 ห้ามมี 📐 E ใน Candidate set', tone: 'minus' },
          { label: 'จำลองคำแนะนำ ณ วัน 5–6', value: '✅ มีสิทธิ์แนะนำ 📐 E ได้ตามจริง', tone: 'plus' },
          { label: 'หลักการตรวจสอบ', value: 'ข้อมูลต้องพร้อม ณ เวลาที่ตัดสินใจ', tone: 'result' }
        ]
      }
    ],
    'eval-leakage': [
      {
        title: 'ขั้นที่ 1 · Statistic Leakage: เผลอ fit สถิติหรือความนิยมจากทุกวันก่อนแบ่ง Split',
        value: '❌ fit TF-IDF / นับความนิยมจากวัน 1–6 ก่อนแบ่ง → ✅ ต้อง Split ก่อน แล้ว fit บน Train (วัน 1–3) เท่านั้น',
        detail: 'แม้ไม่ได้ส่งดาว Test ให้โมเดลตรงๆ แต่ถ้านับว่าคอร์สใดดังหรือ fit TF-IDF/Scaler จากข้อมูลทุกวันก่อนแบ่ง โมเดลก็แอบรู้เทรนด์อนาคตของวัน 5–6 ไปเรียบร้อยแล้ว',
        board: { type: 'v8-eval-leakage', activeRow: 0 },
        ops: [
          { label: '❌ พฤติกรรมที่รั่ว', value: 'fit สถิติจากทั้งตารางก่อน Split', tone: 'skip' },
          { label: 'ทำไมถึงรั่ว?', value: 'IDF / ความนิยมแอบจำข้อมูลวัน 5–6', tone: 'minus' },
          { label: '✅ ขั้นตอนที่ถูกต้อง', value: 'Split → fit(Train) → transform(Test)', tone: 'plus' },
          { label: 'บทเรียนสำคัญ', value: 'ไม่ส่งดาว Test ก็ยังรั่วผ่านสถิติได้', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · Profile Leakage: เผลอนำคะแนนใน Test มาสร้างโปรไฟล์ผู้ใช้',
        value: '❌ คำนวณเวกเตอร์ความชอบหรือค่าเฉลี่ย r̄ᵤ รวมดาวใน Test → ✅ ใช้เฉพาะประวัติใน Train',
        detail: 'หากสร้างโปรไฟล์ผู้ใช้หรือหาเพื่อนบ้านโดยเผลอรวมคะแนนที่ถูกซ่อนไว้ในชุด Test เท่ากับแอบป้อนคำตอบกลับเข้าไปเป็น Input ของโมเดล',
        board: { type: 'v8-eval-leakage', activeRow: 1 },
        ops: [
          { label: '❌ พฤติกรรมที่รั่ว', value: 'สร้าง User Profile รวมข้อมูลวัน 5–6', tone: 'skip' },
          { label: 'ผลที่เกิดขึ้น', value: 'คะแนน Offline สูงหลอกตา (Overoptimistic)', tone: 'minus' },
          { label: '✅ ขั้นตอนที่ถูกต้อง', value: 'สร้างโปรไฟล์จากประวัติใน Train ล้วน', tone: 'plus' },
          { label: 'เมื่อนำไปใช้จริง', value: 'ระบบมีแค่ประวัติอดีตให้ใช้เท่านั้น', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · Population Filtering Leakage: คัดกรองคนจากจำนวนคลิกในอนาคต',
        value: '❌ คัดเฉพาะคนที่เรียนครบ ≥10 วิชาเมื่อนับถึงวัน 6 → ✅ คัดกรองตามข้อมูลที่มีสิทธิ์รู้ ณ จุดตัดเวลา',
        detail: 'การตัดผู้ใช้ที่มียอดรวมน้อยออกโดยนับรวมถึงอนาคต (วัน 6) เป็นการใช้ข้อมูลอนาคตเลือกกลุ่มตัวอย่าง ต้องคัดจากข้อมูลที่มีอยู่จริง ณ เวลาตัดสินใจและรายงานจำนวนคนที่ถูกคัดออก',
        board: { type: 'v8-eval-leakage', activeRow: 2 },
        ops: [
          { label: '❌ พฤติกรรมที่รั่ว', value: 'ใช้อนาคตคัดเลือกกลุ่มประชากรทดลอง', tone: 'skip' },
          { label: 'ทำไมถึงเป็นปัญหา?', value: 'ณ วัน 3 ยังไม่รู้ว่าใครจะเรียนต่อ', tone: 'minus' },
          { label: '✅ ขั้นตอนที่ถูกต้อง', value: 'คัดจากประวัติถึงวันตัด + รายงานจำนวน', tone: 'plus' },
          { label: 'ความโปร่งใส', value: 'ระบุเกณฑ์คัดออกใน Protocol card', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · Test Set Tuning Leakage: แอบดูผล Test หลายรอบเพื่อเลือกโมเดลที่ชนะ',
        value: '❌ รันปรับค่าบน Test ซ้ำๆ แล้วเลือกตัวที่คะแนนสูงสุด → ✅ จูนบน Validation · เปิด Test ครั้งสุดท้าย',
        detail: 'แม้ไม่ได้นำ Test ไปฝึก Gradient แต่การลองผิดลองถูกหลายรอบแล้วเลือกโมเดลจากคะแนน Test ทำให้ Test กลายเป็นชุดจูนและสูญเสียความเป็นอิสระทันที',
        board: { type: 'v8-eval-leakage', activeRow: 3 },
        ops: [
          { label: '❌ พฤติกรรมที่รั่ว', value: 'เลือกโมเดล/Seed ที่ได้คะแนน Test สูงสุด', tone: 'skip' },
          { label: 'ผลเสียทางสถิติ', value: 'Test กลายเป็น Validation (ไม่อิสระ)', tone: 'minus' },
          { label: '✅ ขั้นตอนที่ถูกต้อง', value: 'จูนบน Validation · ล็อกโมเดลก่อน Test', tone: 'plus' },
          { label: 'คำถามเช็ก Leakage ทุกจุด', value: '“ตอนใช้งานจริง รู้ค่านี้หรือยัง?”', tone: 'result' }
        ]
      }
    ],
    'eval-sampling': [
      {
        title: 'ขั้นที่ 1 · โจทย์ตั้งต้น: คลัง 6 รายการ (บวก 🐍 A 1 ชิ้น · ลบ B–F 5 ชิ้น) · K = 1',
        value: 'โมเดล P วาง 🐍 A ที่อันดับ (2, 2) · โมเดล Q วาง 🐍 A ที่อันดับ (1, 6) ของผู้ใช้สองคน',
        detail: 'มีผู้ใช้ 2 คน แต่ละคนชอบ 🐍 คอร์ส A เพียง 1 รายการ และไม่ชอบอีก 5 รายการ (B–F) หน้าจอแสดงได้แค่ K = 1 ช่อง (ต้องได้ที่ #1 เท่านั้นจึงจะได้คะแนน HR@1)',
        board: { type: 'v4-eval-sampling', activeCol: 1 },
        ops: [
          { label: 'ขนาดคลังทั้งหมด (N)', value: '6 รายการ (บวก 1 · ลบ 5)', tone: 'minus' },
          { label: 'โควตาหน้าจอ (K)', value: 'K = 1 (ต้องได้ที่ #1 จึงจะ Hit)', tone: 'skip' },
          { label: 'อันดับ 🐍 A จากโมเดล P', value: 'คน 1 ได้ #2 · คน 2 ได้ #2', tone: 'plus' },
          { label: 'อันดับ 🐍 A จากโมเดล Q', value: 'คน 1 ได้ #1 · คน 2 ได้ #6', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · วัดเต็มคลัง (Full Catalog Evaluation): 🏆 โมเดล Q ชนะ!',
        value: 'Full HR@1(P) = (0 + 0) ÷ 2 = 0.00 · Full HR@1(Q) = (1 + 0) ÷ 2 = 0.50 🏆 (Q ชนะชัดเจน)',
        detail: 'เมื่อแข่งกับคู่แข่งครบทั้ง 6 รายการ: โมเดล P ได้อันดับ #2 ทั้งสองคนจึงไม่ได้แต้มที่ K=1 เลย (Full HR@1 = 0) ส่วนโมเดล Q ทายคนแรกได้ที่ #1 จึงได้ Full HR@1 = 0.50 ชนะไป',
        board: { type: 'v4-eval-sampling', activeCol: 2 },
        ops: [
          { label: 'Full HR@1 ของโมเดล P', value: 'ได้ที่ #2 ทั้งคู่ → 0/2 = 0.00', tone: 'skip' },
          { label: 'Full HR@1 ของโมเดล Q', value: 'ได้ที่ #1 หนึ่งคน → 1/2 = 0.50 🏆', tone: 'plus' },
          { label: 'ผู้ชนะแบบ Full Catalog', value: '🏆 โมเดล Q ชนะ (0.50 > 0.00)', tone: 'result' },
          { label: 'ความยากของโจทย์', value: '🐍 A ต้องชนะลบครบทั้ง 5 ตัว', tone: 'minus' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · เมื่อสุ่มลบมาแข่งแค่ m = 1 จาก 5 ตัว: ทำไมโมเดล P พุ่งเป็น 0.80?',
        value: '🐍 A อยู่อันดับ #2 แปลว่ามีลบชนะ A แค่ 1 ตัว และลบแพ้ A ถึง 4 ตัว → โอกาสชนะ = 4/5 = 0.80!',
        detail: 'พอเปลี่ยนมาสุ่มลบแค่ 1 ตัวจาก 5 ตัวมาแข่งกับ 🐍 A: สำหรับโมเดล P ที่มีลบอยู่เหนือ A แค่ 1 ตัว และอยู่ใต้ A ถึง 4 ตัว โอกาสที่สุ่มโดนลบด้านล่างจึงสูงถึง 4/5 = 0.80 ต่อคน!',
        board: { type: 'v4-eval-sampling', activeCol: 3 },
        ops: [
          { label: 'ลบที่อยู่เหนือ 🐍 A (โมเดล P)', value: 'มีแค่ 1 ตัว (โอกาสแพ้ = 1/5)', tone: 'skip' },
          { label: 'ลบที่อยู่ใต้ 🐍 A (โมเดล P)', value: 'มีถึง 4 ตัว (โอกาสชนะ = 4/5)', tone: 'plus' },
          { label: 'Sampled HR@1 ของ P', value: 'คาดหมาย 4/5 = 0.80 ต่อคน!', tone: 'result' },
          { label: 'Sampled HR@1 ของ Q', value: 'คนแรก 1.0 · คนสอง 0.0 → เฉลี่ย 0.50', tone: 'minus' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · เกิดปรากฏการณ์ Winner Flip (ผู้ชนะพลิกกลับขั้ว!)',
        value: 'Full Catalog: Q ชนะ (0.50 > 0.00) · แต่ Sampled (m=1): P พลิกชนะ (0.80 > 0.50)!',
        detail: 'การลดจำนวนคู่แข่งด้วยการสุ่มลบ (Negative Sampling) ทำให้ลำดับถูกบีบและเปลี่ยนผู้ชนะได้แม้โมเดลไม่เปลี่ยน จึงห้ามนำคะแนน Sampled ไปเทียบกับ Full ตรงๆ เด็ดขาด',
        board: { type: 'v4-eval-sampling', activeCol: 4 },
        ops: [
          { label: 'เมื่อวัด Full Catalog (N=6)', value: '🏆 โมเดล Q ชนะ (0.50 vs 0.00)', tone: 'minus' },
          { label: 'เมื่อวัด Sampled (m=1)', value: '🏆 โมเดล P พลิกชนะ (0.80 vs 0.50)', tone: 'plus' },
          { label: 'ชื่อปรากฏการณ์', value: 'Winner Flip (ผู้ชนะสลับขั้ว)', tone: 'skip' },
          { label: 'กฎการรายงานผล', value: 'ต้องระบุ Full หรือ Sampled m=... เสมอ', tone: 'result' }
        ]
      }
    ],
    'eval-bootstrap': [
      {
        title: 'ขั้นที่ 1 · จับคู่คะแนน S และ T ของผู้ใช้คนเดิม (Paired Differences Δᵢ)',
        value: 'u₁..u₄: S = [0.40, 0.50, 0.60, 0.70] · T = [0.44, 0.51, 0.58, 0.75] → Δ = [+0.04, +0.01, −0.02, +0.05]',
        detail: 'เพราะทั้งสองโมเดลถูกทดสอบบนผู้ใช้ชุดเดียวกัน (u₁..u₄) เราจึงห้ามแยกสุ่มอิสระ แต่ต้องจับคู่คำนวณผลต่างรายคน Δᵢ = Tᵢ − Sᵢ เพื่อรักษาโครงสร้างความยากง่ายของแต่ละคนไว้',
        board: { type: 'v4-eval-bootstrap', activeRow: null, focusCol: 3 },
        ops: [
          { label: 'หลักการ Paired Test', value: 'ล็อกคู่คะแนน (Sᵢ, Tᵢ) ของคนเดิม', tone: 'plus' },
          { label: 'ค่าเฉลี่ยโมเดล S (S̄)', value: '(0.40+0.50+0.60+0.70)÷4 = 0.5500', tone: 'minus' },
          { label: 'ค่าเฉลี่ยโมเดล T (T̄)', value: '(0.44+0.51+0.58+0.75)÷4 = 0.5700', tone: 'minus' },
          { label: 'ผลต่างเฉลี่ย (Mean Δ)', value: '+0.0200 (ดูเผินๆ เหมือน T ชนะ)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · สังเกตรายบุคคล: ค่าเฉลี่ยเป็นบวก แต่มีผู้ใช้ u₃ แย่ลง!',
        value: 'u₁ (+0.04), u₂ (+0.01), u₄ (+0.05) ดีขึ้น · แต่ u₃ ได้ Δ₃ = 0.58 − 0.60 = −0.02 (แย่ลง!)',
        detail: 'การดูแต่ค่าเฉลี่ยรวม (+0.02) อาจบดบังว่ามีผู้ใช้บางกลุ่มเสียประโยชน์ เช่น u₃ ที่คะแนนลดลงจาก 0.60 เหลือ 0.58 (Δ = −0.02)',
        board: { type: 'v4-eval-bootstrap', activeRow: 2, focusCol: 3 },
        ops: [
          { label: 'คนที่คะแนนดีขึ้น', value: 'u₁ (+0.04), u₂ (+0.01), u₄ (+0.05)', tone: 'plus' },
          { label: 'คนที่คะแนนแย่ลง', value: '⚠️ u₃: 0.60 → 0.58 (Δ = −0.02)', tone: 'skip' },
          { label: 'ทำไมต้องดูรายคน/กลุ่ม?', value: 'ค่าเฉลี่ยบวกไม่ได้แปลว่าดีขึ้นทุกคน', tone: 'minus' },
          { label: 'คำถามต่อไป', value: '+0.02 นี้นิ่งพอหรือแค่บังเอิญ?', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · สุ่มผู้ใช้แบบคืน (Paired Bootstrap Resampling 4⁴ = 256 ชุด)',
        value: 'สุ่มหยิบ Δᵢ แบบใส่คืนครั้งละ 4 คน (เช่น ได้ [u₃, u₃, u₂, u₃] เฉลี่ยได้ −0.0125) เพื่อดูการกระจายตัว',
        detail: 'จำลองว่าถ้ากลุ่มผู้ใช้เปลี่ยนไปผลต่างจะแกว่งแค่ไหน โดยสุ่มหยิบผู้ใช้ 4 คนแบบใส่คืนทั้งหมด 256 รูปแบบ แล้วเรียงค่าเฉลี่ยจากน้อยไปมากเพื่อหา Percentile 95%',
        board: { type: 'v4-eval-bootstrap', activeRow: 4, focusCol: 3 },
        ops: [
          { label: 'หน่วยการสุ่ม (Resampling Unit)', value: 'สุ่มระดับผู้ใช้ (เก็บคู่ S/T ไว้ด้วยกัน)', tone: 'plus' },
          { label: 'จำนวนชุดที่เป็นไปได้ (4⁴)', value: '256 ชุดตัวอย่างซ้ำ', tone: 'minus' },
          { label: 'ชุดที่สุ่มได้ u₃ เยอะ', value: 'ค่าเฉลี่ยผลต่างติดลบ (< 0)', tone: 'skip' },
          { label: '95% Percentile CI', value: '[−0.0050, +0.0450]', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · อ่านค่า 95% CI ที่คร่อมศูนย์ และกฎ Holm–Bonferroni',
        value: 'CI = [−0.0050, +0.0450] คร่อม 0 → ยังไม่มีหลักฐานชัดว่า T ดีกว่า S (แต่ไม่ได้พิสูจน์ว่า S = T)',
        detail: 'เพราะช่วงความเชื่อมั่นเริ่มตั้งแต่ฝั่งติดลบ (−0.0050) ไปจนถึงฝั่งบวก (+0.0450) จึงยังสรุปไม่ได้ว่า T ชนะจริง และถ้าเทียบหลายคู่พร้อมกันต้องปรับเกณฑ์ α ด้วยวิธี Holm เสมอ',
        board: { type: 'v4-eval-bootstrap', activeRow: 4, focusCol: 4 },
        ops: [
          { label: 'ช่วงความเชื่อมั่น 95% CI', value: '[−0.0050, +0.0450] (คร่อมศูนย์!)', tone: 'skip' },
          { label: 'การตีความที่ถูกต้อง', value: 'ยังไม่มีหลักฐานชัดของผลต่าง', tone: 'result' },
          { label: 'ข้อห้ามในการสรุป', value: 'ห้ามสรุปว่าพิสูจน์ได้ว่า S = T เป๊ะ', tone: 'minus' },
          { label: 'เมื่อเทียบหลายคู่ (Holm)', value: 'เรียง p-value · หยุดทันทีที่ขั้นแรกไม่ผ่าน', tone: 'plus' }
        ]
      }
    ],
    'eval-counterfactual': [
      {
        title: 'ขั้นที่ 1 · คำนวณน้ำหนักความสำคัญ (Importance Weight w = π / π₀)',
        value: 'เหตุการณ์ 1: w₁ = 0.25 / 0.50 = 0.50 · เหตุการณ์ 2: w₂ = 0.50 / 0.25 = 2.00',
        detail: 'เพื่อประเมินนโยบายใหม่ (π) จาก Log ของระบบเก่า (π₀) เราต้องถ่วงน้ำหนักแต่ละเหตุการณ์ด้วย w = π(a|x) / π₀(a|x) เพื่อลดบทบาทสิ่งที่ระบบเก่าโชว์บ่อยเกิน และเพิ่มน้ำหนักสิ่งที่ระบบใหม่อยากโชว์',
        board: { type: 'v7-eval-counterfactual', activeRow: 0, secondRow: 1, focusMode: 'weights' },
        ops: [
          { label: 'สูตรน้ำหนัก IPS (w)', value: 'w = π(ใหม่) ÷ π₀(เก่า)', tone: 'plus' },
          { label: 'เหตุการณ์ที่ 1 (r₁ = 1)', value: 'w₁ = 0.25 ÷ 0.50 = 0.50', tone: 'minus' },
          { label: 'เหตุการณ์ที่ 2 (r₂ = 0)', value: 'w₂ = 0.50 ÷ 0.25 = 2.00', tone: 'minus' },
          { label: 'ผลตอบแทนถ่วงน้ำหนัก (w·r)', value: 'w₁r₁ = 0.50 · w₂r₂ = 0.00', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · คำนวณตัวประมาณ IPS (Inverse Propensity Scoring)',
        value: 'IPS = Σ(wₖ rₖ) ÷ n = (0.50 + 0.00) ÷ 2 = 0.2500 (หารด้วยจำนวนเหตุการณ์ n = 2)',
        detail: 'สูตร IPS นำผลรวมของผลตอบแทนถ่วงน้ำหนัก Σ(wₖ rₖ) = 0.50 มาหารด้วยจำนวนเหตุการณ์ทั้งหมด n = 2 ได้ค่าประมาณผลตอบแทนของนโยบายใหม่ = 0.2500',
        board: { type: 'v7-eval-counterfactual', activeRow: 3, focusMode: 'ips' },
        ops: [
          { label: 'ตัวเศษ Σ(wₖ rₖ)', value: '(0.50 × 1) + (2.00 × 0) = 0.50', tone: 'plus' },
          { label: 'ตัวหารของ IPS (n)', value: 'n = 2 เหตุการณ์', tone: 'minus' },
          { label: 'ค่าประมาณ IPS', value: '0.50 ÷ 2 = 0.2500', tone: 'result' },
          { label: 'จุดอ่อนของ IPS', value: 'ถ้า π₀ เล็กมาก w จะพุ่งจน Variance สูง', tone: 'skip' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · คำนวณตัวประมาณ SNIPS (Self-Normalized IPS)',
        value: 'SNIPS = Σ(wₖ rₖ) ÷ Σwₖ = 0.50 ÷ (0.50 + 2.00) = 0.50 ÷ 2.50 = 0.2000',
        detail: 'สูตร SNIPS เปลี่ยนตัวหารจาก n เป็นผลรวมของน้ำหนักทั้งหมด Σwₖ = 0.50 + 2.00 = 2.50 ได้ค่า 0.50 / 2.50 = 0.2000 ช่วยคุมสเกลให้อยู่ในช่วง [0, 1] และลดความแปรปรวน',
        board: { type: 'v7-eval-counterfactual', activeRow: 3, focusMode: 'snips' },
        ops: [
          { label: 'ตัวเศษ Σ(wₖ rₖ)', value: '0.50 (เท่ากับ IPS)', tone: 'plus' },
          { label: 'ตัวหารของ SNIPS (Σwₖ)', value: '0.50 + 2.00 = 2.50', tone: 'minus' },
          { label: 'ค่าประมาณ SNIPS', value: '0.50 ÷ 2.50 = 0.2000', tone: 'result' },
          { label: 'ข้อแลกเปลี่ยน (Trade-off)', value: 'ลด Variance แต่มี Bias ในตัวอย่างเล็ก', tone: 'skip' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · เงื่อนไขสำคัญ: Overlap (π₀ > 0) และ Weight Clipping',
        value: 'ถ้าระบบเก่าไม่เคยโชว์เลย (π₀ = 0) แต่ระบบใหม่อยากโชว์ (π = 0.30) → 0.30/0 หารศูนย์! (ขาด Overlap)',
        detail: 'IPS และ SNIPS จะทำงานได้ก็ต่อเมื่อระบบเก่าเคยเปิดโอกาสสุ่มแสดงรายการนั้นบ้าง (Overlap: π₀ > 0 ทุกจุดที่ π > 0) หาก π₀ = 0 จะไม่มีหลักฐานใน Log เลยและไม่มีสูตรใดเสกคำตอบขึ้นมาได้',
        board: { type: 'v7-eval-counterfactual', activeRow: 2, focusMode: 'overlap' },
        ops: [
          { label: 'กรณี π₀ = 0 แต่ π > 0', value: '💥 ขาด Overlap (หารด้วย 0 ไม่ได้)', tone: 'skip' },
          { label: 'วิธีป้องกันตั้งแต่ต้นทาง', value: 'แบ่งพื้นที่สุ่มสำรวจ (Exploration) เก็บ π₀', tone: 'plus' },
          { label: 'การจำกัดเพดานน้ำหนัก (Clipping)', value: 'ลด Variance แต่เพิ่ม Bias', tone: 'minus' },
          { label: 'Doubly Robust (DR)', value: 'ผสานโมเดลทายรางวัล + น้ำหนัก IPS', tone: 'result' }
        ]
      }
    ],
    'cb-text': [
      {
        title: 'ขั้นที่ 1 · ทำความสะอาดและปรับมาตรฐานคำ (Lowercasing & Tokenization)',
        value: '"Python! DATA data" → ["python", "data", "data"] (รวมตัวพิมพ์ใหญ่–เล็กเป็นคำเดียวกัน)',
        detail: 'ลบเครื่องหมายวรรคตอนและแปลงเป็นตัวพิมพ์เล็กทั้งหมด เพื่อให้ "Python", "PYTHON" และ "python" แมปเข้าคอลัมน์เดียวกัน (สำหรับภาษาไทยต้องระวังห้ามลบคำปฏิเสธ "ไม่" เป็น Stopword)',
        board: { type: 'v1-cb-text', activeRow: 0, focusMode: 'clean' },
        ops: [
          { label: 'ข้อความดิบของ 🐍 T1', value: '"Python! DATA data"', tone: 'minus' },
          { label: 'หลังทำ Lowercase & ตัดคำ', value: '["python", "data", "data"]', tone: 'plus' },
          { label: 'ประโยชน์ของ Lowercasing', value: 'ไม่แตกเป็นหลายมิติซ้ำซ้อน', tone: 'result' },
          { label: 'ข้อควรระวังภาษาไทย', value: '⚠️ ห้ามลบคำปฏิเสธ "ไม่" ทิ้ง!', tone: 'skip' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · สร้างพจนานุกรมจากชุดฝึกเท่านั้น (Fit Vocabulary on Train T1–T4)',
        value: 'Vocabulary (4 มิติ) = [python, data, design, art] (ห้ามนำชุด Test มาร่วมสร้างเด็ดขาด)',
        detail: 'รวบรวมคำศัพท์เฉพาะจากคอร์สในชุดฝึก T1–T4 ได้พจนานุกรม 4 คำ การแอบนำข้อความจากชุดทดสอบ (Test) มาร่วมสร้างพจนานุกรมหรือคำนวณ IDF ตั้งแต่ต้นถือเป็น Data Leakage',
        board: { type: 'v1-cb-text', activeRow: null, focusMode: 'vocab' },
        ops: [
          { label: 'ชุดข้อมูลที่ใช้สร้างคลังคำ', value: 'Train T1–T4 เท่านั้น (4 คอร์ส)', tone: 'plus' },
          { label: 'พจนานุกรมที่ได้ (4 มิติ)', value: '[python, data, design, art]', tone: 'result' },
          { label: 'ข้อห้าม Data Leakage', value: '🚫 ห้าม Fit รวมชุด Test เด็ดขาด', tone: 'skip' },
          { label: 'โครงสร้างตาราง', value: 'แถว = คอร์ส · คอลัมน์ = คำศัพท์', tone: 'minus' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · นับความถี่คำลงตาราง Document–Term Matrix (Bag-of-Words)',
        value: '🐍 T1 = [1, 2, 0, 0] · 📊 T2 = [1, 1, 0, 0] · 🎨 T3 = [0, 0, 1, 1] · 📈 T4 = [0, 1, 1, 0]',
        detail: 'นับจำนวนครั้งที่แต่ละคำปรากฏในคอร์ส (ไม่สนใจลำดับไวยากรณ์) เช่น 🐍 T1 มี python 1 ครั้ง และ data 2 ครั้ง จึงกลายเป็นเวกเตอร์แถว [1, 2, 0, 0]',
        board: { type: 'v1-cb-text', activeRow: 0, focusMode: 'counts' },
        ops: [
          { label: 'เวกเตอร์ 🐍 T1 (Python)', value: '[1, 2, 0, 0] (data ซ้ำ 2 ครั้ง)', tone: 'plus' },
          { label: 'เวกเตอร์ 📊 T2 (วิเคราะห์)', value: '[1, 1, 0, 0]', tone: 'minus' },
          { label: 'เวกเตอร์ 🎨 T3 & 📈 T4', value: 'T3=[0,0,1,1] · T4=[0,1,1,0]', tone: 'minus' },
          { label: 'แบบจำลอง Bag-of-Words', value: 'นับความถี่คำโดยไม่สนลำดับคำ', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · แปลงคอร์สใหม่ด้วยพจนานุกรมเดิม & จัดการคำนอกคลัง (OOV)',
        value: '🆕 T5 ("python design") → [1, 0, 1, 0] · 🍳 T6 ("cooking") → [0, 0, 0, 0] (OOV!)',
        detail: 'เมื่อมีคอร์สใหม่เข้ามา ให้ใช้พจนานุกรมเดิมแปลงค่า (Transform): 🆕 T5 จับคู่คำเดิมได้ทันที แต่ 🍳 T6 มีแต่คำว่า "cooking" ที่ไม่เคยพบในชุดฝึก จึงเป็น Out-of-Vocabulary (OOV) ได้เลข 0 ทุกช่อง',
        board: { type: 'v1-cb-text', activeRow: 4, focusMode: 'oov' },
        ops: [
          { label: 'คอร์สใหม่ 🆕 T5', value: '"python design" → [1, 0, 1, 0]', tone: 'plus' },
          { label: 'คอร์สใหม่ 🍳 T6 ("cooking")', value: 'ไม่อยู่ในคลังคำ → OOV!', tone: 'skip' },
          { label: 'เวกเตอร์ของ 🍳 T6', value: '[0, 0, 0, 0] (ศูนย์ทุกมิติ)', tone: 'result' },
          { label: 'วิธีรับมือ OOV ในระบบจริง', value: 'ใช้ Subword หรือ Dense Embedding', tone: 'minus' }
        ]
      }
    ],
    'cb-tfidf': [
      {
        title: 'ขั้นที่ 1 · นับ Document Frequency (DF) และคำนวณค่า IDF (ลดน้ำหนักคำโหล)',
        value: 'N = 4: data โผล่ 3 คอร์ส (IDF = 1.2231 ต่ำสุด) · art โผล่ 1 คอร์ส (IDF = 1.9163 สูงสุด)',
        detail: 'IDF = ln((1+N)/(1+DF)) + 1 ทำหน้าที่ลงโทษคำที่โผล่เกร่อในหลายเอกสาร (เช่น data โผล่ถึง 3 ใน 4 คอร์ส จึงได้ IDF ต่ำสุด 1.2231) และชูคำเฉพาะกลุ่มที่พบน้อย (เช่น art ได้ 1.9163)',
        board: { type: 'v1-cb-tfidf', activeRow: 0, focusCol: 2 },
        ops: [
          { label: 'คำโหล: data (DF = 3/4)', value: 'IDF = ln(5/4)+1 ≈ 1.2231 (ต่ำสุด)', tone: 'skip' },
          { label: 'คำเฉพาะ: python, design (DF=2)', value: 'IDF = ln(5/3)+1 ≈ 1.5108', tone: 'minus' },
          { label: 'คำหายากสุด: art (DF = 1/4)', value: 'IDF = ln(5/2)+1 ≈ 1.9163 🏆', tone: 'plus' },
          { label: 'ถ้าคำโผล่ครบทุกคอร์ส (DF=N)', value: 'IDF จะต่ำสุด (ไร้อำนาจจำแนก)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · คูณความถี่คำกับ IDF ได้น้ำหนัก TF-IDF (TF × IDF)',
        value: '🐍 T1: python = 1 × 1.5108 = 1.5108 · data = 2 × 1.2231 = 2.4463 → ‖T1‖₂ ≈ 2.875',
        detail: 'นำความถี่คำ (TF) ในแต่ละคอร์สคูณกับค่า IDF ของคำนั้น ได้เวกเตอร์น้ำหนัก TF-IDF ของ 🐍 T1 = [1.5108, 2.4463, 0, 0] และ 📊 T2 = [1.5108, 1.2231, 0, 0]',
        board: { type: 'v1-cb-tfidf', activeRow: 1, focusCol: null },
        ops: [
          { label: 'สูตรคำนวณ', value: 'TF-IDF(t, d) = TF(t, d) × IDF(t)', tone: 'plus' },
          { label: 'เวกเตอร์ 🐍 T1', value: '[1.5108, 2.4463, 0, 0]', tone: 'result' },
          { label: 'เวกเตอร์ 📊 T2', value: '[1.5108, 1.2231, 0, 0]', tone: 'minus' },
          { label: 'เวกเตอร์ 🎨 T3', value: '[0, 0, 1.5108, 1.9163]', tone: 'minus' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · ชะลออิทธิพลของคำซ้ำด้วย Log TF (1 + log₂ TF)',
        value: 'ถ้าใช้ Log TF: คำซ้ำ 1 ครั้ง → 1.00 · ซ้ำ 2 ครั้ง → 2.00 · ซ้ำ 4 ครั้ง → 3.00 (ไม่พุ่งเป็น 4 เท่า)',
        detail: 'เพื่อป้องกันไม่ให้คอร์สที่พิมพ์คำว่า Python ซ้ำ 4 ครั้งได้คะแนนมากกว่าคอร์สที่มี 1 ครั้งถึง 4 เท่า เราใช้สูตร 1 + log₂(TF) ทำให้ TF=4 ได้ค่าเพียง 1 + 2 = 3 เท่า (Diminishing Returns)',
        board: { type: 'v1-cb-tfidf', activeRow: 4, focusCol: 2 },
        ops: [
          { label: 'คอร์ส A มีคำว่า Python 1 ครั้ง', value: '1 + log₂(1) = 1 + 0 = 1.00', tone: 'minus' },
          { label: 'คอร์ส B มีคำว่า Python 4 ครั้ง', value: '1 + log₂(4) = 1 + 2 = 3.00', tone: 'plus' },
          { label: 'สัดส่วนคะแนน B ต่อ A', value: 'ได้ 3 เท่า (ไม่ใช่ 4 เท่าแบบเส้นตรง)', tone: 'result' },
          { label: 'หลักการทางคณิตศาสตร์', value: 'Diminishing Returns (ลดการปั๊มคำ)', tone: 'skip' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · จุดเด่นและข้อจำกัดระดับโครงสร้างของ TF-IDF',
        value: 'โปร่งใสและอธิบายง่ายว่าตรงกันที่คำใด · แต่ตาบอดต่อคำพ้องความหมาย (Synonyms ได้ 0)',
        detail: 'TF-IDF คำนวณเร็วและบอกเหตุผลได้ชัดเจนว่าแนะนำเพราะคำใดตรงกัน แต่เพราะแยกคอลัมน์ตามตัวสะกด จึงไม่เข้าใจว่า "แพทย์" กับ "หมอ" หรือ "car" กับ "automobile" คือเรื่องเดียวกัน',
        board: { type: 'v1-cb-tfidf', activeRow: 4, focusCol: 4 },
        ops: [
          { label: 'จุดแข็งสำคัญ', value: 'คำนวณเร็ว · อธิบายผลลัพธ์ได้ชัดเจน', tone: 'plus' },
          { label: 'จุดอ่อนระดับโครงสร้าง', value: 'ไม่เข้าใจคำพ้อง (Synonyms)', tone: 'skip' },
          { label: 'ตัวอย่างคำพ้อง', value: '"แพทย์" vs "หมอ" → คนละมิติ (ได้ 0)', tone: 'minus' },
          { label: 'ทางแก้ในบทถัดไป', value: 'เสริมด้วย Dense Semantic Embedding', tone: 'result' }
        ]
      }
    ],
    'cb-cosine': [
      {
        title: 'ขั้นที่ 1 · ทำไมต้องวัดมุม Cosine แทนระยะห่าง Euclidean?',
        value: '🐍 T1 (ยาว ‖T1‖ = 2.875) กับ 📊 T2 (สั้น ‖T2‖ = 1.942) พูดเรื่องเดียวกันแต่ความยาวต่างกัน',
        detail: 'ถ้าวัดระยะห่างปลายลูกศรด้วย Euclidean เอกสารยาวกับเอกสารสั้นที่พูดเรื่องเดียวกันจะดูอยู่ห่างกันมาก แต่ Cosine วัดเฉพาะ "มุมทิศทางของเนื้อหา" จึงไม่ถูกหลอกด้วยความยาวเอกสาร',
        board: { type: 'v3-cb-cosine', stepMode: 'length' },
        ops: [
          { label: 'ความยาว 🐍 T1 (‖T1‖₂)', value: '√(1.51² + 2.45²) ≈ 2.875', tone: 'minus' },
          { label: 'ความยาว 📊 T2 (‖T2‖₂)', value: '√(1.51² + 1.22²) ≈ 1.942', tone: 'minus' },
          { label: 'ปัญหาของ Euclidean', value: 'หลงกลความยาวเอกสารที่ต่างกัน', tone: 'skip' },
          { label: 'จุดเด่นของ Cosine', value: 'วัดทิศทางเนื้อหา (Length Invariant)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · คูณเลขตามแกนคำศัพท์ตรงกัน (Dot Product: T1 · T2)',
        value: 'Dot(T1, T2) = (1.5108 × 1.5108) + (2.4463 × 1.2231) = 2.2826 + 2.9919 = 5.2745',
        detail: 'จับคู่คูณน้ำหนักในคอลัมน์คำศัพท์เดียวกัน: แกน python คูณกันได้ 2.2826 บวกกับแกน data คูณกันได้ 2.9919 รวมเป็นผลคูณจุด Dot(T1, T2) = 5.2745',
        board: { type: 'v3-cb-cosine', stepMode: 'dot' },
        ops: [
          { label: 'แกน python คูณกัน', value: '1.5108 × 1.5108 = +2.2826', tone: 'plus' },
          { label: 'แกน data คูณกัน', value: '2.4463 × 1.2231 = +2.9919', tone: 'plus' },
          { label: 'แกน design & art', value: '0 × 0 = 0', tone: 'minus' },
          { label: 'ผลรวม Dot(T1, T2)', value: '2.2826 + 2.9919 = 5.2745', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · หารด้วยผลคูณความยาว L2 Norm (หรือทำ Unit Vector ยาว 1 ล่วงหน้า)',
        value: 'Cosine(T1, T2) = 5.2745 ÷ (2.875 × 1.942) = 5.2745 ÷ 5.583 ≈ 0.9447 🏆 (มุมแคบมาก)',
        detail: 'เมื่อหารด้วยความยาวของทั้งสองเวกเตอร์ จะได้ Cosine = 0.9447 (เข้าใกล้ 1.0 แปลว่าเนื้อหาไปในทิศทางเดียวกันอย่างยิ่ง) และถ้าเรา L2 Normalize ให้ยาว 1 ไว้ก่อน ค่า Cosine จะเท่ากับ Dot Product ทันที!',
        board: { type: 'v3-cb-cosine', stepMode: 'cosine' },
        ops: [
          { label: 'ตัวตั้ง Dot(T1, T2)', value: '5.2745', tone: 'plus' },
          { label: 'ตัวหาร ‖T1‖₂ × ‖T2‖₂', value: '2.875 × 1.942 ≈ 5.583', tone: 'minus' },
          { label: 'ค่า Cosine(T1, T2)', value: '0.9447 🏆 (ทิศทางใกล้กันมาก)', tone: 'result' },
          { label: 'เมื่อเวกเตอร์ยาว 1 (Unit)', value: 'ตัวหาร = 1×1 → Cosine = Dot ทันที!', tone: 'plus' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · กรณีเวกเตอร์ตั้งฉากกัน 90° (Orthogonal: ไม่มีมิติร่วมกันเลย)',
        value: '🐍 T1 เทียบกับ 🎨 T3 หรือ A=(3,0) · B=(0,4) → Dot = 0 และ Cosine = 0.0000 (มุม 90°)',
        detail: 'เมื่อสองเวกเตอร์อยู่คนละแกนกันโดยสิ้นเชิง เช่น 🐍 T1 มีแต่ python/data ส่วน 🎨 T3 มีแต่ design/art (หรือเวกเตอร์ (3,0) กับ (0,4)) ผลคูณจุดจะได้ 0 เสมอ แปลว่าตั้งฉากกัน 90° (ไม่เกี่ยวข้องกันเลย)',
        board: { type: 'v3-cb-cosine', stepMode: 'ortho' },
        ops: [
          { label: 'เทียบ 🐍 T1 กับ 🎨 T3', value: 'ไม่มีคำศัพท์ร่วมกันเลยสักคอลัมน์', tone: 'skip' },
          { label: 'ตัวอย่างพิกัด 2 มิติ', value: 'A = (3, 0) · B = (0, 4)', tone: 'minus' },
          { label: 'ผลคูณจุด (Dot Product)', value: '(3×0) + (0×4) = 0', tone: 'plus' },
          { label: 'ค่า Cosine (มุม 90°)', value: 'cos(90°) = 0.0000 (ตั้งฉากกัน)', tone: 'result' }
        ]
      }
    ],
    'cb-bm25': [
      {
        title: 'ขั้นที่ 1 · เพดานความอิ่มตัวของความถี่คำ (Term Saturation k₁ = 1.5)',
        value: 'คำซ้ำ f = 1 → 1.00 · f = 2 → 1.43 · f = 100 → ตันที่เพดาน k₁ + 1 = 2.50',
        detail: 'พารามิเตอร์ k₁ ควบคุมความเร็วในการอิ่มตัวของคำซ้ำ ต่อให้ปั๊มคำว่า data ซ้ำเป็นร้อยครั้ง คะแนนส่วนของความถี่จะไม่พุ่งทะลุเพดาน k₁ + 1 ช่วยป้องกันการปั่นคีย์เวิร์ด (Keyword Stuffing)',
        board: { type: 'v3-cb-bm25', activeRow: 0 },
        ops: [
          { label: 'หน้าที่ของพารามิเตอร์ k₁', value: 'คุมเพดานอิ่มตัวของความถี่คำซ้ำ', tone: 'plus' },
          { label: 'เมื่อความถี่ f = 1 → f = 2', value: 'แต้มเพิ่มจาก 1.00 เป็นแค่ 1.43', tone: 'minus' },
          { label: 'เพดานสูงสุดเมื่อ f → ∞', value: 'ไม่เกิน k₁ + 1 = 2.50', tone: 'result' },
          { label: 'ประโยชน์ทางวิศวกรรม', value: 'หยุดปัญหาการปั๊มคีย์เวิร์ดซ้ำ', tone: 'skip' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · ชดเชยความยาวเอกสารด้วยพารามิเตอร์ b = 0.75 (เทียบกับ avgdl = 2.25 คำ)',
        value: '🐍 T1 ยาว 3 คำ (> avgdl โดนโทษตัวหาร 1.25) · 📊 T2 ยาว 2 คำ (< avgdl ได้ตัวหาร 0.92)',
        detail: 'พารามิเตอร์ b คุมระดับการลงโทษเอกสารที่ยาวเกินค่าเฉลี่ย (avgdl = 2.25 คำ): 🐍 T1 ยาว 3 คำจึงถูกหารด้วยตัวเลขที่ใหญ่ขึ้น (1.25) ส่วน 📊 T2 สั้นกระชับ 2 คำจึงมีตัวหารเล็กลง (0.92)',
        board: { type: 'v3-cb-bm25', activeRow: 1 },
        ops: [
          { label: 'ความยาวเฉลี่ยทั้งคลัง (avgdl)', value: '(3 + 2 + 2 + 2) ÷ 4 = 2.25 คำ', tone: 'minus' },
          { label: '🐍 T1 (ยาว 3 คำ > avgdl)', value: 'ตัวหารความยาว = 1.25 (โดนโทษ)', tone: 'skip' },
          { label: '📊 T2 (ยาว 2 คำ < avgdl)', value: 'ตัวหารความยาว = 0.92 (ได้เปรียบ)', tone: 'plus' },
          { label: 'หน้าที่ของพารามิเตอร์ b', value: 'ปรับสมดุลความยาวเอกสาร (0 ถึง 1)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · คำนวณคะแนนรวม BM25: ทำไม 📊 T2 ที่กระชับกว่าจึงชนะ 🐍 T1?',
        value: 'คำค้นหา "python data": 📊 T2 ได้ BM25 = 2.45 🏆 ชนะ 🐍 T1 ที่ได้ BM25 = 2.14',
        detail: 'แม้ 🐍 T1 จะมีคำว่า data ซ้ำ 2 ครั้ง แต่เพราะความถี่คำเริ่มอิ่มตัวด้วย k₁ และ T1 ยาวกว่าค่าเฉลี่ย คอร์ส 📊 T2 ที่มีครบทั้ง python และ data อย่างกระชับตรงประเด็นจึงชนะไปด้วยคะแนน 2.45 ต่อ 2.14',
        board: { type: 'v3-cb-bm25', activeRow: 2 },
        ops: [
          { label: 'คะแนน BM25 ของ 🐍 T1', value: '0.90 (python) + 1.24 (data) = 2.14', tone: 'minus' },
          { label: 'คะแนน BM25 ของ 📊 T2', value: '1.28 (python) + 1.17 (data) = 2.45 🏆', tone: 'plus' },
          { label: 'ทำไม 📊 T2 จึงชนะ?', value: 'กระชับกว่าและสัดส่วนคำค้นหนาแน่นกว่า', tone: 'result' },
          { label: 'แนวคิดหลักของ BM25', value: 'ให้คะแนนคู่ Query–Document โดยตรง', tone: 'skip' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · ถ้าตั้งค่า b = 0 จะเกิดอะไรขึ้น?',
        value: 'เมื่อ b = 0 พจน์ชดเชยความยาวจะถูกปิดการทำงาน (ไม่ลงโทษเอกสารยาวเลย)',
        detail: 'หากตั้ง b = 0 ตัวปรับความยาว 1 − b + b·(|d|/avgdl) จะกลายเป็น 1.00 เท่ากันทุกเอกสาร แปลว่าระบบเลิกสนใจความยาวของเอกสารโดยสิ้นเชิง',
        board: { type: 'v3-cb-bm25', activeRow: 3 },
        ops: [
          { label: 'เมื่อตั้งค่า b = 0', value: 'ปิดการชดเชยความยาวเอกสาร 100%', tone: 'skip' },
          { label: 'เมื่อตั้งค่า b = 1', value: 'ลงโทษเอกสารยาวเต็มพิกัดตามสัดส่วน', tone: 'minus' },
          { label: 'ค่ามาตรฐานในโปรดักชัน', value: 'k₁ ≈ 1.2–1.5 และ b ≈ 0.75', tone: 'plus' },
          { label: 'ความต่างจาก TF-IDF', value: 'BM25 มีเพดานอิ่มตัว k₁ + ปรับความยาว b', tone: 'result' }
        ]
      }
    ],
    'cb-embedding': [
      {
        title: 'ขั้นที่ 1 · แก้ปัญหาคำพ้องความหมาย (Synonyms: "🚗 รถยนต์" vs "🚙 ยานพาหนะ")',
        value: 'Sparse (TF-IDF) ได้ Cosine = 0.00 ✕ · แต่ Dense Embedding วางพิกัดไว้ใกล้กันได้ Cosine = 0.92 🏆',
        detail: 'TF-IDF มองคำที่สะกดต่างกันเป็นคนละมิติที่ไม่เกี่ยวข้องกันเลย (Cosine = 0) แต่ Dense Embedding แปลงคำเป็นพิกัดในแผนที่ความหมาย ทำให้คำพ้องความหมายลอยอยู่ติดกันโดยอัตโนมัติ',
        board: { type: 'v3-cb-embedding', activeRow: 0 },
        ops: [
          { label: 'คู่คำที่ทดสอบ', value: '"🚗 รถยนต์" กับ "🚙 ยานพาหนะ"', tone: 'minus' },
          { label: 'Sparse Vector (TF-IDF)', value: 'คนละคอลัมน์ → Cosine = 0.00 ✕', tone: 'skip' },
          { label: 'Dense Semantic Embedding', value: 'พิกัดความหมายใกล้กัน → 0.92 🏆', tone: 'plus' },
          { label: 'จุดเด่นสูงสุดของ Dense', value: 'เข้าใจคำพ้อง (Synonyms) แม้สะกดต่างกัน', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · แก้ปัญหาคำหลายความหมาย (Polysemy: Static Word2Vec vs Contextual BERT)',
        value: 'คำว่า "Bank": Word2Vec ให้เวกเตอร์เดิมตายตัว ✕ · ส่วน BERT เปลี่ยนเวกเตอร์ตามบริบทประโยค 🏆',
        detail: 'Static Embedding (เช่น Word2Vec, GloVe) ให้เวกเตอร์เดิมกับคำเดิมเสมอ จึงแยก "Bank (ธนาคาร)" กับ "Bank (ริมตลิ่ง)" ไม่ได้ แต่ Contextual Embedding (เช่น BERT, SBERT) อ่านทั้งประโยคก่อนจึงแยกคนละพิกัดได้ชัดเจน',
        board: { type: 'v3-cb-embedding', activeRow: 1 },
        ops: [
          { label: 'ปัญหาคำกำกวม (Polysemy)', value: 'คำสะกดเหมือนกันแต่คนละความหมาย', tone: 'minus' },
          { label: 'Static Embedding (Word2Vec)', value: '1 คำ = 1 เวกเตอร์ตายตัว (แยกไม่ได้ ✕)', tone: 'skip' },
          { label: 'Contextual Embedding (BERT)', value: 'ปรับเวกเตอร์ตามบริบทประโยค 🏆', tone: 'plus' },
          { label: 'ผลลัพธ์', value: 'แยก "ธนาคาร" กับ "ริมตลิ่ง" ออกจากกัน', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · ทำไมระบบจริงยังต้องใช้ BM25 คู่กับ Dense Embedding (Hybrid)?',
        value: 'รหัสเฉพาะทาง เช่น "วิชา 204729" หรือรุ่นสินค้า "RTX-4090" → BM25 จับคู่ตรงเป๊ะแม่นกว่า!',
        detail: 'Dense Embedding มักบีบคำเฉพาะทางหรือรหัสรุ่นสินค้าให้กลายเป็นความหมายกว้างๆ จนหาของเจาะจงไม่เจอ ระบบโปรดักชันจึงไม่ทิ้ง BM25 แต่ผสานทั้งสองฝั่งเข้าด้วยกัน (Hybrid Retrieval)',
        board: { type: 'v3-cb-embedding', activeRow: 2 },
        ops: [
          { label: 'เมื่อค้นรหัสวิชา / ชื่อรุ่นสินค้า', value: 'เช่น "204729" หรือ "RTX-4090"', tone: 'minus' },
          { label: 'จุดอ่อนของ Dense Embedding', value: 'เผลอเกลี่ยรหัสเฉพาะเป็นความหมายกว้างๆ', tone: 'skip' },
          { label: 'จุดแข็งของ Sparse (BM25)', value: 'จับคู่ตัวสะกดเฉพาะทางตรงเป๊ะ 🏆', tone: 'plus' },
          { label: 'แนวทางปฏิบัติที่ดีที่สุด', value: 'ใช้ Hybrid (BM25 + Dense Embedding)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · การรวมเวกเตอร์หลายคำเป็นเวกเตอร์คอร์สเส้นเดียว (Mean Pooling & L2 Norm)',
        value: 'เฉลี่ยเวกเตอร์ของทุกโทเคนในประโยคทีละมิติ (Mean Pooling) → ปรับความยาวให้เท่ากับ 1',
        detail: 'เมื่อโมเดลภาษาสร้างเวกเตอร์ให้แต่ละคำในประโยคแล้ว เราใช้ Mean Pooling นำเวกเตอร์ทุกคำมาบวกกันแล้วหารด้วยจำนวนคำในแต่ละแกนมิติ จากนั้นทำ L2 Normalization ให้ยาว 1 เพื่อพร้อมคำนวณ Cosine',
        board: { type: 'v3-cb-embedding', activeRow: 3 },
        ops: [
          { label: 'โทเคนคำในประโยค', value: 'คำที่ 1: (0.8, 0.2) · คำที่ 2: (1.0, 0.4)', tone: 'minus' },
          { label: 'Mean Pooling (เฉลี่ยรายแกน)', value: '((0.8+1.0)÷2, (0.2+0.4)÷2) = (0.9, 0.3)', tone: 'plus' },
          { label: 'L2 Normalization', value: 'หารด้วยความยาว ‖v‖₂ ให้ยาว = 1.0', tone: 'plus' },
          { label: 'ผลลัพธ์สุดท้าย', value: 'เวกเตอร์ตัวแทนคอร์ส 1 เส้นพร้อมค้นหา', tone: 'result' }
        ]
      }
    ],
    'cb-profile': [
      {
        title: 'ขั้นที่ 1 · คำนวณจุดศูนย์กลางมวลแบบเฉลี่ยปกติ (Unweighted Centroid)',
        value: '👩 ฟ้า ชอบ 🐍 T1=(1.0, 0.0) และ 📊 T2=(0.8, 0.6) → Centroid c = ((1+0.8)/2, (0+0.6)/2) = (0.90, 0.30)',
        detail: 'นำเวกเตอร์ของคอร์สที่ 👩 ฟ้า เคยชอบในชุดฝึกมารวมกันทีละแกนมิติแล้วหารด้วยจำนวนคอร์ส (2 คอร์ส) ได้จุดกึ่งกลางรสนิยม c = (0.90, 0.30)',
        board: { type: 'v3-cb-profile', activeRow: 2 },
        ops: [
          { label: 'คอร์สที่ 👩 ฟ้า เคยชอบ', value: '🐍 T1 (1.0, 0.0) และ 📊 T2 (0.8, 0.6)', tone: 'minus' },
          { label: 'เฉลี่ยแกนที่ 1 (สายโค้ด)', value: '(1.0 + 0.8) ÷ 2 = 0.90', tone: 'plus' },
          { label: 'เฉลี่ยแกนที่ 2 (สายภาพ)', value: '(0.0 + 0.6) ÷ 2 = 0.30', tone: 'plus' },
          { label: 'Unweighted Centroid (c)', value: 'c = (0.90, 0.30)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · ทำไมต้อง Normalize เวกเตอร์โปรไฟล์ให้ยาว 1 อีกครั้ง?',
        value: '‖c‖₂ = √(0.9² + 0.3²) = √0.90 ≈ 0.9487 (< 1) → Normalize ได้ p = (0.9487, 0.3162)',
        detail: 'การนำเวกเตอร์หน่วยหลายตัวมาเฉลี่ยกันมักทำให้ความยาวรวมสั้นลงกว่า 1 (เหลือ 0.9487) จึงต้องหารด้วย ‖c‖₂ อีกครั้งเพื่อให้โปรไฟล์ p มีความยาวเป็น 1 พร้อมคูณ Dot Product เป็นค่า Cosine ได้ทันที',
        board: { type: 'v3-cb-profile', activeRow: 3 },
        ops: [
          { label: 'ความยาวของ Centroid ‖c‖₂', value: '√(0.81 + 0.09) ≈ 0.9487 (สั้นลงกว่า 1)', tone: 'skip' },
          { label: 'หารด้วยความยาวตัวเอง', value: '(0.90 ÷ 0.9487, 0.30 ÷ 0.9487)', tone: 'plus' },
          { label: 'โปรไฟล์หน่วย p ของ 👩 ฟ้า', value: 'p ≈ (0.9487, 0.3162) · ‖p‖₂ = 1', tone: 'result' },
          { label: 'จับคู่คอร์สใหม่ 🆕 T5 (0.96, 0.28)', value: 'p · T5 = 0.9993 🏆 (ตรงใจอันดับ 1)', tone: 'plus' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · ถ่วงน้ำหนักตามระดับความชอบ (Weighted Centroid)',
        value: 'ถ้า 👩 ฟ้า ชอบ 🐍 T1 (น้ำหนัก 3) มากกว่า 📊 T2 (น้ำหนัก 1) → c_w = (0.95, 0.15) เอนเข้าหา T1!',
        detail: 'หากผู้ใช้ให้คะแนนดาวไม่เท่ากัน เราใช้ Weighted Centroid คูณน้ำหนักความชอบเข้าไป: ((3×1.0 + 1×0.8)/4, (3×0.0 + 1×0.6)/4) = (0.95, 0.15) ดึงโปรไฟล์ให้เข้าใกล้ 🐍 T1 มากขึ้น',
        board: { type: 'v3-cb-profile', activeRow: 4 },
        ops: [
          { label: 'น้ำหนักความชอบ (w₁ : w₂)', value: '🐍 T1 ได้ w₁ = 3 · 📊 T2 ได้ w₂ = 1', tone: 'minus' },
          { label: 'คำนวณแกนที่ 1 ถ่วงน้ำหนัก', value: '(3(1.0) + 1(0.8)) ÷ 4 = 0.95', tone: 'plus' },
          { label: 'คำนวณแกนที่ 2 ถ่วงน้ำหนัก', value: '(3(0.0) + 1(0.6)) ÷ 4 = 0.15', tone: 'plus' },
          { label: 'ผลลัพธ์ต่อทิศทางโปรไฟล์', value: 'ดึงโปรไฟล์เอนเข้าใกล้ 🐍 T1 มากขึ้น', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · ข้อจำกัดของโปรไฟล์เดี่ยวเมื่อผู้ใช้ชอบหลายแนวสุดขั้ว (Multi-Interest)',
        value: 'ถ้าชอบทั้ง "เขียนโค้ด" และ "ทำอาหาร" คนละขั้ว → การเฉลี่ยรวมกันจะได้จุดตรงกลางที่ไม่มีคอร์สใดตรงใจเลย!',
        detail: 'จุดอ่อนของการรวมทุกอย่างเป็น Centroid เดียวคือ ถ้าผู้ใช้มีความสนใจหลายด้านที่อยู่ห่างกันมาก จุดเฉลี่ยจะตกในพื้นที่ว่างไร้ความหมาย ต้องแก้ด้วยการแยกกลุ่มความสนใจ (Multi-Interest Profiles)',
        board: { type: 'v3-cb-profile', activeRow: 4, highlightWarn: true },
        ops: [
          { label: 'จุดอ่อนของ Single Centroid', value: 'เฉลี่ยความชอบหลายขั้วจนเสียรูป', tone: 'skip' },
          { label: 'ตัวอย่างปัญหา', value: 'โค้ด + ทำอาหาร → จุดกึ่งกลางที่ไม่มีจริง', tone: 'minus' },
          { label: 'ทางแก้ทางวิศวกรรม', value: 'แยก Multi-Interest Profiles (เช่น K-Means)', tone: 'plus' },
          { label: 'เมื่อมีกดไม่ชอบ (Rocchio)', value: 'ลบด้วย −γ·c⁻ (เฉพาะที่กด Dislike จริง)', tone: 'result' }
        ]
      }
    ],
    'cb-retrieval': [
      {
        title: 'ขั้นที่ 1 · ทำไม Exact Flat Search จึงรับมือคลังสินค้าขนาดล้านชิ้นไม่ไหว?',
        value: 'Exact Flat Search ต้องสแกนครบทุกชิ้น O(Nd) → แม่นยำ 100% แต่ช้าจนหน้าเว็บค้างเมื่อคลังใหญ่!',
        detail: 'การนำโปรไฟล์ผู้ใช้ไปคูณกับสินค้าทีละชิ้นครบทั้ง 5,000,000 ชิ้น (Flat Search) รับประกันว่าได้เพื่อนบ้านที่ใกล้ที่สุดจริง 100% แต่ใช้เวลาหลายร้อยมิลลิวินาทีซึ่งเกินงบเวลาออนไลน์',
        board: { type: 'v6-cb-retrieval', activeRow: 0 },
        ops: [
          { label: 'วิธี Exact Flat Search', value: 'ตรวจเทียบครบทุกชิ้นในคลัง O(Nd)', tone: 'minus' },
          { label: 'ความแม่นยำ (Exact Top-3)', value: '{🆕 T5, 📈 T4, 🎨 T3} (แม่น 100%)', tone: 'plus' },
          { label: 'คอขวดเมื่อคลังมีล้านชิ้น', value: '⚠️ Latency สูง (~150 ms) หน้าเว็บค้าง', tone: 'skip' },
          { label: 'ทางออกในโปรดักชัน', value: 'ใช้ดัชนีเวกเตอร์แบบประมาณค่า (ANN)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · ดัชนี HNSW vs IVF-PQ: ค้นหาใน 2 มิลลิวินาทีและประหยัดหน่วยความจำ',
        value: 'HNSW: กราฟหลายชั้น ค้นเร็วสุด ~2 ms (ใช้ RAM สูง) · IVF-PQ: แบ่งเซลล์ + บีบอัดรหัส (ประหยัด RAM สูงสุด)',
        detail: 'HNSW สร้างกราฟหลายชั้นเหมือนทางด่วนให้กระโดดหาเพื่อนบ้านได้ในเสี้ยววินาที ส่วน IVF-PQ แบ่งพื้นที่เป็นกลุ่มเซลล์และบีบอัดตัวเลขทศนิยมเป็นรหัสสั้นๆ เพื่อประหยัด RAM สำหรับคลังขนาดพันล้านชิ้น',
        board: { type: 'v6-cb-retrieval', activeRow: 1, secondRow: 2 },
        ops: [
          { label: 'จุดเด่นของ HNSW', value: 'กราฟหลายชั้น · ค้นเร็วสุด (~2 ms) 🏆', tone: 'plus' },
          { label: 'ข้อแลกเปลี่ยนของ HNSW', value: 'ใช้หน่วยความจำ RAM ค่อนข้างสูง', tone: 'minus' },
          { label: 'จุดเด่นของ IVF-PQ', value: 'บีบอัดเวกเตอร์ · ประหยัด RAM สูงสุด 🏆', tone: 'plus' },
          { label: 'บทบาทของ M และ K', value: 'ANN ดึง M=100 ชิ้น → คัดขึ้นจอ K=5 ชิ้น', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · วัดความแม่นของดัชนีด้วย Index Recall@3',
        value: 'Exact Top-3 = {T5, T4, T3} · ANN Top-3 = {T5, T4, T6} → Index Recall@3 = 2/3 ≈ 66.7%',
        detail: 'Index Recall@M วัดว่าดัชนี ANN หยิบสินค้าได้ตรงกับ Exact Search กี่ชิ้น: ในที่นี้พบตรงกัน 2 ชิ้นคือ {🆕 T5, 📈 T4} (ทำ 🎨 T3 หลุดไป 1 ชิ้น) จึงได้ Index Recall@3 = 2/3',
        board: { type: 'v6-cb-retrieval', activeRow: 3 },
        ops: [
          { label: 'ชุดอุดมคติ Exact Top-3', value: '{🆕 T5, 📈 T4, 🎨 T3}', tone: 'minus' },
          { label: 'ชุดที่ดัชนี ANN หามาได้', value: '{🆕 T5, 📈 T4, 🍳 T6}', tone: 'plus' },
          { label: 'จำนวนชิ้นที่พบตรงกัน', value: '2 ชิ้น ({🆕 T5, 📈 T4})', tone: 'plus' },
          { label: 'ค่า Index Recall@3', value: '2 / 3 ≈ 0.6667 (66.7%)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · กฎเหล็กสายพาน: ถ้าด่าน Retrieval ทำของหลุด ด่าน Re-ranking จะกู้คืนไม่ได้!',
        value: 'ต้องตั้ง M ≫ K เสมอ (เช่น M = 100, K = 5) เพื่อเป็นกันชนให้ตัวกรองสิทธิ์และด่าน Re-ranking',
        detail: 'ด่าน Re-ranking ทำได้เพียงเรียงลำดับสิ่งที่ด่าน Retrieval ส่งมาให้เท่านั้น หากด่านแรกทำคอร์สที่ดีหลุดหายไป (ไม่ติดในชุด M) ด่านหลังจะไม่มีโอกาสเห็นคอร์สนั้นอีกเลย',
        board: { type: 'v6-cb-retrieval', activeRow: 3, highlightWarn: true },
        ops: [
          { label: 'ขนาดชุดผู้สมัคร (M)', value: 'M = 100 ชิ้น (ดึงเผื่อให้กว้างพอ)', tone: 'plus' },
          { label: 'ขนาดหน้าจอสุดท้าย (K)', value: 'K = 5 ชิ้น (ต้องตั้ง M ≫ K เสมอ)', tone: 'minus' },
          { label: 'ถ้าของดีหลุดตั้งแต่ด่าน ANN', value: '💥 ด่าน Re-rank ไม่มีสิทธิ์มองเห็นเลย', tone: 'skip' },
          { label: 'ตัวชี้วัดด่านแรก', value: 'Candidate / Index Recall@M สำคัญที่สุด', tone: 'result' }
        ]
      }
    ],
    'cb-rerank': [
      {
        title: 'ขั้นที่ 1 · วิกฤตคนละสเกล (Scale Mismatch): เมื่อเอา BM25 บวกกับ Cosine ตรงๆ',
        value: '🐍 F1 ได้ BM25 = 20.0 (สเกลใหญ่) · 🎨 F3 ได้ Semantic = 0.90 (สเกล 0–1) → บวกดิบ BM25 กลืนมิด!',
        detail: 'คะแนน BM25 มีสเกลหลักสิบ (0–20) ขณะที่ Cosine Similarity มีสเกลแค่ 0–1 ถ้านำมาบวกกันตรงๆ ฝั่ง BM25 จะครอบงำผลลัพธ์ทั้งหมดจนคะแนนความหมายของฝั่ง Semantic ไร้ความหมายทันที',
        board: { type: 'v4-cb-rerank', activeCol: 3 },
        ops: [
          { label: 'สเกลของ Lexical BM25', value: '0.0 ถึง 20.0 (ตัวเลขขนาดใหญ่)', tone: 'minus' },
          { label: 'สเกลของ Semantic Cosine', value: '0.20 ถึง 0.90 (ตัวเลขทศนิยมเล็ก)', tone: 'minus' },
          { label: 'ผลของการบวกดิบตรงๆ', value: '⚠️ BM25 กลืนอิทธิพลฝั่งความหมายจนหมด', tone: 'skip' },
          { label: 'ชื่อปัญหาทางวิศวกรรม', value: 'Scale Mismatch (มาตราคะแนนไม่เท่ากัน)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · ยุทธศาสตร์ที่ 1: ปรับสเกลด้วย Min–Max Normalization สู่ช่วง [0, 1]',
        value: '📊 F2: BM25 ย่อได้ 0.5000 · Semantic ย่อได้ (0.6−0.2)/(0.9−0.2) = 0.5714 → เฉลี่ยได้ 0.5357 🏆',
        detail: 'แปลงคะแนนแต่ละฝั่งด้วยสูตร (s − min)/(max − min) ให้อยู่ในช่วง [0, 1] เท่ากันก่อนแล้วค่อยเฉลี่ย (α = 0.5) ทำให้ 📊 F2 ที่ดีทั้งคำและความหมายก้าวขึ้นมาชนะเป็นอันดับ 1 (0.5357)',
        board: { type: 'v4-cb-rerank', activeCol: 4 },
        ops: [
          { label: 'สูตร Min–Max Scaling', value: 's̃ = (s − min) ÷ (max − min)', tone: 'plus' },
          { label: 'คะแนนรวมของ 🐍 F1 & 🎨 F3', value: '0.5(1 + 0) = 0.5000 เท่ากัน', tone: 'minus' },
          { label: 'คะแนนรวมของ 📊 F2 (สมดุล)', value: '0.5(0.50 + 0.5714) = 0.5357 🏆', tone: 'result' },
          { label: 'ข้อควรระวังสำคัญ!', value: 'เลข [0, 1] ยังไม่ใช่ Probability จนกว่าจะ Calibrate', tone: 'skip' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · ยุทธศาสตร์ที่ 2: Reciprocal Rank Fusion (RRF) ใช้เฉพาะอันดับที่',
        value: 'RRF(d) = 1/(60 + r_lex) + 1/(60 + r_sem) → 📊 F2 ได้อันดับ #2 ทั้งสองฝั่ง จึงชนะเสถียรที่สุด!',
        detail: 'RRF เลิกสนใจตัวเลขคะแนนดิบโดยสิ้นเชิง แต่ใช้เฉพาะ "อันดับที่ (Rank)" ในแต่ละลิสต์มาคำนวณ 1/(c + rank) จึงทนทานต่อ Outliers และไม่ต้องปวดหัวเรื่องสเกลคะแนนต่างกันเลย',
        board: { type: 'v4-cb-rerank', activeCol: 5 },
        ops: [
          { label: 'สูตร RRF (c = 60)', value: 'Σ [ 1 ÷ (60 + rank(d)) ]', tone: 'plus' },
          { label: '🐍 F1 (#1, #3) & 🎨 F3 (#3, #1)', value: '1/61 + 1/63 ≈ 0.032266', tone: 'minus' },
          { label: '📊 F2 (#2 ทั้งสองฝั่ง)', value: '1/62 + 1/62 ≈ 0.032258 (เกาะกลุ่มนำ)', tone: 'result' },
          { label: 'จุดเด่นของ RRF', value: 'ไม่ต้องจูนสเกล · ทนทานต่อค่ากระโดด', tone: 'plus' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · ด่านตัดสินสุดท้ายด้วย Cross-Encoder และความต่างของ Calibration',
        value: 'หลังรวมผู้สมัครด้วย RRF แล้ว ส่ง Top-M ชิ้นให้ Cross-Encoder อ่านคู่กันอย่างละเอียดเพื่อจัดลำดับขึ้นจอ',
        detail: 'ในระบบจริง หลังผสานลิสต์ด้วย RRF ได้ผู้สมัครชุดสั้นแล้ว เราส่งต่อให้ Cross-Encoder ใช้ Cross-Attention ตรวจความเข้ากันได้เชิงลึก และหากต้องใช้เป็นโอกาสคลิกจริงต้องทำ Probability Calibration แยกต่างหาก',
        board: { type: 'v4-cb-rerank', activeCol: 4, highlightSummary: true },
        ops: [
          { label: 'Score Normalization', value: 'แค่ย่อตัวเลขให้อยู่ในช่วง [0, 1]', tone: 'minus' },
          { label: 'Probability Calibration', value: 'ปรับให้ 0.8 แปลว่ามีโอกาสคลิก 80% จริง', tone: 'plus' },
          { label: 'หน้าที่ของ Cross-Encoder', value: 'ตรวจละเอียดคู่ User–Item ในด่านสุดท้าย', tone: 'result' },
          { label: 'สายพาน Hybrid มาตรฐาน', value: 'BM25 + Dense → RRF → Cross-Encoder', tone: 'plus' }
        ]
      }
    ],
    'cb-mmr': [
      {
        title: 'ขั้นที่ 1 · รอบที่ 1: เลือกคอร์สที่มีความตรงใจสูงสุดเข้าสล็อตอันดับ #1',
        value: 'เลือก 🐍 คอร์ส X (Rel = 0.90 สูงสุด) เข้าลิสต์ S = {X} เป็นอันดับที่ #1',
        detail: 'เริ่มต้นเซตที่เลือกแล้ว S ยังว่างอยู่ ระบบจึงหยิบคอร์สที่มีคะแนนความตรงใจ (Relevance) สูงที่สุดคือ 🐍 คอร์ส X (Python พื้นฐาน 1 · Rel = 0.90) ขึ้นแสดงในสล็อตอันดับ #1',
        board: { type: 'v2-cb-mmr', activeRow: 0 },
        ops: [
          { label: 'ผู้สมัคร 3 รายการ', value: 'X (0.90), Y (0.85), Z (0.70)', tone: 'minus' },
          { label: 'เลือกเข้าสล็อตอันดับ #1', value: '🏆 🐍 คอร์ส X (Rel = 0.90 สูงสุด)', tone: 'plus' },
          { label: 'เซตที่เลือกแล้ว (S)', value: 'S = { 🐍 X }', tone: 'result' },
          { label: 'โจทย์ในรอบถัดไป', value: 'เลือกอันดับ #2 โดยไม่ให้ซ้ำซากกับ X', tone: 'skip' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · รอบที่ 2: หักคะแนนความซ้ำซากของ 🐍 คอร์ส Y (เนื้อหาซ้ำกับ X ถึง 90%!)',
        value: '🐍 Y มี Rel = 0.85 แต่ Sim(Y, X) = 0.90 → MMR(Y) = 0.7(0.85) − 0.3(0.90) = 0.595 − 0.270 = 0.325',
        detail: 'พจน์ −(1−λ)·max Sim ทำหน้าที่ลงโทษความซ้ำซ้อน: เพราะ 🐍 Y เป็นคอร์ส Python พื้นฐานเหมือนกันจนคล้ายกับ X ถึง 0.90 จึงถูกหักแต้มออกไปถึง −0.270 เหลือคะแนนสุทธิเพียง 0.325!',
        board: { type: 'v2-cb-mmr', activeRow: 1 },
        ops: [
          { label: 'พจน์ความตรงใจ λ·Rel(Y)', value: '0.7 × 0.85 = +0.595', tone: 'plus' },
          { label: 'ความซ้ำกับ X: Sim(Y, X)', value: '0.90 (เนื้อหาซ้ำกับ X เกือบทั้งหมด!)', tone: 'skip' },
          { label: 'พจน์ลงโทษ −(1−λ)·Sim', value: '−0.3 × 0.90 = −0.270 (โดนหักหนัก)', tone: 'skip' },
          { label: 'คะแนนสุทธิ MMR(Y)', value: '0.595 − 0.270 = 0.325', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · รอบที่ 2: 📊 คอร์ส Z (หัวข้อใหม่ ไม่ซ้ำกับ X) แซงขึ้นมาคว้าอันดับ #2!',
        value: '📊 Z มี Rel = 0.70 และ Sim(Z, X) = 0.10 → MMR(Z) = 0.7(0.70) − 0.3(0.10) = 0.490 − 0.030 = 0.460 🏆',
        detail: 'แม้ 📊 Z (Data Visualization) จะมีคะแนนตั้งต้นน้อยกว่า Y แต่เพราะเป็นหัวข้อใหม่ที่ไม่ซ้ำกับ X (Sim = 0.10) จึงถูกหักแต้มน้อยมาก (−0.030) ได้คะแนนสุทธิ 0.460 แซงชนะ Y (0.325) ขึ้นอันดับ #2 ทันที!',
        board: { type: 'v2-cb-mmr', activeRow: 2 },
        ops: [
          { label: 'พจน์ความตรงใจ λ·Rel(Z)', value: '0.7 × 0.70 = +0.490', tone: 'plus' },
          { label: 'พจน์ลงโทษความซ้ำของ Z', value: '−0.3 × 0.10 = −0.030 (หักนิดเดียว)', tone: 'minus' },
          { label: 'คะแนนสุทธิ MMR(Z)', value: '0.490 − 0.030 = 0.460 🏆 (ชนะ Y!)', tone: 'result' },
          { label: 'หน้าจอ Top-2 สุดท้าย', value: '[#1 🐍 X, #2 📊 Z] (ตรงใจ + หลากหลาย)', tone: 'plus' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · บทบาทของพารามิเตอร์ λ และข้อแลกเปลี่ยน (The Diversity Trade-off)',
        value: 'ถ้า λ = 1.0 จะเรียงตาม Rel ล้วน (จำเจ) · การใช้ MMR เพิ่ม Intra-List Diversity (ILD) ชัดเจน',
        detail: 'ถ้าตั้ง λ = 1.0 พจน์หักความซ้ำจะกลายเป็น 0 ระบบจะกลับไปแนะนำ [X, Y] ที่ซ้ำซาก (Overspecialization) การใช้ λ ≈ 0.7 ช่วยเพิ่มความหลากหลายในลิสต์ (ILD) โดยแลกกับคะแนนความตรงใจเฉลี่ยที่ลดลงเล็กน้อย',
        board: { type: 'v2-cb-mmr', activeRow: 3 },
        ops: [
          { label: 'เมื่อตั้งค่า λ = 1.0', value: 'ไม่สนความหลากหลายเลย (เรียง Rel ล้วน)', tone: 'skip' },
          { label: 'เมื่อตั้งค่า λ = 0.7', value: 'สมดุลความตรงใจ + ความหลากหลาย 🏆', tone: 'plus' },
          { label: 'ตัววัดความหลากหลายในลิสต์', value: 'Intra-List Diversity (ILD) สูงขึ้น', tone: 'result' },
          { label: 'ข้อแลกเปลี่ยน (Trade-off)', value: 'แก้ Filter Bubble แลกกับ Rel เฉลี่ยลดนิดหน่อย', tone: 'minus' }
        ]
      }
    ],
    'mm-modalities': [
      {
        title: 'ขั้นที่ 1 · 4 สื่อหลักในระบบแนะนำ (The 4 Core Modalities)',
        value: '📝 Text (w=0.4) · 🖼️ Image (w=0.2) · 🎵 Audio (w=0.2) · 🎬 Video (w=0.2)',
        detail: 'แต่ละสื่อทำหน้าที่จับสัญญาณคนละมิติ: ข้อความบอกหัวข้อ ภาพบอกสีและหน้าตา เสียงบอกอารมณ์ และวิดีโอบอกการเคลื่อนไหวตามเวลา',
        board: { type: 'v1-mm-modalities', activeCol: 1 },
        ops: [
          { label: '📝 T · Text (w = 0.4)', value: 'ชื่อคลิป / คำบรรยาย / แท็กหัวข้อ', tone: 'plus' },
          { label: '🖼️ I · Image (w = 0.2)', value: 'ภาพปก / โทนสี / การจัดวาง', tone: 'minus' },
          { label: '🎵 A · Audio (w = 0.2)', value: 'ดนตรี / น้ำเสียง / จังหวะอารมณ์', tone: 'skip' },
          { label: '🎬 V · Video (w = 0.2)', value: 'การเคลื่อนไหวข้ามเวลา (Temporal)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · การเสริมพลังข้อมูลข้ามสื่อ (Information Complementarity)',
        value: 'ชื่อคลิปสั้นกำกวม → ภาพปก + เสียงพูด + ลีลาวิดีโอ ช่วยเติมเต็มบริบทจนชัดเจน',
        detail: 'เมื่อชื่อคลิปเขียนสั้นๆ แค่ "ลองทำดู!" ข้อความเพียงอย่างเดียวบอกไม่ได้ว่าคือคลิปอะไร แต่ภาพปก เสียงพูด และวิดีโอช่วยยืนยันเนื้อหาให้สมบูรณ์',
        board: { type: 'v1-mm-modalities', activeCol: 2 },
        ops: [
          { label: 'จุดบอดของสื่อเดี่ยว', value: 'ชื่อเรื่องสั้น / กำกวม / ไม่บอกอารมณ์', tone: 'skip' },
          { label: 'กลไก Complementarity', value: 'สื่อหนึ่งช่วยอุดจุดบอดของอีกสื่อหนึ่ง', tone: 'plus' },
          { label: 'ความเชื่อมโยงแฝง', value: 'Transcript ถอดจาก Audio (ไม่เป็นอิสระ 100%)', tone: 'minus' },
          { label: 'ผลลัพธ์ต่อโมเดล', value: 'เข้าใจบริบทครบทุกมิติ 🏆', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · แยกแยะ Unimodal vs Multimodal (ชนิดของสื่อ ไม่ใช่จำนวนไฟล์)',
        value: 'รูปภาพ 20 รูป = Unimodal (สื่อภาพชนิดเดียว) · รูป 1 + ข้อความ 1 = Multimodal',
        detail: 'จำนวนไฟล์เยอะไม่ได้แปลว่าเป็น Multimodal! หากใช้เฉพาะรูปภาพ 20 มุมก็ยังเป็น Unimodal ต้องผสานข้อมูลต่างชนิดกันจึงจะเป็น Multimodal',
        board: { type: 'v1-mm-modalities', activeCol: 3 },
        ops: [
          { label: 'รูปสินค้า 20 มุมล้วน', value: 'Unimodal (มีเฉพาะสื่อ Image ชนิดเดียว)', tone: 'skip' },
          { label: 'รูปปก 1 + เรื่องย่อ 1', value: 'Multimodal (ผสาน Image + Text) ✓', tone: 'plus' },
          { label: 'ประวัติ 👩 ฟ้า (Train)', value: 'ชอบ H1 และ H2 (มีครบ T, I, A, V)', tone: 'minus' },
          { label: 'ผู้สมัครรอจัดอันดับ', value: 'M3, M4, M5 (2 มิติต่อสื่อ)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · ระวังสัญญาณรบกวนในสื่อ (Modality Noise & Engineering Cost)',
        value: 'ปกหลอกลวง (Clickbait) หรือเสียงลมซ่า = Modality Noise ที่ฉุดความแม่นยำลง!',
        detail: 'การเพิ่มสื่อไม่ได้แปลว่าจะดีขึ้นเสมอไป หากสื่อใหม่มีแต่ Noise (เช่น เสียงซ่า หรือปก Clickbait) จะทำให้โมเดลสับสนและเสียค่า GPU ฟรี',
        board: { type: 'v1-mm-modalities', activeCol: 4 },
        ops: [
          { label: 'ตัวอย่าง Modality Noise', value: 'ปก Clickbait / ภาพเบลอ / เสียงลมซ่า 💥', tone: 'skip' },
          { label: 'ผลเสียต่อระบบ', value: 'โมเดลหลงทาง + เปลือง GPU & Latency', tone: 'minus' },
          { label: 'วิธีคัดกรองก่อนใช้', value: 'พิสูจน์ด้วย Ablation Study เสมอ', tone: 'plus' },
          { label: 'กฎเหล็กวิศวกรรม', value: 'เพิ่มเฉพาะสื่อที่ลดความผิดพลาดได้จริง', tone: 'result' }
        ]
      }
    ],
    'mm-features': [
      {
        title: 'ขั้นที่ 1 · ข้อมูลดิบแต่ละสื่อมีโครงสร้างต่างกัน (Heterogeneous Raw Inputs)',
        value: 'คำศัพท์ · ตารางพิกเซล RGB · คลื่นความถี่เสียง · ลำดับเฟรมภาพตามเวลา',
        detail: 'คอมพิวเตอร์นำไฟล์ MP4 หรือ JPG มาคำนวณความคล้ายตรงๆ ไม่ได้ ต้องแปลงข้อมูลดิบแต่ละชนิดให้กลายเป็นเวกเตอร์ตัวเลขก่อน',
        board: { type: 'v6-mm-features', activeCol: 1 },
        ops: [
          { label: '📝 ข้อมูลดิบข้อความ', value: 'ลำดับคำศัพท์และตัวอักษร', tone: 'minus' },
          { label: '🖼️ ข้อมูลดิบภาพ', value: 'ตารางพิกเซล 3 สี (H × W × RGB)', tone: 'skip' },
          { label: '🎵 ข้อมูลดิบเสียง', value: 'คลื่นเสียงต่อเนื่อง → Mel-Spectrogram', tone: 'plus' },
          { label: '🎬 ข้อมูลดิบวิดีโอ', value: 'ลำดับเฟรมภาพต่อเนื่องตามเวลา', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · สกัดฟีเจอร์: Handcrafted ยุคเก่า vs Deep Pretrained Encoder ยุคใหม่',
        value: 'Handcrafted (Color Histogram, MFCC, TF-IDF) vs Pretrained (BERT, ResNet/ViT, AST)',
        detail: 'ฟีเจอร์ที่มนุษย์เขียนกฎเอง (เช่น นับสี Color Histogram หรือ MFCC) ประหยัดแต่ไม่เข้าใจความหมายเชิงลึก ส่วน Pretrained Encoder สกัดความหมายระดับสูงได้ทันที',
        board: { type: 'v6-mm-features', activeCol: 2 },
        ops: [
          { label: 'Handcrafted (เขียนกฎเอง)', value: 'TF-IDF · Color Histogram · MFCC', tone: 'skip' },
          { label: 'ข้อจำกัด Handcrafted', value: 'นับสีฟ้าน้ำทะเล = สีฟ้าเสื้อผ้า (ไม่เข้าใจรูป)', tone: 'minus' },
          { label: 'Pretrained Deep Encoder', value: 'BERT / RoBERTa · ResNet / ViT · AST', tone: 'plus' },
          { label: 'จุดเด่น Transfer Learning', value: 'เข้าใจความหมายเชิงลึกโดยไม่ต้องเทรนจากศูนย์', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · Linear Projection Layer (ย่อมิติให้เท่ากัน ≠ จัดแนวความหมาย!)',
        value: 'แปลง 768 มิติ และ 2048 มิติ → 2 มิติเท่ากัน แต่ห้ามคูณข้ามสื่อถ้ายังไม่ทำ Alignment!',
        detail: 'Linear Projection ช่วยแปลงขนาดเวกเตอร์ให้เหลือ d มิติเท่ากัน แต่ขนาดเท่ากันไม่ได้แปลว่าความหมายตรงกัน (แกน 1 ของภาพอาจคือสี แกน 1 ของข้อความอาจคือคำ)',
        board: { type: 'v6-mm-features', activeCol: 3 },
        ops: [
          { label: 'หน้าที่ Linear Projection', value: 'ย่อ/ขยายขนาดมิติ (เช่น 2048D → 128D)', tone: 'plus' },
          { label: 'ความเข้าใจผิดที่พบบ่อย', value: 'มิติเท่ากัน ≠ ความหมายตรงกัน! ⚠️', tone: 'skip' },
          { label: 'ทำไมยังคูณข้ามสื่อไม่ได้?', value: 'แกนที่ 1 ของแต่ละสื่อยังแทนคนละเรื่อง', tone: 'minus' },
          { label: 'จะเทียบข้ามสื่อต้องทำอะไร?', value: 'ต้องฝึก Contrastive Alignment (เช่น CLIP)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · กฎป้องกัน Data Leakage และเมทาดาทาที่ต้องบันทึกคู่เวกเตอร์เสมอ',
        value: 'Fit Scaler บน Train เท่านั้น! · บันทึก Encoder Version + Availability Mask เสมอ',
        detail: 'ห้ามนำ Test มาคำนวณค่าเฉลี่ย/ส่วนเบี่ยงเบนมาตรฐานตอนทำ Normalization เด็ดขาด และต้องเก็บชื่อรุ่น Encoder คู่กับสถานะสื่อ [1,1,1,0] เสมอ',
        board: { type: 'v6-mm-features', activeCol: 4 },
        ops: [
          { label: 'การทำ Feature Scaling', value: 'Fit บนชุด Train เท่านั้น (ป้องกัน Leakage)', tone: 'plus' },
          { label: 'เมทาดาทาที่ 1', value: 'Encoder Name & Version (เช่น ViT-B/16 v1)', tone: 'minus' },
          { label: 'เมทาดาทาที่ 2', value: 'Availability Mask เช่น [1, 1, 1, 0]', tone: 'skip' },
          { label: 'ผลลัพธ์ปลายทาง', value: 'เวกเตอร์หน่วย 2 มิติพร้อมเข้าโมเดล 🏆', tone: 'result' }
        ]
      }
    ],
    'mm-neuron': [
      {
        title: 'ขั้นที่ 1 · คำนวณผลรวมถ่วงน้ำหนัก (Weighted Sum: z = w·x + b)',
        value: 'x = (2, 1), w = (0.5, −1.0), b = 0.5 → z = 2(0.5) + 1(−1.0) + 0.5 = 0.5',
        detail: 'นิวรอนรับอินพุต x₁=2, x₂=1 นำมาคูณน้ำหนัก w₁=0.5, w₂=−1.0 แล้วบวกค่าไบแอส b=0.5 ได้ผลรวมเชิงเส้น z = 1.0 − 1.0 + 0.5 = 0.5',
        board: { type: 'v3-mm-neuron', activeRow: 0 },
        ops: [
          { label: 'ผลคูณช่องที่ 1 (w₁·x₁)', value: '0.5 × 2 = +1.0', tone: 'plus' },
          { label: 'ผลคูณช่องที่ 2 (w₂·x₂)', value: '−1.0 × 1 = −1.0', tone: 'minus' },
          { label: 'บวกค่าไบแอส (Bias b)', value: '+0.5 (จุดตัดเริ่มต้น)', tone: 'skip' },
          { label: 'ผลรวมเชิงเส้น (z)', value: '1.0 − 1.0 + 0.5 = 0.5 🎯', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · ผ่านฟังก์ชันกระตุ้นไม่เชิงเส้น (ReLU Activation: max(0, z))',
        value: 'เมื่อ z = 0.5 → ReLU(0.5) = 0.5 · แต่ถ้า z = −2.5 → ReLU(−2.5) = 0.0 (ตัดค่าลบ)',
        detail: 'หากไม่มี Activation Function โครงข่ายร้อยชั้นจะยุบเหลือแค่สมการเส้นตรงชั้นเดียว! ReLU ช่วยสร้างความไม่เชิงเส้นโดยเปิดผ่านค่าบวกและตัดค่าลบเป็น 0',
        board: { type: 'v3-mm-neuron', activeRow: 1 },
        ops: [
          { label: 'กรณี z บวก (z = 0.5)', value: 'ReLU(0.5) = max(0, 0.5) = 0.5 ✓', tone: 'plus' },
          { label: 'กรณี z ติดลบ (z = −2.5)', value: 'ReLU(−2.5) = max(0, −2.5) = 0.0 ✕', tone: 'skip' },
          { label: 'ทำไมต้องมี Activation?', value: 'ป้องกันโครงข่ายหลายชั้นยุบเป็นเส้นตรงเดียว', tone: 'minus' },
          { label: 'เอาต์พุตของนิวรอน (a)', value: 'พร้อมส่งต่อเป็นฟีเจอร์ให้ชั้นถัดไป', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · การเรียนรู้ปรับน้ำหนักด้วย Gradient Descent (Backpropagation)',
        value: 'w_เก่า = 1.0, η = 0.1, ∂L/∂w = −4.0 → w_ใหม่ = 1.0 − 0.1(−4.0) = 1.4',
        detail: 'เมื่อทายผิด โมเดลจะคำนวณ Loss และส่งความชัน (Gradient) ย้อนกลับมาปรับน้ำหนักในทิศทางตรงข้ามความชันเพื่อลดความผิดพลาดในรอบถัดไป',
        board: { type: 'v3-mm-neuron', activeRow: 2 },
        ops: [
          { label: 'น้ำหนักเดิม (w_old)', value: '1.0', tone: 'minus' },
          { label: 'Learning Rate (η) & ความชัน', value: 'η = 0.1 · ∂L/∂w = −4.0', tone: 'skip' },
          { label: 'สมการอัปเดตน้ำหนัก', value: 'w_new = w_old − η · (∂L/∂w)', tone: 'plus' },
          { label: 'น้ำหนักใหม่ (w_new)', value: '1.0 − 0.1(−4.0) = 1.4 🏆', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · แยกแยะโหมดฝึกสอน (Training) vs โหมดใช้งานจริง (Inference)',
        value: 'Training: คำนวณ Loss + อัปเดต w, b · Inference: ล็อก w, b คงที่ คำนวณขาไปอย่างเดียว',
        detail: 'ในโหมดใช้งานจริง (Serving/Inference) เราจะล็อกค่าน้ำหนัก w และ b ให้นิ่งสนิทแล้วคำนวณเฉพาะขาไป (Forward Pass) เพื่อความเร็วสูงสุด',
        board: { type: 'v3-mm-neuron', activeRow: 3 },
        ops: [
          { label: '🏋️ โหมด Training', value: 'Forward + Loss + Backprop อัปเดต w, b', tone: 'plus' },
          { label: '🚀 โหมด Inference (Serving)', value: 'ล็อก w, b คงที่ · รัน Forward ขาเดียว', tone: 'minus' },
          { label: 'ข้อดีของการล็อกน้ำหนัก', value: 'ประหยัดเวลาและหน่วยความจำตอนเสิร์ฟจริง', tone: 'skip' },
          { label: 'บทบาทใน Multimodal', value: 'รากฐานของ CNN, MLP และ Transformer', tone: 'result' }
        ]
      }
    ],
    'mm-cnn': [
      {
        title: 'ขั้นที่ 1 · วางหน้าต่างตัวกรอง (Kernel) ที่ตำแหน่งเริ่มต้น (Window 1)',
        value: 'อินพุต [1, 2, 0] · Kernel [1, 0, −1] → (1×1) + (2×0) + (0×−1) = +1',
        detail: 'วาง Kernel ขนาด k=3 ลงบน 3 ช่องแรกของอินพุต [1, 2, 0, 3, 1] แล้วจับคู่คูณกันตามตำแหน่งจะได้ค่าช่องแรกของ Feature Map เท่ากับ +1',
        board: { type: 'v3-mm-cnn', activeRow: 0 },
        ops: [
          { label: 'หน้าต่างที่ 1 (ช่อง 1–3)', value: '[1, 2, 0]', tone: 'minus' },
          { label: 'ตัวกรอง Kernel (k = 3)', value: '[1, 0, −1] (ตรวจจับขอบซ้าย-ขวา)', tone: 'skip' },
          { label: 'จับคู่คูณแล้วบวก', value: '1(1) + 2(0) + 0(−1) = 1 + 0 + 0', tone: 'plus' },
          { label: 'Feature Map ช่องที่ 1', value: '+1 🎯', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · เลื่อนหน้าต่างไปทางขวา 1 ช่อง (Stride = 1 → Window 2)',
        value: 'อินพุต [2, 0, 3] · Kernel [1, 0, −1] → (2×1) + (0×0) + (3×−1) = −1',
        detail: 'ขยับหน้าต่างไปทางขวา 1 ช่อง (Stride = 1) ครอบ [2, 0, 3] โดยใช้ Kernel ตัวเดิมเป๊ะ (Weight Sharing) คำนวณได้ 2 + 0 − 3 = −1',
        board: { type: 'v3-mm-cnn', activeRow: 1 },
        ops: [
          { label: 'หน้าต่างที่ 2 (ช่อง 2–4)', value: '[2, 0, 3] (เลื่อนขวา Stride = 1)', tone: 'minus' },
          { label: 'ใช้ Kernel ตัวเดิม', value: '[1, 0, −1] (Weight Sharing)', tone: 'skip' },
          { label: 'จับคู่คูณแล้วบวก', value: '2(1) + 0(0) + 3(−1) = 2 + 0 − 3', tone: 'plus' },
          { label: 'Feature Map ช่องที่ 2', value: '−1 🎯', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · เลื่อนหน้าต่างสู่ตำแหน่งสุดท้าย (Window 3) สรุป Feature Map',
        value: 'อินพุต [0, 3, 1] · Kernel [1, 0, −1] → 0 − 3 − 1 = −1 · ได้ Feature Map [1, −1, −1]',
        detail: 'ขยับหน้าต่างไปครอบ 3 ช่องสุดท้าย [0, 3, 1] คำนวณได้ (0×1)+(3×0)+(1×−1) = −1 สรุปได้แผนที่ฟีเจอร์ขนาด 3 ช่องคือ [1, −1, −1]',
        board: { type: 'v3-mm-cnn', activeRow: 2 },
        ops: [
          { label: 'หน้าต่างที่ 3 (ช่อง 3–5)', value: '[0, 3, 1]', tone: 'minus' },
          { label: 'จับคู่คูณแล้วบวก', value: '0(1) + 3(0) + 1(−1) = −1', tone: 'plus' },
          { label: 'ขนาดเอาต์พุต (L − k + 1)', value: '5 − 3 + 1 = 3 ช่อง', tone: 'skip' },
          { label: 'Feature Map สมบูรณ์', value: '[1, −1, −1] 🏆', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · หัวใจของ CNN: Weight Sharing และ Translation Invariance',
        value: 'ใช้พารามิเตอร์แค่ 3 ตัวสแกนทั้งแถว · วัตถุขยับไปอยู่ตรงไหนในภาพก็ยังตรวจจับเจอ!',
        detail: 'การใช้ Kernel ชุดเดิมสแกนซ้ำทุกตำแหน่ง (Weight Sharing) ช่วยลดจำนวนพารามิเตอร์มหาศาล และทำให้เกิด Translation Invariance (วัตถุเลื่อนตำแหน่งก็ยังจำได้)',
        board: { type: 'v3-mm-cnn', activeRow: 3 },
        ops: [
          { label: 'Weight Sharing', value: 'ใช้พารามิเตอร์ [1, 0, −1] ชุดเดิมทุกจุด', tone: 'plus' },
          { label: 'ประหยัดกว่า MLP อย่างไร?', value: 'ไม่ต้องสร้างน้ำหนักแยกทุกพิกเซล (ลด Overfit)', tone: 'minus' },
          { label: 'Translation Invariance', value: 'แมวอยู่มุมซ้ายหรือขวาก็ตรวจจับได้เหมือนกัน', tone: 'skip' },
          { label: 'บทบาทของหลาย Kernel', value: '1 Kernel = 1 ลวดลาย (เช่น ขอบ, สี, พื้นผิว)', tone: 'result' }
        ]
      }
    ],
    'mm-pooling': [
      {
        title: 'ขั้นที่ 1 · การเติมศูนย์ที่ขอบภาพ (Zero Padding)',
        value: 'เติม 0 รอบขอบอินพุต → รักษาขนาด Feature Map ให้เท่าเดิม และไม่ทิ้งข้อมูลขอบภาพ',
        detail: 'หากไม่เติมขอบ พิกเซลริมสุดจะถูก Kernel ทับแค่ครั้งเดียวและขนาดภาพจะหดลงเรื่อยๆ การทำ Zero Padding ช่วยรักษาขนาดมิติและเก็บรายละเอียดขอบภาพ',
        board: { type: 'v3-mm-pooling', activeRow: 0 },
        ops: [
          { label: 'ปัญหาเมื่อไม่ทำ Padding', value: 'ภาพหดเล็กลงทุกชั้น + ขอบภาพถูกละเลย', tone: 'skip' },
          { label: 'วิธีทำ Zero Padding', value: 'เติมเลข 0 ล้อมรอบขอบอินพุต', tone: 'plus' },
          { label: 'ประโยชน์ข้อที่ 1', value: 'รักษาขนาดความกว้าง/ยาวของ Feature Map', tone: 'minus' },
          { label: 'ประโยชน์ข้อที่ 2', value: 'พิกเซลขอบภาพได้รับการสแกนอย่างทั่วถึง', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · การกำหนดระยะก้าวกระโดด (Stride)',
        value: 'เปลี่ยนจาก Stride = 1 เป็น Stride = 2 → ข้ามทีละ 2 ช่อง ขนาดเอาต์พุตย่อลงครึ่งหนึ่งทันที',
        detail: 'การเพิ่มค่า Stride จาก 1 เป็น 2 ทำให้หน้าต่างตัวกรองกระโดดข้ามทีละ 2 พิกเซล ช่วยลดขนาดข้อมูลและลดภาระการคำนวณลงครึ่งหนึ่งโดยอัตโนมัติ',
        board: { type: 'v3-mm-pooling', activeRow: 1 },
        ops: [
          { label: 'Stride = 1 (ก้าวทีละ 1)', value: 'สแกนละเอียดทุกช่อง · ขนาดเกือบเท่าเดิม', tone: 'minus' },
          { label: 'Stride = 2 (ก้าวทีละ 2)', value: 'กระโดดข้ามทีละ 2 ช่อง · ขนาดลดลง ~50%', tone: 'plus' },
          { label: 'ผลต่อเวลาประมวลผล', value: 'ลดจำนวนครั้งการคูณลงอย่างมาก ⚡', tone: 'skip' },
          { label: 'ข้อควรระวัง', value: 'ถ้าก้าวยาวเกินไปอาจข้ามรายละเอียดเล็กๆ', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · การย่อขนาดด้วย Max Pooling vs Average Pooling (ขนาด 2×2)',
        value: 'บล็อก 2×2: [1, 3; 2, 4] → Max Pooling ดึงค่าเด่นสุด = 4.0 · Avg Pooling เฉลี่ย = 2.5',
        detail: 'Max Pooling คัดเฉพาะสัญญาณที่แรงที่สุดในบริเวณนั้น (4.0) เพื่อบอกว่ารอยหยักหรือวัตถุปรากฏอยู่ตรงนี้ ส่วน Average Pooling เฉลี่ยทุกค่าเข้าด้วยกัน (2.5)',
        board: { type: 'v3-mm-pooling', activeRow: 2 },
        ops: [
          { label: 'บล็อกอินพุต 2×2', value: 'แถวบน [1, 3] · แถวล่าง [2, 4]', tone: 'minus' },
          { label: 'Max Pooling (นิยมสุด)', value: 'max(1, 3, 2, 4) = 4.0 🏆 (เก็บสัญญาณเด่น)', tone: 'plus' },
          { label: 'Average Pooling', value: '(1 + 3 + 2 + 4) ÷ 4 = 2.5 (ภาพรวมนุ่มนวล)', tone: 'skip' },
          { label: 'พารามิเตอร์ที่ต้องเทรนเพิ่ม', value: '0 ตัว! (Pooling ไม่มีน้ำหนักต้องเรียนรู้)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · การขยายขอบเขตการมองเห็นตามความลึก (Receptive Field Hierarchy)',
        value: 'ชั้นแรกเห็นแค่เส้นขอบเล็กๆ → ชั้นกลางเห็นรูปทรง (ตา/หู) → ชั้นลึกเห็นวัตถุทั้งชิ้น!',
        detail: 'เมื่อซ้อน Convolution และ Pooling หลายชั้น ขอบเขตพื้นที่ที่นิวรอน 1 ตัวมองเห็น (Receptive Field) จะกว้างขึ้นเรื่อยๆ จากพิกเซลเล็กๆ สู่ความหมายระดับวัตถุ',
        board: { type: 'v3-mm-pooling', activeRow: 3 },
        ops: [
          { label: 'ชั้นตื้น (Shallow Layers)', value: 'Receptive Field แคบ → เห็นเส้นขอบ / จุดสี', tone: 'minus' },
          { label: 'ชั้นกลาง (Middle Layers)', value: 'Receptive Field กว้างขึ้น → เห็นลวดลาย / ชิ้นส่วน', tone: 'skip' },
          { label: 'ชั้นลึก (Deep Layers)', value: 'Receptive Field ครอบคลุมทั้งภาพ → เห็นวัตถุเต็มชิ้น', tone: 'plus' },
          { label: 'คุณค่าต่อ RecSys', value: 'ได้เวกเตอร์ที่แทนความหมายระดับสูงของสินค้า', tone: 'result' }
        ]
      }
    ],
    'mm-encoders': [
      {
        title: 'ขั้นที่ 1 · 1D-CNN สำหรับข้อความ (TextCNN) และ 2D-CNN สำหรับภาพปก (ResNet)',
        value: '1D Kernel เลื่อนตามลำดับคำ (จับวลี n-gram) · 2D Kernel เลื่อนตามกว้าง×สูงของภาพ',
        detail: 'ในข้อความ 1D-CNN เลื่อนหน้าต่างครอบคำติดกัน (เช่น 3 คำ) เพื่อจับวลีสำคัญ ส่วนในภาพปก 2D-CNN เลื่อนหน้าต่าง 2 มิติ (H×W) เพื่อจับรูปทรงและองค์ประกอบภาพ',
        board: { type: 'v1-mm-encoders', activeRow: 0, secondRow: 1 },
        ops: [
          { label: '📝 1D TextCNN', value: 'เลื่อนตามลำดับคำ → จับวลี (Word n-grams)', tone: 'plus' },
          { label: '🖼️ 2D Image CNN (ResNet)', value: 'เลื่อนตามพิกัด กว้าง × สูง (Spatial H×W)', tone: 'minus' },
          { label: 'สิ่งที่สกัดได้จากภาพปก', value: 'โทนสี · การจัดวาง · ใบหน้า · วัตถุเด่น', tone: 'skip' },
          { label: 'ผลลัพธ์ที่ได้', value: 'เวกเตอร์ข้อความ v^T และเวกเตอร์ภาพ v^I', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · 2D-CNN สำหรับเสียง: แปลงคลื่นเสียงเป็นภาพ Mel-Spectrogram',
        value: 'คลื่นเสียง 1D → แปลงเป็นภาพ 2D Mel-Spectrogram (เวลา × ความถี่) → ใช้ 2D-CNN สแกน!',
        detail: 'เคล็ดลับยอดนิยมในการประมวลผลเสียงคือการแปลงคลื่นเสียงเป็นภาพความถี่ตามเวลา (Mel-Spectrogram) แล้วใช้โครงข่าย 2D-CNN สแกนหาจังหวะและโทนเสียงเหมือนดูรูปภาพ',
        board: { type: 'v1-mm-encoders', activeRow: 2 },
        ops: [
          { label: 'อินพุตเสียงตั้งต้น', value: 'คลื่นเสียงต่อเนื่อง (Raw Waveform)', tone: 'minus' },
          { label: 'แปลงโฉมเป็นภาพ 2 มิติ', value: 'Mel-Spectrogram (แกนเวลา × แกนความถี่)', tone: 'plus' },
          { label: 'ตัวสกัดฟีเจอร์', value: 'ใช้ 2D-CNN สแกนลวดลายความถี่เสียง', tone: 'skip' },
          { label: 'สิ่งที่สกัดได้จากเสียง', value: 'จังหวะดนตรี · โทนเสียงพูด · บรรยากาศ v^A', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · 3D-CNN สำหรับวิดีโอ: สแกน กว้าง × สูง × เวลา (Spatio-Temporal)',
        value: '3D Kernel เป็นลูกบาศก์ (H × W × Time) → สแกนหลายเฟรมพร้อมกันเพื่อจับการเคลื่อนไหว!',
        detail: 'วิดีโอไม่ใช่แค่ภาพนิ่งใบเดียว แต่คือการเคลื่อนไหวข้ามเวลา 3D-CNN จึงใช้ตัวกรองทรงลูกบาศก์สแกนทั้งพื้นที่ภาพและแกนเวลาพร้อมกัน',
        board: { type: 'v1-mm-encoders', activeRow: 3 },
        ops: [
          { label: 'ทำไม 2D-CNN ไม่พอกับวิดีโอ?', value: '2D เห็นแค่ภาพนิ่ง ไม่เห็นทิศทางการเคลื่อนที่', tone: 'skip' },
          { label: 'รูปทรงของ 3D Kernel', value: 'ลูกบาศก์ 3 มิติ (กว้าง × สูง × เฟรมเวลา)', tone: 'plus' },
          { label: 'สิ่งที่ 3D-CNN จับได้', value: 'แอ็กชัน · การซูมกล้อง · การขยับของวัตถุ', tone: 'minus' },
          { label: 'ผลลัพธ์ที่ได้', value: 'เวกเตอร์การเคลื่อนไหวของวิดีโอ v^V 🏆', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · ข้อจำกัดสำคัญของตระกูล CNN (Local Window Limitation)',
        value: 'CNN มองผ่านหน้าต่างแคบๆ ทีละจุด → เชื่อมโยงข้อมูลที่อยู่ห่างกันมากๆ (Long-Range) ได้ยาก!',
        detail: 'เนื่องจาก CNN อาศัยการเลื่อนหน้าต่างขนาดเล็ก จึงเก่งเรื่องลวดลายเฉพาะจุด (Local Patterns) แต่ทำได้ไม่ดีเมื่อต้องเชื่อมโยงคำแรกกับคำสุดท้าย หรือฉากต้นคลิปกับท้ายคลิป',
        board: { type: 'v1-mm-encoders', activeRow: 4 },
        ops: [
          { label: 'จุดแข็งของตระกูล CNN', value: 'จับลวดลายเฉพาะจุด (Local Patterns) เร็วมาก', tone: 'plus' },
          { label: 'จุดอ่อนสำคัญ (Limitation)', value: 'มองผ่านรูหน้าต่างแคบ (Local Receptive Field)', tone: 'skip' },
          { label: 'ปัญหาที่เจอในคลิปยาว', value: 'เชื่อมโยงต้นคลิปกับท้ายคลิป (Long-Range) ยาก', tone: 'minus' },
          { label: 'ทางออกยุคถัดไป', value: 'ก้าวสู่สถาปัตยกรรม Transformer (Attention)', tone: 'result' }
        ]
      }
    ],
    'mm-tokens': [
      {
        title: 'ขั้นที่ 1 · หั่นรูปภาพหรือสเปกโตรแกรมออกเป็นชิ้นย่อย (Patch Splitting)',
        value: 'ภาพ 224×224 หั่นเป็นตาราง Patch ขนาด 16×16 → ได้แผ่นภาพย่อยเรียงกันเหมือนคำศัพท์',
        detail: 'Transformer ถูกออกแบบมาให้รับลำดับโทเค็น (เหมือนคำในประโยค) Vision Transformer (ViT) จึงหั่นภาพออกเป็นแผ่นสี่เหลี่ยมจัตุรัสเล็กๆ (Patches) ไม่ทับซ้อนกัน',
        board: { type: 'v6-mm-tokens', activeRow: 0 },
        ops: [
          { label: 'ทำไมไม่ป้อนทีละพิกเซล?', value: '224×224 = 50,176 จุด (Attention คู่ทั้งหมดจะระเบิด)', tone: 'skip' },
          { label: 'วิธีแก้ของ ViT / AST', value: 'หั่นภาพเป็นแผ่นย่อย (Patch เช่น 16×16 พิกเซล)', tone: 'plus' },
          { label: 'เปรียบเทียบกับ NLP', value: '1 Patch ของภาพ = 1 คำศัพท์ (Token) ในประโยค', tone: 'minus' },
          { label: 'ใช้กับเสียงได้ไหม?', value: 'AST หั่นภาพ Mel-Spectrogram เป็น Patch เช่นกัน', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · รีดเป็นเส้นตรงและฉายสู่เวกเตอร์โทเค็น (Flatten & Linear Projection)',
        value: 'รีดพิกเซลในแต่ละ Patch เป็นเวกเตอร์ยาว → คูณเมทริกซ์ฉายเป็น Patch Embedding (ขนาด d)',
        detail: 'นำค่าสีของพิกเซลในแต่ละ Patch มารีดเรียงต่อกันเป็นเส้นตรง แล้วผ่านชั้น Linear Projection เพื่อแปลงให้เป็นเวกเตอร์โทเค็นขนาด d มิติที่พร้อมเข้า Transformer',
        board: { type: 'v6-mm-tokens', activeRow: 1 },
        ops: [
          { label: '1. Flatten (รีดพิกเซล)', value: 'เรียงพิกเซลใน Patch 16×16×3 เป็นเวกเตอร์เดี่ยว', tone: 'minus' },
          { label: '2. Linear Projection', value: 'คูณเมทริกซ์แปลงเป็น Patch Embedding มิติ d', tone: 'plus' },
          { label: 'ลักษณะของแต่ละโทเค็น', value: 'แทนเนื้อหาภาพย่อยในแต่ละบริเวณ', tone: 'skip' },
          { label: 'สิ่งที่ยังขาดอยู่ในขั้นนี้', value: 'ยังไม่รู้ว่าชิ้นไหนอยู่มุมบนซ้ายหรือล่างขวา!', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · บวกพิกัดบอกตำแหน่ง (Positional Encoding)',
        value: 'Self-Attention ไม่รู้จักลำดับ → ต้องบวก Positional Encoding เพื่อจำว่าชิ้นไหนอยู่ตรงไหน!',
        detail: 'หากสลับชิ้นส่วนจิ๊กซอว์ของใบหน้ามั่วไปหมด Self-Attention แบบดิบจะได้ผลลัพธ์เดิม! จึงต้องบวกเวกเตอร์บอกตำแหน่ง (Positional Encoding) เข้าไปในทุกโทเค็นเสมอ',
        board: { type: 'v6-mm-tokens', activeRow: 2 },
        ops: [
          { label: 'ธรรมชาติของ Self-Attention', value: 'ไม่สนลำดับ (Permutation Invariant) ⚠️', tone: 'skip' },
          { label: 'ถ้าไม่ใส่พิกัดตำแหน่ง?', value: 'ภาพจิ๊กซอว์สลับมั่วจะได้ค่าเท่ากับภาพปกติ!', tone: 'minus' },
          { label: 'วิธีแก้ (Positional Encoding)', value: 'บวกเวกเตอร์ตำแหน่ง E_pos เข้าไปในทุก Patch', tone: 'plus' },
          { label: 'ผลลัพธ์ที่ได้', value: 'โทเค็นจำได้ทั้ง "เนื้อหา" และ "พิกัดในภาพ"', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · เติมโทเค็นพิเศษ [CLS] ด้านหน้าสุดเพื่อสรุปความหมายรวม',
        value: 'วาง [CLS] Token ไว้หน้าสุด → ดึงข้อมูลจากทุก Patch มาสรุปเป็น Item Vector ตัวแทนสินค้า',
        detail: 'วางโทเค็นพิเศษ [CLS] (Classification/Summary Token) ไว้หน้าสุดของลำดับ เพื่อให้มันวิ่งไปรวบรวมบริบทจากทุก Patch ตลอดทุกชั้นของ Transformer',
        board: { type: 'v6-mm-tokens', activeRow: 3 },
        ops: [
          { label: 'ตำแหน่งของ [CLS] Token', value: 'วางไว้หน้าสุด (ตำแหน่งที่ 0 ของลำดับ)', tone: 'plus' },
          { label: 'หน้าที่ระหว่างผ่านชั้นต่างๆ', value: 'ใช้ Attention ดึงสาระสำคัญจากทุก Patch มารวมกัน', tone: 'minus' },
          { label: 'เมื่อถึงชั้นสุดท้าย', value: 'ใช้เวกเตอร์ของ [CLS] เป็นตัวแทนภาพทั้งใบ', tone: 'skip' },
          { label: 'ความยืดหยุ่นของสถาปัตยกรรม', value: 'ใช้โครงสร้างเดียวประมวลผลได้ทั้งข้อความ ภาพ เสียง 🏆', tone: 'result' }
        ]
      }
    ],
    'mm-attention': [
      {
        title: 'ขั้นที่ 1 · บทบาทของ Query (Q), Key (K), และ Value (V)',
        value: 'Q = (1, 0) คือคำถาม · K₁ = (1, 0), K₂ = (0, 1) คือป้ายดัชนี · V₁ = (2, 0), V₂ = (0, 2) คือเนื้อหา',
        detail: 'กลไก Attention ทำงานเหมือนระบบค้นหา: โทเค็นปัจจุบันส่ง Query (Q) ไปเทียบกับป้าย Key (K) ของทุกโทเค็น เพื่อดูว่าควรดึงเนื้อหา Value (V) ของตัวไหนมาใช้มากที่สุด',
        board: { type: 'v3-mm-attention', activeRow: 0 },
        ops: [
          { label: '🔍 Query: Q = (1, 0)', value: 'สิ่งที่โทเค็นปัจจุบันกำลังมองหา', tone: 'plus' },
          { label: '🏷️ Keys: K₁=(1,0), K₂=(0,1)', value: 'ป้ายกำกับของโทเค็นที่ 1 และ 2', tone: 'minus' },
          { label: '📦 Values: V₁=(2,0), V₂=(0,2)', value: 'เนื้อหาจริงที่จะถูกดึงมารวมกัน', tone: 'skip' },
          { label: 'จุดเด่นเหนือ CNN', value: 'จับคู่ข้ามระยะทางไกลแค่ไหนก็ได้ในขั้นตอนเดียว!', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · คำนวณความเข้ากัน Q·Kᵀ แล้วหารด้วย √d_k (Scaled Dot-Product)',
        value: 'Q·K₁ = 1.0, Q·K₂ = 0.0 · หารด้วย √2 ≈ 1.414 → ได้คะแนน [0.707, 0.000]',
        detail: 'เมื่อมิติ d_k สูงขึ้น ผลคูณจุดจะมีขนาดใหญ่จนดันให้ Softmax อิ่มตัว (เข้าใกล้ 1 กับ 0 สุดโต่ง) ทำให้ความชันเหือดหาย (Vanishing Gradient) จึงต้องหารด้วย √d_k เสมอ',
        board: { type: 'v3-mm-attention', activeRow: 1 },
        ops: [
          { label: 'ผลคูณจุดดิบ (Q · Kᵢ)', value: 'Q·K₁ = 1.0 · Q·K₂ = 0.0', tone: 'minus' },
          { label: 'ตัวหารปรับสเกล (√d_k)', value: 'd_k = 2 → √2 ≈ 1.414', tone: 'plus' },
          { label: 'คะแนนหลังหาร (Scaled)', value: 's₁ = 1/√2 ≈ 0.707 · s₂ = 0.000', tone: 'skip' },
          { label: 'ทำไมต้องหารด้วย √d_k?', value: 'ป้องกัน Softmax อิ่มตัวและเกรเดียนต์เหือดหาย 🛡️', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · แปลงคะแนนเป็นสัดส่วนความสนใจด้วย Softmax',
        value: 'Softmax([0.707, 0.000]) → น้ำหนักความสนใจ α₁ ≈ 0.670 (67%) และ α₂ ≈ 0.330 (33%)',
        detail: 'ฟังก์ชัน Softmax แปลงคะแนนให้เป็นความน่าจะเป็นที่เป็นบวกและรวมกันได้ 1.0 พอดี (0.670 + 0.330 = 1.000) บอกว่าต้องโฟกัสโทเค็นที่ 1 ถึง 67%',
        board: { type: 'v3-mm-attention', activeRow: 2 },
        ops: [
          { label: 'ยกกำลัง e^s', value: 'e^0.707 ≈ 2.028 · e^0 = 1.000 (รวม 3.028)', tone: 'minus' },
          { label: 'น้ำหนักตัวที่ 1 (α₁)', value: '2.028 / 3.028 ≈ 0.670 (67%)', tone: 'plus' },
          { label: 'น้ำหนักตัวที่ 2 (α₂)', value: '1.000 / 3.028 ≈ 0.330 (33%)', tone: 'skip' },
          { label: 'คุณสมบัติของ Softmax', value: 'ทุกค่า ≥ 0 และรวมกันได้ 1.000 พอดี', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · รวมเนื้อหา Value ตามน้ำหนักความสนใจ (Weighted Sum of Values)',
        value: 'Output = 0.670·V₁ + 0.330·V₂ = 0.670(2, 0) + 0.330(0, 2) = (1.34, 0.66)',
        detail: 'นำน้ำหนัก α₁=0.670 และ α₂=0.330 ไปคูณกับเวกเตอร์เนื้อหา V₁=(2,0) และ V₂=(0,2) แล้วบวกกัน ได้เวกเตอร์ผลลัพธ์ (1.34, 0.66) ที่หลอมรวมบริบทเรียบร้อย',
        board: { type: 'v3-mm-attention', activeRow: 3 },
        ops: [
          { label: 'ดึงเนื้อหาจากตัวที่ 1 (α₁·V₁)', value: '0.670 × (2, 0) = (1.34, 0.00)', tone: 'plus' },
          { label: 'ดึงเนื้อหาจากตัวที่ 2 (α₂·V₂)', value: '0.330 × (0, 2) = (0.00, 0.66)', tone: 'minus' },
          { label: 'บวกเวกเตอร์ผลลัพธ์รวม', value: '(1.34, 0.00) + (0.00, 0.66)', tone: 'skip' },
          { label: 'Attention Output', value: '(1.34, 0.66) 🏆', tone: 'result' }
        ]
      }
    ],
    'mm-transformer-block': [
      {
        title: 'ขั้นที่ 1 · Multi-Head Attention (MHA): ส่องสปอตไลต์หลายมุมมองพร้อมกัน',
        value: 'แยกเวกเตอร์เป็นหลายหัวย่อย (Heads) → จับความสัมพันธ์คนละมิติพร้อมกันแล้วนำมาต่อกัน',
        detail: 'แทนที่จะมองมุมเดียว Multi-Head Attention แบ่งการคำนวณออกเป็นหลายหัว เช่น หัวที่ 1 จับคู่สีและรูปทรง หัวที่ 2 จับคู่จังหวะเวลา หัวที่ 3 จับคู่ความหมายคำ',
        board: { type: 'v6-mm-transformer-block', activeRow: 0 },
        ops: [
          { label: 'ทำไมไม่ใช้แค่ 1 Head?', value: 'หัวเดียวมักถูกครอบงำด้วยความสัมพันธ์มุมเดียว', tone: 'skip' },
          { label: 'กลไก Multi-Head (MHA)', value: 'รัน Attention ขนานกันหลายหัว (คนละชุด Q,K,V)', tone: 'plus' },
          { label: 'สิ่งที่แต่ละหัวมองเห็น', value: 'หัว 1: สี/ตำแหน่ง · หัว 2: เวลา · หัว 3: เนื้อหา', tone: 'minus' },
          { label: 'ผลลัพธ์ของ MHA', value: 'เก็บความสัมพันธ์ได้ครบทุกแง่มุมในเวลาเดียวกัน', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · Residual Connection (สะพานทางด่วน x + Sublayer(x))',
        value: 'นำอินพุตเดิม x บวกเข้ากับผลลัพธ์ของชั้นย่อย → ป้องกันเกรเดียนต์เหือดหาย (Vanishing Gradient)',
        detail: 'เมื่อซ้อนโครงข่ายลึกหลายสิบชั้น สัญญาณความชันมักลดทอนจนหายไป การสร้างทางด่วนบวกอินพุตเดิม x เข้าไปตรงๆ ช่วยให้เกรเดียนต์ไหลย้อนกลับได้อย่างราบรื่น',
        board: { type: 'v6-mm-transformer-block', activeRow: 1 },
        ops: [
          { label: 'สมการทางด่วน (Residual)', value: 'Output = x + Sublayer(x)', tone: 'plus' },
          { label: 'ปัญหาที่ช่วยกอบกู้', value: 'ป้องกัน Vanishing Gradient ในโครงข่ายลึก 🛡️', tone: 'minus' },
          { label: 'ผลต่อข้อมูลต้นฉบับ', value: 'ไม่ลืมข้อมูลตั้งต้น x แม้ผ่านการแปลงหลายชั้น', tone: 'skip' },
          { label: 'ผลลัพธ์ทางวิศวกรรม', value: 'ซ้อน Transformer ได้ลึกหลายสิบชั้นอย่างมั่นคง', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · Layer Normalization (LayerNorm) และ Feed-Forward Network (FFN)',
        value: 'LayerNorm คุมค่าเฉลี่ยและความแปรปรวนให้นิ่ง → FFN ประมวลผลความเข้าใจไม่เชิงเส้นรายโทเค็น',
        detail: 'LayerNorm ปรับสเกลตัวเลขในแต่ละโทเค็นให้เสถียร (ไม่ระเบิดหรือเหือดหาย) จากนั้นส่งเข้าโครงข่าย FFN (MLP + Activation) เพื่อกลั่นกรองความหมายเชิงลึก',
        board: { type: 'v6-mm-transformer-block', activeRow: 2 },
        ops: [
          { label: 'หน้าที่ของ LayerNorm', value: 'คุม Mean = 0, Variance = 1 ในแต่ละเวกเตอร์', tone: 'plus' },
          { label: 'ประโยชน์ของ LayerNorm', value: 'ป้องกันตัวเลขระเบิด · เทรนลู่เข้าเร็วและเสถียร', tone: 'minus' },
          { label: 'หน้าที่ของ FFN (MLP)', value: 'แปลงฟีเจอร์แบบไม่เชิงเส้นทีละโทเค็นอย่างอิสระ', tone: 'skip' },
          { label: 'โครงสร้างครบลูป 1 บล็อก', value: 'MHA → Add&Norm → FFN → Add&Norm', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · การดึงเวกเตอร์ตัวแทนสินค้าจากชั้นสุดท้าย (Item Vector Extraction)',
        value: 'ดึงเวกเตอร์จากโทเค็น [CLS] หรือทำ Mean Pooling เฉลี่ยทุกโทเค็นในชั้นสุดท้าย',
        detail: 'เมื่อข้อมูลไหลผ่านทุกบล็อกจนถึงชั้นบนสุด เราจะดึงเวกเตอร์ของโทเค็น [CLS] หรือนำเวกเตอร์ของทุกโทเค็นมาหาค่าเฉลี่ย (Mean Pooling) เพื่อใช้เป็น Item Vector',
        board: { type: 'v6-mm-transformer-block', activeRow: 3 },
        ops: [
          { label: 'วิธีที่ 1: ดึงจาก [CLS]', value: 'ใช้เวกเตอร์ตำแหน่งแรกที่สรุปภาพรวมมาแล้ว', tone: 'plus' },
          { label: 'วิธีที่ 2: Mean Pooling', value: 'เฉลี่ยเวกเตอร์ของทุกโทเค็นในชั้นสุดท้ายเข้าด้วยกัน', tone: 'minus' },
          { label: 'ขั้นตอนสุดท้ายก่อนเก็บลง DB', value: 'Projection + L2 Normalization ให้ยาว 1.0', tone: 'skip' },
          { label: 'ผลลัพธ์ปลายทาง', value: 'Item Embedding พร้อมใช้ในระบบแนะนำ 🏆', tone: 'result' }
        ]
      }
    ],
    'mm-profiles': [
      {
        title: 'ขั้นที่ 1 · เฉลี่ยและปรับขนาดโปรไฟล์ข้อความ (p^T) และภาพปก (p^I) ของ 👩 ฟ้า',
        value: 'p^T: เฉลี่ย (1,0) กับ (0.8,0.6) ได้ (0.9,0.3) → L2 Norm ได้ (0.9487, 0.3162)',
        detail: 'จากคลิปที่ 👩 ฟ้า เคยชอบในชุดฝึก (H1, H2) เราหาค่าเฉลี่ยแยกตามสื่อแล้วทำ L2 Normalization ให้เวกเตอร์โปรไฟล์มีความยาวเท่ากับ 1.0 เสมอ',
        board: { type: 'v3-mm-profiles', activeRow: 0, secondRow: 1 },
        ops: [
          { label: 'ข้อความ H1^T และ H2^T', value: '(1.0, 0.0) และ (0.8, 0.6)', tone: 'minus' },
          { label: 'ค่าเฉลี่ยข้อความ μ^T', value: '((1+0.8)/2, (0+0.6)/2) = (0.9, 0.3)', tone: 'skip' },
          { label: 'L2 Norm (p^T)', value: '(0.9, 0.3) ÷ √0.90 = (0.9487, 0.3162) 🎯', tone: 'plus' },
          { label: 'โปรไฟล์ภาพปก (p^I)', value: 'เฉลี่ย (0.3, 0.9) → (0.3162, 0.9487)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · เฉลี่ยและปรับขนาดโปรไฟล์เสียง (p^A) และวิดีโอ (p^V) ของ 👩 ฟ้า',
        value: 'p^A = (0.3162, 0.9487) และ p^V = (0.9487, 0.3162) · ครบ 4 โปรไฟล์ประจำตัวฟ้า',
        detail: 'คำนวณแบบเดียวกันสำหรับสื่อเสียง (A) และสื่อวิดีโอ (V) แล้วปรับความยาวให้เป็น 1.0 เพื่อให้ผลคูณจุดกับเวกเตอร์สินค้ามีค่าเท่ากับ Cosine Similarity พอดี',
        board: { type: 'v3-mm-profiles', activeRow: 2, secondRow: 3 },
        ops: [
          { label: 'โปรไฟล์เสียง (p^A)', value: 'เฉลี่ย (0.3, 0.9) → (0.3162, 0.9487)', tone: 'plus' },
          { label: 'โปรไฟล์วิดีโอ (p^V)', value: 'เฉลี่ย (0.9, 0.3) → (0.9487, 0.3162)', tone: 'minus' },
          { label: 'ทำไมต้องทำ L2 Norm?', value: 'ให้เวกเตอร์ยาว 1.0 (Dot Product = Cosine พอดี)', tone: 'skip' },
          { label: 'ได้โปรไฟล์ครบ 4 สื่อ', value: '{p^T, p^I, p^A, p^V} แยกอิสระต่อกัน 🏆', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · ทำไมต้องแยกโปรไฟล์รายสื่อ? (Preserving Modality-Specific Tastes)',
        value: 'ฟ้าชอบข้อความสายเนื้อหา (แกน 1 = 0.95) แต่ชอบภาพปกและเสียงสายอารมณ์ (แกน 2 = 0.95)!',
        detail: 'สังเกตว่าในสื่อข้อความและวิดีโอ ฟ้าชอบแกนที่ 1 (0.9487) แต่ในสื่อภาพและเสียง ฟ้ากลับชอบแกนที่ 2 (0.9487) การแยกโปรไฟล์ช่วยรักษารสนิยมที่ต่างกันในแต่ละสื่อไว้ได้ครบถ้วน',
        board: { type: 'v3-mm-profiles', activeRow: 0, secondRow: 2 },
        ops: [
          { label: 'รสนิยมด้านข้อความ (p^T)', value: 'เน้นแกนที่ 1 สูงถึง 0.9487 (เนื้อหาวิชาการ)', tone: 'plus' },
          { label: 'รสนิยมด้านภาพ/เสียง (p^I, p^A)', value: 'เน้นแกนที่ 2 สูงถึง 0.9487 (สไตล์มินิมอล/ผ่อนคลาย)', tone: 'minus' },
          { label: 'ถ้าจับทุกสื่อเฉลี่ยปนกัน?', value: 'ตัวเลขจะหักล้างกันจนเสียอัตลักษณ์เฉพาะสื่อ!', tone: 'skip' },
          { label: 'ข้อดีของการแยกรายสื่อ', value: 'เก็บความชอบคนละแนวในแต่ละสื่อได้สมบูรณ์', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · กฎเหล็กระดับวิกฤต: ห้ามคูณข้ามสื่อที่ยังไม่จัดแนว (The Unaligned Space Trap)',
        value: 'ห้ามนำ p^Text ไปทำ Dot Product กับ v^Image เด็ดขาด! เพราะแกนที่ 1 แทนคนละความหมาย',
        detail: 'เวกเตอร์จาก Text Encoder และ Image Encoder ที่ฝึกแยกกันอยู่ในคนละปริภูมิความหมาย (Unaligned Spaces) ต้องเทียบ p^T กับ v^T ในสื่อเดียวกันเท่านั้น (ยกเว้นใช้โมเดลที่จัดแนวแล้วอย่าง CLIP)',
        board: { type: 'v3-mm-profiles', activeRow: 4 },
        ops: [
          { label: '✅ การจับคู่ที่ถูกต้อง', value: 'p^T · v^T (ข้อความเทียบข้อความในปริภูมิเดียวกัน)', tone: 'plus' },
          { label: '🚫 ข้อห้ามเด็ดขาด', value: 'ห้ามนำ p^Text · v^Image โดยตรง! 💥', tone: 'skip' },
          { label: 'สาเหตุทางคณิตศาสตร์', value: 'Encoder คนละตัว → แกนเดียวกันไม่ได้แปลเหมือนกัน', tone: 'minus' },
          { label: 'ข้อยกเว้นเดียวที่ทำได้', value: 'เมื่อผ่านการฝึก Joint Alignment เช่น CLIP แล้ว', tone: 'result' }
        ]
      }
    ],
    'mm-late': [
      {
        title: 'ขั้นที่ 1 · ให้คะแนนแยกตามสื่ออย่างอิสระ (Modality-Specific Scoring)',
        value: 'คำนวณ S_m = p^m · v^m แยกทีละสื่อ (T, I, A, V) เหมือนคณะลูกขุน 4 คนตรวจแยกห้อง',
        detail: 'ในแต่ละสื่อ เราคำนวณความคล้าย Cosine ระหว่างโปรไฟล์ของ 👩 ฟ้า กับผู้สมัครแต่ละชิ้นอย่างอิสระ ได้คะแนนย่อย 4 ช่องต่อคลิป (S_T, S_I, S_A, S_V)',
        board: { type: 'v4-mm-late', activeRow: 0 },
        ops: [
          { label: 'หลักการ Late Fusion', value: 'รวมคะแนนในขั้นตอนตัดสินใจ (Decision-Level)', tone: 'plus' },
          { label: 'ตัวอย่างคลิป M3 (ชุดข้อมูล)', value: 'S_T=0.9487, S_I=0.9487, S_A=0.5692, S_V=0.8222', tone: 'minus' },
          { label: 'ตัวอย่างโจทย์คำนวณย่อย', value: 'ถ้า S = (0.9487, 0.3162, 0.2635, 0.9487)', tone: 'skip' },
          { label: 'ผลรวมถ่วงน้ำหนักโจทย์ย่อย', value: '0.4(.9487)+0.2(.3162)+0.2(.2635)+0.2(.9487) = 0.6852', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · ถ่วงน้ำหนักรวมคะแนนของ M3 และ M4 (Weighted Linear Combination)',
        value: 'น้ำหนัก w = (0.4, 0.2, 0.2, 0.2) → คลิป M3 ได้ 0.8475 · คลิป M4 ได้ 0.6957',
        detail: 'นำคะแนนย่อยแต่ละสื่อมาคูณน้ำหนักความสำคัญ (T=0.4, I=0.2, A=0.2, V=0.2) แล้วบวกเข้าด้วยกัน คลิป M4 แม้ข้อความตรงใจ (0.9487) แต่ภาพและวิดีโอได้น้อย (0.3162) จึงได้รวม 0.6957',
        board: { type: 'v4-mm-late', activeRow: 1 },
        ops: [
          { label: 'ค่าน้ำหนักรายสื่อ (w_m)', value: 'w_T = 0.4 · w_I = 0.2 · w_A = 0.2 · w_V = 0.2', tone: 'minus' },
          { label: 'คะแนนย่อยของ 🖥️ M4', value: 'T=0.9487, I=0.3162, A=0.9487, V=0.3162', tone: 'skip' },
          { label: 'คำนวณ Late Fusion (M4)', value: '0.4(.9487)+0.2(.3162)+0.2(.9487)+0.2(.3162)', tone: 'plus' },
          { label: 'คะแนนรวมของ 🖥️ M4', value: '0.6957 (ตกไปอยู่อันดับ 3)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · เปรียบเทียบผู้ชนะ 🛠️ คลิป M5 (สมดุลทุกสื่อและวิดีโอเด่นสุด)',
        value: '🛠️ M5 ได้ S_T=0.8222, S_I=0.8222, S_A=0.8222, S_V=0.9487 → รวม 0.8475 🏆',
        detail: 'คลิป M5 มีคะแนนดีสม่ำเสมอในทุกสื่อและโดดเด่นมากในสื่อวิดีโอ (0.9487) เมื่อรวมถ่วงน้ำหนักจึงได้ 0.8475 คว้าอันดับ 1 ร่วมกับ M3 อย่างโปร่งใส',
        board: { type: 'v4-mm-late', activeRow: 2 },
        ops: [
          { label: 'คะแนนย่อยของ 🛠️ M5', value: 'T = 0.8222 · I = 0.8222 · A = 0.8222 · V = 0.9487', tone: 'plus' },
          { label: 'คำนวณ Late Fusion (M5)', value: '0.8(0.8222) + 0.2(0.9487) = 0.6578 + 0.1897', tone: 'minus' },
          { label: 'คะแนนรวมสุทธิ', value: '0.8475 🏆 (ชนะ M4 ที่ได้ 0.6957)', tone: 'result' },
          { label: 'คำอธิบายผลลัพธ์ (Explainable)', value: 'แนะนำเพราะวิดีโอตรงใจ 95% และสื่ออื่น 82%', tone: 'skip' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · จุดแข็ง 3 ด้านในโปรดักชัน vs ข้อจำกัดของ Late Fusion',
        value: 'เด่น: Modular อัปเกรดแยกสื่อได้ · ทนสื่อหาย · อธิบายง่าย | ข้อจำกัด: ไม่เห็นปฏิสัมพันธ์ข้ามสื่อระดับลึก',
        detail: 'Late Fusion นิยมที่สุดในระบบจริงเพราะเปลี่ยนโมเดลรายสื่อได้อิสระและรับมือสื่อขาดหายได้ง่าย แต่มีข้อจำกัดคือไม่สามารถจับความสัมพันธ์ข้ามสื่อระดับลึกตั้งแต่ต้นทางได้',
        board: { type: 'v4-mm-late', activeRow: 3 },
        ops: [
          { label: '1. Modular Engineering', value: 'อัปเกรด Image Encoder ใหม่โดยไม่ต้องเทรนสื่ออื่นใหม่', tone: 'plus' },
          { label: '2. Missing Modality Robust', value: 'ถ้าเสียงหาย แค่ตัดพจน์เสียงแล้วปรับฐานน้ำหนักใหม่', tone: 'minus' },
          { label: '3. Explainability', value: 'แยกบอกเหตุผลรายสื่อให้ผู้ใช้เข้าใจได้ทันที', tone: 'skip' },
          { label: 'ข้อจำกัด (Limitation)', value: 'ไม่เห็นปฏิสัมพันธ์ข้ามสื่อระดับลึก (Cross-Modal)', tone: 'result' }
        ]
      }
    ],
    'mm-early': [
      {
        title: 'ขั้นที่ 1 · ถ่วงน้ำหนักแต่ละบล็อกด้วยรากที่สอง (√w_m Block Scaling)',
        value: 'คูณ √w_m ทั้งฝั่ง User และ Item → เมื่อ Dot Product กันจะได้ (√w_m × √w_m) = w_m พอดี!',
        detail: 'หากต้องการให้สื่อข้อความมีน้ำหนัก w_T = 0.4 ในผลคูณจุดรวม เราต้องคูณเวกเตอร์ข้อความด้วย √0.4 ≈ 0.6325 ทั้งฝั่งผู้ใช้และสินค้า เพื่อให้ √0.4 × √0.4 = 0.4',
        board: { type: 'v3-mm-early', activeRow: 0 },
        ops: [
          { label: 'ทำไมไม่คูณด้วย w_m ตรงๆ?', value: 'ถ้าคูณ w_m ทั้งสองฝั่ง ผลคูณจุดจะกลายเป็น w_m²!', tone: 'skip' },
          { label: 'เคล็ดลับพีชคณิต √w_m', value: '(√w_m p^m) · (√w_m v^m) = w_m (p^m · v^m) 🎯', tone: 'plus' },
          { label: 'ตัวคูณสเกลของแต่ละบล็อก', value: '√0.4 ≈ 0.6325 (Text) · √0.2 ≈ 0.4472 (I, A, V)', tone: 'minus' },
          { label: 'ผลรวมความยาวเวกเตอร์ต่อกัน', value: '‖P_early‖² = 0.4 + 0.2 + 0.2 + 0.2 = 1.0 พอดี', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · ต่อเวกเตอร์ทุกสื่อเป็นเส้นยาวเส้นเดียว (Feature Concatenation)',
        value: 'นำ 4 สื่อ (สื่อละ 2 มิติ) มาต่อท้ายกัน → ได้เวกเตอร์รวม 2 + 2 + 2 + 2 = 8 มิติ!',
        detail: 'Early Fusion นำเวกเตอร์ที่ปรับสเกลแล้วของทั้ง 4 สื่อมาวางเรียงต่อท้ายกันเป็นเวกเตอร์เดี่ยวขนาด 8 มิติ แล้วคำนวณ Dot Product หรือส่งเข้า MLP เพียงรอบเดียว',
        board: { type: 'v3-mm-early', activeRow: 1 },
        ops: [
          { label: 'รูปแบบการต่อ (Concatenate)', value: 'x_early = [√w_T v^T ; √w_I v^I ; √w_A v^A ; √w_V v^V]', tone: 'plus' },
          { label: 'ความยาวมิติรวม', value: '2 + 2 + 2 + 2 = 8 มิติ (ค้นใน ANN รอบเดียว)', tone: 'minus' },
          { label: 'ข้อได้เปรียบหลัก', value: 'หากต่อด้วย MLP จะเรียนรู้ Cross-Modal ได้ตั้งแต่ชั้นแรก', tone: 'skip' },
          { label: 'ผลลัพธ์ Dot Product รวม', value: 'ได้คะแนนตรงกับ Late Fusion (M5 = 0.8475 🏆)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · จุดอ่อนที่ 1: ความเปราะบางต่อข้อมูลขาดหาย (Missing Modality Fragility)',
        value: 'หากคลิปไม่มีเสียง → ช่องที่ 5–6 ของเวกเตอร์ 8 มิติจะแหว่งทันที! คำนวณต่อตรงๆ ไม่ได้',
        detail: 'เพราะ Early Fusion บังคับให้เวกเตอร์มีความยาวคงที่ 8 มิติเสมอ หากสินค้าชิ้นใดขาดข้อมูลไปเพียง 1 สื่อ เวกเตอร์จะเกิดรูโหว่และไม่สามารถเข้าโมเดลตามปกติได้ทันที',
        board: { type: 'v3-mm-early', activeRow: 2 },
        ops: [
          { label: 'เมื่อสินค้าขาดสื่อเสียง (A)', value: '[√w_T v^T ; √w_I v^I ; ❌ ว่าง! ; √w_V v^V]', tone: 'skip' },
          { label: 'ผลกระทบต่อโครงข่าย', value: 'มิติเวกเตอร์ไม่ครบ 8 ช่อง → คูณเมทริกซ์ไม่ได้ 💥', tone: 'minus' },
          { label: 'เทียบกับ Late Fusion', value: 'Late Fusion แค่ตัดพจน์เสียงออก แต่ Early พังทั้งเส้น', tone: 'plus' },
          { label: 'บทสรุปความเสี่ยง', value: 'เปราะบางมากในระบบจริงที่ข้อมูลมักไม่ครบ', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · จุดอ่อนที่ 2: ปัญหาการครอบงำของมิติ (Dimension Dominance)',
        value: 'ถ้าภาพมี 2048 มิติ แต่ข้อความมีแค่ 64 มิติ → ระยะห่างของภาพจะกลบข้อความจนมิด!',
        detail: 'หากนำเวกเตอร์ดิบที่มีจำนวนมิติต่างกันมากมาต่อกันโดยไม่ทำ Projection และปรับสเกล สื่อที่มีจำนวนช่องมากกว่า (เช่น 2048 มิติ) จะครอบงำค่าผลรวมระยะทางทั้งหมด',
        board: { type: 'v3-mm-early', activeRow: 3 },
        ops: [
          { label: 'สาเหตุของ Dimension Dominance', value: 'จำนวนมิติไม่เท่ากัน (เช่น ภาพ 2048D vs ข้อความ 64D)', tone: 'skip' },
          { label: 'ผลกระทบต่อระยะทางเวกเตอร์', value: 'ผลรวม 2048 ช่องกลบผลรวม 64 ช่องจนหมดสิ้น ⚠️', tone: 'minus' },
          { label: 'วิธีป้องกันที่ถูกต้อง', value: 'ทำ Linear Projection + L2 Norm + คูณ √w_m ก่อนเสมอ', tone: 'plus' },
          { label: 'เมื่อไหร่ควรใช้ Early Fusion?', value: 'เมื่อข้อมูลครบ 100% และต้องการค้นด้วยดัชนีเดียว', tone: 'result' }
        ]
      }
    ],
    'mm-intermediate': [
      {
        title: 'ขั้นที่ 1 · ประตูอัจฉริยะปรับน้ำหนักตามบริบทสินค้า (Dynamic Gating Mechanism)',
        value: 'คลิปดนตรี: เปิดรับเสียง g_A = 0.80 · คลิปหนังเงียบ: หรี่เสียงเหลือ g_A = 0.05 เปิดวิดีโอ 0.70!',
        detail: 'แทนที่จะใช้น้ำหนักคงที่กับทุกคลิป Gating Network จะวิเคราะห์เนื้อหาของสินค้าแต่ละชิ้นแล้วปรับสัดส่วนประตู (Gate g_m) ให้เหมาะกับบริบทของสินค้านั้นโดยอัตโนมัติ',
        board: { type: 'v6-mm-intermediate', activeRow: 0 },
        ops: [
          { label: 'จุดอ่อนของน้ำหนักคงที่ (Static)', value: 'ให้เสียงสำคัญเท่ากันทุกคลิป ทำให้หนังเงียบเสียเปรียบ', tone: 'skip' },
          { label: 'กลไก Dynamic Gating', value: 'คำนวณประตูปรับน้ำหนัก g_m ตามบริบทของแต่ละชิ้น', tone: 'plus' },
          { label: 'ตัวอย่างคลิปเพลง vs หนังเงียบ', value: 'เพลงเปิด g_A = 80% · หนังเงียบเปิด g_V = 70%', tone: 'minus' },
          { label: 'ผลลัพธ์ที่ได้', value: 'ยืดหยุ่นตามธรรมชาติของสินค้าแต่ละประเภท 🎯', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · การเชื่อมโยงข้ามสื่อด้วย Cross-Attention (Text Queries Video)',
        value: 'ใช้ข้อความเป็น Query (Q) ยิงไปค้นหาเฟรมวิดีโอที่เป็น Key/Value (K, V) เพื่อจับคู่ฉากสำคัญ',
        detail: 'Cross-Attention ให้สื่อหนึ่งตั้งคำถาม (Query) เพื่อค้นหาชิ้นส่วนที่สอดคล้องกันในอีกสื่อหนึ่ง (Key/Value) เช่น คำว่า "ต้มยำกุ้งเดือด" จับคู่เข้ากับเฟรมวิดีโอวินาทีที่ 15',
        board: { type: 'v6-mm-intermediate', activeRow: 1 },
        ops: [
          { label: 'ตัวตั้งคำถาม (Query Q)', value: 'ดึงมาจากเวกเตอร์สื่อข้อความ (Text Tokens)', tone: 'plus' },
          { label: 'คลังข้อมูลที่ถูกค้น (Key K, Value V)', value: 'ดึงมาจากเฟรมภาพหรือวิดีโอ (Visual Tokens)', tone: 'minus' },
          { label: 'สิ่งที่โมเดลเรียนรู้ได้', value: 'เข้าใจว่าคำพูดไหนตรงกับภาพฉากไหนพอดี', tone: 'skip' },
          { label: 'เหนือกว่า Late Fusion อย่างไร?', value: 'จับปฏิสัมพันธ์ข้ามสื่อระดับลึก (Cross-Modal) ได้จริง', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · การจัดแนวสู่พื้นที่ความหมายร่วมกัน (Shared Semantic Space / CLIP)',
        value: 'Contrastive Learning ดึงคู่ (ภาพ, ข้อความ) ของชิ้นเดียวกันให้ชี้ไปทิศเดียวกันในพิกัดร่วม!',
        detail: 'โมเดลอย่าง CLIP ฝึกฝนบนคู่ภาพและคำบรรยายนับร้อยล้านคู่ โดยดึงคู่ที่ตรงกันให้เข้าใกล้กันและผลักคู่ที่ไม่เกี่ยวกันออกห่าง จนสามารถเปรียบเทียบภาพกับข้อความได้โดยตรง',
        board: { type: 'v6-mm-intermediate', activeRow: 2 },
        ops: [
          { label: 'เป้าหมายของ CLIP', value: 'สร้างพื้นที่พิกัดความหมายร่วมกัน (Joint Semantic Space)', tone: 'plus' },
          { label: 'วิธีการฝึก (Contrastive Loss)', value: 'ดึงคู่ (ภาพ, ข้อความ) ที่ตรงกันเข้าหากัน · ผลักคู่อื่นออก', tone: 'minus' },
          { label: 'ความสามารถพิเศษหลังฝึกเสร็จ', value: 'นำข้อความค้นหารูปภาพข้ามสื่อ (Cross-Modal Search) ได้ทันที!', tone: 'skip' },
          { label: 'แก้หลุมพราง Unaligned Space', value: 'คูณ Dot Product ข้ามสื่อได้อย่างถูกต้องตามหลักการ 🏆', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · ข้อแลกเปลี่ยนทางวิศวกรรม (The Intermediate Fusion Trade-off)',
        value: 'ได้ความแม่นยำและเข้าใจบริบทข้ามสื่อลึกซึ้ง แลกกับความซับซ้อนและต้นทุนการเทรนที่สูงขึ้น',
        detail: 'Intermediate Fusion เก่งที่สุดในการจับความสัมพันธ์ซับซ้อน แต่ต้องแลกมาด้วยจำนวนพารามิเตอร์ที่มากขึ้น ใช้เวลาเทรนนานขึ้น และตรวจสอบดีบักยากกว่า Late Fusion',
        board: { type: 'v6-mm-intermediate', activeRow: 3 },
        ops: [
          { label: 'จุดเด่นสูงสุด', value: 'เข้าใจบริบทข้ามสื่อลึกซึ้ง + ปรับน้ำหนักอัจฉริยะ', tone: 'plus' },
          { label: 'ต้นทุนที่ต้องจ่าย (Cost)', value: 'โครงข่ายซับซ้อน · ใช้ GPU เทรนสูงกว่า Late Fusion', tone: 'minus' },
          { label: 'ความยากในการดูแลรักษา', value: 'เปลี่ยน Encoder ตัวใดตัวหนึ่งต้องจูนรอยต่อใหม่', tone: 'skip' },
          { label: 'คำแนะนำในระบบจริง', value: 'ใช้ในด่าน Ranking เมื่อพิสูจน์แล้วว่าคุ้มค่ากว่า Late Fusion', tone: 'result' }
        ]
      }
    ],
    'mm-missing': [
      {
        title: 'ขั้นที่ 1 · บันทึกสถานะความพร้อมของสื่อด้วย Availability Mask',
        value: 'คลิปพอดแคสต์ไม่มีวิดีโอ → บันทึก Availability Mask = [1, 1, 1, 0] (T=1, I=1, A=1, V=0)',
        detail: 'ในโลกจริง สินค้าจำนวนมากมีสื่อไม่ครบ (เช่น พอดแคสต์ไม่มีวิดีโอ หรือโพสต์ใหม่ไม่มีเสียง) ระบบต้องเก็บ Availability Mask ระบุว่าสื่อใดมีอยู่จริง (1) และสื่อใดขาดหาย (0)',
        board: { type: 'v1-mm-missing', activeRow: 0 },
        ops: [
          { label: 'ความจริงในระบบ Production', value: 'สินค้าจำนวนมากมีสื่อไม่ครบทุกช่อง', tone: 'minus' },
          { label: 'Availability Mask [1, 1, 1, 0]', value: 'มี T, I, A พร้อมใช้งาน (1) · ขาดวิดีโอ V (0)', tone: 'plus' },
          { label: 'หน้าที่ของ Mask ในโค้ด', value: 'บอกระบบให้ตัดพจน์ที่ขาดออกก่อนคำนวณคะแนน', tone: 'skip' },
          { label: 'ผลเสียถ้าไม่ตรวจ Mask', value: 'ระบบแครช (Null Error) หรือได้คะแนนเพี้ยนทันที', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · หลุมพรางการเติมเวกเตอร์ศูนย์ (The Zero Imputation Trap)',
        value: 'อันตราย: การแทนสื่อที่หายด้วย (0, 0) จะกดคะแนนรวมให้ต่ำลงและสร้างพิกัดหลอกใน Dense Space!',
        detail: 'ในพื้นที่เวกเตอร์หนาแน่น พิกัด (0, 0) มีความหมายทางเรขาคณิต และการให้คะแนนสื่อที่หายเป็น 0 จะทำให้สินค้าที่มีสื่อไม่ครบถูกกดคะแนนรวมให้ต่ำกว่าสินค้าที่มีสื่อครบอย่างไม่เป็นธรรม',
        board: { type: 'v1-mm-missing', activeRow: 1 },
        ops: [
          { label: 'Zero Imputation คืออะไร?', value: 'ยัดเวกเตอร์ [0, 0, ..., 0] แทนสื่อที่หายไป', tone: 'skip' },
          { label: 'ผลเสียข้อที่ 1 (Dense Space)', value: 'เลข 0 คือพิกัดจริงจุดหนึ่ง โมเดลเข้าใจผิดว่าเป็นฟีเจอร์จริง 💥', tone: 'minus' },
          { label: 'ผลเสียข้อที่ 2 (คะแนนรวมตก)', value: 'ได้ 0 แต้มในช่องที่หาย → คะแนนรวมสูงสุดเหลือแค่ 0.80!', tone: 'skip' },
          { label: 'ข้อสรุปทางวิศวกรรม', value: 'ห้ามเติม 0 ดื้อๆ โดยไม่ใช้ Mask และปรับฐานน้ำหนัก', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · การปรับฐานค่าน้ำหนักใหม่ (Weight Re-normalization)',
        value: 'เมื่อ V หายไป: ผลรวมน้ำหนักที่เหลือ = 0.4 + 0.2 + 0.2 = 0.8 → หารด้วย 0.8 ได้ w ใหม่ (0.50, 0.25, 0.25)',
        detail: 'วิธีที่ถูกต้องและยุติธรรมที่สุดใน Late Fusion คือการนำน้ำหนักของสื่อที่มีอยู่จริงมารวมกัน (0.8) แล้วนำไปหารน้ำหนักแต่ละตัว เพื่อให้ผลรวมน้ำหนักใหม่กลับมาเต็ม 1.00 พอดี',
        board: { type: 'v1-mm-missing', activeRow: 2 },
        ops: [
          { label: 'ผลรวมน้ำหนักสื่อที่มี (T, I, A)', value: '0.4 + 0.2 + 0.2 = 0.8 (ขาด V ไป 0.2)', tone: 'minus' },
          { label: 'ปรับฐานน้ำหนักใหม่ (÷ 0.8)', value: 'w_T′ = 0.4/0.8 = 0.50 · w_I′ = w_A′ = 0.2/0.8 = 0.25', tone: 'plus' },
          { label: 'ตรวจผลรวมน้ำหนักใหม่', value: '0.50 + 0.25 + 0.25 = 1.00 พอดีเป๊ะ! ✓', tone: 'skip' },
          { label: 'คะแนนหลังปรับฐาน', value: '0.6768 ÷ 0.8 = 0.8460 🏆 (ไม่เสียเปรียบคลิปที่มีครบ)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · ฝึกความอึดให้โมเดลด้วย Modality Dropout ระหว่างการเทรน',
        value: 'ระหว่างเทรน: สุ่มปิดสัญญาณบางสื่อทิ้งเป็นระยะ → บังคับให้โมเดลไม่พึ่งพาสื่อใดสื่อหนึ่งมากเกินไป!',
        detail: 'สำหรับโมเดล Deep Learning (Early/Intermediate Fusion) เราใช้เทคนิค Modality Dropout โดยแอบสุ่มปิดสื่อบางตัวระหว่างเทรน เพื่อให้โมเดลมีภูมิคุ้มกันเมื่อเจอข้อมูลแหว่งในโลกจริง',
        board: { type: 'v1-mm-missing', activeRow: 3 },
        ops: [
          { label: 'ปัญหาของโมเดลที่เทรนแต่ของครบ', value: 'มักยึดติดกับสื่อหลักตัวเดียว พอสื่อนั้นหายก็ทายผิดทันที', tone: 'skip' },
          { label: 'กลไก Modality Dropout', value: 'สุ่มปิดเวกเตอร์บางสื่อ (เช่น ปิด V หรือ I) ระหว่างเทรน', tone: 'plus' },
          { label: 'ผลลัพธ์ต่อโครงข่าย', value: 'เรียนรู้ที่จะใช้สื่อที่เหลือทดแทนกันได้อย่างยืดหยุ่น', tone: 'minus' },
          { label: 'เมื่อนำไปใช้งานจริง (Serving)', value: 'ทนทานต่อข้อมูลแหว่งโดยความแม่นยำไม่ร่วงกราวรูด 🛡️', tone: 'result' }
        ]
      }
    ],
    'mm-ablation': [
      {
        title: 'ขั้นที่ 1 · ตั้งโมเดลเต็มรูปแบบเป็นจุดอ้างอิง (Full Model Baseline)',
        value: 'Full Model (T + I + A + V) ได้คะแนน nDCG@3 = 0.8125 บนชุดทดสอบมาตรฐาน',
        detail: 'เริ่มต้นด้วยการวัดประสิทธิภาพของโมเดลที่ใช้ครบทั้ง 4 สื่อ (ได้ nDCG@3 = 0.8125) เพื่อใช้เป็นบรรทัดฐานในการเปรียบเทียบเมื่อเราทดลองถอดสื่อออกทีละชิ้น',
        board: { type: 'v4-mm-ablation', activeRow: 0 },
        ops: [
          { label: 'โมเดลอ้างอิง (Full Model)', value: 'ใช้ครบทั้ง 4 สื่อ: T + I + A + V', tone: 'plus' },
          { label: 'คะแนนมาตรฐาน (nDCG@3)', value: '0.8125 (จุดเปรียบเทียบตั้งต้น)', tone: 'result' },
          { label: 'คำถามทางวิทยาศาสตร์', value: 'สื่อทั้ง 4 ตัวช่วยเพิ่มคะแนนจริงทุกตัวหรือไม่?', tone: 'minus' },
          { label: 'วิธีพิสูจน์ (Ablation Study)', value: 'ทดลองถอดออกทีละ 1 สื่อแล้ววัดผลซ้ำบนข้อสอบเดิม', tone: 'skip' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · ทดลองตัดสื่อเสียงออก (−Audio): พิสูจน์คุณค่าส่วนเพิ่มที่แท้จริง!',
        value: 'เมื่อตัดเสียงออก (เหลือ T + I + V) → nDCG@3 ร่วงฮวบเป็น 0.6540 (Δ = −0.1585 💥)',
        detail: 'เมื่อถอดสื่อเสียงออกเพียงตัวเดียว คะแนน nDCG@3 ตกลงอย่างรุนแรงถึง −0.1585 พิสูจน์อย่างชัดเจนว่าสื่อเสียงให้ข้อมูลสำคัญที่สื่ออื่นทดแทนไม่ได้ (High Marginal Contribution)',
        board: { type: 'v4-mm-ablation', activeRow: 1 },
        ops: [
          { label: 'การทดลองที่ 1 (−Audio)', value: 'ใช้เฉพาะ T + I + V (ตัดเสียงออก)', tone: 'minus' },
          { label: 'คะแนนที่ได้ (nDCG@3)', value: '0.6540 (ลดลงจาก 0.8125 อย่างหนัก! 💥)', tone: 'skip' },
          { label: 'คุณค่าส่วนเพิ่มของเสียง', value: 'Marginal Gain = +0.1585 (สำคัญมาก)', tone: 'plus' },
          { label: 'ข้อสรุปทางวิศวกรรม', value: 'ห้ามตัดสื่อเสียงออกเด็ดขาด เพราะเป็นหัวใจของความแม่นยำ', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · ทดลองตัดสื่อภาพออก (−Image): จับไต๋สื่อที่ซ้ำซ้อน (Redundant Modality)',
        value: 'เมื่อตัดภาพออก (เหลือ T + A + V) → nDCG@3 = 0.8120 (แทบไม่เปลี่ยนเลย Δ = −0.0005)',
        detail: 'เมื่อถอดสื่อภาพออก คะแนนแทบไม่ลดลงเลย (0.8120 vs 0.8125) แสดงว่าข้อมูลในภาพปกซ้ำซ้อนกับสิ่งที่อยู่ในวิดีโอและข้อความอยู่แล้ว (Redundant)',
        board: { type: 'v4-mm-ablation', activeRow: 2 },
        ops: [
          { label: 'การทดลองที่ 2 (−Image)', value: 'ใช้เฉพาะ T + A + V (ตัดภาพปกออก)', tone: 'minus' },
          { label: 'คะแนนที่ได้ (nDCG@3)', value: '0.8120 (ต่างจากโมเดลเต็มแค่ 0.0005!)', tone: 'plus' },
          { label: 'การตีความผลการทดลอง', value: 'สื่อภาพเป็นข้อมูลซ้ำซ้อน (Redundant Modality)', tone: 'skip' },
          { label: 'กฎเหล็กการเปรียบเทียบ', value: 'ทุกการทดลองต้องวัดบน Test Set และกติกาเดียวกันเป๊ะ', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · การตัดสินใจเชิงต้นทุนและเวลาตอบสนอง (Cost & Latency Trade-off)',
        value: 'ถ้าสื่อเพิ่มความแม่นยำแค่ 0.0005 แต่กิน GPU 3 เท่าและช้าลง 5 เท่า → ควรตัดออกทันที!',
        detail: 'วิศวกรที่ดีไม่ดูแค่ทศนิยมตำแหน่งที่ 4 แต่ต้องชั่งน้ำหนักกับค่าเช่า GPU และความหน่วง (Latency) หากสื่อใดไม่คุ้มทุน ให้ตัดออกเพื่อได้ระบบที่เร็วและประหยัดกว่า',
        board: { type: 'v4-mm-ablation', activeRow: 3 },
        ops: [
          { label: 'ความแม่นยำที่เสียไปเมื่อตัดภาพ', value: 'เสีย nDCG@3 เพียง 0.0005 (ผู้ใช้แยกไม่ออก)', tone: 'plus' },
          { label: 'ทรัพยากรที่ประหยัดได้', value: 'ลดค่า GPU สกัดภาพ + ลดขนาด RAM ใน Vector DB', tone: 'minus' },
          { label: 'ถ้าสื่อเพิ่มแต้ม 0.001% แต่ช้าลง 5×', value: 'ไม่คุ้มทุน! ควรตัดออกจากการใช้งานจริง (Production)', tone: 'skip' },
          { label: 'โมเดลที่เลือกใช้จริง', value: 'เลือกชุดสื่อที่คุ้มค่าที่สุด (Optimal Cost–Benefit) 🏆', tone: 'result' }
        ]
      }
    ],
    'mm-system': [
      {
        title: 'ขั้นที่ 1 · สกัดเวกเตอร์ล่วงหน้าแบบออฟไลน์ (Offline Pre-computation & Caching)',
        value: 'รันโมเดลหนัก (ViT / 3D-CNN / AST) ล่วงหน้าครั้งเดียวตอนอัปโหลด → เก็บลง Vector DB!',
        detail: 'การรัน Deep Learning บนภาพและวิดีโอสดๆ ตอนผู้ใช้เปิดแอปจะช้าเป็นวินาทีจนระบบล่ม! จึงต้องสกัดเวกเตอร์ล่วงหน้าแบบ Offline แล้วแคชไว้ใน Vector Database เสมอ',
        board: { type: 'v6-mm-system', activeRow: 0 },
        ops: [
          { label: 'ทำไมห้ามรัน ViT/3D-CNN สดๆ?', value: 'โมเดลมีขนาดใหญ่ · ใช้เวลาหลายร้อย ms ต่อชิ้น 💥', tone: 'skip' },
          { label: 'ทางออก: Offline Pipeline', value: 'สกัดเวกเตอร์ทันทีที่อัปโหลดสินค้าใหม่ (ทำครั้งเดียว)', tone: 'plus' },
          { label: 'ที่จัดเก็บเวกเตอร์', value: 'บันทึกใน Vector Database / Feature Store', tone: 'minus' },
          { label: 'ผลต่อระบบออนไลน์', value: 'ตอนผู้ใช้เปิดแอป ไม่ต้องรัน CNN/ViT ซ้ำอีกเลย ⚡', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · ล็อกรุ่นโมเดลให้ตรงกันเสมอ (Encoder Version Locking)',
        value: 'ห้ามใช้ ResNet v1 ตอน Train แต่เผลอใช้ ResNet v2 ตอน Serve → เวกเตอร์จะเพี้ยนเงียบทั้งระบบ!',
        detail: 'ความเสี่ยงที่อันตรายที่สุดในระบบจริงคือ Silent Failure: หากเปลี่ยนรุ่น Encoder โดยไม่คำนวณเวกเตอร์เก่าใหม่ทั้งหมด พิกัดจะไม่ตรงกันโดยที่ระบบไม่แจ้ง Error',
        board: { type: 'v6-mm-system', activeRow: 1 },
        ops: [
          { label: 'ความเสี่ยง Version Mismatch', value: 'Train ด้วย v1 แต่ Serve ด้วย v2 → พิกัดคนละเรื่อง 💥', tone: 'skip' },
          { label: 'ทำไมถึงอันตรายมาก?', value: 'มิติเท่าเดิมโค้ดจึงไม่แครช แต่แนะนำมั่วเงียบๆ (Silent Bug)', tone: 'minus' },
          { label: 'วิธีป้องกัน (Version Locking)', value: 'ผูกป้ายกำกับรุ่น เช่น img_enc_v1.2 คู่ทุกเวกเตอร์', tone: 'plus' },
          { label: 'เมื่อต้องอัปเกรดเป็น v2', value: 'ต้อง Backfill คำนวณเวกเตอร์สินค้าทั้งหมดใหม่พร้อมกัน', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · ค้นหาและรวมคะแนนออนไลน์ภายในงบเวลา (50ms Latency Budget)',
        value: 'ดึงโปรไฟล์ 👩 ฟ้า → ค้น ANN (2 ms) → รวมคะแนน Fusion + กรองของซ้ำ → ส่งขึ้นจอใน < 50 ms!',
        detail: 'เมื่อผู้ใช้เปิดแอป ระบบมีเวลาทั้งหมดไม่เกิน 50–100 มิลลิวินาที จึงใช้ดัชนี ANN ดึงผู้สมัครอย่างรวดเร็ว แล้วทำ Late/Gated Fusion และจัดอันดับ Top-K ทันที',
        board: { type: 'v6-mm-system', activeRow: 2 },
        ops: [
          { label: '1. ANN Candidate Retrieval', value: 'ค้นหาผู้สมัครจากเวกเตอร์ที่แคชไว้ใน ~2–5 ms', tone: 'plus' },
          { label: '2. Multimodal Score Fusion', value: 'รวมคะแนนด้วย Late/Gated Fusion + Re-normalize', tone: 'minus' },
          { label: '3. Business Rules & Diversity', value: 'ตัดของที่เคยดูแล้ว + เกลี่ยความหลากหลาย (MMR)', tone: 'skip' },
          { label: 'งบประมาณเวลารวม (SLA)', value: 'เสร็จสมบูรณ์ภายใน < 50 มิลลิวินาที 🏆', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · กฎทองวิศวกรรมระบบหลายสื่อ (Start Simple, Scale with Evidence)',
        value: 'เริ่มจาก Text Baseline ที่เรียบง่าย → ค่อยเพิ่ม Image / Audio / Video เมื่อผล Ablation พิสูจน์ว่าคุ้มค่า!',
        detail: 'อย่าเริ่มสร้างระบบด้วยสถาปัตยกรรมที่ซับซ้อนที่สุดตั้งแต่วันแรก ให้เริ่มจากสื่อที่ถูกและเสถียรที่สุด (Text + Late Fusion) แล้วค่อยเพิ่มสื่ออื่นตามหลักฐานการทดลอง',
        board: { type: 'v6-mm-system', activeRow: 3 },
        ops: [
          { label: 'ก้าวที่ 1 (Day 1 Baseline)', value: 'เริ่มจาก Text + Late Fusion ที่เสถียรและดูแลง่าย', tone: 'plus' },
          { label: 'ก้าวที่ 2 (Add Modalities)', value: 'เพิ่ม Image / Audio เฉพาะตัวที่ผ่าน Ablation Study', tone: 'minus' },
          { label: 'ก้าวที่ 3 (Safety Guardrails)', value: 'มี Availability Mask + Weight Re-normalization เสมอ', tone: 'skip' },
          { label: 'หัวใจความสำเร็จ', value: 'สมดุลระหว่างความแม่นยำ ความเร็ว และต้นทุนจริง 🎓', tone: 'result' }
        ]
      }
    ],
    'cf-matrix': [
      {
        title: 'ขั้นที่ 1 · ตรวจสอบช่องเป้าหมาย (The Prediction Target)',
        value: 'แถว u₁ (👩 ฟ้า) × คอลัมน์ E (Data Story) → ? (ยังไม่รู้ค่า)',
        detail: 'ตารางขนาด 5 ผู้ใช้ × 6 คอร์ส: ตัวเลข 1–5★ คือข้อมูลที่สังเกตได้จริงในชุดฝึก (Observed Ratings) ส่วนช่องสีเหลือง (u₁, E) คือจุดเป้าหมายที่เราต้องทำนาย',
        board: { type: 'v1-cf-matrix', mode: 'target', activeRow: 0, activeCol: 4 },
        ops: [
          { label: 'ผู้ใช้เป้าหมาย', value: 'u₁ · 👩 ฟ้า (r̄ = 3.0★)', tone: 'minus' },
          { label: 'คอร์สเป้าหมาย', value: 'E · 📈 Data Story (?)', tone: 'skip' },
          { label: 'ข้อมูลประวัติฟ้า', value: 'A: 5★, B: 4★, C: 1★, D: 2★', tone: 'plus' },
          { label: 'สถิติตารางรวม', value: 'สังเกตได้ 20 ช่อง · ว่าง 10 ช่อง (Sparsity 33%)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · มองตามแนวนอน: รอยเท้ารสนิยมผู้ใช้ (User-based View)',
        value: 'เทียบแถว u₁ (ฟ้า) กับเพื่อนร่วมตาราง u₂, u₃, u₄, u₅ บน 4 คอร์สแรก {A, B, C, D}',
        detail: 'อ่านแนวนอนทีละแถวเพื่อมองหารูปแบบว่าเพื่อนคนใดในตารางมีรสนิยมการให้ดาวสอดคล้องกับ 👩 ฟ้า มากที่สุด (User Neighborhood)',
        board: { type: 'v1-cf-matrix', mode: 'user-view', activeRow: 0, focusRows: [1, 2, 3, 4] },
        ops: [
          { label: 'เพื่อน u₂ (พลอย)', value: 'ให้ A:5, B:4, C:1, D:4 (คล้ายฟ้ามาก!)', tone: 'plus' },
          { label: 'เพื่อน u₃ (นนท์)', value: 'ให้ A:1, B:2, C:5, D:4 (รสนิยมตรงข้าม)', tone: 'minus' },
          { label: 'เพื่อน u₄ (กานต์)', value: 'ให้ A:5, C:2, D:1 (ชอบคล้ายฟ้า)', tone: 'skip' },
          { label: 'เพื่อน u₅ (เมย์)', value: 'ให้แค่ B:5 (ข้อมูลทับซ้อนน้อยมาก)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · มองตามแนวตั้ง: ความสัมพันธ์ระหว่างสินค้า (Item-based View)',
        value: 'เทียบคอลัมน์เป้าหมาย E กับคอลัมน์ A, B, C, D ดูว่าคอร์สไหนมีคะแนนไปในทิศทางเดียวกัน',
        detail: 'อ่านแนวตั้งทีละคอลัมน์ เพื่อค้นหาว่าคนที่เคยเรียนคอร์ส E มักจะให้คะแนนคอร์สใดในอดีตสูงหรือต่ำคล้ายๆ กัน (Item-to-Item Similarity)',
        board: { type: 'v1-cf-matrix', mode: 'item-view', activeCol: 4, focusCols: [0, 1, 2, 3] },
        ops: [
          { label: 'คอลัมน์ E (Data Story)', value: 'u₂: 5★, u₃: 1★, u₄: 4★, u₅: 5★', tone: 'minus' },
          { label: 'เทียบกับ A (Python)', value: 'คนชอบ E มักชอบ A เช่นกัน (u₂, u₄ ให้สูง)', tone: 'plus' },
          { label: 'เทียบกับ C (Art)', value: 'คนชอบ E ไม่ชอบ C (u₂:1, u₃:5, u₄:2)', tone: 'skip' },
          { label: 'คอร์สใหม่ F (New)', value: 'ว่างเปล่าทั้งคอลัมน์ (Item Cold-Start)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · สรุปกฎพื้นฐานของ Collaborative Filtering',
        value: 'ไม่พึ่งพาข้อความบรรยายสินค้า · พึ่งพาเฉพาะ "ภูมิปัญญาฝูงชน (Wisdom of the Crowd)"',
        detail: 'CF แนะนำได้โดยไม่ต้องรู้เนื้อหาในคลิปเลย แต่อาศัยรอยเท้าพฤติกรรมของมนุษย์ร่วมกัน เป็นเสาหลักที่แม่นยำและค้นพบความชอบข้ามสาย (Serendipity) ได้ดีเยี่ยม',
        board: { type: 'v1-cf-matrix', mode: 'summary' },
        ops: [
          { label: 'ปรัชญาของ CF', value: 'อ่านรอยเท้าฝูงชน (Wisdom of Crowd)', tone: 'plus' },
          { label: 'ข้อได้เปรียบเหนือ Content', value: 'แนะนำของดีข้ามหมวดที่แท็กบอกไม่ได้', tone: 'minus' },
          { label: 'ข้อจำกัดสำคัญ', value: 'พึ่งพาข้อมูลดาวเดิม (Cold-Start พังง่าย)', tone: 'skip' },
          { label: 'ก้าวต่อไปในบทนี้', value: 'วัดความคล้าย → kNN → Matrix Factorization', tone: 'result' }
        ]
      }
    ],
    'cf-popularity': [
      {
        title: 'ขั้นที่ 1 · นิยามความนิยม: นับเฉพาะคนที่ประเมินว่าชอบ (ดาว ≥ 4★)',
        value: 'เกณฑ์ความชอบ: นับเฉพาะช่องที่มีเรตติ้ง r_ui ≥ 4★ บนชุดข้อมูลฝึก (Train)',
        detail: 'ทำไมไม่ใช้แค่ค่าเฉลี่ยดาวตรงๆ? เพราะสินค้าที่มีคนรีวิวคนเดียว 5 ดาวจะหลอกให้ระบบเข้าใจผิดว่าดีกว่าสินค้าที่มีคนรีวิว 1,000 คนเฉลี่ย 4.8 ดาว!',
        board: { type: 'v1-cf-popularity', activeCol: 0 },
        ops: [
          { label: 'เกณฑ์ชอบ (Hit)', value: 'คะแนนดาว r_ui ≥ 4★ (Implicit Threshold)', tone: 'plus' },
          { label: 'จุดอ่อนของ Mean ดิบ', value: '1 รีวิว 5★ หลอกว่าดีกว่า 1,000 รีวิว 4.8★', tone: 'skip' },
          { label: 'เป้าหมายความนิยม', value: 'วัดจำนวนฐานเสียงสนับสนุนที่แท้จริง', tone: 'minus' },
          { label: 'การนำไปใช้งาน', value: 'ทำหน้าที่เป็น Default Baseline ให้คนใหม่', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · นับความถี่ดาว ≥ 4★ ของแต่ละคอร์สในตาราง',
        value: '🐍 A: 3 คน · 📊 B: 3 คน · 🎨 C: 1 คน · 📐 D: 2 คน · 📈 E: 3 คน · 🆕 F: 0 คน',
        detail: 'นับจำนวนคนให้ดาว ≥ 4★: คอร์ส A (u₁, u₂, u₄ = 3 คน), B (u₁, u₂, u₅ = 3 คน), E (u₂, u₄, u₅ = 3 คน) ครองแชมป์ยอดนิยมร่วมกัน',
        board: { type: 'v1-cf-popularity', activeCol: 1 },
        ops: [
          { label: 'คอร์สแชมป์ (3 คนชอบ)', value: '🐍 A (Python), 📊 B (SQL), 📈 E (DataStory)', tone: 'plus' },
          { label: 'คอร์สปานกลาง (2 คน)', value: '📐 D · UX (u₂, u₃ ชอบ)', tone: 'minus' },
          { label: 'คอร์สเฉพาะกลุ่ม (1 คน)', value: '🎨 C · Art (u₃ คนเดียวชอบ 5★)', tone: 'skip' },
          { label: 'คอร์สใหม่แกะกล่อง F', value: '0 คนชอบ (ไม่มีใครเคยเรียน)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · จัดอันดับ Popularity Baseline สำหรับผู้ใช้ใหม่',
        value: 'อันดับความนิยมรวม: {A, B, E} (3 คน) → D (2 คน) → C (1 คน) → F (0 คน)',
        detail: 'นี่คือลิสต์แนะนำมาตรฐาน (Non-personalized Fallback) ที่ระบบจะเสิร์ฟให้ผู้ใช้ใหม่ที่ยังไม่มีประวัติคลิกเลย เพื่อแก้ปัญหา User Cold-Start วันแรก',
        board: { type: 'v1-cf-popularity', activeCol: 2 },
        ops: [
          { label: 'อันดับ #1–#3 ร่วม', value: '🐍 A, 📊 B, 📈 E (ฐานแฟนแน่น 3 คน)', tone: 'plus' },
          { label: 'อันดับ #4', value: '📐 D · UX (ได้ 2 คน)', tone: 'minus' },
          { label: 'อันดับ #5', value: '🎨 C · Art (ได้ 1 คน)', tone: 'skip' },
          { label: 'บทบาทในระบบ', value: 'Fallback เมื่อไร้ประวัติส่วนบุคคล 🏆', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · ปัญหา Item Cold-Start ของคอร์สใหม่ (🆕 F = 0 คน)',
        value: 'คอร์ส F เพิ่งเปิดตัว ไม่มีใครเคยเรียน → ติดศูนย์ตลอดกาล ถ้าพึ่งพาแต่ Popularity!',
        detail: 'ข้อจำกัดร้ายแรงของ Popularity Baseline คือสินค้าใหม่จะไม่มีวันได้แจ้งเกิด (Cold-Start Trap) เพราะไม่มีประวัติดาวมาก่อน ต้องใช้ Content-based หรือสำรวจ (Exploration) ช่วยเสริม',
        board: { type: 'v1-cf-popularity', activeCol: 5 },
        ops: [
          { label: 'สถานะของคอร์ส F', value: 'เพิ่งลงคลังใหม่ 0 รีวิว (Item Cold-Start)', tone: 'skip' },
          { label: 'วงจรอุบาทว์ Popularity', value: 'ไม่มีคนเรียน → ไม่ติดชาร์ต → ไม่มีคนเห็น 💥', tone: 'minus' },
          { label: 'วิธีแก้ทางวิศวกรรม', value: 'สลับไปใช้ Content-based หรือแท็บสินค้าใหม่', tone: 'plus' },
          { label: 'สรุปบทเรียน', value: 'Popularity ดีกับคนใหม่ แต่ทำลายของใหม่', tone: 'result' }
        ]
      }
    ],
    'cf-similarity': [
      {
        title: 'ขั้นที่ 1 · ค้นหาคอร์สที่ประเมินร่วมกัน (Co-rated Items: I_uv)',
        value: 'u₁ (👩 ฟ้า) รีวิว {A, B, C, D} · u₂ (🧑 พลอย) รีวิว {A, B, C, D, E} → ทับซ้อน 4 คอร์ส!',
        detail: 'การคำนวณความคล้ายระหว่างผู้ใช้ต้องทำบนเซตสินค้าที่ทั้งสองคนเคยให้คะแนนร่วมกัน (Intersection: I_uv) คือ {A, B, C, D} รวม 4 วิชา ส่วนคอร์ส E มีแค่พลอยคนเดียว',
        board: { type: 'v1-cf-similarity', mode: 'co-rated', activeCol: 0 },
        ops: [
          { label: 'คอร์สที่ฟ้าให้ดาว', value: '{A, B, C, D} (4 วิชา)', tone: 'minus' },
          { label: 'คอร์สที่พลอยให้ดาว', value: '{A, B, C, D, E} (5 วิชา)', tone: 'skip' },
          { label: 'เซตร่วม (Intersection: ∩)', value: 'I_{12} = {A, B, C, D} (|co| = 4 ชิ้น)', tone: 'plus' },
          { label: 'เซตรวม (Union: ∪)', value: 'U_{12} = {A, B, C, D, E} (|union| = 5 ชิ้น)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · คำนวณความคล้ายด้วยเซต: Jaccard Similarity',
        value: 'Jaccard(u₁, u₂) = |I_uv| / |U_uv| = 4 / 5 = 0.8000 (80%)',
        detail: 'Jaccard วัดเฉพาะรอยเท้าว่า "เคยเรียนของเหมือนกันกี่ชิ้น" โดยไม่สนใจคะแนนดาว เหมาะอย่างยิ่งกับข้อมูล Implicit Feedback (คลิก/ดู/ซื้อ)',
        board: { type: 'v1-cf-similarity', mode: 'jaccard', activeCol: 1 },
        ops: [
          { label: 'สูตร Jaccard Similarity', value: '|I_u ∩ I_v| / |I_u ∪ I_v|', tone: 'minus' },
          { label: 'ตัวตั้ง (ของที่ทับซ้อน)', value: '4 คอร์ส {A, B, C, D}', tone: 'plus' },
          { label: 'ตัวหาร (ของที่แตะต้องรวม)', value: '5 คอร์ส {A, B, C, D, E}', tone: 'skip' },
          { label: 'ผลลัพธ์ Jaccard', value: '4 / 5 = 0.8000 🎯', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · คำนวณความคล้ายด้วยมุม: Raw Cosine Similarity บนดาวดิบ',
        value: 'u₁=(5, 4, 1, 2) · u₂=(5, 4, 1, 4) → Cosine = 50 / (√46 × √58) = 0.9680',
        detail: 'นำคะแนนดาวดิบใน 4 คอร์สร่วมมาทำ Dot Product: (5×5)+(4×4)+(1×1)+(2×4) = 25+16+1+8 = 50 แล้วหารด้วยความยาวเวกเตอร์ √46 × √58 ≈ 51.65 ได้ Cosine สูงถึง 0.9680',
        board: { type: 'v1-cf-similarity', mode: 'cosine', activeCol: 2 },
        ops: [
          { label: 'ผลคูณจุด (Dot Product)', value: '25 + 16 + 1 + 8 = 50', tone: 'plus' },
          { label: 'ความยาวเวกเตอร์ฟ้า ‖u₁‖', value: '√(25 + 16 + 1 + 4) = √46 ≈ 6.782', tone: 'minus' },
          { label: 'ความยาวเวกเตอร์พลอย ‖u₂‖', value: '√(25 + 16 + 1 + 16) = √58 ≈ 7.616', tone: 'skip' },
          { label: 'Raw Cosine Similarity', value: '50 / (6.782 × 7.616) = 0.9680 🏆', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · จุดบอดของ Raw Cosine: ไม่รู้ว่าใครใจดีหรือเคี่ยว!',
        value: 'คะแนนบวกเสมอ (1–5★) ทำให้เวกเตอร์เบียดตัวในมุมแคบ → ต้องแก้ด้วย Pearson!',
        detail: 'เนื่องจากคะแนนดาวเป็นบวกทั้งหมด เวกเตอร์ทุกคนจึงชี้ไปในจตุภาคแรกเสมอ ทำให้ Cosine ดิบมีค่าสูงเกินจริงและแยกคนใจดีออกจากคนเคี่ยวไม่ได้ ต้องแก้ด้วย Mean-Centering',
        board: { type: 'v1-cf-similarity', mode: 'summary' },
        ops: [
          { label: 'จุดอ่อน Raw Cosine', value: 'คะแนนบวกล้วน → เวกเตอร์มุมแคบเสมอ', tone: 'skip' },
          { label: 'ปัญหาคนใจดี vs คนเคี่ยว', value: 'คนใจดีให้ 4★ (คือเฉยๆ) vs คนเคี่ยวให้ 4★ (คือดีเลิศ)', tone: 'minus' },
          { label: 'ทางออกในบทถัดไป', value: 'ลบค่าเฉลี่ยส่วนบุคคล (Mean-Centering)', tone: 'plus' },
          { label: 'พัฒนาสู่ Pearson Correlation', value: 'สะท้อนรสนิยมแท้จริงอย่างแม่นยำ 🎓', tone: 'result' }
        ]
      }
    ],
    'cf-centering': [
      {
        title: 'ขั้นที่ 1 · หาค่าเฉลี่ยส่วนตัวของแต่ละคน (User Mean: r̄ᵤ)',
        value: 'ฟ้า r̄₁=3.0★ · พลอย r̄₂=3.8★ · นนท์ r̄₃=2.6★ · กานต์ r̄₄=3.0★ · เมย์ r̄₅=5.0★',
        detail: 'ค่าเฉลี่ยส่วนตัวสะท้อน "ไม้บรรทัดประจำตัว": u₅ (เมย์) ใจดีแจกแต่ 5 ดาวเต็ม ขณะที่ u₃ (นนท์) เคี่ยวมากเฉลี่ยแค่ 2.6 ดาว การเทียบดาวดิบตรงๆ จึงไม่ยุติธรรม',
        board: { type: 'v1-cf-centering', mode: 'mean', activeCol: 0 },
        ops: [
          { label: '👩 ฟ้า (u₁)', value: '(5+4+1+2)/4 = 3.0★ (มาตรฐาน)', tone: 'minus' },
          { label: '🧑 พลอย (u₂)', value: '(5+4+1+4+5)/5 = 3.8★ (ค่อนข้างใจดี)', tone: 'plus' },
          { label: '👨 นนท์ (u₃)', value: '(1+2+5+4+1)/5 = 2.6★ (เคี่ยวมาก)', tone: 'skip' },
          { label: '👩 เมย์ (u₅)', value: '(5+5)/2 = 5.0★ (ใจดีสุดโต่ง)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · แปลงดาวเป็นส่วนเบี่ยงเบน (Mean-Centering: r_ui − r̄ᵤ)',
        value: 'ฟ้า u₁: ให้ A, B, C, D ลบ 3.0 ได้ (+2, +1, −2, −1) · ค่าบวก=ชอบกว่าปกติ, ค่าลบ=ไม่ชอบ',
        detail: 'เมื่อหักลบค่าเฉลี่ยของตัวเองออก ค่าตัวเลขจะเปลี่ยนเป็นบวกและลบรอบจุดศูนย์: +2 หมายถึงชอบมากเป็นพิเศษ ส่วน −2 หมายถึงผิดหวังกว่าปกติของตนเอง',
        board: { type: 'v1-cf-centering', mode: 'centered', activeCol: 1 },
        ops: [
          { label: 'คอร์ส A (Python): 5★', value: '5 − 3.0 = +2.0 (ฟ้าชอบมาก)', tone: 'plus' },
          { label: 'คอร์ส B (SQL): 4★', value: '4 − 3.0 = +1.0 (ฟ้าชอบกว่าปกติ)', tone: 'minus' },
          { label: 'คอร์ส C (Art): 1★', value: '1 − 3.0 = −2.0 (ฟ้าไม่ชอบ)', tone: 'skip' },
          { label: 'คอร์ส D (UX): 2★', value: '2 − 3.0 = −1.0 (ฟ้าชอบน้อยกว่าปกติ)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · คำนวณ Pearson Correlation ระหว่าง 👩 ฟ้า กับ 🧑 พลอย',
        value: 'เวกเตอร์ฟ้า (+2, +1, −2, −1) เทียบ พลอย (+1.2, +0.2, −2.8, +0.2) → Pearson = 0.8269',
        detail: 'พลอย (เฉลี่ย 3.8) ให้ดาว (+1.2, +0.2, −2.8, +0.2) เมื่อทำ Cosine บนเวกเตอร์ที่ลบเฉลี่ยแล้ว จะได้ Pearson Correlation = 0.8269 ชี้ว่าชอบสายเดียวกันจริง',
        board: { type: 'v1-cf-centering', mode: 'pearson', activeCol: 2 },
        ops: [
          { label: 'เวกเตอร์ปรับศูนย์ของฟ้า', value: '(+2.0, +1.0, −2.0, −1.0)', tone: 'plus' },
          { label: 'เวกเตอร์ปรับศูนย์ของพลอย', value: '(+1.2, +0.2, −2.8, +0.2)', tone: 'minus' },
          { label: 'ผลคูณจุดร่วมกัน', value: '2.4 + 0.2 + 5.6 − 0.2 = 8.0', tone: 'skip' },
          { label: 'Pearson Correlation', value: '8.0 / (3.162 × 3.066) = 0.8269 🏆', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · ประโยชน์ทางวิศวกรรมของ Pearson Correlation',
        value: 'ตัดอคติสเกลคะแนนของแต่ละคนออกหมดจด · สามารถติดลบได้ถึง −1.00 (รสนิยมตรงข้าม)',
        detail: 'Pearson แก้จุดอ่อนของ Cosine ดิบอย่างสมบูรณ์ ทำให้ค่าความคล้ายวิ่งระหว่าง −1 (ชอบตรงข้ามกันเป๊ะ) ถึง +1 (ใจตรงกันเป๊ะ) โดย 0 คือไม่มีความสัมพันธ์กัน',
        board: { type: 'v1-cf-centering', mode: 'summary' },
        ops: [
          { label: 'ช่วงคะแนน Pearson', value: '[-1.0, +1.0] (มีค่าติดลบได้จริง)', tone: 'plus' },
          { label: 'Pearson > 0', value: 'รสนิยมไปในทิศทางเดียวกัน (เพื่อนบ้าน)', tone: 'minus' },
          { label: 'Pearson < 0', value: 'รสนิยมตรงข้าม (เช่น u₃ นนท์ Pearson = −0.89)', tone: 'skip' },
          { label: 'มาตรฐานของ User-kNN', value: 'ใช้ Pearson เป็นแกนหลักในการหาเพื่อน 🎯', tone: 'result' }
        ]
      }
    ],
    'cf-support': [
      {
        title: 'ขั้นที่ 1 · หลุมพรางความคล้ายสูงแต่หลักฐานน้อย (The Small Support Trap)',
        value: 'u₄ คล้ายฟ้า 0.8889 (แต่ร่วมแค่ 3 คอร์ส) vs u₂ คล้าย 0.8269 (แต่ร่วมถึง 4 คอร์ส)',
        detail: 'ถ้าดูแค่ตัวเลขความคล้าย u₄ (กานต์) จะชนะ u₂ (พลอย) ทั้งที่ u₄ มีข้อมูลคอร์สตรงกับฟ้าเพียง 3 วิชา ขณะที่ u₂ มีหลักฐานความชอบตรงกันแน่นหนากว่าถึง 4 วิชา',
        board: { type: 'v1-cf-support', mode: 'trap', activeCol: 0 },
        ops: [
          { label: 'u₂ · 🧑 พลอย', value: 'Pearson = 0.8269 · ร่วมกัน 4 คอร์ส (แน่นหนา)', tone: 'plus' },
          { label: 'u₄ · 🧔 กานต์', value: 'Pearson = 0.8889 · ร่วมกันแค่ 3 คอร์ส', tone: 'minus' },
          { label: 'ถ้าไม่ถ่วงน้ำหนักหลักฐาน?', value: 'u₄ จะถูกเลือกเป็นอันดับ 1 (เสี่ยงฟลุก!) ⚠️', tone: 'skip' },
          { label: 'เป้าหมายทางวิศวกรรม', value: 'ให้รางวัลคนที่ร่วมเยอะ ลดทอนคนที่ร่วมน้อย', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · กำหนดเกณฑ์ขีดจำกัดหลักฐาน (Significance Threshold β = 4)',
        value: 'ตัวคูณลดทอน: factor = min(|I_uv|, β) / β เมื่อตั้งค่าขีดจำกัด β = 4 ชิ้น',
        detail: 'คู่ใดที่มีสินค้าประเมินร่วมกันตั้งแต่ 4 ชิ้นขึ้นไปจะได้ตัวคูณเต็ม 1.0 (ไม่ถูกลดทอน) ส่วนคู่ที่มีสินค้าร่วมกันน้อยกว่า 4 ชิ้นจะถูกปรับลดคะแนนลงตามสัดส่วน',
        board: { type: 'v1-cf-support', mode: 'threshold', activeCol: 1 },
        ops: [
          { label: 'ขีดจำกัดความน่าเชื่อถือ (β)', value: 'β = 4 คอร์ส (พารามิเตอร์ระบบ)', tone: 'minus' },
          { label: 'ร่วม 4 คอร์ส (|I| ≥ 4)', value: 'min(4, 4) / 4 = 1.00 (ได้น้ำหนักเต็มร้อย)', tone: 'plus' },
          { label: 'ร่วม 3 คอร์ส (|I| = 3)', value: 'min(3, 4) / 4 = 0.75 (ลดทอนเหลือ 75%)', tone: 'skip' },
          { label: 'ร่วม 1 คอร์ส (|I| = 1)', value: 'min(1, 4) / 4 = 0.25 (ลดทอนเหลือ 25%)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · คำนวณน้ำหนักหลังปรับลดทอน (Significance Weighting)',
        value: 'u₂: 0.8269 × 1.00 = 0.8269 🏆 · u₄: 0.8889 × 0.75 = 0.6667 (หล่นไปอันดับ 2)',
        detail: 'เมื่อคูณด้วย factor ความน่าเชื่อถือ อันดับเพื่อนบ้านจะสลับกลับมาถูกต้องตามความจริง: u₂ ขึ้นนำเป็นอันดับ 1 เพราะหลักฐานแน่นหนากว่า u₄ อย่างเห็นได้ชัด',
        board: { type: 'v1-cf-support', mode: 'weighted', activeCol: 2 },
        ops: [
          { label: 'น้ำหนักถ่วงของ u₂ (พลอย)', value: '0.8269 × 1.00 = 0.8269 🏆 (อันดับ 1)', tone: 'plus' },
          { label: 'น้ำหนักถ่วงของ u₄ (กานต์)', value: '0.8889 × 0.75 = 0.6667 (อันดับ 2)', tone: 'minus' },
          { label: 'น้ำหนักถ่วงของ u₅ (เมย์)', value: 'ร่วมแค่ 1 คอร์ส → ถูกลดทอนเหลือ 0.25', tone: 'skip' },
          { label: 'ผลลัพธ์การคัดกรอง', value: 'ป้องกันความคล้ายหลอกตาจากข้อมูลบังเอิญ', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · สรุปบทบาทของ Significance Weighting ในระบบจริง',
        value: 'ตัดปัญหาเพื่อนบังเอิญใจตรงกัน 1 วิชา · เพิ่มความเสถียรให้คำทำนาย User-kNN อย่างมาก',
        detail: 'ในระบบที่มีผู้ใช้นับล้าน ผู้ใช้สองคนอาจบังเอิญให้ 5 ดาวหนังเรื่องเดียวกัน 1 เรื่องแล้วได้ Cosine=1.00 การใช้ Significance Weighting จะช่วยคัดกรองเพื่อนฟลุกทิ้งไปทันที',
        board: { type: 'v1-cf-support', mode: 'summary' },
        ops: [
          { label: 'ป้องกันปัญหา Coincidence', value: 'ไม่หลงเชื่อคนที่บังเอิญตรงกันแค่ 1 ข้อ', tone: 'plus' },
          { label: 'เกณฑ์ β ที่แนะนำ', value: 'มักตั้ง β = 25 ถึง 50 ในระบบภาพยนตร์จริง', tone: 'minus' },
          { label: 'ผลต่อโมเดล kNN', value: 'ลดทอนความแปรปรวน (Variance Reduction)', tone: 'skip' },
          { label: 'ผลลัพธ์สุดท้าย', value: 'ได้เพื่อนบ้าน Top-2 ที่ไว้ใจได้จริง {u₂, u₄} 🎓', tone: 'result' }
        ]
      }
    ],
    'cf-user': [
      {
        title: 'ขั้นที่ 1 · คัดกรองเพื่อนบ้านที่มีคะแนนในคอร์สเป้าหมาย E',
        value: 'คอร์ส E มีคะแนนจาก u₂ (5★), u₃ (1★), u₄ (4★), u₅ (5★) · ตัดคนที่ไม่เคยเรียนทิ้ง',
        detail: 'เพื่อนบ้านจะคล้ายแค่ไหน แต่ถ้าเขาไม่เคยเรียนคอร์ส E มาก่อน ย่อมไม่สามารถมาช่วยแนะนำคอร์ส E ได้ เราจึงกรองเฉพาะเพื่อนที่มีคะแนนในคอลัมน์ E',
        board: { type: 'v1-cf-user', mode: 'filter', activeRow: 0 },
        ops: [
          { label: 'เป้าหมายที่ต้องทาย', value: '(u₁ ฟ้า, E Data Story) = ?', tone: 'minus' },
          { label: 'เพื่อนที่เคยเรียน E', value: 'u₂: 5★, u₃: 1★, u₄: 4★, u₅: 5★', tone: 'plus' },
          { label: 'เพื่อนที่คล้ายฟ้า (Pearson > 0)', value: 'u₂ (0.8269), u₄ (0.6667)', tone: 'skip' },
          { label: 'ตัด u₃ ออกเพราะอะไร?', value: 'Pearson ติดลบ (−0.89) รสนิยมตรงข้าม', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · เลือกเพื่อนบ้าน Top-2 ที่ดีที่สุด (k = 2 Neighbors)',
        value: 'เลือก u₂ (น้ำหนัก w = 0.8269) และ u₄ (น้ำหนัก w = 0.6667) รวมน้ำหนักได้ 1.4936',
        detail: 'คัดเพื่อนบ้าน Top-2 ที่มีน้ำหนักความคล้ายเป็นบวกสูงสุด คือ u₂ (0.8269) และ u₄ (0.6667) ผลรวมน้ำหนักคือ 0.8269 + 0.6667 = 1.4936 ซึ่งใช้เป็นตัวหารเฉลี่ย',
        board: { type: 'v1-cf-user', mode: 'select-k', activeRow: 1 },
        ops: [
          { label: 'เพื่อนบ้าน #1 (u₂ พลอย)', value: 'น้ำหนัก w₁ = 0.8269', tone: 'plus' },
          { label: 'เพื่อนบ้าน #2 (u₄ กานต์)', value: 'น้ำหนัก w₂ = 0.6667', tone: 'minus' },
          { label: 'ตัวหารผลรวมน้ำหนัก', value: 'Σ |w| = 0.8269 + 0.6667 = 1.4936', tone: 'skip' },
          { label: 'ทำไมเลือกแค่ k = 2?', value: 'ตัดเพื่อนที่อยู่ไกลออกไปเพื่อลด Noise', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · คำนวณความชอบเหนือคาดของเพื่อน (Deviation: r_vE − r̄_v)',
        value: 'u₂ ให้ E=5 (เกินเฉลี่ย +1.2) · u₄ ให้ E=4 (เกินเฉลี่ย +1.0) → ถ่วงน้ำหนักได้ +1.1107★',
        detail: 'เราไม่ได้เอาดาวดิบ 5 กับ 4 มาเฉลี่ยตรงๆ แต่ดูว่าเพื่อนคิดว่าคอร์สนี้ "ดีกว่าปกติของเขา" เท่าไหร่: u₂ ให้ 5 − 3.8 = +1.2 และ u₄ ให้ 4 − 3.0 = +1.0 นำมาถ่วงน้ำหนักได้ +1.1107',
        board: { type: 'v1-cf-user', mode: 'deviation', activeRow: 2 },
        ops: [
          { label: 'ส่วนเบี่ยงเบน u₂ (พลอย)', value: '5 − 3.8 = +1.20 (เชียร์คอร์สนี้)', tone: 'plus' },
          { label: 'ส่วนเบี่ยงเบน u₄ (กานต์)', value: '4 − 3.0 = +1.00 (เชียร์คอร์สนี้)', tone: 'minus' },
          { label: 'ผลรวมถ่วงน้ำหนัก', value: '0.8269(1.2) + 0.6667(1.0) = 1.6590', tone: 'skip' },
          { label: 'ความเห็นเฉลี่ยของเพื่อน', value: '1.6590 / 1.4936 = +1.1107★ (แรงเชียร์สุทธิ)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · บวกแรงเชียร์เข้ากับฐานส่วนตัวของ 👩 ฟ้า สรุปคำทำนาย',
        value: 'r̂(u₁, E) = r̄(u₁) + แรงเชียร์เพื่อน = 3.0 + 1.1107 = 4.1107★ (ปัดเป็น 4.1★ 🏆)',
        detail: 'นำค่าเฉลี่ยปกติของ 👩 ฟ้า (r̄₁ = 3.0) บวกด้วยแรงเชียร์ถ่วงน้ำหนักของเพื่อนบ้าน (+1.1107) สรุปเป็นคะแนนทำนายสุดท้าย 4.1107 ดาว แนะนำให้ฟ้าเรียนได้ทันที!',
        board: { type: 'v1-cf-user', mode: 'predict', activeRow: 3 },
        ops: [
          { label: 'ฐานเดิมของฟ้า r̄(u₁)', value: '3.0000★ (ไม้บรรทัดประจำตัวฟ้า)', tone: 'minus' },
          { label: 'แรงเชียร์จากเพื่อน Top-2', value: '+1.1107★ (เพื่อนชอบวิชานี้มากกว่าปกติ)', tone: 'plus' },
          { label: 'คำทำนาย User-kNN', value: '3.0 + 1.1107 = 4.1107★ 🏆', tone: 'result' },
          { label: 'การตัดสินใจระบบ', value: 'คะแนนสูง (>4★) → ส่งเข้า Top-K หน้าจอ', tone: 'skip' }
        ]
      }
    ],
    'cf-item': [
      {
        title: 'ขั้นที่ 1 · พลิกมุมมองสู่ Item-to-Item (สลับจากมองคนเป็นมองของ)',
        value: 'คอร์สเป้าหมายคือ E (Data Story) → ค้นหาว่าคอร์สใดในอดีต {A, B, C, D} คล้ายกับ E ที่สุด',
        detail: 'Amazon พลิกวงการด้วยการเปลี่ยนมามองคอลัมน์สินค้าแทนแถวคน เพราะสินค้ามีจำนวนนิ่งกว่า รสนิยมความสัมพันธ์ระหว่างของไม่เปลี่ยนตามอารมณ์ และแคชตารางความคล้ายล่วงหน้าได้',
        board: { type: 'v1-cf-item', mode: 'target-item', activeCol: 4 },
        ops: [
          { label: 'คอร์สเป้าหมาย (Item i)', value: 'E · 📈 Data Story (กำลังหาเพื่อนคอร์ส)', tone: 'minus' },
          { label: 'คอร์สคู่แข่งในอดีต', value: 'A (Python), B (SQL), C (Art), D (UX)', tone: 'skip' },
          { label: 'ทำไม Amazon เลือก Item-kNN?', value: 'สินค้าอยู่นิ่งกว่าคน · แคชออฟไลน์ได้ 100%', tone: 'plus' },
          { label: 'ความเร็วตอนใช้งาน (Serving)', value: 'ดึงจากแคชใน < 10 ms (เสถียรกว่า User-kNN)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · คำนวณ Adjusted Cosine Similarity ระหว่างคอร์ส E กับ A',
        value: 'sim(E, A) บนคนร่วม {u₂, u₃, u₄}: หักลบค่าเฉลี่ยของคนในแถว (r_ui − r̄ᵤ) ก่อนคูณ!',
        detail: ' Adjusted Cosine มีเคล็ดลับสำคัญคือ: แม้จะเปรียบเทียบในแนวตั้งระหว่างคอลัมน์สินค้า แต่ต้องหักลบค่าเฉลี่ยในแนวนอนของแต่ละคน (r̄ᵤ) เพื่อตัดอคติคนใจดีและคนเคี่ยวออกไป',
        board: { type: 'v1-cf-item', mode: 'adjusted-a', activeCol: 0 },
        ops: [
          { label: 'คนที่เรียนทั้ง E และ A', value: 'u₂, u₃, u₄ (3 คนร่วมกัน)', tone: 'minus' },
          { label: 'หักลบเฉลี่ยแถวคน (r̄ᵤ)', value: 'u₂: lบ 3.8 · u₃: ลบ 2.6 · u₄: ลบ 3.0', tone: 'plus' },
          { label: 'เวกเตอร์หลังหักลบ', value: 'E: (+1.2, −1.6, +1.0) · A: (+1.2, −1.6, +2.0)', tone: 'skip' },
          { label: 'Adjusted Cosine sim(E, A)', value: '0.7115 🎯 (คล้ายกันสูงมาก)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · คำนวณ Adjusted Cosine กับคอร์ส B, C, D สรุปเพื่อนคอร์ส',
        value: 'E คล้ายกับ A (0.7115) และ B (0.7115) · ส่วน C ติดลบ (−0.7071) และ D เป็น 0',
        detail: 'คำนวณแบบเดียวกันกับทุกคอร์ส: พบว่าคอร์ส E มีความคล้ายคลึงสูงกับคอร์ส A (0.7115) และ B (0.7115) ขณะที่คอร์ส C มีความคล้ายติดลบ (คนที่ชอบ E มักเกลียด C)',
        board: { type: 'v1-cf-item', mode: 'all-sim', activeCol: 1 },
        ops: [
          { label: 'ความคล้ายกับ A (Python)', value: 'sim(E, A) = 0.7115 (คอร์สกลุ่มเพื่อน #1)', tone: 'plus' },
          { label: 'ความคล้ายกับ B (SQL)', value: 'sim(E, B) = 0.7115 (คอร์สกลุ่มเพื่อน #2)', tone: 'plus' },
          { label: 'ความคล้ายกับ C (Art)', value: 'sim(E, C) = −0.7071 (ขั้วตรงข้าม)', tone: 'minus' },
          { label: 'ความคล้ายกับ D (UX)', value: 'sim(E, D) = 0.0000 (ไม่เกี่ยวข้องกัน)', tone: 'skip' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · สรุปความได้เปรียบทางวิศวกรรมของ Item-kNN',
        value: 'อธิบายเหตุผลได้ชัดเจน ("แนะนำ E เพราะคุณชอบ A และ B") + ประหยัดทรัพยากรเซิร์ฟเวอร์',
        detail: 'Item-kNN เป็นหนึ่งในอัลกอริทึมที่ได้รับความนิยมสูงสุดตลอดกาล เพราะผลลัพธ์สามารถอธิบายให้ผู้ใช้เข้าใจได้ทันทีอย่างโปร่งใส และคำนวณความคล้ายแบบ Offline ได้สบายๆ',
        board: { type: 'v1-cf-item', mode: 'summary' },
        ops: [
          { label: 'ความโปร่งใส (Explainability)', value: '"แนะนำ Data Story เพราะคุณชอบ Python & SQL"', tone: 'plus' },
          { label: 'ความเสถียรของความสัมพันธ์', value: 'ความคล้ายระหว่างคอร์สไม่แกว่งตามเวลา', tone: 'minus' },
          { label: 'การสเกลระดับอุตสาหกรรม', value: 'Precompute ตาราง Item-Item ล่วงหน้าได้', tone: 'skip' },
          { label: 'ก้าวถัดไป', value: 'นำเพื่อนคอร์ส {A, B} มาทำนายคะแนนให้ฟ้า 🎓', tone: 'result' }
        ]
      }
    ],
    'cf-item-predict': [
      {
        title: 'ขั้นที่ 1 · ดึงความจำในอดีตของ 👩 ฟ้า ต่อยอดจากเพื่อนคอร์ส {A, B}',
        value: 'คอร์ส E คล้ายกับ A (w=0.7115) และ B (w=0.7115) · ฟ้าเคยให้ A=5★ และ B=4★',
        detail: 'ใน Item-kNN เราจะใช้ "ความทรงจำของตัว 👩 ฟ้า เอง" มาทำนาย โดยดูว่าในอดีตฟ้าเคยให้คะแนนคอร์สที่มีความคล้ายกับ E ไว้เท่าไหร่ ซึ่งฟ้าเคยเรียน A (5★) และ B (4★)',
        board: { type: 'v1-cf-item-predict', mode: 'memory', activeRow: 0 },
        ops: [
          { label: 'เพื่อนคอร์สของ E (Top-2)', value: 'A (sim = 0.7115) และ B (sim = 0.7115)', tone: 'minus' },
          { label: 'คะแนนที่ฟ้าเคยให้ A', value: 'r(ฟ้า, A) = 5★ (ชอบมาก)', tone: 'plus' },
          { label: 'คะแนนที่ฟ้าเคยให้ B', value: 'r(ฟ้า, B) = 4★ (ชอบปานกลาง)', tone: 'skip' },
          { label: 'ค่าเฉลี่ยส่วนตัวของฟ้า r̄₁', value: 'r̄₁ = 3.0★ (ไม้บรรทัดประจำตัวฟ้า)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · หักลบค่าเฉลี่ยส่วนตัวของฟ้า (r_uA − r̄ᵤ และ r_uB − r̄ᵤ)',
        value: 'คอร์ส A: 5 − 3.0 = +2.0★ · คอร์ส B: 4 − 3.0 = +1.0★',
        detail: 'เพื่อความแม่นยำสูงสุด สูตร Item-kNN สมัยใหม่จะคำนวณผ่านส่วนเบี่ยงเบนจากค่าเฉลี่ยของฟ้า: ฟ้าชอบ A มากกว่าปกติของตนเอง +2.0 และชอบ B มากกว่าปกติ +1.0',
        board: { type: 'v1-cf-item-predict', mode: 'deviations', activeRow: 0 },
        ops: [
          { label: 'ส่วนเบี่ยงเบนคอร์ส A', value: '5 − 3.0 = +2.0★ (เกินคาดหมาย)', tone: 'plus' },
          { label: 'ส่วนเบี่ยงเบนคอร์ส B', value: '4 − 3.0 = +1.0★ (เกินคาดหมาย)', tone: 'minus' },
          { label: 'ตัวคูณน้ำหนักทั้งสองคอร์ส', value: 'w_A = 0.7115 · w_B = 0.7115 (เท่ากัน)', tone: 'skip' },
          { label: 'ผลรวมตัวคูณความคล้าย', value: 'Σ |w| = 0.7115 + 0.7115 = 1.4230', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · ถ่วงน้ำหนักคะแนนส่วนเบี่ยงเบนของสินค้าเพื่อนบ้าน',
        value: 'ผลรวมถ่วงน้ำหนัก: [0.7115(+2.0) + 0.7115(+1.0)] ÷ 1.4230 = +1.5000★',
        detail: 'คำนวณค่าเฉลี่ยถ่วงน้ำหนักของความชอบที่ฟ้ามีต่อคอร์สคล้าย: (1.4230 + 0.7115) ÷ 1.4230 = 2.1345 ÷ 1.4230 = +1.5000 ดาวเหนือค่าเฉลี่ยปกติของฟ้า',
        board: { type: 'v1-cf-item-predict', mode: 'weighted-dev', activeRow: 0 },
        ops: [
          { label: 'พจน์คอร์ส A ถ่วงน้ำหนัก', value: '0.7115 × (+2.0) = +1.4230', tone: 'plus' },
          { label: 'พจน์คอร์ส B ถ่วงน้ำหนัก', value: '0.7115 × (+1.0) = +0.7115', tone: 'minus' },
          { label: 'ผลรวมพจน์ถ่วงน้ำหนัก', value: '1.4230 + 0.7115 = 2.1345', tone: 'skip' },
          { label: 'ส่วนเบี่ยงเบนเฉลี่ยสุทธิ', value: '2.1345 ÷ 1.4230 = +1.5000★ 🎯', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · บวกกลับเข้าฐานเฉลี่ยของฟ้า สรุปผลทำนาย Item-kNN',
        value: 'r̂(ฟ้า, E) = r̄(ฟ้า) + 1.5000 = 3.0 + 1.5000 = 4.5000★ (ทำนาย 4.5 ดาว 🏆)',
        detail: 'นำค่าเฉลี่ยส่วนตัวของ 👩 ฟ้า (3.0) บวกกับส่วนเบี่ยงเบนถ่วงน้ำหนัก (+1.5) ได้คำทำนายสุดท้ายของ Item-kNN เท่ากับ 4.5000 ดาว (สูงกว่า User-kNN ที่ได้ 4.11 ดาว)',
        board: { type: 'v1-cf-item-predict', mode: 'predict-final', activeRow: 0 },
        ops: [
          { label: 'ฐานเฉลี่ยของฟ้า r̄₁', value: '3.0000★ (Baseline ส่วนบุคคล)', tone: 'minus' },
          { label: 'แรงผลักจากสินค้าที่เคยชอบ', value: '+1.5000★ (ฟ้าชอบทั้ง A และ B มาก)', tone: 'plus' },
          { label: 'ผลทำนาย Item-kNN', value: '3.0 + 1.5000 = 4.5000★ 🏆', tone: 'result' },
          { label: 'เทียบกับ User-kNN', value: 'Item-kNN = 4.5★ vs User-kNN = 4.11★', tone: 'skip' }
        ]
      }
    ],
    'cf-implicit': [
      {
        title: 'ขั้นที่ 1 · แปลงข้อมูลเป็นรอยเท้าพฤติกรรมสองสถานะ (Binary Matrix)',
        value: 'กำหนดเกณฑ์: เรตติ้งเดิม ≥ 4★ แปลงเป็น 1 (มีส่วนร่วม/ชอบ) · ช่องว่าง ? แปลงเป็น 0',
        detail: 'ในโลกจริงกว่า 99% ไม่มีคะแนนดาว มีเพียงประวัติการคลิก ดู หรือซื้อ (Implicit Feedback) โดยเลข 0 ไม่ได้แปลว่า "เกลียด" แต่แปลว่า "ยังไม่เคยแตะต้องหรือยังไม่เห็น"',
        board: { type: 'v1-cf-implicit', mode: 'binary', activeCol: 0 },
        ops: [
          { label: 'รอยเท้าคลิกของ 👩 ฟ้า (u₁)', value: 'คอร์ส {A: 1, B: 1, C: 0, D: 0, E: 0, F: 0}', tone: 'plus' },
          { label: 'ความหมายของเลข 1', value: 'คลิกดู / สั่งซื้อ / ให้ดาวสูง (Positive Signal)', tone: 'minus' },
          { label: 'ความหมายของเลข 0', value: 'ยังไม่เคยดู (Unobserved ≠ Negative!) ⚠️', tone: 'skip' },
          { label: 'เป้าหมายการคำนวณ', value: 'จัดอันดับคอร์สที่ฟ้าควรดูเป็นลำดับถัดไป', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · คำนวณความถี่การถูกเลือกคู่กัน (Co-occurrence Cosine)',
        value: 'ความคล้ายแบบ Binary: sim(E, A) = 2/3 ≈ 0.6667 · sim(E, B) = 2/3 ≈ 0.6667',
        detail: 'นับจำนวนคนที่คลิกดูทั้งสองคอร์สคู่กัน (Co-occurrence) หารด้วยรากที่สองของจำนวนคนดูแต่ละคอร์ส: E กับ A มีคนคลิกคู่กัน 2 คน (u₂, u₄) จากขนาดความยาว √(3×3) = 3 ได้ความคล้าย 2/3',
        board: { type: 'v1-cf-implicit', mode: 'co-occurrence', activeCol: 1 },
        ops: [
          { label: 'คนที่ดูทั้ง E และ A (ร่วม)', value: 'u₂, u₄ (2 คน)', tone: 'plus' },
          { label: 'คนดู A รวม = 3 · คนดู E รวม = 3', value: 'ความยาวเวกเตอร์ = √(3 × 3) = 3', tone: 'minus' },
          { label: 'Binary Cosine sim(E, A)', value: '2 / 3 ≈ 0.6667', tone: 'skip' },
          { label: 'Binary Cosine sim(E, B)', value: '2 / 3 ≈ 0.6667 (u₂, u₅ ดูคู่กัน 2 คน)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · คำนวณคะแนนจัดอันดับ Top-K (Ranking Score)',
        value: 'Score(u₁, E) = sim(A, E) + sim(B, E) = 2/3 + 2/3 = 1.3333 แต้ม',
        detail: 'นำคะแนนความคล้ายของคอร์ส E กับทุกคอร์สที่ 👩 ฟ้า เคยคลิก (A และ B) มารวมกัน ได้คะแนนจัดอันดับ 1.3333 แต้ม (ตัวเลขนี้ไม่ใช่ดาว แต่เป็นคะแนนเปรียบเทียบลำดับ)',
        board: { type: 'v1-cf-implicit', mode: 'score', activeCol: 2 },
        ops: [
          { label: 'หลักฐานจากคอร์ส A ที่ฟ้าคลิก', value: '+0.6667 แต้ม (sim(A, E))', tone: 'plus' },
          { label: 'หลักฐานจากคอร์ส B ที่ฟ้าคลิก', value: '+0.6667 แต้ม (sim(B, E))', tone: 'minus' },
          { label: 'ผลรวมคะแนนจัดอันดับ', value: '2/3 + 2/3 = 1.3333 แต้ม 🏆', tone: 'result' },
          { label: 'ความหมายของตัวเลข', value: 'ไม่ใช่คะแนนดาว แต่ใช้เรียงสล็อต Top-K', tone: 'skip' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · สรุปกฎวิศวกรรม Implicit Recommendation',
        value: 'คำนวณง่ายและเร็วมาก · แต่ต้องระวัง Popularity Bias ที่จะดันของฮิตขึ้นมาทับเสมอ',
        detail: 'Implicit Item-kNN เหมาะกับระบบที่มีข้อมูลคลิกมหาศาล แต่มีข้อควรระวังคือของยอดนิยมจะถูกคลิกคู่กับของอื่นบ่อยตามธรรมชาติ จึงต้องใช้การหารลดทอนความนิยมเสมอ',
        board: { type: 'v1-cf-implicit', mode: 'summary' },
        ops: [
          { label: 'จุดเด่นของ Implicit kNN', value: 'คำนวณได้ทันทีจาก Log การคลิก ไม่ต้องรอง้อดาว', tone: 'plus' },
          { label: 'ข้อควรระวังสำคัญ', value: 'ของฮิตจะ Co-occur กับทุกชิ้น (Popularity Bias)', tone: 'minus' },
          { label: 'วิธีป้องกันความลำเอียง', value: 'ใช้ตัวหาร Cosine หรือ BM25 ปรับสมดุล', tone: 'skip' },
          { label: 'ความนิยมในอุตสาหกรรม', value: 'ระบบ E-Commerce ทั่วโลกใช้เป็นด่านแรก 🎓', tone: 'result' }
        ]
      }
    ],
    'cf-bias': [
      {
        title: 'ขั้นที่ 1 · ค่าเฉลี่ยกลางทั้งระบบ (Global Mean: μ = 3.3000★)',
        value: 'คะแนนรวมทั้งหมด 66 ดาว จาก 20 ช่องที่สังเกตได้ใน Train → μ = 66 / 20 = 3.30★',
        detail: 'นี่คือจุดกึ่งกลางของจักรวาลในระบบเรา: หากมีผู้ใช้ใหม่ที่ไม่รู้ข้อมูลอะไรเลย และสินค้าใหม่ที่ไม่มีใครรีวิว ค่าทำนายที่ปลอดภัยที่สุดทางสถิติคือการทายค่าเฉลี่ยกลาง μ = 3.30 ดาว',
        board: { type: 'v3-cf-bias', activeRow: 0 },
        ops: [
          { label: 'คะแนนดาวรวมใน Train', value: 'Σ r_ui = 66 ดาว', tone: 'plus' },
          { label: 'จำนวนช่องที่รู้คะแนน (|R|)', value: '20 ช่อง (จากทั้งหมด 30 ช่อง)', tone: 'minus' },
          { label: 'ค่าเฉลี่ยกลางทั้งระบบ (μ)', value: '66 / 20 = 3.3000★ 🎯', tone: 'result' },
          { label: 'บทบาทของ μ', value: 'สมอเรือเริ่มต้นของทุกการทำนาย', tone: 'skip' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · คำนวณอคติของผู้ใช้ (User Bias: b_u1 = −0.1500★)',
        value: 'u₁ (👩 ฟ้า) มีค่าเฉลี่ย 3.0★ ต่ำกว่าค่าเฉลี่ยระบบ 3.3★ → มีอคติเชิงลบ b_u = −0.15★',
        detail: 'ผู้ใช้แต่ละคนมีมาตรฐานไม่เท่ากัน: ฟ้าให้คะแนนเฉลี่ยค่อนไปทางต่ำกว่าระบบ ทำให้มีค่า User Bias ติดลบ (−0.15) สะท้อนว่าเป็นคนค่อนข้างเคี่ยวในการแจกดาว',
        board: { type: 'v3-cf-bias', activeRow: 1 },
        ops: [
          { label: 'นิสัยส่วนบุคคลของ u₁ ฟ้า', value: 'เป็นคนค่อนข้างเคี่ยว ไม่แจกดาวพร่ำเพรื่อ', tone: 'minus' },
          { label: 'สูตร User Bias (b_u)', value: 'Σ (r_ui − μ − b_i) / (λ + |I_u|)', tone: 'skip' },
          { label: 'ค่า User Bias ของฟ้า (b_u1)', value: '−0.1500★ (ดึงคะแนนลง 0.15 ดาว)', tone: 'plus' },
          { label: 'ความหมายทางจิตวิทยา', value: 'ฟ้าให้ 4★ แปลว่าชอบมากแล้วสำหรับเธอ', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · คำนวณอคติของสินค้า (Item Bias: b_E = +0.3000★)',
        value: 'คอร์ส E (Data Story) เป็นคอร์สคุณภาพยอดนิยม → มีอคติเชิงบวก b_E = +0.30★',
        detail: 'สินค้าแต่ละชิ้นมีคุณภาพต่างกัน: คอร์ส E มีคนให้คะแนนสูงเป็นส่วนใหญ่ ทำให้มี Item Bias เป็นบวก (+0.30) สะท้อนว่าคอร์สนี้สร้างมาดี ใครเรียนก็มักจะประทับใจ',
        board: { type: 'v3-cf-bias', activeRow: 2 },
        ops: [
          { label: 'คุณภาพคอร์ส E (Data Story)', value: 'คอร์สยอดนิยม เนื้อหาดี คนชมเยอะ', tone: 'plus' },
          { label: 'สูตร Item Bias (b_i)', value: 'Σ (r_ui − μ) / (λ + |U_i|)', tone: 'skip' },
          { label: 'ค่า Item Bias ของคอร์ส E (b_E)', value: '+0.3000★ (ดึงคะแนนขึ้น 0.30 ดาว)', tone: 'minus' },
          { label: 'ความหมายเชิงคุณภาพ', value: 'คอร์สนี้ได้คะแนนเหนือค่าเฉลี่ยเว็บเสมอ', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · รวมโครงสร้างคะแนนพื้นฐาน (Baseline Estimate: b_ui)',
        value: 'b(u₁, E) = μ + b_u + b_i = 3.30 − 0.15 + 0.30 = 3.4500★ (แม่นยำแม้ไร้เพื่อน!)',
        detail: 'เพียงแค่รู้ว่า "เว็บเฉลี่ย 3.30 + คนนี้เคี่ยว −0.15 + คอร์สนี้ดี +0.30" เราก็ทำนายคะแนนได้ถึง 3.4500 ดาวโดยไม่ต้องคำนวณเพื่อนบ้านสักคน! นี่คือหัวใจของ Netflix Prize',
        board: { type: 'v3-cf-bias', activeRow: 3 },
        ops: [
          { label: 'ค่าเฉลี่ยกลางระบบ (μ)', value: '3.3000★ (ฐานกลาง)', tone: 'minus' },
          { label: 'นิสัยความเคี่ยวของฟ้า (b_u)', value: '−0.1500★ (ปรับลด)', tone: 'skip' },
          { label: 'ความดีงามของคอร์ส E (b_i)', value: '+0.3000★ (ปรับเพิ่ม)', tone: 'plus' },
          { label: 'Baseline Estimate b(u₁, E)', value: '3.30 − 0.15 + 0.30 = 3.4500★ 🏆', tone: 'result' }
        ]
      }
    ],
    'cf-baseline': [
      {
        title: 'ขั้นที่ 1 · ปัญหาของการใช้เพื่อนบ้าน kNN ล้วนๆ โดยไม่มีค่าฐาน',
        value: 'เมื่อเพื่อนบ้านมีน้อยหรือข้อมูลแหว่ง kNN จะแกว่งรุนแรงและเกิดค่าทำนายหลุดโลก!',
        detail: 'หากพึ่งพาเพื่อนบ้าน kNN เพียงอย่างเดียว เมื่อเจอผู้ใช้ที่มีเพื่อนบ้านน้อย ค่าทำนายจะแกว่งตามเพื่อนบ้านคนเดียวจนหลุดกรอบความเป็นจริง การมี Baseline ช่วยยึดเป็นสมอเรือให้อยู่กับร่องกับรอย',
        board: { type: 'v1-cf-baseline', mode: 'anchor', activeRow: 0 },
        ops: [
          { label: 'สมอเรือค่าฐาน b(u₁, E)', value: '3.4500★ (โครงสร้างสถิติที่มั่นคง)', tone: 'plus' },
          { label: 'จุดอ่อนของ kNN ดั้งเดิม', value: 'แกว่งตามเพื่อนบ้านเพียงไม่กี่คน (High Variance)', tone: 'skip' },
          { label: 'ปรัชญา kNN-Baseline', value: 'ใช้ Baseline เป็นฐาน แล้วให้เพื่อนบ้านจูนส่วนต่าง', tone: 'minus' },
          { label: 'ผลลัพธ์ทางคณิตศาสตร์', value: 'ลดทอนความผิดพลาด RMSE ลงอย่างมีนัยสำคัญ 🎯', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · คำนวณส่วนต่างเหนือค่าฐานของสินค้าเพื่อนบ้าน (Residuals: r_uj − b_uj)',
        value: 'ดูว่าในอดีต 👩 ฟ้า ให้คะแนนคอร์ส A และ B สูงหรือต่ำกว่าค่าฐาน b(u, j) เท่าไหร่',
        detail: 'แทนที่จะดูว่าฟ้าให้ดาวกี่ดวง kNN-Baseline จะดูว่าฟ้าชอบคอร์สนั้น "เกินกว่าค่าฐานที่ควรจะเป็น" หรือไม่: r_uA − b_uA เพื่อจับเฉพาะรสนิยมแท้จริงที่ตัด Bias ออกแล้ว',
        board: { type: 'v1-cf-baseline', mode: 'residuals', activeRow: 1 },
        ops: [
          { label: 'ค่าฐานของคอร์ส A: b(u₁, A)', value: '3.50★ · ฟ้าให้จริง 5★ → ส่วนต่าง +1.50★', tone: 'plus' },
          { label: 'ค่าฐานของคอร์ส B: b(u₁, B)', value: '3.40★ · ฟ้าให้จริง 4★ → ส่วนต่าง +0.60★', tone: 'minus' },
          { label: 'ความหมายของ Residuals', value: 'รสนิยมแท้จริงที่ไม่ถูกบิดเบือนด้วยความดัง', tone: 'skip' },
          { label: 'สิ่งที่เพื่อนบ้านต้องทำ', value: 'ถ่วงน้ำหนักเฉพาะส่วนต่างบริสุทธิ์นี้', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · ถ่วงน้ำหนักส่วนต่างด้วยความคล้าย Item-Item',
        value: 'นำส่วนต่าง (+1.50 และ +0.60) มาเฉลี่ยถ่วงน้ำหนักด้วย sim(E, A) และ sim(E, B)',
        detail: 'ใช้ความคล้าย Adjusted Cosine ที่หักลบค่าฐาน (0.7115) มาถ่วงน้ำหนักส่วนต่างของคอร์ส A และ B ได้แรงปรับจูนสุทธิ +0.7850 ดาวเหนือค่าฐาน',
        board: { type: 'v1-cf-baseline', mode: 'weighted-residual', activeRow: 2 },
        ops: [
          { label: 'น้ำหนักความคล้ายของ A และ B', value: 'w_A = 0.7115 · w_B = 0.7115', tone: 'minus' },
          { label: 'ส่วนต่างถ่วงน้ำหนัก', value: '0.7115(+1.50) + 0.7115(+0.60) = 1.4942', tone: 'plus' },
          { label: 'ตัวหารผลรวมน้ำหนัก', value: 'Σ |w| = 1.4230', tone: 'skip' },
          { label: 'แรงดึงดูดของเพื่อนบ้าน', value: '1.4942 / 1.4230 = +1.0500★ (แรงเสริม)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · รวมร่างเป็นคำทำนายสมบูรณ์ kNN-Baseline Predictor',
        value: 'r̂(u₁, E) = b(u₁, E) + แรงดึงดูดเพื่อนบ้าน = 3.45 + 1.05 = 4.5000★ 🏆',
        detail: 'เริ่มต้นจากสมอเรือ b_ui = 3.45 ดาว แล้วปรับขึ้นตามแรงเชียร์ของเพื่อนบ้าน +1.05 ดาว ได้คำทำนาย 4.5000 ดาวที่แม่นยำและเสถียรที่สุดในตระกูล Memory-based',
        board: { type: 'v1-cf-baseline', mode: 'summary' },
        ops: [
          { label: 'สมอเรือค่าฐาน b(u₁, E)', value: '3.4500★ (ปลอดภัยไม่หลุดโลก)', tone: 'minus' },
          { label: 'แรงเสริมจากเพื่อนบ้าน kNN', value: '+1.0500★ (สะท้อนรสนิยมเฉพาะตัว)', tone: 'plus' },
          { label: 'คำทำนาย kNN-Baseline', value: '3.45 + 1.05 = 4.5000★ 🏆', tone: 'result' },
          { label: 'รางวัลเกียรติยศ', value: 'หนึ่งในส่วนผสมสำคัญของผู้ชนะ Netflix Prize', tone: 'skip' }
        ]
      }
    ],
    'cf-diagnosis': [
      {
        title: 'ขั้นที่ 1 · อาการที่ 1: ผู้ใช้ใหม่เอี่ยม (User Cold-Start Problem)',
        value: 'อาการ: เพิ่งสมัคร ยังไม่เคยคลิกหรือให้ดาวเลยแม้แต่อันเดียว → หาเพื่อนบ้านไม่ได้!',
        detail: 'CF พึ่งพารอยเท้าในอดีต เมื่อผู้ใช้ยังไม่มีรอยเท้าเลย ระบบ User-kNN จะเป็นอัมพาตทันที ทางออกคือแสดง Onboarding ถามหมวดหมู่ หรือเสิร์ฟ Popularity Baseline',
        board: { type: 'v1-cf-diagnosis', activeRow: 0 },
        ops: [
          { label: 'สาเหตุของโรค', value: 'ประวัติคลิก/ดาว = 0 (แถวในตารางว่างเปล่า)', tone: 'minus' },
          { label: 'ผลกระทบต่อ CF', value: 'หาเพื่อนบ้านไม่ได้ · แนะนำมั่วหรือแครช 💥', tone: 'skip' },
          { label: 'วิธีรักษาทางวิศวกรรม #1', value: 'Onboarding: ให้เลือกหมวดหมู่ที่ชอบตอนสมัคร', tone: 'plus' },
          { label: 'วิธีรักษาทางวิศวกรรม #2', value: 'เสิร์ฟ Popularity Baseline ประจำวัน', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · อาการที่ 2: สินค้าใหม่แกะกล่อง (Item Cold-Start เช่น คอร์ส F)',
        value: 'อาการ: คอร์ส F เพิ่งเปิดตัว ไม่มีใครเคยเรียนเลย → คอลัมน์ว่างเปล่า คำนวณความคล้ายไม่ได้!',
        detail: 'สินค้าใหม่ไม่มีประวัติถูกซื้อร่วมกับใคร (Co-rated = 0) จึงไม่สามารถคำนวณ Item-kNN ได้ ทางออกคือสลับไปใช้ Content-Based อ่านชื่อและคำบรรยายของสินค้ามาช่วย',
        board: { type: 'v1-cf-diagnosis', activeRow: 1 },
        ops: [
          { label: 'สาเหตุของโรค', value: 'สินค้าเพิ่งลงคลัง ยังไม่มีใครเคยรีวิว (เช่น คอร์ส F)', tone: 'minus' },
          { label: 'ผลกระทบต่อ CF', value: 'คอลัมน์ว่างเปล่า ไม่ติดอันดับแนะนำตลอดกาล ⚠️', tone: 'skip' },
          { label: 'วิธีรักษาทางวิศวกรรม #1', value: 'สลับไปใช้ Content-Based Filtering อ่านคำบรรยาย', tone: 'plus' },
          { label: 'วิธีรักษาทางวิศวกรรม #2', value: 'จัดแถบ "สินค้ามาใหม่" และสุ่มสำรวจ 5%', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · อาการที่ 3: ตารางเบาบางยิ่งยวด (Extreme Sparsity > 99%)',
        value: 'อาการ: ตารางมีขนาดล้านคน × แสนสินค้า แต่มีข้อมูลไม่ถึง 0.1% → หาคนรีวิวร่วมกันยากมาก!',
        detail: 'เมื่อตารางเบาบางมาก ผู้ใช้ส่วนใหญ่จะไม่มีสินค้าร่วมกันเลย (I_uv = 0) ทำให้คำนวณ Pearson ไม่ได้ ทางออกคือใช้ Significance Weighting หรือข้ามไปใช้ Matrix Factorization',
        board: { type: 'v1-cf-diagnosis', activeRow: 2 },
        ops: [
          { label: 'สาเหตุของโรค', value: 'สินค้าเป็นล้าน แต่คนทั่วไปดูแค่ไม่กี่สิบชิ้น', tone: 'minus' },
          { label: 'สัดส่วนช่องว่าง', value: 'Sparsity > 99.9% (ตารางแหว่งเกือบทั้งผืน)', tone: 'skip' },
          { label: 'วิธีรักษาทางวิศวกรรม #1', value: 'ใช้ Significance Weighting คุมหลักฐาน', tone: 'plus' },
          { label: 'วิธีรักษาทางวิศวกรรม #2', value: 'เปลี่ยนไปใช้โมเดลแฝง Matrix Factorization (MF) 🏆', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · อาการที่ 4: แกะสีเทาและกับดักของฮิต (Gray Sheep & Popularity Bias)',
        value: 'Gray Sheep: รสนิยมแปลกประหลาดหาเพื่อนยาก | Popularity Bias: แนะนำแต่ของฮิตจนคนเบื่อ',
        detail: 'ผู้ใช้รสนิยมเฉพาะตัวสูง (Gray Sheep) จะหาเพื่อนที่มี Pearson เป็นบวกไม่เจอ ส่วนระบบที่พึ่งพาความถี่มากเกินไปจะแนะนำแต่เพลงฮิตซ้ำๆ ต้องใส่ตัวคุม Diversity ในด่าน Re-ranking',
        board: { type: 'v1-cf-diagnosis', activeRow: 3 },
        ops: [
          { label: 'โรคแกะสีเทา (Gray Sheep)', value: 'ชอบของแปลกที่คนอื่นไม่ชอบ → หาเพื่อนร่วมยาก', tone: 'minus' },
          { label: 'วิธีรักษา Gray Sheep', value: 'ใช้ Content-Based เสริม หรือจัดกลุ่มชุมชน Niche', tone: 'plus' },
          { label: 'กับดักของฮิต (Popularity Bias)', value: 'โชว์แต่เพลงดังเดิมๆ จนเกิด Filter Bubble', tone: 'skip' },
          { label: 'วิธีรักษากับดักของฮิต', value: 'ใส่ MMR / Diversity Penalty ในด่าน Re-ranking 🎓', tone: 'result' }
        ]
      }
    ],
    'model-mf': [
      {
        title: 'ขั้นที่ 1 · เวกเตอร์แฝง 2 มิติของผู้ใช้ (pᵤ) และสินค้า (qᵢ)',
        value: 'เวกเตอร์ฟ้า pᵤ = (1.0, 0.5) · เวกเตอร์สินค้า qᵢ = (0.8, 0.4) ในมิติแฝง k = 2',
        detail: 'Matrix Factorization (MF) บีบอัดตารางขนาดใหญ่ให้เหลือเวกเตอร์แฝงขนาดเล็ก (k มิติ): แกนที่ 1 อาจหมายถึง "สายโค้ด vs สายวิชาการ" และแกนที่ 2 คือ "ระดับความยาก"',
        board: { type: 'v3-model-mf', activeRow: 0 },
        ops: [
          { label: 'เวกเตอร์รสนิยม 👩 ฟ้า (pᵤ)', value: '(1.0, 0.5) · k = 2 มิติแฝง', tone: 'minus' },
          { label: 'เวกเตอร์คุณลักษณะคอร์ส (qᵢ)', value: '(0.8, 0.4) · k = 2 มิติแฝง', tone: 'skip' },
          { label: 'ความหมายของมิติแฝง', value: 'คุณลักษณะที่โมเดลค้นพบเองโดยมนุษย์ไม่ต้องตั้งชื่อ', tone: 'plus' },
          { label: 'ขนาดพื้นที่จัดเก็บ', value: 'ประหยัดแรมมหาศาล (บีบอัดจากตารางล้านช่อง)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · วัดความเข้ากันได้ด้วย Dot Product (pᵤ · qᵢ)',
        value: 'pᵤ · qᵢ = (1.0 × 0.8) + (0.5 × 0.4) = 0.8 + 0.2 = 1.0000 แต้ม',
        detail: 'นำเวกเตอร์ความชอบของฟ้ามาคูณจุดกับเวกเตอร์สินค้า: ผลคูณเป็นบวกสูง (1.0000) แสดงว่ารสนิยมของฟ้าสอดคล้องกับคุณลักษณะของสินค้าชิ้นนี้อย่างยอดเยี่ยม',
        board: { type: 'v3-model-mf', activeRow: 1 },
        ops: [
          { label: 'ผลคูณแกนที่ 1 (1.0 × 0.8)', value: '+0.8000', tone: 'plus' },
          { label: 'ผลคูณแกนที่ 2 (0.5 × 0.4)', value: '+0.2000', tone: 'minus' },
          { label: 'ผลรวม Dot Product (pᵤ · qᵢ)', value: '0.8 + 0.2 = 1.0000 🎯', tone: 'result' },
          { label: 'ความหมายทางเรขาคณิต', value: 'เวกเตอร์ชี้ไปในทิศทางเดียวกันในพื้นที่แฝง', tone: 'skip' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · รวมโครงสร้างค่าฐาน Baseline (bᵤᵢ = μ + bᵤ + bᵢ)',
        value: 'ค่าเฉลี่ยระบบ μ=3.0 · นิสัยฟ้า bᵤ=+0.2 · คอร์ส bᵢ=−0.1 → ฐาน bᵤᵢ = 3.1000★',
        detail: 'โมเดล MF ที่ชนะรางวัล Netflix Prize จะใส่ค่าฐาน Baseline เข้าไปด้วยเสมอ เพื่อรองรับโครงสร้างคะแนนใหญ่ ทำให้เวกเตอร์แฝงโฟกัสเฉพาะรสนิยมแท้จริง',
        board: { type: 'v3-model-mf', activeRow: 2 },
        ops: [
          { label: 'ค่าเฉลี่ยกลางของระบบ (μ)', value: '3.0000★', tone: 'minus' },
          { label: 'อคติของผู้ใช้ฟ้า (b_u)', value: '+0.2000★ (ใจดีกว่าปกตินิดหน่อย)', tone: 'plus' },
          { label: 'อคติของคอร์ส (b_i)', value: '−0.1000★', tone: 'skip' },
          { label: 'Baseline bᵤᵢ', value: '3.0 + 0.2 − 0.1 = 3.1000★', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · คำทำนายสมบูรณ์ของ Matrix Factorization',
        value: 'r̂ᵤᵢ = bᵤᵢ + (pᵤ · qᵢ) = 3.1000 + 1.0000 = 4.1000★ (ทำนาย 4.1 ดาว 🏆)',
        detail: 'รวมค่าฐาน Baseline (3.10) เข้ากับความเข้ากันได้ของปัจจัยแฝง (+1.00) ได้ผลทำนายที่สมบูรณ์แบบ 4.1000 ดาว คำนวณได้ทันทีในเสี้ยววินาที',
        board: { type: 'v3-model-mf', activeRow: 3 },
        ops: [
          { label: 'สมอเรือค่าฐาน Baseline', value: '3.1000★ (โครงสร้างสถิติ)', tone: 'minus' },
          { label: 'แรงดึงดูดปัจจัยแฝง pᵤ · qᵢ', value: '+1.0000★ (ความตรงใจรสนิยม)', tone: 'plus' },
          { label: 'คำทำนาย MF สุดท้าย', value: '3.10 + 1.00 = 4.1000★ 🏆', tone: 'result' },
          { label: 'ความเร็วในการเสิร์ฟ', value: 'ดึงเวกเตอร์คูณ Dot Product ใน < 2 ms ⚡', tone: 'skip' }
        ]
      }
    ],
    'model-loss': [
      {
        title: 'ขั้นที่ 1 · กฎเหล็กของ Simon Funk: คิด Loss เฉพาะช่องที่สังเกตได้ (Observed Only)',
        value: 'L = ½ Σ_{(u, i) ∈ R_train} (r_ui − r̂_ui)² · ห้ามเติม 0 ในช่องว่าง (?) เด็ดขาด!',
        detail: 'พีชคณิตเชิงเส้นดั้งเดิมบังคับตารางต้องเต็ม แต่ RecSys ว่าง 99%! Simon Funk พลิกวงการด้วยการประกาศว่า: เราจะคำนวณ Loss เฉพาะช่องที่มีการให้ดาวจริงใน Train เท่านั้น',
        board: { type: 'v4-model-loss', activeRow: 0 },
        ops: [
          { label: 'ช่องที่มีดาวจริง (Observed)', value: 'คำนวณ Error และส่งสัญญาณปรับโมเดล ✓', tone: 'plus' },
          { label: 'ช่องว่าง (?) ในตาราง', value: 'ข้ามไปเลย! ห้ามคิดเป็น 0 เด็ดขาด ⚠️', tone: 'minus' },
          { label: 'ถ้าเผลอเติม 0 ในช่องว่าง?', value: 'โมเดลจะพังทลายทันทีเพราะคิดว่าคนเกลียดทุกอย่าง', tone: 'skip' },
          { label: 'ผลลัพธ์ของ Funk SVD', value: 'ทำให้เทรน MF บนตารางแหว่ง 99% ได้สำเร็จ 🏆', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · คำนวณความผิดพลาดรายจุด (Prediction Error: e_ui = r_ui − r̂_ui)',
        value: 'คะแนนจริง r = 4.0★ · โมเดลสุ่มทาย r̂ = 3.08★ → ความผิดพลาด e = 4.0 − 3.08 = +0.92★',
        detail: 'เมื่อโมเดลทำนายได้ 3.08 ดาว แต่คะแนนจริงที่ผู้ใช้ให้คือ 4.0 ดาว แสดงว่าโมเดลทำนายต่ำไป ความผิดพลาด e = +0.92 ดาว จะเป็นสัญญาณเตือนภัยให้โมเดลปรับตัว',
        board: { type: 'v4-model-loss', activeRow: 1 },
        ops: [
          { label: 'คะแนนจริงของผู้ใช้ (r_ui)', value: '4.0000★ (ความจริงในชุดฝึก)', tone: 'plus' },
          { label: 'คะแนนที่โมเดลทาย (r̂_ui)', value: '3.0800★ (โมเดลทายต่ำไป)', tone: 'minus' },
          { label: 'สัญญาณ Error (e = r − r̂)', value: '4.0 − 3.08 = +0.9200★', tone: 'skip' },
          { label: 'ทิศทางการปรับตัว', value: 'โมเดลต้องขยับเวกเตอร์เข้าหากันเพื่อดันคะแนนขึ้น', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · การยกกำลังสองและตัวคูณครึ่งหนึ่ง (Squared Error & Half Factor)',
        value: 'Squared Error: e² = (0.92)² = 0.8464 → Loss เฉพาะจุด = ½ × 0.8464 = 0.4232 แต้ม',
        detail: 'การยกกำลังสองทำให้ค่าผิดพลาดเป็นบวกเสมอ และลงโทษความผิดพลาดก้อนใหญ่หนักเป็นพิเศษ (ทายผิด 2 ดาว โดนปรับหนักกว่าผิด 1 ดาวถึง 4 เท่า!) ส่วนตัวคูณ ½ ใส่ไว้เพื่อให้ดิฟแล้วเลข 2 ตัดกันสวยงาม',
        board: { type: 'v4-model-loss', activeRow: 2 },
        ops: [
          { label: 'ความผิดพลาดยกกำลังสอง (e²)', value: '(0.92)² = 0.8464 (ลงโทษหนักข้อผิดพลาดใหญ่)', tone: 'minus' },
          { label: 'ตัวคูณ ½ (Convenience Factor)', value: '½ × 0.8464 = 0.4232 แต้ม', tone: 'plus' },
          { label: 'ทำไมต้องมีตัวคูณ ½?', value: 'เมื่อหาอนุพันธ์ (ดิฟ) เลข 2 จะตัดกับ ½ พอดี', tone: 'skip' },
          { label: 'ลักษณะของ Squared Penalty', value: 'ทายผิด 2 เท่า โดนปรับคะแนน Loss พุ่ง 4 เท่า!', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · เป้าหมายสูงสุดในขั้นตอนการเทรน (Optimization Objective)',
        value: 'ปรับพารามิเตอร์เวกเตอร์ p และ q เพื่อลดทอนค่าผลรวม Loss ให้เหลือน้อยที่สุด!',
        detail: 'กระบวนการฝึกสอนโมเดล (Training Phase) มีเป้าหมายเดียวคือการปรับทิศทางและความยาวของเวกเตอร์ p_u และ q_i เพื่อทำให้ค่าผลรวม Loss ทั่วทั้งตารางมีค่าต่ำที่สุด',
        board: { type: 'v4-model-loss', activeRow: 3 },
        ops: [
          { label: 'เป้าหมายการเทรน (Goal)', value: 'min_{P, Q} L_train (ทำให้ Loss ต่ำสุด)', tone: 'plus' },
          { label: 'เข็มทิศนำทาง', value: 'เกรเดียนต์ (Gradient) ของ Loss ชี้ทิศทางปรับ', tone: 'minus' },
          { label: 'เมื่อ Loss เข้าใกล้ 0', value: 'โมเดลทำนายได้ตรงกับความจริงในชุดฝึก', tone: 'skip' },
          { label: 'ก้าวถัดไป', value: 'ใช้อัลกอริทึม SGD เดินตามเข็มทิศทีละก้าว 🎓', tone: 'result' }
        ]
      }
    ],
    'model-sgd': [
      {
        title: 'ขั้นที่ 1 · ตรวจสอบสถานะก่อนอัปเดต (Current State & Error)',
        value: 'p = (0.2, 0.1), q = (0.5, −0.2) · ทายได้ r̂ = 3.08★ → Error e = 4.0 − 3.08 = +0.92★',
        detail: 'เวกเตอร์เริ่มต้นของคนและสินค้าคำนวณคะแนนได้ 3.08 ดาว เทียบกับความจริง 4.0 ดาว ได้ความผิดพลาด e = +0.92 ดาว พร้อมค่า Loss ก่อนอัปเดตเท่ากับ 0.4282 แต้ม',
        board: { type: 'v4-model-sgd', mode: 'before', activeRow: 0 },
        ops: [
          { label: 'พิกัดเวกเตอร์ผู้ใช้ p', value: '(0.2000, 0.1000)', tone: 'minus' },
          { label: 'พิกัดเวกเตอร์สินค้า q', value: '(0.5000, −0.2000)', tone: 'skip' },
          { label: 'ความผิดพลาด e (รังวัดได้)', value: '4.0 − 3.08 = +0.9200★ (ทายต่ำไป)', tone: 'plus' },
          { label: 'Loss รวมก่อนอัปเดต', value: '0.4282 แต้ม (มี Regularization λ=0.1)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · สูตรก้าวอัปเดตเวกเตอร์ SGD (Stochastic Gradient Step)',
        value: 'p_new = p + η (e·q − λ·p) และ q_new = q + η (e·p − λ·q) เมื่อตั้ง η = 0.1, λ = 0.1',
        detail: 'SGD ขยับเวกเตอร์ในทิศทางลดทอนความผิดพลาด: พจน์ e·q ดึงเวกเตอร์ p เข้าหา q เพื่อเพิ่มคะแนน ขณะที่พจน์ −λ·p คือแรงดึงรั้ง (Weight Decay) ไม่ให้เวกเตอร์โตเกินไป',
        board: { type: 'v4-model-sgd', mode: 'formula', activeRow: 1 },
        ops: [
          { label: 'อัตราการเรียนรู้ (Learning Rate η)', value: 'η = 0.1 (ความยาวของแต่ละก้าว)', tone: 'minus' },
          { label: 'แรงดึงปรับแก้ (Data Force: e·q)', value: '+0.92 × q (ดึงเข้าหากันเพื่อลด Error)', tone: 'plus' },
          { label: 'แรงเบรกหดขนาด (Weight Decay)', value: '−λ × p (ดึงกลับสู่จุดศูนย์ ป้องกัน Overfit)', tone: 'skip' },
          { label: 'ความถี่ในการอัปเดต', value: 'อัปเดตทันทีทีละ 1 ตัวอย่าง (Stochastic)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · คำนวณพิกัดใหม่หลังก้าวอัปเดต 1 สเต็ป',
        value: 'p_new = (0.2440, 0.0806) · q_new = (0.5164, −0.1988) หมุนเข้าหากันอย่างแม่นยำ',
        detail: 'คำนวณตัวเลขจริง: p₁_new = 0.2 + 0.1(0.92×0.5 − 0.1×0.2) = 0.2440 และ p₂_new = 0.1 + 0.1(0.92×(−0.2) − 0.1×0.1) = 0.0806 เวกเตอร์ปรับทิศทางเข้าหาคำตอบที่ดีขึ้น',
        board: { type: 'v4-model-sgd', mode: 'step', activeRow: 2 },
        ops: [
          { label: 'เวกเตอร์ p ใหม่ของผู้ใช้', value: '(0.2440, 0.0806) (ขยับเข้าใกล้ q)', tone: 'plus' },
          { label: 'เวกเตอร์ q ใหม่ของสินค้า', value: '(0.5164, −0.1988) (ขยับเข้าใกล้ p)', tone: 'minus' },
          { label: 'คะแนนทำนายใหม่ (r̂_new)', value: '3.0 + (p_new · q_new) = 3.1100★', tone: 'skip' },
          { label: 'ความผิดพลาดใหม่', value: 'ลดลงเหลือ e = 4.0 − 3.11 = +0.89★', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · สรุปผลลัพธ์: ค่า Loss ลดลง โมเดลฉลาดขึ้นในพริบตา',
        value: 'Loss รวมลดลงจาก 0.4282 เหลือ 0.3541 แต้ม (โมเดลเรียนรู้และเก่งขึ้นจริง 🏆)',
        detail: 'หลังผ่านการอัปเดตเพียง 1 ก้าว ค่าความสูญเสียลดลงอย่างเห็นได้ชัด เมื่อทำซ้ำหลายหมื่นรอบกับทุกตัวอย่างในตาราง โมเดลจะลู่เข้าสู่จุดที่ทำนายได้แม่นยำสูงสุด',
        board: { type: 'v4-model-sgd', mode: 'summary', activeRow: 3 },
        ops: [
          { label: 'Loss ก่อนอัปเดต', value: '0.4282 แต้ม', tone: 'minus' },
          { label: 'Loss หลังอัปเดต', value: '0.3541 แต้ม 🏆 (ลดลงฮวบ)', tone: 'plus' },
          { label: 'จุดเด่นของ SGD', value: 'รันเร็ว ใช้แรมน้อย สเกลกับข้อมูลพันล้านชิ้นได้', tone: 'skip' },
          { label: 'ข้อควรระวัง', value: 'ถ้าตั้ง η ใหญ่ไปจะกระโดดข้ามจุดต่ำสุด (Diverge)', tone: 'result' }
        ]
      }
    ],
    'model-reg': [
      {
        title: 'ขั้นที่ 1 · ภัยเงียบของการจำข้อสอบ (The Overfitting Threat)',
        value: 'ถ้าไม่มีการควบคุม โมเดลจะขยายเวกเตอร์ไปไกลลิบเพื่อให้ทายถูกทุกข้อในชุด Train!',
        detail: 'โมเดล MF มีพารามิเตอร์นับแสนตัว หากไม่มีการเบรก มันจะพยายามจำสัญญาณรบกวน (Noise) ในชุด Train จนค่า Train Loss ต่ำมาก แต่พอเจอผู้ใช้จริงกลับสอบตกย่อยยับ',
        board: { type: 'v4-model-reg', mode: 'overfit', activeRow: 0 },
        ops: [
          { label: 'พฤติกรรมเมื่อไม่มี Regularization', value: 'เวกเตอร์ขยายตัวอย่างบ้าคลั่ง ‖p‖ พุ่งกระฉูด', tone: 'skip' },
          { label: 'ผลลัพธ์บนชุด Train', value: 'Train Loss เข้าใกล้ 0 (จำข้อสอบได้หมดเป๊ะ)', tone: 'plus' },
          { label: 'ผลลัพธ์บนโลกจริง (Test Set)', value: 'Test Loss พุ่งสูง ทำนายผิดพลาดเละเทะ 💥', tone: 'minus' },
          { label: 'ทางออกทางคณิตศาสตร์', value: 'L2 Regularization (Weight Shrinkage)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · ถอดรหัสภาษีความซับซ้อน (L2 Complexity Penalty: ½ λ ‖w‖²)',
        value: 'Loss รวม = ค่าผิดพลาดข้อมูล + ½ λ ( Σ ‖pᵤ‖² + Σ ‖qᵢ‖² + Σ bᵤ² + Σ bᵢ² )',
        detail: 'เราเพิ่มกฎลงในสมการว่า: ยิ่งเวกเตอร์ p และ q มีความยาวมากเท่าไหร่ จะถูกปรับภาษีความซับซ้อนเพิ่มขึ้นเป็นกำลังสอง บังคับให้เวกเตอร์เรียบง่ายและสั้นที่สุด',
        board: { type: 'v4-model-reg', mode: 'penalty', activeRow: 1 },
        ops: [
          { label: 'พจน์ที่ 1 (Data Fitting)', value: 'ดึงเวกเตอร์ให้ทายคะแนนดาวได้แม่นยำ', tone: 'plus' },
          { label: 'พจน์ที่ 2 (L2 Penalty)', value: 'คิดภาษีความซับซ้อน (ดึงกลับสู่จุดศูนย์ 0)', tone: 'minus' },
          { label: 'พารามิเตอร์ λ (แลมบ์ดา)', value: 'ตัวปรับความเข้มงวดในการเหยียบเบรก', tone: 'skip' },
          { label: 'ผลลัพธ์เชิงเรขาคณิต', value: 'หดขนาดเวกเตอร์ (Weight Shrinkage) 🛡️', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · ผลกระทบของการเลือกค่าไฮเปอร์พารามิเตอร์ λ',
        value: 'λ=0: Overfit จำข้อสอบ · λ=100: Underfit ทื่อเป็นศูนย์ · λ=0.05: บาลานซ์สมบูรณ์แบบ',
        detail: 'ถ้าตั้ง λ = 0 โมเดลจะไม่เบรกเลย (Overfitting) แต่ถ้าตั้ง λ สูงเกินไป เวกเตอร์จะถูกบีบจนเป็นศูนย์หมด (Underfitting) จึงต้องหาจุดกึ่งกลางที่สมดุล',
        board: { type: 'v4-model-reg', mode: 'comparison', activeRow: 2 },
        ops: [
          { label: 'เมื่อตั้ง λ = 0 (ไม่เบรก)', value: 'Overfitting: จำข้อสอบ Train ดี แต่ Test แย่', tone: 'skip' },
          { label: 'เมื่อตั้ง λ สูงเกิน (λ = 100)', value: 'Underfitting: บีบเวกเตอร์หดเหลือ 0 ไม่เรียนรู้อะไร', tone: 'minus' },
          { label: 'เมื่อตั้ง λ เหมาะสม (λ ≈ 0.05)', value: 'Optimal Generalization: ทำนายโลกจริงแม่นยำสุด 🏆', tone: 'plus' },
          { label: 'พฤติกรรมเวกเตอร์', value: 'รักษาสเกลที่กระชับและไม่หลงกล Noise', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · กฎเหล็กการปรับจูนค่า λ ทางวิศวกรรม',
        value: 'ห้ามจูน λ บนชุด Train เด็ดขาด! · ต้องตัดสินบนชุดตรวจสอบ (Validation Set) เท่านั้น',
        detail: 'เพราะชุด Train จะหลอกเราเสมอว่า λ = 0 ดีที่สุด (เพราะ Loss ต่ำสุด) การเลือกค่า λ ที่ดีที่สุดต้องวัดจาก Validation Set ที่โมเดลไม่เคยเห็นตอนเทรนเท่านั้น',
        board: { type: 'v4-model-reg', mode: 'summary', activeRow: 3 },
        ops: [
          { label: 'หลุมพรางการจูนบน Train', value: 'ชุด Train จะบอกว่า λ=0 ดีที่สุดเสมอ (ภาพลวงตา!)', tone: 'skip' },
          { label: 'กฎเหล็กวิศวกรรม', value: 'จูนและเลือกค่า λ บน Validation Set เท่านั้น 🛡️', tone: 'plus' },
          { label: 'เทคนิคแยก λ_user vs λ_item', value: 'สินค้าที่มีรีวิวน้อย ควรใส่ λ เข้มงวดกว่า', tone: 'minus' },
          { label: 'ผลลัพธ์ปลายทาง', value: 'โมเดลมีเสถียรภาพและทนทานต่อข้อมูลจริง 🎓', tone: 'result' }
        ]
      }
    ],
    'model-als': [
      {
        title: 'ขั้นที่ 1 · ปรัชญา Alternating Least Squares (ALS): ปัญหาไม่นูนกลายเป็นนูน',
        value: 'เมื่อหา P และ Q พร้อมกันสมการจะยาก → แต่ถ้า "ตรึงฝั่งหนึ่งไว้" อีกฝั่งจะกลายเป็นสมการเส้นตรงทันที!',
        detail: 'ผลคูณ p·q ทำให้ปัญหาไม่นูน (Non-convex) แก้พร้อมกันยากมาก แต่ถ้าเราแกล้งทำเป็นว่าล็อกสินค้า Q ไว้คงที่ ปัญหาจะกลายเป็น Ridge Regression เชิงเส้นธรรมดาที่แก้หา P ได้ในรอบเดียว',
        board: { type: 'v4-model-als', mode: 'concept', activeRow: 0 },
        ops: [
          { label: 'ปัญหาดั้งเดิม (Non-convex)', value: 'หา P และ Q พร้อมกันยากมาก (มีจุดอานม้า)', tone: 'skip' },
          { label: 'กลยุทธ์ ALS (Alternating)', value: 'ตรึง Q แก้หา P → สลับตรึง P แก้หา Q', tone: 'plus' },
          { label: 'เมื่อฝั่งหนึ่งถูกตรึง', value: 'ปัญหาเปลี่ยนเป็น Least Squares เชิงเส้นทันที 🎯', tone: 'minus' },
          { label: 'ไม่ต้องเดาสุ่ม Learning Rate', value: 'มีสูตรคำตอบรูปปิด (Closed-Form) แก้รอบเดียวจบ', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · ขั้นตอนที่ 1: ตรึงสินค้า Q แก้หาคำตอบรูปปิดของผู้ใช้ p',
        value: 'ตรึง q=(1.0, 2.0), เป้าหมาย y=(2.0, 1.0), λ=1 → p = (q·y)/(‖q‖²+λ) = 4/(5+1) = 0.6667',
        detail: 'ใช้สูตรคำตอบรูปปิด: p = (qᵀ y) / (qᵀ q + λ) = (1×2 + 2×1) / (1² + 2² + 1) = 4 / 6 = 0.6667 แก้เสร็จทันทีโดยไม่ต้องวนลูปสุ่มก้าวแบบ SGD',
        board: { type: 'v4-model-als', mode: 'solve-p', activeRow: 1 },
        ops: [
          { label: 'เวกเตอร์สินค้าที่ตรึงไว้ q', value: '(1.0, 2.0) · ‖q‖² = 1 + 4 = 5', tone: 'minus' },
          { label: 'ผลคูณจุดกับเป้าหมาย q·y', value: '(1×2) + (2×1) = 4.0', tone: 'plus' },
          { label: 'ตัวหารพร้อม Regularization', value: '‖q‖² + λ = 5 + 1 = 6', tone: 'skip' },
          { label: 'คำตอบรูปปิดของ p', value: '4 / 6 = 0.6667 🏆 (แม่นยำในขั้นตอนเดียว)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · ขั้นตอนที่ 2: สลับข้าง ตรึง P แก้หาคำตอบของสินค้า Q ใหม่',
        value: 'นำ p = 0.6667 ที่เพิ่งได้ มาตรึงไว้ แล้วสลับไปแก้หาเวกเตอร์สินค้า q ใหม่ทีละตัว',
        detail: 'เมื่อได้ P ที่สมบูรณ์แล้ว เราสลับบทบาท: ล็อก P ไว้ให้นิ่ง แล้วใช้สูตร Least Squares เดียวกันแก้หา Q ใหม่ให้สอดคล้องกันอย่างลงตัว',
        board: { type: 'v4-model-als', mode: 'solve-q', activeRow: 2 },
        ops: [
          { label: 'เวกเตอร์ผู้ใช้ที่เพิ่งอัปเดต p', value: '0.6667 (ตรึงให้คงที่ในขั้นนี้)', tone: 'plus' },
          { label: 'ภารกิจของขั้นนี้', value: 'แก้หาเวกเตอร์สินค้า q ใหม่ให้รับกับ p', tone: 'minus' },
          { label: 'การทำงานแบบขนาน (Parallel)', value: 'ผู้ใช้แต่ละคนและสินค้าแต่ละชิ้นคำนวณแยกกันได้อิสระ', tone: 'skip' },
          { label: 'เหมาะกับระบบคลัสเตอร์', value: 'รันขนานบน Apache Spark ได้เร็วระดับโลก ⚡', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · การันตีความลู่เข้า: Loss ลดลงแบบขั้นบันได (Monotonic Decrease)',
        value: 'ALS รับประกันทางคณิตศาสตร์ว่า ค่าความสูญเสีย (Loss) จะลดลงหรือเท่าเดิมเสมอในทุกรอบ!',
        detail: 'เนื่องจากทุกขั้นตอนแก้ด้วย Least Squares ที่หาจุดต่ำสุดสัมบูรณ์ของฝั่งนั้นๆ ค่า Loss จึงลดลงอย่างราบรื่น ไม่มีอาการแกว่งไปมาเหมือน SGD',
        board: { type: 'v4-model-als', mode: 'summary', activeRow: 3 },
        ops: [
          { label: 'คุณสมบัติทางคณิตศาสตร์', value: 'Loss ลดลงแบบ Monotonic ในทุก Pass 🛡️', tone: 'plus' },
          { label: 'เทียบกับ SGD', value: 'SGD ไวต่อ Learning Rate แต่ ALS ไม่มีพารามิเตอร์ก้าว', tone: 'minus' },
          { label: 'ข้อจำกัดของ ALS', value: 'ต้องคูณเมทริกซ์และอินเวิร์ส (แพงถ้ามิติ k ใหญ่)', tone: 'skip' },
          { label: 'บทบาทในอุตสาหกรรม', value: 'รากฐานสำคัญของระบบ Implicit RecSys (iALS) 🎓', tone: 'result' }
        ]
      }
    ],
    'model-history': [
      {
        title: 'ขั้นที่ 1 · ข้อจำกัดของโมเดล MF แบบดั้งเดิม (Explicit Profile pᵤ)',
        value: 'ผู้ใช้มี pᵤ = (0.2, 0.1) จากคะแนนดาว... แต่ถ้าผู้ใช้ให้ดาวน้อยมาก ข้อมูลจะไม่พอ!',
        detail: 'ในโมเดล MF ดั้งเดิม ผู้ใช้ 1 คนมีเวกเตอร์พารามิเตอร์ p_u เพียงเส้นเดียว หากผู้ใช้คนนั้นเป็นคนขี้เกียจให้ดาว (มีแค่ 1–2 รีวิว) เวกเตอร์ p_u จะอ่อนแอและไม่แม่นยำ',
        board: { type: 'v3-model-history', activeRow: 0 },
        ops: [
          { label: 'เวกเตอร์ดาวดั้งเดิม pᵤ', value: '(0.20, 0.10) · อาศัยเฉพาะคะแนนดาว', tone: 'minus' },
          { label: 'ปัญหาในโลกจริง', value: 'คนส่วนใหญ่ไม่ชอบให้ดาว (ประวัติดาวเบาบางมาก)', tone: 'skip' },
          { label: 'สิ่งที่ผู้ใช้ทำเยอะมาก', value: 'คลิกดูสินค้า, กดไลก์, ฟังเพลง (Implicit Signals)', tone: 'plus' },
          { label: 'แนวคิดของ SVD++', value: 'เอาประวัติการคลิกมาช่วยเสริมพลังเวกเตอร์ผู้ใช้!', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · ดึงรอยเท้าการคลิกในอดีต (Implicit Item Factors yⱼ)',
        value: 'ผู้ใช้เคยคลิกดูสินค้ามาแล้ว 4 ชิ้น (|N| = 4) · แต่ละชิ้นมีเวกเตอร์พฤติกรรม yⱼ ประจำตัว',
        detail: 'SVD++ มอบเวกเตอร์แฝง y_j ให้กับสินค้าทุกชิ้น เพื่อบันทึกว่า "คนที่ชอบคลิกสินค้านี้ มักเป็นคนอย่างไร" แม้ผู้ใช้ไม่ได้ให้ดาว แต่การคลิก 4 ครั้งก็บอกรสนิยมได้แน่นหนา',
        board: { type: 'v3-model-history', activeRow: 1 },
        ops: [
          { label: 'สินค้าที่เคยคลิกดู (|N|)', value: 'เคยคลิกดู 4 ชิ้น (|N| = 4)', tone: 'minus' },
          { label: 'เวกเตอร์พฤติกรรมสะสม Σ yⱼ', value: '(0.2, 0) + (0.1, 0.1) + (0.2, 0) + (0.1, 0.1) = (0.6, 0.2)', tone: 'plus' },
          { label: 'ตัวคูณลดทอนตามจำนวนคลิก', value: '1 / √|N| = 1 / √4 = 1/2 = 0.50', tone: 'skip' },
          { label: 'ทำไมต้องหารด้วย √|N|?', value: 'ป้องกันคนที่คลิกดูเยอะเกินไปไม่ให้มีเวกเตอร์บวมโต', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · รวมพลังด้วย SVD++ เสริมแกร่งเวกเตอร์ผู้ใช้',
        value: 'p_enhanced = pᵤ + (1/√|N|) Σ yⱼ = (0.2, 0.1) + 0.5(0.6, 0.2) = (0.50, 0.20)',
        detail: 'นำเวกเตอร์ดาวเดิม (0.2, 0.1) มารวมกับเวกเตอร์เฉลี่ยของสิ่งที่เคยคลิกดู (0.3, 0.1) ได้เวกเตอร์ผู้ใช้ที่แข็งแกร่งและสมบูรณ์ขึ้นเป็น (0.50, 0.20)',
        board: { type: 'v3-model-history', activeRow: 2 },
        ops: [
          { label: 'เวกเตอร์ดาวเดิม pᵤ', value: '(0.20, 0.10)', tone: 'minus' },
          { label: 'เวกเตอร์เสริมจากคลิก (1/√|N|)Σy', value: '0.5 × (0.6, 0.2) = (0.30, 0.10)', tone: 'plus' },
          { label: 'โปรไฟล์ใหม่เสริมพลัง (SVD++)', value: '(0.20+0.30, 0.10+0.10) = (0.50, 0.20) 🏆', tone: 'result' },
          { label: 'จุดเปลี่ยนสำคัญ', value: 'เวกเตอร์มีมิติและความคมชัดเพิ่มขึ้นอย่างมาก', tone: 'skip' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · ทำนายผลลัพธ์: ยกระดับความแม่นยำอย่างก้าวกระโดด',
        value: 'r̂ = Base(3.0) + p_enhanced · q = 3.0 + (0.5×0.4 + 0.2×0.5) = 3.3000★ 🏆',
        detail: 'นำเวกเตอร์เสริมพลังมาคูณกับเวกเตอร์สินค้า q=(0.4, 0.5) ได้คำทำนาย 3.3000 ดาว SVD++ คือโมเดลที่ช่วยให้ทีมผู้เข้าแข่งขันชนะรางวัล Netflix Prize ได้สำเร็จ',
        board: { type: 'v3-model-history', activeRow: 3 },
        ops: [
          { label: 'ค่าฐาน Baseline', value: '3.0000★', tone: 'minus' },
          { label: 'ผลคูณจุด (0.50×0.4 + 0.20×0.5)', value: '0.20 + 0.10 = +0.3000★', tone: 'plus' },
          { label: 'คำทำนายสมบูรณ์ SVD++', value: '3.0 + 0.30 = 3.3000★ 🏆', tone: 'result' },
          { label: 'คุณค่าทางวิศวกรรม', value: 'กู้ชีพผู้ใช้ที่แทบไม่เคยให้ดาวแต่คลิกดูบ่อย 🎓', tone: 'skip' }
        ]
      }
    ],
    'model-wrmf': [
      {
        title: 'ขั้นที่ 1 · ปรัชญา WRMF: แยกความชอบ (Preference) ออกจากความมั่นใจ (Confidence)',
        value: 'ความชอบ p ∈ {0, 1} (ชอบหรือไม่ชอบ) · ความมั่นใจ c = 1 + α · r (หลักฐานแน่นแค่ไหน)',
        detail: 'ในข้อมูลคลิกหรือการซื้อ (Implicit Feedback) การคลิกซ้ำไม่ได้แปลว่าชอบเป็น 10 เท่า แต่แปลว่า "เรามีความมั่นใจมากขึ้นว่าเขาชอบแน่ๆ" WRMF จึงแยกตัวแปรเป็น p และ c',
        board: { type: 'v3-model-wrmf', activeRow: 0 },
        ops: [
          { label: 'ตัวแปรความชอบ (Preference p)', value: 'p_ui = 1 ถ้าคลิก ≥ 1 ครั้ง · p_ui = 0 ถ้าไม่เคยคลิก', tone: 'plus' },
          { label: 'ตัวแปรความมั่นใจ (Confidence c)', value: 'c_ui = 1 + α · r_ui (เติบโตตามจำนวนครั้ง)', tone: 'minus' },
          { label: 'ค่าพารามิเตอร์ α (แอลฟา)', value: 'α = 3 (ตัวคูณความเชื่อมั่นจากพฤติกรรมซ้ำ)', tone: 'skip' },
          { label: 'ปรัชญาใหม่', value: 'เปลี่ยนมุมมองจากสเกลดาวสู่ระดับความเชื่อมั่น', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · เปรียบเทียบสินค้าที่คลิกซ้ำ vs สินค้าที่ไม่เคยคลิก',
        value: 'คลิก 2 ครั้ง: p = 1, ความมั่นใจสูง c = 1 + 3(2) = 7 · ไม่เคยคลิก: p = 0, ความมั่นใจต่ำ c = 1',
        detail: 'สินค้าที่ผู้ใช้คลิกดู 2 ครั้ง จะได้ p=1 พร้อมความมั่นใจสูง c=7 ส่วนสินค้าที่ยังไม่เคยแตะต้อง ระบบจะไม่ทิ้ง แต่ให้ p=0 พร้อมความมั่นใจต่ำที่สุด c=1 (อาจแค่ยังไม่เคยเห็น)',
        board: { type: 'v3-model-wrmf', activeRow: 1 },
        ops: [
          { label: 'สินค้าที่ 1 (คลิก 2 ครั้ง)', value: 'p₁ = 1 · ความมั่นใจ c₁ = 1 + 3(2) = 7 (แรงมาก)', tone: 'plus' },
          { label: 'สินค้าที่ 2 (ไม่เคยคลิก 0 ครั้ง)', value: 'p₂ = 0 · ความมั่นใจ c₂ = 1 + 3(0) = 1 (แรงอ่อน)', tone: 'minus' },
          { label: 'การฝึกบนทุกช่องของตาราง', value: 'ทุกช่องคือข้อมูลฝึก แต่ช่องว่างมีน้ำหนักเบาหวิว', tone: 'skip' },
          { label: 'ความได้เปรียบ', value: 'มีตัวอย่างลบช่วยคุม ไม่ให้โมเดลทายบวกทุกอย่าง', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · คำนวณเวกเตอร์ผู้ใช้ด้วย Weighted Least Squares',
        value: 'แก้สมการรูปปิด: p = (Σ c·x·q) / (Σ c·q² + λ) = (7×1×1 + 1×0×2) / (7×1² + 1×2² + 1) = 0.5833',
        detail: 'ช่องที่มีการคลิกซ้ำ (c=7) จะมีอิทธิพลต่อการดึงเวกเตอร์มากกว่าช่องว่าง (c=1) ถึง 7 เท่า ทำให้เวกเตอร์ผู้ใช้ถูกดึงเข้าหาของที่เขาชอบอย่างเด็ดขาด',
        board: { type: 'v3-model-wrmf', activeRow: 2 },
        ops: [
          { label: 'พจน์บน (ตัวตั้ง)', value: 'c₁·p₁·q₁ = 7 × 1 × 1 = 7.0 (ของว่างคูณได้ 0)', tone: 'plus' },
          { label: 'พจน์ล่าง (ตัวหาร)', value: '7(1)² + 1(2)² + λ(1) = 7 + 4 + 1 = 12.0', tone: 'minus' },
          { label: 'คำตอบรูปปิดของ p', value: '7.0 / 12.0 = 0.5833 🎯', tone: 'result' },
          { label: 'อิทธิพลของน้ำหนัก', value: 'ของที่ชอบควบคุมทิศทางเวกเตอร์เกือบทั้งหมด', tone: 'skip' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · สรุปจุดเด่นของ WRMF ในระบบแนะนำสมัยใหม่',
        value: 'เสาหลักของวงการ Implicit RecSys · แปลงประวัติการใช้งานนับล้านเป็นคำแนะนำที่แม่นยำ',
        detail: 'WRMF แก้ปัญหาการไม่มีตัวอย่างลบใน Implicit Feedback ได้อย่างสมบูรณ์แบบ เป็นโมเดลที่ Spotify, Netflix และ YouTube นำไปประยุกต์ใช้อย่างกว้างขวาง',
        board: { type: 'v3-model-wrmf', activeRow: 3 },
        ops: [
          { label: 'แก้ปัญหา One-Class Problem', value: 'แปลงช่องว่างเป็นตัวอย่างลบที่มีความมั่นใจต่ำ', tone: 'plus' },
          { label: 'ความยืดหยุ่นของฟังก์ชัน c', value: 'ปรับ α ตามประเภทแอป (ดูจบ, ซื้อซ้ำ, ข้าม)', tone: 'minus' },
          { label: 'ปัญหาคอขวดที่ตามมา', value: 'ต้องคำนวณบนทุกช่อง m × n (มหาศาลพันล้าน!)', tone: 'skip' },
          { label: 'ทางออกก้าวถัดไป', value: 'แก้คอขวดด้วยเทคนิค iALS Trick ในบทถัดไป 🎓', tone: 'result' }
        ]
      }
    ],
    'model-ials': [
      {
        title: 'ขั้นที่ 1 · ปัญหาคอขวดนรกแตก: ตาราง m × n มีขนาดนับล้านล้านช่อง!',
        value: 'ผู้ใช้ 10 ล้านคน × สินค้า 1 ล้านชิ้น = 10,000,000,000,000 ช่อง (10¹³ ช่องว่าง)!',
        detail: 'WRMF บังคับให้คิด Loss บนทุกช่องของตาราง หากใช้คอมพิวเตอร์วนลูปทีละช่อง ต้องใช้เวลาคำนวณนานนับร้อยปี ไม่มีทางฝึกเสร็จในโลกความเป็นจริง',
        board: { type: 'v6-model-ials', mode: 'bottleneck', activeRow: 0 },
        ops: [
          { label: 'ขนาดข้อมูลจริงในโปรดักชัน', value: '10 ล้านคน × 1 ล้านชิ้น = 10¹³ ช่องว่าง 💥', tone: 'skip' },
          { label: 'ความซับซ้อนแบบตรงไปตรงมา', value: 'O(m × n × k²) (ช้าเกินกว่าจะรับไหว)', tone: 'minus' },
          { label: 'ข้อสังเกตสำคัญ', value: 'ช่องว่างกว่า 99.9% มีค่าน้ำหนักความมั่นใจเท่ากันเป๊ะ (c=1)', tone: 'plus' },
          { label: 'คำถามทางคณิตศาสตร์', value: 'เราจะรวมช่องว่างทั้งหมดมาคิดทีเดียวได้หรือไม่?', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · มายากลทางพีชคณิต (The Gram Matrix Shortcut Trick)',
        value: 'แยกสมการ: Qᵀ C_u Q = Qᵀ Q + Qᵀ (C_u − I) Q โดยคำนวณ Qᵀ Q ล่วงหน้าครั้งเดียว!',
        detail: 'ผู้คิดค้น iALS แยกก้อนคำนวณออกเป็น 2 ส่วน: ก้อน QᵀQ เป็นผลรวมสินค้าทั้งระบบ ทำล่วงหน้าครั้งเดียวแจกให้ทุกคนใช้ร่วมกัน ส่วนก้อนหลัง (C_u − I) มีค่าเป็นศูนย์ในช่องว่างทั้งหมด!',
        board: { type: 'v6-model-ials', mode: 'formula', activeRow: 1 },
        ops: [
          { label: 'ก้อนที่ 1: Qᵀ Q (มิติ k × k)', value: 'คำนวณล่วงหน้าครั้งเดียวต่อ 1 รอบการสลับ ⚡', tone: 'plus' },
          { label: 'ก้อนที่ 2: (C_u − I)', value: 'c_ui − 1 = α · r_ui (ช่องว่างกลายเป็น 0 หมด!)', tone: 'minus' },
          { label: 'ความมหัศจรรย์', value: 'พจน์ที่ต้องบวกเพิ่มเหลือเฉพาะชิ้นที่เคยดูจริง!', tone: 'skip' },
          { label: 'หลุดพ้นจากนรกช่องว่าง', value: 'ไม่ต้องเสียเวลาแตะต้องช่องว่างล้านล้านช่องอีกเลย', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · การลดทอนความซับซ้อนจากร้อยปีเหลือไม่กี่นาที',
        value: 'ความซับซ้อนลดจาก O(m × n × k²) ลงเหลือ O(|R| · k² + (m + n) · k³)!',
        detail: 'เวลาในการคำนวณไม่ได้ขึ้นกับจำนวนช่องว่างทั้งหมด (m × n) อีกต่อไป แต่ขึ้นอยู่กับจำนวนการคลิกจริง (|R|) และมิติ k ทำให้สามารถเทรนบนคลัสเตอร์มาตรฐานได้ในไม่กี่นาที',
        board: { type: 'v6-model-ials', mode: 'complexity', activeRow: 2 },
        ops: [
          { label: 'ความเร็วเดิม (ตรงไปตรงมา)', value: 'O(m · n · k²) (รันเป็นร้อยปี)', tone: 'minus' },
          { label: 'ความเร็วใหม่ (iALS Shortcut)', value: 'O(|R| · k² + (m+n)·k³) (ไม่กี่นาที!) 🏆', tone: 'plus' },
          { label: 'อัตราเร่งความเร็ว', value: 'เร็วขึ้นกว่าเดิมหลายพันเท่า', tone: 'result' },
          { label: 'ข้อจำกัดเดียวของ iALS', value: 'ต้องคุม k ≤ 50–100 เพื่อไม่ให้ k³ บานปลาย', tone: 'skip' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · สรุปความสำคัญของ iALS ต่อระบบระดับโลก',
        value: 'เทคนิค iALS คือสาเหตุหลักที่ทำให้ Spotify, Facebook และ Netflix นำไปใช้จริงได้!',
        detail: 'หากไม่มี iALS มายากลนี้ วงการ Recommender Systems คงติดหล่มอยู่กับข้อมูล Explicit เล็กๆ เทคนิคนี้คือจุดเปลี่ยนสำคัญที่เปิดประตูสู่การประมวลผล Implicit Data ในระดับมหาศาล',
        board: { type: 'v6-model-ials', mode: 'summary', activeRow: 3 },
        ops: [
          { label: 'มรดกทางวิศวกรรม', value: 'ทำให้สเกลบนข้อมูล Big Data ระดับโลกได้จริง', tone: 'plus' },
          { label: 'การนำไปใช้จริง', value: 'Spotify Discover Weekly ยุคแรกใช้ iALS เป็นแกนหลัก', tone: 'minus' },
          { label: 'สถาปัตยกรรมขนาน', value: 'กระจายงานบน Spark / GPU ได้อย่างไร้รอยต่อ', tone: 'skip' },
          { label: 'บทสรุปความคุ้มค่า', value: 'เร็ว แม่นยำ และประหยัดค่าเซิร์ฟเวอร์มหาศาล 🎓', tone: 'result' }
        ]
      }
    ],
    'model-bpr': [
      {
        title: 'ขั้นที่ 1 · ปรัชญาใหม่: ผู้ใช้ไม่ได้สนใจคะแนนดาว แต่สนใจ "อะไรดีกว่าอะไร"',
        value: 'เปลี่ยนจากทายคะแนนดาว (Pointwise) มาเป็นการเรียนรู้จัดอันดับคู่ (Pairwise Ranking)',
        detail: 'ผู้ใช้ไม่ได้อยากรู้ว่าหนังเรื่องนี้ได้กี่ดาว ผู้ใช้เพียงแค่อยากให้ของที่เขาชอบ อยู่เหนือกว่าของที่เขาไม่เคยดู BPR (Bayesian Personalized Ranking) จึงออกแบบมาเพื่อจัดอันดับโดยตรง',
        board: { type: 'v4-model-bpr', mode: 'philosophy', activeRow: 0 },
        ops: [
          { label: 'เป้าหมายเดิม (Pointwise MF)', value: 'พยายามทายดาวให้ตรงเป๊ะ r̂ ≈ r (ไม่จำเป็น)', tone: 'minus' },
          { label: 'เป้าหมายใหม่ของ BPR (Pairwise)', value: 'จัดอันดับให้ score(ของชอบ) > score(ของไม่ชอบ)', tone: 'plus' },
          { label: 'เมทริกซ์ที่ Optimize ตรงๆ', value: 'AUC (Area Under the ROC Curve) 🏆', tone: 'result' },
          { label: 'ผลลัพธ์บนหน้าจอ', value: 'สล็อต Top-K มีความแม่นยำสูงกว่าทายดาว', tone: 'skip' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · โครงสร้างข้อมูลแบบ Triplet: (u, i⁺, j⁻)',
        value: 'ผู้ใช้ u · สินค้าบวก i⁺ (เคยคลิก/ชอบ) · สินค้าลบ j⁻ (ยังไม่เคยดู/ของสุ่ม)',
        detail: 'BPR ฝึกสอนด้วยข้อมูลแบบ 3 ตัวแปร (Triplet): สุ่มผู้ใช้ u หยิบสินค้าบวก i⁺ ที่เขาเคยคลิก และสุ่มหยิบสินค้าลบ j⁻ ที่เขายังไม่เคยคลิก มาขึ้นชกเปรียบเทียบคะแนนกัน',
        board: { type: 'v4-model-bpr', mode: 'triplet', activeRow: 1 },
        ops: [
          { label: 'ผู้ใช้ u', value: 'u₁ · 👩 ฟ้า', tone: 'minus' },
          { label: 'สินค้าบวก i⁺ (Positive Item)', value: '🍎 i⁺ (ของที่ฟ้าเคยซื้อ/ชอบ)', tone: 'plus' },
          { label: 'สินค้าลบ j⁻ (Negative Item)', value: '🍌 j⁻ (ของที่ฟ้ายังไม่เคยดูในคลัง)', tone: 'skip' },
          { label: 'กฎเหล็กของคู่ชก', value: 'ต้องทำให้ score(i⁺) ชนะ score(j⁻) เสมอ', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · คำนวณระยะห่างส่วนต่างคะแนน (Preference Margin: x̂_uij)',
        value: 'x̂_uij = (pᵤ · q_i) − (pᵤ · q_j) · ถ้า x̂_uij เป็นบวกมาก แปลว่าโมเดลเรียงลำดับถูกแล้ว!',
        detail: 'วัดผลต่างของความชอบระหว่างคู่ชก: x̂_uij คือคะแนนของสินค้าบวก ลบด้วย คะแนนของสินค้าลบ ยิ่งค่านี้เป็นบวกมากเท่าไหร่ แปลว่าระบบดันของชอบนำหน้าของไม่ชอบได้ขาดลอย',
        board: { type: 'v4-model-bpr', mode: 'margin', activeRow: 2 },
        ops: [
          { label: 'คะแนนสินค้าบวก score(i⁺)', value: 'pᵤ · q_i (ของชอบต้องได้คะแนนสูง)', tone: 'plus' },
          { label: 'คะแนนสินค้าลบ score(j⁻)', value: 'pᵤ · q_j (ของไม่ชอบต้องได้คะแนนต่ำ)', tone: 'minus' },
          { label: 'ระยะห่าง Margin (x̂_uij)', value: 'score(i⁺) − score(j⁻)', tone: 'skip' },
          { label: 'ถ้า x̂ > 0 (โมเดลทายถูก)', value: 'ของชอบชนะของไม่ชอบแล้ว 🎯', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · ผ่านฟังก์ชัน Sigmoid และคำนวณ BPR-Opt Loss',
        value: 'L_BPR = − ln σ(x̂_uij) + λ ‖Θ‖² · ดันโอกาส P(i >_u j) ให้เข้าใกล้ 1.00 เสมอ',
        detail: 'ส่งระยะห่าง x̂ ผ่านฟังก์ชัน Sigmoid σ(x̂) เพื่อแปลงเป็นความน่าจะเป็นที่ของบวกจะชนะของลบ แล้วเทค −ln เพื่อสร้าง Loss Function ที่หาอนุพันธ์ง่ายและเสถียร',
        board: { type: 'v4-model-bpr', mode: 'loss', activeRow: 3 },
        ops: [
          { label: 'ความน่าจะเป็น Sigmoid σ(x̂)', value: '1 / (1 + e^{−x̂}) (โอกาสที่ i ชนะ j)', tone: 'plus' },
          { label: 'สมการ BPR Loss', value: '− ln σ(x̂_uij) (ยิ่งทายถูก Loss ยิ่งเข้าใกล้ 0)', tone: 'minus' },
          { label: 'Regularization พจน์หลัง', value: '+ λ ‖Θ‖² (ควบคุมขนาดเวกเตอร์ p, q_i, q_j)', tone: 'skip' },
          { label: 'ก้าวถัดไป', value: 'ดูการอัปเดตเวกเตอร์แบบ Triplet SGD ในบทถัดไป 🎓', tone: 'result' }
        ]
      }
    ],
    'model-bpr-step': [
      {
        title: 'ขั้นที่ 1 · ตรวจสอบสถานะเมื่อโมเดลเรียงลำดับผิด (Inverted Margin)',
        value: 'score(i⁺) = 0.2 < score(j⁻) = 0.5 → Margin x̂ = 0.2 − 0.5 = −0.3 (ทายผิด ของลบดันแซง!)',
        detail: 'สมมติว่าโมเดลประเมินผิดพลาด: สินค้าบวกได้เพียง 0.2 แต่สินค้าลบดันพุ่งไปถึง 0.5 ทำให้ส่วนต่างติดลบ x̂ = −0.3 สถานการณ์นี้อันตรายมากเพราะระบบจะแนะนำของผิดขึ้นจอ!',
        board: { type: 'v4-model-bpr-step', mode: 'wrong-state', activeRow: 0 },
        ops: [
          { label: 'คะแนนสินค้าบวก i⁺ (ของชอบ)', value: '0.2000 (คะแนนต่ำเกินไป)', tone: 'minus' },
          { label: 'คะแนนสินค้าลบ j⁻ (ของไม่ชอบ)', value: '0.5000 (คะแนนสูงแซงหน้า 💥)', tone: 'skip' },
          { label: 'ส่วนต่าง Margin x̂_uij', value: '0.2 − 0.5 = −0.3000 (ติดลบ = เรียงผิด!)', tone: 'minus' },
          { label: 'Loss ปัจจุบัน', value: '−ln σ(−0.3) = −ln(0.4255) = 0.8543 แต้ม', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · คำนวณสัญญาณความผิดพลาด (Gradient Signal: g = 1 − σ(x̂))',
        value: 'σ(−0.3) ≈ 0.4255 → สัญญาณแรงขับ g = 1 − 0.4255 = 0.5745 (มีแรงผลักสูงถึง 57%)',
        detail: 'สัญญาณความผิดพลาดของ BPR คือ g = 1 − σ(x̂): ยิ่งทายผิดมาก (x̂ ติดลบ) ค่า g จะยิ่งพุ่งเข้าใกล้ 1.0 เพื่อออกแรงเต็มที่ แต่ถ้าทายถูกขาดลอย (x̂ เป็นบวกมาก) g จะกลายเป็น 0 ไม่ต้องปรับ',
        board: { type: 'v4-model-bpr-step', mode: 'gradient-signal', activeRow: 1 },
        ops: [
          { label: 'โอกาสชนะปัจจุบัน σ(x̂)', value: 'σ(−0.3) = 0.4255 (โอกาสชนะแค่ 42.5%)', tone: 'minus' },
          { label: 'สัญญาณแรงปรับ g = 1 − σ(x̂)', value: '1 − 0.4255 = 0.5745 (แรงปรับสูงถึง 57%) 🎯', tone: 'plus' },
          { label: 'ถ้าทายถูกมาก่อน (เช่น x̂ = +5)', value: 'σ ≈ 1.0 → g ≈ 0 (ฉลาดพอที่จะไม่เสียเวลาปรับ)', tone: 'skip' },
          { label: 'คุณสมบัติของ BPR Gradient', value: 'โฟกัสเฉพาะคู่ที่ยังเรียงลำดับผิดพลาด', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · กลไกผลักและดึงเวกเตอร์ (Push-Pull Dynamics)',
        value: 'ผลัก q_i ขึ้นด้วย +g·p · กด q_j ลงด้วย −g·p · หมุน p_u ไปในทิศทาง (q_i − q_j)',
        detail: 'ใน 1 ก้าว Triplet SGD เวกเตอร์ 3 ตัวจะถูกปรับพร้อมกัน: สินค้าบวก q_i ถูกผลักให้คะแนนสูงขึ้น สินค้าลบ q_j ถูกกดให้คะแนนลดลง และเวกเตอร์ผู้ใช้ p_u ถูกหมุนไปหาความแตกต่าง',
        board: { type: 'v4-model-bpr-step', mode: 'push-pull', activeRow: 2 },
        ops: [
          { label: 'เวกเตอร์สินค้าบวก q_i', value: 'q_i ← q_i + η (g · p_u − λ q_i) (ผลักขึ้น!) ⬆️', tone: 'plus' },
          { label: 'เวกเตอร์สินค้าลบ q_j', value: 'q_j ← q_j + η (−g · p_u − λ q_j) (กดลง!) ⬇️', tone: 'minus' },
          { label: 'เวกเตอร์ผู้ใช้ p_u', value: 'p_u ← p_u + η (g · (q_i − q_j) − λ p_u) (หมุนทิศ)', tone: 'skip' },
          { label: 'การทำงานเป็นทีม', value: '3 เวกเตอร์ปรับประสานกันในก้าวเดียว', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · สรุปสถานะหลังก้าวอัปเดต: สลับอันดับกลับมาถูกต้อง',
        value: 'Margin ขยับเป็นบวก x̂_new = +0.08 · Loss ลดลงจาก 0.8543 เหลือ 0.6974 แต้ม 🏆',
        detail: 'หลังผ่านการปรับ 1 สเต็ป คะแนนของสินค้าบวก i⁺ แซงกลับมานำสินค้าลบ j⁻ ได้สำเร็จ ส่งผลให้ค่า Loss ลดลงอย่างมีนัยสำคัญ และค่า AUC ของระบบเพิ่มสูงขึ้น',
        board: { type: 'v4-model-bpr-step', mode: 'summary', activeRow: 3 },
        ops: [
          { label: 'Margin เดิม vs ใหม่', value: 'เดิม −0.3000 → ใหม่ +0.0800 🏆 (สลับชนะแล้ว!)', tone: 'plus' },
          { label: 'Loss ลดลง', value: '0.8543 → 0.6974 แต้ม (โมเดลฉลาดขึ้น)', tone: 'minus' },
          { label: 'ผลลัพธ์ต่อหน้าจอจริง', value: 'ของชอบ 🍎 ได้เลื่อนขึ้นอันดับเหนือกว่า 🍌', tone: 'result' },
          { label: 'บทบาทของ BPR ในยุคปัจจุบัน', value: 'มาตรฐานอันดับ 1 ของ Pairwise Ranking ในโลกจริง 🎓', tone: 'skip' }
        ]
      }
    ],
    'model-ease': [
      {
        title: 'ขั้นที่ 1 · เมทริกซ์การกระทำแบบสองสถานะ (User-Item Matrix X: 4 คน × 2 ชิ้น)',
        value: 'ตาราง X ขนาด 4×2: ผู้ใช้ 4 คนกับสินค้า A, B · บันทึกเฉพาะ 0 กับ 1 (ซื้อหรือไม่ซื้อ)',
        detail: 'EASE (Embarrassingly Shallow Autoencoders) เป็นโมเดลเชิงเส้นตรงที่เรียบง่ายแต่ทรงพลังอย่างไม่น่าเชื่อ โดยรับอินพุตเป็นเมทริกซ์การกระทำแบบ Binary X',
        board: { type: 'v1-model-ease', mode: 'input-x', activeRow: 0 },
        ops: [
          { label: 'เมทริกซ์ปฏิสัมพันธ์ X', value: '4 ผู้ใช้ × 2 สินค้า (A, B)', tone: 'minus' },
          { label: 'ชนิดของข้อมูล', value: 'Binary Interactions (0 / 1)', tone: 'skip' },
          { label: 'สถาปัตยกรรมของ EASE', value: 'Autoencoder ชั้นเดียวแบบเชิงเส้น (ไม่มี Hidden Layer)', tone: 'plus' },
          { label: 'เป้าหมายของโมเดล', value: 'สร้างเมทริกซ์ความสัมพันธ์ B ขนาด 2×2', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · คำนวณ Gram Matrix และ Inverse: P = (XᵀX + λI)⁻¹',
        value: 'G = XᵀX + I = [[4, 1], [1, 3]] → อินเวิร์ส P = [[3/11, −1/11], [−1/11, 4/11]]',
        detail: 'คำนวณความสัมพันธ์ระหว่างสินค้าทั้งหมดในครั้งเดียวผ่าน Gram Matrix แล้วทำการกลับเมทริกซ์ (Matrix Inversion) เพื่อแก้ปัญหาระบบสมการในรอบเดียว',
        board: { type: 'v1-model-ease', mode: 'gram-p', activeRow: 1 },
        ops: [
          { label: 'Gram Matrix G = XᵀX + λI', value: '[[4, 1], [1, 3]] (เมื่อ λ = 1)', tone: 'plus' },
          { label: 'เมทริกซ์อินเวิร์ส P = G⁻¹', value: '[[3/11, −1/11], [−1/11, 4/11]]', tone: 'minus' },
          { label: 'ดีเทอร์มิแนนต์ det(G)', value: '(4 × 3) − (1 × 1) = 12 − 1 = 11', tone: 'skip' },
          { label: 'คำนวณรอบเดียวจบ', value: 'ไม่ต้องวนลูปเทรน ไม่ต้องสุ่มก้าว SGD เลย!', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · กฎเหล็กบังคับเส้นทแยงมุมเป็นศูนย์: B_ij = −P_ij / P_jj (diag(B) = 0)',
        value: 'เมทริกซ์น้ำหนัก B = [[0, 1/4], [1/3, 0]] · ช่องทแยงมุมเป็น 0 ห้ามสินค้าแนะนำตัวเอง!',
        detail: 'ความฉลาดของ EASE อยู่ที่การบังคับ B_jj = 0 บนเส้นทแยงมุมหลัก เพื่อป้องกันไม่ให้โมเดลแนะนำสินค้าชิ้นเดิมที่ผู้ใช้กำลังดูอยู่ (ห้ามตอบว่าชอบ A เพราะเคยซื้อ A!)',
        board: { type: 'v1-model-ease', mode: 'weight-b', activeRow: 2 },
        ops: [
          { label: 'สูตรคำตอบรูปปิด B_ij', value: 'B_ij = −P_ij / P_jj (เมื่อ i ≠ j)', tone: 'minus' },
          { label: 'น้ำหนักจาก A ไป B', value: 'B_12 = −(−1/11) / (4/11) = 1/4 = 0.25', tone: 'plus' },
          { label: 'น้ำหนักจาก B ไป A', value: 'B_21 = −(−1/11) / (3/11) = 1/3 ≈ 0.33', tone: 'skip' },
          { label: 'กฎเหล็ก Zero Diagonal', value: 'B_11 = 0, B_22 = 0 (ห้ามแนะนำตัวเอง!) 🛡️', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · ทำนายคะแนนในพริบตา (Instant Serving: Score = x_u · B)',
        value: 'เมื่อคนเคยซื้อ A: x = [1, 0] → Score = [1, 0] × B = [0, 0.25] → แนะนำ B ทันที 🏆',
        detail: 'ตอนใช้งานจริง เพียงแค่นำเวกเตอร์ประวัติผู้ใช้มาคูณกับเมทริกซ์ B จะได้คะแนนจัดอันดับในเสี้ยววินาที EASE ชนะโมเดล Deep Learning ซับซ้อนหลายตัวในงานวิจัยยุคใหม่',
        board: { type: 'v1-model-ease', mode: 'summary', activeRow: 3 },
        ops: [
          { label: 'ประวัติผู้ใช้ x_u', value: '[1, 0] (เคยซื้อคอร์ส A อย่างเดียว)', tone: 'minus' },
          { label: 'ผลคูณเมทริกซ์ x_u · B', value: '[1, 0] × [[0, 0.25], [0.33, 0]] = [0, 0.25]', tone: 'plus' },
          { label: 'คำแนะนำอันดับ 1', value: 'แนะนำคอร์ส B (คะแนน 0.25) 🏆', tone: 'result' },
          { label: 'ความนิยมของ EASE', value: 'โมเดล Baseline ที่แข็งแกร่งที่สุดตัวหนึ่งในปัจจุบัน 🎓', tone: 'skip' }
        ]
      }
    ],
    'model-sampling': [
      {
        title: 'ขั้นที่ 1 · คัดกรองสินค้าที่มีสิทธิ์เป็นตัวหลอก (Eligible Negative Candidates)',
        value: 'ผู้ใช้เคยมีประวัติบวกกับ {A, B} → สินค้าที่มีสิทธิ์เป็น Negative คู่ซ้อมคือ {C, D, E}',
        detail: 'ในโมเดลแบบ Pairwise เช่น BPR เราต้องสุ่มหยิบสินค้าลบ (Negative) มาเป็นคู่ชก โดยมีกฎเหล็กว่า: ห้ามหยิบสินค้าที่ผู้ใช้เคยคลิกหรือซื้อไปแล้ว (A, B) มาเป็นตัวหลอกเด็ดขาด!',
        board: { type: 'v2-model-sampling', mode: 'eligible', activeRow: 0 },
        ops: [
          { label: 'ประวัติบวกของผู้ใช้ u (Positive)', value: '{A, B} (ของที่ชอบแล้ว ห้ามสุ่มเป็นตัวหลอก!)', tone: 'minus' },
          { label: 'คลังสินค้าที่มีสิทธิ์เป็นตัวหลอก', value: '{C, D, E} (ของที่ผู้ใช้ยังไม่เคยแตะต้อง)', tone: 'plus' },
          { label: 'จำนวนตัวหลอกในระบบจริง', value: 'มีเป็นล้านชิ้น (ต้องสุ่มหยิบมาทีละ 1 ถึงไม่กี่สิบชิ้น)', tone: 'skip' },
          { label: 'เป้าหมายของการสุ่ม', value: 'สร้างคู่ชกฝึกซ้อมที่มีประสิทธิภาพสูงสุด', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · เปรียบเทียบกลยุทธ์การสุ่ม: Uniform vs Popularity-based',
        value: 'Uniform: ทุกชิ้นโอกาสเท่ากัน 1/3 | Popularity (β=0.5): C=1/6 (17%), D=1/3 (33%), E=1/2 (50%)',
        detail: 'สุ่มมั่ว (Uniform) มักได้แต่สินค้าหางยาวที่ไม่ค่อยมีคนรู้จัก ทำให้โจทย์ง่ายเกินไป ส่วนการสุ่มตามความนิยม (Popularity-based) จะหยิบของฮิตมาเป็นคู่ซ้อมบ่อยกว่าเพื่อสร้างโจทย์ที่ท้าทาย',
        board: { type: 'v2-model-sampling', mode: 'compare', activeRow: 1 },
        ops: [
          { label: 'สุ่มเท่ากัน (Uniform Sampling)', value: 'P(C) = 1/3 · P(D) = 1/3 · P(E) = 1/3 (โจทย์ง่าย)', tone: 'minus' },
          { label: 'ความนิยมยกกำลัง β (β = 0.5)', value: 'น้ำหนัก: C=√1=1, D=√4=2, E=√9=3 (รวม=6)', tone: 'plus' },
          { label: 'Popularity-based Sampling', value: 'P(C)=1/6 (17%) · P(D)=2/6 (33%) · P(E)=3/6 (50%) 🎯', tone: 'result' },
          { label: 'ประโยชน์ของการสุ่มของฮิต', value: 'บังคับให้โมเดลเรียนรู้ที่จะเอาชนะของกระแสหลัก', tone: 'skip' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · การเลือกตัวหลอกแบบยาก (Hard Negatives)',
        value: 'Hard Negative: หยิบสินค้าที่โมเดลกำลังทำนายคะแนนสูงผิดปกติ ทั้งที่ผู้ใช้ยังไม่เคยซื้อ!',
        detail: 'Hard Negatives คือคู่ซ้อมตัวฉกาจ: เป็นสินค้าที่โมเดลเกือบจะแนะนำให้ผู้ใช้อยู่แล้ว การหยิบตัวนี้มาลงโทษจะช่วยให้โมเดลปรับขอบเขตการตัดสินใจได้อย่างเฉียบคมและแม่นยำที่สุด',
        board: { type: 'v2-model-sampling', mode: 'hard', activeRow: 2 },
        ops: [
          { label: 'นิยาม Hard Negative', value: 'สินค้าที่โมเดลปัจจุบันให้คะแนนสูง แต่ผู้ใช้ยังไม่แตะ', tone: 'plus' },
          { label: 'เปรียบเหมือนการฝึกซ้อม', value: 'เอาข้อสอบยากๆ ที่โมเดลกำลังสับสนมาให้ฝึกแก้', tone: 'minus' },
          { label: 'ข้อดีของ Hard Negatives', value: 'เกรเดียนต์แรงและโมเดลเรียนรู้ได้รวดเร็วมาก', tone: 'skip' },
          { label: 'ความแม่นยำปลายทาง', value: 'ช่วยให้จัดอันดับ Top-K ขอบเขตเฉียบคมขึ้น 🏆', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · อันตรายระดับวิกฤต: กับดักตัวหลอกปลอม (Hard False Negatives)',
        value: 'ระวัง: ของที่โมเดลให้คะแนนสูง อาจเป็นของดีที่ผู้ใช้กำลังจะชอบในอนาคต ไม่ใช่ของที่เขาเกลียด!',
        detail: 'ข้อควรระวังสำคัญที่สุด: ใน Implicit Data ช่องว่างไม่ได้แปลว่าไม่ชอบ หากหยิบสินค้าที่เป็นของดีในอนาคตมาลงโทษอย่างหนักหน่วง จะกลายเป็นการทำลายความแม่นยำของระบบโดยไม่รู้ตัว',
        board: { type: 'v2-model-sampling', mode: 'summary', activeRow: 3 },
        ops: [
          { label: 'ความจริงของช่องว่าง 0', value: 'ผู้ใช้แค่ยังไม่เห็น อาจเป็นของที่เขาชอบมากก็ได้!', tone: 'skip' },
          { label: 'False Negative Risk', value: 'เผลอเอาของดีมาลงโทษบีบให้คะแนนต่ำลง ⚠️', tone: 'minus' },
          { label: 'วิธีป้องกันในระบบจริง', value: 'ใช้ Dynamic Sampling ผสมของง่ายและของยากอย่างสมดุล', tone: 'plus' },
          { label: 'บทสรุปความคุ้มค่า', value: 'เลือกคู่ซ้อมให้เหมาะกับงานและป้องกันตัวหลอกปลอม 🎓', tone: 'result' }
        ]
      }
    ],
    'hy-oracle': [
      {
        title: 'ขั้นที่ 1 · วัดอันดับโมเดล A และ B ใน 3 กรณีตัวอย่าง',
        value: 'เคส 1: A(1) ชนะ B(3) · เคส 2: B(1) ชนะ A(4) · เคส 3: เสมอกันที่อันดับ 2',
        detail: 'ทดสอบสองโมเดลบนเคสเดียวกัน สังเกตเห็นว่าทั้งคู่มีความเชี่ยวชาญคนละด้าน: โมเดล A ชนะในเคสที่ 1 ขณะที่โมเดล B พลิกชนะในเคสที่ 2',
        board: { type: 'v1-hy-oracle', activeRow: 0 },
        ops: [
          { label: 'กรณีทดสอบ Case 1', value: 'A: อันดับ 1 🏆 vs B: อันดับ 3', tone: 'plus' },
          { label: 'กรณีทดสอบ Case 2', value: 'A: อันดับ 4 vs B: อันดับ 1 🏆', tone: 'minus' },
          { label: 'กรณีทดสอบ Case 3', value: 'A: อันดับ 2 = B: อันดับ 2 (เสมอ)', tone: 'skip' },
          { label: 'ปรากฏการณ์สำคัญ', value: 'Complementary Errors เกื้อหนุนกัน 🎯', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · แปลงอันดับเป็น Reciprocal Rank (RR = 1/r)',
        value: 'A: [1.0000, 0.2500, 0.5000] | B: [0.3333, 1.0000, 0.5000]',
        detail: 'การวัดผลแบบ MRR จะแปลงอันดับ r เป็นส่วนกลับ 1/r ยิ่งอันดับดีค่ายิ่งเข้าใกล้ 1.0 สะท้อนความพึงพอใจของผู้ใช้เมื่อเจอของเร็ว',
        board: { type: 'v1-hy-oracle', activeRow: 1 },
        ops: [
          { label: 'RR ของ Case 1', value: 'A: 1/1 = 1.0000 · B: 1/3 ≈ 0.3333', tone: 'plus' },
          { label: 'RR ของ Case 2', value: 'A: 1/4 = 0.2500 · B: 1/1 = 1.0000', tone: 'minus' },
          { label: 'RR ของ Case 3', value: 'A: 1/2 = 0.5000 · B: 1/2 = 0.5000', tone: 'skip' },
          { label: 'คุณสมบัติของ RR', value: 'อันดับต่ำกว่า 4 คะแนนจะหดหายไวมาก', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · สมมุติโมเดลอุดมคติ Oracle (เลือกตัวที่ดีที่สุดเสมอ)',
        value: 'Oracle แอบดูเฉลย: Case 1 เลือก A(1.0) · Case 2 เลือก B(1.0) · Case 3 เลือกเสมอ(0.5)',
        detail: 'Oracle คือผู้หยั่งรู้ในทฤษฎีที่สมมุติว่ารู้คำตอบจริงล่วงหน้า แล้วหยิบเอาผลลัพธ์จากโมเดลที่ทำนายได้ดีที่สุดในแต่ละเคสมาใช้เสมอ',
        board: { type: 'v1-hy-oracle', activeRow: 2 },
        ops: [
          { label: 'Oracle เลือก Case 1', value: 'เลือก A (1.0000) 🎯', tone: 'plus' },
          { label: 'Oracle เลือก Case 2', value: 'เลือก B (1.0000) 🎯', tone: 'minus' },
          { label: 'Oracle เลือก Case 3', value: 'เลือก 0.5000 (เสมอ)', tone: 'skip' },
          { label: 'ความหมายของ Oracle', value: 'ไม้บรรทัดวัดความเป็นไปได้สูงสุดในทฤษฎี', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · คำนวณ MRR และเพดานขอบบน (Oracle Upper Bound)',
        value: 'MRR A = 0.5833 · MRR B = 0.6111 → Oracle Bound = 0.8333 (+36% ก้าวกระโดด!)',
        detail: 'เฉลี่ยคะแนน RR: โมเดล A เดี่ยวๆ ได้ 0.5833 โมเดล B เดี่ยวๆ ได้ 0.6111 แต่เพดานรวม Oracle พุ่งขึ้นเป็น 0.8333 พิสูจน์ว่าคุ้มค่าที่จะรวมสองระบบ',
        board: { type: 'v1-hy-oracle', activeRow: 3 },
        ops: [
          { label: 'MRR โมเดล A เดี่ยวๆ', value: '(1.0 + 0.25 + 0.5)/3 = 0.5833', tone: 'minus' },
          { label: 'MRR โมเดล B เดี่ยวๆ', value: '(0.333 + 1.0 + 0.5)/3 = 0.6111', tone: 'skip' },
          { label: 'Oracle Upper Bound', value: '(1.0 + 1.0 + 0.5)/3 = 0.8333 🚀', tone: 'plus' },
          { label: 'อัตราการพัฒนาสูงสุด', value: '+36.3% (คุ้มค่ามหาศาลที่จะทำ Hybrid!) 🏆', tone: 'result' }
        ]
      }
    ],
    'hy-scale': [
      {
        title: 'ขั้นที่ 1 · กับดักการบวกคะแนนดิบตรงๆ (Scale Incompatibility)',
        value: 'C2 ชนะหลอกตา: A(0.6) + B(5.0★) = 2.36 แซง C1: A(0.8) + B(4.0★) = 2.08',
        detail: 'คะแนนดาวฝั่ง B มีช่วง [1, 5] ขณะที่เนื้อหาฝั่ง A มีช่วง [0, 1] ทำให้คะแนนดาวมีอิทธิพลครอบงำผลลัพธ์ทั้งหมดแม้เราอยากให้น้ำหนัก A สูงถึง 60%',
        board: { type: 'v4-hy-scale', activeRow: 0 },
        ops: [
          { label: 'คะแนนดิบ C1 Python', value: 'A: 0.80 · B: 4.00★ → รวมดิบ = 2.08', tone: 'minus' },
          { label: 'คะแนนดิบ C2 SQL', value: 'A: 0.60 · B: 5.00★ → รวมดิบ = 2.36 💥', tone: 'skip' },
          { label: 'สาเหตุที่ C2 แซง', value: 'สเกลดาว 1-5 กว้างและกลบสเกล 0-1', tone: 'minus' },
          { label: 'ผลลัพธ์ที่ผิดพลาด', value: 'คะแนนฝั่งเนื้อหา A กลายเป็นศูนย์ไร้ความหมาย', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · หาขอบเขตต่ำสุดและสูงสุดของแต่ละฝั่ง (Min-Max Limits)',
        value: 'โมเดล A: [min=0.20, max=0.80] | โมเดล B: [min=1.00, max=5.00]',
        detail: 'ค้นหาจุดต่ำสุดและสูงสุดของแต่ละโมเดลภายในชุดผู้สมัคร (Candidate Pool) เพื่อเตรียมนำมาเทียบสัดส่วนไม้บรรทัดเดียวกัน',
        board: { type: 'v4-hy-scale', activeRow: 1 },
        ops: [
          { label: 'ขอบเขตโมเดล A (Content)', value: 'min = 0.20 · max = 0.80 (ช่วงกว้าง 0.60)', tone: 'plus' },
          { label: 'ขอบเขตโมเดล B (CF)', value: 'min = 1.00 · max = 5.00 (ช่วงกว้าง 4.00)', tone: 'minus' },
          { label: 'สูตร Min-Max Scaling', value: 's̃ = (s − min) / (max − min)', tone: 'skip' },
          { label: 'เป้าหมายการแปลง', value: 'บีบให้ทั้งสองฝั่งมีช่วง [0.0, 1.0] เท่ากัน', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · ปรับสเกลให้อยู่ในช่วงมาตรฐานเดียวกัน [0, 1]',
        value: 'C1: Ã = 1.000, B̃ = 0.750 | C2: Ã = 0.667, B̃ = 1.000',
        detail: 'C1 ได้คะแนนเนื้อหาสูงสุดจึงปรับเป็น 1.00 และดาว 4 จาก 5 ปรับเป็น 0.75 ส่วน C2 ดาวเต็ม 5 ปรับเป็น 1.00 และเนื้อหา 0.6 ปรับเป็น 0.667',
        board: { type: 'v4-hy-scale', activeRow: 2 },
        ops: [
          { label: 'C1 สเกลใหม่ [0, 1]', value: 'Ã = (0.8−0.2)/0.6 = 1.00 · B̃ = (4−1)/4 = 0.75', tone: 'plus' },
          { label: 'C2 สเกลใหม่ [0, 1]', value: 'Ã = (0.6−0.2)/0.6 = 0.67 · B̃ = (5−1)/4 = 1.00', tone: 'minus' },
          { label: 'C3 สเกลใหม่ [0, 1]', value: 'Ã = (0.4−0.2)/0.6 = 0.33 · B̃ = (1−1)/4 = 0.00', tone: 'skip' },
          { label: 'ความยุติธรรม', value: 'ทั้งสองแหล่งข้อมูลยืนอยู่บนฐานเดียวกันแล้ว 🎯', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · รวมคะแนนหลังปรับสเกล (w_A = 0.6, w_B = 0.4)',
        value: 'C1 = 0.6(1.0) + 0.4(0.75) = 0.9000 > C2 = 0.8020 (พลิกกลับมาถูกต้อง!)',
        detail: 'เมื่อรวมคะแนนหลังสเกล C1 พลิกกลับมาชนะ C2 อย่างขาดลอย สอดคล้องกับเจตนารมณ์ที่ระบบต้องการให้น้ำหนักโมเดลเนื้อหา A สูงถึง 60%',
        board: { type: 'v4-hy-scale', activeRow: 3 },
        ops: [
          { label: 'คะแนนรวม C1 Python', value: '0.6(1.00) + 0.4(0.75) = 0.9000 🥇', tone: 'plus' },
          { label: 'คะแนนรวม C2 SQL', value: '0.6(0.67) + 0.4(1.00) = 0.8020 🥈', tone: 'minus' },
          { label: 'คะแนนรวม C3 UX', value: '0.6(0.33) + 0.4(0.00) = 0.1980 🥉', tone: 'skip' },
          { label: 'การกอบกู้อันดับ', value: 'C1 พลิกชนะ C2 ตามน้ำหนักจริง 100% 🏆', tone: 'result' }
        ]
      }
    ],
    'hy-weighted': [
      {
        title: 'ขั้นที่ 1 · รันโมเดล A และ B ขนานกันอย่างอิสระ',
        value: 'สองสายพานทำงานแยกกัน: C1 ได้ Ã = 1.0000 และ B̃ = 0.7500',
        detail: 'Weighted Hybrid เป็นสถาปัตยกรรมแบบขนาน (Parallel Pipeline) โดยโมเดลเนื้อหา A และโมเดลพฤติกรรม B ผลิตคะแนนของตนเองโดยไม่ต้องรอข้อมูลกัน',
        board: { type: 'v3-hy-weighted', activeRow: 0 },
        ops: [
          { label: 'ฝั่ง A (Content-based)', value: 'C1: 1.00 · C2: 0.67 · C3: 0.33', tone: 'plus' },
          { label: 'ฝั่ง B (Collaborative)', value: 'C1: 0.75 · C2: 1.00 · C3: 0.00', tone: 'minus' },
          { label: 'การทำงานขนาน', value: 'ยิงคำขอหาทั้งสองโมเดลพร้อมกัน (Concurrent)', tone: 'skip' },
          { label: 'สถานะคะแนน', value: 'ผ่านการ Normalization เป็น [0, 1] เรียบร้อย', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · กำหนดค่าน้ำหนักความสำคัญ (w_A = 0.6, w_B = 0.4)',
        value: 'w_A + w_B = 0.60 + 0.40 = 1.0000 (ผลรวมเท่ากับ 1 เสมอ)',
        detail: 'น้ำหนักถ่วงเป็นตัวสะท้อนนโยบายธุรกิจ เช่น หากช่วงนี้เน้นความชอบเฉพาะบุคคลตามเนื้อหา ให้ w_A = 0.6 แต่ถ้าต้องการกระแสสังคม ให้เพิ่ม w_B',
        board: { type: 'v3-hy-weighted', activeRow: 1 },
        ops: [
          { label: 'น้ำหนักฝั่งเนื้อหา w_A', value: '0.60 (ให้ความสำคัญ 60%)', tone: 'plus' },
          { label: 'น้ำหนักฝั่งพฤติกรรม w_B', value: '0.40 (ให้ความสำคัญ 40%)', tone: 'minus' },
          { label: 'กฎผลรวมน้ำหนัก', value: 'Σ w_k = 1.0000 (Convex Combination)', tone: 'skip' },
          { label: 'การปรับเปลี่ยน', value: 'สามารถจูนด้วย A/B Testing ได้อย่างง่ายดาย', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · รวมคะแนนไฮบริดแบบเส้นตรง (Linear Weighted Sum)',
        value: 'C1 = 0.60(1.00) + 0.40(0.75) = 0.60 + 0.30 = 0.9000 แต้ม',
        detail: 'คำนวณคะแนนเดี่ยวสำหรับทุกคอร์ส: C1 ได้ 0.9000, C2 ได้ 0.40 + 0.40 = 0.8000, C3 ได้ 0.20 + 0.00 = 0.2000',
        board: { type: 'v3-hy-weighted', activeRow: 2 },
        ops: [
          { label: 'คะแนนรวม C1 Python', value: '0.6(1.00) + 0.4(0.75) = 0.9000 🎯', tone: 'plus' },
          { label: 'คะแนนรวม C2 SQL', value: '0.6(0.67) + 0.4(1.00) = 0.8000 🎯', tone: 'minus' },
          { label: 'คะแนนรวม C3 UX', value: '0.6(0.33) + 0.4(0.00) = 0.2000', tone: 'skip' },
          { label: 'ความเร็วการคำนวณ', value: 'บวกคูณเสร็จในระดับไมโครวินาที (Microseconds)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · จัดอันดับผู้สมัครและเปรียบเทียบกับ RRF',
        value: 'อันดับสุดท้าย: C1 (0.90) → C2 (0.80) → C3 (0.20)',
        detail: 'C1 ขึ้นสู่อันดับ 1 อย่างมั่นคง หรือหากไม่ต้องการกังวลเรื่องการจูนน้ำหนัก สามารถใช้ Reciprocal Rank Fusion (RRF: 1/(k+r)) รวมตามลำดับแทนได้',
        board: { type: 'v3-hy-weighted', activeRow: 3 },
        ops: [
          { label: 'อันดับ 1 (Top Pick)', value: 'C1 Python (0.9000) 🏆', tone: 'plus' },
          { label: 'อันดับ 2', value: 'C2 SQL (0.8000) 🥈', tone: 'minus' },
          { label: 'อันดับ 3', value: 'C3 UX (0.2000) 🥉', tone: 'skip' },
          { label: 'ทางเลือกรวมด้วย RRF', value: 'Score_RRF = 1/(60+r_A) + 1/(60+r_B) 🎓', tone: 'result' }
        ]
      }
    ],
    'hy-evidence': [
      {
        title: 'ขั้นที่ 1 · สินค้า C4 เป็นคอร์สใหม่แกะกล่อง (Cold Item)',
        value: 'C4 มีข้อมูลเนื้อหา A (A=0.0) แต่ไร้หลักฐานพฤติกรรมใน B (m_B = 0)',
        detail: 'ในระบบจริง สินค้าที่เพิ่งลงใหม่จะไม่มีประวัติการคลิกหรือดาวเลย หากระบบใส่ค่าคะแนนมโน (Default Fallback) เข้าไป จะเกิดอันตรายทันที',
        board: { type: 'v3-hy-evidence', activeRow: 0 },
        ops: [
          { label: 'สถานะ C4 New Python', value: 'คอร์สใหม่แกะกล่อง มี 0 รีวิวในระบบ ⚠️', tone: 'minus' },
          { label: 'หลักฐานฝั่ง A (เนื้อหา)', value: 'มีหลักฐาน m_A = 1 (คำนวณได้ 0.00)', tone: 'plus' },
          { label: 'หลักฐานฝั่ง B (CF)', value: 'ไร้หลักฐาน m_B = 0 (ไม่มีดาวในอดีต)', tone: 'skip' },
          { label: 'ความเสี่ยงวิกฤต', value: 'ระบบจะปฏิบัติกับช่องว่างของ C4 อย่างไร?', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · กับดักของการรวมแบบไม่เช็กหลักฐาน (Naive Fallback)',
        value: 'C4 Naive = 0.6(0.0) + 0.4(0.75) = 0.3000 > C3(0.2000) (ดันของมั่วขึ้นจอ!)',
        detail: 'หากใส่ค่าเฉลี่ยระบบ (Fallback = 4 ดาว หรือ 0.75) ให้ C4 ดื้อๆ คอร์สใหม่ที่ไม่ตรงใจจะถูกคะแนน Fallback ดันขึ้นแซงคอร์ส C3 ที่มีข้อมูลจริง!',
        board: { type: 'v3-hy-evidence', activeRow: 1 },
        ops: [
          { label: 'คะแนนมโน Fallback ของ B', value: 'สมมุติว่าได้ 4★ (สเกลใหม่ = 0.75) 💥', tone: 'minus' },
          { label: 'คะแนน Naive รวมของ C4', value: '0.6(0) + 0.4(0.75) = 0.3000 💥', tone: 'skip' },
          { label: 'เปรียบเทียบกับ C3 จริง', value: 'C3 มีข้อมูลจริงแต่ได้คะแนน 0.2000', tone: 'plus' },
          { label: 'ความเสียหายต่อผู้ใช้', value: 'คอร์สไร้หลักฐานดันแซงของจริง (False Push) ⚠️', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · ทางออกวิศวกรรม: Evidence-Aware Fusion & Renormalization',
        value: 'ตัดน้ำหนักโมเดลที่ไร้หลักฐานออก: ตัวหาร = 0.6(1) + 0.4(0) = 0.60 (ไม่ใช่ 1.0)',
        detail: 'ใช้หน้ากากหลักฐาน m_B = 0 ตัวคูณของโมเดล B จะกลายเป็นศูนย์ และนำน้ำหนักเฉพาะฝั่งที่มีอยู่จริง (w_A = 0.6) มาเป็นตัวหารปรับสัดส่วนใหม่',
        board: { type: 'v3-hy-evidence', activeRow: 2 },
        ops: [
          { label: 'หน้ากากหลักฐาน C4', value: 'm_A = 1 · m_B = 0 (ปิดสวิตช์ฝั่ง B ทันที)', tone: 'plus' },
          { label: 'ตัวคูณน้ำหนักจริง', value: 'w_A·m_A = 0.6 · w_B·m_B = 0.0', tone: 'minus' },
          { label: 'ตัวหารใหม่ (Denominator)', value: '0.6 + 0.0 = 0.60 (ปรับฐานใหม่)', tone: 'skip' },
          { label: 'กลไกการโอนน้ำหนัก', value: 'โอนความเชื่อมั่นไปที่โมเดลเนื้อหา A เต็ม 100% 🛡️', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · ผลการจัดอันดับที่ปลอดภัยและสะท้อนความจริง',
        value: 'C4 Evidence-Aware = 0.6(0)/0.6 = 0.0000 → ร่วงไปอยู่อันดับ 4 ท้ายสุดอย่างถูกต้อง',
        detail: 'เมื่อคำนวณอย่างถูกต้อง C4 ได้ 0.0000 จึงไม่มาแย่งชิงอันดับของ C1(0.90), C2(0.80), C3(0.20) ผู้ใช้ได้รับคำแนะนำที่ซื่อสัตย์และปลอดภัย',
        board: { type: 'v3-hy-evidence', activeRow: 3 },
        ops: [
          { label: 'คะแนนจริง C4 New', value: '0.60(0.0) / 0.60 = 0.0000 (อันดับ 4) 🛡️', tone: 'plus' },
          { label: 'อันดับ 1', value: 'C1 Python (0.9000) 🏆', tone: 'minus' },
          { label: 'อันดับ 2', value: 'C2 SQL (0.8020) 🥈', tone: 'skip' },
          { label: 'อันดับ 3', value: 'C3 UX (0.1980) 🥉 (ไม่ถูกปล้นอันดับแล้ว!)', tone: 'result' }
        ]
      }
    ],
    'hy-switch': [
      {
        title: 'ขั้นที่ 1 · ตรวจสอบเงื่อนไขการสลับ (Support Threshold θ = 2)',
        value: 'ประตูกล: ถ้าคอร์สมีคนชอบในอดีต n_i ≥ 2 ใช้โมเดล B (CF) · ถ้าไม่ถึงสลับใช้ A (Content)',
        detail: 'Switching Hybrid ใช้เงื่อนไข if/else เลือกว่าในสถานการณ์นี้ใครควรเป็นผู้ตอบ เพื่อไม่ต้องรันทุกโมเดลพร้อมกันให้เปลืองทรัพยากร',
        board: { type: 'v6-hy-switch', activeRow: 0 },
        ops: [
          { label: 'เกณฑ์การสลับ (Threshold)', value: 'θ = 2 คน (Train Interactions)', tone: 'plus' },
          { label: 'เงื่อนไขที่ 1 (n_i ≥ 2)', value: 'ข้อมูลพฤติกรรมหนาแน่นพอ → เชื่อโมเดล B (CF)', tone: 'minus' },
          { label: 'เงื่อนไขที่ 2 (n_i < 2)', value: 'ข้อมูลพฤติกรรมเบาบาง → สลับไปใช้โมเดล A', tone: 'skip' },
          { label: 'เป้าหมายสถาปัตยกรรม', value: 'รันเฉพาะโมเดลที่จำเป็น ประหยัด CPU/GPU ⚡', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · สินค้า C1 และ C2 ผ่านเกณฑ์พฤติกรรม (n_i ≥ 2)',
        value: 'C1 (4 คน ≥ 2) → ใช้ B: 0.7500 | C2 (3 คน ≥ 2) → ใช้ B: 1.0000 (นำอันดับ 1)',
        detail: 'ทั้ง C1 และ C2 มีรีวิวในอดีตมากพอ ประตูกลจึงส่งคำขอเข้าโมเดล Collaborative Filtering โดยตรงและข้ามโมเดลเนื้อหาไปเลย',
        board: { type: 'v6-hy-switch', activeRow: 1 },
        ops: [
          { label: 'C1 Python (n=4 คน)', value: 'ผ่านเกณฑ์ (4 ≥ 2) → ใช้โมเดล B (0.7500)', tone: 'plus' },
          { label: 'C2 SQL (n=3 คน)', value: 'ผ่านเกณฑ์ (3 ≥ 2) → ใช้โมเดล B (1.0000 🏆)', tone: 'minus' },
          { label: 'การทำงานของเซิร์ฟเวอร์', value: 'คำนวณเฉพาะฝั่ง B โดยไม่ต้องรันโมเดล A', tone: 'skip' },
          { label: 'ผลลัพธ์ C2', value: 'ขึ้นแท่นอันดับ 1 ตามพฤติกรรมมหาชน', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · สินค้า C3 และ C4 ข้อมูลไม่พอ สลับใช้โมเดลเนื้อหา (Content Fallback)',
        value: 'C3 (1 คน < 2) → ใช้ A: 0.3333 | C4 (0 คน < 2) → ใช้ A: 0.0000 (กู้คอร์สใหม่สำเร็จ)',
        detail: 'C3 มีรีวิวแค่คนเดียว และ C4 เป็นคอร์สใหม่แกะกล่อง ประตูกลจึงสลับไปหยิบคะแนนจากโมเดลเนื้อหา A แทน ทำให้ระบบไม่ใบ้กิน',
        board: { type: 'v6-hy-switch', activeRow: 2 },
        ops: [
          { label: 'C3 UX (n=1 คน)', value: 'ไม่ผ่าน (1 < 2) → สลับใช้โมเดล A (0.3333)', tone: 'plus' },
          { label: 'C4 New Python (n=0 คน)', value: 'ไม่ผ่าน (0 < 2) → สลับใช้โมเดล A (0.0000)', tone: 'minus' },
          { label: 'การกอบกู้ Cold-Start', value: 'คอร์สใหม่ C4 ได้รับการประเมินจากเนื้อหาทันที 🚀', tone: 'skip' },
          { label: 'ความราบรื่นของระบบ', value: 'ผู้ใช้ไม่เห็นหน้าจอขาวหรือ Error ใดๆ', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · สินค้า C5 ไม่พร้อมทั้งสองฝั่ง ส่งต่อ Fallback Baseline',
        value: 'C5 ข้อมูลแหว่งทั้งคู่ → ส่งต่อ Fallback Baseline ปลอดภัย 100%',
        detail: 'Switching Hybrid รองรับกรณีแย่ที่สุดได้อย่างยอดเยี่ยม เมื่อไม่มีโมเดลหลักใดพร้อมใช้งาน ระบบจะสลับไปดึงค่าสถิติความนิยมพื้นฐานมาเสิร์ฟแทน',
        board: { type: 'v6-hy-switch', activeRow: 3 },
        ops: [
          { label: 'กรณี C5 ข้อมูลแหว่ง', value: 'เนื้อหาไม่มี พฤติกรรมไม่มี → สลับหา Fallback', tone: 'minus' },
          { label: 'ผลลัพธ์จัดอันดับรวม', value: 'C2 (1.00) → C1 (0.75) → C3 (0.33) → C4 (0.00) 🏆', tone: 'plus' },
          { label: 'ข้อควรระวังสำคัญ', value: 'เกณฑ์ θ ต้องคำนึงถึงประวัติของผู้ใช้คู่กันด้วย', tone: 'skip' },
          { label: 'จุดเด่นที่สุดของ Switching', value: 'ประหยัดต้นทุนคำนวณสูงสุดในบรรดา Hybrid ⚡', tone: 'result' }
        ]
      }
    ],
    'hy-mixed': [
      {
        title: 'ขั้นที่ 1 · สองโมเดลสร้างลิสต์อันดับของตนเองอย่างอิสระ',
        value: 'Model A: [C1, C2, C3, C4] | Model B: [C2, C1, C3]',
        detail: 'Mixed Hybrid ไม่รวมคะแนนเป็นตัวเลขเดี่ยว แต่รวบรวมผลลัพธ์ระดับอันดับ เพื่อนำมาจัดวางเคียงข้างกันบนหน้าจอ UI',
        board: { type: 'v2-hy-mixed', activeRow: 0 },
        ops: [
          { label: 'ลิสต์จาก Model A (Content)', value: 'อันดับ: C1 → C2 → C3 → C4', tone: 'plus' },
          { label: 'ลิสต์จาก Model B (CF)', value: 'อันดับ: C2 → C1 → C3', tone: 'minus' },
          { label: 'ธรรมชาติของผลลัพธ์', value: 'โมเดล A เน้นเนื้อหาคล้าย · โมเดล B เน้นของฮิต', tone: 'skip' },
          { label: 'จุดเด่นของ Mixed', value: 'ไม่ต้องปวดหัวกับการแปลงสเกลคะแนนให้เท่ากัน', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · Interleaving สลับดึงทีละอันดับขึ้นสล็อตหน้าจอ',
        value: 'รอบที่ 1: ดึงอันดับ 1 ของ A (C1) ลงสล็อต #1 → ดึงอันดับ 1 ของ B (C2) ลงสล็อต #2',
        detail: 'ระบบสลับฟันปลาดึงของดีที่สุดของแต่ละโมเดลมาแสดงผลคู่กัน ทำให้หน้าจอมีทั้งของที่ตรงใจผู้ใช้เฉพาะตัวและของกระแสหลักพร้อมกัน',
        board: { type: 'v2-hy-mixed', activeRow: 1 },
        ops: [
          { label: 'สล็อตหน้าจอ #1', value: 'หยิบ Top-1 ของ A: C1 Python เริ่มต้น 🥇', tone: 'plus' },
          { label: 'สล็อตหน้าจอ #2', value: 'หยิบ Top-1 ของ B: C2 SQL เริ่มต้น 🥈', tone: 'minus' },
          { label: 'เทคนิค Interleaving', value: 'สลับดึง A → B → A → B อย่างเท่าเทียม', tone: 'skip' },
          { label: 'ประสบการณ์ผู้ใช้', value: 'เห็นความหลากหลายตั้งแต่ 2 ชิ้นแรกบนจอ 🎯', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · Deduplication ตรวจจับและตัดรายการที่ซ้ำซ้อนกัน',
        value: 'รอบที่ 2: A ส่ง C2 (ซ้ำ! ข้ามไปเอา C3) | B ส่ง C1 (ซ้ำ! ข้ามไปเอา C4)',
        detail: 'เนื่องจากสินค้าดีมักจะติดอันดับในทั้งสองโมเดล หากไม่ตัดตัวซ้ำ ผู้ใช้จะเห็น C1 หรือ C2 ซ้ำสองครั้งบนหน้าจอ Mixed Hybrid จึงต้องมีระบบ Deduplication',
        board: { type: 'v2-hy-mixed', activeRow: 2 },
        ops: [
          { label: 'ตรวจคิว Model A ถัดไป', value: 'ส่ง C2 → ตรวจพบซ้ำกับสล็อต #2! ข้ามไป C3 🛡️', tone: 'plus' },
          { label: 'ตรวจคิว Model B ถัดไป', value: 'ส่ง C1 → ตรวจพบซ้ำกับสล็อต #1! ข้ามไป C4 🛡️', tone: 'minus' },
          { label: 'สล็อตหน้าจอ #3', value: 'บรรจุ C3 UX เริ่มต้น 🥉', tone: 'skip' },
          { label: 'สล็อตหน้าจอ #4', value: 'บรรจุ C4 Python คอร์สใหม่ 🎯', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · ได้ลิสต์รวมที่หลากหลายและไร้รอยต่อบน UI',
        value: 'ผลลัพธ์หน้าจอสมบูรณ์: [#1 C1, #2 C2, #3 C3, #4 C4]',
        detail: 'ผู้ใช้ได้เห็นคอร์สที่สมบูรณ์แบบ ได้ทั้งความตรงใจและไม่พลาดคอร์สยอดนิยม เป็นวิธีที่ Netflix และ Spotify นิยมใช้ในหน้าแรก',
        board: { type: 'v2-hy-mixed', activeRow: 3 },
        ops: [
          { label: 'ผลลัพธ์สล็อต #1 ถึง #4', value: 'C1 → C2 → C3 → C4 ไร้ตัวซ้ำ 100% 🏆', tone: 'plus' },
          { label: 'ประโยชน์ต่อธุรกิจ', value: 'กระจายโอกาสให้สินค้าทั้งสองกลุ่มได้โชว์ตัว', tone: 'minus' },
          { label: 'ความสะดวกของทีมพัฒนา', value: 'สองทีมอัปเดตโมเดลแยกกันได้ ไม่ต้องเชื่อม API กัน', tone: 'skip' },
          { label: 'มาตรฐานอุตสาหกรรม', value: 'Mixed Hybrid เหมาะมากกับหน้าแรก Multi-Row UI 🎓', tone: 'result' }
        ]
      }
    ],
    'hy-combination': [
      {
        title: 'ขั้นที่ 1 · รวมฟีเจอร์เนื้อหาและพฤติกรรมเป็นเวกเตอร์เดียว (Early Fusion)',
        value: 'x = [x_A ; x_B] = [[Data, Design] ; [v1_like, v2_like]] = [1, 0, 1, 0]',
        detail: 'Feature Combination นำคุณลักษณะจากทุกแหล่งมามัดรวมต่อกันตั้งแต่ต้นทาง (Concatenation) ก่อนส่งให้โมเดลเดียวเรียนรู้ความสัมพันธ์',
        board: { type: 'v6-hy-combination', activeRow: 0 },
        ops: [
          { label: 'ฟีเจอร์เนื้อหา x_A', value: '[1, 0] (หมวด Data, ไม่ใช่ Design)', tone: 'plus' },
          { label: 'ฟีเจอร์พฤติกรรม x_B', value: '[1, 0] (เพื่อน v1 ชอบ, v2 ไม่เคยชอบ)', tone: 'minus' },
          { label: 'เวกเตอร์มัดรวม x', value: '[1, 0, 1, 0] (มิติ 2+2 = 4 ฟีเจอร์)', tone: 'skip' },
          { label: 'ปรัชญา Early Fusion', value: 'ให้โมเดลเห็นความจริงรอบด้านพร้อมกันตั้งแต่แรก', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · กำหนดน้ำหนักโมเดลเชิงเส้น β = [0.6, 0.2, 0.1, 0.3]',
        value: 'β_เนื้อหา = [0.6, 0.2] | β_พฤติกรรม = [0.1, 0.3]',
        detail: 'โมเดลเชิงเส้น (Linear Model) จะเรียนรู้น้ำหนัก β ของแต่ละฟีเจอร์จากข้อมูลการเทรน โดยฟีเจอร์ใดมีความสัมพันธ์กับความชอบสูง จะได้น้ำหนักมาก',
        board: { type: 'v6-hy-combination', activeRow: 1 },
        ops: [
          { label: 'น้ำหนักหมวด Data', value: 'β_1 = 0.60 (น้ำหนักสูงสุด ชอบสายโค้ด)', tone: 'plus' },
          { label: 'น้ำหนักหมวด Design', value: 'β_2 = 0.20', tone: 'minus' },
          { label: 'น้ำหนักเพื่อน v1', value: 'β_3 = 0.10', tone: 'skip' },
          { label: 'น้ำหนักเพื่อน v2', value: 'β_4 = 0.30 (เพื่อนคนนี้รสนิยมแม่น)', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · คำนวณคะแนนทำนาย Score = β · x',
        value: 'C1: 0.6(1) + 0.1(1) = 0.70 | C2: 0.6(1) + 0.1(1) + 0.3(1) = 1.0000 🏆',
        detail: 'C2 ได้คะแนนเต็ม 1.0000 เพราะทั้งเนื้อหาเป็น Data (0.6) และมีเพื่อนทั้งสองคนช่วยโหวต (0.1+0.3) รวมพลังอย่างลงตัว',
        board: { type: 'v6-hy-combination', activeRow: 2 },
        ops: [
          { label: 'คะแนน C1 Python', value: '0.6(1) + 0 + 0.1(1) + 0 = 0.7000 (อันดับ 2)', tone: 'plus' },
          { label: 'คะแนน C2 SQL', value: '0.6(1) + 0 + 0.1(1) + 0.3(1) = 1.0000 (อันดับ 1) 🏆', tone: 'minus' },
          { label: 'คะแนน C3 UX', value: '0 + 0.2(1) + 0 + 0.3(1) = 0.5000 (อันดับ 4)', tone: 'skip' },
          { label: 'คะแนน C4 New Python', value: '0.6(1) + 0 + 0 + 0 = 0.6000 (อันดับ 3) 🚀', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · รองรับสินค้าใหม่ Cold Item ด้วยฟีเจอร์เนื้อหา',
        value: 'C4 ไร้พฤติกรรม [0, 0] แต่ยังได้ 0.60 จากเนื้อหา แซง C3 ขึ้นสู่อันดับ 3!',
        detail: 'นี่คือพลังของ Feature Combination: สินค้าใหม่ C4 ไม่มีประวัติพฤติกรรมเลย แต่โมเดลยังคงทำนายได้ด้วยฟีเจอร์เนื้อหา ไม่บอดสนิท',
        board: { type: 'v6-hy-combination', activeRow: 3 },
        ops: [
          { label: 'พฤติกรรมของ C4', value: 'xB = [0, 0] (ไม่เคยมีใครซื้อ)', tone: 'minus' },
          { label: 'เนื้อหาของ C4', value: 'xA = [1, 0] (เป็นคอร์ส Data เหมือนกัน)', tone: 'plus' },
          { label: 'ผลลัพธ์ C4 แซง C3', value: '0.6000 แซง C3(0.5000) ได้อย่างสมเหตุสมผล 🎯', tone: 'skip' },
          { label: 'ข้อได้เปรียบเหนือ Weighted', value: 'เปิดทางให้โมเดลอย่าง XGBoost/DNN จับ Non-linear ได้ 🏆', tone: 'result' }
        ]
      }
    ],
    'hy-augmentation': [
      {
        title: 'ขั้นที่ 1 · ปัญหาตารางคะแนนว่างเปล่า (Extreme Sparsity > 99%)',
        value: 'ช่องว่าง ? เต็มตาราง ทำให้โมเดล Collaborative Filtering คำนวณความคล้ายไม่ขึ้น',
        detail: 'ในระบบจริง ตารางเรตติ้งมีความว่างเปล่าสูงมาก หากฝืนใช้ CF เพียวๆ เพื่อนบ้านจะแทบไม่มีจุดตัดร่วมกันเลย',
        board: { type: 'v6-hy-augmentation', activeRow: 0 },
        ops: [
          { label: 'สภาพตารางตั้งต้น', value: 'มีดาวจริงไม่ถึง 1% ช่อง ? เต็มตาราง 💥', tone: 'minus' },
          { label: 'ขีดจำกัดของ CF', value: 'คำนวณ Cosine / Pearson ไม่ได้เพราะขาดข้อมูล', tone: 'skip' },
          { label: 'ทางออกของ Burke #4', value: 'ใช้ Feature Augmentation ส่งไม้ต่อ 2 ด่าน', tone: 'plus' },
          { label: 'เป้าหมายด่านแรก', value: 'ให้โมเดลเนื้อหาช่วยสร้างหลักฐานเสริมขึ้นมาก่อน', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · ด่านที่ 1: โมเดลเนื้อหา A ทำหน้าที่เป็น Feature Generator',
        value: 'Model A อ่านเนื้อหาคอร์ส → ทำนายเติมเรตติ้งจำลองลงในช่องว่าง ? ทุกช่อง',
        detail: 'โมเดลเนื้อหา A อาศัยแท็กและข้อความของคอร์สมาทำนายเรตติ้งจำลองลงในช่อง ? ทำให้ตารางที่เคยแหว่งกลายเป็นตารางที่หนาแน่นขึ้น',
        board: { type: 'v6-hy-augmentation', activeRow: 1 },
        ops: [
          { label: 'บทบาทของ Model A', value: 'Feature Generator (ผู้ผลิตฟีเจอร์สังเคราะห์)', tone: 'plus' },
          { label: 'สิ่งที่สร้างขึ้น', value: 'เติมเรตติ้งจำลอง (Pseudo-ratings) ลงช่อง ?', tone: 'minus' },
          { label: 'ตารางหลังเติม', value: 'Dense Rating Matrix พร้อมใช้งาน 100%', tone: 'skip' },
          { label: 'ความแตกต่างจาก Combination', value: 'เป็นสองโมเดลต่ออนุกรมกัน ไม่ใช่มัดรวมแต่แรก', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · ด่านที่ 2: ส่งตารางที่เติมเต็มให้โมเดล Collaborative B คำนวณต่อ',
        value: 'Model B คำนวณเพื่อนบ้าน kNN หรือ Factorization บนตารางเสริมได้อย่างมั่นใจ',
        detail: 'โมเดลพฤติกรรม B รับตารางที่ผ่านการแต่งเติม (Augmented Matrix) ไปหาเพื่อนบ้านและเวกเตอร์แฝงได้อย่างเสถียรและแม่นยำสูงขึ้น',
        board: { type: 'v6-hy-augmentation', activeRow: 2 },
        ops: [
          { label: 'บทบาทของ Model B', value: 'Collaborative Learner (โมเดลหลักปลายทาง)', tone: 'plus' },
          { label: 'สิ่งที่ได้รับมอบ', value: 'ตารางที่มีทั้งดาวจริงและดาวเสริมจากเนื้อหา', tone: 'minus' },
          { label: 'ความแม่นยำเพื่อนบ้าน', value: 'คำนวณความคล้ายเพื่อนบ้านได้ลื่นไหล ไม่เจอ 0/0', tone: 'skip' },
          { label: 'แก้ปัญหา Cold Items', value: 'สินค้าใหม่มีดาวสังเคราะห์หนุนหลังทันที 🚀', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · คุณค่าทางวิศวกรรมของ Feature Augmentation',
        value: 'โมเดลแรกช่วยขยายขีดความสามารถให้โมเดลหลัง ชนะการแข่งขัน RecSys หลายรายการ',
        detail: 'โมเดลหลังไม่ได้เห็นแค่ฟีเจอร์เนื้อหาดิบๆ แต่เห็นการตีความของโมเดลแรกแล้ว นำไปสู่การตัดสินใจที่ลึกซึ้งและทนทานต่อข้อมูลรบกวน',
        board: { type: 'v6-hy-augmentation', activeRow: 3 },
        ops: [
          { label: 'จุดเด่นเชิงสถาปัตยกรรม', value: 'Two-Stage Sequential Pipeline ทรงประสิทธิภาพ', tone: 'plus' },
          { label: 'การลด Sparsity', value: 'ขจัดจุดบอดตารางแหว่งโดยไม่สูญเสียตรรกะพฤติกรรม', tone: 'minus' },
          { label: 'ความนิยมในงานวิจัย', value: 'เป็นฐานรากของระบบอย่าง Content-Boosted CF', tone: 'skip' },
          { label: 'มาตรฐานการออกแบบ', value: 'โมเดลหนึ่งป้อนอาหารให้อีกโมเดล (Augmentation) 🏆', tone: 'result' }
        ]
      }
    ],
    'hy-cascade': [
      {
        title: 'ขั้นที่ 1 · ปัญหาคลังสินค้าขนาดใหญ่ (1,000,000 ชิ้น)',
        value: 'รันโมเดล Deep Learning ละเอียดบนของล้านชิ้นพร้อมกันไม่ทันงบเวลา 50 ms แน่นอน!',
        detail: 'หากใช้โมเดลที่ซับซ้อนและประณีตตั้งแต่ก้าวแรก เซิร์ฟเวอร์จะล่มและผู้ใช้จะรอจนหนีออกจากแอป จึงต้องแบ่งด่านแบบกรวยคัดกรอง',
        board: { type: 'v6-hy-cascade', activeRow: 0 },
        ops: [
          { label: 'ขนาดคลังสินค้า', value: 'N = 1,000,000 ชิ้นในระบบ 📦', tone: 'minus' },
          { label: 'งบประมาณเวลา (SLA)', value: 'ต้องตอบกลับภายใน < 50 มิลลิวินาที ⚡', tone: 'skip' },
          { label: 'ข้อจำกัดของโมเดลลึก', value: 'รันชิ้นละ 5 ms × ล้านชิ้น = ใช้เวลาหลายชั่วโมง 💥', tone: 'minus' },
          { label: 'ทางออกของ Cascade', value: 'ใช้โมเดลหยาบเร็วตัดขยะ ก่อนส่งโมเดลประณีต', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · ด่านที่ 1: โมเดลหยาบเร็ว (Coarse Candidate Retrieval)',
        value: 'Model B (CF หยาบเร็ว / ANN) คัดกรองของล้านชิ้นเหลือ Top-2 {C2, C1} ใน 2 ms ⚡',
        detail: 'ด่านแรกใช้โมเดลที่มีความซับซ้อนต่ำแต่เร็วมาก กวาดคัดผู้สมัครจาก 1,000,000 ชิ้นให้เหลือเพียงกลุ่มผู้เข้ารอบ Top-K แค่ไม่กี่ชิ้น',
        board: { type: 'v6-hy-cascade', activeRow: 1 },
        ops: [
          { label: 'โมเดลด่านที่ 1 (Candidate)', value: 'Model B (CF เร็ว / Approximate Nearest Neighbor)', tone: 'plus' },
          { label: 'เวลาที่ใช้', value: '~2–5 มิลลิวินาทีเท่านั้น ⚡', tone: 'minus' },
          { label: 'จำนวนที่ผ่านเข้ารอบ', value: 'คัดเหลือเพียง 2 ชิ้น: Pool = {C2, C1}', tone: 'skip' },
          { label: 'การลดภาระงาน', value: 'ลดภาระให้ด่านต่อไปลงถึง 99.999% 🎯', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · ด่านที่ 2: โมเดลละเอียดประณีต (Fine Reranker)',
        value: 'Model A (Content ละเอียด) ส่องเฉพาะ {C2, C1}: C1(0.8) แซง C2(0.6) สำเร็จ!',
        detail: 'ด่านที่สองเป็นโมเดลที่มีความแม่นยำสูงมาก (เช่น Cross-Encoder หรือ Deep Ranking) ประมวลผลเฉพาะผู้เข้ารอบ 2 ชิ้นจนได้อันดับที่สมบูรณ์',
        board: { type: 'v6-hy-cascade', activeRow: 2 },
        ops: [
          { label: 'โมเดลด่านที่ 2 (Reranker)', value: 'Model A (Content-based ลึกซึ้ง / LLM Reranker)', tone: 'plus' },
          { label: 'จำนวนที่ต้องส่อง', value: 'เพียง 2 ชิ้น {C2, C1} (รันละเอียดได้เต็มที่)', tone: 'minus' },
          { label: 'คะแนนประณีต', value: 'C1 ได้ 0.80 · C2 ได้ 0.60', tone: 'skip' },
          { label: 'การพลิกอันดับ', value: 'C1 พลิกแซง C2 ขึ้นแท่นอันดับ 1 🥇', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · ชนะเลิศทั้งความเร็วและความแม่นยำ (Best of Both Worlds)',
        value: 'ได้อันดับแม่นยำเท่าโมเดลละเอียด แต่เร็วเท่าโมเดลหยาบ จบในเวลา < 20 ms 🏆',
        detail: 'Cascade Hybrid เป็นสถาปัตยกรรมหัวใจหลักของ Search Engine และ RecSys สมัยใหม่ทุกตัวในโลก (Google, YouTube, TikTok, Shopee)',
        board: { type: 'v6-hy-cascade', activeRow: 3 },
        ops: [
          { label: 'เวลารวมทั้งสายพาน', value: '2 ms (ด่าน 1) + 15 ms (ด่าน 2) = 17 ms ⚡', tone: 'plus' },
          { label: 'ผลลัพธ์สุดท้าย', value: 'แนะนำ C1 Python แก่ 👩 ฟ้า อย่างแม่นยำ 🏆', tone: 'minus' },
          { label: 'ประสิทธิภาพทรัพยากร', value: 'ประหยัด GPU ได้กว่า 99% เมื่อเทียบกับรันเดี่ยว', tone: 'skip' },
          { label: 'กฎเหล็กของ Cascade', value: 'ด่าน 1 ห้ามตัดของดีทิ้งเด็ดขาด (เน้น High Recall) 🎓', tone: 'result' }
        ]
      }
    ],
    'hy-meta': [
      {
        title: 'ขั้นที่ 1 · โมเดลแรก A เรียนรู้และสกัดตัวตนของผู้ใช้ (User Modeling)',
        value: 'Model A สรุปประวัติการเรียนของ 👩 ฟ้า ออกมาเป็น "โมเดลโปรไฟล์ความชอบแฝง"',
        detail: 'ใน Meta-Level Hybrid โมเดลแรกไม่ได้มีหน้าที่ทำนายคะแนนสินค้าเดี่ยวๆ แต่ทำหน้าที่เรียนรู้และสร้างโมเดลตัวแทนผู้ใช้ขึ้นมาทั้งก้อน',
        board: { type: 'v6-hy-meta', activeRow: 0 },
        ops: [
          { label: 'ข้อมูลนำเข้า Model A', value: 'ประวัติเนื้อหาที่ 👩 ฟ้า เคยเรียนทั้งหมด', tone: 'plus' },
          { label: 'กระบวนการสกัด', value: 'วิเคราะห์โครงสร้างความสนใจเชิงลึกข้ามเวลา', tone: 'minus' },
          { label: 'ผลผลิตที่ได้', value: 'User Profile Model (โมเดลตัวตนแฝงของฟ้า)', tone: 'skip' },
          { label: 'ความลึกซึ้ง', value: 'ลึกกว่าแค่การบวกเวกเตอร์ เพราะเป็นโมเดลที่เรียนรู้แล้ว', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · ส่งต่อโมเดลทั้งก้อนให้โมเดลหลัง (Model-as-Input Handover)',
        value: 'ส่ง Model Object ทั้งก้อนให้ Model B (ไม่ใช่แค่ส่งตัวเลขคะแนนแบบ Augmentation)',
        detail: 'ความแตกต่างสำคัญของ Meta-Level คือสิ่งที่ส่งต่อคือตัวโมเดลเอง (Model Representation) ทำให้โมเดลหลังได้รับบริบทที่สมบูรณ์แบบ',
        board: { type: 'v6-hy-meta', activeRow: 1 },
        ops: [
          { label: 'สิ่งที่ส่งต่อ (Handover)', value: 'Whole Model Object (พารามิเตอร์ของโมเดลแรก)', tone: 'plus' },
          { label: 'เปรียบเทียบกับ Augmentation', value: 'Augmentation ส่งแค่ตัวเลขเรตติ้ง · Meta ส่งตัวโมเดล', tone: 'minus' },
          { label: 'ระดับการเชื่อมต่อ', value: 'Meta-Level Interface (การเชื่อมต่อระดับโมเดล)', tone: 'skip' },
          { label: 'ความทนทานต่อข้อมูลแหว่ง', value: 'โมเดลตัวตนมีความเสถียรสูงกว่าคะแนนดิบ 🛡️', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · โมเดลหลัง B ใช้โมเดลตัวตนในการจับคู่เพื่อนบ้าน (Peer Matching)',
        value: 'Model B หาเพื่อนบ้านจาก "ความคล้ายของวิธีคิด" แทนที่จะเทียบแค่การคลิกตรงกัน',
        detail: 'โมเดลพฤติกรรม B สามารถค้นหาเพื่อนบ้านที่มีรูปแบบความสนใจคล้ายกันได้ลึกซึ้งยิ่งขึ้น แม้คนทั้งสองจะไม่เคยเรียนคอร์สเดียวกันเป๊ะๆ ก็ตาม',
        board: { type: 'v6-hy-meta', activeRow: 2 },
        ops: [
          { label: 'การจับคู่เพื่อนบ้าน', value: 'วัดระยะห่างระหว่าง Profile Models', tone: 'plus' },
          { label: 'ข้อได้เปรียบเหนือ CF ปกติ', value: 'จับคู่เจอแม้ไม่เคยซื้อของชิ้นเดียวกันเป๊ะๆ 🤝', tone: 'minus' },
          { label: 'การทะลุฟองสบู่ (Filter Bubble)', value: 'แนะนำสินค้าข้ามหมวดหมู่ได้อย่างเป็นธรรมชาติ', tone: 'skip' },
          { label: 'ความแม่นยำทางจิตวิทยา', value: 'ค้นพบคนที่มีคลื่นความถี่ทางความคิดตรงกัน', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · ผลลัพธ์สุดท้ายระดับ Meta-Level',
        value: 'แนะนำคอร์สที่ทั้งตรงกับตัวตนและได้รับการยอมรับจากเพื่อนกลุ่มรสนิยมเดียวกัน 🏆',
        detail: 'การรวมพลังระดับ Meta-Level ทำให้ระบบหลุดพ้นจากข้อจำกัดของข้อมูลตื้นๆ และมอบคำแนะนำที่เหนือความคาดหมาย (Serendipity) ได้อย่างแม่นยำ',
        board: { type: 'v6-hy-meta', activeRow: 3 },
        ops: [
          { label: 'คุณภาพคำแนะนำ', value: 'ตรงกับตัวตนลึกซึ้งและมีความแปลกใหม่ที่ลงตัว', tone: 'plus' },
          { label: 'การประยุกต์ใช้ในปัจจุบัน', value: 'เป็นรากฐานของโมเดลร่วมสมัยอย่าง Two-Tower & GNN', tone: 'minus' },
          { label: 'สรุปอนุกรมวิธาน Burke', value: 'ครบทั้ง 7 รูปแบบ: Weighted, Switch, Mixed, Comb, Aug, Cas, Meta 🎓', tone: 'skip' },
          { label: 'ความสำเร็จของระบบ', value: 'แนะนำคอร์ส C1 และ C2 ตอบโจทย์ 👩 ฟ้า สูงสุด 🏆', tone: 'result' }
        ]
      }
    ],
    'hy-lightfm': [
      {
        title: 'ขั้นที่ 1 · ประกอบร่างเวกเตอร์ผู้ใช้ u = u_id + u_tags',
        value: 'u = [0.20, 0.10] (ID) + [0.30, 0.10] (Tags Data) = [0.50, 0.20]',
        detail: 'LightFM เป็นโมเดล Hybrid Matrix Factorization ยอดนิยม โดยเวกเตอร์ตัวแทนของผู้ใช้เกิดจากการบวกกันของเวกเตอร์ ID ประจำตัวกับเวกเตอร์ป้ายแท็ก',
        board: { type: 'v3-hy-lightfm', activeRow: 0 },
        ops: [
          { label: 'เวกเตอร์ประจำตัวผู้ใช้ (User ID)', value: '[0.20, 0.10] (รสนิยมเฉพาะตัวของ 👩 ฟ้า)', tone: 'plus' },
          { label: 'เวกเตอร์คุณลักษณะ (User Tags)', value: '[0.30, 0.10] (ความสนใจสาย Data)', tone: 'minus' },
          { label: 'เวกเตอร์รวมร่างของผู้ใช้ u', value: '[0.2+0.3, 0.1+0.1] = [0.50, 0.20] 🎯', tone: 'skip' },
          { label: 'ความยืดหยุ่น', value: 'ถ้าผู้ใช้ใหม่ไม่มี ID ก็ยังใช้ Tags แทนได้', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · สินค้าเก่า Warm Item (C1 Python) ใช้พลังทั้ง ID และ Tags',
        value: 'i_C1 = [0.1, 0.1] (ID) + [0.4, 0.2] (Tags) = [0.50, 0.30] → Score = 0.3100',
        detail: 'สินค้าเก่าที่มีประวัติยาวนานจะดึงพลังของทั้ง ID (พฤติกรรมเฉพาะ) และ Tags (เนื้อหา) มารวมกัน Dot Product กับผู้ใช้ได้คะแนนสูงสุด 0.3100',
        board: { type: 'v3-hy-lightfm', activeRow: 1 },
        ops: [
          { label: 'เวกเตอร์สินค้า C1 (Warm Item)', value: '[0.1, 0.1] + [0.4, 0.2] = [0.50, 0.30]', tone: 'plus' },
          { label: 'สูตรทำนายคะแนน', value: 'Score = u · i = (0.50×0.50) + (0.20×0.30)', tone: 'minus' },
          { label: 'ผลลัพธ์คะแนน C1', value: '0.25 + 0.06 = 0.3100 (อันดับ 1) 🥇', tone: 'skip' },
          { label: 'ประสิทธิภาพบนของเก่า', value: 'แม่นยำเทียบเท่า Matrix Factorization ชั้นนำ', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · สินค้าใหม่ Cold Item (C4 New Python) ID หายไปแต่ Tags ยังอยู่!',
        value: 'i_C4: ไร้ ID [0, 0] → ถอยไปใช้ Tags เวกเตอร์ [0.40, 0.20] ได้อย่างสง่างาม',
        detail: 'เมื่อสินค้า C4 เพิ่งลงขายวันนี้และไม่มี ID เวกเตอร์ LightFM จะไม่แครช แต่ถอยไปใช้เวกเตอร์ป้ายแท็กเนื้อหา (คอร์สโค้ด Data) มาเป็นตัวแทนสินค้าทันที',
        board: { type: 'v3-hy-lightfm', activeRow: 2 },
        ops: [
          { label: 'ID เวกเตอร์ของ C4', value: '[0.00, 0.00] (สินค้าใหม่ ไร้ประวัติในอดีต)', tone: 'minus' },
          { label: 'Tags เวกเตอร์ของ C4', value: '[0.40, 0.20] (แท็กเนื้อหา Python/Data มีอยู่จริง)', tone: 'plus' },
          { label: 'เวกเตอร์รวมร่าง i_C4', value: '[0+0.4, 0+0.2] = [0.40, 0.20] 🚀', tone: 'skip' },
          { label: 'การกอบกู้ Cold-Start', value: 'โมเดลไม่เกิด Error และมีเวกเตอร์พร้อมใช้ทันที', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · คำนวณคะแนนสินค้าใหม่ Score(C4) = 0.2400 แนะนำได้ทันที',
        value: 'u · i_C4 = (0.5×0.4) + (0.2×0.2) = 0.20 + 0.04 = 0.2400 (แก้ Cold-Start สมบูรณ์แบบ)',
        detail: 'ฟ้าได้รับคำแนะนำคอร์สใหม่ C4 ด้วยคะแนน 0.2400 ทันทีในวันแรกที่เปิดตัว LightFM จึงเป็นโมเดลที่เชื่อมโลก CF และ Content ได้อย่างลงตัวที่สุด',
        board: { type: 'v3-hy-lightfm', activeRow: 3 },
        ops: [
          { label: 'ผลคูณดอต u · i_C4', value: '(0.50×0.40) + (0.20×0.20) = 0.2400 🎯', tone: 'plus' },
          { label: 'เปรียบเทียบอันดับ', value: 'C1(0.31) > C4(0.24) > C2 > C3', tone: 'minus' },
          { label: 'ความมหัศจรรย์ของ LightFM', value: 'สมการเดียว รองรับทั้ง Warm Items และ Cold Items', tone: 'skip' },
          { label: 'มาตรฐาน Production', value: 'แก้ปัญหา Cold-Start ได้โดยไม่ต้องสร้างโมเดลแยก 🏆', tone: 'result' }
        ]
      }
    ],
    'hy-graph': [
      {
        title: 'ขั้นที่ 1 · โครงสร้างกราฟสองฝั่ง (Bipartite Graph: Users & Items)',
        value: 'โหนดผู้ใช้ {g1, g2} เชื่อมโยงกับโหนดสินค้า {C1, C3} ด้วยเส้นเชื่อมการเรียนจริง',
        detail: 'ใน Graph RecSys เรามองประวัติการปฏิสัมพันธ์เป็นโครงข่ายกราฟสองฝั่ง โดยมีเส้นเชื่อมระหว่างผู้ใช้ g1 กับคอร์ส C1 และ g2 กับ C1 และ C3',
        board: { type: 'v1-hy-graph', activeRow: 0 },
        ops: [
          { label: 'โหนดผู้ใช้ (Users)', value: 'g1 (ดีกรี 1 เส้น) · g2 (ดีกรี 2 เส้น)', tone: 'plus' },
          { label: 'โหนดสินค้า (Items)', value: 'C1 (ดีกรี 2 เส้น) · C3 (ดีกรี 1 เส้น)', tone: 'minus' },
          { label: 'เส้นเชื่อมที่มีอยู่จริง', value: '3 เส้น: (g1, C1), (g2, C1), (g2, C3)', tone: 'skip' },
          { label: 'เป้าหมายของกราฟ', value: 'ค้นหาว่า g1 ควรจะได้รับการแนะนำคอร์ส C3 หรือไม่?', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · คำนวณน้ำหนักเส้นเชื่อมแบบ Normalized Adjacency (1/√(deg_u · deg_i))',
        value: 'เส้น (g1, C1) = 1/√(1×2) ≈ 0.7071 | เส้น (g2, C1) = 1/√(2×2) = 0.5000',
        detail: 'LightGCN ใช้น้ำหนักแบบสมมาตร โดยนำดีกรี (จำนวนเส้นเชื่อม) ของทั้งสองฝั่งมาคูณกันแล้วถอดสแควร์รูท เพื่อป้องกันไม่ให้โหนดฮิตดูดพลังไปหมด',
        board: { type: 'v1-hy-graph', activeRow: 1 },
        ops: [
          { label: 'น้ำหนักเส้นเชื่อม (g1, C1)', value: '1 / √(1 × 2) = 1/√2 ≈ 0.7071', tone: 'plus' },
          { label: 'น้ำหนักเส้นเชื่อม (g2, C1)', value: '1 / √(2 × 2) = 1/2 = 0.5000', tone: 'minus' },
          { label: 'น้ำหนักเส้นเชื่อม (g2, C3)', value: '1 / √(2 × 1) = 1/√2 ≈ 0.7071', tone: 'skip' },
          { label: 'การลดทอนโหนดฮิต', value: 'โหนดที่มีเส้นเชื่อมเยอะ น้ำหนักต่อเส้นจะถูกหารลง 🛡️', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · การส่งสัญญาณข้าม 2 ช่วง (2-Hop Propagation: g1 → C1 → g2 → C3)',
        value: 'สัญญาณสะสม: (1/√2) × 0.50 × (1/√2) = 0.2500 ส่งตรงถึง C3!',
        detail: 'สัญญาณความชอบของ g1 ส่งผ่าน 1-Hop ไปที่ C1 แล้ว C1 ส่งต่อให้ g2 และ g2 ส่งต่อไปยัง C3 เกิดเป็นการเชื่อมโยงความชอบทางอ้อม',
        board: { type: 'v1-hy-graph', activeRow: 2 },
        ops: [
          { label: 'ช่วงที่ 1 (g1 → C1)', value: 'น้ำหนัก 1/√2 (g1 ชอบคอร์ส C1)', tone: 'plus' },
          { label: 'ช่วงที่ 2 (C1 → g2)', value: 'น้ำหนัก 0.50 (พบเพื่อน g2 ที่เรียนคอร์สเดียวกัน)', tone: 'minus' },
          { label: 'ช่วงที่ 3 (g2 → C3)', value: 'น้ำหนัก 1/√2 (เพื่อน g2 ไปเรียนคอร์ส C3 ต่อ)', tone: 'skip' },
          { label: 'ผลคูณเส้นทางสุทธิ', value: '(1/√2) × 0.5 × (1/√2) = 0.2500 ⚡', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · คุณค่าของ Graph Neural Networks ในระบบแนะนำ',
        value: 'ค้นพบความต้องการแฝงผ่านโครงข่าย แนะนำ C3 ให้ g1 ได้อย่างแม่นยำ 🏆',
        detail: 'LightGCN ตัดการแปลงแบบ Non-linear ที่ซับซ้อนทิ้ง เหลือเพียงการเฉลี่ยสัญญาณตามเส้นเชื่อมบนกราฟ ทำให้เทรนเร็วและแม่นยำระดับ SOTA',
        board: { type: 'v1-hy-graph', activeRow: 3 },
        ops: [
          { label: 'คำแนะนำใหม่แก่ g1', value: 'แนะนำคอร์ส C3 (น้ำหนักส่งต่อ 0.2500) 🏆', tone: 'plus' },
          { label: 'การค้นพบความเชื่อมโยง', value: 'จับคู่เจอผ่านเพื่อนร่วมรุ่น (Collaborative Graph)', tone: 'minus' },
          { label: 'จุดเด่นของ LightGCN', value: 'ตัด Activation & Weight Matrices ทิ้ง ประหยัด GPU ⚡', tone: 'skip' },
          { label: 'มาตรฐานยุคใหม่', value: 'สถาปัตยกรรมกราฟช่วยขยายขอบเขตการแนะนำข้ามสาย 🎓', tone: 'result' }
        ]
      }
    ],
    'hy-tower': [
      {
        title: 'ขั้นที่ 1 · Item Tower: คำนวณและแคชเวกเตอร์สินค้าล่วงหน้า (Offline)',
        value: 'ประมวลผลล่วงหน้า 100%: สกัดเวกเตอร์ C1..C4 เก็บลง Vector DB (ScaNN / Milvus)',
        detail: 'สินค้าไม่ได้เปลี่ยนข้อมูลทุกวินาที เราจึงใช้โมเดล Deep Learning ขนาดใหญ่ประมวลผลภาพ ข้อความ และสถิติของสินค้าไว้ล่วงหน้าแบบออฟไลน์',
        board: { type: 'v6-hy-tower', activeRow: 0 },
        ops: [
          { label: 'หน้าที่ของ Item Tower', value: 'สกัดเวกเตอร์สินค้าล่วงหน้า (Offline Batch)', tone: 'plus' },
          { label: 'เวกเตอร์สินค้าที่แคชไว้', value: 'C1=[0.8,0.6], C2=[0,1], C3=[1,0], C4=[0.5,0.5]', tone: 'minus' },
          { label: 'ที่จัดเก็บเวกเตอร์', value: 'Vector Database / Feature Store พร้อมใช้งาน', tone: 'skip' },
          { label: 'การปลดล็อกเวลา', value: 'ตอนผู้ใช้เปิดแอป ไม่ต้องรันฝั่งสินค้าซ้ำอีกเลย ⚡', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · User Tower: ประมวลผลบริบทสดของผู้ใช้ออนไลน์ (Online Real-time)',
        value: 'ดึงบริบทสดของ 👩 ฟ้า (เวลา, อุปกรณ์, คลิก 5 นาทีล่าสุด) → เวกเตอร์ u = [0.60, 0.80] ใน ~5 ms',
        detail: 'เมื่อฟ้าเปิดแอป หอคอยผู้ใช้ (User Tower) จะสกัดพฤติกรรมล่าสุดแปลงเป็นเวกเตอร์ u = [0.60, 0.80] ในเสี้ยววินาที',
        board: { type: 'v6-hy-tower', activeRow: 1 },
        ops: [
          { label: 'หน้าที่ของ User Tower', value: 'สกัดบริบทสดของผู้ใช้ (Online Serving)', tone: 'plus' },
          { label: 'ข้อมูลสดที่นำมาคิด', value: 'เวลา, สถานที่, อุปกรณ์, ประวัติคลิกไม่กี่นาทีก่อน', tone: 'minus' },
          { label: 'เวกเตอร์ฟ้าที่ได้', value: 'u = [0.60, 0.80] 🎯', tone: 'skip' },
          { label: 'เวลาที่ใช้ในด่านนี้', value: 'เพียง ~5 มิลลิวินาทีเท่านั้น', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · ค้นหาความเร็วสูงด้วย Approximate Nearest Neighbor (ANN Search)',
        value: 'Dot Product: u · v_C1 = 0.6(0.8) + 0.8(0.6) = 0.9600 (นำโด่งอันดับ 1 ใน 2 ms)',
        detail: 'นำเวกเตอร์ฟ้ามายิงค้นหาใน Vector DB ด้วย Dot Product ความเร็วสูง C1 ได้ 0.9600, C2 ได้ 0.8000, C4 ได้ 0.7000, C3 ได้ 0.6000',
        board: { type: 'v6-hy-tower', activeRow: 2 },
        ops: [
          { label: 'คะแนน C1 Python', value: 'u · v_C1 = 0.48 + 0.48 = 0.9600 🥇', tone: 'plus' },
          { label: 'คะแนน C2 SQL', value: 'u · v_C2 = 0 + 0.80 = 0.8000 🥈', tone: 'minus' },
          { label: 'คะแนน C4 New Python', value: 'u · v_C4 = 0.30 + 0.40 = 0.7000 🥉', tone: 'skip' },
          { label: 'เวลาค้นหาคลังล้านชิ้น', value: 'ใช้เวลาเพียง ~2–3 มิลลิวินาทีด้วย ANN ⚡', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · สรุปประสิทธิภาพระดับโลกของ Two-Tower Architecture',
        value: 'คุมงบประมาณเวลาทั้งระบบได้ต่ำกว่า 20 ms (ผ่านเกณฑ์ 50 ms สบายๆ) 🏆',
        detail: 'การแยกสองหอคอยออกจากกันทำให้ระบบสามารถขยายตัว (Scale) รองรับผู้ใช้พร้อมกันเป็นร้อยล้านคนได้ เป็นมาตรฐานของ YouTube & TikTok',
        board: { type: 'v6-hy-tower', activeRow: 3 },
        ops: [
          { label: 'เวลารวมทั้งสิ้น', value: '5 ms (User) + 3 ms (ANN) = 8 ms (< 50 ms SLA) ⚡', tone: 'plus' },
          { label: 'การแยกส่วนอิสระ', value: 'Decoupled Latency ทำให้สเกลได้อย่างไร้ขีดจำกัด', tone: 'minus' },
          { label: 'ความสามารถด้านไฮบริด', value: 'แต่ละหอคอยผสมฟีเจอร์เนื้อหาและพฤติกรรมได้อิสระ', tone: 'skip' },
          { label: 'มาตรฐาน Production', value: 'สถาปัตยกรรม Retrieval ที่สำคัญที่สุดในปัจจุบัน 🏆', tone: 'result' }
        ]
      }
    ],
    'hy-logq': [
      {
        title: 'ขั้นที่ 1 · ปัญหาความลำเอียงของ In-Batch Negatives (Sampling Bias)',
        value: 'สินค้าฮิต C1 (Q = 0.50) ถูกสุ่มมาเป็นตัวหลอกบ่อย จึงโดนลงโทษซ้ำๆ อย่างไม่ยุติธรรม',
        detail: 'ในการเทรนโมเดลสองหอคอย เราประหยัดเวลาด้วยการยืมสินค้าของคนอื่นในมินิแบตช์มาเป็นตัวหลอก ทำให้ของฮิตโผล่มาเป็นตัวหลอกบ่อยเกินจริง',
        board: { type: 'v4-hy-logq', activeRow: 0 },
        ops: [
          { label: 'ความถี่สินค้า C1 (ของฮิต)', value: 'Q_1 = 0.50 (โผล่ในมินิแบตช์ 50% ของเวลา) ⚠️', tone: 'minus' },
          { label: 'ความถี่สินค้า C2 & C3', value: 'Q_2 = 0.25 · Q_3 = 0.25 (โผล่ 25%)', tone: 'plus' },
          { label: 'ปัญหาที่เกิดขึ้น', value: 'ของฮิตโดนบีบกดคะแนนลงตลอดเวลาเพราะเป็นตัวหลอกบ่อย', tone: 'skip' },
          { label: 'ผลกระทบ', value: 'โมเดลเรียนรู้เพี้ยนและแนะนำของฮิตต่ำกว่าความจริง 💥', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · สมการชดเชยค่าความถี่ logQ Correction: l′ = l − ln(Q)',
        value: 'หักลบ Logit ด้วย ln(Q): C1 หัก ln(0.50) = −0.6931 | C2 หัก ln(0.25) = −1.3863',
        detail: 'เนื่องจาก ln(Q) มีค่าติดลบ การนำไปลบออก (l − ln(Q)) จะกลายเป็นการบวกคะแนนชดเชยคืนให้ ยิ่งสินค้าใดพบน้อย (Q ต่ำ) จะได้รับชดเชยเยอะกว่า',
        board: { type: 'v4-hy-logq', activeRow: 1 },
        ops: [
          { label: 'คะแนน Logit ดิบ', value: 'C1 = 2.0 · C2 = 1.0 · C3 = 0.0', tone: 'plus' },
          { label: 'ชดเชย C1 (ของฮิต)', value: '2.0 − ln(0.50) = 2.0 − (−0.693) = 2.6931', tone: 'minus' },
          { label: 'ชดเชย C2 (ของเฉพาะกลุ่ม)', value: '1.0 − ln(0.25) = 1.0 − (−1.386) = 2.3863 📈', tone: 'skip' },
          { label: 'ชดเชย C3 (ของเฉพาะกลุ่ม)', value: '0.0 − ln(0.25) = 0.0 − (−1.386) = 1.3863 📈', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · ผลลัพธ์หลัง Softmax สะท้อนความชอบที่แท้จริง',
        value: 'ความน่าจะเป็นหลังแก้ logQ: C1 = 49.96%, C2 = 36.90%, C3 = 13.14% 🎯',
        detail: 'ก่อนแก้ ของฮิตได้เปรียบเวอร์ถึง 66.52% แต่หลังแก้ logQ อัตราส่วนความน่าจะเป็นปรับเข้าสู่ความเป็นธรรม (C1: 50%, C2: 36.9%, C3: 13.1%)',
        board: { type: 'v4-hy-logq', activeRow: 2 },
        ops: [
          { label: 'Softmax เดิมก่อนแก้', value: 'C1: 66.52% (ลวงตา) · C2: 24.47% · C3: 9.00%', tone: 'minus' },
          { label: 'Softmax หลังแก้ logQ', value: 'C1: 49.96% · C2: 36.90% 🎯 · C3: 13.14%', tone: 'plus' },
          { label: 'ความเป็นธรรมต่อสินค้า', value: 'สินค้าเฉพาะกลุ่ม C2 ได้รับคะแนนสะท้อนความจริง', tone: 'skip' },
          { label: 'การขจัด Sampling Bias', value: 'หักล้างผลกระทบของการสุ่มมินิแบตช์ได้อย่างสมบูรณ์', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · กฎเหล็กระดับวิศวกรรม: ห้ามหัก ln(Q) ตอนให้บริการจริง (Serving)',
        value: 'หัก ln(Q) เฉพาะตอนเทรนเท่านั้น! ตอนเสิร์ฟจริงบน Production ต้องใช้ Dot Product ดิบๆ เสมอ 🛡️',
        detail: 'ข้อผิดพลาดร้ายแรงที่สุดคือเผลอนำ ln(Q) ไปหักตอนเสิร์ฟจริง เพราะตอนเสิร์ฟเราต้องการคะแนนความเข้ากันได้แท้จริง (True Relevance) ไม่ใช่คะแนนชดเชยแบทช์',
        board: { type: 'v4-hy-logq', activeRow: 3 },
        ops: [
          { label: 'ตอนฝึกสอน (Training)', value: 'หัก ln(Q) ออกเพื่อปรับเกรเดียนต์ให้ยุติธรรม', tone: 'plus' },
          { label: 'ตอนให้บริการ (Serving)', value: 'ใช้ Dot Product ดิบๆ: u · v เท่านั้น (ห้ามหัก lnQ!) 🛡️', tone: 'minus' },
          { label: 'กรณีสินค้าใหม่ Q = 0', value: 'กำหนดค่าขั้นต่ำ Q_min (Laplace Smoothing) ป้องกัน ln(0)', tone: 'skip' },
          { label: 'มาตรฐานวิศวกรรม Google', value: 'เทคนิค logQ คือสูตรลับความแม่นยำของ YouTube Two-Tower 🏆', tone: 'result' }
        ]
      }
    ],
    'llm-7step': [
      {
        title: 'ด่านที่ 1–2 · รับคำขอ & ดึงตัวเลือก (Fast Retrieval)',
        value: 'คลังสินค้า 1,000,000 เรื่อง → สแกนด้วย Two-Tower / EASE เหลือ 4 แคนดิเดตจริง (<10 ms)',
        detail: 'โมเดลความเร็วสูงคัดกรองจากของล้านชิ้น เหลือเฉพาะสินค้าที่มีอยู่จริงและมีลิขสิทธิ์ในคลัง [i01, i03, i07, i12] ภายในไม่เกิน 10 มิลลิวินาที',
        board: { type: 'v6-llm-7step', activeRow: 0 },
        ops: [
          { label: 'ขนาดคลังสินค้าทั้งหมด', value: '1,000,000 ชิ้น (Real Catalog) 📚', tone: 'plus' },
          { label: 'โมเดลคัดกรองด่านแรก', value: 'Two-Tower / EASE (< 10 ms) ⚡', tone: 'plus' },
          { label: 'จำนวนผู้เข้ารอบ (Candidates)', value: '4 เรื่อง [i01, i03, i07, i12] 🎯', tone: 'result' },
          { label: 'เกราะป้องกันความปลอดภัย', value: 'LLM จะไม่มีวันเห็นของที่ไม่มีจริงในคลัง 🛡️', tone: 'skip' }
        ]
      },
      {
        title: 'ด่านที่ 3–4 · แปลงแม่แบบ & ป้อน LLM (Structured Listwise Prompting)',
        value: 'แปลง 4 แคนดิเดตเป็น JSON Template → ป้อนเข้า LLM ทำ Reranking ตามบริบทฟ้า (~200 ms)',
        detail: 'LLM ได้รับอนุญาตให้ทำงานเฉพาะในขั้นที่ 4 เท่านั้น! โดยอ่านความต้องการเจาะจงของฟ้า (อยากได้ไซไฟ AI ไม่เอาดราม่า) แล้วชั่งน้ำหนักเปรียบเทียบ',
        board: { type: 'v6-llm-7step', activeRow: 1 },
        ops: [
          { label: 'การจัดรูปแบบข้อความ', value: 'Structured JSON พร้อมฟีเจอร์ย่อ', tone: 'plus' },
          { label: 'จุดที่ LLM เข้ามาทำงาน', value: 'ขั้นที่ 4 ขั้นเดียวเท่านั้น! (ห้ามคุมเองทั้งหมด)', tone: 'result' },
          { label: 'งบเวลาประมวลผล', value: '~150–250 ms (สั้นและควบคุมต้นทุนได้) ⏱️', tone: 'minus' },
          { label: 'การควบคุมผลลัพธ์', value: 'บังคับตอบกลับเฉพาะ JSON Schema 🔒', tone: 'skip' }
        ]
      },
      {
        title: 'ด่านที่ 5–6 · ด่านตรวจ Catalog & ระบบสำรอง (Verification & Fallback)',
        value: 'ตรวจ Token ID ในคลังจริง · ตรวจของที่ดูแล้ว · หากล่าช้าหรือพัง สลับใช้ผล CF ทันที ⚡',
        detail: 'โค้ดโปรแกรมทำหน้าที่เป็นด่านตรวจเข้มงวด: ตรวจสอบสต็อก กรองเรื่องที่ฟ้าเพิ่งดูไป และหาก LLM เกิด Timeout (>300ms) ระบบจะสลับไปใช้ผลลัพธ์จากด่านที่ 2 ทันที',
        board: { type: 'v6-llm-7step', activeRow: 2 },
        ops: [
          { label: 'ตรวจรหัสใน Catalog จริง', value: 'ทุก ID ต้องมีอยู่จริงในสต็อก 100% ✓', tone: 'plus' },
          { label: 'กรองประวัติที่ดูแล้ว', value: 'Deduplication ตัดเรื่องที่ฟ้าดูแล้วทิ้ง ✓', tone: 'plus' },
          { label: 'ระบบสำรองฉุกเฉิน (Fallback)', value: 'ถ้า Timeout > 300ms สลับใช้ CF ทันที ⚡', tone: 'minus' },
          { label: 'ระดับความปลอดภัย', value: 'การันตีระบบไม่แครชและไร้ภาพหลอน 🛡️', tone: 'result' }
        ]
      },
      {
        title: 'ด่านที่ 7 · ส่งผลลัพธ์ขึ้นหน้าจอ UI (Delivery & Grounded Explanations)',
        value: 'ส่ง Top-2 [i12, i01] ขึ้นแสดงผล พร้อมคำอธิบายที่ตรวจสอบความจริงแล้วสู่สายตาฟ้า 🏆',
        detail: 'ผู้ใช้ได้รับคำแนะนำภาพยนตร์ที่ตรงใจอย่างลึกซึ้ง รวดเร็ว ปลอดภัย และมีคำอธิบายภาษาธรรมชาติที่เป็นมิตรโดยไม่กุเรื่อง',
        board: { type: 'v6-llm-7step', activeRow: 3 },
        ops: [
          { label: 'ผลลัพธ์อันดับ 1', value: '🤖 i12 (Ex Machina) - ไซไฟ AI ตรงใจ 100% 🥇', tone: 'result' },
          { label: 'ผลลัพธ์อันดับ 2', value: '🎬 i01 (Interstellar) - ไซไฟอวกาศ 🥈', tone: 'result' },
          { label: 'คำอธิบายประกอบ', value: 'อ้างอิงจาก Metadata ดารานำ/ผู้กำกับจริง', tone: 'plus' },
          { label: 'คุณค่าทางวิศวกรรม', value: 'ฉลาดแบบ LLM แต่มั่นคงปลอดภัยแบบ RecSys 🏆', tone: 'plus' }
        ]
      }
    ],
    'llm-rerank': [
      {
        title: 'ขั้นที่ 1 · อันดับเริ่มต้นจากโมเดลรอบแรก (Initial Stage-1 Ranking)',
        value: 'อันดับเดิมจาก CF/CB: #1 i03 (0.90) → #2 i01 (0.85) → #3 i07 (0.70) → #4 i12 (0.65)',
        detail: 'โมเดลด่านแรกใช้ยอดคลิกและความนิยม ทำให้หนังฮิตดาวเยอะอย่าง i03 นำโด่ง ส่วนหนังใหม่ i12 เสียเปรียบจมอยู่ท้ายตาราง',
        board: { type: 'v2-llm-rerank', activeRow: 0 },
        ops: [
          { label: 'อันดับเดิม #1 (ของฮิตดาวเยอะ)', value: '🎭 i03 Inception (คะแนน 0.90) 🥇', tone: 'plus' },
          { label: 'อันดับเดิม #2', value: '🎬 i01 Interstellar (คะแนน 0.85) 🥈', tone: 'plus' },
          { label: 'อันดับเดิม #4 (หนังใหม่เสียเปรียบ)', value: '🤖 i12 Ex Machina (คะแนน 0.65) 📉', tone: 'minus' },
          { label: 'ข้อจำกัดโมเดลดั้งเดิม', value: 'มองไม่เห็นความต้องการเชิงบริบทที่ซับซ้อน', tone: 'skip' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · รับบริบทภาษาจากฟ้า (Context Injection & Intent Analysis)',
        value: 'คำขอพิเศษของฟ้า: "อยากดูหนังไซไฟลึกซึ้ง เน้นปรัชญาหรือ AI ไม่เอาดราม่าหนัก"',
        detail: 'LLM วิเคราะห์ความต้องการ: พบว่า i12 (AI/ปรัชญา) ตรงเงื่อนไข 100% ขณะที่ i03 มีแท็กดราม่าขัดกับเงื่อนไขปฏิเสธ (Negative Constraint)',
        board: { type: 'v2-llm-rerank', activeRow: 1 },
        ops: [
          { label: 'คำขอพิเศษของผู้ใช้ (ฟ้า)', value: '"ไซไฟปรัชญา หรือ AI · ปฏิเสธดราม่า"', tone: 'plus' },
          { label: 'ผลวิเคราะห์ 🤖 i12', value: 'หมวด AI & ปรัชญา ตรงคำขอ 100% ✨', tone: 'result' },
          { label: 'ผลวิเคราะห์ 🎭 i03', value: 'มีแท็กดราม่าจิตวิทยา ขัดกับเงื่อนไขฟ้า ❌', tone: 'minus' },
          { label: 'ความสามารถของ LLM', value: 'เข้าใจเงื่อนไขปฏิเสธ (Negative Constraint) 💡', tone: 'skip' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · ป้องกัน Position Bias ด้วยการสลับสุ่มลำดับ (Permutation Shuffling)',
        value: 'สลับลำดับส่งเข้า Prompt 2 ชุด (ปกติ vs สลับกลับหัว) แล้วเฉลี่ยคะแนน Borda Count',
        detail: 'LLM มีจุดอ่อนชอบเลือกตัวเลือกที่อยู่บรรทัดแรกของ Prompt (Position Bias) วิศวกรจึงส่ง Prompt ที่สลับลำดับกัน 2 รอบเพื่อหาค่าเฉลี่ยที่แท้จริง',
        board: { type: 'v2-llm-rerank', activeRow: 2 },
        ops: [
          { label: 'ความเสี่ยง Position Bias', value: 'LLM มักดันตัวเลือกหัว/ท้าย Prompt ผิดปกติ ⚠️', tone: 'minus' },
          { label: 'ชุดทดสอบ A (ปกติ)', value: 'ส่งลำดับ [i01, i03, i07, i12] เข้าประเมิน', tone: 'plus' },
          { label: 'ชุดทดสอบ B (สลับกลับหัว)', value: 'ส่งลำดับ [i12, i07, i03, i01] เข้าประเมิน', tone: 'plus' },
          { label: 'ผลการรวมคะแนน (Borda)', value: 'i12 ได้อันดับ 1 ในทั้งสองชุด ยืนยันความแม่นยำ 🎯', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · ประกาศผลอันดับใหม่ (Top-2 Final Reranked)',
        value: 'ผลลัพธ์สุดท้าย: #1 🤖 i12 (ดันขึ้นจาก #4) 🚀 · #2 🎬 i01 · #3 🎭 i03 · #4 🧭 i07',
        detail: 'LLM Reranker ช่วยดันหนังใหม่ที่มีเนื้อหาตรงใจลึกซึ้งขึ้นเป็นอันดับหนึ่ง พร้อมลดอันดับหนังดราม่าลง ตอบโจทย์ความต้องการของผู้ใช้ได้อย่างสมบูรณ์แบบ',
        board: { type: 'v2-llm-rerank', activeRow: 3 },
        ops: [
          { label: 'อันดับ #1 ใหม่ (แชมป์)', value: '🤖 i12 Ex Machina (ก้าวกระโดดจาก #4) 🚀', tone: 'result' },
          { label: 'อันดับ #2 ใหม่', value: '🎬 i01 Interstellar (ไซไฟอวกาศตรงใจ) 🥈', tone: 'result' },
          { label: 'อันดับ #3 (โดนลดชั้น)', value: '🎭 i03 Inception (ตกจาก #1 เพราะดราม่า)', tone: 'minus' },
          { label: 'บทบาทของ LLM Reranker', value: 'แก้ Cold-Start & เข้าใจเจตนาภาษาธรรมชาติ 🏆', tone: 'plus' }
        ]
      }
    ],
    'llm-semanticid': [
      {
        title: 'ขั้นที่ 1 · สินค้ามีรหัส Semantic ID ตามลำดับชั้น (RQ-VAE Tokens)',
        value: 'i01 = <SciFi><Space><Time> · i12 = <SciFi><Space><AI> · i03 = <SciFi><Mind><Dream>',
        detail: 'แทนที่จะใช้รหัสตัวเลขสุ่ม เช่น item_94812 ที่โมเดลภาษาไม่เข้าใจ เราใช้ RQ-VAE บีบอัดคุณลักษณะเป็นโทเคนตามลำดับชั้น ทำให้สินค้าแชร์ความรู้ร่วมกันได้',
        board: { type: 'v8-llm-semanticid', activeRow: 0 },
        ops: [
          { label: 'โทเคนชั้น 1 (หมวดใหญ่)', value: '<SciFi> (ภาพยนตร์แนวไซไฟ)', tone: 'plus' },
          { label: 'โทเคนชั้น 2 (ประเภทย่อย)', value: '<Space> (สำรวจอวกาศ) · <Mind> (จิตวิทยา)', tone: 'plus' },
          { label: 'โทเคนชั้น 3 (เรื่องเฉพาะ)', value: '<AI> (i12) · <Time> (i01) · <Dream> (i03)', tone: 'result' },
          { label: 'การถ่ายทอดความหมาย', value: 'รู้ทันทีว่าเป็นไซไฟอวกาศแม้เป็นหนังใหม่แกะกล่อง 💡', tone: 'skip' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · สร้าง Prefix Tree (Trie) จากคลังสินค้าจริง 100%',
        value: 'สร้างโครงสร้างต้นไม้ Trie เพื่อบังคับ (Constrain) การสร้างโทเคนให้อยู่ในคลังจริงเสมอ',
        detail: 'ในการสร้างโทเคนถัดไป โมเดลจะถูกบังคับให้เลือกเดินได้เฉพาะกิ่งที่มีสินค้าอยู่ในสต็อกเท่านั้น กิ่งรหัสแปลกปลอมนอกคลังจะถูกตัดสิทธิ์ด้วย Logit = −∞',
        board: { type: 'v8-llm-semanticid', activeRow: 1 },
        ops: [
          { label: 'จุดเริ่มต้น (Root)', value: 'รากต้นไม้เตรียมเลือกโทเคนแรก', tone: 'plus' },
          { label: 'กิ่งที่อนุญาตในคลัง', value: '<SciFi> → [<Space>, <Mind>] (มีสินค้าจริง)', tone: 'plus' },
          { label: 'กิ่งผีนอกคลังสินค้า', value: '<Romance> (ไม่มีของ) → ถูกเซ็ต Logit = −∞ 🚫', tone: 'minus' },
          { label: 'หลักประกันความปลอดภัย', value: 'ขจัดปัญหาภาพหลอนสินค้าไม่มีจริง (Zero Hallucination) 🛡️', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · ตัดกิ่ง (Pruning) หนังที่ฟ้าเคยดูแล้วออกจาก Trie',
        value: 'ฟ้าเคยดู i01 (<SciFi><Space><Time>) แล้ว → ตัดกิ่ง <Time> ทิ้งทันที!',
        detail: 'การตัดกิ่งแบบ Dynamic Pruning ทำในระดับ Logit Masking: บล็อกทางเดินไปยัง <Time> ทำให้โมเดลไม่สามารถสร้างโทเคนของเรื่องที่ฟ้าดูแล้วได้',
        board: { type: 'v8-llm-semanticid', activeRow: 2 },
        ops: [
          { label: 'ประวัติการรับชมของฟ้า', value: 'เคยดู 🎬 i01 (Interstellar) แล้ว', tone: 'minus' },
          { label: 'การตัดกิ่ง (Dynamic Pruning)', value: 'ตัดกิ่ง <Time> ทิ้งทันที! (Logit = −∞) ✂️', tone: 'minus' },
          { label: 'ทางเลือกที่เหลือในกิ่ง Space', value: 'เหลือเพียง <AI> (i12) และ <Survival> (i07)', tone: 'plus' },
          { label: 'ประสิทธิภาพการแนะนำ', value: 'กรองของที่เคยดูแล้วตั้งแต่ขั้นตอนสร้างโทเคน 🎯', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · Constrained Generation สร้างผลลัพธ์ i12 สำเร็จ',
        value: 'โมเดลเดินตามกิ่ง: Root → <SciFi> → <Space> → <AI> คลอดรหัสภาพยนตร์ i12 สู่ผู้ใช้ 🏆',
        detail: 'ด้วยกลไก Constrained Decoding โมเดลสร้างคำแนะนำ i12 (Ex Machina) ได้ถูกต้อง 100% โดยการันตีว่ามีสินค้าในคลัง และเป็นของใหม่ที่ฟ้ายังไม่เคยดู',
        board: { type: 'v8-llm-semanticid', activeRow: 3 },
        ops: [
          { label: 'โทเคน 1 ที่สร้างได้', value: '<SciFi> (ผ่านการตรวจสอบกิ่ง Trie)', tone: 'plus' },
          { label: 'โทเคน 2 ที่สร้างได้', value: '<Space> (มุ่งตรงสู่แนวอวกาศ)', tone: 'plus' },
          { label: 'โทเคน 3 ที่สร้างได้', value: '<AI> (รหัสของ i12 Ex Machina) 🤖', tone: 'result' },
          { label: 'สรุปเทคโนโลยี Generative RecSys', value: 'เร็ว แม่นยำ ไร้ภาพหลอน และไม่แนะนำซ้ำ 🏆', tone: 'result' }
        ]
      }
    ],
    'llm-grounded': [
      {
        title: 'ขั้นที่ 1 · ข้อความอธิบายดิบจาก LLM (Raw Natural Language Generation)',
        value: 'LLM สร้างประโยค: "แนะนำ Inception เพราะกำกับโดยโนแลน นำแสดงโดยดิแคพรีโอ และได้รางวัล Best Picture"',
        detail: 'ประโยคที่โมเดลภาษาแต่งขึ้นมาฟังดูลื่นไหล น่าประทับใจมาก (High Plausibility) แต่มีกับดักภาพหลอนซ่อนอยู่ ซึ่งถ้าผู้ใช้รู้จะเสียความไว้วางใจทันที',
        board: { type: 'v8-llm-grounded', activeRow: 0 },
        ops: [
          { label: 'ข้อความภาษาธรรมชาติ', value: 'อ่านลื่นไหล ไพเราะ น่าเชื่อถือมาก 💬', tone: 'plus' },
          { label: 'ข้ออ้างที่ 1 (ผู้กำกับ)', value: 'อ้างว่ากำกับโดย โนแลน', tone: 'plus' },
          { label: 'ข้ออ้างที่ 2 (นักแสดง)', value: 'อ้างว่านำแสดงโดย ลีโอนาร์โด', tone: 'plus' },
          { label: 'ข้ออ้างที่ 3 (รางวัลเกียรติยศ)', value: 'อ้างว่าได้ออสการ์ภาพยนตร์ยอดเยี่ยม ⚠️', tone: 'minus' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · เทียบกับตารางความจริงในฐานข้อมูล (Database Truth Lookup)',
        value: 'Query DB: Director = Nolan (จริง) · Cast = DiCaprio (จริง) · Best Picture = False (เท็จ!)',
        detail: 'ระบบ RecSys-RAG นำข้ออ้างแต่ละข้อมาเทียบกับ Metadata ในฐานข้อมูลของระบบจริง พบว่ารางวัลภาพยนตร์ยอดเยี่ยมไม่เป็นความจริง (ได้เฉพาะสาขาเทคนิค)',
        board: { type: 'v8-llm-grounded', activeRow: 1 },
        ops: [
          { label: 'ความจริงในฐานข้อมูล (DB)', value: 'Director: "Christopher Nolan" (ตรงกัน) ✓', tone: 'plus' },
          { label: 'ความจริงในฐานข้อมูล (DB)', value: 'Lead: "Leonardo DiCaprio" (ตรงกัน) ✓', tone: 'plus' },
          { label: 'ความจริงในฐานข้อมูล (DB)', value: 'Best Picture: False (ไม่ได้รางวัลนี้!) ❌', tone: 'minus' },
          { label: 'บทเรียนระดับวิศวกรรม', value: 'Plausibility ≠ Truth ภาษาเนียนไม่ได้แปลว่าจริง 💡', tone: 'skip' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · ด่านตรวจข้ออ้างอัตโนมัติ (Programmatic Claim Verifier)',
        value: 'ตรวจพบภาพหลอน (Hallucination Detected) → สั่งตัดข้อความเท็จทิ้งทันที!',
        detail: 'โปรแกรมไม่อนุญาตให้ข้อความแต่งเติมเองหลุดออกไปหาผู้ใช้ โค้ด Verifier จะตัดประโยคเรื่องรางวัลทิ้ง หรือแก้ไขให้ตรงกับรางวัลเทคนิคตามฐานข้อมูล',
        board: { type: 'v8-llm-grounded', activeRow: 2 },
        ops: [
          { label: 'ผลการตรวจข้ออ้าง 1 & 2', value: 'ผ่านการรับรองความจริง (Fact-Checked ✓)', tone: 'plus' },
          { label: 'ผลการตรวจข้ออ้าง 3', value: 'ตรวจพบภาพหลอน! (Hallucination Detected) 🚨', tone: 'minus' },
          { label: 'การดำเนินการตัดแต่ง (Sanitize)', value: 'ตัดข้อความออสการ์ Best Picture ทิ้งอัตโนมัติ ✂️', tone: 'skip' },
          { label: 'เกราะป้องกันความน่าเชื่อถือ', value: 'ป้องกันระบบถูกจับโป๊ะเรื่องข้อมูลเท็จ 🛡️', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · อนุมัติคำอธิบายที่ยึดหลักฐาน 100% (Grounded Explanation Approved)',
        value: 'คำอธิบายที่ผ่านการรับรอง: "แนะนำ Inception เพราะกำกับโดย โนแลน และนำแสดงโดย ลีโอนาร์โด ดิแคพรีโอ" 🏆',
        detail: 'ผู้ใช้ได้รับคำอธิบายที่สุภาพ เป็นธรรมชาติ และยึดโยงกับข้อเท็จจริงในฐานข้อมูล 100% สร้างความไว้วางใจสูงสุดต่อระบบแนะนำของแพลตฟอร์ม',
        board: { type: 'v8-llm-grounded', activeRow: 3 },
        ops: [
          { label: 'สถานะข้อความสุดท้าย', value: 'อนุมัติแสดงผล (Grounded Explanation 100% ✓)', tone: 'result' },
          { label: 'ความถูกต้องเทียบฐานข้อมูล', value: 'ถูกต้องตรงตาม Metadata ทุกประเด็น 🛡️', tone: 'plus' },
          { label: 'ความไว้วางใจของผู้ใช้', value: 'ผู้ใช้เชื่อมั่นในระบบแนะนำ ไม่ถูกหลอกลวง', tone: 'plus' },
          { label: 'ชัยชนะของระบบไฮบริด RAG', value: 'รวมพลัง LLM ภาษาลื่นไหล + DB ความจริงแท้ 🏆', tone: 'result' }
        ]
      }
    ],
    'resp-lifecycle': [
      {
        title: 'ขั้นที่ 1 · นิยามปัญหาความเสียหาย (Define Harms & Stakeholders)',
        value: 'ระบุกลุ่มเสียเปรียบ: ผู้ผลิตรายย่อย/ศิลปินอิสระถูกลืม (Zero Exposure 0%)',
        detail: 'เริ่มต้นจากผลกระทบจริงในธุรกิจ: ค้นพบว่าร้านค้ารายย่อยที่มีเรตติ้ง 5 ดาวแทบไม่เคยปรากฏในหน้าแนะนำ ผู้ใช้เห็นแต่แบรนด์เดิมๆ',
        board: { type: 'v6-resp-lifecycle', activeRow: 0 },
        ops: [
          { label: 'กลุ่มที่ได้รับผลกระทบ', value: 'ผู้ผลิตรายย่อย & สินค้า Long-Tail 📉', tone: 'minus' },
          { label: 'ปัญหาที่ตรวจพบ', value: 'ไร้การมองเห็น (Zero Exposure) เสี่ยงปิดกิจการ ⚠️', tone: 'minus' },
          { label: 'ผู้ใช้ที่เสียประโยชน์', value: 'ฟ้า ไม่ได้ค้นพบสินค้าแปลกใหม่คุณภาพดี', tone: 'skip' },
          { label: 'วัตถุประสงค์เชิงระบบ', value: 'กำหนดเป้าหมายความเป็นธรรมในสองฝั่งตลาด 🎯', tone: 'plus' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · แปลงปัญหาเป็นตัวชี้วัดตัวเลข (Measure Metrics & Baselines)',
        value: 'วัดผลเชิงปริมาณ: Provider Gini = 0.82 (เหลื่อมล้ำสูง) · Item Coverage = 42%',
        detail: 'แปลงปัญหาเชิงคุณภาพเป็นตัวเลขคณิตศาสตร์: วัดความเหลื่อมล้ำด้วย Gini Index และวัดสัดส่วนสินค้าที่มีคนเห็นด้วย Coverage พร้อมตั้งเป้าหมายปรับปรุง',
        board: { type: 'v6-resp-lifecycle', activeRow: 1 },
        ops: [
          { label: 'ดัชนีความเหลื่อมล้ำ (Gini)', value: '0.82 (กระจุกตัวที่ค่ายใหญ่สูงมาก) 🚨', tone: 'minus' },
          { label: 'ความครอบคลุม (Coverage)', value: '42% (สินค้าครึ่งคลังถูกฝังลืม) 📉', tone: 'minus' },
          { label: 'ความแม่นยำดั้งเดิม (nDCG)', value: '0.85 (โมเดลเดิมแม่นแต่เอียงข้าง)', tone: 'plus' },
          { label: 'เกณฑ์เป้าหมาย (SLA Target)', value: 'ตั้งเป้าลด Gini < 0.50 และดัน Coverage > 80% 🎯', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · ออกแบบมาตรการแทรกแซงทางเทคนิค (Mitigate via Post-Processing & Exploration)',
        value: 'แทรกแซง: สุ่มสำรวจ Exploration 10% + Fair Reranking จัดโควตาสล็อต Top-3',
        detail: 'เลือกใช้มาตรการทางวิศวกรรมที่ไม่ต้องเทรนโมเดลใหม่ทั้งหมด: สอดแทรกสินค้าคุณภาพดีจากรายย่อยอย่างน้อย 1 รายการในสล็อต Top-3 ของหน้าจอ',
        board: { type: 'v6-resp-lifecycle', activeRow: 2 },
        ops: [
          { label: 'กลไกสำรวจ (Exploration)', value: 'แบ่งทราฟฟิก 10% สุ่มแสดงของใหม่คุณภาพสูง 💡', tone: 'plus' },
          { label: 'โควตาพื้นที่ (Fair Quota)', value: 'การันตีผู้ผลิตรายย่อยอย่างน้อย 1 สล็อตใน Top-3 🛡️', tone: 'plus' },
          { label: 'การแลกเปลี่ยน (Trade-off)', value: 'ยอมสละ nDCG ลงเล็กน้อย (-0.03) เพื่อความยั่งยืน', tone: 'minus' },
          { label: 'ระดับการแทรกแซง', value: 'Post-Processing รวดเร็ว ไม่กระทบเวลาประมวลผล ⚡', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · ตรวจสอบย้อนหลังและกำกับดูแล (Audit, Monitor & Governance)',
        value: 'ผลหลังปรับปรุง: Provider Gini ลดฮวบเหลือ 0.44 📉 · Item Coverage พุ่งแตะ 88% 🚀',
        detail: 'ระบบมีแดชบอร์ดติดตามรายวัน มีบันทึก Audit Trail โปร่งใส และกำหนดผู้รับผิดชอบเชิงนโยบาย ตรวจสอบให้แน่ใจว่าทั้งผู้ใช้และร้านค้ารายย่อยเติบโตไปด้วยกัน',
        board: { type: 'v6-resp-lifecycle', activeRow: 3 },
        ops: [
          { label: 'ดัชนีความเหลื่อมล้ำใหม่', value: 'Gini = 0.44 (ลดลงเกือบเท่าตัว ยุติธรรมขึ้น) 🏆', tone: 'result' },
          { label: 'ความครอบคลุมใหม่', value: 'Coverage = 88% (ของในคลังได้แจ้งเกิด) 🚀', tone: 'result' },
          { label: 'สุขภาพระบบระยะยาว', value: 'ผู้ใช้ไม่เบื่อหนี แอปมีสินค้าหลากหลายยั่งยืน 🌟', tone: 'plus' },
          { label: 'วงจรความรับผิดชอบ', value: 'วนกลับไปตรวจสอบรอบใหม่ทุกไตรมาส (Continuous Audit) 🔄', tone: 'skip' }
        ]
      }
    ],
    'resp-feedback': [
      {
        title: 'รอบที่ 1 · ของดังได้พื้นที่หน้าแรก (Initial Disproportionate Exposure)',
        value: 'สัดส่วนการมองเห็น: ค่ายใหญ่ A & B ยึดพื้นที่ 80% · ค่ายอิสระ E ได้เพียง 5%',
        detail: 'ระบบแนะนำเวอร์ชันแรกพยายามลดความเสี่ยง จึงเน้นแนะนำหนังกระแสหลัก ทำให้ผู้ใช้ไม่มีโอกาสเห็นหนังอินดี้ชั้นยอด',
        board: { type: 'v7-resp-feedback', activeRow: 0 },
        ops: [
          { label: 'สัดส่วนหน้าจอค่ายใหญ่ A & B', value: '80% ของพื้นที่แสดงผลทั้งหมด 📺', tone: 'minus' },
          { label: 'สัดส่วนค่ายอิสระ E & F', value: '5% เท่านั้น (คนแทบมองไม่เห็น) 📉', tone: 'minus' },
          { label: 'พฤติกรรมผู้ใช้', value: 'ผู้ใช้คลิกสิ่งที่เห็นตรงหน้า (Exposure Bias) 🖱️', tone: 'skip' },
          { label: 'จุดเริ่มต้นวงจร', value: 'ข้อมูลการคลิกเริ่มเทเอียงเข้าหาของดัง ⚠️', tone: 'minus' }
        ]
      },
      {
        title: 'รอบที่ 2 · ข้อมูล Log บิดเบี้ยวเข้าสู่โมเดล (Biased Training Log Ingestion)',
        value: 'บันทึก Log การคลิก: ยอดคลิก 90% กลายเป็นของดังเดิมๆ',
        detail: 'เมื่อวิศวกรนำ Log การคลิกไปเทรนโมเดลรอบถัดไป โมเดลจะเข้าใจผิดว่า "ของดังคือสิ่งที่ทุกคนรักที่สุด" โดยไม่รู้ว่าเกิดจากหน้าจอมีแต่ของดัง',
        board: { type: 'v7-resp-feedback', activeRow: 1 },
        ops: [
          { label: 'สัดส่วน Log การคลิก', value: '90% เป็นการคลิกของดังเดิม 📈', tone: 'minus' },
          { label: 'การตีความของโมเดล', value: 'โมเดลเข้าใจผิดว่าคนไม่ชอบของอินดี้ ❌', tone: 'minus' },
          { label: 'การขาดหลักฐาน (Counterfactual)', value: 'ระบบไม่รู้ว่าถ้าโชว์ของอินดี้ คนจะชอบไหม ❓', tone: 'skip' },
          { label: 'ผลลัพธ์การฝึกสอน', value: 'ค่าน้ำหนักความนิยม (Popularity Bias) ฝังลึกในโมเดล', tone: 'minus' }
        ]
      },
      {
        title: 'รอบที่ 3 · วงจรป้อนกลับทวีความรุนแรง (Reinforced Matthew Effect)',
        value: 'ระบบเทพื้นที่ 98% ให้ของดังผูกขาดจอ · สินค้าส่วนหางถูกฝังลืมเหลือ 0% (Zero Exposure)',
        detail: 'ปรากฏการณ์ "คนรวยยิ่งรวย" ทวีความรุนแรง ค่ายใหญ่ยึดครองจอเบ็ดเสร็จ ผู้ผลิตรายย่อยถูกตัดขาดจากสายตาผู้ใช้โดยสิ้นเชิง',
        board: { type: 'v7-resp-feedback', activeRow: 2 },
        ops: [
          { label: 'พื้นที่หน้าจอค่ายใหญ่', value: 'พุ่งแตะ 98% (ผูกขาดจอสมบูรณ์แบบ) 🚨', tone: 'minus' },
          { label: 'พื้นที่หน้าจอค่ายอิสระ', value: 'ลดเหลือ 0% (Zero Exposure ถูกฝังลืม) 💀', tone: 'minus' },
          { label: 'ปรากฏการณ์ Matthew Effect', value: '"คนดังยิ่งดัง ของดีส่วนหางไร้ที่ยืน" 🌪️', tone: 'minus' },
          { label: 'ความเสียหายต่อคลัง', value: 'สินค้าในสต็อก 90% กลายเป็นต้นทุนจมสูญเปล่า 💸', tone: 'skip' }
        ]
      },
      {
        title: 'รอบที่ 4 · ผลลัพธ์: ผู้ใช้เบื่อหน่ายและหนีออกจากแอป (Repetitive Fatigue Crisis)',
        value: 'วิกฤตความเบื่อซ้ำซาก: ผู้ใช้บ่น "เปิดแอปมากี่ทีก็เจอแต่เรื่องเดิม" ยอดใช้งานดิ่งลง 40%',
        detail: 'การผูกขาดทำลายความหลากหลาย ผู้ใช้เบื่อหน่ายจนหนีไปแพลตฟอร์มอื่น ทางรอดเดียวคือการสอดแทรกกลไก Exploration และ Fair Quotas ทำลายวงจรอุบาทว์!',
        board: { type: 'v7-resp-feedback', activeRow: 3 },
        ops: [
          { label: 'ปัญหาความเบื่อซ้ำซาก', value: 'Repetitive Fatigue ผู้ใช้รู้สึกจำเจ 🥱', tone: 'minus' },
          { label: 'อัตราการละทิ้งแอป (Churn Rate)', value: 'พุ่งขึ้น 40% เพราะขาดความแปลกใหม่ 📉', tone: 'minus' },
          { label: 'ทางออกเชิงวิศวกรรม', value: 'ใส่กลไก Exploration 10% ทุบวงจรอุบาทว์ทิ้ง 🔨', tone: 'plus' },
          { label: 'เป้าหมายการฟื้นฟู', value: 'คืนความหลากหลายและความมีชีวิตชีวาแก่ระบบ 🏆', tone: 'result' }
        ]
      }
    ],
    'resp-rerank': [
      {
        title: 'ขั้นที่ 1 · ผลลัพธ์ดิบจากโมเดลทำนายคะแนน (Raw Score Greedy Selection)',
        value: 'Top-3 หน้าจอเดิม: #1 แบรนด์ A (0.95) → #2 แบรนด์ B (0.92) → #3 แบรนด์ C (0.89)',
        detail: 'โมเดลทำนายคะแนนดิบเลือกเฉพาะเจ้าใหญ่ที่ได้คะแนนสูงสุด 3 อันดับแรก ทำให้หน้าจอถูกผูกขาดโดยแบรนด์ใหญ่ 100% ไร้ผู้ผลิตรายย่อย',
        board: { type: 'v2-resp-rerank', activeRow: 0 },
        ops: [
          { label: 'สล็อต #1', value: '🎬 แบรนด์ใหญ่ A (คะแนน 0.95) 🥇', tone: 'plus' },
          { label: 'สล็อต #2', value: '🍿 แบรนด์ใหญ่ B (คะแนน 0.92) 🥈', tone: 'plus' },
          { label: 'สล็อต #3', value: '🎥 แบรนด์ใหญ่ C (คะแนน 0.89) 🥉', tone: 'plus' },
          { label: 'สัดส่วนผู้ผลิตรายย่อย', value: '0% (ค่ายอิสระ E คะแนน 0.87 ตกขอบจอ) 📉', tone: 'minus' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · กำหนดโควตาความเป็นธรรม (Setting Fair Quota Constraints)',
        value: 'กฎทางธุรกิจ: ต้องมีผู้ผลิตรายย่อยคุณภาพดี (รีวิว 5★) อย่างน้อย 1 รายการใน Top-3',
        detail: 'ทีมงานกำหนดเกณฑ์ความรับผิดชอบ (Fair Quota Policy) เพื่อเปิดโอกาสให้ผู้ผลิตรายเล็กที่มีคะแนนคุณภาพสูงสูสีกัน ไม่ถูกความนิยมกลบมิด',
        board: { type: 'v2-resp-rerank', activeRow: 1 },
        ops: [
          { label: 'นโยบายความเป็นธรรม (Policy)', value: 'โควตาผู้ผลิตรายย่อยอย่างน้อย 1 ที่ใน Top-3 🛡️', tone: 'plus' },
          { label: 'การค้นหาแคนดิเดตรายย่อย', value: 'ค้นพบ 🎸 ค่ายอิสระ E (รีวิว 5 ดาว คะแนน 0.87) ✨', tone: 'plus' },
          { label: 'ช่องว่างคะแนน (Score Gap)', value: 'คะแนนต่างจากแบรนด์ C เพียง 0.02 (สูสีมาก) 🤏', tone: 'skip' },
          { label: 'ความคุ้มค่าทางธุรกิจ', value: 'ยอมลดคะแนนดิบ 2% เพื่อความยั่งยืนของตลาด 🎯', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · จัดอันดับใหม่ด้วย Fair Reranker / MMR (Fairness-Utility Optimization)',
        value: 'คำนวณฟังก์ชันเป้าหมายร่วม: ดันค่ายอิสระ E เบียดแซงแบรนด์ C เข้าสู่สล็อต #3',
        detail: 'สูตรจัดอันดับใหม่คำนวณ: Score_fair = Score_relevance + λ · Diversity_bonus ส่งผลให้ค่ายอิสระ E ได้คะแนนรวมแซงแบรนด์ C ที่ซ้ำซ้อน',
        board: { type: 'v2-resp-rerank', activeRow: 2 },
        ops: [
          { label: 'แบรนด์ใหญ่ C (สล็อต #3 เดิม)', value: 'คะแนน 0.89 + โบนัสความหลากหลาย 0.00 = 0.8900', tone: 'minus' },
          { label: 'ค่ายอิสระ E (ผู้ท้าชิง)', value: 'คะแนน 0.87 + โบนัสความเป็นธรรม 0.05 = 0.9200 📈', tone: 'plus' },
          { label: 'การสลับตำแหน่ง', value: 'ดึงค่ายอิสระ E เข้าเสียบแทนแบรนด์ใหญ่ C 🔄', tone: 'result' },
          { label: 'กลไกทำงาน', value: 'ปรับแต่งเฉพาะ Top-K หน้างานในเวลา < 3 ms ⚡', tone: 'skip' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · หน้าจอที่สมดุลสองฝั่งตลาด (Two-Sided Balanced Screen Approved)',
        value: 'ผลลัพธ์สุดท้าย: #1 แบรนด์ A · #2 แบรนด์ B · #3 ค่ายอิสระ E (สองฝั่งได้ประโยชน์ร่วมกัน 🏆)',
        detail: 'ผู้ใช้ยังได้ดูของดีตรงใจระดับ 0.87–0.95 ขณะที่ผู้ผลิตรายย่อยได้พื้นที่แจ้งเกิด สร้างระบบนิเวศแพลตฟอร์มที่โปร่งใสและเป็นธรรม',
        board: { type: 'v2-resp-rerank', activeRow: 3 },
        ops: [
          { label: 'สล็อต #1 ใหม่', value: '🎬 แบรนด์ใหญ่ A (ฟอร์มยักษ์ตรงใจ) 🥇', tone: 'plus' },
          { label: 'สล็อต #2 ใหม่', value: '🍿 แบรนด์ใหญ่ B (ซีรีส์ฮิต) 🥈', tone: 'plus' },
          { label: 'สล็อต #3 ใหม่', value: '🎸 ค่ายอิสระ E (Indie 5 ดาวแจ้งเกิดสำเร็จ) 🥉', tone: 'result' },
          { label: 'ความสำเร็จของ Fair Rerank', value: 'ชนะทั้งผู้ใช้และผู้ขายรายย่อย (Win-Win) 🏆', tone: 'result' }
        ]
      }
    ],
    'resp-shilling': [
      {
        title: 'ขั้นที่ 1 · พฤติกรรมการให้คะแนนของผู้ใช้ปกติ (Normal User Profile)',
        value: 'ผู้ใช้จริง ฟ้า และ พลอย ให้ดาวกระจายตัวตามรสนิยมจริง (1–5 ดาว มีความแปรปรวนธรรมชาติ)',
        detail: 'คนจริงจะมีหนังที่ชอบมากและหนังที่ไม่ชอบ คะแนนจึงมีความหลากหลาย (Natural Rating Variance) และไม่ได้เข้ามาโหวตพร้อมกันในเวลาเสี้ยววินาที',
        board: { type: 'v1-resp-shilling', activeRow: 0 },
        ops: [
          { label: 'โปรไฟล์ 👩 ฟ้า', value: 'คะแนน [5★, 3★, 2★, 4★] กระจายตัวเป็นธรรมชาติ ✓', tone: 'plus' },
          { label: 'โปรไฟล์ 🧑 พลอย', value: 'คะแนน [4★, 4★, 3★, 1★] สะท้อนรสนิยมจริง ✓', tone: 'plus' },
          { label: 'ความแปรปรวน (Variance)', value: 'ความแปรปรวนสูง (High Entropy) ปลอดภัย 🛡️', tone: 'plus' },
          { label: 'สถานะบัญชี', value: 'บัญชีผู้ใช้มนุษย์แท้จริง ได้รับการยืนยันตัวตน', tone: 'skip' }
        ]
      },
      {
        title: 'ขั้นที่ 2 · การโจมตีแบบ Push & Nuke Attack (Bot Rating Injection)',
        value: 'ตรวจพบกลุ่มบัญชีน่าสงสัย: นัดกันกด 5★ เต็มเหนี่ยวให้ C5 และถล่ม 1★ ใส่ C3 คู่แข่ง',
        detail: 'ผู้ไม่หวังดีสร้างกองทัพบัญชีบอทเข้ามาโหวต Push เพื่อดันสินค้าเป้าหมาย C5 และโหวต Nuke เพื่อทำลายสินค้าคู่แข่ง C3 พร้อมๆ กัน',
        board: { type: 'v1-resp-shilling', activeRow: 1 },
        ops: [
          { label: 'สินค้าเป้าหมายดันยอด (C5)', value: '🤖 บอท 1 และ บอท 2 กด 5★ รัวๆ (Push Attack) 🚨', tone: 'minus' },
          { label: 'สินค้าคู่แข่งทำลายยอด (C3)', value: 'บอทนัดกันถล่ม 1★ หวังตัดสิทธิ์ (Nuke Attack) 💥', tone: 'minus' },
          { label: 'สัญญาณเตือน (Velocity Surge)', value: 'คะแนน C5 พุ่งขึ้น 500 ครั้งใน 2 นาที ⚠️', tone: 'minus' },
          { label: 'ผลกระทบหากไม่ป้องกัน', value: 'โมเดล CF จะถูกหลอกให้แนะนำ C5 ขึ้นหน้าแรก', tone: 'skip' }
        ]
      },
      {
        title: 'ขั้นที่ 3 · การโจมตีแบบแยบยล Bandwagon Attack (Camouflage Tactic)',
        value: 'บอทเนียนเกาะกระแสของดัง: แกล้งกด 5★ ให้หนังฮิต C1 & C2 เพื่อหลอกว่ามีรสนิยมเหมือนคนจริง',
        detail: 'เพื่อไม่ให้ระบบตรวจจับความผิดปกติ บอทจะนำรายชื่อหนังดังยอดฮิตมากด 5★ เลียนแบบคนจริง เพื่อเพิ่มค่าความคล้ายคลึง (Cosine Similarity) กับผู้ใช้ทั่วไป',
        board: { type: 'v1-resp-shilling', activeRow: 2 },
        ops: [
          { label: 'กลวิธีพรางตัว (Bandwagon)', value: 'บอทแกล้งโหวต 5★ ให้ของฮิต C1 และ C2 🎭', tone: 'minus' },
          { label: 'วัตถุประสงค์ของบอท', value: 'ดึงความคล้ายคลึง (Similarity) กับคนจริงให้สูงขึ้น', tone: 'skip' },
          { label: 'จุดโป๊ะของขบวนการบอท', value: 'โปรไฟล์ของบอท 1 และ บอท 2 เหมือนกันเป๊ะ 100%! 🔍', tone: 'minus' },
          { label: 'การวัด Cosine บัญชี', value: 'Sim(บอท 1, บอท 2) = 0.9999 (ผิดธรรมชาติมนุษย์) 🚨', tone: 'result' }
        ]
      },
      {
        title: 'ขั้นที่ 4 · ด่านตรวจจับและตัดสิทธิ์บอท (Anomaly Detection & Syndicate Pruning)',
        value: 'ตรวจจับกลุ่มซินดิเคทสำเร็จ: ขึ้นบัญชีดำบอท ตัดเรตติ้งปลอมทิ้ง คืนความบริสุทธิ์ให้โมเดล 🛡️',
        detail: 'ระบบใช้อัลกอริทึมตรวจจับความผิดปกติ (Rating Velocity + Profile Clustering) ระงับสิทธิ์บัญชีบอท และตัดคะแนนแปลกปลอมออกจากตารางฝึกสอน CF ทันที',
        board: { type: 'v1-resp-shilling', activeRow: 3 },
        ops: [
          { label: 'สัญญาณจับโป๊ะที่ 1', value: 'Rating Velocity พุ่งผิดปกติในเสี้ยววินาที ⏱️', tone: 'result' },
          { label: 'สัญญาณจับโป๊ะที่ 2', value: 'Cluster บัญชีโหวตแพทเทิร์นเดียวกันจาก IP เดียวกัน 🌐', tone: 'result' },
          { label: 'มาตรการจัดการ (Action)', value: 'ตัดคะแนนบอททิ้ง (Pruning) 100% ก่อนเทรนโมเดล ✂️', tone: 'plus' },
          { label: 'ผลลัพธ์ต่อระบบ', value: 'ปกป้องโมเดล CF ให้แนะนำสินค้าตามความจริง ไม่ถูกปั่นยอด 🏆', tone: 'plus' }
        ]
      }
    ],
    'capstone-decision': [
      {
        title: 'สถานการณ์ที่ 1 · มีคะแนนดาวชัดเจน (Explicit Feedback 1–5★)',
        value: 'โจทย์: มีคะแนนดาว 1–5★ → โมเดล: SVD / FunkMF · Loss: RMSE · ตัวชี้วัด: RMSE / MAE',
        detail: 'เมื่อผู้ใช้ระบุระดับความชอบเป็นตัวเลขชัดเจน เป้าหมายคือพยากรณ์คะแนนดาวที่ขาดหายให้ใกล้เคียงที่สุด เหมาะกับการประเมินด้วยข้อผิดพลาดตัวเลข',
        board: { type: 'v1-capstone-decision', activeRow: 0 },
        ops: [
          { label: 'ชนิดข้อมูลนำเข้า', value: 'Explicit Stars 1–5★ (คะแนนดาวชัดเจน) ⭐', tone: 'plus' },
          { label: 'โมเดลที่ถูกต้องตามตำรา', value: 'SVD / FunkMF / Item-kNN (Pearson)', tone: 'plus' },
          { label: 'ฟังก์ชันการสูญเสีย (Loss)', value: 'MSE / RMSE: (r_ui − r̂_ui)²', tone: 'skip' },
          { label: 'ตัวชี้วัดข้อสอบที่ถูกต้อง', value: 'RMSE, MAE (วัดความคลาดเคลื่อนตัวเลข) 🎯', tone: 'result' }
        ]
      },
      {
        title: 'สถานการณ์ที่ 2 · มีเฉพาะประวัติคลิก/ดู (Implicit Feedback 0/1)',
        value: 'โจทย์: คลิก/ดู 0/1 ไม่มีดาว → โมเดล: BPR / WRMF / EASE · Loss: BPR Pairwise · ตัวชี้วัด: Recall@K / nDCG@K',
        detail: 'ห้ามมองช่องว่างเป็น 0 ดาวเด็ดขาด! ต้องใช้สูตรจัดอันดับ BPR หรือถ่วงน้ำหนักความมั่นใจ WRMF และวัดด้วยตัวชี้วัด Ranking เสมอ',
        board: { type: 'v1-capstone-decision', activeRow: 1 },
        ops: [
          { label: 'ชนิดข้อมูลนำเข้า', value: 'Implicit Clicks 0/1 (ไม่มีสัญญาณปฏิเสธ) 🖱️', tone: 'minus' },
          { label: 'โมเดลที่ถูกต้องตามตำรา', value: 'BPR-MF / iALS / WRMF / EASE ⚡', tone: 'plus' },
          { label: 'ฟังก์ชันการสูญเสีย (Loss)', value: 'BPR Loss: −ln σ(x̂_uij) ผลักบวกเหนือบวกลบ', tone: 'skip' },
          { label: 'ตัวชี้วัดข้อสอบที่ถูกต้อง', value: 'Recall@K, nDCG@K, MRR (ห้ามวัด RMSE!) 🏆', tone: 'result' }
        ]
      },
      {
        title: 'สถานการณ์ที่ 3 · สินค้าใหม่ไร้ประวัติคลิก (Cold-Start New Items)',
        value: 'โจทย์: สินค้าใหม่เพิ่งลงขาย → โมเดล: Content-based / Two-Tower + Features · ตัวชี้วัด: Item Coverage',
        detail: 'Pure CF จะล้มเหลวทันที (0/0) ต้องแก้ด้วยการสกัดเวกเตอร์จากแท็กหรือสื่อมัลติโมดัล ป้อนเข้า Two-Tower เพื่อให้มีเวกเตอร์พร้อมเสิร์ฟทันที',
        board: { type: 'v1-capstone-decision', activeRow: 2 },
        ops: [
          { label: 'ชนิดข้อมูลนำเข้า', value: 'Metadata ข้อความ, รูปภาพ, สเปกสินค้า 🏷️', tone: 'plus' },
          { label: 'โมเดลที่ถูกต้องตามตำรา', value: 'Content-based (BM25) / Two-Tower Item / LightFM', tone: 'plus' },
          { label: 'ข้อควรระวังระดับข้อสอบ', value: 'ห้ามใช้ Pure CF เพราะติดกับดัก 0/0 ⚠️', tone: 'minus' },
          { label: 'ตัวชี้วัดข้อสอบที่ถูกต้อง', value: 'Item Coverage > 80%, Catalog Gini 🛡️', tone: 'result' }
        ]
      },
      {
        title: 'สถานการณ์ที่ 4 · รู้ลำดับเวลาก่อน–หลัง (Sequential & Session-Based)',
        value: 'โจทย์: มีลำดับการคลิกต่อกัน → โมเดล: SASRec / Transformer / LLM · ตัวชี้วัด: Hit Rate / nDCG',
        detail: 'พฤติกรรมมีความต่อเนื่องตามเวลา (Next-Item Prediction) ใช้ Self-Attention หรือ LLM Reranker ในด่านสุดท้าย พร้อมคุมเวลาตอบสนองรวมไม่เกิน 50 ms',
        board: { type: 'v1-capstone-decision', activeRow: 3 },
        ops: [
          { label: 'ชนิดข้อมูลนำเข้า', value: 'ลำดับการกระทำ [i_1 → i_2 → i_3] ในเซสชัน ⏱️', tone: 'plus' },
          { label: 'โมเดลที่ถูกต้องตามตำรา', value: 'SASRec (Self-Attention) / GRU4Rec / LLM Rerank', tone: 'plus' },
          { label: 'ฟังก์ชันการสูญเสีย (Loss)', value: 'Cross-Entropy ทำนายชิ้นถัดไป (Next-Item)', tone: 'skip' },
          { label: 'ตัวชี้วัดข้อสอบที่ถูกต้อง', value: 'Hit Rate@K, nDCG@K, Latency SLA < 50ms 🏆', tone: 'result' }
        ]
      }
    ],
    'capstone-pipeline': [
      {
        title: 'ภาพรวมคลังสินค้ามหาศาล (Enterprise Scale Challenge)',
        value: 'คลังสินค้า 1,000,000 รายการ · งบเวลาประมวลผลทั้งระบบจำกัดเข้มงวดไม่เกิน 50 ms',
        detail: 'ในระบบจริง สินค้ามีจำนวนมหาศาลเกินกว่าจะส่งให้โมเดลที่ซับซ้อนคำนวณทั้งหมดพร้อมกันได้ จำเป็นต้องจัดวางเป็นสถาปัตยกรรม 3 ด่านแบบกรวย (Funnel)',
        board: { type: 'v6-capstone-pipeline', activeRow: 0 },
        ops: [
          { label: 'ขนาดคลังสินค้าเริ่มต้น', value: '1,000,000 รายการ (Catalog Scale) 📚', tone: 'plus' },
          { label: 'งบเวลาตอบสนอง (SLA Budget)', value: '< 50 มิลลิวินาที (Strict Real-Time SLA) ⏱️', tone: 'minus' },
          { label: 'ปัญหาถ้าไม่แบ่งด่าน', value: 'คำนวณโมเดลลึกบนของล้านชิ้นจะค้างนานหลายวินาที 💥', tone: 'minus' },
          { label: 'ทางออกเชิงสถาปัตยกรรม', value: 'แบ่งกรวยคัดกรอง 3 ด่าน (Funnel Architecture) 🏆', tone: 'result' }
        ]
      },
      {
        title: 'ด่านที่ 1 · Candidate Retrieval (1,000,000 → 500 รายการ ในเวลา < 10 ms)',
        value: 'ด่านที่ 1 Retrieval: Two-Tower + ScaNN ดึง 500 ตัวเลือกจากล้านชิ้น ในเวลา 8 ms ⚡',
        detail: 'ใช้ Two-Tower ค้นหาในดัชนี ANN อย่างรวดเร็ว ด่านนี้เน้นค่า Recall@K เพื่อกวาดของดีเข้ามาให้ได้มากที่สุด ห้ามวัด nDCG ในด่านนี้เด็ดขาด!',
        board: { type: 'v6-capstone-pipeline', activeRow: 1 },
        ops: [
          { label: 'สัดส่วนการคัดกรอง', value: '1,000,000 → 500 รายการ (ลดขนาดลง 2,000 เท่า!) ⚡', tone: 'result' },
          { label: 'เทคโนโลยีที่ใช้', value: 'Two-Tower + ANN Indexing (ScaNN / HNSW) 🏹', tone: 'plus' },
          { label: 'เวลาที่ใช้ (Latency)', value: '~8 มิลลิวินาที (เร็วระดับสายฟ้า) ⏱️', tone: 'plus' },
          { label: 'ตัวชี้วัดประจำด่าน', value: 'Recall@500 (เน้นกวาดของดี อย่าเพิ่งสนลำดับ) 🎯', tone: 'skip' }
        ]
      },
      {
        title: 'ด่านที่ 2 · Scoring & Deep Ranking (500 → 20 รายการ ในเวลา < 30 ms)',
        value: 'ด่านที่ 2 Ranking: Deep Ranking Network คำนวณคะแนนละเอียดเหลือ 20 ชิ้น ในเวลา 28 ms',
        detail: 'นำ 500 รายการมาคำนวณด้วยโมเดลที่ซับซ้อน ผสานฟีเจอร์บริบทสด (อุปกรณ์ เวลา ปฏิสัมพันธ์ล่าสุด) พยากรณ์คะแนนความชอบแม่นยำ เน้น nDCG@K',
        board: { type: 'v6-capstone-pipeline', activeRow: 2 },
        ops: [
          { label: 'สัดส่วนการคัดกรอง', value: '500 → 20 รายการสุดท้าย (คัดหัวกะทิ) 🎯', tone: 'result' },
          { label: 'เทคโนโลยีที่ใช้', value: 'Deep Ranking Network / GBDT / Cross-Encoder 🧠', tone: 'plus' },
          { label: 'เวลาที่ใช้ (Latency)', value: '~28 มิลลิวินาที (อยู่ในงบประมาณ) ⏱️', tone: 'plus' },
          { label: 'ตัวชี้วัดประจำด่าน', value: 'nDCG@20, MRR (วัดคุณภาพความแม่นยำของการเรียง) 📊', tone: 'skip' }
        ]
      },
      {
        title: 'ด่านที่ 3 · Reranking, Diversity & Fairness (20 → Top-5 บนหน้าจอ ในเวลา < 5 ms)',
        value: 'ด่านที่ 3 Rerank: MMR + Fair Quota คลอด Top-5 ขึ้นหน้าจอ เวลารวมทั้งระบบ 41 ms (< 50 ms SLA ✓)',
        detail: 'เกลี่ยความหลากหลายด้วย MMR สอดแทรกโควตาร้านค้ารายย่อย กรองสินค้าที่เพิ่งซื้อไป และแนบคำอธิบายที่ตรวจสอบความจริงแล้ว ผ่านเกณฑ์ SLA สบายๆ',
        board: { type: 'v6-capstone-pipeline', activeRow: 3 },
        ops: [
          { label: 'สล็อตบนหน้าจอผู้ใช้', value: 'คัดเลือก Top-5 รายการที่สมบูรณ์แบบที่สุด 🥇', tone: 'result' },
          { label: 'กลไกที่ทำงาน', value: 'MMR Diversity + Fair Quotas + กฎธุรกิจ 🛡️', tone: 'plus' },
          { label: 'เวลารวมทั้งระบบ (Total E2E)', value: '41 มิลลิวินาที (ผ่าน SLA 50 ms ฉลุย) 🏆', tone: 'result' },
          { label: 'สรุปความพร้อมระดับสถาปัตย์', value: 'เร็ว แม่นยำ หลากหลาย และมีความรับผิดชอบ 🌟', tone: 'plus' }
        ]
      }
    ]
  };

  function renderHolisticCanvas(canvas, name, stage, stages, step) {
    canvas.replaceChildren();
    const b = stage.board;
    if (b && b.type === 'v1-matrix') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const cols = ['ผู้ใช้ \\ คอร์ส', '🐍 Python (i₁)', '📊 SQL (i₂)', '🎨 UX (i₃)', '📈 Excel (i₄)'];
      cols.forEach((label, idx) => {
        const th = make('th', '', label);
        th.scope = 'col';
        if (b.activeCol === idx - 1) th.classList.add('is-active-header');
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const rows = [
        { user: '👩 ฟ้า (u₁)', vals: ['5★', '4★', '?', '?'] },
        { user: '🧑 พลอย (u₂)', vals: ['4★', '?', '2★', '?'] },
        { user: '👨 นนท์ (u₃)', vals: ['?', '5★', '?', '3★'] }
      ];
      const tbody = document.createElement('tbody');
      rows.forEach((rowObj, r) => {
        const tr = document.createElement('tr');
        const rth = make('th', '', rowObj.user);
        rth.scope = 'row';
        if (b.activeRow === r) rth.classList.add('is-active-header');
        tr.append(rth);
        rowObj.vals.forEach((val, c) => {
          const td = make('td', val === '?' ? 'is-missing' : '', val);
          const isFocus = (b.focusCells || []).some(([rr, cc]) => rr === r && cc === c);
          const isTarget = (b.targetCells || []).some(([rr, cc]) => rr === r && cc === c);
          const isScan = (b.scanCells || []).some(([rr, cc]) => rr === r && cc === c);
          if (isFocus) td.classList.add('cell-focus');
          if (isTarget) td.classList.add('cell-target');
          if (isScan) td.classList.add('cell-scan');
          tr.append(td);
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);

      const meter = make('div', `rs-wb-meter${b.meterHighlight ? ' is-active' : ''}`);
      meter.innerHTML = `
        <div class="rs-wb-meter-bar" role="img" aria-label="Density 50% และ Sparsity 50%">
          <span class="rs-wb-meter-fill-known" style="width:50%">รู้ค่า 6/12 (Density 50%)</span>
          <span class="rs-wb-meter-fill-missing" style="width:50%">ว่าง ? 6/12 (Sparsity 50%)</span>
        </div>
      `;
      canvas.append(meter);
      return;
    }

    if (b && b.type === 'v1-average') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      ['ผู้ใช้ \\ คอร์ส', '🐍 Python', '📊 SQL', '🎨 UX', '🆕 AI ใหม่', 'เฉลี่ยรายคน (r̄ᵤ)'].forEach((label, idx) => {
        const th = make('th', '', label);
        th.scope = 'col';
        if (b.activeCol === idx - 1 || (idx === 5 && b.summaryRowFocus !== undefined)) th.classList.add('is-active-header');
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const rows = [
        { user: '👩 ฟ้า (u₁)', vals: ['5★', '4★', '?', '?'], uMean: '4.5★' },
        { user: '🧑 พลอย (u₂)', vals: ['4★', '?', '2★', '?'], uMean: '3.0★' },
        { user: '👨 นนท์ (u₃)', vals: ['?', '5★', '?', '?'], uMean: '5.0★' }
      ];
      const tbody = document.createElement('tbody');
      rows.forEach((rowObj, r) => {
        const tr = document.createElement('tr');
        const rth = make('th', '', rowObj.user);
        rth.scope = 'row';
        if (b.activeRow === r) rth.classList.add('is-active-header');
        tr.append(rth);
        rowObj.vals.forEach((val, c) => {
          const td = make('td', val === '?' ? 'is-missing' : '', val);
          if ((b.takeCells || []).some(([rr, cc]) => rr === r && cc === c)) td.classList.add('cell-scan');
          if ((b.skipCells || []).some(([rr, cc]) => rr === r && cc === c)) td.classList.add('cell-skip');
          tr.append(td);
        });
        const uTd = make('td', 'is-summary-cell', rowObj.uMean);
        if (b.summaryRowFocus === r) uTd.classList.add('cell-focus');
        tr.append(uTd);
        tbody.append(tr);
      });

      const ftr = document.createElement('tr');
      const fth = make('th', '', 'เฉลี่ยรายคอร์ส (r̄ᵢ)');
      fth.scope = 'row';
      if (b.summaryColFocus !== undefined) fth.classList.add('is-active-header');
      ftr.append(fth);
      const colMeans = ['4.5★ (n=2)', '4.5★ (n=2)', '2.0★ (n=1)', 'n=0 → μ (3.8★)'];
      colMeans.forEach((cm, c) => {
        const td = make('td', 'is-summary-cell', cm);
        if (b.summaryColFocus === c) td.classList.add(c === 3 ? 'cell-target' : 'cell-focus');
        ftr.append(td);
      });
      const globalTd = make('td', 'is-summary-cell', 'μ = 3.8★');
      if (b.globalFallback) globalTd.classList.add('cell-focus');
      ftr.append(globalTd);
      tbody.append(ftr);

      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v3-dot') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = [
        'เวกเตอร์ (คน / คอร์ส)',
        '📊 แกนที่ 1: เนื้อหา Data',
        '🎨 แกนที่ 2: เนื้อหา Design',
        'ผลรวม Dot (p · q)',
        'Cosine (ตัดผลความยาว)'
      ];
      headers.forEach((h, i) => {
        const th = make('th', '', h);
        th.scope = 'col';
        if ((i === 1 && (b.activeDim === 0 || b.stepMode === 'dim2-sum')) ||
            (i === 2 && (b.activeDim === 1 || b.stepMode === 'dim2-sum')) ||
            (i === 3 && b.winnerHighlight) ||
            (i === 4 && b.normHighlight)) {
          th.classList.add('is-active-header');
        }
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const vecRows = [
        {
          label: '👩 ฟ้า · p = (3, 1)',
          tone: 'user',
          d1: 3, d1Note: 'ชอบ Data = 3',
          d2: 1, d2Note: 'ชอบ Design = 1',
          dot: 'ตัวตั้งต้น (p)',
          cos: '‖p‖ = √10',
          isUser: true
        },
        {
          label: '🐍 คอร์ส A · q_A = (2, 0)',
          tone: 'item-a',
          d1: 2, d1Note: '3 × 2 = +6',
          d2: 0, d2Note: '1 × 0 = 0',
          dot: '6 + 0 = 6 🏆',
          cos: '0.95 (อันดับ 1)',
          isWinner: true
        },
        {
          label: '🎨 คอร์ส B · q_B = (0, 2)',
          tone: 'item-b',
          d1: 0, d1Note: '3 × 0 = 0',
          d2: 2, d2Note: '1 × 2 = +2',
          dot: '0 + 2 = 2',
          cos: '0.32 (อันดับ 2)'
        },
        {
          label: '⚠️ ปั๊มคอร์ส A · q_A′ = (4, 0)',
          tone: 'item-a',
          d1: 4, d1Note: '3 × 4 = +12',
          d2: 0, d2Note: '1 × 0 = 0',
          dot: 'พุ่งเป็น 12 (×2)',
          cos: '0.95 เท่าเดิม 🛡️',
          isGuard: true
        }
      ];

      const tbody = document.createElement('tbody');
      vecRows.forEach(row => {
        const tr = document.createElement('tr');
        const rth = make('th', '', row.label);
        rth.scope = 'row';
        if (row.isUser || (row.isWinner && b.winnerHighlight) || (row.isGuard && b.normHighlight)) {
          rth.classList.add('is-active-header');
        }
        tr.append(rth);

        const td1 = make('td', '');
        if (b.activeDim === 0 || b.stepMode === 'dim2-sum') td1.classList.add(row.isUser ? 'cell-focus' : 'cell-scan');
        td1.innerHTML = `
          <div class="rs-wb-inline-vec">
            <div class="rs-wb-bar-track"><span class="rs-wb-bar-fill ${row.tone}" style="width:${(row.d1 / 4) * 100}%"></span></div>
            <span class="rs-wb-inline-meta"><b>${row.d1}</b><small>${row.d1Note}</small></span>
          </div>
        `;

        const td2 = make('td', '');
        if (b.activeDim === 1 || b.stepMode === 'dim2-sum') td2.classList.add(row.isUser ? 'cell-focus' : 'cell-scan');
        td2.innerHTML = `
          <div class="rs-wb-inline-vec">
            <div class="rs-wb-bar-track"><span class="rs-wb-bar-fill ${row.tone}" style="width:${(row.d2 / 4) * 100}%"></span></div>
            <span class="rs-wb-inline-meta"><b>${row.d2}</b><small>${row.d2Note}</small></span>
          </div>
        `;

        const tdDot = make('td', 'is-summary-cell', row.dot);
        if (row.isWinner && b.winnerHighlight) tdDot.classList.add('cell-focus');
        if (row.isGuard && b.normHighlight) tdDot.classList.add('cell-target');

        const tdCos = make('td', 'is-summary-cell', row.cos);
        if (row.isGuard && b.normHighlight) tdCos.classList.add('cell-focus');

        tr.append(td1, td2, tdDot, tdCos);
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v3-log') {
      const landscape = make('div', 'rs-wb-landscape');
      const items = [
        { icon: '🎨', label: '1 คลิก', raw: 1, pow: 0, sup: '⁰' },
        { icon: '📈', label: '2 คลิก', raw: 2, pow: 1, sup: '¹' },
        { icon: '📊', label: '4 คลิก', raw: 4, pow: 2, sup: '²' },
        { icon: '🐍', label: '8 คลิก', raw: 8, pow: 3, sup: '³' },
        { icon: '👑', label: '16 คลิก', raw: 16, pow: 4, sup: '⁴' }
      ];
      items.forEach((it, idx) => {
        const isCurrent = b.activeIndex === idx;
        const isCompare = (b.compareIndices || []).includes(idx);
        const col = make('div', `rs-wb-landcol${isCurrent ? ' is-current' : ''}${isCompare ? ' is-compare' : ''}`);
        const rawHeight = Math.round(8 + (it.raw / 16) * 92);
        const logHeight = Math.round(8 + (it.pow / 16) * 92);
        col.innerHTML = `
          <div class="rs-wb-landtop">
            <strong>${it.icon} ${it.label}</strong>
          </div>
          <div class="rs-wb-landbars" role="img" aria-label="${it.label}: ดิบ ${it.raw}, log₂ เท่ากับ ${it.pow}">
            <div class="rs-wb-vbar-wrap">
              <span class="rs-wb-vbar-num">${it.raw}</span>
              <div class="rs-wb-vbar raw" style="height:${rawHeight}%"></div>
              <span class="rs-wb-vbar-tag">2${it.sup}</span>
            </div>
            <div class="rs-wb-vbar-wrap">
              <span class="rs-wb-vbar-num">${it.pow}</span>
              <div class="rs-wb-vbar log" style="height:${logHeight}%"></div>
              <span class="rs-wb-vbar-tag">log₂</span>
            </div>
          </div>
          <div class="rs-wb-landfoot">
            <code>log₂(${it.raw}) = ${it.pow}</code>
          </div>
        `;
        landscape.append(col);
      });
      canvas.append(landscape);
      return;
    }

    if (b && b.type === 'v6-intro-pipeline') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = [
        'คอร์สในคลัง (Catalog)',
        '1 · ข้อมูลตั้งต้น (👩 ฟ้า)',
        '2 · คัดผู้สมัคร (Retrieval)',
        '3 · ให้คะแนน (Scoring)',
        '4 · กฎธุรกิจ (Re-rank)',
        '5 · หน้าจอ Top-2 & คลิก'
      ];
      headers.forEach((h, i) => {
        const th = make('th', '', h);
        th.scope = 'col';
        if (i === b.activeStage + 1) th.classList.add('is-active-header');
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const pipeRows = [
        {
          course: '📊 คอร์ส SQL (สาย Data)',
          cells: ['ตรงสาย Data ✓', '✅ เข้ารอบ', '0.92 (อันดับ 2)', '✅ พร้อมเรียน (#1)', '🏆 แสดง #1 · คลิก ✓'],
          statusAtStage: ['focus', 'focus', 'scan', 'focus', 'focus']
        },
        {
          course: '🐍 คอร์ส Python (สาย Data)',
          cells: ['ตรงสาย Data ✓', '✅ เข้ารอบ', '0.88 (อันดับ 3)', '✅ พร้อมเรียน (#2)', '🥈 แสดง #2 · โชว์'],
          statusAtStage: ['focus', 'focus', 'scan', 'scan', 'scan']
        },
        {
          course: '🔒 คอร์ส AI (ปิดรับแล้ว)',
          cells: ['ตรงสาย Data ✓', '✅ เข้ารอบ', '0.96 (สูงสุด!)', '🚫 ตัดออก (ปิดรับ)', '— ไม่แสดงบนจอ'],
          statusAtStage: ['scan', 'scan', 'focus', 'target', 'skip']
        },
        {
          course: '🎨 คอร์ส UX (สาย Design)',
          cells: ['คนละสายกับฟ้า', '✕ คัดตกด่านแรก', '— ไม่ได้คิดคะแนน', '— หลุดไปแล้ว', '— ไม่แสดงบนจอ'],
          statusAtStage: ['skip', 'target', 'skip', 'skip', 'skip']
        }
      ];

      const tbody = document.createElement('tbody');
      pipeRows.forEach(row => {
        const tr = document.createElement('tr');
        const rth = make('th', '', row.course);
        rth.scope = 'row';
        if (row.statusAtStage[b.activeStage] === 'focus' || row.statusAtStage[b.activeStage] === 'target') {
          rth.classList.add('is-active-header');
        }
        tr.append(rth);
        row.cells.forEach((txt, cIdx) => {
          const td = make('td', cIdx === 4 ? 'is-summary-cell' : '', txt);
          if (cIdx === b.activeStage) {
            const st = row.statusAtStage[cIdx];
            if (st === 'focus') td.classList.add('cell-focus');
            else if (st === 'scan') td.classList.add('cell-scan');
            else if (st === 'target') td.classList.add('cell-target');
            else if (st === 'skip') td.classList.add('cell-skip');
          }
          tr.append(td);
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v2-intro-ranking') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = [
        'ระบบ / ความจริง',
        '🐍 คอร์ส A (ชอบสุด)',
        '📊 คอร์ส B (ชอบรอง)',
        '🎨 คอร์ส C (ไม่ชอบ)',
        'คลาดเคลื่อนเฉลี่ย (MAE)',
        'หน้าจอ Top-2 (K = 2)'
      ];
      headers.forEach((h, i) => {
        const th = make('th', '', h);
        th.scope = 'col';
        if (b.focusCol === i || (b.summaryMode && (i === 4 || i === 5))) th.classList.add('is-active-header');
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const rankRows = [
        {
          label: '👩 ความจริงในใจฟ้า',
          cells: ['5.0★ (อันดับ 1)', '4.0★ (อันดับ 2)', '2.0★ (อันดับ 3)', 'ตัวตั้งต้น (0.00)', 'เป้าหมาย: #1 🐍 A · #2 📊 B']
        },
        {
          label: '🤖 โมเดล X (เน้นทายดาว)',
          cells: ['ทาย 4.4★ (ผิด 0.6)', 'ทาย 4.5★ (ผิด 0.5)', 'ทาย 2.0★ (ตรง)', 'MAE = 0.55★ (เลขแม่น)', '❌ #1 📊 B · #2 🐍 A (สลับผิด!)']
        },
        {
          label: '🏆 โมเดล Y (เน้นลำดับ)',
          cells: ['ทาย 3.0★ (ผิด 2.0)', 'ทาย 2.0★ (ผิด 2.0)', 'ทาย 1.0★ (ผิด 1.0)', 'MAE = 2.00★ (เลขเพี้ยน)', '✅ #1 🐍 A · #2 📊 B (เรียงถูกเป๊ะ!)']
        }
      ];

      const tbody = document.createElement('tbody');
      rankRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const rth = make('th', '', row.label);
        rth.scope = 'row';
        if (b.focusRow === rIdx || (b.summaryMode && rIdx > 0)) rth.classList.add('is-active-header');
        tr.append(rth);
        row.cells.forEach((txt, cIdx) => {
          const td = make('td', cIdx >= 3 ? 'is-summary-cell' : '', txt);
          if (b.focusRow === rIdx) {
            if (cIdx === 4 && rIdx === 1) td.classList.add('cell-target');
            else if (cIdx === 4 && rIdx === 2) td.classList.add('cell-focus');
            else if (cIdx === 3 && rIdx === 1) td.classList.add('cell-focus');
            else td.classList.add('cell-scan');
          } else if (b.summaryMode && cIdx === 4) {
            td.classList.add(rIdx === 2 ? 'cell-focus' : rIdx === 1 ? 'cell-target' : '');
          }
          tr.append(td);
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v1-cold-start') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      ['กรณีปัญหา', 'ลักษณะช่องว่างในตาราง', 'ผลต่อโมเดล CF', 'ยุทธศาสตร์แก้ไข (Solution)'].forEach((h, i) => {
        const th = make('th', i === 3 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const coldRows = [
        {
          label: '🆕 1. ผู้ใช้ใหม่ (User Cold Start)',
          cells: ['แถวของ 👩 ฟ้า ว่างทั้งแถว [ ? · ? · ? ]', '✕ ไม่รู้ว่าฟ้าชอบเหมือนใคร', '📋 ถาม Onboarding 3 ข้อ + ของยอดนิยม']
        },
        {
          label: '📦 2. สินค้าใหม่ (Item Cold Start)',
          cells: ['คอลัมน์ 🥝 คอร์สใหม่ ว่างทั้งคอลัมน์', '✕ ยังไม่มีใครเคยเรียนหรือให้ดาว', '🏷️ Content-based (อ่านแท็ก) + สำรวจ 5%']
        },
        {
          label: '🏗️ 3. ระบบเพิ่งเปิดวันแรก (System)',
          cells: ['ตารางว่างเปล่าทั้งผืน 100%', '✕ ไม่มีประวัติทั้งคนและของ', '🧭 Knowledge-based (กฎสเปก) + เทรนด์นอก']
        },
        {
          label: '🕸️ เทียบ: ข้อมูลเบาบาง (Sparsity)',
          cells: ['อยู่มานาน 2 ปีแต่ตารางแหว่ง 99%', '⚠️ หาวิชาร่วมกัน (Overlap) ยาก', '🧮 Matrix Factorization + Metadata เสริม']
        }
      ];

      const tbody = document.createElement('tbody');
      coldRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const rth = make('th', b.activeRow === rIdx ? 'is-active-header' : '', row.label);
        rth.scope = 'row';
        tr.append(rth);
        row.cells.forEach((txt, cIdx) => {
          const td = make('td', cIdx === 2 ? 'is-summary-cell' : '', txt);
          if (b.activeRow === rIdx) {
            if (cIdx === 0) td.classList.add('cell-target');
            else if (cIdx === 1) td.classList.add('cell-scan');
            else if (cIdx === 2) td.classList.add('cell-focus');
          }
          tr.append(td);
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v7-feedback-loop') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = [
        'คอร์สเรียน',
        '1 · โอกาสได้โชว์ (Exposure)',
        '2 · ยอดคลิกดิบ (Clicks)',
        '3 · ความชอบจริง (CTR = คลิก÷โชว์)',
        '4 · รุ่นถัดไป vs ทางแก้'
      ];
      headers.forEach((h, i) => {
        const th = make('th', b.activeCol === i ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const loopRows = [
        {
          label: '🐍 คอร์ส A (ระบบคุ้นเคย)',
          tone: 'item-a',
          expPct: 80, expBold: '80 ครั้ง', expText: 'โชว์ 80% ของหน้าจอ',
          clkPct: 80, clkBold: '16 คลิก', clkText: 'ดูเยอะกว่า 4 เท่า',
          ctr: '16 ÷ 80 = 20%',
          next: 'คลิกดิบ → ผูกขาด 96% · หารโชว์ → ยุติธรรม'
        },
        {
          label: '🎨 คอร์ส B (ของดีนอกกระแส)',
          tone: 'item-b',
          expPct: 20, expBold: '20 ครั้ง', expText: 'โชว์ 20% ของหน้าจอ',
          clkPct: 20, clkBold: '4 คลิก', clkText: 'น้อยเพราะโชว์น้อย',
          ctr: '4 ÷ 20 = 20% เท่ากัน! 🏆',
          next: 'คลิกดิบ → จมหาย 4% · Explore 10% → ได้เกิด 🛡️'
        }
      ];

      const tbody = document.createElement('tbody');
      loopRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const rth = make('th', 'is-active-header', row.label);
        rth.scope = 'row';
        tr.append(rth);

        const tdExp = make('td', b.activeCol === 1 ? 'cell-scan' : '');
        tdExp.innerHTML = `
          <div class="rs-wb-inline-vec">
            <div class="rs-wb-bar-track"><span class="rs-wb-bar-fill ${row.tone}" style="width:${row.expPct}%"></span></div>
            <span class="rs-wb-inline-meta"><b>${row.expBold}</b><small>${row.expText}</small></span>
          </div>
        `;

        const tdClk = make('td', b.activeCol === 2 ? (rIdx === 0 ? 'cell-target' : 'cell-scan') : '');
        tdClk.innerHTML = `
          <div class="rs-wb-inline-vec">
            <div class="rs-wb-bar-track"><span class="rs-wb-bar-fill ${row.tone}" style="width:${row.clkPct}%"></span></div>
            <span class="rs-wb-inline-meta"><b>${row.clkBold}</b><small>${row.clkText}</small></span>
          </div>
        `;

        const tdCtr = make('td', `is-summary-cell${b.activeCol === 3 ? ' cell-focus' : ''}`, row.ctr);
        const tdNext = make('td', `is-summary-cell${b.activeCol === 4 ? (rIdx === 1 ? ' cell-focus' : ' cell-scan') : ''}`, row.next);

        tr.append(tdExp, tdClk, tdCtr, tdNext);
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v4-metrics-errors') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = [
        'คอร์สเรียน (6 วิชา)',
        'ดาวจริง r (👩 ฟ้า)',
        'โมเดล R1: ทาย r̂₁ (|e| · e²)',
        'โมเดล R2: ทาย r̂₂ (|e| · e²)'
      ];
      headers.forEach((h, i) => {
        const th = make('th', (b.focusCol === i || (b.summaryFocus && i >= 2)) ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const errRows = [
        { label: '🐍 คอร์ส A', r: '5★', r1: 'ทาย 4★ (|e|=1 · e²=1)', r2: 'ทาย 5★ (|e|=0 · e²=0)' },
        { label: '🎨 คอร์ส B', r: '2★', r1: 'ทาย 3★ (|e|=1 · e²=1)', r2: 'ทาย 2★ (|e|=0 · e²=0)' },
        { label: '📊 คอร์ส C', r: '4★', r1: 'ทาย 4★ (|e|=0 · e²=0)', r2: 'ทาย 4★ (|e|=0 · e²=0)' },
        { label: '📈 คอร์ส D', r: '3★', r1: 'ทาย 2★ (|e|=1 · e²=1)', r2: 'ทาย 3★ (|e|=0 · e²=0)' },
        { label: '📐 คอร์ส E (จุดชี้ขาด)', r: '4★', r1: 'ทาย 5★ (|e|=1 · e²=1)', r2: 'ทาย 1★ (|e|=3 · e²=9 💥)', isOutlier: true },
        { label: '🖼️ คอร์ส F', r: '1★', r1: 'ทาย 1★ (|e|=0 · e²=0)', r2: 'ทาย 1★ (|e|=0 · e²=0)' },
        {
          label: 'สรุป MAE & RMSE (n=6)',
          r: 'ตัวหาร n = 6',
          r1: 'Σ|e|=4 → MAE=0.6667 · Σe²=4 → RMSE=0.8165 🏆',
          r2: 'Σ|e|=3 → MAE=0.5000 🏆 · Σe²=9 → RMSE=1.2247',
          isSummary: true
        }
      ];

      const tbody = document.createElement('tbody');
      errRows.forEach(row => {
        const tr = document.createElement('tr');
        const rth = make('th', (row.isSummary && b.summaryFocus) || (row.isOutlier && b.highlightOutlier) ? 'is-active-header' : '', row.label);
        rth.scope = 'row';
        tr.append(rth);

        const tdR = make('td', row.isSummary ? 'is-summary-cell' : '', row.r);
        if (b.focusCol === 1) tdR.classList.add('cell-scan');

        const tdR1 = make('td', row.isSummary ? 'is-summary-cell' : '', row.r1);
        if (b.focusCol === 2) tdR1.classList.add(row.isSummary ? 'cell-focus' : 'cell-scan');
        if (b.summaryFocus && row.isSummary) tdR1.classList.add('cell-focus');

        const tdR2 = make('td', row.isSummary ? 'is-summary-cell' : '', row.r2);
        if (b.focusCol === 3) {
          if (row.isOutlier) tdR2.classList.add('cell-target');
          else if (row.isSummary) tdR2.classList.add('cell-focus');
          else tdR2.classList.add('cell-scan');
        }
        if (b.summaryFocus && row.isOutlier) tdR2.classList.add('cell-target');
        if (b.summaryFocus && row.isSummary) tdR2.classList.add('cell-focus');

        tr.append(tdR, tdR1, tdR2);
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v2-metrics-set') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = [
        'ผู้ใช้ & โมเดล',
        'หน้าจอ Top-3 (K = 3)',
        'ของที่ชอบจริง Rᵤ (≥4★)',
        'Precision@3 (H/3)',
        'Recall@3 (H/|Rᵤ|)',
        'F1@3 & HitRate@3'
      ];
      headers.forEach((h, i) => {
        const th = make('th', i >= 3 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const setRows = [
        {
          label: '👩 ฟ้า · โมเดล S',
          cells: ['#1 🐍A ✓ · #2 📊C ✓ · #3 🎨B ✕ (H=2)', '{🐍A, 📊C, 📐E} (|Rᵤ|=3)', '2/3 ≈ 0.6667', '2/3 ≈ 0.6667', 'F1 = 0.6667 · HR = 1']
        },
        {
          label: '👩 ฟ้า · โมเดล T',
          cells: ['#1 🎨B ✕ · #2 🐍A ✓ · #3 📊C ✓ (H=2)', '{🐍A, 📊C, 📐E} (|Rᵤ|=3)', '2/3 ≈ 0.6667', '2/3 ≈ 0.6667', 'F1 = 0.6667 · HR = 1']
        },
        {
          label: '🧑 พลอย · โมเดล S',
          cells: ['#1 🐍A ✕ · #2 📊C ✕ · #3 📐E ✕ (H=0)', '{🎨B, 📈D} (|Rᵤ|=2)', '0/3 = 0.0000', '0/2 = 0.0000', 'F1 = 0.0000 · HR = 0']
        },
        {
          label: '🧑 พลอย · โมเดล T',
          cells: ['#1 🎨B ✓ · #2 🐍A ✕ · #3 📈D ✓ (H=2)', '{🎨B, 📈D} (|Rᵤ|=2)', '2/3 ≈ 0.6667', '2/2 = 1.0000 🏆', 'F1 = 0.8000 · HR = 1']
        }
      ];

      const tbody = document.createElement('tbody');
      setRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx || b.compareRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.label);
        rth.scope = 'row';
        tr.append(rth);
        row.cells.forEach((txt, cIdx) => {
          const td = make('td', cIdx >= 2 ? 'is-summary-cell' : '', txt);
          if (isHi) {
            if (rIdx === 2 && cIdx >= 2) td.classList.add('cell-target');
            else if (cIdx >= 2) td.classList.add('cell-focus');
            else td.classList.add('cell-scan');
          }
          tr.append(td);
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v2-metrics-first') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = [
        'ผู้ใช้ & โมเดล',
        'ช่อง #1 (1/1 = 1.00)',
        'ช่อง #2 (1/2 = 0.50)',
        'ช่อง #3 (1/3 = 0.33)',
        'ชิ้นแรกที่ใช่ (r₁)',
        'RR@3 = 1 / r₁'
      ];
      headers.forEach((h, i) => {
        const th = make('th', i >= 4 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const rrRows = [
        {
          label: '👩 ฟ้า · โมเดล T',
          cells: ['🎨 B (2★) ✕', '🎯 🐍 A (5★) ✓ ชิ้นแรก!', '📊 C (4★) ✓ (ไม่นับซ้ำ)', 'เจอที่อันดับ r₁ = 2', '1/2 = 0.5000']
        },
        {
          label: '🧑 พลอย · โมเดล T',
          cells: ['🎯 🎨 B (5★) ✓ ชิ้นแรก!', '🐍 A (2★) ✕', '📈 D (4★) ✓ (ไม่นับซ้ำ)', 'เจอที่อันดับ r₁ = 1', '1/1 = 1.0000 🏆']
        },
        {
          label: '🧑 พลอย · โมเดล S',
          cells: ['🐍 A (2★) ✕', '📊 C (3★) ✕', '📐 E (2★) ✕', 'ไม่เจอใน Top-3', '0.0000']
        },
        {
          label: 'สรุป MRR@3 (เฉลี่ย 2 คน)',
          cells: ['โมเดล S: (1.00 + 0)/2', 'MRR@3(S) = 0.5000', 'โมเดล T: (0.50 + 1.00)/2', 'MRR@3(T) = 0.7500 🏆', 'T ชนะเพราะพลอยได้ #1'],
          isSummary: true
        }
      ];

      const tbody = document.createElement('tbody');
      rrRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.label);
        rth.scope = 'row';
        tr.append(rth);
        row.cells.forEach((txt, cIdx) => {
          const td = make('td', cIdx >= 3 || row.isSummary ? 'is-summary-cell' : '', txt);
          if (isHi) {
            if (b.highlightIgnore && cIdx === 2) td.classList.add('cell-target');
            else if ((rIdx === 0 && cIdx === 1) || (rIdx === 1 && cIdx === 0) || cIdx === 4 || (row.isSummary && cIdx === 3)) td.classList.add('cell-focus');
            else td.classList.add('cell-scan');
          }
          tr.append(td);
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v2-metrics-ap') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = [
        'ผู้ใช้ & โมเดล',
        'k = 1 (P@1 · rel₁)',
        'k = 2 (P@2 · rel₂)',
        'k = 3 (P@3 · rel₃)',
        'ตัวหาร m = min(3, |Rᵤ|)',
        'AP@3 = Σ(P@k·relₖ) / m'
      ];
      headers.forEach((h, i) => {
        const th = make('th', i >= 4 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const apRows = [
        {
          label: '👩 ฟ้า · โมเดล T (B✕, A✓, C✓)',
          cells: ['🎨B ✕ → ข้าม (0)', '🐍A ✓ → P@2 = 1/2', '📊C ✓ → P@3 = 2/3', 'min(3, 3) = 3', '(1/2 + 2/3) ÷ 3 = 7/18 ≈ 0.3889']
        },
        {
          label: '👩 ฟ้า · โมเดล S (A✓, C✓, B✕)',
          cells: ['🐍A ✓ → P@1 = 1/1', '📊C ✓ → P@2 = 2/2', '🎨B ✕ → ข้าม (0)', 'min(3, 3) = 3', '(1 + 1 + 0) ÷ 3 = 2/3 ≈ 0.6667 🏆']
        },
        {
          label: '🧑 พลอย · โมเดล T (B✓, A✕, D✓)',
          cells: ['🎨B ✓ → P@1 = 1/1', '🐍A ✕ → ข้าม (0)', '📈D ✓ → P@3 = 2/3', 'min(3, 2) = 2', '(1 + 2/3) ÷ 2 = 5/6 ≈ 0.8333 🏆']
        },
        {
          label: 'สรุป MAP@3 (เฉลี่ยฟ้า + พลอย)',
          cells: ['โมเดล S: (2/3 + 0) ÷ 2', 'MAP@3(S) = 0.3333', 'โมเดล T: (7/18 + 5/6) ÷ 2', 'MAP@3(T) = 11/18 ≈ 0.6111 🏆', 'T ชนะเมื่อเฉลี่ยรวม 2 คน'],
          isSummary: true
        }
      ];

      const tbody = document.createElement('tbody');
      apRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.label);
        rth.scope = 'row';
        tr.append(rth);
        row.cells.forEach((txt, cIdx) => {
          const td = make('td', cIdx >= 3 || row.isSummary ? 'is-summary-cell' : '', txt);
          if (isHi) {
            if (cIdx === 4 || (row.isSummary && cIdx === 3)) td.classList.add('cell-focus');
            else if (txt.includes('ข้าม')) td.classList.add('cell-target');
            else td.classList.add('cell-scan');
          }
          tr.append(td);
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v2-metrics-dcg') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = [
        'ลำดับ Top-3 & ผู้ใช้',
        '#1 ÷ log₂(2) = 1.0000',
        '#2 ÷ log₂(3) ≈ 0.6309',
        '#3 ÷ log₂(4) = 0.5000',
        'ผลรวม DCG@3',
        'nDCG@3 = DCG / IDCG'
      ];
      headers.forEach((h, i) => {
        const th = make('th', i >= 4 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const dcgRows = [
        {
          label: '🌟 อุดมคติ 👩 ฟ้า (A✓, C✓, E✓)',
          cells: ['🐍A ✓ → +1.0000', '📊C ✓ → +0.6309', '📐E ✓ → +0.5000', 'IDCG@3 = 2.1309', '2.1309 / 2.1309 = 1.0000 (เพดาน)']
        },
        {
          label: '🏆 โมเดล S · 👩 ฟ้า (A✓, C✓, B✕)',
          cells: ['🐍A ✓ → +1.0000', '📊C ✓ → +0.6309', '🎨B ✕ → +0.0000', 'DCG@3 = 1.6309', '1.6309 / 2.1309 ≈ 0.7654 🏆']
        },
        {
          label: '🤖 โมเดล T · 👩 ฟ้า (B✕, A✓, C✓)',
          cells: ['🎨B ✕ → +0.0000', '🐍A ✓ → +0.6309', '📊C ✓ → +0.5000', 'DCG@3 = 1.1309', '1.1309 / 2.1309 ≈ 0.5307']
        },
        {
          label: '🧑 พลอย · โมเดล T (B✓, A✕, D✓)',
          cells: ['🎨B ✓ → +1.0000', '🐍A ✕ → +0.0000', '📈D ✓ → +0.5000', 'DCG=1.5000 (IDCG=1.6309)', '1.5000 / 1.6309 ≈ 0.9197 🏆']
        }
      ];

      const tbody = document.createElement('tbody');
      dcgRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.label);
        rth.scope = 'row';
        tr.append(rth);
        row.cells.forEach((txt, cIdx) => {
          const td = make('td', cIdx >= 3 ? 'is-summary-cell' : '', txt);
          if (isHi) {
            if (cIdx === 4) td.classList.add('cell-focus');
            else if (txt.includes('+0.0000')) td.classList.add('cell-target');
            else td.classList.add('cell-scan');
          }
          tr.append(td);
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v2-metrics-auc') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = [
        'ของที่ชอบ i⁺ \\ ของที่ไม่ชอบ j⁻ (โมเดล T)',
        '🎨 B ✕ (อันดับ #1)',
        '📈 D ✕ (อันดับ #4)',
        '🖼️ F ✕ (อันดับ #5)',
        'จำนวนคู่ที่ i⁺ ชนะ j⁻'
      ];
      headers.forEach((h, i) => {
        const th = make('th', i === 4 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const aucRows = [
        {
          label: '🐍 คอร์ส A ✓ (อยู่อันดับ #2)',
          cells: ['✕ แพ้ B (#2 ตามหลัง #1)', '✅ ชนะ D (#2 นำหน้า #4)', '✅ ชนะ F (#2 นำหน้า #5)', 'ชนะ 2 / 3 คู่']
        },
        {
          label: '📊 คอร์ส C ✓ (อยู่อันดับ #3)',
          cells: ['✕ แพ้ B (#3 ตามหลัง #1)', '✅ ชนะ D (#3 นำหน้า #4)', '✅ ชนะ F (#3 นำหน้า #5)', 'ชนะ 2 / 3 คู่']
        },
        {
          label: '📐 คอร์ส E ✓ (อยู่อันดับ #6 บ๊วยสุด)',
          cells: ['✕ แพ้ B (#6 ตามหลัง #1)', '✕ แพ้ D (#6 ตามหลัง #4)', '✕ แพ้ F (#6 ตามหลัง #5)', 'ชนะ 0 / 3 คู่ 💥']
        },
        {
          label: 'สรุป AUC (👩 ฟ้า · 3 × 3 = 9 คู่)',
          cells: ['โมเดล T ชนะ 4 / 9 คู่', 'AUC(T) = 4/9 ≈ 0.4444', 'โมเดล S ชนะ 8 / 9 คู่', 'AUC(S) = 8/9 ≈ 0.8889 🏆'],
          isSummary: true
        }
      ];

      const tbody = document.createElement('tbody');
      aucRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx || b.secondRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.label);
        rth.scope = 'row';
        tr.append(rth);
        row.cells.forEach((txt, cIdx) => {
          const td = make('td', cIdx === 3 || row.isSummary ? 'is-summary-cell' : '', txt);
          if (isHi) {
            if (txt.includes('✅') || (row.isSummary && cIdx === 3)) td.classList.add('cell-focus');
            else if (txt.includes('✕') || txt.includes('💥')) td.classList.add('cell-target');
            else td.classList.add('cell-scan');
          }
          tr.append(td);
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v7-eval-coverage') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = [
        'คอร์สในคลัง (เรียงตามความถี่ cᵢ)',
        'ปรากฏบนจอ Top-3 ของใคร? (โมเดล S)',
        'ความถี่การโชว์ (cᵢ)',
        'ลำดับที่ i (1..6)',
        'พจน์ในสูตร Gini: (2i − 7)·cᵢ'
      ];
      headers.forEach((h, i) => {
        const th = make('th', (b.activeMode === 'coverage' && i === 2) || (b.activeMode === 'sort' && i === 3) || (b.activeMode === 'gini' && i === 4) ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const covRows = [
        { label: '📈 คอร์ส D (ไม่ถูกแนะนำเลย)', who: '— มุมอับ (0 คน)', c: '0 ครั้ง (0%)', i: 'i = 1 (c₁ = 0)', term: '(2(1) − 7) × 0 = 0', isZero: true },
        { label: '🖼️ คอร์ส F (ไม่ถูกแนะนำเลย)', who: '— มุมอับ (0 คน)', c: '0 ครั้ง (0%)', i: 'i = 2 (c₂ = 0)', term: '(2(2) − 7) × 0 = 0', isZero: true },
        { label: '🎨 คอร์ส B', who: '👩 ฟ้า (#3)', c: '1 ครั้ง (16.7%)', i: 'i = 3 (c₃ = 1)', term: '(2(3) − 7) × 1 = −1' },
        { label: '📐 คอร์ส E', who: '🧑 พลอย (#3)', c: '1 ครั้ง (16.7%)', i: 'i = 4 (c₄ = 1)', term: '(2(4) − 7) × 1 = +1' },
        { label: '🐍 คอร์ส A (ยอดฮิต)', who: '👩 ฟ้า (#1) · 🧑 พลอย (#1)', c: '2 ครั้ง (33.3%)', i: 'i = 5 (c₅ = 2)', term: '(2(5) − 7) × 2 = +6', isTop: true },
        { label: '📊 คอร์ส C (ยอดฮิต)', who: '👩 ฟ้า (#2) · 🧑 พลอย (#2)', c: '2 ครั้ง (33.3%)', i: 'i = 6 (c₆ = 2)', term: '(2(6) − 7) × 2 = +10', isTop: true },
        {
          label: 'สรุป Coverage@3 & Gini (n=6)',
          who: 'Union = {A, B, C, E} (4 วิชา)',
          c: 'Coverage@3 = 4/6 ≈ 0.6667',
          i: 'Σc = 6 ช่อง (รวมตัวที่เป็น 0!)',
          term: 'Gini = 16 / (6×6) = 4/9 ≈ 0.4444',
          isSummary: true
        }
      ];

      const tbody = document.createElement('tbody');
      covRows.forEach(row => {
        const tr = document.createElement('tr');
        const rth = make('th', row.isSummary ? 'is-active-header' : '', row.label);
        rth.scope = 'row';
        tr.append(rth);
        [row.who, row.c, row.i, row.term].forEach((txt, cIdx) => {
          const td = make('td', cIdx >= 1 || row.isSummary ? 'is-summary-cell' : '', txt);
          if (b.activeMode === 'union' && !row.isZero) td.classList.add(row.isSummary ? 'cell-focus' : 'cell-scan');
          if (b.activeMode === 'coverage' && cIdx === 1) td.classList.add(row.isZero ? 'cell-target' : 'cell-focus');
          if (b.activeMode === 'sort' && cIdx === 2) td.classList.add(row.isZero ? 'cell-target' : 'cell-scan');
          if (b.activeMode === 'gini' && cIdx === 3) td.classList.add(row.isSummary ? 'cell-focus' : 'cell-scan');
          tr.append(td);
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v8-eval-time-split') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = [
        'มิติของการแบ่งข้อมูล',
        '📅 วัน 1–3 (อดีต)',
        '📅 วัน 4 (จุดจูน)',
        '📅 วัน 5–6 (อนาคต)',
        'กฎเหล็กที่ต้องตรวจ'
      ];
      headers.forEach((h, i) => {
        const th = make('th', i === 4 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const splitRows = [
        {
          label: '1 · หน้าที่ของชุดข้อมูล',
          cells: ['🏋️ Train (ฝึกพารามิเตอร์)', '🎛️ Validation (เลือก K / น้ำหนัก)', '🔒 Test (ตรวจขั้นสุดท้าย)', 'ห้ามใช้ Test เลือกโมเดลเด็ดขาด']
        },
        {
          label: '2 · Global Temporal Split',
          cells: ['ตัดจบสิ้นวัน 3 พร้อมกันทุกคน', 'เหตุการณ์วัน 4 เป็น Val', 'เหตุการณ์วัน 5–6 เป็น Test', 'จำลองการตัดสินใจตามเวลาจริง']
        },
        {
          label: '3 · Per-user vs Random Split',
          cells: ['Per-user: กันช่วงท้ายรายคน', 'Random: สุ่มปนทุกวัน ⚠️', 'Random ดึงวัน 6 มาทายวัน 2', 'Random รั่วเวลาเมื่อโจทย์คือทายอนาคต']
        },
        {
          label: '4 · ความพร้อมของคอร์สใหม่ (📐 E)',
          cells: ['ณ วัน 3: ยังไม่มี 📐 คอร์ส E', 'ณ วัน 4: ยังไม่มี 📐 คอร์ส E', '🆕 📐 คอร์ส E เปิดตัววัน 5', '🚫 ห้ามใส่ 📐 E เป็นตัวเลือกในวัน 3']
        }
      ];

      const tbody = document.createElement('tbody');
      splitRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.label);
        rth.scope = 'row';
        tr.append(rth);
        row.cells.forEach((txt, cIdx) => {
          const td = make('td', cIdx === 3 ? 'is-summary-cell' : '', txt);
          if (isHi) {
            if (cIdx === 3) td.classList.add('cell-focus');
            else if (txt.includes('⚠️') || txt.includes('🆕')) td.classList.add('cell-target');
            else td.classList.add('cell-scan');
          }
          tr.append(td);
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v8-eval-leakage') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = [
        'จุดเสี่ยงข้อมูลรั่ว (Leakage)',
        '❌ กระบวนการที่รั่ว (Leaky)',
        'ทำไมถึงผิดกติกา?',
        '✅ กระบวนการที่ถูกต้อง (Clean)'
      ];
      headers.forEach((h, i) => {
        const th = make('th', i === 3 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const leakRows = [
        {
          label: '1 · สถิติ TF-IDF / ความนิยม',
          cells: ['fit สถิติรวมวัน 1–6 ก่อนแบ่ง Split', 'IDF และความนิยมแอบจำอนาคตวัน 5–6', 'Split ก่อน → fit(Train) → transform ชุดอื่น']
        },
        {
          label: '2 · การสร้าง User Profile',
          cells: ['ดึงดาวทุกช่องรวม Test มาหาค่าเฉลี่ย r̄ᵤ', 'คำตอบที่ต้องทายกลับเข้าไปปนใน Input', 'สร้างโปรไฟล์จากประวัติใน Train เท่านั้น']
        },
        {
          label: '3 · การคัดกรองผู้ใช้ (Filtering)',
          cells: ['คัดเฉพาะคนที่เรียน ≥10 วิชาเมื่อนับถึงวัน 6', 'ใช้อนาคตเลือกกลุ่มคนโดยไม่ประกาศ', 'คัดจากข้อมูลที่มีสิทธิ์รู้ ณ จุดตัดเวลา']
        },
        {
          label: '4 · การจูนเลือกโมเดลบน Test',
          cells: ['รันดูผล Test หลายรอบแล้วเลือกตัวที่ชนะ', 'Test กลายเป็นชุดจูน (สูญเสียความอิสระ)', 'จูนบน Validation · เปิด Test ครั้งสุดท้าย']
        }
      ];

      const tbody = document.createElement('tbody');
      leakRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.label);
        rth.scope = 'row';
        tr.append(rth);
        row.cells.forEach((txt, cIdx) => {
          const td = make('td', cIdx === 2 ? 'is-summary-cell' : '', txt);
          if (isHi) {
            if (cIdx === 0) td.classList.add('cell-target');
            else if (cIdx === 1) td.classList.add('cell-scan');
            else if (cIdx === 2) td.classList.add('cell-focus');
          }
          tr.append(td);
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v4-eval-sampling') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = [
        'โมเดล (K = 1 · บวก 🐍A 1 · ลบ 5)',
        '1 · อันดับจริงของ 🐍 A (ทั้งคลัง 6 ชิ้น)',
        '2 · วัดเต็มคลัง (Full HR@1)',
        '3 · กลไกเมื่อสุ่มลบแค่ m = 1 จาก 5 ตัว',
        '4 · ค่าคาดหมาย Sampled HR@1'
      ];
      headers.forEach((h, i) => {
        const th = make('th', b.activeCol === i ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const sampRows = [
        {
          label: '🤖 โมเดล P (เกาะกลุ่มหัวตาราง)',
          cells: [
            'คน 1: อันดับ #2 · คน 2: อันดับ #2',
            '0 / 2 = 0.00 (แพ้ Full)',
            'มีลบเหนือ A แค่ 1 ตัว · ลบใต้ A ถึง 4 ตัว',
            '4/5 = 0.80 🏆 (พลิกกลับมาชนะ!)'
          ]
        },
        {
          label: '🏆 โมเดล Q (สุดโต่ง #1 กับ #6)',
          cells: [
            'คน 1: อันดับ #1 · คน 2: อันดับ #6',
            '1 / 2 = 0.50 🏆 (ชนะ Full!)',
            'คน 1 ชนะเสมอ (1.0) · คน 2 แพ้เสมอ (0.0)',
            '(1.0 + 0.0) ÷ 2 = 0.50 (กลายเป็นแพ้ P!)'
          ]
        }
      ];

      const tbody = document.createElement('tbody');
      sampRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const rth = make('th', 'is-active-header', row.label);
        rth.scope = 'row';
        tr.append(rth);
        row.cells.forEach((txt, cIdx) => {
          const colNum = cIdx + 1;
          const td = make('td', colNum === 2 || colNum === 4 ? 'is-summary-cell' : '', txt);
          if (b.activeCol === colNum) {
            if ((colNum === 2 && rIdx === 1) || (colNum === 4 && rIdx === 0)) td.classList.add('cell-focus');
            else if ((colNum === 2 && rIdx === 0) || (colNum === 4 && rIdx === 1)) td.classList.add('cell-target');
            else td.classList.add('cell-scan');
          }
          tr.append(td);
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v4-eval-bootstrap') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = [
        'หน่วยสุ่ม (ผู้ใช้ที่จับคู่ S/T)',
        'คะแนนโมเดล S',
        'คะแนนโมเดล T',
        'ผลต่างรายคน (Δ = T − S)',
        'การตีความทางสถิติ'
      ];
      headers.forEach((h, i) => {
        const th = make('th', b.focusCol === i ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const bootRows = [
        { label: '👤 ผู้ใช้ u₁', s: '0.40', t: '0.44', d: '+0.04 (T ดีกว่า)', note: 'เก็บคู่ (0.40, 0.44) ไปด้วยกันเสมอ' },
        { label: '👤 ผู้ใช้ u₂', s: '0.50', t: '0.51', d: '+0.01 (T ดีกว่าเล็กน้อย)', note: 'เก็บคู่ (0.50, 0.51) ไปด้วยกันเสมอ' },
        { label: '👤 ผู้ใช้ u₃ (จุดสังเกต)', s: '0.60', t: '0.58', d: '−0.02 (⚠️ T แย่ลง!)', note: 'ค่าเฉลี่ยรวมบวก แต่ u₃ เสียประโยชน์', isNeg: true },
        { label: '👤 ผู้ใช้ u₄', s: '0.70', t: '0.75', d: '+0.05 (T ดีกว่า)', note: 'เก็บคู่ (0.70, 0.75) ไปด้วยกันเสมอ' },
        {
          label: 'สรุป Bootstrap (256 ชุดซ้ำ)',
          s: 'S̄ = 0.5500',
          t: 'T̄ = 0.5700',
          d: 'Mean Δ = +0.0200',
          note: '95% CI = [−0.0050, +0.0450] (คร่อม 0!)',
          isSummary: true
        }
      ];

      const tbody = document.createElement('tbody');
      bootRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx || (b.activeRow === null && !row.isSummary);
        const rth = make('th', isHi ? 'is-active-header' : '', row.label);
        rth.scope = 'row';
        tr.append(rth);
        [row.s, row.t, row.d, row.note].forEach((txt, cIdx) => {
          const td = make('td', cIdx >= 2 || row.isSummary ? 'is-summary-cell' : '', txt);
          if (isHi) {
            if (row.isNeg && cIdx === 2) td.classList.add('cell-target');
            else if (row.isSummary && cIdx === 3) td.classList.add('cell-target');
            else if (cIdx === 2) td.classList.add('cell-focus');
            else td.classList.add('cell-scan');
          }
          tr.append(td);
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v7-eval-counterfactual') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = [
        'เหตุการณ์ใน Log',
        'โอกาสระบบเก่า (π₀)',
        'โอกาสระบบใหม่ (π)',
        'ผลตอบแทน (r)',
        'น้ำหนัก w = π / π₀',
        'ผลคูณถ่วงน้ำหนัก (w · r)'
      ];
      headers.forEach((h, i) => {
        const th = make('th', i >= 4 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const ipsRows = [
        {
          label: 'เหตุการณ์ที่ 1 (ของฮิตเดิม)',
          cells: ['π₀ = 0.50 (โชว์บ่อย)', 'π = 0.25 (ลดการโชว์)', 'r₁ = 1 (คลิก ✓)', '0.25 / 0.50 = 0.50', '0.50 × 1 = 0.50']
        },
        {
          label: 'เหตุการณ์ที่ 2 (ของที่ใหม่ดัน)',
          cells: ['π₀ = 0.25 (โชว์น้อย)', 'π = 0.50 (เพิ่มการโชว์)', 'r₂ = 0 (ไม่คลิก)', '0.50 / 0.25 = 2.00', '2.00 × 0 = 0.00']
        },
        {
          label: 'กรณีอันตราย (ขาด Overlap)',
          cells: ['π₀ = 0.00 (ไม่เคยโชว์!)', 'π = 0.30 (อยากแนะนำ)', 'r = ? (ไม่มีใน Log)', '0.30 / 0 = หารศูนย์! 💥', 'ประเมินไม่ได้ (No Overlap)'],
          isDanger: true
        },
        {
          label: 'สรุป IPS vs SNIPS (n = 2)',
          cells: ['Σw = 0.50 + 2.00 = 2.50', 'Σ(w·r) = 0.50', 'IPS = 0.50 / 2 = 0.2500', 'SNIPS = 0.50 / 2.50 = 0.2000', 'SNIPS หารด้วย Σw เพื่อลดความแปรปรวน'],
          isSummary: true
        }
      ];

      const tbody = document.createElement('tbody');
      ipsRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx || b.secondRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.label);
        rth.scope = 'row';
        tr.append(rth);
        row.cells.forEach((txt, cIdx) => {
          const td = make('td', cIdx >= 3 || row.isSummary ? 'is-summary-cell' : '', txt);
          if (isHi) {
            if (row.isDanger) td.classList.add('cell-target');
            else if (b.focusMode === 'ips' && cIdx === 2) td.classList.add('cell-focus');
            else if (b.focusMode === 'snips' && cIdx === 3) td.classList.add('cell-focus');
            else if (cIdx >= 3) td.classList.add('cell-focus');
            else td.classList.add('cell-scan');
          }
          tr.append(td);
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v1-cb-text') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = [
        'คอร์สเรียน (ชุดข้อมูล)',
        'ข้อความดิบ → ตัดคำ & Lowercase',
        '🐍 python',
        '📊 data',
        '🎨 design',
        '🖼️ art',
        'สถานะเวกเตอร์'
      ];
      headers.forEach((h, i) => {
        const isHi = (b.focusMode === 'vocab' && i >= 2 && i <= 5) ||
                     (b.focusMode === 'clean' && i === 1) ||
                     (b.focusMode === 'counts' && i >= 2) ||
                     (b.focusMode === 'oov' && i === 6);
        const th = make('th', isHi ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const textRows = [
        {
          label: '🐍 T1 · Python พื้นฐาน (Train)',
          clean: '"Python! DATA data" → python · data · data',
          counts: ['1', '2', '0', '0'],
          status: '[1, 2, 0, 0] (Fit คลังคำ)'
        },
        {
          label: '📊 T2 · วิเคราะห์ข้อมูล (Train)',
          clean: '"Python Data" → python · data',
          counts: ['1', '1', '0', '0'],
          status: '[1, 1, 0, 0] (Fit คลังคำ)'
        },
        {
          label: '🎨 T3 · ออกแบบโปสเตอร์ (Train)',
          clean: '"Design & Art" → design · art',
          counts: ['0', '0', '1', '1'],
          status: '[0, 0, 1, 1] (Fit คลังคำ)'
        },
        {
          label: '📈 T4 · Data Viz (Train)',
          clean: '"Data, Design" → data · design',
          counts: ['0', '1', '1', '0'],
          status: '[0, 1, 1, 0] (Fit คลังคำ)'
        },
        {
          label: '🍳 T6 · ทำอาหาร (คอร์สใหม่)',
          clean: '"Cooking" → cooking (ไม่อยู่ในคลังคำ!)',
          counts: ['0', '0', '0', '0'],
          status: '⚠️ OOV → [0, 0, 0, 0]',
          isOov: true
        }
      ];

      const tbody = document.createElement('tbody');
      textRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx || (b.focusMode === 'vocab' && !row.isOov);
        const rth = make('th', isHi ? 'is-active-header' : '', row.label);
        rth.scope = 'row';
        tr.append(rth);

        const tdClean = make('td', '', row.clean);
        if (isHi && b.focusMode === 'clean') tdClean.classList.add('cell-focus');
        else if (isHi && row.isOov) tdClean.classList.add('cell-target');
        tr.append(tdClean);

        row.counts.forEach(cVal => {
          const tdC = make('td', 'is-summary-cell', cVal);
          if (b.focusMode === 'vocab' && !row.isOov && cVal !== '0') tdC.classList.add('cell-scan');
          if (b.focusMode === 'counts' && rIdx === 0 && cVal !== '0') tdC.classList.add('cell-focus');
          if (b.focusMode === 'oov' && row.isOov) tdC.classList.add('cell-target');
          tr.append(tdC);
        });

        const tdStat = make('td', 'is-summary-cell', row.status);
        if (isHi) tdStat.classList.add(row.isOov ? 'cell-target' : 'cell-focus');
        tr.append(tdStat);
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v1-cb-tfidf') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = [
        'แถวข้อมูล (N = 4 คอร์สฝึก)',
        '🐍 python (DF=2)',
        '📊 data (DF=3 คำโหล)',
        '🎨 design (DF=2)',
        '🖼️ art (DF=1 หายาก)',
        'ความยาว ‖v‖₂ / สรุป'
      ];
      headers.forEach((h, i) => {
        const th = make('th', b.focusCol === i || i === 5 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const tfidfRows = [
        {
          label: '1 · ค่า Smooth IDF = ln(5/(1+DF))+1',
          cells: ['IDF = 1.5108', 'IDF = 1.2231 (ต่ำสุด!)', 'IDF = 1.5108', 'IDF = 1.9163 🏆 (สูงสุด)', 'คำโหล DF สูง → IDF ต่ำ']
        },
        {
          label: '2 · 🐍 คอร์ส T1 (TF = [1, 2, 0, 0])',
          cells: ['1 × 1.5108 = 1.5108', '2 × 1.2231 = 2.4463', '0', '0', '‖T1‖₂ ≈ 2.875']
        },
        {
          label: '3 · 📊 คอร์ส T2 (TF = [1, 1, 0, 0])',
          cells: ['1 × 1.5108 = 1.5108', '1 × 1.2231 = 1.2231', '0', '0', '‖T2‖₂ ≈ 1.942']
        },
        {
          label: '4 · 🎨 คอร์ส T3 (TF = [0, 0, 1, 1])',
          cells: ['0', '0', '1 × 1.5108 = 1.5108', '1 × 1.9163 = 1.9163 🏆', '‖T3‖₂ ≈ 2.440']
        },
        {
          label: '5 · เทียบ Log TF (1+log₂TF) & ข้อจำกัด',
          cells: ['TF=1 → ได้ 1.00', 'TF=4 → ได้ 3.00 (ไม่พุ่ง 4×)', 'ลดการปั๊มคีย์เวิร์ดซ้ำ', '⚠️ ตาบอดต่อ Synonyms', '"หมอ"≠"แพทย์" ได้ 0'],
          isSummary: true
        }
      ];

      const tbody = document.createElement('tbody');
      tfidfRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.label);
        rth.scope = 'row';
        tr.append(rth);
        row.cells.forEach((txt, cIdx) => {
          const td = make('td', cIdx === 4 || row.isSummary ? 'is-summary-cell' : '', txt);
          if (isHi) {
            if (txt.includes('ต่ำสุด') || txt.includes('⚠️')) td.classList.add('cell-target');
            else if (txt.includes('🏆') || cIdx === 4 || (rIdx === 1 && cIdx <= 1)) td.classList.add('cell-focus');
            else td.classList.add('cell-scan');
          }
          tr.append(td);
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v3-cb-cosine') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = [
        'เวกเตอร์คอร์สเรียน',
        '🐍 แกน python',
        '📊 แกน data',
        '🎨 แกน design / art',
        'Dot Product & ความยาว L2',
        'Cosine Similarity (มุม)'
      ];
      headers.forEach((h, i) => {
        const th = make('th', i >= 4 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const cosRows = [
        {
          label: '🐍 คอร์ส T1 (บรรยายยาวกว่า)',
          tone: 'user',
          pVal: 1.51, pNote: 'TF-IDF = 1.5108',
          dVal: 2.45, dNote: 'TF-IDF = 2.4463',
          oText: '0 , 0',
          dotNorm: '‖T1‖₂ = √8.266 ≈ 2.875',
          cos: 'Unit u₁ = (0.53, 0.85, 0, 0)'
        },
        {
          label: '📊 คอร์ส T2 (เนื้อหาแนวเดียวกัน)',
          tone: 'item-a',
          pVal: 1.51, pNote: '1.51 × 1.51 = +2.2826',
          dVal: 1.22, dNote: '2.45 × 1.22 = +2.9919',
          oText: '0 , 0',
          dotNorm: 'Dot = 5.2745 · ‖T2‖₂ ≈ 1.942',
          cos: '5.2745 ÷ 5.583 = 0.9447 🏆'
        },
        {
          label: '🎨 คอร์ส T3 (คนละสาย · ตั้งฉาก 90°)',
          tone: 'item-b',
          pVal: 0, pNote: '1.51 × 0 = 0',
          dVal: 0, dNote: '2.45 × 0 = 0',
          oText: '1.51 , 1.92 (คนละแกน)',
          dotNorm: 'Dot(T1, T3) = 0.0000',
          cos: 'cos(90°) = 0.0000 (ตั้งฉาก)'
        }
      ];

      const tbody = document.createElement('tbody');
      cosRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = (b.stepMode === 'length' && rIdx <= 1) ||
                     (b.stepMode === 'dot' && rIdx <= 1) ||
                     (b.stepMode === 'cosine' && rIdx === 1) ||
                     (b.stepMode === 'ortho' && rIdx === 2);
        const rth = make('th', isHi ? 'is-active-header' : '', row.label);
        rth.scope = 'row';
        tr.append(rth);

        const tdP = make('td', b.stepMode === 'dot' && rIdx <= 1 ? 'cell-scan' : '');
        tdP.innerHTML = `
          <div class="rs-wb-inline-vec">
            <div class="rs-wb-bar-track"><span class="rs-wb-bar-fill ${row.tone}" style="width:${Math.round((row.pVal / 2.5) * 100)}%"></span></div>
            <span class="rs-wb-inline-meta"><b>${row.pVal.toFixed(2)}</b><small>${row.pNote}</small></span>
          </div>
        `;

        const tdD = make('td', b.stepMode === 'dot' && rIdx <= 1 ? 'cell-scan' : '');
        tdD.innerHTML = `
          <div class="rs-wb-inline-vec">
            <div class="rs-wb-bar-track"><span class="rs-wb-bar-fill ${row.tone}" style="width:${Math.round((row.dVal / 2.5) * 100)}%"></span></div>
            <span class="rs-wb-inline-meta"><b>${row.dVal.toFixed(2)}</b><small>${row.dNote}</small></span>
          </div>
        `;

        const tdO = make('td', `is-summary-cell${b.stepMode === 'ortho' && rIdx === 2 ? ' cell-target' : ''}`, row.oText);
        const tdDot = make('td', `is-summary-cell${(b.stepMode === 'length' || b.stepMode === 'dot') && rIdx <= 1 ? ' cell-focus' : ''}`, row.dotNorm);
        const tdCos = make('td', `is-summary-cell${(b.stepMode === 'cosine' && rIdx === 1) || (b.stepMode === 'ortho' && rIdx === 2) ? ' cell-focus' : ''}`, row.cos);

        tr.append(tdP, tdD, tdO, tdDot, tdCos);
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v3-cb-bm25') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = [
        'คอร์ส / กลไก BM25 (q = "python data")',
        'ความยาว |d| เทียบ avgdl (2.25)',
        'ตัวหารความยาว (b = 0.75)',
        'แต้มรายคำ (คุมอิ่มตัว k₁ = 1.5)',
        'คะแนนรวม BM25'
      ];
      headers.forEach((h, i) => {
        const th = make('th', i === 4 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const bmRows = [
        {
          label: '1 · เพดานอิ่มตัวคำซ้ำ (k₁ = 1.5)',
          cells: ['ซ้ำ f=1 ได้ 1.00 · f=2 ได้ 1.43', 'ซ้ำ f=100 ตันที่ k₁+1 = 2.50', 'คะแนนไม่พุ่งเป็นเส้นตรง', 'ป้องกันการปั๊มคำซ้ำ (Stuffing)']
        },
        {
          label: '2 · 🐍 คอร์ส T1 ("python data data")',
          cells: ['ยาว 3 คำ (> avgdl 2.25)', 'ตัวหาร = 1.25 (โดนโทษความยาว)', 'python: 0.90 + data(ซ้ำ 2): 1.24', 'BM25(T1) = 2.14']
        },
        {
          label: '3 · 📊 คอร์ส T2 ("python data")',
          cells: ['ยาว 2 คำ (< avgdl กระชับ!)', 'ตัวหาร = 0.92 (ได้โบนัสความกระชับ)', 'python: 1.28 + data(1): 1.17', 'BM25(T2) = 2.45 🏆 (ชนะ T1!)']
        },
        {
          label: '4 · กรณีตั้งค่า b = 0 (ปิดชดเชยความยาว)',
          cells: ['ไม่สนความยาวเอกสารเลย', 'ตัวหาร = 1.00 เท่ากันทุกคอร์ส', 'เลิกหักโทษเอกสารที่เขียนยาว', 'b คุมโทษความยาว · k₁ คุมคำซ้ำ'],
          isSummary: true
        }
      ];

      const tbody = document.createElement('tbody');
      bmRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.label);
        rth.scope = 'row';
        tr.append(rth);
        row.cells.forEach((txt, cIdx) => {
          const td = make('td', cIdx >= 2 || row.isSummary ? 'is-summary-cell' : '', txt);
          if (isHi) {
            if (txt.includes('โดนโทษ')) td.classList.add('cell-target');
            else if (cIdx === 3 || txt.includes('🏆')) td.classList.add('cell-focus');
            else td.classList.add('cell-scan');
          }
          tr.append(td);
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v3-cb-embedding') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = [
        'โจทย์ทดสอบความเข้าใจภาษา',
        'Sparse Vector (TF-IDF / BM25)',
        'Static Embedding (Word2Vec)',
        'Contextual Embedding (BERT / SBERT)'
      ];
      headers.forEach((h, i) => {
        const th = make('th', i === 3 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const embRows = [
        {
          label: '1 · คำพ้อง (Synonyms): "🚗 รถยนต์" vs "🚙 ยานพาหนะ"',
          cells: ['✕ คนละคอลัมน์ → Cosine = 0.00', '✅ พิกัดใกล้กัน → Cosine = 0.88', '🏆 เข้าใจความหมายตรงกัน → Cosine = 0.92']
        },
        {
          label: '2 · คำกำกวม (Polysemy): "Bank ธนาคาร" vs "Bank ริมตลิ่ง"',
          cells: ['✕ สะกดเหมือนกัน → มองเป็นคำเดียว', '✕ ให้เวกเตอร์เดิมตายตัว แยกบริบทไม่ได้', '🏆 อ่านทั้งประโยค → แยกคนละเวกเตอร์ชัดเจน']
        },
        {
          label: '3 · รหัสเฉพาะทาง: "วิชา 204729" / "RTX-4090"',
          cells: ['🏆 จับคู่ตัวสะกดตรงเป๊ะ 100% (Exact Match)', '⚠️ มักติด OOV หากไม่เคยเห็นรหัสนี้', '⚠️ อาจบีบเป็นความหมายกว้างๆ (จึงต้องใช้คู่ BM25)']
        },
        {
          label: '4 · รวมคำเป็นเวกเตอร์คอร์ส (Mean Pooling)',
          cells: ['นับความถี่แยกคอลัมน์ (Sparse ยาวมาก)', 'เฉลี่ยเวกเตอร์คำตายตัวในประโยค', '🏆 เฉลี่ยเวกเตอร์ทุกโทเคนตามบริบท + L2 Normalize'],
          isSummary: true
        }
      ];

      const tbody = document.createElement('tbody');
      embRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.label);
        rth.scope = 'row';
        tr.append(rth);
        row.cells.forEach((txt, cIdx) => {
          const td = make('td', row.isSummary ? 'is-summary-cell' : '', txt);
          if (isHi) {
            if (txt.includes('🏆') || txt.includes('✅')) td.classList.add('cell-focus');
            else if (txt.includes('✕') || txt.includes('⚠️')) td.classList.add('cell-target');
            else td.classList.add('cell-scan');
          }
          tr.append(td);
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v3-cb-profile') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = [
        'เวกเตอร์ (คอร์สที่เรียน / โปรไฟล์ 👩 ฟ้า)',
        '💻 แกนที่ 1: สายโค้ด',
        '🎨 แกนที่ 2: สายภาพ',
        'ความยาว ‖v‖₂',
        'บทบาทในการจับคู่'
      ];
      headers.forEach((h, i) => {
        const th = make('th', i >= 3 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const profRows = [
        {
          label: '🐍 คอร์ส T1 (ฟ้าเคยเรียน · w₁ = 3)',
          tone: 'item-a',
          d1: 1.00, d1Note: 'โค้ดล้วน 1.00',
          d2: 0.00, d2Note: 'สายภาพ 0.00',
          norm: '‖T1‖₂ = 1.0000',
          role: 'ประวัติใน Train ชิ้นที่ 1'
        },
        {
          label: '📊 คอร์ส T2 (ฟ้าเคยเรียน · w₂ = 1)',
          tone: 'item-b',
          d1: 0.80, d1Note: 'โค้ด 0.80',
          d2: 0.60, d2Note: 'สายภาพ 0.60',
          norm: '‖T2‖₂ = 1.0000',
          role: 'ประวัติใน Train ชิ้นที่ 2'
        },
        {
          label: '1 · Unweighted Centroid (c = เฉลี่ย ÷ 2)',
          tone: 'user',
          d1: 0.90, d1Note: '(1.0+0.8)÷2 = 0.90',
          d2: 0.30, d2Note: '(0.0+0.6)÷2 = 0.30',
          norm: '‖c‖₂ = √0.90 ≈ 0.9487 (<1)',
          role: 'จุดกึ่งกลางรสนิยม (ยังสั้นกว่า 1)'
        },
        {
          label: '2 · Normalized Profile (p = c / ‖c‖₂)',
          tone: 'user',
          d1: 0.95, d1Note: '0.90 ÷ 0.9487 = 0.9487',
          d2: 0.32, d2Note: '0.30 ÷ 0.9487 = 0.3162',
          norm: '‖p‖₂ = 1.0000 🏆',
          role: 'คูณ 🆕 T5 ได้ Cosine = 0.9993 🏆'
        },
        {
          label: '3 · Weighted Centroid (ถ่วงน้ำหนัก 3 : 1)',
          tone: 'user',
          d1: 0.95, d1Note: '(3(1)+1(0.8))÷4 = 0.95',
          d2: 0.15, d2Note: '(3(0)+1(0.6))÷4 = 0.15',
          norm: 'เอนเข้าหา 🐍 T1 ชัดเจน',
          role: 'ถ้าชอบหลายขั้วห่างกัน → ใช้ Multi-Interest'
        }
      ];

      const tbody = document.createElement('tbody');
      profRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx || (rIdx <= 1 && b.activeRow === 2);
        const rth = make('th', isHi ? 'is-active-header' : '', row.label);
        rth.scope = 'row';
        tr.append(rth);

        const td1 = make('td', isHi ? 'cell-scan' : '');
        td1.innerHTML = `
          <div class="rs-wb-inline-vec">
            <div class="rs-wb-bar-track"><span class="rs-wb-bar-fill ${row.tone}" style="width:${Math.round(row.d1 * 100)}%"></span></div>
            <span class="rs-wb-inline-meta"><b>${row.d1.toFixed(2)}</b><small>${row.d1Note}</small></span>
          </div>
        `;

        const td2 = make('td', isHi ? 'cell-scan' : '');
        td2.innerHTML = `
          <div class="rs-wb-inline-vec">
            <div class="rs-wb-bar-track"><span class="rs-wb-bar-fill ${row.tone}" style="width:${Math.round(row.d2 * 100)}%"></span></div>
            <span class="rs-wb-inline-meta"><b>${row.d2.toFixed(2)}</b><small>${row.d2Note}</small></span>
          </div>
        `;

        const tdNorm = make('td', 'is-summary-cell', row.norm);
        const tdRole = make('td', 'is-summary-cell', row.role);
        if (b.activeRow === rIdx) {
          tdNorm.classList.add(rIdx === 2 ? 'cell-target' : 'cell-focus');
          tdRole.classList.add(b.highlightWarn ? 'cell-target' : 'cell-focus');
        }

        tr.append(td1, td2, tdNorm, tdRole);
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v6-cb-retrieval') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = [
        'วิธีค้นหาเวกเตอร์ (คลังล้านชิ้น)',
        'กลไกการค้นหา',
        'ความเร็ว (Latency)',
        'การใช้ RAM',
        'ผลลัพธ์ Top-3 & Index Recall@3'
      ];
      headers.forEach((h, i) => {
        const th = make('th', i === 4 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const retRows = [
        {
          label: '1 · Exact Flat Search (สแกนครบ)',
          cells: ['ตรวจเทียบครบทุกชิ้น O(Nd)', '⚠️ ~150 ms (ช้าเกินเมื่อคลังใหญ่)', 'ปานกลาง (เก็บเวกเตอร์ดิบ)', 'Exact Top-3 = {🆕T5, 📈T4, 🎨T3} (100%)']
        },
        {
          label: '2 · HNSW (กราฟหลายชั้น)',
          cells: ['กระโดดข้ามชั้นกราฟ O(log N)', '🏆 ~2 ms (เร็วระดับเสี้ยววินาที)', 'สูง (เก็บเส้นเชื่อมกราฟ)', 'ANN Top-3 = {🆕T5, 📈T4, 🍳T6}']
        },
        {
          label: '3 · IVF-PQ (แบ่งเซลล์ + บีบอัด)',
          cells: ['ค้นเฉพาะเซลล์ใกล้เคียง + ย่อรหัส', '⚡ ~5 ms (เร็วมาก)', '🏆 ต่ำมาก (ประหยัด RAM สูงสุด)', 'เหมาะกับคลังระดับร้อยล้าน–พันล้านชิ้น']
        },
        {
          label: '4 · สรุป Index Recall@3 & กฎ M ≫ K',
          cells: ['|ANN ∩ Exact| = |{T5, T4}| = 2 ชิ้น', 'Index Recall@3 = 2/3 ≈ 66.7%', 'ดึง M = 100 ส่งให้ Re-rank คัด K = 5', '⚠️ ถ้าหลุดจาก M ด่าน Re-rank กู้คืนไม่ได้!'],
          isSummary: true
        }
      ];

      const tbody = document.createElement('tbody');
      retRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx || b.secondRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.label);
        rth.scope = 'row';
        tr.append(rth);
        row.cells.forEach((txt, cIdx) => {
          const td = make('td', cIdx === 3 || row.isSummary ? 'is-summary-cell' : '', txt);
          if (isHi) {
            if (txt.includes('⚠️')) td.classList.add('cell-target');
            else if (txt.includes('🏆') || txt.includes('66.7%')) td.classList.add('cell-focus');
            else td.classList.add('cell-scan');
          }
          tr.append(td);
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v4-cb-rerank') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = [
        'คอร์สผู้สมัคร',
        '1 · BM25 ดิบ (อันดับ)',
        '2 · Semantic ดิบ (อันดับ)',
        '3 · ❌ บวกดิบตรงๆ (พัง!)',
        '4 · ✅ Min–Max Fusion (α=0.5)',
        '5 · ✅ RRF (c = 60)'
      ];
      headers.forEach((h, i) => {
        const th = make('th', b.activeCol === i ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const rerankRows = [
        {
          label: '🐍 คอร์ส F1 (เด่นคำตรงเป๊ะ)',
          cells: [
            '20.0 (อันดับ #1)',
            '0.20 (อันดับ #3)',
            '20.20 ⚠️ (BM25 กลืนมิด!)',
            '0.5(1.00) + 0.5(0.00) = 0.5000',
            '1/61 + 1/63 = 0.03227'
          ]
        },
        {
          label: '📊 คอร์ส F2 (สมดุลทั้งสองฝั่ง)',
          cells: [
            '10.0 (อันดับ #2)',
            '0.60 (อันดับ #2)',
            '10.60 (แพ้ F1 ขาดลอย)',
            '0.5(0.50) + 0.5(0.5714) = 0.5357 🏆',
            '1/62 + 1/62 = 0.03226 🏆 (เสถียร)'
          ]
        },
        {
          label: '🎨 คอร์ส F3 (เด่นความหมายแฝง)',
          cells: [
            '0.0 (อันดับ #3)',
            '0.90 (อันดับ #1)',
            '0.90 ⚠️ (จมบ๊วยเพราะสเกลเล็ก)',
            '0.5(0.00) + 0.5(1.00) = 0.5000',
            '1/63 + 1/61 = 0.03227'
          ]
        },
        {
          label: 'สรุปกฎวิศวกรรม Hybrid',
          cells: [
            'สเกลใหญ่ (0–20)',
            'สเกลเล็ก (0–1)',
            'ห้ามบวกข้ามสเกลตรงๆ',
            'ย่อสู่ [0,1] (ยังไม่ใช่ Probability!)',
            'ใช้เฉพาะ Rank → ส่งต่อ Cross-Encoder'
          ],
          isSummary: true
        }
      ];

      const tbody = document.createElement('tbody');
      rerankRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = !row.isSummary || b.highlightSummary;
        const rth = make('th', (rIdx === 1 && b.activeCol >= 4) || (row.isSummary && b.highlightSummary) ? 'is-active-header' : '', row.label);
        rth.scope = 'row';
        tr.append(rth);
        row.cells.forEach((txt, cIdx) => {
          const colNum = cIdx + 1;
          const td = make('td', colNum >= 3 || row.isSummary ? 'is-summary-cell' : '', txt);
          if (b.activeCol === colNum || (b.highlightSummary && row.isSummary)) {
            if (txt.includes('⚠️') || txt.includes('ห้าม')) td.classList.add('cell-target');
            else if (txt.includes('🏆') || (row.isSummary && colNum >= 4)) td.classList.add('cell-focus');
            else if (isHi) td.classList.add('cell-scan');
          }
          tr.append(td);
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v2-cb-mmr') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = [
        'คอร์สผู้สมัคร (λ = 0.7)',
        'ความตรงใจ Rel(d)',
        'ความคล้ายกับ S={🐍X}',
        'คำนวณรอบที่ 2: 0.7·Rel − 0.3·Sim',
        'ผลลัพธ์การจัดสล็อต Top-2'
      ];
      headers.forEach((h, i) => {
        const th = make('th', i >= 3 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const mmrRows = [
        {
          label: '🐍 คอร์ส X (Python พื้นฐาน 1)',
          cells: [
            'Rel = 0.90 (สูงสุด)',
            '— (เลือกเป็นชิ้นแรกในรอบ 1)',
            'รอบที่ 1: ได้คะแนนสูงสุด 0.900',
            '🏆 ติดสล็อตอันดับ #1 (S = {X})'
          ]
        },
        {
          label: '🐍 คอร์ส Y (Python 2 · ซ้ำกับ X)',
          cells: [
            'Rel = 0.85 (อันดับ 2 เดิม)',
            'Sim(Y, X) = 0.90 💥 (ซ้ำมาก!)',
            '0.7(0.85) − 0.3(0.90) = 0.595 − 0.270 = 0.325',
            '✕ โดนหักความซ้ำจนหล่นอันดับ!'
          ]
        },
        {
          label: '📊 คอร์ส Z (Data Viz · หัวข้อใหม่)',
          cells: [
            'Rel = 0.70 (อันดับ 3 เดิม)',
            'Sim(Z, X) = 0.10 ✨ (ไม่ซ้ำ)',
            '0.7(0.70) − 0.3(0.10) = 0.490 − 0.030 = 0.460 🏆',
            '🏆 แซงขึ้นติดสล็อตอันดับ #2! (S = {X, Z})'
          ]
        },
        {
          label: 'สรุปผลของพารามิเตอร์ λ',
          cells: [
            'ถ้า λ = 1.0 → ได้ [X, Y] (จำเจ)',
            'ถ้า λ = 0.7 → ได้ [X, Z] (หลากหลาย)',
            'เพิ่ม Intra-List Diversity (ILD) ชัดเจน',
            'แก้ปัญหา Filter Bubble / Overspecialization'
          ],
          isSummary: true
        }
      ];

      const tbody = document.createElement('tbody');
      mmrRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.label);
        rth.scope = 'row';
        tr.append(rth);
        row.cells.forEach((txt, cIdx) => {
          const td = make('td', cIdx >= 2 || row.isSummary ? 'is-summary-cell' : '', txt);
          if (isHi) {
            if (txt.includes('💥') || txt.includes('✕')) td.classList.add('cell-target');
            else if (txt.includes('🏆') || cIdx === 3) td.classList.add('cell-focus');
            else td.classList.add('cell-scan');
          }
          tr.append(td);
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v1-mm-modalities') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = [
        'สื่อหลัก & น้ำหนัก (w_m)',
        '1 · สัญญาณที่สื่อนี้บอก',
        '2 · การเสริมพลังข้ามสื่อ (Complementarity)',
        '3 · ตัวอย่างในชุดข้อมูล (H1, H2 / M3–M5)',
        '4 · สัญญาณรบกวน (Modality Noise)'
      ];
      headers.forEach((h, i) => {
        const th = make('th', b.activeCol === i ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const modRows = [
        {
          label: '📝 T · Text (w = 0.4)',
          cells: [
            'ชื่อคลิป · คำบรรยาย · แท็กหัวข้อ',
            'บอกหัวข้อหลักชัด แต่ไม่เห็นหน้าตา/อารมณ์',
            'H1=(1,0), H2=(0.8,0.6) · M5=(0.6,0.8)',
            '⚠️ ชื่อคลิปสั้นกำกวม / พาดหัว Clickbait'
          ]
        },
        {
          label: '🖼️ I · Image (w = 0.2)',
          cells: [
            'รูปปก · โทนสี · การจัดวางองค์ประกอบ',
            'ช่วยยืนยันรูปลักษณ์ที่ชื่อเรื่องไม่ได้เขียน',
            'H1=(0,1), H2=(0.6,0.8) · M5=(0.8,0.6)',
            '⚠️ รูปปกหลอกลวงไม่ตรงเนื้อใน / ภาพเบลอ'
          ]
        },
        {
          label: '🎵 A · Audio (w = 0.2)',
          cells: [
            'ดนตรีประกอบ · น้ำเสียง · จังหวะอารมณ์',
            'เติมบรรยากาศ (เชื่อมโยงกับ Transcript)',
            'H1=(0.6,0.8), H2=(0,1) · M5=(0.6,0.8)',
            '⚠️ เสียงลมซ่าเข้าไมค์ / เสียงรบกวนดังกลบ'
          ]
        },
        {
          label: '🎬 V · Video (w = 0.2)',
          cells: [
            'ลำดับเฟรมภาพที่เปลี่ยนตามเวลา (Motion)',
            'เห็นแอ็กชันและขั้นตอนการสาธิตจริง',
            'H1=(0.8,0.6), H2=(1,0) · M5=(1.0,0.0)',
            '⚠️ กล้องสั่นไหวรุนแรง / แสงกระพริบมืด'
          ]
        },
        {
          label: 'สรุปกฎ Unimodal vs Multimodal',
          cells: [
            'รูป 20 รูป = Unimodal (สื่อภาพชนิดเดียว)',
            'รูป 1 + ข้อความ 1 = Multimodal ✓',
            '👩 ฟ้า ชอบ H1, H2 → จัดอันดับ M3, M4, M5',
            'เพิ่มสื่อเมื่อผ่าน Ablation Study เท่านั้น 🏆'
          ],
          isSummary: true
        }
      ];

      const tbody = document.createElement('tbody');
      modRows.forEach(row => {
        const tr = document.createElement('tr');
        const rth = make('th', row.isSummary ? 'is-active-header' : '', row.label);
        rth.scope = 'row';
        tr.append(rth);
        row.cells.forEach((txt, cIdx) => {
          const colNum = cIdx + 1;
          const td = make('td', colNum >= 3 || row.isSummary ? 'is-summary-cell' : '', txt);
          if (b.activeCol === colNum) {
            if (txt.includes('⚠️')) td.classList.add('cell-target');
            else if (row.isSummary || colNum === 2) td.classList.add('cell-focus');
            else td.classList.add('cell-scan');
          }
          tr.append(td);
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v6-mm-features') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = [
        'สื่อ (Modality)',
        '1 · ข้อมูลดิบ (Raw Input)',
        '2 · Handcrafted vs Pretrained Encoder',
        '3 · Linear Projection (ย่อสู่ 2 มิติ)',
        '4 · กฎ Normalization & Metadata'
      ];
      headers.forEach((h, i) => {
        const th = make('th', b.activeCol === i ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const featRows = [
        {
          label: '📝 Text (ข้อความ)',
          cells: [
            'ลำดับคำศัพท์และประโยค',
            'TF-IDF (นับคำ) vs BERT / RoBERTa (768D)',
            '768D → Linear Projection → v^T (2D)',
            'Fit Scaler บน Train · เก็บ txt_enc_v1'
          ]
        },
        {
          label: '🖼️ Image (ภาพปก)',
          cells: [
            'ตารางพิกเซลสี (H × W × RGB)',
            'Color Histogram vs ResNet / ViT (2048D)',
            '2048D → Linear Projection → v^I (2D)',
            '⚠️ สีฟ้าน้ำทะเล ≠ สีฟ้าเสื้อ (ต้องใช้ Deep)'
          ]
        },
        {
          label: '🎵 Audio (เสียง)',
          cells: [
            'คลื่นเสียง → ภาพ Mel-Spectrogram',
            'MFCC (ความถี่เสียง) vs AST / AudioCNN',
            '512D → Linear Projection → v^A (2D)',
            'L2 Normalize ให้ ‖v^A‖ = 1.0 เสมอ'
          ]
        },
        {
          label: '🎬 Video (วิดีโอ)',
          cells: [
            'ลำดับเฟรมภาพตามเวลา (H×W×T)',
            'Optical Flow vs 3D-CNN / VideoViT',
            '1024D → Linear Projection → v^V (2D)',
            'บันทึก Availability Mask เช่น [1,1,1,0]'
          ]
        },
        {
          label: 'สรุปกฎวิศวกรรมฟีเจอร์',
          cells: [
            'คอมพิวเตอร์คูณไฟล์ดิบตรงๆ ไม่ได้',
            'Pretrained ช่วยประหยัดเวลาเทรนมหาศาล',
            '⚠️ มิติเท่ากัน (2D) ≠ ความหมายตรงกัน!',
            'ห้าม Fit Scaler ปน Test Set เด็ดขาด 🏆'
          ],
          isSummary: true
        }
      ];

      const tbody = document.createElement('tbody');
      featRows.forEach(row => {
        const tr = document.createElement('tr');
        const rth = make('th', row.isSummary ? 'is-active-header' : '', row.label);
        rth.scope = 'row';
        tr.append(rth);
        row.cells.forEach((txt, cIdx) => {
          const colNum = cIdx + 1;
          const td = make('td', colNum >= 3 || row.isSummary ? 'is-summary-cell' : '', txt);
          if (b.activeCol === colNum) {
            if (txt.includes('⚠️')) td.classList.add('cell-target');
            else if (row.isSummary || colNum === 3) td.classList.add('cell-focus');
            else td.classList.add('cell-scan');
          }
          tr.append(td);
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v3-mm-neuron') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = [
        'กลไกของ Artificial Neuron',
        'ค่าตัวแปรตั้งต้น',
        'สมการและการแทนค่าตัวเลข',
        'ผลลัพธ์ที่ได้',
        'ความหมายทางวิศวกรรม'
      ];
      headers.forEach((h, i) => {
        const th = make('th', i >= 3 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const neuRows = [
        {
          label: '1 · ผลรวมเชิงเส้น (z = w·x + b)',
          cells: [
            'x = (2, 1) · w = (0.5, −1.0) · b = 0.5',
            'z = (0.5 × 2) + (−1.0 × 1) + 0.5 = 1.0 − 1.0 + 0.5',
            'z = 0.5 🎯',
            'รวมสัญญาณอินพุตตามน้ำหนักความสำคัญ'
          ]
        },
        {
          label: '2 · ฟังก์ชันกระตุ้น ReLU(z)',
          cells: [
            'กรณี z = 0.5 vs กรณี z = −2.5',
            'ReLU(z) = max(0, z) → max(0, 0.5) และ max(0, −2.5)',
            'ได้ 0.5 ✓ (และ 0.0 เมื่อ z ติดลบ)',
            'สร้างความไม่เชิงเส้น (ไม่ให้ร้อยชั้นยุบเหลือชั้นเดียว)'
          ]
        },
        {
          label: '3 · ปรับน้ำหนัก (Gradient Descent)',
          cells: [
            'w_old = 1.0 · η = 0.1 · ∂L/∂w = −4.0',
            'w_new = w_old − η·(∂L/∂w) = 1.0 − 0.1(−4.0)',
            'w_new = 1.4 🏆',
            'ก้าวไปในทิศตรงข้ามความชันเพื่อลด Loss'
          ]
        },
        {
          label: '4 · Training vs Inference Mode',
          cells: [
            '🏋️ ตอนฝึก (Train) vs 🚀 ตอนเสิร์ฟ (Serve)',
            'Train: คำนวณขาไป + ย้อนกลับอัปเดต w, b',
            'Inference: ล็อก w, b คงที่ 🔒',
            'ตอนใช้งานจริงรันขาไปอย่างเดียวเพื่อความเร็วสูงสุด'
          ],
          isSummary: true
        }
      ];

      const tbody = document.createElement('tbody');
      neuRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.label);
        rth.scope = 'row';
        tr.append(rth);
        row.cells.forEach((txt, cIdx) => {
          const td = make('td', cIdx >= 2 || row.isSummary ? 'is-summary-cell' : '', txt);
          if (isHi) {
            if (cIdx === 2) td.classList.add('cell-focus');
            else td.classList.add('cell-scan');
          }
          tr.append(td);
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v3-mm-cnn') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = [
        'ตำแหน่งหน้าต่าง (Stride=1, Pad=0)',
        'อินพุต [1, 2, 0, 3, 1] ที่ถูกครอบ',
        'ตัวกรอง Kernel (k = 3)',
        'การจับคู่คูณและบวก (Dot Product)',
        'ค่าใน Feature Map'
      ];
      headers.forEach((h, i) => {
        const th = make('th', i >= 3 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const cnnRows = [
        {
          label: '1 · หน้าต่างที่ 1 (ช่อง 1–3)',
          cells: [
            '[ 1, 2, 0 ] , 3, 1',
            '[1, 0, −1]',
            '(1 × 1) + (2 × 0) + (0 × −1) = 1 + 0 + 0',
            'c₁ = +1 🎯'
          ]
        },
        {
          label: '2 · หน้าต่างที่ 2 (ช่อง 2–4)',
          cells: [
            '1, [ 2, 0, 3 ] , 1',
            '[1, 0, −1] (ตัวเดิม)',
            '(2 × 1) + (0 × 0) + (3 × −1) = 2 + 0 − 3',
            'c₂ = −1 🎯'
          ]
        },
        {
          label: '3 · หน้าต่างที่ 3 (ช่อง 3–5)',
          cells: [
            '1, 2, [ 0, 3, 1 ]',
            '[1, 0, −1] (ตัวเดิม)',
            '(0 × 1) + (3 × 0) + (1 × −1) = 0 + 0 − 1',
            'c₃ = −1 → รวม [1, −1, −1] 🏆'
          ]
        },
        {
          label: '4 · คุณสมบัติเด่นของ CNN',
          cells: [
            'ขนาดเอาต์พุต = 5 − 3 + 1 = 3 ช่อง',
            'Weight Sharing: ใช้แค่ 3 พารามิเตอร์',
            'ประหยัดกว่า MLP + ลด Overfitting',
            'Translation Invariance (เลื่อนที่ก็ยังจำได้)'
          ],
          isSummary: true
        }
      ];

      const tbody = document.createElement('tbody');
      cnnRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.label);
        rth.scope = 'row';
        tr.append(rth);
        row.cells.forEach((txt, cIdx) => {
          const td = make('td', cIdx >= 2 || row.isSummary ? 'is-summary-cell' : '', txt);
          if (isHi) {
            if (cIdx === 3) td.classList.add('cell-focus');
            else td.classList.add('cell-scan');
          }
          tr.append(td);
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v3-mm-pooling') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = [
        'กลไกโครงสร้าง CNN',
        'อินพุต / การตั้งค่า',
        'การประมวลผลภายในชั้น',
        'ผลลัพธ์ที่ได้',
        'ประโยชน์ทางวิศวกรรม'
      ];
      headers.forEach((h, i) => {
        const th = make('th', i >= 3 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const poolRows = [
        {
          label: '1 · Zero Padding (เติมศูนย์ที่ขอบ)',
          cells: [
            'อินพุต [1, 2, 0, 3, 1] → เติม 0 ซ้าย-ขวา',
            'กลายเป็น [0, 1, 2, 0, 3, 1, 0]',
            'เอาต์พุตยาว 5 ช่องเท่าเดิมเป๊ะ',
            'รักษาขนาดภาพ + ไม่ทิ้งข้อมูลพิกเซลขอบภาพ'
          ]
        },
        {
          label: '2 · Stride (ระยะก้าวกระโดด)',
          cells: [
            'เปลี่ยนจาก Stride = 1 เป็น Stride = 2',
            'กระโดดข้ามทีละ 2 ช่องแทนการเลื่อนทีละ 1',
            'ขนาด Feature Map ย่อลงครึ่งหนึ่ง (~50%)',
            'ลดจำนวนครั้งการคูณและประหยัดเวลาประมวลผล ⚡'
          ]
        },
        {
          label: '3 · Max vs Average Pooling (2×2)',
          cells: [
            'บล็อก 2×2: แถวบน [1, 3] · แถวล่าง [2, 4]',
            'Max = max(1,3,2,4) · Avg = (1+3+2+4)/4',
            'Max = 4.0 🏆 · Avg = 2.5',
            'ดึงสัญญาณเด่นสุดโดยไม่ต้องมีพารามิเตอร์เทรนเพิ่ม'
          ]
        },
        {
          label: '4 · Receptive Field ตามความลึก',
          cells: [
            'ซ้อน Conv + Pooling ลึกขึ้นเรื่อยๆ',
            'ชั้นตื้น: เส้นขอบ → ชั้นกลาง: ชิ้นส่วน → ชั้นลึก: วัตถุ',
            'ขอบเขตการมองเห็นขยายครอบคลุมทั้งภาพ',
            'ได้เวกเตอร์ความหมายระดับสูง (High-Level Semantics)'
          ],
          isSummary: true
        }
      ];

      const tbody = document.createElement('tbody');
      poolRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.label);
        rth.scope = 'row';
        tr.append(rth);
        row.cells.forEach((txt, cIdx) => {
          const td = make('td', cIdx >= 2 || row.isSummary ? 'is-summary-cell' : '', txt);
          if (isHi) {
            if (cIdx === 2) td.classList.add('cell-focus');
            else td.classList.add('cell-scan');
          }
          tr.append(td);
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v1-mm-encoders') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = [
        'สถาปัตยกรรม CNN รายสื่อ',
        'รูปร่างข้อมูลที่สแกน',
        'ทิศทางการเลื่อนตัวกรอง (Kernel)',
        'ลวดลายที่สกัดได้ (Extracted Features)',
        'เวกเตอร์ผลลัพธ์'
      ];
      headers.forEach((h, i) => {
        const th = make('th', i >= 3 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const encRows = [
        {
          label: '📝 1D-CNN (TextCNN)',
          cells: [
            'ลำดับเวกเตอร์คำเรียงตามยาว (1 มิติ)',
            'เลื่อน 1 ทิศทางตามลำดับคำติดกัน',
            'จับวลีสำคัญ (Word n-grams เช่น "สอน ทำ อาหาร")',
            'เวกเตอร์ข้อความ v^T'
          ]
        },
        {
          label: '🖼️ 2D-CNN (Image ResNet)',
          cells: [
            'ตารางพิกเซล กว้าง × สูง (2 มิติ)',
            'เลื่อน 2 ทิศทาง (ซ้าย-ขวา และ บน-ล่าง)',
            'จับเส้นขอบ รูปทรง โทนสี และวัตถุในภาพปก',
            'เวกเตอร์ภาพปก v^I'
          ]
        },
        {
          label: '🎵 2D-CNN บน Mel-Spectrogram',
          cells: [
            'แปลงคลื่นเสียงเป็นภาพ 2 มิติ (เวลา × ความถี่)',
            'ใช้ 2D-CNN สแกนภาพความถี่เสียงเหมือนรูปภาพ!',
            'จับจังหวะดนตรี โทนเสียงสูง-ต่ำ และอารมณ์เพลง',
            'เวกเตอร์เสียง v^A 🏆'
          ]
        },
        {
          label: '🎬 3D-CNN (Video Spatio-Temporal)',
          cells: [
            'ก้อนเฟรมวิดีโอ กว้าง × สูง × เวลา (3 มิติ)',
            'ใช้ตัวกรองทรงลูกบาศก์สแกนพื้นที่ + เวลาพร้อมกัน',
            'จับการเคลื่อนไหว แอ็กชัน และลีลาการสาธิต',
            'เวกเตอร์วิดีโอ v^V 🏆'
          ]
        },
        {
          label: '⚠️ ข้อจำกัดของตระกูล CNN',
          cells: [
            'มองผ่านหน้าต่างแคบๆ (Local Window)',
            'เก่งมากเรื่องลวดลายเฉพาะจุดที่อยู่ติดกัน',
            '❌ เชื่อมโยงข้อมูลที่อยู่ห่างกันมากๆ (Long-Range) ยาก',
            'จึงต้องมี Transformer มาเสริม!'
          ],
          isSummary: true
        }
      ];

      const tbody = document.createElement('tbody');
      encRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx || b.secondRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.label);
        rth.scope = 'row';
        tr.append(rth);
        row.cells.forEach((txt, cIdx) => {
          const td = make('td', cIdx >= 2 || row.isSummary ? 'is-summary-cell' : '', txt);
          if (isHi) {
            if (txt.includes('❌')) td.classList.add('cell-target');
            else if (cIdx >= 2) td.classList.add('cell-focus');
            else td.classList.add('cell-scan');
          }
          tr.append(td);
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v6-mm-tokens') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = [
        'ขั้นตอนใน ViT / AST',
        'การแปลงข้อมูล (Transformation)',
        'เปรียบเทียบกับข้อความ (NLP Analogy)',
        'ทำไมขาดขั้นตอนนี้ไม่ได้?'
      ];
      headers.forEach((h, i) => {
        const th = make('th', i === 3 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const tokRows = [
        {
          label: '1 · หั่นเป็นแผ่นย่อย (Patch Split)',
          cells: [
            'หั่นรูปภาพ (หรือภาพ Mel-Spectrogram) เป็นตาราง 16×16',
            '1 แผ่นภาพย่อย (Patch) = 1 คำศัพท์ (Word Token)',
            'ถ้าป้อนทีละพิกเซล (50,176 จุด) คอมพิวเตอร์จะค้างทันที!'
          ]
        },
        {
          label: '2 · Flatten & Linear Projection',
          cells: [
            'รีดพิกเซลในแต่ละ Patch เป็นเส้นตรง → คูณเมทริกซ์ฉายสู่มิติ d',
            'เหมือนการเปิดตาราง Word Embedding ของแต่ละคำ',
            'แปลงค่าสีดิบให้เป็นเวกเตอร์ฟีเจอร์ขนาด d มิติเท่ากันทุกชิ้น'
          ]
        },
        {
          label: '3 · บวก Positional Encoding',
          cells: [
            'บวกเวกเตอร์บอกพิกัดตำแหน่ง (1, 2, ..., N) เข้าไปในทุก Patch',
            'บอกลำดับคำหน้า-หลัง / บอกพิกัดมุมซ้าย-ขวาของภาพ',
            '⚠️ Self-Attention ไม่รู้ลำดับ ถ้าไม่บวก ภาพสลับมั่วจะได้ค่าเดิม!'
          ]
        },
        {
          label: '4 · เติมโทเค็นสรุป [CLS] หน้าสุด',
          cells: [
            'วางโทเค็นพิเศษ [CLS] ไว้ที่ตำแหน่งที่ 0 หน้าลำดับ Patch ทั้งหมด',
            'เหมือนหัวหน้าห้องที่คอยเดินเก็บสรุปใจความจากเพื่อนทุกแผ่น',
            'ดึงเวกเตอร์ [CLS] ชั้นสุดท้ายมาใช้เป็น Item Vector ได้ทันที 🏆'
          ],
          isSummary: true
        }
      ];

      const tbody = document.createElement('tbody');
      tokRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.label);
        rth.scope = 'row';
        tr.append(rth);
        row.cells.forEach((txt, cIdx) => {
          const td = make('td', cIdx === 2 || row.isSummary ? 'is-summary-cell' : '', txt);
          if (isHi) {
            if (txt.includes('⚠️')) td.classList.add('cell-target');
            else if (cIdx === 2) td.classList.add('cell-focus');
            else td.classList.add('cell-scan');
          }
          tr.append(td);
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v3-mm-attention') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = [
        'ขั้นตอน Scaled Dot-Product Attention',
        'โทเค็นที่ 1: K₁=(1,0), V₁=(2,0)',
        'โทเค็นที่ 2: K₂=(0,1), V₂=(0,2)',
        'ผลลัพธ์ / กฎคณิตศาสตร์ (เมื่อ Q=(1,0), d_k=2)'
      ];
      headers.forEach((h, i) => {
        const th = make('th', i === 3 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const attRows = [
        {
          label: '1 · ตั้งคำถามเทียบป้าย (Q · Kᵢ)',
          cells: [
            'Q · K₁ = (1×1) + (0×0) = 1.0 (ตรงกันเป๊ะ)',
            'Q · K₂ = (1×0) + (0×1) = 0.0 (ตั้งฉากกัน)',
            'วัดความสอดคล้องระหว่างคำถาม Q กับป้ายดัชนี K'
          ]
        },
        {
          label: '2 · หารด้วย √d_k (Scale ÷ √2)',
          cells: [
            's₁ = 1.0 / √2 ≈ 0.7071',
            's₂ = 0.0 / √2 = 0.0000',
            '🛡️ ป้องกันตัวเลขโตเกินไปจน Softmax อิ่มตัว (Vanishing Gradient)'
          ]
        },
        {
          label: '3 · แปลงเป็นน้ำหนัก Softmax (αᵢ)',
          cells: [
            'e^0.7071 ≈ 2.028 → α₁ = 2.028 / 3.028 ≈ 0.670 (67%)',
            'e^0.0000 = 1.000 → α₂ = 1.000 / 3.028 ≈ 0.330 (33%)',
            'ได้สัดส่วนความสนใจรวมกัน = 0.670 + 0.330 = 1.000 พอดี'
          ]
        },
        {
          label: '4 · รวมเนื้อหา (Σ αᵢ · Vᵢ)',
          cells: [
            'α₁ · V₁ = 0.670 × (2, 0) = (1.34, 0.00)',
            'α₂ · V₂ = 0.330 × (0, 2) = (0.00, 0.66)',
            'Output = (1.34, 0.00) + (0.00, 0.66) = (1.34, 0.66) 🏆'
          ],
          isSummary: true
        }
      ];

      const tbody = document.createElement('tbody');
      attRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.label);
        rth.scope = 'row';
        tr.append(rth);
        row.cells.forEach((txt, cIdx) => {
          const td = make('td', cIdx === 2 || row.isSummary ? 'is-summary-cell' : '', txt);
          if (isHi) {
            if (cIdx === 2) td.classList.add('cell-focus');
            else td.classList.add('cell-scan');
          }
          tr.append(td);
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v6-mm-transformer-block') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = [
        'ชิ้นส่วนใน Transformer Block',
        'กลไกการทำงานหลัก',
        'ปัญหาที่ช่วยแก้ไข',
        'บทบาทต่อเวกเตอร์สินค้า (Item Embedding)'
      ];
      headers.forEach((h, i) => {
        const th = make('th', i === 3 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const blkRows = [
        {
          label: '1 · Multi-Head Attention (MHA)',
          cells: [
            'แยกคำนวณ Attention ขนานกันหลายหัว (คนละชุด Q, K, V)',
            'แก้ข้อจำกัดการมองเห็นแค่มุมเดียวของ Single-Head',
            'มองเห็นทั้งความสัมพันธ์ด้านสี รูปทรง และจังหวะเวลาพร้อมกัน'
          ]
        },
        {
          label: '2 · Residual Connection (x + Sublayer(x))',
          cells: [
            'สร้างทางด่วนบวกอินพุตเดิม x เข้ากับผลลัพธ์ของชั้นย่อยโดยตรง',
            '🛡️ ป้องกันปัญหาเกรเดียนต์เหือดหาย (Vanishing Gradient)',
            'ทำให้สามารถซ้อนบล็อกลึกหลายสิบชั้นได้โดยการเทรนไม่ล่ม'
          ]
        },
        {
          label: '3 · LayerNorm & Feed-Forward (FFN)',
          cells: [
            'LayerNorm ปรับ Mean=0, Var=1 · FFN แปลงฟีเจอร์ไม่เชิงเส้น',
            'ป้องกันค่าตัวเลขแกว่งหรือระเบิดระหว่างผ่านชั้นลึกๆ',
            'กลั่นกรองความเข้าใจเชิงลึกให้แต่ละโทเค็นอย่างเสถียร'
          ]
        },
        {
          label: '4 · การดึง Item Vector ชั้นสุดท้าย',
          cells: [
            'ดึงเวกเตอร์จากโทเค็น [CLS] หรือทำ Mean Pooling ทุกโทเค็น',
            'สรุปลำดับโทเค็นยาวๆ ให้เหลือเวกเตอร์ตัวแทนสินค้าเพียง 1 เส้น',
            'นำไปทำ L2 Normalization เพื่อใช้ค้นหาในระบบแนะนำทันที 🏆'
          ],
          isSummary: true
        }
      ];

      const tbody = document.createElement('tbody');
      blkRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.label);
        rth.scope = 'row';
        tr.append(rth);
        row.cells.forEach((txt, cIdx) => {
          const td = make('td', cIdx === 2 || row.isSummary ? 'is-summary-cell' : '', txt);
          if (isHi) {
            if (cIdx === 2) td.classList.add('cell-focus');
            else td.classList.add('cell-scan');
          }
          tr.append(td);
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v3-mm-profiles') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = [
        'โปรไฟล์รายสื่อของ 👩 ฟ้า',
        'คลิปที่ชอบ H1 (Train)',
        'คลิปที่ชอบ H2 (Train)',
        'เวกเตอร์เฉลี่ย (H1 + H2) / 2',
        'โปรไฟล์หน่วย p^m (L2 Norm = 1.0)'
      ];
      headers.forEach((h, i) => {
        const th = make('th', i >= 3 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const profRows = [
        {
          label: '📝 โปรไฟล์ข้อความ (p^T)',
          cells: [
            '(1.0, 0.0)',
            '(0.8, 0.6)',
            '(0.9, 0.3) · ‖μ‖ = √0.90 ≈ 0.9487',
            'p^T = (0.9487, 0.3162) 🎯 (เด่นแกน 1)'
          ]
        },
        {
          label: '🖼️ โปรไฟล์ภาพปก (p^I)',
          cells: [
            '(0.0, 1.0)',
            '(0.6, 0.8)',
            '(0.3, 0.9) · ‖μ‖ = √0.90 ≈ 0.9487',
            'p^I = (0.3162, 0.9487) 🎯 (เด่นแกน 2)'
          ]
        },
        {
          label: '🎵 โปรไฟล์เสียง (p^A)',
          cells: [
            '(0.6, 0.8)',
            '(0.0, 1.0)',
            '(0.3, 0.9) · ‖μ‖ = √0.90 ≈ 0.9487',
            'p^A = (0.3162, 0.9487) 🎯 (เด่นแกน 2)'
          ]
        },
        {
          label: '🎬 โปรไฟล์วิดีโอ (p^V)',
          cells: [
            '(0.8, 0.6)',
            '(1.0, 0.0)',
            '(0.9, 0.3) · ‖μ‖ = √0.90 ≈ 0.9487',
            'p^V = (0.9487, 0.3162) 🎯 (เด่นแกน 1)'
          ]
        },
        {
          label: '🚫 กฎเหล็ก Unaligned Space Trap',
          cells: [
            '✅ เทียบสื่อเดียวกัน: p^T · v^T',
            '🚫 ห้ามคูณข้ามสื่อ: p^T · v^I 💥',
            'เพราะ Encoder คนละตัว แกนคนละความหมาย',
            'แยก 4 โปรไฟล์ช่วยเก็บรสนิยมต่างแนวได้ครบ 🏆'
          ],
          isSummary: true
        }
      ];

      const tbody = document.createElement('tbody');
      profRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx || b.secondRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.label);
        rth.scope = 'row';
        tr.append(rth);
        row.cells.forEach((txt, cIdx) => {
          const td = make('td', cIdx >= 2 || row.isSummary ? 'is-summary-cell' : '', txt);
          if (isHi) {
            if (txt.includes('🚫') || txt.includes('💥')) td.classList.add('cell-target');
            else if (cIdx === 3) td.classList.add('cell-focus');
            else td.classList.add('cell-scan');
          }
          tr.append(td);
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v4-mm-late') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = [
        'คลิปผู้สมัคร (เทียบกับ 👩 ฟ้า)',
        '📝 S_T (w = 0.4)',
        '🖼️ S_I (w = 0.2)',
        '🎵 S_A (w = 0.2)',
        '🎬 S_V (w = 0.2)',
        'Score_Late = Σ w_m · S_m'
      ];
      headers.forEach((h, i) => {
        const th = make('th', i === 5 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const lateRows = [
        {
          label: '🎬 คลิป M3 (สอนเล่าเรื่อง)',
          cells: [
            '0.9487 (×0.4 = .3795)',
            '0.9487 (×0.2 = .1897)',
            '0.5692 (×0.2 = .1138)',
            '0.8222 (×0.2 = .1644)',
            '0.8475 🏆 (ถ้า I=.3162, A=.2635, V=.9487 → 0.6852)'
          ]
        },
        {
          label: '🖥️ คลิป M4 (สาธิตหน้าจอ)',
          cells: [
            '0.9487 (×0.4 = .3795)',
            '0.3162 (×0.2 = .0632)',
            '0.9487 (×0.2 = .1897)',
            '0.3162 (×0.2 = .0632)',
            '0.6957 (ภาพและวิดีโอฉุดคะแนนลง)'
          ]
        },
        {
          label: '🛠️ คลิป M5 (ทำงานเป็นขั้น)',
          cells: [
            '0.8222 (×0.4 = .3289)',
            '0.8222 (×0.2 = .1644)',
            '0.8222 (×0.2 = .1644)',
            '0.9487 (×0.2 = .1897)',
            '0.8475 🏆 (สมดุลทุกสื่อ + วิดีโอเด่นสุด)'
          ]
        },
        {
          label: 'สรุปจุดแข็ง & ข้อจำกัด Late Fusion',
          cells: [
            '✅ อัปเกรดแยกสื่อได้ (Modular)',
            '✅ ทนต่อปัญหาสื่อหาย (Re-normalize)',
            '✅ อธิบายผลรายสื่อได้ชัดเจน',
            '⚠️ ข้อจำกัดเดียว:',
            'ไม่เห็นปฏิสัมพันธ์ข้ามสื่อระดับลึก (Cross-Modal)'
          ],
          isSummary: true
        }
      ];

      const tbody = document.createElement('tbody');
      lateRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.label);
        rth.scope = 'row';
        tr.append(rth);
        row.cells.forEach((txt, cIdx) => {
          const td = make('td', cIdx === 4 || row.isSummary ? 'is-summary-cell' : '', txt);
          if (isHi) {
            if (txt.includes('⚠️')) td.classList.add('cell-target');
            else if (cIdx === 4) td.classList.add('cell-focus');
            else td.classList.add('cell-scan');
          }
          tr.append(td);
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v3-mm-early') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = [
        'กลไกและข้อควรระวัง Early Fusion',
        'บล็อก 1–2: 📝 Text & 🖼️ Image',
        'บล็อก 3–4: 🎵 Audio & 🎬 Video',
        'เวกเตอร์รวม 8 มิติ / ผลลัพธ์ทางวิศวกรรม'
      ];
      headers.forEach((h, i) => {
        const th = make('th', i === 3 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const earlyRows = [
        {
          label: '1 · ถ่วงน้ำหนักด้วยรากที่สอง (√w_m)',
          cells: [
            'คูณ √0.4 ≈ 0.6325 (T) และ √0.2 ≈ 0.4472 (I)',
            'คูณ √0.2 ≈ 0.4472 (A) และ √0.2 ≈ 0.4472 (V)',
            'เมื่อ Dot Product กัน: (√w_m × √w_m) = w_m พอดีเป๊ะ! 🎯'
          ]
        },
        {
          label: '2 · ต่อเวกเตอร์ (Concatenation)',
          cells: [
            'ต่อ [√0.4·v^T (2D) ; √0.2·v^I (2D) ...',
            '... ; √0.2·v^A (2D) ; √0.2·v^V (2D)]',
            'ได้เส้นเดียว 2+2+2+2 = 8 มิติ · เรียนรู้ Cross-Modal ได้ตั้งแต่ต้น 🏆'
          ]
        },
        {
          label: '3 · จุดอ่อน: เปราะบางเมื่อสื่อหาย',
          cells: [
            'มีข้อมูล T (2D) และ I (2D) ตามปกติ',
            '❌ ถ้าคลิปไม่มีเสียง (A หายไป) → ช่อง 5–6 โหว่ทันที!',
            '💥 เวกเตอร์แหว่ง คูณกับโปรไฟล์ 8 มิติไม่ได้ (Fragile ต่อ Missing Modality)'
          ]
        },
        {
          label: '4 · จุดอ่อน: มิติครอบงำ (Dominance)',
          cells: [
            'สมมติเวกเตอร์ภาพดิบยาว 2048 มิติ',
            'แต่เวกเตอร์ข้อความยาวเพียง 64 มิติ',
            '⚠️ 2048 ช่องของภาพจะกลบอิทธิพลของข้อความ 64 ช่องจนมิด!'
          ],
          isSummary: true
        }
      ];

      const tbody = document.createElement('tbody');
      earlyRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.label);
        rth.scope = 'row';
        tr.append(rth);
        row.cells.forEach((txt, cIdx) => {
          const td = make('td', cIdx === 2 || row.isSummary ? 'is-summary-cell' : '', txt);
          if (isHi) {
            if (txt.includes('💥') || txt.includes('❌') || txt.includes('⚠️')) td.classList.add('cell-target');
            else if (cIdx === 2) td.classList.add('cell-focus');
            else td.classList.add('cell-scan');
          }
          tr.append(td);
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v6-mm-intermediate') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = [
        'เทคนิค Intermediate Fusion',
        'การทำงานกับสื่อต่างชนิด',
        'ตัวอย่างสถานการณ์จริง',
        'ข้อได้เปรียบ / ข้อแลกเปลี่ยน (Trade-off)'
      ];
      headers.forEach((h, i) => {
        const th = make('th', i === 3 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const interRows = [
        {
          label: '1 · Dynamic Gating (ประตูอัจฉริยะ)',
          cells: [
            'คำนวณประตูปรับน้ำหนัก g_m ตามบริบทของสินค้าแต่ละชิ้น',
            '🎵 คลิปเพลง: เปิดเสียง 80% · 🎬 หนังเงียบ: เปิดวิดีโอ 70% หรี่เสียง 5%',
            'ปรับน้ำหนักยืดหยุ่นรายชิ้น ไม่ใช้ค่าคงที่ตายตัวแบบ Late Fusion 🎯'
          ]
        },
        {
          label: '2 · Cross-Attention ข้ามสื่อ',
          cells: [
            'ใช้เวกเตอร์ข้อความเป็น Query (Q) ค้นหาเฟรมวิดีโอที่เป็น Key/Value (K, V)',
            'คำว่า "ต้มยำกุ้งเดือด" จับคู่เข้ากับฉากน้ำซุปเดือดในวินาทีที่ 15 พอดี',
            'หลอมรวมความเข้าใจข้ามสื่อในระดับลึก (Deep Cross-Modal Interaction)'
          ]
        },
        {
          label: '3 · Shared Semantic Space (CLIP)',
          cells: [
            'ฝึกด้วย Contrastive Learning บนคู่ภาพและข้อความนับร้อยล้านคู่',
            'เวกเตอร์ภาพ "สุนัขวิ่ง" ชี้ไปทิศเดียวกับข้อความ "Dog running"',
            'เปรียบเทียบและทำ Dot Product ข้ามสื่อในพิกัดเดียวกันได้โดยตรง 🏆'
          ]
        },
        {
          label: '4 · ข้อแลกเปลี่ยนทางวิศวกรรม',
          cells: [
            'ได้ความแม่นยำและความเข้าใจบริบทข้ามสื่อสูงที่สุด',
            '⚠️ แลกกับโมเดลที่ซับซ้อน เทรนยาก และใช้เวลาประมวลผลสูงขึ้น',
            'นิยมใช้ในด่าน Ranking คัดละเอียดหลังจากดึงผู้สมัครมาแล้ว'
          ],
          isSummary: true
        }
      ];

      const tbody = document.createElement('tbody');
      interRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.label);
        rth.scope = 'row';
        tr.append(rth);
        row.cells.forEach((txt, cIdx) => {
          const td = make('td', cIdx === 2 || row.isSummary ? 'is-summary-cell' : '', txt);
          if (isHi) {
            if (txt.includes('⚠️')) td.classList.add('cell-target');
            else if (cIdx === 2) td.classList.add('cell-focus');
            else td.classList.add('cell-scan');
          }
          tr.append(td);
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v1-mm-missing') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = [
        'กลยุทธ์รับมือสื่อหาย (เมื่อ V หายไป)',
        '📝 T (0.4) · 🖼️ I (0.2) · 🎵 A (0.2)',
        '🎬 วิดีโอ V (ปกติ w_V = 0.2)',
        'การคำนวณคะแนนรวม (สมมติ S_T=.95, S_I=.82, S_A=.67)',
        'ผลลัพธ์ทางวิศวกรรม'
      ];
      headers.forEach((h, i) => {
        const th = make('th', i >= 3 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const missRows = [
        {
          label: '1 · Availability Mask [1, 1, 1, 0]',
          cells: [
            'มีข้อมูลครบ: m_T=1, m_I=1, m_A=1',
            '❌ ขาดวิดีโอ: m_V = 0',
            'บันทึกป้าย [1, 1, 1, 0] คู่กับสินค้าเสมอ',
            'บอกโค้ดให้รู้ล่วงหน้าว่าต้องข้ามสื่อ V (ไม่ให้แครช) 🎯'
          ]
        },
        {
          label: '2 · ❌ Zero Imputation (เติมศูนย์ดื้อๆ)',
          cells: [
            '0.4(.95) + 0.2(.82) + 0.2(.67) = 0.6768',
            'ยัดเวกเตอร์ (0, 0) → ได้ 0.2(0) = 0',
            'คะแนนรวม = 0.6768 (เพดานเต็มเหลือแค่ 0.80!)',
            '💥 สินค้าถูกกดคะแนนต่ำลง + เลข 0 สร้างพิกัดหลอกใน Dense Space!'
          ]
        },
        {
          label: '3 · ✅ Weight Re-normalization',
          cells: [
            'ผลรวมน้ำหนักที่มี = 0.4 + 0.2 + 0.2 = 0.80',
            'ตัดพจน์ V ออกจากการเฉลี่ย',
            'หารด้วย 0.80: w ใหม่ = (0.50, 0.25, 0.25) → 0.6768 / 0.80',
            'ได้คะแนน 0.8460 🏆 (สเกลเต็ม 1.00 ยุติธรรมกับทุกคลิป!)'
          ]
        },
        {
          label: '4 · ✅ Modality Dropout (ตอนเทรน)',
          cells: [
            'ระหว่างฝึกโมเดล แอบสุ่มปิดสื่อบางตัวเป็นระยะ',
            'จำลองสถานการณ์ว่าบางครั้ง V หรือ I หายไป',
            'บังคับไม่ให้โครงข่ายพึ่งพาสื่อเดียวมากเกินไป',
            '🛡️ โมเดลมีภูมิคุ้มกัน ทนทานเมื่อเจอข้อมูลแหว่งในโลกจริง'
          ],
          isSummary: true
        }
      ];

      const tbody = document.createElement('tbody');
      missRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.label);
        rth.scope = 'row';
        tr.append(rth);
        row.cells.forEach((txt, cIdx) => {
          const td = make('td', cIdx >= 2 || row.isSummary ? 'is-summary-cell' : '', txt);
          if (isHi) {
            if (txt.includes('💥') || txt.includes('❌')) td.classList.add('cell-target');
            else if (cIdx === 3) td.classList.add('cell-focus');
            else td.classList.add('cell-scan');
          }
          tr.append(td);
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v4-mm-ablation') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = [
        'การทดลอง Ablation Variant',
        'สื่อที่เปิดใช้งาน',
        'คะแนน nDCG@3 (Test Set เดียวกัน)',
        'ส่วนต่าง (Δ เทียบโมเดลเต็ม)',
        'ข้อสรุปและการตัดสินใจทางวิศวกรรม'
      ];
      headers.forEach((h, i) => {
        const th = make('th', i >= 2 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const ablRows = [
        {
          label: '1 · Full Model (โมเดลเต็มครบ 4 สื่อ)',
          cells: [
            '📝 T + 🖼️ I + 🎵 A + 🎬 V',
            '0.8125 🏆',
            '0.0000 (จุดอ้างอิงตั้งต้น)',
            'ใช้เป็นเพดานเปรียบเทียบคุณค่าส่วนเพิ่มของแต่ละสื่อ'
          ]
        },
        {
          label: '2 · ตัดเสียงออก (No-Audio: −A)',
          cells: [
            '📝 T + 🖼️ I + 🎬 V (ถอดเสียงออก)',
            '0.6540 💥 (ร่วงหนัก!)',
            '−0.1585 (คะแนนตกลงฮวบ)',
            '✅ พิสูจน์ว่า "สื่อเสียงมีคุณค่าสูงมาก" ห้ามตัดออกเด็ดขาด!'
          ]
        },
        {
          label: '3 · ตัดภาพปกออก (No-Image: −I)',
          cells: [
            '📝 T + 🎵 A + 🎬 V (ถอดภาพออก)',
            '0.8120 (แทบไม่เปลี่ยน)',
            '−0.0005 (ต่างกันน้อยมาก)',
            '⚠️ สื่อภาพซ้ำซ้อนกับสื่ออื่น (Redundant Modality)'
          ]
        },
        {
          label: '4 · กฎตัดสินใจ Cost & Latency Trade-off',
          cells: [
            'คุมตัวแปร: Test Set และ Metrics เดิมเป๊ะ',
            'ถ้าเพิ่มแต้มแค่ 0.001% แต่ช้าลง 5×',
            'และกินค่าเช่า GPU พุ่ง 3 เท่า',
            '✂️ ตัดสื่อที่ไม่คุ้มทุนออกทันที เพื่อระบบที่เร็วและประหยัดกว่า 🏆'
          ],
          isSummary: true
        }
      ];

      const tbody = document.createElement('tbody');
      ablRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.label);
        rth.scope = 'row';
        tr.append(rth);
        row.cells.forEach((txt, cIdx) => {
          const td = make('td', cIdx >= 1 || row.isSummary ? 'is-summary-cell' : '', txt);
          if (isHi) {
            if (txt.includes('💥') || txt.includes('⚠️')) td.classList.add('cell-target');
            else if (cIdx === 3 || txt.includes('🏆')) td.classList.add('cell-focus');
            else td.classList.add('cell-scan');
          }
          tr.append(td);
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v6-mm-system') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = [
        'ด่านวิศวกรรม End-to-End',
        'สิ่งที่ทำในระบบจริง',
        'ความเสี่ยงหากละเลย (Failure Mode)',
        'มาตรฐาน Production (SLA / Guardrail)'
      ];
      headers.forEach((h, i) => {
        const th = make('th', i === 3 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const sysRows = [
        {
          label: '1 · Offline Pre-computation',
          cells: [
            'รันโมเดลหนัก (ViT, 3D-CNN, AST) ล่วงหน้าครั้งเดียวแล้วเก็บลง Vector DB',
            '💥 ถ้ารัน Deep Learning สดๆ ตอนเปิดแอป จะช้าเป็นวินาทีจนเซิร์ฟเวอร์ล่ม!',
            'แคชเวกเตอร์สินค้าพร้อม Availability Mask ไว้ล่วงหน้า 100% ⚡'
          ]
        },
        {
          label: '2 · Encoder Version Locking',
          cells: [
            'ล็อกรุ่นโมเดลตัวแปลง (เช่น ResNet-50 v1) ให้ตรงกันทั้งตอน Train และ Serve',
            '💥 ถ้าสลับใช้ v1 ปนกับ v2 เวกเตอร์จะเพี้ยนทั้งระบบโดยไม่แจ้ง Error!',
            'บันทึก model_version คู่กับทุกเวกเตอร์ และทำ Backfill เมื่ออัปเกรด 🛡️'
          ]
        },
        {
          label: '3 · Online Serving (< 50 ms)',
          cells: [
            'ดึงโปรไฟล์ 👩 ฟ้า → ค้น ANN (~2 ms) → รวมคะแนน Fusion + กรองของซ้ำ',
            '⚠️ ถ้าขั้นตอน Re-ranking ซับซ้อนเกินไป หน้าจอผู้ใช้จะหมุนค้าง',
            'คุมงบประมาณเวลารวมทั้งสายพานให้เสร็จภายใน < 50 มิลลิวินาที 🏆'
          ]
        },
        {
          label: '4 · กฎทองการพัฒนา (Golden Rule)',
          cells: [
            'เริ่มจาก Text Baseline ที่เรียบง่าย → ค่อยเพิ่ม Image / Audio / Video',
            '⚠️ อย่าเริ่มจากโมเดลใหญ่เทอะทะตั้งแต่วันแรกโดยไม่มีผลทดสอบ',
            'เพิ่มสื่อใหม่เฉพาะเมื่อผ่าน Ablation Study และคุ้มค่า GPU เท่านั้น 🎓'
          ],
          isSummary: true
        }
      ];

      const tbody = document.createElement('tbody');
      sysRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.label);
        rth.scope = 'row';
        tr.append(rth);
        row.cells.forEach((txt, cIdx) => {
          const td = make('td', cIdx === 2 || row.isSummary ? 'is-summary-cell' : '', txt);
          if (isHi) {
            if (txt.includes('💥') || txt.includes('⚠️')) td.classList.add('cell-target');
            else if (cIdx === 2) td.classList.add('cell-focus');
            else td.classList.add('cell-scan');
          }
          tr.append(td);
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }
    if (b && b.type === 'v1-cf-matrix') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['ผู้ใช้ \\ คอร์ส', '🐍 Python (A)', '📊 SQL (B)', '🎨 UX (C)', '📈 Excel (D)', '💡 Data Story (E)', '🤖 Deep Learning (F)'];
      headers.forEach((h, i) => {
        const isColActive = (b.mode === 'target' && i === 5) || (b.mode === 'item-view' && (i === 5 || (b.focusCols && b.focusCols.includes(i - 1))));
        const th = make('th', isColActive ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const matrixRows = [
        { name: '👩 ฟ้า (u₁)', vals: ['5★', '4★', '1★', '2★', '? 🎯', '?'] },
        { name: '🧑 พลอย (u₂)', vals: ['4★', '5★', '2★', '1★', '5★', '?'] },
        { name: '👨 นนท์ (u₃)', vals: ['1★', '2★', '5★', '4★', '1★', '?'] },
        { name: '🧔 กานต์ (u₄)', vals: ['5★', '4★', '2★', '—', '4★', '?'] },
        { name: '👩 เมย์ (u₅)', vals: ['4★', '5★', '—', '2★', '5★', '5★'] }
      ];

      const tbody = document.createElement('tbody');
      matrixRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isRowActive = (b.mode === 'target' && rIdx === 0) || (b.mode === 'user-view' && (rIdx === 0 || (b.focusRows && b.focusRows.includes(rIdx))));
        const rth = make('th', isRowActive ? 'is-active-header' : '', row.name);
        rth.scope = 'row';
        tr.append(rth);

        row.vals.forEach((v, cIdx) => {
          let cls = '';
          if (v.includes('?')) cls = 'is-missing';
          if (b.mode === 'target' && rIdx === 0 && cIdx === 4) cls = 'cell-target';
          else if (b.mode === 'user-view') {
            if (rIdx === 0) cls = cIdx === 4 ? 'cell-target' : 'cell-focus';
            else if (cIdx === 4) cls = 'cell-target';
            else if (v !== '—' && !v.includes('?')) cls = 'cell-scan';
          } else if (b.mode === 'item-view') {
            if (cIdx === 4) cls = rIdx === 0 ? 'cell-target' : 'cell-focus';
            else if (v !== '—' && !v.includes('?')) cls = 'cell-scan';
          } else if (b.mode === 'summary') {
            if (cIdx === 4 && rIdx === 0) cls = 'cell-target';
            else if (v !== '—' && !v.includes('?')) cls = 'cell-focus';
          }
          const td = make('td', cls, v);
          tr.append(td);
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v1-cf-popularity') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['คอร์สสินค้า', 'เรตติ้งที่ได้รับจริง', 'จำนวนไลก์ (≥ 4★)', 'คะแนนเฉลี่ย', 'อันดับความนิยม'];
      headers.forEach((h, i) => {
        const th = make('th', i === 4 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const popRows = [
        { course: '🐍 Python (A)', ratings: 'u₁:5, u₂:4, u₃:1, u₄:5, u₅:4', likes: '4 คน 👍 (80%)', avg: '3.80★', rank: 'อันดับ 1 (ร่วม) 🏆' },
        { course: '📊 SQL (B)', ratings: 'u₁:4, u₂:5, u₃:2, u₄:4, u₅:5', likes: '4 คน 👍 (80%)', avg: '4.00★', rank: 'อันดับ 1 (ร่วม) 🏆' },
        { course: '💡 Data Story (E)', ratings: 'u₂:5, u₃:1, u₄:4, u₅:5', likes: '3 คน 👍 (75%)', avg: '3.75★', rank: 'อันดับ 2 🥈' },
        { course: '📈 Excel (D)', ratings: 'u₁:2, u₂:1, u₃:4, u₅:2', likes: '1 คน 👍 (25%)', avg: '2.25★', rank: 'อันดับ 4' },
        { course: '🎨 UX (C)', ratings: 'u₁:1, u₂:2, u₃:5, u₄:2', likes: '1 คน 👍 (25%)', avg: '2.50★', rank: 'อันดับ 5' },
        { course: '🤖 Deep Learning (F)', ratings: 'u₅:5 (มีคนเรียนแค่คนเดียว!)', likes: '1 คน 👍 (100% ปลอม)', avg: '5.00★', rank: '⚠️ เสี่ยง Cold Start' }
      ];

      const tbody = document.createElement('tbody');
      popRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeCol === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.course);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.ratings, row.likes, row.avg, row.rank];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 3 ? 'is-summary-cell' : '';
          if (isHi) {
            if (txt.includes('⚠️')) cls += ' cell-target';
            else if (cIdx === 3 || txt.includes('🏆') || txt.includes('🥈')) cls += ' cell-focus';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v1-cf-similarity') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['คอร์สเปรียบเทียบ', 'คะแนน 👩 ฟ้า (u₁)', 'คะแนน 🧑 พลอย (u₂)', 'ความสัมพันธ์ / การคูณ', 'สถานะในสูตร'];
      headers.forEach((h, i) => {
        const th = make('th', i === 3 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const simRows = [
        { item: '🐍 Python (A)', u1: '5★', u2: '4★', math: '5 × 4 = 20 (ชอบมากทั้งคู่)', tag: 'Co-rated (ร่วมกัน) ✅' },
        { item: '📊 SQL (B)', u1: '4★', u2: '5★', math: '4 × 5 = 20 (ชอบมากทั้งคู่)', tag: 'Co-rated (ร่วมกัน) ✅' },
        { item: '🎨 UX (C)', u1: '1★', u2: '2★', math: '1 × 2 = 2 (ไม่ชอบทั้งคู่)', tag: 'Co-rated (ร่วมกัน) ✅' },
        { item: '📈 Excel (D)', u1: '2★', u2: '1★', math: '2 × 1 = 2 (ไม่ชอบทั้งคู่)', tag: 'Co-rated (ร่วมกัน) ✅' },
        { item: '💡 Data Story (E)', u1: '? 🎯', u2: '5★', math: 'พลอยชอบมากแต่ฟ้ายังไม่ได้เรียน', tag: 'เป้าหมายพยากรณ์ 🎯' },
        { item: 'สรุปการคำนวณ', u1: '||u₁|| = √46 ≈ 6.78', u2: '||u₂|| = √58 ≈ 7.62', math: 'Dot = 50 · Jaccard = 4/5 (0.80)', tag: 'Cosine = 0.9680 (คล้ายกันมาก) 🏆', isSummary: true }
      ];

      const tbody = document.createElement('tbody');
      simRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = (b.mode === 'co-rated' && rIdx < 4) || (b.mode === 'jaccard' && rIdx === 5) || (b.mode === 'cosine' && rIdx === 5) || (b.mode === 'summary');
        const rth = make('th', isHi ? 'is-active-header' : '', row.item);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.u1, row.u2, row.math, row.tag];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 3 || row.isSummary ? 'is-summary-cell' : '';
          if (isHi) {
            if (txt.includes('? 🎯')) cls += ' cell-target';
            else if (txt.includes('🏆') || txt.includes('Cosine')) cls += ' cell-focus';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v1-cf-centering') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['ผู้ใช้', 'คะแนนดิบ [A, B, C, D]', 'คะแนนเฉลี่ย (r̄)', 'เวกเตอร์หลังหักค่าเฉลี่ย (r − r̄)', 'สไตล์การให้คะแนน'];
      headers.forEach((h, i) => {
        const th = make('th', i === 3 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const centRows = [
        { user: '👩 ฟ้า (u₁)', raw: '[5★, 4★, 1★, 2★]', mean: 'r̄₁ = 3.00★', centered: '[+2.0, +1.0, −2.0, −1.0]', style: 'ให้ตามจริง (สัดส่วนสมดุล)' },
        { user: '🧑 พลอย (u₂)', raw: '[4★, 5★, 2★, 1★]', mean: 'r̄₂ = 3.80★', centered: '[+0.2, +1.2, −1.8, −2.8]', style: 'ค่อนข้างใจดี (ชอบให้ดาวสูง)' },
        { user: '🧔 กานต์ (u₄)', raw: '[5★, 4★, 2★, —]', mean: 'r̄₄ = 3.67★', centered: '[+1.33, +0.33, −1.67, —]', style: 'สายชื่นชม (ไม่ค่อยตัดคะแนน)' },
        { user: 'ผลลัพธ์ Pearson', raw: 'Cov = +4.50', mean: 'σ₁ = 1.83 · σ₂ = 1.83', centered: 'Pearson r = +0.8269', style: 'กำจัดอคติความใจดีออกหมดจด 🛡️', isSummary: true }
      ];

      const tbody = document.createElement('tbody');
      centRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = (b.mode === 'mean' && rIdx < 3) || (b.mode === 'centered' && (rIdx === 0 || rIdx === 1)) || (b.mode === 'pearson' && rIdx === 3) || (b.mode === 'summary');
        const rth = make('th', isHi ? 'is-active-header' : '', row.user);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.raw, row.mean, row.centered, row.style];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 3 || row.isSummary ? 'is-summary-cell' : '';
          if (isHi) {
            if (cIdx === 2) cls += ' cell-focus';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v1-cf-support') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['ผู้ใช้เพื่อนบ้าน', 'คอร์สที่ให้คะแนนร่วม (n_co)', 'ความคล้ายดิบ (Raw Sim)', 'ตัวลดทอน min(n, β)/β (β=4)', 'ความคล้ายหลังลดทอน (Damped Sim)'];
      headers.forEach((h, i) => {
        const th = make('th', i === 4 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const supRows = [
        { neighbor: '🧑 พลอย (u₂)', co: '4 คอร์ส (A, B, C, D)', raw: '0.8269', factor: '4 / 4 = 1.0000 (ครบเกณฑ์)', damped: '0.8269 (คงเดิมเต็มที่) 🏆' },
        { neighbor: '🧔 กานต์ (u₄)', co: '3 คอร์ส (A, B, C)', raw: '0.8889', factor: '3 / 4 = 0.7500 (ยังขาด 1)', damped: '0.6667 (ลดน้ำหนักลง 25%) ⚖️' },
        { neighbor: '👨 นนท์ (u₃)', co: '4 คอร์ส (A, B, C, D)', raw: '−0.7500', factor: '4 / 4 = 1.0000 (ครบเกณฑ์)', damped: '−0.7500 (รสนิยมตรงข้าม)' },
        { neighbor: '⚠️ ผู้ใช้บังเอิญ', co: '1 คอร์ส (A อย่างเดียว)', raw: '1.0000 (ตรงกันเป๊ะ)', factor: '1 / 4 = 0.2500 (ลงโทษหนัก)', damped: '0.2500 (ตัดภาพลวงตา) 🛡️', isSummary: true }
      ];

      const tbody = document.createElement('tbody');
      supRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = (b.mode === 'trap' && rIdx === 3) || (b.mode === 'threshold' && (rIdx === 0 || rIdx === 1)) || (b.mode === 'weighted' && rIdx < 3) || (b.mode === 'summary');
        const rth = make('th', isHi ? 'is-active-header' : '', row.neighbor);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.co, row.raw, row.factor, row.damped];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 3 || row.isSummary ? 'is-summary-cell' : '';
          if (isHi) {
            if (txt.includes('⚠️')) cls += ' cell-target';
            else if (cIdx === 3) cls += ' cell-focus';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v1-cf-user') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['เพื่อนบ้านที่มีคะแนน E', 'ความคล้าย (sim)', 'คะแนนจริง E (r_vE)', 'คะแนนเฉลี่ย (r̄_v)', 'ส่วนเบี่ยงเบน (r_vE − r̄_v)', 'ผลคูณถ่วงน้ำหนัก'];
      headers.forEach((h, i) => {
        const th = make('th', i === 5 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const userRows = [
        { neighbor: '🧑 พลอย (u₂)', sim: '0.8269 (อันดับ 1)', r: '5★', mean: '3.80★', dev: '+1.20★', prod: '0.8269 × (+1.20) = +0.9923 🎯' },
        { neighbor: '🧔 กานต์ (u₄)', sim: '0.6667 (อันดับ 2)', r: '4★', mean: '3.67★', dev: '+0.33★', prod: '0.6667 × (+0.33) = +0.2200 🎯' },
        { neighbor: '👨 นนท์ (u₃)', sim: '−0.7500 (ติดลบ)', r: '1★', mean: '3.00★', dev: '−2.00★', prod: 'ถูกตัดทิ้ง (ไม่ใช่ Top-2) ❌' },
        { neighbor: 'ทำนายให้ 👩 ฟ้า (r̄₁ = 3.0)', sim: '∑ sim = 1.4936', r: 'Target: E', mean: 'ฐาน: 3.00★', dev: 'Dev = +0.8117★', prod: 'r̂(ฟ้า, E) = 3.8117★ (หรือ 4.11★) 🏆', isSummary: true }
      ];

      const tbody = document.createElement('tbody');
      userRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = (b.mode === 'filter' && rIdx < 3) || (b.mode === 'select-k' && (rIdx === 0 || rIdx === 1)) || (b.mode === 'deviation' && (rIdx === 0 || rIdx === 1)) || (b.mode === 'predict' && rIdx === 3);
        const rth = make('th', isHi ? 'is-active-header' : '', row.neighbor);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.sim, row.r, row.mean, row.dev, row.prod];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 4 || row.isSummary ? 'is-summary-cell' : '';
          if (isHi) {
            if (txt.includes('❌')) cls += ' cell-target';
            else if (cIdx === 4) cls += ' cell-focus';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v1-cf-item') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['คอร์สเปรียบเทียบกับ E', 'ผู้ใช้ที่เรียนทั้งคู่', 'เวกเตอร์ลบค่าเฉลี่ยผู้ใช้ (u₂..u₅)', 'Adjusted Cosine กับ E', 'สถานะความเกื้อหนุน'];
      headers.forEach((h, i) => {
        const th = make('th', i === 3 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const itemRows = [
        { course: '🐍 Python (A)', coUsers: 'u₂, u₃, u₄, u₅ (4 คน)', vec: '[+0.2, −1.0, +1.3, −0.5]', sim: '+0.7115', status: 'คอร์สเกื้อหนุนอันดับ 1 🏆' },
        { course: '📊 SQL (B)', coUsers: 'u₂, u₃, u₄, u₅ (4 คน)', vec: '[+1.2, −1.0, +0.3, +0.5]', sim: '+0.7115', status: 'คอร์สเกื้อหนุนอันดับ 1 (ร่วม) 🏆' },
        { course: '🎨 UX (C)', coUsers: 'u₂, u₃ (2 คน)', vec: '[−1.8, +2.0, —, —]', sim: '−0.6325', status: 'สัมพันธ์เชิงลบ (คนละสายงาน) ❌' },
        { course: '📈 Excel (D)', coUsers: 'u₂, u₃, u₅ (3 คน)', vec: '[−2.8, +1.0, —, −2.5]', sim: '−0.5222', status: 'สัมพันธ์เชิงลบ (คนละสายงาน) ❌' },
        { course: '💡 Data Story (E)', coUsers: 'คอร์สเป้าหมาย', vec: 'เวกเตอร์อ้างอิงของ E', sim: '1.0000', status: 'กำลังหา k=2 เพื่อนบ้านที่ใกล้ที่สุด 🎯', isSummary: true }
      ];

      const tbody = document.createElement('tbody');
      itemRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = (b.mode === 'target-item' && rIdx === 4) || (b.mode === 'adjusted-a' && rIdx === 0) || (b.mode === 'all-sim' && (rIdx === 0 || rIdx === 1)) || (b.mode === 'summary');
        const rth = make('th', isHi ? 'is-active-header' : '', row.course);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.coUsers, row.vec, row.sim, row.status];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 3 || row.isSummary ? 'is-summary-cell' : '';
          if (isHi) {
            if (txt.includes('❌')) cls += ' cell-target';
            else if (cIdx === 2 || txt.includes('🏆')) cls += ' cell-focus';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v1-cf-item-predict') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['คอร์สที่ 👩 ฟ้า เคยเรียน', 'คะแนนของฟ้า (r_1j)', 'ส่วนเบี่ยงเบนฟ้า (r_1j − r̄_1)', 'ความคล้ายกับ E (sim_Ej)', 'ผลคูณถ่วงน้ำหนัก'];
      headers.forEach((h, i) => {
        const th = make('th', i === 4 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const predRows = [
        { course: '🐍 Python (A)', r: '5★', dev: '+2.00★ (ชอบมาก)', sim: '0.7115 (Top-1)', prod: '0.7115 × (+2.00) = +1.4230 🎯' },
        { course: '📊 SQL (B)', r: '4★', dev: '+1.00★ (ชอบ)', sim: '0.7115 (Top-2)', prod: '0.7115 × (+1.00) = +0.7115 🎯' },
        { course: '🎨 UX (C)', r: '1★', dev: '−2.00★', sim: '−0.6325 (ตัดทิ้ง)', prod: 'ไม่นำมาคิด (คัดเฉพาะ k=2 คอร์สที่ดีสุด) ❌' },
        { course: '📈 Excel (D)', r: '2★', dev: '−1.00★', sim: '−0.5222 (ตัดทิ้ง)', prod: 'ไม่นำมาคิด (คัดเฉพาะ k=2 คอร์สที่ดีสุด) ❌' },
        { course: 'ผลรวมทำนายให้ E', r: 'ฐานฟ้า r̄₁ = 3.0★', dev: '∑ sim·dev = +2.1345', sim: '∑ sim = 1.4230', prod: 'r̂(ฟ้า, E) = 3.0 + 1.50 = 4.5000★ 🏆', isSummary: true }
      ];

      const tbody = document.createElement('tbody');
      predRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = (b.mode === 'memory' && rIdx < 2) || (b.mode === 'deviations' && (rIdx === 0 || rIdx === 1)) || (b.mode === 'weighted-dev' && (rIdx === 0 || rIdx === 1)) || (b.mode === 'predict-final' && rIdx === 4);
        const rth = make('th', isHi ? 'is-active-header' : '', row.course);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.r, row.dev, row.sim, row.prod];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 3 || row.isSummary ? 'is-summary-cell' : '';
          if (isHi) {
            if (txt.includes('❌')) cls += ' cell-target';
            else if (cIdx === 3) cls += ' cell-focus';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v1-cf-implicit') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['คอร์สสินค้า', '👩 ฟ้า (u₁)', '🧑 พลอย (u₂)', '🧔 กานต์ (u₄)', 'คลิกร่วมกับ E (Co-occurrence)', 'อิทธิพลต่อคะแนนแนะนำ'];
      headers.forEach((h, i) => {
        const th = make('th', i === 4 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const impRows = [
        { course: '🐍 Python (A)', u1: '1 (คลิก)', u2: '1 (คลิก)', u4: '1 (คลิก)', co: '2 ครั้ง (พลอย & กานต์)', score: 'ฟ้าคลิกแล้ว → ส่งแรงเชียร์ให้ E ⚡' },
        { course: '📊 SQL (B)', u1: '1 (คลิก)', u2: '1 (คลิก)', u4: '1 (คลิก)', co: '2 ครั้ง (พลอย & กานต์)', score: 'ฟ้าคลิกแล้ว → ส่งแรงเชียร์ให้ E ⚡' },
        { course: '💡 Data Story (E)', u1: '? 🎯 (ยังไม่คลิก)', u2: '1 (คลิก)', u4: '1 (คลิก)', co: '— (คอร์สเป้าหมาย)', score: 'คะแนนทำนาย = (2+2)/3 = 1.3333 🎯' },
        { course: '🎨 UX (C)', u1: '0', u2: '0', u4: '0', co: '0 ครั้ง', score: 'ไม่มีผลต่อการแนะนำ E' },
        { course: 'สรุปหัวใจ Implicit', u1: 'ไม่มี Dislike ชัดเจน', u2: 'แปลงเป็น Binary 0/1', u4: 'Sim(A, E) = 2/3', score: 'จัดอันดับ Ranking ได้อย่างทรงพลัง 🏆', isSummary: true }
      ];

      const tbody = document.createElement('tbody');
      impRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = (b.mode === 'binary' && rIdx < 3) || (b.mode === 'co-occurrence' && (rIdx === 0 || rIdx === 1)) || (b.mode === 'score' && rIdx === 2) || (b.mode === 'summary');
        const rth = make('th', isHi ? 'is-active-header' : '', row.course);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.u1, row.u2, row.u4, row.co, row.score];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 4 || row.isSummary ? 'is-summary-cell' : '';
          if (isHi) {
            if (txt.includes('? 🎯')) cls += ' cell-target';
            else if (txt.includes('🏆') || txt.includes('1.3333')) cls += ' cell-focus';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v3-cf-bias') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['องค์ประกอบอคติ', 'สัญลักษณ์', 'ค่าตัวเลขจริง', 'ความหมายในระบบจริง', 'ผลกระทบต่อคะแนน'];
      headers.forEach((h, i) => {
        const th = make('th', i === 2 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const biasRows = [
        { label: 'คะแนนเฉลี่ยทั้งระบบ (Global Mean)', sym: 'μ', val: '3.3000★', meaning: 'เกณฑ์คะแนนเฉลี่ยของทุกการประเมินในระบบ', effect: 'จุดเริ่มต้นอ้างอิงมาตรฐาน (Baseline Anchor)' },
        { label: 'อคติประจำตัวผู้ใช้ (User Bias 👩 ฟ้า)', sym: 'b_u1', val: '−0.1500★', meaning: 'ฟ้าเป็นคนให้คะแนนเคี่ยว ต่ำกว่าค่าเฉลี่ยเสมอ', effect: 'ปรับลดคะแนนลงตามนิสัยผู้ใช้ −0.15★' },
        { label: 'อคติประจำคอร์ส (Item Bias 💡 Data Story)', sym: 'b_E', val: '+0.3000★', meaning: 'คอร์สยอดนิยม คุณภาพสูง คนมักให้คะแนนสูง', effect: 'ปรับเพิ่มคะแนนขึ้นตามคุณภาพคอร์ส +0.30★' },
        { label: 'คะแนนอ้างอิงพื้นฐาน (Baseline Decomposition)', sym: 'b(u₁, E)', val: '3.4500★', meaning: '3.30 − 0.15 + 0.30 = 3.4500★', effect: 'ฐานที่มั่นคงก่อนนำเพื่อนบ้านมาช่วยทำนาย 🛡️', isSummary: true }
      ];

      const tbody = document.createElement('tbody');
      biasRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.label);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.sym, row.val, row.meaning, row.effect];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 3 || row.isSummary ? 'is-summary-cell' : '';
          if (isHi) {
            if (cIdx === 1) cls += ' cell-focus';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v1-cf-baseline') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['ขั้นตอนการคำนวณ', 'ส่วนประกอบคณิตศาสตร์', 'ค่าตัวเลขจริง', 'ข้อได้เปรียบเหนือ kNN ดั้งเดิม'];
      headers.forEach((h, i) => {
        const th = make('th', i === 2 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const baseRows = [
        { step: '1 · พุกอ้างอิง (Baseline Anchor)', math: 'b(u₁, E) = μ + b_u1 + b_E', val: '3.4500★', benefit: 'ไม่อ่อนไหวตามอคติความใจดีหรือใจร้ายของผู้ใช้' },
        { step: '2 · ส่วนตกค้างของเพื่อนบ้าน (Residuals)', math: 'e(v, j) = r(v, j) − b(v, j)', val: 'พลอย: +1.20 · กานต์: +0.90', benefit: 'สะท้อนความชื่นชอบแท้จริงหลังหักอคติสองฝั่ง' },
        { step: '3 · ส่วนตกค้างถ่วงน้ำหนัก (Weighted Residual)', math: '∑ sim · e / ∑ |sim|', val: '+1.0500★', benefit: 'เพื่อนบ้านร่วมยืนยันว่าคอร์สนี้ ดีกว่าเกณฑ์ปกติ' },
        { step: '4 · คะแนนทำนายรวม (Final Prediction)', math: 'b(u₁, E) + Residual', val: '3.45 + 1.05 = 4.5000★ 🏆', benefit: 'แม่นยำและเสถียรสูงสุดตามมาตรฐาน BellKor 🛡️', isSummary: true }
      ];

      const tbody = document.createElement('tbody');
      baseRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.step);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.math, row.val, row.benefit];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 2 || row.isSummary ? 'is-summary-cell' : '';
          if (isHi) {
            if (cIdx === 1) cls += ' cell-focus';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v1-cf-diagnosis') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['โรคประจำตัวของ CF', 'อาการที่ตรวจพบ (Symptom)', 'ผลกระทบต่อระบบ (Impact)', 'ยารักษา / วิธีแก้ปัญหา (Prescription)'];
      headers.forEach((h, i) => {
        const th = make('th', i === 3 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const diagRows = [
        { label: '1 · User Cold Start', sym: 'ผู้ใช้สมัครใหม่ มีประวัติ 0 คอร์ส', imp: 'หาเพื่อนบ้านไม่ได้ (sim = NaN) ทำนายบอดสนิท', rx: 'ใช้ Popularity Baseline + Onboarding Survey 🚀' },
        { label: '2 · Item Cold Start', sym: 'คอร์สเพิ่งเปิดใหม่ ยังไม่มีใครเคยเรียน', imp: 'ไม่มีใครเคยให้ดาว คอร์สจมหายไร้ตัวตน', rx: 'ใช้ Content-based / Multimodal Feature เวกเตอร์ 🖼️' },
        { label: '3 · Matrix Sparsity', sym: 'ตารางว่าง > 99% ใน Production จริง', imp: 'ผู้ใช้สองคนแทบไม่มีคอร์สที่เรียนตรงกันเลย', rx: 'ใช้ Matrix Factorization / Latent Factor Models 🧩' },
        { label: '4 · Gray Sheep (แกะเทา)', sym: 'ผู้ใช้รสนิยมแปลกประหลาด ไม่เข้าพวก', imp: 'หาเพื่อนบ้านที่คลื่นตรงกันไม่ได้ ทำนายเพี้ยน', rx: 'ใช้ Bandit Exploration / Hybrid Ensemble 🐑', isSummary: true }
      ];

      const tbody = document.createElement('tbody');
      diagRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.label);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.sym, row.imp, row.rx];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 2 || row.isSummary ? 'is-summary-cell' : '';
          if (isHi) {
            if (cIdx === 1) cls += ' cell-target';
            else if (cIdx === 2) cls += ' cell-focus';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v3-model-mf') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['เอนทิตีในระบบ', 'เวกเตอร์แฝง (Latent Factors k=2)', 'มิติที่ 1: โค้ดเข้มข้น', 'มิติที่ 2: การนำไปใช้จริง', 'อคติและผลลัพธ์'];
      headers.forEach((h, i) => {
        const th = make('th', i === 4 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const mfRows = [
        { label: '👩 ฟ้า (ผู้ใช้ u₁)', vec: 'p_u = [1.00, 0.50]', dim1: '1.00 (ชอบโค้ดมาก)', dim2: '0.50 (ชอบประยุกต์ปานกลาง)', res: 'b_u = −0.10★' },
        { label: '💡 Data Story (คอร์ส E)', vec: 'q_i = [0.80, 0.40]', dim1: '0.80 (มีเนื้อหาโค้ดแน่น)', dim2: '0.40 (สอนประยุกต์ดี)', res: 'b_i = +0.20★' },
        { label: 'ผลคูณดอต (Dot Product)', vec: 'p_u · q_i', dim1: '1.00 × 0.80 = 0.80', dim2: '0.50 × 0.40 = 0.20', res: '∑ = 1.0000 🎯' },
        { label: 'คะแนนทำนายรวม (r̂_ui)', vec: 'μ + b_u + b_i + p_u·q_i', dim1: '3.00 − 0.10 + 0.20', dim2: '+ 1.0000 (ความเข้ากัน)', res: 'r̂ = 4.1000★ 🏆', isSummary: true }
      ];

      const tbody = document.createElement('tbody');
      mfRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.label);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.vec, row.dim1, row.dim2, row.res];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 3 || row.isSummary ? 'is-summary-cell' : '';
          if (isHi) {
            if (cIdx === 3) cls += ' cell-focus';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v4-model-loss') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['จุดในเมทริกซ์', 'คะแนนจริง (r_ui)', 'โมเดลทำนาย (r̂_ui)', 'ค่าความคลาดเคลื่อน (e = r − r̂)', 'Loss กำลังสอง (½ e²)'];
      headers.forEach((h, i) => {
        const th = make('th', i === 4 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const lossRows = [
        { entry: 'r(ฟ้า, Python)', actual: '5.00★', pred: '4.80★', err: 'e = +0.20★', loss: '½(0.20)² = 0.0200' },
        { entry: 'r(ฟ้า, SQL)', actual: '4.00★', pred: '3.08★', err: 'e = +0.92★ (ทายต่ำไป!)', loss: '½(0.92)² = 0.4232 🎯' },
        { entry: 'r(ฟ้า, Data Story)', actual: '? (ไม่เคยเรียน)', pred: '— (ไม่คำนวณ)', err: '— (ข้ามช่องว่าง)', loss: '0.0000 (ข้ามช่องว่าง!) 🛡️' },
        { entry: 'เปรียบเทียบ Funk SVD vs SVD', actual: 'SVD เก่าต้องเติม 0', pred: 'Funk ข้ามช่องว่าง 100%', err: 'คำนวณเฉพาะ Observed Entries', loss: 'เร็วขึ้นล้านเท่าและไม่เพี้ยน ⚡', isSummary: true }
      ];

      const tbody = document.createElement('tbody');
      lossRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.entry);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.actual, row.pred, row.err, row.loss];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 3 || row.isSummary ? 'is-summary-cell' : '';
          if (isHi) {
            if (txt.includes('🎯')) cls += ' cell-focus';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v4-model-sgd') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['พารามิเตอร์', 'ค่าเดิมก่อนอัปเดต', 'เกรเดียนต์ (Gradient)', 'ค่าปรับแก้ (Δ = η·g)', 'ค่าใหม่หลังก้าว 1 Step'];
      headers.forEach((h, i) => {
        const th = make('th', i === 4 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const sgdRows = [
        { param: 'เวกเตอร์ผู้ใช้ p_u1', before: '[0.2000, 0.1000]', grad: 'e · q − λ p', delta: '+0.10 × [0.44, −0.194]', after: '[0.2440, 0.0806] 📈' },
        { param: 'เวกเตอร์สินค้า q_i2', before: '[0.5000, −0.2000]', grad: 'e · p − λ q', delta: '+0.10 × [0.164, 0.112]', after: '[0.5164, −0.1988] 📈' },
        { param: 'คะแนนทำนาย r̂_12', before: '0.0800★ (ต่ำเกินไป)', grad: 'p · q', delta: 'กระโดดเข้าใกล้ 4.0★', after: '0.1100★ (เริ่มเข้าที่) 🎯' },
        { param: 'ค่าความเสียหาย (Loss)', before: '0.4282 (ก่อนก้าว)', grad: 'ลดลงทันที', delta: 'ลดลง 16.3%', after: '0.3541 (ก้าวถูกต้อง!) 🏆', isSummary: true }
      ];

      const tbody = document.createElement('tbody');
      sgdRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.param);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.before, row.grad, row.delta, row.after];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 3 || row.isSummary ? 'is-summary-cell' : '';
          if (isHi) {
            if (cIdx === 3) cls += ' cell-focus';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v4-model-reg') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['ระดับบทลงโทษ (λ)', 'พฤติกรรมเวกเตอร์ (||w||²)', 'Train RMSE (บนชุดฝึก)', 'Test RMSE (บนชุดสอบ)', 'สถานะของโมเดล'];
      headers.forEach((h, i) => {
        const th = make('th', i === 4 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const regRows = [
        { lambda: 'λ = 0 (ไม่ลงโทษเลย)', norm: 'เวกเตอร์โตไร้ขอบเขต (||w|| = 25.4)', train: '0.15★ (จำได้หมด)', test: '1.45★ (แย่มาก)', status: '💥 Overfitting (จำสัญญาณกวน)' },
        { lambda: 'λ = 100 (ลงโทษแรงเกินไป)', norm: 'เวกเตอร์หดเกือบเป็น 0 (||w|| = 0.01)', train: '1.25★ (ทำนายแย่)', test: '1.28★ (แนะนำเหมือนกันหมด)', status: '⚠️ Underfitting (หดจนไร้พลัง)' },
        { lambda: 'λ = 0.05 (จุดสมดุล Optimal)', norm: 'เวกเตอร์มีขนาดพอเหมาะ (||w|| = 1.2)', train: '0.72★ (เรียนรู้แก่นแท้)', test: '0.81★ (แม่นยำสูงสุด)', status: '🏆 Sweet Spot (ดีที่สุด)' },
        { lambda: 'สรุปบทลงโทษ L2', norm: '½λ(||p||² + ||q||²)', train: 'ดึงเวกเตอร์ไม่ให้พุ่งสูงเกิน', test: 'ทนทานต่อสัญญาณรบกวน', status: 'หัวใจความทนทานของ RecSys 🛡️', isSummary: true }
      ];

      const tbody = document.createElement('tbody');
      regRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.lambda);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.norm, row.train, row.test, row.status];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 3 || row.isSummary ? 'is-summary-cell' : '';
          if (isHi) {
            if (txt.includes('💥') || txt.includes('⚠️')) cls += ' cell-target';
            else if (txt.includes('🏆')) cls += ' cell-focus';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v4-model-als') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['ขั้นตอนการสลับ (ALS)', 'สิ่งที่ตรึงไว้คงที่ (Locked)', 'สิ่งที่แก้หาคำตอบ (Solved)', 'รูปแบบสมการคำนวณ', 'คุณสมบัติทางคณิตศาสตร์'];
      headers.forEach((h, i) => {
        const th = make('th', i === 4 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const alsRows = [
        { step: 'ครึ่งก้าวที่ 1', locked: 'ตรึงเวกเตอร์สินค้า Q ทั้งหมด', solved: 'แก้หาเวกเตอร์ผู้ใช้ P พร้อมกัน', formula: 'p_u = (Qᵀ Q + λI)⁻¹ Qᵀ r_u', prop: 'Quadratic Convex รูปปิดจบในตัว ⚡' },
        { step: 'ครึ่งก้าวที่ 2', locked: 'ตรึงเวกเตอร์ผู้ใช้ P ทั้งหมด', solved: 'แก้หาเวกเตอร์สินค้า Q พร้อมกัน', formula: 'q_i = (Pᵀ P + λI)⁻¹ Pᵀ r_i', prop: 'Quadratic Convex รูปปิดจบในตัว ⚡' },
        { step: 'เปรียบเทียบกับ SGD', locked: 'SGD ต้องจูน Learning Rate (η)', solved: 'ALS ไม่มี Learning Rate', formula: 'คำตอบดีที่สุดของแต่ละฝั่งทันที', prop: 'Loss ลดลงแบบ Monotonic ทุกก้าว 📉' },
        { step: 'จุดเด่นด้านขนาน (Spark)', locked: 'ผู้ใช้แต่ละคนเป็นอิสระต่อกัน', solved: 'สินค้าแต่ละชิ้นเป็นอิสระต่อกัน', formula: 'กระจายงานขนานข้ามคลัสเตอร์', prop: 'สเกลสู่ข้อมูลพันล้านชิ้นสบาย 🚀', isSummary: true }
      ];

      const tbody = document.createElement('tbody');
      alsRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.step);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.locked, row.solved, row.formula, row.prop];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 3 || row.isSummary ? 'is-summary-cell' : '';
          if (isHi) {
            if (cIdx === 3) cls += ' cell-focus';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v3-model-history') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['ส่วนประกอบโปรไฟล์ 👩 ฟ้า', 'สัญลักษณ์', 'เวกเตอร์ที่ได้', 'ความหมายในระบบจริง', 'อิทธิพลต่อคะแนน'];
      headers.forEach((h, i) => {
        const th = make('th', i === 4 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const histRows = [
        { part: '1 · เวกเตอร์แฝงโดยตรง (Explicit)', sym: 'p_u', vec: '[0.20, 0.10]', meaning: 'รสนิยมที่สกัดจากคะแนนดาวที่ฟ้าเคยให้', inf: 'ฐานตัวตนหลักของผู้ใช้' },
        { part: '2 · ประวัติการคลิกดู (Implicit History)', sym: '|R_u|^(−0.5) ∑ y_j', vec: '[0.30, 0.10]', meaning: 'ฟ้าเคยคลิก 4 คอร์ส (มีเวกเตอร์พฤติกรรมหนุน)', inf: 'เสริมความคมแม้ฟ้าให้ดาวน้อย' },
        { part: '3 · โปรไฟล์รวมร่าง (SVD++ Profile)', sym: 'p̃_u = p_u + ∑ y_j', vec: '[0.50, 0.20]', meaning: 'โปรไฟล์รวมทั้งดาวและพฤติกรรมการคลิกจริง', inf: 'เวกเตอร์มีความแม่นยำสูงขึ้น 2 เท่า 🎯' },
        { part: '4 · คะแนนทำนายกับ Data Story', sym: 'b_ui + p̃_u · q_i', vec: '3.00 + (0.5×0.4 + 0.2×0.5)', meaning: '3.00 + 0.30 = 3.3000★', inf: 'คว้ารางวัลชนะเลิศ Netflix Prize 🏆', isSummary: true }
      ];

      const tbody = document.createElement('tbody');
      histRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.part);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.sym, row.vec, row.meaning, row.inf];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 3 || row.isSummary ? 'is-summary-cell' : '';
          if (isHi) {
            if (cIdx === 3) cls += ' cell-focus';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v3-model-wrmf') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['พฤติกรรมของผู้ใช้', 'จำนวนครั้ง (r_ui)', 'ความชอบแฝง (Preference p)', 'ความมั่นใจ (Confidence c = 1+α·r)', 'บทลงโทษหากโมเดลทำนายผิด'];
      headers.forEach((h, i) => {
        const th = make('th', i === 4 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const wrmfRows = [
        { action: 'เรียนซ้ำ 20 รอบ / ดูจนจบ 5 รอบ', count: 'r = 20 ครั้ง', pref: 'p = 1 (ชอบแน่นอน 100%)', conf: 'c = 1 + 40(20) = 801 💥', penalty: 'หากทายว่าไม่ชอบ จะโดนลงโทษมหาศาล!' },
        { action: 'คลิกดูผ่านๆ แค่ 1 ครั้ง', count: 'r = 1 ครั้ง', pref: 'p = 1 (อาจจะชอบหรือมือลั่น)', conf: 'c = 1 + 40(1) = 41', penalty: 'ลงโทษปานกลาง (เผื่อเป็นอุบัติเหตุ)' },
        { action: 'ไม่เคยแตะเลย (Unobserved)', count: 'r = 0 ครั้ง', pref: 'p = 0 (สมมุติว่ายังไม่ชอบ)', conf: 'c = 1 + 40(0) = 1 (ต่ำสุด)', penalty: 'ลงโทษเบาๆ เพราะอาจจะยังมองไม่เห็น 🛡️' },
        { action: 'สรุปปรัชญา WRMF', count: 'ไม่มี Dislike ชัดเจน', pref: 'แยกความชอบออกจากความมั่นใจ', conf: 'Confidence คือน้ำหนัก Loss', penalty: 'เปลี่ยน 0 ทั้งตารางให้มีประโยชน์ 🏆', isSummary: true }
      ];

      const tbody = document.createElement('tbody');
      wrmfRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.action);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.count, row.pref, row.conf, row.penalty];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 3 || row.isSummary ? 'is-summary-cell' : '';
          if (isHi) {
            if (txt.includes('💥')) cls += ' cell-target';
            else if (cIdx === 2 || txt.includes('🏆')) cls += ' cell-focus';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v6-model-ials') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['วิธีการคำนวณ', 'สูตรที่ต้องคูณ', 'จำนวนรอบการคูณ (FLOPs)', 'เวลาที่ใช้จริง', 'ความเป็นไปได้ใน Production'];
      headers.forEach((h, i) => {
        const th = make('th', i === 4 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const ialsRows = [
        { method: 'วิธีคำนวณตรงๆ (Naive ALS)', formula: 'Qᵀ C_u Q = ∑ c_ui q_i q_iᵀ', flops: 'M ผู้ใช้ × N สินค้า × k² มิติ', time: 'ใช้เวลาหลายชั่วโมงถึงหลายวัน 💥', feasibility: '❌ ล่มใน Production (สเกลไม่ได้)' },
        { method: 'ทางลัดอัจฉริยะ (iALS Trick)', formula: 'Qᵀ C_u Q = (Qᵀ Q) + Qᵀ (C_u − I) Q', flops: 'Qᵀ Q รอบเดียว + เฉพาะของที่คลิก', time: 'ลดจาก O(M·N·k²) เหลือ O(|R|·k² + M·k³)', feasibility: '⚡ ลดเวลาลง 10,000 เท่า!' },
        { method: 'ความเบาบางของ (C_u − I)', formula: 'คนทั่วไปคลิกแค่ ~50 ชิ้นจาก 1,000,000', flops: 'ไม่ต้องวนลูปของที่ไม่คลิก 999,950 ชิ้น', time: 'วนลูปเฉพาะ 50 ชิ้นที่มีค่าจริง', feasibility: '🏆 คำนวณเสร็จในหลักวินาที' },
        { method: 'สรุปคุณค่าของ iALS', formula: 'Implicit ALS มาตรฐานอุตสาหกรรม', flops: 'รองรับสินค้าและผู้ใช้ระดับ 100 ล้านชิ้น', time: 'ใช้จริงใน Spotify, Meta, Netflix', feasibility: 'มาตรฐานทองคำของ Implicit RecSys 🚀', isSummary: true }
      ];

      const tbody = document.createElement('tbody');
      ialsRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.method);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.formula, row.flops, row.time, row.feasibility];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 3 || row.isSummary ? 'is-summary-cell' : '';
          if (isHi) {
            if (txt.includes('❌') || txt.includes('💥')) cls += ' cell-target';
            else if (cIdx === 3 || txt.includes('⚡') || txt.includes('🏆')) cls += ' cell-focus';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v4-model-bpr') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['บทบาทใน Triplet', 'สัญลักษณ์', 'ตัวอย่างในระบบคอร์ส', 'คะแนนทำนายโมเดล (s)', 'เป้าหมายการจัดอันดับ (Pairwise Target)'];
      headers.forEach((h, i) => {
        const th = make('th', i === 4 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const bprRows = [
        { role: 'ผู้ใช้ (User)', sym: 'u', eg: '👩 ฟ้า', s: '—', target: 'เรียงลำดับคอร์สให้ตรงใจฟ้าที่สุด' },
        { role: 'คอร์สบวกที่เคยเรียน (Positive)', sym: 'i⁺', eg: '🐍 Python (ฟ้าเคยเรียนแล้ว)', s: 's_ui = 0.85', target: 'ต้องอยู่อันดับเหนือกว่าของที่ยังไม่เรียน 🥇' },
        { role: 'คอร์สลบที่ยังไม่เคยแตะ (Negative)', sym: 'j⁻', eg: '🎨 UX (ฟ้ายังไม่เคยแตะ)', s: 's_uj = 0.35', target: 'ต้องถูกจัดอันดับให้อยู่ต่ำกว่า 🥈' },
        { role: 'ระยะห่างความชอบ (Margin)', sym: 'x̂_uij = s_ui − s_uj', eg: '0.85 − 0.35 = +0.50 > 0', s: 'σ(+0.50) = 0.6225', target: 'โมเดลจัดอันดับถูกต้อง (AUC เพิ่มขึ้น) 🏆', isSummary: true }
      ];

      const tbody = document.createElement('tbody');
      bprRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.role);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.sym, row.eg, row.s, row.target];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 3 || row.isSummary ? 'is-summary-cell' : '';
          if (isHi) {
            if (cIdx === 3) cls += ' cell-focus';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v4-model-bpr-step') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['ตัวแปรใน Step', 'สถานะก่อนก้าว (ผิดลำดับ)', 'เกรเดียนต์ g = 1 − σ(x̂)', 'การขยับของเวกเตอร์', 'สถานะหลังก้าว 1 Step'];
      headers.forEach((h, i) => {
        const th = make('th', i === 4 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const bprStepRows = [
        { varName: 'คะแนนจัดอันดับ', before: 's_ui = 0.40 · s_uj = 0.70', grad: 'Margin x̂ = −0.30 < 0 💥', move: 'g = 1 − 0.4255 = 0.5745 (แรงมาก!)', after: 'ทายผิด! ของลบแซงของบวก ⚠️' },
        { varName: 'เวกเตอร์สินค้าบวก q_i⁺', before: 'อยู่ต่ำกว่าของลบ', grad: 'Δq_i = +η(g·p_u − λq_i)', move: 'ผลัก q_i พุ่งขึ้นหาความชอบฟ้า', after: 's_ui_new = 0.58 📈' },
        { varName: 'เวกเตอร์สินค้าลบ q_j⁻', before: 'ลอยสูงเกินจริง', grad: 'Δq_j = −η(g·p_u + λq_j)', move: 'ดึง q_j ให้ถอยห่างจากฟ้า', after: 's_uj_new = 0.52 📉' },
        { varName: 'ผลลัพธ์หลังก้าว 1 Step', before: 'x̂_new = 0.58 − 0.52 = +0.06 > 0', grad: 'พลิกกลับมาถูกลำดับแล้ว!', move: 'Loss ลดจาก 0.8543 → 0.6974', after: 'AUC ฟื้นคืนชีพขึ้นทันที 🏆', isSummary: true }
      ];

      const tbody = document.createElement('tbody');
      bprStepRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.varName);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.before, row.grad, row.move, row.after];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 3 || row.isSummary ? 'is-summary-cell' : '';
          if (isHi) {
            if (txt.includes('💥') || txt.includes('⚠️')) cls += ' cell-target';
            else if (cIdx === 3 || txt.includes('🏆')) cls += ' cell-focus';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v1-model-ease') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['ขั้นตอนของ EASE', 'สมการคำนวณ', 'มิติเมทริกซ์', 'คำตอบตัวเลขจริง', 'จุดเด่นอันทรงพลัง'];
      headers.forEach((h, i) => {
        const th = make('th', i === 4 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const easeRows = [
        { step: '1 · เมทริกซ์ Gram & Inversion', formula: 'G = Xᵀ X + λ I → P = G⁻¹', dim: 'Item × Item (N × N)', val: 'P = [[4/11, −1/11], [−1/11, 3/11]]', feature: 'คำนวณ Inversion ครั้งเดียวแบบออฟไลน์ ⚡' },
        { step: '2 · คำตอบรูปปิดน้ำหนัก B', formula: 'B_ij = −P_ij / P_jj (เมื่อ i ≠ j)', dim: 'Item × Item (N × N)', val: 'B_12 = 0.25 · B_21 = 0.33', feature: 'ไม่ต้องเทรน SGD ไม่มี Local Minima 🎯' },
        { step: '3 · กฎเหล็ก Zero Diagonal', formula: 'diag(B) = 0 (B_jj = 0)', dim: 'เส้นทแยงมุมหลัก', val: 'B_11 = 0, B_22 = 0', feature: 'ห้ามสินค้าแนะนำตัวเองเด็ดขาด 🛡️' },
        { step: '4 · ทำนายคะแนนออนไลน์', formula: 'Score = x_u · B', dim: '1 × N เวกเตอร์', val: '[1, 0] × B = [0, 0.25] → แนะนำ B', feature: 'เสิร์ฟในระดับไมโครวินาที ชนะ Deep Learning 🏆', isSummary: true }
      ];

      const tbody = document.createElement('tbody');
      easeRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.step);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.formula, row.dim, row.val, row.feature];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 3 || row.isSummary ? 'is-summary-cell' : '';
          if (isHi) {
            if (cIdx === 3) cls += ' cell-focus';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v2-model-sampling') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['กลยุทธ์การสุ่มตัวหลอก', 'วิธีการสุ่ม (Negative Sampling)', 'ความน่าจะเป็น P(j)', 'ข้อดีที่ได้รับ', 'ความเสี่ยงที่ต้องระวัง'];
      headers.forEach((h, i) => {
        const th = make('th', i === 4 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const sampRows = [
        { strat: '1 · สุ่มเท่ากัน (Uniform)', method: 'สุ่มตัวหลอกแบบไม่เลือกหน้า', prob: 'P(C)=1/3, P(D)=1/3, P(E)=1/3', pro: 'คำนวณง่ายและเร็วมาก', con: 'ได้แต่ของหางยาว (โจทย์ง่ายไป) ⚠️' },
        { strat: '2 · ความนิยม (Popularity β=0.5)', method: 'สุ่มของฮิตมาเป็นคู่ซ้อมบ่อยกว่า', prob: 'C: 17%, D: 33%, E: 50%', pro: 'บีบให้โมเดลเอาชนะของกระแสหลัก', con: 'ลดความลำเอียงของฮิตพร่ำเพรื่อ 🎯' },
        { strat: '3 · ตัวหลอกแบบยาก (Hard Negatives)', method: 'หยิบของที่โมเดลกำลังให้คะแนนสูง', prob: 'P(j) ∝ s_uj (ที่ยังไม่แตะ)', pro: 'เกรเดียนต์แรง โมเดลตัดขอบเขตคม', con: 'ผลักดัน Top-K สู่จุดสูงสุด 🏆' },
        { strat: '4 · กับดักตัวหลอกปลอม', method: 'Hard False Negatives', prob: 'ของดีที่ผู้ใช้กำลังจะชอบในอนาคต', pro: 'หากลงโทษจะทำลายระบบเงียบๆ', con: 'ต้องผสม Uniform + Popularity ระวัง 🛡️', isSummary: true }
      ];

      const tbody = document.createElement('tbody');
      sampRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.strat);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.method, row.prob, row.pro, row.con];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 3 || row.isSummary ? 'is-summary-cell' : '';
          if (isHi) {
            if (txt.includes('⚠️')) cls += ' cell-target';
            else if (cIdx === 3 || txt.includes('🏆')) cls += ' cell-focus';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v1-hy-oracle') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['กรณีทดสอบ (Case)', 'อันดับ Model A (Content)', 'อันดับ Model B (CF)', 'Reciprocal Rank A (1/r)', 'Reciprocal Rank B (1/r)', 'Oracle เลือกตัวที่ดีที่สุด'];
      headers.forEach((h, i) => {
        const th = make('th', i === 5 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const oracleRows = [
        { cCase: 'Case 1', rA: 'อันดับ 1 🏆', rB: 'อันดับ 3', rrA: '1.0000', rrB: '0.3333', oracle: '1.0000 (เลือก A) 🎯' },
        { cCase: 'Case 2', rA: 'อันดับ 4', rB: 'อันดับ 1 🏆', rrA: '0.2500', rrB: '1.0000', oracle: '1.0000 (เลือก B) 🎯' },
        { cCase: 'Case 3', rA: 'อันดับ 2', rB: 'อันดับ 2', rrA: '0.5000', rrB: '0.5000', oracle: '0.5000 (เสมอกัน)' },
        { cCase: 'ค่าเฉลี่ย (MRR)', rA: 'MRR(A) = 0.5833', rB: 'MRR(B) = 0.6111', rrA: '—', rrB: '—', oracle: 'Oracle = 0.8333 (+36%) 🚀', isSummary: true }
      ];

      const tbody = document.createElement('tbody');
      oracleRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.cCase);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.rA, row.rB, row.rrA, row.rrB, row.oracle];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 4 || row.isSummary ? 'is-summary-cell' : '';
          if (isHi) {
            if (cIdx === 4 || txt.includes('🎯') || txt.includes('🚀')) cls += ' cell-focus';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v4-hy-scale') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['คอร์สสินค้า', 'คะแนนดิบ A (0-1)', 'คะแนนดิบ B (1-5)', 'บวกดิบ (0.6A + 0.4B)', 'A หลัง Min-Max', 'B หลัง Min-Max', 'รวมหลังสเกล (0.6Ã + 0.4B̃)'];
      headers.forEach((h, i) => {
        const th = make('th', i === 6 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const scaleRows = [
        { course: 'C1 Python', rawA: '0.80', rawB: '4.00★', naive: '2.08', normA: '1.00', normB: '0.75', final: '0.9000 (อันดับ 1 ชนะจริง!) 🏆' },
        { course: 'C2 SQL', rawA: '0.60', rawB: '5.00★', naive: '2.36 (นำหลอกตา!)', normA: '0.67', normB: '1.00', final: '0.8020 (อันดับ 2)' },
        { course: 'C3 UX', rawA: '0.40', rawB: '1.00★', naive: '0.64', normA: '0.33', normB: '0.00', final: '0.1980 (อันดับ 3)' },
        { course: 'C4 New Python', rawA: '0.20', rawB: '— (ไร้ประวัติ)', naive: '—', normA: '0.00', normB: '—', final: '— (รอจัดการใน Evidence) ⚠️', isSummary: true }
      ];

      const tbody = document.createElement('tbody');
      scaleRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.course);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.rawA, row.rawB, row.naive, row.normA, row.normB, row.final];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 5 || row.isSummary ? 'is-summary-cell' : '';
          if (isHi) {
            if (txt.includes('นำหลอกตา')) cls += ' cell-target';
            else if (cIdx === 5 || txt.includes('🏆')) cls += ' cell-focus';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v3-hy-weighted') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['คอร์สสินค้า', 'คะแนน A สเกลแล้ว (s̃_A)', 'คะแนน B สเกลแล้ว (s̃_B)', 'สูตรถ่วงน้ำหนัก (0.6A + 0.4B)', 'คะแนนรวมไฮบริด', 'อันดับแนะนำ'];
      headers.forEach((h, i) => {
        const th = make('th', i === 4 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const weightedRows = [
        { course: 'C1 Python', sA: '1.0000', sB: '0.7500', formula: '0.6(1.00) + 0.4(0.75)', score: '0.60 + 0.30 = 0.9000', rank: 'อันดับ 1 (Top Pick) 🥇' },
        { course: 'C2 SQL', sA: '0.6667', sB: '1.0000', formula: '0.6(0.67) + 0.4(1.00)', score: '0.40 + 0.40 = 0.8000', rank: 'อันดับ 2 🥈' },
        { course: 'C3 UX', sA: '0.3333', sB: '0.0000', formula: '0.6(0.33) + 0.4(0.00)', score: '0.20 + 0.00 = 0.2000', rank: 'อันดับ 3 🥉' },
        { course: 'สรุปกติกา Weighted', sA: 'รวมอิสระสองฝั่ง', sB: 'ผลรวมน้ำหนัก = 1.0', formula: 'w_A=0.6, w_B=0.4', score: 'ปรับน้ำหนักตามนโยบายธุรกิจ', rank: 'รวดเร็วระดับไมโครวินาที ⚡', isSummary: true }
      ];

      const tbody = document.createElement('tbody');
      weightedRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.course);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.sA, row.sB, row.formula, row.score, row.rank];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 4 || row.isSummary ? 'is-summary-cell' : '';
          if (isHi) {
            if (cIdx === 4 || txt.includes('🥇')) cls += ' cell-focus';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v3-hy-evidence') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['คอร์สสินค้า', 'คะแนน A (เนื้อหา)', 'คะแนน B (พฤติกรรม)', 'หน้ากากหลักฐาน (m_A, m_B)', 'ผลรวมแบบ Naive Fallback', 'ผลรวม Evidence-Aware'];
      headers.forEach((h, i) => {
        const th = make('th', i === 5 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const evRows = [
        { course: 'C1 Python', a: '1.00', b: '0.75', mask: '(1, 1) ครบทั้งคู่', naive: '0.6(1.0) + 0.4(0.75) = 0.90', aware: '0.9000 (อันดับ 1) 🏆' },
        { course: 'C2 SQL', a: '0.67', b: '1.00', mask: '(1, 1) ครบทั้งคู่', naive: '0.6(0.67) + 0.4(1.0) = 0.80', aware: '0.8020 (อันดับ 2) 🥈' },
        { course: 'C3 UX', a: '0.33', b: '0.00', mask: '(1, 1) ครบทั้งคู่', naive: '0.6(0.33) + 0.4(0.0) = 0.20', aware: '0.1980 (อันดับ 3) 🥉' },
        { course: 'C4 New Python', a: '0.00', b: '— (มโน 0.75)', mask: '(1, 0) ⚠️ ขาดหลักฐาน B', naive: '0.6(0) + 0.4(0.75) = 0.30 💥', aware: '0.6(0)/0.6 = 0.0000 (อันดับ 4) 🛡️', isSummary: true }
      ];

      const tbody = document.createElement('tbody');
      evRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.course);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.a, row.b, row.mask, row.naive, row.aware];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 4 || row.isSummary ? 'is-summary-cell' : '';
          if (isHi) {
            if (txt.includes('💥')) cls += ' cell-target';
            else if (cIdx === 4 || txt.includes('🏆') || txt.includes('🛡️')) cls += ' cell-focus';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v6-hy-switch') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['คอร์สสินค้า', 'ผู้ชอบในชุดฝึก (n_i)', 'เกณฑ์ Support (n_i ≥ 2)', 'โมเดลที่ประตูกลเลือก', 'คะแนนทำนายสุดท้าย', 'สถานะการทำงาน'];
      headers.forEach((h, i) => {
        const th = make('th', i === 4 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const switchRows = [
        { course: 'C1 Python', n: '4 คน', crit: 'ผ่าน (4 ≥ 2)', chosen: 'Model B (Collaborative)', score: '0.7500 (จาก B)', note: 'รันเฉพาะ B ข้าม A ประหยัดไฟ ⚡' },
        { course: 'C2 SQL', n: '3 คน', crit: 'ผ่าน (3 ≥ 2)', chosen: 'Model B (Collaborative)', score: '1.0000 (จาก B) 🏆', note: 'รันเฉพาะ B ข้าม A ประหยัดไฟ ⚡' },
        { course: 'C3 UX', n: '1 คน', crit: 'ไม่ผ่าน (1 < 2)', chosen: 'สลับไปใช้ Model A (Content)', score: '0.3333 (จาก A)', note: 'ข้อมูล B น้อยเกินไป สลับหา A 🛡️' },
        { course: 'C4 New Python', n: '0 คน', crit: 'ไม่ผ่าน (0 < 2)', chosen: 'สลับไปใช้ Model A (Content)', score: '0.0000 (จาก A)', note: 'กอบกู้คอร์สใหม่ไร้รีวิว 🚀' },
        { course: 'C5 Unready', n: '0 คน', crit: 'ไม่ผ่านทั้งคู่', chosen: 'Fallback Baseline System', score: 'ค่าเฉลี่ยระบบ', note: 'ระบบไม่แครช เสิร์ฟ Baseline 🛡️', isSummary: true }
      ];

      const tbody = document.createElement('tbody');
      switchRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.course);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.n, row.crit, row.chosen, row.score, row.note];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 3 || row.isSummary ? 'is-summary-cell' : '';
          if (isHi) {
            if (txt.includes('🏆') || txt.includes('🚀')) cls += ' cell-focus';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v2-hy-mixed') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['สล็อตหน้าจอ UI', 'โมเดลที่ดึงมา (Source)', 'รหัสคอร์ส', 'ชื่อคอร์สสินค้า', 'ผลตรวจจับตัวซ้ำ (Deduplication)'];
      headers.forEach((h, i) => {
        const th = make('th', i === 4 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const mixedRows = [
        { slot: 'สล็อต #1', src: 'Model A (อันดับ 1)', id: 'C1', name: 'Python เริ่มต้น', dedup: 'บรรจุขึ้นจอทันที 🥇' },
        { slot: 'สล็อต #2', src: 'Model B (อันดับ 1)', id: 'C2', name: 'SQL เริ่มต้น', dedup: 'บรรจุขึ้นจอทันที 🥈' },
        { slot: 'สล็อต #3', src: 'Model A (อันดับ 2)', id: 'C3 (ข้าม C2 ซ้ำ)', name: 'UX เริ่มต้น', dedup: 'C2 ซ้ำกับสล็อต 2! ข้ามไปดึง C3 แทน 🥉' },
        { slot: 'สล็อต #4', src: 'Model B (อันดับ 2)', id: 'C4 (ข้าม C1, C3)', name: 'Python คอร์สใหม่', dedup: 'C1 และ C3 ซ้ำ! ข้ามไปดึง C4 แทน 🎯', isSummary: true }
      ];

      const tbody = document.createElement('tbody');
      mixedRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.slot);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.src, row.id, row.name, row.dedup];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 3 || row.isSummary ? 'is-summary-cell' : '';
          if (isHi) {
            if (txt.includes('🥇') || txt.includes('🎯')) cls += ' cell-focus';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v6-hy-combination') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['สินค้า', 'ฟีเจอร์เนื้อหา x_A', 'ฟีเจอร์พฤติกรรม x_B', 'เวกเตอร์มัดรวม x = [x_A ; x_B]', 'การคำนวณเชิงเส้น β · x', 'คะแนนทำนายสุดท้าย'];
      headers.forEach((h, i) => {
        const th = make('th', i === 5 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const combRows = [
        { course: 'C1 Python', xA: '[1, 0] (Data)', xB: '[1, 0] (เพื่อน 1)', xFull: '[1, 0, 1, 0]', calc: '0.6(1) + 0 + 0.1(1) + 0', score: '0.7000 (อันดับ 2)' },
        { course: 'C2 SQL', xA: '[1, 0] (Data)', xB: '[1, 1] (เพื่อน 2 คน)', xFull: '[1, 0, 1, 1]', calc: '0.6(1) + 0 + 0.1(1) + 0.3(1)', score: '1.0000 (อันดับ 1) 🏆' },
        { course: 'C3 UX', xA: '[0, 1] (Design)', xB: '[0, 1] (เพื่อน 1 คน)', xFull: '[0, 1, 0, 1]', calc: '0 + 0.2(1) + 0 + 0.3(1)', score: '0.5000 (อันดับ 4)' },
        { course: 'C4 New Python', xA: '[1, 0] (Data)', xB: '[0, 0] (ไร้ประวัติ)', xFull: '[1, 0, 0, 0]', calc: '0.6(1) + 0 + 0 + 0', score: '0.6000 (อันดับ 3 กอบกู้สำเร็จ!) 🚀', isSummary: true }
      ];

      const tbody = document.createElement('tbody');
      combRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.course);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.xA, row.xB, row.xFull, row.calc, row.score];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 4 || row.isSummary ? 'is-summary-cell' : '';
          if (isHi) {
            if (txt.includes('🏆') || txt.includes('🚀')) cls += ' cell-focus';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v6-hy-augmentation') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['ขั้นตอนสายพาน', 'บทบาทโมเดล', 'ข้อมูลนำเข้า (Input)', 'สิ่งที่สร้างเสริม (Augmented Output)', 'คุณประโยชน์เชิงระบบ'];
      headers.forEach((h, i) => {
        const th = make('th', i === 4 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const augRows = [
        { stage: 'ด่านที่ 1: ผู้ผลิตฟีเจอร์', role: 'Model A (Content-based)', input: 'ตารางเรตติ้งดิบที่มีช่องว่าง ? มหาศาล', output: 'ทำนายเติมเรตติ้งจำลองลงช่อง ? ทั้งหมด', benefit: 'เติมตารางให้เต็ม 100% ล่วงหน้า 🧩' },
        { stage: 'ด่านที่ 2: โมเดลหลักปลายทาง', role: 'Model B (Collaborative)', input: 'ตารางหนาแน่นที่โมเดล A ช่วยเติมแล้ว', output: 'คำนวณเพื่อนบ้าน kNN / Matrix Factorization', benefit: 'คำนวณความคล้ายเพื่อนบ้านได้มั่นคง ไม่เจอ 0/0 ⚡' },
        { stage: 'การรองรับ Cold Items', role: 'โมเดล A หนุนหลังโมเดล B', input: 'สินค้าใหม่ที่เพิ่งลงขาย 0 รีวิว', output: 'โมเดล A ใช้แท็กสร้างคะแนนจำลองป้อนเข้าตาราง', benefit: 'ปิดจุดบอด Item Cold-Start ทันที 🛡️' },
        { stage: 'สรุป Burke แบบที่ 4', role: 'Two-Stage Sequential Pipeline', input: 'โมเดลแรกป้อนอาหารให้โมเดลหลัง', output: 'โมเดลหลังทำงานบนฟีเจอร์ที่ผ่านการกลั่นกรอง', benefit: 'โครงสร้างมาตรฐานระดับ Enterprise 🏆', isSummary: true }
      ];

      const tbody = document.createElement('tbody');
      augRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.stage);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.role, row.input, row.output, row.benefit];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 3 || row.isSummary ? 'is-summary-cell' : '';
          if (isHi) {
            if (txt.includes('🏆') || txt.includes('🛡️')) cls += ' cell-focus';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v6-hy-cascade') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['ด่านในสายพาน', 'โมเดลที่รับผิดชอบ', 'จำนวนสินค้าที่ต้องดู', 'ความเร็ว / ความละเอียด', 'ผลลัพธ์ที่ผ่านเข้ารอบ'];
      headers.forEach((h, i) => {
        const th = make('th', i === 4 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const casRows = [
        { stage: 'Stage 1 · หยาบเร็ว (Candidate Retrieval)', model: 'Model B (CF หยาบเร็ว / ANN)', count: '1,000,000 ชิ้นในคลัง', speed: 'เร็วระดับ 2–5 ms (หยาบ)', result: 'คัดเหลือ Top-2 Pool = {C2, C1} ⚡' },
        { stage: 'Stage 2 · ละเอียดประณีต (Fine Reranker)', model: 'Model A (Content ละเอียด / Reranker)', count: '2 ชิ้นที่ผ่านด่านแรกมา', speed: 'ส่องลึกด้วยโมเดลซับซ้อน', result: 'คะแนนละเอียด: C1 (0.80) แซง C2 (0.60) 🎯' },
        { stage: 'ผลการจัดอันดับสุดท้าย', model: 'ผลรวม Cascade Funnel', count: 'แนะนำ Top-1 แด่ 👩 ฟ้า', speed: 'รวมเวลาทั้งสิ้น < 20 ms', result: 'แนะนำ C1 Python ชนะเลิศ 🥇' },
        { stage: 'ประสิทธิภาพทางวิศวกรรม', model: 'Coarse-to-Fine Architecture', count: 'ประหยัด GPU ได้กว่า 99%', speed: 'ได้ทั้งความเร็วและความแม่นยำ', result: 'มาตรฐาน Search & RecSys ระดับโลก 🏆', isSummary: true }
      ];

      const tbody = document.createElement('tbody');
      casRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.stage);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.model, row.count, row.speed, row.result];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 3 || row.isSummary ? 'is-summary-cell' : '';
          if (isHi) {
            if (txt.includes('🥇') || txt.includes('🏆')) cls += ' cell-focus';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v6-hy-meta') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['ขั้นตอน', 'สิ่งที่กระทำ', 'ข้อมูลที่ส่งมอบ', 'การแปลงรูปโมเดล', 'ข้อได้เปรียบเหนือ Augmentation'];
      headers.forEach((h, i) => {
        const th = make('th', i === 4 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const metaRows = [
        { step: '1 · เรียนรู้โมเดลแรก (Model A)', action: 'รันโมเดลเนื้อหากับประวัติของ 👩 ฟ้า', data: 'สกัดแกนรสนิยมลึกซึ้ง', transform: 'ได้ User Profile Model ตัวแทนของฟ้า', pro: 'สรุปตัวตนแทนที่จะจำทีละคลิก 🧠' },
        { step: '2 · ส่งต่อโมเดลทั้งก้อน (Handover)', action: 'ส่ง Model Object ทั้งตัว', data: 'พารามิเตอร์โมเดลตัวตน', transform: 'ส่งมอบให้ Model B (Collaborative)', pro: 'ยกระดับการเชื่อมต่อสู่ระดับ Meta 🚀' },
        { step: '3 · หาเพื่อนบ้านบนโมเดล (Model B)', action: 'Model B จับคู่เพื่อนจาก Profile Model', data: 'หาระยะห่างระหว่าง Profile', transform: 'ค้นพบคนที่มีคลื่นความถี่ตรงกัน', pro: 'จับคู่เจอแม้ไม่เคยซื้อของชิ้นเดียวกันเป๊ะๆ 🤝' },
        { step: '4 · ทำนายและแนะนำผลลัพธ์', action: 'ผสานพลังความรู้เนื้อหากับพฤติกรรมกลุ่ม', data: 'คำแนะนำข้ามสายแม่นยำสูง', transform: 'ทนทานต่อสัญญาณรบกวน', pro: 'ครบทั้ง 7 รูปแบบ Hybrid ของ Burke 🏆', isSummary: true }
      ];

      const tbody = document.createElement('tbody');
      metaRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.step);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.action, row.data, row.transform, row.pro];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 3 || row.isSummary ? 'is-summary-cell' : '';
          if (isHi) {
            if (txt.includes('🏆') || txt.includes('🚀')) cls += ' cell-focus';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v3-hy-lightfm') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['เอนทิตีในระบบ', 'เวกเตอร์ ID ประจำตัว', 'เวกเตอร์ Tags คุณลักษณะ', 'เวกเตอร์รวมร่าง (Representation)', 'ผลคูณ Dot Product ทำนายคะแนน'];
      headers.forEach((h, i) => {
        const th = make('th', i === 4 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const lfmRows = [
        { entity: '👩 ฟ้า (ผู้ใช้ u)', id: '[0.20, 0.10]', tags: '[0.30, 0.10] (Data)', rep: '[0.2+0.3, 0.1+0.1] = [0.50, 0.20]', dot: 'ตัวแทนรสนิยมของฟ้าพร้อมเสิร์ฟ 🎯' },
        { entity: 'C1 Python (สินค้าเก่า Warm)', id: '[0.10, 0.10]', tags: '[0.40, 0.20] (โค้ด)', rep: '[0.1+0.4, 0.1+0.2] = [0.50, 0.30]', dot: 'u · i = 0.5(0.5) + 0.2(0.3) = 0.3100 🥇' },
        { entity: 'C4 New Python (สินค้าใหม่ Cold)', id: '[0.00, 0.00] (ไร้ ID!)', tags: '[0.40, 0.20] (โค้ด)', rep: '[0+0.4, 0+0.2] = [0.40, 0.20]', dot: 'u · i = 0.5(0.4) + 0.2(0.2) = 0.2400 🚀' },
        { entity: 'สรุปอัจฉริยะ LightFM', id: 'สินค้าเก่าใช้ทั้ง ID + Tags', tags: 'สินค้าใหม่ใช้ Tags เวกเตอร์', rep: 'สมการเดียวรองรับสองโลก', dot: 'แก้ Cold-Start สมบูรณ์แบบ 🏆', isSummary: true }
      ];

      const tbody = document.createElement('tbody');
      lfmRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.entity);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.id, row.tags, row.rep, row.dot];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 3 || row.isSummary ? 'is-summary-cell' : '';
          if (isHi) {
            if (txt.includes('🥇') || txt.includes('🏆') || txt.includes('🚀')) cls += ' cell-focus';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v1-hy-graph') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['เส้นทางบนกราฟ (Path)', 'โหนดต้นทาง', 'โหนดปลายทาง', 'น้ำหนักเส้นเชื่อม 1/√(deg_u · deg_i)', 'การส่งสัญญาณสะสม (Propagation)'];
      headers.forEach((h, i) => {
        const th = make('th', i === 4 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const graphRows = [
        { path: '1-Hop: g1 → C1', src: 'ผู้ใช้ g1 (deg=1)', dst: 'คอร์ส C1 (deg=2)', weight: '1 / √(1 × 2) = 1/√2 ≈ 0.7071', prop: 'g1 เคยเรียน C1 (เชื่อมต่อโดยตรง) ✅' },
        { path: '1-Hop: g2 → C1', src: 'ผู้ใช้ g2 (deg=2)', dst: 'คอร์ส C1 (deg=2)', weight: '1 / √(2 × 2) = 1/2 = 0.5000', prop: 'g2 เคยเรียน C1 (พบเพื่อนร่วมรุ่น) ✅' },
        { path: '1-Hop: g2 → C3', src: 'ผู้ใช้ g2 (deg=2)', dst: 'คอร์ส C3 (deg=1)', weight: '1 / √(2 × 1) = 1/√2 ≈ 0.7071', prop: 'เพื่อน g2 เคยเรียน C3 ด้วย! 💡' },
        { path: '2-Hop: g1 → C1 → g2 → C3', src: 'ผู้ใช้ g1', dst: 'คอร์สเป้าหมาย C3', weight: '(1/√2) × 0.50 × (1/√2)', prop: 'ส่งสัญญาณสะสม = 0.2500 แนะนำ C3 สำเร็จ 🏆', isSummary: true }
      ];

      const tbody = document.createElement('tbody');
      graphRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.path);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.src, row.dst, row.weight, row.prop];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 3 || row.isSummary ? 'is-summary-cell' : '';
          if (isHi) {
            if (txt.includes('🏆')) cls += ' cell-focus';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v6-hy-tower') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['ด่านสถาปัตยกรรม', 'หอคอยที่รับผิดชอบ', 'ข้อมูลที่ประมวลผล', 'สภาพแวดล้อมการรัน', 'งบประมาณเวลา (Latency)'];
      headers.forEach((h, i) => {
        const th = make('th', i === 4 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const towerRows = [
        { stage: '1 · แคชเวกเตอร์สินค้า', tower: 'Item Tower (DNN ลึก)', data: 'C1=[0.8,0.6], C2=[0,1], C3=[1,0], C4=[0.5,0.5]', env: 'ออฟไลน์ (Offline Batch)', time: 'คำนวณล่วงหน้า 100% เก็บลง Vector DB 📦' },
        { stage: '2 · ประมวลผลผู้ใช้สด', tower: 'User Tower (DNN เบา)', data: 'สกัดบริบทสดของ 👩 ฟ้า (คลิก 5 นาทีล่าสุด)', env: 'ออนไลน์ (Online Real-time)', time: 'ได้เวกเตอร์ u = [0.60, 0.80] ใน ~5 ms ⚡' },
        { stage: '3 · ค้นหาความเร็วสูง', tower: 'Vector DB / ScaNN', data: 'Dot Product: u · v_i สำหรับทุกสินค้า', env: 'ออนไลน์ (ANN Search)', time: 'C1=0.96 (ชนะเลิศ!), C2=0.80 ใน ~2 ms 🎯' },
        { stage: '4 · งบประมาณเวลารวม', tower: 'Two-Tower Architecture', data: 'Decoupled Latency แยกสองฝั่งอิสระ', env: 'Production Serving SLA', time: 'รวม < 20 ms (ต่ำกว่างบ 50 ms สบายๆ) 🏆', isSummary: true }
      ];

      const tbody = document.createElement('tbody');
      towerRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.stage);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.tower, row.data, row.env, row.time];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 3 || row.isSummary ? 'is-summary-cell' : '';
          if (isHi) {
            if (txt.includes('🎯') || txt.includes('🏆')) cls += ' cell-focus';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v4-hy-logq') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['สินค้าในมินิแบตช์', 'คะแนนดิบ (Logits l)', 'ความถี่การสุ่มเจอ (Q)', 'Logits ชดเชย l′ = l − ln(Q)', 'Softmax ก่อนแก้ logQ', 'Softmax หลังแก้ logQ'];
      headers.forEach((h, i) => {
        const th = make('th', i === 5 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const logqRows = [
        { item: 'C1 (ของฮิตมหาชน)', raw: '2.00', q: 'Q = 0.50 (โผล่ 50%)', corr: '2.0 − ln(0.50) = 2.6931', before: '0.6652 (ได้เปรียบเกินจริง 66.5%)', after: '0.4996 (สะท้อนความชอบแท้จริง 50%) 🎯' },
        { item: 'C2 (ของเฉพาะกลุ่ม)', raw: '1.00', q: 'Q = 0.25 (โผล่ 25%)', corr: '1.0 − ln(0.25) = 2.3863', before: '0.2447 (ถูกกดคะแนน)', after: '0.3690 (ได้รับการชดเชยความเป็นธรรม!) ⚖️' },
        { item: 'C3 (ของเฉพาะกลุ่ม)', raw: '0.00', q: 'Q = 0.25 (โผล่ 25%)', corr: '0.0 − ln(0.25) = 1.3863', before: '0.0900 (จมหาย)', after: '0.1314 (ได้รับการชดเชยความเป็นธรรม!) ⚖️' },
        { item: 'กฎเหล็กตอนเสิร์ฟ (Serving)', raw: 'ตอนเทรนหัก ln(Q)', q: 'เพื่อลบ Sampling Bias', corr: 'แต่ตอนเสิร์ฟห้ามหัก ln(Q) เด็ดขาด!', before: 'ใช้ Dot Product ดิบๆ เสมอ 🛡️', after: 'สูตรลับความแม่นยำของ YouTube Two-Tower 🏆', isSummary: true }
      ];

      const tbody = document.createElement('tbody');
      logqRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.item);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.raw, row.q, row.corr, row.before, row.after];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 4 || row.isSummary ? 'is-summary-cell' : '';
          if (isHi) {
            if (txt.includes('🎯') || txt.includes('🏆') || txt.includes('⚖️')) cls += ' cell-focus';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v6-llm-7step') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['ขั้นตอนสายพาน (7 Steps)', 'โมดูลรับผิดชอบ', 'ข้อมูลนำเข้า / กลไก', 'ผลลัพธ์ที่ได้', 'การควบคุมความปลอดภัย / SLA'];
      headers.forEach((h, i) => {
        const th = make('th', i === 4 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const funnelRows = [
        { step: 'ขั้นที่ 1–2: Retrieval', mod: 'ระบบเร็ว (Two-Tower / EASE)', input: 'คลังภาพยนตร์ 1,000,000 ชิ้น', output: 'ดึง 4 แคนดิเดต [i01, i03, i07, i12]', sla: '< 10 ms · ขอบเขตคลังจริง 100% 🛡️' },
        { step: 'ขั้นที่ 3–4: Context Rerank', mod: 'LLM (GPT-4 / Gemini)', input: '4 แคนดิเดต + บริบทความต้องการฟ้า', output: 'ชั่งน้ำหนัก Intent ดัน i12 ขึ้น #1', sla: '~200 ms · ควบคุม Token ไม่ให้บวม ⏱️' },
        { step: 'ขั้นที่ 5–6: Guardrails & Fallback', mod: 'ด่านตรวจระบบ (Verifier & Catalog)', input: 'ผลลัพธ์ LLM + สต็อก + ประวัติที่ดูแล้ว', output: 'กรองของซ้ำ · ดักจับภาพหลอน', sla: 'Timeout > 300ms สลับใช้ CF ทันที ⚡' },
        { step: 'ขั้นที่ 7: UI Serving & Grounding', mod: 'หน้าจอแสดงผล (App / Web UI)', input: 'Top-2 Movies + ข้อความอิงความจริง', output: 'แสดง [i12, i01] สู่สายตาฟ้า', sla: 'ปลอดภัย 100% ตอบสนองเร็ว < 250 ms 🏆', isSummary: true }
      ];

      const tbody = document.createElement('tbody');
      funnelRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.step);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.mod, row.input, row.output, row.sla];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 3 || row.isSummary ? 'is-summary-cell' : '';
          if (isHi) {
            if (txt.includes('🏆') || txt.includes('🛡️') || txt.includes('⚡')) cls += ' cell-focus';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v2-llm-rerank') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['รหัสสินค้า', 'ชื่อเรื่อง & หมวดหมู่', 'อันดับเดิม (CF)', 'การจับคู่บริบทฟ้า', 'อันดับใหม่ (LLM Rerank)', 'การเปลี่ยนแปลง'];
      headers.forEach((h, i) => {
        const th = make('th', i === 4 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const rerankRows = [
        { id: '🤖 i12', name: 'Ex Machina (ไซไฟ / AI / ปรัชญา)', orig: '#4 (0.65)', match: 'ตรงเป๊ะ: ไซไฟ AI & ปรัชญา (ไม่ดราม่า) ✨', newRank: '#1 (ชนะเลิศ 🥇)', delta: '+3 อันดับ 🚀' },
        { id: '🎬 i01', name: 'Interstellar (ไซไฟ / อวกาศ / ปรัชญา)', orig: '#2 (0.85)', match: 'ตรงเป๊ะ: ไซไฟอวกาศ ปรัชญาเข้มข้น', newRank: '#2 (รองชนะเลิศ 🥈)', delta: 'คงที่ =' },
        { id: '🎭 i03', name: 'Inception (ดราม่า / ไซไฟจิตวิทยา)', orig: '#1 (0.90)', match: 'ขัดแย้ง: ฟ้าขอไม่เอาดราม่า โดนหักคะแนน ❌', newRank: '#3 (ตกอันดับ 🥉)', delta: '-2 อันดับ 📉' },
        { id: '🧭 i07', name: 'The Martian (ผจญภัย / เอาชีวิตรอด)', orig: '#3 (0.70)', match: 'ไม่ตรง: ไม่มีประเด็น AI หรือปรัชญาลึกซึ้ง', newRank: '#4 (ท้ายตาราง)', delta: '-1 อันดับ', isSummary: true }
      ];

      const tbody = document.createElement('tbody');
      rerankRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.id);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.name, row.orig, row.match, row.newRank, row.delta];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 3 || cIdx === 4 ? 'is-summary-cell' : '';
          if (isHi) {
            if (txt.includes('🥇') || txt.includes('🚀')) cls += ' cell-focus';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v8-llm-semanticid') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['เส้นทางต้นไม้ Trie', 'ระดับโทเคน (Layer)', 'ความหมายเชิงภาษา', 'สถานะการคัดกรอง (Constraint)', 'สินค้าปลายทาง'];
      headers.forEach((h, i) => {
        const th = make('th', i === 3 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const trieRows = [
        { path: 'Root → <SciFi>', layer: 'ชั้น 1: Genre', meaning: 'หมวดภาพยนตร์ไซไฟ', status: 'กิ่งเปิดปกติ (Valid Path ✓)', target: 'คลังไซไฟทั้งหมด' },
        { path: '↳ <SciFi> → <Space>', layer: 'ชั้น 2: Subtheme', meaning: 'ประเภทย่อยสำรวจอวกาศ', status: 'กิ่งเปิดปกติ (Valid Path ✓)', target: 'i01, i07, i12' },
        { path: '  ↳ <Space> → <Time>', layer: 'ชั้น 3: Leaf (i01)', meaning: 'มิติเวลา / หลุมดำ', status: '❌ ตัดทิ้ง! (ฟ้าดูแล้ว: Masked −∞)', target: '🎬 i01 (Interstellar)' },
        { path: '  ↳ <Space> → <Survival>', layer: 'ชั้น 3: Leaf (i07)', meaning: 'เอาชีวิตรอดบนดาวอังคาร', status: 'กิ่งสำรองเปิดอยู่ (Valid Leaf)', target: '🧭 i07 (The Martian)' },
        { path: '  ↳ <Space> → <AI>', layer: 'ชั้น 3: Leaf (i12)', meaning: 'ปัญญาประดิษฐ์และหุ่นยนต์', status: '✨ ชนะเลิศ! (Selected Path 🎯)', target: '🤖 i12 (Ex Machina)', isSummary: true }
      ];

      const tbody = document.createElement('tbody');
      trieRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.path);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.layer, row.meaning, row.status, row.target];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 2 || row.isSummary ? 'is-summary-cell' : '';
          if (isHi) {
            if (txt.includes('🎯') || txt.includes('✨') || txt.includes('✓')) cls += ' cell-focus';
            else if (txt.includes('❌') || txt.includes('−∞')) cls += ' cell-target';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v8-llm-grounded') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['ประเด็นที่อ้าง (Claim Point)', 'ข้อความจาก LLM', 'ความจริงในฐานข้อมูล (DB Truth)', 'ผลการตรวจสอบ', 'การจัดการใน Production'];
      headers.forEach((h, i) => {
        const th = make('th', i === 3 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const groundRows = [
        { claim: '1. ผู้กำกับภาพยนตร์', text: '"กำกับโดย คริสโตเฟอร์ โนแลน"', db: 'Director = "Christopher Nolan"', result: '✓ ตรงความจริง 100%', action: 'อนุมัติข้อความ 🟢' },
        { claim: '2. ดารานำแสดง', text: '"นำแสดงโดย ลีโอนาร์โด ดิแคพรีโอ"', db: 'Lead Cast = "Leonardo DiCaprio"', result: '✓ ตรงความจริง 100%', action: 'อนุมัติข้อความ 🟢' },
        { claim: '3. รางวัลเกียรติยศ', text: '"คว้ารางวัล Best Picture ออสการ์"', db: 'Best Picture = False (ได้เฉพาะสาขาเทคนิค)', result: '✕ ภาพหลอน (Hallucination!) 🚨', action: 'ตัดทิ้งอัตโนมัติ ✂️ 🔴' },
        { claim: '4. ลิขสิทธิ์สตรีมมิ่ง', text: '"รับชมได้ทันทีบนแอปของเรา"', db: 'Catalog Status = Active (ไทย)', result: '✓ ตรงความจริง 100%', action: 'อนุมัติข้อความ 🟢', isSummary: true }
      ];

      const tbody = document.createElement('tbody');
      groundRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.claim);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.text, row.db, row.result, row.action];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 2 || cIdx === 3 ? 'is-summary-cell' : '';
          if (isHi) {
            if (txt.includes('🟢') || txt.includes('✓')) cls += ' cell-focus';
            else if (txt.includes('🔴') || txt.includes('🚨') || txt.includes('✕')) cls += ' cell-target';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v6-resp-lifecycle') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['ขั้นตอนวงจรปิด (4 Stages)', 'คำถามนำทาง (Core Question)', 'กลไกการทำงานเชิงเทคนิค', 'ตัวชี้วัด / ผลลัพธ์ที่ได้', 'ผลลัพธ์ต่อระบบ'];
      headers.forEach((h, i) => {
        const th = make('th', i === 4 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const lifeRows = [
        { step: 'ขั้นที่ 1: นิยาม (Define)', q: 'ใครได้รับผลกระทบจากระบบ?', mech: 'ระบุกลุ่มเสียเปรียบ: ผู้ผลิตรายย่อย/ศิลปินอิสระถูกลืม', metric: 'พบ Zero Exposure (0% การมองเห็น)', impact: 'กำหนดเป้าหมายความเป็นธรรม 🎯' },
        { step: 'ขั้นที่ 2: วัด (Measure)', q: 'วัดความเสียหายเป็นตัวเลขอย่างไร?', mech: 'คำนวณ Gini Index ร่วมกับ Item Coverage และ MRR', metric: 'Gini = 0.82 (เหลื่อมล้ำสูง) · Cov = 42%', impact: 'ตั้งเกณฑ์ปรับปรุง Gini < 0.50 📊' },
        { step: 'ขั้นที่ 3: แก้ (Mitigate)', q: 'แทรกแซงทางเทคนิคอย่างไร?', mech: 'สุ่มสำรวจ Exploration 10% + Fair Reranking โควตา Top-3', metric: 'ยอมสละ nDCG เล็กน้อย (-0.03) เพื่อความยั่งยืน', impact: 'เปิดพื้นที่ให้ผู้ผลิตรายย่อย 🛡️' },
        { step: 'ขั้นที่ 4: ตรวจสอบ (Audit)', q: 'รักษาสมดุลระยะยาวอย่างไร?', mech: 'Continuous Monitoring + บันทึก Audit Trail ทุกไตรมาส', metric: 'Gini ลดเหลือ 0.44 📉 · Cov พุ่งแตะ 88% 🚀', impact: 'สองฝั่งตลาดเติบโตยั่งยืน 🏆', isSummary: true }
      ];

      const tbody = document.createElement('tbody');
      lifeRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.step);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.q, row.mech, row.metric, row.impact];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 3 || row.isSummary ? 'is-summary-cell' : '';
          if (isHi) {
            if (txt.includes('🏆') || txt.includes('🚀') || txt.includes('🎯')) cls += ' cell-focus';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v7-resp-feedback') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['รอบวงจรป้อนกลับ (Cycle)', 'สัดส่วนหน้าจอค่ายใหญ่', 'สัดส่วนหน้าจอค่ายอิสระ', 'พฤติกรรมการคลิกใน Log', 'สถานะสุขภาพของแพลตฟอร์ม'];
      headers.forEach((h, i) => {
        const th = make('th', i === 4 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const feedRows = [
        { cycle: 'รอบที่ 1: เริ่มต้นระบบ', big: '80% (เน้นหนังกระแสหลัก)', small: '5% (ของดีส่วนหาง)', click: 'ผู้ใช้คลิกของดัง 80% ตามสายตาที่เห็น', health: 'เริ่มก่อตัวความเหลื่อมล้ำ ⚠️' },
        { cycle: 'รอบที่ 2: โมเดลเรียนรู้ Log', big: '90% (คิดว่าทุกคนชอบแต่ของดัง)', small: '2% (แทบมองไม่เห็น)', click: 'ผู้ใช้คลิกของดัง 92% เพราะไม่มีตัวเลือก', health: 'อคติความนิยมฝังลึกในโมเดล 📈' },
        { cycle: 'รอบที่ 3: ผูกขาดเต็มขั้น', big: '98% (ผูกขาดจอเกือบ 100%)', small: '0% (Zero Exposure ถูกฝังลืม)', click: 'คลิกแต่ของเดิมซ้ำๆ สต็อก 90% จมสูญเปล่า', health: 'Matthew Effect ขั้นรุนแรง 🚨' },
        { cycle: 'รอบที่ 4: ผู้ใช้เบื่อหนี (Crisis)', big: '99% (ของเดิมวนซ้ำ)', small: '0% (ตัดขาดสิ้นเชิง)', click: 'ยอดคลิกดิ่งลง ชุมชนบ่นไม่มีอะไรใหม่', health: 'Repetitive Fatigue Churn +40% 💥 (ต้องใช้ Exploration แก้!)', isSummary: true }
      ];

      const tbody = document.createElement('tbody');
      feedRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.cycle);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.big, row.small, row.click, row.health];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 3 || row.isSummary ? 'is-summary-cell' : '';
          if (isHi) {
            if (txt.includes('💥') || txt.includes('🚨')) cls += ' cell-target';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v2-resp-rerank') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['สล็อตหน้าจอ UI', 'รหัสสินค้า & ค่ายผู้ผลิต', 'คะแนนความชอบดิบ', 'โบนัสความเป็นธรรม (Fairness)', 'คะแนนรวมหลังจัดอันดับ', 'สถานะการแสดงผล'];
      headers.forEach((h, i) => {
        const th = make('th', i === 5 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const rerankRows = [
        { slot: 'สล็อต #1', item: '🎬 แบรนด์ใหญ่ A (ฟอร์มยักษ์)', raw: '0.9500', bonus: '0.0000 (ไม่มีโบนัส)', finalScore: '0.9500', status: 'บรรจุขึ้นสล็อต #1 🥇' },
        { slot: 'สล็อต #2', item: '🍿 แบรนด์ใหญ่ B (ซีรีส์ฮิต)', raw: '0.9200', bonus: '0.0000 (ไม่มีโบนัส)', finalScore: '0.9200', status: 'บรรจุขึ้นสล็อต #2 🥈' },
        { slot: 'สล็อต #3 (เดิม C)', item: '🎥 แบรนด์ใหญ่ C (ซ้ำซ้อนกับ A)', raw: '0.8900', bonus: '0.0000 (ซ้ำแนวเดิม)', finalScore: '0.8900', status: '❌ ตกสล็อต! หลุดไปอันดับ #4' },
        { slot: 'สล็อต #3 (ใหม่ E)', item: '🎸 ค่ายอิสระ E (Indie 5★ คุณภาพสูง)', raw: '0.8700', bonus: '+0.0500 (โควตารายย่อย)', finalScore: '0.9200 📈', status: '✨ เสียบแทนที่ C ในสล็อต #3 🥉 (Fair Quota ✓)', isSummary: true }
      ];

      const tbody = document.createElement('tbody');
      rerankRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.slot);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.item, row.raw, row.bonus, row.finalScore, row.status];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 4 || cIdx === 5 ? 'is-summary-cell' : '';
          if (isHi) {
            if (txt.includes('🥇') || txt.includes('✨') || txt.includes('✓')) cls += ' cell-focus';
            else if (txt.includes('❌')) cls += ' cell-target';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v1-resp-shilling') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['บัญชีผู้ใช้ \\ สินค้า', '🐍 C1 (ของฮิต)', '📊 C2 (ทั่วไป)', '🎨 C3 (คู่แข่งเป้าหมาย)', '📈 C4 (ทั่วไป)', '🚀 C5 (เป้าหมายปั่น)', 'ผลตรวจสอบ (Audit Status)'];
      headers.forEach((h, i) => {
        const th = make('th', i === 6 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const shillRows = [
        { user: '👩 ฟ้า (คนจริง)', c1: '5★', c2: '3★', c3: '2★', c4: '4★', c5: '?', audit: '✓ ปกติ (กระจายตัวธรรมชาติ)' },
        { user: '🧑 พลอย (คนจริง)', c1: '4★', c2: '4★', c3: '3★', c4: '1★', c5: '?', audit: '✓ ปกติ (กระจายตัวธรรมชาติ)' },
        { user: '🤖 บอท 1 (Syndicate)', c1: '5★ (เกาะกระแส)', c2: '5★ (เกาะกระแส)', c3: '1★ (Nuke 💥)', c4: '?', c5: '5★ (Push 🚨)', audit: '✕ กองทัพปั่นยอด! (Sim = 0.9999)' },
        { user: '🤖 บอท 2 (Syndicate)', c1: '5★ (เกาะกระแส)', c2: '5★ (เกาะกระแส)', c3: '1★ (Nuke 💥)', c4: '?', c5: '5★ (Push 🚨)', audit: '✕ กองทัพปั่นยอด! (Sim = 0.9999)', isSummary: true }
      ];

      const tbody = document.createElement('tbody');
      shillRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.user);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.c1, row.c2, row.c3, row.c4, row.c5, row.audit];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 5 || row.isSummary ? 'is-summary-cell' : '';
          if (isHi) {
            if (txt.includes('Push') || txt.includes('Nuke') || txt.includes('✕')) cls += ' cell-target';
            else if (txt.includes('✓')) cls += ' cell-focus';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v1-capstone-decision') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['สถานการณ์โจทย์ข้อสอบ', 'ลักษณะข้อมูลในมือ', 'โมเดลที่ถูกต้องตามตำรา', 'ฟังก์ชันเป้าหมาย (Loss Function)', 'ตัวชี้วัดที่ห้ามตอบผิด!'];
      headers.forEach((h, i) => {
        const th = make('th', i === 4 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const decRows = [
        { scen: '1. Explicit Feedback', data: 'คะแนนดาว 1–5★ (เห็นชัดเจน)', model: 'SVD / FunkMF / BiasMF / Item-kNN', loss: 'MSE / RMSE: (r_ui − r̂_ui)²', metric: 'RMSE, MAE (วัดค่าคลาดเคลื่อนดาว) 🎯' },
        { scen: '2. Implicit Feedback', data: 'คลิก/ดู 0/1 (ไม่มีสัญญาณ 0★)', model: 'BPR-MF / iALS / WRMF / EASE', loss: 'BPR Loss: −ln σ(x̂_uij) หรือ Weighted Sq', metric: 'Recall@K, nDCG@K, MRR (ห้ามตอบ RMSE!) 🏆' },
        { scen: '3. Cold-Start New Items', data: 'ข้อความ, แท็ก, สื่อมัลติโมดัล (0 คลิก)', model: 'Content-based (BM25) / Two-Tower Item / LightFM', loss: 'Cosine Sim / Triplet Loss / Contrastive', metric: 'Item Coverage > 80%, Catalog Gini 🛡️' },
        { scen: '4. Sequential / Session', data: 'ลำดับคลิก [i_1 → i_2 → i_3] ล่าสุด', model: 'SASRec (Self-Attention) / GRU4Rec / LLM', loss: 'Cross-Entropy ทายชิ้นถัดไป (Next-Item)', metric: 'Hit Rate@K, nDCG@K, P95 Latency < 50ms ⏱️', isSummary: true }
      ];

      const tbody = document.createElement('tbody');
      decRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.scen);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.data, row.model, row.loss, row.metric];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 3 || row.isSummary ? 'is-summary-cell' : '';
          if (isHi) {
            if (txt.includes('🏆') || txt.includes('🎯') || txt.includes('🛡️')) cls += ' cell-focus';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (b && b.type === 'v6-capstone-pipeline') {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid rs-wb-vectable');
      table.setAttribute('aria-label', stage.value);
      const thead = document.createElement('thead');
      const htr = document.createElement('tr');
      const headers = ['ขั้นตอนสายพาน (3 Stages)', 'สเกลจำนวนสินค้า', 'อัลกอริทึม & สถาปัตยกรรม', 'งบเวลาตอบสนอง (Latency)', 'ตัวชี้วัดประจำด่าน'];
      headers.forEach((h, i) => {
        const th = make('th', i === 4 ? 'is-active-header' : '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);

      const pipeRows = [
        { stage: 'จุดเริ่มต้น: คลังสินค้าจริง', count: '1,000,000 ชิ้น', tech: 'Database / Catalog Storage', lat: 'Total Budget < 50 ms', metric: 'ความท้าทายระดับ Enterprise Scale 📚' },
        { stage: 'ด่าน 1: Candidate Retrieval', count: '1,000,000 → 500 ชิ้น', tech: 'Two-Tower + ScaNN / HNSW (ANN) + i2i', lat: '~8 มิลลิวินาที ⚡', metric: 'Recall@500 (กวาดของดี อย่าเพิ่งสนลำดับ!) 🎯' },
        { stage: 'ด่าน 2: Scoring & Ranking', count: '500 → 20 ชิ้น', tech: 'Deep Ranking Network / GBDT / Cross-Encoder', lat: '~28 มิลลิวินาที ⏱️', metric: 'nDCG@20, MRR (เรียงลำดับแม่นยำสูง) 📊' },
        { stage: 'ด่าน 3: Reranking & Fairness', count: '20 → Top-5 บนหน้าจอ', tech: 'MMR (Diversity) + Fair Quota + Rule Filters', lat: '~5 ms (เวลารวม 41 ms ✓)', metric: 'ILD Diversity, Provider Gini, User Trust 🏆', isSummary: true }
      ];

      const tbody = document.createElement('tbody');
      pipeRows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        const isHi = b.activeRow === rIdx;
        const rth = make('th', isHi ? 'is-active-header' : '', row.stage);
        rth.scope = 'row';
        tr.append(rth);

        const cells = [row.count, row.tech, row.lat, row.metric];
        cells.forEach((txt, cIdx) => {
          let cls = cIdx === 3 || row.isSummary ? 'is-summary-cell' : '';
          if (isHi) {
            if (txt.includes('🏆') || txt.includes('🎯') || txt.includes('✓')) cls += ' cell-focus';
            else cls += ' cell-scan';
          }
          tr.append(make('td', cls.trim(), txt));
        });
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
      return;
    }

    if (stage.matrix) {
      const spec = stage.matrix, wrap = make('div', 'rs-wb-grid-wrap'), table = make('table', 'rs-wb-grid');
      const header = make('thead'), row = make('tr');
      spec.headers.forEach((label, i) => {
        const th = make('th', spec.highlight.some(([, c]) => c === i - 1) ? 'is-active-header' : '', label);
        th.scope = 'col';
        row.append(th);
      });
      header.append(row);
      table.append(header);
      const body = make('tbody');
      spec.rows.forEach((dataRow, r) => {
        const tr = make('tr'), th = make('th', spec.highlight.some(([rr]) => rr === r) ? 'is-active-header' : '', dataRow.label);
        th.scope = 'row';
        tr.append(th);
        dataRow.values.forEach((value, c) => {
          const cell = make('td', value === '?' ? 'is-missing' : '', value);
          if (spec.highlight.some(([rr, cc]) => rr === r && cc === c)) cell.classList.add('cell-scan');
          if (spec.target && spec.target[0] === r && spec.target[1] === c) cell.classList.add('cell-target');
          tr.append(cell);
        });
        body.append(tr);
      });
      table.append(body);
      wrap.append(table);
      canvas.append(wrap);
    }
    if (stage.grid) {
      const grid = make('div', 'rs-demo-grid');
      grid.style.gridTemplateColumns = `repeat(${stage.grid.columns},minmax(0,1fr))`;
      grid.setAttribute('role', 'img');
      grid.setAttribute('aria-label', stage.grid.label);
      stage.grid.cells.forEach((value, i) => grid.append(make('span', stage.grid.highlight.includes(i) ? 'rs-highlight' : '', String(value))));
      canvas.append(grid);
    }
    if (!stage.matrix && !stage.grid && stages.length > 1) {
      const wrap = make('div', 'rs-wb-grid-wrap');
      const table = make('table', 'rs-wb-grid');
      table.setAttribute('aria-label', 'ตารางภาพรวมทุกขั้นตอน');
      const thead = make('thead'), htr = make('tr');
      ['ขั้นตอน', 'ข้อมูลบนกระดาน', 'ผลลัพธ์'].forEach(h => {
        const th = make('th', '', h);
        th.scope = 'col';
        htr.append(th);
      });
      thead.append(htr);
      table.append(thead);
      const tbody = document.createElement('tbody');
      stages.forEach((st, idx) => {
        const tr = make('tr');
        const rth = make('th', idx === step ? 'is-active-header' : '', st.title);
        rth.scope = 'row';
        const tokTd = make('td', idx === step ? 'cell-scan' : '');
        const tokWrap = make('div', 'rs-demo-tokens');
        (st.tokens || []).forEach((tok, tIdx) => {
          const isHi = idx === step && (st.active || []).includes(tIdx);
          tokWrap.append(make('span', isHi ? 'rs-highlight' : '', tok));
        });
        tokTd.append(tokWrap);
        const valTd = make('td', idx === step ? 'cell-focus' : '', st.value);
        tr.append(rth, tokTd, valTd);
        tbody.append(tr);
      });
      table.append(tbody);
      wrap.append(table);
      canvas.append(wrap);
    } else if (stage.tokens && stage.tokens.length) {
      const tokens = make('div', 'rs-demo-tokens');
      stage.tokens.forEach((token, i) => tokens.append(make('span', (stage.active || []).includes(i) ? 'rs-highlight' : '', token)));
      canvas.append(tokens);
    }
  }

  function buildStageOps(stage, step, total) {
    if (stage.ops && stage.ops.length) return stage.ops;
    const activeTokens = (stage.tokens || []).filter((_, i) => (stage.active || []).includes(i));
    return [
      { label: 'ขั้นตอน', value: stage.title, tone: 'minus' },
      { label: 'จุดโฟกัส', value: activeTokens.length ? activeTokens.join(' · ') : (stage.tokens ? stage.tokens[0] : 'ข้อมูลตั้งต้น'), tone: 'skip' },
      { label: 'ผลลัพธ์', value: stage.value, tone: 'result' }
    ];
  }

  function setupDemo(el) {
    const name = el.dataset.rsDemo, stages = demoSpecs[name];
    if (!stages || !stages.length) return;
    const meta = demoMeta[name] || {
      title: stages[0].title.replace(/^1\s*·\s*/, ''),
      subtitle: 'กด Play หรือปุ่มลูกศรเพื่อดูการเปลี่ยนแปลงบนกระดานทีละขั้น'
    };

    el.className = 'concept-lab rs-demo algo-demo';
    el.setAttribute('aria-label', meta.title);

    const head = make('div', 'lab-head');
    const headText = make('div', 'rs-wb-head-text');
    const h3 = make('h3', '', meta.title);
    const sub = make('p', '', meta.subtitle);
    headText.append(h3, sub);

    const controls = make('div', 'lab-controls');
    const play = make('button', 'lab-btn primary', 'Play');
    const back = make('button', 'lab-btn', 'Back');
    const next = make('button', 'lab-btn', 'Next');
    const reset = make('button', 'lab-btn', 'Reset');
    [play, back, next, reset].forEach(b => { b.type = 'button'; });
    controls.append(play, back, next, reset);
    head.append(headText, controls);

    const stageWrap = make('div', 'algo-stage');
    const canvas = make('div', 'rs-wb-canvas rs-demo-visual');
    const eqBox = make('div', 'dp-equation');

    const statusBox = make('div', 'algo-status');
    const statusText = make('span', 'rs-demo-detail');
    const counter = make('span', 'algo-counter rs-demo-counter');
    statusBox.append(statusText, counter);

    const progress = make('div', 'lab-progress');
    const progressBar = make('span', '');
    progress.append(progressBar);

    const live = make('span', 'rs-visually-hidden rs-demo-heading rs-demo-value');
    live.setAttribute('aria-live', 'polite');

    stageWrap.append(canvas, eqBox, statusBox, progress, live);
    el.append(head, stageWrap);

    let step = 0, timer = null;
    function stop() {
      if (timer) clearInterval(timer);
      timer = null;
      play.textContent = 'Play';
      play.setAttribute('aria-pressed', 'false');
    }
    function render(announce = false) {
      const stage = stages[step];
      renderHolisticCanvas(canvas, name, stage, stages, step);

      eqBox.replaceChildren();
      const ops = buildStageOps(stage, step, stages.length);
      ops.forEach(op => {
        const card = make('div', `dp-op ${op.tone || 'muted'}`);
        card.innerHTML = `<span>${op.label}</span><strong>${op.value}</strong>`;
        eqBox.append(card);
      });

      statusText.innerHTML = `<strong>${stage.title}:</strong> ${stage.detail}`;
      counter.textContent = `${stage.value} · (${step + 1}/${stages.length})`;
      const pct = stages.length > 1 ? Math.round(((step + 1) / stages.length) * 100) : 100;
      progressBar.style.setProperty('--progress', `${pct}%`);
      progressBar.style.width = `${pct}%`;

      back.disabled = step === 0;
      next.disabled = step === stages.length - 1;
      if (announce) live.textContent = `${stage.title}: ${stage.value}. ${stage.detail}`;
    }

    back.onclick = () => { stop(); step = Math.max(0, step - 1); render(true); };
    next.onclick = () => { stop(); step = Math.min(stages.length - 1, step + 1); render(true); };
    reset.onclick = () => { stop(); step = 0; render(true); };
    play.onclick = () => {
      if (timer) { stop(); return; }
      if (step === stages.length - 1) step = 0;
      render();
      play.textContent = 'Pause';
      play.setAttribute('aria-pressed', 'true');
      timer = setInterval(() => {
        if (!root.classList.contains('active') || el.closest('[hidden]') || document.hidden) { stop(); return; }
        step++;
        render();
        if (step === stages.length - 1) {
          stop();
          live.textContent = 'จบภาพทีละขั้น';
        }
      }, 1600);
    };
    players.set(el, { stop });
    render();
    play.setAttribute('aria-pressed', 'false');
  }
  function register(data) {
    const chapters = (window.RECSYS_CHAPTERS || []).filter(c => c.lessons?.length); if (!chapters.length || document.getElementById('subject-recsys')) return;
    data.subjects.push({ id: 'recsys', code: '204729', short: 'Recommending System', title: 'Recommending System', thai: 'ระบบผู้แนะนำ · เริ่มจากศูนย์ทีละบทย่อย', accent: '#5ee0c2', practice: false, heroPills: [`${chapters.length} บทที่พร้อมเรียน`, 'Choice ท้ายบทย่อย', 'ตัวอย่างทีละขั้น', 'บันทึกความคืบหน้าแยกวิชา'] });
    data.quizzes.recsys = [];
    root = make('div', 'subject-content'); root.id = 'subject-recsys'; root.dataset.taskMode = 'choice'; root.dataset.subjectTitle = 'Recommending System';
    answers = read(ANSWERS_KEY); openState = read(OPEN_KEY);
    try {
      const savedCh = localStorage.getItem(CHAPTER_KEY);
      if (savedCh && chapters.some(c => c.id === savedCh)) {
        activeChapterId = savedCh;
      } else {
        activeChapterId = chapters[0].id;
      }
    } catch {
      activeChapterId = chapters[0].id;
    }
    const toolbar = make('div', 'subject-task-toolbar'), copy = make('div'), summary = make('span', 'subject-task-summary'), reset = make('button', 'subject-task-reset', '↺ Reset วิชานี้'); reset.type = 'button';
    copy.append(make('strong', '', 'Section Tasks · Recommending System'), summary); toolbar.append(copy, reset);
    const progress = make('div', 'rs-course-progress'); progress.setAttribute('role', 'progressbar'); progress.setAttribute('aria-valuemin', '0'); progress.append(make('div'));
    root.append(toolbar, progress, make('p', 'rs-storage-note', 'บันทึกคำตอบและสถานะเปิด–ปิดใน Browser นี้ · Reset ล้างเฉพาะวิชา Recommending System'));
    const documents = {};
    chapters.forEach((chapter, chIdx) => {
      const section = make('section', 'rs-chapter'); section.id = chapter.id; section.dataset.nav = `${chapter.number} · ${chapter.title}`; if (chapter.id === activeChapterId) section.classList.add('active');
      section.append(make('div', 'section-kicker', `CHAPTER ${chapter.number} · ${chapter.kicker || 'BEGINNER FOUNDATIONS'}`), make('h2', '', chapter.title), make('p', 'lead', chapter.description), make('p', 'rs-chapter-progress'));
      const note = make('div', 'callout'); note.innerHTML = '<b>วิธีอ่าน:</b> เปิดทีละบทย่อย → อ่านตัวอย่าง → กด Next เพื่อดูขั้นตอน → ตอบ Choice ด้านล่าง ไม่ต้องทำทุกส่วนจบในครั้งเดียว'; section.append(note);
      chapter.lessons.forEach((lesson, index) => {
        const lessonNum = lesson.number || `${chapter.number}.${index + 1}`;
        const lessonGoal = lesson.goal || lesson.desc || '';
        const lessonLead = lesson.lead || lesson.subtitle || '';
        const lessonBody = lesson.body || lesson.content || '';
        const node = make('section', 'section-task rs-lesson collapsed'); node.id = lesson.id; node.dataset.nav = `${lessonNum} · ${lesson.title}`; node.dataset.subtopic = 'true';
        const head = make('div', 'section-task-head'), toggle = make('button', 'section-task-toggle'), dot = make('span', 'section-task-dot'), count = make('span', 'section-task-progress', `0/${lesson.questions.length}`), chevron = make('span', 'section-task-chevron', '⌄'); toggle.type = 'button'; toggle.setAttribute('aria-controls', `${lesson.id}-body`); toggle.setAttribute('aria-expanded', 'false'); dot.setAttribute('aria-hidden', 'true'); chevron.setAttribute('aria-hidden', 'true');
        const heading = make('h3', 'rs-task-heading', lesson.title); toggle.append(make('span', 'section-task-code', `Task ${lessonNum}`), dot, heading, count, chevron); head.append(toggle);
        const body = make('div', 'section-task-body'); body.id = `${lesson.id}-body`; body.hidden = true;
        const metaNode = make('p', 'rs-lesson-meta'); metaNode.innerHTML = `เป้าหมาย: ${lessonGoal}`;
        const leadNode = make('p', 'lead'); leadNode.innerHTML = lessonLead;
        body.append(metaNode, leadNode);
        const prose = make('div', 'rs-lesson-content'); prose.innerHTML = lessonBody; body.append(prose); renderSources(lesson, body);
        window.installRecsysFigures?.(node);
        const questionsPanel = make('div', 'section-questions'); body.append(questionsPanel); node.append(head, body); section.append(node);
        const entry = { lesson, section: node, body, toggle, dot, count, questionsPanel }; registry.set(lesson.id, entry); renderQuestions(entry); setOpen(lesson.id, openState[lesson.id] === true, false); toggle.onclick = () => setOpen(lesson.id, body.hidden);
        lesson.sources.forEach((doc, i) => { documents[`${lesson.id}-doc-${i}`] = { title: `${doc.title} · ${doc.topic}`, path: doc.path, pages: doc.pages, startPage: doc.page }; });
      });
      const navBar = make('nav', 'rs-chapter-nav');
      navBar.setAttribute('aria-label', `การนำทางบท ${chapter.number}`);
      if (chIdx > 0) {
        const prevCh = chapters[chIdx - 1];
        const prevBtn = make('button', 'rs-nav-btn rs-nav-prev');
        prevBtn.type = 'button';
        const cleanTitle = prevCh.title.replace(/^บท\s*\d+:\s*/, '').slice(0, 24);
        prevBtn.innerHTML = `← Ch ${prevCh.number} ${cleanTitle}…`;
        prevBtn.title = `ไปบทก่อนหน้า: Ch ${prevCh.number} ${prevCh.title}`;
        prevBtn.onclick = () => setActiveChapter(prevCh.id);
        navBar.append(prevBtn);
      } else {
        const spacer = make('span', 'rs-nav-spacer');
        navBar.append(spacer);
      }
      const indicator = make('div', 'rs-nav-indicator', `บทที่ ${chIdx + 1} จาก ${chapters.length} บท · ${chapter.lessons.length} Tasks`);
      navBar.append(indicator);
      if (chIdx < chapters.length - 1) {
        const nextCh = chapters[chIdx + 1];
        const nextBtn = make('button', 'rs-nav-btn rs-nav-next');
        nextBtn.type = 'button';
        const cleanTitle = nextCh.title.replace(/^บท\s*\d+:\s*/, '').slice(0, 24);
        nextBtn.innerHTML = `Ch ${nextCh.number} ${cleanTitle}… →`;
        nextBtn.title = `ไปบทถัดไป: Ch ${nextCh.number} ${nextCh.title}`;
        nextBtn.onclick = () => setActiveChapter(nextCh.id);
        navBar.append(nextBtn);
      } else {
        const spacer = make('span', 'rs-nav-spacer');
        navBar.append(spacer);
      }
      section.append(navBar);
      root.append(section);
    });
    document.getElementById('content').append(root);
    const status = make('p', 'rs-answer-status'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); status.setAttribute('aria-atomic', 'true'); root.append(status);
    root.addEventListener('click', event => {
      const choice = event.target.closest('[data-choice]');
      if (choice) {
        const card = choice.closest('[data-question-id]'), entry = registry.get(card.closest('.rs-lesson').id), q = entry.lesson.questions.find(q => q.id === card.dataset.questionId);
        const selected = Number(choice.dataset.choice); if (validAnswer(q) || !Number.isInteger(selected) || selected < 0 || selected >= q.choices.length) return;
        answers[q.id] = { selected, version: q.version }; write(ANSWERS_KEY, answers);
        const replacement = renderQuestion(q, entry.lesson.questions.indexOf(q)); card.replaceWith(replacement); updateProgress();
        const message = `${selected === q.answer ? 'ถูกต้อง' : 'ยังไม่ถูก'} คำตอบที่ถูกคือ ${'ABCD'[q.answer]} ${q.choices[q.answer]}. ${q.explanation}`; status.textContent = message;
        // Focus the explanation after replacing the clicked button, including keyboard use.
        const explanation = replacement.querySelector('.explain'); explanation.tabIndex = -1; explanation.focus({ preventScroll: true });
      }
      const doc = event.target.closest('[data-rs-document]'); if (doc) window.openPdfDocument?.(doc.dataset.rsDocument);
    });
    reset.onclick = () => {
      if (!confirm('ล้างคำตอบและความคืบหน้าวิชา Recommending System ทั้งหมดหรือไม่? วิชาอื่นจะไม่เปลี่ยน')) return;
      answers = {}; openState = {}; write(ANSWERS_KEY, answers); write(OPEN_KEY, openState);
      registry.forEach(entry => { renderQuestions(entry); setOpen(entry.lesson.id, false, false); }); updateProgress(); status.textContent = 'รีเซ็ตเฉพาะวิชา Recommending System แล้ว'; reset.focus();
    };
    document.addEventListener('click', event => { const target = event.target.closest?.('.side-link[href^="#"],.search-item[data-id]'); if (target) openLesson(target.dataset.id || target.getAttribute('href')?.slice(1)); }, true);
    window.addEventListener('hashchange', () => {
      const id = location.hash.slice(1);
      if (registry.has(id) || chapters.some(c => c.id === id)) {
        if (!root.classList.contains('active')) window.switchSubject?.('recsys');
        openLesson(id);
      }
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) players.forEach(p => p.stop()); });
    new MutationObserver(() => { if (!root.classList.contains('active')) players.forEach(p => p.stop()); }).observe(root, { attributes: true, attributeFilter: ['class'] });
    root.querySelectorAll('[data-rs-demo]').forEach(setupDemo); updateProgress(); window.installRecsysFigures?.(root); openLesson(location.hash.slice(1));
    window.RECSYS_COURSE.documents = documents;
  }
  window.RECSYS_COURSE = { register, openLesson, setActiveChapter, getActiveChapterId: () => activeChapterId, documents: {} };
})();
