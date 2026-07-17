import { promises as fs, readFileSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loadLocalEnv = () => {
  try {
    const envFile = readFileSync(path.join(__dirname, ".env"), "utf8");

    envFile.split(/\r?\n/).forEach((line) => {
      const trimmedLine = line.trim();

      if (!trimmedLine || trimmedLine.startsWith("#")) {
        return;
      }

      const separatorIndex = trimmedLine.indexOf("=");

      if (separatorIndex === -1) {
        return;
      }

      const key = trimmedLine.slice(0, separatorIndex).trim();
      const value = trimmedLine
        .slice(separatorIndex + 1)
        .trim()
        .replace(/^['"]|['"]$/g, "");

      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    });
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.warn("Local .env could not be loaded:", error.message);
    }
  }
};

loadLocalEnv();

const port = Number(process.env.PORT || 4000);
const dataFilePath = path.join(__dirname, "data", "products.json");
const siteContentFilePath = path.join(__dirname, "data", "site-content.json");
const blogPostsFilePath = path.join(__dirname, "data", "blog-posts.json");
const leadsFilePath = path.join(__dirname, "data", "leads.json");
const adminToken =
  process.env.ADMIN_TOKEN || process.env.ADMIN_PASSWORD || "ademeren-admin";
const supabaseUrl = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const isSupabaseConfigured = Boolean(supabaseUrl && supabaseServiceRoleKey);
const supabaseTables = {
  leads: process.env.SUPABASE_LEADS_TABLE || "leads",
  blogPosts: process.env.SUPABASE_BLOG_POSTS_TABLE || "blog_posts",
  products: process.env.SUPABASE_PRODUCTS_TABLE || "catalog_products",
  siteContent: process.env.SUPABASE_SITE_CONTENT_TABLE || "site_content",
};
const supabaseStorageBucket =
  process.env.SUPABASE_STORAGE_BUCKET || "product-images";
const maxUploadSize = Number(process.env.UPLOAD_MAX_BYTES || 6 * 1024 * 1024);
const imageExtensionByMime = {
  "image/avif": "avif",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const allowedImageExtensions = new Set(Object.values(imageExtensionByMime));
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const floorSource = "https://kermitfloor.com/tr/spc-parke-elit-koleksiyonu";
const wallSource = "https://kermitfloor.com/tr/spc-duvar-panelleri";
const accents = ["#ff5b3b", "#3553ff", "#12b86d", "#20242f"];

const productCategories = [
  {
    slug: "spc-parke",
    label: { en: "SPC Flooring", tr: "SPC Parke" },
    shortLabel: { en: "SPC Floors", tr: "SPC Parke" },
    description: {
      en: "Elit collection SPC flooring panels with wood looks, waterproof rigid core, and project-ready specifications for North Cyprus interiors.",
      tr: "Kuzey Kıbrıs ev, villa, ofis ve ticari projeleri için ahşap görünümlü, suya dayanıklı rijit çekirdekli Elit SPC parke panelleri.",
    },
    sourceUrl: floorSource,
  },
  {
    slug: "spc-duvar-panelleri",
    label: { en: "SPC Wall Panels", tr: "SPC Duvar Panelleri" },
    shortLabel: { en: "Wall Panels", tr: "Duvar Panelleri" },
    description: {
      en: "Large-format SPC wall panels in marble, stone, concrete, and wood looks for fast renovation in North Cyprus.",
      tr: "Kuzey Kıbrıs banyo, mutfak, ıslak hacim ve vurgu duvarları için mermer, taş, beton ve ahşap görünümlü geniş ebatlı SPC duvar panelleri.",
    },
    sourceUrl: wallSource,
  },
];

const floorSpecs = [
  { label: { en: "Thickness", tr: "Kalınlık" }, value: "5 mm / 6 mm / 7 mm" },
  { label: { en: "Wear layer", tr: "Aşınma tabakası" }, value: "0,30 mm / 0,50 mm" },
  { label: { en: "IXPE underlay", tr: "IXPE şilte" }, value: "1 mm / 1,5 mm included" },
  {
    label: { en: "Dimensions", tr: "Boyutlar" },
    value: ["177,8 x 1219,2 mm", "228,6 x 1219,2 mm"],
  },
  { label: { en: "Edge", tr: "Kenar" }, value: "Micro Bevel / V-Groove" },
  { label: { en: "Locking system", tr: "Kilit sistemi" }, value: "UniClic / I4F" },
  { label: { en: "Utility class", tr: "Kullanım sınıfı" }, value: "23 / 33" },
  { label: { en: "Material", tr: "Materyal" }, value: "SPC (Stone Polymer Composite)" },
];

const wallSpecs = [
  { label: { en: "Thickness", tr: "Kalınlık" }, value: "4 mm" },
  { label: { en: "Wear layer", tr: "Aşınma tabakası" }, value: "0,30 mm" },
  {
    label: { en: "Dimensions", tr: "Boyutlar" },
    value: ["960 mm x 2800 mm", "960 mm x 1400 mm"],
  },
  { label: { en: "Edge", tr: "Kenar" }, value: "Mikro derzli" },
  { label: { en: "Installation", tr: "Montaj" }, value: "Yapıştırma" },
  { label: { en: "Utility class", tr: "Kullanım sınıfı" }, value: "23 / 31" },
  { label: { en: "Usage area", tr: "Kullanım alanı" }, value: "Interior wall panels" },
  { label: { en: "Material", tr: "Materyal" }, value: "SPC (Stone Polymer Composite)" },
];

const floorNames = [
  ["P-201", "Bleached Oak"],
  ["P-202", "Arctic Oak"],
  ["P-203", "Sunlit Oak"],
  ["P-204", "Light Natural Oak"],
  ["P-205", "Buttermilk Oak"],
  ["P-206", "Ivory Mist Oak"],
  ["P-207", "Natural Beige Oak"],
  ["P-208", "Sand Dune Oak"],
  ["P-209", "Light Grey Oak"],
  ["P-210", "Canyon Oak"],
  ["P-211", "Cognac Oak"],
  ["P-212", "Rustic Greige Oak"],
  ["P-213", "Light Beige Oak"],
  ["P-214", "Dove Grey Oak"],
  ["P-215", "Sahara Oak"],
  ["P-216", "Harvest Oak"],
  ["P-217", "Silver Mist Oak"],
  ["P-218", "Chestnut Oak"],
  ["P-219", "Ash Grey Oak (Dark)"],
  ["P-220", "Dark Walnut Oak"],
];

const wallNames = [
  ["605", "Bardiglio Grey"],
  ["606", "Marble Anthracite"],
  ["609", "Calacatta Bianco"],
  ["610", "Marble Black"],
  ["616", "Tundra Grey"],
  ["613", "Fior di Bosco (Olive)"],
  ["604", "Anthracite Concrete"],
  ["602", "Microcement Silver"],
  ["603", "Concrete Light Grey"],
  ["601", "Concrete Grey"],
  ["611", "Statuario Bianco"],
  ["619", "Ceppo di Gre White"],
  ["614", "Ceppo di Gre Beige"],
  ["620", "Crema Marfil Beige"],
  ["608", "Travertine Grey"],
  ["607", "Travertine White Vein"],
  ["617", "Bianco Lasa"],
  ["612", "Calacatta Gold"],
  ["618", "Carrara White"],
  ["742", "Glacier Oak"],
  ["215", "Sahara Oak"],
  ["205", "Buttermilk Oak"],
  ["227", "Weathered Greige Oak"],
];

const kermitImage = (imagePath) => `https://kermitfloor.com${imagePath}`;

const slugify = (value) =>
  String(value)
    .toLocaleLowerCase("tr")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const seedProducts = [
  ...floorNames.map(([code, name], index) => ({
    slug: `${slugify(code)}-${slugify(name)}`,
    code,
    name,
    category: "spc-parke",
    categoryLabel: { en: "SPC Flooring", tr: "SPC Parke" },
    collection: { en: "Elit SPC Flooring Collection", tr: "Elit SPC Parke Koleksiyonu" },
    description: {
      en: `${name} rigid-core SPC flooring panel for North Cyprus homes, offices, showrooms, and commercial interiors.`,
      tr: `${name}, Kuzey Kıbrıs ev, villa, ofis, showroom ve ticari projeleri için rijit çekirdekli SPC parke paneli.`,
    },
    image: kermitImage(`/images/spc-flooring-elite-collection/${code}/product.jpg`),
    applicationImage: kermitImage(`/images/spc-flooring-elite-collection/${code}/application.jpg`),
    galleryImages: [
      kermitImage(`/images/spc-flooring-elite-collection/${code}/product.jpg`),
      kermitImage(`/images/spc-flooring-elite-collection/${code}/application.jpg`),
    ],
    specs: {
      en: ["5/6/7 mm", "23/33", "UniClic / I4F"],
      tr: ["5/6/7 mm", "23/33", "UniClic / I4F"],
    },
    technicalSpecs: floorSpecs,
    sourceUrl: floorSource,
    accent: accents[index % accents.length],
  })),
  ...wallNames.map(([code, name], index) => ({
    slug: `${slugify(code)}-${slugify(name)}`,
    code,
    name,
    category: "spc-duvar-panelleri",
    categoryLabel: { en: "SPC Wall Panels", tr: "SPC Duvar Panelleri" },
    collection: { en: "SPC Wall Panel Collection", tr: "SPC Duvar Paneli Koleksiyonu" },
    description: {
      en: `${name} large-format waterproof SPC wall panel for North Cyprus bathrooms, wet areas, and feature walls.`,
      tr: `${name}, Kıbrıs banyo, mutfak, ıslak hacim ve vurgu duvarları için geniş ebatlı suya dayanıklı SPC duvar paneli.`,
    },
    image: kermitImage(`/images/spc-wall-panels/${code}/product.jpg`),
    applicationImage: kermitImage(`/images/spc-wall-panels/${code}/application.jpg`),
    galleryImages: [
      kermitImage(`/images/spc-wall-panels/${code}/product.jpg`),
      kermitImage(`/images/spc-wall-panels/${code}/application.jpg`),
    ],
    specs: {
      en: ["4 mm", "960 x 2800 mm", "Glue-down"],
      tr: ["4 mm", "960 x 2800 mm", "Yapıştırma"],
    },
    technicalSpecs: wallSpecs,
    sourceUrl: wallSource,
    accent: accents[(index + 1) % accents.length],
  })),
];

const seedSiteContent = {
  contactEmail: "info@ademerendecoration.com",
  contactPhone: "+90 555 123 45 67",
  heroSlides: [
    {
      background: "/images/kermit-floor-application.jpg",
      code: "P-201",
      description: {
        en: "Bright oak SPC flooring for North Cyprus homes, showrooms, and office interiors with a clean whole-room finish.",
        tr: "Kuzey Kıbrıs ev, showroom ve ofis projeleri için ferah, bütünlüklü bir SPC parke etkisi.",
      },
      details: {
        en: ["5/7 mm thickness", "UniClic system", "Waterproof SPC core"],
        tr: ["5/7 mm kalınlık", "UniClic sistem", "Suya dayanıklı SPC çekirdek"],
      },
      kicker: {
        en: "Elit SPC Flooring",
        tr: "Elit SPC Parke",
      },
      sample: "/images/kermit-elite-p201.jpg",
      surface: {
        en: "Light matte oak",
        tr: "Açık mat meşe",
      },
      title: {
        en: "Bleached Oak",
        tr: "Bleached Oak",
      },
    },
    {
      background: "/images/kermit-wall-application.jpg",
      code: "613",
      description: {
        en: "Large-format SPC wall panel for North Cyprus bathrooms, wet areas, and feature walls without visual clutter.",
        tr: "Kıbrıs banyo, ıslak hacim ve vurgu duvarları için sade görünümlü geniş SPC panel.",
      },
      details: {
        en: ["Glue-down install", "Large wall format", "Fast renovation"],
        tr: ["Yapıştırma montaj", "Geniş duvar formatı", "Hızlı yenileme"],
      },
      kicker: {
        en: "SPC Wall Panel",
        tr: "SPC Duvar Paneli",
      },
      sample: "/images/kermit-wall-panel-613.jpg",
      surface: {
        en: "Stone wall panel",
        tr: "Taş görünümlü panel",
      },
      title: {
        en: "Waterproof wall finish",
        tr: "Suya dayanıklı SPC panel",
      },
    },
    {
      background: "/images/kermit-elite-p220.jpg",
      code: "P-220",
      description: {
        en: "A deep walnut floor tone for premium homes, offices, and hospitality projects.",
        tr: "Prestijli ev, ofis ve otel projeleri için koyu ceviz zemin tonu.",
      },
      details: {
        en: ["Matte surface", "Impact resistant", "Project finish"],
        tr: ["Mat panel dokusu", "Darbeye dayanıklı", "Proje tipi bitiş"],
      },
      kicker: {
        en: "Elit SPC Flooring",
        tr: "Elit SPC Parke",
      },
      sample: "/images/kermit-elite-p220.jpg",
      surface: {
        en: "Dark walnut oak",
        tr: "Koyu ceviz meşe",
      },
      title: {
        en: "Dark Walnut Oak",
        tr: "Dark Walnut Oak",
      },
    },
    {
      background: "/images/kermit-3d-model-a-205.jpg",
      code: "3D-205",
      description: {
        en: "Dimensional panel rhythm for walls, counters, entrances, and focal areas.",
        tr: "Duvar, banko, giriş ve odak alanları için boyutlu panel ritmi.",
      },
      details: {
        en: ["3D profile", "SPC material", "Decorative wall use"],
        tr: ["3D profil", "SPC malzeme", "Dekoratif duvar kullanımı"],
      },
      kicker: {
        en: "SPC 3D Panel",
        tr: "SPC 3D Panel",
      },
      sample: "/images/kermit-3d-model-a-205.jpg",
      surface: {
        en: "Textured panel",
        tr: "Dokulu panel",
      },
      title: {
        en: "Model A texture",
        tr: "Model A doku",
      },
    },
  ],
  whatsappMessage: {
    en: "Hello, I want information about SPC panels.",
    tr: "Merhaba, SPC paneller hakkında bilgi almak istiyorum.",
  },
  whatsappNumber: "905551234567",
};

const seedBlogPosts = [
  {
    author: "Adem Eren Decoration",
    category: "SPC Parke",
    content:
      "## SPC parke neden Kuzey Kıbrıs için güçlü bir seçenek?\n\nKuzey Kıbrıs'ta zemin seçimi yaparken nem, günlük kullanım, temizlik kolaylığı ve uygulama süresi birlikte düşünülmelidir. SPC parke, rijit mineral kompozit çekirdeği sayesinde ev, villa, ofis, mağaza ve kiralık konutlarda pratik bir zemin alternatifi sunar.\n\n## Seçim yaparken nelere bakılmalı?\n\nÜrünün kalınlığı, aşınma tabakası, kilit sistemi, şilte yapısı, renk tonu ve mevcut zeminin durumu aynı anda değerlendirilmelidir. Açık tonlar küçük mekanları daha ferah gösterebilir; koyu ceviz ve gri tonlar ise otel, ofis ve premium konutlarda daha güçlü bir etki oluşturabilir.\n\n## Uygulama öncesi kontrol listesi\n\n- Mevcut zeminin düzgünlüğü\n- Kapı altları ve geçiş profilleri\n- Süpürgelik rengi\n- Kullanım yoğunluğu\n- Numune üzerinde gün ışığı kontrolü\n\nDoğru ürün seçimi için yalnızca görsele bakmak yeterli değildir. Mekanın kullanım amacı, metrajı ve mevcut yüzey durumu netleştiğinde teklif ve uygulama planı daha sağlıklı çıkar.",
    coverImage: "/images/kermit-floor-application.jpg",
    coverImageAlt:
      "Kuzey Kıbrıs modern iç mekanda SPC parke uygulama örneği",
    excerpt:
      "Kuzey Kıbrıs'ta SPC parke seçerken kalınlık, aşınma tabakası, nem dayanımı, renk tonu ve uygulama hazırlığı nasıl değerlendirilir?",
    focusKeyword: "SPC parke Kıbrıs",
    publishedAt: "2026-01-08T09:00:00.000Z",
    readingTime: 3,
    seoDescription:
      "Kuzey Kıbrıs'ta SPC parke seçimi için kalınlık, aşınma tabakası, renk, nem dayanımı, zemin hazırlığı ve uygulama süreci hakkında pratik rehber.",
    seoTitle: "Kuzey Kıbrıs'ta SPC Parke Seçerken Nelere Bakılmalı?",
    slug: "kuzey-kibris-spc-parke-secimi",
    status: "published",
    tags: ["SPC parke", "SPC zemin kaplama", "Kuzey Kıbrıs dekorasyon"],
    title: "Kuzey Kıbrıs'ta SPC Parke Seçerken Nelere Bakılmalı?",
    updatedAt: "2026-01-08T09:00:00.000Z",
  },
  {
    author: "Adem Eren Decoration",
    category: "SPC Duvar Paneli",
    content:
      "## Banyo yenilemede SPC panel nasıl planlanır?\n\nSPC duvar paneli, banyo ve ıslak hacimlerde mermer, taş veya beton görünümünü daha temiz bir yenileme süreciyle elde etmek isteyen projelerde değerlendirilir. Uygulama öncesinde mevcut yüzeyin sağlamlığı, ölçüler, köşe detayları ve panel birleşimleri kontrol edilmelidir.\n\n## Doğru paneli seçmek\n\nBanyoda kullanılacak panelin rengi kadar desen yönü ve ölçüsü de önemlidir. Geniş ebatlı paneller daha az derz görünümü verir. Marble sheet veya SPC seramik görünümü isteyen projelerde panelin lavabo, duş alanı ve nişlerle ilişkisi önceden planlanmalıdır.\n\n## Süreci hızlandıran bilgiler\n\n- Banyonun fotoğrafları\n- Yaklaşık duvar ölçüleri\n- Mevcut seramik veya sıva durumu\n- İstenen mermer, taş veya sade panel görünümü\n- Duş alanı ve lavabo arkasındaki detaylar\n\nBu bilgilerle panel numunesi, metraj ve uygulama sırası daha doğru belirlenir.",
    coverImage: "/images/kermit-wall-application.jpg",
    coverImageAlt:
      "Kuzey Kıbrıs banyo yenileme için SPC duvar paneli uygulaması",
    excerpt:
      "SPC duvar paneli ile banyo yenilerken mevcut yüzey, ölçü, desen yönü, köşe bitişleri ve uygulama sırası nasıl planlanır?",
    focusKeyword: "SPC duvar paneli Kıbrıs",
    publishedAt: "2026-01-15T09:00:00.000Z",
    readingTime: 3,
    seoDescription:
      "Kuzey Kıbrıs'ta SPC duvar paneli ile banyo yenileme süreci: panel seçimi, ölçü, yüzey kontrolü, köşe detayları ve numune planlama.",
    seoTitle: "SPC Duvar Paneli ile Banyo Yenileme Süreci",
    slug: "spc-duvar-paneli-banyo-yenileme-sureci",
    status: "published",
    tags: ["SPC duvar paneli", "banyo paneli", "marble sheet"],
    title: "SPC Duvar Paneli ile Banyo Yenileme Süreci",
    updatedAt: "2026-01-15T09:00:00.000Z",
  },
  {
    author: "Adem Eren Decoration",
    category: "Dekorasyon Rehberi",
    content:
      "## Marble sheet hangi projelerde tercih edilir?\n\nMarble sheet, mermer etkisi istenen ama klasik seramik kırımı ve ağır uygulama süreci tercih edilmeyen iç mekanlarda öne çıkar. Lefkoşa ve Girne'deki banyo, mutfak, resepsiyon duvarı, TV arkası ve ticari mekan yenilemelerinde güçlü bir vurgu yüzeyi oluşturabilir.\n\n## Nerede dikkatli kullanmak gerekir?\n\nHer yüzey aynı uygulama koşuluna sahip değildir. Nem, mevcut duvar sağlamlığı, köşe dönüşleri, priz yerleri ve panel ölçüleri uygulama öncesi değerlendirilmelidir. Büyük desenli mermer görünümlerinde panel devamlılığı ve desen yönü tasarımın kalitesini belirler.\n\n## İç mekan bütünlüğü\n\nMarble sheet tek başına seçilmemelidir. SPC parke rengi, dekoratif çıta, aydınlatma ve mobilya tonu ile birlikte düşünülürse sonuç daha profesyonel görünür. Bu yüzden numune karşılaştırması gerçek mekan ışığında yapılmalıdır.",
    coverImage: "/images/kermit-wall-panel-613.jpg",
    coverImageAlt:
      "Lefkoşa ve Girne iç mekanlarında marble sheet duvar paneli örneği",
    excerpt:
      "Marble sheet; banyo, mutfak, resepsiyon duvarı ve TV arkası gibi alanlarda nasıl seçilir ve hangi detaylarla birlikte planlanır?",
    focusKeyword: "marble sheet Kıbrıs",
    publishedAt: "2026-01-22T09:00:00.000Z",
    readingTime: 3,
    seoDescription:
      "Lefkoşa ve Girne dekorasyon projelerinde marble sheet kullanımı, panel ölçüsü, desen yönü, nem kontrolü ve iç mekan bütünlüğü hakkında rehber.",
    seoTitle: "Lefkoşa ve Girne Dekorasyon Projelerinde Marble Sheet",
    slug: "lefkosa-girne-marble-sheet-kullanimi",
    status: "published",
    tags: ["marble sheet", "Lefkoşa dekorasyon", "Girne dekorasyon"],
    title: "Lefkoşa ve Girne Dekorasyon Projelerinde Marble Sheet Kullanımı",
    updatedAt: "2026-01-22T09:00:00.000Z",
  },
  {
    author: "Adem Eren Decoration",
    category: "SPC Zemin Kaplama",
    content:
      "## SPC zemin kaplama ile laminat parke nasıl ayrılır?\n\nKuzey Kıbrıs'ta zemin seçimi yaparken en çok karşılaştırılan iki seçenek SPC zemin kaplama ve laminat parkedir. Laminat parke ahşap bazlı yapısıyla sıcak bir görünüm verir; SPC zemin kaplama ise rijit mineral kompozit çekirdeğiyle nem, yoğun kullanım ve temizlenebilirlik açısından güçlü bir alternatif oluşturur.\n\n## Hangi projede hangisi düşünülmeli?\n\nEv, villa, ofis, mağaza ve kiralık konut gibi alanlarda günlük kullanım yoğunluğu değişir. Banyo yakınları, mutfak geçişleri, giriş alanları ve ticari mekanlarda suya dayanıklı yüzey ihtiyacı daha fazla olduğu için SPC zemin kaplama öne çıkar.\n\n## Karar vermeden önce kontrol edin\n\n- Mevcut zeminin düzgünlüğü\n- Kullanım yoğunluğu\n- Nem ve temizlik ihtiyacı\n- Süpürgelik ve kapı geçişleri\n- Numunenin gün ışığındaki rengi\n\nDoğru karar, yalnızca ürün görseline değil mekanın gerçek kullanım koşullarına göre verilmelidir.",
    coverImage: "/images/kermit-elite-p220.jpg",
    coverImageAlt:
      "Kuzey Kıbrıs SPC zemin kaplama ve laminat parke karşılaştırması",
    excerpt:
      "SPC zemin kaplama ve laminat parke arasındaki farkları Kuzey Kıbrıs ev, ofis, mağaza ve kiralık konut projeleri için değerlendirin.",
    focusKeyword: "SPC zemin kaplama Kıbrıs",
    publishedAt: "2026-01-29T09:00:00.000Z",
    readingTime: 3,
    seoDescription:
      "SPC zemin kaplama Kıbrıs projelerinde laminat parke ile nasıl karşılaştırılır? Nem, kullanım yoğunluğu, zemin hazırlığı ve numune seçimi.",
    seoTitle: "SPC Zemin Kaplama mı Laminat Parke mi?",
    slug: "spc-zemin-kaplama-laminat-parke-farki",
    status: "published",
    tags: ["SPC zemin kaplama", "laminat parke", "Kıbrıs zemin kaplama"],
    title: "SPC Zemin Kaplama mı Laminat Parke mi?",
    updatedAt: "2026-01-29T09:00:00.000Z",
  },
  {
    author: "Adem Eren Decoration",
    category: "SPC Seramik",
    content:
      "## SPC seramik ne anlama gelir?\n\nSPC seramik, seramik ya da taş görünümü isteyen ama daha pratik yüzey çözümlerini araştıran müşterilerin kullandığı önemli bir arama niyetidir. Bu kavram çoğu projede SPC panel, marble sheet veya seramik görünümlü zemin-duvar kaplamaları ile birlikte değerlendirilir.\n\n## Nerelerde kullanılabilir?\n\nBanyo, mutfak, lavabo arkası, TV ünitesi, resepsiyon duvarı ve ticari iç mekanlarda seramik ya da mermer etkisi istenebilir. Önemli olan yalnızca desen seçmek değil; panel ölçüsü, mevcut yüzey, köşe dönüşleri ve uygulama detaylarını birlikte planlamaktır.\n\n## Numune seçerken dikkat edin\n\n- Desenin büyük ya da küçük oluşu\n- Işık altında renk değişimi\n- Duvar ve zemin uyumu\n- Islak hacim koşulları\n- Kenar ve bitiş profilleri\n\nSPC seramik görünümü, doğru yüzeyde kullanıldığında klasik seramik hissini daha modern ve temiz bir dekorasyon diliyle birleştirebilir.",
    coverImage: "/images/kermit-wall-panel-613.jpg",
    coverImageAlt:
      "Kuzey Kıbrıs SPC seramik ve mermer görünümlü panel seçimi",
    excerpt:
      "SPC seramik görünümü banyo, mutfak ve ticari alanlarda nasıl değerlendirilir? Panel, marble sheet ve yüzey seçimi rehberi.",
    focusKeyword: "SPC seramik Kıbrıs",
    publishedAt: "2026-02-05T09:00:00.000Z",
    readingTime: 3,
    seoDescription:
      "SPC seramik Kıbrıs projelerinde banyo, mutfak ve ticari alanlar için panel ölçüsü, desen yönü, marble sheet ve yüzey seçimi rehberi.",
    seoTitle: "SPC Seramik Nedir ve Nerelerde Kullanılır?",
    slug: "spc-seramik-nedir-nerelerde-kullanilir",
    status: "published",
    tags: ["SPC seramik", "marble sheet", "banyo paneli"],
    title: "SPC Seramik Nedir ve Nerelerde Kullanılır?",
    updatedAt: "2026-02-05T09:00:00.000Z",
  },
  {
    author: "Adem Eren Decoration",
    category: "Akustik Panel",
    content:
      "## Duvar paneli ile akustik panel aynı şey değildir\n\nDuvar paneli daha çok görsel yenileme, yüzey kaplama ve dekoratif vurgu için tercih edilir. Akustik panel ise ses konforu ihtiyacı olan ofis, toplantı odası, stüdyo, restoran, kafe ve otel alanlarında ayrıca değerlendirilir.\n\n## Hangi alanlarda akustik panel düşünülür?\n\nKuzey Kıbrıs'taki ticari mekanlarda yankı, konuşma netliği ve müşteri konforu önemli olabilir. Akustik panel, doğru yüzeyde ve doğru yoğunlukta kullanıldığında mekanın sadece görünümüne değil kullanım deneyimine de katkı sağlar.\n\n## Seçim sürecinde sorulacak sorular\n\n- Mekanda yankı problemi var mı?\n- Panel dekoratif mi akustik mi olmalı?\n- TV arkası, toplantı odası veya restoran duvarı mı?\n- Renk ve çıta ritmi mobilyalarla uyumlu mu?\n- Temizlik ve bakım beklentisi nedir?\n\nEn iyi sonuç, dekoratif duvar paneli ve akustik panel ihtiyaçlarının ayrı ayrı değerlendirilmesiyle alınır.",
    coverImage: "/images/ae-mission-hero.jpg",
    coverImageAlt:
      "Kuzey Kıbrıs ofis ve ticari alan için akustik panel uygulaması",
    excerpt:
      "Duvar paneli ve akustik panel arasındaki farkları ofis, restoran, kafe, otel ve toplantı odası projeleri için öğrenin.",
    focusKeyword: "akustik panel Kıbrıs",
    publishedAt: "2026-02-12T09:00:00.000Z",
    readingTime: 3,
    seoDescription:
      "Akustik panel Kıbrıs projelerinde duvar panelinden nasıl ayrılır? Ofis, restoran, kafe ve toplantı odası için ses ve dekorasyon rehberi.",
    seoTitle: "Duvar Paneli ve Akustik Panel Arasındaki Farklar",
    slug: "duvar-paneli-akustik-panel-farki",
    status: "published",
    tags: ["akustik panel", "duvar paneli", "ofis dekorasyon"],
    title: "Duvar Paneli ve Akustik Panel Arasındaki Farklar",
    updatedAt: "2026-02-12T09:00:00.000Z",
  },
  {
    author: "Adem Eren Decoration",
    category: "Dekoratif Çıta",
    content:
      "## Dekoratif çıta duvara ne katar?\n\nDekoratif çıta, düz bir duvarı daha planlı ve tamamlanmış göstermek için kullanılan güçlü bir iç mekan detaydır. MDF çıta, poliüretan çıta, bodür çıta ve lambri etkisi; salon, yatak odası, koridor, ofis ve otel alanlarında farklı sonuçlar verir.\n\n## Çıta tasarımında ölçü neden önemlidir?\n\nDuvar yüksekliği, mobilya yerleşimi, kapı-pencere çizgileri ve aydınlatma planı ölçülmeden yapılan çıta uygulamaları mekanda karmaşa oluşturabilir. Çıta aralıkları, panel ritmi ve boya rengi birlikte düşünülmelidir.\n\n## Uygulama öncesi kararlar\n\n- Dikey ya da yatay ritim\n- MDF veya poliüretan çıta seçimi\n- Duvar rengi ve boya tipi\n- TV arkası ya da yatak başı odak alanı\n- Süpürgelik ve tavan geçişleri\n\nDekoratif çıta küçük bir detay gibi görünse de doğru ölçüyle uygulandığında mekanın algısını ciddi şekilde değiştirir.",
    coverImage: "/images/ae-vision-hero.jpg",
    coverImageAlt:
      "Kuzey Kıbrıs dekoratif çıta ve lambri duvar tasarımı",
    excerpt:
      "Dekoratif çıta, MDF çıta, poliüretan çıta, bodür çıta ve lambri uygulamalarında ölçü, ritim ve renk seçimi nasıl yapılır?",
    focusKeyword: "dekoratif çıta Kıbrıs",
    publishedAt: "2026-02-19T09:00:00.000Z",
    readingTime: 3,
    seoDescription:
      "Dekoratif çıta Kıbrıs projelerinde MDF çıta, poliüretan çıta, bodür çıta ve lambri için ölçü, ritim, boya ve duvar planlama rehberi.",
    seoTitle: "Dekoratif Çıta ile Duvar Tasarımı Nasıl Planlanır?",
    slug: "dekoratif-cita-duvar-tasarimi",
    status: "published",
    tags: ["dekoratif çıta", "MDF çıta", "poliüretan çıta", "lambri"],
    title: "Dekoratif Çıta ile Duvar Tasarımı Nasıl Planlanır?",
    updatedAt: "2026-02-19T09:00:00.000Z",
  },
  {
    author: "Adem Eren Decoration",
    category: "Alçıpan Uygulama",
    content:
      "## Alçıpan uygulama dekorasyonun altyapısını hazırlar\n\nAlçıpan uygulama; bölme duvar, niş, tavan detayı, gizli ışık ve yüzey düzeltme gibi birçok iç mekan kararını etkiler. SPC panel, boya, duvar kağıdı veya dekoratif çıta uygulanacaksa alçıpan detaylarının baştan doğru planlanması gerekir.\n\n## Uygulama öncesi neler netleşmeli?\n\nElektrik noktaları, aydınlatma yerleri, klima hattı, panel bitişleri ve mobilya ölçüleri uygulamadan önce konuşulmalıdır. Aksi halde bitmiş yüzeyde tekrar müdahale gerekebilir.\n\n## Kontrol listesi\n\n- Bölme duvar veya niş ölçüsü\n- Asma tavan yüksekliği\n- Gizli ışık ve spot yerleşimi\n- Panel ya da çıta gelecek yüzeyler\n- Boya ve son yüzey takvimi\n\nAlçıpan sadece yapı işi değil, dekorasyon sonucunu doğrudan belirleyen bir planlama aşamasıdır.",
    coverImage: "/images/ae-alcipan-uygulama.jpg",
    coverImageAlt:
      "Kuzey Kıbrıs alçıpan uygulama ve asma tavan hazırlığı",
    excerpt:
      "Alçıpan uygulama öncesinde bölme duvar, niş, gizli ışık, panel bitişleri ve elektrik detayları nasıl planlanmalı?",
    focusKeyword: "alçıpan uygulama Kıbrıs",
    publishedAt: "2026-02-26T09:00:00.000Z",
    readingTime: 3,
    seoDescription:
      "Alçıpan uygulama Kıbrıs projelerinde bölme duvar, niş, gizli ışık, asma tavan, elektrik ve panel bitişleri için planlama rehberi.",
    seoTitle: "Alçıpan Uygulama Öncesi Bilinmesi Gerekenler",
    slug: "alcipan-uygulama-oncesi-bilinmesi-gerekenler",
    status: "published",
    tags: ["alçıpan uygulama", "asma tavan", "gizli ışık"],
    title: "Alçıpan Uygulama Öncesi Bilinmesi Gerekenler",
    updatedAt: "2026-02-26T09:00:00.000Z",
  },
  {
    author: "Adem Eren Decoration",
    category: "Asma Tavan",
    content:
      "## Asma tavan yalnızca dekoratif bir detay değildir\n\nAsma tavan, mekanın ışık dağılımını, tavan yüksekliği algısını ve duvar-zemin ilişkisini etkiler. Kuzey Kıbrıs'ta ev, villa, ofis, mağaza ve otel projelerinde asma tavan planı yapılırken aydınlatma ve uygulama sırası birlikte düşünülmelidir.\n\n## Gizli ışık nerede kullanılmalı?\n\nGizli ışık salon, yatak odası, koridor, resepsiyon ve showroom alanlarında sıcak bir atmosfer oluşturabilir. Ancak her tavanda aynı detay doğru olmayabilir. Tavan yüksekliği, mobilya yerleşimi ve bakım ihtiyacı dikkate alınmalıdır.\n\n## Uygulama öncesi dikkat edilecekler\n\n- Tavan yüksekliği\n- Spot ve LED hatları\n- Klima, perde ve dolap ilişkisi\n- Alçıpan birleşimleri\n- Boya ve son yüzey sırası\n\nAsma tavan iyi planlandığında mekan daha düzenli, aydınlatma daha kontrollü ve dekorasyon dili daha bütünlüklü görünür.",
    coverImage: "/images/ae-alcipan-uygulama.jpg",
    coverImageAlt:
      "Kuzey Kıbrıs asma tavan ve gizli ışık dekorasyon uygulaması",
    excerpt:
      "Asma tavan, gizli ışık ve spot yerleşimi ev, ofis, mağaza ve otel projelerinde nasıl planlanmalı?",
    focusKeyword: "asma tavan Kıbrıs",
    publishedAt: "2026-03-04T09:00:00.000Z",
    readingTime: 3,
    seoDescription:
      "Asma tavan Kıbrıs projelerinde gizli ışık, spot, tavan yüksekliği, klima ve alçıpan detayları için dekorasyon planlama rehberi.",
    seoTitle: "Asma Tavan ve Gizli Işık Planlama Rehberi",
    slug: "asma-tavan-gizli-isik-planlama-rehberi",
    status: "published",
    tags: ["asma tavan", "gizli ışık", "alçıpan"],
    title: "Asma Tavan ve Gizli Işık Planlama Rehberi",
    updatedAt: "2026-03-04T09:00:00.000Z",
  },
  {
    author: "Adem Eren Decoration",
    category: "İskele Dekorasyon",
    content:
      "## İskele'de yeni konut dekorasyonu nasıl ele alınmalı?\n\nİskele bölgesinde yeni konut, villa ve sahil evi projelerinde malzeme seçimi teslim sonrası kullanım alışkanlıklarına göre yapılmalıdır. SPC parke, SPC duvar paneli, marble sheet ve dekoratif çıta kararları aynı anda düşünülürse mekan daha bütünlüklü olur.\n\n## Sahil koşulları neden önemli?\n\nNem, temizlik sıklığı, kiralık kullanım ve hızlı yenileme ihtiyacı yüzey seçimini etkiler. Bu nedenle banyo, mutfak, giriş alanı ve salon zeminleri ayrı ayrı değerlendirilmelidir.\n\n## Başlamadan önce hazırlayın\n\n- Daire veya villa planı\n- Banyo ve mutfak fotoğrafları\n- İstenen renk/doku örnekleri\n- Zemin ve duvar metrajı\n- Teslim ve taşınma takvimi\n\nİskele dekorasyon projelerinde doğru planlama, yeni konutu daha hızlı ve daha kullanışlı hale getirir.",
    coverImage: "/images/ae-vision-hero.jpg",
    coverImageAlt:
      "İskele yeni konut dekorasyonu için SPC panel ve zemin seçimi",
    excerpt:
      "İskele yeni konut, villa ve sahil evi projelerinde SPC parke, duvar paneli, marble sheet ve dekoratif çıta nasıl planlanır?",
    focusKeyword: "İskele dekorasyon",
    publishedAt: "2026-03-11T09:00:00.000Z",
    readingTime: 3,
    seoDescription:
      "İskele dekorasyon projelerinde yeni konut, villa ve sahil evi için SPC parke, duvar paneli, marble sheet ve çıta seçimi rehberi.",
    seoTitle: "İskele Yeni Konut Dekorasyonunda SPC Panel Seçimi",
    slug: "iskele-yeni-konut-dekorasyonu-spc-panel-secimi",
    status: "published",
    tags: ["İskele dekorasyon", "SPC panel", "villa dekorasyon"],
    title: "İskele Yeni Konut Dekorasyonunda SPC Panel Seçimi",
    updatedAt: "2026-03-11T09:00:00.000Z",
  },
  {
    author: "Adem Eren Decoration",
    category: "Gazimağusa Dekorasyon",
    content:
      "## Kiralık dairelerde dayanıklılık neden öne çıkar?\n\nGazimağusa'da kiralık daire, öğrenci evi ve apart projelerinde dekorasyon malzemeleri sık kullanıma dayanmalı, kolay temizlenmeli ve hızlı yenilenebilmelidir. SPC zemin kaplama, duvar paneli ve pratik tavan detayları bu nedenle sık değerlendirilir.\n\n## Hangi alanlar önce yenilenmeli?\n\nGiriş, salon zemini, mutfak duvarı, banyo paneli ve TV arkası gibi alanlar kiralık konutlarda ilk izlenimi belirler. Her alanı aynı anda değiştirmek şart değildir; doğru öncelik sıralaması bütçeyi daha verimli kullanır.\n\n## Malzeme seçimi için ipuçları\n\n- Açık renkler alanı ferah gösterir\n- Suya dayanıklı yüzeyler bakım yükünü azaltır\n- Duvar paneli hızlı görsel etki sağlar\n- SPC parke yoğun kullanıma uygundur\n- Kolay temizlenen yüzeyler tercih edilmelidir\n\nGazimağusa dekorasyon projelerinde hedef, dayanıklılık ve temiz görünümü aynı bütçe içinde dengelemektir.",
    coverImage: "/images/kermit-floor-application.jpg",
    coverImageAlt:
      "Gazimağusa kiralık daire dekorasyonu için SPC zemin kaplama",
    excerpt:
      "Gazimağusa kiralık daire, öğrenci evi ve apart projelerinde dayanıklı SPC zemin, duvar paneli ve pratik yüzey seçimi.",
    focusKeyword: "Gazimağusa dekorasyon",
    publishedAt: "2026-03-18T09:00:00.000Z",
    readingTime: 3,
    seoDescription:
      "Gazimağusa dekorasyon projelerinde kiralık daire ve öğrenci evleri için SPC zemin kaplama, duvar paneli ve dayanıklı malzeme rehberi.",
    seoTitle: "Gazimağusa Kiralık Daire Dekorasyonu İçin Malzemeler",
    slug: "gazimagusa-kiralik-daire-dekorasyonu",
    status: "published",
    tags: ["Gazimağusa dekorasyon", "kiralık daire", "SPC zemin kaplama"],
    title: "Gazimağusa Kiralık Daire Dekorasyonu İçin Dayanıklı Malzemeler",
    updatedAt: "2026-03-18T09:00:00.000Z",
  },
  {
    author: "Adem Eren Decoration",
    category: "Lefkoşa Dekorasyon",
    content:
      "## Ofis dekorasyonunda ilk karar yüzey planıdır\n\nLefkoşa ofis dekorasyonu yapılırken yalnızca mobilya değil zemin, duvar, tavan ve aydınlatma ilişkisi de planlanmalıdır. SPC parke, akustik panel, dekoratif çıta, alçıpan ve asma tavan kararları ofisin kullanım deneyimini doğrudan etkiler.\n\n## Ofislerde hangi yüzeyler önemlidir?\n\nToplantı odası, giriş alanı, çalışma bölümü ve yönetici odası farklı ihtiyaçlara sahiptir. Akustik konfor, kolay temizlik, marka rengi ve aydınlatma kalitesi birlikte değerlendirilmelidir.\n\n## Planlama adımları\n\n- Ofis kullanım senaryosu çıkarılır\n- Zemin ve duvar numuneleri karşılaştırılır\n- Akustik ihtiyaçlar belirlenir\n- Aydınlatma ve tavan detayları planlanır\n- Uygulama takvimi iş akışına göre yapılır\n\nLefkoşa ofis dekorasyonunda iyi sonuç, malzemeleri tek tek değil bir bütün olarak seçmekle elde edilir.",
    coverImage: "/images/ae-spc-is-sureci.jpg",
    coverImageAlt:
      "Lefkoşa ofis dekorasyonu için SPC panel ve akustik yüzey seçimi",
    excerpt:
      "Lefkoşa ofis dekorasyonunda SPC parke, akustik panel, dekoratif çıta, alçıpan ve asma tavan nasıl birlikte planlanır?",
    focusKeyword: "Lefkoşa ofis dekorasyon",
    publishedAt: "2026-03-25T09:00:00.000Z",
    readingTime: 3,
    seoDescription:
      "Lefkoşa ofis dekorasyon projelerinde SPC parke, akustik panel, dekoratif çıta, alçıpan, asma tavan ve aydınlatma planlama rehberi.",
    seoTitle: "Lefkoşa Ofis Dekorasyonunda Zemin, Duvar ve Tavan",
    slug: "lefkosa-ofis-dekorasyonu-zemin-duvar-tavan",
    status: "published",
    tags: ["Lefkoşa ofis dekorasyon", "akustik panel", "SPC parke"],
    title: "Lefkoşa Ofis Dekorasyonunda Zemin, Duvar ve Tavan Planı",
    updatedAt: "2026-03-25T09:00:00.000Z",
  },
  {
    author: "Adem Eren Decoration",
    category: "Girne Dekorasyon",
    content:
      "## Girne villa dekorasyonunda sahil etkisi düşünülmeli\n\nGirne'de villa ve sahil evi dekorasyonu yapılırken nem, ışık, manzara ve kullanım yoğunluğu malzeme seçimini etkiler. SPC parke, marble sheet, SPC duvar paneli ve dekoratif çıta gibi yüzeyler bu koşullara göre değerlendirilmelidir.\n\n## Hangi malzemeler öne çıkar?\n\nSalon ve yatak odalarında sıcak ahşap tonlu SPC parke, banyo ve mutfakta suya dayanıklı panel, giriş ve merdiven çevresinde dayanıklı yüzeyler düşünülebilir. Büyük pencereli alanlarda numune mutlaka gün ışığında incelenmelidir.\n\n## Villa projesinde karar sırası\n\n- Zemin tonu seçilir\n- Banyo ve mutfak paneli belirlenir\n- TV arkası veya vurgu duvarı planlanır\n- Çıta, lambri veya akustik detaylar eklenir\n- Tavan ve aydınlatma dili netleşir\n\nGirne villa dekorasyonunda amaç, sahil yaşamına uygun dayanıklı ama sıcak bir iç mekan oluşturmaktır.",
    coverImage: "/images/kermit-floor-application.jpg",
    coverImageAlt:
      "Girne villa dekorasyonu için SPC parke ve panel seçimi",
    excerpt:
      "Girne villa ve sahil evi dekorasyonunda nem, gün ışığı, SPC parke, marble sheet, duvar paneli ve çıta seçimi nasıl yapılır?",
    focusKeyword: "Girne villa dekorasyon",
    publishedAt: "2026-04-01T09:00:00.000Z",
    readingTime: 3,
    seoDescription:
      "Girne villa dekorasyon projelerinde sahil koşullarına uygun SPC parke, marble sheet, duvar paneli, dekoratif çıta ve tavan planlama rehberi.",
    seoTitle: "Girne Villa Dekorasyonunda Sahile Uygun Malzemeler",
    slug: "girne-villa-dekorasyonu-sahil-malzeme-secimi",
    status: "published",
    tags: ["Girne villa dekorasyon", "SPC parke", "marble sheet"],
    title: "Girne Villa Dekorasyonunda Sahile Uygun Malzeme Seçimi",
    updatedAt: "2026-04-01T09:00:00.000Z",
  },
  {
    author: "Adem Eren Decoration",
    category: "Tadilat Dekorasyon",
    content:
      "## Güzelyurt ve Lefke projelerinde pratik planlama önemlidir\n\nGüzelyurt ve Lefke'de ev tadilatı yapılırken çoğu zaman amaç tüm mekanı baştan yapmak değil, doğru yüzeyleri doğru sırayla yenilemektir. SPC parke, duvar paneli, alçıpan, asma tavan ve dekoratif çıta bu süreçte aşamalı şekilde planlanabilir.\n\n## Öncelik nasıl belirlenir?\n\nZemin çok yıpranmışsa önce SPC zemin kaplama düşünülür. Duvarlarda nem, kırık veya eski seramik varsa panel ya da alçıpan çözümü değerlendirilir. Tavan ve ışık sorunları varsa asma tavan planı proje kapsamına alınır.\n\n## Aşamalı tadilat avantajı\n\n- Bütçe daha kontrollü kullanılır\n- Öncelikli alanlar hızlı yenilenir\n- Malzeme seçimleri birlikte uyumlu kalır\n- Gereksiz kırma-dökme azaltılır\n- Sonraki etaplar daha net planlanır\n\nDoğru keşif ve numune seçimiyle küçük yenilemeler bile evin kullanım hissini ciddi şekilde değiştirebilir.",
    coverImage: "/images/ae-mission-hero.jpg",
    coverImageAlt:
      "Güzelyurt ve Lefke ev tadilatı için SPC panel ve dekorasyon planı",
    excerpt:
      "Güzelyurt ve Lefke ev tadilatı projelerinde SPC parke, duvar paneli, alçıpan, asma tavan ve çıta aşamalı nasıl planlanır?",
    focusKeyword: "Güzelyurt Lefke ev tadilatı",
    publishedAt: "2026-04-08T09:00:00.000Z",
    readingTime: 3,
    seoDescription:
      "Güzelyurt ve Lefke ev tadilatı için SPC parke, duvar paneli, alçıpan, asma tavan ve dekoratif çıta ile aşamalı dekorasyon rehberi.",
    seoTitle: "Güzelyurt ve Lefke Ev Tadilatı İçin Dekorasyon Rehberi",
    slug: "guzelyurt-lefke-ev-tadilati-dekorasyon-rehberi",
    status: "published",
    tags: ["Güzelyurt dekorasyon", "Lefke dekorasyon", "ev tadilatı"],
    title: "Güzelyurt ve Lefke Ev Tadilatı İçin Aşamalı Dekorasyon Rehberi",
    updatedAt: "2026-04-08T09:00:00.000Z",
  },
  {
    author: "Adem Eren Decoration",
    category: "Malzeme Seçimi",
    content:
      "## Panel seçimi yalnızca renk seçimi değildir\n\nSPC panel, marble sheet, akustik panel, lambri ve dekoratif çıta gibi malzemeler aynı projede kullanılabilir. Ancak her malzeme farklı bir göreve hizmet eder. Doğru seçim için mekanın kullanım amacı, nem durumu, ışık, mobilya ve bakım beklentisi birlikte değerlendirilmelidir.\n\n## Karşılaştırma nasıl yapılmalı?\n\nÖnce yüzeyin problemi tanımlanır: dekoratif görünüm mü, suya dayanıklılık mı, ses konforu mu, hızlı yenileme mi? Sonra bu ihtiyaca göre malzeme grubu seçilir. Banyo için SPC panel veya marble sheet öne çıkarken toplantı odasında akustik panel daha doğru olabilir.\n\n## Kısa karar rehberi\n\n- Islak hacim: SPC panel veya marble sheet\n- Zemin: SPC parke veya SPC zemin kaplama\n- Ses konforu: akustik panel\n- Klasik duvar etkisi: dekoratif çıta\n- Tavan ve niş: alçıpan ve asma tavan\n\nMalzemeleri doğru sırayla seçmek, hem maliyeti hem de uygulama süresini daha öngörülebilir hale getirir.",
    coverImage: "/images/ae-spc-is-sureci.jpg",
    coverImageAlt:
      "Kuzey Kıbrıs iç mekan için SPC panel marble sheet ve akustik panel seçimi",
    excerpt:
      "SPC panel, marble sheet, akustik panel, lambri ve dekoratif çıta hangi projelerde seçilmeli? Kısa malzeme karar rehberi.",
    focusKeyword: "Kuzey Kıbrıs dekorasyon malzemeleri",
    publishedAt: "2026-04-15T09:00:00.000Z",
    readingTime: 3,
    seoDescription:
      "Kuzey Kıbrıs dekorasyon malzemeleri için SPC panel, marble sheet, akustik panel, lambri, dekoratif çıta ve SPC parke seçim rehberi.",
    seoTitle: "SPC Panel, Marble Sheet ve Akustik Panel Nasıl Seçilir?",
    slug: "spc-panel-marble-sheet-akustik-panel-secimi",
    status: "published",
    tags: ["SPC panel", "marble sheet", "akustik panel", "dekoratif çıta"],
    title: "SPC Panel, Marble Sheet ve Akustik Panel Nasıl Seçilir?",
    updatedAt: "2026-04-15T09:00:00.000Z",
  },
];

const leadStatuses = ["new", "contacted", "closed"];
const blogPostStatuses = ["draft", "published"];

const toText = (value, fallback = "") =>
  typeof value === "string" ? value.trim() : fallback;

const toTextList = (value) =>
  Array.isArray(value)
    ? value.map((item) => toText(item)).filter(Boolean)
    : [];

const toUniqueTextList = (items) => Array.from(new Set(items));

const toLocalizedText = (value, fallback) => ({
  en: toText(value?.en, fallback.en),
  tr: toText(value?.tr, fallback.tr),
});

const toProductCategorySlug = (value, fallback) =>
  slugify(toText(value)) || fallback;

const toCategoryFallbackLabel = (slug) => {
  const label = slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase("tr") + part.slice(1))
    .join(" ");

  return {
    en: label || "New Category",
    tr: label || "Yeni Kategori",
  };
};

const getProductCategories = (products = seedProducts) => {
  const categoryMap = new Map();

  productCategories.forEach((category) => {
    categoryMap.set(category.slug, category);
  });

  products.forEach((product) => {
    const slug = toText(product.category);

    if (!slug || categoryMap.has(slug)) {
      return;
    }

    const fallbackLabel = toCategoryFallbackLabel(slug);
    const label = {
      en: product.categoryLabel?.en || product.collection?.en || fallbackLabel.en,
      tr: product.categoryLabel?.tr || product.collection?.tr || fallbackLabel.tr,
    };

    categoryMap.set(slug, {
      description: {
        en:
          product.description?.en ||
          `${label.en} products for North Cyprus decoration projects.`,
        tr:
          product.description?.tr ||
          `${label.tr} ürünleri Kuzey Kıbrıs dekorasyon projeleri için listelenir.`,
      },
      label,
      shortLabel: label,
      slug,
      sourceUrl: product.sourceUrl || "",
    });
  });

  return Array.from(categoryMap.values()).filter(
    (category) =>
      productCategories.some((item) => item.slug === category.slug) ||
      products.some((product) => product.category === category.slug),
  );
};

const toSpecValue = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => toText(item)).filter(Boolean);
  }

  return toText(value);
};

