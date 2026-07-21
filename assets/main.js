if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

function resetInitialScroll() {
  if (window.location.hash) return;
  window.scrollTo(0, 0);
  window.setTimeout(() => window.scrollTo(0, 0), 80);
}

window.addEventListener("pageshow", resetInitialScroll);

const weddingMoment = new Date("2027-06-05T14:30:00+02:00");
const weddingEnd = new Date("2027-06-06T00:00:00+02:00");

function updateCountdown() {
  const now = new Date();
  const diff = weddingMoment - now;
  const ids = ["days","hours","minutes","seconds"];
  if (diff <= 0) {
    ids.forEach(id => document.getElementById(id).textContent = "00");
    const countdown = document.querySelector(".countdown");
    const date = document.querySelector(".countdown-date");
    countdown?.classList.add("event-mode");
    if (date) {
      date.textContent = now < weddingEnd
        ? "Heute ist es so weit ✦"
        : "Danke für diesen besonderen Tag ✦";
    }
    return;
  }
  const values = [
    Math.floor(diff / 86400000),
    Math.floor((diff % 86400000) / 3600000),
    Math.floor((diff % 3600000) / 60000),
    Math.floor((diff % 60000) / 1000)
  ];
  ids.forEach((id, i) => document.getElementById(id).textContent = String(values[i]).padStart(i === 0 ? 3 : 2, "0"));
}

function weatherLabel(code) {
  if ([0].includes(code)) return ["☀️","Klar"];
  if ([1,2].includes(code)) return ["🌤️","Heiter"];
  if ([3].includes(code)) return ["☁️","Bewölkt"];
  if ([45,48].includes(code)) return ["🌫️","Nebel"];
  if ([51,53,55,56,57].includes(code)) return ["🌦️","Nieselregen"];
  if ([61,63,65,66,67].includes(code)) return ["🌧️","Regen"];
  if ([71,73,75,77].includes(code)) return ["🌨️","Schnee"];
  if ([80,81,82].includes(code)) return ["🌦️","Regenschauer"];
  if ([95,96,99].includes(code)) return ["⛈️","Gewitter"];
  return ["✨","Aktuelles Wetter"];
}

async function loadWeddingWeather() {
  const box = document.getElementById("weather-content");
  const icon = document.getElementById("weather-icon");
  const weddingDay = new Date("2027-06-05T12:00:00+02:00");
  const daysUntilWedding = Math.ceil((weddingDay - new Date()) / 86400000);

  if (daysUntilWedding < 0) {
    icon.textContent = "✦";
    box.innerHTML = `<strong>Was für ein besonderer Tag</strong>
      <small>Danke, dass ihr diesen Moment mit uns geteilt habt.</small>`;
    return;
  }

  if (daysUntilWedding > 16) {
    icon.textContent = "🗓️";
    box.innerHTML = `<strong>Der Hochzeitsausblick kommt näher</strong>
      <small>Eine verlässliche Wetterprognose ist etwa zwei Wochen vor unserer Hochzeit verfügbar.</small>
      <div class="weather-meta">Ab dann findet ihr hier automatisch die Vorhersage für den 05. Juni 2027.</div>`;
    return;
  }

  try {
    const url = "https://api.open-meteo.com/v1/forecast?latitude=48.077&longitude=11.970&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=16&timezone=Europe%2FBerlin";
    const res = await fetch(url);
    if (!res.ok) throw new Error("weather");
    const data = await res.json();
    const index = data.daily.time.indexOf("2027-06-05");
    if (index < 0) throw new Error("forecast-not-ready");
    const [emoji, label] = weatherLabel(data.daily.weather_code[index]);
    icon.textContent = emoji;
    box.innerHTML = `<strong>${label} · bis ${Math.round(data.daily.temperature_2m_max[index])} °C</strong>
      <small>Voraussichtlich ${Math.round(data.daily.temperature_2m_min[index])} bis ${Math.round(data.daily.temperature_2m_max[index])} °C · Regenwahrscheinlichkeit ${data.daily.precipitation_probability_max[index]} %</small>
      <div class="weather-meta">Vorhersage für Samstag, den 05. Juni 2027 in Ebersberg</div>`;
  } catch {
    icon.textContent = "✨";
    box.innerHTML = `<strong>Der Ausblick ist noch nicht verfügbar</strong><small>Schaut kurz vor unserer Hochzeit noch einmal vorbei.</small>`;
  }
}


