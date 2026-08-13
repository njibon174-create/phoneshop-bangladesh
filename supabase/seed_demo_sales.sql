-- ===================================================================
-- Demo Sales Data — 3 months of transactions
-- ===================================================================
-- Mix of:
--   • Cash sales (75%) — full payment received
--   • Baki sales (25%) — credit, partial payments
--   • Some returns and cancellations
-- ===================================================================

DO $$
DECLARE
  -- Counter for order numbers
  seq int := 0;
  day_offset int;
  order_count int;
  customer_names text[] := ARRAY[
    'Rahim Khan', 'Karim Mia', 'Jamal Hossain', 'Faruk Ahmed', 'Shahin Alam',
    'Nazmul Islam', 'Rafiq Mia', 'Jahangir Alam', 'Sumon Mia', 'Ripon Mia',
    'Tania Akter', 'Sumaiya Khatun', 'Rima Begum', 'Tasnim Akter', 'Mst. Nasreen',
    'Md. Asif', 'Md. Imran', 'Md. Sohel', 'Md. Tareq', 'Md. Shamim',
    'Mohammad Ali', 'Mohammad Yousuf', 'Mohammad Salam', 'Mohammad Rubel', 'Mohammad Tuhin'
  ];
  -- Pick phones by index
  phone_record record;
  sell_price numeric;
  buy_price numeric;
  customer_name text;
  customer_phone text;
  payment_type text;
  status text;
  is_baki boolean;
  i int;
BEGIN
  -- Iterate over each phone in inventory
  FOR phone_record IN
    SELECT id, brand, model, variant, buy_price, mrp
    FROM public.phones
    WHERE status = 'in_stock'
    ORDER BY created_at
  LOOP
    -- Each phone becomes a "sale event" 0-90 days ago with random probability
    -- Skip ~30% of phones (still in inventory)
    IF random() < 0.30 THEN
      CONTINUE;
    END IF;

    -- Pick a random day offset (0-90 days ago)
    day_offset := floor(random() * 90)::int;
    -- 70% of sales happen during business hours
    seq := seq + 1;
    customer_name := customer_names[1 + floor(random() * array_length(customer_names, 1))::int];
    customer_phone := '+880 17' || (10000000 + floor(random() * 89999999)::int)::text;

    -- 75% cash, 25% baki
    is_baki := random() < 0.25;
    payment_type := CASE WHEN is_baki THEN 'baki' ELSE 'cash' END;

    -- Sell at mrp or slightly discounted
    sell_price := phone_record.mrp * (0.92 + random() * 0.10);

    -- Insert sale
    INSERT INTO public.sales (
      phone_id, sell_price, payment_type, buyer_name, buyer_phone,
      status, sale_date, cost_price, net_profit, created_at
    ) VALUES (
      phone_record.id, sell_price, payment_type,
      CASE WHEN is_baki THEN customer_name ELSE NULL END,
      CASE WHEN is_baki THEN customer_phone ELSE NULL END,
      'completed',
      (CURRENT_DATE - day_offset)::text,
      phone_record.buy_price,
      sell_price - phone_record.buy_price,
      (CURRENT_TIMESTAMP - (day_offset || ' days')::interval - (floor(random() * 8)::int || ' hours')::interval)
    );

    -- Update phone to 'sold' status
    UPDATE public.phones SET status = 'sold' WHERE id = phone_record.id;

    -- Insert cash transaction if cash sale
    IF NOT is_baki THEN
      INSERT INTO public.cash_transactions (type, amount, note, transaction_date, created_at)
      VALUES (
        'sale_cash',
        sell_price,
        'Cash sale: ' || phone_record.brand || ' ' || phone_record.model,
        (CURRENT_DATE - day_offset)::text,
        (CURRENT_TIMESTAMP - (day_offset || ' days')::interval - (floor(random() * 8)::int || ' hours')::interval)
      );
    END IF;

  END LOOP;

  -- Create baki ledger entries for baki sales (60% of baki sales have some payment)
  FOR phone_record IN
    SELECT s.id, s.phone_id, s.sell_price, s.buyer_name, s.buyer_phone, s.sale_date, s.created_at
    FROM public.sales s
    WHERE s.payment_type = 'baki' AND s.status = 'completed'
  LOOP
    -- Create credit record
    INSERT INTO public.credits (sale_id, total_due, paid_amount, remaining, status, created_at, updated_at)
    VALUES (
      phone_record.id,
      phone_record.sell_price,
      0,
      phone_record.sell_price,
      'pending',
      phone_record.created_at,
      phone_record.created_at
    )
    RETURNING id INTO i;

    -- 60% of baki sales have a partial payment
    IF random() < 0.6 THEN
      INSERT INTO public.credit_payments (credit_id, amount, paid_at, note, created_at)
      VALUES (
        i,
        phone_record.sell_price * (0.2 + random() * 0.6),
        phone_record.created_at + (floor(random() * 20)::int || ' days')::interval,
        'Partial payment received',
        phone_record.created_at + (floor(random() * 20)::int || ' days')::interval
      );
    END IF;
  END LOOP;

