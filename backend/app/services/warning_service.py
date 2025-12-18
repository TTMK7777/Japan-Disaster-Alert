"""
気象庁 警報・注意報サービス（多言語対応）
"""
import httpx
from typing import Optional
from datetime import datetime
from ..models import DisasterAlert
from ..utils.logger import get_logger

logger = get_logger(__name__)


class WarningService:
    """気象庁の警報・注意報を取得するサービス"""

    def __init__(self):
        from ..config import settings
        self.BASE_URL = settings.jma_base_url
        self.timeout = settings.api_timeout

    # 警報・注意報コードマッピング（多言語対応）
    WARNING_CODES = {
        "02": {"ja": "暴風雪警報", "en": "Blizzard Warning", "zh": "暴风雪警报", "ko": "폭풍설 경보", "vi": "Cảnh báo bão tuyết", "easy_ja": "ふぶき けいほう", "severity": "high"},
        "03": {"ja": "大雨警報", "en": "Heavy Rain Warning", "zh": "大雨警报", "ko": "호우 경보", "vi": "Cảnh báo mưa lớn", "easy_ja": "おおあめ けいほう", "severity": "high"},
        "04": {"ja": "洪水警報", "en": "Flood Warning", "zh": "洪水警报", "ko": "홍수 경보", "vi": "Cảnh báo lũ lụt", "easy_ja": "こうずい けいほう", "severity": "high"},
        "05": {"ja": "暴風警報", "en": "Storm Warning", "zh": "暴风警报", "ko": "폭풍 경보", "vi": "Cảnh báo bão", "easy_ja": "ぼうふう けいほう", "severity": "high"},
        "06": {"ja": "大雪警報", "en": "Heavy Snow Warning", "zh": "大雪警报", "ko": "대설 경보", "vi": "Cảnh báo tuyết lớn", "easy_ja": "おおゆき けいほう", "severity": "high"},
        "07": {"ja": "波浪警報", "en": "High Waves Warning", "zh": "海浪警报", "ko": "파랑 경보", "vi": "Cảnh báo sóng lớn", "easy_ja": "なみ けいほう", "severity": "high"},
        "08": {"ja": "高潮警報", "en": "Storm Surge Warning", "zh": "风暴潮警报", "ko": "해일 경보", "vi": "Cảnh báo triều cường", "easy_ja": "たかしお けいほう", "severity": "high"},
        "10": {"ja": "大雨注意報", "en": "Heavy Rain Advisory", "zh": "大雨注意报", "ko": "호우 주의보", "vi": "Chú ý mưa lớn", "easy_ja": "おおあめ ちゅういほう", "severity": "medium"},
        "12": {"ja": "大雪注意報", "en": "Heavy Snow Advisory", "zh": "大雪注意报", "ko": "대설 주의보", "vi": "Chú ý tuyết lớn", "easy_ja": "おおゆき ちゅういほう", "severity": "medium"},
        "13": {"ja": "風雪注意報", "en": "Wind Snow Advisory", "zh": "风雪注意报", "ko": "풍설 주의보", "vi": "Chú ý gió tuyết", "easy_ja": "ふうせつ ちゅういほう", "severity": "medium"},
        "14": {"ja": "雷注意報", "en": "Thunder Advisory", "zh": "雷电注意报", "ko": "뇌우 주의보", "vi": "Chú ý sấm sét", "easy_ja": "かみなり ちゅういほう", "severity": "medium"},
        "15": {"ja": "強風注意報", "en": "Strong Wind Advisory", "zh": "强风注意报", "ko": "강풍 주의보", "vi": "Chú ý gió mạnh", "easy_ja": "つよいかぜ ちゅういほう", "severity": "medium"},
        "16": {"ja": "波浪注意報", "en": "High Waves Advisory", "zh": "海浪注意报", "ko": "파랑 주의보", "vi": "Chú ý sóng lớn", "easy_ja": "なみ ちゅういほう", "severity": "medium"},
        "17": {"ja": "融雪注意報", "en": "Snowmelt Advisory", "zh": "融雪注意报", "ko": "융설 주의보", "vi": "Chú ý tan tuyết", "easy_ja": "ゆきどけ ちゅういほう", "severity": "medium"},
        "18": {"ja": "洪水注意報", "en": "Flood Advisory", "zh": "洪水注意报", "ko": "홍수 주의보", "vi": "Chú ý lũ lụt", "easy_ja": "こうずい ちゅういほう", "severity": "medium"},
        "19": {"ja": "高潮注意報", "en": "Storm Surge Advisory", "zh": "风暴潮注意报", "ko": "해일 주의보", "vi": "Chú ý triều cường", "easy_ja": "たかしお ちゅういほう", "severity": "medium"},
        "20": {"ja": "濃霧注意報", "en": "Dense Fog Advisory", "zh": "浓雾注意报", "ko": "짙은 안개 주의보", "vi": "Chú ý sương mù dày", "easy_ja": "きり ちゅういほう", "severity": "low"},
        "21": {"ja": "乾燥注意報", "en": "Dry Air Advisory", "zh": "干燥注意报", "ko": "건조 주의보", "vi": "Chú ý không khí khô", "easy_ja": "かんそう ちゅういほう", "severity": "low"},
        "22": {"ja": "なだれ注意報", "en": "Avalanche Advisory", "zh": "雪崩注意报", "ko": "눈사태 주의보", "vi": "Chú ý lở tuyết", "easy_ja": "なだれ ちゅういほう", "severity": "medium"},
        "23": {"ja": "低温注意報", "en": "Low Temperature Advisory", "zh": "低温注意报", "ko": "저온 주의보", "vi": "Chú ý nhiệt độ thấp", "easy_ja": "さむさ ちゅういほう", "severity": "low"},
        "24": {"ja": "霜注意報", "en": "Frost Advisory", "zh": "霜冻注意报", "ko": "서리 주의보", "vi": "Chú ý sương giá", "easy_ja": "しも ちゅういほう", "severity": "low"},
        "25": {"ja": "着氷注意報", "en": "Icing Advisory", "zh": "结冰注意报", "ko": "착빙 주의보", "vi": "Chú ý đóng băng", "easy_ja": "こおり ちゅういほう", "severity": "low"},
        "26": {"ja": "着雪注意報", "en": "Snow Accretion Advisory", "zh": "积雪注意报", "ko": "착설 주의보", "vi": "Chú ý tuyết bám", "easy_ja": "ゆき ちゅういほう", "severity": "low"},
        "32": {"ja": "暴風雪特別警報", "en": "Blizzard Emergency Warning", "zh": "暴风雪特别警报", "ko": "폭풍설 특별 경보", "vi": "Cảnh báo khẩn cấp bão tuyết", "easy_ja": "ふぶき とくべつけいほう", "severity": "extreme"},
        "33": {"ja": "大雨特別警報", "en": "Heavy Rain Emergency Warning", "zh": "大雨特别警报", "ko": "호우 특별 경보", "vi": "Cảnh báo khẩn cấp mưa lớn", "easy_ja": "おおあめ とくべつけいほう", "severity": "extreme"},
        "35": {"ja": "暴風特別警報", "en": "Storm Emergency Warning", "zh": "暴风特别警报", "ko": "폭풍 특별 경보", "vi": "Cảnh báo khẩn cấp bão", "easy_ja": "ぼうふう とくべつけいほう", "severity": "extreme"},
        "36": {"ja": "大雪特別警報", "en": "Heavy Snow Emergency Warning", "zh": "大雪特别警报", "ko": "대설 특별 경보", "vi": "Cảnh báo khẩn cấp tuyết lớn", "easy_ja": "おおゆき とくべつけいほう", "severity": "extreme"},
        "37": {"ja": "波浪特別警報", "en": "High Waves Emergency Warning", "zh": "海浪特别警报", "ko": "파랑 특별 경보", "vi": "Cảnh báo khẩn cấp sóng lớn", "easy_ja": "なみ とくべつけいほう", "severity": "extreme"},
        "38": {"ja": "高潮特別警報", "en": "Storm Surge Emergency Warning", "zh": "风暴潮特别警报", "ko": "해일 특별 경보", "vi": "Cảnh báo khẩn cấp triều cường", "easy_ja": "たかしお とくべつけいほう", "severity": "extreme"},
    }

    # 地域名翻訳
    AREA_TRANSLATIONS = {
        "東京地方": {"en": "Tokyo Area", "zh": "东京地区", "ko": "도쿄 지역", "vi": "Khu vực Tokyo", "easy_ja": "とうきょう"},
        "伊豆諸島北部": {"en": "Northern Izu Islands", "zh": "伊豆诸岛北部", "ko": "이즈 제도 북부", "vi": "Bắc quần đảo Izu", "easy_ja": "いずしょとう きたぶ"},
        "伊豆諸島南部": {"en": "Southern Izu Islands", "zh": "伊豆诸岛南部", "ko": "이즈 제도 남부", "vi": "Nam quần đảo Izu", "easy_ja": "いずしょとう みなみぶ"},
        "小笠原諸島": {"en": "Ogasawara Islands", "zh": "小笠原诸岛", "ko": "오가사와라 제도", "vi": "Quần đảo Ogasawara", "easy_ja": "おがさわらしょとう"},
    }

    # 説明文テンプレート
    DESCRIPTION_TEMPLATES = {
        "ja": "{area}に{warning}が発表されています。",
        "en": "{warning} has been issued for {area}.",
        "zh": "{area}发布了{warning}。",
        "ko": "{area}에 {warning}이(가) 발령되었습니다.",
        "vi": "{warning} đã được ban hành cho {area}.",
        "easy_ja": "{area}に {warning}が でています。",
    }

    # 都道府県コードマッピング
    AREA_CODES = {
        "北海道": "016000",
        "青森県": "020000",
        "岩手県": "030000",
        "宮城県": "040000",
        "秋田県": "050000",
        "山形県": "060000",
        "福島県": "070000",
        "茨城県": "080000",
        "栃木県": "090000",
        "群馬県": "100000",
        "埼玉県": "110000",
        "千葉県": "120000",
        "東京都": "130000",
        "神奈川県": "140000",
        "新潟県": "150000",
        "富山県": "160000",
        "石川県": "170000",
        "福井県": "180000",
        "山梨県": "190000",
        "長野県": "200000",
        "岐阜県": "210000",
        "静岡県": "220000",
        "愛知県": "230000",
        "三重県": "240000",
        "滋賀県": "250000",
        "京都府": "260000",
        "大阪府": "270000",
        "兵庫県": "280000",
        "奈良県": "290000",
        "和歌山県": "300000",
        "鳥取県": "310000",
        "島根県": "320000",
        "岡山県": "330000",
        "広島県": "340000",
        "山口県": "350000",
        "徳島県": "360000",
        "香川県": "370000",
        "愛媛県": "380000",
        "高知県": "390000",
        "福岡県": "400000",
        "佐賀県": "410000",
        "長崎県": "420000",
        "熊本県": "430000",
        "大分県": "440000",
        "宮崎県": "450000",
        "鹿児島県": "460000",
        "沖縄県": "471000",
    }

    async def get_warnings(self, area_code: str, lang: str = "ja") -> list[DisasterAlert]:
        """
        指定地域の警報・注意報を取得

        Args:
            area_code: 地域コード（例: 130000=東京都）
            lang: 言語コード（ja, en, zh, ko, vi, easy_ja）

        Returns:
            list[DisasterAlert]: 警報・注意報リスト
        """
        url = f"{self.BASE_URL}/warning/data/warning/{area_code}.json"

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, timeout=self.timeout)
                response.raise_for_status()
                data = response.json()
                return self._parse_warnings(data, area_code, lang)
            except httpx.HTTPError as e:
                logger.error(f"警報情報取得エラー: {e}", exc_info=True)
                return []

    def _get_warning_name(self, code: str, lang: str) -> str:
        """警報コードから指定言語の名前を取得"""
        warning_info = self.WARNING_CODES.get(code, {})
        # 指定言語がなければ英語、それもなければ日本語
        return warning_info.get(lang, warning_info.get("en", warning_info.get("ja", "")))

    def _get_area_name(self, area_name: str, lang: str) -> str:
        """地域名を指定言語に翻訳"""
        if lang == "ja":
            return area_name
        area_trans = self.AREA_TRANSLATIONS.get(area_name, {})
        return area_trans.get(lang, area_name)

    def _get_description(self, area_name: str, warning_name: str, lang: str) -> str:
        """説明文を指定言語で生成"""
        template = self.DESCRIPTION_TEMPLATES.get(lang, self.DESCRIPTION_TEMPLATES["en"])
        return template.format(area=area_name, warning=warning_name)

    def _parse_warnings(self, data: dict, area_code: str, lang: str = "ja") -> list[DisasterAlert]:
        """APIレスポンスを警報リストにパース"""
        alerts = []
        report_datetime = data.get("reportDatetime", "")

        # areaTypesから警報情報を抽出
        area_types = data.get("areaTypes", [])
        if not area_types:
            return alerts

        # 最初のエリアタイプ（広域）から情報を取得
        for area_type in area_types:
            areas = area_type.get("areas", [])
            for area in areas:
                area_name_ja = area.get("name", "")
                area_name = self._get_area_name(area_name_ja, lang)
                warnings = area.get("warnings", [])

                for warning in warnings:
                    code = warning.get("code", "")
                    status = warning.get("status", "")

                    # 発表中の警報のみ処理
                    if status == "発表" and code in self.WARNING_CODES:
                        warning_info = self.WARNING_CODES[code]
                        warning_name = self._get_warning_name(code, lang)
                        alert_id = f"{area_code}_{code}_{datetime.now().strftime('%Y%m%d%H%M')}"

                        # 日本語のタイトルと翻訳版の両方を保持
                        title_ja = self._get_warning_name(code, "ja")
                        title_translated = warning_name if lang != "ja" else None
                        description = self._get_description(area_name, warning_name, lang)

                        alerts.append(DisasterAlert(
                            id=alert_id,
                            type=self._get_alert_type(warning_info["severity"]),
                            title=title_ja,
                            title_translated=title_translated,
                            description=self._get_description(area_name_ja, title_ja, "ja"),
                            description_translated=description if lang != "ja" else None,
                            area=area_name,
                            issued_at=report_datetime,
                            expires_at=None,
                            severity=warning_info["severity"]
                        ))

        return alerts

    def _get_alert_type(self, severity: str) -> str:
        """重要度からアラートタイプを決定"""
        if severity == "extreme":
            return "special_warning"
        elif severity == "high":
            return "warning"
        elif severity == "medium":
            return "advisory"
        else:
            return "watch"

    async def get_all_prefectures_warnings(self) -> list[DisasterAlert]:
        """
        全国の警報・注意報を取得

        Returns:
            list[DisasterAlert]: 全国の警報・注意報リスト
        """
        all_alerts = []

        async with httpx.AsyncClient() as client:
            for prefecture, area_code in self.AREA_CODES.items():
                try:
                    url = f"{self.BASE_URL}/warning/data/warning/{area_code}.json"
                    response = await client.get(url, timeout=self.timeout)
                    if response.status_code == 200:
                        data = response.json()
                        alerts = self._parse_warnings(data, area_code)
                        all_alerts.extend(alerts)
                except httpx.HTTPError as e:
                    logger.warning(f"{prefecture}の警報取得エラー: {e}")
                    continue

        return all_alerts

    async def get_special_warnings(self) -> list[DisasterAlert]:
        """
        全国の特別警報のみを取得

        Returns:
            list[DisasterAlert]: 特別警報リスト
        """
        all_alerts = await self.get_all_prefectures_warnings()
        return [alert for alert in all_alerts if alert.severity == "extreme"]

    def get_area_code(self, prefecture_name: str) -> Optional[str]:
        """都道府県名から地域コードを取得"""
        return self.AREA_CODES.get(prefecture_name)
