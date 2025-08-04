FROM ubuntu:22.04

# Install system dependencies and LaTeX
RUN apt-get update && apt-get install -y \
    texlive-full \
    texlive-latex-extra \
    texlive-fonts-recommended \
    texlive-science \
    texlive-publishers \
    biber \
    latexmk \
    pandoc \
    python3 \
    python3-pip \
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy LaTeX templates and scripts
COPY . .

# Create output directory
RUN mkdir -p /app/output

# Expose port (if needed for API)
EXPOSE 8000

# Default command
CMD ["bash"] 