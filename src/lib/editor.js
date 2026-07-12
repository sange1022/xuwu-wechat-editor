import { marked } from 'marked';

export const appName = '戌無公众号排版工具';

export const templates = [
  {
    id: 'nature',
    name: '自然影像',
    description: '自然影像、顶部大图、窄栏正文',
    className: 'nature-template',
    cover: 'nature',
    width: 430,
    colors: {
      paper: '#f8f5ed',
      text: '#4e493f',
      muted: '#6b6559',
      accent: '#8d7d65',
      line: '#54504833'
    }
  },
  {
    id: 'essay',
    name: '图文随笔',
    description: '图片穿插、舒展正文、杂志感',
    className: 'image-essay-template',
    cover: 'essay',
    width: 460,
    colors: {
      paper: '#fbfaf6',
      text: '#3f3a32',
      muted: '#686158',
      accent: '#76664a',
      line: '#504c4428'
    }
  },
  {
    id: 'hero',
    name: '封面开场',
    description: '首屏封面、标题叠图、适合故事',
    className: 'hero-template',
    cover: 'hero',
    width: 440,
    colors: {
      paper: '#f5f1e8',
      text: '#413b32',
      muted: '#686056',
      accent: '#6e5d42',
      line: '#504c4430'
    }
  },
  {
    id: 'poetic',
    name: '诗意留白',
    description: '细线网格、居中排版、大留白',
    className: 'poetic-template',
    cover: 'poetic',
    width: 430,
    colors: {
      paper: '#faf8f3',
      text: '#504a40',
      muted: '#777066',
      accent: '#9b6b73',
      line: '#504c4420'
    }
  },
  {
    id: 'chapter',
    name: '章节卡片',
    description: '分章卡片、清晰层级、长文友好',
    className: 'chapter-template',
    cover: 'chapter',
    width: 450,
    colors: {
      paper: '#f7f4ed',
      text: '#4c463d',
      muted: '#6a6258',
      accent: '#6c5b44',
      line: '#504c4426'
    }
  },
  {
    id: 'pure-white',
    name: '纯白背景',
    description: '白底黑字、极简留白、通用长图',
    className: 'pure-white-template',
    cover: 'white',
    width: 430,
    colors: {
      paper: '#ffffff',
      text: '#1d1d1f',
      muted: '#3f3f46',
      accent: '#111827',
      line: '#e5e7eb'
    }
  }
];

export const accentPresets = ['#8d7d65', '#9b6b73', '#506f73', '#6a5d8f', '#a1644d'];

export const imageRatioOptions = [
  { id: 'story', label: '9:16', value: '9 / 16' },
  { id: 'square', label: '1:1', value: '1 / 1' },
  { id: 'cinema', label: '21:9', value: '21 / 9' },
  { id: 'classic', label: '4:3', value: '4 / 3' },
  { id: 'portrait', label: '3:4', value: '3 / 4' },
  { id: 'cover', label: '4:5', value: '4 / 5' }
];

export const fontOptions = [
  {
    id: 'system',
    label: '系统默认',
    value: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Microsoft YaHei", sans-serif'
  },
  {
    id: 'pingfang',
    label: '苹方黑体',
    value: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'
  },
  {
    id: 'source-serif',
    label: '思源宋体',
    value: '"Source Han Serif SC", "Source Han Serif CN", "Noto Serif CJK SC", "Noto Serif SC", "思源宋体", "思源宋體", "Songti SC", SimSun, serif'
  },
  {
    id: 'source-sans',
    label: '思源黑体',
    value: '"Source Han Sans SC", "Source Han Sans CN", "Noto Sans CJK SC", "Noto Sans SC", "思源黑体", "思源黑體", "PingFang SC", "Microsoft YaHei", sans-serif'
  },
  {
    id: 'huiwen-ming',
    label: '汇文明朝',
    value: '"Huiwen-mincho", "Huiwen Mincho", "汇文明朝体", "汇文明朝", "Noto Serif SC", "Songti SC", SimSun, serif'
  },
  {
    id: 'huiwen-fangsong',
    label: '汇文仿宋',
    value: '"Huiwen-fangsong", "Huiwen Fangsong", "汇文仿宋", FangSong, STFangsong, "Songti SC", serif'
  },
  {
    id: 'serif',
    label: '宋体正文',
    value: '"Noto Serif SC", "Songti SC", SimSun, serif'
  },
  {
    id: 'heiti',
    label: '黑体标题',
    value: '"Heiti SC", SimHei, "PingFang SC", "Microsoft YaHei", sans-serif'
  },
  {
    id: 'kaiti',
    label: '楷体手写',
    value: 'KaiTi, STKaiti, "Kaiti SC", "Songti SC", serif'
  },
  {
    id: 'fangsong',
    label: '仿宋长文',
    value: 'FangSong, STFangsong, "Songti SC", serif'
  },
  {
    id: 'lxgw-wenkai',
    label: '霞鹜文楷',
    value: '"LXGW WenKai", "霞鹜文楷", KaiTi, STKaiti, "Kaiti SC", serif'
  },
  {
    id: 'mono',
    label: '等宽代码',
    value: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace'
  }
];

