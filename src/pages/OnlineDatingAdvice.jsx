import LandingHero from '../components/LandingHero';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const sectionClass = 'max-w-6xl mx-auto px-4 sm:px-6';

export default function OnlineDatingAdvice() {
  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="bg-white text-gray-900">
      <LandingHero />

      <main className="py-10 sm:py-12 lg:py-16">
        {/* Breadcrumbs */}
        <section className={sectionClass}>
          <nav className="text-sm text-gray-500 mb-4">
            <Link to="/" className="hover:text-gray-700">Home</Link>
            <span className="mx-1">›</span>
            <Link to="/" className="hover:text-gray-700">Vantage Dating</Link>
            <span className="mx-1">›</span>
            <span className="text-gray-900">Online Dating Site for Singles</span>
          </nav>
        </section>

        {/* Article header + main content with sidebar */}
        <section className={`${sectionClass} mt-4`}>
          <div className="grid lg:grid-cols-[1fr_280px] gap-8 lg:gap-12 items-start">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
                Online Dating Site for Singles
              </h1>
              <p className="text-gray-700 text-base sm:text-lg leading-relaxed mb-4">
                Looking for a fresh start in dating? Connecting online has never been easier. No matter your past experiences, online dating for singles offers a simple and flexible way to meet like-minded people from around the world and build meaningful virtual connections.
              </p>
              <p className="text-gray-700 leading-relaxed mb-6">
                With thousands of users ready to chat, connect, and form relationships, online dating platforms for singles—such as Vantage Dating—make it easier to navigate today&apos;s digital dating world with confidence. This guide explores one of the leading online dating sites for singles and shares helpful insights on how to get the most out of your experience.
              </p>
              <p className="text-sm text-gray-600 mb-8">
                By <span className="font-semibold">Salina Owens</span>
                <span className="mx-1">•</span>
                <span>30.07.2025</span>
              </p>

              {/* Image */}
              <div className="rounded-2xl overflow-hidden shadow-lg mb-10">
                <img
                  src="/OnlineDatingSiteforSingles.png"
                  alt="Singles connecting online - meet like-minded people"
                  className="w-full h-auto object-cover"
                />
              </div>

              <p className="text-gray-700 leading-relaxed mb-8">
                Discover why more singles are choosing Vantage Dating to meet their virtual dating needs. Join a top online dating site for singles today—it&apos;s free to register and easy to use.
              </p>

              {/* Mature Online Dating */}
              <section id="mature-dating" className="mb-10">
                <h2 className="text-xl sm:text-2xl font-semibold mb-4">Mature Online Dating</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  A great connection has no age limit. Online dating for singles aged 40, 50, and 60+ continues to grow rapidly, with many people finding success later in life. Vantage Dating supports older singles by offering filters for age, values, and preferences—making it easier to connect with mature singles who share similar goals.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Whether you&apos;re re-entering the dating scene or seeking companionship, mature online dating platforms provide a welcoming space for genuine connections.
                </p>
              </section>

              {/* Online Dating Singles from Asia */}
              <section id="asia-dating" className="mb-10">
                <h2 className="text-xl sm:text-2xl font-semibold mb-4">Online Dating Singles from Asia</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  If you&apos;re interested in meeting singles from Asia, today&apos;s online dating sites focus on global connections while respecting cultural diversity. Vantage Dating allows singles to explore new connections safely, inclusively, and conveniently—no matter where they&apos;re located.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Connect with Asian singles who share your interests and relationship goals through our advanced search and matching tools.
                </p>
              </section>

              {/* Stay Online Dating */}
              <section id="stay-online" className="mb-10">
                <h2 className="text-xl sm:text-2xl font-semibold mb-4">Stay Online Dating</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Staying safe and successful in online dating requires a few key practices. Keep all communication on the platform until you feel comfortable, interact only with verified profiles, and never share personal or financial information. Report suspicious behavior immediately.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Optimize your profile with clear, high-quality photos and a thoughtful bio. Be honest about your dating goals and stay active—engagement helps you connect with more compatible matches.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Vantage Dating provides active moderation, verified profiles, and secure communication tools to help you date online with confidence.
                </p>
              </section>

              {/* Why singles turning to online dating */}
              <section id="why-online" className="mb-10">
                <h2 className="text-xl sm:text-2xl font-semibold mb-4">
                  Why Are Singles Turning to Online Dating Sites in 2025?
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Online dating for singles has become the preferred way to meet people in a fast-paced, global world. Both younger and more mature singles are turning to digital platforms like Vantage Dating to connect on their own terms.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  With busy schedules—balancing careers, social lives, and family—online dating offers flexibility and control. One of the standout benefits of Vantage Dating is the ability to register and browse profiles for free. In just a few steps, users can begin connecting with singles worldwide.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Unlike general social media platforms, online singles dating sites are purpose-built for people who genuinely want to connect. Users can filter matches by interests, values, and relationship goals. Dating technology has evolved to include live streaming, video calls, and voice messaging—all available on Vantage Dating.
                </p>
              </section>

              {/* Ready to date online - with image */}
              <section id="ready-to-date" className="mb-12">
                <div className="rounded-2xl overflow-hidden shadow-lg mb-6">
                  <img
                    src="/lookingForGreatConnection.png"
                    alt="Ready to date online - meaningful connections"
                    className="w-full h-auto object-cover"
                  />
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold mb-3">Ready to Date Online?</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Thousands of singles are online right now—don&apos;t miss your opportunity to meet someone special. Sign up for free and start exploring profiles today.
                </p>
                <Link
                  to="/signup-email"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-xl text-white font-semibold hover:opacity-90 transition"
                  style={{
                    background: 'linear-gradient(to right, #5A2D8A, #B5458F, #E97672)',
                  }}
                >
                  Sign up now
                </Link>
              </section>

              {/* What Makes Vantage Dating So Unique */}
              <section id="unique" className="mb-12">
                <h2 className="text-xl sm:text-2xl font-semibold mb-4">What Makes Vantage Dating So Unique?</h2>
                <ul className="text-gray-700 space-y-3">
                  {[
                    'Thousands of genuine users',
                    'Real-time matches and chat',
                    'Instant matches',
                    'Get instant updates',
                    'Safe and secure platform',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-green-600 font-bold text-lg flex-shrink-0">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              {/* FAQ */}
              <section id="faq" className="mb-12">
                <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-red-600">FAQ</h2>
                <OnlineDatingFaqAccordion />
              </section>

              {/* Testimonial */}
              <section className="mb-12">
                <div className="border border-gray-200 rounded-2xl p-6 sm:p-8 bg-gray-50 shadow-sm">
                  <div className="flex items-start gap-4">
                    <img
                      src="/profile.png"
                      alt="Mary S."
                      className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                    />
                    <div>
                      <p className="text-gray-700 leading-relaxed italic mb-4">
                        &quot;I never thought I&apos;d find love online, but Vantage Dating proved me wrong! I met my amazing partner here, and we&apos;ve been inseparable ever since. Highly recommend!&quot;
                      </p>
                      <p className="font-semibold text-gray-900">Mary S., 32, New York</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Final CTA */}
              <section className="rounded-2xl overflow-hidden shadow-lg relative">
                <img
                  src="/hero%20img.png"
                  alt="Join Vantage Dating"
                  className="w-full h-48 sm:h-64 object-cover object-center"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-6">
                  <div className="bg-white rounded-xl p-6 sm:p-8 max-w-md w-full shadow-xl">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Online Dating</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      By clicking &quot;Sign up now&quot;, you agree to our Terms &amp; Conditions and Privacy Policy.
                    </p>
                    <Link
                      to="/signup-email"
                      className="block w-full text-center py-4 rounded-xl text-white font-semibold hover:opacity-90 transition"
                      style={{
                        background: 'linear-gradient(to right, #5A2D8A, #B5458F, #E97672)',
                      }}
                    >
                      Sign up now
                    </Link>
                  </div>
                </div>
              </section>
            </div>

            {/* Table of Contents Sidebar */}
            <aside className="hidden lg:block sticky top-8">
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3">Table of Contents</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <button type="button" onClick={() => scrollToId('mature-dating')} className="text-blue-600 hover:underline text-left">
                      Mature Online Dating
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => scrollToId('asia-dating')} className="text-blue-600 hover:underline text-left">
                      Online Dating Singles from Asia
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => scrollToId('stay-online')} className="text-blue-600 hover:underline text-left">
                      Stay Online Dating
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => scrollToId('why-online')} className="text-blue-600 hover:underline text-left">
                      Why are singles turning to online dating sites in 2025?
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => scrollToId('ready-to-date')} className="text-blue-600 hover:underline text-left">
                      Ready to date online?
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => scrollToId('unique')} className="text-blue-600 hover:underline text-left">
                      What Makes Vantage Dating So Unique?
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => scrollToId('faq')} className="text-blue-600 hover:underline text-left">
                      FAQ
                    </button>
                  </li>
                </ul>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}

