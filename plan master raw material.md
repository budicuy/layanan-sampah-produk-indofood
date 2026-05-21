```markdown
# Master Data RAW MATERIAL

## Form Input Create Data

**Periode (Bulan dan Tahun):** Januari 2026

---

### Kategori (ada banyak form input)

#### Etiket
| Jenis             | Satuan |
|-------------------|--------|
| Normal Noodle(NN) | Kg     |
| Cup Noodle(CN)    | Kg     |
| Glass Noodle(GN)  | Kg     |

#### Karton
| Jenis             | Satuan |
|-------------------|--------|
| Normal Noodle(NN) | Kg     |
| Cup Noodle(CN)    | Kg     |
| Glass Noodle(GN)  | Kg     |

#### Cup
| Jenis          | Satuan |
|----------------|--------|
| Cup Noodle(CN) | Kg     |

---

## Hasil Tabel

| No | Periode  | Kategori | Klasifikasi | Berat (gr) | Berat (kg) | Action                |
|----|----------|----------|-------------|------------|------------|-----------------------|
| 1  | Januari  | Etiket   | NN          | 1.7        | 0.0017     | Edit / Hapus (Tombol) |
|    |          | Etiket   | GN          | 1.6        | 0.0016     | Edit / Hapus (Tombol) |
|    |          | Etiket   | CN          | 1.5        | 0.0015     | Edit / Hapus (Tombol) |
|    |          | Karton   | NN          | 500        | 0.5000     | Edit / Hapus (Tombol) |
|    |          | Karton   | GN          | 480        | 0.4800     | Edit / Hapus (Tombol) |
|    |          | Karton   | CN          | 450        | 0.4500     | Edit / Hapus (Tombol) |
|    |          | Cup      | CN          | 200        | 0.2000     | Edit / Hapus (Tombol) |
| 2  | Februari | Etiket   | NN          | 1.8        | 0.0018     | Edit / Hapus (Tombol) |
|    |          | Etiket   | GN          | 1.7        | 0.0017     | Edit / Hapus (Tombol) |
|    |          | Etiket   | CN          | 1.6        | 0.0016     | Edit / Hapus (Tombol) |
|    |          | Karton   | NN          | 510        | 0.5100     | Edit / Hapus (Tombol) |
|    |          | Karton   | GN          | 490        | 0.4900     | Edit / Hapus (Tombol) |
|    |          | Karton   | CN          | 460        | 0.4600     | Edit / Hapus (Tombol) |
|    |          | Cup      | CN          | 210        | 0.2100     | Edit / Hapus (Tombol) |

> **Catatan:** Kolom `No` dan `Periode` hanya diisi pada baris pertama tiap periode.
> Satu nomor mewakili satu Periode dengan banyak Kategori dan Klasifikasi.

---

## Catatan Struktur Data

- **No**: Nomor urut — satu nomor untuk satu Periode (tidak berulang)
- **Periode**: Bulan dan Tahun input data — satu Periode memiliki banyak baris Kategori
- **Kategori**: Jenis kemasan — `Etiket`, `Karton`, `Cup`
- **Klasifikasi**: Jenis produk mie
  - `NN` = Normal Noodle
  - `CN` = Cup Noodle
  - `GN` = Glass Noodle
- **Berat (gr)**: Input berat dalam satuan gram
- **Berat (kg)**: Hasil konversi otomatis dari gram ke kilogram
- **Action**: Tombol Edit dan Hapus untuk manajemen data

### Relasi Data
```
No. 1 → Periode: Januari
  └── Etiket  → NN, GN, CN
  └── Karton  → NN, GN, CN
  └── Cup     → CN

No. 2 → Periode: Februari
  └── Etiket  → NN, GN, CN
  └── Karton  → NN, GN, CN
  └── Cup     → CN
```

### Rumus Konversi
```
Berat (kg) = Berat (gr) / 1000
Contoh: 1.7 gr / 1000 = 0.0017 kg
```
```