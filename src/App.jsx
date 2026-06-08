import { useState, useEffect, useCallback } from "react";

const API_URL = "https://script.google.com/macros/s/AKfycbyRu3pWbSQTqE9BFgkrcCy-ArnHmOysgZN6GZp_ecXizkkF1K5NdaTOYq8tznbOXnY/exec";

// Hours 9AM to 9PM
const HOURS = [9,10,11,12,13,14,15,16,17,18,19,20,21];
const H = h => `${h > 12 ? h-12 : h}:00 ${h >= 12 ? "PM" : "AM"}`;
const HH = h => `${String(h).padStart(2,"0")}:00`;

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function fmtDate(s) {
  if (!s) return "";
  const [y,m,d] = s.split("-");
  const names = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const days  = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const dt = new Date(s);
  return `${days[dt.getDay()]} ${d} ${names[parseInt(m)]}`;
}
function dayLabel(s) {
  if (s === todayStr()) return "Today";
  const t = new Date(todayStr()); t.setDate(t.getDate()+1);
  if (s === t.toISOString().split("T")[0]) return "Tomorrow";
  return fmtDate(s);
}
function getDay(offset) {
  const d = new Date(todayStr()); d.setDate(d.getDate()+offset);
  return d.toISOString().split("T")[0];
}

// Check if a slot range overlaps with a booking
function overlaps(s1, e1, s2, e2) {
  return !(parseInt(e1) <= parseInt(s2) || parseInt(s1) >= parseInt(e2));
}

// Get free hour slots for a car on a date given existing bookings
function getFreeSlots(bookings, carId, date) {
  const booked = bookings.filter(b =>
    b.carId === carId && b.date === date && b.status === "BLOCKED"
  );
  return HOURS.filter(h =>
    !booked.some(b => overlaps(h, h+1, parseInt(b.startSlot), parseInt(b.endSlot)))
  );
}

// Get blocked ranges for a car on a date
function getBlockedRanges(bookings, carId, date) {
  return bookings.filter(b =>
    b.carId === carId && b.date === date && b.status === "BLOCKED"
  );
}

const gold = "linear-gradient(135deg,#c0a060,#e8c878)";
const S = {
  app:  { minHeight:"100vh", background:"linear-gradient(135deg,#0a0e1a,#0d1b2a)", fontFamily:"'DM Sans','Segoe UI',sans-serif", color:"#e8eaf0" },
  hdr:  { background:"rgba(255,255,255,0.04)", borderBottom:"1px solid rgba(255,255,255,0.08)", padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100, backdropFilter:"blur(10px)" },
  tabs: { display:"flex", borderBottom:"1px solid rgba(255,255,255,0.07)", overflowX:"auto" },
  page: { padding:"12px" },
  card: { background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, padding:"12px", marginBottom:10 },
  inp:  { width:"100%", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:8, padding:"9px 11px", color:"#e8eaf0", fontSize:13, boxSizing:"border-box" },
  lbl:  { fontSize:10, color:"#8892a4", textTransform:"uppercase", letterSpacing:"0.8px", display:"block", marginBottom:5 },
};

function Tab({ active, onClick, children }) {
  return <button onClick={onClick} style={{ background:"none", border:"none", cursor:"pointer", padding:"11px 12px 9px", fontSize:11, fontWeight:600, color:active?"#c0a060":"#6b7a8d", borderBottom:`2px solid ${active?"#c0a060":"transparent"}`, textTransform:"uppercase", letterSpacing:"0.8px", whiteSpace:"nowrap" }}>{children}</button>;
}
function Btn({ children, color="#c0a060", bg, onClick, disabled, full }) {
  return <button onClick={onClick} disabled={disabled} style={{ background:bg||`${color}18`, border:`1px solid ${color}44`, color, borderRadius:8, padding:"7px 12px", fontSize:12, fontWeight:600, cursor:disabled?"not-allowed":"pointer", opacity:disabled?0.4:1, width:full?"100%":"auto" }}>{children}</button>;
}

async function apiFetch(p) { const r = await fetch(API_URL+"?"+new URLSearchParams(p)); return r.json(); }
async function apiPost(b)  { const r = await fetch(API_URL, {method:"POST", body:JSON.stringify(b)}); return r.json(); }

