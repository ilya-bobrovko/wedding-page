(function () {
  const $ = (id) => document.getElementById(id);

  let countdownTarget = null;
  let countdownTimer = null;

  async function init() {
    const content = await loadContent();
    renderContent(content);
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
    const {
      couple,
      hero,
      countdown,
      venue,
      details,
      dressCode,
      schedule,
      guestProfile,
      wishes,
      organizer,
      footer,
    } = data;

    // Hero — names stacked, with script ampersand
    $("couple-name-1").textContent = couple.name1;
    $("couple-name-2").textContent = couple.name2;
    $("hero-tagline").textContent = hero.tagline;
    $("hero-date").textContent = hero.dateDisplay;

    // Countdown
    if (countdown.label) {
      // Allow override but default is set in HTML
      $("countdown-label").textContent = countdown.label.replace(/^До нашего праздника\s*/i, "").trim() || "осталось";
    }

    // Venue
    $("venue-title").textContent = (venue.title || "Место проведения")
      .replace(/^Место(\s+проведения)?$/i, "проведения");
    $("venue-name").textContent = venue.name;
    $("venue-address").textContent = venue.address;
    const noteEl = $("venue-note");
    noteEl.textContent = venue.note || "";
    noteEl.hidden = !venue.note;

    const mapsLink = $("venue-maps");
    mapsLink.href = venue.mapsUrl;
    $("venue-maps-text").textContent = venue.mapsButton;

    const venueImg = $("venue-image");
    venueImg.alt = venue.name;
    if (venue.image) venueImg.src = venue.image;

    // Details
    if (details) {
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

    // Dress code
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

    // Schedule — vertical timeline
    $("schedule-list").replaceChildren(
      ...schedule.items.map((item) => {
        const li = document.createElement("li");
        li.className = "schedule__item";
        li.innerHTML = `
          <time class="schedule__time" datetime="${toDatetime(item.time)}">${escapeHtml(item.time)}</time>
          <span class="schedule__dot" aria-hidden="true"></span>
          <p class="schedule__label">${escapeHtml(item.title || "")}</p>
        `;
        return li;
      })
    );

    // Guest profile
    if (guestProfile) {
      $("guest-profile-text").textContent = guestProfile.text || "";
      const btn = $("guest-profile-button");
      btn.href = guestProfile.chatUrl || "#";
      btn.textContent = guestProfile.button || "Вступить в чат";
      document.getElementById("guest-profile").hidden = false;
    } else {
      document.getElementById("guest-profile").hidden = true;
    }

    // Wishes — three columns
    $("wishes-list").replaceChildren(
      ...wishes.items.map((item) => {
        const li = document.createElement("li");
        li.className = "wishes__item reveal";
        li.innerHTML = `
          <h3 class="wishes__heading">${escapeHtml(item.heading)}</h3>
          <p class="wishes__text">${escapeHtml(item.text)}</p>
        `;
        return li;
      })
    );

    // Organizer
    $("organizer-text").textContent = organizer.text || "";
    $("organizer-text").hidden = !organizer.text;
    $("organizer-name").textContent = organizer.name;

    const phoneLink = $("organizer-phone");
    phoneLink.href = organizer.phoneHref;
    phoneLink.textContent = organizer.phone;

    const telegramLink = $("organizer-telegram");
    telegramLink.href = organizer.telegramUrl;
    telegramLink.textContent = organizer.telegram;

    // Footer — monogram, date, sign-off
    const m1 = (couple.name1 || "").trim().charAt(0);
    const m2 = (couple.name2 || "").trim().charAt(0);
    if (m1 && m2) $("footer-monogram").textContent = `${m1} & ${m2}`;
    $("footer-date").textContent = hero.dateDisplay;
    $("footer-text").textContent = footer.text;

    document.title = `${couple.name1} и ${couple.name2} — ${hero.dateDisplay}`;
  }

  function setupCountdown(countdown) {
    countdownTarget = new Date(countdown.target);
    tickCountdown();
    // Tick once a minute — no seconds shown, so no need for 1s timer
    countdownTimer = setInterval(tickCountdown, 30 * 1000);
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

    $("cd-days").textContent = String(days);
    $("cd-hours").textContent = String(hours).padStart(2, "0");
    $("cd-minutes").textContent = String(minutes).padStart(2, "0");
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
