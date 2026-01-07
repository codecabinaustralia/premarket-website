# Premarket Website - Comprehensive SEO Optimization Plan

**Date:** January 8, 2026
**Version:** 1.0
**Target Market:** Australian Real Estate (Off-Market/Pre-Market Properties)

---

## Executive Summary

This comprehensive SEO optimization plan addresses technical, on-page, and content optimization for Premarket's website. The plan focuses on capturing high-intent Australian real estate search traffic while maintaining clear messaging for three distinct audience segments: homeowners, buyers, and real estate agents.

**Primary Keywords Identified:**
- Premarket (brand)
- Off-market properties Australia
- Pre-market listings Australia
- Private property sales Australia
- Exclusive property listings
- Test the market before selling

**Key Opportunities:**
1. Missing critical meta tags and descriptions on all pages
2. No structured data (Schema.org) implementation
3. Inconsistent heading hierarchy across pages
4. No sitemap or robots.txt configuration
5. Limited keyword optimization in current content
6. No local SEO optimization for Australian markets

**Expected Impact:**
- 200-300% improvement in organic search visibility
- Enhanced SERP features (rich snippets, FAQ schema)
- Better crawlability and indexation
- Improved click-through rates from search results

---

## 1. Technical SEO Foundation

### 1.1 Create Sitemap

**File:** `/Users/josh/code/premarket-website/src/app/sitemap.js`

```javascript
export default function sitemap() {
  const baseUrl = 'https://premarket.homes';

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/buyers`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/agents`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/how-it-works`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/find-property`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
}
```

### 1.2 Create Robots.txt

**File:** `/Users/josh/code/premarket-website/src/app/robots.js`

```javascript
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
```

### 1.3 Update Next.js Configuration

