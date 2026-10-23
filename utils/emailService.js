import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    }
})

transporter.verify((error) => {
    if (error) console.log('SMTP connection failed:', error.message)
    else console.log('SMTP ready — emails will send from', process.env.EMAIL_USER)
})

const baseTemplate = (content) => `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<style>
body{margin:0;padding:0;background:#0a0a0f;font-family:Georgia,serif;}
.wrap{max-width:600px;margin:0 auto;background:#0a0a0f;}
.header{background:linear-gradient(135deg,#12121a 0%,#1a1a2e 100%);padding:32px 40px;text-align:center;border-bottom:1px solid rgba(201,168,76,0.3);}
.logo{font-size:32px;font-weight:bold;color:#c9a84c;letter-spacing:6px;}
.tagline{color:rgba(201,168,76,0.5);font-size:10px;letter-spacing:4px;text-transform:uppercase;margin-top:4px;}
.body{padding:40px;}
.gold{color:#c9a84c;}
.text{color:rgba(255,255,255,0.7);font-size:15px;line-height:1.8;margin:0 0 12px;}
.text-muted{color:rgba(255,255,255,0.35);font-size:13px;line-height:1.7;margin:4px 0;}
.btn{display:inline-block;background:#c9a84c;color:#0a0a0f;padding:14px 36px;border-radius:50px;text-decoration:none;font-size:13px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;margin:24px 0;}
.divider{height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,0.4),transparent);margin:28px 0;}
.card{background:rgba(255,255,255,0.03);border:1px solid rgba(201,168,76,0.15);border-radius:16px;padding:20px 24px;margin:16px 0;}
.status-badge{display:inline-block;padding:6px 16px;border-radius:50px;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;}
.footer{background:#050508;padding:28px 40px;text-align:center;border-top:1px solid rgba(201,168,76,0.1);}
.footer-text{color:rgba(255,255,255,0.2);font-size:11px;line-height:1.8;}
.footer-link{color:rgba(201,168,76,0.5);text-decoration:none;}
h1{color:#ffffff;font-size:26px;font-weight:300;margin:0 0 8px;}
h2{color:#c9a84c;font-size:18px;font-weight:400;margin:0 0 16px;}
table{width:100%;border-collapse:collapse;}
td{padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;}
td.label{color:rgba(255,255,255,0.3);width:45%;}
td.value{color:rgba(255,255,255,0.8);font-weight:500;}
</style>
</head>
<body>
<div class="wrap">
<div class="header">
<div class="logo">VIBECULTURE</div>
<div class="tagline">Premium Clothing Store</div>
</div>
<div class="body">${content}</div>
<div class="footer">
<p class="footer-text">
&copy; 2025 VIBECULTURE. All rights reserved.<br/>
<a href="https://www.VIBECULTURE.store" class="footer-link">www.VIBECULTURE.store</a> &nbsp;&bull;&nbsp;
<a href="mailto:support@VIBECULTURE.store" class="footer-link">support@VIBECULTURE.store</a> &nbsp;&bull;&nbsp;
+91-1294044211
</p>
<p class="footer-text" style="margin-top:8px;">Faridabad, Haryana, India 121001</p>
</div>
</div>
</body>
</html>`

const send = (to, subject, html) => transporter.sendMail({
    from: `"VIBECULTURE" <${process.env.EMAIL_USER}>`,
    to, subject, html
})

// Welcome / Onboarding
export const sendWelcomeEmail = (email, name) => send(
    email,
    `Welcome to VIBECULTURE, ${name}! Your account is ready`,
    baseTemplate(`
        <h1>Welcome, ${name}! &#10022;</h1>
        <h2>Your VIBECULTURE account is ready.</h2>
        <p class="text">We are thrilled to have you. VIBECULTURE is your one-stop destination for premium kitchen utensils, pure dry fruits, hand-picked spices, and so much more delivered fresh across India.</p>
        <div class="divider"></div>
        <div class="card">
          <h2 style="margin-bottom:12px;">What is waiting for you</h2>
          <p class="text-muted">&#128084; &nbsp;Premium Clothing and Apparel</p>
          <p class="text-muted">&#128081; &nbsp;Exclusive Fashion Collections</p>
          <p class="text-muted">&#127775; &nbsp;Curated Styles for every occasion</p>
          <p class="text-muted">&#127873; &nbsp;Special Gifts and Bundles</p>
          <p class="text-muted">&#9889; &nbsp;Flash deals and exclusive member offers</p>
        </div>
        <div style="text-align:center;">
          <a href="https://www.VIBECULTURE.store/collection" class="btn">Start Shopping</a>
        </div>
        <div class="divider"></div>
        <p class="text-muted">Need help? Reply to this email or reach us at <a href="mailto:support@VIBECULTURE.store" style="color:#c9a84c;">support@VIBECULTURE.store</a>. We are available 24/7.</p>
    `)
)

