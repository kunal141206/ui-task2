;(function () {
  'use strict';

  // ── Skip if user prefers reduced motion ───────────────────
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // ── Timing constants ──────────────────────────────────────
  var TRANS       = 'transform 0.72s cubic-bezier(0.4,0,0.2,1), opacity 0.60s ease';
  var SWAP_DELAY  = 380;   // ms: wait for exit animation before swapping content
  var WAVE_EVERY  = 4000;  // ms: interval between animation waves
  var STAGGER     = 200;   // ms: stagger delay between tiles in same wave
  var LOAD_SETTLE = 1500;  // ms: wait for page-load CSS animations to finish

  // ── Content pools ─────────────────────────────────────────
  var LABELS = [
    'Transform', 'Convert', 'Growth', 'Strategy', 'Attract',
    'Innovate',  'Elevate', 'Scale',  'Deliver',  'Engage', 'Accelerate'
  ];
  var labelCursors = {};

  function nextLabelFor(key) {
    if (labelCursors[key] === undefined) {
      var idx = LABELS.indexOf(key);
      labelCursors[key] = (idx >= 0 ? idx + 1 : 0);
    }
    var val = LABELS[labelCursors[key] % LABELS.length];
    labelCursors[key]++;
    return val;
  }

  var AWARDS = [
    { type: 'clutch',       title: 'Top B2B',    desc: 'Providers in the Indian Emerging Tech Market for 2021' },
    { type: 'goodfirms',   title: 'Top Shopify', desc: 'Development Companies in 2019' },
    { type: 'clutch',       title: 'Top 12',      desc: 'Out of 400 top Mobile App Developers in India, 2020' },
    { type: 'clutch',       title: 'Top IT',      desc: 'Consulting Firms in South Asia, 2022' },
    { type: 'goodfirms',   title: 'Top Web Dev', desc: 'Development Agencies Globally, 2021' },
    { type: 'clutch',       title: 'Top UX',      desc: 'Design Studios in India for 2023' },
    { type: 'crowdreviews', title: '#1',          desc: 'ASP.NET Development Company' },
    { type: 'crowdreviews', title: 'Top 3',       desc: 'E-Commerce Development Company' },
    { type: 'crowdreviews', title: 'Top 10',      desc: 'Web Development Company' },
    { type: 'clutch',       title: 'Top 1000',    desc: 'B2B Companies 2018' }
  ];
  var awardCursors = {};

  function nextAwardFor(key) {
    if (awardCursors[key] === undefined) awardCursors[key] = (key === 'clutch2' ? 2 : 0);
    var award = AWARDS[awardCursors[key] % AWARDS.length];
    awardCursors[key]++;
    return award;
  }

  var CLUTCH_IMG = '<img src="Images/Group 27.svg" alt="Clutch" class="award-logo-img">';
  var GF_IMG     = '<img src="Images/image 9.svg" alt="GoodFirms" class="award-logo-img">';
  var CR_LOGO    = '<span class="t-brand--cr"><span class="cr-crowd">Crowd</span><span class="cr-reviews">Reviews</span><br><span class="cr-sub">Buyers Guide Based On Your Reviews</span></span>';

  function buildAwardHTML(award) {
    if (award.type === 'clutch') {
      return '<span class="t-brand">' + CLUTCH_IMG + '</span>'
           + '<span class="t-stars">★★★★★</span>'
           + '<strong class="t-title">' + award.title + '</strong>'
           + '<span class="t-desc">' + award.desc + '</span>';
    } else if (award.type === 'goodfirms') {
      return '<span class="t-brand t-brand--gf">' + GF_IMG + '</span>'
           + '<strong class="t-title">' + award.title + '</strong>'
           + '<span class="t-desc">' + award.desc + '</span>';
    } else {
      // CrowdReviews
      return CR_LOGO
           + '<strong class="t-title">' + award.title + '</strong>'
           + '<span class="t-desc">' + award.desc + '</span>';
    }
  }

  // ── Animation directions ──────────────────────────────────
  var DIRS_DESKTOP = [
    { exit: 'ta-exit-left',  enter: 'ta-from-right' },
    { exit: 'ta-exit-right', enter: 'ta-from-left'  },
    { exit: 'ta-exit-up',    enter: 'ta-from-down'  },
    { exit: 'ta-exit-down',  enter: 'ta-from-up'    }
  ];

  var DIRS_MOBILE = [
    { exit: 'ma-exit-up',    enter: 'ma-from-down'  },
    { exit: 'ma-exit-down',  enter: 'ma-from-up'    },
    { exit: 'ma-exit-left',  enter: 'ma-from-right' },
    { exit: 'ma-exit-right', enter: 'ma-from-left'  }
  ];

  function randItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  // ── Enable transitions on all tile inners ─────────────────
  function enableTransitions() {
    document.querySelectorAll('.badge-cell .tile-inner').forEach(function (el) {
      el.style.transition = TRANS;
    });
    document.querySelectorAll('.mb-cell .mb-inner').forEach(function (el) {
      el.style.transition = TRANS;
    });
  }

  // ── Core swap function — works for both desktop and mobile ──
  // innerSel: '.tile-inner' or '.mb-inner'
  // dirs: DIRS_DESKTOP or DIRS_MOBILE
  // updateFn: function(inner) updates innerHTML, or null for motion-only
  function swapCell(cell, innerSel, dirs, updateFn) {
    if (cell._swapping) return;
    cell._swapping = true;

    var inner = cell.querySelector(innerSel);
    if (!inner) { cell._swapping = false; return; }
    var dir = randItem(dirs);

    // 1. Add exit class — transition is already set, tile slides OUT
    cell.classList.add(dir.exit);

    setTimeout(function () {
      // 2. Update content while tile is off-screen
      if (typeof updateFn === 'function') updateFn(inner);

      // 3. Disable transition, remove exit class, add enter-from class
      //    This SNAPS the inner to the opposite off-screen edge instantly
      inner.style.transition = 'none';
      cell.classList.remove(dir.exit);
      cell.classList.add(dir.enter);

      // 4. Force a reflow so the browser registers the snapped position
      void inner.offsetWidth;

      // 5. Re-enable transition, remove enter-from — browser animates from
      //    the snapped position to natural (transform:none, opacity:1 via inline)
      inner.style.transition = TRANS;
      cell.classList.remove(dir.enter);

      // 6. Unlock after the slide-in completes
      setTimeout(function () { cell._swapping = false; }, 750);

    }, SWAP_DELAY);
  }

  // ── Swap a single desktop tile ────────────────────────────
  function swapDesktopTile(cell) {
    var tileType = cell.dataset.tiletype;
    var tileKey  = cell.dataset.tilekey;
    var updateFn = null;

    if (tileType === 'label' && tileKey) {
      updateFn = function (inner) {
        inner.innerHTML = '<span class="label-text">' + nextLabelFor(tileKey) + '</span>';
      };
    } else if (tileType === 'award' && tileKey) {
      updateFn = function (inner) {
        inner.innerHTML = buildAwardHTML(nextAwardFor(tileKey));
      };
    }
    // microsoft/filler: motion only (updateFn stays null)

    swapCell(cell, '.tile-inner', DIRS_DESKTOP, updateFn);
  }

  // ── Swap a single mobile tile ─────────────────────────────
  function swapMobileTile(cell) {
    var tileType = cell.dataset.mbtile;
    var updateFn = null;

    if (tileType === 'label') {
      updateFn = function (inner) {
        var current = inner.textContent.trim();
        var next = current;
        var attempts = 0;
        while (next === current && attempts < 8) {
          next = LABELS[Math.floor(Math.random() * LABELS.length)];
          attempts++;
        }
        inner.textContent = next;
      };
    }
    // award/microsoft/filler on mobile: motion only

    swapCell(cell, '.mb-inner', DIRS_MOBILE, updateFn);
  }

  // ── Desktop animation wave ────────────────────────────────
  function runDesktopWave() {
    var all = Array.from(document.querySelectorAll('.badge-cell[data-tiletype]'));

    // Animatable = label tiles + award tiles
    var animatable = all.filter(function (c) {
      return c.dataset.tiletype === 'label' || c.dataset.tiletype === 'award';
    });

    // Shuffle
    for (var i = animatable.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = animatable[i]; animatable[i] = animatable[j]; animatable[j] = tmp;
    }

    // Pick 2, 3, or 4 tiles per wave
    var clusterSize = Math.random() < 0.45 ? 2 : (Math.random() < 0.65 ? 3 : 4);
    var cluster = animatable.slice(0, clusterSize);

    cluster.forEach(function (cell, i) {
      setTimeout(function () { swapDesktopTile(cell); }, i * STAGGER);
    });

    // Occasionally also pulse the Microsoft tile (motion-only)
    if (Math.random() < 0.35) {
      var ms = document.querySelector('.tile-microsoft');
      if (ms && !ms._swapping) {
        setTimeout(function () { swapDesktopTile(ms); }, clusterSize * STAGGER + 150);
      }
    }
  }

  // ── Mobile animation wave ─────────────────────────────────
  function runMobileWave() {
    var labels = Array.from(document.querySelectorAll('.mb-cell[data-mbtile="label"]'));

    // Fisher-Yates shuffle
    for (var i = labels.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = labels[i]; labels[i] = labels[j]; labels[j] = tmp;
    }

    // Animate 2 or 3 label tiles per wave (was 1, too slow)
    var clusterSize = Math.random() < 0.5 ? 3 : 4;
    labels.slice(0, clusterSize).forEach(function (cell, i) {
      setTimeout(function () { swapMobileTile(cell); }, i * (STAGGER + 60));
    });
  }

  // ── Bootstrap ─────────────────────────────────────────────
  var _waveInterval = null;

  function startWaves() {
    var w = window.innerWidth;
    // Tablets (768px+) use desktop grid — mobile only below 768px
    var isDesktop = (w >= 768);

    if (_waveInterval) {
      clearInterval(_waveInterval);
      _waveInterval = null;
    }

    if (isDesktop) {
      // Fire first wave quickly, then repeat
      setTimeout(runDesktopWave, 300);
      _waveInterval = setInterval(runDesktopWave, WAVE_EVERY);
    } else {
      setTimeout(runMobileWave, 500);
      _waveInterval = setInterval(runMobileWave, WAVE_EVERY - 500);
    }
  }

//   document.addEventListener('DOMContentLoaded', function () {
//     setTimeout(function () {
//       enableTransitions();
//       startWaves();
//     }, LOAD_SETTLE);
//   });

window.addEventListener('load', function () {
    enableTransitions();
    startWaves();
});

  // Restart waves on resize (e.g. orientation change)
  var _resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(function () {
      enableTransitions();
      startWaves();
    }, 300);
  });

}());


