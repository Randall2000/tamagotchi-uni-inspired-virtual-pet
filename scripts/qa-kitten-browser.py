#!/usr/bin/env python3
"""Real Chrome acceptance for remastered kitten atlas and A/B/C-only gameplay."""
from playwright.sync_api import sync_playwright
import os
URL = os.environ.get('PET_URL', 'http://127.0.0.1:4199/')
with sync_playwright() as p:
    browser=p.chromium.launch(channel='chrome',headless=True)
    page=browser.new_page(viewport={'width':700,'height':900},device_scale_factor=1)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('response',lambda r:errors.append(str(r.status)+' '+r.url) if r.status>=400 else None)
    page.goto(URL,wait_until='networkidle')
    assert page.locator('#room-scene').get_attribute('data-growth')=='kitten'
    assert page.locator('#screen').evaluate('(el)=>getComputedStyle(el).pointerEvents')=='none'
    assert page.locator('#screen button').count()==0
    assert page.locator('#pet-atlas').evaluate('(el)=>getComputedStyle(el).imageRendering')=='pixelated'
    get_src=lambda:page.locator('#pet-atlas').evaluate('(el)=>getComputedStyle(el).backgroundImage')
    assert '/kitten/idle.png' in get_src(),get_src()
    asset=page.evaluate("""async () => {
      const img = new Image();
      img.src='/public/assets/momo-motions-preview/kitten/idle.png';
      await img.decode();
      return [img.naturalWidth,img.naturalHeight];
    }""")
    assert asset==[1024,384],asset
    frame=page.locator('#screen').get_attribute('data-frame')
    page.mouse.click(350,450)
    assert page.locator('#screen').get_attribute('data-frame').startswith('idle-')
    assert page.locator('#device-menu').is_hidden()
    page.screenshot(path='/tmp/momo-kitten-remastered-idle.png')
    page.keyboard.press('b')
    page.wait_for_timeout(380)
    assert '/kitten/eat.png' in get_src(),get_src()
    assert page.locator('#screen').get_attribute('data-frame').startswith('eat-')
    page.screenshot(path='/tmp/momo-kitten-remastered-eat.png')
    page.keyboard.press('c')
    page.wait_for_timeout(600)
    assert page.locator('#room-scene').get_attribute('data-action')=='idle'
    assert '/kitten/idle.png' in get_src()
    assert not errors, errors
    print('KITTEN_BROWSER_QA_PASS',{'master':'1024x1024','idle_sheet':asset,'input':'ABC only','errors':errors})
    browser.close()
