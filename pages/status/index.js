import useSWR from "swr";

async function fetchAPI(key) {
  const response = await fetch(key);
  const responseBody = await response.json();

  return responseBody;
}

export default function StatusPage() {
  return (
    <>
      <h1>Status</h1>
      <UpdatedAt />
      <DBInfo />
    </>
  );
}

function UpdatedAt() {
  const { data, isLoading } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
    dedupingInterval: 2000,
  });

  let updateAtText = "Carregando...";
  if (!isLoading) {
    updateAtText = new Date(data.updated_at).toLocaleString("pt-BR");
  }

  return (
    <>
      <div>Última atualização: {updateAtText} </div>
    </>
  );
}

function DBInfo() {
  const { data, isLoading } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
    dedupingInterval: 2000,
  });

  let dbStatusInformation = "Carregando...";

  if (!isLoading && data) {
    dbStatusInformation = (
      <>
        <div>Versão do banco de dados: {data.dependencies.database.version} </div>
        <div>Máximo de conexões do banco de dados: {data.dependencies.database.max_connections} </div>
        <div>Conexões abertas no banco de dados: {data.dependencies.database.opened_connections} </div>
      </>
    )
  }

  return (
    <>
      <h2>Database</h2>
      {dbStatusInformation}
    </>
  );
}
