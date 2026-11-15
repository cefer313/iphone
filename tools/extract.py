"""PDF -> sayt üçün JSON. Mətn dəyişdirilmir: yalnız səhifə tərtibatı (sətir sonu
tireləri, səhifə başlıqları, səhifə nömrələri) götürülür, haşiyələr yerinə bağlanır.

İstifadə: python3 tools/extract.py kitab.pdf www/serieet/data
"""
import html
import json
import os
import re
import sys
from collections import Counter

import pymupdf

PDF, OUT = sys.argv[1], sys.argv[2]
DEBUG = len(sys.argv) > 3
FIRST, LAST = 5, 608          # məzmun səhifələri (1-dən sayılır); 609+ mündəricat
TOC = json.load(open(os.path.join(os.path.dirname(__file__), 'toc.json')))

doc = pymupdf.open(PDF)


def norm(t):
    return re.sub(r'\s+', ' ', t).strip().upper().replace('İ', 'I')


def is_header(sp):
    f, sz = sp['font'], sp['size']
    return (f.startswith('Calibri') and sz >= 11.9) or (f.startswith('MinionPro') and sz >= 11.9)


def is_small(sp):
    return sp['size'] < 9.5


def is_bodyish(spans):
    for s in spans:
        f = s['font']
        if s['size'] >= 11 and not f.startswith('TimesNewRoman'):
            return True
        if f.startswith(('Palatino', 'Cambria', 'Adobe', 'Myriad')):
            return True
    return False


def heading_kind(spans):
    sp = [s for s in spans if s['text'].strip() and not (is_small(s) and s['text'].strip().isdigit())]
    if sp and all(s['font'] == 'Cambria-Bold' and round(s['size']) == 18 for s in sp):
        return 'H18'
    if sp and all(s['font'] == 'PalatinoLinotype-Bold' and round(s['size']) == 14 for s in sp):
        return 'H14'
    return None


# ---------- 1) Səhifələri sətirlərə ayır ----------
rows = []   # {page, kind: body|fn|head, x0, spans}
for pno in range(FIRST - 1, LAST):
    page = doc[pno]
    tables = []
    for t in page.find_tables().tables:
        words_ = page.get_text('words')
        trs = []
        for ri, row in enumerate(t.rows):
            tds = []
            for cb in row.cells:
                if cb is None:
                    continue
                rect = pymupdf.Rect(cb)
                ws = [w for w in words_ if rect.contains(pymupdf.Point((w[0] + w[2]) / 2, (w[1] + w[3]) / 2))]
                ws.sort(key=lambda w: (round(w[3]), w[0]))
                txt = ' '.join(w[4] for w in ws)
                tag = 'th' if ri == 0 else 'td'
                tds.append(f'<{tag}>{html.escape(txt)}</{tag}>')
            trs.append('<tr>' + ''.join(tds) + '</tr>')
        tables.append({'bbox': pymupdf.Rect(t.bbox),
                       'html': '<div class="tbl"><table>' + ''.join(trs) + '</table></div>'})
    lines = []
    for b in page.get_text('dict')['blocks']:
        for l in b.get('lines', []):
            spans = [s for s in l['spans'] if s['text'] != '']
            spans = [s for s in spans if not is_header(s)]
            if not ''.join(s['text'] for s in spans).strip():
                continue
            c = pymupdf.Point((l['bbox'][0] + l['bbox'][2]) / 2, (l['bbox'][1] + l['bbox'][3]) / 2)
            if any(tb['bbox'].contains(c) for tb in tables):
                continue
            lines.append({'bbox': list(l['bbox']), 'spans': spans})
    # Kiçik (yalnız rəqəm) sətirləri eyni hündürlükdəki sətrə birləşdir
    big = [l for l in lines if not all(is_small(s) for s in l['spans'] if s['text'].strip())]
    small = [l for l in lines if l not in big]
    for sl in small:
        y0, y1 = sl['bbox'][1], sl['bbox'][3]
        best = None
        for bl in big:
            ov = min(y1, bl['bbox'][3]) - max(y0, bl['bbox'][1])
            if ov > 0 and (best is None or ov > best[0]):
                best = (ov, bl)
        if best:
            bl = best[1]
            for s in sl['spans']:
                s['_x'] = s['bbox'][0]
            for s in bl['spans']:
                s.setdefault('_x', s['bbox'][0])
            bl['spans'] = sorted(bl['spans'] + sl['spans'], key=lambda s: s['_x'])
            bl['bbox'][0] = min(bl['bbox'][0], sl['bbox'][0])
        else:
            big.append(sl)
    # Eyni sətirdə olan bir neçə hissəni birləşdir (sətrin baza xətti üzrə)
    big.sort(key=lambda l: (round(l['bbox'][3]), l['bbox'][0]))
    merged = []
    for l in big:
        if merged and abs(merged[-1]['bbox'][3] - l['bbox'][3]) < 2.5 \
                and l['bbox'][0] >= merged[-1]['bbox'][2] - 1:
            m = merged[-1]
            m['spans'] += l['spans']
            m['bbox'][2] = l['bbox'][2]
        else:
            merged.append(l)
    for tb in tables:
        merged.append({'bbox': [tb['bbox'].x0, tb['bbox'].y0, tb['bbox'].x1, tb['bbox'].y1],
                       'spans': [{'text': '', 'font': 'TABLE', 'size': 10, 'bbox': list(tb['bbox'])}],
                       'table': tb['html']})
    merged.sort(key=lambda l: l['bbox'][3])
    # Haşiyə zonası: səhifənin sonunda gövdə şrifti olmayan sətirlər
    kinds = ['body'] * len(merged)
    for i in range(len(merged) - 1, -1, -1):
        if is_bodyish(merged[i]['spans']):
            break
        kinds[i] = 'fn'
    body_x1 = [l['bbox'][2] for l, k in zip(merged, kinds) if k == 'body' and not heading_kind(l['spans'])]
    right = max(body_x1) if body_x1 else 425
    for l, k in zip(merged, kinds):
        hk = heading_kind(l['spans']) if k == 'body' else None
        for sp in l['spans']:
            sp['text'] = sp['text'].replace('\xad', '')
        rows.append({'page': pno + 1, 'kind': hk or k, 'x0': l['bbox'][0], 'x1': l['bbox'][2],
                     'right': right, 'spans': l['spans'], 'table': l.get('table')})

