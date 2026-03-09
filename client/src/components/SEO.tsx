import { useEffect } from 'react';
import { useLocation } from 'wouter';

export interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  author?: string;
  canonicalUrl?: string;
}

const DEFAULT_OG_IMAGE = 'https://twangle.org/twangle-logo.png';
const SITE_NAME = 'Twangle';
const TWITTER_HANDLE = '@twangle';

export function SEO({
  title,
  description,
  keywords,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  author,
  canonicalUrl,
}: SEOProps) {
  const [location] = useLocation();
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const url = canonicalUrl || `https://twangle.org${location}`;

  useEffect(() => {
    document.title = fullTitle;

    const updateMetaTag = (selector: string, attribute: string, content: string) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        if (selector.includes('property=')) {
          element.setAttribute('property', selector.split('"')[1]);
        } else if (selector.includes('name=')) {
          element.setAttribute('name', selector.split('"')[1]);
        }
        document.head.appendChild(element);
      }
      element.setAttribute(attribute, content);
    };

    updateMetaTag('meta[name="description"]', 'content', description);
    
    if (keywords) {
      updateMetaTag('meta[name="keywords"]', 'content', keywords);
    }

    if (author) {
      updateMetaTag('meta[name="author"]', 'content', author);
    }

    updateMetaTag('meta[property="og:title"]', 'content', fullTitle);
    updateMetaTag('meta[property="og:description"]', 'content', description);
    updateMetaTag('meta[property="og:image"]', 'content', ogImage);
    updateMetaTag('meta[property="og:url"]', 'content', url);
    updateMetaTag('meta[property="og:type"]', 'content', ogType);
    updateMetaTag('meta[property="og:site_name"]', 'content', SITE_NAME);

    updateMetaTag('meta[name="twitter:card"]', 'content', 'summary_large_image');
    updateMetaTag('meta[name="twitter:site"]', 'content', TWITTER_HANDLE);
    updateMetaTag('meta[name="twitter:title"]', 'content', fullTitle);
    updateMetaTag('meta[name="twitter:description"]', 'content', description);
    updateMetaTag('meta[name="twitter:image"]', 'content', ogImage);

    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = url;
  }, [fullTitle, description, keywords, ogImage, url, ogType, author]);

  return null;
}

export const SEO_CONTENT = {
  home: {
    title: 'Twangle - Strengthen Your Relationship with AI-Powered Coaching',
    description: 'Discover your attachment patterns and build stronger relationships. AI-powered relationship coaching, free attachment style assessment, couples retreat planning, and research-based exercises.',
    keywords: 'relationship coaching, attachment style, couples therapy, AI coach, relationship assessment, couples retreat, communication skills',
  },
  assessment: {
    title: 'Free Attachment Style Assessment - Discover Your Relationship Patterns',
    description: 'Take our free 20-question attachment style assessment. Understand your secure, anxious, avoidant, or fearful attachment patterns and get personalized insights to improve your relationships.',
    keywords: 'attachment style test, attachment theory, relationship assessment, anxious attachment, avoidant attachment, secure attachment, fearful attachment',
  },
  coach: {
    title: 'AI Relationship Coach - Get Expert Guidance with AI Coach Charles',
    description: 'Chat with AI Coach Charles, your AI relationship coach trained in Gottman Method, Emotionally Focused Therapy, and Attachment Theory. Get personalized advice for your unique relationship challenges.',
    keywords: 'relationship coach, AI therapist, couples counseling, Gottman Method, EFT therapy, relationship advice, marriage counseling',
    author: 'AI Coach Charles, AI Relationship Coach',
  },
  retreat: {
    title: 'DIY Couples Retreat Planner - Create Your Perfect Relationship Getaway',
    description: 'Plan a personalized couples retreat with AI-powered itineraries. Choose your vibe, goals, and activities. Get research-backed exercises from Gottman Method and Attachment Theory.',
    keywords: 'couples retreat, relationship retreat, romantic getaway, couples activities, marriage retreat, relationship workshop',
  },
  exercises: {
    title: 'Free Relationship Exercises - Evidence-Based Tools for Couples',
    description: 'Access our library of research-based relationship exercises. Improve communication, build intimacy, and strengthen your bond with proven techniques from leading relationship experts.',
    keywords: 'relationship exercises, couples activities, communication exercises, intimacy building, trust exercises, conflict resolution',
  },
  dateNight: {
    title: 'AI Date Night Planner - Personalized Romantic Date Ideas',
    description: 'Get AI-powered date night recommendations tailored to your budget, interests, and location. Create meaningful experiences that strengthen your relationship.',
    keywords: 'date night ideas, romantic dates, couples activities, date planning, relationship building, quality time',
  },
  summaries: {
    title: 'Weekly Coaching Summaries - Track Your Relationship Progress',
    description: 'Review your coaching sessions with AI-generated summaries and action items. Track your relationship growth and stay accountable to your goals.',
    keywords: 'relationship progress, coaching summaries, relationship tracking, personal growth, accountability',
  },
  pricing: {
    title: 'Pricing - Free Forever Relationship Coaching',
    description: 'Twangle is 100% free forever. Get full access to attachment style assessments, relationship exercises, AI coaching, and couples retreat planning without any cost.',
    keywords: 'free relationship coaching, free attachment style test, free couples therapy tools, relationship help',
  },
  settings: {
    title: 'Settings',
    description: 'Manage your account settings and track your relationship journey.',
    keywords: 'account settings, profile management',
  },
};
