import time
import requests

from scripts.config import (
    API_BASE_URL,
    MAX_RETRIES,
    REQUEST_TIMEOUT_SEC,
)


class APIError(Exception):
    pass


def fetch_quarter(
    year: int,
    quarter: int,
    city_code: str,
    api_key: str,
    max_retries: int = MAX_RETRIES,
    timeout: int = REQUEST_TIMEOUT_SEC,
) -> dict:
    headers = {"Ocp-Apim-Subscription-Key": api_key}
    params = {"year": year, "quarter": quarter, "city": city_code}

    last_error = None
    for attempt in range(max_retries):
        try:
            response = requests.get(
                API_BASE_URL, headers=headers, params=params, timeout=timeout
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            last_error = e
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)

    raise APIError(
        f"Failed to fetch data for city={city_code}, "
        f"year={year}, quarter={quarter} after {max_retries} attempts: {last_error}"
    )
