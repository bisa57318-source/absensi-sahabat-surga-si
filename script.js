function tampilkanLoginMahasiswa() {
    document.getElementById("menuLogin").style.display = "none";
    document.getElementById("formMahasiswa").style.display = "block";
    document.getElementById("formAdmin").style.display = "none";
}

function tampilkanLoginAdmin() {
    document.getElementById("menuLogin").style.display = "none";
    document.getElementById("formMahasiswa").style.display = "none";
    document.getElementById("formAdmin").style.display = "block";
}

function kembaliKeMenu() {
    document.getElementById("formMahasiswa").style.display = "none";
    document.getElementById("formAdmin").style.display = "none";
    document.getElementById("menuLogin").style.display = "flex";
}

async function prosesLoginMahasiswa() {
    const nim = document.getElementById("inputNIM").value.trim();
    const pesan = document.getElementById("pesanLogin");

    if (nim === "") {
        pesan.textContent = "Silahkan masukkan NIM terlebih dahulu.";
        pesan.style.color = "#c0392b";
        return;
    }

    pesan.textContent = "Sedang memeriksa NIM...";
    pesan.style.color = "#b89124";

    const { data, error } = await supabaseClient
        .from("mahasiswa")
        .select("id, nim, nama, kelas, foto_referensi")
        .eq("nim", nim)
        .maybeSingle();

    if (error) {
        console.error(error);
        pesan.textContent = "Terjadi kesalahan pada database.";
        pesan.style.color = "#c0392b";
        return;
    }

    if (!data) {
        pesan.textContent = "NIM tidak ditemukan.";
        pesan.style.color = "#c0392b";
        return;
    }

    localStorage.setItem(
        "mahasiswaLogin",
        JSON.stringify(data)
    );

    window.location.href = "mahasiswa.html";
}

function prosesLoginAdmin() {
    const password =
        document.getElementById("inputPasswordAdmin").value.trim();

    const pesan =
        document.getElementById("pesanLoginAdmin");

    if (password === "") {
        pesan.textContent = "Silahkan masukkan password.";
        pesan.style.color = "#c0392b";
        return;
    }

    if (password === "sahabatilljannah1") {
        pesan.textContent = "Login admin berhasil ✨";
        pesan.style.color = "#176b3a";

        setTimeout(function () {
            window.location.href = "admin.html";
        }, 500);

        return;
    }

    pesan.textContent = "Password admin salah.";
    pesan.style.color = "#c0392b";
}