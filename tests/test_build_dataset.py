from unittest.mock import patch
from scripts.build_dataset import build_dataset

SAMPLE_CITIES = [
    {"name": "都島区", "code": "27102"},
    {"name": "福島区", "code": "27103"},
]


def fake_fetch(year, quarter, city_code, api_key):
    return {
        "data": [
            {
                "PriceCategory": "成約価格情報",
                "Type": "中古マンション等",
                "TradePrice": "60000000",
                "Area": "65",
                "BuildingYear": "2010年",
            }
        ]
    }


def test_build_dataset_structure():
    with patch("scripts.build_dataset.fetch_quarter", side_effect=fake_fetch), \
         patch("scripts.build_dataset.time.sleep"):
        result = build_dataset(
            cities=SAMPLE_CITIES,
            year_quarters=[(2024, 1), (2024, 2)],
            age_bins=[(0, 9), (10, 19)],
            area_bins=[(50, 59), (60, 69)],
            api_key="APIKEY",
            current_year=2026,
        )
    assert "meta" in result
    assert "cities" in result
    assert "data" in result
    assert result["cities"] == SAMPLE_CITIES
    assert "27102" in result["data"]
    assert "2024Q1" in result["data"]["27102"]
    assert "10-19" in result["data"]["27102"]["2024Q1"]
    assert "60-69" in result["data"]["27102"]["2024Q1"]["10-19"]
    bucket = result["data"]["27102"]["2024Q1"]["10-19"]["60-69"]
    assert bucket["avg"] == int(60_000_000 / 65)
    assert bucket["n"] == 1


def test_build_dataset_meta_fields():
    with patch("scripts.build_dataset.fetch_quarter", side_effect=fake_fetch), \
         patch("scripts.build_dataset.time.sleep"):
        result = build_dataset(
            cities=SAMPLE_CITIES,
            year_quarters=[(2024, 1)],
            age_bins=[(0, 9), (10, 19)],
            area_bins=[(50, 59), (60, 69)],
            api_key="APIKEY",
            current_year=2026,
        )
    meta = result["meta"]
    assert "generated_at" in meta
    assert meta["year_quarter_range"] == ["2024Q1", "2024Q1"]
    assert meta["age_bins"] == [[0, 9], [10, 19]]
    assert meta["area_bins"] == [[50, 59], [60, 69]]


def test_build_dataset_handles_api_error():
    call_count = {"n": 0}

    def flaky_fetch(year, quarter, city_code, api_key):
        call_count["n"] += 1
        if city_code == "27103":
            from scripts.api_client import APIError
            raise APIError("simulated")
        return fake_fetch(year, quarter, city_code, api_key)

    with patch("scripts.build_dataset.fetch_quarter", side_effect=flaky_fetch), \
         patch("scripts.build_dataset.time.sleep"):
        result = build_dataset(
            cities=SAMPLE_CITIES,
            year_quarters=[(2024, 1)],
            age_bins=[(0, 9), (10, 19)],
            area_bins=[(50, 59), (60, 69)],
            api_key="APIKEY",
            current_year=2026,
        )
    assert "27102" in result["data"]
    assert "27103" not in result["data"]
