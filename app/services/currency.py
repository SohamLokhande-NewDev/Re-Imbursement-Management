import requests

def convert_currency(amount: float, from_currency: str, to_currency: str) -> float:
    """Fetch live exchange rates and convert amount."""
    if from_currency.upper() == to_currency.upper():
        return amount
    try:
        url = f"https://api.exchangerate-api.com/v4/latest/{from_currency.upper()}"
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()
        rate = data["rates"].get(to_currency.upper())
        if rate is None:
            raise ValueError(f"Currency {to_currency} not found in exchange rates")
        return round(amount * rate, 2)
    except Exception as e:
        print(f"Currency conversion error: {str(e)}")
        return amount  # Return original amount as fallback
