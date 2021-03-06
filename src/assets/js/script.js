function onInit(fn) {
  window.addEventListener('load', fn);
}

const menuItemClasses = {
  active: ['bg-orange-500', 'text-white'],
  default: ['text-gray-300', 'hover:bg-gray-700', 'hover:text-white'],
};

const mobileWidth = 640;
let isMobileScreen = true;
const menuEl = document.querySelector('#menu');
const menuClassReadyForAnimation = 'menu-ready-for-animation';
function adaptForMobile() {
  isMobileScreen = document.body.clientWidth < mobileWidth;
  if (isMobileScreen) {
    menuEl.classList.add(menuClassReadyForAnimation);
  } else {
    menuEl.classList.remove(menuClassReadyForAnimation);
  }
}
adaptForMobile();
window.onresize = adaptForMobile;

onInit(() => {
  setTimeout(() => {
    document.querySelector('#menu').classList.add('menu-ready-for-animation');
  }, 1000);
});

document.querySelectorAll(`#menu [data-highlight]`).forEach(highlightActiveMenuItem);
listenToMobileMenu();

function highlightActiveMenuItem(element) {
  const href = element.getAttribute('href');
  const isBlog = href === '/blog' && location.pathname.includes('/blog');
  const isProjects = href === '/projects' && location.pathname.includes('/projects');
  if (location.pathname === href || isBlog || isProjects) {
    menuItemClasses.active.forEach(cl => element.classList.add(cl));
    menuItemClasses.default.forEach(cl => element.classList.remove(cl));
  } else {
    menuItemClasses.active.forEach(cl => element.classList.remove(cl));
    menuItemClasses.default.forEach(cl => element.classList.add(cl));
  }
}

let isMobileMenuOpened = false;
function listenToMobileMenu() {
  const buttons = [...document.querySelectorAll(`[data-mobile-menu-button]`)];
  const closedIcon = document.querySelector(`#mobile-menu-closed-icon`);
  const openedIcon = document.querySelector(`#mobile-menu-opened-icon`);
  const mobileMenu = document.querySelector(`#mobile-menu`);
  const mobileMenuShadow = document.querySelector(`#mobile-menu-shadow`);
  const mobileMenuButtonClickHandler = () => {
    isMobileMenuOpened = !isMobileMenuOpened;
    if (isMobileMenuOpened && isMobileScreen) {
      mobileMenu.classList.remove('hidden');
      closedIcon.classList.remove('block');
      closedIcon.classList.add('hidden');
      openedIcon.classList.remove('hidden');
      openedIcon.classList.add('block');
      mobileMenuShadow.classList.remove('hidden');
    } else {
      mobileMenu.classList.add('hidden');
      closedIcon.classList.remove('hidden');
      closedIcon.classList.add('block');
      openedIcon.classList.remove('block');
      openedIcon.classList.add('hidden');
      mobileMenuShadow.classList.add('hidden');
    }
  };
  buttons.forEach(button => (button.onclick = mobileMenuButtonClickHandler));
}

// Add e ma il after some delay to avoid spam (or at least try)
setTimeout(() => {
  document
    .querySelectorAll('.contact-link')
    .forEach(el => el.setAttribute('href', 'mai' + 'lto' + ':' + '2sp' + 'y' + 4 + 'x+ws@' + 'gm' + 'ail.' + 'com'));
}, 3000);

function addScript(url, onLoadFn) {
  onInit(() => {
    const script = document.createElement('script');
    script.setAttribute('src', url);
    script.setAttribute('defer', '');
    script.onload = onLoadFn;
    document.body.appendChild(script);
  });
}

// Add Google Analytics
window.dataLayer = window.dataLayer || [];
function gtag() {
  dataLayer.push(arguments);
}
addScript('https://www.googletagmanager.com/gtag/js?id=G-R9W8GJC3FZ', () => {
  gtag('js', new Date());
  gtag('config', 'G-R9W8GJC3FZ');
});

// Hide mobile menu on scroll
onInit(() => {
  let wasScrolled = false;
  let lastScrollTop = 0;
  let delta = 5;
  const minimalScrollDistance = 100;

  window.addEventListener('scroll', () => (wasScrolled = true));

  setInterval(function () {
    if (wasScrolled) {
      onScroll();
      wasScrolled = false;
    }
  }, 250);

  function onScroll() {
    let scrollHeight = 0,
      scrollTop = 0,
      scrollThreshold = 0;
    if (document.body.scrollTop > 0) {
      scrollHeight = document.body.scrollHeight;
      scrollTop = document.body.scrollTop;
      scrollThreshold = 15;
    } else {
      scrollHeight = document.documentElement.scrollHeight;
      scrollTop = document.documentElement.scrollTop;
      scrollThreshold = 30;
    }

    // Make sure they scroll more than delta
    if (Math.abs(lastScrollTop - scrollTop) <= delta) {
      return;
    }

    const isMinimalScrollThresholdPassed = scrollTop > minimalScrollDistance;
    const isScrollDown = scrollTop > lastScrollTop;
    const isMobileMenuHidden = !isMobileMenuOpened;
    const isMobileScreen = document.body.clientWidth < mobileWidth;
    const percentageScrollLeft = ((scrollHeight - scrollTop) * 100) / scrollHeight;
    const isFarToBottom = percentageScrollLeft > scrollThreshold;
    const shouldHideMenu =
      isMinimalScrollThresholdPassed && isScrollDown && isMobileMenuHidden && isMobileScreen && isFarToBottom;
    if (shouldHideMenu) {
      // Scroll Down
      document.body.classList.add('mobile-menu-hidden');
    } else {
      // Scroll Up
      document.body.classList.remove('mobile-menu-hidden');
    }

    lastScrollTop = scrollTop;
  }
});

// Handle "data-scroll-to='#target'" attributes
onInit(() => {
  const selector = `[data-scroll-to]`;
  const anchors = Array.from(document.querySelectorAll(selector));

  anchors.forEach(
    a =>
      (a.onclick = () => {
        const target = document.querySelector(a.dataset.scrollTo);
        target && target.scrollIntoView({ behavior: 'smooth' });
      }),
  );
});