const toTechnicalSpecs = (value, fallback) => {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const specs = value
    .map((item) => {
      const label = toLocalizedText(item?.label, { en: "Detail", tr: "Detay" });
      const specValue = toSpecValue(item?.value);

      if (!label.en && !label.tr) {
        return null;
      }

      return {
        label,
        value:
          Array.isArray(specValue) && specValue.length === 1
            ? specValue[0]
            : specValue,
      };
    })
    .filter(Boolean);

  return specs.length ? specs : fallback;
};

const normalizeProduct = (value, index, usedSlugs) => {
  const fallback = seedProducts[index] || seedProducts[0];
  const category = toProductCategorySlug(value?.category, fallback.category);
  const categoryInfo =
    productCategories.find((item) => item.slug === category);
  const categoryLabelFallback =
    categoryInfo?.label || toCategoryFallbackLabel(category);
  const code = toText(value?.code, fallback.code || `AE-${index + 1}`);
  const name = toText(value?.name, fallback.name || code);
  const baseSlug =
    slugify(toText(value?.slug)) ||
    slugify(`${code} ${name}`) ||
    `product-${index + 1}`;
  const slugUseCount = usedSlugs.get(baseSlug) || 0;
  const slug = slugUseCount === 0 ? baseSlug : `${baseSlug}-${slugUseCount + 1}`;

  usedSlugs.set(baseSlug, slugUseCount + 1);

  const image = toText(value?.image, fallback.image);
  const applicationImage = toText(value?.applicationImage, fallback.applicationImage);
  const incomingGalleryImages = toTextList(value?.galleryImages);
  const fallbackGalleryImages = fallback.galleryImages?.length
    ? fallback.galleryImages
    : [fallback.image, fallback.applicationImage].filter(Boolean);
  const galleryImages = toUniqueTextList(
    [
      image,
      applicationImage,
      ...(incomingGalleryImages.length
        ? incomingGalleryImages
        : fallbackGalleryImages),
    ].filter(Boolean),
  );

  return {
    slug,
    code,
    name,
    category,
    categoryLabel: toLocalizedText(value?.categoryLabel, categoryLabelFallback),
    collection: toLocalizedText(
      value?.collection,
      categoryInfo?.label || fallback.collection,
    ),
    description: toLocalizedText(value?.description, fallback.description),
    image,
    applicationImage,
    galleryImages,
    specs: {
      en: toTextList(value?.specs?.en).length
        ? toTextList(value?.specs?.en)
        : fallback.specs.en,
      tr: toTextList(value?.specs?.tr).length
        ? toTextList(value?.specs?.tr)
        : fallback.specs.tr,
    },
    technicalSpecs: toTechnicalSpecs(value?.technicalSpecs, fallback.technicalSpecs),
    sourceUrl: toText(value?.sourceUrl, categoryInfo?.sourceUrl || fallback.sourceUrl),
    accent: toText(value?.accent, fallback.accent || "#20242f"),
  };
};

