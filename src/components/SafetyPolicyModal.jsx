import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';

/**
 * Safety & Security Policy popup – scrollable modal with table of contents (same style as Privacy/Refund Policy).
 * When asPage=true, renders as full page for /safety route.
 */
export default function SafetyPolicyModal({ isOpen, onClose, asPage }) {
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
          <h2 className="text-xl font-bold text-gray-900">Vantage Dating – Safety & Security Policy</h2>
          {asPage ? (
            <Link to="/" className="text-sm font-medium text-blue-600 hover:text-blue-800">← Back to Home</Link>
          ) : (
            <button type="button" onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition" aria-label="Close">
              <FaTimes className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="overflow-y-auto px-6 py-5 text-gray-800 text-sm leading-relaxed">
          <p className="mb-6">
            Your safety matters to us. Vantage Dating is committed to providing a secure, respectful, and trustworthy environment for all members. Please read and follow the guidelines below to protect yourself and others.
          </p>

          <h3 className="text-base font-bold text-gray-900 mb-2">TABLE OF CONTENTS</h3>
          <div className="mb-6 space-y-1">
            {[
              { id: 'section-1', label: '1. Essential Safety Guidelines' },
              { id: 'section-2', label: '2. Personal Information Protection Notice' },
              { id: 'section-3', label: '3. Meeting in Person – Safety Advice' },
              { id: 'section-4', label: '4. Scam Protection & Credit Reimbursement' },
              { id: 'section-5', label: '5. Situations That Are NOT Considered Scams' },
              { id: 'section-6', label: '6. Exploitation & Human Trafficking Policy' },
              { id: 'section-7', label: '7. Additional Safety Measures' },
              { id: 'section-8', label: '8. Member Responsibilities' },
              { id: 'section-9', label: '9. Enforcement & Legal Action' },
              { id: 'section-10', label: '10. Reporting a Scam' },
            ].map(({ id, label }) => (
              <button key={id} type="button" onClick={() => scrollToId(id)} className="block w-full text-left text-blue-600 hover:underline font-medium">
                {label}
              </button>
            ))}
          </div>

          <section id="section-1" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">1. Essential Safety Guidelines</h3>
            <p className="mb-3">To ensure a safe experience on Vantage Dating, we strongly advise all members to follow these precautions:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Never send money, gift cards, cryptocurrency, or financial assistance to another member.</li>
              <li>Be clear about your intentions and expectations to avoid confusion or false assumptions.</li>
              <li>Use video calls periodically to help confirm the authenticity of the person you are communicating with.</li>
              <li>Never share your account password, login credentials, or access to your profile with anyone.</li>
              <li>Do not provide copies of government-issued IDs or official documents to other members.</li>
            </ul>
          </section>

          <section id="section-2" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">2. Personal Information Protection Notice</h3>
            <p className="mb-2">Members are strongly encouraged to follow widely accepted online dating safety standards, including the following principles:</p>
            <ul className="list-disc pl-6 mb-2 space-y-1">
              <li>Do not share your full name, email address, home address, phone number, workplace, or any identifying details in your profile or early conversations.</li>
              <li>Immediately stop communicating with anyone who pressures you to reveal personal or financial information.</li>
              <li>Be cautious of manipulation, urgency, or emotional pressure designed to extract private details.</li>
            </ul>
          </section>

          <section id="section-3" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">3. Meeting in Person – Safety Advice</h3>
            <p className="mb-2">If you decide to meet another member offline:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Inform a trusted friend or family member where you are going and when you expect to return.</li>
              <li>Never agree to be picked up from your home.</li>
              <li>Arrange your own transportation to and from the meeting.</li>
              <li>Always meet in a public location with other people around.</li>
            </ul>
          </section>

          <section id="section-4" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">4. Scam Protection & Credit Reimbursement</h3>
            <p className="mb-3">Vantage Dating takes fraud seriously. You may be eligible for a full credit reimbursement if any of the following occurs:</p>

            <h4 className="font-semibold text-gray-900 mt-3 mb-1">4.1 Identity Misrepresentation</h4>
            <p className="mb-3">If a person falsely represents themselves or uses another member&apos;s identity without permission, all credits spent communicating with that account will be refunded.</p>

            <h4 className="font-semibold text-gray-900 mt-3 mb-1">4.2 Financial Solicitation</h4>
            <p className="mb-2">If a member asks you for money, financial help, or expensive gifts:</p>
            <ul className="list-disc pl-6 mb-3 space-y-1">
              <li>All related credits will be reimbursed</li>
              <li>The member will be permanently removed from the platform</li>
            </ul>

            <h4 className="font-semibold text-gray-900 mt-3 mb-1">4.3 False Profile Information</h4>
            <p className="mb-2">If a member intentionally misrepresents key personal details such as:</p>
            <ul className="list-disc pl-6 mb-2 space-y-1">
              <li>Age</li>
              <li>Gender</li>
              <li>Marital status</li>
              <li>Parental status</li>
            </ul>
            <p className="mb-2">All credits spent communicating with that member will be refunded, and the account will be permanently banned.</p>
            <p className="text-amber-700">⚠ Important: Refunds are issued only when violations are committed by members with verified account status.</p>
          </section>

          <section id="section-5" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">5. Situations That Are NOT Considered Scams</h3>
            <p className="mb-2">The following situations do not qualify as scams or refundable violations:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Minor translation errors in messages</li>
              <li>A member choosing not to answer all questions</li>
              <li>A member deciding to stop communication at any stage</li>
              <li>Photos that include friends, family members, or former partners on social media</li>
              <li>Wearing rings (rings do not automatically indicate marital status)</li>
              <li>Use of nicknames or display names</li>
            </ul>
          </section>

          <section id="section-6" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">6. Exploitation & Human Trafficking Policy</h3>
            <p className="mb-2">Vantage Dating enforces a zero-tolerance policy toward exploitation and human trafficking.</p>
            <p className="mb-2">Prohibited content includes, but is not limited to:</p>
            <ul className="list-disc pl-6 mb-2 space-y-1">
              <li>Sexual or violent exploitation of any individual, especially minors under 18</li>
              <li>Content that promotes, facilitates, or supports human trafficking, forced labor, or modern slavery</li>
              <li>Attempts to use the platform for illegal services such as prostitution or escorting</li>
            </ul>
            <p>We actively cooperate with law enforcement agencies and anti-trafficking organizations. Any suspected activity should be reported immediately.</p>
          </section>

          <section id="section-7" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">7. Additional Safety Measures</h3>
            <p className="mb-2">To maintain a secure platform, we implement the following protections:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Account Verification:</strong> Members are encouraged to verify their profiles to reduce fraudulent activity.</li>
              <li><strong>Reporting Tools:</strong> Simple and accessible reporting options allow users to flag suspicious or harmful behavior.</li>
              <li><strong>Privacy Safeguards:</strong> Unauthorized collection, storage, or sharing of personal data is strictly prohibited.</li>
            </ul>
          </section>

          <section id="section-8" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">8. Member Responsibilities</h3>
            <p className="mb-2">By using Vantage Dating, you agree to:</p>
            <ul className="list-disc pl-6 mb-2 space-y-1">
              <li>Avoid sharing sensitive personal, financial, or identification information</li>
              <li>Take appropriate precautions before meeting someone in person</li>
              <li>Report suspicious behavior or policy violations immediately</li>
            </ul>
            <p>Failure to comply with these responsibilities may result in account suspension or permanent removal.</p>
          </section>

          <section id="section-9" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">9. Enforcement & Legal Action</h3>
            <p className="mb-2">Violations of this Safety & Security Policy may result in:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Immediate account suspension or termination</li>
              <li>Loss of credits or privileges</li>
              <li>Legal action where required by law</li>
            </ul>
          </section>

          <section id="section-10" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">10. Reporting a Scam</h3>
            <p className="mb-2">If you believe you have been scammed:</p>
            <ul className="list-disc pl-6 mb-2 space-y-1">
              <li>Submit a complaint using the reporting tools provided in the app or website</li>
              <li>Once verified, you will receive a full refund of all credits spent communicating with the reported member</li>
            </ul>
            <p className="mt-4 font-medium">Kind regards,<br />Vantage Dating Support Team</p>
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
