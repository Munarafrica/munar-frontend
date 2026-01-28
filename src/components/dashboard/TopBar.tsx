import React from "react";
import { Logo } from "../ui/Logo";
import { HelpIcon, MenuIcon, NotificationIcon, SettingsIcon } from "../icons";
import { Page } from "../../App";
import { ModeToggle } from "../ui/mode-toggle";

interface TopBarProps {
  onNavigate?: (page: Page) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onNavigate }) => {
  return (
    <div className="w-full bg-white dark:bg-slate-950 h-[72px] flex items-center justify-between px-6 sticky top-0 z-50 border-b border-slate-100/80 dark:border-slate-800/80 backdrop-blur-sm bg-white/80 dark:bg-slate-950/80 transition-colors duration-300">
      {/* Left: Logo */}
      <div className="flex items-center gap-12">
        <div onClick={() => onNavigate?.('my-events')} className="cursor-pointer">
           <div className="dark:hidden">
             <Logo variant="dark" />
           </div>
           <div className="hidden dark:block">
             <Logo variant="light" />
           </div>
        </div>
        
        {/* Navigation */}
        <div className="hidden md:flex items-center gap-1">
          <div 
            onClick={() => onNavigate?.('my-events')}
            className="flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-colors"
          >
            <MenuIcon className="size-4" />
            <span className="font-semibold text-sm">Events</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <MenuIcon className="size-4" />
            <span className="font-medium text-sm">Finance</span>
          </div>
        </div>
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-1 mr-2">
            <button className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-50 dark:hover:bg-slate-800">
              <NotificationIcon className="size-6" />
            </button>
            <button className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-50 dark:hover:bg-slate-800">
              <HelpIcon className="size-5" />
            </button>
            <button className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-50 dark:hover:bg-slate-800">
              <SettingsIcon className="size-5" />
            </button>
            
            <div className="ml-1">
              <ModeToggle />
            </div>
        </div>
        
        <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 hidden md:block mx-2" />

        {/* Profile Avatar */}
        <div className="flex items-center gap-3 pl-2 cursor-pointer group">
            <div className="size-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm tracking-wide shadow-md shadow-indigo-200 dark:shadow-none group-hover:shadow-lg transition-all">
            VE
            </div>
            <div className="hidden lg:block text-left">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-none">Victor E.</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">Organizer</p>
            </div>
        </div>
      </div>
    </div>
  );
};
