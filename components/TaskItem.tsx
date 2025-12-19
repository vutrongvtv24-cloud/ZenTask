
import React, { useState } from 'react';
import { Task, TaskPriority } from '../types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  isDark?: boolean;
  isFirst?: boolean;
}

const getPriorityStyles = (priority: TaskPriority, isDark: boolean) => {
  // Vibrant solid colors for clear distinction
  switch (priority) {
    case TaskPriority.HIGH: 
      return 'bg-rose-600 text-white border-rose-700 shadow-sm shadow-rose-200';
    case TaskPriority.MEDIUM: 
      return 'bg-amber-500 text-white border-amber-600 shadow-sm shadow-amber-100';
    case TaskPriority.LOW: 
      return 'bg-emerald-500 text-white border-emerald-600 shadow-sm shadow-emerald-100';
    default: 
      return 'bg-slate-500 text-white border-slate-600';
  }
};

export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete, isDark = false, isFirst = false }) => {
  const [isConfirming, setIsConfirming] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirming(true);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirming(false);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(task.id);
    setIsConfirming(false);
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`group flex items-start gap-3 p-4 rounded-2xl border transition-all shadow-sm ${
        isDragging ? 'z-50 drag-overlay' : ''
      } ${
        task.completed 
          ? (isDark ? 'opacity-40 bg-slate-800/50 border-transparent' : 'opacity-50 border-transparent bg-slate-50') 
          : (isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100')
      } ${isFirst && !task.completed ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-transparent' : ''}`}
    >
      {/* Drag Handle */}
      <button 
        {...attributes} 
        {...listeners}
        className={`mt-1 cursor-grab active:cursor-grabbing p-1 -ml-2 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'text-slate-600' : 'text-slate-300'}`}
      >
        <i className="fa-solid fa-grip-vertical"></i>
      </button>

      <button 
        onClick={() => onToggle(task.id)}
        className={`mt-0.5 w-7 h-7 shrink-0 rounded-xl border-2 flex items-center justify-center transition-all ${
          task.completed 
            ? 'bg-fuchsia-600 border-fuchsia-600 text-white shadow-md' 
            : (isDark ? 'border-slate-600 bg-slate-900' : 'border-slate-200 bg-slate-50')
        }`}
      >
        {task.completed && <i className="fa-solid fa-check text-[10px] stroke-2"></i>}
      </button>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className={`font-bold text-[15px] leading-snug truncate ${
            task.completed 
              ? 'line-through opacity-50' 
              : (isDark ? 'text-white' : 'text-slate-800')
          }`}>
            {task.title}
          </h3>
          {isFirst && !task.completed && (
            <span className="bg-indigo-600 text-[8px] text-white px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter animate-pulse">
              Ưu tiên #1
            </span>
          )}
        </div>
        
        {!task.completed && task.description && (
          <p className={`text-xs leading-relaxed line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {task.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mt-2.5">
          <span className={`text-[9px] px-2 py-0.5 rounded-lg border uppercase font-black tracking-wider ${getPriorityStyles(task.priority, isDark)}`}>
            {task.priority === TaskPriority.HIGH ? 'Quan trọng' : task.priority === TaskPriority.MEDIUM ? 'Trung bình' : 'Ưu tiên thấp'}
          </span>
          <span className={`text-[9px] px-2 py-0.5 rounded-lg border font-bold uppercase tracking-tight ${
            isDark ? 'bg-slate-900 border-slate-700 text-slate-500' : 'border-slate-100 text-slate-400 bg-white'
          }`}>
            {task.category}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 -mr-2">
        {isConfirming ? (
          <div className="flex items-center gap-1 animate-in slide-in-from-right-2 duration-200">
            <button 
              onClick={handleConfirmDelete}
              className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
              title="Xác nhận xóa"
            >
              <i className="fa-solid fa-check text-[10px]"></i>
            </button>
            <button 
              onClick={handleCancelDelete}
              className="w-8 h-8 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center active:scale-90 transition-transform"
              title="Hủy"
            >
              <i className="fa-solid fa-xmark text-[10px]"></i>
            </button>
          </div>
        ) : (
          <button 
            onClick={handleDeleteClick}
            className="text-slate-400 hover:text-rose-500 transition-colors p-2 shrink-0 active:scale-125"
          >
            <i className="fa-solid fa-trash-can text-sm"></i>
          </button>
        )}
      </div>
    </div>
  );
};
