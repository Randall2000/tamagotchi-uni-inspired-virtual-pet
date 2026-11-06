#!/usr/bin/env python3
"""Normalize available generated sheets, run intake, and report per-action status."""
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / 'public/assets/didi-generated/raw'
NORMALIZED = ROOT / 'public/assets/didi-generated/normalized'
REPORT = ROOT / 'art/action-intake-summary.json'
ACTIONS = ('idle', 'walk', 'eat', 'drink', 'snack', 'play', 'groom',
           'petting', 'sleep_prep', 'sleep', 'wake', 'yawn', 'tail_wag',
           'curious', 'happy', 'sad', 'angry', 'sick', 'toilet')
PROPS = {'eat', 'drink', 'snack', 'play', 'toilet'}


def version(path):
    return int(path.stem.rsplit('-v', 1)[1])


def main():
    summary = {}
    for stage in ('kitten', 'adult'):
        summary[stage] = {}
        for action in ACTIONS:
            files = list(RAW.glob(f'{stage}-{action}-v[0-9]*.png'))
            if not files:
                summary[stage][action] = {'status': 'MISSING'}
                continue
            source = max(files, key=version)
            target = NORMALIZED / f'{stage}-{action}-v{version(source)}.png'
            command = [sys.executable, str(ROOT / 'scripts/normalize-chatgpt-sheet.py'),
                       str(source), str(target)]
            if action in PROPS:
                command.append('--allow-props')
            normal = subprocess.run(command, capture_output=True, text=True)
            if normal.returncode:
                summary[stage][action] = {'status': 'NORMALIZE_FAIL', 'source': str(source.relative_to(ROOT)),
                                          'error': normal.stderr.strip()}
                continue
            intake = subprocess.run([sys.executable, str(ROOT / 'scripts/intake-chatgpt-sheet.py'),
                                     str(target), '--stage', stage, '--action', action],
                                    capture_output=True, text=True)
            report = json.loads((ROOT / 'output/art-intake' / stage / f'{action}-report.json').read_text())
            summary[stage][action] = {
                'status': 'PASS' if intake.returncode == 0 else 'FAIL',
                'source': str(source.relative_to(ROOT)),
                'normalized': str(target.relative_to(ROOT)),
                'failed': report['failed'],
            }
            print(stage, action, summary[stage][action]['status'], report['failed'])
    REPORT.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n')
    print('WROTE', REPORT)


if __name__ == '__main__':
    main()
