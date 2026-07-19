import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { toPng } from 'html-to-image';
import {
  Bold,
  ChevronDown,
  Code2,
  Copy,
  Download,
  Eye,
  FileText,
  ImagePlus,
  Heading1,
  Heading2,
  HelpCircle,
  Image,
  Italic,
  List,
  ListOrdered,
  Maximize2,
  Minus,
  Palette,
  Quote,
  RotateCcw,
  Scissors,
  Table2,
  Upload,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import {
  accentPresets,
  appName,
  canvasWidthPresets,
  createArticleVars,
  createImageAssetToken,
  createSplitSegments,
  convertMarkdownImagesToAssets,
  defaultMarkdown,
  defaultSettings,
  defaultSplitSettings,
  deleteMarkdownImageAt,
  formatSplitCuts,
  fontOptions,
  imageRatioOptions,
  parseSplitCuts,
  renderMarkdown,
  replaceMarkdownImageAt,
  syncScrollTop,
  templates,
  updateSplitCut
} from './lib/editor.js';
import './styles.css';

function useLocalState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setStoredValue = (next) => {
    setValue((current) => {
      const resolved = typeof next === 'function' ? next(current) : next;
      localStorage.setItem(key, JSON.stringify(resolved));
      return resolved;
    });
  };

  return [value, setStoredValue];
}

function insertAround(textarea, before, after = '', fallback = '') {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.slice(start, end) || fallback;
  return {
    value: `${textarea.value.slice(0, start)}${before}${selected}${after}${textarea.value.slice(end)}`,
    selectionStart: start + before.length,
    selectionEnd: start + before.length + selected.length
  };
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function imageSourceToDataUrl(source) {
  if (!source || source.startsWith('data:') || source.startsWith('blob:')) return source;
  const response = await fetch(source, { mode: 'cors', cache: 'force-cache' });
  if (!response.ok) throw new Error('image fetch failed');
  return blobToDataUrl(await response.blob());
}

function waitForImage(image) {
  if (image.complete && image.naturalWidth > 0) return Promise.resolve();
  return new Promise((resolve) => {
    image.onload = () => resolve();
    image.onerror = () => resolve();
  });
}

async function createExportCloneWithImages(sourceNode) {
  const clone = sourceNode.cloneNode(true);
  const sourceImages = [...sourceNode.querySelectorAll('img')];
  const cloneImages = [...clone.querySelectorAll('img')];

  await Promise.all(sourceImages.map(async (image, index) => {
    const cloneImage = cloneImages[index];
    if (!cloneImage) return;
    try {
      cloneImage.src = await imageSourceToDataUrl(image.currentSrc || image.src);
    } catch {
      cloneImage.crossOrigin = 'anonymous';
      cloneImage.src = image.currentSrc || image.src;
    }
  }));

  await Promise.all(cloneImages.map(waitForImage));

  const wrapper = document.createElement('div');
  wrapper.className = 'export-clone-host';
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);
  return { clone, wrapper };
}

function downloadDataUrl(url, filename) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
}

