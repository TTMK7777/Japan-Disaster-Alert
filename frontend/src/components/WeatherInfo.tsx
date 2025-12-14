'use client';

import { useState, useEffect } from 'react';

interface WeatherData {
  area: string;
  publishing_office: string;
  report_datetime: string;
  headline?: string;
  text: string;
}

interface WeatherInfoProps {
  language: string;
}

// 都道府県コード一覧
const prefectures = [
  { code: '130000', name: '東京都', nameEn: 'Tokyo' },
  { code: '270000', name: '大阪府', nameEn: 'Osaka' },
  { code: '140000', name: '神奈川県', nameEn: 'Kanagawa' },
  { code: '230000', name: '愛知県', nameEn: 'Aichi' },
  { code: '400000', name: '福岡県', nameEn: 'Fukuoka' },
  { code: '010000', name: '北海道', nameEn: 'Hokkaido' },
  { code: '040000', name: '宮城県', nameEn: 'Miyagi' },
  { code: '340000', name: '広島県', nameEn: 'Hiroshima' },
  { code: '471000', name: '沖縄県', nameEn: 'Okinawa' },
];

export default function WeatherInfo({ language }: WeatherInfoProps) {
  const [selectedArea, setSelectedArea] = useState('130000');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWeather() {
      try {
        setLoading(true);
        const response = await fetch(
          `https://www.jma.go.jp/bosai/forecast/data/overview_forecast/${selectedArea}.json`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch weather data');
        }

        const data = await response.json();
        setWeather({
          area: data.targetArea || '',
          publishing_office: data.publishingOffice || '気象庁',
          report_datetime: data.reportDatetime || '',
          headline: data.headlineText,
          text: data.text || '',
        });
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
  }, [selectedArea]);

  return (
    <div className="space-y-4">
      {/* 地域選択 */}
      <div className="bg-white rounded-lg shadow p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {language === 'ja' ? '地域を選択' : 'Select Area'}
        </label>
        <select
          value={selectedArea}
          onChange={(e) => setSelectedArea(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-disaster-blue"
        >
          {prefectures.map((pref) => (
            <option key={pref.code} value={pref.code}>
              {language === 'ja' ? pref.name : pref.nameEn}
            </option>
          ))}
        </select>
      </div>

      {/* 天気情報表示 */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-disaster-blue"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {language === 'ja' ? 'データの取得に失敗しました' : 'Failed to load data'}
        </div>
      ) : weather ? (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-disaster-blue">{weather.area}</h2>
            <span className="text-sm text-gray-500">
              {new Date(weather.report_datetime).toLocaleString(
                language === 'ja' ? 'ja-JP' : 'en-US'
              )}
            </span>
          </div>

          {weather.headline && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
              <p className="text-yellow-800 font-medium">{weather.headline}</p>
            </div>
          )}

          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {weather.text}
            </p>
          </div>

          <div className="mt-4 pt-4 border-t text-sm text-gray-500">
            {language === 'ja' ? '発表' : 'Published by'}: {weather.publishing_office}
          </div>
        </div>
      ) : null}
    </div>
  );
}
