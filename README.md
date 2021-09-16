cria aplicação serverless aws
`sls create --template aws-nodejs --path cadastro-pacientes`

configura ``serverless.yaml``

```service: cadastro-pacientes

provider:
 name: aws
 runtime: nodejs12.x

functions:
 listarPaciente:
   handler: handler.listarPacientes```

   handler.js

   ```
   'use strict'

const pacientes = [
   { id: 1, nome: 'Maria', dataNascimento: '1984-11-01' },
   { id: 2, nome: 'Joao', dataNascimento: '1980-01-16' },
   { id: 3, nome: 'Jose', dataNascimento: '1998-06-06' }
]
module.exports.listar = async event => {
 return {
   statusCode: 200,
   body: JSON.stringify(
     {
       pacientes
     },
     null,
     2
   )
 }
}
   ```
