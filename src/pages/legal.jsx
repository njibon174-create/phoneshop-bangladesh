import { InfoPage } from '../components/ui/InfoPage'

export const WarrantyPage = () => (
  <InfoPage title="Warranty Policy" subtitle="Every phone comes with official manufacturer warranty.">
    <h2>Standard Warranty</h2>
    <p>All new phones sold on PhoneShop BD include the manufacturer's official warranty — typically 6 or 12 months depending on the brand. The exact warranty period is shown on each product page.</p>

    <h2>What's Covered</h2>
    <ul>
      <li>Manufacturing defects</li>
      <li>Hardware failures under normal use</li>
      <li>Battery defects (within first 6 months)</li>
      <li>Software issues not caused by user modification</li>
    </ul>

    <h2>What's Not Covered</h2>
    <ul>
      <li>Physical damage (drops, water, cracks)</li>
      <li>Cosmetic damage from normal wear</li>
      <li>Damage from unauthorized repair attempts</li>
      <li>Theft or loss</li>
      <li>Software damage caused by user-installed apps</li>
    </ul>

    <h2>How to Claim</h2>
    <p>Bring your phone and original invoice to our Dhaka store. For outside Dhaka, we'll arrange courier pickup. Service takes 7-21 days depending on the brand's authorized service center.</p>

    <h2>Refurbished Phones</h2>
    <p>Refurbished phones come with a 3-month PhoneShop BD warranty covering functional defects. Physical/damage exclusions are the same as new units.</p>
  </InfoPage>
)

export const ReturnsPage = () => (
  <InfoPage title="Return Policy" subtitle="Buy with confidence. Change of mind? We've got you.">
    <h2>7-Day Return</h2>
    <p>If you're not happy with your phone, return it within 7 days of delivery for a full refund. The phone must be unused, in its original packaging, with all accessories included.</p>

    <h2>How to Return</h2>
    <ol>
      <li>Call or WhatsApp us at <strong>+880 1700-000000</strong> within 7 days</li>
      <li>We'll arrange free pickup from your address (Dhaka) or send a courier (outside Dhaka)</li>
      <li>Refund processed within 3-5 business days after we receive the phone</li>
    </ol>

    <h2>Defective on Arrival</h2>
    <p>If your phone is defective or not as described, contact us immediately. We'll replace it or issue a full refund — you don't pay return shipping.</p>

    <h2>Refund Method</h2>
    <p>Refunds go back to the original payment method. Cash on Delivery orders are refunded via bank transfer (bKash/Nagad/bank account).</p>
  </InfoPage>
)

export const PrivacyPage = () => (
  <InfoPage title="Privacy Policy" subtitle="How we handle your data. Last updated: January 2026.">
    <h2>Information We Collect</h2>
    <p>When you place an order, we collect your name, phone number, email (optional), and shipping address. We use this information only to process your order and contact you about delivery.</p>

    <h2>How We Use Your Information</h2>
    <ul>
      <li>Process and deliver your order</li>
      <li>Contact you about your order status</li>
      <li>Send you order-related SMS (no marketing)</li>
      <li>Improve our service based on aggregated (non-personal) usage</li>
    </ul>

    <h2>Data Storage</h2>
    <p>Order data is stored securely in Supabase (PostgreSQL) with industry-standard encryption. We do not sell, rent, or share your data with third parties.</p>

    <h2>Cookies</h2>
    <p>We use localStorage to remember your cart and wishlist. We don't use third-party tracking cookies.</p>

    <h2>Your Rights</h2>
    <p>You can request a copy of your data, ask us to delete it, or correct mistakes. Contact us at <strong>privacy@phoneshop.bd</strong>.</p>
  </InfoPage>
)

export const TermsPage = () => (
  <InfoPage title="Terms of Service" subtitle="By using PhoneShop BD, you agree to these terms.">
    <h2>Acceptance</h2>
    <p>By placing an order on PhoneShop BD, you confirm you are at least 18 years old and legally able to enter into a contract.</p>

    <h2>Pricing</h2>
    <p>All prices are in Bangladeshi Taka (BDT) and inclusive of VAT. We reserve the right to correct pricing errors. If a pricing error is found after you've placed an order, we'll contact you to confirm or issue a full refund.</p>

    <h2>Availability</h2>
    <p>Product availability is shown in real-time. In rare cases where a product goes out of stock after ordering, we'll offer a substitute or full refund.</p>

    <h2>Order Acceptance</h2>
    <p>Your order is confirmed only after we verify payment and contact you via phone. We reserve the right to cancel orders that violate our policies.</p>

    <h2>Limitation of Liability</h2>
    <p>PhoneShop BD is not liable for indirect, incidental, or consequential damages arising from use of products purchased from us.</p>

    <h2>Governing Law</h2>
    <p>These terms are governed by the laws of Bangladesh. Any disputes will be resolved in the courts of Dhaka.</p>
  </InfoPage>
)

export const CareersPage = () => (
  <InfoPage title="Careers" subtitle="Join the team building Bangladesh's favourite phone shop.">
    <h2>Why work with us?</h2>
    <p>We're a small, fast-growing team obsessed with customer trust. We work fast, ship often, and care about details. If you want to build something that helps millions of Bangladeshis buy phones with confidence — you'll fit right in.</p>

    <h2>Open positions</h2>
    <p>We don't have any open positions right now, but we're always interested in hearing from great people. Send your CV to <strong>careers@phoneshop.bd</strong> with the role you're interested in.</p>

    <h2>What we offer</h2>
    <ul>
      <li>Competitive salary</li>
      <li>Two annual festivals bonuses</li>
      <li>Phone purchase discount for employees</li>
      <li>Flexible hours</li>
      <li>Quarterly team retreats</li>
    </ul>
  </InfoPage>
)
