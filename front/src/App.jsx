import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import CrudPage from './components/CrudPage';
import { entidadesConfig } from './config/entidades';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Equipamentos from './pages/Equipamentos';
import Manutencoes from './pages/Manutencoes';
import Usuarios from './pages/Usuarios';
import Perfil from './pages/Perfil';
import NotFound from './pages/NotFound';
import { ToastProvider } from './context/ToastContext.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function paginaEntidade(chave) {
  const config = entidadesConfig[chave];
  return (
    <ProtectedRoute>
      <CrudPage config={config} />
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path='/login' element={<Login />} />

              <Route
                path='/'
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path='/equipamentos'
                element={
                  <ProtectedRoute>
                    <Equipamentos />
                  </ProtectedRoute>
                }
              />

              <Route
                path='/manutencoes'
                element={
                  <ProtectedRoute>
                    <Manutencoes />
                  </ProtectedRoute>
                }
              />

              <Route path='/predios' element={paginaEntidade('predios')} />
              <Route path='/locais' element={paginaEntidade('locais')} />
              <Route path='/grupos' element={paginaEntidade('grupos')} />
              <Route
                path='/categorias'
                element={paginaEntidade('categorias')}
              />
              <Route path='/marcas' element={paginaEntidade('marcas')} />
              <Route
                path='/fornecedores'
                element={paginaEntidade('fornecedores')}
              />

              <Route
                path='/usuarios'
                element={
                  <ProtectedRoute rolesPermitidos={['admin', 'root']}>
                    <Usuarios />
                  </ProtectedRoute>
                }
              />

              <Route
                path='/perfil'
                element={
                  <ProtectedRoute>
                    <Perfil />
                  </ProtectedRoute>
                }
              />

              <Route path='*' element={<NotFound />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
