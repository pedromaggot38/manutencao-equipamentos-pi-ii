import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="login-screen">
      <div className="login-card" style={{ textAlign: 'center' }}>
        <div className="login-eyebrow">Erro 404</div>
        <h1 className="login-title">Página não encontrada</h1>
        <Link className="btn btn-primary" to="/">
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
