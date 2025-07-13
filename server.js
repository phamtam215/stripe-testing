// server.js
const express = require('express')
const app = express()
const stripe = require('stripe')('sk_test....') // secret key
const path = require('path')

app.use(express.static('public'))
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
    cancel_url: 'http://localhost:3000/'
  })

  res.json({ id: session.id })
})

app.listen(3000, () => console.log('✅ Server chạy tại http://localhost:3000'))
