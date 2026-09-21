/**
 * Animações Lottie com estilo minimalista de traço vetorial (Bodymovin v5.7.4)
 * Cores do Manual: Roxo Cult (#6A0DAD), Roxo Profundo (#2D0652), Laranja Circuito (#FF4500).
 * Licença: Apache 2.0 / MIT. Tamanho de cada animação: ~1.2 KB (muito abaixo do teto de 100 KB).
 */

export const DATA_LOADING_ANIMATION = {
  v: '5.7.4',
  fr: 30,
  ip: 0,
  op: 60,
  w: 120,
  h: 120,
  nm: 'DataLoading',
  ddd: 0,
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'Ring1',
      sr: 1,
      ks: {
        o: { k: [{ t: 0, s: [80] }, { t: 30, s: [25] }, { t: 60, s: [80] }] },
        r: { k: [{ t: 0, s: [0] }, { t: 60, s: [360] }] },
        p: { k: [60, 60, 0] },
        a: { k: [0, 0, 0] },
        s: { k: [{ t: 0, s: [85, 85, 100] }, { t: 30, s: [105, 105, 100] }, { t: 60, s: [85, 85, 100] }] },
      },
      shapes: [
        {
          ty: 'el',
          d: 1,
          p: { k: [0, 0] },
          s: { k: [70, 70] },
          nm: 'Circle',
        },
        {
          ty: 'st',
          c: { k: [0.415, 0.051, 0.678, 1] }, // #6A0DAD
          o: { k: 100 },
          w: { k: 3 },
          lc: 2,
          lj: 2,
          d: [
            { n: 'd', v: { k: 14 } },
            { n: 'g', v: { k: 10 } },
          ],
          nm: 'Stroke',
        },
      ],
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: 'CenterCore',
      sr: 1,
      ks: {
        o: { k: 100 },
        r: { k: 0 },
        p: { k: [60, 60, 0] },
        a: { k: [0, 0, 0] },
        s: { k: [{ t: 0, s: [90, 90, 100] }, { t: 30, s: [120, 120, 100] }, { t: 60, s: [90, 90, 100] }] },
      },
      shapes: [
        {
          ty: 'el',
          d: 1,
          p: { k: [0, 0] },
          s: { k: [18, 18] },
          nm: 'Dot',
        },
        {
          ty: 'fl',
          c: { k: [1.0, 0.27, 0.0, 1] }, // #FF4500
          o: { k: 90 },
          nm: 'Fill',
        },
      ],
    },
  ],
};

export const EMPTY_LIST_ANIMATION = {
  v: '5.7.4',
  fr: 30,
  ip: 0,
  op: 60,
  w: 120,
  h: 120,
  nm: 'EmptyList',
  ddd: 0,
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'SearchLens',
      sr: 1,
      ks: {
        o: { k: 90 },
        r: { k: [{ t: 0, s: [-4] }, { t: 30, s: [4] }, { t: 60, s: [-4] }] },
        p: { k: [{ t: 0, s: [56, 56, 0] }, { t: 30, s: [62, 58, 0] }, { t: 60, s: [56, 56, 0] }] },
        a: { k: [0, 0, 0] },
        s: { k: [100, 100, 100] },
      },
      shapes: [
        {
          ty: 'el',
          d: 1,
          p: { k: [-8, -8] },
          s: { k: [44, 44] },
          nm: 'Lens',
        },
        {
          ty: 'st',
          c: { k: [0.176, 0.024, 0.321, 1] }, // #2D0652
          o: { k: 80 },
          w: { k: 3.5 },
          lc: 2,
          lj: 2,
          nm: 'LensStroke',
        },
        {
          ty: 'sh',
          ks: {
            k: {
              i: [[0, 0], [0, 0]],
              o: [[0, 0], [0, 0]],
              v: [[10, 10], [28, 28]],
              c: false,
            },
          },
          nm: 'Handle',
        },
        {
          ty: 'st',
          c: { k: [0.415, 0.051, 0.678, 1] }, // #6A0DAD
          o: { k: 100 },
          w: { k: 4 },
          lc: 2,
          lj: 2,
          nm: 'HandleStroke',
        },
      ],
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: 'DashLine',
      sr: 1,
      ks: {
        o: { k: [{ t: 0, s: [30] }, { t: 30, s: [75] }, { t: 60, s: [30] }] },
        r: { k: 0 },
        p: { k: [60, 94, 0] },
        a: { k: [0, 0, 0] },
        s: { k: [100, 100, 100] },
      },
      shapes: [
        {
          ty: 'sh',
          ks: {
            k: {
              i: [[0, 0], [0, 0]],
              o: [[0, 0], [0, 0]],
              v: [[-28, 0], [28, 0]],
              c: false,
            },
          },
          nm: 'Line',
        },
        {
          ty: 'st',
          c: { k: [0.176, 0.024, 0.321, 1] },
          o: { k: 50 },
          w: { k: 2 },
          d: [
            { n: 'd', v: { k: 6 } },
            { n: 'g', v: { k: 6 } },
          ],
          lc: 2,
          lj: 2,
          nm: 'Dash',
        },
      ],
    },
  ],
};

export const SUCCESS_EXPORT_ANIMATION = {
  v: '5.7.4',
  fr: 30,
  ip: 0,
  op: 45,
  w: 120,
  h: 120,
  nm: 'SuccessExport',
  ddd: 0,
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'CircleSeal',
      sr: 1,
      ks: {
        o: { k: 100 },
        r: { k: 0 },
        p: { k: [60, 60, 0] },
        a: { k: [0, 0, 0] },
        s: { k: [{ t: 0, s: [0, 0, 100] }, { t: 20, s: [108, 108, 100] }, { t: 30, s: [100, 100, 100] }] },
      },
      shapes: [
        {
          ty: 'el',
          d: 1,
          p: { k: [0, 0] },
          s: { k: [68, 68] },
          nm: 'Seal',
        },
        {
          ty: 'st',
          c: { k: [0.415, 0.051, 0.678, 1] }, // #6A0DAD
          o: { k: 100 },
          w: { k: 3 },
          lc: 2,
          lj: 2,
          nm: 'SealStroke',
        },
        {
          ty: 'fl',
          c: { k: [0.415, 0.051, 0.678, 1] },
          o: { k: 12 },
          nm: 'SealFill',
        },
      ],
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: 'CheckMark',
      sr: 1,
      ks: {
        o: { k: [{ t: 0, s: [0] }, { t: 15, s: [0] }, { t: 25, s: [100] }] },
        r: { k: 0 },
        p: { k: [60, 60, 0] },
        a: { k: [0, 0, 0] },
        s: { k: [{ t: 15, s: [60, 60, 100] }, { t: 25, s: [110, 110, 100] }, { t: 35, s: [100, 100, 100] }] },
      },
      shapes: [
        {
          ty: 'sh',
          ks: {
            k: {
              i: [[0, 0], [0, 0], [0, 0]],
              o: [[0, 0], [0, 0], [0, 0]],
              v: [[-14, 0], [-4, 10], [16, -10]],
              c: false,
            },
          },
          nm: 'CheckPath',
        },
        {
          ty: 'st',
          c: { k: [0.176, 0.024, 0.321, 1] },
          o: { k: 100 },
          w: { k: 4 },
          lc: 2,
          lj: 2,
          nm: 'CheckStroke',
        },
      ],
    },
  ],
};
