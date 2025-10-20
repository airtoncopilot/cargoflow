import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Truck, Package, Plus, Search, Calendar } from 'lucide-react';

export default function Romaneio() {
  const navigate = useNavigate();
  const [romaneios] = useState([
    {
      id: 'ROM-001',
      veiculo: 'ABC-1234',
      destino: 'São Paulo - SP',
      itens: 15,
      status: 'Em Andamento',
      data: '08/10/2025'
    },
    {
      id: 'ROM-002',
      veiculo: 'DEF-5678',
      destino: 'Rio de Janeiro - RJ',
      itens: 8,
      status: 'Concluído',
      data: '07/10/2025'
    },
    {
      id: 'ROM-003',
      veiculo: 'GHI-9012',
      destino: 'Belo Horizonte - MG',
      itens: 12,
      status: 'Pendente',
      data: '08/10/2025'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Em Andamento':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
      case 'Concluído':
        return 'bg-green-500/20 text-green-300 border-green-500/50';
      case 'Pendente':
        return 'bg-red-500/20 text-red-300 border-red-500/50';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-transparent opacity-50"></div>
      
      {/* Header */}
      <div className="relative bg-white/10 backdrop-blur-xl border-b border-white/20">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/menu')}
              className="p-2 text-blue-200 hover:text-white hover:bg-white/20 rounded-xl transition-all"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Romaneio de Expedição</h1>
                <p className="text-sm text-blue-200">Gerenciar expedições</p>
              </div>
            </div>
          </div>
          <button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-all transform hover:scale-105">
            <Plus className="w-4 h-4" />
            <span>Novo</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative p-6 pb-4">
        <div className="max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-300 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar romaneio..."
              className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent backdrop-blur-sm transition-all"
            />
          </div>
        </div>
      </div>

      {/* Romaneios List */}
      <div className="relative px-6 pb-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {romaneios.map((romaneio) => (
            <div
              key={romaneio.id}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{romaneio.id}</h3>
                    <p className="text-blue-200 text-sm">Romaneio de Expedição</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(romaneio.status)}`}>
                  {romaneio.status}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Truck className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-200 text-sm">Veículo:</span>
                  <span className="text-white font-semibold">{romaneio.veiculo}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4 text-green-400" />
                  <span className="text-blue-200 text-sm">Itens:</span>
                  <span className="text-white font-semibold">{romaneio.itens}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-blue-200 text-sm">
                  Destino: <span className="text-white font-medium">{romaneio.destino}</span>
                </div>
                <div className="flex items-center space-x-2 text-blue-200 text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>{romaneio.data}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {romaneios.length === 0 && (
          <div className="max-w-md mx-auto text-center py-12">
            <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-blue-300" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Nenhum romaneio encontrado</h3>
            <p className="text-blue-200 mb-6">Crie seu primeiro romaneio de expedição</p>
            <button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl flex items-center space-x-2 mx-auto transition-all transform hover:scale-105">
              <Plus className="w-5 h-5" />
              <span>Criar Romaneio</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
