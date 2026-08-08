document.addEventListener("DOMContentLoaded", () => {
  const CART_STORAGE_KEY = "pyroKineticLabsCart";
  const SHIPPING_RATE = 15;
  const FREE_SHIPPING_THRESHOLD = 150;

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

     function getSiteRootPath() {
    return window.location.pathname.includes("/products/") ? "../" : "";
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
      const currentQuantity = sanitizeQuantity(
        quantityInput.value
      );

      if (currentQuantity < 99) {
        quantityInput.value = currentQuantity + 1;
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
      const quantityToAdd = sanitizeQuantity(
        quantityInput.value
      );

      const cart = getCart();

      const product = {
        id: purchaseSection.dataset.productId,
        name: purchaseSection.dataset.productName,
        price: productPrice,
        image: purchaseSection.dataset.productImage,
        url: purchaseSection.dataset.productUrl,
        quantity: quantityToAdd
      };

      if (!product.id || !product.name) {
        console.error(
          "Product data is missing an ID or name."
        );

        return;
      }

      const existingProduct = cart.find(
        (item) => item.id === product.id
      );

      if (existingProduct) {
        existingProduct.quantity =
          sanitizeQuantity(existingProduct.quantity) +
          quantityToAdd;

        existingProduct.quantity = Math.min(
          existingProduct.quantity,
          99
        );
      } else {
        cart.push(product);
      }

      saveCart(cart);

showCartPopup(product.name);

const updatedProduct = cart.find(
  (item) => item.id === product.id
);

if (!confirmationMessage || !updatedProduct) {
  return;
}

      const discountRate = getDiscountRate(
        updatedProduct.quantity
      );

      confirmationMessage.textContent =
        discountRate > 0
          ? `${quantityToAdd} added to your cart. ` +
            `${discountRate * 100}% bulk discount ` +
            `is active for this product.`
          : `${quantityToAdd} added to your cart.`;

      confirmationMessage.classList.add("visible");

      window.setTimeout(() => {
        confirmationMessage.classList.remove("visible");
      }, 4000);
    });

    refreshBulkMessage();
  }

  function initializeCartPage() {
    const cartItemsContainer =
      document.getElementById("cart-items");

    if (!cartItemsContainer) {
      return;
    }

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
      const totals = calculateCartTotals(cart);

      const shipping =
        cart.length === 0
          ? 0
          : totals.discountedSubtotal >=
              FREE_SHIPPING_THRESHOLD
            ? 0
            : SHIPPING_RATE;

      const finalTotal =
        totals.discountedSubtotal + shipping;

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
            totals.discountedSubtotal
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
          "Free FedEx 2Day shipping unlocked.";

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
        `to unlock free FedEx 2Day shipping.`;

      shippingMessageElement.classList.remove(
        "free-shipping-unlocked"
      );
    }

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

      if (checkoutStatusMessage) {
        checkoutStatusMessage.textContent =
          "Checkout setup is the next step. " +
          "Your cart has been saved.";
      }
    });

    renderCart();
  }

  updateCartCount();
  initializeProductPurchase();
  initializeCartPage();
});