export const canvasWidthPresets = [
  { id: 'wechat', label: '公众号', width: 430 },
  { id: 'miniapp', label: '小程序', width: 375 },
  { id: 'phone', label: '手机海报', width: 390 },
  { id: 'redbook', label: '小红书', width: 720 },
  { id: 'custom', label: '自定义', width: null }
];

export const defaultSplitSettings = {
  enabled: false,
  mode: 'equal',
  parts: 3,
  cuts: '50'
};

export function getFontFamily(fontId) {
  return fontOptions.find((option) => option.id === fontId)?.value || fontOptions[0].value;
}

export function parseSplitCuts(cuts) {
  return String(cuts || '')
    .split(/[,，\s]+/)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0 && value < 100)
    .map((value) => Math.round(value * 10) / 10)
    .sort((a, b) => a - b)
    .filter((value, index, list) => index === 0 || value !== list[index - 1]);
}

export function formatSplitCuts(cuts) {
  return parseSplitCuts(Array.isArray(cuts) ? cuts.join(',') : cuts)
    .map((value) => Number.isInteger(value) ? String(value) : String(value.toFixed(1)))
    .join(', ');
}

export function updateSplitCut(cuts, targetIndex, nextValue) {
  const values = parseSplitCuts(cuts);
  const nextValues = values.length ? values : [50];
  nextValues[targetIndex] = Math.min(99, Math.max(1, Math.round(Number(nextValue) || 1)));
  return formatSplitCuts(nextValues);
}

export function createSplitSegments(totalHeight, splitSettings = defaultSplitSettings) {
  const height = Math.max(1, Math.round(Number(totalHeight) || 1));
  if (!splitSettings.enabled) return [{ index: 0, start: 0, end: height, height }];

  const parts = Math.min(9, Math.max(2, Math.round(Number(splitSettings.parts) || 2)));
  const boundaries = splitSettings.mode === 'free'
    ? [0, ...parseSplitCuts(splitSettings.cuts).map((percent) => Math.round(height * (percent / 100))), height]
    : Array.from({ length: parts + 1 }, (_, index) => Math.round(height * (index / parts)));

  return boundaries
    .map((start, index) => ({ start, end: boundaries[index + 1] }))
    .filter((segment) => Number.isFinite(segment.end) && segment.end > segment.start)
    .map((segment, index) => ({
      index,
      start: segment.start,
      end: segment.end,
      height: segment.end - segment.start
    }));
}

export function syncScrollTop({ sourceTop, sourceMax, targetMax }) {
  if (!sourceMax || sourceMax <= 0 || !targetMax || targetMax <= 0) return 0;
  const ratio = Math.min(1, Math.max(0, sourceTop / sourceMax));
  return Math.round(ratio * targetMax);
}

const markdownImagePattern = /!\[([^\]]*)\]\(([^)\n]+)\)/g;
const imageAssetPrefix = 'asset://';

function resolveImageAssets(markdown, imageAssets = {}) {
  return markdown.replace(markdownImagePattern, (match, alt, source) => {
    if (!source.startsWith(imageAssetPrefix)) return match;
    const assetId = source.slice(imageAssetPrefix.length);
    const resolved = imageAssets[assetId];
    return resolved ? `![${alt}](${resolved})` : match;
  });
}

export function createImageAssetToken(assetId, alt = '图片说明') {
  return `![${alt}](${imageAssetPrefix}${assetId})`;
}

export function convertMarkdownImagesToAssets(markdown, existingAssets = {}, createId = () => `img-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`) {
  const assets = { ...existingAssets };
  let changed = false;
  const nextMarkdown = markdown.replace(markdownImagePattern, (match, alt, source) => {
    if (source.startsWith(imageAssetPrefix)) return match;
    const assetId = createId();
    assets[assetId] = source;
    changed = true;
    return createImageAssetToken(assetId, alt || '图片说明');
  });

  return { markdown: nextMarkdown, assets, changed };
}

export function replaceMarkdownImageAt(markdown, targetIndex, nextSource, nextAlt) {
  let index = 0;
  return markdown.replace(markdownImagePattern, (match, alt) => {
    if (index !== targetIndex) {
      index += 1;
      return match;
    }
    index += 1;
    return `![${nextAlt || alt || '图片说明'}](${nextSource})`;
  });
}

