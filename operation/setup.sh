REGION=us-west-2

# create new secret in AWS Secrets Manager with two key value pairs
aws secretsmanager create-secret --name "appstoreconnectkeymeta" --secret-string '{"KEYID":"...","ISSUERID":"..."}' --region $REGION
 
aws secretsmanager create-secret --name appstoreconnectkeyfile --secret-binary fileb://~/Downloads/....p8 --region $REGION


