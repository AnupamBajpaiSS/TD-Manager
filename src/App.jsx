import { useState, useEffect, useCallback } from "react";

const API_URL = "https://script.google.com/macros/s/AKfycbzvDWys4SSetwBfhxQb1j0q0XGnMjbfop7ONX3wq46beAsIDxJ3A73M4iZYSI032OA/exec";

const STATUS = { FREE: "FREE", BLOCKED: "BLOCKED", OUT: "OUT" };

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

// Convert "HH:MM" to minutes since midnight
function timeToMins(t) {
  if (!t) return null;
  const [h,m] = t.split(":").map(Number);
  return h*60+m;
}
// Get current time as "HH:MM"
function nowTime() {
  return new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false}).slice(0,5);
}
// Check if current time has passed a given "HH:MM"
function isPast(t) {
  if (!t) return false;
  return timeToMins(nowTime()) > timeToMins(t);
}
// Minutes remaining until time
function minsUntil(t) {
  if (!t) return null;
  const diff = timeToMins(t) - timeToMins(nowTime());
  return diff;
}
function formatCountdown(t) {
  const m = minsUntil(t);
  if (m === null) return "";
  if (m < 0) return "Overdue";
  if (m === 0) return "Now";
  if (m < 60) return `${m}m left`;
  return `${Math.floor(m/60)}h ${m%60}m left`;
}

function ABtn({ children, color, onClick, disabled }) {
  return <button onClick={onClick} disabled={disabled} style={{ background:`${color}18`, border:`1px solid ${color}44`, color, borderRadius:8, padding:"7px 13px", fontSize:12, fontWeight:600, cursor:disabled?"not-allowed":"pointer", opacity:disabled?0.4:1 }}>{children}</button>;
}
function Tab({ active, onClick, children }) {
  return <button onClick={onClick} style={{ background:"none", border:"none", cursor:"pointer", padding:"12px 13px 10px", fontSize:12, fontWeight:600, color:active?"#c0a060":"#6b7a8d", borderBottom:`2px solid ${active?"#c0a060":"transparent"}`, textTransform:"uppercase", letterSpacing:"0.8px", whiteSpace:"nowrap" }}>{children}</button>;
}

async function apiFetch(params) {
  const url = API_URL + "?" + new URLSearchParams(params);
  const r = await fetch(url);
  return r.json();
}
async function apiPost(body) {
  const r = await fetch(API_URL, { method:"POST", body: JSON.stringify(body) });
  return r.json();
}

