# Hendese CAD 0.6 — Test kaydı

9 Ekim 2026. Önceki 0.5 kontrollerine eklenen kontroller:

| Kontrol | Sonuç |
|---|---|
| 510.000 LINE içeren HCAD, 45.966.899 bayt | Worker içinde normalizasyon ve açılış geçti; ~1,8–1,9 sn |
| 510k doğrulama + indeks | ~2,7–2,8 sn; 121 elemanlık pencere sorgusu doğru |
| 50.000 nesne + 1.501 katman UI | İlk hazırlık ~316 ms; tüm geometri parça parça çizildi |
| Fare hareketinde çizim önbelleği | Geometri nesli değişmedi; yeniden geometri çizimi yok |
| Katman listesi | İlk 100 satır; aramada 1499 numaralı katman bulundu |
| Rasyonel spline | Çeyrek daire analitik yarıçapı örneklerde korundu |
| HATCH sınırları, blok adı harf farkı | İçe aktarma ve doğru layer eşleme geçti |
| Üst blok ve nesne gizliliği | Nedenler gösterildi; Göster ve sığdır görünür yaptı |
| Son proje | Tekilleştirme, yerel kaydı yeniden okuma ve önizleme geçti |
| Taşınmış dosya | Pasif kart, listeden kaldırma; gerçek dosya silinmez |
| Açılış, karttan açma, Yeni, arama | Chromium UI testleri geçti |
| Okuyucu iptali ve süre sınırı | İşlem durdu; hata/iptal sonuçları ayrı döndü |
| Regresyon | 0.5 araçları, DWG okuma/yazma, DXF, PDF ölçek/taşma testleri geçti |

Sınırlar: sentetik büyük proje HCAD formatındadır; kullanıcının sorunlu DWG'si
henüz sağlanmadı. Yerel DWG yazıcı Linux LibreDWG 0.13.4 ile test edildi.
Windows EXE, native dosya diyalogları ve kullanıcının bilgisayarı doğrulanmadı.
HATCH yalnız sınır çizgileri, SPLINE örneklenmiş polyline olarak içe aktarılır.
Dış referans/proxy/3B/pafta alanı eksikleri bu sürümde tamamen çözülmedi.

Tekrar: npm test; npm run test:large.
UI: node tests/home-ui.test.cjs (Playwright ve Chromium gerekir).
PLAYWRIGHT_MODULE / PLAYWRIGHT_CHROMIUM_EXECUTABLE ile yollar belirtilebilir.
