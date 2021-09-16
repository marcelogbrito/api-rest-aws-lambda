"use strict";

const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

const dynamoDbOfflineOptions = {
  region: "localhost",
  endpoint: "http://localhost:8000",
};

const isOffline = () => process.env.IS_OFFLINE;

const dynamoDb = isOffline()
  ? new AWS.DynamoDB.DocumentClient(dynamoDbOfflineOptions)
  : new AWS.DynamoDB.DocumentClient();

const params = {
  TableName: process.env.PACIENTES_TABLE,
};
module.exports.listarPacientes = async (event) => {
  // como seria no mysql
  //select * from table limit 10 offset 11 //offset é o numero da pagina
  // dynamodb
  // Limit = LIMIT. ExclusiveStartKey = OFFSET e LastEvaluatedKey = "Numero da pagina"

  try {
    const queryString = {
      limit: 5,
      ...event.queryStringParameters,
    };

    const { limit, next } = queryString;

    let localParams = {
      ...params,
      limit: limit,
    };

    if (next) {
      localParams.ExclusiveStartKey = {
        paciente_id: next,
      };
    }

    let data = await dynamoDb.scan(localParams).promise();

    let nextToken = data.LastEvaluatedKey
      ? data.LastEvaluatedKey.paciente_id
      : null;

    const result = {
      items: data.Items,
      next_token: nextToken,
    };

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.log("Error", error);
    return {
      statusCode: error.statusCode ? error.statusCode : 500,
      body: JSON.stringify({
        error: error.name ? error.name : "Exception",
        message: error.message ? error.message : "Erro desconecido",
      }),
    };
  }

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};

module.exports.obterPaciente = async (event) => {
  try {
    const { pacienteId } = event.pathParameters;
    const data = await dynamoDb
      .get({ ...params, Key: { paciente_id: pacienteId } })
      .promise();
    //console.log(data)
    if (!data.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Paciente não existe" }, null, 2),
      };
    }

    const paciente = data.Item;

    return {
      statusCode: 200,
      body: JSON.stringify(paciente),
    };
  } catch (error) {
    console.log("Error " + error);
    return {
      statusCode: error.statusCode ? error.statusCode : 500,
      body: JSON.stringify({
        error: error.name ? error.name : "Exception",
        message: error.message ? error.message : "Erro desconhecido",
      }),
    };
  }
};

module.exports.cadastrarPaciente = async (event) => {
  try {
    const timestamp = new Date().getTime();
    let dados = JSON.parse(event.body);
    const { nome, data_nascimento, email, telefone } = dados;
    const paciente = {
      paciente_id: uuidv4(),
      nome,
      data_nascimento,
      email,
      telefone,
      status: true,
      criado_em: timestamp,
      atualizado_em: timestamp,
    };

    await dynamoDb
      .put({
        TableName: "PACIENTES",
        Item: paciente,
      })
      .promise();

    return {
      statusCode: 201,
    };
  } catch (error) {
    console.log("Error " + error);
    return {
      statusCode: error.statusCode ? error.statusCode : 500,
      body: JSON.stringify({
        error: error.name ? error.name : "Exception",
        message: error.message ? error.message : "Erro desconhecido",
      }),
    };
  }
};

module.exports.atualizarPaciente = async (event) => {
  try {
    const { pacienteId } = event.pathParameters;
    const timestamp = new Date().getTime();
    let dados = JSON.parse(event.body);
    const { nome, data_nascimento, email, telefone } = dados;
    await dynamoDb
      .update({
        ...params,
        Key: { paciente_id: pacienteId },
        UpdateExpression:
          "SET nome = :nome, data_nascimento = :dt, email = :email, telefone = :telefone, atualizado_em = :atualizado_em",
        ConditionExpression: "atrribute_exists(paciente_id)",
        ExpressionAttributeValues: {
          ":nome": nome,
          ":dt": data_nascimento,
          ":email": email,
          ":telefone": telefone,
          ":atualizado_em": timestamp,
        },
      })
      .promise();

    return {
      statusCode: 204,
    };
  } catch (error) {
    console.log("Error " + error);
    return {
      statusCode: error.statusCode ? error.statusCode : 500,
      body: JSON.stringify({
        error: error.name ? error.name : "Exception",
        message: error.message ? error.message : "Erro desconhecido",
      }),
    };
  }
};

module.exports.deletarPaciente = async (event) => {
  try {
    const { pacienteId } = event.pathParameters;
    await dynamoDb
      .delete({
        ...params,
        Key: { paciente_id: pacienteId },
        ConditionExpression: "atrribute_exists(paciente_id)",
      })
      .promise();

    return {
      statusCode: 204,
    };
  } catch (error) {
    console.log("Error " + error);
    return {
      statusCode: error.statusCode ? error.statusCode : 500,
      body: JSON.stringify({
        error: error.name ? error.name : "Exception",
        message: error.message ? error.message : "Erro desconhecido",
      }),
    };
  }
};
