import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function MatureHero() {
  return (
    <section className="bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16 grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-8 lg:gap-12 items-center">
        {/* Left card */}
        <div className="max-w-md w-full mx-auto lg:mx-0">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-5 sm:p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <Logo className="h-7 sm:h-8 w-auto" />
              <span className="inline-flex items-center rounded-full bg-red-50 text-red-600 px-3 py-1 text-xs font-semibold">
                Mature Online Dating
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 leading-tight">
              Global Online Dating for Mature Singles
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mb-5">
              Meet like‑minded singles 35+ from around the world, enjoy relaxed conversations, and
              build meaningful connections at your own pace.
            </p>

            <Link
              to="/signup-email"
              className="block w-full text-center py-3 rounded-xl text-white text-base font-semibold mb-3 hover:opacity-90 transition"
              style={{
                background: 'linear-gradient(to right, #5A2D8A, #B5458F, #E97672)',
              }}
            >
              Start for free
            </Link>

            <p className="text-[11px] text-gray-500 leading-relaxed">
              By clicking &quot;Start for free&quot; you agree to our Terms &amp; Conditions,
              Privacy Policy, and Refund Policy. You can cancel your membership or delete your
              profile at any time.
            </p>
          </div>
        </div>

        {/* Right image */}
        <div className="relative w-full max-w-xl mx-auto lg:mx-0">
          <div className="rounded-3xl overflow-hidden shadow-xl">
            <img
              src="/matureHero.png"
              alt="Happy mature woman using dating app on sofa"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

