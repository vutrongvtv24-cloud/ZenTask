
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
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'DONE' | 'TIMER'>('ALL');
  const [stats, setStats] = useState<UserStats>({ completedDaysCount: 0, lastCompletionDate: null });
  const inputRef = useRef<HTMLInputElement>(null);

  // Timer states
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerIntervalRef = useRef<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const savedTasks = localStorage.getItem('zen_tasks');
    const savedStats = localStorage.getItem('zen_stats');
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedStats) setStats(JSON.parse(savedStats));

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'n' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        setActiveTab('ALL'); // Switch back to task view if on timer
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    localStorage.setItem('zen_tasks', JSON.stringify(tasks));
    localStorage.setItem('zen_stats', JSON.stringify(stats));
  }, [tasks, stats]);

  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      timerIntervalRef.current = window.setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setIsTimerRunning(false);
      if (Notification.permission === 'granted') {
        new Notification("ZenTask", { body: "Hết giờ! Nghỉ ngơi hoặc quay lại làm việc nào." });
      } else {
        alert("Thời gian đã hết!");
      }
    }
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
  }, [isTimerRunning, timeLeft]);

  const currentLevel = useMemo(() => {
    if (stats.completedDaysCount >= 90) return 4;
    if (stats.completedDaysCount >= 60) return 3;
    if (stats.completedDaysCount >= 30) return 2;
    return 1;
  }, [stats.completedDaysCount]);

  const theme = useMemo(() => {
    const isDark = currentLevel === 4;
    return {
      isDark,
      bg: isDark ? 'bg-slate-950' : 'bg-slate-50',
      panel: isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100',
      text: isDark ? 'text-white' : 'text-slate-900',
      primary: isDark ? 'bg-fuchsia-600' : 'bg-indigo-600',
      primaryText: isDark ? 'text-fuchsia-400' : 'text-indigo-600',
    };
  }, [currentLevel]);

  const tasksCreatedToday = useMemo(() => {
    const today = new Date().toDateString();
    return tasks.filter(t => new Date(t.createdAt).toDateString() === today);
  }, [tasks]);

  const completedTodayCount = tasksCreatedToday.filter(t => t.completed).length;

  const updatePriorities = (items: Task[]) => items.map((t, i) => ({
    ...t, 
    priority: i === 0 ? TaskPriority.HIGH : i === 1 ? TaskPriority.MEDIUM : TaskPriority.LOW 
  }));

  const addTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTaskTitle.trim() || tasksCreatedToday.length >= 2) return;
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: newTaskTitle,
      completed: false,
      priority: TaskPriority.LOW,
      category: TaskCategory.WORK,
      createdAt: Date.now()
    };
    setTasks(prev => updatePriorities([newTask, ...prev]));
    setNewTaskTitle('');
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (activeTab === 'ACTIVE') return !t.completed;
      if (activeTab === 'DONE') return t.completed;
      return true;
    });
  }, [tasks, activeTab]);

  const handleToggle = (id: string) => {
    setTasks(prev => {
      const updated = prev.map(t => t.id === id ? {...t, completed: !t.completed} : t);
      const task = updated.find(t => t.id === id);
      
      // Update stats if both daily tasks are done
      if (task?.completed) {
        const todayCompletedCount = updated.filter(t => t.completed && new Date(t.createdAt).toDateString() === new Date().toDateString()).length;
        const todayISO = new Date().toISOString().split('T')[0];
        if (todayCompletedCount === 2 && stats.lastCompletionDate !== todayISO) {
          setStats(s => ({ 
            ...s, 
            completedDaysCount: s.completedDaysCount + 1, 
            lastCompletionDate: todayISO 
          }));
        }
      }
      return updated;
    });
  };

  return (
    <div className={`flex flex-col md:flex-row h-screen w-full ${theme.bg} ${theme.text} overflow-hidden`}>
      
      {/* SIDEBAR (Desktop) / TOP HEADER (Mobile) */}
      <aside className={`md:w-20 w-full flex md:flex-col flex-row items-center md:py-8 py-4 px-6 md:px-0 border-b md:border-b-0 md:border-r ${theme.panel} z-50`}>
        <div className={`md:w-12 md:h-12 w-10 h-10 rounded-xl md:rounded-2xl ${theme.primary} flex items-center justify-center text-white shadow-lg md:mb-12 mr-4 md:mr-0`}>
          <i className="fa-solid fa-z text-xl md:text-2xl font-black"></i>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex flex-col gap-6 flex-1">
          {[
            { id: 'ALL', icon: 'fa-layer-group' },
            { id: 'ACTIVE', icon: 'fa-circle-dot' },
            { id: 'DONE', icon: 'fa-circle-check' }
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                activeTab === item.id ? `${theme.primary} text-white shadow-md` : 'text-slate-400 hover:bg-slate-200/50'
              }`}
            >
              <i className={`fa-solid ${item.icon} text-lg`}></i>
            </button>
          ))}
        </nav>

        <h1 className="md:hidden flex-1 text-lg font-black tracking-tighter uppercase">ZenTask</h1>
        
        <div className="md:hidden flex items-center gap-2">
          <div className={`text-[10px] font-black px-3 py-1 rounded-full ${theme.primary} text-white`}>
            LV.{currentLevel}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 bg-white/30 dark:bg-slate-900/30 relative">
        <header className="hidden md:block p-8 pb-4">
          <h1 className="text-3xl font-black tracking-tighter uppercase mb-1">
            {activeTab === 'ALL' ? 'Tất cả việc' : activeTab === 'ACTIVE' ? 'Đang làm' : 'Đã xong'}
          </h1>
          <p className="text-[10px] font-bold opacity-30 tracking-[0.2em] uppercase">Phím tắt: N (Nhập mới)</p>
        </header>

        {/* Task List / Mobile Timer Toggle */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 pb-40 md:pb-8">
          {activeTab === 'TIMER' && (
            <div className="md:hidden flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <PomodoroCard 
                timeLeft={timeLeft} 
                isRunning={isTimerRunning} 
                toggle={() => setIsTimerRunning(!isTimerRunning)} 
                theme={theme} 
              />
              <StatsCard completedCount={completedTodayCount} stats={stats} level={currentLevel} theme={theme} />
            </div>
          )}

          {activeTab !== 'TIMER' && (
            <div className="max-w-3xl mx-auto space-y-4">
              {filteredTasks.length > 0 ? (
                <DndContext 
                  sensors={sensors} 
                  collisionDetection={closestCenter} 
                  onDragEnd={(e) => {
                    const { active, over } = e;
                    if (over && active.id !== over.id) {
                      setTasks(items => {
                        const oldIdx = items.findIndex(i => i.id === active.id);
                        const newIdx = items.findIndex(i => i.id === over.id);
                        return updatePriorities(arrayMove(items, oldIdx, newIdx));
                      });
                    }
                  }}
                >
                  <SortableContext items={filteredTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {filteredTasks.map((task, idx) => (
                      <TaskItem 
                        key={task.id} 
                        task={task} 
                        onToggle={handleToggle} 
                        onDelete={(id) => setTasks(prev => updatePriorities(prev.filter(t => t.id !== id)))} 
                        isDark={theme.isDark} 
                        isFirst={idx === 0 && activeTab !== 'DONE'}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="py-20 md:py-32 flex flex-col items-center opacity-20">
                  <i className="fa-solid fa-wind text-5xl md:text-6xl mb-6"></i>
                  <p className="text-xs md:text-sm font-black uppercase tracking-widest text-center">
                    Bạn đã hoàn thành<br className="md:hidden"/> mọi thứ hôm nay!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Floating Input (Sticks to bottom on Mobile, above Nav) */}
        {activeTab !== 'TIMER' && activeTab !== 'DONE' && (
          <div className="fixed md:absolute bottom-20 md:bottom-8 left-0 right-0 p-4 md:p-8 pointer-events-none">
            <form onSubmit={addTask} className="max-w-3xl mx-auto pointer-events-auto">
              <div className={`p-1 pl-4 md:pl-6 rounded-[2rem] md:rounded-[2.5rem] flex items-center border transition-all shadow-2xl ${theme.panel}`}>
                <i className="fa-solid fa-plus opacity-30 mr-3 md:mr-4"></i>
                <input 
                  ref={inputRef}
                  type="text" 
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder={tasksCreatedToday.length >= 2 ? "Ngày mai nhé!" : "Việc tiếp theo?..."}
                  disabled={tasksCreatedToday.length >= 2}
                  className="flex-1 bg-transparent py-4 md:py-5 outline-none font-bold text-sm md:text-lg placeholder:opacity-30 disabled:cursor-not-allowed"
                />
                <button type="submit" disabled={!newTaskTitle.trim()} className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-white transition-all shadow-lg ${theme.primary} active:scale-90 disabled:opacity-0`}>
                  <i className="fa-solid fa-arrow-up text-base md:text-lg"></i>
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* UTILITY PANEL (Desktop Only) */}
      <aside className={`hidden md:flex w-80 p-8 border-l flex-col gap-8 ${theme.panel}`}>
        <PomodoroCard 
          timeLeft={timeLeft} 
          isRunning={isTimerRunning} 
          toggle={() => setIsTimerRunning(!isTimerRunning)} 
          theme={theme} 
        />
        <StatsCard completedCount={completedTodayCount} stats={stats} level={currentLevel} theme={theme} />
      </aside>

      {/* BOTTOM NAV (Mobile Only) */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 h-16 flex items-center justify-around border-t z-50 ${theme.panel}`}>
        {[
          { id: 'ALL', icon: 'fa-layer-group', label: 'Tất cả' },
          { id: 'ACTIVE', icon: 'fa-circle-dot', label: 'Việc làm' },
          { id: 'TIMER', icon: 'fa-stopwatch', label: 'Tập trung' },
          { id: 'DONE', icon: 'fa-circle-check', label: 'Đã xong' }
        ].map(item => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === item.id ? theme.primaryText : 'text-slate-400'
            }`}
          >
            <i className={`fa-solid ${item.icon} text-lg`}></i>
            <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

