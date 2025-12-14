'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

interface EarthquakeMapProps {
  earthquakes: Earthquake[];
  language: string;
}

// 震度に応じた色を返す
function getIntensityColor(intensity: string): string {
  const colorMap: Record<string, string> = {
    '1': '#f0f0f0',
    '2': '#00aaff',
    '3': '#0041ff',
    '4': '#fae696',
    '5弱': '#ffe600',
    '5強': '#ff9900',
    '6弱': '#ff2800',
    '6強': '#a50021',
    '7': '#b40068',
  };
  return colorMap[intensity] || '#888888';
}

// カスタムマーカーアイコンを作成
function createIntensityIcon(intensity: string): L.DivIcon {
  const color = getIntensityColor(intensity);
  const size = intensity === '7' || intensity.includes('6') ? 24 :
               intensity.includes('5') || intensity === '4' ? 20 : 16;

  return L.divIcon({
    className: 'earthquake-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: 2px solid #333;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

export default function EarthquakeMap({ earthquakes, language }: EarthquakeMapProps) {
  // 日本の中心座標（デフォルト）
  const defaultCenter: [number, number] = [36.5, 138.0];
  const defaultZoom = 5;

  // 有効な座標を持つ地震のみフィルタリング
  const validEarthquakes = earthquakes.filter(
    (eq) => eq.latitude && eq.longitude && !isNaN(eq.latitude) && !isNaN(eq.longitude)
  );

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        className="leaflet-container"
        scrollWheelZoom={true}
      >
        {/* 国土地理院タイル（無料） */}
        <TileLayer
          attribution='&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>'
          url="https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png"
        />

        {validEarthquakes.map((earthquake) => (
          <Marker
            key={earthquake.id}
            position={[earthquake.latitude, earthquake.longitude]}
            icon={createIntensityIcon(earthquake.max_intensity)}
          >
            <Popup>
              <div className="text-sm">
                <h3 className="font-bold text-disaster-blue mb-2">
                  {language === 'ja' ? earthquake.location : (earthquake.location_translated || earthquake.location)}
                </h3>
                <div className="space-y-1">
                  <p>
                    <span className="font-medium">
                      {language === 'ja' ? '震度' : 'Intensity'}:
                    </span>{' '}
                    <span
                      className="px-2 py-0.5 rounded text-white"
                      style={{ backgroundColor: getIntensityColor(earthquake.max_intensity) }}
                    >
                      {language === 'ja' ? earthquake.max_intensity : (earthquake.max_intensity_translated || earthquake.max_intensity)}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium">
                      {language === 'ja' ? 'マグニチュード' : 'Magnitude'}:
                    </span>{' '}
                    M{earthquake.magnitude}
                  </p>
                  <p>
                    <span className="font-medium">
                      {language === 'ja' ? '深さ' : 'Depth'}:
                    </span>{' '}
                    {earthquake.depth}km
                  </p>
                  <p>
                    <span className="font-medium">
                      {language === 'ja' ? '発生時刻' : 'Time'}:
                    </span>{' '}
                    {new Date(earthquake.time).toLocaleString(language === 'ja' ? 'ja-JP' : 'en-US')}
                  </p>
                  {earthquake.tsunami_warning && earthquake.tsunami_warning !== 'なし' && (
                    <p className="text-red-600 font-bold mt-2">
                      {language === 'ja' ? '津波警報' : 'Tsunami Warning'}:{' '}
                      {language === 'ja' ? earthquake.tsunami_warning : (earthquake.tsunami_warning_translated || earthquake.tsunami_warning)}
                    </p>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* 凡例 */}
      <div className="p-3 border-t bg-gray-50">
        <p className="text-xs text-gray-600 mb-2 font-medium">
          {language === 'ja' ? '震度凡例' : 'Intensity Legend'}
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          {['1', '2', '3', '4', '5弱', '5強', '6弱', '6強', '7'].map((intensity) => (
            <div key={intensity} className="flex items-center gap-1">
              <span
                className="w-3 h-3 rounded-full border border-gray-400"
                style={{ backgroundColor: getIntensityColor(intensity) }}
              />
              <span>{intensity}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