function createPublicSupabaseClient() {
  if (!window.supabase || !window.MT_CONFIG) {
    throw new Error("Supabase-Konfiguration fehlt.");
  }

  // Absichtlich ohne gespeicherte Auth-Sitzung:
  // Das öffentliche RSVP nutzt immer die Rolle "anon".
  return window.supabase.createClient(
    window.MT_CONFIG.supabaseUrl,
    window.MT_CONFIG.supabasePublishableKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    }
  );
}

function setupRSVP() {
  const form = document.getElementById("rsvp-form");
  const success = document.getElementById("rsvp-success");
  const attending = document.getElementById("attending-fields");
  const hotelFields = document.getElementById("hotel-fields");
  const personsSelect = document.getElementById("persons");
  const hotelPersonsSelect = document.getElementById("hotelPersons");
  const submitButton = document.getElementById("rsvp-submit");
  const status = document.getElementById("rsvp-status");
  if (!form) return;

  const client = createPublicSupabaseClient();

  function syncHotelPersons() {
    if (!personsSelect || !hotelPersonsSelect) return;
    const maximum = Math.max(1, Number(personsSelect.value || 1));
    const previous = Math.min(maximum, Number(hotelPersonsSelect.value || 1));
    hotelPersonsSelect.replaceChildren(
      ...Array.from({ length: maximum }, (_, index) => {
        const option = document.createElement("option");
        option.value = String(index + 1);
        option.textContent = String(index + 1);
        return option;
      })
    );
    hotelPersonsSelect.value = String(previous);
  }

  function refresh() {
    const yes = document.querySelector('input[name="attendance"]:checked')?.value === "yes";
    const hotel = document.querySelector('input[name="hotel"]:checked')?.value === "yes";
    attending.classList.toggle("hidden", !yes);
    hotelFields.classList.toggle("hidden", !(yes && hotel));
    if (yes) syncHotelPersons();
  }

  document.querySelectorAll('input[name="attendance"],input[name="hotel"]')
    .forEach(element => element.addEventListener("change", refresh));
  personsSelect?.addEventListener("change", syncHotelPersons);
  syncHotelPersons();

  form.addEventListener("submit", async event => {
    event.preventDefault();
    status.className = "form-status";
    status.textContent = "";

    const formData = new FormData(form);
    const attendance = formData.get("attendance");
    const name = String(formData.get("name") || "").trim();

    if (!attendance) {
      status.classList.add("error");
      status.textContent = "Bitte wähle aus, ob du teilnehmen kannst.";
      return;
    }

    if (!name) {
      status.classList.add("error");
      status.textContent = "Bitte gib deinen Namen ein.";
      return;
    }

    const hotelRequested =
      attendance === "yes" && formData.get("hotel") === "yes";

    const payload = {
      name,
      attendance,
      persons: attendance === "yes"
        ? Number(formData.get("persons") || 1)
        : 0,
      hotel: hotelRequested,
      hotel_persons: hotelRequested
        ? Number(formData.get("hotelPersons") || 1)
        : 0,
      hotel_note: hotelRequested
        ? String(formData.get("hotelNote") || "").trim() || null
        : null,
      message: String(formData.get("message") || "").trim() || null
    };

    submitButton.disabled = true;
    submitButton.textContent = "Wird gesendet …";

    const { error } = await client
      .from("rsvp_responses")
      .insert(payload);

    if (error) {
      console.error("Supabase RSVP:", error);
      status.classList.add("error");
      status.innerHTML =
        "<strong>Die Rückmeldung konnte nicht gespeichert werden.</strong><br>" +
        "DEV-Fehler: " + String(error.message || error.code || "Unbekannter Fehler");
      submitButton.disabled = false;
      submitButton.textContent = "Antwort absenden";
      return;
    }

    form.classList.add("hidden");
    success.classList.remove("hidden");
    const successTitle = document.getElementById("rsvp-success-title");
    const successMessage = document.getElementById("rsvp-success-message");
    const successDetail = document.getElementById("rsvp-success-detail");
    if (attendance === "yes") {
      successTitle.textContent = `Wie schön, ${name}!`;
      successMessage.textContent = "Wir freuen uns riesig darauf, diesen besonderen Tag gemeinsam mit euch zu feiern.";
      successDetail.textContent = hotelRequested
        ? "Deinen Zimmerwunsch haben wir vorgemerkt. Wir melden uns, sobald die Reservierung bestätigt ist."
        : "Deine Zusage ist bei uns angekommen.";
    } else {
      successTitle.textContent = `Vielen Dank, ${name}!`;
      successMessage.textContent = "Schade, dass ihr nicht dabei sein könnt – wir werden an euch denken.";
      successDetail.textContent = "Die Rückmeldung ist bei uns angekommen.";
    }
    form.reset();
  });
}


