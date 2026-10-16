# OpenCAD — Uygulama matrisi ve aşamalı plan

Girdi: Kullanıcının 20 bölümlük özellik metni. **429 özellik maddesinin tamamı** aşağıda izlenir. Geliştirme kuralları ayrıca uygulanacak süreç şartlarıdır.

Bu matris özellik vaadi değil, mevcut kodun durum kaydıdır. “Mevcut” kapsamlı AutoCAD eşdeğerliği veya üretim sertifikası anlamına gelmez. “Test edilmesi gerekiyor” ayrı bir test sütunudur.

Durum dağılımı: Mevcut: 87, Eksik: 233, Kısmen mevcut: 96, Bağımlılık gerektiriyor: 13.

## Mevcut mimari

- Electron 44.7.0: Windows masaüstü kabuğu; native dosya diyalogları, atomik kayıt, parser worker.
- core.js: kalıcı 2B nesneler, dönüşümler, basit seçim geometrisi, ölçü parçaları ve HCAD validasyonu.
- app.js: Canvas render, seçim, komutlar, undo/redo, katman paneli. Tek dosyada yoğunlaşmış UI aşamalı olarak ayrıştırılmalı.
- io.js / parser-worker.cjs: LibreDWG WebAssembly ve dxf-parser ile içe aktarma; desteklenmeyen tür raporu.
- dxf-modern.js: DXF R2000; layer 370 kalınlık, birim, görünürlük/kilit, ByLayer nesneler ve iç içe BLOCK_RECORD/BLOCK/INSERT.
- dwg-backend.cjs / dwg-export.cjs: gömülü deneysel LibreDWG veya ayrıca kurulan ODA File Converter ile AC1015 DWG. verify-dwg.cjs kayıt öncesi nesne türleri, katmanlar, blok yapısı, sınırlar ve kalınlıkları kontrol eder. Bu kontrol AutoCAD uyumluluk sertifikası değildir.
- plot.js / pdf-export.cjs: model-kâğıt dönüşümü ve PDF-Lib ile milimetre esaslı vektör çıktı, gömülü DejaVu Sans.
- precision.js: analitik çizgi/yay/daire ve bulge geometrisi, UCS dönüşümleri, yakalama, Crossing/Fence, dengeli AABB uzamsal indeksi.
- history.js: yalnız değişen nesne ve belge alanlarını tutan undo/redo; CommandSession ile eşzamanlı nokta işleme engeli.
- HCAD: UCS ve yakalama tercihleri projede saklanır. Geçmişte yalnız farklar tutulur; açık işlem için bir geçici tam kopya ve O(n) karşılaştırma hâlâ kullanılır.

## Yetkilendirilmiş ilk aşama

Önceki talep DWG kaydı + katman kalınlığı + ölçekli PDF; son talep AutoCAD Plot düzenine benzer arayüzdür. İlk aşama bunları tamamlar. Diğer yüzlerce madde tamamlanmış sayılmaz.

1. Katman kalınlığı doğrudan panelden ve katman özelliklerinden değiştirilir.
2. DWG 2000 ve DXF 2000 kalınlık/birim bilgilerini taşır. DWG yazıcısı deneysel olduğundan tüm AutoCAD dosyalarıyla eşdeğerlik garanti edilmez.
3. Plot penceresi: PDF cihazı, A0–A4/özel kâğıt, Extents/Display/Window/Selection, merkez/ofset, 1:N ölçek, açıkça seçilen Fit to paper, renk/kalınlık, yön ve kayıtlı sayfa ayarları.
4. Sığmayan çizim sessizce ölçeklenmez. PDF %100/Gerçek boyut basılmalıdır.

## Sonraki aşamalar ve kabul koşulları

| Aşama | Kapsam | Ön koşul / kabul testi |
|---|---|---|
| 2 — 0.3 teslimi | UCS, polar/ek OSNAP, analitik crossing/fence, fark tabanlı geçmiş ve uzamsal indeks eklendi. Komut oturumu temeli eklendi; tüm araçların bağımsız durum nesnelerine ayrıştırılması sürüyor. | Geometri/arayüz/çıktı regresyonları geçti; 10k/100k sentetik ölçüm kaydı var. Windows kabul testi bekliyor. |
| 3 | Eksik çizim ve düzenleme araçları; fillet/chamfer/array/join/stretch; genel trim/offset; kalıcı nesne türleri | Köşe durumları, tolerans ve dönüşüm doğruluğu; geri alma/iptal testleri |
| 4 | Nesne/katman özellikleri, metin/ölçü stilleri, ilişkili ölçüler, çok sınır tarama | DWG/DXF/PDF gidiş-dönüş ve metin/font karşılaştırması |
| 5 | Gerçek blok tanımları/örnekleri/öznitelikler, kütüphane, XREF ve altlık | Kaynak kimliği ve dönüşümlerin korunması; eksik referans raporu |
| 6 | Layout/Paper Space, çoklu viewport, CTB/STB, çok sayfa/toplu PDF ve pafta setleri | Her viewport için fiziksel baskı ölçeği ve görünürlük testleri |
| 7 | Metraj, çizelgeler, CSV/Excel; duvar/kapı/pencere/mahal/merdiven araçları | Parametrik geometri, alan hesapları ve teknik çizim testleri |
| 8 | Mobilya/parça modeli, görünüşler, kesim/kenar bant/delik listeleri | Ölçü değişim tutarlılığı ve üretim örnekleri; CNC geometrisi denetimi |
| 9 | Dinamik blok, kısıt çözücü, otomasyon/eklenti API, karşılaştırma | Güvenli API sözleşmesi ve deterministik kısıt testleri |
| 10 | Çok kullanıcı, bulut paylaşımı, web düzenleme, DGN/ileri formatlar | Ayrı hizmet/kimlik/erişim ve uygun format SDK lisansları gerekir |

## Tüm özelliklerin durumları

### 1. TEMEL ÇİZİM ARAÇLARI

| No | Özellik | Durum | Kod / kapsam | Test |
|---|---|---|---|---|
| 1.1 | LINE: Çizgi çizme. | Mevcut | app.js / core.js | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 1.2 | PLINE: Birleşik çizgi oluşturma. | Mevcut | PLINE: düz ve üç noktalı yay segmentleri; kapat/bitir/Esc, U; polyline.js | 0.4 birim/arayüz ve ilgili DWG/DXF testleri; Windows kabul testi bekliyor |
| 1.3 | CIRCLE: Daire çizme. | Mevcut | app.js / core.js | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 1.4 | ARC: Yay çizme. | Mevcut | app.js / core.js | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 1.5 | RECTANG: Dikdörtgen çizme. | Mevcut | RECTANG karşı köşesinde F8/Ortho iki ekseni tek eksene düşürmez | 0.7 geometri ve Chromium arayüz regresyonları geçti; Windows kabul testi bekliyor |
| 1.6 | POLYGON: Çokgen çizme. | Eksik | app.js / core.js | Test edilmesi gerekiyor |
| 1.7 | ELLIPSE: Elips çizme. | Eksik | app.js / core.js | Test edilmesi gerekiyor |
| 1.8 | SPLINE: Serbest eğri çizme. | Eksik | app.js / core.js | Test edilmesi gerekiyor |
| 1.9 | POINT: Nokta oluşturma. | Kısmen mevcut | app.js / core.js | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 1.10 | DONUT: İçi boş daire oluşturma. | Eksik | app.js / core.js | Test edilmesi gerekiyor |
| 1.11 | XLINE: Sonsuz çizgi oluşturma. | Eksik | app.js / core.js | Test edilmesi gerekiyor |
| 1.12 | RAY: Tek yönde sonsuz çizgi oluşturma. | Eksik | app.js / core.js | Test edilmesi gerekiyor |
| 1.13 | BOUNDARY/BPOLY: Kapalı sınır oluşturma. | Eksik | app.js / core.js | Test edilmesi gerekiyor |
| 1.14 | REGION: Kapalı geometriyi bölgeye dönüştürme. | Eksik | app.js / core.js | Test edilmesi gerekiyor |
| 1.15 | WIPEOUT: Arka planı örten alan oluşturma. | Eksik | app.js / core.js | Test edilmesi gerekiyor |
| 1.16 | REVCLOUD: Revizyon bulutu oluşturma. | Eksik | app.js / core.js | Test edilmesi gerekiyor |
| 1.17 | Hatch sınırı oluşturma. | Kısmen mevcut | app.js / core.js | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 1.18 | Geometrik nesneleri hassas koordinatlarla oluşturma. | Mevcut | app.js / core.js | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 1.19 | Çizim sırasında dinamik ölçü ve açı bilgisi gösterme. | Kısmen mevcut | F12 imleç yanında canlı X/Y veya uzunluk/açı; Tab/Enter ve sayısal kilitler; temel nokta araçları | 0.4 birim/arayüz ve ilgili DWG/DXF testleri; Windows kabul testi bekliyor |

**Kapsam notu:** Temel 2B çizim mevcut; poligon/elips/spline ve ileri sınır araçları yeni kalıcı nesne türleri gerektirir.

### 2. GEOMETRİ DÜZENLEME ARAÇLARI

| No | Özellik | Durum | Kod / kapsam | Test |
|---|---|---|---|---|
| 2.1 | MOVE: Taşıma. | Mevcut | app.js / core.js | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 2.2 | COPY: Kopyalama. | Mevcut | app.js / core.js | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 2.3 | ROTATE: Döndürme. | Mevcut | app.js / core.js | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 2.4 | SCALE: Ölçekleme. | Mevcut | app.js / core.js | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 2.5 | MIRROR: Aynalama. | Mevcut | app.js / core.js | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 2.6 | STRETCH: Germe. | Kısmen mevcut | modify.js / modify-ui.js — Germe penceresi; LINE/POLYLINE düğümleri ve ekleme/merkez/ölçü noktaları; tam içteki nesneyi taşıma. Kısmi ARC yok. | Geometri ve arayüz regresyonları geçti; Windows kabul testi bekliyor |
| 2.7 | TRIM: Kırpma. | Kısmen mevcut | LINE/ARC/CIRCLE/düz-yaylı POLYLINE; tıklama veya basılı sürükleme; sabit kesiciler; bırakınca tek Undo işlemi; görünür/kilitsiz hedefler | 0.9 hızlı geçiş, eğri polilin, Esc, Undo ve Chromium fare testleri geçti; tüm AutoCAD seçenekleri yok |
| 2.8 | EXTEND: Uzatma. | Kısmen mevcut | LINE, ARC ve açık POLYLINE ucunu en yakın uygun sınıra uzatma; farklı katmanlar | 0.7 geometri ve Chromium arayüz regresyonları geçti; Windows kabul testi bekliyor |
| 2.9 | OFFSET: Paralel kopya oluşturma. | Kısmen mevcut | app.js / core.js | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 2.10 | FILLET: Köşe yuvarlama. | Kısmen mevcut | modify.js / modify-ui.js — İki LINE ve düz kenarlı POLYLINE köşelerinde yarıçap; yay/daire çiftleri yok. | Geometri ve arayüz regresyonları geçti; Windows kabul testi bekliyor |
| 2.11 | CHAMFER: Pah kırma. | Kısmen mevcut | modify.js / modify-ui.js — İki LINE veya düz POLYLINE köşelerinde iki mesafeli pah; açı yöntemi yok. | Geometri ve arayüz regresyonları geçti; Windows kabul testi bekliyor |
| 2.12 | ARRAY: Dikdörtgensel ve dairesel dizi oluşturma. | Kısmen mevcut | modify.js / modify-ui.js — Dikdörtgensel/dairesel bağımsız kopyalar; UCS, dolum açısı, öğe döndürme. İlişkisel/path array yok. | Geometri ve arayüz regresyonları geçti; Windows kabul testi bekliyor |
| 2.13 | EXPLODE: Bileşik nesneyi parçalama. | Kısmen mevcut | Blokları bir seviye açar; polyline segmentlerini LINE/ARC olarak ayırır | 0.7 geometri ve Chromium arayüz regresyonları geçti; Windows kabul testi bekliyor |
| 2.14 | JOIN: Nesneleri birleştirme. | Kısmen mevcut | JOIN: uç bağlantılı LINE/ARC/açık polyline; tolerans; ilk nesne katmanı | 0.4 birim/arayüz ve ilgili DWG/DXF testleri; Windows kabul testi bekliyor |
| 2.15 | PEDIT: Poliline düzenleme. | Kısmen mevcut | PEDIT: UCS düğüm koordinatı, yay açısı, orta düğüm ekle/sil, aç/kapat, ters çevir; width/spline-fit yok | 0.4 birim/arayüz ve ilgili DWG/DXF testleri; Windows kabul testi bekliyor |
| 2.16 | BREAK: Nesnenin bir bölümünü koparma. | Kısmen mevcut | modify.js / modify-ui.js — LINE/ARC/CIRCLE/POLYLINE analitik parçalama; desteklenen 2B geometriyle sınırlı. | Geometri ve arayüz regresyonları geçti; Windows kabul testi bekliyor |
| 2.17 | BREAKATPOINT: Belirli noktadan ayırma. | Kısmen mevcut | modify.js / modify-ui.js — Açık LINE/ARC/POLYLINE iç noktadan ayrılır; kapalı geometride iki noktalı BREAK gerekir. | Geometri ve arayüz regresyonları geçti; Windows kabul testi bekliyor |
| 2.18 | LENGTHEN: Uzunluk değiştirme. | Kısmen mevcut | modify.js / modify-ui.js — Toplam/fark/yüzde; LINE/ARC/açık POLYLINE uç segmenti. Çoklu segment kısaltma ve dinamik sürükleme yok. | Geometri ve arayüz regresyonları geçti; Windows kabul testi bekliyor |
| 2.19 | ALIGN: Hizalama. | Eksik | app.js / core.js | Test edilmesi gerekiyor |
| 2.20 | DIVIDE: Eşit parçalara bölme. | Eksik | app.js / core.js | Test edilmesi gerekiyor |
| 2.21 | MEASURE: Belirli aralıklarla nokta veya blok yerleştirme. | Eksik | app.js / core.js | Test edilmesi gerekiyor |
| 2.22 | REVERSE: Çizim yönünü tersine çevirme. | Kısmen mevcut | PEDIT yön çevir: polyline, yay bulgeleri korunur | 0.4 birim/arayüz ve ilgili DWG/DXF testleri; Windows kabul testi bekliyor |
| 2.23 | OVERKILL: Çakışan ve tekrarlanan geometrileri temizleme. | Eksik | app.js / core.js | Test edilmesi gerekiyor |
| 2.24 | FLATTEN: Geometriyi tek düzleme indirme. | Eksik | app.js / core.js | Test edilmesi gerekiyor |
| 2.25 | DRAWORDER: Nesnelerin çizim sırasını değiştirme. | Eksik | app.js / core.js | Test edilmesi gerekiyor |
| 2.26 | Nesne uzatma, kesiştirme, birleştirme ve geometrik temizleme işlemleri. | Kısmen mevcut | app.js / core.js | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 2.27 | İşlem öncesi önizleme ve işlem sonrası doğru geometri kontrolü. | Kısmen mevcut | app.js / core.js | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |

