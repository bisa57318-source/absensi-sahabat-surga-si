const tabelRekapAbsensi =
    document.getElementById("tabelRekapAbsensi");

const filterTanggal =
    document.getElementById("filterTanggal");

const filterStatus =
    document.getElementById("filterStatus");

const inputPencarianAbsensi =
    document.getElementById("inputPencarianAbsensi");

const jumlahHadir =
    document.getElementById("jumlahHadir");

const jumlahSakit =
    document.getElementById("jumlahSakit");

const jumlahIzin =
    document.getElementById("jumlahIzin");


let semuaAbsensi = [];


/* =========================================
   AMBIL DATA ABSENSI
========================================= */

async function ambilDataAbsensi() {

    tabelRekapAbsensi.innerHTML = `
        <tr>
            <td
                colspan="10"
                style="
                    text-align: center;
                    padding: 35px;
                "
            >
                Memuat data absensi...
            </td>
        </tr>
    `;


    try {

        const { data, error } =
            await supabaseClient
                .from("absensi")
                .select(`
                    id,
                    tanggal,
                    jam,
                    status,
                    keterangan,
                    latitude,
                    longitude,
                    jarak_meter,
                    face_verified,
                    mahasiswa (
                        nim,
                        nama,
                        kelas
                    )
                `)
                .order("tanggal", {
                    ascending: false
                })
                .order("jam", {
                    ascending: false
                });


        if (error) {

            console.error(
                "Gagal mengambil data absensi:",
                error
            );


            tabelRekapAbsensi.innerHTML = `
                <tr>
                    <td
                        colspan="10"
                        style="
                            text-align: center;
                            padding: 35px;
                            color: #c0392b;
                        "
                    >
                        Gagal mengambil data absensi.
                    </td>
                </tr>
            `;

            return;
        }


        semuaAbsensi = data || [];

        console.log("DATA ABSENSI DARI SUPABASE:", data);


        tampilkanRekap(
            semuaAbsensi
        );


    } catch (error) {

        console.error(
            "Error:",
            error
        );


        tabelRekapAbsensi.innerHTML = `
            <tr>
                <td
                    colspan="10"
                    style="
                        text-align: center;
                        padding: 35px;
                        color: #c0392b;
                    "
                >
                    Terjadi kesalahan pada sistem.
                </td>
            </tr>
        `;

    }

}


/* =========================================
   TAMPILKAN REKAP
========================================= */

function tampilkanRekap(data) {

    jumlahHadir.textContent =
        data.filter(
            function (item) {
                return item.status === "Hadir";
            }
        ).length;


    jumlahSakit.textContent =
        data.filter(
            function (item) {
                return item.status === "Sakit";
            }
        ).length;


    jumlahIzin.textContent =
        data.filter(
            function (item) {
                return item.status === "Izin";
            }
        ).length;


    if (data.length === 0) {

        tabelRekapAbsensi.innerHTML = `
            <tr>
                <td
                    colspan="10"
                    style="
                        text-align: center;
                        padding: 35px;
                        color: #777;
                    "
                >
                    Belum ada data absensi.
                </td>
            </tr>
        `;

        return;
    }


    tabelRekapAbsensi.innerHTML = "";


    data.forEach(
        function (absensi, index) {

            const mahasiswa =
                absensi.mahasiswa;


            const tanggal =
                absensi.tanggal || "-";


            let jam = "-";


            if (absensi.jam) {

                const waktu =
                    new Date(
                        absensi.jam
                    );


                jam =
                    waktu.toLocaleTimeString(
                        "id-ID",
                        {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit"
                        }
                    );

            }


            let kelas =
                "-";

            let nim =
                "-";

            let nama =
                "-";


            if (mahasiswa) {

                nim =
                    mahasiswa.nim || "-";

                nama =
                    mahasiswa.nama || "-";

                kelas =
                    mahasiswa.kelas || "-";

            }


            let badgeStatus =
                "";


            if (
                absensi.status === "Hadir"
            ) {

                badgeStatus = `
                    <span class="badge-status badge-hadir">
                        Hadir
                    </span>
                `;

            } else if (
                absensi.status === "Sakit"
            ) {

                badgeStatus = `
                    <span class="badge-status badge-sakit">
                        Sakit
                    </span>
                `;

            } else if (
                absensi.status === "Izin"
            ) {

                badgeStatus = `
                    <span class="badge-status badge-izin">
                        Izin
                    </span>
                `;

            } else {

                badgeStatus =
                    absensi.status || "-";

            }


            let jarak =
                "-";


            if (
                absensi.jarak_meter !== null &&
                absensi.jarak_meter !== undefined
            ) {

                jarak =
                    Math.round(
                        Number(
                            absensi.jarak_meter
                        )
                    ) +
                    " m";

            }


            let statusWajah =
                "Belum";


            if (
                absensi.face_verified === true
            ) {

                statusWajah =
                    "✓ Terverifikasi";

            }


            const baris =
                document.createElement("tr");


            baris.innerHTML = `

                <td>
                    ${index + 1}
                </td>

                <td>
                    ${tanggal}
                </td>

                <td>
                    ${jam}
                </td>

                <td>
                    ${nim}
                </td>

                <td>
                    ${nama}
                </td>

                <td>
                    ${kelas}
                </td>

                <td>
                    ${badgeStatus}
                </td>

                <td>
                    ${absensi.keterangan || "-"}
                </td>

                <td>
    <div style="font-size: 13px;">
        ${jarak}
    </div>

    ${
        absensi.latitude !== null &&
        absensi.longitude !== null
            ? `
                <div style="
                    font-size: 11px;
                    color: #777;
                    margin-top: 4px;
                ">
                    ${absensi.latitude},
                    ${absensi.longitude}
                </div>
            `
            : `
                <div style="
                    font-size: 11px;
                    color: #999;
                    margin-top: 4px;
                ">
                    Lokasi tidak tersedia
                </div>
            `
    }
</td>

                <td>
                    ${statusWajah}
                </td>

            `;


            tabelRekapAbsensi.appendChild(
                baris
            );

        }
    );

}


/* =========================================
   FILTER
========================================= */

function filterDataAbsensi() {

    const tanggal =
        filterTanggal.value;


    const status =
        filterStatus.value;


    const kataKunci =
        inputPencarianAbsensi.value
            .trim()
            .toLowerCase();


    const hasil =
        semuaAbsensi.filter(
            function (absensi) {

                const mahasiswa =
                    absensi.mahasiswa;


                const cocokTanggal =
                    tanggal === "" ||
                    absensi.tanggal === tanggal;


                const cocokStatus =
                    status === "" ||
                    absensi.status === status;


                const cocokPencarian =
                    kataKunci === "" ||
                    (
                        mahasiswa &&
                        (
                            mahasiswa.nim
                                .toLowerCase()
                                .includes(kataKunci)

                            ||

                            mahasiswa.nama
                                .toLowerCase()
                                .includes(kataKunci)
                        )
                    );


                return (
                    cocokTanggal &&
                    cocokStatus &&
                    cocokPencarian
                );

            }
        );


    tampilkanRekap(
        hasil
    );

}


/* =========================================
   EVENT FILTER
========================================= */

filterTanggal.addEventListener(
    "change",
    filterDataAbsensi
);


filterStatus.addEventListener(
    "change",
    filterDataAbsensi
);


inputPencarianAbsensi.addEventListener(
    "input",
    filterDataAbsensi
);


/* =========================================
   JALANKAN SAAT HALAMAN DIBUKA
========================================= */

ambilDataAbsensi();