const buildSeedProducts = (refs) => {
    const {
        catMutfak,
        catElektronik,
        catBakim,
        catSes,
        catTelefonTablet,
        catTemizlik,
        catKucukEv,
        catAksesuar,
        modelTermos,
        modelSupurge,
        modelTelefon,
        modelKahveci,
        modelAirwrap,
        modelRobot,
        modelTost,
        modelPowerbank,
        modelTeapot,
        modelAirfryer,
        modelBlender,
        modelTablet,
        modelAirPods,
        modelTV,
        modelSpeaker,
        modelToothbrush,
        modelIron,
        brandStanley,
        brandDyson,
        brandXiaomi,
        brandKaraca,
        brandApple,
        brandSamsung,
        brandJbl,
        brandPhilips
    } = refs;

    const productsData = [
        // Sayfa 1
        {
            title: 'Stanley Klasik Vakumlu Termos 1.4 L',
            categoryId: catMutfak._id,
            modelId: modelTermos._id,
            brandId: brandStanley._id,
            image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=400',
            price: 1850,
            stock: 120,
            moq: 5, // Minimum sipariş adedi
            desc: 'Çift katmanlı paslanmaz çelik vakum yalıtımı ile sıcak/soğuk tutar.'
        },
        {
            title: 'Dyson V15 Detect Kablosuz Süpürge',
            categoryId: catElektronik._id,
            modelId: modelSupurge._id,
            brandId: brandDyson._id,
            image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?q=80&w=400',
            price: 24500,
            stock: 15,
            moq: 2, // Minimum sipariş adedi
            desc: 'Lazer aydınlatmalı ve akıllı emiş gücü ayarlı kablosuz dikey süpürge.'
        },
        {
            title: 'Xiaomi Redmi Note 13 Pro 256GB',
            categoryId: catElektronik._id,
            modelId: modelTelefon._id,
            brandId: brandXiaomi._id,
            image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=400',
            price: 14500,
            stock: 45,
            desc: '200 MP kamera ve AMOLED ekran özellikli akıllı telefon.'
        },
        {
            title: 'Karaca Hatır Hüp Türk Kahve Makinesi',
            categoryId: catMutfak._id,
            modelId: modelKahveci._id,
            brandId: brandKaraca._id,
            image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=400',
            price: 2100,
            stock: 60,
            desc: 'Köz tadında ağır ağır pişirme ve taşma önleyici akıllı sensör.'
        },
        {
            title: 'Stanley Trigger Action Seyahat Bardağı 0.47 L',
            categoryId: catMutfak._id,
            modelId: modelTermos._id,
            brandId: brandStanley._id,
            image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=400',
            price: 1100,
            stock: 150,
            desc: 'Tek elle açılıp kapanabilen sızdırmaz seyahat bardağı.'
        },
        {
            title: 'Dyson Airwrap Multi-Styler Saç Şekillendirici',
            categoryId: catBakim._id, // Kişisel Bakım
            modelId: modelAirwrap._id,
            brandId: brandDyson._id,
            image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=400',
            price: 18900,
            stock: 20,
            desc: 'Aşırı ısı olmadan Coanda etkisiyle saçları şekillendirir ve kurutur.'
        },
        {
            title: 'Xiaomi Roborock S8 Akıllı Robot Süpürge',
            categoryId: catElektronik._id,
            modelId: modelRobot._id,
            brandId: brandXiaomi._id,
            image: 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?q=80&w=400',
            price: 21500,
            stock: 30,
            desc: '6000 Pa emiş gücü ve çift fırçalı derinlemesine zemin temizliği.'
        },
        {
            title: 'Karaca Bio Granit Tost Makinesi',
            categoryId: catMutfak._id,
            modelId: modelTost._id,
            brandId: brandKaraca._id,
            image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?q=80&w=400',
            price: 2400,
            stock: 80,
            desc: 'Granit kaplama plakalar ve 180 derece açılabilen gövde.'
        },
        // Sayfa 2
        {
            title: 'Stanley Adventure Seyahat Matarası 0.23 L',
            categoryId: catMutfak._id,
            modelId: modelTermos._id,
            brandId: brandStanley._id,
            image: 'https://images.unsplash.com/photo-1619551486243-15e078b5463f?q=80&w=400',
            price: 950,
            stock: 90,
            desc: 'Paslanmaz çelik, sızdırmaz cep tipi klasik matara.'
        },
        {
            title: 'Dyson Purifier Hot+Cool Hava Temizleyici',
            categoryId: catElektronik._id,
            modelId: modelSupurge._id,
            brandId: brandDyson._id,
            image: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?q=80&w=400',
            price: 28500,
            stock: 10,
            desc: 'HEPA filtreli hava temizleme, ısıtma ve vantilatör özellikli cihaz.'
        },
        {
            title: 'Xiaomi 20000mAh Hızlı Şarj Powerbank',
            categoryId: catElektronik._id,
            modelId: modelPowerbank._id,
            brandId: brandXiaomi._id,
            image: 'https://images.unsplash.com/photo-1609592424085-f5b244799017?q=80&w=400',
            price: 1200,
            stock: 200,
            desc: 'Çift USB çıkışlı 18W hızlı şarj destekli taşınabilir batarya.'
        },
        {
            title: 'Karaca Çelik Çaydanlık Takımı',
            categoryId: catMutfak._id,
            modelId: modelTeapot._id,
            brandId: brandKaraca._id,
            image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=400',
            price: 1550,
            stock: 70,
            desc: 'Paslanmaz çelik gövde ve ısıya dayanıklı kulp tasarımı.'
        },
        {
            title: 'Philips Airfryer XXL Fritöz',
            categoryId: catMutfak._id,
            modelId: modelAirfryer._id,
            brandId: brandPhilips._id,
            image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=400',
            price: 7400,
            stock: 40,
            desc: 'Sıcak hava sirkülasyonu ile yağsız çıtır pişirme teknolojisi.'
        },
        {
            title: 'Philips Daily Collection Blender',
            categoryId: catMutfak._id,
            modelId: modelBlender._id,
            brandId: brandPhilips._id,
            image: 'https://images.unsplash.com/photo-1578643463396-0997cb5328c1?q=80&w=400',
            price: 2200,
            stock: 110,
            desc: 'Cam sürahili, buz kırma özellikli güçlü mutfak blenderı.'
        },
        {
            title: 'Apple iPhone 15 Pro 128GB',
            categoryId: catElektronik._id,
            modelId: modelTelefon._id,
            brandId: brandApple._id,
            image: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=400',
            price: 69900,
            stock: 25,
            desc: 'Titanyum kasa tasarımı, A17 Pro çip ve profesyonel kamera sistemi.'
        },
        {
            title: 'Apple iPad Air 5. Nesil',
            categoryId: catElektronik._id,
            modelId: modelTablet._id,
            brandId: brandApple._id,
            image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=400',
            price: 24500,
            stock: 35,
            desc: 'Apple M1 çipli, Liquid Retina ekranlı ultra taşınabilir tablet.'
        },
        // Sayfa 3
        {
            title: 'Apple AirPods Pro 2. Nesil',
            categoryId: catSes._id, // Ses Sistemleri
            modelId: modelAirPods._id,
            brandId: brandApple._id,
            image: 'https://images.unsplash.com/photo-1588449668365-d15e397f6787?q=80&w=400',
            price: 8200,
            stock: 100,
            desc: 'Aktif gürültü engelleme ve adaptif şeffaf mod özellikli kulaklık.'
        },
        {
            title: 'Samsung Galaxy S24 Ultra 512GB',
            categoryId: catElektronik._id,
            modelId: modelTelefon._id,
            brandId: brandSamsung._id,
            image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=400',
            price: 68900,
            stock: 18,
            desc: 'Entegre S-Pen, yapay zeka fotoğraf özellikleri ve titanyum gövde.'
        },
        {
            title: 'Samsung 55 inç 4K Ultra HD Smart TV',
            categoryId: catElektronik._id,
            modelId: modelTV._id,
            brandId: brandSamsung._id,
            image: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?q=80&w=400',
            price: 22400,
            stock: 12,
            desc: 'QLED ekran teknolojisi ve dahili uydu alıcılı akıllı televizyon.'
        },
        {
            title: 'JBL Flip 6 Bluetooth Hoparlör',
            categoryId: catSes._id, // Ses Sistemleri
            modelId: modelSpeaker._id,
            brandId: brandJbl._id,
            image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?q=80&w=400',
            price: 4500,
            stock: 85,
            desc: 'Suya ve toza dayanıklı IP67 gövdeli taşınabilir kablosuz hoparlör.'
        },
        {
            title: 'JBL Tune 510BT Kablosuz Kulaklık',
            categoryId: catSes._id, // Ses Sistemleri
            modelId: modelAirPods._id,
            brandId: brandJbl._id,
            image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=400',
            price: 1850,
            stock: 140,
            desc: '40 saate kadar pil ömrü ve saf bas ses kalitesine sahip kulaklık.'
        },
        {
            title: 'Philips Sonicare Şarjlı Diş Fırçası',
            categoryId: catBakim._id, // Kişisel Bakım
            modelId: modelToothbrush._id,
            brandId: brandPhilips._id,
            image: 'https://images.unsplash.com/photo-1559599141-3815480a827b?q=80&w=400',
            price: 2950,
            stock: 95,
            desc: 'Sonik temizleme teknolojisi ile plakları derinlemesine temizler.'
        },
        {
            title: 'Xiaomi Redmi Buds 5 Kulaklık',
            categoryId: catSes._id, // Ses Sistemleri
            modelId: modelAirPods._id,
            brandId: brandXiaomi._id,
            image: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?q=80&w=400',
            price: 950,
            stock: 160,
            desc: 'Aktif gürültü engelleme (ANC) ve ergonomik silikonlu tasarım.'
        },
        {
            title: 'Philips Azur Buharlı Ütü',
            categoryId: catElektronik._id,
            modelId: modelIron._id,
            brandId: brandPhilips._id,
            image: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?q=80&w=400',
            price: 3800,
            stock: 50,
            desc: 'SteamGlide Elite tabanlı, yüksek buhar çıkış gücüne sahip ütü.'
        }
    ];

    // Ürünleri tek tek oluşturup kaydet
    productsData.push(
        {
            title: 'Karaca PowerSteel Tencere Seti 8 Parca',
            categoryId: catKucukEv._id,
            modelId: modelTeapot._id,
            brandId: brandKaraca._id,
            image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=400',
            price: 5200,
            stock: 55,
            desc: 'Paslanmaz celik govdeli, bayi satisina uygun aile boy tencere seti.'
        },
        {
            title: 'Philips Filtre Kahve Makinesi',
            categoryId: catKucukEv._id,
            modelId: modelKahveci._id,
            brandId: brandPhilips._id,
            image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=400',
            price: 3100,
            stock: 72,
            desc: 'Gunluk kullanim icin damlatma sistemli filtre kahve makinesi.'
        },
        {
            title: 'Karaca Caysever Konusur Cay Makinesi',
            categoryId: catKucukEv._id,
            modelId: modelTeapot._id,
            brandId: brandKaraca._id,
            image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=400',
            price: 3600,
            stock: 38,
            desc: 'Otomatik demleme ve sicak tutma ozellikli cay makinesi.'
        },
        {
            title: 'Samsung Galaxy A55 256GB',
            categoryId: catTelefonTablet._id,
            modelId: modelTelefon._id,
            brandId: brandSamsung._id,
            image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=400',
            price: 22400,
            stock: 42,
            desc: 'AMOLED ekranli, yuksek depolamali orta segment akilli telefon.'
        },
        {
            title: 'Xiaomi Smart Band 8',
            categoryId: catAksesuar._id,
            modelId: modelPowerbank._id,
            brandId: brandXiaomi._id,
            image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?q=80&w=400',
            price: 1450,
            stock: 180,
            desc: 'Spor ve saglik takibi icin hafif akilli bileklik.'
        },
        {
            title: 'Apple Watch SE 2. Nesil',
            categoryId: catAksesuar._id,
            modelId: modelTablet._id,
            brandId: brandApple._id,
            image: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?q=80&w=400',
            price: 12900,
            stock: 28,
            desc: 'Gunluk takip ve bildirim ihtiyaclari icin akilli saat.'
        },
        {
            title: 'Lenovo Tab M10 64GB Tablet',
            categoryId: catTelefonTablet._id,
            modelId: modelTablet._id,
            brandId: brandSamsung._id,
            image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=400',
            price: 7800,
            stock: 64,
            desc: 'Egitim ve is kullanimi icin uygun fiyatli tablet.'
        },
        {
            title: 'Xiaomi Robot Vacuum Mop 2 Pro',
            categoryId: catTemizlik._id,
            modelId: modelRobot._id,
            brandId: brandXiaomi._id,
            image: 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?q=80&w=400',
            price: 16400,
            stock: 18,
            desc: 'Haritalama ve mop ozellikli robot supurge.'
        },
        {
            title: 'Dyson V12 Detect Slim',
            categoryId: catTemizlik._id,
            modelId: modelSupurge._id,
            brandId: brandDyson._id,
            image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?q=80&w=400',
            price: 27900,
            stock: 9,
            moq: 2,
            desc: 'Hafif govdeli, lazer toz algilama teknolojili kablosuz supurge.'
        },
        {
            title: 'JBL Go 3 Bluetooth Hoparlor',
            categoryId: catSes._id,
            modelId: modelSpeaker._id,
            brandId: brandJbl._id,
            image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?q=80&w=400',
            price: 1850,
            stock: 125,
            desc: 'Kompakt tasarimli, suya dayanikli tasinabilir hoparlor.'
        },
        {
            title: 'Apple AirPods 3. Nesil',
            categoryId: catSes._id,
            modelId: modelAirPods._id,
            brandId: brandApple._id,
            image: 'https://images.unsplash.com/photo-1588449668365-d15e397f6787?q=80&w=400',
            price: 6900,
            stock: 58,
            desc: 'Uzamsal ses destekli kablosuz kulaklik.'
        },
        {
            title: 'Philips 5000 Serisi Sac Kurutma Makinesi',
            categoryId: catBakim._id,
            modelId: modelAirwrap._id,
            brandId: brandPhilips._id,
            image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=400',
            price: 2750,
            stock: 46,
            desc: 'Iyon bakimli, hizli kurutma ozellikli sac kurutma makinesi.'
        }
    );

    productsData.push(
        {
            title: 'Stanley Legendary Classic Bottle 1.9 L',
            categoryId: catAksesuar._id,
            modelId: modelTermos._id,
            brandId: brandStanley._id,
            image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=400',
            price: 2450,
            stock: 74,
            moq: 4,
            desc: 'Uzun sure sicak ve soguk koruma sunan buyuk hacimli termos.'
        },
        {
            title: 'Stanley Quick Flip Su Matarasi 0.7 L',
            categoryId: catAksesuar._id,
            modelId: modelTermos._id,
            brandId: brandStanley._id,
            image: 'https://images.unsplash.com/photo-1619551486243-15e078b5463f?q=80&w=400',
            price: 1250,
            stock: 118,
            desc: 'Spor ve gunluk kullanim icin kapakli tasinabilir matara.'
        },
        {
            title: 'Dyson V11 Absolute Kablosuz Supurge',
            categoryId: catTemizlik._id,
            modelId: modelSupurge._id,
            brandId: brandDyson._id,
            image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?q=80&w=400',
            price: 23900,
            stock: 16,
            moq: 2,
            desc: 'Yuksek emiş gucu ve uzun pil omruyle kablosuz dikey supurge.'
        },
        {
            title: 'Dyson Supersonic Sac Kurutma Makinesi',
            categoryId: catBakim._id,
            modelId: modelAirwrap._id,
            brandId: brandDyson._id,
            image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=400',
            price: 17400,
            stock: 14,
            desc: 'Isı kontrol teknolojili profesyonel sac kurutma makinesi.'
        },
        {
            title: 'Xiaomi Redmi Note 13 128GB',
            categoryId: catTelefonTablet._id,
            modelId: modelTelefon._id,
            brandId: brandXiaomi._id,
            image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=400',
            price: 11200,
            stock: 86,
            desc: 'AMOLED ekranli, yuksek pil kapasiteli akilli telefon.'
        },
        {
            title: 'Xiaomi Pad 6 128GB Tablet',
            categoryId: catTelefonTablet._id,
            modelId: modelTablet._id,
            brandId: brandXiaomi._id,
            image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=400',
            price: 13900,
            stock: 39,
            desc: 'Is ve eglence kullanimi icin genis ekranli tablet.'
        },
        {
            title: 'Xiaomi 33W Powerbank 20000 mAh',
            categoryId: catAksesuar._id,
            modelId: modelPowerbank._id,
            brandId: brandXiaomi._id,
            image: 'https://images.unsplash.com/photo-1609592424085-f5b244799017?q=80&w=400',
            price: 1550,
            stock: 170,
            desc: 'Hizli sarj destekli yuksek kapasiteli tasinabilir batarya.'
        },
        {
            title: 'Karaca Hatir Plus Kahve Makinesi',
            categoryId: catKucukEv._id,
            modelId: modelKahveci._id,
            brandId: brandKaraca._id,
            image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=400',
            price: 2950,
            stock: 66,
            desc: 'Turk kahvesi ve sutlu icecekler icin cok fonksiyonlu makine.'
        },
        {
            title: 'Karaca Bio Diamond Tava Seti',
            categoryId: catMutfak._id,
            modelId: modelTost._id,
            brandId: brandKaraca._id,
            image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=400',
            price: 2650,
            stock: 92,
            desc: 'Granit kaplamali, cizilmeye dayanikli tava seti.'
        },
        {
            title: 'Philips 3000 Serisi Airfryer',
            categoryId: catKucukEv._id,
            modelId: modelAirfryer._id,
            brandId: brandPhilips._id,
            image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=400',
            price: 5200,
            stock: 57,
            desc: 'Az yag ile pisirme icin kompakt sicak hava fritozu.'
        },
        {
            title: 'Philips ProMix El Blender Seti',
            categoryId: catKucukEv._id,
            modelId: modelBlender._id,
            brandId: brandPhilips._id,
            image: 'https://images.unsplash.com/photo-1578643463396-0997cb5328c1?q=80&w=400',
            price: 2750,
            stock: 82,
            desc: 'Coklu baslikli, gunluk mutfak kullanimi icin blender seti.'
        },
        {
            title: 'Philips Sonicare ProtectiveClean',
            categoryId: catBakim._id,
            modelId: modelToothbrush._id,
            brandId: brandPhilips._id,
            image: 'https://images.unsplash.com/photo-1559599141-3815480a827b?q=80&w=400',
            price: 3450,
            stock: 61,
            desc: 'Basinc sensorlu sarjli dis fircasi.'
        },
        {
            title: 'Apple iPhone 14 128GB',
            categoryId: catTelefonTablet._id,
            modelId: modelTelefon._id,
            brandId: brandApple._id,
            image: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=400',
            price: 48900,
            stock: 22,
            desc: 'A15 Bionic cipli, cift kamera sistemli akilli telefon.'
        },
        {
            title: 'Apple iPad 10. Nesil 64GB',
            categoryId: catTelefonTablet._id,
            modelId: modelTablet._id,
            brandId: brandApple._id,
            image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=400',
            price: 17900,
            stock: 34,
            desc: 'Genis ekranli, egitim ve is kullanimina uygun iPad.'
        },
        {
            title: 'Samsung Galaxy Tab A9 Plus',
            categoryId: catTelefonTablet._id,
            modelId: modelTablet._id,
            brandId: brandSamsung._id,
            image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=400',
            price: 9200,
            stock: 48,
            desc: 'Gunluk kullanim ve bayi satisi icin Android tablet.'
        },
        {
            title: 'Samsung 65 inc Crystal UHD TV',
            categoryId: catElektronik._id,
            modelId: modelTV._id,
            brandId: brandSamsung._id,
            image: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?q=80&w=400',
            price: 32900,
            stock: 11,
            desc: 'Buyuk ekranli 4K smart televizyon.'
        },
        {
            title: 'Samsung 10000 mAh Powerbank',
            categoryId: catAksesuar._id,
            modelId: modelPowerbank._id,
            brandId: brandSamsung._id,
            image: 'https://images.unsplash.com/photo-1609592424085-f5b244799017?q=80&w=400',
            price: 1150,
            stock: 150,
            desc: 'Ince tasarimli, hizli sarj destekli powerbank.'
        },
        {
            title: 'JBL Charge 5 Bluetooth Hoparlor',
            categoryId: catSes._id,
            modelId: modelSpeaker._id,
            brandId: brandJbl._id,
            image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?q=80&w=400',
            price: 6200,
            stock: 49,
            desc: 'Guclu bass ve uzun pil omru sunan tasinabilir hoparlor.'
        },
        {
            title: 'JBL Wave Buds Kablosuz Kulaklik',
            categoryId: catSes._id,
            modelId: modelAirPods._id,
            brandId: brandJbl._id,
            image: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?q=80&w=400',
            price: 1450,
            stock: 104,
            desc: 'Gunluk kullanim icin kompakt kablosuz kulaklik.'
        },
        {
            title: 'Xiaomi Mi True Wireless Earbuds',
            categoryId: catSes._id,
            modelId: modelAirPods._id,
            brandId: brandXiaomi._id,
            image: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?q=80&w=400',
            price: 1250,
            stock: 132,
            desc: 'Bluetooth baglantili, tasinabilir sarj kutulu kulaklik.'
        },
        {
            title: 'Philips PerfectCare Buhar Kazanli Utu',
            categoryId: catTemizlik._id,
            modelId: modelIron._id,
            brandId: brandPhilips._id,
            image: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?q=80&w=400',
            price: 7800,
            stock: 24,
            desc: 'Yuksek buhar gucuyle profesyonel utu performansi.'
        },
        {
            title: 'Karaca Toast Plus Tost Makinesi',
            categoryId: catKucukEv._id,
            modelId: modelTost._id,
            brandId: brandKaraca._id,
            image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?q=80&w=400',
            price: 2150,
            stock: 77,
            desc: 'Genis plakali, cikarilabilir yuzeyli tost makinesi.'
        },
        {
            title: 'Stanley The IceFlow Flip Straw 0.89 L',
            categoryId: catAksesuar._id,
            modelId: modelTermos._id,
            brandId: brandStanley._id,
            image: 'https://images.unsplash.com/photo-1619551486243-15e078b5463f?q=80&w=400',
            price: 1650,
            stock: 88,
            desc: 'Pipetli kapakli, soguk icecekler icin tasinabilir termos.'
        },
        {
            title: 'Dyson Purifier Cool Gen1',
            categoryId: catTemizlik._id,
            modelId: modelSupurge._id,
            brandId: brandDyson._id,
            image: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?q=80&w=400',
            price: 21900,
            stock: 13,
            desc: 'HEPA filtreli hava temizleyici ve serinletici fan.'
        }
    );


    return productsData;
};

module.exports = { buildSeedProducts };
