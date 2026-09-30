const dataMahasiswa = JSON.parse(
    localStorage.getItem("mahasiswaLogin")
);

let humanInstance = null;
let humanSiap = false;

if (!dataMahasiswa) {
    window.location.href = "index.html";
} else {
    document.getElementById("namaMahasiswa").textContent =
        dataMahasiswa.nama;

    document.getElementById("nimMahasiswa").textContent =
        dataMahasiswa.nim;

    document.getElementById("kelasMahasiswa").textContent =
        dataMahasiswa.kelas;
}

let statusDipilih = "";
let streamKamera = null;

let lokasiTerverifikasi = false;
let dataLokasiTerverifikasi = null;


// ======================================================
// PILIH STATUS ABSENSI
// ======================================================

function pilihStatus(status) {

    statusDipilih = status;

    const lokasiBox =
        document.getElementById("lokasiBox");

    const kameraBox =
        document.getElementById("kameraBox");

    const keteranganBox =
        document.getElementById("keteranganBox");

    const pesanSudahAbsen =
        document.getElementById("pesanSudahAbsen");

    const statusAbsensi =
        document.getElementById("statusAbsensi");


    // Reset verifikasi sebelumnya
    lokasiTerverifikasi = false;
    dataLokasiTerverifikasi = null;


    // Tutup kamera jika sebelumnya terbuka
    tutupKamera();


    // Hilangkan pesan absensi sebelumnya
    pesanSudahAbsen.style.display = "none";


    if (status === "Hadir") {

        statusAbsensi.textContent =
            "Anda memilih Hadir. Silahkan verifikasi lokasi kampus terlebih dahulu.";

        lokasiBox.style.display = "block";

        kameraBox.style.display = "none";

        keteranganBox.style.display = "none";

    }


    if (status === "Sakit") {

        statusAbsensi.textContent =
            "Anda memilih Sakit. Silahkan isi alasan Anda.";

        lokasiBox.style.display = "none";

        kameraBox.style.display = "none";

        keteranganBox.style.display = "block";

    }


    if (status === "Izin") {

        statusAbsensi.textContent =
            "Anda memilih Izin. Silahkan isi alasan Anda.";

        lokasiBox.style.display = "none";

        kameraBox.style.display = "none";

        keteranganBox.style.display = "block";

    }
}


// ======================================================
// VERIFIKASI LOKASI KAMPUS
// ======================================================