# ---------- 2) Söz bazası (sətir sonu tirələri üçün) ----------
WORD = re.compile(r"[\wəƏıİöÖüÜğĞşŞçÇ'’-]+")
words = Counter()
for r in rows:
    txt = ''.join(s['text'] for s in r['spans'] if not is_small(s))
    toks = WORD.findall(txt)
    for t in toks[1:-1]:
        words[t.lower()] += 1


HY = []


def join_hyphen(left, right):
    """left '...idra-' , right 'ka ...' -> tire saxlanılsınmı?"""
    lw = WORD.findall(left)
    rw = WORD.findall(right)
    if not lw or not rw:
        return False
    a = lw[-1].rstrip('-').lower()
    b = rw[0].lower()
    if words.get(a + '-' + b) and not words.get(a + b):
        HY.append(('keep-known', a, b)); return True
    if words.get(a + b):
        HY.append(('join-known', a, b)); return False
    # Tanınmayan: hər iki hissə ayrı söz kimi böyük hərflə başlayırsa və ya ikisi də
    # müstəqil sözdürsə (məs. "qarşı-qarşıya") tire saxlanılır
    if a[-1:].isdigit():          # "277-ci" kimi: rəqəmdən sonra şəkilçi tire ilə yazılır
        HY.append(('keep-guess', a, b)); return True
    HY.append(('join-guess', a, b))
    return False


# ---------- 3) Span -> HTML ----------
def span_html(s):
    t = html.escape(s['text'])
    f = s['font']
    b = 'Bold' in f
    i = 'Ita' in f
    if b and i:
        t = f'<b><i>{t}</i></b>'
    elif b:
        t = f'<b>{t}</b>'
    elif i:
        t = f'<i>{t}</i>'
    if 'Arabic' in f:
        t = f'<span lang="ar" dir="rtl">{t}</span>'
    return t


def merge_tags(h):
    h = re.sub(r'</b>(\s*)<b>', r'\1', h)
    h = re.sub(r'</i>(\s*)<i>', r'\1', h)
    h = re.sub(r'</i></b>(\s*)<b><i>', r'\1', h)
    return h


