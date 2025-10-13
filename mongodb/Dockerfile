# Use official MongoDB image
FROM mongo:7.0

# Set environment variables
ENV MONGO_INITDB_ROOT_USERNAME=admin
ENV MONGO_INITDB_ROOT_PASSWORD=password123
ENV MONGO_INITDB_DATABASE=smartsupply-health

# Create data directory
RUN mkdir -p /data/db

# Expose port
EXPOSE 27017

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD mongosh --eval "db.runCommand('ping').ok" || exit 1

# Start MongoDB
CMD ["mongod", "--bind_ip_all"]















