'use client';

import { useState, useEffect } from 'react';
import type { Earthquake } from '@/types/earthquake';
import { API_BASE_URL } from '@/config/api';

interface EarthquakeListProps {
  language: string;
}

// 震度に応じた色クラスを返す
function getIntensityClass(intensity: string): string {
  const intensityMap: Record<string, string> = {
    '1': 'intensity-1',
    '2': 'intensity-2',
    '3': 'intensity-3',
    '4': 'intensity-4',
    '5弱': 'intensity-5-lower',
    '5強': 'intensity-5-upper',
    '6弱': 'intensity-6-lower',
    '6強': 'intensity-6-upper',
    '7': 'intensity-7',
  };
  return intensityMap[intensity] || 'bg-gray-200';
}

export default function EarthquakeList({ language }: EarthquakeListProps) {
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEarthquakes() {
      try {
        setLoading(true);
        // バックエンドAPI経由で取得（多言語翻訳付き）
        const response = await fetch(
          `${API_BASE_URL}/api/v1/earthquakes?limit=10&lang=${language}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch earthquake data');
        }

        const data: Earthquake[] = await response.json();
        setEarthquakes(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchEarthquakes();

    // 30秒ごとに更新
    const interval = setInterval(fetchEarthquakes, 30000);
    return () => clearInterval(interval);
  }, [language]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-disaster-blue"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {language === 'ja' ? 'データの取得に失敗しました' : 'Failed to load data'}: {error}
      </div>
    );
  }

  if (earthquakes.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
        {language === 'ja' ? '地震情報はありません' : 'No earthquake data'}
      </div>
    );
  }

  // 表示用のテキストを取得（翻訳があれば翻訳版を表示）
  const getDisplayLocation = (eq: Earthquake) => eq.location_translated || eq.location;
  const getDisplayMessage = (eq: Earthquake) => eq.message_translated || eq.message;
  const getDisplayTsunami = (eq: Earthquake) => eq.tsunami_warning_translated || eq.tsunami_warning;

  // 津波警報の判定（日本語での判定を使用）
  const hasTsunamiRisk = (eq: Earthquake) => eq.tsunami_warning !== 'なし' && eq.tsunami_warning !== 'None';

  return (
    <div className="space-y-4">
      {earthquakes.map((eq) => (
        <div key={eq.id} className="bg-white rounded-lg shadow overflow-hidden">
          {/* ヘッダー（震度表示） */}
          <div className={`${getIntensityClass(eq.max_intensity)} px-4 py-2 flex justify-between items-center`}>
            <span className="font-bold text-lg">
              {language === 'ja' ? '震度' : 'Int.'} {eq.max_intensity}
            </span>
            <span className="text-sm opacity-80">
              M{eq.magnitude}
            </span>
          </div>

          {/* 詳細情報 */}
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg">{getDisplayLocation(eq)}</h3>
              <span className="text-sm text-gray-500">{eq.time}</span>
            </div>

            <p className="text-gray-600 text-sm mb-3">{getDisplayMessage(eq)}</p>

            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="bg-gray-50 rounded p-2">
                <div className="text-gray-500">{language === 'ja' ? '深さ' : 'Depth'}</div>
                <div className="font-medium">{eq.depth}km</div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-gray-500">{language === 'ja' ? '規模' : 'Mag.'}</div>
                <div className="font-medium">M{eq.magnitude}</div>
              </div>
              <div className={`rounded p-2 ${hasTsunamiRisk(eq) ? 'bg-red-50' : 'bg-green-50'}`}>
                <div className="text-gray-500">{language === 'ja' ? '津波' : 'Tsunami'}</div>
                <div className={`font-medium ${hasTsunamiRisk(eq) ? 'text-red-600' : 'text-green-600'}`}>
                  {getDisplayTsunami(eq)}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
