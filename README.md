# Toptanci Programi

React Native/Expo tabanli B2B toptanci uygulamasi. Proje, bayi ve toptanci rolleri icin urun listeleme, sepet, favoriler, cari hesap, odeme bildirimi, siparis takibi ve personel yonetimi akislari icerir.

## Teknolojiler

- Expo 51 / React Native 0.74
- React Navigation
- Axios
- Express
- MongoDB / Mongoose

## Gereksinimler

- Node.js 20+
- npm
- Calisan bir MongoDB servisi

## Kurulum

```bash
npm install
npm --prefix server install
```

Ortam dosyalarini olusturun:

```bash
copy .env.example .env
copy server\.env.example server\.env
```

Fiziksel telefonda Expo Go ile test ederken `.env` icindeki `EXPO_PUBLIC_API_URL` degerini bilgisayarin yerel IP adresine gore ayarlayin:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
```

## Calistirma

Backend:

```bash
npm run server
```

Veritabani seed:

```bash
npm run seed
```

Expo uygulamasi:

```bash
npm start
```

Web:

```bash
npm run web
```

## Backend Ayarlari

`server/.env`:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/Toptanci
CORS_ORIGIN=*
```

## Onemli Notlar

- Kullanici sifreleri API cevaplarindan temizlenir; login artik backend uzerinden `/login` endpointi ile yapilir.
- Gelistirme ortaminda varsayilan API adresi web/iOS icin `http://localhost:3000`, Android emulator icin `http://10.0.2.2:3000` olarak belirlenir.
- Gercek ortam icin `CORS_ORIGIN`, `MONGO_URI` ve `EXPO_PUBLIC_API_URL` degerleri mutlaka ortam bazli ayarlanmalidir.

## Kontrol

Backend syntax kontrolu:

```bash
npm run check:server
```
