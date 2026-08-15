import { withSupabase } from "npm:@supabase/server@^1";
import {
  SESClient,
  SendEmailCommand,
} from "npm:@aws-sdk/client-ses@3";

type CartItemInput = {
  id: string;
  quantity: number;
};

type CustomerInput = {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
};

type OrderRequest = {
  customer: CustomerInput;
  items: CartItemInput[];
  paymentMethod: "venmo" | "cashapp" | "zelle";
};


const SHIPPING_RATE = 15;
const FREE_SHIPPING_THRESHOLD = 150;

const PAYMENT_DESTINATIONS = {
  venmo: {
    label: "Venmo Business",
    destination: "@PKLabs",
  },

  cashapp: {
    label: "Cash App Business",
    destination: "$PKLPLACEHOLDER",
  },

  zelle: {
    label: "Zelle",
    destination: "support@pyrokineticlabs.com",
  },
};


const AWS_REGION =
  Deno.env.get("AWS_REGION") || "us-east-2";

const SES_FROM_EMAIL =
  Deno.env.get("SES_FROM_EMAIL") || "";

const AWS_ACCESS_KEY_ID =
  Deno.env.get("AWS_ACCESS_KEY_ID") || "";

const AWS_SECRET_ACCESS_KEY =
  Deno.env.get("AWS_SECRET_ACCESS_KEY") || "";

