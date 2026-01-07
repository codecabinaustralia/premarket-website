export default function SchemaOrganization() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "name": "Premarket",
    "alternateName": "Premarket Homes",
    "url": "https://premarket.homes",
    "logo": "https://premarket.homes/iconFull.png",
    "description": "Australia's leading off-market property platform connecting homeowners, buyers, and real estate agents through pre-market listings and property market testing.",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "AU",
      "addressRegion": "Australia"
    },
    "areaServed": {
      "@type": "Country",
      "name": "Australia"
    },
    "serviceArea": {
      "@type": "GeoCircle",
      "geoMidpoint": {
        "@type": "GeoCoordinates",
        "latitude": "-33.8688",
        "longitude": "151.2093"
      },
      "geoRadius": "5000000"
    },
    "sameAs": [
      // Add social media links when available
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "areaServed": "AU",
      "availableLanguage": "English"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