// ── LOGIN ──────────────────────────────────────────────────────
function Login({ consultants, onLogin }) {
  const [sel, setSel] = useState("");
  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0a0e1a,#0d1b2a)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ width:52, height:52, borderRadius:"50%", background:gold, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:700, color:"#0a0e1a", marginBottom:14 }}>★</div>
      <div style={{ fontSize:18, fontWeight:700, marginBottom:3 }}>Silver Star MB</div>
      <div style={{ fontSize:11, color:"#8892a4", letterSpacing:"1.5px", textTransform:"uppercase", marginBottom:32 }}>Test Drive Manager</div>
      <div style={{ width:"100%", maxWidth:320 }}>
        <div style={{ fontSize:12, color:"#8892a4", marginBottom:10, textAlign:"center" }}>Select your name</div>
        <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:16 }}>
          {consultants.map(c => (
            <button key={c.name} onClick={() => setSel(c.name)} style={{ background:sel===c.name?"rgba(192,160,96,0.15)":"rgba(255,255,255,0.04)", border:`1px solid ${sel===c.name?"#c0a060":"rgba(255,255,255,0.08)"}`, borderRadius:10, padding:"11px 14px", color:sel===c.name?"#e8c878":"#e8eaf0", fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span>{c.name}</span>
              {c.role==="admin" && <span style={{ fontSize:9, color:"#c0a060", background:"rgba(192,160,96,0.15)", padding:"2px 7px", borderRadius:8 }}>ADMIN</span>}
            </button>
          ))}
        </div>
        <button onClick={() => sel && onLogin(consultants.find(c=>c.name===sel))} disabled={!sel} style={{ width:"100%", background:sel?gold:"rgba(255,255,255,0.06)", border:"none", borderRadius:10, padding:13, color:"#0a0e1a", fontSize:13, fontWeight:700, cursor:sel?"pointer":"not-allowed", opacity:sel?1:0.5 }}>Enter →</button>
      </div>
    </div>
  );
}

// ── TIMELINE VISUAL ────────────────────────────────────────────
function Timeline({ bookings, carId, date, outStatus }) {
  const blocked = getBlockedRanges(bookings, carId, date);
  const total = 21 - 9; // 9AM to 9PM
  return (
    <div style={{ marginTop:6 }}>
      <div style={{ position:"relative", height:16, borderRadius:5, background:"rgba(0,200,150,0.1)", overflow:"hidden", border:"1px solid rgba(0,200,150,0.15)" }}>
        {outStatus && <div style={{ position:"absolute", left:0, width:"100%", height:"100%", background:"rgba(231,76,60,0.5)" }} />}
        {blocked.map((b,i) => {
          const left  = ((parseInt(b.startSlot)-9)/total)*100;
          const width = ((parseInt(b.endSlot)-parseInt(b.startSlot))/total)*100;
          return <div key={i} title={`${b.consultant}: ${H(parseInt(b.startSlot))}–${H(parseInt(b.endSlot))}`} style={{ position:"absolute", left:`${left}%`, width:`${width}%`, height:"100%", background:"rgba(245,166,35,0.75)", borderLeft:"1px solid #f5a623" }} />;
        })}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:2 }}>
        <span style={{ fontSize:9, color:"#4a5568" }}>9 AM</span>
        <span style={{ fontSize:9, color:"#4a5568" }}>9 PM</span>
      </div>
    </div>
  );
}

