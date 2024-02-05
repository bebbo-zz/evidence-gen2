/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { QueryCommand, PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import * as uuid from 'uuid';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const sqsClient = new SQSClient({});

export const handler = async (event: any, context: any) => {
    console.log(event);

    /**
     * CUSTOM BEGIN - START
     */
    var current = "INITIALIZATION"
    var next = "BACKEND_DEPLOYMENT"

    // generate a random hash 

    const deploymentId = uuid.v4()
    /**
     * CUSTOM BEGIN - END
     */

    /**
     * COMMON BEGIN - START
     */
    // get environment variables
    console.log(process.env.AWS_EXECUTION_ENV);
    if(process.env.AWS_EXECUTION_ENV === undefined) {
      // status variables stay unchanged for local deployment
    }else{
      current = process.env.currentStep === undefined ? "" : process.env.currentStep
      next = process.env.nextStep === undefined ? "" : process.env.nextStep
    }

    // Log entry
    var putCommand = new PutCommand({
      TableName: "pipelinevault",
      Item: {
        "type": "log",
        "id": uuid.v4(),
        "message": current + " started" 
      },
    });
    // await docClient.send(putCommand);
    docClient.send(putCommand);

    // get next queue
    var queryCommand = new QueryCommand({
      TableName: "pipelinevault",
      KeyConditionExpression:
          "type = :type AND id = :id",
      ExpressionAttributeValues: {
          ":type": "queue",
          ":id": next
      },
      ConsistentRead: true,
    });
    var response = await docClient.send(queryCommand);
    console.log(response);

    // get specific value as string from response
    if (response.Items === undefined) {
      return error("No queue found");
    }else{
      var nextQueueURL = response.Items[0].url;
    }

    /**
     * COMMON BEGIN - END
     */

    /**
     * ACTION START
     */
    // check
    var checkResult = true;

    // check success
    if (checkResult) {
      // NEXT ACTION
    }

    // check failed
    if (!checkResult) {
      // resend message to current queue
    }

    const messageBody = {
      currentQueueURL: nextQueueURL,
      deploymentId: deploymentId
    }
    /**
     * ACTION END
     */

    /**
     * SUBMIT MESSAGE
     */
    const sqsParams = {
      QueueUrl: nextQueueURL,
      MessageBody: JSON.stringify(messageBody)
    }
    sqsClient.send(new SendMessageCommand(sqsParams));

    try {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Headers' : 'Content-Type',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': '*'
        },
        //body: JSON.stringify(response),
      };
    } catch (err: any) {
      return error(err.message);
    }
  };
  
  const error = (errMessage?: string) => {
    return {
      statusCode: 400 as const,
      headers: {
        'Access-Control-Allow-Headers' : 'Content-Type',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': '*'
      },
      body: {
        errorMessage: `Error fetching Device models: ${errMessage}`,
      },
    };
  };
  