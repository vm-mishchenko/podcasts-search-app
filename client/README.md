# Web app to search across podcasts

Demo: https://podcasts-search-app-b4lxkp5rjq-uc.a.run.app

## Local development
```shell
# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
http://localhost:3000
```

**Environment variables**
```shell
MONGODB_USER
MONGODB_PASSWORD
MONGODB_CLUSTER
```

**Build image**
```shell
# Build amd64 image. GCP doesn't support ARM images yet.
docker build --platform=linux/amd64 --tag gcr.io/podcasts-search-project/podcasts-search-app:latest .

# Run image locally
docker run --init \
--publish 3000:3000 \
--env MONGODB_CLUSTER=xxx \
--env MONGODB_USER=xxx \
--env MONGODB_PASSWORD=xxx \
gcr.io/podcasts-search-project/podcasts-search-app:latest
```

## Deploy

Deploy image to GCP Cloud Run.
```shell
# Upload image to GCP
docker push gcr.io/podcasts-search-project/podcasts-search-app:latest

# Deploy image to GCP Cloud Run (0 instances when no requests)
gcloud beta run deploy podcasts-search-app \
--image=gcr.io/podcasts-search-project/podcasts-search-app:latest \
--allow-unauthenticated \
--port=3000 \
--min-instances=0 \
--max-instances=1 \
--platform=managed \
--region=us-central1 \
--memory=512Mi \
--project=podcasts-search-project \
--set-env-vars "MONGODB_CLUSTER=xxx" \
--set-env-vars "MONGODB_USER=xxx" \
--set-env-vars "MONGODB_PASSWORD=xxx"
```