// ── MAIN APP ───────────────────────────────────────────────────
export default function App() {
  const [user, setUser]         = useState(null);
  const [cars, setCars]         = useState([]);
  const [consultants, setCons]  = useState([]);
  const [bookings, setBookings] = useState([]);
  const [log, setLog]           = useState([]);
  const [loading, setLoading]   = useState(true);
  const [syncing, setSyncing]   = useState(false);
  const [tab, setTab]           = useState("today");
  const [toast, setToast]       = useState(null);
  const [modal, setModal]       = useState(null); // {type, carId, carName, booking}
  const [schedDate, setSchedDate] = useState(todayStr());
  // Form state
  const [fConsultant, setFC]    = useState("");
  const [fCustomer, setFCust]   = useState("");
  const [fPhone, setFPhone]     = useState("");
  const [fLocation, setFLoc]    = useState("");
  const [fNotes, setFNotes]     = useState("");
  const [fDate, setFDate]       = useState(todayStr());
  const [fStart, setFStart]     = useState("");
  const [fEnd, setFEnd]         = useState("");
  const [fReturn, setFReturn]   = useState("");
  // Settings
  const [newCName, setNewCName] = useState("");
  const [newCPlate, setNewCPlate] = useState("");
  const [newConsName, setNewConsName] = useState("");

  const showToast = (msg, type="ok") => { setToast({msg,type}); setTimeout(()=>setToast(null),3500); };

  const load = useCallback(async () => {
    try {
      const d = await apiFetch({action:"getData"});
      if (d.error) { showToast("Connection error","err"); return; }
      setCars(d.cars||[]);
      setCons(d.consultants||[]);
      setBookings(d.bookings||[]);
    } catch { showToast("Network error","err"); }
  },[]);

  const loadLog = useCallback(async () => {
    const d = await apiFetch({action:"getLog"});
    setLog(d.log||[]);
  },[]);

  useEffect(() => { load().finally(()=>setLoading(false)); const t=setInterval(load,20000); return()=>clearInterval(t); },[load]);
  useEffect(() => { if(tab==="log") loadLog(); },[tab,loadLog]);

  const post = async (body) => {
    setSyncing(true);
    try {
      const r = await apiPost(body);
      if (!r.ok) { showToast(r.error||"Failed","err"); return false; }
      await load(); return true;
    } catch { showToast("Network error","err"); return false; }
    finally { setSyncing(false); }
  };

  // Active status per car (OUT beats BLOCKED beats FREE)
  const getStatus = (carId) => {
    const out = bookings.find(b => b.carId===carId && b.status==="OUT");
    if (out) return {status:"OUT", ...out};
    const todayBlocked = bookings.find(b => b.carId===carId && b.status==="BLOCKED" && b.date===todayStr());
    if (todayBlocked) return {status:"BLOCKED", ...todayBlocked};
    return {status:"FREE"};
  };

  const openBookModal = (carId, carName, prefDate, prefStart, prefEnd) => {
    setFC(user.name); setFCust(""); setFPhone(""); setFLoc(""); setFNotes("");
    setFDate(prefDate||todayStr()); setFStart(prefStart||""); setFEnd(prefEnd||"");
    setModal({type:"book", carId, carName});
  };

  const openCheckoutModal = (carId, carName, booking) => {
    setFC(booking?.consultant||user.name); setFCust(booking?.customer||"");
    setFReturn(""); setModal({type:"checkout", carId, carName, booking});
  };

  // ── ACTIONS ────────────────────────────────────────────────
  const handleBook = async () => {
    if (!fConsultant||!fCustomer) return showToast("Fill consultant & customer","err");
    if (!fDate) return showToast("Select a date","err");
    if (!fStart) return showToast("Select start time","err");
    if (!fEnd) return showToast("Select end time","err");
    if (parseInt(fEnd)<=parseInt(fStart)) return showToast("End must be after start","err");
    if (isNaN(parseInt(fStart))||isNaN(parseInt(fEnd))) return showToast("Invalid time selection","err");
    // Show debug toast so we can verify values
    showToast(`Booking: ${fDate} ${fStart}→${fEnd}`);
    await new Promise(r=>setTimeout(r,1500));
    const car = cars.find(c=>c.id===modal.carId);
    const ok = await post({action:"bookSlot", carId:modal.carId, carName:car?.name||modal.carName, consultant:fConsultant, customer:fCustomer, phone:fPhone, location:fLocation, notes:fNotes, date:fDate, startSlot:String(fStart), endSlot:String(fEnd)});
    if (ok) { showToast(`Slot booked ✅`); setModal(null); }
  };

  const handleCheckout = async () => {
    if (!fReturn) return showToast("Set expected return time","err");
    const car = cars.find(c=>c.id===modal.carId);
    const ok = await post({action:"checkout", carId:modal.carId, carName:car?.name||modal.carName, consultant:fConsultant||modal.booking?.consultant, customer:fCustomer||modal.booking?.customer, bookingId:modal.booking?.id, date:todayStr(), returnBy:fReturn});
    if (ok) { showToast(`Car checked out 🚗`); setModal(null); }
  };

  const handleReturn = async (b) => {
    const car = cars.find(c=>c.id===b.carId);
    const ok = await post({action:"returnCar", bookingId:b.id, carName:car?.name||b.carName, consultant:b.consultant, customer:b.customer});
    if (ok) showToast(`${car?.name||b.carName} returned ✅`);
  };

  const handleRelease = async (b) => {
    if (user.role!=="admin" && b.consultant!==user.name) return showToast(`Only ${b.consultant} or Admin can release`,"err");
    const car = cars.find(c=>c.id===b.carId);
    const ok = await post({action:"releaseSlot", bookingId:b.id, carName:car?.name||b.carName, requester:user.name, requesterRole:user.role, bookedBy:b.consultant, customer:b.customer});
    if (ok) showToast(`Slot released`);
  };

  // Compute slot options at component level (not inside JSX IIFE)
  const modalExisting = modal ? bookings.filter(b=>b.carId===modal.carId&&b.date===fDate&&b.status==="BLOCKED") : [];
  const modalFreeHrs  = modal ? getFreeSlots(bookings, modal.carId, fDate) : [];
  const modalStartOpts = modalFreeHrs.filter(h => h < 21);
  let modalEndOpts = [];
  if (fStart && modal) {
    const startH = parseInt(fStart);
    const nextBlock = modalExisting
      .filter(b => parseInt(b.startSlot) > startH)
      .map(b => parseInt(b.startSlot))
      .sort((a,b)=>a-b)[0] || 22;
    for (let h = startH+1; h <= Math.min(21, nextBlock); h++) {
      modalEndOpts.push(h);
    }
  }

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#0a0e1a", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:14, color:"#8892a4" }}>
      <div style={{ width:38,height:38,borderRadius:"50%",background:gold,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:"#0a0e1a",fontWeight:700 }}>★</div>
      <div style={{ fontSize:12 }}>Connecting to Google Sheets…</div>
    </div>
  );
  if (!user) return <Login consultants={consultants} onLogin={setUser} />;

  // Summary counts
  const available = cars.filter(c=>getStatus(c.id).status==="FREE").length;
  const blocked   = cars.filter(c=>getStatus(c.id).status==="BLOCKED").length;
  const onDrive   = cars.filter(c=>getStatus(c.id).status==="OUT").length;

  return (
    <div style={S.app}>
      {/* Header */}
      <div style={S.hdr}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:32,height:32,borderRadius:"50%",background:gold,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#0a0e1a" }}>★</div>
          <div>
            <div style={{ fontSize:13,fontWeight:700 }}>Silver Star MB</div>
            <div style={{ fontSize:9,color:"#8892a4",letterSpacing:"1px",textTransform:"uppercase" }}>Test Drive Manager</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {syncing && <div style={{ fontSize:9,color:"#f5a623" }}>Saving…</div>}
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:11,fontWeight:600,color:"#e8c878" }}>{user.name}</div>
            <div style={{ fontSize:9,color:"#8892a4",textTransform:"uppercase" }}>{user.role}</div>
          </div>
          <button onClick={()=>setUser(null)} style={{ background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:5,padding:"3px 7px",color:"#8892a4",fontSize:9,cursor:"pointer" }}>Exit</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        <Tab active={tab==="today"}    onClick={()=>setTab("today")}>🚘 Today</Tab>
        <Tab active={tab==="avail"}    onClick={()=>setTab("avail")}>✅ Availability</Tab>
        <Tab active={tab==="schedule"} onClick={()=>setTab("schedule")}>📅 Schedule</Tab>
        <Tab active={tab==="log"}      onClick={()=>setTab("log")}>📋 Log</Tab>
        {user.role==="admin" && <Tab active={tab==="settings"} onClick={()=>setTab("settings")}>⚙️</Tab>}
      </div>

      {/* ── TODAY ── */}
      {tab==="today" && (
        <div style={S.page}>
          {/* Summary */}
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10 }}>
            {[{l:"Available",n:available,c:"#00c896"},{l:"Blocked",n:blocked,c:"#f5a623"},{l:"On Drive",n:onDrive,c:"#e74c3c"}].map(s=>(
              <div key={s.l} style={{ background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"10px 6px",textAlign:"center",border:`1px solid ${s.c}22` }}>
                <div style={{ fontSize:22,fontWeight:700,color:s.c }}>{s.n}</div>
                <div style={{ fontSize:9,color:"#8892a4",textTransform:"uppercase",letterSpacing:"0.7px" }}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize:9,color:"#4a5568",textAlign:"center",marginBottom:10 }}>
            Live · <span style={{ cursor:"pointer",color:"#6b7a8d",textDecoration:"underline" }} onClick={load}>Refresh</span>
          </div>

          {cars.map(car => {
            const active   = getStatus(car.id);
            const sc       = active.status==="FREE"?"#00c896":active.status==="BLOCKED"?"#f5a623":"#e74c3c";
            const sl       = active.status==="FREE"?"Available":active.status==="BLOCKED"?"Blocked":"On Drive";
            const canRel   = user.role==="admin" || active.consultant===user.name;
            const todaySlots = bookings.filter(b=>b.carId===car.id&&b.date===todayStr()&&b.status==="BLOCKED");
            const freeHours  = getFreeSlots(bookings, car.id, todayStr());
            const futureCount = bookings.filter(b=>b.carId===car.id&&b.status==="BLOCKED"&&b.date>todayStr()).length;

            return (
              <div key={car.id} style={{ ...S.card, border:`1px solid ${sc}33` }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8 }}>
                  <div>
                    <div style={{ fontSize:15,fontWeight:700 }}>{car.name}</div>
                    <div style={{ fontSize:10,color:"#8892a4" }}>{car.plate}</div>
                  </div>
                  <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4 }}>
                    <div style={{ background:`${sc}22`,color:sc,padding:"3px 10px",borderRadius:16,fontSize:10,fontWeight:700,textTransform:"uppercase",border:`1px solid ${sc}44` }}>{sl}</div>
                    {futureCount>0 && <div style={{ fontSize:9,color:"#f5a623",background:"rgba(245,166,35,0.1)",padding:"2px 7px",borderRadius:8,border:"1px solid rgba(245,166,35,0.25)" }}>📅 {futureCount} upcoming</div>}
                  </div>
                </div>

                {/* Timeline */}
                <Timeline bookings={bookings} carId={car.id} date={todayStr()} outStatus={active.status==="OUT"} />

                {/* Active details */}
                {active.status!=="FREE" && (
                  <div style={{ background:"rgba(0,0,0,0.2)",borderRadius:8,padding:"8px 10px",margin:"8px 0",fontSize:11 }}>
                    <div style={{ display:"flex",gap:12,flexWrap:"wrap" }}>
                      <span><span style={{ color:"#8892a4" }}>By: </span><b>{active.consultant}</b></span>
                      <span><span style={{ color:"#8892a4" }}>Customer: </span><b>{active.customer}</b></span>
                    </div>
                    {active.status==="BLOCKED" && <div style={{ color:"#f5a623",marginTop:4,fontSize:11,fontWeight:600 }}>⏰ {H(parseInt(active.startSlot))} – {H(parseInt(active.endSlot))}</div>}
                    {active.status==="OUT" && active.returnBy && <div style={{ color:"#00c896",marginTop:4 }}>Return by {active.returnBy}</div>}
                    {active.location && <div style={{ color:"#63b3ed",marginTop:3,fontSize:10 }}>📍 {active.location}</div>}
                    {active.status==="BLOCKED" && !canRel && <div style={{ marginTop:5,fontSize:10,color:"#f5a623",background:"rgba(245,166,35,0.08)",borderRadius:5,padding:"3px 7px" }}>🔐 Only {active.consultant} or Admin can release</div>}
                  </div>
                )}

                {/* Today's all slots */}
                {todaySlots.length>0 && (
                  <div style={{ marginBottom:8 }}>
                    <div style={{ fontSize:9,color:"#8892a4",textTransform:"uppercase",letterSpacing:"0.7px",marginBottom:4 }}>Today's Bookings</div>
                    {todaySlots.map((s,i)=>(
                      <div key={i} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",background:"rgba(245,166,35,0.06)",borderRadius:7,padding:"5px 8px",marginBottom:3,border:"1px solid rgba(245,166,35,0.2)",fontSize:11 }}>
                        <span><b style={{ color:"#f5a623" }}>{H(parseInt(s.startSlot))}–{H(parseInt(s.endSlot))}</b> · {s.consultant} · {s.customer}</span>
                        {(user.role==="admin"||s.consultant===user.name) && <button onClick={()=>handleRelease(s)} style={{ background:"rgba(231,76,60,0.1)",border:"1px solid rgba(231,76,60,0.25)",color:"#e74c3c",borderRadius:5,padding:"2px 7px",fontSize:10,cursor:"pointer" }}>✕</button>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display:"flex",gap:7,flexWrap:"wrap" }}>
                  {active.status==="FREE" && <>
                    <Btn color="#f5a623" onClick={()=>openBookModal(car.id,car.name)}>🔒 Book Slot</Btn>
                    <Btn color="#e74c3c" onClick={()=>openCheckoutModal(car.id,car.name,null)}>🚗 Take Out</Btn>
                  </>}
                  {active.status==="BLOCKED" && <>
                    <Btn color="#e74c3c" onClick={()=>openCheckoutModal(car.id,car.name,active)}>🚗 Take Out Now</Btn>
                    {canRel && <Btn color="#6b7a8d" onClick={()=>handleRelease(active)}>🔓 Release</Btn>}
                    <Btn color="#f5a623" onClick={()=>openBookModal(car.id,car.name)}>+ Add Slot</Btn>
                  </>}
                  {active.status==="OUT" && <Btn color="#00c896" onClick={()=>handleReturn(active)}>✅ Mark Returned</Btn>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── AVAILABILITY ── */}
      {tab==="avail" && (
        <div style={S.page}>
          <div style={{ marginBottom:12 }}>
            <label style={S.lbl}>Check availability for date</label>
            <input type="date" value={schedDate} min={todayStr()} onChange={e=>setSchedDate(e.target.value)} style={S.inp} />
            <div style={{ fontSize:11,color:"#e8c878",marginTop:5,fontWeight:600 }}>📅 {dayLabel(schedDate)}</div>
          </div>

          {cars.map(car => {
            const slots    = bookings.filter(b=>b.carId===car.id&&b.date===schedDate&&b.status==="BLOCKED").sort((a,b)=>parseInt(a.startSlot)-parseInt(b.startSlot));
            const freeHrs  = getFreeSlots(bookings, car.id, schedDate);
            const outB     = bookings.find(b=>b.carId===car.id&&b.status==="OUT");

            // Group consecutive free hours into ranges
            const freeRanges = [];
            let start = null;
            freeHrs.forEach((h,i) => {
              if (start===null) start=h;
              if (!freeHrs.includes(h+1)) { freeRanges.push({s:start,e:h+1}); start=null; }
            });

            return (
              <div key={car.id} style={{ ...S.card, border:`1px solid ${freeRanges.length>0?"rgba(0,200,150,0.25)":"rgba(245,166,35,0.25)"}` }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 }}>
                  <div>
                    <div style={{ fontSize:14,fontWeight:700 }}>{car.name}</div>
                    <div style={{ fontSize:10,color:"#8892a4" }}>{car.plate}</div>
                  </div>
                  <div style={{ fontSize:10,fontWeight:700,color:freeRanges.length>0?"#00c896":"#f5a623",background:freeRanges.length>0?"rgba(0,200,150,0.1)":"rgba(245,166,35,0.1)",padding:"3px 10px",borderRadius:14,border:`1px solid ${freeRanges.length>0?"rgba(0,200,150,0.3)":"rgba(245,166,35,0.3)"}` }}>
                    {outB&&schedDate===todayStr()?"On Drive":freeRanges.length===0?"Fully Booked":`${freeRanges.length} Free Range${freeRanges.length>1?"s":""}`}
                  </div>
                </div>

                <Timeline bookings={bookings} carId={car.id} date={schedDate} outStatus={outB&&schedDate===todayStr()} />

                {/* Booked slots */}
                {slots.length>0 && (
                  <div style={{ marginTop:8 }}>
                    <div style={{ fontSize:9,color:"#8892a4",textTransform:"uppercase",letterSpacing:"0.7px",marginBottom:4 }}>Booked Slots</div>
                    {slots.map((s,i)=>(
                      <div key={i} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",background:"rgba(245,166,35,0.06)",borderRadius:7,padding:"5px 8px",marginBottom:3,border:"1px solid rgba(245,166,35,0.2)",fontSize:11 }}>
                        <span><b style={{ color:"#f5a623" }}>🔒 {H(parseInt(s.startSlot))}–{H(parseInt(s.endSlot))}</b> · {s.consultant} · {s.customer}</span>
                        {(user.role==="admin"||s.consultant===user.name) && <button onClick={()=>handleRelease(s)} style={{ background:"rgba(231,76,60,0.1)",border:"1px solid rgba(231,76,60,0.25)",color:"#e74c3c",borderRadius:5,padding:"2px 7px",fontSize:10,cursor:"pointer" }}>✕</button>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Free ranges — tap to book */}
                {freeRanges.length>0 && (
                  <div style={{ marginTop:8 }}>
                    <div style={{ fontSize:9,color:"#8892a4",textTransform:"uppercase",letterSpacing:"0.7px",marginBottom:4 }}>Available — Tap to Book</div>
                    {freeRanges.map((r,i)=>(
                      <button key={i} onClick={()=>{ openBookModal(car.id,car.name,schedDate,String(r.s),String(r.e)); setTab("today"); }}
                        style={{ display:"block",width:"100%",background:"rgba(0,200,150,0.06)",border:"1px dashed rgba(0,200,150,0.4)",borderRadius:7,padding:"6px 8px",color:"#00c896",fontSize:11,cursor:"pointer",textAlign:"left",marginBottom:4,fontWeight:600 }}>
                        ✅ {H(r.s)} – {H(r.e)} &nbsp;<span style={{ color:"#6b7a8d",fontSize:10,fontWeight:400 }}>Tap to book this slot</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── SCHEDULE (7 days) ── */}
      {tab==="schedule" && (
        <div style={S.page}>
          <div style={{ fontSize:11,color:"#8892a4",marginBottom:10 }}>7-day overview — all cars</div>
          {cars.map(car => (
            <div key={car.id} style={S.card}>
              <div style={{ fontSize:14,fontWeight:700,marginBottom:10 }}>{car.name} <span style={{ fontSize:10,color:"#8892a4" }}>{car.plate}</span></div>
              {Array.from({length:7},(_,i)=>getDay(i)).map(day => {
                const slots = bookings.filter(b=>b.carId===car.id&&b.date===day&&b.status==="BLOCKED").sort((a,b)=>parseInt(a.startSlot)-parseInt(b.startSlot));
                const free  = getFreeSlots(bookings, car.id, day);
                // Group free hours
                const freeRanges = [];
                let st = null;
                free.forEach(h => {
                  if (st===null) st=h;
                  if (!free.includes(h+1)) { freeRanges.push({s:st,e:h+1}); st=null; }
                });
                return (
                  <div key={day} style={{ display:"flex",gap:8,alignItems:"flex-start",marginBottom:8,paddingBottom:8,borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ width:74,flexShrink:0 }}>
                      <div style={{ fontSize:11,fontWeight:day===todayStr()?700:400,color:day===todayStr()?"#e8c878":"#e8eaf0" }}>{dayLabel(day)}</div>
                      <div style={{ fontSize:9,color:"#6b7a8d" }}>{day.slice(5)}</div>
                    </div>
                    <div style={{ flex:1 }}>
                      <Timeline bookings={bookings} carId={car.id} date={day} outStatus={false} />
                      <div style={{ display:"flex",flexWrap:"wrap",gap:4,marginTop:5 }}>
                        {slots.map((s,i)=>(
                          <span key={i} style={{ fontSize:10,background:"rgba(245,166,35,0.12)",color:"#f5a623",padding:"2px 6px",borderRadius:6,border:"1px solid rgba(245,166,35,0.25)" }}>
                            🔒 {H(parseInt(s.startSlot))}–{H(parseInt(s.endSlot))} · {s.consultant}
                          </span>
                        ))}
                        {freeRanges.map((r,i)=>(
                          <span key={i} style={{ fontSize:10,background:"rgba(0,200,150,0.08)",color:"#00c896",padding:"2px 6px",borderRadius:6,border:"1px solid rgba(0,200,150,0.2)" }}>
                            ✅ {H(r.s)}–{H(r.e)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* ── LOG ── */}
      {tab==="log" && (
        <div style={S.page}>
          <button onClick={loadLog} style={{ background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:7,padding:"6px 12px",color:"#8892a4",fontSize:11,cursor:"pointer",marginBottom:10 }}>↻ Refresh</button>
          {log.length===0
            ? <div style={{ textAlign:"center",color:"#6b7a8d",marginTop:40,fontSize:13 }}>No activity yet</div>
            : log.map((e,i)=>(
              <div key={i} style={{ ...S.card, display:"flex",gap:10,alignItems:"flex-start",padding:"10px 12px" }}>
                <div style={{ fontSize:16,marginTop:1 }}>{{ BOOKED:"🔒",CHECKOUT:"🚗",RETURNED:"✅",RELEASED:"🔓",AUTO_RELEASED:"⏰" }[e.action]||"•"}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12,fontWeight:600 }}>{e.car} — {e.action}</div>
                  <div style={{ fontSize:10,color:"#8892a4",marginTop:2 }}>{e.consultant} · {e.customer}{e.detail?` · ${e.detail}`:""}</div>
                </div>
                <div style={{ fontSize:10,color:"#6b7a8d",whiteSpace:"nowrap" }}>{e.time}</div>
              </div>
            ))
          }
        </div>
      )}

      {/* ── SETTINGS ── */}
      {tab==="settings" && user.role==="admin" && (
        <div style={S.page}>
          {/* Add Car */}
          <div style={S.card}>
            <div style={{ fontSize:10,color:"#8892a4",textTransform:"uppercase",letterSpacing:"1px",fontWeight:700,marginBottom:8 }}>🚗 Fleet Cars</div>
            <div style={{ display:"flex",flexDirection:"column",gap:7,marginBottom:10 }}>
              <input value={newCName} onChange={e=>setNewCName(e.target.value)} placeholder="Model (e.g. GLS 450)" style={S.inp} />
              <input value={newCPlate} onChange={e=>setNewCPlate(e.target.value)} placeholder="Plate (e.g. TS09 MB005)" style={S.inp} />
              <Btn color="#c0a060" bg={gold} onClick={async()=>{ if(!newCName||!newCPlate) return showToast("Fill both fields","err"); const ok=await post({action:"addCar",name:newCName,plate:newCPlate}); if(ok){setNewCName("");setNewCPlate("");showToast("Car added ✅");} }}>+ Add Car</Btn>
            </div>
            {cars.map(c=>(
              <div key={c.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 10px",background:"rgba(255,255,255,0.04)",borderRadius:7,marginBottom:5 }}>
                <div><div style={{ fontSize:12,fontWeight:600 }}>{c.name}</div><div style={{ fontSize:10,color:"#8892a4" }}>{c.plate}</div></div>
                <button onClick={async()=>{ if(!window.confirm(`Remove ${c.name}?`)) return; const ok=await post({action:"removeCar",carId:c.id}); if(ok) showToast(`${c.name} removed`); }} style={{ background:"rgba(231,76,60,0.1)",border:"1px solid rgba(231,76,60,0.25)",color:"#e74c3c",borderRadius:5,padding:"3px 8px",fontSize:10,cursor:"pointer" }}>Remove</button>
              </div>
            ))}
          </div>
          {/* Add Consultant */}
          <div style={S.card}>
            <div style={{ fontSize:10,color:"#8892a4",textTransform:"uppercase",letterSpacing:"1px",fontWeight:700,marginBottom:8 }}>👤 Consultants</div>
            <div style={{ display:"flex",gap:7,marginBottom:10 }}>
              <input value={newConsName} onChange={e=>setNewConsName(e.target.value)} placeholder="Consultant name" style={{ ...S.inp,flex:1 }} />
              <Btn color="#c0a060" bg={gold} onClick={async()=>{ if(!newConsName) return; const ok=await post({action:"addConsultant",name:newConsName,role:"consultant"}); if(ok){setNewConsName("");showToast("Added ✅");} }}>+ Add</Btn>
            </div>
            {consultants.map(c=>(
              <div key={c.name} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 10px",background:"rgba(255,255,255,0.04)",borderRadius:7,marginBottom:5 }}>
                <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                  <div style={{ width:26,height:26,borderRadius:"50%",background:"rgba(192,160,96,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#c0a060",fontWeight:700 }}>{c.name[0]}</div>
                  <span style={{ fontSize:12 }}>{c.name}</span>
                  {c.role==="admin"&&<span style={{ fontSize:9,color:"#c0a060",background:"rgba(192,160,96,0.1)",padding:"1px 6px",borderRadius:6 }}>ADMIN</span>}
                </div>
                {c.name!==user.name&&<button onClick={async()=>{ const ok=await post({action:"removeConsultant",name:c.name}); if(ok) showToast(`${c.name} removed`); }} style={{ background:"rgba(231,76,60,0.1)",border:"1px solid rgba(231,76,60,0.25)",color:"#e74c3c",borderRadius:5,padding:"3px 8px",fontSize:10,cursor:"pointer" }}>Remove</button>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── BOOKING MODAL ── */}
      {modal && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:200,backdropFilter:"blur(4px)" }} onClick={()=>setModal(null)}>
          <div style={{ background:"#0f1624",borderRadius:"18px 18px 0 0",padding:"20px 16px 32px",width:"100%",maxWidth:480,border:"1px solid rgba(255,255,255,0.1)",boxShadow:"0 -20px 60px rgba(0,0,0,0.5)",maxHeight:"90vh",overflowY:"auto" }} onClick={e=>e.stopPropagation()}>

            <div style={{ fontSize:14,fontWeight:700,marginBottom:3 }}>
              {modal.type==="book"?"🔒 Book Test Drive Slot":"🚗 Take Car Out"}
            </div>
            <div style={{ fontSize:11,color:"#8892a4",marginBottom:14 }}>{modal.carName}</div>

            {/* Consultant */}
            {modal.type==="book" && (
              <div style={{ marginBottom:10 }}>
                <label style={S.lbl}>Consultant</label>
                <select value={fConsultant} onChange={e=>setFC(e.target.value)} style={S.inp}>
                  <option value="">Select…</option>
                  {consultants.map(c=><option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            )}

            {/* Customer */}
            <div style={{ marginBottom:10 }}>
              <label style={S.lbl}>Customer Name</label>
              <input value={fCustomer} onChange={e=>setFCust(e.target.value)} placeholder="Enter customer name" style={S.inp} />
            </div>
            <div style={{ marginBottom:10 }}>
              <label style={S.lbl}>Phone <span style={{ color:"#4a5568" }}>(optional)</span></label>
              <input value={fPhone} onChange={e=>setFPhone(e.target.value)} placeholder="9XXXXXXXXX" style={S.inp} />
            </div>

            {modal.type==="book" && (<>
              {/* Date */}
              <div style={{ marginBottom:10 }}>
                <label style={S.lbl}>Date</label>
                <input type="date" value={fDate} min={todayStr()} onChange={e=>{ setFDate(e.target.value); setFStart(""); setFEnd(""); setSchedDate(e.target.value); }} style={S.inp} />
                {fDate && <div style={{ fontSize:10,color:"#e8c878",marginTop:4 }}>📅 {dayLabel(fDate)}</div>}
              </div>

              {/* Time slot dropdowns */}
              {fDate && (
                <div style={{ marginBottom:10 }}>
                  <label style={S.lbl}>Time Slot</label>
                  {modalFreeHrs.length===0
                    ? <div style={{ fontSize:11,color:"#e74c3c",background:"rgba(231,76,60,0.08)",borderRadius:7,padding:"8px 10px",border:"1px solid rgba(231,76,60,0.2)" }}>🚫 No free slots on this date</div>
                    : (
                      <div style={{ display:"flex",gap:8,alignItems:"center" }}>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:9,color:"#8892a4",marginBottom:4 }}>START</div>
                          <select value={fStart} onChange={e=>{setFStart(e.target.value);setFEnd("");}} style={S.inp}>
                            <option value="">Select…</option>
                            {modalStartOpts.map(h=><option key={h} value={String(h)}>{H(h)}</option>)}
                          </select>
                        </div>
                        <div style={{ color:"#6b7a8d",fontSize:14,marginTop:12 }}>→</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:9,color:"#8892a4",marginBottom:4 }}>END</div>
                          <select value={fEnd} onChange={e=>setFEnd(e.target.value)} style={S.inp} disabled={!fStart}>
                            <option value="">Select…</option>
                            {modalEndOpts.map(h=><option key={h} value={String(h)}>{H(h)}</option>)}
                          </select>
                        </div>
                      </div>
                    )
                  }
                  {fStart&&fEnd&&<div style={{ fontSize:10,color:"#00c896",marginTop:5,fontWeight:600 }}>✅ {H(parseInt(fStart))} → {H(parseInt(fEnd))} · {parseInt(fEnd)-parseInt(fStart)} hr{parseInt(fEnd)-parseInt(fStart)>1?"s":""}</div>}
                </div>
              )

              {/* Location */}
              <div style={{ marginBottom:10 }}>
                <label style={S.lbl}>Route / Location <span style={{ color:"#4a5568" }}>(optional)</span></label>
                <input value={fLocation} onChange={e=>setFLoc(e.target.value)} placeholder="e.g. Gachibowli–HITEC City loop" style={S.inp} />
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={S.lbl}>Notes <span style={{ color:"#4a5568" }}>(optional)</span></label>
                <input value={fNotes} onChange={e=>setFNotes(e.target.value)} placeholder="e.g. VIP customer" style={S.inp} />
              </div>
            </>)}

            {/* Return time for checkout */}
            {modal.type==="checkout" && (
              <div style={{ marginBottom:14 }}>
                <label style={S.lbl}>Expected Return Time</label>
                <select value={fReturn} onChange={e=>setFReturn(e.target.value)} style={S.inp}>
                  <option value="">Select return time…</option>
                  {HOURS.map(h=><option key={h} value={HH(h)}>{H(h)}</option>)}
                </select>
              </div>
            )}

            <div style={{ display:"flex",gap:8 }}>
              <button onClick={()=>setModal(null)} style={{ flex:1,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:9,padding:11,color:"#8892a4",fontSize:12,cursor:"pointer",fontWeight:600 }}>Cancel</button>
              <button onClick={modal.type==="book"?handleBook:handleCheckout} disabled={syncing} style={{ flex:2,background:modal.type==="book"?"linear-gradient(135deg,#f5a623,#e8941a)":gold,border:"none",borderRadius:9,padding:11,color:"#0a0e1a",fontSize:12,cursor:"pointer",fontWeight:700,opacity:syncing?0.6:1 }}>
                {syncing?"Saving…":modal.type==="book"?"Confirm Booking":"Confirm Checkout"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed",bottom:22,left:"50%",transform:"translateX(-50%)",background:toast.type==="err"?"#e74c3c":"#00c896",color:"#fff",padding:"9px 18px",borderRadius:18,fontSize:12,fontWeight:600,zIndex:300,boxShadow:"0 4px 20px rgba(0,0,0,0.4)",maxWidth:"90vw",textAlign:"center" }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
