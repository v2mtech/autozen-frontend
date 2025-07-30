import { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

// --- DEFINIÇÃO DAS INTERFACES ---
interface AppUser {
  uid: string;
  email: string | null;
  nome: string;
  permissoes?: string[];
}

type UserType = 'empresa' | 'usuario' | 'funcionario' | null;

interface AuthContextData {
  user: AppUser | null;
  userType: UserType;
  loading: boolean;
  permissoes: string[]; // ✅ PROPRIEDADE ADICIONADA AQUI
  loginEmpresaOuFuncionario: (email: string, pass: string) => Promise<void>;
  loginUsuario: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthContext = createContext({} as AuthContextData);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [userType, setUserType] = useState<UserType>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'usuarios', firebaseUser.uid);
        const empresaDocRef = doc(db, 'empresas', firebaseUser.uid);
        const funcionarioDocRef = doc(db, 'funcionarios', firebaseUser.uid);

        const userDoc = await getDoc(userDocRef);
        const empresaDoc = await getDoc(empresaDocRef);
        const funcionarioDoc = await getDoc(funcionarioDocRef);

        if (empresaDoc.exists()) {
          setUser({ ...empresaDoc.data(), uid: firebaseUser.uid, email: firebaseUser.email } as AppUser);
          setUserType('empresa');
        } else if (funcionarioDoc.exists()) {
          setUser({ ...funcionarioDoc.data(), uid: firebaseUser.uid, email: firebaseUser.email } as AppUser);
          setUserType('funcionario');
        } else if (userDoc.exists()) {
          setUser({ ...userDoc.data(), uid: firebaseUser.uid, email: firebaseUser.email } as AppUser);
          setUserType('usuario');
        } else {
          await signOut(auth);
          setUser(null);
          setUserType(null);
        }
      } else {
        setUser(null);
        setUserType(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  async function loginEmpresaOuFuncionario(email: string, pass: string) {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const firebaseUser = userCredential.user;

    const empresaDoc = await getDoc(doc(db, "empresas", firebaseUser.uid));
    const funcionarioDoc = await getDoc(doc(db, "funcionarios", firebaseUser.uid));

    if (empresaDoc.exists() || funcionarioDoc.exists()) {
      navigate('/dashboard');
    } else {
      await signOut(auth);
      throw new Error("Credenciais inválidas ou este utilizador não é uma empresa/funcionário.");
    }
  }

  async function loginUsuario(email: string, pass: string) {
    await signInWithEmailAndPassword(auth, email, pass);
    navigate('/home-usuario');
  }

  async function logout() {
    await signOut(auth);
    navigate('/login');
  }

  return (
    <AuthContext.Provider value={{ user, userType, loading, loginEmpresaOuFuncionario, loginUsuario, logout, permissoes: user?.permissoes || [] }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  return context;
}