const normalizeProducts = (value) => {
  const usedSlugs = new Map();
  const sourceProducts = Array.isArray(value) && value.length ? value : seedProducts;

  return sourceProducts.map((product, index) =>
    normalizeProduct(product, index, usedSlugs),
  );
};

const normalizeHeroSlide = (value, index) => {
  const fallback = seedSiteContent.heroSlides[index] || seedSiteContent.heroSlides[0];

  return {
    background: toText(value?.background, fallback.background),
    code: toText(value?.code, fallback.code || `SLIDE-${index + 1}`),
    description: toLocalizedText(value?.description, fallback.description),
    details: {
      en: toTextList(value?.details?.en).length
        ? toTextList(value?.details?.en)
        : fallback.details.en,
      tr: toTextList(value?.details?.tr).length
        ? toTextList(value?.details?.tr)
        : fallback.details.tr,
    },
    kicker: toLocalizedText(value?.kicker, fallback.kicker),
    sample: toText(value?.sample, fallback.sample),
    surface: toLocalizedText(value?.surface, fallback.surface),
    title: toLocalizedText(value?.title, fallback.title),
  };
};

const normalizeSiteContent = (value) => {
  const rawSlides = Array.isArray(value?.heroSlides) && value.heroSlides.length
    ? value.heroSlides
    : seedSiteContent.heroSlides;

  return {
    contactEmail: toText(value?.contactEmail, seedSiteContent.contactEmail),
    contactPhone: toText(value?.contactPhone, seedSiteContent.contactPhone),
    heroSlides: rawSlides.map((slide, index) => normalizeHeroSlide(slide, index)),
    whatsappMessage: toLocalizedText(
      value?.whatsappMessage,
      seedSiteContent.whatsappMessage,
    ),
    whatsappNumber: toText(value?.whatsappNumber, seedSiteContent.whatsappNumber),
  };
};

