/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Next.js 16 blocks JS/HMR from LAN hosts unless they are listed here.
  allowedDevOrigins: ['127.0.0.1', '192.168.*.*', '10.*.*.*', '172.*.*.*'],
  async headers() {
    const immutableYear = [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }];
    return [
      { source: '/videos/:path*', headers: immutableYear },
      { source: '/images/:path*', headers: immutableYear },
      { source: '/audio/:path*', headers: immutableYear },
      { source: '/art/:path*', headers: immutableYear },
      {
        source: '/',
        headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }],
      },
    ];
  },
};
export default nextConfig;