END $$;

-- === Cash Book Entries ===
-- Manual entries: investments, withdrawals, expenses
INSERT INTO public.cash_transactions (type, amount, note, transaction_date, created_at) VALUES
  -- Owner investments (start of each month)
  ('investment', 500000, 'Monthly business capital', (CURRENT_DATE - INTERVAL '90 days')::text, CURRENT_TIMESTAMP - INTERVAL '90 days'),
  ('investment', 500000, 'Monthly business capital', (CURRENT_DATE - INTERVAL '60 days')::text, CURRENT_TIMESTAMP - INTERVAL '60 days'),
  ('investment', 500000, 'Monthly business capital', (CURRENT_DATE - INTERVAL '30 days')::text, CURRENT_TIMESTAMP - INTERVAL '30 days'),
  -- Shop expenses
  ('expense', 25000, 'Shop rent - month 1', (CURRENT_DATE - INTERVAL '88 days')::text, CURRENT_TIMESTAMP - INTERVAL '88 days'),
  ('expense', 25000, 'Shop rent - month 2', (CURRENT_DATE - INTERVAL '58 days')::text, CURRENT_TIMESTAMP - INTERVAL '58 days'),
  ('expense', 25000, 'Shop rent - month 3', (CURRENT_DATE - INTERVAL '28 days')::text, CURRENT_TIMESTAMP - INTERVAL '28 days'),
  ('expense', 8000, 'Internet & utilities - month 1', (CURRENT_DATE - INTERVAL '85 days')::text, CURRENT_TIMESTAMP - INTERVAL '85 days'),
  ('expense', 8000, 'Internet & utilities - month 2', (CURRENT_DATE - INTERVAL '55 days')::text, CURRENT_TIMESTAMP - INTERVAL '55 days'),
  ('expense', 8000, 'Internet & utilities - month 3', (CURRENT_DATE - INTERVAL '25 days')::text, CURRENT_TIMESTAMP - INTERVAL '25 days'),
  ('expense', 3500, 'Marketing - Facebook ads', (CURRENT_DATE - INTERVAL '70 days')::text, CURRENT_TIMESTAMP - INTERVAL '70 days'),
  ('expense', 3500, 'Marketing - Facebook ads', (CURRENT_DATE - INTERVAL '40 days')::text, CURRENT_TIMESTAMP - INTERVAL '40 days'),
  ('expense', 3500, 'Marketing - Facebook ads', (CURRENT_DATE - INTERVAL '15 days')::text, CURRENT_TIMESTAMP - INTERVAL '15 days'),
  -- Withdrawals
  ('withdrawal', 30000, 'Personal withdrawal', (CURRENT_DATE - INTERVAL '80 days')::text, CURRENT_TIMESTAMP - INTERVAL '80 days'),
  ('withdrawal', 25000, 'Personal withdrawal', (CURRENT_DATE - INTERVAL '50 days')::text, CURRENT_TIMESTAMP - INTERVAL '50 days'),
  ('withdrawal', 35000, 'Personal withdrawal', (CURRENT_DATE - INTERVAL '20 days')::text, CURRENT_TIMESTAMP - INTERVAL '20 days'),
  ('expense', 1200, 'Shipping supplies', (CURRENT_DATE - INTERVAL '45 days')::text, CURRENT_TIMESTAMP - INTERVAL '45 days'),
  ('expense', 15000, 'New display cabinets', (CURRENT_DATE - INTERVAL '20 days')::text, CURRENT_TIMESTAMP - INTERVAL '20 days'),
  ('expense', 5000, 'Packaging materials', (CURRENT_DATE - INTERVAL '10 days')::text, CURRENT_TIMESTAMP - INTERVAL '10 days'),
  ('expense', 12000, 'Staff bonus', (CURRENT_DATE - INTERVAL '5 days')::text, CURRENT_TIMESTAMP - INTERVAL '5 days');

