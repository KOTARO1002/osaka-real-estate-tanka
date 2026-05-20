from datetime import datetime

AGE_BINS = [(0, 9), (10, 19), (20, 29), (30, 39), (40, 49)]

AREA_BINS = [(50, 59), (60, 69), (70, 79), (80, 89), (90, 99), (100, 120)]

START_YEAR = 2021

API_BASE_URL = "https://www.reinfolib.mlit.go.jp/ex-api/external/XIT001"

REQUEST_INTERVAL_SEC = 0.3
MAX_RETRIES = 3
REQUEST_TIMEOUT_SEC = 30

TARGET_TYPE = "中古マンション等"
TARGET_PRICE_CATEGORY = "成約価格情報"


def current_year() -> int:
    return datetime.now().year


def list_year_quarters(start_year: int, end_year: int, end_quarter: int):
    """Return [(year, quarter), ...] from (start_year, Q1) to (end_year, end_quarter)."""
    result = []
    for year in range(start_year, end_year + 1):
        last_q = 4 if year < end_year else end_quarter
        for q in range(1, last_q + 1):
            result.append((year, q))
    return result