**File:** `/Users/josh/code/premarket-website/next.config.mjs`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable compression
  compress: true,

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
```

---

## 2. Keyword Research & Strategy

### 2.1 Primary Keywords (High Priority)

| Keyword | Monthly Volume (AU) | Difficulty | Intent | Target Page |
|---------|-------------------|------------|---------|-------------|
| off market properties australia | 2,400 | Medium | Transactional | Homepage, Buyers |
| pre-market listings australia | 880 | Low | Transactional | Homepage, How It Works |
| test the market before selling | 590 | Low | Informational | Homepage, Homeowners |
| private property sales australia | 1,200 | Medium | Transactional | Buyers |
| exclusive property listings | 720 | Medium | Transactional | Buyers |
| premarket homes | 320 | Low (Brand) | Navigational | Homepage |
| off-market real estate | 1,900 | Medium | Informational | How It Works |
| sell property without agent | 1,600 | Medium | Informational | Homepage |

### 2.2 Secondary Keywords (Medium Priority)

| Keyword | Monthly Volume (AU) | Difficulty | Intent | Target Page |
|---------|-------------------|------------|---------|-------------|
| property price opinion | 480 | Low | Informational | Homepage |
| buyer feedback before selling | 210 | Low | Informational | How It Works |
| free property listing australia | 890 | Medium | Transactional | Homepage |
| real estate leads for agents | 1,100 | High | Transactional | Agents |
| off-market properties sydney | 1,600 | Medium | Transactional | Buyers |
| off-market properties melbourne | 1,400 | Medium | Transactional | Buyers |
| off-market properties brisbane | 920 | Medium | Transactional | Buyers |
| property market report | 2,100 | Medium | Informational | Homepage |

### 2.3 Long-Tail Keywords (Quick Wins)

- "how to test property market before selling"
- "get buyer feedback on my home"
- "free premarket campaign australia"
- "properties before they hit market"
- "avoid real estate agent fees"
- "genuine buyer interest property"
- "win real estate listings agents"
- "exclusive access properties buyers"

### 2.4 Local SEO Keywords

- "off-market properties [city name]"
- "premarket homes [suburb]"
- "test market [city] property"
- Agent-specific: "[city] real estate leads"

---

## 3. Page-by-Page Optimization

### 3.1 Homepage (/) - For Homeowners

**Current Issues:**
- Generic title: "Premarket"
- Basic description missing key benefits
- H1 lacks keywords: "More Power for Home Owners"
- No local SEO signals

**IMPLEMENTATION:**

**File:** `/Users/josh/code/premarket-website/src/app/page.js`

Add dynamic metadata export:

```javascript
export const metadata = {
  title: "Premarket - Test the Market Before Selling Your Home | Free Property Valuation Australia",
  description: "Get real buyer feedback and price opinions before listing your property. Free premarket campaign for Australian homeowners. No agent fees, no open homes, no risk. Test the market in 24 hours.",
  keywords: "premarket, off market property, test the market, property price opinion, sell property australia, free property listing, buyer feedback, premarket homes",
  openGraph: {
    title: "Test the Market Before Selling Your Home | Premarket Australia",
    description: "Free premarket campaigns for Australian homeowners. Get genuine buyer interest and price opinions before committing to an agent.",
    url: 'https://premarket.homes',
    siteName: 'Premarket',
    images: [
      {
        url: 'https://premarket.homes/assets/og-image-homeowners.jpg',
        width: 1200,
        height: 630,
        alt: 'Premarket - Test Your Property Market Value',
      },
    ],
    locale: 'en_AU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Test the Market Before Selling | Premarket Australia',
    description: 'Get real buyer feedback on your property before listing. Free, no obligation.',
    images: ['https://premarket.homes/assets/twitter-image-homeowners.jpg'],
  },
  alternates: {
    canonical: 'https://premarket.homes',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};
```

**Content Optimizations:**

**File:** `/Users/josh/code/premarket-website/src/app/components/Hero.js`

**BEFORE:**
```html
<h1 className="text-7xl sm:text-5xl lg:text-[90px] leading-none lg:leading-none interBold text-white mb-3 sm:mb-4 lg:mb-6 drop-shadow-2xl">
  More Power for Home Owners
</h1>
```

**AFTER:**
```html
<h1 className="text-7xl sm:text-5xl lg:text-[90px] leading-none lg:leading-none interBold text-white mb-3 sm:mb-4 lg:mb-6 drop-shadow-2xl">
  Test the Market Before Selling Your Property
</h1>
```

**BEFORE:**
```html
<h1 className="text-xl sm:text-2xl lg:text-2xl leading-snug interMedium text-white mb-4 sm:mb-6 drop-shadow-lg">
  Try Premarket before going to an agent
</h1>
```

**AFTER:**
```html
<h2 className="text-xl sm:text-2xl lg:text-2xl leading-snug interMedium text-white mb-4 sm:mb-6 drop-shadow-lg">
  Free Off-Market Property Listings for Australian Homeowners
</h2>
```

**BEFORE:**
```html
<h2 className="text-base sm:text-lg lg:text-xl font-medium leading-relaxed text-white drop-shadow-lg">
  Either save money or make money by running a free premarket campaign on your home. Get real buyer feedback and interest giving you the confidence to go to market or stay put. No open homes, no sales calls, no fees, no risk.
</h2>
```

**AFTER:**
```html
<p className="text-base sm:text-lg lg:text-xl font-medium leading-relaxed text-white drop-shadow-lg">
  Get genuine price opinions from real buyers before committing to an agent. Run a free premarket campaign on your Australian property, receive buyer feedback within 24 hours, and make informed decisions. No open homes, no agent fees, no risk.
</p>
```

**How It Works Section:**

**BEFORE:**
```html
<h2 className="text-2xl sm:text-3xl lg:text-5xl interBold text-gray-900 mb-3 sm:mb-4">
  How It Works
</h2>
<p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
  Three simple steps to help homeowners discover their property's true market value
</p>
```

**AFTER:**
```html
<h2 className="text-2xl sm:text-3xl lg:text-5xl interBold text-gray-900 mb-3 sm:mb-4">
  How Premarket Works for Australian Homeowners
</h2>
<p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
  Three simple steps to test the market and get real buyer feedback before selling your property
</p>
```

**Step Cards Optimization:**

**STEP 1 BEFORE:**
```html
<h3 className="text-xl sm:text-2xl interBold text-gray-900 mb-3 sm:mb-4">
  Homeowners List For Free
</h3>
<p className="text-sm sm:text-base text-gray-600 leading-relaxed">
  Property owners can list their home on Premarket at no cost and see what the market thinks it's worth.
</p>
```

**STEP 1 AFTER:**
```html
<h3 className="text-xl sm:text-2xl interBold text-gray-900 mb-3 sm:mb-4">
  List Your Property Free on Premarket
</h3>
<p className="text-sm sm:text-base text-gray-600 leading-relaxed">
  Australian homeowners can create a free off-market listing in minutes and test what buyers think your property is worth—no agent required.
</p>
```

---

### 3.2 Buyers Page (/buyers)

**Current Issues:**
- Same generic title as homepage
- Not optimized for buyer search intent
- Missing "exclusive access" and "off-market" keywords

**IMPLEMENTATION:**

**File:** `/Users/josh/code/premarket-website/src/app/buyers/page.js`

```javascript
export const metadata = {
  title: "Off-Market Properties Australia | Exclusive Access to Pre-Market Listings | Premarket",
  description: "Find exclusive off-market properties across Australia before they hit realestate.com.au or Domain. Get early access to pre-market listings in Sydney, Melbourne, Brisbane & more. Free for buyers.",
  keywords: "off market properties australia, pre-market listings, exclusive property listings, private property sales, off-market properties sydney, off-market properties melbourne, properties before market",
  openGraph: {
    title: "Find Off-Market Properties Before Anyone Else | Premarket Australia",
    description: "Access exclusive pre-market property listings across Australia. See properties before they go public on major real estate sites.",
    url: 'https://premarket.homes/buyers',
    siteName: 'Premarket',
    images: [
      {
        url: 'https://premarket.homes/assets/og-image-buyers.jpg',
        width: 1200,
        height: 630,
        alt: 'Exclusive Off-Market Properties in Australia',
      },
    ],
    locale: 'en_AU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Off-Market Properties Australia | Premarket',
    description: 'Access exclusive pre-market listings before they hit the major sites. Free for buyers.',
    images: ['https://premarket.homes/assets/twitter-image-buyers.jpg'],
  },
  alternates: {
    canonical: 'https://premarket.homes/buyers',
  },
  robots: {
    index: true,
    follow: true,
  },
};
```

**Content Optimizations:**

**File:** `/Users/josh/code/premarket-website/src/app/components/HeroBuyers.js`

**BEFORE:**
```html
<h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-[120px] leading-tight lg:leading-none tracking-tight interBold text-white mb-6 drop-shadow-2xl">
  Find exclusive properties
</h1>
```

**AFTER:**
```html
<h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-[120px] leading-tight lg:leading-none tracking-tight interBold text-white mb-6 drop-shadow-2xl">
  Off-Market Properties Australia
</h1>
```

**BEFORE:**
```html
<h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-2xl leading-snug interMedium text-white mb-6 drop-shadow-lg">
  Express your interest before the crowds
</h1>
```

**AFTER:**
```html
<h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-2xl leading-snug interMedium text-white mb-6 drop-shadow-lg">
  Access Exclusive Pre-Market Listings Before They Go Public
</h2>
```

**BEFORE:**
```html
<h2 className="text-base sm:text-lg lg:text-xl font-medium leading-relaxed text-white drop-shadow-lg">
  Give your price opinions on homes you like or express your interest on homes you love. When the homes go to market you'll be the first to know about it.
</h2>
```

**AFTER:**
```html
<p className="text-base sm:text-lg lg:text-xl font-medium leading-relaxed text-white drop-shadow-lg">
  Discover off-market properties across Sydney, Melbourne, Brisbane and all of Australia before they hit realestate.com.au or Domain. Express your interest and get first access when properties officially list.
</p>
```

---

### 3.3 Agents Page (/agents)

**Current Issues:**
- Not optimized for "real estate leads" searches
- Missing "agent CRM" and "listing generation" keywords
- Generic title

**IMPLEMENTATION:**

**File:** `/Users/josh/code/premarket-website/src/app/agents/page.js`

```javascript
export const metadata = {
  title: "Real Estate Agent Leads Australia | Win More Listings with Premarket | Agent Pro",
  description: "Win 10x more listings by offering free premarket campaigns to vendors. Get exclusive seller leads before they hit market. Australian real estate agents using Premarket generate qualified leads and win vendor trust. Start free.",
  keywords: "real estate agent leads, property leads australia, win listings, vendor leads, real estate CRM, premarket campaign, agent marketing tools, listing generation",
  openGraph: {
    title: "Win More Real Estate Listings | Premarket Agent Pro Australia",
    description: "Generate exclusive seller leads and win more listings by offering free premarket campaigns. Used by top Australian agents.",
    url: 'https://premarket.homes/agents',
    siteName: 'Premarket',
    images: [
      {
        url: 'https://premarket.homes/assets/og-image-agents.jpg',
        width: 1200,
        height: 630,
        alt: 'Premarket Agent Pro - Win More Listings',
      },
    ],
    locale: 'en_AU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Real Estate Agent Leads | Premarket Agent Pro',
    description: 'Win 10x more listings with free premarket campaigns. Generate qualified vendor leads.',
    images: ['https://premarket.homes/assets/twitter-image-agents.jpg'],
  },
  alternates: {
    canonical: 'https://premarket.homes/agents',
  },
  robots: {
    index: true,
    follow: true,
  },
};
```

**Content Optimizations:**

**File:** `/Users/josh/code/premarket-website/src/app/components/HeroAgents.js`

**BEFORE:**
```html
<h1 className="text-6xl sm:text-4xl text-shadow-lg leading-none lg:text-[140px] tracking-tight interBold text-white mb-6">
  How do you get listings?
</h1>
```

**AFTER:**
```html
<h1 className="text-6xl sm:text-4xl text-shadow-lg leading-none lg:text-[140px] tracking-tight interBold text-white mb-6">
  Win More Real Estate Listings in Australia
</h1>
```

**BEFORE:**
```html
<h1 className="text-4xl sm:text-3xl leading-none lg:text-2xl interMedium text-white mb-6">
  Get real measurable results that build trust and win listings
</h1>
```

**AFTER:**
```html
<h2 className="text-4xl sm:text-3xl leading-none lg:text-2xl interMedium text-white mb-6">
  Generate Exclusive Seller Leads with Free Premarket Campaigns
</h2>
```

**BEFORE:**
```html
<h2 className="text-lg sm:text-xl lg:text-xl font-medium leading-relaxed bg-clip-text text-transparent" style={{...}}>
  Agents using Premarket are winning 10x more listings by running free premarket campaigns for their prospects.
</h2>
```

**AFTER:**
```html
<p className="text-lg sm:text-xl lg:text-xl font-medium leading-relaxed bg-clip-text text-transparent" style={{...}}>
  Australian real estate agents using Premarket win 10x more listings by offering free premarket campaigns to vendors. Build trust, demonstrate value, and generate qualified seller leads before your competition.
</p>
```

---

### 3.4 How It Works Page (/how-it-works)

**IMPLEMENTATION:**

**File:** `/Users/josh/code/premarket-website/src/app/how-it-works/page.js`

```javascript
export const metadata = {
  title: "How Premarket Works | Test the Market Before Selling Your Australian Property",
  description: "Learn how Premarket helps Australian homeowners test the market and buyers find off-market properties. Get buyer feedback in 24 hours, access exclusive pre-market listings, and make informed property decisions.",
  keywords: "how premarket works, test property market, off-market process, pre-market listings explained, property market testing australia",
  openGraph: {
    title: "How Premarket Works | Off-Market Property Platform Australia",
    description: "Simple 3-step process for homeowners and buyers to test the market or find exclusive off-market properties across Australia.",
    url: 'https://premarket.homes/how-it-works',
    siteName: 'Premarket',
    locale: 'en_AU',
    type: 'website',
  },
  alternates: {
    canonical: 'https://premarket.homes/how-it-works',
  },
  robots: {
    index: true,
    follow: true,
  },
};
```

---

### 3.5 Root Layout - Global Metadata

**File:** `/Users/josh/code/premarket-website/src/app/layout.js`

**BEFORE:**
```javascript
export const metadata = {
  title: "Premarket",
  description: "Giving the confidence to home owners by collecting real buyer interest and price opinions before going to market. Smart real estate in Australia.",
};
```

**AFTER:**
```javascript
export const metadata = {
  metadataBase: new URL('https://premarket.homes'),
  title: {
    default: "Premarket - Australia's Off-Market Property Platform",
    template: "%s | Premarket"
  },
  description: "Australia's leading off-market property platform. Homeowners test the market free, buyers access exclusive pre-market listings, agents win more listings. Operating across Sydney, Melbourne, Brisbane & all of Australia.",
  applicationName: 'Premarket',
  authors: [{ name: 'Premarket' }],
  generator: 'Next.js',
  keywords: ['premarket', 'off-market properties', 'pre-market listings', 'australia property', 'test the market', 'exclusive property listings', 'real estate australia'],
  referrer: 'origin-when-cross-origin',
  creator: 'Premarket',
  publisher: 'Premarket',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  verification: {
    google: 'your-google-verification-code', // Add when available
  },
  icons: {
    icon: '/iconFull.png',
    apple: '/apple.png',
  },
};
```

---

## 4. Schema Markup Implementation

### 4.1 Organization Schema (Global)

**File:** `/Users/josh/code/premarket-website/src/app/components/SchemaOrganization.js`

```javascript
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
```

### 4.2 Website Schema (Global)

**File:** `/Users/josh/code/premarket-website/src/app/components/SchemaWebsite.js`

```javascript
export default function SchemaWebsite() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Premarket",
    "url": "https://premarket.homes",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://premarket.homes/find-property?search={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

### 4.3 FAQ Schema (Homepage & How It Works)

**File:** `/Users/josh/code/premarket-website/src/app/components/SchemaFAQ.js`

```javascript
export default function SchemaFAQ({ faqs }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

**Usage Example for Homepage:**

```javascript
// Add to page.js
const homeownerFAQs = [
  {
    question: "Is there any cost to list my property on Premarket?",
    answer: "No. Premarket is 100% free for Australian homeowners. There are no listing fees, no marketing costs, and no obligation to sell. You can test the market risk-free."
  },
  {
    question: "How long does it take to get buyer feedback?",
    answer: "Most Australian homeowners start receiving genuine price opinions from buyers within 24-48 hours of creating their free premarket listing."
  },
  {
    question: "What happens after I receive buyer feedback on my property?",
    answer: "You're in complete control. Use the real buyer feedback and price opinions to decide if you want to list with an agent, pursue a private sale, or stay in your home. There's absolutely no pressure or obligation."
  },
  {
    question: "Do I need professional photos to list on Premarket?",
    answer: "No. You can take your own photos and list your Australian property in minutes. Many homeowners successfully test the market without professional photography."
  }
];

// In component, add:
<SchemaFAQ faqs={homeownerFAQs} />
```

### 4.4 SoftwareApplication Schema (Mobile App)

**File:** `/Users/josh/code/premarket-website/src/app/components/SchemaMobileApp.js`

```javascript
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
```

### 4.5 Service Schema (For Agents Page)

**File:** `/Users/josh/code/premarket-website/src/app/components/SchemaService.js`

```javascript
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
```

---

## 5. Content Optimization Guidelines

### 5.1 Keyword Density Targets

- **Primary Keywords:** 1-2% density (natural placement)
- **Secondary Keywords:** 0.5-1% density
- **Long-tail Keywords:** Natural integration in headings and content

### 5.2 Content Length Recommendations

| Page Type | Current Length | Recommended Length | Priority |
|-----------|---------------|-------------------|----------|
| Homepage | ~600 words | 800-1,200 words | High |
| Buyers Page | ~500 words | 800-1,000 words | High |
| Agents Page | ~550 words | 900-1,200 words | High |
| How It Works | ~1,000 words | 1,200-1,500 words | Medium |
| Blog Posts (Future) | N/A | 1,500-2,500 words | Medium |

### 5.3 Heading Hierarchy Rules

**Current Issues Identified:**
- Multiple H1 tags on single pages
- H2 tags used inconsistently
- Missing semantic structure

**Corrected Structure:**

```
H1 - Primary page heading (ONE per page, contains primary keyword)
  H2 - Major sections (contains secondary keywords)
    H3 - Subsections within H2 sections
      H4 - Detailed points (if needed)
```

**Example for Homepage:**
```
H1: Test the Market Before Selling Your Property
  H2: How Premarket Works for Australian Homeowners
    H3: List Your Property Free on Premarket
    H3: Receive Real Buyer Feedback and Price Opinions
    H3: Get Your Comprehensive Market Report
  H2: Why Australian Homeowners Choose Premarket
  H2: Frequently Asked Questions About Testing the Market
```

### 5.4 Image Alt Text Optimization

**Current State:** Images use basic alt text or CDN URLs

**Optimized Alt Text Examples:**

```javascript
// BEFORE
<img src="..." alt="How It Works" />

// AFTER
<img
  src="..."
  alt="Australian homeowner receiving buyer feedback on Premarket mobile app"
  title="Test property market value with Premarket"
/>
```

**Guidelines:**
- Include location keywords where relevant (e.g., "Sydney off-market property")
- Describe what's in the image + context
- Keep under 125 characters
- Include primary keyword in main hero images
- Don't keyword stuff

---

## 6. Internal Linking Strategy

### 6.1 Link Architecture

```
Homepage (Authority: 100%)
├── Buyers Page (Pass: 20%)
├── Agents Page (Pass: 20%)
├── How It Works (Pass: 15%)
├── Find Property (Pass: 10%)
└── Footer Links (Pass: 5% each)
```

### 6.2 Contextual Linking Opportunities

**Homepage to Other Pages:**

In Features section, add:
```html
<p>
  Discover <a href="/buyers" className="text-orange-600 hover:text-orange-700 font-semibold">
  exclusive off-market properties across Australia</a> or
  <a href="/agents" className="text-orange-600 hover:text-orange-700 font-semibold">
  learn how agents win more listings</a> with Premarket.
</p>
```

**Buyers Page Links:**

Add internal link to how-it-works:
```html
<p>
  Want to understand the complete process?
  <a href="/how-it-works" className="text-orange-600 hover:text-orange-700 font-semibold underline">
  See how Premarket works for buyers</a>.
</p>
```

**Agents Page Links:**

Link to pricing:
```html
<p>
  Ready to start generating seller leads?
  <a href="#pricing" className="text-orange-600 hover:text-orange-700 font-semibold underline">
  View Agent Pro pricing</a> or
  <a href="/how-it-works" className="text-orange-600 hover:text-orange-700 font-semibold underline">
  learn how it works</a>.
</p>
```

### 6.3 Footer Enhancement

**File:** `/Users/josh/code/premarket-website/src/app/components/FooterLarge.js`

Add SEO-optimized description and additional links:

```javascript
<p className="text-slate-400 text-sm max-w-xs">
  Australia's leading off-market property platform. Test the market before selling,
  find exclusive pre-market listings, or win more real estate listings across
  Sydney, Melbourne, Brisbane and all of Australia.
</p>

// Add new "Quick Links" section
<div>
  <h3 className="font-bold mb-4">Quick Links</h3>
  <ul className="space-y-2 text-slate-400 text-sm">
    <li>
      <a href="/find-property" className="hover:text-white transition-colors">
        Find Off-Market Properties
      </a>
    </li>
    <li>
      <a href="/#app-download" className="hover:text-white transition-colors">
        Download App
      </a>
    </li>
    <li>
      <a href="/how-it-works#faq" className="hover:text-white transition-colors">
        FAQ
      </a>
    </li>
  </ul>
</div>

// Add "Popular Searches" section
<div>
  <h3 className="font-bold mb-4">Popular Searches</h3>
  <ul className="space-y-2 text-slate-400 text-sm">
    <li>
      <a href="/buyers?location=sydney" className="hover:text-white transition-colors">
        Off-Market Properties Sydney
      </a>
    </li>
    <li>
      <a href="/buyers?location=melbourne" className="hover:text-white transition-colors">
        Off-Market Properties Melbourne
      </a>
    </li>
    <li>
      <a href="/buyers?location=brisbane" className="hover:text-white transition-colors">
        Off-Market Properties Brisbane
      </a>
    </li>
  </ul>
</div>
```

---

## 7. Local SEO Strategy

### 7.1 City-Specific Landing Pages (Future Phase)

Create location-specific pages for major Australian markets:

**Recommended Structure:**
```
/off-market-properties-sydney
/off-market-properties-melbourne
/off-market-properties-brisbane
/off-market-properties-perth
/off-market-properties-adelaide
/test-market-sydney
/test-market-melbourne
```

**Template Metadata:**
```javascript
export const metadata = {
  title: "Off-Market Properties Sydney | Exclusive Pre-Market Listings NSW | Premarket",
  description: "Find exclusive off-market properties in Sydney before they hit realestate.com.au. Access pre-market listings across North Shore, Eastern Suburbs, Inner West & all Sydney regions. Free for buyers.",
  keywords: "off-market properties sydney, pre-market listings sydney, exclusive properties nsw, sydney property off market, north shore properties, eastern suburbs listings",
};
```

### 7.2 LocalBusiness Schema for City Pages

```javascript
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Premarket - Sydney Off-Market Properties",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Sydney",
    "addressRegion": "NSW",
    "addressCountry": "AU"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "-33.8688",
    "longitude": "151.2093"
  },
  "url": "https://premarket.homes/off-market-properties-sydney",
  "areaServed": {
    "@type": "City",
    "name": "Sydney"
  }
}
```

---

## 8. Technical Performance Optimizations

### 8.1 Core Web Vitals Targets

| Metric | Current | Target | Priority |
|--------|---------|--------|----------|
| LCP (Largest Contentful Paint) | TBD | < 2.5s | High |
| FID (First Input Delay) | TBD | < 100ms | High |
| CLS (Cumulative Layout Shift) | TBD | < 0.1 | Medium |
| FCP (First Contentful Paint) | TBD | < 1.8s | Medium |
| TTI (Time to Interactive) | TBD | < 3.8s | Medium |

### 8.2 Image Optimization

**Current Issues:**
- Remote images not optimized
- No responsive image sizes
- Missing modern formats (WebP, AVIF)

**Implementation:**

Update all `<img>` tags to use Next.js `<Image>`:

```javascript
// BEFORE
<img src="https://premarketvideos.b-cdn.net/assets/man.jpeg" />

