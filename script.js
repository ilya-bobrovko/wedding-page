(function () {
  const $ = (id) => document.getElementById(id);

  let countdownTarget = null;
  let countdownTimer = null;

  async function init() {
    const content = await loadContent();
    renderContent(content);
    setupVenueImage(content.venue);
    setupCountdown(content.countdown);
    setupReveal();
    showHeroImmediately();
  }

  async function loadContent() {
    const response = await fetch("content.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Не удалось загрузить content.json");
    }
    return response.json();
  }

  function renderContent(data) {
    const { couple, hero, venue, details, dressCode, schedule, guestProfile, wishes, organizer, footer } = data;

    $("couple-names").textContent = `${couple.name1} и ${couple.name2}`;
    $("hero-tagline").textContent = hero.tagline;
    $("hero-date").textContent = hero.dateDisplay;

    $("countdown-label").textContent = data.countdown.label;

    $("venue-title").textContent = venue.title || "Место проведения";
    $("venue-name").textContent = venue.name;
    $("venue-address").textContent = venue.address;
    $("venue-note").textContent = venue.note || "";
    $("venue-note").hidden = !venue.note;

    const mapsLink = $("venue-maps");
    mapsLink.href = venue.mapsUrl;
    $("venue-maps-text").textContent = venue.mapsButton;

    if (details) {
      $("details-title").textContent = details.title || "Детали";
      $("details-text").textContent = details.text || "";
      const checkInEl = $("details-checkin");
      if (details.checkIn) {
        checkInEl.textContent = details.checkIn;
        checkInEl.hidden = false;
      } else {
        checkInEl.hidden = true;
      }
      document.getElementById("details").hidden = false;
    } else {
      document.getElementById("details").hidden = true;
    }

    $("dresscode-title").textContent = dressCode.title || "Дресс-код";
    $("dresscode-text").textContent = dressCode.text;

    const paletteEl = $("dresscode-palette");
    if (dressCode.colors?.length) {
      paletteEl.replaceChildren(
        ...dressCode.colors.map((color) => {
          const hex = typeof color === "string" ? color : color.hex;
          const li = document.createElement("li");
          li.className = "dresscode__swatch";
          li.setAttribute("role", "listitem");
          li.style.backgroundColor = hex;
          li.setAttribute("aria-label", hex);
          return li;
        })
      );
      paletteEl.hidden = false;
    } else {
      paletteEl.hidden = true;
    }

    $("schedule-title").textContent = schedule.title;

    $("schedule-list").replaceChildren(
      ...schedule.items.map((item) => {
        const li = document.createElement("li");
        li.className = "schedule__item";
        const label = item.title
          ? `<p class="schedule__label">${escapeHtml(item.title)}</p>`
          : "";
        li.innerHTML = `
          <time class="schedule__time" datetime="${toDatetime(item.time)}">${escapeHtml(item.time)}</time>
          ${label}
        `;
        return li;
      })
    );

    if (guestProfile) {
      $("guest-profile-title").textContent = guestProfile.title || "Гостевой чат";
      $("guest-profile-text").textContent = guestProfile.text || "";

      const guestProfileButton = $("guest-profile-button");
      guestProfileButton.href = guestProfile.chatUrl || "#";
      guestProfileButton.textContent = guestProfile.button || "Вступить в чат";
      document.getElementById("guest-profile").hidden = false;
    } else {
      document.getElementById("guest-profile").hidden = true;
    }

    $("wishes-title").textContent = wishes.title;
    $("wishes-list").replaceChildren(
      ...wishes.items.map((item) => {
        const article = document.createElement("article");
        article.className = "card wishes__item reveal";
        article.innerHTML = `
          <h3 class="wishes__heading">${escapeHtml(item.heading)}</h3>
          <p class="wishes__text">${escapeHtml(item.text)}</p>
        `;
        return article;
      })
    );

    $("organizer-title").textContent = organizer.title;
    $("organizer-text").textContent = organizer.text || "";
    $("organizer-text").hidden = !organizer.text;
    $("organizer-name").textContent = organizer.name;

    const phoneLink = $("organizer-phone");
    phoneLink.href = organizer.phoneHref;
    phoneLink.textContent = organizer.phone;

    const telegramLink = $("organizer-telegram");
    telegramLink.href = organizer.telegramUrl;
    telegramLink.textContent = organizer.telegram;

    $("footer-text").textContent = footer.text;

    document.title = `${couple.name1} и ${couple.name2} — ${hero.dateDisplay}`;
  }

  function setupVenueImage(venue) {
    const img = $("venue-image");
    const fallback = $("venue-icon-fallback");
    const icon = $("venue-icon");

    img.alt = venue.name;

    const showFallback = () => {
      img.hidden = true;
      fallback.hidden = false;
      fallback.style.display = "";
      icon.classList.remove("venue__icon--photo");
    };

    const showPhoto = () => {
      img.hidden = false;
      fallback.hidden = true;
      fallback.style.display = "none";
      icon.classList.add("venue__icon--photo");
    };

    img.addEventListener("load", showPhoto);
    img.addEventListener("error", showFallback);

    if (venue.image) {
      img.src = venue.image;
    } else {
      showFallback();
    }
  }

  function setupCountdown(countdown) {
    countdownTarget = new Date(countdown.target);
    tickCountdown();
    countdownTimer = setInterval(tickCountdown, 1000);
  }

  function tickCountdown() {
    const now = Date.now();
    const diff = countdownTarget.getTime() - now;

    if (diff <= 0) {
      clearInterval(countdownTimer);
      $("countdown-grid").hidden = true;
      $("countdown-done").hidden = false;
      return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    $("cd-days").textContent = String(days);
    $("cd-hours").textContent = String(hours).padStart(2, "0");
    $("cd-minutes").textContent = String(minutes).padStart(2, "0");
    $("cd-seconds").textContent = String(seconds).padStart(2, "0");
  }

  function setupReveal() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.08 }
    );

    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
  }

  function showHeroImmediately() {
    requestAnimationFrame(() => {
      document.querySelectorAll(".hero__content .reveal").forEach((el) => {
        el.classList.add("is-visible");
      });
    });
  }

  function toDatetime(time) {
    return `2026-08-03T${time.replace(".", ":")}:00`;
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  init().catch((err) => {
    console.error(err);
    document.body.innerHTML =
      '<p style="padding:2rem;text-align:center;font-family:serif;">Не удалось загрузить приглашение. Проверьте файл content.json.</p>';
  });
})();
