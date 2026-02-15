/* ============================================
   FOCUS CLUB VALLECAS — Main JavaScript
   Interactions, animations & scroll effects
   ============================================ */

// ── DOM Ready ──
document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initMobileMenu();
    initScrollReveals();
    initCounters();
    initSmoothScroll();
    initFormValidation();
    initNavActiveState();
});

// ── Navbar Scroll Effect ──
function initNavbar() {
    const navbar = document.getElementById('navbar');
    const navCta = document.querySelector('.nav-cta');

    function handleScroll() {
        if (window.scrollY > 80) {
            navbar.classList.add('scrolled');
            if (navCta && window.innerWidth > 1024) {
                navCta.style.display = 'inline-flex';
            }
        } else {
            navbar.classList.remove('scrolled');
            if (navCta) {
                navCta.style.display = 'none';
            }
        }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
}

// ── Mobile Menu Toggle ──
function initMobileMenu() {
    const toggle = document.getElementById('navToggle');
    const links = document.getElementById('navLinks');

    if (!toggle || !links) return;

    toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        links.classList.toggle('open');
        document.body.style.overflow = links.classList.contains('open') ? 'hidden' : '';
    });

    // Close menu when clicking a link
    links.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            toggle.classList.remove('active');
            links.classList.remove('open');
            document.body.style.overflow = '';
        });
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && links.classList.contains('open')) {
            toggle.classList.remove('active');
            links.classList.remove('open');
            document.body.style.overflow = '';
        }
    });
}

// ── Scroll Reveal Animations ──
function initScrollReveals() {
    const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

    if (!reveals.length) return;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    // Stagger the animation for siblings
                    const delay = entry.target.dataset.delay || 0;
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                    }, delay);
                    observer.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.1,
            rootMargin: '0px 0px -60px 0px',
        }
    );

    // Add stagger delays to grid children
    document.querySelectorAll('.servicios-grid .servicio-card, .testimonios-grid .testimonio-card, .comunidad-values .value-card').forEach((card, i) => {
        card.dataset.delay = i * 100;
    });

    reveals.forEach(el => observer.observe(el));
}

// ── Animated Counters ──
function initCounters() {
    const counters = document.querySelectorAll('[data-target]');

    if (!counters.length) return;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.5 }
    );

    counters.forEach(counter => observer.observe(counter));
}

function animateCounter(element) {
    const target = parseInt(element.dataset.target);
    const duration = 2000; // ms
    const start = performance.now();

    // Preserve the suffix (%, +, etc.)
    const suffix = element.innerHTML.replace(/\d+/, '').replace(/<[^>]*>/g, '').trim();
    const spanContent = element.querySelector('span')?.outerHTML || '';

    function update(currentTime) {
        const elapsed = currentTime - start;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(eased * target);

        element.innerHTML = current + spanContent;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

// ── Smooth Scroll ──
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const targetId = anchor.getAttribute('href');
            if (targetId === '#') return;

            const targetEl = document.querySelector(targetId);
            if (!targetEl) return;

            e.preventDefault();

            const navHeight = document.getElementById('navbar')?.offsetHeight || 80;
            const targetPosition = targetEl.getBoundingClientRect().top + window.scrollY - navHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth',
            });
        });
    });
}

// ── Active Nav State on Scroll ──
function initNavActiveState() {
    const navLinks = document.querySelectorAll('.nav-links a');
    if (!navLinks.length) return;

    // Build a map of section IDs that actually have nav links
    const sectionIds = [];
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
            sectionIds.push(href.substring(1));
        }
    });

    let ticking = false;

    function updateActiveLink() {
        const scrollY = window.scrollY;
        const navHeight = document.getElementById('navbar')?.offsetHeight || 80;
        let currentId = '';

        // Walk through sections top-to-bottom; the last one whose top
        // has scrolled past the navbar is the "current" section.
        for (const id of sectionIds) {
            const el = document.getElementById(id);
            if (!el) continue;
            if (el.offsetTop - navHeight - 40 <= scrollY) {
                currentId = id;
            }
        }

        // Actualizar clases
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === `#${currentId}`) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(updateActiveLink);
            ticking = true;
        }
    }, { passive: true });

    // Run once on load
    updateActiveLink();

    // Also update on click for instant feedback
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });
}

// ── Form Validation & Submission ──
function initFormValidation() {
    const form = document.getElementById('contactForm');

    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const nombre = form.querySelector('#nombre').value.trim();
        const telefono = form.querySelector('#telefono').value.trim();
        const objetivo = form.querySelector('#objetivo').value;

        // Basic validation
        if (!nombre || !telefono || !objetivo) {
            showFormMessage('Por favor, rellena todos los campos obligatorios.', 'error');
            return;
        }

        // Phone validation (basic)
        const phoneRegex = /^[\+]?[0-9\s\-]{9,15}$/;
        if (!phoneRegex.test(telefono)) {
            showFormMessage('Por favor, introduce un número de teléfono válido.', 'error');
            return;
        }

        // Submit success (placeholder — connect to backend/webhook)
        const submitBtn = form.querySelector('.form-submit');
        submitBtn.innerHTML = '✓ ¡Solicitud enviada!';
        submitBtn.style.background = 'linear-gradient(135deg, #2E7D32, #4CAF50)';
        submitBtn.disabled = true;

        showFormMessage('¡Gracias! Te contactaremos en menos de 24h para confirmar tu sesión gratuita.', 'success');

        // Reset after 5 seconds
        setTimeout(() => {
            form.reset();
            submitBtn.innerHTML = `Reservar mi sesión gratis <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
            submitBtn.style.background = '';
            submitBtn.disabled = false;
        }, 5000);
    });
}

function showFormMessage(message, type) {
    // Remove existing message
    const existing = document.querySelector('.form-feedback');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.className = 'form-feedback';
    div.style.cssText = `
    margin-top: 12px;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 0.9rem;
    text-align: center;
    animation: fadeIn 0.3s ease;
    ${type === 'success'
            ? 'background: rgba(46, 125, 50, 0.15); border: 1px solid rgba(46, 125, 50, 0.3); color: #4CAF50;'
            : 'background: rgba(239, 83, 80, 0.15); border: 1px solid rgba(239, 83, 80, 0.3); color: #ef5350;'
        }
  `;
    div.textContent = message;

    const form = document.getElementById('contactForm');
    form.appendChild(div);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        div.style.opacity = '0';
        div.style.transition = 'opacity 0.3s ease';
        setTimeout(() => div.remove(), 300);
    }, 5000);
}

// ── Parallax effect on hero (subtle) ──
window.addEventListener('scroll', () => {
    const hero = document.querySelector('.hero-bg img');
    if (hero && window.scrollY < window.innerHeight) {
        hero.style.transform = `scale(1.05) translateY(${window.scrollY * 0.15}px)`;
    }
}, { passive: true });
