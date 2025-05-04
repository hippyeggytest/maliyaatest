/**
  * This is a placeholder for the vite-plugin-pwa package
 * to prevent build errors without requiring the actual package.
 */

export const VitePWA = (options?: any) => {
  // Return an empty plugin object that matches Vite's plugin interface
  return {
    name: 'vite-plugin-pwa-placeholder',
    // Minimally implement required functions to prevent errors
    configResolved() {},
    buildStart() {},
    transformIndexHtml() { return null; },
    generateBundle() {}
  };
};

export default VitePWA;
 