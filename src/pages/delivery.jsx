import { Link } from 'react-router-dom'
import { InfoPage } from '../components/ui/InfoPage'

export function DeliveryPage() {
  return (
    <InfoPage title="Delivery Information" subtitle="How we get your phone to you, fast and safe.">
      <h2>Delivery Options</h2>
      <p><strong>Home Delivery:</strong> We deliver all over Bangladesh within 2-5 business days. Shipping fee is ৳60 per order.</p>
      <p><strong>Shop Pickup:</strong> Pick up your phone at our flagship store in Dhaka. Free, ready within 1 hour during store hours.</p>

      <h2>Delivery Coverage</h2>
      <p>We deliver to all 64 districts of Bangladesh through our courier partners. Major cities (Dhaka, Chittagong, Sylhet, Rajshahi, Khulna, Barisal, Rangpur, Mymensingh) typically receive orders within 2-3 days. Other districts take 3-5 days.</p>

      <h2>Order Tracking</h2>
      <p>After you place an order, we'll call you within 1 hour to confirm. Once dispatched, you'll receive a tracking number via SMS. You can also use our <Link to="/track">order tracking</Link> page to check status.</p>

      <h2>Delivery Hours</h2>
      <p>Standard deliveries happen between 10:00 AM and 8:00 PM, seven days a week. For specific time slots, please add a note during checkout.</p>

      <h2>Free Delivery</h2>
      <p>Orders with shop pickup are always free. We also offer free standard delivery on promotional campaigns — watch our <Link to="/deals">deals page</Link>.</p>

      <h2>Need help?</h2>
      <p>Contact us on WhatsApp or call <strong>+880 1700-000000</strong> for any delivery questions.</p>
    </InfoPage>
  )
}
