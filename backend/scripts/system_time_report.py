#!/usr/bin/env python3
import asyncio
import time
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import aiofiles

REPORT_TIMEZONES = ["UTC", "Europe/Moscow", "America/New_York", "Asia/Tokyo", "Europe/London"]


async def get_current_time_in_timezone(tz_name: str) -> dict[str, any]:
    """
    Асинхронно получает текущее время в указанной временной зоне.
    """
    try:
        await asyncio.sleep(0)

        tz = ZoneInfo(tz_name)
        now = datetime.now(tz)

        return {
            "timezone": tz_name,
            "datetime": now,
            "formatted_time": now.strftime("%Y-%m-%d %H:%M:%S"),
            "formatted_date": now.strftime("%A, %B %d, %Y"),
            "utc_offset": now.strftime("%z"),
            "is_dst": bool(now.dst()),
            "error": None,
        }
    except Exception as e:
        return {
            "timezone": tz_name,
            "datetime": None,
            "formatted_time": None,
            "formatted_date": None,
            "utc_offset": None,
            "is_dst": None,
            "error": str(e),
        }


async def get_system_uptime_info() -> dict[str, any]:
    """
    Асинхронно получает информацию о времени работы системы (если доступно).
    """
    try:
        async with aiofiles.open("/proc/uptime", "r") as f:
            content = await f.readline()
            uptime_seconds = float(content.split()[0])

        uptime_delta = timedelta(seconds=uptime_seconds)
        days = uptime_delta.days
        hours, remainder = divmod(uptime_delta.seconds, 3600)
        minutes, seconds = divmod(remainder, 60)

        return {
            "uptime_seconds": int(uptime_seconds),
            "uptime_formatted": f"{days}d {hours}h {minutes}m {seconds}s",
            "days": days,
            "hours": hours,
            "minutes": minutes,
            "error": None,
        }
    except Exception as e:
        return {
            "uptime_seconds": None,
            "uptime_formatted": "Not available",
            "days": None,
            "hours": None,
            "minutes": None,
            "error": str(e),
        }


async def calculate_time_until_midnight(tz_name: str = "UTC") -> dict[str, any]:
    """
    Асинхронно вычисляет время до полуночи в указанной временной зоне.
    """
    try:
        await asyncio.sleep(0)

        tz = ZoneInfo(tz_name)
        now = datetime.now(tz)

        midnight = now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
        time_until = midnight - now

        hours, remainder = divmod(time_until.seconds, 3600)
        minutes, seconds = divmod(remainder, 60)

        return {
            "timezone": tz_name,
            "hours": hours,
            "minutes": minutes,
            "seconds": seconds,
            "formatted": f"{hours}h {minutes}m {seconds}s",
            "error": None,
        }
    except Exception as e:
        return {
            "timezone": tz_name,
            "hours": None,
            "minutes": None,
            "seconds": None,
            "formatted": "Error",
            "error": str(e),
        }


async def main():
    """
    Основная асинхронная функция генерации отчета о системном времени.
    """
    print("=" * 80)
    print(f"System Time Report - Generated at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)
    print()

    print("📅 CURRENT TIME IN MULTIPLE TIMEZONES")
    print("-" * 80)

    timezone_tasks = [get_current_time_in_timezone(tz_name) for tz_name in REPORT_TIMEZONES]
    timezone_data = await asyncio.gather(*timezone_tasks)

    for tz_info in timezone_data:
        if tz_info["error"]:
            print(f"✗ {tz_info['timezone']}: Error - {tz_info['error']}")
        else:
            dst_marker = " (DST)" if tz_info["is_dst"] else ""
            print(f"  {tz_info['timezone']:20s} | {tz_info['formatted_time']} | UTC{tz_info['utc_offset']}{dst_marker}")

    print()
    print("🕐 TIME UNTIL MIDNIGHT")
    print("-" * 80)

    midnight_tasks = [calculate_time_until_midnight(tz_name) for tz_name in ["UTC", "Europe/Moscow"]]
    midnight_results = await asyncio.gather(*midnight_tasks)

    for midnight_info in midnight_results:
        if midnight_info["error"]:
            print(f"✗ {midnight_info['timezone']}: Error - {midnight_info['error']}")
        else:
            print(f"  {midnight_info['timezone']:20s} | {midnight_info['formatted']} remaining")

    print()
    print("⏱️  SYSTEM UPTIME")
    print("-" * 80)

    uptime_info = await get_system_uptime_info()
    if uptime_info["error"]:
        print(f"  Uptime information not available (Error: {uptime_info['error']})")
        print(f"  Note: Running in container or non-Linux environment")
    else:
        print(f"  System has been running for: {uptime_info['uptime_formatted']}")

        if uptime_info["days"] > 30:
            print(f"  🎉 Impressive! System has been up for over 30 days!")
        elif uptime_info["days"] > 7:
            print(f"  ✓ System has been stable for over a week")

    print()
    print("📊 REPORT STATISTICS")
    print("-" * 80)

    successful_tz = sum(1 for tz in timezone_data if tz["error"] is None)
    print(f"  Timezones reported: {successful_tz}/{len(REPORT_TIMEZONES)}")

    utc_time = next((tz for tz in timezone_data if tz["timezone"] == "UTC"), None)
    if utc_time and utc_time["datetime"]:
        unix_timestamp = int(utc_time["datetime"].timestamp())
        print(f"  Unix timestamp: {unix_timestamp}")

    print(f"  Report generation time: {time.time()}")

    print()
    print("=" * 80)
    print("System time report completed successfully")
    print("=" * 80)


if __name__ == "__main__":
    asyncio.run(main())
