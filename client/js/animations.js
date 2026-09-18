/**
 * GSAP & ScrollTrigger reveal animations for the Engineering Archive
 * Features deliberately paced chapter page transitions, pinned header settles,
 * and specimen card entrance staging.
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
    { opacity: 1, y: 0, duration: 1.1, stagger: 0.08, ease: 'power3.out' }
  );
}

export function initScrollReveals() {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.innerWidth <= 768;

  if (reduced || isMobile) {
    const allTargets = document.querySelectorAll(
      '.manifesto-left, .capabilities-header, .cap-block, #work-head, .specimen-card, .case, #process .process-grid > div:first-child, .steps .step, .contact-sheet-section, #close .contact-lead, .contact-card, .close-foot'
    );
    allTargets.forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    return;
  }

  // 1. Chapter 01: Philosophy & Modular Capabilities Dedicated Scroll Transition
  const manifesto = document.getElementById('manifesto');
  if (manifesto) {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: manifesto,
        start: 'top 80%',
        once: true
      }
    });

    tl.fromTo(
      '#manifesto .manifesto-left',
      { opacity: 0, y: 32 },
      { opacity: 1, y: 0, duration: 0.85, ease: 'power2.out' }
    )
    .fromTo(
      '#manifesto .capabilities-header',
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.65, ease: 'power2.out' },
      '-=0.4'
    )
    .fromTo(
      '#manifesto .cap-block',
      { opacity: 0, y: 28 },
      { opacity: 1, y: 0, duration: 0.65, stagger: 0.09, ease: 'power2.out' },
      '-=0.35'
    );
  }

  // 2. Chapter 02: Specimen Cards Staged Reveal
  const specimenCards = document.querySelectorAll('#projects-container .specimen-card');
  specimenCards.forEach((card, idx) => {
    // Initial rotation angles matching CSS
    const initialRot = (idx % 3 === 0) ? -1.2 : (idx % 3 === 1 ? 1.4 : -0.8);
    gsap.fromTo(
      card,
      { opacity: 0.25, y: 35, rotation: initialRot * 1.4 },
      {
        opacity: 1,
        y: 0,
        rotation: initialRot,
        duration: 0.85,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 92%',
          once: true
        }
      }
    );
  });

  // 3. Chapter 03: Field Log Steps Progressive Entry
  const steps = document.querySelectorAll('.steps .step');
  steps.forEach((step, idx) => {
    gsap.fromTo(
      step,
      { opacity: 0, x: -20 },
      {
        opacity: 1,
        x: 0,
        duration: 0.75,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: step,
          start: 'top 88%',
          once: true
        }
      }
    );
  });

  // 4. Chapter 04 & Contact Sheet Widget Reveal
  const contactTargets = document.querySelectorAll(
    '.contact-sheet-section, #close .contact-lead, .contact-card, .close-foot'
  );
  contactTargets.forEach(el => {
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
          start: 'top 88%',
          once: true
        }
      }
    );
  });

  // 5. Deliberate Page-Turn Transitions Between Chapters
  // Each section recedes into the background with dignified weight as the next chapter turns in
  if (!isMobile && !reduced) {
    // Hero -> Chapter 01 (Manifesto)
    gsap.to('#hero .hero-inner', {
      scale: 0.92,
      opacity: 0.55,
      y: 40,
      ease: 'power1.inOut',
      scrollTrigger: {
        trigger: '#manifesto',
        start: 'top bottom',
        end: 'top 15%',
        scrub: 1.2
      }
    });

    // Chapter 01 -> Chapter 02 (Selected Work)
    const manifestoSection = document.getElementById('manifesto');
    const workSection = document.getElementById('work');
    if (manifestoSection && workSection) {
      gsap.to(manifestoSection, {
        scale: 0.94,
        opacity: 0.6,
        y: 35,
        transformOrigin: 'center top',
        ease: 'power1.inOut',
        scrollTrigger: {
          trigger: workSection,
          start: 'top bottom',
          end: 'top 15%',
          scrub: 1.2
        }
      });
    }

    // Chapter 02 -> Chapter 03 (Field Logs)
    const processSection = document.getElementById('process');
    if (workSection && processSection) {
      gsap.to(workSection, {
        scale: 0.94,
        opacity: 0.6,
        y: 35,
        transformOrigin: 'center top',
        ease: 'power1.inOut',
        scrollTrigger: {
          trigger: processSection,
          start: 'top bottom',
          end: 'top 15%',
          scrub: 1.2
        }
      });
    }

    // Chapter 03 -> Chapter 04 (Contact & Dispatch)
    const closeSection = document.getElementById('close');
    if (processSection && closeSection) {
      gsap.to(processSection, {
        scale: 0.94,
        opacity: 0.6,
        y: 35,
        transformOrigin: 'center top',
        ease: 'power1.inOut',
        scrollTrigger: {
          trigger: closeSection,
          start: 'top bottom',
          end: 'top 15%',
          scrub: 1.2
        }
      });
    }
  }

  ScrollTrigger.refresh();
}
