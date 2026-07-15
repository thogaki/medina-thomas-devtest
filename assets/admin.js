const adminClient = window.supabase.createClient(
  window.MT_CONFIG.supabaseUrl,
  window.MT_CONFIG.supabasePublishableKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "mt-admin-auth"
    }
  }
);

let currentEntries = [];

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  })[character]);
}

function setAdminView(isLoggedIn) {
  document.getElementById("admin-login").classList.toggle("hidden", isLoggedIn);
  document.getElementById("admin-dashboard").classList.toggle("hidden", !isLoggedIn);
}

function render(entries) {
  currentEntries = entries;
  const yes = entries.filter(entry => entry.attendance === "yes");
  const no = entries.filter(entry => entry.attendance === "no");

  document.getElementById("count-all").textContent = entries.length;
  document.getElementById("count-yes").textContent = yes.length;
  document.getElementById("count-no").textContent = no.length;
  document.getElementById("count-persons").textContent =
    yes.reduce((sum, entry) => sum + Number(entry.persons || 0), 0);

  const rows = document.getElementById("rows");
  if (!entries.length) {
    rows.innerHTML =
      '<tr><td colspan="8" class="empty">Noch keine Rückmeldungen vorhanden.</td></tr>';
    return;
  }

  rows.innerHTML = entries.map(entry => `
    <tr>
      <td>${escapeHtml(entry.name)}</td>
      <td>${entry.attendance === "yes" ? "Zusage" : "Absage"}</td>
      <td>${entry.persons || "–"}</td>
      <td>${entry.hotel ? "Ja" : "Nein"}</td>
      <td>${entry.hotel_persons || "–"}</td>
      <td>${escapeHtml(entry.hotel_note)}</td>
      <td>${escapeHtml(entry.message)}</td>
      <td>${new Date(entry.created_at).toLocaleString("de-DE")}</td>
    </tr>
  `).join("");
}

async function loadEntries() {
  const status = document.getElementById("admin-status");
  status.textContent = "Rückmeldungen werden geladen …";

  const { data, error } = await adminClient
    .from("rsvp_responses")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Admin select:", error);
    status.textContent = "Daten konnten nicht geladen werden: " + error.message;
    return;
  }

  status.textContent = "";
  render(data || []);
}

function exportCsv() {
  const rows = [
    ["Name","Antwort","Personen","Hotel","Hotelpersonen","Hotelhinweis","Nachricht","Datum"],
    ...currentEntries.map(entry => [
      entry.name,
      entry.attendance === "yes" ? "Zusage" : "Absage",
      entry.persons,
      entry.hotel ? "Ja" : "Nein",
      entry.hotel_persons,
      entry.hotel_note,
      entry.message,
      entry.created_at
    ])
  ];

  const csv = rows
    .map(row => row.map(value =>
      `"${String(value ?? "").replaceAll('"', '""')}"`
    ).join(";"))
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

  const { data: { user } } = await adminClient.auth.getUser();
  setAdminView(Boolean(user));
  if (user) await loadEntries();

  loginForm.addEventListener("submit", async event => {
    event.preventDefault();
    loginError.textContent = "";
    loginButton.disabled = true;
    loginButton.textContent = "Anmeldung läuft …";

    const email = document.getElementById("admin-email").value.trim();
    const password = document.getElementById("admin-password").value;

    const { error } = await adminClient.auth.signInWithPassword({ email, password });

    if (error) {
      loginError.innerHTML =
        "<strong>Anmeldung nicht möglich.</strong><br>" +
        "Bitte prüfe E-Mail-Adresse, Passwort und ob der Benutzer bestätigt wurde.";
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
    await adminClient.auth.signOut();
    setAdminView(false);
    document.getElementById("admin-password").value = "";
  });

  document.getElementById("refresh").addEventListener("click", loadEntries);
  document.getElementById("export").addEventListener("click", exportCsv);
});
