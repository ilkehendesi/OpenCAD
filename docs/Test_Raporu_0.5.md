# Hendese CAD 0.5 — Test kaydı

Tarih: 9 Ekim 2026.

Geçen kontroller:
- npm test: temel geometri/dönüşüm, HCAD doğrulama, Türkçe metin, sekiz gerçek DWG örneği.
- Analitik crossing/fence, nesne yakalama, UCS/polar, uzamsal indeks ve fark tabanlı undo/redo.
- Polyline yay ekleme/bölme/ters çevirme/JOIN/EXPLODE, DWG kapanma bayrağı,
  blok katmanı görünürlüğü, OCS ve bozuk nesne raporu.
- FILLET/CHAMFER: yönler, yarıçap/mesafeler, komşu köşe çakışması reddi.
- Dikdörtgensel/dairesel ARRAY, UCS açısı, dolum açısı ve öğe döndürme.
- BREAK/BREAKATPOINT: çizgi/yaylı polyline/daire, başlangıcı aşan aralıklar.
- LENGTHEN: sabit uç, toplam uzunluk; STRETCH: pencere içi uçlar.
- DXF yeniden okuma ve gerçek DWG R2000 yaz/yeniden aç: yeni köşe geometrisi,
  yaylı/kapalı polyline, katman kalınlığı, görünürlük ve kilit.
- PDF vektör üretimi; ölçek dönüşümü, kâğıt boyutu, pencere kırpma ve taşma reddi.
- Chromium UI: yeni yedi komut, önizleme/onay/iptal, geri al/yinele,
  geçersiz ölçü, göreli koordinat, farklı dizi türleri.
- Mevcut UI: çizgi/daire/polyline, dönüştürme, katman, Plot, dosya aktarım akışı.
- Ana görünüm, köşe önizlemesi ve ARRAY penceresi ekran görüntüleri incelendi.

Ortam ve sınır:
Linux Node 24 + Chromium. DWG yazma aynı LibreDWG 0.13.4 sürümünün Linux
programıyla test edildi. UI testlerinde Electron dosya API'si taklit edildi.
Windows EXE, native diyaloglar ve AutoCAD ile karşılıklı kabul testi yapılmadı.
Kullanıcının sorunlu DWG dosyası bulunmadığı için dosyaya özgü layer hatası
üzerinde yeni bir düzeltme iddia edilmiyor.

Tekrar çalıştırma:
`npm test`

Yerel DWG yazıcısıyla: HENDESE_TEST_DXF2DWG ortam değişkeni executable yoludur.
Windows'ta paket içindeki yazıcı varsayılan olarak kullanılır.
`node tests/modify-ui.test.cjs` için Playwright gerekir; PLAYWRIGHT_MODULE ve
PLAYWRIGHT_CHROMIUM_EXECUTABLE ile yerel yollar belirtilebilir.