function loadImageFromDataUrl(url) {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

async function cropExportDataUrl(sourceUrl, segment, sourceCssHeight, backgroundColor) {
  const image = await loadImageFromDataUrl(sourceUrl);
  const scale = image.naturalHeight / Math.max(1, sourceCssHeight);
  const sourceY = Math.round(segment.start * scale);
  const sourceHeight = Math.max(1, Math.round(segment.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = sourceHeight;
  const context = canvas.getContext('2d');
  context.fillStyle = backgroundColor || '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, sourceY, image.naturalWidth, sourceHeight, 0, 0, canvas.width, sourceHeight);
  return canvas.toDataURL('image/png');
}

function App() {
  const [markdown, setMarkdown] = useLocalState('flipped-local-markdown', defaultMarkdown);
  const [settings, setSettings] = useLocalState('flipped-local-settings', defaultSettings);
  const [templateId, setTemplateId] = useLocalState('flipped-local-template', 'nature');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80');
  const [imageAssets, setImageAssets] = useLocalState('flipped-local-image-assets', {});
  const [previewMode, setPreviewMode] = useState('wechat');
  const [previewZoom, setPreviewZoom] = useLocalState('flipped-local-preview-zoom', 1);
  const [previewFitScale, setPreviewFitScale] = useState(1);
  const [toast, setToast] = useState('');
  const [copyOpen, setCopyOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [cropPositions, setCropPositions] = useLocalState('flipped-local-image-crops', {});
  const [splitSettings, setSplitSettings] = useLocalState('flipped-local-split-settings', defaultSplitSettings);
  const [replaceImageIndex, setReplaceImageIndex] = useState(null);
  const textareaRef = useRef(null);
  const exportRef = useRef(null);
  const imageFileRef = useRef(null);
  const replaceFileRef = useRef(null);
  const previewStageRef = useRef(null);
  const scrollSyncRef = useRef(null);
  const dragImageRef = useRef(null);

  const template = templates.find((item) => item.id === templateId) || templates[0];
  const articleHtml = useMemo(() => renderMarkdown(markdown, imageAssets), [markdown, imageAssets]);
  const articleVars = useMemo(() => ({
    ...createArticleVars({ ...defaultSettings, ...settings }),
    '--article-paper': template.colors.paper,
    '--article-text-color': template.colors.text,
    '--article-muted-color': template.colors.muted,
    '--article-line-color': template.colors.line
  }), [settings, template]);

  const activeSettings = { ...defaultSettings, ...settings };
  const activeSplitSettings = { ...defaultSplitSettings, ...splitSettings };
  const activePreviewZoom = Math.min(1.8, Math.max(0.6, Number(previewZoom) || 1));
  const effectivePreviewZoom = activePreviewZoom * previewFitScale;
  const freeCutValues = parseSplitCuts(activeSplitSettings.cuts);
  const activeFreeCutValues = freeCutValues.length ? freeCutValues : [50];
  const previewSplitSegments = createSplitSegments(100, activeSplitSettings);
  const previewCutLines = activeSplitSettings.enabled
    ? previewSplitSegments.slice(1).map((segment) => segment.start)
    : [];
  const lines = Math.max(12, markdown.split('\n').length);

  useEffect(() => {
    const result = convertMarkdownImagesToAssets(markdown, imageAssets);
    if (!result.changed) return;
    setMarkdown(result.markdown);
    setImageAssets(result.assets);
  }, []);

  useEffect(() => {
    const stage = previewStageRef.current;
    if (!stage) return undefined;

    const updateFitScale = () => {
      const style = window.getComputedStyle(stage);
      const horizontalPadding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const availableWidth = Math.max(1, stage.clientWidth - horizontalPadding);
      const nextScale = Math.min(1, availableWidth / Math.max(1, activeSettings.canvasWidth));
      setPreviewFitScale((current) => Math.abs(current - nextScale) < 0.002 ? current : nextScale);
    };

    updateFitScale();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(updateFitScale);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [activeSettings.canvasWidth]);

  const format = (type) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const patterns = {
      h1: ['# ', '', '标题'],
      h2: ['## ', '', '小标题'],
      bold: ['**', '**', '重点文字'],
      italic: ['*', '*', '斜体文字'],
      quote: ['> ', '', '引用文字'],
      ul: ['- ', '', '列表项'],
      ol: ['1. ', '', '列表项'],
      divider: ['\n---\n', '', ''],
      image: [`\n![图片说明](${imageUrl.trim() || 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80'})\n`, '', ''],
      table: ['\n| 名称 | 数值 |\n| --- | --- |\n| 阅读 | 1200 |\n', '', '']
    };
    const [before, after, fallback] = patterns[type];
    const next = insertAround(textarea, before, after, fallback);
    setMarkdown(next.value);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(next.selectionStart, next.selectionEnd);
    });
  };

  const createImageAsset = (source) => {
    const id = `img-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    setImageAssets((current) => ({ ...current, [id]: source }));
    return id;
  };

  const insertImage = (source, alt = '图片说明') => {
    const textarea = textareaRef.current;
    if (!textarea || !source) return;
    const assetId = createImageAsset(source);
    const next = insertAround(textarea, `\n${createImageAssetToken(assetId, alt)}\n`, '', '');
    setMarkdown(next.value);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(next.selectionStart, next.selectionEnd);
    });
  };

  const uploadImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setToast('请选择图片文件');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      insertImage(String(reader.result), file.name.replace(/\.[^.]+$/, '') || '上传图片');
      setImageUrl(String(reader.result));
      setToast('图片已上传并插入');
      event.target.value = '';
    };
    reader.onerror = () => {
      setToast('图片读取失败，请重新选择');
      event.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const replaceImage = (event) => {
    const file = event.target.files?.[0];
    if (!file || replaceImageIndex === null) return;
    if (!file.type.startsWith('image/')) {
      setToast('请选择图片文件');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const nextSource = String(reader.result);
      const assetId = createImageAsset(nextSource);
      setMarkdown((current) => replaceMarkdownImageAt(current, replaceImageIndex, `asset://${assetId}`, file.name.replace(/\.[^.]+$/, '') || '替换图片'));
      setCropPositions((current) => ({ ...current, [replaceImageIndex]: { x: 50, y: 50 } }));
      setImageUrl(nextSource);
      setToast('图片已替换');
      setReplaceImageIndex(null);
      event.target.value = '';
    };
    reader.onerror = () => {
      setToast('图片读取失败，请重新选择');
      event.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const copyText = async () => {
    await navigator.clipboard.writeText(markdown);
    setToast('已复制 Markdown 文本');
  };

  const copyHtml = async () => {
    const html = exportRef.current?.outerHTML || '';
    await navigator.clipboard.writeText(html);
    setToast('已复制全局样式 HTML');
    setCopyOpen(false);
  };

  const exportPng = async () => {
    if (!exportRef.current) return;
    setExporting(true);
    let exportClone;
    try {
      exportClone = await createExportCloneWithImages(exportRef.current);
      const canvas = exportClone.clone.querySelector('.article-canvas') || exportClone.clone;
      const rect = canvas.getBoundingClientRect();
      const exportHeight = Math.ceil(canvas.scrollHeight || rect.height);
      const segments = createSplitSegments(exportHeight, activeSplitSettings);
      const backgroundColor = getComputedStyle(canvas).backgroundColor || '#ffffff';
      const exportOptions = {
        cacheBust: true,
        pixelRatio: 2,
        filter: (node) => !node.classList?.contains('image-inline-actions') && !node.classList?.contains('split-guide-lines')
      };
      const fullExportUrl = await toPng(exportClone.clone, exportOptions);

      if (!activeSplitSettings.enabled) {
        downloadDataUrl(fullExportUrl, 'xuwu-editor-export.png');
        setToast('PNG 已导出');
      } else {
        for (const segment of segments) {
          const url = await cropExportDataUrl(fullExportUrl, segment, exportHeight, backgroundColor);
          downloadDataUrl(url, `xuwu-editor-export-${String(segment.index + 1).padStart(2, '0')}.png`);
        }
        setToast(`已导出 ${segments.length} 张切片`);
      }
    } catch {
      setToast('PNG 导出失败，请稍后再试');
    } finally {
      exportClone?.wrapper.remove();
      setExporting(false);
    }
  };

  const fullScreen = () => {
    exportRef.current?.requestFullscreen?.();
  };

  const changePreviewZoom = (delta) => {
    setPreviewZoom((current) => Math.min(1.8, Math.max(0.6, Math.round(((Number(current) || 1) + delta) * 10) / 10)));
  };

  const setFreeCutValue = (index, value) => {
    setSplitSettings((current) => ({
      ...current,
      enabled: true,
      mode: 'free',
      cuts: updateSplitCut(current.cuts || activeSplitSettings.cuts, index, value)
    }));
  };

  const addFreeCut = () => {
    const values = activeFreeCutValues;
    if (values.length >= 8) return;
    const nextValue = values.length === 1
      ? values[0] < 50 ? 75 : 25
      : Math.min(95, Math.max(5, values[values.length - 1] + 10));
    setSplitSettings((current) => ({
      ...current,
      enabled: true,
      mode: 'free',
      cuts: formatSplitCuts([...values, nextValue])
    }));
  };

  const removeFreeCut = () => {
    if (activeFreeCutValues.length <= 1) return;
    setSplitSettings((current) => ({
      ...current,
      enabled: true,
      mode: 'free',
      cuts: formatSplitCuts(activeFreeCutValues.slice(0, -1))
    }));
  };

  const syncScroll = (source, target) => {
    if (!source || !target || scrollSyncRef.current === source) return;
    const sourceMax = source.scrollHeight - source.clientHeight;
    const targetMax = target.scrollHeight - target.clientHeight;
    scrollSyncRef.current = target;
    target.scrollTop = syncScrollTop({ sourceTop: source.scrollTop, sourceMax, targetMax });
    window.setTimeout(() => {
      if (scrollSyncRef.current === target) scrollSyncRef.current = null;
    }, 80);
  };

  useEffect(() => {
    const stage = previewStageRef.current;
    if (!stage) return undefined;

    const figures = [...stage.querySelectorAll('.article-image[data-image-index]')];
    figures.forEach((figure) => {
      const index = Number(figure.dataset.imageIndex);
      const position = cropPositions[index] || { x: 50, y: 50 };
      const img = figure.querySelector('img');
      if (img) img.style.objectPosition = `${position.x}% ${position.y}%`;
      if (!figure.querySelector('.image-inline-actions')) {
        const actions = document.createElement('div');
        actions.className = 'image-inline-actions';
        actions.innerHTML = `
          <button type="button" data-image-action="drag" data-image-index="${index}">拖动裁切</button>
          <button type="button" data-image-action="replace" data-image-index="${index}">替换</button>
          <button type="button" data-image-action="delete" data-image-index="${index}">删除</button>
        `;
        figure.appendChild(actions);
      }
    });

    const handlePointerDown = (event) => {
      const dragButton = event.target.closest?.('[data-image-action="drag"]');
      if (!dragButton) return;
      event.preventDefault();
      const figure = dragButton.closest?.('.article-image[data-image-index]');
      if (!figure) return;
      const index = Number(figure.dataset.imageIndex);
      const position = cropPositions[index] || { x: 50, y: 50 };
      dragImageRef.current = {
        index,
        startX: event.clientX,
        startY: event.clientY,
        initialX: position.x,
        initialY: position.y,
        width: Math.max(1, figure.clientWidth),
        height: Math.max(1, figure.clientHeight)
      };
      figure.classList.add('is-panning');
      figure.setPointerCapture?.(event.pointerId);
    };

    const handlePointerMove = (event) => {
      const drag = dragImageRef.current;
      if (!drag) return;
      event.preventDefault();
      const nextX = Math.min(100, Math.max(0, drag.initialX + ((event.clientX - drag.startX) / drag.width) * 100));
      const nextY = Math.min(100, Math.max(0, drag.initialY + ((event.clientY - drag.startY) / drag.height) * 100));
      setCropPositions((current) => ({
        ...current,
        [drag.index]: { x: Math.round(nextX), y: Math.round(nextY) }
      }));
    };

    const finishDrag = () => {
      if (dragImageRef.current) {
        stage.querySelector(`[data-image-index="${dragImageRef.current.index}"]`)?.classList.remove('is-panning');
      }
      dragImageRef.current = null;
    };

    const handleClick = (event) => {
      const actionButton = event.target.closest?.('[data-image-action]');
      if (!actionButton) return;
      const index = Number(actionButton.dataset.imageIndex);
      if (actionButton.dataset.imageAction === 'delete') {
        setMarkdown((current) => deleteMarkdownImageAt(current, index));
        setCropPositions((current) => {
          const next = { ...current };
          delete next[index];
          return next;
        });
        setToast('图片已删除');
      }
      if (actionButton.dataset.imageAction === 'replace') {
        setReplaceImageIndex(index);
        replaceFileRef.current?.click();
      }
    };

    stage.addEventListener('pointerdown', handlePointerDown);
    stage.addEventListener('pointermove', handlePointerMove);
    stage.addEventListener('pointerup', finishDrag);
    stage.addEventListener('pointercancel', finishDrag);
    stage.addEventListener('click', handleClick);
    return () => {
      stage.removeEventListener('pointerdown', handlePointerDown);
      stage.removeEventListener('pointermove', handlePointerMove);
      stage.removeEventListener('pointerup', finishDrag);
      stage.removeEventListener('pointercancel', finishDrag);
      stage.removeEventListener('click', handleClick);
    };
  }, [articleHtml, cropPositions, setCropPositions, setMarkdown]);

  return (
    <main className="app-shell">
      <header className="app-toolbar">
        <div className="window-dots"><span /><span /><span /></div>
        <div className="toolbar-brand">
          <div className="brand-mark"><FileText size={20} /></div>
          <div className="brand-row">
            <h1>{appName}</h1>
            <p>Markdown to WeChat article studio</p>
          </div>
        </div>
        <div className="toolbar-actions">
          <button className="toolbar-button" onClick={copyText}><Copy size={15} />只复制文本样式</button>
          <div className="copy-menu">
            <button className="toolbar-button copy-menu-trigger" onClick={() => setCopyOpen(!copyOpen)}>
              <Copy size={15} />复制方式 <ChevronDown className={copyOpen ? 'copy-chevron open' : 'copy-chevron'} size={14} />
            </button>
            <div className={copyOpen ? 'copy-menu-popover open' : 'copy-menu-popover'}>
              <button onClick={copyText}>
                <span className="copy-option-icon text"><FileText size={17} /></span>
                <span><b>只复制文本样式</b><small>适合继续在编辑器中加工</small></span>
              </button>
              <button onClick={copyHtml}>
                <span className="copy-option-icon global"><Code2 size={17} /></span>
                <span><b>复制全局样式</b><small>包含预览区 HTML 和内联变量</small></span>
              </button>
            </div>
          </div>
          <button className="primary-button" onClick={exportPng} disabled={exporting}><Download size={15} />{exporting ? '导出中' : '导出 PNG'}</button>
        </div>
      </header>

      <section className="workspace">
        <aside className="editor-panel">
          <div className="editor-section">
            <section className="control-section image-control-section">
              <h2 className="section-title"><ImagePlus size={15} />插入图片 <small>选择比例后插入或调整预览</small></h2>
              <div className="image-insert-row">
                <input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="粘贴图片 URL" />
                <button onClick={() => insertImage(imageUrl.trim() || 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80')}><Image size={14} />插入</button>
                <button onClick={() => imageFileRef.current?.click()}><Upload size={14} />上传</button>
                <input ref={imageFileRef} className="image-upload-input" type="file" accept="image/*" onChange={uploadImage} />
              </div>
              <div className="segmented-grid ratio-grid">
                {imageRatioOptions.map((option) => (
                  <button
                    key={option.id}
                    className={activeSettings.imageRatio === option.value ? 'active' : ''}
                    onClick={() => setSettings((s) => ({ ...s, imageRatio: option.value }))}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="control-section markdown-title">
              <h2 className="section-title">
                <span className="markdown-title-icon"><FileText size={14} /></span>
                Markdown 输入
                <button className="markdown-guide-trigger" title="Markdown 语法参考"><HelpCircle size={14} /></button>
              </h2>
              <div className="markdown-format-toolbar">
                <div className="format-tool-group">
                  <button title="一级标题" onClick={() => format('h1')}><Heading1 size={15} /></button>
                  <button title="二级标题" onClick={() => format('h2')}><Heading2 size={15} /></button>
                  <button title="加粗" onClick={() => format('bold')}><Bold size={15} /></button>
                  <button title="斜体" onClick={() => format('italic')}><Italic size={15} /></button>
                  <span className="toolbar-divider" />
                  <button title="引用" onClick={() => format('quote')}><Quote size={15} /></button>
                  <button title="无序列表" onClick={() => format('ul')}><List size={15} /></button>
                  <button title="有序列表" onClick={() => format('ol')}><ListOrdered size={15} /></button>
                  <button title="分割线" onClick={() => format('divider')}><Minus size={15} /></button>
                  <button title="图片" onClick={() => insertImage(imageUrl.trim() || 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80')}><Image size={15} /></button>
                  <button title="表格" onClick={() => format('table')}><Table2 size={15} /></button>
                </div>
                <div className="accent-color-group">
                  {accentPresets.map((color) => (
                    <button key={color} className={activeSettings.accent === color ? 'active' : ''} title={color} onClick={() => setSettings((s) => ({ ...s, accent: color }))}>
                      <span style={{ background: color }} />
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <div className="code-editor-shell">
              <div className="line-gutter">{Array.from({ length: lines }).map((_, index) => <span key={index}>{index + 1}</span>)}</div>
              <textarea
                ref={textareaRef}
                value={markdown}
                onChange={(event) => setMarkdown(event.target.value)}
                onScroll={(event) => syncScroll(event.currentTarget, previewStageRef.current)}
                placeholder="Paste your Markdown here..."
              />
            </div>
          </div>
        </aside>

        <section className="preview-panel">
          <input ref={replaceFileRef} className="image-upload-input" type="file" accept="image/*" onChange={replaceImage} />
          <div className="preview-mode-switch">
            <button className={previewMode === 'wechat' ? 'active' : ''} onClick={() => setPreviewMode('wechat')}>公众号</button>
            <button className={previewMode === 'html' ? 'active' : ''} onClick={() => setPreviewMode('html')}>HTML</button>
          </div>
          <div className="preview-zoom-tools">
            <button title="缩小预览" onClick={() => changePreviewZoom(-0.1)}><ZoomOut size={14} /></button>
            <span>{Math.round(effectivePreviewZoom * 100)}%</span>
            <button title="放大预览" onClick={() => changePreviewZoom(0.1)}><ZoomIn size={14} /></button>
            <button title="全屏预览" onClick={fullScreen}><Maximize2 size={14} /></button>
          </div>
          <div ref={previewStageRef} className="preview-stage" onScroll={(event) => syncScroll(event.currentTarget, textareaRef.current)}>
            <div className="preview-zoom-shell" style={{ zoom: effectivePreviewZoom }}>
              <article
                ref={exportRef}
                className={`export-target ${previewMode === 'wechat' ? 'wechat-mode' : ''}`}
                style={articleVars}
              >
                <div className={`article-canvas ${template.className}`}>
                  <div className="article-body" dangerouslySetInnerHTML={{ __html: articleHtml }} />
                  {activeSplitSettings.enabled && (
                    <div className="split-guide-lines">
                      {previewCutLines.map((top) => <span key={top} style={{ top: `${top}%` }} />)}
                    </div>
                  )}
                </div>
              </article>
            </div>
          </div>
        </section>

        <aside className="inspector-panel">
          <section className="control-section template-control-section">
            <h2 className="section-title"><Palette size={15} />模板选择 <small>{template.description}</small></h2>
            <div className="template-list inspector-template-list">
              {templates.map((item) => (
                <button key={item.id} className={item.id === template.id ? 'template-card selected' : 'template-card'} onClick={() => setTemplateId(item.id)}>
                  <span className={`template-cover ${item.cover}`}><b>F</b><i className="cover-title" /><i className="cover-subtitle" /><i className="cover-media" /><i className="cover-line short" /><i className="cover-line" /></span>
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="control-section">
            <h2 className="section-title"><Eye size={15} />排版参数 <button className="reset-style-button" onClick={() => setSettings(defaultSettings)}><RotateCcw size={12} /> 重置</button></h2>
            <div className="width-control">
              <div className="section-title width-title">长图宽度 <small>{activeSettings.canvasWidth}px</small></div>
              <div className="segmented-grid width-preset-grid">
                {canvasWidthPresets.map((preset) => (
                  <button
                    key={preset.id}
                    className={preset.width === activeSettings.canvasWidth || (preset.id === 'custom' && !canvasWidthPresets.some((item) => item.width === activeSettings.canvasWidth)) ? 'active' : ''}
                    onClick={() => {
                      if (preset.width) setSettings((s) => ({ ...s, canvasWidth: preset.width }));
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <label className="custom-width-field">
                <span>自定义</span>
                <input
                  type="number"
                  min="320"
                  max="1200"
                  step="1"
                  value={activeSettings.canvasWidth}
                  onChange={(event) => setSettings((s) => ({ ...s, canvasWidth: Math.max(320, Math.min(1200, Number(event.target.value) || 430)) }))}
                />
                <b>px</b>
              </label>
            </div>
            <div className="field-grid">
              <RangeField label="正文字号" unit="px" value={activeSettings.fontSize} min={12} max={18} step={1} onChange={(fontSize) => setSettings((s) => ({ ...s, fontSize }))} />
              <RangeField label="行高" value={activeSettings.lineHeight} min={1.5} max={2.4} step={0.05} onChange={(lineHeight) => setSettings((s) => ({ ...s, lineHeight }))} />
              <RangeField label="页边距" unit="px" value={activeSettings.pageMargin} min={18} max={58} step={1} onChange={(pageMargin) => setSettings((s) => ({ ...s, pageMargin }))} />
              <RangeField label="上下留白" unit="px" value={activeSettings.bodyBlock} min={24} max={72} step={1} onChange={(bodyBlock) => setSettings((s) => ({ ...s, bodyBlock }))} />
              <RangeField label="圆角" unit="px" value={activeSettings.radius} min={0} max={28} step={1} onChange={(radius) => setSettings((s) => ({ ...s, radius }))} />
              <RangeField label="图片间距" unit="px" value={activeSettings.imageGap} min={24} max={72} step={1} onChange={(imageGap) => setSettings((s) => ({ ...s, imageGap }))} />
            </div>
          </section>

          <section className="control-section compact-section">
            <h2 className="section-title"><FileText size={15} />字体</h2>
            <div className="segmented-grid font-grid">
              {fontOptions.map((option) => (
                <button
                  key={option.id}
                  className={activeSettings.fontFamily === option.id ? 'active' : ''}
                  style={{ fontFamily: option.value }}
                  onClick={() => setSettings((s) => ({ ...s, fontFamily: option.id }))}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          <section className="control-section">
            <h2 className="section-title"><Palette size={15} />强调色</h2>
            <div className="swatch-row">
              {accentPresets.map((color) => (
                <button key={color} className={activeSettings.accent === color ? 'active' : ''} onClick={() => setSettings((s) => ({ ...s, accent: color }))}>
                  <span style={{ background: color }} />{color.slice(1, 4).toUpperCase()}
                </button>
              ))}
            </div>
          </section>

          <section className="control-section split-control-section">
            <h2 className="section-title"><Scissors size={15} />长图切片</h2>
            <div className="split-toggle-row">
              <span>导出多张拼接图</span>
              <button
                className={activeSplitSettings.enabled ? 'active' : ''}
                onClick={() => setSplitSettings((current) => ({ ...current, enabled: !activeSplitSettings.enabled }))}
              >
                {activeSplitSettings.enabled ? '已开启' : '关闭'}
              </button>
            </div>
            <div className="segmented-grid split-mode-grid">
              <button
                className={activeSplitSettings.mode === 'equal' ? 'active' : ''}
                onClick={() => setSplitSettings((current) => ({ ...current, mode: 'equal', enabled: true }))}
              >
                均分
              </button>
              <button
                className={activeSplitSettings.mode === 'free' ? 'active' : ''}
                onClick={() => setSplitSettings((current) => ({ ...current, mode: 'free', enabled: true }))}
              >
                自由裁切
              </button>
            </div>
            {activeSplitSettings.mode === 'equal' ? (
              <label className="split-number-field">
                <span>均分份数</span>
                <input
                  type="number"
                  min="2"
                  max="9"
                  value={activeSplitSettings.parts}
                  onChange={(event) => setSplitSettings((current) => ({ ...current, enabled: true, parts: Math.min(9, Math.max(2, Number(event.target.value) || 2)) }))}
                />
              </label>
            ) : (
              <div className="split-slider-stack">
                {activeFreeCutValues.map((value, index) => (
                  <label key={index} className="split-slider-field">
                    <span>裁切 {index + 1}<b>{value}%</b></span>
                    <input
                      type="range"
                      min="1"
                      max="99"
                      step="1"
                      value={value}
                      onChange={(event) => setFreeCutValue(index, event.target.value)}
                    />
                  </label>
                ))}
                <div className="split-edit-row">
                  <button onClick={addFreeCut}>增加分割点</button>
                  <button onClick={removeFreeCut} disabled={activeFreeCutValues.length <= 1}>减少</button>
                </div>
              </div>
            )}
            <div className="split-preset-row">
              {[
                ['50', '中间'],
                ['33, 66', '三段'],
                ['25, 50, 75', '四段']
              ].map(([cuts, label]) => (
                <button key={cuts} onClick={() => setSplitSettings((current) => ({ ...current, enabled: true, mode: 'free', cuts }))}>{label}</button>
              ))}
            </div>
          </section>

          <section className="control-section markdown-guide">
            <h2 className="section-title"><HelpCircle size={15} />Markdown 速查</h2>
            <div className="markdown-guide-list">
              {[
                ['# 标题', '一级标题'],
                ['## 小节', '二级标题'],
                ['**重点**', '加粗'],
                ['> 引用', '引用块'],
                ['- 项目', '无序列表'],
                ['---', '分割线']
              ].map(([code, label]) => <p key={code}><code>{code}</code><span>{label}</span></p>)}
            </div>
          </section>
          <p className="brand-signature">xuwu editor</p>
        </aside>
      </section>
      <div className={toast ? 'copy-toast visible' : 'copy-toast'} onTransitionEnd={() => toast && setTimeout(() => setToast(''), 1100)}>
        <span className="copy-toast-icon"><Copy size={18} /></span>
        <span><b>已复制</b><small>{toast}</small></span>
      </div>
    </main>
  );
}

function RangeField({ label, unit = '', value, min, max, step, onChange }) {
  return (
    <label>
      <span>{label}<b>{value}{unit}</b></span>
      <input type="range" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

const rootElement = document.getElementById('root');
const appRoot = rootElement.__xuwuRoot || createRoot(rootElement);
rootElement.__xuwuRoot = appRoot;
appRoot.render(<App />);
