import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';

/**
 * Privacy Policy popup – scrollable modal with table of contents (Vantage Dating style).
 * When asPage=true, renders as full page for /privacy route.
 */
export default function PrivacyPolicyModal({ isOpen, onClose, asPage }) {
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

  const content = (
    <>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Vantage Dating – Privacy Policy</h2>
          {asPage ? (
            <Link to="/" className="text-sm font-medium text-blue-600 hover:text-blue-800">← Back to Home</Link>
          ) : (
            <button type="button" onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition" aria-label="Close">
              <FaTimes className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-6 py-5 text-gray-800 text-sm leading-relaxed">
          {/* Introduction */}
          <p className="mb-4">
            At Vantage Dating (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;), we respect and protect the privacy of all users. This Privacy Policy explains how we collect, use, store, share, and protect your personal data when you use:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li>The Vantage Dating website</li>
            <li>Vantage Dating mobile applications</li>
            <li>Any related downloadable products</li>
            <li>Official pages and services operated by Vantage Dating on social media or other platforms</li>
          </ul>
          <p className="mb-6">
            (collectively referred to as the &quot;Services&quot;).
          </p>
          <p className="mb-6">
            By accessing or using our Services, you confirm that you have read, understood, and agreed to this Privacy Policy. If you have questions, please refer to the <button type="button" onClick={() => scrollToId('section-15')} className="text-blue-600 hover:underline">Contact Us</button> section.
          </p>

          {/* Table of contents */}
          <h3 className="text-base font-bold text-gray-900 mb-2">TABLE OF CONTENTS</h3>
          <div className="mb-6 space-y-1">
            {[
              { id: 'section-1', label: '1. Introduction' },
              { id: 'section-2', label: '2. Who We Are' },
              { id: 'section-3', label: '3. Acceptance of This Privacy Policy' },
              { id: 'section-4', label: '4. Age Requirement' },
              { id: 'section-5', label: '5. Personal Data We Collect' },
              { id: 'section-6', label: '6. How We Use Your Personal Data' },
              { id: 'section-7', label: '7. Automated Processing & AI Features' },
              { id: 'section-8', label: '8. Marketing Communications' },
              { id: 'section-9', label: '9. Data Sharing & Disclosure' },
              { id: 'section-10', label: '10. International Data Transfers' },
              { id: 'section-11', label: '11. Data Retention' },
              { id: 'section-12', label: '12. Deleting Your Data' },
              { id: 'section-13', label: '13. Managing Your Profile & Preferences' },
              { id: 'section-14', label: '14. Your Legal Rights' },
              { id: 'section-15', label: '15. Contact Us' },
              { id: 'section-16', label: '16. Miscellaneous' },
            ].map(({ id, label }) => (
              <button key={id} type="button" onClick={() => scrollToId(id)} className="block w-full text-left text-blue-600 hover:underline font-medium">
                {label}
              </button>
            ))}
          </div>

          <section id="section-1" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">1. Introduction</h3>
            <p>
              At Vantage Dating (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;), we respect and protect the privacy of all users. This Privacy Policy explains how we collect, use, store, share, and protect your personal data when you use the Services listed above. By accessing or using our Services, you confirm that you have read, understood, and agreed to this Privacy Policy.
            </p>
          </section>

          <section id="section-2" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">2. Who We Are</h3>
            <p>
              The Services are operated by Vantage Dating, acting as the Data Controller.
            </p>
            <p>
              We have appointed a Data Protection Officer (DPO) to oversee compliance with data protection laws. Any privacy-related inquiries or requests to exercise your legal rights may be directed through the Contact Us section.
            </p>
          </section>

          <section id="section-3" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">3. Acceptance of This Privacy Policy</h3>
            <p>
              By using the Services, you agree to this Privacy Policy together with our Terms of Use and Refund and Cancellation Policy.
            </p>
          </section>

          <section id="section-4" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">4. Age Requirement</h3>
            <p className="mb-2">Our Services are intended strictly for users aged 18 years or older.</p>
            <p className="mb-2">We do not knowingly collect personal data from individuals under 18. If such data is discovered, it will be deleted promptly.</p>
            <p>If you believe we have collected data from a minor, please contact us immediately.</p>
          </section>

          <section id="section-5" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">5. Personal Data We Collect</h3>
            <p className="mb-3">We may collect, process, and store different categories of personal data as outlined below.</p>

            <h4 className="font-semibold text-gray-900 mt-3 mb-1">5.1 Information You Make Public</h4>
            <p className="mb-2">Certain profile information is visible to other users and may be searchable, including:</p>
            <ul className="list-disc pl-6 mb-2 space-y-1">
              <li>Username, user ID, name</li>
              <li>Age, date of birth</li>
              <li>Gender, sexual orientation</li>
              <li>Location preferences</li>
              <li>Profile photos, videos, and personal descriptions</li>
            </ul>
            <p className="mb-3">Public information may appear in search results both within and outside the platform. Please share carefully.</p>

            <h4 className="font-semibold text-gray-900 mt-3 mb-1">5.2 Information You Provide Directly</h4>
            <p className="mb-2">When you register, use features, or purchase services, we may collect:</p>
            <ul className="list-disc pl-6 mb-2 space-y-1">
              <li><strong>Contact Data:</strong> email address, phone number, social media account</li>
              <li><strong>Account Data:</strong> username, password, profile details</li>
              <li><strong>Sensitive Data (with consent):</strong> sexual preferences, biometric data for verification</li>
              <li><strong>Payment Data:</strong> transaction IDs, payment method details (processed securely)</li>
              <li><strong>Verification Data:</strong> government ID and biometric data when you complete identity verification, processed by us or our verification partners as applicable</li>
            </ul>

            <h4 className="font-semibold text-gray-900 mt-3 mb-1">5.3 Usage Information</h4>
            <p className="mb-2">We collect information about how you interact with the Services, such as:</p>
            <ul className="list-disc pl-6 mb-3 space-y-1">
              <li>Profiles viewed</li>
              <li>Features used</li>
              <li>Messages sent</li>
              <li>Credits, gifts, and purchases</li>
            </ul>

            <h4 className="font-semibold text-gray-900 mt-3 mb-1">5.4 Uploaded Content</h4>
            <p className="mb-3">When you upload photos, videos, or other media, we may process: metadata (date, time, location); content analysis for fraud prevention, moderation, and matching; and AI-based insights to improve user experience.</p>

            <h4 className="font-semibold text-gray-900 mt-3 mb-1">5.5 Communications</h4>
            <p className="mb-3">We collect and store communications between you and us, between you and other users, through email, chat, SMS, push notifications, or supported messaging platforms.</p>

            <h4 className="font-semibold text-gray-900 mt-3 mb-1">5.6 Information From Third Parties</h4>
            <p className="mb-3">We may receive information from: other users (reports, referrals); payment providers; fraud prevention services; and social media platforms if you register using them.</p>

            <h4 className="font-semibold text-gray-900 mt-3 mb-1">5.7 Automatically Collected Data</h4>
            <p className="mb-3">This includes: device identifiers; IP address; browser and operating system details; app usage logs; and location data (country/city level).</p>

            <h4 className="font-semibold text-gray-900 mt-3 mb-1">5.8 Cookies and Similar Technologies</h4>
            <p>We use cookies and tracking technologies to improve functionality, analyze usage patterns, and personalize content. You may disable cookies via your browser settings, though some features may not function correctly.</p>
          </section>

          <section id="section-6" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">6. How We Use Your Personal Data</h3>
            <p className="mb-2">We process personal data for the following purposes:</p>
            <ul className="list-disc pl-6 mb-2 space-y-1">
              <li>Account creation and management</li>
              <li>Matching and communication features</li>
              <li>Identity verification</li>
              <li>Fraud prevention and security</li>
              <li>Customer support</li>
              <li>Payment processing</li>
              <li>Legal compliance</li>
              <li>Marketing (with consent)</li>
              <li>Product improvement and analytics</li>
            </ul>
            <p>We do not sell personal data.</p>
          </section>

          <section id="section-7" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">7. Automated Processing & AI Features</h3>
            <p className="mb-2">We use automated systems and AI tools to:</p>
            <ul className="list-disc pl-6 mb-2 space-y-1">
              <li>Recommend matches and content</li>
              <li>Detect fraud and abuse</li>
              <li>Assist customer support via chatbots</li>
              <li>Perform photo and identity verification</li>
            </ul>
            <p>You may request human review at any time.</p>
          </section>

          <section id="section-8" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">8. Marketing Communications</h3>
            <p className="mb-2">We may send marketing messages via email, SMS, or notifications.</p>
            <p>You can opt out at any time using: unsubscribe links; profile settings; or contacting support.</p>
          </section>

          <section id="section-9" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">9. Data Sharing & Disclosure</h3>
            <p className="mb-2">We may share data with:</p>
            <ul className="list-disc pl-6 mb-2 space-y-1">
              <li>Service providers and processors</li>
              <li>Identity verification partners, when used</li>
              <li>Legal authorities when required</li>
              <li>Affiliates and auditors</li>
            </ul>
            <p>All parties are required to maintain confidentiality and security.</p>
          </section>

          <section id="section-10" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">10. International Data Transfers</h3>
            <p>Your data may be transferred outside your country, including outside the EEA. We use approved safeguards such as Standard Contractual Clauses.</p>
          </section>

          <section id="section-11" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">11. Data Retention</h3>
            <p className="mb-2">We retain personal data only as long as necessary for: service provision; legal obligations; and security and fraud prevention.</p>
            <p>Certain anonymized or blacklist data may be retained longer where legally permitted.</p>
          </section>

          <section id="section-12" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">12. Deleting Your Data</h3>
            <p>You may request deletion of your personal data by contacting support. Some data may be retained where legally required or for fraud prevention.</p>
          </section>

          <section id="section-13" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">13. Managing Your Profile & Preferences</h3>
            <p>You may: edit or update your profile; control communication preferences; opt out of emails or SMS; and delete your account at any time.</p>
          </section>

          <section id="section-14" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">14. Your Legal Rights</h3>
            <p className="mb-2"><strong>EU Users (GDPR):</strong> You have rights to access, correct, delete, restrict, and transfer your data, and to lodge complaints with authorities.</p>
            <p className="mb-2"><strong>US Users:</strong> You have rights to access, correct, delete data, and opt out of profiling and targeted advertising.</p>
            <p><strong>Japan Users:</strong> You have rights under the APPI to access, correct, delete, and object to certain processing.</p>
          </section>

          <section id="section-15" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">15. Contact Us</h3>
            <p className="mb-2"><strong>Data Controller:</strong></p>
            <p className="mb-2">
              <strong>Customer Support:</strong>{' '}
              <a href="mailto:support@vantagedating.com" className="text-blue-600 hover:underline">
                support@vantagedating.com
              </a>
            </p>
          </section>

          <section id="section-16" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">16. Miscellaneous</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>External links are governed by third-party policies</li>
              <li>Intellectual property licenses apply to content you upload</li>
              <li>English version prevails over translations</li>
              <li>We may update this Privacy Policy periodically</li>
            </ul>
            <p className="mt-4 text-gray-600">Last modified: 23/02/2026</p>
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
