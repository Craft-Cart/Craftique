# Violation 1: Using 'latest' tag (unstable, non-repeatable)
# Violation 2: Using a heavy OS (Ubuntu) instead of a slim/alpine version
FROM ubuntu:latest

# Violation 3: Running apt-get update without pinning versions
RUN apt-get update && apt-get install -y nodejs npm

WORKDIR /app
COPY . .

# Violation 4: Missing 'USER' instruction (runs as ROOT by default)
# This is a major security risk in GKE.
CMD ["npm", "start"]