const sesClient = new SESClient({
  region: AWS_REGION,

  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

function getDiscountRate(quantity: number) {
  if (quantity >= 10) return 0.20;
  if (quantity >= 5) return 0.15;
  if (quantity >= 3) return 0.10;
  return 0;
}

function normalizeQuantity(value: unknown) {
  const quantity = Number.parseInt(
    String(value),
    10
  );

  if (
    !Number.isFinite(quantity) ||
    quantity < 1
  ) {
    throw new Error(
      "Invalid product quantity."
    );
  }

  if (quantity > 99) {
    throw new Error(
      "Maximum quantity is 99 per product."
    );
  }

  return quantity;
}

function roundMoney(value: number) {
  return (
    Math.round(
      (value + Number.EPSILON) * 100
    ) / 100
  );
}

function cleanText(value: unknown) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`;
}

function escapeHtml(value: unknown) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createOrderNumber() {
  const now = new Date();

  const date =
    now.getUTCFullYear().toString() +
    String(
      now.getUTCMonth() + 1
    ).padStart(2, "0") +
    String(
      now.getUTCDate()
    ).padStart(2, "0");

  const randomPart =
    crypto.randomUUID()
      .replaceAll("-", "")
      .slice(0, 6)
      .toUpperCase();

  return `PKL-${date}-${randomPart}`;
}

function getPaymentMethodLabel(
  paymentMethod: "venmo" | "cashapp" | "zelle"
) {
  return PAYMENT_DESTINATIONS[paymentMethod].label;
}

async function sendOrderConfirmationEmail({
  customerEmail,
  firstName,
  orderNumber,
  items,
  subtotal,
  shipping,
  total,
  paymentMethod,
}: {
  customerEmail: string;
  firstName: string;
  orderNumber: string;
  items: Array<{
    name: string;
    unit_price: number;
    quantity: number;
    discount_rate: number;
    regular_subtotal: number;
    final_subtotal: number;
  }>;
  subtotal: number;
  shipping: number;
  total: number;
  paymentMethod: "venmo" | "cashapp" | "zelle";
}) {
  if (
    !AWS_ACCESS_KEY_ID ||
    !AWS_SECRET_ACCESS_KEY ||
    !SES_FROM_EMAIL
  ) {
    throw new Error(
      "Amazon SES configuration is incomplete."
    );
  }

  const paymentLabel =
    getPaymentMethodLabel(paymentMethod);
    
  const paymentDestination =
  PAYMENT_DESTINATIONS[paymentMethod].destination;

  const itemRowsHtml = items
    .map((item) => {
      const discountText =
        item.discount_rate > 0
          ? `<div style="font-size:12px;color:#f97316;margin-top:4px;">
              ${Math.round(
                item.discount_rate * 100
              )}% quantity discount applied
            </div>`
          : "";

      return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #26384d;">
            <div style="font-weight:600;color:#ffffff;">
              ${escapeHtml(item.name)}
            </div>
            ${discountText}
          </td>

          <td style="padding:12px 0;border-bottom:1px solid #26384d;text-align:center;color:#cbd5e1;">
            ${item.quantity}
          </td>

          <td style="padding:12px 0;border-bottom:1px solid #26384d;text-align:right;color:#ffffff;">
            ${formatMoney(
              item.final_subtotal
            )}
          </td>
        </tr>
      `;
    })
    .join("");

  const itemRowsText = items
    .map((item) => {
      const discountText =
        item.discount_rate > 0
          ? ` (${Math.round(
              item.discount_rate * 100
            )}% discount)`
          : "";

      return `${item.name} x${item.quantity}${discountText} - ${formatMoney(
        item.final_subtotal
      )}`;
    })
    .join("\n");

  const htmlBody = `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#07111f;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">

    <div style="max-width:640px;margin:0 auto;padding:32px 20px;">

      <div style="background:#0d1c2e;border:1px solid #26384d;border-radius:14px;overflow:hidden;">

        <div style="padding:28px;background:#10243a;border-bottom:1px solid #26384d;">

          <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#f97316;font-weight:700;">
            Pyro Kinetic Labs
          </div>

          <h1 style="margin:10px 0 0;font-size:28px;color:#ffffff;">
            Order Received
          </h1>

        </div>

        <div style="padding:28px;">

          <p style="margin-top:0;font-size:16px;line-height:1.6;color:#e2e8f0;">
            Hi ${escapeHtml(firstName)},
          </p>

          <p style="font-size:16px;line-height:1.6;color:#e2e8f0;">
            Thank you for your order. We've received it successfully.
          </p>

          <div style="margin:24px 0;padding:18px;background:#091827;border:1px solid #26384d;border-radius:10px;">

            <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;">
              Order Number
            </div>

            <div style="font-size:20px;font-weight:700;color:#f97316;margin-top:6px;">
              ${escapeHtml(orderNumber)}
            </div>

          </div>

          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            style="border-collapse:collapse;"
          >
            <thead>
              <tr>
                <th style="padding:10px 0;text-align:left;font-size:12px;text-transform:uppercase;color:#94a3b8;">
                  Item
                </th>

                <th style="padding:10px 0;text-align:center;font-size:12px;text-transform:uppercase;color:#94a3b8;">
                  Qty
                </th>

                <th style="padding:10px 0;text-align:right;font-size:12px;text-transform:uppercase;color:#94a3b8;">
                  Total
                </th>
              </tr>
            </thead>

            <tbody>
              ${itemRowsHtml}
            </tbody>
          </table>

          <div style="margin-top:24px;">

            <table
              role="presentation"
              width="100%"
              cellspacing="0"
              cellpadding="0"
            >

              <tr>
                <td style="padding:5px 0;color:#94a3b8;">
                  Subtotal
                </td>

                <td style="padding:5px 0;text-align:right;color:#ffffff;">
                  ${formatMoney(subtotal)}
                </td>
              </tr>

              <tr>
                <td style="padding:5px 0;color:#94a3b8;">
                  Shipping
                </td>

                <td style="padding:5px 0;text-align:right;color:#ffffff;">
                  ${
                    shipping === 0
                      ? "FREE"
                      : formatMoney(shipping)
                  }
                </td>
              </tr>

              <tr>
                <td style="padding-top:12px;font-size:18px;font-weight:700;color:#ffffff;">
                  Total
                </td>

                <td style="padding-top:12px;text-align:right;font-size:20px;font-weight:700;color:#f97316;">
                  ${formatMoney(total)}
                </td>
              </tr>

            </table>

          </div>

          <div style="margin-top:26px;padding:18px;background:#091827;border-radius:10px;">

  <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;">
    Complete Your Payment
  </div>

  <div style="margin-top:12px;font-size:14px;color:#94a3b8;">
    Payment Method
  </div>

  <div style="margin-top:4px;font-weight:700;color:#ffffff;">
    ${escapeHtml(paymentLabel)}
  </div>

  <div style="margin-top:14px;font-size:14px;color:#94a3b8;">
    Send Payment To
  </div>

  <div style="margin-top:4px;font-size:18px;font-weight:700;color:#f97316;">
    ${escapeHtml(paymentDestination)}
  </div>

  <div style="margin-top:14px;font-size:14px;color:#94a3b8;">
    Amount Due
  </div>

  <div style="margin-top:4px;font-size:20px;font-weight:700;color:#ffffff;">
    ${formatMoney(total)}
  </div>

  <div style="margin-top:20px;padding:15px;background:#10243a;border:1px solid #f97316;border-radius:8px;">

    <div style="font-weight:700;color:#f97316;">
      Important Payment Note
    </div>

    <div style="margin-top:7px;font-size:14px;line-height:1.55;color:#e2e8f0;">
      To help us match your payment quickly and avoid delays,
      please enter <strong>only your PKL order number</strong>
      in the payment note.
    </div>

    <div style="margin-top:10px;font-size:17px;font-weight:700;color:#ffffff;">
      ${escapeHtml(orderNumber)}
    </div>

    <div style="margin-top:7px;font-size:13px;line-height:1.5;color:#94a3b8;">
      Please do not include product names or other order details
      in the payment note.
    </div>

  </div>

</div>

          <p style="margin:28px 0 0;font-size:14px;line-height:1.6;color:#94a3b8;">
            We'll send you another email when your order status changes or tracking information becomes available.
          </p>

        </div>

      </div>

      <div style="padding:22px 10px;text-align:center;font-size:12px;line-height:1.6;color:#64748b;">
        Pyro Kinetic Labs<br>
        For Research Use Only — Not for Human Consumption
      </div>

    </div>

  </body>
</html>
  `;

  const textBody = `
Pyro Kinetic Labs
Order Received

Hi ${firstName},

Thank you for your order. We've received it successfully.

Order Number:
${orderNumber}

ITEMS
${itemRowsText}

Subtotal: ${formatMoney(subtotal)}
Shipping: ${
    shipping === 0
      ? "FREE"
      : formatMoney(shipping)
  }
Total: ${formatMoney(total)}

PAYMENT INSTRUCTIONS

Payment Method: ${paymentLabel}
Send Payment To: ${paymentDestination}
Amount Due: ${formatMoney(total)}

IMPORTANT:
To help us match your payment quickly and avoid delays, please enter only your PKL order number in the payment note:

${orderNumber}

Please do not include product names or other order details in the payment note.

Payment Status: Awaiting Payment

We'll send you another email when your order status changes or tracking information becomes available.

Pyro Kinetic Labs
For Research Use Only — Not for Human Consumption
  `.trim();

  const command =
    new SendEmailCommand({
      Source:
        `Pyro Kinetic Labs <${SES_FROM_EMAIL}>`,

      Destination: {
        ToAddresses: [
          customerEmail,
        ],
      },

      ReplyToAddresses: [
        SES_FROM_EMAIL,
      ],

      Message: {
        Subject: {
          Charset: "UTF-8",
          Data:
            `Pyro Kinetic Labs Order ${orderNumber} Received`,
        },

        Body: {
          Html: {
            Charset: "UTF-8",
            Data: htmlBody,
          },

          Text: {
            Charset: "UTF-8",
            Data: textBody,
          },
        },
      },
    });

  const result =
    await sesClient.send(command);

  console.log(
    "Order confirmation email sent:",
    {
      orderNumber,
      messageId: result.MessageId,
    }
  );
}

