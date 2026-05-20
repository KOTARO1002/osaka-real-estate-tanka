from unittest.mock import patch, Mock
import pytest
from scripts.api_client import fetch_quarter, APIError


def make_response(status_code=200, json_data=None):
    mock = Mock()
    mock.status_code = status_code
    mock.json.return_value = json_data or {"status": "OK", "data": []}
    mock.raise_for_status = Mock()
    if status_code >= 400:
        mock.raise_for_status.side_effect = Exception(f"HTTP {status_code}")
    return mock


def test_fetch_quarter_success():
    with patch("scripts.api_client.requests.get") as mock_get:
        mock_get.return_value = make_response(json_data={"data": [{"foo": "bar"}]})
        result = fetch_quarter(2024, 1, "27102", "APIKEY")
        assert result == {"data": [{"foo": "bar"}]}
        mock_get.assert_called_once()
        call = mock_get.call_args
        assert "27102" in str(call)
        assert call.kwargs["headers"]["Ocp-Apim-Subscription-Key"] == "APIKEY"


def test_fetch_quarter_retries_on_failure():
    with patch("scripts.api_client.requests.get") as mock_get, \
         patch("scripts.api_client.time.sleep"):
        mock_get.side_effect = [
            make_response(status_code=500),
            make_response(status_code=500),
            make_response(json_data={"data": []}),
        ]
        result = fetch_quarter(2024, 1, "27102", "APIKEY", max_retries=3)
        assert result == {"data": []}
        assert mock_get.call_count == 3


def test_fetch_quarter_raises_after_max_retries():
    with patch("scripts.api_client.requests.get") as mock_get, \
         patch("scripts.api_client.time.sleep"):
        mock_get.return_value = make_response(status_code=500)
        with pytest.raises(APIError):
            fetch_quarter(2024, 1, "27102", "APIKEY", max_retries=2)
        assert mock_get.call_count == 2
