# 災害対応AIエージェントシステム - 引継ぎ資料

**作成日**: 2025年12月14日
**更新日**: 2025年12月14日
**バージョン**: MVP 1.1（16言語対応版）
**作成者**: AI開発チーム（Claude Code + Perplexity + Gemini）
**リポジトリ**: https://github.com/TTMK7777/Japan-Disaster-Alert

---

## 1. プロジェクト概要

### 1.1 目的
日本の災害対応時に、発災状況・被害状況・多言語避難情報・日常防災情報を一元的に自治体・法人・個人に提供するAIエージェントシステム。

### 1.2 ターゲットユーザー
- **訪日観光客**: 年間3,000万人超（TOP10カ国をカバー）
- **在留外国人**: 約340万人（特にベトナム人52万人、中国人79万人、ネパール人17万人）
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
| **16言語対応** | ✅ 完成 | 訪日客TOP10カ国をカバー |
| **ハイブリッド翻訳** | ✅ 完成 | 静的マッピング → Claude API → キャッシュの3層方式 |
| **震源地名翻訳** | ✅ 完成 | 75地名 × 15言語の静的マッピング |
| 震度別カラー表示 | ✅ 完成 | 気象庁準拠の震度カラーリング |
| レスポンシブUI | ✅ 完成 | モバイル・デスクトップ両対応 |

### 2.2 対応言語（16言語）

| コード | 言語 | 対象国・地域 | 訪日客数(2024) |
|-------|------|------------|--------------|
| ja | 日本語 | 日本 | - |
| ko | 한국어 | 韓国 | 881万人（1位） |
| zh | 简体中文 | 中国 | 698万人（2位） |
| zh-TW | 繁體中文 | 台湾・香港 | 872万人（3位+5位） |
| en | English | 米国・豪州・欧米 | 272万人（4位） |
| th | ภาษาไทย | タイ | 10位 |
| ms | Bahasa Melayu | マレーシア | 11位 |
| id | Bahasa Indonesia | インドネシア | 15位 |
| tl | Filipino | フィリピン | 技能実習生多数 |
| vi | Tiếng Việt | ベトナム | 在留52万人 |
| fr | Français | フランス | 16位 |
| de | Deutsch | ドイツ | 14位 |
| it | Italiano | イタリア | 17位 |
| es | Español | スペイン | 18位 |
| ne | नेपाली | ネパール | 在留17万人 |
| easy_ja | やさしい日本語 | 日本語学習者 | - |

### 2.3 未完成・次フェーズの機能

| 機能 | 状態 | 課題 |
|------|------|------|
| 避難所検索 | 🔧 基盤のみ | データソース未連携 |
| プッシュ通知 | ❌ 未実装 | FCM/APNs連携が必要 |
| LINE連携 | ❌ 未実装 | LINE Messaging API連携が必要 |
| SNS情報収集 | ❌ 未実装 | X API有料化（$100〜/月） |
| デマ検出AI | ❌ 未実装 | 自然言語処理モデル必要 |

### 2.4 技術スタック

```
バックエンド:
├── Python 3.12
├── FastAPI
├── httpx（非同期HTTP）
├── Pydantic（データ検証）
└── Claude API（未登録地名の翻訳用・オプション）

フロントエンド:
├── Next.js 14.2
├── React 18.3
├── TypeScript
├── Tailwind CSS
└── Leaflet/react-leaflet（マップ用、未使用）

データソース:
├── 気象庁 JSON API（無料）
└── P2P地震情報 API（無料）
```

---

## 3. ファイル構成

```
災害対応AI/
├── .gitignore               # Git除外設定
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
│   │       ├── jma_service.py           # 気象庁API連携
│   │       ├── p2p_service.py           # P2P地震情報連携
│   │       ├── translator.py            # 多言語翻訳サービス
│   │       └── location_translations.py # 震源地名静的翻訳（75地名×15言語）
│   ├── requirements.txt
│   ├── run.py               # 開発サーバー起動
│   └── venv/                # Python仮想環境（Git除外）
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
│   ├── tsconfig.json
│   └── node_modules/        # npmパッケージ（Git除外）
├── scripts/
│   └── start_dev.sh         # 開発環境一括起動
└── data/
    └── translation_cache.json  # 翻訳キャッシュ（Git除外）
```

---

## 4. 重要な実装詳細

### 4.1 ハイブリッド翻訳システム

```
翻訳リクエスト
    ↓
[1. 静的マッピング]  → 75地名 × 15言語を即座に返却（無料・高速）
    ↓ (未登録の場合)
[2. キャッシュ確認]  → 過去の翻訳結果を返却
    ↓ (未キャッシュの場合)
[3. Claude API]      → 動的翻訳 → 結果をキャッシュ保存
    ↓ (APIキー未設定の場合)
[4. フォールバック] → 元の日本語テキストを返却
```

**関連ファイル**:
- `backend/app/services/location_translations.py` - 静的マッピング
- `backend/app/services/translator.py` - 翻訳サービス本体
- `backend/app/main.py` - APIエンドポイント

