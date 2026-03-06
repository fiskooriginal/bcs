"""Test script for real-time log streaming"""
import time
import sys

print("Starting real-time log test...")
time.sleep(1)

print("Log message 1: System check started")
time.sleep(1)

print("Log message 2: Checking configuration...")
time.sleep(1)

print("Log message 3: Loading modules...")
time.sleep(1)

print("Log message 4: Connecting to services...")
time.sleep(1)

print("Log message 5: Processing data...")
time.sleep(1)

print("WARNING: This is a warning message", file=sys.stderr)
time.sleep(1)

print("Log message 6: Finalizing...")
time.sleep(1)

print("Real-time log test completed successfully!")