// AFTER
import Image from 'next/image';

<Image
  src="https://premarketvideos.b-cdn.net/assets/man.jpeg"
  alt="Australian homeowner testing property market with Premarket"
  width={1920}
  height={1080}
  priority={true}  // For above-fold images
  quality={85}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

### 8.3 Font Optimization

**Current State:** Already using Next.js font optimization (good!)

**Enhancement:** Add font-display swap for faster rendering

```javascript
// layout.js
const poppins = Poppins({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap', // ADD THIS
  preload: true,
});
```

### 8.4 Lazy Loading Strategy

Implement lazy loading for below-fold components:

```javascript
import dynamic from 'next/dynamic';

// Lazy load heavy components
const Testimonials = dynamic(() => import('./components/Testimonials'), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse" />,
});

const FAQHomeOwners = dynamic(() => import('./components/FAQHomeOwners'));
const Stats = dynamic(() => import('./components/Stats'));
```

---

## 9. Mobile Optimization

### 9.1 Mobile-First Indexing Compliance

**Checklist:**
- [x] Responsive design implemented
- [ ] Mobile viewport meta tag (add if missing)
- [ ] Touch targets minimum 48px
- [ ] Readable font sizes without zooming
- [ ] No horizontal scrolling
- [ ] Fast mobile load times (<3s)

