"""
多言語翻訳サービス（ハイブリッド方式）

翻訳優先順位:
1. 静的マッピング（地名等） - 高速・無料
2. Claude API（未知の地名） - 高品質・有料
3. キャッシュ活用 - APIコスト削減
"""
from typing import Optional
import os
import json
import hashlib
from pathlib import Path

from .location_translations import get_location_translation, LOCATION_TRANSLATIONS


class TranslatorService:
    """ハイブリッド翻訳サービス"""

    # 定型文の多言語テンプレート（15言語対応）
    TEMPLATES = {
        "earthquake": {
            "ja": "【地震情報】{location}で地震がありました。マグニチュード{magnitude}、最大震度{intensity}。",
            "en": "[Earthquake] An earthquake occurred in {location}. Magnitude {magnitude}, Maximum intensity {intensity}.",
            "zh": "【地震信息】{location}发生地震。震级{magnitude}，最大震度{intensity}。",
            "zh-TW": "【地震資訊】{location}發生地震。規模{magnitude}，最大震度{intensity}。",
            "ko": "【지진정보】{location}에서 지진이 발생했습니다. 규모 {magnitude}, 최대진도 {intensity}.",
            "vi": "[Động đất] Động đất xảy ra tại {location}. Cường độ {magnitude}, Cường độ tối đa {intensity}.",
            "th": "[แผ่นดินไหว] เกิดแผ่นดินไหวที่ {location} ขนาด {magnitude} ความรุนแรงสูงสุด {intensity}",
            "id": "[Gempa] Gempa bumi terjadi di {location}. Magnitudo {magnitude}, Intensitas maksimum {intensity}.",
            "ms": "[Gempa Bumi] Gempa bumi berlaku di {location}. Magnitud {magnitude}, Keamatan maksimum {intensity}.",
            "tl": "[Lindol] Nagkaroon ng lindol sa {location}. Magnitude {magnitude}, Pinakamataas na intensity {intensity}.",
            "fr": "[Séisme] Un séisme s'est produit à {location}. Magnitude {magnitude}, Intensité maximale {intensity}.",
            "de": "[Erdbeben] Ein Erdbeben ereignete sich in {location}. Magnitude {magnitude}, Maximale Intensität {intensity}.",
            "it": "[Terremoto] Si è verificato un terremoto a {location}. Magnitudo {magnitude}, Intensità massima {intensity}.",
            "es": "[Terremoto] Ocurrió un terremoto en {location}. Magnitud {magnitude}, Intensidad máxima {intensity}.",
            "ne": "[भूकम्प] {location} मा भूकम्प आयो। म्याग्निच्युड {magnitude}, अधिकतम तीव्रता {intensity}।",
            "easy_ja": "【じしん】{location}で じしんが ありました。つよさは {intensity} です。",
        },
        "tsunami_warning": {
            "ja": "【津波警報】沿岸部の方は直ちに高台に避難してください。",
            "en": "[Tsunami Warning] Those in coastal areas should evacuate to higher ground immediately.",
            "zh": "【海啸警报】沿海地区的人员请立即撤离到高处。",
            "zh-TW": "【海嘯警報】沿海地區的民眾請立即撤離到高處。",
            "ko": "【쓰나미 경보】해안 지역에 계신 분들은 즉시 고지대로 대피하세요.",
            "vi": "[Cảnh báo sóng thần] Những người ở vùng ven biển hãy sơ tán đến nơi cao hơn ngay lập tức.",
            "th": "[เตือนภัยสึนามิ] ผู้ที่อยู่ในพื้นที่ชายฝั่งควรอพยพไปยังที่สูงทันที",
            "id": "[Peringatan Tsunami] Mereka yang berada di daerah pesisir harus segera mengungsi ke tempat yang lebih tinggi.",
            "ms": "[Amaran Tsunami] Mereka yang berada di kawasan pantai perlu berpindah ke kawasan tinggi dengan segera.",
            "tl": "[Babala ng Tsunami] Ang mga nasa baybayin ay dapat lumikas agad sa mas mataas na lugar.",
            "fr": "[Alerte Tsunami] Les personnes dans les zones côtières doivent évacuer immédiatement vers les hauteurs.",
            "de": "[Tsunami-Warnung] Personen in Küstengebieten sollten sofort auf höhergelegene Gebiete evakuieren.",
            "it": "[Allerta Tsunami] Le persone nelle zone costiere devono evacuare immediatamente verso zone più elevate.",
            "es": "[Alerta de Tsunami] Las personas en zonas costeras deben evacuar inmediatamente hacia tierras altas.",
            "ne": "[सुनामी चेतावनी] तटीय क्षेत्रमा हुनुहुनेहरू तुरुन्तै उच्च भूमिमा सर्नुहोस्।",
            "easy_ja": "【つなみ けいほう】うみの ちかくの ひとは すぐに たかい ところに にげて ください。",
        },
        "evacuation": {
            "ja": "【避難指示】{area}に避難指示が発令されました。直ちに避難してください。",
            "en": "[Evacuation Order] An evacuation order has been issued for {area}. Please evacuate immediately.",
            "zh": "【避难指示】{area}已发布避难指示。请立即避难。",
            "zh-TW": "【避難指示】{area}已發布避難指示。請立即避難。",
            "ko": "【대피 지시】{area}에 대피 지시가 발령되었습니다. 즉시 대피하세요.",
            "vi": "[Lệnh sơ tán] Lệnh sơ tán đã được ban hành cho {area}. Hãy sơ tán ngay lập tức.",
            "th": "[คำสั่งอพยพ] มีคำสั่งอพยพสำหรับ {area} กรุณาอพยพทันที",
            "id": "[Perintah Evakuasi] Perintah evakuasi telah dikeluarkan untuk {area}. Harap segera mengungsi.",
            "ms": "[Arahan Pemindahan] Arahan pemindahan telah dikeluarkan untuk {area}. Sila berpindah segera.",
            "tl": "[Utos ng Paglikas] May utos ng paglikas para sa {area}. Mangyaring lumikas agad.",
            "fr": "[Ordre d'évacuation] Un ordre d'évacuation a été émis pour {area}. Veuillez évacuer immédiatement.",
            "de": "[Evakuierungsbefehl] Für {area} wurde ein Evakuierungsbefehl erlassen. Bitte evakuieren Sie sofort.",
            "it": "[Ordine di Evacuazione] È stato emesso un ordine di evacuazione per {area}. Si prega di evacuare immediatamente.",
            "es": "[Orden de Evacuación] Se ha emitido una orden de evacuación para {area}. Por favor evacúe inmediatamente.",
            "ne": "[खाली गर्ने आदेश] {area} को लागि खाली गर्ने आदेश जारी गरिएको छ। कृपया तुरुन्तै खाली गर्नुहोस्।",
            "easy_ja": "【ひなん しじ】{area}の ひとは すぐに にげて ください。",
        },
        "no_tsunami": {
            "ja": "この地震による津波の心配はありません。",
            "en": "There is no tsunami risk from this earthquake.",
            "zh": "此次地震没有海啸风险。",
            "zh-TW": "此次地震沒有海嘯風險。",
            "ko": "이 지진으로 인한 쓰나미 위험은 없습니다.",
            "vi": "Không có nguy cơ sóng thần từ trận động đất này.",
            "th": "ไม่มีความเสี่ยงจากสึนามิจากแผ่นดินไหวครั้งนี้",
            "id": "Tidak ada risiko tsunami dari gempa ini.",
            "ms": "Tiada risiko tsunami daripada gempa bumi ini.",
            "tl": "Walang panganib ng tsunami mula sa lindol na ito.",
            "fr": "Il n'y a pas de risque de tsunami suite à ce séisme.",
            "de": "Es besteht keine Tsunami-Gefahr durch dieses Erdbeben.",
            "it": "Non c'è rischio di tsunami da questo terremoto.",
            "es": "No hay riesgo de tsunami por este terremoto.",
            "ne": "यस भूकम्पबाट सुनामीको जोखिम छैन।",
            "easy_ja": "この じしんで つなみの しんぱいは ありません。",
        },
        "shelter_info": {
            "ja": "最寄りの避難所: {shelter_name}（{distance}km）",
            "en": "Nearest shelter: {shelter_name} ({distance}km)",
            "zh": "最近的避难所: {shelter_name}（{distance}公里）",
            "zh-TW": "最近的避難所: {shelter_name}（{distance}公里）",
            "ko": "가장 가까운 대피소: {shelter_name}({distance}km)",
            "vi": "Nơi trú ẩn gần nhất: {shelter_name} ({distance}km)",
            "th": "ที่พักพิงใกล้ที่สุด: {shelter_name} ({distance} กม.)",
            "id": "Tempat pengungsian terdekat: {shelter_name} ({distance}km)",
            "ms": "Pusat pemindahan terdekat: {shelter_name} ({distance}km)",
            "tl": "Pinakamalapit na evacuation center: {shelter_name} ({distance}km)",
            "fr": "Abri le plus proche: {shelter_name} ({distance}km)",
            "de": "Nächste Notunterkunft: {shelter_name} ({distance}km)",
            "it": "Rifugio più vicino: {shelter_name} ({distance}km)",
            "es": "Refugio más cercano: {shelter_name} ({distance}km)",
            "ne": "नजिकको आश्रय: {shelter_name} ({distance} किमी)",
            "easy_ja": "ちかくの ひなんじょ: {shelter_name}（{distance}キロメートル）",
        }
    }

    # 言語名マッピング（15言語対応）
    LANGUAGE_NAMES = {
        "ja": "日本語",
        "en": "English",
        "zh": "简体中文",
        "zh-TW": "繁體中文",
        "ko": "한국어",
        "vi": "Tiếng Việt",
        "th": "ภาษาไทย",
        "id": "Bahasa Indonesia",
        "ms": "Bahasa Melayu",
        "tl": "Filipino",
        "fr": "Français",
        "de": "Deutsch",
        "it": "Italiano",
        "es": "Español",
        "ne": "नेपाली",
        "easy_ja": "やさしい日本語"
    }

    # 津波情報の翻訳（15言語対応）
    TSUNAMI_TRANSLATIONS = {
        "なし": {
            "en": "None",
            "zh": "无",
            "zh-TW": "無",
            "ko": "없음",
            "vi": "Không có",
            "th": "ไม่มี",
            "id": "Tidak ada",
            "ms": "Tiada",
            "tl": "Wala",
            "fr": "Aucun",
            "de": "Keine",
            "it": "Nessuno",
            "es": "Ninguno",
            "ne": "छैन",
            "easy_ja": "なし",
        },
        "不明": {
            "en": "Unknown",
            "zh": "不明",
            "zh-TW": "不明",
            "ko": "불명",
            "vi": "Không rõ",
            "th": "ไม่ทราบ",
            "id": "Tidak diketahui",
            "ms": "Tidak diketahui",
            "tl": "Hindi alam",
            "fr": "Inconnu",
            "de": "Unbekannt",
            "it": "Sconosciuto",
            "es": "Desconocido",
            "ne": "अज्ञात",
            "easy_ja": "わからない",
        },
        "調査中": {
            "en": "Under investigation",
            "zh": "调查中",
            "zh-TW": "調查中",
            "ko": "조사 중",
            "vi": "Đang điều tra",
            "th": "กำลังตรวจสอบ",
            "id": "Sedang diselidiki",
            "ms": "Sedang disiasat",
            "tl": "Sinisiyasat",
            "fr": "En cours d'investigation",
            "de": "Wird untersucht",
            "it": "In fase di indagine",
            "es": "En investigación",
            "ne": "अनुसन्धान गर्दै",
            "easy_ja": "しらべている",
        },
        "若干の海面変動": {
            "en": "Slight sea level change",
            "zh": "轻微海面变动",
            "zh-TW": "輕微海面變動",
            "ko": "약간의 해수면 변동",
            "vi": "Biến động mực nước biển nhẹ",
            "th": "ระดับน้ำทะเลเปลี่ยนแปลงเล็กน้อย",
            "id": "Perubahan permukaan laut sedikit",
            "ms": "Perubahan aras laut sedikit",
            "tl": "Bahagyang pagbabago sa antas ng dagat",
            "fr": "Léger changement du niveau de la mer",
            "de": "Leichte Meeresspiegeländerung",
            "it": "Leggero cambiamento del livello del mare",
            "es": "Ligero cambio en el nivel del mar",
            "ne": "समुद्र सतहमा थोरै परिवर्तन",
            "easy_ja": "うみの たかさが すこし かわる",
        },
        "津波注意報": {
            "en": "Tsunami Advisory",
            "zh": "海啸注意报",
            "zh-TW": "海嘯注意報",
            "ko": "쓰나미 주의보",
            "vi": "Cảnh báo sóng thần",
            "th": "คำเตือนสึนามิ",
            "id": "Peringatan Tsunami",
            "ms": "Nasihat Tsunami",
            "tl": "Payo sa Tsunami",
            "fr": "Avis de tsunami",
            "de": "Tsunami-Hinweis",
            "it": "Avviso tsunami",
            "es": "Aviso de tsunami",
            "ne": "सुनामी सावधानी",
            "easy_ja": "つなみ ちゅういほう",
        },
        "津波警報": {
            "en": "Tsunami Warning",
            "zh": "海啸警报",
            "zh-TW": "海嘯警報",
            "ko": "쓰나미 경보",
            "vi": "Cảnh báo sóng thần nghiêm trọng",
            "th": "เตือนภัยสึนามิ",
            "id": "Peringatan Tsunami Serius",
            "ms": "Amaran Tsunami",
            "tl": "Babala ng Tsunami",
            "fr": "Alerte tsunami",
            "de": "Tsunami-Warnung",
            "it": "Allerta tsunami",
            "es": "Alerta de tsunami",
            "ne": "सुनामी चेतावनी",
            "easy_ja": "つなみ けいほう",
        },
    }

    def __init__(self):
        """初期化"""
        self.anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
        self._cache: dict[str, str] = {}
        self._cache_file = Path(__file__).parent.parent.parent / "data" / "translation_cache.json"
        self._load_cache()

    def _load_cache(self):
        """キャッシュをファイルから読み込み"""
        try:
            if self._cache_file.exists():
                with open(self._cache_file, "r", encoding="utf-8") as f:
                    self._cache = json.load(f)
        except Exception as e:
            print(f"キャッシュ読み込みエラー: {e}")
            self._cache = {}

    def _save_cache(self):
        """キャッシュをファイルに保存"""
        try:
            self._cache_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self._cache_file, "w", encoding="utf-8") as f:
                json.dump(self._cache, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"キャッシュ保存エラー: {e}")

    def _get_cache_key(self, text: str, target_lang: str) -> str:
        """キャッシュキーを生成"""
        return hashlib.md5(f"{text}:{target_lang}".encode()).hexdigest()

    async def translate_location(self, location: str, target_lang: str) -> str:
        """
        震源地名を翻訳（ハイブリッド方式）

        Args:
            location: 日本語の震源地名
            target_lang: 翻訳先言語コード

        Returns:
            翻訳された地名
        """
        if target_lang == "ja":
            return location

        # 1. 静的マッピングを試行
        static_translation = get_location_translation(location, target_lang)
        if static_translation:
            return static_translation

        # 2. キャッシュを確認
        cache_key = self._get_cache_key(location, target_lang)
        if cache_key in self._cache:
            return self._cache[cache_key]

        # 3. Claude APIで翻訳（APIキーがある場合）
        if self.anthropic_api_key:
            try:
                translated = await self._translate_with_claude(location, target_lang)
                if translated:
                    # キャッシュに保存
                    self._cache[cache_key] = translated
                    self._save_cache()
                    return translated
            except Exception as e:
                print(f"Claude API翻訳エラー: {e}")

        # 4. フォールバック: 元のテキストを返す
        return location

    async def _translate_with_claude(self, text: str, target_lang: str) -> Optional[str]:
        """
        Claude APIを使用して翻訳

        Args:
            text: 翻訳するテキスト
            target_lang: 翻訳先言語コード

        Returns:
            翻訳されたテキスト
        """
        try:
            import httpx

            lang_names = {
                "en": "English",
                "zh": "Simplified Chinese",
                "zh-TW": "Traditional Chinese",
                "ko": "Korean",
                "vi": "Vietnamese",
                "th": "Thai",
                "id": "Indonesian",
                "ms": "Malay",
                "tl": "Filipino/Tagalog",
                "fr": "French",
                "de": "German",
                "it": "Italian",
                "es": "Spanish",
                "ne": "Nepali",
                "easy_ja": "Simple Japanese (やさしい日本語)",
            }

            target_name = lang_names.get(target_lang, target_lang)

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "Content-Type": "application/json",
                        "X-API-Key": self.anthropic_api_key,
                        "anthropic-version": "2023-06-01"
                    },
                    json={
                        "model": "claude-3-haiku-20240307",
                        "max_tokens": 100,
                        "messages": [{
                            "role": "user",
                            "content": f"Translate this Japanese earthquake location name to {target_name}. Only output the translation, nothing else.\n\n{text}"
                        }]
                    },
                    timeout=10.0
                )

                if response.status_code == 200:
                    data = response.json()
                    return data["content"][0]["text"].strip()
                else:
                    print(f"Claude API error: {response.status_code}")
                    return None

        except Exception as e:
            print(f"Claude API request error: {e}")
            return None

    def translate_tsunami_warning(self, warning: str, target_lang: str) -> str:
        """
        津波情報を翻訳

        Args:
            warning: 日本語の津波情報
            target_lang: 翻訳先言語コード

        Returns:
            翻訳された津波情報
        """
        if target_lang == "ja":
            return warning

        if warning in self.TSUNAMI_TRANSLATIONS:
            return self.TSUNAMI_TRANSLATIONS[warning].get(target_lang, warning)

        return warning

    async def translate(
        self,
        text: str,
        target_lang: str,
        source_lang: str = "ja"
    ) -> str:
        """
        テキストを翻訳

        Args:
            text: 翻訳するテキスト
            target_lang: 翻訳先言語
            source_lang: 翻訳元言語

        Returns:
            str: 翻訳されたテキスト
        """
        if target_lang == source_lang:
            return text

        # テンプレートベースの翻訳を試行
        template_translation = self._try_template_translation(text, target_lang)
        if template_translation:
            return template_translation

        # Claude APIで翻訳（APIキーがある場合）
        if self.anthropic_api_key:
            cache_key = self._get_cache_key(text, target_lang)
            if cache_key in self._cache:
                return self._cache[cache_key]

            try:
                translated = await self._translate_with_claude(text, target_lang)
                if translated:
                    self._cache[cache_key] = translated
                    self._save_cache()
                    return translated
            except Exception as e:
                print(f"翻訳エラー: {e}")

        # フォールバック
        return text

    def _try_template_translation(self, text: str, target_lang: str) -> Optional[str]:
        """
        テンプレートを使用した翻訳を試行

        Args:
            text: 翻訳するテキスト
            target_lang: 翻訳先言語

        Returns:
            str: 翻訳されたテキスト（テンプレートが見つからない場合はNone）
        """
        for template_key, translations in self.TEMPLATES.items():
            ja_template = translations.get("ja", "")
            if any(keyword in text for keyword in self._extract_keywords(ja_template)):
                if target_lang in translations:
                    return translations[target_lang]

        return None

    def _extract_keywords(self, template: str) -> list[str]:
        """
        テンプレートからキーワードを抽出

        Args:
            template: テンプレート文字列

        Returns:
            list[str]: キーワードリスト
        """
        keywords = []
        for word in ["地震", "津波", "避難", "警報", "注意報"]:
            if word in template:
                keywords.append(word)
        return keywords

    def get_template(
        self,
        template_key: str,
        lang: str,
        **kwargs
    ) -> Optional[str]:
        """
        テンプレートを取得してフォーマット

        Args:
            template_key: テンプレートキー
            lang: 言語コード
            **kwargs: テンプレートに埋め込む変数

        Returns:
            str: フォーマットされたテンプレート
        """
        templates = self.TEMPLATES.get(template_key, {})
        template = templates.get(lang) or templates.get("ja")

        if template:
            try:
                return template.format(**kwargs)
            except KeyError:
                return template

        return None

    def get_supported_languages(self) -> dict:
        """
        サポートする言語一覧を取得

        Returns:
            dict: 言語コードと言語名のマッピング
        """
        return self.LANGUAGE_NAMES.copy()

    def get_static_location_count(self) -> int:
        """
        静的マッピングに登録されている地名数を取得

        Returns:
            int: 登録地名数
        """
        return len(LOCATION_TRANSLATIONS)
