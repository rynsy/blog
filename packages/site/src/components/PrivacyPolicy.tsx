/**
 * Privacy Policy Component
 * Comprehensive privacy policy for analytics and data collection
 */

import React from 'react'
import { useTheme } from '../contexts/ThemeContext'

interface PrivacyPolicyProps {
  className?: string
  embedded?: boolean
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({
  className = '',
  embedded = false
}) => {
  const { theme } = useTheme()

  const sectionClasses = embedded 
    ? "mb-6"
    : "mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"

  const headingClasses = embedded
    ? "text-xl font-semibold text-gray-900 dark:text-white mb-3"
    : "text-2xl font-semibold text-gray-900 dark:text-white mb-4"

  return (
    <div className={`max-w-4xl mx-auto ${embedded ? '' : 'p-6'} ${className}`}>
      {!embedded && (
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Privacy Policy</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Last updated: {new Date().toLocaleDateString()}
          </p>
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-800 dark:text-green-200 text-sm font-medium">
              🛡️ This site implements privacy-first analytics with no personal data collection
            </p>
          </div>
        </div>
      )}

      {/* Overview */}
      <section className={sectionClasses}>
        <h2 className={headingClasses}>Privacy-First Approach</h2>
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            This website implements a privacy-first approach to analytics and user experience optimization. 
            We collect minimal, anonymized data solely to improve site functionality and user experience.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
              <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">✓ What We Do</h4>
              <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                <li>• Anonymous usage analytics</li>
                <li>• Local data storage when possible</li>
                <li>• Granular consent controls</li>
                <li>• Automatic data expiration</li>
                <li>• No third-party tracking</li>
              </ul>
            </div>
            
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-700">
              <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">✗ What We Don't Do</h4>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                <li>• Collect personal information</li>
                <li>• Store IP addresses</li>
                <li>• Track across websites</li>
                <li>• Sell or share data</li>
                <li>• Use invasive cookies</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Data Collection */}
      <section className={sectionClasses}>
        <h2 className={headingClasses}>What Information We Collect</h2>
        <div className="space-y-4">
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Analytics Data (Optional)</h4>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
              Only collected with your explicit consent through our consent banner:
            </p>
            <ul className="text-gray-600 dark:text-gray-300 text-sm space-y-1 ml-4">
              <li>• Page views and navigation patterns (anonymized)</li>
              <li>• Interactive background module usage</li>
              <li>• Easter egg discovery events (no personal patterns)</li>
              <li>• Performance metrics (device-type only)</li>
              <li>• Accessibility feature usage</li>
            </ul>
          </div>

          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Technical Data (Essential)</h4>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
              Required for website functionality:
            </p>
            <ul className="text-gray-600 dark:text-gray-300 text-sm space-y-1 ml-4">
              <li>• Browser type and version (for compatibility)</li>
              <li>• Device type (mobile/desktop for responsive design)</li>
              <li>• Screen resolution (for optimal display)</li>
              <li>• Theme preference (stored locally)</li>
            </ul>
          </div>

          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Data We Never Collect</h4>
            <ul className="text-red-600 dark:text-red-400 text-sm space-y-1 ml-4">
              <li>• Personal identifiable information (name, email, address)</li>
              <li>• IP addresses or location data</li>
              <li>• Keystroke patterns or detailed user input</li>
              <li>• Cross-site tracking identifiers</li>
              <li>• Biometric or sensitive personal data</li>
            </ul>
          </div>
        </div>
      </section>

      {/* How We Use Data */}
      <section className={sectionClasses}>
        <h2 className={headingClasses}>How We Use Your Information</h2>
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Website Improvement</h4>
            <ul className="text-blue-700 dark:text-blue-300 text-sm space-y-1">
              <li>• Understanding which background modules are most popular</li>
              <li>• Optimizing performance based on device capabilities</li>
              <li>• Improving accessibility features based on usage patterns</li>
              <li>• Enhancing easter egg discovery mechanisms</li>
            </ul>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
            <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">Performance Optimization</h4>
            <ul className="text-purple-700 dark:text-purple-300 text-sm space-y-1">
              <li>• Identifying performance bottlenecks</li>
              <li>• Adjusting quality settings based on device performance</li>
              <li>• Monitoring memory usage and optimization opportunities</li>
              <li>• Balancing visual quality with system performance</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Legal Basis */}
      <section className={sectionClasses}>
        <h2 className={headingClasses}>Legal Basis for Processing</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-green-500 pl-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Consent (GDPR Article 6(1)(a))</h4>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Analytics and performance data is processed based on your explicit consent, 
              which you can withdraw at any time through the privacy settings.
            </p>
          </div>

          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Legitimate Interest (GDPR Article 6(1)(f))</h4>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Essential technical data is processed based on legitimate interest to 
              provide core website functionality and ensure security.
            </p>
          </div>
        </div>
      </section>

