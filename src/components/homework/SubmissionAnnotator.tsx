"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Pencil, 
  Highlighter, 
  Type, 
  Square, 
  Circle, 
  ArrowRight, 
  Check, 
  X as XIcon, 
  Star, 
  RotateCcw, 
  RotateCw, 
  Eraser, 
  Trash2, 
  Download, 
  Save, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Sparkles,
  Loader2,
  Undo2,
  Redo2,
  FileCheck2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { uploadAction } from '@/app/actions/upload';

export interface Attachment {
  name: string;
  url: string;
  type?: string;
  publicId?: string;
}

interface SubmissionAnnotatorProps {
  attachments: Attachment[];
  studentName?: string;
  homeworkTitle?: string;
  existingAnnotated?: Attachment[];
  onSave: (annotatedFiles: Attachment[]) => Promise<void> | void;
  onClose: () => void;
}

type ToolType = 'pen' | 'highlighter' | 'text' | 'rect' | 'circle' | 'arrow' | 'eraser' | 'stamp';
type StampType = 'check' | 'cross' | 'star' | 'plus1' | 'half' | 'question' | 'great' | 'check_step';

interface Point {
  x: number;
  y: number;
}

interface DrawAction {
  tool: ToolType;
  color: string;
  size: number;
  points?: Point[];
  startPoint?: Point;
  endPoint?: Point;
  text?: string;
  stamp?: StampType;
}

const COLORS = [
  { name: 'Red (Corrections)', value: '#ef4444' },
  { name: 'Green (Correct)', value: '#10b981' },
  { name: 'Blue (Notes)', value: '#3b82f6' },
  { name: 'Purple (Feedback)', value: '#8b5cf6' },
  { name: 'Yellow (Highlighter)', value: '#facc15' },
  { name: 'Orange', value: '#f97316' },
  { name: 'White', value: '#ffffff' }
];

const STAMPS: { type: StampType; label: string; icon: string; color: string }[] = [
  { type: 'check', label: 'Correct', icon: '✓', color: '#10b981' },
  { type: 'cross', label: 'Incorrect', icon: '✗', color: '#ef4444' },
  { type: 'star', label: 'Good', icon: '⭐', color: '#f59e0b' },
  { type: 'plus1', label: '+1 Mark', icon: '+1', color: '#10b981' },
  { type: 'half', label: '+½ Mark', icon: '+½', color: '#f59e0b' },
  { type: 'question', label: 'Check ?', icon: '❓', color: '#ef4444' },
  { type: 'great', label: 'Great Work!', icon: '🌟 Great Work!', color: '#10b981' },
  { type: 'check_step', label: 'Review Step', icon: '⚠️ Check Step', color: '#ef4444' },
];

