# ec2-test

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.2.18. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

## Quick start (development)

1. Install dependencies:

```bash
bun install
```

2. Run locally (dev):

```bash
bun index.ts
```

3. Endpoints

- GET /health - basic health check
- GET /metrics - Prometheus metrics
- GET / - welcome message
- POST /echo - echoes JSON payload

## Docker / production

Build the image:

```bash
docker build -t my-app:latest .
```

Run container:

```bash
docker run -p 3000:3000 my-app:latest
```

Smoke test the running container:

```bash
curl -sS http://localhost:3000/health
```

## Jenkins pipeline

The provided `Jenkinsfile` contains stages to install dependencies (`bun install`), build a Docker image, run a smoke test against the image, and a placeholder to push to a registry. You will need to add registry credentials and adjust image tags for your environment.
