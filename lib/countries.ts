/**
 * Country list for the "set your country" picker and the community map
 * (Segment 2 of the accounts roadmap). Codes are ISO 3166-1 alpha-2 —
 * stored on `profiles.country` as the code, never the display name, so
 * it's language-independent and easy to aggregate for the map.
 *
 * `lat`/`lon` are each country's capital city — an approximation used only
 * to place a dot on the community map, not surveyed centroid data.
 *
 * GCC countries are pinned as a priority group at the top of the picker
 * (per product decision — the app's primary audience), the rest of the
 * world follows alphabetically by the picker's current language.
 */

export interface Country {
  code: string;
  en: string;
  ar: string;
  lat: number;
  lon: number;
}

/** Saudi Arabia, UAE, Qatar, Kuwait, Bahrain, Oman — shown first, in this order. */
export const GCC_CODES = ['SA', 'AE', 'QA', 'KW', 'BH', 'OM'] as const;

export const COUNTRIES: Country[] = [
  { code: 'SA', en: 'Saudi Arabia', ar: 'المملكة العربية السعودية', lat: 24.7, lon: 46.7 },
  { code: 'AE', en: 'United Arab Emirates', ar: 'الإمارات العربية المتحدة', lat: 24.5, lon: 54.4 },
  { code: 'QA', en: 'Qatar', ar: 'قطر', lat: 25.3, lon: 51.5 },
  { code: 'KW', en: 'Kuwait', ar: 'الكويت', lat: 29.4, lon: 47.9 },
  { code: 'BH', en: 'Bahrain', ar: 'البحرين', lat: 26.2, lon: 50.6 },
  { code: 'OM', en: 'Oman', ar: 'عُمان', lat: 23.6, lon: 58.5 },

  { code: 'AF', en: 'Afghanistan', ar: 'أفغانستان', lat: 34.5, lon: 69.2 },
  { code: 'AL', en: 'Albania', ar: 'ألبانيا', lat: 41.3, lon: 19.8 },
  { code: 'DZ', en: 'Algeria', ar: 'الجزائر', lat: 36.8, lon: 3.1 },
  { code: 'AD', en: 'Andorra', ar: 'أندورا', lat: 42.5, lon: 1.5 },
  { code: 'AO', en: 'Angola', ar: 'أنغولا', lat: -8.8, lon: 13.2 },
  { code: 'AG', en: 'Antigua and Barbuda', ar: 'أنتيغوا وباربودا', lat: 17.1, lon: -61.8 },
  { code: 'AR', en: 'Argentina', ar: 'الأرجنتين', lat: -34.6, lon: -58.4 },
  { code: 'AM', en: 'Armenia', ar: 'أرمينيا', lat: 40.2, lon: 44.5 },
  { code: 'AU', en: 'Australia', ar: 'أستراليا', lat: -35.3, lon: 149.1 },
  { code: 'AT', en: 'Austria', ar: 'النمسا', lat: 48.2, lon: 16.4 },
  { code: 'AZ', en: 'Azerbaijan', ar: 'أذربيجان', lat: 40.4, lon: 49.9 },
  { code: 'BS', en: 'Bahamas', ar: 'باهاماس', lat: 25.0, lon: -77.4 },
  { code: 'BD', en: 'Bangladesh', ar: 'بنغلاديش', lat: 23.8, lon: 90.4 },
  { code: 'BB', en: 'Barbados', ar: 'باربادوس', lat: 13.1, lon: -59.6 },
  { code: 'BY', en: 'Belarus', ar: 'بيلاروسيا', lat: 53.9, lon: 27.6 },
  { code: 'BE', en: 'Belgium', ar: 'بلجيكا', lat: 50.8, lon: 4.4 },
  { code: 'BZ', en: 'Belize', ar: 'بليز', lat: 17.3, lon: -88.8 },
  { code: 'BJ', en: 'Benin', ar: 'بنين', lat: 6.5, lon: 2.6 },
  { code: 'BT', en: 'Bhutan', ar: 'بوتان', lat: 27.5, lon: 89.6 },
  { code: 'BO', en: 'Bolivia', ar: 'بوليفيا', lat: -19.0, lon: -65.3 },
  { code: 'BA', en: 'Bosnia and Herzegovina', ar: 'البوسنة والهرسك', lat: 43.9, lon: 18.4 },
  { code: 'BW', en: 'Botswana', ar: 'بوتسوانا', lat: -24.7, lon: 25.9 },
  { code: 'BR', en: 'Brazil', ar: 'البرازيل', lat: -15.8, lon: -47.9 },
  { code: 'BN', en: 'Brunei', ar: 'بروناي', lat: 4.9, lon: 114.9 },
  { code: 'BG', en: 'Bulgaria', ar: 'بلغاريا', lat: 42.7, lon: 23.3 },
  { code: 'BF', en: 'Burkina Faso', ar: 'بوركينا فاسو', lat: 12.4, lon: -1.5 },
  { code: 'BI', en: 'Burundi', ar: 'بوروندي', lat: -3.4, lon: 29.9 },
  { code: 'CV', en: 'Cabo Verde', ar: 'الرأس الأخضر', lat: 14.9, lon: -23.5 },
  { code: 'KH', en: 'Cambodia', ar: 'كمبوديا', lat: 11.6, lon: 104.9 },
  { code: 'CM', en: 'Cameroon', ar: 'الكاميرون', lat: 3.9, lon: 11.5 },
  { code: 'CA', en: 'Canada', ar: 'كندا', lat: 45.4, lon: -75.7 },
  { code: 'CF', en: 'Central African Republic', ar: 'جمهورية أفريقيا الوسطى', lat: 4.4, lon: 18.6 },
  { code: 'TD', en: 'Chad', ar: 'تشاد', lat: 12.1, lon: 15.0 },
  { code: 'CL', en: 'Chile', ar: 'تشيلي', lat: -33.5, lon: -70.6 },
  { code: 'CN', en: 'China', ar: 'الصين', lat: 39.9, lon: 116.4 },
  { code: 'CO', en: 'Colombia', ar: 'كولومبيا', lat: 4.7, lon: -74.1 },
  { code: 'KM', en: 'Comoros', ar: 'جزر القمر', lat: -11.7, lon: 43.3 },
  { code: 'CG', en: 'Congo', ar: 'الكونغو', lat: -4.3, lon: 15.2 },
  { code: 'CD', en: 'Congo (DRC)', ar: 'جمهورية الكونغو الديمقراطية', lat: -4.3, lon: 15.3 },
  { code: 'CR', en: 'Costa Rica', ar: 'كوستاريكا', lat: 9.9, lon: -84.1 },
  { code: 'CI', en: "Côte d'Ivoire", ar: 'ساحل العاج', lat: 6.8, lon: -5.3 },
  { code: 'HR', en: 'Croatia', ar: 'كرواتيا', lat: 45.8, lon: 16.0 },
  { code: 'CU', en: 'Cuba', ar: 'كوبا', lat: 23.1, lon: -82.4 },
  { code: 'CY', en: 'Cyprus', ar: 'قبرص', lat: 35.2, lon: 33.4 },
  { code: 'CZ', en: 'Czechia', ar: 'التشيك', lat: 50.1, lon: 14.4 },
  { code: 'DK', en: 'Denmark', ar: 'الدنمارك', lat: 55.7, lon: 12.6 },
  { code: 'DJ', en: 'Djibouti', ar: 'جيبوتي', lat: 11.6, lon: 43.1 },
  { code: 'DM', en: 'Dominica', ar: 'دومينيكا', lat: 15.3, lon: -61.4 },
  { code: 'DO', en: 'Dominican Republic', ar: 'جمهورية الدومينيكان', lat: 18.5, lon: -69.9 },
  { code: 'EC', en: 'Ecuador', ar: 'الإكوادور', lat: -0.2, lon: -78.5 },
  { code: 'EG', en: 'Egypt', ar: 'مصر', lat: 30.0, lon: 31.2 },
  { code: 'SV', en: 'El Salvador', ar: 'السلفادور', lat: 13.7, lon: -89.2 },
  { code: 'GQ', en: 'Equatorial Guinea', ar: 'غينيا الاستوائية', lat: 3.75, lon: 8.78 },
  { code: 'ER', en: 'Eritrea', ar: 'إريتريا', lat: 15.3, lon: 38.9 },
  { code: 'EE', en: 'Estonia', ar: 'إستونيا', lat: 59.4, lon: 24.8 },
  { code: 'SZ', en: 'Eswatini', ar: 'إسواتيني', lat: -26.3, lon: 31.1 },
  { code: 'ET', en: 'Ethiopia', ar: 'إثيوبيا', lat: 9.0, lon: 38.7 },
  { code: 'FJ', en: 'Fiji', ar: 'فيجي', lat: -18.1, lon: 178.4 },
  { code: 'FI', en: 'Finland', ar: 'فنلندا', lat: 60.2, lon: 24.9 },
  { code: 'FR', en: 'France', ar: 'فرنسا', lat: 48.9, lon: 2.3 },
  { code: 'GA', en: 'Gabon', ar: 'الغابون', lat: 0.4, lon: 9.5 },
  { code: 'GM', en: 'Gambia', ar: 'غامبيا', lat: 13.5, lon: -16.6 },
  { code: 'GE', en: 'Georgia', ar: 'جورجيا', lat: 41.7, lon: 44.8 },
  { code: 'DE', en: 'Germany', ar: 'ألمانيا', lat: 52.5, lon: 13.4 },
  { code: 'GH', en: 'Ghana', ar: 'غانا', lat: 5.6, lon: -0.2 },
  { code: 'GR', en: 'Greece', ar: 'اليونان', lat: 38.0, lon: 23.7 },
  { code: 'GD', en: 'Grenada', ar: 'غرينادا', lat: 12.05, lon: -61.75 },
  { code: 'GT', en: 'Guatemala', ar: 'غواتيمالا', lat: 14.6, lon: -90.5 },
  { code: 'GN', en: 'Guinea', ar: 'غينيا', lat: 9.6, lon: -13.6 },
  { code: 'GW', en: 'Guinea-Bissau', ar: 'غينيا بيساو', lat: 11.9, lon: -15.6 },
  { code: 'GY', en: 'Guyana', ar: 'غيانا', lat: 6.8, lon: -58.2 },
  { code: 'HT', en: 'Haiti', ar: 'هايتي', lat: 18.5, lon: -72.3 },
  { code: 'HN', en: 'Honduras', ar: 'هندوراس', lat: 14.1, lon: -87.2 },
  { code: 'HU', en: 'Hungary', ar: 'المجر', lat: 47.5, lon: 19.0 },
  { code: 'IS', en: 'Iceland', ar: 'آيسلندا', lat: 64.1, lon: -21.9 },
  { code: 'IN', en: 'India', ar: 'الهند', lat: 28.6, lon: 77.2 },
  { code: 'ID', en: 'Indonesia', ar: 'إندونيسيا', lat: -6.2, lon: 106.8 },
  { code: 'IR', en: 'Iran', ar: 'إيران', lat: 35.7, lon: 51.4 },
  { code: 'IQ', en: 'Iraq', ar: 'العراق', lat: 33.3, lon: 44.4 },
  { code: 'IE', en: 'Ireland', ar: 'أيرلندا', lat: 53.3, lon: -6.3 },
  { code: 'IL', en: 'Israel', ar: 'إسرائيل', lat: 31.8, lon: 35.2 },
  { code: 'IT', en: 'Italy', ar: 'إيطاليا', lat: 41.9, lon: 12.5 },
  { code: 'JM', en: 'Jamaica', ar: 'جامايكا', lat: 18.0, lon: -76.8 },
  { code: 'JP', en: 'Japan', ar: 'اليابان', lat: 35.7, lon: 139.7 },
  { code: 'JO', en: 'Jordan', ar: 'الأردن', lat: 31.9, lon: 35.9 },
  { code: 'KZ', en: 'Kazakhstan', ar: 'كازاخستان', lat: 51.2, lon: 71.4 },
  { code: 'KE', en: 'Kenya', ar: 'كينيا', lat: -1.3, lon: 36.8 },
  { code: 'KI', en: 'Kiribati', ar: 'كيريباتي', lat: 1.3, lon: 173.0 },
  { code: 'KP', en: 'North Korea', ar: 'كوريا الشمالية', lat: 39.0, lon: 125.8 },
  { code: 'KR', en: 'South Korea', ar: 'كوريا الجنوبية', lat: 37.6, lon: 127.0 },
  { code: 'XK', en: 'Kosovo', ar: 'كوسوفو', lat: 42.7, lon: 21.2 },
  { code: 'KG', en: 'Kyrgyzstan', ar: 'قيرغيزستان', lat: 42.9, lon: 74.6 },
  { code: 'LA', en: 'Laos', ar: 'لاوس', lat: 18.0, lon: 102.6 },
  { code: 'LV', en: 'Latvia', ar: 'لاتفيا', lat: 56.9, lon: 24.1 },
  { code: 'LB', en: 'Lebanon', ar: 'لبنان', lat: 33.9, lon: 35.5 },
  { code: 'LS', en: 'Lesotho', ar: 'ليسوتو', lat: -29.3, lon: 27.5 },
  { code: 'LR', en: 'Liberia', ar: 'ليبيريا', lat: 6.3, lon: -10.8 },
  { code: 'LY', en: 'Libya', ar: 'ليبيا', lat: 32.9, lon: 13.2 },
  { code: 'LI', en: 'Liechtenstein', ar: 'ليختنشتاين', lat: 47.1, lon: 9.5 },
  { code: 'LT', en: 'Lithuania', ar: 'ليتوانيا', lat: 54.7, lon: 25.3 },
  { code: 'LU', en: 'Luxembourg', ar: 'لوكسمبورغ', lat: 49.6, lon: 6.1 },
  { code: 'MG', en: 'Madagascar', ar: 'مدغشقر', lat: -18.9, lon: 47.5 },
  { code: 'MW', en: 'Malawi', ar: 'ملاوي', lat: -13.98, lon: 33.79 },
  { code: 'MY', en: 'Malaysia', ar: 'ماليزيا', lat: 3.1, lon: 101.7 },
  { code: 'MV', en: 'Maldives', ar: 'المالديف', lat: 4.2, lon: 73.5 },
  { code: 'ML', en: 'Mali', ar: 'مالي', lat: 12.6, lon: -8.0 },
  { code: 'MT', en: 'Malta', ar: 'مالطا', lat: 35.9, lon: 14.5 },
  { code: 'MH', en: 'Marshall Islands', ar: 'جزر مارشال', lat: 7.1, lon: 171.1 },
  { code: 'MR', en: 'Mauritania', ar: 'موريتانيا', lat: 18.1, lon: -15.98 },
  { code: 'MU', en: 'Mauritius', ar: 'موريشيوس', lat: -20.2, lon: 57.5 },
  { code: 'MX', en: 'Mexico', ar: 'المكسيك', lat: 19.4, lon: -99.1 },
  { code: 'FM', en: 'Micronesia', ar: 'ميكرونيزيا', lat: 6.9, lon: 158.2 },
  { code: 'MD', en: 'Moldova', ar: 'مولدوفا', lat: 47.0, lon: 28.9 },
  { code: 'MC', en: 'Monaco', ar: 'موناكو', lat: 43.7, lon: 7.4 },
  { code: 'MN', en: 'Mongolia', ar: 'منغوليا', lat: 47.9, lon: 106.9 },
  { code: 'ME', en: 'Montenegro', ar: 'الجبل الأسود', lat: 42.4, lon: 19.3 },
  { code: 'MA', en: 'Morocco', ar: 'المغرب', lat: 34.0, lon: -6.8 },
  { code: 'MZ', en: 'Mozambique', ar: 'موزمبيق', lat: -25.97, lon: 32.6 },
  { code: 'MM', en: 'Myanmar', ar: 'ميانمار', lat: 19.75, lon: 96.1 },
  { code: 'NA', en: 'Namibia', ar: 'ناميبيا', lat: -22.6, lon: 17.1 },
  { code: 'NR', en: 'Nauru', ar: 'ناورو', lat: -0.55, lon: 166.9 },
  { code: 'NP', en: 'Nepal', ar: 'نيبال', lat: 27.7, lon: 85.3 },
  { code: 'NL', en: 'Netherlands', ar: 'هولندا', lat: 52.4, lon: 4.9 },
  { code: 'NZ', en: 'New Zealand', ar: 'نيوزيلندا', lat: -41.3, lon: 174.8 },
  { code: 'NI', en: 'Nicaragua', ar: 'نيكاراغوا', lat: 12.1, lon: -86.3 },
  { code: 'NE', en: 'Niger', ar: 'النيجر', lat: 13.5, lon: 2.1 },
  { code: 'NG', en: 'Nigeria', ar: 'نيجيريا', lat: 9.1, lon: 7.5 },
  { code: 'MK', en: 'North Macedonia', ar: 'مقدونيا الشمالية', lat: 42.0, lon: 21.4 },
  { code: 'NO', en: 'Norway', ar: 'النرويج', lat: 59.9, lon: 10.7 },
  { code: 'PK', en: 'Pakistan', ar: 'باكستان', lat: 33.7, lon: 73.1 },
  { code: 'PW', en: 'Palau', ar: 'بالاو', lat: 7.5, lon: 134.6 },
  { code: 'PS', en: 'Palestine', ar: 'فلسطين', lat: 31.9, lon: 35.2 },
  { code: 'PA', en: 'Panama', ar: 'بنما', lat: 9.0, lon: -79.5 },
  { code: 'PG', en: 'Papua New Guinea', ar: 'بابوا غينيا الجديدة', lat: -9.5, lon: 147.2 },
  { code: 'PY', en: 'Paraguay', ar: 'باراغواي', lat: -25.3, lon: -57.6 },
  { code: 'PE', en: 'Peru', ar: 'بيرو', lat: -12.0, lon: -77.0 },
  { code: 'PH', en: 'Philippines', ar: 'الفلبين', lat: 14.6, lon: 120.98 },
  { code: 'PL', en: 'Poland', ar: 'بولندا', lat: 52.2, lon: 21.0 },
  { code: 'PT', en: 'Portugal', ar: 'البرتغال', lat: 38.7, lon: -9.1 },
  { code: 'RO', en: 'Romania', ar: 'رومانيا', lat: 44.4, lon: 26.1 },
  { code: 'RU', en: 'Russia', ar: 'روسيا', lat: 55.75, lon: 37.6 },
  { code: 'RW', en: 'Rwanda', ar: 'رواندا', lat: -1.95, lon: 30.06 },
  { code: 'KN', en: 'Saint Kitts and Nevis', ar: 'سانت كيتس ونيفيس', lat: 17.3, lon: -62.7 },
  { code: 'LC', en: 'Saint Lucia', ar: 'سانت لوسيا', lat: 14.0, lon: -61.0 },
  { code: 'VC', en: 'Saint Vincent and the Grenadines', ar: 'سانت فنسنت والغرينادين', lat: 13.16, lon: -61.22 },
  { code: 'WS', en: 'Samoa', ar: 'ساموا', lat: -13.85, lon: -171.75 },
  { code: 'SM', en: 'San Marino', ar: 'سان مارينو', lat: 43.94, lon: 12.45 },
  { code: 'ST', en: 'Sao Tome and Principe', ar: 'ساو تومي وبرينسيبي', lat: 0.33, lon: 6.73 },
  { code: 'SN', en: 'Senegal', ar: 'السنغال', lat: 14.7, lon: -17.4 },
  { code: 'RS', en: 'Serbia', ar: 'صربيا', lat: 44.8, lon: 20.5 },
  { code: 'SC', en: 'Seychelles', ar: 'سيشل', lat: -4.6, lon: 55.45 },
  { code: 'SL', en: 'Sierra Leone', ar: 'سيراليون', lat: 8.48, lon: -13.23 },
  { code: 'SG', en: 'Singapore', ar: 'سنغافورة', lat: 1.35, lon: 103.8 },
  { code: 'SK', en: 'Slovakia', ar: 'سلوفاكيا', lat: 48.1, lon: 17.1 },
  { code: 'SI', en: 'Slovenia', ar: 'سلوفينيا', lat: 46.05, lon: 14.5 },
  { code: 'SB', en: 'Solomon Islands', ar: 'جزر سليمان', lat: -9.43, lon: 159.95 },
  { code: 'SO', en: 'Somalia', ar: 'الصومال', lat: 2.04, lon: 45.34 },
  { code: 'ZA', en: 'South Africa', ar: 'جنوب أفريقيا', lat: -25.7, lon: 28.2 },
  { code: 'SS', en: 'South Sudan', ar: 'جنوب السودان', lat: 4.85, lon: 31.6 },
  { code: 'ES', en: 'Spain', ar: 'إسبانيا', lat: 40.4, lon: -3.7 },
  { code: 'LK', en: 'Sri Lanka', ar: 'سريلانكا', lat: 6.9, lon: 79.85 },
  { code: 'SD', en: 'Sudan', ar: 'السودان', lat: 15.5, lon: 32.5 },
  { code: 'SR', en: 'Suriname', ar: 'سورينام', lat: 5.87, lon: -55.17 },
  { code: 'SE', en: 'Sweden', ar: 'السويد', lat: 59.3, lon: 18.1 },
  { code: 'CH', en: 'Switzerland', ar: 'سويسرا', lat: 46.9, lon: 7.4 },
  { code: 'SY', en: 'Syria', ar: 'سوريا', lat: 33.5, lon: 36.3 },
  { code: 'TW', en: 'Taiwan', ar: 'تايوان', lat: 25.03, lon: 121.6 },
  { code: 'TJ', en: 'Tajikistan', ar: 'طاجيكستان', lat: 38.5, lon: 68.8 },
  { code: 'TZ', en: 'Tanzania', ar: 'تنزانيا', lat: -6.16, lon: 35.75 },
  { code: 'TH', en: 'Thailand', ar: 'تايلاند', lat: 13.75, lon: 100.5 },
  { code: 'TL', en: 'Timor-Leste', ar: 'تيمور الشرقية', lat: -8.55, lon: 125.6 },
  { code: 'TG', en: 'Togo', ar: 'توغو', lat: 6.13, lon: 1.22 },
  { code: 'TO', en: 'Tonga', ar: 'تونغا', lat: -21.14, lon: -175.2 },
  { code: 'TT', en: 'Trinidad and Tobago', ar: 'ترينيداد وتوباغو', lat: 10.65, lon: -61.5 },
  { code: 'TN', en: 'Tunisia', ar: 'تونس', lat: 36.8, lon: 10.18 },
  { code: 'TR', en: 'Turkey', ar: 'تركيا', lat: 39.9, lon: 32.85 },
  { code: 'TM', en: 'Turkmenistan', ar: 'تركمانستان', lat: 37.95, lon: 58.38 },
  { code: 'TV', en: 'Tuvalu', ar: 'توفالو', lat: -8.52, lon: 179.2 },
  { code: 'UG', en: 'Uganda', ar: 'أوغندا', lat: 0.31, lon: 32.58 },
  { code: 'UA', en: 'Ukraine', ar: 'أوكرانيا', lat: 50.45, lon: 30.52 },
  { code: 'GB', en: 'United Kingdom', ar: 'المملكة المتحدة', lat: 51.5, lon: -0.13 },
  { code: 'US', en: 'United States', ar: 'الولايات المتحدة', lat: 38.9, lon: -77.0 },
  { code: 'UY', en: 'Uruguay', ar: 'أوروغواي', lat: -34.9, lon: -56.2 },
  { code: 'UZ', en: 'Uzbekistan', ar: 'أوزبكستان', lat: 41.3, lon: 69.24 },
  { code: 'VU', en: 'Vanuatu', ar: 'فانواتو', lat: -17.73, lon: 168.3 },
  { code: 'VA', en: 'Vatican City', ar: 'الفاتيكان', lat: 41.9, lon: 12.45 },
  { code: 'VE', en: 'Venezuela', ar: 'فنزويلا', lat: 10.5, lon: -66.9 },
  { code: 'VN', en: 'Vietnam', ar: 'فيتنام', lat: 21.03, lon: 105.85 },
  { code: 'YE', en: 'Yemen', ar: 'اليمن', lat: 15.35, lon: 44.2 },
  { code: 'ZM', en: 'Zambia', ar: 'زامبيا', lat: -15.4, lon: 28.28 },
  { code: 'ZW', en: 'Zimbabwe', ar: 'زيمبابوي', lat: -17.83, lon: 31.05 },
];

const GCC_SET = new Set<string>(GCC_CODES);

/**
 * GCC countries first (in `GCC_CODES` order), then everything else sorted
 * alphabetically by its name in the given language.
 */
export function getCountryList(language: 'en' | 'ar'): Country[] {
  const cached = listCache[language];
  if (cached) return cached;
  // One collator for the whole sort: `localeCompare(b, locale)` builds a new
  // one per comparison, which made this sort take seconds on Hermes.
  const collator = new Intl.Collator(language);
  const priority = GCC_CODES.map((code) => COUNTRIES.find((c) => c.code === code)!);
  const rest = COUNTRIES.filter((c) => !GCC_SET.has(c.code)).sort((a, b) => collator.compare(a[language], b[language]));
  return (listCache[language] = [...priority, ...rest]);
}

const listCache: Partial<Record<'en' | 'ar', Country[]>> = {};

export function getCountryName(code: string, language: 'en' | 'ar'): string | null {
  const country = COUNTRIES.find((c) => c.code === code);
  return country ? country[language] : null;
}

export function getCountry(code: string): Country | null {
  return COUNTRIES.find((c) => c.code === code) ?? null;
}
