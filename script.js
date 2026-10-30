/* =============================================================
   Por Dentro dos LLMs — Navegação & interações
   JS leve, sem dependências.
============================================================= */
(() => {
  "use strict";

  const slides = Array.from(document.querySelectorAll(".slide"));
  const total = slides.length;
  const progress = document.getElementById("progress");
  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");
  const counterCurrent = document.getElementById("counter-current");
  const counterTotal = document.getElementById("counter-total");
  const counterTitle = document.getElementById("counter-title");

  let current = -1;

  /* ---------- Entrada escalonada: índice para cada .reveal ---------- */
  slides.forEach((slide) => {
    slide.querySelectorAll(".reveal").forEach((el, i) => el.style.setProperty("--i", i));
  });

  /* ---------- Barra de progresso segmentada ---------- */
  const segments = slides.map((slide, i) => {
    const seg = document.createElement("button");
    seg.type = "button";
    seg.className = "progress-seg";
    seg.title = `${i + 1}. ${slide.dataset.title || "Slide"}`;
    seg.setAttribute("aria-label", `Ir para o slide ${i + 1}: ${slide.dataset.title || ""}`);
    seg.innerHTML = "<span></span>";
    seg.addEventListener("click", () => go(i));
    progress.appendChild(seg);
    return seg;
  });

  counterTotal.textContent = total;

  /* ---------- Navegação principal ---------- */
  function go(index) {
    const target = Math.max(0, Math.min(total - 1, index));
    if (target === current) return;
    current = target;

    slides.forEach((slide, i) => {
      const active = i === current;
      slide.classList.toggle("is-active", active);
      slide.classList.toggle("is-past", i < current);
      slide.setAttribute("aria-hidden", String(!active));
      slide.inert = !active;
    });

    segments.forEach((seg, i) => {
      seg.classList.toggle("is-done", i < current);
      seg.classList.toggle("is-current", i === current);
      if (i === current) seg.setAttribute("aria-current", "step");
      else seg.removeAttribute("aria-current");
    });

    counterCurrent.textContent = current + 1;
    counterTitle.textContent = slides[current].dataset.title || "";
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === total - 1;

    const hash = `#${current + 1}`;
    if (location.hash !== hash) history.replaceState(null, "", hash);
  }

  const next = () => go(current + 1);
  const prev = () => go(current - 1);

  prevBtn.addEventListener("click", prev);
  nextBtn.addEventListener("click", next);

  /* ---------- Teclado ---------- */
  document.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    // Evita duplo disparo: Espaço/Enter em um botão focado já acionam o clique.
    const onControl = e.target.closest && e.target.closest("button, a, input, textarea, select");
    if (onControl && (e.key === " " || e.key === "Enter")) return;

    switch (e.key) {
      case "ArrowRight":
      case "PageDown":
      case " ":
        e.preventDefault();
        next();
        break;
      case "ArrowLeft":
      case "PageUp":
        e.preventDefault();
        prev();
        break;
      case "Home":
        e.preventDefault();
        go(0);
        break;
      case "End":
        e.preventDefault();
        go(total - 1);
        break;
      case "f":
      case "F":
        toggleFullscreen();
        break;
      default:
        break;
    }
  });

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.();
    }
  }

  /* ---------- Gestos de swipe (touch) ---------- */
  let touchX = 0;
  let touchY = 0;
  document.addEventListener("touchstart", (e) => {
    touchX = e.changedTouches[0].clientX;
    touchY = e.changedTouches[0].clientY;
  }, { passive: true });
  document.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - touchX;
    const dy = e.changedTouches[0].clientY - touchY;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      dx < 0 ? next() : prev();
    }
  }, { passive: true });

  /* ---------- Deep-link via hash (#1 … #9) ---------- */
  const fromHash = () => {
    const n = parseInt(location.hash.replace("#", ""), 10);
    return Number.isFinite(n) ? n - 1 : 0;
  };
  window.addEventListener("hashchange", () => go(fromHash()));

  /* =============================================================
     Placeholders de imagem: mostra um cartão elegante com o
     caminho esperado enquanto o arquivo local não existir.
  ============================================================= */
  const ICON_IMAGE =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.8"/><path d="m21 15-5-5L5 21"/></svg>';

  document.querySelectorAll(".figure img").forEach((img) => {
    const figure = img.closest(".figure");
    const fallback = document.createElement("div");
    fallback.className = "figure-fallback";
    fallback.setAttribute("aria-hidden", "true");
    fallback.innerHTML = `
      ${ICON_IMAGE}
      <span class="figure-fallback-title"></span>
      <code></code>`;
    fallback.querySelector(".figure-fallback-title").textContent = img.dataset.label || "Diagrama";
    fallback.querySelector("code").textContent = img.getAttribute("src");
    img.insertAdjacentElement("afterend", fallback);

    const markMissing = () => figure.classList.add("is-missing");
    img.addEventListener("error", markMissing);
    img.addEventListener("load", () => figure.classList.remove("is-missing"));
    if (img.complete && img.naturalWidth === 0) markMissing();
  });

  /* =============================================================
     SLIDE 1 — Rede neural minimalista animada (SVG)
  ============================================================= */
  (function buildNeuralNet() {
    const svg = document.getElementById("neural-net");
    if (!svg) return;
    const NS = "http://www.w3.org/2000/svg";
    const el = (name, attrs = {}) => {
      const node = document.createElementNS(NS, name);
      Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
      return node;
    };

    const W = 420;
    const top = 30;
    const bottom = 310;
    const layers = [3, 5, 5, 2];
    const labels = ["TOKENS", "ATENÇÃO", "FFN", "SAÍDA"];
    const xs = [45, 160, 275, 380];

    const defs = el("defs");
    const grad = el("linearGradient", { id: "nn-grad", gradientUnits: "userSpaceOnUse", x1: 0, y1: 0, x2: W, y2: 0 });
    grad.append(el("stop", { offset: "0%", "stop-color": "#8B5CF6" }), el("stop", { offset: "100%", "stop-color": "#06B6D4" }));
    defs.append(grad);
    svg.append(defs);

    const positions = layers.map((count, li) => {
      const span = bottom - top;
      const gap = span / (Math.max(...layers));
      const height = gap * (count - 1);
      const start = top + (span - height) / 2;
      return Array.from({ length: count }, (_, ni) => ({ x: xs[li], y: start + ni * gap }));
    });

    const edges = el("g");
    const signals = el("g");
    for (let l = 0; l < positions.length - 1; l++) {
      positions[l].forEach((a) => {
        positions[l + 1].forEach((b) => {
          const d = `M${a.x} ${a.y} L${b.x} ${b.y}`;
          edges.append(el("path", { d, class: "edge" }));
          if (Math.random() < 0.45) {
            const s = el("path", { d, class: "signal", pathLength: 100 });
            s.style.setProperty("--dur", `${(2.4 + Math.random() * 2).toFixed(2)}s`);
            s.style.setProperty("--delay", `${(-Math.random() * 4).toFixed(2)}s`);
            signals.append(s);
          }
        });
      });
    }
    svg.append(edges, signals);

    const nodes = el("g");
    positions.forEach((layer, li) => {
      layer.forEach((p) => {
        nodes.append(el("circle", { cx: p.x, cy: p.y, r: 9, class: "node" }));
        const core = el("circle", { cx: p.x, cy: p.y, r: 4, class: `node-core${li >= 2 ? " is-cyan" : ""}` });
        core.style.setProperty("--delay", `${(-Math.random() * 2.6).toFixed(2)}s`);
        nodes.append(core);
      });
      const label = el("text", { x: xs[li], y: 345, class: "layer-label" });
      label.textContent = labels[li];
      nodes.append(label);
    });
    svg.append(nodes);
  })();

  /* =============================================================
     SLIDE 6 — Demo do loop autorregressivo
  ============================================================= */
  (function loopDemo() {
    const seqEl = document.getElementById("loop-sequence");
    const probsEl = document.getElementById("loop-probs");
    const stepEl = document.getElementById("loop-step");
    const nextEl = document.getElementById("loop-next");
    const resetEl = document.getElementById("loop-reset");
    if (!seqEl) return;

    const prompt = ["Modelos", " gerativos", " preveem", " um"];
    const steps = [
      { pick: " token", top: [[" token", 0.78], [" valor", 0.08], [" texto", 0.05]] },
      { pick: " por", top: [[" por", 0.71], [" de", 0.12], [" a", 0.06]] },
      { pick: " vez", top: [[" vez", 0.93], [" rodada", 0.03], [" ciclo", 0.01]] },
      { pick: ".", top: [[".", 0.64], [",", 0.2], [" e", 0.08]] },
    ];

    let generated = [];
    let busy = false;

    const visible = (t) => t.replace(/^ /, "␣");

    function renderSequence(newIndex = -1) {
      seqEl.innerHTML = "";
      prompt.forEach((t) => {
        const span = document.createElement("span");
        span.className = "seq-token";
        span.textContent = visible(t);
        seqEl.append(span);
      });
      generated.forEach((t, i) => {
        const span = document.createElement("span");
        span.className = "seq-token is-generated" + (i === newIndex ? " is-new" : "");
        span.textContent = visible(t);
        seqEl.append(span);
      });
    }

    function renderProbs(step) {
      probsEl.innerHTML = "";
      if (!step) {
        const p = document.createElement("p");
        p.className = "empty";
        p.textContent = "LM Head · aguardando: clique em “Gerar próximo token”.";
        probsEl.append(p);
        return;
      }
      step.top.forEach(([tok, prob]) => {
        const row = document.createElement("div");
        row.className = "prob-row" + (tok === step.pick ? " is-chosen" : "");
        row.innerHTML = `<span class="prob-token"></span><span class="prob-bar"><span></span></span><span class="prob-val">${Math.round(prob * 100)}%</span>`;
        row.querySelector(".prob-token").textContent = `"${tok}"`;
        probsEl.append(row);
        requestAnimationFrame(() => requestAnimationFrame(() => {
          row.querySelector(".prob-bar span").style.width = `${prob * 100}%`;
        }));
      });
    }

    function updateStatus() {
      const n = prompt.length + generated.length;
      stepEl.textContent = `Passo ${generated.length} · ${n} tokens na entrada`;
      const done = generated.length >= steps.length;
      nextEl.disabled = done || busy;
      nextEl.textContent = done ? "Sequência completa ✓" : "Gerar próximo token";
    }

    function reset() {
      generated = [];
      busy = false;
      renderSequence();
      renderProbs(null);
      updateStatus();
    }

    nextEl.addEventListener("click", () => {
      if (busy || generated.length >= steps.length) return;
      const step = steps[generated.length];
      busy = true;
      updateStatus();
      renderProbs(step);
      setTimeout(() => {
        generated.push(step.pick);
        renderSequence(generated.length - 1);
        busy = false;
        updateStatus();
      }, 650);
    });
    resetEl.addEventListener("click", reset);

    reset();
  })();

  /* =============================================================
     SLIDE 7 — Mini-visualização de autoatenção
  ============================================================= */
  (function attentionDemo() {
    const container = document.getElementById("attn-sentence");
    const caption = document.getElementById("attn-caption");
    if (!container) return;

    const words = ["O", "roteador", "não", "atendeu", "a", "rede", "5G", "porque", "estava", "sobrecarregado"];
    // Pesos ilustrativos (linha = token de origem; cada linha soma 1)
    const presets = {
      1: [0.20, 0.40, 0.03, 0.12, 0.01, 0.08, 0.04, 0.02, 0.04, 0.06],
      3: [0.03, 0.30, 0.10, 0.20, 0.02, 0.20, 0.10, 0.01, 0.01, 0.03],
      6: [0.02, 0.08, 0.02, 0.05, 0.02, 0.45, 0.20, 0.02, 0.02, 0.12],
      8: [0.03, 0.45, 0.03, 0.05, 0.01, 0.08, 0.05, 0.07, 0.10, 0.13],
      9: [0.02, 0.50, 0.02, 0.04, 0.01, 0.08, 0.05, 0.04, 0.12, 0.12],
    };
    const weightsFor = (src) => {
      if (presets[src]) return presets[src];
      const raw = words.map((_, j) => (j === src ? 0.45 : Math.abs(j - src) === 1 ? 0.2 : 0.02));
      const sum = raw.reduce((a, b) => a + b, 0);
      return raw.map((w) => w / sum);
    };

    const buttons = words.map((w, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "attn-word";
      b.textContent = w;
      b.addEventListener("mouseenter", () => select(i));
      b.addEventListener("focus", () => select(i));
      b.addEventListener("click", () => select(i));
      container.append(b);
      return b;
    });

    function select(src) {
      const weights = weightsFor(src);
      const max = Math.max(...weights);
      buttons.forEach((b, j) => {
        b.style.setProperty("--w", (weights[j] / max).toFixed(3));
        b.classList.toggle("is-source", j === src);
      });
      let best = -1;
      weights.forEach((w, j) => {
        if (j !== src && (best < 0 || w > weights[best])) best = j;
      });
      caption.innerHTML = `<strong>“${words[src]}”</strong> presta mais atenção em <em>“${words[best]}”</em> (${Math.round(weights[best] * 100)}%)`;
    }

    select(9); // estado inicial: “sobrecarregado” → “roteador”
  })();

  /* ---------- SLIDE 3: máscaras de atenção (bidirecional × causal) ---------- */
  document.querySelectorAll("[data-mask]").forEach((mask) => {
    const causal = mask.dataset.mask === "causal";
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const cell = document.createElement("span");
        if (!causal || c <= r) cell.className = "on";
        mask.append(cell);
      }
    }
  });

  /* =============================================================
     SLIDE 4 — Tokenização: palavras × subpalavras × caracteres
     (divisões e IDs fictícios, só para ilustrar)
  ============================================================= */
  (function tokenizationDemo() {
    const out = document.getElementById("tok-output");
    const status = document.getElementById("tok-status");
    const tabs = Array.from(document.querySelectorAll(".tok-tab"));
    if (!out || !tabs.length) return;

    const SENTENCE = "Minha VPN não conecta";
    const HUES = [215, 262, 160, 200, 330, 40, 280];

    // Cada modo: lista de [texto, id]
    const words = [["Minha", 104], ["VPN", 623], ["não", 871], ["conecta", 2093]];
    const subwords = [
      ["Min", 412], ["##ha", 87], ["V", 1190], ["##PN", 3342],
      ["não", 871], ["con", 255], ["##ecta", 4710],
    ];
    const charIds = { M: 44, i: 18, n: 25, h: 15, a: 10, V: 57, P: 49, N: 46, "ã": 91, o: 22, c: 12, e: 14, t: 27, " ": 3 };
    const chars = Array.from(SENTENCE).map((ch) => [ch, charIds[ch] ?? 0]);

    const MODES = {
      words:    { items: words,    unit: "palavras",    hint: "Vocabulário enorme; palavras novas viram [UNK]." },
      subwords: { items: subwords, unit: "subpalavras", hint: "## = continuação da palavra · equilíbrio usado por BPE/WordPiece." },
      chars:    { items: chars,    unit: "caracteres",  hint: "Sem desconhecidas, mas sequências longas · ␣ = espaço." },
    };

    function render(mode) {
      const { items, unit, hint } = MODES[mode];
      const compact = mode === "chars";
      out.innerHTML = "";

      items.forEach(([text, id], k) => {
        const isSpace = text === " ";
        const chip = document.createElement("div");
        chip.className = "tok-chip" + (compact ? " is-compact" : "") + (isSpace ? " is-space" : "");
        // No modo caracteres a cor vem do ID: mesma letra = mesma cor
        const hue = compact ? HUES[id % HUES.length] : HUES[k % HUES.length];
        chip.style.setProperty("--h", hue);
        chip.style.setProperty("--k", k);

        const t = document.createElement("span");
        t.className = "tok-chip-text";
        t.textContent = isSpace ? "␣" : text;

        const i = document.createElement("span");
        i.className = "tok-chip-id";
        i.textContent = compact ? String(id) : `ID ${id}`;

        chip.append(t, i);
        out.append(chip);
      });

      status.innerHTML = `<strong>${items.length} ${unit}</strong> ilustrativas · IDs fictícios · ${hint}`;
      tabs.forEach((b) => {
        const on = b.dataset.mode === mode;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
    }

    tabs.forEach((b) => b.addEventListener("click", () => render(b.dataset.mode)));
    render("words");
  })();

  /* =============================================================
     SLIDE 6 — Projeção 2D: destaca o grupo ao passar o mouse/foco
  ============================================================= */
  (function embeddingPlot() {
    const plot = document.getElementById("emb-plot");
    if (!plot) return;
    const pills = Array.from(plot.querySelectorAll(".emb-pill"));

    const light = (group) => {
      plot.classList.toggle("has-focus", !!group);
      pills.forEach((p) => p.classList.toggle("is-lit", !!group && p.dataset.group === group));
    };
    pills.forEach((p) => {
      p.addEventListener("mouseenter", () => light(p.dataset.group));
      p.addEventListener("focus", () => light(p.dataset.group));
      p.addEventListener("mouseleave", () => light(null));
      p.addEventListener("blur", () => light(null));
    });
  })();

  /* =============================================================
     SLIDE FINAL — Pipeline completo interativo (Open RAN / 5G)
     Input → Tokens → Embeddings → Bloco Transformer → Output
     (IDs, vetores e pesos fictícios, só para ilustrar)
  ============================================================= */
  (function pipelineDemo() {
    const stage = document.getElementById("pipe-stage");
    const caption = document.getElementById("pipe-caption");
    const prevB = document.getElementById("pipe-prev");
    const nextB = document.getElementById("pipe-next");
    const playB = document.getElementById("pipe-play");
    const stepBtns = Array.from(document.querySelectorAll(".pipe-step"));
    if (!stage) return;
    const slide = stage.closest(".slide");

    const WORDS = ["O", "xApp", "do", "RIC", "otimiza", "a", "célula"];
    const IDS = [41, 7312, 58, 9047, 2210, 29, 1583];
    const VEC = [[0.1, -0.2, 0.4], [0.7, 0.3, -0.5], [0.0, 0.1, 0.2], [0.8, 0.4, -0.3], [-0.3, 0.9, 0.5], [0.1, 0.0, 0.3], [0.6, -0.4, 0.7]];
    const HUES = [215, 262, 160, 200, 330, 40, 280];
    // Atenção causal: cada token só enxerga a si mesmo e os anteriores (cada linha soma 1)
    const ATT = [
      [1],
      [0.30, 0.70],
      [0.10, 0.60, 0.30],
      [0.05, 0.35, 0.15, 0.45],
      [0.04, 0.40, 0.04, 0.36, 0.16],
      [0.03, 0.15, 0.05, 0.12, 0.45, 0.20],
      [0.02, 0.18, 0.03, 0.22, 0.30, 0.05, 0.20],
    ];
    const OUT = [[" 5G", 0.42], [" rede", 0.24], [" RAN", 0.14], [" O-RAN", 0.08], ["(outros)", 0.12]];
    const CAPTIONS = [
      "<strong>Input:</strong> o texto entra como uma frase comum. Ainda não há números.",
      "<strong>Tokens:</strong> o tokenizador quebra o texto em pedaços e troca cada um por um ID do vocabulário.",
      "<strong>Embeddings:</strong> cada ID vira um vetor de números (significado + posição). É o que o modelo realmente processa.",
      "<strong>Bloco Transformer:</strong> a autoatenção traz contexto dos tokens anteriores; a FFN processa cada token e recupera o que o modelo aprendeu. O bloco se repete N vezes.",
      "<strong>Output:</strong> só o vetor do último token vai para a LM head, que dá uma probabilidade a cada token do vocabulário. A decodificação escolhe um e ele é anexado ao prompt.",
    ];
    const HEADS = ["1 Input", "2 Tokens", "3 Embedding vectors", "4 Bloco Transformer", "5 Output"];
    const fmt = (n) => (n < 0 ? "−" : "") + Math.abs(n).toFixed(1);

    let step = 0;
    let focus = WORDS.length - 1;
    let timer = null;

    stage.innerHTML = HEADS.map((t, i) => `<div class="pipe-col" data-col="${i}"><div class="pipe-head">${t}</div><div class="pipe-body"></div></div>`).join("");
    const bodies = Array.from(stage.querySelectorAll(".pipe-body"));
    const cols = Array.from(stage.querySelectorAll(".pipe-col"));

    function build() {
      const w = WORDS[focus];
      // 1 · Input
      bodies[0].innerHTML = `
        <div class="pipe-box"><p class="pipe-sentence">“O xApp do RIC otimiza a célula”</p></div>
        <p class="pipe-note">Contexto: Open RAN · rede 5G. Texto bruto (string).</p>`;

      // 2 · Tokens
      bodies[1].innerHTML = `<div class="pipe-toks">${WORDS.map((t, i) =>
        `<button type="button" class="pipe-tok${i === focus ? " is-focus" : ""}" style="--h:${HUES[i]}" data-focus="${i}"><b>${t}</b><small>ID ${IDS[i]}</small></button>`).join("")}</div>
        <p class="pipe-note">Clique em um token para acompanhá-lo nas próximas etapas. IDs fictícios.</p>`;

      // 3 · Embeddings
      bodies[2].innerHTML = `<div class="pipe-vecs">${WORDS.map((t, i) =>
        `<button type="button" class="pipe-vrow${i === focus ? " is-focus" : ""}" style="--h:${HUES[i]}" data-focus="${i}"><span class="w">${t}</span><code>[${VEC[i].map(fmt).join(", ")}, …]</code></button>`).join("")}</div>
        <p class="pipe-note">posição + significado → uma representação numérica</p>`;

      // 4 · Bloco Transformer
      const weights = ATT[focus];
      const max = Math.max(...weights);
      let best = -1;
      weights.forEach((x, j) => { if (j !== focus && (best < 0 || x > weights[best])) best = j; });
      const rows = WORDS.map((t, j) => {
        const masked = j > focus;
        const pct = masked ? 0 : (weights[j] / max) * 100;
        return `<button type="button" class="pipe-att${j === focus ? " is-focus" : ""}${masked ? " is-masked" : ""}" data-focus="${j}" title="${masked ? "Mascarado: o token ainda não existe" : ""}"><span class="k">${t}</span><span class="pipe-track"><i data-w="${pct}"></i></span><span class="pipe-v">${masked ? "—" : Math.round(weights[j] * 100) + "%"}</span></button>`;
      }).join("");
      const who = best < 0
        ? `“${w}” só enxerga a si mesmo`
        : `“${w}” presta mais atenção em “${WORDS[best]}” (${Math.round(weights[best] * 100)}%)`;
      bodies[3].innerHTML = `
        <div class="pipe-box">
          <h4>Autoatenção · token “${w}”</h4>
          <p class="pipe-flow">Q × Kᵀ → softmax → pesos</p>
          <div class="pipe-bars">${rows}</div>
          <p class="pipe-flow">${who}</p>
          <p class="pipe-flow">↓ soma ponderada dos V → vetor com contexto</p>
        </div>
        <div class="pipe-box pipe-box--ffn">
          <h4>Feed-forward (FFN)</h4>
          <p class="pipe-note">Processa o vetor de “${w}” sozinho e recupera o que foi aprendido no treino (ex.: xApps rodam no near-RT RIC de uma rede Open RAN).</p>
        </div>
        <span class="pipe-times">× N blocos</span>`;

      // 5 · Output
      bodies[4].innerHTML = `
        <div class="pipe-box">
          <h4>LM head · próximo token</h4>
          <div class="pipe-bars">${OUT.map(([t, p], i) =>
            `<div class="pipe-out${i === 0 ? " is-chosen" : ""}"><span class="k">${t}</span><span class="pipe-track"><i data-w="${(p / OUT[0][1]) * 100}"></i></span><span class="pipe-v">${Math.round(p * 100)}%</span></div>`).join("")}</div>
          <p class="pipe-flow">decodificação (greedy) escolhe <span class="pipe-next-tok">“5G”</span></p>
        </div>
        <div class="pipe-result">Resultado: “O xApp do RIC otimiza a célula <strong>5G</strong>”</div>
        <p class="pipe-note">O token é anexado ao prompt e o ciclo recomeça.</p>`;
      applyBars();
    }

    function applyBars() {
      stage.querySelectorAll(".pipe-track i").forEach((el) => {
        const col = el.closest(".pipe-col");
        el.style.width = col && col.classList.contains("is-on") ? el.dataset.w + "%" : "0%";
      });
    }

    function render() {
      cols.forEach((c, i) => {
        c.classList.toggle("is-on", i <= step);
        c.classList.toggle("is-current", i === step);
      });
      stepBtns.forEach((b, i) => {
        b.classList.toggle("is-done", i < step);
        b.classList.toggle("is-current", i === step);
        if (i === step) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
      });
      caption.innerHTML = CAPTIONS[step];
      prevB.disabled = step === 0;
      nextB.disabled = step === HEADS.length - 1;
      requestAnimationFrame(() => requestAnimationFrame(applyBars));
    }

    function setStep(n) { step = Math.max(0, Math.min(HEADS.length - 1, n)); render(); }
    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
      playB.textContent = "▶ Animar";
    }
    function play() {
      stop();
      if (step >= HEADS.length - 1) setStep(0);
      playB.textContent = "⏸ Pausar";
      timer = setInterval(() => {
        if (!slide.classList.contains("is-active")) return stop();
        if (step >= HEADS.length - 1) return stop();
        setStep(step + 1);
        if (step >= HEADS.length - 1) stop();
      }, 2600);
    }

    stage.addEventListener("click", (e) => {
      const t = e.target.closest("[data-focus]");
      if (!t) return;
      focus = Number(t.dataset.focus);
      build();
      render();
    });
    stepBtns.forEach((b, i) => b.addEventListener("click", () => { stop(); setStep(i); }));
    prevB.addEventListener("click", () => { stop(); setStep(step - 1); });
    nextB.addEventListener("click", () => { stop(); setStep(step + 1); });
    playB.addEventListener("click", () => (timer ? stop() : play()));

    build();
    render();
  })();

  /* ---------- Inicialização ---------- */
  go(fromHash());
})();
