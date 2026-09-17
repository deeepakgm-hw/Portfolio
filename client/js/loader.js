/**
 * Terminal boot sequence and loading curtain controller
 * Extended with a deliberate ritual pacing and a dedicated pause on '> ready.'
 * before the dramatic curtain wipe and 3D centerpiece entrance.
 */
export function initLoader(onComplete, onCurtainLift) {
  const bootLines = [
    '> initializing workspace...',
    '> resolving dependencies... <span class="ok">resolved</span>',
    '> compiling ambition...',
    '> ready.'
  ];
  
  const linesEl = document.getElementById('loader-lines');
  if (!linesEl) return;

  bootLines.forEach(line => {
    const d = document.createElement('div');
    d.innerHTML = line;
    linesEl.appendChild(d);
  });

  const lineEls = linesEl.querySelectorAll('div');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduced) {
    const loader = document.getElementById('loader');
    const curtain = document.getElementById('loader-curtain');
    if (loader) loader.style.display = 'none';
    if (curtain) curtain.style.display = 'none';
    if (onCurtainLift) onCurtainLift();
    if (onComplete) onComplete();
    return;
  }

  if (window.gsap) {
    const tl = gsap.timeline({ delay: 0.3 });

    // Stagger boot lines with intentional, deliberate terminal pacing
    lineEls.forEach((el, i) => {
      tl.to(el, { opacity: 1, duration: 0.26, ease: 'power1.out' }, i * 0.42);
    });

    // Start filling loading bar
    tl.call(() => {
      const loader = document.getElementById('loader');
      if (loader) loader.classList.add('loading');
    }, null, '+=0.15');

    // Fill bar duration
    tl.to({}, { duration: 1.5 });

    // Theatrical Beat: Dedicated pause on '> ready.' so the user absorbs the moment
    tl.to({}, { duration: 0.85 });

    // Fade terminal text
    tl.to('#loader', {
      opacity: 0,
      duration: 0.45,
      ease: 'power2.in',
      onComplete: () => {
        const loader = document.getElementById('loader');
        if (loader) loader.style.display = 'none';
      }
    });

    // Trigger 3D centerpiece bloom entrance right as curtain begins lifting
    tl.call(() => {
      if (onCurtainLift) onCurtainLift();
    }, null, '-=0.35');

    // Theatrical curtain lift
    tl.to('#loader-curtain', {
      yPercent: -100,
      duration: 1.05,
      ease: 'power4.inOut',
      onComplete: () => {
        const curtain = document.getElementById('loader-curtain');
        if (curtain) curtain.style.display = 'none';
        if (onComplete) onComplete();
      }
    }, '-=0.3');
  } else {
    // Fallback if GSAP fails to load
    setTimeout(() => {
      const loader = document.getElementById('loader');
      const curtain = document.getElementById('loader-curtain');
      if (loader) loader.style.display = 'none';
      if (curtain) curtain.style.display = 'none';
      if (onCurtainLift) onCurtainLift();
      if (onComplete) onComplete();
    }, 2000);
  }
}
