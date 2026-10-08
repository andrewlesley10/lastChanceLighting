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
    "legalName": "Last Chance Lighting (Pvt) Ltd",
    /* 1998 is the heritage of the original Last Chance business; the Pvt Ltd
       company was incorporated 04 June 2019. Kept as separate properties on
       purpose — the client asked that the two dates never be conflated. */
    "foundingDate": "1998",
    "identifier": {
      "@type": "PropertyValue",
      "propertyID": "ROC Registration No.",
      "value": "PV-00212320"
    },
    "founder": [
      { "@type": "Person", "name": "Mohamed Kaleel Mohamed Nalir" },
      { "@type": "Person", "name": "Mohamed Jiffry Mohamed Zaneek" }
    ],
    "employee": {
      "@type": "Person",
      "name": "Mohamed Jiffry Zahan Ahamed",
      "jobTitle": "Founder & Managing Director",
      "telephone": "+94777727778"
    },
    "telephone": "+94114031131",
    "contactPoint": [
      { "@type": "ContactPoint", "telephone": "+94114031131", "contactType": "customer service", "description": "Hotline", "areaServed": "LK", "availableLanguage": ["en", "si", "ta"] },
      { "@type": "ContactPoint", "telephone": "+94707071010", "contactType": "sales", "description": "Mobile / WhatsApp", "areaServed": "LK", "availableLanguage": ["en", "si", "ta"] }
    ],
    "openingHoursSpecification": [
      { "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        "opens": "09:30", "closes": "19:00" },
      { "@type": "OpeningHoursSpecification",
        "dayOfWeek": "Sunday", "opens": "10:00", "closes": "14:30" }
    ],
    "email": "info@lastchancelighting.lk",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "333 1/2, Galle Road",
      "addressLocality": "Colombo 03",
      "postalCode": "00300",
      "addressRegion": "Western Province",
      "addressCountry": "LK"
    },
    "location": {
      "@type": "Place",
      "name": "Last Chance Lighting (Pvt) Ltd — Warehouse",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "34, Cambel Place",
        "addressLocality": "Dehiwala",
        "postalCode": "10350",
        "addressRegion": "Western Province",
        "addressCountry": "LK"
      }
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
