# 災害対応AIエージェントシステム - 引継ぎ資料

**作成日**: 2025年12月14日
**バージョン**: MVP 1.0
**作成者**: AI開発チーム（Claude Code + Perplexity + Gemini）

---

## 1. プロジェクト概要

### 1.1 目的
日本の災害対応時に、発災状況・被害状況・多言語避難情報・日常防災情報を一元的に自治体・法人・個人に提供するAIエージェントシステム。

### 1.2 ターゲットユーザー
- **在留外国人**: 約340万人（特にベトナム人52万人、中国人79万人、ネパール人17万人）
- **訪日観光客**: 年間3,000万人超
- **技能実習生**: 40万人超（やさしい日本語対応）
- **自治体**: 外国人集住都市（100〜200自治体）

### 1.3 市場機会
- **防災DX市場**: 2025年度 約2,416億円（成長中）
- **防災庁設置**: 2026年11月1日発足予定
- **市場空白**: 個人向け × 多言語対応 × 一元化サービスは競合不在

---

## 2. 現在の実装状況

### 2.1 完成した機能

| 機能 | 状態 | 実装詳細 |
|------|------|----------|
| 地震情報取得 | ✅ 完成 | P2P地震情報APIからリアルタイム取得、30秒自動更新 |
| 天気情報取得 | ✅ 完成 | 気象庁APIから都道府県別に取得 |
| 多言語UI | ✅ 完成 | 7言語対応（日/英/中/韓/越/ネパール/やさしい日本語） |
| 震度別カラー表示 | ✅ 完成 | 気象庁準拠の震度カラーリング |
| 防災チェックリスト | ✅ 完成 | 被災者の声を基にした実用的リスト（日英対応） |
| レスポンシブUI | ✅ 完成 | モバイル・デスクトップ両対応 |

### 2.2 未完成・課題のある機能

| 機能 | 状態 | 課題 |
|------|------|------|
| **地震情報の多言語翻訳** | ⚠️ 未実装 | 場所名（和歌山県北部等）が日本語のまま |
| 避難所検索 | 🔧 基盤のみ | データソース未連携 |
| プッシュ通知 | ❌ 未実装 | FCM/APNs連携が必要 |
| LINE連携 | ❌ 未実装 | LINE Messaging API連携が必要 |
| SNS情報収集 | ❌ 未実装 | X API有料化（$100〜/月） |
| デマ検出AI | ❌ 未実装 | 自然言語処理モデル必要 |

### 2.3 技術スタック

```
バックエンド:
├── Python 3.12
├── FastAPI
├── httpx（非同期HTTP）
└── Pydantic（データ検証）

フロントエンド:
├── Next.js 14.2
├── React 18.3
├── TypeScript
├── Tailwind CSS
└── Leaflet/react-leaflet（マップ用、未使用）

データソース:
├── 気象庁 JSON API（無料）
├── P2P地震情報 API（無料）
└── Claude API（翻訳用、未連携）
```

---

## 3. ファイル構成

```
災害対応AI/
├── PROJECT_PLAN.md          # 詳細プロジェクト計画書（競合分析・収益モデル含む）
├── README.md                # 開発者向けセットアップガイド
├── docs/
│   └── HANDOVER.md          # 本引継ぎ資料
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI エンドポイント定義
│   │   ├── models.py        # Pydantic データモデル
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── jma_service.py    # 気象庁API連携
│   │       ├── p2p_service.py    # P2P地震情報連携
│   │       └── translator.py     # 多言語翻訳（テンプレートベース）
│   ├── requirements.txt
│   ├── run.py               # 開発サーバー起動
│   └── venv/                # Python仮想環境
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css      # グローバルCSS（震度カラー等）
│   │   │   ├── layout.tsx       # ルートレイアウト
│   │   │   └── page.tsx         # メインページ
│   │   └── components/
│   │       ├── AlertBanner.tsx      # 緊急警報バナー
│   │       ├── EarthquakeList.tsx   # 地震情報リスト
│   │       ├── LanguageSelector.tsx # 言語切り替え
│   │       └── WeatherInfo.tsx      # 天気情報
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── tsconfig.json
├── scripts/
│   └── start_dev.sh         # 開発環境一括起動
└── data/                    # データ格納用（未使用）
```

---

## 4. 重要な実装詳細

### 4.1 地震情報取得（frontend/src/components/EarthquakeList.tsx）

