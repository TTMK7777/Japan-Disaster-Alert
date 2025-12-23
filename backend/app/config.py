"""
アプリケーション設定

環境変数から設定を読み込み、アプリケーション全体で使用する設定を管理します。
.envファイルまたは環境変数で設定をオーバーライドできます。
"""
import os
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """アプリケーション設定"""
    
    # 環境設定
    environment: str = os.getenv("ENVIRONMENT", "development")
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    
    # API設定
    api_timeout: float = float(os.getenv("API_TIMEOUT", "10.0"))
    
    # 気象庁API
    jma_base_url: str = "https://www.jma.go.jp/bosai"
    
    # P2P地震情報API
    p2p_base_url: str = "https://api.p2pquake.net/v2"
    
    # Claude API
    anthropic_api_key: Optional[str] = os.getenv("ANTHROPIC_API_KEY")
    anthropic_api_version: str = "2023-06-01"
    anthropic_model: str = "claude-3-haiku-20240307"

    # Gemini API
    gemini_api_key: Optional[str] = os.getenv("GEMINI_API_KEY")
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-exp")

    # 使用するAIプロバイダー（claude, gemini, auto）
    # auto: Gemini優先、なければClaude
    ai_provider: str = os.getenv("AI_PROVIDER", "auto")
    
    # CORS設定
    allowed_origins: str = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://localhost:3001,http://localhost:8000"
    )
    
    # キャッシュ設定
    cache_dir: Path = Path(__file__).parent.parent / "data"
    translation_cache_file: Path = Path(__file__).parent.parent / "data" / "translation_cache.json"
    shelter_data_dir: Path = Path(__file__).parent.parent / "data" / "shelters"
    
    # サーバー設定
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "8000"))
    reload: bool = os.getenv("ENVIRONMENT") != "production"
    timeout_keep_alive: int = 30
    limit_concurrency: int = 100
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# グローバル設定インスタンス
settings = Settings()

