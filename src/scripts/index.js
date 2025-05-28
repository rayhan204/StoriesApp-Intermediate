// CSS imports
import '../styles/main.css';
import '../styles/responsive.css';
import '../styles/button.css';
import '../styles/form.css';
import '../styles/detail-story.css';
import '../styles/auth.css';
import '../styles/load.css';
import '../styles/home.css';
import '../styles/new-story.css';
import '../styles/item-story.css';
import '../styles/footer.css';
import '../styles/header.css';


import 'tiny-slider/dist/tiny-slider.css';
import 'leaflet/dist/leaflet.css';

import App from './pages/app';
import Camera from './utils/camera';
import { registerServiceWorker } from './utils';


document.addEventListener('DOMContentLoaded', async () => {
  const app = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('#drawer-button'),
    drawerNavigation: document.querySelector('#navigation-drawer'),  
    skipLinkButton: document.querySelector('#skip-link'),           
  });

  await app.renderPage();

  await registerServiceWorker();
  console.log('berhasil mendaftarkan service worker');

  window.addEventListener('hashchange', async () => {
    await app.renderPage();
    Camera.stopAllStreams();
  });
});