# ---------- 4) Bloklar: başlıq, paraqraf, haşiyə ----------
chapters = []
toc_iter = list(TOC)
toc_norm = [(norm(e['title']), e) for e in toc_iter]
fn_map = {}        # (page, num) -> fid
footnotes = []     # {id, html, page}
cur_ch = None
cur_par = None     # {'parts': [(html, plain, page)]}
cur_fn = None
pending_head = None
section_id = 0


def new_chapter(title, page):
    global cur_ch
    cur_ch = {'title': title, 'page': page, 'blocks': [], 'footnotes': []}
    chapters.append(cur_ch)


def flush_par():
    global cur_par
    if cur_par is None:
        return
    h = merge_tags(''.join(cur_par['html'])).strip()
    plain = re.sub(r'<[^>]+>', '', h)
    m = re.match(r'^\s*Məsələ\s+(\d+)\s*\.', html.unescape(plain))
    blk = {'t': 'm' if m else 'p', 'h': h, 'pg': cur_par['page']}
    if m:
        blk['n'] = int(m.group(1))
    cur_ch['blocks'].append(blk)
    cur_par = None


def flush_head():
    global pending_head, section_id
    if pending_head is None:
        return
    raw_title = re.sub(r'\s+', ' ', pending_head['text']).strip()
    title = re.sub(r'\x00[^\x00]*\x00', '', raw_title).strip()
    lvl = None
    for i, (n, e) in enumerate(toc_norm):
        if n == norm(title):
            lvl = e['level']
            del toc_norm[i]
            break
    if lvl is None:
        lvl = 1 if pending_head['kind'] == 'H18' and cur_ch is None else 2
    if lvl == 1 or cur_ch is None:
        new_chapter(title, pending_head['page'])
    else:
        section_id += 1
        cur_ch['blocks'].append({'t': 'h', 'h': html.escape(raw_title).replace('\x00', '\x00'),
                                 'plain': title, 'pg': pending_head['page'],
                                 'id': f's{section_id}'})
    pending_head = None


def add_line_to_par(r, cont):
    """Gövdə sətrini cari paraqrafa əlavə et."""
    global cur_par
    parts = []
    for s in r['spans']:
        if is_small(s) and s['text'].strip().isdigit():
            num = int(s['text'].strip())
            parts.append(('FN', (r['page'], num), s['text']))
        else:
            parts.append(('T', span_html(s), s['text']))
    line_html = ''
    for kind, val, raw in parts:
        if kind == 'FN':
            line_html += f'\x00{val[0]}:{val[1]}\x00'
        else:
            line_html += val
    plain_line = ''.join(raw for k, v, raw in parts if k == 'T')
    if cur_par is None:
        cur_par = {'html': [line_html.lstrip()], 'page': r['page'], 'tail': plain_line}
        return
    prev = cur_par['html'][-1]
    prev_plain = cur_par['tail'].rstrip()
    if prev_plain.endswith('-') and not prev_plain.endswith(' -'):
        keep = join_hyphen(prev_plain, plain_line.lstrip())
        # son '-' simvolunu sil (HTML-in sonunda)
        stripped = prev.rstrip()
        idx = stripped.rfind('-')
        newprev = stripped[:idx] + ('-' if keep else '') + stripped[idx + 1:]
        cur_par['html'][-1] = newprev
        cur_par['html'].append(line_html.lstrip())
    else:
        sep = '' if prev.endswith((' ', ' ')) else ' '
        cur_par['html'].append(sep + line_html.lstrip())
    cur_par['tail'] = plain_line


LIST_RE = re.compile(r'^\s*(Məsələ\s+\d+\s*\.|[a-zəçğıöşü]\)|\d+(\s*(və|-|,)\s*\d+)*\)|[IVX]+\.|\d+\.\s)')


def starts_new_par(prev, r):
    if prev is None:
        return True
    text = ''.join(s['text'] for s in r['spans'])
    if LIST_RE.match(text):
        return True
    same_page = prev['page'] == r['page']
    if same_page and r['x0'] > prev['x0'] + 8:
        return True
    short = prev['x1'] < prev['right'] - 18
    first = text.lstrip()[:1]
    if short and first and (first.isupper() or first.isdigit() or first in '“"«(–-'):
        return True
    return False