async function verifikasiLokasi() {

    if (statusDipilih !== "Hadir") {

        alert(
            "Verifikasi lokasi hanya diperlukan untuk absensi Hadir."
        );

        return;
    }


    const statusLokasi =
        document.getElementById("statusLokasi");

    const btnCekLokasi =
        document.getElementById("btnCekLokasi");


    statusLokasi.textContent =
        "Sedang mengambil lokasi Anda...";

    btnCekLokasi.disabled = true;

    lokasiTerverifikasi = false;

    dataLokasiTerverifikasi = null;


    try {

        const lokasi =
            await cekLokasiKampus();


        console.log(
            "Lokasi mahasiswa:",
            lokasi
        );


        const {
            data: dataKampus,
            error: errorKampus
        } = await supabaseClient
            .from("lokasi_kampus")
            .select(
                "latitude, longitude, radius_meter"
            )
            .limit(1)
            .maybeSingle();


        if (errorKampus) {

            console.error(
                "Error mengambil lokasi kampus:",
                errorKampus
            );

            statusLokasi.textContent =
                "Gagal mengambil data lokasi kampus.";

            alert(
                "Gagal mengambil lokasi kampus.\n\n" +
                errorKampus.message
            );

            btnCekLokasi.disabled = false;

            return;
        }


        if (!dataKampus) {

            statusLokasi.textContent =
                "Lokasi kampus belum tersedia.";

            alert(
                "Data lokasi kampus belum tersedia di database."
            );

            btnCekLokasi.disabled = false;

            return;
        }


        console.log(
            "Lokasi kampus:",
            dataKampus
        );


        const jarakKampus =
            hitungJarakMeter(
                lokasi.latitude,
                lokasi.longitude,
                dataKampus.latitude,
                dataKampus.longitude
            );


        console.log(
            "Jarak mahasiswa ke kampus:",
            jarakKampus,
            "meter"
        );

        console.log(
            "Radius kampus:",
            dataKampus.radius_meter,
            "meter"
        );


        if (
            jarakKampus >
            Number(dataKampus.radius_meter)
        ) {

            lokasiTerverifikasi = false;

            dataLokasiTerverifikasi = null;


            statusLokasi.innerHTML =
                "❌ Anda berada di luar radius kampus.<br>" +
                "Jarak Anda: " +
                Math.round(jarakKampus) +
                " meter<br>" +
                "Radius kampus: " +
                dataKampus.radius_meter +
                " meter";


            document.getElementById(
                "kameraBox"
            ).style.display = "none";


            tutupKamera();


            alert(
                "Anda berada di luar radius kampus.\n\n" +
                "Jarak Anda: " +
                Math.round(jarakKampus) +
                " meter\n" +
                "Radius kampus: " +
                dataKampus.radius_meter +
                " meter"
            );


            btnCekLokasi.disabled = false;

            return;
        }


        // ==================================================
        // LOKASI BERHASIL DIVERIFIKASI
        // ==================================================

        lokasiTerverifikasi = true;


        dataLokasiTerverifikasi = {

            latitude:
                lokasi.latitude,

            longitude:
                lokasi.longitude,

            accuracy:
                lokasi.accuracy,

            jarak_meter:
                jarakKampus
        };


        console.log(
            "DATA LOKASI TERVERIFIKASI:",
            dataLokasiTerverifikasi
        );


        statusLokasi.innerHTML =
            "✅ <strong>Lokasi Terverifikasi</strong><br>" +
            "Jarak Anda: " +
            Math.round(jarakKampus) +
            " meter<br>" +
            "Akurasi GPS: " +
            Math.round(lokasi.accuracy) +
            " meter";


        document.getElementById(
            "kameraBox"
        ).style.display = "block";


        btnCekLokasi.disabled = false;

    } catch (error) {

        console.error(
            "Error verifikasi lokasi:",
            error
        );


        statusLokasi.textContent =
            "Gagal mendapatkan lokasi.";


        alert(
            "Gagal mendapatkan lokasi.\n\n" +
            error.message
        );


        btnCekLokasi.disabled = false;
    }
}


// ======================================================
// KIRIM ABSENSI
// ======================================================

