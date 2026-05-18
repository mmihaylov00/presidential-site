(function () {
  const donationDialog = document.querySelector("[data-donation-dialog]");
  const donationTriggers = document.querySelectorAll("[data-donate-trigger]");
  const shareTriggers = document.querySelectorAll("[data-share-trigger]");
  const forms = document.querySelectorAll("[data-volunteer-form], [data-newsletter-form]");
  const reveals = document.querySelectorAll(".reveal");
  const scrollProgress = document.querySelector("[data-scroll-progress]");
  const regionMaps = document.querySelectorAll("[data-region-map]");
  const regionalEventStages = Array.from(document.querySelectorAll("[data-regional-events-stage]"));
  let regionalEventFrame;
  let isSyncingRegionalEvents = false;

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
        alert.textContent = form.matches("[data-newsletter-form]")
          ? "Тестов абонамент успешен. Email не е записан или изпратен."
          : "Тестово изпращане успешно. Данни не са записани или изпратени.";
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

  regionMaps.forEach((map) => {
    const pins = Array.from(map.querySelectorAll("[data-map-pin]"));
    const cards = Array.from(map.querySelectorAll("[data-event-card]"));
    const mapVisual = map.querySelector(".region-map");
    const activePanel = map.querySelector("[data-active-event-panel]");
    const activeLayer = activePanel?.querySelector("[data-active-event-layer]");
    const activeDate = activePanel?.querySelector("[data-active-event-date]");
    const activeCity = activePanel?.querySelector("[data-active-event-city]");
    const activeText = activePanel?.querySelector("[data-active-event-text]");
    const activeMeta = activePanel?.querySelector("[data-active-event-meta]");
    const rotationDelay = 15000;
    let activeIndex = 0;
    let rotationTimer;
    let isPaused = false;

    function getCardData(card) {
      return {
        date: card.querySelector("small")?.textContent || "",
        city: card.querySelector("h3")?.textContent || "",
        text: card.querySelector("p")?.textContent || "",
        meta: card.querySelector("strong")?.textContent || ""
      };
    }

    function updateActivePanel(card) {
      if (!activePanel || !card) {
        return;
      }

      const data = getCardData(card);
      const isSameCard =
        activeCity?.textContent === data.city && activeDate?.textContent === data.date;
      const shouldAnimate = activeLayer && !isSameCard;

      if (shouldAnimate) {
        const previousLayer = activeLayer.cloneNode(true);
        previousLayer.classList.add("active-event-card-layer-previous");
        previousLayer.setAttribute("aria-hidden", "true");
        previousLayer.removeAttribute("data-active-event-layer");
        previousLayer
          .querySelectorAll(
            "[data-active-event-date], [data-active-event-city], [data-active-event-text], [data-active-event-meta]"
          )
          .forEach((element) => {
            element.removeAttribute("data-active-event-date");
            element.removeAttribute("data-active-event-city");
            element.removeAttribute("data-active-event-text");
            element.removeAttribute("data-active-event-meta");
          });

        activePanel.querySelectorAll(".active-event-card-layer-previous").forEach((layer) => {
          layer.remove();
        });
        activePanel.append(previousLayer);
        window.setTimeout(() => previousLayer.remove(), 650);
      }

      if (activeDate) {
        activeDate.textContent = data.date;
      }
      if (activeCity) {
        activeCity.textContent = data.city;
      }
      if (activeText) {
        activeText.textContent = data.text;
      }
      if (activeMeta) {
        activeMeta.textContent = data.meta;
      }

      if (shouldAnimate) {
        activeLayer.classList.remove("is-placing");
        window.requestAnimationFrame(() => {
          activeLayer.classList.add("is-placing");
        });
      }
    }

    function setActive(city, region) {
      map.dataset.active = city;
      map.dataset.activeRegion = region;

      if (mapVisual) {
        mapVisual.dataset.activeRegion = region;
      }

      pins.forEach((pin) => {
        const isActive = pin.dataset.mapPin === city;
        pin.classList.toggle("is-active", isActive);
        pin.setAttribute("aria-current", isActive ? "true" : "false");
      });

      cards.forEach((card) => {
        const isActive = card.dataset.eventCard === city;
        card.classList.toggle("is-active", isActive);
        if (isActive) {
          activeIndex = cards.indexOf(card);
          updateActivePanel(card);
        }
      });
    }

    function scheduleRotation() {
      window.clearTimeout(rotationTimer);
      if (isPaused || cards.length < 2) {
        return;
      }

      rotationTimer = window.setTimeout(() => {
        const nextCard = cards[(activeIndex + 1) % cards.length];
        setActive(nextCard.dataset.eventCard, nextCard.dataset.region);
        scheduleRotation();
      }, rotationDelay);
    }

    function pauseRotation(city, region) {
      isPaused = true;
      window.clearTimeout(rotationTimer);
      setActive(city, region);
    }

    function isPauseTarget(target) {
      return Boolean(
        target &&
          target.closest &&
          target.closest("[data-map-pin], [data-event-card], [data-active-event-panel]")
      );
    }

    function resumeRotation(event) {
      if (isPauseTarget(event.relatedTarget)) {
        return;
      }

      isPaused = false;
      scheduleRotation();
    }

    pins.forEach((pin) => {
      const city = pin.dataset.mapPin;
      const region = pin.dataset.region;

      pin.addEventListener("mouseenter", () => pauseRotation(city, region));
      pin.addEventListener("focus", () => pauseRotation(city, region));
      pin.addEventListener("mouseleave", resumeRotation);
      pin.addEventListener("blur", resumeRotation);
    });

    cards.forEach((card) => {
      const city = card.dataset.eventCard;
      const region = card.dataset.region;

      card.addEventListener("mouseenter", () => pauseRotation(city, region));
      card.addEventListener("focus", () => pauseRotation(city, region));
      card.addEventListener("click", () => pauseRotation(city, region));
      card.addEventListener("mouseleave", resumeRotation);
      card.addEventListener("blur", resumeRotation);
    });

    if (activePanel && cards.length > 0) {
      activePanel.addEventListener("mouseenter", () => {
        isPaused = true;
        window.clearTimeout(rotationTimer);
      });
      activePanel.addEventListener("focus", () => {
        isPaused = true;
        window.clearTimeout(rotationTimer);
      });
      activePanel.addEventListener("mouseleave", resumeRotation);
      activePanel.addEventListener("blur", resumeRotation);
    }

    if (cards.length > 0) {
      setActive(cards[0].dataset.eventCard, cards[0].dataset.region);
      scheduleRotation();
    }
  });

  function getStickyTop(element) {
    const top = window.getComputedStyle(element).top;
    const value = Number.parseFloat(top);
    return Number.isNaN(value) ? 0 : value;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function getRegionalEventStageMetrics(stage) {
    const viewport = stage.querySelector("[data-regional-events-viewport]");
    const track = stage.querySelector("[data-regional-events-track]");
    const scrollRoot = stage.closest("[data-region-map]") || stage;
    const stickyGrid = scrollRoot.querySelector(".regional-map-grid") || viewport;

    if (!viewport || !track) {
      return undefined;
    }

    const distance = Math.max(0, track.scrollWidth - viewport.clientWidth);
    const stickyTop = getStickyTop(stickyGrid);
    const scrollRootTop = scrollRoot.getBoundingClientRect().top + window.scrollY;

    return {
      distance,
      scrollRoot,
      scrollStart: scrollRootTop - stickyTop,
      stickyGrid,
      viewport
    };
  }

  function updateRegionalEventStage(stage) {
    const metrics = getRegionalEventStageMetrics(stage);

    if (!metrics) {
      return;
    }

    const { distance, scrollRoot, scrollStart, stickyGrid, viewport } = metrics;

    if (distance < 1) {
      stage.classList.add("is-static");
      scrollRoot.classList.add("is-static");
      scrollRoot.style.removeProperty("--regional-map-scroll-height");
      viewport.scrollLeft = 0;
      return;
    }

    stage.classList.remove("is-static");
    scrollRoot.classList.remove("is-static");
    scrollRoot.style.setProperty(
      "--regional-map-scroll-height",
      `${Math.ceil(stickyGrid.offsetHeight + distance)}px`
    );

    const progress = clamp((window.scrollY - scrollStart) / distance, 0, 1);
    const nextScrollLeft = distance * progress;

    if (Math.abs(viewport.scrollLeft - nextScrollLeft) > 0.5) {
      isSyncingRegionalEvents = true;
      viewport.scrollLeft = nextScrollLeft;
      window.requestAnimationFrame(() => {
        isSyncingRegionalEvents = false;
      });
    }
  }

  function updateRegionalEventStages() {
    regionalEventFrame = undefined;
    regionalEventStages.forEach(updateRegionalEventStage);
  }

  function requestRegionalEventStageUpdate() {
    if (!regionalEventStages.length || regionalEventFrame) {
      return;
    }

    regionalEventFrame = window.requestAnimationFrame(updateRegionalEventStages);
  }

  regionalEventStages.forEach((stage) => {
    const viewport = stage.querySelector("[data-regional-events-viewport]");

    if (!viewport) {
      return;
    }

    viewport.addEventListener(
      "scroll",
      () => {
        if (isSyncingRegionalEvents) {
          return;
        }

        const metrics = getRegionalEventStageMetrics(stage);

        if (!metrics || metrics.distance < 1) {
          return;
        }

        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo({
          top: clamp(metrics.scrollStart + viewport.scrollLeft, 0, maxScroll),
          left: 0,
          behavior: "auto"
        });
        updateScrollProgress();
      },
      { passive: true }
    );
  });

  function updateScrollProgress() {
    if (!scrollProgress) {
      return;
    }

    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
    scrollProgress.style.width = `${Math.min(progress * 100, 100)}%`;
  }

  updateScrollProgress();
  updateRegionalEventStages();
  window.addEventListener(
    "scroll",
    () => {
      updateScrollProgress();
      requestRegionalEventStageUpdate();
    },
    { passive: true }
  );
  window.addEventListener("resize", () => {
    updateScrollProgress();
    updateRegionalEventStages();
  });

  if ("ResizeObserver" in window && regionalEventStages.length) {
    const regionalEventsObserver = new ResizeObserver(updateRegionalEventStages);
    regionalEventStages.forEach((stage) => regionalEventsObserver.observe(stage));
  }

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