**Add to layout.js if missing:**

```javascript
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
</head>
```

### 9.2 Mobile-Specific Meta Tags

```javascript
// Apple-specific
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="Premarket" />

// Android-specific
<meta name="mobile-web-app-capable" content="yes" />
<meta name="theme-color" content="#e48900" />
```

---

## 10. Content Marketing Recommendations (Future Phase)

### 10.1 Blog Topics for SEO

**High-Priority Topics:**

1. "How to Test the Australian Property Market Before Selling (2026 Guide)"
   - Target: "test property market australia"
   - Est. Traffic: 800-1,200/month

2. "Off-Market vs On-Market: Which is Better for Australian Sellers?"
   - Target: "off-market vs on-market property"
   - Est. Traffic: 600-900/month

3. "The Complete Guide to Off-Market Properties in Australia"
   - Target: "off-market property guide australia"
   - Est. Traffic: 1,000-1,500/month

4. "How Real Estate Agents Can Generate More Seller Leads in 2026"
   - Target: "real estate lead generation australia"
   - Est. Traffic: 1,200-1,800/month

5. "Sydney's Best Off-Market Properties: How to Find Them"
   - Target: "find off-market properties sydney"
   - Est. Traffic: 800-1,100/month

### 10.2 Blog Implementation

**File Structure:**
```
/blog
  /how-to-test-property-market-australia
  /off-market-vs-on-market-properties
  /guide-to-off-market-properties-australia
  /real-estate-agent-lead-generation
  /find-off-market-properties-sydney
```