function OnlineDatingFaqAccordion() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: 'Is it safe to use Vantage Dating?',
      a: 'Yes. Vantage Dating uses active moderation, verified profiles, and secure communication tools. We recommend keeping conversations on the platform and never sharing personal or financial information.',
    },
    {
      q: 'How do I meet people on Vantage Dating?',
      a: 'Create a profile, browse matches, and use our search and filter tools to find compatible singles. You can send messages, use video chat, and participate in live streaming to connect with others.',
    },
    {
      q: "Can I use Vantage Dating if I'm not looking for a serious relationship?",
      a: 'Yes. Vantage Dating welcomes users with various relationship goals. You can specify your preferences in your profile and connect with like-minded singles.',
    },
    {
      q: 'How long does it take to find a partner on Vantage Dating?',
      a: 'It varies for everyone. Some users find connections quickly, while others take more time. Staying active, optimizing your profile, and engaging genuinely with matches can improve your experience.',
    },
    {
      q: 'How can I contact Vantage Dating support?',
      a: 'Visit our Contact page or use the in-app support options. Our team is available to help with account issues, safety concerns, and general questions.',
    },
  ];

  return (
    <div className="space-y-2 text-gray-700 text-sm">
      {faqs.map((item, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div
            key={item.q}
            className="border border-gray-200 rounded-xl bg-white shadow-sm"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? -1 : idx)}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <span className="font-semibold">{item.q}</span>
              <span className="ml-3 text-lg leading-none">
                {isOpen ? '−' : '+'}
              </span>
            </button>
            {isOpen && (
              <div className="px-4 pb-3 pt-0">
                <p className="leading-relaxed">{item.a}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
