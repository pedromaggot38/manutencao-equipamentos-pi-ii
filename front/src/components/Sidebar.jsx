import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE =
  import.meta.env.VITE_API_URL?.replace('/api/v1', '') ||
  'http://localhost:3000';

function formatarUrlAvatar(avatar) {
  if (!avatar) return null;
  if (
    avatar.startsWith('http://') ||
    avatar.startsWith('https://') ||
    avatar.startsWith('blob:')
  ) {
    return avatar;
  }
  return `${API_BASE}${avatar.startsWith('/') ? '' : '/'}${avatar}`;
}

const NAV_PRINCIPAL = [
  { to: '/', label: 'Visão geral', end: true },
  { to: '/equipamentos', label: 'Equipamentos' },
  { to: '/manutencoes', label: 'Manutenções' },
];

const NAV_CADASTROS = [
  { to: '/predios', label: 'Prédios' },
  { to: '/locais', label: 'Locais' },
  { to: '/grupos', label: 'Grupos' },
  { to: '/categorias', label: 'Categorias' },
  { to: '/marcas', label: 'Marcas' },
  { to: '/fornecedores', label: 'Fornecedores' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [erroAvatar, setErroAvatar] = useState(false);
  const isGestor = user?.role === 'admin' || user?.role === 'root';

  const avatarUrl = formatarUrlAvatar(user?.avatar);
  const iniciaisNome = (user?.name || user?.username || 'U')
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  return (
    <aside className='sidebar'>
      <div className='sidebar-brand'>
        <div className='sidebar-brand-title'>Gestão de Patrimônio</div>
        <div className='sidebar-brand-sub'>PI II · UNIVESP</div>
      </div>

      <div className='sidebar-nav' style={{ flex: 1, overflowY: 'auto' }}>
        <div className='sidebar-section-label'>Principal</div>
        {NAV_PRINCIPAL.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `sidebar-link${isActive ? ' active' : ''}`
            }
          >
            {item.label}
          </NavLink>
        ))}

        <div className='sidebar-section-label'>Cadastros auxiliares</div>
        {NAV_CADASTROS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-link${isActive ? ' active' : ''}`
            }
          >
            {item.label}
          </NavLink>
        ))}

        {isGestor && (
          <>
            <div className='sidebar-section-label'>Administração</div>
            <NavLink
              to='/usuarios'
              className={({ isActive }) =>
                `sidebar-link${isActive ? ' active' : ''}`
              }
            >
              Usuários
            </NavLink>
          </>
        )}
      </div>

      {/* Rodapé no estilo do mockup */}
      <div
        className='sidebar-footer'
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          padding: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          {/* Informações textuais */}
          <div style={{ lineHeight: 1.25, overflow: 'hidden' }}>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 600,
                color: '#f3f4f6',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
              }}
            >
              {user?.name || user?.username || 'Usuário'}
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: '#9ca3af',
                textTransform: 'capitalize',
                marginTop: 2,
              }}
            >
              {user?.role || 'Membro'}
            </div>
          </div>

          {/* Botão de Engrenagem (Configurações / Perfil) */}
          <Link
            to='/perfil'
            title='Configurações do Perfil'
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              transition: 'color 0.15s, background-color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#f3f4f6';
              e.currentTarget.style.backgroundColor =
                'rgba(255, 255, 255, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#9ca3af';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {/* Ícone SVG de Engrenagem */}
            <svg
              width='18'
              height='18'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <path d='M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z' />
              <circle cx='12' cy='12' r='3' />
            </svg>
          </Link>
        </div>

        {/* Botão Sair */}
        <button
          className='btn-signout'
          onClick={logout}
          style={{ width: '100%', marginTop: 4 }}
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
