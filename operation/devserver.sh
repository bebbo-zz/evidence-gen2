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

if [ "$subcommand" == "onto" ]; then
    HOST_ID=h-09bec6805c05013eb
    echo $HOST_ID

    # modify the instance placement
    aws ec2 modify-instance-placement --host-id $HOST_ID --instance-id $INSTANCE_ID --region $REGION

    # MUST BE IN SAME AZ
    # start existing instance with given INSTANCE_ID
    aws ec2 start-instances --instance-ids $INSTANCE_ID --region $REGION
    
fi

# check if subcommand is start
if [ "$subcommand" == "start" ]; then

    AWS_MAX_ATTEMPTS=4

    # create array of availability zones
    AVAILABILITY_ZONES=(us-west-2a us-west-2b us-west-2c us-west-2d)
    # loop through availability zones
    for AVAILABILITY_ZONE in "${AVAILABILITY_ZONES[@]}"; do
        echo "Checking availability zone $AVAILABILITY_ZONE..."
        echo "Allocating host..."
        HOST_ID=$(aws ec2 allocate-hosts --quantity 1 --instance-type $INSTANCE_TYPE --host-maintenance "off" --host-recovery "off" --availability-zone $AVAILABILITY_ZONE --query "HostIds[0]" --output text --region $REGION)
        if [[ $HOST_ID == *"error"* ]]; then
            break
        fi
    done
    if [ -z "$HOST_ID" ]; then
        exit
    fi

    # aws ec2 allocate-hosts --availability-zone "us-west-2a" --auto-placement "off" --host-recovery "off" --host-maintenance "off" --quantity 1 --instance-type "mac2-m2pro.metal"

    echo "Wait two minutes for host to be allocated..."
    sleep 120

    echo "Starting instance..."
    aws ec2 start-instances --instance-ids $INSTANCE_ID --host-id $HOST_ID --region $REGION

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
    # can only be done after 24 hours
    # should be able to schedule the release
    # release allocated host with HOST_ID
    echo "Releasing host..."
    aws ec2 release-hosts --host-ids $HOST_ID --region $REGION

    exit

    echo "Stopping instance..."
    aws ec2 stop-instances --instance-ids $INSTANCE_ID --region $REGION

    # list all allocated dedicated hosts
    echo "Allocated dedicated hosts:"
    aws ec2 describe-hosts --query "Hosts[*].{HostId:HostId, AvailabilityZone:AvailabilityZone, InstanceType:InstanceType}" --output table --region $REGION

fi