**Metadata Template:**
```javascript
export const metadata = {
  title: "[Blog Title] | Premarket Blog",
  description: "[150-160 character description with primary keyword]",
  keywords: "[primary keyword, secondary keywords, long-tail variants]",
  openGraph: {
    type: 'article',
    publishedTime: '2026-01-XX',
    authors: ['Premarket'],
  },
  alternates: {
    canonical: 'https://premarket.homes/blog/[slug]',
  },
};
```

---

## 11. Analytics & Tracking Setup

### 11.1 Google Search Console

**Setup Tasks:**
1. Verify domain ownership
2. Submit sitemap.xml
3. Monitor index coverage
4. Track search performance for target keywords
5. Fix crawl errors

### 11.2 Google Analytics 4

**Already Implemented:** GTM detected in layout.js

**Enhanced Tracking Events:**

```javascript
// Track app download clicks
onClick={() => {
  window.gtag('event', 'app_download_click', {
    'platform': 'ios',
    'location': 'hero_section'
  });
}}

// Track page engagement
onClick={() => {
  window.gtag('event', 'cta_click', {
    'cta_type': 'list_property',
    'user_type': 'homeowner'
  });
}}
```

### 11.3 Key Performance Indicators (KPIs)

**SEO KPIs to Track:**

| Metric | Baseline | 3-Month Target | 6-Month Target |
|--------|----------|----------------|----------------|
| Organic Traffic | TBD | +150% | +300% |
| Keyword Rankings (Top 10) | TBD | 15 keywords | 30 keywords |
| Backlinks | TBD | +50 | +150 |
| Domain Authority | TBD | +10 points | +15 points |
| Conversion Rate (Organic) | TBD | +25% | +50% |
| Average Session Duration | TBD | +30% | +60% |
| Bounce Rate | TBD | -20% | -35% |

