/**
 * Terminal boot sequence and loading curtain controller
 */
export function initLoader(onComplete) {
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
    if (onComplete) onComplete();
    return;
  }

  if (window.gsap) {
    const tl = gsap.timeline({ delay: 0.2 });
    lineEls.forEach((el, i) => {
      tl.to(el, { opacity: 1, duration: 0.2 }, i * 0.28);
    });

    tl.call(() => {
      const loader = document.getElementById('loader');
      if (loader) loader.classList.add('loading');
    }, null, '+=0.1');

    tl.to({}, { duration: 1.7 }); // let bar fill

    tl.to('#loader', {
      opacity: 0,
      duration: 0.5,
      onComplete: () => {
        const loader = document.getElementById('loader');
        if (loader) loader.style.display = 'none';
      }
    });

    tl.to('#loader-curtain', {
      yPercent: -100,
      duration: 0.9,
      ease: 'power4.inOut',
      onComplete: () => {
        const curtain = document.getElementById('loader-curtain');
        if (curtain) curtain.style.display = 'none';
        if (onComplete) onComplete();
      }
    }, '-=0.4');
  } else {
    // Fallback if GSAP fails to load
    setTimeout(() => {
      const loader = document.getElementById('loader');
      const curtain = document.getElementById('loader-curtain');
      if (loader) loader.style.display = 'none';
      if (curtain) curtain.style.display = 'none';
      if (onComplete) onComplete();
    }, 1500);
  }
}