// ── LOGIN ────────────────────────────────────────────────────
function LoginScreen({ consultants, onLogin }) {
  const [selected, setSelected] = useState("");
  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0a0e1a,#0d1b2a)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ width:56, height:56, borderRadius:"50%", background:gold, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, fontWeight:700, color:"#0a0e1a", marginBottom:16 }}>★</div>
      <div style={{ fontSize:20, fontWeight:700, marginBottom:4 }}>Silver Star MB</div>
      <div style={{ fontSize:12, color:"#8892a4", letterSpacing:"1px", textTransform:"uppercase", marginBottom:36 }}>Test Drive Manager</div>
      <div style={{ width:"100%", maxWidth:340 }}>
        <div style={{ fontSize:13, color:"#8892a4", marginBottom:12, textAlign:"center" }}>Who are you?</div>
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
          {consultants.map(c => (
            <button key={c.name} onClick={() => setSelected(c.name)} style={{
              background: selected===c.name ? "rgba(192,160,96,0.15)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${selected===c.name ? "#c0a060" : "rgba(255,255,255,0.08)"}`,
              borderRadius:10, padding:"12px 16px", color: selected===c.name ? "#e8c878" : "#e8eaf0",
              fontSize:14, fontWeight:600, cursor:"pointer", textAlign:"left",
              display:"flex", justifyContent:"space-between", alignItems:"center"
            }}>
              <span>{c.name}</span>
              {c.role==="admin" && <span style={{ fontSize:10, color:"#c0a060", background:"rgba(192,160,96,0.15)", padding:"2px 8px", borderRadius:10, border:"1px solid rgba(192,160,96,0.3)" }}>ADMIN</span>}
            </button>
          ))}
        </div>
        <button onClick={() => selected && onLogin(consultants.find(c=>c.name===selected))} disabled={!selected} style={{
          width:"100%", background:selected?gold:"rgba(255,255,255,0.06)", border:"none",
          borderRadius:12, padding:14, color:"#0a0e1a", fontSize:14, fontWeight:700,
          cursor:selected?"pointer":"not-allowed", opacity:selected?1:0.5
        }}>Enter →</button>
      </div>
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────
export default function TestDriveApp() {
  const [user, setUser]               = useState(null);
  const [consultants, setConsultants] = useState([]);
  const [cars, setCars]               = useState([]);
  const [bookings, setBookings]       = useState([]);
  const [log, setLog]                 = useState([]);
  const [loading, setLoading]         = useState(true);
  const [syncing, setSyncing]         = useState(false);
  const [modal, setModal]             = useState(null);
  const [form, setForm]               = useState({ consultant:"", customer:"", blockStart:"", blockEnd:"", expectedReturn:"" });
  const [toast, setToast]             = useState(null);
  const [tab, setTab]                 = useState("cars");
  const [tick, setTick]               = useState(0); // for countdown re-render
  const [newConsultant, setNewConsultant] = useState("");
  const [newCarName, setNewCarName]       = useState("");
  const [newCarPlate, setNewCarPlate]     = useState("");

  const showToast = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3500); };

  const fetchData = useCallback(async () => {
    try {
      const d = await apiFetch({ action:"getData" });
      if (d.error) { showToast("Sync error: "+d.error,"error"); return; }
      setConsultants(d.consultants||[]);
      setCars(d.cars||[]);
      setBookings(d.bookings||[]);
    } catch(e) { showToast("Network error","error"); }
  }, []);

  const fetchLog = useCallback(async () => {
    const d = await apiFetch({ action:"getLog" });
    setLog(d.log||[]);
  }, []);

  useEffect(() => {
    fetchData().finally(()=>setLoading(false));
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Countdown ticker every 30s
  useEffect(() => {
    const t = setInterval(() => setTick(x=>x+1), 30000);
    return () => clearInterval(t);
  }, []);

  // ── AUTO-RELEASE CHECK ───────────────────────────────────────
  // Runs every refresh: if blockEnd time has passed and car is still BLOCKED → auto release
  useEffect(() => {
    if (!bookings.length || !cars.length) return;
    bookings.forEach(b => {
      if (b.status === STATUS.BLOCKED && b.blockEnd && isPast(b.blockEnd)) {
        const car = cars.find(c => String(c.id)===String(b.carId));
        // Auto release
        apiPost({
          action:"releaseCar", carId:b.carId, carName:car?.name,
          requestedBy:"AUTO", requesterRole:"admin",
          blockedBy:b.consultant, customer:b.customer, autoRelease:true
        }).then(() => fetchData());
      }
    });
  }, [bookings, tick]);

  useEffect(() => { if (tab==="log") fetchLog(); }, [tab, fetchLog]);

  const doPost = async (body) => {
    setSyncing(true);
    try {
      const r = await apiPost(body);
      if (r.error || !r.ok) { showToast(r.error||"Action failed","error"); return false; }
      await fetchData();
      return true;
    } catch(e) { showToast("Network error","error"); return false; }
    finally { setSyncing(false); }
  };

  const getBooking = (carId) => bookings.find(b => String(b.carId)===String(carId)) || { status:STATUS.FREE };
  const getCar     = (carId) => cars.find(c => String(c.id)===String(carId));

  // ── ACTIONS ──────────────────────────────────────────────────
  const handleBlock = async () => {
    if (!form.consultant || !form.customer) return showToast("Fill all fields","error");
    if (!form.blockStart || !form.blockEnd)  return showToast("Set block start & end time","error");
    if (timeToMins(form.blockEnd) <= timeToMins(form.blockStart)) return showToast("End time must be after start time","error");
    const car = getCar(modal.carId);
    const ok = await doPost({ action:"blockCar", carId:modal.carId, carName:car?.name, consultant:form.consultant, customer:form.customer, blockStart:form.blockStart, blockEnd:form.blockEnd });
    if (ok) { showToast(`${car?.name} blocked by ${form.consultant}`); setModal(null); }
  };

  const handleCheckout = async () => {
    if (!form.expectedReturn) return showToast("Set expected return time","error");
    const booking = getBooking(modal.carId);
    const car = getCar(modal.carId);
    const consultant = booking.consultant || form.consultant;
    const customer   = booking.customer   || form.customer;
    if (!consultant||!customer) return showToast("Fill consultant & customer","error");
    const ok = await doPost({ action:"checkoutCar", carId:modal.carId, carName:car?.name, consultant, customer, expectedReturn:form.expectedReturn });
    if (ok) { showToast(`${car?.name} checked out`); setModal(null); }
  };

  const handleReturn = async (carId) => {
    const booking = getBooking(carId);
    const car = getCar(carId);
    const ok = await doPost({ action:"returnCar", carId, carName:car?.name, consultant:booking.consultant, customer:booking.customer });
    if (ok) showToast(`${car?.name} returned ✅`);
  };

  const handleRelease = async (carId) => {
    const booking = getBooking(carId);
    const car = getCar(carId);
    if (user.role !== "admin" && booking.consultant !== user.name) {
      return showToast(`Only ${booking.consultant} or Admin can release this block`,"error");
    }
    const ok = await doPost({ action:"releaseCar", carId, carName:car?.name, requestedBy:user.name, requesterRole:user.role, blockedBy:booking.consultant, customer:booking.customer });
    if (ok) showToast(`Block released`);
  };

  // ── SETTINGS ─────────────────────────────────────────────────
  const handleAddConsultant = async () => {
    const name = newConsultant.trim();
    if (!name) return showToast("Enter a name","error");
    if (consultants.find(c=>c.name===name)) return showToast("Already exists","error");
    const ok = await doPost({ action:"addConsultant", name, role:"consultant" });
    if (ok) { setNewConsultant(""); showToast(`${name} added`); }
  };
  const handleRemoveConsultant = async (name) => {
    if (name===user.name) return showToast("Can't remove yourself","error");
    const ok = await doPost({ action:"removeConsultant", name });
    if (ok) showToast(`${name} removed`);
  };
  const handleAddCar = async () => {
    const name=newCarName.trim(), plate=newCarPlate.trim();
    if (!name||!plate) return showToast("Enter car name & plate","error");
    const ok = await doPost({ action:"addCar", name, plate });
    if (ok) { setNewCarName(""); setNewCarPlate(""); showToast(`${name} added`); }
  };
  const handleRemoveCar = async (carId) => {
    const booking = getBooking(carId);
    if (booking.status !== STATUS.FREE) return showToast("Return car first","error");
    const car = getCar(carId);
    const ok = await doPost({ action:"removeCar", carId });
    if (ok) showToast(`${car?.name} removed`);
  };

  // ── LOADING / LOGIN ───────────────────────────────────────────
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
        <Tab active={tab==="cars"} onClick={()=>setTab("cars")}>🚘 Fleet</Tab>
        <Tab active={tab==="log"}  onClick={()=>setTab("log")}>📋 Log</Tab>
        {user.role==="admin" && <Tab active={tab==="settings"} onClick={()=>setTab("settings")}>⚙️ Settings</Tab>}
      </div>

      {/* ── FLEET TAB ── */}
      {tab==="cars" && (
        <div style={S.page}>
          {/* Summary */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:10 }}>
            {[
              { label:"Available", count:cars.filter(c=>getBooking(c.id).status===STATUS.FREE).length, color:"#00c896" },
              { label:"Blocked",   count:cars.filter(c=>getBooking(c.id).status===STATUS.BLOCKED).length, color:"#f5a623" },
              { label:"On Drive",  count:cars.filter(c=>getBooking(c.id).status===STATUS.OUT).length, color:"#e74c3c" },
            ].map(s=>(
              <div key={s.label} style={{ background:"rgba(255,255,255,0.04)", borderRadius:10, padding:"10px 6px", textAlign:"center", border:`1px solid ${s.color}22` }}>
                <div style={{ fontSize:22, fontWeight:700, color:s.color }}>{s.count}</div>
                <div style={{ fontSize:10, color:"#8892a4", textTransform:"uppercase", letterSpacing:"0.7px" }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize:10, color:"#4a5568", textAlign:"center", marginBottom:10 }}>
            Auto-refreshes every 15s · <span style={{ cursor:"pointer", color:"#6b7a8d", textDecoration:"underline" }} onClick={fetchData}>Refresh now</span>
          </div>

          {cars.length===0 && <div style={{ textAlign:"center", color:"#6b7a8d", marginTop:40, fontSize:14 }}>No cars. Admin can add from Settings ⚙️</div>}

          {cars.map(car => {
            const booking   = getBooking(car.id);
            const stColor   = sc(booking.status);
            const canRelease = user.role==="admin" || booking.consultant===user.name;
            const countdown  = booking.status===STATUS.BLOCKED ? formatCountdown(booking.blockEnd) : booking.status===STATUS.OUT ? formatCountdown(booking.expectedReturn) : null;
            const isOverdue  = countdown === "Overdue";

            return (
              <div key={car.id} style={{ ...S.card, border:`1px solid ${isOverdue?"#e74c3c":stColor}33`, boxShadow:`0 0 18px ${stColor}0d` }}>
                {/* Car header */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                  <div>
                    <div style={{ fontSize:16, fontWeight:700 }}>{car.name}</div>
                    <div style={{ fontSize:11, color:"#8892a4", marginTop:2 }}>{car.plate}</div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                    <div style={{ background:`${stColor}22`, color:stColor, padding:"4px 12px", borderRadius:20, fontSize:11, fontWeight:700, letterSpacing:"0.8px", textTransform:"uppercase", border:`1px solid ${stColor}44` }}>
                      {sl(booking.status)}
                    </div>
                    {countdown && (
                      <div style={{ fontSize:11, color: isOverdue?"#e74c3c":"#00c896", fontWeight:600, background: isOverdue?"rgba(231,76,60,0.1)":"rgba(0,200,150,0.1)", padding:"2px 8px", borderRadius:10, border:`1px solid ${isOverdue?"rgba(231,76,60,0.3)":"rgba(0,200,150,0.3)"}` }}>
                        ⏱ {countdown}
                      </div>
                    )}
                  </div>
                </div>

                {/* Booking details */}
                {booking.status !== STATUS.FREE && (
                  <div style={{ background:"rgba(0,0,0,0.2)", borderRadius:10, padding:"10px 12px", marginBottom:10, fontSize:12 }}>
                    <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
                      <div><span style={{ color:"#8892a4" }}>Consultant: </span><span style={{ fontWeight:600 }}>{booking.consultant}</span></div>
                      <div><span style={{ color:"#8892a4" }}>Customer: </span><span style={{ fontWeight:600 }}>{booking.customer}</span></div>
                    </div>
                    <div style={{ display:"flex", gap:14, flexWrap:"wrap", marginTop:6 }}>
                      {booking.status===STATUS.BLOCKED && booking.blockStart && (
                        <div><span style={{ color:"#8892a4" }}>Drive slot: </span>
                          <span style={{ color:"#f5a623", fontWeight:600 }}>{booking.blockStart} → {booking.blockEnd}</span>
                        </div>
                      )}
                      {booking.blockedAt  && <div><span style={{ color:"#8892a4" }}>Blocked at: </span><span style={{ color:"#f5a623" }}>{booking.blockedAt}</span></div>}
                      {booking.outSince   && <div><span style={{ color:"#8892a4" }}>Out since: </span><span style={{ color:"#e74c3c" }}>{booking.outSince}</span></div>}
                      {booking.expectedReturn && booking.status===STATUS.OUT && <div><span style={{ color:"#8892a4" }}>Return by: </span><span style={{ color:"#00c896" }}>{booking.expectedReturn}</span></div>}
                    </div>

                    {/* Auto-release notice */}
                    {booking.status===STATUS.BLOCKED && booking.blockEnd && (
                      <div style={{ marginTop:8, fontSize:11, color: isOverdue?"#e74c3c":"#8892a4", background:"rgba(255,255,255,0.04)", borderRadius:6, padding:"5px 8px", border:"1px solid rgba(255,255,255,0.08)" }}>
                        {isOverdue
                          ? "⏰ Block time expired — auto-releasing..."
                          : `⏰ Auto-releases at ${booking.blockEnd} if not started`}
                      </div>
                    )}

                    {/* Lock notice */}
                    {booking.status===STATUS.BLOCKED && !canRelease && (
                      <div style={{ marginTop:6, fontSize:11, color:"#f5a623", background:"rgba(245,166,35,0.08)", borderRadius:6, padding:"5px 8px", border:"1px solid rgba(245,166,35,0.2)" }}>
                        🔐 Only {booking.consultant} or Admin can release
                      </div>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {booking.status===STATUS.FREE && (<>
                    <ABtn color="#f5a623" onClick={()=>{ setForm({consultant:user.name,customer:"",blockStart:"",blockEnd:"",expectedReturn:""}); setModal({carId:car.id,action:"block"}); }}>🔒 Block</ABtn>
                    <ABtn color="#e74c3c" onClick={()=>{ setForm({consultant:user.name,customer:"",blockStart:"",blockEnd:"",expectedReturn:""}); setModal({carId:car.id,action:"checkout"}); }}>🚗 Take Out</ABtn>
                  </>)}
                  {booking.status===STATUS.BLOCKED && (<>
                    <ABtn color="#e74c3c" onClick={()=>{ setForm({consultant:booking.consultant,customer:booking.customer,blockStart:"",blockEnd:"",expectedReturn:""}); setModal({carId:car.id,action:"checkout_from_block"}); }}>🚗 Take Out Now</ABtn>
                    <ABtn color="#6b7a8d" onClick={()=>handleRelease(car.id)} disabled={!canRelease}>🔓 Release{!canRelease?" 🔐":""}</ABtn>
                  </>)}
                  {booking.status===STATUS.OUT && (
                    <ABtn color="#00c896" onClick={()=>handleReturn(car.id)}>✅ Mark Returned</ABtn>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── LOG TAB ── */}
      {tab==="log" && (
        <div style={S.page}>
          <button onClick={fetchLog} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, padding:"7px 14px", color:"#8892a4", fontSize:12, cursor:"pointer", marginBottom:12 }}>↻ Refresh Log</button>
          {log.length===0
            ? <div style={{ textAlign:"center", color:"#6b7a8d", marginTop:40, fontSize:14 }}>No activity yet</div>
            : log.map((entry,i) => (
              <div key={i} style={{ ...S.card, display:"flex", gap:12, alignItems:"flex-start", padding:"11px 13px" }}>
                <div style={{ fontSize:18, marginTop:2 }}>{ai(entry.action)}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600 }}>{entry.car} — {entry.action}</div>
                  <div style={{ fontSize:11, color:"#8892a4", marginTop:3 }}>
                    {entry.consultant} · {entry.customer}
                    {entry.expectedReturn && ` · Return by ${entry.expectedReturn}`}
                  </div>
                </div>
                <div style={{ fontSize:11, color:"#6b7a8d", whiteSpace:"nowrap" }}>{entry.time}</div>
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
              <div key={c.name} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 12px", background:"rgba(255,255,255,0.04)", borderRadius:8, marginBottom:6, border:"1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                  <div style={{ width:28, height:28, borderRadius:"50%", background:"rgba(192,160,96,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:"#c0a060", fontWeight:700 }}>{c.name[0]}</div>
                  <span style={{ fontSize:13, fontWeight:500 }}>{c.name}</span>
                  {c.role==="admin" && <span style={{ fontSize:10, color:"#c0a060", background:"rgba(192,160,96,0.1)", padding:"2px 7px", borderRadius:8, border:"1px solid rgba(192,160,96,0.25)" }}>ADMIN</span>}
                </div>
                {c.name!==user.name && <button onClick={()=>handleRemoveConsultant(c.name)} style={{ background:"rgba(231,76,60,0.1)", border:"1px solid rgba(231,76,60,0.25)", color:"#e74c3c", borderRadius:6, padding:"4px 10px", fontSize:11, cursor:"pointer", fontWeight:600 }}>Remove</button>}
              </div>
            ))}
          </div>

          <div style={S.card}>
            <div style={S.sec}>🚗 Fleet Cars</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:12 }}>
              <input value={newCarName}  onChange={e=>setNewCarName(e.target.value)}  placeholder="Car model (e.g. GLS 450)" style={S.inp} />
              <input value={newCarPlate} onChange={e=>setNewCarPlate(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleAddCar()} placeholder="Plate (e.g. TS09 MB005)" style={S.inp} />
              <button onClick={handleAddCar} style={{ background:gold, border:"none", borderRadius:8, padding:10, color:"#0a0e1a", fontSize:13, fontWeight:700, cursor:"pointer" }}>+ Add Car</button>
            </div>
            {cars.map(car=>{
              const booking=getBooking(car.id), inUse=booking.status!==STATUS.FREE, stColor=sc(booking.status);
              return (
                <div key={car.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 12px", background:"rgba(255,255,255,0.04)", borderRadius:8, marginBottom:6, border:`1px solid ${stColor}22` }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600 }}>{car.name}</div>
                    <div style={{ fontSize:11, color:"#8892a4", marginTop:2 }}>{car.plate} · <span style={{ color:stColor }}>{sl(booking.status)}</span></div>
                  </div>
                  <button onClick={()=>handleRemoveCar(car.id)} disabled={inUse} style={{ background:inUse?"rgba(255,255,255,0.03)":"rgba(231,76,60,0.1)", border:`1px solid ${inUse?"rgba(255,255,255,0.07)":"rgba(231,76,60,0.25)"}`, color:inUse?"#4a5568":"#e74c3c", borderRadius:6, padding:"4px 10px", fontSize:11, cursor:inUse?"not-allowed":"pointer", fontWeight:600 }}>
                    {inUse?"In Use":"Remove"}
                  </button>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize:11, color:"#4a5568", textAlign:"center", paddingBottom:20 }}>Settings visible to Admin only</div>
        </div>
      )}

      {/* ── MODAL ── */}
      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:200, backdropFilter:"blur(4px)" }} onClick={()=>setModal(null)}>
          <div style={{ background:"#0f1624", borderRadius:"20px 20px 0 0", padding:"22px 18px 32px", width:"100%", maxWidth:480, border:"1px solid rgba(255,255,255,0.1)", boxShadow:"0 -20px 60px rgba(0,0,0,0.5)" }} onClick={e=>e.stopPropagation()}>

            <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>
              {modal.action==="block"?"🔒 Block Car":modal.action==="checkout"?"🚗 Take Car Out":"🚗 Take Out Now"}
            </div>
            <div style={{ fontSize:12, color:"#8892a4", marginBottom:16 }}>{getCar(modal.carId)?.name}</div>

            {/* Consultant + Customer */}
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
            </>)}

            {/* Block Start & End Time */}
            {modal.action==="block" && (
              <div style={{ marginBottom:12 }}>
                <label style={S.lbl}>Test Drive Slot</label>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:10, color:"#8892a4", marginBottom:4 }}>START TIME</div>
                    <input type="time" value={form.blockStart} onChange={e=>setForm(f=>({...f,blockStart:e.target.value}))} style={S.inp} />
                  </div>
                  <div style={{ color:"#6b7a8d", fontSize:16, marginTop:14 }}>→</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:10, color:"#8892a4", marginBottom:4 }}>END TIME</div>
                    <input type="time" value={form.blockEnd} onChange={e=>setForm(f=>({...f,blockEnd:e.target.value}))} style={S.inp} />
                  </div>
                </div>
                <div style={{ fontSize:11, color:"#6b7a8d", marginTop:6 }}>⏰ Car auto-releases if not taken out by end time</div>
              </div>
            )}

            {/* Expected Return for checkout */}
            {(modal.action==="checkout"||modal.action==="checkout_from_block") && (
              <div style={{ marginBottom:16 }}>
                <label style={S.lbl}>Expected Return Time</label>
                <input type="time" value={form.expectedReturn} onChange={e=>setForm(f=>({...f,expectedReturn:e.target.value}))} style={S.inp} />
              </div>
            )}

            <div style={{ display:"flex", gap:10, marginTop:8 }}>
              <button onClick={()=>setModal(null)} style={{ flex:1, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:12, color:"#8892a4", fontSize:13, cursor:"pointer", fontWeight:600 }}>Cancel</button>
              <button onClick={modal.action==="block"?handleBlock:handleCheckout} disabled={syncing} style={{ flex:2, background:modal.action==="block"?"linear-gradient(135deg,#f5a623,#e8941a)":gold, border:"none", borderRadius:10, padding:12, color:"#0a0e1a", fontSize:13, cursor:"pointer", fontWeight:700, opacity:syncing?0.6:1 }}>
                {syncing?"Saving…":modal.action==="block"?"Confirm Block":"Confirm Checkout"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", background:toast.type==="error"?"#e74c3c":"#00c896", color:"#fff", padding:"10px 20px", borderRadius:20, fontSize:13, fontWeight:600, zIndex:300, boxShadow:"0 4px 20px rgba(0,0,0,0.4)", whiteSpace:"nowrap", maxWidth:"90vw", textAlign:"center" }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
