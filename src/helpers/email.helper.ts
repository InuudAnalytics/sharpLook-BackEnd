import nodemailer from "nodemailer"

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // upgrade later with STARTTLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendMail = async (to: string, subject: string, html: string) => {
  await transporter.sendMail({
    from: `"SHARPLOOK" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  })
}

export const sendVendorOrderEmail = async (
  to: string,
  {
    name, 
    clientName,
    phone,
    items,
    total,
    deliveryType,
  }: {
    name: string;
    clientName: string;
    phone: string;
    items: { productName: string; quantity: number; price: number; total: number }[];
    total: number;
    deliveryType: string
  }
) => {
  const productList = items
    .map(
      (item) =>
        `<li style="margin-bottom: 6px;"><strong>${item.productName}</strong> — ₦${item.price} × ${item.quantity} = <strong>₦${item.total}</strong></li>`
    )
    .join("");

  const html = `
  <div style="font-family: 'Segoe UI', sans-serif; color: #2c3e50; background: #f9f9f9; padding: 30px;">
    <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.07); padding: 25px;">
      <h2 style="color: #1abc9c;">🎉 New Order Alert!</h2>
      <p>Hi <strong>${name}</strong>,</p>

      <p style="font-size: 15px;">
        You've just received a new order from <strong>${clientName}</strong>, Kindly call the Customer at  <strong>${phone}</strong>
        Below are the glorious details of what you get to fulfill:
      </p>

      <ul style="list-style-type: none; padding-left: 0; margin: 20px 0;">
        ${productList}
      </ul>

      <p style="font-size: 16px;"><strong>Total Amount: ₦${total.toLocaleString()}</strong></p>

      <a href="https://yourdomain.com/dashboard" style="display: inline-block; margin-top: 20px; background: #1abc9c; color: white; text-decoration: none; padding: 12px 20px; border-radius: 5px;">
        🔧 Manage Orders in Dashboard
      </a>

      <p style="margin-top: 30px; font-size: 14px; color: #888;">💡 Tip: Delight your customers with timely delivery and thoughtful packaging.</p>
      
      <p style="margin-top: 40px;">With love,<br/><strong>— The SHARP Platform</strong></p>
    </div>
  </div>
  `;

  await sendMail(
    to,
    "🛍️ New Order Received on SHARP!",
    html
  );
};

