const client = window.supabase.createClient(
  window.MT_CONFIG.supabaseUrl,
  window.MT_CONFIG.supabasePublishableKey
);

let currentEntries = [];

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  })[char]);
}

function setAdminView(isLoggedIn) {
  document.getElementById("admin-login").classList.toggle("hidden", isLoggedIn);
  document.getElementById("admin-dashboard").classList.toggle("hidden", !isLoggedIn);
}

function render(entries) {
  currentEntries = entries;
  const yes = entries.filter(item => item.attendance === "yes");
  const no = entries.filter(item => item.attendance === "no");

  document.getElementById("count-all").textContent = entries.length;
  document.getElementById("count-yes").textContent = yes.length;
  document.getElementById("count-no").textContent = no.length;
  document.getElementById("count-persons").textContent =
    yes.reduce((sum, item) => sum + Number(item.persons || 0), 0);

  const body = document.getElementById("rows");
  if (!entries.length) {
    body.innerHTML = '<tr><td colspan="8" class="empty">Noch keine Rückmeldungen vorhanden.</td></tr>';
    return;
  }

  body.innerHTML = entries.map(item => `
    <tr>
      <td>${esc(item.name)}</td>
      <td>${item.attendance === "yes" ? "Zusage" : "Absage"}</td>
      <td>${item.persons || "–"}</td>
      <td>${item.hotel ? "Ja" : "Nein"}</td>
      <td>${item.hotel_persons || "–"}</td>
      <td>${esc(item.hotel_note)}</td>
      <td>${esc(item.message)}</td>
      <td>${new Date(item.created_at).toLocaleString("de-DE")}</td>
    </tr>`).join("");
}

async function loadEntries() {
  const status = document.getElementById("admin-status");
  status.textContent = "Rückmeldungen werden geladen …";

  const { data, error } = await client
    .from("rsvp_responses")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    status.textContent = "Die Daten konnten nicht geladen werden.";
    return;
  }

  status.textContent = "";
  render(data || []);
}

function exportCsv() {
  const rows = [
    ["Name","Antwort","Personen","Hotel","Hotelpersonen","Hotelhinweis","Nachricht","Datum"],
    ...currentEntries.map(item => [
      item.name,
      item.attendance === "yes" ? "Zusage" : "Absage",
      item.persons,
      item.hotel ? "Ja" : "Nein",
      item.hotel_persons,
      item.hotel_note,
      item.message,
      item.created_at
    ])
  ];
  const csv = rows
    .map(row => row.map(value => `"${String(value ?? "").replaceAll('"','""')}"`).join(";"))
    .join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "rsvp-rueckmeldungen.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}

document.addEventListener("DOMContentLoaded", async () => {
  const loginForm = document.getElementById("login-form");
  const loginError = document.getElementById("login-error");
  const loginButton = document.getElementById("login-button");

  const { data: { session } } = await client.auth.getSession();
  setAdminView(Boolean(session));
  if (session) await loadEntries();

  loginForm.addEventListener("submit", async event => {
    event.preventDefault();
    loginError.textContent = "";
    loginButton.disabled = true;
    loginButton.textContent = "Anmeldung läuft …";

    const email = document.getElementById("admin-email").value.trim();
    const password = document.getElementById("admin-password").value;

    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      loginError.innerHTML = "<strong>Anmeldung nicht möglich.</strong><br>Bitte prüfe E-Mail-Adresse und Passwort.";
      loginButton.disabled = false;
      loginButton.textContent = "Anmelden";
      return;
    }

    setAdminView(true);
    loginButton.disabled = false;
    loginButton.textContent = "Anmelden";
    await loadEntries();
  });

  document.getElementById("logout-button").addEventListener("click", async () => {
    await client.auth.signOut();
    setAdminView(false);
    document.getElementById("admin-password").value = "";
  });

  document.getElementById("refresh").addEventListener("click", loadEntries);
  document.getElementById("export").addEventListener("click", exportCsv);
});