      {/* Data Sharing */}
      <section className={sectionClasses}>
        <h2 className={headingClasses}>Data Sharing and Third Parties</h2>
        <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-700">
          <h3 className="font-semibold text-green-800 dark:text-green-200 mb-4">No Data Sharing Policy</h3>
          <p className="text-green-700 dark:text-green-300 mb-4">
            We do not share, sell, or provide your data to third parties for marketing, 
            advertising, or any other purposes.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Analytics Service</h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                We use Umami Analytics, a privacy-focused analytics service that:
              </p>
              <ul className="text-sm text-green-700 dark:text-green-300 mt-2 space-y-1">
                <li>• Operates cookieless</li>
                <li>• Anonymizes all data</li>
                <li>• Stores data in EU (GDPR compliant)</li>
                <li>• No cross-site tracking</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Legal Requirements</h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                We may disclose information only when required by law, but given our 
                minimal data collection, there is virtually nothing to disclose.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Data Retention */}
      <section className={sectionClasses}>
        <h2 className={headingClasses}>Data Retention</h2>
        <div className="space-y-4">
          <table className="w-full border border-gray-200 dark:border-gray-600 rounded-lg">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100">Data Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100">Retention Period</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100">Automatic Deletion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              <tr>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">Analytics events</td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">1 year</td>
                <td className="px-4 py-3 text-sm text-green-600 dark:text-green-400">✓ Yes</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">Consent preferences</td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">1 year</td>
                <td className="px-4 py-3 text-sm text-green-600 dark:text-green-400">✓ Yes</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">Performance data</td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">30 days</td>
                <td className="px-4 py-3 text-sm text-green-600 dark:text-green-400">✓ Yes</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">Local preferences</td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">Until browser data cleared</td>
                <td className="px-4 py-3 text-sm text-blue-600 dark:text-blue-400">User controlled</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Your Rights */}
      <section className={sectionClasses}>
        <h2 className={headingClasses}>Your Privacy Rights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* GDPR Rights */}
          <div className="border border-blue-200 dark:border-blue-600 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">🇪🇺 GDPR Rights (EU Users)</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                <span className="text-gray-600 dark:text-gray-300">
                  <strong>Right to Access:</strong> Request a copy of your data
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                <span className="text-gray-600 dark:text-gray-300">
                  <strong>Right to Rectification:</strong> Correct inaccurate data
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                <span className="text-gray-600 dark:text-gray-300">
                  <strong>Right to Erasure:</strong> Delete your data
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                <span className="text-gray-600 dark:text-gray-300">
                  <strong>Right to Portability:</strong> Export your data
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                <span className="text-gray-600 dark:text-gray-300">
                  <strong>Right to Object:</strong> Opt out of processing
                </span>
              </li>
            </ul>
          </div>

          {/* CCPA Rights */}
          <div className="border border-purple-200 dark:border-purple-600 rounded-lg p-4">
            <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-3">🇺🇸 CCPA Rights (CA Users)</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="text-purple-600 dark:text-purple-400 mr-2">•</span>
                <span className="text-gray-600 dark:text-gray-300">
                  <strong>Right to Know:</strong> What data we collect and why
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 dark:text-purple-400 mr-2">•</span>
                <span className="text-gray-600 dark:text-gray-300">
                  <strong>Right to Delete:</strong> Request data deletion
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 dark:text-purple-400 mr-2">•</span>
                <span className="text-gray-600 dark:text-gray-300">
                  <strong>Right to Opt-Out:</strong> No data sale (we don't sell)
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 dark:text-purple-400 mr-2">•</span>
                <span className="text-gray-600 dark:text-gray-300">
                  <strong>Non-Discrimination:</strong> Equal service regardless
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">How to Exercise Your Rights</h4>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            You can exercise most rights directly through our privacy controls on this page. 
            For additional requests or questions, contact us through the information below.
          </p>
        </div>
      </section>

      {/* Contact */}
      <section className={sectionClasses}>
        <h2 className={headingClasses}>Contact Information</h2>
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Privacy Questions or Concerns?</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">Data Controller</h5>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                This website owner<br/>
                Location: As specified in site contact information
              </p>
            </div>
            <div>
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">Privacy Contact</h5>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Email: Contact through site's contact form<br/>
                Response time: Within 30 days (GDPR compliance)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Updates */}
      <section className={sectionClasses}>
        <h2 className={headingClasses}>Policy Updates</h2>
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            We may update this privacy policy from time to time. When we do, we will:
          </p>
          <ul className="text-gray-600 dark:text-gray-300 space-y-2 ml-6">
            <li>• Post the updated policy on this page</li>
            <li>• Update the "Last updated" date at the top</li>
            <li>• Notify users of significant changes through the consent banner</li>
            <li>• Request renewed consent if the changes affect data processing</li>
          </ul>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              <strong>Version History:</strong> This is version 1.0 of our privacy policy, 
              effective from the date shown above.
            </p>
          </div>
        </div>
      </section>

      {!embedded && (
        <div className="text-center py-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            This privacy policy is designed to be transparent, comprehensive, and user-friendly. 
            If you have any questions or suggestions for improvement, please don't hesitate to reach out.
          </p>
        </div>
      )}
    </div>
  )
}

export default PrivacyPolicy