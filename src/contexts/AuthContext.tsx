import { createContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// --- DEFINIÇÃO DAS INTERFACES ---
interface Empresa {
  id: number;
  nome_empresa: string;
  email: string;
}

interface Usuario {
  id: number;
  nome: string;
  email: string;
}

interface Funcionario {
  id: number;
  nome: string;
  email: string;
  permissoes: string[];
}

// Union Type: O utilizador logado pode ser uma Empresa, um Utilizador ou um Funcionário
type User = Empresa | Usuario | Funcionario;
type UserType = 'empresa' | 'usuario' | 'funcionario';

// --- INTERFACE DO CONTEXTO ATUALIZADA ---
interface AuthContextData {
  user: User | null;
  userType: UserType | null;
  token: string | null;
  loading: boolean;
  permissoes: string[]; // Adicionado para guardar as permissões
  loginEmpresa: (credentials: object) => Promise<void>;
  loginUsuario: (credentials: object) => Promise<void>;
  loginFuncionario: (credentials: object) => Promise<void>;
  logout: () => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthContext = createContext({} as AuthContextData);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [permissoes, setPermissoes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    function loadStoragedData() {
      const storagedUser = localStorage.getItem('@nanisound:user');
      const storagedToken = localStorage.getItem('@nanisound:token');
      const storagedUserType = localStorage.getItem('@nanisound:userType') as UserType | null;
      const storagedPermissoes = localStorage.getItem('@nanisound:permissoes');

      if (storagedUser && storagedToken && storagedUserType) {
        setUser(JSON.parse(storagedUser));
        setToken(storagedToken);
        setUserType(storagedUserType);
        if (storagedPermissoes) {
          setPermissoes(JSON.parse(storagedPermissoes));
        }
      }
      setLoading(false);
    }
    loadStoragedData();
  }, []);

  async function loginEmpresa(credentials: object) {
    type EmpresaLoginResponse = { empresa: Empresa; token: string };
    const response = await api.post<EmpresaLoginResponse>('/login/empresa', credentials);
    const { empresa, token: apiToken } = response.data;

    setUser(empresa);
    setToken(apiToken);
    setUserType('empresa');
    setPermissoes(['todas']);

    localStorage.setItem('@nanisound:user', JSON.stringify(empresa));
    localStorage.setItem('@nanisound:token', apiToken);
    localStorage.setItem('@nanisound:userType', 'empresa');
    localStorage.setItem('@nanisound:permissoes', JSON.stringify(['todas']));

    navigate('/dashboard');
  }

  async function loginUsuario(credentials: object) {
    type UsuarioLoginResponse = { usuario: Usuario; token: string };
    const response = await api.post<UsuarioLoginResponse>('/login/usuario', credentials);
    const { usuario, token: apiToken } = response.data;

    setUser(usuario);
    setToken(apiToken);
    setUserType('usuario');
    setPermissoes([]);

    localStorage.setItem('@nanisound:user', JSON.stringify(usuario));
    localStorage.setItem('@nanisound:token', apiToken);
    localStorage.setItem('@nanisound:userType', 'usuario');
    localStorage.removeItem('@nanisound:permissoes');

    navigate('/home-usuario');
  }

  // --- FUNÇÃO DE LOGIN PARA FUNCIONÁRIO COM DIAGNÓSTICO ---
  async function loginFuncionario(credentials: object) {
    console.log('[AuthContext] Passo 1: Iniciando login de funcionário...');
    try {
      type FuncionarioLoginResponse = { funcionario: Funcionario; token: string };
      const response = await api.post<FuncionarioLoginResponse>('/login/funcionario', credentials);
      console.log('[AuthContext] Passo 2: Resposta da API recebida com sucesso:', response.data);

      const { funcionario, token: apiToken } = response.data;

      if (!apiToken) {
        throw new Error('Token não foi recebido da API.');
      }

      const tokenParts = apiToken.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Token JWT inválido recebido da API.');
      }

      console.log('[AuthContext] Passo 3: Decodificando o payload do token...');
      const payload = JSON.parse(atob(tokenParts[1]));
      console.log('[AuthContext] Passo 4: Payload decodificado com sucesso:', payload);

      console.log('[AuthContext] Passo 5: Atualizando o estado do React...');
      setUser(funcionario);
      setToken(apiToken);
      setUserType('funcionario');
      setPermissoes(payload.permissoes || []);
      console.log('[AuthContext] Passo 6: Estado do React atualizado.');

      console.log('[AuthContext] Passo 7: Gravando dados no localStorage...');
      localStorage.setItem('@nanisound:user', JSON.stringify(funcionario));
      localStorage.setItem('@nanisound:token', apiToken);
      localStorage.setItem('@nanisound:userType', 'funcionario');
      localStorage.setItem('@nanisound:permissoes', JSON.stringify(payload.permissoes || []));
      console.log('[AuthContext] Passo 8: Dados gravados no localStorage.');

      console.log('[AuthContext] Passo 9: Navegando para o dashboard...');
      navigate('/dashboard');
      console.log('[AuthContext] Passo 10: Navegação concluída.');

    } catch (err) {
      console.error("Falha CRÍTICA no processo de login do funcionário no frontend:", err);
      throw err;
    }
  }

  function logout() {
    setUser(null);
    setToken(null);
    setUserType(null);
    setPermissoes([]);
    localStorage.removeItem('@nanisound:user');
    localStorage.removeItem('@nanisound:token');
    localStorage.removeItem('@nanisound:userType');
    localStorage.removeItem('@nanisound:permissoes');
    navigate('/login');
  }

  return (
    <AuthContext.Provider value={{ user, userType, token, loading, permissoes, loginEmpresa, loginUsuario, loginFuncionario, logout }}>
      {children}
    </AuthContext.Provider>
  );
}