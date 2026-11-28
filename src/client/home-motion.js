import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
const motion = gsap.matchMedia();
motion.add('(prefers-reduced-motion: no-preference)', () => {
  const hero = document.querySelector('.hero');
  const content = hero.querySelector('.hero-content');
  gsap.to('.hero-media', {
    scale: 1.07,
    ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
  });
  gsap.to(content, {
    y: -18,
    opacity: .82,
    ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top -100px', end: 'bottom 100px', scrub: true }
  });
  for (const item of document.querySelectorAll('[data-reveal]')) {
    gsap.from(item, {
      y: 15,
      duration: .5,
      scrollTrigger: { trigger: item, start: 'top 88%', once: true }
    });
  }
});
