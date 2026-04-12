/*=============== SHOW MENU ===============*/
const navMenu = document.getElementById('nav-menu'),
      navToggle = document.getElementById('nav-toggle'),
      navClose = document.getElementById('nav-close')

/* Menu show */
if (navToggle) {
    navToggle.addEventListener('click', () => {
        navMenu.classList.add('show-menu')
    })
}

/* Menu hidden */
if (navClose) {
    navClose.addEventListener('click', () => {
        navMenu.classList.remove('show-menu')
    })
}

/*=============== REMOVE MENU MOBILE ===============*/
const navLink = document.querySelectorAll('.nav__link')

const linkAction = () => {
    const navMenu = document.getElementById('nav-menu')
    navMenu.classList.remove('show-menu')
}
navLink.forEach(n => n.addEventListener('click', linkAction))

/*=============== SWIPER SERVICES ===============*/
const swiperServices = new Swiper('.services__swiper', {
    loop: true,
    grabCursor: true,
    spaceBetween: 20,
    slidesPerView: 'auto',
    centeredSlides: false,
    pagination: {
        el: '.swiper-pagination',
        clickable: true,
    },
    breakpoints: {
        768: {
            slidesPerView: 2,
            spaceBetween: 24,
        },
        1150: {
            slidesPerView: 3,
            spaceBetween: 24,
        }
    }
});

/*=============== PERFORMANCE: CENTRALIZED SCROLL EVENTS ===============*/
const header = document.getElementById('header')
const scrollUpBtn = document.getElementById('scroll-up')

const scrollHandler = () => {
    // 1. Change Background Header
    window.scrollY >= 50 ? header.classList.add('bg-header') 
                         : header.classList.remove('bg-header')
                         
    // 2. Show Scroll Up Button
    window.scrollY >= 350 ? scrollUpBtn.classList.add('show-scroll') 
                          : scrollUpBtn.classList.remove('show-scroll')
}

// Ouve o evento de scroll uma única vez
window.addEventListener('scroll', scrollHandler)
scrollHandler() // Inicializa os estados no carregamento da página

/*=============== SCROLL SECTIONS ACTIVE LINK (IntersectionObserver) ===============*/
const sections = document.querySelectorAll('section[id]')

const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.4 // Ativa o link quando 40% da seção estiver visível na tela
};

const observerCallback = (entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const id = entry.target.id;
            const link = document.querySelector(`.nav__menu a[href*=${id}]`);
            
            // Remove a classe de todos os links antes de adicionar no novo
            document.querySelectorAll('.nav__link').forEach(n => n.classList.remove('active-link'));
            
            if (link) {
                link.classList.add('active-link');
            }
        }
    });
};

const sectionObserver = new IntersectionObserver(observerCallback, observerOptions);

sections.forEach(section => {
    sectionObserver.observe(section);
});

/*=============== SCROLL REVEAL ANIMATION ===============*/
const sr = ScrollReveal({
    origin: 'top',
    distance: '100px',
    duration: 2500,
    delay: 400,
    // reset: true, // se quiser que a animação se repita toda vez que o usuário rolar a página
});

sr.reveal('.home__content, .services__data, .services__swiper, .footer__container')
sr.reveal('.home__images', { origin: 'bottom', delay: 1000 })
sr.reveal('.about__images, .contact__img', { origin: 'left', })
sr.reveal('.about__data, .contact__data', { origin: 'right', })
sr.reveal('.projects__card', { interval: 100 })
    
