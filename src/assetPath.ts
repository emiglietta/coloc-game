/**
 * Prefixes asset paths with Vite's base URL for correct loading on GitHub Pages (and other subpath deployments).
 */
export function assetPath(path: string | undefined): string {
  if (!path) return '';
  const base = import.meta.env.BASE_URL || '/';
  return (base.endsWith('/') ? base : base + '/') + path.replace(/^\//, '');
}
