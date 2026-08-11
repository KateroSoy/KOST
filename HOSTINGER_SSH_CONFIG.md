# Configuration & Access Guide: Hostinger SSH

Berikut adalah rincian koneksi SSH untuk server Hostinger StayFlow / Kostweb:

## 🔑 Detail SSH Connection

| Parameter | Value |
|-----------|-------|
| **Host / IP** | `46.202.138.60` |
| **Port** | `65002` |
| **Username** | `u330327941` |
| **Private Key Path** | `C:\Users\Msi\.ssh\sinarerp_hostinger_codex_ed25519` |
| **SSH Command** | `ssh -i "C:\Users\Msi\.ssh\sinarerp_hostinger_codex_ed25519" -p 65002 u330327941@46.202.138.60` |

## 🛡️ Public Key Registered
```text
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIIeRIlJFls9us2w5EweZT8lbqeDc77q79glEc/gxgezy msi@DESKTOP-Q0TAQSL
```

---

## ⚡ Perintah Deployment Otomatis (1-Click)

Jalankan skrip ini dari terminal lokal Anda atau klik file:
📄 [`deploy_to_hostinger.bat`](file:///d:/digital%20product/SASS/kostweb/deploy_to_hostinger.bat)

```bash
# Atau jalankan manual di terminal:
ssh -i "C:\Users\Msi\.ssh\sinarerp_hostinger_codex_ed25519" -p 65002 u330327941@46.202.138.60 "cd public_html && git pull origin stay && php artisan migrate --force"
```
