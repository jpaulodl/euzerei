
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from './services/supabase';
import { Game, User, MainPlatform, Platform } from './types';
import { GameCard } from './components/GameCard';
import { GameForm } from './components/GameForm';
import { Button } from './components/Button';
import { 
  Plus, 
  LogOut, 
  Loader2, 
  Gamepad2, 
  LayoutGrid, 
  Search, 
  Eye, 
  EyeOff, 
  User as UserIcon, 
  Mail, 
  Lock, 
  ChevronRight, 
  Filter, 
  ArrowUpDown,
  Download,
  AlertCircle,
  WifiOff
} from 'lucide-react';
// @ts-ignore
import { jsPDF } from 'jspdf';
// @ts-ignore
import 'jspdf-autotable';

type SortOption = 'date-desc' | 'date-asc' | 'rating-desc' | 'rating-asc' | 'time-desc' | 'time-asc';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [initError, setInitError] = useState<boolean>(false);
  
  const [filterPlatform, setFilterPlatform] = useState<Platform | 'Todos'>('Todos');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gamertag, setGamertag] = useState('');
  const [mainPlatform, setMainPlatform] = useState<MainPlatform>('PC');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchGames = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('user_id', userId)
        .order('completion_date', { ascending: false });
      
      if (error) throw error;
      setGames(data || []);
    } catch (err: any) {
      console.error("Erro ao carregar jogos:", err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      // Timeout de segurança: se em 5 segundos não houver resposta, tentamos mostrar a tela de login
      const timeoutId = setTimeout(() => {
        if (mounted && isLoading) {
          console.warn("Auth initialization timed out.");
          setIsLoading(false);
        }
      }, 5000);

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session?.user) {
          if (mounted) {
            setUser(session.user as any);
            await fetchGames(session.user.id);
          }
        } else {
          if (mounted) setIsLoading(false);
        }
      } catch (err) {
        console.error("Erro crítico na inicialização:", err);
        if (mounted) {
          setIsLoading(false);
          setInitError(true);
        }
      } finally {
        clearTimeout(timeoutId);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        if (session?.user) {
          setUser(session.user as any);
          fetchGames(session.user.id);
        } else {
          setUser(null);
          setGames([]);
          setIsLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchGames]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError(null);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
          setUser(data.user as any);
          await fetchGames(data.user.id);
        }
      } else {
        if (password !== confirmPassword) throw new Error("As senhas não coincidem!");

        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password, 
          options: { data: { gamertag, main_platform: mainPlatform } } 
        });

        if (error) throw error;

        if (data.user) {
          if (!data.session) {
            alert("Sucesso! Verifique seu e-mail para ativar sua conta.");
            setIsLogin(true);
          } else {
            setUser(data.user as any);
            await fetchGames(data.user.id);
          }
        }
      }
    } catch (err: any) {
      setAuthError(err.message || "Erro de conexão.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setGames([]);
  };

  const handleSaveGame = async (gameData: Partial<Game>) => {
    if (!user) return;
    try {
      const gameToSave = { ...gameData, user_id: user.id };
      const { error } = gameData.id 
        ? await supabase.from('games').update(gameToSave).eq('id', gameData.id)
        : await supabase.from('games').insert(gameToSave);
      
      if (error) throw error;
      fetchGames(user.id);
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    }
  };

  const handleDeleteGame = async (id: string) => {
    if (!confirm('Remover este registro?')) return;
    try {
      const { error } = await supabase.from('games').delete().eq('id', id);
      if (error) throw error;
      setGames(current => current.filter(g => g.id !== id));
    } catch (err: any) {
      alert("Erro ao remover: " + err.message);
    }
  };

  const processedGames = useMemo(() => {
    let result = [...games];
    if (searchQuery) result = result.filter(g => g.title.toLowerCase().includes(searchQuery.toLowerCase()));
    if (filterPlatform !== 'Todos') result = result.filter(g => g.platform === filterPlatform);
    result.sort((a, b) => sortBy === 'date-desc' ? new Date(b.completion_date).getTime() - new Date(a.completion_date).getTime() : b.rating - a.rating);
    return result;
  }, [games, searchQuery, filterPlatform, sortBy]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 gap-4">
        <Loader2 className="animate-spin text-purple-500" size={40} />
        <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest animate-pulse">Iniciando sistema...</p>
      </div>
    );
  }

  if (initError && !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6 text-center">
        <WifiOff size={48} className="text-slate-800 mb-4" />
        <h2 className="text-xl font-black uppercase italic italic text-white">Erro de Conexão</h2>
        <p className="text-slate-500 text-sm mt-2 max-w-xs">Não foi possível conectar ao servidor. Verifique sua internet ou as chaves do Supabase.</p>
        <Button onClick={() => window.location.reload()} className="mt-6 px-8">Tentar Novamente</Button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950/20">
        <div className="glass max-w-lg w-full p-8 rounded-[2rem] space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
              <Gamepad2 className="text-purple-500" size={32} />
            </div>
            <h1 className="text-3xl font-black uppercase italic tracking-tighter">EuZerei<span className="text-purple-500">!</span></h1>
          </div>

          {authError && (
            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-start gap-3 text-red-400 text-xs">
              <AlertCircle size={16} className="shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  required
                  value={gamertag}
                  onChange={(e) => setGamertag(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white"
                  placeholder="Gamertag"
                />
                <select
                  value={mainPlatform}
                  onChange={(e) => setMainPlatform(e.target.value as MainPlatform)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white"
                >
                  <option value="PC">PC</option>
                  <option value="PlayStation">PS5</option>
                  <option value="Xbox">Xbox</option>
                  <option value="Nintendo">Switch</option>
                </select>
              </div>
            )}
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white"
              placeholder="E-mail"
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white"
                placeholder="Senha (min. 6 chars)"
                minLength={6}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {!isLogin && (
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white"
                placeholder="Repetir Senha"
              />
            )}
            <Button type="submit" isLoading={isAuthLoading} className="w-full py-4 text-sm rounded-xl font-black uppercase italic">
              {isLogin ? 'Entrar' : 'Cadastrar'} <ChevronRight size={16} className="ml-1" />
            </Button>
          </form>

          <button onClick={() => setIsLogin(!isLogin)} className="w-full text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-purple-400">
            {isLogin ? 'Criar nova conta' : 'Já sou cadastrado'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-slate-950">
      <header className="sticky top-0 z-50 glass border-b border-white/5 px-4 md:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Gamepad2 className="text-purple-500" size={24} />
            <h1 className="text-lg font-black uppercase italic tracking-tighter">EuZerei<span className="text-purple-500">!</span></h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-white leading-none uppercase">{user?.user_metadata?.gamertag || 'Player'}</p>
                <p className="text-[8px] text-slate-600 font-bold uppercase">{user?.user_metadata?.main_platform || 'Gamer'}</p>
             </div>
             <button onClick={handleLogout} className="p-2 bg-slate-900/50 rounded-xl text-slate-500 hover:text-red-400 border border-white/5"><LogOut size={18}/></button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <h2 className="text-2xl font-black uppercase tracking-tighter italic">Minha Estante</h2>
          <Button onClick={() => { setEditingGame(null); setIsModalOpen(true); }} className="w-full sm:w-auto rounded-xl px-6 py-3 font-black uppercase text-xs">
            <Plus size={16} className="mr-1" /> Novo Jogo
          </Button>
        </div>
        {processedGames.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {processedGames.map(game => (
              <GameCard 
                key={game.id} 
                game={game} 
                onEdit={(g) => { setEditingGame(g); setIsModalOpen(true); }}
                onDelete={handleDeleteGame}
                onShare={(g) => { alert(`Copiado: Zerei ${g.title}!`); }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 glass rounded-[3rem] border-dashed border-white/5">
            <Gamepad2 size={40} className="mx-auto mb-4 text-slate-800" />
            <h3 className="text-lg font-black uppercase italic">Nada por aqui ainda</h3>
            <Button onClick={() => setIsModalOpen(true)} variant="ghost" className="mt-4 text-[10px] font-black uppercase">Adicionar Primeiro Jogo</Button>
          </div>
        )}
      </main>
      {isModalOpen && <GameForm game={editingGame} onClose={() => setIsModalOpen(false)} onSave={handleSaveGame} />}
    </div>
  );
};

export default App;
