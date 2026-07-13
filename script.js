const weddingDate = new Date("2027-06-05T00:00:00+02:00");

const parts = {
  days: document.getElementById("days"),
  hours: document.getElementById("hours"),
  minutes: document.getElementById("minutes"),
  seconds: document.getElementById("seconds"),
};

function animateValue(element, nextValue) {
  if (element.textContent === nextValue) return;

  element.classList.add("changing");

  window.setTimeout(() => {
    element.textContent = nextValue;
    element.classList.remove("changing");
    element.classList.remove("entering");
    void element.offsetWidth;
    element.classList.add("entering");
  }, 170);

  window.setTimeout(() => {
    element.classList.remove("entering");
  }, 500);
}

function updateCountdown() {
  const now = new Date();
  let diff = weddingDate.getTime() - now.getTime();

  if (diff <= 0) {
    animateValue(parts.days, "0");
    animateValue(parts.hours, "00");
    animateValue(parts.minutes, "00");
    animateValue(parts.seconds, "00");
    return;
  }

  const days = Math.floor(diff / 86400000);
  diff %= 86400000;
  const hours = Math.floor(diff / 3600000);
  diff %= 3600000;
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  animateValue(parts.days, String(days));
  animateValue(parts.hours, String(hours).padStart(2, "0"));
  animateValue(parts.minutes, String(minutes).padStart(2, "0"));
  animateValue(parts.seconds, String(seconds).padStart(2, "0"));
}

updateCountdown();
setInterval(updateCountdown, 1000);

const googleParams = new URLSearchParams({
  action: "TEMPLATE",
  text: "Hochzeit Medina & Thomas",
  dates: "20270605/20270606",
  details: "Save the Date – weitere Informationen folgen mit der Einladung."
});

document.getElementById("google-link").href =
  "https://calendar.google.com/calendar/render?" + googleParams.toString();

