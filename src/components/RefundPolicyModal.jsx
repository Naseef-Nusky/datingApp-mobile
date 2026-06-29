import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';

/**
 * Refund & Cancellation Policy popup – scrollable modal with table of contents (same style as Privacy Policy).
 * When asPage=true, renders as full page for /refund route.
 */
export default function RefundPolicyModal({ isOpen, onClose, asPage }) {
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
          <h2 className="text-xl font-bold text-gray-900">Vantage Dating – Refund & Cancellation Policy</h2>
          {asPage ? (
            <Link to="/" className="text-sm font-medium text-blue-600 hover:text-blue-800">← Back to Home</Link>
          ) : (
            <button type="button" onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition" aria-label="Close">
              <FaTimes className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="overflow-y-auto px-6 py-5 text-gray-800 text-sm leading-relaxed">
          <p className="mb-6 text-gray-600">Last Updated: December 2025</p>

          <h3 className="text-base font-bold text-gray-900 mb-2">TABLE OF CONTENTS</h3>
          <div className="mb-6 space-y-1">
            {[
              { id: 'section-1', label: '1. Credit Refund Policy' },
              { id: 'section-2', label: '2. Monetary Refund Policy' },
              { id: 'section-3', label: '3. Credit Expiration Rules' },
              { id: 'section-4', label: '4. How to Request a Refund' },
              { id: 'section-5', label: '5. Chargeback Notice' },
              { id: 'section-6', label: '6. Monthly Credit Pack & Subscription Cancellation' },
              { id: 'section-7', label: '7. Final Statement' },
            ].map(({ id, label }) => (
              <button key={id} type="button" onClick={() => scrollToId(id)} className="block w-full text-left text-blue-600 hover:underline font-medium">
                {label}
              </button>
            ))}
          </div>

          <section id="section-1" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">1. Credit Refund Policy</h3>
            <p className="mb-3">Credits may be returned to your Vantage Dating account in the following situations:</p>

            <h4 className="font-semibold text-gray-900 mt-3 mb-1">1.1 Inappropriate Member Activity</h4>
            <p className="mb-2">If another member you interacted with:</p>
            <ul className="list-disc pl-6 mb-2 space-y-1">
              <li>Violates our Anti-Scam Policy, or</li>
              <li>Is confirmed on a reliable anti-scam database</li>
            </ul>
            <p className="mb-3">You may submit a report with clear supporting evidence. After review, Vantage Dating may issue a partial credit refund at its sole discretion.</p>

            <h4 className="font-semibold text-gray-900 mt-3 mb-1">1.2 Profile Deactivation by Correspondent</h4>
            <p className="mb-2">If a member you communicated with:</p>
            <ul className="list-disc pl-6 mb-2 space-y-1">
              <li>Deletes their account, or</li>
              <li>Stops using the service</li>
            </ul>
            <p className="mb-2">Our support team will review your message history and decide whether a refund is appropriate.</p>
            <p className="mb-2 text-amber-700">⚠ In such cases, refunds are usually limited to a maximum of 10 credits for the most recent message sent to that member.</p>
            <p className="mb-3 text-amber-700">⚠ If the other member leaves the platform because they found a match with someone else, no refund will be granted.</p>

            <h4 className="font-semibold text-gray-900 mt-3 mb-1">1.3 Service Quality Issues</h4>
            <p className="mb-2">Credits may be refunded if a service fails due to platform-related issues, including:</p>
            <ul className="list-disc pl-6 mb-2 space-y-1">
              <li>Video or cam chat interruptions caused by system malfunction</li>
              <li>Receiving duplicate messages</li>
              <li>Poor or incorrect message translations</li>
              <li>Delivered digital content not matching what was ordered</li>
            </ul>
            <p className="mb-2">Additional refund requests may be approved if our team confirms the issue.</p>
            <p className="text-amber-700">⚠ Refunds related to violations apply only if the issue involves a verified member.</p>
          </section>

          <section id="section-2" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">2. Monetary Refund Policy</h3>
            <p className="mb-3">You may request a cash refund in the following circumstances:</p>

            <h4 className="font-semibold text-gray-900 mt-3 mb-1">2.1 Unauthorized Payment</h4>
            <p className="mb-3">If your payment method was used fraudulently on Vantage Dating, contact support immediately. Once confirmed, the full amount will be refunded.</p>

            <h4 className="font-semibold text-gray-900 mt-3 mb-1">2.2 Accidental Purchases (One-Time Only)</h4>
            <ul className="list-disc pl-6 mb-2 space-y-1">
              <li>If credits were not used, a full refund may be issued</li>
              <li>If credits were partially used, a proportional refund may apply</li>
              <li>Repeated refund requests may not be approved.</li>
            </ul>

            <h4 className="font-semibold text-gray-900 mt-3 mb-1">2.3 Account Termination by Vantage Dating</h4>
            <p className="mb-2">If your account is closed by us for any reason, you may receive a pro-rated refund for unused paid services.</p>
            <p className="text-amber-700">⚠ If your account is terminated due to violations of our Terms or Privacy Policy, no refund will be issued.</p>
          </section>

          <section id="section-3" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">3. Credit Expiration Rules</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Purchased credits expire 90 days after purchase</li>
              <li>Subscription credits expire at the end of each billing cycle</li>
              <li>Expired credits cannot be restored or transferred</li>
              <li>Refunds will never exceed the original amount paid.</li>
            </ul>
          </section>

          <section id="section-4" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">4. How to Request a Refund</h3>
            <p className="mb-2">To request a credit or monetary refund:</p>
            <ul className="list-disc pl-6 mb-2 space-y-1">
              <li>
                Email{' '}
                <a href="mailto:support@vantagedating.com" className="text-blue-600 hover:underline">
                  support@vantagedating.com
                </a>
              </li>
            </ul>
            <p>Our support team will review your request and provide an initial response within 72 hours.</p>
          </section>

          <section id="section-5" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">5. Chargeback Notice</h3>
            <p>If you initiate a chargeback through your bank or card provider, Vantage Dating may be required to disclose relevant private communications to validate the transaction. This action is permitted under our Privacy Policy.</p>
          </section>

          <section id="section-6" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">6. Monthly Credit Pack & Subscription Cancellation</h3>
            <p className="mb-3">You may cancel your monthly subscription at any time by following these steps:</p>

            <h4 className="font-semibold text-gray-900 mt-3 mb-1">Step 1: Open Account Settings</h4>
            <ul className="list-disc pl-6 mb-2 space-y-1">
              <li>Log in to your account</li>
              <li>Click the Menu (≡) button</li>
              <li>Select Settings</li>
            </ul>

            <h4 className="font-semibold text-gray-900 mt-3 mb-1">Step 2: Manage Your Account</h4>
            <ul className="list-disc pl-6 mb-2 space-y-1">
              <li>Find the Manage Account section</li>
              <li>Click the link provided to hide your profile or cancel your membership</li>
            </ul>

            <h4 className="font-semibold text-gray-900 mt-3 mb-1">Step 3: Cancel Subscription</h4>
            <ul className="list-disc pl-6 mb-3 space-y-1">
              <li>Select Cancel Subscription</li>
              <li>Follow the on-screen instructions</li>
              <li>Confirm your cancellation reason</li>
            </ul>

            <h4 className="font-semibold text-gray-900 mt-3 mb-1">Important Notes</h4>
            <ul className="list-disc pl-6 space-y-1">
              <li>Your subscription remains active until the end of the current billing period</li>
              <li>Charges from previous billing cycles are non-refundable</li>
              <li>Used credits during the active subscription period will not be refunded</li>
            </ul>
          </section>

          <section id="section-7" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">7. Final Statement</h3>
            <p>By using Vantage Dating, you acknowledge and accept this Refund and Cancellation Policy. Our goal is to maintain a fair, transparent, and secure experience for all members.</p>
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
