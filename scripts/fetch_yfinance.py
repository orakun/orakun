"""
yfinance ile BIST hisse senetlerinin fiyat geçmişini çeker.
Veritabanındaki STOCK tipindeki varlıklar için çalışır.

Çalıştırma: python fetch_yfinance.py [--incremental]
"""
import os
import sys
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).parent.parent
DB_PATH = ROOT / "data" / "portfolio.db"


def main():
    try:
        import yfinance as yf
    except ImportError:
        print("yfinance kurulu değil: pip install yfinance")
        return

    incremental = "--incremental" in sys.argv
    start = (datetime.now() - timedelta(days=14 if incremental else 365 * 10)).strftime("%Y-%m-%d")

    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL")

    cur = conn.execute("SELECT id, symbol FROM Asset WHERE type = 'STOCK'")
    stocks = cur.fetchall()

    if not stocks:
        print("Veritabanında STOCK türünde varlık bulunamadı.")
        conn.close()
        return

    for asset_id, symbol in stocks:
        ticker_symbol = symbol if symbol.endswith(".IS") else f"{symbol}.IS"
        try:
            ticker = yf.Ticker(ticker_symbol)
            hist = ticker.history(start=start, auto_adjust=True)

            if hist.empty:
                print(f"{ticker_symbol}: Veri bulunamadı")
                continue

            count = 0
            for date_idx, row in hist.iterrows():
                iso = date_idx.strftime("%Y-%m-%dT00:00:00.000Z")
                price = float(row["Close"])
                conn.execute(
                    """
                    INSERT INTO PriceHistory (assetId, date, priceTry)
                    VALUES (?, ?, ?)
                    ON CONFLICT(assetId, date) DO UPDATE SET priceTry = excluded.priceTry
                    """,
                    (asset_id, iso, str(price)),
                )
                count += 1
            conn.commit()
            print(f"{ticker_symbol}: {count} kayıt güncellendi")
        except Exception as e:
            print(f"{ticker_symbol}: HATA — {e}")

    conn.close()


if __name__ == "__main__":
    main()