export function SubmissionAnnotator({
  attachments,
  studentName = 'Student',
  homeworkTitle = 'Homework',
  existingAnnotated = [],
  onSave,
  onClose
}: SubmissionAnnotatorProps) {
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [selectedTool, setSelectedTool] = useState<ToolType>('pen');
  const [selectedColor, setSelectedColor] = useState<string>('#ef4444');
  const [strokeSize, setStrokeSize] = useState<number>(4);
  const [selectedStamp, setSelectedStamp] = useState<StampType>('check');
  const [textInput, setTextInput] = useState<string>('');
  const [textPosition, setTextPosition] = useState<Point | null>(null);

  // Per-page annotation history: pageIndex -> array of DrawActions
  const [pageActions, setPageActions] = useState<Record<number, DrawAction[]>>({});
  const [pageRedoStack, setPageRedoStack] = useState<Record<number, DrawAction[]>>({});

  const [saving, setSaving] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentAction, setCurrentAction] = useState<DrawAction | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const baseImageRef = useRef<HTMLImageElement | null>(null);

  const currentAttachment = attachments[activePageIndex] || attachments[0];
  const totalPages = attachments.length;

  // Load the current image
  useEffect(() => {
    if (!currentAttachment?.url) return;
    setImageLoaded(false);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = currentAttachment.url;
    img.onload = () => {
      baseImageRef.current = img;
      setImageLoaded(true);
    };
    img.onerror = () => {
      console.error('Failed to load image for annotation');
      setImageLoaded(true);
    };
  }, [currentAttachment?.url]);

  // Redraw canvas whenever current page, image, actions or active action changes
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = baseImageRef.current;
    if (img && img.naturalWidth && img.naturalHeight) {
      if (canvas.width !== img.naturalWidth || canvas.height !== img.naturalHeight) {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const actions = pageActions[activePageIndex] || [];
    const allActions = currentAction ? [...actions, currentAction] : actions;

    allActions.forEach(action => {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (action.tool === 'highlighter') {
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = action.color;
        ctx.lineWidth = action.size * 3;
      } else if (action.tool === 'eraser') {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = action.size * 3;
      } else {
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = action.color;
        ctx.fillStyle = action.color;
        ctx.lineWidth = action.size;
      }

      if ((action.tool === 'pen' || action.tool === 'highlighter' || action.tool === 'eraser') && action.points && action.points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(action.points[0].x, action.points[0].y);
        for (let i = 1; i < action.points.length; i++) {
          ctx.lineTo(action.points[i].x, action.points[i].y);
        }
        ctx.stroke();
      } else if (action.tool === 'rect' && action.startPoint && action.endPoint) {
        const x = Math.min(action.startPoint.x, action.endPoint.x);
        const y = Math.min(action.startPoint.y, action.endPoint.y);
        const w = Math.abs(action.startPoint.x - action.endPoint.x);
        const h = Math.abs(action.startPoint.y - action.endPoint.y);
        ctx.strokeRect(x, y, w, h);
      } else if (action.tool === 'circle' && action.startPoint && action.endPoint) {
        const rx = Math.abs(action.endPoint.x - action.startPoint.x) / 2;
        const ry = Math.abs(action.endPoint.y - action.startPoint.y) / 2;
        const cx = Math.min(action.startPoint.x, action.endPoint.x) + rx;
        const cy = Math.min(action.startPoint.y, action.endPoint.y) + ry;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (action.tool === 'arrow' && action.startPoint && action.endPoint) {
        const fromX = action.startPoint.x;
        const fromY = action.startPoint.y;
        const toX = action.endPoint.x;
        const toY = action.endPoint.y;
        const headlen = Math.max(15, action.size * 4);
        const angle = Math.atan2(toY - fromY, toX - fromX);

        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      } else if (action.tool === 'stamp' && action.startPoint && action.stamp) {
        const stampDef = STAMPS.find(s => s.type === action.stamp);
        if (stampDef) {
          ctx.font = 'bold 36px sans-serif';
          ctx.fillStyle = action.color || stampDef.color;
          ctx.fillText(stampDef.icon, action.startPoint.x, action.startPoint.y);
        }
      } else if (action.tool === 'text' && action.startPoint && action.text) {
        const fontSize = Math.max(20, action.size * 5);
        ctx.font = `bold ${fontSize}px sans-serif`;
        
        ctx.save();
        const metrics = ctx.measureText(action.text);
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(
          action.startPoint.x - 6,
          action.startPoint.y - fontSize - 2,
          metrics.width + 12,
          fontSize + 10
        );
        ctx.restore();

        ctx.fillStyle = action.color;
        ctx.fillText(action.text, action.startPoint.x, action.startPoint.y);
      }

      ctx.restore();
    });
  }, [activePageIndex, currentAction, pageActions]);

  useEffect(() => {
    if (imageLoaded) {
      redrawCanvas();
    }
  }, [imageLoaded, redrawCanvas]);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const pt = getCanvasCoordinates(e);
    if (!pt) return;

    if (selectedTool === 'text') {
      setTextPosition(pt);
      return;
    }

    if (selectedTool === 'stamp') {
      const newAction: DrawAction = {
        tool: 'stamp',
        color: selectedColor,
        size: strokeSize,
        startPoint: pt,
        stamp: selectedStamp
      };
      setPageActions(prev => ({
        ...prev,
        [activePageIndex]: [...(prev[activePageIndex] || []), newAction]
      }));
      setPageRedoStack(prev => ({ ...prev, [activePageIndex]: [] }));
      return;
    }

    setIsDrawing(true);

    if (selectedTool === 'pen' || selectedTool === 'highlighter' || selectedTool === 'eraser') {
      setCurrentAction({
        tool: selectedTool,
        color: selectedColor,
        size: strokeSize,
        points: [pt]
      });
    } else if (selectedTool === 'rect' || selectedTool === 'circle' || selectedTool === 'arrow') {
      setCurrentAction({
        tool: selectedTool,
        color: selectedColor,
        size: strokeSize,
        startPoint: pt,
        endPoint: pt
      });
    }
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentAction) return;
    const pt = getCanvasCoordinates(e);
    if (!pt) return;

    if (currentAction.tool === 'pen' || currentAction.tool === 'highlighter' || currentAction.tool === 'eraser') {
      setCurrentAction(prev => prev ? {
        ...prev,
        points: [...(prev.points || []), pt]
      } : null);
    } else if (currentAction.tool === 'rect' || currentAction.tool === 'circle' || currentAction.tool === 'arrow') {
      setCurrentAction(prev => prev ? {
        ...prev,
        endPoint: pt
      } : null);
    }
  };

  const handlePointerUp = () => {
    if (!isDrawing || !currentAction) return;
    setIsDrawing(false);

    setPageActions(prev => ({
      ...prev,
      [activePageIndex]: [...(prev[activePageIndex] || []), currentAction]
    }));
    setCurrentAction(null);
    setPageRedoStack(prev => ({ ...prev, [activePageIndex]: [] }));
  };

  const handleAddText = () => {
    if (!textPosition || !textInput.trim()) {
      setTextPosition(null);
      setTextInput('');
      return;
    }

    const newAction: DrawAction = {
      tool: 'text',
      color: selectedColor,
      size: strokeSize,
      startPoint: textPosition,
      text: textInput.trim()
    };

    setPageActions(prev => ({
      ...prev,
      [activePageIndex]: [...(prev[activePageIndex] || []), newAction]
    }));
    setPageRedoStack(prev => ({ ...prev, [activePageIndex]: [] }));
    setTextPosition(null);
    setTextInput('');
  };

  const handleUndo = () => {
    const actions = pageActions[activePageIndex] || [];
    if (actions.length === 0) return;
    const last = actions[actions.length - 1];
    setPageActions(prev => ({
      ...prev,
      [activePageIndex]: actions.slice(0, -1)
    }));
    setPageRedoStack(prev => ({
      ...prev,
      [activePageIndex]: [...(prev[activePageIndex] || []), last]
    }));
  };

  const handleRedo = () => {
    const redos = pageRedoStack[activePageIndex] || [];
    if (redos.length === 0) return;
    const last = redos[redos.length - 1];
    setPageRedoStack(prev => ({
      ...prev,
      [activePageIndex]: redos.slice(0, -1)
    }));
    setPageActions(prev => ({
      ...prev,
      [activePageIndex]: [...(prev[activePageIndex] || []), last]
    }));
  };

  const handleClearPage = () => {
    if (!confirm('Clear all drawings and annotations on this page?')) return;
    setPageActions(prev => ({
      ...prev,
      [activePageIndex]: []
    }));
    setPageRedoStack(prev => ({
      ...prev,
      [activePageIndex]: []
    }));
  };

  const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to generate canvas image'));
      }, 'image/jpeg', 0.92);
    });
  };

  const renderPageToBlob = async (pageIdx: number): Promise<{ blob: Blob; name: string }> => {
    const att = attachments[pageIdx];
    const actions = pageActions[pageIdx] || [];

    const offscreenCanvas = document.createElement('canvas');
    const ctx = offscreenCanvas.getContext('2d');
    if (!ctx) throw new Error('Could not create offscreen context');

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = att.url;

    await new Promise((res, rej) => {
      img.onload = () => res(null);
      img.onerror = () => rej(new Error(`Failed to load image for page ${pageIdx + 1}`));
    });

    offscreenCanvas.width = img.naturalWidth || 1200;
    offscreenCanvas.height = img.naturalHeight || 1600;

    ctx.drawImage(img, 0, 0);

    actions.forEach(action => {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (action.tool === 'highlighter') {
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = action.color;
        ctx.lineWidth = action.size * 3;
      } else if (action.tool === 'eraser') {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = action.size * 3;
      } else {
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = action.color;
        ctx.fillStyle = action.color;
        ctx.lineWidth = action.size;
      }

      if ((action.tool === 'pen' || action.tool === 'highlighter' || action.tool === 'eraser') && action.points && action.points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(action.points[0].x, action.points[0].y);
        for (let i = 1; i < action.points.length; i++) {
          ctx.lineTo(action.points[i].x, action.points[i].y);
        }
        ctx.stroke();
      } else if (action.tool === 'rect' && action.startPoint && action.endPoint) {
        const x = Math.min(action.startPoint.x, action.endPoint.x);
        const y = Math.min(action.startPoint.y, action.endPoint.y);
        const w = Math.abs(action.startPoint.x - action.endPoint.x);
        const h = Math.abs(action.startPoint.y - action.endPoint.y);
        ctx.strokeRect(x, y, w, h);
      } else if (action.tool === 'circle' && action.startPoint && action.endPoint) {
        const rx = Math.abs(action.endPoint.x - action.startPoint.x) / 2;
        const ry = Math.abs(action.endPoint.y - action.startPoint.y) / 2;
        const cx = Math.min(action.startPoint.x, action.endPoint.x) + rx;
        const cy = Math.min(action.startPoint.y, action.endPoint.y) + ry;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (action.tool === 'arrow' && action.startPoint && action.endPoint) {
        const fromX = action.startPoint.x;
        const fromY = action.startPoint.y;
        const toX = action.endPoint.x;
        const toY = action.endPoint.y;
        const headlen = Math.max(15, action.size * 4);
        const angle = Math.atan2(toY - fromY, toX - fromX);

        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      } else if (action.tool === 'stamp' && action.startPoint && action.stamp) {
        const stampDef = STAMPS.find(s => s.type === action.stamp);
        if (stampDef) {
          ctx.font = 'bold 36px sans-serif';
          ctx.fillStyle = action.color || stampDef.color;
          ctx.fillText(stampDef.icon, action.startPoint.x, action.startPoint.y);
        }
      } else if (action.tool === 'text' && action.startPoint && action.text) {
        const fontSize = Math.max(20, action.size * 5);
        ctx.font = `bold ${fontSize}px sans-serif`;
        
        ctx.save();
        const metrics = ctx.measureText(action.text);
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(
          action.startPoint.x - 6,
          action.startPoint.y - fontSize - 2,
          metrics.width + 12,
          fontSize + 10
        );
        ctx.restore();

        ctx.fillStyle = action.color;
        ctx.fillText(action.text, action.startPoint.x, action.startPoint.y);
      }

      ctx.restore();
    });

    const blob = await canvasToBlob(offscreenCanvas);
    const cleanName = att.name ? `Annotated_${att.name.replace(/\.[^/.]+$/, '')}.jpg` : `Annotated_Page_${pageIdx + 1}.jpg`;
    return { blob, name: cleanName };
  };

  const handleSaveAndPublish = async () => {
    setSaving(true);
    try {
      const annotatedResults: Attachment[] = [];

      for (let i = 0; i < attachments.length; i++) {
        const actions = pageActions[i] || [];
        if (actions.length > 0) {
          const { blob, name } = await renderPageToBlob(i);
          const file = new File([blob], name, { type: 'image/jpeg' });
          
          const formData = new FormData();
          formData.append('file', file);
          formData.append('folder', 'homework_evaluations');

          const uploadResult = await uploadAction(formData);
          annotatedResults.push({
            name,
            url: uploadResult.url,
            publicId: uploadResult.publicId,
            type: 'image/jpeg'
          });
        } else {
          const existing = existingAnnotated[i];
          if (existing) {
            annotatedResults.push(existing);
          }
        }
      }

      await onSave(annotatedResults);
      onClose();
    } catch (err: any) {
      console.error('Failed to save annotated submission:', err);
      alert(err.message || 'Failed to save annotations. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const hasAnyAnnotations = Object.values(pageActions).some(actions => actions.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden select-none">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 gap-2 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/20 text-red-400 font-bold text-xs">
              ✏️
            </span>
            <div>
              <h3 className="text-sm font-bold truncate max-w-xs sm:max-w-md">
                Grading Paper: {studentName}
              </h3>
              <p className="text-[11px] text-zinc-400 truncate max-w-xs">{homeworkTitle}</p>
            </div>
          </div>

          {totalPages > 1 && (
            <Badge variant="outline" className="border-zinc-700 bg-zinc-800 text-zinc-300 text-xs px-2.5">
              Page {activePageIndex + 1} of {totalPages}
            </Badge>
          )}
        </div>

        {/* Page Switcher Left/Right */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1 bg-zinc-800/80 p-1 rounded-xl border border-zinc-700">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setActivePageIndex(prev => Math.max(0, prev - 1))}
              disabled={activePageIndex === 0}
              className="h-7 px-2 text-xs text-zinc-300 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Prev Page
            </Button>
            <span className="text-xs font-semibold px-2 text-zinc-400">
              {activePageIndex + 1} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setActivePageIndex(prev => Math.min(totalPages - 1, prev + 1))}
              disabled={activePageIndex === totalPages - 1}
              className="h-7 px-2 text-xs text-zinc-300 hover:text-white"
            >
              Next Page <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Action Buttons: Save & Close */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={saving}
            className="h-8 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs"
          >
            Cancel
          </Button>

          <Button
            size="sm"
            onClick={handleSaveAndPublish}
            disabled={saving || (!hasAnyAnnotations && existingAnnotated.length === 0)}
            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs gap-1.5 shadow-lg shadow-emerald-600/20"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileCheck2 className="h-4 w-4" />
            )}
            <span>Save & Attach Evaluated Work</span>
          </Button>
        </div>
      </div>

      {/* Main Studio Body: Left Tool Panel + Center Canvas + Right Stamp Panel */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Toolbar */}
        <div className="w-16 sm:w-20 bg-zinc-900 border-r border-zinc-800 flex flex-col items-center py-3 space-y-4 shrink-0 overflow-y-auto">
          {/* Main Drawing Tools */}
          <div className="space-y-1 w-full px-2">
            <button
              type="button"
              onClick={() => setSelectedTool('pen')}
              className={`w-full p-2.5 rounded-xl flex flex-col items-center justify-center transition-all ${
                selectedTool === 'pen'
                  ? 'bg-red-500/20 text-red-400 ring-2 ring-red-500/50'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
              title="Correction Pen (Red Pen)"
            >
              <Pencil className="h-4 w-4" />
              <span className="text-[9px] font-semibold mt-1">Pen</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTool('highlighter')}
              className={`w-full p-2.5 rounded-xl flex flex-col items-center justify-center transition-all ${
                selectedTool === 'highlighter'
                  ? 'bg-yellow-500/20 text-yellow-400 ring-2 ring-yellow-500/50'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
              title="Highlighter"
            >
              <Highlighter className="h-4 w-4" />
              <span className="text-[9px] font-semibold mt-1">Highlight</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTool('text')}
              className={`w-full p-2.5 rounded-xl flex flex-col items-center justify-center transition-all ${
                selectedTool === 'text'
                  ? 'bg-blue-500/20 text-blue-400 ring-2 ring-blue-500/50'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
              title="Text Comment"
            >
              <Type className="h-4 w-4" />
              <span className="text-[9px] font-semibold mt-1">Text</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTool('stamp')}
              className={`w-full p-2.5 rounded-xl flex flex-col items-center justify-center transition-all ${
                selectedTool === 'stamp'
                  ? 'bg-purple-500/20 text-purple-400 ring-2 ring-purple-500/50'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
              title="Evaluation Stamps"
            >
              <Check className="h-4 w-4" />
              <span className="text-[9px] font-semibold mt-1">Stamp</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTool('rect')}
              className={`w-full p-2.5 rounded-xl flex flex-col items-center justify-center transition-all ${
                selectedTool === 'rect'
                  ? 'bg-amber-500/20 text-amber-400 ring-2 ring-amber-500/50'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
              title="Box / Rectangle"
            >
              <Square className="h-4 w-4" />
              <span className="text-[9px] font-semibold mt-1">Box</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTool('arrow')}
              className={`w-full p-2.5 rounded-xl flex flex-col items-center justify-center transition-all ${
                selectedTool === 'arrow'
                  ? 'bg-amber-500/20 text-amber-400 ring-2 ring-amber-500/50'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
              title="Arrow Pointer"
            >
              <ArrowRight className="h-4 w-4" />
              <span className="text-[9px] font-semibold mt-1">Arrow</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTool('eraser')}
              className={`w-full p-2.5 rounded-xl flex flex-col items-center justify-center transition-all ${
                selectedTool === 'eraser'
                  ? 'bg-zinc-700 text-white ring-2 ring-zinc-500'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
              title="Eraser"
            >
              <Eraser className="h-4 w-4" />
              <span className="text-[9px] font-semibold mt-1">Eraser</span>
            </button>
          </div>

          <div className="w-full border-t border-zinc-800 my-2" />

          {/* Stroke Size Selector */}
          <div className="flex flex-col items-center space-y-1.5">
            <span className="text-[9px] font-bold text-zinc-400">Size</span>
            {[2, 4, 8, 14].map(sz => (
              <button
                key={sz}
                type="button"
                onClick={() => setStrokeSize(sz)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  strokeSize === sz ? 'bg-zinc-700 text-white' : 'hover:bg-zinc-800 text-zinc-400'
                }`}
                title={`Brush size ${sz}px`}
              >
                <div 
                  className="rounded-full bg-current" 
                  style={{ width: `${Math.max(4, sz * 1.5)}px`, height: `${Math.max(4, sz * 1.5)}px` }} 
                />
              </button>
            ))}
          </div>

          <div className="w-full border-t border-zinc-800 my-2" />

          {/* History Controls: Undo / Redo / Clear */}
          <div className="flex flex-col items-center space-y-1">
            <button
              type="button"
              onClick={handleUndo}
              disabled={!(pageActions[activePageIndex]?.length > 0)}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30"
              title="Undo"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={!(pageRedoStack[activePageIndex]?.length > 0)}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30"
              title="Redo"
            >
              <Redo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleClearPage}
              className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10"
              title="Clear Current Page"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Center Canvas Viewport */}
        <div 
          ref={containerRef}
          className="flex-1 bg-zinc-950 overflow-auto flex items-center justify-center p-4 relative"
        >
          {!imageLoaded ? (
            <div className="flex flex-col items-center justify-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-red-500" />
              <p className="text-xs text-zinc-400">Loading student answer sheet...</p>
            </div>
          ) : (
            <div 
              className="relative shadow-2xl rounded-xl overflow-hidden border border-zinc-800 bg-white inline-block"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
                transition: 'transform 0.1s ease'
              }}
            >
              <canvas
                ref={canvasRef}
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
                className="cursor-crosshair max-w-full max-h-[80vh] object-contain block select-none"
              />

              {/* Text Input Modal when clicking with Text Tool */}
              {textPosition && (
                <div 
                  className="absolute z-30 p-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl flex items-center gap-1.5"
                  style={{
                    left: `${Math.min(textPosition.x * 0.5, 300)}px`,
                    top: `${Math.min(textPosition.y * 0.5, 300)}px`
                  }}
                >
                  <input
                    type="text"
                    autoFocus
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddText();
                      if (e.key === 'Escape') setTextPosition(null);
                    }}
                    placeholder="Type feedback or mark..."
                    className="bg-zinc-800 text-white px-2.5 py-1 text-xs rounded-lg border border-zinc-600 focus:outline-none focus:ring-1 focus:ring-red-500 w-48"
                  />
                  <Button size="sm" onClick={handleAddText} className="h-7 px-2 bg-red-600 hover:bg-red-700 text-xs">
                    Add
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setTextPosition(null)} className="h-7 px-1.5 text-xs text-zinc-400">
                    ✕
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Floating Left and Right page navigation arrows */}
          {totalPages > 1 && (
            <>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setActivePageIndex(prev => Math.max(0, prev - 1))}
                disabled={activePageIndex === 0}
                className="absolute left-4 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-white shadow-2xl border border-zinc-700 backdrop-blur disabled:opacity-30"
                title="Previous Page"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>

              <Button
                variant="secondary"
                size="icon"
                onClick={() => setActivePageIndex(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={activePageIndex === totalPages - 1}
                className="absolute right-4 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-white shadow-2xl border border-zinc-700 backdrop-blur disabled:opacity-30"
                title="Next Page"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* Bottom Zoom / Canvas Controls overlay */}
          <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-800 p-1 rounded-xl shadow-xl backdrop-blur">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-zinc-400 hover:text-white"
              onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))}
              disabled={zoom <= 0.5}
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-[10px] text-zinc-300 font-semibold px-1 min-w-[36px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-zinc-400 hover:text-white"
              onClick={() => setZoom(prev => Math.min(3, prev + 0.25))}
              disabled={zoom >= 3}
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-zinc-400 hover:text-white text-xs"
              onClick={() => setZoom(1)}
              title="Reset Zoom"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Right Palette & Stamp Selection Bar */}
        <div className="w-56 bg-zinc-900 border-l border-zinc-800 p-3 flex flex-col space-y-4 shrink-0 overflow-y-auto hidden md:flex">
          {/* Color Palette */}
          <div>
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-2">
              Ink Color
            </span>
            <div className="grid grid-cols-4 gap-2">
              {COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setSelectedColor(c.value)}
                  className={`h-8 rounded-xl border flex items-center justify-center transition-all ${
                    selectedColor === c.value
                      ? 'border-white scale-110 shadow-lg ring-2 ring-white/30'
                      : 'border-zinc-700 hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                >
                  {selectedColor === c.value && (
                    <Check className={`h-4 w-4 ${c.value === '#ffffff' || c.value === '#facc15' ? 'text-black' : 'text-white'}`} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Grading Stamps */}
          <div>
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-2">
              Grading Stamps
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {STAMPS.map(stamp => (
                <button
                  key={stamp.type}
                  type="button"
                  onClick={() => {
                    setSelectedTool('stamp');
                    setSelectedStamp(stamp.type);
                    setSelectedColor(stamp.color);
                  }}
                  className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold border transition-all text-left ${
                    selectedTool === 'stamp' && selectedStamp === stamp.type
                      ? 'bg-zinc-800 border-red-500 shadow-md ring-1 ring-red-500/40 text-white'
                      : 'bg-zinc-950/40 border-zinc-800 hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span className="text-sm font-bold" style={{ color: stamp.color }}>{stamp.icon.slice(0, 2)}</span>
                  <span className="truncate text-[11px]">{stamp.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Evaluation Quick Note Tips */}
          <div className="mt-auto bg-zinc-950/50 border border-zinc-800/80 rounded-2xl p-3 space-y-1.5 text-[11px] text-zinc-400">
            <p className="font-semibold text-zinc-200 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Evaluation Tips
            </p>
            <p>1. Select <strong>Pen</strong> (Red) to circle or check answers.</p>
            <p>2. Select <strong>Stamp</strong> for fast ✓, ✗, +1 marks.</p>
            <p>3. Tap <strong>Save & Attach</strong> to send marked copies to student/parent.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
