
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Task, TaskPriority, TaskCategory, UserStats } from './types';
import { TaskItem } from './components/TaskItem';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

const DailyProgressRing: React.FC<{ current: number; total: number; color: string; isDark: boolean }> = ({ current, total, color, isDark }) => {
  const radius = 36;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const percentage = total > 0 ? (current / total) * 100 : 0;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center transform transition-transform hover:scale-110 duration-300">
      <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
        <circle
          stroke={isDark ? '#1e293b' : '#f1f5f9'}
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          strokeLinecap="round"
          className={`${color} ${current === total && current > 0 ? 'drop-shadow-[0_0_8px_currentColor]' : ''}`}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className={`text-lg font-black leading-none ${isDark ? 'text-white' : 'text-slate-800'}`}>
          {current}
        </span>
        <div className={`w-4 h-0.5 my-0.5 opacity-30 ${isDark ? 'bg-white' : 'bg-slate-800'}`}></div>
        <span className="text-[10px] font-bold opacity-40 uppercase tracking-tighter">{total}</span>
      </div>
      {current === total && current > 0 && (
        <div className="absolute -top-1 -right-1 bg-amber-400 text-white w-5 h-5 rounded-full flex items-center justify-center shadow-lg animate-bounce z-10">
          <i className="fa-solid fa-crown text-[10px]"></i>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'DONE'>('ALL');
  
  const [stats, setStats] = useState<UserStats>({
    completedDaysCount: 0,
    lastCompletionDate: null
  });

  // DND Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Pomodoro States
  const [timerMode, setTimerMode] = useState<'WORK' | 'REST'>('WORK');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showTimerAlert, setShowTimerAlert] = useState(false);
  const timerIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    const savedTasks = localStorage.getItem('zen_tasks');
    const savedStats = localStorage.getItem('zen_stats');
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedStats) setStats(JSON.parse(savedStats));
  }, []);

  useEffect(() => {
    localStorage.setItem('zen_tasks', JSON.stringify(tasks));
    localStorage.setItem('zen_stats', JSON.stringify(stats));
  }, [tasks, stats]);

  // Timer Logic
  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      timerIntervalRef.current = window.setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning, timeLeft]);

  const handleTimerComplete = () => {
    setIsTimerRunning(false);
    setShowTimerAlert(true);
    
    if ("vibrate" in navigator) {
      navigator.vibrate([1000, 500, 1000, 500, 1000]);
    }
  };

  const startNextCycle = () => {
    if ("vibrate" in navigator) {
      navigator.vibrate(0);
    }
    const nextMode = timerMode === 'WORK' ? 'REST' : 'WORK';
    setTimerMode(nextMode);
    setTimeLeft(nextMode === 'WORK' ? 25 * 60 : 5 * 60);
    setShowTimerAlert(false);
    setIsTimerRunning(true);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentLevel = useMemo(() => {
    if (stats.completedDaysCount >= 90) return 4;
    if (stats.completedDaysCount >= 60) return 3;
    if (stats.completedDaysCount >= 30) return 2;
    return 1;
  }, [stats.completedDaysCount]);

  const themeClasses = useMemo(() => {
    switch (currentLevel) {
      case 2: return { bg: 'bg-emerald-50', text: 'text-emerald-900', primary: 'bg-emerald-600', accent: 'text-emerald-600', ringColor: 'text-emerald-500', isDark: false };
      case 3: return { bg: 'bg-indigo-100', text: 'text-indigo-950', primary: 'bg-indigo-700', accent: 'text-indigo-700', ringColor: 'text-indigo-500', isDark: false };
      case 4: return { bg: 'bg-slate-950', text: 'text-white', primary: 'bg-fuchsia-600', accent: 'text-fuchsia-400', ringColor: 'text-fuchsia-500', isDark: true };
      default: return { bg: 'bg-slate-50', text: 'text-slate-900', primary: 'bg-indigo-600', accent: 'text-indigo-600', ringColor: 'text-indigo-500', isDark: false };
    }
  }, [currentLevel]);

  const tasksCreatedToday = useMemo(() => {
    const today = new Date().toDateString();
    return tasks.filter(t => new Date(t.createdAt).toDateString() === today);
  }, [tasks]);

  const completedTodayCount = useMemo(() => {
    return tasksCreatedToday.filter(t => t.completed).length;
  }, [tasksCreatedToday]);

  const dailyProgressPercent = useMemo(() => {
    return Math.min((completedTodayCount / 2) * 100, 100);
  }, [completedTodayCount]);

  // Helper function to recalculate all priorities based on current order
  const updatePrioritiesByOrder = (items: Task[]): Task[] => {
    return items.map((item, idx) => {
      let p = TaskPriority.LOW;
      if (idx === 0) p = TaskPriority.HIGH;
      else if (idx === 1) p = TaskPriority.MEDIUM;
      return { ...item, priority: p };
    });
  };

  const addTask = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTaskTitle.trim()) return;
    if (tasksCreatedToday.length >= 2) {
      alert("Hôm nay bạn đã đạt giới hạn 2 Task!");
      return;
    }
    const title = newTaskTitle;
    setNewTaskTitle('');
    
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: title,
      completed: false,
      priority: tasks.length === 0 ? TaskPriority.HIGH : TaskPriority.MEDIUM,
      category: TaskCategory.OTHER,
      createdAt: Date.now()
    };
    
    setTasks(prev => {
      const newList = [newTask, ...prev];
      return updatePrioritiesByOrder(newList);
    });
  };

  useEffect(() => {
    const todayISO = new Date().toISOString().split('T')[0];
    if (tasksCreatedToday.length === 2 && tasksCreatedToday.every(t => t.completed)) {
      if (stats.lastCompletionDate !== todayISO) {
        setStats(prev => ({
          completedDaysCount: prev.completedDaysCount + 1,
          lastCompletionDate: todayISO
        }));
      }
    }
  }, [tasksCreatedToday, stats.lastCompletionDate]);

  const toggleTask = useCallback((id: string) => {
    setTasks(prev => {
      const taskIndex = prev.findIndex(t => t.id === id);
      if (taskIndex === -1) return prev;
      const task = prev[taskIndex];
      if (!task.completed) {
        if (!window.confirm(`Xác nhận hoàn thành: "${task.title}"?`)) return prev;
      }
      const newTasks = [...prev];
      newTasks[taskIndex] = { ...task, completed: !task.completed };
      return newTasks;
    });
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => {
      const filtered = prev.filter(t => t.id !== id);
      return updatePrioritiesByOrder(filtered);
    });
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setTasks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        return updatePrioritiesByOrder(newItems);
      });
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (activeTab === 'ACTIVE') return !t.completed;
      if (activeTab === 'DONE') return t.completed;
      return true;
    });
  }, [tasks, activeTab]);

  const levelProgress = useMemo(() => {
    let target = 30;
    let base = 0;
    if (currentLevel === 2) { target = 60; base = 30; }
    if (currentLevel === 3) { target = 90; base = 60; }
    if (currentLevel === 4) return 100;
    return ((stats.completedDaysCount - base) / (target - base)) * 100;
  }, [stats.completedDaysCount, currentLevel]);

  return (
    <div className={`min-h-screen ${themeClasses.bg} ${themeClasses.text} flex flex-col max-w-2xl mx-auto shadow-2xl transition-all duration-500 overflow-x-hidden relative`}>
      {/* Timer Bar */}
      <div className={`py-1 px-4 flex items-center justify-center gap-4 text-[10px] font-black tracking-widest uppercase border-b ${themeClasses.isDark ? 'bg-slate-900 border-slate-800 text-fuchsia-400' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
        <div className="flex items-center gap-1.5">
          <i className={`fa-solid fa-hourglass-half ${isTimerRunning ? 'animate-spin' : ''}`}></i>
          <span>{timerMode === 'WORK' ? 'Làm việc' : 'Nghỉ ngơi'}</span>
        </div>
        <span className="text-sm font-black font-mono">{formatTime(timeLeft)}</span>
        <button 
          onClick={() => setIsTimerRunning(!isTimerRunning)}
          className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${isTimerRunning ? 'bg-rose-500 text-white' : themeClasses.primary + ' text-white'}`}
        >
          <i className={`fa-solid ${isTimerRunning ? 'fa-pause text-[8px]' : 'fa-play text-[8px]'}`}></i>
        </button>
      </div>

      <header className={`sticky top-0 z-30 ${themeClasses.isDark ? 'bg-slate-900/90' : 'bg-white/80'} backdrop-blur-md border-b ${themeClasses.isDark ? 'border-slate-800' : 'border-slate-100'} p-4 pt-6`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <DailyProgressRing current={completedTodayCount} total={2} color={themeClasses.ringColor} isDark={themeClasses.isDark} />
            <div>
              <h1 className="text-xl font-black tracking-tight leading-none mb-1">ZEN TASK</h1>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${themeClasses.primary} text-white`}>LEVEL {currentLevel}</span>
                <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{stats.completedDaysCount} Days</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-1.5">
           <div className="flex justify-between items-end">
              <span className="text-[9px] font-black uppercase opacity-40 tracking-widest">Tiến độ cấp độ</span>
              <span className="text-[10px] font-black opacity-60 italic">{currentLevel < 4 ? `Lên Cấp ${currentLevel + 1}` : 'Cấp Độ Tối Thượng'}</span>
           </div>
           <div className={`w-full h-1.5 ${themeClasses.isDark ? 'bg-slate-800' : 'bg-slate-100'} rounded-full overflow-hidden`}>
             <div className={`h-full ${themeClasses.primary} transition-all duration-1000 ease-out rounded-full`} style={{ width: `${levelProgress}%` }}></div>
           </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 pb-32">
        {/* Daily Hero Progress Section */}
        <div className={`mb-8 p-6 rounded-[2.5rem] border overflow-hidden relative ${themeClasses.isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xs font-black uppercase tracking-[0.2em] opacity-40 mb-1">Nhiệm vụ hàng ngày</h2>
                <p className="text-2xl font-black tracking-tight">
                  {completedTodayCount === 2 ? 'Đã hoàn thành! 🎉' : 'Đang thực hiện...'}
                </p>
              </div>
              <div className="text-right">
                <span className={`text-3xl font-black font-mono ${themeClasses.ringColor}`}>
                  {dailyProgressPercent}%
                </span>
              </div>
            </div>
            
            <div className={`w-full h-4 ${themeClasses.isDark ? 'bg-slate-800' : 'bg-slate-100'} rounded-full overflow-hidden p-1`}>
              <div 
                className={`h-full ${themeClasses.primary} rounded-full transition-all duration-700 ease-[cubic-bezier(0.34, 1.56, 0.64, 1)] relative`}
                style={{ width: `${dailyProgressPercent}%` }}
              >
                {dailyProgressPercent > 0 && (
                  <div className="absolute top-0 right-0 bottom-0 w-8 bg-white/20 skew-x-[30deg] animate-[pulse_1s_infinite]"></div>
                )}
              </div>
            </div>
            
            <p className="text-[10px] mt-4 font-bold opacity-40 uppercase tracking-widest text-center">
              {completedTodayCount < 2 ? `Còn ${2 - completedTodayCount} việc nữa để đạt mục tiêu` : 'Bạn đã làm rất tốt hôm nay!'}
            </p>
          </div>
          <div className={`absolute -right-10 -bottom-10 w-40 h-40 rounded-full blur-3xl opacity-10 ${themeClasses.primary}`}></div>
        </div>

        {/* Tabs Filter */}
        <div className={`flex p-1 ${themeClasses.isDark ? 'bg-slate-800' : 'bg-slate-100'} rounded-2xl mb-8`}>
          {(['ALL', 'ACTIVE', 'DONE'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl ${activeTab === tab ? (themeClasses.isDark ? 'bg-slate-700 text-fuchsia-400 shadow-md' : 'bg-white text-indigo-600 shadow-sm') : 'text-slate-400'}`}>{tab === 'ALL' ? 'Tất cả' : tab === 'ACTIVE' ? 'Đang làm' : 'Đã xong'}</button>
          ))}
        </div>

        {/* Task List Header */}
        <div className="flex justify-between items-center mb-4 px-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${tasksCreatedToday.length >= 2 ? 'bg-rose-500 animate-pulse' : 'bg-indigo-400'}`}></div>
              <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">Danh sách: {tasksCreatedToday.length}/2 Task</span>
            </div>
            <span className="text-[8px] font-bold opacity-30 uppercase italic">Kéo thả để đổi ưu tiên</span>
        </div>

        {/* Tasks Content with DND Context */}
        <div className="space-y-3">
          {filteredTasks.length > 0 ? (
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={filteredTasks.map(t => t.id)}
                strategy={verticalListSortingStrategy}
              >
                {filteredTasks.map((task, index) => (
                  <TaskItem 
                    key={task.id} 
                    task={task} 
                    onToggle={toggleTask} 
                    onDelete={deleteTask} 
                    isDark={themeClasses.isDark}
                    isFirst={index === 0 && activeTab !== 'DONE'}
                  />
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            <div className="text-center py-20">
              <div className={`w-20 h-20 ${themeClasses.isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} rounded-[2rem] shadow-sm border flex items-center justify-center mx-auto mb-6 transform rotate-6`}><i className={`fa-solid fa-feather-pointed ${themeClasses.accent} opacity-20 text-3xl`}></i></div>
              <p className="text-xs font-bold opacity-30 uppercase tracking-[0.2em]">Danh sách trống</p>
            </div>
          )}
        </div>
      </main>

      {/* Floating Action Input */}
      <div className={`fixed bottom-0 left-0 right-0 p-4 pb-10 bg-gradient-to-t ${themeClasses.isDark ? 'from-slate-950 via-slate-950' : 'from-slate-50 via-slate-50'} to-transparent pointer-events-none z-40 max-w-2xl mx-auto`}>
        <form onSubmit={addTask} className="relative pointer-events-auto">
          <div className={`${themeClasses.isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} flex items-center gap-2 p-2 rounded-[2rem] shadow-2xl border`}>
            <input type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder={tasksCreatedToday.length >= 2 ? "Đã đạt giới hạn hôm nay..." : "Kế hoạch tiếp theo là gì?"} disabled={tasksCreatedToday.length >= 2} className={`flex-1 pl-5 py-4 bg-transparent outline-none ${themeClasses.isDark ? 'text-white' : 'text-slate-800'} placeholder:opacity-30 text-sm font-bold disabled:cursor-not-allowed`} />
            <button type="submit" disabled={!newTaskTitle.trim() || tasksCreatedToday.length >= 2} className={`w-14 h-14 ${tasksCreatedToday.length >= 2 ? 'bg-slate-700 opacity-20' : themeClasses.primary} text-white rounded-[1.5rem] flex items-center justify-center transition-all shrink-0 active:scale-90 shadow-xl`}><i className="fa-solid fa-chevron-up text-lg"></i></button>
          </div>
        </form>
      </div>

      {/* Timer Alert Popup */}
      {showTimerAlert && (
        <div className="fixed inset-0 bg-rose-600 z-[100] flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in duration-300">
           <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mb-12 animate-pulse">
              <i className="fa-solid fa-bell text-white text-6xl"></i>
           </div>
           <h2 className="text-white text-5xl font-black text-center mb-4 tracking-tighter uppercase leading-none">
             {timerMode === 'WORK' ? 'Xong việc rồi!' : 'Hết giờ nghỉ!'}
           </h2>
           <p className="text-rose-100 text-xl font-bold mb-12 uppercase tracking-widest text-center">
             {timerMode === 'WORK' ? 'Đã đến lúc nghỉ ngơi 5 phút' : 'Quay lại làm việc thôi nào'}
           </p>
           <button 
             onClick={startNextCycle}
             className="w-full max-w-xs py-6 bg-white text-rose-600 rounded-[2.5rem] font-black text-lg uppercase tracking-widest shadow-2xl active:scale-95 transition-transform"
           >
             Bắt đầu ngay
           </button>
        </div>
      )}
    </div>
  );
};

export default App;
