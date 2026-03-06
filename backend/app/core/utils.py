from datetime import datetime, timezone


def utc_now() -> datetime:
    """
    Возвращает текущее время в UTC как naive datetime (без timezone info).
    Используется для совместимости с PostgreSQL TIMESTAMP WITHOUT TIME ZONE.
    """
    return datetime.now(timezone.utc).replace(tzinfo=None)


def to_naive_utc(dt: datetime) -> datetime:
    """
    Преобразует offset-aware datetime в naive datetime в UTC.
    
    Args:
        dt: datetime объект (может быть aware или naive)
    
    Returns:
        Naive datetime в UTC
    """
    if dt.tzinfo is None:
        return dt
    
    return dt.astimezone(timezone.utc).replace(tzinfo=None)


def to_aware_utc(dt: datetime) -> datetime:
    """
    Преобразует naive datetime в offset-aware datetime в UTC.
    
    Args:
        dt: datetime объект (может быть aware или naive)
    
    Returns:
        Offset-aware datetime в UTC
    """
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc)
    
    return dt.replace(tzinfo=timezone.utc)
