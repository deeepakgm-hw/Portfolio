/**
 * Three.js 3D Extruded Wordmark Hero Visual
 * Renders bold, deep-extruded 3D letterforms ("DEEPAK GM") in signature violet
 * with subtle ember-colored rim and edge lighting.
 * 
 * Features:
 * - Idle undulating rotation and pointer-responsive tilt (contact sheet orbit pattern)
 * - Violet front & side materials with ember-colored specular and rim edge lighting
 * - Subtle ember wireframe bevel accents outlining architectural letterform edges
 * - Singularity bloom entrance animation coordinated with the loader curtain
 * - Mobile-optimized geometry detail, capped DPR, and off-screen pause via IntersectionObserver
 */

let triggerEntranceFn = null;
let entranceTriggered = false;

export function triggerCanvas3DEntrance() {
  entranceTriggered = true;
  if (typeof triggerEntranceFn === 'function') {
    triggerEntranceFn();
  }
}

export function initCanvas3D() {
  const canvas = document.getElementById('hero-canvas');
  const heroSection = document.getElementById('hero');
  if (!canvas || !window.THREE) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Scene & Camera setup
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 7.2);

  const isMobileInitial = window.innerWidth <= 768;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: !isMobileInitial,
    powerPreference: 'high-performance'
  });

  function updatePixelRatio() {
    const isMobile = window.innerWidth <= 768;
    renderer.setPixelRatio(isMobile ? 1.0 : Math.min(window.devicePixelRatio || 1, 1.75));
  }
  updatePixelRatio();
  renderer.setSize(window.innerWidth, window.innerHeight);

  // --- Lighting Architecture (Violet Body + Ember Edge Lighting) ---
  // 1. Ambient Light with deep charcoal-violet hue
  const ambientLight = new THREE.AmbientLight(0x1F1A26, 1.4);
  scene.add(ambientLight);

  // 2. Key Directional Light: Soft violet fill illuminating front letter faces
  const keyLight = new THREE.DirectionalLight(0x9E90FF, 1.8);
  keyLight.position.set(-3.5, 4.0, 5.0);
  scene.add(keyLight);

  // 3. Ember Rim Light 1: Sharp grazing edge light from upper-right rear (#B8451F)
  const emberRimLight1 = new THREE.DirectionalLight(0xB8451F, 3.8);
  emberRimLight1.position.set(5.5, 2.5, -2.5);
  scene.add(emberRimLight1);

  // 4. Ember Rim Light 2: Warm grazing fill from bottom-left rear (#B8451F)
  const emberRimLight2 = new THREE.PointLight(0xB8451F, 2.6, 18);
  emberRimLight2.position.set(-2.0, -3.5, -1.8);
  scene.add(emberRimLight2);

  // --- Materials ---
  // Front face material: Signature violet (#6C5CE7) with specular gloss
  const matFront = new THREE.MeshStandardMaterial({
    color: 0x6C5CE7,
    roughness: 0.22,
    metalness: 0.35,
    flatShading: false
  });

  // Side & extrusion material: Deep dimensional violet with slightly lower metalness
  const matSide = new THREE.MeshStandardMaterial({
    color: 0x5444CD,
    roughness: 0.38,
    metalness: 0.28,
    flatShading: false
  });

  // Subtle ember-colored bevel edge highlight line material
  const matEdges = new THREE.LineBasicMaterial({
    color: 0xB8451F,
    transparent: true,
    opacity: 0.42
  });

  // Main group containing the 3D wordmark
  const wordmarkGroup = new THREE.Group();
  scene.add(wordmarkGroup);

  // Positioning & responsive bounds parameters
  let targetBaseX = 1.8;
  let targetBaseY = 0.05;
  let targetBaseZ = 0.0;
  let targetBaseScale = 0.88;

  function updateResponsiveBounds() {
    const width = window.innerWidth;
    camera.aspect = width / window.innerHeight;
    camera.updateProjectionMatrix();
    updatePixelRatio();
    renderer.setSize(width, window.innerHeight);

    if (width <= 480) {
      // Small mobile: elegant architectural header above status bar
      targetBaseX = 0.0;
      targetBaseY = 2.22;
      targetBaseZ = -1.0;
      targetBaseScale = 0.22;
    } else if (width <= 768) {
      // Tablet portrait: positioned in right zone intersecting display headline
      targetBaseX = 0.75;
      targetBaseY = 0.05;
      targetBaseZ = -0.8;
      targetBaseScale = 0.36;
    } else if (width <= 1100) {
      // Small desktop / laptop
      targetBaseX = 1.15;
      targetBaseY = 0.15;
      targetBaseZ = -0.4;
      targetBaseScale = 0.64;
    } else {
      // Large Desktop (>1100px): Dominant architectural centerpiece intersecting headline
      targetBaseX = 1.45;
      targetBaseY = 0.08;
      targetBaseZ = 0.0;
      targetBaseScale = 0.80;
    }

    if (!isEntrancing) {
      wordmarkGroup.scale.setScalar(targetBaseScale);
    }
  }

  // Entrance animation state
  let isEntrancing = !reduced;
  let entranceScale = reduced ? 1.0 : 0.001;
  let entranceSpin = reduced ? 0 : 0.12;

  updateResponsiveBounds();
  window.addEventListener('resize', updateResponsiveBounds);

  wordmarkGroup.scale.setScalar(entranceScale * targetBaseScale);

  // --- Load Three.js Typeface Font & Build Extruded 3D Wordmark ---
  let isFontLoaded = false;
  const fontLoader = new THREE.FontLoader();

  fontLoader.load(
    '/fonts/helvetiker_bold.typeface.json',
    (font) => {
      buildWordmark(font);
      isFontLoaded = true;

      // If entrance was already triggered before font finished loading, run it now
      if (entranceTriggered) {
        triggerEntrance();
      }
    },
    undefined,
    (err) => {
      console.warn('Three.js FontLoader failed to load local font, attempting fallback:', err);
      setupFallbackText();
    }
  );

  function buildWordmark(font) {
    const isMobile = window.innerWidth <= 768;

    // Extrusion parameters tuned for bold, deep-extruded letterforms
    const textOptions = {
      font: font,
      size: 1.15,
      height: isMobile ? 0.28 : 0.44, // Deep dimensional extrusion
      curveSegments: isMobile ? 3 : 5,
      bevelEnabled: true,
      bevelThickness: isMobile ? 0.03 : 0.055,
      bevelSize: isMobile ? 0.015 : 0.03,
      bevelOffset: 0,
      bevelSegments: isMobile ? 1 : 3
    };

    // Construct Line 1 ("DEEPAK")
    const geo1 = new THREE.TextGeometry('DEEPAK', textOptions);
    geo1.computeBoundingBox();
    const width1 = geo1.boundingBox.max.x - geo1.boundingBox.min.x;
    const height1 = geo1.boundingBox.max.y - geo1.boundingBox.min.y;

    // Construct Line 2 ("GM")
    const geo2 = new THREE.TextGeometry('GM', textOptions);
    geo2.computeBoundingBox();
    const width2 = geo2.boundingBox.max.x - geo2.boundingBox.min.x;
    const height2 = geo2.boundingBox.max.y - geo2.boundingBox.min.y;

    const materials = [matFront, matSide];

    // Center each line horizontally within the group
    const mesh1 = new THREE.Mesh(geo1, materials);
    mesh1.position.set(-width1 / 2, 0.45, 0);

    const mesh2 = new THREE.Mesh(geo2, materials);
    mesh2.position.set(-width2 / 2, -1.05, 0);

    // Subtle ember wireframe edge outlines for architectural precision
    const edges1 = new THREE.EdgesGeometry(geo1, 26);
    const lineMesh1 = new THREE.LineSegments(edges1, matEdges);
    lineMesh1.position.copy(mesh1.position);

    const edges2 = new THREE.EdgesGeometry(geo2, 26);
    const lineMesh2 = new THREE.LineSegments(edges2, matEdges);
    lineMesh2.position.copy(mesh2.position);

    wordmarkGroup.add(mesh1);
    wordmarkGroup.add(mesh2);
    wordmarkGroup.add(lineMesh1);
    wordmarkGroup.add(lineMesh2);

    renderFrame();
  }

  // Graceful CSS-only fallback if WebGL text fails
  function setupFallbackText() {
    const heroInner = document.querySelector('.hero-inner');
    if (!heroInner) return;
    let fallbackEl = document.getElementById('hero-3d-fallback');
    if (!fallbackEl) {
      fallbackEl = document.createElement('div');
      fallbackEl.id = 'hero-3d-fallback';
      fallbackEl.className = 'hero-wordmark-fallback';
      fallbackEl.innerHTML = '<span>DEEPAK</span><span>GM</span>';
      heroInner.appendChild(fallbackEl);
    }
  }

  // --- Entrance Bloom Trigger ---
  function triggerEntrance() {
    if (reduced) return;
    isEntrancing = true;

    if (window.gsap) {
      const animObj = { scale: 0.001, spin: 0.16, opacity: 0.0 };
      gsap.to(animObj, {
        scale: 1.0,
        spin: 0.0,
        opacity: 1.0,
        duration: 1.85,
        ease: 'power4.out',
        onUpdate: () => {
          wordmarkGroup.scale.setScalar(animObj.scale * targetBaseScale);
          entranceSpin = animObj.spin;
        },
        onComplete: () => {
          isEntrancing = false;
        }
      });
    } else {
      wordmarkGroup.scale.setScalar(targetBaseScale);
      isEntrancing = false;
    }
  }

  triggerEntranceFn = () => {
    if (isFontLoaded) {
      triggerEntrance();
    }
  };

  // --- Pointer Interaction (Contact Sheet Orbit Pattern) ---
  let targetMouseX = 0;
  let targetMouseY = 0;
  let currentMouseX = 0;
  let currentMouseY = 0;

  if (!reduced) {
    window.addEventListener('mousemove', (e) => {
      targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
      targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) {
        targetMouseX = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
        targetMouseY = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
      }
    }, { passive: true });
  }

  // --- Render & Animation Loop ---
  let animFrameId = null;
  let isHeroVisible = true;
  const clock = new THREE.Clock();

  function renderFrame() {
    renderer.render(scene, camera);
  }

  if (reduced) {
    wordmarkGroup.position.set(targetBaseX, targetBaseY, targetBaseZ);
    wordmarkGroup.rotation.set(-0.06, 0.18, 0.02);
    renderFrame();
    return () => {
      window.removeEventListener('resize', updateResponsiveBounds);
      renderer.dispose();
    };
  }

  function animate() {
    if (!isHeroVisible) {
      animFrameId = null;
      return; // Suspend render loop when offscreen
    }

    animFrameId = requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();
    const isMobile = window.innerWidth <= 768;

    // Smooth damping on pointer coordinates
    currentMouseX += (targetMouseX - currentMouseX) * 0.048;
    currentMouseY += (targetMouseY - currentMouseY) * 0.048;

    // Idle undulating rotation
    const idleRotX = Math.sin(elapsedTime * 0.65) * 0.06;
    const idleRotY = Math.cos(elapsedTime * 0.45) * 0.09;

    // Pointer-responsive tilt (orbits toward the cursor like a 3D contact sheet)
    const tiltX = -currentMouseY * 0.38;
    const tiltY = currentMouseX * 0.48;
    const tiltZ = -currentMouseX * 0.08;

    // Uncoiling spin during entrance
    const spinFactor = entranceSpin * 0.5;

    // Scroll linkage: subtle recession on desktop, disabled on mobile for performance
    const scrollT = isMobile ? 0 : Math.min(window.scrollY / window.innerHeight, 1.2);

    // Apply rotations
    wordmarkGroup.rotation.x = idleRotX + tiltX + spinFactor;
    wordmarkGroup.rotation.y = idleRotY + tiltY + spinFactor * 2.0;
    wordmarkGroup.rotation.z = tiltZ;

    // Apply positions
    wordmarkGroup.position.x = targetBaseX + currentMouseX * 0.32;
    wordmarkGroup.position.y = targetBaseY - scrollT * 1.35 + currentMouseY * 0.22;
    wordmarkGroup.position.z = targetBaseZ - scrollT * 1.0;

    // Dynamic ember rim light tracking: slightly orbits opposite cursor to accentuate edge glints
    emberRimLight1.position.x = 5.5 - currentMouseX * 1.2;
    emberRimLight1.position.y = 2.5 - currentMouseY * 1.0;

    renderFrame();
  }

  // --- Offscreen Viewport Observer (Zero GPU/CPU cost when scrolled away) ---
  if ('IntersectionObserver' in window && heroSection) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isHeroVisible = entry.isIntersecting;
        if (isHeroVisible && !animFrameId && !reduced) {
          clock.start();
          animate();
        }
      });
    }, { threshold: 0.02 });

    observer.observe(heroSection);
  }

  animate();

  return () => {
    window.removeEventListener('resize', updateResponsiveBounds);
    if (animFrameId) cancelAnimationFrame(animFrameId);
    renderer.dispose();
  };
}
