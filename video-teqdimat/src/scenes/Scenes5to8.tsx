import React from 'react';
import { Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { COLORS, CONTACT, FONTS, SYNC, TEXT, TIMING } from '../config';
import { progress, Reveal, SceneShell } from '../components/anim';
import { Body, CameraFrame, cardStyle, GoldLine, Kicker, ServiceItem, Timeline, Title } from '../components/Elements';
import { Icon } from '../components/Icon';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

// ── SƏHNƏ 5 · 43–55 san · Strategiya və istehsal dəstəyi ────
export const Scene5: React.FC = () => {
  const t = TEXT.s5;
  return (
    <SceneShell duration={TIMING.s5.duration} justify="center">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
        <Reveal delay={4}>
          <Title size={80}>{t.title}</Title>
        </Reveal>
        <GoldLine start={16} width={200} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 4 }}>
          {t.items.map((it, i) => (
            <ServiceItem key={it.title} icon={it.icon} title={it.title} sub={it.sub} delay={SYNC.s5.items[i]} titleSize={48} />
          ))}
        </div>
        <Reveal delay={SYNC.s5.accent}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginTop: 6 }}>
            <div style={{ width: 6, alignSelf: 'stretch', borderRadius: 3, background: COLORS.gold }} />
            <Body size={50} weight={600} color={COLORS.gold}>
              {t.accent}
            </Body>
          </div>
        </Reveal>
      </div>
    </SceneShell>
  );
};

// ── SƏHNƏ 6 · 55–68 san · Tək video sifarişi ─────────────────
export const Scene6: React.FC = () => {
  const frame = useCurrentFrame();
  const t = TEXT.s6;
  const SWITCH = SYNC.s6.switchAt; // diktor "Yekun qiymət" deyəndə keçid
  const partA = interpolate(frame, [SWITCH - 16, SWITCH], [1, 0], clamp);
  return (
    <SceneShell duration={TIMING.s6.duration} justify="flex-start">
      <div style={{ paddingTop: 330 }}>
        <Reveal delay={4}>
          <Title size={88}>{t.title}</Title>
        </Reveal>
        <GoldLine start={16} width={200} style={{ marginTop: 34 }} />
      </div>

      {/* Hissə A: qiymət və iş axını */}
      {frame < SWITCH && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 44, marginTop: 80, opacity: partA }}>
          <Reveal delay={SYNC.s6.price} y={40}>
            <div style={{ ...cardStyle(true), padding: '46px 48px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', whiteSpace: 'nowrap' }}>
                <span style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 118, lineHeight: 1.05, color: COLORS.gold, letterSpacing: '-0.02em' }}>
                  {t.priceMain}
                </span>
                <span style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 118, lineHeight: 1.05, color: COLORS.warm, letterSpacing: '-0.02em' }}>
                  {t.priceSuffix}
                </span>
              </div>
              <Body size={56} weight={600}>
                {t.priceLine}
              </Body>
            </div>
          </Reveal>
          <Reveal delay={SYNC.s6.sub}>
            <Body size={44} color={COLORS.muted}>
              {t.sub}
            </Body>
          </Reveal>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 10 }}>
            {t.flow.map((step, i) => (
              <React.Fragment key={step}>
                {i > 0 && (
                  <Reveal delay={SYNC.s6.flow[i] - 6} y={0} blur={false}>
                    <Icon name="arrow" size={46} drawStart={SYNC.s6.flow[i] - 6} drawDuration={16} />
                  </Reveal>
                )}
                <Reveal delay={SYNC.s6.flow[i]} y={24}>
                  <div style={{ padding: '18px 30px', borderRadius: 999, border: `1.5px solid ${COLORS.goldLine}`, background: COLORS.goldSoft }}>
                    <Body size={44} weight={600}>
                      {step}
                    </Body>
                  </div>
                </Reveal>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Hissə B: yekun qiymətə təsir edən amillər */}
      {frame >= SWITCH - 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36, marginTop: 80 }}>
          <Reveal delay={SWITCH}>
            <Title size={64} style={{ fontWeight: 700 }}>
              {t.factorsTitle}
            </Title>
          </Reveal>
          <div style={{ ...cardStyle(), padding: '20px 44px', opacity: progress(frame, SWITCH + 10, 24) }}>
            {t.factors.map((f, i) => (
              <Reveal key={f} delay={SYNC.s6.factors[i]} y={24}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 28,
                    padding: '36px 0',
                    borderBottom: i < t.factors.length - 1 ? `1px solid ${COLORS.line}` : 'none',
                  }}
                >
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: COLORS.gold, flex: 'none', boxShadow: '0 0 14px rgba(200,168,107,0.6)' }} />
                  <Body size={50} weight={500}>
                    {f}
                  </Body>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      )}
    </SceneShell>
  );
};

