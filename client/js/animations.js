/**
 * GSAP & ScrollTrigger reveal animations
 */
export function revealHero() {
  if (!window.gsap) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const targets = '#hero .hero-status-bar, #hero .hero-intro, #hero h1 span, #hero .hero-actions, #hero .hero-foot';

  if (reduced) {
    gsap.set(targets, { opacity: 1, y: 0 });
    return;
  }

  gsap.fromTo(
    targets,
    { opacity: 0, y: 22 },
    { opacity: 1, y: 0, duration: 0.85, stagger: 0.07, ease: 'power3.out' }
  );
}

export function initScrollReveals() {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduced) {
    const allTargets = document.querySelectorAll(
      '.manifesto-lede, .manifesto-left, .capabilities-header, .capability-row, .case, .steps .step, #close .label, #close h2, .contact-card, .close-foot'
    );
    allTargets.forEach(el => gsap.set(el, { opacity: 1, y: 0 }));
    return;
  }

  // 1. Philosophy & Capabilities Dedicated Scroll Transition
  const manifesto = document.getElementById('manifesto');
  if (manifesto) {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: manifesto,
        start: 'top 82%',
        once: true
      }
    });

    tl.fromTo(
      '#manifesto .manifesto-lede',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.65, ease: 'power2.out' }
    )
    .fromTo(
      '#manifesto .manifesto-left',
      { opacity: 0, y: 26 },
      { opacity: 1, y: 0, duration: 0.75, ease: 'power2.out' },
      '-=0.35'
    )
    .fromTo(
      '#manifesto .capabilities-header',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
      '-=0.5'
    )
    .fromTo(
      '#manifesto .capability-row',
      { opacity: 0, y: 22 },
      { opacity: 1, y: 0, duration: 0.55, stagger: 0.1, ease: 'power2.out' },
      '-=0.35'
    );
  }

  // 2. Other Standard Scroll Reveals
  const targets = document.querySelectorAll(
    '.case, .steps .step, #close .label, #close h2, .contact-card, .close-foot'
  );

  targets.forEach(el => {
    el.classList.add('reveal');
    gsap.fromTo(
      el,
      { opacity: 0, y: 28 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          once: true
        }
      }
    );
  });
}
