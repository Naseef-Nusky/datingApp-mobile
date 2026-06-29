import LandingHero from '../components/LandingHero';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const sectionClass = 'max-w-5xl mx-auto px-4 sm:px-6';

export default function GayDatingOnline() {
  return (
    <div className="bg-white text-gray-900">
      <LandingHero />

      <main className="py-10 sm:py-12 lg:py-16">
        {/* Article header */}
        <section className={sectionClass}>
          <h1 className="text-2xl sm:text-3xl font-bold mb-3">
            Gay Dating by Identity or Interest
          </h1>
          <p className="text-gray-700 text-base sm:text-lg leading-relaxed">
            The gay community isn’t one-size-fits-all—and that’s exactly what makes it beautiful.
            It’s made up of poetry lovers and gym enthusiasts, drag brunch regulars and Dungeons
            &amp; Dragons fans, faith groups and late-night chats. With so many identities and
            interests, it’s only natural that gay online dating offers spaces for every corner of
            the rainbow. The best gay dating experiences celebrate diversity.
          </p>
        </section>

        {/* Main description with image */}
        <section className={`${sectionClass} mt-10 sm:mt-12`}>
          <div className="grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-6 lg:gap-10 items-start">
            <div>
              <p className="text-gray-700 leading-relaxed">
                With so many identities and interests, gay online dating offers spaces for every
                corner of the rainbow. Whether you’re looking for community, romance, or friendship,
                platforms like Vantage Dating help you connect with thousands of gay men and
                LGBTQIA+ singles on your terms.
              </p>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <img
                src="/Gaydating.png"
                alt="Gay dating online - connect with LGBTQIA+ singles"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>

        {/* Finding Your Space */}
        <section className={`${sectionClass} mt-10 sm:mt-12`}>
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">
            Finding Your Space
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Black &amp; Proud
              </h3>
              <p className="text-gray-700 leading-relaxed">
                For gay Black men navigating the intersection of race and sexuality, there are
                communities centered on culture, connection, and shared experiences. From swapping
                soul food recipes to debating classic R&amp;B albums or chatting about Pride, these
                platforms celebrate Black joy and belonging. It’s time to explore gay Black dating
                online.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Faithful &amp; Fabulous
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Spirituality and love can go hand in hand. Gay Christian and gay Muslim dating
                platforms exist for those who want meaningful connections grounded in faith. From
                deep conversations to praying together over video chat, these spaces honor both
                belief and romance—making gay Muslim online dating feel natural and authentic.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Silver Foxes
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Senior gay dating is thriving. Men over 50 share stories of coming out across
                different decades, exchange travel tips, and challenge the idea that romance belongs
                only to the young. Gay senior online dating proves that love has no age limit.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Trans &amp; Nonbinary Inclusive
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Some gay men are trans, nonbinary, or gender-fluid—and inclusive platforms
                recognize that. The best dating sites allow users to select pronouns and identities
                that truly reflect who they are. Everyone deserves to be addressed with respect and
                ease while enjoying hassle-free gay dating online.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Just Turned 18 (18+)
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Early adulthood is exciting, confusing, and full of firsts. Dating can feel
                overwhelming at any age, and young gay men benefit from spaces where they can talk
                openly about first relationships, heartbreak, and self-discovery in a supportive
                environment.
              </p>
            </div>

            <p className="text-gray-700 leading-relaxed pt-2">
              You don’t have to choose just one community. Think of these spaces like themed rooms
              at a party—you can move between them depending on your mood, interests, and where
              you are in life.
            </p>
          </div>
        </section>

        {/* Features to Look for */}
        <section className={`${sectionClass} mt-10 sm:mt-12`}>
          <h2 className="text-xl sm:text-2xl font-semibold mb-3">
            Features to Look for in Gay Dating Sites
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Not all dating apps are created equal. Some feel shallow, while others overwhelm you
            with endless questions before showing a single profile. The best gay dating platforms
            strike a balance.
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
            <li>
              <strong>Reliable Verification</strong> — Real people, real photos, and genuine
              profiles matter. Verification helps ensure you’re connecting with someone
              authentic—not a stock photo with a catchy username.
            </li>
            <li>
              <strong>Smart Matching (Without the Weirdness)</strong> — Good algorithms help you
              discover compatible matches without boxing you into an echo chamber. A few fun
              questions should lead to meaningful suggestions, not over-analysis.
            </li>
            <li>
              <strong>Multiple Ways to Connect</strong> — Text, voice notes, video calls, GIFs—choice
              matters. Whether you prefer typing, sharing a voice message, or hopping on a quick
              video chat, flexibility makes conversations feel more natural.
            </li>
            <li>
              <strong>Privacy on Your Terms</strong> — Control what you share and when. Show or
              hide your age, limit photo visibility, or keep your location vague until you’re
              ready. It’s your story—you decide how it unfolds. Stay confident and safe with
              online dating for gay men.
            </li>
            <li>
              <strong>Clear Rules and Real Enforcement</strong> — No one should face harassment,
              racism, or body shaming. A quality platform has clear community guidelines and real
              moderators who take action when those lines are crossed.
            </li>
          </ul>
          <p className="text-gray-700 leading-relaxed">
            Platforms like Vantage Dating aim to maintain this balance by continuously improving
            features based on user feedback—creating a welcoming and well-managed space for gay
            singles.
          </p>
        </section>

        {/* Tips for Safe & Fun */}
        <section className={`${sectionClass} mt-10 sm:mt-12`}>
          <h2 className="text-xl sm:text-2xl font-semibold mb-3">
            Tips for Safe &amp; Fun Gay Online Dating
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Meeting someone new is exciting—but staying smart keeps the experience positive.
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
            <li>
              <strong>Protect Your Personal Details</strong> — Keep your full name, address, and
              workplace private until trust is established.
            </li>
            <li>
              <strong>Use Video Chat Early</strong> — A quick video call can confirm authenticity
              and save time—plus, it helps break the ice.
            </li>
            <li>
              <strong>Choose Public Places for First Meetings</strong> — If you decide to meet
              offline, opt for busy cafés, parks, or bookstores where you’ll feel comfortable and
              safe.
            </li>
            <li>
              <strong>Trust Your Instincts</strong> — If something feels off—requests for money,
              pressure to meet too fast—it’s okay to walk away. You owe no one your time.
            </li>
            <li>
              <strong>Report When Needed</strong> — Reporting inappropriate behavior isn’t
              overreacting. It helps protect the entire community.
            </li>
          </ul>
          <p className="text-gray-700 leading-relaxed">
            Dating should be exciting, awkward, funny, and sometimes unpredictable—but never
            isolating. With thousands of gay men and LGBTQIA+ singles connecting on Vantage
            Dating, you’re likely to meet someone who sparks your interest—or at least makes you
            laugh out loud.
          </p>
        </section>

        {/* CTA */}
        <section className={`${sectionClass} mt-12 sm:mt-14`}>
          <p className="text-gray-700 leading-relaxed mb-4">
            Sign up for free and start chatting today. Build meaningful connections on your terms,
            wherever you are.
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

        {/* FAQ */}
        <section className={`${sectionClass} mt-12 sm:mt-14`}>
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">
            FAQ
          </h2>
          <GayFaqAccordion />
        </section>
      </main>
    </div>
  );
}

function GayFaqAccordion() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: 'Is gay online dating safe?',
      a: 'Online dating can be safer than meeting strangers without context, but no platform is perfect. Reputable apps offer encryption, verification, and moderation—how safe it is also depends on using common sense and taking your time.',
    },
    {
      q: 'Are there truly free gay dating sites?',
      a: 'Most platforms offer free features, including profile creation and limited messaging. Sites like Vantage Dating allow users to get started for free, with optional upgrades for expanded communication tools.',
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
