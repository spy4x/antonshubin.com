function onInit(fn) {
  window.addEventListener('load', fn);
}

const menuItemClasses = {
  active: ['bg-orange-500', 'text-white'],
  default: ['text-gray-300', 'hover:bg-gray-700', 'hover:text-white'],
};

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
addScript('https://www.googletagmanager.com/gtag/js?id=G-R9W8GJC3FZ', () => {
  window.dataLayer = window.dataLayer || [];

  function gtag() {
    dataLayer.push(arguments);
  }

  gtag('js', new Date());
  gtag('config', 'G-R9W8GJC3FZ');
});

// Add Google Recaptcha v3
const RECAPTCHA_PUBLIC_KEY = '6LcCmv0fAAAAAJIKAhoF2JfeYJYMhKPfCa1J0UVV';
addScript(`https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_PUBLIC_KEY}`);

function isEmailValid(email) {
  const regex =
    /^[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;
  return regex.test(email);
}

// Blog subscribe form
onInit(() => {
  document.querySelector('#subscribe-email-button').addEventListener('click', subscribeEmail);
  document.querySelector('#subscribe-email-input').addEventListener('keyup', e => e.keyCode === 13 && subscribeEmail());
});

function subscribeEmail() {
  grecaptcha.ready(async () => {
    const recaptchaToken = await grecaptcha.execute(RECAPTCHA_PUBLIC_KEY, { action: 'subscribeEmail' });
    const email = document.querySelector('#subscribe-email-input').value.trim();
    const subscribeEmailValidationEl = document.querySelector('#subscribe-email-validation');
    if (isEmailValid(email)) {
      subscribeEmailValidationEl.style.display = 'none';
    } else {
      subscribeEmailValidationEl.style.display = 'block';
      return;
    }
    updateButtonLoadingState('loading');
    const response = await fetch('/api/subscribe-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, recaptchaToken }),
    });
    const json = await response.json();
    if (response.status === 200) {
      updateButtonLoadingState('success');
    } else {
      updateButtonLoadingState('error');
      console.error(json);
    }
  });
}

function updateButtonLoadingState(state) {
  switch (state) {
    case 'loading': {
      const button = document.querySelector('#subscribe-email-button');
      const loading = button.querySelector('.loading');
      loading.classList.remove('hidden', 'loading--success', 'loading--error');
      const span = button.querySelector('span');
      span.classList.add('hidden');
      break;
    }
    case 'success': {
      const button = document.querySelector('#subscribe-email-button');
      const loading = button.querySelector('.loading');
      loading.classList.add('loading--success');
      const span = button.querySelector('span');
      span.classList.remove('hidden');
      span.innerText = 'Done';
      break;
    }
    case 'error': {
      const button = document.querySelector('#subscribe-email-button');
      const loading = button.querySelector('.loading');
      loading.classList.add('loading--error');
      const span = button.querySelector('span');
      span.classList.remove('hidden');
      span.innerText = 'Error';
      break;
    }
    default: {
      console.error(`Function "updateButtonLoadingState(state)" was invoked with incorrect argument "${state}".`);
    }
  }
}
