import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2" data-testid="link-back-home">
              <ArrowLeft className="w-4 h-4" />
              Back to Twangle
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="font-display font-bold text-4xl mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: October 1, 2025</p>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="font-semibold text-2xl mb-4">1. Introduction</h2>
            <p>
              Twangle ("we," "our," or "us") respects your privacy and is committed to protecting your personal information. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service 
              at twanglement.com.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-2xl mb-4">2. Information We Collect</h2>
            
            <h3 className="font-semibold text-xl mb-3 mt-4">2.1 Information from Facebook</h3>
            <p>When you log in via Facebook, we collect:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your name</li>
              <li>Email address</li>
              <li>Profile picture</li>
              <li>Facebook user ID</li>
            </ul>

            <h3 className="font-semibold text-xl mb-3 mt-4">2.2 Information You Provide</h3>
            <p>When using our Service, you may provide:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Responses to attachment style assessments</li>
              <li>Messages and conversations with Coach Charles (AI)</li>
              <li>Feedback and survey responses</li>
              <li>Relationship progress notes</li>
              <li>DIY Couples retreat plans and preferences</li>
            </ul>

            <h3 className="font-semibold text-xl mb-3 mt-4">2.3 Automatically Collected Information</h3>
            <p>We automatically collect certain information when you use our Service:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Device information (browser type, operating system)</li>
              <li>Usage data (pages visited, features used, time spent)</li>
              <li>Session information and cookies</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-2xl mb-4">3. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide and maintain the Service</li>
              <li>Personalize your coaching experience</li>
              <li>Generate AI-powered relationship guidance and summaries</li>
              <li>Improve our Service and develop new features</li>
              <li>Communicate with you about updates and changes</li>
              <li>Analyze usage patterns to enhance user experience</li>
              <li>Ensure security and prevent fraud</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-2xl mb-4">4. AI and Data Processing</h2>
            <p>
              We use OpenAI's GPT models to power Coach Charles. When you interact with the AI coach:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your messages are sent to OpenAI's API for processing</li>
              <li>OpenAI processes your data according to their own privacy policy and data usage policies</li>
              <li>We do not use your conversations to train our own AI models</li>
              <li>Conversation data is stored to provide context and generate summaries</li>
            </ul>
            <p className="mt-4">
              For more information about OpenAI's data practices, please visit: <a href="https://openai.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline">https://openai.com/privacy</a>
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-2xl mb-4">5. Data Sharing and Disclosure</h2>
            <p>We do not sell your personal information. We may share your information only in the following circumstances:</p>
            
            <h3 className="font-semibold text-xl mb-3 mt-4">5.1 Service Providers</h3>
            <p>We share information with third-party service providers who help us operate the Service:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Facebook (for authentication)</li>
              <li>OpenAI (for AI coaching functionality)</li>
              <li>Hosting and infrastructure providers</li>
            </ul>

            <h3 className="font-semibold text-xl mb-3 mt-4">5.2 Legal Requirements</h3>
            <p>We may disclose your information if required by law or in response to valid legal requests.</p>

            <h3 className="font-semibold text-xl mb-3 mt-4">5.3 Business Transfers</h3>
            <p>
              If Twangle is involved in a merger, acquisition, or sale of assets, your information may be transferred. 
              We will provide notice before your information is transferred and becomes subject to a different privacy policy.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-2xl mb-4">6. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information, including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Secure HTTPS connections</li>
              <li>Session-based authentication with secure cookies</li>
              <li>Regular security assessments</li>
              <li>Access controls and monitoring</li>
            </ul>
            <p className="mt-4">
              However, no method of transmission over the Internet or electronic storage is 100% secure. 
              While we strive to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-2xl mb-4">7. Data Retention</h2>
            <p>
              We retain your personal information for as long as your account is active or as needed to provide you services. 
              We will retain and use your information as necessary to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Comply with legal obligations</li>
              <li>Resolve disputes</li>
              <li>Enforce our agreements</li>
              <li>Provide continued service</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-2xl mb-4">8. Your Privacy Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your information (subject to legal requirements)</li>
              <li>Object to processing of your information</li>
              <li>Withdraw consent at any time (where we rely on consent)</li>
            </ul>
            <p className="mt-4">
              To exercise these rights, please contact us through the feedback feature in the app or log out to discontinue use of the Service.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-2xl mb-4">9. Children's Privacy</h2>
            <p>
              Our Service is not intended for individuals under the age of 18. We do not knowingly collect personal information 
              from children. If you are a parent or guardian and believe your child has provided us with personal information, 
              please contact us, and we will delete such information.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-2xl mb-4">10. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your country of residence. 
              These countries may have data protection laws that are different from the laws of your country. 
              By using our Service, you consent to such transfers.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-2xl mb-4">11. Cookies and Tracking</h2>
            <p>We use cookies and similar tracking technologies to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Maintain your session and keep you logged in</li>
              <li>Remember your preferences</li>
              <li>Understand how you use our Service</li>
            </ul>
            <p className="mt-4">
              You can control cookies through your browser settings, but disabling cookies may affect your ability to use the Service.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-2xl mb-4">12. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy 
              on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-2xl mb-4">13. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or our privacy practices, please contact us through the feedback 
              feature in the app.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-2xl mb-4">14. California Privacy Rights</h2>
            <p>
              If you are a California resident, you have specific rights under the California Consumer Privacy Act (CCPA), including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>The right to know what personal information we collect and how we use it</li>
              <li>The right to request deletion of your personal information</li>
              <li>The right to opt-out of the sale of your personal information (we do not sell personal information)</li>
              <li>The right to non-discrimination for exercising your privacy rights</li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
