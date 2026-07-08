/* Injected SEO helpers — LocalBusiness schema for Last Chance Lighting (Pvt) Ltd */
(function () {
  var schema = {
    "@context": "https://schema.org",
    "@type": "LightingStore",
    "name": "Last Chance Lighting (Pvt) Ltd",
    "alternateName": ["Last Chance Lighting", "Last Chance Lighting Sri Lanka"],
    "url": "https://lastchancelighting.lk/",
    "logo": "https://lastchancelighting.lk/logo.png",
    "image": "https://lastchancelighting.lk/logo.png",
    "description": "Last Chance Lighting (Pvt) Ltd provides customised lighting, project lighting solutions, and lighting appliances across Sri Lanka since 1998. Colombo showroom on Galle Road.",
    "foundingDate": "1998",
    "telephone": "+94707071010",
    "email": "info@lastchancelighting.lk",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "335A, Galle Road",
      "addressLocality": "Colombo 03",
      "addressRegion": "Western Province",
      "addressCountry": "LK"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 6.9012,
      "longitude": 79.8612
    },
    "areaServed": {
      "@type": "Country",
      "name": "Sri Lanka"
    },
    "sameAs": []
  };

  var script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
})();
