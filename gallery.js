/* ============================================================
   Sinextesia — 3D Spiral Gallery
   Three.js · vanilla · parallax mouse · spiral↔grid lerp · lightbox
   ============================================================ */
(function () {
  "use strict";

  // ---- tweakable state (TWEAK_DEFAULTS comes from index.html) ----
  const state = Object.assign({}, window.TWEAK_DEFAULTS || {
    accent: "#e94560",
    view: "spiral",
    float: 0.6,
    density: 30,
    paper: "cream"
  });

  // applied accent — also drive CSS
  function applyAccent(hex) {
    state.accent = hex;
    document.documentElement.style.setProperty("--accent", hex);
    const v = document.getElementById("twAccentVal"); if (v) v.textContent = hex;
    document.querySelectorAll("#twAccent .tw-swatch").forEach(b => {
      b.classList.toggle("is-active", b.dataset.color.toLowerCase() === hex.toLowerCase());
    });
    rebuild(); // re-render textures with new accent
  }

  function applyPaper(p) {
    state.paper = p;
    const v = document.getElementById("twPaperVal"); if (v) v.textContent = p;
    document.querySelectorAll("#twPaper button").forEach(b => {
      b.classList.toggle("is-active", b.dataset.paper === p);
    });
    rebuild();
  }

  // ---- Three.js setup -------------------------------------------------
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x080808, 8, 28);
  const FOG_NEAR = { spiral: 8,  grid: 30 };
  const FOG_FAR  = { spiral: 28, grid: 120 };
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x080808, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(renderer.domElement);
  renderer.domElement.style.position = "fixed";
  renderer.domElement.style.inset = "0";
  renderer.domElement.style.zIndex = "1";

  const camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 0, 12);
  camera.lookAt(0, 0, 0);

  // soft directional + ambient (cards have unlit material since textures encode tone)
  scene.add(new THREE.AmbientLight(0xffffff, 1.0));

  // ---- group containing all cards
  const group = new THREE.Group();
  scene.add(group);

  // ---- cards ----------------------------------------------------------
  // Each card: Mesh w/ PlaneGeometry, with both a "spiralPos/rot" and a "gridPos/rot" target.
  const cards = [];
  const cardW = 1.4;
  const cardH = 2.1;
  const cardGeom = new THREE.PlaneGeometry(cardW, cardH, 1, 1);

  function disposeCards() {
    for (const c of cards) {
      if (c.mesh) {
        group.remove(c.mesh);
        c.mesh.geometry.dispose?.();
        c.mesh.material.map?.dispose?.();
        c.mesh.material.dispose?.();
      }
    }
    cards.length = 0;
  }

  function makeTexture(canvas) {
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy?.() || 4;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;
    return tex;
  }

  function spiralTargetsFor(n) {
    // vertical spiral
    const out = [];
    const radius = 4.6;
    const perTurn = 7;       // cards per revolution
    const stepY = 0.62;       // vertical step per card
    const totalH = (n - 1) * stepY;
    const startY = -totalH / 2;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1 || 1);
      const angle = (i / perTurn) * Math.PI * 2 + Math.PI / 6;
      // slight radius modulation so cards don't strictly tile
      const r = radius + Math.sin(i * 0.7) * 0.25 + Math.cos(i * 0.31) * 0.18;
      const x = Math.cos(angle) * r;
      const y = startY + i * stepY;
      const z = Math.sin(angle) * r;
      // face roughly outward, but only partially — keep readable from cam
      const lookAtAngle = angle + Math.PI; // facing outwards (away from axis)
      // we want them to face SLIGHTLY toward the camera axis; soften the outward yaw
      const rotY = -angle + Math.PI / 2; // try facing tangentially
      // small wobble for character
      const rotZ = Math.sin(i * 1.7) * 0.08;
      const rotX = Math.cos(i * 1.3) * 0.06;
      out.push({ pos: new THREE.Vector3(x, y, z), rot: new THREE.Euler(rotX, rotY, rotZ) });
    }
    return out;
  }

  function gridTargetsFor(n) {
    // arrange in a flat grid facing camera
    const cols = Math.ceil(Math.sqrt(n * 1.8));
    const rows = Math.ceil(n / cols);
    const gx = cardW + 0.45;
    const gy = cardH + 0.45;
    const offsetX = (cols - 1) / 2;
    const offsetY = (rows - 1) / 2;
    const out = [];
    for (let i = 0; i < n; i++) {
      const cx = i % cols;
      const cy = Math.floor(i / cols);
      const x = (cx - offsetX) * gx;
      const y = -(cy - offsetY) * gy;
      const z = 0;
      out.push({ pos: new THREE.Vector3(x, y, z), rot: new THREE.Euler(0, 0, 0) });
    }
    return out;
  }

  function gridCameraZFor(n) {
    // zoom out enough to see the whole grid
    const cols = Math.ceil(Math.sqrt(n * 1.8));
    const rows = Math.ceil(n / cols);
    const gridW = cols * (cardW + 0.45);
    const gridH = rows * (cardH + 0.45);
    const fovRad = (camera.fov * Math.PI) / 180;
    const distH = (gridH / 2) / Math.tan(fovRad / 2);
    const distW = (gridW / 2) / Math.tan(fovRad / 2) / camera.aspect;
    // tighter margin + slight overshoot toward camera so back cards stay inside the fog-free zone
    return Math.max(distH, distW) * 1.05 + 1.4;
  }

  function rebuild() {
    disposeCards();
    const n = Math.max(8, Math.min(48, state.density | 0));
    const spirals = spiralTargetsFor(n);
    const grids = gridTargetsFor(n);
    for (let i = 0; i < n; i++) {
      const flash = window.SX_FLASH.build({ index: i, total: n, paper: state.paper, accent: state.accent });
      const tex = makeTexture(flash.canvas);
      const mat = new THREE.MeshBasicMaterial({
        map: tex, transparent: false, side: THREE.DoubleSide, toneMapped: false
      });
      const mesh = new THREE.Mesh(cardGeom, mat);
      mesh.userData.index = i;
      group.add(mesh);
      cards.push({
        mesh,
        meta: flash.meta,
        item: flash.item,
        spiral: spirals[i],
        grid: grids[i],
        // small static random offsets for sine bob
        bobPhase: Math.random() * Math.PI * 2,
        bobAmp: 0.06 + Math.random() * 0.06,
        rotPhase: Math.random() * Math.PI * 2
      });
    }
    refreshHud();
  }

  // ---- view interpolation ---------------------------------------------
  // viewProgress: 0 = full spiral, 1 = full grid
  const view = {
    target: state.view === "grid" ? 1 : 0,
    current: state.view === "grid" ? 1 : 0
  };

  function setView(name) {
    state.view = name;
    view.target = name === "grid" ? 1 : 0;
    // sync toggles
    document.querySelectorAll("#viewToggle button").forEach(b => {
      b.classList.toggle("is-active", b.dataset.view === name);
    });
    document.querySelectorAll("#twView button").forEach(b => {
      b.classList.toggle("is-active", b.dataset.view === name);
    });
    const v = document.getElementById("twViewVal"); if (v) v.textContent = name;
  }

  // ---- mouse parallax & drag -----------------------------------------
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  const drag = { active: false, startX: 0, startY: 0, scrollVel: 0, scroll: 0 };
  const ROT_VEL = { v: 0 };
  // spiral rotation about Y, also scroll thru it
  let spiralYRot = 0;
  let spiralYRotTarget = 0;
  let manualYOffset = 0; // user-driven yaw via drag/scroll

  function onPointerMove(e) {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = (e.clientY / window.innerHeight) * 2 - 1;
    mouse.tx = x; mouse.ty = y;

    if (drag.active) {
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      manualYOffset = drag.startYaw + dx * 0.0055;
      verticalOffset = drag.startVOff + dy * 0.012;
    }
  }
  function onPointerDown(e) {
    drag.active = true;
    drag.startX = e.clientX; drag.startY = e.clientY;
    drag.startYaw = manualYOffset;
    drag.startVOff = verticalOffset;
    document.body.classList.add("is-dragging");
  }
  function onPointerUp() {
    drag.active = false;
    document.body.classList.remove("is-dragging");
  }
  let verticalOffset = 0;
  function onWheel(e) {
    // scroll = rotate spiral; in grid, scroll = pan vertically
    if (view.current < 0.5) {
      manualYOffset += e.deltaY * 0.0028;
    } else {
      verticalOffset += e.deltaY * 0.012;
    }
    e.preventDefault();
  }

  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
  window.addEventListener("wheel", onWheel, { passive: false });

  // ---- raycast for hover/click ---------------------------------------
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let hovered = null;

  function pickCard(clientX, clientY) {
    ndc.x = (clientX / window.innerWidth) * 2 - 1;
    ndc.y = -(clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(cards.map(c => c.mesh), false);
    return hits[0]?.object || null;
  }

  function onClick(e) {
    // only if not dragging substantially
    const moved = Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY);
    if (moved > 8) return;
    const m = pickCard(e.clientX, e.clientY);
    if (m) openLightbox(m.userData.index);
  }
  renderer.domElement.addEventListener("click", onClick);

  // ---- animation loop ------------------------------------------------
  const tmpV = new THREE.Vector3();
  const tmpE = new THREE.Euler();
  const clock = new THREE.Clock();

  function lerp(a, b, t) { return a + (b - a) * t; }
  function dampTo(current, target, lambda, dt) {
    return current + (target - current) * (1 - Math.exp(-lambda * dt));
  }

  function tick() {
    const dt = Math.min(0.05, clock.getDelta());
    const t = clock.elapsedTime;

    // smooth mouse
    mouse.x = dampTo(mouse.x, mouse.tx, 5, dt);
    mouse.y = dampTo(mouse.y, mouse.ty, 5, dt);

    // smooth view progress
    view.current = dampTo(view.current, view.target, 5, dt);

    // fog scales with view — grid needs much wider fog range so far cards don't fade to black
    scene.fog.near = lerp(FOG_NEAR.spiral, FOG_NEAR.grid, view.current);
    scene.fog.far  = lerp(FOG_FAR.spiral,  FOG_FAR.grid,  view.current);

    // camera target — in spiral, sits inside the structure; in grid, pulled back
    const gridCamZ = gridCameraZFor(cards.length);
    const camTargetZ = lerp(12, gridCamZ, view.current);
    // parallax shifts
    const parallaxX = mouse.x * 1.1 * (1 - view.current * 0.4);
    const parallaxY = -mouse.y * 0.7 * (1 - view.current * 0.4);
    camera.position.x = dampTo(camera.position.x, parallaxX, 4, dt);
    camera.position.y = dampTo(camera.position.y, parallaxY, 4, dt);
    camera.position.z = dampTo(camera.position.z, camTargetZ, 4, dt);
    camera.lookAt(0, 0, 0);

    // group yaw — auto-spin in spiral when not dragging, manual via drag/scroll
    if (view.current < 0.5 && !drag.active) {
      spiralYRotTarget += dt * 0.06; // slow drift
    }
    const finalYaw = spiralYRotTarget * (1 - view.current) + manualYOffset;
    group.rotation.y = dampTo(group.rotation.y, finalYaw, 4, dt);

    // vertical pan in grid
    const groupYTarget = -verticalOffset * (view.current);
    group.position.y = dampTo(group.position.y, groupYTarget, 4, dt);

    // per-card pose interpolation
    for (let i = 0; i < cards.length; i++) {
      const c = cards[i];
      const m = c.mesh;
      const sp = c.spiral, gp = c.grid;
      // base position lerp
      tmpV.copy(sp.pos).lerp(gp.pos, view.current);
      // sinusoidal float — Y axis only, intensity scales with float tweak, weaker in grid
      const bob = Math.sin(t * 0.9 + c.bobPhase) * c.bobAmp * state.float * (1 - view.current * 0.6);
      m.position.set(tmpV.x, tmpV.y + bob, tmpV.z);
      // rotation lerp
      const rxA = sp.rot.x + Math.sin(t * 0.6 + c.rotPhase) * 0.04 * state.float;
      const ryA = sp.rot.y + Math.cos(t * 0.5 + c.rotPhase) * 0.04 * state.float;
      const rzA = sp.rot.z;
      m.rotation.x = lerp(rxA, gp.rot.x, view.current);
      m.rotation.y = lerp(ryA, gp.rot.y, view.current);
      m.rotation.z = lerp(rzA, gp.rot.z, view.current);
      // hover scale
      const isHover = hovered === m;
      const scaleTarget = isHover ? 1.05 : 1.0;
      m.scale.x = dampTo(m.scale.x, scaleTarget, 6, dt);
      m.scale.y = dampTo(m.scale.y, scaleTarget, 6, dt);
    }

    // hover ray (pointer cursor + scale)
    if (!drag.active) {
      ndc.x = mouse.tx; ndc.y = -mouse.ty;
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(cards.map(c => c.mesh), false);
      const newHover = hits[0]?.object || null;
      if (newHover !== hovered) {
        hovered = newHover;
        document.body.classList.toggle("is-hover-card", !!hovered);
        if (hovered) updateHudFor(hovered.userData.index);
      }
    }

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }

  // ---- HUD ------------------------------------------------------------
  function updateHudFor(i) {
    const c = cards[i]; if (!c) return;
    document.getElementById("hudNow").textContent = String(i + 1).padStart(2, "0");
  }
  function refreshHud() {
    if (cards.length) updateHudFor(0);
  }

  // ---- LIGHTBOX -------------------------------------------------------
  const lb = {
    el: document.getElementById("lightbox"),
    img: document.getElementById("lbImg"),
    idx: document.getElementById("lbIdx"),
    title: document.getElementById("lbTitle"),
    headline: document.getElementById("lbHeadline"),
    style: document.getElementById("lbStyle"),
    artist: document.getElementById("lbArtist"),
    size: document.getElementById("lbSize"),
    session: document.getElementById("lbSession"),
    avail: document.getElementById("lbAvail"),
    styleTag: document.getElementById("lbStyleTag"),
    cta: document.getElementById("lbCta"),
    desc: document.getElementById("lbDesc"),
    current: -1
  };

  const DESC_LIB = [
    "Línea fina sobre piel limpia. Boceto enviado por mail antes de la cita; sesión reservada cuando estés listo.",
    "Pieza diseñada a medida. Cada elemento puede reescalarse para ajustarse a la anatomía del cliente.",
    "Trabajo de varias sesiones. Cuidado posterior pautado por el estudio — sin tinta industrial.",
    "Tinta vegana, agujas de un solo uso, esterilización clínica. Cita previa con depósito reembolsable.",
    "Diseño exclusivo del estudio: una vez tatuado, retiramos la pieza del catálogo."
  ];

  function openLightbox(i) {
    const c = cards[i]; if (!c) return;
    lb.current = i;
    lb.img.src = c.mesh.material.map.source.data.toDataURL("image/png");
    lb.idx.textContent = `N° ${String(i + 1).padStart(2, "0")} / ${String(cards.length).padStart(2, "0")}`;
    lb.title.textContent = c.item.title;
    lb.headline.innerHTML = c.item.title.split(" ").map((w, k) =>
      k === 1 ? `<span class="ink-accent">·</span> ${w}` : w
    ).join(" ");
    lb.style.textContent = c.item.style;
    lb.artist.textContent = c.item.artist;
    lb.size.textContent = c.item.size;
    lb.session.textContent = c.item.session;
    lb.avail.textContent = (i % 4 === 0) ? "Reservada · esperando piel" : "Sí · cita Q3 2026";
    lb.styleTag.textContent = `${c.item.style.split(" · ")[0]} · ${c.item.year}`;
    lb.desc.textContent = DESC_LIB[i % DESC_LIB.length];
    lb.cta.href = `mailto:hola@sinestesia.studio?subject=${encodeURIComponent("Reserva — " + c.item.title)}&body=${encodeURIComponent("Hola, me interesa la pieza " + c.item.title + " (N° " + String(i+1).padStart(2,"0") + "). ¿Cuándo podríamos vernos?")}`;
    lb.el.classList.add("is-open");
    lb.el.setAttribute("aria-hidden", "false");
  }
  function closeLightbox() {
    lb.el.classList.remove("is-open");
    lb.el.setAttribute("aria-hidden", "true");
    lb.current = -1;
  }
  function nextLightbox(dir) {
    if (lb.current < 0) return;
    const n = cards.length;
    openLightbox((lb.current + dir + n) % n);
  }

  document.getElementById("lbClose").addEventListener("click", closeLightbox);
  document.getElementById("lbPrev").addEventListener("click", () => nextLightbox(-1));
  document.getElementById("lbNext").addEventListener("click", () => nextLightbox(+1));
  lb.el.addEventListener("click", (e) => { if (e.target === lb.el) closeLightbox(); });
  window.addEventListener("keydown", (e) => {
    if (lb.el.classList.contains("is-open")) {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") nextLightbox(-1);
      else if (e.key === "ArrowRight") nextLightbox(+1);
    } else {
      if (e.key === "g") setView("grid");
      else if (e.key === "s") setView("spiral");
    }
  });

  // ---- view toggle wiring --------------------------------------------
  document.querySelectorAll("#viewToggle button").forEach(b => {
    b.addEventListener("click", () => setView(b.dataset.view));
  });

  // ---- resize ---------------------------------------------------------
  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener("resize", onResize);

  // ---- TWEAKS PANEL (vanilla + host edit-mode protocol) --------------
  const tweaks = document.getElementById("tweaks");
  function setTweakOpen(open) {
    tweaks.classList.toggle("is-open", open);
    tweaks.setAttribute("aria-hidden", String(!open));
  }
  document.getElementById("tweaksClose").addEventListener("click", () => {
    setTweakOpen(false);
    window.parent.postMessage({ type: "__edit_mode_dismissed" }, "*");
  });

  // persist a partial set of tweaks
  function persist(edits) {
    window.parent.postMessage({ type: "__edit_mode_set_keys", edits }, "*");
  }

  // accent swatches
  document.querySelectorAll("#twAccent .tw-swatch").forEach(b => {
    b.addEventListener("click", () => {
      applyAccent(b.dataset.color);
      persist({ accent: b.dataset.color });
    });
  });

  // view toggle (in tweaks)
  document.querySelectorAll("#twView button").forEach(b => {
    b.addEventListener("click", () => {
      setView(b.dataset.view);
      persist({ view: b.dataset.view });
    });
  });

  // paper toggle
  document.querySelectorAll("#twPaper button").forEach(b => {
    b.addEventListener("click", () => {
      applyPaper(b.dataset.paper);
      persist({ paper: b.dataset.paper });
    });
  });

  // float slider
  const twFloat = document.getElementById("twFloat");
  const twFloatVal = document.getElementById("twFloatVal");
  twFloat.value = state.float;
  twFloatVal.textContent = Number(state.float).toFixed(2);
  twFloat.addEventListener("input", () => {
    state.float = parseFloat(twFloat.value);
    twFloatVal.textContent = state.float.toFixed(2);
  });
  twFloat.addEventListener("change", () => persist({ float: state.float }));

  // density slider
  const twDensity = document.getElementById("twDensity");
  const twDensityVal = document.getElementById("twDensityVal");
  twDensity.value = state.density;
  twDensityVal.textContent = `${state.density} pieces`;
  let densityRebuildT = null;
  twDensity.addEventListener("input", () => {
    state.density = parseInt(twDensity.value, 10);
    twDensityVal.textContent = `${state.density} pieces`;
    if (densityRebuildT) clearTimeout(densityRebuildT);
    densityRebuildT = setTimeout(rebuild, 80);
  });
  twDensity.addEventListener("change", () => persist({ density: state.density }));

  // initial UI sync
  applyAccent(state.accent);
  applyPaper(state.paper);
  document.getElementById("twAccentVal").textContent = state.accent;

  // ---- host edit-mode protocol ---------------------------------------
  window.addEventListener("message", (e) => {
    const d = e.data || {};
    if (d.type === "__activate_edit_mode") setTweakOpen(true);
    if (d.type === "__deactivate_edit_mode") setTweakOpen(false);
  });
  // announce that this design has a tweaks panel
  setTimeout(() => {
    window.parent.postMessage({ type: "__edit_mode_available" }, "*");
  }, 50);

  // ---- build + start --------------------------------------------------
  rebuild();
  setView(state.view);
  tick();

  // dismiss loader once first frame is up
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const ld = document.getElementById("loader");
      if (ld) {
        ld.classList.add("is-gone");
        setTimeout(() => ld.remove(), 800);
      }
    });
  });
})();
