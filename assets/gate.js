(() => {
  const EXPECTED_HASH = "9e529b287a788855a0fb4e0df6610936792164b7182acbf459d9ea4343394778";
  const KEY = "mt-dev-v2-unlocked";
  const enc = new TextEncoder();
  async function digest(value) {
    const hash = await crypto.subtle.digest("SHA-256", enc.encode(value));
    return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2,"0")).join("");
  }
  function unlock() { document.getElementById("dev-lock")?.setAttribute("hidden",""); }
  document.addEventListener("DOMContentLoaded", () => {
    if (sessionStorage.getItem(KEY) === "1") return unlock();
    const form = document.getElementById("dev-lock-form");
    const input = document.getElementById("dev-password");
    const error = document.getElementById("dev-lock-error");
    input?.focus();
    form?.addEventListener("submit", async e => {
      e.preventDefault(); error.innerHTML = ""; input.classList.remove("is-error");
      if (await digest(input.value) === EXPECTED_HASH) {
        sessionStorage.setItem(KEY, "1"); unlock();
      } else {
        input.classList.add("is-error");
        error.innerHTML = "<strong>Das Passwort stimmt leider nicht.</strong>Bitte prüfe die Eingabe und versuche es erneut.";
        input.select(); setTimeout(() => input.classList.remove("is-error"), 450);
      }
    });
  });
})();
