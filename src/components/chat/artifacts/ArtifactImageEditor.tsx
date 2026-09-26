import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Type, ArrowUpRight, Square, Circle, Edit3, Sliders, Trash2, 
  Download, ArrowLeft, ArrowRight, RefreshCw, ZoomIn, ZoomOut, Check, Maximize2, Minimize2, Move, Layers, Send, X,
  LayoutTemplate, Image as ImageIcon, Shapes, Frame, Upload
} from 'lucide-react';
import { useAppContext } from '../../../context/AppContext';
import { toast, SelectDropdown } from '@/design-system';

interface ArtifactImageEditorProps {
  artifact: {
    id: string;
    title: string;
    content: string; // Image URL or Base64
  };
  onClose?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

interface CanvasElement {
  id: string;
  type: 'text' | 'arrow' | 'rect' | 'circle' | 'line';
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  points?: Array<{ x: number; y: number }>;
  text?: string;
  color: string;
  strokeWidth: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: string;
  textBgColor?: string;
  textBorderColor?: string;
  textShadow?: boolean;
}

export const ArtifactImageEditor: React.FC<ArtifactImageEditorProps> = ({ 
  artifact,
  onClose,
  isFullscreen = false,
  onToggleFullscreen
}) => {
  const { language, dir } = useAppContext();
  const isAr = language === 'ar' || dir === 'rtl';

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Tools state
  const [activeTool, setActiveTool] = useState<'select' | 'draw' | 'text' | 'arrow' | 'rect' | 'circle' | 'filter'>('select');
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeColor, setActiveColor] = useState<string>('#ef4444'); // Default red
  const [strokeWidth, setStrokeWidth] = useState<number>(4);
  const [fontSize, setFontSize] = useState<number>(24);

