'use client';

import { useState, useEffect, useCallback, useMemo, Component, ReactNode } from 'react';
import dynamic from 'next/dynamic';
import LanguageSelector from '@/components/LanguageSelector';
import EarthquakeList from '@/components/EarthquakeList';
import WeatherInfo from '@/components/WeatherInfo';
import EmergencyAlert from '@/components/EmergencyAlert';
import { EarthquakeIcon, ShelterIcon } from '@/components/icons/DisasterIcons';

// Error Boundary コンポーネント
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  language: string;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      const errorMessages: Record<string, { title: string; message: string; retry: string }> = {
        ja: { title: 'エラーが発生しました', message: 'データの読み込みに失敗しました。', retry: '再読み込み' },
        en: { title: 'An error occurred', message: 'Failed to load data.', retry: 'Reload' },
        easy_ja: { title: 'エラー', message: 'よみこみが できませんでした。', retry: 'もういちど' },
      };
      const msg = errorMessages[this.props.language] || errorMessages.en;

      return (
        this.props.fallback || (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center" role="alert">
            <div className="text-red-600 text-4xl mb-2" aria-hidden="true">⚠️</div>
            <h3 className="text-lg font-bold text-red-800 mb-2">{msg.title}</h3>
            <p className="text-red-600 mb-4">{msg.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              {msg.retry}
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// Leafletはクライアントサイドのみで動作するため、SSRを無効化
const EarthquakeMap = dynamic(() => import('@/components/EarthquakeMap'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-64 bg-gray-100 rounded-lg">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-disaster-blue"></div>
    </div>
  ),
});

const ShelterMap = dynamic(() => import('@/components/ShelterMap'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-64 bg-gray-100 rounded-lg">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-disaster-blue"></div>
    </div>
  ),
});

// 多言語テキスト（拡充版：16言語対応）
const translations: Record<string, Record<string, string>> = {
  ja: {
    title: '災害対応AI',
    subtitle: '多言語災害情報システム',
    earthquake: '地震情報',
    weather: '天気情報',
    shelter: '避難所',
    checklist: '防災グッズ',
    settings: '設定',
    loading: '読み込み中...',
    noData: 'データがありません',
    lastUpdate: '最終更新',
    listView: 'リスト',
    mapView: '地図',
    safetyTips: '安全のヒント',
    dataSource: '情報元: 気象庁、P2P地震情報',
    disclaimer: '※この情報は参考情報です。正確な情報は公式発表をご確認ください。',
  },
  en: {
    title: 'Disaster AI',
    subtitle: 'Multilingual Disaster Info',
    earthquake: 'Earthquakes',
    weather: 'Weather',
    shelter: 'Shelters',
    checklist: 'Emergency Kit',
    settings: 'Settings',
    loading: 'Loading...',
    noData: 'No data available',
    lastUpdate: 'Last update',
    listView: 'List',
    mapView: 'Map',
    safetyTips: 'Safety Tips',
    dataSource: 'Data: JMA, P2P Earthquake',
    disclaimer: '* This is reference info. Check official sources for accuracy.',
  },
  zh: {
    title: '灾害应对AI',
    subtitle: '多语言灾害信息系统',
    earthquake: '地震信息',
    weather: '天气信息',
    shelter: '避难所',
    checklist: '防灾清单',
    settings: '设置',
    loading: '加载中...',
    noData: '暂无数据',
    lastUpdate: '最后更新',
    listView: '列表',
    mapView: '地图',
    safetyTips: '安全提示',
    dataSource: '数据来源：气象厅、P2P地震情报',
    disclaimer: '※此为参考信息。请以官方发布为准。',
  },
  'zh-TW': {
    title: '災害應對AI',
    subtitle: '多語言災害資訊系統',
    earthquake: '地震資訊',
    weather: '天氣資訊',
    shelter: '避難所',
    checklist: '防災清單',
    settings: '設定',
    loading: '載入中...',
    noData: '暫無資料',
    lastUpdate: '最後更新',
    listView: '列表',
    mapView: '地圖',
    safetyTips: '安全提示',
    dataSource: '資料來源：氣象廳、P2P地震情報',
    disclaimer: '※此為參考資訊。請以官方發布為準。',
  },
  ko: {
    title: '재난대응AI',
    subtitle: '다국어 재난 정보 시스템',
    earthquake: '지진 정보',
    weather: '날씨 정보',
    shelter: '대피소',
    checklist: '방재 체크리스트',
    settings: '설정',
    loading: '로딩 중...',
    noData: '데이터가 없습니다',
    lastUpdate: '마지막 업데이트',
    listView: '목록',
    mapView: '지도',
    safetyTips: '안전 팁',
    dataSource: '데이터: 기상청, P2P 지진정보',
    disclaimer: '※ 이것은 참고 정보입니다. 정확한 정보는 공식 발표를 확인하세요.',
  },
  vi: {
    title: 'AI Ứng phó Thiên tai',
    subtitle: 'Hệ thống thông tin đa ngôn ngữ',
    earthquake: 'Động đất',
    weather: 'Thời tiết',
    shelter: 'Nơi trú ẩn',
    checklist: 'Danh sách',
    settings: 'Cài đặt',
    loading: 'Đang tải...',
    noData: 'Không có dữ liệu',
    lastUpdate: 'Cập nhật lần cuối',
    listView: 'Danh sách',
    mapView: 'Bản đồ',
    safetyTips: 'Mẹo an toàn',
    dataSource: 'Nguồn: JMA, P2P Earthquake',
    disclaimer: '※ Đây là thông tin tham khảo. Hãy kiểm tra nguồn chính thức.',
  },
  th: {
    title: 'AI รับมือภัยพิบัติ',
    subtitle: 'ระบบข้อมูลภัยพิบัติหลายภาษา',
    earthquake: 'แผ่นดินไหว',
    weather: 'สภาพอากาศ',
    shelter: 'ที่พักพิง',
    checklist: 'รายการ',
    settings: 'ตั้งค่า',
    loading: 'กำลังโหลด...',
    noData: 'ไม่มีข้อมูล',
    lastUpdate: 'อัปเดตล่าสุด',
    listView: 'รายการ',
    mapView: 'แผนที่',
    safetyTips: 'เคล็ดลับความปลอดภัย',
    dataSource: 'ข้อมูล: JMA, P2P Earthquake',
    disclaimer: '※ นี่คือข้อมูลอ้างอิง โปรดตรวจสอบแหล่งข้อมูลที่เป็นทางการ',
  },
  id: {
    title: 'AI Bencana',
    subtitle: 'Sistem Info Bencana Multibahasa',
    earthquake: 'Gempa',
    weather: 'Cuaca',
    shelter: 'Tempat Pengungsian',
    checklist: 'Daftar',
    settings: 'Pengaturan',
    loading: 'Memuat...',
    noData: 'Tidak ada data',
    lastUpdate: 'Update terakhir',
    listView: 'Daftar',
    mapView: 'Peta',
    safetyTips: 'Tips Keselamatan',
    dataSource: 'Sumber: JMA, P2P Earthquake',
    disclaimer: '※ Ini adalah informasi referensi. Periksa sumber resmi.',
  },
  ms: {
    title: 'AI Bencana',
    subtitle: 'Sistem Maklumat Berbilang Bahasa',
    earthquake: 'Gempa Bumi',
    weather: 'Cuaca',
    shelter: 'Tempat Perlindungan',
    checklist: 'Senarai',
    settings: 'Tetapan',
    loading: 'Memuatkan...',
    noData: 'Tiada data',
    lastUpdate: 'Kemas kini terakhir',
    listView: 'Senarai',
    mapView: 'Peta',
    safetyTips: 'Petua Keselamatan',
    dataSource: 'Sumber: JMA, P2P Earthquake',
    disclaimer: '※ Ini adalah maklumat rujukan. Semak sumber rasmi.',
  },
  tl: {
    title: 'AI Sakuna',
    subtitle: 'Multi-Language na Impormasyon',
    earthquake: 'Lindol',
    weather: 'Panahon',
    shelter: 'Evacuation Center',
    checklist: 'Listahan',
    settings: 'Mga Setting',
    loading: 'Naglo-load...',
    noData: 'Walang data',
    lastUpdate: 'Huling update',
    listView: 'Listahan',
    mapView: 'Mapa',
    safetyTips: 'Mga Tips sa Kaligtasan',
    dataSource: 'Pinagmulan: JMA, P2P Earthquake',
    disclaimer: '※ Ito ay reference na impormasyon. I-check ang opisyal na pinagmulan.',
  },
  ne: {
    title: 'विपद् प्रतिक्रिया AI',
    subtitle: 'बहुभाषिक विपद् सूचना',
    earthquake: 'भूकम्प',
    weather: 'मौसम',
    shelter: 'आश्रय',
    checklist: 'सूची',
    settings: 'सेटिङ',
    loading: 'लोड हुँदैछ...',
    noData: 'डाटा छैन',
    lastUpdate: 'अन्तिम अद्यावधिक',
    listView: 'सूची',
    mapView: 'नक्सा',
    safetyTips: 'सुरक्षा सुझावहरू',
    dataSource: 'स्रोत: JMA, P2P भूकम्प',
    disclaimer: '※ यो सन्दर्भ जानकारी हो। आधिकारिक स्रोत जाँच गर्नुहोस्।',
  },
  fr: {
    title: 'IA Catastrophe',
    subtitle: 'Système multilingue',
    earthquake: 'Séismes',
    weather: 'Météo',
    shelter: 'Abris',
    checklist: 'Liste',
    settings: 'Paramètres',
    loading: 'Chargement...',
    noData: 'Pas de données',
    lastUpdate: 'Dernière MAJ',
    listView: 'Liste',
    mapView: 'Carte',
    safetyTips: 'Conseils de sécurité',
    dataSource: 'Source: JMA, P2P Earthquake',
    disclaimer: '※ Informations de référence. Vérifiez les sources officielles.',
  },
  de: {
    title: 'Katastrophen-KI',
    subtitle: 'Mehrsprachiges System',
    earthquake: 'Erdbeben',
    weather: 'Wetter',
    shelter: 'Notunterkünfte',
    checklist: 'Checkliste',
    settings: 'Einstellungen',
    loading: 'Laden...',
    noData: 'Keine Daten',
    lastUpdate: 'Letzte Aktualisierung',
    listView: 'Liste',
    mapView: 'Karte',
    safetyTips: 'Sicherheitstipps',
    dataSource: 'Quelle: JMA, P2P Earthquake',
    disclaimer: '※ Dies sind Referenzinformationen. Offizielle Quellen prüfen.',
  },
  it: {
    title: 'AI Disastri',
    subtitle: 'Sistema multilingue',
    earthquake: 'Terremoti',
    weather: 'Meteo',
    shelter: 'Rifugi',
    checklist: 'Lista',
    settings: 'Impostazioni',
    loading: 'Caricamento...',
    noData: 'Nessun dato',
    lastUpdate: 'Ultimo aggiornamento',
    listView: 'Lista',
    mapView: 'Mappa',
    safetyTips: 'Consigli di sicurezza',
    dataSource: 'Fonte: JMA, P2P Earthquake',
    disclaimer: '※ Informazioni di riferimento. Verificare le fonti ufficiali.',
  },
  es: {
    title: 'IA Desastres',
    subtitle: 'Sistema multilingüe',
    earthquake: 'Terremotos',
    weather: 'Clima',
    shelter: 'Refugios',
    checklist: 'Lista',
    settings: 'Configuración',
    loading: 'Cargando...',
    noData: 'Sin datos',
    lastUpdate: 'Última actualización',
    listView: 'Lista',
    mapView: 'Mapa',
    safetyTips: 'Consejos de seguridad',
    dataSource: 'Fuente: JMA, P2P Earthquake',
    disclaimer: '※ Información de referencia. Consulte fuentes oficiales.',
  },
  easy_ja: {
    title: 'さいがい じょうほう',
    subtitle: 'やさしい にほんご',
    earthquake: 'じしん',
    weather: 'てんき',
    shelter: 'ひなんじょ',
    checklist: 'もちもの',
    settings: 'せってい',
    loading: 'よみこみちゅう...',
    noData: 'データが ありません',
    lastUpdate: 'さいしん',
    listView: 'リスト',
    mapView: 'ちず',
    safetyTips: 'あんぜんの ヒント',
    dataSource: 'じょうほうげん: きしょうちょう',
    disclaimer: '※これは さんこう じょうほう です。こうしき はっぴょうを かくにん してください。',
  },
};

// 地震データの型定義
interface Earthquake {
  id: string;
  time: string;
  location: string;
  location_translated?: string;
  magnitude: number;
  max_intensity: string;
  max_intensity_translated?: string;
  depth: number;
  latitude: number;
  longitude: number;
  tsunami_warning: string;
  tsunami_warning_translated?: string;
  message: string;
  message_translated?: string;
}

// バックエンドAPIのベースURL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type TabType = 'earthquake' | 'weather' | 'shelter' | 'checklist';
type EarthquakeViewType = 'list' | 'map';

// タブアイコンコンポーネント
function TabIcon({ tab, active }: { tab: TabType; active: boolean }) {
  const size = 20;
  const color = active ? '#2563eb' : '#6B7280';

  switch (tab) {
    case 'earthquake':
      return <EarthquakeIcon size={size} className={active ? '' : 'opacity-60'} />;
    case 'shelter':
      return <ShelterIcon size={size} className={active ? '' : 'opacity-60'} />;
    case 'weather':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
          <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1z" />
        </svg>
      );
    case 'checklist':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      );
  }
}

