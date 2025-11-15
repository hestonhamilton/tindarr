# Reverse Proxy Configuration

Running Tindarr behind an existing HTTP reverse proxy lets you reuse TLS certificates and expose a single domain. The frontend and backend both speak HTTP/WebSocket, so any modern proxy (Nginx, Caddy, Traefik, HAProxy, Apache) works once headers are configured.

## Requirements

- The server must know the public origin for CORS/WebSocket (`FRONTEND_ORIGIN` env var).
- WebSocket upgrade headers (`Upgrade`, `Connection`) must be forwarded for Socket.IO to function.
- If you host the client on a subpath, configure Vite’s `base` and ensure the server rewrites requests accordingly.

## Nginx (subdomain)

Serve both the API and client through the same Nginx instance:

```nginx
server {
  listen 80;
  server_name tindarr.example.com;

  location / {
    proxy_pass http://127.0.0.1:5173/;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }

  location /socket.io/ {
    proxy_pass http://127.0.0.1:3001/socket.io/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_set_header Host $host;
  }
}
```

In this configuration the Vite client handles API calls via `VITE_BACKEND_URL=https://tindarr.example.com`, and the proxy routes `/socket.io` to the server. If you host the built client statically, point `proxy_pass` to the Node server instead.

## Traefik example

```yaml
http:
  routers:
    tindarr:
      rule: Host(`tindarr.example.com`)
      entryPoints: ["websecure"]
      service: tindarr
      tls:
        certResolver: letsencrypt
  services:
    tindarr:
      loadBalancer:
        servers:
          - url: http://tindarr-server:3001
```

Traefik automatically forwards WebSocket headers. Point Vite’s `VITE_BACKEND_URL` at `https://tindarr.example.com`.

## Apache

```apache
<VirtualHost *:80>
  ServerName tindarr.example.com

  ProxyPreserveHost On
  ProxyPass /socket.io/ http://127.0.0.1:3001/socket.io/
  ProxyPassReverse /socket.io/ http://127.0.0.1:3001/socket.io/

  RewriteEngine On
  RewriteCond %{HTTP:Upgrade} websocket [NC]
  RewriteCond %{HTTP:Connection} upgrade [NC]
  RewriteRule ^/socket.io/(.*)$ ws://127.0.0.1:3001/socket.io/$1 [P,L]

  ProxyPass / http://127.0.0.1:5173/
  ProxyPassReverse / http://127.0.0.1:5173/
</VirtualHost>
```

## Tips

- Set `FRONTEND_ORIGIN` on the server to the exact HTTPS origin to avoid CORS/socket issues.
- If you terminate TLS at the proxy, you may still proxy plain HTTP to the containers.
- For subpath hosting, ensure your proxy rewrites request paths consistently and that client assets are built with the correct `base` path.
