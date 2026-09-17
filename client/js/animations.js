/**
 * GSAP & ScrollTrigger reveal animations
 * Enhanced with cinematic section overlap transitions, title-card typography reveals,
 * and modular capability block staggering.
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
    { opacity: 0, y: 30 },
    { opacity: 1, y: 0, duration: 0.95, stagger: 0.08, ease: 'power3.out' }
  );
}

export function initScrollReveals() {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.innerWidth <= 768;

  if (reduced || isMobile) {
    const allTargets = document.querySelectorAll(
      '.manifesto-left, .capabilities-header, .cap-block, .case, .steps .step, #close .label, #close h2, .contact-card, .close-foot'
    );
    allTargets.forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    return;
  }

  // 1. Philosophy & Modular Capabilities Dedicated Scroll Transition
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
      '#manifesto .manifesto-left',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }
    )
    .fromTo(
      '#manifesto .capabilities-header',
      { opacity: 0, y: 22 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
      '-=0.45'
    )
    .fromTo(
      '#manifesto .cap-block',
      { opacity: 0, y: 26 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.09, ease: 'power2.out' },
      '-=0.4'
    );
  }

  // 2. Other Standard Scroll Reveals (Case Studies, Steps, Contact)
  const targets = document.querySelectorAll(
    '.case, .steps .step, #close .label, #close h2, .contact-card, .close-foot'
  );

  targets.forEach(el => {
    el.classList.add('reveal');
    gsap.fromTo(
      el,
      { opacity: 0, y: 32 },
      {
        opacity: 1,
        y: 0,
        duration: 0.85,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          once: true
        }
      }
    );
  });

  // 3. Cinematic Full-Bleed Section Overlap Transitions (Santioni Spirits Inspired)
  if (!isMobile && !reduced) {
    // Hero -> Manifesto: hero recedes into background as manifesto slides up
    gsap.to('#hero .hero-inner', {
      scale: 0.94,
      opacity: 0.65,
      ease: 'none',
      scrollTrigger: {
        trigger: '#manifesto',
        start: 'top bottom',
        end: 'top 20%',
        scrub: true
      }
    });

    // Work -> Process: work section recedes as process slides up
    const workSection = document.getElementById('work');
    const processSection = document.getElementById('process');
    if (workSection && processSection) {
      gsap.to(workSection, {
        scale: 0.95,
        opacity: 0.7,
        transformOrigin: 'center top',
        ease: 'none',
        scrollTrigger: {
          trigger: processSection,
          start: 'top bottom',
          end: 'top 15%',
          scrub: true
        }
      });
    }
  }

  ScrollTrigger.refresh();
}
