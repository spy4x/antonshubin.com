const url = location.href;
const isHomepage = !location.href.endsWith('.html');

const menuItemClasses = {
  active: ['bg-orange-500', 'text-white'],
  default: ['text-gray-300', 'hover:bg-gray-700', 'hover:text-white'],
};

highlightMobileMenu();
highlightDesktopMenu();
listenToMobileMenu();

function highlightMobileMenu() {
  document.querySelectorAll(`#mobile-menu a`).forEach(item => {
    const href = item.getAttribute('href');
    if (url.indexOf(href) > -1 || (isHomepage && href.includes('index.html'))) {
      menuItemClasses.active.forEach(cl => item.classList.add(cl));
      menuItemClasses.default.forEach(cl => item.classList.remove(cl));
    } else {
      menuItemClasses.active.forEach(cl => item.classList.remove(cl));
      menuItemClasses.default.forEach(cl => item.classList.add(cl));
    }
  });
}

function highlightDesktopMenu() {
  document.querySelectorAll(`#desktop-menu a`).forEach(item => {
    const href = item.getAttribute('href');
    if (url.indexOf(href) > -1 || (isHomepage && href.includes('index.html'))) {
      menuItemClasses.active.forEach(cl => item.classList.add(cl));
      menuItemClasses.default.forEach(cl => item.classList.remove(cl));
    } else {
      menuItemClasses.active.forEach(cl => item.classList.remove(cl));
      menuItemClasses.default.forEach(cl => item.classList.add(cl));
    }
  });
}

function listenToMobileMenu() {
  let isMobileMenuOpened = false;
  const buttons = [...document.querySelectorAll(`[data-mobile-menu-button]`)];
  const closedIcon = document.querySelector(`#mobile-menu-closed-icon`);
  const openedIcon = document.querySelector(`#mobile-menu-opened-icon`);
  const mobileMenu = document.querySelector(`#mobile-menu`);
  const mobileMenuButtonClickHandler = () => {
    isMobileMenuOpened = !isMobileMenuOpened;
    if (isMobileMenuOpened) {
      mobileMenu.classList.remove('hidden');
      closedIcon.classList.remove('block');
      closedIcon.classList.add('hidden');
      openedIcon.classList.remove('hidden');
      openedIcon.classList.add('block');
    } else {
      mobileMenu.classList.add('hidden');
      closedIcon.classList.remove('hidden');
      closedIcon.classList.add('block');
      openedIcon.classList.remove('block');
      openedIcon.classList.add('hidden');
    }
  };
  buttons.forEach(button => (button.onclick = mobileMenuButtonClickHandler));
}