**Kapsam notu:** TRIM çizgi/yay/daire ve düz/yaylı polilinlerde; EXTEND çizgi/yay/açık polilinlerde çalışır. Kilitli hedefler düzenlenmez. Blok içini kırpmak için önce EXPLODE gerekir. OFFSET kapsamı sınırlıdır; tüm AutoCAD seçenekleri yoktur.

### 3. KOORDİNAT VE HASSAS ÇİZİM SİSTEMİ

| No | Özellik | Durum | Kod / kapsam | Test |
|---|---|---|---|---|
| 3.1 | Mutlak koordinat girişi: X,Y. | Mevcut | app.js: snap, parsePoint | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 3.2 | Göreceli koordinat girişi: @X,Y. | Mevcut | app.js: snap, parsePoint | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 3.3 | Kutupsal koordinat girişi: @mesafe<açı. | Mevcut | app.js: snap, parsePoint | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 3.4 | Dinamik koordinat ve ölçü girişi. | Kısmen mevcut | F12: koordinat/uzunluk/açı girişleri, Tab alan geçişi, Enter nokta yerleştirme | 0.4 birim/arayüz ve ilgili DWG/DXF testleri; Windows kabul testi bekliyor |
| 3.5 | X ve Y eksenlerini ayrı ayrı kilitleme. | Mevcut | DSETTINGS: UCS X veya Y ekseni kilidi | 0.3 geometri/arayüz veya sentetik benchmark doğrulandı; Windows kabul testi bekliyor |
| 3.6 | Ortho: Yatay ve düşey çizim kısıtlaması. | Mevcut | F8 Ortho; RECTANG karşı köşesi iki eksende serbest kalır | 0.7 geometri ve Chromium arayüz regresyonları geçti; Windows kabul testi bekliyor |
| 3.7 | Polar Tracking: Belirli açılara göre çizim. | Mevcut | F10; 1–180° adım, 4° tolerans; UCS yönü; F8 ile karşılıklı dışlama | 0.3 geometri/arayüz veya sentetik benchmark doğrulandı; Windows kabul testi bekliyor |
| 3.8 | Object Snap (OSNAP): Geometrik noktalara hassas yakalama. | Kısmen mevcut | app.js: snap, parsePoint | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 3.9 | Endpoint: Uç nokta yakalama. | Mevcut | app.js: snap, parsePoint | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 3.10 | Midpoint: Orta nokta yakalama. | Mevcut | app.js: snap, parsePoint | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 3.11 | Center: Merkez yakalama. | Mevcut | app.js: snap, parsePoint | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 3.12 | Geometric Center: Geometrik merkez yakalama. | Kısmen mevcut | Kapalı, düz kenarlı polilinin alan ağırlıklı merkezi; bulgeli sınır merkezi yok | 0.3 geometri/arayüz veya sentetik benchmark doğrulandı; Windows kabul testi bekliyor |
| 3.13 | Node: Nokta yakalama. | Mevcut | POINT yakalama; precision.js | 0.3 geometri/arayüz veya sentetik benchmark doğrulandı; Windows kabul testi bekliyor |
| 3.14 | Quadrant: Daire çeyrek noktalarını yakalama. | Mevcut | app.js: snap, parsePoint | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 3.15 | Intersection: Kesişim noktası yakalama. | Mevcut | LINE/ARC/CIRCLE ve bulgeli polilin kesişimleri; 2B | 0.3 geometri/arayüz veya sentetik benchmark doğrulandı; Windows kabul testi bekliyor |
| 3.16 | Apparent Intersection: Görünür kesişim yakalama. | Eksik | app.js: snap, parsePoint | Test edilmesi gerekiyor |
| 3.17 | Perpendicular: Dik yakalama. | Mevcut | Başlangıçtan çizgi parçasına veya daire/yaya dik izdüşüm | 0.3 geometri/arayüz veya sentetik benchmark doğrulandı; Windows kabul testi bekliyor |
| 3.18 | Tangent: Teğet yakalama. | Mevcut | Dış başlangıç noktasından daire/yaya teğet | 0.3 geometri/arayüz veya sentetik benchmark doğrulandı; Windows kabul testi bekliyor |
| 3.19 | Nearest: En yakın nokta yakalama. | Mevcut | Çizgi/yay/daire/polilin üzerinde analitik en yakın nokta | 0.3 geometri/arayüz veya sentetik benchmark doğrulandı; Windows kabul testi bekliyor |
| 3.20 | Parallel: Paralel yakalama. | Eksik | app.js: snap, parsePoint | Test edilmesi gerekiyor |
| 3.21 | Extension: Uzantı yakalama. | Eksik | app.js: snap, parsePoint | Test edilmesi gerekiyor |
| 3.22 | Insertion: Yerleştirme noktası yakalama. | Mevcut | app.js: snap, parsePoint | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 3.23 | Geçici izleme noktaları ve nesne yakalama filtreleri. | Kısmen mevcut | Yakalama türü filtreleri eklendi; geçici izleme noktaları yok | 0.3 geometri/arayüz veya sentetik benchmark doğrulandı; Windows kabul testi bekliyor |
| 3.24 | Grid: Izgara gösterimi. | Mevcut | app.js: snap, parsePoint | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 3.25 | Snap: İmleç adım aralığı. | Mevcut | app.js: snap, parsePoint | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 3.26 | Kullanıcı koordinat sistemi ve dünya koordinat sistemi. | Mevcut | 2B UCS/WCS; başlangıç ve açı; mutlak/göreli/polar giriş; HCAD kaydı | 0.3 geometri/arayüz veya sentetik benchmark doğrulandı; Windows kabul testi bekliyor |
| 3.27 | Koordinat başlangıç noktasını değiştirme. | Mevcut | UCS başlangıcını dünya koordinatlarıyla ayarla; geometri yer değiştirmez | 0.3 geometri/arayüz veya sentetik benchmark doğrulandı; Windows kabul testi bekliyor |
| 3.28 | Milimetre, santimetre, metre, inç ve feet birimleri. | Mevcut | app.js: snap, parsePoint | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 3.29 | Ondalık hassasiyet ve açı ölçüm ayarları. | Kısmen mevcut | app.js: snap, parsePoint | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 3.30 | Çizim sınırları ve imleç hassasiyeti. | Eksik | app.js: snap, parsePoint | Test edilmesi gerekiyor |
| 3.31 | Yakalama ve seçim toleransları. | Kısmen mevcut | app.js: snap, parsePoint | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 3.32 | Çizim birimi değiştirildiğinde geometrinin doğru korunması. | Kısmen mevcut | app.js: snap, parsePoint | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |

**Kapsam notu:** UCS, polar, nokta/kesişim/dik/teğet/en yakın ve düz kapalı polilin merkezi eklendi. Paralel/uzantı/görünür kesişim ve geçici izleme noktaları eksik. Birim etiketi değişir, otomatik yeniden ölçekleme yok.

### 4. NESNE SEÇİM SİSTEMİ

| No | Özellik | Durum | Kod / kapsam | Test |
|---|---|---|---|---|
| 4.1 | Tek tıklamayla nesne seçme. | Mevcut | app.js: pick, pointer handlers | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 4.2 | Window Selection: Pencere içindeki nesneleri seçme. | Mevcut | app.js: pick, pointer handlers | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 4.3 | Crossing Selection: Pencereyle kesişen nesneleri seçme. | Mevcut | Çizgi/daire/yay/bulge için gerçek geometri; yazılar tahmini döndürülmüş metin kutusu | 0.3 geometri/arayüz veya sentetik benchmark doğrulandı; Windows kabul testi bekliyor |
| 4.4 | Window Polygon ve Crossing Polygon. | Eksik | app.js: pick, pointer handlers | Test edilmesi gerekiyor |
| 4.5 | Fence: Çizgisel seçim. | Mevcut | FENCE: çok noktalı çit; Enter ile seç; kilit/görünürlük filtresi | 0.3 geometri/arayüz veya sentetik benchmark doğrulandı; Windows kabul testi bekliyor |
| 4.6 | Lasso: Serbest biçimli seçim. | Eksik | app.js: pick, pointer handlers | Test edilmesi gerekiyor |
| 4.7 | Shift ile seçime ekleme ve seçimden çıkarma. | Mevcut | app.js: pick, pointer handlers | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 4.8 | Önceki seçim setini geri çağırma. | Mevcut | SELECTPREVIOUS / P: önceki seçim; geçersiz, gizli ve kilitli kayıtlar elenir | 0.3 geometri/arayüz veya sentetik benchmark doğrulandı; Windows kabul testi bekliyor |
| 4.9 | Son oluşturulan nesneyi seçme. | Mevcut | SELECTLAST / LAST: son oluşturulan nesne | 0.3 geometri/arayüz veya sentetik benchmark doğrulandı; Windows kabul testi bekliyor |
| 4.10 | Tüm nesneleri seçme. | Mevcut | app.js: pick, pointer handlers | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 4.11 | Benzer nesneleri seçme. | Eksik | app.js: pick, pointer handlers | Test edilmesi gerekiyor |
| 4.12 | Nesne türüne göre filtreleme. | Eksik | app.js: pick, pointer handlers | Test edilmesi gerekiyor |
| 4.13 | Katman, renk, çizgi tipi ve özelliklere göre filtreleme. | Eksik | app.js: pick, pointer handlers | Test edilmesi gerekiyor |
| 4.14 | Blok içindeki nesneleri seçme. | Eksik | app.js: pick, pointer handlers | Test edilmesi gerekiyor |
| 4.15 | Üst üste gelen nesneler arasında seçim yapma. | Eksik | app.js: pick, pointer handlers | Test edilmesi gerekiyor |
| 4.16 | Seçili nesneleri vurgulama. | Mevcut | app.js: pick, pointer handlers | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 4.17 | Seçim önizlemesi. | Eksik | app.js: pick, pointer handlers | Test edilmesi gerekiyor |
| 4.18 | Komutlar arasında seçim setini koruma. | Kısmen mevcut | app.js: pick, pointer handlers | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 4.19 | Büyük çizimlerde hızlı ve kararlı seçim. | Kısmen mevcut | Uzamsal aday sorgusu; 100k sentetik LINE ölçüldü; yoğun kesişim ve gerçek büyük DWG profili bekliyor | 0.3 geometri/arayüz veya sentetik benchmark doğrulandı; Windows kabul testi bekliyor |

