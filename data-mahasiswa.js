const tabelMahasiswa =
    document.querySelector(".mahasiswa-table tbody");

const inputPencarian =
    document.getElementById("inputPencarian");

let semuaMahasiswa = [];


/* =========================================
   AMBIL DATA MAHASISWA DARI SUPABASE
========================================= */

async function ambilDataMahasiswa() {

    tabelMahasiswa.innerHTML = `
        <tr>
            <td colspan="6" style="text-align: center; padding: 30px;">
                Memuat data mahasiswa...
            </td>
        </tr>
    `;

    try {

        const { data, error } =
            await supabaseClient
                .from("mahasiswa")
                .select(`
                    id,
                    nim,
                    nama,
                    kelas,
                    foto_referensi
                `)
                .order("nama", {
                    ascending: true
                });

        if (error) {

            console.error(
                "Gagal mengambil data mahasiswa:",
                error
            );

            tabelMahasiswa.innerHTML = `
                <tr>
                    <td
                        colspan="6"
                        style="
                            text-align: center;
                            padding: 30px;
                            color: #c0392b;
                        "
                    >
                        Gagal mengambil data mahasiswa.
                    </td>
                </tr>
            `;

            return;
        }

        semuaMahasiswa = data || [];

        tampilkanMahasiswa(
            semuaMahasiswa
        );

    } catch (error) {

        console.error(
            "Error:",
            error
        );

        tabelMahasiswa.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    style="
                        text-align: center;
                        padding: 30px;
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
   TAMPILKAN DATA MAHASISWA
========================================= */

async function tampilkanMahasiswa(data) {

    if (data.length === 0) {

        tabelMahasiswa.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    style="
                        text-align: center;
                        padding: 35px;
                        color: #777;
                    "
                >
                    Belum ada data mahasiswa.
                </td>
            </tr>
        `;

        return;
    }

    tabelMahasiswa.innerHTML = "";

    for (
        let index = 0;
        index < data.length;
        index++
    ) {

        const mahasiswa =
            data[index];

        const baris =
            document.createElement("tr");

        let urlFoto = "";


        /* =========================================
           AMBIL SIGNED URL FOTO
        ========================================= */

        if (mahasiswa.foto_referensi) {

            const {
                data: dataFoto,
                error: errorFoto
            } =
                await supabaseClient
                    .storage
                    .from("foto-mahasiswa")
                    .createSignedUrl(
                        mahasiswa.foto_referensi,
                        3600
                    );

            if (errorFoto) {

                console.error(
                    "Gagal mengambil foto:",
                    mahasiswa.foto_referensi,
                    errorFoto
                );

            } else if (dataFoto) {

                urlFoto =
                    dataFoto.signedUrl;
            }
        }


        /* =========================================
           TAMPILKAN FOTO ATAU PLACEHOLDER
        ========================================= */

        let tampilanFoto = "";

        if (urlFoto) {

            tampilanFoto = `
                <div class="foto-placeholder">

                    <span class="islamic-ornament">
                        ✦
                    </span>

                    <img
                        src="${urlFoto}"
                        alt="Foto ${mahasiswa.nama}"
                        style="
                            width: 100%;
                            height: 100%;
                            object-fit: cover;
                            border-radius: 50%;
                            position: relative;
                            z-index: 2;
                        "
                    >

                    <span class="islamic-ornament">
                        ☾
                    </span>

                </div>
            `;

        } else {

            tampilanFoto = `
                <div class="foto-placeholder">

                    <span class="islamic-ornament">
                        ✦
                    </span>

                    👤

                    <span class="islamic-ornament">
                        ☾
                    </span>

                </div>
            `;
        }


        /* =========================================
           ISI BARIS TABEL
        ========================================= */

        baris.innerHTML = `

            <td>
                ${index + 1}
            </td>

            <td>
                ${tampilanFoto}
            </td>

            <td>
                ${mahasiswa.nim}
            </td>

            <td>
                ${mahasiswa.nama}
            </td>

            <td>

                <span class="badge-kelas">
                    ${mahasiswa.kelas}
                </span>

            </td>

            <td>

                <div class="aksi-buttons">

                    <button
                        class="btn-aksi btn-edit"
                        type="button"
                        onclick="editMahasiswa('${mahasiswa.id}')"
                    >
                        Edit
                    </button>

                    <button
                        class="btn-aksi btn-hapus"
                        type="button"
                        onclick="hapusMahasiswa('${mahasiswa.id}')"
                    >
                        Hapus
                    </button>

                </div>

            </td>

        `;

        tabelMahasiswa.appendChild(
            baris
        );
    }
}


/* =========================================
   PENCARIAN MAHASISWA
========================================= */

inputPencarian.addEventListener(
    "input",
    function () {

        const kataKunci =
            inputPencarian.value
                .trim()
                .toLowerCase();

        if (kataKunci === "") {

            tampilkanMahasiswa(
                semuaMahasiswa
            );

            return;
        }

        const hasilPencarian =
            semuaMahasiswa.filter(
                function (mahasiswa) {

                    return (
                        mahasiswa.nim
                            .toLowerCase()
                            .includes(kataKunci)

                        ||

                        mahasiswa.nama
                            .toLowerCase()
                            .includes(kataKunci)
                    );
                }
            );

        tampilkanMahasiswa(
            hasilPencarian
        );
    }
);


/* =========================================
   EDIT MAHASISWA
========================================= */

function editMahasiswa(id) {

    const mahasiswa =
        semuaMahasiswa.find(
            function (item) {

                return item.id === id;

            }
        );

    if (!mahasiswa) {

        alert(
            "Data mahasiswa tidak ditemukan."
        );

        return;
    }


    /* =========================================
       ISI FORM EDIT
    ========================================= */

    document.getElementById(
        "editId"
    ).value =
        mahasiswa.id;

    document.getElementById(
        "editNIM"
    ).value =
        mahasiswa.nim;

    document.getElementById(
        "editNama"
    ).value =
        mahasiswa.nama;

    document.getElementById(
        "editKelas"
    ).value =
        mahasiswa.kelas;


    /* =========================================
       KOSONGKAN INPUT FOTO
    ========================================= */

    document.getElementById(
        "editFoto"
    ).value = "";


    /* =========================================
       TUTUP FORM TAMBAH
    ========================================= */

    const formTambah =
        document.getElementById(
            "formTambahMahasiswa"
        );

    formTambah.style.display =
        "none";


    /* =========================================
       BUKA FORM EDIT
    ========================================= */

    const formEdit =
        document.getElementById(
            "formEditMahasiswa"
        );

    formEdit.style.display =
        "block";


    /* =========================================
       RESET PESAN
    ========================================= */

    document.getElementById(
        "pesanEditMahasiswa"
    ).textContent = "";


    /* =========================================
       SCROLL KE FORM EDIT
    ========================================= */

    formEdit.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}


/* =========================================
   TUTUP FORM EDIT MAHASISWA
========================================= */

function tutupFormEditMahasiswa() {

    const formEdit =
        document.getElementById(
            "formEditMahasiswa"
        );

    formEdit.style.display =
        "none";

    document.getElementById(
        "editId"
    ).value = "";

    document.getElementById(
        "editNIM"
    ).value = "";

    document.getElementById(
        "editNama"
    ).value = "";

    document.getElementById(
        "editKelas"
    ).value = "Pagi";

    document.getElementById(
        "editFoto"
    ).value = "";

    document.getElementById(
        "pesanEditMahasiswa"
    ).textContent = "";
}


/* =========================================
   SIMPAN PERUBAHAN MAHASISWA
========================================= */

async function simpanEditMahasiswa() {

    const id =
        document.getElementById(
            "editId"
        ).value;

    const nim =
        document.getElementById(
            "editNIM"
        ).value
        .trim();

    const nama =
        document.getElementById(
            "editNama"
        ).value
        .trim();

    const kelas =
        document.getElementById(
            "editKelas"
        ).value;

    const inputFoto =
        document.getElementById(
            "editFoto"
        );

    const fileFoto =
        inputFoto.files[0];

    const pesan =
        document.getElementById(
            "pesanEditMahasiswa"
        );


    /* =========================================
       VALIDASI ID
    ========================================= */

    if (id === "") {

        pesan.textContent =
            "Data mahasiswa tidak ditemukan.";

        pesan.style.color =
            "#c0392b";

        return;
    }


    /* =========================================
       VALIDASI NIM DAN NAMA
    ========================================= */

    if (
        nim === "" ||
        nama === ""
    ) {

        pesan.textContent =
            "NIM dan nama mahasiswa wajib diisi.";

        pesan.style.color =
            "#c0392b";

        return;
    }


    /* =========================================
       VALIDASI FOTO JIKA DIPILIH
    ========================================= */

    if (fileFoto) {

        const tipeFotoDiizinkan = [
            "image/jpeg",
            "image/png"
        ];

        if (
            !tipeFotoDiizinkan.includes(
                fileFoto.type
            )
        ) {

            pesan.textContent =
                "Format foto harus JPG atau PNG.";

            pesan.style.color =
                "#c0392b";

            return;
        }

        if (
            fileFoto.size >
            5 * 1024 * 1024
        ) {

            pesan.textContent =
                "Ukuran foto maksimal 5 MB.";

            pesan.style.color =
                "#c0392b";

            return;
        }
    }


    pesan.textContent =
        "Menyimpan perubahan...";

    pesan.style.color =
        "#b89124";


    try {

        let fotoReferensiBaru =
            null;


        /* =========================================
           UPLOAD FOTO JIKA ADA FOTO BARU
        ========================================= */

        if (fileFoto) {

            const ekstensiFoto =
                fileFoto.type === "image/png"
                    ? "png"
                    : "jpeg";

            const namaFileFoto =
                nim + "." + ekstensiFoto;

            pesan.textContent =
                "Mengupload foto referensi...";

            const {
                error: errorUpload
            } =
                await supabaseClient
                    .storage
                    .from("foto-mahasiswa")
                    .upload(
                        namaFileFoto,
                        fileFoto,
                        {
                            contentType:
                                fileFoto.type,

                            upsert: true
                        }
                    );

            if (errorUpload) {

                console.error(
                    "Gagal upload foto:",
                    errorUpload
                );

                pesan.textContent =
                    "Foto gagal diupload.";

                pesan.style.color =
                    "#c0392b";

                return;
            }

            fotoReferensiBaru =
                namaFileFoto;
        }


        /* =========================================
           SIAPKAN DATA YANG AKAN DIUPDATE
        ========================================= */

        const dataUpdate = {
            nim: nim,
            nama: nama,
            kelas: kelas
        };


        if (fotoReferensiBaru) {

            dataUpdate.foto_referensi =
                fotoReferensiBaru;
        }


        /* =========================================
           UPDATE DATA MAHASISWA
        ========================================= */

        pesan.textContent =
            "Menyimpan data mahasiswa...";

        const {
            data,
            error
        } =
            await supabaseClient
                .from("mahasiswa")
                .update(dataUpdate)
                .eq("id", id)
                .select()
                .single();


        if (error) {

            console.error(
                "Gagal mengubah data mahasiswa:",
                error
            );

            if (
                error.code === "23505"
            ) {

                pesan.textContent =
                    "NIM tersebut sudah digunakan mahasiswa lain.";

            } else {

                pesan.textContent =
                    "Gagal menyimpan perubahan.";
            }

            pesan.style.color =
                "#c0392b";

            return;
        }


        console.log(
            "Data mahasiswa berhasil diperbarui:",
            data
        );


        pesan.textContent =
            fileFoto
                ? "Data dan foto berhasil diperbarui ✓"
                : "Data mahasiswa berhasil diperbarui ✓";

        pesan.style.color =
            "#176b3a";


        /* =========================================
           AMBIL ULANG DATA
        ========================================= */

        await ambilDataMahasiswa();


        setTimeout(
            function () {

                tutupFormEditMahasiswa();

            },
            800
        );


    } catch (error) {

        console.error(
            "Error:",
            error
        );

        pesan.textContent =
            "Terjadi kesalahan pada sistem.";

        pesan.style.color =
            "#c0392b";
    }
}


/* =========================================
   HAPUS MAHASISWA
========================================= */

async function hapusMahasiswa(id) {

    const mahasiswa =
        semuaMahasiswa.find(
            function (item) {

                return item.id === id;

            }
        );

    if (!mahasiswa) {

        alert(
            "Data mahasiswa tidak ditemukan."
        );

        return;
    }


    const yakin =
        confirm(
            "Apakah Anda yakin ingin menghapus mahasiswa:\n\n" +
            mahasiswa.nama +
            "\nNIM: " +
            mahasiswa.nim +
            "\n\nData yang dihapus tidak dapat dikembalikan."
        );


    if (!yakin) {

        return;
    }


    try {

        const {
            error
        } =
            await supabaseClient
                .from("mahasiswa")
                .delete()
                .eq("id", id);


        if (error) {

            console.error(
                "Gagal menghapus mahasiswa:",
                error
            );

            alert(
                "Gagal menghapus data mahasiswa."
            );

            return;
        }


        alert(
            "Data mahasiswa berhasil dihapus."
        );


        await ambilDataMahasiswa();


    } catch (error) {

        console.error(
            "Error:",
            error
        );

        alert(
            "Terjadi kesalahan pada sistem."
        );
    }
}


/* =========================================
   FORM TAMBAH MAHASISWA
========================================= */

function bukaFormTambahMahasiswa() {

    const form =
        document.getElementById(
            "formTambahMahasiswa"
        );

    form.style.display =
        "block";
}


function tutupFormTambahMahasiswa() {

    const form =
        document.getElementById(
            "formTambahMahasiswa"
        );

    form.style.display =
        "none";

    document.getElementById(
        "tambahNIM"
    ).value = "";

    document.getElementById(
        "tambahNama"
    ).value = "";

    document.getElementById(
        "tambahKelas"
    ).value = "Pagi";

    document.getElementById(
        "tambahFoto"
    ).value = "";

    document.getElementById(
        "pesanTambahMahasiswa"
    ).textContent = "";
}


/* =========================================
   SIMPAN MAHASISWA BARU
========================================= */

async function simpanMahasiswa() {

    const nim =
        document.getElementById(
            "tambahNIM"
        )
        .value
        .trim();

    const nama =
        document.getElementById(
            "tambahNama"
        )
        .value
        .trim();

    const kelas =
        document.getElementById(
            "tambahKelas"
        ).value;

    const inputFoto =
        document.getElementById(
            "tambahFoto"
        );

    const fileFoto =
        inputFoto.files[0];

    const pesan =
        document.getElementById(
            "pesanTambahMahasiswa"
        );


    /* =========================================
       VALIDASI FOTO
    ========================================= */

    if (!fileFoto) {

        pesan.textContent =
            "Silahkan pilih foto referensi terlebih dahulu.";

        pesan.style.color =
            "#c0392b";

        return;
    }


    const tipeFotoDiizinkan = [
        "image/jpeg",
        "image/png"
    ];


    if (
        !tipeFotoDiizinkan.includes(
            fileFoto.type
        )
    ) {

        pesan.textContent =
            "Format foto harus JPG atau PNG.";

        pesan.style.color =
            "#c0392b";

        return;
    }


    if (
        fileFoto.size >
        5 * 1024 * 1024
    ) {

        pesan.textContent =
            "Ukuran foto maksimal 5 MB.";

        pesan.style.color =
            "#c0392b";

        return;
    }


    /* =========================================
       VALIDASI DATA
    ========================================= */

    if (
        nim === "" ||
        nama === ""
    ) {

        pesan.textContent =
            "NIM dan nama mahasiswa wajib diisi.";

        pesan.style.color =
            "#c0392b";

        return;
    }


    pesan.textContent =
        "Menyimpan data mahasiswa...";

    pesan.style.color =
        "#b89124";


    const ekstensiFoto =
        fileFoto.type === "image/png"
            ? "png"
            : "jpeg";

    const namaFileFoto =
        nim + "." + ekstensiFoto;


    /* =========================================
       UPLOAD FOTO
    ========================================= */

    pesan.textContent =
        "Mengupload foto referensi...";


    try {

        const {
            error: errorUpload
        } =
            await supabaseClient
                .storage
                .from("foto-mahasiswa")
                .upload(
                    namaFileFoto,
                    fileFoto,
                    {
                        contentType:
                            fileFoto.type,

                        upsert: true
                    }
                );


        if (errorUpload) {

            console.error(
                "Gagal upload foto:",
                errorUpload
            );

            pesan.textContent =
                "Foto gagal diupload.";

            pesan.style.color =
                "#c0392b";

            return;
        }


    } catch (errorUpload) {

        console.error(
            "Error upload foto:",
            errorUpload
        );

        pesan.textContent =
            "Terjadi kesalahan saat upload foto.";

        pesan.style.color =
            "#c0392b";

        return;
    }


    /* =========================================
       SIMPAN DATA MAHASISWA
    ========================================= */

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("mahasiswa")
                .insert([
                    {
                        nim: nim,
                        nama: nama,
                        kelas: kelas,
                        foto_referensi:
                            namaFileFoto
                    }
                ])
                .select()
                .single();


        if (error) {

            console.error(
                "Gagal menyimpan mahasiswa:",
                error
            );


            if (
                error.code === "23505"
            ) {

                pesan.textContent =
                    "NIM tersebut sudah terdaftar.";

            } else {

                pesan.textContent =
                    "Gagal menyimpan data mahasiswa.";
            }


            pesan.style.color =
                "#c0392b";

            return;
        }


        console.log(
            "Mahasiswa berhasil ditambahkan:",
            data
        );


        pesan.textContent =
            "Mahasiswa berhasil ditambahkan ✓";

        pesan.style.color =
            "#176b3a";


        await ambilDataMahasiswa();


        setTimeout(
            function () {

                tutupFormTambahMahasiswa();

            },
            800
        );


    } catch (error) {

        console.error(
            "Error:",
            error
        );

        pesan.textContent =
            "Terjadi kesalahan pada sistem.";

        pesan.style.color =
            "#c0392b";
    }
}


/* =========================================
   JALANKAN SAAT HALAMAN DIBUKA
========================================= */

ambilDataMahasiswa();