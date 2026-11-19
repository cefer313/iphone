import React from 'react';
import { useCurrentFrame } from 'remotion';
import { COLORS, CONTACT, FONTS, PACKAGES, TEXT, TIMING } from '../config';
import { progress, Reveal, SceneShell } from '../components/anim';
import { Body, CameraFrame, GoldLine, Kicker, PackageCard, ServiceItem, Title } from '../components/Elements';
import { IconBadge } from '../components/Icon';

// ── SƏHNƏ 1 · 0–7 san · Giriş və əsas dəyər ──────────────────
export const Scene1: React.FC = () => {
  const t = TEXT.s1;
  return (
    <SceneShell duration={TIMING.s1.duration} justify="center">
      <CameraFrame start={0} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 34, padding: '0 20px' }}>
        {CONTACT.name ? (
          <Reveal delay={8}>
            <Kicker color={COLORS.muted} style={{ letterSpacing: '0.18em', textTransform: 'uppercase' }}>
              {CONTACT.name}
            </Kicker>
          </Reveal>
        ) : null}
        <Reveal delay={18}>
          <Kicker>{t.kicker}</Kicker>
        </Reveal>
        <div>
          {t.title.map((line, i) => (
            <Reveal key={line} delay={30 + i * 12} y={46}>
              <Title size={100}>{line}</Title>
            </Reveal>
          ))}
        </div>
        <GoldLine start={62} width={260} />
        <Reveal delay={78}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 22, rowGap: 8 }}>
            {t.services.map((s, i) => (
              <React.Fragment key={s}>
                {i > 0 && <span style={{ color: COLORS.gold, fontSize: 40, fontFamily: FONTS.body }}>•</span>}
                <Body size={44} weight={600}>
                  {s}
                </Body>
              </React.Fragment>
            ))}
          </div>
        </Reveal>
      </div>
    </SceneShell>
  );
};

// ── SƏHNƏ 2 · 7–15 san · Əməkdaşlığın məntiqi ───────────────
export const Scene2: React.FC = () => {
  const frame = useCurrentFrame();
  const t = TEXT.s2;
  const stepStart = (i: number) => 22 + i * 18;
  const rowH = 132;
  const lineP = progress(frame, stepStart(0) + 6, stepStart(t.steps.length - 1) - stepStart(0) + 10);
  return (
    <SceneShell duration={TIMING.s2.duration} justify="center">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>
        <Reveal delay={4}>
          <Title size={84}>{t.title}</Title>
        </Reveal>
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* mərhələləri birləşdirən qızılı xətt */}
          <div
            style={{
              position: 'absolute',
              left: 55,
              top: 56,
              width: 3,
              height: (rowH * (t.steps.length - 1) + 20 * (t.steps.length - 1)) * lineP,
              background: `linear-gradient(${COLORS.gold}, rgba(200,168,107,0.3))`,
              borderRadius: 2,
            }}
          />
          {t.steps.map((s, i) => (
            <Reveal key={s.label} delay={stepStart(i)} y={30}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 40, height: rowH }}>
                <IconBadge name={s.icon} size={112} drawStart={stepStart(i) + 4} />
                <Title size={60} style={{ fontWeight: 700 }}>
                  {s.label}
                </Title>
              </div>
            </Reveal>
          ))}
        </div>
        <div>
          <Reveal delay={128}>
            <Body size={54} weight={600} color={COLORS.warm}>
              {t.accent[0]}
            </Body>
          </Reveal>
          <Reveal delay={140}>
            <Body size={54} weight={600} color={COLORS.gold}>
              {t.accent[1]}
            </Body>
          </Reveal>
        </div>
      </div>
    </SceneShell>
  );
};

// ── SƏHNƏ 3 · 15–33 san · Aylıq paketlər ─────────────────────
export const Scene3: React.FC = () => (
  <SceneShell duration={TIMING.s3.duration} justify="center">
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
      <Reveal delay={4}>
        <Title size={84}>{TEXT.s3.title}</Title>
      </Reveal>
      <GoldLine start={16} width={200} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 34, marginTop: 8 }}>
        {/* Kartlar 1, 3.3 və 5.7 saniyədə açılır; ~6.5 saniyədən sonra hər üçü sabit görünür. */}
        {PACKAGES.map((pkg, i) => (
          <PackageCard key={pkg.name} pkg={pkg} delay={30 + i * 70} />
        ))}
      </div>
    </div>
  </SceneShell>
);

// ── SƏHNƏ 4 · 33–43 san · Hazırlıq işləri ────────────────────
export const Scene4: React.FC = () => (
  <SceneShell duration={TIMING.s4.duration} justify="center">
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
      <Reveal delay={4}>
        <Title size={80}>{TEXT.s4.title}</Title>
      </Reveal>
      <GoldLine start={16} width={200} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 30, marginTop: 8 }}>
        {TEXT.s4.items.map((it, i) => (
          <ServiceItem key={it.title} icon={it.icon} title={it.title} sub={it.sub} delay={28 + i * 40} titleSize={54} />
        ))}
      </div>
    </div>
  </SceneShell>
);