**Kapsam notu:** Crossing analitik geometriye geçti; Fence, önceki ve son seçim eklendi. Poligon/lasso/çakışma döngüsü yok. Yazı seçimi tahmini metin kutusunu kullanır.

### 5. KATMAN VE NESNE ÖZELLİKLERİ

| No | Özellik | Durum | Kod / kapsam | Test |
|---|---|---|---|---|
| 5.1 | Katman oluşturma, silme ve yeniden adlandırma. | Mevcut | app.js: renderLayers, editLayer; dxf-modern.js | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 5.2 | Katman rengi, çizgi tipi, çizgi kalınlığı ve saydamlığı. | Kısmen mevcut | app.js: renderLayers, editLayer; dxf-modern.js | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 5.3 | Katman açma ve kapatma. | Mevcut | app.js: renderLayers, editLayer; dxf-modern.js | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 5.4 | Katman dondurma ve çözme. | Eksik | app.js: renderLayers, editLayer; dxf-modern.js | Test edilmesi gerekiyor |
| 5.5 | Katman kilitleme ve kilidi açma. | Mevcut | app.js: renderLayers, editLayer; dxf-modern.js | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 5.6 | Geçerli katman belirleme. | Mevcut | app.js: renderLayers, editLayer; dxf-modern.js | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 5.7 | Nesneleri başka katmana taşıma. | Mevcut | app.js: renderLayers, editLayer; dxf-modern.js | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 5.8 | Katmanları birleştirme. | Eksik | app.js: renderLayers, editLayer; dxf-modern.js | Test edilmesi gerekiyor |
| 5.9 | Katman özelliklerini kopyalama. | Eksik | app.js: renderLayers, editLayer; dxf-modern.js | Test edilmesi gerekiyor |
| 5.10 | Katman filtreleri ve katman grupları. | Eksik | app.js: renderLayers, editLayer; dxf-modern.js | Test edilmesi gerekiyor |
| 5.11 | Katman durumlarını kaydetme ve geri yükleme. | Eksik | app.js: renderLayers, editLayer; dxf-modern.js | Test edilmesi gerekiyor |
| 5.12 | Viewport'a özel katman görünürlüğü. | Eksik | app.js: renderLayers, editLayer; dxf-modern.js | Test edilmesi gerekiyor |
| 5.13 | ByLayer, ByBlock ve doğrudan nesne özellikleri. | Kısmen mevcut | app.js: renderLayers, editLayer; dxf-modern.js | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 5.14 | Toplu nesne özelliklerini değiştirme. | Kısmen mevcut | app.js: renderLayers, editLayer; dxf-modern.js | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 5.15 | Properties paneli ve Quick Properties. | Kısmen mevcut | app.js: renderLayers, editLayer; dxf-modern.js | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 5.16 | Match Properties: Özellik eşleştirme. | Eksik | app.js: renderLayers, editLayer; dxf-modern.js | Test edilmesi gerekiyor |
| 5.17 | Çizgi tipi ölçeği ve global çizgi tipi ölçeği. | Eksik | app.js: renderLayers, editLayer; dxf-modern.js | Test edilmesi gerekiyor |
| 5.18 | Baskıda çizgi kalınlığı görüntüleme. | Kısmen mevcut | app.js: renderLayers, editLayer; dxf-modern.js | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 5.19 | Renk, katman ve çizgi tipine göre nesne listeleme. | Eksik | app.js: renderLayers, editLayer; dxf-modern.js | Test edilmesi gerekiyor |
| 5.20 | Katmanları projeye göre gruplandırma ve yönetme. | Eksik | app.js: renderLayers, editLayer; dxf-modern.js | Test edilmesi gerekiyor |

**Kapsam notu:** Kalınlık, renk, kilit ve görünürlük var. Saydamlık, dondurma, gruplar, durumlar, viewport ve CTB/STB yok.

### 6. BLOK VE TEKRAR KULLANILABİLİR NESNELER

| No | Özellik | Durum | Kod / kapsam | Test |
|---|---|---|---|---|
| 6.1 | Blok oluşturma ve blok ekleme. | Kısmen mevcut | BLOCK seçili nesnelerden isim/taban noktası ile statik blok oluşturur; içe alınan INSERT korunur; blok ekleme kütüphanesi yok | 0.7 geometri ve Chromium arayüz regresyonları geçti; Windows kabul testi bekliyor |
| 6.2 | Blok taşıma, döndürme ve ölçekleme. | Mevcut | Statik ve iç içe bloklar tek nesne olarak taşınır, döndürülür ve ölçeklenir | 0.7 geometri ve Chromium arayüz regresyonları geçti; Windows kabul testi bekliyor |
| 6.3 | Blok patlatma. | Mevcut | EXPLODE blokları bir seviye açar, alt blokları korur | 0.7 geometri ve Chromium arayüz regresyonları geçti; Windows kabul testi bekliyor |
| 6.4 | Blok düzenleyicisi. | Eksik | Statik blok modeli var; bu özellik henüz uygulanmadı | Test edilmesi gerekiyor |
| 6.5 | Blok taban noktası belirleme. | Kısmen mevcut | Yeni BLOCK oluştururken taban noktası belirlenir; paylaşımlı tanım düzenleyicisi yok | 0.7 geometri ve Chromium arayüz regresyonları geçti; Windows kabul testi bekliyor |
| 6.6 | Blok içerisinde farklı katmanlarda nesneler kullanma. | Mevcut | Blok üyelerinin katmanları ve üst blok görünürlük zinciri korunur | 0.7 geometri ve Chromium arayüz regresyonları geçti; Windows kabul testi bekliyor |
| 6.7 | Bloklara öznitelik ekleme. | Eksik | Statik blok modeli var; bu özellik henüz uygulanmadı | Test edilmesi gerekiyor |
| 6.8 | Attribute Definition ve Attribute Editor. | Eksik | Statik blok modeli var; bu özellik henüz uygulanmadı | Test edilmesi gerekiyor |
| 6.9 | Blok özniteliklerini dışa aktarma. | Eksik | Statik blok modeli var; bu özellik henüz uygulanmadı | Test edilmesi gerekiyor |
| 6.10 | Harici dosyadan blok ekleme. | Eksik | Statik blok modeli var; bu özellik henüz uygulanmadı | Test edilmesi gerekiyor |
| 6.11 | Blok kütüphanesi oluşturma. | Eksik | Statik blok modeli var; bu özellik henüz uygulanmadı | Test edilmesi gerekiyor |
| 6.12 | Blok arama ve önizleme. | Eksik | Statik blok modeli var; bu özellik henüz uygulanmadı | Test edilmesi gerekiyor |
| 6.13 | Dinamik bloklar. | Eksik | Statik blok modeli var; bu özellik henüz uygulanmadı | Test edilmesi gerekiyor |
| 6.14 | Bloklarda görünürlük durumları. | Eksik | Statik blok modeli var; bu özellik henüz uygulanmadı | Test edilmesi gerekiyor |
| 6.15 | Blok parametreleri ve eylemleri. | Eksik | Statik blok modeli var; bu özellik henüz uygulanmadı | Test edilmesi gerekiyor |
| 6.16 | Blok içeriğini değiştirme ve blokları yeniden tanımlama. | Eksik | Statik blok modeli var; bu özellik henüz uygulanmadı | Test edilmesi gerekiyor |
| 6.17 | Yinelenen blokları bulma. | Eksik | Statik blok modeli var; bu özellik henüz uygulanmadı | Test edilmesi gerekiyor |
| 6.18 | Akıllı blok yerleştirme ve dönüştürme. | Eksik | Statik blok modeli var; bu özellik henüz uygulanmadı | Test edilmesi gerekiyor |
| 6.19 | Mobilya, kapı, pencere, tesisat ve mimari sembol kütüphaneleri. | Eksik | Statik blok modeli var; bu özellik henüz uygulanmadı | Test edilmesi gerekiyor |

**Kapsam notu:** İçe alınan statik bloklar ve iç içe bloklar tek seçilebilir nesne olarak korunur. DWG/DXF dışa aktarımında BLOCK_RECORD/BLOCK/INSERT üretilir. Her örnek ayrı tanım kullanır; paylaşımlı tanım düzenleme, dinamik blok ve öznitelik düzenleme yoktur. ATTRIB değerleri sade yazıya dönüşür.

### 7. ÖLÇÜLENDİRME SİSTEMİ

| No | Özellik | Durum | Kod / kapsam | Test |
|---|---|---|---|---|
| 7.1 | Linear Dimension: Yatay ve düşey ölçülendirme. | Eksik | core.js: dimensionParts; app.js | Test edilmesi gerekiyor |
| 7.2 | Aligned Dimension: Eğik kenara paralel ölçülendirme. | Mevcut | core.js: dimensionParts; app.js | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 7.3 | Angular Dimension: Açı ölçüsü. | Eksik | core.js: dimensionParts; app.js | Test edilmesi gerekiyor |
| 7.4 | Radius Dimension: Yarıçap ölçüsü. | Eksik | core.js: dimensionParts; app.js | Test edilmesi gerekiyor |
| 7.5 | Diameter Dimension: Çap ölçüsü. | Eksik | core.js: dimensionParts; app.js | Test edilmesi gerekiyor |
| 7.6 | Arc Length Dimension: Yay uzunluğu ölçüsü. | Eksik | core.js: dimensionParts; app.js | Test edilmesi gerekiyor |
| 7.7 | Ordinate Dimension: Koordinat ölçülendirme. | Eksik | core.js: dimensionParts; app.js | Test edilmesi gerekiyor |
| 7.8 | Baseline Dimension: Ortak başlangıçlı ölçüler. | Eksik | core.js: dimensionParts; app.js | Test edilmesi gerekiyor |
| 7.9 | Continued Dimension: Zincir ölçülendirme. | Eksik | core.js: dimensionParts; app.js | Test edilmesi gerekiyor |
| 7.10 | Jogged Dimension: Kırıklı yarıçap ölçüsü. | Eksik | core.js: dimensionParts; app.js | Test edilmesi gerekiyor |
| 7.11 | Center Mark: Merkez işareti. | Eksik | core.js: dimensionParts; app.js | Test edilmesi gerekiyor |
| 7.12 | Centerline: Merkez çizgisi. | Eksik | core.js: dimensionParts; app.js | Test edilmesi gerekiyor |
| 7.13 | Leader ve Multileader: Açıklama çizgileri. | Eksik | core.js: dimensionParts; app.js | Test edilmesi gerekiyor |
| 7.14 | Otomatik ölçülendirme. | Eksik | core.js: dimensionParts; app.js | Test edilmesi gerekiyor |
| 7.15 | Ölçü metninin konumunu değiştirme. | Eksik | core.js: dimensionParts; app.js | Test edilmesi gerekiyor |
| 7.16 | Ölçü çizgilerini ve uzatma çizgilerini düzenleme. | Eksik | core.js: dimensionParts; app.js | Test edilmesi gerekiyor |
| 7.17 | Ölçü metnini elle değiştirme. | Eksik | core.js: dimensionParts; app.js | Test edilmesi gerekiyor |
| 7.18 | Ölçü metni ön eki ve son eki. | Eksik | core.js: dimensionParts; app.js | Test edilmesi gerekiyor |
| 7.19 | Ondalık hassasiyet ve yuvarlama. | Eksik | core.js: dimensionParts; app.js | Test edilmesi gerekiyor |
| 7.20 | Ölçü toleransları. | Eksik | core.js: dimensionParts; app.js | Test edilmesi gerekiyor |
| 7.21 | Birincil ve alternatif birimler. | Eksik | core.js: dimensionParts; app.js | Test edilmesi gerekiyor |
| 7.22 | Annotative ölçülendirme. | Eksik | core.js: dimensionParts; app.js | Test edilmesi gerekiyor |
| 7.23 | Ölçü stili oluşturma ve kaydetme. | Eksik | core.js: dimensionParts; app.js | Test edilmesi gerekiyor |
| 7.24 | Ok başı tipi ve boyutu. | Eksik | core.js: dimensionParts; app.js | Test edilmesi gerekiyor |
| 7.25 | Ölçü çizgisi, uzatma çizgisi, metin ve aralık ayarları. | Eksik | core.js: dimensionParts; app.js | Test edilmesi gerekiyor |
| 7.26 | Çakışan ölçüleri düzenleme. | Eksik | core.js: dimensionParts; app.js | Test edilmesi gerekiyor |
| 7.27 | Ölçüleri geometriye ilişkilendirme. | Eksik | core.js: dimensionParts; app.js | Test edilmesi gerekiyor |
| 7.28 | Geometri değiştiğinde ilişkili ölçüleri güncelleme. | Eksik | core.js: dimensionParts; app.js | Test edilmesi gerekiyor |
| 7.29 | Ölçülerin baskı ölçeğine uygun görüntülenmesi. | Kısmen mevcut | core.js: dimensionParts; app.js | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |

