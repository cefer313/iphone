import pymupdf, re, json, sys
doc = pymupdf.open(sys.argv[1])
entries = []
for pno in range(608, 622):
    for b in doc[pno].get_text('dict')['blocks']:
        for l in b.get('lines', []):
            sp = [s for s in l['spans'] if s['text'].strip()]
            if not sp: continue
            f = sp[0]['font']; size = round(sp[0]['size'], 1)
            if f.startswith('Calibri') or f.startswith('MinionPro') or size >= 16: continue
            t = ''.join(s['text'] for s in l['spans'])
            lvl = 1 if f.startswith('Cambria') else 2
            m = re.match(r'^(.*?)\s*\.{3,}\s*(\d+)\s*$', t)
            if m:
                title, page = m.group(1), int(m.group(2))
                if entries and entries[-1].get('page') is None:
                    entries[-1]['title'] += ' ' + title.strip(); entries[-1]['page'] = page
                else:
                    entries.append({'title': title.strip(), 'page': page, 'level': lvl})
            else:
                if entries and entries[-1].get('page') is None:
                    entries[-1]['title'] += ' ' + t.strip()
                else:
                    entries.append({'title': t.strip(), 'page': None, 'level': lvl})
for e in entries: e['title'] = re.sub(r'\s+', ' ', e['title']).strip()
json.dump(entries, open(sys.argv[2], 'w'), ensure_ascii=False, indent=0)
print(len(entries), sum(e['level']==1 for e in entries))
for e in entries[:12]: print(e)
print([e for e in entries if e['page'] is None])
