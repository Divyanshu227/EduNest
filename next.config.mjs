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
    // Next.js internal build files that are NOT publicly accessible on Vercel
    // Any 404 during precaching crashes SW installation permanently
    /app-build-manifest\.json$/,
    /_buildManifest\.js$/,
    /_ssgManifest\.js$/,
    /_middlewareManifest\.js$/,
    // Server-side manifests - never served publicly
    /\/_next\/server\//,
    /middleware-build-manifest/,
    /middleware-react-loadable-manifest/,
    /react-loadable-manifest/,
    /next-font-manifest/,
  ]
})(nextConfig);