// Order Confirmed
export const sendOrderConfirmationEmail = (email, name, order) => {
    const itemRows = order.items.map(item =>
        `<tr><td class="label">${item.name}</td><td class="value">Qty: ${item.quantity} &nbsp;&bull;&nbsp; Rs.${item.price}</td></tr>`
    ).join('')

    return send(
        email,
        `Order Confirmed #${order._id.toString().slice(-6).toUpperCase()} - VIBECULTURE`,
        baseTemplate(`
            <h1>Order Confirmed!</h1>
            <h2>Thank you, ${name}.</h2>
            <p class="text">Your order has been placed successfully. We will notify you as soon as it is packed and shipped.</p>
            <div class="divider"></div>
            <div class="card">
              <h2>Order Summary</h2>
              <table>
                ${itemRows}
                <tr><td class="label">Delivery Charge</td><td class="value">Rs.50</td></tr>
                <tr><td class="label" style="color:#c9a84c;font-weight:bold;">Total</td><td class="value" style="color:#c9a84c;font-weight:bold;">Rs.${order.amount}</td></tr>
              </table>
            </div>
            <div class="card">
              <h2>Delivery Address</h2>
              <p class="text-muted">${order.address.firstName} ${order.address.lastName}<br/>
              ${order.address.street}, ${order.address.city}<br/>
              ${order.address.state} - ${order.address.zipcode}<br/>
              Phone: ${order.address.phone}</p>
            </div>
            <div style="text-align:center;">
              <a href="https://www.VIBECULTURE.store/orders" class="btn">Track My Order</a>
            </div>
        `)
    )
}

// Order Status Update
const STATUS_CONFIG = {
    'Order Placed':     { color: '#3b82f6', bg: 'rgba(59,130,246,0.15)',  icon: 'Order Placed',    msg: 'Your order has been received and is being processed.' },
    'Packing':          { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  icon: 'Packing',         msg: 'Our team is carefully packing your items.' },
    'Shipped':          { color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)', icon: 'Shipped',          msg: 'Your order is on its way! Sit tight.' },
    'Out for delivery': { color: '#c9a84c', bg: 'rgba(201,168,76,0.15)', icon: 'Out for Delivery', msg: 'Your order is out for delivery today!' },
    'Delivered':        { color: '#10b981', bg: 'rgba(16,185,129,0.15)', icon: 'Delivered',        msg: 'Your order has been delivered. Enjoy!' },
}

export const sendOrderStatusEmail = (email, name, order) => {
    const cfg = STATUS_CONFIG[order.status] || { color: '#c9a84c', bg: 'rgba(201,168,76,0.15)', icon: 'Update', msg: 'Your order status has been updated.' }

    return send(
        email,
        `Order Update: ${order.status} - VIBECULTURE`,
        baseTemplate(`
            <h1>Order Update</h1>
            <h2>Hi ${name}, here is your update.</h2>
            <p class="text">${cfg.msg}</p>
            <div class="divider"></div>
            <div class="card" style="text-align:center;">
              <span class="status-badge" style="background:${cfg.bg};color:${cfg.color};border:1px solid ${cfg.color}40;">
                ${cfg.icon}
              </span>
              <p class="text-muted" style="margin-top:12px;">Order ID: <strong style="color:rgba(255,255,255,0.6);">#${order._id.toString().slice(-6).toUpperCase()}</strong></p>
              <p class="text-muted">Amount: <strong style="color:#c9a84c;">Rs.${order.amount}</strong></p>
            </div>
            <div style="text-align:center;">
              <a href="https://www.VIBECULTURE.store/orders" class="btn">View Order Details</a>
            </div>
            <p class="text-muted" style="margin-top:24px;">Questions? Contact us at <a href="mailto:support@VIBECULTURE.store" style="color:#c9a84c;">support@VIBECULTURE.store</a></p>
        `)
    )
}

// Payment Success
export const sendPaymentSuccessEmail = (email, name, order) => send(
    email,
    `Payment Received - Order #${order._id.toString().slice(-6).toUpperCase()} - VIBECULTURE`,
    baseTemplate(`
        <h1>Payment Successful!</h1>
        <h2>Thank you, ${name}.</h2>
        <p class="text">We have received your payment of <strong class="gold">Rs.${order.amount}</strong>. Your order is now confirmed and will be processed shortly.</p>
        <div class="divider"></div>
        <div class="card" style="text-align:center;">
          <p class="text-muted">Order ID</p>
          <p style="color:#c9a84c;font-size:20px;font-weight:bold;margin:4px 0;">#${order._id.toString().slice(-6).toUpperCase()}</p>
          <p class="text-muted">Payment Method: ${order.paymentMethod}</p>
          <p class="text-muted">Amount Paid: <strong style="color:#10b981;">Rs.${order.amount}</strong></p>
        </div>
        <div style="text-align:center;">
          <a href="https://www.VIBECULTURE.store/orders" class="btn">View My Orders</a>
        </div>
    `)
)
