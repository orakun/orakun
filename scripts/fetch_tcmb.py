"""
TCMB EVDS API'den USD/TRY, EUR/TRY, Gram Altın ve TÜFE verisi çeker.
Çalıştırma: python fetch_tcmb.py [--incremental]

TCMB EVDS API key almak için:
  1. https://evds2.tcmb.gov.tr adresine gidin
  2. Üye Ol / Kayıt Ol
  3. Profil > API Key'i kopyalayın
  4. .env.local dosyasına TCMB_API_KEY=<key> olarak ekleyin
"""
import os
import sys
import sqlite3
import requests
from datetime import datetime, timedelta
from pathlib import Path
from dotenv import load_dotenv

ROOT = Path(__file__).parent.parent
load_dotenv(ROOT / ".env.local")

DB_PATH = ROOT / "data" / "portfolio.db"
TCMB_API_KEY = os.environ.get("TCMB_API_KEY", "")
BASE_URL = "https://evds2.tcmb.gov.tr/service/evds"

# TCMB EVDS seri kodları
PRICE_SERIES = {
    "USD":        ("TP.DK.USD.A.YTL", "USD",        "ABD Doları",   "CURRENCY"),
    "EUR":        ("TP.DK.EUR.A.YTL", "EUR",        "Euro",         "CURRENCY"),
    "GRAM_ALTIN": ("TP.ALTIN.TL.GRAM.A", "GRAM_ALTIN", "Gram Altın", "GOLD"),
}
CPI_SERIES = "TP.FG.J0"


def fetch_series(series_code: str, start: str, end: str, frequency: int = 5) -> list[dict]:
    if not TCMB_API_KEY:
        print("UYARI: TCMB_API_KEY ayarlanmamış — veri çekilemiyor.")
        return []
    # TCMB EVDS API: series is part of the path, not a query param
    url = (
        f"{BASE_URL}/series={series_code}"
        f"&startDate={start}"
        f"&endDate={end}"
        f"&type=json"
        f"&key={TCMB_API_KEY}"
        f"&frequency={frequency}"
    )
    r = requests.get(url, timeout=30)
    r.raise_for_status()
    return r.json().get("items", [])


def ensure_asset(conn: sqlite3.Connection, symbol: str, display_name: str, asset_type: str) -> int:
    cur = conn.execute("SELECT id FROM Asset WHERE symbol = ?", (symbol,))
    row = cur.fetchone()
    if row:
        return row[0]
    cur = conn.execute(
        "INSERT INTO Asset (symbol, displayName, type) VALUES (?, ?, ?)",
        (symbol, display_name, asset_type),
    )
    conn.commit()
    return cur.lastrowid


def upsert_price(conn: sqlite3.Connection, asset_id: int, date_str: str, price: float):
    # TCMB tarihleri DD-MM-YYYY formatında gelir
    d = datetime.strptime(date_str, "%d-%m-%Y")
    iso = d.strftime("%Y-%m-%dT00:00:00.000Z")
    conn.execute(
        """
        INSERT INTO PriceHistory (assetId, date, priceTry)
        VALUES (?, ?, ?)
        ON CONFLICT(assetId, date) DO UPDATE SET priceTry = excluded.priceTry
        """,
        (asset_id, iso, str(price)),
    )


def upsert_cpi(conn: sqlite3.Connection, year: int, month: int, cpi: float):
    conn.execute(
        """
        INSERT INTO InflationMonthly (year, month, cpiIndex)
        VALUES (?, ?, ?)
        ON CONFLICT(year, month) DO UPDATE SET cpiIndex = excluded.cpiIndex
        """,
        (year, month, str(cpi)),
    )


def main():
    incremental = "--incremental" in sys.argv
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL")

    if incremental:
        start = (datetime.now() - timedelta(days=14)).strftime("%d-%m-%Y")
    else:
        start = (datetime.now() - timedelta(days=365 * 10)).strftime("%d-%m-%Y")
    end = datetime.now().strftime("%d-%m-%Y")

    # Fiyat serileri
    for key, (series_code, symbol, display_name, asset_type) in PRICE_SERIES.items():
        asset_id = ensure_asset(conn, symbol, display_name, asset_type)
        items = fetch_series(series_code, start, end, frequency=5)

        # Alan adı: nokta yerine alt çizgi (TP.DK.USD.A.YTL → TP_DK_USD_A_YTL)
        field = series_code.replace(".", "_")
        count = 0
        for item in items:
            val = item.get(field)
            if val and val != "ND":
                try:
                    upsert_price(conn, asset_id, item["Tarih"], float(val))
                    count += 1
                except (ValueError, KeyError):
                    pass
        conn.commit()
        print(f"{symbol}: {count} kayıt güncellendi")

    # TÜFE (aylık)
    cpi_items = fetch_series(CPI_SERIES, start, end, frequency=6)
    cpi_field = CPI_SERIES.replace(".", "_")
    cpi_count = 0
    for item in cpi_items:
        tarih = item.get("Tarih", "")  # YYYY-MM formatında gelir
        val = item.get(cpi_field)
        if val and val != "ND" and len(tarih) >= 7:
            try:
                year, month = int(tarih[:4]), int(tarih[5:7])
                upsert_cpi(conn, year, month, float(val))
                cpi_count += 1
            except (ValueError, IndexError):
                pass
    conn.commit()
    print(f"TÜFE: {cpi_count} kayıt güncellendi")
    conn.close()


if __name__ == "__main__":
    main()
