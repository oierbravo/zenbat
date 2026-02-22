# Zenbat

> by: Ezarri 2000

Inventory and manufacturing (MRP) application. **API server** (Node/Express) and **React frontend** (Vite) run as separate packages.

## Documentation

All documentation is in the **[`docs/`](docs/)** folder:

- **[Documentation index](docs/index.md)** – Full list of docs with links.
- **[Summary](docs/SUMMARY.md)** – Repo structure, how to start server and client.
- **[Server](docs/server.md)** – API server: start, data path, CORS.
- **[HOWTO](docs/HOWTO.md)** – Clone, install, configure data, run (legacy/grunt flow).

## Quick start (current setup)

```bash
npm install --legacy-peer-deps
```

- **API only** (port 3000): `npm run dev:server`
- **Frontend only** (port 5173): `npm run dev:client`
- **Both:** `npm run dev`

Data path: default `server/data/`. Override with `ZENBAT_DATA_PATH=../data` (or absolute path) when starting the server.

## Credits

Based on [MeanJS](http://meanjs.org).  
Inspired by the work of [Madhusudhan Srinivasa](https://github.com/madhums/).  
The MEAN name was coined by [Valeri Karpov](http://blog.mongodb.org/post/49262866911/the-mean-stack-mongodb-expressjs-angularjs-and).

## License

[MIT](docs/LICENSE.md)