async function kirimAbsensi() {

    // --------------------------------------------------
    // CEK STATUS
    // --------------------------------------------------

    if (statusDipilih === "") {

        alert(
            "Silahkan pilih status kehadiran terlebih dahulu."
        );

        return;
    }


    // --------------------------------------------------
    // TANGGAL HARI INI
    // --------------------------------------------------

    const sekarang = new Date();

    const tanggalHariIni =
        sekarang.getFullYear() +
        "-" +
        String(
            sekarang.getMonth() + 1
        ).padStart(2, "0") +
        "-" +
        String(
            sekarang.getDate()
        ).padStart(2, "0");


    console.log(
        "Tanggal hari ini dari browser:",
        tanggalHariIni
    );


    // --------------------------------------------------
    // CEK APAKAH SUDAH ABSEN HARI INI
    // --------------------------------------------------

    const {
        data: absensiHariIni,
        error: errorCekAbsensi
    } = await supabaseClient
        .from("absensi")
        .select("id, status")
        .eq(
            "mahasiswa_id",
            dataMahasiswa.id
        )
        .eq(
            "tanggal",
            tanggalHariIni
        )
        .limit(1)
        .maybeSingle();


    if (errorCekAbsensi) {

        console.error(
            "Error mengecek absensi hari ini:",
            errorCekAbsensi
        );


        alert(
            "Gagal mengecek absensi hari ini.\n\n" +
            errorCekAbsensi.message
        );

        return;
    }


    if (absensiHariIni) {

        const pesanSudahAbsen =
            document.getElementById(
                "pesanSudahAbsen"
            );


        pesanSudahAbsen.innerHTML =
            "✅ <strong>Anda sudah melakukan absensi hari ini.</strong><br>" +
            "Status: <strong>" +
            absensiHariIni.status +
            "</strong>";


        pesanSudahAbsen.style.display =
            "block";

        pesanSudahAbsen.style.margin =
            "15px 0";

        pesanSudahAbsen.style.padding =
            "14px";

        pesanSudahAbsen.style.borderRadius =
            "10px";

        pesanSudahAbsen.style.backgroundColor =
            "#e8f5e9";

        pesanSudahAbsen.style.color =
            "#176b3a";

        pesanSudahAbsen.style.textAlign =
            "center";


        return;
    }


    // ==================================================
    // ABSENSI HADIR
    // ==================================================

    if (statusDipilih === "Hadir") {


        // ------------------------------------------------
        // CEK LOKASI SUDAH DIVERIFIKASI
        // ------------------------------------------------

        if (!lokasiTerverifikasi) {

            alert(
                "Silahkan verifikasi lokasi kampus terlebih dahulu."
            );

            return;
        }


        // ------------------------------------------------
        // CEK KAMERA
        // ------------------------------------------------

        if (!streamKamera) {

            alert(
                "Silahkan buka kamera terlebih dahulu."
            );

            return;
        }


        // ------------------------------------------------
        // AMBIL LOKASI TERBARU
        // ------------------------------------------------

        let lokasi;

        try {

            lokasi =
                await cekLokasiKampus();

        } catch (error) {

            console.error(
                "Gagal mengambil lokasi terbaru:",
                error
            );

            alert(
                "Gagal mengambil lokasi terbaru.\n\n" +
                error.message
            );

            return;
        }


        console.log(
            "Lokasi terbaru saat kirim absensi:",
            lokasi
        );


        // ------------------------------------------------
        // AMBIL DATA LOKASI KAMPUS
        // ------------------------------------------------

        const {
            data: dataKampus,
            error: errorKampus
        } = await supabaseClient
            .from("lokasi_kampus")
            .select(
                "latitude, longitude, radius_meter"
            )
            .limit(1)
            .maybeSingle();


        if (errorKampus) {

            console.error(
                "Error mengambil lokasi kampus:",
                errorKampus
            );


            alert(
                "Gagal mengambil lokasi kampus.\n\n" +
                errorKampus.message
            );

            return;
        }


        if (!dataKampus) {

            alert(
                "Lokasi kampus belum tersedia."
            );

            return;
        }


        console.log(
            "Data lokasi kampus:",
            dataKampus
        );


        // ------------------------------------------------
        // HITUNG JARAK TERBARU
        // ------------------------------------------------

        const jarakKampus =
            hitungJarakMeter(
                lokasi.latitude,
                lokasi.longitude,
                dataKampus.latitude,
                dataKampus.longitude
            );


        console.log(
            "Jarak mahasiswa ke kampus:",
            jarakKampus,
            "meter"
        );


        console.log(
            "Radius kampus:",
            dataKampus.radius_meter,
            "meter"
        );


        // ------------------------------------------------
        // CEK ULANG RADIUS
        // ------------------------------------------------

        if (
            jarakKampus >
            Number(dataKampus.radius_meter)
        ) {

            lokasiTerverifikasi = false;

            dataLokasiTerverifikasi = null;


            alert(
                "Lokasi Anda berada di luar radius kampus.\n\n" +
                "Jarak Anda: " +
                Math.round(jarakKampus) +
                " meter\n" +
                "Radius kampus: " +
                dataKampus.radius_meter +
                " meter"
            );


            return;
        }


        // ------------------------------------------------
        // SIMPAN DATA LOKASI TERBARU
        // ------------------------------------------------

        dataLokasiTerverifikasi = {

            latitude:
                lokasi.latitude,

            longitude:
                lokasi.longitude,

            accuracy:
                lokasi.accuracy,

            jarak_meter:
                jarakKampus
        };


        console.log(
            "DATA LOKASI FINAL UNTUK ABSENSI:",
            dataLokasiTerverifikasi
        );


        // ------------------------------------------------
        // VERIFIKASI WAJAH
        // ------------------------------------------------

        const wajahCocok =
            await verifikasiWajah();


        if (!wajahCocok) {

            return;
        }


        // ------------------------------------------------
        // SIMPAN ABSENSI HADIR
        // ------------------------------------------------

        const {
            error: errorSimpan
        } = await supabaseClient
            .from("absensi")
            .insert([
                {

                    mahasiswa_id:
                        dataMahasiswa.id,

                    tanggal:
                        tanggalHariIni,

                    status:
                        "Hadir",

                    latitude:
                        lokasi.latitude,

                    longitude:
                        lokasi.longitude,

                    jarak_meter:
                        jarakKampus,

                    face_verified:
                        true
                }
            ]);


        if (errorSimpan) {

            console.error(
                "Error menyimpan absensi:",
                errorSimpan
            );


            alert(
                "Absensi gagal disimpan.\n\n" +
                errorSimpan.message
            );


            return;
        }


        alert(
            "Absensi Hadir berhasil disimpan ✅"
        );


        // Tutup kamera setelah berhasil
        tutupKamera();


        return;
    }


    // ==================================================
    // ABSENSI SAKIT / IZIN
    // ==================================================

    if (
        statusDipilih === "Sakit" ||
        statusDipilih === "Izin"
    ) {


        const keterangan =
            document
                .getElementById(
                    "keterangan"
                )
                .value
                .trim();


        if (keterangan === "") {

            alert(
                "Silahkan isi alasan terlebih dahulu."
            );

            return;
        }


        const {
            error: errorSimpan
        } = await supabaseClient
            .from("absensi")
            .insert([
                {

                    mahasiswa_id:
                        dataMahasiswa.id,

                    tanggal:
                        tanggalHariIni,

                    status:
                        statusDipilih,

                    keterangan:
                        keterangan,

                    face_verified:
                        false
                }
            ]);


        if (errorSimpan) {

            console.error(
                "Error menyimpan absensi:",
                errorSimpan
            );


            alert(
                "Absensi gagal disimpan.\n\n" +
                errorSimpan.message
            );


            return;
        }


        alert(
            "Absensi " +
            statusDipilih +
            " berhasil disimpan."
        );


        document.getElementById(
            "keterangan"
        ).value = "";


        return;
    }
}


