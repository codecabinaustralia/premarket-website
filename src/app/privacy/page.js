'use client';

import Link from 'next/link';
import FooterLarge from '../components/FooterLarge';
import Nav from '../components/Nav';

export default function PrivacyPolicy() {
  return (
    <div>
    <Nav />
    <div className="max-w-4xl mx-auto px-4 py-10 text-gray-900">
      <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
      <p className="mb-4">Effective Date: July 21, 2025</p>

      <p className="mb-6">
        This Privacy Policy describes how Premarket Australia (“we”, “our”, “us”) collects, uses,
        and shares your personal information when you use our website located at{' '}
        <Link href="https://www.premarket.homes" className="text-blue-600 underline">
          www.premarket.homes
        </Link>{' '}
        (the “Site”) or any of our services.
      </p>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">1. Data Collection</h2>
        <p>
          We collect data you provide when registering, submitting property details, communicating
          with buyers/sellers, uploading media, and interacting with our platform. This includes:
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>Personal identification details</li>
          <li>Property information and preferences</li>
          <li>Uploaded images, videos, and documents</li>
          <li>Communication and behavioral data</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">2. How We Use Your Data</h2>
        <p>We may use the collected data for the following purposes:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>Operating and improving our services</li>
          <li>Matching buyers and sellers</li>
          <li>Personalizing user experiences</li>
          <li>Marketing and analytics purposes</li>
          <li>Communication and support</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">3. Data Sharing</h2>
        <p>
          We may share data with Premarket Australia partners and third-party service providers for
          operational, support, marketing, or legal purposes. By using our platform, you consent to
          this data sharing.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">4. User Rights</h2>
        <p>You have the right to:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>Request access to your data</li>
          <li>Request deletion or correction of your data</li>
          <li>Withdraw consent at any time</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">5. Security Measures</h2>
        <p>
          We work toward industry-standard security practices to protect your data. However, no
          method of transmission or storage is 100% secure. Any security-related issues will be
          reviewed and rectified as quickly as possible.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">6. Email Communication & Anti-Spam</h2>
        <p>
          We comply with all relevant email marketing laws including the Australian Spam Act. You
          may opt out of marketing communications at any time via the unsubscribe link.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">7. Media and Content Rights</h2>
        <p>
          By uploading images, documents, or media, you confirm you have the rights or permission to
          share them. We reserve the right to use this content for marketing, analytics, or other
          purposes at our sole discretion.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">8. Scraping & Unauthorized Use</h2>
        <p>
          We do not authorize the scraping, harvesting, or unauthorized reuse of our content or user
          data. While we implement anti-crawling protections, we are not liable for any illegal
          activity by third parties beyond our control.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">9. Cookies & Analytics</h2>
        <p>
          We may use cookies and analytics tools (like Google Analytics) to understand usage
          patterns and improve performance. You can control cookie settings in your browser.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">10. Changes to This Policy</h2>
        <p>
          This Privacy Policy may be updated from time to time. All changes will be posted here. By
          continuing to use our services, you agree to the latest version of this policy.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">11. Contact Us</h2>
        <p>
          For questions or concerns, please contact us at:{' '}
          <a href="mailto:knockknock@premarket.homes" className="text-blue-600 underline">
            knockknock@premarket.homes
          </a>
        </p>
      </section>

      <p className="mt-10 text-sm text-gray-500">
        This policy works in conjunction with our{' '}
        <Link href="/terms" className="underline text-blue-600">
          Terms and Conditions
        </Link>
        .
      </p>
    </div>
    <FooterLarge />
    </div>
  );
}
