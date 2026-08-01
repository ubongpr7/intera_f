# Backend Runtime Env

This folder is for the backend containers used by the frontend-only local stack.

Keep real `*.env` files out of Git. They contain database URLs, JWT keys, email credentials, and storage credentials. Share them only through a secure channel.

Required runtime files:

- `users.env`
- `inventory.env`
- `products.env`
- `pos.env`
- `subscriptions.env`
- `audit.env`
- `notification.env`
- `ka2a.env`

`ka2a.env` is required for the agent setup page. It should contain the KA2A
database URL, JWT public key string, Fernet key(s), and subscription service key
needed by the gateway/control-plane runtime. Do not bake these values into
Docker images.

After the files are present, the frontend developer can run:

```sh
docker compose pull
docker compose up -d --force-recreate
```
