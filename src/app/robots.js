export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/register/', '/subscription-success/', '/subscription-cancelled/'],
      },
    ],
    sitemap: 'https://premarket.homes/sitemap.xml',
  };
}
