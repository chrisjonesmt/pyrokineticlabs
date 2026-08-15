const SUPABASE_URL =
  "https://yrztgpmuzyhfhcvpzerp.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_TbjhLLv1HTaFjKWN5xP8og_veGXz_Tg";

function formatCurrency(value) {
  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD"
    }
  ).format(Number(value) || 0);
}


async function loadProducts() {

  const url =
    `${SUPABASE_URL}/rest/v1/Products` +
    `?select=product_id,name,price,inventory_quantity,low_stock_threshold,active` +
    `&active=eq.true`;


  const response =
    await fetch(
      url,
      {
        headers: {
          apikey:
            SUPABASE_PUBLISHABLE_KEY
        }
      }
    );


  if (!response.ok) {

    const errorText =
      await response.text();

    console.error(
      "Unable to load product data:",
      errorText
    );

    throw new Error(
      "Unable to load product data."
    );

  }


  return await response.json();
}


function updateProductCard(
  card,
  product
) {

  const priceElement =
    card.querySelector(
      ".product-price-card"
    );

  const stockElement =
    card.querySelector(
      ".product-stock"
    );


  if (priceElement) {
    priceElement.textContent =
      formatCurrency(product.price);
  }


  if (!stockElement) {
    return;
  }


  const inventory =
    Number(
      product.inventory_quantity
    ) || 0;

    
  const lowStockThreshold =
    Number(
      product.low_stock_threshold
    ) || 0;


  if (inventory <= 0) {

    stockElement.textContent =
      "Sold Out";

    stockElement.className =
      "product-stock sold-out";

    return;
  }


  if (
    inventory <=
    lowStockThreshold
  ) {

    stockElement.textContent =
      `Only ${inventory} left`;

    stockElement.className =
      "product-stock low-stock";

    return;
  }


  stockElement.textContent =
    `${inventory} in stock`;

  stockElement.className =
    "product-stock in-stock";
}


async function updateProductCards() {

  const products =
    await loadProducts();


  const productMap =
    new Map(
      products.map(
        (product) => [
          product.product_id,
          product
        ]
      )
    );


  document
    .querySelectorAll(
      "[data-product-id]"
    )
    .forEach(
      (card) => {

        const productId =
          card.dataset.productId;


        const product =
          productMap.get(
            productId
          );


        if (!product) {
          return;
        }


        updateProductCard(
          card,
          product
        );

      }
    );
    const purchase =
  document.querySelector(
    ".product-purchase[data-product-id]"
  );


if (purchase) {

  const productId =
    purchase.dataset.productId;


  const product =
    productMap.get(
      productId
    );


  if (product) {

    updateProductPurchase(
      purchase,
      product
    );

  }

}
}

function updateProductPurchase(
  purchase,
  product
) {

  const stockElement =
    purchase.querySelector(
      ".product-stock"
    );

  const quantityInput =
    purchase.querySelector(
      ".product-quantity"
    );

  const plusButton =
    purchase.querySelector(
      ".quantity-plus"
    );

  const minusButton =
    purchase.querySelector(
      ".quantity-minus"
    );

  const addToCartButton =
    purchase.querySelector(
      ".add-to-cart-button"
    );


  const inventory =
    Number(
      product.inventory_quantity
    ) || 0;

    purchase.dataset.productInventory =
  String(inventory);
    
  const lowStockThreshold =
    Number(
      product.low_stock_threshold
    ) || 0;


  purchase.dataset.productPrice =
    String(product.price);


  if (stockElement) {

    if (inventory <= 0) {

      stockElement.textContent =
        "Sold Out";

      stockElement.className =
        "product-stock sold-out";

    } else if (
      inventory <=
      lowStockThreshold
    ) {

      stockElement.textContent =
        `Only ${inventory} left`;

      stockElement.className =
        "product-stock low-stock";

    } else {

      stockElement.textContent =
        `${inventory} in stock`;

      stockElement.className =
        "product-stock in-stock";

    }

  }


  if (quantityInput) {

    quantityInput.max =
      String(
        Math.max(
          inventory,
          1
        )
      );


    quantityInput.addEventListener(
      "input",
      () => {

        let value =
          Number.parseInt(
            quantityInput.value,
            10
          );


        if (
          !Number.isFinite(value) ||
          value < 1
        ) {
          value = 1;
        }


        if (
          inventory > 0 &&
          value > inventory
        ) {
          value = inventory;
        }


        quantityInput.value =
          String(value);

      }
    );

  }


  if (plusButton && quantityInput) {

    plusButton.addEventListener(
      "click",
      () => {

        const current =
          Number.parseInt(
            quantityInput.value,
            10
          ) || 1;


        if (
          inventory > 0 &&
          current >= inventory
        ) {

          quantityInput.value =
            String(inventory);

        }

      }
    );

  }


  if (minusButton) {
    minusButton.disabled =
      inventory <= 0;
  }


  if (plusButton) {
    plusButton.disabled =
      inventory <= 0;
  }


  if (addToCartButton) {

    if (inventory <= 0) {

      addToCartButton.disabled =
        true;

      addToCartButton.textContent =
        "Sold Out";

    } else {

      addToCartButton.disabled =
        false;

      addToCartButton.textContent =
        "Add to Cart";

    }

  }

  purchase.dispatchEvent(
  new CustomEvent(
    "pkl:inventory-updated"
  )
);

}

window.PKLProducts = {
  loadProducts,
  updateProductCards
};