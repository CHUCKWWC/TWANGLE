import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsOfService() {
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
        <h1 className="font-display font-bold text-4xl mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: October 1, 2025</p>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="font-semibold text-2xl mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Twangle ("the Service") at twanglement.com, you accept and agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-2xl mb-4">2. Description of Service</h2>
            <p>
              Twangle is a relationship coaching platform that provides AI-powered guidance, exercises, and tools to help couples strengthen 
              their relationships. The Service includes but is not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>AI relationship coaching ("Coach Charles")</li>
              <li>Attachment style assessments</li>
              <li>Science-based relationship exercises</li>
              <li>DIY retreat planning tools</li>
              <li>Weekly relationship summaries</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-2xl mb-4">3. User Accounts and Authentication</h2>
            <p>
              To use the Service, you must authenticate via Facebook. By creating an account, you agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Be responsible for all activities under your account</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-2xl mb-4">4. AI Coaching Disclaimer</h2>
            <p className="font-semibold">
              Important: Coach Charles is an AI tool and does not replace professional therapy or counseling.
            </p>
            <p>
              The coaching and advice provided through our Service is for informational and educational purposes only. 
              It is not a substitute for professional mental health care, marriage counseling, or therapy. If you are experiencing 
              a mental health crisis, relationship violence, or need professional help, please contact a licensed therapist or 
              call appropriate emergency services.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-2xl mb-4">5. User Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the Service for any illegal purpose</li>
              <li>Attempt to gain unauthorized access to the Service or related systems</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Use the Service to transmit harmful code or malicious content</li>
              <li>Violate any applicable laws or regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-2xl mb-4">6. Intellectual Property</h2>
            <p>
              All content, features, and functionality of the Service, including but not limited to text, graphics, logos, and software, 
              are the property of Twangle and are protected by copyright, trademark, and other intellectual property laws. 
              You may not reproduce, distribute, or create derivative works without our express written permission.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-2xl mb-4">7. Privacy</h2>
            <p>
              Your use of the Service is also governed by our <Link href="/privacy" className="text-primary underline">Privacy Policy</Link>. 
              Please review it to understand our practices regarding your personal information.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-2xl mb-4">8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Twangle shall not be liable for any indirect, incidental, special, consequential, 
              or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, 
              use, goodwill, or other intangible losses resulting from:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your use or inability to use the Service</li>
              <li>Any unauthorized access to or use of our servers and/or personal information</li>
              <li>Any interruption or cessation of the Service</li>
              <li>Any reliance on advice or guidance provided through the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-2xl mb-4">9. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms of Service at any time. We will notify users of any material changes by 
              posting the new Terms of Service on this page and updating the "Last updated" date. Your continued use of the Service 
              after changes constitutes acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-2xl mb-4">10. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your access to the Service at any time, with or without cause or notice, 
              for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties, or for 
              any other reason in our sole discretion.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-2xl mb-4">11. Governing Law</h2>
            <p>
              These Terms of Service shall be governed by and construed in accordance with the laws of the United States, 
              without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-2xl mb-4">12. Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us through the feedback feature in the app.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