const toValidIsoDate = (value, fallback = new Date().toISOString()) => {
  const text = toText(value);
  return Date.parse(text) ? new Date(text).toISOString() : fallback;
};

const getReadingTime = (content) => {
  const wordCount = String(content || "").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 180));
};

const normalizeBlogPost = (value, index, usedSlugs) => {
  const fallback = seedBlogPosts[index] || seedBlogPosts[0];
  const title = toText(value?.title, fallback.title);
  const baseSlug =
    slugify(toText(value?.slug)) ||
    slugify(title) ||
    `blog-yazisi-${index + 1}`;
  const slugUseCount = usedSlugs.get(baseSlug) || 0;
  const slug = slugUseCount === 0 ? baseSlug : `${baseSlug}-${slugUseCount + 1}`;
  const content = toText(value?.content, fallback.content);
  const publishedAt = toValidIsoDate(value?.publishedAt, fallback.publishedAt);
  const updatedAt = toValidIsoDate(value?.updatedAt, publishedAt);
  const status = blogPostStatuses.includes(value?.status)
    ? value.status
    : "published";

  usedSlugs.set(baseSlug, slugUseCount + 1);

  return {
    author: toText(value?.author, fallback.author),
    category: toText(value?.category, fallback.category),
    content,
    coverImage: toText(value?.coverImage, fallback.coverImage),
    coverImageAlt: toText(value?.coverImageAlt, fallback.coverImageAlt),
    excerpt: toText(value?.excerpt, fallback.excerpt).slice(0, 360),
    focusKeyword: toText(value?.focusKeyword, fallback.focusKeyword),
    publishedAt,
    readingTime: Number.isFinite(value?.readingTime)
      ? Math.max(1, Number(value.readingTime))
      : getReadingTime(content),
    seoDescription: toText(value?.seoDescription, fallback.seoDescription).slice(
      0,
      180,
    ),
    seoTitle: toText(value?.seoTitle, fallback.seoTitle || title).slice(0, 90),
    slug,
    status,
    tags: toTextList(value?.tags).length
      ? toUniqueTextList(toTextList(value.tags)).slice(0, 12)
      : fallback.tags,
    title,
    updatedAt,
  };
};

