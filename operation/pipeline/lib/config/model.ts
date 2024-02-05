import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Duration } from 'aws-cdk-lib';
import { Queue } from 'aws-cdk-lib/aws-sqs';

export type Action = {
    type: string
    name: string
    code: string
    function: NodejsFunction
  }

export type Step = {
    status: string
    action: Action | undefined
    queueFlag: boolean
    delay?: Duration
    invisible?: Duration
    queue: Queue
  }