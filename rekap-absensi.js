
const tabelRekapAbsensi = document.getElementById("tabelRekapAbsensi");
const filterTanggal = document.getElementById("filterTanggal");
const filterMataKuliah = document.getElementById("filterMataKuliah");
const filterStatus = document.getElementById("filterStatus");
const inputPencarianAbsensi = document.getElementById("inputPencarianAbsensi");

const jumlahHadir = document.getElementById("jumlahHadir");
const jumlahSakit = document.getElementById("jumlahSakit");
const jumlahIzin = document.getElementById("jumlahIzin");

let semuaAbsensi = [];
let daftarMataKuliah = [];

function teksAman(nilai) {
    return String(nilai ?? "-").replace(/[&<>"']/g, karakter => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[karakter]);
}

function formatJam(nilai) {
    if (!nilai) return "-";
    return String(nilai).slice(0, 8);
}

function formatTanggal(nilai) {
    if (!nilai) return "-";

    const bagian = String(nilai).split("-");
    if (bagian.length === 3) {
        return `${bagian[2]}/${bagian[1]}/${bagian[0]}`;
    }

    return String(nilai);
}

/* AMBIL MATA KULIAH */
async function ambilDaftarMataKuliah() {
    const { data, error } = await supabaseClient
        .from("mata_kuliah")
        .select("id, nama_mata_kuliah")
        .order("id", { ascending: true });
console.log("DATA MATA KULIAH:", data);
console.log("ERROR MATA KULIAH:", error);

    if (error) {
        console.error("Gagal mengambil mata kuliah:", error);
        return;
    }

    daftarMataKuliah = data || [];
    filterMataKuliah.innerHTML =
        '<option value="">Semua Mata Kuliah</option>';

    daftarMataKuliah.forEach(matkul => {
        const pilihan = document.createElement("option");
        pilihan.value = matkul.id;
        pilihan.textContent = matkul.nama_mata_kuliah;
        filterMataKuliah.appendChild(pilihan);
    });
}

/* AMBIL DATA ABSENSI */
async function ambilDataAbsensi() {
    tabelRekapAbsensi.innerHTML = `
        <tr><td colspan="10" style="text-align:center;padding:30px">
            Memuat data absensi...
        </td></tr>`;

    const { data, error } = await supabaseClient
        .from("absensi")
        .select(`
            id,
            mata_kuliah_id,
            tanggal,
            jam,
            status,
            keterangan,
            latitude,
            longitude,
            jarak_meter,
            face_verified,
            mahasiswa(nim,nama,kelas)
        `)
        .order("tanggal", { ascending: false })
        .order("jam", { ascending: false });

    if (error) {
        console.error("Gagal mengambil data absensi:", error);
        tabelRekapAbsensi.innerHTML = `
            <tr><td colspan="10" style="text-align:center;padding:30px">
                Gagal mengambil data absensi. Periksa koneksi dan akses Supabase.
            </td></tr>`;
        return;
    }

    semuaAbsensi = data || [];
    filterDataAbsensi();
}

/* FILTER BERDASARKAN SATU TANGGAL */
function ambilDataTersaring() {
    const tanggal = filterTanggal.value;
    const status = filterStatus.value;
    const mataKuliahId = filterMataKuliah.value;
    const kataKunci = inputPencarianAbsensi.value.trim().toLowerCase();

    return semuaAbsensi.filter(absensi => {
        const mahasiswa = absensi.mahasiswa || {};

        const cocokTanggal =
            !tanggal || absensi.tanggal === tanggal;

        const cocokStatus =
            !status || absensi.status === status;

        const cocokMataKuliah =
            !mataKuliahId ||
            String(absensi.mata_kuliah_id ?? "") === mataKuliahId;

        const nim = String(mahasiswa.nim || "").toLowerCase();
        const nama = String(mahasiswa.nama || "").toLowerCase();

        const cocokPencarian =
            !kataKunci ||
            nim.includes(kataKunci) ||
            nama.includes(kataKunci);

        return cocokTanggal &&
            cocokStatus &&
            cocokMataKuliah &&
            cocokPencarian;
    });
}

/* TAMPILKAN REKAP */
function tampilkanRekap(data) {
    jumlahHadir.textContent =
        data.filter(item => item.status === "Hadir").length;

    jumlahSakit.textContent =
        data.filter(item => item.status === "Sakit").length;

    jumlahIzin.textContent =
        data.filter(item => item.status === "Izin").length;

    if (data.length === 0) {
        tabelRekapAbsensi.innerHTML = `
            <tr><td colspan="10" style="text-align:center;padding:30px">
                Tidak ada data absensi yang sesuai dengan filter.
            </td></tr>`;
        return;
    }

    tabelRekapAbsensi.innerHTML = "";

    data.forEach((absensi, index) => {
        const mahasiswa = absensi.mahasiswa || {};

        let badgeStatus = teksAman(absensi.status);

        if (absensi.status === "Hadir") {
            badgeStatus = '<span class="badge-status badge-hadir">Hadir</span>';
        } else if (absensi.status === "Sakit") {
            badgeStatus = '<span class="badge-status badge-sakit">Sakit</span>';
        } else if (absensi.status === "Izin") {
            badgeStatus = '<span class="badge-status badge-izin">Izin</span>';
        }

        const lokasi =
            absensi.latitude != null && absensi.longitude != null
                ? `${teksAman(absensi.latitude)}, ${teksAman(absensi.longitude)}`
                : "Lokasi tidak tersedia";

        const jarak = absensi.jarak_meter != null
            ? `${Math.round(Number(absensi.jarak_meter))} m`
            : "-";

        const statusWajah = absensi.face_verified === true
            ? "Terverifikasi"
            : "Belum";

        const baris = document.createElement("tr");

        baris.innerHTML = `
            <td>${index + 1}</td>
            <td>${teksAman(formatTanggal(absensi.tanggal))}</td>
            <td>${teksAman(formatJam(absensi.jam))}</td>
            <td>${teksAman(mahasiswa.nim)}</td>
            <td>${teksAman(mahasiswa.nama)}</td>
            <td>${teksAman(mahasiswa.kelas)}</td>
            <td>${badgeStatus}</td>
            <td>${teksAman(absensi.keterangan || "-")}</td>
            <td>
                <div>${teksAman(jarak)}</div>
                <div style="font-size:11px;color:#777;margin-top:4px">
                    ${lokasi}
                </div>
            </td>
            <td>${statusWajah}</td>
        `;

        tabelRekapAbsensi.appendChild(baris);
    });
}

function filterDataAbsensi() {
    tampilkanRekap(ambilDataTersaring());
}

/* DOWNLOAD EXCEL */
function downloadRekapExcel() {
    if (typeof XLSX === "undefined") {
        alert("Library Excel belum tersedia. Periksa script XLSX di HTML.");
        return;
    }

    const data = ambilDataTersaring();

    if (data.length === 0) {
        alert("Tidak ada data absensi untuk diunduh.");
        return;
    }

    const barisExcel = data.map((absensi, index) => {
        const mahasiswa = absensi.mahasiswa || {};
        const matkul = daftarMataKuliah.find(
            item => String(item.id) === String(absensi.mata_kuliah_id)
        );

        return {
            "No": index + 1,
            "Tanggal": absensi.tanggal || "-",
            "Jam": formatJam(absensi.jam),
            "Mata Kuliah": matkul
                ? matkul.nama_mata_kuliah
                : "Belum ditentukan",
            "NIM": mahasiswa.nim || "-",
            "Nama Mahasiswa": mahasiswa.nama || "-",
            "Kelas": mahasiswa.kelas || "-",
            "Status": absensi.status || "-",
            "Keterangan": absensi.keterangan || "-",
            "Jarak (meter)": absensi.jarak_meter ?? "-",
            "Latitude": absensi.latitude ?? "-",
            "Longitude": absensi.longitude ?? "-",
            "Verifikasi Wajah": absensi.face_verified === true
                ? "Terverifikasi"
                : "Belum"
        };
    });

    const lembar = XLSX.utils.json_to_sheet(barisExcel);
    const buku = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(buku, lembar, "Rekap Absensi");

    XLSX.writeFile(
        buku,
        `Rekap_Absensi_${filterTanggal.value || "Semua_Tanggal"}.xlsx`
    );
}

/* MULAI */
async function mulaiRekapAbsensi() {
    try {
        await ambilDaftarMataKuliah();
        await ambilDataAbsensi();
    } catch (error) {
        console.error("Gagal memulai rekap absensi:", error);
    }
}

filterTanggal.addEventListener("change", filterDataAbsensi);
filterStatus.addEventListener("change", filterDataAbsensi);
filterMataKuliah.addEventListener("change", filterDataAbsensi);
inputPencarianAbsensi.addEventListener("input", filterDataAbsensi);

mulaiRekapAbsensi();
