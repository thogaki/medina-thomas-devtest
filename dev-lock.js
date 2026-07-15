(() => {
  const EXPECTED_HASH = "9e529b287a788855a0fb4e0df6610936792164b7182acbf459d9ea4343394778";
  const SESSION_KEY = "mt-dev-unlocked-v125";

  async function hash(value) {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(digest)]
      .map(byte => byte.toString(16).padStart(2, "0"))
      .join("");
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

    input?.focus();

    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      error.textContent = "";
      input.classList.remove("is-error");

      const enteredHash = await hash(input.value);

      if (enteredHash === EXPECTED_HASH) {
        sessionStorage.setItem(SESSION_KEY, "1");
        unlock();
        return;
      }

      input.classList.add("is-error");
      error.innerHTML = "<strong>Das Passwort stimmt leider nicht.</strong>Bitte prüfe die Eingabe und versuche es erneut.";
      input.select();

      window.setTimeout(() => input.classList.remove("is-error"), 450);
    });
  });
})();