```typescript
// P2P地震情報APIから直接取得
const response = await fetch(
  `https://api.p2pquake.net/v2/history?codes=551&limit=10`
);

// 震度マッピング
const intensityMap: Record<number, string> = {
  10: '1', 20: '2', 30: '3', 40: '4',
  45: '5弱', 50: '5強', 55: '6弱', 60: '6強', 70: '7'
};
```

**課題**: `hypocenter.name`（震源地名）が日本語のまま返却される。

### 4.2 多言語翻訳（backend/app/services/translator.py）

現在はテンプレートベースの翻訳のみ実装：

```python
TEMPLATES = {
    "earthquake": {
        "ja": "【地震情報】{location}で地震がありました...",
        "en": "[Earthquake] An earthquake occurred in {location}...",
        # 他言語...
    },
    "tsunami_warning": { ... },
    "evacuation": { ... },
}
```

**課題**: 動的な地名（「和歌山県北部」等）の翻訳が未実装。

### 4.3 天気情報取得（frontend/src/components/WeatherInfo.tsx）

```typescript
// 気象庁APIから直接取得
const response = await fetch(
  `https://www.jma.go.jp/bosai/forecast/data/overview_forecast/${selectedArea}.json`
);
```

---

## 5. 今後の実装方針

### 5.1 優先度: 高（Phase 2: 1〜2週間）

#### 5.1.1 地震情報の多言語翻訳

**課題**: 震源地名（和歌山県北部、福島県沖等）が日本語のまま

**実装方針**:

1. **静的マッピング方式**（推奨・低コスト）
   ```python
   # backend/app/services/translator.py に追加
   LOCATION_TRANSLATIONS = {
       "和歌山県北部": {
           "en": "Northern Wakayama Prefecture",
           "zh": "和歌山县北部",
           "ko": "와카야마현 북부",
           "vi": "Bắc tỉnh Wakayama",
           "ne": "वाकायामा प्रान्तको उत्तरी भाग",
       },
       "福島県沖": {
           "en": "Off the Coast of Fukushima Prefecture",
           # ...
       },
       # 気象庁の震源地リスト（約100箇所）を網羅
   }
   ```

   **メリット**: 無料、高速、確実
   **デメリット**: 初期作成の手間、新しい地名への対応

2. **Claude API連携方式**（高品質・有料）
   ```python
   # Claude APIで動的翻訳
   async def translate_with_claude(text: str, target_lang: str) -> str:
       response = await anthropic.messages.create(
           model="claude-3-haiku-20240307",
           messages=[{
               "role": "user",
               "content": f"Translate to {target_lang}: {text}"
           }]
       )
       return response.content[0].text
   ```

   **コスト**: Claude Haiku = $0.00025/1K入力 + $0.00125/1K出力
   **メリット**: 高品質、新地名にも対応
   **デメリット**: API費用、レイテンシ

3. **ハイブリッド方式**（推奨）
   - 既知の地名 → 静的マッピング
   - 未知の地名 → Claude API（結果をキャッシュ）

#### 5.1.2 バックエンドAPI経由の多言語化

現在フロントエンドから直接外部APIを叩いているが、バックエンド経由に変更：

```
現在: Frontend → P2P API
変更: Frontend → Backend API → P2P API + 翻訳
```

**修正箇所**:
- `frontend/src/components/EarthquakeList.tsx`: APIエンドポイントを `/api/v1/earthquakes?lang=en` に変更
- `backend/app/main.py`: 翻訳処理を追加

### 5.2 優先度: 中（Phase 3: 2〜4週間）

#### 5.2.1 避難所マップ機能

**データソース候補**:
1. [国土地理院 指定緊急避難場所データ](https://www.gsi.go.jp/bousaichiri/hinanbasho.html)
2. 各自治体のオープンデータ
3. [G空間情報センター](https://www.geospatial.jp/)

**実装方針**:
```typescript
// frontend/src/components/ShelterMap.tsx
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

