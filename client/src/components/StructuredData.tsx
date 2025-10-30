import { useEffect } from 'react';

interface StructuredDataProps {
  data: object;
}

export function StructuredData({ data }: StructuredDataProps) {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    script.id = 'structured-data-' + Math.random().toString(36).substring(7);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [data]);

  return null;
}

export const ORGANIZATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Twangle',
  alternateName: 'Two Tangled Together',
  url: 'https://twangle.org',
  logo: 'https://twangle.org/logo.png',
  description: 'AI-powered relationship coaching platform offering attachment style assessments, couples retreat planning, and evidence-based relationship exercises.',
  sameAs: [
    'https://www.facebook.com/twangle',
    'https://www.linkedin.com/company/twangle',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Service',
    email: 'support@twangle.org',
  },
};

export const SERVICE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Relationship Coaching Services',
  description: 'Professional relationship coaching combining AI technology with evidence-based therapeutic approaches including Gottman Method, Emotionally Focused Therapy, and Attachment Theory.',
  provider: {
    '@type': 'Organization',
    name: 'Twangle',
    url: 'https://twangle.org',
  },
  serviceType: 'Relationship Counseling',
  areaServed: 'Worldwide',
  availableChannel: {
    '@type': 'ServiceChannel',
    serviceUrl: 'https://twangle.org',
    serviceType: 'Online',
  },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Relationship Coaching Services',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Free Attachment Style Assessment',
          description: '20-question assessment to discover your attachment patterns',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'AI Relationship Coach',
          description: 'Unlimited chat sessions with AI coach trained in evidence-based methods',
        },
        price: '20',
        priceCurrency: 'USD',
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'DIY Couples Retreat Planner',
          description: 'Personalized retreat itineraries with research-backed activities',
        },
        price: '20',
        priceCurrency: 'USD',
      },
    ],
  },
};

export const PERSON_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Charles Watson',
  jobTitle: 'Certified Relationship Coach',
  description: 'Relationship coach specializing in Gottman Method, Emotionally Focused Therapy (EFT), and Attachment Theory. Founder of Twangle, an AI-powered relationship coaching platform.',
  url: 'https://twangle.org/coach',
  worksFor: {
    '@type': 'Organization',
    name: 'Twangle',
  },
  knowsAbout: [
    'Gottman Method',
    'Emotionally Focused Therapy',
    'Attachment Theory',
    'Relationship Counseling',
    'Couples Therapy',
    'Communication Skills',
  ],
};

export function createFAQSchema(questions: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };
}

export function createBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