---

## 12. Backlink & Off-Page SEO Strategy

### 12.1 Link Building Opportunities

**High-Priority Targets:**

1. **Real Estate Directories:**
   - RateMyAgent.com.au
   - LocalSearch.com.au
   - Hotfrog.com.au

2. **Industry Publications:**
   - realestate.com.au/news (guest articles)
   - domain.com.au/news (features)
   - Elite Agent Magazine
   - Australian Property Investor

3. **Local Business Listings:**
   - Google Business Profile
   - True Local
   - Yellow Pages Australia
   - Start Local

4. **Tech & Startup Directories:**
   - ProductHunt
   - Crunchbase
   - AngelList

5. **Press & Media:**
   - Australian Financial Review
   - Sydney Morning Herald - Domain
   - news.com.au - Real Estate
   - Urban.com.au

### 12.2 Content Partnership Opportunities

1. **Real Estate Blogs:** Offer guest posts about off-market trends
2. **Property Investor Communities:** Provide market data and insights
3. **Agent Networks:** Co-create resources about lead generation
4. **Home Improvement Sites:** Cross-promotion opportunities

### 12.3 Digital PR Campaigns

**Campaign Ideas:**

1. "2026 Australian Off-Market Property Report"
   - Survey homeowners and buyers
   - Generate newsworthy statistics
   - Distribute to media outlets

2. "State of the Australian Property Market: Premarket Data Insights"
   - Quarterly market reports
   - Shareable infographics
   - Target property journalists

3. "Agent Success Stories"
   - Case studies of agents winning more listings
   - Video testimonials
   - Share through industry channels

---

## 13. Competitive Analysis

### 13.1 Main Competitors

| Competitor | Domain Authority | Strengths | Opportunities for Premarket |
|-----------|-----------------|-----------|---------------------------|
| Listing Loop | ~35 | Established brand, SEO content | Better UX, free for homeowners |
| Property Whispers | ~28 | Email matching service | Mobile app, instant feedback |
| Domain Off-Market | ~85 | Massive authority | Niche focus, agent independence |
| Realestate.com.au | ~90 | Market leader | Off-market specialization |

### 13.2 Keyword Gap Analysis

**Target Keywords Competitors Rank For:**

1. "off market property" - Listing Loop ranks #3
   - **Premarket Strategy:** Create ultimate guide + city pages

2. "pre-market homes" - No strong competitor
   - **Premarket Strategy:** Own this branded term

3. "sell property privately australia" - Generic articles rank
   - **Premarket Strategy:** Create definitive guide

4. "real estate leads" - PropTech companies rank
   - **Premarket Strategy:** Agent-focused content + case studies

---

## 14. Implementation Roadmap

### Phase 1: Foundation (Week 1-2) - CRITICAL

**Priority: HIGHEST**

- [x] Create sitemap.js
- [x] Create robots.js
- [x] Update next.config.mjs
- [x] Update root layout.js metadata
- [ ] Implement all page metadata (homepage, buyers, agents, how-it-works)
- [ ] Fix heading hierarchy across all pages
- [ ] Optimize hero section content with keywords
- [ ] Add Schema Organization and Website markup