$(document).ready(function() {
    // ========== MOBILE MENU ==========
    $('#hamburger').on('click', function() {
        $(this).toggleClass('active');
        $('#navMenu').addClass('active');
        $('#menuOverlay').addClass('active');
        $('body').css('overflow', 'hidden');
    });

    $('#navClose, #menuOverlay').on('click', function() {
        $('#hamburger').removeClass('active');
        $('#navMenu').removeClass('active');
        $('#menuOverlay').removeClass('active');
        $('body').css('overflow', 'auto');
    });

    // Close menu on escape key
    $(document).on('keydown', function(e) {
        if (e.key === 'Escape' && $('#navMenu').hasClass('active')) {
            $('#hamburger').removeClass('active');
            $('#navMenu').removeClass('active');
            $('#menuOverlay').removeClass('active');
            $('body').css('overflow', 'auto');
        }
    });

    // ========== MOBILE ACCORDION ==========
    $('.accordion-btn').on('click', function() {
        const $this = $(this);
        const $item = $this.parent();
        const $content = $this.next('.accordion-content');
        const accordionId = $this.data('accordion');
        
        // Check if this accordion is already open
        const isActive = $this.hasClass('active');
        
        // Close all accordions
        $('.accordion-btn').removeClass('active');
        $('.accordion-content').removeClass('active').css('max-height', '0');
        
        // If this wasn't already active, open it
        if (!isActive) {
            $this.addClass('active');
            $content.addClass('active');
            
            // Calculate and set max-height for smooth animation
            const contentHeight = $content.find('.accordion-inner').outerHeight();
            $content.css('max-height', contentHeight + 'px');
            
            // // Smooth scroll to accordion on mobile
            // if ($(window).width() < 768) {
            //     setTimeout(function() {
            //         $('html, body').animate({
            //             scrollTop: $item.offset().top - 100
            //         }, 400);
            //     }, 100);
            // }
        }
    });

    // ========== DESKTOP TABS ==========
    $('.tab-btn').on('click', function() {
        const tabId = $(this).data('tab');
        
        // Remove active class from all tabs and content
        $('.tab-btn').removeClass('active');
        $('.tab-content').removeClass('active');
        
        // Add active class to clicked tab
        $(this).addClass('active');
        
        // Show corresponding content
        $('#' + tabId).addClass('active');
        
        // Add fade-in animation
        $('#' + tabId).addClass('fade-in');
        setTimeout(function() {
            $('#' + tabId).removeClass('fade-in');
        }, 600);
    });

    // ========== SMOOTH SCROLL ==========
    $('a[href^="#"]').on('click', function(e) {
        const target = $(this).attr('href');
        
        if (target !== '#' && $(target).length) {
            e.preventDefault();
            
            // Close mobile menu if open
            $('#hamburger').removeClass('active');
            $('#navMenu').removeClass('active');
            $('#menuOverlay').removeClass('active');
            $('body').css('overflow', 'auto');
            
            $('html, body').animate({
                scrollTop: $(target).offset().top - 80
            }, 800);
        }
    });

    // ========== PORTFOLIO SCROLL ANIMATION ==========
    function animateOnScroll() {
        $('.portfolio-item').each(function(index) {
            const elementTop = $(this).offset().top;
            const elementBottom = elementTop + $(this).outerHeight();
            const viewportTop = $(window).scrollTop();
            const viewportBottom = viewportTop + $(window).height();
            
            if (elementBottom > viewportTop && elementTop < viewportBottom) {
                setTimeout(function() {
                    $(this).css({
                        'opacity': '1',
                        'transform': 'translateY(0)'
                    });
                }.bind(this), index * 10);
            }
        });

        // Animate team photos
        $('.team-photo').each(function(index) {
            const elementTop = $(this).offset().top;
            const elementBottom = elementTop + $(this).outerHeight();
            const viewportTop = $(window).scrollTop();
            const viewportBottom = viewportTop + $(window).height();
            
            if (elementBottom > viewportTop && elementTop < viewportBottom) {
                setTimeout(function() {
                    $(this).css({
                        'opacity': '1',
                        'transform': 'scale(1)'
                    });
                }.bind(this), index * 100);
            }
        });
    }

    // Initial state for animations
    $('.portfolio-item').css({
       'transition': 'all 0.6s ease-out'
    });

    $('.team-photo').css({
        'transition': 'all 0.5s ease-out'
    });

    // ========== HEADER SCROLL EFFECT ==========
    // let lastScroll = 0;
    // $(window).on('scroll', function() {
    //     const currentScroll = $(window).scrollTop();
        
    //     // Change header shadow on scroll
    //     if (currentScroll > 50) {
    //         $('.header').css('box-shadow', '0 4px 20px rgba(0, 0, 0, 0.15)');
    //     } else {
    //         $('.header').css('box-shadow', '0 2px 10px rgba(0, 0, 0, 0.1)');
    //     }
        
    //     // Trigger scroll animations
    //     animateOnScroll();
        
    //     lastScroll = currentScroll;
    // });

    // Trigger animations on page load
    // setTimeout(animateOnScroll, 300);

    $(window).on('load', function() {
    animateOnScroll();
});

    // ========== DROPDOWN MENU (DESKTOP) ==========
    if ($(window).width() > 1023) {
        $('.dropdown').hover(
            function() {
                $(this).find('.arrow').css('transform', 'rotate(180deg)');
            },
            function() {
                $(this).find('.arrow').css('transform', 'rotate(0deg)');
            }
        );
    }

    // ========== RESPONSIVE BEHAVIOR ==========
    let resizeTimer;
    $(window).on('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            const windowWidth = $(window).width();
            
            // Close mobile menu on resize to desktop
            if (windowWidth > 1023) {
                $('#hamburger').removeClass('active');
                $('#navMenu').removeClass('active');
                $('#menuOverlay').removeClass('active');
                $('body').css('overflow', 'auto');
            }
            
            // Recalculate accordion heights
            $('.accordion-content.active').each(function() {
                const contentHeight = $(this).find('.accordion-inner').outerHeight();
                $(this).css('max-height', contentHeight + 'px');
            });
        }, 250);
    });

    // ========== BADGE HOVER EFFECTS ==========
    if ($(window).width() > 1023) {
        $('.badge').hover(
            function() {
                $(this).css({
                    'transform': 'scale(1.03)',
                    'transition': 'transform 0.3s ease'
                });
            },
            function() {
                $(this).css('transform', 'scale(1)');
            }
        );
    }

    // ========== SERVICE LINKS HOVER ==========
    $('.service-column a').hover(
        function() {
            $(this).css('color', '#4f149a');
        },
        function() {
            $(this).css('color', '#333');
        }
    );

    // ========== PAGE LOAD ANIMATION ==========
    // $('body').css('opacity', '0');
    // $(window).on('load', function() {
    //     $('body').animate({ opacity: 1 }, 600);
    // });

    // ========== MOBILE BADGE GRID TOUCH EFFECTS ==========
    if ('ontouchstart' in window) {
        $('.badge, .service-label-mobile').on('touchstart', function() {
            $(this).css('opacity', '0.8');
        }).on('touchend', function() {
            $(this).css('opacity', '1');
        });
    }

    // ========== ACCORDION CONTENT HEIGHT ADJUSTMENT ==========
    // Recalculate heights when window is loaded (for dynamic content)
    $(window).on('load', function() {
        $('.accordion-content.active').each(function() {
            const contentHeight = $(this).find('.accordion-inner').outerHeight();
            $(this).css('max-height', contentHeight + 'px');
        });
    });

    // ========== PREVENT SCROLL WHEN MENU IS OPEN ==========
    let scrollPosition = 0;
    
    function lockScroll() {
        scrollPosition = $(window).scrollTop();
        $('body').css({
            'overflow': 'hidden',
            'position': 'fixed',
            'top': -scrollPosition + 'px',
            'width': '100%'
        });
    }
    
    function unlockScroll() {
        $('body').css({
            'overflow': '',
            'position': '',
            'top': '',
            'width': ''
        });
        $(window).scrollTop(scrollPosition);
    }
    
    $('#hamburger').on('click', function() {
        lockScroll();
    });
    
    $('#navClose, #menuOverlay').on('click', function() {
        unlockScroll();
    });

    // ========== LAZY LOAD OPTIMIZATION ==========
    // function lazyLoadBackgrounds() {
    //     $('.portfolio-item').each(function() {
    //         const elementTop = $(this).offset().top;
    //         const viewportBottom = $(window).scrollTop() + $(window).height();
            
    //         if (elementTop < viewportBottom + 400) {
    //             $(this).addClass('loaded');
    //         }
    //     });
    // }

    // $(window).on('scroll', lazyLoadBackgrounds);
    // lazyLoadBackgrounds();

    // ========== ACCESSIBILITY ENHANCEMENTS ==========
    // Tab key navigation for accordion
    $('.accordion-btn').on('keypress', function(e) {
        if (e.which === 13 || e.which === 32) { // Enter or Space
            e.preventDefault();
            $(this).click();
        }
    });

    // Tab key navigation for tab buttons
    $('.tab-btn').on('keypress', function(e) {
        if (e.which === 13 || e.which === 32) { // Enter or Space
            e.preventDefault();
            $(this).click();
        }
    });

    // ========== PERFORMANCE OPTIMIZATION ==========
    // Debounce scroll event
    let scrollTimer;
    let ticking = false;
    
    $(window).on('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(function() {
                animateOnScroll();
                ticking = false;
            });
            ticking = true;
        }
    });

    // ========== CONSOLE BRANDING ==========
    console.log('%c Welcome to KeyIdeas IT Consulting ', 'background: #6637c5; color: white; font-size: 16px; padding: 10px; border-radius: 5px;');
    console.log('%c Agility, Ingenuity, Reliability: Powering Progress ', 'color: #4f149a; font-size: 14px; font-weight: bold; padding: 5px;');
    console.log('%c Responsive Design: Mobile, Tablet & Desktop ✓ ', 'color: #7646d7; font-size: 12px; padding: 5px;');

    // ========== DETECT MOBILE OS ==========
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
        $('body').addClass('mobile-device');
        console.log('%c Mobile Device Detected ', 'background: #4f149a; color: white; padding: 5px;');
    }

    // ========== SMOOTH SCROLL POLYFILL FOR SAFARI ==========
    if (!('scrollBehavior' in document.documentElement.style)) {
        $('a[href^="#"]').on('click', function(e) {
            e.preventDefault();
            const target = $(this.hash);
            if (target.length) {
                $('html, body').stop().animate({
                    scrollTop: target.offset().top - 80
                }, 800);
            }
        });
    }
});
// ====================================================
// SLIDER FACTORY — shared logic for Experiences + Stories
// Supports: arrow-click, touch-drag, auto-advance
// No pagination dots
// ====================================================
function createSlider(options) {
    var trackEl  = document.getElementById(options.trackId);
    if (!trackEl) return;

    var SLIDES   = options.slides;
    var total    = SLIDES.length;
    var all      = [SLIDES[total - 1]].concat(SLIDES).concat([SLIDES[0]]);
    var current  = 0;
    var locked   = false;
    var autoTimer;

    // Build slides
    all.forEach(function(item) {
        var slide = document.createElement('div');
        slide.className = 'portfolio-slide ' + item.cls;
        // Inline these so mobile browsers trigger background-image fetch immediately
        // (dynamically-added elements don't always fire CSS bg-image loads on first paint)
        slide.style.backgroundSize = 'cover';
        slide.style.backgroundPosition = 'center';
        var linksHtml = (item.links || []).map(function(l) {
            return '<p><a href="' + l.url + '">' + l.label +
                   ' <img decoding="async" src="Images/arrow-left.webp" alt="arrow-left"></a></p>';
        }).join('');
        slide.innerHTML =
            '<div class="hover-elem">' +
            '<div class="work-title">' + item.title + '</div>' +
            '<div class="work-links">' + linksHtml + '</div>' +
            '</div>';
        trackEl.appendChild(slide);
    });

    function slideWidth() {
        var s = trackEl.querySelector('.portfolio-slide');
        return s ? s.offsetWidth + 14 : 0;
    }

    function jump(idx, animate) {
        var offset = -(idx + 1) * slideWidth();
        trackEl.style.transition = animate
            ? 'transform 0.32s cubic-bezier(0.4, 0.0, 0.2, 1)'
            : 'none';
        trackEl.style.transform = 'translateX(' + offset + 'px)';
    }

    function advance(dir) {
        if (locked) return;
        locked = true;
        current += dir;
        var domPos = current + 1;
        trackEl.style.transition = 'transform 0.32s cubic-bezier(0.4, 0.0, 0.2, 1)';
        trackEl.style.transform = 'translateX(' + (-domPos * slideWidth()) + 'px)';
        setTimeout(function() {
            if (current >= total)  { current = 0; jump(0, false); }
            else if (current < 0)  { current = total - 1; jump(total - 1, false); }
            locked = false;
        }, 400);
    }

    jump(0, false);

    // Auto-play
    function startAuto() { 
        // autoTimer = setInterval(function() { advance(1); }, 4500);
     }
    function stopAuto()  { 
        // clearInterval(autoTimer);
     }
    // startAuto();

    // Touch drag
    var tx0 = 0, ty0 = 0, txNow = 0, dragging = false, tStart = 0;
    trackEl.addEventListener('touchstart', function(e) {
        tx0 = e.touches[0].clientX; ty0 = e.touches[0].clientY;
        txNow = tx0; tStart = Date.now(); dragging = true;
        stopAuto(); trackEl.style.transition = 'none';
    }, { passive: true });
    trackEl.addEventListener('touchmove', function(e) {
        if (!dragging) return;
        txNow = e.touches[0].clientX;
        var dX = txNow - tx0, dY = Math.abs(e.touches[0].clientY - ty0);
        if (Math.abs(dX) > dY) {
            trackEl.style.transform = 'translateX(' + (-((current + 1) * slideWidth()) + dX) + 'px)';
        }
    }, { passive: true });
    trackEl.addEventListener('touchend', function() {
        if (!dragging) return;
        dragging = false;
        var dX = txNow - tx0, vel = Math.abs(dX) / Math.max(1, Date.now() - tStart);
        if (Math.abs(dX) > 48 || vel > 0.35) advance(dX < 0 ? 1 : -1);
        else jump(current, true);
        // startAuto();
    }, { passive: true });

    window.addEventListener('orientationchange', function() {
        setTimeout(function() { jump(current, false); }, 200);
    });
}

