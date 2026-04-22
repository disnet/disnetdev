/*
 * Cathode-paper document fragment for social preview images.
 * Mirrors the public site's eyebrow → title → description → status-line
 * rhythm so a shared link reads as a torn page from the workshop notebook.
 *
 * Colors below are approximate sRGB renderings of the OKLCH tokens in
 * src/routes/cathode.css — Satori's CSS subset does not parse oklch().
 */

const PAGE = '#F3EDE0';
const INK = '#2A241B';
const INK_SOFT = '#524A3D';
const INK_MUTED = '#8A8272';
const RULE = '#C9C2AF';
const AMBER = '#C17A24';

const WIDTH = 1200;
const HEIGHT = 630;

export type OgInputs = {
  eyebrow: string;
  title: string;
  description?: string;
  footerLeft: string;
  footerRight?: string;
};

type Node = {
  type: string;
  props: Record<string, unknown> & { children?: unknown };
};

function el(type: string, props: Record<string, unknown>, ...children: unknown[]): Node {
  const kids = children.flat().filter((c) => c !== null && c !== undefined && c !== false);
  return {
    type,
    props: { ...props, children: kids.length === 0 ? undefined : kids.length === 1 ? kids[0] : kids }
  };
}

function titleSize(title: string) {
  const len = title.length;
  if (len <= 36) return 88;
  if (len <= 58) return 74;
  if (len <= 88) return 60;
  return 52;
}

function triangle() {
  // Inline SVG marker stands in for the ▸ glyph used throughout the live
  // site. Baked as a path so we don't need a geometric-shapes font.
  return el(
    'svg',
    {
      width: 18,
      height: 22,
      viewBox: '0 0 18 22',
      style: { display: 'flex' }
    },
    el('path', { d: 'M3 3 L15 11 L3 19 Z', fill: AMBER })
  );
}

export function buildOgTree(input: OgInputs): Node {
  const tSize = titleSize(input.title);

  const eyebrow = el(
    'div',
    {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 18
      }
    },
    triangle(),
    el(
      'span',
      {
        style: {
          fontFamily: 'Alegreya Sans SC',
          fontSize: 28,
          letterSpacing: 5,
          color: AMBER,
          textTransform: 'lowercase'
        }
      },
      input.eyebrow.toLowerCase()
    )
  );

  const titleNode = el(
    'div',
    {
      style: {
        fontFamily: 'Young Serif',
        fontSize: tSize,
        lineHeight: 1.06,
        letterSpacing: -1.4,
        color: INK,
        display: 'flex',
        maxWidth: 1024
      }
    },
    input.title
  );

  const descriptionNode = input.description
    ? el(
        'div',
        {
          style: {
            fontFamily: 'Alegreya',
            fontStyle: 'italic',
            fontSize: 32,
            lineHeight: 1.36,
            color: INK_SOFT,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            maxWidth: 980
          }
        },
        input.description
      )
    : null;

  const body = el(
    'div',
    {
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 28
      }
    },
    titleNode,
    descriptionNode
  );

  const rule = el('div', {
    style: { height: 1, background: RULE, display: 'flex' }
  });

  // Footer baseline alignment: Satori doesn't compute text baselines the way
  // real CSS does, so `alignItems: baseline` between a 20px mono line and a
  // 28px serif mark drifts. We anchor both sides to the same bottom edge and
  // clamp line-heights to 1 so their descenders share a floor.
  const footerLeft = el(
    'div',
    {
      style: {
        display: 'flex',
        alignItems: 'flex-end',
        gap: 14,
        fontFamily: 'Commit Mono',
        fontSize: 20,
        lineHeight: 1,
        color: INK_MUTED,
        letterSpacing: 0.4
      }
    },
    el('span', { style: { color: AMBER } }, '$'),
    el('span', {}, input.footerLeft),
    input.footerRight
      ? el('span', { style: { color: RULE } }, '·')
      : null,
    input.footerRight ? el('span', {}, input.footerRight) : null
  );

  const footerRight = el(
    'div',
    {
      style: {
        display: 'flex',
        alignItems: 'flex-end',
        fontFamily: 'Young Serif',
        fontSize: 26,
        lineHeight: 1,
        color: INK,
        letterSpacing: -0.3
      }
    },
    el('span', {}, 'disnetdev'),
    el('span', { style: { color: AMBER } }, '.')
  );

  const statusLine = el(
    'div',
    {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end'
      }
    },
    footerLeft,
    footerRight
  );

  const footer = el(
    'div',
    {
      style: { display: 'flex', flexDirection: 'column', gap: 20 }
    },
    rule,
    statusLine
  );

  return el(
    'div',
    {
      style: {
        width: WIDTH,
        height: HEIGHT,
        background: PAGE,
        padding: '72px 88px 64px',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Alegreya',
        color: INK
      }
    },
    eyebrow,
    body,
    footer
  );
}

export const OG_WIDTH = WIDTH;
export const OG_HEIGHT = HEIGHT;
