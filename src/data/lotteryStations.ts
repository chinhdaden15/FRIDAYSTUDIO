export type LotteryRegion = "mien-bac" | "mien-trung" | "mien-nam";

export interface LotteryStation {
  label: string;
  value: string;
  code: string;
  aliases: string[];
}

export const REGION_OPTIONS = [
  { label: "Miền Bắc", value: "mien-bac" },
  { label: "Miền Trung", value: "mien-trung" },
  { label: "Miền Nam", value: "mien-nam" }
];

export const LOTTERY_STATIONS: Record<LotteryRegion, LotteryStation[]> = {
  "mien-bac": [
    { label: "Hà Nội", value: "ha-noi", code: "HN", aliases: ["Thủ Đô", "XSHN", "XSTD"] },
    { label: "Quảng Ninh", value: "quang-ninh", code: "QN", aliases: ["XSQN"] },
    { label: "Bắc Ninh", value: "bac-ninh", code: "BN", aliases: ["XSBN"] },
    { label: "Hải Phòng", value: "hai-phong", code: "HP", aliases: ["XSHP"] },
    { label: "Nam Định", value: "nam-dinh", code: "ND", aliases: ["XSND"] },
    { label: "Thái Bình", value: "thai-binh", code: "TB", aliases: ["XSTB"] }
  ],

  "mien-trung": [
    { label: "Bình Định", value: "binh-dinh", code: "BDI", aliases: ["XSBDI", "XS Bình Định"] },
    { label: "Đà Nẵng", value: "da-nang", code: "DNG", aliases: ["XSDNG", "XS Đà Nẵng"] },
    { label: "Đắk Lắk", value: "dak-lak", code: "DLK", aliases: ["XSDLK", "Đắc Lắc", "XS Đắk Lắk"] },
    { label: "Đắk Nông", value: "dak-nong", code: "DNO", aliases: ["XSDNO", "XS Đắk Nông"] },
    { label: "Gia Lai", value: "gia-lai", code: "GL", aliases: ["XSGL", "XS Gia Lai"] },
    { label: "Khánh Hòa", value: "khanh-hoa", code: "KH", aliases: ["XSKH", "XS Khánh Hòa"] },
    { label: "Kon Tum", value: "kon-tum", code: "KT", aliases: ["XSKT", "XS Kon Tum"] },
    { label: "Ninh Thuận", value: "ninh-thuan", code: "NT", aliases: ["XSNT", "XS Ninh Thuận"] },
    { label: "Phú Yên", value: "phu-yen", code: "PY", aliases: ["XSPY", "XS Phú Yên"] },
    { label: "Quảng Bình", value: "quang-binh", code: "QB", aliases: ["XSQB", "XS Quảng Bình"] },
    { label: "Quảng Nam", value: "quang-nam", code: "QNM", aliases: ["XSQNM", "XS Quảng Nam"] },
    { label: "Quảng Ngãi", value: "quang-ngai", code: "QNG", aliases: ["XSQNG", "XS Quảng Ngãi"] },
    { label: "Quảng Trị", value: "quang-tri", code: "QT", aliases: ["XSQT", "XS Quảng Trị"] },
    { label: "Thừa Thiên Huế", value: "thua-thien-hue", code: "TTH", aliases: ["Huế", "XSTTH", "XS Huế"] }
  ],

  "mien-nam": [
    { label: "An Giang", value: "an-giang", code: "AG", aliases: ["XSAG", "XS An Giang"] },
    { label: "Bạc Liêu", value: "bac-lieu", code: "BL", aliases: ["XSBL", "XS Bạc Liêu"] },
    { label: "Bà Rịa - Vũng Tàu", value: "ba-ria-vung-tau", code: "VT", aliases: ["Vũng Tàu", "XSVT", "XS Vũng Tàu"] },
    { label: "Bến Tre", value: "ben-tre", code: "BT", aliases: ["XSBT", "XS Bến Tre"] },
    { label: "Bình Dương", value: "binh-duong", code: "BD", aliases: ["XSBD", "XS Bình Dương"] },
    { label: "Bình Phước", value: "binh-phuoc", code: "BP", aliases: ["XSBP", "XS Bình Phước"] },
    { label: "Bình Thuận", value: "binh-thuan", code: "BTH", aliases: ["XSBTH", "XS Bình Thuận"] },
    { label: "Cà Mau", value: "ca-mau", code: "CM", aliases: ["XSCM", "XS Cà Mau"] },
    { label: "Cần Thơ", value: "can-tho", code: "CT", aliases: ["XSCT", "XS Cần Thơ"] },
    { label: "Đồng Nai", value: "dong-nai", code: "DN", aliases: ["XSDN", "XS Đồng Nai"] },
    { label: "Đồng Tháp", value: "dong-thap", code: "DT", aliases: ["XSDT", "XS Đồng Tháp"] },
    { label: "Hậu Giang", value: "hau-giang", code: "HG", aliases: ["XSHG", "XS Hậu Giang"] },
    { label: "Kiên Giang", value: "kien-giang", code: "KG", aliases: ["XSKG", "XS Kiên Giang"] },
    { label: "Lâm Đồng", value: "lam-dong", code: "LD", aliases: ["Đà Lạt", "XSLD", "XS Lâm Đồng"] },
    { label: "Long An", value: "long-an", code: "LA", aliases: ["XSLA", "XS Long An"] },
    { label: "Sóc Trăng", value: "soc-trang", code: "ST", aliases: ["XSST", "XS Sóc Trăng"] },
    { label: "Tây Ninh", value: "tay-ninh", code: "TN", aliases: ["XSTN", "XS Tây Ninh"] },
    { label: "TP.HCM", value: "tp-hcm", code: "HCM", aliases: ["TP Hồ Chí Minh", "Hồ Chí Minh", "XSHCM", "XS TP.HCM"] },
    { label: "Tiền Giang", value: "tien-giang", code: "TG", aliases: ["XSTG", "XS Tiền Giang"] },
    { label: "Trà Vinh", value: "tra-vinh", code: "TV", aliases: ["XSTV", "XS Trà Vinh"] },
    { label: "Vĩnh Long", value: "vinh-long", code: "VL", aliases: ["XSVL", "XS Vĩnh Long"] }
  ]
};