// ── SƏHNƏ 7 · 68–83 san · Saatlıq çəkiliş paketi ─────────────
const Clock: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  // Əqrəb 0-dan 1,5 saata (270°) qədər fırlanır və dayanır.
  const p = progress(frame, start + 10, 70);
  const minuteDeg = p * 540; // 1,5 dövrə
  const hourDeg = p * 45; // 1,5 saat
  return (
    <div style={{ position: 'relative', width: 132, height: 132, flex: 'none' }}>
      <Icon name="clockFace" size={132} drawStart={start} stroke={2} />
      {[hourDeg, minuteDeg].map((deg, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: 66 - 2,
            top: i === 0 ? 66 - 30 : 66 - 44,
            width: 4,
            height: i === 0 ? 30 : 44,
            borderRadius: 2,
            background: i === 0 ? COLORS.warm : COLORS.gold,
            transformOrigin: '50% 100%',
            transform: `rotate(${deg.toFixed(2)}deg)`,
            opacity: progress(frame, start + 6, 16),
          }}
        />
      ))}
    </div>
  );
};

export const Scene7: React.FC = () => {
  const t = TEXT.s7;
  const NOTE_AT = SYNC.s7.note; // diktor qeydi oxuyanda; son 5 saniyədə tam görünür
  const CARD = SYNC.s7.card;
  return (
    <SceneShell duration={TIMING.s7.duration} justify="center">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 34 }}>
        <Reveal delay={4}>
          <Title size={80}>{t.title}</Title>
        </Reveal>

        <Reveal delay={CARD} y={40}>
          <div style={{ ...cardStyle(true), padding: '40px 46px', display: 'flex', flexDirection: 'column', gap: 30 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 38 }}>
              <Clock start={CARD + 4} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Body size={50} weight={600}>
                  {t.duration}
                </Body>
                <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 120, lineHeight: 1.05, color: COLORS.gold, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                  {t.price}
                </div>
              </div>
            </div>
            <Timeline start={CARD + 18} width={808} height={96} playheadFrom={CARD + 40} playheadTo={NOTE_AT} />
          </div>
        </Reveal>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Reveal delay={SYNC.s7.includes}>
            <Kicker style={{ letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 8 }}>{t.includesLabel}</Kicker>
          </Reveal>
          {t.includes.map((item, i) => {
            const hl = i === t.highlightIndex;
            return (
              <Reveal key={item} delay={SYNC.s7.items[i]} y={24}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 24,
                    padding: hl ? '16px 24px' : '12px 0',
                    marginLeft: hl ? -24 : 0,
                    marginRight: hl ? -24 : 0,
                    borderRadius: 20,
                    background: hl ? COLORS.goldSoft : 'transparent',
                    border: hl ? `1.5px solid ${COLORS.goldLine}` : '1.5px solid transparent',
                  }}
                >
                  <Icon name="check" size={46} drawStart={SYNC.s7.items[i] + 4} drawDuration={18} />
                  <Body size={46} weight={hl ? 700 : 500} color={COLORS.warm}>
                    {item}
                  </Body>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={NOTE_AT} y={30}>
          <div style={{ display: 'flex', gap: 22, padding: '28px 34px', borderRadius: 28, border: `1.5px solid ${COLORS.line}`, background: 'rgba(247,245,239,0.05)' }}>
            <div style={{ width: 6, borderRadius: 3, background: COLORS.gold, flex: 'none' }} />
            <Body size={40} weight={500} color={COLORS.warm} style={{ lineHeight: 1.4 }}>
              {t.note}
            </Body>
          </div>
        </Reveal>
      </div>
    </SceneShell>
  );
};

// ── SƏHNƏ 8 · 83–90 san · Əməkdaşlığa dəvət ──────────────────
export const Scene8: React.FC = () => {
  const t = TEXT.s8;
  const hasContact = Boolean(CONTACT.logo || CONTACT.name || CONTACT.instagram || CONTACT.phone);
  return (
    <SceneShell duration={TIMING.s8.duration} fadeOut={false} justify="center">
      <CameraFrame start={0} rec={false} />
      {/* Bütün animasiyalar ~2 saniyədə bitir; son 5 saniyə ekran tam sabitdir. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 40, padding: '0 20px' }}>
        {CONTACT.logo ? (
          <Reveal delay={6}>
            <Img src={staticFile(CONTACT.logo)} style={{ height: 140, width: 'auto', objectFit: 'contain', alignSelf: 'flex-start' }} />
          </Reveal>
        ) : null}
        <div>
          {t.title.map((line, i) => (
            <Reveal key={line} delay={10 + i * 10} y={40}>
              <Title size={i === 0 ? 92 : 80} >
                {line}
              </Title>
            </Reveal>
          ))}
        </div>
        <GoldLine start={30} width={240} duration={26} />
        <Reveal delay={36}>
          <Body size={54} weight={600} color={COLORS.gold}>
            {t.sub}
          </Body>
        </Reveal>
        {hasContact && (
          <Reveal delay={46}>
            <div style={{ ...cardStyle(), padding: '34px 40px', display: 'flex', flexDirection: 'column', gap: 22, marginTop: 10 }}>
              {CONTACT.name ? (
                <Body size={50} weight={700}>
                  {CONTACT.name}
                </Body>
              ) : null}
              {CONTACT.instagram ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
                  <Icon name="instagram" size={52} />
                  <Body size={48}>{CONTACT.instagram}</Body>
                </div>
              ) : null}
              {CONTACT.phone ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
                  <Icon name="phone" size={52} />
                  <Body size={48} style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {CONTACT.phone}
                  </Body>
                </div>
              ) : null}
            </div>
          </Reveal>
        )}
      </div>
    </SceneShell>
  );
};

