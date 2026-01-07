export default function SchemaService() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "Real Estate Lead Generation",
    "provider": {
      "@type": "Organization",
      "name": "Premarket"
    },
    "areaServed": {
      "@type": "Country",
      "name": "Australia"
    },
    "audience": {
      "@type": "Audience",
      "audienceType": "Real Estate Agents"
    },
    "description": "Premarket Agent Pro helps Australian real estate agents generate exclusive seller leads and win more listings by offering free premarket campaigns to vendors."
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