// Sub-components for cleaner code
const PomodoroCard = ({ timeLeft, isRunning, toggle, theme }: any) => (
  <div className={`p-8 rounded-[2.5rem] border ${theme.isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'} text-center shadow-sm`}>
    <h3 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4">Pomodoro</h3>
    <div className="text-5xl md:text-6xl font-black font-mono mb-6 tracking-tighter">
      {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
    </div>
    <button 
      onClick={toggle}
      className={`w-full py-4 rounded-2xl text-white font-black uppercase text-xs tracking-widest shadow-lg transition-all active:scale-95 ${isRunning ? 'bg-rose-500' : theme.primary}`}
    >
      {isRunning ? 'Dừng lại' : 'Bắt đầu'}
    </button>
  </div>
);

const StatsCard = ({ completedCount, stats, level, theme }: any) => (
  <div className="flex-1 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center bg-white dark:bg-slate-900 shadow-sm">
    <div className="text-4xl md:text-5xl font-black mb-2">{completedCount}/2</div>
    <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest mb-8">Mục tiêu hôm nay</p>
    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden mb-8">
      <div className={`h-full ${theme.primary} transition-all duration-1000 ease-out`} style={{ width: `${(completedCount / 2) * 100}%` }}></div>
    </div>
    <div className="text-center">
      <div className={`text-xs font-black uppercase mb-1 ${theme.primaryText}`}>Cấp độ {level}</div>
      <div className="text-sm font-bold opacity-60 italic">"{stats.completedDaysCount} ngày bền bỉ"</div>
    </div>
  </div>
);

export default App;
