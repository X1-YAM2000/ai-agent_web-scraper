import React, { useState } from 'react';
import { Send, CheckCircle, AlertCircle, Loader2, Sparkles, Mail, Link as LinkIcon, X, Globe, Laptop } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [email, setEmail] = useState('');
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [responseData, setResponseData] = useState<{ session_id?: string; message?: string } | null>(null);
  
  const [useLocalBackend, setUseLocalBackend] = useState(false);

  const LOCAL_API_URL = "http://localhost:8000/process-article";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    setResponseData(null);

    const payload: Record<string, string> = { 
      email, 
      article_url: url
    };

    if (!useLocalBackend) {
      payload.session_id = `sid-${Math.random().toString(36).substr(2, 9)}`;
      payload.timestamp = new Date().toISOString();
    }

    try {
      let response: Response;

      if (useLocalBackend) {
        response = await fetch(LOCAL_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        const { data, error } = await supabase.functions.invoke('proxy-n8n', {
          body: payload,
        });
        if (error) throw error;
        
        setStatus('success');
        setResponseData({ session_id: payload.session_id });
        setMessage('Request sent to n8n workflow.');
        setEmail('');
        setUrl('');
        return;
      }

      if (response.ok) {
        let data: Record<string, string> = {};
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
          data = { message: await response.text() };
        }

        setStatus('success');
        
        if (useLocalBackend) {
          setResponseData(data);
          setMessage(data.message || 'Processed successfully via Backend.');
        } else {
          setResponseData({ session_id: payload.session_id });
          setMessage('Request sent to n8n workflow.');
        }

        setEmail('');
        setUrl('');
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Server responded with an error');
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Submission Error:", error);
      setStatus('error');
      
      if (error.message.includes('Failed to fetch')) {
        if (useLocalBackend) {
          setMessage("Browser cannot connect to Localhost from Cloud Preview. To use Localhost, you must download and run this React app on your computer.");
        } else {
          setMessage("Network Error. Please try again.");
        }
      } else {
        setMessage(`Error: ${error.message}`);
      }
    }
  };

  const closePopup = () => {
    setStatus('idle');
    setMessage('');
    setResponseData(null);
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 font-sans selection:bg-indigo-500/30">
      <div className="fixed -top-24 -left-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="fixed -bottom-24 -right-24 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>

      {status === 'success' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl transform scale-100 animate-in zoom-in-95 duration-200">
            <button 
              onClick={closePopup}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center ring-4 ring-emerald-500/10">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Success!</h3>
                <p className="text-emerald-400 font-medium text-md px-2 leading-snug">
                  {message}
                </p>
                {responseData?.session_id && (
                  <div className="mt-3 p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Session Reference</p>
                    <p className="text-sm text-cyan-300 font-mono tracking-wide">{responseData.session_id}</p>
                  </div>
                )}
              </div>

              <button 
                onClick={closePopup}
                className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl transition-all active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative w-full max-w-md">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-3xl blur opacity-30 transition duration-1000"></div>
        
        <div className="relative bg-slate-900/90 backdrop-blur-3xl border border-white/10 p-8 rounded-3xl shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl shadow-inner">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-white tracking-tight italic">
                  Auto<span className="text-cyan-400 font-normal not-italic">Mation</span>
                </h1>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`w-2 h-2 rounded-full animate-pulse ${useLocalBackend ? 'bg-orange-500' : 'bg-emerald-500'}`}></span>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                    {useLocalBackend ? 'Local Dev' : 'Live System'}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setUseLocalBackend(!useLocalBackend);
                setStatus('idle');
                setMessage('');
              }}
              className="group flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg transition-all text-xs font-medium text-slate-400 hover:text-white"
              title="Switch Server Mode"
            >
              {useLocalBackend ? <Laptop className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
              <span>{useLocalBackend ? 'Localhost' : 'Live (n8n)'}</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="group space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase ml-1 transition-colors group-focus-within:text-cyan-400">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                <input
                  type="email"
                  required
                  placeholder="name@automation.com"
                  className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all placeholder:text-slate-700"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="group space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase ml-1 transition-colors group-focus-within:text-purple-400">
                Article Web Link
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                <input
                  type="url"
                  required
                  placeholder="https://medium.com/..."
                  className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-slate-700"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
            </div>

            
            {useLocalBackend && (
              <div className="px-3 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                 <p className="text-[10px] text-orange-200 text-center">
                   ⚠️ Requires backend running at <strong>localhost:8000</strong>. This will fail in Cloud Preview.
                 </p>
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full group relative overflow-hidden rounded-2xl p-[2px]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500"></div>
              <div className="relative bg-slate-900 rounded-[14px] py-4 flex items-center justify-center gap-3 hover:bg-slate-900/80 transition-all active:scale-[0.98]">
                {status === 'loading' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                    <span className="text-white font-bold tracking-wide">Processing...</span>
                  </>
                ) : (
                  <>
                    <span className="text-white font-bold tracking-wide">
                      {useLocalBackend ? 'Send to Localhost' : 'Send to n8n'}
                    </span>
                    <Send className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </button>
          </form>

          {status === 'error' && (
            <div className="mt-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
              <div className="p-2 bg-rose-500/20 rounded-lg shrink-0">
                <AlertCircle className="w-5 h-5 text-rose-500" />
              </div>
              <p className="text-xs text-rose-200 font-medium leading-tight pt-1.5">{message}</p>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col items-center gap-2">
          <p className="text-slate-600 text-[10px] uppercase font-bold tracking-[0.2em]">
            Automation Learners API
          </p>
          <div className="h-[1px] w-12 bg-slate-800"></div>
        </div>
      </div>
    </div>
  );
};

export default Index;