const normalizeBlogPosts = (value) => {
  const usedSlugs = new Map();
  const sourcePosts = Array.isArray(value) && value.length ? value : seedBlogPosts;

  return sourcePosts
    .map((post, index) => normalizeBlogPost(post, index, usedSlugs))
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
};

const filterVisibleBlogPosts = (requestUrl, posts, request) => {
  const wantsDrafts = requestUrl.searchParams.get("includeDrafts") === "1";
  const canSeeDrafts = wantsDrafts && isAuthorized(request);

  return canSeeDrafts
    ? posts
    : posts.filter((post) => post.status === "published");
};

const toLimitedText = (value, fallback = "", maxLength = 1200) =>
  toText(value, fallback).slice(0, maxLength);

const createLeadId = () =>
  `lead-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

const normalizeLead = (value, index = 0) => {
  const createdAt = Date.parse(value?.createdAt)
    ? new Date(value.createdAt).toISOString()
    : new Date().toISOString();
  const updatedAt = Date.parse(value?.updatedAt)
    ? new Date(value.updatedAt).toISOString()
    : createdAt;
  const status = leadStatuses.includes(value?.status) ? value.status : "new";

  return {
    id: toLimitedText(value?.id, `lead-${index + 1}`, 120),
    contact: toLimitedText(value?.contact, "", 180),
    collection: toLimitedText(value?.collection, "", 220),
    createdAt,
    language: toLimitedText(value?.language, "tr", 12),
    message: toLimitedText(value?.message, "", 2000),
    name: toLimitedText(value?.name, "Site visitor", 180),
    productCode: toLimitedText(value?.productCode, "", 80),
    productName: toLimitedText(value?.productName, "", 220),
    sourcePath: toLimitedText(value?.sourcePath, "/", 300),
    status,
    updatedAt,
  };
};

const normalizeLeads = (value) =>
  (Array.isArray(value) ? value : [])
    .map((lead, index) => normalizeLead(lead, index))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

const createLeadFromBody = (body) => {
  const source = body?.lead || body || {};
  const name = toLimitedText(source.name, "", 180);
  const contact = toLimitedText(source.contact, "", 180);

  if (!name || !contact) {
    const error = new Error("Ad ve iletişim bilgisi zorunludur.");
    error.statusCode = 400;
    throw error;
  }

  return normalizeLead({
    contact,
    collection: source.collection,
    createdAt: new Date().toISOString(),
    id: createLeadId(),
    language: source.language,
    message: source.message,
    name,
    productCode: source.productCode,
    productName: source.productName,
    sourcePath: source.sourcePath,
    status: "new",
    updatedAt: new Date().toISOString(),
  });
};

const normalizeSearch = (value) =>
  String(value || "")
    .toLocaleLowerCase("tr")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");

const getProductSearchText = (product) =>
  normalizeSearch(
    [
      product.code,
      product.name,
      product.categoryLabel.en,
      product.categoryLabel.tr,
      product.collection.en,
      product.collection.tr,
      product.description.en,
      product.description.tr,
      ...product.galleryImages,
      ...product.specs.en,
      ...product.specs.tr,
      ...product.technicalSpecs.flatMap((spec) => [
        spec.label.en,
        spec.label.tr,
        ...(Array.isArray(spec.value) ? spec.value : [spec.value]),
      ]),
    ].join(" "),
  );

const getBoundedNumberParam = (requestUrl, key, fallback, maxValue) => {
  const value = Number(requestUrl.searchParams.get(key));

  if (!Number.isFinite(value) || value < 0) {
    return fallback;
  }

  return Math.min(Math.floor(value), maxValue);
};

const filterProducts = (requestUrl, products) => {
  const category = slugify(requestUrl.searchParams.get("category") || "");
  const query = requestUrl.searchParams.get("q") || "";
  const offset = getBoundedNumberParam(requestUrl, "offset", 0, 10000);
  const limit = getBoundedNumberParam(requestUrl, "limit", products.length, 100);
  const activeCategory = products.some((product) => product.category === category)
    ? category
    : "";
  const queryTerms = normalizeSearch(query).split(/\s+/).filter(Boolean);
  const filteredProducts = products
    .filter((product) =>
      activeCategory ? product.category === activeCategory : true,
    )
    .filter((product) => {
      if (!queryTerms.length) {
        return true;
      }

      const searchText = getProductSearchText(product);

      return queryTerms.every((term) => searchText.includes(term));
    });

  return {
    category: activeCategory,
    limit,
    offset,
    products: filteredProducts.slice(offset, offset + limit),
    query,
    total: filteredProducts.length,
  };
};

const getCorsOrigin = (request) => {
  const origin = request.headers.origin;

  if (!origin) {
    return allowedOrigins[0] || "*";
  }

  if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
    return origin;
  }

  return allowedOrigins[0] || origin;
};

const sendJson = (request, response, statusCode, payload) => {
  response.writeHead(statusCode, {
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-token",
    "Access-Control-Allow-Methods": "GET, PUT, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Origin": getCorsOrigin(request),
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
};

const readJsonBody = async (request) =>
  new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;

      if (body.length > 10_000_000) {
        request.destroy();
        reject(new Error("İstek gövdesi çok büyük."));
      }
    });
    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Geçersiz JSON gövdesi."));
      }
    });
    request.on("error", reject);
  });

const isAuthorized = (request) => {
  const token = request.headers["x-admin-token"];
  const authorization = request.headers.authorization || "";

  return token === adminToken || authorization === `Bearer ${adminToken}`;
};

const readResponseBody = async (response) => {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const getSupabaseErrorMessage = (payload, fallback) => {
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    return payload.message || payload.error || payload.details || fallback;
  }

  return fallback;
};

const requestSupabase = async (pathname, options = {}) => {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase bağlantısı yapılandırılmadı.");
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/${pathname}`, {
    ...options,
    headers: {
      Accept: "application/json",
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
      ...(options.headers || {}),
    },
  });
  const payload = await readResponseBody(response);

  if (!response.ok) {
    throw new Error(
      getSupabaseErrorMessage(
        payload,
        `Supabase ${response.status} döndürdü.`,
      ),
    );
  }

  return payload;
};

