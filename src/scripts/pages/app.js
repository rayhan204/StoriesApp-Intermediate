import { getActiveRoute } from '../routes/url-parser';
import {
  generateAuthenticatedNavigationListTemplate,
  generateMainNavigationListTemplate,
  generateSubscribeButtonTemplate,
  generateUnsubscribeButtonTemplate,
  generateUnauthenticatedNavigationListTemplate,
} from '../templates';
import {
  setupSkipToContent,
  transitionHelper,
  isServiceWorkerAvailable,
} from '../utils';
import { getAccessToken, getLogout } from '../utils/auth';
import { routes } from '../routes/routes';
import {
  isCurrentPushSubscriptionAvailable,
  subscribe,
  unsubscribe,
} from '../utils/notification-helper';

export default class App {
  #content;
  #drawerButton;
  #drawerNavigation;
  #skipLinkButton;
  currentUrl;

  constructor({ content, drawerNavigation, drawerButton, skipLinkButton }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#drawerNavigation = drawerNavigation;
    this.#skipLinkButton = skipLinkButton;

    this.#init();
  }

  #init() {
    this.#setupDrawer();
    this.#setupBrandLink();
    this.#setupSkipLink();
  }

  #setupDrawer() {
    this.#drawerButton.addEventListener('click', () => {
      this.#drawerNavigation.classList.toggle('open');
    });

    document.body.addEventListener('click', (event) => {
      const isTargetInsideDrawer = this.#drawerNavigation.contains(event.target);
      const isTargetInsideButton = this.#drawerButton.contains(event.target);

      if (!(isTargetInsideDrawer || isTargetInsideButton)) {
        this.#drawerNavigation.classList.remove('open');
      }

      this.#drawerNavigation.querySelectorAll('a').forEach((link) => {
        if (link.contains(event.target)) {
          this.#drawerNavigation.classList.remove('open');
        }
      });
    });
  }

  #setupBrandLink() {
    const brandLink = document.querySelector('.brand-name');
    if (brandLink) {
      brandLink.addEventListener('click', (event) => {
        event.preventDefault();
        const isLogin = !!getAccessToken();
        location.hash = isLogin ? '/home' : '/';
      });
    }
  }

  #setupSkipLink() {
    const skipLink = document.getElementById('skip-link');
    const mainContent = document.getElementById('main-content');

    if (skipLink && mainContent) {
      skipLink.addEventListener('click', (event) => {
        event.preventDefault();
        skipLink.blur();

        mainContent.focus();
        mainContent.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }

  #setupNavigationList() {
    const isLogin = !!getAccessToken();
    const navListMain = this.#drawerNavigation.children.namedItem('navlist-main');
    const navList = this.#drawerNavigation.children.namedItem('navlist');

    if (!navList || !navListMain) return;

    if (!isLogin) {
      navListMain.innerHTML = '';
      navList.innerHTML = generateUnauthenticatedNavigationListTemplate();
      return;
    }

    navListMain.innerHTML = generateMainNavigationListTemplate();
    navList.innerHTML = generateAuthenticatedNavigationListTemplate();

    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
      logoutButton.addEventListener('click', (event) => {
        event.preventDefault();

        if (confirm('Are you sure you want to logout?')) {
          getLogout();
          location.hash = '/login';
        }
      });
    }
  }

  async #setupPushNotification() {
    const pushNotificationTools = document.getElementById('push-notification-tools');
    if (!pushNotificationTools) {
      console.warn('#push-notification-tools tidak ditemukan di DOM');
      return;
    }

    const isSubscribed = await isCurrentPushSubscriptionAvailable();

    if (isSubscribed) {
      pushNotificationTools.innerHTML = generateUnsubscribeButtonTemplate();
      const unsubscribeBtn = document.getElementById('unsubscribe-button');
      if (unsubscribeBtn) {
        unsubscribeBtn.addEventListener('click', () => {
          unsubscribe().finally(() => this.#setupPushNotification());
        });
      }
      return;
    }

    pushNotificationTools.innerHTML = generateSubscribeButtonTemplate();
    const subscribeBtn = document.getElementById('subscribe-button');
    if (subscribeBtn) {
      subscribeBtn.addEventListener('click', () => {
        subscribe().finally(() => this.#setupPushNotification());
      });
    }
  }

  async renderPage() {
    const url = getActiveRoute();
    const prevUrl = this.currentUrl || '/';
    this.currentUrl = url;

    const routeHandler = routes[url] || routes['/404'];

    if (typeof routeHandler !== 'function') {
      console.error(`Route handler for '${url}' is invalid or not defined.`);
      this.#content.innerHTML = '<h1>Page Not Found</h1>';
      return;
    }

    const page = routeHandler();

    if (!page || typeof page.render !== 'function') {
      console.error(`Page instance from route '${url}' is invalid.`, page);
      this.#content.innerHTML = '<h1>Page Not Found</h1>';
      return;
    }

    let transitionType = 'default';

    if (url === '/' && prevUrl !== '/') {
      transitionType = 'backward';
    } else if (url.includes('/stories/') && !prevUrl.includes('/stories/')) {
      transitionType = 'detail';
    } else if (prevUrl.includes('/stories/') && !url.includes('/stories/')) {
      transitionType = 'exit-detail';
    } else if (url !== prevUrl) {
      transitionType = 'forward';
    }

    const transition = transitionHelper({
      updateDOM: async () => {
        this.#content.innerHTML = await page.render();
        if (typeof page.afterRender === 'function') {
          page.afterRender();
        }
      },
      transitionType,
    });

    transition.ready.catch(console.error);
    transition.updateCallbackDone.then(() => {
      scrollTo({ top: 0, behavior: 'instant' });
      this.#setupNavigationList();

      if (isServiceWorkerAvailable()) {
        this.#setupPushNotification();
      }
    });
  }
}
