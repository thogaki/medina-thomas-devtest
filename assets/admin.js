function entries(){return JSON.parse(localStorage.getItem("mt-rsvp-dev")||"[]")}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function render(){
  const all=entries(), yes=all.filter(x=>x.attendance==="yes"), no=all.filter(x=>x.attendance==="no");
  document.getElementById("count-all").textContent=all.length;
  document.getElementById("count-yes").textContent=yes.length;
  document.getElementById("count-no").textContent=no.length;
  document.getElementById("count-persons").textContent=yes.reduce((a,b)=>a+(Number(b.persons)||0),0);
  const body=document.getElementById("rows");
  if(!all.length){body.innerHTML='<tr><td colspan="8" class="empty">Noch keine DEV-Antworten in diesem Browser gespeichert.</td></tr>';return}
  body.innerHTML=all.map(x=>`<tr><td>${esc(x.name)}</td><td>${x.attendance==="yes"?"Zusage":"Absage"}</td><td>${x.persons||"–"}</td><td>${x.hotel==="yes"?"Ja":"Nein"}</td><td>${x.hotelPersons||"–"}</td><td>${esc(x.hotelNote)}</td><td>${esc(x.message)}</td><td>${new Date(x.createdAt).toLocaleString("de-DE")}</td></tr>`).join("")
}
function exportCsv(){
  const all=entries(); const rows=[["Name","Antwort","Personen","Hotel","Hotelpersonen","Hotelhinweis","Nachricht","Datum"],...all.map(x=>[x.name,x.attendance,x.persons,x.hotel,x.hotelPersons,x.hotelNote,x.message,x.createdAt])];
  const csv=rows.map(r=>r.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(";")).join("\n");
  const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="rsvp-dev.csv";a.click();URL.revokeObjectURL(a.href)
}
document.addEventListener("DOMContentLoaded",()=>{render();document.getElementById("export")?.addEventListener("click",exportCsv);document.getElementById("clear")?.addEventListener("click",()=>{if(confirm("Alle lokalen DEV-Antworten löschen?")){localStorage.removeItem("mt-rsvp-dev");render()}})})