const requestSupabaseStorage = async (pathname, options = {}) => {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase bağlantısı yapılandırılmadı.");
  }

  const response = await fetch(`${supabaseUrl}/storage/v1/${pathname}`, {
    ...options,
    headers: {
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
      ...(options.headers || {}),
    },
  });
  const payload = await readResponseBody(response);

  if (!response.ok) {
    throw new Error(
      getSupabaseErrorMessage(
        payload,
        `Supabase Storage ${response.status} döndürdü.`,
      ),
    );
  }

  return payload;
};

const sanitizeFileName = (value) =>
  String(value || "")
    .toLocaleLowerCase("tr")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);

const getImageExtension = (fileName, contentType) => {
  const mimeExtension = imageExtensionByMime[contentType];

  if (mimeExtension) {
    return mimeExtension;
  }

  const fileExtension = path.extname(fileName).replace(".", "").toLowerCase();

  return allowedImageExtensions.has(fileExtension) ? fileExtension : "";
};

let storageBucketReady = false;

const ensureStorageBucket = async () => {
  if (storageBucketReady) {
    return;
  }

  const bucketResponse = await fetch(
    `${supabaseUrl}/storage/v1/bucket/${encodeURIComponent(supabaseStorageBucket)}`,
    {
      headers: {
        apikey: supabaseServiceRoleKey,
        Authorization: `Bearer ${supabaseServiceRoleKey}`,
      },
    },
  );

  if (bucketResponse.ok) {
    storageBucketReady = true;
    return;
  }

  const bucketPayload = await readResponseBody(bucketResponse);
  const bucketMissing =
    bucketResponse.status === 404 ||
    String(bucketPayload?.statusCode || "") === "404";

  if (!bucketMissing) {
    throw new Error(
      getSupabaseErrorMessage(
        bucketPayload,
        "Storage bucket kontrol edilemedi.",
      ),
    );
  }

  await requestSupabaseStorage("bucket", {
    body: JSON.stringify({
      allowed_mime_types: Object.keys(imageExtensionByMime),
      file_size_limit: maxUploadSize,
      id: supabaseStorageBucket,
      name: supabaseStorageBucket,
      public: true,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  storageBucketReady = true;
};

const uploadProductImage = async (body) => {
  if (!isSupabaseConfigured) {
    const error = new Error("Supabase Storage yapılandırılmadı.");
    error.statusCode = 500;
    throw error;
  }

  const source = body?.file || body || {};
  const fileName = toLimitedText(source.fileName, "urun-gorseli", 180);
  const contentType = toLimitedText(source.contentType, "", 80);
  const data = typeof source.data === "string" ? source.data : "";
  const folder = sanitizeFileName(source.folder) || "products";
  const extension = getImageExtension(fileName, contentType);

  if (!contentType.startsWith("image/") || !extension) {
    const error = new Error("Desteklenen formatlar: JPG, PNG, WebP, AVIF veya GIF.");
    error.statusCode = 400;
    throw error;
  }

  const fileBuffer = Buffer.from(data, "base64");

  if (!fileBuffer.length || fileBuffer.length > maxUploadSize) {
    const error = new Error("Görsel boyutu 6 MB altında olmalı.");
    error.statusCode = 400;
    throw error;
  }

  await ensureStorageBucket();

  const safeName =
    sanitizeFileName(path.basename(fileName, path.extname(fileName))) ||
    "urun-gorseli";
  const objectPath = [
    folder,
    new Date().toISOString().slice(0, 10),
    `${safeName}-${randomUUID()}.${extension}`,
  ].join("/");
  const encodedObjectPath = objectPath.split("/").map(encodeURIComponent).join("/");
  const uploadResponse = await fetch(
    `${supabaseUrl}/storage/v1/object/${encodeURIComponent(
      supabaseStorageBucket,
    )}/${encodedObjectPath}`,
    {
      body: fileBuffer,
      headers: {
        apikey: supabaseServiceRoleKey,
        Authorization: `Bearer ${supabaseServiceRoleKey}`,
        "Cache-Control": "31536000",
        "Content-Type": contentType,
        "x-upsert": "false",
      },
      method: "POST",
    },
  );
  const payload = await readResponseBody(uploadResponse);

  if (!uploadResponse.ok) {
    throw new Error(
      getSupabaseErrorMessage(payload, "Görsel Supabase Storage'a yüklenemedi."),
    );
  }

  return {
    bucket: supabaseStorageBucket,
    path: objectPath,
    url: `${supabaseUrl}/storage/v1/object/public/${encodeURIComponent(
      supabaseStorageBucket,
    )}/${encodedObjectPath}`,
  };
};

const getLatestTimestamp = (rows) => {
  const latest = rows
    .map((row) => Date.parse(row?.updated_at || row?.created_at || ""))
    .filter(Number.isFinite)
    .sort((a, b) => b - a)[0];

  return latest ? new Date(latest).toISOString() : null;
};

const deleteSupabaseRows = async (tableName, primaryColumn) => {
  await requestSupabase(`${tableName}?${primaryColumn}=not.is.null`, {
    headers: {
      Prefer: "return=minimal",
    },
    method: "DELETE",
  });
};

const loadProductRowsFromSupabase = async () => {
  const rows = await requestSupabase(
    `${supabaseTables.products}?select=product,updated_at&order=sort_order.asc`,
  );

  return Array.isArray(rows) ? rows : [];
};

const loadProductsFromSupabase = async () => {
  const rows = await loadProductRowsFromSupabase();

  if (!rows.length) {
    return seedProducts;
  }

  return normalizeProducts(rows.map((row) => row.product));
};

const saveProductsToSupabase = async (products) => {
  const normalizedProducts = normalizeProducts(products);
  const now = new Date().toISOString();
  const rows = normalizedProducts.map((product, index) => ({
    product,
    slug: product.slug,
    sort_order: index,
    updated_at: now,
  }));

  await deleteSupabaseRows(supabaseTables.products, "slug");

  if (rows.length) {
    await requestSupabase(supabaseTables.products, {
      body: JSON.stringify(rows),
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      method: "POST",
    });
  }

  return normalizedProducts;
};

const loadSiteContentFromSupabase = async () => {
  const rows = await requestSupabase(
    `${supabaseTables.siteContent}?select=content&id=eq.main&limit=1`,
  );
  const [siteContentRow] = Array.isArray(rows) ? rows : [];

  return siteContentRow?.content
    ? normalizeSiteContent(siteContentRow.content)
    : seedSiteContent;
};

const saveSiteContentToSupabase = async (siteContent) => {
  const normalizedSiteContent = normalizeSiteContent(siteContent);

  await requestSupabase(`${supabaseTables.siteContent}?on_conflict=id`, {
    body: JSON.stringify({
      content: normalizedSiteContent,
      id: "main",
      updated_at: new Date().toISOString(),
    }),
    headers: {
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    method: "POST",
  });

  return normalizedSiteContent;
};

const loadBlogRowsFromSupabase = async () => {
  const rows = await requestSupabase(
    `${supabaseTables.blogPosts}?select=post,updated_at,published_at&order=published_at.desc`,
  );

  return Array.isArray(rows) ? rows : [];
};

const loadBlogPostsFromSupabase = async () => {
  const rows = await loadBlogRowsFromSupabase();

  if (!rows.length) {
    return seedBlogPosts;
  }

  return normalizeBlogPosts(rows.map((row) => row.post));
};

const saveBlogPostsToSupabase = async (posts) => {
  const normalizedPosts = normalizeBlogPosts(posts);
  const now = new Date().toISOString();
  const rows = normalizedPosts.map((post, index) => ({
    post,
    published_at: post.publishedAt,
    slug: post.slug,
    sort_order: index,
    status: post.status,
    updated_at: now,
  }));

  await deleteSupabaseRows(supabaseTables.blogPosts, "slug");

  if (rows.length) {
    await requestSupabase(supabaseTables.blogPosts, {
      body: JSON.stringify(rows),
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      method: "POST",
    });
  }

  return normalizedPosts;
};

const loadLeadRowsFromSupabase = async () => {
  const rows = await requestSupabase(
    `${supabaseTables.leads}?select=lead,created_at,updated_at&order=created_at.desc`,
  );

  return Array.isArray(rows) ? rows : [];
};

const loadLeadsFromSupabase = async () => {
  const rows = await loadLeadRowsFromSupabase();

  return normalizeLeads(rows.map((row) => row.lead));
};

const saveLeadsToSupabase = async (leads) => {
  const normalizedLeads = normalizeLeads(leads);
  const rows = normalizedLeads.map((lead) => ({
    created_at: lead.createdAt,
    id: lead.id,
    lead,
    status: lead.status,
    updated_at: lead.updatedAt,
  }));

  await deleteSupabaseRows(supabaseTables.leads, "id");

  if (rows.length) {
    await requestSupabase(supabaseTables.leads, {
      body: JSON.stringify(rows),
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      method: "POST",
    });
  }

  return normalizedLeads;
};

const loadProducts = async () => {
  if (isSupabaseConfigured) {
    return loadProductsFromSupabase();
  }

  try {
    const file = await fs.readFile(dataFilePath, "utf8");
    return normalizeProducts(JSON.parse(file));
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.warn("Using seed catalog:", error.message);
    }

    return seedProducts;
  }
};

const saveProducts = async (products) => {
  const normalizedProducts = normalizeProducts(products);

  if (isSupabaseConfigured) {
    return saveProductsToSupabase(normalizedProducts);
  }

  await fs.mkdir(path.dirname(dataFilePath), { recursive: true });
  await fs.writeFile(
    dataFilePath,
    `${JSON.stringify(normalizedProducts, null, 2)}\n`,
    "utf8",
  );

  return normalizedProducts;
};

const resetProducts = async () => saveProducts(seedProducts);

const loadSiteContent = async () => {
  if (isSupabaseConfigured) {
    return loadSiteContentFromSupabase();
  }

  try {
    const file = await fs.readFile(siteContentFilePath, "utf8");
    return normalizeSiteContent(JSON.parse(file));
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.warn("Using seed site content:", error.message);
    }

    return seedSiteContent;
  }
};

const saveSiteContent = async (siteContent) => {
  const normalizedSiteContent = normalizeSiteContent(siteContent);

  if (isSupabaseConfigured) {
    return saveSiteContentToSupabase(normalizedSiteContent);
  }

  await fs.mkdir(path.dirname(siteContentFilePath), { recursive: true });
  await fs.writeFile(
    siteContentFilePath,
    `${JSON.stringify(normalizedSiteContent, null, 2)}\n`,
    "utf8",
  );

  return normalizedSiteContent;
};

const resetSiteContent = async () => saveSiteContent(seedSiteContent);

const loadBlogPosts = async () => {
  if (isSupabaseConfigured) {
    return loadBlogPostsFromSupabase();
  }

  try {
    const file = await fs.readFile(blogPostsFilePath, "utf8");
    return normalizeBlogPosts(JSON.parse(file));
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.warn("Using seed blog posts:", error.message);
    }

    return seedBlogPosts;
  }
};

const saveBlogPosts = async (posts) => {
  const normalizedPosts = normalizeBlogPosts(posts);

  if (isSupabaseConfigured) {
    return saveBlogPostsToSupabase(normalizedPosts);
  }

  await fs.mkdir(path.dirname(blogPostsFilePath), { recursive: true });
  await fs.writeFile(
    blogPostsFilePath,
    `${JSON.stringify(normalizedPosts, null, 2)}\n`,
    "utf8",
  );

  return normalizedPosts;
};

const resetBlogPosts = async () => saveBlogPosts(seedBlogPosts);

const loadLeads = async () => {
  if (isSupabaseConfigured) {
    return loadLeadsFromSupabase();
  }

  try {
    const file = await fs.readFile(leadsFilePath, "utf8");
    return normalizeLeads(JSON.parse(file));
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.warn("Using empty leads fallback:", error.message);
    }

    return [];
  }
};

const saveLeads = async (leads) => {
  const normalizedLeads = normalizeLeads(leads);

  if (isSupabaseConfigured) {
    return saveLeadsToSupabase(normalizedLeads);
  }

  await fs.mkdir(path.dirname(leadsFilePath), { recursive: true });
  await fs.writeFile(
    leadsFilePath,
    `${JSON.stringify(normalizedLeads, null, 2)}\n`,
    "utf8",
  );

  return normalizedLeads;
};

const addLead = async (leadBody) => {
  const lead = createLeadFromBody(leadBody);
  const leads = await loadLeads();
  const savedLeads = await saveLeads([lead, ...leads]);

  return savedLeads.find((item) => item.id === lead.id) || lead;
};

const updateLead = async (leadId, updates) => {
  const leads = await loadLeads();
  const existingLead = leads.find((lead) => lead.id === leadId);

  if (!existingLead) {
    return null;
  }

  const nextStatus = leadStatuses.includes(updates?.status)
    ? updates.status
    : existingLead.status;
  const nextLead = normalizeLead({
    ...existingLead,
    status: nextStatus,
    updatedAt: new Date().toISOString(),
  });
  await saveLeads(
    leads.map((lead) => (lead.id === leadId ? nextLead : lead)),
  );

  return nextLead;
};

const deleteLead = async (leadId) => {
  const leads = await loadLeads();
  const nextLeads = leads.filter((lead) => lead.id !== leadId);

  if (nextLeads.length === leads.length) {
    return false;
  }

  await saveLeads(nextLeads);

  return true;
};

const resetLeads = async () => saveLeads([]);

const getCatalogStatus = async () => {
  if (isSupabaseConfigured) {
    const rows = await loadProductRowsFromSupabase();
    const products = rows.length
      ? normalizeProducts(rows.map((row) => row.product))
      : seedProducts;

    return {
      lastUpdated: getLatestTimestamp(rows),
      productCount: products.length,
      source: rows.length ? "supabase" : "supabase-empty-seed",
    };
  }

  try {
    const file = await fs.readFile(dataFilePath, "utf8");
    const stat = await fs.stat(dataFilePath);
    const products = normalizeProducts(JSON.parse(file));

    return {
      lastUpdated: stat.mtime.toISOString(),
      productCount: products.length,
      source: "file",
    };
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.warn("Katalog durumu başlangıç verisine geçti:", error.message);
    }

    return {
      lastUpdated: null,
      productCount: seedProducts.length,
      source: "seed",
    };
  }
};