function setupMobileMenu() {
  const button = document.getElementById("menu-toggle");
  const nav = document.getElementById("main-nav");
  const backdrop = document.getElementById("menu-backdrop");
  if (!button || !nav) return;

  const setOpen = open => {
    nav.classList.toggle("open", open);
    button.classList.toggle("active", open);
    backdrop?.classList.toggle("visible", open);
    document.body.classList.toggle("menu-open", open);
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
  };

  button.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    setOpen(!nav.classList.contains("open"));
  });

  backdrop?.addEventListener("click", () => setOpen(false));

  nav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => setOpen(false));
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") setOpen(false);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 760) setOpen(false);
  });
}

function setupScrollTop() {
  const button = document.getElementById("scroll-top");
  if (!button) return;

  const update = () => {
    button.classList.toggle("visible", window.scrollY > 500);
  };

  button.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  window.addEventListener("scroll", update, { passive: true });
  update();
}

function setupHeroHint() {
  const hint = document.querySelector(".scroll-hint");
  if (!hint) return;
  const update = () => hint.classList.toggle("hidden", window.scrollY > 80);
  window.addEventListener("scroll", update, { passive: true });
  update();
}

function setupTwinklingStars() {
  const sky = document.querySelector(".stars");
  if (!sky) return;
  const count = window.innerWidth < 600 ? 38 : 72;
  for (let index = 0; index < count; index += 1) {
    const star = document.createElement("i");
    star.className = "dynamic-star";
    star.style.left = `${(index * 37.17 + 7) % 100}%`;
    star.style.top = `${(index * 61.73 + 11) % 100}%`;
    star.style.setProperty("--blink", `${2.2 + (index % 9) * .31}s`);
    star.style.setProperty("--delay", `${-(index % 13) * .27}s`);
    if (index % 7 === 0) {
      star.style.width = "3px";
      star.style.height = "3px";
    }
    sky.appendChild(star);
  }
}

function startShootingStars() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const launch = () => {
    const star = document.createElement("i");
    star.className = "shooting-star";
    star.style.top = `${8 + Math.random() * 34}%`;
    star.style.left = `${58 + Math.random() * 35}%`;
    document.body.appendChild(star);
    requestAnimationFrame(() => star.classList.add("active"));
    window.setTimeout(() => star.remove(), 1900);
    window.setTimeout(launch, 4200 + Math.random() * 5200);
  };

  window.setTimeout(launch, 1600);
}


document.addEventListener("DOMContentLoaded", () => {
  resetInitialScroll();
  updateCountdown();
  setInterval(updateCountdown, 1000);
  loadWeddingWeather();
  setupRSVP();
  setupMobileMenu();
  setupScrollTop();
  setupHeroHint();
  setupTwinklingStars();
  startShootingStars();
});
