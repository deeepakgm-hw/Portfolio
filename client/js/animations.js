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
  const targets = document.querySelectorAll(
    '#manifesto p, .case, .steps .step, #close .label, #close h2, .contact-card, .close-foot'
  );

  if (reduced) {
    targets.forEach(el => gsap.set(el, { opacity: 1, y: 0 }));
    return;
  }

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
