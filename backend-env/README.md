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

After the files are present, the frontend developer can run:

```sh
docker compose pull
docker compose up -d --force-recreate
```
