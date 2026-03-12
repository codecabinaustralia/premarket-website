/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable compression
  compress: true,

  // Exclude pdfkit from webpack bundling (it uses fs.readFileSync for fonts)
  serverExternalPackages: ['pdfkit'],

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'premarketvideos.b-cdn.net',
      },
      {
        protocol: 'https',
        hostname: 'premarket.homes',
      },
      {
        protocol: 'https',
        hostname: 'www.airtasker.com',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },

  // Generate metadata for all pages
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
        ],
      },
    ];
  },
};

export default nextConfig;
