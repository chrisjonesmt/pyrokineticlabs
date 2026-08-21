document.addEventListener("DOMContentLoaded", () => {
  const CART_STORAGE_KEY = "pyroKineticLabsCart";
  const SHIPPING_RATE = 15;
  const FREE_SHIPPING_THRESHOLD = 150;

  const PROMO_STORAGE_KEY = "pyroKineticLabsPromo";
const SITE_LAUNCH_PROMO_CODE = "SITELAUNCH20";
const SITE_LAUNCH_PROMO_RATE = 0.20;

  function getCart() {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      const parsedCart = savedCart ? JSON.parse(savedCart) : [];

      return Array.isArray(parsedCart) ? parsedCart : [];
    } catch (error) {
      console.error("Unable to read cart:", error);
      return [];
    }
  }

  function saveCart(cart) {
    try {
      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(cart)
      );

      updateCartCount();
    } catch (error) {
      console.error("Unable to save cart:", error);
    }
}    
function getSavedPromoCode() {

  try {
    return (
      localStorage.getItem(
        PROMO_STORAGE_KEY
      ) || ""
    ).trim();
  } catch (error) {

    console.error(
      "Unable to read promo code:",
      error
    );

    return "";
  }

}


function savePromoCode(code) {

  try {

    if (code) {

      localStorage.setItem(
        PROMO_STORAGE_KEY,
        code
      );

    } else {

      localStorage.removeItem(
        PROMO_STORAGE_KEY
      );

    }

  } catch (error) {

    console.error(
      "Unable to save promo code:",
      error
    );

  }

}


function isSiteLaunchPromoActive() {

  return (
    getSavedPromoCode()
      .toUpperCase() ===
      SITE_LAUNCH_PROMO_CODE &&
    isSiteLaunchPromoWindowOpen()
  );

}
     function getSiteRootPath() {
    return window.location.pathname.includes("/products/") ? "../" : "";
}

const SITE_LAUNCH_PROMO_START =
  Date.parse(
    "2026-08-22T00:00:00Z"
  );

const SITE_LAUNCH_PROMO_END =
  Date.parse(
    "2026-08-24T00:00:00Z"
  );

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