**Kapsam notu:** Yalnızca hizalı temel ölçü var. Geometriye ilişkili değildir; DWG/DXF aktarımında çizgi+yazıya ayrılır.

### 8. METİN VE AÇIKLAMA ARAÇLARI

| No | Özellik | Durum | Kod / kapsam | Test |
|---|---|---|---|---|
| 8.1 | TEXT: Tek satırlı metin. | Mevcut | app.js / io.js / pdf-export.cjs | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 8.2 | MTEXT: Çok satırlı metin. | Eksik | app.js / io.js / pdf-export.cjs | Test edilmesi gerekiyor |
| 8.3 | Yazı tipi seçimi. | Eksik | app.js / io.js / pdf-export.cjs | Test edilmesi gerekiyor |
| 8.4 | SHX ve TrueType yazı tipi desteği. | Bağımlılık gerektiriyor | app.js / io.js / pdf-export.cjs | Test edilmesi gerekiyor |
| 8.5 | Yazı yüksekliği, genişliği ve döndürme. | Eksik | app.js / io.js / pdf-export.cjs | Test edilmesi gerekiyor |
| 8.6 | Kalın, italik ve altı çizili metin. | Eksik | app.js / io.js / pdf-export.cjs | Test edilmesi gerekiyor |
| 8.7 | Metin hizalama ve paragraf ayarları. | Eksik | app.js / io.js / pdf-export.cjs | Test edilmesi gerekiyor |
| 8.8 | Satır aralığı ve sütunlu metin. | Eksik | app.js / io.js / pdf-export.cjs | Test edilmesi gerekiyor |
| 8.9 | Metin çerçevesi. | Eksik | app.js / io.js / pdf-export.cjs | Test edilmesi gerekiyor |
| 8.10 | Metin arama ve değiştirme. | Eksik | app.js / io.js / pdf-export.cjs | Test edilmesi gerekiyor |
| 8.11 | Alanlar (Fields): Otomatik güncellenen metinler. | Eksik | app.js / io.js / pdf-export.cjs | Test edilmesi gerekiyor |
| 8.12 | Tarih, dosya adı ve sayfa numarası alanları. | Eksik | app.js / io.js / pdf-export.cjs | Test edilmesi gerekiyor |
| 8.13 | Teknik semboller ve tolerans gösterimleri. | Eksik | app.js / io.js / pdf-export.cjs | Test edilmesi gerekiyor |
| 8.14 | Kesit, görünüş ve detay etiketleri. | Eksik | app.js / io.js / pdf-export.cjs | Test edilmesi gerekiyor |
| 8.15 | Balon numaraları. | Eksik | app.js / io.js / pdf-export.cjs | Test edilmesi gerekiyor |
| 8.16 | Revizyon bulutları ve açıklamaları. | Eksik | app.js / io.js / pdf-export.cjs | Test edilmesi gerekiyor |
| 8.17 | Yazım denetimi. | Eksik | app.js / io.js / pdf-export.cjs | Test edilmesi gerekiyor |
| 8.18 | Metin stilleri. | Eksik | app.js / io.js / pdf-export.cjs | Test edilmesi gerekiyor |
| 8.19 | Annotative metin. | Eksik | app.js / io.js / pdf-export.cjs | Test edilmesi gerekiyor |
| 8.20 | Ölçeğe göre metin görüntüleme. | Eksik | app.js / io.js / pdf-export.cjs | Test edilmesi gerekiyor |
| 8.21 | Türkçe karakterleri doğru destekleme. | Kısmen mevcut | app.js / io.js / pdf-export.cjs | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 8.22 | Metinlerin dosya aktarımında ve PDF çıktısında bozulmamasını sağlama. | Kısmen mevcut | app.js / io.js / pdf-export.cjs | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |

**Kapsam notu:** Temel metin ve PDF gömülü TrueType/Türkçe var; SHX, biçimlendirme ve metin stilleri yok.

### 9. TARAMA VE DOLGU SİSTEMİ

| No | Özellik | Durum | Kod / kapsam | Test |
|---|---|---|---|---|
| 9.1 | Kapalı alanı otomatik algılama. | Eksik | io.js: hatchLines; app.js | Test edilmesi gerekiyor |
| 9.2 | Alan tarama. | Kısmen mevcut | io.js: hatchLines; app.js | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 9.3 | Solid: Katı dolgu. | Eksik | io.js: hatchLines; app.js | Test edilmesi gerekiyor |
| 9.4 | ANSI ve ISO tarama desenleri. | Eksik | io.js: hatchLines; app.js | Test edilmesi gerekiyor |
| 9.5 | Ahşap, beton, taş ve çeşitli malzeme desenleri. | Eksik | io.js: hatchLines; app.js | Test edilmesi gerekiyor |
| 9.6 | Tarama açısı, ölçeği ve başlangıç noktası. | Eksik | io.js: hatchLines; app.js | Test edilmesi gerekiyor |
| 9.7 | Desen aralığı ayarları. | Kısmen mevcut | io.js: hatchLines; app.js | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 9.8 | Tarama sınırlarını düzenleme. | Eksik | io.js: hatchLines; app.js | Test edilmesi gerekiyor |
| 9.9 | Tarama sınırlarını yeniden oluşturma. | Eksik | io.js: hatchLines; app.js | Test edilmesi gerekiyor |
| 9.10 | Tarama ve sınır geometrisi arasındaki ilişkiyi koruma. | Eksik | io.js: hatchLines; app.js | Test edilmesi gerekiyor |
| 9.11 | Tarama önizlemesi. | Kısmen mevcut | io.js: hatchLines; app.js | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 9.12 | Saydam taramalar. | Eksik | io.js: hatchLines; app.js | Test edilmesi gerekiyor |
| 9.13 | Gradyan dolgu. | Eksik | io.js: hatchLines; app.js | Test edilmesi gerekiyor |
| 9.14 | Tarama alanını hesaplama. | Kısmen mevcut | io.js: hatchLines; app.js | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 9.15 | Tarama desenlerini içe aktarma. | Eksik | io.js: hatchLines; app.js | Test edilmesi gerekiyor |
| 9.16 | Tarama nesnelerinin çizim sırasını değiştirme. | Eksik | io.js: hatchLines; app.js | Test edilmesi gerekiyor |
| 9.17 | Karmaşık ve çok parçalı kapalı alanları doğru tarama. | Eksik | io.js: hatchLines; app.js | Test edilmesi gerekiyor |
| 9.18 | Geçersiz veya açık sınırları kullanıcıya bildirme. | Kısmen mevcut | io.js: hatchLines; app.js | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |

**Kapsam notu:** Kapalı poliline sabit 45° tarama var; delik, desen dosyası, gradyan ve karmaşık sınır motoru yok.

### 10. GÖRÜNÜM VE ÇALIŞMA ALANI

| No | Özellik | Durum | Kod / kapsam | Test |
|---|---|---|---|---|
| 10.1 | Fare tekerleğiyle yakınlaştırma ve uzaklaştırma. | Mevcut | app.js: view, render, zoom | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 10.2 | Pan: Görünümü kaydırma. | Mevcut | app.js: view, render, zoom | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 10.3 | Zoom Extents: Tüm çizimi ekrana sığdırma. | Mevcut | app.js: view, render, zoom | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 10.4 | Zoom Window: Belirli alanı yakınlaştırma. | Eksik | app.js: view, render, zoom | Test edilmesi gerekiyor |
| 10.5 | Zoom Previous: Önceki görünüme dönme. | Eksik | app.js: view, render, zoom | Test edilmesi gerekiyor |
| 10.6 | Görünüm merkezi ve ölçeğini kontrol etme. | Kısmen mevcut | app.js: view, render, zoom | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 10.7 | Adlandırılmış görünümler. | Eksik | app.js: view, render, zoom | Test edilmesi gerekiyor |
| 10.8 | Model Space. | Mevcut | app.js: view, render, zoom | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 10.9 | Paper Space. | Eksik | app.js: view, render, zoom | Test edilmesi gerekiyor |
| 10.10 | Birden fazla viewport. | Eksik | app.js: view, render, zoom | Test edilmesi gerekiyor |
| 10.11 | Viewport ölçeklendirme ve kilitleme. | Eksik | app.js: view, render, zoom | Test edilmesi gerekiyor |
| 10.12 | Viewport'a özel katman görünürlüğü. | Eksik | app.js: view, render, zoom | Test edilmesi gerekiyor |
| 10.13 | Çizim sekmeleri. | Mevcut | document-tabs.js: bağımsız çizim, katman, görünüm, Undo/Redo, Ctrl+Tab, Ctrl+W | 0.9 Chromium arayüz testi geçti; Windows kabul testi bekliyor |
| 10.14 | Tam ekran çizim alanı. | Eksik | app.js: view, render, zoom | Test edilmesi gerekiyor |
| 10.15 | Koyu ve açık tema. | Eksik | app.js: view, render, zoom | Test edilmesi gerekiyor |
| 10.16 | Izgara ve imleç görünümü ayarları. | Eksik | app.js: view, render, zoom | Test edilmesi gerekiyor |
| 10.17 | Görünürlük ve performans ayarları. | Eksik | app.js: view, render, zoom | Test edilmesi gerekiyor |
| 10.18 | Yeniden çizim ve ekran yenileme. | Kısmen mevcut | app.js: view, render, zoom | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 10.19 | Büyük çizimlerde akıcı yakınlaştırma. | Kısmen mevcut | Görüş alanı dışı nesneler indeksle elenir; tüm çizim görünürken LOD yok | 0.3 geometri/arayüz veya sentetik benchmark doğrulandı; Windows kabul testi bekliyor |
| 10.20 | Birden fazla açık çizim arasında geçiş. | Eksik | app.js: view, render, zoom | Test edilmesi gerekiyor |
| 10.21 | Çizim alanında nesne seçimi, taşıma ve yakınlaştırmanın birbiriyle çakışmaması. | Kısmen mevcut | app.js: view, render, zoom | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |

**Kapsam notu:** Birden çok bağımsız belge sekmesi vardır; her belgede model alanı kullanılır. Layout, bölünmüş viewport ve adlandırılmış görünüm henüz yok.

### 11. HARİCİ REFERANSLAR VE NESNE ORGANİZASYONU

