FROM nginxinc/nginx-unprivileged:alpine

# Copy static site files
COPY . /usr/share/nginx/html

# Expose non-root nginx port
EXPOSE 8091
