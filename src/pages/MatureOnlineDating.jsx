import LandingHero from '../components/LandingHero';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const sectionClass = 'max-w-5xl mx-auto px-4 sm:px-6';

export default function MatureOnlineDating() {
  return (
    <div className="bg-white text-gray-900">
      <LandingHero />

      <main className="py-10 sm:py-12 lg:py-16">
        {/* Article header */}
        <section className={sectionClass}>
          <h1 className="text-2xl sm:text-3xl font-bold mb-3">
            Mature Online Dating
          </h1>
          <p className="text-gray-700 text-base sm:text-lg leading-relaxed mb-4">
            Online dating for mature singles has become one of the fastest-growing ways for people
            aged 40 and above to meet like-minded adults looking for genuine, long-term
            relationships. Modern platforms such as Vantage Dating have created welcoming and inclusive
            spaces where mature singles can connect with confidence and ease.
          </p>
          <p className="text-sm text-gray-600">
            By <span className="font-semibold">Salina Owens</span>
            <span className="mx-1">•</span>
            <span>30.07.2025</span>
          </p>
        </section>

        {/* Main content with hero-like image block */}
        <section className={`${sectionClass} mt-10 sm:mt-12`}>
          <div className="grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-6 lg:gap-10 items-start">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold mb-2">
                Mature Dating Online
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                It’s the perfect time to explore new social and romantic opportunities in this
                exciting second chapter of life. Vantage Dating offers a dedicated space for mature
                online dating, helping you connect with compatible singles from around the world who
                share similar values, goals, and life experiences.
              </p>

              <h2 className="text-lg sm:text-xl font-semibold mb-2">
                Best Mature Dating Sites
              </h2>
              <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
                <li>Trusted platforms with verified profiles</li>
                <li>Designed to be easy and intuitive for adults aged 40+ and 50+</li>
              </ul>

              <h2 className="text-lg sm:text-xl font-semibold mb-2">
                Mature Dating Options
              </h2>
              <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
                <li>Free registration and profile browsing</li>
                <li>Access to chat and video communication features</li>
              </ul>

              <h2 className="text-lg sm:text-xl font-semibold mb-2">
                Online Dating for Mature Singles
              </h2>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Meet mature women and men seeking meaningful connections</li>
                <li>Discover virtual companionship or long-term relationships</li>
              </ul>
            </div>

            <div className="rounded-2xl overflow-hidden shadow-lg">
              <img
                src="/MatureDatingOnline.png"
                alt="Mature person chatting online in the evening"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>

        {/* Why they trust + supporting image */}
        <section className={`${sectionClass} mt-10 sm:mt-12`}>
          <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-6 lg:gap-10 items-start">
            <div className="rounded-2xl overflow-hidden shadow-lg order-2 lg:order-1">
              <img
                src="/Why_Mature_Singles.png"
                alt="Smiling mature woman relaxing at home"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="order-1 lg:order-2">
              <h2 className="text-xl sm:text-2xl font-semibold mb-3">
                Why Mature Singles Trust Vantage Dating
              </h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Vantage Dating is widely recognized as one of the leading mature dating platforms
                available today. It offers advanced tools that make it easier for mature adults to
                connect naturally and securely. The platform is thoughtfully designed to meet the
                needs of older singles, welcoming mature women ready to date online and mature men
                looking for a fresh start.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Mature online dating has evolved into a modern, enjoyable way to form authentic
                connections rooted in emotional maturity and shared life experiences.
              </p>
            </div>
          </div>
        </section>

        {/* Feature cards */}
        <section className={`${sectionClass} mt-10 sm:mt-12`}>
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">
            Vantage Dating Key Features
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-2xl p-4 shadow-sm bg-white">
              <p className="font-semibold text-gray-900 mb-2">
                Free registration &amp; exploration
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                Sign up and browse profiles at no cost while you get comfortable with the platform.
              </p>
            </div>
            <div className="border border-gray-200 rounded-2xl p-4 shadow-sm bg-white">
              <p className="font-semibold text-gray-900 mb-2">
                Advanced matching tools
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                Filter by lifestyle, interests, and relationship goals to find people who truly fit
                your life.
              </p>
            </div>
            <div className="border border-gray-200 rounded-2xl p-4 shadow-sm bg-white">
              <p className="font-semibold text-gray-900 mb-2">
                Verified members
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                Connect confidently with profiles that display a verified badge and pass safety
                checks.
              </p>
            </div>
            <div className="border border-gray-200 rounded-2xl p-4 shadow-sm bg-white">
              <p className="font-semibold text-gray-900 mb-2">
                Video &amp; live chat
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                Move from messages to real-time conversations when you&apos;re ready, all within one
                secure space.
              </p>
            </div>
          </div>
        </section>

        {/* Tips strip */}
        <section className={`${sectionClass} mt-10 sm:mt-12`}>
          <h2 className="text-xl sm:text-2xl font-semibold mb-3">
            Top Tips for Mature Online Dating
          </h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Be authentic – Stay honest about your values and intentions.</li>
            <li>Communicate safely – Interact only with verified profiles.</li>
            <li>Use video chat wisely – Build trust before meeting or deepening connections.</li>
            <li>Set clear goals – Be upfront about what you’re looking for.</li>
            <li>Stay open-minded – Meaningful connections can come from different walks of life.</li>
          </ul>
          <p className="text-gray-700 leading-relaxed mt-4">
            With a continuously growing global community, Vantage Dating makes it easy to connect
            with mature singles worldwide who share similar interests and life perspectives. Many
            users have found genuine virtual companionship and emotional connection through the
            platform.
          </p>
        </section>

        {/* Testimonials in stacked cards */}
        <section className={`${sectionClass} mt-10 sm:mt-12`}>
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">
            What Mature Users Are Saying
          </h2>
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-700 leading-relaxed">
                “It’s reassuring to know I’m not alone in wanting connection later in life.”
              </p>
              <p className="mt-2 text-sm font-semibold text-gray-900">— Angela, 47</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-700 leading-relaxed">
                “The video chat feature made conversations feel natural and safe from the start.”
              </p>
              <p className="mt-2 text-sm font-semibold text-gray-900">— Thomas, 54</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-700 leading-relaxed">
                “I never imagined that dating in my 60s could be this simple. I’ve connected with
                someone who truly understands my life journey.”
              </p>
              <p className="mt-2 text-sm font-semibold text-gray-900">— Susan, 62</p>
            </div>
          </div>
        </section>

        {/* Ready to date section with CTA */}
        <section className={`${sectionClass} mt-12 sm:mt-14`}>
          <h2 className="text-xl sm:text-2xl font-semibold mb-3">
            Ready to Date Online?
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Thousands of mature singles are online right now—your next meaningful connection could
            begin with just one message.
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

        {/* FAQ with accordion */}
        <section className={`${sectionClass} mt-12 sm:mt-14`}>
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">
            FAQ
          </h2>
          <FaqAccordion />
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

function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: 'Is mature online dating safe?',
      a: 'Reputable platforms like Vantage Dating use strict moderation policies and profile verification systems to help ensure user safety.',
    },
    {
      q: 'Is Vantage Dating free for mature singles?',
      a: 'Yes, registration and profile browsing are completely free.',
    },
    {
      q: 'Can I meet mature men or women for serious relationships online?',
      a: 'Absolutely. The platform connects mature singles seeking genuine and lasting connections.',
    },
    {
      q: 'How can I avoid scams on mature dating sites?',
      a: 'Stick to verified profiles, keep conversations on the platform, and report any suspicious behavior immediately.',
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

