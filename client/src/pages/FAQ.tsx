import { SEO, SEO_CONTENT } from '@/components/SEO';
import { StructuredData, createFAQSchema } from '@/components/StructuredData';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';

const FAQ_DATA = [
  {
    question: 'What is attachment style and why does it matter?',
    answer: 'Attachment style is a pattern of how you connect with others in close relationships, formed in childhood. It affects how you communicate, handle conflict, and maintain intimacy. Understanding your style helps you recognize patterns and improve relationship dynamics.',
  },
  {
    question: 'How accurate is the attachment style assessment?',
    answer: 'Our 20-question assessment is based on validated attachment theory research. While not a clinical diagnosis, it provides valuable insights into your relationship patterns. Results are analyzed by AI trained on attachment theory principles for personalized interpretation.',
  },
  {
    question: 'What is the Gottman Method?',
    answer: 'The Gottman Method is a research-based approach to couples therapy developed by Drs. John and Julie Gottman. Based on 40+ years of research, it focuses on building friendship, managing conflict, and creating shared meaning in relationships.',
  },
  {
    question: 'How does AI coaching compare to traditional therapy?',
    answer: 'AI coaching provides 24/7 accessible guidance based on evidence-based methods. It complements but doesn\'t replace professional therapy. It\'s ideal for general relationship improvement, while serious issues may require licensed therapists for personalized clinical care.',
  },
  {
    question: 'Can I use Twangle if I\'m single?',
    answer: 'Yes! Understanding your attachment style benefits all relationships—romantic, family, and friendships. Our exercises and coaching help you develop healthier relationship patterns before entering or during any relationship stage.',
  },
  {
    question: 'How much does Twangle cost?',
    answer: 'Twangle is 100% free for all users. This includes the attachment style assessment, relationship exercises library, date night planner, AI coaching, and couples retreats. No subscription or credit card is required.',
  },
  {
    question: 'Is everything really free?',
    answer: 'Yes. Every feature on Twangle is completely free to help as many couples as possible strengthen their relationships with evidence-based methods.',
  },
  {
    question: 'How do I plan a couples retreat?',
    answer: 'Use our retreat planner to select your vibe, goals, and preferences. The AI generates a personalized itinerary with research-backed activities, timing suggestions, and framework citations from Gottman Method, EFT, and Attachment Theory.',
  },
  {
    question: 'Is my data private and secure?',
    answer: 'Yes. All conversations and assessment results are encrypted and stored securely. We never share your personal data with third parties. You can delete your data anytime from your profile settings.',
  },
  {
    question: 'How do I share with my partner?',
    answer: 'Both partners can create free accounts to take assessments and receive coaching. You can then share your individual insights with each other to grow together.',
  },
  {
    question: 'What is Emotionally Focused Therapy (EFT)?',
    answer: 'EFT is a proven approach to couples therapy that focuses on emotional bonding. Developed by Dr. Sue Johnson, it helps partners recognize emotional patterns, express underlying needs, and create secure emotional connections.',
  },
  {
    question: 'How long does the assessment take?',
    answer: 'The attachment style assessment takes about 5-10 minutes. Answer 20 questions honestly about how you typically feel and behave in close relationships. Results and AI analysis are provided immediately after completion.',
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Since Twangle is completely free, there are no subscriptions to cancel. You can stop using the app or delete your account at any time from your profile settings.',
  },
  {
    question: 'How often should couples do relationship exercises?',
    answer: 'Consistency matters more than frequency. Start with one exercise weekly, then adjust based on your schedule. Regular practice—even 15-20 minutes weekly—builds communication skills and intimacy more effectively than sporadic intensive sessions.',
  },
];

export default function FAQ() {
  const faqSchema = createFAQSchema(FAQ_DATA);

  return (
    <>
      <SEO
        title="Frequently Asked Questions About Relationship Coaching"
        description="Get answers to common questions about attachment styles, AI relationship coaching, couples therapy, and how Twangle helps strengthen relationships with evidence-based methods."
        keywords="relationship FAQ, attachment style questions, couples therapy questions, AI coaching answers, relationship help"
      />
      <StructuredData data={faqSchema} />

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about attachment styles, relationship coaching, and how Twangle can help strengthen your relationship.
            </p>
          </div>

          <Card className="p-6">
            <Accordion type="single" collapsible className="w-full">
              {FAQ_DATA.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} data-testid={`faq-item-${index}`}>
                  <AccordionTrigger className="text-left" data-testid={`faq-question-${index}`}>
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground" data-testid={`faq-answer-${index}`}>
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>

          <div className="mt-12 text-center">
            <h2 className="text-2xl font-semibold mb-4">Still have questions?</h2>
            <p className="text-muted-foreground mb-6">
              Can't find the answer you're looking for? Our AI coach is here to help.
            </p>
            <a
              href="/coach"
              className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-3 hover-elevate active-elevate-2"
              data-testid="link-ask-coach"
            >
              Ask Coach Charles
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
