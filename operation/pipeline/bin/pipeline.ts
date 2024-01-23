#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PipelineStack } from '../lib/pipeline-stack';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const app = new cdk.App();

const a = async () => {
  /*new EvidenceBackendStack(app, 'EvidenceBackendStack', {
    ledgerName: 'vault',
    vaultTableName: 'dynamovault', 
    reportTableName: 'dynamoreport',
    env: { account: accNumber, region: accRegion },
  }); */

  const client = new DynamoDBClient({});
  const docClient = DynamoDBDocumentClient.from(client);

  new PipelineStack(app, 'PipelineStack', {
    // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  
    /* Uncomment the next line if you know exactly what Account and Region you
     * want to deploy the stack to. */
    //env: { account: '123456789012', region: 'us-east-1' },
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-west-2' },
  
    /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
  });

}

a();