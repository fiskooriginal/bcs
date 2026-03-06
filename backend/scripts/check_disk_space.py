#!/usr/bin/env python3
import asyncio
import os
import shutil
from datetime import datetime
from typing import Dict

THRESHOLD_WARNING_PERCENT = 75
THRESHOLD_CRITICAL_PERCENT = 90


async def get_disk_usage(path: str = "/") -> Dict[str, any]:
    """
    Асинхронно получает информацию об использовании дискового пространства.
    """
    try:
        loop = asyncio.get_event_loop()
        total, used, free = await loop.run_in_executor(None, shutil.disk_usage, path)

        total_gb = total / (1024**3)
        used_gb = used / (1024**3)
        free_gb = free / (1024**3)
        used_percent = (used / total) * 100

        return {
            "path": path,
            "total_gb": round(total_gb, 2),
            "used_gb": round(used_gb, 2),
            "free_gb": round(free_gb, 2),
            "used_percent": round(used_percent, 2),
            "status": get_status(used_percent),
            "error": None,
        }
    except Exception as e:
        return {
            "path": path,
            "total_gb": None,
            "used_gb": None,
            "free_gb": None,
            "used_percent": None,
            "status": "ERROR",
            "error": str(e),
        }


def get_status(used_percent: float) -> str:
    """
    Определяет статус на основе процента использования диска.
    """
    if used_percent >= THRESHOLD_CRITICAL_PERCENT:
        return "CRITICAL"
    elif used_percent >= THRESHOLD_WARNING_PERCENT:
        return "WARNING"
    else:
        return "OK"


def get_status_icon(status: str) -> str:
    """
    Возвращает иконку для статуса.
    """
    icons = {"OK": "✓", "WARNING": "⚠️", "CRITICAL": "🚨", "ERROR": "✗"}
    return icons.get(status, "?")


def format_progress_bar(percent: float, width: int = 40) -> str:
    """
    Создает текстовый прогресс-бар.
    """
    filled = int(width * percent / 100)
    bar = "█" * filled + "░" * (width - filled)
    return f"[{bar}] {percent:.1f}%"


async def check_path_exists(path: str) -> bool:
    """
    Асинхронно проверяет существование пути.
    """
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, os.path.exists, path)


async def main():
    """
    Основная асинхронная функция скрипта проверки дискового пространства.
    """
    print("=" * 80)
    print(f"Disk Space Monitor - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)
    print()

    paths_to_check = ["/"]

    if await check_path_exists("/data"):
        paths_to_check.append("/data")

    tasks = [get_disk_usage(path) for path in paths_to_check]
    results = await asyncio.gather(*tasks)

    for result in results:
        print(f"Checking disk space for: {result['path']}")
        print("-" * 80)

        if result["error"]:
            print(f"{get_status_icon('ERROR')} Error: {result['error']}")
        else:
            print(f"Status: {get_status_icon(result['status'])} {result['status']}")
            print()
            print(f"Total Space:  {result['total_gb']:.2f} GB")
            print(f"Used Space:   {result['used_gb']:.2f} GB")
            print(f"Free Space:   {result['free_gb']:.2f} GB")
            print()
            print(f"Usage: {format_progress_bar(result['used_percent'])}")
            print()

            if result["status"] == "CRITICAL":
                print(f"🚨 CRITICAL: Disk usage is at {result['used_percent']:.1f}%!")
                print(f"   Only {result['free_gb']:.2f} GB remaining. Immediate action required!")
            elif result["status"] == "WARNING":
                print(f"⚠️  WARNING: Disk usage is at {result['used_percent']:.1f}%")
                print(f"   {result['free_gb']:.2f} GB remaining. Consider cleaning up space.")
            else:
                print(f"✓ Disk space is healthy ({result['free_gb']:.2f} GB free)")

        print()

    print("=" * 80)
    print("Summary")
    print("=" * 80)

    critical_count = sum(1 for r in results if r["status"] == "CRITICAL")
    warning_count = sum(1 for r in results if r["status"] == "WARNING")
    ok_count = sum(1 for r in results if r["status"] == "OK")

    print(f"Checked {len(results)} path(s):")
    print(f"  ✓ OK: {ok_count}")
    print(f"  ⚠️  WARNING: {warning_count}")
    print(f"  🚨 CRITICAL: {critical_count}")

    if critical_count > 0:
        print("\n⚠️  Action required: Critical disk space issues detected!")
    elif warning_count > 0:
        print("\n⚠️  Attention: Some disks are running low on space")
    else:
        print("\n✓ All monitored disks have sufficient space")

    print("=" * 80)
    print("Disk space check completed")
    print("=" * 80)


if __name__ == "__main__":
    asyncio.run(main())
