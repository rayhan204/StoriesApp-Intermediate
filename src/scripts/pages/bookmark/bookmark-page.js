import {
  generateLoaderAbsoluteTemplate,
  generateStoryItemTemplate,
  generateStoriesListEmptyTemplate,
  generateStoriesListErrorTemplate,
} from '../../templates';
import BookmarkPresenter from './bookmark-presenter';
import Map from '../../utils/map';
import Database from '../../data/database';

export default class BookmarkPage {
  constructor() {
    this.presenter = null;
    this.map = null;
  }

  async render() {
    return `
      <section class="map-section" id="map-section">
        <div class="container">
          <h2 class="section-title">Stori tersimpan mode Offline</h2>
          <p class="section-subtitle">Stori dari berbagai sekiatar anda</p>
        </div>
        <div class="stories-list__map__container">
          <div id="map" class="stories-list__map"></div>
          <div id="map-loading-container"></div>
        </div>
      </section>

      <section class="container stories-section" id="stories-section">
        <h2 class="section-title">Story App</h2>
        <p class="section-subtitle">Temukan Story kamu</p>

        <div class="stories-list__container">
          <div id="stories-list"></div>
          <div id="stories-list-loading-container"></div>
        </div>
      </section>
      
      
    `;
  }

  async afterRender() {
    this.presenter = new BookmarkPresenter({
      view: this,
      model: Database,
    });

    await this.presenter.initialGalleryAndMap();


    const visibleSkipButton = document.getElementById('visible-skip-button');
    if (visibleSkipButton) {
      visibleSkipButton.addEventListener('click', () => {
        const storiesSection = document.getElementById('stories-section');
        if (storiesSection) {
          storiesSection.scrollIntoView({ behavior: 'smooth' });
          storiesSection.focus();
        }
      });
    }
  }

  populateStoriesList(message, stories) {
    if (stories.length <= 0) {
      this.populateStoriesListEmpty();
      return;
    }

    const html = stories.reduce((accumulator, story) => {
      if (!story.location && (story.lat !== undefined || story.lon !== undefined)) {
        story.location = {
          lat: story.lat,
          lon: story.lon,
        };
      } else if (!story.location) {
        story.location = { lat: 0, lon: 0 };
      }

      return accumulator.concat(
        generateStoryItemTemplate({
          ...story,
          name: story.name,
        }),
      );
    }, '');

    document.getElementById('stories-list').innerHTML = `
      <div class="stories-list">${html}</div>
    `;
  }

  populateStoriesListEmpty() {
    document.getElementById('stories-list').innerHTML = generateStoriesListEmptyTemplate();
  }

  populateStoriesListError(message) {
    document.getElementById('stories-list').innerHTML = generateStoriesListErrorTemplate(message);
  }

  async initialMap() {
    try {
      this.map = await Map.build('#map', {
        zoom: 10,
        locate: true,
      });

      if (this.map) {
        const response = await StoryAPI.getAllStories();
        if (response.ok && response.listStory && response.listStory.length > 0) {
          for (const story of response.listStory) {
            if (story.location || (story.lat !== undefined && story.lon !== undefined)) {
              const lat = story.location ? story.location.lat : story.lat;
              const lon = story.location ? story.location.lon : story.lon;

              if ((lat !== 0 || lon !== 0) && !isNaN(Number(lat)) && !isNaN(Number(lon))) {
                const popupContent = `
                  <div class="story-location-popup">
                    <strong>${story.name}'s Story</strong>
                    <p>${story.description.substring(0, 100)}${story.description.length > 100 ? '...' : ''}</p>
                    <p class="story-location-coordinates">
                      Latitude: ${lat}<br>
                      Longitude: ${lon}
                    </p>
                    <a href="#/stories/${story.id}" class="popup-link">Detail</a>
                  </div>
                `;

                this.map.addMarker(
                  [lat, lon],
                  { alt: `${story.name}'s story location` },
                  { content: popupContent },
                );
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }

  showMapLoading() {
    document.getElementById('map-loading-container').innerHTML = generateLoaderAbsoluteTemplate();
  }

  hideMapLoading() {
    document.getElementById('map-loading-container').innerHTML = '';
  }

  showLoading() {
    document.getElementById('stories-list-loading-container').innerHTML =
      generateLoaderAbsoluteTemplate();
  }

  hideLoading() {
    document.getElementById('stories-list-loading-container').innerHTML = '';
  }
}
