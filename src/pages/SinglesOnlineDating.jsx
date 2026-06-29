import LandingHero from '../components/LandingHero';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const sectionClass = 'max-w-5xl mx-auto px-4 sm:px-6';

export default function SinglesOnlineDating() {
  return (
    <div className="bg-white text-gray-900">
      <LandingHero backgroundImage="/online_dating.png" />

      <main className="py-10 sm:py-12 lg:py-16">
        {/* Article header */}
        <section className={sectionClass}>
          <h1 className="text-2xl sm:text-3xl font-bold mb-3">
            Online Dating Site for Singles
          </h1>
          <p className="text-gray-700 text-base sm:text-lg leading-relaxed mb-4">
            Looking for a fresh start in dating in 2025? Connecting online has never been easier.
            No matter your past experiences, online dating for singles offers a simple and flexible
            way to meet like-minded people from around the world and build meaningful virtual
            connections.
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
                With thousands of users ready to chat, connect, and form relationships, online
                dating platforms for singles—such as Vantage Dating—make it easier to navigate
                today’s digital dating world with confidence.
              </p>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <img
                src="/OnlineDatingSiteforSingles.png"
                alt="Singles connecting online - meet like-minded people"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>

        {/* Intro */}
        <section className={`${sectionClass} mt-10 sm:mt-12`}>
          <p className="text-gray-700 leading-relaxed mb-4">
            This guide explores one of the leading online dating sites for singles and shares
            helpful insights on how to get the most out of your experience. Discover why more
            singles are choosing Vantage Dating to meet their virtual dating needs.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Join a top online dating site for singles today—it’s free to register and easy to use.
          </p>
        </section>

        {/* Mature / Asia / Gay subsections */}
        <section className={`${sectionClass} mt-10 sm:mt-12`}>
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">
            Mature Online Dating
          </h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            A great connection has no age limit. Online dating for singles aged 40, 50, and 60+
            continues to grow rapidly, with many people finding success later in life. Vantage
            Dating supports older singles by offering filters for age, values, and preferences—making
            it easier to connect with mature singles who share similar goals.
          </p>

          <h2 className="text-xl sm:text-2xl font-semibold mb-4">
            Online Dating Singles from Asia
          </h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            If you’re interested in meeting singles from Asia, today’s online dating sites focus on
            global connections while respecting cultural diversity. Vantage Dating allows singles to
            explore new connections safely, inclusively, and conveniently—no matter where they’re
            located.
          </p>

          <h2 className="text-xl sm:text-2xl font-semibold mb-4">
            Gay Online Dating
          </h2>
          <p className="text-gray-700 leading-relaxed">
            For the LGBTQIA+ community, online dating sites for singles provide a more inclusive and
            welcoming environment than ever before. Whether you’re seeking a meaningful virtual
            relationship or simply a new connection to chat with, platforms like Vantage Dating
            offer the tools and features that help users feel seen, supported, and confident.
          </p>
        </section>

        {/* Why singles choose online dating */}
        <section className={`${sectionClass} mt-10 sm:mt-12`}>
          <h2 className="text-xl sm:text-2xl font-semibold mb-3">
            Why Are Singles Choosing Online Dating in 2025?
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Online dating for singles has become the preferred way to meet people in a fast-paced,
            global world. Both younger and more mature singles are turning to digital platforms like
            Vantage Dating to connect on their own terms.
          </p>
          <p className="text-gray-700 leading-relaxed mb-4">
            With busy schedules—balancing careers, social lives, and family—online dating offers
            flexibility and control. One of the standout benefits of Vantage Dating is the ability to
            register and browse profiles for free. In just a few steps, users can begin connecting
            with singles worldwide and focus on building meaningful relationships.
          </p>
          <p className="text-gray-700 leading-relaxed mb-4">
            Unlike general social media platforms, online singles dating sites are purpose-built for
            people who genuinely want to connect. Users can filter matches by interests, values, and
            relationship goals—whether they prefer casual conversations or deeper discussions that
            lead to long-term partnerships.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Dating technology has also evolved significantly. Many platforms now include live
            streaming, video calls, and voice messaging. Vantage Dating enhances safety and ease of
            use through active moderation, verified profiles, and secure communication tools.
          </p>
        </section>

        {/* Tips + Safe practices */}
        <section className={`${sectionClass} mt-10 sm:mt-12`}>
          <h2 className="text-xl sm:text-2xl font-semibold mb-3">
            Tips to Optimize Your Dating Profile
          </h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
            <li>Upload clear, high-quality photos</li>
            <li>Write a thoughtful and detailed bio</li>
            <li>Be honest about your dating goals</li>
            <li>Stay active and engage with other users</li>
          </ul>

          <h2 className="text-xl sm:text-2xl font-semibold mb-3">
            Safe Online Dating Practices
          </h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Keep all communication on the platform</li>
            <li>Interact only with verified profiles</li>
            <li>Avoid sharing personal or financial information</li>
            <li>Report suspicious behavior or red flags immediately</li>
          </ul>
        </section>

        {/* CTA */}
        <section className={`${sectionClass} mt-12 sm:mt-14`}>
          <h2 className="text-xl sm:text-2xl font-semibold mb-3">
            Ready to Date Online?
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Thousands of singles are online right now—don’t miss your opportunity to meet someone
            special.
          </p>
          <Link
            to="/signup-email"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-white font-semibold hover:opacity-90 transition"
            style={{
              background: 'linear-gradient(to right, #5A2D8A, #B5458F, #E97672)',
            }}
          >
            Sign up for free
          </Link>
        </section>

        {/* What makes unique */}
        <section className={`${sectionClass} mt-12 sm:mt-14`}>
          <h2 className="text-xl sm:text-2xl font-semibold mb-3">
            What Makes Vantage Dating Unique?
          </h2>
          <ul className="text-gray-700 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              Connect with thousands of verified singles
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              Real-time chats and live streaming features
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              Advanced search and filter options
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              Free registration and membership options
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              Secure, inclusive, and global community
            </li>
          </ul>
        </section>

        {/* FAQ */}
        <section className={`${sectionClass} mt-12 sm:mt-14`}>
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">
            FAQ
          </h2>
          <SinglesFaqAccordion />
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

function SinglesFaqAccordion() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: "What's the safest way to meet singles online?",
      a: 'Use verified online dating sites for singles like Vantage Dating, keep conversations on the platform, and never share personal or financial details.',
    },
    {
      q: 'Are there free online dating sites for singles over 30?',
      a: 'Yes. Vantage Dating allows singles aged 30 and above to register and browse profiles for free.',
    },
    {
      q: 'Can I use Vantage Dating for serious relationships?',
      a: 'Yes. Vantage Dating is designed to support meaningful, long-term connections.',
    },
    {
      q: 'Do free singles dating sites actually work?',
      a: 'Yes—especially when you optimize your profile and follow safe online dating practices.',
    },
    {
      q: 'Can online dating be trusted?',
      a: 'When using a secure and verified platform like Vantage Dating and engaging only with verified users, online dating can be a reliable way to form genuine connections.',
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
