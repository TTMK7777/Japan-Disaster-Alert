"""
エラーハンドリングユーティリティ

統一されたエラーハンドリングを提供するデコレータを定義します。
すべてのエンドポイントで一貫したエラー処理を実現します。
"""
import os
from functools import wraps
from fastapi import HTTPException
from typing import Callable, Any

from ..exceptions import DisasterAlertError, APIError
from ..config import settings
from .logger import get_logger

logger = get_logger(__name__)


def handle_errors(func: Callable) -> Callable:
    """
    エラーハンドリングデコレータ
    
    エンドポイント関数に適用することで、統一されたエラーハンドリングを提供します。
    
    Usage:
        @app.get("/api/v1/example")
        @handle_errors
        async def example_endpoint():
            # 処理
            pass
    """
    @wraps(func)
    async def wrapper(*args: Any, **kwargs: Any) -> Any:
        try:
            return await func(*args, **kwargs)
        except HTTPException:
            # FastAPIのHTTPExceptionはそのまま再発生
            raise
        except DisasterAlertError as e:
            # カスタム例外は適切に処理
            is_production = settings.environment == "production"
            logger.error(f"カスタムエラー発生: {str(e)}", exc_info=True)
            
            if isinstance(e, APIError):
                raise HTTPException(
                    status_code=e.status_code,
                    detail=e.message if not is_production else "内部サーバーエラーが発生しました"
                )
            else:
                raise HTTPException(
                    status_code=500,
                    detail=str(e) if not is_production else "内部サーバーエラーが発生しました"
                )
        except Exception as e:
            # その他の例外
            is_production = settings.environment == "production"
            logger.error(f"エラー発生: {str(e)}", exc_info=True)
            
            raise HTTPException(
                status_code=500,
                detail=str(e) if not is_production else "内部サーバーエラーが発生しました"
            )
    
    return wrapper

