/**
 * Three.js scroll-linked and mouse-interactive wireframe background
 * Optimized for mobile performance: DPR capping, off-screen animation pausing,
 * and responsive positioning so the wireframe never obscures text.
 */
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

  // Mobile Performance: Cap pixel ratio to 1.0 on mobile to protect battery and GPU fillrate
  function updatePixelRatio() {
    const isMobile = window.innerWidth <= 768;
    renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 1.75));
  }
  updatePixelRatio();
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Primary large violet wireframe icosahedron
  const geo1 = new THREE.IcosahedronGeometry(2.1, 1);
  const edges1 = new THREE.EdgesGeometry(geo1);
  const mat1 = new THREE.LineBasicMaterial({
    color: 0x6C5CE7,
    transparent: true,
    opacity: 0.52
  });
  const mesh1 = new THREE.LineSegments(edges1, mat1);
  scene.add(mesh1);

  // Secondary small ember/copper wireframe icosahedron
  const geo2 = new THREE.IcosahedronGeometry(0.85, 0);
  const edges2 = new THREE.EdgesGeometry(geo2);
  const mat2 = new THREE.LineBasicMaterial({
    color: 0xB8451F,
    transparent: true,
    opacity: 0.36
  });
  const mesh2 = new THREE.LineSegments(edges2, mat2);
  scene.add(mesh2);

  // Responsive positioning parameters
  let targetBaseX1 = 2.1;
  let targetBaseY1 = -0.1;
  let targetBaseZ1 = 0;
  let targetBaseScale1 = 1;
  let targetOpacity1 = 0.52;

  let targetBaseX2 = -2.4;
  let targetBaseY2 = 1.6;
  let targetBaseZ2 = -1;

  function updateResponsiveBounds() {
    const width = window.innerWidth;
    camera.aspect = width / window.innerHeight;
    camera.updateProjectionMatrix();
    updatePixelRatio();
    renderer.setSize(width, window.innerHeight);

    if (width <= 480) {
      // Mobile phone: Position wireframe subtle and high up in background so it NEVER collides with headline
      targetBaseX1 = 0.4;
      targetBaseY1 = 1.4;
      targetBaseZ1 = -2.4;
      targetBaseScale1 = 0.52;
      targetOpacity1 = 0.14;

      mesh2.visible = false; // Disable secondary mesh to save draw calls & clutter on small phones
    } else if (width <= 768) {
      // Tablet portrait
      targetBaseX1 = 1.1;
      targetBaseY1 = 0.5;
      targetBaseZ1 = -1.0;
      targetBaseScale1 = 0.72;
      targetOpacity1 = 0.28;

      mesh2.visible = true;
      targetBaseX2 = -1.6;
      targetBaseY2 = 1.8;
      targetBaseZ2 = -1.8;
      mat2.opacity = 0.2;
    } else if (width <= 1100) {
      // Small laptop / tablet landscape
      targetBaseX1 = 1.7;
      targetBaseY1 = 0.0;
      targetBaseZ1 = -0.3;
      targetBaseScale1 = 0.9;
      targetOpacity1 = 0.46;

      mesh2.visible = true;
      targetBaseX2 = -2.1;
      targetBaseY2 = 1.6;
      targetBaseZ2 = -1.2;
      mat2.opacity = 0.32;
    } else {
      // Standard Desktop
      targetBaseX1 = 2.1;
      targetBaseY1 = -0.1;
      targetBaseZ1 = 0;
      targetBaseScale1 = 1;
      targetOpacity1 = 0.52;

      mesh2.visible = true;
      targetBaseX2 = -2.4;
      targetBaseY2 = 1.6;
      targetBaseZ2 = -1;
      mat2.opacity = 0.36;
    }

    mesh1.scale.setScalar(targetBaseScale1);
    mat1.opacity = targetOpacity1;
  }

  updateResponsiveBounds();
  window.addEventListener('resize', updateResponsiveBounds);

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

    // Touch support for mobile parallax
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
    // Respect prefers-reduced-motion: render static elegant frame
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
      return; // Pause animation loop completely when hero is scrolled out of view!
    }

    animFrameId = requestAnimationFrame(animate);

    // Smooth easing / lerp on mouse coordinates
    currentMouseX += (targetMouseX - currentMouseX) * 0.045;
    currentMouseY += (targetMouseY - currentMouseY) * 0.045;

    // Proximity factor: cursor closeness to center/object
    const dist = Math.sqrt(currentMouseX * currentMouseX + currentMouseY * currentMouseY);
    const proximity = Math.max(0, 1 - dist * 0.65);

    // Scroll progress normalized (0 to 1.4)
    const scrollT = Math.min(window.scrollY / window.innerHeight, 1.4);

    // Continuous subtle idle rotation
    idleRotX += 0.0014;
    idleRotY += 0.002;

    // Apply primary mesh rotation with gentle cursor follow and proximity response
    mesh1.rotation.x = idleRotX + currentMouseY * 0.28 + proximity * 0.08;
    mesh1.rotation.y = idleRotY + currentMouseX * 0.36 + scrollT * 0.025;
    mesh1.rotation.z = currentMouseX * 0.08;

    // Position updates with scroll linkage
    mesh1.position.x = targetBaseX1 + currentMouseX * 0.25;
    mesh1.position.y = targetBaseY1 - scrollT * 1.35 + currentMouseY * 0.18;
    mesh1.position.z = targetBaseZ1;

    // Secondary object independent movement (if visible)
    if (mesh2.visible) {
      idleRot2X -= 0.001;
      idleRot2Y += 0.0015;

      mesh2.rotation.x = idleRot2X - currentMouseY * 0.15;
      mesh2.rotation.y = idleRot2Y - currentMouseX * 0.2;
      mesh2.position.x = targetBaseX2 - currentMouseX * 0.2;
      mesh2.position.y = targetBaseY2 + scrollT * 1.6 - currentMouseY * 0.15;
      mesh2.position.z = targetBaseZ2;
    }

    // Gentle camera parallax
    camera.position.x += (currentMouseX * 0.32 - camera.position.x) * 0.035;
    camera.position.y += (currentMouseY * 0.24 - camera.position.y) * 0.035;
    camera.lookAt(0, 0, 0);

    renderFrame();
  }

  // Performance Optimization: IntersectionObserver pauses RAF when Hero is off-screen
  let heroObserver = null;
  if ('IntersectionObserver' in window && heroSection) {
    heroObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const wasVisible = isHeroVisible;
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
