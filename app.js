// Load config.js before this file. Browser must never receive service_role or payment secrets.
const cfg = window.APP_CONFIG || {};
const configured = cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY &&
  !cfg.SUPABASE_URL.includes("YOUR-PROJECT") && !cfg.SUPABASE_ANON_KEY.includes("YOUR_");
const sb = configured ? window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY) : null;
const $ = id => document.getElementById(id);
let sessionUser = null, activeTab = "jobs";
function toast(s){const t=$("toast");t.textContent=s;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2800)}
function rupiah(n){return new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(n||0))}
function msg(id,s){$(id).textContent=s}
function showAuth(){ $("authView").classList.remove("hidden");$("appView").classList.add("hidden");$("logoutBtn").classList.add("hidden");$("connection").textContent=sb?"Belum masuk":"Konfigurasi diperlukan"; }
function showApp(){ $("authView").classList.add("hidden");$("appView").classList.remove("hidden");$("logoutBtn").classList.remove("hidden");$("connection").textContent="● Terhubung";$("connection").className="pill"; }
async function refresh(){
 if(!sb||!sessionUser)return;
 const {data:wallet,error}=await sb.from("wallets").select("available_balance,pending_balance,approved_jobs").eq("user_id",sessionUser.id).single();
 if(error){toast("Gagal memuat dompet: "+error.message);return}
 $("balance").textContent=rupiah(wallet.available_balance);$("pending").textContent=rupiah(wallet.pending_balance);$("approved").textContent=wallet.approved_jobs;
 $("userEmail").textContent=sessionUser.email;$("avatar").textContent=(sessionUser.email||"U")[0].toUpperCase();
 await loadHistory();
}
async function loadHistory(){
 const table=activeTab==="jobs"?"job_submissions":"wallet_transactions";
 const fields=activeTab==="jobs"?"id,status,reward_amount,created_at,task_title":"id,type,amount,status,created_at,description";
 const {data,error}=await sb.from(table).select(fields).order("created_at",{ascending:false}).limit(20);
 const el=$("historyList"); if(error){el.innerHTML='<div class="empty">Tidak dapat memuat aktivitas.</div>';return}
 if(!data?.length){el.innerHTML='<div class="empty">Belum ada aktivitas.</div>';return}
 el.innerHTML=data.map(x=>{const title=activeTab==="jobs"?(x.task_title||"Pengujian email"):x.description||x.type;const amt=activeTab==="jobs"?x.reward_amount:x.amount;return `<div class="history-row"><div><b>${escapeHtml(title)}</b><small>${new Date(x.created_at).toLocaleString("id-ID")} • ${escapeHtml(x.status)}</small></div><b>${rupiah(amt)}</b></div>`}).join("");
}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
async function auth(action){
 if(!sb){msg("authMsg","Isi config.js dengan URL dan anon key Supabase terlebih dahulu.");return}
 const email=$("email").value.trim(),password=$("password").value;
 if(!email||password.length<8){msg("authMsg","Masukkan email valid dan password minimal 8 karakter.");return}
 const r=action==="signup"?await sb.auth.signUp({email,password}):await sb.auth.signInWithPassword({email,password});
 if(r.error){msg("authMsg",r.error.message);return}
 if(action==="signup"&&!r.data.session){msg("authMsg","Pendaftaran berhasil. Periksa email untuk konfirmasi, lalu masuk.");return}
 msg("authMsg","Berhasil."); await boot();
}
async function boot(){
 if(!sb){showAuth();msg("authMsg","Setup diperlukan: konfigurasi Supabase belum diisi.");return}
 const {data}=await sb.auth.getSession();sessionUser=data.session?.user||null;
 if(sessionUser){showApp();await refresh()}else showAuth();
}
$("loginBtn").onclick=()=>auth("login");$("signupBtn").onclick=()=>auth("signup");
$("logoutBtn").onclick=async()=>{await sb.auth.signOut();sessionUser=null;showAuth()};
$("refreshBtn").onclick=refresh;
$("claimJobBtn").onclick=async()=>{
 if(!sessionUser)return toast("Masuk terlebih dahulu.");
 const {data,error}=await sb.functions.invoke("submit-job",{body:{task_code:"email_sandbox_test"}});
 if(error){toast("Job gagal diambil: "+error.message);return}
 toast(data?.message||"Job berhasil dikirim untuk ditinjau.");await refresh();
};
$("withdrawForm").onsubmit=async e=>{
 e.preventDefault();if(!sessionUser)return;
 const body={dana_number:$("danaNumber").value.trim(),recipient_name:$("danaName").value.trim(),amount:Number($("withdrawAmount").value)};
 const {data,error}=await sb.functions.invoke("request-withdrawal",{body});
 if(error){msg("withdrawMsg","Gagal: "+error.message);return}
 msg("withdrawMsg",data.message||"Permintaan penarikan terkirim.");e.target.reset();await refresh();
};
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");activeTab=b.dataset.tab;loadHistory()});
boot();
