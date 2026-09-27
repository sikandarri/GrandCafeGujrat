import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { animate, stagger } from 'framer-motion';

const cardSelector = [
  '.menu-card',
  '.deal-card',
  '.hero-card',
  '.experience-card',
  '.review-card',
  '.visit-card',
  '.reservation-card'
].join(',');

const pressSelector = [
  'button',
  '.primary',
  '.secondary',
  '.account-nav-btn',
  '.cart-btn',
  '.theme-toggle'
].join(',');

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const coarsePointer = () => window.matchMedia?.('(hover: none), (pointer: coarse)').matches;

export default function MotionEnhancer() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return undefined;

    document.documentElement.classList.add('gc-motion-ready');
    if (reducedMotion()) return () => document.documentElement.classList.remove('gc-motion-ready');

    const isTouch = coarsePointer();
    document.documentElement.classList.toggle('gc-touch-device', Boolean(isTouch));

    const disposers = [];
    const animated = new WeakSet();
    const enhancedCards = new WeakSet();

    const reveal = (elements, delay = 0) => {
      const list = Array.from(elements || []).filter(Boolean).filter(el => !animated.has(el));
      if (!list.length) return;
      list.forEach(el => animated.add(el));

      animate(
        list,
        isTouch
          ? { opacity: [0, 1], y: [10, 0] }
          : { opacity: [0, 1], y: [16, 0], scale: [0.992, 1] },
        {
          duration: isTouch ? 0.28 : 0.42,
          delay: stagger(isTouch ? 0.018 : 0.035, { startDelay: delay }),
          ease: [0.22, 1, 0.36, 1]
        }
      );
    };

    const enhanceCard = card => {
      if (!card || enhancedCards.has(card)) return;
      enhancedCards.add(card);
      card.classList.add('gc-motion-card');

      // Hover-following effects are desktop-only. On touch devices a synthetic
      // pointerenter can fire immediately before a tap, which competes with
      // modal rendering and can cause a visible black/blank frame on images.
      if (isTouch) return;

      card.classList.add('gc-spotlight');
      const onEnter = () => {
        animate(card, { y: -4, scale: 1.006 }, { type: 'spring', stiffness: 330, damping: 30, mass: 0.55 });
      };
      const onLeave = () => {
        animate(card, { y: 0, scale: 1 }, { type: 'spring', stiffness: 300, damping: 31, mass: 0.65 });
      };
      const onMove = event => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
        card.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
      };

      card.addEventListener('pointerenter', onEnter, { passive: true });
      card.addEventListener('pointerleave', onLeave, { passive: true });
      card.addEventListener('pointermove', onMove, { passive: true });
      disposers.push(() => {
        card.removeEventListener('pointerenter', onEnter);
        card.removeEventListener('pointerleave', onLeave);
        card.removeEventListener('pointermove', onMove);
      });
    };

    const scan = root => {
      const scope = root?.querySelectorAll ? root : document;
      scope.querySelectorAll?.(cardSelector).forEach(enhanceCard);
    };

    const sectionObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const section = entry.target;
          reveal(section.querySelectorAll('.section-head, .section-copy, .menu-card, .deal-card, .experience-card, .review-card, .visit-card, .reservation-card'));
          sectionObserver.unobserve(section);
        });
      },
      { threshold: isTouch ? 0.06 : 0.12, rootMargin: '0px 0px -5% 0px' }
    );

    document.querySelectorAll('main section:not(.hero), footer').forEach(section => sectionObserver.observe(section));
    disposers.push(() => sectionObserver.disconnect());

    scan(document);
    reveal(document.querySelectorAll('.site-header, .hero .eyebrow, .hero h1, .hero-copy > p, .hero-cta, .hero-meta'), 0.02);

    // Framer-driven press feedback is useful with a mouse, but on mobile it
    // creates extra compositor work exactly when a modal is being mounted.
    if (!isTouch) {
      const onPointerDown = event => {
        const target = event.target.closest?.(pressSelector);
        if (!target || target.disabled || target.getAttribute('aria-disabled') === 'true') return;
        animate(target, { scale: 0.977 }, { duration: 0.1, ease: 'easeOut' });
      };
      const onPointerUp = event => {
        const target = event.target.closest?.(pressSelector);
        if (!target) return;
        animate(target, { scale: 1 }, { type: 'spring', stiffness: 480, damping: 32, mass: 0.4 });
      };
      document.addEventListener('pointerdown', onPointerDown, true);
      document.addEventListener('pointerup', onPointerUp, true);
      document.addEventListener('pointercancel', onPointerUp, true);
      disposers.push(() => {
        document.removeEventListener('pointerdown', onPointerDown, true);
        document.removeEventListener('pointerup', onPointerUp, true);
        document.removeEventListener('pointercancel', onPointerUp, true);
      });
    }

    const mutationObserver = new MutationObserver(records => {
      const newCards = [];
      records.forEach(record => {
        record.addedNodes.forEach(node => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches?.(cardSelector)) newCards.push(node);
          node.querySelectorAll?.(cardSelector).forEach(el => newCards.push(el));
        });
      });
      if (!newCards.length) return;
      newCards.forEach(enhanceCard);
      reveal(newCards);
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });
    disposers.push(() => mutationObserver.disconnect());

    return () => {
      disposers.forEach(dispose => dispose());
      document.documentElement.classList.remove('gc-motion-ready', 'gc-touch-device');
    };
  }, [location.pathname, location.search]);

  return null;
}