| No | Özellik | Durum | Kod / kapsam | Test |
|---|---|---|---|---|
| 11.1 | Gruplar oluşturma ve çözme. | Eksik | io.js: importDrawing | Test edilmesi gerekiyor |
| 11.2 | Xref: Harici çizim referansları. | Eksik | io.js: importDrawing | Test edilmesi gerekiyor |
| 11.3 | Xref ekleme, bağlama ve kaldırma. | Eksik | io.js: importDrawing | Test edilmesi gerekiyor |
| 11.4 | Xref dosya yollarını değiştirme ve yeniden bağlama. | Eksik | io.js: importDrawing | Test edilmesi gerekiyor |
| 11.5 | Xref katmanlarını yönetme. | Eksik | io.js: importDrawing | Test edilmesi gerekiyor |
| 11.6 | PDF altlığı ekleme. | Eksik | io.js: importDrawing | Test edilmesi gerekiyor |
| 11.7 | Görsel dosyası altlığı ekleme. | Eksik | io.js: importDrawing | Test edilmesi gerekiyor |
| 11.8 | DGN altlığı desteği. | Bağımlılık gerektiriyor | io.js: importDrawing | Test edilmesi gerekiyor |
| 11.9 | Raster görselleri döndürme, ölçekleme ve hizalama. | Eksik | io.js: importDrawing | Test edilmesi gerekiyor |
| 11.10 | Altlık saydamlığını ayarlama. | Eksik | io.js: importDrawing | Test edilmesi gerekiyor |
| 11.11 | Altlık kırpma sınırları. | Eksik | io.js: importDrawing | Test edilmesi gerekiyor |
| 11.12 | Altlıkları gösterme ve gizleme. | Eksik | io.js: importDrawing | Test edilmesi gerekiyor |
| 11.13 | Nesneleri gruplandırma. | Eksik | io.js: importDrawing | Test edilmesi gerekiyor |
| 11.14 | Nesneleri izole etme ve gizleme. | Eksik | io.js: importDrawing | Test edilmesi gerekiyor |
| 11.15 | Nesne kimliği ve metadata. | Kısmen mevcut | io.js: importDrawing | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 11.16 | Harici dosyalardan geometri içe aktarma. | Kısmen mevcut | io.js: importDrawing | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 11.17 | Eksik referansları tespit etme. | Eksik | io.js: importDrawing | Test edilmesi gerekiyor |
| 11.18 | Referans dosyalarının yollarını yönetme. | Eksik | io.js: importDrawing | Test edilmesi gerekiyor |

**Kapsam notu:** DWG/DXF desteklenen geometri içe aktarılır; canlı XREF veya altlık sistemi yok.

### 12. ALAN, METRAJ, TABLO VE VERİ ÇIKARMA

| No | Özellik | Durum | Kod / kapsam | Test |
|---|---|---|---|---|
| 12.1 | Alan ve çevre hesaplama. | Kısmen mevcut | app.js: renderProps, measure | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 12.2 | Kapalı poliline alanı hesaplama. | Mevcut | app.js: renderProps, measure | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 12.3 | Birden fazla alanı toplama. | Eksik | app.js: renderProps, measure | Test edilmesi gerekiyor |
| 12.4 | Metrekare ve santimetrekare dönüşümleri. | Eksik | app.js: renderProps, measure | Test edilmesi gerekiyor |
| 12.5 | Nesne sayımı. | Kısmen mevcut | app.js: renderProps, measure | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 12.6 | Blok sayımı. | Eksik | app.js: renderProps, measure | Test edilmesi gerekiyor |
| 12.7 | Blok özniteliklerini listeleme. | Eksik | app.js: renderProps, measure | Test edilmesi gerekiyor |
| 12.8 | Çizimden metraj çıkarma. | Eksik | app.js: renderProps, measure | Test edilmesi gerekiyor |
| 12.9 | Nesne özelliklerinden tablo oluşturma. | Eksik | app.js: renderProps, measure | Test edilmesi gerekiyor |
| 12.10 | Tablo hücrelerini düzenleme. | Eksik | app.js: renderProps, measure | Test edilmesi gerekiyor |
| 12.11 | Satır ve sütun ekleme. | Eksik | app.js: renderProps, measure | Test edilmesi gerekiyor |
| 12.12 | Hücre birleştirme. | Eksik | app.js: renderProps, measure | Test edilmesi gerekiyor |
| 12.13 | Tablo stilleri. | Eksik | app.js: renderProps, measure | Test edilmesi gerekiyor |
| 12.14 | Excel ile veri bağlantısı. | Bağımlılık gerektiriyor | app.js: renderProps, measure | Test edilmesi gerekiyor |
| 12.15 | CSV ve TXT dışa aktarma. | Eksik | app.js: renderProps, measure | Test edilmesi gerekiyor |
| 12.16 | Verileri filtreleme ve sıralama. | Eksik | app.js: renderProps, measure | Test edilmesi gerekiyor |
| 12.17 | Mahal listesi oluşturma. | Eksik | app.js: renderProps, measure | Test edilmesi gerekiyor |
| 12.18 | Kapı ve pencere çizelgesi oluşturma. | Eksik | app.js: renderProps, measure | Test edilmesi gerekiyor |
| 12.19 | Malzeme miktarlarını raporlama. | Eksik | app.js: renderProps, measure | Test edilmesi gerekiyor |
| 12.20 | Çizgi uzunluklarının toplamını hesaplama. | Eksik | app.js: renderProps, measure | Test edilmesi gerekiyor |
| 12.21 | Katman bazında metraj alma. | Eksik | app.js: renderProps, measure | Test edilmesi gerekiyor |
| 12.22 | Seçili nesnelerin alan ve uzunluklarını raporlama. | Eksik | app.js: renderProps, measure | Test edilmesi gerekiyor |
| 12.23 | Sonuçları kopyalama veya dosyaya aktarma. | Eksik | app.js: renderProps, measure | Test edilmesi gerekiyor |

**Kapsam notu:** Tek kapalı çoklu çizgi alanı, mesafe ve toplam nesne sayısı var; çizelge/metraj modülü yok.

### 13. PAFTA VE BASKI SİSTEMİ

| No | Özellik | Durum | Kod / kapsam | Test |
|---|---|---|---|---|
| 13.1 | Layout ve Paper Space oluşturma. | Eksik | plot.js / pdf-export.cjs / app.js: plotDialog | Test edilmesi gerekiyor |
| 13.2 | A0, A1, A2, A3 ve A4 pafta boyutları. | Mevcut | plot.js / pdf-export.cjs / app.js: plotDialog | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 13.3 | Özel pafta boyutları. | Mevcut | plot.js / pdf-export.cjs / app.js: plotDialog | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 13.4 | Sayfa yönü. | Mevcut | plot.js / pdf-export.cjs / app.js: plotDialog | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 13.5 | Yazıcı ve plotter seçimi. | Kısmen mevcut | plot.js / pdf-export.cjs / app.js: plotDialog | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 13.6 | PDF çıktısı. | Mevcut | plot.js / pdf-export.cjs / app.js: plotDialog | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 13.7 | Ölçekli baskı. | Mevcut | plot.js / pdf-export.cjs / app.js: plotDialog | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 13.8 | 1:1, 1:2, 1:5, 1:10, 1:20, 1:50 ve 1:100 ölçekleri. | Mevcut | plot.js / pdf-export.cjs / app.js: plotDialog | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 13.9 | Özel baskı ölçekleri. | Mevcut | plot.js / pdf-export.cjs / app.js: plotDialog | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 13.10 | Plot Area: Tüm çizim, görünüm, pencere veya layout. | Kısmen mevcut | plot.js / pdf-export.cjs / app.js: plotDialog | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 13.11 | Baskıyı sayfada ortalama. | Mevcut | plot.js / pdf-export.cjs / app.js: plotDialog | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 13.12 | Çizgi kalınlığı tabloları. | Kısmen mevcut | plot.js / pdf-export.cjs / app.js: plotDialog | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 13.13 | Renkli ve siyah-beyaz çıktı. | Mevcut | plot.js / pdf-export.cjs / app.js: plotDialog | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 13.14 | Çizgi tipi ve saydamlık çıktısı. | Kısmen mevcut | plot.js / pdf-export.cjs / app.js: plotDialog | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 13.15 | Baskı önizlemesi. | Mevcut | plot.js / pdf-export.cjs / app.js: plotDialog | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 13.16 | Pafta çerçevesi ve antet. | Kısmen mevcut | plot.js / pdf-export.cjs / app.js: plotDialog | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 13.17 | Birden fazla paftayı toplu yazdırma. | Eksik | plot.js / pdf-export.cjs / app.js: plotDialog | Test edilmesi gerekiyor |
| 13.18 | Çok sayfalı PDF oluşturma. | Eksik | plot.js / pdf-export.cjs / app.js: plotDialog | Test edilmesi gerekiyor |
| 13.19 | Sayfa ayarlarını kaydetme. | Mevcut | plot.js / pdf-export.cjs / app.js: plotDialog | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 13.20 | Pafta setleri oluşturma ve yönetme. | Eksik | plot.js / pdf-export.cjs / app.js: plotDialog | Test edilmesi gerekiyor |
| 13.21 | PDF'e gömülebilen yazı tipleri. | Mevcut | plot.js / pdf-export.cjs / app.js: plotDialog | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 13.22 | Çıktıda font ve çizgi kalınlığı kontrolü. | Kısmen mevcut | plot.js / pdf-export.cjs / app.js: plotDialog | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 13.23 | Raster ve vektör PDF çıktısı seçenekleri. | Kısmen mevcut | plot.js / pdf-export.cjs / app.js: plotDialog | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 13.24 | Baskı ölçeği ile model ölçeğini birbirinden bağımsız yönetme. | Mevcut | plot.js / pdf-export.cjs / app.js: plotDialog | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 13.25 | Farklı paftalarda aynı çizimin farklı ölçeklerde gösterilmesi. | Eksik | plot.js / pdf-export.cjs / app.js: plotDialog | Test edilmesi gerekiyor |

**Kapsam notu:** PDF odaklı Plot arayüzü. Extents/Display/Window/Selection, özel kâğıt, ölçek, merkez/ofset, önizleme ve sayfa ayarları var; fiziksel yazıcı, layout ve çok sayfa yok.

### 14. DOSYA SİSTEMİ VE FORMAT DESTEĞİ

