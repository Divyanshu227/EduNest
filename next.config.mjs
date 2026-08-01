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
    },
    turbo: {
      resolveAlias: {
        canvas: './empty-module.js'
      }
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
  exclude: [
    // These Next.js internal files are NOT served publicly and cause 404s
    // which crash workbox precaching and prevent SW from ever activating
    /app-build-manifest\.json$/,
    /_buildManifest\.js$/,
    /_ssgManifest\.js$/,
    /_middlewareManifest\.js$/,
  ]
})(nextConfig);