refs_on_page = set()
for r in rows:
    if r['kind'] != 'fn':
        for sp in r['spans']:
            if is_small(sp) and sp['text'].strip().isdigit():
                refs_on_page.add((r['page'], int(sp['text'].strip())))

prev_body = None
for r in rows:
    if r['kind'] in ('H18', 'H14'):
        prev_body = None
        flush_par()
        text = ''.join(s['text'] if not is_small(s) else f'\x00{r["page"]}:{s["text"].strip()}\x00'
                       for s in r['spans'])
        if pending_head and pending_head['kind'] == r['kind'] and pending_head['page'] == r['page'] \
                and pending_head.get('adjacent') \
                and norm(re.sub(r'\x00[^\x00]*\x00', '', pending_head['text'])) not in {n for n, e in toc_norm}:
            pending_head['text'] += ' ' + text
        else:
            flush_head()
            pending_head = {'kind': r['kind'], 'text': text, 'page': r['page']}
        pending_head['adjacent'] = True
        continue
    if pending_head:
        pending_head['adjacent'] = False
        flush_head()
    if r['kind'] == 'body':
        if cur_par is not None and starts_new_par(prev_body, r):
            flush_par()
        add_line_to_par(r, True)
        prev_body = r
    elif r.get('table'):  # cədvəl haşiyənin içində
        cur_fn['html'].append(r['table'])
        cur_fn['tail'] = ''
        cur_fn['short'] = True
    else:  # haşiyə
        spans = r['spans']
        first = next(s for s in spans if s['text'].strip())
        line_txt = ''.join(x['text'] for x in spans)
        inline_num = re.match(r'^\s*(\d+)\s', line_txt) if not is_small(first) else None
        size_change = (cur_fn is not None and cur_fn['page'] == r['page'] and not is_small(first)
                       and abs(first['size'] - cur_fn.get('size', first['size'])) > 1
                       and (r['page'], cur_fn['num'] + 1) in refs_on_page
                       and (r['page'], cur_fn['num'] + 1) not in fn_map)
        if inline_num and first['text'].lstrip().startswith(inline_num.group(1)) \
                and (r['page'], int(inline_num.group(1))) in refs_on_page \
                and (r['page'], int(inline_num.group(1))) not in fn_map:
            num = int(inline_num.group(1))
            first = dict(first, text=first['text'].lstrip()[len(inline_num.group(1)):])
            fid = len(footnotes) + 1
            cur_fn = {'id': fid, 'html': [], 'tail': '', 'page': r['page'], 'num': num}
            footnotes.append(cur_fn)
            fn_map[(r['page'], num)] = fid
            rest = [first] + spans[spans.index(next(x for x in spans if x['text'].strip())) + 1:]
        elif size_change:
            num = cur_fn['num'] + 1
            fid = len(footnotes) + 1
            cur_fn = {'id': fid, 'html': [], 'tail': '', 'page': r['page'], 'num': num}
            footnotes.append(cur_fn)
            fn_map[(r['page'], num)] = fid
            rest = spans
        elif is_small(first) and first['text'].strip().isdigit():
            num = int(first['text'].strip())
            fid = len(footnotes) + 1
            cur_fn = {'id': fid, 'html': [], 'tail': '', 'page': r['page'], 'num': num}
            footnotes.append(cur_fn)
            fn_map[(r['page'], num)] = fid
            rest = spans[spans.index(first) + 1:]
        else:
            rest = spans
        h = ''.join(f'<sup>{html.escape(x["text"])}</sup>' if (is_small(x) and x['text'].strip().isdigit())
                    else span_html(x) for x in rest)
        plain = ''.join(s['text'] for s in rest)
        if cur_fn is None:
            raise SystemExit(f'Haşiyə nömrəsiz başlayır: səh. {r["page"]}: {plain[:60]}')
        if cur_fn['html']:
            pt = cur_fn['tail'].rstrip()
            if pt.endswith('-') and not pt.endswith(' -'):
                keep = join_hyphen(pt, plain.lstrip())
                s0 = cur_fn['html'][-1].rstrip()
                idx = s0.rfind('-')
                cur_fn['html'][-1] = s0[:idx] + ('-' if keep else '') + s0[idx + 1:]
            elif cur_fn.get('short') and not cur_fn['html'][-1].endswith('</div>'):
                cur_fn['html'].append('<br>')
            elif not cur_fn['html'][-1].endswith((' ', '</div>')):
                cur_fn['html'].append(' ')
        cur_fn['html'].append(h.lstrip() if cur_fn['html'] else h.strip())
        cur_fn['tail'] = plain
        cur_fn['size'] = max((x['size'] for x in rest if x['text'].strip()), default=10)
        cur_fn['short'] = r['x1'] < r['right'] - 18
        if 'chapter' not in cur_fn:
            cur_fn['chapter'] = len(chapters) - 1