| No | Özellik | Durum | Kod / kapsam | Test |
|---|---|---|---|---|
| 14.1 | Yeni çizim oluşturma. | Kısmen mevcut | main.cjs / parser-worker.cjs / dwg-export.cjs / dxf-modern.js | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 14.2 | Dosya açma, kaydetme ve farklı kaydetme. | Kısmen mevcut | main.cjs / parser-worker.cjs / dwg-export.cjs / dxf-modern.js | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 14.3 | Otomatik kayıt. | Mevcut | main.cjs / parser-worker.cjs / dwg-export.cjs / dxf-modern.js | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 14.4 | Çökme sonrası kurtarma. | Kısmen mevcut | main.cjs / parser-worker.cjs / dwg-export.cjs / dxf-modern.js | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 14.5 | Yedek dosyalar. | Eksik | main.cjs / parser-worker.cjs / dwg-export.cjs / dxf-modern.js | Test edilmesi gerekiyor |
| 14.6 | DWG açma ve kaydetme desteği. | Kısmen mevcut | DWG içe aktarma; deneysel LibreDWG veya ayrıca kurulan ODA ile R2000 kayıt; kayıt öncesi tür/katman/blok/sınır/kalınlık doğrulaması | Native ve ODA örnekleri yeniden açıldı; AutoCAD/Windows kabul testi ve kullanıcının sorunlu dosyası bekliyor |
| 14.7 | DXF içe ve dışa aktarma. | Kısmen mevcut | main.cjs / parser-worker.cjs / dwg-export.cjs / dxf-modern.js | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 14.8 | PDF'e aktarma. | Kısmen mevcut | main.cjs / parser-worker.cjs / dwg-export.cjs / dxf-modern.js | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 14.9 | PDF'den geometri içe aktarma. | Bağımlılık gerektiriyor | main.cjs / parser-worker.cjs / dwg-export.cjs / dxf-modern.js | Test edilmesi gerekiyor |
| 14.10 | SVG dışa aktarma. | Mevcut | main.cjs / parser-worker.cjs / dwg-export.cjs / dxf-modern.js | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 14.11 | PNG, JPEG ve TIFF görsel çıktısı. | Eksik | main.cjs / parser-worker.cjs / dwg-export.cjs / dxf-modern.js | Test edilmesi gerekiyor |
| 14.12 | CSV ve TXT koordinat aktarımı. | Eksik | main.cjs / parser-worker.cjs / dwg-export.cjs / dxf-modern.js | Test edilmesi gerekiyor |
| 14.13 | DGN desteği. | Bağımlılık gerektiriyor | main.cjs / parser-worker.cjs / dwg-export.cjs / dxf-modern.js | Test edilmesi gerekiyor |
| 14.14 | Eski sürüm dosyalarıyla uyumluluk. | Kısmen mevcut | main.cjs / parser-worker.cjs / dwg-export.cjs / dxf-modern.js | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 14.15 | Dosya sürümü seçimi. | Kısmen mevcut | main.cjs / parser-worker.cjs / dwg-export.cjs / dxf-modern.js | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 14.16 | Dosya bozulması tespiti ve onarım. | Kısmen mevcut | main.cjs / parser-worker.cjs / dwg-export.cjs / dxf-modern.js | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 14.17 | Eksik yazı tiplerini bildirme. | Eksik | main.cjs / parser-worker.cjs / dwg-export.cjs / dxf-modern.js | Test edilmesi gerekiyor |
| 14.18 | Eksik referans dosyalarını bulma. | Eksik | main.cjs / parser-worker.cjs / dwg-export.cjs / dxf-modern.js | Test edilmesi gerekiyor |
| 14.19 | Harici kaynakları paketleme. | Eksik | main.cjs / parser-worker.cjs / dwg-export.cjs / dxf-modern.js | Test edilmesi gerekiyor |
| 14.20 | Dosya birimlerini doğru yorumlama. | Kısmen mevcut | main.cjs / parser-worker.cjs / dwg-export.cjs / dxf-modern.js | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 14.21 | Blok, katman, ölçü stili ve metin stillerini koruma. | Kısmen mevcut | Statik iç içe bloklar ve katmanlar korunur; her örnek ayrı tanım olarak çıkar; ölçü/metin stilleri ve dinamik öznitelikler tam korunmaz | 0.7 geometri ve Chromium arayüz regresyonları geçti; Windows kabul testi bekliyor |
| 14.22 | Çizim sınırlarını ve orijinini koruma. | Kısmen mevcut | main.cjs / parser-worker.cjs / dwg-export.cjs / dxf-modern.js | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 14.23 | Büyük dosyalarda hızlı açma ve kaydetme. | Kısmen mevcut | 0.6: worker içinde normalizasyon, 512 MB / 2 milyon sınırı, aşama/iptal; 510k sentetik HCAD açılışı. Büyük kayıt serialize işlemi hâlâ renderer tarafında. | Sentetik ve worker testleri geçti; gerçek büyük kullanıcı DWG / Windows testi bekliyor |
| 14.24 | Desteklenmeyen nesneleri kullanıcıya bildirme. | Kısmen mevcut | Genel rapor ve katman bazında atlanan türler; bozuk geometri ayrıştırma; SDK bilinmeyenleri yalnız toplam sayıda | 0.4 birim/arayüz ve ilgili DWG/DXF testleri; Windows kabul testi bekliyor |
| 14.25 | Dosya aktarımında nesne kaybını mümkün olduğunca önleme. | Kısmen mevcut | main.cjs / parser-worker.cjs / dwg-export.cjs / dxf-modern.js | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |

**Kapsam notu:** DWG R2000 yazıcı deneysel; kısıtlı 2B nesne desteği. DWG/DXF aktarım raporları tüm veri kaybını önlemez.

### 15. KOMUT SİSTEMİ VE KULLANICI ARAYÜZÜ

| No | Özellik | Durum | Kod / kapsam | Test |
|---|---|---|---|---|
| 15.1 | Undo ve Redo. | Mevcut | history.js: 80 işlem; değişen nesne/meta farkları; boş işlem ve redo dalı yönetimi | 0.3 geometri/arayüz veya sentetik benchmark doğrulandı; Windows kabul testi bekliyor |
| 15.2 | Komut satırı. | Mevcut | app.js / index.html | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 15.3 | Komut takma adları. | Mevcut | app.js / index.html | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 15.4 | Komut geçmişi. | Mevcut | app.js / index.html | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 15.5 | Komut önerileri ve otomatik tamamlama. | Eksik | app.js / index.html | Test edilmesi gerekiyor |
| 15.6 | Klavye kısayolları. | Mevcut | app.js / index.html | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 15.7 | Sağ tık bağlam menüleri. | Eksik | app.js / index.html | Test edilmesi gerekiyor |
| 15.8 | Ribbon: Şerit menü. | Mevcut | app.js / index.html | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 15.9 | Araç çubukları. | Mevcut | app.js / index.html | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 15.10 | Özelleştirilebilir çalışma alanları. | Eksik | app.js / index.html | Test edilmesi gerekiyor |
| 15.11 | Özellikler paneli. | Mevcut | app.js / index.html | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 15.12 | Katman paneli. | Mevcut | app.js / index.html | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 15.13 | Blok paleti. | Eksik | app.js / index.html | Test edilmesi gerekiyor |
| 15.14 | Dosya sekmeleri. | Mevcut | New/Open yeni belge sekmesi; aynı dosyayı etkinleştirme; kaydet/at/vazgeç; tüm sekmeleri kurtarma | 0.9 arayüz ve IPC testleri geçti; native Windows diyalogları bekliyor |
| 15.15 | Sürükle-bırak ile dosya açma. | Eksik | app.js / index.html | Test edilmesi gerekiyor |
| 15.16 | Çoklu seçimde toplu özellik düzenleme. | Kısmen mevcut | app.js / index.html | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 15.17 | Komut sırasında dinamik ipuçları. | Mevcut | app.js / index.html | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 15.18 | Komut iptali ve Escape davranışı. | Mevcut | app.js / index.html | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 15.19 | Fare ve klavye odak yönetimi. | Kısmen mevcut | app.js / index.html | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 15.20 | Kişisel ayarları kaydetme. | Kısmen mevcut | app.js / index.html | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 15.21 | Ekran çözünürlüğü ve ölçeklendirme desteği. | Kısmen mevcut | app.js / index.html | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 15.22 | Türkçe ve İngilizce arayüz. | Kısmen mevcut | Uygulama arayüzü İngilizce; Türkçe/İngilizce dil değiştirme seçeneği yok | 0.7 geometri ve Chromium arayüz regresyonları geçti; Windows kabul testi bekliyor |
| 15.23 | Yardım ve komut açıklamaları. | Mevcut | app.js / index.html | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 15.24 | Kullanıcı profilleri. | Eksik | app.js / index.html | Test edilmesi gerekiyor |
| 15.25 | Komutların hem fareyle hem klavyeyle kullanılabilmesi. | Kısmen mevcut | app.js / index.html | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 15.26 | Komut başlatma, parametre isteme, seçim alma, iptal etme ve tamamlanma durumlarının ortak bir sistem üzerinden yönetilmesi. | Kısmen mevcut | CommandSession: başlangıç, nesil, meşgul durumu; nokta işlemleri sıraya alınmadan çakışma engellenir; araç durumlarının ayrıştırılması sürüyor | 0.3 geometri/arayüz veya sentetik benchmark doğrulandı; Windows kabul testi bekliyor |

**Kapsam notu:** CommandSession oturum temeli eklendi; parametre ve araç aşamaları hâlâ app.js içindedir. İngilizce arayüz eklendi. Tam ayrıştırma, otomatik tamamlama ve profiller eksik.

### 16. İLERİ SEVİYE ÖZELLİKLER

| No | Özellik | Durum | Kod / kapsam | Test |
|---|---|---|---|---|
| 16.1 | Parametrik çizim. | Bağımlılık gerektiriyor | Ayrı modül gerekiyor | Test edilmesi gerekiyor |
| 16.2 | Geometrik kısıtlamalar. | Bağımlılık gerektiriyor | Ayrı modül gerekiyor | Test edilmesi gerekiyor |
| 16.3 | Paralellik, diklik, teğetlik ve eşitlik kısıtları. | Bağımlılık gerektiriyor | Ayrı modül gerekiyor | Test edilmesi gerekiyor |
| 16.4 | Ölçüyle kısıtlama. | Bağımlılık gerektiriyor | Ayrı modül gerekiyor | Test edilmesi gerekiyor |
| 16.5 | Dinamik bloklar ve akıllı nesneler. | Eksik | Ayrı modül gerekiyor | Test edilmesi gerekiyor |
| 16.6 | Komut makroları. | Eksik | Ayrı modül gerekiyor | Test edilmesi gerekiyor |
| 16.7 | Script dosyaları. | Eksik | Ayrı modül gerekiyor | Test edilmesi gerekiyor |
| 16.8 | Eklenti API'si. | Eksik | Ayrı modül gerekiyor | Test edilmesi gerekiyor |
| 16.9 | Otomasyon dili veya betik desteği. | Eksik | Ayrı modül gerekiyor | Test edilmesi gerekiyor |
| 16.10 | Tekrarlanan işleri toplu çalıştırma. | Eksik | Ayrı modül gerekiyor | Test edilmesi gerekiyor |
| 16.11 | Çizim karşılaştırma. | Eksik | Ayrı modül gerekiyor | Test edilmesi gerekiyor |
| 16.12 | Revizyon geçmişi. | Eksik | Ayrı modül gerekiyor | Test edilmesi gerekiyor |
| 16.13 | İşaretleme ve yorum sistemi. | Eksik | Ayrı modül gerekiyor | Test edilmesi gerekiyor |
| 16.14 | Birden fazla kullanıcıyla çalışma. | Bağımlılık gerektiriyor | Ayrı modül gerekiyor | Test edilmesi gerekiyor |
| 16.15 | Bulut depolama ve paylaşım. | Bağımlılık gerektiriyor | Ayrı modül gerekiyor | Test edilmesi gerekiyor |
| 16.16 | Web üzerinden görüntüleme ve düzenleme. | Bağımlılık gerektiriyor | Ayrı modül gerekiyor | Test edilmesi gerekiyor |
| 16.17 | Çizim şablonları. | Eksik | Ayrı modül gerekiyor | Test edilmesi gerekiyor |
| 16.18 | CAD standartlarını denetleme. | Eksik | Ayrı modül gerekiyor | Test edilmesi gerekiyor |
| 16.19 | Akıllı blok önerileri. | Eksik | Ayrı modül gerekiyor | Test edilmesi gerekiyor |
| 16.20 | PDF üzerindeki düzeltmeleri çizime aktarma. | Bağımlılık gerektiriyor | Ayrı modül gerekiyor | Test edilmesi gerekiyor |
| 16.21 | Dosya bütünlüğü ve hata denetimi. | Kısmen mevcut | Ayrı modül gerekiyor | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 16.22 | Büyük çizimlerde performans optimizasyonu. | Kısmen mevcut | AABB sorguları ve görünür alan elemesi; değişiklikte indeks yeniden kurulur | 0.3 geometri/arayüz veya sentetik benchmark doğrulandı; Windows kabul testi bekliyor |
| 16.23 | Kullanıcıların kendi komutlarını ve araçlarını ekleyebilmesi. | Eksik | Ayrı modül gerekiyor | Test edilmesi gerekiyor |

**Kapsam notu:** İleri otomasyon, çok kullanıcılı yapı ve kısıt çözücü uygulanmadı.

### 17. MİMARLIK VE İÇ MİMARLIK MODÜLÜ

