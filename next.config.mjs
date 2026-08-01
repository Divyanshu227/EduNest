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
  buildExcludes: [
    // ALL .json files under /_next/ are internal build manifests.
    // Vercel does not serve them publicly → they 404 → crashes SW install.
    /\/_next\/.*\.json$/,
    // ALL server-side files — never publicly accessible
    /\/_next\/server\//,
  ]
})(nextConfig);