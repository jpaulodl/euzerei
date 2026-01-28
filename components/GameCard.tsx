
import React from 'react';
import { Game, Platform } from '../types';
import { Star, Monitor, Smartphone, Gamepad2, Tv, Trophy, Calendar, Pencil, Trash2, Clock, Share2 } from 'lucide-react';

interface GameCardProps {
  game: Game;
  onEdit: (game: Game) => void;
  onDelete: (id: string) => void;
  onShare: (game: Game) => void;
}

const getPlatformStyles = (platform: Platform) => {
  switch (platform) {
    case 'PC':
      return {
        border: 'border-slate-500/20 group-hover:border-slate-400/40',
        badge: 'bg-slate-700/80 text-slate-100',
        glow: 'group-hover:shadow-[0_0_15px_rgba(148,163,184,0.08)]',
        icon: <Monitor size={10} />
      };
    case 'PS5':
      return {
        border: 'border-blue-600/20 group-hover:border-blue-500/40',
        badge: 'bg-blue-600/80 text-white',
        glow: 'group-hover:shadow-[0_0_15px_rgba(37,99,235,0.12)]',
        icon: <Gamepad2 size={10} />
      };
    case 'Xbox':
      return {
        border: 'border-green-600/20 group-hover:border-green-500/40',
        badge: 'bg-green-600/80 text-white',
        glow: 'group-hover:shadow-[0_0_15px_rgba(22,163,74,0.12)]',
        icon: <Gamepad2 size={10} />
      };
    case 'Switch':
      return {
        border: 'border-red-600/20 group-hover:border-red-500/40',
        badge: 'bg-red-600/80 text-white',
        glow: 'group-hover:shadow-[0_0_15px_rgba(220,38,38,0.12)]',
        icon: <Smartphone size={10} />
      };
    default:
      return {
        border: 'border-purple-600/20 group-hover:border-purple-500/40',
        badge: 'bg-purple-600/80 text-white',
        glow: 'group-hover:shadow-[0_0_15px_rgba(147,51,234,0.12)]',
        icon: <Tv size={10} />
      };
  }
};

export const GameCard: React.FC<GameCardProps> = ({ game, onEdit, onDelete, onShare }) => {
  const styles = getPlatformStyles(game.platform);

  return (
    <div className={`glass rounded-2xl group relative transition-all duration-300 hover:translate-y-[-2px] overflow-hidden flex flex-col h-full shadow-md border ${styles.border} ${styles.glow} max-w-sm mx-auto w-full bg-slate-900/40`}>
      
      {game.is_platinum && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-gradient-to-br from-yellow-400 to-amber-600 p-0.5 rounded shadow border border-white/20">
          <Trophy size={8} className="text-slate-900" />
        </div>
      )}

      <div className="p-3 flex flex-col flex-1 text-center">
        
        <div className="flex justify-between items-center mb-3">
          <div className={`flex items-center gap-1 backdrop-blur-md px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-wider border border-white/10 ${styles.badge}`}>
            {styles.icon}
            {game.platform}
          </div>

          <div className="flex items-center gap-1 bg-slate-800/90 backdrop-blur-md text-amber-400 px-1.5 py-0.5 rounded-md text-[9px] font-black border border-white/5 shadow-inner">
            <Star size={9} fill="currentColor" />
            <span>{game.rating}</span>
          </div>
        </div>

        <h3 className="text-base font-black text-slate-100 uppercase italic tracking-tighter leading-tight mb-2 line-clamp-2 min-h-[2rem] flex items-center justify-center">
            {game.title}
        </h3>
        
        <div className="flex flex-col items-center gap-1 mb-3">
          <div className="flex items-center gap-1.5 text-slate-200 bg-white/5 px-2 py-1 rounded-lg border border-white/5">
            <Clock size={12} className="text-purple-500" />
            <span className="text-[10px] font-black uppercase tracking-tight">
                {game.hours_played}H <span className="text-slate-500 text-[8px] font-bold tracking-widest ml-0.5">JOGADAS</span>
            </span>
          </div>
          <div className="flex items-center gap-1 text-slate-500 font-bold text-[8px] uppercase tracking-widest mt-0.5">
            <Calendar size={10} />
            <span>{new Date(game.completion_date).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>

        <div className="mt-auto pt-2 border-t border-white/5 flex items-center justify-center gap-2">
            <button 
              onClick={(e) => { e.preventDefault(); onShare(game); }}
              className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-500 hover:text-white rounded-lg transition-all focus:outline-none"
              title="Compartilhar"
            >
              <Share2 size={14} />
            </button>
            <button 
              onClick={(e) => { e.preventDefault(); onEdit(game); }}
              className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-500 hover:text-white rounded-lg transition-all focus:outline-none"
              title="Editar"
            >
              <Pencil size={14} />
            </button>
            <button 
              onClick={(e) => { e.preventDefault(); onDelete(game.id); }}
              className="p-1.5 bg-red-500/5 hover:bg-red-500/20 text-slate-600 hover:text-red-400 rounded-lg transition-all focus:outline-none"
              title="Remover"
            >
              <Trash2 size={14} />
            </button>
        </div>
      </div>
    </div>
  );
};
