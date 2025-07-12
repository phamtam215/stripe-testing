const express = require('express')
const app = express()
const stripe = require('stripe')('sk_test.....')
const bodyParser = require('body-parser')
const endpointSecret = 'whsec_.....' // 🔐 Webhook secret

// ✅ 1. Static files
app.use(express.static('public'))

// ✅ 2. Webhook phải đặt TRƯỚC express.json()
app.post(
  '/webhook',
  bodyParser.raw({ type: 'application/json' }),
  (req, res) => {
    const sig = req.headers['stripe-signature']
    let event

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
    } catch (err) {
      console.log(`⚠️ Webhook signature verification failed.`, err.message)
      return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    console.log(`📦 Event received: ${event.type}`)
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      console.log('✅ Thanh toán thành công:', session)
    }

    res.status(200).send('Received')
  }
)

// ✅ 3. Sau đó mới đến express.json() cho các route khác
app.use(express.json())

app.post('/create-checkout-session', async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: 'Gói nâng cấp ảnh' },
          unit_amount: 1000
        },
        quantity: 1
      }
    ],
    success_url: 'http://localhost:3000/success.html',
    cancel_url: 'http://localhost:3000/cancel.html'
  })

  res.json({ url: session.url })
})

app.listen(3000, () => console.log('✅ Server chạy tại http://localhost:3000'))
