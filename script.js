(function () {
  const donationDialog = document.querySelector("[data-donation-dialog]");
  const donationTriggers = document.querySelectorAll("[data-donate-trigger]");
  const shareTriggers = document.querySelectorAll("[data-share-trigger]");
  const forms = document.querySelectorAll("[data-volunteer-form]");
  const reveals = document.querySelectorAll(".reveal");

  function showDonationDialog() {
    if (!donationDialog) {
      return;
    }

    if (typeof donationDialog.showModal === "function") {
      donationDialog.showModal();
    } else {
      window.alert("Даренията ще бъдат активирани след юридическо потвърждение.");
    }
  }

  donationTriggers.forEach((trigger) => {
    trigger.addEventListener("click", showDonationDialog);
  });

  forms.forEach((form) => {
    const alert = form.querySelector("[data-form-alert]");

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        if (alert) {
          alert.textContent = "Моля, попълни всички полета и потвърди, че формата е тестова.";
          alert.className = "form-alert is-error";
        }
        return;
      }

      form.reset();
      if (alert) {
        alert.textContent = "Тестово изпращане успешно. Данни не са записани или изпратени.";
        alert.className = "form-alert is-success";
      }
    });
  });

  shareTriggers.forEach((trigger) => {
    trigger.addEventListener("click", async () => {
      const shareData = {
        title: document.title,
        text: "Пробна страница за президентска кампания.",
        url: window.location.href
      };

      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch (error) {
          if (error.name !== "AbortError") {
            window.alert("Споделянето не беше завършено.");
          }
        }
        return;
      }

      try {
        await navigator.clipboard.writeText(window.location.href);
        const originalText = trigger.textContent;
        trigger.textContent = "Линкът е копиран";
        window.setTimeout(() => {
          trigger.textContent = originalText;
        }, 1800);
      } catch {
        window.alert(window.location.href);
      }
    });
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14 }
    );

    reveals.forEach((element) => observer.observe(element));
  } else {
    reveals.forEach((element) => element.classList.add("is-visible"));
  }
})();