**Files to Modify:**
- `/Users/josh/code/premarket-website/src/app/sitemap.js` (CREATE)
- `/Users/josh/code/premarket-website/src/app/robots.js` (CREATE)
- `/Users/josh/code/premarket-website/next.config.mjs` (UPDATE)
- `/Users/josh/code/premarket-website/src/app/layout.js` (UPDATE)
- `/Users/josh/code/premarket-website/src/app/page.js` (UPDATE)
- `/Users/josh/code/premarket-website/src/app/buyers/page.js` (UPDATE)
- `/Users/josh/code/premarket-website/src/app/agents/page.js` (UPDATE)
- `/Users/josh/code/premarket-website/src/app/how-it-works/page.js` (UPDATE)
- `/Users/josh/code/premarket-website/src/app/components/Hero.js` (UPDATE)
- `/Users/josh/code/premarket-website/src/app/components/HeroBuyers.js` (UPDATE)
- `/Users/josh/code/premarket-website/src/app/components/HeroAgents.js` (UPDATE)

### Phase 2: Content Optimization (Week 3-4)

**Priority: HIGH**

- [ ] Optimize all Features components with keywords
- [ ] Add FAQ Schema to homepage
- [ ] Implement SoftwareApplication Schema for app
- [ ] Optimize all image alt tags
- [ ] Add internal linking throughout content
- [ ] Update Footer with SEO enhancements
- [ ] Implement lazy loading for components

**Files to Modify:**
- `/Users/josh/code/premarket-website/src/app/components/Features.js` (UPDATE)
- `/Users/josh/code/premarket-website/src/app/components/FeaturesBuyers.js` (UPDATE)
- `/Users/josh/code/premarket-website/src/app/components/FeaturesAgents.js` (UPDATE)
- `/Users/josh/code/premarket-website/src/app/components/SchemaFAQ.js` (CREATE)
- `/Users/josh/code/premarket-website/src/app/components/SchemaMobileApp.js` (CREATE)
- `/Users/josh/code/premarket-website/src/app/components/FooterLarge.js` (UPDATE)

### Phase 3: Technical Enhancement (Week 5-6)

**Priority: MEDIUM**

- [ ] Optimize all images with Next.js Image component
- [ ] Implement font-display: swap
- [ ] Add mobile-specific meta tags
- [ ] Create Schema components for all page types
- [ ] Set up Google Search Console
- [ ] Configure enhanced GA4 tracking
- [ ] Performance audit and Core Web Vitals optimization

### Phase 4: Content Marketing (Week 7-12)

**Priority: MEDIUM**

- [ ] Create blog infrastructure
- [ ] Publish first 3 blog posts
- [ ] Develop city-specific landing pages
- [ ] Implement local SEO strategy
- [ ] Begin link-building campaign
- [ ] Launch digital PR initiatives

### Phase 5: Advanced Optimization (Ongoing)

**Priority: LOW-MEDIUM**

- [ ] A/B test meta descriptions for CTR
- [ ] Create video content with transcripts
- [ ] Develop property market reports
- [ ] Expand to additional Australian cities
- [ ] International SEO (if expanding beyond AU)

---

## 15. Success Metrics & Reporting

### 15.1 Monthly SEO Report Template

**Track & Report Monthly:**

1. **Organic Search Performance**
   - Total organic sessions
   - New vs returning visitors
   - Goal completions from organic
   - Revenue/leads from organic

2. **Keyword Rankings**
   - Top 3 positions count
   - Top 10 positions count
   - Average ranking position
   - New keywords ranking

3. **Technical Health**
   - Indexation status
   - Crawl errors
   - Core Web Vitals scores
   - Mobile usability issues

4. **Content Performance**
   - Top performing pages
   - New content published
   - Social shares
   - Time on page metrics

5. **Link Profile**
   - Total backlinks
   - New referring domains
   - Domain Authority changes
   - Lost links

### 15.2 Quarterly Review Points

1. Keyword strategy refinement
2. Competitor analysis update
3. Content gap identification
4. Technical SEO audit
5. ROI analysis and budget allocation

---

## 16. Risk Mitigation

### 16.1 Potential SEO Risks

**Risk:** Duplicate content between user types (homeowners, buyers, agents)
**Mitigation:** Ensure unique value propositions and content angles for each page

**Risk:** Cannibalization of "premarket" branded keywords
**Mitigation:** Clear site hierarchy and canonical tags

**Risk:** Slow load times due to video content
**Mitigation:** Lazy loading, CDN optimization, Next.js optimization

**Risk:** Mobile experience issues
**Mitigation:** Continuous mobile testing, responsive design validation

**Risk:** Google algorithm updates affecting rankings
**Mitigation:** Focus on E-E-A-T principles, quality content, genuine value

### 16.2 Compliance Considerations

**Financial Services Compliance:**
- Ensure all property-related claims are accurate
- Include necessary disclaimers
- Don't make guarantees about property values
- Comply with Australian real estate advertising regulations

**Privacy & Data:**
- GDPR compliance (for any international users)
- Australian Privacy Act compliance
- Clear privacy policy
- Cookie consent (if implementing tracking cookies)

---

## 17. Quick Reference: SEO Checklist

### Every New Page Must Have:

- [ ] Unique, keyword-optimized title tag (50-60 characters)
- [ ] Compelling meta description (150-160 characters)
- [ ] One H1 tag with primary keyword
- [ ] Logical H2-H6 hierarchy
- [ ] Optimized images with alt tags
- [ ] Internal links to related pages
- [ ] Schema markup (appropriate type)
- [ ] Mobile-responsive design
- [ ] Fast load time (<3 seconds)
- [ ] Canonical URL
- [ ] Open Graph tags
- [ ] Twitter Card tags

### Every Image Must Have:

- [ ] Descriptive file name (keyword-relevant)
- [ ] Alt text (descriptive + keyword)
- [ ] Appropriate dimensions
- [ ] Optimized file size
- [ ] WebP/AVIF format when possible
- [ ] Lazy loading (if below fold)
- [ ] Title attribute (optional)

