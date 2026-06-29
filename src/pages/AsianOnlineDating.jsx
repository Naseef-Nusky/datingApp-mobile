import LandingHero from '../components/LandingHero';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const sectionClass = 'max-w-5xl mx-auto px-4 sm:px-6';

export default function AsianOnlineDating() {
  return (
    <div className="bg-white text-gray-900">
      <LandingHero />

      <main className="py-10 sm:py-12 lg:py-16">
        {/* Article header */}
        <section className={sectionClass}>
          <h1 className="text-2xl sm:text-3xl font-bold mb-3">
            Asian Dating Online
          </h1>
          <p className="text-gray-700 text-base sm:text-lg leading-relaxed mb-4">
            Online Asian dating continues to grow rapidly and has become one of the most diverse
            dating scenes worldwide. Today, singles from across the globe are connecting with people
            from East, Southeast, and South Asia—bridging cultures, languages, and shared interests
            through modern dating platforms.
          </p>
          <p className="text-sm text-gray-600">
            By <span className="font-semibold">Salina Owens</span>
            <span className="mx-1">•</span>
            <span>30.07.2025</span>
          </p>
        </section>

        {/* Main description with image */}
        <section className={`${sectionClass} mt-10 sm:mt-12`}>
          <div className="grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-6 lg:gap-10 items-start">
            <div>
              <p className="text-gray-700 leading-relaxed">
                Connecting with Asian women or meeting new people online has never been easier.
                Platforms like Vantage Dating make it simple to begin building meaningful, long-term
                relationships with just a few clicks. Free Asian online dating tools, instant messaging,
                and video call features allow users to communicate effortlessly, no matter where they
                are in the world. The intuitive interface and advanced features are designed to support
                smooth and engaging conversations.
              </p>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <img
                src="/asiangirl.png"
                alt="Asian woman connecting online in a modern cafe"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>

        {/* Why Asian singles trust */}
        <section className={`${sectionClass} mt-10 sm:mt-12`}>
          <h2 className="text-xl sm:text-2xl font-semibold mb-3">
            Why Asian Singles Trust Vantage Dating for Online Dating
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Asian online dating has evolved far beyond its early beginnings. Today, it offers a
            truly global experience where people from all backgrounds explore connections with Asian
            singles on trusted platforms. Whether you’re interested in meeting Asian women or
            searching for compatible Asian men, Vantage Dating is a leading global destination that
            connects users with thousands of members across Asia.
          </p>
        </section>

        {/* Reliable platform features */}
        <section className={`${sectionClass} mt-10 sm:mt-12`}>
          <h2 className="text-xl sm:text-2xl font-semibold mb-3">
            What Makes Vantage Dating a Reliable Asian Dating Platform
          </h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
            <li>Free registration to get started quickly</li>
            <li>Verified profiles that help reduce spam and improve match quality</li>
            <li>Video chat and live streaming features</li>
            <li>Built-in translation tools to overcome language barriers instantly</li>
          </ul>
          <p className="text-gray-700 leading-relaxed">
            Vantage Dating provides a secure environment for meaningful conversations, late-night
            chats, and the excitement of discovering new connections—whether you’re interested in
            dating Asian women or forming connections with Asian men.
          </p>
        </section>

        {/* Cultural diversity */}
        <section className={`${sectionClass} mt-10 sm:mt-12`}>
          <p className="text-gray-700 leading-relaxed">
            Dating across cultures encourages learning, curiosity, and personal growth. Explore the
            diversity of Asian singles on Vantage Dating, whether you’re drawn to Korean, Malaysian,
            Vietnamese, or other Asian cultures.
          </p>
        </section>

        {/* Ready to meet section */}
        <section className={`${sectionClass} mt-12 sm:mt-14`}>
          <h2 className="text-xl sm:text-2xl font-semibold mb-3">
            Ready to Meet Thousands of Asian Singles Online?
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Thousands of Asian singles are online right now—your next great connection could be
            just one message away.
          </p>
          <Link
            to="/signup-email"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-white font-semibold hover:opacity-90 transition"
            style={{
              background: 'linear-gradient(to right, #5A2D8A, #B5458F, #E97672)',
            }}
          >
            Create your free profile
          </Link>
        </section>

        {/* Unique features list */}
        <section className={`${sectionClass} mt-12 sm:mt-14`}>
          <h2 className="text-xl sm:text-2xl font-semibold mb-3">
            What Makes Vantage Dating Unique?
          </h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Global reach with country-specific Asian filters</li>
            <li>Large community of verified users</li>
            <li>Video chat and live streaming options</li>
            <li>Free registration</li>
            <li>Real-time translation features</li>
          </ul>
        </section>

        {/* FAQ with accordion */}
        <section className={`${sectionClass} mt-12 sm:mt-14`}>
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">
            FAQ
          </h2>
          <AsianFaqAccordion />
        </section>

        {/* About the Author */}
        <section className={`${sectionClass} mt-12 sm:mt-14 mb-4 sm:mb-8`}>
          <h2 className="text-xl sm:text-2xl font-semibold mb-3">
            About the Author
          </h2>
          <div className="border border-gray-200 rounded-2xl p-4 sm:p-5 bg-white shadow-sm max-w-xl">
            <p className="font-semibold text-gray-900 mb-1">
              Salina Owens
            </p>
            <p className="text-gray-700 text-sm leading-relaxed">
              Salina explores the personal journey of authorship—drawing from real-life experiences,
              refining creative skills, and building meaningful connections with readers through
              powerful storytelling.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

function AsianFaqAccordion() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: 'Is Asian online dating safe?',
      a: 'Vantage Dating is a trusted global dating platform that uses strict moderation and privacy policies to help ensure a safe experience for users.',
    },
    {
      q: 'Is Vantage Dating free for Asian dating?',
      a: 'Users can create an account and browse profiles for free. To send messages, use video chat, and send virtual gifts, a monthly Credit Pack subscription is required.',
    },
    {
      q: 'Can I meet Asian women for serious relationships online?',
      a: 'Yes. Many Asian women on Vantage Dating are looking for genuine and meaningful online connections.',
    },
    {
      q: 'How can I avoid scams on Asian dating sites?',
      a: 'Only interact with verified profiles, keep conversations on the platform, and never share money or personal details such as addresses or bank information.',
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

