import withPWA from 'next-pwa';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const nextConfig = {
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com'
      }
    ]
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb'
    }
  },
  turbopack: {
    resolveAlias: {
      canvas: './empty-module.js'
    }
  },
  webpack: (config, { dev }) => {
    config.resolve.alias.canvas = false;
    if (dev) {
      config.cache = false;
    }
    return config;
  }
};

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  dynamicStartUrl: false,
  customWorkerDir: 'worker',
  buildExcludes: [
    // Webpack asset names do NOT contain the "/_next/" prefix during build.
    // We match the filenames directly to exclude them from the Workbox manifest.
    /app-build-manifest\.json$/,
    /build-manifest\.json$/,
    /react-loadable-manifest\.json$/,
    /next-font-manifest\.json$/,
    /next-font-manifest\.js$/,
    /middleware-build-manifest\.js$/,
    /middleware-react-loadable-manifest\.js$/,
    /server\/.*$/,
  ]
})(nextConfig);