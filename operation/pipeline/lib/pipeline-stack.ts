import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Duration } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { SqsDestination } from 'aws-cdk-lib/aws-lambda-destinations';

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //const dictionary = new Map<string, action>();
    type action = { [key: string]: { [key: string]: any } };

    var actions: any = {
      initialize: {type: 'lambda', name: 'initializeFn', code: path.join(__dirname, 'lambdas', 'initialize-deployment'), functionObject: null},
      checkBackendTriggerCodeReview: {type: 'lambda', name: 'checkBackendFn', code: path.join(__dirname, 'lambdas', 'check-backend-trigger-codereview'), functionObject: null},
      success: {type: 'none'}
    }

    // failure queue
    const failureQueue = new sqs.Queue(this, 'FailureQueue');

    // order is order of steps
    var pipeline: any = [
      {status: 'INITIALIZING', action: actions.initialize, queueFlag: false },
      {status: 'DEPLOYING_BACKEND', action: actions.checkBackendTriggerCodeReview, queueFlag: true, delay: Duration.minutes(5), invisible: Duration.seconds(30), queue: null },
      {status: 'SUCCESS', action: actions.success, queueFlag: false}, 
    ]

    // create loop through pipeline using for and i as the variable to count
    for (let i = 0; i < pipeline.length; i++) {
       const item = pipeline[i];
       if (item.action.type === 'lambda') {
        item.action.functionObject = new NodejsFunction(this, item.action.name, {
          runtime: lambda.Runtime.NODEJS_20_X,
          handler: 'index.handler',
          depsLockFilePath: path.join(item.action.code, 'package-lock.json'),
          entry: path.join(item.action.code, 'index.ts'),
          timeout: Duration.seconds(30),
          onFailure: new SqsDestination(failureQueue),
          environment: {
            "currentStep": item.status, // event source
            "nextStep": pipeline[i+1].status, // putting message there
          }
        });
      }
      if(item.queueFlag) {
        pipeline[i].queue = new sqs.Queue(this, item.status+'_queue', {
          visibilityTimeout: item.invisible,
          deliveryDelay: item.delay,
        });
        (pipeline[i].queue as sqs.Queue).grantConsumeMessages(item.action.functionObject as lambda.Function);
        (item.action.functionObject as lambda.Function).addEventSource(new SqsEventSource((pipeline[i].queue as sqs.Queue)));

        console.log((pipeline[i].queue as sqs.Queue).queueUrl);

      }
    }
  }
}
