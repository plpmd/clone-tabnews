import useSWR from "swr";

async function fetchAPI(key) {
  const response = await fetch(key);
  const responseBody = await response.json();

  return responseBody
}


export default function StatusPage() {
  return (
    <>
      <h1>Status</h1>
      <UpdatedAt />
      <DBInfo />
    </>
  )
}

function UpdatedAt() {
  const { data, isLoading } = useSWR('/api/v1/status', fetchAPI, {
    refreshInterval: 2000,
    dedupingInterval: 2000
  })

  let updateAtText = "Carregando..."
  if(!isLoading) {
    updateAtText = new Date(data.updated_at).toLocaleString('pt-BR')
  }

  return (
    <>
      <div>Última atualização: {updateAtText} </div>
    </>
  )
}

function DBInfo() {
  const { data, isLoading } = useSWR('/api/v1/status', fetchAPI, {
    refreshInterval: 2000,
    dedupingInterval: 2000
  })

  let dbVersionText = "Carregando..."
  let dbMaxConnectionsText = "Carregando..."
  let dbOpenedConnectionText = "Carregando..."
  if(!isLoading) {
    dbVersionText = data.dependencies.database.version
    dbMaxConnectionsText = data.dependencies.database.max_connections
    dbOpenedConnectionText = data.dependencies.database.opened_connections
  }

  return (
    <>
      <div>Versão do banco de dados: {dbVersionText} </div>
      <div>Máximo de conexões do banco de dados: {dbMaxConnectionsText} </div>
      <div>Conexões abertas no banco de dados: {dbOpenedConnectionText} </div>
    </>
  )
}