-- === Online Orders — front shop ===
-- Generate a handful of orders through the front shop
DO $$
DECLARE
  customer_names text[] := ARRAY[
    'Md. Kamal', 'Ayesha Begum', 'Jasim Uddin', 'Rezaul Karim',
    'Mahmud Hasan', 'Sabina Yasmin', 'Imran Hossain'
  ];
  customer_phones text[] := ARRAY[
    '+880 1711123456', '+880 1811234567', '+880 1911345678',
    '+880 1711456789', '+880 1811567890', '+880 1911678901', '+880 1711789012'
  ];
  cities text[] := ARRAY['Dhaka', 'Chattogram', 'Sylhet', 'Rajshahi', 'Khulna'];
  thanas text[] := ARRAY['Dhanmondi', 'Gulshan', 'Banani', 'Uttara', 'Mirpur', 'Mohammadpur'];
  i int;
  order_idx int;
  day_off int;
  total_count int := 12;
BEGIN
  FOR i IN 1..total_count LOOP
    day_off := floor(random() * 75)::int;
    INSERT INTO public.orders (
      order_number, customer_name, customer_phone, customer_email,
      shipping_address, shipping_city, shipping_thana, shipping_postcode, shipping_notes,
      subtotal_bdt, shipping_bdt, total_bdt,
      payment_method, payment_status, payment_ref,
      delivery_method, order_status, created_at, updated_at
    ) VALUES (
      'BD-' || to_char(CURRENT_DATE - day_off, 'YYYYMMDD') || '-' || LPAD(i::text, 4, '0'),
      customer_names[1 + floor(random() * array_length(customer_names, 1))::int],
      customer_phones[1 + floor(random() * array_length(customer_phones, 1))::int],
      'customer' || i || '@example.com',
      'House ' || (10 + i) || ', Road ' || (5 + i) || ', Block B',
      cities[1 + floor(random() * array_length(cities, 1))::int],
      thanas[1 + floor(random() * array_length(thanas, 1))::int],
      (1200 + i * 7)::text,
      CASE WHEN i % 3 = 0 THEN 'Please call before delivery' ELSE NULL END,
      35000 + (random() * 100000)::int,
      60,
      35060 + (random() * 100000)::int,
      'cod',
      CASE WHEN i % 4 = 0 THEN 'paid' ELSE 'pending' END,
      NULL,
      CASE WHEN i % 5 = 0 THEN 'pickup' ELSE 'home' END,
      CASE WHEN i % 4 = 0 THEN 'delivered' WHEN i % 3 = 0 THEN 'shipped' WHEN i % 5 = 0 THEN 'processing' ELSE 'pending' END,
      CURRENT_TIMESTAMP - (day_off || ' days')::interval - (floor(random() * 10)::int || ' hours')::interval,
      CURRENT_TIMESTAMP - (day_off || ' days')::interval
    );
  END LOOP;
END $$;

-- Verification: show summary
SELECT
  (SELECT COUNT(*) FROM public.brands) as total_brands,
  (SELECT COUNT(*) FROM public.phones) as total_phones,
  (SELECT COUNT(*) FROM public.phones WHERE status = 'in_stock') as in_stock,
  (SELECT COUNT(*) FROM public.phones WHERE status = 'sold') as sold,
  (SELECT COUNT(*) FROM public.sales) as total_sales,
  (SELECT COUNT(*) FROM public.sales WHERE payment_type = 'baki') as baki_sales,
  (SELECT COUNT(*) FROM public.credits) as total_credits,
  (SELECT COUNT(*) FROM public.credit_payments) as total_credit_payments,
  (SELECT COUNT(*) FROM public.cash_transactions) as cash_transactions,
  (SELECT COUNT(*) FROM public.orders) as total_orders,
  (SELECT COALESCE(SUM(sell_price), 0) FROM public.sales) as total_revenue;
