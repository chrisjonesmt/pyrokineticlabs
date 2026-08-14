document.addEventListener("DOMContentLoaded", () => {

  const CONFIRMATION_STORAGE_KEY =
    "pyroKineticLabsOrderConfirmation";


  /*
  PAYMENT DETAILS

  Update these values here whenever
  a payment destination changes.
  */

  const PAYMENT_DETAILS = {

    venmo: {
      label: "Venmo Business",
      destination: "@PKLabs"
    },

    cashapp: {
      label: "Cash App Business",
      destination: "$PKLPLACEHOLDER"
    },

    zelle: {
      label: "Zelle",
      destination: "support@pyrokineticlabs.com"
    }

  };


  function formatCurrency(value) {

    return new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency: "USD"
      }
    ).format(Number(value) || 0);

  }


  function getConfirmation() {

    try {

      const savedConfirmation =
        sessionStorage.getItem(
          CONFIRMATION_STORAGE_KEY
        );


      if (!savedConfirmation) {
        return null;
      }


      return JSON.parse(
        savedConfirmation
      );

    } catch (error) {

      console.error(
        "Unable to read order confirmation:",
        error
      );

      return null;

    }

  }


  const confirmation =
    getConfirmation();


  /*
  Prevent somebody from navigating directly
  to the confirmation page without an order.
  */

  if (
    !confirmation ||
    !confirmation.orderNumber
  ) {

    window.location.href =
      "shop.html";

    return;

  }


  const orderNumberElement =
    document.getElementById(
      "confirmation-order-number"
    );

  const paymentOrderNumberElement =
    document.getElementById(
      "payment-order-number"
    );

  const totalElement =
    document.getElementById(
      "confirmation-total"
    );

  const paymentMethodElement =
    document.getElementById(
      "confirmation-payment-method"
    );

  const emailElement =
    document.getElementById(
      "confirmation-email"
    );

  const instructionElement =
    document.getElementById(
      "payment-instruction-text"
    );

  const destinationElement =
    document.getElementById(
      "payment-destination-value"
    );


  const paymentDetails =
    PAYMENT_DETAILS[
      confirmation.paymentMethod
    ];


  if (orderNumberElement) {

    orderNumberElement.textContent =
      confirmation.orderNumber;

  }


  if (paymentOrderNumberElement) {

    paymentOrderNumberElement.textContent =
      confirmation.orderNumber;

  }


  if (totalElement) {

    totalElement.textContent =
      formatCurrency(
        confirmation.total
      );

  }


  if (emailElement) {

    emailElement.textContent =
      confirmation.customerEmail ||
      "Not provided";

  }


  if (paymentMethodElement) {

    paymentMethodElement.textContent =
      paymentDetails?.label ||
      "Selected payment method";

  }


  if (destinationElement) {

    destinationElement.textContent =
      paymentDetails?.destination ||
      "Payment details unavailable";

  }


  if (instructionElement) {

    instructionElement.textContent =
      "Send the exact order total using your selected payment method. " +
      "To help us match your payment quickly and avoid delays, " +
      "please enter only your PKL order number in the payment note. " +
      "Please do not include product names or other order details.";

  }

});