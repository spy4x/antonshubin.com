const url = location.href;
const isHomepage = !location.href.endsWith('.html');

highlightMobileMenu();
highlightDesktopMenu();
listenToMobileMenu();

function highlightMobileMenu() {
  document.querySelectorAll(`#mobile-menu a`).forEach(item => {
    const href = item.getAttribute('href');
    if (url.indexOf(href) > -1 || (isHomepage && href.includes('index.html'))) {
      item.className = 'bg-orange-500 text-white block px-3 py-2 rounded-md text-base font-medium';
    } else {
      item.className = 'text-gray-300 block px-3 py-2 rounded-md text-base font-medium';
    }
  });
}

function highlightDesktopMenu() {
  document.querySelectorAll(`#desktop-menu a`).forEach(item => {
    const href = item.getAttribute('href');
    if (url.indexOf(href) > -1 || (isHomepage && href.includes('index.html'))) {
      item.className = 'bg-orange-500 text-white px-3 py-2 rounded-md text-sm font-medium';
    } else {
      item.className = 'text-gray-300 px-3 py-2 rounded-md text-sm font-medium';
    }
  });
}

function listenToMobileMenu() {
  let isMobileMenuOpened = false;
  const button = document.querySelector(`#mobile-menu-button`);
  const closedIcon = button.querySelector(`#mobile-menu-closed-icon`);
  const openedIcon = button.querySelector(`#mobile-menu-opened-icon`);
  const mobileMenu = document.querySelector(`#mobile-menu`);
  button.onclick = () => {
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
}