export function deleteMarkdownImageAt(markdown, targetIndex) {
  let index = 0;
  return markdown.replace(markdownImagePattern, (match) => {
    if (index !== targetIndex) {
      index += 1;
      return match;
    }
    index += 1;
    return '';
  }).replace(/\n{3,}/g, '\n\n');
}

marked.setOptions({
  breaks: false,
  gfm: true,
  mangle: false,
  headerIds: false
});

function cleanHtml(html) {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '');
}

export function renderMarkdown(markdown, imageAssets = {}) {
  const raw = cleanHtml(marked.parse(resolveImageAssets(markdown || '', imageAssets)));
  const document = new DOMParser().parseFromString(`<main>${raw}</main>`, 'text/html');
  const root = document.querySelector('main');

  root.querySelectorAll('h1').forEach((node) => node.className = 'article-h1');
  root.querySelectorAll('h2').forEach((node) => node.className = 'article-h2');
  root.querySelectorAll('h3,h4,h5,h6').forEach((node) => node.className = 'article-h3');
  root.querySelectorAll('p').forEach((node) => {
    if (!node.closest('blockquote, li, td, th')) node.className = 'article-p';
  });
  root.querySelectorAll('blockquote').forEach((node) => {
    node.className = 'article-quote';
  });
  root.querySelectorAll('ul').forEach((node) => {
    node.className = 'article-list article-list-unordered article-list-depth-0';
  });
  root.querySelectorAll('ol').forEach((node) => {
    node.className = 'article-list article-list-ordered article-list-depth-0';
  });
  root.querySelectorAll('hr').forEach((node) => {
    const divider = document.createElement('div');
    divider.className = 'article-divider';
    divider.innerHTML = '<span></span>';
    node.replaceWith(divider);
  });
  root.querySelectorAll('table').forEach((table) => {
    table.className = 'article-table';
    const wrap = document.createElement('div');
    wrap.className = 'article-table-wrap';
    table.replaceWith(wrap);
    wrap.appendChild(table);
  });
  root.querySelectorAll('img').forEach((img, index) => {
    const figure = document.createElement('figure');
    figure.className = 'article-image adjustable-image';
    figure.dataset.imageIndex = String(index);
    if (!img.src.startsWith('data:')) img.crossOrigin = 'anonymous';
    img.replaceWith(figure);
    figure.appendChild(img);
  });
  root.querySelectorAll('p').forEach((paragraph) => {
    if (paragraph.children.length === 1 && paragraph.firstElementChild?.classList.contains('article-image')) {
      paragraph.replaceWith(paragraph.firstElementChild);
    }
  });

  return root.innerHTML;
}

export function createArticleVars(settings) {
  return {
    '--article-accent-color': settings.accent,
    '--article-accent-soft-color': `${settings.accent}33`,
    '--article-page-margin': `${settings.pageMargin}px`,
    '--article-body-block': `${settings.bodyBlock}px`,
    '--article-font-size': `${settings.fontSize}px`,
    '--article-font-family': getFontFamily(settings.fontFamily),
    '--article-line-height': String(settings.lineHeight),
    '--article-radius': `${settings.radius}px`,
    '--article-image-gap': `${settings.imageGap}px`,
    '--article-image-ratio': settings.imageRatio || 'auto',
    '--article-canvas-width': `${settings.canvasWidth || 430}px`
  };
}

export const defaultMarkdown = `# 雨后的城市植物志

清晨的风把窗帘吹开，街角的梧桐叶还挂着昨夜的雨。我们总以为城市只属于玻璃、道路和灯牌，其实它也悄悄给植物留了很多缝隙。

![雨后的叶片](https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80)

## 一点缓慢的观察

如果你愿意放慢脚步，会看见很多细小的秩序：

- 花坛边缘总有最先探出来的新芽
- 树影会在午后把墙面分成几块柔软的光
- 雨水退去以后，叶脉比路牌更清楚

> 好看的排版不只是装饰，它让文字获得呼吸，也让阅读者愿意多停留一会儿。

### 今日记录

| 时间 | 看到的事物 | 心情 |
| --- | --- | --- |
| 07:20 | 一片发亮的叶子 | 安静 |
| 12:10 | 墙根的小花 | 明亮 |
| 18:45 | 路灯下的树影 | 松弛 |

---

把普通日子写成文章之前，先把它们认真看一遍。`;

export const defaultSettings = {
  accent: '#8d7d65',
  pageMargin: 34,
  bodyBlock: 42,
  fontSize: 14,
  lineHeight: 1.95,
  radius: 18,
  imageGap: 48,
  imageRatio: '4 / 3',
  canvasWidth: 430,
  fontFamily: 'system'
};
