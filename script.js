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
    const response = await fetch("content.json");
    if (!response.ok) {
      throw new Error("Не удалось загрузить content.json");
    }
    return response.json();
  }

  function renderContent(data) {
    const { couple, hero, venue, schedule, wishes, organizer, footer } = data;

    $("couple-names").textContent = `${couple.name1} и ${couple.name2}`;
    $("hero-tagline").textContent = hero.tagline;
    $("hero-date").textContent = hero.dateDisplay;

    $("countdown-label").textContent = data.countdown.label;

    $("venue-name").textContent = venue.name;
    $("venue-address").textContent = venue.address;
    $("venue-note").textContent = venue.note;

    const mapsLink = $("venue-maps");
    mapsLink.href = venue.mapsUrl;
    mapsLink.textContent = venue.mapsButton;

    $("schedule-title").textContent = schedule.title;
    $("schedule-list").replaceChildren(
      ...schedule.items.map((item) => {
        const li = document.createElement("li");
        li.className = "schedule__item reveal";
        const description = item.description || item.note || "";
        li.innerHTML = `
          <time class="schedule__time" datetime="${toDatetime(item.time)}">${escapeHtml(item.time)}</time>
          <div class="schedule__body">
            <h3 class="schedule__title">${escapeHtml(item.title)}</h3>
            ${description ? `<p class="schedule__description">${escapeHtml(description)}</p>` : ""}
          </div>
        `;
        return li;
      })
    );

    $("wishes-title").textContent = wishes.title;
    $("wishes-list").replaceChildren(
      ...wishes.items.map((item) => {
        const article = document.createElement("article");
        article.className = "wishes__item reveal";
        article.innerHTML = `
          <h3 class="wishes__heading">${escapeHtml(item.heading)}</h3>
          <p class="wishes__text">${escapeHtml(item.text)}</p>
        `;
        return article;
      })
    );

    $("organizer-title").textContent = organizer.title;
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
    const wrap = $("venue-image-wrap");
    const placeholder = $("venue-placeholder");

    img.alt = venue.name;

    const showPlaceholder = () => {
      img.hidden = true;
      placeholder.hidden = false;
      wrap.classList.remove("venue__image-wrap--loaded");
    };

    const showImage = () => {
      img.hidden = false;
      placeholder.hidden = true;
      wrap.classList.add("venue__image-wrap--loaded");
    };

    img.addEventListener("load", showImage);
    img.addEventListener("error", showPlaceholder);

    if (venue.image) {
      img.src = venue.image;
    } else {
      showPlaceholder();
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
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 }
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
