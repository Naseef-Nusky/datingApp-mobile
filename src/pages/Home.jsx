import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import {
  FaArrowRight,
  FaChevronLeft,
  FaChevronRight,
  FaMinus,
  FaPlus,
} from 'react-icons/fa';
import Logo from '../components/Logo';
import LandingHero from '../components/LandingHero';
import { useLanguage } from '../context/LanguageContext';

/** Capacitor iOS app: marketing page is trimmed to hero only (full page stays on web). */
const isIosNativeAppShell = () =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';

const Home = () => {
  const { t } = useLanguage();
  const [activeReviewIndex, setActiveReviewIndex] = useState(1);
  const [activeJourneyIndex, setActiveJourneyIndex] = useState(1);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const featureCards = useMemo(() => [
    { titleKey: 'home.secureExperience', textKey: 'home.secureExperienceText', image: '/SecureExperience.png' },
    { titleKey: 'home.meaningfulMatches', textKey: 'home.meaningfulMatchesText', image: '/MeaningfulMatches.png' },
    { titleKey: 'home.verifiedMembers', textKey: 'home.verifiedMembersText', image: '/VerifiedMembers.png' },
    { titleKey: 'home.diverseCommunity', textKey: 'home.diverseCommunityText', image: '/DiverseCommunity.png' },
  ], []);

  const reviewCards = [
    {
      name: 'Lena R.',
      sourceKey: 'home.userReview',
      text: 'What stands out to me is the variety of people you can connect with here. Meeting individuals from different cultures and places really expands your dating experience.',
      muted: true,
    },
    {
      name: 'Marcus T.',
      sourceKey: 'home.userReview',
      text: "When I joined online dating at 35, I didn't know what to expect. I was pleasantly surprised to form a meaningful connection with someone from another part of the world. It felt genuine and refreshing.",
      muted: false,
    },
    {
      name: 'Robert K.',
      sourceKey: 'home.userReview',
      text: "At my age, I wasn't expecting much from online dating, but this platform changed my perspective. I found someone I truly connected with, both emotionally and intellectually.",
      muted: true,
    },
    {
      name: 'Emily W.',
      sourceKey: 'home.userReview',
      text: 'So far, my experience has been very positive. The messaging tools are easy to use, conversations feel natural, and the strong focus on safety really gives peace of mind.',
      muted: true,
    },
    {
      name: 'Daniel M.',
      sourceKey: 'home.userReview',
      text: 'I appreciate how smooth and engaging the communication features are. It is easy to start real conversations, and knowing the platform values user safety makes the experience even better.',
      muted: true,
    },
    {
      name: 'Sofia L.',
      sourceKey: 'home.userReview',
      text: 'I really enjoy how easy it is to meet people from different backgrounds here. The platform makes conversations feel natural, and connecting with someone from another country has been a great experience.',
      muted: true,
    },
  ];

  const journeySlides = [
    {
      heading: 'ComplaintsBoard',
      sub: 'Excellence Award Recipient',
    },
    {
      heading: '26+ years',
      sub: 'bringing singles together worldwide',
    },
    {
      heading: 'Connecting people',
      sub: 'across 150+ countries',
    },
  ];

  const getJourneyIndex = (offset) =>
    (activeJourneyIndex + offset + journeySlides.length) % journeySlides.length;

  const insightsCards = [
    {
      title: 'Dating Uruguayan Women',
      text: 'Interested in connecting with Uruguayan women? Discover how personality, lifestyle, and relationship values influence communication, dating etiquette, and early connections.',
      author: 'Editorial Team',
      date: '23/02/2026',
      image: '/Dating%20Uruguayan%20Women.png',
    },
    {
      title: 'Dating Vietnamese Women: Culture & Modern Love',
      text: 'Explore what it’s like to date Vietnamese women. Learn how culture, family values, and modern expectations shape communication, dating behavior, and online relationships.',
      author: 'Salina Owens',
      date: '18/02/2026',
      image: '/Dating%20Vietnamese%20Women.png',
    },
    {
      title: '50+ Flirty Text Messages for Him',
      text: 'Looking to spark attraction? Find playful, romantic, and clever flirty messages that help you connect, tease, and make him smile effortlessly.',
      author: 'Salina Owens',
      date: '20/08/2025',
      image: '/Flirty%20Text%20Messages%20for%20Him.png',
    },
  ];

  const homeFaqs = useMemo(
    () => [
      {
        question: 'How do I set up on website',
        answer: (
          <>
            <p className="mb-3">
              To get started, register on the platform by entering your basic information and verifying your email if required. This step helps ensure your profile is visible to suitable matches and keeps your account protected.
            </p>
            <p className="mb-3">
              Add a clear, high-quality photo of yourself—preferably one where your face is easily visible. This makes your profile more engaging and helps others connect with you instantly.
            </p>
            <p className="mb-3">
              Include a brief introduction about yourself in a couple of sentences. Keep it natural, upbeat, and to the point so people quickly get a sense of who you are.
            </p>
            <p className="mb-3">
              Once your profile is set up, you can personalise it further by adding details such as your age, interests, hobbies, languages spoken, and what you’re hoping to find. You may also have the option to display your online status.
            </p>
            <p>
              When reaching out to someone, keep your first message simple and friendly. A short greeting followed by a question is often the easiest way to start a conversation.
            </p>
            <p>
              If you experience any issues, such as pages not loading or changes not saving, try refreshing the app or logging in again. Should the problem continue, the support team will be able to assist you.
            </p>
          </>
        ),
      },
      {
        question: 'How can I discover people I’m genuinely interested in?',
        answer: (
          <>
            <p className="mb-3">
              Begin by exploring profiles and focusing on what stands out to you. A quick look through someone’s photos and short description is often enough to decide if you’d like to know more.
            </p>
            <p className="mb-3">
              To make your search more tailored, adjust the available filters. Even small tweaks can significantly improve how relevant your matches feel.
            </p>
            <p className="mb-3">
              As you spend more time on the platform, don’t hesitate to refine your preferences. Updating your settings based on what you enjoy will make your experience more personalised over time.
            </p>
            <p className="mb-2">Most platforms allow you to filter profiles using criteria such as:</p>
            <ul className="list-disc pl-5 mb-3 space-y-1">
              <li>Age range</li>
              <li>Location</li>
              <li>Interests and hobbies</li>
              <li>Languages spoken</li>
              <li>Zodiac sign</li>
              <li>Eye colour</li>
              <li>Online availability</li>
            </ul>
            <p className="mb-3">
              When viewing a profile, try to spot common interests or unique details you can mention. Referring to something specific—like a hobby or a travel photo—can make starting a conversation much easier and more natural.
            </p>
            <p className="mb-3">
              If you feel like you’re seeing the same types of profiles repeatedly, gradually broaden your filters. Small changes can introduce more variety while still keeping matches relevant.
            </p>
          </>
        ),
      },
      {
        question: 'How do I keep a conversation going with someone I like online?',
        answer: (
          <>
            <p className="mb-3">
              The key is to keep things relaxed and easy to reply to. You don’t need long messages—just make sure each one gives the other person something to respond to.
            </p>
            <p className="mb-3">
              Instead of sending lots of questions at once, ask one thoughtful question at a time. It feels more natural, especially if it connects to something they’ve shared on their profile.
            </p>
            <p className="mb-3">
              Try to stay engaged with what they’re saying. Rather than jumping between topics, pick up on small details and build on them—this helps conversations flow more naturally.
            </p>
            <p className="mb-2">If you’re unsure what to say next, take inspiration from their profile. You could mention:</p>
            <ul className="list-disc pl-5 mb-3 space-y-1">
              <li>Their hobbies or interests</li>
              <li>Places or activities in their photos</li>
              <li>Music, films, or food they like</li>
              <li>Travel plans or experiences</li>
              <li>What they’re hoping to find</li>
            </ul>
            <p className="mb-3">
              It’s just as important to share a bit about yourself too. Adding a personal thought or quick story makes it easier for the other person to connect and reply.
            </p>
            <p className="mb-3">
              If things go quiet, don’t worry—it happens. A simple, friendly message with a fresh question is usually enough to get things going again. Try not to send multiple messages back-to-back.
            </p>
            <p className="mb-3">
              And if the conversation doesn’t quite click, that’s okay. Focus on the ones that feel natural and enjoyable—those are the connections worth your time.
            </p>
          </>
        ),
      },
      {
        question: 'How does messaging work on vantage',
        answer: (
          <>
            <p className="mb-3">
              Starting a conversation is simple—just visit someone’s profile and choose the option to message them. Once you’ve connected, your conversation will be saved in your inbox so you can pick it up again whenever you like.
            </p>
            <p className="mb-3">
              You can return to your messages at any time through your inbox or contacts section. If the other person isn’t online, your message will usually be delivered for them to see later, while live chat is available when they’re active.
            </p>
            <p className="mb-2">
              Messaging features are designed to make conversations more engaging and interactive. Depending on the platform, you may have access to options such as:
            </p>
            <ul className="list-disc pl-5 mb-3 space-y-1">
              <li>Send and receive messages</li>
              <li>Using emojis or virtual gifts</li>
              <li>Share photos</li>
              <li>Sending voice messages</li>
              <li>Starting voice or video calls (if supported)</li>
            </ul>
            <p className="mb-3">
              Some of these features may require payment, depending on your account type.
            </p>
            <p>
              If you’re not seeing new messages come through, try checking your notification settings or refreshing your inbox.
            </p>
            <p>
              If at any point a conversation doesn’t feel right, you can use built-in safety tools like blocking or reporting a user. These features help maintain a safe and respectful environment for everyone.
            </p>
          </>
        ),
      },
      {
        question: 'How can I manage my membership on the dating platform?',
        answer: (
          <>
            <p className="mb-3">
              To view or update your membership, head to your account settings and look for sections such as Profile, Subscription, or Credits. This area gives you an overview of your current plan and account details.
            </p>
            <p className="mb-2">From here, you can typically handle everything in one place, including:</p>
            <ul className="list-disc pl-5 mb-3 space-y-1">
              <li>Checking your subscription or membership status</li>
              <li>Updating your payment details</li>
              <li>Viewing your available credit balance</li>
            </ul>
            <p className="mb-3">
              If you make any changes—like updating your payment method or switching plans—take a moment to confirm that everything has saved correctly. Refreshing the page or reopening the app can help you double-check.
            </p>
            <p>
              If certain options aren’t visible, it’s worth confirming that you’re logged into the correct account, especially if you use multiple devices or email addresses.
            </p>
            <p>
              For any billing concerns you can’t sort out—such as missing payments, incorrect charges, or unclear renewals—it’s best to contact support. Providing your account email and any payment confirmation or receipt will help resolve the issue more quickly.
            </p>
          </>
        ),
      },
      {
        question: 'What chat tools and virtual dating features are available?',
        answer: (
          <>
            <p className="mb-3">
              The platform offers a range of ways to connect, so you can interact at your own pace. Many people begin with basic messaging and then explore additional features as they feel more comfortable.
            </p>
            <p className="mb-3">
              Text chat is usually the starting point, but there are several ways to make conversations more engaging without needing to exchange personal contact details.
            </p>
            <p className="mb-2">Within the chat area, you may have access to features such as:</p>
            <ul className="list-disc pl-5 mb-3 space-y-1">
              <li>Real-time messaging</li>
              <li>Email-style messages</li>
              <li>Sending photos or short videos</li>
              <li>Voice messages</li>
              <li>Virtual gifts</li>
            </ul>
            <p className="mb-3">
              Some users may also have the option to start video chats, particularly if both profiles support webcam features.
            </p>
            <p>
              All of these tools are built into the platform, so you can use them directly without leaving the site. If certain options aren’t visible, they may depend on your device, account type, or whether your profile is fully set up.
            </p>
            <p>
              For features that require payment—such as sending media or using video—you’ll typically see the cost upfront before confirming, so you stay in control of what you use.
            </p>
            <p>
              As always, share information at a level you’re comfortable with. If needed, you can step back to simple messaging or use safety options like blocking or reporting to keep your experience secure.
            </p>
          </>
        ),
      },
    ],
    []
  );

  const totalReviews = reviewCards.length;
  const getWrappedReviewIndex = (index) => (index + totalReviews) % totalReviews;
  const leftReview = reviewCards[getWrappedReviewIndex(activeReviewIndex - 1)];
  const centerReview = reviewCards[getWrappedReviewIndex(activeReviewIndex)];
  const rightReview = reviewCards[getWrappedReviewIndex(activeReviewIndex + 1)];

  const iosAppHeroOnly = isIosNativeAppShell();

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <LandingHero />

      {!iosAppHeroOnly && (
        <>
      <section>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {featureCards.map((item) => (
            <div key={item.titleKey} className="overflow-hidden bg-transparent">
              <img
                src={item.image}
                alt={t(item.titleKey)}
                className="w-full h-28 object-contain rounded-lg"
                loading="lazy"
              />
              <div className="p-4">
                <h3 className="font-semibold text-base mb-2 text-center">{t(item.titleKey)}</h3>
                <p className="text-sm text-gray-600 leading-relaxed text-center">{t(item.textKey)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid md:grid-cols-2 gap-10 items-center mb-10">
            <div>
              <h2 className="text-2xl font-bold mb-3">{t('home.connectOnlineTitle')}</h2>
              <p className="text-gray-600 mb-5">
                {t('home.connectOnlineText')}
              </p>
            </div>
            <img
              src="/onlineChat.png"
              alt={t('home.connectOnlineTitle')}
              className="object-contain w-full h-80 sm:h-96"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-10 items-center">
            <img
              src="/virtualdating.png"
              alt="Interactive virtual dating tools"
              className="object-contain w-full h-80 sm:h-96 order-2 md:order-1"
            />
            <div className="order-1 md:order-2">
              <h2 className="text-2xl font-bold mb-3">{t('home.virtualDatingTitle')}</h2>
              <p className="text-gray-600 mb-4">
                {t('home.virtualDatingText')}
              </p>
              <Link
                to="/signup-email"
                className="inline-flex items-center gap-2 bg-red-600 text-white px-5 py-3 rounded-lg font-semibold hover:bg-red-700 transition"
              >
                {t('home.startNow')} <FaArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-2xl font-bold mb-3">{t('home.exploreProfilesTitle')}</h2>
              <p className="text-gray-600 leading-relaxed">
                {t('home.exploreProfilesText')}
              </p>
            </div>
            <img
              src="/diverseprofiles.png"
              alt={t('home.exploreProfilesTitle')}
              className="object-contain w-full h-80 sm:h-96"
            />
          </div>
        </div>
      </section>

      <section className="bg-white w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-black">{t('home.findSinglesTitle')}</h2>
            <p className="text-black mt-4 max-w-4xl mx-auto leading-relaxed text-center">
              {t('home.findSinglesText')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <img
                src="/mature%20singles.png"
                alt={t('home.matureSinglesTitle')}
                className="w-full h-56 object-cover rounded-xl mb-4"
              />
              <h3 className="font-semibold text-lg text-black mb-2">{t('home.matureSinglesTitle')}</h3>
              <p className="text-sm text-black leading-relaxed">
                {t('home.matureSinglesText')}
              </p>
            </div>

            <div>
              <img
                src="/Asian%20singles.png"
                alt={t('home.asianSinglesTitle')}
                className="w-full h-56 object-cover object-top rounded-xl mb-4"
              />
              <h3 className="font-semibold text-lg text-black mb-2">{t('home.asianSinglesTitle')}</h3>
              <p className="text-sm text-black leading-relaxed">
                {t('home.asianSinglesText')}
              </p>
            </div>

            <div>
              <img
                src="/Gay%20singles.png"
                alt={t('home.gaySinglesTitle')}
                className="w-full h-56 object-cover object-top rounded-xl mb-4"
              />
              <h3 className="font-semibold text-lg text-black mb-2">{t('home.gaySinglesTitle')}</h3>
              <p className="text-sm text-black leading-relaxed">
                {t('home.gaySinglesText')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <h3 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-2 px-2">{t('home.userReviewsTitle')}</h3>
          <p className="text-center text-gray-500 mb-6 sm:mb-8 px-2 text-sm sm:text-base">
            {t('home.userReviewsSub')}
          </p>

          {/* Mobile: single card with arrows */}
          <div className="flex md:hidden items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setActiveReviewIndex((prev) => getWrappedReviewIndex(prev - 1))}
              className="shrink-0 w-10 h-10 rounded-full border border-gray-300 text-gray-500 inline-flex items-center justify-center hover:bg-gray-50 transition"
              aria-label="Previous review"
            >
              <FaChevronLeft className="text-sm" />
            </button>
            <article className="flex-1 min-w-0 bg-white rounded-2xl p-5 sm:p-6 border border-gray-300 min-h-[280px] sm:min-h-[320px] flex flex-col justify-between overflow-hidden">
              <p className="text-gray-800 text-base sm:text-lg leading-relaxed mb-4 line-clamp-6">
                {centerReview.text}
              </p>
              <div className="flex items-center gap-3">
                <img src="/profile.png" alt={centerReview.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{centerReview.name}</p>
                  <p className="text-xs text-gray-500">{t(centerReview.sourceKey)}</p>
                </div>
              </div>
            </article>
            <button
              type="button"
              onClick={() => setActiveReviewIndex((prev) => getWrappedReviewIndex(prev + 1))}
              className="shrink-0 w-10 h-10 rounded-full border border-gray-300 text-gray-500 inline-flex items-center justify-center hover:bg-gray-50 transition"
              aria-label="Next review"
            >
              <FaChevronRight className="text-sm" />
            </button>
          </div>

          {/* Desktop: three cards with arrows */}
          <div className="hidden md:grid grid-cols-[1fr_auto_1fr_auto_1fr] gap-4 items-center">
            <article className="bg-white rounded-2xl p-6 border border-gray-200 h-[320px] flex flex-col justify-between overflow-hidden">
              <p className="text-gray-400 text-lg leading-relaxed mb-6 line-clamp-6">
                {leftReview.text}
              </p>
              <div className="flex items-center gap-3">
                <img src="/profile.png" alt={leftReview.name} className="w-8 h-8 rounded-full object-cover" />
                <div>
                  <p className="font-semibold text-gray-600">{leftReview.name}</p>
                  <p className="text-xs text-gray-400">{t(leftReview.sourceKey)}</p>
                </div>
              </div>
            </article>

            <button
              type="button"
              onClick={() => setActiveReviewIndex((prev) => getWrappedReviewIndex(prev - 1))}
              className="w-8 h-8 rounded-full border border-gray-300 text-gray-500 inline-flex items-center justify-center hover:bg-gray-50"
              aria-label="Previous review"
            >
              <FaChevronLeft className="text-xs" />
            </button>

            <article className="bg-white rounded-2xl p-6 border border-gray-300 h-[320px] flex flex-col justify-between overflow-hidden">
              <p className="text-gray-800 text-lg leading-relaxed mb-6 line-clamp-6">
                {centerReview.text}
              </p>
              <div className="flex items-center gap-3">
                <img src="/profile.png" alt={centerReview.name} className="w-8 h-8 rounded-full object-cover" />
                <div>
                  <p className="font-semibold text-gray-800">{centerReview.name}</p>
                  <p className="text-xs text-gray-500">{t(centerReview.sourceKey)}</p>
                </div>
              </div>
            </article>

            <button
              type="button"
              onClick={() => setActiveReviewIndex((prev) => getWrappedReviewIndex(prev + 1))}
              className="w-8 h-8 rounded-full border border-gray-300 text-gray-500 inline-flex items-center justify-center hover:bg-gray-50"
              aria-label="Next review"
            >
              <FaChevronRight className="text-xs" />
            </button>

            <article className="bg-white rounded-2xl p-6 border border-gray-200 h-[320px] flex flex-col justify-between overflow-hidden">
              <p className="text-gray-400 text-lg leading-relaxed mb-6 line-clamp-6">
                {rightReview.text}
              </p>
              <div className="flex items-center gap-3">
                <img src="/profile.png" alt={rightReview.name} className="w-8 h-8 rounded-full object-cover" />
                <div>
                  <p className="font-semibold text-gray-600">{rightReview.name}</p>
                  <p className="text-xs text-gray-400">{t(rightReview.sourceKey)}</p>
                </div>
              </div>
            </article>
          </div>

          <div className="flex justify-center items-center gap-2 mt-4 sm:mt-6">
            {reviewCards.map((_, dot) => (
              <button
                key={dot}
                type="button"
                onClick={() => setActiveReviewIndex(dot)}
                className={`w-2 h-2 rounded-full ${dot === activeReviewIndex ? 'bg-gray-700' : 'bg-gray-300'}`}
                aria-label={`Go to review ${dot + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section
        className="w-full min-h-[500px] sm:min-h-[620px] flex items-center justify-center"
        style={{
          backgroundImage:
            "linear-gradient(rgba(20,24,35,.45), rgba(20,24,35,.45)), url('/lookingForGreatConnection.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="relative z-10 max-w-3xl text-center px-6 py-12">
          <h3 className="text-3xl sm:text-5xl font-bold text-white mb-3">
            Ready to make meaningful connections?
          </h3>
          <p className="text-white/95 text-sm sm:text-base leading-relaxed mb-6">
            Sign up to explore profiles and begin dating online. Enjoy 24/7 chatting on our
            interactive platform and connect instantly with singles worldwide. Discover matches
            with ease and experience virtual relationships in a fun and engaging way!
          </p>
          <Link
            to="/signup-email"
            className="inline-block text-white font-semibold px-10 py-3 rounded-md hover:opacity-90 transition"
            style={{ background: 'linear-gradient(to right, #5A2D8A, #B5458F, #E97672)' }}
          >
            Give it a try!
          </Link>
        </div>
      </section>

      {/* Relationship experts section */}
      <section id="relationship-experts" className="w-full bg-white px-4 sm:px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-3">
            We&apos;re Partnering with Relationship Experts
          </h3>
            <p className="text-center text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            Vantage Dating collaborates with top specialists to ensure our platform remains engaging, fun,
            and provides members with a meaningful and enjoyable virtual dating experience.
          </p>

          <div className="grid gap-10 md:grid-cols-3">
            {/* Jaime Bronstein */}
            <article className="bg-white rounded-3xl shadow-md border border-gray-200 overflow-hidden flex flex-col h-full">
              <div className="w-full aspect-[4/3] overflow-hidden">
                <img
                  src="/1.png"
                  alt="Jaime Bronstein"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="px-6 pt-6 pb-7 flex flex-col flex-1">
                <h4 className="text-xl font-semibold text-center text-gray-900 mb-2">Jaime Bronstein</h4>
                <p className="text-xs sm:text-sm text-gray-500 text-center mb-4">
                  Jaime is a highly experienced relationship coach, recognized by Yahoo Finance as
                  &ldquo;The #1 Relationship Coach Transforming Lives&rdquo;.
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  For over 20 years, Jaime has guided singles, couples, and those navigating breakups and
                  divorces. She helps clients realize that they are meant to experience love&mdash;not just any
                  love, but the love that truly suits them.
                </p>
              </div>
            </article>

            {/* Sabrina Bendory */}
            <article className="bg-white rounded-3xl shadow-md border border-gray-200 overflow-hidden flex flex-col h-full">
              <div className="w-full aspect-[4/3] overflow-hidden">
                <img
                  src="/2.png"
                  alt="Sabrina Bendory"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="px-6 pt-6 pb-7 flex flex-col flex-1">
                <h4 className="text-xl font-semibold text-center text-gray-900 mb-2">Sabrina Bendory</h4>
                <p className="text-xs sm:text-sm text-gray-500 text-center mb-4">
                  Sabrina is a globally recognized dating and relationship expert, best-selling author, and
                  host of the You Will Be OK podcast.
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  With more than 15 years of experience, Sabrina has supported millions of women in building
                  self-confidence, breaking harmful patterns, and finding lasting love. Her book
                  &ldquo;You&apos;re Overthinking It&rdquo; has become an essential guide for modern dating, and
                  her TikTok and Instagram content continues to inspire and empower women worldwide.
                </p>
              </div>
            </article>

            {/* Bela Gandhi */}
            <article className="bg-white rounded-3xl shadow-md border border-gray-200 overflow-hidden flex flex-col h-full">
              <div className="w-full aspect-[4/3] overflow-hidden">
                <img
                  src="/3.png"
                  alt="Bela Gandhi"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="px-6 pt-6 pb-7 flex flex-col flex-1">
                <h4 className="text-xl font-semibold text-center text-gray-900 mb-2">Bela Gandhi</h4>
                <p className="text-xs sm:text-sm text-gray-500 text-center mb-4">
                  Bela is a relationship coach and founder of Smart Dating Academy, known for her Foolproof
                  System for identifying ideal partner qualities (GPQ&reg;).
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  With 15+ years guiding people through relationships, Bela has helped countless couples
                  achieve happiness. Her expertise has earned her the nickname &ldquo;Fairy Godmother of
                  Love&rdquo; by Steve Harvey and Good Morning America.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Our Shared Journey — full-width slider */}
      <section
        className="w-full relative min-h-[420px] sm:min-h-[520px] lg:min-h-[620px] flex flex-col items-center justify-center overflow-hidden"
        style={{
          backgroundImage: "url('/OurSharedSuccess.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* subtle overlay to improve readability */}
        <div className="absolute inset-0 bg-slate-700/20 pointer-events-none" />

        <div className="relative z-10 w-full px-4 sm:px-6 py-8 sm:py-10 flex flex-col items-center">
          <h3 className="text-xl sm:text-3xl lg:text-4xl font-bold text-white text-center mb-2 sm:mb-3 px-2">
            Our Shared Journey
          </h3>
          <p className="text-white/90 text-sm sm:text-base text-center max-w-xl mx-auto leading-relaxed mb-6 sm:mb-10 px-2">
            Vantage Dating is dedicated to reducing loneliness by encouraging virtual closeness
            and meaningful online connections. Join us today and take your first step toward
            meeting the right match online.
          </p>

          {/* Mobile: single center card with arrows */}
          <div className="flex md:hidden w-full items-center gap-2 sm:gap-3 px-1">
            <button
              type="button"
              onClick={() => setActiveJourneyIndex(getJourneyIndex(-1))}
              className="shrink-0 w-10 h-10 rounded-full border border-white/60 bg-white/10 text-white hover:bg-white/25 transition inline-flex items-center justify-center"
              aria-label="Previous"
            >
              <FaChevronLeft className="text-sm" />
            </button>
            <article className="flex-1 min-w-0 bg-white rounded-2xl p-4 sm:p-6 min-h-[180px] sm:min-h-[220px] flex flex-col justify-center text-center shadow-xl">
              <h4 className="text-lg sm:text-2xl font-bold text-gray-800 mb-1 break-words">
                {journeySlides[activeJourneyIndex].heading}
              </h4>
              <p className="text-xs sm:text-base text-gray-600">
                {journeySlides[activeJourneyIndex].sub}
              </p>
            </article>
            <button
              type="button"
              onClick={() => setActiveJourneyIndex(getJourneyIndex(1))}
              className="shrink-0 w-10 h-10 rounded-full border border-white/60 bg-white/10 text-white hover:bg-white/25 transition inline-flex items-center justify-center"
              aria-label="Next"
            >
              <FaChevronRight className="text-sm" />
            </button>
          </div>

          {/* Desktop: three-card slider */}
          <div className="hidden md:flex w-full max-w-6xl items-center justify-center gap-4 lg:gap-6">
            {/* Left muted card */}
            <article className="flex-[1.1] min-w-0 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl p-6 lg:p-8 min-h-[220px] lg:min-h-[260px] flex flex-col justify-center text-center">
              <h4 className="text-lg lg:text-2xl font-semibold text-white mb-1">
                {journeySlides[getJourneyIndex(-1)].heading}
              </h4>
              <p className="text-sm lg:text-base text-white/80">
                {journeySlides[getJourneyIndex(-1)].sub}
              </p>
            </article>

            {/* Left arrow */}
            <button
              type="button"
              onClick={() => setActiveJourneyIndex(getJourneyIndex(-1))}
              className="shrink-0 w-8 h-8 lg:w-9 lg:h-9 rounded-full border border-white/60 bg-white/10 text-white hover:bg-white/25 transition inline-flex items-center justify-center"
              aria-label="Previous"
            >
              <FaChevronLeft className="text-xs" />
            </button>

            {/* Center prominent card */}
            <article className="flex-[1.4] min-w-0 bg-white rounded-2xl p-6 lg:p-10 min-h-[240px] lg:min-h-[300px] flex flex-col justify-center text-center shadow-xl">
              <h4 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-2 break-words">
                {journeySlides[activeJourneyIndex].heading}
              </h4>
              <p className="text-sm md:text-base lg:text-xl text-gray-600">
                {journeySlides[activeJourneyIndex].sub}
              </p>
            </article>

            {/* Right arrow */}
            <button
              type="button"
              onClick={() => setActiveJourneyIndex(getJourneyIndex(1))}
              className="shrink-0 w-8 h-8 lg:w-9 lg:h-9 rounded-full border border-white/60 bg-white/10 text-white hover:bg-white/25 transition inline-flex items-center justify-center"
              aria-label="Next"
            >
              <FaChevronRight className="text-xs" />
            </button>

            {/* Right muted card */}
            <article className="flex-[1.1] min-w-0 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl p-6 lg:p-8 min-h-[220px] lg:min-h-[260px] flex flex-col justify-center text-center">
              <h4 className="text-lg lg:text-2xl font-semibold text-white mb-1">
                {journeySlides[getJourneyIndex(1)].heading}
              </h4>
              <p className="text-sm lg:text-base text-white/80">
                {journeySlides[getJourneyIndex(1)].sub}
              </p>
            </article>
          </div>

          {/* Dot indicators */}
          <div className="flex justify-center items-center gap-2 mt-4 sm:mt-6">
            {journeySlides.map((_, dot) => (
              <button
                key={`journey-dot-${dot}`}
                type="button"
                onClick={() => setActiveJourneyIndex(dot)}
                className={`w-2 h-2 rounded-full transition ${dot === activeJourneyIndex ? 'bg-white' : 'bg-white/40'}`}
                aria-label={`Go to slide ${dot + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="w-full bg-white px-4 sm:px-6 pb-12">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-3">
            Online Dating Insights
          </h3>
          <p className="text-center text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            Looking for guidance on online dating or tips to perfect your profile?
            Get matched smarter with expert-backed advice designed to help you build meaningful virtual connections.
            Turn your next online relationship into a success with real-world experience.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {insightsCards.map((card) => (
              <article key={card.title} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-48 object-cover object-top"
                />
                <div className="p-5">
                  <h4 className="text-3xl font-semibold text-gray-900 mb-3 leading-tight">
                    {card.title}
                  </h4>
                  <p className="text-gray-600 text-lg leading-relaxed mb-5">
                    {card.text}
                  </p>
                  <div className="flex items-center justify-between gap-3 text-sm text-gray-500 whitespace-nowrap">
                    <span className="truncate">By {card.author}</span>
                    <span className="shrink-0">{card.date}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full bg-gray-50 px-4 sm:px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-3">FAQ</h3>
          <p className="text-center text-gray-600 text-base sm:text-lg max-w-3xl mx-auto mb-8 leading-relaxed">
            Want advice on online dating? Need tips on polishing your profile? Match better with trusted guidance and turn your next virtual relationship into real success.
          </p>

          <div className="space-y-3">
            {homeFaqs.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <article key={item.question} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex((prev) => (prev === idx ? -1 : idx))}
                    className="w-full flex items-center justify-between text-left px-5 py-4"
                  >
                    <span className="font-medium text-base sm:text-lg text-gray-900">{item.question}</span>
                    {isOpen ? <FaMinus className="text-gray-500" /> : <FaPlus className="text-gray-500" />}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-base text-gray-700 leading-relaxed">
                      {item.answer}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>
        </>
      )}

    </div>
  );
};

export default Home;

