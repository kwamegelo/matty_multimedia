// =====================================================
// MATTY PHOTOGRAPHY STUDIO - MODERN JAVASCRIPT
// =====================================================

(function() {
    'use strict';

    // =====================================================
    // STATE MANAGEMENT
    // =====================================================
    const state = {
        currentSlide: 0,
        slideCount: 3,
        autoplayInterval: null,
        autoplayDelay: 5000,
        isAutoplayPaused: false,
        mobileNavOpen: false,
        currentFilter: 'all'
    };

    // =====================================================
    // DOM ELEMENTS
    // =====================================================
    const DOM = {
        preloader: document.getElementById('preloader'),
        header: document.getElementById('header'),
        
        // Mobile Navigation
        mobileMenuBtn: document.getElementById('mobileMenuBtn'),
        mobileNav: document.getElementById('mobileNav'),
        mobileNavClose: document.getElementById('mobileNavClose'),
        mobileNavLinks: document.querySelectorAll('.mobile-nav-link'),
        
        // Desktop Navigation
        navLinks: document.querySelectorAll('.nav-link'),
        
        // Hero Slider
        heroSlides: document.querySelectorAll('.hero-slide'),
        heroDots: document.querySelector('.hero-dots'),
        heroPrev: document.querySelector('.hero-prev'),
        heroNext: document.querySelector('.hero-next'),
        
        // Portfolio
        filterTabs: document.querySelectorAll('.filter-tab'),
        galleryItems: document.querySelectorAll('.gallery-item'),
        
        // Contact Form
        submitBtn: document.getElementById('submitBtn'),
        
        // Lightbox
        lightbox: document.getElementById('lightbox'),
        lightboxImage: document.getElementById('lightboxImage'),
        
        // Back to Top
        backToTop: document.getElementById('backToTop')
    };

    // =====================================================
    // INITIALIZATION
    // =====================================================
    function init() {
        initPreloader();
        initNavigation();
        initHeroSlider();
        initScrollEffects();
        initPortfolioFilter();
        initContactForm();
        initBackToTop();
        initAnimationsOnScroll();
        
        console.log('%c✨ Matty Photography Studio', 
            'font-size: 16px; color: #007AFF; font-weight: bold; padding: 8px;');
    }

    // =====================================================
    // PRELOADER
    // =====================================================
    function initPreloader() {
        window.addEventListener('load', () => {
            setTimeout(() => {
                if (DOM.preloader) {
                    DOM.preloader.classList.add('hidden');
                }
            }, 1000);
        });
    }

    // =====================================================
    // NAVIGATION
    // =====================================================
    function initNavigation() {
        // Mobile menu toggle
        if (DOM.mobileMenuBtn) {
            DOM.mobileMenuBtn.addEventListener('click', toggleMobileNav);
        }

        if (DOM.mobileNavClose) {
            DOM.mobileNavClose.addEventListener('click', closeMobileNav);
        }

        // Close on overlay click
        if (DOM.mobileNav) {
            DOM.mobileNav.addEventListener('click', (e) => {
                if (e.target === DOM.mobileNav) {
                    closeMobileNav();
                }
            });
        }

        // Mobile nav links
        DOM.mobileNavLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.getAttribute('href');
                scrollToSection(target);
                closeMobileNav();
            });
        });

        // Desktop nav links
        DOM.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.getAttribute('href');
                scrollToSection(target);
            });
        });

        // Update active link on scroll
        window.addEventListener('scroll', debounce(updateActiveNavLink, 100));
    }

    function toggleMobileNav() {
        state.mobileNavOpen = !state.mobileNavOpen;
        
        if (state.mobileNavOpen) {
            DOM.mobileNav.classList.add('active');
            DOM.mobileMenuBtn.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            closeMobileNav();
        }
    }

    function closeMobileNav() {
        state.mobileNavOpen = false;
        DOM.mobileNav.classList.remove('active');
        DOM.mobileMenuBtn.classList.remove('active');
        document.body.style.overflow = '';
    }

    function scrollToSection(target) {
        const element = document.querySelector(target);
        if (element) {
            const headerHeight = 60;
            const offsetTop = element.offsetTop - headerHeight;
            
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });

            // Update active state
            DOM.navLinks.forEach(link => link.classList.remove('active'));
            const activeLink = document.querySelector(`.nav-link[href="${target}"]`);
            if (activeLink) activeLink.classList.add('active');
        }
    }

    function updateActiveNavLink() {
        const sections = document.querySelectorAll('section[id]');
        const scrollPosition = window.pageYOffset + 150;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            const sectionId = section.getAttribute('id');

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                DOM.navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    // =====================================================
    // HERO SLIDER
    // =====================================================
    function initHeroSlider() {
        if (!DOM.heroSlides.length) return;

        // Create dots
        createHeroDots();

        // Previous/Next buttons
        if (DOM.heroPrev) {
            DOM.heroPrev.addEventListener('click', previousSlide);
        }
        if (DOM.heroNext) {
            DOM.heroNext.addEventListener('click', nextSlide);
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') previousSlide();
            if (e.key === 'ArrowRight') nextSlide();
        });

        // Start autoplay
        startAutoplay();

        // Pause on hover
        const heroSection = document.querySelector('.hero');
        if (heroSection) {
            heroSection.addEventListener('mouseenter', pauseAutoplay);
            heroSection.addEventListener('mouseleave', resumeAutoplay);
        }

        // Pause on visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                pauseAutoplay();
            } else if (!state.isAutoplayPaused) {
                resumeAutoplay();
            }
        });

        // Touch support
        let touchStartX = 0;
        let touchEndX = 0;

        if (heroSection) {
            heroSection.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            });

            heroSection.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                handleSwipe();
            });
        }

        function handleSwipe() {
            if (touchEndX < touchStartX - 50) nextSlide();
            if (touchEndX > touchStartX + 50) previousSlide();
        }
    }

    function createHeroDots() {
        if (!DOM.heroDots) return;

        for (let i = 0; i < state.slideCount; i++) {
            const dot = document.createElement('button');
            dot.classList.add('hero-dot');
            if (i === 0) dot.classList.add('active');
            dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
            dot.addEventListener('click', () => goToSlide(i));
            DOM.heroDots.appendChild(dot);
        }
    }

    function goToSlide(index) {
        // Remove active from current slide
        DOM.heroSlides[state.currentSlide].classList.remove('active');
        const currentDot = DOM.heroDots.querySelector('.hero-dot.active');
        if (currentDot) currentDot.classList.remove('active');

        // Update current slide
        state.currentSlide = index;

        // Add active to new slide
        DOM.heroSlides[state.currentSlide].classList.add('active');
        const dots = DOM.heroDots.querySelectorAll('.hero-dot');
        if (dots[state.currentSlide]) {
            dots[state.currentSlide].classList.add('active');
        }

        // Reset autoplay
        if (!state.isAutoplayPaused) {
            stopAutoplay();
            startAutoplay();
        }
    }

    function nextSlide() {
        const nextIndex = (state.currentSlide + 1) % state.slideCount;
        goToSlide(nextIndex);
    }

    function previousSlide() {
        const prevIndex = (state.currentSlide - 1 + state.slideCount) % state.slideCount;
        goToSlide(prevIndex);
    }

    function startAutoplay() {
        state.autoplayInterval = setInterval(() => {
            nextSlide();
        }, state.autoplayDelay);
    }

    function stopAutoplay() {
        if (state.autoplayInterval) {
            clearInterval(state.autoplayInterval);
            state.autoplayInterval = null;
        }
    }

    function pauseAutoplay() {
        state.isAutoplayPaused = true;
        stopAutoplay();
    }

    function resumeAutoplay() {
        state.isAutoplayPaused = false;
        startAutoplay();
    }

    // =====================================================
    // SCROLL EFFECTS
    // =====================================================
    function initScrollEffects() {
        window.addEventListener('scroll', debounce(handleScroll, 10));
        handleScroll();
    }

    function handleScroll() {
        const scrollY = window.pageYOffset;

        // Header scroll effect
        if (DOM.header) {
            if (scrollY > 20) {
                DOM.header.classList.add('scrolled');
            } else {
                DOM.header.classList.remove('scrolled');
            }
        }
    }

    // =====================================================
    // PORTFOLIO FILTER
    // =====================================================
    function initPortfolioFilter() {
        DOM.filterTabs.forEach(tab => {
            tab.addEventListener('click', handleFilterClick);
        });
    }

    function handleFilterClick(e) {
        const tab = e.currentTarget;
        
        // Update active tab
        DOM.filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Get filter value
        const filterValue = tab.getAttribute('data-filter');
        state.currentFilter = filterValue;

        // Filter gallery
        filterGallery(filterValue);
    }

    function filterGallery(filter) {
        DOM.galleryItems.forEach((item, index) => {
            const category = item.getAttribute('data-category');
            const shouldShow = filter === 'all' || category === filter;

            if (shouldShow) {
                item.classList.remove('hidden');
                
                // Stagger animation
                setTimeout(() => {
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(20px)';
                    
                    setTimeout(() => {
                        item.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0)';
                    }, 50);
                }, index * 60);
            } else {
                item.style.opacity = '0';
                item.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    item.classList.add('hidden');
                }, 400);
            }
        });
    }

    // =====================================================
    // LIGHTBOX
    // =====================================================
    window.openLightbox = function(button) {
        const card = button.closest('.gallery-card');
        const img = card.querySelector('img');
        
        if (img && DOM.lightbox && DOM.lightboxImage) {
            DOM.lightboxImage.src = img.src;
            DOM.lightboxImage.alt = img.alt;
            DOM.lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    };

    window.closeLightbox = function() {
        if (DOM.lightbox) {
            DOM.lightbox.classList.remove('active');
            document.body.style.overflow = '';
        }
    };

    // Close lightbox on background click
    if (DOM.lightbox) {
        DOM.lightbox.addEventListener('click', function(e) {
            if (e.target === DOM.lightbox) {
                window.closeLightbox();
            }
        });
    }

    // Close lightbox with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && DOM.lightbox && DOM.lightbox.classList.contains('active')) {
            window.closeLightbox();
        }
    });

    // =====================================================
    // CONTACT FORM
    // =====================================================
    function initContactForm() {
        if (DOM.submitBtn) {
            DOM.submitBtn.addEventListener('click', handleFormSubmit);
        }
    }

    function handleFormSubmit(e) {
        e.preventDefault();

        // Get form data
        const formData = {
            name: document.getElementById('name')?.value || '',
            email: document.getElementById('email')?.value || '',
            phone: document.getElementById('phone')?.value || '',
            service: document.getElementById('service')?.value || '',
            message: document.getElementById('message')?.value || ''
        };

        // Validate
        if (!validateForm(formData)) {
            return;
        }

        // Show loading state
        const originalHTML = DOM.submitBtn.innerHTML;
        DOM.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Sending...</span>';
        DOM.submitBtn.disabled = true;

        // Simulate submission
        setTimeout(() => {
            console.log('Form submitted:', formData);
            
            showNotification('Thank you! Your message has been sent successfully. We\'ll get back to you within 24 hours.', 'success');
            
            // Reset form
            document.getElementById('name').value = '';
            document.getElementById('email').value = '';
            document.getElementById('phone').value = '';
            document.getElementById('service').value = '';
            document.getElementById('message').value = '';
            
            DOM.submitBtn.innerHTML = originalHTML;
            DOM.submitBtn.disabled = false;
        }, 1500);
    }

    function validateForm(data) {
        if (!data.name || data.name.length < 2) {
            showNotification('Please enter a valid name', 'error');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            showNotification('Please enter a valid email address', 'error');
            return false;
        }

        if (!data.service) {
            showNotification('Please select a service', 'error');
            return false;
        }

        if (!data.message || data.message.length < 10) {
            showNotification('Please enter a message (at least 10 characters)', 'error');
            return false;
        }

        return true;
    }

    // =====================================================
    // BACK TO TOP BUTTON
    // =====================================================
    function initBackToTop() {
        if (!DOM.backToTop) return;

        window.addEventListener('scroll', debounce(() => {
            if (window.pageYOffset > 500) {
                DOM.backToTop.classList.add('visible');
            } else {
                DOM.backToTop.classList.remove('visible');
            }
        }, 100));

        DOM.backToTop.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // =====================================================
    // SCROLL ANIMATIONS
    // =====================================================
    function initAnimationsOnScroll() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observe elements
        const animateElements = document.querySelectorAll(
            '.feature-card, .service-card, .testimonial-card, .section-header'
        );

        animateElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }

    // =====================================================
    // NOTIFICATION SYSTEM
    // =====================================================
    function showNotification(message, type = 'info') {
        // Remove existing notification
        const existing = document.querySelector('.notification');
        if (existing) {
            existing.remove();
        }

        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icons = {
            success: '<i class="fas fa-check-circle"></i>',
            error: '<i class="fas fa-exclamation-circle"></i>',
            info: '<i class="fas fa-info-circle"></i>'
        };
        
        notification.innerHTML = `
            ${icons[type] || icons.info}
            <span>${message}</span>
        `;

        // Styles
        const colors = {
            success: '#34C759',
            error: '#FF3B30',
            info: '#007AFF'
        };

        Object.assign(notification.style, {
            position: 'fixed',
            top: '80px',
            right: '24px',
            padding: '16px 24px',
            borderRadius: '12px',
            backgroundColor: colors[type] || colors.info,
            color: 'white',
            fontWeight: '500',
            fontSize: '15px',
            zIndex: '10000',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            maxWidth: '400px',
            animation: 'slideInRight 0.3s ease',
            fontFamily: 'Inter, sans-serif'
        });

        document.body.appendChild(notification);

        // Auto remove
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    // Add notification animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
        @media (max-width: 768px) {
            .notification {
                right: 16px !important;
                left: 16px !important;
                max-width: calc(100% - 32px) !important;
                top: 70px !important;
            }
        }
    `;
    document.head.appendChild(style);

    // =====================================================
    // UTILITY FUNCTIONS
    // =====================================================
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // =====================================================
    // SMOOTH SCROLL POLYFILL
    // =====================================================
    function smoothScrollPolyfill() {
        if (!('scrollBehavior' in document.documentElement.style)) {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/smoothscroll/1.4.10/SmoothScroll.min.js';
            document.body.appendChild(script);
        }
    }

    // =====================================================
    // PERFORMANCE OPTIMIZATION
    // =====================================================
    function optimizeImages() {
        // Add loading="lazy" to images
        const images = document.querySelectorAll('img:not([loading])');
        images.forEach(img => {
            img.setAttribute('loading', 'lazy');
        });
    }

    // =====================================================
    // INITIALIZE ON DOM READY
    // =====================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            init();
            smoothScrollPolyfill();
            optimizeImages();
        });
    } else {
        init();
        smoothScrollPolyfill();
        optimizeImages();
    }

    // =====================================================
    // WINDOW RESIZE HANDLER
    // =====================================================
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            // Close mobile nav on resize to desktop
            if (window.innerWidth > 1024 && state.mobileNavOpen) {
                closeMobileNav();
            }
        }, 250);
    });

})();