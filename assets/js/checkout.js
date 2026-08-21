document.addEventListener("DOMContentLoaded", () => {

  const CART_STORAGE_KEY = "pyroKineticLabsCart";
const PROMO_STORAGE_KEY = "pyroKineticLabsPromo";

const SITE_LAUNCH_PROMO_CODE =
  "SITELAUNCH20";

const SITE_LAUNCH_PROMO_START =
  Date.parse(
    "2026-08-22T00:00:00Z"
  );

const SITE_LAUNCH_PROMO_END =
  Date.parse(
    "2026-08-24T00:00:00Z"
  );

const SHIPPING_RATE = 15;
  const FREE_SHIPPING_THRESHOLD = 150;


  function getCart() {
    try {
      const savedCart =
        localStorage.getItem(CART_STORAGE_KEY);

      const parsedCart =
        savedCart ? JSON.parse(savedCart) : [];

      return Array.isArray(parsedCart)
        ? parsedCart
        : [];

    } catch (error) {
      console.error(
        "Unable to read cart:",
        error
      );

      return [];
    }
  }
function getSavedPromoCode() {

  try {
    return (
      localStorage.getItem(
        PROMO_STORAGE_KEY
      ) || ""
    )
      .trim()
      .toUpperCase();

  } catch (error) {

    console.error(
      "Unable to read promo code:",
      error
    );

    return "";
  }

}

function isSiteLaunchPromoWindowOpen() {

  const now =
    Date.now();

  return (
    now >=
      SITE_LAUNCH_PROMO_START &&
    now <
      SITE_LAUNCH_PROMO_END
  );

}
  function formatCurrency(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(value);
  }


  function sanitizeQuantity(value) {
    const quantity =
      Number.parseInt(value, 10);

    if (
      !Number.isFinite(quantity) ||
      quantity < 1
    ) {
      return 1;
    }

    return Math.min(quantity, 99);
  }


  function getDiscountRate(quantity) {

    if (quantity >= 10) {
      return 0.20;
    }

    if (quantity >= 5) {
      return 0.15;
    }

    if (quantity >= 3) {
      return 0.10;
    }

    return 0;
  }


  function calculateItemTotals(item) {

    const quantity =
      sanitizeQuantity(item.quantity);

    const price =
      Number(item.price) || 0;

    const discountRate =
      getDiscountRate(quantity);

    const regularSubtotal =
      quantity * price;

    const discountedSubtotal =
      regularSubtotal *
      (1 - discountRate);

    return {
      quantity,
      price,
      discountRate,
      regularSubtotal,
      discountedSubtotal
    };
  }


  function calculateCartTotals(cart) {

  const totals = cart.reduce(
    (totals, item) => {

      const itemTotals =
        calculateItemTotals(item);

      totals.regularSubtotal +=
        itemTotals.regularSubtotal;

      totals.discountedSubtotal +=
        itemTotals.discountedSubtotal;

      return totals;

    },
    {
      regularSubtotal: 0,
      discountedSubtotal: 0
    }
  );


  const promoCode =
    getSavedPromoCode();


  if (
  promoCode !==
    SITE_LAUNCH_PROMO_CODE ||
  !isSiteLaunchPromoWindowOpen()
) {

    return {
      ...totals,
      promoCode: "",
      effectiveSubtotal:
        totals.discountedSubtotal
    };

  }


  const promoSubtotal =
    totals.regularSubtotal * 0.80;


  return {
    ...totals,
    promoCode:
      "SITELAUNCH20",

    effectiveSubtotal:
      Math.min(
        totals.discountedSubtotal,
        promoSubtotal
      )
  };

}
   
  


  function renderCheckout() {

    const cart = getCart();

    const itemsContainer =
      document.getElementById(
        "checkout-items"
      );

    const subtotalElement =
      document.getElementById(
        "checkout-subtotal"
      );

    const shippingElement =
      document.getElementById(
        "checkout-shipping"
      );

    const totalElement =
      document.getElementById(
        "checkout-total"
      );


    if (
      !itemsContainer ||
      !subtotalElement ||
      !shippingElement ||
      !totalElement
    ) {
      return;
    }


    if (cart.length === 0) {

      window.location.href =
        "cart.html";

      return;
    }


    itemsContainer.innerHTML = "";


    cart.forEach((item) => {

      const totals =
        calculateItemTotals(item);

      const row =
        document.createElement("div");

      row.className =
        "checkout-item";


      const information =
        document.createElement("div");

      information.className =
        "checkout-item-info";


      const name =
        document.createElement("span");

      name.className =
        "checkout-item-name";

      name.textContent =
        item.name ||
        "Research Product";


      const quantity =
        document.createElement("span");

      quantity.className =
        "checkout-item-quantity";

      quantity.textContent =
        `Qty: ${totals.quantity}`;


      if (totals.discountRate > 0) {

        quantity.textContent +=
          ` • ${totals.discountRate * 100}% bulk discount`;
      }


      information.append(
        name,
        quantity
      );


      const price =
        document.createElement("strong");

      price.className =
        "checkout-item-price";

      price.textContent =
        formatCurrency(
          totals.discountedSubtotal
        );


      row.append(
        information,
        price
      );


      itemsContainer.appendChild(row);
    });


    const totals =
      calculateCartTotals(cart);


    const shipping =
  totals.effectiveSubtotal >=
    FREE_SHIPPING_THRESHOLD
    ? 0
    : SHIPPING_RATE;


    const finalTotal =
      totals.effectiveSubtotal +
      shipping;


    subtotalElement.textContent =
  formatCurrency(
    totals.effectiveSubtotal
  );


    shippingElement.textContent =
      shipping === 0
        ? "FREE"
        : formatCurrency(shipping);


    totalElement.textContent =
      formatCurrency(finalTotal);
  }
const checkoutForm =
  document.getElementById("checkout-form");

const placeOrderButton =
  document.getElementById("place-order-button");

const checkoutErrorMessage =
  document.getElementById("checkout-error-message");


checkoutForm?.addEventListener("submit", async (event) => {

  event.preventDefault();

  const cart = getCart();

  if (cart.length === 0) {
    window.location.href = "cart.html";
    return;
  }


  if (placeOrderButton) {
    placeOrderButton.disabled = true;
    placeOrderButton.textContent = "Creating Order...";
  }


  if (checkoutErrorMessage) {
    checkoutErrorMessage.textContent = "";
  }


  try {

    const formData =
      new FormData(checkoutForm);


    const paymentMethod =
      formData.get("paymentMethod");


    const orderData = {

      customer: {

        email:
          String(
            formData.get("email") || ""
          ).trim(),

        firstName:
          String(
            formData.get("firstName") || ""
          ).trim(),

        lastName:
          String(
            formData.get("lastName") || ""
          ).trim(),

        phone:
          String(
            formData.get("phone") || ""
          ).trim(),

        addressLine1:
          String(
            formData.get("addressLine1") || ""
          ).trim(),

        addressLine2:
          String(
            formData.get("addressLine2") || ""
          ).trim(),

        city:
          String(
            formData.get("city") || ""
          ).trim(),

        state:
          String(
            formData.get("state") || ""
          )
            .trim()
            .toUpperCase(),

        zipCode:
          String(
            formData.get("zipCode") || ""
          ).trim()

      },


      items: cart.map((item) => ({
  id: item.id,
  quantity: sanitizeQuantity(
    item.quantity
  )
})),

promoCode:
  getSavedPromoCode(),

paymentMethod:
  String(paymentMethod || "")

    };


    const response = await fetch(
      "https://yrztgpmuzyhfhcvpzerp.supabase.co/functions/v1/create-order",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify(orderData)
      }
    );


    const result = await response.json();


    if (!response.ok) {

      throw new Error(
        result.error ||
        "Unable to create your order."
      );

    }


    /*
      Save confirmation information temporarily
      so the confirmation page can display it.
    */

    sessionStorage.setItem(
      "pyroKineticLabsOrderConfirmation",
      JSON.stringify({
        orderNumber: result.orderNumber,
        subtotal: result.subtotal,
        shipping: result.shipping,
        total: result.total,
        paymentMethod: result.paymentMethod,
        customerEmail: orderData.customer.email
      })
    );


    /*
      Clear cart only AFTER Supabase confirms
      the order was successfully created.
    */

    localStorage.removeItem(
      CART_STORAGE_KEY
    );


    window.location.href =
      "order-confirmation.html";


  } catch (error) {

    console.error(
      "Checkout error:",
      error
    );


    if (checkoutErrorMessage) {

      checkoutErrorMessage.textContent =
        error instanceof Error
          ? error.message
          : "Unable to create your order. Please try again.";

    }


    if (placeOrderButton) {

      placeOrderButton.disabled = false;

      placeOrderButton.textContent =
        "Place Order";

    }

  }

});

  renderCheckout();

});