### 4.2 地震情報取得フロー

```
Frontend (EarthquakeList.tsx)
    ↓ GET /api/v1/earthquakes?limit=10&lang=en
Backend (main.py)
    ↓
P2P地震情報 API (https://api.p2pquake.net/v2/history)
    ↓
translator.translate_location() で震源地名翻訳
    ↓
translator.translate_tsunami_warning() で津波情報翻訳
    ↓
_generate_translated_message() でメッセージ生成
    ↓
翻訳済みJSONレスポンス
```

### 4.3 メッセージ翻訳テンプレート

```python
# backend/app/main.py
templates = {
    "en": "[Earthquake] An earthquake occurred in {location}. Magnitude {magnitude}, Maximum intensity {intensity}. Depth: {depth}km. {tsunami_info}",
    "zh": "【地震信息】{location}发生地震。震级{magnitude}，最大震度{intensity}。震源深度约{depth}公里。{tsunami_info}",
    "th": "[แผ่นดินไหว] เกิดแผ่นดินไหวที่ {location} ขนาด {magnitude} ความรุนแรงสูงสุด {intensity} ความลึก: {depth} กม. {tsunami_info}",
    # ... 15言語すべてに対応
}
```

---

## 5. 起動方法

### 5.1 開発環境

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

### 5.2 APIテスト例

```bash
# 日本語
curl "http://localhost:8000/api/v1/earthquakes?limit=1&lang=ja"

# 英語
curl "http://localhost:8000/api/v1/earthquakes?limit=1&lang=en"

# タイ語
curl "http://localhost:8000/api/v1/earthquakes?limit=1&lang=th"

# 対応言語一覧
curl "http://localhost:8000/api/v1/languages"
```

---

## 6. API仕様

### 6.1 エンドポイント一覧

| エンドポイント | メソッド | パラメータ | 説明 |
|--------------|--------|-----------|------|
| `/` | GET | - | ヘルスチェック |
| `/api/v1/earthquakes` | GET | `limit`, `lang` | 地震情報取得（翻訳付き） |
| `/api/v1/weather/{area_code}` | GET | `lang` | 天気情報取得 |
| `/api/v1/alerts` | GET | `lang` | 警報・注意報取得 |
| `/api/v1/translate` | POST | `text`, `target_lang` | テキスト翻訳 |
| `/api/v1/shelters` | GET | `lat`, `lon`, `radius` | 避難所検索（開発中） |
| `/api/v1/languages` | GET | - | 対応言語一覧 |

### 6.2 言語コード

```
ja, en, zh, zh-TW, ko, vi, th, id, ms, tl, fr, de, it, es, ne, easy_ja
```

### 6.3 レスポンス例（地震情報）

```json
{
  "id": "693e4466e88ee598246be7ff",
  "time": "2025/12/14 13:57:00",
  "location": "和歌山県北部",
  "location_translated": "Nord de la préfecture de Wakayama",
  "magnitude": 2.3,
  "max_intensity": "1",
  "depth": 0,
  "tsunami_warning": "なし",
  "tsunami_warning_translated": "Aucun",
  "message_translated": "[Séisme] Un séisme s'est produit à Nord de la préfecture de Wakayama. Magnitude 2.3, Intensité maximale 1. Profondeur: 0km. Il n'y a pas de risque de tsunami suite à ce séisme."
}
```

---

## 7. 今後の開発予定

### 7.1 優先度: 高

1. **避難所マップ機能**
   - Leaflet/OpenStreetMap
   - 国土地理院 指定緊急避難場所データ

2. **プッシュ通知**
   - FCM (Firebase Cloud Messaging)
   - Service Worker

### 7.2 優先度: 中

3. **LINE公式アカウント連携**
   - LINE Messaging API
   - 月200通無料枠

4. **SNS情報収集**
   - Bluesky API（無料代替）

### 7.3 優先度: 低

5. **デマ検出AI**
6. **自治体向け管理画面**

---

## 8. 既知の問題・注意点

### 8.1 技術的な注意

1. **Claude APIキー**: 未設定でも動作するが、未登録地名は日本語のまま返却
2. **react-leaflet**: React 18必須（React 19非対応）
3. **レート制限**: 気象庁APIは過度なアクセスを避ける

### 8.2 法的・運用上の注意

1. **免責事項**: 災害情報の誤配信リスクへの法的対応が必要
2. **個人情報**: 位置情報取得時の同意取得
3. **24時間運用**: 災害時の可用性確保

---

## 9. 参考リンク

- [気象庁 気象データ高度利用ポータル](https://www.data.jma.go.jp/developer/index.html)
- [P2P地震情報 API仕様](https://www.p2pquake.net/develop/)
- [Next.js ドキュメント](https://nextjs.org/docs)
- [FastAPI ドキュメント](https://fastapi.tiangolo.com/)
- [Claude API](https://docs.anthropic.com/)

---

**以上、引継ぎ資料終わり**

次のステップとして、**避難所マップ機能** の実装を推奨します。