// ======================================================
// BUKA KAMERA
// ======================================================

async function bukaKamera() {

    if (!lokasiTerverifikasi) {

        alert(
            "Silahkan verifikasi lokasi terlebih dahulu."
        );

        return;
    }


    const video =
        document.getElementById(
            "kamera"
        );


    try {

        streamKamera =
            await navigator.mediaDevices.getUserMedia({

                video: {
                    facingMode: "user"
                },

                audio: false
            });


        video.srcObject =
            streamKamera;


        video.style.transform =
            "none";


        console.log(
            "Transform video:",
            video.style.transform
        );


        document.getElementById(
            "btnBukaKamera"
        ).style.display =
            "none";


        document.getElementById(
            "btnTutupKamera"
        ).style.display =
            "block";


        console.log(
            "Kamera berhasil dibuka."
        );

    } catch (error) {

        console.error(
            "Error membuka kamera:",
            error
        );


        alert(
            "Kamera tidak dapat dibuka.\n\n" +
            error.message
        );
    }
}


// ======================================================
// TUTUP KAMERA
// ======================================================

function tutupKamera() {

    if (streamKamera) {

        streamKamera
            .getTracks()
            .forEach(function (track) {

                track.stop();

            });

        streamKamera = null;
    }


    const video =
        document.getElementById(
            "kamera"
        );


    if (video) {

        video.srcObject = null;
    }


    const btnBukaKamera =
        document.getElementById(
            "btnBukaKamera"
        );


    const btnTutupKamera =
        document.getElementById(
            "btnTutupKamera"
        );


    if (btnBukaKamera) {

        btnBukaKamera.style.display =
            "block";
    }


    if (btnTutupKamera) {

        btnTutupKamera.style.display =
            "none";
    }
}


// ======================================================
// VERIFIKASI WAJAH
// ======================================================