const getBlogStatus = async () => {
  if (isSupabaseConfigured) {
    try {
      const rows = await loadBlogRowsFromSupabase();
      const posts = rows.length
        ? normalizeBlogPosts(rows.map((row) => row.post))
        : seedBlogPosts;

      return {
        lastUpdated: getLatestTimestamp(rows),
        postCount: posts.length,
        publishedCount: posts.filter((post) => post.status === "published").length,
        source: rows.length ? "supabase" : "supabase-empty-seed",
      };
    } catch (error) {
      console.warn("Blog durumu başlangıç verisine geçti:", error.message);

      return {
        lastUpdated: null,
        postCount: seedBlogPosts.length,
        publishedCount: seedBlogPosts.filter((post) => post.status === "published")
          .length,
        source: "supabase-error-seed",
      };
    }
  }

  try {
    const file = await fs.readFile(blogPostsFilePath, "utf8");
    const stat = await fs.stat(blogPostsFilePath);
    const posts = normalizeBlogPosts(JSON.parse(file));

    return {
      lastUpdated: stat.mtime.toISOString(),
      postCount: posts.length,
      publishedCount: posts.filter((post) => post.status === "published").length,
      source: "file",
    };
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.warn("Blog durumu başlangıç verisine geçti:", error.message);
    }

    return {
      lastUpdated: null,
      postCount: seedBlogPosts.length,
      publishedCount: seedBlogPosts.filter((post) => post.status === "published")
        .length,
      source: "seed",
    };
  }
};

