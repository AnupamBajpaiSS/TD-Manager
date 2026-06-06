import { useState, useEffect, useCallback } from "react";

const API_URL = "https://script.google.com/macros/s/AKfycbzcaplTA1BVtRXg0wAX1RLEr6EoXu7orfDbWWDgFsqx9-9GjMo4jyWyjmBzpFwmsQ/exec";
const STATUS = { FREE:"FREE", BLOCKED:"BLOCKED", OUT:"OUT" };
const HOURS = Array.from({length:13},(_,i)=>`${(i+9).toString().padStart(2,"0")}:00`); // 09:00–21:00

const S = {
  app:  { minHeight:"100vh", background:"linear-gradient(135deg,#0a0e1a 0%,#0d1b2a 50%,#091520 100%)", fontFamily:"'DM Sans','Segoe UI',sans-serif", color:"#e8eaf0" },
  hdr:  { background:"rgba(255,255,255,0.04)", borderBottom:"1px solid rgba(255,255,255,0.08)", padding:"14px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", backdropFilter:"blur(10px)", position:"sticky", top:0, zIndex:100 },
  tabs: { display:"flex", borderBottom:"1px solid rgba(255,255,255,0.07)", padding:"0 14px", overflowX:"auto" },
  page: { padding:"14px" },
  card: { background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:14, padding:"14px", marginBottom:10 },
  inp:  { width:"100%", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:8, padding:"10px 12px", color:"#e8eaf0", fontSize:13, boxSizing:"border-box" },
  lbl:  { fontSize:11, color:"#8892a4", textTransform:"uppercase", letterSpacing:"0.8px", display:"block", marginBottom:6 },
  sec:  { fontSize:11, color:"#8892a4", textTransform:"uppercase", letterSpacing:"1px", fontWeight:700, marginBottom:10 },
};

const gold = "linear-gradient(135deg,#c0a060,#e8c878)";
const sc   = s => s===STATUS.FREE?"#00c896":s===STATUS.BLOCKED?"#f5a623":"#e74c3c";
const sl   = s => s===STATUS.FREE?"Available":s===STATUS.BLOCKED?"Blocked":"On Drive";
const ai   = a => ({BLOCKED:"🔒",OUT:"🚗",RETURNED:"✅",UNBLOCKED:"🔓",AUTO_RELEASED:"⏰"}[a]||"•");

function todayStr() { return new Date().toISOString().split("T")[0]; }
function nowTime()  { return new Date().toTimeString().slice(0,5); }
function getRelativeDay(n) { const d=new Date(); d.setDate(d.getDate()+n); return d.toISOString().split("T")[0]; }
function isToday(d) { return d===todayStr(); }
function isFuture(d){ return d>todayStr(); }
function isPastDateTime(date,time){ if(!date||!time) return false; return new Date(`${date}T${time}`) < new Date(); }
function formatDate(d){ if(!d) return ""; return new Date(d+"T00:00:00").toLocaleDateString("en-IN",{weekday:"short",day:"2-digit",month:"short"}); }
function dayLabel(d){ if(!d) return ""; if(isToday(d)) return "Today"; if(d===getRelativeDay(1)) return "Tomorrow"; return formatDate(d); }
function timeToMins(t){ if(!t) return 0; const [h,m]=t.split(":").map(Number); return h*60+m; }
function minsToTime(m){ return `${Math.floor(m/60).toString().padStart(2,"0")}:${(m%60).toString().padStart(2,"0")}`; }

// Find free slots for a car on a date
function getFreeSlots(bookedSlots, dayStart="09:00", dayEnd="21:00") {
  const start = timeToMins(dayStart), end = timeToMins(dayEnd);
  const sorted = [...bookedSlots].sort((a,b)=>timeToMins(a.blockStart)-timeToMins(b.blockStart));
  const free = [];
  let cursor = start;
  for (const s of sorted) {
    const sStart = timeToMins(s.blockStart), sEnd = timeToMins(s.blockEnd);
    if (sStart > cursor) free.push({ from:minsToTime(cursor), to:minsToTime(sStart) });
    cursor = Math.max(cursor, sEnd);
  }
  if (cursor < end) free.push({ from:minsToTime(cursor), to:minsToTime(end) });
  return free.filter(f => timeToMins(f.to)-timeToMins(f.from) >= 30);
}

function ABtn({ children, color, onClick, disabled, small }) {
  return <button onClick={onClick} disabled={disabled} style={{ background:`${color}18`, border:`1px solid ${color}44`, color, borderRadius:8, padding:small?"5px 10px":"7px 13px", fontSize:small?11:12, fontWeight:600, cursor:disabled?"not-allowed":"pointer", opacity:disabled?0.4:1 }}>{children}</button>;
}
function Tab({ active, onClick, children }) {
  return <button onClick={onClick} style={{ background:"none", border:"none", cursor:"pointer", padding:"12px 13px 10px", fontSize:12, fontWeight:600, color:active?"#c0a060":"#6b7a8d", borderBottom:`2px solid ${active?"#c0a060":"transparent"}`, textTransform:"uppercase", letterSpacing:"0.8px", whiteSpace:"nowrap" }}>{children}</button>;
}

async function apiFetch(p){ const r=await fetch(API_URL+"?"+new URLSearchParams(p)); return r.json(); }
async function apiPost(b){ const r=await fetch(API_URL,{method:"POST",body:JSON.stringify(b)}); return r.json(); }

