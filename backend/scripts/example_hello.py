#!/usr/bin/env python3
import time
from datetime import datetime


def main():
    print(f"[{datetime.now().isoformat()}] Hello from BCS Script Scheduler!")
    print("This is an example script.")

    print("Performing some work...")
    time.sleep(2)

    print("Work completed successfully!")
    print(f"[{datetime.now().isoformat()}] Script finished.")


if __name__ == "__main__":
    main()
