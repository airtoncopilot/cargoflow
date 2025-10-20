import { useNavigate } from 'react-router-dom';
import { Package, FileText, Truck, LogOut, Warehouse } from 'lucide-react';

export default function Menu() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-transparent opacity-50"></div>
      
      {/* Header */}
      <div className="relative bg-white/10 backdrop-blur-xl border-b border-white/20">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">CargoFlow</h1>
              <p className="text-sm text-blue-200">Menu Principal</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="p-2 text-red-300 hover:text-red-200 hover:bg-red-500/20 rounded-xl transition-all"
          >
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative p-6 space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Selecione uma Operação</h2>
          <p className="text-blue-200">Escolha a funcionalidade desejada</p>
        </div>

        <div className="grid gap-6 max-w-md mx-auto">
          {/* Armazenar Nota na Doca */}
          <button
            onClick={() => navigate('/doca')}
            className="group bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 hover:bg-white/20 hover:scale-105 transition-all duration-300 shadow-xl"
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <Warehouse className="w-10 h-10 text-white" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-2">Armazenar Nota na Doca</h3>
                <p className="text-blue-200 text-sm">Registrar notas fiscais nas docas de carregamento</p>
              </div>
            </div>
          </button>

          {/* Romaneio de Expedição */}
          <button
            onClick={() => navigate('/romaneio')}
            className="group bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 hover:bg-white/20 hover:scale-105 transition-all duration-300 shadow-xl"
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <FileText className="w-10 h-10 text-white" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-2">Romaneio de Expedição</h3>
                <p className="text-blue-200 text-sm">Gerenciar romaneios e expedição de mercadorias</p>
              </div>
            </div>
          </button>
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center space-x-2 text-blue-200 text-sm">
            <Package className="w-4 h-4" />
            <span>Sistema integrado de logística</span>
          </div>
        </div>
      </div>
    </div>
  );
}