async function verifikasiWajah() {

    try {

        console.log(
            "Memulai verifikasi wajah..."
        );


        if (!streamKamera) {

            alert(
                "Kamera belum dibuka."
            );

            return false;
        }


        // ------------------------------------------------
        // CEK DATA FOTO REFERENSI
        // ------------------------------------------------

        if (
            !dataMahasiswa.foto_referensi
        ) {

            alert(
                "Foto referensi mahasiswa belum tersedia."
            );

            return false;
        }


        // ------------------------------------------------
        // KONFIGURASI HUMAN
        // ------------------------------------------------

        const humanConfig = {

            backend: "webgl",

            modelBasePath:
                "https://vladmandic.github.io/human-models/models/",

            face: {

                enabled: true,

                detector: {

                    rotation: true,

                    return: true,

                    maxDetected: 1
                },

                mesh: {
                    enabled: true
                },

                iris: {
                    enabled: false
                },

                description: {
                    enabled: true
                },

                emotion: {
                    enabled: false
                },

                antispoof: {
                    enabled: false
                },

                liveness: {
                    enabled: false
                }
            }
        };


        if (!humanInstance) {

    console.log(
        "Mempersiapkan model Human..."
    );

    const humanConfig = {

        backend: "webgl",

        modelBasePath:
            "https://vladmandic.github.io/human-models/models/",

        face: {

            enabled: true,

            detector: {

                rotation: true,

                return: true,

                maxDetected: 1
            },

            mesh: {
                enabled: true
            },

            iris: {
                enabled: false
            },

            description: {
                enabled: true
            },

            emotion: {
                enabled: false
            },

            antispoof: {
                enabled: false
            },

            liveness: {
                enabled: false
            }
        }
    };


    humanInstance =
        new Human.Human(
            humanConfig
        );


    console.log(
        "Loading model Human..."
    );


    await humanInstance.load();


    await humanInstance.warmup();


    humanSiap = true;


    console.log(
        "Model Human siap."
    );

} else {

    console.log(
        "Model Human sudah siap, tidak perlu load ulang."
    );
}


        // ------------------------------------------------
        // DETEKSI WAJAH DARI KAMERA
        // ------------------------------------------------

        const video =
            document.getElementById(
                "kamera"
            );


        const hasilKamera =
            await humanInstance.detect(video);


        console.log(
            "Hasil deteksi kamera:",
            hasilKamera
        );


        if (
            !hasilKamera.face ||
            hasilKamera.face.length === 0
        ) {

            alert(
                "Wajah tidak terdeteksi.\n\n" +
                "Pastikan wajah terlihat jelas di kamera."
            );

            return false;
        }


        const wajahKamera =
            hasilKamera.face[0];


        if (
            !wajahKamera.embedding
        ) {

            alert(
                "Data wajah tidak berhasil dibuat."
            );

            return false;
        }


        // ------------------------------------------------
        // AMBIL FOTO REFERENSI DARI SUPABASE
        // ------------------------------------------------

        console.log(
            "Mengambil foto referensi..."
        );


        const {
            data: signedUrlData,
            error: signedUrlError
        } = await supabaseClient
            .storage
            .from("foto-mahasiswa")
            .createSignedUrl(
                dataMahasiswa.foto_referensi,
                60
            );


        if (signedUrlError) {

            console.error(
                "Error signed URL:",
                signedUrlError
            );


            alert(
                "Foto referensi tidak dapat diakses.\n\n" +
                signedUrlError.message
            );

            return false;
        }


        if (
            !signedUrlData ||
            !signedUrlData.signedUrl
        ) {

            alert(
                "URL foto referensi tidak tersedia."
            );

            return false;
        }


        // ------------------------------------------------
        // DOWNLOAD FOTO REFERENSI
        // ------------------------------------------------

        const response =
            await fetch(
                signedUrlData.signedUrl
            );


        if (!response.ok) {

            alert(
                "Foto referensi gagal diunduh."
            );

            return false;
        }


        const blob =
            await response.blob();


        const imageUrl =
            URL.createObjectURL(blob);


        // ------------------------------------------------
        // BUAT IMAGE UNTUK HUMAN
        // ------------------------------------------------

        const image =
            new Image();


        image.src =
            imageUrl;


        await new Promise(
            function (resolve, reject) {

                image.onload =
                    resolve;

                image.onerror =
                    reject;
            }
        );


        // ------------------------------------------------
        // DETEKSI WAJAH REFERENSI
        // ------------------------------------------------

        const hasilReferensi =
            await humanInstance.detect(image);


        console.log(
            "Hasil deteksi foto referensi:",
            hasilReferensi
        );


        URL.revokeObjectURL(
            imageUrl
        );


        if (
            !hasilReferensi.face ||
            hasilReferensi.face.length === 0
        ) {

            alert(
                "Wajah pada foto referensi tidak terdeteksi."
            );

            return false;
        }


        const wajahReferensi =
            hasilReferensi.face[0];


        if (
            !wajahReferensi.embedding
        ) {

            alert(
                "Data wajah dari foto referensi tidak tersedia."
            );

            return false;
        }


        // ------------------------------------------------
        // HITUNG JARAK WAJAH
        // ------------------------------------------------

        const embeddingKamera =
            wajahKamera.embedding;


        const embeddingReferensi =
            wajahReferensi.embedding;


        if (
            embeddingKamera.length !==
            embeddingReferensi.length
        ) {

            alert(
                "Data wajah tidak cocok formatnya."
            );

            return false;
        }


        let jumlahKuadrat =
            0;


        for (
            let i = 0;
            i < embeddingKamera.length;
            i++
        ) {

            const selisih =
                embeddingKamera[i] -
                embeddingReferensi[i];


            jumlahKuadrat +=
                selisih * selisih;
        }


        const jarakWajah =
            Math.sqrt(
                jumlahKuadrat
            );


        console.log(
            "Jarak wajah:",
            jarakWajah
        );


        // ------------------------------------------------
        // THRESHOLD
        // ------------------------------------------------

        const threshold =
            10;


        if (
            jarakWajah <=
            threshold
        ) {

            console.log(
                "Wajah cocok."
            );


            alert(
                "Wajah berhasil diverifikasi ✅"
            );


            return true;

        } else {

            console.log(
                "Wajah tidak cocok."
            );


            alert(
                "Wajah tidak cocok dengan foto referensi."
            );


            return false;
        }


    } catch (error) {

        console.error(
            "Error verifikasi wajah:",
            error
        );


        alert(
            "Terjadi kesalahan saat verifikasi wajah.\n\n" +
            error.message
        );


        return false;
    }
}


