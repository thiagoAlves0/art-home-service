(() => {
    'use strict';

    const menu = document.getElementById('nav-menu');
    const toggle = document.getElementById('nav-toggle');
    const close = document.getElementById('nav-close');
    const backdrop = document.getElementById('nav-backdrop');
    const header = document.getElementById('header');
    const scrollUp = document.getElementById('scroll-up');
    const desktop = window.matchMedia('(min-width: 960px)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const navLinks = [...document.querySelectorAll('.nav__link[href^="#"]')];
    let menuOpen = false;

    const targetFor = (link) => {
        try {
            return document.getElementById(decodeURIComponent(link.hash.slice(1)));
        } catch {
            return null;
        }
    };

    const focusableItems = () => [...menu.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )].filter((element) => element.tabIndex >= 0 && !element.hidden && element.getClientRects().length > 0);

    function setMenu(open, returnFocus = false) {
        if (!menu || !toggle) return;

        menuOpen = open && !desktop.matches;
        // Move focus before hiding the panel from assistive technology.
        if (!menuOpen && returnFocus && !desktop.matches) toggle.focus();
        menu.classList.toggle('show-menu', menuOpen);
        document.body.classList.toggle('menu-open', menuOpen);
        toggle.setAttribute('aria-expanded', String(menuOpen));
        menu.inert = !desktop.matches && !menuOpen;
        if (desktop.matches) menu.removeAttribute('aria-hidden');
        else menu.setAttribute('aria-hidden', String(!menuOpen));
        if (backdrop) backdrop.hidden = !menuOpen;

        if (menuOpen) {
            // Wait for the panel's visibility change before moving keyboard focus.
            window.requestAnimationFrame(() => {
                if (!menuOpen || desktop.matches) return;
                const firstItem = focusableItems()[0];
                (close || firstItem)?.focus({ preventScroll: true });
            });
        }
    }

    toggle?.addEventListener('click', () => setMenu(!menuOpen, menuOpen));
    close?.addEventListener('click', () => setMenu(false, true));
    backdrop?.addEventListener('click', () => setMenu(false, true));

    menu?.querySelectorAll('a[href]').forEach((link) => {
        link.addEventListener('click', () => {
            if (!menuOpen) return;
            const target = link.origin === location.origin && link.pathname === location.pathname
                ? targetFor(link) : null;
            if (target) {
                const hadTabIndex = target.hasAttribute('tabindex');
                if (!hadTabIndex) {
                    target.setAttribute('tabindex', '-1');
                    target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
                }
                target.focus({ preventScroll: true });
            }
            setMenu(false, !target);
        });
    });

    document.addEventListener('keydown', (event) => {
        if (!menuOpen) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            setMenu(false, true);
        } else if (event.key === 'Tab') {
            const items = focusableItems();
            const first = items[0];
            const last = items[items.length - 1];
            if (!first) {
                event.preventDefault();
                return;
            }
            if (event.shiftKey && (document.activeElement === first || !menu.contains(document.activeElement))) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && (document.activeElement === last || !menu.contains(document.activeElement))) {
                event.preventDefault();
                first.focus();
            }
        }
    });

    desktop.addEventListener('change', () => {
        const focused = document.activeElement;
        const focusInMenu = menu?.contains(document.activeElement);
        setMenu(false, !desktop.matches && focusInMenu);
        if (desktop.matches && (focused === close || focused === toggle)) navLinks[0]?.focus();
    });
    setMenu(false);

    // Section starts work even when a section is taller than the viewport.
    const sections = navLinks.map((link) => ({ link, section: targetFor(link) }))
        .filter(({ section }) => section);
    let ticking = false;

    function updateScrollState() {
        ticking = false;
        header?.classList.toggle('bg-header', window.scrollY > 24);
        if (scrollUp) {
            scrollUp.hidden = window.scrollY <= 350;
            scrollUp.classList.toggle('show-scroll', !scrollUp.hidden);
        }

        const threshold = (header?.getBoundingClientRect().bottom || 0) + 36;
        const positions = sections.map((item) => ({ ...item, top: item.section.getBoundingClientRect().top }))
            .sort((a, b) => a.top - b.top);
        let current = positions[0];
        positions.forEach((item) => {
            if (item.top <= threshold) current = item;
        });
        if (window.scrollY > 0 && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
            current = positions[positions.length - 1];
        }
        navLinks.forEach((link) => {
            const active = link === current?.link;
            link.classList.toggle('active-link', active);
            if (active) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
        });
    }

    function requestScrollUpdate() {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(updateScrollState);
    }

    window.addEventListener('scroll', requestScrollUpdate, { passive: true });
    window.addEventListener('resize', requestScrollUpdate);
    window.addEventListener('hashchange', requestScrollUpdate);
    window.addEventListener('load', requestScrollUpdate);
    updateScrollState();

    // Content stays visible by default; animate only when it enters the viewport.
    const reveals = [...document.querySelectorAll('[data-reveal]')];
    let revealObserver;

    function finishReveal(element) {
        element.classList.add('is-visible');
        element.classList.remove('is-entering');
        revealObserver?.unobserve(element);
    }

    function revealAll() {
        revealObserver?.disconnect();
        reveals.forEach(finishReveal);
    }

    if (reducedMotion.matches || !('IntersectionObserver' in window)) {
        revealAll();
    } else {
        try {
            revealObserver = new IntersectionObserver((entries) => {
                entries.forEach(({ target, isIntersecting }) => {
                    if (!isIntersecting || target.classList.contains('is-visible')) return;
                    finishReveal(target);
                    if (!reducedMotion.matches && !target.matches(':focus-within')) {
                        target.classList.add('is-entering');
                    }
                });
            }, { threshold: 0, rootMargin: '0px 0px 32px 0px' });

            reveals.forEach((element) => {
                element.addEventListener('animationend', (event) => {
                    if (event.target === element && event.animationName === 'reveal-in') finishReveal(element);
                });
                // Preserve immediate content on reloads and direct section links.
                if (element.getBoundingClientRect().top < window.innerHeight) finishReveal(element);
                else revealObserver.observe(element);
            });
        } catch {
            revealAll();
        }
    }

    document.addEventListener('focusin', (event) => {
        const element = event.target.closest('[data-reveal]');
        if (element) finishReveal(element);
    });
    window.addEventListener('beforeprint', revealAll);
    reducedMotion.addEventListener('change', (event) => {
        if (event.matches) revealAll();
    });
})();
