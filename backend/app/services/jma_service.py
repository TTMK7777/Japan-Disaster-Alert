"""
気象庁API連携サービス
"""
import httpx
from typing import Optional
from ..models import WeatherInfo, DisasterAlert
from ..utils.logger import get_logger

logger = get_logger(__name__)


class JMAService:
    """気象庁データ取得サービス"""

    def __init__(self):
        from ..config import settings
        self.BASE_URL = settings.jma_base_url
        self.timeout = settings.api_timeout

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

    async def get_weather_forecast(self, area_code: str) -> Optional[WeatherInfo]:
        """
        指定地域の天気概況を取得

        Args:
            area_code: 地域コード（例: 130000=東京都）

        Returns:
            Optional[WeatherInfo]: 天気情報。取得に失敗した場合はNoneを返す。

        Raises:
            httpx.HTTPError: APIリクエストに失敗した場合（内部でキャッチされ、Noneを返す）
        """
        url = f"{self.BASE_URL}/forecast/data/overview_forecast/{area_code}.json"

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, timeout=self.timeout)
                response.raise_for_status()
                data = response.json()

                return WeatherInfo(
                    area=data.get("targetArea", ""),
                    area_code=area_code,
                    publishing_office=data.get("publishingOffice", "気象庁"),
                    report_datetime=data.get("reportDatetime", ""),
                    headline=data.get("headlineText"),
                    text=data.get("text", "")
                )
            except httpx.HTTPError as e:
                logger.error(f"気象情報取得エラー: {e}", exc_info=True)
                return None

    async def get_earthquake_list(self, limit: int = 10) -> list[dict]:
        """
        最新の地震情報一覧を取得

        Args:
            limit: 取得件数

        Returns:
            list: 地震情報リスト
        """
        url = f"{self.BASE_URL}/quake/data/list.json"

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, timeout=self.timeout)
                response.raise_for_status()
                data = response.json()
                return data[:limit]
            except httpx.HTTPError as e:
                logger.error(f"地震情報取得エラー: {e}", exc_info=True)
                return []

    async def get_current_alerts(self) -> list[DisasterAlert]:
        """
        現在発令中の警報・注意報を取得

        Returns:
            list[DisasterAlert]: 警報リスト
        
        Note:
            このメソッドは将来の拡張用に予約されています。
            現在はWarningServiceを使用してください。
        """
        # 注意: このメソッドは将来の拡張用です
        # 現在はWarningService.get_warnings()を使用してください
        logger.warning("get_current_alerts()は非推奨です。WarningServiceを使用してください。")
        return []

    def get_area_code(self, prefecture_name: str) -> Optional[str]:
        """
        都道府県名から地域コードを取得

        Args:
            prefecture_name: 都道府県名

        Returns:
            str: 地域コード
        """
        return self.AREA_CODES.get(prefecture_name)
