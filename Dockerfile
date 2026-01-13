FROM nginx:alpine

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Create required nginx directories & fix permissions
RUN mkdir -p /var/cache/nginx \
    /var/run \
    /var/log/nginx \
    && chown -R appuser:appgroup /var/cache/nginx /var/run /var/log/nginx

# Copy app files
COPY . /usr/share/nginx/html

# Fix ownership of app files
RUN chown -R appuser:appgroup /usr/share/nginx/html

# Switch to non-root user
USER appuser

EXPOSE 80
