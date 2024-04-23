export interface FilteredUser {
  id: string;
  name: string;
  email: string;
  role: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  administrador :boolean;
  token?: string | undefined
}

export interface FaUsuario {
  id: string;
  nome: string;
  email: string;
  administrador: boolean;
  data_nascimento:string
  created_at: string;
  token?: string | undefined
}

export interface UserResponse {
  status: string;
  data: {
    user: FilteredUser;
  };
  
}

export interface UserFaResponse {
  status: string;
  data: {
    userFa: FaUsuario;
  };
}

export interface UserLoginResponse {
  status: string;
  token: string;
}

export interface FaTransacoes {
  id: string;
  titulo: string;
  valor: number;
  tipo:string;
  vencimento: string;
  faUsuario_id: string   
}