// ======================================================
// CEK LOKASI GPS
// ======================================================

function cekLokasiKampus() {

    return new Promise(
        function (resolve, reject) {

            if (
                !navigator.geolocation
            ) {

                reject(
                    new Error(
                        "Browser tidak mendukung GPS."
                    )
                );

                return;
            }


            navigator.geolocation.getCurrentPosition(

                function (position) {

                    const lokasi = {

                        latitude:
                            position.coords.latitude,

                        longitude:
                            position.coords.longitude,

                        accuracy:
                            position.coords.accuracy
                    };


                    console.log(
                        "GPS berhasil didapat:",
                        lokasi
                    );


                    resolve(
                        lokasi
                    );
                },


                function (error) {

                    console.error(
                        "GPS error:",
                        error
                    );


                    let pesan =
                        "Tidak dapat mengambil lokasi.";


                    if (
                        error.code ===
                        error.PERMISSION_DENIED
                    ) {

                        pesan =
                            "Izin lokasi ditolak oleh browser.";
                    }


                    if (
                        error.code ===
                        error.POSITION_UNAVAILABLE
                    ) {

                        pesan =
                            "Lokasi tidak tersedia.";
                    }


                    if (
                        error.code ===
                        error.TIMEOUT
                    ) {

                        pesan =
                            "Waktu mengambil lokasi habis.";
                    }


                    reject(
                        new Error(
                            pesan
                        )
                    );
                },


                {

                    enableHighAccuracy:
                        true,

                    timeout:
                        10000,

                    maximumAge:
                        0
                }
            );
        }
    );
}


// ======================================================
// HITUNG JARAK DENGAN HAVERSINE
// ======================================================

function hitungJarakMeter(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const R =
        6371000;


    const dLat =
        (lat2 - lat1) *
        Math.PI /
        180;


    const dLon =
        (lon2 - lon1) *
        Math.PI /
        180;


    const a =
        Math.sin(dLat / 2) *
        Math.sin(dLat / 2) +

        Math.cos(
            lat1 *
            Math.PI /
            180
        ) *

        Math.cos(
            lat2 *
            Math.PI /
            180
        ) *

        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    return R * c;
}


// ======================================================
// LOGOUT MAHASISWA
// ======================================================

function logoutMahasiswa() {

    tutupKamera();


    localStorage.removeItem(
        "mahasiswaLogin"
    );


    window.location.href =
        "index.html";
}