async function sendAdminOrderNotificationEmail({
  customerEmail,
  firstName,
  lastName,
  phone,
  addressLine1,
  addressLine2,
  city,
  state,
  zipCode,
  orderNumber,
  items,
  subtotal,
  shipping,
  total,
  paymentMethod,
}: {
  customerEmail: string;
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  orderNumber: string;
  items: Array<{
    name: string;
    unit_price: number;
    quantity: number;
    discount_rate: number;
    regular_subtotal: number;
    final_subtotal: number;
  }>;
  subtotal: number;
  shipping: number;
  total: number;
  paymentMethod: "venmo" | "cashapp" | "zelle";
}) {
  if (
    !AWS_ACCESS_KEY_ID ||
    !AWS_SECRET_ACCESS_KEY ||
    !SES_FROM_EMAIL
  ) {
    throw new Error(
      "Amazon SES configuration is incomplete."
    );
  }

  const paymentLabel =
    getPaymentMethodLabel(paymentMethod);

  const itemRowsHtml = items
    .map((item) => {
      const discountText =
        item.discount_rate > 0
          ? `<div style="font-size:12px;color:#f97316;margin-top:4px;">
              ${Math.round(item.discount_rate * 100)}% quantity discount
            </div>`
          : "";

      return `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #26384d;">
            <strong>${escapeHtml(item.name)}</strong>
            ${discountText}
          </td>

          <td style="padding:10px 0;border-bottom:1px solid #26384d;text-align:center;">
            ${item.quantity}
          </td>

          <td style="padding:10px 0;border-bottom:1px solid #26384d;text-align:right;">
            ${formatMoney(item.final_subtotal)}
          </td>
        </tr>
      `;
    })
    .join("");

  const addressLine2Html = addressLine2
    ? `${escapeHtml(addressLine2)}<br>`
    : "";

  const htmlBody = `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#07111f;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">

    <div style="max-width:680px;margin:0 auto;padding:30px 20px;">

      <div style="background:#0d1c2e;border:1px solid #26384d;border-radius:14px;overflow:hidden;">

        <div style="padding:26px;background:#10243a;border-bottom:1px solid #26384d;">

          <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#f97316;font-weight:700;">
            Pyro Kinetic Labs Administration
          </div>

          <h1 style="margin:10px 0 0;font-size:28px;">
            New Order Received
          </h1>

        </div>

        <div style="padding:26px;">

          <div style="padding:18px;background:#091827;border:1px solid #26384d;border-radius:10px;margin-bottom:24px;">

            <div style="font-size:12px;color:#94a3b8;text-transform:uppercase;">
              Order Number
            </div>

            <div style="font-size:21px;font-weight:700;color:#f97316;margin-top:5px;">
              ${escapeHtml(orderNumber)}
            </div>

            <div style="font-size:26px;font-weight:700;margin-top:14px;">
              ${formatMoney(total)}
            </div>

            <div style="color:#cbd5e1;margin-top:5px;">
              ${escapeHtml(paymentLabel)} — Awaiting Payment
            </div>

          </div>

          <h2 style="font-size:17px;color:#f97316;">
            Customer
          </h2>

          <div style="line-height:1.7;color:#e2e8f0;">
            <strong>
              ${escapeHtml(firstName)} ${escapeHtml(lastName)}
            </strong><br>

            ${escapeHtml(customerEmail)}<br>

            ${
              phone
                ? escapeHtml(phone)
                : "No phone provided"
            }
          </div>

          <h2 style="font-size:17px;color:#f97316;margin-top:26px;">
            Shipping Address
          </h2>

          <div style="line-height:1.7;color:#e2e8f0;">
            ${escapeHtml(addressLine1)}<br>
            ${addressLine2Html}
            ${escapeHtml(city)}, ${escapeHtml(state)} ${escapeHtml(zipCode)}
          </div>

          <h2 style="font-size:17px;color:#f97316;margin-top:26px;">
            Items
          </h2>

          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            style="border-collapse:collapse;"
          >
            <thead>
              <tr>
                <th style="text-align:left;padding:8px 0;color:#94a3b8;font-size:12px;">
                  ITEM
                </th>

                <th style="text-align:center;padding:8px 0;color:#94a3b8;font-size:12px;">
                  QTY
                </th>

                <th style="text-align:right;padding:8px 0;color:#94a3b8;font-size:12px;">
                  TOTAL
                </th>
              </tr>
            </thead>

            <tbody>
              ${itemRowsHtml}
            </tbody>
          </table>

          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            style="margin-top:20px;"
          >
            <tr>
              <td style="padding:5px 0;color:#94a3b8;">
                Subtotal
              </td>

              <td style="padding:5px 0;text-align:right;">
                ${formatMoney(subtotal)}
              </td>
            </tr>

            <tr>
              <td style="padding:5px 0;color:#94a3b8;">
                Shipping
              </td>

              <td style="padding:5px 0;text-align:right;">
                ${
                  shipping === 0
                    ? "FREE"
                    : formatMoney(shipping)
                }
              </td>
            </tr>

            <tr>
              <td style="padding-top:12px;font-size:18px;font-weight:700;">
                Total
              </td>

              <td style="padding-top:12px;text-align:right;font-size:20px;font-weight:700;color:#f97316;">
                ${formatMoney(total)}
              </td>
            </tr>
          </table>

        </div>

      </div>

    </div>

  </body>
</html>
  `;

  const textBody = `
NEW PYRO KINETIC LABS ORDER

Order: ${orderNumber}
Total: ${formatMoney(total)}
Payment Method: ${paymentLabel}
Payment Status: Awaiting Payment

CUSTOMER
${firstName} ${lastName}
${customerEmail}
${phone || "No phone provided"}

SHIPPING ADDRESS
${addressLine1}
${addressLine2 ? addressLine2 + "\n" : ""}${city}, ${state} ${zipCode}

ITEMS
${items
  .map(
    (item) =>
      `${item.name} x${item.quantity} - ${formatMoney(
        item.final_subtotal
      )}`
  )
  .join("\n")}

Subtotal: ${formatMoney(subtotal)}
Shipping: ${
    shipping === 0
      ? "FREE"
      : formatMoney(shipping)
  }
Total: ${formatMoney(total)}
  `.trim();

  const command = new SendEmailCommand({
    Source:
      `Pyro Kinetic Labs <${SES_FROM_EMAIL}>`,

    Destination: {
      ToAddresses: [
        SES_FROM_EMAIL,
      ],
    },

    ReplyToAddresses: [
      customerEmail,
    ],

    Message: {
      Subject: {
        Charset: "UTF-8",
        Data:
          `NEW ORDER ${orderNumber} — ${formatMoney(total)} — ${paymentLabel}`,
      },

      Body: {
        Html: {
          Charset: "UTF-8",
          Data: htmlBody,
        },

        Text: {
          Charset: "UTF-8",
          Data: textBody,
        },
      },
    },
  });

  const result =
    await sesClient.send(command);

  console.log(
    "Admin order notification sent:",
    {
      orderNumber,
      messageId: result.MessageId,
    }
  );
}

