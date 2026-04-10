export default function SchemaOrganization() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "name": "Premarket",
    "alternateName": "Premarket Homes",
    "url": "https://premarket.homes",
    "logo": "https://premarketvideos.b-cdn.net/assets/logo.png",
    "description": "Premarket lets agents and homeowners validate property prices with real buyer feedback \u2014 before or during a live listing \u2014 so you attract stronger interest, build trust, and sell with confidence.",
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
