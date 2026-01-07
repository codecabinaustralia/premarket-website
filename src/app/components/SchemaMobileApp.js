export default function SchemaMobileApp() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Premarket Homes",
    "operatingSystem": ["iOS", "Android"],
    "applicationCategory": "BusinessApplication",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "150"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "AUD"
    },
    "description": "Find exclusive off-market properties across Australia or test your property's market value before selling. Free for homeowners and buyers.",
    "downloadUrl": "https://apps.apple.com/au/app/premarket-homes/id6742205449",
    "installUrl": "https://play.google.com/store/apps/details?id=com.premarkethomes.app&hl=en",
    "countriesSupported": "Australia"
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
