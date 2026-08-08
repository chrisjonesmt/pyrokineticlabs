document.addEventListener("DOMContentLoaded", () => {

  /* =========================================
     FAQ ACCORDION
  ========================================= */

  const faqQuestions = document.querySelectorAll(".faq-question");

  faqQuestions.forEach((question) => {
    question.addEventListener("click", () => {
      const answer = question.nextElementSibling;
      const icon = question.querySelector("span");

      const isOpen = answer.classList.contains("open");

      document.querySelectorAll(".faq-answer").forEach((item) => {
        item.classList.remove("open");
      });

      document.querySelectorAll(".faq-question span").forEach((item) => {
        item.textContent = "+";
      });

      if (!isOpen) {
        answer.classList.add("open");

        if (icon) {
          icon.textContent = "−";
        }
      }
    });
  });


  /* =========================================
     SITE DISCLAIMER MODAL
  ========================================= */

  const overlay = document.getElementById("disclaimerOverlay");
  const ageCheck = document.getElementById("ageCheck");
  const researchCheck = document.getElementById("researchCheck");
  const enterButton = document.getElementById("disclaimerEnter");
  const exitButton = document.getElementById("disclaimerExit");

  if (
    overlay &&
    ageCheck &&
    researchCheck &&
    enterButton &&
    exitButton
  ) {

    const accepted = localStorage.getItem("pklDisclaimerAccepted");

    if (accepted === "true") {
      overlay.classList.add("hidden");
    }

    function updateButtonState() {
      enterButton.disabled = !(
        ageCheck.checked &&
        researchCheck.checked
      );
    }

    ageCheck.addEventListener("change", updateButtonState);
    researchCheck.addEventListener("change", updateButtonState);

    enterButton.addEventListener("click", () => {
      if (!ageCheck.checked || !researchCheck.checked) {
        return;
      }

      localStorage.setItem("pklDisclaimerAccepted", "true");
      overlay.classList.add("hidden");
    });

    exitButton.addEventListener("click", () => {
      window.location.href = "https://www.google.com/";
    });

    updateButtonState();
  }

});