  // Inline Canva-style text editing states
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTextValue, setEditingTextValue] = useState<string>('');

  // Image editing filters state
  const [filters, setFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
    grayscale: 0,
    sepia: 0
  });

  // Zoom & Pan state for viewport navigation
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  // Drawing state
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentLine, setCurrentLine] = useState<Array<{ x: number; y: number }>>([]);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [activeShape, setActiveShape] = useState<CanvasElement | null>(null);

  // Load Image
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = artifact.content;
    img.onload = () => {
      imageRef.current = img;
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
      setImageLoaded(true);
      // Center and fit image on container load
      fitImageToContainer(img.naturalWidth, img.naturalHeight);
    };
  }, [artifact.content]);

  const fitImageToContainer = (imgW: number, imgH: number) => {
    if (!containerRef.current) return;
    const contW = containerRef.current.clientWidth - 40;
    const contH = containerRef.current.clientHeight - 100;
    const scale = Math.min(contW / imgW, contH / imgH, 1);
    setZoom(scale);
    setPan({
      x: (containerRef.current.clientWidth - imgW * scale) / 2,
      y: (containerRef.current.clientHeight - imgH * scale) / 2
    });
  };

  // Keep the stage perfectly centered using a ResizeObserver on size modifications
  useEffect(() => {
    if (!containerRef.current || !imageLoaded) return;
    const observer = new ResizeObserver(() => {
      if (imageRef.current) {
        fitImageToContainer(imageRef.current.naturalWidth, imageRef.current.naturalHeight);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [imageLoaded, imageSize]);

  // Redraw canvas elements and image filters
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !imageRef.current) return;

    // Set canvas dimensions to match the image dimensions
    canvas.width = imageSize.width;
    canvas.height = imageSize.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply filters
    ctx.filter = `
      brightness(${filters.brightness}%) 
      contrast(${filters.contrast}%) 
      saturate(${filters.saturation}%) 
      blur(${filters.blur}px) 
      grayscale(${filters.grayscale}%) 
      sepia(${filters.sepia}%)
    `;

    // Draw base image
    ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);

    // Reset filters for overlay elements
    ctx.filter = 'none';

    // Draw elements
    elements.forEach(el => {
      ctx.strokeStyle = el.color;
      ctx.fillStyle = el.color;
      ctx.lineWidth = el.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Highlight selected element
      if (selectedId === el.id) {
        ctx.save();
        ctx.strokeStyle = 'var(--fg-accent, #6366f1)';
        ctx.lineWidth = el.strokeWidth + 4;
        ctx.setLineDash([6, 6]);
      }

      if (el.type === 'line' && el.points && el.points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        for (let i = 1; i < el.points.length; i++) {
          ctx.lineTo(el.points[i].x, el.points[i].y);
        }
        ctx.stroke();
      } else if (el.type === 'rect') {
        ctx.strokeRect(el.x!, el.y!, el.w!, el.h!);
      } else if (el.type === 'circle') {
        ctx.beginPath();
        const r = Math.sqrt(el.w! * el.w! + el.h! * el.h!) / 2;
        ctx.arc(el.x! + el.w! / 2, el.y! + el.h! / 2, r, 0, Math.PI * 2);
        ctx.stroke();
      } else if (el.type === 'arrow') {
        const x1 = el.x1!;
        const y1 = el.y1!;
        const x2 = el.x2!;
        const y2 = el.y2!;
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Arrow head
        const angle = Math.atan2(y2 - y1, x2 - x1);
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - 15 * Math.cos(angle - Math.PI / 6), y2 - 15 * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(x2 - 15 * Math.cos(angle + Math.PI / 6), y2 - 15 * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      } else if (el.type === 'text') {
        if (editingTextId === el.id) return; // Hide on canvas while editing inline
        
        ctx.save();
        const fontStyle = el.fontStyle || 'normal';
        const fontWeight = el.fontWeight || 'bold';
        const fontFamily = el.fontFamily || 'sans-serif';
        ctx.font = `${fontStyle} ${fontWeight} ${el.fontSize}px ${fontFamily}`;
        ctx.textBaseline = 'top';
        ctx.fillStyle = el.color;

        const lines = (el.text || '').split('\n');
        const lineHeight = el.fontSize! * 1.25;

        lines.forEach((line, index) => {
          const lineY = el.y! + index * lineHeight;
          const textWidth = ctx.measureText(line).width;
          let lineX = el.x!;

          if (el.textAlign === 'center') {
            lineX = el.x!;
            ctx.textAlign = 'center';
          } else if (el.textAlign === 'right') {
            lineX = el.x!;
            ctx.textAlign = 'right';
          } else {
            ctx.textAlign = 'left';
          }

          // Draw Background if specified
          if (el.textBgColor && el.textBgColor !== 'transparent') {
            ctx.save();
            ctx.fillStyle = el.textBgColor;
            let bgX = lineX;
            if (ctx.textAlign === 'center') bgX = lineX - textWidth / 2;
            else if (ctx.textAlign === 'right') bgX = lineX - textWidth;
            
            // Draw a slightly padded background box
            ctx.fillRect(bgX - 8, lineY - 4, textWidth + 16, el.fontSize! + 8);
            ctx.restore();
          }

          // Draw text shadow for extreme clarity (Canva style)
          if (el.textShadow) {
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
            ctx.shadowBlur = 6;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.fillText(line, lineX, lineY);
            ctx.restore();
          } else {
            ctx.fillText(line, lineX, lineY);
          }
        });
        ctx.restore();
      }

      if (selectedId === el.id) {
        ctx.restore();
        // Redraw regular stroke over the selection dashed highlight
        if (el.type === 'line' && el.points && el.points.length > 0) {
          ctx.beginPath();
          ctx.moveTo(el.points[0].x, el.points[0].y);
          for (let i = 1; i < el.points.length; i++) {
            ctx.lineTo(el.points[i].x, el.points[i].y);
          }
          ctx.strokeStyle = el.color;
          ctx.lineWidth = el.strokeWidth;
          ctx.stroke();
        } else if (el.type === 'rect') {
          ctx.strokeStyle = el.color;
          ctx.lineWidth = el.strokeWidth;
          ctx.strokeRect(el.x!, el.y!, el.w!, el.h!);
        } else if (el.type === 'circle') {
          ctx.strokeStyle = el.color;
          ctx.lineWidth = el.strokeWidth;
          ctx.beginPath();
          const r = Math.sqrt(el.w! * el.w! + el.h! * el.h!) / 2;
          ctx.arc(el.x! + el.w! / 2, el.y! + el.h! / 2, r, 0, Math.PI * 2);
          ctx.stroke();
        } else if (el.type === 'arrow') {
          ctx.strokeStyle = el.color;
          ctx.lineWidth = el.strokeWidth;
          ctx.beginPath();
          ctx.moveTo(el.x1!, el.y1!);
          ctx.lineTo(el.x2!, el.y2!);
          ctx.stroke();
        }
      }
    });

    // Draw current active preview drawing
    if (activeShape) {
      ctx.strokeStyle = activeShape.color;
      ctx.fillStyle = activeShape.color;
      ctx.lineWidth = activeShape.strokeWidth;

      if (activeShape.type === 'rect') {
        ctx.strokeRect(activeShape.x!, activeShape.y!, activeShape.w!, activeShape.h!);
      } else if (activeShape.type === 'circle') {
        ctx.beginPath();
        const r = Math.sqrt(activeShape.w! * activeShape.w! + activeShape.h! * activeShape.h!) / 2;
        ctx.arc(activeShape.x! + activeShape.w! / 2, activeShape.y! + activeShape.h! / 2, r, 0, Math.PI * 2);
        ctx.stroke();
      } else if (activeShape.type === 'arrow') {
        ctx.beginPath();
        ctx.moveTo(activeShape.x1!, activeShape.y1!);
        ctx.lineTo(activeShape.x2!, activeShape.y2!);
        ctx.stroke();

        const angle = Math.atan2(activeShape.y2! - activeShape.y1!, activeShape.x2! - activeShape.x1!);
        ctx.beginPath();
        ctx.moveTo(activeShape.x2!, activeShape.y2!);
        ctx.lineTo(activeShape.x2! - 15 * Math.cos(angle - Math.PI / 6), activeShape.y2! - 15 * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(activeShape.x2! - 15 * Math.cos(angle + Math.PI / 6), activeShape.y2! - 15 * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      }
    }
  };

  useEffect(() => {
    if (imageLoaded) {
      drawCanvas();
    }
  }, [elements, filters, selectedId, activeShape, imageLoaded]);

  // Convert client viewport coordinates to canvas/image space coordinates
  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Scale to natural canvas coordinates
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  };

  // Pan and zoom canvas stage
  const handleStageMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || activeTool === 'select' && e.shiftKey) {
      // Middle mouse button or shift click = Pan viewport
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      return;
    }

    const { x, y } = getCanvasCoords(e.clientX, e.clientY);

    if (activeTool === 'select') {
      // Find element clicked
      const clickedEl = [...elements].reverse().find(el => {
        if (el.type === 'rect') {
          return x >= el.x! && x <= el.x! + el.w! && y >= el.y! && y <= el.y! + el.h!;
        }
        if (el.type === 'circle') {
          const r = Math.sqrt(el.w! * el.w! + el.h! * el.h!) / 2;
          const cx = el.x! + el.w! / 2;
          const cy = el.y! + el.h! / 2;
          const dist = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
          return dist <= r + 5;
        }
        if (el.type === 'text') {
          // Approximate bounding box for text
          return x >= el.x! && x <= el.x! + (el.text || '').length * (el.fontSize! * 0.6) && y >= el.y! && y <= el.y! + el.fontSize!;
        }
        return false;
      });

      if (clickedEl) {
        setSelectedId(clickedEl.id);
        setDragStart({ x, y });
      } else {
        setSelectedId(null);
      }
    } else if (activeTool === 'draw') {
      setIsDrawing(true);
      setCurrentLine([{ x, y }]);
    } else if (activeTool === 'text') {
      const defaultText = isAr ? 'انقر مرتين للتعديل' : 'Double click to edit';
      const newTextEl: CanvasElement = {
        id: Math.random().toString(),
        type: 'text',
        x,
        y,
        text: defaultText,
        color: activeColor,
        strokeWidth: 2,
        fontSize: fontSize,
        fontFamily: 'Tajawal',
        fontWeight: 'bold',
        fontStyle: 'normal',
        textAlign: 'left',
        textBgColor: 'transparent',
        textShadow: true
      };
      setElements(prev => [...prev, newTextEl]);
      setSelectedId(newTextEl.id);
      setEditingTextId(newTextEl.id);
      setEditingTextValue(defaultText);
      setActiveTool('select');
    } else if (['arrow', 'rect', 'circle'].includes(activeTool)) {
      setIsDrawing(true);
      setDragStart({ x, y });
    }
  };

  const handleStageMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y
      });
      return;
    }

    const { x, y } = getCanvasCoords(e.clientX, e.clientY);

    if (activeTool === 'select' && dragStart && selectedId) {
      const dx = x - dragStart.x;
      const dy = y - dragStart.y;
      
      setElements(prev => prev.map(el => {
        if (el.id !== selectedId) return el;
        if (el.type === 'rect' || el.type === 'circle' || el.type === 'text') {
          return { ...el, x: el.x! + dx, y: el.y! + dy };
        }
        if (el.type === 'arrow') {
          return { ...el, x1: el.x1! + dx, y1: el.y1! + dy, x2: el.x2! + dx, y2: el.y2! + dy };
        }
        return el;
      }));
      setDragStart({ x, y });
    } else if (isDrawing) {
      if (activeTool === 'draw') {
        setCurrentLine(prev => [...prev, { x, y }]);
      } else if (dragStart) {
        const shape: Partial<CanvasElement> = {
          id: 'preview',
          type: activeTool as any,
          color: activeColor,
          strokeWidth: strokeWidth
        };

        if (activeTool === 'rect') {
          shape.x = Math.min(dragStart.x, x);
          shape.y = Math.min(dragStart.y, y);
          shape.w = Math.abs(x - dragStart.x);
          shape.h = Math.abs(y - dragStart.y);
        } else if (activeTool === 'circle') {
          shape.x = Math.min(dragStart.x, x);
          shape.y = Math.min(dragStart.y, y);
          shape.w = Math.abs(x - dragStart.x);
          shape.h = Math.abs(y - dragStart.y);
        } else if (activeTool === 'arrow') {
          shape.x1 = dragStart.x;
          shape.y1 = dragStart.y;
          shape.x2 = x;
          shape.y2 = y;
        }

        setActiveShape(shape as CanvasElement);
      }
    }
  };

  const handleStageMouseUp = () => {
    setIsPanning(false);
    
    if (isDrawing) {
      setIsDrawing(false);
      
      if (activeTool === 'draw' && currentLine.length > 1) {
        const newLineEl: CanvasElement = {
          id: Math.random().toString(),
          type: 'line',
          points: currentLine,
          color: activeColor,
          strokeWidth: strokeWidth
        };
        setElements(prev => [...prev, newLineEl]);
        setCurrentLine([]);
      } else if (activeShape) {
        setElements(prev => [...prev, { ...activeShape, id: Math.random().toString() }]);
        setActiveShape(null);
      }
    }
    setDragStart(null);
  };

  const handleStageDoubleClick = (e: React.MouseEvent) => {
    if (activeTool !== 'select') return;
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    
    // Find text element clicked (under coordinates)
    const textEl = [...elements].reverse().find(el => {
      if (el.type !== 'text') return false;
      const approxWidth = (el.text || '').length * (el.fontSize! * 0.6);
      const approxHeight = el.fontSize! * 1.5;
      return x >= el.x! && x <= el.x! + approxWidth && y >= el.y! && y <= el.y! + approxHeight;
    });
    
    if (textEl) {
      setEditingTextId(textEl.id);
      setEditingTextValue(textEl.text || '');
    }
  };

  const handleDeleteSelected = () => {
    if (selectedId) {
      setElements(prev => prev.filter(el => el.id !== selectedId));
      setSelectedId(null);
      toast.info(isAr ? 'تم حذف العنصر المالي المحدد' : 'Selected element removed');
    }
  };

  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `perplexta_edit_${artifact.id || 'image'}.png`;
    a.click();
    toast.success(isAr ? 'بدء تنزيل الصورة المعدلة...' : 'Downloading edited image...');
  };

  const handleSendToChat = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error(isAr ? 'عذراً، مساحة العمل غير جاهزة بعد.' : 'Canvas not initialized.');
      return;
    }
    
    try {
      // Convert canvas to blob to form a proper File object for the chat system
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error(isAr ? 'فشل تحويل الصورة المعدلة.' : 'Failed to process the edited image.');
          return;
        }
        
        const file = new File([blob], `edited_image_${Date.now()}.png`, { type: 'image/png' });
        
        // Dispatch custom event to notify ChatPage
        const event = new CustomEvent('inject_image_to_chat', {
          detail: {
            file,
            prompt: isAr ? 'حلل هذه الصورة بعد التعديل:' : 'Analyze this edited image:'
          }
        });
        
        window.dispatchEvent(event);
        toast.success(isAr ? 'تم إرسال الصورة المعدلة للشات وجاري تحليلها!' : 'Sent edited image to chat successfully!');
      }, 'image/png');
    } catch (error) {
      console.error('Error sending image to chat:', error);
      toast.error(isAr ? 'حدث خطأ أثناء الإرسال للشات.' : 'Error sending image to chat.');
    }
  };

  const handleClearAll = () => {
    if (confirm(isAr ? 'هل أنت متأكد من مسح جميع التعديلات؟' : 'Are you sure you want to clear all modifications?')) {
      setElements([]);
      setSelectedId(null);
      setFilters({
        brightness: 100,
        contrast: 100,
        saturation: 100,
        blur: 0,
        grayscale: 0,
        sepia: 0
      });
      toast.success(isAr ? 'تم مسح التعديلات بالكامل' : 'All modifications cleared');
    }
  };

  const handleZoom = (factor: number) => {
    setZoom(prev => Math.max(0.1, Math.min(prev * factor, 5)));
  };

  const colors = ['#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ffffff', '#000000'];

  const selectedElement = useMemo(() => {
    return elements.find(el => el.id === selectedId);
  }, [elements, selectedId]);

  return (
    <div className="flex-1 flex flex-row h-full bg-[#05080e] select-none text-slate-100 relative min-h-0 overflow-hidden">
      
      {/* External Professional Sidebar (Canva Style) */}
      <div className="w-16 md:w-20 bg-[#090d16] border-r border-slate-800/90 flex flex-col items-center py-4 justify-between shrink-0 z-30 select-none">
        <div className="flex flex-col items-center gap-4 w-full px-2">
          {/* Template */}
          <button 
            type="button"
            onClick={() => {
              setActiveTool('select');
              toast.info(isAr ? 'قوالب التصميم جاهزة' : 'Design templates ready');
            }}
            className="group flex flex-col items-center gap-1 w-full py-2 px-1 rounded-shape-md hover:bg-slate-800/60 text-slate-400 hover:text-indigo-400 transition-all cursor-pointer"
            title={isAr ? 'قوالب' : 'Template'}
          >
            <LayoutTemplate size={20} className="group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium">{isAr ? 'قوالب' : 'Template'}</span>
          </button>

          {/* Text */}
          <button 
            type="button"
            onClick={() => {
              setActiveTool('text');
              toast.info(isAr ? 'حدد مكان لإضافة نص' : 'Click to add text element');
            }}
            className={`group flex flex-col items-center gap-1 w-full py-2 px-1 rounded-shape-md transition-all cursor-pointer ${
              activeTool === 'text' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-bold' : 'hover:bg-slate-800/60 text-slate-400 hover:text-indigo-400'
            }`}
            title={isAr ? 'نص' : 'Text'}
          >
            <Type size={20} className="group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium">{isAr ? 'نص' : 'Text'}</span>
          </button>

          {/* Image */}
          <button 
            type="button"
            onClick={() => {
              setActiveTool('select');
              toast.info(isAr ? 'مكتبة الصور' : 'Image library');
            }}
            className="group flex flex-col items-center gap-1 w-full py-2 px-1 rounded-shape-md hover:bg-slate-800/60 text-slate-400 hover:text-indigo-400 transition-all cursor-pointer"
            title={isAr ? 'صورة' : 'Image'}
          >
            <ImageIcon size={20} className="group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium">{isAr ? 'صورة' : 'Image'}</span>
          </button>

          {/* Shape */}
          <button 
            type="button"
            onClick={() => {
              setActiveTool('rect');
              toast.info(isAr ? 'أشكال هندسية' : 'Shapes tool');
            }}
            className={`group flex flex-col items-center gap-1 w-full py-2 px-1 rounded-shape-md transition-all cursor-pointer ${
              ['rect', 'circle', 'arrow'].includes(activeTool) ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-bold' : 'hover:bg-slate-800/60 text-slate-400 hover:text-indigo-400'
            }`}
            title={isAr ? 'أشكال' : 'Shape'}
          >
            <Shapes size={20} className="group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium">{isAr ? 'أشكال' : 'Shape'}</span>
          </button>

          {/* Frame */}
          <button 
            type="button"
            onClick={() => {
              toast.info(isAr ? 'إطارات الصور' : 'Photo Frames');
            }}
            className="group flex flex-col items-center gap-1 w-full py-2 px-1 rounded-shape-md hover:bg-slate-800/60 text-slate-400 hover:text-indigo-400 transition-all cursor-pointer"
            title={isAr ? 'إطار' : 'Frame'}
          >
            <Frame size={20} className="group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium">{isAr ? 'إطار' : 'Frame'}</span>
          </button>

          {/* Upload */}
          <button 
            type="button"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = (e: any) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    if (ev.target?.result) {
                      const img = new Image();
                      img.src = ev.target.result as string;
                      img.onload = () => {
                        imageRef.current = img;
                        setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
                        setImageLoaded(true);
                        fitImageToContainer(img.naturalWidth, img.naturalHeight);
                        toast.success(isAr ? 'تم رفع الصورة بنجاح' : 'Image uploaded successfully');
                      };
                    }
                  };
                  reader.readAsDataURL(file);
                }
              };
              input.click();
            }}
            className="group flex flex-col items-center gap-1 w-full py-2 px-1 rounded-shape-md hover:bg-slate-800/60 text-slate-400 hover:text-indigo-400 transition-all cursor-pointer"
            title={isAr ? 'رفع صورة' : 'Upload'}
          >
            <Upload size={20} className="group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium">{isAr ? 'رفع' : 'Upload'}</span>
          </button>
        </div>

        {/* Version Footer */}
        <div className="text-[10px] font-mono text-slate-500 text-center pb-2">
          v1.0.62
        </div>
      </div>

      {/* Main Editor Body Wrapper */}
      <div className="flex-1 flex flex-col h-full bg-[#05080e] select-none text-slate-100 relative min-h-0 overflow-hidden">
      
      {/* Visual Identity Premium Minimalist Image Editor Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#090d16] border-b border-slate-800/90 gap-4 shrink-0 z-30 flex-wrap md:flex-nowrap overflow-x-auto custom-scrollbar select-none">
        
        {/* Left Side: Close, Fullscreen, and Title */}
        <div className="flex items-center gap-2.5 shrink-0">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-shape-sm border border-slate-800 hover:border-slate-700 bg-transparent text-slate-400 hover:text-rose-400 flex items-center justify-center transition-all cursor-pointer active:scale-95"
              title={isAr ? 'إغلاق المحرر' : 'Close Editor'}
            >
              <X size={15} />
            </button>
          )}

          {onToggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              className="w-8 h-8 rounded-shape-sm border border-slate-800 hover:border-slate-700 bg-transparent text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
              title={isFullscreen ? (isAr ? 'خروج من الشاشة الكاملة' : 'Exit Fullscreen') : (isAr ? 'ملء الشاشة' : 'Fullscreen')}
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
          )}

          <div className="w-px h-5 bg-slate-800/80 hidden sm:block" />

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black text-indigo-400 font-sans tracking-wide">
              {isAr ? 'ميكرو كانفاس' : 'Micro-Canvas'}
            </span>
            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded-shape-sm font-bold hidden sm:inline">
              {isAr ? 'نشط' : 'Active'}
            </span>
          </div>
        </div>

        {/* Center Side: Core Drawing Tool Selection */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 p-0.5 bg-slate-900/60 rounded-shape-md border border-slate-800/80">
            <button
              type="button"
              onClick={() => { setActiveTool('select'); setSelectedId(null); }}
              className={`w-8 h-8 rounded-shape-sm flex items-center justify-center transition-theme cursor-pointer ${
                activeTool === 'select' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={isAr ? 'تحديد وتوجيه العناصر' : 'Select Elements'}
            >
              <Move size={15} />
            </button>

            <button
              type="button"
              onClick={() => setActiveTool('draw')}
              className={`w-8 h-8 rounded-shape-sm flex items-center justify-center transition-theme cursor-pointer ${
                activeTool === 'draw' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={isAr ? 'رسم حر بالفرشاة' : 'Paint Brush'}
            >
              <Edit3 size={15} />
            </button>

            <button
              type="button"
              onClick={() => setActiveTool('text')}
              className={`w-8 h-8 rounded-shape-sm flex items-center justify-center transition-theme cursor-pointer ${
                activeTool === 'text' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={isAr ? 'إضافة نص توضيحي' : 'Add Text'}
            >
              <Type size={15} />
            </button>

            <button
              type="button"
              onClick={() => setActiveTool('arrow')}
              className={`w-8 h-8 rounded-shape-sm flex items-center justify-center transition-theme cursor-pointer ${
                activeTool === 'arrow' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={isAr ? 'سهم توجيهي' : 'Draw Arrow'}
            >
              <ArrowUpRight size={15} />
            </button>

            <button
              type="button"
              onClick={() => setActiveTool('rect')}
              className={`w-8 h-8 rounded-shape-sm flex items-center justify-center transition-theme cursor-pointer ${
                activeTool === 'rect' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={isAr ? 'مستطيل / مربع' : 'Draw Rectangle'}
            >
              <Square size={14} />
            </button>

            <button
              type="button"
              onClick={() => setActiveTool('circle')}
              className={`w-8 h-8 rounded-shape-sm flex items-center justify-center transition-theme cursor-pointer ${
                activeTool === 'circle' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={isAr ? 'دائرة / شكل بيضاوي' : 'Draw Circle'}
            >
              <Circle size={14} />
            </button>

            <button
              type="button"
              onClick={() => setActiveTool('filter')}
              className={`w-8 h-8 rounded-shape-sm flex items-center justify-center transition-theme cursor-pointer ${
                activeTool === 'filter' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={isAr ? 'فلاتر وتعديل الإضاءة' : 'Filters & Image Settings'}
            >
              <Sliders size={14} />
            </button>
          </div>

          {/* Dynamic Context Settings (Colors, Sizes) */}
          <div className="flex items-center gap-2">
            {activeTool !== 'filter' && (
              <div className="flex items-center gap-1 p-0.5 bg-slate-900/40 rounded-shape-md border border-slate-800/60">
                {colors.map(col => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => {
                      setActiveColor(col);
                      if (selectedId) {
                        setElements(prev => prev.map(el => el.id === selectedId ? { ...el, color: col } : el));
                      }
                    }}
                    className="w-5 h-5 rounded-full border border-[var(--border-default)] cursor-pointer active:scale-95 transition-transform flex items-center justify-center shrink-0"
                    style={{ backgroundColor: col }}
                  >
                    {activeColor === col && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white mix-blend-difference" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Line Thickness Slider */}
            {['draw', 'arrow', 'rect', 'circle'].includes(activeTool) && (
              <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                <span>{isAr ? 'السمك:' : 'Thickness:'}</span>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={strokeWidth}
                  onChange={e => {
                    const val = parseInt(e.target.value);
                    setStrokeWidth(val);
                    if (selectedId) {
                      setElements(prev => prev.map(el => el.id === selectedId ? { ...el, strokeWidth: val } : el));
                    }
                  }}
                  className="w-14 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            )}

            {/* Font Size slider */}
            {activeTool === 'text' && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span>{isAr ? 'الحجم:' : 'Size:'}</span>
                <input
                  type="range"
                  min="12"
                  max="72"
                  value={fontSize}
                  onChange={e => {
                    const val = parseInt(e.target.value);
                    setFontSize(val);
                    if (selectedId) {
                      setElements(prev => prev.map(el => el.id === selectedId ? { ...el, fontSize: val } : el));
                    }
                  }}
                  className="w-14 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Actions & Export Controls */}
        <div className="flex items-center gap-2">
          {selectedId && (
            <button
              type="button"
              onClick={handleDeleteSelected}
              className="px-2.5 h-8 bg-rose-500/15 border border-rose-500/25 text-rose-400 hover:bg-rose-500 hover:text-white rounded-shape-sm text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              title={isAr ? 'حذف العنصر المالي المحدد' : 'Delete Selected Shape'}
            >
              <Trash2 size={13} />
              <span className="hidden lg:inline">{isAr ? 'حذف' : 'Delete'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleClearAll}
            className="px-2.5 h-8 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 rounded-shape-sm text-xs font-bold text-slate-400 hover:text-slate-200 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            title={isAr ? 'إعادة تعيين ومسح الكل' : 'Clear All'}
          >
            <RefreshCw size={13} />
            <span className="hidden lg:inline">{isAr ? 'مسح الكل' : 'Clear All'}</span>
          </button>

          <button
            type="button"
            onClick={handleSendToChat}
            className="px-3 h-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-shape-sm text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
            title={isAr ? 'إرسال الصورة المعدلة مباشرة إلى الشات' : 'Send edited image directly to Chat'}
          >
            <Send size={13} />
            <span className="whitespace-nowrap">{isAr ? 'إرسال للشات' : 'Send to Chat'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadImage}
            className="px-3 h-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-shape-sm text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
            title={isAr ? 'تصدير وحفظ الصورة النهائية' : 'Export & Save Image'}
          >
            <Download size={13} />
            <span className="whitespace-nowrap">{isAr ? 'تصدير' : 'Export'}</span>
          </button>
        </div>

      </div>

      {/* Canva Style Custom Text Sub-Toolbar */}
      {selectedElement && selectedElement.type === 'text' && (
        <div className="flex items-center gap-3 px-4 py-2 bg-[#0b1220] border-b border-slate-800/90 text-xs text-slate-300 shrink-0 z-20 overflow-x-auto custom-scrollbar flex-wrap">
          <span className="font-bold text-indigo-400">{isAr ? 'تخصيص النص (كانفا):' : 'Canva Text Styling:'}</span>
          
          {/* Font Family Selector */}
          <div className="flex items-center gap-1.5 min-w-[160px]">
            <span className="text-[10px] text-slate-500 shrink-0">{isAr ? 'الخط:' : 'Font:'}</span>
            <div className="flex-1">
              <SelectDropdown
                size="sm"
                variant="subtle"
                value={selectedElement.fontFamily || 'Tajawal'}
                onChange={val => {
                  setElements(prev => prev.map(el => el.id === selectedId ? { ...el, fontFamily: val } : el));
                }}
                options={[
                  { value: 'Tajawal', label: 'Tajawal (عربي)' },
                  { value: 'Playfair Display', label: 'Playfair Display (Serif)' },
                  { value: 'sans-serif', label: 'Sans-serif' },
                  { value: 'monospace', label: 'Monospace' },
                ]}
              />
            </div>
          </div>

          {/* Font Size Input */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-[var(--text-muted)]">{isAr ? 'الحجم:' : 'Size:'}</span>
            <input
              type="number"
              value={selectedElement.fontSize || 24}
              onChange={e => {
                const val = Math.max(10, Math.min(parseInt(e.target.value) || 24, 150));
                setElements(prev => prev.map(el => el.id === selectedId ? { ...el, fontSize: val } : el));
              }}
              className="w-14 h-7 px-1 text-center bg-[var(--surface-subtle)] border border-[var(--border-default)] rounded-shape-sm text-[11px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-accent)] font-mono"
            />
          </div>

          {/* Color Picker */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-[var(--text-muted)]">{isAr ? 'اللون:' : 'Color:'}</span>
            <input
              type="color"
              value={selectedElement.color || '#ffffff'}
              onChange={e => {
                setElements(prev => prev.map(el => el.id === selectedId ? { ...el, color: e.target.value } : el));
              }}
              className="w-6 h-6 border-0 p-0 rounded-shape-xs bg-transparent cursor-pointer"
            />
          </div>

          {/* Bold Toggle */}
          <button
            type="button"
            onClick={() => {
              const isBold = selectedElement.fontWeight === 'bold';
              setElements(prev => prev.map(el => el.id === selectedId ? { ...el, fontWeight: isBold ? 'normal' : 'bold' } : el));
            }}
            className={`h-7 px-2.5 rounded-shape-sm border text-[11px] font-bold cursor-pointer transition-colors ${
              selectedElement.fontWeight === 'bold' ? 'bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] border-transparent' : 'bg-[var(--surface-subtle)] text-[var(--text-muted)] border-[var(--border-default)] hover:text-[var(--text-primary)]'
            }`}
          >
            B
          </button>

          {/* Italic Toggle */}
          <button
            type="button"
            onClick={() => {
              const isItalic = selectedElement.fontStyle === 'italic';
              setElements(prev => prev.map(el => el.id === selectedId ? { ...el, fontStyle: isItalic ? 'normal' : 'italic' } : el));
            }}
            className={`h-7 px-2.5 rounded-shape-sm border text-[11px] italic cursor-pointer transition-colors ${
              selectedElement.fontStyle === 'italic' ? 'bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] border-transparent' : 'bg-[var(--surface-subtle)] text-[var(--text-muted)] border-[var(--border-default)] hover:text-[var(--text-primary)]'
            }`}
          >
            I
          </button>

          {/* Alignment */}
          <div className="flex items-center gap-0.5 p-0.5 bg-[var(--surface-subtle)] rounded-shape-md border border-[var(--border-default)]">
            {['left', 'center', 'right'].map(align => (
              <button
                key={align}
                type="button"
                onClick={() => {
                  setElements(prev => prev.map(el => el.id === selectedId ? { ...el, textAlign: align } : el));
                }}
                className={`px-2 h-6 rounded-shape-xs text-[10px] font-bold capitalize cursor-pointer transition-colors ${
                  (selectedElement.textAlign || 'left') === align ? 'bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {align}
              </button>
            ))}
          </div>

          {/* Shadow Toggle */}
          <button
            type="button"
            onClick={() => {
              const hasShadow = !selectedElement.textShadow;
              setElements(prev => prev.map(el => el.id === selectedId ? { ...el, textShadow: hasShadow } : el));
            }}
            className={`h-7 px-2.5 rounded-shape-sm border text-[11px] cursor-pointer transition-colors ${
              selectedElement.textShadow ? 'bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] border-transparent' : 'bg-[var(--surface-subtle)] text-[var(--text-muted)] border-[var(--border-default)] hover:text-[var(--text-primary)]'
            }`}
            title={isAr ? 'إضافة ظل خلفي للوضوح' : 'Add text drop shadow for clarity'}
          >
            {isAr ? 'ظل النص' : 'Text Shadow'}
          </button>

          {/* Background Fill Color */}
          <div className="flex items-center gap-1.5 min-w-[150px]">
            <span className="text-[10px] text-[var(--text-muted)] shrink-0">{isAr ? 'الخلفية:' : 'BG:'}</span>
            <div className="flex-1">
              <SelectDropdown
                size="sm"
                variant="subtle"
                value={selectedElement.textBgColor || 'transparent'}
                onChange={val => {
                  setElements(prev => prev.map(el => el.id === selectedId ? { ...el, textBgColor: val } : el));
                }}
                options={[
                  { value: 'transparent', label: isAr ? 'شفاف' : 'Transparent' },
                  { value: 'rgba(0,0,0,0.65)', label: isAr ? 'أسود شفاف' : 'Translucent Black' },
                  { value: 'rgba(255,255,255,0.85)', label: isAr ? 'أبيض شفاف' : 'Translucent White' },
                  { value: '#000000', label: isAr ? 'أسود' : 'Black' },
                  { value: '#ffffff', label: isAr ? 'أبيض' : 'White' },
                  { value: '#ef4444', label: isAr ? 'أحمر' : 'Red' },
                  { value: '#f59e0b', label: isAr ? 'ذهبي' : 'Gold' },
                ]}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Interactive Stage Area */}
      <div className="flex-1 flex flex-row overflow-hidden relative min-h-0">
        
        {/* Left Side Filter Sliders Panel (Visible when activeTool === 'filter') */}
        {activeTool === 'filter' && (
          <div className="w-56 bg-[#090d16] border-r border-slate-800/90 p-4 shrink-0 overflow-y-auto space-y-5 custom-scrollbar">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <Sliders size={14} className="text-indigo-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                {isAr ? 'فلاتر ومؤثرات بعد الإنتاج' : 'Post-Production FX'}
              </h3>
            </div>

            {/* Brightness */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>{isAr ? 'السطوع' : 'Brightness'}</span>
                <span className="font-mono">{filters.brightness}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="200"
                value={filters.brightness}
                onChange={e => setFilters(prev => ({ ...prev, brightness: parseInt(e.target.value) }))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Contrast */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>{isAr ? 'التباين' : 'Contrast'}</span>
                <span className="font-mono">{filters.contrast}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="200"
                value={filters.contrast}
                onChange={e => setFilters(prev => ({ ...prev, contrast: parseInt(e.target.value) }))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Saturation */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>{isAr ? 'شبع الألوان' : 'Saturation'}</span>
                <span className="font-mono">{filters.saturation}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={filters.saturation}
                onChange={e => setFilters(prev => ({ ...prev, saturation: parseInt(e.target.value) }))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Blur */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>{isAr ? 'التمويه / النعومة' : 'Blur'}</span>
                <span className="font-mono">{filters.blur}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={filters.blur}
                onChange={e => setFilters(prev => ({ ...prev, blur: parseInt(e.target.value) }))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Grayscale */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>{isAr ? 'تدرج رمادي' : 'Grayscale'}</span>
                <span className="font-mono">{filters.grayscale}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={filters.grayscale}
                onChange={e => setFilters(prev => ({ ...prev, grayscale: parseInt(e.target.value) }))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Sepia */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>{isAr ? 'عتيق / سيبيا' : 'Sepia'}</span>
                <span className="font-mono">{filters.sepia}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={filters.sepia}
                onChange={e => setFilters(prev => ({ ...prev, sepia: parseInt(e.target.value) }))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

          </div>
        )}

        {/* Primary Pan & Zoom Interactive Stage Canvas */}
        <div 
          ref={containerRef}
          className="flex-1 flex items-center justify-center relative bg-[#04060b] overflow-hidden min-w-0"
        >
          {!imageLoaded && (
            <div className="flex flex-col items-center gap-3 text-slate-500 animate-pulse">
              <RefreshCw className="animate-spin text-indigo-400" size={24} />
              <span className="text-xs font-bold">{isAr ? 'جاري تحميل لوحة التصميم البصري...' : 'Loading Visual Design Stage...'}</span>
            </div>
          )}

          {/* Floating Pan/Zoom Indicators */}
          {imageLoaded && (
            <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 p-1 bg-slate-900/80 backdrop-blur-md rounded-shape-md border border-slate-800 shadow-lg text-slate-400">
              <button 
                type="button"
                onClick={() => handleZoom(0.85)} 
                className="w-7 h-7 flex items-center justify-center hover:bg-slate-800 rounded-shape-sm text-slate-300 hover:text-white cursor-pointer active:scale-95"
                title={isAr ? 'تصغير' : 'Zoom Out'}
              >
                <ZoomOut size={14} />
              </button>
              <span className="text-[10px] font-mono px-1.5 font-bold text-slate-300 select-none bg-slate-950/40 rounded-shape-sm py-0.5 border border-slate-900">
                {Math.round(zoom * 100)}%
              </span>
              <button 
                type="button"
                onClick={() => handleZoom(1.15)} 
                className="w-7 h-7 flex items-center justify-center hover:bg-slate-800 rounded-shape-sm text-slate-300 hover:text-white cursor-pointer active:scale-95"
                title={isAr ? 'تكبير' : 'Zoom In'}
              >
                <ZoomIn size={14} />
              </button>
              <div className="w-px h-4 bg-slate-800 mx-0.5" />
              <button 
                type="button"
                onClick={() => fitImageToContainer(imageSize.width, imageSize.height)} 
                className="px-2 h-7 flex items-center justify-center hover:bg-slate-800 rounded-shape-sm text-[10px] font-bold text-slate-300 hover:text-white cursor-pointer active:scale-95"
                title={isAr ? 'توسيط وتكبير ملائم' : 'Fit to screen'}
              >
                {isAr ? 'توسيط' : 'Fit'}
              </button>
            </div>
          )}

          {/* Canvas Viewport Transformer */}
          {imageLoaded && (
            <div
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: '0 0',
                cursor: isPanning ? 'grabbing' : activeTool === 'select' ? 'default' : 'crosshair'
              }}
              className="absolute left-0 top-0 transition-transform duration-75 ease-out select-none shadow-2xl"
              onMouseDown={handleStageMouseDown}
              onMouseMove={handleStageMouseMove}
              onMouseUp={handleStageMouseUp}
              onMouseLeave={handleStageMouseUp}
              onDoubleClick={handleStageDoubleClick}
            >
              <canvas 
                ref={canvasRef} 
                className="block select-none pointer-events-auto rounded-shape-xs bg-slate-950/20"
                style={{ imageRendering: 'auto' }}
              />

              {/* Canva Style Inline Text Overlay Inputs */}
              {elements.map(el => {
                if (el.type !== 'text' || editingTextId !== el.id) return null;
                
                return (
                  <textarea
                    key={`edit-${el.id}`}
                    value={editingTextValue}
                    onChange={(e) => {
                      setEditingTextValue(e.target.value);
                      setElements(prev => prev.map(item => item.id === el.id ? { ...item, text: e.target.value } : item));
                    }}
                    onKeyDown={(e) => {
                      // Save and blur text on Ctrl+Enter
                      if (e.key === 'Enter' && e.ctrlKey) {
                        e.currentTarget.blur();
                      }
                    }}
                    onBlur={() => {
                      setElements(prev => prev.map(item => item.id === el.id ? { ...item, text: editingTextValue } : item));
                      setEditingTextId(null);
                    }}
                    autoFocus
                    style={{
                      position: 'absolute',
                      left: `${el.x}px`,
                      top: `${el.y}px`,
                      font: `${el.fontStyle || 'normal'} ${el.fontWeight || 'bold'} ${el.fontSize}px ${el.fontFamily || 'sans-serif'}`,
                      color: el.color,
                      background: el.textBgColor && el.textBgColor !== 'transparent' ? el.textBgColor : 'rgba(15, 23, 42, 0.75)',
                      border: '2px dashed #6366f1',
                      outline: 'none',
                      resize: 'none',
                      minWidth: '200px',
                      height: 'auto',
                      overflow: 'hidden',
                      whiteSpace: 'pre-wrap',
                      padding: '6px',
                      lineHeight: '1.25',
                      zIndex: 50,
                      borderRadius: '4px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.5)'
                    }}
                    className="custom-scrollbar text-slate-100 placeholder-slate-400 select-text"
                    placeholder={isAr ? 'اكتب شيئاً...' : 'Type something...'}
                  />
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>

  </div>
  );
};