function createCartPopup() {
    if (document.querySelector(".cart-popup-overlay")) {
        return;
    }

    const rootPath = getSiteRootPath();

    const popupOverlay = document.createElement("div");
    popupOverlay.className = "cart-popup-overlay";
    popupOverlay.setAttribute("role", "dialog");
    popupOverlay.setAttribute("aria-modal", "true");
    popupOverlay.setAttribute("aria-labelledby", "cart-popup-title");

    popupOverlay.innerHTML = `
        <div class="cart-popup">
            <div class="cart-popup-icon">✓</div>

            <h2 id="cart-popup-title">Added to Cart</h2>

            <p class="cart-popup-message">
                Your item has been successfully added to your cart.
            </p>

            <div class="cart-popup-actions">
                <button
                    type="button"
                    class="cart-popup-button cart-popup-continue"
                >
                    Keep Shopping
                </button>

                <a
                    href="${rootPath}cart.html"
                    class="cart-popup-button cart-popup-cart"
                >
                    Go to Cart
                </a>
            </div>
        </div>
    `;

    document.body.appendChild(popupOverlay);

    const keepShoppingButton = popupOverlay.querySelector(
        ".cart-popup-continue"
    );

    keepShoppingButton.addEventListener("click", () => {
        window.location.href = `${rootPath}shop.html`;
    });

    popupOverlay.addEventListener("click", (event) => {
        if (event.target === popupOverlay) {
            closeCartPopup();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (
            event.key === "Escape" &&
            popupOverlay.classList.contains("active")
        ) {
            closeCartPopup();
        }
    });
}

function showCartPopup(productName = "Your item") {
    createCartPopup();

    const popupOverlay = document.querySelector(".cart-popup-overlay");
    const popupMessage = popupOverlay.querySelector(".cart-popup-message");

    popupMessage.textContent =
        `${productName} has been successfully added to your cart.`;

    popupOverlay.classList.add("active");

    const goToCartButton = popupOverlay.querySelector(".cart-popup-cart");

    window.setTimeout(() => {
        goToCartButton.focus();
    }, 100);
}

function closeCartPopup() {
    const popupOverlay = document.querySelector(".cart-popup-overlay");

    if (popupOverlay) {
        popupOverlay.classList.remove("active");
    }
}
  

  function formatCurrency(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(value);
  }

  function sanitizeQuantity(value) {
    const parsedQuantity = Number.parseInt(value, 10);

    if (
      !Number.isFinite(parsedQuantity) ||
      parsedQuantity < 1
    ) {
      return 1;
    }

    return Math.min(parsedQuantity, 99);
  }

  function getDiscountRate(quantity) {
    if (quantity >= 10) {
      return 0.2;
    }

    if (quantity >= 5) {
      return 0.15;
    }

    if (quantity >= 3) {
      return 0.1;
    }

    return 0;
  }

  function getDiscountLabel(quantity) {
    const discountRate = getDiscountRate(quantity);

    if (discountRate === 0) {
      return "No bulk discount";
    }

    return `${discountRate * 100}% bulk discount`;
  }

  function getBulkMessage(quantity, price) {
    const discountRate = getDiscountRate(quantity);
    const regularSubtotal = quantity * price;
    const savings = regularSubtotal * discountRate;

    if (quantity >= 10) {
      return (
        `20% bulk discount unlocked. ` +
        `You save ${formatCurrency(savings)}.`
      );
    }

    if (quantity >= 5) {
      const neededForNextTier = 10 - quantity;

      return (
        `15% bulk discount unlocked. ` +
        `You save ${formatCurrency(savings)}. ` +
        `Add ${neededForNextTier} more ` +
        `${neededForNextTier === 1 ? "vial" : "vials"} ` +
        `to unlock 20% off.`
      );
    }

    if (quantity >= 3) {
      const neededForNextTier = 5 - quantity;

      return (
        `10% bulk discount unlocked. ` +
        `You save ${formatCurrency(savings)}. ` +
        `Add ${neededForNextTier} more ` +
        `${neededForNextTier === 1 ? "vial" : "vials"} ` +
        `to unlock 15% off.`
      );
    }

    const neededForFirstTier = 3 - quantity;

    return (
      `Add ${neededForFirstTier} more ` +
      `${neededForFirstTier === 1 ? "vial" : "vials"} ` +
      `to unlock 10% off.`
    );
  }

  function calculateItemTotals(item) {
    const quantity = sanitizeQuantity(item.quantity);
    const price = Number(item.price) || 0;
    const discountRate = getDiscountRate(quantity);

    const regularSubtotal = quantity * price;
    const savings = regularSubtotal * discountRate;
    const discountedSubtotal = regularSubtotal - savings;

    return {
      quantity,
      price,
      discountRate,
      regularSubtotal,
      savings,
      discountedSubtotal
    };
  }

  function calculateCartTotals(cart) {
    return cart.reduce(
      (totals, item) => {
        const itemTotals = calculateItemTotals(item);

        totals.regularSubtotal +=
          itemTotals.regularSubtotal;

        totals.savings += itemTotals.savings;

        totals.discountedSubtotal +=
          itemTotals.discountedSubtotal;

        return totals;
      },
      {
        regularSubtotal: 0,
        savings: 0,
        discountedSubtotal: 0
      }
    );
  }
function calculateEffectiveCartTotals(cart) {

  const totals =
    calculateCartTotals(cart);

  const promoActive =
    isSiteLaunchPromoActive();


  if (!promoActive) {

    return {
      ...totals,

      promoActive: false,

      promoSavings: 0,

      effectiveSubtotal:
        totals.discountedSubtotal
    };

  }


  const promoSubtotal =
    totals.regularSubtotal *
    (1 - SITE_LAUNCH_PROMO_RATE);

  const promoSavings =
    totals.regularSubtotal -
    promoSubtotal;


  /*
    IMPORTANT:
    Do not stack promo + bulk discounts.

    We simply use whichever final subtotal
    is lower for the customer.
  */

  const effectiveSubtotal =
    Math.min(
      totals.discountedSubtotal,
      promoSubtotal
    );


  const effectiveSavings =
    totals.regularSubtotal -
    effectiveSubtotal;


  return {
    ...totals,

    promoActive: true,

    promoSavings,

    effectiveSavings,

    effectiveSubtotal
  };

}
  function updateCartCount() {
    const cart = getCart();

    const totalQuantity = cart.reduce(
      (total, item) => {
        return total + sanitizeQuantity(item.quantity);
      },
      0
    );

    document
      .querySelectorAll(".cart-count")
      .forEach((countElement) => {
        countElement.textContent = totalQuantity;

        countElement.classList.toggle(
          "has-items",
          totalQuantity > 0
        );
      });
  }

  function initializeProductPurchase() {
    const purchaseSection =
      document.querySelector(".product-purchase");

    if (!purchaseSection) {
      return;
    }

    const quantityInput =
      purchaseSection.querySelector(".product-quantity");

    const minusButton =
      purchaseSection.querySelector(".quantity-minus");

    const plusButton =
      purchaseSection.querySelector(".quantity-plus");

    const addToCartButton =
      purchaseSection.querySelector(
        ".add-to-cart-button"
      );

    const progressMessage =
      purchaseSection.querySelector(
        ".bulk-progress-message"
      );

    const confirmationMessage =
      purchaseSection.querySelector(
        ".add-to-cart-message"
      );

    if (
      !quantityInput ||
      !minusButton ||
      !plusButton ||
      !addToCartButton
    ) {
      return;
    }

    const productPrice = Number.parseFloat(
      purchaseSection.dataset.productPrice
    );

    function getLiveInventory() {

  const inventory =
    Number.parseInt(
      purchaseSection.dataset.productInventory,
      10
    );

  return Number.isFinite(inventory)
    ? Math.max(inventory, 0)
    : 99;
}


function getQuantityAlreadyInCart() {

  const productId =
    purchaseSection.dataset.productId;

  const cart =
    getCart();

  const existingProduct =
    cart.find(
      (item) =>
        item.id === productId
    );

  return existingProduct
    ? sanitizeQuantity(
        existingProduct.quantity
      )
    : 0;
}


function getRemainingInventory() {

  return Math.max(
    getLiveInventory() -
      getQuantityAlreadyInCart(),
    0
  );

}


function refreshInventoryMessage() {
  const stockElement =
    purchaseSection.querySelector(
      ".product-stock"
    );

  if (!stockElement) {
    return;
  }


  const liveInventory =
    getLiveInventory();

  const alreadyInCart =
    getQuantityAlreadyInCart();

  const remainingInventory =
    getRemainingInventory();


  if (liveInventory <= 0) {

    stockElement.textContent =
      "Sold Out";

    stockElement.className =
      "product-stock sold-out";

    return;
  }


  if (alreadyInCart <= 0) {

    stockElement.textContent =
      `${liveInventory} in stock`;

    return;
  }


  if (remainingInventory <= 0) {

    stockElement.textContent =
      `${liveInventory} in stock • All available inventory is in your cart`;

    return;
  }


  stockElement.textContent =
    `${liveInventory} in stock • ${alreadyInCart} in your cart • ${remainingInventory} more available`;

}

purchaseSection.addEventListener(
  "pkl:inventory-updated",
  () => {

    refreshInventoryMessage();

    const remainingInventory =
      getRemainingInventory();


    if (remainingInventory <= 0) {

      plusButton.disabled = true;

      addToCartButton.disabled = true;

      addToCartButton.textContent =
        "Maximum In Cart";

      quantityInput.max = "1";

      return;
    }


    plusButton.disabled = false;

    addToCartButton.disabled = false;

    addToCartButton.textContent =
      "Add to Cart";

    quantityInput.max =
      String(remainingInventory);

  }
);

    function refreshBulkMessage() {
      const quantity = sanitizeQuantity(
        quantityInput.value
      );

      quantityInput.value = quantity;

      if (!progressMessage) {
        return;
      }

      progressMessage.textContent = getBulkMessage(
        quantity,
        productPrice
      );

      progressMessage.classList.toggle(
        "discount-unlocked",
        getDiscountRate(quantity) > 0
      );
    }

    minusButton.addEventListener("click", () => {
      const currentQuantity = sanitizeQuantity(
        quantityInput.value
      );

      if (currentQuantity > 1) {
        quantityInput.value = currentQuantity - 1;
        refreshBulkMessage();
      }
    });

    plusButton.addEventListener("click", () => {

  const currentQuantity =
    sanitizeQuantity(
      quantityInput.value
    );

  const remainingInventory =
    getRemainingInventory();


  if (
    remainingInventory > 0 &&
    currentQuantity <
      remainingInventory
  ) {

    quantityInput.value =
      currentQuantity + 1;

    refreshBulkMessage();

  }

});

    quantityInput.addEventListener(
      "input",
      refreshBulkMessage
    );

    quantityInput.addEventListener(
      "change",
      refreshBulkMessage
    );

   addToCartButton.addEventListener("click", () => {

  const liveInventory =
    getLiveInventory();

  const cart =
    getCart();

  const productId =
    purchaseSection.dataset.productId;

  const existingProduct =
    cart.find(
      (item) =>
        item.id === productId
    );

  const alreadyInCart =
    existingProduct
      ? sanitizeQuantity(
          existingProduct.quantity
        )
      : 0;

  const remainingInventory =
    Math.max(
      liveInventory -
        alreadyInCart,
      0
    );


  if (remainingInventory <= 0) {

    refreshInventoryMessage();

    if (confirmationMessage) {

      confirmationMessage.textContent =
        "You already have the maximum available quantity of this product in your cart.";

      confirmationMessage.classList.add(
        "visible"
      );

    }

    return;
  }


  const requestedQuantity =
    sanitizeQuantity(
      quantityInput.value
    );


  const quantityToAdd =
    Math.min(
      requestedQuantity,
      remainingInventory
    );


  const productPrice =
    Number.parseFloat(
      purchaseSection.dataset.productPrice
    );


  const product = {
    id:
      productId,

    name:
      purchaseSection.dataset.productName,

    price:
      productPrice,

    image:
      purchaseSection.dataset.productImage,

    url:
      purchaseSection.dataset.productUrl,

    quantity:
      quantityToAdd
  };


  if (
    !product.id ||
    !product.name
  ) {

    console.error(
      "Product data is missing an ID or name."
    );

    return;
  }


  if (existingProduct) {

    existingProduct.quantity =
      alreadyInCart +
      quantityToAdd;

  } else {

    cart.push(product);

  }


  saveCart(cart);

  refreshInventoryMessage();

  showCartPopup(
    product.name
  );


  const updatedProduct =
    cart.find(
      (item) =>
        item.id === product.id
    );


  if (
    confirmationMessage &&
    updatedProduct
  ) {

    const discountRate =
      getDiscountRate(
        updatedProduct.quantity
      );


    confirmationMessage.textContent =
      discountRate > 0
        ? `${quantityToAdd} added to your cart. ` +
          `${discountRate * 100}% bulk discount ` +
          `is active for this product.`
        : `${quantityToAdd} added to your cart.`;


    confirmationMessage.classList.add(
      "visible"
    );


    window.setTimeout(
      () => {

        confirmationMessage.classList.remove(
          "visible"
        );

      },
      4000
    );

  }


  const remainingAfterAdd =
    liveInventory -
    updatedProduct.quantity;


  if (remainingAfterAdd <= 0) {

    addToCartButton.disabled =
      true;

    addToCartButton.textContent =
      "Maximum In Cart";

    plusButton.disabled =
      true;

  } else {

    quantityInput.max =
      String(
        remainingAfterAdd
      );

    quantityInput.value =
      "1";

  }

});

    refreshBulkMessage();
    refreshInventoryMessage();
  }

  function initializeCartPage() {
    const cartItemsContainer =
      document.getElementById("cart-items");

    if (!cartItemsContainer) {
      return;
    }
    const bulkSavingsRow =
  document.getElementById(
    "bulk-savings-row"
  );
    const emptyCart =
      document.getElementById("empty-cart");

    const cartSummary =
      document.getElementById("cart-summary");

    const clearCartButton =
      document.getElementById("clear-cart-button");

    const checkoutButton =
      document.getElementById("checkout-button");

    const checkoutStatusMessage =
      document.getElementById(
        "checkout-status-message"
      );

      const promoCodeInput =
  document.getElementById(
    "promo-code-input"
  );

const applyPromoButton =
  document.getElementById(
    "apply-promo-button"
  );

const promoCodeMessage =
  document.getElementById(
    "promo-code-message"
  );

const promoSavingsRow =
  document.getElementById(
    "promo-savings-row"
  );

const promoSavingsElement =
  document.getElementById(
    "promo-savings"
  );
if (
  promoCodeInput &&
  isSiteLaunchPromoActive()
) {
  promoCodeInput.value =
    SITE_LAUNCH_PROMO_CODE;
}

if (
  promoCodeMessage &&
  isSiteLaunchPromoActive()
) {
  promoCodeMessage.textContent =
    "SITELAUNCH20 applied — 20% off.";
}
    function renderCart() {
      const cart = getCart();

      cartItemsContainer.innerHTML = "";

      if (cart.length === 0) {
        emptyCart?.classList.add("visible");
        cartSummary?.classList.add("cart-summary-hidden");
        clearCartButton?.classList.add("hidden");

        updateCartSummary([]);
        return;
      }

      emptyCart?.classList.remove("visible");
      cartSummary?.classList.remove(
        "cart-summary-hidden"
      );

      clearCartButton?.classList.remove("hidden");

      cart.forEach((item) => {
        const itemTotals = calculateItemTotals(item);

        const cartItem =
          document.createElement("article");

        cartItem.className = "cart-item";
        cartItem.dataset.productId = item.id;

        const imageLink = document.createElement("a");
        imageLink.className = "cart-item-image";
        imageLink.href = item.url || "shop.html";

        const image = document.createElement("img");
        image.src = item.image || "";
        image.alt = item.name || "Product image";

        imageLink.appendChild(image);

        const information =
          document.createElement("div");

        information.className = "cart-item-info";

        const productLink =
          document.createElement("a");

        productLink.className = "cart-item-name";
        productLink.href = item.url || "shop.html";
        productLink.textContent =
          item.name || "Research Product";

        const unitPrice =
          document.createElement("p");

        unitPrice.className = "cart-item-unit-price";
        unitPrice.textContent =
          `${formatCurrency(itemTotals.price)} each`;

        const discountMessage =
          document.createElement("p");

        discountMessage.className =
          "cart-item-discount-message";

        discountMessage.textContent = getBulkMessage(
          itemTotals.quantity,
          itemTotals.price
        );

        discountMessage.classList.toggle(
          "discount-unlocked",
          itemTotals.discountRate > 0
        );

        information.append(
          productLink,
          unitPrice,
          discountMessage
        );

        const quantityArea =
          document.createElement("div");

        quantityArea.className =
          "cart-item-quantity-area";

        const quantityLabel =
          document.createElement("span");

        quantityLabel.className =
          "cart-item-quantity-label";

        quantityLabel.textContent = "Quantity";

        const controls =
          document.createElement("div");

        controls.className = "quantity-controls";

        const minusButton =
          document.createElement("button");

        minusButton.type = "button";
        minusButton.className =
          "quantity-button cart-quantity-minus";

        minusButton.textContent = "−";
        minusButton.setAttribute(
          "aria-label",
          `Decrease quantity of ${item.name}`
        );

        const quantityInput =
          document.createElement("input");

        quantityInput.type = "number";
        quantityInput.className =
          "product-quantity cart-quantity-input";

        quantityInput.value = itemTotals.quantity;
        quantityInput.min = "1";
        quantityInput.max = "99";
        quantityInput.inputMode = "numeric";

        quantityInput.setAttribute(
          "aria-label",
          `Quantity of ${item.name}`
        );

        const plusButton =
          document.createElement("button");

        plusButton.type = "button";
        plusButton.className =
          "quantity-button cart-quantity-plus";

        plusButton.textContent = "+";
        plusButton.setAttribute(
          "aria-label",
          `Increase quantity of ${item.name}`
        );

        controls.append(
          minusButton,
          quantityInput,
          plusButton
        );

        const removeButton =
          document.createElement("button");

        removeButton.type = "button";
        removeButton.className =
          "remove-cart-item-button";

        removeButton.textContent = "Remove";

        quantityArea.append(
          quantityLabel,
          controls,
          removeButton
        );

        const totalsArea =
          document.createElement("div");

        totalsArea.className = "cart-item-totals";

        const discountBadge =
          document.createElement("span");

        discountBadge.className =
          "cart-item-discount-badge";

        discountBadge.textContent =
          getDiscountLabel(itemTotals.quantity);

        discountBadge.classList.toggle(
          "active",
          itemTotals.discountRate > 0
        );

        const regularTotal =
          document.createElement("span");

        regularTotal.className =
          "cart-item-regular-total";

        regularTotal.textContent =
          formatCurrency(
            itemTotals.regularSubtotal
          );

        if (itemTotals.discountRate === 0) {
          regularTotal.classList.add(
            "no-discount"
          );
        }

        const finalTotal =
          document.createElement("strong");

        finalTotal.className =
          "cart-item-final-total";

        finalTotal.textContent =
          formatCurrency(
            itemTotals.discountedSubtotal
          );

        totalsArea.append(
          discountBadge,
          regularTotal,
          finalTotal
        );

        minusButton.addEventListener("click", () => {
          updateItemQuantity(
            item.id,
            itemTotals.quantity - 1
          );
        });

        plusButton.addEventListener("click", () => {
          updateItemQuantity(
            item.id,
            itemTotals.quantity + 1
          );
        });

        quantityInput.addEventListener(
          "change",
          () => {
            updateItemQuantity(
              item.id,
              quantityInput.value
            );
          }
        );

        removeButton.addEventListener("click", () => {
          removeCartItem(item.id);
        });

        cartItem.append(
          imageLink,
          information,
          quantityArea,
          totalsArea
        );

        cartItemsContainer.appendChild(cartItem);
      });

      updateCartSummary(cart);
    }

    function updateItemQuantity(productId, quantity) {
      const cart = getCart();
      const sanitizedQuantity =
        sanitizeQuantity(quantity);

      const item = cart.find(
        (cartItem) => cartItem.id === productId
      );

      if (!item) {
        return;
      }

      item.quantity = sanitizedQuantity;

      saveCart(cart);
      renderCart();
    }

    function removeCartItem(productId) {
      const updatedCart = getCart().filter(
        (item) => item.id !== productId
      );

      saveCart(updatedCart);
      renderCart();
    }

    function updateCartSummary(cart) {
const totals = calculateEffectiveCartTotals(cart);
if (bulkSavingsRow) {
  bulkSavingsRow.style.display =
    totals.promoActive
      ? "none"
      : "flex";
}

if (promoSavingsRow) {
  promoSavingsRow.style.display =
    totals.promoActive
      ? "flex"
      : "none";
}

if (promoSavingsElement) {
  promoSavingsElement.textContent =
  totals.promoActive
    ? `−${formatCurrency(
        totals.effectiveSavings
      )}`
    : formatCurrency(0);
}
      const shipping =
  cart.length === 0
    ? 0
    : totals.effectiveSubtotal >=
        FREE_SHIPPING_THRESHOLD
      ? 0
      : SHIPPING_RATE;

      const finalTotal =
  totals.effectiveSubtotal + shipping;

      const regularSubtotalElement =
        document.getElementById( 
          "regular-subtotal"
        );

      const bulkSavingsElement =
        document.getElementById("bulk-savings");

      const discountedSubtotalElement =
        document.getElementById(
          "discounted-subtotal"
        );

      const shippingCostElement =
        document.getElementById("shipping-cost");

      const cartTotalElement =
        document.getElementById("cart-total");

      const shippingMessageElement =
        document.getElementById(
          "shipping-progress-message"
        );

      if (regularSubtotalElement) {
        regularSubtotalElement.textContent =
          formatCurrency(totals.regularSubtotal);
      }

      if (bulkSavingsElement) {
        bulkSavingsElement.textContent =
          totals.savings > 0
            ? `−${formatCurrency(totals.savings)}`
            : formatCurrency(0);
      }

      if (discountedSubtotalElement) {
        discountedSubtotalElement.textContent =
  formatCurrency(
    totals.effectiveSubtotal
  );
      }

      if (shippingCostElement) {
        shippingCostElement.textContent =
          shipping === 0 && cart.length > 0
            ? "FREE"
            : formatCurrency(shipping);
      }

      if (cartTotalElement) {
        cartTotalElement.textContent =
          formatCurrency(finalTotal);
      }

      if (!shippingMessageElement) {
        return;
      }

      if (cart.length === 0) {
        shippingMessageElement.textContent = "";
        shippingMessageElement.classList.remove(
          "free-shipping-unlocked"
        );

        return;
      }

      if (
        totals.discountedSubtotal >=
        FREE_SHIPPING_THRESHOLD
      ) {
        shippingMessageElement.textContent =
          "Free UPS shipping unlocked.";

        shippingMessageElement.classList.add(
          "free-shipping-unlocked"
        );

        return;
      }

      const remainingAmount =
        FREE_SHIPPING_THRESHOLD -
        totals.discountedSubtotal;

      shippingMessageElement.textContent =
        `Add ${formatCurrency(remainingAmount)} more ` +
        `to unlock free UPS shipping.`;

      shippingMessageElement.classList.remove(
        "free-shipping-unlocked"
      );
    }
applyPromoButton?.addEventListener(
  "click",
  () => {

    const enteredCode =
      String(
        promoCodeInput?.value || ""
      )
        .trim()
        .toUpperCase();


    if (
  enteredCode ===
  SITE_LAUNCH_PROMO_CODE
) {

  if (
    !isSiteLaunchPromoWindowOpen()
  ) {

    savePromoCode("");

    if (promoCodeMessage) {

      const now = Date.now();

      if (
        now <
        SITE_LAUNCH_PROMO_START
      ) {

        promoCodeMessage.textContent =
          "SITELAUNCH20 begins Friday at 7:00 PM CT.";

      } else {

        promoCodeMessage.textContent =
          "SITELAUNCH20 has ended.";

      }

    }

    renderCart();
    return;
  }


  savePromoCode(
    SITE_LAUNCH_PROMO_CODE
  );

  if (promoCodeMessage) {
    promoCodeMessage.textContent =
      "SITELAUNCH20 applied — 20% off.";
  }

  renderCart();
  return;
}


    savePromoCode("");

    if (promoCodeMessage) {
      promoCodeMessage.textContent =
        "Invalid promo code.";
    }

    renderCart();

  }
);
    clearCartButton?.addEventListener("click", () => {
      const shouldClear = window.confirm(
        "Remove all items from your cart?"
      );

      if (!shouldClear) {
        return;
      }

      saveCart([]);
      renderCart();
    });

    checkoutButton?.addEventListener("click", () => {
  if (getCart().length === 0) {
    return;
  }

  window.location.href = "checkout.html";
});

    renderCart();
  }

  updateCartCount();
  initializeProductPurchase();
  initializeCartPage();
});