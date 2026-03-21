// ================================================
// SPA Hash Router
// ================================================

export class Router {
  constructor() {
    this.routes = [];
    this.currentPage = null;
    window.addEventListener('hashchange', () => this.resolve());
  }

  on(pattern, handler) {
    // Convert /heroes/:id to regex
    const regex = new RegExp(
      '^' + pattern.replace(/:[^/]+/g, '([^/]+)').replace(/\//g, '\\/') + '$'
    );
    this.routes.push({ pattern, regex, handler });
    return this;
  }

  resolve() {
    const hash = window.location.hash.slice(1) || '/';
    const [path, queryString] = hash.split('?');
    const params = queryString ? Object.fromEntries(new URLSearchParams(queryString)) : {};

    for (const route of this.routes) {
      const match = path.match(route.regex);
      if (match) {
        const args = match.slice(1);
        this.currentPage = route.pattern;
        this.updateActiveNav(path);
        route.handler(...args, params);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    // 404
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="page-container text-center py-20">
        <h1 class="section-title text-6xl mb-4">404</h1>
        <p class="text-dota-text-muted mb-8">Page not found in the Ancient's archives</p>
        <a href="#/" class="btn-gold">Return to Dashboard</a>
      </div>
    `;
  }

  updateActiveNav(path) {
    const basePath = '/' + (path.split('/')[1] || '');
    document.querySelectorAll('.sidebar-link').forEach(link => {
      const href = link.getAttribute('href').slice(1); // Remove #
      const linkBase = '/' + (href.split('/')[1] || '');
      if (linkBase === basePath || (basePath === '/' && href === '/')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  start() {
    this.resolve();
  }

  navigate(hash) {
    window.location.hash = hash;
  }
}
