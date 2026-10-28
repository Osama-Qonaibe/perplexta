export * from '../../server/utils/geoData';

export const VIRALBOOK_CATEGORIES = [
  { id: 'all', labelAr: 'كافة الفئات والقطاعات', labelEn: 'All Categories' },
  { id: 'e-commerce', labelAr: 'التجارة الإلكترونية والتسوق', labelEn: 'E-Commerce & Retail' },
  { id: 'technology', labelAr: 'التكنولوجيا والبرمجيات والذكاء الاصطناعي', labelEn: 'Tech & AI' },
  { id: 'construction', labelAr: 'البناء والديكور والمقاولات والمنزل', labelEn: 'Construction & Home' },
  { id: 'real-estate', labelAr: 'العقارات والاستثمار العقاري', labelEn: 'Real Estate' },
  { id: 'automotive', labelAr: 'السيارات والمحركات وقطع الغيار', labelEn: 'Automotive & Vehicles' },
  { id: 'health', labelAr: 'الصحة والطب والرعاية والتجميل', labelEn: 'Health & Medical' },
  { id: 'food-dining', labelAr: 'المطاعم والأغذية والمقاهي والحلويات', labelEn: 'Food & Dining' },
  { id: 'education', labelAr: 'التعليم والتدريب واللغات والجامعات', labelEn: 'Education & Training' },
  { id: 'services', labelAr: 'الخدمات المهنية والأعمال والتسويق', labelEn: 'Business & Professional Services' },
  { id: 'tourism', labelAr: 'السياحة والسفر وفنادق والترفيه', labelEn: 'Tourism & Travel' },
  { id: 'industry', labelAr: 'الصناعة والزراعة والمعدات الثقيلة', labelEn: 'Industry & Agriculture' },
  { id: 'jobs', labelAr: 'فرص العمل والتوظيف', labelEn: 'Jobs & Careers' }
];

export const VIRALBOOK_SORT_OPTIONS = [
  { id: 'latest', labelAr: 'الأحدث', labelEn: 'Latest' },
  { id: 'popular', labelAr: 'الأكثر تفاعلاً', labelEn: 'Popular' },
];

export interface LocationSearchResult {
  display_name: string;
  city: string;
  title?: string;
  subtitle?: string;
  state?: string;
  country: string;
  country_code?: string;
  flag?: string;
  lat: string;
  lon: string;
  raw_type?: string;
  category_label?: string;
  place_type?: string;
  parentCity?: string;
}

export const getPlaceCategoryLabel = (item: LocationSearchResult, isRtl: boolean = true): string => {
  if (item.category_label) return item.category_label;
  const rawType = (item.raw_type || item.place_type || '').toLowerCase();
  if (rawType.includes('city') || rawType.includes('municipality')) return isRtl ? 'مدينة' : 'City';
  if (rawType.includes('town')) return isRtl ? 'بلدة' : 'Town';
  if (rawType.includes('village') || rawType.includes('hamlet')) return isRtl ? 'قرية' : 'Village';
  if (rawType.includes('suburb') || rawType.includes('neighbourhood') || rawType.includes('quarter')) return isRtl ? 'حي' : 'Neighborhood';
  if (rawType.includes('road') || rawType.includes('street') || rawType.includes('highway')) return isRtl ? 'شارع' : 'Street';
  if (rawType.includes('district') || rawType.includes('county') || rawType.includes('administrative') || rawType.includes('state')) return isRtl ? 'محافظة' : 'District';
  if (rawType.includes('building') || rawType.includes('landmark')) return isRtl ? 'معلم' : 'Landmark';
  return isRtl ? 'موقع جغرافي' : 'Location';
};

export const getCountryCode = (countryName?: string): string => {
  if (!countryName || countryName === 'all') return '';
  const c = countryName.toLowerCase();
  if (c.includes('فلسطين') || c.includes('palestine')) return 'ps';
  if (c.includes('الأردن') || c.includes('jordan')) return 'jo';
  if (c.includes('السعودية') || c.includes('saudi')) return 'sa';
  if (c.includes('الإمارات') || c.includes('uae') || c.includes('emirates')) return 'ae';
  if (c.includes('مصر') || c.includes('egypt')) return 'eg';
  if (c.includes('قطر') || c.includes('qatar')) return 'qa';
  if (c.includes('الكويت') || c.includes('kuwait')) return 'kw';
  if (c.includes('عمان') || c.includes('oman')) return 'om';
  if (c.includes('البحرين') || c.includes('bahrain')) return 'bh';
  if (c.includes('العراق') || c.includes('iraq')) return 'iq';
  if (c.includes('لبنان') || c.includes('lebanon')) return 'lb';
  if (c.includes('سوريا') || c.includes('syria')) return 'sy';
  if (c.includes('اليمن') || c.includes('yemen')) return 'ye';
  if (c.includes('المغرب') || c.includes('morocco')) return 'ma';
  if (c.includes('الجزائر') || c.includes('algeria')) return 'dz';
  if (c.includes('تونس') || c.includes('tunisia')) return 'tn';
  if (c.includes('السودان') || c.includes('sudan')) return 'sd';
  if (c.includes('تركيا') || c.includes('turkey')) return 'tr';
  if (c.includes('المملكة المتحدة') || c.includes('uk')) return 'gb';
  if (c.includes('الولايات المتحدة') || c.includes('usa')) return 'us';
  if (c.includes('ألمانيا') || c.includes('germany')) return 'de';
  if (c.includes('فرنسا') || c.includes('france')) return 'fr';
  if (c.includes('كندا') || c.includes('canada')) return 'ca';
  return '';
};

export const getCountryFlagEmoji = (countryCode?: string, countryName?: string): string => {
  if (countryCode && countryCode.length === 2) {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  }
  if (!countryName) return '🌐';
  if (countryName.includes('فلسطين')) return '🇵🇸';
  if (countryName.includes('الأردن')) return '🇯🇴';
  if (countryName.includes('السعودية')) return '🇸🇦';
  if (countryName.includes('الإمارات')) return '🇦🇪';
  if (countryName.includes('مصر')) return '🇪🇬';
  if (countryName.includes('قطر')) return '🇶🇦';
  if (countryName.includes('الكويت')) return '🇰🇼';
  if (countryName.includes('عمان') || countryName.includes('عُمان')) return '🇴🇲';
  if (countryName.includes('البحرين')) return '🇧🇭';
  if (countryName.includes('العراق')) return '🇮🇶';
  if (countryName.includes('لبنان')) return '🇱🇧';
  if (countryName.includes('سوريا')) return '🇸🇾';
  if (countryName.includes('اليمن')) return '🇾🇪';
  if (countryName.includes('المغرب')) return '🇲🇦';
  if (countryName.includes('الجزائر')) return '🇩🇿';
  if (countryName.includes('تونس')) return '🇹🇳';
  if (countryName.includes('السودان')) return '🇸🇩';
  if (countryName.includes('تركيا')) return '🇹🇷';
  if (countryName.includes('المملكة المتحدة') || countryName.includes('بريطانيا')) return '🇬🇧';
  if (countryName.includes('الولايات المتحدة') || countryName.includes('أمريكا')) return '🇺🇸';
  if (countryName.includes('ألمانيا')) return '🇩🇪';
  if (countryName.includes('فرنسا')) return '🇫🇷';
  if (countryName.includes('كندا')) return '🇨🇦';
  return '🌍';
};
