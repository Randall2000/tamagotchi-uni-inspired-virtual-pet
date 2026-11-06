#!/usr/bin/env python3
"""Verify deployed kitten assets byte-for-byte via the real Chrome network stack."""
import hashlib
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
URL=os.environ.get('PET_URL','https://tamagotchi-uni-inspired-virtual-pet.vercel.app/')
FILES=[
    'public/assets/momo-kitten-64-v3.png',
    'public/assets/momo-motions-preview/kitten/idle.png',
    'public/assets/momo-motions-preview/kitten/eat.png',
    'public/assets/qa/momo-kitten-eye-acceptance-v0103.png',
]
with sync_playwright() as pw:
    browser=pw.chromium.launch(channel='chrome',headless=True)
    page=browser.new_page()
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(URL,wait_until='networkidle')
    assert page.locator('html').get_attribute('data-version')=='0.10.3','old deployed HTML'
    for path in FILES:
        result=page.evaluate("""async (path) => {
            const response=await fetch('/'+path,{cache:'reload'});
            if(!response.ok) throw new Error('Asset HTTP '+response.status+': '+path);
            const hash=await crypto.subtle.digest('SHA-256',await response.arrayBuffer());
            return Array.from(new Uint8Array(hash),x=>x.toString(16).padStart(2,'0')).join('');
        }""",path)
        expected=hashlib.sha256((ROOT/path).read_bytes()).hexdigest()
        assert result==expected,(path,'CDN served obsolete or modified asset',result,expected)
        print('PRODUCTION_ASSET_MATCH',path,expected[:18])
    assert not errors,errors
    print('PRODUCTION_KITTEN_EYE_QA_PASS',URL)
    browser.close()
