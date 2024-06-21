'use client';

import { useState } from 'react';

const DbTestComponent = () => {
  const [status, setStatus] = useState<string | null>(null);
  const [userCount, setUserCount] = useState<number | null>(null);

  const testDatabaseConnection = async () => {
    setStatus(null); // Reset status
    setUserCount(null); // Reset user count
    try {
      const response = await fetch('/api/test-db');
      if (response.ok) {
        const data = await response.json();
        setStatus(data.message);
        setUserCount(data.userCount);
      } else {
        const errorData = await response.json();
        setStatus(errorData.message);
      }
    } catch (error) {
      setStatus('Erro ao conectar com o banco de dados.');
    }
  };

  return (
    <div>
      <button onClick={testDatabaseConnection}>Testar Conexão com o Banco de Dados</button>
      {status && <p>{status}</p>}
      {userCount !== null && <p>Contagem de usuários: {userCount}</p>}
    </div>
  );
};

export default DbTestComponent;
