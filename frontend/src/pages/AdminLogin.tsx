import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import { adminAPI } from '../services/api';

interface LoginForm {
  username: string;
  password: string;
}

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError('');

    try {
      const response = await adminAPI.login(data.username, data.password);
      login(response.data.token);
      navigate('/admin');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-summer flex items-center justify-center py-12 px-4">
      <div className="card-glass max-w-md w-full animate-fadeIn">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-coral to-peach rounded-full flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faUser} className="text-4xl text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-warmGray">
            Admin Login
          </h1>
          <p className="text-warmGray-light mt-2">
            Acesse o painel administrativo
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-warmGray font-medium mb-2">
              <FontAwesomeIcon icon={faUser} className="mr-2 text-warmGray-light" />
              Usuário
            </label>
            <input
              type="text"
              {...register('username', { required: 'Campo obrigatório' })}
              className="input"
              placeholder="admin"
            />
            {errors.username && (
              <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label className="block text-warmGray font-medium mb-2">
              <FontAwesomeIcon icon={faLock} className="mr-2 text-warmGray-light" />
              Senha
            </label>
            <input
              type="password"
              {...register('password', { required: 'Campo obrigatório' })}
              className="input"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-warmGray-light hover:text-warmGray transition-colors"
          >
            ← Voltar para home
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
