"use strict";

(() => {
  const byId = id => document.getElementById(id);
  const bookBack = byId("map-books");
  const quizHeader = byId("quiz-header");
  const quizWorkspace = byId("quiz-workspace");
  const quizActions = byId("actions");
  const storageKey = "mohe.xiao1000.local.v1";
  const examPrefix = storageKey + ".exam.";
  const letters = "ABCD";
  const labels = { single: "单选题", multiple: "多选题", written: "材料分析题" };
  const chapterAll = "all";
  const sheet = byId("single-sheet");
  const sheetFilter = byId("sheet-filter");
  const sheetNumbers = byId("sheet-numbers");
  const saveStatus = byId("save-status");
  const selectors = {
    subject: byId("subject-select"),
    chapter: byId("chapter-select"),
    type: byId("type-select")
  };
  if (typeof questions === "undefined" || typeof subjects === "undefined" || !questions.length) {
    byId("load-error").hidden = false;
    return;
  }

  const questionById = new Map(questions.map(q => [q.id, q]));
  const analysisRequests = new Map();
  function loadAnalysis(subjectId) {
    if (!analysisRequests.has(subjectId)) {
      const request = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "analysis/subject-" + subjectId + ".js?v=53";
        script.onload = () => {
          const sections = window.PracticeAnalysis?.[subjectId];
          if (sections) resolve(sections);
          else reject(new Error("解析数据缺失"));
          script.remove();
        };
        script.onerror = () => {
          script.remove();
          reject(new Error("解析加载失败"));
        };
        document.head.append(script);
      }).catch(error => {
        analysisRequests.delete(subjectId);
        throw error;
      });
      analysisRequests.set(subjectId, request);
    }
    return analysisRequests.get(subjectId);
  }
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(storageKey) || "{}") || {};
  } catch {
    saveStatus.textContent = "无法读取进度";
    saveStatus.hidden = false;
  }

  const records = new Map();
  for (const q of questions) {
    const old = saved.records?.[q.id];
    let selection = [...new Set(Array.from(String(old?.selection || "")).filter(x => letters.includes(x)))].sort().join("");
    if (q.type === "single") selection = selection.slice(0, 1);
    records.set(q.id, {
      selection,
      submitted: Boolean(old?.submitted && (q.type === "written" || selection)),
      lastCorrect: typeof old?.lastCorrect === "boolean" ? old.lastCorrect : null,
      solved: old?.solved === true || old?.lastCorrect === true,
      marked: old?.marked === true,
      draft: typeof old?.draft === "string" ? old.draft.slice(0, 12000) : ""
    });
  }

  let current = questionById.get(saved.currentId) || questions[0];
  let subject = current.subject;
  let chapter = saved.scope?.chapter === chapterAll ? chapterAll : String(current.chapterIndex);
  let type = !saved.currentId || saved.scope?.type === "all" ? "all" : current.type;
  let filter = "all";
  let lastSheetQuestion;
  let examMode = saved.mode === "exam";
  let newlyCleared = null;
  let soundEnabled = saved.sound === true;
  let audioContext;
  const mapDialog = byId("campaign-map");
  const recapDialog = byId("stage-recap");
  const stages = new Map(subjects.map(([, , chapters], i) => [
    i + 1, [...chapters, "综合材料"].map((name, index) => ({ subject: i + 1, index, name, questions: [] }))
  ]));
  for (const q of questions) stages.get(q.subject)[q.chapterIndex].questions.push(q);
  const stageList = Array.from(stages.values()).flat();
  const mapRoute = byId("stage-route");
  const mapLandscape = mapDialog.querySelector(".map-landscape");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const stationsPerSection = 6;
  const mapPreview = byId("map-preview");
  const sceneDesign = {
    scholar: ["#26201b", "#edc695", 60],
    wetland: ["#1e302c", "#d7e697", 68],
    writing: ["#30251d", "#efca94", 54],
    harvest: ["#352816", "#f4cc7a", 47],
    steam: ["#2a2624", "#eac09a", 55],
    harbor: ["#172936", "#c1dced", 57],
    workshop: ["#2a2520", "#eac094", 55],
    neighborhood: ["#272e1d", "#ece1a4", 48],
    printing: ["#2d231a", "#f0c58a", 56],
    newculture: ["#2c261c", "#eaca89", 49],
    yanan: ["#36261e", "#efc387", 57],
    jinggang: ["#253028", "#d4dcac", 56],
    assembly: ["#33231c", "#f1ca91", 58],
    humen: ["#253238", "#e9d4a1", 59],
    industry: ["#34271e", "#efc898", 56],
    wuchang: ["#312624", "#e8b696", 59],
    redboat: ["#322521", "#f0c38c", 56],
    longmarch: ["#26313a", "#d9dee3", 52],
    lugou: ["#322722", "#f0c099", 63],
    xibaipo: ["#2d2d22", "#ead8a0", 57],
    founding: ["#38261e", "#f1c182", 54],
    "reform-harbor": ["#24323c", "#c8deeb", 56],
    "railway-modern": ["#2a2d30", "#f7cd95", 63],
    victory: ["#3b281e", "#f2ca95", 54],
    civic: ["#273139", "#ece1bf", 62],
    campus: ["#273222", "#e0e6ac", 56],
    reunion: ["#332922", "#ebc48f", 60],
    mayfourth: ["#292d29", "#edddba", 58],
  };
  // Focal point, sharp area center, and the width and height of the feathered edge.
  // Values are tuned for the lower-right crop, independently of the full-page art.
  const previewComposition = {
    assembly: [61, 50, 64, 54, 81, 79],
    campus: [64, 55, 70, 59, 75, 89],
    civic: [64, 51, 69, 56, 81, 78],
    founding: [54, 48, 64, 49, 87, 83],
    harbor: [71, 54, 70, 60, 78, 86],
    harvest: [65, 57, 67, 59, 80, 90],
    humen: [52, 49, 58, 61, 84, 86],
    industry: [52, 50, 60, 58, 81, 79],
    jinggang: [54, 54, 60, 62, 85, 83],
    longmarch: [53, 52, 67, 55, 80, 84],
    lugou: [67, 50, 62, 57, 94, 73],
    mayfourth: [57, 53, 61, 60, 87, 78],
    neighborhood: [59, 58, 66, 58, 79, 86],
    newculture: [55, 49, 59, 60, 83, 83],
    printing: [63, 57, 68, 58, 78, 78],
    "railway-modern": [62, 61, 68, 65, 90, 81],
    redboat: [56, 53, 64, 60, 94, 78],
    "reform-harbor": [65, 53, 66, 61, 86, 85],
    reunion: [55, 53, 61, 56, 91, 80],
    scholar: [69, 57, 66, 62, 78, 86],
    steam: [62, 62, 67, 63, 82, 81],
    victory: [55, 54, 60, 59, 88, 82],
    wetland: [71, 65, 72, 67, 77, 87],
    workshop: [67, 52, 70, 59, 81, 88],
    writing: [53, 56, 59, 55, 84, 83],
    wuchang: [54, 53, 63, 60, 82, 84],
    xibaipo: [57, 53, 63, 61, 86, 83],
    yanan: [55, 54, 59, 59, 87, 82]
  };
  const worldMaps = [
    ["scholar", 41],
    ["jinggang", 73],
    ["railway-modern", 61],
    ["longmarch", 24],
    ["campus", 39]
  ].map(([scene, portraitFocus]) => ({ scene, portraitFocus }));
  let mapWorld;
  let mapSection;
  let mapStageProgress;
  let mapStars;
  let mapMotionPaused = saved.mapMotionPaused === true;
  let mapTarget;
  let pendingTrail;
  let unlockAnimations = [];

  // The rows follow the source book's chapter order. The final entry is 综合材料.
  const chapterScenes = [
    ["scholar", "wetland", "writing", "harvest", "steam", "harbor", "workshop", "neighborhood", "printing"],
    ["newculture", "yanan", "jinggang", "workshop", "industry", "reform-harbor", "harbor", "railway-modern", "wetland", "assembly"],
    ["railway-modern", "civic", "reform-harbor", "assembly", "neighborhood", "harbor", "workshop", "campus", "civic",
      "printing", "newculture", "harvest", "wetland", "railway-modern", "harbor", "reunion", "harbor", "civic", "campus"],
    ["humen", "industry", "wuchang", "redboat", "longmarch", "lugou", "xibaipo", "founding", "reform-harbor", "railway-modern", "victory"],
    ["campus", "neighborhood", "mayfourth", "printing", "harvest", "neighborhood", "civic", "writing"]
  ];
  const paintedCutouts = new Set(["assembly", "founding", "humen", "industry", "jinggang", "lugou", "mayfourth",
    "longmarch", "newculture", "redboat", "reunion", "victory", "writing", "wuchang", "xibaipo", "yanan"]);
  const waterScenes = new Set(["harbor", "humen", "redboat", "reform-harbor", "wetland", "lugou", "railway-modern"]);
  const warmedScenes = new Map();
  const fogCurtain = byId("scene-transition");
  let sceneRunning = false;
  let pendingMapChange;
  let previewScene;
  let previewImage;

  function warmScene(scene) {
    if (!warmedScenes.has(scene)) {
      const image = new Image();
      image.src = "scenes/" + scene + ".webp";
      warmedScenes.set(scene, (image.decode?.() ?? Promise.resolve()).catch(() => {
        warmedScenes.delete(scene);
      }));
    }
    return warmedScenes.get(scene);
  }

  const artFor = stage => chapterScenes[stage.subject - 1][stage.index ?? stage.chapterIndex];

  function applyScene(layer, scene) {
    const path = "scenes/" + scene + ".webp";
    warmScene(scene);
    if (layer.dataset.scene === scene) return;
    layer.dataset.scene = scene;
    layer.dataset.cutout = String(paintedCutouts.has(scene));
    layer.dataset.air = waterScenes.has(scene) ? "water" : "haze";
    layer.style.setProperty("--scene-art", 'url("' + path + '")');
    const [shadow, accent, phoneFocus] = sceneDesign[scene];
    layer.style.setProperty("--scene-focus", phoneFocus + "%");
    const surface = layer === mapLandscape ? mapDialog : layer;
    surface.style.setProperty("--chapter-shadow", shadow);
    surface.style.setProperty("--chapter-light", accent);
  }

  function smokeTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 208;
    const ink = canvas.getContext("2d");
    const data = ink.createImageData(canvas.width, canvas.height);
    // Interpolate several sizes of noise to get large folds and smaller wisps.
    let seed = 97;
    const fields = [[5, .47], [11, .28], [23, .16], [47, .09]].map(([size, weight]) => ({
      size, weight,
      values: Float32Array.from({ length: (size + 1) ** 2 }, () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967296;
      })
    }));
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const u = x / canvas.width, v = y / canvas.height;
        let density = 0;
        for (const { size, weight, values } of fields) {
          const column = u * size, row = v * size;
          const ix = Math.floor(column), iy = Math.floor(row);
          const fx = column - ix, fy = row - iy;
          const dx = fx * fx * (3 - 2 * fx), dy = fy * fy * (3 - 2 * fy);
          const first = iy * (size + 1) + ix;
          const top = values[first] * (1 - dx) + values[first + 1] * dx;
          const bottom = values[first + size + 1] * (1 - dx) + values[first + size + 2] * dx;
          density += (top * (1 - dy) + bottom * dy) * weight;
        }
        const envelope = Math.max(0, 1 - ((u - .5) / .50) ** 2 - ((v - .5) / .50) ** 2);
        const offset = 4 * (y * canvas.width + x);
        const alpha = 255 * envelope ** .7 * Math.min(1, Math.max(0, (density - .32) * 2.9));
        data.data[offset] = 211;
        data.data[offset + 1] = 219;
        data.data[offset + 2] = 203;
        data.data[offset + 3] = Math.round(alpha);
      }
    }
    ink.putImageData(data, 0, 0);
    return canvas.toDataURL();
  }

  function changeWorld(scene, commit) {
    if (sceneRunning) return;
    if (reduceMotion.matches || mapMotionPaused || !Element.prototype.animate || !fogCurtain.showPopover) {
      commit();
      return;
    }
    sceneRunning = true;
    const coverDuration = 420;
    const revealDuration = 620;
    const artworkReady = warmScene(scene);
    const [shadow, light] = sceneDesign[scene];
    fogCurtain.style.setProperty("--chapter-shadow", shadow);
    fogCurtain.style.setProperty("--chapter-light", light);
    if (!fogCurtain.style.getPropertyValue("--smoke-texture")) {
      fogCurtain.style.setProperty("--smoke-texture", 'url("' + smokeTexture() + '")');
    }
    fogCurtain.hidden = false;
    fogCurtain.showPopover();
    if (!mapDialog.hidden) {
      animate(mapLandscape, [
        { transform: getComputedStyle(mapLandscape).transform },
        { transform: "scale(1.14)" }
      ], { duration: coverDuration, easing: "ease-in" });
    }

    function afterAnimation(motion, duration, next) {
      if (!motion) {
        next();
        return;
      }
      // WebKit can suspend the animation clock in an inactive window.
      let completed = false;
      const finish = () => {
        if (completed) return;
        completed = true;
        clearTimeout(timer);
        next();
        motion.cancel();
      };
      const timer = setTimeout(finish, duration + 80);
      motion.finished.then(finish, finish);
    }

    function finish() {
      if (fogCurtain.matches(":popover-open")) fogCurtain.hidePopover();
      fogCurtain.hidden = true;
      sceneRunning = false;
      const next = pendingMapChange;
      pendingMapChange = null;
      if (next && !mapDialog.hidden) next();
    }

    async function reveal() {
      if (artworkReady) {
        let deadline;
        await Promise.race([artworkReady, new Promise(resolve => {
          deadline = setTimeout(resolve, 180);
        })]);
        clearTimeout(deadline);
      }
      try {
        commit();
      } catch (error) {
        finish();
        throw error;
      }
      const fade = animate(fogCurtain, [
        { opacity: 1 }, { opacity: .57, offset: .42 }, { opacity: 0 }
      ], { duration: revealDuration, easing: "ease-out", fill: "forwards" });
      afterAnimation(fade, revealDuration, finish);
    }

    const cover = animate(fogCurtain, [
      { opacity: 0 }, { opacity: .58, offset: .48 }, { opacity: 1 }
    ], { duration: coverDuration, easing: "ease", fill: "both" });
    afterAnimation(cover, coverDuration, reveal);
  }

  function persist() {
    const active = Array.from(records).filter(([, r]) =>
      r.selection || r.draft || r.marked || r.lastCorrect !== null || r.submitted || r.solved
    );
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        currentId: current.id,
        scope: { chapter, type },
        mode: examMode ? "exam" : "single",
        sound: soundEnabled,
        mapMotionPaused,
        records: Object.fromEntries(active)
      }));
      saveStatus.hidden = true;
    } catch {
      saveStatus.textContent = "无法保存进度";
      saveStatus.hidden = false;
    }
  }

  function element(tag, className, content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
  }

  function scoped(q) {
    return q.subject === subject && (chapter === chapterAll || q.chapterIndex === Number(chapter))
      && (type === "all" || q.type === type);
  }

  function finished(q) {
    const r = records.get(q.id);
    return q.type === "written" ? r.submitted : r.lastCorrect !== null;
  }

  function stageStats(stage, examResults) {
    let done = 0, right = 0, choices = 0, wrong = 0;
    for (const q of stage.questions) {
      const record = records.get(q.id);
      if (finished(q) || examResults?.has(q.id)) done++;
      if (q.type === "written") continue;
      choices++;
      const correct = examResults
        ? record.solved || examResults.get(q.id) === true
        : record.lastCorrect === true;
      if (correct) right++;
      else if (record.lastCorrect === false || examResults?.has(q.id)) wrong++;
    }
    const cleared = done === stage.questions.length;
    const accuracy = choices ? right / choices : 1;
    const stars = !cleared ? 0 : accuracy === 1 ? 3 : accuracy >= .8 ? 2 : 1;
    return { done, right, choices, wrong, cleared, stars };
  }

  function renderStars(node, count) {
    node.setAttribute("role", "img");
    node.setAttribute("aria-label", count + " 星，共 3 星");
    node.replaceChildren(...Array.from({ length: 3 }, (_, i) => {
      const star = element("span", "medal", "★");
      star.dataset.earned = String(i < count);
      star.setAttribute("aria-hidden", "true");
      return star;
    }));
  }

  function renderStage(stats) {
    const stage = byId("stage-hud");
    stage.dataset.world = subject;
    const currentStage = stages.get(subject)[current.chapterIndex];
    byId("stage-index").textContent = chapter === chapterAll ? "全科" : "第 " + (currentStage.index + 1) + " 关";
    byId("stage-name").textContent = chapter === chapterAll ? subjects[subject - 1][0] : currentStage.name;
    byId("recap-open").hidden = !stats?.cleared;
  }

  function stopUnlockAnimation() {
    for (const animation of unlockAnimations) animation.cancel();
    unlockAnimations = [];
  }

  function revealNextStage(stage) {
    const next = mapRoute.querySelector('[data-index="' + (stage.index + 1) + '"] .stage-node');
    if (!next || reduceMotion.matches || mapMotionPaused) return;
    const meter = mapRoute.querySelector('[data-index="' + stage.index + '"] .stage-meter');
    const shine = meter && animate(meter, [
      { transform: "scaleX(.12)", opacity: .32 },
      { transform: "scaleX(1)", opacity: 1 }
    ], { duration: 490, easing: "cubic-bezier(.18,.8,.35,1)" });
    const pulse = animate(next, [
      { transform: "scale(.87)", opacity: .56 },
      { transform: "scale(1.16)", opacity: 1, offset: .55 },
      { transform: "scale(1)", opacity: 1 }
    ], { delay: shine ? 325 : 0, duration: 470, easing: "ease-out", fill: "backwards" });
    unlockAnimations = [shine, pulse].filter(Boolean);
  }

  function updateMapPreview(stage) {
    const scene = artFor(stage);
    if (scene === mapLandscape.dataset.scene) {
      previewScene = null;
      previewImage = null;
      mapPreview.replaceChildren();
      return;
    }
    if (previewScene === scene) return;
    previewScene = scene;
    const image = new Image();
    previewImage = image;
    image.alt = "";
    image.src = "scenes/" + scene + ".webp";
    const show = () => {
      if (previewImage !== image) return;
      mapPreview.dataset.cutout = String(paintedCutouts.has(scene));
      const [, light] = sceneDesign[scene];
      const [focusX, focusY, centerX, centerY, featherX, featherY] = previewComposition[scene];
      mapPreview.style.setProperty("--preview-light", light);
      mapPreview.style.setProperty("--preview-focus", focusX + "% " + focusY + "%");
      mapPreview.style.setProperty("--preview-center", centerX + "% " + centerY + "%");
      mapPreview.style.setProperty("--preview-feather", featherX + "% " + featherY + "%");
      mapPreview.replaceChildren(image);
      if (!mapMotionPaused && !mapDialog.hidden && !sceneRunning) {
        animate(image, [
          { opacity: .52, transform: "translateY(3px)" },
          { opacity: 1, transform: "translateY(0)" }
        ], { duration: 215, easing: "cubic-bezier(.2,.65,.35,1)" });
      }
    };
    if (image.complete && image.naturalWidth) show();
    else {
      image.addEventListener("load", show, { once: true });
      image.addEventListener("error", () => {
        if (previewImage === image) {
          previewScene = null;
          mapPreview.replaceChildren();
        }
      }, { once: true });
    }
  }

  function selectMapStage(stage) {
    mapTarget = stage;
    for (const stop of mapRoute.children) {
      const selected = Number(stop.dataset.index) === stage.index;
      stop.toggleAttribute("data-target", selected);
      stop.firstElementChild.setAttribute("aria-pressed", String(selected));
    }
    updateMapPreview(stage);
    const stats = mapStageProgress[stage.index];
    byId("map-stop-number").textContent = String(stage.index + 1).padStart(2, "0");
    byId("map-chapter").textContent = stage.name;
    byId("map-status").textContent = stats.cleared
      ? stats.stars + " 星通关 · " + stats.done + " 题"
      : "已完成 " + stats.done + " / " + stage.questions.length + " 题";
    byId("map-continue").firstElementChild.textContent = stats.cleared ? "重温本关" : stats.done ? "继续本关" : "进入关卡";
  }

  function renderMap(world, target, section) {
    stopUnlockAnimation();
    const examResults = readExamProgress();
    const progressByWorld = new Map([...stages].map(([id, items]) => [
      id, items.map(stage => stageStats(stage, examResults))
    ]));
    const fullProgress = [...progressByWorld.values()].flat();
    const done = fullProgress.reduce((count, stats) => count + stats.done, 0);
    const cleared = fullProgress.filter(stats => stats.cleared).length;
    const stars = fullProgress.reduce((count, stats) => count + stats.stars, 0);
    const overallBar = byId("map-overall-bar");
    overallBar.max = questions.length;
    overallBar.value = done;
    byId("map-overall-done").textContent = "已完成 " + done + " / " + questions.length + " 题";
    byId("map-overall-cleared").textContent = "通关 " + cleared + " / " + stageList.length;
    const starCount = byId("map-overall-stars");
    starCount.textContent = stars + " 星";
    if (mapStars !== undefined && stars > mapStars && !mapMotionPaused) {
      animate(starCount.parentElement, [
        { transform: "scale(1)", color: "var(--gold-hover)" },
        { transform: "scale(1.16)", color: "var(--dark-text)", offset: .42 },
        { transform: "scale(1)", color: "var(--gold-hover)" }
      ], { duration: 480, easing: "ease-out" });
    }
    mapStars = stars;
    const worldStages = stages.get(world);
    const progress = mapStageProgress = progressByWorld.get(world);
    const frontier = progress.findIndex(stats => !stats.cleared);
    mapWorld = world;
    const { scene, portraitFocus } = worldMaps[world - 1];
    applyScene(mapLandscape, scene);
    mapLandscape.style.setProperty("--scene-focus", portraitFocus + "%");
    const selected = target || worldStages[frontier] || worldStages[0];
    mapSection = section ?? Math.floor(Math.max(0, selected.index - 1) / stationsPerSection);
    const first = mapSection * stationsPerSection;
    const sectionCount = Math.ceil((worldStages.length - 1) / stationsPerSection);
    byId("map-prev").disabled = mapSection === 0;
    byId("map-next").disabled = mapSection === sectionCount - 1;
    byId("map-page").textContent = (mapSection + 1) + " / " + sectionCount;
    mapDialog.dataset.world = world;
    mapDialog.dataset.section = mapSection;
    for (const button of byId("worlds").children) {
      const id = Number(button.dataset.world);
      const worldProgress = progressByWorld.get(id);
      const worldCleared = worldProgress.filter(stats => stats.cleared).length;
      button.setAttribute("aria-pressed", String(id === world));
      button.setAttribute("aria-label", subjects[id - 1][0] + "，通关 " + worldCleared + " / " + worldProgress.length + " 关");
      button.querySelector(".world-count").textContent = worldCleared + " / " + worldProgress.length;
    }
    const visibleStages = worldStages.slice(first, first + stationsPerSection + 1);
    mapRoute.replaceChildren(...visibleStages.map(stage => {
      const i = stage.index;
      const stats = progress[i];
      const row = element("li", "stage-stop");
      row.dataset.index = i;
      row.dataset.cleared = String(stats.cleared);
      row.dataset.lit = String(i === 0 || progress[i - 1].cleared || stats.done > 0 || i === frontier);
      const button = element("button", "stage-button");
      button.type = "button";
      button.setAttribute("aria-label", "第 " + (i + 1) + " 关，" + stage.name + (stats.cleared
        ? "，" + stats.stars + " 星通关"
        : stats.done ? "，已完成 " + stats.done + " / " + stage.questions.length + " 题" : "，未开始"));
      if (stage.subject === subject && i === current.chapterIndex) button.setAttribute("aria-current", "step");
      const node = element("span", "stage-node", String(i + 1).padStart(2, "0"));
      node.setAttribute("aria-hidden", "true");
      const meter = element("span", "stage-meter");
      meter.setAttribute("aria-hidden", "true");
      meter.style.setProperty("--stage-progress", (100 * stats.done / stage.questions.length) + "%");
      button.append(node, meter);
      if (stats.cleared) {
        const stars = element("span", "stage-strip-stars");
        renderStars(stars, stats.stars);
        button.append(stars);
      }
      button.addEventListener("pointerenter", event => {
        if (event.pointerType === "mouse" && !sceneRunning) selectMapStage(stage);
      });
      button.addEventListener("focus", () => {
        if (!sceneRunning && button.matches(":focus-visible")) selectMapStage(stage);
      });
      button.addEventListener("click", () => {
        if (!sceneRunning) enterStage(stage);
      });
      row.append(button);
      return row;
    }));
    selectMapStage(selected);
  }

  function switchMap(world, stage, section) {
    if (sceneRunning) {
      pendingMapChange = () => switchMap(world, stage, section);
      return;
    }
    if (world === mapWorld) {
      if (section !== undefined && section !== mapSection) renderMap(world, stage, section);
      return;
    }
    changeWorld(worldMaps[world - 1].scene, () => {
      if (!mapDialog.hidden) renderMap(world, stage, section);
    });
  }

  function openMap(world = subject, target) {
    if (readRoute().has("stage")) saveRoute(null);
    setBookView(false);
    renderMap(world, target || (world === subject && chapter !== chapterAll ? stages.get(world)[current.chapterIndex] : undefined));
    byId("map-title").focus({ preventScroll: true });
    const source = pendingTrail?.subject === world ? pendingTrail : null;
    if (source) {
      pendingTrail = null;
      if (!target) renderMap(world, stages.get(world)[source.index + 1]);
    }
    if (source) revealNextStage(source);
  }

  function updateMapMotion() {
    mapDialog.dataset.motion = mapMotionPaused ? "paused" : "playing";
    const button = byId("map-motion");
    const label = mapMotionPaused ? "播放动效" : "暂停动效";
    button.setAttribute("aria-label", label);
    button.title = label;
    if (mapMotionPaused) {
      stopUnlockAnimation();
      for (const layer of [mapLandscape, mapPreview.firstElementChild]) {
        for (const motion of layer?.getAnimations?.() || []) motion.cancel();
      }
    }
  }

  function readRoute() {
    return new URLSearchParams(location.hash.slice(1));
  }

  function saveRoute(stage, replace = false) {
    const route = readRoute();
    if (stage) route.set("stage", stage.subject + "-" + stage.index);
    else route.delete("stage");
    const hash = route.size ? "#" + route : "";
    if (location.hash !== hash) history[replace ? "replaceState" : "pushState"](null, "", location.pathname + location.search + hash);
  }

  function setBookView(showQuiz) {
    quizHeader.hidden = !showQuiz;
    quizWorkspace.hidden = !showQuiz;
    quizActions.hidden = !showQuiz;
    mapDialog.hidden = showQuiz;
    if (showQuiz) {
      stopUnlockAnimation();
      pendingMapChange = null;
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function enterStage(stage, { updateRoute = true, resume = false } = {}) {
    if (updateRoute) saveRoute(stage);
    if (recapDialog.open) recapDialog.close();
    setBookView(true);
    if (resume && stage.subject === current.subject && stage.index === current.chapterIndex) {
      renderCatalog();
      renderQuestion();
      setExamMode(examMode, false);
    } else {
      subject = stage.subject;
      chapter = String(stage.index);
      type = "all";
      filter = "all";
      lastSheetQuestion = undefined;
      renderCatalog();
      goTo(stage.questions.find(q => !finished(q)) || stage.questions[0], { scroll: false });
      setExamMode(examMode, false);
    }
    byId(examMode ? "exam-title" : "question-title").focus({ preventScroll: true });
  }

  function showBookRoute() {
    const route = readRoute();
    const [world, index] = (route.get("stage") || "").split("-").map(Number);
    route.delete("stage");
    bookBack.href = "index.html" + (route.size ? "#" + route : "");
    const stage = stages.get(world)?.[index];
    if (stage?.questions.length) enterStage(stage, { updateRoute: false, resume: true });
    else {
      if (readRoute().has("stage")) saveRoute(null, true);
      openMap();
    }
  }

  function openRecap() {
    const stage = stages.get(subject)[Number(chapter)];
    if (!stage) return;
    const stats = stageStats(stage);
    if (!stats.cleared) return;
    byId("recap-chapter").textContent = stage.name;
    renderStars(byId("recap-stars"), stats.stars);
    byId("recap-score").textContent = stats.choices
      ? Math.round(100 * stats.right / stats.choices) + "% 正确率"
      : stats.done + " 题已对照";
    byId("recap-rule").textContent = stats.choices
      ? stats.right + " / " + stats.choices + " 选择题答对 · 完成一星，80% 两星，全对三星"
      : "材料题已全部对照，获得三星";
    byId("recap-review").hidden = !stats.wrong;
    byId("recap-next").textContent = stageList.at(-1) === stage ? "返回关卡选择" : "下一关";
    applyScene(recapDialog, artFor(stage));
    recapDialog.showModal();
    animate(byId("recap-orbit"), [
      { opacity: 0, transform: "scale(.56) rotate(-18deg)" },
      { opacity: 1, transform: "scale(1.08) rotate(0)", offset: .72 },
      { opacity: 1, transform: "scale(1) rotate(0)" }
    ], { duration: 710, easing: "ease-out", fill: "backwards" });
    const effects = byId("recap-effects");
    effects.replaceChildren();
    if (!reduceMotion.matches && Element.prototype.animate) {
      const ray = element("span", "award-ray");
      effects.append(ray);
      animate(ray, [
        { opacity: .9, transform: "scale(.28)" },
        { opacity: 0, transform: "scale(2.5)" }
      ], { duration: 780, delay: 100, easing: "ease-out", fill: "backwards" }).onfinish = () => ray.remove();
      const distance = Math.min(150, effects.clientWidth * .44);
      for (let i = 0; i < 18; i++) {
        const angle = i * Math.PI / 9;
        const x = Math.cos(angle) * distance * (.65 + .15 * (i % 3));
        const y = Math.sin(angle) * (49 + 9 * (i % 3));
        const particle = element("span", "award-particle");
        effects.append(particle);
        animate(particle, [
          { opacity: 0, transform: "scale(.4)" },
          { opacity: 1, offset: .18 },
          { opacity: 0, transform: `translate(${x}px, ${y}px) rotate(${i * 51}deg) scale(.65)` }
        ], { duration: 720, delay: 130 + 60 * (i % stats.stars), easing: "cubic-bezier(.19,1,.32,1)", fill: "backwards" }).onfinish = () => particle.remove();
      }
    }
    for (const [i, star] of Array.from(byId("recap-stars").children).entries()) {
      if (i >= stats.stars) break;
      animate(star, [
        { opacity: 0, transform: "translateY(-34px) scale(.35) rotate(-32deg)" },
        { opacity: 1, transform: "translateY(0) scale(1.42) rotate(8deg)", offset: .51 },
        { transform: "scale(.91) rotate(-5deg)", offset: .78 },
        { transform: "scale(1) rotate(0)" }
      ], { duration: 580, delay: 160 * i + 60, easing: "ease-out", fill: "backwards" });
    }
    animate(byId("recap-score"), [
      { opacity: 0, transform: "translateY(9px)" }, { opacity: 1, transform: "translateY(0)" }
    ], { duration: 420, delay: 120, easing: "ease-out", fill: "backwards" });
    playSound("clear");
  }

  function playSound(kind) {
    if (!soundEnabled) return;
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    try {
      audioContext ||= new Audio();
      if (audioContext.state !== "running") audioContext.resume().catch(() => {});
      const notes = { select: [390], correct: [523, 659, 784], wrong: [262, 208], clear: [523, 659, 784, 1047] }[kind];
      for (const [index, frequency] of notes.entries()) {
        const note = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const start = audioContext.currentTime + index * .072;
        note.type = "sine";
        note.frequency.value = frequency;
        gain.gain.setValueAtTime(.001, start);
        gain.gain.linearRampToValueAtTime(.075, start + .018);
        gain.gain.exponentialRampToValueAtTime(.001, start + .14);
        note.connect(gain).connect(audioContext.destination);
        note.start(start);
        note.stop(start + .15);
      }
    } catch {
      // Audio availability does not affect grading or navigation.
    }
  }

  function matches(q) {
    if (!scoped(q)) return false;
    const r = records.get(q.id);
    if (filter === "wrong") return r.lastCorrect === false;
    if (filter === "marked") return r.marked;
    if (filter === "unanswered") return !finished(q);
    return true;
  }

  function setChoices(select, entries, selected) {
    select.replaceChildren(...entries.map(([value, text]) => {
      const option = element("option", null, text);
      option.value = value;
      return option;
    }));
    select.value = selected;
  }

  function renderCatalog() {
    const [, title, chapters] = subjects[subject - 1];
    const list = questions.filter(q => q.subject === subject);
    byId("subject-title").textContent = title;
    setChoices(selectors.subject, subjects.map(([short], i) => [i + 1, short]), subject);
    setChoices(selectors.chapter, [
      [chapterAll, "全部章节"],
      ...chapters.map((name, index) => [index, name]),
      [chapters.length, "综合材料"]
    ], chapter);
    const available = list.filter(q => chapter === chapterAll || q.chapterIndex === Number(chapter));
    setChoices(selectors.type, [["all", "全部题型"], ...Object.entries(labels).filter(([k]) => available.some(q => q.type === k))], type);
  }

  function answerSheetPager(list) {
    const controls = list.previousElementSibling.querySelector(".answer-sheet-pages");
    const [previous, indicator, next] = controls.children;
    let entries = [];
    let page = 0;
    let pageSize = 0;

    function show(anchor) {
      const style = getComputedStyle(list);
      const capacity = Number(style.getPropertyValue("--answer-columns")) * Number(style.getPropertyValue("--answer-rows"));
      if (pageSize && capacity !== pageSize) page = Math.floor(page * pageSize / capacity);
      pageSize = capacity;
      const active = entries.findIndex(button => button.dataset.question === anchor);
      if (active >= 0) page = Math.floor(active / pageSize);
      const totalPages = Math.max(1, Math.ceil(entries.length / pageSize));
      page = Math.min(page, totalPages - 1);
      const start = page * pageSize;
      list.replaceChildren(...entries.slice(start, start + pageSize));
      controls.hidden = totalPages === 1;
      indicator.textContent = (page + 1) + " / " + totalPages;
      previous.setAttribute("aria-disabled", String(page === 0));
      next.setAttribute("aria-disabled", String(page === totalPages - 1));
    }

    for (const [button, step] of [[previous, -1], [next, 1]]) {
      button.addEventListener("click", () => {
        if (button.getAttribute("aria-disabled") === "true") return;
        page += step;
        show();
      });
    }
    let viewportWidth;
    let viewportHeight;
    window.addEventListener("resize", () => {
      if (viewportWidth === innerWidth && viewportHeight === innerHeight) return;
      viewportWidth = innerWidth;
      viewportHeight = innerHeight;
      if (entries.length) show();
    });
    return (buttons, { anchor, reset } = {}) => {
      entries = buttons;
      if (reset) page = 0;
      show(anchor);
    };
  }

  const showSingleSheet = answerSheetPager(sheetNumbers);

  function renderSheet() {
    const scope = questions.filter(scoped);
    const completed = scope.filter(finished).length;
    const visible = scope.filter(matches);

    byId("progress").max = scope.length || 1;
    byId("progress").value = completed;
    const stage = stages.get(subject)[Number(chapter)];
    const stats = stage ? stageStats(stage) : null;
    byId("progress-label").textContent = stats ? stats.done + " / " + stage.questions.length : completed + " / " + scope.length;
    if (stats) {
      byId("progress").max = stage.questions.length;
      byId("progress").value = stats.done;
    }
    renderStage(stats);
    sheetFilter.value = filter;
    sheetFilter.querySelector('[value="unanswered"]').textContent = "未答 " + (scope.length - completed);
    sheetFilter.querySelector('[value="wrong"]').textContent = "错题 " + scope.filter(q => records.get(q.id).lastCorrect === false).length;
    sheetFilter.querySelector('[value="marked"]').textContent = "标记 " + scope.filter(q => records.get(q.id).marked).length;

    sheetNumbers.hidden = !visible.length;
    byId("sheet-empty").hidden = visible.length !== 0;
    const empty = { wrong: "本组没有错题", marked: "本组没有标记的题目", unanswered: "本组已全部完成", all: "本组没有题目" };
    byId("sheet-empty").textContent = empty[filter];
    const buttons = [];
    const groups = Object.keys(labels).filter(key => visible.some(q => q.type === key));
    for (const key of groups) {
      for (const q of visible.filter(q => q.type === key)) {
        const r = records.get(q.id);
        const button = element("button", "answer-sheet-number", q.number);
        button.type = "button";
        button.dataset.question = q.id;
        if (groups.length > 1) {
          const kind = element("span", "answer-sheet-kind", labels[key][0]);
          kind.setAttribute("aria-hidden", "true");
          button.prepend(kind);
        }
        const status = q.type === "written" && r.submitted ? "已对照"
          : r.lastCorrect === null ? (r.selection || r.draft ? "已作答未提交" : "未答")
          : r.lastCorrect ? "答对" : "答错";
        const location = (chapter === chapterAll ? q.chapter + "，" : "") + labels[q.type];
        button.setAttribute("aria-label", location + " " + q.number + "，" + status + (r.marked ? "，已标记" : ""));
        if (q.id === current.id) button.setAttribute("aria-current", "step");
        button.dataset.status = r.lastCorrect === false ? "wrong" : r.lastCorrect ? "right"
          : r.submitted || r.selection || r.draft.trim() ? "answered" : "blank";
        button.dataset.marked = String(r.marked);
        button.addEventListener("click", () => goTo(q));
        buttons.push(button);
      }
    }
    showSingleSheet(buttons, { anchor: lastSheetQuestion === current.id ? undefined : current.id });
    lastSheetQuestion = current.id;
  }

  function neighbor(direction) {
    for (let i = questions.indexOf(current) + direction; i >= 0 && i < questions.length; i += direction) {
      if (matches(questions[i])) return questions[i];
    }
    return null;
  }

  function renderActions(q, r) {
    const written = q.type === "written";
    const next = neighbor(1);
    const stage = stages.get(subject)[Number(chapter)];
    const unfinished = filter === "all" && stage?.questions.some(item => scoped(item) && !finished(item));
    byId("previous").disabled = !neighbor(-1);
    byId("retry").hidden = !r.submitted || written;
    byId("skip").hidden = r.submitted || !next;
    byId("submit").hidden = r.submitted;
    byId("submit").disabled = !written && !r.selection;
    byId("submit").textContent = written ? "对照答案" : "提交答案";
    byId("next").hidden = !r.submitted;
    const stats = stage && stageStats(stage);
    const canSettle = filter === "all" && stats?.cleared && (!next || newlyCleared === q.id);
    byId("next").textContent = canSettle ? "关卡结算" : next ? "下一题" :
      unfinished ? "继续本关" : "查看进度";
    byId("action-hint").textContent = r.submitted || written ? "" : r.selection
      ? "已选 " + r.selection.split("").join("、") : q.type === "multiple" ? "可选多项" : "选一项";
  }

  function animate(node, frames, timing) {
    if (!reduceMotion.matches) return node.animate?.(frames, timing);
  }

  function showAnalysis(sections, content) {
    content.replaceChildren();
    if (!sections.length) {
      content.append(element("p", "analysis-note", "原书列为知识储备题，仅提供答案。"));
      return;
    }
    for (const [label, paragraphs] of sections) {
      const group = element("div", label === "出处" ? "analysis-reference" : "analysis-section");
      if (label) group.append(element("h4", null, label));
      for (const paragraph of paragraphs) group.append(element("p", null, paragraph));
      content.append(group);
    }
  }

  function renderAnalysis(q, content = byId("analysis-text")) {
    const cached = window.PracticeAnalysis?.[q.subject]?.[q.id];
    if (cached) {
      showAnalysis(cached, content);
      return;
    }
    const loading = element("p", "analysis-note", "正在加载解析…");
    content.replaceChildren(loading);
    loadAnalysis(q.subject).then(sections => {
      if (!content.isConnected || loading.parentElement !== content) return;
      if (!Array.isArray(sections[q.id])) throw new Error("未找到本题解析");
      showAnalysis(sections[q.id], content);
    }).catch(() => {
      if (!content.isConnected || loading.parentElement !== content) return;
      const retry = element("button", "paper-button", "重新加载解析");
      retry.type = "button";
      retry.onclick = () => renderAnalysis(q, content);
      content.replaceChildren(retry);
    });
  }

  function renderStem(q, stem) {
    stem.textContent = q.stem;
    if (q.emphasis) {
      const offset = q.stem.lastIndexOf(q.emphasis);
      if (offset >= 0) stem.replaceChildren(document.createTextNode(q.stem.slice(0, offset)),
        element("strong", null, q.emphasis), document.createTextNode(q.stem.slice(offset + q.emphasis.length)));
    }
  }

  function renderStatements(q, statements) {
    statements.hidden = !q.statements;
    statements.replaceChildren();
    q.statements?.forEach((statement, index) => {
      const li = element("li");
      li.append(element("span", null, "①②③④"[index]), document.createTextNode(statement));
      statements.append(li);
    });
  }

  function renderChoices(q, options, selection, submitted, group, onChange) {
    options.replaceChildren();
    options.classList.toggle("combinations", Boolean(q.statements));
    if (q.type === "written") return;
    for (const [index, letter] of Array.from(letters).entries()) {
      const label = element("label", "option");
      const input = element("input");
      input.type = q.type === "single" ? "radio" : "checkbox";
      input.name = group;
      input.value = letter;
      input.checked = selection.includes(letter);
      input.disabled = submitted;
      const result = element("span", "option-result");
      if (submitted && q.answer.includes(letter)) {
        label.classList.add("is-right");
        result.textContent = input.checked ? "选对" : "漏选";
      } else if (submitted && input.checked) {
        label.classList.add("is-wrong");
        result.textContent = "错选";
      }
      input.addEventListener("change", () => {
        onChange(Array.from(options.querySelectorAll("input:checked"), node => node.value).join(""));
      });
      label.append(input, element("span", "option-letter", letter), element("span", "option-text", q.options[index]), result);
      options.append(label);
    }
  }

  function renderQuestion() {
    const q = current;
    const r = records.get(q.id);
    const written = q.type === "written";
    byId("ordinal").textContent = String(q.number).padStart(2, "0");
    byId("question-title").textContent = labels[q.type];
    byId("question-title").setAttribute("aria-label", "第 " + q.number + " 题，" + labels[q.type]);
    byId("chapter").textContent = q.chapter;
    byId("chapter").hidden = chapter !== chapterAll;
    renderStem(q, byId("stem"));
    byId("mark").textContent = r.marked ? "已标记" : "标记复习";
    byId("mark").setAttribute("aria-pressed", String(r.marked));
    byId("choice-label").textContent = q.type === "single" ? "请选择一项" : "请选择所有正确项";
    byId("choices").hidden = written;
    byId("written-area").hidden = !written;
    byId("written-draft").value = r.draft;

    renderStatements(q, byId("statements"));
    const options = byId("options");
    renderChoices(q, options, r.selection, r.submitted, "choice", selection => {
      r.selection = selection;
      playSound("select");
      renderActions(q, r);
      renderSheet();
      persist();
    });

    const feedback = byId("feedback");
    const mark = byId("result-mark");
    feedback.hidden = !r.submitted;
    feedback.classList.toggle("is-wrong", r.submitted && r.lastCorrect === false);
    byId("feedback-heading").textContent = written ? "参考答案" : r.lastCorrect ? "回答正确" : "回答错误";
    byId("answer-summary").hidden = written;
    byId("answer-summary").textContent = "你的选择 " + r.selection.split("").join("、") + "　正确答案 " + (q.answer || "").split("").join("、");
    if (r.submitted) {
      mark.querySelector("path").setAttribute("d", written ? "M7 4h10v16H7zM10 9h4m-4 4h4" :
        r.lastCorrect ? "m5 12 4 4L19 6" : "M12 5v9m0 5h.01");
      renderAnalysis(q);
    } else {
      byId("analysis-text").replaceChildren();
    }
    byId("source").textContent = "试题册 PDF 第 " + q.questionPage + " 页，解析册 PDF 第 " + q.analysisPages + " 页";
    renderActions(q, r);
    renderSheet();
  }

  function goTo(q, { scroll = true } = {}) {
    current = q;
    if (!quizWorkspace.hidden) saveRoute(stages.get(q.subject)[q.chapterIndex], true);
    renderQuestion();
    if (examMode) renderExam();
    persist();
    if (scroll && !examMode) {
      const paper = byId("paper");
      const bounds = paper.getBoundingClientRect();
      if (bounds.top < 0 || bounds.top > byId("actions").getBoundingClientRect().top - 120) {
        paper.scrollIntoView({ block: "start" });
      }
      byId("question-title").focus({ preventScroll: true });
    }
  }

  function changeScope(key) {
    if (sceneRunning) {
      renderCatalog();
      return;
    }
    if (key === "subject") {
      subject = Number(selectors.subject.value);
      chapter = "0";
      type = "all";
    } else if (key === "chapter") {
      chapter = selectors.chapter.value;
      type = "all";
    } else {
      type = selectors.type.value;
    }
    filter = "all";
    lastSheetQuestion = undefined;
    const scope = questions.filter(scoped);
    const next = scope.includes(current) ? current : scope.find(q => !finished(q)) || scope[0];
    renderCatalog();
    if (next) goTo(next, { scroll: false });
  }

  for (const [key, select] of Object.entries(selectors)) {
    select.addEventListener("change", () => changeScope(key));
  }

  byId("written-draft").addEventListener("input", event => {
    records.get(current.id).draft = event.target.value;
    renderSheet();
    persist();
  });

  byId("submit").addEventListener("click", () => {
    const r = records.get(current.id);
    const written = current.type === "written";
    if (r.submitted || (!written && !r.selection)) return;
    const stage = stages.get(subject)[current.chapterIndex];
    const before = stageStats(stage);
    if (!written) {
      r.lastCorrect = r.selection === current.answer;
      r.solved ||= r.lastCorrect;
    }
    r.submitted = true;
    const after = stageStats(stage);
    newlyCleared = after.cleared && !before.cleared ? current.id : null;
    if (newlyCleared) pendingTrail = stage;
    persist();
    renderQuestion();
    if (!written) playSound(r.lastCorrect ? "correct" : "wrong");
    const heading = byId("feedback-heading");
    heading.focus({ preventScroll: true });
    const feedback = byId("feedback");
    const availableBottom = byId("actions").getBoundingClientRect().top;
    const rect = feedback.getBoundingClientRect();
    const readHeight = Math.min(rect.height, 160);
    if (rect.top < 0 || rect.top + readHeight > availableBottom) {
      feedback.scrollIntoView({ block: "start" });
    }
  });

  byId("retry").addEventListener("click", () => {
    const r = records.get(current.id);
    r.selection = "";
    r.submitted = false;
    goTo(current);
  });

  byId("mark").addEventListener("click", () => {
    const r = records.get(current.id);
    r.marked = !r.marked;
    byId("mark").textContent = r.marked ? "已标记" : "标记复习";
    byId("mark").setAttribute("aria-pressed", String(r.marked));
    persist();
    renderSheet();
    renderActions(current, r);
  });

  byId("previous").addEventListener("click", () => {
    const next = neighbor(-1);
    if (next) goTo(next);
  });

  function nextQuestion() {
    const next = neighbor(1);
    if (next) goTo(next);
    else {
      sheetFilter.focus({ preventScroll: true });
    }
  }
  byId("next").addEventListener("click", () => {
    const stage = stages.get(subject)[Number(chapter)];
    if (filter === "all" && stage) {
      const next = neighbor(1);
      if (stageStats(stage).cleared && (!next || newlyCleared === current.id)) {
        openRecap();
        return;
      }
      if (!next) {
        const unfinished = stage.questions.find(q => scoped(q) && !finished(q));
        if (unfinished) {
          goTo(unfinished);
          return;
        }
      }
    }
    nextQuestion();
  });
  byId("skip").addEventListener("click", nextQuestion);
  sheetFilter.addEventListener("change", () => {
    filter = sheetFilter.value;
    lastSheetQuestion = undefined;
    const visible = questions.filter(matches);
    if (visible.length && !visible.includes(current)) goTo(visible[0], { scroll: false });
    else {
      renderSheet();
      renderActions(current, records.get(current.id));
    }
  });

  byId("map-open").addEventListener("click", () => openMap());
  byId("map-continue").addEventListener("click", () => {
    if (!sceneRunning) enterStage(mapTarget);
  });
  for (const [index, [name]] of subjects.entries()) {
    const button = element("button", "world-button");
    button.append(element("span", "world-name", name), element("span", "world-count"));
    button.type = "button";
    button.dataset.world = index + 1;
    button.addEventListener("click", () => switchMap(index + 1));
    byId("worlds").append(button);
  }
  for (const [id, delta] of [["map-prev", -1], ["map-next", 1]]) {
    byId(id).addEventListener("click", () => {
      const section = mapSection + delta;
      const stage = stages.get(mapWorld)[section * stationsPerSection];
      switchMap(mapWorld, stage, section);
    });
  }
  byId("map-motion").addEventListener("click", () => {
    mapMotionPaused = !mapMotionPaused;
    updateMapMotion();
    persist();
  });
  updateMapMotion();
  byId("recap-open").addEventListener("click", openRecap);
  recapDialog.querySelector(".dialog-close").addEventListener("click", () => recapDialog.close());
  byId("recap-next").addEventListener("click", () => {
    const next = stageList[stageList.indexOf(stages.get(subject)[Number(chapter)]) + 1];
    recapDialog.close();
    if (next && pendingTrail && next.subject !== pendingTrail.subject) pendingTrail = null;
    if (next) openMap(next.subject, next);
    else openMap();
  });
  byId("recap-review").addEventListener("click", () => {
    recapDialog.close();
    if (examMode) setExamMode(false);
    type = "all";
    renderCatalog();
    filter = "wrong";
    const firstWrong = questions.find(matches);
    if (firstWrong) goTo(firstWrong);
  });
  byId("sound").setAttribute("aria-pressed", String(soundEnabled));
  byId("sound").addEventListener("click", event => {
    soundEnabled = !soundEnabled;
    event.currentTarget.setAttribute("aria-pressed", String(soundEnabled));
    if (soundEnabled) playSound("select");
    persist();
  });
  const examDialog = byId("exam-confirm");
  const examDrafts = new Map();
  const examSheet = byId("exam-sheet");
  const examSheetNumbers = byId("exam-sheet-numbers");
  const showExamSheet = answerSheetPager(examSheetNumbers);
  const examSheetFilter = byId("exam-sheet-filter");
  const examSheetLabels = {
    blank: "未作答",
    answered: "已作答",
    right: "回答正确",
    wrong: "回答错误",
    written: "可查看参考答案"
  };
  const examPageSize = { single: 8, multiple: 8, written: 2 };
  const examGuidance = {
    single: "每题选一个答案。",
    multiple: "每题可选多个答案，选项全部正确才计为答对。",
    written: "在横线上写下要点，交卷后对照参考答案。"
  };
  let exam;
  let examConfirmation;
  let examSheetEntries = [];
  let examSheetFiltered = false;
  let examTarget;
  let examSheetReset = true;
  let examSheetAnchor;

  new ResizeObserver(() => {
    document.documentElement.style.setProperty("--practice-footer-height", quizActions.offsetHeight + "px");
  }).observe(quizActions);

  function getExam(key) {
    if (!examDrafts.has(key)) {
      let old;
      try {
        old = JSON.parse(localStorage.getItem(key) || "null");
      } catch {
        // The paper is still usable in memory when storage is unavailable.
      }
      examDrafts.set(key, {
        answers: old?.answers || {},
        best: old?.best || {},
        submitted: old?.submitted === true,
        page: Number.isInteger(old?.page) ? old.page : 0
      });
    }
    return examDrafts.get(key);
  }

  function collectExamResults(record, results) {
    if (!record) return;
    const addResult = (id, correct) => results.set(id, correct || results.get(id) === true);
    for (const [id, correct] of Object.entries(record.best || {})) {
      if (questionById.has(id) && typeof correct === "boolean") addResult(id, correct);
    }
    if (!record.submitted) return;
    for (const [id, answer] of Object.entries(record.answers || {})) {
      const q = questionById.get(id);
      if (q && typeof answer === "string" && answer.trim()) addResult(id, q.type !== "written" && answer === q.answer);
    }
  }

  function readExamProgress() {
    const results = new Map();
    try {
      for (const key of Object.keys(localStorage)) {
        if (!key.startsWith(examPrefix)) continue;
        try {
          collectExamResults(JSON.parse(localStorage.getItem(key)), results);
        } catch {
          // A damaged attempt does not block the map.
        }
      }
    } catch {
      // Existing in-memory attempts still count when storage is unavailable.
    }
    for (const record of examDrafts.values()) collectExamResults(record, results);
    return results;
  }

  function saveExam() {
    try {
      localStorage.setItem(exam.key, JSON.stringify(exam.record));
      byId("exam-storage-status").hidden = true;
    } catch {
      byId("exam-storage-status").hidden = false;
    }
  }

  function examAnswered(q) {
    return Boolean(String(exam.record.answers[q.id] || "").trim());
  }

  function updateExamProgress() {
    const completed = exam.questions.filter(examAnswered).length;
    byId("exam-progress").textContent = (exam.record.submitted ? "已交卷 · " : "已作答 ") + completed + " / " + exam.questions.length + " 题";
    updateExamSheet();
  }

  function buildExamSheet() {
    examTarget = undefined;
    examSheetFiltered = false;
    examSheetReset = true;
    examSheetAnchor = exam.pages[exam.record.page]?.questions[0].id;
    examSheetEntries = exam.pages.flatMap((page, pageIndex) => page.questions.map((q, i) => {
      const number = page.offset + i + 1;
      const button = element("button", "answer-sheet-number", number);
      button.type = "button";
      button.dataset.question = q.id;
      button.addEventListener("click", () => setExamPage(pageIndex, q.id));
      return { q, number, button };
    }));
  }

  function updateExamSheet() {
    const submitted = exam.record.submitted;
    const filterStatus = submitted ? "wrong" : "blank";
    const buttons = [];
    let count = 0;
    for (const { q, number, button } of examSheetEntries) {
      let status = "blank";
      if (examAnswered(q)) {
        status = "answered";
        if (submitted) {
          status = q.type === "written" ? "written" : exam.record.answers[q.id] === q.answer ? "right" : "wrong";
        }
      }
      if (status === filterStatus) count++;
      if (!examSheetFiltered || status === filterStatus) buttons.push(button);
      if (button.dataset.status !== status) {
        button.dataset.status = status;
        button.setAttribute("aria-label", "第 " + number + " 题，" + examSheetLabels[status]);
      }
      if (examTarget === q.id) button.setAttribute("aria-current", "location");
      else button.removeAttribute("aria-current");
    }
    examSheetFilter.textContent = (submitted ? "错题 " : "未答 ") + count;
    examSheetFilter.setAttribute("aria-pressed", String(examSheetFiltered));
    const empty = byId("exam-sheet-empty");
    empty.hidden = !examSheetFiltered || count > 0;
    empty.textContent = submitted ? "没有答错的选择题" : "已完成全部题目";
    examSheetNumbers.hidden = !empty.hidden;
    showExamSheet(buttons, { anchor: examSheetAnchor, reset: examSheetReset });
    examSheetAnchor = undefined;
    examSheetReset = false;
  }

  function renderExamQuestion(q, number) {
    const question = element("li", "exam-question");
    const heading = element("h4", "exam-question-number", number + ".");
    heading.id = "exam-question-" + q.id;
    heading.tabIndex = -1;
    heading.setAttribute("aria-label", "第 " + number + " 题");
    const body = element("div", "exam-question-body");
    const stem = element("p", "stem");
    renderStem(q, stem);
    const statements = element("ol", "statements");
    renderStatements(q, statements);
    body.append(stem, statements);
    const answer = String(exam.record.answers[q.id] || "");
    const changeAnswer = value => {
      if (value) exam.record.answers[q.id] = value;
      else delete exam.record.answers[q.id];
      updateExamProgress();
      saveExam();
    };
    if (q.type === "written") {
      const label = element("label", "written-area", "作答要点");
      const draft = element("textarea");
      draft.rows = 5;
      draft.maxLength = 12000;
      draft.value = answer;
      draft.readOnly = exam.record.submitted;
      draft.setAttribute("aria-label", "第 " + number + " 题作答要点");
      draft.addEventListener("input", () => changeAnswer(draft.value));
      label.append(draft);
      body.append(label);
    } else {
      const choices = element("fieldset", "choices");
      choices.setAttribute("aria-labelledby", heading.id);
      const options = element("div", "options");
      renderChoices(q, options, answer, exam.record.submitted, "exam-" + q.id, changeAnswer);
      choices.append(options);
      body.append(choices);
    }
    if (exam.record.submitted) {
      const feedback = element("section", "exam-feedback");
      if (q.type === "written") {
        feedback.append(element("h5", null, "参考答案"));
      } else {
        const correct = answer === q.answer;
        feedback.dataset.correct = String(correct);
        feedback.append(element("h5", null, !answer ? "未作答" : correct ? "回答正确" : "回答错误"),
          element("p", "exam-answer", "正确答案 " + q.answer.split("").join("、")));
      }
      const analysis = element("div", "analysis-text");
      renderAnalysis(q, analysis);
      const feedbackHeading = feedback.firstElementChild;
      feedbackHeading.id = "exam-analysis-" + q.id;
      feedbackHeading.tabIndex = -1;
      feedbackHeading.setAttribute("aria-label", "第 " + number + " 题，" + feedbackHeading.textContent);
      feedback.append(analysis);
      body.append(feedback);
    }
    question.append(heading, body);
    return question;
  }

  function renderExam() {
    const key = examPrefix + [subject, chapter, type].join(".");
    const record = getExam(key);
    const selected = questions.filter(scoped);
    const pages = [];
    let offset = 0;
    for (const kind of Object.keys(labels)) {
      const group = selected.filter(q => q.type === kind);
      for (let i = 0; i < group.length; i += examPageSize[kind]) {
        pages.push({ kind, offset: offset + i, questions: group.slice(i, i + examPageSize[kind]) });
      }
      offset += group.length;
    }
    if (!pages.length) return;
    const scopeChanged = exam?.key !== key;
    exam = { key, record, pages, questions: selected };
    if (scopeChanged) buildExamSheet();
    record.page = Math.min(pages.length - 1, Math.max(0, record.page));
    const page = pages[record.page];
    const subjectName = subjects[subject - 1][1];
    const scopeName = chapter === chapterAll ? "全部章节" : stages.get(subject)[Number(chapter)].name;
    byId("exam-scope").textContent = subjectName + " / " + scopeName + "　共 " + selected.length + " 题";
    byId("exam-instruction").hidden = record.submitted || record.page > 0;
    byId("exam-page-label").textContent = "第 " + (record.page + 1) + " / " + pages.length + " 页";
    byId("exam-section").textContent = labels[page.kind];
    byId("exam-section-note").textContent = record.submitted ? "" : examGuidance[page.kind];
    byId("exam-section-note").hidden = record.submitted;

    const result = byId("exam-result");
    result.hidden = !record.submitted;
    if (record.submitted) {
      const choices = selected.filter(q => q.type !== "written");
      const written = selected.filter(q => q.type === "written");
      const right = choices.filter(q => record.answers[q.id] === q.answer).length;
      byId("exam-score").textContent = choices.length ? "选择题答对 " + right + " / " + choices.length + " 题" : "已交卷";
      byId("exam-score-note").textContent = written.length
        ? "材料题已作答 " + written.filter(examAnswered).length + " / " + written.length + " 题，请对照参考答案。"
        : "未作答 " + selected.filter(q => !examAnswered(q)).length + " 题。";
    }

    byId("exam-items").replaceChildren(...page.questions.map((q, i) => renderExamQuestion(q, page.offset + i + 1)));
    const pagesNav = byId("exam-paper-pages");
    pagesNav.hidden = pages.length === 1;
    pagesNav.replaceChildren(...pages.map((_, i) => {
      const button = element("button", "number", i + 1);
      button.type = "button";
      button.setAttribute("aria-label", "第 " + (i + 1) + " 页");
      if (record.page === i) button.setAttribute("aria-current", "page");
      button.addEventListener("click", () => setExamPage(i));
      return button;
    }));

    byId("exam-prev").disabled = record.page === 0;
    byId("exam-next").disabled = record.page === pages.length - 1;
    byId("exam-submit").textContent = record.submitted ? "重做整卷" : "交卷";
    updateExamProgress();
  }

  function setExamPage(page, questionId) {
    if (page < 0 || page >= exam.pages.length) return;
    examTarget = questionId;
    examSheetAnchor = questionId || exam.pages[page].questions[0].id;
    if (page !== exam.record.page) {
      exam.record.page = page;
      saveExam();
      renderExam();
    } else if (questionId) {
      updateExamSheet();
    } else {
      examSheetAnchor = undefined;
      return;
    }
    if (questionId) {
      const target = byId((exam.record.submitted ? "exam-analysis-" : "exam-question-") + questionId);
      target.focus({ preventScroll: true });
      target.scrollIntoView({ block: "start" });
      return;
    }
    byId("full-exam").scrollIntoView({ block: "start" });
    byId("exam-section").focus({ preventScroll: true });
  }

  function setExamMode(active, persistMode = true) {
    examMode = active;
    byId("mode-single").setAttribute("aria-pressed", String(!active));
    byId("mode-exam").setAttribute("aria-pressed", String(active));
    byId("paper").hidden = active;
    byId("full-exam").hidden = !active;
    examSheet.hidden = !active;
    byId("single-actions").hidden = active;
    byId("exam-actions").hidden = !active;
    byId("stage-hud").hidden = active;
    sheet.hidden = active;
    document.querySelector(".scope-tools").open = false;
    if (active) renderExam();
    if (persistMode) persist();
  }

  byId("mode-single").addEventListener("click", () => setExamMode(false));
  byId("mode-exam").addEventListener("click", () => setExamMode(true));
  examSheetFilter.addEventListener("click", () => {
    examSheetFiltered = !examSheetFiltered;
    examSheetReset = true;
    updateExamSheet();
  });
  byId("exam-prev").addEventListener("click", () => setExamPage(exam.record.page - 1));
  byId("exam-next").addEventListener("click", () => setExamPage(exam.record.page + 1));
  byId("exam-submit").addEventListener("click", () => {
    examConfirmation = exam.record.submitted ? "reset" : "submit";
    const reset = examConfirmation === "reset";
    const blanks = exam.questions.filter(q => !examAnswered(q)).length;
    byId("exam-confirm-title").textContent = reset ? "重做这份整卷？" : "确认交卷？";
    byId("exam-confirm-text").textContent = reset ? "这份卷子的作答和结果将被清除。"
      : blanks ? "还有 " + blanks + " 道题未作答。交卷后可以查看答案和解析。"
      : "已经完成全部题目。交卷后可以查看答案和解析。";
    byId("exam-confirm-yes").textContent = reset ? "重做整卷" : "确认交卷";
    examDialog.returnValue = "";
    examDialog.showModal();
  });
  examDialog.addEventListener("close", () => {
    if (examDialog.returnValue !== "confirm") return;
    const results = new Map();
    collectExamResults(exam.record, results);
    if (examConfirmation === "reset") {
      exam.record.answers = {};
      exam.record.submitted = false;
    } else {
      exam.record.submitted = true;
      collectExamResults(exam.record, results);
    }
    exam.record.best = Object.fromEntries(results);
    exam.record.page = 0;
    examTarget = undefined;
    examSheetFiltered = false;
    examSheetReset = true;
    saveExam();
    renderExam();
    byId("full-exam").scrollIntoView({ block: "start" });
    byId(exam.record.submitted ? "exam-score" : "exam-title").focus({ preventScroll: true });
  });

  for (const id of ["catalog", "practice", "stage-hud"]) byId(id).hidden = false;
  window.addEventListener("hashchange", showBookRoute);
  showBookRoute();
})();
