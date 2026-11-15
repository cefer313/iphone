"""Saytdakı mətnin PDF ilə sözbəsöz eyni olduğunu yoxlayır.

PDF tərəfi çıxarıcıdan asılı olmadan oxunur: 5–608-ci səhifələrdəki bütün mətn
(səhifə başlıqları, səhifə nömrələri və haşiyə işarə rəqəmləri istisna olmaqla).
Müqayisədə boşluqlar və tirelər nəzərə alınmır (sətir sonu tirələri səbəbindən),
qalan hər simvol və hər söz say baxımından eyni olmalıdır.
"""
import glob
import html
import json
import re
import sys
from collections import Counter

import pymupdf

PDF, DATA = sys.argv[1], sys.argv[2]
doc = pymupdf.open(PDF)

pdf_parts = []
pdf_parts_notable = []   # cədvəlsiz axın (sıra yoxlaması üçün; cədvəl xanaları sətir-sətir düzülür)
for pno in range(4, 608):
    tbs = [pymupdf.Rect(t.bbox) for t in doc[pno].find_tables().tables]
    for b in doc[pno].get_text('dict')['blocks']:
        for l in b.get('lines', []):
            c = pymupdf.Point((l['bbox'][0] + l['bbox'][2]) / 2, (l['bbox'][1] + l['bbox'][3]) / 2)
            in_table = any(r.contains(c) for r in tbs)
            for s in l['spans']:
                f, sz, t = s['font'], s['size'], s['text']
                if (f.startswith('Calibri') or f.startswith('MinionPro')) and sz >= 11.9:
                    continue                      # səhifə başlığı / nömrəsi
                if pno + 1 == 574 and sz < 9.5 and t == '3':
                    pass                          # "1000 sm³" — kub işarəsi, haşiyə deyil
                elif sz < 9.5 and t.strip().isdigit():
                    continue                      # haşiyə işarəsi
                if pno + 1 == 461 and t.startswith('1 Qeyd etmək'):
                    t = t[1:]                     # bu səhifədə haşiyə nömrəsi adi şriftlə yazılıb
                pdf_parts.append(t)
                if not in_table:
                    pdf_parts_notable.append(t)
    pdf_parts_notable.append('\ue000')   # səhifə sərhədi: haşiyə hissələri onu keçə bilməz
pdf_text = ' '.join(pdf_parts).replace('\xad', '')
pdf_text_notable = ' '.join(pdf_parts_notable).replace('\xad', '')

site_parts = []
for f in sorted(glob.glob(DATA + '/ch*.json')):
    d = json.load(open(f, encoding='utf-8'))
    site_parts.append(d['t'])
    for b in d['b']:
        h = re.sub(r'<sup class="fnref">.*?</sup>', '', b['h'])  # haşiyə işarələri
        site_parts.append(html.unescape(re.sub(r'<[^>]+>', '', h)))
    for fn in d['f']:
        site_parts.append(html.unescape(re.sub(r'<[^>]+>', '', fn['h'])))
site_text = ' '.join(site_parts)


def chars(t):
    return Counter(re.sub(r'[\s\-]', '', t))


def words(t):
    return Counter(w for w in re.split(r'[\s\-]+', t) if w)


cp, cs = chars(pdf_text), chars(site_text)
print('PDF simvol:', sum(cp.values()), '| sayt simvol:', sum(cs.values()))
cdiff = (cp - cs) + (cs - cp)
print('simvol fərqi:', dict(cp - cs), dict(cs - cp))

# Sözlər: tire ilə bölünmə fərqlərini aradan qaldırmaq üçün tiresiz birləşmiş axın
def joined(t):
    return re.sub(r'[\s\-]+', '', t)

# Sıra yoxlaması: haşiyələri PDF axınından çıxarıb əsas mətni ardıcıl müqayisə et
body_parts, fn_parts = [], []
for f in sorted(glob.glob(DATA + '/ch*.json')):
    d = json.load(open(f, encoding='utf-8'))
    body_parts.append(d['t'])
    for b in d['b']:
        h = re.sub(r'<sup class="fnref">.*?</sup>', '', b['h'])
        body_parts.append(html.unescape(re.sub(r'<[^>]+>', '', h)))
    fn_parts += [joined(html.unescape(re.sub(r'<[^>]+>', '', re.sub(r'<table>.*?</table>', '', fn['h']))))
                 for fn in d['f']]
jp = joined(pdf_text_notable)
pos = 0
for fn in fn_parts:            # haşiyələr PDF-də öz səhifələrinin sonunda ardıcıl gəlir
    rest = fn
    while rest:                 # səhifədən-səhifəyə keçən haşiyələr hissə-hissə axtarılır
        k = jp.find(rest, pos)
        if k >= 0:
            jp = jp[:k] + jp[k + len(rest):]; pos = k; rest = ''
            break
        lo, hi = 20, len(rest)  # PDF-də tapılan ən uzun başlanğıc hissə
        while lo < hi:
            mid = (lo + hi + 1) // 2
            if jp.find(rest[:mid], pos) >= 0: lo = mid
            else: hi = mid - 1
        k = jp.find(rest[:lo], pos)
        if lo < 20 or k < 0:
            print('haşiyə PDF-də tapılmadı:', rest[:60]); break
        jp = jp[:k] + jp[k + lo:]; pos = k; rest = rest[lo:]
jp = jp.replace('\ue000', '')
js = joined(' '.join(body_parts))
same_order = jp == js
if not same_order:
    i = next(i for i in range(min(len(jp), len(js))) if jp[i] != js[i])
    print('ilk fərq:', jp[i - 60:i + 60], '<>', js[i - 60:i + 60])
print('əsas mətn PDF ilə eyni ardıcıllıqdadır:', same_order)
ok = not cdiff and same_order
print('NƏTİCƏ:', 'UYĞUNDUR — heç bir simvol əlavə edilməyib və ya silinməyib' if ok else 'FƏRQ VAR')
if not ok:
    wp, ws = words(pdf_text), words(site_text)
    print('yalnız PDF-də:', dict(wp - ws))
    print('yalnız saytda:', dict(ws - wp))
sys.exit(0 if ok else 1)
