import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';

/**
 * Terms of Use Agreement modal – scrollable with table of contents (same style as Privacy/Refund/Safety).
 * When asPage=true, renders as full page (no overlay) for /terms route.
 */
export default function TermsOfUseModal({ isOpen, onClose, asPage }) {
  useEffect(() => {
    if (!isOpen && !asPage) return;
    if (asPage) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, asPage]);

  if (!isOpen && !asPage) return null;

  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toc = [
    { id: 'section-1', label: '1. Introduction' },
    { id: 'section-2', label: '2. Who We Are' },
    { id: 'section-3', label: '3. Acceptance of These Terms' },
    { id: 'section-4', label: '4. Age Requirement' },
    { id: 'section-5', label: '5. Membership Overview' },
    { id: 'section-6', label: '6. Credits, Subscriptions & Payments' },
    { id: 'section-7', label: '7. Pricing & Credit Usage' },
    { id: 'section-8', label: '8. Terminated or Deleted Accounts' },
    { id: 'section-9', label: '9. User Eligibility & Accuracy' },
    { id: 'section-10', label: '10. Account Security' },
    { id: 'section-11', label: '11. Acceptable Use & Restrictions' },
    { id: 'section-12', label: '12. User Content' },
    { id: 'section-13', label: '13. Prohibited Content' },
    { id: 'section-14', label: '14. Communications & Messaging' },
    { id: 'section-15', label: '15. Account Termination' },
    { id: 'section-16', label: '16. Intellectual Property' },
    { id: 'section-17', label: '17. Disclaimers' },
    { id: 'section-18', label: '18. Limitation of Liability' },
    { id: 'section-19', label: '19. Dispute Resolution' },
    { id: 'section-20', label: '20. Governing Law' },
    { id: 'section-21', label: '21. Miscellaneous' },
    { id: 'section-22', label: '22. Entire Agreement' },
    { id: 'section-23', label: '23. Contact Us' },
  ];

  const content = (
    <>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Vantage Dating – Terms of Use Agreement</h2>
          {asPage ? (
            <Link to="/" className="text-sm font-medium text-blue-600 hover:text-blue-800">← Back to Home</Link>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition"
              aria-label="Close"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="overflow-y-auto px-6 py-5 text-gray-800 text-sm leading-relaxed">
          <p className="mb-6 text-gray-600">Last Updated: 05 February 2026</p>

          <h3 className="text-base font-bold text-gray-900 mb-2">TABLE OF CONTENTS</h3>
          <div className="mb-6 space-y-1">
            {toc.map(({ id, label }) => (
              <button key={id} type="button" onClick={() => scrollToId(id)} className="block w-full text-left text-blue-600 hover:underline font-medium">
                {label}
              </button>
            ))}
          </div>

          <section id="section-1" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">1. Introduction</h3>
            <p className="mb-2">Welcome to Vantage Dating (&quot;Platform&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). These Terms of Use (&quot;Agreement&quot;) govern your access to and use of our website, mobile applications, downloadable software, social media pages, and all related services (collectively, the &quot;Services&quot;).</p>
            <p className="mb-2">By accessing or using the Services, you confirm that you have read, understood, and agreed to this Agreement, our Privacy Policy, and our Refund & Cancellation Policy.</p>
            <p>If you do not agree, you must stop using the Services immediately.</p>
          </section>

          <section id="section-2" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">2. Who We Are</h3>
            <p>Vantage Dating is operated by Vantage Dating. Company details are provided in the Contact Us section at the end of this Agreement.</p>
          </section>

          <section id="section-3" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">3. Acceptance of These Terms</h3>
            <p className="mb-2">You accept this Agreement when you:</p>
            <ul className="list-disc pl-6 mb-2 space-y-1">
              <li>Register an account</li>
              <li>Access or use any part of the Services</li>
              <li>Purchase credits or subscriptions</li>
            </ul>
            <p>Your continued use of the Services confirms ongoing acceptance of these Terms.</p>
          </section>

          <section id="section-4" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">4. Age Requirement</h3>
            <ul className="list-disc pl-6 mb-2 space-y-1">
              <li>The Services are strictly for individuals 18 years of age or older</li>
              <li>Accounts belonging to minors will be removed immediately</li>
              <li>Any data collected from underage users will be deleted</li>
            </ul>
            <p>If you believe we have collected data from a minor, please notify us via Contact Us.</p>
          </section>

          <section id="section-5" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">5. Membership Overview</h3>
            <h4 className="font-semibold text-gray-900 mt-3 mb-1">5.1 Members</h4>
            <p className="mb-2">Upon registration, you become a Member. Members may: browse profiles; maintain a searchable profile; edit personal information; read messages (web version only); purchase paid features or subscriptions.</p>
            <p className="mb-3">Each person may maintain only one account. Duplicate accounts will be blocked. Profile information is visible to other users of the platform.</p>
            <h4 className="font-semibold text-gray-900 mt-3 mb-1">5.2 Verified Members</h4>
            <p className="mb-2">Members may earn a Verified status by completing identity verification when offered by the platform, including: government-issued ID submission; biometric verification where applicable. Verification remains valid for six (6) months and must be renewed to remain active.</p>
            <h4 className="font-semibold text-gray-900 mt-3 mb-1">5.3 Paying Members</h4>
            <p className="mb-2">Paying Members use the platform under a pay-per-action model with no interaction limits. They may communicate with both Free Users and other Paying Members. Paying Members do not display a special badge.</p>
            <h4 className="font-semibold text-gray-900 mt-3 mb-1">5.4 Free Users</h4>
            <p className="mb-2">Free Users may access the platform at no cost but with limited functionality. Free Users: are marked with a &quot;Free User&quot; indicator; must follow Community Standards and special communication rules; cannot receive monetary compensation; must maintain accurate, high-quality profile information.</p>
            <p>Any Free User receiving payment or compensation will be permanently banned.</p>
          </section>

          <section id="section-6" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">6. Credits, Subscriptions & Payments</h3>
            <h4 className="font-semibold text-gray-900 mt-3 mb-1">6.1 Credit System</h4>
            <p className="mb-2">Credits are required to access premium features such as messaging, media sharing, and calls. Credits may be obtained via: Monthly Credit Pack subscriptions; one-time credit purchases. Subscriptions renew automatically unless cancelled.</p>
            <h4 className="font-semibold text-gray-900 mt-3 mb-1">6.2 Automatic Renewal</h4>
            <p className="mb-2">By subscribing, you authorize recurring charges to your selected payment method. Renewal occurs at the end of each billing period. Fees may change with prior notice. Taxes may apply. Failure to process payment may result in account suspension.</p>
            <h4 className="font-semibold text-gray-900 mt-3 mb-1">6.3 Subscription Cancellation</h4>
            <p>You may cancel at any time via: Settings → Manage Account → Cancel Subscription. Cancellation prevents future charges but does not refund the current billing period.</p>
          </section>

          <section id="section-7" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">7. Pricing & Credit Usage</h3>
            <p className="mb-2">Credits are consumed in the following order: Bonus Credits; Promotional Credits; Purchased Credits.</p>
            <p className="mb-2">Prices for services are displayed at the time of purchase and may vary by feature. Unused credits expire according to the Refund & Cancellation Policy.</p>
          </section>

          <section id="section-8" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">8. Terminated or Deleted Accounts</h3>
            <p className="mb-2">If another Member: deletes their account; stops using the platform; or is removed due to violations — Vantage Dating may issue limited refunds at its sole discretion, typically up to 10 credits for the most recent interaction.</p>
            <p>No refunds are issued if a Member leaves after finding a match.</p>
          </section>

          <section id="section-9" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">9. User Eligibility & Accuracy</h3>
            <p className="mb-2">By using the Services, you confirm that: you are legally permitted to enter this Agreement; all information you provide is accurate and complete; payment details belong to you or are lawfully authorized.</p>
            <p>Providing false information may result in account suspension.</p>
          </section>

          <section id="section-10" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">10. Account Security</h3>
            <p className="mb-2">You are solely responsible for: maintaining password confidentiality; all activity performed under your account.</p>
            <p>We are not responsible for losses caused by: credential sharing; device loss; negligent security practices.</p>
          </section>

          <section id="section-11" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">11. Acceptable Use & Restrictions</h3>
            <p className="mb-2">The Services are for personal, non-commercial use only. You may not: operate multiple accounts; use bots, automation, or fake identities; collect user data; advertise or solicit services; receive payment for platform activity.</p>
            <p>Violations may result in termination and legal action.</p>
          </section>

          <section id="section-12" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">12. User Content</h3>
            <p className="mb-2">You are responsible for all content you upload or share. We reserve the right to: review, store, or remove content; suspend accounts for violations; cooperate with law enforcement when required.</p>
            <p>By posting content, you grant us a worldwide, perpetual, royalty-free license to use it for platform operation.</p>
          </section>

          <section id="section-13" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">13. Prohibited Content</h3>
            <p className="mb-2">Prohibited content includes, but is not limited to: hate speech, harassment, or threats; pornography, violence, or exploitation; human trafficking or illegal services; fraud, impersonation, or scams; copyright infringement; unauthorized commercial activity.</p>
            <p>Zero tolerance applies to exploitation and trafficking.</p>
          </section>

          <section id="section-14" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">14. Communications & Messaging</h3>
            <p className="mb-2">You consent to receive: service-related emails; marketing messages (opt-out available); SMS notifications (where applicable).</p>
            <p>Use of member information for harassment or solicitation is prohibited.</p>
          </section>

          <section id="section-15" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">15. Account Termination</h3>
            <p>We may suspend or terminate accounts: for policy violations; for legal compliance; at our discretion. Refunds are issued only when required by law or policy.</p>
          </section>

          <section id="section-16" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">16. Intellectual Property</h3>
            <p className="mb-2">All platform software, branding, and content belong to Vantage Dating or its licensors. You may not: copy or redistribute platform materials; create competing services; use trademarks without permission.</p>
          </section>

          <section id="section-17" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">17. Disclaimers</h3>
            <p className="mb-2">The Services are provided &quot;as is&quot; and &quot;as available&quot;. We do not guarantee: continuous availability; error-free operation; member behavior or accuracy.</p>
            <p>Use of the Services is at your own risk.</p>
          </section>

          <section id="section-18" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">18. Limitation of Liability</h3>
            <p>To the fullest extent permitted by law: we are not liable for indirect or consequential damages; total liability is limited to amounts paid by you to us.</p>
          </section>

          <section id="section-19" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">19. Dispute Resolution</h3>
            <p className="mb-2"><strong>US Residents:</strong> Disputes are resolved via binding arbitration under AAA rules. Class actions and jury trials are waived.</p>
            <p><strong>Non-US Residents:</strong> Disputes are resolved under LCIA arbitration rules in London, UK.</p>
          </section>

          <section id="section-20" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">20. Governing Law</h3>
            <p>This Agreement is governed by the laws of the Company&apos;s country of incorporation.</p>
          </section>

          <section id="section-21" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">21. Miscellaneous</h3>
            <p>Unused credits expire as stated in policy. Chargebacks may require disclosure of communications. Export control laws apply. English version prevails.</p>
          </section>

          <section id="section-22" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">22. Entire Agreement</h3>
            <p>This Agreement constitutes the entire understanding between you and Vantage Dating. We may update these Terms at any time by posting a revised version on the platform.</p>
          </section>

          <section id="section-23" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">23. Contact Us</h3>
            <p>
              Customer support:{' '}
              <a href="mailto:support@vantagedating.com" className="text-blue-600 hover:underline">
                support@vantagedating.com
              </a>
            </p>
          </section>
        </div>
    </>
  );

  if (asPage) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[calc(90*var(--vh))] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {content}
      </div>
    </div>
  );
}
