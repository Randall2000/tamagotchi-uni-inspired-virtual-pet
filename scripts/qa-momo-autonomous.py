#!/usr/bin/env python3
"""Autonomous idle, behavioral variety and non-touch QA. Runs only against explicit URL."""
from playwright.sync_api import sync_playwright
from collections import defaultdict
from pathlib import Path
import os
OUT=Path('/tmp')
url=os.environ.get('PET_URL', 'http://127.0.0.1:4199/')
with sync_playwright() as playwright:
    browser=playwright.chromium.launch(channel='chrome',headless=True)
    page=browser.new_page(viewport={'width':700,'height':900})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('response',lambda r:errors.append(f'HTTP {r.status}: {r.url}') if r.status>=400 else None)
    page.goto(url,wait_until='networkidle')
    assert page.locator('#screen').get_attribute('data-frame').startswith('idle-')
    assert page.locator('#screen button').count()==0
    before=page.evaluate("JSON.parse(localStorage.getItem('tower-pet-save-v1'))")
    scene=page.locator('#room-scene')
    seen=defaultdict(set)
    timeline=[]
    captured=False
    # Sample all frames during normal idle and autonomous behavior. Idle frame changes
    # without any button press and autonomous motions begin without input.
    for i in range(95):
        action=scene.get_attribute('data-action')
        frame=page.locator('#screen').get_attribute('data-frame')
        seen[action].add(frame)
        if not timeline or timeline[-1][0]!=action:
            timeline.append((action,frame,i))
        if action not in ('idle','walk') and len(seen[action])>3 and not captured:
            page.screenshot(path=str(OUT/'momo-autonomous-motion.png'))
            captured=True
        page.wait_for_timeout(200)
    after=page.evaluate("JSON.parse(localStorage.getItem('tower-pet-save-v1'))")
    print('timeline',timeline)
    print('frame diversity',{k:len(v) for k,v in seen.items()})
    assert len(seen['idle'])>=8, 'idle must cycle real, distinct background frames'
    assert any(x in seen for x in ['walk','tail_wag','groom','curious','yawn','happy','sad','angry']), 'autonomous actions must trigger'
    for key in ['bond','hunger','happiness','hygiene','energy']:
        assert before[key]==after[key],f'autonomous idle cannot change {key}'
    assert not errors,errors
    print('AUTONOMOUS_QA_PASS')
    browser.close()
