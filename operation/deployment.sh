
REGION=us-west-2
BUCKET_NAME=iosdeploymentbucket-661882677539
IOS_PROJECT_NAME=EvidenceGen2

# testing or production
subcommand=$1
echo $subcommand
# check if subcommand is empty
if [ -z "$subcommand" ]; then
    exit
fi

# minor or major
upgrade=$2
echo $upgrade
if [ -z "$upgrade" ]; then
    exit
fi

# testing or production
if [ "$subcommand" == "testing" ]; then
    TARGET=testing
fi
if [ "$subcommand" == "production" ]; then
    TARGET=production
fi
echo $TARGET

rm -rf /Users/ec2-user/Documents/deployment/
mkdir /Users/ec2-user/Documents/deployment/
rm -rf /Users/ec2-user/Documents/archive/
mkdir /Users/ec2-user/Documents/archive/
rm -rf /Users/ec2-user/Documents/ipa/
mkdir /Users/ec2-user/Documents/ipa/


cd /Users/ec2-user/Documents/deployment/
# list all files in S3 folder and store URI to variable
URI=$(aws s3 ls s3://$BUCKET_NAME/$TARGET/ | awk '{print $4}')
# combine URI and file name to get full file path
FILE_PATH=s3://$BUCKET_NAME/$TARGET/$URI

# download file from S3
aws s3 cp $FILE_PATH .

# extract zip file in local folder
unzip $URI
rm $URI

# get backend config file
cd backend

# TODO: how do i handle the version on NodeJS
npm install
npx amplify generate config --stack $BACKEND --format json-mobile

# read entry from DynamoDB table
entry=$(aws dynamodb get-item --table-name deployments --key '{"id":{"S":"current"}}' --region $REGION)
echo $entry

# extract value from entry
MAJOR=$(echo $entry | jq -r '.Item.testing.M.major.S')
echo $MAJOR

MINOR=$(echo $entry | jq -r '.Item.testing.M.minor.S')
echo $MINOR

BACKEND=$(echo $entry | jq -r '.Item.testing.M.backend.S')
echo $BACKEND

    # if upgrade flag is set, increment MINOR version
    if [ "$upgrade" == "minor" ]; then
        MINOR=$((MINOR+1))
        echo $MINOR
        
        # update DynamoDB table
        aws dynamodb update-item --table-name deployments --key '{"id":{"S":"current"}}' --update-expression "SET testing.minor = :newversion" --expression-attribute-values '{":newversion":{"S":"'$MINOR'"}}' --region $REGION
    fi

    if [ "$upgrade" == "major" ]; then
        MAJOR=$((MAJOR+1))
        echo $MAJOR
        MINOR=0
        echo $MINOR
        # update DynamoDB table
        aws dynamodb update-item --table-name deployments --key '{"id":{"S":"current"}}' --update-expression "SET testing.major = :newversion, testing.minor = :newminor" --expression-attribute-values '{":newversion":{"S":"'$MAJOR'"}, ":newminor":{"S":"0"}}' --region $REGION
    fi

# combine MAJOR and MINOR to a new string variable
VERSION=$MAJOR.$MINOR
echo $VERSION

# move file on S3 to archive folder
aws s3 mv $FILE_PATH s3://$BUCKET_NAME/source-archive/$VERSION.zip

cd /Users/ec2-user/Documents/deployment/frontend

APPFILE=$1
set -euo pipefail

# retrieve value from AWS Secrets Manager
secret_name=deploymentkey
secret_value=$(aws secretsmanager get-secret-value --secret-id $secret_name --region $REGION | jq -r '.SecretString')
echo $secret_value
KEYID=$(echo $secret_value | jq -r '.KEYID')
echo $KEYID
ISSUERID=$(echo $secret_value | jq -r '.ISSUERID')
echo $ISSUERID