// エラー状態の型定義
interface ApiError {
  message: string;
  retryable: boolean;
}

// 多言語エラーメッセージ
const errorMessages: Record<string, Record<string, string>> = {
  networkError: {
    ja: 'ネットワーク接続を確認してください',
    en: 'Please check your network connection',
    easy_ja: 'インターネットを かくにん してください',
    zh: '请检查您的网络连接',
    ko: '네트워크 연결을 확인하세요',
    vi: 'Vui lòng kiểm tra kết nối mạng',
  },
  serverError: {
    ja: 'サーバーに接続できません',
    en: 'Cannot connect to server',
    easy_ja: 'サーバーに つながりません',
    zh: '无法连接到服务器',
    ko: '서버에 연결할 수 없습니다',
    vi: 'Không thể kết nối máy chủ',
  },
  retry: {
    ja: '再試行',
    en: 'Retry',
    easy_ja: 'もういちど',
    zh: '重试',
    ko: '다시 시도',
    vi: 'Thử lại',
  },
};

export default function Home() {
  const [language, setLanguage] = useState('ja');
  const [activeTab, setActiveTab] = useState<TabType>('earthquake');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [earthquakeView, setEarthquakeView] = useState<EarthquakeViewType>('list');
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [earthquakeLoading, setEarthquakeLoading] = useState(true);
  const [earthquakeError, setEarthquakeError] = useState<ApiError | null>(null);

  const t = useCallback(
    (key: keyof typeof translations.ja) => translations[language]?.[key] || translations.ja[key],
    [language]
  );

  // エラーメッセージ取得
  const getErrorMessage = useCallback(
    (key: keyof typeof errorMessages) => errorMessages[key][language] || errorMessages[key].en,
    [language]
  );

  // 地震データの取得
  const fetchEarthquakes = useCallback(async () => {
    try {
      setEarthquakeLoading(true);
      setEarthquakeError(null);
      const response = await fetch(`${API_BASE_URL}/api/v1/earthquakes?lang=${language}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        setEarthquakes(data);
      } else {
        throw new Error('Server error');
      }
    } catch (err) {
      console.error('Failed to fetch earthquakes:', err);
      const isNetworkError = err instanceof TypeError && err.message.includes('fetch');
      setEarthquakeError({
        message: isNetworkError ? getErrorMessage('networkError') : getErrorMessage('serverError'),
        retryable: true,
      });
    } finally {
      setEarthquakeLoading(false);
    }
  }, [language, getErrorMessage]);

  useEffect(() => {
    fetchEarthquakes();
  }, [fetchEarthquakes, lastUpdate]);

  useEffect(() => {
    // 30秒ごとにデータを更新
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 緊急警報オーバーレイ */}
      <EmergencyAlert language={language} />

      {/* ヘッダー */}
      <header className="bg-disaster-blue text-white p-4 shadow-lg sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <EarthquakeIcon size={32} />
            <div>
              <h1 className="text-xl md:text-2xl font-bold">{t('title')}</h1>
              <p className="text-xs md:text-sm opacity-80">{t('subtitle')}</p>
            </div>
          </div>
          <LanguageSelector currentLanguage={language} onLanguageChange={setLanguage} />
        </div>
      </header>

      {/* タブナビゲーション（アイコン付き・アクセシビリティ強化） */}
      <nav className="bg-white border-b sticky top-[72px] z-30 shadow-sm" aria-label={language === 'ja' ? 'メインナビゲーション' : 'Main navigation'}>
        <div className="max-w-4xl mx-auto flex" role="tablist" aria-label={language === 'ja' ? '情報カテゴリ' : 'Information categories'}>
          {(['earthquake', 'weather', 'shelter', 'checklist'] as TabType[]).map((tab) => (
            <button
              key={tab}
              id={`tab-${tab}`}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-2 md:px-4 text-center font-medium transition-colors flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 focus:outline-none focus:ring-2 focus:ring-disaster-blue focus:ring-inset ${
                activeTab === tab
                  ? 'text-disaster-blue border-b-2 border-disaster-blue bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              aria-selected={activeTab === tab}
              aria-controls={`tabpanel-${tab}`}
              role="tab"
              tabIndex={activeTab === tab ? 0 : -1}
            >
              <TabIcon tab={tab} active={activeTab === tab} />
              <span className="text-xs md:text-sm">{t(tab)}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* メインコンテンツ */}
      <div className="max-w-4xl mx-auto p-4">
        {/* 最終更新時刻 */}
        <div className="text-right text-sm text-gray-500 mb-4 flex items-center justify-end gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          {t('lastUpdate')}: {lastUpdate.toLocaleTimeString(language === 'ja' ? 'ja-JP' : 'en-US')}
        </div>

        {/* タブコンテンツ（アクセシビリティ強化） */}
        <ErrorBoundary language={language}>
          {activeTab === 'earthquake' && (
            <div
              id="tabpanel-earthquake"
              role="tabpanel"
              aria-labelledby="tab-earthquake"
              className="space-y-4"
              tabIndex={0}
            >
              {/* リスト/地図切り替えボタン */}
              <div className="flex justify-end" role="group" aria-label={language === 'ja' ? '表示切替' : 'View toggle'}>
                <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden shadow-sm">
                  <button
                    onClick={() => setEarthquakeView('list')}
                    className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-disaster-blue focus:ring-inset ${
                      earthquakeView === 'list'
                        ? 'bg-disaster-blue text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                    aria-pressed={earthquakeView === 'list'}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
                    </svg>
                    {t('listView')}
                  </button>
                  <button
                    onClick={() => setEarthquakeView('map')}
                    className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-disaster-blue focus:ring-inset ${
                      earthquakeView === 'map'
                        ? 'bg-disaster-blue text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                    aria-pressed={earthquakeView === 'map'}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z" />
                    </svg>
                    {t('mapView')}
                  </button>
                </div>
              </div>

              {/* エラー表示 */}
              {earthquakeError && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3" role="alert">
                  <span className="text-2xl" aria-hidden="true">⚠️</span>
                  <div className="flex-1">
                    <p className="text-amber-800 font-medium">{earthquakeError.message}</p>
                  </div>
                  {earthquakeError.retryable && (
                    <button
                      onClick={fetchEarthquakes}
                      className="px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                    >
                      {getErrorMessage('retry')}
                    </button>
                  )}
                </div>
              )}

              {/* リスト表示 */}
              {earthquakeView === 'list' && <EarthquakeList language={language} />}

              {/* 地図表示 */}
              {earthquakeView === 'map' &&
                (earthquakeLoading ? (
                  <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow" role="status" aria-label={t('loading')}>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-disaster-blue" aria-hidden="true"></div>
                    <span className="sr-only">{t('loading')}</span>
                  </div>
                ) : (
                  <EarthquakeMap earthquakes={earthquakes} language={language} />
                ))}
            </div>
          )}

          {activeTab === 'weather' && (
            <div id="tabpanel-weather" role="tabpanel" aria-labelledby="tab-weather" tabIndex={0}>
              <WeatherInfo language={language} />
            </div>
          )}

          {activeTab === 'shelter' && (
            <div id="tabpanel-shelter" role="tabpanel" aria-labelledby="tab-shelter" tabIndex={0}>
              <ShelterMap language={language} />
            </div>
          )}

          {activeTab === 'checklist' && (
            <div id="tabpanel-checklist" role="tabpanel" aria-labelledby="tab-checklist" tabIndex={0}>
              <ChecklistSection language={language} />
            </div>
          )}
        </ErrorBoundary>
      </div>

      {/* フッター */}
      <footer className="bg-gray-100 border-t mt-8 py-4">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-600">
          <p>{t('dataSource')}</p>
          <p className="mt-1">{t('disclaimer')}</p>
        </div>
      </footer>
    </main>
  );
}

// 防災チェックリストコンポーネント（16言語対応版）
function ChecklistSection({ language }: { language: string }) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  // 16言語対応チェックリストデータ
  const checklistItems: Record<string, { category: string; items: { id: string; name: string; priority: 'high' | 'medium' | 'low' }[] }[]> = {
    ja: [
      { category: '🚰 水・食料', items: [
        { id: 'water', name: '飲料水（1人3L×3日分）', priority: 'high' },
        { id: 'food', name: '非常食（3日分）', priority: 'high' },
        { id: 'can', name: '缶詰・レトルト食品', priority: 'medium' },
      ]},
      { category: '🚽 衛生用品', items: [
        { id: 'toilet', name: '非常用トイレ（最重要！）', priority: 'high' },
        { id: 'wipes', name: 'ウェットティッシュ', priority: 'medium' },
        { id: 'sanitary', name: '生理用品', priority: 'medium' },
        { id: 'mask', name: 'マスク', priority: 'medium' },
      ]},
      { category: '🔦 情報・照明', items: [
        { id: 'battery', name: 'モバイルバッテリー（大容量）', priority: 'high' },
        { id: 'flashlight', name: '懐中電灯', priority: 'high' },
        { id: 'radio', name: '携帯ラジオ', priority: 'medium' },
      ]},
      { category: '💰 貴重品', items: [
        { id: 'cash', name: '現金（小銭も）', priority: 'high' },
        { id: 'id', name: '身分証明書のコピー', priority: 'medium' },
        { id: 'insurance', name: '保険証のコピー', priority: 'medium' },
      ]},
      { category: '🎒 その他', items: [
        { id: 'firstaid', name: '救急セット', priority: 'medium' },
        { id: 'medicine', name: '常備薬', priority: 'high' },
        { id: 'tarp', name: 'ブルーシート', priority: 'low' },
        { id: 'gloves', name: '軍手', priority: 'low' },
      ]},
    ],
    en: [
      { category: '🚰 Water & Food', items: [
        { id: 'water', name: 'Drinking water (3L×3 days/person)', priority: 'high' },
        { id: 'food', name: 'Emergency food (3 days)', priority: 'high' },
        { id: 'can', name: 'Canned/retort food', priority: 'medium' },
      ]},
      { category: '🚽 Hygiene', items: [
        { id: 'toilet', name: 'Emergency toilet (Most important!)', priority: 'high' },
        { id: 'wipes', name: 'Wet wipes', priority: 'medium' },
        { id: 'sanitary', name: 'Sanitary products', priority: 'medium' },
        { id: 'mask', name: 'Masks', priority: 'medium' },
      ]},
      { category: '🔦 Info & Light', items: [
        { id: 'battery', name: 'Power bank (large capacity)', priority: 'high' },
        { id: 'flashlight', name: 'Flashlight', priority: 'high' },
        { id: 'radio', name: 'Portable radio', priority: 'medium' },
      ]},
      { category: '💰 Valuables', items: [
        { id: 'cash', name: 'Cash (coins too)', priority: 'high' },
        { id: 'id', name: 'ID copy', priority: 'medium' },
        { id: 'insurance', name: 'Insurance card copy', priority: 'medium' },
      ]},
      { category: '🎒 Others', items: [
        { id: 'firstaid', name: 'First aid kit', priority: 'medium' },
        { id: 'medicine', name: 'Regular medicine', priority: 'high' },
        { id: 'tarp', name: 'Blue tarp', priority: 'low' },
        { id: 'gloves', name: 'Work gloves', priority: 'low' },
      ]},
    ],
    zh: [
      { category: '🚰 饮水与食物', items: [
        { id: 'water', name: '饮用水（每人3L×3天）', priority: 'high' },
        { id: 'food', name: '应急食品（3天量）', priority: 'high' },
        { id: 'can', name: '罐头/方便食品', priority: 'medium' },
      ]},
      { category: '🚽 卫生用品', items: [
        { id: 'toilet', name: '应急厕所（最重要！）', priority: 'high' },
        { id: 'wipes', name: '湿纸巾', priority: 'medium' },
        { id: 'sanitary', name: '卫生用品', priority: 'medium' },
        { id: 'mask', name: '口罩', priority: 'medium' },
      ]},
      { category: '🔦 信息与照明', items: [
        { id: 'battery', name: '充电宝（大容量）', priority: 'high' },
        { id: 'flashlight', name: '手电筒', priority: 'high' },
        { id: 'radio', name: '便携收音机', priority: 'medium' },
      ]},
      { category: '💰 贵重物品', items: [
        { id: 'cash', name: '现金（含硬币）', priority: 'high' },
        { id: 'id', name: '身份证复印件', priority: 'medium' },
        { id: 'insurance', name: '保险卡复印件', priority: 'medium' },
      ]},
      { category: '🎒 其他', items: [
        { id: 'firstaid', name: '急救包', priority: 'medium' },
        { id: 'medicine', name: '常用药', priority: 'high' },
        { id: 'tarp', name: '防水布', priority: 'low' },
        { id: 'gloves', name: '工作手套', priority: 'low' },
      ]},
    ],
    'zh-TW': [
      { category: '🚰 飲水與食物', items: [
        { id: 'water', name: '飲用水（每人3L×3天）', priority: 'high' },
        { id: 'food', name: '應急食品（3天量）', priority: 'high' },
        { id: 'can', name: '罐頭/即食食品', priority: 'medium' },
      ]},
      { category: '🚽 衛生用品', items: [
        { id: 'toilet', name: '應急廁所（最重要！）', priority: 'high' },
        { id: 'wipes', name: '濕紙巾', priority: 'medium' },
        { id: 'sanitary', name: '衛生用品', priority: 'medium' },
        { id: 'mask', name: '口罩', priority: 'medium' },
      ]},
      { category: '🔦 資訊與照明', items: [
        { id: 'battery', name: '行動電源（大容量）', priority: 'high' },
        { id: 'flashlight', name: '手電筒', priority: 'high' },
        { id: 'radio', name: '便攜收音機', priority: 'medium' },
      ]},
      { category: '💰 貴重物品', items: [
        { id: 'cash', name: '現金（含硬幣）', priority: 'high' },
        { id: 'id', name: '身份證影本', priority: 'medium' },
        { id: 'insurance', name: '健保卡影本', priority: 'medium' },
      ]},
      { category: '🎒 其他', items: [
        { id: 'firstaid', name: '急救包', priority: 'medium' },
        { id: 'medicine', name: '常用藥', priority: 'high' },
        { id: 'tarp', name: '防水布', priority: 'low' },
        { id: 'gloves', name: '工作手套', priority: 'low' },
      ]},
    ],
    ko: [
      { category: '🚰 물과 식량', items: [
        { id: 'water', name: '음료수 (1인 3L×3일분)', priority: 'high' },
        { id: 'food', name: '비상식량 (3일분)', priority: 'high' },
        { id: 'can', name: '통조림/레토르트 식품', priority: 'medium' },
      ]},
      { category: '🚽 위생용품', items: [
        { id: 'toilet', name: '비상용 화장실 (가장 중요!)', priority: 'high' },
        { id: 'wipes', name: '물티슈', priority: 'medium' },
        { id: 'sanitary', name: '위생용품', priority: 'medium' },
        { id: 'mask', name: '마스크', priority: 'medium' },
      ]},
      { category: '🔦 정보 및 조명', items: [
        { id: 'battery', name: '보조배터리 (대용량)', priority: 'high' },
        { id: 'flashlight', name: '손전등', priority: 'high' },
        { id: 'radio', name: '휴대용 라디오', priority: 'medium' },
      ]},
      { category: '💰 귀중품', items: [
        { id: 'cash', name: '현금 (동전 포함)', priority: 'high' },
        { id: 'id', name: '신분증 사본', priority: 'medium' },
        { id: 'insurance', name: '보험증 사본', priority: 'medium' },
      ]},
      { category: '🎒 기타', items: [
        { id: 'firstaid', name: '구급상자', priority: 'medium' },
        { id: 'medicine', name: '상비약', priority: 'high' },
        { id: 'tarp', name: '방수포', priority: 'low' },
        { id: 'gloves', name: '작업 장갑', priority: 'low' },
      ]},
    ],
    vi: [
      { category: '🚰 Nước & Thực phẩm', items: [
        { id: 'water', name: 'Nước uống (3L×3 ngày/người)', priority: 'high' },
        { id: 'food', name: 'Thực phẩm khẩn cấp (3 ngày)', priority: 'high' },
        { id: 'can', name: 'Đồ hộp/Thực phẩm ăn liền', priority: 'medium' },
      ]},
      { category: '🚽 Vệ sinh', items: [
        { id: 'toilet', name: 'Toilet khẩn cấp (Quan trọng nhất!)', priority: 'high' },
        { id: 'wipes', name: 'Khăn ướt', priority: 'medium' },
        { id: 'sanitary', name: 'Đồ vệ sinh', priority: 'medium' },
        { id: 'mask', name: 'Khẩu trang', priority: 'medium' },
      ]},
      { category: '🔦 Thông tin & Ánh sáng', items: [
        { id: 'battery', name: 'Pin dự phòng (dung lượng lớn)', priority: 'high' },
        { id: 'flashlight', name: 'Đèn pin', priority: 'high' },
        { id: 'radio', name: 'Radio di động', priority: 'medium' },
      ]},
      { category: '💰 Vật có giá trị', items: [
        { id: 'cash', name: 'Tiền mặt (cả tiền xu)', priority: 'high' },
        { id: 'id', name: 'Bản sao CMND', priority: 'medium' },
        { id: 'insurance', name: 'Bản sao thẻ bảo hiểm', priority: 'medium' },
      ]},
      { category: '🎒 Khác', items: [
        { id: 'firstaid', name: 'Bộ sơ cứu', priority: 'medium' },
        { id: 'medicine', name: 'Thuốc thường dùng', priority: 'high' },
        { id: 'tarp', name: 'Bạt chống nước', priority: 'low' },
        { id: 'gloves', name: 'Găng tay lao động', priority: 'low' },
      ]},
    ],
    th: [
      { category: '🚰 น้ำและอาหาร', items: [
        { id: 'water', name: 'น้ำดื่ม (3L×3วัน/คน)', priority: 'high' },
        { id: 'food', name: 'อาหารฉุกเฉิน (3 วัน)', priority: 'high' },
        { id: 'can', name: 'อาหารกระป๋อง/สำเร็จรูป', priority: 'medium' },
      ]},
      { category: '🚽 สุขอนามัย', items: [
        { id: 'toilet', name: 'ห้องน้ำฉุกเฉิน (สำคัญที่สุด!)', priority: 'high' },
        { id: 'wipes', name: 'ทิชชู่เปียก', priority: 'medium' },
        { id: 'sanitary', name: 'ผ้าอนามัย', priority: 'medium' },
        { id: 'mask', name: 'หน้ากากอนามัย', priority: 'medium' },
      ]},
      { category: '🔦 ข้อมูลและแสงสว่าง', items: [
        { id: 'battery', name: 'พาวเวอร์แบงค์ (ความจุสูง)', priority: 'high' },
        { id: 'flashlight', name: 'ไฟฉาย', priority: 'high' },
        { id: 'radio', name: 'วิทยุพกพา', priority: 'medium' },
      ]},
      { category: '💰 ของมีค่า', items: [
        { id: 'cash', name: 'เงินสด (รวมเหรียญ)', priority: 'high' },
        { id: 'id', name: 'สำเนาบัตรประชาชน', priority: 'medium' },
        { id: 'insurance', name: 'สำเนาบัตรประกัน', priority: 'medium' },
      ]},
      { category: '🎒 อื่นๆ', items: [
        { id: 'firstaid', name: 'ชุดปฐมพยาบาล', priority: 'medium' },
        { id: 'medicine', name: 'ยาประจำตัว', priority: 'high' },
        { id: 'tarp', name: 'ผ้าใบกันน้ำ', priority: 'low' },
        { id: 'gloves', name: 'ถุงมือ', priority: 'low' },
      ]},
    ],
    id: [
      { category: '🚰 Air & Makanan', items: [
        { id: 'water', name: 'Air minum (3L×3 hari/orang)', priority: 'high' },
        { id: 'food', name: 'Makanan darurat (3 hari)', priority: 'high' },
        { id: 'can', name: 'Makanan kaleng/instan', priority: 'medium' },
      ]},
      { category: '🚽 Kebersihan', items: [
        { id: 'toilet', name: 'Toilet darurat (Paling penting!)', priority: 'high' },
        { id: 'wipes', name: 'Tisu basah', priority: 'medium' },
        { id: 'sanitary', name: 'Pembalut', priority: 'medium' },
        { id: 'mask', name: 'Masker', priority: 'medium' },
      ]},
      { category: '🔦 Info & Penerangan', items: [
        { id: 'battery', name: 'Power bank (kapasitas besar)', priority: 'high' },
        { id: 'flashlight', name: 'Senter', priority: 'high' },
        { id: 'radio', name: 'Radio portabel', priority: 'medium' },
      ]},
      { category: '💰 Barang Berharga', items: [
        { id: 'cash', name: 'Uang tunai (termasuk koin)', priority: 'high' },
        { id: 'id', name: 'Fotokopi KTP', priority: 'medium' },
        { id: 'insurance', name: 'Fotokopi kartu asuransi', priority: 'medium' },
      ]},
      { category: '🎒 Lainnya', items: [
        { id: 'firstaid', name: 'Kotak P3K', priority: 'medium' },
        { id: 'medicine', name: 'Obat rutin', priority: 'high' },
        { id: 'tarp', name: 'Terpal', priority: 'low' },
        { id: 'gloves', name: 'Sarung tangan kerja', priority: 'low' },
      ]},
    ],
    ms: [
      { category: '🚰 Air & Makanan', items: [
        { id: 'water', name: 'Air minuman (3L×3 hari/orang)', priority: 'high' },
        { id: 'food', name: 'Makanan kecemasan (3 hari)', priority: 'high' },
        { id: 'can', name: 'Makanan tin/segera', priority: 'medium' },
      ]},
      { category: '🚽 Kebersihan', items: [
        { id: 'toilet', name: 'Tandas kecemasan (Paling penting!)', priority: 'high' },
        { id: 'wipes', name: 'Tisu basah', priority: 'medium' },
        { id: 'sanitary', name: 'Tuala wanita', priority: 'medium' },
        { id: 'mask', name: 'Topeng muka', priority: 'medium' },
      ]},
      { category: '🔦 Maklumat & Lampu', items: [
        { id: 'battery', name: 'Power bank (kapasiti besar)', priority: 'high' },
        { id: 'flashlight', name: 'Lampu suluh', priority: 'high' },
        { id: 'radio', name: 'Radio mudah alih', priority: 'medium' },
      ]},
      { category: '💰 Barang Berharga', items: [
        { id: 'cash', name: 'Wang tunai (termasuk syiling)', priority: 'high' },
        { id: 'id', name: 'Salinan kad pengenalan', priority: 'medium' },
        { id: 'insurance', name: 'Salinan kad insurans', priority: 'medium' },
      ]},
      { category: '🎒 Lain-lain', items: [
        { id: 'firstaid', name: 'Kit pertolongan cemas', priority: 'medium' },
        { id: 'medicine', name: 'Ubat biasa', priority: 'high' },
        { id: 'tarp', name: 'Kanvas', priority: 'low' },
        { id: 'gloves', name: 'Sarung tangan kerja', priority: 'low' },
      ]},
    ],
    tl: [
      { category: '🚰 Tubig at Pagkain', items: [
        { id: 'water', name: 'Inuming tubig (3L×3 araw/tao)', priority: 'high' },
        { id: 'food', name: 'Emergency food (3 araw)', priority: 'high' },
        { id: 'can', name: 'De lata/instant na pagkain', priority: 'medium' },
      ]},
      { category: '🚽 Kalinisan', items: [
        { id: 'toilet', name: 'Emergency toilet (Pinakamahalaga!)', priority: 'high' },
        { id: 'wipes', name: 'Wet wipes', priority: 'medium' },
        { id: 'sanitary', name: 'Sanitary napkin', priority: 'medium' },
        { id: 'mask', name: 'Face mask', priority: 'medium' },
      ]},
      { category: '🔦 Impormasyon at Ilaw', items: [
        { id: 'battery', name: 'Power bank (malaking kapasidad)', priority: 'high' },
        { id: 'flashlight', name: 'Flashlight', priority: 'high' },
        { id: 'radio', name: 'Portable radio', priority: 'medium' },
      ]},
      { category: '💰 Mahahalagang Gamit', items: [
        { id: 'cash', name: 'Cash (pati barya)', priority: 'high' },
        { id: 'id', name: 'Kopya ng ID', priority: 'medium' },
        { id: 'insurance', name: 'Kopya ng insurance card', priority: 'medium' },
      ]},
      { category: '🎒 Iba pa', items: [
        { id: 'firstaid', name: 'First aid kit', priority: 'medium' },
        { id: 'medicine', name: 'Regular na gamot', priority: 'high' },
        { id: 'tarp', name: 'Tarpaulin', priority: 'low' },
        { id: 'gloves', name: 'Work gloves', priority: 'low' },
      ]},
    ],
    ne: [
      { category: '🚰 पानी र खाना', items: [
        { id: 'water', name: 'पिउने पानी (३L×३ दिन/व्यक्ति)', priority: 'high' },
        { id: 'food', name: 'आपतकालीन खाना (३ दिन)', priority: 'high' },
        { id: 'can', name: 'डिब्बाबन्द/तयार खाना', priority: 'medium' },
      ]},
      { category: '🚽 सरसफाई', items: [
        { id: 'toilet', name: 'आपतकालीन शौचालय (सबैभन्दा महत्त्वपूर्ण!)', priority: 'high' },
        { id: 'wipes', name: 'भिजेको टिस्यु', priority: 'medium' },
        { id: 'sanitary', name: 'सेनिटरी प्याड', priority: 'medium' },
        { id: 'mask', name: 'मास्क', priority: 'medium' },
      ]},
      { category: '🔦 जानकारी र बत्ती', items: [
        { id: 'battery', name: 'पावर ब्यांक (ठूलो क्षमता)', priority: 'high' },
        { id: 'flashlight', name: 'टर्च', priority: 'high' },
        { id: 'radio', name: 'पोर्टेबल रेडियो', priority: 'medium' },
      ]},
      { category: '💰 बहुमूल्य सामान', items: [
        { id: 'cash', name: 'नगद (सिक्का पनि)', priority: 'high' },
        { id: 'id', name: 'परिचय पत्रको प्रतिलिपि', priority: 'medium' },
        { id: 'insurance', name: 'बीमा कार्डको प्रतिलिपि', priority: 'medium' },
      ]},
      { category: '🎒 अन्य', items: [
        { id: 'firstaid', name: 'प्राथमिक उपचार किट', priority: 'medium' },
        { id: 'medicine', name: 'नियमित औषधि', priority: 'high' },
        { id: 'tarp', name: 'टार्प', priority: 'low' },
        { id: 'gloves', name: 'काम गर्ने पन्जा', priority: 'low' },
      ]},
    ],
    fr: [
      { category: '🚰 Eau & Nourriture', items: [
        { id: 'water', name: "Eau potable (3L×3 jours/pers.)", priority: 'high' },
        { id: 'food', name: "Nourriture d'urgence (3 jours)", priority: 'high' },
        { id: 'can', name: 'Conserves/Plats préparés', priority: 'medium' },
      ]},
      { category: '🚽 Hygiène', items: [
        { id: 'toilet', name: "Toilettes d'urgence (Le plus important!)", priority: 'high' },
        { id: 'wipes', name: 'Lingettes', priority: 'medium' },
        { id: 'sanitary', name: 'Produits hygiéniques', priority: 'medium' },
        { id: 'mask', name: 'Masques', priority: 'medium' },
      ]},
      { category: '🔦 Info & Éclairage', items: [
        { id: 'battery', name: 'Batterie externe (grande capacité)', priority: 'high' },
        { id: 'flashlight', name: 'Lampe torche', priority: 'high' },
        { id: 'radio', name: 'Radio portable', priority: 'medium' },
      ]},
      { category: '💰 Objets de valeur', items: [
        { id: 'cash', name: 'Espèces (pièces incluses)', priority: 'high' },
        { id: 'id', name: "Copie de la pièce d'identité", priority: 'medium' },
        { id: 'insurance', name: "Copie de la carte d'assurance", priority: 'medium' },
      ]},
      { category: '🎒 Autres', items: [
        { id: 'firstaid', name: 'Trousse de secours', priority: 'medium' },
        { id: 'medicine', name: 'Médicaments habituels', priority: 'high' },
        { id: 'tarp', name: 'Bâche', priority: 'low' },
        { id: 'gloves', name: 'Gants de travail', priority: 'low' },
      ]},
    ],
    de: [
      { category: '🚰 Wasser & Nahrung', items: [
        { id: 'water', name: 'Trinkwasser (3L×3 Tage/Person)', priority: 'high' },
        { id: 'food', name: 'Notvorrat (3 Tage)', priority: 'high' },
        { id: 'can', name: 'Konserven/Fertiggerichte', priority: 'medium' },
      ]},
      { category: '🚽 Hygiene', items: [
        { id: 'toilet', name: 'Nottoilette (Am wichtigsten!)', priority: 'high' },
        { id: 'wipes', name: 'Feuchttücher', priority: 'medium' },
        { id: 'sanitary', name: 'Hygieneartikel', priority: 'medium' },
        { id: 'mask', name: 'Masken', priority: 'medium' },
      ]},
      { category: '🔦 Info & Beleuchtung', items: [
        { id: 'battery', name: 'Powerbank (große Kapazität)', priority: 'high' },
        { id: 'flashlight', name: 'Taschenlampe', priority: 'high' },
        { id: 'radio', name: 'Tragbares Radio', priority: 'medium' },
      ]},
      { category: '💰 Wertsachen', items: [
        { id: 'cash', name: 'Bargeld (inkl. Münzen)', priority: 'high' },
        { id: 'id', name: 'Ausweiskopie', priority: 'medium' },
        { id: 'insurance', name: 'Versicherungskartenkopie', priority: 'medium' },
      ]},
      { category: '🎒 Sonstiges', items: [
        { id: 'firstaid', name: 'Erste-Hilfe-Set', priority: 'medium' },
        { id: 'medicine', name: 'Regelmäßige Medikamente', priority: 'high' },
        { id: 'tarp', name: 'Plane', priority: 'low' },
        { id: 'gloves', name: 'Arbeitshandschuhe', priority: 'low' },
      ]},
    ],
    it: [
      { category: '🚰 Acqua e Cibo', items: [
        { id: 'water', name: 'Acqua potabile (3L×3 giorni/pers.)', priority: 'high' },
        { id: 'food', name: "Cibo d'emergenza (3 giorni)", priority: 'high' },
        { id: 'can', name: 'Cibo in scatola/pronto', priority: 'medium' },
      ]},
      { category: '🚽 Igiene', items: [
        { id: 'toilet', name: "Bagno d'emergenza (Il più importante!)", priority: 'high' },
        { id: 'wipes', name: 'Salviette umidificate', priority: 'medium' },
        { id: 'sanitary', name: 'Prodotti igienici', priority: 'medium' },
        { id: 'mask', name: 'Mascherine', priority: 'medium' },
      ]},
      { category: '🔦 Info e Illuminazione', items: [
        { id: 'battery', name: 'Power bank (grande capacità)', priority: 'high' },
        { id: 'flashlight', name: 'Torcia', priority: 'high' },
        { id: 'radio', name: 'Radio portatile', priority: 'medium' },
      ]},
      { category: '💰 Oggetti di valore', items: [
        { id: 'cash', name: 'Contanti (monete incluse)', priority: 'high' },
        { id: 'id', name: "Copia del documento d'identità", priority: 'medium' },
        { id: 'insurance', name: 'Copia tessera sanitaria', priority: 'medium' },
      ]},
      { category: '🎒 Altro', items: [
        { id: 'firstaid', name: 'Kit di pronto soccorso', priority: 'medium' },
        { id: 'medicine', name: 'Medicine abituali', priority: 'high' },
        { id: 'tarp', name: 'Telo impermeabile', priority: 'low' },
        { id: 'gloves', name: 'Guanti da lavoro', priority: 'low' },
      ]},
    ],
    es: [
      { category: '🚰 Agua y Comida', items: [
        { id: 'water', name: 'Agua potable (3L×3 días/pers.)', priority: 'high' },
        { id: 'food', name: 'Comida de emergencia (3 días)', priority: 'high' },
        { id: 'can', name: 'Conservas/Comida preparada', priority: 'medium' },
      ]},
      { category: '🚽 Higiene', items: [
        { id: 'toilet', name: 'Inodoro de emergencia (¡Lo más importante!)', priority: 'high' },
        { id: 'wipes', name: 'Toallitas húmedas', priority: 'medium' },
        { id: 'sanitary', name: 'Productos sanitarios', priority: 'medium' },
        { id: 'mask', name: 'Mascarillas', priority: 'medium' },
      ]},
      { category: '🔦 Info e Iluminación', items: [
        { id: 'battery', name: 'Batería externa (gran capacidad)', priority: 'high' },
        { id: 'flashlight', name: 'Linterna', priority: 'high' },
        { id: 'radio', name: 'Radio portátil', priority: 'medium' },
      ]},
      { category: '💰 Objetos de valor', items: [
        { id: 'cash', name: 'Efectivo (monedas incluidas)', priority: 'high' },
        { id: 'id', name: 'Copia del DNI', priority: 'medium' },
        { id: 'insurance', name: 'Copia de tarjeta de seguro', priority: 'medium' },
      ]},
      { category: '🎒 Otros', items: [
        { id: 'firstaid', name: 'Botiquín de primeros auxilios', priority: 'medium' },
        { id: 'medicine', name: 'Medicamentos habituales', priority: 'high' },
        { id: 'tarp', name: 'Lona', priority: 'low' },
        { id: 'gloves', name: 'Guantes de trabajo', priority: 'low' },
      ]},
    ],
    easy_ja: [
      { category: '🚰 みず・たべもの', items: [
        { id: 'water', name: 'のみもの（みず 3リットル×3にち）', priority: 'high' },
        { id: 'food', name: 'ひじょうしょく（3にちぶん）', priority: 'high' },
        { id: 'can', name: 'かんづめ・レトルト', priority: 'medium' },
      ]},
      { category: '🚽 えいせい', items: [
        { id: 'toilet', name: 'ひじょうトイレ（だいじ！）', priority: 'high' },
        { id: 'wipes', name: 'ウェットティッシュ', priority: 'medium' },
        { id: 'sanitary', name: 'せいりようひん', priority: 'medium' },
        { id: 'mask', name: 'マスク', priority: 'medium' },
      ]},
      { category: '🔦 あかり・じょうほう', items: [
        { id: 'battery', name: 'モバイルバッテリー', priority: 'high' },
        { id: 'flashlight', name: 'かいちゅうでんとう', priority: 'high' },
        { id: 'radio', name: 'ラジオ', priority: 'medium' },
      ]},
      { category: '💰 だいじなもの', items: [
        { id: 'cash', name: 'おかね（こぜに も）', priority: 'high' },
        { id: 'id', name: 'みぶんしょうめいしょの コピー', priority: 'medium' },
      ]},
      { category: '🎒 そのた', items: [
        { id: 'firstaid', name: 'きゅうきゅうセット', priority: 'medium' },
        { id: 'medicine', name: 'くすり', priority: 'high' },
        { id: 'gloves', name: 'てぶくろ', priority: 'low' },
      ]},
    ],
  };

  const items = checklistItems[language as keyof typeof checklistItems] || checklistItems.en;

  const toggleItem = (id: string) => {
    setCheckedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // 優先度バッジ
  const PriorityBadge = ({ priority }: { priority: 'high' | 'medium' | 'low' }) => {
    const styles = {
      high: 'bg-red-100 text-red-700 border-red-200',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      low: 'bg-gray-100 text-gray-600 border-gray-200',
    };
    const labels = { high: '!!!', medium: '!!', low: '!' };

    return (
      <span className={`text-xs px-1.5 py-0.5 rounded border ${styles[priority]}`}>
        {labels[priority]}
      </span>
    );
  };

  // 進捗計算
  const totalItems = items.flatMap((s) => s.items).length;
  const checkedCount = checkedItems.size;
  const progress = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* 進捗バー */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium text-gray-700">
            {language === 'ja' ? '準備状況' : language === 'easy_ja' ? 'じゅんび' : 'Progress'}
          </span>
          <span className="text-sm text-gray-600">
            {checkedCount} / {totalItems}
          </span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        {progress === 100 && (
          <p className="text-center text-green-600 font-medium mt-2">
            ✅ {language === 'ja' ? '準備完了！' : language === 'easy_ja' ? 'じゅんび かんりょう！' : 'All ready!'}
          </p>
        )}
      </div>

      {/* チェックリスト */}
      {items.map((section, idx) => (
        <div key={idx} className="bg-white rounded-lg shadow p-4">
          <h3 className="font-bold text-lg mb-3">{section.category}</h3>
          <ul className="space-y-2">
            {section.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id={item.id}
                  checked={checkedItems.has(item.id)}
                  onChange={() => toggleItem(item.id)}
                  className="w-5 h-5 rounded accent-green-600"
                />
                <label
                  htmlFor={item.id}
                  className={`flex-1 cursor-pointer ${
                    checkedItems.has(item.id) ? 'line-through text-gray-400' : 'text-gray-800'
                  }`}
                >
                  {item.name}
                </label>
                <PriorityBadge priority={item.priority} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