| No | Özellik | Durum | Kod / kapsam | Test |
|---|---|---|---|---|
| 17.1 | Belirlenen kalınlık ve yükseklikte duvar çizme. | Eksik | Mimari modül henüz yok | Test edilmesi gerekiyor |
| 17.2 | Duvar birleşimlerini otomatik düzenleme. | Eksik | Mimari modül henüz yok | Test edilmesi gerekiyor |
| 17.3 | Duvar köşelerini temizleme. | Eksik | Mimari modül henüz yok | Test edilmesi gerekiyor |
| 17.4 | Duvar uzatma ve kısaltma. | Eksik | Mimari modül henüz yok | Test edilmesi gerekiyor |
| 17.5 | Duvarlarda kapı ve pencere boşluğu oluşturma. | Eksik | Mimari modül henüz yok | Test edilmesi gerekiyor |
| 17.6 | Kapı çizme ve açılım yönünü gösterme. | Eksik | Mimari modül henüz yok | Test edilmesi gerekiyor |
| 17.7 | Pencere çizme ve ölçülendirme. | Eksik | Mimari modül henüz yok | Test edilmesi gerekiyor |
| 17.8 | Kapı ve pencere ölçülerini parametrik olarak değiştirme. | Eksik | Mimari modül henüz yok | Test edilmesi gerekiyor |
| 17.9 | Mobilya yerleşim araçları. | Eksik | Mimari modül henüz yok | Test edilmesi gerekiyor |
| 17.10 | Hazır mobilya, sıhhi tesisat ve mimari sembol kütüphaneleri. | Eksik | Mimari modül henüz yok | Test edilmesi gerekiyor |
| 17.11 | Ölçüye göre değişebilen parametrik nesneler. | Eksik | Mimari modül henüz yok | Test edilmesi gerekiyor |
| 17.12 | Mahal etiketleri ve mahal numaraları. | Eksik | Mimari modül henüz yok | Test edilmesi gerekiyor |
| 17.13 | Mahal alanlarını otomatik hesaplama. | Eksik | Mimari modül henüz yok | Test edilmesi gerekiyor |
| 17.14 | Mahal listesi ve alan çizelgesi oluşturma. | Eksik | Mimari modül henüz yok | Test edilmesi gerekiyor |
| 17.15 | Kesit, görünüş ve detay işaretleri. | Eksik | Mimari modül henüz yok | Test edilmesi gerekiyor |
| 17.16 | Kot işaretleri ve seviye sembolleri. | Eksik | Mimari modül henüz yok | Test edilmesi gerekiyor |
| 17.17 | Aks sistemi ve aks numaralandırma. | Eksik | Mimari modül henüz yok | Test edilmesi gerekiyor |
| 17.18 | Kolon ve kiriş sembolleri. | Eksik | Mimari modül henüz yok | Test edilmesi gerekiyor |
| 17.19 | Merdiven çizimi. | Eksik | Mimari modül henüz yok | Test edilmesi gerekiyor |
| 17.20 | Rampa çizimi. | Eksik | Mimari modül henüz yok | Test edilmesi gerekiyor |
| 17.21 | Zemin döşeme desenleri. | Eksik | Mimari modül henüz yok | Test edilmesi gerekiyor |
| 17.22 | Tavan planı araçları. | Eksik | Mimari modül henüz yok | Test edilmesi gerekiyor |
| 17.23 | Aydınlatma ve elektrik sembolleri. | Eksik | Mimari modül henüz yok | Test edilmesi gerekiyor |
| 17.24 | Süpürgelik metrajı. | Eksik | Mimari modül henüz yok | Test edilmesi gerekiyor |
| 17.25 | Malzeme lejantı oluşturma. | Eksik | Mimari modül henüz yok | Test edilmesi gerekiyor |
| 17.26 | Mimari pafta ve antet şablonları. | Eksik | Mimari modül henüz yok | Test edilmesi gerekiyor |
| 17.27 | Kat planlarının katman ve çizgi kalınlığı standartlarına uygun yönetimi. | Eksik | Mimari modül henüz yok | Test edilmesi gerekiyor |
| 17.28 | Plan, kesit ve görünüş için teknik çizim yardımcıları. | Eksik | Mimari modül henüz yok | Test edilmesi gerekiyor |

**Kapsam notu:** Örnek oda planı, mimari araç modülü değildir. Bu bölüm ayrı parametrik nesne modeli ister.

### 18. MOBİLYA VE AHŞAP İMALAT MODÜLÜ

| No | Özellik | Durum | Kod / kapsam | Test |
|---|---|---|---|---|
| 18.1 | Parametrik dolap, masa, sandalye, raf ve diğer mobilya çizimleri. | Eksik | Üretim modülü henüz yok | Test edilmesi gerekiyor |
| 18.2 | Mobilyaların plan, ön görünüş ve yan görünüşlerini oluşturma. | Eksik | Üretim modülü henüz yok | Test edilmesi gerekiyor |
| 18.3 | Mobilya ölçülerini değiştirdiğinde geometrinin güncellenmesi. | Eksik | Üretim modülü henüz yok | Test edilmesi gerekiyor |
| 18.4 | Panel ve parça ölçülerini otomatik hesaplama. | Eksik | Üretim modülü henüz yok | Test edilmesi gerekiyor |
| 18.5 | Kesim listesi oluşturma. | Eksik | Üretim modülü henüz yok | Test edilmesi gerekiyor |
| 18.6 | Parçaları numaralandırma. | Eksik | Üretim modülü henüz yok | Test edilmesi gerekiyor |
| 18.7 | Kenar bantlama bilgilerini kaydetme. | Eksik | Üretim modülü henüz yok | Test edilmesi gerekiyor |
| 18.8 | Malzeme kalınlığını yönetme. | Eksik | Üretim modülü henüz yok | Test edilmesi gerekiyor |
| 18.9 | Vida, kavela ve bağlantı elemanlarının konumlarını belirleme. | Eksik | Üretim modülü henüz yok | Test edilmesi gerekiyor |
| 18.10 | Delik ve bağlantı şemaları. | Eksik | Üretim modülü henüz yok | Test edilmesi gerekiyor |
| 18.11 | Ahşap birleşim detayları. | Eksik | Üretim modülü henüz yok | Test edilmesi gerekiyor |
| 18.12 | CNC üretimine uygun 2D geometri dışa aktarma. | Eksik | Üretim modülü henüz yok | Test edilmesi gerekiyor |
| 18.13 | DXF tabanlı kesim dosyaları oluşturma. | Eksik | Üretim modülü henüz yok | Test edilmesi gerekiyor |
| 18.14 | Malzeme ve parça metrajı. | Eksik | Üretim modülü henüz yok | Test edilmesi gerekiyor |
| 18.15 | Mobilya üretim çizelgeleri. | Eksik | Üretim modülü henüz yok | Test edilmesi gerekiyor |
| 18.16 | Teknik çizim antetleri ve parça etiketleri. | Eksik | Üretim modülü henüz yok | Test edilmesi gerekiyor |
| 18.17 | Mobilya kütüphanesi. | Eksik | Üretim modülü henüz yok | Test edilmesi gerekiyor |
| 18.18 | Panel yerleşimi ve kesim optimizasyonu için gelecekte genişletilebilir yapı. | Eksik | Üretim modülü henüz yok | Test edilmesi gerekiyor |

**Kapsam notu:** İmalat/CNC doğrulaması yapılmadı. Mobilya/parça modeli ve kesim listesi yok.

### 19. PERFORMANS, KARARLILIK VE VERİ GÜVENLİĞİ

| No | Özellik | Durum | Kod / kapsam | Test |
|---|---|---|---|---|
| 19.1 | Büyük çizimlerde akıcı yakınlaştırma ve kaydırma. | Kısmen mevcut | Görüş alanı elemesi var; tam çizim ve yoğun taramada LOD yok | 0.3 geometri/arayüz veya sentetik benchmark doğrulandı; Windows kabul testi bekliyor |
| 19.2 | Binlerce ve yüz binlerce nesneyle çalışabilme hedefi. | Kısmen mevcut | 0.6: 510k nesne indeks/HCAD worker açılışı; 50k ekran/1501 katman; parçalı geometri önbelleği | Sentetik geometri ve Chromium UI testi geçti; Windows büyük gerçek DWG testi bekliyor |
| 19.3 | Görünür nesneleri verimli çizdirme. | Kısmen mevcut | AABB üzerinden görüş alanı adayları çizdirilir; katman filtresi ve çizim sırası korunur | 0.3 geometri/arayüz veya sentetik benchmark doğrulandı; Windows kabul testi bekliyor |
| 19.4 | Geometrik sorgularda uzamsal indeksleme kullanma. | Mevcut | Dengeli AABB ağacı: seçim/yakalama/render adayları; dönüşüm sonrası yeniden kurulur | 0.3 geometri/arayüz veya sentetik benchmark doğrulandı; Windows kabul testi bekliyor |
| 19.5 | Seçim ve yakalama hesaplarını optimize etme. | Kısmen mevcut | Yerel indeks sorgusu ve analitik geometri; çok yoğun kesişimde aday çiftleri pahalı olabilir | 0.3 geometri/arayüz veya sentetik benchmark doğrulandı; Windows kabul testi bekliyor |
| 19.6 | Çizim sırasında gereksiz ekran yenilemelerini önleme. | Eksik | core.js / main.cjs / tests | Test edilmesi gerekiyor |
| 19.7 | Undo/Redo için güvenilir işlem geçmişi. | Kısmen mevcut | Ekle/sil/değiştir/meta farkları; undo-redo/redo dalı testli; geçici checkpoint O(n), başarısız işlem atomikliği tüm komutlarda tamamlanmadı | 0.3 geometri/arayüz veya sentetik benchmark doğrulandı; Windows kabul testi bekliyor |
| 19.8 | Dosya kaydında veri kaybını önleme. | Kısmen mevcut | core.js / main.cjs / tests | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 19.9 | Otomatik kayıt ve kurtarma mekanizması. | Mevcut | core.js / main.cjs / tests | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 19.10 | Hatalı geometrileri algılama. | Kısmen mevcut | Geçersiz tekil geometriyi katman raporuna kaydet; diğer nesneleri yükle; sınır aşımı bütün işlemi durdurur | 0.4 birim/arayüz ve ilgili DWG/DXF testleri; Windows kabul testi bekliyor |
| 19.11 | Bozuk dosyaları güvenli şekilde açmayı deneme. | Kısmen mevcut | core.js / main.cjs / tests | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 19.12 | İşlemler başarısız olduğunda çizimin bozulmaması. | Kısmen mevcut | core.js / main.cjs / tests | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 19.13 | Hata kayıtları ve tanılama sistemi. | Kısmen mevcut | core.js / main.cjs / tests | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 19.14 | Farklı ekran çözünürlüklerinde arayüz testi. | Kısmen mevcut | core.js / main.cjs / tests | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 19.15 | Birim testleri ve dosya uyumluluk testleri. | Kısmen mevcut | core.js / main.cjs / tests | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 19.16 | Mevcut özellikleri koruyan regresyon testleri. | Kısmen mevcut | core.js / main.cjs / tests | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |
| 19.17 | Kullanıcı ayarlarının ve dosyaların güvenilir biçimde saklanması. | Kısmen mevcut | core.js / main.cjs / tests | Regresyon kapsamı sınırlı; özellik ve Windows kabul testi gerekiyor |

**Kapsam notu:** 10k/100k sentetik LINE indeks/geçmiş ölçümü yapıldı. Gerçek büyük DWG, Windows uçtan uca, yoğun tarama ve hata enjeksiyonu testleri henüz yok. İndeks her geometri değişikliğinde yeniden kurulur.

## İlk aşama test kaydı

- DXF 2000 bağımsız ezdxf denetimi: 0 hata, 0 düzeltme; birim ve katman kalınlığı/kilit okuması doğru.
- DWG 2000 gerçek ikili çıktı: AC1015; 30 nesne yeniden açıldı; 0,50 ve 0,18 mm katman kalınlıkları ve katman kilidi korundu; Türkçe yazı yeniden okundu.
- PDF A3 1:50: 6000 mm çizgi = 120 mm; 0,18/0,50 mm çizgi kalınlığı ve 50 mm kontrol çizgisi ölçüldü.
- Windows EXE ve fiziksel yazıcı uçtan uca testi bu ortamda yapılamadı.

- Plot UI testleri geçti: Ctrl+P, fareyle Window seçimi, sayfa ayarı kaydet/çağır, özel kâğıt, Fit to paper ve taşma engeli.

## 0.3 — İkinci aşama teslim kaydı

- Hassas çizim ayarları penceresi: OSNAP türü filtreleri, polar açı, UCS X/Y kilidi.
- UCS/WCS, döndürülmüş ızgara, koordinat gösterimi ve dikdörtgen; HCAD içinde kalıcı. DWG/DXF çıktı geometrisi dünya koordinatlarıdır; UCS tercihleri bu aşamada DWG başlığına aktarılmaz.
- Nokta, kesişim, dik, teğet, en yakın ve düz polilin geometrik merkezi yakalamaları.
- Analitik Crossing/Fence; önceki ve son seçim. Gizli/kilitli katmanlar seçilmez.
- Fark tabanlı 80 işlem geçmişi. 10k nesneli çizimde 80 tek nesne değişikliği 21.664 bayt tutulan geçmiş kullandı. Açık işlem hâlâ geçici tam belge kopyası kullanır.
- Geometri, UCS/polar, yakalama, undo-redo, komut çakışması birim testleri geçti.
- Arayüzde UCS girişleri, döndürülmüş dikdörtgen, Fence, önceki seçim, F8/F10, ayarlar ve gerçek fare Crossing testi geçti.
- Önceki Plot, DWG/DXF kalınlık/kilit, vektör PDF ve taşma regresyonları geçti. Gerçek R2000 DWG yeniden yazılıp okundu.
- Windows EXE açılışı/native diyalog/native yazıcı burada çalıştırılmadı.

