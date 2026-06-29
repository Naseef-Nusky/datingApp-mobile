import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';

/**
 * About Vantage Dating popup – scrollable modal with full about content (like Vantage Dating site style).
 * When asPage=true, renders as full page for /about route.
 */
export default function AboutModal({ isOpen, onClose, initialSectionId, asPage }) {
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

  useEffect(() => {
    if ((!isOpen && !asPage) || !initialSectionId) return;
    const t = setTimeout(() => {
      const el = document.getElementById(initialSectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    return () => clearTimeout(t);
  }, [isOpen, initialSectionId, asPage]);

  if (!isOpen && !asPage) return null;

  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const content = (
    <>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">About Vantage Dating</h2>
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
          <p className="mb-4">
            Vantage Dating is at the forefront of the online dating world, offering unmatched global reach. Launched in 1993, the platform now operates in more than 40 countries, providing technology that allows members to take dating further than ever before.
          </p>
          <p className="mb-6">
            Our ambition is to connect singles wherever they are and inspire romance on a global scale. Decades of experience have given us deep insight into what people truly seek in online dating. Vantage Dating offers one of the most direct and effective ways to meet singles anywhere in the world.
          </p>

          {/* Table of contents / section links */}
          <div className="mb-6 space-y-1">
            <button type="button" onClick={() => scrollToId('section-i')} className="block w-full text-left text-blue-600 hover:underline font-medium">
              I. Vantage Dating – Always Global
            </button>
            <button type="button" onClick={() => scrollToId('section-ii')} className="block w-full text-left text-blue-600 hover:underline font-medium">
              II. Our Mission
            </button>
            <button type="button" onClick={() => scrollToId('section-iii')} className="block w-full text-left text-blue-600 hover:underline font-medium">
              III. Our Approach
            </button>
            <button type="button" onClick={() => scrollToId('section-iv')} className="block w-full text-left text-blue-600 hover:underline font-medium">
              IV. Your Safety
            </button>
            <button type="button" onClick={() => scrollToId('section-v')} className="block w-full text-left text-blue-600 hover:underline font-medium">
              V. User Types
            </button>
            <button type="button" onClick={() => scrollToId('section-vi')} className="block w-full text-left text-blue-600 hover:underline font-medium">
              VI. Frequently Asked Questions
            </button>
          </div>

          <section id="section-i" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">I. Vantage Dating – Always Global</h3>
            <p>
              Vantage Dating feels at home across the globe, with a strong presence in Europe, Asia, North America, and Latin America. Modern romance knows no borders, and today&apos;s singles are eager to connect beyond their local surroundings. Vantage Dating is perfectly positioned to introduce members to people from diverse cultures and regions worldwide.
            </p>
          </section>

          <section id="section-ii" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">II. Our Mission</h3>
            <p>
              Everything we do is focused on bringing singles together and helping them build meaningful relationships. Over the years, we have refined this into a true expertise. Our proven approach helps people connect successfully, and we continue to be inspired by the real relationships formed on Vantage Dating.
            </p>
          </section>

          <section id="section-iii" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">III. Our Approach</h3>
            <p className="mb-3">
              Vantage Dating provides a global platform where singles can discover each other and communicate using a variety of features. Members begin by creating a profile with photos and personal details, then search through our international database to explore other profiles.
            </p>
            <p className="mb-3">
              A unique highlight of Vantage Dating is the opportunity to learn about people from different countries and cultures. When there is mutual interest, members can communicate via direct messaging and Live Chat. All activity takes place on a secure, reliable network, supported by a dedicated Customer Support Team.
            </p>
            <p className="mb-2">To deliver our services, we may engage third-party partners for:</p>
            <ul className="list-disc pl-6 mb-3 space-y-1">
              <li>Affiliate marketing and advertising</li>
              <li>User acquisition of both Paying Members and Free Users</li>
              <li>Assistance with profile setup and communication, including language or time zone support</li>
            </ul>
            <p>
              Affiliate Partners may also curate photo and video sessions for Free Users. These partners are independent contractors, not employees or agents of Vantage Dating, and are compensated according to their partnership agreements.
            </p>
          </section>

          <section id="section-iv" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">IV. Your Safety</h3>
            <p className="mb-3">
              Member security is our top priority. Vantage Dating complies with international dating regulations and never shares personal contact information between members.
            </p>
            <p className="mb-3">
              We operate a robust Anti-Scam system to identify and address suspicious activity quickly. Our content moderation system continuously reviews communications to remove potentially harmful or fraudulent content, including financial solicitations or threats.
            </p>
            <p className="mb-3">
              We strongly encourage members to communicate only on our platform, as we can provide assistance only for on-platform interactions. Fraudulent behavior results in immediate bans and permanent removal.
            </p>
            <p className="mb-3">
              Free Users must complete identity verification every six months through an online system that reviews government-issued documents to ensure authenticity.
            </p>
            <p className="mb-3">
              While members may exchange contact details voluntarily, we strongly recommend following our Dating Security Policy, which advises against sharing personal contact information until trust is fully established.
            </p>
            <p>
              Our guidelines comply with New Jersey state law (NJ Rev Stat 56:8-171 [2017]) regarding internet dating safety.
            </p>
          </section>

          <section id="section-v" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">V. User Types</h3>
            <h4 className="font-semibold text-gray-900 mt-3 mb-1">Members</h4>
            <p className="mb-3">
              Any registered user becomes a Member. Each Member may hold only one account. Members can: browse other profiles; maintain a searchable profile; edit profile details; read messages (web version only); purchase Membership extensions. Profile information is visible to other users on the platform.
            </p>
            <h4 id="section-verified-users" className="font-semibold text-gray-900 mt-3 mb-1">Verified Users</h4>
            <p className="mb-3">
              Users can obtain a &quot;Verified&quot; badge after completing identity verification when offered by the platform, including government ID submission and biometric checks where applicable. Verification is valid for six months and must be renewed to retain the badge.
            </p>
            <h4 className="font-semibold text-gray-900 mt-3 mb-1">Paying Members</h4>
            <p className="mb-3">
              Paying Members use the platform under a pay-per-action model with no interaction limits. They can communicate with both Free Users and other Paying Members. Paying Members are not marked with a special badge.
            </p>
            <h4 id="section-free-users" className="font-semibold text-gray-900 mt-3 mb-1">Free Users</h4>
            <p className="mb-2">
              Free Users are identified with a &quot;Free User&quot; flame icon. They may use the platform at no cost but with certain limitations, including the inability to contact other Free Users. Free Users must: complete regular identity verification; remain active; provide accurate, high-quality profile content; follow Community Standards and the Communication Policy.
            </p>
            <p>
              It is strictly prohibited for Free Users to receive any form of payment for participation. Violations result in immediate account termination.
            </p>
          </section>

          <section id="section-vi" className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-3">VI. Frequently Asked Questions</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">1. Why do members receive high engagement on Vantage Dating?</h4>
                <p>Vantage Dating connects Paying Members and Free Users globally, increasing opportunities for interaction. Engagement tools such as Let&apos;s Mingle and Boost help facilitate communication, and Free Users must meet strict quality and verification standards.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">2. Why is there no unlimited-access membership?</h4>
                <p>Vantage Dating operates on a pay-per-action and freemium model, allowing members to pay only for services they use. Fees support translation services, content creation, affiliate acquisition, and premium customer support.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">3. What are the benefits of global dating?</h4>
                <p>Global dating promotes cultural awareness and allows members to connect based on shared interests rather than location. Our platform supports safe, rich communication through chats, video calls, media sharing, and privacy protection.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">4. Why do profiles appear more attractive?</h4>
                <p>Affiliate Partners help ensure high-quality, verified photos and videos. Free Users are never paid, and strict rules are enforced to maintain authenticity.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">5. Can I use Vantage Dating for free?</h4>
                <p>Yes, users can qualify as Free Users by passing verification, maintaining activity, and providing quality profile content. All users must be at least 18 years old.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">6. How are Free Users motivated?</h4>
                <p>Free Users join for various reasons, including companionship, social interaction, and online romance. Vantage Dating does not support hook-ups or paid participation.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">7. Who are Affiliate Partners?</h4>
                <p>Affiliate Partners are independent contractors who assist Free Users in complying with platform policies and standards.</p>
              </div>
            </div>
          </section>

          <section className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="text-base font-bold text-gray-900 mb-2">Customer Support</h3>
            <p className="font-semibold">
              <a
                href="mailto:support@vantagedating.com"
                className="text-blue-600 hover:underline"
              >
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
