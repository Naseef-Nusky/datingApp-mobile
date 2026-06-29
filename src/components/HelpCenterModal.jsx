import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';

const FAQ_SECTIONS = [
  {
    id: 'getting-started',
    label: 'Getting Started',
    icon: '🚀',
    items: [
      {
        id: 'free-trial',
        question: 'Can I try out your services for free?',
        answer:
          'Sometimes you may receive a small bonus or welcome offer, but the main way to experience everything is by purchasing credits. Credits let you use all paid features like chat, email, video, gifts and more. New members can usually get an exclusive one‑time welcome discount on the first month or first credit package.',
      },
      {
        id: 'what-are-credits',
        question: 'What are credits?',
        answer:
          'Credits are the internal currency of the site. You use them whenever you send paid messages, read or send emails, start video or audio calls, unlock photos and videos, send gifts and more. You only spend credits when you actually use a service, and you can top up at any time depending on how you prefer to communicate.',
      },
      {
        id: 'get-matches-prefer',
        question: 'How can I get matches I prefer?',
        answer:
          'Any member can view your profile and contact you, which gives you more chances to connect. If it feels like too much, you can hide your profile so that only contacts can reach you, and use the search filters to find people based on your own criteria. Try not to be too strict with filters; staying a bit flexible gives you many more potential matches and conversations.',
      },
      {
        id: 'begin-using-site',
        question: 'How can I begin using the site?',
        answer:
          'Start by completing your profile: describe yourself, share what kind of person you are looking for, and pick your interests and hobbies. A detailed profile attracts better matches. Then use the Search at the top of the page to browse members, especially those who are online now so you can chat right away. To communicate you will need an active membership or credits, which you can buy via Upgrade or Subscribe. Once that is set, explore features like Let’s Mingle, Chat, Email, Video Chat and Voice Messaging.',
      },
      {
        id: 'too-many-contacts',
        question: 'Why are too many people contacting me?',
        answer:
          'New and visible profiles naturally receive more attention, especially when your profile is public and appears in search results. If it is overwhelming, you can hide your profile so only contacts can find you, reply only to messages that interest you, and block or report anyone who makes you uncomfortable. Getting many messages is a sign your profile is attractive, but you always stay in control.',
      },
    ],
  },
  {
    id: 'general-info',
    label: 'General Information',
    icon: '📚',
    items: [
      {
        id: 'delete-account',
        question: 'How can I delete my account?',
        answer:
          'Go to Settings and open the Manage account section. Choose the Delete Profile option, confirm your choice and, if asked, enter your password. Support may contact you to make sure everything is handled correctly, and once deletion is completed other members will no longer see your profile or past conversations.',
      },
      {
        id: 'vip-status',
        question: 'How can I get VIP status?',
        answer:
          'VIP status is a reward for members who actively use the services. Typically you become VIP after purchasing and spending a certain number of credits within a short period (for example, 800 credits in 14 days). VIPs get a special crown badge, priority support, exclusive perks, bonus offers and early access to new features. Buying larger credit packs is usually the fastest and most cost‑effective way to qualify.',
      },
      {
        id: 'delete-sent-media',
        question: 'Can I delete my sent messages and media?',
        answer:
          'You can usually delete or hide items from your own chat or email history, but anything already delivered to another member may still remain in their inbox. For safety and audit reasons, the platform may keep internal records even after you remove something from your own view.',
      },
      {
        id: 'blue-check',
        question: 'What is the blue checkmark for?',
        answer:
          'A blue checkmark usually means that a profile has passed an extra verification step (for example, ID or selfie verification). It helps other members see that the person is more likely to be genuine and trustworthy.',
      },
      {
        id: 'copy-conversation',
        question: 'Can you send me a copy of my conversation with another member?',
        answer:
          'For privacy and security reasons, support cannot export or email copies of conversations between members. Chats are meant to stay private for both sides. You can manually save any important information while it is visible in your inbox, and if a message breaks the rules you can report it so the team can review it internally.',
      },
    ],
  },
  {
    id: 'profile-settings',
    label: 'My Profile And Settings',
    icon: '🔧',
    items: [
      {
        id: 'check-credit-balance',
        question: 'How can I check my credit balance?',
        answer:
          'You can see your current credit balance directly inside your account. On desktop, mobile browser or app, look for the credits indicator near the top of the page or in the account/profile area. If you ever need a detailed history of how you used your credits, you can contact customer support and they will help you review your transactions.',
      },
      {
        id: 'edit-profile',
        question: 'How can I edit my profile?',
        answer:
          'Open “My Profile” from the menu to update your information. From there you can change your mood and cover (browser), upload a new profile photo, edit personal details, update “A few words about yourself”, create or adjust your wishlist (browser), add or remove photos and videos, select interests, complete the About You section and describe what you are looking for. Remember to click Save after making changes so your profile stays fresh and accurate.',
      },
      {
        id: 'hide-unhide-profile',
        question: 'How can I hide/unhide my profile?',
        answer:
          'To hide your profile, go to Settings, open the Manage Account section and choose the Hide Profile option, then confirm. When hidden, members who are not on your contact list can’t see or contact you, but you can still message others. To unhide, click the Unhide button on the home page; your profile becomes visible again and you will start receiving new messages and invites. Hiding your profile does not delete your account or change your membership.',
      },
      {
        id: 'edit-contact-list',
        question: 'How can I edit my contact list?',
        answer:
          'Your contact list is where you keep the members you are most interested in. To add someone, open their profile and click the star icon on the top‑right; they will appear in your contacts for quick access. You can favorite a contact by clicking the heart icon, which pins them near the top. To remove someone, uncheck the star or use the “…” menu next to their name and choose delete. You can always add the member again later if you change your mind.',
      },
      {
        id: 'find-account-id',
        question: 'How can I locate my account ID number?',
        answer:
          'Your account ID number usually appears in your profile or account settings area, and may also be shown inside the profile menu. If support asks for it, you can copy it from there and include it in your message so they can quickly find your account.',
      },
    ],
  },
  {
    id: 'services-features',
    label: 'Services And Features',
    icon: '💌',
    items: [
      {
        id: 'video-chat',
        question: 'How can I video chat?',
        answer:
          'Video chat lets you talk face‑to‑face in real time. To start a video call, go to the other member’s profile and click the “Start Video Chat” button, or use the same button at the top of your chat with them. If the button is not visible, it usually means their camera is not enabled—ask them to turn it on so you can start the call. Once they accept your invite, the session begins immediately and is billed per minute in credits. For the best experience, use a stable internet connection, check that your camera and microphone work, and close any other apps using them.',
      },
      {
        id: 'audio-call',
        question: 'How can I audio call?',
        answer:
          'Audio calls are a more personal way to talk without turning on video. To start an audio call, open the member’s profile or chat and click the green “Audio Call” button. When they accept, the call starts right away and is billed per minute. For a smooth call, use a good Wi‑Fi or data connection, make sure your microphone is working, and close other programs that might be using audio. If you do not see the audio call option yet, it may still be in gradual rollout—keep your account active and up to date, and being a VIP can help you get new features earlier.',
      },
      {
        id: 'audio-message',
        question: 'How can I send an audio/voice message?',
        answer:
          'In chats that support it you will see a microphone or voice‑message icon next to the send box. Hold or tap it to record your message, then send when you are happy with it. Listening to or sending audio messages may cost credits, but re‑playing the same message again is usually free.',
      },
      {
        id: 'chat',
        question: 'How can I chat?',
        answer:
          'Open a member’s profile and use the chat or message button to start a conversation. Online chat is billed as you send messages; offline chat or mobile messages may be billed per message or per character block. You can also use features like Let’s Mingle to send a pre‑written message to several matching members at once.',
      },
      {
        id: 'email',
        question: 'How can I email?',
        answer:
          'Email is ideal for longer, more detailed messages. From a member’s profile or inbox, choose the email option, write your message and send. Email usually costs a fixed number of credits to send or read, with attachments (photos, videos, etc.) costing extra. Once unlocked, you can re‑read the same email and attachments again without paying a second time.',
      },
    ],
  },
  {
    id: 'membership',
    label: 'Membership Management',
    icon: '📅',
    items: [
      {
        id: 'free-membership',
        question: 'How can I get free membership?',
        answer:
          'Free membership is a special reward for highly active, authentic members. Free users are usually marked with a flame icon, showing they are engaged and verified. To qualify you generally need to be verified, use the site frequently, upload clear photos, fully complete your profile, post genuine content and receive more invites than the average member over several months. You can usually apply via the Free User link under Membership in the Terms & Conditions, but applications are reviewed manually and not everyone will be approved.',
      },
      {
        id: 'change-membership',
        question: 'How can I change my membership subscription package?',
        answer:
          'Your subscription should match how you actually use the service. To change your package, go to your account or billing settings and open the membership/subscription section. The exact steps may depend on how you first subscribed—for example, card payments are usually managed directly in your account, while app‑store or alternative payment methods may need changes through that provider. If you are unsure which applies to you, contact support and they will guide you through the correct process.',
      },
      {
        id: 'why-subscribe',
        question: 'Why should I purchase a membership subscription if I need to buy credits?',
        answer:
          'Credits give you flexibility to pay only for the services you actually use, while a membership subscription adds extra benefits like better visibility, more contact options or discounted credit pricing. Many members use both: a subscription for ongoing advantages and credits to control how much they spend on chat, email, video and gifts.',
      },
      {
        id: 'renew-membership',
        question: 'When will my membership renew?',
        answer:
          'Most subscriptions renew automatically at the end of each billing period (for example, every 30 days), using the same payment method you originally chose. You can see your next renewal date and manage or cancel auto‑renew in the membership or billing settings. If you cancel before the renewal date, you normally keep your benefits until the current period ends.',
      },
    ],
  },
  {
    id: 'first-aid',
    label: 'First Aid Kit',
    icon: '🆘',
    items: [
      {
        id: 'unsubscribe-email',
        question: 'How can I unsubscribe my email from the mailing list?',
        answer:
          'To unsubscribe, go to your account Settings and open the email notifications section. Use the link there to manage your preferences, uncheck the types of emails you no longer want and click Confirm. You can also open any email from us, scroll to the bottom and click the unsubscribe link. If you later change your mind, you can resubscribe from the popup message or by turning the notifications back on in Settings. Adding our address to your contacts also helps keep wanted emails out of spam.',
      },
      {
        id: 'cant-use-services',
        question: "Why can’t I use your services?",
        answer:
          'If you are unable to use services, first check that your account is verified, that you have enough credits or an active membership, and that there are no restrictions (for example, a block or security hold). Also ensure you are using a supported browser or app version and that your internet connection is stable. If everything looks fine but you still cannot use features, contact support so they can review your account in detail.',
      },
      {
        id: 'disable-video-invites',
        question: 'How can I disable video chat invites?',
        answer:
          'If video chat invites are bothering you, open your Settings or notification preferences and look for options related to video chat or call invitations. Turn off or limit those notifications so that other members cannot invite you to video chat, or you receive fewer prompts.',
      },
      {
        id: 'change-email',
        question: 'How can I change my email?',
        answer:
          'To change your email address, go to Settings and open the section for account or login details. Enter your new email, follow any verification step that is sent to that address, and confirm the change. After that, your future login links and notifications will go to the new email.',
      },
      {
        id: 'block-unblock-member',
        question: 'How can I block/unblock a member?',
        answer:
          'From a member’s profile or chat window you can usually open a menu (for example, “More” or “…”) and choose Block to stop them from contacting you. If you later decide to give them another chance, you can visit your blocked list in Settings and unblock them there. Blocking is a powerful safety tool—use it whenever someone makes you uncomfortable.',
      },
    ],
  },
];