### Sentetik performans ölçümü

Linux / Node v24; her boyutta 1.000 yerel sorgu. Gerçek DWG veya Windows FPS sonucu değildir.

| LINE sayısı | İndeks kurma (ms) | Sorgu medyanı (ms) | Sorgu %95 (ms) | Geçici kopya + tek değişikliği işleme (ms) | Saklanan tek işlem (bayt) |
|---|---|---|---|---|---|
| 10000 | 53.95 | 0.0023 | 0.0066 | 26.96 | 267 |
| 100000 | 1106.28 | 0.0026 | 0.0074 | 288.59 | 276 |

### Sonraki çalışma

Komut aşamalarını bağımsız durum nesnelerine taşıma ve artımlı indeks güncellemesi mimari borç olarak sürüyor. Ardından 3. aşamadaki fillet/chamfer, join/explode ve array gibi düzenleme araçları sıradadır. Tüm 429 madde tamamlanmış değildir.

## 0.4 — Kullanıcı talebine göre Polyline ve DWG düzeltmeleri

- Polyline düz/yay segmentleri; PEDIT düğüm düzenleme; JOIN/EXPLODE ve geri alma.
- İmleç yanında uzunluk/açı ve ilk nokta X/Y girişi; F12, Tab, Enter; UCS uyumu.
- Açılışta view.y değerinin canvas ölçülmeden hesaplanması nedeniyle çizimin ekran dışında kalması düzeltildi.
- DWG LWPOLYLINE kapalı bayrağı 512 olarak okundu; DXF için 1 korunur. sample_2000.dwg üzerinde hata ve düzeltme doğrulandı.
- Okuyucunun katman ve linetype handle çözümünde absolute_ref önceliği eklendi.
- Ters OCS (-Z), blok üst katmanı görünürlüğü, nesne görünmezliği, yinelenen ATTRIB ve model/pafta ayrımı düzeltildi.
- Katman inceleme: filtre, yüklenen/atlanan nesne sayıları, kapalı/donmuş kaynak durumu, göster/sığdır.
- Bozuk nesne tüm çizimi iptal etmez; katmanına göre raporlanır. Boyut/güvenlik sınırları aşılırsa işlem durur.

### Doğrulama

Geometri: üç noktalı yay, bulge yönü, yay ortasından bölme, uzunluk korunumlu reverse/join/explode, bozuk geometri, -Z OCS, kapalı bayrak, blok katman görünürlüğü, Türkçe katman adı.

Gerçek DWG: R2000 yaz/yeniden aç; yaylı ve kapalı polilin, Türkçe adlı gizli/kilitli katman, katman kalınlıkları. DXF yay uzunluğu gidiş-dönüşü geçti.

Arayüz: PLINE A/L/U/C/Enter/Esc; PEDIT düğüm ekleme ve undo/redo; JOIN/EXPLODE; 100 birim 30° dinamik giriş; Tab/Enter/F12; katman ara/göster; açılış koordinatının ekran içinde olması. Önceki çizim, dönüşüm, katman ve PDF/DWG akışları regresyon kapsamındadır.

Kullanıcının sorunlu DWG dosyası sağlanmadı. Tüm DWG türleri veya tüm katman sorunları çözüldü denilemez. Windows EXE ve native diyaloglar bu ortamda çalıştırılmadı.

## 0.5 teslimi — düzenleme araçları

- modify.js: saf geometri işlemleri; fillet/chamfer, rectangular/polar array,
  analitik yol istasyonu ve BREAK, LENGTHEN, STRETCH.
- modify-ui.js: araç çubuğu, sayısal ayarlar, canlı önizleme, iptal ve tek adımlı geçmiş.
- Çizim yalnız onayda değişir; yeni nesneler benzersiz kimlikle mevcut dosya modeline kaydolur.
- Komut alanındaki Enter olayının ikinci kez işlenmesi önlendi.
- Geometri testleri: saat yönü/tersi köşeler, büyük yarıçap reddi, eğri BREAK,
  kapalı şekil aralığı, UCS dizisi, tam/yarım dairesel dizi, uç uzunluğu ve germe.
- Arayüz testleri: önizleme/onay/iptal, her yeni komut, geri al/yinele, geçersiz ölçüler.
- Mevcut DWG okuma, DXF, layer, polyline, hassas çizim ve ölçekli PDF regresyonları geçti.
- Windows EXE/native diyalog testi bekliyor. Kullanıcının sorunlu DWG örneği verilmediği
  için o dosyadaki eksik katmanlar ayrıca doğrulanamadı.
- Tam AutoCAD eşdeğerliği yok: 3B katı modelleme, Layout/viewport, XREF,
  dinamik blok, ilişkisel nesneler, CTB/STB ve LISP/API aşamaları hâlâ açık.

- 0.5 yeni geometri için gerçek DWG R2000 yaz/yeniden aç ve PDF dışa aktar testi de geçti. DWG yazıcı testi Linux üzerinde aynı LibreDWG 0.13.4 sürümüyle yapıldı; Windows exe testi yerine geçmez.

## 0.6 — Büyük çizimler, görünürlük ve başlangıç ekranı

- Yeni başlangıç ekranı: sol Yeni/Aç, son 20 proje kartları, küçük önizleme,
  ada göre arama, taşınmış dosya durumu ve yalnız listeden kaldırma.
- recent-store.cjs: atomik yerel geçmiş kaydı; renderer yalnız kayıtlı kimlikle dosya açabilir.
- file-loader.cjs / parser-worker.cjs: 10 dakika üst süre, iptal, faz bildirimi;
  HCAD/DXF/DWG çözümleme ve importDrawing normalizasyonu worker içinde.
- 100 MB / 500k sınırı 512 MB / 2 milyon olarak güncellendi; RAM/WASM sınırları geçerlidir.
- scene-cache.js: aynı görünümde fare hareketi için geometri önbelleği; görünüm
  değişiminde tüm adaylar 9 ms hedefli parçalarla çizilir. Geometri atılmaz.
- precision.js: indeks kurulumunda tekrarlı alt dizi sıralama/kopyalama yerine
  aralık bölme; layer panelinde arama ve 100 satırlık sayfalama.
- Katman inceleme: görünür/toplam, kaynak nesne gizliliği ve kapalı üst blok katmanı.
  Göster ve sığdır: gerekli üst katmanları ve seçili katmanın nesne gizliliğini açar.
- import-curves.js: rasyonel de Boor spline örnekleme; DWG hatch sınır çizgileri.
  Özgün spline ve hatch semantiği korunmaz. XREF/proxy/3B/pafta desteği genişletilmedi.
- 510.000 nesneli, 45.966.899 baytlık sentetik HCAD: worker açılışı ~1,8 sn;
  indeks + doğrulama ~2,7 sn. 50k ekran / 1501 katman testi ~316 ms ilk hazırlık.
- Önceki geometri, gerçek DWG yaz/oku ve PDF testleri geçti. Kullanıcının büyük
  DWG dosyası henüz sağlanmadı; bu ölçümler gerçek dosyasının eksiksiz açıldığını
  veya Windows EXE'nin doğrulandığını göstermez.

## 0.7 teslimi — bloklar, TRIM, F8 ve İngilizce arayüz

- İç içe statik bloklar tek nesne olarak seçilir; dönüşüm, kopya, tek seviyeli EXPLODE, DWG/DXF aktarımı ve PDF görünürlüğü güncellendi.
- Kapalı ve yaylı polilinler TRIM kapsamına alındı. Kesici sınırlar farklı görünür katmanlardan alınabilir. Kilitli hedef korunur.
- F8 açıkken dikdörtgenin karşı köşesinin tek eksene çökmesi giderildi.
- Ekranda uyarlanabilir renk kontrastı ve açık/koyu arka plan var. Kaydedilen renkler değiştirilmez.
- İngilizce ana ekran, komut mesajları, iletişim kutuları ve yardım eklendi.
- 510.000 nesneli sentetik DXF testi geçti. Bu, her büyük gerçek DWG'nin eksiksiz açılacağı anlamına gelmez.
- DWG kaydı yapı kontrolünden geçer. LibreDWG çıktıları başka CAD uygulamalarında hâlâ recovery isteyebilir. Ayrıca kurulan ODA motoru audit seçeneği ile kullanılabilir. ODA pakete dahil değildir.
- Geometri, dosya ve Chromium UI regresyonları geçti. Windows EXE ve AutoCAD üzerinde kabul testi yapılmadı; ekran görüntüsündeki hatalı DWG dosyası sağlanmadı.

Ayrıntılar: Test_Raporu_0.7.md. Önceki sürüm notları tarihsel kayıttır; güncel kapsam yukarıdaki tabloda gösterilir.

## 0.8 teslimi — OpenCAD kimliği ve çalışma alanı

- Uygulama adı, pencere, Windows EXE simgesi/sürüm bilgisi, yardım ve PDF üretici bilgisi OpenCAD olarak güncellendi.
- Kullanıcının sağladığı logo kullanıldı; araçlar Home / Draw / Modify / Annotate / View şeritlerine ayrıldı.
- Solda katmanlar, ortada çizim ve komut satırı, sağda özellikler/ayarlar var.
- Önizlemeli başlangıç ekranının sol altında GitHub, Instagram, X ve Discord bağlantıları bulunur; Discord etiketi İngilizce “Join our community”dir.
- Masaüstü bağlantıları yalnız verilen dört adres için varsayılan tarayıcıya yönlendirilir.
- Önceki kullanıcı verisi klasörü, yeni OpenCAD klasörü yoksa yeniden kullanılır; HCAD biçimi değiştirilmedi.
- 1536×1024 ve 1000×650 arayüz kontrolleri ile mevcut home, TRIM/F8, block ve modify regresyonları geçti. Windows üzerinde açılış ve varsayılan tarayıcı kabul testi bekliyor.
- Bu sürüm arayüz/kimlik güncellemesidir; önceki DWG uyumluluk sınırlamaları devam eder.


## 0.9 teslimi — sürükleyerek TRIM ve bağımsız proje sekmeleri

- TRIM hedefe tıklamayla veya basılı fare geçişiyle çalışır. Hareket segmentinin analitik kesişimleri taranır; hızlı geçişte aradaki çizgiler atlanmaz. Önizleme belgeyi değiştirmez; bırakınca tek geçmiş girdisi, Esc ile iptal.
- Görünür/kilitsiz hedef katmanlar düzenlenir. Kilitli nesneler kesici olabilir; seçili kesici nesneler korunur. Blok içi düzenleme hâlâ EXPLODE gerektirir.
- Her belge sekmesinin çizimi, katmanları, görünümü, seçimleri, çizim tercihleri ve Undo/Redo geçmişi ayrıdır. New/Open, Ctrl+Tab, Ctrl+W ve kaydet/at/vazgeç akışları eklendi.
- Aynı kaynak dosya tekrar açılırsa düzenlenmiş sekme etkinleştirilir. Tüm kirli sekmeler native kapanış uyarısına katılır. İptal edilen kayıt sekmeyi kapatmaz.
- Kurtarma tüm açık çizimleri ve görünümleri içerir; disk yazıları sıralı ve atomiktir. Toplam kurtarma sınırı 100 MB; yeniden başlatma sonrası Undo geçmişi kurtarılmaz.
- Orijinal logo korunur; koyu arka plan CSS kontrast ve karışım ayarıyla arayüzde görünmez hale getirilir. Dosya alfa kanalı değiştirilmedi.
- Test_Raporu_0.9.md test kapsamını kaydeder. Windows uygulaması ve gerçek AutoCAD kabul testi bu ortamda çalıştırılmadı; DWG kapsamı önceki sürümle aynıdır.
