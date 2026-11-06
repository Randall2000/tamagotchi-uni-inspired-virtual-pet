#!/usr/bin/env python3
"""Headless end-to-end Momo motion QA on an isolated local preview port."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json,time
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"output"/"playwright"
OUT.mkdir(parents=True,exist_ok=True)
url="http://127.0.0.1:4199"
with sync_playwright() as p:
    browser=p.chromium.launch(channel="chrome",headless=True)
    page=browser.new_page(viewport={"width":700,"height":900},device_scale_factor=1)
    errors=[]
    page.on("pageerror",lambda e: errors.append(str(e)))
    page.on("response",lambda r: errors.append(str(r.status)+" "+r.url) if r.status>=400 else None)
    page.goto(url,wait_until="networkidle")
    page.wait_for_timeout(250)
    print("initial",page.locator("#screen").get_attribute("data-frame"),page.locator("#room-scene").get_attribute("data-growth"))
    assert page.locator("#screen").get_attribute("data-frame").startswith("idle-")
    assert not errors,errors
    page.keyboard.press("b")
    page.wait_for_timeout(400)
    print("feed",page.locator("#screen").get_attribute("data-frame"))
    assert page.locator("#screen").get_attribute("data-frame").startswith("eat-")
    page.screenshot(path=str(OUT/"momo-eat-live.png"),animations="disabled")
    page.keyboard.press("c")
    page.wait_for_timeout(600)
    assert page.locator("#room-scene").get_attribute("data-action") == "idle"
    # Standard 3-key navigation to main menu and drink
    for _ in range(5):
        page.keyboard.press("a")
        page.wait_for_timeout(150)
    page.keyboard.press("b")
    page.wait_for_timeout(200)
    assert page.locator("#device-menu").get_attribute("data-screen") == "main"
    for _ in range(2):
        page.keyboard.press("a")
        page.wait_for_timeout(150)
    page.keyboard.press("b")
    page.wait_for_timeout(300)
    print("drink",page.locator("#screen").get_attribute("data-frame"))
    assert page.locator("#screen").get_attribute("data-frame").startswith("drink-")
    page.keyboard.press("c")
    page.wait_for_timeout(550)
    # Runtime growth swap uses adult sheet, no resize/morph between frame images.
    page.evaluate("""() => {
        const x=JSON.parse(localStorage.getItem('tower-pet-save-v1'));
        x.bond=90; x.stageFloor='adult'; x.hunger=50; x.sleeping=false; localStorage.setItem('tower-pet-save-v1',JSON.stringify(x));
    }""")
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(250)
    assert page.locator("#room-scene").get_attribute("data-growth") == "adult"
    assert page.locator("#pet-atlas").evaluate("(el) => getComputedStyle(el).backgroundImage").find("/adult/idle.png")>=0
    print("adult",page.locator("#pet-atlas").evaluate("(el) => getComputedStyle(el).backgroundImage"))
    page.screenshot(path=str(OUT/"momo-adult-live.png"),animations="disabled")
    # Idle to sleep: direct keys only, no interaction via the display.
    for _ in range(5):
        page.keyboard.press("a")
        page.wait_for_timeout(150)
    page.keyboard.press("b")
    page.wait_for_timeout(180)
    page.keyboard.press("b")
    page.wait_for_timeout(2450)
    print("sleeping",page.locator("#screen").get_attribute("data-frame"))
    assert page.locator("#screen").get_attribute("data-frame").startswith("sleep-")
    page.keyboard.press("c")
    page.wait_for_timeout(200)
    print("waking",page.locator("#screen").get_attribute("data-frame"))
    assert page.locator("#screen").get_attribute("data-frame").startswith("wake-")
    assert not errors,errors
    print("BROWSER_QA_PASS")
    browser.close()