const getLeadStatus = async () => {
  const leads = await loadLeads();

  return {
    closed: leads.filter((lead) => lead.status === "closed").length,
    contacted: leads.filter((lead) => lead.status === "contacted").length,
    new: leads.filter((lead) => lead.status === "new").length,
    total: leads.length,
  };
};

const handleRequest = async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const pathname = requestUrl.pathname;

  if (request.method === "OPTIONS") {
    sendJson(request, response, 204, {});
    return;
  }

  if (request.method === "GET" && pathname === "/health") {
    sendJson(request, response, 200, { ok: true, service: "catalog-backend" });
    return;
  }

  if (request.method === "GET" && pathname === "/api/status") {
    const catalog = await getCatalogStatus();
    const blog = await getBlogStatus();
    const leads = await getLeadStatus();

    sendJson(request, response, 200, {
      blog,
      catalog,
      leads,
      ok: true,
      service: "catalog-backend",
    });
    return;
  }

  if (request.method === "GET" && pathname === "/api/categories") {
    const products = await loadProducts();
    sendJson(request, response, 200, { categories: getProductCategories(products) });
    return;
  }

  if (request.method === "GET" && pathname === "/api/site-content") {
    const siteContent = await loadSiteContent();
    sendJson(request, response, 200, { siteContent });
    return;
  }

  if (request.method === "GET" && pathname === "/api/site-content/export") {
    const siteContent = await loadSiteContent();
    sendJson(request, response, 200, {
      exportedAt: new Date().toISOString(),
      siteContent,
    });
    return;
  }

  if (request.method === "GET" && pathname === "/api/blog-posts") {
    const posts = filterVisibleBlogPosts(
      requestUrl,
      await loadBlogPosts(),
      request,
    );

    sendJson(request, response, 200, { posts });
    return;
  }

  if (request.method === "GET" && pathname === "/api/blog-posts/export") {
    if (!isAuthorized(request)) {
      sendJson(request, response, 401, { message: "Yetkisiz erişim" });
      return;
    }

    const posts = await loadBlogPosts();

    sendJson(request, response, 200, {
      exportedAt: new Date().toISOString(),
      posts,
    });
    return;
  }

  if (request.method === "GET" && pathname.startsWith("/api/blog-posts/")) {
    const slug = decodeURIComponent(pathname.replace("/api/blog-posts/", ""));
    const posts = filterVisibleBlogPosts(
      requestUrl,
      await loadBlogPosts(),
      request,
    );
    const post = posts.find((item) => item.slug === slug);

    if (!post) {
      sendJson(request, response, 404, { message: "Blog yazısı bulunamadı" });
      return;
    }

    sendJson(request, response, 200, { post });
    return;
  }

  if (request.method === "POST" && pathname === "/api/leads") {
    const body = await readJsonBody(request);
    const lead = await addLead(body);

    sendJson(request, response, 201, {
      lead,
      message: "Talep alındı",
    });
    return;
  }

  if (request.method === "POST" && pathname === "/api/uploads") {
    if (!isAuthorized(request)) {
      sendJson(request, response, 401, { message: "Yetkisiz erişim" });
      return;
    }

    const body = await readJsonBody(request);
    const upload = await uploadProductImage(body);

    sendJson(request, response, 201, {
      message: "Görsel yüklendi",
      upload,
      url: upload.url,
    });
    return;
  }

  if (request.method === "GET" && pathname === "/api/leads") {
    if (!isAuthorized(request)) {
      sendJson(request, response, 401, { message: "Yetkisiz erişim" });
      return;
    }

    const leads = await loadLeads();

    sendJson(request, response, 200, { leads });
    return;
  }

  if (request.method === "GET" && pathname === "/api/leads/export") {
    if (!isAuthorized(request)) {
      sendJson(request, response, 401, { message: "Yetkisiz erişim" });
      return;
    }

    const leads = await loadLeads();

    sendJson(request, response, 200, {
      exportedAt: new Date().toISOString(),
      leads,
    });
    return;
  }

  if (request.method === "GET" && pathname === "/api/products") {
    const products = await loadProducts();
    const result = filterProducts(requestUrl, products);

    sendJson(request, response, 200, {
      categories: getProductCategories(products),
      meta: {
        category: result.category,
        limit: result.limit,
        offset: result.offset,
        q: result.query,
        returned: result.products.length,
        total: result.total,
      },
      products: result.products,
    });
    return;
  }

  if (request.method === "GET" && pathname === "/api/products/export") {
    const products = await loadProducts();
    sendJson(request, response, 200, {
      exportedAt: new Date().toISOString(),
      products,
    });
    return;
  }

  if (request.method === "GET" && pathname.startsWith("/api/products/")) {
    const slug = decodeURIComponent(pathname.replace("/api/products/", ""));
    const products = await loadProducts();
    const product = products.find((item) => item.slug === slug);

    if (!product) {
      sendJson(request, response, 404, { message: "Ürün bulunamadı" });
      return;
    }

    sendJson(request, response, 200, { product });
    return;
  }

  if (request.method === "PUT" && pathname === "/api/products") {
    if (!isAuthorized(request)) {
      sendJson(request, response, 401, { message: "Yetkisiz erişim" });
      return;
    }

    const body = await readJsonBody(request);
    const products = await saveProducts(body.products);

    sendJson(request, response, 200, {
      message: "Katalog kaydedildi",
      products,
    });
    return;
  }

  if (request.method === "POST" && pathname === "/api/products/reset") {
    if (!isAuthorized(request)) {
      sendJson(request, response, 401, { message: "Yetkisiz erişim" });
      return;
    }

    const products = await resetProducts();

    sendJson(request, response, 200, {
      message: "Katalog sıfırlandı",
      products,
    });
    return;
  }

  if (request.method === "PUT" && pathname === "/api/blog-posts") {
    if (!isAuthorized(request)) {
      sendJson(request, response, 401, { message: "Yetkisiz erişim" });
      return;
    }

    const body = await readJsonBody(request);
    const posts = await saveBlogPosts(body.posts);

    sendJson(request, response, 200, {
      message: "Blog yazıları kaydedildi",
      posts,
    });
    return;
  }

  if (request.method === "POST" && pathname === "/api/blog-posts/reset") {
    if (!isAuthorized(request)) {
      sendJson(request, response, 401, { message: "Yetkisiz erişim" });
      return;
    }

    const posts = await resetBlogPosts();

    sendJson(request, response, 200, {
      message: "Blog yazıları sıfırlandı",
      posts,
    });
    return;
  }

  if (request.method === "PUT" && pathname === "/api/site-content") {
    if (!isAuthorized(request)) {
      sendJson(request, response, 401, { message: "Yetkisiz erişim" });
      return;
    }

    const body = await readJsonBody(request);
    const siteContent = await saveSiteContent(body.siteContent);

    sendJson(request, response, 200, {
      message: "Site içeriği kaydedildi",
      siteContent,
    });
    return;
  }

  if (request.method === "POST" && pathname === "/api/site-content/reset") {
    if (!isAuthorized(request)) {
      sendJson(request, response, 401, { message: "Yetkisiz erişim" });
      return;
    }

    const siteContent = await resetSiteContent();

    sendJson(request, response, 200, {
      message: "Site içeriği sıfırlandı",
      siteContent,
    });
    return;
  }

  if (request.method === "PUT" && pathname.startsWith("/api/leads/")) {
    if (!isAuthorized(request)) {
      sendJson(request, response, 401, { message: "Yetkisiz erişim" });
      return;
    }

    const leadId = decodeURIComponent(pathname.replace("/api/leads/", ""));
    const body = await readJsonBody(request);
    const lead = await updateLead(leadId, body);

    if (!lead) {
      sendJson(request, response, 404, { message: "Talep bulunamadı" });
      return;
    }

    sendJson(request, response, 200, {
      lead,
      message: "Talep güncellendi",
    });
    return;
  }

  if (request.method === "DELETE" && pathname.startsWith("/api/leads/")) {
    if (!isAuthorized(request)) {
      sendJson(request, response, 401, { message: "Yetkisiz erişim" });
      return;
    }

    const leadId = decodeURIComponent(pathname.replace("/api/leads/", ""));
    const deleted = await deleteLead(leadId);

    if (!deleted) {
      sendJson(request, response, 404, { message: "Talep bulunamadı" });
      return;
    }

    sendJson(request, response, 200, { message: "Talep silindi" });
    return;
  }

  if (request.method === "POST" && pathname === "/api/leads/reset") {
    if (!isAuthorized(request)) {
      sendJson(request, response, 401, { message: "Yetkisiz erişim" });
      return;
    }

    const leads = await resetLeads();

    sendJson(request, response, 200, {
      leads,
      message: "Talepler sıfırlandı",
    });
    return;
  }

  sendJson(request, response, 404, { message: "Rota bulunamadı" });
};

const server = http.createServer((request, response) => {
  handleRequest(request, response).catch((error) => {
    const statusCode = Number.isInteger(error.statusCode)
      ? error.statusCode
      : 500;

    console.error(error);
    sendJson(request, response, statusCode, {
      message: error.message || "Beklenmeyen backend hatası",
    });
  });
});

server.listen(port, () => {
  console.log(`Catalog backend running at http://localhost:${port}`);
});