flush_par()
flush_head()

# ---------- 5) Haşiyə istinadlarını bağla ----------
missing = []
for ci, ch in enumerate(chapters):
    used = []
    for blk in ch['blocks']:
        def rep(m):
            key = (int(m.group(1)), int(m.group(2)))
            fid = fn_map.get(key)
            if fid is None:
                missing.append(key)
                return ''
            if fid in used:
                return f'<sup class="fnref"><a href="#fn{fid}">{used.index(fid) + 1}</a></sup>'
            used.append(fid)
            return f'<sup class="fnref"><a href="#fn{fid}" id="r{fid}">{len(used)}</a></sup>'
        blk['h'] = re.sub(r'\x00(\d+):(\d+)\x00', rep, blk['h'])
    for k, fid in enumerate(used, 1):
        fn = footnotes[fid - 1]
        ch['footnotes'].append({'id': fid, 'k': k, 'h': merge_tags(''.join(fn['html'])).strip()})
used_all = {f['id'] for ch in chapters for f in ch['footnotes']}
orphans = [f for f in footnotes if f['id'] not in used_all]

# ---------- 6) Yaz ----------
os.makedirs(OUT, exist_ok=True)
index = []
for i, ch in enumerate(chapters, 1):
    ms = [b['n'] for b in ch['blocks'] if b['t'] == 'm']
    secs = [{'id': b['id'], 't': b.pop('plain')} for b in ch['blocks'] if b['t'] == 'h']
    index.append({'i': i, 't': ch['title'], 'pg': ch['page'],
                  'm': [ms[0], ms[-1]] if ms else None, 's': secs})
    with open(os.path.join(OUT, f'ch{i:02d}.json'), 'w', encoding='utf-8') as f:
        json.dump({'i': i, 't': ch['title'], 'b': ch['blocks'], 'f': ch['footnotes']},
                  f, ensure_ascii=False, separators=(',', ':'))
with open(os.path.join(OUT, 'index.json'), 'w', encoding='utf-8') as f:
    json.dump(index, f, ensure_ascii=False, separators=(',', ':'))

nums = sorted(b['n'] for ch in chapters for b in ch['blocks'] if b['t'] == 'm')
print('fəsil:', len(chapters), '| bölmə:', sum(len(x['s']) for x in index),
      '| məsələ:', len(nums), nums[:1], nums[-1:],
      '| haşiyə:', len(footnotes), '| istinadsız haşiyə:', len(orphans),
      '| haşiyəsiz istinad:', len(missing))
gaps = [n for n in range(1, nums[-1] + 1) if n not in set(nums)]
dups = [n for n, c in Counter(nums).items() if c > 1]
print('buraxılan nömrələr:', gaps[:30], '| təkrar:', dups[:30])
print('mündəricatda tapılmayan başlıqlar:', [e['title'] for n, e in toc_norm][:20])
if orphans:
    print('istinadsız:', [(f['page'], f['num']) for f in orphans][:20])
if missing:
    print('haşiyəsiz:', missing[:20])

if DEBUG:
    c = Counter(h[0] for h in HY)
    print('tire qərarları:', dict(c))
    import random
    random.seed(1)
    for kind in ('keep-known', 'keep-guess'):
        xs = [h for h in HY if h[0] == kind]
        print(kind, [a + '|' + b for _, a, b in random.sample(xs, min(60, len(xs)))])
