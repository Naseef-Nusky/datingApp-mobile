import { Link } from 'react-router-dom';

export default function Contact() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">Contact Us</h1>
            <Link to="/" className="text-sm font-medium text-blue-600 hover:text-blue-800">← Back to Home</Link>
          </div>
          <div className="px-6 py-8 text-gray-800 text-sm leading-relaxed space-y-6">
            <p>
              We&apos;re here to help. If you have questions, feedback, or need assistance with your Vantage Dating account, please email us.
            </p>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Company</h3>
              <p className="text-gray-600">Company details available on request.</p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Customer Support</h3>
              <p className="font-semibold">
                <a
                  href="mailto:support@vantagedating.com"
                  className="text-blue-600 hover:underline font-semibold"
                >
                  support@vantagedating.com
                </a>
              </p>
            </div>
            <p className="text-gray-600">
              For account-related issues, refund requests, or policy questions, please refer to our{' '}
              <Link to="/terms" className="text-blue-600 hover:underline">Terms & Conditions</Link>,{' '}
              <Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>, and{' '}
              <Link to="/refund" className="text-blue-600 hover:underline">Refund and Cancellation Policy</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
