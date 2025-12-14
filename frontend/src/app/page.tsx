'use client';

import { useState, useEffect } from 'react';
import LanguageSelector from '@/components/LanguageSelector';
import EarthquakeList from '@/components/EarthquakeList';
import WeatherInfo from '@/components/WeatherInfo';
import AlertBanner from '@/components/AlertBanner';

// 多言語テキスト
const translations: Record<string, Record<string, string>> = {
  ja: {
    title: '災害対応AI',
    subtitle: '多言語災害情報システム',
    earthquake: '地震情報',
    weather: '天気情報',
    shelter: '避難所',
    checklist: '防災チェックリスト',
    settings: '設定',
    loading: '読み込み中...',
    noData: 'データがありません',
    lastUpdate: '最終更新',
  },
  en: {
    title: 'Disaster AI',
    subtitle: 'Multilingual Disaster Info',
    earthquake: 'Earthquakes',
    weather: 'Weather',
    shelter: 'Shelters',
    checklist: 'Checklist',
    settings: 'Settings',
    loading: 'Loading...',
    noData: 'No data available',
    lastUpdate: 'Last update',
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
  },
};

type TabType = 'earthquake' | 'weather' | 'shelter' | 'checklist';

export default function Home() {
  const [language, setLanguage] = useState('ja');
  const [activeTab, setActiveTab] = useState<TabType>('earthquake');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const t = translations[language] || translations.ja;

  useEffect(() => {
    // 30秒ごとにデータを更新
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen">
      {/* 緊急警報バナー */}
      <AlertBanner language={language} />

      {/* ヘッダー */}
      <header className="bg-disaster-blue text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{t.title}</h1>
            <p className="text-sm opacity-80">{t.subtitle}</p>
          </div>
          <LanguageSelector
            currentLanguage={language}
            onLanguageChange={setLanguage}
          />
        </div>
      </header>

      {/* タブナビゲーション */}
      <nav className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex">
          {(['earthquake', 'weather', 'shelter', 'checklist'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                activeTab === tab
                  ? 'text-disaster-blue border-b-2 border-disaster-blue bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {t[tab]}
            </button>
          ))}
        </div>
      </nav>

      {/* メインコンテンツ */}
      <div className="max-w-4xl mx-auto p-4">
        {/* 最終更新時刻 */}
        <div className="text-right text-sm text-gray-500 mb-4">
          {t.lastUpdate}: {lastUpdate.toLocaleTimeString(language === 'ja' ? 'ja-JP' : 'en-US')}
        </div>

        {/* タブコンテンツ */}
        {activeTab === 'earthquake' && (
          <EarthquakeList language={language} />
        )}

        {activeTab === 'weather' && (
          <WeatherInfo language={language} />
        )}

        {activeTab === 'shelter' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">{t.shelter}</h2>
            <p className="text-gray-600">
              {language === 'ja' ? '避難所検索機能は開発中です。' : 'Shelter search feature is under development.'}
            </p>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                {language === 'ja'
                  ? '位置情報を許可すると、最寄りの避難所を表示できます。'
                  : 'Allow location access to show nearby shelters.'}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'checklist' && (
          <ChecklistSection language={language} />
        )}
      </div>

      {/* フッター */}
      <footer className="bg-gray-100 border-t mt-8 py-4">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-600">
          <p>
            {language === 'ja'
              ? '情報元: 気象庁、P2P地震情報'
              : 'Data sources: Japan Meteorological Agency, P2P Earthquake'}
          </p>
          <p className="mt-1">
            {language === 'ja'
              ? '※この情報は参考情報です。正確な情報は公式発表をご確認ください。'
              : '* This is reference information. Please check official announcements for accuracy.'}
          </p>
        </div>
      </footer>
    </main>
  );
}

// 防災チェックリストコンポーネント
function ChecklistSection({ language }: { language: string }) {
  const checklistItems = {
    ja: [
      { category: '水・食料', items: ['飲料水（1人3L×3日分）', '非常食（3日分）', '缶詰・レトルト食品'] },
      { category: '衛生用品', items: ['非常用トイレ', 'ウェットティッシュ', '生理用品', 'マスク'] },
      { category: '情報・照明', items: ['モバイルバッテリー', '懐中電灯', '携帯ラジオ'] },
      { category: '貴重品', items: ['現金（小銭も）', '身分証明書のコピー', '保険証のコピー'] },
      { category: 'その他', items: ['救急セット', '常備薬', 'ブルーシート', '軍手'] },
    ],
    en: [
      { category: 'Water & Food', items: ['Drinking water (3L×3 days/person)', 'Emergency food (3 days)', 'Canned/retort food'] },
      { category: 'Hygiene', items: ['Emergency toilet', 'Wet wipes', 'Sanitary products', 'Masks'] },
      { category: 'Info & Light', items: ['Mobile battery', 'Flashlight', 'Portable radio'] },
      { category: 'Valuables', items: ['Cash (coins too)', 'ID copy', 'Insurance card copy'] },
      { category: 'Others', items: ['First aid kit', 'Regular medicine', 'Blue tarp', 'Work gloves'] },
    ],
  };

  const items = checklistItems[language as keyof typeof checklistItems] || checklistItems.en;

  return (
    <div className="space-y-4">
      {items.map((section, idx) => (
        <div key={idx} className="bg-white rounded-lg shadow p-4">
          <h3 className="font-bold text-lg mb-3 text-disaster-blue">{section.category}</h3>
          <ul className="space-y-2">
            {section.items.map((item, itemIdx) => (
              <li key={itemIdx} className="flex items-center gap-3">
                <input type="checkbox" className="w-5 h-5 rounded" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
