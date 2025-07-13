// === Dự án Subscription cơ bản Stripe (Node.js + HTML) ===
// === server.js ===
require('dotenv').config() // ✅ Load biến môi trường từ .env
const express = require('express')
const app = express()
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY) // 🔐 Thay bằng secret key
const bodyParser = require('body-parser')
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET // Thay bằng webhook signing secret

app.use(express.static('public'))

// ⚠️ Dùng raw body riêng cho webhook
app.post(
  '/webhook',
  bodyParser.raw({ type: 'application/json' }),
  (req, res) => {
    const sig = req.headers['stripe-signature']
    let event

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
    } catch (err) {
      console.log(`⚠️ Webhook verification failed.`, err.message)
      return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    // ✅ Xử lý event subscription
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      console.log('✅ Subscription checkout completed:', session)
    }

    if (event.type === 'invoice.paid') {
      const invoice = event.data.object
      console.log('💰 Subscription renewed:', invoice)
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object
      console.log('❌ Subscription canceled:', subscription)
    }

    res.status(200).send('Webhook received')
  }
)

app.use(express.json())

// ✅ Route để tạo checkout session cho subscription
app.post('/create-subscription-session', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID_20, // 🔁 Thay bằng Prod ID tạo sẵn trên Stripe Dashboard
          quantity: 1
        }
      ],
      success_url:
        'http://localhost:3000/success.html?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:3000/cancel.html'
    })

    console.log('✅ Created subscription session:', session.id)

    res.json({ id: session.id })
  } catch (err) {
    console.error('❌ Error creating subscription session:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.listen(3000, () =>
  console.log('🚀 Server listening at http://localhost:3000')
)