document.getElementById("ics-button").addEventListener("click", () => {
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Medina und Thomas//Save the Date//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    "UID:20270605-medina-thomas@medina-thomas.de",
    "DTSTAMP:20260713T000000Z",
    "DTSTART;VALUE=DATE:20270605",
    "DTEND;VALUE=DATE:20270606",
    "SUMMARY:Hochzeit Medina & Thomas",
    "DESCRIPTION:Save the Date – weitere Informationen folgen mit der Einladung.",
    "STATUS:CONFIRMED",
    "TRANSP:TRANSPARENT",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "medina-und-thomas-05-06-2027.ics";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

const scrollHint = document.querySelector(".scroll-hint");

function updateScrollHint() {
  scrollHint.classList.toggle("hidden", window.scrollY > 80);
}

updateScrollHint();
window.addEventListener("scroll", updateScrollHint, { passive: true });

const canvas = document.getElementById("stars");
const ctx = canvas.getContext("2d");

let stars = [];
let shootingStars = [];
let dpr = Math.min(window.devicePixelRatio || 1, 2);
let lastLaunch = 0;
let nextLaunchIn = 6500;

/*
  Der Sternenhimmel ist bewusst an euer Beziehungsdatum 06.04.2019 gekoppelt.
  Das ist ein reproduzierbares, symbolisches Muster – keine astronomische
  Rekonstruktion des echten Himmels an einem bestimmten Ort.
*/
function seededRandom(seed) {
  let value = seed >>> 0;
  return function () {
    value += 0x6D2B79F5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const relationshipSeed = 6042019;
const random = seededRandom(relationshipSeed);

function resizeStars() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(innerWidth * dpr);
  canvas.height = Math.floor(innerHeight * dpr);
  canvas.style.width = innerWidth + "px";
  canvas.style.height = innerHeight + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const count = Math.max(100, Math.floor((innerWidth * innerHeight) / 8500));
  const localRandom = seededRandom(relationshipSeed + innerWidth * 31 + innerHeight * 17);

  stars = Array.from({ length: count }, () => ({
    x: localRandom() * innerWidth,
    y: localRandom() * innerHeight,
    r: localRandom() * 1.35 + 0.18,
    a: localRandom() * 0.64 + 0.12,
    v: localRandom() * 0.012 + 0.004,
    phase: localRandom() * Math.PI * 2
  }));
}

function launchShootingStar() {
  const fromRight = random() > 0.18;

  shootingStars.push({
    x: fromRight
      ? innerWidth * (0.62 + random() * 0.34)
      : innerWidth * (0.08 + random() * 0.24),
    y: innerHeight * (0.04 + random() * 0.34),
    vx: fromRight
      ? -(2.6 + random() * 1.5)
      : 2.4 + random() * 1.4,
    vy: 1.0 + random() * 0.9,
    length: 48 + random() * 42,
    life: 0.62,
    width: 0.55 + random() * 0.45
  });

  // Nur selten folgt eine zweite Sternschnuppe.
  if (random() > 0.90) {
    setTimeout(() => {
      if (shootingStars.length < 2) launchShootingStar();
    }, 900 + random() * 1200);
  }
}

function drawStars(t) {
  ctx.clearRect(0, 0, innerWidth, innerHeight);

  for (const s of stars) {
    const alpha = s.a + Math.sin(t * s.v + s.phase) * 0.2;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(245,229,170,${Math.max(0.05, alpha)})`;
    ctx.fill();
  }

  if (t - lastLaunch > nextLaunchIn) {
    launchShootingStar();
    lastLaunch = t;
    nextLaunchIn = 7500 + random() * 7000;
  }

  shootingStars = shootingStars.filter((star) => {
    star.x += star.vx;
    star.y += star.vy;
    star.life -= 0.010;

    const direction = star.vx < 0 ? 1 : -1;
    const endX = star.x + star.length * direction;
    const endY = star.y - star.length * 0.42;

    const gradient = ctx.createLinearGradient(star.x, star.y, endX, endY);
    gradient.addColorStop(0, `rgba(255,246,211,${Math.max(0, star.life * 0.72)})`);
    gradient.addColorStop(0.30, `rgba(231,204,104,${Math.max(0, star.life * 0.48)})`);
    gradient.addColorStop(1, "rgba(255,245,205,0)");

    ctx.beginPath();
    ctx.moveTo(star.x, star.y);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = star.width;
    ctx.stroke();

    return star.life > 0;
  });

  requestAnimationFrame(drawStars);
}

resizeStars();
window.addEventListener("resize", resizeStars, { passive: true });

if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  requestAnimationFrame(drawStars);
} else {
  drawStars(0);
}


// =========================================================
// DEVTEST LOGIN
// Hinweis: Client-seitiger Schutz für eine Testumgebung.
// Nicht für sensible Daten oder einen echten Adminbereich verwenden.
// =========================================================
const DEV_PASSWORD_HASH = "9e529b287a788855a0fb4e0df6610936792164b7182acbf459d9ea4343394778";
const DEV_SESSION_KEY = "medina-thomas-devtest-auth-v1";

const devLogin = document.getElementById("dev-login");
const devLoginForm = document.getElementById("dev-login-form");
const devPassword = document.getElementById("dev-password");
const devLoginError = document.getElementById("dev-login-error");
const togglePassword = document.getElementById("toggle-password");
const devPanel = document.getElementById("dev-panel");
const devPanelToggle = document.getElementById("dev-panel-toggle");
const devLogout = document.getElementById("dev-logout");

async function sha256(value) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function unlockDev() {
  sessionStorage.setItem(DEV_SESSION_KEY, "1");
  document.body.classList.remove("dev-locked");
  devLogin.hidden = true;
}

function lockDev() {
  sessionStorage.removeItem(DEV_SESSION_KEY);
  document.body.classList.add("dev-locked");
  devLogin.hidden = false;
  devPassword.value = "";
  devLoginError.textContent = "";
  devPanel.classList.remove("open");
  setTimeout(() => devPassword.focus(), 50);
}

if (sessionStorage.getItem(DEV_SESSION_KEY) === "1") {
  unlockDev();
} else {
  lockDev();
}

devLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  devLoginError.textContent = "";

  const enteredHash = await sha256(devPassword.value);

  if (enteredHash === DEV_PASSWORD_HASH) {
    unlockDev();
  } else {
    devLoginError.textContent =
      "Diese Sterne sind leider noch nicht für dich bestimmt. Bitte Passwort prüfen.";
    devPassword.select();
  }
});

togglePassword.addEventListener("click", () => {
  const visible = devPassword.type === "text";
  devPassword.type = visible ? "password" : "text";
  togglePassword.setAttribute(
    "aria-label",
    visible ? "Passwort anzeigen" : "Passwort ausblenden"
  );
  devPassword.focus();
});

devPanelToggle.addEventListener("click", () => {
  const open = devPanel.classList.toggle("open");
  devPanelToggle.setAttribute("aria-expanded", String(open));
});

devLogout.addEventListener("click", lockDev);
