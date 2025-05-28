import HomePage from '../pages/home/home-page';
import RegisterPage from '../pages/auth/register/register-page';
import LoginPage from '../pages/auth/login/login-page';
import NewPage from '../pages/new/new-page';
import StoryDetailPage from '../pages/detail-story/story-detail';
import BookmarkPage from '../pages/bookmark/bookmark-page';
import NotFoundPage from '../pages/notFound/note-found-page';
import { checkAuthenticatedRoute, checkUnauthenticatedRouteOnly } from '../utils/auth';


export const routes = {
  '/login': () => checkUnauthenticatedRouteOnly(new LoginPage()),
  '/register': () => checkUnauthenticatedRouteOnly(new RegisterPage()),

  '/home': () => checkAuthenticatedRoute(new HomePage()),
  '/': () => checkUnauthenticatedRouteOnly(new HomePage()),
  '/new': () => checkAuthenticatedRoute(new NewPage()),
  '/bookmark': () => checkAuthenticatedRoute(new BookmarkPage()),
  '/stories/:id': () => checkAuthenticatedRoute(new StoryDetailPage()),
  '404': () => new NotFoundPage(),
};