// 現在地から最寄りの避難所を表示
// Haversine公式で距離計算
```

#### 5.2.2 プッシュ通知

**技術選定**:
- **Web Push**: Service Worker + FCM（Firebase Cloud Messaging）
- **LINE**: LINE Messaging API（無料枠: 月200通）

### 5.3 優先度: 低（Phase 4: 1〜3ヶ月）

#### 5.3.1 SNS情報収集

**課題**: X API有料化（Basic: $100/月、Pro: $5,000/月）

**代替案**:
1. Bluesky API（無料）
2. Mastodon API（無料）
3. 公式情報のみに絞る（気象庁、自治体）

#### 5.3.2 デマ検出AI

**実装方針**:
1. 公式情報との照合
2. 投稿の信頼度スコアリング
3. Claude APIによるファクトチェック

---

## 6. API仕様

### 6.1 現在のエンドポイント

| エンドポイント | メソッド | パラメータ | 説明 |
|--------------|--------|-----------|------|
| `/` | GET | - | ヘルスチェック |
| `/api/v1/earthquakes` | GET | `limit`, `lang` | 地震情報取得 |
| `/api/v1/weather/{area_code}` | GET | `lang` | 天気情報取得 |
| `/api/v1/alerts` | GET | `lang` | 警報・注意報取得 |
| `/api/v1/translate` | POST | `text`, `target_lang` | テキスト翻訳 |
| `/api/v1/shelters` | GET | `lat`, `lon`, `radius` | 避難所検索 |
| `/api/v1/languages` | GET | - | 対応言語一覧 |

### 6.2 地域コード（気象庁）

```python
# 主要都市
"130000": "東京都"
"270000": "大阪府"
"140000": "神奈川県"
"230000": "愛知県"
"400000": "福岡県"
# 全47都道府県対応（backend/app/services/jma_service.py参照）
```

---

## 7. 起動方法

### 7.1 開発環境

```bash
# プロジェクトディレクトリ
cd /home/ttsuj/Desktop/03_Business-Apps/災害対応AI

# バックエンド起動（ターミナル1）
cd backend
source venv/bin/activate
python run.py
# → http://localhost:8000

# フロントエンド起動（ターミナル2）
cd frontend
npm run dev
# → http://localhost:3001
```

### 7.2 一括起動

```bash
./scripts/start_dev.sh
```

---

## 8. 外部サービス・API

### 8.1 現在使用中（無料）

| サービス | 用途 | 制限 |
|---------|------|------|
| 気象庁 JSON API | 天気・地震情報 | なし（公共データ） |
| P2P地震情報 API | 地震速報 | なし |

### 8.2 今後連携予定（有料）

| サービス | 用途 | 費用 |
|---------|------|------|
| Claude API (Haiku) | 多言語翻訳 | $0.00025/1K入力 |
| DMDATA.JP | 緊急地震速報 WebSocket | 月額制 |
| Firebase (FCM) | プッシュ通知 | 無料枠あり |
| LINE Messaging API | LINE通知 | 月200通無料 |

---

## 9. 既知の問題・注意点

### 9.1 技術的な問題

1. **CORS**: フロントエンドから直接外部APIを叩いているため、一部ブラウザでCORSエラーの可能性
   - **対策**: バックエンド経由に変更

2. **レート制限**: 気象庁APIは明示的な制限なしだが、過度なアクセスは避ける
   - **対策**: キャッシュ実装（Redis等）

3. **react-leaflet**: React 18必須（React 19非対応）

### 9.2 法的・運用上の注意

1. **免責事項**: 災害情報の誤配信リスクへの法的対応が必要
2. **個人情報**: 位置情報取得時の同意取得
3. **24時間運用**: 災害時の可用性確保

---

## 10. 参考リンク

### ドキュメント
- [気象庁 気象データ高度利用ポータル](https://www.data.jma.go.jp/developer/index.html)
- [P2P地震情報 API仕様](https://www.p2pquake.net/develop/)
- [Next.js ドキュメント](https://nextjs.org/docs)
- [FastAPI ドキュメント](https://fastapi.tiangolo.com/)

### 競合サービス
- [Safety tips](https://www.rcsc.co.jp/safety-tips-jp) - 観光庁監修、15言語対応
- [特務機関NERV防災](https://nerv.app/) - 速報性No.1
- [Spectee Pro](https://spectee.co.jp/) - SNS×AI分析

### 政策
- [防災庁設置準備（内閣官房）](https://www.cas.go.jp/jp/seisaku/bousaichou_preparation/index.html)
- [観光庁 インバウンド安全・安心対策](https://www.mlit.go.jp/kankocho/)

---

## 11. 連絡先・質問

プロジェクトに関する質問は以下のファイルを参照：
- 詳細計画: `PROJECT_PLAN.md`
- セットアップ: `README.md`
- API仕様: `http://localhost:8000/docs`（Swagger UI）

---

**以上、引継ぎ資料終わり**

次のステップとして、**地震情報の多言語翻訳（静的マッピング）** から着手することを推奨します。
