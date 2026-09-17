/**
 * Three.js 3D Wireframe Centerpiece (Cinematic Anchor)
 * Sized as a prominent visual focal object that physically intersects with the headline.
 * Features an uncoiling singularity bloom entrance animation timed with the loader curtain lift.
 */
let triggerEntranceFn = null;

export function triggerCanvas3DEntrance() {
  if (typeof triggerEntranceFn === 'function') {
    triggerEntranceFn();
  }
}

export function initCanvas3D() {
  const canvas = document.getElementById('hero-canvas');
  const heroSection = document.getElementById('hero');
  if (!canvas || !window.THREE) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 6;

  const isMobileInitial = window.innerWidth <= 768;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: !isMobileInitial,
    powerPreference: 'high-performance'
  });

  // Performance: Cap pixel ratio to 1.0 on mobile to protect battery and GPU fillrate
  function updatePixelRatio() {
    const isMobile = window.innerWidth <= 768;
    renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 1.75));
  }
  updatePixelRatio();
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Primary Monumental Violet Wireframe Icosahedron (Centerpiece)
  // Geometry radius 3.3 for authoritative architectural scale on desktop
  const geo1 = new THREE.IcosahedronGeometry(3.3, 1);
  const edges1 = new THREE.EdgesGeometry(geo1);
  const mat1 = new THREE.LineBasicMaterial({
    color: 0x6C5CE7,
    transparent: true,
    opacity: 0.68,
    linewidth: 1
  });
  const mesh1 = new THREE.LineSegments(edges1, mat1);
  scene.add(mesh1);

  // Secondary Ember/Copper Wireframe Icosahedron (Interlocking Harmonic Orbit)
  const geo2 = new THREE.IcosahedronGeometry(1.5, 0);
  const edges2 = new THREE.EdgesGeometry(geo2);
  const mat2 = new THREE.LineBasicMaterial({
    color: 0xB8451F,
    transparent: true,
    opacity: 0.52
  });
  const mesh2 = new THREE.LineSegments(edges2, mat2);
  scene.add(mesh2);

  // Responsive positioning parameters
  let targetBaseX1 = 1.7;
  let targetBaseY1 = -0.05;
  let targetBaseZ1 = 0.2;
  let targetBaseScale1 = 1.0;
  let targetOpacity1 = 0.68;

  let targetBaseX2 = -2.6;
  let targetBaseY2 = 1.7;
  let targetBaseZ2 = -0.8;
  let targetOpacity2 = 0.52;

  // Entrance state: start as singularity if not reduced motion
  let isEntrancing = !reduced;
  let entranceScale = reduced ? 1.0 : 0.001;
  let entranceSpinVelocity = reduced ? 0 : 0.09;

  function updateResponsiveBounds() {
    const width = window.innerWidth;
    camera.aspect = width / window.innerHeight;
    camera.updateProjectionMatrix();
    updatePixelRatio();
    renderer.setSize(width, window.innerHeight);

    if (width <= 480) {
      // Small mobile: keep subtle and high up
      targetBaseX1 = 0.4;
      targetBaseY1 = 1.4;
      targetBaseZ1 = -2.4;
      targetBaseScale1 = 0.52;
      targetOpacity1 = 0.14;
      mesh2.visible = false;
    } else if (width <= 768) {
      // Tablet
      targetBaseX1 = 1.1;
      targetBaseY1 = 0.5;
      targetBaseZ1 = -1.0;
      targetBaseScale1 = 0.72;
      targetOpacity1 = 0.28;

      mesh2.visible = true;
      targetBaseX2 = -1.6;
      targetBaseY2 = 1.8;
      targetBaseZ2 = -1.8;
      targetOpacity2 = 0.2;
    } else if (width <= 1100) {
      // Laptop
      targetBaseX1 = 1.4;
      targetBaseY1 = 0.0;
      targetBaseZ1 = -0.2;
      targetBaseScale1 = 0.88;
      targetOpacity1 = 0.56;

      mesh2.visible = true;
      targetBaseX2 = -2.2;
      targetBaseY2 = 1.6;
      targetBaseZ2 = -1.0;
      targetOpacity2 = 0.42;
    } else {
      // Desktop (>1100px): Hero Centerpiece physically interacting with typography
      targetBaseX1 = 1.8;
      targetBaseY1 = -0.05;
      targetBaseZ1 = 0.25;
      targetBaseScale1 = 1.0;
      targetOpacity1 = 0.72;

      mesh2.visible = true;
      targetBaseX2 = -2.8;
      targetBaseY2 = 1.8;
      targetBaseZ2 = -0.6;
      targetOpacity2 = 0.52;
    }

    if (!isEntrancing) {
      mesh1.scale.setScalar(targetBaseScale1);
      mat1.opacity = targetOpacity1;
      mat2.opacity = targetOpacity2;
    }
  }

  updateResponsiveBounds();
  window.addEventListener('resize', updateResponsiveBounds);

  mesh1.scale.setScalar(entranceScale * targetBaseScale1);
  mesh2.scale.setScalar(entranceScale);
  mat1.opacity = reduced ? targetOpacity1 : 0.0;
  mat2.opacity = reduced ? targetOpacity2 : 0.0;

  triggerEntranceFn = () => {
    if (reduced) return;
    isEntrancing = true;

    if (window.gsap) {
      // Dramatic bloom entrance: uncoiling from a point into a monumental centerpiece
      const animObj = { scale: 0.001, spin: 0.12, opacity1: 0, opacity2: 0 };
      gsap.to(animObj, {
        scale: 1.0,
        spin: 0,
        opacity1: targetOpacity1,
        opacity2: targetOpacity2,
        duration: 1.85,
        ease: 'power4.out',
        onUpdate: () => {
          mesh1.scale.setScalar(animObj.scale * targetBaseScale1);
          mesh2.scale.setScalar(animObj.scale);
          entranceSpinVelocity = animObj.spin;
          mat1.opacity = animObj.opacity1;
          mat2.opacity = animObj.opacity2;
        },
        onComplete: () => {
          isEntrancing = false;
        }
      });
    } else {
      mesh1.scale.setScalar(targetBaseScale1);
      mesh2.scale.setScalar(1);
      mat1.opacity = targetOpacity1;
      mat2.opacity = targetOpacity2;
      isEntrancing = false;
    }
  };

  // Mouse tracking with normalized coordinates (-1 to 1)
  let targetMouseX = 0;
  let targetMouseY = 0;
  let currentMouseX = 0;
  let currentMouseY = 0;

  if (!reduced) {
    window.addEventListener('mousemove', e => {
      targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
      targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener('touchmove', e => {
      if (e.touches && e.touches[0]) {
        targetMouseX = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
        targetMouseY = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
      }
    }, { passive: true });
  }

  // Animation loop variables
  let idleRotX = 0;
  let idleRotY = 0;
  let idleRot2X = 0;
  let idleRot2Y = 0;

  let animFrameId = null;
  let isHeroVisible = true;

  function renderFrame() {
    renderer.render(scene, camera);
  }

  if (reduced) {
    mesh1.position.set(targetBaseX1, targetBaseY1, targetBaseZ1);
    mesh2.position.set(targetBaseX2, targetBaseY2, targetBaseZ2);
    renderFrame();
    return () => {
      window.removeEventListener('resize', updateResponsiveBounds);
      renderer.dispose();
    };
  }

  function animate() {
    if (!isHeroVisible) {
      animFrameId = null;
      return; // Pause off-screen!
    }

    animFrameId = requestAnimationFrame(animate);

    // Smooth easing on mouse coordinates
    currentMouseX += (targetMouseX - currentMouseX) * 0.045;
    currentMouseY += (targetMouseY - currentMouseY) * 0.045;

    // Proximity factor: cursor closeness to center/object
    const dist = Math.sqrt(currentMouseX * currentMouseX + currentMouseY * currentMouseY);
    const proximity = Math.max(0, 1 - dist * 0.65);

    // Scroll progress normalized
    const scrollT = Math.min(window.scrollY / window.innerHeight, 1.4);

    // Continuous idle rotation + uncoiling spin during entrance
    idleRotX += 0.0016 + entranceSpinVelocity * 0.5;
    idleRotY += 0.0022 + entranceSpinVelocity;

    // Apply primary mesh rotation
    mesh1.rotation.x = idleRotX + currentMouseY * 0.32 + proximity * 0.09;
    mesh1.rotation.y = idleRotY + currentMouseX * 0.38 + scrollT * 0.03;
    mesh1.rotation.z = currentMouseX * 0.08;

    // Position updates with scroll linkage
    mesh1.position.x = targetBaseX1 + currentMouseX * 0.3;
    mesh1.position.y = targetBaseY1 - scrollT * 1.4 + currentMouseY * 0.2;
    mesh1.position.z = targetBaseZ1;

    // Secondary object movement
    if (mesh2.visible) {
      idleRot2X -= 0.0012 + entranceSpinVelocity * 0.4;
      idleRot2Y += 0.0018 + entranceSpinVelocity * 0.7;

      mesh2.rotation.x = idleRot2X - currentMouseY * 0.18;
      mesh2.rotation.y = idleRot2Y - currentMouseX * 0.22;
      mesh2.position.x = targetBaseX2 - currentMouseX * 0.25;
      mesh2.position.y = targetBaseY2 + scrollT * 1.6 - currentMouseY * 0.15;
      mesh2.position.z = targetBaseZ2;
    }

    // Gentle camera parallax
    camera.position.x += (currentMouseX * 0.35 - camera.position.x) * 0.035;
    camera.position.y += (currentMouseY * 0.25 - camera.position.y) * 0.035;
    camera.lookAt(0, 0, 0);

    renderFrame();
  }

  // IntersectionObserver pauses RAF when Hero is off-screen
  let heroObserver = null;
  if ('IntersectionObserver' in window && heroSection) {
    heroObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isHeroVisible = entry.isIntersecting;
        if (isHeroVisible && !animFrameId) {
          animate();
        }
      });
    }, { threshold: 0.02 });
    heroObserver.observe(heroSection);
  }

  animate();

  return () => {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    if (heroObserver) heroObserver.disconnect();
    window.removeEventListener('resize', updateResponsiveBounds);
    renderer.dispose();
  };
}
