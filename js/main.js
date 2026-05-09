/* ============================================================
   RASA — main.js
   - Lenis smooth scroll
   - GSAP ScrollTrigger reveals
   - Custom cursor
   - Loader sequence
   - Stat counters
   - Horizontal menu rail
   - Nav state on scroll
   - Section title word splits
   ============================================================ */
(() => {
  gsap.registerPlugin(ScrollTrigger);

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = matchMedia('(hover:none)').matches;

  /* =========================================================
     1. Lenis smooth scroll synced to GSAP
     ========================================================= */
  const lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    smoothTouch: false
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  /* anchor links go through lenis */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length > 1){
        const target = document.querySelector(id);
        if (target){
          e.preventDefault();
          lenis.scrollTo(target, { offset: 0, duration: 1.4 });
        }
      }
    });
  });

  /* =========================================================
     2. Split helpers (lines + words) without external lib
     ========================================================= */
  function wrapWords(el){
    const text = el.textContent;
    el.innerHTML = '';
    text.split(/(\s+)/).forEach(part => {
      if (/\s+/.test(part)){
        el.appendChild(document.createTextNode(part));
      } else if (part.length){
        const w = document.createElement('span');
        w.className = 'word';
        const inner = document.createElement('span');
        inner.textContent = part;
        w.appendChild(inner);
        el.appendChild(w);
      }
    });
  }

  /* split section titles that opt in via .reveal-text */
  document.querySelectorAll('.reveal-text').forEach((el) => {
    /* preserve italic <em> by walking children */
    const frags = [];
    el.childNodes.forEach(n => {
      if (n.nodeType === Node.TEXT_NODE) frags.push({ type:'text', content:n.textContent });
      else if (n.nodeType === Node.ELEMENT_NODE) frags.push({ type:'el', tag:n.tagName, content:n.textContent });
    });
    el.innerHTML = '';
    frags.forEach(f => {
      const words = f.content.split(/(\s+)/);
      words.forEach(part => {
        if (/\s+/.test(part)){
          el.appendChild(document.createTextNode(part));
        } else if (part.length){
          const wrap = document.createElement('span');
          wrap.className = 'word';
          const inner = document.createElement(f.type === 'el' ? 'em' : 'span');
          inner.textContent = part;
          if (f.type !== 'el'){ /* nothing extra */ }
          /* always wrap inner in a translatable span */
          if (f.type === 'el'){
            const innerSpan = document.createElement('span');
            innerSpan.appendChild(inner);
            wrap.appendChild(innerSpan);
          } else {
            wrap.appendChild(inner);
          }
          el.appendChild(wrap);
        }
      });
    });
  });

  /* =========================================================
     3. Loader sequence
     ========================================================= */
  const loader        = document.querySelector('.loader');
  const loaderFill    = document.querySelector('.loader-fill');
  const loaderPercent = document.querySelector('.loader-percent span');

  function runLoader(onComplete){
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    const fakeProgress = { v: 0 };

    tl.to(fakeProgress, {
      v: 100,
      duration: 1.6,
      ease: 'power2.inOut',
      onUpdate(){
        const v = Math.round(fakeProgress.v);
        if (loaderPercent) loaderPercent.textContent = v;
        if (loaderFill)    loaderFill.style.right = (100 - v) + '%';
      }
    })
    .to('.loader-inner', { y: -20, opacity: 0, duration: .6, ease:'power3.in' }, '+=.15')
    .to(loader, { yPercent: -100, duration: 1.05, ease: 'expo.inOut', onComplete }, '-=.2');
  }

  /* =========================================================
     4. Hero intro (after loader)
     ========================================================= */
  function runHero(){
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.to('.hero-title .line > span', {
      yPercent: 0, duration: 1.1, stagger: .1
    })
    .from('.hero-meta > *', {
      y: 16, opacity: 0, duration: .6, stagger: .06
    }, '-=.7')
    .from('.hero-sub', { y: 20, opacity: 0, duration: .8 }, '-=.5')
    .from('.hero-actions > *', { y: 20, opacity: 0, duration: .6, stagger: .08 }, '-=.55')
    .from('.nav', { y: -30, opacity: 0, duration: .7 }, '-=1.1')
    .from('.hero-scroll', { opacity: 0, duration: .6 }, '-=.4');
  }

  /* =========================================================
     5. Generic reveals on scroll
     ========================================================= */
  function setupReveals(){
    /* word-by-word reveal for .reveal-text */
    document.querySelectorAll('.reveal-text').forEach(el => {
      const inners = el.querySelectorAll('.word > *');
      gsap.set(inners, { yPercent: 110 });
      gsap.to(inners, {
        yPercent: 0,
        duration: 1,
        ease: 'power3.out',
        stagger: .035,
        scrollTrigger: { trigger: el, start: 'top 85%' }
      });
    });

    /* up-fade for .reveal-up */
    gsap.utils.toArray('.reveal-up').forEach(el => {
      gsap.to(el, {
        opacity: 1, y: 0,
        duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });

    /* parallax image */
    gsap.utils.toArray('[data-parallax-image]').forEach(el => {
      gsap.to(el, {
        yPercent: -12,
        ease: 'none',
        scrollTrigger: { trigger: el.closest('.story-image-wrap') || el, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });

    /* gallery items pop-in with mask */
    gsap.utils.toArray('.g-item').forEach((el, i) => {
      gsap.from(el, {
        clipPath: 'inset(20% 20% 20% 20%)',
        opacity: 0,
        duration: 1.1,
        ease: 'power3.out',
        delay: (i % 3) * .06,
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });

    /* dish cards stagger when section enters */
    gsap.from('.dish', {
      y: 40, opacity: 0, duration: .9, ease:'power3.out',
      stagger: .08,
      scrollTrigger: { trigger: '.menu', start: 'top 70%' }
    });
  }

  /* =========================================================
     6. Stat counters
     ========================================================= */
  function setupStats(){
    document.querySelectorAll('[data-stat]').forEach(stat => {
      const target = +stat.dataset.target;
      const numEl  = stat.querySelector('.stat-num');
      const obj    = { v: 0 };
      ScrollTrigger.create({
        trigger: stat,
        start: 'top 85%',
        once: true,
        onEnter(){
          gsap.to(obj, {
            v: target,
            duration: 1.8,
            ease: 'power3.out',
            onUpdate(){
              numEl.textContent = Math.round(obj.v).toString().padStart(target >= 100 ? 3 : 2, '0');
            }
          });
        }
      });
    });
  }

  /* =========================================================
     7. Horizontal menu rail (vertical scroll → horizontal)
     ========================================================= */
  function setupMenuRail(){
    const rail  = document.querySelector('[data-rail]');
    const track = document.querySelector('[data-rail-track]');
    const fill  = document.querySelector('.menu-progress-fill');
    if (!rail || !track) return;

    if (window.innerWidth < 880){
      /* on small screens, fall back to native horizontal scroll */
      rail.style.overflowX = 'auto';
      track.style.paddingRight = '24px';
      return;
    }

    const getDistance = () => track.scrollWidth - window.innerWidth + 80;

    const tween = gsap.to(track, {
      x: () => -getDistance(),
      ease: 'none',
      scrollTrigger: {
        trigger: rail,
        pin: true,
        start: 'top 10%',
        end: () => '+=' + getDistance(),
        scrub: 0.6,
        invalidateOnRefresh: true,
        onUpdate(self){
          if (fill) fill.style.width = (self.progress * 100) + '%';
        }
      }
    });

    window.addEventListener('resize', () => ScrollTrigger.refresh());
  }

  /* =========================================================
     8. Nav scrolled state
     ========================================================= */
  function setupNav(){
    const nav = document.querySelector('.nav');
    ScrollTrigger.create({
      start: 'top -10',
      end: 'max',
      onUpdate: (self) => {
        nav.classList.toggle('scrolled', self.scroll() > 40);
      }
    });
  }

  /* =========================================================
     8b. Theme toggle (dark / light, persisted)
     ========================================================= */
  function setupTheme(){
    const STORAGE = 'rasa-theme';
    const btn = document.querySelector('.nav-theme');
    const stored = localStorage.getItem(STORAGE);

    /* honor saved choice; otherwise respect system pref */
    let initial = stored;
    if (!initial){
      initial = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    if (initial === 'light') document.body.classList.add('light');
    notifyTheme();

    if (btn){
      btn.addEventListener('click', () => {
        const isLight = document.body.classList.toggle('light');
        localStorage.setItem(STORAGE, isLight ? 'light' : 'dark');
        notifyTheme();
      });
    }

    function notifyTheme(){
      const t = document.body.classList.contains('light') ? 'light' : 'dark';
      window.dispatchEvent(new CustomEvent('theme-change', { detail: { theme: t } }));
    }
  }

  /* =========================================================
     9. Custom cursor
     ========================================================= */
  function setupCursor(){
    if (isTouch) return;
    const dot  = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');

    let mx = window.innerWidth/2, my = window.innerHeight/2;
    let rx = mx, ry = my;

    window.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform  = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
    });

    function loop(){
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    }
    loop();

    document.querySelectorAll('[data-cursor="hover"], a, button, input, select, textarea').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => ring.classList.remove('is-hover'));
    });

    /* hide on leave window */
    document.addEventListener('mouseleave', () => {
      dot.style.opacity = ring.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
      dot.style.opacity = ring.style.opacity = '1';
    });
  }

  /* =========================================================
     10. Boot
     ========================================================= */
  /* set initial hero state so loader can release them in order */
  gsap.set('.hero-title .line > span', { yPercent: 110 });

  document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('js-ready');
    setupTheme();
    setupCursor();
    setupNav();

    if (reduced){
      /* skip the loader theatrics */
      loader.style.display = 'none';
      gsap.set('.hero-title .line > span', { yPercent: 0 });
      gsap.set('.reveal-up', { opacity: 1, y: 0 });
      setupReveals();
      setupStats();
      setupMenuRail();
      return;
    }

    runLoader(() => {
      loader.style.display = 'none';
      runHero();
      setupReveals();
      setupStats();
      setupMenuRail();
      ScrollTrigger.refresh();
    });
  });

  /* =========================================================
     11. burger toggle (mobile)
     ========================================================= */
  const burger = document.querySelector('.nav-burger');
  const navLinks = document.querySelector('.nav-links');
  if (burger && navLinks){
    const closeMenu = () => {
      navLinks.classList.remove('open');
      burger.classList.remove('is-open');
      document.body.style.overflow = '';
    };
    burger.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      burger.classList.toggle('is-open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    /* close on link tap */
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', closeMenu);
    });
    /* close if viewport grows past mobile breakpoint */
    window.addEventListener('resize', () => {
      if (window.innerWidth > 880) closeMenu();
    });
  }
})();
