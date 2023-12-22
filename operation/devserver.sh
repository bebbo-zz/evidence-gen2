#!/bin/bash

# read configs
. ~/.dev/mac_config

# read first parameter of command
subcommand=$1
echo $subcommand

# check if subcommand is empty
if [ -z "$subcommand" ]; then
    exit
fi

# check if subcommand is start
if [ "$subcommand" == "start" ]; then
    echo "Starting instance..."
    aws ec2 start-instances --instance-ids $INSTANCE_ID --region $REGION

    while true; do
        INSTANCE_STATE=$(aws ec2 describe-instances --instance-ids $INSTANCE_ID --query "Reservations[*].Instances[*].State.Name" --output text --region $REGION)

        if [ "$INSTANCE_STATE" == "running" ]; then
            break
        else
            echo "Waiting for instance to start..."
            sleep 5
        fi
    done

    echo "Instance is running!"

    # get public DNS from EC2 instance
    INSTANCE_DNS=$(aws ec2 describe-instances --instance-ids $INSTANCE_ID --query "Reservations[*].Instances[*].PublicDnsName" --output text --region $REGION)

    echo "Connecting to instance..."
    sleep 300
    ssh -L 5900:localhost:5900 -i $INSTANCE_KEY_PATH ec2-user@$INSTANCE_DNS


fi

# check if subcommand is stop
if [ "$subcommand" == "stop" ]; then
    echo "Stopping instance..."
    aws ec2 stop-instances --instance-ids $INSTANCE_ID --region $REGION
fi


