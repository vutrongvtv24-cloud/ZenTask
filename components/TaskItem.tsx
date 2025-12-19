
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

const getPriorityStyles = (priority: TaskPriority) => {
  switch (priority) {
    case TaskPriority.HIGH: return 'bg-rose-500 text-white';
    case TaskPriority.MEDIUM: return 'bg-amber-500 text-white';
    default: return 'bg-emerald-500 text-white';
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

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`group flex items-start gap-3 p-4 md:p-5 rounded-2xl md:rounded-3xl border transition-all ${
        task.completed 
          ? (isDark ? 'opacity-30 bg-slate-800/50 border-transparent' : 'opacity-40 border-transparent bg-slate-50') 
          : (isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm hover:shadow-md')
      } ${isFirst && !task.completed ? 'ring-2 ring-indigo-500/50' : ''}`}
    >
      <button 
        {...attributes} 
        {...listeners}
        className={`mt-1 md:mt-1.5 cursor-grab p-1 -ml-1 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block ${isDark ? 'text-slate-700' : 'text-slate-300'}`}
      >
        <i className="fa-solid fa-grip-vertical"></i>
      </button>

      <button 
        onClick={() => onToggle(task.id)}
        className={`mt-0.5 w-8 h-8 md:w-9 md:h-9 shrink-0 rounded-xl border-2 flex items-center justify-center transition-all ${
          task.completed 
            ? 'bg-fuchsia-600 border-fuchsia-600 text-white shadow-md' 
            : (isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50')
        }`}
      >
        {task.completed && <i className="fa-solid fa-check text-[10px] md:text-xs"></i>}
      </button>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className={`font-bold text-base md:text-lg leading-tight truncate ${
            task.completed ? 'line-through' : (isDark ? 'text-white' : 'text-slate-800')
          }`}>
            {task.title}
          </h3>
          {isFirst && !task.completed && (
            <span className="bg-indigo-600 text-[8px] text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest hidden sm:inline">
              #1
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2 mt-2">
           <div className={`w-1.5 h-1.5 rounded-full ${getPriorityStyles(task.priority).split(' ')[0]}`}></div>
           <span className="text-[9px] font-black uppercase tracking-widest opacity-30">{task.priority}</span>
        </div>
      </div>

      <div className="flex items-center shrink-0">
        {isConfirming ? (
          <div className="flex gap-1 animate-in slide-in-from-right-2">
            <button onClick={() => onDelete(task.id)} className="w-8 h-8 rounded-lg bg-rose-500 text-white text-[10px] flex items-center justify-center font-black uppercase tracking-widest">
              <i className="fa-solid fa-check"></i>
            </button>
            <button onClick={() => setIsConfirming(false)} className="w-8 h-8 rounded-lg bg-slate-200 text-slate-600 text-[10px] flex items-center justify-center font-black uppercase tracking-widest">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setIsConfirming(true)}
            className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-rose-500 transition-all rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10"
          >
            <i className="fa-solid fa-trash-can text-sm"></i>
          </button>
        )}
      </div>
    </div>
  );
};