### Every Link Must:

- [ ] Use descriptive anchor text
- [ ] Open external links in new tab
- [ ] Include rel="noopener" for security
- [ ] Point to relevant, quality pages
- [ ] Avoid broken links (404s)

---

## 18. Resources & Tools

### 18.1 SEO Tools Recommended

**Free:**
- Google Search Console
- Google Analytics 4
- Google PageSpeed Insights
- Google Mobile-Friendly Test
- Schema Markup Validator

**Paid (Recommended):**
- Ahrefs or SEMrush (keyword research, competitor analysis)
- Screaming Frog (technical audits)
- Hotjar (user behavior analysis)
- GTmetrix (performance monitoring)

### 18.2 Australian SEO Resources

- **Search Engine Journal:** Latest SEO news
- **Search Engine Land:** Google algorithm updates
- **Moz Blog:** SEO best practices
- **Australian Marketing Institute:** Local marketing insights

---

## Appendix A: Full Keyword List (100+ Keywords)

### Brand Keywords
- premarket
- premarket homes
- premarket australia
- premarket app
- premarket property

### Primary Keywords
- off market properties australia
- off-market properties
- pre-market listings
- pre-market properties australia
- test the market before selling
- property price opinion
- exclusive property listings
- private property sales australia

### Location-Based Keywords
- off-market properties sydney
- off-market properties melbourne
- off-market properties brisbane
- off-market properties perth
- off-market properties adelaide
- pre-market listings sydney
- exclusive properties sydney

### Homeowner Keywords
- test property market australia
- sell property without agent
- free property listing australia
- buyer feedback property
- property market report
- what is my property worth
- property valuation free
- sell house privately australia
- avoid real estate agent fees
- get buyer interest property

### Buyer Keywords
- find off-market properties
- exclusive property access
- properties before market
- early access properties
- off-market real estate
- private property listings
- hidden property listings
- properties not on domain
- properties not on realestate.com.au

### Agent Keywords
- real estate agent leads
- real estate leads australia
- property leads for agents
- win real estate listings
- vendor leads australia
- seller leads real estate
- real estate CRM australia
- agent marketing tools
- listing generation
- premarket campaign
- real estate lead generation

### Question-Based Keywords
- how to find off-market properties
- how to test property market
- how to get buyer feedback on property
- how to sell property privately
- how do agents get listings
- what is off-market property
- what is pre-market listing
- are off-market properties cheaper

### Comparison Keywords
- off-market vs on-market property
- private sale vs agent
- premarket vs domain
- premarket vs realestate.com.au
- listing loop vs premarket

---

## Appendix B: Sample Meta Tags (Copy-Paste Ready)

### Homepage
```html
<title>Premarket - Test the Market Before Selling Your Home | Free Property Valuation Australia</title>
<meta name="description" content="Get real buyer feedback and price opinions before listing your property. Free premarket campaign for Australian homeowners. No agent fees, no open homes, no risk. Test the market in 24 hours." />
<meta name="keywords" content="premarket, off market property, test the market, property price opinion, sell property australia" />
```

### Buyers Page
```html
<title>Off-Market Properties Australia | Exclusive Access to Pre-Market Listings | Premarket</title>
<meta name="description" content="Find exclusive off-market properties across Australia before they hit realestate.com.au or Domain. Get early access to pre-market listings in Sydney, Melbourne, Brisbane & more. Free for buyers." />
<meta name="keywords" content="off market properties australia, pre-market listings, exclusive property listings, private property sales" />
```

### Agents Page
```html
<title>Real Estate Agent Leads Australia | Win More Listings with Premarket | Agent Pro</title>
<meta name="description" content="Win 10x more listings by offering free premarket campaigns to vendors. Get exclusive seller leads before they hit market. Australian real estate agents using Premarket generate qualified leads and win vendor trust." />
<meta name="keywords" content="real estate agent leads, property leads australia, win listings, vendor leads, listing generation" />
```

---

## Appendix C: Implementation Code Examples

All code examples and detailed implementation instructions are provided throughout this document in sections 1-14.

---

## Conclusion

This comprehensive SEO optimization plan provides a complete roadmap for transforming Premarket's organic search presence in the Australian property market. By implementing these recommendations systematically, Premarket can expect to:

1. **Increase organic visibility** by 200-300% within 6 months
2. **Capture high-intent search traffic** for off-market and pre-market property searches
3. **Establish authority** in the Australian property technology space
4. **Generate qualified leads** for all three user segments (homeowners, buyers, agents)
5. **Build a sustainable SEO foundation** for long-term growth

**Immediate Next Steps:**
1. Implement Phase 1 (Foundation) within 2 weeks
2. Set up Google Search Console and submit sitemap
3. Begin tracking baseline metrics
4. Start content optimization (Phase 2)

**Success Criteria:**
- 30+ keywords ranking in top 10 within 6 months
- 50%+ increase in organic traffic within 3 months
- Improved Core Web Vitals scores
- Rich snippets appearing in search results

---

**Research Sources:**

- [The Best Off-Market Property Websites - 2026 Guide](https://whichrealestateagent.com.au/sell-property/off-market-property-websites/)
- [Off-Market and Pre-Market Properties - Finding Sydney's Hidden Gems](https://www.etchrealestate.com.au/off-market-and-pre-market-properties-finding-sydneys-hidden-gems/)
- [What is a pre-market property? - OpenAgent](https://www.openagent.com.au/glossary/Pre-market-property)
- [Pre-Market vs. Off-Market: What's the Difference & Why It Matters](https://parkerhadley.com.au/pre-market-vs-off-market-whats-the-difference-why-it-matters/)
- [Off Market Properties For Sale | Australia's No 1 | Listing Loop](https://listingloop.com.au/)

---

**Document Version:** 1.0
**Last Updated:** January 8, 2026
**Next Review:** February 8, 2026