export default {
  fetch: withSupabase(
    { auth: "none" },

    async (req, ctx) => {
      try {
        if (req.method !== "POST") {
          return Response.json(
            {
              error:
                "Method not allowed.",
            },
            {
              status: 405,
            }
          );
        }

        const body =
          (await req.json()) as OrderRequest;

        const customer =
          body?.customer;

        const submittedItems =
          body?.items;

        const paymentMethod =
          body?.paymentMethod;

        if (!customer) {
          return Response.json(
            {
              error:
                "Customer information is required.",
            },
            {
              status: 400,
            }
          );
        }

        const customerEmail =
          cleanText(
            customer.email
          ).toLowerCase();

        const firstName =
          cleanText(
            customer.firstName
          );

        const lastName =
          cleanText(
            customer.lastName
          );

        const phone =
          cleanText(
            customer.phone
          );

        const addressLine1 =
          cleanText(
            customer.addressLine1
          );

        const addressLine2 =
          cleanText(
            customer.addressLine2
          );

        const city =
          cleanText(
            customer.city
          );

        const state =
          cleanText(
            customer.state
          );

        const zipCode =
          cleanText(
            customer.zipCode
          );

        if (
          !customerEmail ||
          !firstName ||
          !lastName ||
          !addressLine1 ||
          !city ||
          !state ||
          !zipCode
        ) {
          return Response.json(
            {
              error:
                "Required shipping information is missing.",
            },
            {
              status: 400,
            }
          );
        }

        if (
          !customerEmail.includes("@")
        ) {
          return Response.json(
            {
              error:
                "Please provide a valid email address.",
            },
            {
              status: 400,
            }
          );
        }

       if (
  paymentMethod !== "venmo" &&
  paymentMethod !== "cashapp" &&
  paymentMethod !== "zelle"
) {
          return Response.json(
            {
              error:
                "Please select a valid payment method.",
            },
            {
              status: 400,
            }
          );
        }

        if (
          !Array.isArray(
            submittedItems
          ) ||
          submittedItems.length === 0
        ) {
          return Response.json(
            {
              error:
                "Your cart is empty.",
            },
            {
              status: 400,
            }
          );
        }

        let regularSubtotal = 0;
        let discountedSubtotal = 0;

        const validatedItems =
          submittedItems.map(
            (submittedItem) => {
              const product =
                PRODUCT_CATALOG[
                  submittedItem.id
                ];

              if (!product) {
                throw new Error(
                  `Invalid product: ${submittedItem.id}`
                );
              }

              const quantity =
                normalizeQuantity(
                  submittedItem.quantity
                );

              const discountRate =
                getDiscountRate(
                  quantity
                );

              const regularItemSubtotal =
                product.price *
                quantity;

              const discountedItemSubtotal =
                regularItemSubtotal *
                (1 - discountRate);

              regularSubtotal +=
                regularItemSubtotal;

              discountedSubtotal +=
                discountedItemSubtotal;

              return {
                id:
                  submittedItem.id,

                name:
                  product.name,

                unit_price:
                  product.price,

                quantity,

                discount_rate:
                  discountRate,

                regular_subtotal:
                  roundMoney(
                    regularItemSubtotal
                  ),

                final_subtotal:
                  roundMoney(
                    discountedItemSubtotal
                  ),
              };
            }
          );

        regularSubtotal =
          roundMoney(
            regularSubtotal
          );

        discountedSubtotal =
          roundMoney(
            discountedSubtotal
          );

        const shipping =
          discountedSubtotal >=
          FREE_SHIPPING_THRESHOLD
            ? 0
            : SHIPPING_RATE;

        const total =
          roundMoney(
            discountedSubtotal +
              shipping
          );

        const orderNumber =
          createOrderNumber();

        const {
          error: insertError,
        } =
          await ctx.supabaseAdmin
            .from("Orders")
            .insert({
              order_number:
                orderNumber,

              customer_email:
                customerEmail,

              first_name:
                firstName,

              last_name:
                lastName,

              phone:
                phone || null,

              address_line1:
                addressLine1,

              address_line2:
                addressLine2 || null,

              city,

              state,

              zip_code:
                zipCode,

              items:
                validatedItems,

              subtotal:
                discountedSubtotal,

              shipping,

              total,

              payment_method:
                paymentMethod,

              payment_status:
                "awaiting_payment",

              order_status:
                "received",

              tracking_number:
                null,
            });

        if (insertError) {
          console.error(
            "Database insert failed:",
            insertError
          );

          return Response.json(
            {
              error:
                "Unable to create the order. Please try again.",
            },
            {
              status: 500,
            }
          );
        }

        /*
        IMPORTANT:
        At this point the order already exists
        successfully in the database.

        Email failure must NOT invalidate
        or delete the customer's order.
        */
        try {
          await sendOrderConfirmationEmail({
            customerEmail,
            firstName,
            orderNumber,
            items:
              validatedItems,
            subtotal:
              discountedSubtotal,
            shipping,
            total,
            paymentMethod,
          });
        } catch (emailError) {
          console.error(
            "Order created, but confirmation email failed:",
            emailError
          );
        }
        try {
  await sendAdminOrderNotificationEmail({
    customerEmail,
    firstName,
    lastName,
    phone,
    addressLine1,
    addressLine2,
    city,
    state,
    zipCode,
    orderNumber,
    items: validatedItems,
    subtotal: discountedSubtotal,
    shipping,
    total,
    paymentMethod,
  });
} catch (adminEmailError) {
  console.error(
    "Order created, but admin notification failed:",
    adminEmailError
  );
}
        return Response.json(
          {
            success: true,
            orderNumber,
            subtotal:
              discountedSubtotal,
            shipping,
            total,
            paymentMethod,
          },
          {
            status: 201,
          }
        );
      } catch (error) {
        console.error(
          "create-order error:",
          error
        );

        return Response.json(
          {
            error:
              error instanceof Error
                ? error.message
                : "Unable to create the order.",
          },
          {
            status: 400,
          }
        );
      }
    }
  ),
};