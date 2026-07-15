(() => {
  const EXPECTED_HASH = "5f9bae3da6c2a7fbde7d3e5e2a728426a7578cf73e2c8bccb963962d064751c9";
  const SESSION_KEY = "mt-dev-unlocked";

  async function hash(value) {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("");
  }

  function unlock() {
    const lock = document.getElementById("dev-lock");
    if (lock) lock.hidden = true;
    document.documentElement.classList.remove("dev-locked");
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (sessionStorage.getItem(SESSION_KEY) === "1") {
      unlock();
      return;
    }

    const form = document.getElementById("dev-lock-form");
    const input = document.getElementById("dev-password");
    const error = document.getElementById("dev-lock-error");

    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const enteredHash = await hash(input.value);
      if (enteredHash === EXPECTED_HASH) {
        sessionStorage.setItem(SESSION_KEY, "1");
        unlock();
      } else {
        error.textContent = "Passwort ist nicht korrekt.";
        input.select();
      }
    });
  });
})();