// ── LOGIN ──────────────────────────────────────────────────
function LoginScreen({ consultants, onLogin }) {
  const [sel, setSel] = useState("");
  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0a0e1a,#0d1b2a)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ width:56, height:56, borderRadius:"50%", background:gold, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, fontWeight:700, color:"#0a0e1a", marginBottom:16 }}>★</div>
      <div style={{ fontSize:20, fontWeight:700, marginBottom:4 }}>Silver Star MB</div>
      <div style={{ fontSize:12, color:"#8892a4", letterSpacing:"1px", textTransform:"uppercase", marginBottom:36 }}>Test Drive Manager</div>
      <div style={{ width:"100%", maxWidth:340 }}>
        <div style={{ fontSize:13, color:"#8892a4", marginBottom:12, textAlign:"center" }}>Who are you?</div>
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
          {consultants.map(c=>(
            <button key={c.name} onClick={()=>setSel(c.name)} style={{ background:sel===c.name?"rgba(192,160,96,0.15)":"rgba(255,255,255,0.04)", border:`1px solid ${sel===c.name?"#c0a060":"rgba(255,255,255,0.08)"}`, borderRadius:10, padding:"12px 16px", color:sel===c.name?"#e8c878":"#e8eaf0", fontSize:14, fontWeight:600, cursor:"pointer", textAlign:"left", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span>{c.name}</span>
              {c.role==="admin" && <span style={{ fontSize:10, color:"#c0a060", background:"rgba(192,160,96,0.15)", padding:"2px 8px", borderRadius:10 }}>ADMIN</span>}
            </button>
          ))}
        </div>
        <button onClick={()=>sel&&onLogin(consultants.find(c=>c.name===sel))} disabled={!sel} style={{ width:"100%", background:sel?gold:"rgba(255,255,255,0.06)", border:"none", borderRadius:12, padding:14, color:"#0a0e1a", fontSize:14, fontWeight:700, cursor:sel?"pointer":"not-allowed", opacity:sel?1:0.5 }}>Enter →</button>
      </div>
    </div>
  );
}

// ── TIMELINE BAR (visual slot viewer) ─────────────────────
function TimelineBar({ bookedSlots, dayStart="09:00", dayEnd="21:00" }) {
  const totalMins = timeToMins(dayEnd) - timeToMins(dayStart);
  const freeSlots = getFreeSlots(bookedSlots, dayStart, dayEnd);
  return (
    <div style={{ marginTop:8 }}>
      <div style={{ position:"relative", height:18, borderRadius:6, background:"rgba(0,200,150,0.15)", overflow:"hidden", border:"1px solid rgba(0,200,150,0.2)" }}>
        {/* Booked segments */}
        {bookedSlots.map((s,i)=>{
          const left = ((timeToMins(s.blockStart)-timeToMins(dayStart))/totalMins)*100;
          const width= ((timeToMins(s.blockEnd)-timeToMins(s.blockStart))/totalMins)*100;
          return <div key={i} title={`${s.blockStart}-${s.blockEnd} · ${s.consultant}`} style={{ position:"absolute", left:`${left}%`, width:`${width}%`, height:"100%", background:"rgba(245,166,35,0.7)", borderLeft:"1px solid rgba(245,166,35,0.9)" }} />;
        })}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:2 }}>
        <span style={{ fontSize:9, color:"#4a5568" }}>{dayStart}</span>
        <span style={{ fontSize:9, color:"#4a5568" }}>{dayEnd}</span>
      </div>
      {/* Free slot pills */}
      {freeSlots.length>0 && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginTop:5 }}>
          {freeSlots.map((f,i)=>(
            <span key={i} style={{ fontSize:10, background:"rgba(0,200,150,0.12)", color:"#00c896", padding:"2px 7px", borderRadius:8, border:"1px solid rgba(0,200,150,0.25)" }}>
              ✅ {f.from}–{f.to}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── MAIN APP ───────────────────────────────────────────────
export default function TestDriveApp() {
  const [user, setUser]               = useState(null);
  const [consultants, setConsultants] = useState([]);
  const [cars, setCars]               = useState([]);
  const [bookings, setBookings]       = useState([]);
  const [log, setLog]                 = useState([]);
  const [loading, setLoading]         = useState(true);
  const [syncing, setSyncing]         = useState(false);
  const [modal, setModal]             = useState(null);
  const [form, setForm]               = useState({ consultant:"", customer:"", blockDate:"", blockStart:"", blockEnd:"", expectedReturn:"", phone:"", notes:"", location:"", locLoading:false });
  const [toast, setToast]             = useState(null);
  const [tab, setTab]                 = useState("cars");
  const [schedDate, setSchedDate]     = useState(todayStr());
  const [newConsultant, setNewConsultant] = useState("");
  const [newCarName, setNewCarName]       = useState("");
  const [newCarPlate, setNewCarPlate]     = useState("");

  const showToast = (msg,type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3500); };

  const fetchData = useCallback(async () => {
    try {
      const d = await apiFetch({ action:"getData" });
      if (d.error) { showToast("Sync error","error"); return; }
      setConsultants(d.consultants||[]);
      setCars(d.cars||[]);
      setBookings(d.bookings||[]);
    } catch(e) { showToast("Network error","error"); }
  },[]);

  const fetchLog = useCallback(async () => {
    const d = await apiFetch({ action:"getLog" });
    setLog(d.log||[]);
  },[]);

  useEffect(() => {
    fetchData().finally(()=>setLoading(false));
    const t = setInterval(fetchData, 15000);
    return ()=>clearInterval(t);
  },[fetchData]);

  // Auto-release expired blocks
  useEffect(() => {
    bookings.forEach(b => {
      if (b.status===STATUS.BLOCKED && isPastDateTime(b.blockDate, b.blockEnd)) {
        const car = cars.find(c=>String(c.id)===String(b.carId));
        apiPost({ action:"releaseCar", carId:b.carId, bookingId:b.bookingId, carName:car?.name, requestedBy:"AUTO", requesterRole:"admin", blockedBy:b.consultant, customer:b.customer, autoRelease:true })
          .then(()=>fetchData());
      }
    });
  },[bookings]);

  useEffect(() => { if(tab==="log") fetchLog(); },[tab,fetchLog]);

  const doPost = async (body) => {
    setSyncing(true);
    try {
      const r = await apiPost(body);
      if (r.error||!r.ok) { showToast(r.error||"Failed","error"); return false; }
      await fetchData(); return true;
    } catch(e) { showToast("Network error","error"); return false; }
    finally { setSyncing(false); }
  };

  const getCar    = id => cars.find(c=>String(c.id)===String(id));
  const carSlots  = (carId,date) => bookings.filter(b=>String(b.carId)===String(carId)&&b.blockDate===date&&b.status===STATUS.BLOCKED).sort((a,b)=>timeToMins(a.blockStart)-timeToMins(b.blockStart));
  const carOut    = (carId) => bookings.find(b=>String(b.carId)===String(carId)&&b.status===STATUS.OUT);

  const getActiveStatus = (carId) => {
    const out = carOut(carId);
    if (out) return {...out, displayStatus:STATUS.OUT};
    const todayB = bookings.find(b=>String(b.carId)===String(carId)&&b.status===STATUS.BLOCKED&&b.blockDate===todayStr());
    if (todayB) return {...todayB, displayStatus:STATUS.BLOCKED};
    return { displayStatus:STATUS.FREE };
  };

  // ── ACTIONS ──────────────────────────────────────────────
  const handleBlock = async () => {
    if (!form.consultant||!form.customer) return showToast("Fill all fields","error");
    if (!form.blockDate) return showToast("Select date","error");
    if (!form.blockStart||!form.blockEnd) return showToast("Set start & end time","error");
    if (form.blockStart>=form.blockEnd) return showToast("End must be after start","error");
    const existing = carSlots(modal.carId, form.blockDate);
    const conflict = existing.find(b=>!(form.blockEnd<=b.blockStart||form.blockStart>=b.blockEnd));
    if (conflict) return showToast(`Conflict: ${conflict.consultant} has ${conflict.blockStart}–${conflict.blockEnd}`,"error");
    const car = getCar(modal.carId);
    const ok = await doPost({ action:"blockCar", carId:modal.carId, carName:car?.name, consultant:form.consultant, customer:form.customer, phone:form.phone, notes:form.notes, location:form.location, blockDate:form.blockDate, blockStart:form.blockStart, blockEnd:form.blockEnd });
    if (ok) { showToast(`Booked for ${dayLabel(form.blockDate)}`); setModal(null); }
  };

  const handleCheckout = async () => {
    if (!form.expectedReturn) return showToast("Set return time","error");
    const active = getActiveStatus(modal.carId);
    const car = getCar(modal.carId);
    const consultant = active.consultant||form.consultant;
    const customer   = active.customer||form.customer;
    if (!consultant||!customer) return showToast("Fill consultant & customer","error");
    const ok = await doPost({ action:"checkoutCar", carId:modal.carId, bookingId:active.bookingId, carName:car?.name, consultant, customer, expectedReturn:form.expectedReturn });
    if (ok) { showToast(`${car?.name} checked out`); setModal(null); }
  };

  const handleReturn = async (carId) => {
    const active = getActiveStatus(carId);
    const car = getCar(carId);
    const ok = await doPost({ action:"returnCar", carId, bookingId:active.bookingId, carName:car?.name, consultant:active.consultant, customer:active.customer });
    if (ok) showToast(`${car?.name} returned ✅`);
  };

  const handleRelease = async (carId, booking) => {
    const car = getCar(carId);
    if (user.role!=="admin"&&booking.consultant!==user.name) return showToast(`Only ${booking.consultant} or Admin can release`,"error");
    const ok = await doPost({ action:"releaseCar", carId, bookingId:booking.bookingId, carName:car?.name, requestedBy:user.name, requesterRole:user.role, blockedBy:booking.consultant, customer:booking.customer });
    if (ok) showToast("Block released");
  };

  const handleAddConsultant = async () => {
    const name=newConsultant.trim();
    if (!name) return showToast("Enter name","error");
    if (consultants.find(c=>c.name===name)) return showToast("Already exists","error");
    const ok=await doPost({action:"addConsultant",name,role:"consultant"});
    if (ok) { setNewConsultant(""); showToast(`${name} added`); }
  };
  const handleRemoveConsultant = async (name) => {
    if (name===user.name) return showToast("Can't remove yourself","error");
    const ok=await doPost({action:"removeConsultant",name});
    if (ok) showToast(`${name} removed`);
  };
  const handleAddCar = async () => {
    const name=newCarName.trim(),plate=newCarPlate.trim();
    if (!name||!plate) return showToast("Enter car & plate","error");
    const ok=await doPost({action:"addCar",name,plate});
    if (ok) { setNewCarName(""); setNewCarPlate(""); showToast(`${name} added`); }
  };
  const handleRemoveCar = async (carId) => {
    const a=getActiveStatus(carId);
    if (a.displayStatus!==STATUS.FREE) return showToast("Return car first","error");
    const car=getCar(carId);
    const ok=await doPost({action:"removeCar",carId});
    if (ok) showToast(`${car?.name} removed`);
  };

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#0a0e1a", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:"#8892a4", gap:16 }}>
      <div style={{ width:40, height:40, borderRadius:"50%", background:gold, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, color:"#0a0e1a", fontWeight:700 }}>★</div>
      <div style={{ fontSize:13 }}>Connecting…</div>
    </div>
  );
  if (!user) return <LoginScreen consultants={consultants} onLogin={setUser} />;

  return (
    <div style={S.app}>
      {/* Header */}
      <div style={S.hdr}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:"50%", background:gold, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:"#0a0e1a" }}>★</div>
          <div>
            <div style={{ fontSize:14, fontWeight:700 }}>Silver Star MB</div>
            <div style={{ fontSize:10, color:"#8892a4", letterSpacing:"1px", textTransform:"uppercase" }}>Test Drive Manager</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {syncing && <div style={{ fontSize:10, color:"#f5a623" }}>Saving…</div>}
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:12, fontWeight:600, color:"#e8c878" }}>{user.name}</div>
            <div style={{ fontSize:10, color:"#8892a4", textTransform:"uppercase" }}>{user.role}</div>
          </div>
          <button onClick={()=>setUser(null)} style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:6, padding:"4px 8px", color:"#8892a4", fontSize:10, cursor:"pointer" }}>Exit</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        <Tab active={tab==="cars"}      onClick={()=>setTab("cars")}>🚘 Today</Tab>
        <Tab active={tab==="avail"}     onClick={()=>setTab("avail")}>✅ Availability</Tab>
        <Tab active={tab==="schedule"}  onClick={()=>setTab("schedule")}>📅 Schedule</Tab>
        <Tab active={tab==="log"}       onClick={()=>setTab("log")}>📋 Log</Tab>
        {user.role==="admin" && <Tab active={tab==="settings"} onClick={()=>setTab("settings")}>⚙️</Tab>}
      </div>

      {/* ── TODAY TAB ── */}
      {tab==="cars" && (
        <div style={S.page}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:10 }}>
            {[
              {label:"Available",count:cars.filter(c=>getActiveStatus(c.id).displayStatus===STATUS.FREE).length,color:"#00c896"},
              {label:"Blocked",  count:cars.filter(c=>getActiveStatus(c.id).displayStatus===STATUS.BLOCKED).length,color:"#f5a623"},
              {label:"On Drive", count:cars.filter(c=>getActiveStatus(c.id).displayStatus===STATUS.OUT).length,color:"#e74c3c"},
            ].map(s=>(
              <div key={s.label} style={{ background:"rgba(255,255,255,0.04)", borderRadius:10, padding:"10px 6px", textAlign:"center", border:`1px solid ${s.color}22` }}>
                <div style={{ fontSize:22, fontWeight:700, color:s.color }}>{s.count}</div>
                <div style={{ fontSize:10, color:"#8892a4", textTransform:"uppercase", letterSpacing:"0.7px" }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize:10, color:"#4a5568", textAlign:"center", marginBottom:10 }}>
            Live · <span style={{ cursor:"pointer", color:"#6b7a8d", textDecoration:"underline" }} onClick={fetchData}>Refresh</span>
          </div>

          {cars.map(car => {
            const active   = getActiveStatus(car.id);
            const stColor  = sc(active.displayStatus);
            const canRel   = user.role==="admin"||active.consultant===user.name;
            const todaySlots = carSlots(car.id, todayStr());
            const freeSlots  = getFreeSlots(todaySlots);
            const futureCount = bookings.filter(b=>String(b.carId)===String(car.id)&&b.status===STATUS.BLOCKED&&isFuture(b.blockDate)).length;

            return (
              <div key={car.id} style={{ ...S.card, border:`1px solid ${stColor}33` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                  <div>
                    <div style={{ fontSize:16, fontWeight:700 }}>{car.name}</div>
                    <div style={{ fontSize:11, color:"#8892a4", marginTop:1 }}>{car.plate}</div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                    <div style={{ background:`${stColor}22`, color:stColor, padding:"4px 12px", borderRadius:20, fontSize:11, fontWeight:700, textTransform:"uppercase", border:`1px solid ${stColor}44` }}>{sl(active.displayStatus)}</div>
                    {futureCount>0 && <div style={{ fontSize:10, color:"#f5a623", background:"rgba(245,166,35,0.1)", padding:"2px 8px", borderRadius:8, border:"1px solid rgba(245,166,35,0.25)" }}>📅 {futureCount} upcoming</div>}
                  </div>
                </div>

                {/* Today's timeline */}
                <div style={{ marginBottom:8 }}>
                  <div style={{ fontSize:10, color:"#8892a4", textTransform:"uppercase", letterSpacing:"0.7px", marginBottom:4 }}>Today's Timeline</div>
                  <TimelineBar bookedSlots={todaySlots} />
                  {active.displayStatus===STATUS.OUT && (
                    <div style={{ fontSize:11, color:"#e74c3c", marginTop:4 }}>🚗 Currently out · Return by {active.expectedReturn||"—"}</div>
                  )}
                </div>

                {/* Active booking info */}
                {active.displayStatus!==STATUS.FREE && (
                  <div style={{ background:"rgba(0,0,0,0.2)", borderRadius:10, padding:"8px 12px", marginBottom:8, fontSize:12 }}>
                    <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
                      <div><span style={{ color:"#8892a4" }}>Consultant: </span><b>{active.consultant}</b></div>
                      <div><span style={{ color:"#8892a4" }}>Customer: </span><b>{active.customer}</b></div>
                    </div>
                    {active.displayStatus===STATUS.BLOCKED && active.blockStart && (
                      <div style={{ color:"#f5a623", marginTop:4, fontWeight:600 }}>⏰ {active.blockStart} → {active.blockEnd}</div>
                    )}
                    {active.location && (
                      <div style={{ marginTop:4, fontSize:11, color:"#63b3ed" }}>📍 {active.location}</div>
                    )}
                    {active.displayStatus===STATUS.BLOCKED && !canRel && (
                      <div style={{ marginTop:5, fontSize:11, color:"#f5a623", background:"rgba(245,166,35,0.08)", borderRadius:6, padding:"4px 8px" }}>🔐 Only {active.consultant} or Admin can release</div>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {active.displayStatus===STATUS.FREE && (<>
                    <ABtn color="#f5a623" onClick={()=>{ setForm({consultant:user.name,customer:"",phone:"",notes:"",location:"",locLoading:false,blockDate:todayStr(),blockStart:"",blockEnd:"",expectedReturn:""}); setModal({carId:car.id,action:"block"}); }}>🔒 Book Slot</ABtn>
                    <ABtn color="#e74c3c" onClick={()=>{ setForm({consultant:user.name,customer:"",phone:"",notes:"",location:"",locLoading:false,blockDate:"",blockStart:"",blockEnd:"",expectedReturn:""}); setModal({carId:car.id,action:"checkout"}); }}>🚗 Take Out</ABtn>
                  </>)}
                  {active.displayStatus===STATUS.BLOCKED && (<>
                    {isToday(active.blockDate) && <ABtn color="#e74c3c" onClick={()=>{ setForm({consultant:active.consultant,customer:active.customer,phone:"",notes:"",location:"",locLoading:false,blockDate:"",blockStart:"",blockEnd:"",expectedReturn:""}); setModal({carId:car.id,action:"checkout_from_block"}); }}>🚗 Take Out Now</ABtn>}
                    <ABtn color="#6b7a8d" onClick={()=>handleRelease(car.id,active)} disabled={!canRel}>🔓 Release{!canRel?" 🔐":""}</ABtn>
                    <ABtn color="#f5a623" onClick={()=>{ setForm({consultant:user.name,customer:"",phone:"",notes:"",location:"",locLoading:false,blockDate:todayStr(),blockStart:"",blockEnd:"",expectedReturn:""}); setModal({carId:car.id,action:"block"}); }}>+ Slot</ABtn>
                  </>)}
                  {active.displayStatus===STATUS.OUT && (
                    <ABtn color="#00c896" onClick={()=>handleReturn(car.id)}>✅ Mark Returned</ABtn>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── AVAILABILITY TAB ── */}
      {tab==="avail" && (
        <div style={S.page}>
          <div style={{ marginBottom:14 }}>
            <label style={S.lbl}>Check availability for</label>
            <input type="date" value={schedDate} min={todayStr()} onChange={e=>setSchedDate(e.target.value)} style={S.inp} />
            <div style={{ fontSize:12, color:"#e8c878", marginTop:6, fontWeight:600 }}>📅 {dayLabel(schedDate)||schedDate}</div>
          </div>

          {cars.map(car => {
            const slots     = carSlots(car.id, schedDate);
            const freeSlots = getFreeSlots(slots);
            const outB      = carOut(car.id);
            const isFullyBusy = isToday(schedDate) && outB;

            return (
              <div key={car.id} style={{ ...S.card, border:`1px solid ${freeSlots.length>0?"rgba(0,200,150,0.25)":"rgba(245,166,35,0.25)"}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <div>
                    <div style={{ fontSize:15, fontWeight:700 }}>{car.name}</div>
                    <div style={{ fontSize:11, color:"#8892a4" }}>{car.plate}</div>
                  </div>
                  <div style={{ fontSize:11, fontWeight:700, color:freeSlots.length>0?"#00c896":"#f5a623", background:freeSlots.length>0?"rgba(0,200,150,0.1)":"rgba(245,166,35,0.1)", padding:"4px 12px", borderRadius:20, border:`1px solid ${freeSlots.length>0?"rgba(0,200,150,0.3)":"rgba(245,166,35,0.3)"}` }}>
                    {isFullyBusy?"On Drive":freeSlots.length>0?`${freeSlots.length} Free Slot${freeSlots.length>1?"s":""}` : "Fully Booked"}
                  </div>
                </div>

                {/* Visual timeline */}
                <TimelineBar bookedSlots={slots} />

                {/* Booked slots */}
                {slots.length>0 && (
                  <div style={{ marginTop:8 }}>
                    <div style={{ fontSize:10, color:"#8892a4", textTransform:"uppercase", letterSpacing:"0.7px", marginBottom:4 }}>Booked Slots</div>
                    {slots.map((s,i)=>(
                      <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"rgba(245,166,35,0.06)", borderRadius:8, padding:"6px 10px", marginBottom:4, border:"1px solid rgba(245,166,35,0.2)" }}>
                        <div style={{ fontSize:12 }}>
                          <span style={{ color:"#f5a623", fontWeight:600 }}>🔒 {s.blockStart}–{s.blockEnd}</span>
                          <span style={{ color:"#8892a4", marginLeft:8 }}>{s.consultant} · {s.customer}</span>
                          {s.location && <div style={{ color:"#63b3ed", fontSize:11, marginTop:2 }}>📍 {s.location}</div>}
                        </div>
                        {(user.role==="admin"||s.consultant===user.name) && (
                          <button onClick={()=>handleRelease(car.id,s)} style={{ background:"rgba(231,76,60,0.1)", border:"1px solid rgba(231,76,60,0.25)", color:"#e74c3c", borderRadius:6, padding:"3px 8px", fontSize:10, cursor:"pointer" }}>Cancel</button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Free slots */}
                {freeSlots.length>0 && !isFullyBusy && (
                  <div style={{ marginTop:8 }}>
                    <div style={{ fontSize:10, color:"#8892a4", textTransform:"uppercase", letterSpacing:"0.7px", marginBottom:4 }}>Available Slots</div>
                    {freeSlots.map((f,i)=>(
                      <button key={i} onClick={()=>{ setForm({consultant:user.name,customer:"",phone:"",notes:"",location:"",locLoading:false,blockDate:schedDate,blockStart:f.from,blockEnd:f.to,expectedReturn:""}); setModal({carId:car.id,action:"block"}); setTab("cars"); }}
                        style={{ display:"block", width:"100%", background:"rgba(0,200,150,0.06)", border:"1px dashed rgba(0,200,150,0.35)", borderRadius:8, padding:"7px 10px", marginBottom:4, color:"#00c896", fontSize:12, cursor:"pointer", textAlign:"left", fontWeight:600 }}>
                        ✅ {f.from} – {f.to} &nbsp;<span style={{ color:"#6b7a8d", fontWeight:400, fontSize:11 }}>Tap to book</span>
                      </button>
                    ))}
                  </div>
                )}

                {freeSlots.length===0 && !isFullyBusy && slots.length>0 && (
                  <div style={{ fontSize:12, color:"#6b7a8d", textAlign:"center", marginTop:8, padding:"6px", background:"rgba(231,76,60,0.06)", borderRadius:8 }}>
                    🚫 No free slots on this day
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── SCHEDULE TAB (7-day overview) ── */}
      {tab==="schedule" && (
        <div style={S.page}>
          <div style={{ fontSize:12, color:"#8892a4", marginBottom:12 }}>7-day booking overview for all cars</div>
          {cars.map(car=>(
            <div key={car.id} style={S.card}>
              <div style={{ fontSize:15, fontWeight:700, marginBottom:10 }}>{car.name} <span style={{ fontSize:11, color:"#8892a4" }}>{car.plate}</span></div>
              {Array.from({length:7},(_,i)=>getRelativeDay(i)).map(day=>{
                const slots = carSlots(car.id, day);
                const free  = getFreeSlots(slots);
                return (
                  <div key={day} style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:8, paddingBottom:8, borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ width:72, flexShrink:0 }}>
                      <div style={{ fontSize:12, fontWeight:isToday(day)?700:400, color:isToday(day)?"#e8c878":"#e8eaf0" }}>{dayLabel(day)}</div>
                      <div style={{ fontSize:10, color:"#6b7a8d" }}>{day.slice(5)}</div>
                    </div>
                    <div style={{ flex:1 }}>
                      {slots.length===0
                        ? <span style={{ fontSize:11, color:"#00c896", background:"rgba(0,200,150,0.08)", padding:"2px 8px", borderRadius:8, border:"1px solid rgba(0,200,150,0.2)" }}>✅ Fully Free</span>
                        : (<>
                          {slots.map((s,i)=>(
                            <span key={i} style={{ display:"inline-block", fontSize:11, background:"rgba(245,166,35,0.12)", color:"#f5a623", padding:"2px 7px", borderRadius:8, border:"1px solid rgba(245,166,35,0.25)", marginRight:4, marginBottom:3 }}>
                              🔒 {s.blockStart}–{s.blockEnd} · {s.consultant}
                            </span>
                          ))}
                          {free.map((f,i)=>(
                            <span key={i} style={{ display:"inline-block", fontSize:11, background:"rgba(0,200,150,0.08)", color:"#00c896", padding:"2px 7px", borderRadius:8, border:"1px solid rgba(0,200,150,0.2)", marginRight:4, marginBottom:3 }}>
                              ✅ {f.from}–{f.to}
                            </span>
                          ))}
                        </>)
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* ── LOG TAB ── */}
      {tab==="log" && (
        <div style={S.page}>
          <button onClick={fetchLog} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, padding:"7px 14px", color:"#8892a4", fontSize:12, cursor:"pointer", marginBottom:12 }}>↻ Refresh</button>
          {log.length===0
            ? <div style={{ textAlign:"center", color:"#6b7a8d", marginTop:40, fontSize:14 }}>No activity yet</div>
            : log.map((e,i)=>(
              <div key={i} style={{ ...S.card, display:"flex", gap:12, alignItems:"flex-start", padding:"11px 13px" }}>
                <div style={{ fontSize:18, marginTop:2 }}>{ai(e.action)}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600 }}>{e.car} — {e.action}</div>
                  <div style={{ fontSize:11, color:"#8892a4", marginTop:3 }}>{e.consultant} · {e.customer}{e.expectedReturn?` · ${e.expectedReturn}`:""}</div>
                </div>
                <div style={{ fontSize:11, color:"#6b7a8d", whiteSpace:"nowrap" }}>{e.time}</div>
              </div>
            ))
          }
        </div>
      )}

      {/* ── SETTINGS TAB ── */}
      {tab==="settings" && user.role==="admin" && (
        <div style={S.page}>
          <div style={S.card}>
            <div style={S.sec}>👤 Consultants</div>
            <div style={{ display:"flex", gap:8, marginBottom:12 }}>
              <input value={newConsultant} onChange={e=>setNewConsultant(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleAddConsultant()} placeholder="New consultant name" style={{ ...S.inp, flex:1 }} />
              <button onClick={handleAddConsultant} style={{ background:gold, border:"none", borderRadius:8, padding:"10px 14px", color:"#0a0e1a", fontSize:13, fontWeight:700, cursor:"pointer" }}>+ Add</button>
            </div>
            {consultants.map(c=>(
              <div key={c.name} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 12px", background:"rgba(255,255,255,0.04)", borderRadius:8, marginBottom:6 }}>
                <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                  <div style={{ width:28, height:28, borderRadius:"50%", background:"rgba(192,160,96,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:"#c0a060", fontWeight:700 }}>{c.name[0]}</div>
                  <span style={{ fontSize:13 }}>{c.name}</span>
                  {c.role==="admin" && <span style={{ fontSize:10, color:"#c0a060", background:"rgba(192,160,96,0.1)", padding:"2px 7px", borderRadius:8 }}>ADMIN</span>}
                </div>
                {c.name!==user.name && <button onClick={()=>handleRemoveConsultant(c.name)} style={{ background:"rgba(231,76,60,0.1)", border:"1px solid rgba(231,76,60,0.25)", color:"#e74c3c", borderRadius:6, padding:"4px 10px", fontSize:11, cursor:"pointer" }}>Remove</button>}
              </div>
            ))}
          </div>
          <div style={S.card}>
            <div style={S.sec}>🚗 Fleet Cars</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:12 }}>
              <input value={newCarName}  onChange={e=>setNewCarName(e.target.value)}  placeholder="Car model" style={S.inp} />
              <input value={newCarPlate} onChange={e=>setNewCarPlate(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleAddCar()} placeholder="Number plate" style={S.inp} />
              <button onClick={handleAddCar} style={{ background:gold, border:"none", borderRadius:8, padding:10, color:"#0a0e1a", fontSize:13, fontWeight:700, cursor:"pointer" }}>+ Add Car</button>
            </div>
            {cars.map(car=>{
              const a=getActiveStatus(car.id),inUse=a.displayStatus!==STATUS.FREE,stC=sc(a.displayStatus);
              return (
                <div key={car.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 12px", background:"rgba(255,255,255,0.04)", borderRadius:8, marginBottom:6 }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600 }}>{car.name}</div>
                    <div style={{ fontSize:11, color:"#8892a4" }}>{car.plate} · <span style={{ color:stC }}>{sl(a.displayStatus)}</span></div>
                  </div>
                  <button onClick={()=>handleRemoveCar(car.id)} disabled={inUse} style={{ background:inUse?"rgba(255,255,255,0.03)":"rgba(231,76,60,0.1)", border:`1px solid ${inUse?"rgba(255,255,255,0.07)":"rgba(231,76,60,0.25)"}`, color:inUse?"#4a5568":"#e74c3c", borderRadius:6, padding:"4px 10px", fontSize:11, cursor:inUse?"not-allowed":"pointer" }}>
                    {inUse?"In Use":"Remove"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── BOOKING MODAL ── */}
      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:200, backdropFilter:"blur(4px)" }} onClick={()=>setModal(null)}>
          <div style={{ background:"#0f1624", borderRadius:"20px 20px 0 0", padding:"22px 18px 36px", width:"100%", maxWidth:480, border:"1px solid rgba(255,255,255,0.1)", boxShadow:"0 -20px 60px rgba(0,0,0,0.5)", maxHeight:"90vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>
              {modal.action==="block"?"🔒 Book a Test Drive Slot":modal.action==="checkout"?"🚗 Take Car Out":"🚗 Take Out Now"}
            </div>
            <div style={{ fontSize:12, color:"#8892a4", marginBottom:16 }}>{getCar(modal.carId)?.name}</div>

            {(modal.action==="block"||modal.action==="checkout") && (<>
              <div style={{ marginBottom:12 }}>
                <label style={S.lbl}>Consultant</label>
                <select value={form.consultant} onChange={e=>setForm(f=>({...f,consultant:e.target.value}))} style={S.inp}>
                  <option value="">Select…</option>
                  {consultants.map(c=><option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={S.lbl}>Customer Name</label>
                <input value={form.customer} onChange={e=>setForm(f=>({...f,customer:e.target.value}))} placeholder="Enter customer name" style={S.inp} />
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={S.lbl}>Customer Phone <span style={{ color:"#4a5568" }}>(optional)</span></label>
                <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="9XXXXXXXXX" style={S.inp} />
              </div>
            </>)}

            {modal.action==="block" && (<>
              <div style={{ marginBottom:12 }}>
                <label style={S.lbl}>Date</label>
                <input type="date" value={form.blockDate} min={todayStr()} onChange={e=>setForm(f=>({...f,blockDate:e.target.value}))} style={S.inp} />
                {form.blockDate && (
                  <div style={{ fontSize:11, color:"#e8c878", marginTop:4 }}>📅 {dayLabel(form.blockDate)||form.blockDate}
                    {carSlots(modal.carId,form.blockDate).length>0 && (
                      <span style={{ color:"#f5a623", marginLeft:8 }}>⚠️ {carSlots(modal.carId,form.blockDate).length} existing slot(s)</span>
                    )}
                  </div>
                )}
              </div>
              {/* Show free slots for chosen date */}
              {form.blockDate && getFreeSlots(carSlots(modal.carId,form.blockDate)).length>0 && (
                <div style={{ marginBottom:12 }}>
                  <label style={S.lbl}>Available Slots on This Day</label>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {getFreeSlots(carSlots(modal.carId,form.blockDate)).map((f,i)=>(
                      <button key={i} onClick={()=>setForm(ff=>({...ff,blockStart:f.from,blockEnd:f.to}))}
                        style={{ background:form.blockStart===f.from?"rgba(0,200,150,0.2)":"rgba(0,200,150,0.06)", border:`1px solid ${form.blockStart===f.from?"#00c896":"rgba(0,200,150,0.3)"}`, borderRadius:8, padding:"5px 10px", color:"#00c896", fontSize:12, cursor:"pointer", fontWeight:600 }}>
                        ✅ {f.from}–{f.to}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ marginBottom:12 }}>
                <label style={S.lbl}>Time Slot</label>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:10, color:"#8892a4", marginBottom:4 }}>START</div>
                    <input type="time" value={form.blockStart} onChange={e=>setForm(f=>({...f,blockStart:e.target.value}))} style={S.inp} />
                  </div>
                  <div style={{ color:"#6b7a8d", fontSize:16, marginTop:14 }}>→</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:10, color:"#8892a4", marginBottom:4 }}>END</div>
                    <input type="time" value={form.blockEnd} onChange={e=>setForm(f=>({...f,blockEnd:e.target.value}))} style={S.inp} />
                  </div>
                </div>
                <div style={{ fontSize:11, color:"#6b7a8d", marginTop:5 }}>⏰ Auto-releases if not taken out by end time</div>
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={S.lbl}>Notes <span style={{ color:"#4a5568" }}>(optional)</span></label>
                <input value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="e.g. VIP customer, needs diesel demo" style={S.inp} />
              </div>
              <div style={{ marginBottom:16 }}>
                <label style={S.lbl}>Test Drive Route / Location <span style={{ color:"#4a5568" }}>(optional)</span></label>
                <div style={{ display:"flex", gap:8 }}>
                  <input value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} placeholder="e.g. Gachibowli–Hitech City loop" style={{ ...S.inp, flex:1 }} />
                  <button onClick={()=>{
                    if (!navigator.geolocation) return showToast("GPS not available","error");
                    setForm(f=>({...f,locLoading:true}));
                    navigator.geolocation.getCurrentPosition(
                      pos => {
                        const lat = pos.coords.latitude.toFixed(5);
                        const lng = pos.coords.longitude.toFixed(5);
                        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
                          .then(r=>r.json())
                          .then(d=>{
                            const addr = d.address;
                            const label = [addr.road||addr.neighbourhood, addr.suburb||addr.city_district, addr.city||addr.town].filter(Boolean).join(", ");
                            setForm(f=>({...f,location:label||`${lat},${lng}`,locLoading:false}));
                          })
                          .catch(()=>setForm(f=>({...f,location:`${lat},${lng}`,locLoading:false})));
                      },
                      ()=>{ showToast("Location denied","error"); setForm(f=>({...f,locLoading:false})); },
                      {timeout:8000}
                    );
                  }} style={{ background:"rgba(99,179,237,0.15)", border:"1px solid rgba(99,179,237,0.35)", borderRadius:8, padding:"10px 12px", color:"#63b3ed", fontSize:12, cursor:"pointer", fontWeight:600, whiteSpace:"nowrap", flexShrink:0 }}>
                    {form.locLoading ? "📍…" : "📍 GPS"}
                  </button>
                </div>
                <div style={{ fontSize:11, color:"#6b7a8d", marginTop:5 }}>Type a route or tap GPS to auto-fill current location</div>
              </div>
            </>)}

            {(modal.action==="checkout"||modal.action==="checkout_from_block") && (
              <div style={{ marginBottom:16 }}>
                <label style={S.lbl}>Expected Return Time</label>
                <input type="time" value={form.expectedReturn} onChange={e=>setForm(f=>({...f,expectedReturn:e.target.value}))} style={S.inp} />
              </div>
            )}

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setModal(null)} style={{ flex:1, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:12, color:"#8892a4", fontSize:13, cursor:"pointer", fontWeight:600 }}>Cancel</button>
              <button onClick={modal.action==="block"?handleBlock:handleCheckout} disabled={syncing} style={{ flex:2, background:modal.action==="block"?"linear-gradient(135deg,#f5a623,#e8941a)":gold, border:"none", borderRadius:10, padding:12, color:"#0a0e1a", fontSize:13, cursor:"pointer", fontWeight:700, opacity:syncing?0.6:1 }}>
                {syncing?"Saving…":modal.action==="block"?"Confirm Booking":"Confirm Checkout"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", background:toast.type==="error"?"#e74c3c":"#00c896", color:"#fff", padding:"10px 20px", borderRadius:20, fontSize:13, fontWeight:600, zIndex:300, boxShadow:"0 4px 20px rgba(0,0,0,0.4)", maxWidth:"90vw", textAlign:"center" }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
