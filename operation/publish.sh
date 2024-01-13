
# retrieve value from AWS Secrets Manager
REGION=us-west-2
secret_name=appstoreconnectkeymeta
secret_value=$(aws secretsmanager get-secret-value --secret-id $secret_name --region $REGION | jq -r '.SecretString')
echo $secret_value
export KEYID=$(echo $secret_value | jq -r '.KEYID')
echo $KEYID
export ISSUERID=$(echo $secret_value | jq -r '.ISSUERID')
echo $ISSUERID

# retrieve binary value from AWS Secrets Manager and write it to a p8 file
secret_name=appstoreconnectkeyfile
secret_value=$(aws secretsmanager get-secret-value --secret-id $secret_name --region $REGION | jq -r '.SecretString')
# write secret value to p8 file
echo $secret_value > private-key.p8

export EXPIRATION=$(($(date +%s) + 1800)) # 30 minutes from now

export JWT_HEADER='{"alg": "ES256", "kid": "'$API_KEY_ID'"}'
export JWT_PAYLOAD='{"iss": "'$ISSUER_ID'", "exp": '$EXPIRATION'}'

export JWT=$(echo -n $JWT_HEADER.$JWT_PAYLOAD | openssl dgst -binary -sha256 -sign private-key.p8 | openssl base64 | tr '+/' '-_' | tr -d '=')

curl -X GET "https://api.appstoreconnect.apple.com/v1/me" \
-H "Authorization: Bearer $JWT"


VERSION="1.0"
BUCKET_NAME=iosdeploymentbucket-661882677539
#aws s3 cp $ipa_path s3://$BUCKET_NAME/ipa-archive/$VERSION/ --recursive


#xcrun altool --validate-app --type ios --file "$ipa_path/$IOS_PROJECT_NAME.ipa" --apiKey $KEYID --apiIssuer $ISSUERID

#xcrun altool --upload-app --type ios --file "$ipa_path/$IOS_PROJECT_NAME.ipa" --apiKey $KEYID --apiIssuer $ISSUERID

# move file on S3 to archive folder
# should only backup after changes
#aws s3 mv $FILE_PATH s3://$BUCKET_NAME/source-archive/$VERSION.zip