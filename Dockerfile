FROM nginx:alpine

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy app files
COPY . /usr/share/nginx/html

# Fix permissions
RUN chown -R appuser:appgroup \
    /usr/share/nginx \
    /var/cache/nginx \
    /var/log/nginx \
    /tmp

# Switch to non-root
USER appuser

EXPOSE 80
