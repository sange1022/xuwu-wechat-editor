import { describe, expect, it } from 'vitest';
import {
  appName,
  canvasWidthPresets,
  createArticleVars,
  fontOptions,
  getFontFamily,
  imageRatioOptions,
  createImageAssetToken,
  convertMarkdownImagesToAssets,
  deleteMarkdownImageAt,
  renderMarkdown,
  replaceMarkdownImageAt,
  syncScrollTop,
  templates
} from './editor.js';

describe('renderMarkdown', () => {
  it('turns headings, emphasis, quotes, lists, tables, and dividers into article markup', () => {
    const html = renderMarkdown(`# 标题

## 小节

一段 **重点** 和 *轻声*。

> 引用文字

- 第一项
- 第二项

| 名称 | 数值 |
| --- | --- |
| 阅读 | 1200 |

---`);

    expect(html).toContain('class="article-h1"');
    expect(html).toContain('class="article-h2"');
    expect(html).toContain('<strong>重点</strong>');
    expect(html).toContain('<em>轻声</em>');
    expect(html).toContain('class="article-quote"');
    expect(html).toContain('article-list-unordered');
    expect(html).toContain('article-table-wrap');
    expect(html).toContain('article-divider');
  });

  it('renders image tokens as adjustable article image blocks', () => {
    const html = renderMarkdown('![山林](asset://img-1)', { 'img-1': 'https://example.com/forest.jpg' });

    expect(html).toContain('class="article-image adjustable-image"');
    expect(html).toContain('data-image-index="0"');
    expect(html).toContain('src="https://example.com/forest.jpg"');
    expect(html).toContain('crossorigin="anonymous"');
    expect(html).toContain('alt="山林"');
  });
});

describe('style helpers', () => {
  it('maps settings into CSS custom properties used by the preview', () => {
    const vars = createArticleVars({
      accent: '#8d7d65',
      pageMargin: 38,
      bodyBlock: 46,
      fontSize: 15,
      lineHeight: 2,
      radius: 18,
      imageGap: 42,
      imageRatio: '4 / 3',
      canvasWidth: 375,
      fontFamily: 'serif'
    });

    expect(vars['--article-accent-color']).toBe('#8d7d65');
    expect(vars['--article-page-margin']).toBe('38px');
    expect(vars['--article-font-size']).toBe('15px');
    expect(vars['--article-line-height']).toBe('2');
    expect(vars['--article-image-ratio']).toBe('4 / 3');
    expect(vars['--article-canvas-width']).toBe('375px');
    expect(vars['--article-font-family']).toContain('Noto Serif SC');
  });

  it('ships common canvas width presets for other apps', () => {
    expect(canvasWidthPresets.map((preset) => preset.label)).toEqual([
      '公众号',
      '小程序',
      '手机海报',
      '小红书',
      '自定义'
    ]);
    expect(canvasWidthPresets.map((preset) => preset.width)).toEqual([430, 375, 390, 720, null]);
  });

  it('ships template choices including a pure white background option', () => {
    expect(templates.map((template) => template.name)).toEqual([
      '自然影像',
      '图文随笔',
      '封面开场',
      '诗意留白',
      '章节卡片',
      '纯白背景'
    ]);
    expect(templates.find((template) => template.id === 'pure-white')?.colors.paper).toBe('#ffffff');
  });

  it('ships common image ratio choices for article image blocks', () => {
    expect(imageRatioOptions.map((option) => option.label)).toEqual([
      '9:16',
      '1:1',
      '21:9',
      '4:3',
      '3:4',
      '4:5'
    ]);
    expect(imageRatioOptions.map((option) => option.value)).toEqual([
      '9 / 16',
      '1 / 1',
      '21 / 9',
      '4 / 3',
      '3 / 4',
      '4 / 5'
    ]);
  });

  it('ships common Chinese font choices and the requested app name', () => {
    expect(appName).toBe('戌無公众号排版工具');
    expect(fontOptions.map((option) => option.label)).toEqual([
      '系统默认',
      '苹方黑体',
      '汇文明朝',
      '汇文仿宋',
      '宋体正文',
      '黑体标题',
      '楷体手写',
      '仿宋长文',
      '霞鹜文楷',
      '等宽代码'
    ]);
    expect(getFontFamily('huiwen-ming')).toContain('汇文明朝体');
    expect(getFontFamily('huiwen-fangsong')).toContain('汇文仿宋');
  });

  it('maps a source scroll position to the same relative preview position', () => {
    expect(syncScrollTop({ sourceTop: 250, sourceMax: 1000, targetMax: 2000 })).toBe(500);
    expect(syncScrollTop({ sourceTop: 0, sourceMax: 0, targetMax: 2000 })).toBe(0);
    expect(syncScrollTop({ sourceTop: 1200, sourceMax: 1000, targetMax: 2000 })).toBe(2000);
  });

  it('replaces and deletes a specific markdown image by index', () => {
    const markdown = 'A\n![one](one.jpg)\nB\n![two](two.jpg)\nC';

    expect(replaceMarkdownImageAt(markdown, 1, 'new.jpg', '替换图')).toContain('![替换图](new.jpg)');
    expect(replaceMarkdownImageAt(markdown, 1, 'new.jpg', '替换图')).toContain('![one](one.jpg)');
    expect(deleteMarkdownImageAt(markdown, 0)).not.toContain('one.jpg');
    expect(deleteMarkdownImageAt(markdown, 0)).toContain('two.jpg');
  });

  it('creates a short image asset token for editor insertion', () => {
    expect(createImageAssetToken('img-2026', '上传图片')).toBe('![上传图片](asset://img-2026)');
  });

  it('converts existing long image URLs into short asset tokens', () => {
    const result = convertMarkdownImagesToAssets('![旧图](https://example.com/a-very-long-image.jpg)', {}, () => 'img-fixed');

    expect(result.markdown).toBe('![旧图](asset://img-fixed)');
    expect(result.assets['img-fixed']).toBe('https://example.com/a-very-long-image.jpg');
  });
});
