// ==================================================
// SITRA-KIP FINAL ENGINE (SIMULASI TERKONTROL)
// ==================================================

// ---------- DATABASE SIMULASI (FIKTIF & KONSISTEN) ----------
const siswaDB = {
  "638373828": {
    nisn: "638373828",
    nama: "M Setio Budi",
    role: "siswa",
    status: "DISETUJUI",
    keputusan: "DISETUJUI",
    catatan: null,
    timeline: [
      { tahap: "Pengajuan", tanggal: "10 Jan 2026" },
      { tahap: "Verifikasi", tanggal: "12 Jan 2026" },
      { tahap: "Keputusan", tanggal: "15 Jan 2026" }
    ],
    audit: [
      "10 Jan 2026 - Data masuk sistem",
      "12 Jan 2026 - Data valid",
      "15 Jan 2026 - Disetujui verifikator"
    ],
    pencairan: {
      rekening: "BNI aktif",
      data: [
        { tahun: 2026, tahap: 1, tanggal: "20 Mar 2026", jumlah: "Rp 900.000", status: "CAIR" },
        { tahun: 2026, tahap: 2, tanggal: "20 Sep 2026", jumlah: "Rp 900.000", status: "CAIR" }
      ]
    }
  },

  "848292939": {
    nisn: "848292939",
    nama: "Nisa Nur Wahyu",
    role: "siswa",
    status: "PERLU_PERBAIKAN",
    keputusan: "MENUNGGU",
    catatan: "NIK tidak sesuai dengan data Dukcapil",
    timeline: [
      { tahap: "Pengajuan", tanggal: "10 Jan 2026" },
      { tahap: "Validasi Identitas", tanggal: "12 Jan 2026" }
    ],
    audit: [
      "10 Jan 2026 - Data masuk sistem",
      "12 Jan 2026 - NIK tidak sesuai Dukcapil"
    ],
    pencairan: null
  },

  "9392929299": {
    nisn: "9392929299",
    nama: "Rismawati",
    role: "siswa",
    status: "DITAHAN",
    keputusan: "MENUNGGU",
    catatan: "Rekening BNI tidak aktif",
    timeline: [
      { tahap: "Pengajuan", tanggal: "10 Jan 2026" },
      { tahap: "Verifikasi", tanggal: "12 Jan 2026" },
      { tahap: "Pencairan Tahap 1", tanggal: "20 Mar 2026" }
    ],
    audit: [
      "10 Jan 2026 - Data masuk sistem",
      "12 Jan 2026 - Data valid",
      "20 Mar 2026 - Pencairan tahap 1 berhasil",
      "20 Sep 2026 - Pencairan tahap 2 gagal (rekening mati)"
    ],
    pencairan: {
      rekening: "BNI tidak aktif",
      data: [
        { tahun: 2026, tahap: 1, tanggal: "20 Mar 2026", jumlah: "Rp 900.000", status: "CAIR" },
        { tahun: 2026, tahap: 2, tanggal: "-", jumlah: "-", status: "GAGAL" }
      ]
    }
  }
};

// ---------- STATE ----------
let state = JSON.parse(localStorage.getItem("sitra_state")) || {
  loggedIn: false,
  role: null,        // siswa | verifikator
  activeNISN: null
};

function saveState() {
  localStorage.setItem("sitra_state", JSON.stringify(state));
}

// ---------- LOGIN ----------
function login() {
  const nisn = document.getElementById("nisn").value.trim();
  const pw = document.getElementById("password").value.trim();

  // login verifikator (khusus simulasi)
  if (nisn === "verifikator" && pw === "admin123") {
    state.loggedIn = true;
    state.role = "verifikator";
    state.activeNISN = null;
    saveState();
    showDashboard();
    return;
  }

  // login siswa
  if (!siswaDB[nisn]) {
    alert("NISN tidak terdaftar dalam simulasi");
    return;
  }

  state.loggedIn = true;
  state.role = "siswa";
  state.activeNISN = nisn;
  saveState();
  showDashboard();
}

function logout() {
  state.loggedIn = false;
  state.role = null;
  state.activeNISN = null;
  saveState();
  location.reload();
}

// ---------- DASHBOARD ----------
function showDashboard() {
  document.getElementById("login").style.display = "none";
  document.getElementById("dashboard").classList.remove("hidden");
  render();
}

