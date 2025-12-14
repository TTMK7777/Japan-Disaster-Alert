"""
データモデル定義
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class HealthResponse(BaseModel):
    """ヘルスチェックレスポンス"""
    status: str
    service: str
    version: str
    timestamp: str


class EarthquakeInfo(BaseModel):
    """地震情報"""
    id: str
    time: str
    location: str
    location_translated: Optional[str] = None
    magnitude: float
    max_intensity: str  # 最大震度
    max_intensity_translated: Optional[str] = None
    depth: int  # 震源の深さ（km）
    latitude: float
    longitude: float
    tsunami_warning: str  # 津波警報の有無
    tsunami_warning_translated: Optional[str] = None
    message: str
    message_translated: Optional[str] = None
    source: str = "気象庁"


class WeatherInfo(BaseModel):
    """天気情報"""
    area: str
    area_code: str
    publishing_office: str
    report_datetime: str
    headline: Optional[str] = None
    text: str
    text_translated: Optional[str] = None


class DisasterAlert(BaseModel):
    """災害警報・注意報"""
    id: str
    type: str  # warning, advisory, etc.
    title: str
    title_translated: Optional[str] = None
    description: str
    description_translated: Optional[str] = None
    area: str
    issued_at: str
    expires_at: Optional[str] = None
    severity: str  # low, medium, high, extreme


class TranslatedMessage(BaseModel):
    """翻訳結果"""
    original: str
    translated: str
    source_lang: str
    target_lang: str


class ShelterInfo(BaseModel):
    """避難所情報"""
    id: str
    name: str
    name_translated: Optional[str] = None
    address: str
    latitude: float
    longitude: float
    distance: Optional[float] = None  # 現在地からの距離（km）
    capacity: Optional[int] = None
    current_occupancy: Optional[int] = None
    facilities: list[str] = []  # バリアフリー、ペット可、等
    is_open: bool = True
    phone: Optional[str] = None
    types: list[str] = []  # 地震、津波、洪水、等


class UserLocation(BaseModel):
    """ユーザー位置情報"""
    latitude: float
    longitude: float
    accuracy: Optional[float] = None
    timestamp: Optional[str] = None


class NotificationPreference(BaseModel):
    """通知設定"""
    user_id: str
    language: str = "ja"
    earthquake_threshold: int = 3  # この震度以上で通知
    weather_alerts: bool = True
    tsunami_alerts: bool = True
    areas: list[str] = []  # 監視対象地域