export default function HelpCenterModal({ isOpen, onClose, asPage }) {
  const firstItem = FAQ_SECTIONS[0].items[0];
  const [selected, setSelected] = useState(firstItem);
  useEffect(() => {
    if (!isOpen && !asPage) return;
    if (asPage) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, asPage]);

  if (!isOpen && !asPage) return null;

  const content = (
    <div className="flex flex-col bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[calc(90*var(--vh))]">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
        <h1 className="text-xl font-bold text-gray-900">Answers on the Spot</h1>
        {asPage ? (
          <Link to="/" className="text-sm font-medium text-blue-600 hover:text-blue-800">
            ← Back to Home
          </Link>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition"
            aria-label="Close"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="px-6 pt-4 pb-6 border-b border-gray-100 flex-shrink-0">
        <div className="w-full max-w-xl mx-auto">
          <input
            type="text"
            placeholder="Ask a question..."
            className="w-full rounded-full border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-nex-pink focus:border-nex-pink"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left: question list */}
          <div className="md:col-span-1 space-y-6">
            {FAQ_SECTIONS.map((section) => (
              <div key={section.id}>
                <h2 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-1">
                  <span>{section.icon}</span>
                  <span>{section.label}</span>
                </h2>
                <ul className="space-y-1">
                  {section.items.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => setSelected(item)}
                        className={`text-sm text-left ${
                          selected?.id === item.id
                            ? 'text-nex-pink font-semibold'
                            : 'text-blue-700 hover:underline'
                        }`}
                      >
                        {item.question}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Right: answer panel */}
          <div className="md:col-span-2 border-t md:border-t-0 md:border-l border-gray-200 md:pl-6 pt-4 md:pt-0">
            {selected && (
              <div>
                <h2 className="text-base font-semibold text-gray-900 mb-2">
                  {selected.question}
                </h2>
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {selected.answer}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (asPage) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex justify-center px-4">
        {content}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 px-4">
      {content}
    </div>
  );
}