// ---------- RENDER ----------
function render() {
  if (state.role === "verifikator") {
    renderVerifikator();
    return;
  }

  const s = siswaDB[state.activeNISN];
  if (!s) return;

  document.getElementById("namaSiswa").innerText = s.nama;
  document.getElementById("nisnSiswa").innerText = "NISN: " + s.nisn;
  document.getElementById("roleInfo").innerText = "Login sebagai: SISWA";

  document.getElementById("statusText").innerText = "STATUS: " + s.status;
  document.getElementById("statusDesc").innerText = s.catatan || "Tidak ada catatan tambahan";
  document.getElementById("keputusanText").innerText = "Keputusan: " + s.keputusan;
  document.getElementById("keputusanDesc").innerText = "Status bersifat sementara dan dapat diperbaiki";

  renderTimeline(s);
  renderAudit(s);
  renderPencairan(s);
}

// ---------- VERIFIKATOR ----------
function renderVerifikator() {
  document.getElementById("verifikatorPanel").style.display = "block";
  document.getElementById("roleInfo").innerText = "Login sebagai: VERIFIKATOR";

  const tbody = document.getElementById("siswaList");
  tbody.innerHTML = "";

  Object.values(siswaDB).forEach(s => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${s.nisn}</td>
      <td>${s.nama}</td>
      <td>${s.status}</td>
      <td><button onclick="pilihSiswa('${s.nisn}')">Detail</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function pilihSiswa(nisn) {
  state.activeNISN = nisn;
  saveState();
  render();
}

// ---------- AKSI VERIFIKATOR ----------
function setDisetujui() {
  const s = siswaDB[state.activeNISN];
  if (!s) return;

  s.status = "DISETUJUI";
  s.keputusan = "DISETUJUI";
  s.audit.push(today() + " - Disetujui verifikator");
  s.timeline.push({ tahap: "Keputusan", tanggal: today() });

  render();
}

function setPerluPerbaikan() {
  const s = siswaDB[state.activeNISN];
  const alasan = document.getElementById("alasanInput").value.trim();

  if (!alasan) {
    alert("Catatan perbaikan wajib diisi");
    return;
  }

  s.status = "PERLU_PERBAIKAN";
  s.keputusan = "MENUNGGU";
  s.catatan = alasan;
  s.audit.push(today() + " - Perlu perbaikan: " + alasan);
  s.timeline.push({ tahap: "Perlu Perbaikan", tanggal: today() });

  render();
}

// ---------- RENDER UTIL ----------
function renderTimeline(s) {
  const ul = document.getElementById("timeline");
  ul.innerHTML = "";
  s.timeline.forEach(t => {
    ul.innerHTML += `<li><b>${t.tahap}</b><br>${t.tanggal}</li>`;
  });
}

function renderAudit(s) {
  const ul = document.getElementById("auditLog");
  ul.innerHTML = "";
  s.audit.forEach(a => {
    ul.innerHTML += `<li>${a}</li>`;
  });
}

function renderPencairan(s) {
  const info = document.getElementById("rekeningInfo");
  const tbody = document.getElementById("riwayatTable");

  tbody.innerHTML = "";

  if (!s.pencairan) {
    info.innerText = "Belum ada pencairan";
    return;
  }

  info.innerText = "Rekening: " + s.pencairan.rekening;

  s.pencairan.data.forEach(p => {
    tbody.innerHTML += `
      <tr>
        <td>${p.tahun}</td>
        <td>${p.tahap}</td>
        <td>${p.tanggal}</td>
        <td>${p.jumlah}</td>
        <td>${p.status}</td>
      </tr>
    `;
  });
}

// ---------- EXPORT AUDIT ----------
function exportAudit() {
  const s = siswaDB[state.activeNISN];
  if (!s) return;

  let text = `AUDIT TRAIL - ${s.nama}\n\n`;
  s.audit.forEach(a => text += "- " + a + "\n");

  const blob = new Blob([text], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `audit_${s.nisn}.txt`;
  link.click();
}

// ---------- UTIL ----------
function today() {
  return new Date().toLocaleDateString("id-ID");
}

// ---------- AUTO LOAD ----------
window.onload = function () {
  if (state.loggedIn) {
    showDashboard();
  }
};