# OpenCAD — GitHub'a yükleme

## 1. Kod deposu

Bu klasörün içindekiler kod deposuna yüklenir. README.md, package.json,
LICENSE, uygulama kodu, testler, küçük native dönüştürücü ve vendor yamaları
aynı seviyede kalmalıdır. ZIP'i tek dosya olarak kod deposuna yüklemek yerine
önce ZIP'i çıkarın, sonra içindeki OpenCAD klasörünün içeriğini yükleyin.

GitHub'ın web arayüzünde her dosya en fazla 25 MiB olabilir; aynı anda en fazla
100 dosya yüklenebilir. Gerekirse klasörleri birkaç seferde yükleyin veya
GitHub Desktop kullanın. Bu paketteki her dosya 25 MiB sınırının altındadır.

OpenCAD.exe, portable paketin DLL/runtime dosyaları ve node_modules bu kod
paketinde bulunmaz. native klasöründeki DWG dönüştürücü ve sıkıştırılmış DLL dosyalarını
silmemelisiniz. .gitignore dosyası Git ile yüklemelerde oluşturulan dosyaları
ve büyük uygulama paketini dışarıda tutar; web arayüzünden seçilen dosyaları
otomatik olarak filtrelemez.

## 2. İndirilebilir Windows uygulaması

1. Deponuzda Releases bölümüne girin.
2. Draft a new release seçeneğini açın.
3. Etiket: v0.9.0. Başlık: OpenCAD 0.9.0.
4. RELEASE_NOTES.md içindeki açıklamayı kopyalayın.
5. Dosya ekleme alanına yaklaşık 213 MB'lık TAM OpenCAD.zip paketini yükleyin.
   Bu küçük kaynak kod ZIP'ini çalıştırılabilir uygulama diye yüklemeyin.
6. İsterseniz This is a pre-release seçeneğini işaretleyin.
7. Publish release ile yayımlayın.

Elinizde beş parçalı indirme varsa önce parçaların hepsini aynı klasöre
çıkarın, BIRLESTIR.cmd'yi çalıştırın. Oluşan OpenCAD-0.9.zip dosyasını da
release'e yükleyebilirsiniz; release açıklamasındaki dosya adını buna göre
değiştirin. Sadece EXE dosyası yeterli değildir; program yanındaki runtime
ve resources dosyalarına da ihtiyaç duyar.

GitHub Releases'de tek dosya 2 GiB'den küçük olmalıdır. Mevcut tam OpenCAD
paketi bu sınırın altındadır. Büyük EXE'yi küçültmek veya Git LFS kullanmak
bu dağıtım yöntemi için gerekli değildir.

## 3. Daha önce büyük EXE'yi Git'e eklediyseniz

Web yüklemesi reddedildiyse dosyayı kod yükleme listesinden çıkarıp release'e
yükleyin. Git push sırasında büyük dosya hatası aldıysanız .gitignore tek
başına mevcut commit geçmişini düzeltmez. Hata çıktısına göre büyük dosyanın
henüz gönderilmemiş commitlerden çıkarılması gerekir; paylaşılan geçmişi
incelemeden silmeyin veya zorla yeniden yazmayın.

## Kaynaktan çalıştırma

Bu klasörde npm ci, ardından npm start çalıştırılır. postinstall, taşınabilir
sürümdeki LibreDWG JavaScript yamalarını yeniden uygular; sıkıştırılmış native DLL dosyasını açar ve doğrular. Tam Windows ZIP'i
korunmuştur; bu kaynak paketi uygulamayı yeniden derlemez veya sıkıştırmaz.

## Resmî belgeler

- https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository
- https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github
- https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases
- https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository

Sınırlar 16 Ekim 2026 tarihinde kontrol edildi.
