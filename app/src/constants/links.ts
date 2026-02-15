export const APP_INSTALL_URL = 'https://example.com/install';
export const APP_DEEP_LINK_PREFIX = 'myapp://';

export const buildDeepLink = (path: string) => {
  const trimmed = path.startsWith('/') ? path.slice(1) : path;
  return `${APP_DEEP_LINK_PREFIX}${trimmed}`;
};
