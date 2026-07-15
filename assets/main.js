const weddingMoment = new Date("2027-06-05T14:30:00+02:00");

function updateCountdown() {
  const diff = weddingMoment - new Date();
  const ids = ["days","hours","minutes","seconds"];
  if (diff <= 0) {
    ids.forEach(id => document.getElementById(id).textContent = "00");
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

async function loadCurrentWeather() {
  const box = document.getElementById("weather-content");
  const icon = document.getElementById("weather-icon");
  try {
    const url = "https://api.open-meteo.com/v1/forecast?latitude=48.077&longitude=11.970&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m&timezone=Europe%2FBerlin";
    const res = await fetch(url);
    if (!res.ok) throw new Error("weather");
    const data = await res.json();
    const c = data.current;
    const [emoji, label] = weatherLabel(c.weather_code);
    icon.textContent = emoji;
    box.innerHTML = `<strong>${Math.round(c.temperature_2m)} °C · ${label}</strong>
      <small>Gefühlt ${Math.round(c.apparent_temperature)} °C · Luftfeuchtigkeit ${c.relative_humidity_2m} % · Wind ${Math.round(c.wind_speed_10m)} km/h</small>
      <div class="weather-meta">Aktuelles Wetter am Hotel Gasthof Huber in Ebersberg</div>`;
  } catch {
    icon.textContent = "✨";
    box.innerHTML = `<strong>Wetter momentan nicht verfügbar</strong><small>Bitte die Seite später erneut laden.</small>`;
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
  const submitButton = document.getElementById("rsvp-submit");
  const status = document.getElementById("rsvp-status");
  if (!form) return;

  const client = createPublicSupabaseClient();

  function refresh() {
    const yes = document.querySelector('input[name="attendance"]:checked')?.value === "yes";
    const hotel = document.querySelector('input[name="hotel"]:checked')?.value === "yes";
    attending.classList.toggle("hidden", !yes);
    hotelFields.classList.toggle("hidden", !(yes && hotel));
  }

  document.querySelectorAll('input[name="attendance"],input[name="hotel"]')
    .forEach(element => element.addEventListener("change", refresh));

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
    form.reset();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  updateCountdown();
  setInterval(updateCountdown, 1000);
  loadCurrentWeather();
  setupRSVP();
  startShootingStars();
  setupMobileMenu();
});
