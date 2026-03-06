#!/usr/bin/env python3
import asyncio
import time
from datetime import datetime
from typing import Dict

import aiohttp

MONITORED_DOMAINS = ["https://www.google.com", "https://www.github.com", "https://www.python.org"]

TIMEOUT_SECONDS = 5


async def check_domain_availability(session: aiohttp.ClientSession, url: str) -> Dict[str, any]:
    """
    Асинхронно проверяет доступность домена и возвращает результаты проверки.
    """
    try:
        start_time = time.time()
        timeout = aiohttp.ClientTimeout(total=TIMEOUT_SECONDS)

        async with session.get(url, timeout=timeout) as response:
            response_time = round((time.time() - start_time) * 1000, 2)

            return {
                "url": url,
                "status_code": response.status,
                "response_time_ms": response_time,
                "is_available": response.status < 500,
                "error": None,
            }
    except asyncio.TimeoutError:
        return {"url": url, "status_code": None, "response_time_ms": None, "is_available": False, "error": "Timeout"}
    except aiohttp.ClientConnectionError:
        return {
            "url": url,
            "status_code": None,
            "response_time_ms": None,
            "is_available": False,
            "error": "Connection Error",
        }
    except Exception as e:
        return {"url": url, "status_code": None, "response_time_ms": None, "is_available": False, "error": str(e)}


def format_result_log(result: Dict[str, any]) -> str:
    """
    Форматирует результат проверки для вывода в лог.
    """
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    if result["is_available"]:
        status = "✓ AVAILABLE"
        details = f"Status: {result['status_code']}, Response time: {result['response_time_ms']}ms"
    else:
        status = "✗ UNAVAILABLE"
        details = f"Error: {result['error']}"

    return f"[{timestamp}] {status} | {result['url']} | {details}"


async def main():
    """
    Основная асинхронная функция скрипта мониторинга доступности ресурсов.
    """
    print("=" * 80)
    print(f"Resource Availability Monitor - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)
    print(f"Monitoring {len(MONITORED_DOMAINS)} domains...")
    print()

    async with aiohttp.ClientSession() as session:
        tasks = [check_domain_availability(session, domain) for domain in MONITORED_DOMAINS]
        results = await asyncio.gather(*tasks)

        for result in results:
            print(format_result_log(result))
            await asyncio.sleep(0.1)

    print()
    print("-" * 80)

    available_count = sum(1 for r in results if r["is_available"])
    unavailable_count = len(results) - available_count

    print(f"Summary: {available_count} available, {unavailable_count} unavailable")

    if unavailable_count > 0:
        print("\n⚠️  Warning: Some resources are unavailable!")
        for result in results:
            if not result["is_available"]:
                print(f"  - {result['url']}: {result['error']}")
    else:
        print("\n✓ All monitored resources are available")

    print("=" * 80)
    print("Monitoring cycle completed")
    print("=" * 80)


if __name__ == "__main__":
    asyncio.run(main())
