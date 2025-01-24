function status(request, response){
  response.status(200).json({ response: 'Olá!'} )
}

export default status
