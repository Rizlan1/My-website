(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = !!window.gsap;
  $('#yr').textContent = new Date().getFullYear();

  /* ---------- Loader ---------- */
  const loader = $('.loader'), bar = $('.loader__bar i');
  let glDone = false, winDone = false;
  const tryFinish = () => {
    if (!(glDone && winDone)) return;
    bar.style.width = '100%';
    setTimeout(() => { loader.classList.add('done'); intro(); }, 350);
  };
  window.__glReady = () => { glDone = true; bar.style.width = '70%'; tryFinish(); };
  winDone = true; // images lazy-load; don't block the intro on them
  document.fonts?.ready.then(() => { bar.style.width = '55%'; });
  setTimeout(() => { glDone = winDone = true; tryFinish(); }, 2500); // never trap the visitor
  bar.style.width = '30%';

  /* ---------- Split text ---------- */
  $$('.split').forEach(el => {
    el.innerHTML = [...el.textContent].map(c => `<span class="char">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
  });
  $$('.words').forEach(el => {
    el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
  });

  if (!hasGsap) { $$('.manifesto__text .w').forEach(w => w.style.opacity = 1); return; }
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll ---------- */
  let lenis;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href'); if (id.length < 2) return;
      e.preventDefault(); lenis.scrollTo(id === '#top' ? 0 : id, { offset: -10, duration: 1.6 });
    }));
  }

  /* ---------- Intro ---------- */
  gsap.set('.hero__title .char', { yPercent: 110, rotate: 8, opacity: 0 });
  gsap.set('.reveal-up, .hero__meta, .nav', { y: 30, opacity: 0 });
  function intro() {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to('.hero__title .char', { yPercent: 0, rotate: 0, opacity: 1, duration: 1.6, stagger: 0.06 })
      .to('.nav, .hero__meta', { y: 0, opacity: 1, duration: 1.2 }, '-=1.2')
      .to('.reveal-up', { y: 0, opacity: 1, duration: 1.2, stagger: 0.12 }, '-=1.0');
  }

  /* Hero title parallax out */
  gsap.to('.hero__title', { yPercent: -30, opacity: 0.15, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  /* Nav state */
  ScrollTrigger.create({ start: 80, onToggle: s => $('.nav').classList.toggle('scrolled', s.isActive) });

  /* ---------- Manifesto word light-up ---------- */
  gsap.to('.manifesto__text .w', {
    opacity: 1, stagger: 0.04, ease: 'none',
    scrollTrigger: { trigger: '.manifesto__text', start: 'top 80%', end: 'bottom 45%', scrub: true }
  });

  /* Counters */
  $$('[data-count]').forEach(el => {
    const end = parseFloat(el.dataset.count), dec = +el.dataset.dec || 0, o = { v: 0 };
    gsap.to(o, { v: end, duration: 2.2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      onUpdate: () => el.textContent = dec ? o.v.toFixed(dec) : Math.round(o.v).toLocaleString('en-AU') + (end > 1000 ? '+' : '') });
  });

  /* Section heads reveal */
  $$('.display, .lede, .eyebrow').filter(el => !el.closest('.room__card')).forEach(el => {
    gsap.from(el, { y: 60, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });

  /* ---------- Horizontal cuts gallery ---------- */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 821px)', () => {
    const track = $('.cuts__track');
    const dist = () => track.scrollWidth - innerWidth;
    const tw = gsap.to(track, { x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: '.cuts__pin', start: 'top 8%', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 } });
    $$('.cut').forEach(card => gsap.from(card, { rotateY: -25, z: -200, opacity: 0.2, ease: 'none',
      scrollTrigger: { trigger: card, containerAnimation: tw, start: 'left 100%', end: 'left 60%', scrub: true } }));
  });
  mm.add('(max-width: 820px)', () => {
    $$('.cut').forEach(card => gsap.from(card, { y: 80, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: card, start: 'top 90%' } }));
  });

  /* ---------- Card tilt ---------- */
  if (matchMedia('(hover:hover)').matches) {
    $$('.tilt').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(card, { rotateY: x * 10, rotateX: -y * 10, transformPerspective: 900, duration: 0.6, ease: 'power3.out' });
      });
      card.addEventListener('pointerleave', () => gsap.to(card, { rotateY: 0, rotateX: 0, duration: 1, ease: 'elastic.out(1,.5)' }));
    });
  }

  /* ---------- Before / After ---------- */
  $$('.ba').forEach((ba, i) => {
    const handle = $('.ba__handle', ba);
    const set = p => { p = Math.max(0, Math.min(100, p)); ba.style.setProperty('--pos', p + '%'); handle.setAttribute('aria-valuenow', Math.round(p)); };
    let drag = false;
    const fromEvent = e => { const r = ba.getBoundingClientRect(); set((e.clientX - r.left) / r.width * 100); };
    ba.addEventListener('pointerdown', e => { drag = true; ba.setPointerCapture(e.pointerId); fromEvent(e); });
    ba.addEventListener('pointermove', e => drag && fromEvent(e));
    ba.addEventListener('pointerup', () => drag = false);
    ba.addEventListener('pointercancel', () => drag = false);
    handle.addEventListener('keydown', e => {
      const v = parseFloat(getComputedStyle(ba).getPropertyValue('--pos')) || 50;
      if (e.key === 'ArrowLeft') { set(v - 5); e.preventDefault(); }
      if (e.key === 'ArrowRight') { set(v + 5); e.preventDefault(); }
    });
    // teaser sweep when it enters view
    const o = { p: 50 };
    gsap.timeline({ scrollTrigger: { trigger: ba, start: 'top 75%', once: true }, delay: i * 0.15 })
      .from(ba, { y: 80, opacity: 0, duration: 1.2, ease: 'expo.out' })
      .to(o, { p: 85, duration: 0.9, ease: 'power2.inOut', onUpdate: () => !drag && set(o.p) }, '-=0.4')
      .to(o, { p: 15, duration: 1.1, ease: 'power2.inOut', onUpdate: () => !drag && set(o.p) })
      .to(o, { p: 50, duration: 0.8, ease: 'power2.inOut', onUpdate: () => !drag && set(o.p) });
  });

  /* ---------- Kit & room parallax ---------- */
  gsap.fromTo('.kit__stage img', { yPercent: -10 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.kit__stage', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('.tool', { y: 50, opacity: 0, duration: 1, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: '.kit__grid', start: 'top 85%' } });
  gsap.fromTo('.room__img img', { yPercent: -12 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.room', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('.room__card > *', { x: -40, opacity: 0, duration: 1.1, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: '.room__card', start: 'top 75%' } });

  /* Book title */
  gsap.from('.book__title .char', { yPercent: 120, opacity: 0, rotate: 10, duration: 1.4, stagger: 0.05, ease: 'expo.out', scrollTrigger: { trigger: '.book', start: 'top 65%' } });

  /* ---------- Cursor & magnetic ---------- */
  const cur = $('.cursor');
  if (matchMedia('(hover:hover)').matches) {
    const qx = gsap.quickTo(cur, 'x', { duration: 0.35, ease: 'power3' }), qy = gsap.quickTo(cur, 'y', { duration: 0.35, ease: 'power3' });
    addEventListener('pointermove', e => { qx(e.clientX); qy(e.clientY); });
    $$('a, .ba, .cut').forEach(el => {
      el.addEventListener('pointerenter', () => cur.classList.add('is-hover'));
      el.addEventListener('pointerleave', () => cur.classList.remove('is-hover'));
    });
    $$('.magnetic, .btn').forEach(btn => {
      btn.addEventListener('pointermove', e => { const r = btn.getBoundingClientRect(); gsap.to(btn, { x: (e.clientX - r.left - r.width / 2) * 0.25, y: (e.clientY - r.top - r.height / 2) * 0.35, duration: 0.5 }); });
      btn.addEventListener('pointerleave', () => gsap.to(btn, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1,.4)' }));
    });
  }

  addEventListener('load', () => ScrollTrigger.refresh());
})();