// Only init sliders on mobile
// Wrapped in DOMContentLoaded so the DOM is ready and slideWidth() returns correct values
document.addEventListener('DOMContentLoaded', function() {
if (window.innerWidth < 1024) {

    // Preload slider background images so mobile browsers fetch them before slides are built
    (function preloadSliderImages() {
        var imgs = [
            'Images/top_software_experts-_services.webp',
            'Images/top_software_experts_services_near_me.webp',
            'Images/best_software_experts_near_me.webp',
            'Images/best_software_expert_services_near_me.webp',
            'Images/top_it_consulting_agency.webp',
            'Images/best_it_consulting_agency.webp',
            'Images/best_it_consulting_services.webp',
            'Images/top_it_consulting_services.webp'
        ];
        imgs.forEach(function(src) {
            var img = new Image();
            img.src = src;
        });
    })();

    createSlider({
        trackId: 'portfolioTrack',
        slides: [
            {
                cls: 'healthcare-item',
                title: 'Healthcare Research Solution',
                desc: 'User-friendly health based applications for clinical trial management, streamlining data access and collaboration.',
                links: [
                    { label: 'Dental Practise MarketPlace',    url: 'https://www.keyideasinfotech.com/portfolio/marketplace-for-dental-practice-and-dentists/' },
                    { label: 'Medical UI/UX Solution',         url: 'https://www.keyideasinfotech.com/portfolio/medical-ui-designer-healthcare-ux-designer/' },
                    { label: 'Pharma Research Development',    url: 'https://www.keyideasinfotech.com/portfolio/php-based-website-design-development-for-a-medicine-research-development-company/' },
                    { label: 'Health and Wellness Platform',   url: 'https://www.keyideasinfotech.com/portfolio/health-and-wellness-website-app/' }
                ]
            },
            {
                cls: 'jewelry-item',
                title: 'Advanced Jewelry Solutions',
                desc: 'Explore innovative solutions featuring custom designs, certified quality, and enhanced shopping experiences.',
                links: [
                    { label: 'Jewelry E-Commerce Los Angeles', url: 'https://www.keyideasinfotech.com/portfolio/jewelry-ecommerce-los-angeles/' },
                    { label: 'Diamond Ring-Builder Melbourne', url: 'https://www.keyideasinfotech.com/portfolio/diamond-ring-builder-melbourne-jeweller/' },
                    { label: 'Jewelry Website Chicago',        url: 'https://www.keyideasinfotech.com/portfolio/large-jewelry-website-ecommerce-chicago/' }
                ]
            },
            {
                cls: 'travel-item',
                title: 'Travel & Hospitality',
                desc: 'Platforms that simplify booking, enhance customer experiences, and streamline operations for the travel industry.',
                links: [
                    { label: 'Comprehensive Travel App',    url: 'https://www.keyideasinfotech.com/portfolio/indian-rail-info-metro-travel-app-hotfoot/' },
                    { label: 'Hospitality Management System', url: 'https://www.keyideasinfotech.com/portfolio/wordpress-website-development-leading-hospitality-group-chicago/' },
                    { label: 'Travel and Booking System',   url: 'https://www.keyideasinfotech.com/portfolio/asp-net-mvc-web-development-best-ui-ux-design-travel-hotel-vacation-agency-canada/' },
                    { label: 'Tourism Management Solution', url: 'https://www.keyideasinfotech.com/portfolio/tourism-website-design-development-seattle/' }
                ]
            },
            {
                cls: 'enterprise-item',
                title: 'Enterprise Software',
                desc: 'Powerful tools designed to integrate processes, boost productivity, and scale your business seamlessly.',
                links: [
                    { label: 'Warehouse Management System',      url: 'https://www.keyideasinfotech.com/portfolio/warehouse-management-system-ecommerce/' },
                    { label: 'Clinical Research Mobile Application', url: 'https://www.keyideasinfotech.com/portfolio/clinical-trial-pharma-healthcare-app/' },
                    { label: 'Transforming Energy Sector',        url: 'https://www.keyideasinfotech.com/portfolio/energy-industry-website-denmark/' },
                    { label: 'Conference Management System',      url: 'https://www.keyideasinfotech.com/portfolio/event-and-conference-management-software/' }
                ]
            }
        ]
    });

    createSlider({
        trackId: 'storiesTrack',
        slides: [
            {
                cls: 'realestate-item',
                title: 'Real Estate & Property Management',
                desc: 'Smart real estate platforms to manage property portfolios and maximize investor returns.',
                links: [
                    { label: 'Real Estate Management',           url: 'https://www.keyideasinfotech.com/portfolio/large-real-estate-website-design/' },
                    { label: 'New York Real Estate Business',    url: 'https://www.keyideasinfotech.com/portfolio/responsive-web-development-using-bootstrap-for-real-estate-business-owner-in-new-york/' },
                    { label: 'Property Management Solution',     url: 'https://www.keyideasinfotech.com/portfolio/real-estate-property-management-wordpress-website-san-francisco/' },
                    { label: 'USA Luxury Real Estate Experience',url: 'https://www.keyideasinfotech.com/portfolio/angularjs-development-usa-luxury-real-estate-web-listing-website/' }
                ]
            },
            {
                cls: 'ecommerce-item',
                title: 'E-Commerce Platform',
                desc: 'Seamless shopping experiences across devices with intelligent product discovery and secure payments.',
                links: [
                    { label: 'Empowering Food and Business Ecommerce', url: 'https://www.keyideasinfotech.com/portfolio/website-design-food-products-website-beverage-industry/' },
                    { label: 'Sporting Goods B2B Ecommerce',           url: 'https://www.keyideasinfotech.com/portfolio/american-sporting-goods-company-headless-b2b-ecommerce-znode/' },
                    { label: 'Electronics Shopify Store',              url: 'https://www.keyideasinfotech.com/portfolio/shopify-electronic-and-gadgets-store-development/' }
                ]
            },
            {
                cls: 'fintech-item',
                title: 'Financial Fintech Solutions',
                desc: 'Secure, scalable financial technology solutions that drive innovation and enhance digital banking.',
                links: [
                    { label: 'Fintech UI/UX Development',      url: 'https://www.keyideasinfotech.com/portfolio/fintech-and-mobile-app-ui-designer/' },
                    { label: 'Financial Advisory Platform',    url: 'https://www.keyideasinfotech.com/portfolio/wordpress-cms-development-company-business-finance-solution-pennsylvania-usa/' },
                    { label: 'Banking Services Platform',      url: 'https://www.keyideasinfotech.com/portfolio/dynamic-website-development-in-wordpress-php-for-banking-company-in-new-york/' },
                    { label: 'Insurance Invoicing Application',url: 'https://www.keyideasinfotech.com/portfolio/mobile-invoice-app-restoration-insurance-industry/' }
                ]
            },
            {
                cls: 'construction-item',
                title: 'Construction & Home Services',
                desc: 'Digital transformation for the construction industry with project tracking and client portals.',
                links: [
                    { label: 'Home Repair & Remodeling Platform',   url: 'https://www.keyideasinfotech.com/portfolio/home-repair-remodelling-experts-website-design/' },
                    { label: 'Revolutionizing Remodelling Experience', url: 'https://www.keyideasinfotech.com/portfolio/asp-net-based-home-remodeling-website-design-development-for-mechanicsburg-pa-client/' },
                    { label: 'Renovation Management Solution',       url: 'https://www.keyideasinfotech.com/portfolio/wordpress-website-development-php-kitchen-bathroom-renovation-australia/' }
                ]
            }
        ]
    });

} // end if (window.innerWidth < 1024)
}); // end DOMContentLoaded

// ====================================================
// SECTORS SHOW MORE (mobile)
// ====================================================
(function() {
    var btn = document.getElementById('sectorsMoreBtn');
    if (!btn) return;
    btn.addEventListener('click', function() {
        var grid = document.querySelector('.sectors-grid');
        if (grid) {
            grid.classList.toggle('expanded');
            btn.textContent = grid.classList.contains('expanded') ? 'Show less ↑' : 'Show more ↓';
        }
    });
})();