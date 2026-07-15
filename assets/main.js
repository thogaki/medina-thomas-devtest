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

function setupRSVP() {
  const form = document.getElementById("rsvp-form");
  const success = document.getElementById("rsvp-success");
  const attending = document.getElementById("attending-fields");
  const hotelFields = document.getElementById("hotel-fields");

  function refresh() {
    const yes = document.querySelector('input[name="attendance"]:checked')?.value === "yes";
    const hotel = document.querySelector('input[name="hotel"]:checked')?.value === "yes";
    attending.classList.toggle("hidden", !yes);
    hotelFields.classList.toggle("hidden", !(yes && hotel));
  }

  document.querySelectorAll('input[name="attendance"],input[name="hotel"]').forEach(el => el.addEventListener("change", refresh));

  form.addEventListener("submit", e => {
    e.preventDefault();
    const fd = new FormData(form);
    if (!fd.get("attendance")) {
      alert("Bitte wählt Zu- oder Absage aus.");
      return;
    }
    const entry = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      name: fd.get("name"),
      attendance: fd.get("attendance"),
      persons: fd.get("attendance") === "yes" ? Number(fd.get("persons") || 1) : 0,
      hotel: fd.get("attendance") === "yes" ? fd.get("hotel") : "no",
      hotelPersons: fd.get("hotel") === "yes" ? Number(fd.get("hotelPersons") || 1) : 0,
      hotelNote: fd.get("hotelNote") || "",
      message: fd.get("message") || "",
      createdAt: new Date().toISOString()
    };
    const all = JSON.parse(localStorage.getItem("mt-rsvp-dev") || "[]");
    all.push(entry);
    localStorage.setItem("mt-rsvp-dev", JSON.stringify(all));
    form.classList.add("hidden");
    success.classList.remove("hidden");
  });
}


function startShootingStars() {
  const star = document.createElement("div");
  star.className = "shooting-star";
  document.body.appendChild(star);

  const launch = () => {
    const top = 70 + Math.random() * Math.min(window.innerHeight * 0.55, 420);
    const left = window.innerWidth * (0.62 + Math.random() * 0.28);
    star.style.top = `${top}px`;
    star.style.left = `${left}px`;
    star.classList.remove("active");
    void star.offsetWidth;
    star.classList.add("active");
    const nextDelay = 6000 + Math.random() * 6000;
    window.setTimeout(launch, nextDelay);
  };

  window.setTimeout(launch, 3500 + Math.random() * 3500);
}



function setupMobileMenu() {
  const button = document.getElementById("menu-toggle");
  const nav = document.getElementById("main-nav");
  if (!button || !nav) return;

  const close = () => {
    button.classList.remove("active");
    nav.classList.remove("open");
    button.setAttribute("aria-expanded", "false");
  };

  button.addEventListener("click", () => {
    const open = !nav.classList.contains("open");
    nav.classList.toggle("open", open);
    button.classList.toggle("active", open);
    button.setAttribute("aria-expanded", String(open));
  });

  nav.querySelectorAll("a").forEach(link => link.addEventListener("click", close));
  document.addEventListener("click", event => {
    if (!nav.contains(event.target) && !button.contains(event.target)) close();
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
