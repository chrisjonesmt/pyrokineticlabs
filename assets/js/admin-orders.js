document.addEventListener("DOMContentLoaded", () => {

  const ADMIN_ORDERS_ENDPOINT =
    "https://yrztgpmuzyhfhcvpzerp.supabase.co/functions/v1/admin-orders";

  const SESSION_KEY = "pklAdminDashboardKey";

  const loginCard =
    document.getElementById("admin-login-card");

  const loginForm =
    document.getElementById("admin-login-form");

  const adminKeyInput =
    document.getElementById("admin-key");

  const loginMessage =
    document.getElementById("admin-login-message");

  const dashboard =
    document.getElementById("admin-dashboard");

  const ordersList =
    document.getElementById("admin-orders-list");

  const ordersMessage =
    document.getElementById("admin-orders-message");

  const refreshButton =
    document.getElementById("admin-refresh-button");

  const logoutButton =
    document.getElementById("admin-logout-button");

  const searchInput =
    document.getElementById("admin-order-search");

  const totalOrdersElement =
    document.getElementById("admin-total-orders");

  const awaitingPaymentElement =
    document.getElementById("admin-awaiting-payment");

  const processingElement =
    document.getElementById("admin-processing-orders");

  const shippedElement =
    document.getElementById("admin-shipped-orders");


  let currentOrders = [];


  /* =========================================================
     HELPERS
     ========================================================= */

  function escapeHtml(value) {

    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  }


  function formatCurrency(value) {

    return new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency: "USD"
      }
    ).format(Number(value) || 0);

  }


  function formatDate(value) {

    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
      }
    );

  }


  function formatStatus(value) {

    if (!value) {
      return "—";
    }

    return String(value)
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );

  }


  function getAdminKey() {

    return sessionStorage.getItem(
      SESSION_KEY
    );

  }


  function saveAdminKey(value) {

    sessionStorage.setItem(
      SESSION_KEY,
      value
    );

  }


  function clearAdminKey() {

    sessionStorage.removeItem(
      SESSION_KEY
    );

  }


  /* =========================================================
     API
     ========================================================= */

  async function fetchOrders(adminKey) {

    const response = await fetch(
      ADMIN_ORDERS_ENDPOINT,
      {
        method: "GET",

       headers: {
  "Authorization": `Bearer ${adminKey}`
}
      }
    );


    let result;

    try {

      result = await response.json();

    } catch {

      throw new Error(
        "The server returned an invalid response."
      );

    }


    if (!response.ok) {

      if (response.status === 401) {

        throw new Error(
          "Invalid administrator key."
        );

      }

      throw new Error(
        result?.error ||
        "Unable to load orders."
      );

    }


    if (
      !result.success ||
      !Array.isArray(result.orders)
    ) {

      throw new Error(
        "Unexpected order data received."
      );

    }


    return result.orders;

  }


  /* =========================================================
     SUMMARY
     ========================================================= */

  function updateSummary(orders) {

    const awaitingPayment =
      orders.filter(
        (order) =>
          order.payment_status ===
          "awaiting_payment"
      ).length;


    const processing =
      orders.filter(
        (order) =>
          order.order_status ===
          "processing"
      ).length;


    const shipped =
      orders.filter(
        (order) =>
          order.order_status ===
          "shipped"
      ).length;


    totalOrdersElement.textContent =
      orders.length;

    awaitingPaymentElement.textContent =
      awaitingPayment;

    processingElement.textContent =
      processing;

    shippedElement.textContent =
      shipped;

  }


  /* =========================================================
     ITEMS
     ========================================================= */

  function renderItems(items) {

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {

      return "<p>No item data available.</p>";

    }


    return items
      .map((item) => {

        const name =
          escapeHtml(
            item.name || item.id
          );

        const quantity =
          Number(item.quantity) || 0;

        const subtotal =
          formatCurrency(
            item.final_subtotal
          );


        return `
          <div class="admin-order-item">
            <span>
              ${name}
              <strong>× ${quantity}</strong>
            </span>

            <span>${subtotal}</span>
          </div>
        `;

      })
      .join("");

  }


  /* =========================================================
     ORDER CARDS
     ========================================================= */

  function renderOrders(orders) {

    ordersList.innerHTML = "";


    if (orders.length === 0) {

      ordersList.innerHTML = `
        <div class="admin-no-orders">
          No matching orders found.
        </div>
      `;

      return;

    }


    orders.forEach((order) => {

      const card =
        document.createElement("article");

      card.className =
        "admin-order-card";


      const customerName =
        `${order.first_name || ""} ${order.last_name || ""}`
          .trim();


      const addressLine2 =
        order.address_line2
          ? `
            <div>
              ${escapeHtml(order.address_line2)}
            </div>
          `
          : "";


      const tracking =
        order.tracking_number
          ? escapeHtml(
              order.tracking_number
            )
          : "Not assigned";


      const notes =
        order.internal_notes
          ? escapeHtml(
              order.internal_notes
            )
          : "No internal notes";


      card.innerHTML = `

        <div class="admin-order-card-header">

          <div>

            <span class="admin-order-date">
              ${escapeHtml(
                formatDate(order.created_at)
              )}
            </span>

            <h3>
              ${escapeHtml(
                order.order_number
              )}
            </h3>

          </div>


          <div class="admin-order-total">

            <span>Total</span>

            <strong>
              ${formatCurrency(
                order.total
              )}
            </strong>

          </div>

        </div>


        <div class="admin-order-status-row">

          <span
            class="
              admin-status-badge
              payment-status
              status-${escapeHtml(
                order.payment_status
              )}
            "
          >
            ${escapeHtml(
              formatStatus(
                order.payment_status
              )
            )}
          </span>


          <span
            class="
              admin-status-badge
              order-status
              status-${escapeHtml(
                order.order_status
              )}
            "
          >
            ${escapeHtml(
              formatStatus(
                order.order_status
              )
            )}
          </span>


          <span class="admin-payment-method">
            ${escapeHtml(
              formatStatus(
                order.payment_method
              )
            )}
          </span>

        </div>


        <div class="admin-order-grid">


          <section class="admin-order-section">

            <h4>Customer</h4>

            <strong>
              ${escapeHtml(
                customerName
              )}
            </strong>

            <div>
              ${escapeHtml(
                order.customer_email
              )}
            </div>

            <div>
              ${escapeHtml(
                order.phone || "No phone"
              )}
            </div>

          </section>


          <section class="admin-order-section">

            <h4>Shipping Address</h4>

            <div>
              ${escapeHtml(
                order.address_line1
              )}
            </div>

            ${addressLine2}

            <div>
              ${escapeHtml(
                order.city
              )},
              ${escapeHtml(
                order.state
              )}
              ${escapeHtml(
                order.zip_code
              )}
            </div>

          </section>


          <section class="admin-order-section">

            <h4>Tracking</h4>

            <div>
              ${tracking}
            </div>

            <small>
              Shipped:
              ${escapeHtml(
                formatDate(
                  order.shipped_at
                )
              )}
            </small>

          </section>


          <section class="admin-order-section">

            <h4>Internal Notes</h4>

            <div>
              ${notes}
            </div>

          </section>

        </div>


        <section class="admin-order-products">

          <h4>Items</h4>

          ${renderItems(
            order.items
          )}

        </section>


        <div class="admin-order-totals">

          <div>
            <span>Subtotal</span>

            <strong>
              ${formatCurrency(
                order.subtotal
              )}
            </strong>
          </div>


          <div>
            <span>Shipping</span>

            <strong>
              ${formatCurrency(
                order.shipping
              )}
            </strong>
          </div>


          <div class="admin-order-final-total">

            <span>Total</span>

            <strong>
              ${formatCurrency(
                order.total
              )}
            </strong>

          </div>

        </div>

      `;


      ordersList.appendChild(card);

    });

  }


  /* =========================================================
     SEARCH
     ========================================================= */

  function filterOrders() {

    const search =
      searchInput.value
        .trim()
        .toLowerCase();


    if (!search) {

      renderOrders(
        currentOrders
      );

      return;

    }


    const filtered =
      currentOrders.filter(
        (order) => {

          const searchableText = [

            order.order_number,

            order.first_name,

            order.last_name,

            order.customer_email,

            order.phone,

            order.payment_method,

            order.payment_status,

            order.order_status,

            order.tracking_number

          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();


          return searchableText.includes(
            search
          );

        }
      );


    renderOrders(
      filtered
    );

  }


  /* =========================================================
     LOAD DASHBOARD
     ========================================================= */

  async function loadDashboard(adminKey) {

    ordersMessage.textContent =
      "Loading orders...";


    try {

      const orders =
        await fetchOrders(
          adminKey
        );


      currentOrders =
        orders;


      loginCard.hidden =
        true;

      dashboard.hidden =
        false;


      updateSummary(
        orders
      );

      renderOrders(
        orders
      );


      ordersMessage.textContent =
        orders.length === 1
          ? "1 order loaded."
          : `${orders.length} orders loaded.`;


      return true;

    } catch (error) {

      console.error(
        "Admin dashboard error:",
        error
      );


      clearAdminKey();


      loginCard.hidden =
        false;

      dashboard.hidden =
        true;


      loginMessage.textContent =
        error instanceof Error
          ? error.message
          : "Unable to access the dashboard.";


      return false;

    }

  }


  /* =========================================================
     LOGIN
     ========================================================= */

  loginForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      const adminKey =
        adminKeyInput.value.trim();


      if (!adminKey) {

        loginMessage.textContent =
          "Enter your administrator key.";

        return;

      }


      loginMessage.textContent =
        "Verifying access...";


      const success =
        await loadDashboard(
          adminKey
        );


      if (success) {

        saveAdminKey(
          adminKey
        );

        adminKeyInput.value =
          "";

        loginMessage.textContent =
          "";

      }

    }
  );


  /* =========================================================
     REFRESH
     ========================================================= */

  refreshButton.addEventListener(
    "click",
    async () => {

      const adminKey =
        getAdminKey();


      if (!adminKey) {

        dashboard.hidden =
          true;

        loginCard.hidden =
          false;

        return;

      }


      await loadDashboard(
        adminKey
      );

    }
  );


  /* =========================================================
     LOGOUT / LOCK
     ========================================================= */

  logoutButton.addEventListener(
    "click",
    () => {

      clearAdminKey();

      currentOrders =
        [];

      ordersList.innerHTML =
        "";

      dashboard.hidden =
        true;

      loginCard.hidden =
        false;

      adminKeyInput.value =
        "";

      loginMessage.textContent =
        "Dashboard locked.";

    }
  );


  /* =========================================================
     SEARCH EVENT
     ========================================================= */

  searchInput.addEventListener(
    "input",
    filterOrders
  );


  /* =========================================================
     RESTORE SESSION
     ========================================================= */

  const savedAdminKey =
    getAdminKey();


  if (savedAdminKey) {

    loadDashboard(
      savedAdminKey
    );

  }

});