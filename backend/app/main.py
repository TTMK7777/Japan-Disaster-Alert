"""
災害対応AIエージェントシステム - バックエンドAPI
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import httpx
from datetime import datetime
from typing import Optional
import asyncio

from .models import (
    EarthquakeInfo,
    WeatherInfo,
    DisasterAlert,
    HealthResponse,
    TranslatedMessage,
    ShelterInfo,
    TsunamiInfo,
    VolcanoInfo,
    VolcanoWarning
)
from .services.jma_service import JMAService
from .services.p2p_service import P2PQuakeService
from .services.translator import TranslatorService
from .services.warning_service import WarningService
from .services.tsunami_service import TsunamiService
from .services.volcano_service import VolcanoService
from .services.shelter_service import ShelterService

# サービスインスタンス
jma_service = JMAService()
p2p_service = P2PQuakeService()
translator = TranslatorService()
warning_service = WarningService()
tsunami_service = TsunamiService()
volcano_service = VolcanoService()
shelter_service = ShelterService()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """アプリケーションのライフサイクル管理"""
    # 起動時
    print("災害対応AIシステム起動中...")
    yield
    # 終了時
    print("災害対応AIシステム終了")


app = FastAPI(
    title="災害対応AIエージェントAPI",
    description="多言語対応の災害情報提供システム",
    version="1.0.0",
    lifespan=lifespan
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 本番環境では制限すること
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", response_model=HealthResponse)
async def root():
    """ヘルスチェック"""
    return HealthResponse(
        status="healthy",
        service="災害対応AIエージェント",
        version="1.0.0",
        timestamp=datetime.now().isoformat()
    )


@app.get("/api/v1/earthquakes", response_model=list[EarthquakeInfo])
async def get_earthquakes(limit: int = 10, lang: str = "ja"):
    """
    最新の地震情報を取得

    - **limit**: 取得件数（デフォルト: 10）
    - **lang**: 言語コード（ja, en, zh, ko, vi, ne, easy_ja）
    """
    try:
        earthquakes = await p2p_service.get_recent_earthquakes(limit=limit)

        # 多言語翻訳（ハイブリッド方式）
        if lang != "ja":
            for eq in earthquakes:
                # 震源地名翻訳（静的マッピング → Claude API → キャッシュ）
                eq.location_translated = await translator.translate_location(
                    eq.location, target_lang=lang
                )
                # 津波警報翻訳（静的マッピング）
                eq.tsunami_warning_translated = translator.translate_tsunami_warning(
                    eq.tsunami_warning, target_lang=lang
                )
                # メッセージ生成（テンプレートを使用）
                eq.message_translated = _generate_translated_message(
                    eq, lang, eq.location_translated, eq.tsunami_warning_translated
                )

        return earthquakes
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _generate_translated_message(
    eq: EarthquakeInfo,
    lang: str,
    location_translated: str,
    tsunami_translated: str
) -> str:
    """
    地震情報メッセージを多言語で生成

    Args:
        eq: 地震情報
        lang: 言語コード
        location_translated: 翻訳済み震源地名
        tsunami_translated: 翻訳済み津波情報

    Returns:
        str: 翻訳されたメッセージ
    """
    # 各言語のテンプレート（15言語対応）
    templates = {
        "en": "[Earthquake] An earthquake occurred in {location}. Magnitude {magnitude}, Maximum intensity {intensity}. Depth: {depth}km. {tsunami_info}",
        "zh": "【地震信息】{location}发生地震。震级{magnitude}，最大震度{intensity}。震源深度约{depth}公里。{tsunami_info}",
        "zh-TW": "【地震資訊】{location}發生地震。規模{magnitude}，最大震度{intensity}。震源深度約{depth}公里。{tsunami_info}",
        "ko": "【지진정보】{location}에서 지진이 발생했습니다. 규모 {magnitude}, 최대진도 {intensity}. 진원 깊이 약 {depth}km. {tsunami_info}",
        "vi": "[Động đất] Động đất xảy ra tại {location}. Cường độ {magnitude}, Cường độ tối đa {intensity}. Độ sâu: {depth}km. {tsunami_info}",
        "th": "[แผ่นดินไหว] เกิดแผ่นดินไหวที่ {location} ขนาด {magnitude} ความรุนแรงสูงสุด {intensity} ความลึก: {depth} กม. {tsunami_info}",
        "id": "[Gempa] Gempa bumi terjadi di {location}. Magnitudo {magnitude}, Intensitas maksimum {intensity}. Kedalaman: {depth}km. {tsunami_info}",
        "ms": "[Gempa Bumi] Gempa bumi berlaku di {location}. Magnitud {magnitude}, Keamatan maksimum {intensity}. Kedalaman: {depth}km. {tsunami_info}",
        "tl": "[Lindol] Nagkaroon ng lindol sa {location}. Magnitude {magnitude}, Pinakamataas na intensity {intensity}. Lalim: {depth}km. {tsunami_info}",
        "fr": "[Séisme] Un séisme s'est produit à {location}. Magnitude {magnitude}, Intensité maximale {intensity}. Profondeur: {depth}km. {tsunami_info}",
        "de": "[Erdbeben] Ein Erdbeben ereignete sich in {location}. Magnitude {magnitude}, Maximale Intensität {intensity}. Tiefe: {depth}km. {tsunami_info}",
        "it": "[Terremoto] Si è verificato un terremoto a {location}. Magnitudo {magnitude}, Intensità massima {intensity}. Profondità: {depth}km. {tsunami_info}",
        "es": "[Terremoto] Ocurrió un terremoto en {location}. Magnitud {magnitude}, Intensidad máxima {intensity}. Profundidad: {depth}km. {tsunami_info}",
        "ne": "[भूकम्प] {location} मा भूकम्प आयो। म्याग्निच्युड {magnitude}, अधिकतम तीव्रता {intensity}। गहिराई: {depth} किमी। {tsunami_info}",
        "easy_ja": "【じしん】{location}で じしんが ありました。つよさは {intensity} です。ふかさは {depth}キロメートル。{tsunami_info}",
    }

    # 津波情報のテンプレート（15言語対応）
    tsunami_templates = {
        "en": {"safe": "There is no tsunami risk from this earthquake.", "warning": "Tsunami information: {warning}."},
        "zh": {"safe": "此次地震没有海啸风险。", "warning": "海啸信息：{warning}。"},
        "zh-TW": {"safe": "此次地震沒有海嘯風險。", "warning": "海嘯資訊：{warning}。"},
        "ko": {"safe": "이 지진으로 인한 쓰나미 위험은 없습니다.", "warning": "쓰나미 정보: {warning}."},
        "vi": {"safe": "Không có nguy cơ sóng thần từ trận động đất này.", "warning": "Thông tin sóng thần: {warning}."},
        "th": {"safe": "ไม่มีความเสี่ยงจากสึนามิจากแผ่นดินไหวครั้งนี้", "warning": "ข้อมูลสึนามิ: {warning}"},
        "id": {"safe": "Tidak ada risiko tsunami dari gempa ini.", "warning": "Informasi tsunami: {warning}."},
        "ms": {"safe": "Tiada risiko tsunami daripada gempa bumi ini.", "warning": "Maklumat tsunami: {warning}."},
        "tl": {"safe": "Walang panganib ng tsunami mula sa lindol na ito.", "warning": "Impormasyon tungkol sa tsunami: {warning}."},
        "fr": {"safe": "Il n'y a pas de risque de tsunami suite à ce séisme.", "warning": "Information tsunami: {warning}."},
        "de": {"safe": "Es besteht keine Tsunami-Gefahr durch dieses Erdbeben.", "warning": "Tsunami-Information: {warning}."},
        "it": {"safe": "Non c'è rischio di tsunami da questo terremoto.", "warning": "Informazioni tsunami: {warning}."},
        "es": {"safe": "No hay riesgo de tsunami por este terremoto.", "warning": "Información de tsunami: {warning}."},
        "ne": {"safe": "यस भूकम्पबाट सुनामीको जोखिम छैन।", "warning": "सुनामी जानकारी: {warning}।"},
        "easy_ja": {"safe": "この じしんで つなみの しんぱいは ありません。", "warning": "つなみ じょうほう: {warning}。"},
    }

    template = templates.get(lang, templates["en"])
    tsunami_template = tsunami_templates.get(lang, tsunami_templates["en"])

    # 津波情報の生成
    if eq.tsunami_warning in ["なし", "None"]:
        tsunami_info = tsunami_template["safe"]
    else:
        tsunami_info = tsunami_template["warning"].format(warning=tsunami_translated)

    return template.format(
        location=location_translated,
        magnitude=eq.magnitude,
        intensity=eq.max_intensity,
        depth=eq.depth,
        tsunami_info=tsunami_info
    )


@app.get("/api/v1/weather/{area_code}", response_model=WeatherInfo)
async def get_weather(area_code: str, lang: str = "ja"):
    """
    指定地域の天気情報を取得

    - **area_code**: 地域コード（例: 130000=東京都）
    - **lang**: 言語コード
    """
    try:
        weather = await jma_service.get_weather_forecast(area_code)

        # 多言語翻訳
        if lang != "ja" and weather:
            weather.text_translated = await translator.translate(
                weather.text, target_lang=lang
            )

        return weather
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/alerts", response_model=list[DisasterAlert])
async def get_alerts(area_code: str = "130000", lang: str = "ja"):
    """
    現在発令中の警報・注意報を取得

    - **area_code**: 地域コード（例: 130000=東京都）
    - **lang**: 言語コード（ja, en, zh, ko, vi, easy_ja）
    """
    try:
        # 警報サービスに多言語翻訳が組み込まれているため直接取得
        alerts = await warning_service.get_warnings(area_code, lang)
        return alerts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/warnings/special", response_model=list[DisasterAlert])
async def get_special_warnings(lang: str = "ja"):
    """
    全国の特別警報を取得

    - **lang**: 言語コード
    """
    try:
        alerts = await warning_service.get_special_warnings()

        if lang != "ja":
            for alert in alerts:
                alert.title_translated = await translator.translate(
                    alert.title, target_lang=lang
                )
                alert.description_translated = await translator.translate(
                    alert.description, target_lang=lang
                )

        return alerts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/translate", response_model=TranslatedMessage)
async def translate_message(text: str, target_lang: str = "en"):
    """
    テキストを指定言語に翻訳

    - **text**: 翻訳するテキスト
    - **target_lang**: 翻訳先言語コード
    """
    try:
        translated = await translator.translate(text, target_lang)
        return TranslatedMessage(
            original=text,
            translated=translated,
            source_lang="ja",
            target_lang=target_lang
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/shelters", response_model=list[ShelterInfo])
async def get_nearby_shelters(
    lat: float,
    lon: float,
    radius: float = 5.0,
    limit: int = 20,
    disaster_type: Optional[str] = None,
    lang: str = "ja"
):
    """
    現在地周辺の避難所を検索

    - **lat**: 緯度
    - **lon**: 経度
    - **radius**: 検索半径（km）
    - **limit**: 取得件数上限
    - **disaster_type**: 災害種別（earthquake, tsunami, flood等）
    - **lang**: 言語コード
    """
    try:
        shelters = shelter_service.get_nearby_shelters(
            lat=lat,
            lon=lon,
            radius_km=radius,
            limit=limit,
            disaster_type=disaster_type
        )

        # 多言語翻訳
        if lang != "ja":
            for shelter in shelters:
                shelter.name_translated = await translator.translate(
                    shelter.name, target_lang=lang
                )

        return shelters
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/shelters/types")
async def get_shelter_disaster_types():
    """対応している災害種別一覧を取得"""
    return shelter_service.get_disaster_types()


@app.get("/api/v1/tsunami", response_model=list[TsunamiInfo])
async def get_tsunami_info(limit: int = 10, lang: str = "ja"):
    """
    津波情報を取得

    - **limit**: 取得件数
    - **lang**: 言語コード
    """
    try:
        tsunamis = await tsunami_service.get_tsunami_list(limit=limit)

        # 多言語翻訳
        if lang != "ja":
            for tsunami in tsunamis:
                tsunami.message_translated = await translator.translate(
                    tsunami.message, target_lang=lang
                )

        return tsunamis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/tsunami/active", response_model=list[TsunamiInfo])
async def get_active_tsunami_warnings(lang: str = "ja"):
    """
    現在発令中の津波警報・注意報を取得

    - **lang**: 言語コード
    """
    try:
        tsunamis = await tsunami_service.get_active_warnings()

        if lang != "ja":
            for tsunami in tsunamis:
                tsunami.message_translated = await translator.translate(
                    tsunami.message, target_lang=lang
                )

        return tsunamis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/volcanoes", response_model=list[VolcanoInfo])
async def get_volcanoes(monitored_only: bool = True):
    """
    火山情報を取得

    - **monitored_only**: 常時観測火山のみ取得（デフォルト: True）
    """
    try:
        if monitored_only:
            return await volcano_service.get_monitored_volcanoes()
        else:
            return await volcano_service.get_volcano_list()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/volcanoes/warnings")
async def get_volcano_warnings(lang: str = "ja"):
    """
    火山警報を取得

    - **lang**: 言語コード
    """
    try:
        warnings = await volcano_service.get_volcano_warnings()
        return warnings
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/volcanoes/{volcano_code}", response_model=VolcanoInfo)
async def get_volcano_by_code(volcano_code: int):
    """
    特定の火山情報を取得

    - **volcano_code**: 火山コード
    """
    try:
        volcano = await volcano_service.get_volcano_by_code(volcano_code)
        if not volcano:
            raise HTTPException(status_code=404, detail="火山が見つかりません")
        return volcano
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 対応言語一覧（15言語 + 日本語）
SUPPORTED_LANGUAGES = {
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


@app.get("/api/v1/languages")
async def get_supported_languages():
    """対応言語一覧を取得"""
    return SUPPORTED_LANGUAGES


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
